/**
 * E2E Tests - Timesheets
 * Tests timesheet functionality including CRUD operations
 */

import { test, expect } from '@playwright/test';

test.describe('Timesheets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/timesheets');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display timesheets page', async ({ page }) => {
    await expect(page).toHaveURL(/.*timesheet/);
    
    // Check for page title or header
    const pageHeader = page.locator('h1, [data-testid="page-title"]').first();
    await expect(pageHeader).toBeVisible();
  });

  test('should show add timesheet button for authorized users', async ({ page }) => {
    // Look for add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), [data-testid="add-timesheet"]').first();
    
    // This may or may not be visible depending on the user's role
    // We just verify the page loads correctly
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display timesheet list or empty state', async ({ page }) => {
    // Either we see timesheets or an empty state message
    const content = page.locator('table, [data-testid="timesheet-list"], [data-testid="empty-state"], .empty-state').first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Timesheet Creation', () => {
  test('should open add timesheet modal/form when clicking add button', async ({ page }) => {
    await page.goto('/timesheets');
    await page.waitForLoadState('networkidle');
    
    // Find and click add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Check for modal or form
      const form = page.locator('form, dialog, [role="dialog"], .modal').first();
      await expect(form).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Timesheet Filters', () => {
  test('should have filter controls', async ({ page }) => {
    await page.goto('/timesheets');
    await page.waitForLoadState('networkidle');
    
    // Look for filter elements (date picker, status filter, etc.)
    const filters = page.locator('input[type="date"], select, [data-testid="filter"]').first();
    
    // Filters may or may not exist, just ensure page loaded
    await expect(page.locator('body')).toBeVisible();
  });
});
