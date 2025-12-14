/**
 * E2E Test Utilities
 * Location: e2e/helpers/test-utils.js
 * 
 * Common utilities for E2E tests.
 * 
 * IMPORTANT: This file follows the Testing Contract defined in
 * docs/TESTING-CONVENTIONS.md. All selectors use data-testid
 * attributes for stability.
 * 
 * @version 2.0
 * @modified 14 December 2025 - Updated to use data-testid selectors
 */

import { expect } from '@playwright/test';

/**
 * Wait for page to be fully loaded with data.
 * Uses data-testid="loading-spinner" per TESTING-CONVENTIONS.md
 */
export async function waitForPageLoad(page, options = {}) {
  const { timeout = 15000 } = options;
  
  await page.waitForLoadState('networkidle', { timeout });
  
  // Wait for loading spinner to disappear (uses data-testid)
  const spinner = page.locator('[data-testid="loading-spinner"]');
  if (await spinner.count() > 0) {
    await spinner.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }
}

/**
 * Check if element exists and is visible
 */
export async function elementExists(page, selector) {
  const element = page.locator(selector);
  return await element.count() > 0 && await element.first().isVisible();
}

/**
 * Safe click that waits for element to be ready
 */
export async function safeClick(page, selector, options = {}) {
  const { timeout = 10000 } = options;
  
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await element.click();
}

/**
 * Fill form field with retry
 */
export async function fillField(page, selector, value, options = {}) {
  const { clear = true, timeout = 10000 } = options;
  
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  
  if (clear) {
    await element.clear();
  }
  
  await element.fill(value);
}

/**
 * Take screenshot with descriptive name
 */
export async function takeScreenshot(page, name) {
  const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '_');
  await page.screenshot({ 
    path: `test-results/screenshots/${sanitizedName}.png`,
    fullPage: true 
  });
}

/**
 * Assert navigation item is visible.
 * Uses data-testid="nav-{itemId}" per TESTING-CONVENTIONS.md
 * 
 * @param {Page} page - Playwright page
 * @param {string[]} itemIds - Array of navigation item IDs (e.g., ['dashboard', 'timesheets'])
 */
export async function assertNavigationVisible(page, itemIds = []) {
  for (const itemId of itemIds) {
    const nav = page.locator(`[data-testid="nav-${itemId}"]`);
    await expect(nav).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Assert navigation item is hidden.
 * Uses data-testid="nav-{itemId}" per TESTING-CONVENTIONS.md
 * 
 * @param {Page} page - Playwright page
 * @param {string[]} itemIds - Array of navigation item IDs (e.g., ['systemUsers', 'billing'])
 */
export async function assertNavigationHidden(page, itemIds = []) {
  for (const itemId of itemIds) {
    const nav = page.locator(`[data-testid="nav-${itemId}"]`);
    await expect(nav).toBeHidden({ timeout: 5000 });
  }
}

/**
 * Assert button state (enabled/disabled)
 */
export async function assertButtonState(page, selector, shouldBeEnabled) {
  const button = page.locator(selector);
  
  if (shouldBeEnabled) {
    await expect(button).toBeEnabled();
  } else {
    await expect(button).toBeDisabled();
  }
}

/**
 * Wait for toast notification.
 * Uses data-testid="toast-{type}" per TESTING-CONVENTIONS.md
 * 
 * @param {Page} page - Playwright page
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Locator} - The toast element
 */
export async function waitForToast(page, type = 'success', timeout = 5000) {
  const toast = page.locator(`[data-testid="toast-${type}"]`);
  await toast.waitFor({ state: 'visible', timeout });
  return toast;
}

/**
 * Dismiss toast notification by clicking close button.
 * Uses data-testid="toast-close-button" per TESTING-CONVENTIONS.md
 */
export async function dismissToast(page) {
  const closeButton = page.locator('[data-testid="toast-close-button"]');
  if (await closeButton.count() > 0) {
    await closeButton.first().click();
  }
}

/**
 * Dismiss any open modals
 */
export async function dismissModals(page) {
  const closeButtons = page.locator('[data-testid$="-modal-close"], button:has-text("Close"), button:has-text("Cancel")');
  
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click().catch(() => {});
    await page.waitForTimeout(100);
  }
}

/**
 * Click logout button.
 * Uses data-testid="logout-button" per TESTING-CONVENTIONS.md
 */
export async function clickLogout(page) {
  const logoutButton = page.locator('[data-testid="logout-button"]');
  await logoutButton.click();
}

/**
 * Click user menu (navigates to account page).
 * Uses data-testid="user-menu-button" per TESTING-CONVENTIONS.md
 */
export async function clickUserMenu(page) {
  const userMenu = page.locator('[data-testid="user-menu-button"]');
  await userMenu.click();
}

/**
 * Navigate to a page via the sidebar navigation.
 * Uses data-testid="nav-{itemId}" per TESTING-CONVENTIONS.md
 * 
 * @param {Page} page - Playwright page
 * @param {string} itemId - Navigation item ID (e.g., 'dashboard', 'timesheets')
 */
export async function navigateTo(page, itemId) {
  const navItem = page.locator(`[data-testid="nav-${itemId}"]`);
  await navItem.click();
  await waitForPageLoad(page);
}

/**
 * Generate unique test ID
 */
export function generateTestId(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'localhost',
    isCI: !!process.env.CI,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

/**
 * Login form helpers.
 * Uses data-testid per TESTING-CONVENTIONS.md
 */
export const loginSelectors = {
  emailInput: '[data-testid="login-email-input"]',
  passwordInput: '[data-testid="login-password-input"]',
  submitButton: '[data-testid="login-submit-button"]',
  errorMessage: '[data-testid="login-error-message"]',
  successMessage: '[data-testid="login-success-message"]',
};

/**
 * Fill login form.
 * Uses data-testid selectors per TESTING-CONVENTIONS.md
 * 
 * @param {Page} page - Playwright page
 * @param {string} email - Email address
 * @param {string} password - Password
 */
export async function fillLoginForm(page, email, password) {
  await page.fill(loginSelectors.emailInput, email);
  await page.fill(loginSelectors.passwordInput, password);
}

/**
 * Submit login form.
 * Uses data-testid selectors per TESTING-CONVENTIONS.md
 */
export async function submitLoginForm(page) {
  await page.click(loginSelectors.submitButton);
}

/**
 * Wait for login error message.
 * Uses data-testid selectors per TESTING-CONVENTIONS.md
 */
export async function waitForLoginError(page, timeout = 5000) {
  const error = page.locator(loginSelectors.errorMessage);
  await error.waitFor({ state: 'visible', timeout });
  return error;
}
