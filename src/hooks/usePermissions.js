/**
 * AMSF001 Project Tracker - usePermissions Hook
 * Location: src/hooks/usePermissions.js
 * Version 5.1 - Workflow Settings Integration
 *
 * This hook provides pre-bound permission functions that automatically
 * inject the current user's EFFECTIVE role (which may be impersonated via View As).
 *
 * Role Resolution Chain (v5.0):
 * 1. OrganisationContext provides isSystemAdmin, isOrgAdmin
 * 2. ViewAsContext computes actualRole respecting hierarchy:
 *    - System Admin → 'admin'
 *    - Org Admin → 'admin' (within their org)
 *    - Project Role → from user_projects
 *    - Fallback → 'viewer'
 * 3. ViewAsContext provides effectiveRole (impersonated or actual)
 * 4. This hook uses effectiveRole for all permission checks
 *
 * Changes in v5.1:
 * - Added canApproveWithSettings() utility for workflow-settings-aware approval checks
 * - Added isFeatureEnabledWithSettings() utility for feature flag checks
 * - Added getApprovalAuthorityWithSettings() utility for authority lookups
 * - These utilities are used by entity-specific hooks (useTimesheetPermissions, etc.)
 *
 * Changes in v5.0:
 * - Added isSystemAdmin, isOrgAdmin, isOrgLevelAdmin from ViewAsContext
 * - These allow components to check org-level permissions directly
 * - effectiveRole now correctly reflects org admin hierarchy
 *
 * Changes in v4.0:
 * - Role now comes from project-scoped user_projects table
 * - Supports different roles on different projects
 * - View As impersonation still works on top of project role
 *
 * Changes in v3.0:
 * - Uses effectiveRole from ViewAsContext instead of actual role from AuthContext
 * - Permissions reflect the impersonated role when View As is active
 * - userId remains the actual user's ID (only role changes)
 *
 * Usage:
 *   import { usePermissions } from '../hooks/usePermissions';
 *
 *   function MyComponent() {
 *     const {
 *       canEditExpense,
 *       canAddTimesheet,
 *       isOrgLevelAdmin,  // NEW: true if system admin OR org admin
 *       isSystemAdmin,    // NEW: true if system admin
 *       isOrgAdmin,       // NEW: true if org admin
 *       can
 *     } = usePermissions();
 *
 *     return (
 *       <>
 *         {isOrgLevelAdmin && <AdminPanel />}
 *         {canAddTimesheet && <button>Add Timesheet</button>}
 *         {canEditExpense(expense) && <button>Edit</button>}
 *         {can('deliverables', 'edit') && <button>Edit Deliverable</button>}
 *       </>
 *     );
 *   }
 */

import { useAuth } from '../contexts/AuthContext';
import { useViewAs } from '../contexts/ViewAsContext';
import * as perms from '../lib/permissions';

// ============================================
// WORKFLOW SETTINGS UTILITY FUNCTIONS (v5.1)
// These are used by entity-specific permission hooks
// ============================================

/**
 * Map of entity types to their approval authority setting keys
 */
const AUTHORITY_SETTING_MAP = {
  baseline: 'baseline_approval',
  variation: 'variation_approval',
  certificate: 'certificate_approval',
  deliverable: 'deliverable_approval_authority',
  timesheet: 'timesheet_approval_authority',
  expense: 'expense_approval_authority'
};

/**
 * Map of feature names to their setting keys
 */
const FEATURE_SETTING_MAP = {
  baselines: 'baselines_required',
  variations: 'variations_enabled',
  certificates: 'certificates_required',
  milestone_billing: 'milestone_billing_enabled',
  deliverable_approval: 'deliverable_approval_required',
  deliverable_review: 'deliverable_review_required',
  quality_standards: 'quality_standards_enabled',
  kpis: 'kpis_enabled',
  timesheets: 'timesheets_enabled',
  timesheet_approval: 'timesheet_approval_required',
  expenses: 'expenses_enabled',
  expense_approval: 'expense_approval_required',
  expense_receipts: 'expense_receipt_required',
  raid: 'raid_enabled'
};

/**
 * Check if a feature is enabled based on project workflow settings
 * @param {Object} settings - Project workflow settings object
 * @param {string} feature - Feature name (e.g., 'timesheets', 'expenses', 'raid')
 * @returns {boolean} Whether the feature is enabled (defaults to true if not found)
 */
export function isFeatureEnabledWithSettings(settings, feature) {
  if (!settings) return true; // Default to enabled if no settings
  const settingKey = FEATURE_SETTING_MAP[feature];
  if (!settingKey) return true; // Unknown feature, default enabled
  const value = settings[settingKey];
  return value !== false; // Default to true if null/undefined
}

/**
 * Get the approval authority for an entity type from project settings
 * @param {Object} settings - Project workflow settings object
 * @param {string} entityType - Entity type (e.g., 'timesheet', 'expense', 'baseline')
 * @returns {string} Approval authority ('both', 'supplier_only', 'customer_only', 'either', 'conditional', 'none')
 */
export function getApprovalAuthorityWithSettings(settings, entityType) {
  if (!settings) return 'both'; // Default to dual approval if no settings
  const settingKey = AUTHORITY_SETTING_MAP[entityType];
  if (!settingKey) return 'both'; // Unknown entity type, default to both
  return settings[settingKey] || 'both';
}

/**
 * Check if a role can approve an entity based on workflow settings
 * @param {Object} settings - Project workflow settings object
 * @param {string} entityType - Entity type (e.g., 'timesheet', 'expense', 'baseline')
 * @param {string} role - User's project role
 * @param {Object} context - Additional context (e.g., { isChargeable: true } for expenses)
 * @returns {boolean} Whether the role can approve this entity type
 */
export function canApproveWithSettings(settings, entityType, role, context = {}) {
  const authority = getApprovalAuthorityWithSettings(settings, entityType);

  // Map roles to authority types
  const isSupplier = ['supplier_pm', 'admin', 'supplier_finance'].includes(role);
  const isCustomer = ['customer_pm', 'customer_finance'].includes(role);

  switch (authority) {
    case 'both':
      // Both sides must sign - either can sign their part
      return isSupplier || isCustomer;

    case 'supplier_only':
    case 'supplier_pm':
      return isSupplier;

    case 'customer_only':
    case 'customer_pm':
      return isCustomer;

    case 'none':
      // No approval required - anyone with edit permission can complete
      return true;

    case 'either':
      // Either party can approve alone
      return isSupplier || isCustomer;

    case 'conditional':
      // For expenses: chargeable → customer, non-chargeable → supplier
      if (entityType === 'expense') {
        return context.isChargeable ? isCustomer : isSupplier;
      }
      return isSupplier || isCustomer;

    default:
      return false;
  }
}

/**
 * Check if dual signature is required for an entity type
 * @param {Object} settings - Project workflow settings object
 * @param {string} entityType - Entity type
 * @returns {boolean} Whether dual signature is required
 */
export function requiresDualSignatureWithSettings(settings, entityType) {
  const authority = getApprovalAuthorityWithSettings(settings, entityType);
  return authority === 'both';
}

export function usePermissions() {
  const { user } = useAuth();

  // Get role information from ViewAsContext (supports impersonation and org hierarchy)
  // Falls back to 'viewer' if context not available
  let effectiveRole = 'viewer';
  let actualRole = 'viewer';
  let isImpersonating = false;
  let isSystemAdmin = false;
  let isOrgAdmin = false;
  let hasFullAdminCapabilities = false;

  try {
    const viewAs = useViewAs();
    effectiveRole = viewAs.effectiveRole || 'viewer';
    actualRole = viewAs.actualRole || 'viewer';
    isImpersonating = viewAs.isImpersonating || false;
    // These are now provided by ViewAsContext (from OrganisationContext)
    isSystemAdmin = viewAs.isSystemAdmin || false;
    isOrgAdmin = viewAs.isOrgAdmin || false;
    // v4.0: New capability flag from ViewAsContext
    hasFullAdminCapabilities = viewAs.hasFullAdminCapabilities || false;
  } catch (e) {
    // ViewAsContext not available, fall back to AuthContext role
    const auth = useAuth();
    effectiveRole = auth.role || 'viewer';
    actualRole = auth.role || 'viewer';
    // Check system admin from profile
    isSystemAdmin = auth.profile?.role === 'admin';
    hasFullAdminCapabilities = isSystemAdmin;
  }

  // Computed: Is user an org-level admin (either system admin or org admin)
  // This is useful for showing/hiding admin UI elements
  const isOrgLevelAdmin = isSystemAdmin || isOrgAdmin;
  
  // User ID is always the actual user (not impersonated)
  const currentUserId = user?.id || null;

  // Use effectiveRole for all permission checks
  const userRole = effectiveRole;

  // ============================================
  // DIRECT MATRIX ACCESS
  // Use this for simple permission checks
  // ============================================

  /**
   * Check permission directly from the matrix
   * @param {string} entity - Entity name (e.g., 'deliverables', 'timesheets')
   * @param {string} action - Action name (e.g., 'edit', 'delete', 'view')
   * @returns {boolean}
   * 
   * @example
   * const { can } = usePermissions();
   * if (can('deliverables', 'edit')) { ... }
   */
  const can = (entity, action) => perms.hasPermission(userRole, entity, action);

  // ============================================
  // SIMPLE ROLE-BASED PERMISSIONS (no object needed)
  // These return boolean values directly
  // ============================================

  const permissions = {
    // Role info
    userRole,           // Effective role (may be impersonated)
    actualRole,         // Actual role (never changes, respects org hierarchy)
    isImpersonating,    // Whether View As is active
    currentUserId,

    // ============================================
    // ORGANISATION-LEVEL ADMIN FLAGS (v5.0+)
    // Use these to check org-level permissions
    // ============================================

    /**
     * True if user is a system admin (profiles.role = 'admin')
     * System admins have full access to ALL organisations and projects
     */
    isSystemAdmin,

    /**
     * True if user is an org admin for the current organisation
     * Org admins have full access to all projects within their org
     */
    isOrgAdmin,

    /**
     * True if user is either a system admin OR org admin
     * Use this for showing/hiding admin UI elements
     *
     * @example
     * {isOrgLevelAdmin && <AdminSidebar />}
     */
    isOrgLevelAdmin,

    /**
     * v4.0: True if user has admin-level capabilities
     * This is true for system admins, org admins, or supplier_pm roles
     * Use this for permission checks that require admin-level access
     *
     * @example
     * {hasFullAdminCapabilities && <AdminFeature />}
     */
    hasFullAdminCapabilities,
    
    // Direct matrix access
    can,
    hasPermission: can,
    PERMISSION_MATRIX: perms.PERMISSION_MATRIX,
    
    // Timesheet permissions (simple)
    canAddTimesheet: perms.canAddTimesheet(userRole),
    canAddTimesheetForOthers: perms.canAddTimesheetForOthers(userRole),
    canApproveTimesheets: perms.canApproveTimesheets(userRole),
    canApproveTimesheet: perms.canApproveTimesheets(userRole), // Alias for singular form
    
    // Expense permissions (simple)
    canAddExpense: perms.canAddExpense(userRole),
    canAddExpenseForOthers: perms.canAddExpenseForOthers(userRole),
    canValidateChargeableExpenses: perms.canValidateChargeableExpenses(userRole),
    canValidateNonChargeableExpenses: perms.canValidateNonChargeableExpenses(userRole),
    
    // Milestone permissions
    canCreateMilestone: perms.canCreateMilestone(userRole),
    canEditMilestone: perms.canEditMilestone(userRole),
    canDeleteMilestone: perms.canDeleteMilestone(userRole),
    canUseGantt: perms.canUseGantt(userRole),
    canEditBilling: perms.canEditBilling(userRole),
    
    // Deliverable permissions (simple)
    canCreateDeliverable: perms.canCreateDeliverable(userRole),
    canEditDeliverable: perms.canEditDeliverable(userRole),
    canDeleteDeliverable: perms.canDeleteDeliverable(userRole),
    canReviewDeliverable: perms.canReviewDeliverable(userRole),
    canSubmitDeliverable: perms.canSubmitDeliverable(userRole),
    
    // KPI permissions
    canManageKPIs: perms.canManageKPIs(userRole),
    canAddKPI: perms.canAddKPI(userRole),
    canEditKPI: perms.canEditKPI(userRole),
    canDeleteKPI: perms.canDeleteKPI(userRole),
    
    // Quality Standards permissions
    canManageQualityStandards: perms.canManageQualityStandards(userRole),
    canAddQualityStandard: perms.canAddQualityStandard(userRole),
    canEditQualityStandard: perms.canEditQualityStandard(userRole),
    canDeleteQualityStandard: perms.canDeleteQualityStandard(userRole),

    // RAID permissions (using permission matrix)
    canManageRaid: perms.hasPermission(userRole, 'raid', 'manage'),
    canAddRaid: perms.hasPermission(userRole, 'raid', 'create'),
    canEditRaid: perms.hasPermission(userRole, 'raid', 'edit'),
    canDeleteRaid: perms.hasPermission(userRole, 'raid', 'delete'),

    // Resource permissions
    canManageResources: perms.canManageResources(userRole),
    canAddResource: perms.canAddResource(userRole),
    canEditResource: perms.canEditResource(userRole),
    canDeleteResource: perms.canDeleteResource(userRole),
    canSeeCostPrice: perms.canSeeCostPrice(userRole),
    canSeeResourceType: perms.canSeeResourceType(userRole),
    canSeeMargins: perms.canSeeMargins(userRole),
    
    // Partner permissions
    canViewPartners: perms.canViewPartners(userRole),
    canManagePartners: perms.canManagePartners(userRole),
    canAddPartner: perms.canAddPartner(userRole),
    canEditPartner: perms.canEditPartner(userRole),
    canDeletePartner: perms.canDeletePartner(userRole),
    
    // Variation permissions
    canCreateVariation: perms.canCreateVariation(userRole),
    canEditVariation: perms.canEditVariation(userRole),
    canDeleteVariation: perms.canDeleteVariation(userRole),
    canSubmitVariation: perms.canSubmitVariation(userRole),
    canSignVariationAsSupplier: perms.canSignVariationAsSupplier(userRole),
    canSignVariationAsCustomer: perms.canSignVariationAsCustomer(userRole),
    canRejectVariation: perms.canRejectVariation(userRole),
    
    // Certificate permissions
    canSignAsSupplier: perms.canSignAsSupplier(userRole),
    canSignAsCustomer: perms.canSignAsCustomer(userRole),
    canCreateCertificate: perms.canCreateCertificate(userRole),
    
    // Settings & Admin permissions
    canAccessSettings: perms.canAccessSettings(userRole),
    canEditSettings: perms.canEditSettings(userRole),
    canManageUsers: perms.canManageUsers(userRole),
    canViewUsers: perms.canViewUsers(userRole),
    canViewWorkflowSummary: perms.canViewWorkflowSummary(userRole),
    
    // Invoice permissions
    canGenerateCustomerInvoice: perms.canGenerateCustomerInvoice(userRole),
    canGenerateThirdPartyInvoice: perms.canGenerateThirdPartyInvoice(userRole),
    canViewMarginReports: perms.canViewMarginReports(userRole),
    canAccessReports: perms.canAccessReports(userRole),

    // ============================================
    // OBJECT-BASED PERMISSIONS (need the item)
    // These are functions that take the object
    // ============================================

    // Timesheet - object based
    /**
     * Check if user can edit this timesheet
     * @param {object} timesheet - The timesheet object
     * @returns {boolean}
     */
    canEditTimesheet: (timesheet) => 
      perms.canEditTimesheet(userRole, timesheet, currentUserId),
    
    /**
     * Check if user can delete this timesheet
     * @param {object} timesheet - The timesheet object
     * @returns {boolean}
     */
    canDeleteTimesheet: (timesheet) => 
      perms.canDeleteTimesheet(userRole, timesheet, currentUserId),
    
    /**
     * Check if user can submit this timesheet for approval
     * @param {object} timesheet - The timesheet object
     * @returns {boolean}
     */
    canSubmitTimesheet: (timesheet) => 
      perms.canSubmitTimesheet(userRole, timesheet, currentUserId),
    
    /**
     * Check if user can validate (approve/reject) this timesheet
     * Timesheets can only be validated when in Submitted status
     * @param {object} timesheet - The timesheet object
     * @returns {boolean}
     */
    canValidateTimesheet: (timesheet) => {
      if (timesheet.status !== 'Submitted') return false;
      return perms.canApproveTimesheets(userRole);
    },

    // Expense - object based
    /**
     * Check if user can submit this expense for validation
     * @param {object} expense - The expense object
     * @returns {boolean}
     */
    canSubmitExpense: (expense) => {
      // Can only submit Draft or Rejected expenses
      if (expense.status !== 'Draft' && expense.status !== 'Rejected') return false;
      if (perms.isOneOf(userRole, [perms.ROLES.ADMIN, perms.ROLES.SUPPLIER_PM])) return true;
      // Owner can submit their own
      return expense.created_by === currentUserId && perms.canAddExpense(userRole);
    },
    
    /**
     * Check if user can validate this expense
     * @param {object} expense - The expense object
     * @returns {boolean}
     */
    canValidateExpense: (expense) => 
      perms.canValidateExpense(userRole, expense),
    
    /**
     * Check if user can edit this expense
     * @param {object} expense - The expense object
     * @returns {boolean}
     */
    canEditExpense: (expense) => 
      perms.canEditExpense(userRole, expense, currentUserId),
    
    /**
     * Check if user can delete this expense
     * @param {object} expense - The expense object
     * @returns {boolean}
     */
    canDeleteExpense: (expense) => 
      perms.canDeleteExpense(userRole, expense, currentUserId),

    // Deliverable - object based
    /**
     * Check if user can update this deliverable's status
     * @param {object} deliverable - The deliverable object
     * @returns {boolean}
     */
    canUpdateDeliverableStatus: (deliverable) => 
      perms.canUpdateDeliverableStatus(userRole, deliverable, currentUserId),

    // ============================================
    // RESOURCE FILTERING HELPERS
    // ============================================

    /**
     * Get available resources for dropdown (filtered by permission)
     * @param {array} resources - All resources
     * @returns {array} Filtered resources
     */
    getAvailableResources: (resources) => 
      perms.getAvailableResourcesForEntry(userRole, resources, currentUserId),
    
    /**
     * Get the current user's linked resource
     * @param {array} resources - All resources
     * @returns {object|null} User's resource or null
     */
    getCurrentUserResource: (resources) => 
      perms.getCurrentUserResource(resources, currentUserId),
    
    /**
     * Get default resource for new entry
     * @param {array} resources - All resources
     * @returns {object|null} Default resource
     */
    getDefaultResource: (resources) => 
      perms.getDefaultResourceForEntry(userRole, resources, currentUserId),
    
    /**
     * Get default resource ID for new entry
     * @param {array} resources - All resources
     * @returns {string|null} Default resource ID
     */
    getDefaultResourceId: (resources) => 
      perms.getDefaultResourceId(userRole, resources, currentUserId),

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Get full permission summary (for debugging)
     * @returns {object} All permissions for current role
     */
    getPermissionSummary: () => 
      perms.getPermissionSummary(userRole),
    
    /**
     * Get role display config
     * @returns {object} { label, color, bg }
     */
    getRoleConfig: () => 
      perms.getRoleConfig(userRole),
    
    /**
     * Get role label for display
     * @returns {string} e.g., "Supplier PM"
     */
    getRoleLabel: () => 
      perms.getRoleLabel(userRole),

    // Export ROLES constant for convenience
    ROLES: perms.ROLES,
    ROLE_OPTIONS: perms.ROLE_OPTIONS,
    
    // ============================================
    // UTILITY - ROLE CHECK HELPERS
    // ============================================
    
    /**
     * Check if user has one of the specified roles
     * @param {string[]} roles - Array of role names to check
     * @returns {boolean}
     */
    hasRole: (roles) => perms.isOneOf(userRole, roles),

    /**
     * Check if user is admin or supplier PM
     * @returns {boolean}
     */
    isFullAdmin: perms.isFullAdmin(userRole),

    // ============================================
    // WORKFLOW SETTINGS UTILITIES (v5.1)
    // These methods require settings object to be passed in
    // Used by entity-specific hooks that have access to ProjectContext
    // ============================================

    /**
     * Check if a feature is enabled based on project workflow settings
     * @param {Object} settings - Project workflow settings object
     * @param {string} feature - Feature name
     * @returns {boolean}
     */
    isFeatureEnabled: (settings, feature) => isFeatureEnabledWithSettings(settings, feature),

    /**
     * Get approval authority for an entity type from settings
     * @param {Object} settings - Project workflow settings object
     * @param {string} entityType - Entity type
     * @returns {string}
     */
    getApprovalAuthority: (settings, entityType) => getApprovalAuthorityWithSettings(settings, entityType),

    /**
     * Check if current role can approve entity based on settings
     * @param {Object} settings - Project workflow settings object
     * @param {string} entityType - Entity type
     * @param {Object} context - Additional context (e.g., { isChargeable })
     * @returns {boolean}
     */
    canApproveEntity: (settings, entityType, context = {}) =>
      canApproveWithSettings(settings, entityType, userRole, context),

    /**
     * Check if dual signature is required for entity type
     * @param {Object} settings - Project workflow settings object
     * @param {string} entityType - Entity type
     * @returns {boolean}
     */
    requiresDualSignature: (settings, entityType) => requiresDualSignatureWithSettings(settings, entityType),
  };

  return permissions;
}

// Export the hook as default as well
export default usePermissions;
