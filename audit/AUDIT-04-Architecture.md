# AUDIT-04: Architecture & Scalability

**Phase:** 4 of 6
**Status:** Complete
**Date:** 15 January 2026
**Auditor:** Claude Opus 4.5

---

## Executive Summary

This phase evaluated the application's architecture and scalability readiness for multi-tenant SaaS deployment. The architecture is well-designed with a strong foundation, but has areas requiring attention for enterprise-scale deployment.

**Overall Assessment:** GOOD with MODERATE improvements needed

**Key Statistics:**
- Findings: 0 Critical, 1 High, 3 Medium, 2 Low, 5 Informational
- Service Classes: 35+ (including 19 Evaluator services)
- React Contexts: 12
- Database Migrations: 92
- Lines of Code: ~186,000

**Strengths:**
- Well-structured context hierarchy with proper dependency management
- Consistent service layer pattern via BaseService
- Strong multi-tenancy foundation with Organisation → Project → Entity model
- Flexible settings via JSONB with feature flags support
- Good code splitting and lazy loading

**Key Concerns:**
- Service layer inconsistency (duplicate base classes, mixed patterns)
- AG Grid not standardized across modules
- No query caching library (manual implementation)
- Limited white-labeling implementation
- Count queries fetch all records (no SQL COUNT)

---

## Scope

**Areas Reviewed:**
- Service layer patterns and consistency
- Component reusability across modules
- Context hierarchy and dependencies
- State management efficiency
- Database schema and query patterns
- Caching strategies
- Multi-tenant scaling considerations
- SaaS readiness (feature flags, white-labeling)

**Files Analysed:**
- `src/services/*.js` (34 services)
- `src/services/evaluator/*.js` (19 services)
- `src/contexts/*.jsx` (12 contexts)
- `src/lib/cache.js`
- `src/lib/subscriptionTiers.js`
- `src/App.jsx`
- `supabase/migrations/*.sql` (92 files)
- Tech spec documentation

---

## Methodology

- Static code analysis of service patterns
- Architecture documentation review
- Database migration analysis
- Pattern matching for inconsistencies
- OWASP Architecture guidelines
- SaaS maturity model assessment

---

## Strengths

### 1. Context Hierarchy Design (Excellent)

The provider hierarchy in `App.jsx` is well-structured with proper dependency ordering:

```jsx
AuthProvider           // User authentication (no dependencies)
  OrganisationProvider // Fetches user's organisations (needs Auth)
    ProjectProvider    // Projects filtered by org (needs Auth + Org)
      EvaluationProvider
        ViewAsProvider // Role impersonation (needs Auth + Project)
          // ... remaining providers
```

This prevents circular dependencies and ensures data flows correctly.

### 2. BaseService Pattern (Good)

The `BaseService` class provides consistent CRUD operations:
- Project-scoped queries by default
- Soft delete support
- Input sanitisation
- Consistent error handling

### 3. Multi-Tenancy Foundation (Good)

Three-tier isolation model is well-implemented:
- **Organisation** → Top-level tenant with JSONB settings
- **Project** → Work container with `organisation_id` foreign key
- **Entity** → Data scoped by `project_id`

RLS policies use SECURITY DEFINER helper functions for efficient access checks.

### 4. Feature Flagging Foundation (Good)

Organisation settings include feature flags:

```sql
settings JSONB DEFAULT '{
  "features": {
    "ai_chat_enabled": true,
    "receipt_scanner_enabled": true,
    "variations_enabled": true,
    "report_builder_enabled": true
  }
}'::jsonb
```

Subscription tiers defined in `subscriptionTiers.js` with limits and feature access.

### 5. Code Splitting (Good)

All page components are lazy-loaded:
```javascript
const DashboardHub = lazy(() => import('./pages/DashboardHub'));
const MilestonesHub = lazy(() => import('./pages/MilestonesHub'));
// ... 40+ lazy-loaded components
```

Vite chunk splitting configured for optimal caching.

---

## Findings

### High Severity

#### AUDIT-04-001: Duplicate Base Service Classes

**Severity:** High
**Category:** Architecture - Code Duplication
**Location:** `src/services/base.service.js` and `src/services/evaluator/base.evaluator.service.js`

**Description:**
The Evaluator module has its own `EvaluatorBaseService` that duplicates ~95% of `BaseService` code. The only difference is the project field name (`evaluation_project_id` vs `project_id`).

**Evidence:**
```javascript
// base.service.js (line 56)
.eq('project_id', projectId);

// base.evaluator.service.js (line 56)
.eq(this.projectField, evaluationProjectId);
```

**Impact:**
- Bug fixes must be applied in two places
- Inconsistent behavior risk
- Increased maintenance burden

**Remediation:**
Refactor `BaseService` to accept configurable project field:
```javascript
class BaseService {
  constructor(tableName, options = {}) {
    this.projectField = options.projectField || 'project_id';
  }
}
```

**Compliance:** N/A
**Effort:** Medium

---

### Medium Severity

#### AUDIT-04-002: Inconsistent Service Patterns

**Severity:** Medium
**Category:** Architecture - Consistency
**Location:** `src/services/planItemsService.js`, `src/services/syncService.js`

**Description:**
Several services use object-based patterns instead of extending `BaseService`:

| Service | Pattern | Extends BaseService |
|---------|---------|---------------------|
| `milestones.service.js` | Class | Yes |
| `planItemsService.js` | Object | No |
| `syncService.js` | Object | No |
| `sfia8-reference-data.js` | Object | No |

**Impact:**
- Inconsistent error handling across services
- No soft delete support in object-based services
- Harder to maintain and onboard developers

**Remediation:**
Convert object-based services to class pattern extending BaseService, or create a documented exception policy for services that don't need project scoping.

**Effort:** Medium

---

#### AUDIT-04-003: AG Grid Not Standardized

**Severity:** Medium
**Category:** Architecture - Reusability
**Location:** `src/components/evaluator/*/`

**Description:**
AG Grid is used in 4 Evaluator components with duplicated configuration:
- `RequirementsGridView.jsx`
- `QuestionsGridView.jsx`
- `VendorsGridView.jsx`
- `QAGridView.jsx`

Each component independently:
- Registers AG Grid modules
- Defines common renderers (badges, drag handles)
- Implements similar column configurations
- Sets up event handlers

**Impact:**
- ~200 lines of duplicated code per grid component
- Inconsistent grid behavior across modules
- Harder to implement global grid features (themes, accessibility)

**Remediation:**
Create a shared grid wrapper component:
```javascript
// src/components/common/DataGrid/DataGrid.jsx
export function DataGrid({
  columns,
  data,
  onRowDrag,
  enableSelection,
  // ... common props
}) {
  // Centralized AG Grid configuration
}
```

**Effort:** Medium

---

#### AUDIT-04-004: Count Queries Fetch All Records

**Severity:** Medium
**Category:** Performance - Database
**Location:** `src/services/base.service.js:460-495`

**Description:**
The `count()` method fetches all record IDs then counts client-side:

```javascript
async count(projectId, filters = []) {
  const { data, error } = await supabase
    .from(this.tableName)
    .select('id, is_deleted')  // Fetches all records
    .eq('project_id', projectId);

  // Count client-side
  return records.filter(r => r.is_deleted !== true).length;
}
```

**Impact:**
- For tables with 10,000+ records, this fetches unnecessary data
- Network bandwidth waste
- Slower response times

**Remediation:**
Use Supabase count functionality:
```javascript
async count(projectId, filters = []) {
  const { count, error } = await supabase
    .from(this.tableName)
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .neq('is_deleted', true);

  return count || 0;
}
```

**Effort:** Low

---

### Low Severity

#### AUDIT-04-005: No Query State Management Library

**Severity:** Low
**Category:** Architecture - State Management
**Location:** `src/lib/cache.js`, `src/contexts/MetricsContext.jsx`

**Description:**
The application uses manual caching implementation instead of established libraries like React Query or SWR:

- `cache.js` implements LRU cache with TTL
- `MetricsContext` handles its own caching
- No automatic cache invalidation on mutations
- No request deduplication

**Impact:**
- Manual cache invalidation is error-prone
- Duplicate network requests possible
- Complex manual refresh logic in components

**Remediation:**
Consider adopting React Query for:
- Automatic caching and revalidation
- Request deduplication
- Optimistic updates
- Background refresh

**Effort:** High (requires significant refactor)

---

#### AUDIT-04-006: Limited White-Labeling Support

**Severity:** Low
**Category:** SaaS Readiness
**Location:** `supabase/migrations/202512221400_create_organisations.sql`

**Description:**
White-labeling support is partial:

**Implemented:**
- `logo_url` - Organisation logo
- `primary_color` - Theme color
- `display_name` - Custom display name

**Not Implemented:**
- Custom CSS injection
- Email template customization
- Custom domain support
- Login page branding
- Footer/header customization

**Impact:**
- Cannot fully white-label for enterprise customers
- Limits enterprise sales potential

**Remediation:**
Extend branding settings:
```sql
"branding": {
  "logo_url": null,
  "favicon_url": null,
  "primary_color": "#6366f1",
  "custom_css": null,
  "email_header_html": null,
  "custom_domain": null
}
```

**Effort:** Medium

---

### Informational

#### AUDIT-04-INFO-001: Context Count (12 Contexts)

The application uses 12 React contexts:

| Context | Purpose | Data Size |
|---------|---------|-----------|
| AuthContext | User authentication | Small |
| OrganisationContext | Current org + list | Medium |
| ProjectContext | Current project + list | Medium |
| EvaluationContext | Evaluator state | Large |
| ViewAsContext | Role impersonation | Small |
| MetricsContext | Dashboard metrics | Large |
| ChatContext | AI chat state | Large |
| ToastContext | Notifications | Small |
| NotificationContext | System notifications | Medium |
| HelpContext | Help system | Medium |
| TestUserContext | Test user toggle | Small |
| ReportBuilderContext | Report state | Medium |

**Observation:** Context count is appropriate for application complexity. No unnecessary nesting or over-abstraction.

---

#### AUDIT-04-INFO-002: Database Migration Volume

92 migration files with active schema evolution:
- Dec 2025: Multi-tenancy foundation (20 migrations)
- Jan 2026: Evaluator module (35 migrations)
- Jan 2026: Planning enhancements (10 migrations)

**Observation:** High migration volume is expected for active development. Consider squashing migrations for production stability.

---

#### AUDIT-04-INFO-003: Service Count

35+ services organized by domain:

**Root Services (16):**
- Core: milestones, deliverables, resources, timesheets, expenses
- Support: partners, invoicing, variations, raid, kpis
- Planning: planItemsService, planCommitService, estimates
- Utility: dashboard, calendar, metrics

**Evaluator Services (19):**
- Core: requirements, vendors, scores, workshops
- Support: evidence, approvals, comments, surveys
- Portal: clientPortal, vendorQuestions

**Observation:** Good domain separation. Consider service consolidation for related entities.

---

#### AUDIT-04-INFO-004: Subscription Tiers Defined

Four subscription tiers ready for monetization:

| Tier | Members | Projects | Key Features |
|------|---------|----------|--------------|
| Free | Unlimited | Unlimited | All features (current state) |
| Starter | 10 | 5 | Core features only |
| Professional | 50 | 25 | Custom branding, API |
| Enterprise | Unlimited | Unlimited | SSO, dedicated support |

**Observation:** Free tier currently has unlimited access (noted as intentional for initial rollout). Will need enforcement when monetizing.

---

#### AUDIT-04-INFO-005: Caching Strategy

Current caching implementation:

| Cache | TTL | Purpose |
|-------|-----|---------|
| In-memory (cache.js) | 5 min default | Reference data |
| MetricsContext | Session | Dashboard metrics |
| localStorage | Permanent | User preferences |

**Cache TTL Presets:**
- SHORT: 1 minute
- MEDIUM: 5 minutes (default)
- LONG: 15 minutes
- VERY_LONG: 1 hour

**Observation:** Simple caching strategy. Works for current scale but may need Redis/Vercel KV for larger deployments.

---

## Compliance Mapping

### SOC 2

| Criteria | Status | Notes |
|----------|--------|-------|
| CC1.2 - COSO Principle 2 | Partial | Architecture documented |
| CC6.1 - Logical Access | Good | RLS + service layer |
| CC6.7 - Restrict Access | Good | Multi-tenancy isolation |
| CC7.2 - Monitoring | Partial | Manual metrics context |

### ISO 27001

| Control | Status | Notes |
|---------|--------|-------|
| A.14.2.1 - Secure Development | Good | Consistent patterns |
| A.14.2.5 - System Architecture | Good | Well-documented |
| A.14.2.9 - System Testing | Partial | E2E tests exist |

---

## Recommendations

### Priority 1: Quick Wins (1-2 days)

1. **Fix count() method** (AUDIT-04-004)
   - Use Supabase `count` parameter
   - Immediate performance improvement

2. **Document service patterns**
   - Create ADR (Architecture Decision Record) for when to use BaseService
   - Document approved exceptions

### Priority 2: Short-Term (1-2 weeks)

3. **Refactor EvaluatorBaseService** (AUDIT-04-001)
   - Extend BaseService with configurable project field
   - Single source of truth for CRUD operations

4. **Create shared DataGrid component** (AUDIT-04-003)
   - Extract common AG Grid configuration
   - Standardize renderers and handlers

### Priority 3: Medium-Term (1-3 months)

5. **Evaluate React Query adoption** (AUDIT-04-005)
   - Start with new features
   - Gradual migration of existing contexts

6. **Expand white-labeling** (AUDIT-04-006)
   - Custom domain support
   - Email template customization

### Priority 4: Long-Term

7. **Service consolidation**
   - Review related services for merge opportunities
   - Reduce surface area for bugs

8. **Migration squashing**
   - Create consolidated baseline migration
   - Improve deployment speed

---

## Third-Party Trust Factors

**For External Evaluators:**

1. **Architecture Maturity:** The application follows modern React patterns with proper separation of concerns. The multi-tenancy model is enterprise-ready.

2. **Scalability:** Current architecture supports moderate scale (hundreds of users per organisation). For thousands of concurrent users, Redis caching and database connection pooling would be needed.

3. **Maintainability:** Code is well-organized with consistent patterns in most areas. Documentation exists but could be more comprehensive.

4. **Technical Debt:** Moderate - mainly around service pattern inconsistency and duplicate code. No blocking issues.

---

## Appendix

### A. Service Layer Pattern Comparison

| Pattern | Services Using | Pros | Cons |
|---------|---------------|------|------|
| BaseService class | 16 | Consistent CRUD, soft delete | Requires class extension |
| EvaluatorBaseService | 19 | Evaluation-scoped | Code duplication |
| Object pattern | 5 | Flexible | Inconsistent methods |

### B. Context Dependencies

```
AuthProvider
├── OrganisationProvider (needs auth.uid())
│   └── ProjectProvider (needs organisationId)
│       └── EvaluationProvider (needs projectId)
│           └── ViewAsProvider (needs projectRole)
├── MetricsProvider (needs projectId)
├── ChatProvider (needs auth + project)
└── NotificationProvider (needs auth)
```

### C. Files Reviewed

- `src/services/base.service.js` (498 lines)
- `src/services/evaluator/base.evaluator.service.js` (466 lines)
- `src/services/milestones.service.js` (590 lines)
- `src/services/planItemsService.js` (1249 lines)
- `src/contexts/ProjectContext.jsx` (370 lines)
- `src/contexts/MetricsContext.jsx` (199 lines)
- `src/lib/cache.js` (221 lines)
- `src/lib/subscriptionTiers.js` (421 lines)
- `src/App.jsx` (613 lines)
- Various migration files

---

**Document Status:** Complete
**Next Phase:** Phase 5 - Technology & Integration Review
**Prepared By:** Claude Opus 4.5
