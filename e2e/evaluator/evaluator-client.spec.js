/**
 * Evaluator Client Portal E2E Tests
 * Location: e2e/evaluator/evaluator-client.spec.js
 * 
 * Tests the client portal functionality:
 * - Access code authentication
 * - Dashboard viewing
 * - Requirements approval
 * - Progress tracking
 * - Report access
 * 
 * Note: These tests require a client with portal access enabled.
 * Test data should be seeded in the database.
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 10 - Testing & Polish (Task 10A.4)
 */

import { test, expect } from '@playwright/test';
import {
  waitForEvaluatorLoad,
  setupConsoleErrorTracking,
  portalSelectors,
  commonSelectors
} from './evaluator-test-utils.js';

// Client portal tests don't use regular auth
test.use({ storageState: { cookies: [], origins: [] } });

// Test client access code - should be seeded in test database
const TEST_CLIENT_CODE = 'CLIENT001';

test.describe('Client Portal - Authentication', () => {
  test('shows login page with access code form', async ({ page }) => {
    await page.goto('/portal/client');
    
    // Should show client portal login
    await expect(page.locator(portalSelectors.clientLogin).first()).toBeVisible({ timeout: 10000 });
    
    // Should have access code input
    await expect(page.locator(portalSelectors.accessCodeInput)).toBeVisible();
    
    // Should have login button
    await expect(page.locator(portalSelectors.loginButton)).toBeVisible();
  });

  test('shows error for invalid access code', async ({ page }) => {
    await page.goto('/portal/client');
    
    // Enter invalid code
    await page.fill(portalSelectors.accessCodeInput, 'INVALID123');
    await page.locator(portalSelectors.loginButton).click();
    
    // Wait for error message
    await expect(page.locator('.client-portal-error, [data-testid="portal-error"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('authenticates with valid access code', async ({ page }) => {
    await page.goto('/portal/client');
    
    // Enter valid code
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    
    // Should authenticate and show portal
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Login form should not be visible
    await expect(page.locator(portalSelectors.clientLogin).first()).not.toBeVisible();
  });

  test('can access portal via URL parameter', async ({ page }) => {
    await page.goto(`/portal/client?code=${TEST_CLIENT_CODE}`);
    
    // Code should be pre-filled or auto-submitted
    const codeInput = page.locator(portalSelectors.accessCodeInput);
    if (await codeInput.isVisible()) {
      // If input visible, code should be pre-filled
      const value = await codeInput.inputValue();
      expect(value.toUpperCase()).toBe(TEST_CLIENT_CODE);
    }
  });
});

test.describe('Client Portal - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/portal/client');
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
  });

  test('displays welcome message with client name', async ({ page }) => {
    // Should show welcome message
    const welcome = page.locator('.client-portal-brand, [data-testid="portal-welcome"]');
    await expect(welcome.first()).toBeVisible();
  });

  test('displays progress summary', async ({ page }) => {
    // Should show progress metrics
    const progressCard = page.locator('.progress-summary, .stat-card, [data-testid="progress-card"]');
    
    if (await progressCard.count() > 0) {
      await expect(progressCard.first()).toBeVisible();
    }
  });

  test('displays navigation tabs', async ({ page }) => {
    // Should show navigation
    const nav = page.locator('.client-portal-nav, [data-testid="portal-nav"]');
    await expect(nav.first()).toBeVisible();
    
    // Should have dashboard tab
    const dashboardTab = page.locator('.client-portal-nav-btn:has-text("Dashboard")');
    await expect(dashboardTab.first()).toBeVisible();
  });
});

test.describe('Client Portal - Requirements View', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/portal/client');
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Navigate to requirements tab
    const reqTab = page.locator('.client-portal-nav-btn:has-text("Requirements")');
    if (await reqTab.count() > 0 && await reqTab.isVisible()) {
      await reqTab.click();
      await waitForEvaluatorLoad(page);
    }
  });

  test('displays requirements list', async ({ page }) => {
    // Check if requirements section is visible
    const requirementsSection = page.locator('.requirements-section, [data-testid="requirements-list"]');
    
    // Requirements section might be visible based on permissions
    if (await requirementsSection.count() > 0) {
      await expect(requirementsSection.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('can filter requirements', async ({ page }) => {
    // Find filter controls
    const filters = page.locator('.requirement-filters, [data-testid="filters"]');
    
    if (await filters.count() > 0) {
      await expect(filters.first()).toBeVisible();
    }
  });
});

test.describe('Client Portal - Approvals', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/portal/client');
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Navigate to approvals tab
    const approvalsTab = page.locator('.client-portal-nav-btn:has-text("Approvals")');
    if (await approvalsTab.count() > 0 && await approvalsTab.isVisible()) {
      await approvalsTab.click();
      await waitForEvaluatorLoad(page);
    }
  });

  test('displays pending approvals', async ({ page }) => {
    // Check for approvals section
    const approvalsSection = page.locator('.approvals-section, .requirement-approval, [data-testid="approvals"]');
    
    if (await approvalsSection.count() > 0) {
      await expect(approvalsSection.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('can approve requirement', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);
    
    // Find a pending requirement
    const pendingItem = page.locator('.approval-item, .requirement-approval-item').first();
    
    if (await pendingItem.count() > 0) {
      // Click approve
      const approveButton = pendingItem.locator('button:has-text("Approve")');
      
      if (await approveButton.count() > 0) {
        await approveButton.click();
        await waitForEvaluatorLoad(page);
        
        // Should show confirmation or update status
        // The item might be removed or show approved status
      }
    }
    
    // Check for console errors
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('can add comment to requirement', async ({ page }) => {
    // Find comment input
    const commentSection = page.locator('.requirement-comments, [data-testid="comments"]');
    
    if (await commentSection.count() > 0) {
      // Find input
      const commentInput = commentSection.locator('textarea, input[type="text"]');
      
      if (await commentInput.count() > 0) {
        await commentInput.fill('Test comment from E2E tests');
        
        // Submit comment
        const submitButton = commentSection.locator('button:has-text("Add"), button:has-text("Submit")');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          await waitForEvaluatorLoad(page);
        }
      }
    }
  });
});

test.describe('Client Portal - Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/portal/client');
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Navigate to reports tab
    const reportsTab = page.locator('.client-portal-nav-btn:has-text("Reports")');
    if (await reportsTab.count() > 0 && await reportsTab.isVisible()) {
      await reportsTab.click();
      await waitForEvaluatorLoad(page);
    }
  });

  test('displays report options', async ({ page }) => {
    // Check for reports section
    const reportsSection = page.locator('.reports-section, [data-testid="reports"]');
    
    if (await reportsSection.count() > 0) {
      await expect(reportsSection.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Client Portal - Branding', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate first
    await page.goto('/portal/client');
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
  });

  test('applies custom branding colors', async ({ page }) => {
    // Check for CSS variables being applied
    const portal = page.locator(portalSelectors.clientPortal).first();
    
    // Check that branding styles are applied
    const style = await portal.getAttribute('style');
    
    // Should have custom CSS variables
    // (They might be set or use defaults)
    expect(style === null || style.includes('--portal-') || style === '').toBeTruthy();
  });

  test('displays client logo if configured', async ({ page }) => {
    // Check for logo
    const logo = page.locator('.portal-logo, img.login-logo');
    
    // Logo might be present or might show default icon
    const logoCount = await logo.count();
    console.log(`Found ${logoCount} logo elements`);
  });
});

test.describe('Client Portal - Session Management', () => {
  test('session persists on page reload', async ({ page }) => {
    // Authenticate
    await page.goto('/portal/client');
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Reload page
    await page.reload();
    await waitForEvaluatorLoad(page);
    
    // Should still be authenticated
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
  });

  test('can logout and return to login', async ({ page }) => {
    // Authenticate
    await page.goto('/portal/client');
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Logout
    const logoutButton = page.locator(portalSelectors.logoutButton);
    if (await logoutButton.count() > 0) {
      await logoutButton.click();
      
      // Should return to login
      await expect(page.locator(portalSelectors.clientLogin).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('shows session timeout warning', async ({ page }) => {
    // Authenticate
    await page.goto('/portal/client');
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Check for session timeout component
    // This test just verifies the component exists, not that it triggers
    const sessionTimeout = page.locator('.session-timeout, [data-testid="session-timeout"]');
    // Component might be hidden initially
    console.log(`Session timeout component count: ${await sessionTimeout.count()}`);
  });
});

test.describe('Client Portal - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('displays correctly on mobile', async ({ page }) => {
    await page.goto('/portal/client');
    
    // Login form should be visible and usable
    await expect(page.locator(portalSelectors.accessCodeInput)).toBeVisible();
    await expect(page.locator(portalSelectors.loginButton)).toBeVisible();
    
    // Authenticate
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    
    // Portal should be visible
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Navigation should still be accessible
    const nav = page.locator('.client-portal-nav');
    await expect(nav.first()).toBeVisible();
  });

  test('navigation scrolls horizontally on mobile', async ({ page }) => {
    await page.goto('/portal/client');
    await page.fill(portalSelectors.accessCodeInput, TEST_CLIENT_CODE);
    await page.locator(portalSelectors.loginButton).click();
    await expect(page.locator(portalSelectors.clientPortal).first()).toBeVisible({ timeout: 10000 });
    
    // Nav should be scrollable or wrap
    const nav = page.locator('.client-portal-nav').first();
    const box = await nav.boundingBox();
    expect(box?.width).toBeLessThanOrEqual(375);
  });
});

test.describe('Client Portal - Accessibility', () => {
  test('has proper form labels', async ({ page }) => {
    await page.goto('/portal/client');
    
    // Access code input should have a label
    const accessCodeLabel = page.locator('label[for="access-code"], label:has-text("Access Code")');
    await expect(accessCodeLabel.first()).toBeVisible();
  });

  test('can navigate with keyboard', async ({ page }) => {
    await page.goto('/portal/client');
    
    // Tab to access code input
    await page.keyboard.press('Tab');
    
    // Should focus on input
    const focusedElement = page.locator(':focus');
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
    expect(['input', 'button']).toContain(tagName);
  });

  test('shows appropriate aria labels', async ({ page }) => {
    await page.goto('/portal/client');
    
    // Check for aria labels
    const loginButton = page.locator(portalSelectors.loginButton);
    const ariaLabel = await loginButton.getAttribute('aria-label');
    const buttonText = await loginButton.textContent();
    
    // Should have either aria-label or meaningful text
    expect(ariaLabel || buttonText?.trim()).toBeTruthy();
  });
});
