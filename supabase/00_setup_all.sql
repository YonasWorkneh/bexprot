-- ==========================================
-- COMPLETE SUPABASE SETUP SCRIPT
-- ==========================================
-- Run this file to set up the entire backend
-- Or run individual files in order (01, 02, 03, 04, 05)
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\echo '================================================'
\echo 'Starting Supabase Backend Setup...'
\echo '================================================'

\echo 'Step 1/5: Creating Tables...'
\i 01_tables.sql

\echo 'Step 2/5: Setting up Row Level Security...'
\i 02_policies.sql

\echo 'Step 3/5: Creating Backend Functions...'
\i 03_functions.sql

\echo 'Step 4/5: Inserting Seed Data...'
\i 04_seed.sql

\echo 'Step 5/5: Creating Storage Buckets...'
\i 05_storage.sql

\echo '================================================'
\echo 'Setup Complete! ✓'
\echo '================================================'
\echo 'Next Steps:'
\echo '1. Update deposit addresses with real wallet addresses'
\echo '2. Create your first admin user'
\echo '3. Configure environment variables in your app'
\echo '4. Test the application'
\echo '================================================'
