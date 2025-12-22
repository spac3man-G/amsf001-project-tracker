# Organisation-Level Multi-Tenancy Implementation Checklist

## Implementation Guide for Systematic Development

**Document:** IMPLEMENTATION-CHECKLIST.md  
**Version:** 1.1  
**Created:** 22 December 2025  
**Updated:** 22 December 2025  
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

## Phase 1: Database Schema ✅ COMPLETE

### 1.1 Create Organisations Table
**Status:** ✅ Complete

**Migration:** `202512221400_create_organisations.sql`

**Checkpoint 1.1:** ✅ Organisations table exists with correct schema

---

### 1.2 Create User Organisations Table
**Status:** ✅ Complete

**Migration:** `202512221401_create_user_organisations.sql`

**Checkpoint 1.2:** ✅ User organisations table exists with correct schema

---

### 1.3 Add Organisation ID to Projects
**Status:** ✅ Complete

**Migration:** `202512221402_add_org_id_to_projects.sql`

**Checkpoint 1.3:** ✅ Projects table has organisation_id column

---

### 1.4 Create RLS Helper Functions
**Status:** ✅ Complete

**Migration:** `202512221403_create_rls_helper_functions.sql`

**Functions created:**
- `is_system_admin()`
- `is_org_member(uuid)`
- `get_org_role(uuid)`
- `is_org_admin(uuid)`
- `is_org_owner(uuid)`
- `get_user_organisation_ids()`
- `can_access_project(uuid)`
- `get_project_role(uuid)`
- `has_project_role(uuid, text[])`
- `get_accessible_project_ids()`

**Checkpoint 1.4:** ✅ All helper functions exist and return correct types

---

### 1.5 Create RLS Policies for New Tables
**Status:** ✅ Complete

**Migration:** `202512221404_create_org_rls_policies.sql`

**Checkpoint 1.5:** ✅ RLS policies exist for organisations and user_organisations

---

### 1.6 Update Projects RLS Policies
**Status:** ✅ Complete

**Migration:** `202512221405_update_projects_rls_policies.sql`

**Checkpoint 1.6:** ✅ Projects and user_projects use org-aware policies

---

### 1.7 Migrate Existing Data
**Status:** ✅ Complete

**Migration:** `202512221406_migrate_data_to_default_org.sql`

**Results:**
- 1 organisation created (Default Organisation)
- 4 projects assigned to organisation
- 24 user_organisations entries created

**Checkpoint 1.7:** ✅ All projects and users assigned to default organisation

---

### 1.8 Enforce NOT NULL Constraint
**Status:** ✅ Complete

**Migration:** `202512221407_enforce_org_id_not_null.sql`

**Checkpoint 1.8:** ✅ organisation_id is NOT NULL on projects table

---

## Phase 2: Frontend Context 🔄 IN PROGRESS

### 2.1 Review Existing Context Structure
**Status:** ✅ Complete

**Files reviewed:**
- `src/contexts/AuthContext.jsx` - provides user, profile, role
- `src/contexts/ProjectContext.jsx` - provides currentProject, projectRole
- `src/contexts/ViewAsContext.jsx` - provides effectiveRole, impersonation
- `src/App.jsx` - provider hierarchy
- `src/lib/permissionMatrix.js` - role definitions

**Current Provider Hierarchy:**
```
ToastProvider
  └── AuthProvider
        └── ProjectProvider
              └── ViewAsProvider
                    └── [Other providers...]
```

**Checkpoint 2.1:** ✅ Context structure documented and understood

---

### 2.2 Create OrganisationContext
**Status:** ✅ Complete

**File:** `src/contexts/OrganisationContext.jsx`

**Provides:**
- `currentOrganisation` - current org object
- `organisationId`, `organisationName`, `organisationSlug`
- `orgRole` - user's role in org (org_owner/org_admin/org_member)
- `isOrgAdmin`, `isOrgOwner`, `isSystemAdmin`
- `availableOrganisations`, `hasMultipleOrganisations`
- `switchOrganisation()`, `refreshOrganisation()`
- `orgSettings` - organisation settings with defaults

**Checkpoint 2.2:** ✅ OrganisationContext created with all required functionality

---

### 2.3 Integrate OrganisationProvider into App
**Status:** ✅ Complete

**File:** `src/App.jsx` (updated to v17.0)

**New Provider Hierarchy:**
```
ToastProvider
  └── AuthProvider
        └── OrganisationProvider  ← NEW
              └── ProjectProvider
                    └── ViewAsProvider
                          └── [Other providers...]
```

**Checkpoint 2.3:** ✅ OrganisationProvider integrated into App.jsx

---

### 2.4 Update ProjectContext
**Status:** ✅ Complete

**File:** `src/contexts/ProjectContext.jsx` (updated to v6.0)

**Changes:**
- Now depends on OrganisationContext
- Filters projects by current organisation_id
- Re-fetches projects when organisation changes
- Org admins can see all projects in their org
- Clears current project if not in new org

**Checkpoint 2.4:** ✅ ProjectContext filters projects by organisation

---

### 2.5 Update ViewAsContext
**Status:** ⬜ Not Started

**Prerequisites:**
- [x] Checkpoint 2.4 complete

**Tasks:**
- [ ] Check if ViewAsContext needs organisation awareness
- [ ] Add org-level impersonation if needed (org_admin viewing as org_member)
- [ ] Test impersonation still works

**Files to Check:**
- `src/contexts/ViewAsContext.jsx`

**Checkpoint 2.5:** ⬜ ViewAsContext works with new context structure

---

## Phase 3: Permission System ✅ COMPLETE

### 3.1 Add Organisation Roles to Permission Matrix
**Status:** ✅ Complete

**File:** `src/lib/permissionMatrix.js` (updated to v2.0)

**Added:**
- `ORG_ROLES` constants (org_owner, org_admin, org_member)
- `ORG_PERMISSION_MATRIX` for organisation-level permissions
- `hasOrgPermission()` function
- `isOrgAdminRole()` and `isOrgOwnerRole()` helpers
- `ORG_ROLE_CONFIG` and `ORG_ROLE_OPTIONS` for UI

**Organisation Permissions:**
- organisation: view, edit, delete, manageBilling, viewBilling
- orgMembers: view, invite, remove, changeRole, promoteToOwner
- orgProjects: view, create, delete, assignMembers
- orgSettings: view, edit, manageFeatures, manageBranding

**Checkpoint 3.1:** ✅ Permission matrix includes organisation permissions

---

### 3.2 Update useProjectRole Hook
**Status:** ✅ Complete

**File:** `src/hooks/useProjectRole.js` (updated to v2.0)

**Added:**
- `orgRole` - organisation role from OrganisationContext
- `isOrgAdmin` - true if org_owner or org_admin
- `isOrgOwner` - true if org_owner
- Combined loading state includes org loading
- Combined error state includes org errors

**Checkpoint 3.2:** ✅ useProjectRole returns organisation role

---

## Phase 4: UI Components

### 4.1 Create Organisation Switcher Component
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Create `src/components/organisation/OrganisationSwitcher.jsx`
- [ ] Show current organisation name
- [ ] Dropdown to switch (if multiple orgs)
- [ ] Style to match existing UI

**Checkpoint 4.1:** ⬜ Organisation switcher component exists

---

### 4.2 Update Header/Layout
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Review `src/components/Layout.jsx`
- [ ] Add organisation switcher to header
- [ ] Show organisation name/logo
- [ ] Test responsive behaviour

**Checkpoint 4.2:** ⬜ Header shows organisation and switcher

---

### 4.3 Create Organisation Settings Page
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Create `src/pages/admin/OrganisationSettings.jsx`
- [ ] Add route in App.jsx
- [ ] Form for editing org settings
- [ ] Only visible to org admins

**Checkpoint 4.3:** ⬜ Organisation settings page works

---

### 4.4 Create Organisation Members Page
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Create `src/pages/admin/OrganisationMembers.jsx`
- [ ] List members with roles
- [ ] Invite new members
- [ ] Change roles

**Checkpoint 4.4:** ⬜ Organisation members page works

---

### 4.5 Update Navigation
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Add organisation admin links to nav
- [ ] Only show to org admins
- [ ] Test nav permissions

**Checkpoint 4.5:** ⬜ Navigation includes organisation management

---

## Phase 5: Services & API

### 5.1 Create Organisation Service
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Create `src/services/organisation.service.js`
- [ ] CRUD operations for organisations
- [ ] Member management methods

**Checkpoint 5.1:** ⬜ Organisation service exists with tests

---

### 5.2 Create User Organisation Service
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Create methods for inviting users
- [ ] Methods for changing roles
- [ ] Methods for removing users

**Checkpoint 5.2:** ⬜ User organisation service exists

---

### 5.3 Update Existing Services
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Review BaseService for org awareness
- [ ] Update project service
- [ ] Test data isolation

**Checkpoint 5.3:** ⬜ All services are organisation-aware

---

### 5.4 Update Project Creation Flow
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Projects must have organisation_id
- [ ] Update ProjectManagement page
- [ ] Test project creation

**Checkpoint 5.4:** ⬜ Project creation includes organisation

---

## Phase 6: Testing

### 6.1 Write Unit Tests
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Test OrganisationContext
- [ ] Test permission functions
- [ ] Test service methods

**Checkpoint 6.1:** ⬜ Unit tests pass

---

### 6.2 Integration Testing
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Test data isolation between orgs
- [ ] Test role-based access
- [ ] Test org switching

**Checkpoint 6.2:** ⬜ Integration tests pass

---

## Phase 7: Final Verification

### 7.1 End-to-End Testing
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Test complete user journey
- [ ] Test edge cases
- [ ] Performance testing

**Checkpoint 7.1:** ⬜ E2E tests pass

---

### 7.2 Documentation Update
**Status:** ⬜ Not Started

**Tasks:**
- [ ] Update API documentation
- [ ] Update user guide
- [ ] Update deployment guide

**Checkpoint 7.2:** ⬜ Documentation complete

---

## Summary

| Phase | Status | Checkpoints |
|-------|--------|-------------|
| Phase 1: Database Schema | ✅ Complete | 8/8 |
| Phase 2: Frontend Context | 🔄 In Progress | 4/5 |
| Phase 3: Permission System | ✅ Complete | 2/2 |
| Phase 4: UI Components | ⬜ Not Started | 0/5 |
| Phase 5: Services & API | ⬜ Not Started | 0/4 |
| Phase 6: Testing | ⬜ Not Started | 0/2 |
| Phase 7: Final Verification | ⬜ Not Started | 0/2 |

**Total Progress:** 15/28 checkpoints complete (54%)
