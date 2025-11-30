/**
 * Services Layer - Barrel Export
 * 
 * Central export point for all service modules.
 * 
 * Usage:
 *   import { partnersService, resourcesService } from '../services';
 *   
 *   // Or import the base class for custom services
 *   import { BaseService } from '../services';
 */

// Base class for extending
export { BaseService } from './base.service';

// Service instances (singletons)
export { partnersService, PartnersService } from './partners.service';

// Future services (uncomment as created)
// export { resourcesService, ResourcesService } from './resources.service';
// export { expensesService, ExpensesService } from './expenses.service';
// export { invoicingService, InvoicingService } from './invoicing.service';
// export { timesheetsService, TimesheetsService } from './timesheets.service';
