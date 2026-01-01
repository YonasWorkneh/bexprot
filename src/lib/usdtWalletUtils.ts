/**
 * Custom USDT Wallet Utilities
 * Provides functionality for managing custom USDT wallets
 */

import { supabase } from "./supabase";
import { DEPOSIT_ADDRESSES, type CryptoCurrency } from "./depositAddresses";

// Legacy network name mapping (for backward compatibility with old database entries)
export const LEGACY_NETWORK_MAP: Record<string, Network> = {
  ethereum: "ETH",
  bsc: "BNB",
  polygon: "USDT_TRC20", // Map old polygon to USDT_TRC20
  tron: "USDT_TRC20",
};

// Network configurations - now supports all cryptocurrencies
export const NETWORKS = {
  BTC: {
    name: "Bitcoin",
    symbol: "BTC",
    decimals: 8,
    fee: 0.0001,
    address: DEPOSIT_ADDRESSES.BTC.address,
  },
  USDT_TRC20: {
    name: "Tron (TRC20)",
    symbol: "USDT",
    decimals: 6,
    fee: 1,
    address: DEPOSIT_ADDRESSES.USDT_TRC20.address,
  },
  SOL: {
    name: "Solana",
    symbol: "SOL",
    decimals: 9,
    fee: 0.000005,
    address: DEPOSIT_ADDRESSES.SOL.address,
  },
  XRP: {
    name: "XRP Ledger",
    symbol: "XRP",
    decimals: 6,
    fee: 0.00001,
    address: DEPOSIT_ADDRESSES.XRP.address,
  },
  LTC: {
    name: "Litecoin",
    symbol: "LTC",
    decimals: 8,
    fee: 0.001,
    address: DEPOSIT_ADDRESSES.LTC.address,
  },
  BNB: {
    name: "BNB Smart Chain",
    symbol: "BNB",
    decimals: 18,
    fee: 0.0001,
    address: DEPOSIT_ADDRESSES.BNB.address,
  },
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    fee: 0.001,
    address: DEPOSIT_ADDRESSES.ETH.address,
  },
  USDC_ERC20: {
    name: "Ethereum (ERC20)",
    symbol: "USDC",
    decimals: 6,
    fee: 1,
    address: DEPOSIT_ADDRESSES.USDC_ERC20.address,
  },
};

export type Network = keyof typeof NETWORKS;

/**
 * Get network configuration with backward compatibility
 */
export function getNetworkConfig(
  networkName: string
): (typeof NETWORKS)[Network] | null {
  const normalized = normalizeNetworkName(networkName);
  return NETWORKS[normalized] || null;
}

export interface USDTWallet {
  id: string;
  user_id: string;
  address: string;
  network: Network;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface USDTTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: "deposit" | "withdrawal" | "send" | "receive";
  amount: number;
  fee: number;
  network: Network;
  to_address?: string;
  from_address?: string;
  transaction_hash?: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

/**
 * Normalize network name (convert legacy names to new names)
 */
export function normalizeNetworkName(networkName: string): Network {
  const normalizedInput = networkName.toLowerCase().trim();

  // 1. Check if it's already a new network name (check uppercase match)
  const upperInput = networkName.toUpperCase().trim();
  if (upperInput in NETWORKS) {
    return upperInput as Network;
  }

  // 2. Check if it matches a legacy mapping (lowercase)
  if (normalizedInput in LEGACY_NETWORK_MAP) {
    return LEGACY_NETWORK_MAP[normalizedInput];
  }

  // Handle TRC20 specifically
  if (normalizedInput === "trc20") {
    return "USDT_TRC20";
  }

  // Handle ERC20/USDC specifically
  if (normalizedInput === "erc20" || normalizedInput === "usdc") {
    return "USDC_ERC20";
  }

  // Handle INTERNAL (treat as USDT_TRC20 or a special internal type if needed, for now map to USDT_TRC20 to avoid errors)
  if (normalizedInput === "internal") {
    return "USDT_TRC20";
  }

  // 3. Fallback: try to find by name in the NETWORKS object
  for (const [key, config] of Object.entries(NETWORKS)) {
    if (
      config.name.toLowerCase() === normalizedInput ||
      key.toLowerCase() === normalizedInput
    ) {
      return key as Network;
    }
  }

  // Default to USDT_TRC20 if unknown
  console.warn(
    `Unknown network name: ${networkName}, defaulting to USDT_TRC20`
  );
  return "USDT_TRC20";
}

/**
 * Generate a wallet address (returns the real deposit address for the network)
 */
export function generateWalletAddress(network: string, userId: string): string {
  const normalized = normalizeNetworkName(network);
  // Return the real deposit address for this network
  return NETWORKS[normalized].address;
}

/**
 * Validate wallet address format
 */
export function validateAddress(address: string, network: string): boolean {
  const normalizedNetwork = normalizeNetworkName(network);
  const patterns: Record<Network, RegExp> = {
    BTC: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    USDT_TRC20: /^T[a-zA-Z0-9]{33}$/,
    SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    XRP: /^r[a-zA-Z0-9]{24,34}$/,
    LTC: /^(ltc1|[LM3])[a-zA-Z0-9]{26,42}$/,
    BNB: /^0x[a-fA-F0-9]{40}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    USDC_ERC20: /^0x[a-fA-F0-9]{40}$/,
  };

  const pattern = patterns[normalizedNetwork];
  if (!pattern) {
    console.warn(
      `No validation pattern found for network: ${normalizedNetwork}`
    );
    return true; // Fallback to allowing the address if no pattern is found
  }

  return pattern.test(address);
}

/**
 * Format USDT amount
 */
export function formatUSDT(amount: number, decimals: number = 2): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Calculate transaction fee
 */
export function calculateFee(networkName: string, amount: number): number {
  const normalizedNetwork = normalizeNetworkName(networkName);
  const config = NETWORKS[normalizedNetwork];

  if (!config) {
    console.warn(
      `No config found for normalized network: ${normalizedNetwork}`
    );
    return 1.0; // Default fallback fee
  }

  return config.fee;
}

/**
 * Get wallet balance from database
 */
export async function getWalletBalance(
  userId: string,
  network: Network
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("usdt_wallets")
      .select("balance")
      .eq("user_id", userId)
      .eq("network", normalizeNetworkName(network))
      .single();

    if (error) throw error;
    return data?.balance || 0;
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return 0;
  }
}

/**
 * Create a new USDT wallet for user
 */
export async function createUSDTWallet(
  userId: string,
  network: Network
): Promise<USDTWallet | null> {
  try {
    const address = generateWalletAddress(network, userId);

    const { data, error } = await supabase
      .from("usdt_wallets")
      .insert({
        user_id: userId,
        address,
        network: normalizeNetworkName(network),
        balance: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating USDT wallet:", error);
    return null;
  }
}

/**
 * Get credited deposits from crypto_deposits table
 */
export async function getCreditedDeposits(
  userId: string
): Promise<USDTWallet[]> {
  try {
    const { data, error } = await supabase
      .from("crypto_deposits")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "credited")
      .order("credited_at", { ascending: false });

    if (error) throw error;

    // Transform credited deposits into wallet-like objects
    const depositWallets: USDTWallet[] = (data || []).map((deposit) => {
      // Map currency to network
      const currency = deposit.currency as string;
      const normalizedNetwork = normalizeNetworkName(currency);

      return {
        id: deposit.id,
        user_id: deposit.user_id,
        address: deposit.deposit_address || "",
        network: normalizedNetwork,
        balance: Number(deposit.amount || 0),
        created_at:
          deposit.created_at || deposit.credited_at || new Date().toISOString(),
        updated_at:
          deposit.updated_at || deposit.credited_at || new Date().toISOString(),
      };
    });

    return depositWallets;
  } catch (error) {
    console.error("Error fetching credited deposits:", error);
    return [];
  }
}

/**
 * Get user's USDT wallets
 */
export async function getUserWallets(userId: string): Promise<USDTWallet[]> {
  try {
    const { data, error } = await supabase
      .from("usdt_wallets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Normalize network names in returned data
    return (data || []).map((wallet) => ({
      ...wallet,
      network: normalizeNetworkName(wallet.network),
    }));
  } catch (error) {
    console.error("Error fetching user wallets:", error);
    return [];
  }
}

/**
 * Get all user wallets including credited deposits
 */
export async function getAllUserWallets(userId: string): Promise<USDTWallet[]> {
  try {
    // Fetch both regular wallets and credited deposits
    const [regularWallets, depositWallets] = await Promise.all([
      getUserWallets(userId),
      getCreditedDeposits(userId),
    ]);

    // Combine and deduplicate by network
    // If both exist for same network, prefer the one with higher balance
    const walletsByNetwork = new Map<string, USDTWallet>();

    // Add regular wallets first
    regularWallets.forEach((wallet) => {
      const normalizedNetwork = wallet.network.toUpperCase();
      const existing = walletsByNetwork.get(normalizedNetwork);
      if (!existing || wallet.balance > existing.balance) {
        walletsByNetwork.set(normalizedNetwork, wallet);
      }
    });

    // Add deposit wallets, merging balances if network already exists
    depositWallets.forEach((depositWallet) => {
      const normalizedNetwork = depositWallet.network.toUpperCase();
      const existing = walletsByNetwork.get(normalizedNetwork);

      if (existing) {
        // Merge balances if same network
        existing.balance = existing.balance + depositWallet.balance;
      } else {
        // Add new wallet from deposit
        walletsByNetwork.set(normalizedNetwork, depositWallet);
      }
    });

    return Array.from(walletsByNetwork.values());
  } catch (error) {
    console.error("Error fetching all user wallets:", error);
    return [];
  }
}

/**
 * Create a deposit transaction
 */
export async function createDepositTransaction(
  walletId: string,
  userId: string,
  amount: number,
  network: Network,
  fromAddress: string,
  transactionHash?: string,
  proofUrl?: string
): Promise<USDTTransaction | null> {
  console.log("=== CREATING DEPOSIT ===");
  console.log("User ID:", userId);
  console.log("Amount:", amount);
  console.log("Network:", network);

  // Insert into crypto_deposits table for admin
  const depositPayload = {
    user_id: userId,
    amount: amount,
    deposit_address: fromAddress || "unknown", // Changed from from_address
    transaction_hash: transactionHash || "pending_" + Date.now(),
    currency: network, // Changed from network to currency
    status: "pending",
    screenshot_url: proofUrl,
  };

  console.log("Deposit payload:", depositPayload);

  const { data: depositData, error: depositError } = await supabase
    .from("crypto_deposits") // Changed from deposits
    .insert(depositPayload)
    .select()
    .single();

  if (depositError) {
    console.error("DEPOSIT INSERT ERROR:", depositError);
    throw new Error("Failed to create deposit record: " + depositError.message);
  } else {
    console.log("DEPOSIT CREATED SUCCESSFULLY:", depositData);
  }

  // Also insert into wallet_transactions
  const { data: txData, error: txError } = await supabase
    .from("wallet_transactions") // Changed from usdt_transactions
    .insert({
      // wallet_id: walletId, // Removed as wallet_transactions doesn't have wallet_id in new schema, it uses user_id
      user_id: userId,
      type: "deposit",
      amount,
      // fee: 0, // Removed if not in schema or optional
      network,
      from_address: fromAddress || "unknown",
      transaction_hash: transactionHash || "pending_" + Date.now(),
      status: "pending",
    })
    .select()
    .single();

  if (txError) {
    console.error("TX INSERT ERROR:", txError);
  } else {
    console.log("TX CREATED:", txData);
  }

  // Return whatever we have
  return (
    txData || (depositData as any) || ({ id: "temp", amount, network } as any)
  );
}

/**
 * Create a withdrawal transaction
 */
export async function createWithdrawalTransaction(
  walletId: string,
  userId: string,
  amount: number,
  network: Network,
  toAddress: string
): Promise<{
  success: boolean;
  transaction?: USDTTransaction;
  error?: string;
}> {
  const normalizedNetwork = normalizeNetworkName(network);
  try {
    // Get current balance
    const { data: wallet, error: walletError } = await supabase
      .from("usdt_wallets")
      .select("balance")
      .eq("id", walletId)
      .single();

    if (walletError) throw walletError;

    const fee = calculateFee(normalizedNetwork, amount);
    const totalAmount = amount + fee;

    if (wallet.balance < totalAmount) {
      return { success: false, error: "Insufficient balance" };
    }

    // Validate recipient address
    if (!validateAddress(toAddress, network)) {
      return { success: false, error: "Invalid recipient address" };
    }

    // Create transaction
    const { data, error } = await supabase
      .from("wallet_transactions") // Changed from usdt_transactions
      .insert({
        // wallet_id: walletId,
        user_id: userId,
        type: "withdrawal",
        amount,
        // fee,
        network: normalizedNetwork,
        to_address: toAddress,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // 2. ALSO insert into the 'withdrawals' table for the Admin Panel
    const { error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        user_id: userId,
        transaction_id: data.id, // Link to the specific transaction
        amount: amount,
        fee: fee,
        type: "withdrawal",
        address: toAddress,
        network: network,
        status: "pending",
        created_at: new Date().toISOString(),
      });

    if (withdrawalError) {
      console.error(
        "CRITICAL: Failed to create admin notification (withdrawals table):",
        withdrawalError
      );
      // Try to delete the usdt_transaction to keep things consistent, or just fail
      await supabase.from("usdt_transactions").delete().eq("id", data.id);
      throw new Error(
        `Admin communication error: ${withdrawalError.message}. Please contact support.`
      );
    }

    console.log("SUCCESS: Withdrawal created and admin notified.");

    // Update wallet balance
    // Note: Funds are NOT deducted until admin approves the withdrawal.
    // This prevents funds from disappearing if the request is rejected.

    return { success: true, transaction: data };
  } catch (error: any) {
    console.error("Error creating withdrawal transaction:", error);
    return {
      success: false,
      error: error.message || "Failed to create withdrawal",
    };
  }
}

/**
 * Send USDT to another address
 */
export async function sendUSDT(
  walletId: string,
  userId: string,
  amount: number,
  network: Network,
  toAddress: string
): Promise<{
  success: boolean;
  transaction?: USDTTransaction;
  error?: string;
}> {
  const normalizedNetwork = normalizeNetworkName(network);
  try {
    // Get current balance
    const { data: wallet, error: walletError } = await supabase
      .from("usdt_wallets")
      .select("balance, address")
      .eq("id", walletId)
      .single();

    if (walletError) throw walletError;

    const fee = calculateFee(normalizedNetwork, amount);
    const totalAmount = amount + fee;

    if (wallet.balance < totalAmount) {
      return { success: false, error: "Insufficient balance" };
    }

    // Validate recipient address
    if (!validateAddress(toAddress, network)) {
      return { success: false, error: "Invalid recipient address" };
    }

    // Cannot send to self
    if (toAddress.toLowerCase() === wallet.address.toLowerCase()) {
      return { success: false, error: "Cannot send to your own address" };
    }

    // Create send transaction
    const { data, error } = await supabase
      .from("wallet_transactions") // Changed from usdt_transactions
      .insert({
        // wallet_id: walletId,
        user_id: userId,
        type: "send",
        amount,
        // fee,
        network: normalizedNetwork,
        from_address: wallet.address,
        to_address: toAddress,
        status: "pending",
        transaction_hash: `0x${Math.random()
          .toString(16)
          .slice(2)}${Date.now().toString(16)}`,
      })
      .select()
      .single();

    if (error) throw error;

    // ALSO insert into 'withdrawals' table so Admin can approve it
    const { error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert({
        user_id: userId,
        transaction_id: data.id, // Link to the specific transaction
        amount: amount,
        fee: fee,
        type: "send",
        address: toAddress,
        network: network,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (withdrawalError) {
      console.error(
        "CRITICAL: Failed to create admin notification for send (withdrawals table):",
        withdrawalError
      );
      // Rollback the transaction record if possible
      await supabase.from("usdt_transactions").delete().eq("id", data.id);
      throw new Error(
        `Admin communication error: ${withdrawalError.message}. Please contact support.`
      );
    }

    console.log("SUCCESS: Send request created and admin notified.");

    // Update wallet balance
    // Note: Funds are NOT deducted until admin approves the send request.

    return { success: true, transaction: data };
  } catch (error: any) {
    console.error("Error sending USDT:", error);
    return { success: false, error: error.message || "Failed to send USDT" };
  }
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<USDTTransaction[]> {
  try {
    const { data, error } = await supabase
      .from("wallet_transactions") // Changed from usdt_transactions
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false }) // Changed from created_at
      .limit(limit);

    if (error) throw error;

    // Map timestamp to created_at for frontend compatibility
    return (data || []).map((tx) => ({
      ...tx,
      created_at: tx.timestamp || new Date().toISOString(), // Fallback to now if missing
      // Ensure network is normalized
      network: normalizeNetworkName(tx.network),
    }));
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return [];
  }
}

/**
 * Update transaction status (for admin or automated processing)
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: "processing" | "completed" | "failed",
  transactionHash?: string
): Promise<boolean> {
  try {
    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (transactionHash) {
      updateData.transaction_hash = transactionHash;
    }

    // If deposit is completed, update wallet balance
    if (status === "completed") {
      const { data: tx, error: txError } = await supabase
        .from("wallet_transactions")
        .select("type, amount, user_id, network") // Changed wallet_id to user_id/network logic
        .eq("id", transactionId)
        .single();

      if (!txError && tx && tx.type === "deposit") {
        // Find wallet to credit
        const { data: wallet, error: walletError } = await supabase
          .from("usdt_wallets")
          .select("id, balance")
          .eq("user_id", tx.user_id)
          .eq("network", tx.network)
          .single();

        if (!walletError && wallet) {
          await supabase
            .from("usdt_wallets")
            .update({ balance: wallet.balance + tx.amount })
            .eq("id", wallet.id);
        }
      }
    }

    const { error } = await supabase
      .from("wallet_transactions")
      .update(updateData)
      .eq("id", transactionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating transaction status:", error);
    return false;
  }
}

/**
 * Get total balance across all networks
 */
export async function getTotalBalance(userId: string): Promise<number> {
  try {
    console.log("[getTotalBalance] Fetching balance for user:", userId);
    const { data, error } = await supabase
      .from("usdt_wallets")
      .select("balance")
      .eq("user_id", userId);

    if (error) {
      console.error("[getTotalBalance] Error:", error);
      throw error;
    }

    const total =
      data?.reduce((total, wallet) => total + wallet.balance, 0) || 0;
    console.log(
      "[getTotalBalance] Wallets found:",
      data?.length,
      "Total balance:",
      total
    );
    return total;
  } catch (error) {
    console.error("Error calculating total balance:", error);
    return 0;
  }
}
