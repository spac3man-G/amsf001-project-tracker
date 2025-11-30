# AMSF001 Project Tracker
# Development Playbook & Implementation Guide

**Version:** 14.0  
**Created:** 29 November 2025  
**Last Updated:** 30 November 2025  
**Purpose:** Complete Phase Documentation + Production Roadmap  
**Repository:** github.com/spac3man-G/amsf001-project-tracker  
**Live Application:** https://amsf001-project-tracker.vercel.app

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0-12.0 | 28-30 Nov | Foundation through delete warnings |
| 13.0 | 30 Nov | Complete documentation, technical debt, date filtering |
| 13.1 | 30 Nov | Expense detail modal, in-modal editing |
| **14.0** | **30 Nov** | **Enhanced invoicing, Phase 1 stabilisation, production roadmap** |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Phase Status Summary](#2-phase-status-summary)
3. [Architecture](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [Services Layer](#5-services-layer)
6. [Feature Implementation Details](#6-feature-implementation-details)
7. [Phase 1: Stabilisation](#7-phase-1-stabilisation)
8. [Production Roadmap](#8-production-roadmap)
9. [Data Protection Strategy](#9-data-protection-strategy)
10. [Technical Debt & Known Issues](#10-technical-debt--known-issues)
11. [SQL Scripts Reference](#11-sql-scripts-reference)
12. [Deployment & Configuration](#12-deployment--configuration)

---

## 1. Project Overview

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React | 18.2 |
| Router | React Router | 6.x |
| Build Tool | Vite | 5.4.21 |
| Backend | Supabase | PostgreSQL 15 |
| Auth | Supabase Auth | Built-in |
| AI Chat | Claude API | Haiku |
| Hosting | Vercel | Auto-deploy |
| Source Control | GitHub | main branch |

### Key URLs

- **Live App:** https://amsf001-project-tracker.vercel.app
- **Repository:** https://github.com/spac3man-G/amsf001-project-tracker
- **Supabase:** https://supabase.com/dashboard/project/ltkbfbqfnskqgpcnvdxy

---

## 2. Phase Status Summary

### Completed Phases ✅

| Phase | Feature | Date | Status |
|-------|---------|------|--------|
| F1 | Foundation & Auth | 28 Nov | ✅ Complete |
| F2 | Shared Components | 29 Nov | ✅ Complete |
| F3 | Services Layer | 30 Nov | ✅ Complete |
| P1 | Partners Database | 30 Nov | ✅ Complete |
| P2 | Partners Page | 30 Nov | ✅ Complete |
| P3 | Resources Enhancement | 30 Nov | ✅ Complete |
| P4 | Expenses Enhancement | 30 Nov | ✅ Complete |
| P5 | Partner Invoicing | 30 Nov | ✅ Complete |
| P6 | Enhanced Invoicing | 30 Nov | ✅ Complete |
| P7 | Delete with Warnings | 30 Nov | ✅ Complete |
| P8 | Date Filtering | 30 Nov | ✅ Complete |
| P9 | Delete Cost Warnings | 30 Nov | ✅ Complete |
| **S1** | **Toast Notifications** | **30 Nov** | **✅ Complete** |
| **S2** | **Form Validation Hook** | **30 Nov** | **✅ Complete** |

### In Progress 🔄

| Phase | Feature | Priority | Status |
|-------|---------|----------|--------|
| S3 | Service Layer Adoption | HIGH | 🔄 Started |
| S4 | Loading Skeletons | MEDIUM | 📋 Planned |

### Pending Phases 📋

| Phase | Feature | Priority |
|-------|---------|----------|
| S5 | Soft Delete Implementation | HIGH |
| S6 | Audit Logging | MEDIUM |
| S7 | Code Splitting | MEDIUM |
| S8 | Multi-Tenant Foundation | HIGH |

---

## 3. Architecture

### Directory Structure

```
src/
├── components/
│   ├── common/
│   │   ├── index.js           # Barrel export
│   │   ├── LoadingSpinner.jsx
│   │   ├── PageHeader.jsx
│   │   ├── StatCard.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── ErrorBoundary.jsx  # NEW: Error catching
│   │   └── Toast.jsx          # NEW: Toast notifications
│   ├── chat/
│   │   ├── ChatWidget.jsx
│   │   └── ChatWidget.css
│   └── Layout.jsx
├── contexts/
│   ├── AuthContext.jsx
│   ├── ProjectContext.jsx
│   ├── ChatContext.jsx
│   ├── ToastContext.jsx       # NEW: App-wide notifications
│   ├── NotificationContext.jsx
│   └── TestUserContext.jsx
├── hooks/
│   ├── usePermissions.js
│   ├── useForm.js
│   └── useFormValidation.js   # NEW: Form validation
├── lib/
│   ├── supabase.js
│   ├── permissions.js
│   ├── constants.js           # NEW: App constants
│   ├── utils.js               # NEW: Utilities
│   └── errorHandler.js        # NEW: Error handling
├── pages/
│   └── [all page components]
├── services/
│   ├── index.js               # Barrel export
│   ├── base.service.js
│   ├── partners.service.js
│   ├── resources.service.js
│   ├── timesheets.service.js  # NEW
│   ├── expenses.service.js
│   ├── invoicing.service.js   # ENHANCED: Full breakdown
│   ├── milestones.service.js  # NEW
│   ├── deliverables.service.js # NEW
│   ├── kpis.service.js        # NEW
│   └── qualityStandards.service.js # NEW
└── App.jsx
```

### Data Flow

```
User → React Component → Service Layer → Supabase Client → PostgreSQL
                ↓                               ↓
         Toast Context                    RLS Policies
         Error Boundary                        ↓
                                      Multi-tenant Filter
```

---

## 4. Database Schema

### Core Tables

[Previous schema sections remain the same...]

### New Tables (v14)

#### user_projects (Multi-Tenant Foundation)
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL REFERENCES auth.users
project_id UUID NOT NULL REFERENCES projects
role TEXT NOT NULL
is_default BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
UNIQUE(user_id, project_id)
```

#### audit_log (Already Existed)
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users
action TEXT NOT NULL
entity_type TEXT NOT NULL
entity_id UUID NOT NULL
changes JSONB
ip_address INET
user_agent TEXT
created_at TIMESTAMPTZ
```

### Enhanced Invoice Schema (P6)

#### partner_invoice_lines (Enhanced)
```sql
-- New columns added:
chargeable_to_customer BOOLEAN DEFAULT TRUE
procurement_method TEXT
expense_category TEXT
hours DECIMAL(10,2)
cost_price DECIMAL(10,2)
source_status TEXT
line_type CHECK (line_type IN ('timesheet', 'expense', 'supplier_expense'))
```

#### partner_invoices (Enhanced)
```sql
-- New columns added:
supplier_expense_total DECIMAL(10,2) DEFAULT 0
chargeable_total DECIMAL(10,2) DEFAULT 0
non_chargeable_total DECIMAL(10,2) DEFAULT 0
```

---

## 5. Services Layer

### Complete Services List

| Service | Table | Status |
|---------|-------|--------|
| BaseService | - | ✅ Complete |
| partnersService | partners | ✅ Complete |
| resourcesService | resources | ✅ Complete |
| timesheetsService | timesheets | ✅ Complete |
| expensesService | expenses | ✅ Complete |
| invoicingService | partner_invoices | ✅ Enhanced |
| milestonesService | milestones | ✅ Complete |
| deliverablesService | deliverables | ✅ Complete |
| kpisService | kpis | ✅ Complete |
| qualityStandardsService | quality_standards | ✅ Complete |

### InvoicingService v2.0

Enhanced to provide full invoice breakdown:

```javascript
const invoice = await invoicingService.generateInvoice({
  projectId,
  partnerId,
  periodStart,
  periodEnd,
  createdBy,
  includeSubmitted: true  // NEW: Include Submitted + Approved timesheets
});

// Returns:
{
  invoice: { ...invoiceData },
  groupedLines: {
    timesheets: [...],        // Grouped by resource
    supplierExpenses: [...],  // For reference only
    partnerExpenses: [...]    // On invoice
  },
  summary: {
    timesheetTotal,
    partnerExpenseTotal,
    supplierExpenseTotal,
    invoiceTotal,             // = timesheets + partner expenses
    chargeableTotal,
    nonChargeableTotal
  }
}
```

---

## 6. Feature Implementation Details

### 6.1 Enhanced Partner Invoicing (P6)

**Location:** `src/services/invoicing.service.js`, `src/pages/PartnerDetail.jsx`

**New Features:**
- Includes both Approved AND Submitted timesheets
- Groups timesheets by resource with hours, cost/day, status
- Separates expenses by procurement method
- Shows chargeable totals for customer pass-through

**Invoice Modal Sections:**
1. **Summary Cards** - Timesheets, Partner Expenses, Supplier Expenses, Total
2. **Chargeable Banner** - Customer pass-through total
3. **Timesheets Table** - Date, Resource, Hours, Cost/Day, Status, Total
4. **Partner Expenses Table** - On invoice, billed to partner
5. **Supplier Expenses Table** - Informational only, not on invoice

**Database Migration:** `sql/P6-enhanced-invoice-lines.sql`

### 6.2 Toast Notifications (S1)

**Location:** `src/contexts/ToastContext.jsx`, `src/components/common/Toast.jsx`

**Usage:**
```javascript
import { useToast } from '../contexts/ToastContext';

const { showSuccess, showError, showWarning, showInfo } = useToast();

showSuccess('Record saved successfully');
showError('Failed to save: ' + error.message);
showWarning('Please fill all required fields');
showInfo('Invoice generated');
```

**Types:** success (green), error (red), warning (amber), info (blue)

**Auto-dismiss:** 4 seconds default, 6 seconds for errors

### 6.3 Form Validation Hook (S2)

**Location:** `src/hooks/useFormValidation.js`

**Usage:**
```javascript
import { useFormValidation, ValidationRules } from '../hooks/useFormValidation';

const { errors, validate, getError, clearErrors } = useFormValidation();

const rules = {
  name: { required: true, minLength: 2 },
  email: ValidationRules.email,
  amount: { required: true, min: 0 }
};

const handleSubmit = () => {
  if (validate(formData, rules)) {
    // Form is valid
  }
};

// Display error
{getError('email') && <span className="error">{getError('email')}</span>}
```

**Built-in Validators:**
- required, minLength, maxLength, min, max
- email, pattern, match, custom

**Presets:**
- ValidationRules.required
- ValidationRules.email
- ValidationRules.name
- ValidationRules.password
- ValidationRules.positiveNumber
- ValidationRules.percentage

---

## 7. Phase 1: Stabilisation

### Completed Items ✅

| Item | Description | Files |
|------|-------------|-------|
| Toast System | App-wide notifications | ToastContext.jsx, Toast.jsx |
| Form Validation | Reusable validation hook | useFormValidation.js |
| Error Boundary | Global error catching | ErrorBoundary.jsx |
| Constants | Centralised app constants | constants.js |
| Utils | Common utility functions | utils.js |
| Error Handler | Standardised error handling | errorHandler.js |

### In Progress 🔄

| Item | Description | Progress |
|------|-------------|----------|
| Service Adoption | Replace direct Supabase calls | 40% |
| Loading Skeletons | Better loading states | 10% |

### Pending 📋

| Item | Description | Priority |
|------|-------------|----------|
| Input Sanitisation | XSS prevention | HIGH |
| Rate Limiting | AI chat throttling | MEDIUM |
| Session Management | Auto-logout, refresh | MEDIUM |

---

## 8. Production Roadmap

### Phase Overview

| Phase | Name | Duration | Priority |
|-------|------|----------|----------|
| 1 | Stabilisation & Standardisation | 7-9 days | HIGH |
| 2 | Production Hardening | 7-9 days | HIGH |
| 3 | Performance Optimisation | 5-7 days | MEDIUM |
| 4 | Multi-Tenant Foundation | 7-10 days | HIGH |
| 5 | Enhanced Reporting | 7-10 days | MEDIUM |
| 6 | Advanced Features | 14-20 days | LOW |

### Phase 1: Stabilisation (Current)

- [x] Toast notification system
- [x] Form validation hook
- [x] Error boundary
- [x] Constants file
- [x] Services layer complete
- [ ] Service adoption across pages
- [ ] Loading skeletons
- [ ] Consistent error states

### Phase 2: Production Hardening

- [ ] Soft delete (is_deleted, deleted_at, deleted_by)
- [ ] Audit logging trigger functions
- [ ] Input sanitisation
- [ ] Rate limiting on AI chat
- [ ] Session timeout handling
- [ ] Basic CSV export

### Phase 3: Performance

- [ ] Code splitting (React.lazy)
- [ ] Database indexes
- [ ] N+1 query fixes
- [ ] Caching strategy
- [ ] Virtual scrolling

### Phase 4: Multi-Tenant

- [x] user_projects table created
- [x] projects.description column added
- [ ] Dynamic project loading
- [ ] Project selector UI
- [ ] Tenant isolation testing
- [ ] Project onboarding flow

### Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Bundle Size | 821KB | <500KB |
| Initial Load | ~3s | <2s |
| Error Recovery | None | Full (soft delete) |
| Multi-tenant | No | Yes |
| Code Consistency | ~60% | >90% |

---

## 9. Data Protection Strategy

### Current Protection Layers

| Layer | Status | Description |
|-------|--------|-------------|
| Cascade Warnings | ✅ Active | UI warnings before delete |
| Role-Based Delete | ✅ Active | Permissions in permissions.js |
| Supabase Backups | ✅ Active | Daily, 7-day retention |
| Foreign Keys | ✅ Active | ON DELETE CASCADE |
| Error Boundary | ✅ Active | Catches JS errors |
| Audit Log | ✅ Active | Tracks entity changes |
| Soft Delete | 📋 Phase 2 | Recoverable deletion |
| PITR | 💰 Pro tier | Point-in-time recovery |

### Delete Permission Matrix

| Entity | Admin | Supplier PM | Customer PM | Contributor |
|--------|-------|-------------|-------------|-------------|
| Timesheets | Any | Any | - | Own Draft |
| Expenses | Any | Any | - | Own Draft |
| Resources | ✅ | ✅ | - | - |
| Partners | ✅ | ✅ | - | - |
| Invoices | ✅ | - | - | - |

---

## 10. Technical Debt & Known Issues

### Critical Issues 🔴

None currently.

### Medium Priority 🟡

| Issue | Description | Solution | Phase |
|-------|-------------|----------|-------|
| Bundle Size | 821KB JS bundle | Code splitting | Phase 3 |
| No Soft Delete | Hard delete only | Add columns | Phase 2 |
| Direct DB Calls | Some pages bypass services | Migrate to services | Phase 1 |

### Low Priority 🟢

| Issue | Description | Solution |
|-------|-------------|----------|
| Hardcoded Project | 'AMSF001' in ProjectContext | Dynamic loading |
| No Input Validation | Form data not sanitised | Phase 2 |
| Missing Tests | No automated tests | Future phase |

---

## 11. SQL Scripts Reference

### Location: `/sql/` directory

| Script | Purpose | Status |
|--------|---------|--------|
| P5a-partner-invoices-tables.sql | Invoice tables | ✅ Run |
| P5b-partner-invoices-rls.sql | Invoice RLS | ✅ Run |
| P6-enhanced-invoice-lines.sql | Enhanced invoice schema | ✅ Run |
| data-integrity-constraints.sql | NOT NULL, indexes | ✅ Run |

### Database Migrations Run Today

```sql
-- projects.description column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;

-- user_projects table (multi-tenant)
CREATE TABLE user_projects (...);

-- Enhanced invoice lines (P6)
ALTER TABLE partner_invoice_lines ADD COLUMN chargeable_to_customer BOOLEAN;
ALTER TABLE partner_invoice_lines ADD COLUMN procurement_method TEXT;
-- etc.
```

---

## 12. Deployment & Configuration

### Environment Variables (Vercel)

```
VITE_SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co
VITE_SUPABASE_ANON_KEY=[anon key]
ANTHROPIC_API_KEY=[for AI chat]
```

### Build Commands

```bash
npm run dev      # Local development (localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

### Deployment

```bash
git add -A
git commit -m "Description"
git push origin main
# Vercel auto-deploys from main branch
```

---

## Appendix A: Quick Reference

### New Files in v14

| File | Purpose |
|------|---------|
| src/contexts/ToastContext.jsx | App-wide toast notifications |
| src/components/common/Toast.jsx | Toast UI component |
| src/hooks/useFormValidation.js | Form validation hook |
| src/lib/constants.js | Centralised constants |
| src/lib/utils.js | Utility functions |
| src/lib/errorHandler.js | Error handling utilities |
| src/services/timesheets.service.js | Timesheets service |
| src/services/milestones.service.js | Milestones service |
| src/services/deliverables.service.js | Deliverables service |
| src/services/kpis.service.js | KPIs service |
| src/services/qualityStandards.service.js | Quality Standards service |
| sql/P6-enhanced-invoice-lines.sql | Enhanced invoice schema |

### Usage Patterns

```javascript
// Toast notifications
import { useToast } from '../contexts/ToastContext';
const { showSuccess, showError } = useToast();

// Form validation
import { useFormValidation } from '../hooks/useFormValidation';
const { validate, errors } = useFormValidation();

// Services
import { invoicingService, timesheetsService } from '../services';
```

---

*End of Development Playbook v14.0*
