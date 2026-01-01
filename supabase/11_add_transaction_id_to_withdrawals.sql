-- Add transaction_id column to withdrawals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'transaction_id') THEN
        ALTER TABLE public.withdrawals ADD COLUMN transaction_id UUID REFERENCES public.wallet_transactions(id);
    END IF;
END $$;
