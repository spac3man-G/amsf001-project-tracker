# SFIA 8 Skills Benchmarking - Full Integration Plan

## Document Version
- **Version:** 1.0
- **Created:** 25 December 2025
- **Target Completion:** Option C (Full Integration)
- **Estimated Effort:** 4-5 days

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target Architecture](#3-target-architecture)
4. [Database Schema Design](#4-database-schema-design)
5. [Migration Strategy](#5-migration-strategy)
6. [Implementation Phases](#6-implementation-phases)
7. [UI/UX Components](#7-uiux-components)
8. [Integration Points](#8-integration-points)
9. [API & Service Layer](#9-api--service-layer)
10. [Testing Strategy](#10-testing-strategy)
11. [Rollback Plan](#11-rollback-plan)
12. [File Manifest](#12-file-manifest)

---

## 1. Executive Summary

### Objective
Integrate the SFIA 8 Skills Benchmarking system into the project tracker as a standalone feature that also enriches existing resource management, providing:

1. **Standalone Benchmarking Tool** - Compare UK market rates by role, skill, and SFIA level
2. **Resource Enhancement** - Link resources to SFIA skills with market rate comparison
3. **Financial Intelligence** - Compare actual rates vs market benchmarks
4. **Planning Integration** - Forecast costs using benchmark rates

### Key Outcomes
- Users can benchmark any role/skill/level against UK market rates
- Resources display "vs market" indicators showing if rates are above/below benchmark
- Finance dashboards show market rate variance analysis
- Project planning can estimate costs using benchmark rates before resources are assigned

### Scope Boundaries
- **In Scope:** UK market rates (GBP), 3 rate tiers, 29 initial benchmarks, expandable
- **Out of Scope:** Multi-currency, real-time rate feeds, automated rate updates
- **Standalone:** Benchmarking tool works without any other feature dependencies

---

## 2. Current State Analysis

### Existing SFIA Implementation
```
Location: src/lib/resourceCalculations.js

Current SFIA levels: L3, L4, L5, L6 (4 levels)
SFIA 8 standard: L1-L7 (7 levels)

Gap: Missing L1, L2, L7
```

### Existing Resource Fields
```javascript
// Current resource schema (from Resources.jsx)
{
  resource_ref: string,      // Reference code
  name: string,              // Display name
  email: string,             // Contact email
  role: string,              // Job title (free text from RESOURCE_ROLES)
  sfia_level: string,        // 'L3' | 'L4' | 'L5' | 'L6'
  sell_price: number,        // Daily sell rate (GBP)
  cost_price: number,        // Daily cost rate (GBP) - restricted visibility
  resource_type: string,     // 'internal' | 'third_party'
  partner_id: uuid,          // Link to partner (for third-party)
  user_id: uuid,             // Link to system user
  is_active: boolean,
  is_test_content: boolean,
  is_deleted: boolean
}
```

### Existing Calculations
```javascript
// From resourceCalculations.js
- calculateMargin(sellPrice, costPrice) → { percent, amount }
- calculateSellValue(days, sellPrice) → total
- calculateCostValue(days, costPrice) → total
- Margin thresholds: GOOD (≥25%), LOW (≥10%), CRITICAL (<10%)
```

### What's Missing for Full Integration
1. SFIA 8 reference data tables (role families, roles, skills, levels)
2. Benchmark rates table with 3 rate tiers
3. Resource-to-skill mapping (many-to-many)
4. Extended SFIA levels (L1, L2, L7)
5. Market rate comparison calculations
6. Benchmarking UI components
7. Admin CRUD for rate management

---

## 3. Target Architecture

### Conceptual Model
```
┌─────────────────────────────────────────────────────────────────────┐
│                    SFIA 8 BENCHMARKING MODULE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │ Role Families│───▶│    Roles     │───▶│   Skills     │          │
│  │     (6)      │    │    (24)      │    │    (15)      │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│                              │                   │                  │
│                              ▼                   ▼                  │
│                    ┌─────────────────────────────────┐              │
│                    │      Benchmark Rates (29+)     │              │
│                    │  role + skill + level = 3 rates │              │
│                    └─────────────────────────────────┘              │
│                                    │                                │
└────────────────────────────────────┼────────────────────────────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     ▼               ▼               ▼
              ┌────────────┐ ┌────────────┐ ┌────────────┐
              │ Standalone │ │  Resource  │ │  Finance   │
              │Benchmarking│ │Integration │ │ Analytics  │
              │    Tool    │ │  & Skills  │ │ & Variance │
              └────────────┘ └────────────┘ └────────────┘
```

### Data Flow
```
1. SFIA Reference Data (static, admin-managed)
   └── Role Families → Roles → Skills → SFIA Levels

2. Benchmark Rates (quarterly updates)
   └── Role × Skill × Level = Contractor | Associate | Top4 rates

3. Resource Enrichment (per-resource)
   └── Resource ←→ Skills (many-to-many)
   └── Resource.sfia_level + Resource.sell_price vs Benchmark

4. Financial Analysis (derived)
   └── Actual Rate vs Market Rate → Variance %
   └── Project Cost vs Market Benchmark
```

---

## 4. Database Schema Design

### 4.1 New Tables

#### Table: `sfia_role_families`
```sql
CREATE TABLE sfia_role_families (
  id VARCHAR(10) PRIMARY KEY,           -- 'SE', 'DA', 'DEVOPS', etc.
  name VARCHAR(100) NOT NULL,           -- 'Software Engineering'
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial data: 6 families
```

#### Table: `sfia_roles`
```sql
CREATE TABLE sfia_roles (
  id VARCHAR(20) PRIMARY KEY,           -- 'DEV', 'ARCH', 'DATASCI', etc.
  family_id VARCHAR(10) NOT NULL REFERENCES sfia_role_families(id),
  title VARCHAR(100) NOT NULL,          -- 'Software Developer'
  description TEXT,
  typical_levels INT[] DEFAULT '{3,4,5}', -- Common SFIA levels for this role
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial data: 24 roles
```

#### Table: `sfia_skills`
```sql
CREATE TABLE sfia_skills (
  id VARCHAR(20) PRIMARY KEY,           -- 'JAVA', 'CLOUD', 'ML', etc.
  name VARCHAR(100) NOT NULL,           -- 'Java Development'
  description TEXT,
  category VARCHAR(50),                 -- 'Technical', 'Business', 'Management'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial data: 15 skills
```

#### Table: `sfia_levels`
```sql
CREATE TABLE sfia_levels (
  level INTEGER PRIMARY KEY,            -- 1-7
  name VARCHAR(50) NOT NULL,            -- 'Follow', 'Assist', 'Apply', etc.
  description TEXT,                     -- Official SFIA description
  autonomy TEXT,                        -- Autonomy characteristic
  influence TEXT,                       -- Influence characteristic
  complexity TEXT,                      -- Complexity characteristic
  typical_title VARCHAR(100)            -- 'Junior', 'Mid', 'Senior', etc.
);

-- Initial data: 7 levels (L1-L7)
```

#### Table: `sfia_benchmark_rates`
```sql
CREATE TABLE sfia_benchmark_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id VARCHAR(20) NOT NULL REFERENCES sfia_roles(id),
  skill_id VARCHAR(20) NOT NULL REFERENCES sfia_skills(id),
  level INTEGER NOT NULL REFERENCES sfia_levels(level),
  
  -- Rate tiers (GBP daily rates)
  contractor_rate INTEGER NOT NULL,     -- Independent/agency rate
  associate_rate INTEGER NOT NULL,      -- Mid-tier consultancy rate
  top4_rate INTEGER NOT NULL,           -- Premium consultancy rate
  
  -- Metadata
  effective_date DATE DEFAULT CURRENT_DATE,
  source VARCHAR(200),                  -- Data source reference
  notes TEXT,
  confidence VARCHAR(20) DEFAULT 'high', -- 'high', 'medium', 'low'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE (role_id, skill_id, level, effective_date),
  CHECK (contractor_rate > 0),
  CHECK (associate_rate >= contractor_rate),
  CHECK (top4_rate >= associate_rate),
  CHECK (level BETWEEN 1 AND 7)
);

-- Initial data: 29 benchmark records
-- Indexes for filtering
CREATE INDEX idx_benchmark_role ON sfia_benchmark_rates(role_id);
CREATE INDEX idx_benchmark_skill ON sfia_benchmark_rates(skill_id);
CREATE INDEX idx_benchmark_level ON sfia_benchmark_rates(level);
CREATE INDEX idx_benchmark_effective ON sfia_benchmark_rates(effective_date);
```

#### Table: `resource_skills` (Many-to-Many Junction)
```sql
CREATE TABLE resource_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  skill_id VARCHAR(20) NOT NULL REFERENCES sfia_skills(id),
  proficiency VARCHAR(20) DEFAULT 'competent', -- 'learning', 'competent', 'expert'
  is_primary BOOLEAN DEFAULT FALSE,     -- Primary skill for this resource
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (resource_id, skill_id)
);

CREATE INDEX idx_resource_skills_resource ON resource_skills(resource_id);
CREATE INDEX idx_resource_skills_skill ON resource_skills(skill_id);
```

### 4.2 Existing Table Modifications

#### Table: `resources` (ALTER)
```sql
-- Add new columns
ALTER TABLE resources ADD COLUMN IF NOT EXISTS primary_role_id VARCHAR(20) REFERENCES sfia_roles(id);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS rate_tier VARCHAR(20) DEFAULT 'contractor';
  -- 'contractor' | 'associate' | 'top4'

-- Extend sfia_level to support L1-L7
-- Current: L3, L4, L5, L6
-- New: L1, L2, L3, L4, L5, L6, L7
-- No schema change needed - just update validation/UI

-- Add computed column for market comparison (or use view)
COMMENT ON COLUMN resources.primary_role_id IS 'Link to SFIA role for benchmarking';
COMMENT ON COLUMN resources.rate_tier IS 'Market rate tier for comparison';
```

### 4.3 Views for Reporting

#### View: `v_resource_benchmark_comparison`
```sql
CREATE OR REPLACE VIEW v_resource_benchmark_comparison AS
SELECT 
  r.id AS resource_id,
  r.name AS resource_name,
  r.sell_price AS actual_sell_rate,
  r.sfia_level,
  r.primary_role_id,
  r.rate_tier,
  
  -- Get primary skill
  rs.skill_id AS primary_skill_id,
  sk.name AS primary_skill_name,
  
  -- Get benchmark rate for comparison
  br.contractor_rate,
  br.associate_rate,
  br.top4_rate,
  
  -- Calculate variance
  CASE r.rate_tier
    WHEN 'contractor' THEN br.contractor_rate
    WHEN 'associate' THEN br.associate_rate
    WHEN 'top4' THEN br.top4_rate
    ELSE br.contractor_rate
  END AS benchmark_rate,
  
  CASE r.rate_tier
    WHEN 'contractor' THEN r.sell_price - br.contractor_rate
    WHEN 'associate' THEN r.sell_price - br.associate_rate
    WHEN 'top4' THEN r.sell_price - br.top4_rate
    ELSE r.sell_price - br.contractor_rate
  END AS rate_variance,
  
  CASE 
    WHEN r.sell_price > 0 AND br.contractor_rate > 0 THEN
      ROUND(((r.sell_price - 
        CASE r.rate_tier
          WHEN 'contractor' THEN br.contractor_rate
          WHEN 'associate' THEN br.associate_rate
          WHEN 'top4' THEN br.top4_rate
          ELSE br.contractor_rate
        END
      )::NUMERIC / r.sell_price) * 100, 1)
    ELSE NULL
  END AS rate_variance_percent

FROM resources r
LEFT JOIN resource_skills rs ON r.id = rs.resource_id AND rs.is_primary = TRUE
LEFT JOIN sfia_skills sk ON rs.skill_id = sk.id
LEFT JOIN sfia_benchmark_rates br ON 
  r.primary_role_id = br.role_id 
  AND rs.skill_id = br.skill_id 
  AND CAST(SUBSTRING(r.sfia_level FROM 2) AS INTEGER) = br.level
WHERE r.is_deleted IS NOT TRUE;
```

### 4.4 RLS Policies

```sql
-- SFIA reference tables: Read-only for all authenticated users
-- These are global reference data, not project-specific

CREATE POLICY "sfia_role_families_select" ON sfia_role_families
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sfia_roles_select" ON sfia_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sfia_skills_select" ON sfia_skills
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sfia_levels_select" ON sfia_levels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sfia_benchmark_rates_select" ON sfia_benchmark_rates
  FOR SELECT TO authenticated USING (true);

-- Admin-only write access (using profiles.role = 'admin')
CREATE POLICY "sfia_benchmark_rates_admin_insert" ON sfia_benchmark_rates
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "sfia_benchmark_rates_admin_update" ON sfia_benchmark_rates
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- resource_skills uses project-level access
CREATE POLICY "resource_skills_select" ON resource_skills
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM resources r 
    WHERE r.id = resource_skills.resource_id 
    AND can_access_project(r.project_id)
  ));

CREATE POLICY "resource_skills_insert" ON resource_skills
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM resources r 
    WHERE r.id = resource_skills.resource_id 
    AND can_access_project(r.project_id)
  ));
```

---

## 5. Migration Strategy

### 5.1 Migration Order

```
Phase 1: Reference Data (no dependencies)
  1. sfia_levels
  2. sfia_role_families
  3. sfia_skills
  4. sfia_roles

Phase 2: Benchmark Data
  5. sfia_benchmark_rates (29 initial records)

Phase 3: Resource Extensions
  6. ALTER resources (add columns)
  7. resource_skills (junction table)

Phase 4: Views & Indexes
  8. v_resource_benchmark_comparison
  9. Additional indexes
```

### 5.2 Migration Files

```
supabase/migrations/
├── 202512260001_create_sfia_reference_tables.sql
├── 202512260002_create_sfia_benchmark_rates.sql
├── 202512260003_alter_resources_add_sfia_columns.sql
├── 202512260004_create_resource_skills.sql
├── 202512260005_create_benchmark_views.sql
├── 202512260006_seed_sfia_reference_data.sql
├── 202512260007_seed_benchmark_rates.sql
└── 202512260008_add_rls_policies.sql
```

### 5.3 Data Migration for Existing Resources

```sql
-- Map existing resource roles to SFIA roles where possible
-- This is a best-effort mapping, not destructive

UPDATE resources
SET primary_role_id = CASE role
  WHEN 'Project Manager' THEN 'PM'
  WHEN 'Business Analyst' THEN 'BA_JUN'
  WHEN 'Senior Business Analyst' THEN 'BA_SEN'
  WHEN 'Technical Architect' THEN 'ARCH'
  WHEN 'Solution Architect' THEN 'ARCH'
  WHEN 'Developer' THEN 'DEV'
  WHEN 'Senior Developer' THEN 'DEV'
  WHEN 'Lead Developer' THEN 'TECHLEAD'
  WHEN 'Data Analyst' THEN 'DATAANAL'
  WHEN 'Designer' THEN NULL  -- No SFIA mapping
  WHEN 'UX Designer' THEN NULL
  WHEN 'Infrastructure Engineer' THEN 'DEVOPSENG'
  WHEN 'QA Engineer' THEN NULL  -- Could map to testing role
  ELSE NULL
END
WHERE primary_role_id IS NULL;

-- Default rate_tier based on resource_type
UPDATE resources
SET rate_tier = CASE resource_type
  WHEN 'internal' THEN 'contractor'
  WHEN 'third_party' THEN 'contractor'
  ELSE 'contractor'
END
WHERE rate_tier IS NULL;
```

---

## 6. Implementation Phases

### Phase 1: Database & Reference Data (Day 1)
**Goal:** Establish data foundation

| Task | Description | Est. Hours |
|------|-------------|------------|
| 1.1 | Create migration files for SFIA reference tables | 1 |
| 1.2 | Create sfia_benchmark_rates table | 0.5 |
| 1.3 | Create resource_skills junction table | 0.5 |
| 1.4 | Alter resources table (add columns) | 0.5 |
| 1.5 | Seed reference data (families, roles, skills, levels) | 1 |
| 1.6 | Seed benchmark rates (29 records) | 1 |
| 1.7 | Add RLS policies | 1 |
| 1.8 | Create views for reporting | 0.5 |
| **Total** | | **6 hours** |

### Phase 2: Service Layer (Day 1-2)
**Goal:** Backend API for SFIA data

| Task | Description | Est. Hours |
|------|-------------|------------|
| 2.1 | Create sfiaService.js (reference data) | 2 |
| 2.2 | Create benchmarkService.js (rates CRUD) | 2 |
| 2.3 | Extend resourcesService.js (skills, benchmark comparison) | 2 |
| 2.4 | Update resourceCalculations.js (L1-L7, rate tiers) | 1 |
| 2.5 | Add benchmark comparison utilities | 1 |
| **Total** | | **8 hours** |

### Phase 3: Standalone Benchmarking UI (Day 2-3)
**Goal:** Fully functional benchmarking tool

| Task | Description | Est. Hours |
|------|-------------|------------|
| 3.1 | Create Benchmarking.jsx page component | 3 |
| 3.2 | Create Benchmarking.css styles | 1 |
| 3.3 | Build filter panel (family, role, skill, level) | 2 |
| 3.4 | Build results table with sorting | 2 |
| 3.5 | Build statistics panel (averages) | 1 |
| 3.6 | Add to navigation (standalone menu item) | 0.5 |
| 3.7 | Add route to App.jsx | 0.5 |
| **Total** | | **10 hours** |

### Phase 4: Resource Integration (Day 3-4)
**Goal:** Link resources to SFIA skills and show benchmark comparison

| Task | Description | Est. Hours |
|------|-------------|------------|
| 4.1 | Update Resources.jsx - add skill selection | 2 |
| 4.2 | Update ResourceDetail.jsx - show skills, benchmark | 3 |
| 4.3 | Create SkillSelector component (multi-select) | 2 |
| 4.4 | Create BenchmarkIndicator component (vs market) | 1 |
| 4.5 | Update resource form - add role, rate tier fields | 2 |
| 4.6 | Extend SFIA level options to L1-L7 | 1 |
| **Total** | | **11 hours** |

### Phase 5: Finance Integration (Day 4-5)
**Goal:** Market rate variance in financial reporting

| Task | Description | Est. Hours |
|------|-------------|------------|
| 5.1 | Create BenchmarkVarianceWidget for dashboard | 2 |
| 5.2 | Add variance column to FinanceSummary | 1 |
| 5.3 | Create "Market Comparison" report section | 2 |
| 5.4 | Update finance calculations to include benchmark | 1 |
| **Total** | | **6 hours** |

### Phase 6: Admin & Polish (Day 5)
**Goal:** Admin tools and final polish

| Task | Description | Est. Hours |
|------|-------------|------------|
| 6.1 | Create BenchmarkAdmin page (system admin only) | 3 |
| 6.2 | Add rate CRUD functionality | 2 |
| 6.3 | Add bulk import (CSV) capability | 2 |
| 6.4 | Testing and bug fixes | 2 |
| 6.5 | Documentation updates | 1 |
| **Total** | | **10 hours** |

### Total Estimated Effort
| Phase | Hours | Days |
|-------|-------|------|
| Phase 1: Database | 6 | 0.75 |
| Phase 2: Services | 8 | 1.0 |
| Phase 3: Benchmarking UI | 10 | 1.25 |
| Phase 4: Resource Integration | 11 | 1.4 |
| Phase 5: Finance Integration | 6 | 0.75 |
| Phase 6: Admin & Polish | 10 | 1.25 |
| **Total** | **51 hours** | **~6.5 days** |

---

## 7. UI/UX Components

### 7.1 New Pages

#### `/benchmarking` - Standalone Benchmarking Tool
```
┌─────────────────────────────────────────────────────────────────┐
│ SFIA 8 Skills Benchmarking                          [Refresh]   │
│ Compare UK market rates by role, skill, and level               │
├───────────────────┬─────────────────────────────────────────────┤
│ FILTERS           │ BENCHMARK RATES                  23 results │
│                   │ ┌─────────────────────────────────────────┐ │
│ Role Family       │ │ Role    │ Skill  │ Level│Contractor│...│ │
│ [All Families ▼]  │ ├─────────────────────────────────────────┤ │
│                   │ │ Dev     │ Java   │ L3   │ £500     │...│ │
│ Specific Role     │ │ Dev     │ Cloud  │ L3   │ £550     │...│ │
│ [All Roles    ▼]  │ │ Arch    │ Cloud  │ L4   │ £700     │...│ │
│                   │ │ ...     │ ...    │ ...  │ ...      │...│ │
│ Skills            │ └─────────────────────────────────────────┘ │
│ ☑ Java            │                                             │
│ ☑ Python          │ STATISTICS                                  │
│ ☐ Cloud           │ ┌─────────┬─────────┬─────────┐            │
│ ☐ ML              │ │Contractor│Associate│ Top 4  │            │
│ ...               │ │  £583    │  £700   │ £1,133 │            │
│                   │ │ avg/day  │ avg/day │ avg/day│            │
│ SFIA Level        │ └─────────┴─────────┴─────────┘            │
│ ☐ L1  ☐ L2        │                                             │
│ ☑ L3  ☑ L4        │                                             │
│ ☑ L5  ☐ L6  ☐ L7  │                                             │
│                   │                                             │
│ Rate Types        │                                             │
│ ☑ Contractor      │                                             │
│ ☑ Associate       │                                             │
│ ☑ Top 4           │                                             │
│                   │                                             │
│ [Apply] [Reset]   │                                             │
└───────────────────┴─────────────────────────────────────────────┘
```

#### `/admin/benchmarks` - Benchmark Rate Administration (System Admin)
```
┌─────────────────────────────────────────────────────────────────┐
│ Benchmark Rate Administration                 [Import CSV] [+Add]│
├─────────────────────────────────────────────────────────────────┤
│ Search: [________________]  Filter: [All Levels ▼]              │
├─────────────────────────────────────────────────────────────────┤
│ Role          │ Skill     │ Level │ Contractor │ Associate │Top4│
│ Software Dev  │ Java      │ L1    │ £350 [edit]│ £400     │£650│
│ Software Dev  │ Java      │ L3    │ £500 [edit]│ £600     │£1k │
│ ...           │ ...       │ ...   │ ...        │ ...      │... │
├─────────────────────────────────────────────────────────────────┤
│ Total: 29 rates │ Last updated: 15 Jan 2025                     │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SkillSelector` | `components/sfia/SkillSelector.jsx` | Multi-select skills with checkboxes |
| `LevelSelector` | `components/sfia/LevelSelector.jsx` | SFIA level badges (L1-L7) |
| `BenchmarkIndicator` | `components/sfia/BenchmarkIndicator.jsx` | Shows vs market (↑12% above, ↓8% below) |
| `RateComparisonTable` | `components/sfia/RateComparisonTable.jsx` | Side-by-side rate comparison |
| `BenchmarkStats` | `components/sfia/BenchmarkStats.jsx` | Average rates panel |
| `RoleFamilyFilter` | `components/sfia/RoleFamilyFilter.jsx` | Cascading family→role filter |

### 7.3 Modified Pages

#### Resources.jsx Changes
- Add "Primary SFIA Role" dropdown (links to sfia_roles)
- Add "Rate Tier" selector (Contractor / Associate / Top 4)
- Add "Skills" multi-select (links to resource_skills)
- Extend SFIA Level to include L1, L2, L7

#### ResourceDetail.jsx Changes
- New "Skills & Benchmarking" section
- Show assigned skills with proficiency
- Show benchmark comparison (actual vs market rate)
- Visual indicator: ↑ Above market / ↓ Below market / = At market

#### FinanceSummary Changes
- New "Market Rate Analysis" widget
- Show average variance across all resources
- Highlight resources significantly above/below market

### 7.4 Navigation Integration

```javascript
// Add to src/lib/navigation.js

benchmarking: {
  id: 'benchmarking',
  path: '/benchmarking',
  icon: Award,  // or TrendingUp
  label: 'Rate Benchmarking',
  allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE],
  readOnlyRoles: [ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE]  // Can view but not edit rates
}
```

---

## 8. Integration Points

### 8.1 Resource → SFIA Mapping

```javascript
// When creating/editing a resource:

// 1. User selects SFIA Role (from sfia_roles)
resource.primary_role_id = 'DEV';  // Software Developer

// 2. User selects Skills (many-to-many via resource_skills)
resourceSkills = [
  { skill_id: 'JAVA', is_primary: true, proficiency: 'expert' },
  { skill_id: 'CLOUD', is_primary: false, proficiency: 'competent' }
];

// 3. User sets SFIA Level (existing field, extended to L1-L7)
resource.sfia_level = 'L4';

// 4. User sets Rate Tier for comparison
resource.rate_tier = 'contractor';  // or 'associate' or 'top4'

// 5. System calculates benchmark comparison
// Find benchmark for DEV + JAVA + L4
benchmark = getBenchmarkRate('DEV', 'JAVA', 4);
// { contractor: 650, associate: 800, top4: 1300 }

// Compare actual to benchmark
variance = resource.sell_price - benchmark[resource.rate_tier];
variancePercent = (variance / benchmark[resource.rate_tier]) * 100;
```

### 8.2 Finance → Benchmark Integration

```javascript
// In finance calculations:

// 1. Get all project resources with benchmark data
const resourcesWithBenchmarks = await resourcesService.getAllWithBenchmarks(projectId);

// 2. Calculate market rate variance per resource
resourcesWithBenchmarks.forEach(r => {
  r.marketVariance = r.sell_price - r.benchmarkRate;
  r.marketVariancePercent = (r.marketVariance / r.benchmarkRate) * 100;
});

// 3. Aggregate for project-level metrics
const avgVariance = average(resourcesWithBenchmarks.map(r => r.marketVariancePercent));
const totalActualCost = sum(resourcesWithBenchmarks.map(r => r.sell_price * r.daysUsed));
const totalBenchmarkCost = sum(resourcesWithBenchmarks.map(r => r.benchmarkRate * r.daysUsed));
const projectVariance = totalActualCost - totalBenchmarkCost;
```

### 8.3 Planning → Benchmark Integration (Future)

```javascript
// In project planning:

// 1. User creates plan item with role/skill requirements
planItem = {
  name: 'Build API',
  required_role: 'DEV',
  required_skill: 'JAVA',
  required_level: 4,
  estimated_days: 20
};

// 2. System estimates cost using benchmark rates
const benchmark = getBenchmarkRate('DEV', 'JAVA', 4);
planItem.estimated_cost = {
  contractor: benchmark.contractor * planItem.estimated_days,  // £13,000
  associate: benchmark.associate * planItem.estimated_days,    // £16,000
  top4: benchmark.top4 * planItem.estimated_days               // £26,000
};

// 3. User can compare before assigning actual resource
```

---

## 9. API & Service Layer

### 9.1 New Services

#### `sfiaService.js`
```javascript
// Reference data access (read-only for most users)

export const sfiaService = {
  // Role Families
  async getRoleFamilies() { ... },
  async getRoleFamily(id) { ... },
  
  // Roles
  async getRoles(familyId = null) { ... },
  async getRole(id) { ... },
  
  // Skills
  async getSkills(category = null) { ... },
  async getSkill(id) { ... },
  
  // Levels
  async getLevels() { ... },
  async getLevel(level) { ... },
  
  // Combined for dropdowns
  async getFilterOptions() { 
    // Returns { families, roles, skills, levels } in one call
  }
};
```

#### `benchmarkService.js`
```javascript
// Benchmark rate operations

export const benchmarkService = {
  // Query
  async getAll(filters = {}) { ... },
  async getRate(roleId, skillId, level) { ... },
  async getRatesForRole(roleId) { ... },
  async getRatesForSkill(skillId) { ... },
  
  // Statistics
  async getAverageRates(filters = {}) { ... },
  
  // Admin CRUD (system admin only)
  async create(rateData) { ... },
  async update(id, rateData) { ... },
  async delete(id) { ... },
  async bulkImport(csvData) { ... },
  
  // Comparison
  async compareToMarket(sellPrice, roleId, skillId, level, tier) { ... }
};
```

### 9.2 Extended Services

#### `resourcesService.js` (additions)
```javascript
// Add to existing service

// Skills management
async getResourceSkills(resourceId) { ... },
async setResourceSkills(resourceId, skills) { ... },
async addResourceSkill(resourceId, skillId, proficiency, isPrimary) { ... },
async removeResourceSkill(resourceId, skillId) { ... },

// Benchmark integration
async getWithBenchmark(resourceId) { ... },
async getAllWithBenchmarks(projectId) { ... },
async getBenchmarkComparison(resourceId) { ... }
```

### 9.3 Utility Functions

#### `benchmarkCalculations.js`
```javascript
// Pure functions for benchmark comparisons

export function calculateMarketVariance(actualRate, benchmarkRate) {
  if (!benchmarkRate || benchmarkRate === 0) return null;
  return {
    amount: actualRate - benchmarkRate,
    percent: ((actualRate - benchmarkRate) / benchmarkRate) * 100
  };
}

export function getVarianceIndicator(variancePercent) {
  if (variancePercent === null) return { label: 'N/A', color: 'gray', icon: null };
  if (variancePercent > 10) return { label: 'Above Market', color: 'red', icon: '↑' };
  if (variancePercent < -10) return { label: 'Below Market', color: 'green', icon: '↓' };
  return { label: 'At Market', color: 'blue', icon: '=' };
}

export function calculateHourlyRate(dailyRate, hoursPerDay = 8) {
  return dailyRate / hoursPerDay;
}

export function formatRate(rate, currency = '£') {
  if (rate === null || rate === undefined) return '-';
  return `${currency}${rate.toLocaleString()}`;
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```javascript
// benchmarkCalculations.test.js

describe('calculateMarketVariance', () => {
  it('calculates positive variance (above market)', () => {
    const result = calculateMarketVariance(700, 500);
    expect(result.amount).toBe(200);
    expect(result.percent).toBe(40);
  });
  
  it('calculates negative variance (below market)', () => {
    const result = calculateMarketVariance(400, 500);
    expect(result.amount).toBe(-100);
    expect(result.percent).toBe(-20);
  });
  
  it('handles zero benchmark gracefully', () => {
    const result = calculateMarketVariance(500, 0);
    expect(result).toBeNull();
  });
});
```

### 10.2 Integration Tests

```javascript
// benchmarkService.test.js

describe('benchmarkService', () => {
  it('fetches all benchmark rates', async () => {
    const rates = await benchmarkService.getAll();
    expect(rates.length).toBeGreaterThanOrEqual(29);
  });
  
  it('filters by role', async () => {
    const rates = await benchmarkService.getAll({ roleId: 'DEV' });
    expect(rates.every(r => r.role_id === 'DEV')).toBe(true);
  });
  
  it('returns correct rate for specific combination', async () => {
    const rate = await benchmarkService.getRate('DEV', 'JAVA', 3);
    expect(rate.contractor_rate).toBe(500);
    expect(rate.associate_rate).toBe(600);
    expect(rate.top4_rate).toBe(1000);
  });
});
```

### 10.3 E2E Tests

```javascript
// benchmarking.e2e.test.js

describe('Benchmarking Page', () => {
  it('loads with all benchmark data', async () => {
    await page.goto('/benchmarking');
    await expect(page.locator('[data-testid="results-count"]')).toContainText('29 results');
  });
  
  it('filters by role family', async () => {
    await page.selectOption('[data-testid="family-filter"]', 'SE');
    await expect(page.locator('[data-testid="results-count"]')).toContainText(/\d+ results/);
  });
  
  it('shows statistics panel', async () => {
    await expect(page.locator('[data-testid="avg-contractor"]')).toBeVisible();
    await expect(page.locator('[data-testid="avg-associate"]')).toBeVisible();
    await expect(page.locator('[data-testid="avg-top4"]')).toBeVisible();
  });
});
```

---

## 11. Rollback Plan

### If Migration Fails

```sql
-- Rollback script (reverse order)

-- Drop views
DROP VIEW IF EXISTS v_resource_benchmark_comparison;

-- Drop junction table
DROP TABLE IF EXISTS resource_skills;

-- Remove columns from resources
ALTER TABLE resources DROP COLUMN IF EXISTS primary_role_id;
ALTER TABLE resources DROP COLUMN IF EXISTS rate_tier;

-- Drop benchmark rates
DROP TABLE IF EXISTS sfia_benchmark_rates;

-- Drop reference tables
DROP TABLE IF EXISTS sfia_roles;
DROP TABLE IF EXISTS sfia_skills;
DROP TABLE IF EXISTS sfia_levels;
DROP TABLE IF EXISTS sfia_role_families;
```

### If Feature Needs Disabling

```javascript
// Feature flag in .env
VITE_FEATURE_SFIA_BENCHMARKING=false

// In navigation.js
if (import.meta.env.VITE_FEATURE_SFIA_BENCHMARKING !== 'true') {
  delete NAV_ITEMS.benchmarking;
}
```

---

## 12. File Manifest

### New Files to Create

```
Database Migrations:
├── supabase/migrations/
│   ├── 202512260001_create_sfia_reference_tables.sql
│   ├── 202512260002_create_sfia_benchmark_rates.sql
│   ├── 202512260003_alter_resources_add_sfia_columns.sql
│   ├── 202512260004_create_resource_skills.sql
│   ├── 202512260005_create_benchmark_views.sql
│   ├── 202512260006_seed_sfia_reference_data.sql
│   ├── 202512260007_seed_benchmark_rates.sql
│   └── 202512260008_add_rls_policies.sql

Services:
├── src/services/
│   ├── sfia.service.js           (NEW)
│   └── benchmark.service.js      (NEW)

Libraries:
├── src/lib/
│   └── benchmarkCalculations.js  (NEW)

Components:
├── src/components/sfia/
│   ├── index.js                  (NEW)
│   ├── SkillSelector.jsx         (NEW)
│   ├── SkillSelector.css         (NEW)
│   ├── LevelSelector.jsx         (NEW)
│   ├── BenchmarkIndicator.jsx    (NEW)
│   ├── RateComparisonTable.jsx   (NEW)
│   ├── BenchmarkStats.jsx        (NEW)
│   └── RoleFamilyFilter.jsx      (NEW)

Pages:
├── src/pages/
│   ├── Benchmarking.jsx          (NEW)
│   ├── Benchmarking.css          (NEW)
│   └── admin/
│       ├── BenchmarkAdmin.jsx    (NEW)
│       └── BenchmarkAdmin.css    (NEW)

Tests:
├── src/__tests__/
│   ├── unit/
│   │   └── benchmarkCalculations.test.js  (NEW)
│   └── integration/
│       └── benchmarkService.test.js       (NEW)
```

### Files to Modify

```
Services:
├── src/services/
│   ├── resources.service.js      (ADD skills & benchmark methods)
│   └── index.js                  (EXPORT new services)

Libraries:
├── src/lib/
│   ├── resourceCalculations.js   (EXTEND SFIA levels L1-L7)
│   └── navigation.js             (ADD benchmarking nav item)

Pages:
├── src/pages/
│   ├── Resources.jsx             (ADD SFIA role, skills, rate tier)
│   ├── ResourceDetail.jsx        (ADD benchmark comparison section)
│   └── finance/
│       └── FinanceSummaryContent.jsx  (ADD market variance widget)

Routing:
├── src/App.jsx                   (ADD /benchmarking route)
```

---

## Appendix A: Complete Seed Data

See original document for:
- 6 Role Families
- 24 Roles
- 15 Skills
- 7 SFIA Levels
- 29 Benchmark Rate Records

---

## Appendix B: Decision Log

| Decision | Options Considered | Chosen | Rationale |
|----------|-------------------|--------|-----------|
| Storage location | Global vs per-org | Global | UK market rates apply universally; orgs can adjust via sell_price |
| Rate tiers | 2 vs 3 tiers | 3 | Contractor/Associate/Top4 matches document spec |
| SFIA levels | L3-L6 vs L1-L7 | L1-L7 | Full SFIA compliance, future-proof |
| Admin access | All admins vs system only | System admin only | Rate data is sensitive, centrally managed |
| Resource linking | Required vs optional | Optional | Existing resources don't break without SFIA mapping |

---

**Document Complete**

Ready for implementation on your approval.
