-- Fix RLS policies to allow Admins to fully manage deposits and wallets

-- 1. USDT WALLETS
-- Ensure Admins can UPDATE wallets (crediting deposits)
DROP POLICY IF EXISTS "Admins can update wallets" ON public.usdt_wallets;
CREATE POLICY "Admins can update wallets" ON public.usdt_wallets
    FOR UPDATE USING (is_admin());

-- 2. WALLET TRANSACTIONS
-- Ensure Admins can INSERT transactions (logging the credit)
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can insert transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (is_admin());

-- Ensure Admins can UPDATE transactions (if needed)
DROP POLICY IF EXISTS "Admins can update transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can update transactions" ON public.wallet_transactions
    FOR UPDATE USING (is_admin());

-- 3. CRYPTO DEPOSITS
-- Ensure Admins can UPDATE deposits (changing status)
DROP POLICY IF EXISTS "Admins can update deposits" ON public.crypto_deposits;
CREATE POLICY "Admins can update deposits" ON public.crypto_deposits
    FOR UPDATE USING (is_admin());

-- 4. NOTIFICATIONS
-- Ensure Admins can INSERT notifications
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (is_admin());
