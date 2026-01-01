-- ==========================================
-- STORAGE BUCKETS
-- ==========================================

-- 1. Avatars (Public Profile Pictures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view avatars
CREATE POLICY "Avatar Public View" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- Policy: Users can upload their own avatar
CREATE POLICY "Avatar User Upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid() = owner
    );

-- Policy: Users can update their own avatar
CREATE POLICY "Avatar User Update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid() = owner
    );


-- 2. KYC Documents (Private - Sensitive Data)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own KYC docs
CREATE POLICY "KYC User Upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' AND
        auth.uid() = owner
    );

-- Policy: Users can view their own KYC docs
CREATE POLICY "KYC User View" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND
        auth.uid() = owner
    );

-- Policy: Admins can view all KYC docs
-- Note: This relies on the is_admin() function defined in 02_policies.sql
CREATE POLICY "KYC Admin View" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND
        public.is_admin()
    );


-- 3. Deposit Proofs (Private - Transaction Screenshots)
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-proofs', 'deposit-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload proofs
CREATE POLICY "Deposit User Upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'deposit-proofs' AND
        auth.uid() = owner
    );

-- Policy: Users can view their own proofs
CREATE POLICY "Deposit User View" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'deposit-proofs' AND
        auth.uid() = owner
    );

-- Policy: Admins can view all proofs
CREATE POLICY "Deposit Admin View" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'deposit-proofs' AND
        public.is_admin()
    );
