-- Migration: Add contract-specific fields to trades table
-- This migration adds the necessary columns for contract trading functionality

-- Add contract-specific fields to trades table (if they don't exist)
DO $$ 
BEGIN
    -- Add exit_price column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades' 
        AND column_name = 'exit_price'
    ) THEN
        ALTER TABLE public.trades ADD COLUMN exit_price NUMERIC;
    END IF;

    -- Add payout column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades' 
        AND column_name = 'payout'
    ) THEN
        ALTER TABLE public.trades ADD COLUMN payout NUMERIC;
    END IF;

    -- Add profit column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades' 
        AND column_name = 'profit'
    ) THEN
        ALTER TABLE public.trades ADD COLUMN profit NUMERIC;
    END IF;

    -- Add status column with CHECK constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.trades ADD COLUMN status TEXT CHECK (status IN ('open', 'win', 'loss', 'tie'));
    END IF;

    -- Note: open_time and close_time columns are NOT added
    -- The trades table uses 'timestamp' field for when the trade was created
    -- Contract timing is tracked in the active_contracts table

    -- Add contract_data column (JSONB) - OPTIONAL, can be NULL
    -- This field is optional and can be omitted if you don't want to store contract metadata
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'trades' 
        AND column_name = 'contract_data'
    ) THEN
        ALTER TABLE public.trades ADD COLUMN contract_data JSONB;
    END IF;
END $$;

-- Create active_contracts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.active_contracts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    asset_id TEXT NOT NULL,
    asset_name TEXT NOT NULL,
    side TEXT CHECK (side IN ('buy', 'sell')) NOT NULL,
    entry_price NUMERIC NOT NULL,
    amount NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    payout NUMERIC NOT NULL,
    expires_at BIGINT NOT NULL,
    opened_at BIGINT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index on user_id for active_contracts for better query performance
CREATE INDEX IF NOT EXISTS idx_active_contracts_user_id ON public.active_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_active_contracts_expires_at ON public.active_contracts(expires_at);

