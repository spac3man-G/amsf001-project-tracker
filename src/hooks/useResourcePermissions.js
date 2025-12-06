/**
 * useResourcePermissions Hook
 * 
 * Provides resource-specific permission checks for viewing, editing,
 * and financial visibility. This hook centralises all permission
 * logic for resource-related actions.
 * 
 * Financial visibility rules:
 * - Sell price: All roles can see (what customer pays)
 * - Cost price: Admin and Supplier PM only
 * - Margins: Admin and Supplier PM only
 * - Resource type: Admin and Supplier PM only
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from './usePermissions';

/**
 * Hook for resource-specific permissions.
 * 
 * @param {Object} resource - Optional resource object for context-aware permissions
 * @returns {Object} Permission flags
 * 
 * @example
 * const { canEdit, canSeeCostPrice, canSeeMargins } = useResourcePermissions();
 * 
 * @example
 * const { canDelete, canLinkToPartner } = useResourcePermissions(resource);
 */
export function useResourcePermissions(resource = null) {
  const { user, role: userRole, profile, linkedResource } = useAuth();
  const basePermissions = usePermissions();
  
  // Core role checks
  const isAdmin = userRole === 'admin';
  const isSupplierPM = userRole === 'supplier_pm';
  const isCustomerPM = userRole === 'customer_pm';
  const isContributor = userRole === 'contributor';
  
  // User identity
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';
  const currentUserResourceId = linkedResource?.id || null;
  
  // Check if this is the current user's resource
  const isOwnResource = (() => {
    if (!resource || !currentUserId) return false;
    return resource.user_id === currentUserId || resource.id === currentUserResourceId;
  })();
  
  // ============================================
  // BASIC PERMISSIONS
  // ============================================
  
  /**
   * Can the user view resources?
   * All authenticated users can view.
   */
  const canView = true;
  
  /**
   * Can the user create new resources?
   * Admin only.
   */
  const canCreate = isAdmin;
  
  /**
   * Can the user edit resources?
   * Admin and Supplier PM can edit.
   */
  const canEdit = basePermissions.canEditResource;
  
  /**
   * Can the user delete resources?
   * Admin only (due to cascade implications).
   */
  const canDelete = basePermissions.canDeleteResource;
  
  /**
   * Can the user manage resources (full CRUD)?
   * Admin and Supplier PM.
   */
  const canManage = basePermissions.canManageResources;
  
  // ============================================
  // FINANCIAL VISIBILITY PERMISSIONS
  // ============================================
  
  /**
   * Can the user see the sell price?
   * All roles can see sell price (what customer pays).
   */
  const canSeeSellPrice = true;
  
  /**
   * Can the user see the cost price?
   * Admin and Supplier PM only (internal cost).
   */
  const canSeeCostPrice = basePermissions.canSeeCostPrice;
  
  /**
   * Can the user see margin calculations?
   * Admin and Supplier PM only.
   */
  const canSeeMargins = basePermissions.canSeeMargins;
  
  /**
   * Can the user see the resource type (internal/third-party)?
   * Admin and Supplier PM only.
   */
  const canSeeResourceType = basePermissions.canSeeResourceType;
  
  /**
   * Can the user edit financial fields (cost price)?
   * Admin and Supplier PM only.
   */
  const canEditFinancials = isAdmin || isSupplierPM;
  
  // ============================================
  // PARTNER PERMISSIONS
  // ============================================
  
  /**
   * Can the user link resources to partners?
   * Admin and Supplier PM only (for third-party resources).
   */
  const canLinkToPartner = basePermissions.canManagePartners;
  
  /**
   * Can the user view partner information?
   * Admin and Supplier PM only.
   */
  const canViewPartner = basePermissions.canViewPartners;
  
  // ============================================
  // CONTEXT-AWARE PERMISSIONS (if resource provided)
  // ============================================
  
  /**
   * Can the user edit this specific resource?
   */
  const canEditThis = (() => {
    if (!resource) return canEdit;
    // Currently same as general edit permission
    // Could be extended for ownership-based restrictions
    return canEdit;
  })();
  
  /**
   * Can the user delete this specific resource?
   */
  const canDeleteThis = (() => {
    if (!resource) return canDelete;
    // Could check for dependencies or other restrictions
    return canDelete;
  })();
  
  // ============================================
  // RETURN OBJECT
  // ============================================
  
  return {
    // User identity
    currentUserId,
    currentUserName,
    currentUserResourceId,
    userRole,
    
    // Role checks
    isAdmin,
    isSupplierPM,
    isCustomerPM,
    isContributor,
    
    // Ownership
    isOwnResource,
    
    // Basic permissions
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManage,
    
    // Context-aware permissions
    canEditThis,
    canDeleteThis,
    
    // Financial visibility
    canSeeSellPrice,
    canSeeCostPrice,
    canSeeMargins,
    canSeeResourceType,
    canEditFinancials,
    
    // Partner permissions
    canLinkToPartner,
    canViewPartner
  };
}

export default useResourcePermissions;
