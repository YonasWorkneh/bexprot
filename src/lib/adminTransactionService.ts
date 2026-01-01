import { supabase } from './supabase';

/**
 * Approve a deposit request
 * 1. Credits the user's wallet (or creates one if missing)
 * 2. Updates the deposit status to 'approved'
 */
export async function approveDeposit(id: string, amount: number, userId: string, network: string) {
    console.log(`Approving deposit ${id} for user ${userId}, amount ${amount}, network ${network}`);

    // 1. Credit the user's wallet
    let walletId = null;

    const { data: wallets, error: walletError } = await supabase
        .from('usdt_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('network', network)
        .limit(1);

    if (walletError) throw new Error(`Error fetching wallet: ${walletError.message}`);

    if (wallets && wallets.length > 0) {
        // Update existing wallet balance
        walletId = wallets[0].id;
        const newBalance = Number(wallets[0].balance) + Number(amount);
        const { error: updateError } = await supabase
            .from('usdt_wallets')
            .update({ balance: newBalance })
            .eq('id', walletId);

        if (updateError) throw new Error(`Error updating wallet balance: ${updateError.message}`);
        console.log(`Credited ${amount} to wallet ${walletId}, new balance: ${newBalance}`);
    } else {
        // Create new wallet with the deposit amount
        const { data: newWallet, error: createError } = await supabase
            .from('usdt_wallets')
            .insert({
                user_id: userId,
                network: network,
                address: `${network}_${userId.substring(0, 8)}`, // Generate a placeholder address
                balance: amount
            })
            .select()
            .single();

        if (createError) throw new Error(`Error creating wallet: ${createError.message}`);
        walletId = newWallet.id;
        console.log(`Created new wallet for user ${userId} with balance ${amount}`);
    }

    // 2. Update deposit status
    const { error: statusError } = await supabase
        .from('crypto_deposits')
        .update({ status: 'credited' })
        .eq('id', id);

    if (statusError) throw new Error(`Error updating deposit status: ${statusError.message}`);

    return { success: true, walletId };
}

/**
 * Reject a deposit request
 * Updates the deposit status to 'rejected'
 */
export async function rejectDeposit(id: string) {
    console.log(`Rejecting deposit ${id}`);

    const { error } = await supabase
        .from('crypto_deposits')
        .update({ status: 'rejected' })
        .eq('id', id);

    if (error) throw new Error(`Error rejecting deposit: ${error.message}`);

    return { success: true };
}

/**
 * Approve a withdrawal request
 * 1. Checks and deducts the user's wallet balance
 * 2. Updates status to 'approved'
 */
export async function approveWithdrawal(id: string) {
    console.log(`Approving withdrawal ${id}`);

    // 1. Fetch withdrawal details from the table directly for point-lookup
    const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !withdrawal) {
        throw new Error(`Error fetching withdrawal: ${fetchError?.message || 'Not found'}`);
    }

    if (withdrawal.status !== 'pending') {
        throw new Error(`Withdrawal is already ${withdrawal.status}`);
    }

    // 2. Deduct from wallet
    const { data: wallets, error: walletError } = await supabase
        .from('usdt_wallets')
        .select('*')
        .eq('user_id', withdrawal.user_id)
        .eq('network', withdrawal.network)
        .limit(1);

    if (walletError) throw new Error(`Error fetching wallet: ${walletError.message}`);

    if (!wallets || wallets.length === 0) {
        throw new Error(`User does not have a ${withdrawal.network} wallet`);
    }

    const wallet = wallets[0];
    const totalDeduction = Number(withdrawal.amount) + Number(withdrawal.fee || 0);
    if (Number(wallet.balance) < totalDeduction) {
        throw new Error(`Insufficient balance (including fee) in user's ${withdrawal.network} wallet. Required: ${totalDeduction}, Available: ${wallet.balance}`);
    }

    const newBalance = Number(wallet.balance) - totalDeduction;
    const { error: updateError } = await supabase
        .from('usdt_wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id);

    if (updateError) throw new Error(`Error updating wallet balance: ${updateError.message}`);

    // 3. Update withdrawal status
    const { error: statusError } = await supabase
        .from('withdrawals')
        .update({ status: 'approved' })
        .eq('id', id);

    if (statusError) throw new Error(`Error updating withdrawal status: ${statusError.message}`);

    // 4. Also update the corresponding wallet_transactions status if it exists
    if (withdrawal.transaction_id) {
        await supabase
            .from('wallet_transactions')
            .update({ status: 'completed' })
            .eq('id', withdrawal.transaction_id);
    } else {
        // Fallback for older records
        await supabase
            .from('wallet_transactions')
            .update({ status: 'completed' })
            .eq('user_id', withdrawal.user_id)
            .eq('network', withdrawal.network)
            .eq('amount', withdrawal.amount)
            .eq('status', 'pending');
    }

    return { success: true };
}

/**
 * Reject a withdrawal request
 * Updates status to 'rejected' (No refund needed as funds stayed in wallet)
 */
export async function rejectWithdrawal(id: string, amount: number, userId: string, network: string) {
    console.log(`Rejecting withdrawal ${id}`);

    // 1. Fetch withdrawal details to get transaction_id
    const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError) {
        console.warn(`Could not fetch withdrawal ${id} details, proceeding with fuzzy match rejection.`);
    }

    // 2. Update withdrawal status
    const { error } = await supabase
        .from('withdrawals')
        .update({ status: 'rejected' })
        .eq('id', id);

    if (error) throw new Error(`Error rejecting withdrawal: ${error.message}`);

    // 3. Also update wallet_transactions
    if (withdrawal && withdrawal.transaction_id) {
        // Precise update
        await supabase
            .from('wallet_transactions')
            .update({ status: 'failed' })
            .eq('id', withdrawal.transaction_id);
    } else {
        // Fuzzy fallback
        await supabase
            .from('wallet_transactions')
            .update({ status: 'failed' })
            .eq('user_id', userId)
            .eq('network', network)
            .eq('amount', amount)
            .eq('status', 'pending');
    }

    return { success: true };
}
