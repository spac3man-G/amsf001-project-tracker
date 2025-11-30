# AMSF001 Project Tracker
# Development Playbook & Implementation Guide

**Version:** 11.0  
**Created:** 29 November 2025  
**Last Updated:** 30 November 2025  
**Purpose:** Phase P5 Partner Invoicing + Data Protection Strategy  
**Repository:** github.com/spac3man-G/amsf001-project-tracker  
**Live Application:** https://amsf001-project-tracker.vercel.app

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0-7.0 | 28-29 Nov | Foundation phases, shared components, architecture |
| 8.0 | 30 Nov | AI Chat Assistant, Services Layer planned |
| 8.1 | 30 Nov | Phase F3: Services Layer Foundation |
| 9.0 | 30 Nov | Complete P1-P3 implementation, data integrity enforcement, date range filtering |
| 10.0 | 30 Nov | Phase P4: Expenses Enhancement - procurement_method field |
| **11.0** | **30 Nov** | **Phase P5: Partner Invoicing + Data Protection Strategy** |

---

## What's New in Version 11.0

### Phase P5 Complete ✅

| Phase | Feature | Status |
|-------|---------|--------|
| P1 | Partners Database Schema | ✅ Complete |
| P2 | Partners Management Page | ✅ Complete |
| P3 | Resources Enhancement | ✅ Complete |
| P4 | Expenses Enhancement | ✅ Complete |
| **P5** | **Partner Invoicing** | ✅ Complete |

### Major Achievements (30 Nov 2025)

#### Phase P5: Partner Invoicing
- Created `partner_invoices` and `partner_invoice_lines` tables
- InvoicingService with invoice generation
- Auto-increment invoice numbers (INV-YYYY-NNN)
- Partner Detail "Generate Invoice" now functional
- Invoice modal showing summary and line items
- Recent Invoices table on Partner Detail page

#### Phase P4: Expenses Enhancement (Earlier)
- Added `procurement_method` column to expenses
- Per-category chargeable/procurement settings in expense form
- Procurement filtering and stats on Expenses page
- Invoice Preview on Partner Detail page

#### 1. Services Layer Foundation
- `BaseService` class with CRUD operations
- `PartnersService` for partner management
- `ResourcesService` for resource operations
- `ExpensesService` for expense operations (NEW)
- Multi-tenant project filtering built-in

#### 2. Partners Feature
- Full partners table with RLS policies
- Partners list page with CRUD operations
- Partner Detail page with linked resources
- Timesheet and expense summaries per partner

#### 3. Resources Enhancement
- Resource type: `supplier` | `partner` | `customer`
- Partner association via dropdown
- Resource Detail page with full editing
- Click-through navigation between pages

#### 4. Data Integrity Enforcement
- All tables have `NOT NULL` constraint on `project_id`
- Foreign key constraints with `ON DELETE CASCADE`
- Performance indexes on all `project_id` columns
- `resource_id` foreign key added to expenses table

#### 5. Date Range Filtering (Partner Detail)
- Month quick-select (last 12 months)
- Custom date range picker
- Filtered stats, timesheets, and expenses
- "Generate Invoice" button (placeholder for P5)

### Database Changes Applied

```sql
-- Partners table created
-- resources.partner_id added (FK to partners)
-- expenses.resource_id added (FK to resources)
-- NOT NULL constraints on all project_id columns
-- Indexes on project_id columns
-- Foreign key constraints with CASCADE
```

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Current Architecture](#3-current-architecture)
4. [File Structure](#4-file-structure)
5. [Permissions & Security](#5-permissions--security)
6. [Development Phases](#6-development-phases)
7. [Database Schema](#7-database-schema)
8. [Working with Claude](#8-working-with-claude)
9. [Deployment](#9-deployment)
10. [Roadmap](#10-roadmap)

---

## 1. Project Overview

### What is AMSF001 Project Tracker?

A web-based project management tool for tracking the Network Standards and Design Architectural Services contract between Government of Jersey (customer) and JT Telecom (supplier).

**Key Features:**
- **Timesheets** - Billable hours tracking with approval workflows
- **Expenses** - Travel, accommodation, sustenance with validation
- **Milestones** - Project phases with budget allocations
- **Deliverables** - Outputs tied to milestones with review workflow
- **KPIs & Quality Standards** - Performance metrics per SOW
- **Resources** - Team members with rates, types, and partner associations
- **Partners** - Third-party supplier management with invoicing support
- **AI Chat Assistant** - Context-aware help and data queries

### User Roles

| Role | Primary Purpose | Key Permissions |
|------|-----------------|-----------------|
| **Viewer** | Read-only access | View all data |
| **Contributor** | Team member | Log time/expenses for self |
| **Customer PM** | GoJ representative | Approve timesheets, validate chargeable expenses |
| **Supplier PM** | JT representative | Full delivery management, partners, invoicing |
| **Admin** | System admin | All permissions |

---

## 2. Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React | 18.2 |
| Routing | React Router | 6.x |
| Build Tool | Vite | 5.x |
| Icons | Lucide React | 0.294 |
| Charts | Recharts | 2.10 |
| Date Handling | date-fns | 3.0 |
| Backend | Supabase | 2.39 |
| Database | PostgreSQL | (via Supabase) |
| AI | Claude API | Haiku |
| Hosting | Vercel | - |
| Source Control | GitHub | - |

---

## 3. Current Architecture

### 3.1 Services Layer Pattern

```javascript
// All data operations go through services
import { partnersService, resourcesService } from '../services';

// Services handle project filtering automatically
const partners = await partnersService.getAll(projectId);
const activePartners = await partnersService.getActive(projectId);
await partnersService.create({ name: 'Acme', project_id: projectId });
```

### 3.2 Context Pattern

```javascript
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { useChat } from '../contexts/ChatContext';

const { user, role, linkedResource } = useAuth();
const { projectId } = useProject();
const { sendMessage } = useChat();
```

### 3.3 Permissions Hook

```javascript
import { usePermissions } from '../hooks/usePermissions';

const { 
  canAddTimesheet,      // Boolean
  canEditExpense,       // Function - pass object
  canManagePartners,    // Boolean
  canSeeResourceType,   // Boolean
  hasRole               // Utility function
} = usePermissions();
```

### 3.4 Shared Components

```javascript
import { 
  LoadingSpinner, PageHeader, StatCard, 
  StatusBadge, DataTable, ConfirmDialog 
} from '../components/common';
```

---

## 4. File Structure

```
/
├── api/
│   └── chat.js                    # Vercel Edge Function for AI
├── sql/
│   ├── data-integrity-constraints.sql   # Multi-tenancy enforcement
│   ├── add-resource-id-to-expenses.sql  # FK migration
│   └── P3a-add-partner-id-to-resources.sql
├── src/
│   ├── components/
│   │   ├── common/                # Shared UI components
│   │   │   ├── index.js, LoadingSpinner.jsx, StatCard.jsx,
│   │   │   ├── PageHeader.jsx, StatusBadge.jsx, DataTable.jsx,
│   │   │   └── ConfirmDialog.jsx, ErrorBoundary.jsx
│   │   ├── chat/                  # AI Chat widget
│   │   └── Layout.jsx, NotificationBell.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx        # User, profile, role
│   │   ├── ProjectContext.jsx     # Multi-tenancy
│   │   ├── ChatContext.jsx        # AI chat state
│   │   └── NotificationContext.jsx
│   ├── hooks/
│   │   └── usePermissions.js      # Permission functions
│   ├── lib/
│   │   ├── permissions.js         # 40+ permission functions
│   │   └── supabase.js
│   ├── services/                  # ✅ NEW - Services Layer
│   │   ├── index.js               # Barrel export
│   │   ├── base.service.js        # BaseService class
│   │   ├── partners.service.js    # Partners operations
│   │   └── resources.service.js   # Resources operations
│   └── pages/
│       ├── Partners.jsx           # ✅ NEW - Partners list
│       ├── PartnerDetail.jsx      # ✅ NEW - Partner detail + date filter
│       ├── Resources.jsx          # ✅ UPDATED - Type display
│       ├── ResourceDetail.jsx     # ✅ NEW - Resource detail + partner
│       ├── Dashboard.jsx, Timesheets.jsx, Expenses.jsx,
│       ├── Milestones.jsx, MilestoneDetail.jsx, Deliverables.jsx,
│       ├── KPIs.jsx, KPIDetail.jsx, QualityStandards.jsx,
│       └── ... (other pages)
```

---

## 5. Permissions & Security

### 5.1 Role Permission Matrix

| Action | Viewer | Contributor | Customer PM | Supplier PM | Admin |
|--------|:------:|:-----------:|:-----------:|:-----------:|:-----:|
| **Partners** |
| View partners | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage partners | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Resources** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| See cost/type | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Timesheets** |
| View all | ✅ | ✅ | ✅ | ✅ | ✅ |
| Add own | ❌ | ✅ | ❌ | ✅ | ✅ |
| Approve | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Expenses** |
| Validate chargeable | ❌ | ❌ | ✅ | ❌ | ✅ |
| Validate non-chargeable | ❌ | ❌ | ❌ | ✅ | ✅ |

### 5.2 Data Integrity (Multi-Tenancy)

All core tables now enforce:
- `project_id NOT NULL` constraint
- Foreign key to `projects(id)` with `ON DELETE CASCADE`
- Performance index on `project_id`

Tables protected:
- resources, milestones, deliverables, timesheets
- expenses, partners, kpis, quality_standards

---

## 6. Development Phases

### Phase Status Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| F1 | Code Cleanup | ✅ Complete | Legacy code removal |
| F2 | Shared Components | ✅ Complete | 7 reusable components |
| AI | Chat Assistant | ✅ Complete | Claude Haiku integration |
| F3 | Services Layer | ✅ Complete | BaseService, Partners, Resources, Expenses |
| P1 | Partners Schema | ✅ Complete | Database table + RLS |
| P2 | Partners Page | ✅ Complete | Full CRUD management |
| P3 | Resources Enhancement | ✅ Complete | Types, partner links, detail page |
| P4 | Expenses Enhancement | ✅ Complete | procurement_method field, invoice prep |
| **P5** | **Partner Invoicing** | 🔜 Next | Invoice generation workflow |
| **P6** | **Reporting** | 🔜 Planned | Enhanced reports with partner data |

### Completed Today (30 Nov)

- [x] Services Layer Foundation (F3)
- [x] Partners database table (P1)
- [x] Partners list page with CRUD (P2)
- [x] Partner Detail page with summaries
- [x] Resources type field (supplier/partner/customer)
- [x] Resource Detail page with partner dropdown
- [x] Data integrity constraints (NOT NULL, FK, indexes)
- [x] expenses.resource_id foreign key
- [x] Date range filtering on Partner Detail
- [x] Month quick-select for partner invoicing prep
- [x] Partner stats showing pending timesheets

---

## 7. Database Schema

### Core Tables Relationship

```
┌─────────────────┐
│    projects     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼
┌───────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│partners│ │resources│ │expenses │ │timesheets│ │milestones│
└───┬────┘ └────┬───┘ └────┬───┘ └────────┘ └────────┘
    │           │          │
    └─────►─────┤◄─────────┘
          partner_id  resource_id
```

### Partners Table

```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  payment_terms TEXT DEFAULT 'Net 30',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Resources Table (Updated)

```sql
-- Added columns
partner_id UUID REFERENCES partners(id) ON DELETE SET NULL
resource_type TEXT CHECK (resource_type IN ('supplier', 'partner', 'customer'))
```

### Expenses Table (Updated)

```sql
-- Added column
resource_id UUID REFERENCES resources(id) ON DELETE SET NULL
```

---

## 8. Working with Claude

### Session Starter

Upload these files:
1. `AI_AMSF001-Claude-Session-Prompt-v4.md`
2. `AMSF001-Configuration-Guide-v3.md` (from Project Knowledge)

### Standard Commands

```applescript
-- Check status
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git status"

-- Commit and deploy
do shell script "cd /Users/glennnickols/Projects/amsf001-project-tracker && git add -A && git commit -m 'Description' && git push origin main"
```

### Key Patterns

```javascript
// Services for data operations
const partners = await partnersService.getAll(projectId);

// Permissions for UI control
const { canManagePartners, canSeeResourceType } = usePermissions();

// Shared components for consistency
import { StatCard, LoadingSpinner } from '../components/common';
```

---

## 9. Deployment

### Automatic Pipeline

```
Local → git push → GitHub → Vercel Auto-Deploy → Live
```

### Environment Variables (Vercel)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key |
| `ANTHROPIC_API_KEY` | AI Chat functionality |

### URLs

| Resource | URL |
|----------|-----|
| Live App | https://amsf001-project-tracker.vercel.app |
| GitHub | https://github.com/spac3man-G/amsf001-project-tracker |
| Supabase | https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce |

---

## 10. Roadmap

### Immediate (Next Session)

#### Phase P7: Delete Functionality & Cascade Warnings
- Add delete buttons to Timesheets, Expenses, Resources, Partners pages
- Admin and Supplier PM can delete any content
- Cascade warning dialog showing affected child records
- Confirmation required before deletion

#### Phase P8: Soft Delete & Data Protection
- Add `is_deleted`, `deleted_at`, `deleted_by` columns to all tables
- Filter out deleted records in queries
- "Trash" view for Admins to see/restore deleted items
- 30-day auto-purge of soft-deleted records
- Audit logging for all delete actions

### Short Term

#### Phase P6: Reporting
- Partner cost breakdown reports
- Resource utilization by type
- Expense analysis by procurement method

#### Phase P9: Invoice PDF Export
- PDF generation for partner invoices
- Printable invoice layout
- Email invoice capability

#### Code Quality
- Add TimesheetsService
- Unit tests for critical functions
- Error boundary improvements

### Medium Term

#### Multi-Project Support
- Project switcher in header
- Cross-project reporting
- Project-level settings

#### Enhanced Features
- Document attachments
- Email notifications
- Dashboard customization

### Long Term (Production Readiness)

#### Security Hardening
- Rate limiting on API
- Input validation review
- Security audit

#### Performance
- Query optimization
- Caching strategy
- Bundle size reduction

#### Operations
- Backup automation
- Monitoring/alerting
- User documentation (help pages)

---

## 11. Data Protection Strategy

### Current Backup Capabilities (Supabase Free Tier)

| Feature | Availability |
|---------|--------------|
| Daily automated backups | ✅ Yes (7-day retention) |
| Point-in-time recovery | ❌ Pro tier only |
| Self-service restore | ❌ Contact Supabase support |
| Manual pg_dump export | ✅ Yes (manual) |

### Recommended Multi-Layer Protection

| Layer | Implementation | Purpose |
|-------|----------------|---------|
| **1. Soft Delete** | `is_deleted` + `deleted_at` columns | Immediate "undo" capability |
| **2. Cascade Warnings** | UI shows child records before delete | Prevent accidental data loss |
| **3. Trash/Archive** | View deleted items, restore option | Recovery within app |
| **4. Audit Trail** | `deleted_by` + audit log table | Compliance & accountability |
| **5. Manual Backup** | Weekly SQL export script | Disaster recovery |
| **6. Supabase Daily** | Automatic (7-day retention) | Platform-level recovery |

### Entity Dependency Map

Understanding what deleting a parent record affects:

```
Project
├── Partners → Resources → Timesheets, Expenses
├── Milestones → Deliverables
├── Resources → Timesheets, Expenses
├── KPIs
├── Quality Standards
└── Partner Invoices → Invoice Lines
```

### Cascade Warning Requirements

When deleting, show warnings for:

| Entity | Show Count Of |
|--------|---------------|
| Partner | Linked resources, timesheets, expenses, invoices |
| Resource | Timesheets, expenses |
| Milestone | Deliverables |
| Project | ALL child entities |

### Soft Delete Schema (Phase P8)

```sql
-- Add to all main tables
ALTER TABLE [table_name] ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE [table_name] ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE [table_name] ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Filter in all queries
WHERE is_deleted = false
```

### Permission Matrix for Delete

| Entity | Viewer | Contributor | Customer PM | Supplier PM | Admin |
|--------|:------:|:-----------:|:-----------:|:-----------:|:-----:|
| Own timesheets | ❌ | ✅ (Draft only) | ❌ | ✅ | ✅ |
| Any timesheets | ❌ | ❌ | ❌ | ✅ | ✅ |
| Own expenses | ❌ | ✅ (Draft only) | ❌ | ✅ | ✅ |
| Any expenses | ❌ | ❌ | ❌ | ✅ | ✅ |
| Resources | ❌ | ❌ | ❌ | ✅ | ✅ |
| Partners | ❌ | ❌ | ❌ | ✅ | ✅ |
| Milestones | ❌ | ❌ | ❌ | ✅ | ✅ |
| Deliverables | ❌ | ❌ | ❌ | ✅ | ✅ |
| Invoices | ❌ | ❌ | ❌ | ❌ | ✅ |

### Manual Backup Procedure

Until automated backup is implemented, perform weekly:

```bash
# Connect to Supabase and export
pg_dump -h db.ljqpmrcqxzgcfojrkxce.supabase.co \
  -U postgres -d postgres \
  --data-only --inserts \
  > backup-$(date +%Y%m%d).sql
```

Or use Supabase Dashboard: Database → Backups → Download

---

## Appendix A: SQL Scripts Reference

| Script | Purpose | Location |
|--------|---------|----------|
| `data-integrity-constraints.sql` | NOT NULL, FK, indexes | `/sql/` |
| `add-resource-id-to-expenses.sql` | Expense→Resource FK | `/sql/` |
| `P3a-add-partner-id-to-resources.sql` | Resource→Partner FK | `/sql/` |

---

## Appendix B: Component Reference

### Shared Components (`/components/common`)

| Component | Props | Purpose |
|-----------|-------|---------|
| `LoadingSpinner` | `message` | Loading state |
| `PageHeader` | `icon, title, subtitle, actions` | Page headers |
| `StatCard` | `icon, label, value, subtext, color` | Metric cards |
| `StatusBadge` | `status, size` | Status indicators |
| `DataTable` | `columns, data, actions` | Data tables |
| `ConfirmDialog` | `isOpen, title, message, onConfirm, onCancel` | Confirmations |

### Services (`/services`)

| Service | Methods | Purpose |
|---------|---------|---------|
| `partnersService` | `getAll, getById, getActive, create, update, delete` | Partner CRUD |
| `resourcesService` | `getAll, getById, getByPartner, getWithTimesheetSummary, create, update, delete` | Resource CRUD |
| `expensesService` | `getAll, getByResource, getByPartner, getSummary, create, submit, approve, reject` | Expense CRUD |
| `invoicingService` | `generateInvoice, getWithLines, markSent, markPaid, cancel, getPartnerStats` | Invoice management |

---

## Appendix C: Testing Checklist

### Partners Feature
- [ ] Create new partner
- [ ] Edit partner details
- [ ] Deactivate partner
- [ ] View partner detail page
- [ ] Link resource to partner
- [ ] View timesheets/expenses for partner
- [ ] Filter by date range
- [ ] Filter by month

### Resources Feature
- [ ] Change resource type
- [ ] Assign partner to resource
- [ ] View resource detail
- [ ] Navigate to partner from resource
- [ ] Navigate to resource from partner

### Data Integrity
- [ ] Cannot create record without project_id
- [ ] Deleting project cascades to children
- [ ] Expenses link to resources via resource_id

### Invoicing Feature
- [ ] Select date range on Partner Detail
- [ ] Click Generate Invoice
- [ ] Invoice modal shows summary
- [ ] Line items display correctly
- [ ] Invoice appears in Recent Invoices table
- [ ] Invoice number auto-increments

### Delete Functionality (Phase P7)
- [ ] Admin can delete timesheets
- [ ] Supplier PM can delete timesheets
- [ ] Cascade warning shows child count
- [ ] Confirmation dialog before delete
- [ ] Delete respects soft-delete if implemented

---

*Document Version: 11.0*  
*Last Updated: 30 November 2025*
