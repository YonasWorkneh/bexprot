-- ==========================================
-- FIX RLS POLICIES FOR KYC & DEPOSITS
-- ==========================================

-- 1. KYC SUBMISSIONS
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own submissions
DROP POLICY IF EXISTS "Users can view own kyc" ON public.kyc_submissions;
CREATE POLICY "Users can view own kyc" ON public.kyc_submissions
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own submissions
DROP POLICY IF EXISTS "Users can insert own kyc" ON public.kyc_submissions;
CREATE POLICY "Users can insert own kyc" ON public.kyc_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own submissions (if needed, e.g. re-upload)
DROP POLICY IF EXISTS "Users can update own kyc" ON public.kyc_submissions;
CREATE POLICY "Users can update own kyc" ON public.kyc_submissions
    FOR UPDATE USING (auth.uid() = user_id);


-- 2. CRYPTO DEPOSITS
ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own deposits
DROP POLICY IF EXISTS "Users can view own deposits" ON public.crypto_deposits;
CREATE POLICY "Users can view own deposits" ON public.crypto_deposits
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own deposits
DROP POLICY IF EXISTS "Users can insert own deposits" ON public.crypto_deposits;
CREATE POLICY "Users can insert own deposits" ON public.crypto_deposits
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 3. STORAGE POLICIES (Re-applying to be sure)

-- KYC Documents Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload kyc documents" ON storage.objects;
CREATE POLICY "Users can upload kyc documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can view own kyc documents" ON storage.objects;
CREATE POLICY "Users can view own kyc documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'kyc-documents' AND auth.uid() = owner);
    
-- Also allow public read if that's how admin views it (or admin specific policy)
-- For now, let's allow public read for simplicity in admin panel if signed URLs aren't used everywhere
DROP POLICY IF EXISTS "Public read kyc documents" ON storage.objects;
CREATE POLICY "Public read kyc documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'kyc-documents');


-- Deposits Bucket (for screenshots)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('deposits', 'deposits', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload deposit proofs" ON storage.objects;
CREATE POLICY "Users can upload deposit proofs" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'deposits' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Public read deposit proofs" ON storage.objects;
CREATE POLICY "Public read deposit proofs" ON storage.objects
    FOR SELECT USING (bucket_id = 'deposits');
