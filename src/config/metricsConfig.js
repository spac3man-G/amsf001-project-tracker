/**
 * Metrics Configuration
 * 
 * Central configuration for all metrics calculations across the application.
 * Defines valid statuses, calculation rules, and filtering criteria.
 * 
 * SINGLE SOURCE OF TRUTH for:
 * - Which statuses contribute to metrics
 * - How different entity types are filtered
 * - Calculation methodologies
 * 
 * @version 1.0
 * @created 3 December 2025
 */

/**
 * Status configurations for each entity type
 * Only items with these statuses contribute to metrics
 */
export const VALID_STATUSES = {
  // Timesheets that contribute to spend calculations
  timesheets: {
    contributeToSpend: ['Submitted', 'Validated', 'Approved'],
    excludeFromSpend: ['Draft', 'Rejected'],
    completed: ['Validated', 'Approved']
  },

  // Expenses that contribute to spend calculations
  expenses: {
    contributeToSpend: ['Submitted', 'Validated', 'Approved'],
    excludeFromSpend: ['Draft', 'Rejected'],
    completed: ['Validated', 'Approved']
  },

  // Deliverables and their contribution to KPI/QS metrics
  deliverables: {
    contributeToKPIs: ['Delivered'],
    contributeToQS: ['Delivered'],
    inProgress: ['In Progress', 'Submitted', 'Under Review'],
    completed: ['Delivered'],
    notStarted: ['Not Started', 'Draft']
  },

  // Milestones and their status tracking
  milestones: {
    completed: ['Completed'],
    inProgress: ['In Progress'],
    notStarted: ['Not Started', 'Planned']
  },

  // KPI achievement statuses
  kpis: {
    achieved: ['Achieved', 'On Target'],
    atRisk: ['At Risk', 'Amber'],
    failing: ['Failing', 'Red', 'Off Target']
  },

  // Quality Standard achievement
  qualityStandards: {
    achieved: ['Achieved', 'Met'],
    partial: ['Partial', 'In Progress'],
    notMet: ['Not Met', 'Failed']
  }
};

/**
 * Soft delete filter - applies to all entities
 * Records with is_deleted=true are ALWAYS excluded
 */
export const SOFT_DELETE_FILTER = {
  column: 'is_deleted',
  excludeValue: true,
  // Supabase filter: or('is_deleted.is.null,is_deleted.eq.false')
  supabaseFilter: 'is_deleted.is.null,is_deleted.eq.false'
};

/**
 * Test content filter - for excluding test data
 */
export const TEST_CONTENT_FILTER = {
  column: 'is_test_content',
  excludeValue: true,
  supabaseFilter: 'is_test_content.is.null,is_test_content.eq.false'
};

/**
 * PMO role identifiers for budget categorisation
 */
export const PMO_ROLE_IDENTIFIERS = ['pmo', 'project manager', 'pm'];

/**
 * Check if a role is PMO-related
 */
export function isPMORole(role) {
  if (!role) return false;
  const roleLower = role.toLowerCase();
  return PMO_ROLE_IDENTIFIERS.some(identifier => roleLower.includes(identifier));
}

/**
 * Check if a timesheet status contributes to spend
 */
export function timesheetContributesToSpend(status) {
  if (!status) return false;
  return VALID_STATUSES.timesheets.contributeToSpend.includes(status);
}

/**
 * Check if an expense status contributes to spend
 */
export function expenseContributesToSpend(status) {
  if (!status) return false;
  return VALID_STATUSES.expenses.contributeToSpend.includes(status);
}

/**
 * Check if a deliverable contributes to KPI metrics
 */
export function deliverableContributesToKPIs(status) {
  if (!status) return false;
  return VALID_STATUSES.deliverables.contributeToKPIs.includes(status);
}

/**
 * Check if a deliverable contributes to QS metrics
 */
export function deliverableContributesToQS(status) {
  if (!status) return false;
  return VALID_STATUSES.deliverables.contributeToQS.includes(status);
}

/**
 * Check if a milestone is completed
 */
export function milestoneIsCompleted(status) {
  if (!status) return false;
  return VALID_STATUSES.milestones.completed.includes(status);
}

/**
 * KPI achievement calculation configuration
 */
export const KPI_CONFIG = {
  // Default target if none specified
  defaultTarget: 90,
  // Threshold for amber status (percentage below target)
  amberThreshold: 10,
  // Calculate achievement based on assessments from delivered deliverables
  calculationMethod: 'assessment_based'
};

/**
 * Quality Standard achievement calculation configuration
 */
export const QS_CONFIG = {
  // Default target if none specified
  defaultTarget: 100,
  // Calculate achievement based on assessments from delivered deliverables
  calculationMethod: 'assessment_based'
};

/**
 * Budget calculation configuration
 */
export const BUDGET_CONFIG = {
  // Hours in a standard work day for timesheet calculations
  hoursPerDay: 8,
  // Currency symbol
  currency: '£',
  // Currency code
  currencyCode: 'GBP',
  // Decimal places for display
  decimalPlaces: 2
};

// ============================================================
// FINANCE UTILITY FUNCTIONS
// ============================================================

/**
 * Convert hours to days using central HOURS_PER_DAY config
 * @param {number} hours - Number of hours
 * @returns {number} - Number of days
 */
export function hoursToDays(hours) {
  return (parseFloat(hours) || 0) / BUDGET_CONFIG.hoursPerDay;
}

/**
 * Convert days to hours using central HOURS_PER_DAY config
 * @param {number} days - Number of days
 * @returns {number} - Number of hours
 */
export function daysToHours(days) {
  return (parseFloat(days) || 0) * BUDGET_CONFIG.hoursPerDay;
}

/**
 * Calculate billable value (what you charge the customer)
 * @param {number} hours - Hours worked
 * @param {number} dailyRate - Daily sell rate (daily_rate column)
 * @returns {number} - Billable value
 */
export function calculateBillableValue(hours, dailyRate) {
  return hoursToDays(hours) * (parseFloat(dailyRate) || 0);
}

/**
 * Calculate cost value (what you pay the supplier)
 * @param {number} hours - Hours worked
 * @param {number} costPrice - Daily cost price (cost_price column)
 * @returns {number} - Cost value
 */
export function calculateCostValue(hours, costPrice) {
  return hoursToDays(hours) * (parseFloat(costPrice) || 0);
}

/**
 * Metric refresh configuration
 */
export const REFRESH_CONFIG = {
  // Auto-refresh interval in milliseconds (0 = disabled)
  autoRefreshInterval: 0,
  // Debounce delay for manual refresh triggers
  debounceDelay: 300
};

export default {
  VALID_STATUSES,
  SOFT_DELETE_FILTER,
  TEST_CONTENT_FILTER,
  PMO_ROLE_IDENTIFIERS,
  KPI_CONFIG,
  QS_CONFIG,
  BUDGET_CONFIG,
  REFRESH_CONFIG,
  isPMORole,
  timesheetContributesToSpend,
  expenseContributesToSpend,
  deliverableContributesToKPIs,
  deliverableContributesToQS,
  milestoneIsCompleted,
  hoursToDays,
  daysToHours,
  calculateBillableValue,
  calculateCostValue
};
