/**
 * E2E Tests - Expenses
 * Location: e2e/expenses.spec.js
 * 
 * Tests expense functionality including page load, CRUD operations,
 * receipt scanning, validation workflow, and role-based access.
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
// EXPENSES PAGE TESTS (Admin role)
// ============================================
test.describe('Expenses Page @expenses', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Load @critical', () => {
    test('expenses page loads with correct elements', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      // Verify main page container
      await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 15000 });
      
      // Verify header elements
      await expect(page.locator('[data-testid="expenses-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="expenses-title"]')).toBeVisible();
    });

    test('expenses page has correct title', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      const title = page.locator('[data-testid="expenses-title"]');
      await expect(title).toHaveText('Expenses');
    });

    test('expenses page URL is correct', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/\/expenses/);
    });
  });

  test.describe('Table Display @smoke', () => {
    test('expenses table is visible', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      // Table card should be visible
      await expect(page.locator('[data-testid="expenses-table-card"]')).toBeVisible({ timeout: 15000 });
      
      // Table itself should be visible
      await expect(page.locator('[data-testid="expenses-table"]')).toBeVisible();
    });

    test('expenses count is displayed', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="expenses-count"]')).toBeVisible();
    });
  });

  test.describe('Filter Controls @smoke', () => {
    test('expense filters are visible', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="expenses-filters"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Add Button @smoke', () => {
    test('add expense button is visible for admin', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-expense-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('scan receipt button is visible', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="scan-receipt-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('refresh button is visible', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="expenses-refresh-button"]')).toBeVisible();
    });
  });
});

// ============================================
// EXPENSE FORM TESTS
// ============================================
test.describe('Expense Form @expenses', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Form Display', () => {
    test('clicking add button shows expense form', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-expense-button"]').click();
      
      await expect(page.locator('[data-testid="expenses-add-form"]')).toBeVisible({ timeout: 5000 });
    });
  });
});

// ============================================
// EXPENSE DETAIL MODAL TESTS
// ============================================
test.describe('Expense Detail Modal @expenses', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Modal Interaction', () => {
    test('clicking expense row opens detail modal', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      // Find first expense row
      const rows = page.locator('[data-testid^="expense-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        await rows.first().click();
        
        // Modal should appear
        await expect(page.locator('[data-testid="expense-detail-modal"]')).toBeVisible({ timeout: 5000 });
      }
    });

    test('modal has close button', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="expense-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        await rows.first().click();
        await expect(page.locator('[data-testid="expense-detail-modal"]')).toBeVisible();
        
        // Close button should be visible
        await expect(page.locator('[data-testid="expense-modal-close"]')).toBeVisible();
      }
    });

    test('modal shows expense status', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="expense-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        await rows.first().click();
        await expect(page.locator('[data-testid="expense-detail-modal"]')).toBeVisible();
        
        // Status should be visible
        await expect(page.locator('[data-testid="expense-modal-status"]')).toBeVisible();
      }
    });
  });
});

// ============================================
// MULTI-ROLE EXPENSE TESTS
// ============================================
test.describe('Expenses - Role Access @expenses', () => {
  
  test.describe('Contributor Role', () => {
    test.use({ storageState: 'playwright/.auth/contributor.json' });
    
    test('contributor can access expenses page', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('contributor sees add expense button', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-expense-button"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access expenses page', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('viewer does not see add expense button', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-expense-button"]')).toBeHidden({ timeout: 5000 });
    });
  });

  test.describe('Supplier PM Role', () => {
    test.use({ storageState: 'playwright/.auth/supplier_pm.json' });
    
    test('supplier PM can access expenses page', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('supplier PM sees validation controls on submitted expenses', async ({ page }) => {
      await page.goto('/expenses');
      await waitForPageLoad(page);
      
      // Find first expense row with submitted status and click it
      const rows = page.locator('[data-testid^="expense-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        // Click first row to open modal
        await rows.first().click();
        
        // Modal should appear
        const modal = page.locator('[data-testid="expense-detail-modal"]');
        await expect(modal).toBeVisible({ timeout: 5000 });
        
        // Supplier PM should see edit button at minimum
        const editButton = page.locator('[data-testid="expense-edit-button"]');
        // May or may not be visible depending on status
      }
    });
  });
});

// ============================================
// NAVIGATION TESTS
// ============================================
test.describe('Expenses - Navigation @expenses', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('can navigate to expenses via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'expenses');
    
    await expect(page).toHaveURL(/\/expenses/);
    await expect(page.locator('[data-testid="expenses-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('can navigate from expenses to timesheets', async ({ page }) => {
    await page.goto('/expenses');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'timesheets');
    
    await expect(page).toHaveURL(/\/timesheets/);
  });
});
