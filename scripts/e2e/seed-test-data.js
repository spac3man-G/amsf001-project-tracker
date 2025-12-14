/**
 * E2E Test Data Seed Script
 * Location: scripts/e2e/seed-test-data.js
 * 
 * Seeds comprehensive test data for E2E testing into the "[TEST] E2E Test Project".
 * Must run AFTER setup-test-environment.js
 * 
 * Prerequisites:
 *   - Test environment setup complete (run scripts/e2e/setup-test-environment.js first)
 *   - SUPABASE_SERVICE_ROLE_KEY must be set
 * 
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/e2e/seed-test-data.js
 * 
 * Created: 14 December 2025
 * Updated: Schema-aligned version
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

// Helper functions
function daysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function daysAgo(days) {
  return daysFromNow(-days);
}

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
  
  console.log('🌱 Seeding E2E Test Data (Schema-Aligned)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`Project ID: ${projectId}`);
  console.log('');

  const stats = {
    milestones: 0,
    deliverables: 0,
    timesheets: 0,
    expenses: 0,
    kpis: 0,
    qualityStandards: 0,
    variations: 0,
    raidItems: 0,
    partners: 0
  };

  try {
    // ═══════════════════════════════════════════════════════════════════
    // Step 1: Get existing resources (created by setup-test-environment.js)
    // ═══════════════════════════════════════════════════════════════════
    console.log('📋 Step 1: Loading existing resources...');
    
    const { data: resources, error: resError } = await supabase
      .from('resources')
      .select('id, name, email, role, user_id')
      .eq('project_id', projectId);
    
    if (resError) {
      console.error('   ❌ Failed to load resources:', resError.message);
      process.exit(1);
    }
    
    if (!resources || resources.length === 0) {
      console.error('   ❌ No resources found. Run setup-test-environment.js first.');
      process.exit(1);
    }
    
    console.log(`   ✅ Found ${resources.length} resources`);
    
    // Build resource lookup by role
    const resourceByRole = {};
    resources.forEach(r => {
      resourceByRole[r.role] = r;
    });
    
    // Get a contributor resource for timesheets/expenses
    const contributorResource = resourceByRole['contributor'] || resources[0];
    const supplierPmResource = resourceByRole['supplier_pm'] || resources[0];
    console.log(`   Using contributor: ${contributorResource.name} (user_id: ${contributorResource.user_id})`);
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // Step 2: Seed Milestones (using correct schema)
    // ═══════════════════════════════════════════════════════════════════
    console.log('🎯 Step 2: Seeding Milestones...');
    
    const milestones = [
      {
        project_id: projectId,
        name: '[TEST] Phase 1 - Planning & Discovery',
        milestone_ref: 'M001',
        description: 'Initial planning, requirements gathering, and stakeholder alignment',
        start_date: daysAgo(14),
        end_date: daysFromNow(30),
        status: 'In Progress',
        billable: 50000,
        baseline_start_date: daysAgo(14),
        baseline_end_date: daysFromNow(30),
        percent_complete: 40
      },
      {
        project_id: projectId,
        name: '[TEST] Phase 2 - Design & Architecture',
        milestone_ref: 'M002',
        description: 'System design, architecture decisions, and technical specifications',
        start_date: daysFromNow(31),
        end_date: daysFromNow(60),
        status: 'Not Started',
        billable: 75000,
        baseline_start_date: daysFromNow(31),
        baseline_end_date: daysFromNow(60),
        percent_complete: 0
      },
      {
        project_id: projectId,
        name: '[TEST] Phase 3 - Core Development',
        milestone_ref: 'M003',
        description: 'Main development phase for core functionality',
        start_date: daysFromNow(61),
        end_date: daysFromNow(120),
        status: 'Not Started',
        billable: 150000,
        baseline_start_date: daysFromNow(61),
        baseline_end_date: daysFromNow(120),
        percent_complete: 0
      },
      {
        project_id: projectId,
        name: '[TEST] Phase 4 - Integration & Testing',
        milestone_ref: 'M004',
        description: 'System integration, QA testing, and UAT',
        start_date: daysFromNow(121),
        end_date: daysFromNow(150),
        status: 'Not Started',
        billable: 60000,
        baseline_start_date: daysFromNow(121),
        baseline_end_date: daysFromNow(150),
        percent_complete: 0
      },
      {
        project_id: projectId,
        name: '[TEST] Phase 5 - Deployment & Go-Live',
        milestone_ref: 'M005',
        description: 'Production deployment, training, and project handover',
        start_date: daysFromNow(151),
        end_date: daysFromNow(180),
        status: 'Not Started',
        billable: 40000,
        baseline_start_date: daysFromNow(151),
        baseline_end_date: daysFromNow(180),
        percent_complete: 0
      }
    ];
    
    for (const milestone of milestones) {
      const { error } = await supabase
        .from('milestones')
        .upsert(milestone, { onConflict: 'project_id,milestone_ref' });
      
      if (error) {
        console.log(`   ⚠️  ${milestone.name}: ${error.message}`);
      } else {
        stats.milestones++;
        console.log(`   ✅ ${milestone.milestone_ref}: ${milestone.name}`);
      }
    }
    console.log('');

    // Get milestone IDs for linking
    const { data: createdMilestones } = await supabase
      .from('milestones')
      .select('id, milestone_ref, name')
      .eq('project_id', projectId);
    
    const milestoneMap = {};
    createdMilestones?.forEach(m => { 
      milestoneMap[m.milestone_ref] = m.id; 
    });

    // ═══════════════════════════════════════════════════════════════════
    // Step 3: Seed Deliverables
    // ═══════════════════════════════════════════════════════════════════
    console.log('📦 Step 3: Seeding Deliverables...');
    
    const deliverables = [
      // Phase 1 deliverables
      { milestone_ref: 'M001', deliverable_ref: 'D001', name: '[TEST] Business Requirements Document', status: 'Delivered', description: 'Comprehensive BRD covering all functional requirements' },
      { milestone_ref: 'M001', deliverable_ref: 'D002', name: '[TEST] Project Charter', status: 'Delivered', description: 'Formal project charter with objectives and success criteria' },
      { milestone_ref: 'M001', deliverable_ref: 'D003', name: '[TEST] Stakeholder Analysis', status: 'Submitted for Review', description: 'Identification and analysis of all project stakeholders' },
      // Phase 2 deliverables
      { milestone_ref: 'M002', deliverable_ref: 'D004', name: '[TEST] System Architecture Document', status: 'In Progress', description: 'High-level and detailed system architecture' },
      { milestone_ref: 'M002', deliverable_ref: 'D005', name: '[TEST] Technical Specifications', status: 'Not Started', description: 'Detailed technical specifications for all components' },
      { milestone_ref: 'M002', deliverable_ref: 'D006', name: '[TEST] Database Design', status: 'Not Started', description: 'ERD and database schema documentation' },
      // Phase 3 deliverables
      { milestone_ref: 'M003', deliverable_ref: 'D007', name: '[TEST] Core Module v1.0', status: 'Not Started', description: 'First release of core application module' },
      { milestone_ref: 'M003', deliverable_ref: 'D008', name: '[TEST] API Documentation', status: 'Not Started', description: 'Complete API reference documentation' },
      { milestone_ref: 'M003', deliverable_ref: 'D009', name: '[TEST] User Interface Components', status: 'Not Started', description: 'Reusable UI component library' },
      // Phase 4 deliverables
      { milestone_ref: 'M004', deliverable_ref: 'D010', name: '[TEST] Test Plan', status: 'Not Started', description: 'Comprehensive test strategy and plan' },
      { milestone_ref: 'M004', deliverable_ref: 'D011', name: '[TEST] UAT Sign-off', status: 'Not Started', description: 'User acceptance testing completion certificate' },
      // Phase 5 deliverables
      { milestone_ref: 'M005', deliverable_ref: 'D012', name: '[TEST] Deployment Runbook', status: 'Not Started', description: 'Step-by-step deployment procedures' },
      { milestone_ref: 'M005', deliverable_ref: 'D013', name: '[TEST] Training Materials', status: 'Not Started', description: 'End-user training documentation and videos' }
    ];
    
    for (const del of deliverables) {
      const milestoneId = milestoneMap[del.milestone_ref];
      if (!milestoneId) {
        console.log(`   ⏭️  Skipping ${del.name} (milestone not found)`);
        continue;
      }
      
      const { error } = await supabase
        .from('deliverables')
        .upsert({
          project_id: projectId,
          milestone_id: milestoneId,
          deliverable_ref: del.deliverable_ref,
          name: del.name,
          description: del.description,
          status: del.status
        }, { onConflict: 'project_id,deliverable_ref' });
      
      if (error) {
        console.log(`   ⚠️  ${del.name}: ${error.message}`);
      } else {
        stats.deliverables++;
        console.log(`   ✅ ${del.deliverable_ref}: ${del.name}`);
      }
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // Step 4: Seed Timesheets (Draft only to avoid notification trigger)
    // ═══════════════════════════════════════════════════════════════════
    console.log('⏱️  Step 4: Seeding Timesheets...');
    
    // Note: Non-Draft timesheets trigger notifications which require user_id
    // We create all as Draft first, then manually update approved ones
    const timesheets = [
      // Recent work entries (all Draft to avoid trigger issues)
      { days_ago: 14, hours: 8, description: 'Requirements workshop facilitation' },
      { days_ago: 13, hours: 7.5, description: 'Stakeholder interviews' },
      { days_ago: 12, hours: 8, description: 'Documentation drafting' },
      { days_ago: 11, hours: 6, description: 'Review meeting and revisions' },
      { days_ago: 10, hours: 8, description: 'Requirements finalization' },
      { days_ago: 7, hours: 7, description: 'Project charter development' },
      { days_ago: 6, hours: 8, description: 'Risk assessment workshop' },
      { days_ago: 5, hours: 6.5, description: 'Stakeholder presentation prep' },
      { days_ago: 4, hours: 8, description: 'Architecture planning session' },
      { days_ago: 3, hours: 7.5, description: 'Technical spike - database options' },
      { days_ago: 2, hours: 8, description: 'Design review meeting' },
      { days_ago: 1, hours: 6, description: 'Component design work' },
      { days_ago: 0, hours: 4, description: 'Documentation updates' },
      { days_ago: 9, hours: 7, description: 'Code review and feedback' },
      { days_ago: 15, hours: 8, description: 'Sprint planning session' },
      { days_ago: 16, hours: 7, description: 'Backlog grooming' }
    ];
    
    for (const ts of timesheets) {
      const { error } = await supabase
        .from('timesheets')
        .insert({
          project_id: projectId,
          resource_id: contributorResource.id,
          milestone_id: milestoneMap['M001'],
          date: daysAgo(ts.days_ago),
          work_date: daysAgo(ts.days_ago),
          hours_worked: ts.hours,
          hours: ts.hours,
          status: 'Draft',
          description: `[TEST] ${ts.description}`,
          comments: `[TEST] ${ts.description}`,
          is_test_content: true
        });
      
      if (error) {
        console.log(`   ⚠️  Timesheet ${daysAgo(ts.days_ago)}: ${error.message}`);
      } else {
        stats.timesheets++;
        console.log(`   ✅ ${daysAgo(ts.days_ago)}: ${ts.hours}h - Draft`);
      }
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // Step 5: Seed Expenses (using 'reason' instead of 'description')
    // ═══════════════════════════════════════════════════════════════════
    console.log('💰 Step 5: Seeding Expenses...');
    
    const expenses = [
      // Travel expenses
      { category: 'Travel', amount: 245.50, status: 'Draft', reason: 'Train to client site - requirements workshop', chargeable: true },
      { category: 'Travel', amount: 89.00, status: 'Draft', reason: 'Taxi to airport', chargeable: true },
      { category: 'Travel', amount: 312.00, status: 'Draft', reason: 'Flight to London - design review', chargeable: true },
      // Accommodation
      { category: 'Accommodation', amount: 185.00, status: 'Draft', reason: 'Hotel - client workshop (1 night)', chargeable: true },
      { category: 'Accommodation', amount: 370.00, status: 'Draft', reason: 'Hotel - design week (2 nights)', chargeable: true },
      // Sustenance
      { category: 'Sustenance', amount: 45.50, status: 'Draft', reason: 'Team lunch - project kickoff', chargeable: false },
      { category: 'Sustenance', amount: 28.00, status: 'Draft', reason: 'Working dinner with client', chargeable: true },
      { category: 'Sustenance', amount: 15.75, status: 'Draft', reason: 'Coffee meeting with stakeholder', chargeable: false },
      // More variety
      { category: 'Travel', amount: 156.00, status: 'Draft', reason: 'Uber rides during workshop week', chargeable: true },
      { category: 'Travel', amount: 67.50, status: 'Draft', reason: 'Uber to workshop venue', chargeable: true },
      { category: 'Accommodation', amount: 95.00, status: 'Draft', reason: 'Day office rental', chargeable: true },
      { category: 'Sustenance', amount: 125.00, status: 'Draft', reason: 'Team celebration dinner', chargeable: false }
    ];
    
    for (let i = 0; i < expenses.length; i++) {
      const exp = expenses[i];
      const { error } = await supabase
        .from('expenses')
        .insert({
          project_id: projectId,
          resource_id: contributorResource.id,
          resource_name: contributorResource.name,
          expense_date: daysAgo(i + 1),
          category: exp.category,
          amount: exp.amount,
          status: exp.status,
          reason: `[TEST] ${exp.reason}`,
          chargeable_to_customer: exp.chargeable,
          procurement_method: 'supplier',
          is_test_content: true
        });
      
      if (error) {
        console.log(`   ⚠️  Expense: ${error.message}`);
      } else {
        stats.expenses++;
        console.log(`   ✅ £${exp.amount.toFixed(2)} - ${exp.category} (${exp.status})`);
      }
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // Step 6: Seed KPIs (using correct schema - no threshold_amber/trend)
    // ═══════════════════════════════════════════════════════════════════
    console.log('📊 Step 6: Seeding KPIs...');
    
    const kpis = [
      { kpi_ref: 'KPI001', name: '[TEST] Schedule Performance Index', target: 1.0, current_value: 0.95, unit: 'ratio', description: 'Ratio of earned value to planned value' },
      { kpi_ref: 'KPI002', name: '[TEST] Cost Performance Index', target: 1.0, current_value: 1.02, unit: 'ratio', description: 'Ratio of earned value to actual cost' },
      { kpi_ref: 'KPI003', name: '[TEST] Defect Density', target: 2.0, current_value: 1.5, unit: 'per KLOC', description: 'Number of defects per thousand lines of code' },
      { kpi_ref: 'KPI004', name: '[TEST] Requirements Coverage', target: 100, current_value: 85, unit: '%', description: 'Percentage of requirements with test coverage' },
      { kpi_ref: 'KPI005', name: '[TEST] Stakeholder Satisfaction', target: 4.5, current_value: 4.2, unit: 'score', description: 'Average stakeholder satisfaction score (1-5)' },
      { kpi_ref: 'KPI006', name: '[TEST] Team Velocity', target: 40, current_value: 38, unit: 'points', description: 'Story points completed per sprint' },
      { kpi_ref: 'KPI007', name: '[TEST] Code Review Turnaround', target: 24, current_value: 18, unit: 'hours', description: 'Average time to complete code reviews' }
    ];
    
    for (const kpi of kpis) {
      const { error } = await supabase
        .from('kpis')
        .upsert({
          project_id: projectId,
          ...kpi
        }, { onConflict: 'project_id,kpi_ref' });
      
      if (error) {
        console.log(`   ⚠️  ${kpi.name}: ${error.message}`);
      } else {
        stats.kpis++;
        console.log(`   ✅ ${kpi.kpi_ref}: ${kpi.name}`);
      }
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // Step 7: Seed Quality Standards (insert, not upsert - no unique constraint)
    // ═══════════════════════════════════════════════════════════════════
    console.log('✅ Step 7: Seeding Quality Standards...');
    
    // First check if any exist
    const { data: existingQS } = await supabase
      .from('quality_standards')
      .select('qs_ref')
      .eq('project_id', projectId);
    
    const existingRefs = new Set((existingQS || []).map(q => q.qs_ref));
    
    const qualityStandards = [
      { qs_ref: 'QS001', name: '[TEST] Code Coverage', target: 80, description: 'Minimum unit test code coverage percentage', unit: '%' },
      { qs_ref: 'QS002', name: '[TEST] Documentation Completeness', target: 100, description: 'All public APIs must be documented', unit: '%' },
      { qs_ref: 'QS003', name: '[TEST] Accessibility Compliance', target: 100, description: 'WCAG 2.1 AA compliance for all UI', unit: '%' },
      { qs_ref: 'QS004', name: '[TEST] Security Scan Pass Rate', target: 100, description: 'No critical or high vulnerabilities', unit: '%' },
      { qs_ref: 'QS005', name: '[TEST] Performance Benchmarks', target: 95, description: 'Page load under 3 seconds for 95% of requests', unit: '%' },
      { qs_ref: 'QS006', name: '[TEST] Browser Compatibility', target: 100, description: 'Works on Chrome, Firefox, Safari, Edge', unit: '%' }
    ];
    
    for (const qs of qualityStandards) {
      if (existingRefs.has(qs.qs_ref)) {
        console.log(`   ⏭️  ${qs.qs_ref} already exists, skipping`);
        continue;
      }
      
      const { error } = await supabase
        .from('quality_standards')
        .insert({
          project_id: projectId,
          ...qs
        });
      
      if (error) {
        console.log(`   ⚠️  ${qs.name}: ${error.message}`);
      } else {
        stats.qualityStandards++;
        console.log(`   ✅ ${qs.qs_ref}: ${qs.name}`);
      }
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // Step 8: Seed Variations
    // ═══════════════════════════════════════════════════════════════════
    console.log('📝 Step 8: Seeding Variations...');
    
    // Check existing
    const { data: existingVars } = await supabase
      .from('variations')
      .select('variation_ref')
      .eq('project_id', projectId);
    
    const existingVarRefs = new Set((existingVars || []).map(v => v.variation_ref));
    
    const variations = [
      {
        variation_ref: 'VAR-001',
        title: '[TEST] Additional Reporting Module',
        description: 'Client requested additional reporting capabilities not in original scope',
        reason: 'Client change request - new business requirement identified during UAT',
        variation_type: 'scope_extension',
        status: 'approved',
        total_cost_impact: 25000,
        total_days_impact: 15
      },
      {
        variation_ref: 'VAR-002',
        title: '[TEST] Timeline Extension - Integration Delays',
        description: 'Third-party API integration took longer than estimated',
        reason: 'Technical complexity underestimated, vendor delays',
        variation_type: 'time_extension',
        status: 'awaiting_customer',
        total_cost_impact: 0,
        total_days_impact: 10
      },
      {
        variation_ref: 'VAR-003',
        title: '[TEST] Scope Reduction - Mobile App',
        description: 'Mobile app deferred to Phase 2',
        reason: 'Budget constraints, focus on core web functionality first',
        variation_type: 'scope_reduction',
        status: 'draft',
        total_cost_impact: -35000,
        total_days_impact: -20
      },
      {
        variation_ref: 'VAR-004',
        title: '[TEST] Cost Adjustment - Cloud Infrastructure',
        description: 'Revised cloud hosting costs based on actual usage',
        reason: 'Usage patterns different from initial estimates',
        variation_type: 'cost_adjustment',
        status: 'submitted',
        total_cost_impact: 5000,
        total_days_impact: 0
      }
    ];
    
    for (const variation of variations) {
      if (existingVarRefs.has(variation.variation_ref)) {
        console.log(`   ⏭️  ${variation.variation_ref} already exists, skipping`);
        stats.variations++; // Count existing
        continue;
      }
      
      const { error } = await supabase
        .from('variations')
        .insert({
          project_id: projectId,
          ...variation
        });
      
      if (error) {
        console.log(`   ⚠️  ${variation.title}: ${error.message}`);
      } else {
        stats.variations++;
        console.log(`   ✅ ${variation.variation_ref}: ${variation.title} (${variation.status})`);
      }
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // Step 9: Seed RAID Items
    // ═══════════════════════════════════════════════════════════════════
    console.log('⚠️  Step 9: Seeding RAID Items...');
    
    // Check existing
    const { data: existingRaid } = await supabase
      .from('raid_items')
      .select('raid_ref')
      .eq('project_id', projectId);
    
    const existingRaidRefs = new Set((existingRaid || []).map(r => r.raid_ref));
    
    const raidItems = [
      // Risks
      { category: 'Risk', raid_ref: 'R001', title: '[TEST] Resource availability', description: 'Key developer may be unavailable during critical phase', severity: 'High', status: 'Open', mitigation: 'Cross-train team members, identify backup resources' },
      { category: 'Risk', raid_ref: 'R002', title: '[TEST] Technology stack changes', description: 'Vendor may deprecate current API version', severity: 'Medium', status: 'Open', mitigation: 'Monitor vendor roadmap, plan migration path' },
      { category: 'Risk', raid_ref: 'R003', title: '[TEST] Budget overrun', description: 'Scope creep may exceed allocated budget', severity: 'Medium', status: 'Mitigated', mitigation: 'Strict change control process implemented' },
      // Assumptions
      { category: 'Assumption', raid_ref: 'A001', title: '[TEST] Client availability', description: 'Client SMEs will be available for weekly reviews', severity: 'Medium', status: 'Open' },
      { category: 'Assumption', raid_ref: 'A002', title: '[TEST] Infrastructure ready', description: 'Cloud environment will be provisioned by Phase 2 start', severity: 'High', status: 'Open' },
      // Issues
      { category: 'Issue', raid_ref: 'I001', title: '[TEST] Integration environment down', description: 'Test environment experiencing intermittent failures', severity: 'High', status: 'In Progress', resolution: 'DevOps team investigating, ETA 2 days' },
      { category: 'Issue', raid_ref: 'I002', title: '[TEST] Missing documentation', description: 'Third-party API documentation incomplete', severity: 'Medium', status: 'Closed', resolution: 'Contacted vendor, received updated docs' },
      // Dependencies
      { category: 'Dependency', raid_ref: 'D001', title: '[TEST] SSO Integration', description: 'Depends on IT team completing SSO setup', severity: 'High', status: 'Open', due_date: daysFromNow(14) },
      { category: 'Dependency', raid_ref: 'D002', title: '[TEST] Data migration', description: 'Legacy data export required from existing system', severity: 'Medium', status: 'Open', due_date: daysFromNow(30) }
    ];
    
    for (const raid of raidItems) {
      if (existingRaidRefs.has(raid.raid_ref)) {
        console.log(`   ⏭️  ${raid.raid_ref} already exists, skipping`);
        stats.raidItems++; // Count existing
        continue;
      }
      
      const { error } = await supabase
        .from('raid_items')
        .insert({
          project_id: projectId,
          owner_id: supplierPmResource.id,
          milestone_id: milestoneMap['M001'],
          ...raid
        });
      
      if (error) {
        console.log(`   ⚠️  ${raid.title}: ${error.message}`);
      } else {
        stats.raidItems++;
        console.log(`   ✅ ${raid.raid_ref} [${raid.category}]: ${raid.title}`);
      }
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // Step 10: Seed Partners
    // ═══════════════════════════════════════════════════════════════════
    console.log('🤝 Step 10: Seeding Partners...');
    
    // Check existing
    const { data: existingPartners } = await supabase
      .from('partners')
      .select('name')
      .eq('project_id', projectId);
    
    const existingPartnerNames = new Set((existingPartners || []).map(p => p.name));
    
    const partners = [
      {
        name: '[TEST] Acme Consulting Ltd',
        contact_name: 'John Smith',
        contact_email: 'john.smith@acme-test.example',
        payment_terms: 'Net 30',
        notes: 'Primary subcontractor for frontend development',
        is_active: true
      },
      {
        name: '[TEST] TechPro Solutions',
        contact_name: 'Sarah Johnson',
        contact_email: 'sarah.j@techpro-test.example',
        payment_terms: 'Net 14',
        notes: 'Infrastructure and DevOps support',
        is_active: true
      },
      {
        name: '[TEST] DataWise Analytics',
        contact_name: 'Mike Chen',
        contact_email: 'mike.chen@datawise-test.example',
        payment_terms: 'Net 30',
        notes: 'Data migration and analytics specialist',
        is_active: false
      }
    ];
    
    for (const partner of partners) {
      if (existingPartnerNames.has(partner.name)) {
        console.log(`   ⏭️  ${partner.name} already exists, skipping`);
        stats.partners++; // Count existing
        continue;
      }
      
      const { error } = await supabase
        .from('partners')
        .insert({
          project_id: projectId,
          ...partner
        });
      
      if (error) {
        console.log(`   ⚠️  ${partner.name}: ${error.message}`);
      } else {
        stats.partners++;
        console.log(`   ✅ ${partner.name} (${partner.is_active ? 'Active' : 'Inactive'})`);
      }
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════════════════
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ E2E Test Data Seeding Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Records seeded:');
    console.log(`  📁 Milestones:        ${stats.milestones}`);
    console.log(`  📦 Deliverables:      ${stats.deliverables}`);
    console.log(`  ⏱️  Timesheets:        ${stats.timesheets}`);
    console.log(`  💰 Expenses:          ${stats.expenses}`);
    console.log(`  📊 KPIs:              ${stats.kpis}`);
    console.log(`  ✅ Quality Standards: ${stats.qualityStandards}`);
    console.log(`  📝 Variations:        ${stats.variations}`);
    console.log(`  ⚠️  RAID Items:        ${stats.raidItems}`);
    console.log(`  🤝 Partners:          ${stats.partners}`);
    console.log('');
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    console.log(`  Total: ${total} records`);
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
