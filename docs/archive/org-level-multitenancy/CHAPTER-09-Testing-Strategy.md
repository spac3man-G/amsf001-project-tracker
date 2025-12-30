# Organisation-Level Multi-Tenancy Implementation Guide

## Chapter 9: Testing Strategy

**Document:** CHAPTER-09-Testing-Strategy.md  
**Version:** 1.0  
**Created:** 22 December 2025  
**Status: Complete (Implementation Reference)  

---

## 9.1 Overview

This chapter details the comprehensive testing strategy for validating the organisation-level multi-tenancy implementation. The testing approach covers unit tests, integration tests, end-to-end tests, and security validation.

### Testing Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     E2E Tests (Playwright)                       │
│              User journeys, cross-browser, visual               │
├─────────────────────────────────────────────────────────────────┤
│                  Integration Tests (Vitest)                      │
│            Context interactions, API calls, services            │
├─────────────────────────────────────────────────────────────────┤
│                    Unit Tests (Vitest)                          │
│         Permission matrix, helper functions, components         │
├─────────────────────────────────────────────────────────────────┤
│                   Database Tests (pgTAP)                         │
│              RLS policies, helper functions, triggers           │
└─────────────────────────────────────────────────────────────────┘
```

### New Test Coverage Areas

| Area | Test Type | Priority |
|------|-----------|----------|
| Organisation permission matrix | Unit | High |
| RLS helper functions | Database | High |
| OrganisationContext | Integration | High |
| Organisation switching | E2E | High |
| Cross-org data isolation | E2E | Critical |
| Org member management | E2E | Medium |
| Migration scripts | Database | High |

---

## 9.2 Test User Configuration

### 9.2.1 Updated Test User Matrix

```javascript
// playwright/fixtures/test-users.js

export const TEST_USERS = {
  // ============================================================
  // System Level
  // ============================================================
  SYSTEM_ADMIN: {
    email: 'system.admin@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'system_admin',
    orgRole: null,  // Has access to all orgs
    projectRole: null,  // Has access to all projects
    description: 'Platform administrator with full access'
  },

  // ============================================================
  // Organisation A - Primary Test Org
  // ============================================================
  ORG_A_OWNER: {
    email: 'org.a.owner@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: 'org-a-uuid',
    orgRole: 'org_owner',
    projectRole: 'admin',
    projectId: 'project-a1-uuid',
    description: 'Owner of Organisation A'
  },
  
  ORG_A_ADMIN: {
    email: 'org.a.admin@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: 'org-a-uuid',
    orgRole: 'org_admin',
    projectRole: 'supplier_pm',
    projectId: 'project-a1-uuid',
    description: 'Admin of Organisation A'
  },
  
  ORG_A_MEMBER_SUPPLIER: {
    email: 'org.a.supplier@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: 'org-a-uuid',
    orgRole: 'org_member',
    projectRole: 'supplier_pm',
    projectId: 'project-a1-uuid',
    description: 'Supplier PM in Organisation A'
  },
  
  ORG_A_MEMBER_CUSTOMER: {
    email: 'org.a.customer@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: 'org-a-uuid',
    orgRole: 'org_member',
    projectRole: 'customer_pm',
    projectId: 'project-a1-uuid',
    description: 'Customer PM in Organisation A'
  },
  
  ORG_A_CONTRIBUTOR: {
    email: 'org.a.contributor@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: 'org-a-uuid',
    orgRole: 'org_member',
    projectRole: 'contributor',
    projectId: 'project-a1-uuid',
    description: 'Contributor in Organisation A'
  },
  
  ORG_A_VIEWER: {
    email: 'org.a.viewer@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: 'org-a-uuid',
    orgRole: 'org_member',
    projectRole: 'viewer',
    projectId: 'project-a1-uuid',
    description: 'Viewer in Organisation A'
  },

  // ============================================================
  // Organisation B - Secondary Test Org (for isolation tests)
  // ============================================================
  ORG_B_OWNER: {
    email: 'org.b.owner@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: 'org-b-uuid',
    orgRole: 'org_owner',
    projectRole: 'admin',
    projectId: 'project-b1-uuid',
    description: 'Owner of Organisation B'
  },
  
  ORG_B_MEMBER: {
    email: 'org.b.member@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: 'org-b-uuid',
    orgRole: 'org_member',
    projectRole: 'supplier_pm',
    projectId: 'project-b1-uuid',
    description: 'Member of Organisation B'
  },

  // ============================================================
  // Multi-Org User (Consultant scenario)
  // ============================================================
  MULTI_ORG_USER: {
    email: 'multi.org@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisations: [
      { id: 'org-a-uuid', role: 'org_member' },
      { id: 'org-b-uuid', role: 'org_admin' }
    ],
    projects: [
      { id: 'project-a1-uuid', role: 'contributor' },
      { id: 'project-b1-uuid', role: 'admin' }
    ],
    description: 'User with access to multiple organisations'
  },

  // ============================================================
  // Edge Cases
  // ============================================================
  ORG_MEMBER_NO_PROJECTS: {
    email: 'no.projects@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: 'org-a-uuid',
    orgRole: 'org_member',
    projectRole: null,
    projectId: null,
    description: 'Org member with no project assignments'
  },
  
  NO_ORG_USER: {
    email: 'no.org@test.amsf.com',
    password: 'TestPassword123!',
    systemRole: 'user',
    organisationId: null,
    orgRole: null,
    projectRole: null,
    projectId: null,
    description: 'User with no organisation membership'
  }
};

export const TEST_ORGANISATIONS = {
  ORG_A: {
    id: 'org-a-uuid',
    name: 'Test Organisation A',
    slug: 'test-org-a'
  },
  ORG_B: {
    id: 'org-b-uuid',
    name: 'Test Organisation B',
    slug: 'test-org-b'
  }
};

export const TEST_PROJECTS = {
  PROJECT_A1: {
    id: 'project-a1-uuid',
    name: 'Project A1',
    projectRef: 'PROJ-A1',
    organisationId: 'org-a-uuid'
  },
  PROJECT_A2: {
    id: 'project-a2-uuid',
    name: 'Project A2',
    projectRef: 'PROJ-A2',
    organisationId: 'org-a-uuid'
  },
  PROJECT_B1: {
    id: 'project-b1-uuid',
    name: 'Project B1',
    projectRef: 'PROJ-B1',
    organisationId: 'org-b-uuid'
  }
};
```

### 9.2.2 Test Data Seeding Script

```javascript
// scripts/e2e/seed-test-data.js

import { createClient } from '@supabase/supabase-js';
import { TEST_USERS, TEST_ORGANISATIONS, TEST_PROJECTS } from '../../playwright/fixtures/test-users.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedTestData() {
  console.log('🌱 Seeding test data for E2E tests...\n');

  // ============================================================
  // 1. Create Organisations
  // ============================================================
  console.log('Creating organisations...');
  
  for (const [key, org] of Object.entries(TEST_ORGANISATIONS)) {
    const { error } = await supabase
      .from('organisations')
      .upsert({
        id: org.id,
        name: org.name,
        slug: org.slug,
        settings: {
          features: {
            ai_chat_enabled: true,
            receipt_scanner_enabled: true,
            variations_enabled: true
          }
        },
        is_active: true
      }, { onConflict: 'id' });
    
    if (error) {
      console.error(`  ❌ Failed to create ${key}:`, error.message);
    } else {
      console.log(`  ✓ Created ${org.name}`);
    }
  }

  // ============================================================
  // 2. Create Projects
  // ============================================================
  console.log('\nCreating projects...');
  
  for (const [key, project] of Object.entries(TEST_PROJECTS)) {
    const { error } = await supabase
      .from('projects')
      .upsert({
        id: project.id,
        name: project.name,
        project_ref: project.projectRef,
        organisation_id: project.organisationId,
        status: 'Active',
        is_deleted: false
      }, { onConflict: 'id' });
    
    if (error) {
      console.error(`  ❌ Failed to create ${key}:`, error.message);
    } else {
      console.log(`  ✓ Created ${project.name}`);
    }
  }

  // ============================================================
  // 3. Create Test Users
  // ============================================================
  console.log('\nCreating test users...');
  
  for (const [key, user] of Object.entries(TEST_USERS)) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError && !authError.message.includes('already exists')) {
        console.error(`  ❌ Failed to create auth user ${key}:`, authError.message);
        continue;
      }

      const userId = authData?.user?.id || (await getUserIdByEmail(user.email));
      
      if (!userId) {
        console.error(`  ❌ Could not get user ID for ${key}`);
        continue;
      }

      // Create/update profile
      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: user.email,
          full_name: key.replace(/_/g, ' '),
          role: user.systemRole
        }, { onConflict: 'id' });

      // Create org membership(s)
      if (user.organisations) {
        // Multi-org user
        for (const org of user.organisations) {
          await supabase
            .from('user_organisations')
            .upsert({
              user_id: userId,
              organisation_id: org.id,
              org_role: org.role,
              is_active: true,
              accepted_at: new Date().toISOString()
            }, { onConflict: 'user_id,organisation_id' });
        }
      } else if (user.organisationId) {
        // Single org user
        await supabase
          .from('user_organisations')
          .upsert({
            user_id: userId,
            organisation_id: user.organisationId,
            org_role: user.orgRole,
            is_active: true,
            is_default: true,
            accepted_at: new Date().toISOString()
          }, { onConflict: 'user_id,organisation_id' });
      }

      // Create project membership(s)
      if (user.projects) {
        // Multi-project user
        for (const project of user.projects) {
          await supabase
            .from('user_projects')
            .upsert({
              user_id: userId,
              project_id: project.id,
              role: project.role
            }, { onConflict: 'user_id,project_id' });
        }
      } else if (user.projectId && user.projectRole) {
        // Single project user
        await supabase
          .from('user_projects')
          .upsert({
            user_id: userId,
            project_id: user.projectId,
            role: user.projectRole,
            is_default: true
          }, { onConflict: 'user_id,project_id' });
      }

      console.log(`  ✓ Created ${key}`);
    } catch (err) {
      console.error(`  ❌ Error creating ${key}:`, err.message);
    }
  }

  // ============================================================
  // 4. Create Sample Data
  // ============================================================
  console.log('\nCreating sample data...');
  
  // Create resources for linked users
  // Create sample timesheets
  // Create sample milestones
  // ... (abbreviated for clarity)

  console.log('\n✅ Test data seeding complete!\n');
}

async function getUserIdByEmail(email) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  return data?.id;
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...\n');
  
  // Delete in reverse order of dependencies
  const testEmails = Object.values(TEST_USERS).map(u => u.email);
  
  // Get user IDs
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .in('email', testEmails);
  
  const userIds = profiles?.map(p => p.id) || [];
  
  if (userIds.length > 0) {
    // Delete user_projects
    await supabase.from('user_projects').delete().in('user_id', userIds);
    
    // Delete user_organisations
    await supabase.from('user_organisations').delete().in('user_id', userIds);
    
    // Delete profiles
    await supabase.from('profiles').delete().in('id', userIds);
    
    // Delete auth users
    for (const userId of userIds) {
      await supabase.auth.admin.deleteUser(userId);
    }
  }
  
  // Delete test projects
  const projectIds = Object.values(TEST_PROJECTS).map(p => p.id);
  await supabase.from('projects').delete().in('id', projectIds);
  
  // Delete test organisations
  const orgIds = Object.values(TEST_ORGANISATIONS).map(o => o.id);
  await supabase.from('organisations').delete().in('id', orgIds);
  
  console.log('✅ Cleanup complete!\n');
}

// Run seeding
seedTestData().catch(console.error);
```

---

## 9.3 Unit Tests

### 9.3.1 Organisation Permission Matrix Tests

```javascript
// src/__tests__/unit/orgPermissionMatrix.test.js
import { describe, it, expect } from 'vitest';
import { 
  hasOrgPermission,
  isOrgAdminRole,
  isOrgOwnerRole,
  getOrgRolePermissions,
  ORG_ROLES,
  ORG_ENTITIES,
  ORG_ACTIONS
} from '../../lib/orgPermissionMatrix';

describe('Organisation Permission Matrix', () => {
  // ============================================================
  // org_owner permissions
  // ============================================================
  describe('org_owner', () => {
    const role = ORG_ROLES.ORG_OWNER;

    it('can view organisation', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.VIEW)).toBe(true);
    });

    it('can edit organisation', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.EDIT)).toBe(true);
    });

    it('can delete organisation', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.DELETE)).toBe(true);
    });

    it('can manage members', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_MEMBERS, ORG_ACTIONS.MANAGE)).toBe(true);
    });

    it('can invite members', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_MEMBERS, ORG_ACTIONS.INVITE)).toBe(true);
    });

    it('can view billing', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_BILLING, ORG_ACTIONS.VIEW)).toBe(true);
    });

    it('can edit billing', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_BILLING, ORG_ACTIONS.EDIT)).toBe(true);
    });

    it('can create projects', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_PROJECTS, ORG_ACTIONS.CREATE)).toBe(true);
    });
  });

  // ============================================================
  // org_admin permissions
  // ============================================================
  describe('org_admin', () => {
    const role = ORG_ROLES.ORG_ADMIN;

    it('can view organisation', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.VIEW)).toBe(true);
    });

    it('can edit organisation', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.EDIT)).toBe(true);
    });

    it('cannot delete organisation', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.DELETE)).toBe(false);
    });

    it('can invite members', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_MEMBERS, ORG_ACTIONS.INVITE)).toBe(true);
    });

    it('can view billing', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_BILLING, ORG_ACTIONS.VIEW)).toBe(true);
    });

    it('cannot edit billing', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_BILLING, ORG_ACTIONS.EDIT)).toBe(false);
    });

    it('can create projects', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_PROJECTS, ORG_ACTIONS.CREATE)).toBe(true);
    });
  });

  // ============================================================
  // org_member permissions
  // ============================================================
  describe('org_member', () => {
    const role = ORG_ROLES.ORG_MEMBER;

    it('can view organisation', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.VIEW)).toBe(true);
    });

    it('cannot edit organisation', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.EDIT)).toBe(false);
    });

    it('cannot view members', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_MEMBERS, ORG_ACTIONS.VIEW)).toBe(false);
    });

    it('cannot invite members', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_MEMBERS, ORG_ACTIONS.INVITE)).toBe(false);
    });

    it('cannot view settings', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_SETTINGS, ORG_ACTIONS.VIEW)).toBe(false);
    });

    it('cannot create projects', () => {
      expect(hasOrgPermission(role, ORG_ENTITIES.ORG_PROJECTS, ORG_ACTIONS.CREATE)).toBe(false);
    });
  });

  // ============================================================
  // Helper functions
  // ============================================================
  describe('helper functions', () => {
    it('isOrgAdminRole returns true for owner', () => {
      expect(isOrgAdminRole(ORG_ROLES.ORG_OWNER)).toBe(true);
    });

    it('isOrgAdminRole returns true for admin', () => {
      expect(isOrgAdminRole(ORG_ROLES.ORG_ADMIN)).toBe(true);
    });

    it('isOrgAdminRole returns false for member', () => {
      expect(isOrgAdminRole(ORG_ROLES.ORG_MEMBER)).toBe(false);
    });

    it('isOrgOwnerRole returns true only for owner', () => {
      expect(isOrgOwnerRole(ORG_ROLES.ORG_OWNER)).toBe(true);
      expect(isOrgOwnerRole(ORG_ROLES.ORG_ADMIN)).toBe(false);
      expect(isOrgOwnerRole(ORG_ROLES.ORG_MEMBER)).toBe(false);
    });

    it('getOrgRolePermissions returns permission object', () => {
      const perms = getOrgRolePermissions(ORG_ROLES.ORG_ADMIN);
      expect(perms).toHaveProperty(ORG_ENTITIES.ORGANISATION);
      expect(perms).toHaveProperty(ORG_ENTITIES.ORG_MEMBERS);
    });

    it('handles invalid role gracefully', () => {
      expect(hasOrgPermission('invalid', ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.VIEW)).toBe(false);
      expect(hasOrgPermission(null, ORG_ENTITIES.ORGANISATION, ORG_ACTIONS.VIEW)).toBe(false);
    });
  });
});
```

### 9.3.2 usePermissions Hook Tests

```javascript
// src/__tests__/integration/usePermissions.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../../hooks/usePermissions';

// Mock the contexts
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../contexts/OrganisationContext', () => ({
  useOrganisation: vi.fn()
}));

vi.mock('../../contexts/ProjectContext', () => ({
  useProject: vi.fn()
}));

vi.mock('../../contexts/ViewAsContext', () => ({
  useViewAs: vi.fn()
}));

import { useAuth } from '../../contexts/AuthContext';
import { useOrganisation } from '../../contexts/OrganisationContext';
import { useProject } from '../../contexts/ProjectContext';
import { useViewAs } from '../../contexts/ViewAsContext';

describe('usePermissions hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupMocks({ systemRole = 'user', orgRole = null, projectRole = null, isProjectMember = false }) {
    useAuth.mockReturnValue({ profile: { role: systemRole } });
    useOrganisation.mockReturnValue({ orgRole });
    useProject.mockReturnValue({ projectRole, isProjectMember });
    useViewAs.mockReturnValue({
      effectiveOrgRole: orgRole,
      effectiveProjectRole: projectRole,
      systemRole
    });
  }

  // ============================================================
  // System Admin Tests
  // ============================================================
  describe('system_admin', () => {
    beforeEach(() => {
      setupMocks({ systemRole: 'system_admin' });
    });

    it('has all org permissions', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.isSystemAdmin).toBe(true);
      expect(result.current.canDeleteOrganisation).toBe(true);
      expect(result.current.canEditOrgBilling).toBe(true);
      expect(result.current.canManageOrgMembers).toBe(true);
    });

    it('has all project permissions', () => {
      const { result } = renderHook(() => usePermissions());
      
      expect(result.current.canApproveTimesheet).toBe(true);
      expect(result.current.canDeleteMilestone).toBe(true);
      expect(result.current.canEditProjectSettings).toBe(true);
    });
  });

  // ============================================================
  // Org Owner Tests
  // ============================================================
  describe('org_owner', () => {
    beforeEach(() => {
      setupMocks({ orgRole: 'org_owner', projectRole: 'admin', isProjectMember: true });
    });

    it('can delete organisation', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteOrganisation).toBe(true);
    });

    it('can edit billing', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditOrgBilling).toBe(true);
    });

    it('is org admin', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isOrgAdmin).toBe(true);
      expect(result.current.isOrgOwner).toBe(true);
    });
  });

  // ============================================================
  // Org Admin Tests
  // ============================================================
  describe('org_admin', () => {
    beforeEach(() => {
      setupMocks({ orgRole: 'org_admin', projectRole: 'supplier_pm', isProjectMember: true });
    });

    it('cannot delete organisation', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canDeleteOrganisation).toBe(false);
    });

    it('cannot edit billing', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canEditOrgBilling).toBe(false);
    });

    it('can invite members', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canInviteOrgMembers).toBe(true);
    });

    it('is org admin but not owner', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.isOrgAdmin).toBe(true);
      expect(result.current.isOrgOwner).toBe(false);
    });
  });

  // ============================================================
  // Org Member Tests
  // ============================================================
  describe('org_member', () => {
    beforeEach(() => {
      setupMocks({ orgRole: 'org_member', projectRole: 'contributor', isProjectMember: true });
    });

    it('cannot view org settings', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canViewOrgSettings).toBe(false);
    });

    it('cannot invite members', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canInviteOrgMembers).toBe(false);
    });

    it('has contributor project permissions', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canCreateTimesheet).toBe(true);
      expect(result.current.canApproveTimesheet).toBe(false);
    });
  });

  // ============================================================
  // No Project Access Tests
  // ============================================================
  describe('org member without project access', () => {
    beforeEach(() => {
      setupMocks({ orgRole: 'org_member', projectRole: null, isProjectMember: false });
    });

    it('has no project permissions', () => {
      const { result } = renderHook(() => usePermissions());
      expect(result.current.canViewTimesheets).toBe(false);
      expect(result.current.canViewMilestones).toBe(false);
      expect(result.current.hasAnyProjectAccess).toBe(false);
    });
  });
});
```

---

## 9.4 Database Tests (pgTAP)

### 9.4.1 RLS Helper Function Tests

```sql
-- tests/database/test_rls_helpers.sql
BEGIN;
SELECT plan(20);

-- ============================================================
-- Setup test data
-- ============================================================

-- Create test organisation
INSERT INTO organisations (id, name, slug) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Test Org', 'test-org');

-- Create test users (mock auth.uid())
INSERT INTO profiles (id, email, full_name, role)
VALUES 
  ('aaaa0000-0000-0000-0000-000000000001', 'sysadmin@test.com', 'System Admin', 'system_admin'),
  ('aaaa0000-0000-0000-0000-000000000002', 'orgowner@test.com', 'Org Owner', 'user'),
  ('aaaa0000-0000-0000-0000-000000000003', 'orgadmin@test.com', 'Org Admin', 'user'),
  ('aaaa0000-0000-0000-0000-000000000004', 'orgmember@test.com', 'Org Member', 'user'),
  ('aaaa0000-0000-0000-0000-000000000005', 'nonmember@test.com', 'Non Member', 'user');

-- Create org memberships
INSERT INTO user_organisations (user_id, organisation_id, org_role, is_active)
VALUES
  ('aaaa0000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'org_owner', true),
  ('aaaa0000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'org_admin', true),
  ('aaaa0000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'org_member', true);

-- Create test project
INSERT INTO projects (id, name, project_ref, organisation_id)
VALUES ('22222222-2222-2222-2222-222222222222', 'Test Project', 'TEST-001', '11111111-1111-1111-1111-111111111111');

-- Create project memberships
INSERT INTO user_projects (user_id, project_id, role)
VALUES
  ('aaaa0000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'admin'),
  ('aaaa0000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'contributor');

-- ============================================================
-- Test is_system_admin()
-- ============================================================

-- Set JWT for system admin
SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000001"}', true);
SELECT ok(is_system_admin(), 'System admin returns true for is_system_admin()');

-- Set JWT for regular user
SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000002"}', true);
SELECT ok(NOT is_system_admin(), 'Regular user returns false for is_system_admin()');

-- ============================================================
-- Test is_org_member()
-- ============================================================

-- Org owner is member
SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000002"}', true);
SELECT ok(
  is_org_member('11111111-1111-1111-1111-111111111111'), 
  'Org owner is org member'
);

-- Non-member is not member
SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000005"}', true);
SELECT ok(
  NOT is_org_member('11111111-1111-1111-1111-111111111111'), 
  'Non-member is not org member'
);

-- ============================================================
-- Test get_org_role()
-- ============================================================

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000002"}', true);
SELECT is(
  get_org_role('11111111-1111-1111-1111-111111111111'), 
  'org_owner', 
  'get_org_role returns org_owner'
);

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000003"}', true);
SELECT is(
  get_org_role('11111111-1111-1111-1111-111111111111'), 
  'org_admin', 
  'get_org_role returns org_admin'
);

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000004"}', true);
SELECT is(
  get_org_role('11111111-1111-1111-1111-111111111111'), 
  'org_member', 
  'get_org_role returns org_member'
);

-- ============================================================
-- Test is_org_admin()
-- ============================================================

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000002"}', true);
SELECT ok(is_org_admin('11111111-1111-1111-1111-111111111111'), 'Owner is org admin');

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000003"}', true);
SELECT ok(is_org_admin('11111111-1111-1111-1111-111111111111'), 'Admin is org admin');

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000004"}', true);
SELECT ok(NOT is_org_admin('11111111-1111-1111-1111-111111111111'), 'Member is not org admin');

-- ============================================================
-- Test is_org_owner()
-- ============================================================

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000002"}', true);
SELECT ok(is_org_owner('11111111-1111-1111-1111-111111111111'), 'Owner is org owner');

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000003"}', true);
SELECT ok(NOT is_org_owner('11111111-1111-1111-1111-111111111111'), 'Admin is not org owner');

-- ============================================================
-- Test can_access_project()
-- ============================================================

-- Org owner with project membership
SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000002"}', true);
SELECT ok(
  can_access_project('22222222-2222-2222-2222-222222222222'), 
  'Org owner with membership can access project'
);

-- Org admin without project membership (should still have visibility)
SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000003"}', true);
SELECT ok(
  can_access_project('22222222-2222-2222-2222-222222222222'), 
  'Org admin without membership can access project'
);

-- Org member with project membership
SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000004"}', true);
SELECT ok(
  can_access_project('22222222-2222-2222-2222-222222222222'), 
  'Org member with membership can access project'
);

-- Non-member cannot access project
SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000005"}', true);
SELECT ok(
  NOT can_access_project('22222222-2222-2222-2222-222222222222'), 
  'Non-member cannot access project'
);

-- System admin can access any project
SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000001"}', true);
SELECT ok(
  can_access_project('22222222-2222-2222-2222-222222222222'), 
  'System admin can access any project'
);

-- ============================================================
-- Test get_project_role()
-- ============================================================

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000002"}', true);
SELECT is(
  get_project_role('22222222-2222-2222-2222-222222222222'),
  'admin',
  'get_project_role returns admin'
);

SELECT set_config('request.jwt.claims', '{"sub": "aaaa0000-0000-0000-0000-000000000004"}', true);
SELECT is(
  get_project_role('22222222-2222-2222-2222-222222222222'),
  'contributor',
  'get_project_role returns contributor'
);

-- ============================================================
-- Cleanup
-- ============================================================

SELECT * FROM finish();
ROLLBACK;
```

---

## 9.5 End-to-End Tests (Playwright)

### 9.5.1 Organisation Switcher Tests

```javascript
// playwright/tests/organisation/org-switcher.spec.js
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../../fixtures/test-users';

test.describe('Organisation Switcher', () => {
  test.describe('Multi-org user', () => {
    test.use({ storageState: 'playwright/.auth/multi-org-user.json' });

    test('shows organisation switcher when user has multiple orgs', async ({ page }) => {
      await page.goto('/dashboard');
      
      const switcher = page.getByTestId('org-switcher');
      await expect(switcher).toBeVisible();
    });

    test('displays current organisation name', async ({ page }) => {
      await page.goto('/dashboard');
      
      const switcher = page.getByTestId('org-switcher-button');
      await expect(switcher).toContainText('Test Organisation');
    });

    test('can switch between organisations', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Open switcher
      await page.getByTestId('org-switcher-button').click();
      
      // Verify dropdown visible
      const dropdown = page.getByTestId('org-switcher-dropdown');
      await expect(dropdown).toBeVisible();
      
      // Select different org
      await page.getByTestId('org-option-test-org-b').click();
      
      // Verify org changed
      await expect(page.getByTestId('org-switcher-button')).toContainText('Test Organisation B');
      
      // Verify project list updated (different projects)
      // ... additional assertions
    });

    test('clears project selection when switching org', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Note current project
      const projectSwitcher = page.getByTestId('project-switcher-button');
      await expect(projectSwitcher).toContainText('Project A1');
      
      // Switch org
      await page.getByTestId('org-switcher-button').click();
      await page.getByTestId('org-option-test-org-b').click();
      
      // Verify project changed to org B project
      await expect(projectSwitcher).not.toContainText('Project A1');
    });
  });

  test.describe('Single-org user', () => {
    test.use({ storageState: 'playwright/.auth/org-a-member.json' });

    test('shows org name but no dropdown arrow', async ({ page }) => {
      await page.goto('/dashboard');
      
      const switcher = page.getByTestId('org-switcher');
      await expect(switcher).toBeVisible();
      
      // Should not have dropdown functionality if only one org
      await page.getByTestId('org-switcher-button').click();
      
      // Dropdown should not appear (or should only show current org)
      const dropdown = page.getByTestId('org-switcher-dropdown');
      // Behavior depends on implementation - adjust assertion accordingly
    });
  });
});
```

### 9.5.2 Cross-Organisation Isolation Tests

```javascript
// playwright/tests/organisation/cross-org-isolation.spec.js
import { test, expect } from '@playwright/test';
import { TEST_USERS, TEST_PROJECTS } from '../../fixtures/test-users';

test.describe('Cross-Organisation Data Isolation', () => {
  test.describe('Org A member', () => {
    test.use({ storageState: 'playwright/.auth/org-a-member.json' });

    test('cannot see Org B projects in project list', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Open project switcher
      await page.getByTestId('project-switcher-button').click();
      
      // Should not see Org B project
      const projectB = page.getByTestId(`project-option-${TEST_PROJECTS.PROJECT_B1.id}`);
      await expect(projectB).not.toBeVisible();
      
      // Should see Org A projects
      const projectA = page.getByTestId(`project-option-${TEST_PROJECTS.PROJECT_A1.id}`);
      await expect(projectA).toBeVisible();
    });

    test('cannot access Org B project via direct URL', async ({ page }) => {
      // Try to access Org B project directly
      await page.goto(`/projects/${TEST_PROJECTS.PROJECT_B1.id}/dashboard`);
      
      // Should be redirected or see error
      await expect(page).toHaveURL(/\/(dashboard|projects)/);
      // Or check for access denied message
    });

    test('cannot see Org B timesheets via API', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Navigate to timesheets
      await page.goto('/timesheets');
      
      // None of the timesheets should belong to Org B projects
      const timesheetRows = page.locator('[data-testid^="timesheet-row-"]');
      const count = await timesheetRows.count();
      
      for (let i = 0; i < count; i++) {
        const row = timesheetRows.nth(i);
        const projectCell = row.locator('[data-testid="project-cell"]');
        await expect(projectCell).not.toContainText(TEST_PROJECTS.PROJECT_B1.name);
      }
    });
  });

  test.describe('System admin', () => {
    test.use({ storageState: 'playwright/.auth/system-admin.json' });

    test('can see all organisations', async ({ page }) => {
      await page.goto('/dashboard');
      
      await page.getByTestId('org-switcher-button').click();
      
      // Should see both orgs
      await expect(page.getByTestId('org-option-test-org-a')).toBeVisible();
      await expect(page.getByTestId('org-option-test-org-b')).toBeVisible();
    });

    test('can switch between orgs and see their data', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Switch to Org A
      await page.getByTestId('org-switcher-button').click();
      await page.getByTestId('org-option-test-org-a').click();
      
      // Should see Org A project
      await page.getByTestId('project-switcher-button').click();
      await expect(page.getByTestId(`project-option-${TEST_PROJECTS.PROJECT_A1.id}`)).toBeVisible();
      
      // Switch to Org B
      await page.getByTestId('org-switcher-button').click();
      await page.getByTestId('org-option-test-org-b').click();
      
      // Should see Org B project
      await page.getByTestId('project-switcher-button').click();
      await expect(page.getByTestId(`project-option-${TEST_PROJECTS.PROJECT_B1.id}`)).toBeVisible();
    });
  });
});
```

### 9.5.3 Organisation Member Management Tests

```javascript
// playwright/tests/organisation/org-members.spec.js
import { test, expect } from '@playwright/test';

test.describe('Organisation Member Management', () => {
  test.describe('Org owner', () => {
    test.use({ storageState: 'playwright/.auth/org-a-owner.json' });

    test('can access members page', async ({ page }) => {
      await page.goto('/organisation/members');
      
      await expect(page.getByTestId('org-members-page')).toBeVisible();
    });

    test('can invite new member', async ({ page }) => {
      await page.goto('/organisation/members');
      
      // Click invite button
      await page.getByTestId('invite-member-button').click();
      
      // Fill form
      await page.getByTestId('invite-email-input').fill('newmember@test.com');
      await page.getByLabel('Admin').click();
      
      // Submit
      await page.getByTestId('send-invite-button').click();
      
      // Verify success
      await expect(page.getByText('Invitation sent')).toBeVisible();
    });

    test('can change member role', async ({ page }) => {
      await page.goto('/organisation/members');
      
      // Find member row
      const memberRow = page.getByTestId('member-row-org-a-admin-uuid');
      
      // Open actions menu
      await memberRow.getByTestId('member-actions').click();
      
      // Change to member role
      await page.getByText('Member').click();
      
      // Verify role changed
      await expect(memberRow.getByText('Member')).toBeVisible();
    });

    test('can remove member', async ({ page }) => {
      await page.goto('/organisation/members');
      
      const memberRow = page.getByTestId('member-row-test-user-uuid');
      await memberRow.getByTestId('member-actions').click();
      await page.getByText('Remove from Organisation').click();
      
      // Confirm
      await page.getByTestId('confirm-button').click();
      
      // Verify removed
      await expect(memberRow).not.toBeVisible();
    });
  });

  test.describe('Org admin', () => {
    test.use({ storageState: 'playwright/.auth/org-a-admin.json' });

    test('can access members page', async ({ page }) => {
      await page.goto('/organisation/members');
      await expect(page.getByTestId('org-members-page')).toBeVisible();
    });

    test('cannot change owner role', async ({ page }) => {
      await page.goto('/organisation/members');
      
      const ownerRow = page.getByTestId('member-row-org-a-owner-uuid');
      
      // Actions should not be available for owner
      const actionsButton = ownerRow.getByTestId('member-actions');
      await expect(actionsButton).not.toBeVisible();
    });

    test('cannot remove owner', async ({ page }) => {
      await page.goto('/organisation/members');
      
      const ownerRow = page.getByTestId('member-row-org-a-owner-uuid');
      
      // Should not have remove option
      await expect(ownerRow.getByText('Remove')).not.toBeVisible();
    });
  });

  test.describe('Org member', () => {
    test.use({ storageState: 'playwright/.auth/org-a-member.json' });

    test('cannot access members page', async ({ page }) => {
      await page.goto('/organisation/members');
      
      // Should be redirected
      await expect(page).not.toHaveURL('/organisation/members');
    });

    test('does not see members link in navigation', async ({ page }) => {
      await page.goto('/dashboard');
      
      const membersLink = page.getByTestId('nav-org-members');
      await expect(membersLink).not.toBeVisible();
    });
  });
});
```

### 9.5.4 Organisation Settings Tests

```javascript
// playwright/tests/organisation/org-settings.spec.js
import { test, expect } from '@playwright/test';

test.describe('Organisation Settings', () => {
  test.describe('Org owner', () => {
    test.use({ storageState: 'playwright/.auth/org-a-owner.json' });

    test('can access all settings tabs', async ({ page }) => {
      await page.goto('/organisation/settings');
      
      await expect(page.getByTestId('org-settings-page')).toBeVisible();
      
      // Check all tabs accessible
      await page.getByText('General').click();
      await expect(page.getByTestId('org-name-input')).toBeVisible();
      
      await page.getByText('Branding').click();
      await expect(page.locator('input[type="color"]')).toBeVisible();
      
      await page.getByText('Features').click();
      await expect(page.getByText('AI Chat Assistant')).toBeVisible();
      
      await page.getByText('Billing').click();
      await expect(page.getByText('Subscription')).toBeVisible();
      
      await page.getByText('Danger Zone').click();
      await expect(page.getByTestId('delete-org-button')).toBeVisible();
    });

    test('can update organisation name', async ({ page }) => {
      await page.goto('/organisation/settings');
      
      const nameInput = page.getByTestId('org-name-input');
      await nameInput.clear();
      await nameInput.fill('Updated Org Name');
      
      await page.getByTestId('save-org-settings-button').click();
      
      await expect(page.getByText('Settings saved')).toBeVisible();
    });

    test('can toggle features', async ({ page }) => {
      await page.goto('/organisation/settings');
      await page.getByText('Features').click();
      
      const aiToggle = page.getByLabel('AI Chat Assistant');
      await aiToggle.click();
      
      await page.getByTestId('save-org-settings-button').click();
      
      await expect(page.getByText('Settings saved')).toBeVisible();
    });
  });

  test.describe('Org admin', () => {
    test.use({ storageState: 'playwright/.auth/org-a-admin.json' });

    test('can access settings but not billing or danger zone', async ({ page }) => {
      await page.goto('/organisation/settings');
      
      // General tab accessible
      await expect(page.getByTestId('org-name-input')).toBeVisible();
      
      // Billing tab should not be editable
      await page.getByText('Billing').click();
      await expect(page.getByText('View Only')).toBeVisible();
      
      // Danger Zone should not be visible
      await expect(page.getByText('Danger Zone')).not.toBeVisible();
    });
  });

  test.describe('Org member', () => {
    test.use({ storageState: 'playwright/.auth/org-a-member.json' });

    test('cannot access settings page', async ({ page }) => {
      await page.goto('/organisation/settings');
      
      // Should be redirected
      await expect(page).not.toHaveURL('/organisation/settings');
    });
  });
});
```

---

## 9.6 Test Configuration Updates

### 9.6.1 Playwright Configuration

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Auth setup projects
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.js/,
    },
    
    // Test projects by role
    {
      name: 'system-admin-tests',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/system-admin.json'
      },
      dependencies: ['auth-setup'],
      testMatch: /.*system-admin.*/,
    },
    {
      name: 'org-owner-tests',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/org-a-owner.json'
      },
      dependencies: ['auth-setup'],
      testMatch: /.*org-owner.*/,
    },
    {
      name: 'org-admin-tests',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/org-a-admin.json'
      },
      dependencies: ['auth-setup'],
      testMatch: /.*org-admin.*/,
    },
    {
      name: 'org-member-tests',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/org-a-member.json'
      },
      dependencies: ['auth-setup'],
      testMatch: /.*org-member.*/,
    },
    {
      name: 'cross-org-tests',
      use: { 
        ...devices['Desktop Chrome'],
      },
      dependencies: ['auth-setup'],
      testMatch: /.*cross-org.*/,
    },
    
    // General tests (run with default user)
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/org-a-supplier.json'
      },
      dependencies: ['auth-setup'],
      testIgnore: /.*\/(system-admin|org-owner|org-admin|org-member|cross-org).*/,
    },
  ],
});
```

### 9.6.2 Auth Setup Script

```javascript
// playwright/auth.setup.js
import { test as setup } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-users';

const AUTH_CONFIGS = [
  { key: 'SYSTEM_ADMIN', file: 'system-admin.json' },
  { key: 'ORG_A_OWNER', file: 'org-a-owner.json' },
  { key: 'ORG_A_ADMIN', file: 'org-a-admin.json' },
  { key: 'ORG_A_MEMBER_SUPPLIER', file: 'org-a-supplier.json' },
  { key: 'ORG_A_MEMBER_CUSTOMER', file: 'org-a-customer.json' },
  { key: 'ORG_A_CONTRIBUTOR', file: 'org-a-contributor.json' },
  { key: 'ORG_A_VIEWER', file: 'org-a-viewer.json' },
  { key: 'ORG_B_OWNER', file: 'org-b-owner.json' },
  { key: 'ORG_B_MEMBER', file: 'org-b-member.json' },
  { key: 'MULTI_ORG_USER', file: 'multi-org-user.json' },
];

for (const config of AUTH_CONFIGS) {
  setup(`authenticate ${config.key}`, async ({ page }) => {
    const user = TEST_USERS[config.key];
    
    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
    
    // Save auth state
    await page.context().storageState({ path: `playwright/.auth/${config.file}` });
  });
}
```

---

## 9.7 CI/CD Integration

### 9.7.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  database-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup database
        run: |
          PGPASSWORD=postgres psql -h localhost -U postgres -d postgres -f supabase/migrations/*.sql
      
      - name: Run pgTAP tests
        run: |
          PGPASSWORD=postgres pg_prove -h localhost -U postgres -d postgres tests/database/*.sql

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Seed test data
        run: npm run e2e:seed
        env:
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.TEST_APP_URL }}
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  security-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security tests
        run: npm run test:security
```

### 9.7.2 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:security": "vitest run --config vitest.security.config.js",
    "e2e:seed": "node scripts/e2e/seed-test-data.js",
    "e2e:cleanup": "node scripts/e2e/cleanup-test-data.js"
  }
}
```

---

## 9.8 Test Coverage Matrix

### 9.8.1 Organisation Permissions Coverage

| Permission | Unit Test | Integration | E2E |
|------------|-----------|-------------|-----|
| View organisation | ✅ | ✅ | ✅ |
| Edit organisation | ✅ | ✅ | ✅ |
| Delete organisation | ✅ | ✅ | ✅ |
| View members | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ✅ |
| Remove members | ✅ | ✅ | ✅ |
| Change member roles | ✅ | ✅ | ✅ |
| View settings | ✅ | ✅ | ✅ |
| Edit settings | ✅ | ✅ | ✅ |
| View billing | ✅ | ✅ | ✅ |
| Edit billing | ✅ | ✅ | ✅ |
| Create projects | ✅ | ✅ | ✅ |

### 9.8.2 Cross-Org Isolation Coverage

| Scenario | Database | E2E |
|----------|----------|-----|
| Org A user cannot see Org B projects | ✅ | ✅ |
| Org A user cannot access Org B data | ✅ | ✅ |
| Org A user cannot query Org B via API | ✅ | ✅ |
| System admin can see all orgs | ✅ | ✅ |
| Multi-org user sees correct data per org | ✅ | ✅ |

---

## 9.9 Chapter Summary

This chapter established:

1. **Test User Configuration** - 13 test users covering all role combinations

2. **Test Data Seeding** - Script to create organisations, projects, and users

3. **Unit Tests**:
   - Organisation permission matrix tests
   - usePermissions hook tests
   - ~50 test cases for permissions

4. **Database Tests (pgTAP)**:
   - RLS helper function tests
   - 20+ test cases for database security

5. **End-to-End Tests (Playwright)**:
   - Organisation switcher tests
   - Cross-organisation isolation tests
   - Member management tests
   - Settings page tests

6. **Test Configuration**:
   - Playwright config with role-specific projects
   - Auth setup for all test users
   - CI/CD workflow integration

7. **Coverage Matrix** - Comprehensive coverage for all new functionality

---

## Implementation Guide Complete

This concludes the 9-chapter Organisation-Level Multi-Tenancy Implementation Guide:

1. **Chapter 1**: Overview and Data Model
2. **Chapter 2**: Row-Level Security
3. **Chapter 3**: Frontend Context and State
4. **Chapter 4**: Organisation UI Components
5. **Chapter 5**: Service Layer Updates
6. **Chapter 6**: API Layer Updates
7. **Chapter 7**: Permission Matrix Updates
8. **Chapter 8**: Migration Guide
9. **Chapter 9**: Testing Strategy

---

*Document generated as part of AMSF001 Organisation-Level Multi-Tenancy Implementation Guide*
