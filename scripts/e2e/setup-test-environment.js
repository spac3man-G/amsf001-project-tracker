/**
 * E2E Test Environment Setup Script
 * Location: scripts/e2e/setup-test-environment.js
 * 
 * Creates an isolated test project and assigns all e2e.* test users.
 * This ensures E2E tests run against dedicated test data, not production.
 * 
 * Prerequisites:
 *   - Test users must exist (run scripts/create-test-users.js first)
 *   - SUPABASE_SERVICE_ROLE_KEY must be set
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/setup-test-environment.js
 * 
 * Output:
 *   - Creates "[TEST] E2E Test Project" in database
 *   - Assigns all 7 test users with correct roles
 *   - Creates resource records for each user
 *   - Saves project ID to scripts/e2e/.test-project-id
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Test project configuration (matches actual schema)
const TEST_PROJECT = {
  name: '[TEST] E2E Test Project',
  description: 'Automated testing environment - DO NOT USE FOR PRODUCTION',
  reference: 'E2E-TEST'
};

// Test users and their roles (must match create-test-users.js)
const TEST_USERS = [
  { email: 'e2e.admin@amsf001.test', role: 'admin', displayName: 'E2E Admin' },
  { email: 'e2e.supplier.pm@amsf001.test', role: 'supplier_pm', displayName: 'E2E Supplier PM' },
  { email: 'e2e.supplier.finance@amsf001.test', role: 'supplier_finance', displayName: 'E2E Supplier Finance' },
  { email: 'e2e.customer.pm@amsf001.test', role: 'customer_pm', displayName: 'E2E Customer PM' },
  { email: 'e2e.customer.finance@amsf001.test', role: 'customer_finance', displayName: 'E2E Customer Finance' },
  { email: 'e2e.contributor@amsf001.test', role: 'contributor', displayName: 'E2E Contributor' },
  { email: 'e2e.viewer@amsf001.test', role: 'viewer', displayName: 'E2E Viewer' },
];

// Validate environment
if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL or VITE_SUPABASE_URL');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Get your service role key from:');
  console.error('  Supabase Dashboard → Settings → API → service_role (secret)');
  console.error('');
  console.error('Run with:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY="your-key" node scripts/e2e/setup-test-environment.js');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('🚀 Setting up E2E Test Environment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  // Step 1: Check if test project already exists
  console.log('📁 Step 1: Checking for existing test project...');
  
  let { data: existingProject, error: findError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('name', TEST_PROJECT.name)
    .single();

  let projectId;

  if (existingProject) {
    console.log(`   Found existing project: ${existingProject.name}`);
    projectId = existingProject.id;
  } else {
    // Create new test project
    console.log('   Creating new test project...');
    const { data: newProject, error: createError } = await supabase
      .from('projects')
      .insert(TEST_PROJECT)
      .select('id, name')
      .single();

    if (createError) {
      console.error('❌ Failed to create test project:', createError.message);
      process.exit(1);
    }

    projectId = newProject.id;
    console.log(`   ✅ Created: ${newProject.name}`);
  }

  console.log(`   Project ID: ${projectId}`);
  console.log('');

  // Step 2: Look up all test users
  console.log('👥 Step 2: Looking up test users...');
  
  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Failed to list users:', listError.message);
    process.exit(1);
  }

  // Filter to e2e.* users
  const testUserEmails = TEST_USERS.map(u => u.email);
  const foundUsers = authUsers.users.filter(u => testUserEmails.includes(u.email));

  if (foundUsers.length === 0) {
    console.error('❌ No test users found! Run create-test-users.js first.');
    process.exit(1);
  }

  console.log(`   Found ${foundUsers.length} of ${TEST_USERS.length} test users`);
  
  // Build email → userId lookup
  const userLookup = {};
  foundUsers.forEach(u => {
    userLookup[u.email] = u.id;
  });

  // Check for missing users
  const missingUsers = TEST_USERS.filter(u => !userLookup[u.email]);
  if (missingUsers.length > 0) {
    console.warn('   ⚠️  Missing users:', missingUsers.map(u => u.email).join(', '));
  }
  console.log('');

  // Step 3: Assign users to test project
  console.log('🔐 Step 3: Assigning roles to test project...');
  
  for (const testUser of TEST_USERS) {
    const userId = userLookup[testUser.email];
    if (!userId) {
      console.log(`   ⏭️  Skipping ${testUser.email} (not found)`);
      continue;
    }

    // Upsert into user_projects
    const { error: assignError } = await supabase
      .from('user_projects')
      .upsert({
        project_id: projectId,
        user_id: userId,
        role: testUser.role
      }, {
        onConflict: 'user_id,project_id'
      });

    if (assignError) {
      console.log(`   ❌ ${testUser.email}: ${assignError.message}`);
    } else {
      console.log(`   ✅ ${testUser.role.padEnd(17)} → ${testUser.email}`);
    }
  }
  console.log('');

  // Step 4: Create resource records
  console.log('👤 Step 4: Creating resource records...');
  
  for (const testUser of TEST_USERS) {
    const userId = userLookup[testUser.email];
    if (!userId) continue;

    // Check if resource already exists
    const { data: existingResource } = await supabase
      .from('resources')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (existingResource) {
      console.log(`   ⏭️  Resource exists for ${testUser.displayName}`);
      continue;
    }

    // Create resource
    const { error: resourceError } = await supabase
      .from('resources')
      .insert({
        project_id: projectId,
        user_id: userId,
        name: testUser.displayName,
        email: testUser.email,
        role: testUser.role,
        resource_type: 'internal',
        sell_price: 150.00,
        cost_price: 100.00,
        resource_ref: `RES-E2E-${testUser.role.toUpperCase().replace('_', '-')}`
      });

    if (resourceError) {
      console.log(`   ❌ ${testUser.displayName}: ${resourceError.message}`);
    } else {
      console.log(`   ✅ Created resource: ${testUser.displayName}`);
    }
  }
  console.log('');

  // Step 5: Save project ID to file
  console.log('💾 Step 5: Saving project ID...');
  
  const projectIdFile = path.join(__dirname, '.test-project-id');
  fs.writeFileSync(projectIdFile, projectId);
  console.log(`   ✅ Saved to: ${projectIdFile}`);
  console.log('');

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ E2E Test Environment Setup Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`Project:  ${TEST_PROJECT.name}`);
  console.log(`ID:       ${projectId}`);
  console.log(`Users:    ${foundUsers.length} assigned`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run seed script:  npm run e2e:seed');
  console.log('  2. Run tests:        npm run e2e');
  console.log('');
}

// Run
main().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
