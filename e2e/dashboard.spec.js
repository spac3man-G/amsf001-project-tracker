/**
 * E2E Tests - Dashboard
 * Tests the main dashboard functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display the dashboard after login', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that dashboard loaded
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Check for main dashboard elements
    await expect(page.locator('h1, [data-testid="page-title"]').first()).toBeVisible();
  });

  test('should show project selector', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for project selector/dropdown
    const projectSelector = page.locator('[data-testid="project-selector"], select, .project-selector').first();
    await expect(projectSelector).toBeVisible({ timeout: 10000 });
  });

  test('should navigate using sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for sidebar to load
    await page.waitForSelector('nav, aside, [data-testid="sidebar"]', { timeout: 10000 });
    
    // Click on a sidebar link (e.g., Timesheets)
    const timesheetsLink = page.locator('a[href*="timesheet"], button:has-text("Timesheet")').first();
    if (await timesheetsLink.isVisible()) {
      await timesheetsLink.click();
      await expect(page).toHaveURL(/.*timesheet/);
    }
  });
});
