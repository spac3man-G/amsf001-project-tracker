/**
 * Create E2E Test Users Script
 * Location: scripts/create-test-users.js
 * 
 * Creates test users for all 7 roles using Supabase Admin API.
 * 
 * Usage:
 *   node scripts/create-test-users.js
 * 
 * Requires:
 *   - SUPABASE_URL (from .env or environment)
 *   - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard → Settings → API)
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('');
  console.error('Please set:');
  console.error('  SUPABASE_URL (or VITE_SUPABASE_URL)');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('You can find the Service Role Key in:');
  console.error('  Supabase Dashboard → Settings → API → service_role (secret)');
  console.error('');
  console.error('Run with:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY="your-key-here" node scripts/create-test-users.js');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users to create
const TEST_USERS = [
  { email: 'e2e.admin@amsf001.test', role: 'admin' },
  { email: 'e2e.supplier.pm@amsf001.test', role: 'supplier_pm' },
  { email: 'e2e.supplier.finance@amsf001.test', role: 'supplier_finance' },
  { email: 'e2e.customer.pm@amsf001.test', role: 'customer_pm' },
  { email: 'e2e.customer.finance@amsf001.test', role: 'customer_finance' },
  { email: 'e2e.contributor@amsf001.test', role: 'contributor' },
  { email: 'e2e.viewer@amsf001.test', role: 'viewer' },
];

const TEST_PASSWORD = 'TestPass123!';

async function createTestUsers() {
  console.log('🚀 Creating E2E Test Users...');
  console.log('');

  // Step 1: Get the first project (or create one if needed)
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .limit(1);

  if (projectError) {
    console.error('❌ Error fetching projects:', projectError.message);
    process.exit(1);
  }

  if (!projects || projects.length === 0) {
    console.error('❌ No projects found! Create a project first.');
    process.exit(1);
  }

  const projectId = projects[0].id;
  const projectName = projects[0].name;
  console.log(`📁 Using project: ${projectName} (${projectId})`);
  console.log('');

  // Step 2: Create each user
  const results = [];

  for (const user of TEST_USERS) {
    process.stdout.write(`Creating ${user.email}... `);

    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);

      let userId;

      if (existingUser) {
        console.log('already exists ✓');
        userId = existingUser.id;
      } else {
        // Create user via Admin API
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: TEST_PASSWORD,
          email_confirm: true, // Auto-confirm
          user_metadata: {
            full_name: `E2E Test ${user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
            role: user.role
          }
        });

        if (createError) {
          console.log(`❌ Error: ${createError.message}`);
          results.push({ ...user, success: false, error: createError.message });
          continue;
        }

        userId = newUser.user.id;
        console.log('created ✓');
      }

      // Step 3: Assign user to project with role
      const { error: roleError } = await supabase
        .from('project_users')
        .upsert({
          project_id: projectId,
          user_id: userId,
          role: user.role
        }, {
          onConflict: 'project_id,user_id'
        });

      if (roleError) {
        console.log(`  ⚠️  Role assignment warning: ${roleError.message}`);
      } else {
        process.stdout.write(`  → Assigned role: ${user.role} ✓\n`);
      }

      results.push({ ...user, success: true, userId });

    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
      results.push({ ...user, success: false, error: err.message });
    }
  }

  // Summary
  console.log('');
  console.log('========================================');
  console.log('  Summary');
  console.log('========================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Created/Updated: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log('');

  if (successful.length > 0) {
    console.log('Test Credentials:');
    console.log('─────────────────────────────────────────');
    successful.forEach(u => {
      console.log(`  ${u.role.padEnd(18)} → ${u.email}`);
    });
    console.log('─────────────────────────────────────────');
    console.log(`  Password (all): ${TEST_PASSWORD}`);
  }

  if (failed.length > 0) {
    console.log('');
    console.log('Failed users:');
    failed.forEach(u => {
      console.log(`  ${u.email}: ${u.error}`);
    });
  }

  console.log('');
  console.log('🎉 Done! You can now run E2E tests with:');
  console.log('');
  console.log(`  E2E_TEST_EMAIL=e2e.admin@amsf001.test E2E_TEST_PASSWORD=${TEST_PASSWORD} npm run test:e2e:headed`);
  console.log('');
}

// Run
createTestUsers().catch(console.error);
