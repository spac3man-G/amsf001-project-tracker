/**
 * useMilestonePermissions Hook
 *
 * Provides milestone-specific permission checks for baseline commitment
 * and acceptance certificate workflows. This hook centralises all
 * permission logic for milestone-related actions.
 *
 * @version 2.1 - Workflow settings awareness
 * @created 5 December 2025
 * @updated 15 January 2026 - Fixed role resolution to use ViewAsContext
 * @updated 16 January 2026 - Added workflow settings integration (WP-07)
 */

import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import {
  usePermissions,
  canApproveWithSettings,
  isFeatureEnabledWithSettings,
  requiresDualSignatureWithSettings
} from './usePermissions';
import { useProjectSettings } from './useProjectSettings';
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
  const { user, profile } = useAuth();

  // v2.0: Get effectiveRole from ViewAsContext - this properly resolves:
  // - System admin → supplier_pm
  // - Org admin → supplier_pm
  // - Project role → actual project role
  // - Respects View As impersonation
  const { effectiveRole: userRole, hasFullAdminCapabilities } = useViewAs();
  const {
    canEditMilestone,
    canDeleteMilestone,
    canSignAsSupplier,
    canSignAsCustomer,
    canCreateCertificate
  } = usePermissions();

  // v2.1: Get workflow settings for settings-aware permission checks
  const { settings: workflowSettings } = useProjectSettings();

  // Core role checks using effectiveRole
  // Note: v3.0 removed admin project role - supplier_pm now has full management capabilities
  // isAdmin now uses hasFullAdminCapabilities from ViewAsContext for admin-level override
  const isAdmin = hasFullAdminCapabilities;
  const isSupplierPM = userRole === 'supplier_pm';
  const isCustomerPM = userRole === 'customer_pm';

  // v2.1: Check if milestone workflow features are enabled for this project
  const baselinesRequired = isFeatureEnabledWithSettings(workflowSettings, 'baselines');
  const variationsEnabled = isFeatureEnabledWithSettings(workflowSettings, 'variations');
  const certificatesRequired = isFeatureEnabledWithSettings(workflowSettings, 'certificates');
  const milestoneBillingEnabled = isFeatureEnabledWithSettings(workflowSettings, 'milestone_billing');

  // v2.1: Check dual signature requirements from settings
  const baselineDualSignature = requiresDualSignatureWithSettings(workflowSettings, 'baseline');
  const certificateDualSignature = requiresDualSignatureWithSettings(workflowSettings, 'certificate');
  const variationDualSignature = requiresDualSignatureWithSettings(workflowSettings, 'variation');
  
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
   * - v2.1: Checks approval authority from workflow settings
   * - Cannot sign if already signed by this party
   * - Cannot sign if baseline is already locked
   */
  const canSignBaselineAsSupplier = (() => {
    if (!canSignAsSupplier) return false;
    if (baselineLocked) return false;
    if (milestone?.baseline_supplier_pm_signed_at) return false;
    // v2.1: Check if baselines require supplier signature based on settings
    // If baseline_approval is 'customer_only', supplier doesn't need to sign
    if (!canApproveWithSettings(workflowSettings, 'baseline', 'supplier_pm')) return false;
    return true;
  })();

  /**
   * Can the user sign the baseline as Customer PM?
   * - v2.1: Checks approval authority from workflow settings
   * - Cannot sign if already signed by this party
   * - Cannot sign if baseline is already locked
   */
  const canSignBaselineAsCustomer = (() => {
    if (!canSignAsCustomer) return false;
    if (baselineLocked) return false;
    if (milestone?.baseline_customer_pm_signed_at) return false;
    // v2.1: Check if baselines require customer signature based on settings
    // If baseline_approval is 'supplier_only', customer doesn't need to sign
    if (!canApproveWithSettings(workflowSettings, 'baseline', 'customer_pm')) return false;
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
   * - v2.1: Checks approval authority from workflow settings
   * @param {Object} certificate - Certificate object to check
   */
  const canSignCertificateAsSupplier = (certificate) => {
    if (!canSignAsSupplier) return false;
    if (!certificate) return false;
    if (certificate.status === 'Signed') return false;
    if (certificate.supplier_pm_signed_at) return false;
    // v2.1: Check if certificates require supplier signature based on settings
    if (!canApproveWithSettings(workflowSettings, 'certificate', 'supplier_pm')) return false;
    return true;
  };

  /**
   * Can the user sign the certificate as Customer PM?
   * - v2.1: Checks approval authority from workflow settings
   * @param {Object} certificate - Certificate object to check
   */
  const canSignCertificateAsCustomer = (certificate) => {
    if (!canSignAsCustomer) return false;
    if (!certificate) return false;
    if (certificate.status === 'Signed') return false;
    if (certificate.customer_pm_signed_at) return false;
    // v2.1: Check if certificates require customer signature based on settings
    if (!canApproveWithSettings(workflowSettings, 'certificate', 'customer_pm')) return false;
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

    // v2.1: Workflow settings flags
    baselinesRequired,
    variationsEnabled,
    certificatesRequired,
    milestoneBillingEnabled,
    baselineDualSignature,
    certificateDualSignature,
    variationDualSignature,
    workflowSettings,

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
