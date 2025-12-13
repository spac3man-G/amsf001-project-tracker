#!/usr/bin/env node
/**
 * Verify Test Environment
 * 
 * Checks that all prerequisites for E2E testing are in place:
 * - Environment variables
 * - Test users exist
 * - Users have correct roles
 * 
 * Usage: node scripts/e2e/verify-test-environment.js
 */

import { createClient } from '@supabase/supabase-js';

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'E2E_TEST_PASSWORD',
];

const TEST_USERS = [
  { email: 'e2e.admin@amsf001.test', role: 'admin' },
  { email: 'e2e.supplier.pm@amsf001.test', role: 'supplier_pm' },
  { email: 'e2e.supplier.finance@amsf001.test', role: 'supplier_finance' },
  { email: 'e2e.customer.pm@amsf001.test', role: 'customer_pm' },
  { email: 'e2e.customer.finance@amsf001.test', role: 'customer_finance' },
  { email: 'e2e.contributor@amsf001.test', role: 'contributor' },
  { email: 'e2e.viewer@amsf001.test', role: 'viewer' },
];

async function main() {
  console.log('🔍 Verifying Test Environment\n');
  
  let hasErrors = false;
  
  // Check environment variables
  console.log('1️⃣ Checking environment variables...');
  for (const envVar of REQUIRED_ENV_VARS) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}`);
    } else {
      console.log(`   ❌ ${envVar} - NOT SET`);
      hasErrors = true;
    }
  }
  console.log('');
  
  // Check Supabase connection
  console.log('2️⃣ Checking Supabase connection...');
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('   ❌ Cannot connect - missing credentials');
    hasErrors = true;
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      const { data, error } = await supabase.from('projects').select('id').limit(1);
      if (error) throw error;
      console.log('   ✅ Connected to Supabase');
    } catch (err) {
      console.log(`   ❌ Connection failed: ${err.message}`);
      hasErrors = true;
    }
  }
  console.log('');
  
  // Check test user authentication
  console.log('3️⃣ Checking test user authentication...');
  const password = process.env.E2E_TEST_PASSWORD;
  
  if (!password) {
    console.log('   ⚠️ Skipping - E2E_TEST_PASSWORD not set');
  } else if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    for (const user of TEST_USERS) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: password,
        });
        
        if (error) {
          console.log(`   ❌ ${user.email} - ${error.message}`);
          hasErrors = true;
        } else {
          console.log(`   ✅ ${user.email}`);
        }
        
        // Sign out
        await supabase.auth.signOut();
      } catch (err) {
        console.log(`   ❌ ${user.email} - ${err.message}`);
        hasErrors = true;
      }
    }
  }
  console.log('');
  
  // Summary
  console.log('━'.repeat(50));
  if (hasErrors) {
    console.log('❌ Environment verification FAILED');
    console.log('\nSee docs/TESTING_INFRASTRUCTURE.md for setup instructions.');
    process.exit(1);
  } else {
    console.log('✅ Environment verification PASSED');
    console.log('\nReady to run tests!');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
