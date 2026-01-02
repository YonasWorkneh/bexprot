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
    is_usdt_deposit BOOLEAN := false;
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

    -- Check if this is a USDT deposit
    is_usdt_deposit := deposit_record.currency IN ('USDT', 'USDT_TRC20');
    credit_amount := deposit_record.amount_usd;

    -- 3. Handle USDT deposits differently
    IF is_usdt_deposit THEN
        -- For USDT: Add to usdt_wallets and delete from crypto_deposits
        
        -- Get or Create User Wallet (USDT)
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

        -- Update Wallet Balance
        new_balance := current_balance + credit_amount;
        
        UPDATE public.usdt_wallets
        SET balance = new_balance, updated_at = NOW()
        WHERE id = wallet_id;

        -- Log Transaction
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

        -- Delete the deposit record from crypto_deposits (USDT deposits are moved to usdt_wallets)
        DELETE FROM public.crypto_deposits WHERE id = target_deposit_id;

        -- Create Notification
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            read
        ) VALUES (
            deposit_record.user_id,
            'Deposit Credited',
            'Your USDT deposit of $' || round(credit_amount, 2) || ' has been approved and credited to your wallet.',
            'success',
            false
        );

        RETURN json_build_object('success', true, 'new_balance', new_balance, 'deleted', true);
    ELSE
        -- For non-USDT currencies: Keep in crypto_deposits with status 'credited'
        UPDATE public.crypto_deposits
        SET 
            status = 'credited',
            verified_by = admin_user_id,
            verified_at = NOW(),
            credited_at = NOW(),
            updated_at = NOW()
        WHERE id = target_deposit_id;

        -- Create Notification
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            read
        ) VALUES (
            deposit_record.user_id,
            'Deposit Credited',
            'Your ' || deposit_record.currency || ' deposit of $' || round(credit_amount, 2) || ' has been approved and credited.',
            'success',
            false
        );

        RETURN json_build_object('success', true, 'status', 'credited');
    END IF;

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
