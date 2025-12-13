/**
 * MSW Server Configuration
 * Sets up Mock Service Worker for Node.js environment (Vitest)
 */

import { setupServer } from 'msw/node';
import { handlers } from './msw-handlers.js';

// Create the MSW server with the defined handlers
export const server = setupServer(...handlers);
