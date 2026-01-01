/**
 * DEPOSIT REPORTING DEBUG SCRIPT
 * 
 * This script tests the deposit reporting flow to identify where it's failing.
 * Run this in the browser console to diagnose the issue.
 */

// Test 1: Check Supabase connection
async function testSupabaseConnection() {
    console.log('=== TEST 1: Supabase Connection ===');
    const { createClient } = window.supabase || {};
    if (!createClient) {
        console.error('❌ Supabase client not loaded');
        return false;
    }
    console.log('✅ Supabase client loaded');
    return true;
}

// Test 2: Check authentication
async function testAuthentication() {
    console.log('\n=== TEST 2: Authentication ===');
    const supabase = window.supabase;
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
        console.error('❌ Auth error:', error);
        return false;
    }
    
    if (!user) {
        console.error('❌ No user logged in');
        return false;
    }
    
    console.log('✅ User authenticated:', user.email);
    console.log('   User ID:', user.id);
    return user;
}

// Test 3: Test crypto_deposits table access
async function testCryptoDepositsAccess(userId) {
    console.log('\n=== TEST 3: crypto_deposits Table Access ===');
    const supabase = window.supabase;
    
    // Try to read from crypto_deposits
    const { data, error } = await supabase
        .from('crypto_deposits')
        .select('*')
        .eq('user_id', userId)
        .limit(1);
    
    if (error) {
        console.error('❌ Cannot read crypto_deposits:', error.message);
        console.error('   Code:', error.code);
        console.error('   Details:', error.details);
        return false;
    }
    
    console.log('✅ Can read crypto_deposits');
    console.log('   Existing deposits:', data.length);
    return true;
}

// Test 4: Test insert to crypto_deposits
async function testCryptoDepositsInsert(userId) {
    console.log('\n=== TEST 4: crypto_deposits Insert Test ===');
    const supabase = window.supabase;
    
    const testData = {
        user_id: userId,
        deposit_code: 'TEST-' + Date.now(),
        currency: 'BTC',
        deposit_address: 'test_address',
        transaction_hash: 'test_hash_' + Date.now(),
        user_reported_amount: 0.001,
        amount: 0.001,
        amount_usd: 50,
        status: 'reported',
        reported_at: new Date().toISOString()
    };
    
    console.log('Attempting insert with data:', testData);
    
    const { data, error } = await supabase
        .from('crypto_deposits')
        .insert(testData)
        .select()
        .single();
    
    if (error) {
        console.error('❌ Insert failed:', error.message);
        console.error('   Code:', error.code);
        console.error('   Details:', error.details);
        console.error('   Hint:', error.hint);
        
        // Check if it's an RLS policy issue
        if (error.code === '42501') {
            console.error('\n⚠️  RLS POLICY ISSUE DETECTED');
            console.error('   The user does not have permission to insert into crypto_deposits');
            console.error('   Check that RLS policies allow authenticated users to insert');
        }
        
        // Check if it's a missing column
        if (error.code === '42703') {
            console.error('\n⚠️  MISSING COLUMN DETECTED');
            console.error('   The crypto_deposits table is missing a required column');
            console.error('   Run the schema_update.sql script to add missing columns');
        }
        
        return false;
    }
    
    console.log('✅ Insert successful!');
    console.log('   Deposit ID:', data.id);
    console.log('   Deposit code:', data.deposit_code);
    
    // Clean up test record
    await supabase.from('crypto_deposits').delete().eq('id', data.id);
    console.log('   Test record cleaned up');
    
    return true;
}

// Test 5: Check deposit-proofs storage bucket
async function testDepositProofsStorage(userId) {
    console.log('\n=== TEST 5: deposit-proofs Storage Bucket ===');
    const supabase = window.supabase;
    
    // Try to list buckets
    const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
    
    if (bucketsError) {
        console.error('❌ Cannot list storage buckets:', bucketsError);
        return false;
    }
    
    const depositProofsBucket = buckets.find(b => b.name === 'deposit-proofs');
    if (!depositProofsBucket) {
        console.error('❌ deposit-proofs bucket does not exist');
        console.error('   Run the schema_update.sql script to create it');
        return false;
    }
    
    console.log('✅ deposit-proofs bucket exists');
    return true;
}

// Run all tests
async function runAllTests() {
    console.log('🔍 STARTING DEPOSIT REPORTING DEBUG TESTS\n');
    
    const connectionOk = await testSupabaseConnection();
    if (!connectionOk) return;
    
    const user = await testAuthentication();
    if (!user) {
        console.log('\n⚠️  DIAGNOSIS: User is not logged in');
        console.log('   ACTION: Log in to the application first');
        return;
    }
    
    const canRead = await testCryptoDepositsAccess(user.id);
    if (!canRead) {
        console.log('\n⚠️  DIAGNOSIS: Cannot read from crypto_deposits table');
        console.log('   ACTION: Run the schema_update.sql script to set up RLS policies');
        return;
    }
    
    const canInsert = await testCryptoDepositsInsert(user.id);
    if (!canInsert) {
        console.log('\n⚠️  DIAGNOSIS: Cannot insert into crypto_deposits table');
        console.log('   ACTION: Run the schema_update.sql script');
        return;
    }
    
    const storageOk = await testDepositProofsStorage(user.id);
    if (!storageOk) {
        console.log('\n⚠️  DIAGNOSIS: Storage bucket missing');
        console.log('   ACTION: Run the schema_update.sql script');
        return;
    }
    
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('   The deposit reporting should work correctly.');
    console.log('   If it still fails, check the browser console for errors when submitting.');
}

// Export for browser console use
window.debugDepositReporting = runAllTests;

console.log('Debug script loaded. Run debugDepositReporting() in the console to test.');
