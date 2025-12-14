/**
 * FULL ROLE VERIFICATION TESTS
 * Location: e2e/workflows/role-verification.spec.js
 * 
 * Comprehensive verification that each role can ONLY do what they're allowed to.
 * This tests the entire permission matrix for each user type.
 * 
 * @version 2.0 - Updated with testing contract (data-testid selectors)
 * @updated 14 December 2025
 */

import { test, expect } from '@playwright/test';
import { expectVisible, expectNotVisible, waitForPageReady } from '../test-utils';

// ============================================
// HELPER FUNCTIONS
// ============================================

async function navigateTo(page, path) {
  await page.goto(path);
  await waitForPageReady(page);
}

// ============================================
// ADMIN ROLE - Should have FULL access
// ============================================

test.describe('Admin Role Verification @admin @comprehensive', () => {

  test('Admin can access ALL pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' });
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

  test('Admin sees Add buttons on all entity pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' });
    const page = await context.newPage();
    
    const entityPages = [
      { path: '/timesheets', buttonId: 'add-timesheet-button' },
      { path: '/expenses', buttonId: 'add-expense-button' },
      { path: '/milestones', buttonId: 'add-milestone-button' },
      { path: '/deliverables', buttonId: 'add-deliverable-button' },
      { path: '/resources', buttonId: 'add-resource-button' },
      { path: '/variations', buttonId: 'create-variation-button' },
    ];
    
    for (const { path, buttonId } of entityPages) {
      await navigateTo(page, path);
      await expectVisible(page, buttonId);
    }
    
    await context.close();
  });

  test('Admin sees cost/rate information', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/resources');
    
    await expectVisible(page, 'resources-page');
    await expectVisible(page, 'resources-cost-rate-header');
    await expectVisible(page, 'resources-margin-header');
    
    await context.close();
  });

  test('Admin sees navigation including Partners and Settings', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    
    await expect(page.locator('[data-testid="nav-partners"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();
    
    await context.close();
  });
});

// ============================================
// SUPPLIER PM - Manages supplier side
// ============================================

test.describe('Supplier PM Role Verification @supplier_pm @comprehensive', () => {

  test('Supplier PM can access supplier pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/supplier_pm.json' });
    const page = await context.newPage();
    
    const allowedPages = [
      { path: '/dashboard', testId: 'dashboard-page' },
      { path: '/timesheets', testId: 'timesheets-page' },
      { path: '/expenses', testId: 'expenses-page' },
      { path: '/milestones', testId: 'milestones-page' },
      { path: '/deliverables', testId: 'deliverables-page' },
      { path: '/resources', testId: 'resources-page' },
      { path: '/variations', testId: 'variations-page' },
      { path: '/settings', testId: 'settings-page' },
    ];

    for (const { path, testId } of allowedPages) {
      await navigateTo(page, path);
      await expectVisible(page, testId);
    }
    
    await context.close();
  });

  test('Supplier PM can create milestones', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/supplier_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/milestones');
    await expectVisible(page, 'add-milestone-button');
    
    await context.close();
  });

  test('Supplier PM can create variations', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/supplier_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/variations');
    await expectVisible(page, 'create-variation-button');
    
    await context.close();
  });

  test('Supplier PM sees cost information', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/supplier_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/resources');
    await expectVisible(page, 'resources-cost-rate-header');
    await expectVisible(page, 'resources-margin-header');
    
    await context.close();
  });

  test('Supplier PM sees Partners and Settings in navigation', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/supplier_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    
    await expect(page.locator('[data-testid="nav-partners"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();
    
    await context.close();
  });
});

// ============================================
// CUSTOMER PM - Manages customer side, approves work
// ============================================

test.describe('Customer PM Role Verification @customer_pm @comprehensive', () => {

  test('Customer PM can access allowed pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    
    const allowedPages = [
      { path: '/dashboard', testId: 'dashboard-page' },
      { path: '/timesheets', testId: 'timesheets-page' },
      { path: '/expenses', testId: 'expenses-page' },
      { path: '/milestones', testId: 'milestones-page' },
      { path: '/deliverables', testId: 'deliverables-page' },
      { path: '/resources', testId: 'resources-page' },
      { path: '/variations', testId: 'variations-page' },
    ];

    for (const { path, testId } of allowedPages) {
      await navigateTo(page, path);
      await expectVisible(page, testId);
    }
    
    await context.close();
  });

  test('Customer PM CANNOT see Partners in navigation', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
    
    await context.close();
  });

  test('Customer PM CANNOT see Settings in navigation', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    
    await context.close();
  });

  test('Customer PM CANNOT create milestones', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/milestones');
    await expectVisible(page, 'milestones-page');
    await expectNotVisible(page, 'add-milestone-button');
    
    await context.close();
  });

  test('Customer PM CANNOT create variations', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/variations');
    await expectVisible(page, 'variations-page');
    await expectNotVisible(page, 'create-variation-button');
    
    await context.close();
  });

  test('Customer PM CANNOT see cost prices', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/resources');
    await expectVisible(page, 'resources-page');
    await expectNotVisible(page, 'resources-cost-rate-header');
    await expectNotVisible(page, 'resources-margin-header');
    
    await context.close();
  });

  test('Customer PM can add deliverables', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/deliverables');
    await expectVisible(page, 'add-deliverable-button');
    
    await context.close();
  });
});

// ============================================
// CONTRIBUTOR - Does work, submits for approval
// ============================================

test.describe('Contributor Role Verification @contributor @comprehensive', () => {

  test('Contributor can access work pages', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    
    const allowedPages = [
      { path: '/dashboard', testId: 'dashboard-page' },
      { path: '/timesheets', testId: 'timesheets-page' },
      { path: '/expenses', testId: 'expenses-page' },
      { path: '/deliverables', testId: 'deliverables-page' },
      { path: '/milestones', testId: 'milestones-page' },
      { path: '/resources', testId: 'resources-page' },
      { path: '/variations', testId: 'variations-page' },
    ];

    for (const { path, testId } of allowedPages) {
      await navigateTo(page, path);
      await expectVisible(page, testId);
    }
    
    await context.close();
  });

  test('Contributor can create timesheets', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/timesheets');
    await expectVisible(page, 'add-timesheet-button');
    
    await context.close();
  });

  test('Contributor can create expenses', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/expenses');
    await expectVisible(page, 'add-expense-button');
    
    await context.close();
  });

  test('Contributor can create deliverables', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/deliverables');
    await expectVisible(page, 'add-deliverable-button');
    
    await context.close();
  });

  test('Contributor CANNOT see Partners', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
    
    await context.close();
  });

  test('Contributor CANNOT see Settings', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    
    await context.close();
  });

  test('Contributor CANNOT create milestones', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/milestones');
    await expectNotVisible(page, 'add-milestone-button');
    
    await context.close();
  });

  test('Contributor CANNOT see cost information', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
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
    const context = await browser.newContext({ storageState: 'e2e/.auth/viewer.json' });
    const page = await context.newPage();
    
    const viewablePages = [
      { path: '/dashboard', testId: 'dashboard-page' },
      { path: '/timesheets', testId: 'timesheets-page' },
      { path: '/expenses', testId: 'expenses-page' },
      { path: '/milestones', testId: 'milestones-page' },
      { path: '/deliverables', testId: 'deliverables-page' },
      { path: '/resources', testId: 'resources-page' },
      { path: '/variations', testId: 'variations-page' },
    ];

    for (const { path, testId } of viewablePages) {
      await navigateTo(page, path);
      await expectVisible(page, testId);
    }
    
    await context.close();
  });

  test('Viewer CANNOT see any Add buttons', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/viewer.json' });
    const page = await context.newPage();
    
    const entityPages = [
      { path: '/timesheets', buttonId: 'add-timesheet-button' },
      { path: '/expenses', buttonId: 'add-expense-button' },
      { path: '/milestones', buttonId: 'add-milestone-button' },
      { path: '/deliverables', buttonId: 'add-deliverable-button' },
      { path: '/resources', buttonId: 'add-resource-button' },
      { path: '/variations', buttonId: 'create-variation-button' },
    ];
    
    for (const { path, buttonId } of entityPages) {
      await navigateTo(page, path);
      await expectNotVisible(page, buttonId);
    }
    
    await context.close();
  });

  test('Viewer CANNOT see Partners', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/viewer.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
    
    await context.close();
  });

  test('Viewer CANNOT see Settings', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/viewer.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/dashboard');
    await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    
    await context.close();
  });

  test('Viewer CANNOT see cost information', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/viewer.json' });
    const page = await context.newPage();
    
    await navigateTo(page, '/resources');
    await expectNotVisible(page, 'resources-cost-rate-header');
    
    await context.close();
  });

  test('Viewer is redirected from Settings page', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/viewer.json' });
    const page = await context.newPage();
    
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    await context.close();
  });
});
