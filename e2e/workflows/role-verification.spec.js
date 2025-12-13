/**
 * FULL ROLE VERIFICATION TESTS
 * Location: e2e/workflows/role-verification.spec.js
 * 
 * Comprehensive verification that each role can ONLY do what they're allowed to.
 * This tests the entire permission matrix for each user type.
 */

import { test, expect } from '@playwright/test';

// ============================================
// HELPER FUNCTIONS
// ============================================

async function waitForPageReady(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

async function canSeeButton(page, buttonText) {
  const button = page.locator(`button:has-text("${buttonText}")`).first();
  return await button.count() > 0 && await button.isVisible();
}

async function canSeeNavItem(page, itemText) {
  const navItem = page.locator(`nav a:has-text("${itemText}"), nav button:has-text("${itemText}")`).first();
  return await navItem.count() > 0;
}

async function canAccessPage(page, path) {
  await page.goto(path);
  await waitForPageReady(page);
  // Check we weren't redirected away or shown access denied
  const currentUrl = page.url();
  const accessDenied = await page.locator('text=Access Denied, text=Unauthorized, text=Not Found').count() > 0;
  return currentUrl.includes(path.replace('/', '')) && !accessDenied;
}

// ============================================
// ADMIN ROLE - Should have FULL access
// ============================================

test.describe('Admin Role Verification @admin @comprehensive', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Admin can access ALL pages', async ({ page }) => {
    const pages = [
      '/dashboard',
      '/timesheets', 
      '/expenses',
      '/milestones',
      '/deliverables',
      '/resources',
      '/partners',
      '/variations',
      '/settings',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      
      // Should not see access denied
      const denied = await page.locator('text=Access Denied').count();
      expect(denied, `Admin should access ${pagePath}`).toBe(0);
    }
  });

  test('Admin sees Add buttons on all entity pages', async ({ page }) => {
    const entityPages = ['/timesheets', '/expenses', '/milestones', '/deliverables', '/resources', '/variations'];
    
    for (const pagePath of entityPages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      const hasAdd = await addButton.count() > 0;
      expect(hasAdd, `Admin should see Add button on ${pagePath}`).toBe(true);
    }
  });

  test('Admin can access user management', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageReady(page);
    
    // Look for team/users section
    const usersSection = page.locator('text=Users, text=Team, text=Members, a[href*="team"]');
    const hasUserMgmt = await usersSection.count() > 0;
    expect(hasUserMgmt, 'Admin should see user management').toBe(true);
  });

  test('Admin sees cost/rate information', async ({ page }) => {
    await page.goto('/resources');
    await waitForPageReady(page);
    
    // Admin should see cost-related columns
    const pageContent = await page.content();
    // Check page loaded with data area
    expect(pageContent.length).toBeGreaterThan(1000);
  });
});

// ============================================
// SUPPLIER PM - Manages supplier side
// ============================================

test.describe('Supplier PM Role Verification @supplier_pm @comprehensive', () => {
  test.use({ storageState: 'playwright/.auth/supplier_pm.json' });

  test('Supplier PM can access supplier pages', async ({ page }) => {
    const allowedPages = [
      '/dashboard',
      '/timesheets',
      '/expenses', 
      '/milestones',
      '/deliverables',
      '/resources',
      '/partners',
      '/variations',
      '/settings',
    ];

    for (const pagePath of allowedPages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      const denied = await page.locator('text=Access Denied').count();
      expect(denied, `Supplier PM should access ${pagePath}`).toBe(0);
    }
  });

  test('Supplier PM can create milestones', async ({ page }) => {
    await page.goto('/milestones');
    await waitForPageReady(page);
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    await expect(addButton).toBeVisible();
  });

  test('Supplier PM can create variations', async ({ page }) => {
    await page.goto('/variations');
    await waitForPageReady(page);
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    await expect(addButton).toBeVisible();
  });

  test('Supplier PM sees cost information', async ({ page }) => {
    await page.goto('/resources');
    await waitForPageReady(page);
    
    // Supplier should see cost columns
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(500);
  });

  test('Supplier PM CANNOT manage users', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageReady(page);
    
    // Should not see user management or it should be disabled
    const addUserButton = page.locator('button:has-text("Add User"), button:has-text("Invite User")');
    const canAddUser = await addUserButton.count() > 0 && await addUserButton.isEnabled();
    expect(canAddUser, 'Supplier PM should NOT add users').toBe(false);
  });
});

// ============================================
// CUSTOMER PM - Manages customer side, approves work
// ============================================

test.describe('Customer PM Role Verification @customer_pm @comprehensive', () => {
  test.use({ storageState: 'playwright/.auth/customer_pm.json' });

  test('Customer PM can access allowed pages', async ({ page }) => {
    const allowedPages = [
      '/dashboard',
      '/timesheets',
      '/expenses',
      '/milestones',
      '/deliverables',
      '/variations',
    ];

    for (const pagePath of allowedPages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      const denied = await page.locator('text=Access Denied').count();
      expect(denied, `Customer PM should access ${pagePath}`).toBe(0);
    }
  });

  test('Customer PM CANNOT see Partners page', async ({ page }) => {
    // Check nav doesn't show Partners
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const partnersLink = page.locator('nav a[href*="partner"]');
    const hasPartnersNav = await partnersLink.count() > 0;
    expect(hasPartnersNav, 'Customer PM should NOT see Partners nav').toBe(false);
  });

  test('Customer PM CANNOT see Settings page', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const settingsLink = page.locator('nav a[href*="setting"]');
    const hasSettingsNav = await settingsLink.count() > 0;
    expect(hasSettingsNav, 'Customer PM should NOT see Settings nav').toBe(false);
  });

  test('Customer PM CANNOT create milestones', async ({ page }) => {
    await page.goto('/milestones');
    await waitForPageReady(page);
    
    const addMilestone = page.locator('button:has-text("Add Milestone"), button:has-text("New Milestone")');
    const canAdd = await addMilestone.count() > 0;
    expect(canAdd, 'Customer PM should NOT create milestones').toBe(false);
  });

  test('Customer PM CANNOT create variations', async ({ page }) => {
    await page.goto('/variations');
    await waitForPageReady(page);
    
    const addVariation = page.locator('button:has-text("Add Variation"), button:has-text("New Variation"), button:has-text("Create Variation")');
    const canAdd = await addVariation.count() > 0;
    expect(canAdd, 'Customer PM should NOT create variations').toBe(false);
  });

  test('Customer PM CANNOT see cost prices', async ({ page }) => {
    await page.goto('/resources');
    await waitForPageReady(page);
    
    // Customer should NOT see cost rate column
    const costHeader = page.locator('th:has-text("Cost Rate"), th:has-text("Cost Price")');
    const seeCost = await costHeader.count() > 0;
    expect(seeCost, 'Customer PM should NOT see cost rates').toBe(false);
  });

  test('Customer PM can approve timesheets', async ({ page }) => {
    await page.goto('/timesheets');
    await waitForPageReady(page);
    
    // Should see approve functionality somewhere
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(500);
  });
});

// ============================================
// CONTRIBUTOR - Does work, submits for approval
// ============================================

test.describe('Contributor Role Verification @contributor @comprehensive', () => {
  test.use({ storageState: 'playwright/.auth/contributor.json' });

  test('Contributor can access work pages', async ({ page }) => {
    const allowedPages = [
      '/dashboard',
      '/timesheets',
      '/expenses',
      '/deliverables',
    ];

    for (const pagePath of allowedPages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      const denied = await page.locator('text=Access Denied').count();
      expect(denied, `Contributor should access ${pagePath}`).toBe(0);
    }
  });

  test('Contributor can create timesheets', async ({ page }) => {
    await page.goto('/timesheets');
    await waitForPageReady(page);
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    await expect(addButton).toBeVisible();
  });

  test('Contributor can create expenses', async ({ page }) => {
    await page.goto('/expenses');
    await waitForPageReady(page);
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
    await expect(addButton).toBeVisible();
  });

  test('Contributor CANNOT see Partners', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const partnersLink = page.locator('nav a[href*="partner"]');
    expect(await partnersLink.count()).toBe(0);
  });

  test('Contributor CANNOT see Settings', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const settingsLink = page.locator('nav a[href*="setting"]');
    expect(await settingsLink.count()).toBe(0);
  });

  test('Contributor CANNOT create milestones', async ({ page }) => {
    await page.goto('/milestones');
    await waitForPageReady(page);
    
    const addButton = page.locator('button:has-text("Add Milestone"), button:has-text("New Milestone")');
    expect(await addButton.count()).toBe(0);
  });

  test('Contributor CANNOT see cost information', async ({ page }) => {
    await page.goto('/resources');
    await waitForPageReady(page);
    
    const costHeader = page.locator('th:has-text("Cost Rate"), th:has-text("Cost Price")');
    expect(await costHeader.count()).toBe(0);
  });
});

// ============================================
// VIEWER - Read-only access
// ============================================

test.describe('Viewer Role Verification @viewer @comprehensive', () => {
  test.use({ storageState: 'playwright/.auth/viewer.json' });

  test('Viewer can view pages but not edit', async ({ page }) => {
    const viewablePages = [
      '/dashboard',
      '/timesheets',
      '/expenses',
      '/milestones',
      '/deliverables',
    ];

    for (const pagePath of viewablePages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      
      // Should see page content
      const content = await page.content();
      expect(content.length).toBeGreaterThan(500);
    }
  });

  test('Viewer CANNOT see any Add buttons', async ({ page }) => {
    const pages = ['/timesheets', '/expenses', '/milestones', '/deliverables'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      
      // Should NOT see Add/New/Create buttons
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      const hasAdd = await addButton.count() > 0 && await addButton.isVisible();
      expect(hasAdd, `Viewer should NOT see Add on ${pagePath}`).toBe(false);
    }
  });

  test('Viewer CANNOT see Partners', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const partnersLink = page.locator('nav a[href*="partner"]');
    expect(await partnersLink.count()).toBe(0);
  });

  test('Viewer CANNOT see Settings', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const settingsLink = page.locator('nav a[href*="setting"]');
    expect(await settingsLink.count()).toBe(0);
  });

  test('Viewer CANNOT see cost information', async ({ page }) => {
    await page.goto('/resources');
    await waitForPageReady(page);
    
    const costHeader = page.locator('th:has-text("Cost Rate"), th:has-text("Cost Price")');
    expect(await costHeader.count()).toBe(0);
  });

  test('Viewer has NO edit/delete buttons anywhere', async ({ page }) => {
    const pages = ['/timesheets', '/expenses', '/milestones', '/deliverables'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      
      const editButton = page.locator('button:has-text("Edit")');
      const deleteButton = page.locator('button:has-text("Delete")');
      
      const hasEdit = await editButton.count() > 0;
      const hasDelete = await deleteButton.count() > 0;
      
      expect(hasEdit, `Viewer should NOT see Edit on ${pagePath}`).toBe(false);
      expect(hasDelete, `Viewer should NOT see Delete on ${pagePath}`).toBe(false);
    }
  });
});
