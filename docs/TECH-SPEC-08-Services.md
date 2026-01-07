# AMSF001 Technical Specification - Service Layer

**Document Version:** 5.2  
**Created:** 11 December 2025  
**Updated:** 7 January 2026  
**Session:** 1.8.3  
**Status:** Complete

> **Version 5.2 Updates (7 January 2026):**
> - Added Section 17: Workflow System (consolidated from WORKFLOW-SYSTEM-DOCUMENTATION.md)
> - Documents 13 workflow categories, role permissions, service API, deep linking
>
> **Version 5.1 Updates (7 January 2026):**
> - Added Section 16: Evaluator Services (cross-reference to TECH-SPEC-11)
> - Updated Section 1.3 file structure to include evaluator/ subfolder
> - Reference to TECH-SPEC-11-Evaluator.md for comprehensive Evaluator documentation

> **Version 5.0 Updates (6 January 2026):**
> - Added Section 15.1.2: Tracker Sync Methods (syncFromTracker, hardDelete, purgeSoftDeleted)
> - Documents Tracker-as-Master sync pattern for committed items
> - Added field sync mapping table (Tracker → Planner)

> **Version 4.0 Updates (28 December 2025):**
> - Added Section 15: Planning & Estimator Services
> - Documents planItems.service.js (18 methods)
> - Documents estimates.service.js (14 methods + nested services)
> - Documents benchmarkRates.service.js (8 methods + rate lookup)
> - Updated file structure listing

> **Version 3.0 Updates (24 December 2025):**
> - Added Section 4.8: Subscription Service (tier limits, usage tracking)
> - Added Section 4.9: Invitation Service (email invitations)
> - Updated organisation.service.js with limit checking parameter
> - Updated file structure listing

> **Version 2.0 Updates (23 December 2025):**
> - Added Section 4: Organisation Services (new for multi-tenancy)
> - Updated file structure listing
> - Updated service architecture diagram
> - Renumbered subsequent sections (Entity Services now Section 5)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Service Architecture](#2-service-architecture)
3. [Base Service Class](#3-base-service-class)
4. [Organisation Services](#4-organisation-services) *(NEW)*
5. [Entity Services](#5-entity-services)
6. [Supporting Entity Services](#6-supporting-entity-services)
7. [Aggregation Services](#7-aggregation-services)
8. [Document Services](#8-document-services)
9. [Smart Feature Services](#9-smart-feature-services)
10. [Calculation Libraries](#10-calculation-libraries)
11. [Caching Strategies](#11-caching-strategies)
12. [Error Handling Patterns](#12-error-handling-patterns)
13. [Report Builder Services](#13-report-builder-services)
14. [Document History](#14-document-history)
15. [Planning & Estimator Services](#15-planning--estimator-services) *(NEW - December 2025)*
16. [Evaluator Services](#16-evaluator-services) *(NEW - January 2026)*
17. [Workflow System](#17-workflow-system) *(NEW - January 2026)*

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
│  (AuthContext, OrganisationContext, ProjectContext, etc.)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ BaseService │  │Organisation │  │  Document   │         │
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
├── # Organisation Services (NEW - December 2025)
├── organisation.service.js     # Multi-tenancy, member management
├── invitation.service.js       # Email invitations (NEW)
├── subscription.service.js     # Tier limits & usage (NEW)
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
├── standards.service.js        # Network standards
├── workflow.service.js         # Workflow management
├── email.service.js            # Email sending
├── syncService.js              # Data sync utilities
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
├── # Smart Feature Services
├── receiptScanner.service.js
│
├── # Planning & Estimator Services (NEW - December 2025)
├── planItems.service.js
├── estimates.service.js
├── benchmarkRates.service.js
│
└── evaluator/                  # Evaluator Services (NEW - January 2026)
    ├── index.js                # Barrel exports
    ├── base.evaluator.service.js
    ├── ai.service.js
    ├── approvals.service.js
    ├── clientPortal.service.js
    ├── comments.service.js
    ├── emailNotifications.service.js
    ├── evaluationCategories.service.js
    ├── evaluationDocuments.service.js
    ├── evaluationProjects.service.js
    ├── evidence.service.js
    ├── requirements.service.js
    ├── scores.service.js
    ├── stakeholderAreas.service.js
    ├── surveys.service.js
    ├── traceability.service.js
    ├── vendorQuestions.service.js
    ├── vendors.service.js
    └── workshops.service.js
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

## 4. Organisation Services (NEW - December 2025)

**File:** `src/services/organisation.service.js`  
**Version:** 1.0  
**Created:** 22 December 2025

### 4.1 Purpose

The Organisation Service manages multi-tenancy operations at the organisation level. Unlike project-scoped services that extend BaseService, this service operates independently to handle:

- Organisation CRUD operations
- Member management (invite, remove, role changes)
- Settings and feature flag management
- Organisation-level statistics

### 4.2 Class Structure

```javascript
import { supabase } from '../lib/supabase';
import { ORG_ROLES } from '../lib/permissionMatrix';

export class OrganisationService {
  constructor() {
    this.tableName = 'organisations';
  }
  // Methods...
}

// Singleton export
export const organisationService = new OrganisationService();
```

### 4.3 CRUD Operations

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getById(id)` | Organisation UUID | `Object\|null` | Get organisation by ID |
| `getBySlug(slug)` | URL slug | `Object\|null` | Get organisation by slug |
| `create(data, ownerId)` | Org data, owner UUID | `Object` | Create organisation with owner |
| `update(id, updates)` | UUID, update fields | `Object` | Update organisation |
| `delete(id)` | UUID | `boolean` | Soft delete (deactivate) |

**Create Example:**

```javascript
const org = await organisationService.create({
  name: 'Acme Corporation',
  slug: 'acme-corp',
  display_name: 'Acme Corp',
  settings: {
    features: { ai_chat_enabled: true },
    defaults: { currency: 'USD' }
  }
}, currentUserId);
```

### 4.4 Settings Management

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `updateSettings(id, settings)` | UUID, settings object | `Object` | Merge update settings |
| `toggleFeature(id, feature, enabled)` | UUID, feature key, bool | `Object` | Toggle feature flag |

**Settings Structure:**

```javascript
{
  features: {
    ai_chat_enabled: boolean,
    receipt_scanner_enabled: boolean,
    variations_enabled: boolean,
    report_builder_enabled: boolean
  },
  defaults: {
    currency: 'GBP',
    hours_per_day: 8,
    date_format: 'DD/MM/YYYY',
    timezone: 'Europe/London'
  },
  branding: {},
  limits: {}
}
```

### 4.5 Member Management

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getMembers(orgId)` | Organisation UUID | `Array` | Get all org members with profiles |
| `addMember(orgId, userId, role, invitedBy, options)` | UUIDs, role, options | `Object` | Add member to org |
| `removeMember(orgId, userId)` | UUIDs | `boolean` | Remove member (not owner) |
| `changeMemberRole(orgId, userId, newRole)` | UUIDs, role | `Object` | Change member's role |
| `getUserRole(orgId, userId)` | UUIDs | `string\|null` | Get user's org role |

**addMember Options (NEW - December 2025):**
```typescript
interface AddMemberOptions {
  skipLimitCheck?: boolean;  // Skip member limit check (for system admin)
}
```

**Organisation Roles:**

```javascript
ORG_ROLES = {
  ORG_OWNER: 'org_owner',   // Full control, cannot be removed
  ORG_ADMIN: 'org_admin',   // Manage members, access all projects
  ORG_MEMBER: 'org_member'  // Access only assigned projects
}
```

**Member Management Example:**

```javascript
// Add a new admin
await organisationService.addMember(
  organisationId,
  newUserId,
  ORG_ROLES.ORG_ADMIN,
  currentUserId // who invited
);

// Get all members with profile info
const members = await organisationService.getMembers(organisationId);
// Returns: [{ id, user_id, org_role, user: { email, full_name } }, ...]
```

### 4.6 Project & Statistics

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getProjects(orgId)` | Organisation UUID | `Array` | Get all org projects |
| `getStatistics(orgId)` | Organisation UUID | `Object` | Get member/project counts |

**Statistics Example:**

```javascript
const stats = await organisationService.getStatistics(organisationId);
// Returns: { memberCount: 12, projectCount: 5 }
```

### 4.7 Key Differences from BaseService

| Aspect | BaseService | OrganisationService |
|--------|-------------|---------------------|
| Scope | Project-scoped | Organisation-scoped |
| Extends | BaseService class | Standalone class |
| Soft Delete | Via `deleted_at` | Via `is_active` flag |
| Member Mgmt | N/A | Built-in |
| Settings | N/A | Built-in with merge |

---

### 4.8 Subscription Service (NEW - December 2025)

**File:** `src/services/subscription.service.js`  
**Version:** 1.0  
**Created:** 24 December 2025

Manages subscription tiers, limit checking, and usage tracking.

#### 4.8.1 Purpose

The Subscription Service handles:
- Tier-based limit enforcement (members, projects, storage)
- Feature flag checking based on tier
- Usage statistics for dashboards
- Upgrade prompts and limit error generation

#### 4.8.2 Class Structure

```javascript
import { supabase } from '../lib/supabase';
import { getTierConfig, getTierLimit, tierHasFeature } from '../lib/subscriptionTiers';

export class SubscriptionService {
  // Methods...
}

export const subscriptionService = new SubscriptionService();
```

#### 4.8.3 Tier Information Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getOrganisationTier(orgId)` | UUID | `string` | Get org's subscription tier |
| `getTierLimits(tier)` | tier name | `Object` | Get all limits for tier |

#### 4.8.4 Count Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getMemberCount(orgId)` | UUID | `number` | Active members count |
| `getProjectCount(orgId)` | UUID | `number` | Non-deleted projects count |
| `getPendingInvitationCount(orgId)` | UUID | `number` | Pending invitations count |

#### 4.8.5 Limit Checking Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `checkMemberLimit(orgId)` | UUID | `LimitCheck` | Check member limit |
| `checkProjectLimit(orgId)` | UUID | `LimitCheck` | Check project limit |
| `checkLimit(orgId, limitType)` | UUID, type | `LimitCheck` | Generic limit check |

**LimitCheck Return Type:**
```typescript
interface LimitCheck {
  allowed: boolean;      // Can add more?
  current: number;       // Current count
  limit: number;         // Maximum allowed (Infinity if unlimited)
  remaining: number;     // How many more can be added
  tier: string;          // Current tier name
}
```

**Example Usage:**
```javascript
const check = await subscriptionService.checkMemberLimit(orgId);
// Returns: { allowed: true, current: 5, limit: Infinity, remaining: Infinity, tier: 'free' }

if (!check.allowed) {
  throw new Error(`Member limit reached: ${check.current}/${check.limit}`);
}
```

#### 4.8.6 Feature Checking

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `hasFeature(orgId, featureName)` | UUID, feature | `boolean` | Check if feature enabled |

**Available Features:**
- `ai_chat` - AI chat assistant
- `receipt_scanner` - Receipt OCR
- `variations` - Contract variations
- `report_builder` - Custom reports
- `custom_branding` - Logo/colors
- `api_access` - API keys
- `audit_log` - Audit logging
- `advanced_permissions` - Advanced roles

#### 4.8.7 Usage Dashboard

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getCurrentUsage(orgId)` | UUID | `UsageStats` | Comprehensive usage for dashboard |

**UsageStats Return Type:**
```typescript
interface UsageStats {
  tier: string;
  members: { current: number; limit: number; percentage: number };
  projects: { current: number; limit: number; percentage: number };
  storage: { current: number; limit: number; percentage: number };
  features: { [key: string]: boolean };
}
```

#### 4.8.8 Error Generation

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createLimitError(limitType, limitCheck, orgId)` | type, check, UUID | `LimitError` | Structured error with upgrade info |

**LimitError Structure:**
```javascript
{
  code: 'MEMBER_LIMIT_EXCEEDED',
  message: 'Member limit reached (10/10)',
  current: 10,
  limit: 10,
  tier: 'starter',
  upgradeUrl: '/admin/billing',
  nextTier: { name: 'professional', limit: 50 }
}
```

#### 4.8.9 Current Tier Configuration

> **Note:** Free tier is currently set to unlimited. When paid tiers are enabled, these limits will apply:

| Tier | Members | Projects | Storage | Price |
|------|---------|----------|---------|-------|
| Free | ∞ | ∞ | ∞ | £0 |
| Starter | 10 | 5 | 1GB | £29/mo |
| Professional | 50 | 25 | 10GB | £79/mo |
| Enterprise | ∞ | ∞ | ∞ | Custom |

---

### 4.9 Invitation Service (NEW - December 2025)

**File:** `src/services/invitation.service.js`  
**Version:** 2.0  
**Updated:** 24 December 2025

Manages organisation email invitations.

#### 4.9.1 Purpose

The Invitation Service handles:
- Creating and sending email invitations
- Token generation and validation
- Invitation acceptance flow
- Resend and revoke functionality
- **Limit checking before creating invitations** (NEW)

#### 4.9.2 Class Structure

```javascript
import { supabase } from '../lib/supabase';

export class InvitationService {
  constructor() {
    this.tableName = 'org_invitations';
    this.defaultExpiryDays = 7;
  }
  // Methods...
}

export const invitationService = new InvitationService();
```

#### 4.9.3 Invitation Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createInvitation(orgId, email, role, invitedBy, options)` | UUIDs, email, role, options | `InviteResult` | Create and send invitation |
| `getPendingInvitations(orgId)` | UUID | `Array` | Get all pending invitations |
| `getInvitationByToken(token)` | token string | `Object\|null` | Get invitation by token |
| `acceptInvitation(token, userId)` | token, UUID | `AcceptResult` | Accept invitation |
| `resendInvitation(invitationId)` | UUID | `Object` | Resend with new token |
| `revokeInvitation(invitationId)` | UUID | `boolean` | Delete invitation |

#### 4.9.4 createInvitation Options

```typescript
interface CreateInvitationOptions {
  skipLimitCheck?: boolean;  // Skip member limit check (for system admin)
  expiryDays?: number;       // Override default 7-day expiry
}
```

**Limit Check Behavior (NEW):**
```javascript
// Default: checks limit before creating invitation
const result = await invitationService.createInvitation(orgId, email, 'org_member', userId);

// With skip: bypasses limit check (for admin operations)
const result = await invitationService.createInvitation(
  orgId, email, 'org_member', userId, 
  { skipLimitCheck: true }
);
```

**Limit Check Logic:**
```javascript
// Counts both active members AND pending invitations against limit
const memberCount = await subscriptionService.getMemberCount(orgId);
const pendingCount = await subscriptionService.getPendingInvitationCount(orgId);
const totalCount = memberCount + pendingCount;

if (totalCount >= limit) {
  return { 
    success: false, 
    error: 'LIMIT_EXCEEDED',
    code: 'MEMBER_LIMIT_EXCEEDED'
  };
}
```

#### 4.9.5 Return Types

**InviteResult:**
```typescript
interface InviteResult {
  success: boolean;
  invitation?: {
    id: string;
    token: string;
    email: string;
    expires_at: string;
  };
  error?: string;
  code?: string;  // e.g., 'MEMBER_LIMIT_EXCEEDED', 'ALREADY_MEMBER'
}
```

**AcceptResult:**
```typescript
interface AcceptResult {
  success: boolean;
  membership?: {
    id: string;
    organisation_id: string;
    org_role: string;
  };
  error?: string;
}
```

#### 4.9.6 Token Generation

```javascript
// Generates secure random token
generateToken() {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

// Example: "550e8400-e29b-41d4-a716-446655440000-lxk8v7b"
```

#### 4.9.7 Email Sending

Invitations are sent via the Resend API:

```javascript
await fetch('/api/send-invitation-email', {
  method: 'POST',
  body: JSON.stringify({
    to: email,
    inviterName: inviter.full_name,
    organisationName: org.name,
    acceptUrl: `${baseUrl}/accept-invitation/${token}`,
    expiresAt: invitation.expires_at
  })
});
```

#### 4.9.8 Invitation Lifecycle

```
Create Invitation
      │
      ├─► Check member limit (unless skipLimitCheck)
      │
      ├─► Check if already member → Error
      │
      ├─► Check if pending invitation exists → Resend existing
      │
      ├─► Generate token, set expiry (7 days)
      │
      ├─► Insert into org_invitations
      │
      ├─► Send email via Resend API
      │
      └─► Return invitation details

Accept Invitation
      │
      ├─► Validate token exists and not expired
      │
      ├─► Create user_organisations record
      │
      ├─► Delete invitation record
      │
      └─► Return membership details
```

---

## 5. Entity Services

### 5.1 Milestones Service

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

### 5.2 Deliverables Service

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

### 5.3 Resources Service

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

### 5.4 Timesheets Service

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

### 5.5 Expenses Service

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

## 6. Supporting Entity Services

### 6.1 Partners Service

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

### 6.2 KPIs Service

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

### 6.3 Quality Standards Service

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

### 6.4 RAID Service

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

### 6.5 Variations Service

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

## 7. Aggregation Services

### 7.1 Metrics Service

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

### 7.2 Dashboard Service

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

### 7.3 Invoicing Service

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

## 8. Document Services

### 8.1 Document Templates Service

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

### 8.2 Document Renderer Service

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

## 9. Smart Feature Services

### 9.1 Receipt Scanner Service

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

## 10. Calculation Libraries

### 10.1 Milestone Calculations

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

### 10.2 Deliverable Calculations

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

### 10.3 Timesheet Calculations

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

## 11. Caching Strategies

### 11.1 Service-Level Caching

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

### 11.2 Metrics Service Caching

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

### 11.3 Cache Invalidation Patterns

| Event | Action |
|-------|--------|
| Record created | Invalidate namespace |
| Record updated | Invalidate namespace |
| Record deleted | Invalidate namespace |
| Project switch | Clear all caches |
| User logout | Clear all caches |

---

## 12. Error Handling Patterns

### 12.1 Standard Error Pattern

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

### 12.2 Validation Errors

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

### 12.3 Business Rule Errors

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

### 12.4 Graceful Fallbacks

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

## 13. Report Builder Services

The Report Builder feature uses three specialised services that work together to provide template management, data fetching, and HTML report generation.

### 13.1 Report Templates Service

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

### 13.2 Report Data Fetcher Service

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

### 13.3 Report Renderer Service

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

### 13.4 Service Integration Pattern

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

### 13.5 Database Tables

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

---

## 14. Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 11 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 17 Dec 2025 | Claude AI | Added Report Builder Services section |
| 2.0 | 23 Dec 2025 | Claude AI | **Organisation Multi-Tenancy**: Added Section 4 (Organisation Services), updated file structure, updated architecture diagram, renumbered sections 5-14 |
| 3.0 | 24 Dec 2025 | Claude AI | **Subscription & Invitations**: Added Section 4.8 (Subscription Service), Section 4.9 (Invitation Service), updated addMember with skipLimitCheck option |
| 4.0 | 28 Dec 2025 | Claude AI | **Planning & Estimator Services**: Added Section 15 with planItems.service, estimates.service, benchmarkRates.service documentation |
| 5.0 | 6 Jan 2026 | Claude AI | **Tracker Sync Methods**: Added Section 15.1.2 documenting syncFromTracker, hardDelete, purgeSoftDeleted methods |
| 5.1 | 7 Jan 2026 | Claude AI | **Evaluator Services Reference**: Added Section 16 with cross-reference to TECH-SPEC-11-Evaluator.md, updated file structure to include evaluator/ subfolder |

---

## 15. Planning & Estimator Services

> **Added:** 28 December 2025
>
> Services supporting WBS planning, cost estimation, and SFIA 8 rate benchmarking.

### 15.1 Plan Items Service

**File:** `src/services/planItems.service.js`

**Purpose:** CRUD operations for hierarchical Work Breakdown Structure (WBS) items.

**Dependencies:**
- BaseService (extends)
- Supabase client

**Table:** `plan_items`

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getByProject` | projectId | Array | Get all items for project |
| `getByParent` | parentId | Array | Get children of parent |
| `getHierarchy` | projectId | Array | Get nested tree structure |
| `create` | data | Object | Create new item |
| `update` | id, data | Object | Update item |
| `delete` | id | Boolean | Soft delete item |
| `deleteWithChildren` | id | Number | Cascade delete with children |
| `reorder` | id, newPosition, parentId | Boolean | Move item in list |
| `updateProgress` | id, progress | Object | Update progress % |
| `updateStatus` | id, status | Object | Update status |
| `bulkCreate` | items | Array | Create multiple items |
| `bulkUpdate` | items | Array | Update multiple items |
| `importStructure` | projectId, structure | Array | Import from AI |
| `exportStructure` | projectId | Object | Export as JSON |
| `calculateWBS` | projectId | Array | Recalculate WBS numbers |
| `getEstimateLinks` | itemId | Array | Get linked estimates |
| `linkToEstimate` | itemId, componentId | Object | Link to estimate |
| `unlinkFromEstimate` | itemId | Boolean | Remove estimate link |

#### Import Structure Method

```javascript
async importStructure(projectId, structure) {
  const items = [];
  let sortOrder = 0;

  const processItem = async (item, parentId = null, level = 1) => {
    const newItem = await this.create({
      project_id: projectId,
      parent_id: parentId,
      name: item.name,
      description: item.description,
      item_type: item.item_type,
      duration_days: item.duration_days,
      sort_order: sortOrder++,
      level
    });
    items.push(newItem);

    if (item.children?.length) {
      for (const child of item.children) {
        await processItem(child, newItem.id, level + 1);
      }
    }
  };

  for (const rootItem of structure) {
    await processItem(rootItem);
  }

  await this.calculateWBS(projectId);
  return items;
}
```

#### WBS Calculation

```javascript
async calculateWBS(projectId) {
  const items = await this.getByProject(projectId);
  const updateWBS = (items, prefix = '') => {
    let counter = 1;
    return items.map(item => {
      const wbs = prefix ? `${prefix}.${counter}` : `${counter}`;
      counter++;
      const children = items.filter(i => i.parent_id === item.id);
      return {
        ...item,
        wbs_number: wbs,
        children: updateWBS(children, wbs)
      };
    });
  };

  const rootItems = items.filter(i => !i.parent_id);
  return updateWBS(rootItems);
}
```

---

### 15.1.1 Plan Commit Service

> **Added:** 5 January 2026

**File:** `src/services/planCommitService.js`

**Purpose:** Manages the commit workflow from Planning tool to Milestone Tracker, including baseline protection and variation creation.

**Dependencies:**
- Supabase client
- milestonesService
- deliverablesService
- variationsService

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `commitPlan` | projectId, userId | Object | Commits unpublished plan items to Tracker |
| `detectBaselineChanges` | projectId | Array | Finds changes affecting locked baselines |
| `getPublishedItems` | projectId | Array | Gets all published items with linked records |
| `getMilestoneForItem` | item | Object/null | Gets linked milestone (checks baseline lock) |
| `validatePlanForCommit` | items | Object | Validates plan before commit |
| `getCommitSummary` | items | Object | Calculates commit statistics |

#### Helper Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `mapPlanStatusToTracker` | planStatus | String | Maps plan_items status to milestone status |
| `mapTrackerStatusToPlan` | trackerStatus | String | Maps milestone status to plan_items status |

#### Status Mapping

```javascript
// plan_items (lowercase) → milestones (Title Case)
const STATUS_MAP = {
  'not_started': 'Not Started',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'on_hold': 'At Risk',
  'cancelled': 'Cancelled'
};
```

#### Commit Plan Method

```javascript
async commitPlan(projectId, userId) {
  // 1. Get unpublished milestones and deliverables
  const unpublished = await this.getUnpublishedItems(projectId);
  
  // 2. For each milestone: create in milestones table
  // 3. For each deliverable: create in deliverables table (with parent milestone)
  // 4. Update plan_items with published_milestone_id/published_deliverable_id
  // 5. Set is_published = true, published_at = now()
  
  return { 
    milestones: [...], 
    deliverables: [...], 
    count: n 
  };
}
```

#### Baseline Change Detection

```javascript
async detectBaselineChanges(projectId) {
  // 1. Get published plan_items that may have been modified
  // 2. Check if linked milestone has baseline_locked = true
  // 3. Compare current values with baseline values
  // 4. Return array of changes needing variations
  
  return [{
    planItemId,
    milestoneId,
    field,        // 'start_date', 'end_date', 'cost', etc.
    oldValue,
    newValue
  }];
}
```

---

### 15.1.2 Tracker Sync Methods

> **Added:** 6 January 2026

**File:** `src/services/planItemsService.js`

**Purpose:** Synchronizes committed plan items with Tracker data (Tracker-as-Master pattern).

#### Sync Pattern

```
Tracker (milestones, deliverables)   ← SOURCE OF TRUTH
         ↓ SELECT only
    syncFromTracker()
         ↓ UPDATE only
Planner (plan_items)                  ← UPDATED
```

**Key Principle:** Once committed, Tracker is the single source of truth. Planner shows read-only view of committed items.

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `syncFromTracker` | projectId | {synced, errors} | Updates plan_items from Tracker data |
| `hardDelete` | id | Boolean | Permanently removes item (bypasses soft-delete) |
| `purgeSoftDeleted` | projectId | {deleted: count} | Removes all soft-deleted items |

#### syncFromTracker Implementation

```javascript
async syncFromTracker(projectId) {
  // 1. Get all published plan_items
  const published = await supabase
    .from('plan_items')
    .select('id, published_milestone_id, published_deliverable_id')
    .eq('project_id', projectId)
    .eq('is_published', true)
    .eq('is_deleted', false);
  
  // 2. Fetch current milestone data (READ-ONLY)
  const milestones = await supabase
    .from('milestones')
    .select('id, status, percent_complete, start_date, forecast_end_date')
    .in('id', milestoneIds);
  
  // 3. Fetch current deliverable data (READ-ONLY)
  const deliverables = await supabase
    .from('deliverables')
    .select('id, status, progress, due_date')
    .in('id', deliverableIds);
  
  // 4. Update plan_items with Tracker values
  for (const item of published) {
    if (item.published_milestone_id) {
      const ms = milestonesMap.get(item.published_milestone_id);
      await supabase.from('plan_items').update({
        status: mapTrackerStatusToPlan(ms.status),
        progress: ms.percent_complete,
        start_date: ms.start_date,
        end_date: ms.forecast_end_date
      }).eq('id', item.id);
    }
  }
  
  return { synced: count, errors: [] };
}
```

#### Fields Synced from Tracker

| Tracker Table | Field | → | Plan Item Field |
|---------------|-------|---|-----------------|
| milestones | status | → | status (mapped) |
| milestones | percent_complete | → | progress |
| milestones | start_date | → | start_date |
| milestones | forecast_end_date | → | end_date |
| deliverables | status | → | status (mapped) |
| deliverables | progress | → | progress |
| deliverables | due_date | → | end_date |

---

### 15.2 Estimates Service

**File:** `src/services/estimates.service.js`

**Purpose:** Manage estimates with nested components, tasks, and resource allocations.

**Tables:** `estimates`, `estimate_components`, `estimate_tasks`, `estimate_resources`

#### Main Service Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getAll` | projectId | Array | Get all estimates for project |
| `getById` | id | Object | Get estimate with children |
| `create` | data | Object | Create new estimate |
| `update` | id, data | Object | Update estimate |
| `delete` | id | Boolean | Cascade delete estimate |
| `duplicate` | id, newName | Object | Clone estimate |
| `updateStatus` | id, status | Object | Change status |
| `calculateTotals` | id | Object | Recalculate all totals |
| `getByPlanItem` | planItemId | Array | Get estimates linked to plan |
| `linkToPlanItem` | estimateId, planItemId | Object | Link to plan item |
| `exportToExcel` | id | Blob | Export as XLSX |
| `importFromExcel` | projectId, file | Object | Import from XLSX |
| `applyTemplate` | templateId, estimateId | Object | Apply rate template |
| `compareVersions` | id1, id2 | Object | Diff two estimates |

#### Nested Service: Estimate Components

```javascript
estimates.components = {
  getByEstimate: (estimateId) => Array,
  create: (estimateId, data) => Object,
  update: (componentId, data) => Object,
  delete: (componentId) => Boolean,
  reorder: (componentId, newPosition) => Boolean,
  duplicate: (componentId) => Object,
};
```

#### Nested Service: Estimate Tasks

```javascript
estimates.tasks = {
  getByComponent: (componentId) => Array,
  create: (componentId, data) => Object,
  update: (taskId, data) => Object,
  delete: (taskId) => Boolean,
  bulkCreate: (componentId, tasks) => Array,
};
```

#### Nested Service: Estimate Resources

```javascript
estimates.resources = {
  getByTask: (taskId) => Array,
  create: (taskId, data) => Object,
  update: (resourceId, data) => Object,
  delete: (resourceId) => Boolean,
  bulkUpdate: (resources) => Array,
  calculateCost: (resourceId) => Number,
};
```

#### Totals Calculation

```javascript
async calculateTotals(estimateId) {
  const estimate = await this.getById(estimateId);
  let totalDays = 0;
  let totalCost = 0;

  for (const component of estimate.components) {
    let componentDays = 0;
    let componentCost = 0;

    for (const task of component.tasks) {
      for (const resource of task.resources) {
        const days = Object.keys(resource)
          .filter(k => k.startsWith('month_'))
          .reduce((sum, k) => sum + (resource[k] || 0), 0);
        const rate = await benchmarkRatesService.getRate(
          resource.skill_id,
          resource.sfia_level,
          resource.tier_id
        );
        componentDays += days;
        componentCost += days * rate;
      }
    }

    // Apply component quantity
    const quantity = component.quantity || 1;
    totalDays += componentDays * quantity;
    totalCost += componentCost * quantity;
  }

  return this.update(estimateId, {
    total_days: totalDays,
    total_cost: totalCost,
    updated_at: new Date().toISOString()
  });
}
```

---

### 15.3 Benchmark Rates Service

**File:** `src/services/benchmarkRates.service.js`

**Purpose:** SFIA 8 rate management and lookup for estimating.

**Table:** `benchmark_rates`

**Dependencies:**
- SFIA 8 reference data (`sfia8-reference-data.js`)
- Supabase client

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getAllRates` | - | Array | Get all benchmark rates |
| `getRatesByCategory` | categoryId | Array | Get rates for category |
| `getRatesBySubcategory` | subcategoryId | Array | Get rates for subcategory |
| `getRate` | skillId, sfiaLevel, tierId | Number | Get specific rate |
| `updateRate` | rateId, data | Object | Update rate value |
| `bulkUpdateRates` | rates | Array | Update multiple rates |
| `buildRateLookup` | - | Object | Build lookup hash map |
| `getSkillInfo` | skillId | Object | Get skill details |

#### Rate Lookup

```javascript
async buildRateLookup() {
  const rates = await this.getAllRates();
  const lookup = {};

  for (const rate of rates) {
    const key = `${rate.skill_id}-${rate.sfia_level}-${rate.tier_id}`;
    lookup[key] = rate.day_rate;
  }

  return lookup;
}

// Usage in Estimator
const rateLookup = await benchmarkRatesService.buildRateLookup();
const rate = rateLookup['BUAN-5-mid'] || FALLBACK_RATES['mid'];
```

#### Tier Multipliers

```javascript
const TIER_MULTIPLIERS = {
  contractor: 1.0,    // Base rate
  boutique: 1.3,      // +30%
  mid: 1.5,           // +50%
  big4: 1.9,          // +90%
};

// Rate calculation from base
function calculateTierRate(baseRate, tierId) {
  return Math.round(baseRate * TIER_MULTIPLIERS[tierId]);
}
```

#### SFIA 8 Reference Data

```javascript
// sfia8-reference-data.js
export const CATEGORIES = [
  { id: 'STGY', name: 'Strategy and architecture', skills: 20 },
  { id: 'CHNG', name: 'Change and transformation', skills: 13 },
  { id: 'DVMT', name: 'Development and implementation', skills: 19 },
  { id: 'DLVR', name: 'Delivery and operation', skills: 16 },
  { id: 'SKIL', name: 'Skills and quality', skills: 12 },
  { id: 'RLTN', name: 'Relationships and engagement', skills: 17 },
];

export const LEVELS = [
  { id: 1, name: 'Follow', description: 'Learning the basics...' },
  { id: 2, name: 'Assist', description: 'Works under supervision...' },
  { id: 3, name: 'Apply', description: 'Works independently...' },
  { id: 4, name: 'Enable', description: 'Enables others to work...' },
  { id: 5, name: 'Ensure, advise', description: 'Ensures others work...' },
  { id: 6, name: 'Initiate, influence', description: 'Strategic influence...' },
  { id: 7, name: 'Set strategy, inspire', description: 'Sets direction...' },
];

export const TIERS = [
  { id: 'contractor', name: 'Contractor', multiplier: 1.0 },
  { id: 'boutique', name: 'Boutique', multiplier: 1.3 },
  { id: 'mid', name: 'Mid-Tier', multiplier: 1.5 },
  { id: 'big4', name: 'Big 4', multiplier: 1.9 },
];

// Total: 97 skills across 19 subcategories
```

---

### 15.4 File Structure Update

```
src/services/
├── # Planning & Estimator Services (NEW)
├── planItems.service.js        # WBS plan item management
├── estimates.service.js        # Cost estimation
├── benchmarkRates.service.js   # SFIA 8 rate lookup
├── sfia8-reference-data.js     # SFIA 8 constants
│
├── # Existing services...
├── organisation.service.js
├── milestones.service.js
└── ...
```

---

### 15.5 Service Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Planning Page                             │
│                   (Planning.jsx)                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  planItemsService                            │
│  - getByProject()                                           │
│  - importStructure()  ◄─── PlanningAIAssistant              │
│  - calculateWBS()                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ linkToEstimate()
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  estimatesService                            │
│  - create(), getById(), calculateTotals()                   │
│    └── components.create(), tasks.create()                  │
│        └── resources.create(), resources.calculateCost()    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               benchmarkRatesService                          │
│  - buildRateLookup()                                        │
│  - getRate(skillId, sfiaLevel, tierId)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    benchmark_rates                           │
│                  (PostgreSQL table)                          │
│  ~1,500 rate combinations (97 skills × 7 levels × ~2 tiers) │
└─────────────────────────────────────────────────────────────┘
```

---

## 16. Evaluator Services

> **Added:** 7 January 2026
>
> **Reference:** See **TECH-SPEC-11-Evaluator.md Section 5** for comprehensive documentation.

The Evaluator module has 18 dedicated services in `src/services/evaluator/` for vendor evaluation and selection.

### 16.1 Service Summary

| Service | File | Purpose |
|---------|------|---------|
| Base | `base.evaluator.service.js` | Extended BaseService for evaluator entities |
| AI | `ai.service.js` | AI-powered document parsing, gap analysis, suggestions |
| Approvals | `approvals.service.js` | Workflow approval management |
| Client Portal | `clientPortal.service.js` | External client portal operations |
| Comments | `comments.service.js` | Evaluation comments and discussions |
| Email | `emailNotifications.service.js` | Evaluation email notifications |
| Categories | `evaluationCategories.service.js` | Requirement category management |
| Documents | `evaluationDocuments.service.js` | Evaluation document management |
| Projects | `evaluationProjects.service.js` | Core evaluation project CRUD |
| Evidence | `evidence.service.js` | Vendor evidence attachment |
| Requirements | `requirements.service.js` | Evaluation requirements management |
| Scores | `scores.service.js` | Vendor scoring operations |
| Stakeholders | `stakeholderAreas.service.js` | Stakeholder area management |
| Surveys | `surveys.service.js` | Stakeholder survey management |
| Traceability | `traceability.service.js` | Requirements traceability matrix |
| Vendor Questions | `vendorQuestions.service.js` | RFI question management |
| Vendors | `vendors.service.js` | Vendor profile management |
| Workshops | `workshops.service.js` | Workshop/demo scheduling |

### 16.2 Import Pattern

```javascript
// Import from evaluator barrel export
import { 
  evaluationProjectsService,
  requirementsService,
  vendorsService,
  scoresService
} from '../services/evaluator';

// Usage
const evaluation = await evaluationProjectsService.getById(evaluationId);
const requirements = await requirementsService.getByEvaluation(evaluationId);
```

### 16.3 Base Evaluator Service

Extends the core BaseService with evaluation-specific functionality:

```javascript
class BaseEvaluatorService extends BaseService {
  constructor(tableName) {
    super(tableName);
  }
  
  // Evaluator-specific: filter by evaluation_id instead of project_id
  async getByEvaluation(evaluationId) {
    return this.supabase
      .from(this.tableName)
      .select('*')
      .eq('evaluation_id', evaluationId)
      .eq('is_deleted', false);
  }
}
```

### 16.4 Cross-References

- **Frontend Pages:** See TECH-SPEC-07-Frontend-State.md Section 15
- **API Endpoints:** See TECH-SPEC-06-API-AI.md Section 10
- **Database Tables:** See TECH-SPEC-11-Evaluator.md Section 3
- **Full Service Documentation:** See TECH-SPEC-11-Evaluator.md Section 5

---

## 17. Workflow System

> **Added:** 7 January 2026
>
> Consolidated from WORKFLOW-SYSTEM-DOCUMENTATION.md

The Workflow System provides centralised tracking and management of pending actions across all entity types, enabling role-based filtering, timestamp tracking, and deep linking.

### 17.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Workflow System                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────────┐                │
│  │  WorkflowService │◄───│  NotificationContext │                │
│  └────────┬────────┘    └──────────┬───────────┘                │
│           │                        │                             │
│           ▼                        ▼                             │
│  ┌────────────────┐       ┌────────────────┐                    │
│  │ WorkflowSummary│       │NotificationBell│                    │
│  │     Page       │       │   Component    │                    │
│  └────────────────┘       └────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

| Component | Location | Purpose |
|-----------|----------|---------|
| `WorkflowService` | `src/services/workflow.service.js` | Centralised data fetching and business logic |
| `NotificationContext` | `src/contexts/NotificationContext.jsx` | React context for notification state |
| `WorkflowSummary` | `src/pages/WorkflowSummary.jsx` | Full workflow dashboard page |
| `NotificationBell` | `src/components/NotificationBell.jsx` | Header notification dropdown |

### 17.2 Workflow Categories

The system tracks **13 workflow categories** across **7 entity types**:

| Category ID | Label | Entity | Database Condition | Actionable By |
|-------------|-------|--------|-------------------|---------------|
| `timesheet` | Timesheet Approval | timesheets | `status = 'Submitted'` | Customer PM |
| `expense_chargeable` | Expense Validation (Chargeable) | expenses | `status = 'Submitted' AND chargeable_to_customer = true` | Customer PM |
| `expense_non_chargeable` | Expense Validation (Non-Chargeable) | expenses | `status = 'Submitted' AND chargeable_to_customer = false` | Supplier PM |
| `deliverable_review` | Deliverable Review | deliverables | `status = 'Submitted for Review'` | Customer PM |
| `deliverable_sign_supplier` | Deliverable Sign-off (Supplier) | deliverables | `status = 'Review Complete' AND supplier_pm_signed_at IS NULL` | Supplier PM |
| `deliverable_sign_customer` | Deliverable Sign-off (Customer) | deliverables | `status = 'Review Complete' AND customer_pm_signed_at IS NULL` | Customer PM |
| `variation_submitted` | Variation Submitted | variations | `status = 'submitted'` | Customer PM |
| `variation_awaiting_supplier` | Variation Awaiting Supplier | variations | `status = 'awaiting_supplier'` | Supplier PM |
| `variation_awaiting_customer` | Variation Awaiting Customer | variations | `status = 'awaiting_customer'` | Customer PM |
| `certificate_pending_supplier` | Certificate Pending Supplier | milestone_certificates | `status = 'Pending Supplier Signature'` | Supplier PM |
| `certificate_pending_customer` | Certificate Pending Customer | milestone_certificates | `status IN ('Pending Customer Signature', 'Submitted')` | Customer PM |
| `baseline_awaiting_supplier` | Baseline Awaiting Supplier | milestones | `baseline_locked = false AND baseline_supplier_pm_signed_at IS NULL` | Supplier PM |
| `baseline_awaiting_customer` | Baseline Awaiting Customer | milestones | `baseline_locked = false AND baseline_customer_pm_signed_at IS NULL AND baseline_supplier_pm_signed_at IS NOT NULL` | Customer PM |

### 17.3 Role Permission Matrix

| Category | Customer PM | Supplier PM | Admin |
|----------|-------------|-------------|-------|
| `timesheet` | ✅ Act | ❌ View | ✅ Act |
| `expense_chargeable` | ✅ Act | ❌ View | ✅ Act |
| `expense_non_chargeable` | ❌ View | ✅ Act | ✅ Act |
| `deliverable_review` | ✅ Act | ❌ View | ✅ Act |
| `deliverable_sign_supplier` | ❌ View | ✅ Act | ✅ Act |
| `deliverable_sign_customer` | ✅ Act | ❌ View | ✅ Act |
| `variation_*` | Role-dependent | Role-dependent | ✅ Act |
| `certificate_*` | Role-dependent | Role-dependent | ✅ Act |
| `baseline_*` | Role-dependent | Role-dependent | ✅ Act |

### 17.4 WorkflowService API

**File:** `src/services/workflow.service.js`

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getAllPendingItems` | `projectId, options` | `WorkflowItem[]` | All pending items with optional role filtering |
| `getItemsForRole` | `projectId, role` | `WorkflowItem[]` | Items actionable by specified role |
| `getItemsVisibleToRole` | `projectId, role` | `WorkflowItem[]` | All items visible to role (actionable + info) |
| `getCountsByCategory` | `projectId` | `CategoryCounts` | Counts per category for stat cards |
| `getUrgentItems` | `projectId, daysThreshold` | `WorkflowItem[]` | Items pending longer than threshold |

#### WorkflowItem Structure

```javascript
{
  id: 'uuid',
  type: 'timesheet',           // Category type
  category: 'timesheet',
  title: 'Week of 2025-12-09 - John Smith',
  subtitle: 'Submitted 2025-12-10',
  status: 'Submitted',
  submitted_at: '2025-12-10T14:30:00Z',
  daysPending: 6,
  action_url: '/timesheets?highlight=uuid',
  canAct: true,                // Can current user act?
  isUrgent: true,              // > 5 days pending
  entity: { /* full entity data */ }
}
```

### 17.5 Deep Linking

The workflow system supports deep linking via URL query parameters:

| Entity | URL Pattern |
|--------|-------------|
| Timesheet | `/timesheets?highlight={uuid}` |
| Expense | `/expenses?highlight={uuid}` |
| Deliverable | `/deliverables?highlight={uuid}` |
| Variation | `/variations?highlight={uuid}` |
| Milestone/Certificate | `/milestones/{uuid}` |

### 17.6 Visual Indicators

| Condition | Badge Color | Background |
|-----------|-------------|------------|
| Urgent + Actionable | Red (#dc2626) | Light red |
| Actionable | Green (#22c55e) | Light green (`bg-green-50`) |
| Urgent + Info Only | Amber (#f59e0b) | Light amber |
| Info Only | Blue (#3b82f6) | Default white |

### 17.7 Cross-References

- **NotificationContext:** See TECH-SPEC-07-Frontend-State.md Section 8
- **WorkflowSummary Page:** See TECH-SPEC-07-Frontend-State.md Section 10
