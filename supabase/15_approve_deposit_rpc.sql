-- RPC for Admin to Approve Deposit (Atomic Transaction)
CREATE OR REPLACE FUNCTION admin_approve_deposit(
    target_deposit_id UUID,
    admin_user_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deposit_record RECORD;
    wallet_id UUID;
    current_balance NUMERIC;
    new_balance NUMERIC;
    credit_amount NUMERIC;
    user_wallet_network TEXT := 'TRC20'; -- Default network for wallet if creating new
BEGIN
    -- 1. Check Admin Permission
    IF NOT public.is_admin() THEN
        RETURN json_build_object('success', false, 'error', 'Access denied: User is not an admin');
    END IF;

    -- 2. Fetch Deposit Record
    SELECT * INTO deposit_record FROM public.crypto_deposits WHERE id = target_deposit_id;
    
    IF deposit_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Deposit not found');
    END IF;

    IF deposit_record.status = 'credited' THEN
        RETURN json_build_object('success', false, 'error', 'Deposit already credited');
    END IF;

    IF deposit_record.status = 'rejected' THEN
        RETURN json_build_object('success', false, 'error', 'Deposit is rejected');
    END IF;

    credit_amount := deposit_record.amount_usd;

    -- 3. Get or Create User Wallet (USDT)
    -- We try to find a USDT wallet. If multiple, pick one (e.g., TRC20).
    SELECT id, balance, network INTO wallet_id, current_balance, user_wallet_network
    FROM public.usdt_wallets 
    WHERE user_id = deposit_record.user_id 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF wallet_id IS NULL THEN
        -- Create new wallet if none exists
        INSERT INTO public.usdt_wallets (user_id, address, network, balance)
        VALUES (
            deposit_record.user_id, 
            'generated_' || substr(md5(random()::text), 1, 10), 
            'TRC20', 
            0
        )
        RETURNING id, balance INTO wallet_id, current_balance;
    END IF;

    -- 4. Update Wallet Balance
    new_balance := current_balance + credit_amount;
    
    UPDATE public.usdt_wallets
    SET balance = new_balance, updated_at = NOW()
    WHERE id = wallet_id;

    -- 5. Update Deposit Status
    UPDATE public.crypto_deposits
    SET 
        status = 'credited',
        verified_by = admin_user_id,
        verified_at = NOW(),
        credited_at = NOW(),
        updated_at = NOW()
    WHERE id = target_deposit_id;

    -- 6. Log Transaction
    INSERT INTO public.wallet_transactions (
        user_id,
        wallet_address,
        transaction_hash,
        type,
        amount,
        asset,
        status,
        network,
        timestamp
    ) VALUES (
        deposit_record.user_id,
        (SELECT address FROM public.usdt_wallets WHERE id = wallet_id),
        deposit_record.transaction_hash,
        'deposit',
        credit_amount,
        'USDT',
        'completed',
        user_wallet_network,
        NOW()
    );

    -- 7. Create Notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        read
    ) VALUES (
        deposit_record.user_id,
        'Deposit Credited',
        'Your deposit of $' || round(credit_amount, 2) || ' has been approved and credited to your wallet.',
        'success',
        false
    );

    RETURN json_build_object('success', true, 'new_balance', new_balance);

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- RPC for Admin to Reject Deposit
CREATE OR REPLACE FUNCTION admin_reject_deposit(
    target_deposit_id UUID,
    admin_user_id UUID,
    rejection_reason TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Check Admin Permission
    IF NOT public.is_admin() THEN
        RETURN json_build_object('success', false, 'error', 'Access denied: User is not an admin');
    END IF;

    -- 2. Update Deposit Status
    UPDATE public.crypto_deposits
    SET 
        status = 'rejected',
        notes = rejection_reason,
        verified_by = admin_user_id,
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = target_deposit_id;

    -- 3. Create Notification (Optional)
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        read
    ) 
    SELECT 
        user_id,
        'Deposit Rejected',
        'Your deposit request has been rejected. Reason: ' || rejection_reason,
        'error',
        false
    FROM public.crypto_deposits
    WHERE id = target_deposit_id;

    RETURN json_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;
