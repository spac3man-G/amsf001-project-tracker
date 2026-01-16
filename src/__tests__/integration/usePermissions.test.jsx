/**
 * Integration Tests for usePermissions Hook
 * Location: src/__tests__/integration/usePermissions.test.jsx
 * Version: 3.0 - Updated for v3.0 role simplification (January 2026)
 *
 * Tests the usePermissions hook with different context values
 *
 * IMPORTANT: In v3.0:
 * - ROLES.ADMIN is deprecated and maps to 'supplier_pm'
 * - supplier_pm has full admin capabilities EXCEPT approving timesheets/expenses (customer-side only)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../../hooks/usePermissions';
import { ROLES } from '../../lib/permissions';
import { AuthContext } from '../../contexts/AuthContext';
import { ViewAsContext } from '../../contexts/ViewAsContext';
import { ProjectContext } from '../../contexts/ProjectContext';

// Suppress deprecation warnings for tests that intentionally use ROLES.ADMIN
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================
// TEST WRAPPER FACTORY
// ============================================

function createWrapper({ role = 'contributor', userId = 'test-user-123', isImpersonating = false } = {}) {
  const authValue = {
    user: { id: userId, email: 'test@example.com' },
    profile: { id: userId, role },
    role,
    loading: false,
  };

  const viewAsValue = {
    effectiveRole: role,
    actualRole: role,
    isImpersonating,
    setViewAsRole: vi.fn(),
    resetViewAs: vi.fn(),
  };

  const projectValue = {
    currentProject: { id: 'project-1', name: 'Test Project' },
    projectRole: role,
    loading: false,
  };

  return function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={authValue}>
        <ProjectContext.Provider value={projectValue}>
          <ViewAsContext.Provider value={viewAsValue}>
            {children}
          </ViewAsContext.Provider>
        </ProjectContext.Provider>
      </AuthContext.Provider>
    );
  };
}

// ============================================
// BASIC HOOK FUNCTIONALITY
// ============================================

describe('usePermissions Hook', () => {
  describe('Basic functionality', () => {
    it('should return the current user role', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: 'admin' }),
      });

      expect(result.current.userRole).toBe('admin');
    });

    it('should return isImpersonating status', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: 'viewer', isImpersonating: true }),
      });

      expect(result.current.isImpersonating).toBe(true);
    });

    it('should return current user ID', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ userId: 'my-user-id' }),
      });

      expect(result.current.currentUserId).toBe('my-user-id');
    });
  });

  // ============================================
  // ADMIN ROLE TESTS (v3.0 - ROLES.ADMIN maps to supplier_pm)
  // ============================================

  describe('Admin role permissions (supplier_pm)', () => {
    it('should have full supplier-side access to timesheets', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.ADMIN }),
      });

      expect(result.current.canAddTimesheet).toBe(true);
      expect(result.current.canAddTimesheetForOthers).toBe(true);
      // In v3.0, supplier_pm cannot approve timesheets (customer-side only)
      expect(result.current.canApproveTimesheets).toBe(false);
    });

    it('should have full supplier-side access to expenses', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.ADMIN }),
      });

      expect(result.current.canAddExpense).toBe(true);
      expect(result.current.canAddExpenseForOthers).toBe(true);
      // In v3.0, supplier_pm cannot validate chargeable expenses (customer-side only)
      expect(result.current.canValidateChargeableExpenses).toBe(false);
      expect(result.current.canValidateNonChargeableExpenses).toBe(true);
    });

    it('should have full access to milestones', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.ADMIN }),
      });

      expect(result.current.canCreateMilestone).toBe(true);
      expect(result.current.canEditMilestone).toBe(true);
      expect(result.current.canDeleteMilestone).toBe(true);
    });

    it('should have full access to settings and users', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.ADMIN }),
      });

      expect(result.current.canAccessSettings).toBe(true);
      expect(result.current.canEditSettings).toBe(true);
      expect(result.current.canManageUsers).toBe(true);
    });

    it('should be identified as full admin', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.ADMIN }),
      });

      expect(result.current.isFullAdmin).toBe(true);
    });
  });

  // ============================================
  // CONTRIBUTOR ROLE TESTS
  // ============================================

  describe('Contributor role permissions', () => {
    it('should be able to add own timesheets only', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR }),
      });

      expect(result.current.canAddTimesheet).toBe(true);
      expect(result.current.canAddTimesheetForOthers).toBe(false);
      expect(result.current.canApproveTimesheets).toBe(false);
    });

    it('should be able to add own expenses only', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR }),
      });

      expect(result.current.canAddExpense).toBe(true);
      expect(result.current.canAddExpenseForOthers).toBe(false);
    });

    it('should be able to create and edit deliverables', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR }),
      });

      expect(result.current.canCreateDeliverable).toBe(true);
      expect(result.current.canEditDeliverable).toBe(true);
      expect(result.current.canDeleteDeliverable).toBe(false);
    });

    it('should not have access to settings or users', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR }),
      });

      expect(result.current.canAccessSettings).toBe(false);
      expect(result.current.canManageUsers).toBe(false);
    });

    it('should not be identified as full admin', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR }),
      });

      expect(result.current.isFullAdmin).toBe(false);
    });
  });

  // ============================================
  // VIEWER ROLE TESTS
  // ============================================

  describe('Viewer role permissions', () => {
    it('should not be able to add anything', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.VIEWER }),
      });

      expect(result.current.canAddTimesheet).toBe(false);
      expect(result.current.canAddExpense).toBe(false);
      expect(result.current.canCreateMilestone).toBe(false);
      expect(result.current.canCreateDeliverable).toBe(false);
    });

    it('should not have access to settings', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.VIEWER }),
      });

      expect(result.current.canAccessSettings).toBe(false);
      expect(result.current.canManageUsers).toBe(false);
    });
  });

  // ============================================
  // OBJECT-BASED PERMISSION TESTS
  // ============================================

  describe('Object-based permissions', () => {
    const userId = 'test-user-123';
    const otherUserId = 'other-user-456';

    it('should allow contributor to edit their own Draft timesheet', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR, userId }),
      });

      const myDraftTimesheet = { status: 'Draft', created_by: userId };
      expect(result.current.canEditTimesheet(myDraftTimesheet)).toBe(true);
    });

    it('should not allow contributor to edit someone else\'s timesheet', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR, userId }),
      });

      const otherTimesheet = { status: 'Draft', created_by: otherUserId };
      expect(result.current.canEditTimesheet(otherTimesheet)).toBe(false);
    });

    it('should not allow contributor to edit their Submitted timesheet', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR, userId }),
      });

      const submittedTimesheet = { status: 'Submitted', created_by: userId };
      expect(result.current.canEditTimesheet(submittedTimesheet)).toBe(false);
    });

    it('should allow admin to edit any timesheet', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.ADMIN, userId }),
      });

      const approvedTimesheet = { status: 'Approved', created_by: otherUserId };
      expect(result.current.canEditTimesheet(approvedTimesheet)).toBe(true);
    });

    it('should allow contributor to delete only their Draft timesheet', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR, userId }),
      });

      const draftTimesheet = { status: 'Draft', created_by: userId };
      const submittedTimesheet = { status: 'Submitted', created_by: userId };

      expect(result.current.canDeleteTimesheet(draftTimesheet)).toBe(true);
      expect(result.current.canDeleteTimesheet(submittedTimesheet)).toBe(false);
    });

    it('should allow contributor to submit their Draft timesheet', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR, userId }),
      });

      const draftTimesheet = { status: 'Draft', created_by: userId };
      expect(result.current.canSubmitTimesheet(draftTimesheet)).toBe(true);
    });

    it('should allow customer_pm to validate Submitted timesheet', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CUSTOMER_PM, userId }),
      });

      const submittedTimesheet = { status: 'Submitted', created_by: otherUserId };
      expect(result.current.canValidateTimesheet(submittedTimesheet)).toBe(true);
    });

    it('should not allow validation of Draft timesheet', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CUSTOMER_PM, userId }),
      });

      const draftTimesheet = { status: 'Draft', created_by: otherUserId };
      expect(result.current.canValidateTimesheet(draftTimesheet)).toBe(false);
    });
  });

  // ============================================
  // VIEW AS (IMPERSONATION) TESTS
  // ============================================

  describe('View As impersonation', () => {
    it('should use effective role when impersonating', () => {
      // Create a custom wrapper for impersonation scenario
      const wrapper = ({ children }) => {
        const authValue = {
          user: { id: 'admin-user' },
          profile: { role: 'admin' },
          role: 'admin',
          loading: false,
        };

        const viewAsValue = {
          effectiveRole: 'viewer', // Impersonating as viewer
          actualRole: 'admin',
          isImpersonating: true,
          setViewAsRole: vi.fn(),
          resetViewAs: vi.fn(),
        };

        const projectValue = {
          currentProject: { id: 'project-1' },
          projectRole: 'admin',
          loading: false,
        };

        return (
          <AuthContext.Provider value={authValue}>
            <ProjectContext.Provider value={projectValue}>
              <ViewAsContext.Provider value={viewAsValue}>
                {children}
              </ViewAsContext.Provider>
            </ProjectContext.Provider>
          </AuthContext.Provider>
        );
      };

      const { result } = renderHook(() => usePermissions(), { wrapper });

      // Should have viewer permissions even though actual role is admin
      expect(result.current.userRole).toBe('viewer');
      expect(result.current.actualRole).toBe('admin');
      expect(result.current.isImpersonating).toBe(true);
      expect(result.current.canAddTimesheet).toBe(false); // Viewers can't add
    });
  });

  // ============================================
  // UTILITY FUNCTION TESTS
  // ============================================

  describe('Utility functions', () => {
    it('hasRole should check if user has specific role', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.ADMIN }),
      });

      expect(result.current.hasRole([ROLES.ADMIN, ROLES.SUPPLIER_PM])).toBe(true);
      expect(result.current.hasRole([ROLES.VIEWER])).toBe(false);
    });

    it('can() should check permissions from the matrix', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.CONTRIBUTOR }),
      });

      expect(result.current.can('timesheets', 'view')).toBe(true);
      expect(result.current.can('timesheets', 'approve')).toBe(false);
    });

    it('getRoleLabel should return human-readable label', () => {
      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper({ role: ROLES.SUPPLIER_PM }),
      });

      const label = result.current.getRoleLabel();
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });
});
