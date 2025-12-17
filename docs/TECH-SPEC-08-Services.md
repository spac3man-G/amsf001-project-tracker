# AMSF001 Technical Specification - Service Layer

**Document Version:** 1.1  
**Created:** 11 December 2025  
**Updated:** 17 December 2025  
**Session:** 1.8  
**Status:** Complete

---

## Table of Contents

1. [Overview](#1-overview)
2. [Service Architecture](#2-service-architecture)
3. [Base Service Class](#3-base-service-class)
4. [Entity Services](#4-entity-services)
5. [Supporting Entity Services](#5-supporting-entity-services)
6. [Aggregation Services](#6-aggregation-services)
7. [Document Services](#7-document-services)
8. [Smart Feature Services](#8-smart-feature-services)
9. [Calculation Libraries](#9-calculation-libraries)
10. [Caching Strategies](#10-caching-strategies)
11. [Error Handling Patterns](#11-error-handling-patterns)
12. [Report Builder Services](#12-report-builder-services)

---

## 1. Overview

### 1.1 Service Layer Purpose

The service layer provides a clean abstraction between the React frontend (contexts, hooks, components) and the Supabase database. All services:

- Encapsulate business logic and data transformations
- Handle database queries with consistent patterns
- Implement soft delete filtering
- Support multi-tenancy via project_id scoping
- Provide singleton instances for application-wide consistency

### 1.2 Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Contexts & Custom Hooks                         │
│  (AuthContext, ProjectContext, usePermissions, etc.)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ BaseService │  │  Metrics    │  │  Document   │         │
│  │   (CRUD)    │  │  Service    │  │  Renderer   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Milestones  │  │ Deliverables│  │  Timesheets │         │
│  │  Service    │  │   Service   │  │   Service   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase Client                              │
│         (Authentication + Database + Storage)                │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 File Structure

```
src/services/
├── index.js                    # Barrel exports
├── base.service.js             # BaseService class
│
├── # Entity Services
├── milestones.service.js
├── deliverables.service.js
├── resources.service.js
├── timesheets.service.js
├── expenses.service.js
│
├── # Supporting Entity Services
├── partners.service.js
├── kpis.service.js
├── qualityStandards.service.js
├── raid.service.js
├── variations.service.js
│
├── # Aggregation Services
├── metrics.service.js
├── dashboard.service.js
├── invoicing.service.js
├── calendar.service.js
│
├── # Document Services
├── documentTemplates.service.js
├── documentRenderer.service.js
│
└── # Smart Feature Services
    └── receiptScanner.service.js
```

---

## 2. Service Architecture

### 2.1 Barrel Export Pattern

All services are exported through `index.js` for clean imports:

```javascript
// src/services/index.js

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
// ... etc.
```

**Usage Pattern:**

```javascript
import { partnersService, resourcesService } from '../services';

const partners = await partnersService.getAll(projectId);
```

### 2.2 Singleton Pattern

Each service exports both the class (for testing) and a singleton instance:

```javascript
export class MilestonesService extends BaseService {
  constructor() {
    super('milestones', {
      supportsSoftDelete: true,
      sanitizeConfig: 'milestone'
    });
  }
  // ... methods
}

// Export singleton instance
export const milestonesService = new MilestonesService();
export default milestonesService;
```

### 2.3 Supabase Integration

Services interact with Supabase through the shared client:

```javascript
import { supabase } from '../lib/supabase';

// Query with relations
const { data, error } = await supabase
  .from('milestones')
  .select('*, deliverables(*)')
  .eq('project_id', projectId)
  .order('start_date', { ascending: true });
```

---

## 3. Base Service Class

### 3.1 Overview

`BaseService` provides reusable CRUD operations with consistent patterns:

```javascript
export class BaseService {
  constructor(tableName, options = {}) {
    this.tableName = tableName;
    this.supportsSoftDelete = options.supportsSoftDelete !== false;
    this.sanitizeConfig = options.sanitizeConfig || null;
  }
}
```

### 3.2 Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getAll(projectId, options)` | Get all records for a project | `Array` |
| `getById(id, options)` | Get single record by ID | `Object\|null` |
| `create(record)` | Create new record | `Object` |
| `update(id, updates)` | Update existing record | `Object` |
| `delete(id, userId)` | Soft delete (or hard delete) | `boolean` |
| `hardDelete(id)` | Permanently remove record | `boolean` |
| `restore(id)` | Restore soft-deleted record | `Object` |
| `exists(id)` | Check if record exists | `boolean` |
| `count(projectId, filters)` | Count records | `number` |
| `getDeleted(projectId)` | Get soft-deleted records | `Array` |

### 3.3 Query Options

```javascript
const options = {
  select: '*, milestones(name)',        // Columns/relations to select
  orderBy: { column: 'date', ascending: false },
  filters: [
    { column: 'status', operator: 'eq', value: 'Approved' },
    { column: 'amount', operator: 'gt', value: 100 }
  ],
  includeDeleted: false                  // Include soft-deleted records
};

const results = await service.getAll(projectId, options);
```

### 3.4 Supported Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `status = 'Draft'` |
| `neq` | Not equals | `status != 'Rejected'` |
| `gt` | Greater than | `amount > 100` |
| `gte` | Greater or equal | `date >= '2025-01-01'` |
| `lt` | Less than | `amount < 500` |
| `lte` | Less or equal | `date <= '2025-12-31'` |
| `like` | Pattern match | `name LIKE '%test%'` |
| `ilike` | Case-insensitive match | `name ILIKE '%TEST%'` |
| `in` | In array | `status IN ['Draft', 'Submitted']` |
| `is` | Is null | `deleted_at IS NULL` |

### 3.5 Soft Delete Implementation

```javascript
// Soft delete - marks record as deleted
async delete(id, userId = null) {
  if (this.supportsSoftDelete) {
    const { error } = await supabase
      .from(this.tableName)
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userId
      })
      .eq('id', id);
    // ...
  }
}

// Restore soft-deleted record
async restore(id) {
  const { data, error } = await supabase
    .from(this.tableName)
    .update({
      is_deleted: false,
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', id)
    .select();
  // ...
}
```

**Client-Side Filtering:**

Due to Supabase PostgREST `.or()` limitations, soft delete filtering is done client-side:

```javascript
let result = data || [];
if (this.supportsSoftDelete && !options.includeDeleted) {
  result = result.filter(record => record.is_deleted !== true);
}
```

---

## 4. Entity Services

### 4.1 Milestones Service

**File:** `src/services/milestones.service.js`

Manages milestones, baseline commitments, and acceptance certificates.

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAllWithStats(projectId)` | projectId | Get milestones with logged hours |
| `getWithDeliverables(milestoneId)` | milestoneId | Get milestone with linked deliverables |
| `getByStatus(projectId, status)` | projectId, status | Filter by status |
| `getUpcoming(projectId, days)` | projectId, days=30 | Get milestones due within N days |
| `updateStatus(milestoneId, status)` | milestoneId, status | Update milestone status |
| `updateCompletion(milestoneId, percent)` | milestoneId, percent | Update completion % |
| `getSummary(projectId)` | projectId | Dashboard summary stats |
| `getBillableMilestones(projectId)` | projectId | Get billable milestones with expected dates |

#### Certificate Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getCertificates(projectId)` | projectId | Get all certificates |
| `getCertificateByMilestoneId(milestoneId)` | milestoneId | Get certificate for milestone |
| `createCertificate(certificateData)` | certificateData | Create new certificate |
| `updateCertificate(certificateId, updates)` | certificateId, updates | Update certificate |
| `signCertificate(certId, signerRole, userId, userName)` | certId, role, userId, userName | Sign as supplier/customer |

#### Baseline Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `signBaseline(milestoneId, signerRole, userId, userName)` | milestoneId, role, userId, userName | Sign baseline commitment |
| `resetBaseline(milestoneId)` | milestoneId | Reset all baseline signatures |

#### Example Usage

```javascript
import { milestonesService } from '../services';

// Get milestones with timesheet stats
const milestones = await milestonesService.getAllWithStats(projectId);

// Sign baseline as supplier PM
await milestonesService.signBaseline(
  milestoneId, 
  'supplier', 
  userId, 
  'John Smith'
);

// Get billable milestones
const billable = await milestonesService.getBillableMilestones(projectId);
```

---

### 4.2 Deliverables Service

**File:** `src/services/deliverables.service.js`

Manages deliverables with dual-signature workflow and KPI/QS links.

#### Core Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAllWithMilestones(projectId)` | projectId | Get deliverables with milestone info |
| `getAllWithRelations(projectId, showTestUsers)` | projectId, showTestUsers | Get with KPI/QS links |
| `getByMilestone(milestoneId)` | milestoneId | Get deliverables for milestone |
| `getByStatus(projectId, status)` | projectId, status | Filter by status |
| `getOverdue(projectId)` | projectId | Get overdue deliverables |
| `getUpcoming(projectId, days)` | projectId, days=14 | Get upcoming deliverables |
| `getSummary(projectId)` | projectId | Dashboard summary stats |

#### Workflow Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `updateStatus(deliverableId, status, userId)` | deliverableId, status, userId | Update with timestamp |
| `submit(deliverableId, userId)` | deliverableId, userId | Submit for review |
| `markDelivered(deliverableId, userId)` | deliverableId, userId | Mark as delivered |
| `reject(deliverableId, reason)` | deliverableId, reason | Reject with reason |

#### Dual-Signature Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `signDeliverable(deliverableId, signerRole, userId, userName)` | deliverableId, role, userId, userName | Sign as supplier/customer |
| `resetSignatures(deliverableId)` | deliverableId | Reset all signatures (admin) |

#### KPI/QS Link Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `syncKPILinks(deliverableId, kpiIds)` | deliverableId, kpiIds[] | Sync KPI links |
| `syncQSLinks(deliverableId, qsIds)` | deliverableId, qsIds[] | Sync QS links |
| `upsertKPIAssessments(deliverableId, assessments, userId)` | deliverableId, assessments, userId | Record KPI assessments |
| `upsertQSAssessments(deliverableId, assessments, userId)` | deliverableId, assessments, userId | Record QS assessments |

---

### 4.3 Resources Service

**File:** `src/services/resources.service.js`

Manages resources with partner linking, caching, and utilization tracking.

#### Core Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAll(projectId, options)` | projectId, options | Get all resources |
| `getAllFiltered(projectId, showTestUsers)` | projectId, showTestUsers | Get filtered resources |
| `getById(id)` | id | Get resource with partner details |
| `getByType(projectId, resourceType)` | projectId, resourceType | Filter by internal/third_party |
| `getByPartner(partnerId)` | partnerId | Get resources for partner |
| `getForSelect(projectId)` | projectId | Get for dropdown (cached) |

#### Enhanced Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getWithTimesheetSummary(id)` | id | Get resource with timesheet stats |
| `getUtilization(id)` | id | Calculate utilization metrics |
| `getSummary(projectId)` | projectId | Dashboard summary |
| `linkToPartner(resourceId, partnerId)` | resourceId, partnerId | Link/unlink from partner |
| `toggleActive(id)` | id | Toggle is_active flag |
| `getDependencyCounts(resourceId)` | resourceId | Check timesheets/expenses before delete |
| `calculateMargin(dailyRate, costPrice)` | dailyRate, costPrice | Calculate margin % |

---

### 4.4 Timesheets Service

**File:** `src/services/timesheets.service.js`

Manages timesheets with validation workflow.

#### Core Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAll(projectId, options)` | projectId, options | Get with resource/milestone relations |
| `getAllFiltered(projectId, showTestContent)` | projectId, showTestContent | Filter test content |
| `getByResource(resourceId, options)` | resourceId, options | Get for resource with date range |
| `getByPartner(partnerId, options)` | partnerId, options | Get for partner's resources |
| `getApprovedForInvoice(partnerId, dateRange)` | partnerId, dateRange | Get approved timesheets for invoicing |
| `getSummary(projectId, options)` | projectId, options | Summary stats with breakdowns |

#### Workflow Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `submit(id)` | id | Submit for validation |
| `validate(id)` | id | Mark as validated (approved) |
| `reject(id, reason)` | id, reason | Reject with reason |

#### Calculation Helpers

```javascript
// Calculate cost for timesheet entry
calculateCost(hours, costPrice)

// Calculate billable amount
calculateBillable(hours, dailyRate)
```

---

### 4.5 Expenses Service

**File:** `src/services/expenses.service.js`

Manages expenses with receipt handling and validation workflow.

#### Core Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAll(projectId, options)` | projectId, options | Get with expense files |
| `getAllFiltered(projectId, showTestContent)` | projectId, showTestContent | Filter test content |
| `getByResource(resourceId, options)` | resourceId, options | Get for resource |
| `getByPartner(partnerId, options)` | partnerId, options | Get for partner's resources |
| `getPartnerProcuredForInvoice(partnerId, dateRange)` | partnerId, dateRange | Get partner-procured expenses |
| `getSummary(projectId, options)` | projectId, options | Summary with category breakdown |

#### Workflow Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `submit(id)` | id | Submit for validation |
| `validate(id)` | id | Validate (approve) |
| `reject(id, reason)` | id, reason | Reject with reason |
| `markPaid(id)` | id | Mark as paid |

#### Batch & File Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `createMany(expenses)` | expenses[] | Batch create expenses |
| `uploadReceipt(expenseId, file, userId)` | expenseId, file, userId | Upload receipt file |
| `downloadReceipt(filePath)` | filePath | Download receipt file |

---

## 5. Supporting Entity Services

### 5.1 Partners Service

**File:** `src/services/partners.service.js`

Manages third-party partner companies with caching.

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAll(projectId, bypassCache)` | projectId, bypassCache | Get all partners (cached) |
| `getActive(projectId)` | projectId | Get active partners only (cached) |
| `getWithResources(partnerId)` | partnerId | Get partner with linked resources |
| `getSummary(projectId)` | projectId | Summary with resource counts |
| `findByName(projectId, name)` | projectId, name | Find by name (for validation) |
| `toggleActive(partnerId)` | partnerId | Toggle active status |
| `getForSelect(projectId, activeOnly)` | projectId, activeOnly | Get for dropdown (cached) |
| `getDependencyCounts(partnerId)` | partnerId | Check dependencies before delete |

---

### 5.2 KPIs Service

**File:** `src/services/kpis.service.js`

Manages Key Performance Indicators with assessment-based calculations.

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAllWithStatus(projectId)` | projectId | Get KPIs with calculated RAG status |
| `getByRAGStatus(projectId, ragStatus)` | projectId, ragStatus | Filter by Green/Amber/Red |
| `getNeedingAttention(projectId)` | projectId | Get Amber and Red KPIs |
| `updateActualValue(kpiId, actualValue)` | kpiId, actualValue | Update current value |
| `getHistory(kpiId, limit)` | kpiId, limit | Get historical values |
| `getSummary(projectId)` | projectId | Summary by RAG status |
| `getAssessments(projectId)` | projectId | Get assessments from delivered deliverables |

#### RAG Calculation Logic

```javascript
calculateRAG(kpi) {
  const actual = parseFloat(kpi.actual_value);
  const target = parseFloat(kpi.target_value);
  const threshold = parseFloat(kpi.threshold_amber || 10);

  if (kpi.trend === 'higher_better') {
    if (actual >= target) return 'Green';
    if (actual >= target * (1 - threshold / 100)) return 'Amber';
    return 'Red';
  } else {
    // Lower is better
    if (actual <= target) return 'Green';
    if (actual <= target * (1 + threshold / 100)) return 'Amber';
    return 'Red';
  }
}
```

---

### 5.3 Quality Standards Service

**File:** `src/services/qualityStandards.service.js`

Manages quality standards with compliance calculations.

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAllWithStatus(projectId)` | projectId | Get with compliance status |
| `getAllWithCalculatedValues(projectId)` | projectId | Get with assessment-based values |
| `getNonCompliant(projectId)` | projectId | Get non-compliant standards |
| `updateMeasurement(standardId, value, notes)` | standardId, value, notes | Update measurement |
| `getSummary(projectId)` | projectId | Summary by compliance status |
| `getAssessments(projectId)` | projectId | Get assessments from delivered deliverables |

---

### 5.4 RAID Service

**File:** `src/services/raid.service.js`

Manages Risks, Assumptions, Issues, and Dependencies.

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAllWithRelations(projectId, options)` | projectId, options | Get with owner/milestone relations |
| `getGroupedByCategory(projectId)` | projectId | Get grouped by R/A/I/D |
| `getSummary(projectId)` | projectId | Summary stats by category/status/severity |
| `getNextRef(projectId, category)` | projectId, category | Generate next reference (R001, A001, etc.) |
| `createWithAutoRef(item)` | item | Create with auto-generated reference |
| `updateStatus(id, newStatus, resolution)` | id, newStatus, resolution | Update with date tracking |
| `getOverdue(projectId)` | projectId | Get overdue open items |
| `getByMilestone(milestoneId)` | milestoneId | Get items linked to milestone |
| `getByOwner(ownerId)` | ownerId | Get items assigned to owner |
| `bulkUpdateStatus(ids, newStatus)` | ids[], newStatus | Bulk status update |

#### Category Prefixes

| Category | Prefix | Example |
|----------|--------|---------|
| Risk | R | R001, R002 |
| Assumption | A | A001, A002 |
| Issue | I | I001, I002 |
| Dependency | D | D001, D002 |

---

### 5.5 Variations Service

**File:** `src/services/variations.service.js`

Manages change control with dual-approval workflow.

#### Status Constants

```javascript
export const VARIATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  AWAITING_CUSTOMER: 'awaiting_customer',
  AWAITING_SUPPLIER: 'awaiting_supplier',
  APPROVED: 'approved',
  APPLIED: 'applied',
  REJECTED: 'rejected'
};

export const VARIATION_TYPE = {
  SCOPE_EXTENSION: 'scope_extension',
  SCOPE_REDUCTION: 'scope_reduction',
  TIME_EXTENSION: 'time_extension',
  COST_ADJUSTMENT: 'cost_adjustment',
  COMBINED: 'combined'
};
```

#### Core Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAllWithStats(projectId)` | projectId | Get with milestone counts |
| `getWithDetails(variationId)` | variationId | Get with all relations |
| `createVariation(projectId, data, userId)` | projectId, data, userId | Create with auto-ref |
| `saveFormProgress(variationId, formData, step)` | variationId, formData, step | Auto-save form |
| `getSummary(projectId)` | projectId | Dashboard summary |

#### Milestone Impact Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `addAffectedMilestone(variationId, milestoneData)` | variationId, data | Add milestone impact |
| `updateAffectedMilestone(variationMilestoneId, updates)` | id, updates | Update impact |
| `removeAffectedMilestone(variationMilestoneId)` | id | Remove impact |
| `clearAffectedMilestones(variationId)` | variationId | Clear all impacts |

#### Workflow Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `submitForApproval(variationId, impactSummary)` | variationId, summary | Submit for approval |
| `signVariation(variationId, signerRole, userId)` | variationId, role, userId | Sign as supplier/customer |
| `rejectVariation(variationId, userId, reason)` | variationId, userId, reason | Reject variation |
| `applyVariation(variationId)` | variationId | Apply approved variation to milestone baselines |
| `deleteDraftVariation(variationId)` | variationId | Delete draft/submitted/rejected |
| `resetToDraft(variationId)` | variationId | Reset rejected variation to draft for re-editing |

#### applyVariation Behavior (v1.2)

When `applyVariation()` is called on an approved variation, it updates the following fields on each affected milestone:

| Field | Update | Purpose |
|-------|--------|--------|
| `baseline_start_date` | `new_baseline_start` | New contracted start date |
| `baseline_end_date` | `new_baseline_end` | New contracted end date |
| `baseline_billable` | `new_baseline_cost` | New contracted billable amount |
| `start_date` | `new_baseline_start` | Forecast start (reset to match baseline) |
| `forecast_end_date` | `new_baseline_end` | Forecast end (reset to match baseline) |
| `forecast_billable` | `new_baseline_cost` | Forecast billable (reset to match baseline) |
| `billable` | `new_baseline_cost` | Current billable for invoicing |

The method also:
- Creates a new `milestone_baseline_versions` record with the new version number
- Links the version to the variation via `variation_id`
- Stores signature information from the variation
- Generates a certificate number and stores certificate data
- Updates the variation status to `applied`

#### Baseline History Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getCurrentBaselineVersion(milestoneId)` | milestoneId | Get current version number |
| `getMilestoneBaselineHistory(milestoneId)` | milestoneId | Get version history |
| `getVariationsForMilestone(milestoneId)` | milestoneId | Get variations affecting milestone |
| `hasPendingVariation(milestoneId)` | milestoneId | Check for pending variations |
| `getMilestonesWithDependencies(projectId)` | projectId | Get with cascade warnings |

---

## 6. Aggregation Services

### 6.1 Metrics Service

**File:** `src/services/metrics.service.js`

Central source of truth for all application metrics with caching.

#### Architecture

```javascript
class MetricsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 second cache
  }

  clearCache() {
    this.cache.clear();
  }
}
```

#### Metric Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getMilestoneMetrics(projectId)` | projectId | Milestone counts and budget |
| `getDeliverableMetrics(projectId, includeTestContent)` | projectId, includeTestContent | Deliverable counts and status |
| `getKPIMetrics(projectId)` | projectId | KPI achievement with assessments |
| `getQualityStandardMetrics(projectId)` | projectId | QS achievement with assessments |
| `getTimesheetMetrics(projectId, includeTestUsers)` | projectId, includeTestUsers | Hours and spend calculations |
| `getExpenseMetrics(projectId, includeTestUsers)` | projectId, includeTestUsers | Expense breakdowns |
| `getResourceMetrics(projectId)` | projectId | Resource allocations |
| `getCertificateMetrics(projectId)` | projectId | Certificate status counts |
| `getAllDashboardMetrics(projectId, options)` | projectId, options | Combined metrics for dashboard |

#### Return Structure Example

```javascript
// getAllDashboardMetrics returns:
{
  milestones: {
    total: 10,
    completed: 3,
    inProgress: 5,
    notStarted: 2,
    totalBudget: 500000,
    averageProgress: 45,
    milestones: [/* raw data */]
  },
  deliverables: {
    total: 50,
    delivered: 15,
    inProgress: 20,
    notStarted: 10,
    overdue: 5,
    dueThisWeek: 3,
    completionPercent: 30
  },
  budget: {
    totalBudget: 500000,
    timesheetSpend: 150000,
    expenseSpend: 25000,
    totalSpend: 175000,
    utilizationPercent: 35
  },
  // ... kpis, qualityStandards, timesheets, expenses, resources, certificates
}
```

---

### 6.2 Dashboard Service

**File:** `src/services/dashboard.service.js`

Manages user dashboard layout persistence.

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getLayout(userId, projectId, role)` | userId, projectId, role | Get layout (or role default) |
| `saveLayout(userId, projectId, layoutConfig)` | userId, projectId, config | Save custom layout |
| `deleteLayout(userId, projectId)` | userId, projectId | Delete custom layout |
| `resetToDefault(userId, projectId, role)` | userId, projectId, role | Reset to role preset |

#### Layout Configuration

```javascript
// Layout config structure
{
  widgets: {
    progress: { visible: true, order: 1 },
    budget: { visible: true, order: 2 },
    milestones: { visible: true, order: 3 },
    deliverables: { visible: true, order: 4 },
    kpis: { visible: false, order: 5 },
    timesheets: { visible: true, order: 6 }
  },
  lastModified: '2025-12-11T10:00:00Z'
}
```

---

### 6.3 Invoicing Service

**File:** `src/services/invoicing.service.js`

Generates comprehensive partner invoices.

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getAll(projectId, options)` | projectId, options | Get all invoices with partner details |
| `getByPartner(partnerId, options)` | partnerId, options | Get invoices for partner |
| `getWithLines(invoiceId)` | invoiceId | Get invoice with grouped line items |
| `generateInvoiceNumber(projectId)` | projectId | Generate next INV-YYYY-NNN |
| `generateInvoice(params)` | params | Generate complete invoice |
| `updateStatus(invoiceId, status)` | invoiceId, status | Update with timestamps |
| `markSent(invoiceId)` | invoiceId | Mark as sent |
| `markPaid(invoiceId)` | invoiceId | Mark as paid |
| `cancel(invoiceId)` | invoiceId | Cancel invoice |
| `getPartnerStats(partnerId)` | partnerId | Summary stats for partner |

#### Invoice Generation Parameters

```javascript
const params = {
  projectId: 'uuid',
  partnerId: 'uuid',
  periodStart: '2025-01-01',
  periodEnd: '2025-01-31',
  createdBy: 'userId',
  notes: 'Optional notes',
  includeSubmitted: true,       // Include submitted timesheets
  invoiceType: 'combined'       // 'combined', 'timesheets', or 'expenses'
};

const invoice = await invoicingService.generateInvoice(params);
```

#### Invoice Structure

```
Invoice Total = Timesheet Total + Partner Expense Total

Line Types:
├── timesheet          - Hours × cost price (billable to partner)
├── expense            - Partner-procured expenses (billable to partner)
└── supplier_expense   - Supplier-procured expenses (informational only)
```

---

## 7. Document Services

### 7.1 Document Templates Service

**File:** `src/services/documentTemplates.service.js`

Manages JSONB-based document templates.

#### Template Types

```javascript
export const TEMPLATE_TYPE = {
  VARIATION_CR: 'variation_cr',
  VARIATION_CERTIFICATE: 'variation_certificate',
  INVOICE: 'invoice',
  DELIVERABLE_CERTIFICATE: 'deliverable_certificate',
  MILESTONE_CERTIFICATE: 'milestone_certificate',
  CUSTOM: 'custom'
};
```

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `getTemplatesForProject(projectId, options)` | projectId, options | Get templates by type/status |
| `getTemplateById(templateId)` | templateId | Get single template |
| `getDefaultTemplate(projectId, templateType)` | projectId, type | Get default for type |
| `createTemplate(templateData, userId)` | data, userId | Create with validation |
| `updateTemplate(templateId, updates, userId)` | templateId, updates, userId | Update (increments version) |
| `deleteTemplate(templateId, userId)` | templateId, userId | Soft delete |
| `setAsDefault(templateId)` | templateId | Set as default for type |
| `exportTemplate(templateId)` | templateId | Export as JSON |
| `importTemplate(projectId, jsonData, userId)` | projectId, json, userId | Import from JSON |
| `duplicateTemplate(templateId, targetProjectId, userId)` | templateId, projectId, userId | Copy template |
| `validateTemplateDefinition(definition)` | definition | Validate structure |

#### Template Definition Structure

```javascript
{
  metadata: {
    schema_version: '1.0',
    template_code: 'cr_standard',
    document_title: 'Change Request',
    page_size: 'A4',
    orientation: 'portrait'
  },
  styles: {
    header_title: { fontSize: 18, fontWeight: 'bold' },
    section_heading: { fontSize: 12, fontWeight: 'bold' },
    // ...
  },
  sections: [
    { type: 'header', title: { text: 'Change Request' }, logo: { source: 'template.logo_base64' } },
    { type: 'field_row', fields: [{ label: 'Reference', source: 'variation.variation_ref' }] },
    { type: 'text_block', label: 'Description', source: 'variation.description' },
    { type: 'table', label: 'Affected Milestones', source: 'variation.affected_milestones', columns: [...] },
    { type: 'signature_block', parties: [...] }
  ]
}
```

---

### 7.2 Document Renderer Service

**File:** `src/services/documentRenderer.service.js`

Generic renderer that interprets template definitions.

#### Section Types

```javascript
export const SECTION_TYPE = {
  HEADER: 'header',
  SECTION_TITLE: 'section_title',
  FIELD_ROW: 'field_row',
  TEXT_BLOCK: 'text_block',
  TABLE: 'table',
  SIGNATURE_BLOCK: 'signature_block',
  PAGE_BREAK: 'page_break'
};
```

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `renderToHtml(template, data)` | template, data | Render to HTML |
| `renderToDocx(template, data)` | template, data | Render to DOCX (Phase 2) |
| `renderToPdf(template, data)` | template, data | Render to PDF (Phase 2) |
| `buildContext(template, data)` | template, data | Build full context with computed values |
| `resolveSource(source, context)` | source, context | Resolve dot-notation paths |
| `formatValue(value, format, context)` | value, format, context | Format for display |

#### Format Types

| Format | Example Output |
|--------|---------------|
| `date` | 11/12/2025 |
| `datetime` | 11/12/2025, 10:30 |
| `currency` | £1,234.56 |
| `currency_with_sign` | +£1,234.56 |
| `days_with_sign` | +5 days |
| `variation_type_label` | Scope Extension |

---

## 8. Smart Feature Services

### 8.1 Receipt Scanner Service

**File:** `src/services/receiptScanner.service.js`

AI-powered receipt scanning with learning system.

#### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `uploadImage(file, userId)` | file, userId | Upload to Supabase Storage |
| `processReceipt(imageData, projectId)` | imageData, projectId | Process with Claude Vision |
| `callClaudeVision(imageData)` | imageData | Call AI API |
| `findClassificationRule(projectId, merchant)` | projectId, merchant | Find learned rule |
| `classifyFromPatterns(merchant)` | merchant | Fallback pattern matching |
| `learnFromCorrection(projectId, merchant, category, userId, wasCorrection)` | ... | Save learning |
| `createScan(scanData)` | scanData | Create scan record |
| `updateScanClassification(scanId, category, wasCorrection)` | scanId, category, wasCorrection | Update with final category |
| `linkToExpense(scanId, expenseId)` | scanId, expenseId | Link scan to expense |
| `getRecentScans(projectId, limit)` | projectId, limit | Get recent scans |
| `getUnlinkedScans(projectId)` | projectId | Get scans not yet converted |
| `getClassificationRules(projectId)` | projectId | Get learned rules |
| `deleteClassificationRule(ruleId)` | ruleId | Delete rule |

#### Merchant Pattern Hints

```javascript
const MERCHANT_HINTS = {
  // Travel
  'uber': 'Travel',
  'taxi': 'Travel',
  'train': 'Travel',
  'petrol': 'Travel',
  
  // Accommodation
  'hotel': 'Accommodation',
  'airbnb': 'Accommodation',
  
  // Sustenance
  'restaurant': 'Sustenance',
  'costa': 'Sustenance',
  'starbucks': 'Sustenance'
  // ...
};
```

---

## 9. Calculation Libraries

### 9.1 Milestone Calculations

**File:** `src/lib/milestoneCalculations.js`

Centralised business logic for milestone status and certificates.

#### Status Constants

```javascript
export const MILESTONE_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
};

export const CERTIFICATE_STATUS = {
  DRAFT: 'Draft',
  PENDING_SUPPLIER: 'Pending Supplier Signature',
  PENDING_CUSTOMER: 'Pending Customer Signature',
  SIGNED: 'Signed'
};

export const BASELINE_STATUS = {
  NOT_COMMITTED: 'Not Committed',
  AWAITING_SUPPLIER: 'Awaiting Supplier',
  AWAITING_CUSTOMER: 'Awaiting Customer',
  LOCKED: 'Locked'
};
```

#### Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `calculateMilestoneStatus(deliverables)` | deliverables[] | Compute status from deliverables |
| `calculateMilestoneProgress(deliverables)` | deliverables[] | Average of deliverable progress |
| `calculateBaselineStatus(milestone)` | milestone | Compute baseline lock status |
| `isBaselineLocked(milestone)` | milestone | Check if fully locked |
| `canGenerateCertificate(milestone, deliverables, certificate)` | ... | Check if certificate can be created |
| `isCertificateFullySigned(certificate)` | certificate | Check if both parties signed |
| `getNewCertificateStatus(certificate, signerRole)` | certificate, role | Get status after signature |
| `calculateVariance(forecast, baseline)` | forecast, baseline | Calculate variance amount/% |

---

### 9.2 Deliverable Calculations

**File:** `src/lib/deliverableCalculations.js`

Centralised business logic for deliverable workflow.

#### Status Constants

```javascript
export const DELIVERABLE_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  SUBMITTED_FOR_REVIEW: 'Submitted for Review',
  RETURNED_FOR_MORE_WORK: 'Returned for More Work',
  REVIEW_COMPLETE: 'Review Complete',
  DELIVERED: 'Delivered'
};

export const SIGN_OFF_STATUS = {
  NOT_SIGNED: 'Not Signed',
  AWAITING_SUPPLIER: 'Awaiting Supplier',
  AWAITING_CUSTOMER: 'Awaiting Customer',
  SIGNED: 'Signed'
};
```

#### Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `getStatusConfig(status)` | status | Get display config (bg, color, icon) |
| `getAutoTransitionStatus(currentStatus, newProgress)` | status, progress | Auto-transition logic |
| `isProgressSliderDisabled(status)` | status | Check if progress locked |
| `canSubmitForReview(deliverable)` | deliverable | Check if can submit |
| `canReviewDeliverable(deliverable)` | deliverable | Check if can review |
| `canStartDeliverySignOff(deliverable)` | deliverable | Check if can start sign-off |
| `isDeliverableComplete(deliverable)` | deliverable | Check if delivered |
| `isDeliverableEditable(deliverable)` | deliverable | Check if editable |
| `calculateSignOffStatus(deliverable)` | deliverable | Compute sign-off status |
| `getNewSignOffStatus(deliverable, signerRole)` | deliverable, role | Get status after signature |
| `isFullySigned(deliverable)` | deliverable | Check if both parties signed |
| `canSupplierSign(deliverable)` | deliverable | Check if supplier can sign |
| `canCustomerSign(deliverable)` | deliverable | Check if customer can sign |

---

### 9.3 Timesheet Calculations

**File:** `src/lib/timesheetCalculations.js`

Centralised business logic for timesheet workflow.

#### Status Constants

```javascript
export const TIMESHEET_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',      // Database value (displays as 'Validated')
  REJECTED: 'Rejected'
};

// UI displays 'Validated' instead of 'Approved'
export const TIMESHEET_STATUS_DISPLAY = {
  [TIMESHEET_STATUS.APPROVED]: 'Validated'
};
```

#### Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `getStatusDisplayName(status)` | status | Get display name (Approved → Validated) |
| `getStatusConfig(status)` | status | Get display config |
| `isEditable(statusOrTimesheet)` | status | Check if Draft or Rejected |
| `isComplete(statusOrTimesheet)` | status | Check if Approved |
| `canBeSubmitted(statusOrTimesheet)` | status | Check if can submit |
| `canBeValidated(statusOrTimesheet)` | status | Check if can validate |
| `canBeDeleted(statusOrTimesheet)` | status | Check if Draft only |
| `contributesToSpend(statusOrTimesheet)` | status | Check if counts toward spend |
| `validateHours(hours, entryType)` | hours, type | Validate hours value |
| `getNextSunday()` | - | Get next Sunday date |
| `getTodayDate()` | - | Get today's date |

---

## 10. Caching Strategies

### 10.1 Service-Level Caching

Several services implement local caching for frequently accessed data:

#### Resources Service

```javascript
import { getCacheKey, getFromCache, setInCache, invalidateNamespace, CACHE_TTL } from '../lib/cache';

const CACHE_NAMESPACE = 'resources';

async getForSelect(projectId) {
  const cacheKey = getCacheKey(CACHE_NAMESPACE, projectId, 'select');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  
  const { data } = await supabase
    .from(this.tableName)
    .select('id, name, resource_type, role')
    .eq('project_id', projectId);
  
  setInCache(cacheKey, data, CACHE_TTL.LONG);
  return data;
}

// Invalidate on mutations
async create(resourceData) {
  const result = await super.create(resourceData);
  invalidateNamespace(CACHE_NAMESPACE);
  return result;
}
```

#### Partners Service

```javascript
const CACHE_NAMESPACE = 'partners';

async getAll(projectId, bypassCache = false) {
  const cacheKey = getCacheKey(CACHE_NAMESPACE, projectId, 'all');
  
  if (!bypassCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }
  
  const data = await super.getAll(projectId);
  setInCache(cacheKey, data, CACHE_TTL.LONG);
  return data;
}
```

### 10.2 Metrics Service Caching

```javascript
class MetricsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 seconds
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache() {
    this.cache.clear();
  }
}
```

### 10.3 Cache Invalidation Patterns

| Event | Action |
|-------|--------|
| Record created | Invalidate namespace |
| Record updated | Invalidate namespace |
| Record deleted | Invalidate namespace |
| Project switch | Clear all caches |
| User logout | Clear all caches |

---

## 11. Error Handling Patterns

### 11.1 Standard Error Pattern

All services follow consistent error handling:

```javascript
async getAll(projectId, options = {}) {
  try {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error(`${this.tableName} getAll error:`, error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`${this.tableName} getAll failed:`, error);
    throw error;
  }
}
```

### 11.2 Validation Errors

```javascript
async create(record) {
  if (!record.project_id) {
    throw new Error('project_id is required');
  }
  if (!record.name?.trim()) {
    throw new Error('Name is required');
  }
  // ... continue with database operation
}
```

### 11.3 Business Rule Errors

```javascript
async deleteDraftVariation(variationId) {
  const variation = await this.getById(variationId);
  
  if (!variation) {
    throw new Error('Variation not found');
  }
  
  const deletableStatuses = [VARIATION_STATUS.DRAFT, VARIATION_STATUS.SUBMITTED, VARIATION_STATUS.REJECTED];
  
  if (!deletableStatuses.includes(variation.status)) {
    throw new Error('Only draft, submitted, or rejected variations can be deleted.');
  }
  
  // ... proceed with deletion
}
```

### 11.4 Graceful Fallbacks

```javascript
async getAssessments(projectId) {
  try {
    const { data, error } = await supabase
      .from('deliverable_kpi_assessments')
      .select('...')
      .eq('deliverables.project_id', projectId);

    if (error) {
      console.warn('KPI assessments query warning:', error.message);
      // Try fallback query
      return await this.getAssessmentsFallback(projectId);
    }
    
    return data || [];
  } catch (error) {
    console.error('KPIsService getAssessments error:', error);
    return []; // Return empty array instead of throwing
  }
}
```

---

## 12. Report Builder Services

The Report Builder feature uses three specialised services that work together to provide template management, data fetching, and HTML report generation.

### 12.1 Report Templates Service

**File:** `src/services/reportTemplates.service.js`

Manages report template CRUD operations and generation logging.

```javascript
class ReportTemplatesService {
  constructor() {
    this.tableName = 'report_templates';
    this.generationsTable = 'report_generations';
  }

  // ==================== Template Methods ====================
  
  async getAllTemplates(projectId) {
    // Returns all templates (system + project-specific)
    // System templates have project_id = null
    const { data } = await supabase
      .from(this.tableName)
      .select('*')
      .or(`project_id.is.null,project_id.eq.${projectId}`)
      .is('deleted_at', null)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });
    return data || [];
  }

  async getTemplateById(templateId) {
    // Returns single template with full definition
  }

  async createTemplate(template) {
    // Creates new template, handles is_default flag
    // If is_default = true, unsets other defaults first
  }

  async updateTemplate(templateId, updates) {
    // Updates template, handles is_default toggle
  }

  async deleteTemplate(templateId) {
    // Soft delete - sets deleted_at timestamp
  }

  // ==================== Generation Methods ====================
  
  async logGeneration(generation) {
    // Logs report generation to report_generations table
    // Stores: template_id, project_id, generated_by, parameters_used, output_html
  }

  async getRecentGenerations(projectId, limit = 5) {
    // Returns recent report generations for display
    const { data } = await supabase
      .from(this.generationsTable)
      .select(`
        *,
        template:template_id(name, code),
        user:generated_by(full_name)
      `)
      .eq('project_id', projectId)
      .order('generated_at', { ascending: false })
      .limit(limit);
    return data || [];
  }
}

export const reportTemplatesService = new ReportTemplatesService();
```

### 12.2 Report Data Fetcher Service

**File:** `src/services/reportDataFetcher.service.js`

Fetches data for each report section type with caching.

```javascript
class ReportDataFetcherService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  // Main entry point
  async fetchSectionData(sectionType, projectId, parameters) {
    const cacheKey = this.getCacheKey(sectionType, projectId, parameters);
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const data = await this.fetchData(sectionType, projectId, parameters);
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }

  // Section-specific fetchers
  async fetchData(sectionType, projectId, params) {
    switch (sectionType) {
      case 'executive_summary':
        return this.fetchExecutiveSummary(projectId, params);
      case 'milestone_summary':
        return this.fetchMilestones(projectId, params);
      case 'deliverable_summary':
        return this.fetchDeliverables(projectId, params);
      case 'kpi_performance':
        return this.fetchKPIPerformance(projectId, params);
      case 'budget_analysis':
        return this.fetchBudgetAnalysis(projectId, params);
      case 'resource_summary':
        return this.fetchResources(projectId, params);
      case 'timesheet_summary':
        return this.fetchTimesheets(projectId, params);
      case 'expense_summary':
        return this.fetchExpenses(projectId, params);
      case 'raid_summary':
        return this.fetchRAIDItems(projectId, params);
      case 'lessons_learned':
        return this.fetchLessonsLearned(projectId, params);
      case 'forward_look':
        return this.fetchForwardLook(projectId, params);
      default:
        return {};
    }
  }

  // Cache management
  clearCache(projectId = null) {
    if (projectId) {
      // Clear only project-specific cache entries
      for (const key of this.cache.keys()) {
        if (key.includes(projectId)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

export const reportDataFetcherService = new ReportDataFetcherService();
```

**Section Data Shapes:**

| Section Type | Data Returned |
|--------------|---------------|
| `executive_summary` | Project details, overall health metrics, key highlights |
| `milestone_summary` | Milestones with status, progress %, date range filter applied |
| `deliverable_summary` | Deliverables grouped by milestone, completion rates |
| `kpi_performance` | KPI records with assessments, targets vs actuals |
| `budget_analysis` | Budget vs actuals, variance calculations, burn rate |
| `resource_summary` | Team members, allocations, utilisation rates |
| `timesheet_summary` | Hours by resource, task breakdown, period totals |
| `expense_summary` | Expenses by category, vendor analysis, approval status |
| `raid_summary` | Risks, Assumptions, Issues, Decisions with RAG status |
| `lessons_learned` | Completed lessons with categories and outcomes |
| `forward_look` | Upcoming milestones, scheduled deliverables, planned activities |

### 12.3 Report Renderer Service

**File:** `src/services/reportRenderer.service.js`

Generates complete HTML reports from template definitions and data.

```javascript
class ReportRendererService {
  constructor() {
    this.styles = this.getBaseStyles();
  }

  async renderReport(template, context, sectionData) {
    const html = [];
    
    // Document wrapper
    html.push(this.renderDocumentOpen(template, context));
    
    // Cover page (if enabled)
    if (template.cover_page?.enabled) {
      html.push(this.renderCoverPage(template, context));
    }
    
    // Table of contents (if enabled)
    if (template.toc?.enabled) {
      html.push(this.renderTableOfContents(template.sections));
    }
    
    // Render each section
    for (const section of template.sections) {
      const data = sectionData[section.type] || {};
      html.push(await this.renderSection(section, data, context));
    }
    
    // Document close
    html.push(this.renderDocumentClose());
    
    return html.join('\n');
  }

  // Section renderers
  renderExecutiveSummary(section, data, context) { /* ... */ }
  renderMilestoneSummary(section, data, context) { /* ... */ }
  renderDeliverableSummary(section, data, context) { /* ... */ }
  renderKPIPerformance(section, data, context) { /* ... */ }
  renderBudgetAnalysis(section, data, context) { /* ... */ }
  renderResourceSummary(section, data, context) { /* ... */ }
  renderTimesheetSummary(section, data, context) { /* ... */ }
  renderExpenseSummary(section, data, context) { /* ... */ }
  renderRAIDSummary(section, data, context) { /* ... */ }
  renderLessonsLearned(section, data, context) { /* ... */ }
  renderForwardLook(section, data, context) { /* ... */ }

  // Utility methods
  getBaseStyles() {
    return `
      /* Print-optimised styles */
      @media print {
        .page-break { page-break-before: always; }
        .no-print { display: none; }
      }
      /* ... comprehensive stylesheet ... */
    `;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount || 0);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getStatusBadgeClass(status) {
    const statusMap = {
      'on_track': 'badge-success',
      'at_risk': 'badge-warning',
      'off_track': 'badge-danger',
      'completed': 'badge-info'
    };
    return statusMap[status] || 'badge-default';
  }
}

export const reportRendererService = new ReportRendererService();
```

### 12.4 Service Integration Pattern

```javascript
// Usage in PreviewGenerate component
import { reportTemplatesService } from '@/services/reportTemplates.service';
import { reportDataFetcherService } from '@/services/reportDataFetcher.service';
import { reportRendererService } from '@/services/reportRenderer.service';

async function generateReport(template, project, user, dateRange) {
  // 1. Build context
  const context = {
    project,
    user,
    generatedAt: new Date().toISOString(),
    dateRange
  };

  // 2. Fetch data for each section
  const sectionData = {};
  for (const section of template.sections) {
    sectionData[section.type] = await reportDataFetcherService
      .fetchSectionData(section.type, project.id, section.parameters);
  }

  // 3. Render HTML
  const html = await reportRendererService.renderReport(
    template,
    context,
    sectionData
  );

  // 4. Log generation (optional)
  await reportTemplatesService.logGeneration({
    template_id: template.id,
    project_id: project.id,
    generated_by: user.id,
    parameters_used: template.sections.map(s => s.parameters),
    output_html: html
  });

  return html;
}
```

### 12.5 Database Tables

**report_templates:**
```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id), -- NULL for system templates
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  template_definition JSONB NOT NULL, -- Sections, parameters, styling
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);
```

**report_generations:**
```sql
CREATE TABLE report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id),
  project_id UUID REFERENCES projects(id) NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  parameters_used JSONB,
  output_html TEXT,
  file_url VARCHAR(500) -- If saved to storage
);
```

---

## Summary

The AMSF001 service layer provides:

| Aspect | Implementation |
|--------|----------------|
| **Base Class** | Reusable CRUD with soft delete, filtering, sanitization |
| **Entity Services** | Milestones, Deliverables, Resources, Timesheets, Expenses |
| **Supporting Services** | Partners, KPIs, Quality Standards, RAID, Variations |
| **Aggregation** | Metrics (centralized), Dashboard (layout), Invoicing |
| **Documents** | Template management, HTML rendering engine |
| **Smart Features** | AI receipt scanning with learning |
| **Calculations** | Centralised business logic libraries |
| **Caching** | Service-level with namespace invalidation |
| **Error Handling** | Consistent logging and throwing patterns |
| **Report Builder** | Template management, data fetching, HTML rendering |

All services use the singleton pattern and are exported through a barrel file for clean imports throughout the application.

---

*Document created for AMSF001 Project Tracker - Session 1.8*
