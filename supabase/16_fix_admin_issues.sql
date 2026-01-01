-- Fix Admin Issues Migration

-- 1. Fix Withdrawals Table (Missing 'type' column)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'withdrawals' AND column_name = 'type') THEN
        ALTER TABLE public.withdrawals ADD COLUMN type TEXT DEFAULT 'withdrawal' CHECK (type IN ('withdrawal', 'send'));
    END IF;
END $$;

-- 2. Fix System Settings Policies (Missing INSERT for admins)
-- Drop existing policies to be safe and recreate them
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;

CREATE POLICY "Admins can update system settings" ON public.system_settings
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert system settings" ON public.system_settings
    FOR INSERT WITH CHECK (is_admin());

-- 3. Enable Realtime for Admin Tables
-- We need to set REPLICA IDENTITY to FULL for tables we want to listen to changes on, 
-- especially if we want the old values in UPDATE events (though usually default is enough for ID).
-- But explicitly enabling publication is key if not already done.

-- Ensure tables are in the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crypto_deposits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;

-- Set Replica Identity to FULL to ensure we get all columns in realtime payloads if needed
ALTER TABLE public.withdrawals REPLICA IDENTITY FULL;
ALTER TABLE public.crypto_deposits REPLICA IDENTITY FULL;
ALTER TABLE public.system_settings REPLICA IDENTITY FULL;
