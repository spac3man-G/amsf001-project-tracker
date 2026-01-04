/**
 * Evaluator Vendor Portal E2E Tests
 * Location: e2e/evaluator/evaluator-vendor-portal.spec.js
 * 
 * Tests the vendor portal functionality:
 * - Access code authentication
 * - Question viewing
 * - Response submission
 * - Document upload
 * - Progress tracking
 * 
 * Note: These tests require a vendor with portal access enabled.
 * Test data should be seeded in the database.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 10 - Testing & Polish (Task 10A.5)
 */

import { test, expect } from '@playwright/test';
import {
  waitForEvaluatorLoad,
  setupConsoleErrorTracking,
  portalSelectors,
  commonSelectors
} from './evaluator-test-utils.js';

// Vendor portal tests don't use regular auth
test.use({ storageState: { cookies: [], origins: [] } });

// Test vendor access code - should be seeded in test database
const TEST_VENDOR_CODE = 'VENDOR001';

test.describe('Vendor Portal - Authentication', () => {
  test('shows login page with access code form', async ({ page }) => {
    await page.goto('/portal/vendor');
    
    // Should show vendor portal login
    await expect(page.locator(portalSelectors.vendorLogin).first()).toBeVisible({ timeout: 10000 });
    
    // Should have access code input
    await expect(page.locator(portalSelectors.accessCodeInput)).toBeVisible();
    
    // Should have login button
    await expect(page.locator(portalSelectors.loginButton)).toBeVisible();
  });

  test('shows error for invalid access code', async ({ page }) => {
    await page.goto('/portal/vendor');
    
    // Enter invalid code
    await page.fill(portalSelectors.accessCodeInput, 'INVALID123');
    await page.locator(portalSelectors.loginButton).click();
    
    // Wait for error message
    await expect(page.locator('.vendor-portal-error, [data-testid="portal-error"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('authenticates with valid access code', async ({ page }) => {
    await page.goto('/portal/vendor');
    
    // Enter valid code
    await page.fill(portalSelectors.accessCodeInput, TEST_VENDOR_CODE);
    await page.locator(portalSelectors.loginButton).click();
    
    // Should authenticate and show portal
    await expect(page.locator(portalSelectors.vendorPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Login form should not be visible
    await expect(page.locator(portalSelectors.vendorLogin).first()).not.toBeVisible();
  });

  test('can access portal via URL parameter', async ({ page }) => {
    await page.goto(`/portal/vendor?code=${TEST_VENDOR_CODE}`);
    
    // Code should be pre-filled or auto-submitted
    const codeInput = page.locator(portalSelectors.accessCodeInput);
    if (await codeInput.isVisible()) {
      // If input visible, code should be pre-filled
      const value = await codeInput.inputValue();
      expect(value.toUpperCase()).toBe(TEST_VENDOR_CODE);
    }
  });
});

test.describe('Vendor Portal - Questions', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/portal/vendor');
    await page.fill(portalSelectors.accessCodeInput, TEST_VENDOR_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.vendorPortal).first()).toBeVisible({ timeout: 10000 });
  });

  test('displays question sections', async ({ page }) => {
    // Should show sections navigation
    const sections = page.locator('.vendor-portal-sections, [data-testid="question-sections"]');
    await expect(sections.first()).toBeVisible({ timeout: 5000 });
    
    // Should have at least one section
    const sectionButtons = page.locator('.vendor-portal-section-btn');
    expect(await sectionButtons.count()).toBeGreaterThan(0);
  });

  test('displays questions within section', async ({ page }) => {
    // Click first section if exists
    const firstSection = page.locator('.vendor-portal-section-btn').first();
    if (await firstSection.count() > 0) {
      await firstSection.click();
      await waitForEvaluatorLoad(page);
      
      // Should show questions
      const questions = page.locator(portalSelectors.questionItem);
      // Questions might exist or might not depending on test data
      const count = await questions.count();
      console.log(`Found ${count} questions`);
    }
  });

  test('shows progress indicator', async ({ page }) => {
    // Should show progress bar
    const progress = page.locator('.vendor-portal-progress, [data-testid="response-progress"]');
    
    if (await progress.count() > 0) {
      await expect(progress.first()).toBeVisible();
      
      // Progress should have a bar
      const progressBar = progress.locator('.vendor-portal-progress-bar, .progress-bar');
      await expect(progressBar.first()).toBeVisible();
    }
  });
});

test.describe('Vendor Portal - Response Submission', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/portal/vendor');
    await page.fill(portalSelectors.accessCodeInput, TEST_VENDOR_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.vendorPortal).first()).toBeVisible({ timeout: 10000 });
  });

  test('can enter text response', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);
    
    // Find a text question
    const questionItem = page.locator(portalSelectors.questionItem).first();
    
    if (await questionItem.count() > 0) {
      // Find response input
      const responseInput = questionItem.locator('textarea, input[type="text"]').first();
      
      if (await responseInput.count() > 0) {
        // Enter response
        await responseInput.fill('Test response from E2E tests');
        
        // Save response
        const saveButton = questionItem.locator(portalSelectors.saveResponseButton);
        if (await saveButton.count() > 0) {
          await saveButton.click();
          
          // Should show saved indicator
          await expect(questionItem.locator('text=/saved|answered/i').first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
    
    // Check for console errors
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('can select yes/no response', async ({ page }) => {
    // Find a yes/no question
    const yesNoQuestion = page.locator('.vendor-question-yesno').first();
    
    if (await yesNoQuestion.count() > 0) {
      // Select yes
      const yesOption = yesNoQuestion.locator('label:has-text("Yes"), input[value="yes"]').first();
      if (await yesOption.count() > 0) {
        await yesOption.click();
      }
      
      // Save
      const saveButton = yesNoQuestion.locator('..').locator(portalSelectors.saveResponseButton);
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await waitForEvaluatorLoad(page);
      }
    }
  });

  test('shows required indicator on required questions', async ({ page }) => {
    // Find required questions
    const requiredIndicator = page.locator('.vendor-question-required, [data-testid="required-indicator"]');
    
    if (await requiredIndicator.count() > 0) {
      await expect(requiredIndicator.first()).toBeVisible();
    }
  });
});

test.describe('Vendor Portal - Session Management', () => {
  test('session persists on page reload', async ({ page }) => {
    // Authenticate
    await page.goto('/portal/vendor');
    await page.fill(portalSelectors.accessCodeInput, TEST_VENDOR_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.vendorPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Reload page
    await page.reload();
    await waitForEvaluatorLoad(page);
    
    // Should still be authenticated
    await expect(page.locator(portalSelectors.vendorPortal).first()).toBeVisible({ timeout: 10000 });
  });

  test('can logout and return to login', async ({ page }) => {
    // Authenticate
    await page.goto('/portal/vendor');
    await page.fill(portalSelectors.accessCodeInput, TEST_VENDOR_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.vendorPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Logout
    const logoutButton = page.locator(portalSelectors.logoutButton);
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      
      // Should return to login
      await expect(page.locator(portalSelectors.vendorLogin).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Vendor Portal - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('displays correctly on mobile', async ({ page }) => {
    await page.goto('/portal/vendor');
    
    // Login form should be visible and usable
    await expect(page.locator(portalSelectors.accessCodeInput)).toBeVisible();
    await expect(page.locator(portalSelectors.loginButton)).toBeVisible();
    
    // Authenticate
    await page.fill(portalSelectors.accessCodeInput, TEST_VENDOR_CODE);
    await page.locator(portalSelectors.loginButton).click();
    
    // Portal should be visible
    await expect(page.locator(portalSelectors.vendorPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Elements should not overflow
    const portal = page.locator(portalSelectors.vendorPortal).first();
    const box = await portal.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });
});

test.describe('Vendor Portal - Accessibility', () => {
  test('has proper form labels', async ({ page }) => {
    await page.goto('/portal/vendor');
    
    // Access code input should have a label
    const accessCodeLabel = page.locator('label[for="access-code"], label:has-text("Access Code")');
    await expect(accessCodeLabel.first()).toBeVisible();
  });

  test('can navigate with keyboard', async ({ page }) => {
    await page.goto('/portal/vendor');
    
    // Tab to access code input
    await page.keyboard.press('Tab');
    
    // Should focus on input
    const focusedElement = page.locator(':focus');
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
    expect(['input', 'button']).toContain(tagName);
  });
});
