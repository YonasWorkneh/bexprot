import { supabase } from './supabase';
import type { DepositAddress, CryptoDeposit } from './depositAddresses';
import { DEPOSIT_ADDRESSES } from './depositAddresses';

/**
 * Generate unique deposit code
 */
export function generateDepositCode(currency: string): string {
  const prefix = 'DEP';
  const currencyCode = currency.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${currencyCode}-${randomPart}`;
}

/**
 * Get blockchain explorer URL for transaction
 */
export function getExplorerUrl(currency: string, txHash: string): string {
  const config = DEPOSIT_ADDRESSES[currency as keyof typeof DEPOSIT_ADDRESSES];
  if (!config) return '';

  // Adjust explorer URL for transaction hash
  const explorerBase = config.explorerUrl.replace('/address/', '/tx/');
  return `${explorerBase}${txHash}`;
}

/**
 * Fetch all active deposit addresses
 */
export async function getDepositAddresses(): Promise<{ success: boolean; data?: DepositAddress[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('crypto_deposit_addresses')
      .select('*')
      .eq('is_active', true)
      .order('currency');

    if (error) throw error;

    return {
      success: true,
      data: data.map(addr => ({
        id: addr.id,
        currency: addr.currency,
        address: addr.address,
        network: addr.network,
        networkSymbol: addr.network_symbol,
        minDeposit: parseFloat(addr.min_deposit),
        isActive: addr.is_active,
      })),
    };
  } catch (error: any) {
    console.error('Error fetching deposit addresses:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's deposit history with pagination
 */
export async function getUserDeposits(
  userId: string,
  options?: { page?: number; limit?: number; status?: string }
): Promise<{ success: boolean; data?: CryptoDeposit[]; total?: number; error?: string }> {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 15;
    const offset = (page - 1) * limit;

    // Handle debit filter differently (requires fetching all and filtering)
    if (options?.status === 'debit') {
      // Fetch all deposits and filter for debits, then paginate in memory
      const { data: allData, error } = await supabase
      .from('crypto_deposits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

      const debitDeposits = (allData || [])
        .filter(d => parseFloat(d.amount) < 0)
        .map(deposit => ({
          id: deposit.id,
          userId: deposit.user_id,
          depositCode: deposit.deposit_code,
          currency: deposit.currency,
          depositAddress: deposit.deposit_address,
          transactionHash: deposit.transaction_hash,
          userReportedAmount: deposit.user_reported_amount ? parseFloat(deposit.user_reported_amount) : undefined,
          adminVerifiedAmount: deposit.admin_verified_amount ? parseFloat(deposit.admin_verified_amount) : undefined,
          amount: parseFloat(deposit.amount),
          amountUsd: parseFloat(deposit.amount_usd),
          status: deposit.status,
          confirmations: deposit.confirmations,
          blockchainExplorerUrl: deposit.blockchain_explorer_url,
          notes: deposit.notes,
          verificationNotes: deposit.verification_notes,
          reportedAt: deposit.reported_at,
          verifiedAt: deposit.verified_at,
          creditedAt: deposit.credited_at,
          verifiedBy: deposit.verified_by,
          createdAt: deposit.created_at,
          updatedAt: deposit.updated_at,
          screenshotUrl: deposit.screenshot_url,
        }));

      const totalCount = debitDeposits.length;
      const paginatedDeposits = debitDeposits.slice(offset, offset + limit);

    return {
      success: true,
        data: paginatedDeposits,
        total: totalCount,
      };
    }

    // For other filters, use database-level pagination
    // First, get total count
    let countQuery = supabase
      .from('crypto_deposits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (options?.status && options.status !== 'all') {
      countQuery = countQuery.eq('status', options.status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    // Then, get paginated data
    let query = supabase
      .from('crypto_deposits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    const deposits = (data || []).map(deposit => ({
        id: deposit.id,
        userId: deposit.user_id,
        depositCode: deposit.deposit_code,
        currency: deposit.currency,
        depositAddress: deposit.deposit_address,
        transactionHash: deposit.transaction_hash,
        userReportedAmount: deposit.user_reported_amount ? parseFloat(deposit.user_reported_amount) : undefined,
        adminVerifiedAmount: deposit.admin_verified_amount ? parseFloat(deposit.admin_verified_amount) : undefined,
        amount: parseFloat(deposit.amount),
        amountUsd: parseFloat(deposit.amount_usd),
        status: deposit.status,
        confirmations: deposit.confirmations,
        blockchainExplorerUrl: deposit.blockchain_explorer_url,
        notes: deposit.notes,
        verificationNotes: deposit.verification_notes,
        reportedAt: deposit.reported_at,
        verifiedAt: deposit.verified_at,
        creditedAt: deposit.credited_at,
        verifiedBy: deposit.verified_by,
        createdAt: deposit.created_at,
        updatedAt: deposit.updated_at,
        screenshotUrl: deposit.screenshot_url,
    }));

    return {
      success: true,
      data: deposits,
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error fetching user deposits:', error);
    return { success: false, error: error.message };
  }
}

/**
 * User reports a deposit
 */
export async function reportDeposit(
  userId: string,
  currency: string,
  transactionHash: string,
  userReportedAmount: number,
  amountUsd: number,
  depositAddress: string,
  screenshotUrl?: string
): Promise<{ success: boolean; data?: CryptoDeposit; depositCode?: string; error?: string }> {
  try {
    // Check if transaction hash already exists (skip check for placeholder hashes)
    if (transactionHash && !transactionHash.startsWith('pending_')) {
    const { data: existing } = await supabase
      .from('crypto_deposits')
      .select('id')
      .eq('transaction_hash', transactionHash)
      .maybeSingle();

    console.log('[Deposit Service] Duplicate check result:', existing ? 'DUPLICATE FOUND' : 'NO DUPLICATE');
    if (existing) {
      console.error('[Deposit Service] Transaction hash already exists:', transactionHash);
      return { success: false, error: 'This transaction has already been reported' };
      }
    }

    // Generate unique deposit code
    const depositCode = generateDepositCode(currency);
    // Only generate explorer URL if transaction hash is provided (not a placeholder)
    const explorerUrl = transactionHash && !transactionHash.startsWith('pending_') 
      ? getExplorerUrl(currency, transactionHash) 
      : null;
    console.log('[Deposit Service] Generated deposit code:', depositCode);

    console.log('[Deposit Service] Inserting deposit record:', {
      user_id: userId,
      deposit_code: depositCode,
      currency,
      deposit_address: depositAddress,
      transaction_hash: transactionHash,
      amount: userReportedAmount,
      status: 'reported'
    });

    const { data, error } = await supabase
      .from('crypto_deposits')
      .insert({
        user_id: userId,
        deposit_code: depositCode,
        currency,
        deposit_address: depositAddress,
        transaction_hash: transactionHash,
        user_reported_amount: userReportedAmount,
        amount: userReportedAmount, // Initially set amount to what user reported
        amount_usd: amountUsd,
        status: 'reported',
        blockchain_explorer_url: explorerUrl,
        reported_at: new Date().toISOString(),
        screenshot_url: screenshotUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('[Deposit Service] Insert FAILED:', error);
      console.error('[Deposit Service] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('[Deposit Service] Insert SUCCESS:', data);

    // --- UNIFICATION FIX: No need to sync to 'deposits' as 'crypto_deposits' is the source of truth ---
    // The Admin Panel now reads from 'crypto_deposits' directly.
    // ------------------------------------------------------------------------------------------

    return {
      success: true,
      depositCode,
      data: {
        id: data.id,
        userId: data.user_id,
        currency: data.currency,
        depositAddress: data.deposit_address,
        transactionHash: data.transaction_hash,
        amount: parseFloat(data.amount),
        amountUsd: parseFloat(data.amount_usd),
        status: data.status,
        confirmations: data.confirmations,
        notes: data.notes,
        creditedAt: data.credited_at,
        verifiedBy: data.verified_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error: any) {
    console.error('[Deposit Service] ERROR:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new deposit record (user reports a deposit)
 */
export async function createDepositRecord(
  userId: string,
  currency: string,
  amount: number,
  amountUsd: number,
  depositAddress: string,
  transactionHash?: string
): Promise<{ success: boolean; data?: CryptoDeposit; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('crypto_deposits')
      .insert({
        user_id: userId,
        currency,
        deposit_address: depositAddress,
        transaction_hash: transactionHash,
        amount,
        amount_usd: amountUsd,
        status: 'pending',
        confirmations: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        currency: data.currency,
        depositAddress: data.deposit_address,
        transactionHash: data.transaction_hash,
        amount: parseFloat(data.amount),
        amountUsd: parseFloat(data.amount_usd),
        status: data.status,
        confirmations: data.confirmations,
        notes: data.notes,
        creditedAt: data.credited_at,
        verifiedBy: data.verified_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (error: any) {
    console.error('Error creating deposit record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Admin verifies and updates deposit
 */
export async function verifyDeposit(
  depositId: string,
  adminId: string,
  verifiedAmount: number,
  verifiedAmountUsd: number,
  confirmations: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update the deposit with verified information
    const { error } = await supabase
      .from('crypto_deposits')
      .update({
        admin_verified_amount: verifiedAmount,
        amount: verifiedAmount,
        amount_usd: verifiedAmountUsd,
        status: 'confirmed',
        confirmations,
        verification_notes: notes,
        verified_at: new Date().toISOString(),
        verified_by: adminId,
      })
      .eq('id', depositId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error verifying deposit:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all deposits (admin only)
 */
export async function getAllDeposits(status?: string): Promise<{ success: boolean; data?: CryptoDeposit[]; error?: string }> {
  try {
    let query = supabase
      .from('crypto_deposits')
      .select('*, user:users!user_id(name, email)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data.map(deposit => ({
        id: deposit.id,
        userId: deposit.user_id,
        user: deposit.user ? {
          name: deposit.user.name,
          email: deposit.user.email
        } : undefined,
        depositCode: deposit.deposit_code,
        currency: deposit.currency,
        depositAddress: deposit.deposit_address,
        transactionHash: deposit.transaction_hash,
        userReportedAmount: deposit.user_reported_amount ? parseFloat(deposit.user_reported_amount) : undefined,
        adminVerifiedAmount: deposit.admin_verified_amount ? parseFloat(deposit.admin_verified_amount) : undefined,
        amount: parseFloat(deposit.amount),
        amountUsd: parseFloat(deposit.amount_usd),
        status: deposit.status,
        confirmations: deposit.confirmations,
        blockchainExplorerUrl: deposit.blockchain_explorer_url,
        notes: deposit.notes,
        verificationNotes: deposit.verification_notes,
        reportedAt: deposit.reported_at,
        verifiedAt: deposit.verified_at,
        creditedAt: deposit.credited_at,
        verifiedBy: deposit.verified_by,
        createdAt: deposit.created_at,
        updatedAt: deposit.updated_at,
        screenshotUrl: deposit.screenshot_url,
      })),
    };
  } catch (error: any) {
    console.error('Error fetching all deposits:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update deposit status and credit user account (admin only)
 * Uses server-side RPC for atomicity and security
 */
export async function creditUserDeposit(
  depositId: string,
  adminId: string,
  confirmations: number,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('admin_approve_deposit', {
      target_deposit_id: depositId,
      admin_user_id: adminId
    });

    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to approve deposit');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error crediting deposit:', error);
    return { success: false, error: error.message || 'Failed to credit deposit' };
  }
}

/**
 * Reject a deposit (admin only)
 * Uses server-side RPC
 */
export async function rejectDeposit(
  depositId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('admin_reject_deposit', {
      target_deposit_id: depositId,
      admin_user_id: adminId,
      rejection_reason: reason
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.error || 'Failed to reject deposit');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting deposit:', error);
    return { success: false, error: error.message };
  }
}
