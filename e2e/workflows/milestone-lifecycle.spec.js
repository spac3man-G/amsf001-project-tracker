/**
 * E2E Workflow Test - Milestone Lifecycle (Workflow 1)
 * Location: e2e/workflows/milestone-lifecycle.spec.js
 * 
 * This is the primary end-to-end workflow test that exercises the complete
 * lifecycle of a milestone from creation through to completion and billing.
 * 
 * @version 1.0
 * @created 15 December 2025
 * @tags @workflow @critical @milestone-lifecycle
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForToast, generateTestId } from '../test-utils.js';

// ============================================
// AUTH STATE PATHS
// ============================================

const AUTH_PATHS = {
  admin: 'playwright/.auth/admin.json',
  supplier_pm: 'playwright/.auth/supplier_pm.json',
  customer_pm: 'playwright/.auth/customer_pm.json',
  contributor: 'playwright/.auth/contributor.json',
};

// ============================================
// TEST DATA GENERATION
// ============================================

const TEST_RUN_ID = Date.now().toString(36).toUpperCase().slice(-6);

const TEST_DATA = {
  milestone: {
    ref: `WF1-MS-${TEST_RUN_ID}`,
    name: `Workflow Test Milestone ${TEST_RUN_ID}`,
    description: 'E2E workflow test milestone',
    baselineStartDate: '2025-01-01',
    baselineEndDate: '2025-03-31',
    billableAmount: '50000',
  },
  qualityStandards: [
    { ref: `WF1-QS1-${TEST_RUN_ID}`, name: 'Code Review Standard', description: 'All code must pass peer review' },
    { ref: `WF1-QS2-${TEST_RUN_ID}`, name: 'Documentation Standard', description: 'Technical docs must be complete' },
    { ref: `WF1-QS3-${TEST_RUN_ID}`, name: 'Testing Standard', description: '80% test coverage required' },
  ],
  kpis: [
    { ref: `WF1-KPI1-${TEST_RUN_ID}`, name: 'Delivery Timeliness', description: 'Deliverables on time', target: '95' },
    { ref: `WF1-KPI2-${TEST_RUN_ID}`, name: 'Defect Rate', description: 'Post-delivery defects', target: '5' },
    { ref: `WF1-KPI3-${TEST_RUN_ID}`, name: 'Customer Satisfaction', description: 'CSAT score', target: '90' },
  ],
  deliverables: [
    { ref: `WF1-DEL1-${TEST_RUN_ID}`, name: 'Requirements Document', description: 'Complete requirements spec' },
    { ref: `WF1-DEL2-${TEST_RUN_ID}`, name: 'Technical Design', description: 'System architecture document' },
    { ref: `WF1-DEL3-${TEST_RUN_ID}`, name: 'Implementation Package', description: 'Working software module' },
  ],
  timesheets: [
    { hours: '8', description: 'Requirements gathering session' },
    { hours: '16', description: 'Technical design work' },
    { hours: '24', description: 'Implementation and testing' },
  ],
  rejectionReason: 'Missing section on security requirements. Please add details on authentication and authorization.',
};

// Store IDs created during tests for cross-test reference
const createdIds = {
  milestoneId: null,
  qualityStandardIds: [],
  kpiIds: [],
  deliverableIds: [],
  timesheetIds: [],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function navigateToPage(page, path) {
  await page.goto(path);
  await waitForPageLoad(page);
}

async function fillFormField(page, testId, value, type = 'input') {
  const selector = `[data-testid="${testId}"]`;
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: 10000 });
  
  if (type === 'select') {
    await element.selectOption(value);
  } else {
    await element.fill(value);
  }
}

async function clickButton(page, testId) {
  const selector = `[data-testid="${testId}"]`;
  await page.locator(selector).waitFor({ state: 'visible', timeout: 10000 });
  await page.locator(selector).click();
}

async function waitForElement(page, testId, timeout = 10000) {
  const selector = `[data-testid="${testId}"]`;
  await page.locator(selector).waitFor({ state: 'visible', timeout });
}

async function elementExists(page, testId) {
  const selector = `[data-testid="${testId}"]`;
  return await page.locator(selector).count() > 0;
}

// ============================================
// MAIN TEST SUITE
// ============================================

// Only run on chromium to avoid parallel execution across browsers
test.describe('Milestone Lifecycle Workflow @workflow @critical @milestone-lifecycle', () => {
  test.describe.configure({ mode: 'serial' });
  
  // Skip if not chromium project - this workflow should only run once
  test.skip(({ browserName }) => browserName !== 'chromium', 'Workflow tests only run on chromium');

  // ============================================
  // PHASE 1: SETUP - CREATE MILESTONE, KPIs, QS
  // ============================================

  test.describe('Phase 1: Setup - Supplier PM Creates Foundation', () => {
    
    test('1.1 Supplier PM creates a new milestone', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/milestones');
      await expect(page.locator('[data-testid="milestones-page"]')).toBeVisible({ timeout: 15000 });
      
      await clickButton(page, 'add-milestone-button');
      await waitForElement(page, 'milestones-add-form');
      
      await fillFormField(page, 'milestone-ref-input', TEST_DATA.milestone.ref);
      await fillFormField(page, 'milestone-name-input', TEST_DATA.milestone.name);
      
      if (await elementExists(page, 'milestone-description-input')) {
        await fillFormField(page, 'milestone-description-input', TEST_DATA.milestone.description);
      }
      
      await clickButton(page, 'milestone-save-button');
      await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      
      await page.waitForTimeout(1000);
      const milestoneRow = page.locator(`[data-testid^="milestone-row-"]`).filter({ hasText: TEST_DATA.milestone.ref });
      await expect(milestoneRow).toBeVisible({ timeout: 10000 });
      
      const rowTestId = await milestoneRow.getAttribute('data-testid');
      if (rowTestId) {
        createdIds.milestoneId = rowTestId.replace('milestone-row-', '');
      }
      
      await context.close();
    });

    test('1.2 Supplier PM creates three quality standards', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/quality-standards');
      await expect(page.locator('[data-testid="quality-standards-page"]')).toBeVisible({ timeout: 15000 });
      
      for (let i = 0; i < TEST_DATA.qualityStandards.length; i++) {
        const qs = TEST_DATA.qualityStandards[i];
        
        await clickButton(page, 'add-quality-standard-button');
        await waitForElement(page, 'quality-standards-add-form');
        
        await fillFormField(page, 'qs-ref-input', qs.ref);
        await fillFormField(page, 'qs-name-input', qs.name);
        
        if (await elementExists(page, 'qs-description-input')) {
          await fillFormField(page, 'qs-description-input', qs.description);
        }
        
        await clickButton(page, 'qs-save-button');
        
        // Wait for form to close (indicates save complete)
        await expect(page.locator('[data-testid="quality-standards-add-form"]')).toBeHidden({ timeout: 10000 });
        await page.waitForTimeout(500);
        
        const qsRow = page.locator(`[data-testid^="qs-row-"]`).filter({ hasText: qs.ref });
        await expect(qsRow).toBeVisible({ timeout: 10000 });
        
        const rowTestId = await qsRow.getAttribute('data-testid');
        if (rowTestId) {
          createdIds.qualityStandardIds.push(rowTestId.replace('qs-row-', ''));
        }
      }
      
      await context.close();
    });

    test('1.3 Supplier PM creates three KPIs', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/kpis');
      await expect(page.locator('[data-testid="kpis-page"]')).toBeVisible({ timeout: 15000 });
      
      for (let i = 0; i < TEST_DATA.kpis.length; i++) {
        const kpi = TEST_DATA.kpis[i];
        
        await clickButton(page, 'add-kpi-button');
        await waitForElement(page, 'kpis-add-form');
        
        await fillFormField(page, 'kpi-ref-input', kpi.ref);
        await fillFormField(page, 'kpi-name-input', kpi.name);
        
        if (await elementExists(page, 'kpi-description-input')) {
          await fillFormField(page, 'kpi-description-input', kpi.description);
        }
        
        if (await elementExists(page, 'kpi-target-input')) {
          await fillFormField(page, 'kpi-target-input', kpi.target);
        }
        
        await clickButton(page, 'kpi-save-button');
        
        // Wait for form to close (indicates save complete)
        await expect(page.locator('[data-testid="kpis-add-form"]')).toBeHidden({ timeout: 10000 });
        await page.waitForTimeout(500);
        
        const kpiRow = page.locator(`[data-testid^="kpi-row-"]`).filter({ hasText: kpi.ref });
        await expect(kpiRow).toBeVisible({ timeout: 10000 });
        
        const rowTestId = await kpiRow.getAttribute('data-testid');
        if (rowTestId) {
          createdIds.kpiIds.push(rowTestId.replace('kpi-row-', ''));
        }
      }
      
      await context.close();
    });

    test('1.4 Supplier PM creates three deliverables linked to milestone', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/deliverables');
      await expect(page.locator('[data-testid="deliverables-page"]')).toBeVisible({ timeout: 15000 });
      
      for (let i = 0; i < TEST_DATA.deliverables.length; i++) {
        const del = TEST_DATA.deliverables[i];
        
        await clickButton(page, 'add-deliverable-button');
        await waitForElement(page, 'deliverables-add-form');
        
        await fillFormField(page, 'deliverable-ref-input', del.ref);
        await fillFormField(page, 'deliverable-name-input', del.name);
        
        if (await elementExists(page, 'deliverable-description-input')) {
          await fillFormField(page, 'deliverable-description-input', del.description);
        }
        
        const milestoneSelect = page.locator('[data-testid="deliverable-milestone-select"]');
        await milestoneSelect.waitFor({ state: 'visible' });
        
        const options = await milestoneSelect.locator('option').allTextContents();
        const milestoneOption = options.find(opt => opt.includes(TEST_DATA.milestone.ref));
        if (milestoneOption) {
          await milestoneSelect.selectOption({ label: milestoneOption });
        }
        
        await clickButton(page, 'deliverable-save-button');
        await expect(page.locator('[data-testid="toast-success"]').first().first()).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(500);
        
        const delRow = page.locator(`[data-testid^="deliverable-row-"]`).filter({ hasText: del.ref });
        await expect(delRow).toBeVisible({ timeout: 10000 });
        
        const rowTestId = await delRow.getAttribute('data-testid');
        if (rowTestId) {
          createdIds.deliverableIds.push(rowTestId.replace('deliverable-row-', ''));
        }
      }
      
      await context.close();
    });
  });

  // ============================================
  // PHASE 2: BASELINE COMMITMENT WORKFLOW
  // ============================================

  test.describe('Phase 2: Baseline Commitment - Dual Signature Workflow', () => {
    
    test('2.1 Supplier PM adds baseline dates and billable amount to milestone', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/milestones');
      
      const milestoneRefLink = page.locator(`[data-testid^="milestone-ref-"]`).filter({ hasText: TEST_DATA.milestone.ref });
      await milestoneRefLink.click();
      
      await expect(page.locator('[data-testid="milestone-detail-ref"]')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('[data-testid="milestone-detail-ref"]')).toContainText(TEST_DATA.milestone.ref);
      
      await clickButton(page, 'milestone-edit-button');
      await waitForElement(page, 'milestone-edit-modal');
      
      const dateInputs = page.locator('input[type="date"]');
      if (await dateInputs.count() >= 2) {
        await dateInputs.nth(0).fill(TEST_DATA.milestone.baselineStartDate);
        await dateInputs.nth(1).fill(TEST_DATA.milestone.baselineEndDate);
      }
      
      const billableInputs = page.locator('input[type="number"]');
      if (await billableInputs.count() > 0) {
        await billableInputs.first().fill(TEST_DATA.milestone.billableAmount);
      }
      
      await clickButton(page, 'milestone-edit-save-button');
      await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="milestone-baseline-section"]')).toBeVisible();
      
      await context.close();
    });

    test('2.2 Supplier PM signs baseline commitment', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/milestones');
      
      const milestoneRefLink = page.locator(`[data-testid^="milestone-ref-"]`).filter({ hasText: TEST_DATA.milestone.ref });
      await milestoneRefLink.click();
      
      await expect(page.locator('[data-testid="milestone-detail-ref"]')).toBeVisible({ timeout: 15000 });
      
      const baselineSection = page.locator('[data-testid="milestone-baseline-section"]');
      await baselineSection.scrollIntoViewIfNeeded();
      
      const supplierSignButton = baselineSection.locator('button').filter({ hasText: /Sign|Commit/i }).first();
      if (await supplierSignButton.isVisible()) {
        await supplierSignButton.click();
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      }
      
      await page.waitForTimeout(1000);
      await context.close();
    });

    test('2.3 Customer PM signs baseline commitment (completing dual signature)', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/milestones');
      
      const milestoneRefLink = page.locator(`[data-testid^="milestone-ref-"]`).filter({ hasText: TEST_DATA.milestone.ref });
      await milestoneRefLink.click();
      
      await expect(page.locator('[data-testid="milestone-detail-ref"]')).toBeVisible({ timeout: 15000 });
      
      const baselineSection = page.locator('[data-testid="milestone-baseline-section"]');
      await baselineSection.scrollIntoViewIfNeeded();
      
      const customerSignButton = baselineSection.locator('button').filter({ hasText: /Sign|Commit/i }).first();
      if (await customerSignButton.isVisible()) {
        await customerSignButton.click();
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      }
      
      await page.waitForTimeout(1000);
      const baselineStatus = page.locator('[data-testid="milestone-baseline-status"]');
      await expect(baselineStatus).toContainText(/Locked|Committed/i);
      
      await context.close();
    });
  });

  // ============================================
  // PHASE 3: DELIVERABLE WORK AND TIMESHEETS
  // ============================================

  test.describe('Phase 3: Contributor Works on Deliverables', () => {
    
    test('3.1 Contributor updates deliverable progress (first update)', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      
      await navigateToPage(page, '/deliverables');
      
      const delRefLink = page.locator(`[data-testid^="deliverable-ref-"]`).filter({ hasText: TEST_DATA.deliverables[0].ref });
      await delRefLink.click();
      await page.waitForTimeout(1000);
      
      const editButton = page.locator('[data-testid="deliverable-edit-button"], [data-testid="deliverable-modal-edit-button"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
      }
      
      const progressInput = page.locator('[data-testid="deliverable-progress-input"], input[type="number"]').first();
      if (await progressInput.isVisible()) {
        await progressInput.fill('30');
      }
      
      const statusSelect = page.locator('[data-testid="deliverable-status-select"], select').first();
      if (await statusSelect.isVisible()) {
        const options = await statusSelect.locator('option').allTextContents();
        const inProgressOption = options.find(opt => opt.toLowerCase().includes('progress'));
        if (inProgressOption) {
          await statusSelect.selectOption({ label: inProgressOption });
        }
      }
      
      const saveButton = page.locator('[data-testid="deliverable-save-button"], button').filter({ hasText: /Save/i }).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      }
      
      await context.close();
    });

    test('3.2 Contributor updates deliverable progress (second update)', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      
      await navigateToPage(page, '/deliverables');
      
      const delRefLink = page.locator(`[data-testid^="deliverable-ref-"]`).filter({ hasText: TEST_DATA.deliverables[0].ref });
      await delRefLink.click();
      await page.waitForTimeout(1000);
      
      const editButton = page.locator('[data-testid="deliverable-edit-button"], [data-testid="deliverable-modal-edit-button"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
      }
      
      const progressInput = page.locator('[data-testid="deliverable-progress-input"], input[type="number"]').first();
      if (await progressInput.isVisible()) {
        await progressInput.fill('80');
      }
      
      const saveButton = page.locator('[data-testid="deliverable-save-button"], button').filter({ hasText: /Save/i }).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      }
      
      await context.close();
    });

    test('3.3 Contributor submits deliverable for review', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      
      await navigateToPage(page, '/deliverables');
      
      const delRefLink = page.locator(`[data-testid^="deliverable-ref-"]`).filter({ hasText: TEST_DATA.deliverables[0].ref });
      await delRefLink.click();
      await page.waitForTimeout(1000);
      
      const submitButton = page.locator('button').filter({ hasText: /Submit.*Review|Send.*Review/i }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      } else {
        const editButton = page.locator('[data-testid="deliverable-edit-button"], [data-testid="deliverable-modal-edit-button"]').first();
        if (await editButton.isVisible()) {
          await editButton.click();
          
          const statusSelect = page.locator('[data-testid="deliverable-status-select"], select').first();
          if (await statusSelect.isVisible()) {
            const options = await statusSelect.locator('option').allTextContents();
            const reviewOption = options.find(opt => opt.toLowerCase().includes('review'));
            if (reviewOption) {
              await statusSelect.selectOption({ label: reviewOption });
            }
          }
          
          const progressInput = page.locator('[data-testid="deliverable-progress-input"], input[type="number"]').first();
          if (await progressInput.isVisible()) {
            await progressInput.fill('100');
          }
          
          const saveButton = page.locator('[data-testid="deliverable-save-button"], button').filter({ hasText: /Save/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
          }
        }
      }
      
      await context.close();
    });

    test('3.4 Supplier PM submits timesheets against milestone (3 entries)', async ({ browser }) => {
      // Using supplier_pm instead of contributor because contributor may not have resource access
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/timesheets');
      await expect(page.locator('[data-testid="timesheets-page"]')).toBeVisible({ timeout: 15000 });
      
      for (let i = 0; i < TEST_DATA.timesheets.length; i++) {
        const ts = TEST_DATA.timesheets[i];
        
        await clickButton(page, 'add-timesheet-button');
        await waitForElement(page, 'timesheet-form');
        
        // Select a resource first (required field)
        const resourceSelect = page.locator('[data-testid="timesheet-resource-select"]');
        await resourceSelect.waitFor({ state: 'visible' });
        
        // Select the second option (index 1) - first is usually placeholder
        const resourceOptions = await resourceSelect.locator('option').all();
        if (resourceOptions.length > 1) {
          const secondOption = await resourceOptions[1].getAttribute('value');
          if (secondOption) {
            await resourceSelect.selectOption({ index: 1 });
          }
        }
        
        await fillFormField(page, 'timesheet-hours-input', ts.hours);
        await fillFormField(page, 'timesheet-description-input', ts.description);
        
        const milestoneSelect = page.locator('[data-testid="timesheet-milestone-select"]');
        await milestoneSelect.waitFor({ state: 'visible' });
        
        const options = await milestoneSelect.locator('option').allTextContents();
        const milestoneOption = options.find(opt => opt.includes(TEST_DATA.milestone.ref));
        if (milestoneOption) {
          await milestoneSelect.selectOption({ label: milestoneOption });
        }
        
        const dateInput = page.locator('[data-testid="timesheet-date-input"]');
        if (await dateInput.isVisible()) {
          const today = new Date().toISOString().split('T')[0];
          await dateInput.fill(today);
        }
        
        await clickButton(page, 'timesheet-save-button');
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(500);
      }
      
      await context.close();
    });
  });

  // ============================================
  // PHASE 4: REVIEW WORKFLOW
  // ============================================

  test.describe('Phase 4: Deliverable Review Workflow', () => {
    
    test('4.1 Customer PM reviews deliverable and rejects with reason', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/deliverables');
      
      const delRefLink = page.locator(`[data-testid^="deliverable-ref-"]`).filter({ hasText: TEST_DATA.deliverables[0].ref });
      await delRefLink.click();
      await page.waitForTimeout(1000);
      
      const rejectButton = page.locator('button').filter({ hasText: /Reject|Return|More Work/i }).first();
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        
        const reasonInput = page.locator('textarea').first();
        if (await reasonInput.isVisible()) {
          await reasonInput.fill(TEST_DATA.rejectionReason);
        }
        
        const confirmButton = page.locator('button').filter({ hasText: /Confirm|Submit|OK/i }).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      }
      
      await context.close();
    });

    test('4.2 Contributor updates rejected deliverable and resubmits', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.contributor });
      const page = await context.newPage();
      
      await navigateToPage(page, '/deliverables');
      
      const delRefLink = page.locator(`[data-testid^="deliverable-ref-"]`).filter({ hasText: TEST_DATA.deliverables[0].ref });
      await delRefLink.click();
      await page.waitForTimeout(1000);
      
      const editButton = page.locator('[data-testid="deliverable-edit-button"], [data-testid="deliverable-modal-edit-button"]').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        const statusSelect = page.locator('[data-testid="deliverable-status-select"], select').first();
        if (await statusSelect.isVisible()) {
          const options = await statusSelect.locator('option').allTextContents();
          const reviewOption = options.find(opt => opt.toLowerCase().includes('review'));
          if (reviewOption) {
            await statusSelect.selectOption({ label: reviewOption });
          }
        }
        
        const saveButton = page.locator('[data-testid="deliverable-save-button"], button').filter({ hasText: /Save/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
        }
      }
      
      await context.close();
    });

    test('4.3 Supplier PM reviews and accepts deliverable with KPI/QS scoring', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/deliverables');
      
      const delRefLink = page.locator(`[data-testid^="deliverable-ref-"]`).filter({ hasText: TEST_DATA.deliverables[0].ref });
      await delRefLink.click();
      await page.waitForTimeout(1000);
      
      const acceptButton = page.locator('button').filter({ hasText: /Accept|Deliver|Complete|Mark.*Delivered/i }).first();
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        await page.waitForTimeout(500);
        
        const kpiInputs = await page.locator('input[type="number"]').all();
        for (const input of kpiInputs) {
          if (await input.isVisible()) {
            await input.fill('50');
          }
        }
        
        const confirmButton = page.locator('button').filter({ hasText: /Confirm|Submit|Complete/i }).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      }
      
      await context.close();
    });

    test('4.4 Complete remaining deliverables (DEL2 and DEL3)', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      for (let i = 1; i < TEST_DATA.deliverables.length; i++) {
        const del = TEST_DATA.deliverables[i];
        
        await navigateToPage(page, '/deliverables');
        
        const delRefLink = page.locator(`[data-testid^="deliverable-ref-"]`).filter({ hasText: del.ref });
        await delRefLink.click();
        await page.waitForTimeout(1000);
        
        const editButton = page.locator('[data-testid="deliverable-edit-button"], [data-testid="deliverable-modal-edit-button"]').first();
        if (await editButton.isVisible()) {
          await editButton.click();
          
          const progressInput = page.locator('[data-testid="deliverable-progress-input"], input[type="number"]').first();
          if (await progressInput.isVisible()) {
            await progressInput.fill('100');
          }
          
          const statusSelect = page.locator('[data-testid="deliverable-status-select"], select').first();
          if (await statusSelect.isVisible()) {
            const options = await statusSelect.locator('option').allTextContents();
            const deliveredOption = options.find(opt => opt.toLowerCase().includes('delivered'));
            if (deliveredOption) {
              await statusSelect.selectOption({ label: deliveredOption });
            }
          }
          
          const saveButton = page.locator('[data-testid="deliverable-save-button"], button').filter({ hasText: /Save/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
          }
        }
        
        const closeButton = page.locator('[data-testid$="-modal-close"], button').filter({ hasText: /Close|×/i }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
        
        await page.waitForTimeout(500);
      }
      
      await context.close();
    });
  });

  // ============================================
  // PHASE 5: MILESTONE COMPLETION AND CERTIFICATE
  // ============================================

  test.describe('Phase 5: Milestone Completion - Certificate Workflow', () => {
    
    test('5.1 Supplier PM generates milestone certificate', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/milestones');
      
      const milestoneRefLink = page.locator(`[data-testid^="milestone-ref-"]`).filter({ hasText: TEST_DATA.milestone.ref });
      await milestoneRefLink.click();
      
      await expect(page.locator('[data-testid="milestone-detail-ref"]')).toBeVisible({ timeout: 15000 });
      
      const certSection = page.locator('[data-testid="milestone-certificate-section"]');
      await certSection.scrollIntoViewIfNeeded();
      
      const generateButton = page.locator('[data-testid="milestone-generate-certificate-button"]');
      if (await generateButton.isVisible()) {
        await generateButton.click();
        
        const confirmButton = page.locator('button').filter({ hasText: /Confirm|Generate|Yes/i }).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      }
      
      await context.close();
    });

    test('5.2 Supplier PM signs milestone certificate', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/milestones');
      
      const milestoneRefLink = page.locator(`[data-testid^="milestone-ref-"]`).filter({ hasText: TEST_DATA.milestone.ref });
      await milestoneRefLink.click();
      
      await expect(page.locator('[data-testid="milestone-detail-ref"]')).toBeVisible({ timeout: 15000 });
      
      const certSection = page.locator('[data-testid="milestone-certificate-section"]');
      await certSection.scrollIntoViewIfNeeded();
      
      const supplierSignButton = certSection.locator('button').filter({ hasText: /Sign.*Supplier/i }).first();
      if (await supplierSignButton.isVisible()) {
        await supplierSignButton.click();
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      }
      
      await context.close();
    });

    test('5.3 Customer PM signs milestone certificate (completing dual signature)', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.customer_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/milestones');
      
      const milestoneRefLink = page.locator(`[data-testid^="milestone-ref-"]`).filter({ hasText: TEST_DATA.milestone.ref });
      await milestoneRefLink.click();
      
      await expect(page.locator('[data-testid="milestone-detail-ref"]')).toBeVisible({ timeout: 15000 });
      
      const certSection = page.locator('[data-testid="milestone-certificate-section"]');
      await certSection.scrollIntoViewIfNeeded();
      
      const customerSignButton = certSection.locator('button').filter({ hasText: /Sign.*Customer/i }).first();
      if (await customerSignButton.isVisible()) {
        await customerSignButton.click();
        await expect(page.locator('[data-testid="toast-success"]').first()).toBeVisible({ timeout: 10000 });
      }
      
      await page.waitForTimeout(1000);
      const certStatus = page.locator('[data-testid="milestone-certificate-status"]');
      await expect(certStatus).toContainText(/Signed|Complete|Ready.*Bill/i);
      
      await context.close();
    });
  });

  // ============================================
  // PHASE 6: BILLING VERIFICATION
  // ============================================

  test.describe('Phase 6: Billing Impact Verification', () => {
    
    test('6.1 Verify completed milestone appears in billing page', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/billing');
      await expect(page.locator('[data-testid="billing-page"]')).toBeVisible({ timeout: 15000 });
      
      const billingContent = page.locator('[data-testid="billing-page"]');
      await expect(billingContent).toContainText(TEST_DATA.milestone.ref);
      await expect(billingContent).toContainText(/50,000|50000/);
      
      await context.close();
    });

    test('6.2 Verify milestone status shows as Completed', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/milestones');
      
      const milestoneRow = page.locator(`[data-testid^="milestone-row-"]`).filter({ hasText: TEST_DATA.milestone.ref });
      await expect(milestoneRow).toBeVisible({ timeout: 15000 });
      
      const statusCell = milestoneRow.locator('[data-testid^="milestone-status-"]');
      await expect(statusCell).toContainText(/Complete|Delivered/i);
      
      await context.close();
    });

    test('6.3 Verify milestone detail shows 100% progress', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/milestones');
      
      const milestoneRefLink = page.locator(`[data-testid^="milestone-ref-"]`).filter({ hasText: TEST_DATA.milestone.ref });
      await milestoneRefLink.click();
      
      await expect(page.locator('[data-testid="milestone-detail-ref"]')).toBeVisible({ timeout: 15000 });
      
      const progressPercent = page.locator('[data-testid="milestone-progress-percent"]');
      await expect(progressPercent).toContainText('100%');
      
      await context.close();
    });

    test('6.4 Verify all deliverables show as Delivered', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/deliverables');
      
      const milestoneFilter = page.locator('[data-testid="deliverables-filter-milestone"]');
      await milestoneFilter.waitFor({ state: 'visible' });
      
      const options = await milestoneFilter.locator('option').allTextContents();
      const milestoneOption = options.find(opt => opt.includes(TEST_DATA.milestone.ref));
      if (milestoneOption) {
        await milestoneFilter.selectOption({ label: milestoneOption });
      }
      
      await page.waitForTimeout(1000);
      
      for (const del of TEST_DATA.deliverables) {
        const delRow = page.locator(`[data-testid^="deliverable-row-"]`).filter({ hasText: del.ref });
        await expect(delRow).toBeVisible({ timeout: 10000 });
        
        const statusCell = delRow.locator('[data-testid^="deliverable-status-"]');
        await expect(statusCell).toContainText(/Delivered/i);
      }
      
      await context.close();
    });

    test('6.5 Verify timesheets are recorded against milestone', async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_PATHS.supplier_pm });
      const page = await context.newPage();
      
      await navigateToPage(page, '/timesheets');
      
      const timesheetsTable = page.locator('[data-testid="timesheets-table"]');
      await expect(timesheetsTable).toBeVisible({ timeout: 15000 });
      
      await expect(timesheetsTable).toContainText(TEST_DATA.timesheets[0].description);
      
      await context.close();
    });
  });
});
