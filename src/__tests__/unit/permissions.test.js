/**
 * Unit Tests for Permission Functions
 * Location: src/__tests__/unit/permissions.test.js
 * Version: 3.0 - Updated for v3.0 role simplification (January 2026)
 *
 * Tests the permission logic from lib/permissions.js
 *
 * IMPORTANT: In v3.0, the project-level 'admin' role was removed.
 * - supplier_pm now has full admin capabilities
 * - ROLES.ADMIN is deprecated and maps to 'supplier_pm' for backwards compatibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ROLES,
  hasPermission,
  hasMinRole,
  isOneOf,
  isFullAdmin,
  canAddTimesheet,
  canAddTimesheetForOthers,
  canApproveTimesheets,
  canEditTimesheet,
  canDeleteTimesheet,
  canSubmitTimesheet,
  canAddExpense,
  canEditExpense,
  canDeleteExpense,
  canValidateExpense,
  canCreateMilestone,
  canEditMilestone,
  canDeleteMilestone,
  canCreateDeliverable,
  canEditDeliverable,
  canDeleteDeliverable,
  canManageUsers,
  canAccessSettings,
} from '../../lib/permissions';

// Suppress deprecation warnings for tests that intentionally use ROLES.ADMIN
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================
// ROLE CONSTANTS
// ============================================

describe('ROLES constant', () => {
  it('should have all expected roles defined (v3.0 - admin removed)', () => {
    // Note: ROLES.ADMIN is deprecated in v3.0 and maps to 'supplier_pm' for backwards compatibility
    expect(ROLES.ADMIN).toBe('supplier_pm'); // Backward compatibility mapping
    expect(ROLES.SUPPLIER_PM).toBe('supplier_pm');
    expect(ROLES.SUPPLIER_FINANCE).toBe('supplier_finance');
    expect(ROLES.CUSTOMER_PM).toBe('customer_pm');
    expect(ROLES.CUSTOMER_FINANCE).toBe('customer_finance');
    expect(ROLES.CONTRIBUTOR).toBe('contributor');
    expect(ROLES.VIEWER).toBe('viewer');
  });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

describe('hasMinRole', () => {
  it('should return true when user has higher or equal role', () => {
    expect(hasMinRole(ROLES.ADMIN, ROLES.VIEWER)).toBe(true);
    expect(hasMinRole(ROLES.ADMIN, ROLES.ADMIN)).toBe(true);
    expect(hasMinRole(ROLES.SUPPLIER_PM, ROLES.CONTRIBUTOR)).toBe(true);
  });

  it('should return false when user has lower role', () => {
    expect(hasMinRole(ROLES.VIEWER, ROLES.ADMIN)).toBe(false);
    expect(hasMinRole(ROLES.CONTRIBUTOR, ROLES.SUPPLIER_PM)).toBe(false);
  });
});

describe('isOneOf', () => {
  it('should return true when role is in the list', () => {
    expect(isOneOf(ROLES.ADMIN, [ROLES.ADMIN, ROLES.SUPPLIER_PM])).toBe(true);
    expect(isOneOf(ROLES.VIEWER, [ROLES.VIEWER, ROLES.CONTRIBUTOR])).toBe(true);
  });

  it('should return false when role is not in the list', () => {
    expect(isOneOf(ROLES.VIEWER, [ROLES.ADMIN, ROLES.SUPPLIER_PM])).toBe(false);
    expect(isOneOf(ROLES.CONTRIBUTOR, [ROLES.ADMIN])).toBe(false);
  });
});

describe('isFullAdmin', () => {
  it('should return true for admin and supplier_pm', () => {
    expect(isFullAdmin(ROLES.ADMIN)).toBe(true);
    expect(isFullAdmin(ROLES.SUPPLIER_PM)).toBe(true);
  });

  it('should return false for all other roles', () => {
    expect(isFullAdmin(ROLES.SUPPLIER_FINANCE)).toBe(false);
    expect(isFullAdmin(ROLES.CUSTOMER_PM)).toBe(false);
    expect(isFullAdmin(ROLES.CUSTOMER_FINANCE)).toBe(false);
    expect(isFullAdmin(ROLES.CONTRIBUTOR)).toBe(false);
    expect(isFullAdmin(ROLES.VIEWER)).toBe(false);
  });
});

// ============================================
// TIMESHEET PERMISSIONS
// ============================================

describe('Timesheet Permissions', () => {
  describe('canAddTimesheet', () => {
    it('should allow workers to add timesheets', () => {
      expect(canAddTimesheet(ROLES.ADMIN)).toBe(true);
      expect(canAddTimesheet(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canAddTimesheet(ROLES.CONTRIBUTOR)).toBe(true);
    });

    it('should not allow viewers to add timesheets', () => {
      expect(canAddTimesheet(ROLES.VIEWER)).toBe(false);
    });
  });

  describe('canAddTimesheetForOthers', () => {
    it('should allow supplier side roles', () => {
      expect(canAddTimesheetForOthers(ROLES.ADMIN)).toBe(true);
      expect(canAddTimesheetForOthers(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canAddTimesheetForOthers(ROLES.SUPPLIER_FINANCE)).toBe(true);
    });

    it('should not allow customer side or contributors', () => {
      expect(canAddTimesheetForOthers(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canAddTimesheetForOthers(ROLES.CONTRIBUTOR)).toBe(false);
      expect(canAddTimesheetForOthers(ROLES.VIEWER)).toBe(false);
    });
  });

  describe('canApproveTimesheets', () => {
    it('should allow customer side roles only (v3.0)', () => {
      // In v3.0, only customer side can approve timesheets (not supplier_pm)
      expect(canApproveTimesheets(ROLES.CUSTOMER_PM)).toBe(true);
      expect(canApproveTimesheets(ROLES.CUSTOMER_FINANCE)).toBe(true);
    });

    it('should not allow supplier side or workers (v3.0)', () => {
      // In v3.0, supplier_pm cannot approve timesheets (they submit timesheets, customers approve)
      expect(canApproveTimesheets(ROLES.SUPPLIER_PM)).toBe(false);
      expect(canApproveTimesheets(ROLES.SUPPLIER_FINANCE)).toBe(false);
      expect(canApproveTimesheets(ROLES.CONTRIBUTOR)).toBe(false);
      expect(canApproveTimesheets(ROLES.VIEWER)).toBe(false);
    });
  });

  describe('canEditTimesheet', () => {
    const currentUserId = 'user-123';
    const otherUserId = 'user-456';

    it('should allow admin/supplier_pm to edit any timesheet', () => {
      const timesheet = { status: 'Approved', created_by: otherUserId };
      expect(canEditTimesheet(ROLES.ADMIN, timesheet, currentUserId)).toBe(true);
      expect(canEditTimesheet(ROLES.SUPPLIER_PM, timesheet, currentUserId)).toBe(true);
    });

    it('should allow owner to edit their Draft timesheet', () => {
      const timesheet = { status: 'Draft', created_by: currentUserId };
      expect(canEditTimesheet(ROLES.CONTRIBUTOR, timesheet, currentUserId)).toBe(true);
    });

    it('should allow owner to edit their Rejected timesheet', () => {
      const timesheet = { status: 'Rejected', created_by: currentUserId };
      expect(canEditTimesheet(ROLES.CONTRIBUTOR, timesheet, currentUserId)).toBe(true);
    });

    it('should not allow owner to edit Submitted or Approved timesheet', () => {
      const submittedTimesheet = { status: 'Submitted', created_by: currentUserId };
      const approvedTimesheet = { status: 'Approved', created_by: currentUserId };
      expect(canEditTimesheet(ROLES.CONTRIBUTOR, submittedTimesheet, currentUserId)).toBe(false);
      expect(canEditTimesheet(ROLES.CONTRIBUTOR, approvedTimesheet, currentUserId)).toBe(false);
    });

    it('should not allow non-owner to edit', () => {
      const timesheet = { status: 'Draft', created_by: otherUserId };
      expect(canEditTimesheet(ROLES.CONTRIBUTOR, timesheet, currentUserId)).toBe(false);
    });
  });

  describe('canDeleteTimesheet', () => {
    const currentUserId = 'user-123';
    const otherUserId = 'user-456';

    it('should allow admin to delete any timesheet', () => {
      const timesheet = { status: 'Submitted', created_by: otherUserId };
      expect(canDeleteTimesheet(ROLES.ADMIN, timesheet, currentUserId)).toBe(true);
    });

    it('should allow owner to delete only Draft timesheets', () => {
      const draftTimesheet = { status: 'Draft', created_by: currentUserId };
      const submittedTimesheet = { status: 'Submitted', created_by: currentUserId };
      
      expect(canDeleteTimesheet(ROLES.CONTRIBUTOR, draftTimesheet, currentUserId)).toBe(true);
      expect(canDeleteTimesheet(ROLES.CONTRIBUTOR, submittedTimesheet, currentUserId)).toBe(false);
    });
  });

  describe('canSubmitTimesheet', () => {
    const currentUserId = 'user-123';

    it('should allow owner to submit Draft timesheet', () => {
      const timesheet = { status: 'Draft', created_by: currentUserId };
      expect(canSubmitTimesheet(ROLES.CONTRIBUTOR, timesheet, currentUserId)).toBe(true);
    });

    it('should allow owner to submit Rejected timesheet', () => {
      const timesheet = { status: 'Rejected', created_by: currentUserId };
      expect(canSubmitTimesheet(ROLES.CONTRIBUTOR, timesheet, currentUserId)).toBe(true);
    });

    it('should not allow submit of already Submitted timesheet', () => {
      const timesheet = { status: 'Submitted', created_by: currentUserId };
      expect(canSubmitTimesheet(ROLES.CONTRIBUTOR, timesheet, currentUserId)).toBe(false);
    });
  });
});

// ============================================
// EXPENSE PERMISSIONS
// ============================================

describe('Expense Permissions', () => {
  describe('canAddExpense', () => {
    it('should allow workers to add expenses', () => {
      expect(canAddExpense(ROLES.ADMIN)).toBe(true);
      expect(canAddExpense(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canAddExpense(ROLES.CONTRIBUTOR)).toBe(true);
    });

    it('should not allow viewers to add expenses', () => {
      expect(canAddExpense(ROLES.VIEWER)).toBe(false);
    });
  });
});

// ============================================
// MILESTONE PERMISSIONS
// ============================================

describe('Milestone Permissions', () => {
  describe('canCreateMilestone', () => {
    it('should allow supplier side to create milestones', () => {
      expect(canCreateMilestone(ROLES.ADMIN)).toBe(true);
      expect(canCreateMilestone(ROLES.SUPPLIER_PM)).toBe(true);
    });

    it('should not allow customer side or contributors', () => {
      expect(canCreateMilestone(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canCreateMilestone(ROLES.CONTRIBUTOR)).toBe(false);
    });
  });

  describe('canDeleteMilestone', () => {
    it('should allow supplier_pm to delete milestones (v3.0)', () => {
      // In v3.0, supplier_pm has full management capabilities
      expect(canDeleteMilestone(ROLES.SUPPLIER_PM)).toBe(true);
    });

    it('should not allow other roles to delete milestones', () => {
      expect(canDeleteMilestone(ROLES.SUPPLIER_FINANCE)).toBe(false);
      expect(canDeleteMilestone(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canDeleteMilestone(ROLES.CONTRIBUTOR)).toBe(false);
    });
  });
});

// ============================================
// DELIVERABLE PERMISSIONS
// ============================================

describe('Deliverable Permissions', () => {
  describe('canCreateDeliverable', () => {
    it('should allow supplier_pm and contributors (v3.0)', () => {
      // In v3.0, only supplier_pm and contributors can create deliverables
      expect(canCreateDeliverable(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canCreateDeliverable(ROLES.CONTRIBUTOR)).toBe(true);
    });

    it('should not allow customer side, finance, or viewers (v3.0)', () => {
      // Customer PM cannot create deliverables (they review/accept them)
      expect(canCreateDeliverable(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canCreateDeliverable(ROLES.CUSTOMER_FINANCE)).toBe(false);
      expect(canCreateDeliverable(ROLES.SUPPLIER_FINANCE)).toBe(false);
      expect(canCreateDeliverable(ROLES.VIEWER)).toBe(false);
    });
  });

  describe('canDeleteDeliverable', () => {
    it('should only allow supplier side to delete', () => {
      expect(canDeleteDeliverable(ROLES.ADMIN)).toBe(true);
      expect(canDeleteDeliverable(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canDeleteDeliverable(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canDeleteDeliverable(ROLES.CONTRIBUTOR)).toBe(false);
    });
  });
});

// ============================================
// ADMIN PERMISSIONS
// ============================================

describe('Admin Permissions', () => {
  describe('canManageUsers', () => {
    it('should allow supplier_pm (v3.0 - has full management capabilities)', () => {
      // In v3.0, supplier_pm has full admin capabilities including user management
      expect(canManageUsers(ROLES.SUPPLIER_PM)).toBe(true);
    });

    it('should not allow other roles', () => {
      expect(canManageUsers(ROLES.SUPPLIER_FINANCE)).toBe(false);
      expect(canManageUsers(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canManageUsers(ROLES.CUSTOMER_FINANCE)).toBe(false);
      expect(canManageUsers(ROLES.CONTRIBUTOR)).toBe(false);
      expect(canManageUsers(ROLES.VIEWER)).toBe(false);
    });
  });

  describe('canAccessSettings', () => {
    it('should allow supplier side roles', () => {
      expect(canAccessSettings(ROLES.ADMIN)).toBe(true);
      expect(canAccessSettings(ROLES.SUPPLIER_PM)).toBe(true);
      expect(canAccessSettings(ROLES.SUPPLIER_FINANCE)).toBe(true);
    });

    it('should not allow customer side, contributors or viewers', () => {
      expect(canAccessSettings(ROLES.CUSTOMER_PM)).toBe(false);
      expect(canAccessSettings(ROLES.CUSTOMER_FINANCE)).toBe(false);
      expect(canAccessSettings(ROLES.CONTRIBUTOR)).toBe(false);
      expect(canAccessSettings(ROLES.VIEWER)).toBe(false);
    });
  });
});

// ============================================
// PERMISSION MATRIX DIRECT ACCESS
// ============================================

describe('hasPermission (matrix access)', () => {
  it('should correctly check permissions from the matrix', () => {
    expect(hasPermission(ROLES.ADMIN, 'timesheets', 'view')).toBe(true);
    expect(hasPermission(ROLES.VIEWER, 'timesheets', 'view')).toBe(true);
    expect(hasPermission(ROLES.VIEWER, 'timesheets', 'create')).toBe(false);
  });

  it('should return false for non-existent entity/action', () => {
    expect(hasPermission(ROLES.ADMIN, 'nonexistent', 'view')).toBe(false);
    expect(hasPermission(ROLES.ADMIN, 'timesheets', 'nonexistent')).toBe(false);
  });
});
