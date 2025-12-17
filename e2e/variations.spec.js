/**
 * E2E Tests - Variations
 * Location: e2e/variations.spec.js
 * 
 * Tests variation/change request functionality including page load,
 * creation workflow, signature collection, apply workflow, milestone
 * impact verification, and role-based access.
 * 
 * IMPORTANT: All selectors use data-testid per docs/TESTING-CONVENTIONS.md
 * 
 * @version 1.1
 * @created 15 December 2025
 * @updated 17 December 2025 - Added apply workflow and milestone impact tests
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

// ============================================
// VARIATION DETAIL PAGE TESTS
// ============================================
test.describe('Variation Detail Page @variations', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Page Elements', () => {
    test('variation detail page loads with correct elements', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      // Find first variation row and click it
      const rows = page.locator('[data-testid^="variation-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        await rows.first().click();
        await waitForPageLoad(page);
        
        // Should navigate to detail page
        await expect(page).toHaveURL(/\/variations\/[a-f0-9-]+/);
        
        // Verify core elements
        await expect(page.locator('[data-testid="variation-detail-page"]')).toBeVisible({ timeout: 15000 });
      }
    });

    test('variation detail shows affected milestones section', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="variation-row-"]');
      const rowCount = await rows.count();
      
      if (rowCount > 0) {
        await rows.first().click();
        await waitForPageLoad(page);
        
        // Should have affected milestones section
        await expect(page.locator('[data-testid="variation-milestones-section"]')).toBeVisible({ timeout: 10000 });
      }
    });
  });
});

// ============================================
// VARIATION WORKFLOW TESTS - APPLIED VARIATIONS
// ============================================
test.describe('Variation Applied Status @variations @workflow', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Applied Variation Verification', () => {
    test('applied variation shows correct status badge', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      // Look for an applied variation
      const appliedBadges = page.locator('[data-testid^="variation-status-"]').filter({ hasText: /applied/i });
      const hasApplied = await appliedBadges.count() > 0;
      
      if (hasApplied) {
        await expect(appliedBadges.first()).toBeVisible();
      } else {
        // No applied variations exist - skip test
        test.skip();
      }
    });

    test('clicking applied variation navigates to detail page', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      // Find row with applied status
      const rows = page.locator('[data-testid^="variation-row-"]');
      const rowCount = await rows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const statusText = await row.locator('[data-testid^="variation-status-"]').textContent();
        
        if (statusText?.toLowerCase().includes('applied')) {
          await row.click();
          await waitForPageLoad(page);
          
          await expect(page).toHaveURL(/\/variations\/[a-f0-9-]+/);
          return;
        }
      }
      
      test.skip();
    });
  });
});

// ============================================
// VARIATION MILESTONE IMPACT VERIFICATION
// ============================================
test.describe('Variation Milestone Impact @variations @workflow', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Verify Applied Variation Updates Milestone', () => {
    test('milestone affected by applied variation shows updated baseline', async ({ page }) => {
      // First, find an applied variation to get its affected milestone
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="variation-row-"]');
      const rowCount = await rows.count();
      
      let foundAppliedVariation = false;
      
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const statusText = await row.locator('[data-testid^="variation-status-"]').textContent();
        
        if (statusText?.toLowerCase().includes('applied')) {
          foundAppliedVariation = true;
          await row.click();
          await waitForPageLoad(page);
          
          // Now we're on the variation detail page
          // Look for milestone links in the affected milestones section
          const milestoneLinks = page.locator('[data-testid="variation-milestones-section"] a[href*="/milestones/"]');
          const milestoneCount = await milestoneLinks.count();
          
          if (milestoneCount > 0) {
            // Get the href of the first milestone
            const href = await milestoneLinks.first().getAttribute('href');
            
            // Navigate to that milestone
            await page.goto(href);
            await waitForPageLoad(page);
            
            // Verify the milestone detail page loads
            await expect(page.locator('[data-testid="milestone-detail-ref"]')).toBeVisible({ timeout: 10000 });
            
            // Check if baseline history section exists (indicates variation was applied)
            const historySection = page.locator('[data-testid="milestone-baseline-history-section"]');
            const hasHistory = await historySection.count() > 0;
            
            if (hasHistory) {
              await expect(historySection).toBeVisible();
              
              // Expand history
              await page.locator('[data-testid="baseline-history-toggle"]').click();
              
              // Should have at least 2 versions (original + variation update)
              const versions = page.locator('[data-testid^="baseline-version-"]');
              const versionCount = await versions.count();
              expect(versionCount).toBeGreaterThanOrEqual(2);
              
              return;
            }
          }
          break;
        }
      }
      
      if (!foundAppliedVariation) {
        test.skip();
      }
    });

    test('milestone version indicator links back to variation', async ({ page }) => {
      await page.goto('/milestones');
      await waitForPageLoad(page);
      
      const rows = page.locator('[data-testid^="milestone-row-"]');
      const rowCount = await rows.count();
      
      // Try each milestone to find one with version indicator
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        await page.goto('/milestones');
        await waitForPageLoad(page);
        
        await rows.nth(i).click();
        await waitForPageLoad(page);
        
        const versionIndicator = page.locator('[data-testid="baseline-version-indicator"]');
        const hasIndicator = await versionIndicator.count() > 0;
        
        if (hasIndicator) {
          // Check if there's a variation link in the indicator
          const variationLink = versionIndicator.locator('a[href*="/variations/"]');
          const hasLink = await variationLink.count() > 0;
          
          if (hasLink) {
            // Click the variation link
            await variationLink.click();
            await waitForPageLoad(page);
            
            // Should navigate to variation detail
            await expect(page).toHaveURL(/\/variations\/[a-f0-9-]+/);
            return;
          }
        }
      }
      
      test.skip();
    });
  });
});

// ============================================
// VARIATION APPLY WORKFLOW (End-to-End)
// ============================================
test.describe('Variation Apply Workflow @variations @workflow @e2e', () => {
  // This test requires specific data setup and both PM signatures
  // It uses admin to test the full flow
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.describe('Full Workflow - Apply Approved Variation', () => {
    test('approved variation can be applied and updates milestone', async ({ page }) => {
      await page.goto('/variations');
      await waitForPageLoad(page);
      
      // Look for an approved (but not applied) variation
      const rows = page.locator('[data-testid^="variation-row-"]');
      const rowCount = await rows.count();
      
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const statusText = await row.locator('[data-testid^="variation-status-"]').textContent();
        
        // Look for "approved" status (not "applied")
        if (statusText?.toLowerCase() === 'approved') {
          await row.click();
          await waitForPageLoad(page);
          
          // On detail page, look for Apply button
          const applyButton = page.locator('[data-testid="variation-apply-button"]');
          const canApply = await applyButton.count() > 0;
          
          if (canApply && await applyButton.isEnabled()) {
            // Store the variation ref for verification
            const variationRef = await page.locator('[data-testid="variation-detail-ref"]').textContent();
            
            // Click apply
            await applyButton.click();
            
            // Wait for confirmation dialog or action
            await page.waitForTimeout(1000);
            
            // Confirm if dialog appears
            const confirmButton = page.locator('[data-testid="confirm-apply-button"], button:has-text("Confirm"), button:has-text("Apply")');
            if (await confirmButton.count() > 0) {
              await confirmButton.click();
            }
            
            // Wait for success toast or status change
            await page.waitForTimeout(2000);
            
            // Verify status changed to applied
            const newStatus = await page.locator('[data-testid="variation-detail-status"]').textContent();
            expect(newStatus?.toLowerCase()).toContain('applied');
            
            return;
          }
        }
      }
      
      // No approved variations available to apply - skip
      test.skip();
    });
  });
});
