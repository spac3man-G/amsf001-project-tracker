# AMSF001 Project Tracker - Technical Specification

## Master Reference Document

**Document Version:** 1.0  
**Created:** December 2025  
**Status:** Complete  
**Total Sessions:** 8  

---

## Document Purpose

This master document serves as the authoritative introduction and reference guide for the AMSF001 Project Tracker technical architecture. It is designed to:

1. **Provide Context** - Give developers, AI assistants, and stakeholders a complete understanding of the system
2. **Link Documentation** - Connect all 8 technical specification documents into a cohesive whole
3. **Enable Future Work** - Serve as the starting point for any development, maintenance, or AI-assisted work on this project
4. **Capture Decisions** - Document key architectural decisions and their rationale

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Technology Stack](#3-technology-stack)
4. [Database Architecture](#4-database-architecture)
5. [Security Model](#5-security-model)
6. [API & AI Integration](#6-api--ai-integration)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Service Layer](#8-service-layer)
9. [Document Index](#9-document-index)
10. [Key Concepts](#10-key-concepts)
11. [Development Guidelines](#11-development-guidelines)
12. [Quick Reference](#12-quick-reference)

---

## 1. Project Overview

### 1.1 What is AMSF001 Project Tracker?

The AMSF001 Project Tracker is a **multi-tenant SaaS application** designed for managing complex enterprise project portfolios. Originally built for Network Architecture Services projects, it provides comprehensive project management capabilities including:

- **Milestone & Deliverable Management** - Track project phases and work products with dual-signature workflows
- **Time & Expense Tracking** - Submit, validate, and approve timesheets and expenses
- **Partner Management** - Manage third-party suppliers and generate partner invoices
- **Change Control (Variations)** - Formal change request process with baseline versioning
- **Quality Management** - KPIs, Quality Standards, and RAID log tracking
- **AI-Powered Features** - Chat assistant and receipt scanning using Claude AI

### 1.2 Multi-Tenancy Model

The application supports multiple projects (tenants) with:

- **Project-Scoped Data** - All business data is isolated by `project_id`
- **Role Per Project** - Users can have different roles on different projects
- **Project Switching** - Users with multiple assignments can switch between projects
- **Row Level Security** - Database-enforced isolation via PostgreSQL RLS policies

### 1.3 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **Admin** | System administrator | Full access to all features and administrative functions |
| **Supplier PM** | Supplier project manager | Manage resources, partners, billing, and project operations |
| **Customer PM** | Customer project manager | Approve timesheets, validate expenses, sign certificates |
| **Contributor** | Team member | Submit timesheets, expenses, and work on deliverables |
| **Viewer** | Read-only stakeholder | View dashboards, reports, and project data |

---

## 2. Architecture Summary

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      React Application                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │   Pages     │  │ Components  │  │   Hooks     │              │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │  │
│  │         │                │                │                       │  │
│  │         └────────────────┼────────────────┘                       │  │
│  │                          ▼                                        │  │
│  │              ┌─────────────────────┐                              │  │
│  │              │     Contexts        │  (Auth, Project, ViewAs,     │  │
│  │              │   (State Mgmt)      │   Metrics, Toast, Chat)      │  │
│  │              └──────────┬──────────┘                              │  │
│  │                         ▼                                         │  │
│  │              ┌─────────────────────┐                              │  │
│  │              │     Services        │  (Singleton pattern,         │  │
│  │              │   (Data Layer)      │   business logic)            │  │
│  │              └──────────┬──────────┘                              │  │
│  └─────────────────────────┼────────────────────────────────────────┘  │
└────────────────────────────┼───────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│     Supabase     │ │  Vercel Edge     │ │   Anthropic      │
│                  │ │   Functions      │ │    Claude        │
│ ┌──────────────┐ │ │                  │ │                  │
│ │  PostgreSQL  │ │ │ • /api/chat      │ │ • Chat Assistant │
│ │   Database   │ │ │ • /api/scan-     │ │ • Receipt OCR    │
│ │              │ │ │   receipt        │ │ • Context Aware  │
│ │ ┌──────────┐ │ │ │ • /api/create-   │ │                  │
│ │ │   RLS    │ │ │ │   user          │ │                  │
│ │ │ Policies │ │ │ │                  │ │                  │
│ │ └──────────┘ │ │ │                  │ │                  │
│ └──────────────┘ │ │                  │ │                  │
│                  │ │                  │ │                  │
│ ┌──────────────┐ │ └──────────────────┘ └──────────────────┘
│ │   Supabase   │ │
│ │     Auth     │ │
│ └──────────────┘ │
│                  │
│ ┌──────────────┐ │
│ │   Storage    │ │
│ │  (Receipts)  │ │
│ └──────────────┘ │
└──────────────────┘
```

### 2.2 Data Flow Pattern

```
User Action → Component → Hook → Service → Supabase → RLS Check → Database
                                    ↓
                               Context Update → UI Re-render
```

### 2.3 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Supabase Backend** | Managed PostgreSQL with built-in auth, RLS, and real-time capabilities |
| **Vercel Hosting** | Zero-config deployment, edge functions, excellent React support |
| **Row Level Security** | Database-enforced multi-tenancy without middleware complexity |
| **Singleton Services** | Consistent data access patterns, easy caching, testable |
| **Context-Based State** | React-native state management without external dependencies |
| **Soft Delete Pattern** | Audit trail, recovery capability, referential integrity |

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| React Router DOM | 6.20.0 | Client-side routing |
| Vite | 5.4.21 | Build tool |
| Recharts | 2.10.0 | Charts and visualizations |
| React Grid Layout | 1.5.2 | Dashboard customization |
| Lucide React | 0.294.0 | Icons |
| date-fns | 3.0.0 | Date utilities |

### 3.2 Backend

| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service (BaaS) |
| PostgreSQL | Primary database |
| Supabase Auth | Authentication |
| Supabase Storage | File storage (receipts) |

### 3.3 Deployment

| Technology | Purpose |
|------------|---------|
| Vercel | Hosting and serverless functions |
| GitHub | Source control and CI/CD trigger |

### 3.4 AI Integration

| Technology | Purpose |
|------------|---------|
| Claude Haiku | Fast chat responses, context building |
| Claude Sonnet | Complex queries, document analysis |
| Claude Vision | Receipt scanning OCR |

---

## 4. Database Architecture

### 4.1 Table Categories

The database consists of **28 tables** organized into four categories:

**Core Tables (Session 1.2):**
- `projects` - Tenant definitions
- `profiles` - User accounts
- `user_projects` - Multi-tenancy junction
- `milestones` - Project phases and payment milestones
- `deliverables` - Work products
- `resources` - Team members
- `resource_availability` - Resource calendar

**Operational Tables (Session 1.3):**
- `timesheets` - Time entries
- `expenses` - Expense claims
- `partners` - Third-party suppliers
- `partner_invoices` - Invoice headers
- `partner_invoice_lines` - Invoice line items

**Supporting Tables (Session 1.4):**
- `kpis` - Key Performance Indicators
- `quality_standards` - Quality metrics
- `raid_items` - Risks, Assumptions, Issues, Dependencies
- `variations` - Change requests
- `variation_milestones` - Affected milestones
- `variation_deliverables` - Affected deliverables
- `variation_signers` - Approval signatures
- `baseline_versions` - Version history
- `document_templates` - JSONB templates
- `notification_preferences` - User notification settings
- `audit_log` - Change audit trail
- `deleted_items` - Soft delete metadata

**Junction Tables:**
- `deliverable_kpis` - Deliverable to KPI links
- `deliverable_quality_standards` - Deliverable to QS links
- `milestone_baseline_commitments` - Baseline signatures
- `milestone_acceptance_certificates` - Acceptance signatures

### 4.2 Entity Relationships

```
projects (tenant)
    │
    ├── milestones ──────┬── deliverables ──┬── deliverable_kpis
    │       │            │       │          └── deliverable_quality_standards
    │       │            │       │
    │       │            │       └── (links to KPIs and Quality Standards)
    │       │            │
    │       ├── baseline_commitments
    │       └── acceptance_certificates
    │
    ├── resources ───────┬── timesheets
    │       │            └── expenses
    │       └── resource_availability
    │
    ├── partners ────────┬── resources (linked)
    │                    └── partner_invoices ── partner_invoice_lines
    │
    ├── variations ──────┬── variation_milestones
    │                    ├── variation_deliverables
    │                    └── variation_signers
    │
    ├── kpis
    ├── quality_standards
    ├── raid_items
    └── document_templates
```

### 4.3 Soft Delete Implementation

All major entities support soft delete:

```sql
is_deleted BOOLEAN DEFAULT false,
deleted_at TIMESTAMPTZ,
deleted_by UUID REFERENCES profiles(id)
```

**Key Points:**
- Client-side filtering used (avoids PostgREST `.or()` issues)
- Deleted items accessible via Deleted Items page
- Admin can restore soft-deleted records
- Hard delete available for permanent removal

---

## 5. Security Model

### 5.1 Row Level Security (RLS)

All tables have RLS enabled with policies based on:

1. **Project Membership** - User must be assigned to the project
2. **Role-Based Access** - Actions restricted by user role
3. **Ownership Rules** - Some entities restricted to creator/owner

### 5.2 RLS Policy Patterns

**View Policy (all authenticated users in project):**
```sql
CREATE POLICY "view_policy" ON table_name
FOR SELECT TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM user_projects 
    WHERE user_id = auth.uid()
  )
);
```

**Modify Policy (role-restricted):**
```sql
CREATE POLICY "modify_policy" ON table_name
FOR ALL TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM user_projects 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'supplier_pm')
  )
);
```

### 5.3 Permission Matrix

Permissions are defined in `/src/lib/permissionMatrix.js`:

| Entity | View | Create | Edit | Delete | Special Actions |
|--------|------|--------|------|--------|-----------------|
| Timesheets | All | Workers | Workers | Supplier | approve: Customer |
| Expenses | All | Workers | Workers | Supplier | validate: Customer/Supplier |
| Milestones | All | Supplier | Supplier | Admin | - |
| Deliverables | All | Managers+Contrib | Managers+Contrib | Supplier | submit: Workers, review: Customer |
| Resources | All | Supplier | Supplier | Admin | seeCostPrice: Supplier |
| Partners | Supplier | Supplier | Supplier | Supplier | - |
| Variations | All | Supplier | Supplier | Supplier | sign: Both parties |

---

## 6. API & AI Integration

### 6.1 Serverless Functions

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | AI chat with streaming response |
| `/api/chat-stream` | POST | Alternative streaming implementation |
| `/api/chat-context` | POST | Retrieve project context for AI |
| `/api/create-user` | POST | Admin user creation |
| `/api/scan-receipt` | POST | Receipt OCR with Claude Vision |

### 6.2 AI Chat Architecture

```
User Query → chat.js → Build Context → Claude API → Stream Response
                ↓
         chat-context.js
                ↓
         Supabase Queries (project data)
```

**Model Routing:**
- **Claude Haiku** - Fast responses, context building, simple queries
- **Claude Sonnet** - Complex analysis, document generation

**Tool Definitions:**
The AI assistant has tools for querying:
- Milestones and deliverables
- Timesheets and expenses
- Resources and partners
- KPIs and quality standards
- RAID items
- Project metrics

### 6.3 Receipt Scanner

Uses Claude Vision API to extract:
- Vendor/Merchant name
- Date
- Total amount
- Currency
- Line items
- Category suggestions

Includes a learning system that remembers merchant categorizations.

---

## 7. Frontend Architecture

### 7.1 Context Providers

| Context | Purpose | Key State |
|---------|---------|-----------|
| `AuthContext` | Authentication | user, profile, role, session |
| `ProjectContext` | Multi-tenancy | currentProject, projectRole, availableProjects |
| `ViewAsContext` | Role impersonation | effectiveRole, isImpersonating |
| `MetricsContext` | Dashboard data | metrics, loading states |
| `ToastContext` | Notifications | toast queue |
| `ChatContext` | AI chat | messages, streaming state |
| `NotificationContext` | System alerts | notifications, preferences |

### 7.2 Provider Hierarchy

```jsx
<AuthProvider>
  <ProjectProvider>
    <ViewAsProvider>
      <ToastProvider>
        <NotificationProvider>
          <MetricsProvider>
            <ChatProvider>
              <App />
            </ChatProvider>
          </MetricsProvider>
        </NotificationProvider>
      </ToastProvider>
    </ViewAsProvider>
  </ProjectProvider>
</AuthProvider>
```

### 7.3 Custom Hooks

| Hook | Purpose |
|------|---------|
| `usePermissions` | Check user permissions for actions |
| `useDashboardLayout` | Dashboard widget management |
| `useDebounce` | Debounced value updates |
| `useLocalStorage` | Persistent local storage |
| `useClickOutside` | Detect clicks outside element |

### 7.4 Page Structure

```
/login                    - Authentication
/dashboard               - Customizable dashboard
/workflow-summary        - Pending actions overview
/milestones              - Milestone list and management
/milestones/:id          - Milestone detail
/deliverables            - Deliverable list
/deliverables/:id        - Deliverable detail
/timesheets              - Timesheet management
/expenses                - Expense management
/resources               - Resource management
/resources/:id           - Resource detail
/partners                - Partner management
/partners/:id            - Partner detail with invoicing
/variations              - Change control
/variations/:id          - Variation detail
/variations/new          - Create variation
/kpis                    - KPI management
/quality-standards       - Quality standards
/raid                    - RAID log
/billing                 - Billing overview
/calendar                - Resource calendar
/gantt                   - Gantt chart view
/reports                 - Report generation
/users                   - User management
/settings                - Project settings
/audit-log               - Audit trail
/deleted-items           - Soft-deleted records
/account                 - User profile
```

---

## 8. Service Layer

### 8.1 Service Architecture

All services follow a singleton pattern extending `BaseService`:

```javascript
class EntityService extends BaseService {
  constructor() {
    super('table_name', { softDelete: true });
  }
  
  // Custom methods...
}

export const entityService = new EntityService();
```

### 8.2 Service Inventory

| Service | Entity | Key Features |
|---------|--------|--------------|
| `MilestonesService` | milestones | Baseline signing, certificates |
| `DeliverablesService` | deliverables | Dual-signature workflow, KPI/QS links |
| `ResourcesService` | resources | Utilization, margin calculation |
| `TimesheetsService` | timesheets | Validation workflow |
| `ExpensesService` | expenses | Receipt handling, batch operations |
| `PartnersService` | partners | Caching for selects |
| `KPIsService` | kpis | RAG status calculation |
| `QualityStandardsService` | quality_standards | Compliance tracking |
| `RaidService` | raid_items | Auto-reference generation |
| `VariationsService` | variations | Dual-approval, baseline versioning |
| `MetricsService` | (aggregation) | Dashboard metrics, 5-second cache |
| `DashboardService` | (aggregation) | Layout persistence |
| `InvoicingService` | (aggregation) | Invoice generation |
| `CalendarService` | (aggregation) | Calendar integration |
| `DocumentTemplatesService` | document_templates | JSONB template management |
| `DocumentRendererService` | (utility) | HTML/DOCX/PDF generation |
| `ReceiptScannerService` | (utility) | AI receipt processing |

### 8.3 Calculation Libraries

| Library | Purpose |
|---------|---------|
| `milestoneCalculations.js` | Status, progress, baseline, variance |
| `deliverableCalculations.js` | Status transitions, sign-off workflow |
| `timesheetCalculations.js` | Status workflow, validation rules |

---

## 9. Document Index

### 9.1 Technical Specification Documents

| Document | Session | Content |
|----------|---------|---------|
| [TECH-SPEC-01-Architecture.md](./TECH-SPEC-01-Architecture.md) | 1.1 | Technology stack, project structure, deployment |
| [TECH-SPEC-02-Database-Core.md](./TECH-SPEC-02-Database-Core.md) | 1.2 | Projects, profiles, milestones, deliverables, resources |
| [TECH-SPEC-03-Database-Operations.md](./TECH-SPEC-03-Database-Operations.md) | 1.3 | Timesheets, expenses, partners, invoices |
| [TECH-SPEC-04-Database-Supporting.md](./TECH-SPEC-04-Database-Supporting.md) | 1.4 | KPIs, quality standards, RAID, variations, audit |
| [TECH-SPEC-05-RLS-Security.md](./TECH-SPEC-05-RLS-Security.md) | 1.5 | RLS policies, authentication, role matrix |
| [TECH-SPEC-06-API-AI.md](./TECH-SPEC-06-API-AI.md) | 1.6 | Serverless functions, Claude integration, tools |
| [TECH-SPEC-07-Frontend-State.md](./TECH-SPEC-07-Frontend-State.md) | 1.7 | Contexts, hooks, state management |
| [TECH-SPEC-08-Services.md](./TECH-SPEC-08-Services.md) | 1.8 | Service layer, business logic, caching |

### 9.2 Supporting Documentation

| Document | Purpose |
|----------|---------|
| [AMSF001-Documentation-Approach-2025-12-10.md](./AMSF001-Documentation-Approach-2025-12-10.md) | Documentation project plan and checklist |
| [DOCUMENT-TEMPLATES-SPECIFICATION.md](./DOCUMENT-TEMPLATES-SPECIFICATION.md) | JSONB template system specification |
| [MULTI-TENANCY-ANALYSIS-2025-12-08.md](./MULTI-TENANCY-ANALYSIS-2025-12-08.md) | Multi-tenancy implementation analysis |

---

## 10. Key Concepts

### 10.1 Workflow Statuses

**Timesheet Workflow:**
```
Draft → Submitted → Approved/Rejected
                         ↓
                    (Rejected returns to Draft for resubmission)
```

**Expense Workflow:**
```
Draft → Submitted → Approved/Rejected → Paid
```

**Deliverable Workflow:**
```
Not Started → In Progress → Submitted for Review → Review Complete → Delivered
                                    ↓
                           Returned for More Work
```

**Variation Workflow:**
```
Draft → Submitted → Awaiting Supplier Sign → Awaiting Customer Sign → Approved → Applied
                              ↓                        ↓
                         Rejected                  Rejected
```

### 10.2 Dual-Signature Pattern

Several entities require signatures from both supplier and customer:

- **Baseline Commitments** - Lock milestone targets
- **Acceptance Certificates** - Confirm milestone completion
- **Deliverable Sign-offs** - Confirm deliverable acceptance
- **Variation Approvals** - Authorize scope changes

### 10.3 Budget and Billing

- **Milestone Budget** - Expected value per milestone
- **Daily Rate** - Resource billing rate (customer-visible)
- **Cost Price** - Resource cost to supplier (supplier-only)
- **Margin** - Calculated as `dailyRate - costPrice`
- **Chargeable** - Whether expense is billable to customer

### 10.4 Project Scoping

All data queries should include `project_id` filtering:

```javascript
// Correct
const { data } = await supabase
  .from('milestones')
  .select('*')
  .eq('project_id', currentProject.id);

// The service layer handles this automatically
milestonesService.getAll(currentProject.id);
```

---

## 11. Development Guidelines

### 11.1 Adding a New Feature

1. **Database First** - Create/modify tables with proper RLS policies
2. **Service Layer** - Add service methods for data operations
3. **Context (if needed)** - Add state management if shared across components
4. **Components** - Build UI components
5. **Pages** - Create page components with routing
6. **Navigation** - Add to navigation config if needed
7. **Permissions** - Update permission matrix

### 11.2 Code Patterns

**Service Method Pattern:**
```javascript
async getWithRelations(projectId) {
  const { data, error } = await supabase
    .from(this.table)
    .select(`
      *,
      related_table (*)
    `)
    .eq('project_id', projectId)
    .eq('is_deleted', false);
    
  if (error) {
    console.error(`${this.table} error:`, error);
    throw error;
  }
  return data || [];
}
```

**Hook Usage Pattern:**
```javascript
const { hasPermission } = usePermissions();
const canEdit = hasPermission('entity', 'edit');
```

### 11.3 Important Files

| File | Purpose |
|------|---------|
| `/src/lib/navigation.js` | Navigation configuration |
| `/src/lib/permissionMatrix.js` | Permission definitions |
| `/src/lib/permissions.js` | Permission helper functions |
| `/src/lib/supabase.js` | Supabase client configuration |
| `/src/services/index.js` | Service barrel exports |

---

## 12. Quick Reference

### 12.1 Environment Variables

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
ANTHROPIC_API_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### 12.2 Key Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
vercel               # Deploy to Vercel
```

### 12.3 Database Access

```javascript
import { supabase } from '../lib/supabase';

// Query with RLS (uses user's session)
const { data, error } = await supabase
  .from('table')
  .select('*');

// Service role bypasses RLS (server-side only)
import { createClient } from '@supabase/supabase-js';
const adminClient = createClient(url, serviceRoleKey);
```

### 12.4 Common Patterns

**Get current project:**
```javascript
const { currentProject } = useProject();
```

**Check permissions:**
```javascript
const { hasPermission } = usePermissions();
if (hasPermission('entity', 'edit')) { ... }
```

**Show toast notification:**
```javascript
const { showSuccess, showError } = useToast();
showSuccess('Record saved');
```

**Get effective role (with View As support):**
```javascript
const { effectiveRole } = useViewAs();
```

---

## Appendix A: Session Completion Status

| Session | Topic | Status | Document |
|---------|-------|--------|----------|
| 1.1 | Architecture & Infrastructure | ✅ Complete | TECH-SPEC-01-Architecture.md |
| 1.2 | Database - Core Tables | ✅ Complete | TECH-SPEC-02-Database-Core.md |
| 1.3 | Database - Operational Tables | ✅ Complete | TECH-SPEC-03-Database-Operations.md |
| 1.4 | Database - Supporting Tables | ✅ Complete | TECH-SPEC-04-Database-Supporting.md |
| 1.5 | RLS Policies & Security | ✅ Complete | TECH-SPEC-05-RLS-Security.md |
| 1.6 | API Layer & AI Integration | ✅ Complete | TECH-SPEC-06-API-AI.md |
| 1.7 | Frontend Architecture | ✅ Complete | TECH-SPEC-07-Frontend-State.md |
| 1.8 | Service Layer | ✅ Complete | TECH-SPEC-08-Services.md |

---

## Appendix B: Future AI Chat Context

When starting a new AI chat session about this project, provide this context:

```
I'm working on the AMSF001 Project Tracker application.

Key information:
- Location: /Users/glennnickols/Projects/amsf001-project-tracker
- Tech Stack: React 18 + Vite + Supabase + Vercel
- Documentation: /docs/AMSF001-Technical-Specification.md (master reference)
- Detailed specs: /docs/TECH-SPEC-01 through TECH-SPEC-08

The application is a multi-tenant SaaS for project management with:
- 28 database tables with RLS
- 5 user roles (Admin, Supplier PM, Customer PM, Contributor, Viewer)
- AI chat and receipt scanning via Claude
- Service layer with singleton pattern
- Context-based React state management

Please read the master technical specification first for context.
```

---

*AMSF001 Project Tracker - Technical Specification*  
*Master Reference Document*  
*Created: December 2025*
