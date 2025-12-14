/**
 * E2E Test Data Cleanup Script
 * Location: scripts/e2e/cleanup-test-data.js
 * 
 * Cleans up test data from the "[TEST] E2E Test Project".
 * 
 * Usage:
 *   # Clean test data only (keep project and resources)
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/cleanup-test-data.js
 *   
 *   # Full cleanup including project
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/cleanup-test-data.js --full
 *   
 *   # Skip confirmation
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/cleanup-test-data.js --yes
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse arguments
const args = process.argv.slice(2);
const fullCleanup = args.includes('--full');
const skipConfirm = args.includes('--yes');

// Validate environment
if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL or VITE_SUPABASE_URL');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Prompt for confirmation
async function confirm(message) {
  if (skipConfirm) return true;
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`${message} (y/N): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Find test project
async function findTestProject() {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('name', '[TEST] E2E Test Project')
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error finding test project:', error.message);
    return null;
  }
  
  return data?.id || null;
}

async function main() {
  console.log('🧹 E2E Test Data Cleanup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  const projectId = await findTestProject();
  
  if (!projectId) {
    console.log('ℹ️  Test project not found. Nothing to clean up.');
    process.exit(0);
  }

  console.log(`Project ID: ${projectId}`);
  console.log(`Mode: ${fullCleanup ? 'Full cleanup (including project)' : 'Data only'}`);
  console.log('');

  // Tables to clean (in order due to foreign keys)
  const tables = ['timesheets', 'expenses', 'deliverables', 'milestones'];
  
  // Count records
  console.log('📊 Analyzing test data...');
  let totalRecords = 0;
  
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);
    
    if (count > 0) {
      console.log(`   ${table}: ${count} records`);
      totalRecords += count;
    }
  }
  
  if (totalRecords === 0) {
    console.log('   No test data found.');
    console.log('');
    process.exit(0);
  }
  
  console.log('');
  console.log(`Total: ${totalRecords} records to delete`);
  console.log('');

  // Confirm
  const confirmed = await confirm('⚠️  Proceed with cleanup?');
  if (!confirmed) {
    console.log('❌ Cleanup cancelled.');
    process.exit(0);
  }

  console.log('');
  console.log('🗑️  Deleting test data...');
  
  let deletedCount = 0;
  
  for (const table of tables) {
    const { error, count } = await supabase
      .from(table)
      .delete()
      .eq('project_id', projectId);
    
    if (error) {
      console.log(`   ⚠️  ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ Cleaned ${table}`);
      deletedCount++;
    }
  }

  // Full cleanup - delete project too
  if (fullCleanup) {
    console.log('');
    console.log('🗑️  Full cleanup - removing project...');
    
    // Delete resources first
    await supabase.from('resources').delete().eq('project_id', projectId);
    console.log('   ✅ Removed resources');
    
    // Delete user_projects
    await supabase.from('user_projects').delete().eq('project_id', projectId);
    console.log('   ✅ Removed user assignments');
    
    // Delete project
    await supabase.from('projects').delete().eq('id', projectId);
    console.log('   ✅ Removed project');
    
    // Remove project ID file
    const projectIdFile = path.join(__dirname, '.test-project-id');
    if (fs.existsSync(projectIdFile)) {
      fs.unlinkSync(projectIdFile);
      console.log('   ✅ Removed .test-project-id file');
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Cleanup Complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  if (fullCleanup) {
    console.log('Next steps:');
    console.log('  1. Run setup: npm run e2e:setup');
    console.log('  2. Seed data: npm run e2e:seed');
  } else {
    console.log('Next steps:');
    console.log('  Seed fresh data: npm run e2e:seed');
  }
  console.log('');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
