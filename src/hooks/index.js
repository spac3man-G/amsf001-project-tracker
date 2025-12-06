/**
 * Hooks - Barrel Export
 * 
 * Central export point for all custom hooks.
 * 
 * @version 1.1
 * @created 3 December 2025
 * @updated 6 December 2025 - Added useDeliverablePermissions
 */

// Form handling
export { useForm } from './useForm';
export { useFormValidation } from './useFormValidation';

// Permissions
export { usePermissions } from './usePermissions';
export { useMilestonePermissions } from './useMilestonePermissions';
export { useDeliverablePermissions } from './useDeliverablePermissions';

// Dashboard
export { useDashboardLayout } from './useDashboardLayout';

// Read-only mode
export { useReadOnly } from './useReadOnly';

// Metrics (centralized)
export {
  useDashboardMetrics,
  useMilestoneMetrics,
  useDeliverableMetrics,
  useKPIMetrics,
  useQualityStandardMetrics,
  useTimesheetMetrics,
  useExpenseMetrics,
  useBudgetMetrics
} from './useMetrics';
