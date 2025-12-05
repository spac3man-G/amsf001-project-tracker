/**
 * useMilestonePermissions Hook
 * 
 * Provides milestone-specific permission checks for baseline commitment
 * and acceptance certificate workflows. This hook centralises all
 * permission logic for milestone-related actions.
 * 
 * @version 1.0
 * @created 5 December 2025
 */

import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from './usePermissions';
import { isBaselineLocked } from '../lib/milestoneCalculations';

/**
 * Hook for milestone-specific permissions.
 * 
 * @param {Object} milestone - Optional milestone object for context-aware permissions
 * @returns {Object} Permission flags and helper functions
 * 
 * @example
 * const { canEdit, canSignBaselineAsSupplier, isBaselineLocked } = useMilestonePermissions(milestone);
 */
export function useMilestonePermissions(milestone = null) {
  const { user, role: userRole, profile } = useAuth();
  const { 
    canEditMilestone, 
    canDeleteMilestone, 
    canSignAsSupplier, 
    canSignAsCustomer,
    canCreateCertificate 
  } = usePermissions();
  
  // Core role checks
  const isAdmin = userRole === 'admin';
  const isSupplierPM = userRole === 'supplier_pm';
  const isCustomerPM = userRole === 'customer_pm';
  
  // User identity
  const currentUserId = user?.id || null;
  const currentUserName = profile?.full_name || user?.email || 'Unknown';
  
  // Baseline lock status (from milestone data if provided)
  const baselineLocked = milestone ? isBaselineLocked(milestone) : false;
  
  // ============================================
  // BASIC PERMISSIONS
  // ============================================
  
  /**
   * Can the user view this milestone?
   * All authenticated users can view milestones.
   */
  const canView = true;
  
  /**
   * Can the user edit this milestone's core fields?
   * Admin and Supplier PM can edit.
   */
  const canEdit = canEditMilestone;
  
  /**
   * Can the user delete this milestone?
   * Only Admin can delete.
   */
  const canDelete = canDeleteMilestone;
  
  // ============================================
  // BASELINE PERMISSIONS
  // ============================================
  
  /**
   * Can the user edit baseline fields (dates, billable)?
   * - Admin can always edit (override capability)
   * - Supplier PM can edit if baseline is not locked
   */
  const canEditBaseline = isAdmin || (isSupplierPM && !baselineLocked);
  
  /**
   * Can the user sign the baseline as Supplier PM?
   * - Admin or Supplier PM can sign
   * - Cannot sign if already signed by this party
   * - Cannot sign if baseline is already locked
   */
  const canSignBaselineAsSupplier = (() => {
    if (!canSignAsSupplier) return false;
    if (baselineLocked) return false;
    if (milestone?.baseline_supplier_pm_signed_at) return false;
    return true;
  })();
  
  /**
   * Can the user sign the baseline as Customer PM?
   * - Only Customer PM can sign
   * - Cannot sign if already signed by this party
   * - Cannot sign if baseline is already locked
   */
  const canSignBaselineAsCustomer = (() => {
    if (!canSignAsCustomer) return false;
    if (baselineLocked) return false;
    if (milestone?.baseline_customer_pm_signed_at) return false;
    return true;
  })();
  
  /**
   * Can the user reset a locked baseline?
   * Only Admin can reset.
   */
  const canResetBaseline = isAdmin && baselineLocked;
  
  // ============================================
  // CERTIFICATE PERMISSIONS
  // ============================================
  
  /**
   * Can the user generate a certificate?
   * Admin, Supplier PM, or Customer PM can generate.
   * (Actual eligibility depends on deliverable status - checked separately)
   */
  const canGenerateCert = canCreateCertificate;
  
  /**
   * Can the user sign the certificate as Supplier PM?
   * - Admin or Supplier PM can sign
   * @param {Object} certificate - Certificate object to check
   */
  const canSignCertificateAsSupplier = (certificate) => {
    if (!canSignAsSupplier) return false;
    if (!certificate) return false;
    if (certificate.status === 'Signed') return false;
    if (certificate.supplier_pm_signed_at) return false;
    return true;
  };
  
  /**
   * Can the user sign the certificate as Customer PM?
   * - Only Customer PM can sign
   * @param {Object} certificate - Certificate object to check
   */
  const canSignCertificateAsCustomer = (certificate) => {
    if (!canSignAsCustomer) return false;
    if (!certificate) return false;
    if (certificate.status === 'Signed') return false;
    if (certificate.customer_pm_signed_at) return false;
    return true;
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
    isCustomerPM,
    
    // Basic permissions
    canView,
    canEdit,
    canDelete,
    
    // Baseline permissions
    canEditBaseline,
    canSignBaselineAsSupplier,
    canSignBaselineAsCustomer,
    canResetBaseline,
    isBaselineLocked: baselineLocked,
    
    // Certificate permissions
    canGenerateCertificate: canGenerateCert,
    canSignCertificateAsSupplier,
    canSignCertificateAsCustomer,
    
    // Legacy aliases for compatibility
    canSignAsSupplier,
    canSignAsCustomer
  };
}

export default useMilestonePermissions;
