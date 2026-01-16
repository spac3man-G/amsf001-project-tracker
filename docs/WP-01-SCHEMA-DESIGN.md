# WP-01: Database Schema Design for Workflow Settings

> **Created:** 16 January 2026
> **Status:** DRAFT - Awaiting User Approval
> **Work Package:** WP-01 of Workflow Settings Implementation

---

## 1. Current State

### 1.1 Existing `projects` Table Columns

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  name TEXT NOT NULL,
  reference TEXT UNIQUE,
  total_budget DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  allocated_days INTEGER,
  pmo_threshold INTEGER,
  settings JSONB,           -- Currently used for basic config
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### 1.2 Current `settings` JSONB Usage

```json
{
  "currency": "USD",
  "hoursPerDay": 8,
  "fiscalYearStart": "01-01",
  "requireTimesheetApproval": true,
  "requireExpenseApproval": true,
  "defaultTimesheetMilestone": null,
  "clientName": "Government of Jersey",
  "contractReference": "GOJ/2025/2409"
}
```

**Finding:** The existing `settings` JSONB is lightly used. No code actively queries these values for workflow decisions. The `requireTimesheetApproval` and `requireExpenseApproval` flags exist but are not enforced.

---

## 2. Proposed Schema Design

### 2.1 Design Philosophy

**Hybrid Approach:**
- **Typed columns** for frequently-queried workflow flags (enables SQL `WHERE` clauses)
- **JSONB** for extended settings (flexibility for future additions)
- **Separate templates table** for reusable project configurations

### 2.2 New Columns on `projects` Table

```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS
  -- Template applied (if any)
  template_id UUID REFERENCES project_templates(id),

  -- ============================================
  -- MILESTONE SETTINGS
  -- ============================================

  -- Baseline Management
  baselines_required BOOLEAN DEFAULT true,
  baseline_approval TEXT DEFAULT 'both'
    CHECK (baseline_approval IN ('both', 'supplier_only', 'customer_only', 'none')),
  variations_required BOOLEAN DEFAULT true,
  variation_approval TEXT DEFAULT 'both'
    CHECK (variation_approval IN ('both', 'supplier_only', 'customer_only')),

  -- Certificates
  certificates_required BOOLEAN DEFAULT true,
  certificate_approval TEXT DEFAULT 'both'
    CHECK (certificate_approval IN ('both', 'supplier_only', 'customer_only')),

  -- Billing
  milestone_billing_enabled BOOLEAN DEFAULT true,
  milestone_billing_type TEXT DEFAULT 'fixed'
    CHECK (milestone_billing_type IN ('fixed', 'estimate', 'none')),

  -- ============================================
  -- DELIVERABLE SETTINGS
  -- ============================================

  deliverable_approval_required BOOLEAN DEFAULT true,
  deliverable_approval_authority TEXT DEFAULT 'both'
    CHECK (deliverable_approval_authority IN ('both', 'supplier_only', 'customer_only', 'none')),
  deliverable_review_required BOOLEAN DEFAULT true,
  deliverable_review_authority TEXT DEFAULT 'customer_only'
    CHECK (deliverable_review_authority IN ('customer_only', 'supplier_only', 'either')),
  quality_standards_enabled BOOLEAN DEFAULT true,
  kpis_enabled BOOLEAN DEFAULT true,

  -- ============================================
  -- TIMESHEET SETTINGS
  -- ============================================

  timesheets_enabled BOOLEAN DEFAULT true,
  timesheet_approval_required BOOLEAN DEFAULT true,
  timesheet_approval_authority TEXT DEFAULT 'customer_pm'
    CHECK (timesheet_approval_authority IN ('customer_pm', 'supplier_pm', 'either', 'both')),

  -- ============================================
  -- EXPENSE SETTINGS
  -- ============================================

  expenses_enabled BOOLEAN DEFAULT true,
  expense_approval_required BOOLEAN DEFAULT true,
  expense_approval_authority TEXT DEFAULT 'conditional'
    CHECK (expense_approval_authority IN ('conditional', 'customer_pm', 'supplier_pm', 'both')),
  expense_receipt_required BOOLEAN DEFAULT true,
  expense_receipt_threshold DECIMAL(10,2) DEFAULT 25.00,

  -- ============================================
  -- VARIATION SETTINGS
  -- ============================================

  variations_enabled BOOLEAN DEFAULT true,

  -- ============================================
  -- RAID LOG SETTINGS
  -- ============================================

  raid_enabled BOOLEAN DEFAULT true,

  -- ============================================
  -- EXTENDED SETTINGS (JSONB)
  -- ============================================

  workflow_settings JSONB DEFAULT '{}'::jsonb;
```

### 2.3 Column Summary

| Category | Column | Type | Default | Description |
|----------|--------|------|---------|-------------|
| Template | `template_id` | UUID | null | Reference to applied template |
| Milestones | `baselines_required` | BOOLEAN | true | Require formal baselines |
| Milestones | `baseline_approval` | TEXT | 'both' | Who signs baselines |
| Milestones | `variations_required` | BOOLEAN | true | Require variations for baseline changes |
| Milestones | `variation_approval` | TEXT | 'both' | Who approves variations |
| Milestones | `certificates_required` | BOOLEAN | true | Require milestone certificates |
| Milestones | `certificate_approval` | TEXT | 'both' | Who signs certificates |
| Milestones | `milestone_billing_enabled` | BOOLEAN | true | Track milestone billing |
| Milestones | `milestone_billing_type` | TEXT | 'fixed' | Billing type |
| Deliverables | `deliverable_approval_required` | BOOLEAN | true | Require sign-off |
| Deliverables | `deliverable_approval_authority` | TEXT | 'both' | Who signs deliverables |
| Deliverables | `deliverable_review_required` | BOOLEAN | true | Require review step |
| Deliverables | `deliverable_review_authority` | TEXT | 'customer_only' | Who reviews |
| Deliverables | `quality_standards_enabled` | BOOLEAN | true | Show quality standards |
| Deliverables | `kpis_enabled` | BOOLEAN | true | Show KPIs |
| Timesheets | `timesheets_enabled` | BOOLEAN | true | Track timesheets |
| Timesheets | `timesheet_approval_required` | BOOLEAN | true | Require approval |
| Timesheets | `timesheet_approval_authority` | TEXT | 'customer_pm' | Who approves |
| Expenses | `expenses_enabled` | BOOLEAN | true | Track expenses |
| Expenses | `expense_approval_required` | BOOLEAN | true | Require approval |
| Expenses | `expense_approval_authority` | TEXT | 'conditional' | Who approves |
| Expenses | `expense_receipt_required` | BOOLEAN | true | Require receipts |
| Expenses | `expense_receipt_threshold` | DECIMAL | 25.00 | Amount for receipt |
| Variations | `variations_enabled` | BOOLEAN | true | Show variations module |
| RAID | `raid_enabled` | BOOLEAN | true | Show RAID log |
| Extended | `workflow_settings` | JSONB | {} | Additional settings |

**Total: 24 new columns**

---

## 3. Project Templates Table

### 3.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template identification
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Ownership
  is_system BOOLEAN DEFAULT false,       -- System template (cannot be deleted)
  organisation_id UUID REFERENCES organisations(id),  -- null = system template

  -- Template settings (mirrors projects columns)
  baselines_required BOOLEAN DEFAULT true,
  baseline_approval TEXT DEFAULT 'both',
  variations_required BOOLEAN DEFAULT true,
  variation_approval TEXT DEFAULT 'both',
  certificates_required BOOLEAN DEFAULT true,
  certificate_approval TEXT DEFAULT 'both',
  milestone_billing_enabled BOOLEAN DEFAULT true,
  milestone_billing_type TEXT DEFAULT 'fixed',
  deliverable_approval_required BOOLEAN DEFAULT true,
  deliverable_approval_authority TEXT DEFAULT 'both',
  deliverable_review_required BOOLEAN DEFAULT true,
  deliverable_review_authority TEXT DEFAULT 'customer_only',
  quality_standards_enabled BOOLEAN DEFAULT true,
  kpis_enabled BOOLEAN DEFAULT true,
  timesheets_enabled BOOLEAN DEFAULT true,
  timesheet_approval_required BOOLEAN DEFAULT true,
  timesheet_approval_authority TEXT DEFAULT 'customer_pm',
  expenses_enabled BOOLEAN DEFAULT true,
  expense_approval_required BOOLEAN DEFAULT true,
  expense_approval_authority TEXT DEFAULT 'conditional',
  expense_receipt_required BOOLEAN DEFAULT true,
  expense_receipt_threshold DECIMAL(10,2) DEFAULT 25.00,
  variations_enabled BOOLEAN DEFAULT true,
  raid_enabled BOOLEAN DEFAULT true,
  workflow_settings JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for template lookup
CREATE INDEX IF NOT EXISTS idx_project_templates_org
ON project_templates(organisation_id)
WHERE organisation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_project_templates_system
ON project_templates(is_system)
WHERE is_system = true;
```

### 3.2 System Templates (Seed Data)

```sql
INSERT INTO project_templates (name, slug, description, is_system, ...)
VALUES
  -- 1. Formal Fixed-Price
  ('Formal Fixed-Price', 'formal-fixed-price',
   'Full governance with dual-signature workflows. For government contracts and enterprise projects.',
   true,
   true, 'both', true, 'both', true, 'both', true, 'fixed',
   true, 'both', true, 'customer_only', true, true,
   true, true, 'customer_pm',
   true, true, 'conditional', true, 25.00,
   true, true, '{}'::jsonb),

  -- 2. Time & Materials
  ('Time & Materials', 'time-materials',
   'Flexible tracking with customer approval focus. For consulting and professional services.',
   true,
   false, 'none', false, 'none', false, 'none', true, 'estimate',
   true, 'customer_only', false, 'customer_only', true, true,
   true, true, 'customer_pm',
   true, true, 'customer_pm', true, 25.00,
   false, true, '{}'::jsonb),

  -- 3. Internal Project
  ('Internal Project', 'internal-project',
   'Minimal governance for internal initiatives. Supplier-only workflows.',
   true,
   false, 'none', false, 'none', false, 'none', false, 'none',
   false, 'none', false, 'supplier_only', true, false,
   true, false, 'supplier_pm',
   false, false, 'supplier_pm', false, 0,
   false, true, '{}'::jsonb),

  -- 4. Agile/Iterative
  ('Agile/Iterative', 'agile-iterative',
   'Light governance with frequent delivery. For software development and sprints.',
   true,
   false, 'none', false, 'none', false, 'none', true, 'estimate',
   true, 'supplier_only', false, 'supplier_only', true, false,
   true, true, 'supplier_pm',
   true, true, 'supplier_pm', true, 50.00,
   false, true, '{}'::jsonb),

  -- 5. Regulated Industry
  ('Regulated Industry', 'regulated-industry',
   'Maximum governance with full audit trail. For healthcare, finance, and legal.',
   true,
   true, 'both', true, 'both', true, 'both', true, 'fixed',
   true, 'both', true, 'both', true, true,
   true, true, 'both',
   true, true, 'both', true, 0,
   true, true, '{}'::jsonb);
```

---

## 4. RLS Policies

### 4.1 Project Templates RLS

```sql
-- Enable RLS
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;

-- System templates readable by all authenticated users
CREATE POLICY "System templates are publicly readable"
ON project_templates FOR SELECT
TO authenticated
USING (is_system = true);

-- Organisation templates readable by org members
CREATE POLICY "Org templates readable by org members"
ON project_templates FOR SELECT
TO authenticated
USING (
  organisation_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = project_templates.organisation_id
    AND uo.user_id = auth.uid()
  )
);

-- Only org admins can manage org templates
CREATE POLICY "Org admins can manage org templates"
ON project_templates FOR ALL
TO authenticated
USING (
  organisation_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM user_organisations uo
    WHERE uo.organisation_id = project_templates.organisation_id
    AND uo.user_id = auth.uid()
    AND uo.org_role IN ('org_owner', 'org_admin', 'supplier_pm')
  )
);
```

### 4.2 Updated Projects RLS (No Changes Needed)

The existing projects RLS policies remain valid - new columns are automatically covered.

---

## 5. Default Values Strategy

### 5.1 Match Current Behavior

All default values are set to match the current hardcoded behavior:

| Current Behavior | Default Value |
|-----------------|---------------|
| Dual-signature milestone baselines | `baseline_approval = 'both'` |
| Dual-signature certificates | `certificate_approval = 'both'` |
| Dual-signature deliverables | `deliverable_approval_authority = 'both'` |
| Customer PM approves timesheets | `timesheet_approval_authority = 'customer_pm'` |
| Conditional expense approval | `expense_approval_authority = 'conditional'` |
| All features enabled | All `*_enabled` = `true` |

### 5.2 Existing Projects Migration

Existing projects will automatically get default values (current behavior preserved).

```sql
-- No data migration needed - defaults match current behavior
-- New columns will be NULL for existing rows, app treats NULL as default
```

---

## 6. Migration Strategy

### 6.1 Phase 1: Add Columns (Non-Breaking)

```sql
-- Migration: 202601170001_add_project_workflow_settings.sql
-- Safe: Adding columns with defaults does not break existing queries

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES project_templates(id),
ADD COLUMN IF NOT EXISTS baselines_required BOOLEAN DEFAULT true,
-- ... (all 24 columns)
```

### 6.2 Phase 2: Create Templates Table

```sql
-- Migration: 202601170002_create_project_templates.sql
CREATE TABLE IF NOT EXISTS project_templates (...);
-- RLS policies
```

### 6.3 Phase 3: Seed System Templates

```sql
-- Migration: 202601170003_seed_system_templates.sql
INSERT INTO project_templates VALUES (...);
```

### 6.4 Rollback Strategy

```sql
-- Rollback is safe: columns are additive
-- Frontend will ignore new columns until feature is deployed
-- Templates table can be dropped without affecting projects
```

---

## 7. Questions for User Approval

Before proceeding to WP-02 (Migration), please confirm:

### 7.1 Schema Questions

1. **Approval Authority Values**: Is the enum ('both', 'supplier_only', 'customer_only', 'none', 'conditional', 'either') sufficient?

2. **Conditional Expense Logic**: Keep `'conditional'` for expense approval (chargeable → customer, non-chargeable → supplier)?

3. **Templates Scope**: Start with 5 system templates only? (Org-specific templates deferred)

### 7.2 Migration Questions

1. **Existing Projects**: Apply default values (current behavior) to all existing projects?

2. **Settings JSONB Migration**: Preserve existing `settings.requireTimesheetApproval` and `settings.requireExpenseApproval` or migrate to new columns?

3. **Staging Test**: Is there a staging environment to test migrations before production?

---

## 8. Approval Checklist

- [ ] Schema design approved
- [ ] Default values match current behavior
- [ ] Templates list approved
- [ ] Migration strategy approved
- [ ] Rollback plan acceptable
- [ ] Ready to proceed to WP-02

---

*Document: WP-01-SCHEMA-DESIGN.md*
*Created: 16 January 2026*
*Status: Awaiting User Approval*
