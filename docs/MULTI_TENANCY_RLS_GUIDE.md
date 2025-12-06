# Multi-Tenancy RLS Implementation Guide

## Document Information
- **Version:** 2.0
- **Created:** 6 December 2025
- **Updated:** 6 December 2025
- **Purpose:** Comprehensive guide for implementing project-scoped Row Level Security (RLS) policies
- **Status:** ✅ COMPLETED

---

## Implementation Summary

### What Was Done
Complete migration from global role-based RLS (`profiles.role`) to project-scoped multi-tenancy RLS (`user_projects.role`) across all 28 database tables.

### Key Outcomes
- ✅ Fixed Supplier PM permission bug on deliverable KPIs/Quality Standards
- ✅ Proper multi-tenancy: Users only see/modify data for projects they belong to
- ✅ Project-scoped roles: Same user can have different roles on different projects
- ✅ Consistent naming: All policies follow `tablename_action_policy` pattern
- ✅ Reduced policy bloat: From 93 messy policies to ~102 clean, organized policies

### Migration Scripts Location
```
/sql/rls-migration/
├── phase-1-junction-tables.sql
├── phase-2-main-entities.sql
├── phase-3-additional-tables.sql
├── phase-4-verification.sql
├── emergency-fix-user-projects.sql
└── rollback-to-permissive.sql
```

---

## ⚠️ Critical Lesson Learned: Circular RLS Dependency

### The Problem
After initial migration, ALL pages showed "Loading..." with no data. Root cause was a circular dependency in `user_projects` SELECT policy:

```sql
-- BROKEN: Queries user_projects to check user_projects access
CREATE POLICY "user_projects_select_policy" 
ON public.user_projects FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_projects my_up  -- Triggers RLS on itself!
    WHERE my_up.project_id = user_projects.project_id
    AND my_up.user_id = auth.uid()
  )
);
```

Since ALL other policies check `user_projects` via subqueries, this blocked everything.

### The Fix
```sql
-- CORRECT: Simple direct check - no self-reference
CREATE POLICY "user_projects_select_policy" 
ON public.user_projects FOR SELECT TO authenticated 
USING (user_projects.user_id = auth.uid());
```

This works because all RLS subqueries only ask "Is current user a member?" - never "Who else is on this project?"

### Lesson
When implementing RLS on a "membership" table that other policies reference, the SELECT policy must NOT query itself. Use a simple direct condition instead.

---

## Frontend Bug Fixed

### QualityStandardDetail.jsx Permission Check
```javascript
// BEFORE (wrong - excluded supplier_pm!)
const canEdit = userRole === 'admin' || userRole === 'contributor' || userRole === 'customer_pm';

// AFTER (correct - uses permission matrix)
const { canEditQualityStandard } = usePermissions();
const canEdit = canEditQualityStandard;
```

---

## Verified Schema Information

### user_projects Table Structure
```
id          UUID PRIMARY KEY
user_id     UUID REFERENCES profiles(id)
project_id  UUID REFERENCES projects(id)
role        TEXT ('admin', 'supplier_pm', 'customer_pm', 'contributor', 'viewer')
is_default  BOOLEAN
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Role Values (lowercase, verified from database)
| Role | Description |
|------|-------------|
| `admin` | Full access to project |
| `supplier_pm` | Supplier project manager |
| `customer_pm` | Customer project manager |
| `contributor` | Can add timesheets/expenses, update deliverable progress |
| `viewer` | Read-only access |

### Tables with project_id Column
| Table | Key Columns for RLS |
|-------|---------------------|
| `projects` | `id` |
| `milestones` | `project_id` |
| `deliverables` | `project_id` |
| `resources` | `project_id`, `user_id` |
| `timesheets` | `project_id`, `resource_id`, `status`, `created_by` |
| `expenses` | `project_id`, `status`, `created_by` |
| `kpis` | `project_id` |
| `quality_standards` | `project_id` |
| `partners` | `project_id` |
| `raid_items` | `project_id`, `created_by` |
| `audit_log` | `project_id` |

### Junction Tables (no project_id - join through parent)
| Table | Columns | Parent Table |
|-------|---------|--------------|
| `deliverable_kpis` | `deliverable_id`, `kpi_id` | `deliverables` |
| `deliverable_quality_standards` | `deliverable_id`, `quality_standard_id` | `deliverables` |

---

## Permission Matrix

### Legend
- ✓ = Allowed
- ○ = Conditional (see notes)
- ✗ = Not allowed

### Main Entities

| Entity | Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|--------|-------|-------------|-------------|-------------|--------|
| **projects** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ (global) | ✗ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✗ | ✗ | ✗ | ✗ |
| | DELETE | ✓ (global) | ✗ | ✗ | ✗ | ✗ |
| **milestones** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✓ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **deliverables** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✓ | ○ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **resources** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **timesheets** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ○ own | ✗ |
| | UPDATE | ✓ | ✓ | ○ validate | ○ own | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ○ draft | ✗ |
| **expenses** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✓ | ✗ |
| | UPDATE | ✓ | ✓ | ○ validate | ○ own | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ○ draft | ✗ |
| **kpis** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **quality_standards** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **partners** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | UPDATE | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |
| **raid_items** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✓ | ✓ | ✗ |
| | UPDATE | ✓ | ✓ | ○ own | ○ own | ✗ |
| | DELETE | ✓ | ✗ | ✗ | ✗ | ✗ |

### Junction Tables

| Table | Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|-------|--------|-------|-------------|-------------|-------------|--------|
| **deliverable_kpis** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |
| **deliverable_quality_standards** | SELECT | ✓ | ✓ | ✓ | ✓ | ✓ |
| | INSERT | ✓ | ✓ | ✗ | ✗ | ✗ |
| | DELETE | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Notes

### Conditional Permissions Explained

**Contributor on deliverables UPDATE:**
- Can update progress and description fields only
- Cannot change status, milestone assignment, or name

**Contributor on timesheets:**
- INSERT: Only for their own linked resource
- UPDATE: Only their own, and only if status is Draft or Rejected
- DELETE: Only their own, and only if status is Draft

**Contributor on expenses:**
- INSERT: Can create expenses
- UPDATE: Only their own, and only if status is Draft or Rejected
- DELETE: Only their own, and only if status is Draft

**Customer PM on timesheets/expenses UPDATE:**
- Can validate (change status from Submitted to Approved/Rejected)

**RAID items:**
- Owner (created_by) can update their own items
- Only Admin can delete

### Global vs Project Roles

For `projects` INSERT and DELETE, we check `profiles.role = 'admin'` (global admin) because:
- Creating a new project requires global admin rights
- Deleting a project is a global admin action
- Project-level admin can update but not delete the project

---

## Testing Checklist (All Verified ✅)

- [x] Admin can perform all CRUD operations
- [x] Supplier PM can manage entities they're allowed to
- [x] Supplier PM can add/remove KPIs and Quality Standards on deliverables
- [x] Customer PM can validate timesheets/expenses
- [x] Customer PM can update milestone/deliverable status
- [x] Contributor can add own timesheets/expenses
- [x] Contributor can update own draft items
- [x] Contributor can update deliverable progress
- [x] Viewer can only read data
- [x] Users cannot see data from projects they're not members of

---

## Rollback Procedure

If issues arise, use the rollback script:
```
/sql/rls-migration/rollback-to-permissive.sql
```

This reverts all tables to permissive "authenticated can do anything" policies.

---

## Future Considerations

### Optional Frontend Enhancement
Current state: RLS uses `user_projects.role` (project-scoped), but frontend UI uses `profiles.role` (global). This works for single-project scenarios but for true multi-tenancy would need:

1. **ProjectContext** - Fetch user's project role from `user_projects`
2. **usePermissions** - Use project role instead of global role

Not required for current functionality since user's `profiles.role` matches their `user_projects.role`.
