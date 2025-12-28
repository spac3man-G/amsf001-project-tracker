# SFIA 8 Implementation - Assumption Validation & AI Rate Update Analysis

## Document Version
- **Version:** 1.1 (Validation Update)
- **Created:** 25 December 2025
- **Purpose:** Validate implementation assumptions and explore AI-assisted rate updates

---

## 1. VALIDATED ASSUMPTIONS ✅

### 1.1 Database Schema Patterns

**Confirmed:**
- RLS uses `can_access_project(project_id)` function (verified in plan_items migration)
- SECURITY DEFINER helper functions exist: `is_system_admin()`, `is_org_admin()`, `is_org_member()`
- Soft delete pattern uses `is_deleted BOOLEAN DEFAULT FALSE`
- Audit columns: `created_at`, `updated_at`, `created_by`
- Foreign key pattern: `REFERENCES table(id) ON DELETE CASCADE` or `ON DELETE SET NULL`

**Example Migration Pattern (from plan_items):**
```sql
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  -- columns --
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_deleted BOOLEAN DEFAULT FALSE
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view for accessible projects"
  ON table_name FOR SELECT
  USING (can_access_project(project_id));
```

### 1.2 Current SFIA Implementation

**Current State in `resourceCalculations.js`:**
```javascript
export const SFIA_LEVELS = Object.freeze({
  L3: { value: 3, label: 'L3', cssClass: 'sfia-default' },
  L4: { value: 4, label: 'L4', cssClass: 'sfia-l4' },
  L5: { value: 5, label: 'L5', cssClass: 'sfia-l5' },
  L6: { value: 6, label: 'L6', cssClass: 'sfia-l6' }
});
```

**Gap:** Missing L1, L2, L7 - need to extend for full SFIA 8 compliance.

### 1.3 Service Layer Pattern

**Confirmed Pattern (from resources.service.js):**
```javascript
export class ServiceName extends BaseService {
  constructor() {
    super('table_name', {
      sanitizeConfig: 'entity_type',
      supportsSoftDelete: true
    });
  }
  // Custom methods
}

export const serviceName = new ServiceName();
```

**Export Pattern (services/index.js):**
```javascript
export { serviceName, ServiceName } from './service.service';
```

### 1.4 Navigation Configuration

**Location:** `src/lib/navigation.js`

**Pattern for Adding New Nav Item:**
```javascript
// 1. Add to NAV_ITEMS
export const NAV_ITEMS = {
  benchmarking: {
    id: 'benchmarking',
    path: '/benchmarking',
    icon: TrendingUp,  // or Award
    label: 'Benchmarking',
    allowedRoles: [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM, ROLES.SUPPLIER_FINANCE],
    readOnlyRoles: [ROLES.CUSTOMER_PM]
  }
};

// 2. Add to ROLE_NAV_ORDER for each role
[ROLES.ADMIN]: ['dashboard', ... , 'benchmarking', ...]
```

### 1.5 Route Configuration

**Location:** `src/App.jsx`

**Pattern for Adding New Route:**
```javascript
// 1. Lazy import at top
const Benchmarking = lazy(() => import('./pages/benchmarking/Benchmarking'));

// 2. Add Route inside <Routes>
<Route path="/benchmarking" element={
  <ProtectedRoute><Benchmarking /></ProtectedRoute>
} />
```

### 1.6 Role System

**Confirmed Roles (from permissionMatrix.js):**
```javascript
export const ROLES = {
  ADMIN: 'admin',
  SUPPLIER_PM: 'supplier_pm',
  SUPPLIER_FINANCE: 'supplier_finance',
  CUSTOMER_PM: 'customer_pm',
  CUSTOMER_FINANCE: 'customer_finance',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer'
};
```

**Admin Check Function:** `is_system_admin()` checks `profiles.role = 'admin'`

---

## 2. CORRECTIONS TO ORIGINAL PLAN

### 2.1 SFIA Reference Tables - Scope Decision

**Original Plan Issue:** Reference tables (sfia_role_families, sfia_roles, sfia_skills, sfia_levels) were designed as global tables without `project_id`.

**CONFIRMED: This is CORRECT.** 

SFIA reference data is global/universal - it doesn't vary by project or organisation. The benchmark rates are UK market data that apply across all tenants. This matches how organisations table works (org-level, not project-level).

**RLS for Global Reference Tables:**
```sql
-- Read-only for all authenticated users (no project_id check needed)
CREATE POLICY "sfia_reference_select" ON sfia_role_families
  FOR SELECT TO authenticated USING (true);

-- Write access restricted to system admin only
CREATE POLICY "sfia_reference_admin_write" ON sfia_benchmark_rates
  FOR INSERT TO authenticated
  WITH CHECK (is_system_admin());
```

### 2.2 Resource Table - Schema Clarification

**Finding:** The `resources` table schema is not in migrations (predates migration tracking).

**Current resource fields (from codebase analysis):**
- `id`, `project_id`, `name`, `email`, `role`
- `sfia_level` (stores 'L3', 'L4', etc. as TEXT)
- `sell_price`, `cost_price`
- `resource_type` ('internal' | 'third_party')
- `partner_id`, `user_id`, `resource_ref`
- `is_active`, `is_test_content`, `is_deleted`

**Confirmed Safe to Add:**
```sql
ALTER TABLE resources ADD COLUMN IF NOT EXISTS primary_role_id VARCHAR(20);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS rate_tier VARCHAR(20) DEFAULT 'contractor';
```

### 2.3 Navigation Placement

**Correction:** Benchmarking should be a standalone nav item (not buried in settings).

**Recommended Position:** After 'Finance' in the nav order, as it's related to costing/rates.

---

## 3. AI-ASSISTED RATE UPDATES - COMPREHENSIVE ANALYSIS

### 3.1 Available Data Sources (Verified by Web Search)

| Source | Data Type | Accessibility | Update Frequency |
|--------|-----------|---------------|------------------|
| **ITJobsWatch** | UK contractor rates by role/skill | Public web pages | Rolling 6-month |
| **Hays Day Rate Guide** | Tech contractor rates | Gated PDF (form required) | Annual |
| **ContractorUK** | Market commentary + aggregated data | Public articles | Monthly reports |
| **G-Cloud/Digital Marketplace** | Government contract rates | Public procurement data | Per contract |
| **Consultancy.uk** | Big 4 / consultant fee ranges | Public articles | Occasional |

### 3.2 What Claude CAN Do (AI Rate Update Capability)

**✅ Claude CAN:**

1. **Search for current UK contractor rates by role/skill**
   - ITJobsWatch provides excellent, current data
   - Example: "Java Developer median £525/day" (as of Aug 2025)
   - Example: "Software Developer median £544/day" (as of Dec 2025)

2. **Extract structured data from search results**
   - Parse role names, skills, daily rates
   - Identify median, min, max ranges

3. **Generate SQL UPDATE statements**
   ```sql
   UPDATE sfia_benchmark_rates 
   SET contractor_rate = 525, updated_at = NOW()
   WHERE role_id = 'DEV' AND skill_id = 'JAVA' AND level = 3;
   ```

4. **Create a "Rate Update Report" comparing old vs new**
   - Show which rates changed
   - Calculate percentage changes
   - Flag significant deviations

5. **Research Big 4 / consultancy rates from government contract data**
   - G-Cloud publishes rate cards
   - LinkedIn article mentioned: "mean level 4 rate for Big Four ~£1,500/day"

### 3.3 What Claude CANNOT Do (Limitations)

**❌ Claude CANNOT:**

1. **Access gated content** (e.g., Hays PDF requires form submission)
2. **Scrape/crawl websites programmatically** (can only use web_search + web_fetch)
3. **Access real-time API data** (no direct ITJobsWatch API)
4. **Guarantee data accuracy** (web sources can be outdated)
5. **Execute database updates directly** (can only generate SQL)

### 3.4 Recommended AI Rate Update Workflow

**Option A: User-Triggered AI Research (Recommended for MVP)**

```
User clicks "Update Rates" button
  → Claude receives instruction to research current UK rates
  → Claude performs web searches for each role/skill combination
  → Claude generates "Rate Update Preview" document
  → User reviews and approves/rejects changes
  → Approved changes applied via admin interface
```

**Implementation:**
```javascript
// Button in BenchmarkAdmin.jsx
<button onClick={() => triggerAIRateResearch()}>
  🤖 Research Current Rates
</button>

// AI instruction (sent to Claude via chat or API)
const prompt = `
Research current UK IT contractor day rates for:
- Software Developer (Java, Python, Cloud skills)
- Data Scientist (ML, Analytics)
- Solutions Architect (Cloud, K8S)

Use ITJobsWatch as primary source. Return as JSON:
{
  "rates": [
    { "role": "DEV", "skill": "JAVA", "level": 3, "contractor_rate": 525, "source": "ITJobsWatch Dec 2025" }
  ],
  "confidence": "high",
  "methodology": "Median rates from ITJobsWatch 6-month rolling average"
}
`;
```

**Option B: Scheduled Quarterly Research**

```
Quarterly cron job triggers AI research
  → AI generates draft rate updates
  → Admin receives notification
  → Admin reviews in "Pending Rate Updates" queue
  → One-click apply or manual adjustment
```

### 3.5 Data Quality & Confidence Framework

| Confidence Level | Criteria | Action |
|-----------------|----------|--------|
| **High (95%+)** | ITJobsWatch median rate, multiple corroborating sources | Auto-suggest for approval |
| **Medium (70-95%)** | Single source, or aggregated data | Flag for manual review |
| **Low (<70%)** | Estimated, extrapolated, or outdated data | Do not auto-suggest |

### 3.6 Rate Update Audit Trail

```sql
-- Add to sfia_benchmark_rates
ALTER TABLE sfia_benchmark_rates ADD COLUMN IF NOT EXISTS 
  update_source TEXT,           -- 'itjobswatch', 'g-cloud', 'manual'
  update_method TEXT,           -- 'ai_research', 'manual_entry', 'bulk_import'
  previous_rate INTEGER,        -- For audit
  rate_change_percent NUMERIC;  -- Calculated
```

### 3.7 Sample AI Research Output

When asked "Research current UK Java Developer rates", Claude can produce:

```markdown
## UK Java Developer Rate Research - December 2025

### Source: ITJobsWatch (6-month rolling to Dec 2025)

| Level | Title | Daily Rate | Change YoY |
|-------|-------|-----------|------------|
| Junior (L2) | Java Developer | £400-450 | +2% |
| Mid (L3) | Java Developer | £500-525 | +3% |
| Senior (L4) | Senior Java Developer | £575-625 | +4% |
| Lead (L5) | Lead Java Developer | £650-750 | +5% |

### Confidence: HIGH
- Source: ITJobsWatch public data
- Sample size: 2,500+ job postings
- Methodology: Median of posted contract rates

### Recommended Updates:
```sql
UPDATE sfia_benchmark_rates SET contractor_rate = 450 WHERE role_id = 'DEV' AND skill_id = 'JAVA' AND level = 2;
UPDATE sfia_benchmark_rates SET contractor_rate = 525 WHERE role_id = 'DEV' AND skill_id = 'JAVA' AND level = 3;
UPDATE sfia_benchmark_rates SET contractor_rate = 600 WHERE role_id = 'DEV' AND skill_id = 'JAVA' AND level = 4;
UPDATE sfia_benchmark_rates SET contractor_rate = 700 WHERE role_id = 'DEV' AND skill_id = 'JAVA' AND level = 5;
```
```

---

## 4. REVISED IMPLEMENTATION APPROACH

### 4.1 Phase 1 Adjustment: Start Simpler

Given the validation, I recommend a slightly revised Phase 1:

**Phase 1A: Static Benchmarking Page (Day 1)**
- Single React page with embedded JSON data
- No database tables yet
- Validates UI/UX before database investment
- AI can help research initial seed data

**Phase 1B: Database + Admin (Days 2-3)**
- Create tables only after UI is validated
- AI-assisted initial data seeding
- Admin CRUD interface

### 4.2 AI Integration Points

| Phase | AI Capability |
|-------|---------------|
| Phase 1A | Research initial benchmark rates from ITJobsWatch |
| Phase 1B | Generate SQL seed data from research |
| Phase 3 | Help users understand rate positioning ("Your rate is 15% above market for L4 Java") |
| Phase 5 | Quarterly rate refresh research |
| Future | Natural language queries ("What should I charge for a senior Python developer?") |

---

## 5. UPDATED FILE MANIFEST

### Files Confirmed to Exist (Can Be Extended)
```
src/lib/resourceCalculations.js    ← Extend SFIA_LEVELS
src/lib/navigation.js              ← Add benchmarking nav item
src/lib/permissionMatrix.js        ← Add benchmarking permissions
src/services/index.js              ← Export new services
src/services/resources.service.js  ← Add benchmark methods
src/App.jsx                        ← Add /benchmarking route
```

### Files to Create (No Changes from Original Plan)
```
Database:
  supabase/migrations/202512260001_create_sfia_reference_tables.sql
  supabase/migrations/202512260002_create_sfia_benchmark_rates.sql
  ...

Services:
  src/services/sfia.service.js
  src/services/benchmark.service.js

Pages:
  src/pages/benchmarking/Benchmarking.jsx
  src/pages/benchmarking/Benchmarking.css
  src/pages/admin/BenchmarkAdmin.jsx (optional - for AI rate updates)

Components:
  src/components/sfia/...
```

---

## 6. DECISION POINTS FOR YOU

Before implementation, please confirm:

1. **Navigation Position:** Should benchmarking appear:
   - [ ] In main nav (after Finance)
   - [ ] In Settings tabs
   - [ ] As a standalone tool (separate from project context)

2. **AI Rate Updates:** Preferred approach:
   - [ ] Option A: User-triggered research (MVP, lower complexity)
   - [ ] Option B: Scheduled quarterly (more automation)
   - [ ] Option C: Manual-only (no AI assistance)

3. **Access Control:** Who can view benchmarking?
   - [ ] All authenticated users
   - [ ] Supplier-side roles only (Admin, Supplier PM, Supplier Finance)
   - [ ] Admin only

4. **Phase 1 Approach:**
   - [ ] Phase 1A first (static page validation)
   - [ ] Jump to Phase 1B (database immediately)

---

## 7. CONCLUSION

The original implementation plan is **fundamentally sound** with these clarifications:

1. **Schema patterns match** existing codebase conventions
2. **RLS approach is correct** for global reference data
3. **AI CAN assist** with rate research using ITJobsWatch as primary source
4. **Confidence is high** for contractor rates, lower for Big 4 consultancy rates
5. **Recommended workflow:** User-triggered AI research → Admin review → Apply

Ready to proceed when you confirm the decision points above.
