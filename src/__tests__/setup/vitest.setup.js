/**
 * Vitest Setup File
 * This file runs before all tests to set up the testing environment
 */

import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Import MSW server and utilities
import { server } from './server.js';
import { resetMockData } from './msw-handlers.js';

// Extend Vitest's expect with React Testing Library matchers
expect.extend(matchers);

// ============================================
// MSW SERVER LIFECYCLE
// ============================================

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Reset handlers and mock data after each test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockData();
});

// Stop MSW server after all tests
afterAll(() => {
  server.close();
});

// ============================================
// BROWSER API MOCKS
// ============================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ============================================
// CONSOLE SUPPRESSION (Optional)
// ============================================

// Uncomment these lines if you want to suppress console output in tests:
// vi.spyOn(console, 'error').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});
