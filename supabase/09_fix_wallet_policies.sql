-- Fix missing policies for usdt_wallets
-- Users need to be able to create their own wallets (INSERT)
-- but NOT update them (balance updates should be server-side or admin only, 
-- though currently some client-side logic might exist, we restrict UPDATE to admins for safety 
-- unless we find client-side balance deduction is required).

-- 1. Allow Users to INSERT their own wallets
CREATE POLICY "Users can create own wallets" ON public.usdt_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Allow Admins to UPDATE wallets (already covered by RLS bypass in RPC, but good for direct admin panel edits)
CREATE POLICY "Admins can update wallets" ON public.usdt_wallets
    FOR UPDATE USING (is_admin());
