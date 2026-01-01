# Supabase Backend Setup Guide

This guide will help you set up the complete backend for your trading platform using Supabase.

## Prerequisites

- A Supabase project (create one at [supabase.com](https://supabase.com))
- Project URL and anon/service keys
- Access to Supabase SQL Editor and Storage

## Step 1: Run SQL Scripts

Execute the SQL files in order in your Supabase SQL Editor:

### 1.1 Tables Schema

```bash
File: supabase/01_tables.sql
```

This creates all database tables:

- `users` - User profiles and authentication
- `usdt_wallets` - User wallet balances
- `crypto_deposits` - Deposit tracking
- `withdrawals` - Withdrawal requests
- `wallet_transactions` - Transaction history
- `kyc_submissions` - KYC verification data
- `trades`, `orders`, `portfolio` - Trading data
- `system_settings` - Platform configuration
- `notifications` - User notifications
- `crypto_deposit_addresses` - System deposit addresses

### 1.2 Row Level Security Policies

```bash
File: supabase/02_policies.sql
```

This sets up security policies ensuring:

- Users can only access their own data
- Admins have full access to all data
- Public can view active deposit addresses

### 1.3 Backend Functions (RPCs)

```bash
File: supabase/03_functions.sql
```

This creates server-side functions:

- `get_user_full_details(user_id)` - Admin: Get complete user info
- `admin_adjust_balance(user_id, amount, type, description)` - Admin: Adjust balances
- `settle_expired_contracts()` - Automated contract settlement (placeholder)

### 1.4 Seed Data

```bash
File: supabase/04_seed.sql
```

This inserts initial data:

- Default system settings
- Sample deposit addresses (replace with real ones)

### 1.5 Storage Buckets

```bash
File: supabase/05_storage.sql
```

This creates storage buckets:

- `avatars` - Public profile pictures
- `kyc-documents` - Private KYC documents
- `deposit-proofs` - Private transaction screenshots

## Step 2: Configure Environment Variables

Create or update your `.env` file:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Step 3: Update Deposit Addresses

In Supabase SQL Editor, update the deposit addresses with your real wallet addresses:

```sql
UPDATE public.crypto_deposit_addresses
SET address = 'YOUR_REAL_ADDRESS'
WHERE currency = 'USDT' AND network = 'TRC20';

-- Repeat for other currencies
```

## Step 4: Create First Admin User

After registering a user account, promote them to admin:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your_admin_email@example.com';
```

## Step 5: Verify Setup

1. **Test User Registration**: Create a new account
2. **Test KYC Submission**: Upload documents via `/kyc`
3. **Test Deposits**: Report a deposit via wallet page
4. **Test Admin Panel**: Login to `/admin/dashboard` with admin account
5. **Test Balance Adjustment**: Use Admin panel to adjust a user's balance

## Features Overview

### User Features

- ✅ Registration & Authentication
- ✅ KYC Submission with document upload
- ✅ Deposit reporting with screenshot proof
- ✅ Withdrawal requests
- ✅ Wallet transactions & history
- ✅ Trading (Spot & Contracts)
- ✅ Portfolio management
- ✅ Notifications

### Admin Features

- ✅ User management dashboard
- ✅ KYC review & approval/rejection
- ✅ Deposit verification & crediting
- ✅ Withdrawal approval/rejection
- ✅ Manual balance adjustments
- ✅ System configuration
- ✅ User activity monitoring

### System Configuration

Admins can toggle:

- Contract trading on/off
- Contract outcome mode (fair/always_win/always_loss)
- Withdrawal enabled/disabled
- Minimum deposit/withdrawal amounts
- Maintenance mode

## Security Notes

⚠️ **Important Security Considerations:**

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Admin Functions**: Use `SECURITY DEFINER` and check `is_admin()`
3. **File Uploads**: KYC and deposit proofs are private buckets
4. **API Keys**: Never expose service role key in frontend
5. **Validation**: Always validate user input on both client and server

## Troubleshooting

### Issue: "relation does not exist"

- Ensure you ran `01_tables.sql` first
- Check that you're in the correct Supabase project

### Issue: "permission denied for table"

- Run `02_policies.sql` to set up RLS policies
- Verify user authentication is working

### Issue: "function does not exist"

- Run `03_functions.sql`
- Check function names match exactly

### Issue: Storage upload fails

- Run `05_storage.sql` to create buckets
- Verify bucket policies are correct

## Next Steps

1. Customize deposit addresses in `04_seed.sql`
2. Configure email templates in Supabase Auth settings
3. Set up Edge Functions for automated tasks (optional)
4. Configure webhooks for external integrations (optional)
5. Set up monitoring and alerts

## Support

For issues or questions:

1. Check Supabase logs in Dashboard
2. Review browser console for errors
3. Verify all SQL scripts ran successfully
4. Check RLS policies are not blocking legitimate access
