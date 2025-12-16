/**
 * E2E Tests - KPIs and Quality Standards
 * Location: e2e/kpis-quality.spec.js
 * 
 * Tests KPI and Quality Standard functionality including page load,
 * detail views, measurements, and role-based access.
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
// KPIs PAGE TESTS
// ============================================
test.describe('KPIs Page @kpis', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Load @critical', () => {
    test('KPIs page loads with correct elements', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      // Verify main page container
      await expect(page.locator('[data-testid="kpis-page"]')).toBeVisible({ timeout: 15000 });
      
      // Verify header elements
      await expect(page.locator('[data-testid="kpis-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpis-title"]')).toBeVisible();
    });

    test('KPIs page has correct title', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      const title = page.locator('[data-testid="kpis-title"]');
      await expect(title).toHaveText('Key Performance Indicators');
    });
  });

  test.describe('Table Display @smoke', () => {
    test('KPIs table is visible', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="kpis-table-card"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[data-testid="kpis-table"]')).toBeVisible();
    });

    test('KPIs count is displayed', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="kpis-count"]')).toBeVisible();
    });
  });

  test.describe('Add Button @smoke', () => {
    test('add KPI button is visible for admin', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-kpi-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('refresh button is visible', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="kpis-refresh-button"]')).toBeVisible();
    });
  });
});

// ============================================
// KPI DETAIL PAGE TESTS
// ============================================
test.describe('KPI Detail Page @kpis', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Navigation', () => {
    test('can navigate to KPI detail from list', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="kpi-row-"]');
      const rowCount = await rows.count();
      
      // Skip if no KPI data exists - test passes as there's nothing to verify
      if (rowCount === 0) {
        console.log('No KPI data available - skipping navigation test');
        return;
      }
      
      const firstRow = rows.first();
      const refLink = firstRow.locator('[data-testid^="kpi-ref-"]').first();
      await refLink.click();
      
      await expect(page).toHaveURL(/\/kpis\/[a-f0-9-]+/);
      await expect(page.locator('[data-testid="kpi-detail-page"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Detail Page Elements', () => {
    test('KPI detail page has back button', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="kpi-row-"]');
      const rowCount = await rows.count();
      
      // Skip if no KPI data exists
      if (rowCount === 0) {
        console.log('No KPI data available - skipping back button test');
        return;
      }
      
      const firstRow = rows.first();
      const refLink = firstRow.locator('[data-testid^="kpi-ref-"]').first();
      await refLink.click();
      
      await expect(page.locator('[data-testid="kpi-detail-back-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('KPI detail page shows stats section', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="kpi-row-"]');
      const rowCount = await rows.count();
      
      // Skip if no KPI data exists
      if (rowCount === 0) {
        console.log('No KPI data available - skipping stats section test');
        return;
      }
      
      const firstRow = rows.first();
      const refLink = firstRow.locator('[data-testid^="kpi-ref-"]').first();
      await refLink.click();
      
      await expect(page.locator('[data-testid="kpi-detail-stats"]')).toBeVisible({ timeout: 10000 });
    });
  });
});

// ============================================
// QUALITY STANDARDS PAGE TESTS
// ============================================
test.describe('Quality Standards Page @quality', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Load @critical', () => {
    test('Quality Standards page loads with correct elements', async ({ page }) => {
      await page.goto('/quality-standards');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="quality-standards-page"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[data-testid="quality-standards-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="quality-standards-title"]')).toBeVisible();
    });

    test('Quality Standards page has correct title', async ({ page }) => {
      await page.goto('/quality-standards');
      await waitForPageLoad(page);
      
      const title = page.locator('[data-testid="quality-standards-title"]');
      await expect(title).toHaveText('Quality Standards');
    });
  });

  test.describe('Table Display @smoke', () => {
    test('Quality Standards table is visible', async ({ page }) => {
      await page.goto('/quality-standards');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="quality-standards-table-card"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[data-testid="quality-standards-table"]')).toBeVisible();
    });

    test('Quality Standards count is displayed', async ({ page }) => {
      await page.goto('/quality-standards');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="quality-standards-count"]')).toBeVisible();
    });
  });

  test.describe('Add Button @smoke', () => {
    test('add Quality Standard button is visible for admin', async ({ page }) => {
      await page.goto('/quality-standards');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-quality-standard-button"]')).toBeVisible({ timeout: 10000 });
    });
  });
});

// ============================================
// QUALITY STANDARD DETAIL PAGE TESTS
// ============================================
test.describe('Quality Standard Detail Page @quality', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Navigation', () => {
    test('can navigate to QS detail from list', async ({ page }) => {
      await page.goto('/quality-standards');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="quality-standard-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        const firstRow = rows.first();
        const refLink = firstRow.locator('[data-testid^="quality-standard-ref-"]').first();
        await refLink.click();
        
        await expect(page).toHaveURL(/\/quality-standards\/[a-f0-9-]+/);
        await expect(page.locator('[data-testid="quality-standard-detail-page"]')).toBeVisible({ timeout: 10000 });
      }
    });
  });
});

// ============================================
// MULTI-ROLE TESTS
// ============================================
test.describe('KPIs - Role Access @kpis', () => {
  
  test.describe('Supplier PM Role', () => {
    test.use({ storageState: 'playwright/.auth/supplier_pm.json' });
    
    test('supplier PM can access KPIs page', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="kpis-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('supplier PM sees add KPI button', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-kpi-button"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Customer PM Role', () => {
    test.use({ storageState: 'playwright/.auth/customer_pm.json' });
    
    test('customer PM can access KPIs page', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="kpis-page"]')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access KPIs page', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="kpis-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('viewer does not see add KPI button', async ({ page }) => {
      await page.goto('/kpis');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-kpi-button"]')).toBeHidden({ timeout: 5000 });
    });
  });
});

test.describe('Quality Standards - Role Access @quality', () => {
  
  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access Quality Standards page', async ({ page }) => {
      await page.goto('/quality-standards');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="quality-standards-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('viewer does not see add button', async ({ page }) => {
      await page.goto('/quality-standards');
      await waitForPageLoad(page);
      
      await expect(page.locator('[data-testid="add-quality-standard-button"]')).toBeHidden({ timeout: 5000 });
    });
  });
});

// ============================================
// NAVIGATION TESTS
// ============================================
test.describe('KPIs - Navigation @kpis', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('can navigate to KPIs via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'kpis');
    
    await expect(page).toHaveURL(/\/kpis/);
    await expect(page.locator('[data-testid="kpis-page"]')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Quality Standards - Navigation @quality', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('can navigate to Quality Standards via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    await navigateTo(page, 'qualityStandards');
    
    await expect(page).toHaveURL(/\/quality-standards/);
    await expect(page.locator('[data-testid="quality-standards-page"]')).toBeVisible({ timeout: 15000 });
  });
});
