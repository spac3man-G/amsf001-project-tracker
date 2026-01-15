/**
 * Services Layer - Barrel Export
 * 
 * Central export point for all service modules.
 * 
 * Usage:
 *   import { partnersService, resourcesService, timesheetsService } from '../services';
 *   
 *   // Or import the base class for custom services
 *   import { BaseService } from '../services';
 * 
 * @version 2.8
 * @updated 26 December 2025
 * @phase Linked Estimates - Checkpoint 6 Complete
 */

// Base class for extending
export { BaseService } from './base.service';

// Core entity services
export { partnersService, PartnersService } from './partners.service';
export { resourcesService, ResourcesService } from './resources.service';
export { timesheetsService, TimesheetsService } from './timesheets.service';
export { expensesService, ExpensesService } from './expenses.service';
export { invoicingService, InvoicingService } from './invoicing.service';

// Project management services
export { milestonesService, MilestonesService } from './milestones.service';
export { deliverablesService, DeliverablesService } from './deliverables.service';
export { kpisService, KPIsService } from './kpis.service';
export { qualityStandardsService, QualityStandardsService } from './qualityStandards.service';
export { standardsService, StandardsService } from './standards.service';
export { dashboardService, DashboardService } from './dashboard.service';

// Smart features
export { receiptScannerService } from './receiptScanner.service';

// RAID Log
export { raidService, default as RaidService } from './raid.service';

// Metrics (centralized calculations)
export { metricsService, default as MetricsService } from './metrics.service';

// Calendar (availability, milestones, deliverables)
export { 
  calendarService, 
  AVAILABILITY_STATUS, 
  AVAILABILITY_PERIOD,
  STATUS_CONFIG, 
  PERIOD_CONFIG,
  CALENDAR_EVENT_TYPE,
  EVENT_TYPE_CONFIG
} from './calendar.service';

// Variations (change control)
export { 
  variationsService, 
  VariationsService,
  VARIATION_STATUS, 
  VARIATION_TYPE,
  STATUS_CONFIG as VARIATION_STATUS_CONFIG,
  TYPE_CONFIG as VARIATION_TYPE_CONFIG
} from './variations.service';

// Document Templates (template-driven document generation)
export {
  documentTemplatesService,
  DocumentTemplatesService,
  TEMPLATE_TYPE,
  TEMPLATE_TYPE_CONFIG,
  OUTPUT_FORMAT
} from './documentTemplates.service';

// Document Renderer (generates documents from templates)
export {
  documentRendererService,
  DocumentRendererService
} from './documentRenderer.service';

// Report Templates (Report Builder Wizard)
export {
  reportTemplatesService,
  ReportTemplatesService,
  REPORT_TYPE,
  REPORT_TYPE_CONFIG,
  REPORTING_PERIOD,
  REPORTING_PERIOD_CONFIG
} from './reportTemplates.service';

// Report Data Fetcher (Report Builder Wizard - data aggregation)
export {
  reportDataFetcherService,
  getDateRange,
  getLookAheadRange
} from './reportDataFetcher.service';

// Report Renderer (Report Builder Wizard - HTML generation)
export {
  reportRendererService,
  ReportRendererService
} from './reportRenderer.service';

// Workflow (centralised pending items across all entities)
export {
  workflowService,
  WorkflowService,
  WORKFLOW_CATEGORIES,
  ROLES as WORKFLOW_ROLES
} from './workflow.service';

// Organisation (multi-tenancy)
export {
  organisationService,
  OrganisationService
} from './organisation.service';

// Invitation System
export {
  invitationService
} from './invitation.service';

// Email Service
export {
  emailService
} from './email.service';

// Subscription & Limits
export {
  subscriptionService,
  LIMIT_TYPES
} from './subscription.service';

// SFIA 8 Reference Data (full framework)
export {
  SFIA_CATEGORIES,
  SFIA_SUBCATEGORIES,
  SFIA_SKILLS,
  SFIA_LEVELS,
  TIERS,
  getSkillById,
  getSkillsByCategory,
  getSkillsBySubcategory,
  getCategoryById,
  getSubcategoryById,
  getLevelById,
  getTierById,
  calculateDefaultRate,
  generateAllRates
} from './sfia8-reference-data';

// Benchmark Rates Service (SFIA 8 rate card for Estimator & Benchmarking)
export {
  benchmarkRatesService,
  BenchmarkRatesService,
  getSkillName,
  getSkillCode,
  getCategoryName,
  getCategoryColor,
  getSubcategoryName,
  getTierName,
  getTierColor,
  getLevelTitle,
  getLevelDescription,
  formatRate,
  calculatePremium
} from './benchmarkRates.service';

// Estimates (Cost estimation with components/tasks/resources)
export {
  estimatesService,
  EstimatesService,
  ESTIMATE_STATUS,
  ESTIMATE_STATUS_CONFIG
} from './estimates.service';

// Plan Commit Service (Planner-Tracker Integration)
export {
  planCommitService,
  mapPlanStatusToTracker,
  mapTrackerStatusToPlan
} from './planCommitService';

// Sync Service (Bi-directional sync with baseline protection)
export {
  syncService
} from './syncService';

// Plan Items Service (Planner hierarchy - components, milestones, deliverables, tasks)
export {
  planItemsService
} from './planItemsService';
