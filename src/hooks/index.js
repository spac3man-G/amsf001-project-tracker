/**
 * Hooks - Barrel Export
 * 
 * Central export point for all custom hooks.
 * 
 * @version 1.4
 * @created 3 December 2025
 * @updated 28 December 2025 - TD-001: Added useExpensePermissions, useRaidPermissions, useNetworkStandardPermissions
 */

// Form handling
export { useForm } from './useForm';
export { useFormValidation } from './useFormValidation';

// Permissions
export { usePermissions } from './usePermissions';
export { useProjectRole } from './useProjectRole';
export { useMilestonePermissions } from './useMilestonePermissions';
export { useDeliverablePermissions } from './useDeliverablePermissions';
export { useTimesheetPermissions } from './useTimesheetPermissions';
export { useResourcePermissions } from './useResourcePermissions';
export { useExpensePermissions } from './useExpensePermissions';
export { useRaidPermissions } from './useRaidPermissions';
export { useNetworkStandardPermissions } from './useNetworkStandardPermissions';

// Dashboard
export { default as useDashboardLayout } from './useDashboardLayout';

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

// Document Templates
export {
  useDocumentTemplates,
  useDefaultTemplate,
  useDocumentRenderer,
  useCRDocument
} from './useDocumentTemplates';

// Planning Integration (Planner-Tracker)
export {
  usePlanningIntegration,
  isBaselineField
} from './usePlanningIntegration';

// UI Utilities
export { default as useResizableColumns } from './useResizableColumns';

// Evaluator - AI Scoring
export { useAIScoring } from './evaluator/useAIScoring';
