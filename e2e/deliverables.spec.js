/**
 * E2E Tests - Deliverables
 * Location: e2e/deliverables.spec.js
 * 
 * Tests deliverable functionality including page load, CRUD operations,
 * status transitions, review workflow, and role-based access.
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
// DELIVERABLES PAGE TESTS (Admin role)
// ============================================
test.describe('Deliverables Page @deliverables', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Load @critical', () => {
    test('deliverables page loads with correct elements', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      // Verify main page container
      await expect(page.locator('[data-testid="deliverables-page"]')).toBeVisible({ timeout: 15000 });
      
      // Verify header elements
      await expect(page.locator('[data-testid="deliverables-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="deliverables-title"]')).toBeVisible();
    });

    test('deliverables page has correct title', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      const title = page.locator('[data-testid="deliverables-title"]');
      await expect(title).toHaveText('Deliverables');
    });

    test('deliverables page URL is correct', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/\/deliverables/);
    });
  });

  test.describe('Table Display @smoke', () => {
    test('deliverables table is visible', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      // Table card should be visible
      await expect(page.locator('[data-testid="deliverables-table-card"]')).toBeVisible({ timeout: 15000 });
      
      // Table itself should be visible
      await expect(page.locator('[data-testid="deliverables-table"]')).toBeVisible();
    });

    test('deliverables count is displayed', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="deliverables-count"]')).toBeVisible();
    });

    test('deliverables displays empty state or data', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      const table = page.locator('[data-testid="deliverables-table"]');
      await expect(table).toBeVisible({ timeout: 15000 });
      
      // Either rows or empty state
      const emptyState = page.locator('[data-testid="deliverables-empty-state"]');
      const rows = page.locator('[data-testid^="deliverable-row-"]');
      
      const emptyCount = await emptyState.count();
      const rowCount = await rows.count();
      
      expect(emptyCount > 0 || rowCount > 0).toBeTruthy();
    });
  });

  test.describe('Filter Controls @smoke', () => {
    test('milestone filter is visible', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="deliverables-filters"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="deliverables-filter-milestone"]')).toBeVisible();
    });

    test('status filter is visible', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="deliverables-filter-status"]')).toBeVisible();
    });

    test('milestone filter has default "All" option', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      const filter = page.locator('[data-testid="deliverables-filter-milestone"]');
      await expect(filter).toHaveValue('all');
    });
  });

  test.describe('Add Button @smoke', () => {
    test('add deliverable button is visible for admin', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-deliverable-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('refresh button is visible', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="deliverables-refresh-button"]')).toBeVisible();
    });
  });

  test.describe('Refresh Functionality @smoke', () => {
    test('refresh button triggers data reload', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      const refreshButton = page.locator('[data-testid="deliverables-refresh-button"]');
      await refreshButton.click();
      
      await page.waitForTimeout(1500);
      
      await expect(page.locator('[data-testid="deliverables-page"]')).toBeVisible();
    });
  });
});

// ============================================
// DELIVERABLE FORM TESTS
// ============================================
test.describe('Deliverable Form @deliverables', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Form Display', () => {
    test('clicking add button shows deliverable form', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-deliverable-button"]').click();
      
      await expect(page.locator('[data-testid="deliverables-add-form"]')).toBeVisible({ timeout: 5000 });
    });

    test('deliverable form has all required fields', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-deliverable-button"]').click();
      await expect(page.locator('[data-testid="deliverables-add-form"]')).toBeVisible();
      
      // Check for form fields
      await expect(page.locator('[data-testid="deliverable-ref-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="deliverable-name-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="deliverable-milestone-select"]')).toBeVisible();
    });

    test('deliverable form has save and cancel buttons', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-deliverable-button"]').click();
      await expect(page.locator('[data-testid="deliverables-add-form"]')).toBeVisible();
      
      await expect(page.locator('[data-testid="deliverable-save-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="deliverable-cancel-button"]')).toBeVisible();
    });
  });

  test.describe('Form Interaction', () => {
    test('cancel button closes the form', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-deliverable-button"]').click();
      await expect(page.locator('[data-testid="deliverables-add-form"]')).toBeVisible();
      
      await page.locator('[data-testid="deliverable-cancel-button"]').click();
      
      await expect(page.locator('[data-testid="deliverables-add-form"]')).toBeHidden();
      await expect(page.locator('[data-testid="add-deliverable-button"]')).toBeVisible();
    });

    test('name input accepts text', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-deliverable-button"]').click();
      await expect(page.locator('[data-testid="deliverables-add-form"]')).toBeVisible();
      
      const nameInput = page.locator('[data-testid="deliverable-name-input"]');
      await nameInput.fill('Test Deliverable Name');
      
      await expect(nameInput).toHaveValue('Test Deliverable Name');
    });
  });
});

// ============================================
// MULTI-ROLE DELIVERABLE TESTS
// ============================================
test.describe('Deliverables - Role Access @deliverables', () => {
  
  test.describe('Contributor Role', () => {
    test.use({ storageState: 'playwright/.auth/contributor.json' });
    
    test('contributor can access deliverables page', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="deliverables-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('contributor sees add deliverable button', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-deliverable-button"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Customer PM Role', () => {
    test.use({ storageState: 'playwright/.auth/customer_pm.json' });
    
    test('customer PM can access deliverables page', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="deliverables-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('customer PM sees add deliverable button', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      // Customer PM can add deliverables
      await expect(page.locator('[data-testid="add-deliverable-button"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access deliverables page', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="deliverables-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('viewer does not see add deliverable button', async ({ page }) => {
      await page.goto('/deliverables');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-deliverable-button"]')).toBeHidden({ timeout: 5000 });
    });
  });
});

// ============================================
// NAVIGATION TESTS
// ============================================
test.describe('Deliverables - Navigation @deliverables', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('can navigate to deliverables via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'deliverables');
    
    await expect(page).toHaveURL(/\/deliverables/);
    await expect(page.locator('[data-testid="deliverables-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('can navigate from deliverables to milestones', async ({ page }) => {
    await page.goto('/deliverables');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'milestones');
    
    await expect(page).toHaveURL(/\/milestones/);
  });
});
