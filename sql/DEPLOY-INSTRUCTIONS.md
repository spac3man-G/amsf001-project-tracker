# Database Migration Deployment Instructions

## Overview
Two migrations ready to deploy to production:

1. **Soft Delete Implementation** - Adds recoverable deletion
2. **Audit Triggers** - Automatic change logging

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

## Pending Migration: P8 - Deliverables Contributor Access

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
