-- Wallet tables for all cryptocurrencies
-- Each cryptocurrency has its own wallet table to store user wallet addresses

-- BTC Wallets
CREATE TABLE IF NOT EXISTS public.btc_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    network TEXT DEFAULT 'Bitcoin',
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network)
);

-- SOL Wallets
CREATE TABLE IF NOT EXISTS public.sol_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    network TEXT DEFAULT 'Solana',
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network)
);

-- XRP Wallets
CREATE TABLE IF NOT EXISTS public.xrp_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    network TEXT DEFAULT 'XRP Ledger',
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network)
);

-- LTC Wallets
CREATE TABLE IF NOT EXISTS public.ltc_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    network TEXT DEFAULT 'Litecoin',
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network)
);

-- BNB Wallets
CREATE TABLE IF NOT EXISTS public.bnb_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    network TEXT DEFAULT 'BNB Smart Chain',
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network)
);

-- ETH Wallets
CREATE TABLE IF NOT EXISTS public.eth_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    network TEXT DEFAULT 'Ethereum',
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network)
);

-- USDC Wallets
CREATE TABLE IF NOT EXISTS public.usdc_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address TEXT NOT NULL,
    network TEXT DEFAULT 'ERC20',
    balance NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, network)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_btc_wallets_user_id ON public.btc_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_sol_wallets_user_id ON public.sol_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_xrp_wallets_user_id ON public.xrp_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_ltc_wallets_user_id ON public.ltc_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_bnb_wallets_user_id ON public.bnb_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_eth_wallets_user_id ON public.eth_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_usdc_wallets_user_id ON public.usdc_wallets(user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all wallet tables
CREATE TRIGGER update_btc_wallets_updated_at BEFORE UPDATE ON public.btc_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sol_wallets_updated_at BEFORE UPDATE ON public.sol_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_xrp_wallets_updated_at BEFORE UPDATE ON public.xrp_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ltc_wallets_updated_at BEFORE UPDATE ON public.ltc_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bnb_wallets_updated_at BEFORE UPDATE ON public.bnb_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_eth_wallets_updated_at BEFORE UPDATE ON public.eth_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usdc_wallets_updated_at BEFORE UPDATE ON public.usdc_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

