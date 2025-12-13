/**
 * Playwright Multi-User Auth Setup
 * Location: e2e/auth.setup.js
 * 
 * Creates authentication state files for ALL 7 test user roles.
 * Each role gets its own auth state file in playwright/.auth/
 * 
 * This enables:
 * - Role-specific Playwright projects (--project=admin, --project=viewer, etc.)
 * - Role switching within tests using browser.newContext()
 * - True permission testing (not just "View as:" simulation)
 * 
 * Auth state files created:
 *   playwright/.auth/admin.json
 *   playwright/.auth/supplier_pm.json
 *   playwright/.auth/supplier_finance.json
 *   playwright/.auth/customer_pm.json
 *   playwright/.auth/customer_finance.json
 *   playwright/.auth/contributor.json
 *   playwright/.auth/viewer.json
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test user credentials
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPass123!';

const TEST_USERS = [
  { role: 'admin', email: 'e2e.admin@amsf001.test' },
  { role: 'supplier_pm', email: 'e2e.supplier.pm@amsf001.test' },
  { role: 'supplier_finance', email: 'e2e.supplier.finance@amsf001.test' },
  { role: 'customer_pm', email: 'e2e.customer.pm@amsf001.test' },
  { role: 'customer_finance', email: 'e2e.customer.finance@amsf001.test' },
  { role: 'contributor', email: 'e2e.contributor@amsf001.test' },
  { role: 'viewer', email: 'e2e.viewer@amsf001.test' },
];

/**
 * Helper function to perform login and save auth state
 */
async function authenticateUser(page, user, authFile) {
  console.log(`🔐 Authenticating ${user.role} (${user.email})...`);

  // Navigate to login page
  await page.goto('/');
  
  // Wait for login form
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  
  // Fill credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Wait for successful login - dashboard or main content
  await page.waitForURL(/\/(dashboard|workflow-summary|timesheets)/, { timeout: 20000 });
  
  // Additional verification - wait for user menu or content to load
  await page.waitForLoadState('networkidle');
  
  // Save auth state
  await page.context().storageState({ path: authFile });
  
  console.log(`   ✅ Saved auth state to: ${path.basename(authFile)}`);
}

// ============================================
// SETUP TESTS FOR EACH USER
// ============================================

// Admin
setup('authenticate admin', async ({ page }) => {
  const user = TEST_USERS.find(u => u.role === 'admin');
  const authFile = path.join(__dirname, '../playwright/.auth/admin.json');
  await authenticateUser(page, user, authFile);
});

// Supplier PM
setup('authenticate supplier_pm', async ({ page }) => {
  const user = TEST_USERS.find(u => u.role === 'supplier_pm');
  const authFile = path.join(__dirname, '../playwright/.auth/supplier_pm.json');
  await authenticateUser(page, user, authFile);
});

// Supplier Finance
setup('authenticate supplier_finance', async ({ page }) => {
  const user = TEST_USERS.find(u => u.role === 'supplier_finance');
  const authFile = path.join(__dirname, '../playwright/.auth/supplier_finance.json');
  await authenticateUser(page, user, authFile);
});

// Customer PM
setup('authenticate customer_pm', async ({ page }) => {
  const user = TEST_USERS.find(u => u.role === 'customer_pm');
  const authFile = path.join(__dirname, '../playwright/.auth/customer_pm.json');
  await authenticateUser(page, user, authFile);
});

// Customer Finance
setup('authenticate customer_finance', async ({ page }) => {
  const user = TEST_USERS.find(u => u.role === 'customer_finance');
  const authFile = path.join(__dirname, '../playwright/.auth/customer_finance.json');
  await authenticateUser(page, user, authFile);
});

// Contributor
setup('authenticate contributor', async ({ page }) => {
  const user = TEST_USERS.find(u => u.role === 'contributor');
  const authFile = path.join(__dirname, '../playwright/.auth/contributor.json');
  await authenticateUser(page, user, authFile);
});

// Viewer
setup('authenticate viewer', async ({ page }) => {
  const user = TEST_USERS.find(u => u.role === 'viewer');
  const authFile = path.join(__dirname, '../playwright/.auth/viewer.json');
  await authenticateUser(page, user, authFile);
});

// Also create legacy user.json for backward compatibility
setup('authenticate default user', async ({ page }) => {
  const user = TEST_USERS.find(u => u.role === 'admin');
  const authFile = path.join(__dirname, '../playwright/.auth/user.json');
  await authenticateUser(page, user, authFile);
});
