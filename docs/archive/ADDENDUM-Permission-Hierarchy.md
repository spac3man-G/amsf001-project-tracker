# Documentation Addendum: Permission Hierarchy Implementation

**Created:** 24 December 2025  
**Status:** Complete  
**Purpose:** Document the org admin permission hierarchy fix implemented 24 Dec 2025

---

## Overview

This addendum documents the implementation of proper permission hierarchy for organisation admins, fixing the issue where org admins saw a viewer-level sidebar and couldn't access admin features without explicit project assignment.

---

## Problem Statement

**Before (Broken):**
- Org admin logs in → sees viewer sidebar
- Cannot create projects (chicken-and-egg problem)
- Cannot access Settings, Resources, Team Members, Partners
- Frontend `effectiveRole` was `'viewer'` because no project assignment existed

**After (Fixed):**
- Org admin logs in → sees full admin sidebar
- Can create projects immediately
- Can access all admin features within their organisation
- Frontend `effectiveRole` is `'admin'` for org admins

---

## Permission Hierarchy (Final)

```
System Admin (profiles.role = 'admin')
    ├── Can access ALL organisations and projects
    ├── Has 'admin' project permissions everywhere
    └── Can see System Users and System Admin pages

Org Admin (user_organisations.org_role = 'org_admin')
    ├── Can access ALL projects in their organisation
    ├── Has 'admin' project permissions within their org
    ├── Can manage org members and settings
    ├── Can create/delete projects
    └── CANNOT see System Users or System Admin pages

Org Member (user_organisations.org_role = 'org_member')
    ├── Can access ONLY projects they're assigned to
    └── Has project role from user_projects table
```

---

## Implementation Details

### Phase 1: Frontend Permission Hooks

#### ViewAsContext.jsx (v3.0)

**Key Change:** `actualRole` now respects the org hierarchy:

```javascript
const actualRole = useMemo(() => {
  // System admin has admin permissions everywhere
  if (isSystemAdmin) {
    return ROLES.ADMIN;
  }
  
  // Org admin has admin permissions within their organisation
  if (isOrgAdmin) {
    return ROLES.ADMIN;
  }
  
  // Use project-scoped role if available
  if (projectRole) {
    return projectRole;
  }
  
  // Default to viewer
  return ROLES.VIEWER;
}, [isSystemAdmin, isOrgAdmin, projectRole, globalRole]);
```

**New Exports:**
- `isSystemAdmin` - True if user is system admin
- `isOrgAdmin` - True if user is org admin for current org

#### usePermissions.js (v5.0)

**New Exports:**
- `isSystemAdmin` - From ViewAsContext
- `isOrgAdmin` - From ViewAsContext  
- `isOrgLevelAdmin` - Computed: `isSystemAdmin || isOrgAdmin`

**Usage:**
```javascript
const { isOrgLevelAdmin, canAccessSettings } = usePermissions();

// Show admin UI for org-level admins
{isOrgLevelAdmin && <AdminPanel />}
```

### Phase 2: Navigation/Sidebar

#### navigation.js (v3.0)

**New Function:** `getNavigationForUser()`

```javascript
export function getNavigationForUser({ 
  isSystemAdmin = false, 
  isOrgAdmin = false, 
  effectiveRole = null 
}) {
  const role = effectiveRole || ROLES.VIEWER;
  let navItems = getNavigationForRole(role);
  
  // System-level items only for system admins
  if (!isSystemAdmin) {
    navItems = navItems.filter(item => 
      item.id !== 'systemUsers' && item.id !== 'systemAdmin'
    );
  }
  
  return navItems;
}
```

#### Layout.jsx (v13.0)

**Change:** Uses `getNavigationForUser()` instead of `getNavigationForRole()`

```javascript
const navItems = useMemo(() => {
  return getNavigationForUser({ 
    isSystemAdmin, 
    isOrgAdmin, 
    effectiveRole 
  });
}, [effectiveRole, isSystemAdmin, isOrgAdmin]);
```

### Phase 3: Database RLS Policies

**Migration:** `202512241500_fix_rls_policies_use_can_access_project.sql`

**Before:**
- 28 SELECT policies used direct `user_projects` checks
- 2 policies used `can_access_project()` helper

**After:**
- 1 SELECT policy uses direct check (profiles - correct for user-based)
- 33 policies use `can_access_project()` helper

**Tables Updated:**
| Category | Tables |
|----------|--------|
| Core | timesheets, expenses, resources, milestones, deliverables |
| Financial | partners, partner_invoices |
| Project Management | kpis, quality_standards, raid_items, variations |
| Variation Links | variation_milestones, variation_deliverables |
| Deliverable Links | deliverable_kpi_assessments, deliverable_qs_assessments, deliverable_kpis, deliverable_quality_standards |
| Milestone Links | milestone_baseline_versions, milestone_certificates |
| Documents | document_templates |
| Expenses | receipt_scans, classification_rules |
| Reporting | report_templates, report_generations, audit_log |
| Other | network_standards, quality_checks, resource_availability |

---

## Key Functions

### can_access_project(project_id)

Database helper that checks:
1. Is user a system admin? → Allow
2. Is user an org admin for the project's organisation? → Allow
3. Is user in user_projects for this project? → Allow
4. Otherwise → Deny

```sql
CREATE OR REPLACE FUNCTION can_access_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- System admin can access all
  IF is_system_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Check org admin status
  IF EXISTS (
    SELECT 1 FROM projects p
    JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
    WHERE p.id = p_project_id
    AND uo.user_id = auth.uid()
    AND uo.org_role = 'org_admin'
    AND uo.is_active = TRUE
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check project membership
  RETURN EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = p_project_id
    AND up.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Files Modified

| File | Version | Changes |
|------|---------|---------|
| `src/contexts/ViewAsContext.jsx` | 3.0 | Added org hierarchy to actualRole |
| `src/hooks/usePermissions.js` | 5.0 | Export isSystemAdmin, isOrgAdmin, isOrgLevelAdmin |
| `src/lib/navigation.js` | 3.0 | Added getNavigationForUser() |
| `src/components/Layout.jsx` | 13.0 | Use getNavigationForUser() |

## Migrations Applied

| Migration | Description |
|-----------|-------------|
| `202512241500_fix_rls_policies_use_can_access_project.sql` | Update 27 SELECT policies |
| `202512241502_fix_remaining_rls_policies.sql` | Update 8 more SELECT policies |

---

## Testing Verification

### Frontend Test
1. Log in as org admin (no project assignment)
2. Verify full admin sidebar visible
3. Navigate to Settings, Resources, Team Members
4. Verify data loads correctly

### Database Test
```sql
-- Should return: needs_update=1, uses_helper=33
SELECT 
  COUNT(*) FILTER (WHERE qual::text LIKE '%user_projects%' 
    AND qual::text NOT LIKE '%can_access_project%') as needs_update,
  COUNT(*) FILTER (WHERE qual::text LIKE '%can_access_project%') as uses_helper
FROM pg_policies 
WHERE schemaname = 'public' AND cmd = 'SELECT';
```

### Cross-Org Isolation Test
1. Log in as Carey Olsen org admin
2. Verify cannot see JT organisation data
3. Verify only Carey Olsen projects visible

---

## Documentation Updates Required

### TECH-SPEC-02-Database-Core.md
- [ ] Update organisation roles from 3 to 2 (org_admin, org_member)
- [ ] Remove org_owner references
- [ ] Update Section 3.3 Organisation Role Values

### TECH-SPEC-05-RLS-Security.md
- [ ] Update Section 2.4 Access Hierarchy
- [ ] Update policy examples to show can_access_project()
- [ ] Remove is_org_owner() references
- [ ] Add note about 33 policies using helper

### TECH-SPEC-07-Frontend-State.md
- [ ] Update Section 6: ViewAsContext (v3.0 changes)
- [ ] Update Section 9: Permission System
- [ ] Add isOrgLevelAdmin to usePermissions documentation
- [ ] Update Role Resolution Flow diagram

---

## Git Commits

| Commit | Message |
|--------|---------|
| `59a21344` | feat: implement org admin permission hierarchy |
| `a4a347fa` | fix(rls): update remaining 8 policies to use can_access_project() |

---

## Related Documents

- `docs/ADDENDUM-December-2025.md` - December 2025 changes overview
- `docs/ADDENDUM-Role-Simplification.md` - Role simplification (3→2)
- `docs/IMPLEMENTATION-PLAN-Permission-Hierarchy-Fix.md` - Original implementation plan
