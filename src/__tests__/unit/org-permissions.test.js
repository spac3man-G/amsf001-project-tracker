/**
 * Organisation Permission Matrix Tests
 * Location: src/__tests__/unit/org-permissions.test.js
 * 
 * Tests organisation-level permissions for multi-tenancy.
 * Tests ORG_ROLES (org_owner, org_admin, org_member) and their permissions.
 * 
 * @version 1.0
 * @created 22 December 2025
 */

import { describe, it, expect } from 'vitest';
import {
  ORG_ROLES,
  ORG_PERMISSION_MATRIX,
  hasOrgPermission,
  isOrgAdminRole,
  isOrgOwnerRole,
  getOrgPermissionsForRole,
  getOrgRolesForPermission,
  ORG_ROLE_CONFIG,
  ORG_ROLE_OPTIONS,
} from '../../lib/permissionMatrix';

// ============================================
// ALL ORG ROLES ARRAY FOR ITERATION
// ============================================

const ALL_ORG_ROLES = [
  ORG_ROLES.ORG_OWNER,
  ORG_ROLES.ORG_ADMIN,
  ORG_ROLES.ORG_MEMBER,
];

const ORG_ADMINS = [ORG_ROLES.ORG_OWNER, ORG_ROLES.ORG_ADMIN];
const ORG_OWNER_ONLY = [ORG_ROLES.ORG_OWNER];

// ============================================
// HELPER FUNCTIONS
// ============================================

function testOrgPermissionForAllRoles(entity, action, expectedAllowedRoles, description) {
  describe(description, () => {
    ALL_ORG_ROLES.forEach(role => {
      const shouldAllow = expectedAllowedRoles.includes(role);
      it(`should ${shouldAllow ? 'ALLOW' : 'DENY'} ${role}`, () => {
        expect(hasOrgPermission(role, entity, action)).toBe(shouldAllow);
      });
    });
  });
}

// ============================================
// ORG_ROLES CONSTANTS VALIDATION
// ============================================

describe('ORG_ROLES Constants', () => {
  it('should have all required org roles defined', () => {
    expect(ORG_ROLES.ORG_OWNER).toBe('org_owner');
    expect(ORG_ROLES.ORG_ADMIN).toBe('org_admin');
    expect(ORG_ROLES.ORG_MEMBER).toBe('org_member');
  });

  it('should have exactly 3 org roles', () => {
    expect(Object.keys(ORG_ROLES).length).toBe(3);
  });
});

// ============================================
// ORGANISATION ENTITY PERMISSIONS
// ============================================

describe('Organisation Entity Permissions', () => {
  testOrgPermissionForAllRoles(
    'organisation', 'view',
    ALL_ORG_ROLES,
    'organisation.view - all members can view'
  );

  testOrgPermissionForAllRoles(
    'organisation', 'edit',
    ORG_ADMINS,
    'organisation.edit - admins only'
  );

  testOrgPermissionForAllRoles(
    'organisation', 'delete',
    ORG_OWNER_ONLY,
    'organisation.delete - owner only'
  );

  testOrgPermissionForAllRoles(
    'organisation', 'manageBilling',
    ORG_OWNER_ONLY,
    'organisation.manageBilling - owner only'
  );

  testOrgPermissionForAllRoles(
    'organisation', 'viewBilling',
    ORG_ADMINS,
    'organisation.viewBilling - admins can view'
  );
});

// ============================================
// ORG MEMBERS PERMISSIONS
// ============================================

describe('Org Members Permissions', () => {
  testOrgPermissionForAllRoles(
    'orgMembers', 'view',
    ALL_ORG_ROLES,
    'orgMembers.view - all members can view'
  );

  testOrgPermissionForAllRoles(
    'orgMembers', 'invite',
    ORG_ADMINS,
    'orgMembers.invite - admins only'
  );

  testOrgPermissionForAllRoles(
    'orgMembers', 'remove',
    ORG_ADMINS,
    'orgMembers.remove - admins only'
  );

  testOrgPermissionForAllRoles(
    'orgMembers', 'changeRole',
    ORG_ADMINS,
    'orgMembers.changeRole - admins only'
  );

  testOrgPermissionForAllRoles(
    'orgMembers', 'promoteToOwner',
    ORG_OWNER_ONLY,
    'orgMembers.promoteToOwner - owner only'
  );
});

// ============================================
// ORG PROJECTS PERMISSIONS
// ============================================

describe('Org Projects Permissions', () => {
  testOrgPermissionForAllRoles(
    'orgProjects', 'view',
    ALL_ORG_ROLES,
    'orgProjects.view - all members can view'
  );

  testOrgPermissionForAllRoles(
    'orgProjects', 'create',
    ORG_ADMINS,
    'orgProjects.create - admins only'
  );

  testOrgPermissionForAllRoles(
    'orgProjects', 'delete',
    ORG_ADMINS,
    'orgProjects.delete - admins can delete'
  );

  testOrgPermissionForAllRoles(
    'orgProjects', 'assignMembers',
    ORG_ADMINS,
    'orgProjects.assignMembers - admins only'
  );
});

// ============================================
// ORG SETTINGS PERMISSIONS
// ============================================

describe('Org Settings Permissions', () => {
  testOrgPermissionForAllRoles(
    'orgSettings', 'view',
    ORG_ADMINS,
    'orgSettings.view - admins can view'
  );

  testOrgPermissionForAllRoles(
    'orgSettings', 'edit',
    ORG_ADMINS,
    'orgSettings.edit - admins only'
  );

  testOrgPermissionForAllRoles(
    'orgSettings', 'manageFeatures',
    ORG_OWNER_ONLY,
    'orgSettings.manageFeatures - owner only'
  );

  testOrgPermissionForAllRoles(
    'orgSettings', 'manageBranding',
    ORG_ADMINS,
    'orgSettings.manageBranding - admins only'
  );
});

// ============================================
// ROLE HELPER FUNCTIONS
// ============================================

describe('Role Helper Functions', () => {
  describe('isOrgAdminRole', () => {
    it('should return true for org_owner', () => {
      expect(isOrgAdminRole(ORG_ROLES.ORG_OWNER)).toBe(true);
    });

    it('should return true for org_admin', () => {
      expect(isOrgAdminRole(ORG_ROLES.ORG_ADMIN)).toBe(true);
    });

    it('should return false for org_member', () => {
      expect(isOrgAdminRole(ORG_ROLES.ORG_MEMBER)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isOrgAdminRole(null)).toBe(false);
      expect(isOrgAdminRole(undefined)).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(isOrgAdminRole('invalid_role')).toBe(false);
    });
  });

  describe('isOrgOwnerRole', () => {
    it('should return true only for org_owner', () => {
      expect(isOrgOwnerRole(ORG_ROLES.ORG_OWNER)).toBe(true);
    });

    it('should return false for org_admin', () => {
      expect(isOrgOwnerRole(ORG_ROLES.ORG_ADMIN)).toBe(false);
    });

    it('should return false for org_member', () => {
      expect(isOrgOwnerRole(ORG_ROLES.ORG_MEMBER)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isOrgOwnerRole(null)).toBe(false);
      expect(isOrgOwnerRole(undefined)).toBe(false);
    });
  });
});

// ============================================
// PERMISSION UTILITY FUNCTIONS
// ============================================

describe('Permission Utility Functions', () => {
  describe('getOrgPermissionsForRole', () => {
    it('should return all permissions for org_owner', () => {
      const perms = getOrgPermissionsForRole(ORG_ROLES.ORG_OWNER);
      
      expect(perms.organisation.view).toBe(true);
      expect(perms.organisation.edit).toBe(true);
      expect(perms.organisation.delete).toBe(true);
      expect(perms.organisation.manageBilling).toBe(true);
      expect(perms.orgMembers.promoteToOwner).toBe(true);
      expect(perms.orgSettings.manageFeatures).toBe(true);
    });

    it('should return admin permissions for org_admin', () => {
      const perms = getOrgPermissionsForRole(ORG_ROLES.ORG_ADMIN);
      
      expect(perms.organisation.view).toBe(true);
      expect(perms.organisation.edit).toBe(true);
      expect(perms.organisation.delete).toBe(false);
      expect(perms.organisation.manageBilling).toBe(false);
      expect(perms.orgMembers.invite).toBe(true);
      expect(perms.orgMembers.promoteToOwner).toBe(false);
    });

    it('should return limited permissions for org_member', () => {
      const perms = getOrgPermissionsForRole(ORG_ROLES.ORG_MEMBER);
      
      expect(perms.organisation.view).toBe(true);
      expect(perms.organisation.edit).toBe(false);
      expect(perms.organisation.delete).toBe(false);
      expect(perms.orgMembers.view).toBe(true);
      expect(perms.orgMembers.invite).toBe(false);
      expect(perms.orgProjects.view).toBe(true);
      expect(perms.orgProjects.create).toBe(false);
    });

    it('should return object with false values for invalid role', () => {
      const perms = getOrgPermissionsForRole('invalid_role');
      // The function returns an object with entities but all values false
      expect(perms.organisation.view).toBe(false);
    });
  });

  describe('getOrgRolesForPermission', () => {
    it('should return all roles for view permissions', () => {
      const roles = getOrgRolesForPermission('organisation', 'view');
      expect(roles).toContain(ORG_ROLES.ORG_OWNER);
      expect(roles).toContain(ORG_ROLES.ORG_ADMIN);
      expect(roles).toContain(ORG_ROLES.ORG_MEMBER);
    });

    it('should return admins for edit permissions', () => {
      const roles = getOrgRolesForPermission('organisation', 'edit');
      expect(roles).toContain(ORG_ROLES.ORG_OWNER);
      expect(roles).toContain(ORG_ROLES.ORG_ADMIN);
      expect(roles).not.toContain(ORG_ROLES.ORG_MEMBER);
    });

    it('should return only owner for delete permissions', () => {
      const roles = getOrgRolesForPermission('organisation', 'delete');
      expect(roles).toContain(ORG_ROLES.ORG_OWNER);
      expect(roles).not.toContain(ORG_ROLES.ORG_ADMIN);
      expect(roles).not.toContain(ORG_ROLES.ORG_MEMBER);
    });

    it('should return empty array for invalid entity', () => {
      const roles = getOrgRolesForPermission('invalid_entity', 'view');
      expect(roles).toEqual([]);
    });

    it('should return empty array for invalid action', () => {
      const roles = getOrgRolesForPermission('organisation', 'invalid_action');
      expect(roles).toEqual([]);
    });
  });
});

// ============================================
// hasOrgPermission EDGE CASES
// ============================================

describe('hasOrgPermission Edge Cases', () => {
  it('should return false for null role', () => {
    expect(hasOrgPermission(null, 'organisation', 'view')).toBe(false);
  });

  it('should return false for undefined role', () => {
    expect(hasOrgPermission(undefined, 'organisation', 'view')).toBe(false);
  });

  it('should return false for invalid entity', () => {
    expect(hasOrgPermission(ORG_ROLES.ORG_OWNER, 'invalid_entity', 'view')).toBe(false);
  });

  it('should return false for invalid action', () => {
    expect(hasOrgPermission(ORG_ROLES.ORG_OWNER, 'organisation', 'invalid_action')).toBe(false);
  });

  it('should return false for empty string role', () => {
    expect(hasOrgPermission('', 'organisation', 'view')).toBe(false);
  });
});

// ============================================
// ORG_ROLE_CONFIG UI CONFIGURATION
// ============================================

describe('ORG_ROLE_CONFIG UI Configuration', () => {
  it('should have config for all org roles', () => {
    ALL_ORG_ROLES.forEach(role => {
      expect(ORG_ROLE_CONFIG[role]).toBeDefined();
      expect(ORG_ROLE_CONFIG[role].label).toBeDefined();
      expect(ORG_ROLE_CONFIG[role].color).toBeDefined();
      expect(ORG_ROLE_CONFIG[role].bg).toBeDefined();
    });
  });

  it('should have descriptive labels', () => {
    expect(ORG_ROLE_CONFIG[ORG_ROLES.ORG_OWNER].label).toBe('Owner');
    expect(ORG_ROLE_CONFIG[ORG_ROLES.ORG_ADMIN].label).toBe('Admin');
    expect(ORG_ROLE_CONFIG[ORG_ROLES.ORG_MEMBER].label).toBe('Member');
  });

  it('should have valid color codes', () => {
    ALL_ORG_ROLES.forEach(role => {
      expect(ORG_ROLE_CONFIG[role].color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(ORG_ROLE_CONFIG[role].bg).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('should have descriptions', () => {
    ALL_ORG_ROLES.forEach(role => {
      expect(ORG_ROLE_CONFIG[role].description).toBeDefined();
      expect(typeof ORG_ROLE_CONFIG[role].description).toBe('string');
    });
  });
});

// ============================================
// ORG_ROLE_OPTIONS FOR DROPDOWNS
// ============================================

describe('ORG_ROLE_OPTIONS for Dropdowns', () => {
  it('should be an array', () => {
    expect(Array.isArray(ORG_ROLE_OPTIONS)).toBe(true);
  });

  it('should have options for all org roles', () => {
    expect(ORG_ROLE_OPTIONS.length).toBe(3);
  });

  it('should have value and label for each option', () => {
    ORG_ROLE_OPTIONS.forEach(option => {
      expect(option.value).toBeDefined();
      expect(option.label).toBeDefined();
      expect(ALL_ORG_ROLES).toContain(option.value);
    });
  });

  it('should be ordered by privilege (owner first)', () => {
    expect(ORG_ROLE_OPTIONS[0].value).toBe(ORG_ROLES.ORG_OWNER);
    expect(ORG_ROLE_OPTIONS[1].value).toBe(ORG_ROLES.ORG_ADMIN);
    expect(ORG_ROLE_OPTIONS[2].value).toBe(ORG_ROLES.ORG_MEMBER);
  });
});

// ============================================
// PERMISSION MATRIX COMPLETENESS
// ============================================

describe('ORG_PERMISSION_MATRIX Completeness', () => {
  const expectedEntities = ['organisation', 'orgMembers', 'orgProjects', 'orgSettings'];
  
  it('should have all expected entities', () => {
    expectedEntities.forEach(entity => {
      expect(ORG_PERMISSION_MATRIX[entity]).toBeDefined();
    });
  });

  it('organisation should have all required actions', () => {
    const expectedActions = ['view', 'edit', 'delete', 'manageBilling', 'viewBilling'];
    expectedActions.forEach(action => {
      expect(ORG_PERMISSION_MATRIX.organisation[action]).toBeDefined();
    });
  });

  it('orgMembers should have all required actions', () => {
    const expectedActions = ['view', 'invite', 'remove', 'changeRole', 'promoteToOwner'];
    expectedActions.forEach(action => {
      expect(ORG_PERMISSION_MATRIX.orgMembers[action]).toBeDefined();
    });
  });

  it('orgProjects should have all required actions', () => {
    const expectedActions = ['view', 'create', 'delete', 'assignMembers'];
    expectedActions.forEach(action => {
      expect(ORG_PERMISSION_MATRIX.orgProjects[action]).toBeDefined();
    });
  });

  it('orgSettings should have all required actions', () => {
    const expectedActions = ['view', 'edit', 'manageFeatures', 'manageBranding'];
    expectedActions.forEach(action => {
      expect(ORG_PERMISSION_MATRIX.orgSettings[action]).toBeDefined();
    });
  });

  it('all permission arrays should contain valid org roles', () => {
    Object.entries(ORG_PERMISSION_MATRIX).forEach(([entity, actions]) => {
      Object.entries(actions).forEach(([action, roles]) => {
        roles.forEach(role => {
          expect(ALL_ORG_ROLES).toContain(role);
        });
      });
    });
  });
});

// ============================================
// SECURITY BOUNDARIES
// ============================================

describe('Organisation Security Boundaries', () => {
  describe('Member cannot perform admin actions', () => {
    const adminActions = [
      ['organisation', 'edit'],
      ['organisation', 'delete'],
      ['orgMembers', 'invite'],
      ['orgMembers', 'remove'],
      ['orgMembers', 'changeRole'],
      ['orgProjects', 'create'],
      ['orgProjects', 'delete'],
      ['orgSettings', 'edit'],
    ];

    adminActions.forEach(([entity, action]) => {
      it(`org_member cannot ${action} ${entity}`, () => {
        expect(hasOrgPermission(ORG_ROLES.ORG_MEMBER, entity, action)).toBe(false);
      });
    });
  });

  describe('Admin cannot perform owner-only actions', () => {
    const ownerOnlyActions = [
      ['organisation', 'delete'],
      ['organisation', 'manageBilling'],
      ['orgMembers', 'promoteToOwner'],
      ['orgSettings', 'manageFeatures'],
    ];

    ownerOnlyActions.forEach(([entity, action]) => {
      it(`org_admin cannot ${action} ${entity}`, () => {
        expect(hasOrgPermission(ORG_ROLES.ORG_ADMIN, entity, action)).toBe(false);
      });
    });
  });

  describe('Owner has full access', () => {
    it('owner can perform all actions', () => {
      Object.entries(ORG_PERMISSION_MATRIX).forEach(([entity, actions]) => {
        Object.keys(actions).forEach(action => {
          expect(hasOrgPermission(ORG_ROLES.ORG_OWNER, entity, action)).toBe(true);
        });
      });
    });
  });

  describe('Admins can view settings', () => {
    const viewableEntities = ['organisation', 'orgMembers', 'orgProjects'];
    
    viewableEntities.forEach(entity => {
      ALL_ORG_ROLES.forEach(role => {
        it(`${role} can view ${entity}`, () => {
          expect(hasOrgPermission(role, entity, 'view')).toBe(true);
        });
      });
    });

    // orgSettings.view is admin-only
    it('org_owner can view orgSettings', () => {
      expect(hasOrgPermission(ORG_ROLES.ORG_OWNER, 'orgSettings', 'view')).toBe(true);
    });

    it('org_admin can view orgSettings', () => {
      expect(hasOrgPermission(ORG_ROLES.ORG_ADMIN, 'orgSettings', 'view')).toBe(true);
    });

    it('org_member cannot view orgSettings', () => {
      expect(hasOrgPermission(ORG_ROLES.ORG_MEMBER, 'orgSettings', 'view')).toBe(false);
    });
  });
});
