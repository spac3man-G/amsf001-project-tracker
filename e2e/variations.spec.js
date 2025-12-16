/**
 * E2E Tests - Variations
 * Location: e2e/variations.spec.js
 * 
 * Tests variation/change request functionality including page load,
 * creation workflow, signature collection, and role-based access.
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
// VARIATIONS PAGE TESTS (Admin role)
// ============================================
test.describe('Variations Page @variations', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Load @critical', () => {
    test('variations page loads with correct elements', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      // Verify main page container
      await expect(page.locator('[data-testid="variations-page"]')).toBeVisible({ timeout: 15000 });
      
      // Verify header elements
      await expect(page.locator('[data-testid="variations-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="variations-title"]')).toBeVisible();
    });

    test('variations page has correct title', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      const title = page.locator('[data-testid="variations-title"]');
      await expect(title).toHaveText('Variations');
    });

    test('variations page URL is correct', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/\/variations/);
    });
  });

  test.describe('Summary Section @smoke', () => {
    test('variations summary is visible', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-summary"]')).toBeVisible({ timeout: 15000 });
    });

    test('summary shows total count', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-summary-total"]')).toBeVisible();
    });

    test('summary shows pending count', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-summary-pending"]')).toBeVisible();
    });

    test('summary shows applied count', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-summary-applied"]')).toBeVisible();
    });

    test('summary shows budget impact', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-summary-impact"]')).toBeVisible();
    });
  });

  test.describe('Table Display @smoke', () => {
    test('variations table card is visible', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-table-card"]')).toBeVisible({ timeout: 15000 });
    });

    test('variations count is displayed', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-count"]')).toBeVisible();
    });

    test('variations displays empty state or data', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      // Either rows or empty state
      const emptyState = page.locator('[data-testid="variations-empty-state"]');
      const table = page.locator('[data-testid="variations-table"]');
      const rows = page.locator('[data-testid^="variation-row-"]');
      
      const emptyCount = await emptyState.count();
      const tableVisible = await table.count();
      const rowCount = await rows.count();
      
      expect(emptyCount > 0 || tableVisible > 0 || rowCount > 0).toBeTruthy();
    });
  });

  test.describe('Filter Controls @smoke', () => {
    test('variations filters are visible', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-filters"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Create Button @smoke', () => {
    test('create variation button is visible for admin', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="create-variation-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('refresh button is visible', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-refresh-button"]')).toBeVisible();
    });
  });

  test.describe('Refresh Functionality @smoke', () => {
    test('refresh button triggers data reload', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      const refreshButton = page.locator('[data-testid="variations-refresh-button"]');
      await refreshButton.click();
      
      await page.waitForTimeout(1500);
      
      await expect(page.locator('[data-testid="variations-page"]')).toBeVisible();
    });
  });
});

// ============================================
// VARIATION CREATION WORKFLOW
// ============================================
test.describe('Variation Creation @variations', () => {
  test.use({ storageState: 'playwright/.auth/supplier_pm.json' });

  test.describe('Create Flow', () => {
    test('clicking create button navigates to form', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="create-variation-button"]').click();
      
      // Should navigate to variation form page
      await expect(page).toHaveURL(/\/variations\/new/);
    });
  });
});

// ============================================
// VARIATION FORM PAGE TESTS
// ============================================
test.describe('Variation Form Page @variations', () => {
  test.use({ storageState: 'playwright/.auth/supplier_pm.json' });

  test.describe('Form Page Load', () => {
    test('variation form page loads', async ({ page }) => {
      await page.goto('/variations/new');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variation-form-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('variation form has back button', async ({ page }) => {
      await page.goto('/variations/new');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variation-form-back-button"]')).toBeVisible();
    });

    test('variation form has progress indicator', async ({ page }) => {
      await page.goto('/variations/new');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variation-form-progress"]')).toBeVisible();
    });

    test('variation form has next button', async ({ page }) => {
      await page.goto('/variations/new');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variation-form-next-button"]')).toBeVisible();
    });
  });

  test.describe('Form Navigation', () => {
    test('back button returns to variations list', async ({ page }) => {
      await page.goto('/variations/new');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="variation-form-back-button"]').click();
      
      await expect(page).toHaveURL(/\/variations$/);
    });
  });
});

// ============================================
// MULTI-ROLE VARIATION TESTS
// ============================================
test.describe('Variations - Role Access @variations', () => {
  
  test.describe('Supplier PM Role (can create)', () => {
    test.use({ storageState: 'playwright/.auth/supplier_pm.json' });
    
    test('supplier PM can access variations page', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('supplier PM sees create variation button', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="create-variation-button"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Customer PM Role (cannot create)', () => {
    test.use({ storageState: 'playwright/.auth/customer_pm.json' });
    
    test('customer PM can access variations page', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('customer PM does not see create variation button', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="create-variation-button"]')).toBeHidden({ timeout: 5000 });
    });
  });

  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access variations page', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="variations-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('viewer does not see create variation button', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="create-variation-button"]')).toBeHidden({ timeout: 5000 });
    });
  });
});

// ============================================
// NAVIGATION TESTS
// ============================================
test.describe('Variations - Navigation @variations', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('can navigate to variations via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'variations');
    
    await expect(page).toHaveURL(/\/variations/);
    await expect(page.locator('[data-testid="variations-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('can navigate from variations to milestones', async ({ page }) => {
    await page.goto('/variations');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'milestones');
    
    await expect(page).toHaveURL(/\/milestones/);
  });
});
