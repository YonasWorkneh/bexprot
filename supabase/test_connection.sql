-- Test Supabase Connection
-- Run this in your Supabase SQL Editor to verify setup

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 
    'usdt_wallets', 
    'crypto_deposits', 
    'withdrawals', 
    'kyc_submissions',
    'system_settings'
)
ORDER BY table_name;

-- 2. Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_user_full_details',
    'admin_adjust_balance',
    'is_admin'
)
ORDER BY routine_name;

-- 3. Check if storage buckets exist
SELECT name, public 
FROM storage.buckets 
WHERE name IN ('avatars', 'kyc-documents', 'deposit-proofs')
ORDER BY name;

-- 4. Check system settings
SELECT * FROM public.system_settings LIMIT 1;

-- 5. Count existing users
SELECT COUNT(*) as total_users FROM public.users;
