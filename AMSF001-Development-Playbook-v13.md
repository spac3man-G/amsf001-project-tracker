# AMSF001 Project Tracker
# Development Playbook & Implementation Guide

**Version:** 13.0  
**Created:** 29 November 2025  
**Last Updated:** 30 November 2025  
**Purpose:** Complete Phase Documentation + Technical Debt  
**Repository:** github.com/spac3man-G/amsf001-project-tracker  
**Live Application:** https://amsf001-project-tracker.vercel.app

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0-7.0 | 28-29 Nov | Foundation phases, shared components, architecture |
| 8.0 | 30 Nov | AI Chat Assistant, Services Layer planned |
| 9.0 | 30 Nov | Complete P1-P3 implementation, data integrity |
| 10.0 | 30 Nov | Phase P4: Expenses Enhancement |
| 11.0 | 30 Nov | Phase P5: Partner Invoicing |
| 12.0 | 30 Nov | Phase P7: Delete with cascade warnings |
| **13.0** | **30 Nov** | **Complete documentation update, technical debt, date filtering** |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Phase Status Summary](#2-phase-status-summary)
3. [Architecture](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [Services Layer](#5-services-layer)
6. [Feature Implementation Details](#6-feature-implementation-details)
7. [Data Protection Strategy](#7-data-protection-strategy)
8. [Technical Debt & Known Issues](#8-technical-debt--known-issues)
9. [SQL Scripts Reference](#9-sql-scripts-reference)
10. [Deployment & Configuration](#10-deployment--configuration)
11. [Future Roadmap](#11-future-roadmap)

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
| P6 | User Manual v2.0 | 30 Nov | ✅ Complete |
| P7 | Delete with Warnings | 30 Nov | ✅ Complete |
| P8 | Resource Date Filtering | 30 Nov | ✅ Complete |
| P9 | Delete Cost Warnings | 30 Nov | ✅ Complete |

### Pending Phases 📋

| Phase | Feature | Priority |
|-------|---------|----------|
| P10 | Soft Delete Implementation | Medium |
| P11 | Reporting Dashboard | Medium |
| P12 | Export to PDF/Excel | Low |
| P13 | Email Notifications | Low |

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
│   │   └── ConfirmDialog.jsx
│   ├── chat/
│   │   ├── ChatWidget.jsx
│   │   └── ChatWidget.css
│   └── Layout.jsx
├── contexts/
│   ├── AuthContext.jsx
│   ├── ProjectContext.jsx
│   ├── ChatContext.jsx
│   └── TestUserContext.jsx
├── hooks/
│   └── usePermissions.js
├── lib/
│   ├── supabase.js
│   └── permissions.js
├── pages/
│   ├── Dashboard.jsx
│   ├── Timesheets.jsx
│   ├── Expenses.jsx
│   ├── Resources.jsx
│   ├── ResourceDetail.jsx
│   ├── Partners.jsx
│   ├── PartnerDetail.jsx
│   ├── Milestones.jsx
│   ├── Deliverables.jsx
│   ├── KPIs.jsx
│   ├── QualityStandards.jsx
│   ├── Reports.jsx
│   ├── GanttChart.jsx
│   ├── Users.jsx
│   ├── Settings.jsx
│   ├── WorkflowSummary.jsx
│   └── MyAccount.jsx
├── services/
│   ├── index.js               # Barrel export
│   ├── base.service.js
│   ├── partners.service.js
│   ├── resources.service.js
│   ├── expenses.service.js
│   └── invoicing.service.js
└── App.jsx
```

### Data Flow

```
User → React Component → Service Layer → Supabase Client → PostgreSQL
                                              ↓
                                         RLS Policies
                                              ↓
                                      Multi-tenant Filter
```

---

## 4. Database Schema

### Core Tables

#### profiles
```sql
id UUID PRIMARY KEY REFERENCES auth.users
email TEXT
full_name TEXT
role TEXT CHECK (role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor'))
project_id UUID REFERENCES projects (NULLABLE - admin has no project)
linked_resource_id UUID REFERENCES resources
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### resources
```sql
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects
name TEXT NOT NULL
email TEXT
role TEXT
resource_ref TEXT
sfia_level TEXT
daily_rate DECIMAL
cost_price DECIMAL
discount_percent DECIMAL DEFAULT 0
days_allocated INTEGER
resource_type TEXT DEFAULT 'supplier' CHECK (resource_type IN ('supplier', 'partner', 'customer'))
partner_id UUID REFERENCES partners
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### partners
```sql
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects
name TEXT NOT NULL
contact_name TEXT
contact_email TEXT
payment_terms TEXT DEFAULT 'Net 30'
notes TEXT
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### timesheets
```sql
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects
resource_id UUID NOT NULL REFERENCES resources
milestone_id UUID REFERENCES milestones
date DATE NOT NULL
hours_worked DECIMAL NOT NULL
description TEXT
status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected'))
was_rejected BOOLEAN DEFAULT false
created_by UUID REFERENCES profiles
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### expenses
```sql
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects
expense_ref TEXT UNIQUE
resource_id UUID REFERENCES resources
resource_name TEXT NOT NULL
category TEXT CHECK (category IN ('Travel', 'Accommodation', 'Sustenance'))
expense_date DATE NOT NULL
reason TEXT
amount DECIMAL NOT NULL
chargeable_to_customer BOOLEAN DEFAULT true
procurement_method TEXT DEFAULT 'supplier' CHECK (procurement_method IN ('supplier', 'partner'))
status TEXT DEFAULT 'Draft'
notes TEXT
created_by UUID REFERENCES profiles
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### partner_invoices
```sql
id UUID PRIMARY KEY
project_id UUID NOT NULL REFERENCES projects
partner_id UUID NOT NULL REFERENCES partners
invoice_number TEXT NOT NULL
invoice_date DATE DEFAULT CURRENT_DATE
period_start DATE NOT NULL
period_end DATE NOT NULL
timesheet_total DECIMAL DEFAULT 0
expense_total DECIMAL DEFAULT 0
invoice_total DECIMAL DEFAULT 0
status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Cancelled'))
notes TEXT
created_by UUID REFERENCES profiles
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
sent_at TIMESTAMPTZ
paid_at TIMESTAMPTZ
UNIQUE(project_id, invoice_number)
```

#### partner_invoice_lines
```sql
id UUID PRIMARY KEY
invoice_id UUID NOT NULL REFERENCES partner_invoices ON DELETE CASCADE
line_type TEXT NOT NULL CHECK (line_type IN ('timesheet', 'expense'))
timesheet_id UUID REFERENCES timesheets
expense_id UUID REFERENCES expenses
description TEXT
quantity DECIMAL
unit_price DECIMAL
line_total DECIMAL NOT NULL
resource_name TEXT
line_date DATE
created_at TIMESTAMPTZ
CHECK (
  (line_type = 'timesheet' AND timesheet_id IS NOT NULL AND expense_id IS NULL) OR
  (line_type = 'expense' AND expense_id IS NOT NULL AND timesheet_id IS NULL)
)
```

---

## 5. Services Layer

### BaseService (base.service.js)

Provides CRUD operations with automatic project filtering:

```javascript
class BaseService {
  constructor(tableName)
  async getAll(projectId, options)
  async getById(id)
  async create(data)
  async update(id, data)
  async delete(id)
  async getActive(projectId)
}
```

### Available Services

| Service | Table | Special Methods |
|---------|-------|-----------------|
| partnersService | partners | getWithResources(), getResourceCount() |
| resourcesService | resources | getByPartner(), getTimesheetSummary(), getUtilization() |
| expensesService | expenses | getByProcurement(), getProcurementStats() |
| invoicingService | partner_invoices | generateInvoice(), generateInvoiceNumber(), getWithLines() |

### InvoicingService Details

```javascript
// Generate invoice for a partner within date range
const invoice = await invoicingService.generateInvoice({
  projectId,
  partnerId,
  periodStart: '2025-11-01',
  periodEnd: '2025-11-30',
  createdBy: userId,
  notes: 'Optional notes'
});

// Invoice includes:
// - Auto-generated number: INV-2025-001
// - All approved timesheets at cost_price
// - All partner-procured expenses
// - Line items for each entry
```

---

## 6. Feature Implementation Details

### 6.1 Partner Invoicing

**Location:** `src/pages/PartnerDetail.jsx`, `src/services/invoicing.service.js`

**Features:**
- Invoice Preview panel showing timesheets (at cost) and partner expenses
- Generate Invoice button creates invoice with line items
- Invoice number format: INV-YYYY-NNN (auto-increment per year)
- Recent Invoices table on Partner Detail page
- Invoice modal shows summary after generation

**Invoice Generation Logic:**
1. Get resources linked to partner
2. Query approved timesheets in date range
3. Query partner-procured expenses in date range
4. Calculate totals (timesheets at cost_price)
5. Insert invoice record
6. Insert denormalized line items
7. Return complete invoice

### 6.2 Delete Warnings

**Timesheets (src/pages/Timesheets.jsx):**
- Shows resource name, date, hours, cost impact
- Calculates cost as (hours/8) × cost_price
- Warns about impact on reports and invoices

**Expenses (src/pages/Expenses.jsx):**
- Shows resource, date, amount breakdown
- Shows chargeable status and procurement method
- Warns about impact on reports and invoices

**Resources (src/pages/Resources.jsx):**
- Queries timesheet and expense counts
- Shows dependent record counts before delete
- Uses cascade delete in database

**Partners (src/pages/Partners.jsx):**
- Shows linked resources, timesheets, expenses, invoices
- Full cascade warning with all dependent counts
- Resources unlinked (not deleted) when partner deleted

### 6.3 Date Range Filtering

**Partner Detail Page:**
- Month quick-select (last 12 months)
- Custom date range picker
- Filters timesheets, expenses, and stats
- Invoice Preview respects date filter

**Resource Detail Page:**
- Same date filtering as Partner Detail
- Filters timesheets and expenses tables
- Shows entry count with filter label

### 6.4 Per-Category Expense Settings

**Expense Form (src/pages/Expenses.jsx):**
- Each category (Travel, Accommodation, Sustenance) has own settings
- Chargeable checkbox per category
- Procurement method dropdown per category
- Settings only show when amount > 0

**Database Note:** Each expense is stored as a single row with one category. The per-category UI creates multiple expense records when multiple categories have amounts.

---

## 7. Data Protection Strategy

### Current Protection Layers

| Layer | Status | Description |
|-------|--------|-------------|
| Cascade Warnings | ✅ Active | UI warnings before delete |
| Role-Based Delete | ✅ Active | Permissions in permissions.js |
| Supabase Backups | ✅ Active | Daily, 7-day retention |
| Foreign Keys | ✅ Active | ON DELETE CASCADE |
| Soft Delete | 📋 Planned | Future Phase P10 |
| PITR | 💰 Pro tier | Point-in-time recovery |

### Delete Permission Matrix

| Entity | Admin | Supplier PM | Customer PM | Contributor |
|--------|-------|-------------|-------------|-------------|
| Timesheets | Any | Any | - | Own Draft |
| Expenses | Any | Any | - | Own Draft |
| Resources | ✅ | ✅ | - | - |
| Partners | ✅ | ✅ | - | - |
| Invoices | ✅ | - | - | - |

### Entity Dependency Map

```
Partners
  └── Resources (partner_id) → unlink only
       └── Timesheets (resource_id) → cascade delete
       └── Expenses (resource_id) → cascade delete
  └── Invoices (partner_id) → cascade delete
       └── Invoice Lines → cascade delete
```

### Soft Delete Schema (Future)

```sql
-- Add to each table
ALTER TABLE tablename ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE tablename ADD COLUMN deleted_by UUID REFERENCES profiles;
ALTER TABLE tablename ADD COLUMN is_deleted BOOLEAN DEFAULT false;

-- Update queries to filter
SELECT * FROM tablename WHERE is_deleted = false;
```

---

## 8. Technical Debt & Known Issues

### Critical Issues 🔴

| Issue | Description | Impact | Solution |
|-------|-------------|--------|----------|
| None currently | - | - | - |

### Medium Priority 🟡

| Issue | Description | Impact | Solution |
|-------|-------------|--------|----------|
| Bundle Size | 785KB JS bundle | Slow initial load | Code splitting with React.lazy |
| Unicode in JSX | Special chars cause build errors | Build failures | Use ASCII alternatives |
| Missing Soft Delete | Hard delete only | No recovery | Phase P10 |

### Low Priority 🟢

| Issue | Description | Impact | Solution |
|-------|-------------|--------|----------|
| Profile project_id | profiles table lacks project_id | RLS complexity | Add column or use joins |
| Expense Schema | Per-category fields not in DB | Form/DB mismatch | Document clearly |
| Test Data | Test users mixed with real | Data pollution | TestUser filter |

### Code Quality Notes

1. **Expenses Table Structure:**
   - Database stores one row per expense with `category`, `reason`, `amount`
   - UI allows entering multiple categories at once
   - Each category creates a separate expense record
   - Don't query for `travel_amount`, `accommodation_amount`, etc. - they don't exist

2. **Date Formatting:**
   - Use `toLocaleDateString('en-GB')` for DD/MM/YYYY format
   - Database dates are ISO format (YYYY-MM-DD)

3. **RLS Policies:**
   - profiles table doesn't have project_id column
   - Use role checks only, not project_id filters
   - See sql/P5b-partner-invoices-rls.sql for correct pattern

---

## 9. SQL Scripts Reference

### Location: `/sql/` directory

| Script | Purpose | Run Order |
|--------|---------|-----------|
| P1-partners-table.sql | Partners table + RLS | First |
| P3a-add-partner-id-to-resources.sql | Resource partner link | After P1 |
| P4-add-procurement-method-to-expenses.sql | Procurement tracking | Anytime |
| P5a-partner-invoices-tables.sql | Invoice tables | Before P5b |
| P5b-partner-invoices-rls.sql | Invoice RLS (FIXED) | After P5a |
| add-resource-id-to-expenses.sql | FK to resources | Anytime |
| data-integrity-constraints.sql | NOT NULL, indexes | Maintenance |

### Running SQL Scripts

1. Go to Supabase Dashboard
2. SQL Editor (left sidebar)
3. New Query
4. Paste script contents
5. Click "Run"
6. Check Results tab for success/errors

---

## 10. Deployment & Configuration

### Environment Variables (Vercel)

```
VITE_SUPABASE_URL=https://ltkbfbqfnskqgpcnvdxy.supabase.co
VITE_SUPABASE_ANON_KEY=[anon key]
ANTHROPIC_API_KEY=[for AI chat]
```

### Git Workflow

```bash
# Make changes
git add -A
git commit -m "Description"
git push origin main

# Vercel auto-deploys from main branch
# Check deployment at vercel.com dashboard
```

### Build Commands

```bash
npm run dev      # Local development
npm run build    # Production build
npm run preview  # Preview production build
```

---

## 11. Future Roadmap

### Phase P10: Soft Delete
- Add deleted_at, deleted_by, is_deleted columns
- Update all queries to filter deleted records
- Create "Trash" view for admins
- Implement restore functionality

### Phase P11: Reporting
- Partner cost reports
- Resource utilization dashboards
- Project financial summary
- Export capabilities

### Phase P12: Export Features
- PDF invoice generation
- Excel timesheet exports
- CSV data exports

### Phase P13: Notifications
- Email on timesheet submission
- Email on approval/rejection
- Invoice generation notifications

---

## Appendix A: Quick Reference

### User Roles

| Role | Code | Permissions |
|------|------|-------------|
| Admin | admin | Full access |
| Supplier PM | supplier_pm | Manage resources, partners, invoices |
| Customer PM | customer_pm | Approve timesheets, validate chargeable expenses |
| Contributor | contributor | Submit own timesheets/expenses |

### Status Values

| Entity | Statuses |
|--------|----------|
| Timesheets | Draft, Submitted, Approved, Rejected |
| Expenses | Draft, Submitted, Approved, Rejected |
| Invoices | Draft, Sent, Paid, Cancelled |

### Invoice Number Format

`INV-YYYY-NNN`
- YYYY: 4-digit year
- NNN: 3-digit sequence (resets annually)
- Example: INV-2025-001, INV-2025-002

---

*End of Development Playbook v13.0*
