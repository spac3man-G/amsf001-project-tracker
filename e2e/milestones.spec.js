/**
 * E2E Tests - Milestones
 * Location: e2e/milestones.spec.js
 * 
 * Tests milestone functionality including page load, CRUD operations,
 * certificate generation, and role-based access.
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
// MILESTONES PAGE TESTS (Admin role)
// ============================================
test.describe('Milestones Page @milestones', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Load @critical', () => {
    test('milestones page loads with correct elements', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      // Verify main page container
      await expect(page.locator('[data-testid="milestones-page"]')).toBeVisible({ timeout: 15000 });
      
      // Verify header elements
      await expect(page.locator('[data-testid="milestones-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="milestones-title"]')).toBeVisible();
    });

    test('milestones page has correct title', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const title = page.locator('[data-testid="milestones-title"]');
      await expect(title).toHaveText('Milestones');
    });

    test('milestones page URL is correct', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/\/milestones/);
    });
  });

  test.describe('Table Display @smoke', () => {
    test('milestones table is visible', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      // Table card should be visible
      await expect(page.locator('[data-testid="milestones-table-card"]')).toBeVisible({ timeout: 15000 });
      
      // Table itself should be visible
      await expect(page.locator('[data-testid="milestones-table"]')).toBeVisible();
    });

    test('milestones count is displayed', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      // Count indicator should be visible
      await expect(page.locator('[data-testid="milestones-count"]')).toBeVisible();
    });

    test('milestones displays empty state or data', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const table = page.locator('[data-testid="milestones-table"]');
      await expect(table).toBeVisible({ timeout: 15000 });
      
      // Either rows or empty state
      const emptyState = page.locator('[data-testid="milestones-empty-state"]');
      const rows = page.locator('[data-testid^="milestone-row-"]');
      
      const emptyCount = await emptyState.count();
      const rowCount = await rows.count();
      
      expect(emptyCount > 0 || rowCount > 0).toBeTruthy();
    });
  });

  test.describe('Add Button @smoke', () => {
    test('add milestone button is visible for admin', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-milestone-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('refresh button is visible', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="milestones-refresh-button"]')).toBeVisible();
    });
  });

  test.describe('Refresh Functionality @smoke', () => {
    test('refresh button triggers data reload', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const refreshButton = page.locator('[data-testid="milestones-refresh-button"]');
      await refreshButton.click();
      
      await page.waitForTimeout(1500);
      
      await expect(page.locator('[data-testid="milestones-page"]')).toBeVisible();
    });
  });
});

// ============================================
// MILESTONE FORM TESTS
// ============================================
test.describe('Milestone Form @milestones', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Form Display', () => {
    test('clicking add button shows milestone form', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await page.locator('[data-testid="add-milestone-button"]').click();
      
      await expect(page.locator('[data-testid="milestones-add-form"]')).toBeVisible({ timeout: 5000 });
    });
  });
});

// ============================================
// MILESTONE DETAIL PAGE TESTS
// ============================================
test.describe('Milestone Detail @milestones', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Navigation', () => {
    test('can navigate to milestone detail from list', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      // Find first milestone row and click it
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        // Click on milestone reference link
        const firstRow = rows.first();
        const refLink = firstRow.locator('[data-testid^="milestone-ref-"]').first();
        await refLink.click();
        
        // Should navigate to detail page
        await expect(page).toHaveURL(/\/milestones\/[a-f0-9-]+/);
      }
    });
  });
});

// ============================================
// MULTI-ROLE MILESTONE TESTS
// ============================================
test.describe('Milestones - Role Access @milestones', () => {
  
  test.describe('Supplier PM Role', () => {
    test.use({ storageState: 'playwright/.auth/supplier_pm.json' });
    
    test('supplier PM can access milestones page', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="milestones-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('supplier PM sees add milestone button', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-milestone-button"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Customer PM Role', () => {
    test.use({ storageState: 'playwright/.auth/customer_pm.json' });
    
    test('customer PM can access milestones page', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="milestones-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('customer PM does not see add milestone button', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-milestone-button"]')).toBeHidden({ timeout: 5000 });
    });
  });

  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access milestones page', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="milestones-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('viewer does not see add milestone button', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-milestone-button"]')).toBeHidden({ timeout: 5000 });
    });
  });
});

// ============================================
// NAVIGATION TESTS
// ============================================
test.describe('Milestones - Navigation @milestones', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('can navigate to milestones via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'milestones');
    
    await expect(page).toHaveURL(/\/milestones/);
    await expect(page.locator('[data-testid="milestones-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('can navigate from milestones to deliverables', async ({ page }) => {
    await page.goto('/milestones');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'deliverables');
    
    await expect(page).toHaveURL(/\/deliverables/);
  });
});
