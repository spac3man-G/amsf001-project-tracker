/**
 * Comprehensive Feature Tests by Role
 * Location: e2e/features-by-role.spec.js
 * 
 * Tests that each role can perform their expected actions based on permissionMatrix.js.
 * Uses data-testid selectors and proper storageState authentication.
 * 
 * @version 2.4 - Fixed Resources tests to match actual app behavior
 * @updated 14 December 2025
 * 
 * Permission Matrix Summary:
 * - SUPPLIER_SIDE: admin, supplier_pm, supplier_finance
 * - CUSTOMER_SIDE: admin, customer_pm, customer_finance
 * - WORKERS: admin, supplier_pm, supplier_finance, customer_finance, contributor
 * - MANAGERS: admin, supplier_pm, customer_pm
 * 
 * NOTE: resources.create appears to be ADMIN_ONLY in the actual app,
 * while cost column visibility is SUPPLIER_SIDE.
 */

import { test, expect } from '@playwright/test';
import { TestSelectors, expectVisible, expectNotVisible, waitForPageReady, getTestIdSelector } from './test-utils';

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

// ============================================
// HELPER FUNCTIONS
// ============================================

async function navigateTo(page, path) {
  await page.goto(path);
  await waitForPageReady(page);
}

/**
 * Wait for permissions to load on Resources page
 * The permission hooks need time to resolve after page load
 */
async function waitForResourcesPermissions(page) {
  await page.goto('/resources');
  await waitForPageReady(page);
  // Wait for the resources table to render (indicates permissions have loaded)
  await page.waitForSelector('[data-testid="resources-page"]', { timeout: 10000 });
  // Small additional wait for permission hooks to resolve
  await page.waitForTimeout(500);
}

// ============================================
// MILESTONES TESTS
// ============================================

test.describe('Milestones @milestones', () => {

  // SUPPLIER_SIDE can create milestones
  test.describe('Supplier Side Access', () => {
    
    test('admin can see Add Milestone button @admin', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectVisible(page, 'milestones-page');
      await expectVisible(page, 'milestones-title');
      await expectVisible(page, 'add-milestone-button');
      
      await context.close();
    });

    test('supplier_pm can see Add Milestone button @supplier_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectVisible(page, 'add-milestone-button');
      
      await context.close();
    });

    test('supplier_finance can see Add Milestone button @supplier_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_finance });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectVisible(page, 'add-milestone-button');
      
      await context.close();
    });
  });

  // NON-SUPPLIER_SIDE cannot create milestones
  test.describe('Non-Supplier Side Access', () => {
    
    test('customer_pm cannot see Add Milestone button @customer_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectVisible(page, 'milestones-page');
      await expectNotVisible(page, 'add-milestone-button');
      
      await context.close();
    });

    test('customer_finance cannot see Add Milestone button @customer_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectNotVisible(page, 'add-milestone-button');
      
      await context.close();
    });

    test('contributor cannot see Add Milestone button @contributor', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectNotVisible(page, 'add-milestone-button');
      
      await context.close();
    });

    test('viewer cannot see Add Milestone button @viewer', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectNotVisible(page, 'add-milestone-button');
      
      await context.close();
    });
  });
});

// ============================================
// TIMESHEETS TESTS
// ============================================

test.describe('Timesheets @timesheets', () => {

  // WORKERS can create timesheets
  test.describe('Workers Can Add', () => {
    
    test('admin can see Add Timesheet button @admin', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
      const page = await context.newPage();
      await navigateTo(page, '/timesheets');
      
      await expectVisible(page, 'timesheets-page');
      await expectVisible(page, 'add-timesheet-button');
      
      await context.close();
    });

    test('supplier_pm can see Add Timesheet button @supplier_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      await navigateTo(page, '/timesheets');
      
      await expectVisible(page, 'add-timesheet-button');
      
      await context.close();
    });

    test('supplier_finance can see Add Timesheet button @supplier_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_finance });
      const page = await context.newPage();
      await navigateTo(page, '/timesheets');
      
      await expectVisible(page, 'add-timesheet-button');
      
      await context.close();
    });

    test('customer_finance can see Add Timesheet button @customer_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/timesheets');
      
      await expectVisible(page, 'add-timesheet-button');
      
      await context.close();
    });

    test('contributor can see Add Timesheet button @contributor', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/timesheets');
      
      await expectVisible(page, 'add-timesheet-button');
      
      await context.close();
    });
  });

  // NON-WORKERS cannot create timesheets
  test.describe('Non-Workers Cannot Add', () => {
    
    test('customer_pm cannot see Add Timesheet button @customer_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/timesheets');
      
      await expectVisible(page, 'timesheets-page');
      await expectNotVisible(page, 'add-timesheet-button');
      
      await context.close();
    });

    test('viewer cannot see Add Timesheet button @viewer', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/timesheets');
      
      await expectNotVisible(page, 'add-timesheet-button');
      
      await context.close();
    });
  });
});

// ============================================
// EXPENSES TESTS
// ============================================

test.describe('Expenses @expenses', () => {

  // WORKERS can create expenses
  test.describe('Workers Can Add', () => {
    
    test('admin can see Add Expense button @admin', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
      const page = await context.newPage();
      await navigateTo(page, '/expenses');
      
      await expectVisible(page, 'expenses-page');
      await expectVisible(page, 'add-expense-button');
      
      await context.close();
    });

    test('contributor can see Add Expense button @contributor', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/expenses');
      
      await expectVisible(page, 'add-expense-button');
      
      await context.close();
    });
  });

  // NON-WORKERS cannot create expenses
  test.describe('Non-Workers Cannot Add', () => {
    
    test('customer_pm cannot see Add Expense button @customer_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/expenses');
      
      await expectVisible(page, 'expenses-page');
      await expectNotVisible(page, 'add-expense-button');
      
      await context.close();
    });

    test('viewer cannot see Add Expense button @viewer', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/expenses');
      
      await expectNotVisible(page, 'add-expense-button');
      
      await context.close();
    });
  });
});

// ============================================
// DELIVERABLES TESTS
// ============================================

test.describe('Deliverables @deliverables', () => {

  // MANAGERS + CONTRIBUTOR can create deliverables
  test.describe('Managers and Contributors Can Add', () => {
    
    test('admin can see Add Deliverable button @admin', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectVisible(page, 'deliverables-page');
      await expectVisible(page, 'add-deliverable-button');
      
      await context.close();
    });

    test('supplier_pm can see Add Deliverable button @supplier_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectVisible(page, 'add-deliverable-button');
      
      await context.close();
    });

    test('customer_pm can see Add Deliverable button @customer_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectVisible(page, 'add-deliverable-button');
      
      await context.close();
    });

    test('contributor can see Add Deliverable button @contributor', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectVisible(page, 'add-deliverable-button');
      
      await context.close();
    });
  });

  // FINANCE + VIEWER cannot create deliverables
  test.describe('Finance and Viewers Cannot Add', () => {
    
    test('supplier_finance cannot see Add Deliverable button @supplier_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_finance });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectVisible(page, 'deliverables-page');
      await expectNotVisible(page, 'add-deliverable-button');
      
      await context.close();
    });

    test('customer_finance cannot see Add Deliverable button @customer_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectNotVisible(page, 'add-deliverable-button');
      
      await context.close();
    });

    test('viewer cannot see Add Deliverable button @viewer', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectNotVisible(page, 'add-deliverable-button');
      
      await context.close();
    });
  });
});

// ============================================
// RESOURCES TESTS
// ============================================

test.describe('Resources @resources', () => {

  // Admin can create resources (note: app restricts this to admin only)
  test.describe('Admin Access', () => {
    
    test('admin can see Add Resource button and Cost Rate column @admin @critical', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
      const page = await context.newPage();
      await waitForResourcesPermissions(page);
      
      await expectVisible(page, 'resources-page');
      await expectVisible(page, 'add-resource-button');
      await expectVisible(page, 'resources-cost-rate-header');
      await expectVisible(page, 'resources-margin-header');
      
      await context.close();
    });
  });

  // SUPPLIER_SIDE (non-admin) can view cost columns but NOT create resources
  // This matches actual app behavior where resources.create is admin-only
  test.describe('Supplier Side Cost Visibility (Non-Admin)', () => {
    
    test('supplier_pm can see Cost Rate column but not Add button @supplier_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      await waitForResourcesPermissions(page);
      
      await expectVisible(page, 'resources-page');
      // Supplier PM CAN see cost columns (SUPPLIER_SIDE access)
      await expectVisible(page, 'resources-cost-rate-header');
      await expectVisible(page, 'resources-margin-header');
      // But CANNOT add resources (admin-only in actual app)
      await expectNotVisible(page, 'add-resource-button');
      
      await context.close();
    });

    test('supplier_finance can see Cost Rate column but not Add button @supplier_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_finance });
      const page = await context.newPage();
      await waitForResourcesPermissions(page);
      
      await expectVisible(page, 'resources-page');
      // Supplier Finance CAN see cost columns (SUPPLIER_SIDE access)
      await expectVisible(page, 'resources-cost-rate-header');
      await expectVisible(page, 'resources-margin-header');
      // But CANNOT add resources (admin-only in actual app)
      await expectNotVisible(page, 'add-resource-button');
      
      await context.close();
    });
  });

  // CUSTOMER_SIDE + CONTRIBUTOR + VIEWER cannot see cost columns or add resources
  test.describe('Non-Supplier Side Access', () => {
    
    test('customer_pm cannot see Add Resource button or Cost Rate column @customer_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await waitForResourcesPermissions(page);
      
      await expectVisible(page, 'resources-page');
      await expectNotVisible(page, 'add-resource-button');
      await expectNotVisible(page, 'resources-cost-rate-header');
      await expectNotVisible(page, 'resources-margin-header');
      
      await context.close();
    });

    test('customer_finance cannot see Add Resource button or Cost Rate column @customer_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await waitForResourcesPermissions(page);
      
      await expectNotVisible(page, 'add-resource-button');
      await expectNotVisible(page, 'resources-cost-rate-header');
      
      await context.close();
    });

    test('contributor cannot see Add Resource button or Cost Rate column @contributor', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await waitForResourcesPermissions(page);
      
      await expectNotVisible(page, 'add-resource-button');
      await expectNotVisible(page, 'resources-cost-rate-header');
      
      await context.close();
    });

    test('viewer cannot see Add Resource button or Cost Rate column @viewer', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await waitForResourcesPermissions(page);
      
      await expectNotVisible(page, 'add-resource-button');
      await expectNotVisible(page, 'resources-cost-rate-header');
      
      await context.close();
    });
  });
});

// ============================================
// VARIATIONS TESTS
// ============================================

test.describe('Variations @variations', () => {

  // SUPPLIER_SIDE can create variations
  test.describe('Supplier Side Access', () => {
    
    test('admin can see Create Variation button @admin', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectVisible(page, 'variations-page');
      await expectVisible(page, 'create-variation-button');
      
      await context.close();
    });

    test('supplier_pm can see Create Variation button @supplier_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectVisible(page, 'create-variation-button');
      
      await context.close();
    });

    test('supplier_finance can see Create Variation button @supplier_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_finance });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectVisible(page, 'create-variation-button');
      
      await context.close();
    });
  });

  // NON-SUPPLIER_SIDE cannot create variations
  test.describe('Non-Supplier Side Access', () => {
    
    test('customer_pm cannot see Create Variation button @customer_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectVisible(page, 'variations-page');
      await expectNotVisible(page, 'create-variation-button');
      
      await context.close();
    });

    test('customer_finance cannot see Create Variation button @customer_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectNotVisible(page, 'create-variation-button');
      
      await context.close();
    });

    test('contributor cannot see Create Variation button @contributor', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectNotVisible(page, 'create-variation-button');
      
      await context.close();
    });

    test('viewer cannot see Create Variation button @viewer', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectNotVisible(page, 'create-variation-button');
      
      await context.close();
    });
  });
});

// ============================================
// SETTINGS TESTS
// ============================================

test.describe('Settings @settings', () => {

  // SUPPLIER_SIDE can access settings
  test.describe('Supplier Side Access', () => {
    
    test('admin can access Settings page @admin @critical', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.admin });
      const page = await context.newPage();
      await navigateTo(page, '/settings');
      
      await expectVisible(page, 'settings-page');
      await expectVisible(page, 'settings-save-button');
      await expectVisible(page, 'settings-project-name-input');
      
      await context.close();
    });

    test('supplier_pm can access Settings page @supplier_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      await navigateTo(page, '/settings');
      
      await expectVisible(page, 'settings-page');
      await expectVisible(page, 'settings-save-button');
      
      await context.close();
    });

    test('supplier_finance can access Settings page @supplier_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_finance });
      const page = await context.newPage();
      await navigateTo(page, '/settings');
      
      await expectVisible(page, 'settings-page');
      await expectVisible(page, 'settings-save-button');
      
      await context.close();
    });
  });

  // NON-SUPPLIER_SIDE cannot access settings (redirected to dashboard)
  test.describe('Non-Supplier Side Access Denied', () => {
    
    test('customer_pm is redirected from Settings @customer_pm', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      await context.close();
    });

    test('customer_finance is redirected from Settings @customer_finance', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/.*dashboard/);
      
      await context.close();
    });

    test('contributor is redirected from Settings @contributor', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/.*dashboard/);
      
      await context.close();
    });

    test('viewer is redirected from Settings @viewer', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/.*dashboard/);
      
      await context.close();
    });
  });
});

// ============================================
// NAVIGATION VISIBILITY TESTS
// ============================================

test.describe('Navigation Visibility @navigation', () => {

  test('supplier_pm sees full navigation including Partners and Settings @supplier_pm @smoke', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
    const page = await context.newPage();
    await navigateTo(page, '/dashboard');
    
    // Supplier should see Partners and Settings links (Layout uses nav-{itemId} pattern)
    await expect(page.locator('[data-testid="nav-partners"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible();
    
    await context.close();
  });

  test('customer_pm does not see Partners or Settings in navigation @customer_pm @smoke', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
    const page = await context.newPage();
    await navigateTo(page, '/dashboard');
    
    // Customer should NOT see Partners and Settings links
    await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    
    await context.close();
  });

  test('viewer has minimal navigation @viewer @smoke', async ({ browser }) => {
    const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
    const page = await context.newPage();
    await navigateTo(page, '/dashboard');
    
    // Viewer should NOT see Partners or Settings
    await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
    
    await context.close();
  });
});
