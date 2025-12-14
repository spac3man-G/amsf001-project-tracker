/**
 * Assign Roles to E2E Test Users
 * Location: scripts/assign-test-roles.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ljqpmrcqxzgcfojrkxce.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_USERS = [
  { email: 'e2e.admin@amsf001.test', role: 'admin', name: 'E2E Admin' },
  { email: 'e2e.supplier.pm@amsf001.test', role: 'supplier_pm', name: 'E2E Supplier PM' },
  { email: 'e2e.supplier.finance@amsf001.test', role: 'supplier_finance', name: 'E2E Supplier Finance' },
  { email: 'e2e.customer.pm@amsf001.test', role: 'customer_pm', name: 'E2E Customer PM' },
  { email: 'e2e.customer.finance@amsf001.test', role: 'customer_finance', name: 'E2E Customer Finance' },
  { email: 'e2e.contributor@amsf001.test', role: 'contributor', name: 'E2E Contributor' },
  { email: 'e2e.viewer@amsf001.test', role: 'viewer', name: 'E2E Viewer' },
];

async function assignRoles() {
  console.log('🔧 Assigning roles to E2E test users...\n');

  // Get all users
  const { data: authData } = await supabase.auth.admin.listUsers();
  const allUsers = authData?.users || [];

  for (const testUser of TEST_USERS) {
    const authUser = allUsers.find(u => u.email === testUser.email);
    
    if (!authUser) {
      console.log(`❌ ${testUser.email} - not found in auth.users`);
      continue;
    }

    // Upsert profile with role
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email: testUser.email,
        full_name: testUser.name,
        role: testUser.role,
        is_test_user: true,
        must_change_password: false
      }, { onConflict: 'id' });

    if (error) {
      console.log(`❌ ${testUser.email} - ${error.message}`);
    } else {
      console.log(`✅ ${testUser.email} → ${testUser.role}`);
    }
  }

  console.log('\n🎉 Done!');
}

assignRoles().catch(console.error);
