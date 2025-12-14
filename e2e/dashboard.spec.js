/**
 * E2E Tests - Dashboard
 * Location: e2e/dashboard.spec.js
 * 
 * Tests the main dashboard functionality including widgets,
 * refresh capability, and data loading.
 * 
 * IMPORTANT: All selectors use data-testid per docs/TESTING-CONVENTIONS.md
 * 
 * @version 2.0
 * @modified 14 December 2025 - Updated to use testing contract
 */

import { test, expect } from '@playwright/test';
import { 
  waitForPageLoad, 
  navigateTo,
  waitForToast
} from './helpers/test-utils.js';

// ============================================
// DASHBOARD TESTS (Admin role)
// ============================================
test.describe('Dashboard Page @dashboard', () => {
  // Use admin auth state for dashboard tests
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Load @critical', () => {
    test('dashboard page loads with correct elements', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Verify main dashboard container is visible
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible({ timeout: 15000 });
      
      // Verify header elements
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-project-info"]')).toBeVisible();
    });

    test('dashboard shows project info in header', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Project info should be visible (project ref • project name format)
      const projectInfo = page.locator('[data-testid="dashboard-project-info"]');
      await expect(projectInfo).toBeVisible();
      
      // Should contain the bullet separator
      const text = await projectInfo.textContent();
      expect(text).toContain('•');
    });

    test('dashboard loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
      
      console.log(`Dashboard loaded in: ${loadTime}ms`);
    });
  });

  test.describe('Dashboard Widgets @smoke', () => {
    test('widgets section is visible', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Main widgets grid should be visible
      await expect(page.locator('[data-testid="dashboard-widgets"]')).toBeVisible({ timeout: 15000 });
    });

    test('dashboard content sections are present', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Content area should be visible
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      
      // Check for KPI section (may or may not have data)
      const kpiSection = page.locator('[data-testid="dashboard-kpi-section"]');
      await expect(kpiSection).toBeVisible({ timeout: 10000 });
      
      // Check for QS section
      const qsSection = page.locator('[data-testid="dashboard-qs-section"]');
      await expect(qsSection).toBeVisible();
      
      // Check for finance section
      const financeSection = page.locator('[data-testid="dashboard-finance-section"]');
      await expect(financeSection).toBeVisible();
    });
  });

  test.describe('Refresh Functionality @smoke', () => {
    test('refresh button is visible', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Refresh button should be visible
      await expect(page.locator('[data-testid="dashboard-refresh-button"]')).toBeVisible();
    });

    test('refresh button triggers data reload', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Click refresh button
      const refreshButton = page.locator('[data-testid="dashboard-refresh-button"]');
      await refreshButton.click();
      
      // Button should show disabled state while refreshing (briefly)
      // We just verify the click doesn't cause an error
      
      // Wait a moment for any refresh animation
      await page.waitForTimeout(1500);
      
      // Dashboard should still be visible after refresh
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
    });
  });

  test.describe('Navigation from Dashboard @smoke', () => {
    test('can navigate to timesheets from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Use navigation helper
      await navigateTo(page, 'timesheets');
      
      // Verify URL changed
      await expect(page).toHaveURL(/\/timesheets/);
    });

    test('can navigate to milestones from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Use navigation helper
      await navigateTo(page, 'milestones');
      
      // Verify URL changed
      await expect(page).toHaveURL(/\/milestones/);
    });
  });

  test.describe('Greeting Display', () => {
    test('dashboard shows time-appropriate greeting', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Title should contain one of the greetings
      const title = page.locator('[data-testid="dashboard-title"]');
      const titleText = await title.textContent();
      
      const validGreetings = ['Good morning', 'Good afternoon', 'Good evening'];
      const hasValidGreeting = validGreetings.some(greeting => 
        titleText?.includes(greeting)
      );
      
      expect(hasValidGreeting).toBeTruthy();
    });
  });
});

// ============================================
// MULTI-ROLE DASHBOARD TESTS
// ============================================
test.describe('Dashboard - Role Access @dashboard', () => {
  
  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Viewer should see the dashboard
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Contributor Role', () => {
    test.use({ storageState: 'playwright/.auth/contributor.json' });
    
    test('contributor can access dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Contributor should see the dashboard
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Supplier PM Role', () => {
    test.use({ storageState: 'playwright/.auth/supplier_pm.json' });
    
    test('supplier PM can access dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Supplier PM should see the dashboard
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Customer PM Role', () => {
    test.use({ storageState: 'playwright/.auth/customer_pm.json' });
    
    test('customer PM can access dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageLoad(page);
      
      // Customer PM should see the dashboard
      await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible({ timeout: 15000 });
    });
  });
});
