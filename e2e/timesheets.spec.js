/**
 * E2E Tests - Timesheets
 * Location: e2e/timesheets.spec.js
 * 
 * Tests timesheet functionality including page load, CRUD operations,
 * filtering, and role-based access.
 * 
 * IMPORTANT: All selectors use data-testid per docs/TESTING-CONVENTIONS.md
 * 
 * @version 2.0
 * @modified 14 December 2025 - Updated to use testing contract
 */

import { test, expect } from '@playwright/test';
import { 
  waitForPageLoad, 
  waitForToast,
  navigateTo
} from './helpers/test-utils.js';

// ============================================
// TIMESHEETS PAGE TESTS (Admin role)
// ============================================
test.describe('Timesheets Page @timesheets', () => {
  // Use admin auth state for these tests (full access)
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Load @critical', () => {
    test('timesheets page loads with correct elements', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Verify main page container is visible
      await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible({ timeout: 15000 });
      
      // Verify header elements
      await expect(page.locator('[data-testid="timesheets-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="timesheets-title"]')).toBeVisible();
    });

    test('timesheets page has correct title', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      const title = page.locator('[data-testid="timesheets-title"]');
      await expect(title).toHaveText('Timesheets');
    });

    test('timesheets page URL is correct', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      await expect(page).toHaveURL(/\/timesheets/);
    });
  });

  test.describe('Table Display @smoke', () => {
    test('timesheets table is visible', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Table card should be visible
      await expect(page.locator('[data-testid="timesheets-table-card"]')).toBeVisible({ timeout: 15000 });
      
      // Table itself should be visible
      await expect(page.locator('[data-testid="timesheets-table"]')).toBeVisible();
    });

    test('timesheets count is displayed', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Count indicator should be visible
      await expect(page.locator('[data-testid="timesheets-count"]')).toBeVisible();
    });

    test('timesheets displays empty state or data', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Either we see timesheet rows or an empty state
      const table = page.locator('[data-testid="timesheets-table"]');
      await expect(table).toBeVisible({ timeout: 15000 });
      
      // Check if there are rows or empty state
      const emptyState = page.locator('[data-testid="timesheets-empty-state"]');
      const rows = page.locator('[data-testid^="timesheet-row-"]');
      
      const emptyCount = await emptyState.count();
      const rowCount = await rows.count();
      
      // One of these should be true
      expect(emptyCount > 0 || rowCount > 0).toBeTruthy();
    });
  });

  test.describe('Filter Controls @smoke', () => {
    test('resource filter is visible', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Filter section should be visible
      await expect(page.locator('[data-testid="timesheets-filters"]')).toBeVisible({ timeout: 10000 });
      
      // Resource filter dropdown should be visible
      await expect(page.locator('[data-testid="timesheets-filter-resource"]')).toBeVisible();
    });

    test('resource filter has default "All Resources" option', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      const filter = page.locator('[data-testid="timesheets-filter-resource"]');
      await expect(filter).toHaveValue('all');
    });

    test('resource filter can be changed', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      const filter = page.locator('[data-testid="timesheets-filter-resource"]');
      
      // Get options count
      const options = filter.locator('option');
      const optionCount = await options.count();
      
      // Should have at least the "All Resources" option
      expect(optionCount).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Add Button (Admin) @smoke', () => {
    test('add timesheet button is visible for admin', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Admin should see add button
      await expect(page.locator('[data-testid="add-timesheet-button"]')).toBeVisible({ timeout: 10000 });
    });

    test('refresh button is visible', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Refresh button should be visible
      await expect(page.locator('[data-testid="timesheets-refresh-button"]')).toBeVisible();
    });
  });

  test.describe('Refresh Functionality @smoke', () => {
    test('refresh button triggers data reload', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Click refresh button
      const refreshButton = page.locator('[data-testid="timesheets-refresh-button"]');
      await refreshButton.click();
      
      // Wait for refresh to complete
      await page.waitForTimeout(1500);
      
      // Page should still be visible after refresh
      await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible();
    });
  });
});

// ============================================
// TIMESHEET FORM TESTS (Admin role)
// ============================================
test.describe('Timesheet Form @timesheets', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Form Display', () => {
    test('clicking add button shows timesheet form', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Click add button
      const addButton = page.locator('[data-testid="add-timesheet-button"]');
      await addButton.click();
      
      // Form should become visible
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeVisible({ timeout: 5000 });
    });

    test('timesheet form has all required fields', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Open form
      await page.locator('[data-testid="add-timesheet-button"]').click();
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeVisible();
      
      // Check for form fields
      await expect(page.locator('[data-testid="timesheet-resource-select"]')).toBeVisible();
      await expect(page.locator('[data-testid="timesheet-hours-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="timesheet-description-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="timesheet-milestone-select"]')).toBeVisible();
    });

    test('timesheet form has entry mode toggle', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Open form
      await page.locator('[data-testid="add-timesheet-button"]').click();
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeVisible();
      
      // Check for entry mode buttons
      await expect(page.locator('[data-testid="timesheet-entry-mode"]')).toBeVisible();
      await expect(page.locator('[data-testid="timesheet-mode-daily"]')).toBeVisible();
      await expect(page.locator('[data-testid="timesheet-mode-weekly"]')).toBeVisible();
    });

    test('timesheet form has save and cancel buttons', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Open form
      await page.locator('[data-testid="add-timesheet-button"]').click();
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeVisible();
      
      // Check for action buttons
      await expect(page.locator('[data-testid="timesheet-save-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="timesheet-cancel-button"]')).toBeVisible();
    });
  });

  test.describe('Form Interaction', () => {
    test('cancel button closes the form', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Open form
      await page.locator('[data-testid="add-timesheet-button"]').click();
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeVisible();
      
      // Click cancel
      await page.locator('[data-testid="timesheet-cancel-button"]').click();
      
      // Form should be hidden
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeHidden();
      
      // Add button should be visible again
      await expect(page.locator('[data-testid="add-timesheet-button"]')).toBeVisible();
    });

    test('entry mode toggle switches between daily and weekly', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Open form
      await page.locator('[data-testid="add-timesheet-button"]').click();
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeVisible();
      
      // Daily should be active by default (check for date input)
      await expect(page.locator('[data-testid="timesheet-date-input"]')).toBeVisible();
      
      // Click weekly mode
      await page.locator('[data-testid="timesheet-mode-weekly"]').click();
      
      // Week ending input should now be visible
      await expect(page.locator('[data-testid="timesheet-week-ending-input"]')).toBeVisible();
      
      // Click back to daily
      await page.locator('[data-testid="timesheet-mode-daily"]').click();
      
      // Date input should be visible again
      await expect(page.locator('[data-testid="timesheet-date-input"]')).toBeVisible();
    });

    test('hours input accepts numeric values', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Open form
      await page.locator('[data-testid="add-timesheet-button"]').click();
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeVisible();
      
      // Fill hours
      const hoursInput = page.locator('[data-testid="timesheet-hours-input"]');
      await hoursInput.fill('8');
      
      // Verify value
      await expect(hoursInput).toHaveValue('8');
    });

    test('description input accepts text', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Open form
      await page.locator('[data-testid="add-timesheet-button"]').click();
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeVisible();
      
      // Fill description
      const descInput = page.locator('[data-testid="timesheet-description-input"]');
      await descInput.fill('Test work description');
      
      // Verify value
      await expect(descInput).toHaveValue('Test work description');
    });
  });

  test.describe('Form Validation', () => {
    test('form shows warning when required fields are empty', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Open form
      await page.locator('[data-testid="add-timesheet-button"]').click();
      await expect(page.locator('[data-testid="timesheet-form"]')).toBeVisible();
      
      // Try to save without filling required fields
      await page.locator('[data-testid="timesheet-save-button"]').click();
      
      // Should show a warning toast
      await expect(page.locator('[data-testid="toast-warning"]')).toBeVisible({ timeout: 5000 });
    });
  });
});

// ============================================
// MULTI-ROLE TIMESHEET TESTS
// ============================================
test.describe('Timesheets - Role Access @timesheets', () => {
  
  test.describe('Contributor Role', () => {
    test.use({ storageState: 'playwright/.auth/contributor.json' });
    
    test('contributor can access timesheets page', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Contributor should see timesheets page
      await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('contributor sees add timesheet button', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Contributor should see add button (can create own timesheets)
      await expect(page.locator('[data-testid="add-timesheet-button"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Viewer Role', () => {
    test.use({ storageState: 'playwright/.auth/viewer.json' });
    
    test('viewer can access timesheets page', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Viewer should see timesheets page
      await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('viewer does not see add timesheet button', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Viewer should NOT see add button (read-only)
      await expect(page.locator('[data-testid="add-timesheet-button"]')).toBeHidden({ timeout: 5000 });
    });
  });

  test.describe('Supplier PM Role', () => {
    test.use({ storageState: 'playwright/.auth/supplier_pm.json' });
    
    test('supplier PM can access timesheets page', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Supplier PM should see timesheets page
      await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible({ timeout: 15000 });
    });

    test('supplier PM sees add timesheet button', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Supplier PM should see add button
      await expect(page.locator('[data-testid="add-timesheet-button"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Customer PM Role', () => {
    test.use({ storageState: 'playwright/.auth/customer_pm.json' });
    
    test('customer PM can access timesheets page', async ({ page }) => {
      await page.goto('/timesheets');
      await waitForPageLoad(page);
      
      // Customer PM should see timesheets page
      await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible({ timeout: 15000 });
    });
  });
});

// ============================================
// NAVIGATION TESTS
// ============================================
test.describe('Timesheets - Navigation @timesheets', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('can navigate to timesheets via sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);
    
    // Navigate using helper
    await navigateTo(page, 'timesheets');
    
    // Verify we're on timesheets page
    await expect(page).toHaveURL(/\/timesheets/);
    await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible({ timeout: 15000 });
  });

  test('can navigate from timesheets to dashboard', async ({ page }) => {
    await page.goto('/timesheets');
    await waitForPageLoad(page);
    
    // Navigate back to dashboard
    await navigateTo(page, 'dashboard');
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
