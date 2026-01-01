-- Fix missing INSERT policy for wallet_transactions
-- This allows users to create transaction records (deposits, withdrawals, sends)

CREATE POLICY "Users can create transactions" ON public.wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'wallet_transactions';
