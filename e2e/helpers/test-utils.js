/**
 * E2E Test Utilities
 * Location: e2e/helpers/test-utils.js
 * 
 * Common utilities for E2E tests
 */

import { expect } from '@playwright/test';

/**
 * Wait for page to be fully loaded with data
 */
export async function waitForPageLoad(page, options = {}) {
  const { timeout = 15000 } = options;
  
  await page.waitForLoadState('networkidle', { timeout });
  
  // Additional wait for any loading spinners to disappear
  const spinner = page.locator('.loading, .spinner, [data-loading="true"]');
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
 * Get current user role from page context
 */
export async function getCurrentRole(page) {
  // Try to get role from local storage or page context
  return await page.evaluate(() => {
    const storage = localStorage.getItem('user_role');
    return storage || 'unknown';
  });
}

/**
 * Assert navigation is visible
 */
export async function assertNavigationVisible(page, items = []) {
  for (const item of items) {
    const nav = page.locator(`nav a:has-text("${item}"), [data-nav="${item}"]`);
    await expect(nav).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Assert navigation item is hidden
 */
export async function assertNavigationHidden(page, items = []) {
  for (const item of items) {
    const nav = page.locator(`nav a:has-text("${item}"), [data-nav="${item}"]`);
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
 * Wait for toast notification
 */
export async function waitForToast(page, type = 'success', timeout = 5000) {
  const toastSelectors = {
    success: '.toast-success, [data-toast="success"], .Toastify__toast--success',
    error: '.toast-error, [data-toast="error"], .Toastify__toast--error',
    warning: '.toast-warning, [data-toast="warning"], .Toastify__toast--warning',
  };
  
  const selector = toastSelectors[type] || toastSelectors.success;
  const toast = page.locator(selector);
  
  await toast.waitFor({ state: 'visible', timeout });
  return toast;
}

/**
 * Dismiss any open modals
 */
export async function dismissModals(page) {
  const closeButtons = page.locator('.modal-close, [data-dismiss="modal"], button:has-text("Close"), button:has-text("Cancel")');
  
  const count = await closeButtons.count();
  for (let i = count - 1; i >= 0; i--) {
    await closeButtons.nth(i).click().catch(() => {});
    await page.waitForTimeout(100);
  }
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
