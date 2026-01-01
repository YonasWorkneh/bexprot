-- ==========================================
-- 18. Fix User Wallet & Trading Policies
-- ==========================================

-- 1. USDT Wallets: Allow users to update their own balance (for trades)
DROP POLICY IF EXISTS "Users can update own wallets" ON public.usdt_wallets;
CREATE POLICY "Users can update own wallets" ON public.usdt_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- 2. Wallet Transactions: Allow users to record their own transactions (trade PnL, etc.)
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.wallet_transactions;
CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Crypto Deposits: Allow users to report their own deposits
DROP POLICY IF EXISTS "Users can insert own deposits" ON public.crypto_deposits;
CREATE POLICY "Users can insert own deposits" ON public.crypto_deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Withdrawals: Allow users to request withdrawals
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert own withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Ensure Admin Visibility (SELECT for all tables)
-- Admins should already have SELECT access via is_admin() policies in 02_policies.sql,
-- but we re-apply them here to be absolutely sure they cover all tables.

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'usdt_wallets', 'wallet_transactions', 'trades', 'orders', 'kyc_submissions', 'crypto_deposits', 'withdrawals', 'portfolio', 'system_settings', 'notifications')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admins can view all %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Admins can view all %I" ON public.%I FOR SELECT USING (public.is_admin())', t, t);
    END LOOP;
END $$;
