/**
 * E2E Tests - Permissions by Role (Negative Tests)
 * Location: e2e/permissions-by-role.spec.js
 * 
 * Tests what each role CANNOT do - verifies UI correctly hides features.
 * Uses data-testid selectors and pre-authenticated storageState.
 * 
 * @version 2.1 - Fixed storageState paths (Window 5)
 * @updated 14 December 2025
 * 
 * This is the complement to features-by-role.spec.js:
 * - features-by-role.spec.js = POSITIVE tests (what roles CAN do)
 * - permissions-by-role.spec.js = NEGATIVE tests (what roles CANNOT do)
 */

import { test, expect } from '@playwright/test';
import { expectNotVisible, expectVisible, waitForPageReady } from './test-utils';

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

// ============================================
// VIEWER RESTRICTIONS
// Viewers have the most restrictions - read-only everywhere
// ============================================

test.describe('Viewer Restrictions @viewer', () => {
  
  test.describe('Cannot Create Anything', () => {
    
    test('viewer cannot add timesheets', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/timesheets');
      
      await expectVisible(page, 'timesheets-page');
      await expectNotVisible(page, 'add-timesheet-button');
      
      await context.close();
    });

    test('viewer cannot add expenses', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/expenses');
      
      await expectVisible(page, 'expenses-page');
      await expectNotVisible(page, 'add-expense-button');
      await expectNotVisible(page, 'scan-receipt-button');
      
      await context.close();
    });

    test('viewer cannot add milestones', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectVisible(page, 'milestones-page');
      await expectNotVisible(page, 'add-milestone-button');
      
      await context.close();
    });

    test('viewer cannot add deliverables', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectVisible(page, 'deliverables-page');
      await expectNotVisible(page, 'add-deliverable-button');
      
      await context.close();
    });

    test('viewer cannot add resources', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/resources');
      
      await expectVisible(page, 'resources-page');
      await expectNotVisible(page, 'add-resource-button');
      
      await context.close();
    });

    test('viewer cannot create variations', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectVisible(page, 'variations-page');
      await expectNotVisible(page, 'create-variation-button');
      
      await context.close();
    });
  });

  test.describe('Navigation Restrictions', () => {
    
    test('viewer cannot see Partners in navigation', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/dashboard');
      
      await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
      
      await context.close();
    });

    test('viewer cannot see Settings in navigation', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await navigateTo(page, '/dashboard');
      
      await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
      
      await context.close();
    });
  });

  test.describe('Page Access Restrictions', () => {
    
    test('viewer is redirected from Settings page', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.viewer });
      const page = await context.newPage();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL(/.*dashboard/);
      
      await context.close();
    });
  });
});

// ============================================
// CONTRIBUTOR RESTRICTIONS
// Can create work items but cannot manage project structure
// ============================================

test.describe('Contributor Restrictions @contributor', () => {
  
  test.describe('Cannot Manage Project Structure', () => {
    
    test('contributor cannot add milestones', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectVisible(page, 'milestones-page');
      await expectNotVisible(page, 'add-milestone-button');
      
      await context.close();
    });

    test('contributor cannot add resources', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/resources');
      
      await expectVisible(page, 'resources-page');
      await expectNotVisible(page, 'add-resource-button');
      
      await context.close();
    });

    test('contributor cannot create variations', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectVisible(page, 'variations-page');
      await expectNotVisible(page, 'create-variation-button');
      
      await context.close();
    });
  });

  test.describe('Cannot See Supplier Data', () => {
    
    test('contributor cannot see cost rate column', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/resources');
      
      await expectVisible(page, 'resources-page');
      await expectNotVisible(page, 'resources-cost-rate-header');
      await expectNotVisible(page, 'resources-margin-header');
      
      await context.close();
    });
  });

  test.describe('Navigation Restrictions', () => {
    
    test('contributor cannot see Partners in navigation', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/dashboard');
      
      await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
      
      await context.close();
    });

    test('contributor cannot see Settings in navigation', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await navigateTo(page, '/dashboard');
      
      await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
      
      await context.close();
    });
  });

  test.describe('Page Access Restrictions', () => {
    
    test('contributor is redirected from Settings page', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/.*dashboard/);
      
      await context.close();
    });
  });
});

// ============================================
// CUSTOMER PM RESTRICTIONS
// Customer side - cannot manage supplier resources or structure
// ============================================

test.describe('Customer PM Restrictions @customer_pm', () => {
  
  test.describe('Cannot Manage Supplier Structure', () => {
    
    test('customer_pm cannot add milestones', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectVisible(page, 'milestones-page');
      await expectNotVisible(page, 'add-milestone-button');
      
      await context.close();
    });

    test('customer_pm cannot add resources', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/resources');
      
      await expectVisible(page, 'resources-page');
      await expectNotVisible(page, 'add-resource-button');
      
      await context.close();
    });

    test('customer_pm cannot create variations', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectVisible(page, 'variations-page');
      await expectNotVisible(page, 'create-variation-button');
      
      await context.close();
    });
  });

  test.describe('Cannot Add Work Items (Not a Worker)', () => {
    
    test('customer_pm cannot add timesheets', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/timesheets');
      
      await expectVisible(page, 'timesheets-page');
      await expectNotVisible(page, 'add-timesheet-button');
      
      await context.close();
    });

    test('customer_pm cannot add expenses', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/expenses');
      
      await expectVisible(page, 'expenses-page');
      await expectNotVisible(page, 'add-expense-button');
      
      await context.close();
    });
  });

  test.describe('Cannot See Supplier Costs', () => {
    
    test('customer_pm cannot see cost rate column', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/resources');
      
      await expectVisible(page, 'resources-page');
      await expectNotVisible(page, 'resources-cost-rate-header');
      await expectNotVisible(page, 'resources-margin-header');
      
      await context.close();
    });
  });

  test.describe('Navigation Restrictions', () => {
    
    test('customer_pm cannot see Partners in navigation', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/dashboard');
      
      await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
      
      await context.close();
    });

    test('customer_pm cannot see Settings in navigation', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await navigateTo(page, '/dashboard');
      
      await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
      
      await context.close();
    });
  });

  test.describe('Page Access Restrictions', () => {
    
    test('customer_pm is redirected from Settings page', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/.*dashboard/);
      
      await context.close();
    });
  });
});

// ============================================
// CUSTOMER FINANCE RESTRICTIONS
// Similar to Customer PM but can add work items
// ============================================

test.describe('Customer Finance Restrictions @customer_finance', () => {
  
  test.describe('Cannot Manage Project Structure', () => {
    
    test('customer_finance cannot add milestones', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/milestones');
      
      await expectVisible(page, 'milestones-page');
      await expectNotVisible(page, 'add-milestone-button');
      
      await context.close();
    });

    test('customer_finance cannot add resources', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/resources');
      
      await expectVisible(page, 'resources-page');
      await expectNotVisible(page, 'add-resource-button');
      
      await context.close();
    });

    test('customer_finance cannot create variations', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/variations');
      
      await expectVisible(page, 'variations-page');
      await expectNotVisible(page, 'create-variation-button');
      
      await context.close();
    });

    test('customer_finance cannot add deliverables', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectVisible(page, 'deliverables-page');
      await expectNotVisible(page, 'add-deliverable-button');
      
      await context.close();
    });
  });

  test.describe('Cannot See Supplier Costs', () => {
    
    test('customer_finance cannot see cost rate column', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/resources');
      
      await expectVisible(page, 'resources-page');
      await expectNotVisible(page, 'resources-cost-rate-header');
      
      await context.close();
    });
  });

  test.describe('Navigation Restrictions', () => {
    
    test('customer_finance cannot see Partners in navigation', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/dashboard');
      
      await expect(page.locator('[data-testid="nav-partners"]')).not.toBeVisible();
      
      await context.close();
    });

    test('customer_finance cannot see Settings in navigation', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await navigateTo(page, '/dashboard');
      
      await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible();
      
      await context.close();
    });
  });

  test.describe('Page Access Restrictions', () => {
    
    test('customer_finance is redirected from Settings page', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_finance });
      const page = await context.newPage();
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveURL(/.*dashboard/);
      
      await context.close();
    });
  });
});

// ============================================
// SUPPLIER FINANCE RESTRICTIONS
// Can do most things but cannot add deliverables (not a manager)
// ============================================

test.describe('Supplier Finance Restrictions @supplier_finance', () => {
  
  test.describe('Cannot Add Deliverables (Not a Manager)', () => {
    
    test('supplier_finance cannot add deliverables', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_finance });
      const page = await context.newPage();
      await navigateTo(page, '/deliverables');
      
      await expectVisible(page, 'deliverables-page');
      await expectNotVisible(page, 'add-deliverable-button');
      
      await context.close();
    });
  });
});
