/**
 * Test Utilities
 * Provides wrapper components and helper functions for testing
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { ProjectContext } from '../../contexts/ProjectContext';
import { ViewAsContext } from '../../contexts/ViewAsContext';
import { ToastContext } from '../../contexts/ToastContext';

// ============================================
// MOCK DATA FACTORIES
// ============================================

/**
 * Create a mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id-123',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock profile object
 */
export function createMockProfile(overrides = {}) {
  return {
    id: 'test-user-id-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'contributor',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock project object
 */
export function createMockProject(overrides = {}) {
  return {
    id: 'test-project-id-123',
    name: 'Test Project',
    code: 'TEST001',
    status: 'Active',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create a mock timesheet object
 */
export function createMockTimesheet(overrides = {}) {
  return {
    id: 'test-timesheet-id-123',
    project_id: 'test-project-id-123',
    resource_id: 'test-resource-id-123',
    created_by: 'test-user-id-123',
    date: '2024-01-15',
    hours: 8,
    status: 'Draft',
    description: 'Test timesheet entry',
    ...overrides,
  };
}

/**
 * Create a mock expense object
 */
export function createMockExpense(overrides = {}) {
  return {
    id: 'test-expense-id-123',
    project_id: 'test-project-id-123',
    created_by: 'test-user-id-123',
    date: '2024-01-15',
    amount: 100.00,
    status: 'Draft',
    description: 'Test expense',
    category: 'Travel',
    is_chargeable: true,
    ...overrides,
  };
}

/**
 * Create a mock resource object
 */
export function createMockResource(overrides = {}) {
  return {
    id: 'test-resource-id-123',
    project_id: 'test-project-id-123',
    user_id: 'test-user-id-123',
    name: 'Test Resource',
    role: 'Developer',
    sell_rate: 150,
    cost_rate: 100,
    ...overrides,
  };
}

// ============================================
// MOCK CONTEXT PROVIDERS
// ============================================

/**
 * Create mock Auth context value
 */
export function createMockAuthContext(overrides = {}) {
  return {
    user: createMockUser(),
    profile: createMockProfile(),
    role: 'contributor',
    loading: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    ...overrides,
  };
}

/**
 * Create mock Project context value
 */
export function createMockProjectContext(overrides = {}) {
  return {
    currentProject: createMockProject(),
    projects: [createMockProject()],
    projectRole: 'contributor',
    loading: false,
    error: null,
    setCurrentProject: vi.fn(),
    refreshProjects: vi.fn(),
    ...overrides,
  };
}

/**
 * Create mock ViewAs context value
 */
export function createMockViewAsContext(overrides = {}) {
  return {
    effectiveRole: 'contributor',
    actualRole: 'contributor',
    isImpersonating: false,
    setViewAsRole: vi.fn(),
    resetViewAs: vi.fn(),
    ...overrides,
  };
}

/**
 * Create mock Toast context value
 */
export function createMockToastContext(overrides = {}) {
  return {
    showToast: vi.fn(),
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    ...overrides,
  };
}

// ============================================
// TEST WRAPPER COMPONENTS
// ============================================

/**
 * All Providers wrapper for complete integration tests
 */
export function AllProviders({ 
  children,
  authValue = createMockAuthContext(),
  projectValue = createMockProjectContext(),
  viewAsValue = createMockViewAsContext(),
  toastValue = createMockToastContext(),
}) {
  return (
    <BrowserRouter>
      <ToastContext.Provider value={toastValue}>
        <AuthContext.Provider value={authValue}>
          <ProjectContext.Provider value={projectValue}>
            <ViewAsContext.Provider value={viewAsValue}>
              {children}
            </ViewAsContext.Provider>
          </ProjectContext.Provider>
        </AuthContext.Provider>
      </ToastContext.Provider>
    </BrowserRouter>
  );
}

/**
 * Custom render function that wraps with all providers
 */
export function renderWithProviders(ui, options = {}) {
  const {
    authValue,
    projectValue,
    viewAsValue,
    toastValue,
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    return (
      <AllProviders
        authValue={authValue}
        projectValue={projectValue}
        viewAsValue={viewAsValue}
        toastValue={toastValue}
      >
        {children}
      </AllProviders>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Render with specific role - convenience function
 */
export function renderWithRole(ui, role, options = {}) {
  return renderWithProviders(ui, {
    ...options,
    authValue: createMockAuthContext({ role }),
    viewAsValue: createMockViewAsContext({ effectiveRole: role, actualRole: role }),
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Wait for loading to finish
 */
export async function waitForLoadingToFinish() {
  // You can customize this based on your loading indicators
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create a deferred promise for async testing
 */
export function createDeferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Re-export MSW utilities for use in tests
export { server } from './server.js';
export { 
  handlers, 
  mockData, 
  resetMockData, 
  addMockTimesheet, 
  addMockExpense 
} from './msw-handlers.js';
