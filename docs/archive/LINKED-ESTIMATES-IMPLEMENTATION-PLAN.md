# Linked Estimates Implementation Plan (Option C)

## Executive Summary

This document outlines the complete implementation plan for linking the Planning tool with the Estimator tool, allowing users to create detailed cost estimates that are connected to their project plans.

**Goal:** Enable bidirectional linking between plan items (milestones, deliverables, tasks) and estimate components, showing real-time cost summaries in the Planning view while maintaining full estimate detail in the Estimator.

**Total Estimated Effort:** 18-24 hours across 6 checkpoints

---

## Current State Analysis

### Planning Tool ✅
- **Database:** `plan_items` table with hierarchy support
- **Service:** `planItemsService.js` with full CRUD + batch create
- **UI:** Excel-like grid with inline editing
- **AI:** Document upload → structure generation → batch insert

### Estimator Tool ⚠️ (In-Memory Only)
- **Database:** None (data lost on refresh)
- **Service:** None
- **UI:** Component-based grid with resource types and effort cells
- **Data:** Static benchmark rates duplicated from Benchmarking page

### Benchmarking Tool ✅
- **Database:** None (static data, Phase 1A MVP)
- **Service:** None
- **UI:** Filter/sort table with rate comparisons
- **Data:** Static `RATE_LOOKUP` object with ~54 rate combinations

### Key Patterns Identified
```
├── Services extend BaseService
├── Tables use UUID primary keys
├── project_id for multi-tenancy
├── RLS uses can_access_project()
├── Soft delete via is_deleted boolean
├── Linking via optional foreign keys (see plan_items → milestones)
```

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         PROJECT                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐ │
│  │  PLANNING    │       │  ESTIMATOR   │       │ BENCHMARKING │ │
│  │              │       │              │       │              │ │
│  │ plan_items   │◄─────►│  estimates   │◄──────│ benchmark_   │ │
│  │              │ link  │  estimate_   │ rates │ rates        │ │
│  │              │       │  components  │       │              │ │
│  │              │       │  estimate_   │       │              │ │
│  │              │       │  tasks       │       │              │ │
│  └──────────────┘       │  estimate_   │       └──────────────┘ │
│                         │  resources   │                        │
│                         └──────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### New Database Tables

| Table | Purpose |
|-------|---------|
| `benchmark_rates` | Global rate card (SFIA role/skill/level/tier → day rate) |
| `estimates` | Estimate header (name, project, status, totals) |
| `estimate_components` | Component groups within estimate |
| `estimate_tasks` | Tasks within components |
| `estimate_resources` | Resource type allocations per task |

### New Linking Fields

| Table | New Column | Links To |
|-------|------------|----------|
| `plan_items` | `estimate_component_id` | `estimate_components.id` |
| `estimates` | `plan_item_id` | `plan_items.id` (optional, for item-level estimates) |

---

## Implementation Checkpoints


---

## CHECKPOINT 1: Benchmark Rates Database & Service
**Estimated Time:** 3-4 hours

### AI Kickoff Prompt
```
I'm implementing Checkpoint 1 of the Linked Estimates feature for the project tracker app.

CONTEXT: Read /docs/LINKED-ESTIMATES-IMPLEMENTATION-PLAN.md for full context.

CHECKPOINT 1 GOAL: Create the benchmark_rates database table and service layer.

TASKS:
1. Create migration file for benchmark_rates table
2. Create benchmarkRatesService.js extending BaseService
3. Seed initial rate data (migrate from static RATE_LOOKUP in Estimator.jsx)
4. Update Benchmarking.jsx to use the service instead of static data
5. Update Estimator.jsx to use the service instead of static data

CONSTRAINTS:
- Follow existing patterns in supabase/migrations/ folder
- Service should extend BaseService from src/services/base.service.js
- Use RLS with is_system_admin() check (only system admins can modify rates)
- All users can read rates
- Export service from src/services/index.js

Please examine the existing code patterns first, then implement.
```

### Database Schema

**File:** `supabase/migrations/202512261000_create_benchmark_rates.sql`

```sql
-- Benchmark Rates Table
-- Global UK market day rates by role/skill/SFIA level/tier

CREATE TABLE IF NOT EXISTS benchmark_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Rate classification
  role_id TEXT NOT NULL,           -- e.g., 'DEV', 'SDEV', 'ARCH'
  role_name TEXT NOT NULL,         -- e.g., 'Software Developer'
  role_family_id TEXT NOT NULL,    -- e.g., 'SE', 'DA', 'DEVOPS'
  role_family_name TEXT NOT NULL,  -- e.g., 'Software Engineering'
  
  skill_id TEXT NOT NULL,          -- e.g., 'JAVA', 'PYTHON', 'AWS'
  skill_name TEXT NOT NULL,        -- e.g., 'Java', 'Python'
  
  sfia_level INTEGER NOT NULL CHECK (sfia_level >= 1 AND sfia_level <= 7),
  
  -- Rates by tier (GBP per day)
  contractor_rate DECIMAL(10,2),   -- Independent contractor
  associate_rate DECIMAL(10,2),    -- Mid-tier consultancy
  top4_rate DECIMAL(10,2),         -- Big 4 consultancy
  
  -- Metadata
  effective_date DATE DEFAULT CURRENT_DATE,
  source TEXT,                     -- e.g., 'ITJobsWatch', 'G-Cloud'
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Unique constraint
  CONSTRAINT benchmark_rates_unique UNIQUE (role_id, skill_id, sfia_level)
);

-- Indexes
CREATE INDEX idx_benchmark_rates_role ON benchmark_rates(role_id);
CREATE INDEX idx_benchmark_rates_skill ON benchmark_rates(skill_id);
CREATE INDEX idx_benchmark_rates_family ON benchmark_rates(role_family_id);
CREATE INDEX idx_benchmark_rates_level ON benchmark_rates(sfia_level);

-- Enable RLS
ALTER TABLE benchmark_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read rates
CREATE POLICY "Anyone can view benchmark rates"
  ON benchmark_rates FOR SELECT
  USING (true);

-- Only system admins can modify
CREATE POLICY "System admins can insert benchmark rates"
  ON benchmark_rates FOR INSERT
  WITH CHECK (is_system_admin());

CREATE POLICY "System admins can update benchmark rates"
  ON benchmark_rates FOR UPDATE
  USING (is_system_admin());

CREATE POLICY "System admins can delete benchmark rates"
  ON benchmark_rates FOR DELETE
  USING (is_system_admin());

-- Updated at trigger
CREATE TRIGGER benchmark_rates_updated_at
  BEFORE UPDATE ON benchmark_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Service Layer

**File:** `src/services/benchmarkRates.service.js`

```javascript
/**
 * Benchmark Rates Service
 * Global rate card for SFIA roles/skills
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

export class BenchmarkRatesService extends BaseService {
  constructor() {
    super('benchmark_rates', {
      supportsSoftDelete: false
    });
  }

  /**
   * Get all rates (no project filter - global data)
   */
  async getAllRates(filters = {}) {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .order('role_family_id')
      .order('role_id')
      .order('skill_id')
      .order('sfia_level');

    if (filters.roleFamily) {
      query = query.eq('role_family_id', filters.roleFamily);
    }
    if (filters.role) {
      query = query.eq('role_id', filters.role);
    }
    if (filters.skill) {
      query = query.eq('skill_id', filters.skill);
    }
    if (filters.minLevel) {
      query = query.gte('sfia_level', filters.minLevel);
    }
    if (filters.maxLevel) {
      query = query.lte('sfia_level', filters.maxLevel);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get rate for specific combination
   */
  async getRate(roleId, skillId, sfiaLevel) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('role_id', roleId)
      .eq('skill_id', skillId)
      .eq('sfia_level', sfiaLevel)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Get available skills for a role
   */
  async getSkillsForRole(roleId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('skill_id, skill_name')
      .eq('role_id', roleId);

    if (error) throw error;
    
    // Deduplicate
    const unique = [...new Map(data.map(d => [d.skill_id, d])).values()];
    return unique;
  }

  /**
   * Get available levels for role+skill
   */
  async getLevelsForRoleSkill(roleId, skillId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('sfia_level')
      .eq('role_id', roleId)
      .eq('skill_id', skillId)
      .order('sfia_level');

    if (error) throw error;
    return data.map(d => d.sfia_level);
  }

  /**
   * Build rate lookup object (for backwards compatibility)
   */
  async buildRateLookup() {
    const rates = await this.getAllRates();
    const lookup = {};
    
    for (const rate of rates) {
      const baseKey = `${rate.role_id}-${rate.skill_id}-${rate.sfia_level}`;
      if (rate.contractor_rate) lookup[`${baseKey}-contractor`] = rate.contractor_rate;
      if (rate.associate_rate) lookup[`${baseKey}-associate`] = rate.associate_rate;
      if (rate.top4_rate) lookup[`${baseKey}-top4`] = rate.top4_rate;
    }
    
    return lookup;
  }
}

export const benchmarkRatesService = new BenchmarkRatesService();
```

### Verification Checklist
- [ ] Migration runs without errors
- [ ] Seed data inserted (54 rate combinations)
- [ ] Service methods work in browser console
- [ ] Benchmarking page loads rates from database
- [ ] Estimator page loads rates from database
- [ ] Non-admin users can read rates
- [ ] Only system admins can modify rates

---


## CHECKPOINT 2: Estimates Database & Service
**Estimated Time:** 4-5 hours

### AI Kickoff Prompt
```
I'm implementing Checkpoint 2 of the Linked Estimates feature for the project tracker app.

CONTEXT: Read /docs/LINKED-ESTIMATES-IMPLEMENTATION-PLAN.md for full context.
PREREQUISITE: Checkpoint 1 (benchmark_rates) must be complete.

CHECKPOINT 2 GOAL: Create the estimates database tables and service layer.

TASKS:
1. Create migration for estimates, estimate_components, estimate_tasks, estimate_resources tables
2. Create estimatesService.js extending BaseService
3. Include methods for full CRUD on estimates with nested components/tasks/resources
4. Add getEstimateWithDetails() for loading full estimate structure
5. Add calculateTotals() for computing costs from nested data
6. Export service from src/services/index.js

CONSTRAINTS:
- Follow existing patterns in supabase/migrations/ folder
- estimates table has project_id (multi-tenant)
- RLS uses can_access_project() pattern
- Soft delete support on estimates table
- Cascade delete on child tables

Please examine the existing code patterns first, then implement.
```

### Database Schema

**File:** `supabase/migrations/202512261100_create_estimates.sql`

```sql
-- ============================================================
-- Migration: Create Estimates Tables
-- Date: 26 December 2025
-- Purpose: Persist estimator data with component/task/resource structure
-- ============================================================

-- Main estimates table (header)
CREATE TABLE IF NOT EXISTS estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  reference_number TEXT,  -- e.g., 'EST-001'
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'archived')),
  
  -- Calculated totals (denormalized for performance)
  total_days DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  component_count INTEGER DEFAULT 0,
  
  -- Linking (optional - can link whole estimate to a plan item)
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  
  -- Metadata
  notes TEXT,
  assumptions TEXT,
  exclusions TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Estimate components (groups of tasks)
CREATE TABLE IF NOT EXISTS estimate_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Quantity multiplier (e.g., 4 identical components)
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 1),
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Linking to plan items
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  
  -- Calculated totals (denormalized)
  total_days DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks within components
CREATE TABLE IF NOT EXISTS estimate_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES estimate_components(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Linking to plan items
  plan_item_id UUID REFERENCES plan_items(id) ON DELETE SET NULL,
  
  -- Calculated totals (denormalized)
  total_days DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource allocations per task
CREATE TABLE IF NOT EXISTS estimate_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES estimate_tasks(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES estimate_components(id) ON DELETE CASCADE,
  
  -- Resource type (from benchmark_rates)
  role_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  sfia_level INTEGER NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('contractor', 'associate', 'top4')),
  
  -- Snapshot of rate at time of estimate (rates may change)
  day_rate DECIMAL(10,2) NOT NULL,
  
  -- Effort
  effort_days DECIMAL(10,2) DEFAULT 0,
  
  -- Calculated cost (effort * rate)
  cost DECIMAL(12,2) GENERATED ALWAYS AS (effort_days * day_rate) STORED,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per task (can't have same resource type twice on one task)
  CONSTRAINT estimate_resources_unique UNIQUE (task_id, role_id, skill_id, sfia_level, tier)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_estimates_project ON estimates(project_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_plan_item ON estimates(plan_item_id);
CREATE INDEX idx_estimate_components_estimate ON estimate_components(estimate_id);
CREATE INDEX idx_estimate_components_plan_item ON estimate_components(plan_item_id);
CREATE INDEX idx_estimate_tasks_component ON estimate_tasks(component_id);
CREATE INDEX idx_estimate_tasks_plan_item ON estimate_tasks(plan_item_id);
CREATE INDEX idx_estimate_resources_task ON estimate_resources(task_id);
CREATE INDEX idx_estimate_resources_component ON estimate_resources(component_id);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_resources ENABLE ROW LEVEL SECURITY;

-- Estimates: Use can_access_project
CREATE POLICY "Users can view estimates for accessible projects"
  ON estimates FOR SELECT
  USING (can_access_project(project_id));

CREATE POLICY "Users can create estimates for accessible projects"
  ON estimates FOR INSERT
  WITH CHECK (can_access_project(project_id));

CREATE POLICY "Users can update estimates for accessible projects"
  ON estimates FOR UPDATE
  USING (can_access_project(project_id));

CREATE POLICY "Users can delete estimates for accessible projects"
  ON estimates FOR DELETE
  USING (can_access_project(project_id));

-- Components: Check via parent estimate
CREATE POLICY "Users can view estimate components"
  ON estimate_components FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM estimates e 
    WHERE e.id = estimate_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can manage estimate components"
  ON estimate_components FOR ALL
  USING (EXISTS (
    SELECT 1 FROM estimates e 
    WHERE e.id = estimate_id AND can_access_project(e.project_id)
  ));

-- Tasks: Check via parent component → estimate
CREATE POLICY "Users can view estimate tasks"
  ON estimate_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can manage estimate tasks"
  ON estimate_tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

-- Resources: Check via parent task → component → estimate
CREATE POLICY "Users can view estimate resources"
  ON estimate_resources FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

CREATE POLICY "Users can manage estimate resources"
  ON estimate_resources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM estimate_components ec
    JOIN estimates e ON e.id = ec.estimate_id
    WHERE ec.id = component_id AND can_access_project(e.project_id)
  ));

-- ============================================================
-- Triggers for updated_at
-- ============================================================

CREATE TRIGGER estimates_updated_at
  BEFORE UPDATE ON estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER estimate_components_updated_at
  BEFORE UPDATE ON estimate_components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER estimate_tasks_updated_at
  BEFORE UPDATE ON estimate_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER estimate_resources_updated_at
  BEFORE UPDATE ON estimate_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Function to recalculate estimate totals
-- ============================================================

CREATE OR REPLACE FUNCTION recalculate_estimate_totals(p_estimate_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_days DECIMAL(10,2);
  v_total_cost DECIMAL(12,2);
  v_component_count INTEGER;
BEGIN
  -- Calculate totals from resources
  SELECT 
    COALESCE(SUM(er.effort_days * ec.quantity), 0),
    COALESCE(SUM(er.cost * ec.quantity), 0),
    COUNT(DISTINCT ec.id)
  INTO v_total_days, v_total_cost, v_component_count
  FROM estimate_components ec
  LEFT JOIN estimate_resources er ON er.component_id = ec.id
  WHERE ec.estimate_id = p_estimate_id;
  
  -- Update estimate header
  UPDATE estimates
  SET 
    total_days = v_total_days,
    total_cost = v_total_cost,
    component_count = v_component_count,
    updated_at = NOW()
  WHERE id = p_estimate_id;
  
  -- Update component totals
  UPDATE estimate_components ec
  SET 
    total_days = COALESCE((
      SELECT SUM(er.effort_days) FROM estimate_resources er WHERE er.component_id = ec.id
    ), 0),
    total_cost = COALESCE((
      SELECT SUM(er.cost) FROM estimate_resources er WHERE er.component_id = ec.id
    ), 0)
  WHERE ec.estimate_id = p_estimate_id;
  
  -- Update task totals
  UPDATE estimate_tasks et
  SET 
    total_days = COALESCE((
      SELECT SUM(er.effort_days) FROM estimate_resources er WHERE er.task_id = et.id
    ), 0),
    total_cost = COALESCE((
      SELECT SUM(er.cost) FROM estimate_resources er WHERE er.task_id = et.id
    ), 0)
  WHERE et.component_id IN (
    SELECT id FROM estimate_components WHERE estimate_id = p_estimate_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Service Layer

**File:** `src/services/estimates.service.js`

Key methods to implement:
- `getAll(projectId)` - List estimates for project
- `getById(id)` - Get estimate header
- `getWithDetails(id)` - Get estimate with all nested data
- `create(estimate)` - Create new estimate
- `update(id, updates)` - Update estimate header
- `delete(id)` - Soft delete
- `saveFullEstimate(projectId, estimateData)` - Upsert complete estimate with components/tasks/resources
- `duplicateEstimate(id)` - Clone an estimate
- `recalculateTotals(id)` - Trigger totals recalculation
- `linkToPlanItem(estimateId, componentId, planItemId)` - Create linking

### Verification Checklist
- [ ] All 4 tables created without errors
- [ ] RLS policies allow correct access
- [ ] Service can create estimate with nested data
- [ ] Service can load estimate with all nested data
- [ ] Totals calculated correctly
- [ ] Soft delete works on estimates
- [ ] Cascade delete works on child tables

---


## CHECKPOINT 3: Estimator Save/Load UI
**Estimated Time:** 3-4 hours

### AI Kickoff Prompt
```
I'm implementing Checkpoint 3 of the Linked Estimates feature for the project tracker app.

CONTEXT: Read /docs/LINKED-ESTIMATES-IMPLEMENTATION-PLAN.md for full context.
PREREQUISITE: Checkpoints 1 & 2 (benchmark_rates and estimates tables/services) must be complete.

CHECKPOINT 3 GOAL: Update Estimator UI to save/load estimates from database.

TASKS:
1. Add estimate selection dropdown in Estimator header (New / Load existing)
2. Implement Save button to persist current estimate
3. Implement Load functionality to restore estimate from database
4. Add estimate name editing
5. Add "Save As" / duplicate functionality
6. Add delete estimate functionality
7. Add loading states and error handling
8. Show saved/unsaved indicator

CONSTRAINTS:
- Use estimatesService for all database operations
- Use benchmarkRatesService for rate lookups (not static data)
- Maintain existing component/task/resource UI structure
- Add toast notifications for save/load/delete actions
- Add confirmation dialog for delete

FILES TO MODIFY:
- src/pages/estimator/Estimator.jsx
- src/pages/estimator/Estimator.css (if needed)

Please examine the current Estimator.jsx structure first, then implement.
```

### Implementation Notes

**State Changes:**
```javascript
// Current state (in-memory only)
const [estimate, setEstimate] = useState({
  name: 'New Estimate',
  description: '',
  components: []
});

// New state (database-backed)
const [estimateId, setEstimateId] = useState(null);
const [estimate, setEstimate] = useState(null);
const [availableEstimates, setAvailableEstimates] = useState([]);
const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [lastSavedAt, setLastSavedAt] = useState(null);
```

**New UI Elements:**
1. Estimate selector dropdown in header
2. "New Estimate" button
3. Save indicator (●) when unsaved
4. Last saved timestamp
5. Save / Save As buttons
6. Delete button with confirmation

**Data Transformation:**
The UI uses a specific structure for `estimate.components[].tasks[].efforts[resourceId]`. Need bidirectional mapping between UI format and database format.

```javascript
// UI Format
{
  id: 'local-id',
  name: 'Component',
  quantity: 1,
  resourceTypes: [
    { id: 'rt-1', roleId: 'DEV', skillId: 'JAVA', level: 4, tier: 'contractor', rate: 600 }
  ],
  tasks: [
    { id: 't-1', name: 'Task', efforts: { 'rt-1': 5 } }
  ]
}

// Database Format
// estimate_components: { id, name, quantity }
// estimate_tasks: { id, component_id, name }
// estimate_resources: { id, task_id, component_id, role_id, skill_id, sfia_level, tier, day_rate, effort_days }
```

### Verification Checklist
- [ ] Can create new estimate
- [ ] Can save estimate to database
- [ ] Can load existing estimate
- [ ] Can switch between estimates
- [ ] Unsaved changes indicator works
- [ ] Save As creates new copy
- [ ] Delete removes estimate (with confirmation)
- [ ] Rates loaded from database (not static)
- [ ] Error states handled gracefully
- [ ] Loading states show appropriately

---

## CHECKPOINT 4: Planning ↔ Estimator Linking
**Estimated Time:** 4-5 hours

### AI Kickoff Prompt
```
I'm implementing Checkpoint 4 of the Linked Estimates feature for the project tracker app.

CONTEXT: Read /docs/LINKED-ESTIMATES-IMPLEMENTATION-PLAN.md for full context.
PREREQUISITE: Checkpoints 1, 2 & 3 must be complete.

CHECKPOINT 4 GOAL: Add linking between plan_items and estimate_components.

TASKS:
1. Add estimate_component_id column to plan_items table
2. Update planItemsService to handle estimate linking
3. Add "Create Estimate" button in Planning UI
4. Create "EstimateFromPlanModal" component for initial linking
5. Add estimate badge/indicator on linked plan items
6. Add click-through from Planning to Estimator (with context)
7. Show estimate summary (£X, Y days) on linked items

CONSTRAINTS:
- Linking is at the plan_item → estimate_component level
- One plan item can link to one estimate component
- One estimate component can link to multiple plan items (reusable)
- Badge shows total cost from linked estimate component
- Click badge opens Estimator with that component expanded

FILES TO CREATE:
- supabase/migrations/202512261200_add_estimate_link_to_plan_items.sql
- src/components/planning/EstimateFromPlanModal.jsx
- src/components/planning/EstimateFromPlanModal.css

FILES TO MODIFY:
- src/services/planItemsService.js
- src/pages/planning/Planning.jsx
- src/pages/planning/Planning.css

Please examine the current Planning.jsx structure first, then implement.
```

### Database Migration

**File:** `supabase/migrations/202512261200_add_estimate_link_to_plan_items.sql`

```sql
-- Add estimate linking to plan_items
ALTER TABLE plan_items
ADD COLUMN estimate_component_id UUID REFERENCES estimate_components(id) ON DELETE SET NULL;

CREATE INDEX idx_plan_items_estimate_component ON plan_items(estimate_component_id);

-- View to get plan items with estimate summary
CREATE OR REPLACE VIEW plan_items_with_estimates AS
SELECT 
  pi.*,
  ec.name AS estimate_component_name,
  ec.total_cost AS estimate_cost,
  ec.total_days AS estimate_days,
  ec.quantity AS estimate_quantity,
  e.id AS estimate_id,
  e.name AS estimate_name,
  e.status AS estimate_status
FROM plan_items pi
LEFT JOIN estimate_components ec ON ec.id = pi.estimate_component_id
LEFT JOIN estimates e ON e.id = ec.estimate_id;
```

### UI Components

**EstimateFromPlanModal:**
- Select existing estimate or create new
- If creating new, pre-populate component name from plan item
- If selecting existing, choose which component to link
- Confirm linking

**Planning Badge:**
```jsx
{item.estimate_component_id && (
  <span 
    className="plan-item-estimate-badge"
    onClick={(e) => { e.stopPropagation(); openEstimator(item); }}
    title={`${item.estimate_name}: ${formatCurrency(item.estimate_cost)}`}
  >
    £{Math.round(item.estimate_cost / 1000)}k
  </span>
)}
```

### Verification Checklist
- [ ] Migration adds column without breaking existing data
- [ ] "Create Estimate" button appears in Planning
- [ ] Modal shows existing estimates to link
- [ ] Modal allows creating new estimate
- [ ] Linked items show cost badge
- [ ] Badge shows correct cost from estimate
- [ ] Clicking badge opens Estimator
- [ ] Estimator shows correct component expanded
- [ ] Unlinking works (set to null)

---


## CHECKPOINT 5: Estimate from Plan Structure
**Estimated Time:** 2-3 hours

### AI Kickoff Prompt
```
I'm implementing Checkpoint 5 of the Linked Estimates feature for the project tracker app.

CONTEXT: Read /docs/LINKED-ESTIMATES-IMPLEMENTATION-PLAN.md for full context.
PREREQUISITE: Checkpoints 1-4 must be complete.

CHECKPOINT 5 GOAL: Auto-generate estimate structure from Planning hierarchy.

TASKS:
1. Add "Generate Estimate from Plan" button in Planning toolbar
2. Create EstimateGeneratorModal that shows plan structure preview
3. Allow selection of which items to include in estimate
4. Generate estimate with:
   - Milestones → Estimate Components
   - Deliverables → Nested Components OR Tasks (user choice)
   - Tasks → Estimate Tasks
5. Pre-link generated components back to plan items
6. Open Estimator with newly created estimate

CONSTRAINTS:
- User should preview what will be generated before creating
- User can select/deselect items to include
- Default: all items selected
- Generated estimate opens in Estimator for resource allocation
- Links maintained between plan items and estimate components

FILES TO CREATE:
- src/components/planning/EstimateGeneratorModal.jsx
- src/components/planning/EstimateGeneratorModal.css

FILES TO MODIFY:
- src/pages/planning/Planning.jsx
- src/services/estimates.service.js (add createFromPlanStructure method)

Please examine the current plan_items structure and createBatch method for reference.
```

### Service Method

**Add to `estimates.service.js`:**

```javascript
/**
 * Create estimate from plan items structure
 * Converts: Milestones → Components, Deliverables → Task Groups, Tasks → Tasks
 */
async createFromPlanStructure(projectId, planItems, options = {}) {
  const { 
    name = 'New Estimate from Plan',
    includeItems = null,  // Array of plan_item ids to include (null = all)
    deliverableMode = 'tasks'  // 'tasks' or 'components'
  } = options;

  // Filter items if specified
  let items = planItems;
  if (includeItems) {
    items = planItems.filter(i => includeItems.includes(i.id));
  }

  // Create estimate header
  const estimate = await this.create({
    project_id: projectId,
    name,
    status: 'draft'
  });

  // Process milestones → components
  const milestones = items.filter(i => i.item_type === 'milestone');
  
  for (const milestone of milestones) {
    const component = await this.createComponent(estimate.id, {
      name: milestone.name,
      description: milestone.description,
      plan_item_id: milestone.id
    });

    // Link plan item back to component
    await planItemsService.update(milestone.id, {
      estimate_component_id: component.id
    });

    // Get deliverables under this milestone
    const deliverables = items.filter(i => 
      i.item_type === 'deliverable' && i.parent_id === milestone.id
    );

    for (const deliverable of deliverables) {
      if (deliverableMode === 'components') {
        // Create sub-component for deliverable
        const subComponent = await this.createComponent(estimate.id, {
          name: deliverable.name,
          description: deliverable.description,
          plan_item_id: deliverable.id
        });
        await planItemsService.update(deliverable.id, {
          estimate_component_id: subComponent.id
        });
        // Tasks under deliverable go into sub-component
        // ...
      } else {
        // Create task for deliverable within milestone component
        const task = await this.createTask(component.id, {
          name: deliverable.name,
          description: deliverable.description,
          plan_item_id: deliverable.id
        });
        await planItemsService.update(deliverable.id, {
          estimate_task_id: task.id  // If we add this column
        });
      }
      
      // Get tasks under this deliverable
      const tasks = items.filter(i => 
        i.item_type === 'task' && i.parent_id === deliverable.id
      );
      
      for (const planTask of tasks) {
        const estTask = await this.createTask(component.id, {
          name: planTask.name,
          description: planTask.description,
          plan_item_id: planTask.id
        });
      }
    }
  }

  return estimate;
}
```

### Verification Checklist
- [ ] "Generate Estimate" button appears in Planning toolbar
- [ ] Modal shows plan structure as tree
- [ ] Can select/deselect items
- [ ] Generated estimate has correct structure
- [ ] Plan items linked to estimate components
- [ ] Estimator opens with new estimate
- [ ] Resource columns ready for allocation

---

## CHECKPOINT 6: Polish & Integration
**Estimated Time:** 2-3 hours

### AI Kickoff Prompt
```
I'm implementing Checkpoint 6 (final) of the Linked Estimates feature for the project tracker app.

CONTEXT: Read /docs/LINKED-ESTIMATES-IMPLEMENTATION-PLAN.md for full context.
PREREQUISITE: Checkpoints 1-5 must be complete.

CHECKPOINT 6 GOAL: Final polish, testing, and integration improvements.

TASKS:
1. Add estimate summary widget to Planning page header
2. Add "Estimates" tab/view to see all project estimates
3. Improve Estimator navigation (back to Planning link)
4. Add estimate export to CSV/PDF
5. Add estimate comparison view (compare two estimates)
6. Add estimate versioning (save as v1, v2, etc.)
7. Performance optimization for large estimates
8. Error handling improvements
9. Add unit tests for services
10. Update documentation

CONSTRAINTS:
- All features should follow existing UI patterns
- Export should match existing report patterns
- Versioning optional (nice-to-have)
- Tests should use existing test patterns if available

FILES TO MODIFY:
- Multiple files for polish

Please examine the codebase for existing patterns, then implement incrementally.
```

### Features to Add

**Planning Page Header Widget:**
```jsx
<div className="planning-estimate-summary">
  <span className="estimate-count">{estimates.length} Estimates</span>
  <span className="estimate-total">£{formatCurrency(totalCost)}</span>
  <span className="estimate-days">{totalDays} days</span>
</div>
```

**Estimates List View:**
- New tab in Planning page OR separate route `/estimates`
- Table showing all estimates for project
- Columns: Name, Status, Components, Total Days, Total Cost, Created, Modified
- Actions: Open, Duplicate, Delete

**Export:**
- CSV export of estimate details
- PDF export using existing report patterns
- Include breakdown by component and resource type

### Verification Checklist
- [ ] Summary widget shows in Planning header
- [ ] All estimates visible in list view
- [ ] Export to CSV works
- [ ] Export to PDF works (if time permits)
- [ ] Navigation between Planning ↔ Estimator smooth
- [ ] No console errors
- [ ] Performance acceptable with 50+ components
- [ ] Documentation updated

---


## Summary & Dependencies

### Checkpoint Dependency Graph

```
┌─────────────────────┐
│   CHECKPOINT 1      │
│ Benchmark Rates DB  │
│   (3-4 hours)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   CHECKPOINT 2      │
│   Estimates DB      │
│   (4-5 hours)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   CHECKPOINT 3      │
│ Estimator Save/Load │
│   (3-4 hours)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   CHECKPOINT 4      │
│ Planning ↔ Linking  │
│   (4-5 hours)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   CHECKPOINT 5      │
│ Generate from Plan  │
│   (2-3 hours)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   CHECKPOINT 6      │
│   Polish & Test     │
│   (2-3 hours)       │
└─────────────────────┘
```

### Total Estimated Time

| Checkpoint | Description | Hours |
|------------|-------------|-------|
| 1 | Benchmark Rates DB & Service | 3-4 |
| 2 | Estimates DB & Service | 4-5 |
| 3 | Estimator Save/Load UI | 3-4 |
| 4 | Planning ↔ Estimator Linking | 4-5 |
| 5 | Estimate from Plan Structure | 2-3 |
| 6 | Polish & Integration | 2-3 |
| **Total** | | **18-24** |

### Files to Create

| Checkpoint | Files |
|------------|-------|
| 1 | `migrations/202512261000_create_benchmark_rates.sql`<br>`services/benchmarkRates.service.js` |
| 2 | `migrations/202512261100_create_estimates.sql`<br>`services/estimates.service.js` |
| 3 | _(Updates to Estimator.jsx only)_ |
| 4 | `migrations/202512261200_add_estimate_link_to_plan_items.sql`<br>`components/planning/EstimateFromPlanModal.jsx`<br>`components/planning/EstimateFromPlanModal.css` |
| 5 | `components/planning/EstimateGeneratorModal.jsx`<br>`components/planning/EstimateGeneratorModal.css` |
| 6 | _(Various updates and polish)_ |

### Files to Modify

| File | Checkpoints |
|------|-------------|
| `src/services/index.js` | 1, 2 |
| `src/pages/benchmarking/Benchmarking.jsx` | 1 |
| `src/pages/estimator/Estimator.jsx` | 1, 3, 4 |
| `src/services/planItemsService.js` | 4 |
| `src/pages/planning/Planning.jsx` | 4, 5, 6 |
| `src/pages/planning/Planning.css` | 4, 6 |

---

## Appendix A: Data Flow Examples

### Creating an Estimate from Planning

```
User Flow:
1. User has plan with milestones, deliverables, tasks in Planning page
2. Clicks "Generate Estimate from Plan" button
3. Modal shows plan structure with checkboxes
4. User selects items to include
5. Clicks "Generate"
6. System creates:
   - estimates record
   - estimate_components for each milestone
   - estimate_tasks for each deliverable/task
7. System updates plan_items with estimate_component_id links
8. User redirected to Estimator with new estimate loaded
9. User adds resource columns and effort values
10. User saves estimate
11. Returning to Planning, user sees cost badges on linked items
```

### Loading Estimate in Estimator

```
Database → Service → UI

1. estimatesService.getWithDetails(estimateId)
   Returns:
   {
     id, name, project_id, status, total_days, total_cost,
     components: [
       {
         id, name, quantity, sort_order, total_days, total_cost,
         tasks: [
           { id, name, sort_order, total_days, total_cost }
         ],
         resources: [
           { id, task_id, role_id, skill_id, sfia_level, tier, day_rate, effort_days, cost }
         ]
       }
     ]
   }

2. Transform to UI format:
   {
     id, name, description,
     components: [
       {
         id, name, quantity,
         resourceTypes: [
           { id, roleId, skillId, level, tier, rate }
         ],
         tasks: [
           { id, name, efforts: { [resourceId]: days } }
         ]
       }
     ]
   }

3. Set state and render grid
```

---

## Appendix B: Testing Checklist

### Manual Testing Scenarios

**Checkpoint 1:**
- [ ] Create benchmark rate via Supabase dashboard
- [ ] Verify rate appears in Benchmarking page
- [ ] Verify rate appears in Estimator resource selector

**Checkpoint 2:**
- [ ] Create estimate via service in browser console
- [ ] Verify estimate appears in database
- [ ] Verify totals calculated correctly

**Checkpoint 3:**
- [ ] Create new estimate in Estimator
- [ ] Add components and tasks
- [ ] Add resources with effort
- [ ] Save estimate
- [ ] Refresh page
- [ ] Load saved estimate
- [ ] Verify all data restored correctly

**Checkpoint 4:**
- [ ] Create plan in Planning
- [ ] Link plan item to estimate component
- [ ] Verify badge shows correct cost
- [ ] Click badge, verify Estimator opens to correct component
- [ ] Unlink and verify badge disappears

**Checkpoint 5:**
- [ ] Create plan with milestone > deliverable > task hierarchy
- [ ] Generate estimate from plan
- [ ] Verify component structure matches plan
- [ ] Verify links created in both directions

**Checkpoint 6:**
- [ ] Verify summary widget in Planning header
- [ ] Test export to CSV
- [ ] Verify no console errors
- [ ] Test with 10+ components, 50+ tasks

---

## Appendix C: Rollback Plan

If issues arise during implementation:

1. **Database:** All migrations are additive (new tables, new columns). Can safely revert by:
   - Dropping new tables: `estimates`, `estimate_components`, `estimate_tasks`, `estimate_resources`
   - Dropping new columns: `plan_items.estimate_component_id`
   - Dropping new table: `benchmark_rates` (Benchmarking reverts to static)

2. **Code:** All changes are in new files or clearly marked sections. Can revert by:
   - Removing new service files
   - Removing new modal components
   - Reverting changes to Estimator.jsx (restore static data)
   - Reverting changes to Planning.jsx (remove estimate features)

3. **Feature Flag Option:** Add `VITE_FEATURE_LINKED_ESTIMATES=true` environment variable to gate all new features during development.

---

## Appendix D: Future Enhancements

Not in scope for this implementation but worth considering:

1. **AI Estimate Generation:** Use Claude to suggest resource types and effort based on task description
2. **Rate History:** Track rate changes over time, show trends
3. **Estimate Templates:** Save/load common estimate patterns
4. **Approval Workflow:** Submit estimate for approval, track status
5. **Comparison Reports:** Side-by-side comparison of multiple estimates
6. **What-If Analysis:** Change rates/effort and see impact
7. **Integration with Finance:** Link approved estimates to budget/actuals

---

_Document created: 26 December 2025_
_Last updated: 26 December 2025_
_Author: Claude (AI Assistant)_
