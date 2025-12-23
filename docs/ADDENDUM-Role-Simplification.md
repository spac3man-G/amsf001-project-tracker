# Documentation Addendum: Organisation Role Simplification

**Created:** 23 December 2025
**Status:** In Progress
**Related Work:** Simplify Organisation Roles (3 → 2 roles)

---

## Overview

This addendum tracks documentation updates required following the simplification of organisation roles from a 3-role model (`org_owner`, `org_admin`, `org_member`) to a 2-role model (`org_admin`, `org_member`).

Once implementation is stable and tested, these changes should be merged into the main documentation suite.

---

## Summary of Changes

### Before (3-Role Model)
| Role | Description |
|------|-------------|
| `org_owner` | Full control including billing, deletion, ownership transfer |
| `org_admin` | Manage members, settings, projects (but not billing/delete) |
| `org_member` | Access assigned projects only |

### After (2-Role Model)
| Role | Description |
|------|-------------|
| `org_admin` | Full organisation control - manage members, settings, projects, billing, deletion |
| `org_member` | Access assigned projects only |

### Rationale
- Simpler mental model for users
- Reduced code complexity
- No ownership transfer complexity
- Multiple admins can exist with equal privileges
- System admin handles org creation (separate from org admin)

---

## Documents Requiring Updates

### 1. TECH-SPEC-01-Architecture.md
**Section:** 3.2 Organisation Layer / Organisation Roles
**Current Text:** Lists three roles (org_owner, org_admin, org_member)
**Required Update:**
- Update role table to show 2 roles only
- Update role hierarchy description
- Remove ownership transfer mention

---

### 2. TECH-SPEC-02-Database-Core.md
**Section:** 3.2 user_organisations Table
**Current Text:** `org_role` column allows org_owner, org_admin, org_member
**Required Update:**
- Update CHECK constraint description (now only org_admin, org_member)
- Update ER diagram if it shows role values
- Update example data

**Section:** Helper Functions
**Current Text:** References `is_org_owner()` function
**Required Update:**
- Note that `is_org_owner()` function has been dropped
- Update `is_org_admin()` description (now checks single role)

---

### 3. TECH-SPEC-05-RLS-Security.md
**Section:** Organisation RLS Helper Functions
**Current Text:** Documents `is_org_owner()` and `is_org_admin()` functions
**Required Update:**
- Remove `is_org_owner()` documentation (function dropped)
- Update `is_org_admin()` - now checks for single role only
- Update policy examples that reference owner

---

### 4. TECH-SPEC-07-Frontend-State.md
**Section:** OrganisationContext
**Current Text:** Documents ORG_ROLES with 3 values
**Required Update:**
- Update ORG_ROLES constant (2 values)
- Update ORG_ROLE_CONFIG (2 entries)
- Note `isOrgOwnerRole()` is deprecated
- Update context value descriptions

---

### 5. TECH-SPEC-08-Services.md
**Section:** OrganisationService
**Current Text:** Documents owner-specific methods
**Required Update:**
- Update `create()` method - assigns org_admin (not owner)
- Update `changeMemberRole()` - no ownership transfer
- Update `removeMember()` - "last admin" protection (not owner protection)
- Remove any owner transfer documentation

---

### 6. TECH-SPEC-09-Testing-Infrastructure.md
**Section:** 14.3 Organisation Permission Test Coverage
**Current Text:** Lists 118 tests covering 3 roles
**Required Update:**
- Update test count to 95 (reduced due to fewer roles)
- Update test categories (remove owner-specific tests)
- Note promoteToOwner action removed

---

### 7. AMSF001-Technical-Specification.md
**Section:** Organisation Roles table
**Current Text:** Shows 3 roles with descriptions
**Required Update:**
- Update to show 2 roles
- Update permission matrix
- Update role hierarchy

---

### 8. TECHNICAL-DEBT-AND-FUTURE-FEATURES.md
**Section:** Completed Items
**Required Update:**
- Add entry for role simplification work
- Reference migration 202512231600_simplify_org_roles.sql

---

## Database Changes Applied

### Migration: 202512231600_simplify_org_roles.sql

| Change | Description |
|--------|-------------|
| Data migration | All `org_owner` records → `org_admin` |
| CHECK constraint | Now only allows `org_admin`, `org_member` |
| `is_org_owner()` | **Dropped** |
| `is_org_admin()` | Updated (checks single role) |
| `can_access_project()` | Updated (uses org_admin only) |
| `can_manage_project()` | Updated (uses org_admin only) |
| RLS policies | Updated to use `is_org_admin()` |

---

## Code Changes Applied

### Permission Matrix (permissionMatrix.js)
- `ORG_ROLES`: Removed `ORG_OWNER`
- `ALL_ORG_ROLES`: Now `[org_admin, org_member]`
- `ORG_ADMINS`: Now `[org_admin]` only
- `ORG_OWNER_ONLY`: Removed
- `ORG_PERMISSION_MATRIX`: Updated (no owner-only permissions)
- `isOrgOwnerRole()`: Deprecated (aliases isOrgAdminRole)
- `ORG_ROLE_CONFIG`: 2 entries only

### OrganisationContext.jsx (v2.0)
- `ORG_ROLES`: 2 values
- `ORG_ROLE_CONFIG`: 2 entries
- `isOrgOwnerRole()`: Deprecated
- `isOrgOwner` context value: Kept for backwards compatibility (same as isOrgAdmin)

### OrganisationSwitcher.jsx
- Removed Crown icon
- `ORG_ROLE_ICONS`: 2 entries (Shield for admin, User for member)

### OrganisationMembers.jsx (v2.0)
- Removed `canPromoteToOwner` permission check
- Removed owner-specific protections
- Simplified role dropdown (admin/member only)
- Added self-protection (can't change own role)

### organisation.service.js
- `create()`: Assigns `org_admin` to creator
- `removeMember()`: "Last admin" protection
- `changeMemberRole()`: "Last admin" demotion protection
- Removed ownership transfer logic

### useProjectRole.js
- Updated comments
- `isOrgOwner`: Kept for backwards compatibility

---

## Unit Test Changes

### org-permissions.test.js (v2.0)
- Test count: 118 → 95
- Removed: org_owner test cases
- Removed: promoteToOwner tests
- Updated: isOrgOwnerRole tests (deprecated behavior)
- Added: Tests verifying org_owner is removed

---

## Outstanding Items

### To Verify
- [ ] Application builds without errors
- [ ] All tests pass
- [ ] Manual testing in browser
- [ ] Existing org_owner records migrated correctly

### Future Considerations
- [ ] System Admin UI for creating organisations (not yet built)
- [ ] Consider if `isOrgOwner` context value should be removed entirely in future version

---

## Git Commits

| Commit | Description |
|--------|-------------|
| `c7282edf` | db: Simplify org roles (3→2) - migration |
| `6cb8a86e` | refactor: Simplify org roles in permission matrix |
| `5165cbe9` | test: Update org-permissions tests for 2-role model |
| `1227aad2` | refactor: Update frontend components for 2-role model |

---

## Version History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 23 Dec 2025 | 1.0 | Claude | Initial addendum created |
