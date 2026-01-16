/**
 * Organisation Permission Matrix Tests
 * Location: src/__tests__/unit/org-permissions.test.js
 * Version: 3.0 - Updated for v3.0 role simplification (January 2026)
 *
 * Tests organisation-level permissions for multi-tenancy.
 * Tests ORG_ROLES (org_admin, supplier_pm, org_member) and their permissions.
 *
 * IMPORTANT: In v3.0:
 * - supplier_pm was added as an org role with admin capabilities
 * - Both org_admin and supplier_pm can perform org admin actions
 * - org_admin is emergency backup admin (doesn't do project work)
 * - supplier_pm is full admin + active project participant
 *
 * @version 3.0
 * @created 22 December 2025
 * @updated January 2026 - v3.0 role simplification
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
// v3.0: Now includes supplier_pm as an org role
// ============================================

const ALL_ORG_ROLES = [
  ORG_ROLES.ORG_ADMIN,
  ORG_ROLES.SUPPLIER_PM,
  ORG_ROLES.ORG_MEMBER,
];

// v3.0: Both org_admin and supplier_pm have org admin capabilities
const ORG_ADMINS = [ORG_ROLES.ORG_ADMIN, ORG_ROLES.SUPPLIER_PM];

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
  it('should have all required org roles defined (v3.0)', () => {
    expect(ORG_ROLES.ORG_ADMIN).toBe('org_admin');
    expect(ORG_ROLES.SUPPLIER_PM).toBe('supplier_pm');
    expect(ORG_ROLES.ORG_MEMBER).toBe('org_member');
  });

  it('should have exactly 3 org roles (v3.0)', () => {
    expect(Object.keys(ORG_ROLES).length).toBe(3);
  });

  it('should NOT have org_owner role (removed in v2.0)', () => {
    expect(ORG_ROLES.ORG_OWNER).toBeUndefined();
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

  // v3.0: Only org_admin can delete (emergency action), not supplier_pm
  testOrgPermissionForAllRoles(
    'organisation', 'delete',
    [ORG_ROLES.ORG_ADMIN],
    'organisation.delete - org_admin only (emergency action)'
  );

  testOrgPermissionForAllRoles(
    'organisation', 'manageBilling',
    ORG_ADMINS,
    'organisation.manageBilling - admins can manage'
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

  // Note: promoteToOwner was removed in v2.0 (no owner role)
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

  // v3.0: Only org_admin can delete projects (emergency action), not supplier_pm
  testOrgPermissionForAllRoles(
    'orgProjects', 'delete',
    [ORG_ROLES.ORG_ADMIN],
    'orgProjects.delete - org_admin only (emergency action)'
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
    ORG_ADMINS,
    'orgSettings.manageFeatures - admins can manage'
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
    it('should return true for org_admin', () => {
      expect(isOrgAdminRole(ORG_ROLES.ORG_ADMIN)).toBe(true);
    });

    it('should return true for supplier_pm (v3.0)', () => {
      // In v3.0, supplier_pm has org admin capabilities
      expect(isOrgAdminRole(ORG_ROLES.SUPPLIER_PM)).toBe(true);
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

    it('should return false for legacy org_owner string', () => {
      expect(isOrgAdminRole('org_owner')).toBe(false);
    });
  });

  describe('isOrgOwnerRole (deprecated)', () => {
    // isOrgOwnerRole is deprecated but kept for backwards compatibility
    // It now returns true for org_admin and supplier_pm (since both have full control)
    it('should return true for org_admin (backwards compatible)', () => {
      expect(isOrgOwnerRole(ORG_ROLES.ORG_ADMIN)).toBe(true);
    });

    it('should return true for supplier_pm (v3.0)', () => {
      expect(isOrgOwnerRole(ORG_ROLES.SUPPLIER_PM)).toBe(true);
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
    it('should return all permissions for org_admin', () => {
      const perms = getOrgPermissionsForRole(ORG_ROLES.ORG_ADMIN);

      expect(perms.organisation.view).toBe(true);
      expect(perms.organisation.edit).toBe(true);
      expect(perms.organisation.delete).toBe(true);
      expect(perms.organisation.manageBilling).toBe(true);
      expect(perms.orgMembers.invite).toBe(true);
      expect(perms.orgMembers.changeRole).toBe(true);
      expect(perms.orgSettings.manageFeatures).toBe(true);
      expect(perms.orgProjects.create).toBe(true);
    });

    it('should return admin permissions for supplier_pm (v3.0)', () => {
      // In v3.0, supplier_pm has org admin capabilities EXCEPT delete
      const perms = getOrgPermissionsForRole(ORG_ROLES.SUPPLIER_PM);

      expect(perms.organisation.view).toBe(true);
      expect(perms.organisation.edit).toBe(true);
      expect(perms.organisation.delete).toBe(false); // Only org_admin can delete
      expect(perms.organisation.manageBilling).toBe(true);
      expect(perms.orgMembers.invite).toBe(true);
      expect(perms.orgMembers.changeRole).toBe(true);
      expect(perms.orgSettings.manageFeatures).toBe(true);
      expect(perms.orgProjects.create).toBe(true);
      expect(perms.orgProjects.delete).toBe(false); // Only org_admin can delete
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
      expect(perms.orgSettings.view).toBe(false);
    });

    it('should return object with false values for invalid role', () => {
      const perms = getOrgPermissionsForRole('invalid_role');
      expect(perms.organisation.view).toBe(false);
    });
  });

  describe('getOrgRolesForPermission', () => {
    it('should return all roles for view permissions', () => {
      const roles = getOrgRolesForPermission('organisation', 'view');
      expect(roles).toContain(ORG_ROLES.ORG_ADMIN);
      expect(roles).toContain(ORG_ROLES.SUPPLIER_PM);
      expect(roles).toContain(ORG_ROLES.ORG_MEMBER);
    });

    it('should return admin roles for edit permissions (v3.0)', () => {
      const roles = getOrgRolesForPermission('organisation', 'edit');
      expect(roles).toContain(ORG_ROLES.ORG_ADMIN);
      expect(roles).toContain(ORG_ROLES.SUPPLIER_PM);
      expect(roles).not.toContain(ORG_ROLES.ORG_MEMBER);
    });

    it('should return only org_admin for delete permissions (emergency action)', () => {
      const roles = getOrgRolesForPermission('organisation', 'delete');
      expect(roles).toContain(ORG_ROLES.ORG_ADMIN);
      expect(roles).not.toContain(ORG_ROLES.SUPPLIER_PM);
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
    expect(hasOrgPermission(ORG_ROLES.ORG_ADMIN, 'invalid_entity', 'view')).toBe(false);
  });

  it('should return false for invalid action', () => {
    expect(hasOrgPermission(ORG_ROLES.ORG_ADMIN, 'organisation', 'invalid_action')).toBe(false);
  });

  it('should return false for empty string role', () => {
    expect(hasOrgPermission('', 'organisation', 'view')).toBe(false);
  });

  it('should return false for legacy org_owner string', () => {
    expect(hasOrgPermission('org_owner', 'organisation', 'view')).toBe(false);
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

  it('should have descriptive labels (v3.0)', () => {
    expect(ORG_ROLE_CONFIG[ORG_ROLES.ORG_ADMIN].label).toBe('Organisation Admin');
    expect(ORG_ROLE_CONFIG[ORG_ROLES.SUPPLIER_PM].label).toBe('Supplier PM');
    expect(ORG_ROLE_CONFIG[ORG_ROLES.ORG_MEMBER].label).toBe('Member');
  });

  it('should NOT have config for org_owner (removed)', () => {
    expect(ORG_ROLE_CONFIG['org_owner']).toBeUndefined();
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

  it('should have options for all org roles (3 roles in v3.0)', () => {
    expect(ORG_ROLE_OPTIONS.length).toBe(3);
  });

  it('should have value and label for each option', () => {
    ORG_ROLE_OPTIONS.forEach(option => {
      expect(option.value).toBeDefined();
      expect(option.label).toBeDefined();
      expect(ALL_ORG_ROLES).toContain(option.value);
    });
  });

  it('should be ordered by privilege (org_admin first, then supplier_pm, then member)', () => {
    expect(ORG_ROLE_OPTIONS[0].value).toBe(ORG_ROLES.ORG_ADMIN);
    expect(ORG_ROLE_OPTIONS[1].value).toBe(ORG_ROLES.SUPPLIER_PM);
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
    // Note: promoteToOwner was removed in v2.0
    const expectedActions = ['view', 'invite', 'remove', 'changeRole'];
    expectedActions.forEach(action => {
      expect(ORG_PERMISSION_MATRIX.orgMembers[action]).toBeDefined();
    });
  });

  it('orgMembers should NOT have promoteToOwner (removed in v2.0)', () => {
    expect(ORG_PERMISSION_MATRIX.orgMembers.promoteToOwner).toBeUndefined();
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
      ['organisation', 'manageBilling'],
      ['orgMembers', 'invite'],
      ['orgMembers', 'remove'],
      ['orgMembers', 'changeRole'],
      ['orgProjects', 'create'],
      ['orgProjects', 'delete'],
      ['orgSettings', 'view'],
      ['orgSettings', 'edit'],
      ['orgSettings', 'manageFeatures'],
    ];

    adminActions.forEach(([entity, action]) => {
      it(`org_member cannot ${action} ${entity}`, () => {
        expect(hasOrgPermission(ORG_ROLES.ORG_MEMBER, entity, action)).toBe(false);
      });
    });
  });

  describe('org_admin has full access', () => {
    it('org_admin can perform all actions', () => {
      Object.entries(ORG_PERMISSION_MATRIX).forEach(([entity, actions]) => {
        Object.keys(actions).forEach(action => {
          expect(hasOrgPermission(ORG_ROLES.ORG_ADMIN, entity, action)).toBe(true);
        });
      });
    });
  });

  describe('supplier_pm has admin access except delete (v3.0)', () => {
    it('supplier_pm can perform most admin actions', () => {
      // Can do most admin actions
      expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, 'organisation', 'edit')).toBe(true);
      expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, 'organisation', 'manageBilling')).toBe(true);
      expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, 'orgMembers', 'invite')).toBe(true);
      expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, 'orgMembers', 'changeRole')).toBe(true);
      expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, 'orgProjects', 'create')).toBe(true);
      expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, 'orgSettings', 'edit')).toBe(true);
    });

    it('supplier_pm CANNOT delete (emergency action reserved for org_admin)', () => {
      expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, 'organisation', 'delete')).toBe(false);
      expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, 'orgProjects', 'delete')).toBe(false);
    });
  });

  describe('Members can view allowed entities', () => {
    const viewableEntities = ['organisation', 'orgMembers', 'orgProjects'];

    viewableEntities.forEach(entity => {
      it(`org_member can view ${entity}`, () => {
        expect(hasOrgPermission(ORG_ROLES.ORG_MEMBER, entity, 'view')).toBe(true);
      });

      it(`org_admin can view ${entity}`, () => {
        expect(hasOrgPermission(ORG_ROLES.ORG_ADMIN, entity, 'view')).toBe(true);
      });

      it(`supplier_pm can view ${entity}`, () => {
        expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, entity, 'view')).toBe(true);
      });
    });

    // orgSettings.view is admin-only (org_admin and supplier_pm)
    it('org_admin can view orgSettings', () => {
      expect(hasOrgPermission(ORG_ROLES.ORG_ADMIN, 'orgSettings', 'view')).toBe(true);
    });

    it('supplier_pm can view orgSettings (v3.0)', () => {
      expect(hasOrgPermission(ORG_ROLES.SUPPLIER_PM, 'orgSettings', 'view')).toBe(true);
    });

    it('org_member cannot view orgSettings', () => {
      expect(hasOrgPermission(ORG_ROLES.ORG_MEMBER, 'orgSettings', 'view')).toBe(false);
    });
  });
});
