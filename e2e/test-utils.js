/**
 * E2E Test Utilities - Main Export
 * Location: e2e/test-utils.js
 * 
 * This file provides the testing contract API used by test files.
 * Re-exports utilities from helpers/test-utils.js and adds data-testid specific helpers.
 * 
 * @version 1.0
 * @created 14 December 2025
 */

import { expect } from '@playwright/test';

// Re-export common utilities from helpers
export {
  waitForPageLoad,
  elementExists,
  safeClick,
  fillField,
  takeScreenshot,
  assertNavigationVisible,
  assertNavigationHidden,
  assertButtonState,
  waitForToast,
  dismissToast,
  dismissModals,
  clickLogout,
  clickUserMenu,
  navigateTo,
  generateTestId,
  getEnvironmentInfo,
  loginSelectors,
  fillLoginForm,
  submitLoginForm,
  waitForLoginError
} from './helpers/test-utils.js';

// Import for internal use
import { waitForPageLoad } from './helpers/test-utils.js';

/**
 * Convert a testId to a data-testid selector
 * @param {string} testId - The test ID without brackets
 * @returns {string} - The full data-testid selector
 */
export function getTestIdSelector(testId) {
  return `[data-testid="${testId}"]`;
}

/**
 * Wait for page to be ready (alias for waitForPageLoad)
 * Used by features-by-role.spec.js
 */
export async function waitForPageReady(page, options = {}) {
  await waitForPageLoad(page, options);
}

/**
 * Expect element with testId to be visible
 * @param {Page} page - Playwright page
 * @param {string} testId - The data-testid value
 * @param {number} timeout - Timeout in ms (default: 10000)
 */
export async function expectVisible(page, testId, timeout = 10000) {
  const selector = getTestIdSelector(testId);
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });
}

/**
 * Expect element with testId to NOT be visible
 * @param {Page} page - Playwright page
 * @param {string} testId - The data-testid value
 * @param {number} timeout - Timeout in ms (default: 5000)
 */
export async function expectNotVisible(page, testId, timeout = 5000) {
  const selector = getTestIdSelector(testId);
  const element = page.locator(selector);
  await expect(element).not.toBeVisible({ timeout });
}

/**
 * Standard test selectors object
 * Provides commonly used selectors across tests
 */
export const TestSelectors = {
  // Navigation
  nav: (itemId) => `[data-testid="nav-${itemId}"]`,
  
  // Login
  loginEmail: '[data-testid="login-email-input"]',
  loginPassword: '[data-testid="login-password-input"]',
  loginSubmit: '[data-testid="login-submit-button"]',
  loginError: '[data-testid="login-error-message"]',
  
  // Common UI
  loadingSpinner: '[data-testid="loading-spinner"]',
  toast: (type) => `[data-testid="toast-${type}"]`,
  toastClose: '[data-testid="toast-close-button"]',
  logoutButton: '[data-testid="logout-button"]',
  userMenuButton: '[data-testid="user-menu-button"]',
  
  // Dashboard
  dashboardPage: '[data-testid="dashboard-page"]',
  dashboardRefresh: '[data-testid="dashboard-refresh-button"]',
  
  // Milestones
  milestonesPage: '[data-testid="milestones-page"]',
  addMilestoneButton: '[data-testid="add-milestone-button"]',
  milestonesTable: '[data-testid="milestones-table"]',
  
  // Timesheets
  timesheetsPage: '[data-testid="timesheets-page"]',
  addTimesheetButton: '[data-testid="add-timesheet-button"]',
  timesheetsTable: '[data-testid="timesheets-table"]',
  
  // Expenses
  expensesPage: '[data-testid="expenses-page"]',
  addExpenseButton: '[data-testid="add-expense-button"]',
  scanReceiptButton: '[data-testid="scan-receipt-button"]',
  
  // Deliverables
  deliverablesPage: '[data-testid="deliverables-page"]',
  addDeliverableButton: '[data-testid="add-deliverable-button"]',
  deliverablesTable: '[data-testid="deliverables-table"]',
  
  // Resources
  resourcesPage: '[data-testid="resources-page"]',
  addResourceButton: '[data-testid="add-resource-button"]',
  resourcesCostRateHeader: '[data-testid="resources-cost-rate-header"]',
  resourcesMarginHeader: '[data-testid="resources-margin-header"]',
  
  // Variations
  variationsPage: '[data-testid="variations-page"]',
  createVariationButton: '[data-testid="create-variation-button"]',
  
  // Settings
  settingsPage: '[data-testid="settings-page"]',
  settingsSaveButton: '[data-testid="settings-save-button"]',
  settingsProjectNameInput: '[data-testid="settings-project-name-input"]',
};
