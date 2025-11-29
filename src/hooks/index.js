/**
 * Custom Hooks - Barrel Export
 * 
 * Central export point for all custom hooks.
 * Import hooks from here for cleaner imports.
 * 
 * Usage:
 *   import { useAuth, useProject, useCurrentResource } from '../hooks';
 */

// Authentication
export { useAuth } from './useAuth';

// Project data
export { useProject, useProjects } from './useProject';

// Resources and related data
export { 
  useCurrentResource, 
  useResources, 
  useMilestones 
} from './useCurrentResource';
