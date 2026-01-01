-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS & PROFILES
-- ==========================================
-- Note: 'users' table usually exists in 'auth.users' but we need a public profile table.
-- If you are using Supabase Auth, 'auth.users' is managed by Supabase.
-- We create a public 'users' table that syncs with 'auth.users'.

CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    phone TEXT,
    kyc_status TEXT DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected')),
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    preferences JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to handle new user signup (if not already present)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- 2. WALLETS & TRANSACTIONS
-- ==========================================

-- USDT Wallets (One per user per network, or unified)
CREATE TABLE IF NOT EXISTS public.usdt_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    network TEXT DEFAULT 'TRC20',
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network)
);

-- Crypto Deposits (User Reports)
CREATE TABLE IF NOT EXISTS public.crypto_deposits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    deposit_code TEXT,
    currency TEXT NOT NULL,
    deposit_address TEXT NOT NULL,
    transaction_hash TEXT UNIQUE NOT NULL,
    user_reported_amount NUMERIC,
    admin_verified_amount NUMERIC,
    amount NUMERIC NOT NULL, -- The final accepted amount
    amount_usd NUMERIC,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reported', 'confirmed', 'credited', 'rejected')),
    confirmations INTEGER DEFAULT 0,
    blockchain_explorer_url TEXT,
    screenshot_url TEXT, -- Proof of payment
    notes TEXT,
    verification_notes TEXT,
    verified_by UUID REFERENCES public.users(id), -- Admin who verified
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    credited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawals
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    fee NUMERIC DEFAULT 0,
    final_amount NUMERIC GENERATED ALWAYS AS (amount - fee) STORED,
    currency TEXT DEFAULT 'USDT',
    network TEXT,
    address TEXT NOT NULL, -- Destination address
    transaction_hash TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'completed', 'rejected', 'failed')),
    rejection_reason TEXT,
    processed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet Transactions (Sends/Internal/History)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    wallet_address TEXT,
    to_address TEXT,
    from_address TEXT,
    transaction_hash TEXT,
    type TEXT CHECK (type IN ('send', 'receive', 'deposit', 'withdrawal', 'trade_pnl', 'admin_adjustment')),
    amount NUMERIC NOT NULL,
    asset TEXT DEFAULT 'USDT',
    network TEXT,
    status TEXT DEFAULT 'pending',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Deposit Addresses (System Wallets for users to deposit to)
CREATE TABLE IF NOT EXISTS public.crypto_deposit_addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    currency TEXT NOT NULL,
    network TEXT NOT NULL,
    network_symbol TEXT,
    address TEXT NOT NULL,
    qr_code_url TEXT,
    min_deposit NUMERIC DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 3. KYC SUBMISSIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.kyc_submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    nationality TEXT,
    address_line TEXT,
    city TEXT,
    zip_code TEXT,
    country TEXT,
    id_type TEXT CHECK (id_type IN ('passport', 'national_id', 'driver_license')),
    id_number TEXT,
    id_front_url TEXT NOT NULL,
    id_back_url TEXT,
    selfie_url TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.users(id),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==========================================
-- 4. TRADING & PORTFOLIO
-- ==========================================

CREATE TABLE IF NOT EXISTS public.trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    asset TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    price NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('buy', 'sell')),
    is_demo BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    asset_id TEXT NOT NULL,
    asset_name TEXT,
    type TEXT CHECK (type IN ('market', 'limit')),
    side TEXT CHECK (side IN ('buy', 'sell')),
    price NUMERIC NOT NULL,
    amount NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled')),
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.portfolio (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    asset TEXT NOT NULL,
    total_quantity NUMERIC DEFAULT 0,
    average_price NUMERIC DEFAULT 0,
    current_value NUMERIC DEFAULT 0,
    is_demo BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, asset, is_demo)
);


-- ==========================================
-- 5. SYSTEM CONFIGURATION
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_trading_enabled BOOLEAN DEFAULT TRUE,
    contract_outcome_mode TEXT DEFAULT 'fair' CHECK (contract_outcome_mode IN ('fair', 'always_win', 'always_loss')),
    withdrawal_enabled BOOLEAN DEFAULT TRUE,
    min_deposit_amount NUMERIC DEFAULT 10,
    min_withdrawal_amount NUMERIC DEFAULT 20,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

-- Insert default settings if not exists
INSERT INTO public.system_settings (id, contract_trading_enabled) 
SELECT uuid_generate_v4(), true
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

-- ==========================================
-- 6. NOTIFICATIONS
-- ==========================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
