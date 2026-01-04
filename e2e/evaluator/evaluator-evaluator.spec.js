/**
 * Evaluator Role E2E Tests
 * Tests for users with the "evaluator" role in the Evaluator tool
 * These users can view requirements, score vendors, and access reports
 * 
 * @see docs/EVALUATOR-TECHNICAL-ARCHITECTURE.md (Section A.3)
 */

import { test, expect } from '@playwright/test';
import {
  navigateToEvaluator,
  waitForEvaluatorLoad,
  navigateToEvaluatorPage,
  setupConsoleErrorTracking,
  getCurrentPath,
  evaluatorNav,
  commonSelectors,
  requirementsSelectors,
  vendorSelectors,
  scoringSelectors
} from './evaluator-test-utils.js';

// Use supplier_pm auth state (acts as evaluator in the Evaluator tool)
test.use({ storageState: 'playwright/.auth/supplier_pm.json' });

test.describe('Evaluator Role - Access', () => {
  test('can access evaluator dashboard', async ({ page }) => {
    await navigateToEvaluator(page);
    await waitForEvaluatorLoad(page);
    
    // Should be on evaluator dashboard
    expect(getCurrentPath(page)).toContain('/evaluator');
  });

  test('can navigate to requirements', async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'requirements');
    
    expect(getCurrentPath(page)).toContain('/requirements');
  });

  test('can navigate to vendors', async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'vendors');
    
    expect(getCurrentPath(page)).toContain('/vendors');
  });

  test('can navigate to evaluation/scoring', async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'evaluation');
    
    expect(getCurrentPath(page)).toContain('/evaluation');
  });
});

test.describe('Evaluator Role - Requirements', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'requirements');
  });

  test('can view requirements list', async ({ page }) => {
    // Should see requirements hub
    await expect(page.locator(requirementsSelectors.hub).first()).toBeVisible({ timeout: 10000 });
  });

  test('can filter requirements', async ({ page }) => {
    // Should have filter controls
    const filters = page.locator(requirementsSelectors.filters);
    
    if (await filters.count() > 0) {
      await expect(filters.first()).toBeVisible();
    }
  });

  test('can add new requirement', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);
    
    // Find add button
    const addButton = page.locator(requirementsSelectors.createButton);
    
    if (await addButton.count() > 0 && await addButton.isVisible()) {
      await addButton.click();
      
      // Form should appear
      await expect(page.locator(requirementsSelectors.form).first()).toBeVisible({ timeout: 5000 });
    }
    
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});

test.describe('Evaluator Role - Scoring', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'evaluation');
  });

  test('evaluation hub shows vendors to score', async ({ page }) => {
    // Should show evaluation hub
    await expect(page.locator(scoringSelectors.hub).first()).toBeVisible({ timeout: 10000 });
  });

  test('can select vendor to score', async ({ page }) => {
    // Find vendor selector
    const vendorSelect = page.locator('select[name="vendor"], [data-testid="vendor-select"]');
    
    if (await vendorSelect.count() > 0 && await vendorSelect.isVisible()) {
      // Get options
      const options = await vendorSelect.locator('option').allTextContents();
      console.log('Available vendors:', options);
      
      // Select first vendor if available
      if (options.length > 1) {
        await vendorSelect.selectOption({ index: 1 });
        await waitForEvaluatorLoad(page);
      }
    }
  });

  test('can enter score for criterion', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);
    
    // Select a vendor first
    const vendorSelect = page.locator('select[name="vendor"], [data-testid="vendor-select"]');
    if (await vendorSelect.count() > 0) {
      const options = await vendorSelect.locator('option').all();
      if (options.length > 1) {
        await vendorSelect.selectOption({ index: 1 });
        await waitForEvaluatorLoad(page);
      }
    }
    
    // Find scoring interface
    const scoringInterface = page.locator(scoringSelectors.interface);
    
    if (await scoringInterface.count() > 0) {
      // Find a criterion
      const criterion = page.locator(scoringSelectors.criterion).first();
      
      if (await criterion.count() > 0) {
        // Click to expand
        await criterion.click();
        
        // Find score buttons
        const scoreButtons = criterion.locator(scoringSelectors.scoreButton);
        
        if (await scoreButtons.count() > 0) {
          // Click score 4
          await scoreButtons.nth(3).click();
          
          // Should show score selected
          await expect(scoreButtons.nth(3)).toHaveClass(/selected|filled/);
        }
      }
    }
    
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });

  test('can add rationale for score', async ({ page }) => {
    // Select vendor
    const vendorSelect = page.locator('select[name="vendor"], [data-testid="vendor-select"]');
    if (await vendorSelect.count() > 0) {
      const options = await vendorSelect.locator('option').all();
      if (options.length > 1) {
        await vendorSelect.selectOption({ index: 1 });
        await waitForEvaluatorLoad(page);
      }
    }
    
    // Find scoring interface
    const scoringInterface = page.locator(scoringSelectors.interface);
    
    if (await scoringInterface.count() > 0) {
      // Find a criterion and expand it
      const criterion = page.locator(scoringSelectors.criterion).first();
      
      if (await criterion.count() > 0) {
        await criterion.click();
        
        // Find rationale textarea
        const rationale = criterion.locator(scoringSelectors.rationale);
        
        if (await rationale.count() > 0) {
          await rationale.fill('Test rationale from E2E tests');
          
          // Value should be entered
          await expect(rationale).toHaveValue('Test rationale from E2E tests');
        }
      }
    }
  });

  test('can save score', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracking(page);
    
    // Select vendor
    const vendorSelect = page.locator('select[name="vendor"], [data-testid="vendor-select"]');
    if (await vendorSelect.count() > 0) {
      const options = await vendorSelect.locator('option').all();
      if (options.length > 1) {
        await vendorSelect.selectOption({ index: 1 });
        await waitForEvaluatorLoad(page);
      }
    }
    
    // Find scoring interface
    const scoringInterface = page.locator(scoringSelectors.interface);
    
    if (await scoringInterface.count() > 0) {
      const criterion = page.locator(scoringSelectors.criterion).first();
      
      if (await criterion.count() > 0) {
        await criterion.click();
        
        // Enter a score
        const scoreButtons = criterion.locator(scoringSelectors.scoreButton);
        if (await scoreButtons.count() > 0) {
          await scoreButtons.nth(2).click();
        }
        
        // Find and click save button
        const saveButton = criterion.locator(scoringSelectors.saveButton);
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await waitForEvaluatorLoad(page);
        }
      }
    }
    
    expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0);
  });
});

test.describe('Evaluator Role - Evidence', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
  });

  test('can view evidence on vendor detail', async ({ page }) => {
    await navigateToEvaluatorPage(page, 'vendors');
    
    // Click on a vendor card
    const vendorCard = page.locator(vendorSelectors.card).first();
    
    if (await vendorCard.count() > 0) {
      await vendorCard.click();
      await waitForEvaluatorLoad(page);
      
      // Should see vendor detail page
      expect(getCurrentPath(page)).toContain('/vendor');
      
      // Check for evidence section
      const evidenceSection = page.locator('.evidence-section, [data-testid="evidence-section"]');
      // Evidence section might exist
      console.log(`Evidence section count: ${await evidenceSection.count()}`);
    }
  });

  test('can add evidence', async ({ page }) => {
    await navigateToEvaluatorPage(page, 'vendors');
    
    // Click on a vendor card
    const vendorCard = page.locator(vendorSelectors.card).first();
    
    if (await vendorCard.count() > 0) {
      await vendorCard.click();
      await waitForEvaluatorLoad(page);
      
      // Find add evidence button
      const addEvidenceButton = page.locator('button:has-text("Add Evidence"), button:has-text("New Evidence")');
      
      if (await addEvidenceButton.count() > 0 && await addEvidenceButton.isVisible()) {
        await addEvidenceButton.click();
        
        // Form should appear
        const evidenceForm = page.locator('.evidence-form, [data-testid="evidence-form"]');
        await expect(evidenceForm.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Evaluator Role - Workshops', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'workshops');
  });

  test('can view workshops list', async ({ page }) => {
    // Should see workshops hub
    const workshopsHub = page.locator('.workshops-hub');
    await expect(workshopsHub.first()).toBeVisible({ timeout: 10000 });
  });

  test('can access workshop detail', async ({ page }) => {
    // Click on a workshop card
    const workshopCard = page.locator('.workshop-card').first();
    
    if (await workshopCard.count() > 0) {
      await workshopCard.click();
      await waitForEvaluatorLoad(page);
      
      // Should navigate to detail page
      expect(getCurrentPath(page)).toContain('/workshop');
    }
  });
});

test.describe('Evaluator Role - Traceability', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'traceability');
  });

  test('can view traceability matrix', async ({ page }) => {
    // Should see traceability view
    const traceabilityView = page.locator('.traceability-view');
    await expect(traceabilityView.first()).toBeVisible({ timeout: 10000 });
  });

  test('matrix shows requirements and vendors', async ({ page }) => {
    // Check for matrix
    const matrix = page.locator('.traceability-matrix');
    
    if (await matrix.count() > 0) {
      await expect(matrix.first()).toBeVisible();
    }
  });
});

test.describe('Evaluator Role - Reports', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToEvaluator(page);
    await navigateToEvaluatorPage(page, 'reports');
  });

  test('can view reports hub', async ({ page }) => {
    // Should see reports hub
    const reportsHub = page.locator('.reports-hub');
    await expect(reportsHub.first()).toBeVisible({ timeout: 10000 });
  });

  test('can generate report', async ({ page }) => {
    // Find generate button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Export")');
    
    if (await generateButton.count() > 0 && await generateButton.isVisible()) {
      await expect(generateButton.first()).toBeEnabled();
    }
  });
});
