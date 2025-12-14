/**
 * COMPREHENSIVE WORKFLOW TESTS
 * Location: e2e/workflows/complete-workflows.spec.js
 * 
 * End-to-end business workflows using data-testid selectors.
 * 
 * @version 2.0 - Rewritten with testing contract
 * @updated 14 December 2025
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady, expectVisible } from '../test-utils';

const TEST_ID = Date.now().toString().slice(-6);

async function navigateTo(page, path) {
  await page.goto(path);
  await waitForPageReady(page);
}

// ============================================
// TIMESHEET WORKFLOW
// ============================================

test.describe('Timesheet Workflow @workflow @critical', () => {
  test.describe.configure({ mode: 'serial' });
  
  test('1. Contributor can open timesheet form', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    await navigateTo(page, '/timesheets');
    
    await expectVisible(page, 'add-timesheet-button');
    await page.click('[data-testid="add-timesheet-button"]');
    await expectVisible(page, 'timesheet-form');
    
    await context.close();
  });

  test('2. Admin can view timesheets', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' });
    const page = await context.newPage();
    await navigateTo(page, '/timesheets');
    
    await expectVisible(page, 'timesheets-page');
    await expectVisible(page, 'timesheets-table');
    
    await context.close();
  });
});

// ============================================
// EXPENSE WORKFLOW
// ============================================

test.describe('Expense Workflow @workflow', () => {
  test('1. Contributor can open expense form', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    await navigateTo(page, '/expenses');
    
    await expectVisible(page, 'add-expense-button');
    await page.click('[data-testid="add-expense-button"]');
    await expectVisible(page, 'expenses-add-form');
    
    await context.close();
  });

  test('2. Admin can view expenses', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' });
    const page = await context.newPage();
    await navigateTo(page, '/expenses');
    
    await expectVisible(page, 'expenses-page');
    
    await context.close();
  });
});

// ============================================
// MILESTONE WORKFLOW
// ============================================

test.describe('Milestone Workflow @workflow', () => {
  test('1. Supplier PM can open milestone form', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/supplier_pm.json' });
    const page = await context.newPage();
    await navigateTo(page, '/milestones');
    
    await expectVisible(page, 'add-milestone-button');
    await page.click('[data-testid="add-milestone-button"]');
    await expectVisible(page, 'milestones-add-form');
    
    await context.close();
  });

  test('2. Admin can view milestones', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/admin.json' });
    const page = await context.newPage();
    await navigateTo(page, '/milestones');
    
    await expectVisible(page, 'milestones-page');
    
    await context.close();
  });
});

// ============================================
// DELIVERABLE WORKFLOW
// ============================================

test.describe('Deliverable Workflow @workflow', () => {
  test('1. Contributor can open deliverable form', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/contributor.json' });
    const page = await context.newPage();
    await navigateTo(page, '/deliverables');
    
    await expectVisible(page, 'add-deliverable-button');
    await page.click('[data-testid="add-deliverable-button"]');
    await expectVisible(page, 'deliverables-add-form');
    
    await context.close();
  });

  test('2. Customer PM can view deliverables', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    await navigateTo(page, '/deliverables');
    
    await expectVisible(page, 'deliverables-page');
    await expectVisible(page, 'add-deliverable-button');
    
    await context.close();
  });
});

// ============================================
// VARIATION WORKFLOW
// ============================================

test.describe('Variation Workflow @workflow', () => {
  test('1. Supplier PM can see create variation button', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/supplier_pm.json' });
    const page = await context.newPage();
    await navigateTo(page, '/variations');
    
    await expectVisible(page, 'variations-page');
    await expectVisible(page, 'create-variation-button');
    
    await context.close();
  });

  test('2. Customer PM cannot create variations', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    await navigateTo(page, '/variations');
    
    await expectVisible(page, 'variations-page');
    await expect(page.locator('[data-testid="create-variation-button"]')).not.toBeVisible();
    
    await context.close();
  });
});

// ============================================
// RESOURCES WORKFLOW
// ============================================

test.describe('Resources Workflow @workflow', () => {
  test('1. Supplier PM can see cost columns', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/supplier_pm.json' });
    const page = await context.newPage();
    await navigateTo(page, '/resources');
    
    await expectVisible(page, 'resources-page');
    await expectVisible(page, 'resources-cost-rate-header');
    await expectVisible(page, 'resources-margin-header');
    
    await context.close();
  });

  test('2. Customer PM cannot see cost columns', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    await navigateTo(page, '/resources');
    
    await expectVisible(page, 'resources-page');
    await expect(page.locator('[data-testid="resources-cost-rate-header"]')).not.toBeVisible();
    
    await context.close();
  });
});

// ============================================
// SETTINGS WORKFLOW
// ============================================

test.describe('Settings Workflow @workflow', () => {
  test('1. Supplier PM can access settings', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/supplier_pm.json' });
    const page = await context.newPage();
    await navigateTo(page, '/settings');
    
    await expectVisible(page, 'settings-page');
    await expectVisible(page, 'settings-save-button');
    
    await context.close();
  });

  test('2. Customer PM is redirected from settings', async ({ browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/customer_pm.json' });
    const page = await context.newPage();
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/.*dashboard/);
    
    await context.close();
  });
});
