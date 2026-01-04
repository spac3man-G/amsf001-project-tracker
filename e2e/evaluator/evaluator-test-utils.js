/**
 * Evaluator E2E Test Utilities
 * Location: e2e/evaluator/evaluator-test-utils.js
 * 
 * Common utilities and selectors for Evaluator E2E tests.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 10 - Testing & Polish (Task 10A)
 */

import { expect } from '@playwright/test';

// ============================================================================
// TEST DATA
// ============================================================================

export const TEST_EVALUATION = {
  name: 'E2E Test Evaluation',
  clientName: 'E2E Test Client',
  description: 'Evaluation project for E2E testing'
};

export const TEST_REQUIREMENT = {
  title: 'E2E Test Requirement',
  description: 'A requirement created by E2E tests',
  priority: 'should_have'
};

export const TEST_VENDOR = {
  name: 'E2E Test Vendor',
  description: 'A vendor created by E2E tests',
  website: 'https://example.com'
};

export const TEST_WORKSHOP = {
  name: 'E2E Test Workshop',
  description: 'A workshop created by E2E tests'
};

// ============================================================================
// EVALUATOR NAVIGATION SELECTORS
// ============================================================================

export const evaluatorNav = {
  dashboard: '[data-testid="nav-evaluator-dashboard"], a[href*="/evaluator/dashboard"]',
  requirements: '[data-testid="nav-evaluator-requirements"], a[href*="/evaluator/requirements"]',
  workshops: '[data-testid="nav-evaluator-workshops"], a[href*="/evaluator/workshops"]',
  vendors: '[data-testid="nav-evaluator-vendors"], a[href*="/evaluator/vendors"]',
  documents: '[data-testid="nav-evaluator-documents"], a[href*="/evaluator/documents"]',
  questions: '[data-testid="nav-evaluator-questions"], a[href*="/evaluator/questions"]',
  evaluation: '[data-testid="nav-evaluator-evaluation"], a[href*="/evaluator/evaluation"]',
  traceability: '[data-testid="nav-evaluator-traceability"], a[href*="/evaluator/traceability"]',
  reports: '[data-testid="nav-evaluator-reports"], a[href*="/evaluator/reports"]',
  settings: '[data-testid="nav-evaluator-settings"], a[href*="/evaluator/settings"]'
};

// ============================================================================
// COMMON SELECTORS
// ============================================================================

export const commonSelectors = {
  pageHeader: '.page-header, [data-testid="page-header"]',
  loadingSpinner: '.loading-spinner, .spinner, [data-testid="loading-spinner"]',
  emptyState: '.empty-state, [data-testid="empty-state"]',
  errorMessage: '.error-message, [data-testid="error-message"]',
  successToast: '.toast-success, [data-testid="toast-success"]',
  errorToast: '.toast-error, [data-testid="toast-error"]',
  modal: '.modal, [data-testid="modal"]',
  modalClose: '.modal-close, [data-testid="modal-close"]',
  confirmButton: 'button:has-text("Confirm"), button:has-text("Yes")',
  cancelButton: 'button:has-text("Cancel"), button:has-text("No")',
  saveButton: 'button:has-text("Save")',
  createButton: 'button:has-text("Create"), button:has-text("Add")',
  deleteButton: 'button:has-text("Delete"), button:has-text("Remove")'
};

// ============================================================================
// EVALUATION SWITCHER SELECTORS
// ============================================================================

export const evaluationSwitcher = {
  container: '.evaluation-switcher, [data-testid="evaluation-switcher"]',
  currentEvaluation: '.current-evaluation, [data-testid="current-evaluation"]',
  dropdown: '.evaluation-dropdown, [data-testid="evaluation-dropdown"]',
  evaluationOption: '.evaluation-option'
};

// ============================================================================
// REQUIREMENTS PAGE SELECTORS
// ============================================================================

export const requirementsSelectors = {
  hub: '.requirements-hub',
  list: '.requirements-list, [data-testid="requirements-list"]',
  card: '.requirement-card, [data-testid="requirement-card"]',
  matrix: '.requirement-matrix, [data-testid="requirement-matrix"]',
  filters: '.requirement-filters, [data-testid="requirement-filters"]',
  createButton: 'button:has-text("Add Requirement"), button:has-text("New Requirement")',
  form: '.requirement-form, [data-testid="requirement-form"]',
  titleInput: 'input[name="title"], [data-testid="requirement-title"]',
  descriptionInput: 'textarea[name="description"], [data-testid="requirement-description"]',
  prioritySelect: 'select[name="priority"], [data-testid="requirement-priority"]',
  categorySelect: 'select[name="category_id"], [data-testid="requirement-category"]',
  statusBadge: '.status-badge, [data-testid="status-badge"]',
  approveButton: 'button:has-text("Approve")',
  rejectButton: 'button:has-text("Reject")',
  gapAnalysisButton: 'button:has-text("Gap Analysis"), button:has-text("AI Gap Analysis")'
};

// ============================================================================
// VENDORS PAGE SELECTORS
// ============================================================================

export const vendorSelectors = {
  hub: '.vendors-hub',
  pipeline: '.vendor-pipeline, [data-testid="vendor-pipeline"]',
  card: '.vendor-card, [data-testid="vendor-card"]',
  createButton: 'button:has-text("Add Vendor"), button:has-text("New Vendor")',
  form: '.vendor-form, [data-testid="vendor-form"]',
  nameInput: 'input[name="name"], [data-testid="vendor-name"]',
  descriptionInput: 'textarea[name="description"], [data-testid="vendor-description"]',
  websiteInput: 'input[name="website"], [data-testid="vendor-website"]',
  statusSelect: 'select[name="status"], [data-testid="vendor-status"]',
  portalToggle: '[data-testid="portal-enabled"]',
  accessCodeDisplay: '[data-testid="access-code"]',
  marketResearchButton: 'button:has-text("Market Research"), button:has-text("AI Market Research")'
};

// ============================================================================
// WORKSHOPS PAGE SELECTORS
// ============================================================================

export const workshopSelectors = {
  hub: '.workshops-hub',
  list: '.workshops-list, [data-testid="workshops-list"]',
  card: '.workshop-card, [data-testid="workshop-card"]',
  createButton: 'button:has-text("Schedule Workshop"), button:has-text("New Workshop")',
  form: '.workshop-form, [data-testid="workshop-form"]',
  nameInput: 'input[name="name"], [data-testid="workshop-name"]',
  descriptionInput: 'textarea[name="description"], [data-testid="workshop-description"]',
  dateInput: 'input[name="scheduled_date"], input[type="datetime-local"]',
  captureMode: '.workshop-capture, [data-testid="workshop-capture"]',
  attendeeManager: '.attendee-manager, [data-testid="attendee-manager"]'
};

// ============================================================================
// SCORING SELECTORS
// ============================================================================

export const scoringSelectors = {
  hub: '.evaluation-hub',
  interface: '.scoring-interface, [data-testid="scoring-interface"]',
  category: '.scoring-category',
  criterion: '.scoring-criterion',
  scoreSelector: '.score-selector',
  scoreButton: '.score-btn',
  rationale: 'textarea[placeholder*="rationale"], [data-testid="score-rationale"]',
  saveButton: '.scoring-save-btn',
  submitButton: '.scoring-submit-btn',
  reconciliationPanel: '.reconciliation-panel, [data-testid="reconciliation-panel"]'
};

// ============================================================================
// PORTAL SELECTORS
// ============================================================================

export const portalSelectors = {
  // Client Portal
  clientPortal: '.client-portal',
  clientLogin: '.client-portal-login',
  clientDashboard: '.client-portal-main',
  accessCodeInput: 'input[id="access-code"], input[placeholder*="access code"]',
  loginButton: '.client-portal-login-btn, button:has-text("Access Portal")',
  logoutButton: '.client-portal-logout, button:has-text("Sign Out")',
  
  // Vendor Portal
  vendorPortal: '.vendor-portal',
  vendorLogin: '.vendor-portal-login',
  vendorQuestions: '.vendor-portal-questions',
  questionItem: '.vendor-question-item',
  responseInput: '.vendor-question-response textarea, .vendor-question-response input',
  saveResponseButton: '.vendor-save-btn'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Navigate to the Evaluator tool
 * @param {Page} page - Playwright page
 */
export async function navigateToEvaluator(page) {
  await page.goto('/evaluator/dashboard');
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for evaluator page to load
 * @param {Page} page - Playwright page
 */
export async function waitForEvaluatorLoad(page) {
  // Wait for network to settle
  await page.waitForLoadState('networkidle');
  
  // Wait for loading spinner to disappear
  const spinner = page.locator(commonSelectors.loadingSpinner);
  if (await spinner.count() > 0) {
    await spinner.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }
}

/**
 * Switch evaluation project if multiple exist
 * @param {Page} page - Playwright page
 * @param {string} evaluationName - Name of evaluation to switch to
 */
export async function switchEvaluation(page, evaluationName) {
  const switcher = page.locator(evaluationSwitcher.container);
  if (await switcher.count() > 0) {
    await switcher.click();
    const option = page.locator(`${evaluationSwitcher.evaluationOption}:has-text("${evaluationName}")`);
    if (await option.count() > 0) {
      await option.click();
      await waitForEvaluatorLoad(page);
    }
  }
}

/**
 * Navigate to a specific evaluator page
 * @param {Page} page - Playwright page
 * @param {string} pageName - Name of page (dashboard, requirements, vendors, etc.)
 */
export async function navigateToEvaluatorPage(page, pageName) {
  const navSelector = evaluatorNav[pageName];
  if (!navSelector) {
    throw new Error(`Unknown evaluator page: ${pageName}`);
  }
  
  const navItem = page.locator(navSelector).first();
  await navItem.click();
  await waitForEvaluatorLoad(page);
}

/**
 * Create a new requirement
 * @param {Page} page - Playwright page
 * @param {Object} data - Requirement data
 */
export async function createRequirement(page, data) {
  // Navigate to requirements
  await navigateToEvaluatorPage(page, 'requirements');
  
  // Click create button
  await page.locator(requirementsSelectors.createButton).click();
  
  // Fill form
  await page.fill(requirementsSelectors.titleInput, data.title);
  if (data.description) {
    await page.fill(requirementsSelectors.descriptionInput, data.description);
  }
  if (data.priority) {
    await page.selectOption(requirementsSelectors.prioritySelect, data.priority);
  }
  
  // Save
  await page.locator(commonSelectors.saveButton).click();
  await waitForEvaluatorLoad(page);
}

/**
 * Create a new vendor
 * @param {Page} page - Playwright page
 * @param {Object} data - Vendor data
 */
export async function createVendor(page, data) {
  // Navigate to vendors
  await navigateToEvaluatorPage(page, 'vendors');
  
  // Click create button
  await page.locator(vendorSelectors.createButton).click();
  
  // Fill form
  await page.fill(vendorSelectors.nameInput, data.name);
  if (data.description) {
    await page.fill(vendorSelectors.descriptionInput, data.description);
  }
  if (data.website) {
    await page.fill(vendorSelectors.websiteInput, data.website);
  }
  
  // Save
  await page.locator(commonSelectors.saveButton).click();
  await waitForEvaluatorLoad(page);
}

/**
 * Assert page has no console errors
 * @param {Page} page - Playwright page
 * @param {Array} errors - Array to collect errors
 */
export function setupConsoleErrorTracking(page, errors = []) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

/**
 * Assert a toast notification appears
 * @param {Page} page - Playwright page
 * @param {string} type - Toast type: 'success' or 'error'
 * @param {number} timeout - Timeout in ms
 */
export async function expectToast(page, type = 'success', timeout = 5000) {
  const selector = type === 'success' ? commonSelectors.successToast : commonSelectors.errorToast;
  await expect(page.locator(selector).first()).toBeVisible({ timeout });
}

/**
 * Get current URL path
 * @param {Page} page - Playwright page
 * @returns {string} - URL path
 */
export function getCurrentPath(page) {
  return new URL(page.url()).pathname;
}

export default {
  evaluatorNav,
  commonSelectors,
  evaluationSwitcher,
  requirementsSelectors,
  vendorSelectors,
  workshopSelectors,
  scoringSelectors,
  portalSelectors,
  navigateToEvaluator,
  waitForEvaluatorLoad,
  switchEvaluation,
  navigateToEvaluatorPage,
  createRequirement,
  createVendor,
  setupConsoleErrorTracking,
  expectToast,
  getCurrentPath
};
