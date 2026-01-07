# AMSF001 Technical Specification: Database Schema - Operational Tables

**Document:** TECH-SPEC-03-Database-Operations.md  
**Version:** 1.2  
**Created:** 10 December 2025  
**Updated:** 7 January 2026  
**Session:** Documentation Review Phase 4  

> **Version 1.2 Updates (7 January 2026):**
> - Added `receipt_scans` and `classification_rules` to Operational Tables Summary (Section 1.1)
> - Verified `expense_files.bucket` column documentation (Section 10.4)
> - See TECH-SPEC-11-Evaluator.md for Evaluator module documentation

> **Version 1.1 Updates (23 December 2025):**
> - Added note about organisation context inheritance
> - Added Document History section
> - No schema changes - operational tables inherit org context via project_id

---

## 1. Overview

This document covers the operational tables that manage day-to-day project activities including time tracking, expense management, and partner invoicing. These tables handle transactional data that flows through approval workflows and drives financial reporting.

### 1.1 Operational Tables Summary

| Table | Purpose | Records Per Project |
|-------|---------|---------------------|
| `timesheets` | Time entry and approval | Hundreds-Thousands |
| `expenses` | Expense claims and receipts | Dozens-Hundreds |
| `partners` | Third-party companies | Few-Dozens |
| `partner_invoices` | Invoices to partners | Dozens |
| `partner_invoice_lines` | Invoice line items | Hundreds |
| `receipt_scans` | AI receipt scanning records | Dozens-Hundreds |
| `classification_rules` | Learned expense categories | Dozens |

### 1.2 Workflow Characteristics

All operational tables implement:
- **Status workflows:** Draft → Submitted → Approved/Rejected
- **Approval tracking:** Who approved, when, with timestamps
- **Audit trails:** Created/updated timestamps, user references
- **Soft delete:** Preserves financial audit history
- **RLS policies:** Project-scoped with role-based permissions

> **Organisation Context (December 2025):** These tables are Tier 3 entities in the three-tier multi-tenancy model. They reference `project_id`, and inherit organisation context through the project's `organisation_id` foreign key. RLS policies use the `can_access_project()` helper function which checks both project membership and organisation admin status. See TECH-SPEC-02-Database-Core.md for the organisation layer.

---

## 2. Timesheets Table

The `timesheets` table captures time worked by resources on milestones, with validation and approval workflows.

### 2.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS timesheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  -- Time entry
  date DATE NOT NULL,
  hours DECIMAL(3,1) CHECK (hours >= 0.5 AND hours <= 12),
  
  -- Workflow
  status TEXT CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
  comments TEXT,
  
  -- Approval tracking
  submitted_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);
```

### 2.2 Column Reference

#### Core Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project (tenant) |
| `resource_id` | UUID | No | Resource who worked the time |
| `milestone_id` | UUID | No | Milestone time was charged to |
| `user_id` | UUID | Yes | User account (if resource is linked) |
| `date` | DATE | No | Work date |
| `hours` | DECIMAL(3,1) | No | Hours worked (0.5 to 12.0) |
| `comments` | TEXT | Yes | Optional time entry notes |

#### Workflow Fields

| Column | Type | Description |
|--------|------|-------------|
| `status` | TEXT | Current workflow state |
| `submitted_date` | TIMESTAMPTZ | When submitted for approval |
| `approved_date` | TIMESTAMPTZ | When approved |
| `approved_by` | UUID | User who approved |

### 2.3 Status Values

| Status | Description | User Actions |
|--------|-------------|--------------|
| `Draft` | Initial entry, not submitted | Edit, Delete, Submit |
| `Submitted` | Awaiting approval | View only |
| `Approved` | Validated and locked | View only |
| `Rejected` | Sent back for correction | Edit, Resubmit |

### 2.4 Business Rules

**Hours Validation:**
- Minimum: 0.5 hours (30 minutes)
- Maximum: 12 hours per entry
- Increments: 0.5 hour steps
- Multiple entries allowed per date (different milestones)

**Status Transitions:**
```
Draft ──[Submit]──> Submitted ──[Approve]──> Approved
                         │
                    [Reject]
                         │
                         └──────────────> Rejected ──[Edit]──> Draft
```

**Modification Rules:**
- Draft: Editable by owner
- Submitted: Locked, admin can approve/reject
- Approved: Locked, no edits
- Rejected: Can be edited and resubmitted

### 2.5 Financial Impact

Timesheets drive financial calculations:

```javascript
// Daily cost calculation
timesheet_cost = resource.daily_rate × (hours / hours_per_day)

// With discounted rate
timesheet_cost = resource.discounted_rate × (hours / hours_per_day)

// For partner invoicing (at cost)
invoice_amount = resource.cost_price × (hours / hours_per_day)
```

### 2.6 Indexes

```sql
CREATE INDEX idx_timesheets_project_id ON timesheets(project_id);
CREATE INDEX idx_timesheets_resource_id ON timesheets(resource_id);
CREATE INDEX idx_timesheets_milestone_id ON timesheets(milestone_id);
CREATE INDEX idx_timesheets_date ON timesheets(date);
CREATE INDEX IF NOT EXISTS idx_timesheets_status 
  ON timesheets(status);
CREATE INDEX IF NOT EXISTS idx_timesheets_user_id 
  ON timesheets(user_id);
```

### 2.7 Relationships

- **Parents:** `projects`, `resources`, `milestones`, `auth.users`
- **Used by:** `partner_invoice_lines` (for partner billing)
- **Aggregations:** Dashboard metrics, milestone actual costs

### 2.8 RLS Policies

```sql
-- Users can view all timesheets in their projects
CREATE POLICY "timesheets_select_policy" ON timesheets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = timesheets.project_id
      AND up.user_id = auth.uid()
    )
  );

-- Users can create own timesheets
CREATE POLICY "timesheets_insert_policy" ON timesheets
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own drafts/rejected
CREATE POLICY "timesheets_update_policy" ON timesheets
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    AND status IN ('Draft', 'Rejected')
  );

-- Admins can manage all timesheets
CREATE POLICY "timesheets_admin_policy" ON timesheets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = timesheets.project_id
      AND up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );
```

---

## 3. Expenses Table

The `expenses` table captures project expenses with receipt scanning and approval workflows.

### 3.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id),
  user_id UUID REFERENCES auth.users(id),
  resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
  
  -- Expense details
  expense_ref TEXT NOT NULL,
  expense_date DATE NOT NULL,
  category TEXT,
  description TEXT,
  amount DECIMAL(10,2),
  
  -- Procurement tracking
  procurement_method TEXT CHECK (procurement_method IN (
    'direct', 'partner'
  )) DEFAULT 'direct',
  
  -- Receipt handling
  receipt_url TEXT,
  receipt_file_name TEXT,
  scanned_data JSONB,  -- AI-extracted receipt data
  
  -- Workflow
  status TEXT CHECK (status IN (
    'Draft', 'Submitted', 'Approved', 'Rejected'
  )),
  comments TEXT,
  
  -- Approval tracking
  submitted_date TIMESTAMPTZ,
  approved_date TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Test content flag
  is_test_content BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  UNIQUE(project_id, expense_ref)
);
```

### 3.2 Column Reference

#### Core Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project |
| `milestone_id` | UUID | Yes | Associated milestone |
| `user_id` | UUID | Yes | User who incurred expense |
| `resource_id` | UUID | Yes | Associated resource (if applicable) |
| `expense_ref` | TEXT | No | Unique reference (e.g., "EXP-001") |
| `expense_date` | DATE | No | Date expense was incurred |
| `category` | TEXT | Yes | Expense category |
| `description` | TEXT | Yes | Expense description |
| `amount` | DECIMAL(10,2) | Yes | Expense amount |

#### Procurement Fields

| Column | Type | Description |
|--------|------|-------------|
| `procurement_method` | TEXT | 'direct' (paid by project) or 'partner' (partner-procured) |

**Procurement Method Values:**
- `direct`: Expense paid directly by the project/client
- `partner`: Expense procured by partner company, to be invoiced

#### Receipt Fields

| Column | Type | Description |
|--------|------|-------------|
| `receipt_url` | TEXT | Supabase storage URL to receipt image/PDF |
| `receipt_file_name` | TEXT | Original filename |
| `scanned_data` | JSONB | AI-extracted data from receipt scanner |

#### Workflow Fields

| Column | Type | Description |
|--------|------|-------------|
| `status` | TEXT | Current workflow state |
| `comments` | TEXT | User notes or rejection reasons |
| `submitted_date` | TIMESTAMPTZ | Submission timestamp |
| `approved_date` | TIMESTAMPTZ | Approval timestamp |
| `approved_by` | UUID | Approving user |

### 3.3 Status Values

| Status | Description | User Actions |
|--------|-------------|--------------|
| `Draft` | Initial entry | Edit, Attach Receipt, Delete, Submit |
| `Submitted` | Awaiting validation | View only |
| `Approved` | Validated and locked | View only |
| `Rejected` | Sent back with comments | Edit, Resubmit |

### 3.4 Scanned Data Structure

The `scanned_data` JSONB field stores AI-extracted receipt information:

```json
{
  "vendor": "Acme Office Supplies",
  "date": "2025-12-08",
  "total": 42.50,
  "currency": "USD",
  "items": [
    {
      "description": "Paper (A4)",
      "quantity": 5,
      "price": 8.50
    }
  ],
  "confidence": 0.95,
  "extracted_at": "2025-12-08T14:30:00Z"
}
```

### 3.5 Business Rules

**Status Transitions:**
```
Draft ──[Submit]──> Submitted ──[Approve]──> Approved
                         │
                    [Reject]
                         │
                         └──────────────> Rejected ──[Edit]──> Draft
```

**Receipt Requirements:**
- Receipts are recommended but not mandatory
- AI scanner assists with data entry
- Manual override always available

**Procurement Impact:**
- `direct`: Counted in project's expense totals
- `partner`: Included in partner invoices

### 3.6 Indexes

```sql
CREATE INDEX idx_expenses_project_id ON expenses(project_id);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_resource_id 
  ON expenses(resource_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status 
  ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_procurement_method 
  ON expenses(procurement_method);
```

### 3.7 Relationships

- **Parents:** `projects`, `milestones`, `auth.users`, `resources`
- **Storage:** Receipt files in Supabase Storage bucket `expense-receipts/`
- **Used by:** `partner_invoice_lines` (for partner-procured expenses)
- **Aggregations:** Dashboard expense metrics, milestone actual costs

### 3.8 RLS Policies

```sql
-- Similar pattern to timesheets
CREATE POLICY "expenses_select_policy" ON expenses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = expenses.project_id
      AND up.user_id = auth.uid()
    )
  );

-- Users can create own expenses
CREATE POLICY "expenses_insert_policy" ON expenses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update own drafts/rejected
CREATE POLICY "expenses_update_policy" ON expenses
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id 
    AND status IN ('Draft', 'Rejected')
  );

-- Admins can manage all
CREATE POLICY "expenses_admin_policy" ON expenses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = expenses.project_id
      AND up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );
```

---

## 4. Partners Table

The `partners` table stores third-party companies that provide resources to the project.

### 4.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Company information
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Business terms
  payment_terms TEXT DEFAULT 'Net 30',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(project_id, name)
);
```

### 4.2 Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project |
| `name` | TEXT | No | Company name (unique per project) |
| `contact_name` | TEXT | Yes | Primary contact person |
| `contact_email` | TEXT | Yes | Contact email |
| `contact_phone` | TEXT | Yes | Contact phone number |
| `payment_terms` | TEXT | Yes | Payment terms (e.g., "Net 30", "Net 45") |
| `is_active` | BOOLEAN | Yes | Active status (default: true) |
| `notes` | TEXT | Yes | Additional notes |
| `created_by` | UUID | Yes | User who created the partner |

### 4.3 Business Rules

**Uniqueness:**
- Partner names must be unique within a project
- Same company can be a partner on multiple projects

**Active Status:**
- Inactive partners are hidden in dropdowns
- Historical invoices remain visible
- Can be reactivated at any time

**Dependencies:**
- Partners can have linked resources (via `resources.partner_id`)
- Partners can have invoices (via `partner_invoices`)
- Cannot delete if dependencies exist

### 4.4 Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_partners_project_id 
  ON partners(project_id);
CREATE INDEX IF NOT EXISTS idx_partners_active 
  ON partners(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_partners_name 
  ON partners(project_id, name);
```

### 4.5 Relationships

- **Parent:** `projects(id)`
- **Children:** `resources` (via `partner_id`), `partner_invoices`
- **Used by:** Invoice generation, resource linking

### 4.6 RLS Policies

```sql
CREATE POLICY "partners_select_policy" ON partners
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = partners.project_id
      AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "partners_insert_policy" ON partners
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = partners.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "partners_update_policy" ON partners
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = partners.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "partners_delete_policy" ON partners
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = partners.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );
```

---

## 5. Partner_Invoices Table

The `partner_invoices` table stores invoices generated for partner companies to bill for their resources' time and expenses.

### 5.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS partner_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
  -- Invoice identification
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Period covered
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Invoice types
  invoice_type TEXT DEFAULT 'both' CHECK (invoice_type IN (
    'timesheet_only', 'expense_only', 'both'
  )),
  
  -- Totals (stored for historical accuracy)
  timesheet_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  expense_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  invoice_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN (
    'Draft', 'Sent', 'Paid', 'Cancelled'
  )),
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(project_id, invoice_number)
);
```

### 5.2 Column Reference

#### Identification Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `project_id` | UUID | No | Parent project |
| `partner_id` | UUID | No | Partner being invoiced |
| `invoice_number` | TEXT | No | Unique invoice reference (e.g., "INV-2025-001") |
| `invoice_date` | DATE | No | Invoice issue date |

#### Period Fields

| Column | Type | Description |
|--------|------|-------------|
| `period_start` | DATE | Start of billing period |
| `period_end` | DATE | End of billing period |

#### Type and Totals

| Column | Type | Description |
|--------|------|-------------|
| `invoice_type` | TEXT | Type of invoice (timesheet_only, expense_only, both) |
| `timesheet_total` | DECIMAL(10,2) | Sum of timesheet line items at cost price |
| `expense_total` | DECIMAL(10,2) | Sum of partner-procured expenses |
| `invoice_total` | DECIMAL(10,2) | Total invoice amount (timesheet + expense) |

#### Status Fields

| Column | Type | Description |
|--------|------|-------------|
| `status` | TEXT | Current invoice status |
| `notes` | TEXT | Additional notes |
| `created_by` | UUID | User who generated invoice |
| `sent_at` | TIMESTAMPTZ | When marked as sent |
| `paid_at` | TIMESTAMPTZ | When marked as paid |

### 5.3 Invoice Types

| Type | Description | Includes |
|------|-------------|----------|
| `timesheet_only` | Time billing only | Approved timesheets only |
| `expense_only` | Expenses only | Partner-procured expenses only |
| `both` | Combined invoice | Both timesheets and expenses |

### 5.4 Status Values

| Status | Description | Actions |
|--------|-------------|---------|
| `Draft` | Being prepared | Edit, Delete, Send |
| `Sent` | Issued to partner | Mark Paid |
| `Paid` | Payment received | View only |
| `Cancelled` | Voided invoice | View only |

### 5.5 Status Workflow

```
Draft ──[Send]──> Sent ──[Mark Paid]──> Paid
  │                 │
  │            [Cancel]
  │                 │
  └─[Cancel]──> Cancelled
```

### 5.6 Invoice Number Pattern

Invoice numbers follow the pattern: `INV-{YEAR}-{SEQUENCE}`

Examples:
- `INV-2025-001`
- `INV-2025-002`

Generated sequentially per project.

### 5.7 Financial Calculations

**Timesheet Cost Calculation:**
```javascript
// Per timesheet line
timesheet_cost = resource.cost_price × (hours / hours_per_day)

// Invoice timesheet_total
timesheet_total = SUM(all approved timesheet costs for period)
```

**Expense Cost Calculation:**
```javascript
// Only includes expenses with procurement_method = 'partner'
expense_total = SUM(partner-procured expense amounts for period)
```

**Invoice Total:**
```javascript
invoice_total = timesheet_total + expense_total
```

### 5.8 Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_partner_invoices_project 
  ON partner_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_partner_invoices_partner 
  ON partner_invoices(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_invoices_status 
  ON partner_invoices(status);
CREATE INDEX IF NOT EXISTS idx_partner_invoices_date 
  ON partner_invoices(invoice_date);
```

### 5.9 Relationships

- **Parents:** `projects`, `partners`
- **Children:** `partner_invoice_lines`
- **Data Sources:** `timesheets`, `expenses` (via invoice lines)

### 5.10 RLS Policies

```sql
CREATE POLICY "partner_invoices_select_policy" ON partner_invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = partner_invoices.project_id
      AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "partner_invoices_insert_policy" ON partner_invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = partner_invoices.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "partner_invoices_update_policy" ON partner_invoices
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = partner_invoices.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "partner_invoices_delete_policy" ON partner_invoices
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = partner_invoices.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );
```

---

## 6. Partner_Invoice_Lines Table

The `partner_invoice_lines` table stores individual line items on partner invoices, linking back to source timesheets or expenses.

### 6.1 Schema Definition

```sql
CREATE TABLE IF NOT EXISTS partner_invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES partner_invoices(id) ON DELETE CASCADE,
  
  -- Line type
  line_type TEXT NOT NULL CHECK (line_type IN (
    'timesheet', 'expense'
  )),
  
  -- Reference to source record
  timesheet_id UUID REFERENCES timesheets(id) ON DELETE SET NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  
  -- Denormalized data (preserved even if source deleted)
  description TEXT NOT NULL,
  quantity DECIMAL(10,2),      -- Hours for timesheets, 1 for expenses
  unit_price DECIMAL(10,2),    -- Cost rate for timesheets, amount for expenses
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Additional context
  resource_name TEXT,
  milestone_name TEXT,
  line_date DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (line_type = 'timesheet' AND timesheet_id IS NOT NULL AND expense_id IS NULL) OR
    (line_type = 'expense' AND expense_id IS NOT NULL AND timesheet_id IS NULL)
  )
);
```

### 6.2 Column Reference

#### Core Fields

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `invoice_id` | UUID | No | Parent invoice |
| `line_type` | TEXT | No | 'timesheet' or 'expense' |
| `timesheet_id` | UUID | Yes | Source timesheet (if line_type = 'timesheet') |
| `expense_id` | UUID | Yes | Source expense (if line_type = 'expense') |

#### Denormalized Fields

These fields preserve data even if source records are deleted:

| Column | Type | Description |
|--------|------|-------------|
| `description` | TEXT | Line item description |
| `quantity` | DECIMAL(10,2) | Hours (for timesheets) or 1 (for expenses) |
| `unit_price` | DECIMAL(10,2) | Cost rate per unit |
| `line_total` | DECIMAL(10,2) | Extended amount (quantity × unit_price) |
| `resource_name` | TEXT | Resource name for context |
| `milestone_name` | TEXT | Milestone name for context |
| `line_date` | DATE | Date of timesheet or expense |

### 6.3 Line Types

| Type | Source | Quantity | Unit Price | Calculation |
|------|--------|----------|------------|-------------|
| `timesheet` | Timesheet record | Hours worked | Resource cost_price / hours_per_day | `quantity × unit_price` |
| `expense` | Expense record | 1 | Expense amount | `expense.amount` |

### 6.4 Denormalization Strategy

**Why Denormalize?**
- Preserves invoice accuracy if source data changes
- Maintains audit trail even if timesheet/expense deleted
- Enables historical invoice regeneration
- Supports financial reporting requirements

**Data Snapshot:**
When an invoice line is created, it captures:
- Current resource rates
- Current milestone assignments
- Current descriptions
- All contextual information

**Source Reference:**
- `timesheet_id` / `expense_id` links back to source (if still exists)
- `ON DELETE SET NULL` preserves line even if source deleted
- Denormalized fields ensure invoice remains complete

### 6.5 Timesheet Line Example

```json
{
  "line_type": "timesheet",
  "timesheet_id": "uuid-123",
  "description": "Development work on authentication module",
  "quantity": 7.5,              // hours
  "unit_price": 62.50,          // cost_price 500/day ÷ 8 hours
  "line_total": 468.75,         // 7.5 × 62.50
  "resource_name": "John Smith",
  "milestone_name": "MS-002: User Management",
  "line_date": "2025-12-08"
}
```

### 6.6 Expense Line Example

```json
{
  "line_type": "expense",
  "expense_id": "uuid-456",
  "description": "Cloud hosting services - December",
  "quantity": 1,
  "unit_price": 250.00,
  "line_total": 250.00,
  "resource_name": null,        // expenses may not have resource
  "milestone_name": "MS-001: Infrastructure",
  "line_date": "2025-12-01"
}
```

### 6.7 Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_partner_invoice_lines_invoice 
  ON partner_invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_partner_invoice_lines_timesheet 
  ON partner_invoice_lines(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_partner_invoice_lines_expense 
  ON partner_invoice_lines(expense_id);
CREATE INDEX IF NOT EXISTS idx_partner_invoice_lines_type 
  ON partner_invoice_lines(line_type);
```

### 6.8 Relationships

- **Parent:** `partner_invoices(id)` with CASCADE delete
- **Sources:** `timesheets(id)`, `expenses(id)` with SET NULL on delete
- **Data Flow:** Timesheets/Expenses → Invoice Lines → Invoice Totals

### 6.9 RLS Policies

Invoice lines inherit access control from parent invoice:

```sql
CREATE POLICY "partner_invoice_lines_select_policy" 
  ON partner_invoice_lines
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_invoices pi
      JOIN user_projects up ON up.project_id = pi.project_id
      WHERE pi.id = partner_invoice_lines.invoice_id
      AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "partner_invoice_lines_insert_policy" 
  ON partner_invoice_lines
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partner_invoices pi
      JOIN user_projects up ON up.project_id = pi.project_id
      WHERE pi.id = partner_invoice_lines.invoice_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "partner_invoice_lines_update_policy" 
  ON partner_invoice_lines
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_invoices pi
      JOIN user_projects up ON up.project_id = pi.project_id
      WHERE pi.id = partner_invoice_lines.invoice_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

CREATE POLICY "partner_invoice_lines_delete_policy" 
  ON partner_invoice_lines
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partner_invoices pi
      JOIN user_projects up ON up.project_id = pi.project_id
      WHERE pi.id = partner_invoice_lines.invoice_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );
```

---

## 7. Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OPERATIONAL LAYER                                    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                         projects (TENANT)                         │       │
│  └─────────────┬───────────────────────────┬────────────────────────┘       │
│                │                           │                                 │
│                │                           │                                 │
│      ┌─────────▼───────┐        ┌─────────▼───────┐                        │
│      │   milestones    │        │   resources     │                        │
│      │  ───────────────│        │  ───────────────│                        │
│      │  id (PK)        │        │  id (PK)        │                        │
│      │  milestone_ref  │        │  resource_ref   │◄─────┐                 │
│      └────┬────────────┘        │  partner_id (FK)│      │                 │
│           │                     └────┬────────────┘      │                 │
│           │                          │                   │                 │
│           │                          │                   │                 │
│  ┌────────┴────────────┬─────────────┴────────┐         │                 │
│  │                     │                      │         │                 │
│  ▼                     ▼                      ▼         │                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │                 │
│  │  timesheets  │  │   expenses   │  │   partners   │  │                 │
│  │  ──────────  │  │  ──────────  │  │  ──────────  │──┘                 │
│  │  id (PK)     │  │  id (PK)     │  │  id (PK)     │                    │
│  │  resource_id │  │  resource_id │  │  name        │                    │
│  │  milestone_id│  │  milestone_id│  │  payment_    │                    │
│  │  hours       │  │  amount      │  │    terms     │                    │
│  │  status      │  │  status      │  │  is_active   │                    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                    │
│         │                 │                  │                            │
│         │                 │                  │                            │
│         │  ┌──────────────┴──────────────────┘                            │
│         │  │                                                               │
│         │  │              ┌────────────────────────┐                       │
│         │  └─────────────►│  partner_invoices      │                       │
│         │                 │  ──────────────────    │                       │
│         │                 │  id (PK)               │                       │
│         │                 │  partner_id (FK)       │                       │
│         │                 │  invoice_number        │                       │
│         │                 │  period_start/end      │                       │
│         │                 │  timesheet_total       │                       │
│         │                 │  expense_total         │                       │
│         │                 │  status                │                       │
│         │                 └────────┬───────────────┘                       │
│         │                          │                                       │
│         │                          │ 1:M                                   │
│         │                          ▼                                       │
│         │                 ┌────────────────────────┐                       │
│         └────────────────►│  partner_invoice_lines │◄──────────────────────┤
│                           │  ──────────────────    │                       │
│                           │  id (PK)               │                       │
│                           │  invoice_id (FK)       │                       │
│                           │  line_type             │                       │
│                           │  timesheet_id (FK)     │                       │
│                           │  expense_id (FK)       │                       │
│                           │  description           │                       │
│                           │  quantity              │                       │
│                           │  unit_price            │                       │
│                           │  line_total            │                       │
│                           └────────────────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Legend:
───► : Foreign Key Reference
──┬─ : One-to-Many Relationship
```

---

## 8. Common Patterns

### 8.1 Approval Workflow Pattern

All operational tables follow a consistent workflow:

```sql
-- Status column
status TEXT CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected'))

-- Approval tracking
submitted_date TIMESTAMPTZ
approved_date TIMESTAMPTZ
approved_by UUID REFERENCES auth.users(id)
comments TEXT
```

### 8.2 User Ownership Pattern

Both timesheets and expenses link to user accounts:

```sql
user_id UUID REFERENCES auth.users(id)
```

This enables:
- Self-service entry by team members
- "My Timesheets" / "My Expenses" views
- Submission workflows
- Owner-only edit permissions

### 8.3 Soft Delete Pattern

All operational tables implement soft delete:

```sql
is_deleted BOOLEAN DEFAULT FALSE
deleted_at TIMESTAMPTZ
deleted_by UUID REFERENCES auth.users(id)
```

**Why Soft Delete?**
- Preserves financial audit trail
- Enables "undelete" functionality
- Supports historical reporting
- Maintains referential integrity

### 8.4 Denormalization for Financial Records

Partner invoice lines denormalize source data:

```sql
-- Source reference (may become NULL)
timesheet_id UUID ON DELETE SET NULL

-- Denormalized snapshot (permanent)
description TEXT NOT NULL
quantity DECIMAL(10,2)
unit_price DECIMAL(10,2)
line_total DECIMAL(10,2) NOT NULL
resource_name TEXT
line_date DATE
```

**Benefits:**
- Invoice remains complete if source deleted
- Historical accuracy preserved
- Audit requirements satisfied
- Regeneration possible

---

## 9. Integration Points

### 9.1 Resource Linking

Resources can be linked to partner companies:

```sql
-- In resources table
partner_id UUID REFERENCES partners(id)
```

**Impact:**
- Partner invoices automatically include resources from that partner
- Timesheet filtering by partner
- Resource cost vs. sell price tracking

### 9.2 Milestone Financial Tracking

Timesheets and expenses roll up to milestone actuals:

```javascript
// Milestone actual cost calculation
const actualCost = 
  SUM(timesheets WHERE milestone_id AND status = 'Approved') +
  SUM(expenses WHERE milestone_id AND status = 'Approved')

// Variance
const variance = milestone.baseline_billable - actualCost
```

### 9.3 Dashboard Metrics

Operational tables drive dashboard calculations:

```javascript
// Total timesheet hours (approved)
SELECT SUM(hours) FROM timesheets 
WHERE project_id = ? AND status = 'Approved'

// Total expenses (approved)
SELECT SUM(amount) FROM expenses 
WHERE project_id = ? AND status = 'Approved'

// Partner invoice totals
SELECT SUM(invoice_total) FROM partner_invoices 
WHERE project_id = ? AND status IN ('Sent', 'Paid')
```

### 9.4 Invoice Generation Process

```
1. Select Date Range
   ↓
2. Identify Partner
   ↓
3. Query Approved Timesheets
   - For resources linked to partner
   - Within date range
   - Status = 'Approved'
   ↓
4. Query Partner-Procured Expenses
   - procurement_method = 'partner'
   - Within date range
   - Status = 'Approved'
   ↓
5. Create Invoice Record
   - Calculate totals
   - Generate invoice_number
   - Status = 'Draft'
   ↓
6. Create Invoice Lines
   - One line per timesheet
   - One line per expense
   - Denormalize all data
   ↓
7. Review & Send
   - Status → 'Sent'
   - sent_at = NOW()
```

---

## 10. Receipt Scanning System

The receipt scanning system enables AI-powered expense creation from receipt photos.

### 10.1 Receipt Scans Table

Stores scanned receipt data and AI extraction results.

```sql
CREATE TABLE receipt_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Upload info
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  image_url TEXT,
  image_path TEXT,
  
  -- Extracted data
  raw_ocr_text TEXT,
  extracted_merchant TEXT,
  extracted_amount DECIMAL(12,2),
  extracted_date DATE,
  extracted_currency TEXT DEFAULT 'GBP',
  extracted_items JSONB,
  
  -- AI classification
  ai_suggested_category TEXT,
  ai_confidence DECIMAL(3,2),
  final_category TEXT,
  user_corrected BOOLEAN DEFAULT FALSE,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'linked'
  )),
  processing_time_ms INTEGER,
  error_message TEXT,
  
  -- Link to expense when created
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.2 Classification Rules Table

Learning system that improves category suggestions based on user corrections.

```sql
CREATE TABLE classification_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Matching criteria
  merchant_pattern TEXT NOT NULL,
  
  -- Classification
  category TEXT NOT NULL,
  subcategory TEXT,
  default_chargeable BOOLEAN,
  default_procurement TEXT,
  
  -- Confidence tracking
  match_count INTEGER DEFAULT 1,
  correction_count INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.70,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, merchant_pattern)
);
```

### 10.3 Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `receipts` | Manual expense file uploads | Authenticated users |
| `receipt-scans` | AI scanner image uploads | Authenticated users |

### 10.4 Expense Files Integration

The `expense_files` table links receipts to expenses:

```sql
-- bucket column added to track storage location
ALTER TABLE expense_files 
ADD COLUMN bucket TEXT DEFAULT 'receipts';

-- Values: 'receipts' (manual) or 'receipt-scans' (scanner)
```

### 10.5 Scanning Workflow

```
1. User uploads receipt image(s)
   ↓
2. Image stored in receipt-scans bucket
   ↓
3. AI processes image (Claude Vision API)
   - Extract merchant, amount, date
   - Suggest category based on merchant
   ↓
4. Check classification_rules for learned patterns
   ↓
5. Create receipt_scans record
   ↓
6. User reviews/edits extracted data
   ↓
7. Create expense record
   ↓
8. Create expense_files record (links image)
   ↓
9. Update receipt_scans.expense_id
   ↓
10. If user corrected category → update classification_rules
```

### 10.6 RLS Policies

```sql
-- SELECT: Project members can view
CREATE POLICY "receipt_scans_select_policy" ON receipt_scans 
  FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = receipt_scans.project_id
    AND up.user_id = auth.uid()
  ));

-- INSERT: Non-viewers can create
CREATE POLICY "receipt_scans_insert_policy" ON receipt_scans 
  FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = receipt_scans.project_id
    AND up.user_id = auth.uid()
    AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
  ));
```

---

## 11. Session Completion

### 11.1 Checklist Status

- [x] timesheets table
- [x] expenses table
- [x] partners table
- [x] partner_invoices table
- [x] partner_invoice_lines table
- [x] receipt_scans table
- [x] classification_rules table
- [x] Relationships and foreign keys

### 11.2 Key Takeaways

1. **Workflow Consistency:** All operational tables use consistent Draft → Submitted → Approved/Rejected workflows
2. **Financial Accuracy:** Denormalization in invoice lines preserves historical accuracy
3. **Multi-Tenancy:** All tables project-scoped via RLS policies
4. **Audit Trail:** Soft delete + timestamps + user tracking on all operations
5. **Integration:** Tables tightly integrated with resources, milestones, and invoicing

### 11.3 Next Session Preview

**Session 1.4: Database Schema - Supporting Tables** will document:
- kpis table
- quality_standards table
- raid_items table
- variations table
- variation_milestones table
- document_templates table
- audit_log table
- deleted_items table

---

*Document generated as part of AMSF001 Documentation Project - Session 1.3*

---

## 12. Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 10 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 23 Dec 2025 | Claude AI | Added organisation context note (Tier 3 entities), added Document History section |
