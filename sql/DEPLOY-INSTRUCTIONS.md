# Database Migration Deployment Instructions

## Overview
Migrations ready to deploy to production:

1. **Soft Delete Implementation** - Adds recoverable deletion
2. **Audit Triggers** - Automatic change logging
3. **P8 - Deliverables Contributor Access** - RLS policy updates
4. **P15 - Invoice Type Column** - Support for different invoice types

## Deployment Order

**IMPORTANT: Run in this order!**

### Step 1: Soft Delete (run first)
File: `soft-delete-implementation.sql`

This adds:
- `is_deleted`, `deleted_at`, `deleted_by` columns to all main tables
- Partial indexes for efficient querying
- Helper functions (`soft_delete`, `restore_deleted`, `purge_deleted_records`)
- Views for active records (`active_timesheets`, `active_expenses`, etc.)
- Admin view for deleted items summary

### Step 2: Audit Triggers (run second)
File: `audit-triggers.sql`

This adds:
- `audit_log` table for change tracking
- Triggers on all 9 main tables
- Automatic logging of INSERT, UPDATE, DELETE, SOFT_DELETE, RESTORE
- Helper views (`recent_audit_activity`, `audit_summary_by_user`, `audit_summary_by_table`)
- RLS policies (Admin and Supplier PM can view)

## How to Deploy

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Paste the contents of `soft-delete-implementation.sql`
4. Click "Run"
5. Check the verification output shows all columns added
6. Create another new query
7. Paste the contents of `audit-triggers.sql`
8. Click "Run"
9. Check the verification output shows all triggers created

## Verification

After running both scripts, you should see:
- All tables have `is_deleted`, `deleted_at`, `deleted_by` columns
- All 9 audit triggers are active
- Views are accessible

Test by:
1. Update any record in the app
2. Query: `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 5;`
3. You should see the change logged

## Rollback

If needed, rollback with:
```sql
-- Remove audit triggers
DROP TRIGGER IF EXISTS audit_timesheets ON timesheets;
DROP TRIGGER IF EXISTS audit_expenses ON expenses;
-- ... etc for all tables

-- Remove soft delete columns (CAREFUL - loses delete history)
ALTER TABLE timesheets DROP COLUMN IF EXISTS is_deleted, DROP COLUMN IF EXISTS deleted_at, DROP COLUMN IF EXISTS deleted_by;
-- ... etc for all tables
```

## Notes

- Soft delete is already integrated in the service layer
- Existing data will have `is_deleted = NULL` which is treated as FALSE
- Audit logging starts from deployment - no historical data

---

## Migration: P8 - Deliverables Contributor Access

### Step 3: Contributor Edit Access
File: `P8-deliverables-contributor-access.sql`

This adds:
- Updated RLS policies for `deliverables` table
- Contributors can now edit deliverables (SELECT, INSERT, UPDATE)
- Delete remains restricted to Admin and Supplier PM

### How to Deploy P8

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Paste the contents of `P8-deliverables-contributor-access.sql`
4. Click "Run"
5. Verify the output shows policies created

### Verification for P8

Query to check policies:
```sql
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'deliverables';
```

Expected output should show:
- `deliverables_select` (SELECT)
- `deliverables_insert` (INSERT)
- `deliverables_update` (UPDATE) - Now includes contributor role
- `deliverables_delete` (DELETE)

---

## Migration: P15 - Invoice Type Column ✅ DEPLOYED

**Status:** Deployed to production on 9 December 2025

### Purpose
File: `P15-invoice-type-column.sql`

This adds support for different invoice types in partner invoicing:
- **combined** - Both timesheets and expenses (default)
- **timesheets** - Work hours and day rates only
- **expenses** - Partner-procured expenses only

### What It Adds
- `invoice_type` column on `partner_invoices` table
- CHECK constraint ensuring valid values: `combined`, `timesheets`, `expenses`
- Default value of `'combined'` for backward compatibility

### Related Code
- `src/services/invoicing.service.js` - Uses `invoiceType` parameter in `generateInvoice()`
- `src/components/partners/DateRangeFilter.jsx` - UI dropdown for selecting invoice type
- `src/pages/PartnerDetail.jsx` - Passes invoice type to service

### How to Deploy P15 (if not already deployed)

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Paste the contents of `P15-invoice-type-column.sql`
4. Click "Run"
5. Verify the output shows the column created

### Verification for P15

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'partner_invoices' AND column_name = 'invoice_type';
```

Expected output:
| column_name  | data_type | column_default    |
|--------------|-----------|-------------------|
| invoice_type | text      | 'combined'::text  |

### Rollback P15

```sql
ALTER TABLE partner_invoices DROP COLUMN IF EXISTS invoice_type;
```

---

## Migration Summary Table

| Migration | File | Status | Date |
|-----------|------|--------|------|
| Soft Delete | `soft-delete-implementation.sql` | ✅ Deployed | Nov 2025 |
| Audit Triggers | `audit-triggers.sql` | ✅ Deployed | Nov 2025 |
| P8 Deliverables RLS | `P8-deliverables-contributor-access.sql` | ✅ Deployed | Dec 2025 |
| P15 Invoice Type | `P15-invoice-type-column.sql` | ✅ Deployed | 9 Dec 2025 |
| P16 Document Templates | `P16-document-templates.sql` | ⏳ Pending | - |

---

## P16: Document Templates System

### Purpose
Template-driven document generation system for creating formal Change Request documents from Variation data. Supports multiple output formats (HTML, DOCX, PDF) with project-scoped templates that can be imported/exported.

### What It Adds
- **New table**: `document_templates` - Stores template definitions as JSONB
- **New variation columns**: 
  - `priority` (H/M/L)
  - `date_required` (DATE)
  - `benefits` (TEXT)
  - `assumptions` (TEXT)
  - `risks` (TEXT)
  - `cost_summary` (TEXT)
  - `impact_on_charges` (TEXT)
  - `impact_on_service_levels` (TEXT)
  - `implementation_timetable` (TEXT)
- **New project column**: `contract_reference` (TEXT)
- RLS policies for template access control

### Related Documentation
- `docs/DOCUMENT-TEMPLATES-SPECIFICATION.md` - Full technical specification

### How to Deploy P16

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Paste the contents of `P16-document-templates.sql`
4. Click "Run"
5. Verify the output

### Verification for P16

```sql
-- Check document_templates table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'document_templates' 
ORDER BY ordinal_position;

-- Check new variation columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'variations' 
AND column_name IN ('priority', 'date_required', 'benefits', 'assumptions', 'risks');

-- Check new project column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'contract_reference';
```

### Rollback P16

```sql
DROP TABLE IF EXISTS document_templates CASCADE;

ALTER TABLE variations DROP COLUMN IF EXISTS priority;
ALTER TABLE variations DROP COLUMN IF EXISTS date_required;
ALTER TABLE variations DROP COLUMN IF EXISTS benefits;
ALTER TABLE variations DROP COLUMN IF EXISTS assumptions;
ALTER TABLE variations DROP COLUMN IF EXISTS risks;
ALTER TABLE variations DROP COLUMN IF EXISTS cost_summary;
ALTER TABLE variations DROP COLUMN IF EXISTS impact_on_charges;
ALTER TABLE variations DROP COLUMN IF EXISTS impact_on_service_levels;
ALTER TABLE variations DROP COLUMN IF EXISTS implementation_timetable;

ALTER TABLE projects DROP COLUMN IF EXISTS contract_reference;

NOTIFY pgrst, 'reload schema';
```
