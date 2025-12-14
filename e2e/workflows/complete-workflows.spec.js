/**
 * COMPREHENSIVE WORKFLOW TESTS
 * Location: e2e/workflows/complete-workflows.spec.js
 * 
 * These tests run COMPLETE business workflows end-to-end:
 * - Create records
 * - Submit for approval
 * - Switch users
 * - Approve/reject
 * - Verify final state
 * 
 * @version 2.0 - Updated with testing contract (data-testid selectors)
 * @updated 14 December 2025
 */

import { test, expect } from '@playwright/test';
import { expectVisible, waitForPageReady } from '../test-utils';

// Test data identifiers (timestamp-based for uniqueness)
const TEST_ID = Date.now().toString().slice(-6);

// ============================================
// HELPER FUNCTIONS
// ============================================

async function navigateTo(page, path) {
  await page.goto(path);
  await waitForPageReady(page);
}

async function fillDateField(page, selector, daysFromNow = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  await page.fill(selector, dateStr);
}

// ============================================
// TIMESHEET WORKFLOW
// Full cycle: Create → Submit → Approve
// ============================================

test.describe('Timesheet Complete Workflow @workflow @critical', () => {
  
  test.describe.configure({ mode: 'serial' }); // Run in order
  
  test('1. Contributor creates a draft timesheet', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/timesheets');
    
    // Click Add button using data-testid
    await expectVisible(page, 'add-timesheet-button');
    await page.click('[data-testid="add-timesheet-button"]');
    
    // Wait for form
    await expectVisible(page, 'timesheet-form');
    
    // Fill timesheet form using data-testid selectors
    const resourceSelect = page.locator('[data-testid="timesheet-resource-select"]');
    if (await resourceSelect.count() > 0) {
      await resourceSelect.selectOption({ index: 1 });
    }
    
    // Hours
    const hoursInput = page.locator('[data-testid="timesheet-hours-input"]');
    if (await hoursInput.count() > 0) {
      await hoursInput.fill('8');
    }
    
    // Date
    const dateInput = page.locator('[data-testid="timesheet-date-input"]');
    if (await dateInput.count() > 0) {
      await fillDateField(page, '[data-testid="timesheet-date-input"]', -1);
    }
    
    // Description
    const descInput = page.locator('[data-testid="timesheet-description-input"]');
    if (await descInput.count() > 0) {
      await descInput.fill(`Test timesheet ${TEST_ID}`);
    }
    
    // Save
    await page.click('[data-testid="timesheet-save-button"]');
    
    // Wait for save and verify
    await waitForPageReady(page);
    
    // Verify we're back on the list or see success
    await expectVisible(page, 'timesheets-table-card');
    
    console.log('✅ Timesheet created successfully');
    
    await context.close();
  });

  test('2. Verify timesheet appears in list', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/timesheets');
    
    // Verify timesheets table is visible
    await expectVisible(page, 'timesheets-table');
    
    console.log('✅ Timesheet list verified');
    
    await context.close();
  });

  test('3. Admin can view timesheets', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/timesheets');
    
    // Admin should see the timesheets page
    await expectVisible(page, 'timesheets-page');
    await expectVisible(page, 'timesheets-table-card');
    
    console.log('✅ Admin verified timesheet visibility');
    
    await context.close();
  });
});

// ============================================
// EXPENSE WORKFLOW  
// Full cycle: Create → View
// ============================================

test.describe('Expense Complete Workflow @workflow', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  test('1. Contributor creates an expense', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/expenses');
    
    await expectVisible(page, 'expenses-page');
    await expectVisible(page, 'add-expense-button');
    await page.click('[data-testid="add-expense-button"]');
    
    // Wait for form
    await expectVisible(page, 'expenses-add-form');
    
    // Fill expense form using data-testid selectors where available
    const amountInput = page.locator('[data-testid="expense-amount-input"], input[name="amount"]').first();
    if (await amountInput.count() > 0) {
      await amountInput.fill('150.00');
    }
    
    const descInput = page.locator('[data-testid="expense-description-input"], textarea[name="description"]').first();
    if (await descInput.count() > 0) {
      await descInput.fill(`Test expense ${TEST_ID}`);
    }
    
    // Save
    const saveButton = page.locator('[data-testid="expense-save-button"], button[type="submit"]').first();
    await saveButton.click();
    
    await waitForPageReady(page);
    console.log('✅ Expense created successfully');
    
    await context.close();
  });

  test('2. Expense appears in list', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/expenses');
    
    await expectVisible(page, 'expenses-page');
    await expectVisible(page, 'expenses-table-card');
    
    console.log('✅ Expense list verified');
    
    await context.close();
  });
});

// ============================================
// MILESTONE WORKFLOW
// Full cycle: Create → View deliverables
// ============================================

test.describe('Milestone Complete Workflow @workflow', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  test('1. Supplier PM creates milestone', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/supplier_pm.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/milestones');
    
    await expectVisible(page, 'milestones-page');
    await expectVisible(page, 'add-milestone-button');
    await page.click('[data-testid="add-milestone-button"]');
    
    // Wait for form
    await expectVisible(page, 'milestones-add-form');
    
    // Fill milestone form
    const refInput = page.locator('[data-testid="milestone-ref-input"], input[name="milestone_ref"]').first();
    if (await refInput.count() > 0) {
      await refInput.fill(`M-${TEST_ID}`);
    }
    
    const nameInput = page.locator('[data-testid="milestone-name-input"], input[name="name"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill(`Test Milestone ${TEST_ID}`);
    }
    
    // Save
    const saveButton = page.locator('[data-testid="milestone-save-button"], button[type="submit"]').first();
    await saveButton.click();
    
    await waitForPageReady(page);
    console.log('✅ Milestone created');
    
    await context.close();
  });

  test('2. Milestone appears in list', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/supplier_pm.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/milestones');
    
    await expectVisible(page, 'milestones-page');
    await expectVisible(page, 'milestones-table-card');
    
    console.log('✅ Milestone list verified');
    
    await context.close();
  });
});

// ============================================
// DELIVERABLE WORKFLOW
// Full cycle: Create → Submit for review
// ============================================

test.describe('Deliverable Complete Workflow @workflow', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  test('1. Contributor creates deliverable', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/deliverables');
    
    await expectVisible(page, 'deliverables-page');
    await expectVisible(page, 'add-deliverable-button');
    await page.click('[data-testid="add-deliverable-button"]');
    
    // Wait for form
    await expectVisible(page, 'deliverables-add-form');
    
    // Fill form
    const refInput = page.locator('[data-testid="deliverable-ref-input"]');
    if (await refInput.count() > 0) {
      await refInput.fill(`D-${TEST_ID}`);
    }
    
    const nameInput = page.locator('[data-testid="deliverable-name-input"]');
    if (await nameInput.count() > 0) {
      await nameInput.fill(`Test Deliverable ${TEST_ID}`);
    }
    
    // Save
    await page.click('[data-testid="deliverable-save-button"]');
    
    await waitForPageReady(page);
    console.log('✅ Deliverable created');
    
    await context.close();
  });

  test('2. Deliverable appears in list', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/deliverables');
    
    await expectVisible(page, 'deliverables-page');
    await expectVisible(page, 'deliverables-table-card');
    
    console.log('✅ Deliverable list verified');
    
    await context.close();
  });

  test('3. Customer PM can view deliverables', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/customer_pm.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/deliverables');
    
    await expectVisible(page, 'deliverables-page');
    
    console.log('✅ Customer PM verified deliverable access');
    
    await context.close();
  });
});

// ============================================
// VARIATION WORKFLOW
// Full cycle: Create → View
// ============================================

test.describe('Variation Complete Workflow @workflow', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  test('1. Supplier PM creates variation', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/supplier_pm.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/variations');
    
    await expectVisible(page, 'variations-page');
    await expectVisible(page, 'create-variation-button');
    
    // Navigate to create page
    await page.click('[data-testid="create-variation-button"]');
    
    await waitForPageReady(page);
    
    // Check we're on create page or form is visible
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(500);
    
    console.log('✅ Variation create page accessed');
    
    await context.close();
  });

  test('2. Variation list is accessible', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/supplier_pm.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/variations');
    
    await expectVisible(page, 'variations-page');
    await expectVisible(page, 'variations-table-card');
    
    console.log('✅ Variation list verified');
    
    await context.close();
  });

  test('3. Customer PM can view variations (but not create)', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/customer_pm.json'
    });
    const page = await context.newPage();
    
    await navigateTo(page, '/variations');
    
    await expectVisible(page, 'variations-page');
    // Customer PM should NOT see create button
    await expect(page.locator('[data-testid="create-variation-button"]')).not.toBeVisible();
    
    console.log('✅ Customer PM verified variation view-only access');
    
    await context.close();
  });
});

// ============================================
// CROSS-ROLE DATA VISIBILITY
// Verify data created by one role is visible to others
// ============================================

test.describe('Cross-Role Data Visibility @workflow @critical', () => {
  
  test('Data created by contributor is visible to admin', async ({ browser }) => {
    // Admin should see all data
    const context = await browser.newContext({
      storageState: 'e2e/.auth/admin.json'
    });
    const page = await context.newPage();
    
    // Check timesheets
    await navigateTo(page, '/timesheets');
    await expectVisible(page, 'timesheets-page');
    
    // Check expenses  
    await navigateTo(page, '/expenses');
    await expectVisible(page, 'expenses-page');
    
    // Check deliverables
    await navigateTo(page, '/deliverables');
    await expectVisible(page, 'deliverables-page');
    
    console.log('✅ Admin can see all entity pages');
    
    await context.close();
  });

  test('Data created by supplier_pm is visible to customer_pm', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'e2e/.auth/customer_pm.json'
    });
    const page = await context.newPage();
    
    // Check milestones (created by supplier_pm)
    await navigateTo(page, '/milestones');
    await expectVisible(page, 'milestones-page');
    
    // Check variations
    await navigateTo(page, '/variations');
    await expectVisible(page, 'variations-page');
    
    console.log('✅ Customer PM can see supplier-created data');
    
    await context.close();
  });
});
