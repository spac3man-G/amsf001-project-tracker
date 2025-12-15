# Project Setup Wizard - Investigation & Analysis

**Created:** 2025-12-15  
**Purpose:** Understand multi-tenancy options and refactoring effort for project-specific configurations

---

## Executive Summary

The AMSF001 Project Tracker currently supports **basic multi-tenancy** (multiple projects, project-scoped roles) but has **no project-specific configuration** — all projects work identically. Adding a project setup wizard with configurable workflows would require significant but well-structured refactoring.

**Estimated Effort:** Medium-High (4-8 weeks depending on scope)

---

## Part 1: Current Application Features & Workflows

### 1.1 Core Features Inventory

| Feature | Description | Currently Configurable? |
|---------|-------------|------------------------|
| **Milestones** | Project phases with dates, budgets, billable amounts | No |
| **Deliverables** | Work outputs linked to milestones, with KPI/QS assessments | No |
| **Timesheets** | Time tracking linked to milestones (not deliverables) | No |
| **Expenses** | Cost tracking by category (Travel, Accommodation, Sustenance) | No |
| **KPIs** | Key Performance Indicators with RAG status | No |
| **Quality Standards** | Quality metrics linked to deliverables | No |
| **RAID Log** | Risks, Assumptions, Issues, Dependencies | No |
| **Variations** | Change requests with dual-signature approval | No |
| **Billing** | Milestone-based billing with certificates | No |
| **Partners** | External supplier/partner management | No |
| **Resources** | Team member management with rates | No |

### 1.2 Current Workflows

#### Timesheet Workflow
```
Draft → Submitted → Approved/Rejected
         ↓
   (If rejected, back to Draft)
```
- Timesheets are linked to **milestones only** (not deliverables)
- All timesheets follow the same approval workflow

#### Deliverable Workflow
```
Draft → In Progress → Submitted → Under Review → Delivered
                                      ↓
                              (Dual signature: Supplier PM + Customer PM)
```
- Deliverables can be linked to KPIs and Quality Standards
- Delivered status triggers KPI/QS assessments

#### Milestone Certificate Workflow
```
Draft → Pending Supplier Signature → Pending Customer Signature → Signed
                                    (or vice versa)
```
- Only billable milestones require certificates
- Certificates unlock billing

#### Variation (Change Request) Workflow
```
Draft → Submitted → Awaiting Supplier/Customer → Approved → Applied
                            ↓
                        (Rejected)
```
- Can affect multiple milestones
- Captures cost and time impact

### 1.3 Current Data Model (Key Tables)

| Table | Key Fields | Project-Scoped? |
|-------|------------|-----------------|
| `projects` | name, reference, total_budget, pmo_threshold | Root entity |
| `milestones` | milestone_ref, billable, baseline dates, signatures | Yes |
| `deliverables` | milestone_id, kpi links, qs links, signatures | Yes |
| `timesheets` | resource_id, milestone_id, hours, status | Yes |
| `expenses` | resource_id, category, amount, status | Yes |
| `kpis` | kpi_ref, target, current_value, trend | Yes |
| `quality_standards` | qs_ref, criteria, target | Yes |
| `variations` | variation_ref, type, status, impact | Yes |
| `user_projects` | user_id, project_id, role | Junction |

### 1.4 What's Currently Hardcoded

1. **Feature Availability** — All features are always enabled
2. **Workflow Steps** — Fixed workflows for all entity types
3. **Timesheet Granularity** — Always linked to milestones, never deliverables
4. **Billing Model** — Always milestone-based
5. **KPI/QS Requirement** — Optional but always available
6. **Role Permissions** — Fixed per-role capabilities
7. **Navigation** — Same for all projects of same role
8. **Expense Categories** — Fixed (Travel, Accommodation, Sustenance)

---

## Part 2: Proposed Wizard Options

### 2.1 Wizard Step 1: Project Basics

| Field | Type | Purpose |
|-------|------|---------|
| Project Name | Text | Display name |
| Project Reference | Text (auto-generated) | Unique identifier |
| Description | Text | Project overview |
| Start Date | Date | Project timeline |
| End Date | Date | Project timeline |
| Total Budget | Currency | Financial tracking |

### 2.2 Wizard Step 2: Feature Selection

**"Which features does this project need?"**

| Feature | Toggle | Default | Impact if Disabled |
|---------|--------|---------|-------------------|
| **Milestones** | Required | ✅ On | Core feature - cannot disable |
| **Deliverables** | Optional | ✅ On | Hide Deliverables page, disable linking |
| **KPIs** | Optional | ❌ Off | Hide KPIs page, remove from dashboard |
| **Quality Standards** | Optional | ❌ Off | Hide QS page, remove from dashboard |
| **RAID Log** | Optional | ✅ On | Hide RAID page |
| **Variations** | Optional | ❌ Off | Hide Variations page, disable change control |
| **Calendar** | Optional | ✅ On | Hide Calendar page |
| **Gantt Chart** | Optional | ✅ On | Hide Gantt page |

### 2.3 Wizard Step 3: Financial Model

**"How is this project billed?"**

| Option | Description |
|--------|-------------|
| **Milestone-Based** (default) | Bill when milestones complete with certificates |
| **Time & Materials** | Bill based on approved timesheets |
| **Fixed Price** | Single project fee, track progress only |
| **Not Billable** | Internal project, no billing features |

**Milestone Configuration:**

| Field | Condition | Description |
|-------|-----------|-------------|
| Are milestones billable? | All models except "Not Billable" | Show billable amount field |
| Require milestone certificates? | Milestone-Based only | Enable certificate workflow |
| PMO Threshold % | All models | Separate PMO costs from delivery |

### 2.4 Wizard Step 4: Timesheet Model

**"How should time be tracked?"**

| Option | Description | Current State |
|--------|-------------|---------------|
| **Against Milestones** | Time allocated to project phases | ✅ Currently implemented |
| **Against Deliverables** | Time allocated to specific outputs | 🔨 Requires refactoring |
| **Against Both** | Choose per entry | 🔨 Requires refactoring |
| **No Timesheets** | Disable time tracking entirely | Simple flag |

### 2.5 Wizard Step 5: Approval Workflows

**"What approval workflows are needed?"**

| Workflow | Options | Impact |
|----------|---------|--------|
| **Timesheet Approval** | Single (PM only) / Dual (PM + Customer PM) | Changes approval UI |
| **Expense Approval** | Single / Dual / Finance Only | Changes approval UI |
| **Deliverable Sign-off** | Single / Dual | Already supports dual |
| **Milestone Certificates** | Single / Dual / Not Required | Already supports dual |
| **Variation Approval** | Single / Dual | Already supports dual |

### 2.6 Wizard Step 6: Team Setup (Optional)

| Field | Purpose |
|-------|---------|
| Import from existing project? | Copy team structure |
| Add initial team members | Assign users with roles |
| Partner organisations | Add supplier partners |

---

## Part 3: Proposed Project Configuration Schema

### 3.1 New `project_config` Table

```sql
CREATE TABLE project_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Feature toggles
  feature_deliverables BOOLEAN DEFAULT true,
  feature_kpis BOOLEAN DEFAULT false,
  feature_quality_standards BOOLEAN DEFAULT false,
  feature_raid BOOLEAN DEFAULT true,
  feature_variations BOOLEAN DEFAULT false,
  feature_calendar BOOLEAN DEFAULT true,
  feature_gantt BOOLEAN DEFAULT true,
  feature_expenses BOOLEAN DEFAULT true,
  feature_timesheets BOOLEAN DEFAULT true,
  feature_billing BOOLEAN DEFAULT true,
  
  -- Financial model
  billing_model TEXT DEFAULT 'milestone_based', -- milestone_based, time_materials, fixed_price, not_billable
  milestones_are_billable BOOLEAN DEFAULT true,
  require_milestone_certificates BOOLEAN DEFAULT true,
  
  -- Timesheet model
  timesheet_allocation TEXT DEFAULT 'milestone', -- milestone, deliverable, both, none
  
  -- Approval workflows
  timesheet_approval TEXT DEFAULT 'single', -- single, dual
  expense_approval TEXT DEFAULT 'single', -- single, dual, finance_only
  deliverable_signoff TEXT DEFAULT 'dual', -- single, dual
  certificate_signoff TEXT DEFAULT 'dual', -- single, dual, not_required
  variation_approval TEXT DEFAULT 'dual', -- single, dual
  
  -- Expense categories (JSON array - extendable per project)
  expense_categories JSONB DEFAULT '["Travel", "Accommodation", "Sustenance"]',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(project_id)
);
```

### 3.2 Updated Application Components

Components that need to read project configuration:

| Component | Changes Needed |
|-----------|----------------|
| **Layout.jsx** | Filter navigation based on features |
| **Dashboard.jsx** | Show/hide widgets based on features |
| **Timesheets.jsx** | Support deliverable allocation |
| **TimesheetDetailModal** | Show deliverable selector when enabled |
| **Deliverables.jsx** | Conditionally show KPI/QS links |
| **Billing.jsx** | Adapt to billing model |
| **Milestones.jsx** | Conditionally show billable fields |
| **All approval components** | Adapt to single/dual workflow |

---

## Part 4: Refactoring Effort Analysis

### 4.1 Low Effort (1-2 days each)

| Task | Description |
|------|-------------|
| Create `project_config` table | New migration + RLS policies |
| Create Project Config context | React context to expose config |
| Feature toggle navigation | Filter nav items based on config |
| Feature toggle dashboard | Show/hide widgets based on config |
| Hide disabled pages | Route guards for disabled features |

### 4.2 Medium Effort (3-5 days each)

| Task | Description |
|------|-------------|
| Timesheet deliverable allocation | Add deliverable_id to timesheets, update UI |
| Single vs dual approval workflows | Conditional approval logic in services |
| Expense category customisation | Dynamic categories from config |
| Project wizard UI | Multi-step wizard component |

### 4.3 High Effort (1-2 weeks each)

| Task | Description |
|------|-------------|
| Billing model variations | Different calculation/display logic per model |
| Approval workflow refactoring | Abstract workflow engine |
| Migration for existing projects | Default config for existing data |
| Comprehensive E2E testing | Test all configuration combinations |

### 4.4 Effort Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase A: Foundation** | Config table, context, basic toggles | 1-2 weeks |
| **Phase B: Feature Toggles** | Navigation, dashboard, page guards | 1 week |
| **Phase C: Timesheet Model** | Deliverable allocation option | 1 week |
| **Phase D: Wizard UI** | Multi-step wizard component | 1-2 weeks |
| **Phase E: Workflow Variations** | Single/dual approval options | 1-2 weeks |
| **Phase F: Testing & Polish** | E2E tests, edge cases | 1 week |

**Total Estimated Effort: 6-10 weeks**

---

## Part 5: Recommended Approach

### 5.1 MVP (Minimum Viable Product)

Focus on the highest-value configuration options first:

1. **Feature toggles** (KPIs, QS, Variations, RAID)
2. **Billing model selection** (Milestone vs T&M vs Fixed)
3. **Basic wizard UI** (Project basics + feature selection)

**MVP Effort: 3-4 weeks**

### 5.2 Phase 2 Enhancements

4. **Timesheet deliverable allocation**
5. **Single vs dual approval workflows**
6. **Expense category customisation**

**Phase 2 Effort: 2-3 weeks**

### 5.3 Phase 3 Enhancements

7. **Project templates** (pre-configured setups)
8. **Import from existing project**
9. **Advanced workflow customisation**

**Phase 3 Effort: 2-3 weeks**

---

## Part 6: Technical Considerations

### 6.1 Context Architecture

```jsx
// Proposed context structure
<AuthProvider>
  <ProjectProvider>
    <ProjectConfigProvider> {/* NEW */}
      <App />
    </ProjectConfigProvider>
  </ProjectProvider>
</AuthProvider>
```

### 6.2 Config Access Pattern

```javascript
// Hook usage example
import { useProjectConfig } from '../contexts/ProjectConfigContext';

function DeliverablesPage() {
  const { features, workflows } = useProjectConfig();
  
  // Guard: redirect if feature disabled
  if (!features.deliverables) {
    return <Navigate to="/dashboard" />;
  }
  
  // Conditional rendering based on config
  return (
    <div>
      {features.kpis && <KPILinkSection />}
      {features.qualityStandards && <QSLinkSection />}
    </div>
  );
}
```

### 6.3 Migration Strategy

For existing projects:
1. Create `project_config` records with sensible defaults
2. Default all features to current behaviour (enabled)
3. New projects use wizard; existing projects can edit config

### 6.4 RLS Considerations

Project config inherits project-level RLS:
- Only project members can view config
- Only Admin/Supplier PM can modify config

---

## Part 7: Recommended Next Steps

1. **Decide MVP scope** — Which configuration options are must-have?
2. **Create technical design doc** — Detailed component/API specifications
3. **Create database migration** — `project_config` table
4. **Build ProjectConfigContext** — React context for config access
5. **Build wizard UI** — Multi-step form component
6. **Implement feature toggles** — Navigation + page guards
7. **Test with multiple projects** — Verify isolation

---

## Appendix: Current File Inventory

### Key Files to Modify

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `ProjectContext.jsx` | Project state | Add config fetching |
| `navigation.js` | Nav items | Filter by config |
| `Layout.jsx` | App shell | Conditional nav |
| `Dashboard.jsx` | Main dashboard | Conditional widgets |
| `Timesheets.jsx` | Time tracking | Deliverable allocation |
| `Settings.jsx` | Project settings | Config editor UI |
| All service files | Data access | Respect config |

### New Files Needed

| File | Purpose |
|------|---------|
| `ProjectConfigContext.jsx` | Config state management |
| `useProjectConfig.js` | Config hook |
| `ProjectWizard.jsx` | Multi-step wizard |
| `WizardStep*.jsx` | Individual wizard steps |
| `projectConfig.service.js` | Config CRUD operations |
| `20251216_project_config.sql` | Database migration |

---

*This document provides a foundation for planning the project configuration feature. The actual implementation details will be refined during technical design.*
