/**
 * Comprehensive Permission Matrix Tests
 * Location: src/__tests__/unit/permissions-matrix.test.js
 * Version: 3.0 - Updated for v3.0 role simplification (January 2026)
 *
 * Tests EVERY permission function against ALL roles.
 * This is the definitive test suite for permission logic.
 *
 * IMPORTANT: In v3.0, the project-level 'admin' role was removed.
 * - supplier_pm now has full admin capabilities
 * - ROLES.ADMIN is deprecated and maps to 'supplier_pm' for backwards compatibility
 * - Only 6 project roles now: supplier_pm, supplier_finance, customer_pm, customer_finance, contributor, viewer
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ROLES,
  PERMISSION_MATRIX,
  hasPermission,
  getPermissionsForRole,
} from '../../lib/permissionMatrix';

// Suppress deprecation warnings for tests that intentionally use ROLES.ADMIN
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

import {
  // Timesheets
  canAddTimesheet,
  canAddTimesheetForOthers,
  canApproveTimesheets,
  canSubmitTimesheets,
  canEditTimesheet,
  canDeleteTimesheet,
  canSubmitTimesheet,
  
  // Expenses
  canAddExpense,
  canAddExpenseForOthers,
  canValidateChargeableExpenses,
  canValidateNonChargeableExpenses,
  canEditExpense,
  canDeleteExpense,
  canValidateExpense,
  
  // Milestones
  canCreateMilestone,
  canEditMilestone,
  canDeleteMilestone,
  canUseGantt,
  canEditBilling,
  
  // Deliverables
  canCreateDeliverable,
  canEditDeliverable,
  canDeleteDeliverable,
  canReviewDeliverable,
  canMarkDeliverableDelivered,
  canSubmitDeliverable,
  
  // KPIs
  canManageKPIs,
  canAddKPI,
  canEditKPI,
  canDeleteKPI,
  
  // Quality Standards
  canManageQualityStandards,
  canAddQualityStandard,
  canEditQualityStandard,
  canDeleteQualityStandard,
  
  // Resources
  canManageResources,
  canAddResource,
  canEditResource,
  canDeleteResource,
  canSeeCostPrice,
  canSeeResourceType,
  canSeeMargins,
  
  // Partners
  canViewPartners,
  canManagePartners,
  canAddPartner,
  canEditPartner,
  canDeletePartner,
  
  // Variations
  canCreateVariation,
  canEditVariation,
  canDeleteVariation,
  canSubmitVariation,
  canSignVariationAsSupplier,
  canSignVariationAsCustomer,
  canRejectVariation,
  
  // Certificates
  canSignAsSupplier,
  canSignAsCustomer,
  canCreateCertificate,
  
  // Settings & Admin
  canAccessSettings,
  canEditSettings,
  canManageUsers,
  canViewUsers,
  canViewWorkflowSummary,
  
  // Invoices
  canGenerateCustomerInvoice,
  canGenerateThirdPartyInvoice,
  canViewMarginReports,
  canAccessReports,
  
  // Utilities
  hasMinRole,
  isOneOf,
  isFullAdmin,
  getRoleLabel,
} from '../../lib/permissions';

// ============================================
// ALL ROLES ARRAY FOR ITERATION
// v3.0: Admin role removed - supplier_pm has full capabilities
// ============================================

const ALL_ROLES = [
  // ROLES.ADMIN removed in v3.0 - now supplier_pm has full capabilities
  ROLES.SUPPLIER_PM,
  ROLES.SUPPLIER_FINANCE,
  ROLES.CUSTOMER_PM,
  ROLES.CUSTOMER_FINANCE,
  ROLES.CONTRIBUTOR,
  ROLES.VIEWER,
];

// v3.0: ROLES.ADMIN removed from these groups - supplier_pm has full capabilities
const SUPPLIER_SIDE = [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE];
const CUSTOMER_SIDE = [ROLES.CUSTOMER_PM, ROLES.CUSTOMER_FINANCE];
const MANAGERS = [ROLES.SUPPLIER_PM, ROLES.CUSTOMER_PM];
const WORKERS = [ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE, ROLES.CUSTOMER_FINANCE, ROLES.CONTRIBUTOR];
// Full management capabilities - supplier_pm only in v3.0
const FULL_MANAGEMENT = [ROLES.SUPPLIER_PM];

// ============================================
// HELPER FUNCTIONS
// ============================================

function testPermissionForAllRoles(permissionFn, expectedAllowedRoles, description) {
  describe(description, () => {
    ALL_ROLES.forEach(role => {
      const shouldAllow = expectedAllowedRoles.includes(role);
      it(`should ${shouldAllow ? 'ALLOW' : 'DENY'} ${role}`, () => {
        expect(permissionFn(role)).toBe(shouldAllow);
      });
    });
  });
}

// ============================================
// TIMESHEET PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('Timesheet Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canAddTimesheet,
    WORKERS,
    'canAddTimesheet'
  );

  testPermissionForAllRoles(
    canAddTimesheetForOthers,
    SUPPLIER_SIDE,
    'canAddTimesheetForOthers'
  );

  testPermissionForAllRoles(
    canApproveTimesheets,
    CUSTOMER_SIDE,
    'canApproveTimesheets'
  );

  testPermissionForAllRoles(
    canSubmitTimesheets,
    WORKERS,
    'canSubmitTimesheets'
  );

  describe('canEditTimesheet (object-level)', () => {
    const currentUserId = 'user-123';
    const otherUserId = 'user-456';

    describe('Admin/Supplier can edit ANY timesheet', () => {
      const timesheet = { status: 'Approved', created_by: otherUserId };
      
      [ROLES.ADMIN, ROLES.SUPPLIER_PM, ROLES.SUPPLIER_FINANCE].forEach(role => {
        it(`${role} can edit others approved timesheet`, () => {
          expect(canEditTimesheet(role, timesheet, currentUserId)).toBe(true);
        });
      });
    });

    describe('Owner can edit own Draft/Rejected', () => {
      [ROLES.CONTRIBUTOR, ROLES.CUSTOMER_FINANCE].forEach(role => {
        it(`${role} can edit own Draft`, () => {
          const timesheet = { status: 'Draft', created_by: currentUserId };
          expect(canEditTimesheet(role, timesheet, currentUserId)).toBe(true);
        });

        it(`${role} can edit own Rejected`, () => {
          const timesheet = { status: 'Rejected', created_by: currentUserId };
          expect(canEditTimesheet(role, timesheet, currentUserId)).toBe(true);
        });

        it(`${role} CANNOT edit own Submitted`, () => {
          const timesheet = { status: 'Submitted', created_by: currentUserId };
          expect(canEditTimesheet(role, timesheet, currentUserId)).toBe(false);
        });

        it(`${role} CANNOT edit own Approved`, () => {
          const timesheet = { status: 'Approved', created_by: currentUserId };
          expect(canEditTimesheet(role, timesheet, currentUserId)).toBe(false);
        });
      });
    });

    describe('Non-owner cannot edit', () => {
      const timesheet = { status: 'Draft', created_by: otherUserId };
      
      [ROLES.CONTRIBUTOR, ROLES.CUSTOMER_PM, ROLES.VIEWER].forEach(role => {
        it(`${role} CANNOT edit others Draft`, () => {
          expect(canEditTimesheet(role, timesheet, currentUserId)).toBe(false);
        });
      });
    });
  });

  describe('canDeleteTimesheet (object-level)', () => {
    const currentUserId = 'user-123';
    const otherUserId = 'user-456';

    describe('Supplier side can delete ANY', () => {
      const timesheet = { status: 'Submitted', created_by: otherUserId };
      
      SUPPLIER_SIDE.forEach(role => {
        it(`${role} can delete any timesheet`, () => {
          expect(canDeleteTimesheet(role, timesheet, currentUserId)).toBe(true);
        });
      });
    });

    describe('Owner can only delete Draft', () => {
      it('Contributor can delete own Draft', () => {
        const timesheet = { status: 'Draft', created_by: currentUserId };
        expect(canDeleteTimesheet(ROLES.CONTRIBUTOR, timesheet, currentUserId)).toBe(true);
      });

      it('Contributor CANNOT delete own Submitted', () => {
        const timesheet = { status: 'Submitted', created_by: currentUserId };
        expect(canDeleteTimesheet(ROLES.CONTRIBUTOR, timesheet, currentUserId)).toBe(false);
      });
    });
  });
});

// ============================================
// EXPENSE PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('Expense Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canAddExpense,
    WORKERS,
    'canAddExpense'
  );

  testPermissionForAllRoles(
    canAddExpenseForOthers,
    SUPPLIER_SIDE,
    'canAddExpenseForOthers'
  );

  testPermissionForAllRoles(
    canValidateChargeableExpenses,
    CUSTOMER_SIDE,
    'canValidateChargeableExpenses'
  );

  testPermissionForAllRoles(
    canValidateNonChargeableExpenses,
    SUPPLIER_SIDE,
    'canValidateNonChargeableExpenses'
  );

  describe('canValidateExpense (chargeable vs non-chargeable)', () => {
    it('Customer PM can validate chargeable Submitted expense', () => {
      const expense = { status: 'Submitted', chargeable_to_customer: true };
      expect(canValidateExpense(ROLES.CUSTOMER_PM, expense)).toBe(true);
    });

    it('Customer PM CANNOT validate non-chargeable expense', () => {
      const expense = { status: 'Submitted', chargeable_to_customer: false };
      expect(canValidateExpense(ROLES.CUSTOMER_PM, expense)).toBe(false);
    });

    it('Supplier PM can validate non-chargeable Submitted expense', () => {
      const expense = { status: 'Submitted', chargeable_to_customer: false };
      expect(canValidateExpense(ROLES.SUPPLIER_PM, expense)).toBe(true);
    });

    it('CANNOT validate Draft expense', () => {
      const expense = { status: 'Draft', chargeable_to_customer: true };
      expect(canValidateExpense(ROLES.CUSTOMER_PM, expense)).toBe(false);
    });
  });
});

// ============================================
// MILESTONE PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('Milestone Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canCreateMilestone,
    SUPPLIER_SIDE,
    'canCreateMilestone'
  );

  testPermissionForAllRoles(
    canEditMilestone,
    SUPPLIER_SIDE,
    'canEditMilestone'
  );

  testPermissionForAllRoles(
    canDeleteMilestone,
    FULL_MANAGEMENT,
    'canDeleteMilestone (supplier_pm only in v3.0)'
  );

  testPermissionForAllRoles(
    canUseGantt,
    SUPPLIER_SIDE,
    'canUseGantt'
  );

  testPermissionForAllRoles(
    canEditBilling,
    SUPPLIER_SIDE,
    'canEditBilling'
  );
});

// ============================================
// DELIVERABLE PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('Deliverable Permissions - Complete Matrix', () => {
  // v3.0: Only supplier_pm and contributors can create/edit deliverables (not customer_pm)
  testPermissionForAllRoles(
    canCreateDeliverable,
    [ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR],
    'canCreateDeliverable (v3.0: supplier_pm + contributor)'
  );

  testPermissionForAllRoles(
    canEditDeliverable,
    [ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR],
    'canEditDeliverable (v3.0: supplier_pm + contributor)'
  );

  testPermissionForAllRoles(
    canDeleteDeliverable,
    SUPPLIER_SIDE,
    'canDeleteDeliverable'
  );

  testPermissionForAllRoles(
    canReviewDeliverable,
    CUSTOMER_SIDE,
    'canReviewDeliverable'
  );

  testPermissionForAllRoles(
    canMarkDeliverableDelivered,
    CUSTOMER_SIDE,
    'canMarkDeliverableDelivered'
  );

  // v3.0: Only supplier_pm and contributors can submit deliverables
  testPermissionForAllRoles(
    canSubmitDeliverable,
    [ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR],
    'canSubmitDeliverable (v3.0: supplier_pm + contributor)'
  );
});


// ============================================
// KPI PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('KPI Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canManageKPIs,
    SUPPLIER_SIDE,
    'canManageKPIs'
  );

  testPermissionForAllRoles(
    canAddKPI,
    SUPPLIER_SIDE,
    'canAddKPI'
  );

  testPermissionForAllRoles(
    canEditKPI,
    SUPPLIER_SIDE,
    'canEditKPI'
  );

  testPermissionForAllRoles(
    canDeleteKPI,
    SUPPLIER_SIDE,
    'canDeleteKPI'
  );
});

// ============================================
// QUALITY STANDARDS PERMISSIONS
// ============================================

describe('Quality Standards Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canManageQualityStandards,
    SUPPLIER_SIDE,
    'canManageQualityStandards'
  );

  testPermissionForAllRoles(
    canAddQualityStandard,
    SUPPLIER_SIDE,
    'canAddQualityStandard'
  );

  testPermissionForAllRoles(
    canEditQualityStandard,
    SUPPLIER_SIDE,
    'canEditQualityStandard'
  );

  testPermissionForAllRoles(
    canDeleteQualityStandard,
    SUPPLIER_SIDE,
    'canDeleteQualityStandard'
  );
});

// ============================================
// RESOURCE PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('Resource Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canManageResources,
    SUPPLIER_SIDE,
    'canManageResources'
  );

  testPermissionForAllRoles(
    canAddResource,
    SUPPLIER_SIDE,
    'canAddResource'
  );

  testPermissionForAllRoles(
    canEditResource,
    SUPPLIER_SIDE,
    'canEditResource'
  );

  testPermissionForAllRoles(
    canDeleteResource,
    FULL_MANAGEMENT,
    'canDeleteResource (supplier_pm only in v3.0)'
  );

  testPermissionForAllRoles(
    canSeeCostPrice,
    SUPPLIER_SIDE,
    'canSeeCostPrice (confidential)'
  );

  testPermissionForAllRoles(
    canSeeResourceType,
    SUPPLIER_SIDE,
    'canSeeResourceType'
  );

  testPermissionForAllRoles(
    canSeeMargins,
    SUPPLIER_SIDE,
    'canSeeMargins (confidential)'
  );
});

// ============================================
// PARTNER PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('Partner Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canViewPartners,
    SUPPLIER_SIDE,
    'canViewPartners (supplier only)'
  );

  testPermissionForAllRoles(
    canManagePartners,
    SUPPLIER_SIDE,
    'canManagePartners'
  );

  testPermissionForAllRoles(
    canAddPartner,
    SUPPLIER_SIDE,
    'canAddPartner'
  );

  testPermissionForAllRoles(
    canEditPartner,
    SUPPLIER_SIDE,
    'canEditPartner'
  );

  testPermissionForAllRoles(
    canDeletePartner,
    SUPPLIER_SIDE,
    'canDeletePartner'
  );
});

// ============================================
// VARIATION PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('Variation Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canCreateVariation,
    SUPPLIER_SIDE,
    'canCreateVariation'
  );

  testPermissionForAllRoles(
    canEditVariation,
    SUPPLIER_SIDE,
    'canEditVariation'
  );

  testPermissionForAllRoles(
    canDeleteVariation,
    SUPPLIER_SIDE,
    'canDeleteVariation'
  );

  testPermissionForAllRoles(
    canSubmitVariation,
    SUPPLIER_SIDE,
    'canSubmitVariation'
  );

  testPermissionForAllRoles(
    canSignVariationAsSupplier,
    SUPPLIER_SIDE,
    'canSignVariationAsSupplier'
  );

  testPermissionForAllRoles(
    canSignVariationAsCustomer,
    CUSTOMER_SIDE,
    'canSignVariationAsCustomer'
  );

  testPermissionForAllRoles(
    canRejectVariation,
    MANAGERS,
    'canRejectVariation'
  );
});

// ============================================
// CERTIFICATE PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('Certificate Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canSignAsSupplier,
    SUPPLIER_SIDE,
    'canSignAsSupplier'
  );

  testPermissionForAllRoles(
    canSignAsCustomer,
    CUSTOMER_SIDE,
    'canSignAsCustomer'
  );

  testPermissionForAllRoles(
    canCreateCertificate,
    MANAGERS,
    'canCreateCertificate'
  );
});

// ============================================
// SETTINGS & ADMIN PERMISSIONS
// ============================================

describe('Settings & Admin Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canAccessSettings,
    SUPPLIER_SIDE,
    'canAccessSettings'
  );

  testPermissionForAllRoles(
    canEditSettings,
    SUPPLIER_SIDE,
    'canEditSettings'
  );

  testPermissionForAllRoles(
    canManageUsers,
    FULL_MANAGEMENT,
    'canManageUsers (supplier_pm only in v3.0)'
  );

  testPermissionForAllRoles(
    canViewUsers,
    SUPPLIER_SIDE,
    'canViewUsers'
  );

  testPermissionForAllRoles(
    canViewWorkflowSummary,
    MANAGERS,
    'canViewWorkflowSummary'
  );

  testPermissionForAllRoles(
    canAccessReports,
    MANAGERS,
    'canAccessReports'
  );
});

// ============================================
// INVOICE PERMISSIONS - COMPLETE MATRIX
// ============================================

describe('Invoice Permissions - Complete Matrix', () => {
  testPermissionForAllRoles(
    canGenerateCustomerInvoice,
    MANAGERS,
    'canGenerateCustomerInvoice'
  );

  testPermissionForAllRoles(
    canGenerateThirdPartyInvoice,
    SUPPLIER_SIDE,
    'canGenerateThirdPartyInvoice (confidential)'
  );

  testPermissionForAllRoles(
    canViewMarginReports,
    SUPPLIER_SIDE,
    'canViewMarginReports (confidential)'
  );
});


// ============================================
// UTILITY FUNCTIONS
// ============================================

describe('Utility Functions', () => {
  describe('hasMinRole', () => {
    it('Supplier PM has min role of everyone (v3.0)', () => {
      // In v3.0, supplier_pm is the highest role
      ALL_ROLES.forEach(role => {
        expect(hasMinRole(ROLES.SUPPLIER_PM, role)).toBe(true);
      });
    });

    it('Viewer only has min role of Viewer', () => {
      expect(hasMinRole(ROLES.VIEWER, ROLES.VIEWER)).toBe(true);
      expect(hasMinRole(ROLES.VIEWER, ROLES.CONTRIBUTOR)).toBe(false);
      expect(hasMinRole(ROLES.VIEWER, ROLES.SUPPLIER_PM)).toBe(false);
    });
  });

  describe('isOneOf', () => {
    it('correctly identifies role membership', () => {
      expect(isOneOf(ROLES.SUPPLIER_PM, SUPPLIER_SIDE)).toBe(true);
      expect(isOneOf(ROLES.CUSTOMER_PM, CUSTOMER_SIDE)).toBe(true);
      expect(isOneOf(ROLES.CONTRIBUTOR, SUPPLIER_SIDE)).toBe(false);
      expect(isOneOf(ROLES.VIEWER, WORKERS)).toBe(false);
    });
  });

  describe('isFullAdmin', () => {
    it('only supplier_pm is full admin in v3.0', () => {
      // v3.0: ROLES.ADMIN is deprecated and maps to supplier_pm
      expect(isFullAdmin(ROLES.SUPPLIER_PM)).toBe(true);
      expect(isFullAdmin(ROLES.SUPPLIER_FINANCE)).toBe(false);
      expect(isFullAdmin(ROLES.CUSTOMER_PM)).toBe(false);
      expect(isFullAdmin(ROLES.CONTRIBUTOR)).toBe(false);
      expect(isFullAdmin(ROLES.VIEWER)).toBe(false);
    });
  });

  describe('getRoleLabel', () => {
    it('returns human-readable labels (v3.0)', () => {
      // v3.0: No separate admin role - ROLES.ADMIN maps to supplier_pm
      expect(getRoleLabel(ROLES.SUPPLIER_PM)).toBe('Supplier PM');
      expect(getRoleLabel(ROLES.SUPPLIER_FINANCE)).toBe('Supplier Finance');
      expect(getRoleLabel(ROLES.CUSTOMER_PM)).toBe('Customer PM');
      expect(getRoleLabel(ROLES.CUSTOMER_FINANCE)).toBe('Customer Finance');
      expect(getRoleLabel(ROLES.CONTRIBUTOR)).toBe('Contributor');
      expect(getRoleLabel(ROLES.VIEWER)).toBe('Viewer');
    });
  });
});

// ============================================
// PERMISSION MATRIX VALIDATION
// ============================================

describe('Permission Matrix Validation', () => {
  describe('hasPermission direct access', () => {
    it('correctly checks matrix permissions (v3.0)', () => {
      // All roles can view timesheets
      ALL_ROLES.forEach(role => {
        expect(hasPermission(role, 'timesheets', 'view')).toBe(true);
      });

      // v3.0: supplier_pm can manage users (full capabilities)
      expect(hasPermission(ROLES.SUPPLIER_PM, 'users', 'manage')).toBe(true);
      expect(hasPermission(ROLES.CUSTOMER_PM, 'users', 'manage')).toBe(false);
    });

    it('returns false for invalid entity', () => {
      expect(hasPermission(ROLES.SUPPLIER_PM, 'invalid_entity', 'view')).toBe(false);
    });

    it('returns false for invalid action', () => {
      expect(hasPermission(ROLES.SUPPLIER_PM, 'timesheets', 'invalid_action')).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('returns complete permission object for supplier_pm (v3.0)', () => {
      // In v3.0, supplier_pm has full admin capabilities
      const perms = getPermissionsForRole(ROLES.SUPPLIER_PM);

      expect(perms.timesheets.view).toBe(true);
      expect(perms.timesheets.create).toBe(true);
      // Note: supplier_pm cannot approve timesheets (customer side approves)
      expect(perms.timesheets.approve).toBe(false);
      expect(perms.users.manage).toBe(true);
    });

    it('returns restricted permissions for viewer', () => {
      const perms = getPermissionsForRole(ROLES.VIEWER);

      expect(perms.timesheets.view).toBe(true);
      expect(perms.timesheets.create).toBe(false);
      expect(perms.timesheets.approve).toBe(false);
      expect(perms.users.manage).toBe(false);
    });
  });

  describe('Matrix completeness', () => {
    it('most entities have view permission', () => {
      // Note: settings and users don't have 'view' - they use 'access' instead
      const entitiesWithView = ['timesheets', 'expenses', 'milestones', 'deliverables', 
        'kpis', 'qualityStandards', 'raid', 'resources', 'partners', 'variations', 'certificates', 'invoices'];
      entitiesWithView.forEach(entity => {
        expect(PERMISSION_MATRIX[entity].view).toBeDefined();
      });
    });

    it('all permission arrays contain valid roles', () => {
      const validRoles = Object.values(ROLES);
      
      Object.entries(PERMISSION_MATRIX).forEach(([entity, actions]) => {
        Object.entries(actions).forEach(([action, roles]) => {
          roles.forEach(role => {
            expect(validRoles).toContain(role);
          });
        });
      });
    });
  });
});

// ============================================
// SECURITY BOUNDARIES
// ============================================

describe('Security Boundaries', () => {
  describe('Viewer cannot modify anything', () => {
    it('viewer cannot create any entity', () => {
      expect(canAddTimesheet(ROLES.VIEWER)).toBe(false);
      expect(canAddExpense(ROLES.VIEWER)).toBe(false);
      expect(canCreateMilestone(ROLES.VIEWER)).toBe(false);
      expect(canCreateDeliverable(ROLES.VIEWER)).toBe(false);
      expect(canAddKPI(ROLES.VIEWER)).toBe(false);
      expect(canAddResource(ROLES.VIEWER)).toBe(false);
      expect(canAddPartner(ROLES.VIEWER)).toBe(false);
      expect(canCreateVariation(ROLES.VIEWER)).toBe(false);
    });

    it('viewer cannot delete anything', () => {
      // Note: Viewers can't create timesheets, so they'd never have one to delete
      // But if they somehow had a Draft, the owner-based logic would allow it
      // This tests the role-based delete permissions (not ownership)
      expect(canDeleteMilestone(ROLES.VIEWER)).toBe(false);
      expect(canDeleteDeliverable(ROLES.VIEWER)).toBe(false);
      expect(canDeleteResource(ROLES.VIEWER)).toBe(false);
    });
  });

  describe('Confidential data protection', () => {
    it('customer cannot see supplier costs/margins', () => {
      expect(canSeeCostPrice(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canSeeCostPrice(ROLES.CUSTOMER_FINANCE)).toBe(false);
      expect(canSeeMargins(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canSeeMargins(ROLES.CUSTOMER_FINANCE)).toBe(false);
    });

    it('customer cannot see partners', () => {
      expect(canViewPartners(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canViewPartners(ROLES.CUSTOMER_FINANCE)).toBe(false);
      expect(canViewPartners(ROLES.CONTRIBUTOR)).toBe(false);
    });

    it('customer cannot generate third-party invoices', () => {
      expect(canGenerateThirdPartyInvoice(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canGenerateThirdPartyInvoice(ROLES.CUSTOMER_FINANCE)).toBe(false);
    });
  });

  describe('Destructive operations require high privilege (v3.0)', () => {
    // In v3.0, supplier_pm has full admin capabilities
    it('supplier_pm can delete milestones (v3.0)', () => {
      expect(canDeleteMilestone(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canDeleteMilestone(ROLES.SUPPLIER_FINANCE)).toBe(false);
      expect(canDeleteMilestone(ROLES.CUSTOMER_PM)).toBe(false);
    });

    it('supplier_pm can delete resources (v3.0)', () => {
      expect(canDeleteResource(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canDeleteResource(ROLES.SUPPLIER_FINANCE)).toBe(false);
    });

    it('supplier_pm can manage users (v3.0)', () => {
      expect(canManageUsers(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canManageUsers(ROLES.SUPPLIER_FINANCE)).toBe(false);
    });
  });

  describe('Approval workflow enforcement', () => {
    it('customer side approves supplier work', () => {
      expect(canApproveTimesheets(ROLES.CUSTOMER_PM)).toBe(true);
      expect(canApproveTimesheets(ROLES.CUSTOMER_FINANCE)).toBe(true);
      expect(canApproveTimesheets(ROLES.SUPPLIER_PM)).toBe(false);
    });

    it('dual-sign for variations', () => {
      expect(canSignVariationAsSupplier(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canSignVariationAsSupplier(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canSignVariationAsCustomer(ROLES.CUSTOMER_PM)).toBe(true);
      expect(canSignVariationAsCustomer(ROLES.SUPPLIER_PM)).toBe(false);
    });
  });
});
