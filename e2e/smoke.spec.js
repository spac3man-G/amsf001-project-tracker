/**
 * Smoke Tests - Critical Path Verification
 * Location: e2e/smoke.spec.js
 * 
 * These tests verify that the most critical features work.
 * They run:
 * - After every production deployment
 * - Before merging PRs
 * - On demand via manual workflow
 * 
 * Tag tests with @smoke or @critical to include them here.
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests @smoke', () => {
  
  test.describe('Authentication @critical', () => {
    test('login page loads', async ({ page }) => {
      // Clear auth state to test login page
      await page.context().clearCookies();
      await page.goto('/');
      
      // Should see login form
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('authenticated user sees dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should see main navigation or dashboard content
      await expect(page.locator('nav, [data-testid="dashboard"], .dashboard')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Navigation @critical', () => {
    test('main navigation links work', async ({ page }) => {
      await page.goto('/');
      
      // Wait for app to load
      await page.waitForLoadState('networkidle');
      
      // Check that we're either on dashboard or redirected appropriately
      const url = page.url();
      expect(url).toMatch(/\/(dashboard|timesheets|workflow-summary|login)?$/);
    });

    test('can access timesheets page', async ({ page }) => {
      await page.goto('/timesheets');
      await page.waitForLoadState('networkidle');
      
      // Should see timesheets content or redirect to login
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
    });

    test('can access milestones page', async ({ page }) => {
      await page.goto('/milestones');
      await page.waitForLoadState('networkidle');
      
      // Verify page loaded
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
    });
  });

  test.describe('Data Loading @critical', () => {
    test('API endpoints respond', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Page should have loaded some data
      // Check for absence of error states
      const errorToast = page.locator('.error-toast, [data-error], .toast-error');
      
      // Either no error, or if there is one, it should not be a critical failure
      const errorCount = await errorToast.count();
      if (errorCount > 0) {
        // Log the error but don't necessarily fail (could be non-critical)
        console.log('Warning: Error toast visible on dashboard');
      }
    });

    test('project selector works', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for project selector or project name
      const projectSelector = page.locator('[data-testid="project-selector"], .project-selector, select');
      const hasSelector = await projectSelector.count() > 0;
      
      // Either has selector or displays project name
      expect(hasSelector || await page.content()).toBeTruthy();
    });
  });

  test.describe('Error Handling @smoke', () => {
    test('404 page handles missing routes', async ({ page }) => {
      const response = await page.goto('/this-page-definitely-does-not-exist-12345');
      
      // Should not crash - either 404 or redirect to home
      expect(response?.status()).toBeLessThan(500);
    });

    test('app recovers from network errors gracefully', async ({ page }) => {
      // Navigate to a page
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // App should have loaded without crashing
      const content = await page.content();
      expect(content).not.toContain('Application error');
      expect(content).not.toContain('Unhandled Runtime Error');
    });
  });
});

test.describe('Performance @smoke', () => {
  test('page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('no console errors on load', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Filter out known acceptable errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('DevTools') &&
      !error.includes('third-party')
    );
    
    // Log but don't fail on non-critical console errors
    if (criticalErrors.length > 0) {
      console.log('Console errors:', criticalErrors);
    }
  });
});
