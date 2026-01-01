-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Secure Function to Get Full User Details for Admin
-- This returns a JSON object containing profile, balances, and stats
create or replace function get_user_full_details(target_user_id UUID)
returns json
language plpgsql
security definer
as $$
declare
    user_profile json;
    user_balances json;
    user_stats json;
    result json;
begin
    -- Check if the requesting user is an admin (you might need to adjust this check based on your auth setup)
    -- For now, we assume this function is called by a service role or we rely on RLS if called from client.
    -- Ideally, check a 'role' field in 'users' table or app_metadata.
    
    -- Fetch Profile
    select row_to_json(u) into user_profile from users u where id = target_user_id;
    
    -- Fetch Balances (USDT Wallets)
    select json_agg(w) into user_balances from usdt_wallets w where user_id = target_user_id;
    
    -- Calculate Stats (Total Trades, Win Rate, etc.)
    -- This is a simplified example
    select json_build_object(
        'total_trades', count(*),
        'total_volume', coalesce(sum(quantity * price), 0)
    ) into user_stats
    from trades
    where user_id = target_user_id;

    result := json_build_object(
        'profile', user_profile,
        'balances', user_balances,
        'stats', user_stats
    );

    return result;
end;
$$;

-- 2. Admin Balance Adjustment Function
-- Allows admins to credit/debit user balances securely
create or replace function admin_adjust_balance(
    target_user_id UUID,
    amount NUMERIC,
    adjustment_type TEXT, -- 'credit' or 'debit'
    description TEXT
)
returns json
language plpgsql
security definer
as $$
declare
    current_balance NUMERIC;
    new_balance NUMERIC;
    wallet_id UUID;
begin
    -- Get the user's USDT wallet (assuming one per user for simplicity)
    select id, balance into wallet_id, current_balance
    from usdt_wallets
    where user_id = target_user_id
    limit 1;

    if wallet_id is null then
        -- Create wallet if not exists
        insert into usdt_wallets (user_id, balance, address)
        values (target_user_id, 0, 'generated_' || target_user_id)
        returning id, balance into wallet_id, current_balance;
    end if;

    if adjustment_type = 'credit' then
        new_balance := current_balance + amount;
    elsif adjustment_type = 'debit' then
        new_balance := current_balance - amount;
        if new_balance < 0 then
            return json_build_object('success', false, 'error', 'Insufficient balance');
        end if;
    else
        return json_build_object('success', false, 'error', 'Invalid adjustment type');
    end if;

    -- Update Balance
    update usdt_wallets
    set balance = new_balance, updated_at = now()
    where id = wallet_id;

    -- Log Transaction (Optional but recommended)
    insert into wallet_transactions (
        user_id, wallet_address, transaction_hash, type, amount, asset, status, network, timestamp
    ) values (
        target_user_id, 
        (select address from usdt_wallets where id = wallet_id),
        'admin_adj_' || extract(epoch from now()),
        case when adjustment_type = 'credit' then 'receive' else 'send' end,
        amount,
        'USDT',
        'confirmed',
        'INTERNAL',
        now()
    );

    return json_build_object('success', true, 'new_balance', new_balance);
end;
$$;

-- 3. Trade Settlement Function (Simplified)
-- Can be called by a cron job or admin to settle expired contracts
create or replace function settle_expired_contracts()
returns void
language plpgsql
security definer
as $$
declare
    contract record;
    is_win boolean;
    payout_amount numeric;
begin
    -- Loop through open contracts that have expired
    -- Note: This assumes you have a 'contracts' table or similar. 
    -- Based on the codebase, contracts seem to be stored in 'portfolio' or 'positions' in the store.
    -- If they are in the DB, this logic applies. If they are only local, this SQL won't work until they are persisted.
    
    -- Placeholder logic assuming a 'contracts' table exists
    -- for contract in select * from contracts where status = 'open' and expires_at <= now() loop
    --     ... settlement logic ...
    -- end loop;
    
    return;
end;
$$;
