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
 * @version 2.0
 * @updated 30 November 2025
 * @phase Phase 1 - Stabilisation
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
