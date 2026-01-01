-- Promote the admin user to the correct role
-- Run this in Supabase SQL Editor

UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@bexprot.com';

-- Verify the update
SELECT email, role FROM public.users WHERE email = 'admin@bexprot.com';
