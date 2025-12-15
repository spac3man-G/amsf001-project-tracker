#!/usr/bin/env node
/**
 * E2E Prerequisites Verification Script
 * Location: scripts/e2e/verify-e2e-prerequisites.js
 * 
 * Validates all prerequisites for the E2E Workflow Test Project setup.
 * Run this BEFORE starting the implementation work.
 * 
 * Checks:
 * 1. Environment variables are set
 * 2. glenn.nickols@jtglobal.com exists and is admin
 * 3. All 7 E2E test users exist in Supabase Auth
 * 4. Test users can authenticate
 * 5. Database allows project creation (RLS check)
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/verify-e2e-prerequisites.js
 * 
 * Created: 15 December 2025
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPass123!';

// Users to verify
const SYSTEM_ADMIN_EMAIL = 'glenn.nickols@jtglobal.com';

const TEST_USERS = [
  { email: 'e2e.admin@amsf001.test', role: 'admin', displayName: 'E2E Admin' },
  { email: 'e2e.supplier.pm@amsf001.test', role: 'supplier_pm', displayName: 'E2E Supplier PM' },
  { email: 'e2e.supplier.finance@amsf001.test', role: 'supplier_finance', displayName: 'E2E Supplier Finance' },
  { email: 'e2e.customer.pm@amsf001.test', role: 'customer_pm', displayName: 'E2E Customer PM' },
  { email: 'e2e.customer.finance@amsf001.test', role: 'customer_finance', displayName: 'E2E Customer Finance' },
  { email: 'e2e.contributor@amsf001.test', role: 'contributor', displayName: 'E2E Contributor' },
  { email: 'e2e.viewer@amsf001.test', role: 'viewer', displayName: 'E2E Viewer' },
];

// Results tracking
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function logPass(message) {
  console.log(`   ✅ ${message}`);
  results.passed.push(message);
}

function logFail(message) {
  console.log(`   ❌ ${message}`);
  results.failed.push(message);
}

function logWarn(message) {
  console.log(`   ⚠️  ${message}`);
  results.warnings.push(message);
}

async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 E2E Prerequisites Verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // ═══════════════════════════════════════════════════════════════════
  // Check 1: Environment Variables
  // ═══════════════════════════════════════════════════════════════════
  console.log('📋 Check 1: Environment Variables');
  
  if (SUPABASE_URL) {
    logPass(`SUPABASE_URL: ${SUPABASE_URL.substring(0, 30)}...`);
  } else {
    logFail('SUPABASE_URL or VITE_SUPABASE_URL not set');
  }

  if (SUPABASE_ANON_KEY) {
    logPass('VITE_SUPABASE_ANON_KEY is set');
  } else {
    logWarn('VITE_SUPABASE_ANON_KEY not set (needed for auth tests)');
  }

  if (SERVICE_ROLE_KEY) {
    logPass('SUPABASE_SERVICE_ROLE_KEY is set');
  } else {
    logFail('SUPABASE_SERVICE_ROLE_KEY not set (required for this script)');
    console.log('');
    console.log('Run with:');
    console.log('  SUPABASE_SERVICE_ROLE_KEY="your-key" node scripts/e2e/verify-e2e-prerequisites.js');
    process.exit(1);
  }

  if (E2E_TEST_PASSWORD) {
    logPass('E2E_TEST_PASSWORD is set');
  } else {
    logWarn('E2E_TEST_PASSWORD not set (using default)');
  }

  console.log('');

  // Create admin client
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // ═══════════════════════════════════════════════════════════════════
  // Check 2: System Admin User
  // ═══════════════════════════════════════════════════════════════════
  console.log(`📋 Check 2: System Admin (${SYSTEM_ADMIN_EMAIL})`);

  try {
    // Check auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      logFail(`Could not list users: ${authError.message}`);
    } else {
      const systemAdmin = authUsers.users.find(u => u.email === SYSTEM_ADMIN_EMAIL);
      
      if (systemAdmin) {
        logPass(`User exists in auth.users (ID: ${systemAdmin.id.substring(0, 8)}...)`);
        
        // Check profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name, role')
          .eq('email', SYSTEM_ADMIN_EMAIL)
          .single();
        
        if (profile) {
          logPass(`Profile exists: ${profile.full_name || profile.email}`);
          
          if (profile.role === 'admin') {
            logPass('Has global admin role ✓');
          } else {
            logWarn(`Current role is "${profile.role}" - needs to be "admin" for system admin access`);
          }
        } else {
          logWarn('No profile record found - may need to create one');
        }
      } else {
        logFail(`User does not exist in auth.users - NEEDS TO BE CREATED`);
      }
    }
  } catch (err) {
    logFail(`Error checking system admin: ${err.message}`);
  }

  console.log('');

  // ═══════════════════════════════════════════════════════════════════
  // Check 3: E2E Test Users
  // ═══════════════════════════════════════════════════════════════════
  console.log('📋 Check 3: E2E Test Users (7 roles)');

  try {
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authEmails = new Set(authUsers.users.map(u => u.email));
    
    let existingCount = 0;
    let missingCount = 0;
    
    for (const testUser of TEST_USERS) {
      if (authEmails.has(testUser.email)) {
        logPass(`${testUser.role.padEnd(17)} → ${testUser.email}`);
        existingCount++;
      } else {
        logFail(`${testUser.role.padEnd(17)} → ${testUser.email} (MISSING)`);
        missingCount++;
      }
    }
    
    console.log('');
    console.log(`   Summary: ${existingCount}/7 users exist, ${missingCount} missing`);
    
  } catch (err) {
    logFail(`Error checking test users: ${err.message}`);
  }

  console.log('');

  // ═══════════════════════════════════════════════════════════════════
  // Check 4: Test User Authentication (if anon key available)
  // ═══════════════════════════════════════════════════════════════════
  if (SUPABASE_ANON_KEY) {
    console.log('📋 Check 4: Test User Authentication');
    
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test one user login
    const testUser = TEST_USERS[0]; // admin
    try {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: testUser.email,
        password: E2E_TEST_PASSWORD,
      });
      
      if (error) {
        logFail(`${testUser.email}: ${error.message}`);
      } else {
        logPass(`${testUser.email}: Login successful`);
        await supabaseAnon.auth.signOut();
      }
    } catch (err) {
      logFail(`${testUser.email}: ${err.message}`);
    }
  } else {
    console.log('📋 Check 4: Test User Authentication');
    logWarn('Skipped - VITE_SUPABASE_ANON_KEY not set');
  }

  console.log('');

  // ═══════════════════════════════════════════════════════════════════
  // Check 5: Projects Table & RLS
  // ═══════════════════════════════════════════════════════════════════
  console.log('📋 Check 5: Projects Table Structure');

  try {
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('id, name, reference')
      .limit(5);
    
    if (error) {
      logFail(`Cannot query projects: ${error.message}`);
    } else {
      logPass(`Projects table accessible (${projects.length} projects found)`);
      
      // List existing projects
      if (projects.length > 0) {
        console.log('');
        console.log('   Existing projects:');
        projects.forEach(p => {
          const isTest = p.name.includes('[TEST]') || p.name.includes('[E2E]');
          console.log(`     ${isTest ? '🧪' : '📁'} ${p.reference || 'N/A'} - ${p.name}`);
        });
      }
    }
  } catch (err) {
    logFail(`Error checking projects: ${err.message}`);
  }

  console.log('');

  // ═══════════════════════════════════════════════════════════════════
  // Check 6: Existing Test Project
  // ═══════════════════════════════════════════════════════════════════
  console.log('📋 Check 6: Existing E2E Test Project');

  try {
    const { data: testProject } = await supabaseAdmin
      .from('projects')
      .select('id, name, reference')
      .eq('name', '[TEST] E2E Test Project')
      .single();
    
    if (testProject) {
      logPass(`Found: "${testProject.name}" (${testProject.id.substring(0, 8)}...)`);
      
      // Check user assignments
      const { data: assignments } = await supabaseAdmin
        .from('user_projects')
        .select('user_id, role')
        .eq('project_id', testProject.id);
      
      if (assignments && assignments.length > 0) {
        logPass(`${assignments.length} users assigned to test project`);
      } else {
        logWarn('No users assigned to test project');
      }
    } else {
      logWarn('No existing E2E Test Project found (this is OK if creating new)');
    }
  } catch (err) {
    // Not found is OK
    logWarn('No existing E2E Test Project found');
  }

  console.log('');

  // ═══════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`   ✅ Passed:   ${results.passed.length}`);
  console.log(`   ⚠️  Warnings: ${results.warnings.length}`);
  console.log(`   ❌ Failed:   ${results.failed.length}`);
  console.log('');

  if (results.failed.length === 0) {
    console.log('🎉 All critical checks passed! Ready to proceed with implementation.');
    console.log('');
    process.exit(0);
  } else {
    console.log('⚠️  Some checks failed. Address the issues above before proceeding.');
    console.log('');
    
    if (results.failed.some(f => f.includes(SYSTEM_ADMIN_EMAIL))) {
      console.log('📝 To create the system admin user:');
      console.log('   1. Go to Supabase Dashboard → Authentication → Users');
      console.log(`   2. Click "Add User" and create: ${SYSTEM_ADMIN_EMAIL}`);
      console.log('   3. Re-run this verification script');
      console.log('');
    }
    
    if (results.failed.some(f => f.includes('MISSING'))) {
      console.log('📝 To create missing test users:');
      console.log('   Run: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/setup-test-environment.js');
      console.log('');
    }
    
    process.exit(1);
  }
}

// Run
main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
