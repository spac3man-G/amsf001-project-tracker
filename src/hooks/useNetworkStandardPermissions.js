/**
 * useNetworkStandardPermissions Hook
 *
 * Provides Network Standard-specific permission checks.
 * Network standards are managed by supplier-side roles only.
 *
 * @version 2.0 - Uses effectiveRole from ViewAsContext for proper role resolution
 * @created 28 December 2025
 * @updated 15 January 2026 - Fixed role resolution to use ViewAsContext
 * @implements TD-001 Phase 5
 */

import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { usePermissions } from './usePermissions';

/**
 * Hook for Network Standard-specific permissions.
 *
 * @param {Object} standard - Optional standard object (not currently used but included for consistency)
 * @returns {Object} Permission flags
 *
 * @example
 * const { canEdit, canManage } = useNetworkStandardPermissions();
 */
export function useNetworkStandardPermissions(standard = null) {
  const { user, profile } = useAuth();

  // v2.0: Get effectiveRole from ViewAsContext - this properly resolves:
  // - System admin → supplier_pm
  // - Org admin → supplier_pm
  // - Project role → actual project role
  // - Respects View As impersonation
  const { effectiveRole: userRole } = useViewAs();
  const { can } = usePermissions();

  // Core role checks using effectiveRole
  // Note: v3.0 removed admin project role - supplier_pm now has full management capabilities
  const isSupplierPM = userRole === 'supplier_pm';
  const isSupplierFinance = userRole === 'supplier_finance';

  // For backward compatibility, isAdmin maps to supplier_pm capabilities
  const isAdmin = isSupplierPM;

  // Role groupings
  const isSupplierSide = isSupplierPM || isSupplierFinance;
  
  // User identity
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';
  
  // ============================================
  // PERMISSIONS
  // ============================================
  
  /**
   * Can the user view network standards?
   * All authenticated users can view.
   */
  const canView = true;
  
  /**
   * Can the user create network standards?
   * Supplier side only.
   */
  const canCreate = can('qualityStandards', 'create');
  
  /**
   * Can the user edit network standards?
   * Supplier side only.
   */
  const canEdit = can('qualityStandards', 'edit');
  
  /**
   * Can the user delete network standards?
   * Supplier side only.
   */
  const canDelete = can('qualityStandards', 'delete');
  
  /**
   * Can the user manage network standards?
   * Supplier side only.
   */
  const canManage = can('qualityStandards', 'manage');
  
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
    isSupplierSide,
    
    // Permissions
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage
  };
}

export default useNetworkStandardPermissions;
