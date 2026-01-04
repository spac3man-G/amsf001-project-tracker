/**
 * Evaluator Admin Workflow E2E Tests
 * Location: e2e/evaluator/evaluator-admin.spec.js
 * 
 * Tests the full admin workflow for the Evaluator tool:
 * - Navigation and access
 * - Requirements management
 * - Vendor management
 * - Workshop management
 * - Settings configuration
 * 
 * @version 1.0
 * @created 04 January 2026
 * @phase Phase 10 - Testing & Polish (Task 10A.2)
 */

import { test, expect } from '@playwright/test';
import {
  navigateToEvaluator,
  waitForEvaluatorLoad,
  navigateToEvaluatorPage,
  createRequirement,
  createVendor,
  setupConsoleErrorTracking,
  expectToast,
  getCurrentPath,
  evaluatorNav,
  commonSelectors,
  requirementsSelectors,
  vendorSelectors,
  workshopSelectors,
  scoringSelectors,
  TEST_REQUIREMENT,
  TEST_VENDOR,
  TEST_WORKSHOP
} from './evaluator-test-utils.js';

// Use admin auth state
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Evaluator Admin - Navigation', () => {
  test('can access evaluator dashboard', async ({ page }) => {
    await navigateToEvaluator(page);
    await waitForEvaluatorLoad(page);
    
    // Should be on evaluator dashboard
    expect(getCurrentPath(page)).toContain('/evaluator');
    
    // Dashboard should have key elements
    await expect(page.locator('.evaluator-dashboard, [data-testid="evaluator-dashboard"]')).toBeVisible();
  });

  test('can navigate to all main sections', async ({ page }) => {
    await navigateToEvaluator(page);
    await waitForEvaluatorLoad(page);
    
    // Test navigation to each section
    const sections = ['requirements', 'vendors', 'workshops', 'documents', 'evaluation', 'reports', 'settings'];
    
    for (const section of sections) {
      const navItem = page.locator(evaluatorNav[section]).first();
      if (await navItem.count() > 0 && await navItem.isVisible()) {
        await navItem.click();
        await waitForEvaluatorLoad(page);
        expect(getCurrentPath(page)).toContain(section);
      }
    }
  });
});

test.describe('Evaluator Admin - Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'requirements');
  });

  test('requirements hub loads correctly', async ({ page }) => {
    // Should show the requirements hub
    await expect(page.locator(requirementsSelectors.hub).first()).toBeVisible({ timeout: 10000 });
    
    // Should have add requirement button
    await expect(page.locator(requirementsSelectors.createButton)).toBeVisible();
  });

  test('can create a new requirement', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);
    
    // Click add requirement button
    await page.locator(requirementsSelectors.createButton).click();
    
    // Form should appear
    await expect(page.locator(requirementsSelectors.form).first()).toBeVisible({ timeout: 5000 });
    
    // Fill in requirement details
    const uniqueTitle = `${TEST_REQUIREMENT.title} - ${Date.now()}`;
    await page.fill(requirementsSelectors.titleInput, uniqueTitle);
    await page.fill(requirementsSelectors.descriptionInput, TEST_REQUIREMENT.description);
    
    // Select priority if available
    const prioritySelect = page.locator(requirementsSelectors.prioritySelect);
    if (await prioritySelect.count() > 0) {
      await prioritySelect.selectOption(TEST_REQUIREMENT.priority);
    }
    
    // Save the requirement
    await page.locator(commonSelectors.saveButton).click();
    await waitForEvaluatorLoad(page);
    
    // Should see the new requirement in the list
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible({ timeout: 10000 });
    
    // Check for console errors
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('can filter requirements by status', async ({ page }) => {
    // Find status filter
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').first();
    
    if (await statusFilter.count() > 0) {
      // Filter to draft
      await statusFilter.selectOption('draft');
      await waitForEvaluatorLoad(page);
      
      // All visible requirements should be draft
      const statusBadges = page.locator(requirementsSelectors.statusBadge);
      const count = await statusBadges.count();
      
      for (let i = 0; i < count; i++) {
        const text = await statusBadges.nth(i).textContent();
        expect(text?.toLowerCase()).toContain('draft');
      }
    }
  });

  test('can view requirement details', async ({ page }) => {
    // Click on a requirement card if one exists
    const requirementCard = page.locator(requirementsSelectors.card).first();
    
    if (await requirementCard.count() > 0) {
      await requirementCard.click();
      await waitForEvaluatorLoad(page);
      
      // Should navigate to detail page or open modal
      const detailView = page.locator('.requirement-detail, [data-testid="requirement-detail"]');
      await expect(detailView.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Evaluator Admin - Vendors', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'vendors');
  });

  test('vendors hub loads correctly', async ({ page }) => {
    // Should show the vendors hub
    await expect(page.locator(vendorSelectors.hub).first()).toBeVisible({ timeout: 10000 });
    
    // Should have add vendor button
    await expect(page.locator(vendorSelectors.createButton)).toBeVisible();
  });

  test('can create a new vendor', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);
    
    // Click add vendor button
    await page.locator(vendorSelectors.createButton).click();
    
    // Form should appear
    await expect(page.locator(vendorSelectors.form).first()).toBeVisible({ timeout: 5000 });
    
    // Fill in vendor details
    const uniqueName = `${TEST_VENDOR.name} - ${Date.now()}`;
    await page.fill(vendorSelectors.nameInput, uniqueName);
    
    const descriptionInput = page.locator(vendorSelectors.descriptionInput);
    if (await descriptionInput.count() > 0) {
      await descriptionInput.fill(TEST_VENDOR.description);
    }
    
    const websiteInput = page.locator(vendorSelectors.websiteInput);
    if (await websiteInput.count() > 0) {
      await websiteInput.fill(TEST_VENDOR.website);
    }
    
    // Save the vendor
    await page.locator(commonSelectors.saveButton).click();
    await waitForEvaluatorLoad(page);
    
    // Should see the new vendor
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 });
    
    // Check for console errors
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('vendor pipeline displays correctly', async ({ page }) => {
    // Check for pipeline view
    const pipeline = page.locator(vendorSelectors.pipeline);
    
    if (await pipeline.count() > 0) {
      await expect(pipeline.first()).toBeVisible();
      
      // Pipeline should have stage columns
      const stages = page.locator('.pipeline-stage, .vendor-stage');
      expect(await stages.count()).toBeGreaterThan(0);
    }
  });

  test('can view vendor details', async ({ page }) => {
    // Click on a vendor card if one exists
    const vendorCard = page.locator(vendorSelectors.card).first();
    
    if (await vendorCard.count() > 0) {
      await vendorCard.click();
      await waitForEvaluatorLoad(page);
      
      // Should navigate to detail page
      expect(getCurrentPath(page)).toContain('/vendor');
    }
  });
});

test.describe('Evaluator Admin - Workshops', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'workshops');
  });

  test('workshops hub loads correctly', async ({ page }) => {
    // Should show the workshops hub
    await expect(page.locator(workshopSelectors.hub).first()).toBeVisible({ timeout: 10000 });
    
    // Should have schedule workshop button
    await expect(page.locator(workshopSelectors.createButton)).toBeVisible();
  });

  test('can schedule a new workshop', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);
    
    // Click schedule workshop button
    await page.locator(workshopSelectors.createButton).click();
    
    // Form should appear
    await expect(page.locator(workshopSelectors.form).first()).toBeVisible({ timeout: 5000 });
    
    // Fill in workshop details
    const uniqueName = `${TEST_WORKSHOP.name} - ${Date.now()}`;
    await page.fill(workshopSelectors.nameInput, uniqueName);
    
    const descriptionInput = page.locator(workshopSelectors.descriptionInput);
    if (await descriptionInput.count() > 0) {
      await descriptionInput.fill(TEST_WORKSHOP.description);
    }
    
    // Set date to tomorrow
    const dateInput = page.locator(workshopSelectors.dateInput);
    if (await dateInput.count() > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().slice(0, 16);
      await dateInput.fill(dateStr);
    }
    
    // Save the workshop
    await page.locator(commonSelectors.saveButton).click();
    await waitForEvaluatorLoad(page);
    
    // Should see the new workshop
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 });
    
    // Check for console errors
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});

test.describe('Evaluator Admin - Settings', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'settings');
  });

  test('settings page loads with all sections', async ({ page }) => {
    // Should show settings sections
    const settingsPage = page.locator('.evaluation-settings, [data-testid="evaluation-settings"]');
    await expect(settingsPage.first()).toBeVisible({ timeout: 10000 });
    
    // Check for key settings sections
    const sectionTitles = ['Categories', 'Stakeholder Areas', 'Scoring Scale'];
    
    for (const title of sectionTitles) {
      const section = page.locator(`text=${title}`);
      if (await section.count() > 0) {
        await expect(section.first()).toBeVisible();
      }
    }
  });

  test('can manage evaluation categories', async ({ page }) => {
    // Find categories section
    const categoriesSection = page.locator('.categories-manager, [data-testid="categories-manager"]');
    
    if (await categoriesSection.count() > 0) {
      // Should be able to add a category
      const addButton = categoriesSection.locator('button:has-text("Add"), button:has-text("New")');
      await expect(addButton.first()).toBeVisible();
    }
  });

  test('can manage stakeholder areas', async ({ page }) => {
    // Find stakeholder areas section
    const areasSection = page.locator('.stakeholder-areas-manager, [data-testid="stakeholder-areas-manager"]');
    
    if (await areasSection.count() > 0) {
      // Should be able to add an area
      const addButton = areasSection.locator('button:has-text("Add"), button:has-text("New")');
      await expect(addButton.first()).toBeVisible();
    }
  });
});

test.describe('Evaluator Admin - Scoring Interface', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'evaluation');
  });

  test('evaluation hub loads correctly', async ({ page }) => {
    // Should show the evaluation hub
    await expect(page.locator(scoringSelectors.hub).first()).toBeVisible({ timeout: 10000 });
  });

  test('scoring interface shows criteria by category', async ({ page }) => {
    // If there's a vendor to score, select it
    const vendorSelect = page.locator('select[name="vendor"], [data-testid="vendor-select"]');
    
    if (await vendorSelect.count() > 0) {
      // Select first vendor
      const options = await vendorSelect.locator('option').all();
      if (options.length > 1) {
        await vendorSelect.selectOption({ index: 1 });
        await waitForEvaluatorLoad(page);
        
        // Scoring interface should appear
        const scoringInterface = page.locator(scoringSelectors.interface);
        if (await scoringInterface.count() > 0) {
          await expect(scoringInterface.first()).toBeVisible();
          
          // Should show categories
          const categories = page.locator(scoringSelectors.category);
          expect(await categories.count()).toBeGreaterThan(0);
        }
      }
    }
  });
});

test.describe('Evaluator Admin - Reports', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'reports');
  });

  test('reports hub loads correctly', async ({ page }) => {
    // Should show the reports hub
    const reportsHub = page.locator('.reports-hub, [data-testid="reports-hub"]');
    await expect(reportsHub.first()).toBeVisible({ timeout: 10000 });
  });

  test('can access report generation options', async ({ page }) => {
    // Check for report generation buttons
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Export")');
    
    if (await generateButton.count() > 0) {
      await expect(generateButton.first()).toBeVisible();
    }
  });
});

test.describe('Evaluator Admin - Traceability', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'traceability');
  });

  test('traceability matrix loads', async ({ page }) => {
    // Should show the traceability view
    const traceabilityView = page.locator('.traceability-view, [data-testid="traceability-view"]');
    await expect(traceabilityView.first()).toBeVisible({ timeout: 10000 });
  });

  test('matrix displays requirements and vendors', async ({ page }) => {
    // Check for matrix structure
    const matrix = page.locator('.traceability-matrix, [data-testid="traceability-matrix"]');
    
    if (await matrix.count() > 0) {
      await expect(matrix.first()).toBeVisible();
      
      // Matrix should have rows and columns
      const rows = page.locator('.matrix-row, tr');
      expect(await rows.count()).toBeGreaterThan(0);
    }
  });
});
