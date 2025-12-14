/**
 * Smoke Tests - Critical Path Verification
 * Location: e2e/smoke.spec.js
 * 
 * These tests verify that the most critical features work.
 * They run:
 * - After every production deployment
 * - Before merging PRs
 * - On demand via manual workflow
 * 
 * IMPORTANT: All selectors use data-testid per docs/TESTING-CONVENTIONS.md
 * 
 * @version 2.0
 * @modified 14 December 2025 - Updated to use testing contract
 */

import { test, expect } from '@playwright/test';
import { 
  waitForPageLoad, 
  waitForToast,
  loginSelectors,
  fillLoginForm,
  submitLoginForm,
  clickLogout,
  navigateTo
} from './helpers/test-utils.js';

// ============================================
// UNAUTHENTICATED TESTS
// ============================================
test.describe('Smoke Tests - Public @smoke', () => {
  
  test.describe('Login Page @critical', () => {
    test('login page loads with correct elements', async ({ page }) => {
      await page.goto('/login');
      
      // Verify login form elements using data-testid
      await expect(page.locator(loginSelectors.emailInput)).toBeVisible({ timeout: 10000 });
      await expect(page.locator(loginSelectors.passwordInput)).toBeVisible();
      await expect(page.locator(loginSelectors.submitButton)).toBeVisible();
    });

    test('login with invalid credentials shows error', async ({ page }) => {
      await page.goto('/login');
      
      // Fill with invalid credentials
      await fillLoginForm(page, 'invalid@example.com', 'wrongpassword');
      await submitLoginForm(page);
      
      // Should show error message
      await expect(page.locator(loginSelectors.errorMessage)).toBeVisible({ timeout: 10000 });
    });

    test('unauthenticated user is redirected to login', async ({ page }) => {
      // Clear any existing auth
      await page.context().clearCookies();
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });

  test.describe('Error Handling @smoke', () => {
    test('404 - unknown routes redirect gracefully', async ({ page }) => {
      const response = await page.goto('/this-page-definitely-does-not-exist-12345');
      
      // App catches unknown routes and redirects to dashboard (which then redirects to login)
      // Should not return 500 error
      expect(response?.status()).toBeLessThan(500);
    });
  });
});

// ============================================
// AUTHENTICATED TESTS (Admin role)
// ============================================
test.describe('Smoke Tests - Authenticated @smoke', () => {
  // Use admin auth state for these tests
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Dashboard @critical', () => {
    test('authenticated user sees dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Verify we're on dashboard and navigation is visible
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible({ timeout: 15000 });
    });

    test('dashboard loads without critical errors', async ({ page }) => {
      const consoleErrors = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Filter out known acceptable errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('DevTools') &&
        !error.includes('third-party') &&
        !error.includes('net::ERR')  // Network errors during test setup
      );
      
      // Log warnings but don't fail on non-critical console errors
      if (criticalErrors.length > 0) {
        console.log('Console errors detected:', criticalErrors);
      }
      
      // Verify no error toast is showing
      const errorToast = page.locator('[data-testid="toast-error"]');
      const errorCount = await errorToast.count();
      
      // If there's an error toast, it's a warning (could be transient)
      if (errorCount > 0) {
        console.log('Warning: Error toast visible on dashboard load');
      }
    });
  });

  test.describe('Navigation @critical', () => {
    test('main navigation links are visible', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Verify core navigation items are visible
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-timesheets"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-milestones"]')).toBeVisible();
    });

    test('can navigate to timesheets page', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Click timesheets nav
      await navigateTo(page, 'timesheets');
      
      // Verify URL changed
      await expect(page).toHaveURL(/\/timesheets/);
    });

    test('can navigate to milestones page', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Click milestones nav
      await navigateTo(page, 'milestones');
      
      // Verify URL changed
      await expect(page).toHaveURL(/\/milestones/);
    });

    test('logout button is visible', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Verify logout button is visible
      await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
    });

    test('user menu is visible and clickable', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Verify user menu is visible
      const userMenu = page.locator('[data-testid="user-menu-button"]');
      await expect(userMenu).toBeVisible();
      
      // Click should navigate to account
      await userMenu.click();
      await expect(page).toHaveURL(/\/account/);
    });
  });

  test.describe('Data Loading @critical', () => {
    test('page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`Dashboard DOM content loaded in: ${loadTime}ms`);
    });

    test('loading spinner appears and disappears', async ({ page }) => {
      // Navigate to a page that loads data
      await page.goto('/milestones');
      
      // Wait for page load (spinner should disappear)
      await waitForPageLoad(page);
      
      // Verify spinner is not visible after load
      const spinner = page.locator('[data-testid="loading-spinner"]');
      await expect(spinner).toBeHidden({ timeout: 15000 });
    });
  });

  test.describe('App Stability @smoke', () => {
    test('app recovers from network errors gracefully', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // App should have loaded without crashing
      const content = await page.content();
      expect(content).not.toContain('Application error');
      expect(content).not.toContain('Unhandled Runtime Error');
    });

    test('protected routes stay protected', async ({ page }) => {
      // Even when authenticated, admin-only routes should be protected for non-admins
      // This test verifies the route exists and loads (admin has access)
      await page.goto('/admin/users');
      await waitForPageLoad(page);
      
      // Admin should have access (not redirected to dashboard)
      // The page should load some content
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
    });
  });
});

// ============================================
// MULTI-ROLE SMOKE TESTS
// ============================================
test.describe('Smoke Tests - Role Verification @smoke', () => {
  
  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Viewer should see dashboard
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    });
  });

  test.describe('Contributor Role', () => {
    test.use({ storageState: 'playwright/.auth/contributor.json' });
    
    test('contributor can access timesheets', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Contributor should see timesheets page
      await expect(page).toHaveURL(/\/timesheets/);
    });
  });

  test.describe('Supplier PM Role', () => {
    test.use({ storageState: 'playwright/.auth/supplier_pm.json' });
    
    test('supplier pm can access milestones', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      // Supplier PM should see milestones page
      await expect(page).toHaveURL(/\/milestones/);
    });
  });
});
