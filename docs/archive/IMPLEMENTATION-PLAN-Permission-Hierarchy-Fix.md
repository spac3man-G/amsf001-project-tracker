# Implementation Plan: Permission Hierarchy Fix

**Document Version:** 1.0  
**Created:** 24 December 2025  
**Purpose:** Step-by-step implementation plan to fix org admin permission inheritance  
**Estimated Total Effort:** 2-3 weeks  

---

## Executive Summary

This plan fixes the permission hierarchy so that:
1. **System Admins** have full access everywhere
2. **Org Admins** have admin-level project permissions within their organisation
3. **Org Members** only access projects they're explicitly assigned to

The fix requires changes to:
- Frontend permission hooks (Phase 1)
- Navigation/sidebar visibility (Phase 2)
- Database RLS policies (Phase 3)
- Documentation updates (Phase 4)
- Security testing and verification (Phase 5)

---

## How to Use This Plan

Each phase is designed to be completed in a **single Claude chat session** to avoid context/memory issues. 

**For each step:**
1. Start a fresh Claude chat
2. Copy the step's "Context to Provide" section
3. Follow the checklist
4. Verify with the provided test cases
5. Commit changes before moving to the next step

---

## Pre-Implementation Setup

### Before Starting Any Phase

```bash
# Create a new branch for this work
git checkout -b fix/permission-hierarchy

# Ensure you have the latest code
git pull origin main
```

### Key Files Reference

| File | Purpose |
|------|---------|
| `src/hooks/usePermissions.js` | Main permission hook |
| `src/contexts/ViewAsContext.jsx` | Role resolution |
| `src/contexts/OrganisationContext.jsx` | Org admin flags |
| `src/lib/navigation.js` | Sidebar item visibility |
| `src/lib/permissionMatrix.js` | Permission definitions |
| `supabase/migrations/` | RLS policy migrations |

---

# Phase 1: Frontend Permission Hooks

**Goal:** Make `usePermissions` respect org admin and system admin hierarchy  
**Estimated Time:** 2-3 hours  
**Files to Modify:** 3

---

## Step 1.1: Update ViewAsContext to Include Org Role Check

### Context to Provide to Claude

```
I need to update src/contexts/ViewAsContext.jsx to:
1. Import useOrganisation from OrganisationContext
2. Add isSystemAdmin and isOrgAdmin to the context
3. Modify actualRole computation to consider org admin status

Current problem: ViewAsContext only looks at projectRole and globalRole.
It should also check if user is system admin or org admin.

Key requirement:
- If isSystemAdmin → actualRole should be 'admin'
- If isOrgAdmin (for current org) → actualRole should be 'admin'  
- Otherwise → use projectRole || globalRole

Here's the current ViewAsContext.jsx:
[paste contents of src/contexts/ViewAsContext.jsx]

Here's OrganisationContext.jsx for reference (shows isOrgAdmin, isSystemAdmin are available):
[paste contents of src/contexts/OrganisationContext.jsx]
```

### Checklist

- [ ] Import `useOrganisation` from `../contexts/OrganisationContext`
- [ ] Get `isSystemAdmin`, `isOrgAdmin` from `useOrganisation()`
- [ ] Update `actualRole` computation:
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
    
    // Otherwise use project role or global role
    if (projectRole) {
      return projectRole;
    }
    return globalRole || 'viewer';
  }, [isSystemAdmin, isOrgAdmin, projectRole, globalRole]);
  ```
- [ ] Add `isSystemAdmin` and `isOrgAdmin` to the exported context value
- [ ] Update `debugInfo` to include new fields
- [ ] Handle case where OrganisationContext might not be available (wrap in try/catch)

### Verification

```javascript
// In browser console, after logging in as an org admin:
// Should show actualRole: 'admin' even if no project role assigned

// Test cases:
// 1. System admin user → actualRole should be 'admin'
// 2. Org admin user (no project role) → actualRole should be 'admin'
// 3. Org member with project role → actualRole should be their project role
// 4. Org member without project role → actualRole should be 'viewer'
```

### Commit Message
```
fix(auth): ViewAsContext respects org admin hierarchy

- System admins now get admin role everywhere
- Org admins get admin role within their organisation
- Falls back to project role for org members
```

---

## Step 1.2: Update usePermissions Hook

### Context to Provide to Claude

```
I need to update src/hooks/usePermissions.js to expose org-level permission info.

The hook already uses ViewAsContext which now provides correct actualRole.
But we should also expose isSystemAdmin and isOrgAdmin for components that need it.

Here's the current usePermissions.js:
[paste contents of src/hooks/usePermissions.js]

Requirements:
1. Import useOrganisation to get isSystemAdmin, isOrgAdmin
2. Add these to the returned permissions object
3. Add helper function: isOrgLevelAdmin = isSystemAdmin || isOrgAdmin
4. Keep backward compatibility - don't break existing permission checks
```

### Checklist

- [ ] Import `useOrganisation` from `../contexts/OrganisationContext`
- [ ] Get `isSystemAdmin`, `isOrgAdmin`, `organisationId` from `useOrganisation()`
- [ ] Add to returned permissions object:
  ```javascript
  // Organisation-level admin checks
  isSystemAdmin,
  isOrgAdmin,
  isOrgLevelAdmin: isSystemAdmin || isOrgAdmin,
  currentOrganisationId: organisationId,
  ```
- [ ] Handle case where OrganisationContext might not be available
- [ ] Update JSDoc comments to document new exports

### Verification

```javascript
// Test in a component:
const { isSystemAdmin, isOrgAdmin, isOrgLevelAdmin } = usePermissions();
console.log({ isSystemAdmin, isOrgAdmin, isOrgLevelAdmin });

// Org admin should see: { isSystemAdmin: false, isOrgAdmin: true, isOrgLevelAdmin: true }
```

### Commit Message
```
feat(permissions): expose org-level admin flags in usePermissions

- Added isSystemAdmin, isOrgAdmin, isOrgLevelAdmin
- Components can now check org-level permissions directly
```

---

## Step 1.3: Create Unit Tests for Permission Hierarchy

### Context to Provide to Claude

```
I need to create/update unit tests to verify the permission hierarchy works correctly.

The hierarchy should be:
1. System Admin → has 'admin' role everywhere, all permissions
2. Org Admin → has 'admin' role within their org, all project permissions
3. Org Member + Project Role → has their assigned project role
4. Org Member + No Project Role → has 'viewer' (read-only)

Test file location: src/__tests__/unit/permission-hierarchy.test.js

Here's the current test setup:
[paste contents of src/__tests__/setup/vitest.setup.js if exists]

Requirements:
1. Test that system admin gets admin permissions
2. Test that org admin gets admin permissions
3. Test that org member with project role gets that role
4. Test that org member without project role gets viewer
5. Test that permission functions respect the effective role
```

### Checklist

- [ ] Create `src/__tests__/unit/permission-hierarchy.test.js`
- [ ] Test system admin scenario
- [ ] Test org admin scenario  
- [ ] Test org member with project role scenario
- [ ] Test org member without project role scenario
- [ ] Test that `isOrgLevelAdmin` returns correct value
- [ ] Run tests: `npm run test:run`

### Test Template

```javascript
// src/__tests__/unit/permission-hierarchy.test.js
import { describe, it, expect, vi } from 'vitest';

describe('Permission Hierarchy', () => {
  describe('Role Resolution', () => {
    it('system admin should have admin role regardless of project assignment', () => {
      // Mock: isSystemAdmin = true, projectRole = null
      // Expected: actualRole = 'admin'
    });

    it('org admin should have admin role within their organisation', () => {
      // Mock: isOrgAdmin = true, projectRole = null
      // Expected: actualRole = 'admin'
    });

    it('org member with project role should use project role', () => {
      // Mock: isOrgAdmin = false, projectRole = 'contributor'
      // Expected: actualRole = 'contributor'
    });

    it('org member without project role should be viewer', () => {
      // Mock: isOrgAdmin = false, projectRole = null
      // Expected: actualRole = 'viewer'
    });
  });

  describe('isOrgLevelAdmin', () => {
    it('should be true for system admin', () => {});
    it('should be true for org admin', () => {});
    it('should be false for org member', () => {});
  });
});
```

### Commit Message
```
test(permissions): add permission hierarchy unit tests

- Tests for system admin, org admin, org member scenarios
- Verifies role resolution chain works correctly
```

---

# Phase 2: Navigation and Sidebar

**Goal:** Show admin navigation items to org admins  
**Estimated Time:** 1-2 hours  
**Files to Modify:** 2

---

## Step 2.1: Update Navigation Configuration

### Context to Provide to Claude

```
I need to update src/lib/navigation.js to support org-level admin access.

Current problem: Navigation items are filtered by project role only.
Org admins should see admin navigation items even without a project role.

Here's the current navigation.js:
[paste contents of src/lib/navigation.js]

Requirements:
1. Add a new function: getNavigationForOrgAdmin(isOrgLevelAdmin, projectRole)
2. This function should:
   - If isOrgLevelAdmin is true, return admin-level navigation
   - Otherwise, return navigation based on projectRole
3. Keep existing getNavigationForRole for backward compatibility
4. Update allowedRoles checks to also accept an 'org_admin_override' flag
```

### Checklist

- [ ] Add new function `getNavigationForUser(options)`:
  ```javascript
  /**
   * Get navigation items considering org-level admin status
   * @param {Object} options
   * @param {boolean} options.isSystemAdmin - Is user a system admin
   * @param {boolean} options.isOrgAdmin - Is user an org admin
   * @param {string} options.projectRole - User's role in current project
   * @returns {array} Navigation items
   */
  export function getNavigationForUser({ isSystemAdmin, isOrgAdmin, projectRole }) {
    // System admin and org admin get admin navigation
    if (isSystemAdmin || isOrgAdmin) {
      return getNavigationForRole(ROLES.ADMIN);
    }
    
    // Otherwise use project role
    return getNavigationForRole(projectRole || ROLES.VIEWER);
  }
  ```
- [ ] Export the new function
- [ ] Add JSDoc documentation
- [ ] Keep `getNavigationForRole` unchanged for backward compatibility

### Verification

```javascript
// Test:
import { getNavigationForUser } from '../lib/navigation';

// Org admin should get admin nav
const nav = getNavigationForUser({ 
  isSystemAdmin: false, 
  isOrgAdmin: true, 
  projectRole: null 
});
console.log(nav.map(n => n.id)); // Should include 'settings', 'resources', etc.
```

### Commit Message
```
feat(nav): add getNavigationForUser supporting org admin

- New function considers org-level admin status
- Org admins see full admin navigation
```

---

## Step 2.2: Update Layout/Sidebar to Use New Navigation Function

### Context to Provide to Claude

```
I need to update the Layout component (or wherever sidebar is rendered) to use 
the new getNavigationForUser function instead of getNavigationForRole.

First, I need to find where the sidebar gets its navigation items.
Look for imports of getNavigationForRole or uses of usePermissions/useViewAs 
to determine what nav items to show.

Requirements:
1. Import useOrganisation or use usePermissions (which now has isOrgAdmin)
2. Replace getNavigationForRole(role) with getNavigationForUser({ isSystemAdmin, isOrgAdmin, projectRole })
3. Ensure org admins see admin-level sidebar

Please first show me where the sidebar navigation is determined, then I'll 
provide the file for you to update.
```

### Sub-step: Find Sidebar Component

```bash
# Search for where navigation is used
grep -r "getNavigationForRole" src/
grep -r "useViewAs" src/components/
grep -r "Sidebar" src/
```

### Checklist

- [ ] Identify the component that renders the sidebar (likely `src/components/layout/Layout.jsx` or similar)
- [ ] Import `usePermissions` hook (now has isSystemAdmin, isOrgAdmin)
- [ ] Replace navigation generation:
  ```javascript
  // Before:
  const navItems = getNavigationForRole(effectiveRole);
  
  // After:
  const { isSystemAdmin, isOrgAdmin, userRole } = usePermissions();
  const navItems = getNavigationForUser({ 
    isSystemAdmin, 
    isOrgAdmin, 
    projectRole: userRole 
  });
  ```
- [ ] Test that org admin sees full sidebar

### Verification

1. Log in as org admin (e.g., your Carey Olsen account)
2. Navigate to dashboard
3. Verify sidebar shows: Settings, Resources, Team Members, Partners, etc.
4. Log in as org member with contributor role
5. Verify sidebar shows contributor-appropriate items only

### Commit Message
```
fix(sidebar): show admin items to org admins

- Sidebar now uses getNavigationForUser
- Org admins see full admin navigation
```

---

# Phase 3: Database RLS Policies

**Goal:** Ensure RLS policies use `can_access_project()` consistently  
**Estimated Time:** 4-6 hours  
**Files to Modify:** Multiple migration files

---

## Step 3.1: Audit Existing RLS Policies

### Context to Provide to Claude

```
I need to audit all RLS policies to find ones that check user_projects directly 
instead of using the can_access_project() helper function.

The can_access_project() function already correctly handles:
- System admin access
- Org admin access
- Org member with project membership

But many policies bypass this and check user_projects directly, which 
doesn't respect org admin access.

Please help me:
1. List all tables that have RLS enabled
2. For each table, show the current policy
3. Identify which policies need to be updated to use can_access_project()

I'll run these queries against my Supabase database and provide the results.
```

### SQL Queries to Run

```sql
-- 1. List all tables with RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- 2. List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Find policies that reference user_projects but not can_access_project
SELECT tablename, policyname, qual
FROM pg_policies 
WHERE schemaname = 'public'
AND (qual LIKE '%user_projects%' AND qual NOT LIKE '%can_access_project%')
ORDER BY tablename;
```

### Checklist

- [ ] Run audit queries
- [ ] Document tables that need policy updates
- [ ] Create list of policies to modify
- [ ] Prioritize based on security impact

### Expected Tables Needing Updates

Based on documentation review, these tables likely need updates:
- `timesheets`
- `expenses`
- `resources`
- `partners`
- `partner_invoices`
- `partner_invoice_lines`
- `receipt_scans`
- `classification_rules`
- `kpis`
- `quality_standards`
- `raid_items`
- `variations`
- `variation_milestones`
- `variation_deliverables`
- `milestone_baseline_versions`
- `document_templates`
- `milestones`
- `deliverables`
- `deliverable_kpi_links`
- `deliverable_qs_links`
- `deliverable_kpi_assessments`
- `deliverable_qs_assessments`
- `acceptance_certificates`

### Commit Message
```
docs: audit RLS policies for can_access_project usage

- Documented policies needing updates
- Created migration plan
```

---

## Step 3.2: Create RLS Policy Migration - Core Tables

### Context to Provide to Claude

```
I need to create a migration to update RLS policies for core operational tables 
to use can_access_project() instead of direct user_projects checks.

Tables to update in this migration:
- timesheets
- expenses  
- resources
- milestones
- deliverables

Current pattern (wrong):
EXISTS (
  SELECT 1 FROM user_projects up
  WHERE up.project_id = timesheets.project_id
  AND up.user_id = auth.uid()
)

New pattern (correct):
can_access_project(timesheets.project_id)

Here's the existing can_access_project function for reference:
[paste contents of 202512221403_create_rls_helper_functions.sql]

Requirements:
1. Drop existing SELECT policies
2. Create new SELECT policies using can_access_project()
3. Keep INSERT/UPDATE/DELETE policies that need role-specific checks
4. Ensure policies are idempotent (can run multiple times safely)
```

### Migration File Template

```sql
-- ============================================================
-- Migration: Update Core Table RLS to Use can_access_project
-- Date: [DATE]
-- Purpose: Fix org admin access to operational tables
-- ============================================================

-- ============================================
-- TIMESHEETS
-- ============================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view timesheets for their projects" ON timesheets;
DROP POLICY IF EXISTS "timesheets_select_policy" ON timesheets;

-- Create new SELECT policy using can_access_project
CREATE POLICY "timesheets_select_policy" ON timesheets
  FOR SELECT
  TO authenticated
  USING (can_access_project(project_id));

-- Note: Keep INSERT/UPDATE/DELETE policies that have role-specific logic
-- Only update them if they also need org admin bypass

-- [Similar for other tables...]
```

### Checklist

- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMI_fix_core_table_rls_policies.sql`
- [ ] Update timesheets policies
- [ ] Update expenses policies
- [ ] Update resources policies
- [ ] Update milestones policies
- [ ] Update deliverables policies
- [ ] Test migration locally: `supabase db reset`
- [ ] Verify org admin can access data

### Verification Queries

```sql
-- Test as org admin (set auth context first)
-- Should return data from projects in their org

-- Test timesheets access
SELECT COUNT(*) FROM timesheets;

-- Test expenses access  
SELECT COUNT(*) FROM expenses;

-- Test resources access
SELECT COUNT(*) FROM resources;
```

### Commit Message
```
fix(rls): update core table policies to use can_access_project

- timesheets, expenses, resources now respect org admin
- milestones, deliverables updated
- System admin and org admin can now access all org data
```

---

## Step 3.3: Create RLS Policy Migration - Supporting Tables

### Context to Provide to Claude

```
I need to create a migration to update RLS policies for supporting tables.

Tables to update:
- partners
- partner_invoices
- partner_invoice_lines
- kpis
- quality_standards
- raid_items
- variations
- variation_milestones
- variation_deliverables
- milestone_baseline_versions
- document_templates
- acceptance_certificates
- deliverable_kpi_links
- deliverable_qs_links
- deliverable_kpi_assessments
- deliverable_qs_assessments

Same pattern: Replace user_projects checks with can_access_project()

Please generate the migration SQL.
```

### Checklist

- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMI_fix_supporting_table_rls_policies.sql`
- [ ] Update each table's SELECT policy
- [ ] Handle tables that join to projects indirectly (e.g., via milestone_id)
- [ ] Test migration
- [ ] Verify all tables accessible to org admin

### Tables with Indirect Project Reference

Some tables don't have `project_id` directly. For these, use a join or subquery:

```sql
-- Example: deliverable_kpi_assessments (has deliverable_id, not project_id)
CREATE POLICY "dka_select_policy" ON deliverable_kpi_assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliverables d
      WHERE d.id = deliverable_kpi_assessments.deliverable_id
      AND can_access_project(d.project_id)
    )
  );
```

### Commit Message
```
fix(rls): update supporting table policies for org admin access

- Partners, KPIs, QS, RAID, variations updated
- All tables now respect permission hierarchy
```

---

## Step 3.4: Create RLS Policy Migration - Receipt Scans & Classification

### Context to Provide to Claude

```
I need to update RLS policies for receipt scanner related tables:
- receipt_scans
- classification_rules

These may have different access patterns. Check existing policies first.
```

### Checklist

- [ ] Review existing policies for these tables
- [ ] Create migration if needed
- [ ] Ensure org admin can manage receipt scans
- [ ] Test

---

# Phase 4: Documentation Updates

**Goal:** Update all technical documentation to reflect correct hierarchy  
**Estimated Time:** 2-3 hours  
**Files to Modify:** Multiple docs

---

## Step 4.1: Update TECH-SPEC-02 (Database Core)

### Context to Provide to Claude

```
I need to update docs/TECH-SPEC-02-Database-Core.md to:
1. Change organisation roles from 3 to 2 (remove org_owner as separate, now just org_admin)
2. Document the permission hierarchy clearly
3. Update any policy examples to show can_access_project() usage

Please review the current document and suggest specific changes.

Here's the current TECH-SPEC-02:
[paste contents]
```

### Checklist

- [ ] Update org roles section (3 → 2 roles)
- [ ] Add permission hierarchy diagram
- [ ] Update policy examples
- [ ] Update version number and changelog

---

## Step 4.2: Update TECH-SPEC-05 (RLS Security)

### Context to Provide to Claude

```
I need to update docs/TECH-SPEC-05-RLS-Security.md to:
1. Correct the org role count (3 → 2)
2. Ensure all policy examples use can_access_project()
3. Document the hierarchy clearly in Section 2.4
4. Update the permission matrix to show org admin inherits project admin

This is the most critical document for security.

Here's the current TECH-SPEC-05:
[paste contents]
```

### Checklist

- [ ] Update Section 2.4 - Access Hierarchy
- [ ] Update Section 3.2 - Role-Based policies to use helper
- [ ] Fix org role count
- [ ] Update permission matrix
- [ ] Add migration notes
- [ ] Update version number

---

## Step 4.3: Update TECH-SPEC-07 (Frontend State)

### Context to Provide to Claude

```
I need to update docs/TECH-SPEC-07-Frontend-State.md to:
1. Document the updated ViewAsContext behavior
2. Document isOrgLevelAdmin in usePermissions
3. Update the Role Resolution Flow diagram
4. Fix org role count

Here's the current TECH-SPEC-07:
[paste contents]
```

### Checklist

- [ ] Update Section 6 - ViewAsContext
- [ ] Update Section 9 - Permission System
- [ ] Update Section 11.6 - Role Resolution Flow
- [ ] Fix org role count
- [ ] Update version number

---

## Step 4.4: Create ADDENDUM for Permission Hierarchy

### Context to Provide to Claude

```
I need to create a new addendum document that clearly explains the permission 
hierarchy for future reference.

File: docs/ADDENDUM-Permission-Hierarchy.md

This should be a concise, authoritative reference that anyone can read to 
understand how permissions work.
```

### Document Template

```markdown
# ADDENDUM: Permission Hierarchy

**Created:** [DATE]
**Status:** Authoritative Reference

## Permission Hierarchy

```
System Admin (profiles.role = 'admin')
    │
    ├── Can access ALL organisations
    ├── Can access ALL projects  
    ├── Has 'admin' project permissions everywhere
    └── Can manage system settings

Org Admin (user_organisations.org_role = 'org_admin')
    │
    ├── Can access ALL projects in their organisation
    ├── Has 'admin' project permissions within their org
    ├── Can manage org members and settings
    └── Can create/delete projects

Org Member (user_organisations.org_role = 'org_member')
    │
    ├── Can access ONLY projects they're assigned to
    └── Has project role from user_projects table
        │
        ├── admin          - Full project control
        ├── supplier_pm    - Supplier-side management  
        ├── customer_pm    - Customer-side management
        ├── contributor    - Create/edit own work
        └── viewer         - Read-only access
```

## How It Works

### Database (RLS)
- `can_access_project(project_id)` checks hierarchy
- System admin → always returns true
- Org admin → returns true for org's projects
- Org member → returns true if in user_projects

### Frontend (Hooks)
- `usePermissions()` provides `isOrgLevelAdmin`
- `effectiveRole` is 'admin' for system/org admins
- Navigation uses `getNavigationForUser()`

## Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `can_access_project()` | Database | RLS access check |
| `is_system_admin()` | Database | System admin check |
| `is_org_admin()` | Database | Org admin check |
| `usePermissions()` | Frontend | Permission hook |
| `getNavigationForUser()` | Frontend | Nav items |
```

### Checklist

- [ ] Create the addendum document
- [ ] Include diagrams
- [ ] Add to documentation index

---

# Phase 5: Security Testing & Verification

**Goal:** Verify all permission scenarios work correctly  
**Estimated Time:** 3-4 hours

---

## Step 5.1: Create Test Scenarios Document

### Checklist

- [ ] Create test scenarios for each permission level
- [ ] Document expected behavior
- [ ] Create test accounts if needed

### Test Scenarios

| # | User Type | Org | Project Assignment | Expected Access |
|---|-----------|-----|-------------------|-----------------|
| 1 | System Admin | Any | None | Full access everywhere |
| 2 | Org Admin | Carey Olsen | None | Full access to all CO projects |
| 3 | Org Admin | Carey Olsen | Contributor on Project A | Full access (org admin overrides) |
| 4 | Org Member | Carey Olsen | Admin on Project A | Admin on Project A only |
| 5 | Org Member | Carey Olsen | Contributor on Project A | Contributor on Project A only |
| 6 | Org Member | Carey Olsen | None | No project access |
| 7 | Org Member | JT | Admin on JT Project | Cannot access CO projects |

---

## Step 5.2: Manual Testing Checklist

### System Admin Tests

- [ ] Can see all organisations in org switcher
- [ ] Can see all projects across all orgs
- [ ] Has full admin sidebar
- [ ] Can access Settings, Resources, Team Members
- [ ] Can create/edit/delete all data types

### Org Admin Tests (Carey Olsen)

- [ ] Can only see Carey Olsen in org switcher (unless also member of other orgs)
- [ ] Can see all projects in Carey Olsen
- [ ] Has full admin sidebar
- [ ] Can access Settings, Resources, Team Members
- [ ] Can create new project
- [ ] Can manage org members
- [ ] Cannot access JT projects

### Org Member Tests

- [ ] Can only see assigned projects
- [ ] Sidebar reflects project role
- [ ] Cannot access admin pages if not admin role
- [ ] Cannot see projects they're not assigned to

---

## Step 5.3: RLS Verification Queries

### Context to Provide to Claude

```
I need SQL queries to verify RLS is working correctly for each scenario.
These will be run in Supabase SQL editor with different user contexts.

Scenarios to test:
1. System admin sees all projects
2. Org admin sees all org projects
3. Org member sees only assigned projects
4. Cross-org access is blocked
```

### Test Queries

```sql
-- Set up test (replace with actual user IDs)
-- Run each query block while authenticated as different users

-- =============================================
-- TEST 1: System Admin Access
-- Expected: Can see all timesheets
-- =============================================
SELECT COUNT(*) as total_timesheets FROM timesheets;
SELECT DISTINCT project_id FROM timesheets;

-- =============================================
-- TEST 2: Org Admin Access (same org)
-- Expected: Can see timesheets for org's projects only
-- =============================================
SELECT 
  t.id,
  t.project_id,
  p.name as project_name,
  p.organisation_id
FROM timesheets t
JOIN projects p ON t.project_id = p.id
LIMIT 10;

-- =============================================
-- TEST 3: Org Member Access
-- Expected: Can only see timesheets for assigned projects
-- =============================================
SELECT 
  t.id,
  t.project_id,
  up.user_id,
  up.role as project_role
FROM timesheets t
JOIN user_projects up ON t.project_id = up.project_id
WHERE up.user_id = auth.uid()
LIMIT 10;

-- =============================================
-- TEST 4: Cross-Org Block
-- Expected: 0 rows if user not in that org
-- =============================================
SELECT COUNT(*) 
FROM timesheets t
JOIN projects p ON t.project_id = p.id
WHERE p.organisation_id = '[OTHER_ORG_ID]';
```

### Checklist

- [ ] Run all test queries as system admin
- [ ] Run all test queries as org admin
- [ ] Run all test queries as org member
- [ ] Verify cross-org access is blocked
- [ ] Document any issues found

---

## Step 5.4: E2E Test Updates

### Context to Provide to Claude

```
I need to update or create E2E tests that verify the permission hierarchy.

Test file: e2e/permissions-hierarchy.spec.js

Tests needed:
1. Org admin can access admin pages without project assignment
2. Org admin can see all org projects
3. Org member only sees assigned projects
4. Sidebar shows correct items for each user type
```

### Checklist

- [ ] Create/update E2E test file
- [ ] Test org admin sidebar access
- [ ] Test org member restrictions
- [ ] Run tests: `npm run e2e`

---

# Phase 6: Deployment & Verification

**Goal:** Deploy changes and verify in production  
**Estimated Time:** 1-2 hours

---

## Step 6.1: Pre-Deployment Checklist

- [ ] All unit tests pass: `npm run test:run`
- [ ] All E2E tests pass: `npm run e2e`
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Branch rebased on latest main

---

## Step 6.2: Deployment Steps

```bash
# 1. Merge to main
git checkout main
git pull origin main
git merge fix/permission-hierarchy

# 2. Push (triggers Vercel deployment)
git push origin main

# 3. Run database migrations
# If using Supabase CLI:
supabase db push

# Or apply migrations manually in Supabase dashboard
```

---

## Step 6.3: Post-Deployment Verification

- [ ] Log in as system admin - verify full access
- [ ] Log in as org admin (Carey Olsen) - verify admin sidebar
- [ ] Log in as org member - verify restricted access
- [ ] Check Vercel deployment logs for errors
- [ ] Check Supabase logs for RLS errors

---

# Appendix A: Quick Reference

## Files Modified Summary

| Phase | File | Changes |
|-------|------|---------|
| 1.1 | `src/contexts/ViewAsContext.jsx` | Add org admin role resolution |
| 1.2 | `src/hooks/usePermissions.js` | Export org admin flags |
| 1.3 | `src/__tests__/unit/permission-hierarchy.test.js` | New tests |
| 2.1 | `src/lib/navigation.js` | Add `getNavigationForUser()` |
| 2.2 | `src/components/layout/*.jsx` | Use new navigation function |
| 3.2 | `supabase/migrations/YYYYMMDD_fix_core_rls.sql` | Core table policies |
| 3.3 | `supabase/migrations/YYYYMMDD_fix_supporting_rls.sql` | Supporting tables |
| 4.1-4.4 | `docs/TECH-SPEC-*.md` | Documentation updates |

## Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `can_access_project()` | Database | RLS helper - checks full hierarchy |
| `is_system_admin()` | Database | Check system admin status |
| `is_org_admin()` | Database | Check org admin status |
| `getNavigationForUser()` | navigation.js | Get nav items for user |
| `usePermissions()` | usePermissions.js | Frontend permission hook |

## Test Commands

```bash
# Unit tests
npm run test:run

# E2E tests
npm run e2e

# Specific test file
npm run test:run -- permission-hierarchy

# E2E with visible browser
npm run e2e:headed
```

---

# Appendix B: Rollback Plan

If issues are discovered after deployment:

## Frontend Rollback

```bash
git revert HEAD~N  # Revert N commits
git push origin main
```

## Database Rollback

Create a rollback migration that restores old policies:

```sql
-- Rollback: Restore old RLS policies
-- Only use if critical issues found

DROP POLICY IF EXISTS "timesheets_select_policy" ON timesheets;

CREATE POLICY "timesheets_select_policy" ON timesheets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = timesheets.project_id
      AND up.user_id = auth.uid()
    )
  );

-- Repeat for other tables...
```

---

**End of Implementation Plan**
