# Multi-Tenancy Architecture & Feature Roadmap

**Created:** 2025-12-15  
**Status:** Architecture Planning  
**Scope:** Supplier Tenancy, Cost Estimation Tool, Project Wizard  

---

## Executive Summary

This document outlines a comprehensive architectural change to introduce **Supplier-level multi-tenancy** to the AMSF001 Project Tracker, along with two new major features:

1. **Cost Estimation Tool** — Pre-project planning and costing
2. **Project Setup Wizard** — Configurable project creation

The current system is project-centric. The proposed architecture adds a **Supplier** entity as the top-level tenant, enabling:

- Multiple suppliers on the same platform (e.g., Jersey Telecom, Vodafone)
- Each supplier has their own projects, resources, partners, rate cards, and estimates
- A **System Administrator** role that operates above all suppliers
- Data isolation between suppliers while allowing flexibility within a supplier's scope

---

## Part 1: Current vs Proposed Architecture

### 1.1 Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PLATFORM                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Project A  │  │  Project B  │  │  Project C  │         │
│  │  (AMSF001)  │  │  (Future)   │  │  (Future)   │         │
│  │             │  │             │  │             │         │
│  │ - Resources │  │ - Resources │  │ - Resources │         │
│  │ - Partners  │  │ - Partners  │  │ - Partners  │         │
│  │ - Users     │  │ - Users     │  │ - Users     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  Users assigned to projects via user_projects               │
│  All data is project-scoped                                 │
│  No isolation between projects                              │
└─────────────────────────────────────────────────────────────┘
```

**Problems with current architecture:**
- No supplier-level isolation
- Resources/Partners duplicated per project
- Rate cards would need to be system-wide (no supplier ownership)
- Any admin can see all projects

### 1.2 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              PLATFORM                                    │
│                     System Administrator (super-admin)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐    │
│  │     SUPPLIER: JT Group      │    │   SUPPLIER: Vodafone        │    │
│  │                             │    │                             │    │
│  │  Supplier Admin             │    │  Supplier Admin             │    │
│  │  Supplier PMs               │    │  Supplier PMs               │    │
│  │                             │    │                             │    │
│  │  ┌─────────┐ ┌─────────┐   │    │  ┌─────────┐ ┌─────────┐   │    │
│  │  │Project A│ │Project B│   │    │  │Project X│ │Project Y│   │    │
│  │  │(AMSF001)│ │(Future) │   │    │  │         │ │         │   │    │
│  │  └─────────┘ └─────────┘   │    │  └─────────┘ └─────────┘   │    │
│  │                             │    │                             │    │
│  │  Shared within supplier:    │    │  Shared within supplier:    │    │
│  │  • Rate Card                │    │  • Rate Card                │    │
│  │  • Resource Pool            │    │  • Resource Pool            │    │
│  │  • Partners                 │    │  • Partners                 │    │
│  │  • Estimates                │    │  • Estimates                │    │
│  │                             │    │                             │    │
│  │  Partners:                  │    │  Partners:                  │    │
│  │  • Progressive              │    │  • Resolution IT            │    │
│  │  • 2D Cynics               │    │  • C5 Alliance              │    │
│  └─────────────────────────────┘    └─────────────────────────────┘    │
│                                                                         │
│  ISOLATION: Suppliers cannot see each other's data                      │
│  SHARING: Resources/Partners shared across projects within supplier     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: New Entity Model

### 2.1 Suppliers Table (NEW)

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- "JT Group", "Vodafone"
  code TEXT UNIQUE NOT NULL,             -- "JT", "VOD" (short code)
  description TEXT,
  logo_url TEXT,
  primary_contact_email TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',           -- Supplier-level settings
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Updated User Role Hierarchy

| Role | Scope | Description |
|------|-------|-------------|
| `system_admin` | Platform | Can manage all suppliers, platform settings |
| `supplier_admin` | Supplier | Full access within their supplier |
| `supplier_pm` | Supplier | PM access within their supplier |
| `supplier_finance` | Supplier | Finance access within their supplier |
| `project_admin` | Project | Admin for specific project only |
| `customer_pm` | Project | Customer PM for specific project |
| `customer_finance` | Project | Customer finance for specific project |
| `contributor` | Project | Contributor for specific project |
| `viewer` | Project | Read-only for specific project |

### 2.3 Updated Profiles Table

```sql
ALTER TABLE profiles ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE profiles ADD COLUMN global_role TEXT; -- system_admin, supplier_admin, supplier_pm, etc.

-- global_role determines supplier-level access
-- user_projects.role determines project-level access (when different)
```

### 2.4 Updated Projects Table

```sql
ALTER TABLE projects ADD COLUMN supplier_id UUID REFERENCES suppliers(id) NOT NULL;

-- Projects now belong to a supplier
-- All project data inherits supplier_id for RLS
```

### 2.5 Updated Partners Table

```sql
-- Partners become supplier-scoped, not project-scoped
ALTER TABLE partners ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE partners ALTER COLUMN project_id DROP NOT NULL;

-- Partners can be:
-- 1. Supplier-wide (supplier_id set, project_id null) - available to all projects
-- 2. Project-specific (supplier_id set, project_id set) - only for that project
```

### 2.6 Updated Resources Table

```sql
-- Resources become supplier-scoped with optional project assignment
ALTER TABLE resources ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE resources ALTER COLUMN project_id DROP NOT NULL;

-- Resources can be:
-- 1. In the supplier pool (supplier_id set, project_id null) - available for assignment
-- 2. Assigned to project (supplier_id set, project_id set) - working on specific project

-- Resource types:
-- 1. Internal (resource_type = 'internal') - linked to user_id, no partner required
-- 2. Third-party (resource_type = 'third_party') - MUST have partner_id set
```

### 2.6.1 Third-Party Resource Rules

**Business Rule:** Third-party resources MUST be associated with a Partner.

```sql
-- Constraint to enforce partner requirement for third-party resources
ALTER TABLE resources ADD CONSTRAINT third_party_requires_partner
  CHECK (
    resource_type != 'third_party' 
    OR partner_id IS NOT NULL
  );
```

**UI Behavior:**
- When `resource_type = 'third_party'` is selected, show Partner dropdown
- If no Partners exist for the supplier, show message: "No partners found. Please create a partner first."
- Partner selection is required before saving third-party resource

### 2.7 Rate Card (NEW - Supplier-Scoped)

```sql
CREATE TABLE rate_card_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,  -- SUPPLIER-SCOPED
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
```

### 2.8 Estimates (NEW - Supplier-Scoped)

```sql
CREATE TABLE estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) NOT NULL,  -- SUPPLIER-SCOPED
  estimate_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  status TEXT DEFAULT 'draft',
  project_start_date DATE,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supplier_id, estimate_ref)
);
```

---

## Part 2B: User + Resource Merge Consideration (Future)

### Current Separation Problem

Currently, internal team members require TWO records:
1. **User** (`profiles` + `user_projects`) = Login account + app permissions
2. **Resource** (`resources`) = Billable entity with rates

This creates friction: "Did I create the user AND the resource? Are they linked?"

### Proposed "Team Member" Concept

Merge internal users and resources into a unified model:

```
Team Member (for internal staff)
├── Identity: name, email, login credentials
├── Access: role permissions per project (via assignments)
├── Billing: sell_price, cost_price, SFIA level (if billable)
├── Type: internal (employee)
└── Assignments: which projects they work on + project-specific rates
```

**Third-party resources remain separate:**
- They don't log in to the system
- Linked to a Partner record
- Just billable entries for tracking costs

### Benefits of Merge
- Single place to manage people
- Cleaner onboarding: add person once, assign to projects, set rates
- No confusion about user/resource linking

### Implementation Notes
- This is a **Phase 2+** consideration
- Requires thorough testing of current system first
- May be implemented as:
  - Option A: Merge tables (breaking change, requires migration)
  - Option B: Unified UI that manages both tables behind the scenes
  - Option C: New "team_members" table that supersedes both

### Decision Status
- **Deferred** - Complete current E2E testing first
- Will revisit after multi-tenancy foundation is stable

---

## Part 2C: Entity Permission Hook Pattern (Future Refactoring)

### Current Inconsistency Problem

**Added:** 2025-12-16  
**Related Issues:** Test Session Issues #5, #6 (Customer PM deliverable permissions)

The codebase has inconsistent patterns for how entity modals receive and check permissions:

| Modal | Permission Source | Pattern |
|-------|------------------|--------|
| TimesheetDetailModal | Props from parent | Functions passed as props (e.g., `canSubmitTimesheet={canSubmitTimesheet}`) |
| ExpenseDetailModal | Props from parent | Functions passed as props |
| RaidDetailModal | Props from parent | Simple booleans |
| DeliverableDetailModal | **Hybrid** | Booleans as props + `useDeliverablePermissions` hook internally |

The deliverable modal has a dedicated `useDeliverablePermissions` hook that correctly combines role-based and status-based checks, but the modal doesn't fully use it. Instead, it mixes prop-based permissions with internal hook usage.

### Proposed Strategic Pattern

Create entity-specific permission hooks for each major entity that encapsulate:
1. **Role-based permissions** (from permission matrix)
2. **Status-based workflow checks** (from calculation functions)
3. **Object-level checks** (ownership, assignment)

Example structure:
```javascript
function useDeliverablePermissions(deliverable) {
  return {
    canView: true,
    canCreate: /* role check */,
    canEdit: /* role check + status check */,
    canDelete: /* role check + status check */,
    canSubmit: /* role check + status check */,
    canReview: /* role check + status check */,
    canSign: /* role check + signature state */,
    // ... etc
  };
}
```

### Benefits
- **Self-contained components** - modals don't need permission props
- **Single source of truth** - one hook per entity for all permission logic
- **Easier testing** - hook can be unit tested independently
- **Consistent pattern** - same approach for all entity modals

### Implementation Approach
1. Fix/complete `useDeliverablePermissions` hook as the template
2. Refactor `DeliverableDetailModal` to use hook exclusively
3. Create similar hooks for timesheets, expenses, RAID
4. Refactor other modals to use their respective hooks
5. Remove permission props from modals (or make optional overrides)

### Decision Status
- **Tactical fix applied** (2025-12-16): Added `canSubmit` prop to align with existing pattern
- **Strategic refactoring deferred** - Lower priority than multi-tenancy work
- **Effort estimate:** 2-3 days for full implementation across all entities

---

## Part 3: RLS Policy Overhaul

### 3.1 Current RLS Pattern

```sql
-- Current: Project-scoped
CREATE POLICY "users can view project data" ON some_table
FOR SELECT USING (
  project_id IN (
    SELECT project_id FROM user_projects WHERE user_id = auth.uid()
  )
);
```

### 3.2 New RLS Patterns

```sql
-- Pattern 1: System Admin (sees everything)
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND global_role = 'system_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Pattern 2: Supplier-scoped (rate cards, estimates, resource pool)
CREATE OR REPLACE FUNCTION user_supplier_id()
RETURNS UUID AS $$
  SELECT supplier_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "supplier_scoped_access" ON rate_card_roles
FOR ALL USING (
  is_system_admin()
  OR supplier_id = user_supplier_id()
);

-- Pattern 3: Project-scoped (inherits supplier check)
CREATE POLICY "project_scoped_access" ON milestones
FOR ALL USING (
  is_system_admin()
  OR project_id IN (
    SELECT p.id FROM projects p
    JOIN user_projects up ON up.project_id = p.id
    WHERE up.user_id = auth.uid()
    AND p.supplier_id = user_supplier_id()
  )
);
```

---

## Part 4: Impact on Existing Features

### 4.1 Tables Requiring Migration

| Table | Change | Impact |
|-------|--------|--------|
| `profiles` | Add `supplier_id`, `global_role` | User assignment to supplier |
| `projects` | Add `supplier_id` | Project ownership |
| `partners` | Add `supplier_id`, make `project_id` nullable | Supplier-wide partners |
| `resources` | Add `supplier_id`, make `project_id` nullable | Resource pool |
| `user_projects` | No change | Still handles project-level roles |
| `milestones` | No change | Inherits via project |
| `deliverables` | No change | Inherits via project |
| `timesheets` | No change | Inherits via project |
| `expenses` | No change | Inherits via project |

### 4.2 Services Requiring Updates

| Service | Changes Needed |
|---------|----------------|
| `AuthContext.jsx` | Add supplier_id to user context |
| `ProjectContext.jsx` | Filter projects by supplier |
| All services | Update queries to respect supplier scope |
| `resources.service.js` | Support supplier pool + project assignment |
| `partners.service.js` | Support supplier-wide + project-specific |

### 4.3 UI Changes

| Component | Changes Needed |
|-----------|----------------|
| `Layout.jsx` | Show supplier name/context |
| `SystemUsers.jsx` | Rename to supplier user management |
| New: `SupplierSwitcher` | For system admins to switch supplier context |
| New: `SupplierSettings` | Supplier configuration page |
| `Resources.jsx` | Show pool vs assigned resources |
| `Partners.jsx` | Show supplier-wide vs project partners |

---

## Part 5: Cross-Reference: Project Wizard

### 5.1 How Project Wizard Interacts with New Architecture

The Project Wizard (see `PROJECT-WIZARD-VALIDATED.md`) creates new projects. With supplier tenancy:

1. **Wizard runs within supplier context** — new projects inherit `supplier_id`
2. **Resource selection from supplier pool** — not duplicating resources
3. **Partner selection from supplier's partners** — not duplicating partners
4. **Rate card from supplier** — for budget estimation
5. **Import from estimate baseline** — estimates are supplier-scoped

### 5.2 Updated Wizard Flow

```
Step 1: Project Basics
  - Name, reference, dates, budget
  - Supplier auto-set from user's context

Step 2: Feature Selection  
  - Enable/disable KPIs, QS, RAID, Variations
  - (As per PROJECT-WIZARD-VALIDATED.md)

Step 3: Source Selection (NEW)
  - "Start from scratch" OR
  - "Import from estimate baseline"
    → Select estimate from supplier's estimates
    → Select baseline version
    → Preview what will be imported

Step 4: Team Setup
  - Select resources from supplier's resource pool
  - Assign project roles
  - Optionally add new resources to pool

Step 5: Review & Create
  - Summary of configuration
  - Create project
```

### 5.3 Project Configuration Storage

Using the existing `projects.settings` JSONB column:

```json
{
  "features": {
    "kpis": true,
    "qualityStandards": true,
    "raid": true,
    "variations": false
  },
  "billing": {
    "model": "milestone_based",
    "requireCertificates": true
  },
  "source": {
    "type": "estimate_import",
    "estimateId": "uuid",
    "baselineId": "uuid",
    "importedAt": "2025-12-15T10:00:00Z"
  }
}
```

---

## Part 6: Cross-Reference: Cost Estimation Tool

### 6.1 How Estimator Interacts with New Architecture

The Cost Estimation Tool (see `COST-ESTIMATION-TOOL-ANALYSIS.md`) is supplier-scoped:

1. **Estimates belong to a supplier** — isolated from other suppliers
2. **Uses supplier's rate card** — not a global rate card
3. **Can be shared within supplier** — all supplier PMs can view
4. **Baselines can be imported into supplier's projects**

### 6.2 Updated Estimator Flow

```
1. Supplier PM accesses Estimates (supplier-scoped list)
2. Creates/edits estimate using supplier's rate card
3. Builds WBS with milestones, deliverables, allocations
4. Creates baseline when satisfied
5. Later: Project Wizard can import this baseline
```

### 6.3 Rate Card Ownership

- Each supplier has their own rate card
- Rate cards are NOT shared across suppliers
- Suppliers can have different roles with different rates
- System admin can view all rate cards (for auditing)

---

## Part 7: Open Questions (Consolidated)

### Answered Questions (2025-12-15)

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| Q12 | Can a user belong to multiple suppliers? | **No** - separate accounts with different email addresses | Keeps model simple; contractors working for multiple suppliers use different logins |
| Q13 | Can a project have multiple suppliers (joint venture)? | **No** - projects belong to one supplier | Avoids major complexity; joint ventures handled outside system |
| Q15 | Do customers (Customer PM, Customer Finance) belong to a supplier? | **No** - customers see their specific projects only, not a tenant view | Customers don't need cross-project visibility |
| Q17 | Do resource rates vary per project? | **Yes** - but supplier has a default rate card by resource type | Flexibility for project-specific negotiations while maintaining defaults |

### Cost Estimation Tool Questions (Still Open)

| # | Question | Impact |
|---|----------|--------|
| Q1 | Can Supplier PMs see each other's estimates within the same supplier? | RLS policy design |
| Q2 | Does creating a baseline require approval/sign-off? | Workflow complexity |
| Q3 | If rate card rates change, what happens to existing estimates? | Lock historical rates or update? |
| Q4 | Is GBP the only currency, or multi-currency needed? | Schema design |
| Q5 | Should there be pre-built estimate templates? | Additional feature scope |
| Q6 | Reuse existing Gantt component or build new for estimates? | Development effort |
| Q7 | Is offline support needed for estimates? | Architecture complexity |
| Q8 | PDF/Excel export of estimates required? | Additional feature scope |

### Project Wizard Questions

| # | Question | Impact |
|---|----------|--------|
| Q9 | Can project configuration be changed after creation? | UI for editing config |
| Q10 | Should disabled features hide data or just UI? | Data model implications |
| Q11 | Template projects (pre-configured setups)? | Additional feature scope |

### Supplier Tenancy Questions

| # | Question | Impact |
|---|----------|--------|
| Q12 | Can a user belong to multiple suppliers? | Profile model complexity |
| Q13 | Can a project have multiple suppliers (joint venture)? | Major complexity |
| Q14 | Is there a "default" supplier for existing data migration? | Migration strategy |
| Q15 | Do customers (Customer PM, Customer Finance) belong to a supplier? | Role model design |
| Q16 | Can system admin create users in any supplier? | Admin workflows |

---

## Part 8: Implementation Roadmap

### Phase 0: Planning & Design (1 week)
- [ ] Answer open questions (above)
- [ ] Finalize entity relationships
- [ ] Design RLS policy strategy
- [ ] Create detailed migration plan for existing data
- [ ] UI/UX wireframes for new features

### Phase 1: Supplier Foundation (2-3 weeks)

**Database:**
- [ ] Create `suppliers` table
- [ ] Add `supplier_id` to `profiles`
- [ ] Add `global_role` to `profiles`
- [ ] Add `supplier_id` to `projects`
- [ ] Create migration for existing data (assign to default supplier)
- [ ] Update all RLS policies

**Application:**
- [ ] Create `SupplierContext.jsx`
- [ ] Update `AuthContext.jsx` with supplier info
- [ ] Update `ProjectContext.jsx` to filter by supplier
- [ ] Add supplier to user session
- [ ] System admin supplier switching UI

**Testing:**
- [ ] RLS policy tests
- [ ] Multi-supplier isolation tests

### Phase 2: Resource & Partner Refactoring (1-2 weeks)

**Database:**
- [ ] Add `supplier_id` to `partners`, make `project_id` nullable
- [ ] Add `supplier_id` to `resources`, make `project_id` nullable
- [ ] Migrate existing data
- [ ] Update RLS policies

**Application:**
- [ ] Update `resources.service.js` for pool model
- [ ] Update `partners.service.js` for supplier scope
- [ ] Update Resources UI for pool vs assigned
- [ ] Update Partners UI for supplier vs project

### Phase 3: Rate Card (1-2 weeks)

**Database:**
- [ ] Create `rate_card_roles` table (supplier-scoped)
- [ ] RLS policies
- [ ] Seed initial data

**Application:**
- [ ] `rateCard.service.js`
- [ ] Rate Card management UI (`/admin/rate-card`)
- [ ] Integration with existing SFIA levels

### Phase 4: Cost Estimation Tool MVP (3-4 weeks)

**Database:**
- [ ] Create `estimates` table (supplier-scoped)
- [ ] Create `estimate_milestones` table
- [ ] Create `estimate_deliverables` table
- [ ] Create `estimate_allocations` table
- [ ] Create `estimate_baselines` table
- [ ] RLS policies

**Application:**
- [ ] `estimates.service.js`
- [ ] Estimates list page (`/estimates`)
- [ ] Estimate editor shell (`/estimates/:id`)
- [ ] WBS editor (table-based MVP)
- [ ] Resource allocation UI
- [ ] Cost summary view
- [ ] Baseline creation

### Phase 5: Project Wizard MVP (2-3 weeks)

**Application:**
- [ ] `ProjectConfigContext.jsx`
- [ ] Feature toggle infrastructure
- [ ] Navigation filtering by config
- [ ] Dashboard widget filtering
- [ ] Project wizard UI
- [ ] Import from estimate baseline

### Phase 6: Integration & Polish (2 weeks)

- [ ] Estimate → Project import flow
- [ ] End-to-end testing
- [ ] Documentation updates
- [ ] Performance optimization
- [ ] Edge case handling

### Phase 7: Enhanced Features (Ongoing)

- [ ] Interactive Gantt for estimates
- [ ] Dependency management with lag
- [ ] Multiple baselines with comparison
- [ ] Advanced project configuration
- [ ] Dual-approval workflow options
- [ ] Export/reporting features

---

## Part 9: Effort Summary

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 0: Planning | 1 week | None |
| Phase 1: Supplier Foundation | 2-3 weeks | Phase 0 |
| Phase 2: Resource/Partner Refactor | 1-2 weeks | Phase 1 |
| Phase 3: Rate Card | 1-2 weeks | Phase 1 |
| Phase 4: Estimation Tool MVP | 3-4 weeks | Phase 3 |
| Phase 5: Project Wizard MVP | 2-3 weeks | Phase 1 |
| Phase 6: Integration | 2 weeks | Phase 4, 5 |
| Phase 7: Enhanced Features | Ongoing | Phase 6 |

**Total MVP: 12-17 weeks (3-4 months)**

---

## Part 10: Migration Strategy for Existing Data

### 10.1 Default Supplier

Create a default supplier for existing data:

```sql
-- Create default supplier
INSERT INTO suppliers (id, name, code, description)
VALUES (
  'default-supplier-uuid',
  'JT Group',  -- Or whatever the current supplier is
  'JT',
  'Default supplier for migrated data'
);

-- Assign all existing users to default supplier
UPDATE profiles SET supplier_id = 'default-supplier-uuid';

-- Assign all existing projects to default supplier
UPDATE projects SET supplier_id = 'default-supplier-uuid';

-- Assign all existing partners to default supplier
UPDATE partners SET supplier_id = 'default-supplier-uuid';

-- Assign all existing resources to default supplier
UPDATE resources SET supplier_id = 'default-supplier-uuid';
```

### 10.2 Global Role Assignment

```sql
-- Existing admins become supplier_admin
UPDATE profiles SET global_role = 'supplier_admin' WHERE role = 'admin';

-- Existing supplier_pm stays supplier_pm
UPDATE profiles SET global_role = 'supplier_pm' WHERE role = 'supplier_pm';

-- Others get global_role = null (project-only roles)
UPDATE profiles SET global_role = NULL 
WHERE role NOT IN ('admin', 'supplier_pm', 'supplier_finance');
```

### 10.3 Backwards Compatibility

During transition:
- Existing project-scoped queries continue to work
- New supplier-scoped queries added alongside
- Feature flags to enable new behavior
- Gradual migration of UI components

---

## Part 11: Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS policy complexity | High | Thorough testing, staged rollout |
| Breaking existing functionality | High | Feature flags, comprehensive E2E tests |
| Performance degradation | Medium | Query optimization, indexing |
| Migration data corruption | High | Backup, dry-run migrations, rollback plan |
| User confusion (new model) | Medium | Documentation, training, gradual UX changes |
| Scope creep | Medium | Strict MVP definition, phase gates |

---

## Part 12: Success Criteria

### Phase 1 Complete When:
- [ ] Multiple suppliers can exist in the system
- [ ] Users are assigned to suppliers
- [ ] Projects belong to suppliers
- [ ] Data is isolated between suppliers
- [ ] System admin can switch between suppliers
- [ ] All existing functionality works for current supplier

### Phase 4 Complete When:
- [ ] Rate card can be managed per supplier
- [ ] Estimates can be created with WBS
- [ ] Resources can be allocated from rate card
- [ ] Costs are calculated correctly
- [ ] Baselines can be created and viewed

### Phase 5 Complete When:
- [ ] Projects can be created via wizard
- [ ] Features can be toggled per project
- [ ] Estimate baselines can be imported
- [ ] Navigation respects project config

---

## Appendix: File References

| Document | Location |
|----------|----------|
| Project Wizard Analysis | `/docs/PROJECT-WIZARD-VALIDATED.md` |
| Cost Estimation Analysis | `/docs/COST-ESTIMATION-TOOL-ANALYSIS.md` |
| This Roadmap | `/docs/MULTI-TENANCY-ROADMAP.md` |
| Current Project Context | `/docs/AI-PROMPT-Project-Context-v2.md` |
| Current Assessment | `/docs/PROJECT-STATE-ASSESSMENT.md` |

---

*This document should be reviewed and refined based on answers to the open questions before implementation begins.*
