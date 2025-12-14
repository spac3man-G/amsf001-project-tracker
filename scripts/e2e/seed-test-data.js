/**
 * E2E Test Data Seed Script
 * Location: scripts/e2e/seed-test-data.js
 * 
 * Seeds test data for E2E testing into the "[TEST] E2E Test Project".
 * Must run AFTER setup-test-environment.js
 * 
 * Prerequisites:
 *   - Test environment setup complete (run scripts/e2e/setup-test-environment.js first)
 *   - SUPABASE_SERVICE_ROLE_KEY must be set
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/seed-test-data.js
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

// Validate environment
if (!SUPABASE_URL) {
  console.error('❌ Missing SUPABASE_URL or VITE_SUPABASE_URL');
  process.exit(1);
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Run with:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY="your-key" node scripts/e2e/seed-test-data.js');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Load test project ID
function loadTestProjectId() {
  const projectIdFile = path.join(__dirname, '.test-project-id');
  
  if (!fs.existsSync(projectIdFile)) {
    console.error('❌ Test project ID file not found: ' + projectIdFile);
    console.error('');
    console.error('Run setup-test-environment.js first:');
    console.error('  SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/setup-test-environment.js');
    process.exit(1);
  }
  
  return fs.readFileSync(projectIdFile, 'utf-8').trim();
}

async function main() {
  const projectId = loadTestProjectId();
  
  console.log('🌱 Seeding E2E Test Data');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`Project ID: ${projectId}`);
  console.log('');

  let seededCount = 0;

  try {
    // Step 1: Seed Milestones
    console.log('🎯 Step 1: Seeding Milestones...');
    const milestones = [
      {
        project_id: projectId,
        name: '[TEST] Phase 1 - Planning',
        description: 'Initial planning and requirements gathering',
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in_progress'
      },
      {
        project_id: projectId,
        name: '[TEST] Phase 2 - Development',
        description: 'Core development phase',
        target_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      },
      {
        project_id: projectId,
        name: '[TEST] Phase 3 - Testing',
        description: 'QA and testing phase',
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      }
    ];
    
    for (const milestone of milestones) {
      const { error } = await supabase
        .from('milestones')
        .upsert(milestone, { onConflict: 'project_id,name' });
      
      if (error) {
        console.log(`   ⚠️  ${milestone.name}: ${error.message}`);
      } else {
        seededCount++;
        console.log(`   ✅ ${milestone.name}`);
      }
    }
    console.log('');

    // Step 2: Seed Deliverables
    console.log('📦 Step 2: Seeding Deliverables...');
    
    // Get milestone IDs first
    const { data: createdMilestones } = await supabase
      .from('milestones')
      .select('id, name')
      .eq('project_id', projectId);
    
    const milestoneMap = {};
    createdMilestones?.forEach(m => { milestoneMap[m.name] = m.id; });

    const deliverables = [
      {
        project_id: projectId,
        milestone_id: milestoneMap['[TEST] Phase 1 - Planning'],
        name: '[TEST] Requirements Document',
        description: 'Complete requirements specification',
        status: 'pending'
      },
      {
        project_id: projectId,
        milestone_id: milestoneMap['[TEST] Phase 1 - Planning'],
        name: '[TEST] Project Plan',
        description: 'Detailed project timeline and resource allocation',
        status: 'pending'
      },
      {
        project_id: projectId,
        milestone_id: milestoneMap['[TEST] Phase 2 - Development'],
        name: '[TEST] Core Module',
        description: 'Main application module',
        status: 'pending'
      }
    ];
    
    for (const deliverable of deliverables) {
      if (!deliverable.milestone_id) {
        console.log(`   ⏭️  Skipping ${deliverable.name} (no milestone)`);
        continue;
      }
      
      const { error } = await supabase
        .from('deliverables')
        .upsert(deliverable, { onConflict: 'project_id,name' });
      
      if (error) {
        console.log(`   ⚠️  ${deliverable.name}: ${error.message}`);
      } else {
        seededCount++;
        console.log(`   ✅ ${deliverable.name}`);
      }
    }
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ E2E Test Data Seeding Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`Records seeded: ${seededCount}`);
    console.log('');
    console.log('Next steps:');
    console.log('  Run tests: npm run e2e');
    console.log('');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

// Run
main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
