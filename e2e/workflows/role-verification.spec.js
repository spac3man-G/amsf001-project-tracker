/**
 * FULL ROLE VERIFICATION TESTS
 * Location: e2e/workflows/role-verification.spec.js
 * 
 * Comprehensive verification using data-testid selectors.
 * 
 * @version 2.1 - Fixed storageState paths (Window 6)
 * @updated 14 December 2025
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady, expectVisible, expectNotVisible } from '../test-utils';

// ============================================
// AUTH STATE PATHS
// ============================================

const AUTH_PATHS = {
  admin: 'playwright/.auth/admin.json',
  supplier_pm: 'playwright/.auth/supplier_pm.json',
  supplier_finance: 'playwright/.auth/supplier_finance.json',
  customer_pm: 'playwright/.auth/customer_pm.json',
  customer_finance: 'playwright/.auth/customer_finance.json',
  contributor: 'playwright/.auth/contributor.json',
  viewer: 'playwright/.auth/viewer.json',
};

async function navigateTo(page, path) {
  await page.goto(path);
  await waitForPageReady(page);
}

// ============================================
// ADMIN ROLE - Should have FULL access
// ============================================

test.describe('Admin Role Verification @admin @comprehensive', () => {
  
  test('Admin can access all main pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
    const page = await context.newPage();
    
    const pages = [
      { path: '/dashboard', testId: 'dashboard-page' },
      { path: '/timesheets', testId: 'timesheets-page' },
      { path: '/expenses', testId: 'expenses-page' },
      { path: '/milestones', testId: 'milestones-page' },
      { path: '/deliverables', testId: 'deliverables-page' },
      { path: '/resources', testId: 'resources-page' },
      { path: '/variations', testId: 'variations-page' },
      { path: '/settings', testId: 'settings-page' },
    ];

    for (const { path, testId } of pages) {
      await navigateTo(page, path);
      await expectVisible(page, testId);
    }
    
    await context.close();
  });

  test('Admin sees all Add buttons', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
    const page = await context.newPage();
    
    await navigateTo(page, '/timesheets');
    await expectVisible(page, 'add-timesheet-button');
    
    await navigateTo(page, '/expenses');
    await expectVisible(page, 'add-expense-button');
    
    await navigateTo(page, '/milestones');
    await expectVisible(page, 'add-milestone-button');
    
    await navigateTo(page, '/deliverables');
    await expectVisible(page, 'add-deliverable-button');
    
    await navigateTo(page, '/resources');
    await expectVisible(page, 'add-resource-button');
    
    await navigateTo(page, '/variations');
    await expectVisible(page, 'create-variation-button');
    
    await context.close();
  });

  test('Admin sees cost information', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
    const page = await context.newPage();
    
    await navigateTo(page, '/resources');
    await expectVisible(page, 'resources-cost-rate-header');
    await expectVisible(page, 'resources-margin-header');
    
    await context.close();
  });
});

// ============================================
// SUPPLIER PM - Manages supplier side
// ============================================

test.describe('Supplier PM Role Verification @supplier_pm @comprehensive', () => {
  
  test('Supplier PM can access supplier pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expectVisible(page, 'dashboard-page');
    
    await navigateTo(page, '/settings');
    await expectVisible(page, 'settings-page');
    
    await context.close();
  });

  test('Supplier PM can create milestones and variations', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
    const page = await context.newPage();
    
    await navigateTo(page, '/milestones');
    await expectVisible(page, 'add-milestone-button');
    
    await navigateTo(page, '/variations');
    await expectVisible(page, 'create-variation-button');
    
    await context.close();
  });

  test('Supplier PM sees cost information', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
    const page = await context.newPage();
    
    await navigateTo(page, '/resources');
    await expectVisible(page, 'resources-cost-rate-header');
    
    await context.close();
  });
});

// ============================================
// CUSTOMER PM - Approves work, no supplier access
// ============================================

test.describe('Customer PM Role Verification @customer_pm @comprehensive', () => {
  
  test('Customer PM cannot see Partners or Settings nav', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    
    await context.close();
  });

  test('Customer PM cannot create milestones or variations', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
    const page = await context.newPage();
    
    await navigateTo(page, '/milestones');
    await expectNotVisible(page, 'add-milestone-button');
    
    await navigateTo(page, '/variations');
    await expectNotVisible(page, 'create-variation-button');
    
    await context.close();
  });

  test('Customer PM cannot see cost prices', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
    const page = await context.newPage();
    
    await navigateTo(page, '/resources');
    await expectNotVisible(page, 'resources-cost-rate-header');
    
    await context.close();
  });

  test('Customer PM is redirected from settings', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
    const page = await context.newPage();
    
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*dashboard/);
    
    await context.close();
  });
});

// ============================================
// CONTRIBUTOR - Does work, limited management
// ============================================

test.describe('Contributor Role Verification @contributor @comprehensive', () => {
  
  test('Contributor can create work items', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
    const page = await context.newPage();
    
    await navigateTo(page, '/timesheets');
    await expectVisible(page, 'add-timesheet-button');
    
    await navigateTo(page, '/expenses');
    await expectVisible(page, 'add-expense-button');
    
    await navigateTo(page, '/deliverables');
    await expectVisible(page, 'add-deliverable-button');
    
    await context.close();
  });

  test('Contributor cannot see Partners or Settings', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    
    await context.close();
  });

  test('Contributor cannot create milestones', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
    const page = await context.newPage();
    
    await navigateTo(page, '/milestones');
    await expectNotVisible(page, 'add-milestone-button');
    
    await context.close();
  });

  test('Contributor cannot see cost information', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
    const page = await context.newPage();
    
    await navigateTo(page, '/resources');
    await expectNotVisible(page, 'resources-cost-rate-header');
    
    await context.close();
  });
});

// ============================================
// VIEWER - Read-only access
// ============================================

test.describe('Viewer Role Verification @viewer @comprehensive', () => {
  
  test('Viewer can view pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expectVisible(page, 'dashboard-page');
    
    await navigateTo(page, '/timesheets');
    await expectVisible(page, 'timesheets-page');
    
    await context.close();
  });

  test('Viewer cannot see any Add buttons', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
    const page = await context.newPage();
    
    await navigateTo(page, '/timesheets');
    await expectNotVisible(page, 'add-timesheet-button');
    
    await navigateTo(page, '/expenses');
    await expectNotVisible(page, 'add-expense-button');
    
    await navigateTo(page, '/milestones');
    await expectNotVisible(page, 'add-milestone-button');
    
    await navigateTo(page, '/deliverables');
    await expectNotVisible(page, 'add-deliverable-button');
    
    await context.close();
  });

  test('Viewer cannot see Partners or Settings', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    
    await context.close();
  });

  test('Viewer cannot see cost information', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
    const page = await context.newPage();
    
    await navigateTo(page, '/resources');
    await expectNotVisible(page, 'resources-cost-rate-header');
    
    await context.close();
  });
});
