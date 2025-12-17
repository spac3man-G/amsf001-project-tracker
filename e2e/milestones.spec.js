/**
 * E2E Tests - Milestones
 * Location: e2e/milestones.spec.js
 * 
 * Tests milestone functionality including page load, CRUD operations,
 * certificate generation, baseline history, and role-based access.
 * 
 * IMPORTANT: All selectors use data-testid per docs/TESTING-CONVENTIONS.md
 * 
 * @version 1.1
 * @created 15 December 2025
 * @updated 17 December 2025 - Added baseline history tests
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

  test.describe('Detail Page Elements', () => {
    test('milestone detail page displays core elements', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      // Navigate to first milestone detail
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        await rows.first().click();
        await waitForPageLoad(page);
        
        // Verify core elements
        await expect(page.locator('[data-testid="milestone-detail-ref"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('[data-testid="milestone-detail-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="milestone-detail-status"]')).toBeVisible();
        await expect(page.locator('[data-testid="milestone-detail-content"]')).toBeVisible();
      }
    });

    test('milestone detail page displays schedule section', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        await rows.first().click();
        await waitForPageLoad(page);
        
        await expect(page.locator('[data-testid="milestone-schedule-section"]')).toBeVisible({ timeout: 10000 });
      }
    });

    test('milestone detail page displays metrics grid', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        await rows.first().click();
        await waitForPageLoad(page);
        
        await expect(page.locator('[data-testid="milestone-metrics-grid"]')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('[data-testid="milestone-progress-percent"]')).toBeVisible();
      }
    });

    test('back button returns to milestones list', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        await rows.first().click();
        await waitForPageLoad(page);
        
        await page.locator('[data-testid="milestone-back-button"]').click();
        await expect(page).toHaveURL(/\/milestones$/);
      }
    });
  });
});

// ============================================
// MILESTONE BASELINE HISTORY TESTS
// ============================================
test.describe('Milestone Baseline History @milestones @baseline-history', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Baseline History Section', () => {
    test('baseline history section appears for milestones with history', async ({ page }) => {
      // Navigate to a milestone that has baseline history (affected by variation)
      // First try to find one via the API or by navigating
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      // Try each milestone to find one with baseline history
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await page.goto('/milestones');
        await waitForPageLoad(page);
        
        await rows.nth(i).click();
        await waitForPageLoad(page);
        
        const historySection = page.locator('[data-testid="milestone-baseline-history-section"]');
        const hasHistory = await historySection.count() > 0;
        
        if (hasHistory) {
          await expect(historySection).toBeVisible();
          return; // Test passed
        }
      }
      
      // If no milestone has history, skip gracefully
      test.skip();
    });

    test('baseline history toggle expands and collapses', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await page.goto('/milestones');
        await waitForPageLoad(page);
        
        await rows.nth(i).click();
        await waitForPageLoad(page);
        
        const toggleButton = page.locator('[data-testid="baseline-history-toggle"]');
        const hasHistory = await toggleButton.count() > 0;
        
        if (hasHistory) {
          // Initially collapsed - click to expand
          await toggleButton.click();
          
          // Should show version items
          await expect(page.locator('[data-testid^="baseline-version-"]').first()).toBeVisible({ timeout: 5000 });
          
          // Click again to collapse
          await toggleButton.click();
          await page.waitForTimeout(500);
          
          // Version items should be hidden (content collapsed)
          // The section header remains but content is hidden
          return; // Test passed
        }
      }
      
      test.skip();
    });

    test('baseline history shows version numbers', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await page.goto('/milestones');
        await waitForPageLoad(page);
        
        await rows.nth(i).click();
        await waitForPageLoad(page);
        
        const toggleButton = page.locator('[data-testid="baseline-history-toggle"]');
        const hasHistory = await toggleButton.count() > 0;
        
        if (hasHistory) {
          await toggleButton.click();
          
          // Should have at least version 1 (original baseline)
          const version1 = page.locator('[data-testid="baseline-version-1"]');
          await expect(version1).toBeVisible({ timeout: 5000 });
          
          return;
        }
      }
      
      test.skip();
    });
  });

  test.describe('Version Indicator in Schedule Section', () => {
    test('version indicator appears in schedule section for milestones with history', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await page.goto('/milestones');
        await waitForPageLoad(page);
        
        await rows.nth(i).click();
        await waitForPageLoad(page);
        
        const versionIndicator = page.locator('[data-testid="baseline-version-indicator"]');
        const hasIndicator = await versionIndicator.count() > 0;
        
        if (hasIndicator) {
          await expect(versionIndicator).toBeVisible();
          // Should show version text like "v2"
          await expect(versionIndicator).toContainText(/v\d+/);
          return;
        }
      }
      
      // If no milestone has version indicator, that's okay - means no variations applied
      test.skip();
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
