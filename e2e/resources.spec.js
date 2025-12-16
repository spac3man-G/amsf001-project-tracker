/**
 * E2E Tests - Resources
 * Location: e2e/resources.spec.js
 * 
 * Tests resource management functionality including page load, CRUD operations,
 * cost/margin visibility by role, and team member views.
 * 
 * IMPORTANT: All selectors use data-testid per docs/TESTING-CONVENTIONS.md
 * 
 * @version 1.0
 * @created 15 December 2025
 */

import { test, expect } from '@playwright/test';
import { 
  waitForPageLoad, 
  waitForToast,
  navigateTo
} from './helpers/test-utils.js';

// ============================================
// RESOURCES PAGE TESTS (Admin role)
// ============================================
test.describe('Resources Page @resources', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Load @critical', () => {
    test('resources page loads with correct elements', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      // Verify main page container
      await expect(page.locator('[data-testid="resources-page"]')).toBeVisible({ timeout: 15000 });
      
      // Verify header elements
      await expect(page.locator('[data-testid="resources-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="resources-title"]')).toBeVisible();
    });

    test('resources page has correct title', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      const title = page.locator('[data-testid="resources-title"]');
      await expect(title).toHaveText('Team Resources');
    });

    test('resources page URL is correct', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/\/resources/);
    });
  });

  test.describe('Table Display @smoke', () => {
    test('resources table is visible', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      // Table card should be visible
      await expect(page.locator('[data-testid="resources-table-card"]')).toBeVisible({ timeout: 15000 });
      
      // Table itself should be visible
      await expect(page.locator('[data-testid="resources-table"]')).toBeVisible();
    });

    test('resources count is displayed', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-count"]')).toBeVisible();
    });

    test('resources displays empty state or data', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      const table = page.locator('[data-testid="resources-table"]');
      await expect(table).toBeVisible({ timeout: 15000 });
      
      // Either rows or empty state
      const emptyState = page.locator('[data-testid="resources-empty-state"]');
      const rows = page.locator('[data-testid^="resource-row-"]');
      
      const emptyCount = await emptyState.count();
      const rowCount = await rows.count();
      
      expect(emptyCount > 0 || rowCount > 0).toBeTruthy();
    });
  });

  test.describe('Add Button @smoke', () => {
    test('add resource button is visible for admin', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-resource-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('refresh button is visible', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-refresh-button"]')).toBeVisible();
    });
  });

  test.describe('Refresh Functionality @smoke', () => {
    test('refresh button triggers data reload', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      const refreshButton = page.locator('[data-testid="resources-refresh-button"]');
      await refreshButton.click();
      
      await page.waitForTimeout(1500);
      
      await expect(page.locator('[data-testid="resources-page"]')).toBeVisible();
    });
  });
});

// ============================================
// RESOURCE FORM TESTS
// ============================================
test.describe('Resource Form @resources', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Form Display', () => {
    test('clicking add button shows resource form', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-resource-button"]').click();
      
      await expect(page.locator('[data-testid="resources-add-form"]')).toBeVisible({ timeout: 5000 });
    });

    test('resource form has all required fields', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-resource-button"]').click();
      await expect(page.locator('[data-testid="resources-add-form"]')).toBeVisible();
      
      // Check for form fields
      await expect(page.locator('[data-testid="resource-ref-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="resource-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="resource-email-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="resource-role-select"]')).toBeVisible();
    });

    test('resource form has save and cancel buttons', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-resource-button"]').click();
      await expect(page.locator('[data-testid="resources-add-form"]')).toBeVisible();
      
      await expect(page.locator('[data-testid="resource-save-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="resource-cancel-button"]')).toBeVisible();
    });
  });

  test.describe('Form Interaction', () => {
    test('cancel button closes the form', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-resource-button"]').click();
      await expect(page.locator('[data-testid="resources-add-form"]')).toBeVisible();
      
      await page.locator('[data-testid="resource-cancel-button"]').click();
      
      await expect(page.locator('[data-testid="resources-add-form"]')).toBeHidden();
      await expect(page.locator('[data-testid="add-resource-button"]')).toBeVisible();
    });
  });
});

// ============================================
// SUPPLIER-SIDE COST/MARGIN VISIBILITY
// ============================================
test.describe('Resources - Cost Visibility @resources', () => {
  
  test.describe('Supplier PM Role (sees costs)', () => {
    test.use({ storageState: 'playwright/.auth/supplier_pm.json' });
    
    test('supplier PM sees cost rate column header', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-cost-rate-header"]')).toBeVisible({ timeout: 10000 });
    });

    test('supplier PM sees margin column header', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-margin-header"]')).toBeVisible({ timeout: 10000 });
    });

    test('supplier PM sees type column header', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-type-header"]')).toBeVisible({ timeout: 10000 });
    });

    test('supplier PM sees type filter', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-filter-type"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Customer PM Role (no costs)', () => {
    test.use({ storageState: 'playwright/.auth/customer_pm.json' });
    
    test('customer PM does not see cost rate column', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-cost-rate-header"]')).toBeHidden({ timeout: 5000 });
    });

    test('customer PM does not see margin column', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-margin-header"]')).toBeHidden({ timeout: 5000 });
    });

    test('customer PM does not see type filter', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-filter-type"]')).toBeHidden({ timeout: 5000 });
    });
  });
});

// ============================================
// MULTI-ROLE RESOURCE TESTS
// ============================================
test.describe('Resources - Role Access @resources', () => {
  
  test.describe('Supplier PM Role', () => {
    test.use({ storageState: 'playwright/.auth/supplier_pm.json' });
    
    test('supplier PM can access resources page', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('supplier PM sees add resource button', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-resource-button"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Customer PM Role', () => {
    test.use({ storageState: 'playwright/.auth/customer_pm.json' });
    
    test('customer PM can access resources page', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('customer PM does not see add resource button', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-resource-button"]')).toBeHidden({ timeout: 5000 });
    });
  });

  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access resources page', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="resources-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('viewer does not see add resource button', async ({ page }) => {
      await page.goto('/resources');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-resource-button"]')).toBeHidden({ timeout: 5000 });
    });
  });
});

// ============================================
// NAVIGATION TESTS
// ============================================
test.describe('Resources - Navigation @resources', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('can navigate to resources via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'resources');
    
    await expect(page).toHaveURL(/\/resources/);
    await expect(page.locator('[data-testid="resources-page"]')).toBeVisible({ timeout: 15000 });
  });

  // Note: Team Members page was removed from navigation - resources is now used for team management
});
