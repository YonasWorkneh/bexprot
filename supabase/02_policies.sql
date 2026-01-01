-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usdt_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_deposit_addresses ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
-- Assumes 'role' column in public.users or app_metadata
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 1. USERS
-- ==========================================
-- Users can view/edit their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view/edit all users
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (is_admin());


-- ==========================================
-- 2. WALLETS & TRANSACTIONS
-- ==========================================
-- USDT Wallets
CREATE POLICY "Users can view own wallets" ON public.usdt_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.usdt_wallets
    FOR SELECT USING (is_admin());

-- Crypto Deposits
CREATE POLICY "Users can view own deposits" ON public.crypto_deposits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create deposits" ON public.crypto_deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposits" ON public.crypto_deposits
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update deposits" ON public.crypto_deposits
    FOR UPDATE USING (is_admin());

-- Withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update withdrawals" ON public.withdrawals
    FOR UPDATE USING (is_admin());

-- Wallet Transactions
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
    FOR SELECT USING (is_admin());

-- Deposit Addresses
CREATE POLICY "Everyone can view active deposit addresses" ON public.crypto_deposit_addresses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage deposit addresses" ON public.crypto_deposit_addresses
    FOR ALL USING (is_admin());


-- ==========================================
-- 3. KYC SUBMISSIONS
-- ==========================================
CREATE POLICY "Users can view own kyc" ON public.kyc_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit kyc" ON public.kyc_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all kyc" ON public.kyc_submissions
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update kyc" ON public.kyc_submissions
    FOR UPDATE USING (is_admin());


-- ==========================================
-- 4. TRADING & PORTFOLIO
-- ==========================================
-- Trades
CREATE POLICY "Users can view own trades" ON public.trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create trades" ON public.trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades" ON public.trades
    FOR SELECT USING (is_admin());

-- Orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (is_admin());

-- Portfolio
CREATE POLICY "Users can view own portfolio" ON public.portfolio
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all portfolios" ON public.portfolio
    FOR SELECT USING (is_admin());


-- ==========================================
-- 5. SYSTEM SETTINGS
-- ==========================================
CREATE POLICY "Everyone can view system settings" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can update system settings" ON public.system_settings
    FOR UPDATE USING (is_admin());


-- ==========================================
-- 6. NOTIFICATIONS
-- ==========================================
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id); -- e.g. mark as read

CREATE POLICY "Admins can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (is_admin());
