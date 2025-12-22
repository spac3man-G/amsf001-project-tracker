# Organisation-Level Multi-Tenancy Implementation Checklist

## Implementation Guide for Systematic Development

**Document:** IMPLEMENTATION-CHECKLIST.md  
**Version:** 1.0  
**Created:** 22 December 2025  
**Purpose:** Step-by-step checklist for implementing multi-tenancy with regular checkpoints

---

## How to Use This Guide

This checklist is designed for **incremental implementation** with regular check-ins. Each section:

1. Has a clear **scope** (what we're implementing)
2. Lists **prerequisites** (what must be done first)
3. Contains **verification steps** (how to confirm it works)
4. Ends with a **checkpoint** (stop and verify before proceeding)

**Rules for Implementation:**
- ✅ Always check existing code before making assumptions
- ✅ Verify each step works before moving to the next
- ✅ Run tests after each section
- ✅ Commit working code at each checkpoint
- ❌ Don't skip verification steps
- ❌ Don't assume code structure - always check

---

## Phase 1: Database Schema

### 1.1 Create Organisations Table
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Database backup completed
- [ ] Access to Supabase dashboard or migration tooling

**Tasks:**
- [ ] Create `organisations` table
- [ ] Create indexes
- [ ] Enable RLS (policies added later)
- [ ] Verify table created

**Verification:**
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'organisations';
```

**Checkpoint 1.1:** ⬜ Organisations table exists with correct schema

---

### 1.2 Create User Organisations Table
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 1.1 complete

**Tasks:**
- [ ] Create `user_organisations` junction table
- [ ] Create indexes
- [ ] Enable RLS (policies added later)
- [ ] Verify table created

**Verification:**
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_organisations';
```

**Checkpoint 1.2:** ⬜ User organisations table exists with correct schema

---

### 1.3 Add Organisation ID to Projects
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 1.2 complete

**Tasks:**
- [ ] Add `organisation_id` column to projects (nullable initially)
- [ ] Create index on organisation_id
- [ ] Verify column added

**Verification:**
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'organisation_id';
```

**Checkpoint 1.3:** ⬜ Projects table has organisation_id column

---

### 1.4 Create RLS Helper Functions
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 1.3 complete

**Tasks:**
- [ ] Create `is_system_admin()` function
- [ ] Create `is_org_member(uuid)` function
- [ ] Create `get_org_role(uuid)` function
- [ ] Create `is_org_admin(uuid)` function
- [ ] Create `is_org_owner(uuid)` function
- [ ] Create `can_access_project(uuid)` function
- [ ] Create `get_project_role(uuid)` function
- [ ] Create `has_project_role(uuid, text[])` function
- [ ] Verify functions created

**Verification:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_system_admin', 'is_org_member', 'get_org_role', 
                     'is_org_admin', 'is_org_owner', 'can_access_project',
                     'get_project_role', 'has_project_role');
```

**Checkpoint 1.4:** ⬜ All RLS helper functions exist

---

### 1.5 Create RLS Policies for New Tables
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 1.4 complete

**Tasks:**
- [ ] Create policies for `organisations` table (SELECT, INSERT, UPDATE, DELETE)
- [ ] Create policies for `user_organisations` table (SELECT, INSERT, UPDATE, DELETE)
- [ ] Verify policies created

**Verification:**
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('organisations', 'user_organisations');
```

**Checkpoint 1.5:** ⬜ RLS policies exist for new tables

---

### 1.6 Update RLS Policies for Projects
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 1.5 complete

**Tasks:**
- [ ] Check existing project policies (document current state)
- [ ] Update SELECT policy to use `can_access_project()`
- [ ] Update INSERT policy to require org admin
- [ ] Update UPDATE policy to check org context
- [ ] Update DELETE policy to check org context
- [ ] Verify policies updated

**Pre-task Check:**
```sql
-- Document existing policies before changing
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'projects';
```

**Checkpoint 1.6:** ⬜ Projects table RLS policies updated

---

### 1.7 Migrate Existing Data
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 1.6 complete
- [ ] Identified organisation owner (email: _______________)

**Tasks:**
- [ ] Create default organisation
- [ ] Assign all projects to default organisation
- [ ] Create user_organisations entries for all users with project access
- [ ] Set organisation owner
- [ ] Verify migration

**Verification:**
```sql
-- All projects have organisation_id
SELECT COUNT(*) as orphan_projects FROM projects 
WHERE organisation_id IS NULL AND is_deleted = FALSE;

-- All project users have org membership
SELECT COUNT(*) as missing_memberships FROM (
  SELECT DISTINCT user_id FROM user_projects
  EXCEPT
  SELECT user_id FROM user_organisations WHERE is_active = TRUE
) x;

-- At least one owner exists
SELECT COUNT(*) as owners FROM user_organisations 
WHERE org_role = 'org_owner' AND is_active = TRUE;
```

**Checkpoint 1.7:** ⬜ All existing data migrated to default organisation

---

### 1.8 Enforce Organisation ID on Projects
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 1.7 complete
- [ ] All verification queries pass

**Tasks:**
- [ ] Add NOT NULL constraint to organisation_id
- [ ] Add foreign key constraint
- [ ] Verify constraints

**Verification:**
```sql
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'organisation_id';
```

**Checkpoint 1.8:** ⬜ Organisation ID is required on projects

---

## Phase 2: Frontend Context

### 2.1 Review Existing Context Structure
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Phase 1 complete

**Tasks:**
- [ ] Document current AuthContext exports
- [ ] Document current ProjectContext exports
- [ ] Document current ViewAsContext exports
- [ ] Document App.jsx provider hierarchy
- [ ] Identify integration points

**Files to Check:**
- [ ] `src/contexts/AuthContext.jsx`
- [ ] `src/contexts/ProjectContext.jsx`
- [ ] `src/contexts/ViewAsContext.jsx`
- [ ] `src/App.jsx`

**Checkpoint 2.1:** ⬜ Current context structure documented

---

### 2.2 Create OrganisationContext
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 2.1 complete

**Tasks:**
- [ ] Create `src/contexts/OrganisationContext.jsx`
- [ ] Implement provider with state management
- [ ] Implement `useOrganisation` hook
- [ ] Export constants (ORG_ROLES, ORG_ROLE_CONFIG)
- [ ] Test basic functionality

**Verification:**
- [ ] Context file exists
- [ ] No console errors on import
- [ ] Hook returns expected shape

**Checkpoint 2.2:** ⬜ OrganisationContext created and exports working

---

### 2.3 Integrate OrganisationContext into App
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 2.2 complete

**Tasks:**
- [ ] Add OrganisationProvider to App.jsx
- [ ] Position between AuthProvider and ProjectProvider
- [ ] Verify app still loads
- [ ] Verify no console errors

**Verification:**
- [ ] App loads without errors
- [ ] React DevTools shows OrganisationProvider in tree

**Checkpoint 2.3:** ⬜ OrganisationContext integrated into app

---

### 2.4 Update ProjectContext
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 2.3 complete

**Tasks:**
- [ ] Add dependency on OrganisationContext
- [ ] Filter projects by current organisation
- [ ] Add org admin visibility logic
- [ ] Clear project on org switch
- [ ] Test project switching

**Verification:**
- [ ] Projects load correctly
- [ ] Only org projects shown
- [ ] Project switching works

**Checkpoint 2.4:** ⬜ ProjectContext updated for org awareness

---

### 2.5 Update ViewAsContext
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 2.4 complete

**Tasks:**
- [ ] Add org role impersonation support
- [ ] Add effectiveOrgRole
- [ ] Clear impersonation on org switch
- [ ] Maintain backward compatibility

**Verification:**
- [ ] View As still works for project roles
- [ ] Org role impersonation works (if testing)

**Checkpoint 2.5:** ⬜ ViewAsContext updated for org awareness

---

## Phase 3: Permission System

### 3.1 Create Organisation Permission Matrix
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Phase 2 complete

**Tasks:**
- [ ] Create `src/lib/orgPermissionMatrix.js`
- [ ] Define ORG_ROLES constants
- [ ] Define ORG_ENTITIES constants
- [ ] Define ORG_ACTIONS constants
- [ ] Create permission matrix
- [ ] Create helper functions

**Verification:**
- [ ] File exists
- [ ] Exports work correctly
- [ ] hasOrgPermission() returns expected values

**Checkpoint 3.1:** ⬜ Organisation permission matrix created

---

### 3.2 Update usePermissions Hook
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 3.1 complete

**Tasks:**
- [ ] Check current usePermissions implementation
- [ ] Add org permission checks
- [ ] Add system admin bypass
- [ ] Maintain backward compatibility
- [ ] Test permission checks

**Files to Check:**
- [ ] `src/hooks/usePermissions.js` (or current location)

**Verification:**
- [ ] Existing permission checks still work
- [ ] New org permission checks work

**Checkpoint 3.2:** ⬜ usePermissions hook updated

---

## Phase 4: UI Components

### 4.1 Create OrganisationSwitcher
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Phase 3 complete

**Tasks:**
- [ ] Create `src/components/OrganisationSwitcher.jsx`
- [ ] Implement dropdown UI
- [ ] Connect to OrganisationContext
- [ ] Add data-testid attributes
- [ ] Test switching

**Verification:**
- [ ] Component renders
- [ ] Shows current org
- [ ] Dropdown opens/closes
- [ ] Switching works

**Checkpoint 4.1:** ⬜ OrganisationSwitcher component created

---

### 4.2 Integrate OrganisationSwitcher into Header
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 4.1 complete

**Tasks:**
- [ ] Check current Header implementation
- [ ] Add OrganisationSwitcher before ProjectSwitcher
- [ ] Style appropriately
- [ ] Test responsive behavior

**Files to Check:**
- [ ] Header component (location: _______________)

**Verification:**
- [ ] Org switcher visible in header
- [ ] Layout looks correct
- [ ] Mobile responsive

**Checkpoint 4.2:** ⬜ OrganisationSwitcher in header

---

### 4.3 Create Organisation Settings Page
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 4.2 complete

**Tasks:**
- [ ] Create page component
- [ ] Implement General tab
- [ ] Implement Branding tab
- [ ] Implement Features tab
- [ ] Implement Defaults tab
- [ ] Add save functionality
- [ ] Add route

**Verification:**
- [ ] Page loads at /organisation/settings
- [ ] Can view settings
- [ ] Can save changes (if admin)

**Checkpoint 4.3:** ⬜ Organisation settings page created

---

### 4.4 Create Organisation Members Page
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 4.3 complete

**Tasks:**
- [ ] Create page component
- [ ] List members
- [ ] Add invite functionality
- [ ] Add role change functionality
- [ ] Add remove functionality
- [ ] Add route

**Verification:**
- [ ] Page loads at /organisation/members
- [ ] Members listed correctly
- [ ] Actions work (for admins)

**Checkpoint 4.4:** ⬜ Organisation members page created

---

### 4.5 Update Navigation
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 4.4 complete

**Tasks:**
- [ ] Check current navigation/sidebar
- [ ] Add Organisation section for org admins
- [ ] Add conditional visibility
- [ ] Test navigation

**Files to Check:**
- [ ] Sidebar/Navigation component (location: _______________)

**Verification:**
- [ ] Org section visible for org admins
- [ ] Org section hidden for org members
- [ ] Links work correctly

**Checkpoint 4.5:** ⬜ Navigation updated for organisation

---

## Phase 5: Services & API

### 5.1 Create OrganisationsService
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Phase 4 complete

**Tasks:**
- [ ] Create service file
- [ ] Implement CRUD methods
- [ ] Implement membership methods
- [ ] Add to service index
- [ ] Test basic operations

**Verification:**
- [ ] Service methods work
- [ ] RLS enforced correctly

**Checkpoint 5.1:** ⬜ OrganisationsService created

---

### 5.2 Update ProjectsService
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 5.1 complete

**Tasks:**
- [ ] Check current implementation
- [ ] Update create() to require organisation_id
- [ ] Add getByOrganisation() method
- [ ] Test changes

**Files to Check:**
- [ ] Projects service (location: _______________)

**Verification:**
- [ ] Project creation requires org
- [ ] Org-filtered queries work

**Checkpoint 5.2:** ⬜ ProjectsService updated

---

### 5.3 Update Chat Context API
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 5.2 complete

**Tasks:**
- [ ] Check current /api/chat-context implementation
- [ ] Add organisation context to response
- [ ] Test API response

**Files to Check:**
- [ ] `/api/chat-context/route.js` (or current location)

**Verification:**
- [ ] API returns organisation context
- [ ] Chat still works

**Checkpoint 5.3:** ⬜ Chat context API updated

---

### 5.4 Update Create User API
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 5.3 complete

**Tasks:**
- [ ] Check current implementation
- [ ] Require organisation_id
- [ ] Create org membership before project membership
- [ ] Test user creation

**Files to Check:**
- [ ] `/api/create-user/route.js` (or current location)

**Verification:**
- [ ] User creation requires org
- [ ] User gets org membership

**Checkpoint 5.4:** ⬜ Create user API updated

---

## Phase 6: Testing

### 6.1 Add Unit Tests for Org Permissions
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Phase 5 complete

**Tasks:**
- [ ] Create permission matrix tests
- [ ] Create helper function tests
- [ ] Run tests
- [ ] Fix any failures

**Verification:**
- [ ] All tests pass

**Checkpoint 6.1:** ⬜ Unit tests passing

---

### 6.2 Add E2E Tests for Organisation Features
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 6.1 complete

**Tasks:**
- [ ] Create test users
- [ ] Add org switcher tests
- [ ] Add cross-org isolation tests
- [ ] Add member management tests
- [ ] Run tests

**Verification:**
- [ ] All E2E tests pass

**Checkpoint 6.2:** ⬜ E2E tests passing

---

## Phase 7: Final Verification

### 7.1 Full System Test
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Phase 6 complete

**Tasks:**
- [ ] Test as system admin
- [ ] Test as org owner
- [ ] Test as org admin
- [ ] Test as org member
- [ ] Test cross-org isolation
- [ ] Document any issues

**Checkpoint 7.1:** ⬜ All manual tests pass

---

### 7.2 Production Readiness
**Status:** ⬜ Not Started

**Prerequisites:**
- [ ] Checkpoint 7.1 complete

**Tasks:**
- [ ] Review all console warnings
- [ ] Check for security issues
- [ ] Performance check
- [ ] Documentation updated
- [ ] Stakeholder sign-off

**Checkpoint 7.2:** ⬜ Ready for production

---

## Progress Summary

| Phase | Section | Status |
|-------|---------|--------|
| 1 | Database Schema | ⬜ 0/8 |
| 2 | Frontend Context | ⬜ 0/5 |
| 3 | Permission System | ⬜ 0/2 |
| 4 | UI Components | ⬜ 0/5 |
| 5 | Services & API | ⬜ 0/4 |
| 6 | Testing | ⬜ 0/2 |
| 7 | Final Verification | ⬜ 0/2 |
| **Total** | | **0/28** |

---

## Next Session Prompt

When starting each session, use this prompt:

```
I'm implementing organisation-level multi-tenancy for AMSF001. 
We're at Checkpoint [X.X]: [Description]

Last completed: [What was done]
Next to do: [Next section]

Please check the relevant existing code before we proceed.
```

---

*Implementation checklist for AMSF001 Organisation-Level Multi-Tenancy*
