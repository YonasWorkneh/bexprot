-- ==========================================
-- BACKEND FUNCTIONS (RPC)
-- ==========================================

-- 1. Get Full User Details (Admin)
CREATE OR REPLACE FUNCTION get_user_full_details(target_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile json;
    user_balances json;
    user_stats json;
    result json;
BEGIN
    -- Check admin permission (optional, handled by RLS usually but good for RPC)
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Fetch Profile
    SELECT row_to_json(u) INTO user_profile FROM public.users u WHERE id = target_user_id;
    
    -- Fetch Balances
    SELECT json_agg(w) INTO user_balances FROM public.usdt_wallets w WHERE user_id = target_user_id;
    
    -- Calculate Stats
    SELECT json_build_object(
        'total_trades', count(*),
        'total_volume', coalesce(sum(quantity * price), 0)
    ) INTO user_stats
    FROM public.trades
    WHERE user_id = target_user_id;

    result := json_build_object(
        'profile', user_profile,
        'balances', user_balances,
        'stats', user_stats
    );

    RETURN result;
END;
$$;


-- 2. Admin Adjust Balance
CREATE OR REPLACE FUNCTION admin_adjust_balance(
    target_user_id UUID,
    amount NUMERIC,
    adjustment_type TEXT, -- 'credit' or 'debit'
    description TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance NUMERIC;
    new_balance NUMERIC;
    wallet_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get Wallet (Create if not exists)
    SELECT id, balance INTO wallet_id, current_balance
    FROM public.usdt_wallets
    WHERE user_id = target_user_id
    LIMIT 1;

    IF wallet_id IS NULL THEN
        INSERT INTO public.usdt_wallets (user_id, balance, address)
        VALUES (target_user_id, 0, 'generated_' || target_user_id)
        RETURNING id, balance INTO wallet_id, current_balance;
    END IF;

    -- Calculate New Balance
    IF adjustment_type = 'credit' THEN
        new_balance := current_balance + amount;
    ELSIF adjustment_type = 'debit' THEN
        new_balance := current_balance - amount;
        IF new_balance < 0 THEN
            RETURN json_build_object('success', false, 'error', 'Insufficient balance');
        END IF;
    ELSE
        RETURN json_build_object('success', false, 'error', 'Invalid adjustment type');
    END IF;

    -- Update Wallet
    UPDATE public.usdt_wallets
    SET balance = new_balance, updated_at = NOW()
    WHERE id = wallet_id;

    -- Log Transaction
    INSERT INTO public.wallet_transactions (
        user_id, wallet_address, transaction_hash, type, amount, asset, status, network, timestamp
    ) VALUES (
        target_user_id, 
        (SELECT address FROM public.usdt_wallets WHERE id = wallet_id),
        'admin_adj_' || extract(epoch from now()),
        'admin_adjustment',
        amount,
        'USDT',
        'completed',
        'INTERNAL',
        NOW()
    );

    RETURN json_build_object('success', true, 'new_balance', new_balance);
END;
$$;


-- 3. Settle Expired Contracts (Placeholder for future automation)
CREATE OR REPLACE FUNCTION settle_expired_contracts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Logic to check expired contracts in 'orders' or 'portfolio' and settle them
    -- This requires a specific table structure for contracts which is currently hybrid (store/db).
    -- Once contracts are fully DB-backed, this function will loop through them.
    RETURN;
END;
$$;
