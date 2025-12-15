# Cost Estimation Tool - Feature Analysis

**Created:** 2025-12-15  
**Updated:** 2025-12-15  
**Status:** Initial Analysis - Awaiting Answers to Open Questions  
**Cross-References:** 
- [Multi-Tenancy Roadmap](./MULTI-TENANCY-ROADMAP.md) — Master implementation plan
- [Project Wizard Analysis](./PROJECT-WIZARD-VALIDATED.md) — Related feature for project creation

---

## Executive Summary

This document analyzes a new **Cost Estimation Tool** that operates as a pre-project planning and estimating tool for Supplier PMs. With the introduction of supplier-level multi-tenancy (see MULTI-TENANCY-ROADMAP.md), this tool will be **supplier-scoped**, meaning:

- Estimates belong to a specific supplier (e.g., JT Group)
- Uses the supplier's rate card (not a global rate card)
- Can be shared among Supplier PMs within that supplier
- Baselines can be imported into the supplier's projects via the Project Wizard

**Key Integration Point:** The Project Wizard can import estimate baselines to create new projects or add work to existing projects, making these two features tightly coupled.

---

## ⚠️ OPEN QUESTIONS — Answers Required Before Implementation

### Questions About Estimate Visibility & Sharing

| # | Question | Options | Impact on Design |
|---|----------|---------|------------------|
| **Q1** | Can Supplier PMs see each other's estimates within the same supplier? | A) Yes - all supplier PMs see all estimates<br>B) No - only creator sees their estimates<br>C) Configurable - creator can share | Affects RLS policies and UI (sharing controls) |
| **Q2** | Can estimates be transferred between Supplier PMs? | A) Yes<br>B) No | Ownership model complexity |

### Questions About Baselines & Approvals

| # | Question | Options | Impact on Design |
|---|----------|---------|------------------|
| **Q3** | Does creating a baseline require approval/sign-off? | A) No - PM creates freely<br>B) Yes - requires Supplier Admin approval<br>C) Optional - configurable per supplier | Workflow complexity, additional UI |
| **Q4** | Can baselines be edited after creation? | A) No - baselines are immutable snapshots<br>B) Yes - can be updated (versioned)<br>C) Can be "superseded" by new baseline | Data model design |

### Questions About Rate Cards

| # | Question | Options | Impact on Design |
|---|----------|---------|------------------|
| **Q5** | If rate card rates change, what happens to existing estimates? | A) Estimates update automatically<br>B) Estimates keep historical rates (locked at creation)<br>C) User chooses to update or keep | Rate versioning complexity |
| **Q6** | Can suppliers have multiple rate cards (e.g., by client, by contract type)? | A) One rate card per supplier<br>B) Multiple rate cards per supplier | Schema design |

### Questions About Currency & Localization

| # | Question | Options | Impact on Design |
|---|----------|---------|------------------|
| **Q7** | Is GBP the only currency, or is multi-currency needed? | A) GBP only<br>B) Multi-currency (per estimate)<br>C) Multi-currency (per supplier default) | Schema, calculations, display |

### Questions About Templates & Reuse

| # | Question | Options | Impact on Design |
|---|----------|---------|------------------|
| **Q8** | Should there be pre-built estimate templates? | A) No templates<br>B) Supplier-defined templates<br>C) System-wide + supplier templates | Additional feature scope |
| **Q9** | Can an estimate be cloned/duplicated? | A) Yes<br>B) No | UI feature |

### Questions About UI & UX

| # | Question | Options | Impact on Design |
|---|----------|---------|------------------|
| **Q10** | Reuse existing Gantt component or build new for estimates? | A) Adapt existing (faster, consistent)<br>B) Build new (more control, optimized for estimates) | Development effort |
| **Q11** | Is offline support needed for estimates? | A) No - online only<br>B) Yes - must work offline | Architecture complexity (significant) |

### Questions About Export & Integration

| # | Question | Options | Impact on Design |
|---|----------|---------|------------------|
| **Q12** | PDF/Excel export of estimates required? | A) Not for MVP<br>B) Yes - PDF summary<br>C) Yes - Excel with full detail | Additional feature scope |
| **Q13** | Integration with external systems (e.g., accounting, CRM)? | A) Not for MVP<br>B) Yes - specify which | API design, webhooks |

---

## Part 1: Feature Requirements

### 1.1 Centralized Rate Card (Supplier-Scoped)

**UPDATE:** With supplier tenancy, the rate card is now **per-supplier**, not system-wide.

Each supplier maintains their own standardized roles with rates:

| Field | Type | Description |
|-------|------|-------------|
| Supplier ID | UUID | **Owner supplier** |
| Role Code | Text | Unique within supplier (e.g., "PM-L5", "DEV-L3") |
| Role Title | Text | Display name (e.g., "Project Manager") |
| Role Description | Text | Detailed description of the role |
| SFIA Level | Integer (1-7) | Skills Framework for the Information Age rating |
| Cost Rate | Decimal | Daily cost (what you pay) |
| Sell Rate | Decimal | Daily sell rate (what you charge) |
| Category | Text | Grouping (e.g., "Management", "Technical", "Support") |
| Is Active | Boolean | Whether available for new estimates |

**Access Control:**
- System Admin: Can view all suppliers' rate cards (audit)
- Supplier Admin: Full CRUD for their supplier's rate card
- Supplier PM: Full CRUD for their supplier's rate card
- Others: No access

### 1.2 Cost Estimation (Supplier-Scoped)

**UPDATE:** Estimates are now **supplier-scoped**.

| Field | Type | Description |
|-------|------|-------------|
| Estimate ID | UUID | Primary key |
| **Supplier ID** | UUID | **Owner supplier** |
| Estimate Reference | Text | Auto-generated within supplier (e.g., "EST-001") |
| Name | Text | Estimate name |
| Description | Text | Purpose/scope of estimate |
| Client Name | Text | Prospective client (optional) |
| Created By | UUID | Supplier PM who created it |
| Status | Text | Draft, In Review, Baselined, Archived |
| Created At | Timestamp | Creation date |
| Updated At | Timestamp | Last modified |

### 1.3 Estimate Work Breakdown Structure

#### Estimate Milestones

| Field | Type | Description |
|-------|------|-------------|
| ID | UUID | Primary key |
| Estimate ID | UUID | Parent estimate |
| Milestone Ref | Text | Reference (e.g., "M01") |
| Name | Text | Milestone name |
| Description | Text | Milestone description |
| Start Mode | Text | "fixed_date" or "relative" |
| Start Date | Date | If fixed_date mode |
| Start Offset Days | Integer | If relative mode (days after project start) |
| Duration Days | Integer | Planned duration |
| Sort Order | Integer | Display order |

#### Estimate Milestone Dependencies

| Field | Type | Description |
|-------|------|-------------|
| ID | UUID | Primary key |
| Milestone ID | UUID | The milestone |
| Depends On ID | UUID | Milestone it depends on |
| Dependency Type | Text | finish_to_start, start_to_start, etc. |
| Lag Days | Integer | Gap between milestones |

#### Estimate Deliverables

| Field | Type | Description |
|-------|------|-------------|
| ID | UUID | Primary key |
| Estimate ID | UUID | Parent estimate |
| Milestone ID | UUID | Parent milestone (optional) |
| Deliverable Ref | Text | Reference (e.g., "D01") |
| Name | Text | Deliverable name |
| Description | Text | Deliverable description |
| Due Offset Days | Integer | Days after milestone start |
| Sort Order | Integer | Display order |

### 1.4 Resource Allocations

| Field | Type | Description |
|-------|------|-------------|
| ID | UUID | Primary key |
| Estimate ID | UUID | Parent estimate |
| Milestone ID | UUID | Target milestone (optional) |
| Deliverable ID | UUID | Target deliverable (optional) |
| Role ID | UUID | Reference to rate card role |
| Effort Days | Decimal | Estimated effort in days |
| Notes | Text | Allocation notes |

**Note:** Allocations can be at milestone OR deliverable level, providing flexibility.

### 1.5 Estimate Baselines

| Field | Type | Description |
|-------|------|-------------|
| ID | UUID | Primary key |
| Estimate ID | UUID | Parent estimate |
| Baseline Number | Integer | Version number (1, 2, 3...) |
| Name | Text | Baseline name (e.g., "Initial Quote", "Revised v2") |
| Description | Text | What changed from previous |
| Snapshot Data | JSONB | Complete snapshot of WBS + allocations |
| Total Cost | Decimal | Calculated total cost |
| Total Sell | Decimal | Calculated total sell value |
| Total Days | Decimal | Calculated total effort |
| Created At | Timestamp | When baseline was created |
| Created By | UUID | Who created it |

### 1.6 Summary Views Required

1. **Plan View** - WBS with milestones, deliverables, dates
2. **Gantt View** - Visual timeline with dependencies
3. **Resource View** - Allocations by role, utilization
4. **Cost View** - Breakdown by milestone, role, totals
5. **Comparison View** - Compare baselines side-by-side

---

## Part 2: Integration with Project Wizard

### 2.1 Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUPPLIER SCOPE                                 │
│                                                                         │
│  ┌─────────────────┐         ┌─────────────────┐                       │
│  │   RATE CARD     │         │   ESTIMATES     │                       │
│  │                 │ ──uses──│                 │                       │
│  │ • PM-L5: £1092  │         │ • Network Audit │                       │
│  │ • BA-L4: £976   │         │ • DC Assessment │                       │
│  │ • DEV-L3: £850  │         │                 │                       │
│  └─────────────────┘         └────────┬────────┘                       │
│                                       │                                 │
│                                       │ baseline                        │
│                                       ▼                                 │
│                              ┌─────────────────┐                       │
│                              │ PROJECT WIZARD  │                       │
│                              │                 │                       │
│                              │ "Import from    │                       │
│                              │  estimate"      │                       │
│                              └────────┬────────┘                       │
│                                       │                                 │
│                                       │ creates                         │
│                                       ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         PROJECTS                                 │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │  AMSF001    │  │  Future A   │  │  Future B   │              │   │
│  │  │             │  │             │  │             │              │   │
│  │  │ Milestones ←───────── Imported from estimate baseline        │   │
│  │  │ Deliverables│  │             │  │             │              │   │
│  │  │ Resources   │  │             │  │             │              │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  │                                                                  │   │
│  │  Uses actual named RESOURCES from supplier's resource pool       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Import Flow: Estimate → Project

When the Project Wizard imports an estimate baseline:

| Estimate Entity | Maps To | Transformation |
|-----------------|---------|----------------|
| Estimate | Project | Name, description, dates |
| Estimate Milestone | Milestone | Dates calculated from project start |
| Estimate Deliverable | Deliverable | Linked to milestone |
| Estimate Allocation (Role) | **Resource placeholder** | Role specified, actual person TBD |
| Rate Card Role | Resource template | Rates copied to resource |

**Key Decision Point:** Allocations in estimates use generic roles (PM-L5). When importing to a project, the Supplier PM must either:
- A) Assign actual named resources from the supplier's pool
- B) Create placeholder resources with the role/rate (to be assigned later)
- C) Skip resource assignment entirely (just import structure)

### 2.3 Shared Components

These components can be reused between Estimation Tool and Project management:

| Component | Estimation Tool | Project Management |
|-----------|-----------------|-------------------|
| Gantt Chart | Estimate planning | Project tracking |
| WBS Editor | Estimate structure | Milestone/Deliverable editing |
| Resource Selector | Role from rate card | Named person from pool |
| Cost Calculator | Estimate costing | Project budget tracking |

---

## Part 3: Database Schema

### 3.1 New Tables Required

```sql
-- ================================================
-- RATE CARD (Supplier-Scoped)
-- ================================================
CREATE TABLE rate_card_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  role_code TEXT NOT NULL,
  role_title TEXT NOT NULL,
  role_description TEXT,
  sfia_level INTEGER CHECK (sfia_level BETWEEN 1 AND 7),
  cost_rate DECIMAL(10,2) NOT NULL,
  sell_rate DECIMAL(10,2) NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, role_code)
);

-- ================================================
-- ESTIMATES (Supplier-Scoped)
-- ================================================
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,
  estimate_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'baselined', 'archived')),
  project_start_date DATE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, estimate_ref)
);

-- ================================================
-- ESTIMATE MILESTONES
-- ================================================
CREATE TABLE estimate_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE NOT NULL,
  milestone_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_mode TEXT DEFAULT 'relative' CHECK (start_mode IN ('fixed_date', 'relative')),
  start_date DATE,
  start_offset_days INTEGER DEFAULT 0,
  duration_days INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(estimate_id, milestone_ref)
);

-- ================================================
-- MILESTONE DEPENDENCIES
-- ================================================
CREATE TABLE estimate_milestone_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES estimate_milestones(id) ON DELETE CASCADE NOT NULL,
  depends_on_id UUID REFERENCES estimate_milestones(id) ON DELETE CASCADE NOT NULL,
  dependency_type TEXT DEFAULT 'finish_to_start' 
    CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag_days INTEGER DEFAULT 0,
  UNIQUE(milestone_id, depends_on_id)
);

-- ================================================
-- ESTIMATE DELIVERABLES
-- ================================================
CREATE TABLE estimate_deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES estimate_milestones(id) ON DELETE SET NULL,
  deliverable_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  due_offset_days INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(estimate_id, deliverable_ref)
);

-- ================================================
-- RESOURCE ALLOCATIONS
-- ================================================
CREATE TABLE estimate_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES estimate_milestones(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES estimate_deliverables(id) ON DELETE CASCADE,
  role_id UUID REFERENCES rate_card_roles(id) NOT NULL,
  effort_days DECIMAL(6,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (milestone_id IS NOT NULL OR deliverable_id IS NOT NULL)
);

-- ================================================
-- ESTIMATE BASELINES
-- ================================================
CREATE TABLE estimate_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID REFERENCES estimates(id) ON DELETE CASCADE NOT NULL,
  baseline_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  snapshot_data JSONB NOT NULL,
  total_cost DECIMAL(12,2),
  total_sell DECIMAL(12,2),
  total_effort_days DECIMAL(8,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(estimate_id, baseline_number)
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX idx_rate_card_supplier ON rate_card_roles(supplier_id);
CREATE INDEX idx_estimates_supplier ON estimates(supplier_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimate_milestones_estimate ON estimate_milestones(estimate_id);
CREATE INDEX idx_estimate_deliverables_estimate ON estimate_deliverables(estimate_id);
CREATE INDEX idx_estimate_allocations_estimate ON estimate_allocations(estimate_id);
```

### 3.2 RLS Policies

```sql
-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Get current user's supplier_id
CREATE OR REPLACE FUNCTION user_supplier_id()
RETURNS UUID AS $$
  SELECT supplier_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is system admin
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND global_role = 'system_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is supplier admin or PM
CREATE OR REPLACE FUNCTION is_supplier_pm_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND global_role IN ('supplier_admin', 'supplier_pm')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================
-- RATE CARD POLICIES
-- ================================================

ALTER TABLE rate_card_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_card_select" ON rate_card_roles
FOR SELECT USING (
  is_system_admin() OR supplier_id = user_supplier_id()
);

CREATE POLICY "rate_card_insert" ON rate_card_roles
FOR INSERT WITH CHECK (
  is_system_admin() OR (
    is_supplier_pm_or_admin() AND supplier_id = user_supplier_id()
  )
);

CREATE POLICY "rate_card_update" ON rate_card_roles
FOR UPDATE USING (
  is_system_admin() OR (
    is_supplier_pm_or_admin() AND supplier_id = user_supplier_id()
  )
);

CREATE POLICY "rate_card_delete" ON rate_card_roles
FOR DELETE USING (
  is_system_admin() OR (
    is_supplier_pm_or_admin() AND supplier_id = user_supplier_id()
  )
);

-- ================================================
-- ESTIMATES POLICIES
-- ================================================

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estimates_select" ON estimates
FOR SELECT USING (
  is_system_admin() OR supplier_id = user_supplier_id()
);

CREATE POLICY "estimates_insert" ON estimates
FOR INSERT WITH CHECK (
  is_supplier_pm_or_admin() AND supplier_id = user_supplier_id()
);

CREATE POLICY "estimates_update" ON estimates
FOR UPDATE USING (
  is_supplier_pm_or_admin() AND supplier_id = user_supplier_id()
);

CREATE POLICY "estimates_delete" ON estimates
FOR DELETE USING (
  is_supplier_pm_or_admin() AND supplier_id = user_supplier_id()
);

-- Child tables inherit access through estimate_id joins
-- (estimate_milestones, estimate_deliverables, estimate_allocations, estimate_baselines)
```

---

## Part 4: User Interface Requirements

### 4.1 Spreadsheet-like WBS Editor

Similar to Microsoft Project or Smartsheet:

```
| Ref    | Name                        | Duration | Start      | End        | Resources    | Cost      |
|--------|-----------------------------|---------:|------------|------------|--------------|----------:|
| M01    | Project Initiation          |    5 days| Week 1     | Week 1     |              |           |
|   D01  |   Project Charter           |    3 days|            |            | PM-L5 (3d)   | £3,277.50 |
|   D02  |   Stakeholder Register      |    2 days|            |            | PM-L5 (2d)   | £2,185.00 |
| M02    | Requirements Gathering      |   10 days| Week 2     | Week 3     |              |           |
|   D03  |   Requirements Document     |    8 days|            |            | BA-L4 (8d)   | £7,812.00 |
|   D04  |   Sign-off                  |    2 days|            |            | PM-L5 (1d)   | £1,092.50 |
| M03    | Design Phase                |   15 days| After M02  | +15 days   |              |           |
```

**Features:**
- Inline editing of all fields
- Drag to reorder rows
- Indent/outdent for hierarchy (deliverables under milestones)
- Add/remove rows via toolbar or keyboard
- Dependency linking via dropdown or drag
- Auto-calculation of dates based on dependencies
- Auto-calculation of costs based on allocations

### 4.2 Interactive Gantt Chart

- Visual timeline of milestones
- Drag bars to change dates/duration
- Dependency arrows (finish-to-start, etc.)
- Zoom in/out (day/week/month view)
- Critical path highlighting
- Today marker
- Baseline comparison overlay

### 4.3 Resource Allocation Panel

```
┌─────────────────────────────────────────────────────────────────────────┐
│ RATE CARD ROLES                    │ ALLOCATION DETAILS                 │
├────────────────────────────────────┼────────────────────────────────────┤
│ [Drag roles to milestones/deliv]   │ Selected: M01 - Project Initiation │
│                                    │                                    │
│ 📋 Management                      │ Current Allocations:               │
│   • PM-L5 (£1,092.50/day)         │ ┌──────────┬───────┬──────────┐   │
│   • PM-L4 (£976.50/day)           │ │ Role     │ Days  │ Cost     │   │
│                                    │ ├──────────┼───────┼──────────┤   │
│ 💻 Technical                       │ │ PM-L5    │ 5     │ £5,462   │   │
│   • DEV-L4 (£850.00/day)          │ │ BA-L4    │ 3     │ £2,929   │   │
│   • DEV-L3 (£750.00/day)          │ └──────────┴───────┴──────────┘   │
│                                    │                                    │
│ 📊 Analysis                        │ [+ Add Role] [Remove Selected]     │
│   • BA-L4 (£976.50/day)           │                                    │
│   • BA-L3 (£850.00/day)           │ Total: 8 days, £8,391.50           │
└────────────────────────────────────┴────────────────────────────────────┘
```

### 4.4 Cost Summary Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ESTIMATE: Network Modernization Programme                    [Baseline] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📅 Duration        💼 Effort          💰 Cost           💵 Sell        │
│  ─────────────     ───────────        ──────────       ──────────      │
│  12 weeks          145 days           £108,750         £158,712        │
│  (60 work days)                                                        │
│                                                                         │
│  📈 Gross Margin: £49,962 (31.5%)                                      │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ BY MILESTONE                          │ BY ROLE                         │
│ ───────────────────────────────────── │ ─────────────────────────────── │
│ M01 Project Initiation    £5,462.50   │ PM-L5    25d    £27,312.50     │
│ M02 Requirements          £8,904.50   │ BA-L4    40d    £39,060.00     │
│ M03 Design               £35,550.00   │ DEV-L3   60d    £71,100.00     │
│ M04 Development         £108,795.00   │ QA-L3    20d    £21,240.00     │
│ M05 Testing              £21,240.00   │                                 │
│                                        │                                 │
└────────────────────────────────────────┴─────────────────────────────────┘
```

---

## Part 5: Relationship to Existing System

### 5.1 Rate Card vs Resources

| Aspect | Rate Card (NEW) | Resources (EXISTING) |
|--------|-----------------|----------------------|
| **Purpose** | Role templates for estimating | Actual named people |
| **Scope** | Supplier-wide | Supplier-wide (updated) + Project assignment |
| **Identity** | Generic role (PM-L5) | Named individual (Glenn Nickols) |
| **Rates** | Standard rates | May have custom rates per person |
| **Used in** | Estimates | Projects (timesheets, expenses) |

**Workflow:**
1. Rate Card defines "PM-L5 costs £750/day, sells at £1092.50/day"
2. Estimate uses "PM-L5" for planning (generic)
3. When project created from estimate, PM chooses actual resource
4. "Glenn Nickols" assigned as PM-L5 with same or adjusted rates

### 5.2 Estimate → Project Import (via Project Wizard)

See [PROJECT-WIZARD-VALIDATED.md](./PROJECT-WIZARD-VALIDATED.md) for the full wizard flow.

When importing a baseline into a project:

| Estimate Entity | Maps To | Notes |
|-----------------|---------|-------|
| Estimate | Project | Basic info transferred |
| Estimate Milestone | Project Milestone | Dates calculated from actual start |
| Estimate Deliverable | Project Deliverable | Linked to milestone |
| Estimate Allocation | Resource assignment prompt | PM selects actual person |
| Baseline totals | Project budget | Reference values |

**Import Options:**
1. **Create New Project** — Full project with structure from estimate
2. **Add to Existing Project** — Append milestones/deliverables
3. **Replace Phase** — Replace specific milestones

---

## Part 6: Effort Estimation

### 6.1 Dependencies on Other Work

This feature **depends on**:
1. ✅ Supplier tenancy foundation (Phase 1 in MULTI-TENANCY-ROADMAP.md)
2. ✅ Resource pool refactoring (Phase 2 in MULTI-TENANCY-ROADMAP.md)

This feature **enables**:
1. Project Wizard "Import from estimate" (Phase 5 in MULTI-TENANCY-ROADMAP.md)

### 6.2 Phase Breakdown

| Phase | Tasks | Effort | Dependencies |
|-------|-------|--------|--------------|
| **1. Database** | Schema, migrations, RLS, seed data | 3-4 days | Supplier foundation |
| **2. Services** | CRUD services for all entities | 3-4 days | Database |
| **3. Rate Card UI** | Admin page for role management | 2-3 days | Services |
| **4. Estimates List** | List, filter, create, delete | 2-3 days | Services |
| **5. WBS Editor** | Spreadsheet-like editor (MVP) | 5-7 days | Services |
| **6. Resource Allocation** | Role assignment to milestones/deliverables | 3-4 days | Rate Card, WBS |
| **7. Gantt View** | Interactive timeline | 4-5 days | WBS |
| **8. Cost Summary** | Dashboard with breakdowns | 2-3 days | Allocations |
| **9. Baselines** | Create, view, compare | 3-4 days | All above |
| **10. Testing** | Unit, integration, E2E | 3-4 days | All above |

**Total: 6-8 weeks** (after supplier foundation complete)

### 6.3 MVP vs Full Feature

**MVP (4-5 weeks):**
- Rate card management
- Basic estimate CRUD
- Table-based WBS editor (not full spreadsheet)
- Resource allocation
- Cost summary
- Single baseline creation
- Basic Gantt (view only, no drag)

**Full Feature (+3-4 weeks):**
- Full spreadsheet-like WBS with keyboard navigation
- Interactive Gantt with drag-drop
- Multiple baselines with visual comparison
- Dependency management with lag times
- Scenario modeling (what-if analysis)
- Export to PDF/Excel

---

## Part 7: Technical Considerations

### 7.1 Libraries to Consider

| Library | Purpose | Notes |
|---------|---------|-------|
| `@tanstack/react-table` | WBS spreadsheet view | Flexible, performant |
| `ag-grid-react` | Alternative WBS | More features, larger bundle |
| `react-dnd` | Drag and drop | For resource allocation |
| `frappe-gantt` | Gantt chart | Lightweight, customizable |
| `zustand` | State management | For complex WBS state |

### 7.2 Auto-save Strategy

```javascript
// Debounced auto-save
const debouncedSave = useMemo(
  () => debounce((data) => saveEstimate(data), 2000),
  []
);

// Save indicator states
const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error'
```

### 7.3 Offline Considerations

If offline support is required (Q11):
- Use IndexedDB for local storage
- Implement sync queue for changes
- Conflict resolution strategy
- **Recommendation:** Defer to Phase 2, adds significant complexity

---

## Part 8: UI Component Architecture

### 8.1 New Pages

| Page | Route | Purpose |
|------|-------|---------|
| Rate Card Management | `/rate-card` | Manage supplier's role catalog |
| Estimates List | `/estimates` | List all supplier's estimates |
| Estimate Editor | `/estimates/:id` | Main estimation workspace |
| Estimate Baselines | `/estimates/:id/baselines` | Baseline management |

### 8.2 Component Hierarchy

```
/estimates
└── EstimatesList.jsx
    └── EstimateCard.jsx

/estimates/:id
└── EstimateEditor.jsx
    ├── EstimateHeader.jsx (name, status, actions)
    ├── EstimateTabs.jsx
    │   ├── Tab: WBS
    │   │   └── EstimateWBS.jsx
    │   │       ├── WBSToolbar.jsx
    │   │       └── WBSTable.jsx
    │   ├── Tab: Gantt
    │   │   └── EstimateGantt.jsx
    │   ├── Tab: Resources
    │   │   └── EstimateResources.jsx
    │   │       ├── RoleSelector.jsx
    │   │       └── AllocationTable.jsx
    │   ├── Tab: Costs
    │   │   └── EstimateCosts.jsx
    │   └── Tab: Baselines
    │       └── EstimateBaselines.jsx
    │           ├── BaselineList.jsx
    │           └── BaselineCompare.jsx
    └── EstimateSidebar.jsx (properties panel)

/rate-card
└── RateCardManager.jsx
    ├── RateCardTable.jsx
    └── RoleEditModal.jsx
```

---

## Part 9: Acceptance Criteria

### 9.1 Rate Card

- [ ] Supplier Admin/PM can create, edit, delete roles
- [ ] Roles have code, title, description, SFIA level, cost rate, sell rate
- [ ] Roles can be marked active/inactive
- [ ] Inactive roles hidden from new allocations but visible in existing estimates
- [ ] System Admin can view all suppliers' rate cards

### 9.2 Estimates

- [ ] Supplier PM can create new estimates
- [ ] Estimates auto-generate reference within supplier (EST-001, EST-002)
- [ ] Estimates have status workflow (Draft → In Review → Baselined → Archived)
- [ ] Estimates can be duplicated
- [ ] Estimates can be deleted (if Draft)

### 9.3 WBS Editor

- [ ] Can add/edit/delete milestones
- [ ] Can add/edit/delete deliverables under milestones
- [ ] Can set duration and start mode (fixed/relative)
- [ ] Can define dependencies between milestones
- [ ] Dates auto-calculate based on dependencies
- [ ] Can reorder items via drag or buttons

### 9.4 Resource Allocation

- [ ] Can allocate rate card roles to milestones or deliverables
- [ ] Can specify effort in days
- [ ] Costs calculate automatically (effort × rate)
- [ ] Can see total cost/effort per milestone

### 9.5 Cost Summary

- [ ] Shows total duration, effort, cost, sell, margin
- [ ] Shows breakdown by milestone
- [ ] Shows breakdown by role
- [ ] Updates in real-time as allocations change

### 9.6 Baselines

- [ ] Can create baseline snapshot of current state
- [ ] Baselines are immutable after creation
- [ ] Can view historical baselines
- [ ] Can compare two baselines side-by-side
- [ ] Baseline can be selected for project import

---

## Appendix: Existing Related Code

### Current SFIA Levels (from constants.js)
```javascript
export const SFIA_LEVELS = [
  { value: '1', label: 'Level 1 - Follow' },
  { value: '2', label: 'Level 2 - Assist' },
  { value: '3', label: 'Level 3 - Apply' },
  { value: '4', label: 'Level 4 - Enable' },
  { value: '5', label: 'Level 5 - Ensure/Advise' },
  { value: '6', label: 'Level 6 - Initiate/Influence' },
  { value: '7', label: 'Level 7 - Set Strategy' }
];
```

### Current Resources Table Fields
```
id, project_id, partner_id, user_id
name, email, phone
role, sfia_level
cost_price, sell_price
start_date, end_date, allocation_percentage
is_active
```

### Current Gantt Implementation
- Located in `src/pages/Gantt.jsx`
- Shows milestones with baseline/actual/forecast bars
- Has drag-to-edit capability
- Uses custom canvas rendering
- **Could be adapted** for estimate Gantt with modifications

---

*This document should be updated once the open questions are answered.*
