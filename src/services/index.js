/**
 * Services Layer - Barrel Export
 * 
 * Central export point for all service modules.
 * 
 * Usage:
 *   import { partnersService, resourcesService, expensesService, invoicingService, timesheetsService } from '../services';
 *   
 *   // Or import the base class for custom services
 *   import { BaseService } from '../services';
 */

// Base class for extending
export { BaseService } from './base.service';

// Service instances (singletons)
export { partnersService, PartnersService } from './partners.service';
export { resourcesService, ResourcesService } from './resources.service';
export { expensesService, ExpensesService } from './expenses.service';
export { invoicingService, InvoicingService } from './invoicing.service';
export { timesheetsService, TimesheetsService } from './timesheets.service';

// Future services (uncomment as created)
// export { deliverablesService, DeliverablesService } from './deliverables.service';
// export { milestonesService, MilestonesService } from './milestones.service';
// export { kpisService, KPIsService } from './kpis.service';
