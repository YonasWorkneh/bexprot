-- Ensure users can update their own kyc_status in the users table
-- The existing policy "Users can update own profile" might be too broad or restricted by other triggers.
-- We'll explicitly allow updating kyc_status if needed, but usually the generic update policy covers it.
-- Let's verify the generic policy exists and is correct.

-- Re-apply the update policy just in case
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Also ensure kyc_submissions allows inserts (already checked in 02_policies.sql, but good to double check)
-- The existing policy "Users can submit kyc" covers this.
