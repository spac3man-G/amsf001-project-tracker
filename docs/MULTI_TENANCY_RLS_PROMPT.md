# Multi-Tenancy RLS Implementation Prompt

## Status: ✅ COMPLETED (6 December 2025)

This migration has been completed. See `MULTI_TENANCY_RLS_GUIDE.md` for full documentation including:
- What was implemented
- Critical circular dependency fix
- Lessons learned
- Rollback procedures

---

## Original Context

You are implementing Row Level Security (RLS) policies for a Supabase/PostgreSQL database. The application is a project management system with supplier-customer collaboration.

**Key Architecture:**
- `user_projects` table maps users to projects with per-project roles
- All data tables have a `project_id` column
- Junction tables (`deliverable_kpis`, `deliverable_quality_standards`) get project_id through their parent `deliverables` table
- Role values are lowercase: `admin`, `supplier_pm`, `customer_pm`, `contributor`, `viewer`

**Issue That Was Fixed:**
RLS policies were checking `profiles.role` (global) instead of `user_projects.role` (project-scoped). This caused INSERT/DELETE failures on junction tables for Supplier PM users.

---

## Migration Scripts

All scripts are located in `/sql/rls-migration/`:

| Script | Purpose |
|--------|---------|
| `phase-1-junction-tables.sql` | Junction table policies |
| `phase-2-main-entities.sql` | Core business tables |
| `phase-3-additional-tables.sql` | System and reference tables |
| `phase-4-verification.sql` | Audit queries |
| `emergency-fix-user-projects.sql` | Circular dependency fix |
| `rollback-to-permissive.sql` | Emergency rollback |

---

## ⚠️ Critical Warning: Circular RLS Dependency

If you ever need to modify `user_projects` RLS policies, **DO NOT** create a SELECT policy that queries `user_projects` itself:

```sql
-- ❌ WRONG - Creates circular dependency that blocks ALL data access
CREATE POLICY "user_projects_select_policy" 
ON public.user_projects FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects my_up  -- Self-reference!
    WHERE my_up.project_id = user_projects.project_id
    AND my_up.user_id = auth.uid()
  )
);

-- ✅ CORRECT - Simple direct check
CREATE POLICY "user_projects_select_policy" 
ON public.user_projects FOR SELECT TO authenticated 
USING (user_projects.user_id = auth.uid());
```

---

## Verification Query

To check current RLS policy status:

```sql
SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```
