// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration - Cloud-Based Testing
 * 
 * This configuration is optimized for running tests against deployed environments:
 * - Vercel Preview URLs (PRs)
 * - Staging environment
 * - Production environment
 * 
 * Usage:
 *   PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npm run e2e
 *   npm run e2e -- --project=admin
 *   npm run e2e -- --grep="@smoke"
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

const isCI = !!process.env.CI;

// Determine base URL
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 
  (isCI ? 'http://localhost:4173' : 'http://localhost:5173');

// Vercel deployment protection bypass
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  // Directory containing test files
  testDir: './e2e',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: isCI,
  
  // Retry configuration
  retries: isCI ? 2 : 0,
  
  // Limit workers on CI to prevent resource exhaustion
  workers: isCI ? 2 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ...(isCI ? [['github']] : []),
  ],
  
  // Global timeout (longer for cloud testing)
  timeout: isCI ? 60000 : 30000,
  expect: {
    timeout: isCI ? 10000 : 5000,
  },
  
  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL,
    
    // Collect trace on failure
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'on-first-retry',
    
    // Navigation timeout
    navigationTimeout: isCI ? 30000 : 15000,
    
    // Action timeout
    actionTimeout: isCI ? 15000 : 10000,
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors (useful for preview URLs)
    ignoreHTTPSErrors: true,
    
    // Extra HTTP headers - includes Vercel bypass if configured
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      ...(vercelBypassSecret ? { 'x-vercel-protection-bypass': vercelBypassSecret } : {}),
    },
  },

  // Configure projects
  projects: [
    // ============================================
    // AUTHENTICATION SETUP (runs first)
    // ============================================
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      use: {
        // Longer timeout for auth setup
        navigationTimeout: 30000,
      },
    },

    // ============================================
    // ROLE-SPECIFIC PROJECTS
    // ============================================
    {
      name: 'admin',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'supplier-pm',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/supplier_pm.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'supplier-finance',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/supplier_finance.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'customer-pm',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/customer_pm.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'customer-finance',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/customer_finance.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'contributor',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/contributor.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'viewer',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/viewer.json',
      },
      dependencies: ['setup'],
    },

    // ============================================
    // BROWSER-SPECIFIC PROJECTS
    // ============================================
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    // ============================================
    // MOBILE TESTING
    // ============================================
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],

  // ============================================
  // LOCAL DEV SERVER (only when not testing against cloud)
  // ============================================
  ...(process.env.PLAYWRIGHT_BASE_URL ? {} : {
    webServer: {
      command: isCI ? 'npm run preview' : 'npm run dev',
      url: isCI ? 'http://localhost:4173' : 'http://localhost:5173',
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  }),

  // Output directory for test artifacts
  outputDir: 'test-results/',
  
  // Global setup/teardown
  // globalSetup: './e2e/global-setup.js',
  // globalTeardown: './e2e/global-teardown.js',
});
