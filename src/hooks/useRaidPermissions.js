/**
 * useRaidPermissions Hook
 *
 * Provides RAID-specific permission checks for managing Risks,
 * Assumptions, Issues, and Dependencies.
 *
 * RAID items are typically managed by project managers (both supplier
 * and customer side) with delete restricted to supplier side.
 *
 * @version 2.0 - Uses effectiveRole from ViewAsContext for proper role resolution
 * @created 28 December 2025
 * @updated 15 January 2026 - Fixed role resolution to use ViewAsContext
 * @implements TD-001 Phase 2
 */

import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { usePermissions } from './usePermissions';

/**
 * Hook for RAID-specific permissions.
 *
 * @param {Object} raidItem - Optional RAID item for context-aware permissions
 * @returns {Object} Permission flags and helper functions
 *
 * @example
 * // Without item (for general permissions)
 * const { canAdd } = useRaidPermissions();
 *
 * @example
 * // With item (for object-specific permissions)
 * const { canEdit, canDelete } = useRaidPermissions(raidItem);
 */
export function useRaidPermissions(raidItem = null) {
  const { user, profile } = useAuth();

  // v2.0: Get effectiveRole from ViewAsContext - this properly resolves:
  // - System admin → supplier_pm
  // - Org admin → supplier_pm
  // - Project role → actual project role
  // - Respects View As impersonation
  const { effectiveRole: userRole } = useViewAs();
  const basePermissions = usePermissions();

  // Core role checks using effectiveRole
  // Note: v3.0 removed admin project role - supplier_pm now has full management capabilities
  const isSupplierPM = userRole === 'supplier_pm';
  const isSupplierFinance = userRole === 'supplier_finance';
  const isCustomerPM = userRole === 'customer_pm';
  const isContributor = userRole === 'contributor';
  const isViewer = userRole === 'viewer';

  // For backward compatibility, isAdmin maps to supplier_pm capabilities
  const isAdmin = isSupplierPM;

  // Role groupings
  const isManager = isSupplierPM || isCustomerPM;
  const isSupplierSide = isSupplierPM || isSupplierFinance;
  
  // User identity
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';
  
  // Ownership check - is user the owner of this RAID item?
  const isOwner = (() => {
    if (!raidItem || !currentUserId) return false;
    return raidItem.owner_user_id === currentUserId || 
           raidItem.created_by === currentUserId;
  })();
  
  // ============================================
  // SIMPLE PERMISSIONS (no item needed)
  // ============================================
  
  /**
   * Can the user view RAID items?
   * All authenticated users can view.
   */
  const canView = true;
  
  /**
   * Can the user add new RAID items?
   * Managers (Admin, Supplier PM, Customer PM) can add.
   */
  const canAdd = basePermissions.canManageRaid;
  
  /**
   * Can the user manage RAID items generally?
   * Managers can manage.
   */
  const canManage = basePermissions.canManageRaid;
  
  // ============================================
  // OBJECT-AWARE PERMISSIONS (need item)
  // ============================================
  
  /**
   * Can the user edit this RAID item?
   * Managers can edit any RAID item.
   */
  const canEdit = (() => {
    // General permission check (no item context)
    if (!raidItem) return isManager;
    
    // With item context - managers can edit
    return isManager;
  })();
  
  /**
   * Can the user delete this RAID item?
   * Only supplier side (Admin, Supplier PM, Supplier Finance) can delete.
   */
  const canDelete = (() => {
    // General permission check
    if (!raidItem) return isSupplierSide;
    
    // With item context - supplier side can delete
    return isSupplierSide;
  })();
  
  /**
   * Can the user update the status of this RAID item?
   * Managers can update status.
   */
  const canUpdateStatus = isManager;
  
  /**
   * Can the user assign an owner to this RAID item?
   * Managers can assign owners.
   */
  const canAssignOwner = isManager;
  
  /**
   * Can the user close this RAID item?
   * Managers can close items.
   */
  const canClose = isManager;
  
  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  
  /**
   * Check if user has one of the specified roles
   */
  const hasRole = (roles) => {
    if (!Array.isArray(roles)) roles = [roles];
    return roles.includes(userRole);
  };
  
  // ============================================
  // RETURN OBJECT
  // ============================================
  
  return {
    // User identity
    currentUserId,
    currentUserName,
    userRole,
    
    // Role checks
    isAdmin,
    isSupplierPM,
    isSupplierFinance,
    isCustomerPM,
    isContributor,
    isViewer,
    isManager,
    isSupplierSide,
    
    // Ownership
    isOwner,
    
    // Simple permissions
    canView,
    canAdd,
    canManage,
    
    // Object-aware permissions
    canEdit,
    canDelete,
    canUpdateStatus,
    canAssignOwner,
    canClose,
    
    // Helper functions
    hasRole
  };
}

export default useRaidPermissions;
