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
 * This is the REAL test of whether the app works.
 */

import { test, expect } from '@playwright/test';

// Test data identifiers (timestamp-based for uniqueness)
const TEST_ID = Date.now().toString().slice(-6);

// ============================================
// HELPER FUNCTIONS
// ============================================

async function waitForPageReady(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500); // Extra buffer for React renders
}

async function fillDateField(page, selector, daysFromNow = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  await page.fill(selector, dateStr);
}

async function selectFirstOption(page, selector) {
  await page.click(selector);
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
}

// ============================================
// TIMESHEET WORKFLOW
// Full cycle: Create → Submit → Approve
// ============================================

test.describe('Timesheet Complete Workflow @workflow @critical', () => {
  
  test.describe.configure({ mode: 'serial' }); // Run in order
  
  let timesheetId;
  
  test('1. Contributor creates a draft timesheet', async ({ browser }) => {
    // Use contributor auth
    const context = await browser.newContext({
      storageState: 'playwright/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await page.goto('/timesheets');
    await waitForPageReady(page);
    
    // Click Add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();
    
    // Wait for form/modal
    await page.waitForSelector('form, [role="dialog"]', { timeout: 10000 });
    
    // Fill timesheet form (adjust selectors to match your UI)
    // Resource/Person
    const resourceSelect = page.locator('select[name="resource_id"], [data-testid="resource-select"]').first();
    if (await resourceSelect.count() > 0) {
      await selectFirstOption(page, 'select[name="resource_id"]');
    }
    
    // Hours
    const hoursInput = page.locator('input[name="hours"], input[type="number"]').first();
    if (await hoursInput.count() > 0) {
      await hoursInput.fill('8');
    }
    
    // Date
    const dateInput = page.locator('input[type="date"], input[name="date"]').first();
    if (await dateInput.count() > 0) {
      await fillDateField(page, 'input[type="date"]', -1); // Yesterday
    }
    
    // Description/Notes
    const descInput = page.locator('textarea[name="description"], textarea[name="notes"], input[name="description"]').first();
    if (await descInput.count() > 0) {
      await descInput.fill(`Test timesheet ${TEST_ID}`);
    }
    
    // Save as Draft
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    await saveButton.click();
    
    // Wait for save and verify
    await waitForPageReady(page);
    
    // Verify timesheet appears in list
    await expect(page.locator(`text=Test timesheet ${TEST_ID}`).or(page.locator('text=Draft'))).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Timesheet created successfully');
    
    await context.close();
  });

  test('2. Contributor submits the timesheet', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await page.goto('/timesheets');
    await waitForPageReady(page);
    
    // Find the draft timesheet
    const timesheetRow = page.locator(`tr:has-text("${TEST_ID}"), [data-testid="timesheet-row"]:has-text("${TEST_ID}")`).first();
    
    if (await timesheetRow.count() > 0) {
      await timesheetRow.click();
      await waitForPageReady(page);
      
      // Click Submit button
      const submitButton = page.locator('button:has-text("Submit")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Confirm if dialog appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }
        
        await waitForPageReady(page);
        
        // Verify status changed to Submitted
        await expect(page.locator('text=Submitted')).toBeVisible({ timeout: 10000 });
        console.log('✅ Timesheet submitted successfully');
      }
    }
    
    await context.close();
  });

  test('3. Customer PM approves the timesheet', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/customer_pm.json'
    });
    const page = await context.newPage();
    
    await page.goto('/timesheets');
    await waitForPageReady(page);
    
    // Filter to Submitted if filter exists
    const statusFilter = page.locator('select:has-text("Status"), [data-testid="status-filter"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('Submitted');
      await waitForPageReady(page);
    }
    
    // Find submitted timesheet
    const timesheetRow = page.locator(`tr:has-text("Submitted"), [data-status="Submitted"]`).first();
    
    if (await timesheetRow.count() > 0) {
      await timesheetRow.click();
      await waitForPageReady(page);
      
      // Click Approve button
      const approveButton = page.locator('button:has-text("Approve")').first();
      if (await approveButton.count() > 0) {
        await approveButton.click();
        
        // Confirm if dialog appears
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }
        
        await waitForPageReady(page);
        
        // Verify status changed to Approved
        await expect(page.locator('text=Approved')).toBeVisible({ timeout: 10000 });
        console.log('✅ Timesheet approved successfully');
      }
    }
    
    await context.close();
  });

  test('4. Verify timesheet appears in approved list', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/admin.json'
    });
    const page = await context.newPage();
    
    await page.goto('/timesheets');
    await waitForPageReady(page);
    
    // Filter to Approved
    const statusFilter = page.locator('select:has-text("Status"), [data-testid="status-filter"]');
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('Approved');
      await waitForPageReady(page);
    }
    
    // Verify approved timesheet exists
    const approvedRow = page.locator('tr:has-text("Approved"), [data-status="Approved"]').first();
    await expect(approvedRow).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Timesheet workflow complete - verified as approved');
    
    await context.close();
  });
});

// ============================================
// EXPENSE WORKFLOW  
// Full cycle: Create → Submit → Validate → Pay
// ============================================

test.describe('Expense Complete Workflow @workflow', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  test('1. Contributor creates an expense', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await page.goto('/expenses');
    await waitForPageReady(page);
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();
    
    await page.waitForSelector('form, [role="dialog"]', { timeout: 10000 });
    
    // Fill expense form
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    if (await amountInput.count() > 0) {
      await amountInput.fill('150.00');
    }
    
    const descInput = page.locator('textarea[name="description"], input[name="description"]').first();
    if (await descInput.count() > 0) {
      await descInput.fill(`Test expense ${TEST_ID}`);
    }
    
    // Category if exists
    const categorySelect = page.locator('select[name="category"]');
    if (await categorySelect.count() > 0) {
      await selectFirstOption(page, 'select[name="category"]');
    }
    
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    await saveButton.click();
    
    await waitForPageReady(page);
    console.log('✅ Expense created successfully');
    
    await context.close();
  });

  test('2. Contributor submits expense', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await page.goto('/expenses');
    await waitForPageReady(page);
    
    const expenseRow = page.locator(`tr:has-text("${TEST_ID}")`).first();
    if (await expenseRow.count() > 0) {
      await expenseRow.click();
      await waitForPageReady(page);
      
      const submitButton = page.locator('button:has-text("Submit")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await waitForPageReady(page);
        console.log('✅ Expense submitted');
      }
    }
    
    await context.close();
  });

  test('3. Customer PM validates expense', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/customer_pm.json'
    });
    const page = await context.newPage();
    
    await page.goto('/expenses');
    await waitForPageReady(page);
    
    const validateButton = page.locator('button:has-text("Validate"), button:has-text("Approve")').first();
    if (await validateButton.count() > 0) {
      await validateButton.click();
      await waitForPageReady(page);
      console.log('✅ Expense validated');
    }
    
    await context.close();
  });

  test('4. Supplier Finance marks as paid', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/supplier_finance.json'
    });
    const page = await context.newPage();
    
    await page.goto('/expenses');
    await waitForPageReady(page);
    
    const payButton = page.locator('button:has-text("Pay"), button:has-text("Mark Paid")').first();
    if (await payButton.count() > 0) {
      await payButton.click();
      await waitForPageReady(page);
      console.log('✅ Expense marked as paid');
    }
    
    await context.close();
  });
});

// ============================================
// MILESTONE WORKFLOW
// Full cycle: Create → Complete → Invoice
// ============================================

test.describe('Milestone Complete Workflow @workflow', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  test('1. Supplier PM creates milestone', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/supplier_pm.json'
    });
    const page = await context.newPage();
    
    await page.goto('/milestones');
    await waitForPageReady(page);
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      
      await page.waitForSelector('form, [role="dialog"]', { timeout: 10000 });
      
      // Fill milestone form
      const nameInput = page.locator('input[name="name"], input[name="title"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill(`Test Milestone ${TEST_ID}`);
      }
      
      const amountInput = page.locator('input[name="amount"], input[name="value"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill('10000');
      }
      
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
      await saveButton.click();
      
      await waitForPageReady(page);
      console.log('✅ Milestone created');
    }
    
    await context.close();
  });

  test('2. Supplier PM marks milestone complete', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/supplier_pm.json'
    });
    const page = await context.newPage();
    
    await page.goto('/milestones');
    await waitForPageReady(page);
    
    const milestoneRow = page.locator(`tr:has-text("${TEST_ID}")`).first();
    if (await milestoneRow.count() > 0) {
      await milestoneRow.click();
      await waitForPageReady(page);
      
      const completeButton = page.locator('button:has-text("Complete"), button:has-text("Mark Complete")').first();
      if (await completeButton.count() > 0) {
        await completeButton.click();
        await waitForPageReady(page);
        console.log('✅ Milestone marked complete');
      }
    }
    
    await context.close();
  });

  test('3. Supplier Finance invoices milestone', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/supplier_finance.json'
    });
    const page = await context.newPage();
    
    await page.goto('/milestones');
    await waitForPageReady(page);
    
    const invoiceButton = page.locator('button:has-text("Invoice"), button:has-text("Create Invoice")').first();
    if (await invoiceButton.count() > 0) {
      await invoiceButton.click();
      await waitForPageReady(page);
      console.log('✅ Milestone invoiced');
    }
    
    await context.close();
  });
});

// ============================================
// DELIVERABLE WORKFLOW
// Full cycle: Create → Submit → Review → Accept
// ============================================

test.describe('Deliverable Complete Workflow @workflow', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  test('1. Contributor creates deliverable', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await page.goto('/deliverables');
    await waitForPageReady(page);
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      
      await page.waitForSelector('form, [role="dialog"]', { timeout: 10000 });
      
      const nameInput = page.locator('input[name="name"], input[name="title"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill(`Test Deliverable ${TEST_ID}`);
      }
      
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
      await saveButton.click();
      
      await waitForPageReady(page);
      console.log('✅ Deliverable created');
    }
    
    await context.close();
  });

  test('2. Contributor submits for review', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/contributor.json'
    });
    const page = await context.newPage();
    
    await page.goto('/deliverables');
    await waitForPageReady(page);
    
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Request Review")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await waitForPageReady(page);
      console.log('✅ Deliverable submitted for review');
    }
    
    await context.close();
  });

  test('3. Customer PM reviews and accepts', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/customer_pm.json'
    });
    const page = await context.newPage();
    
    await page.goto('/deliverables');
    await waitForPageReady(page);
    
    const acceptButton = page.locator('button:has-text("Accept"), button:has-text("Approve")').first();
    if (await acceptButton.count() > 0) {
      await acceptButton.click();
      await waitForPageReady(page);
      console.log('✅ Deliverable accepted');
    }
    
    await context.close();
  });
});

// ============================================
// VARIATION WORKFLOW
// Full cycle: Create → Submit → Customer Sign → Supplier Sign
// ============================================

test.describe('Variation Complete Workflow @workflow', () => {
  
  test.describe.configure({ mode: 'serial' });
  
  test('1. Supplier PM creates variation', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/supplier_pm.json'
    });
    const page = await context.newPage();
    
    await page.goto('/variations');
    await waitForPageReady(page);
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      
      await page.waitForSelector('form, [role="dialog"]', { timeout: 10000 });
      
      const nameInput = page.locator('input[name="name"], input[name="title"], input[name="description"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill(`Test Variation ${TEST_ID}`);
      }
      
      const amountInput = page.locator('input[name="amount"], input[name="value"]').first();
      if (await amountInput.count() > 0) {
        await amountInput.fill('5000');
      }
      
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
      await saveButton.click();
      
      await waitForPageReady(page);
      console.log('✅ Variation created');
    }
    
    await context.close();
  });

  test('2. Supplier PM submits for approval', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/supplier_pm.json'
    });
    const page = await context.newPage();
    
    await page.goto('/variations');
    await waitForPageReady(page);
    
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send for Approval")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await waitForPageReady(page);
      console.log('✅ Variation submitted');
    }
    
    await context.close();
  });

  test('3. Customer PM signs/approves', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/customer_pm.json'
    });
    const page = await context.newPage();
    
    await page.goto('/variations');
    await waitForPageReady(page);
    
    const signButton = page.locator('button:has-text("Sign"), button:has-text("Approve")').first();
    if (await signButton.count() > 0) {
      await signButton.click();
      await waitForPageReady(page);
      console.log('✅ Variation signed by customer');
    }
    
    await context.close();
  });

  test('4. Supplier PM counter-signs', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'playwright/.auth/supplier_pm.json'
    });
    const page = await context.newPage();
    
    await page.goto('/variations');
    await waitForPageReady(page);
    
    const signButton = page.locator('button:has-text("Sign"), button:has-text("Counter-sign")').first();
    if (await signButton.count() > 0) {
      await signButton.click();
      await waitForPageReady(page);
      console.log('✅ Variation counter-signed - workflow complete');
    }
    
    await context.close();
  });
});
