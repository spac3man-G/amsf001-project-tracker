# AMSF001 Project Tracker - Application Context

This document provides context for the AMSF001 Project Tracker application. It complements `LOCAL-ENV-SETUP.md` by describing the application's purpose, features, how features interact with each other, and how they integrate with the technology stack.

**For Claude Desktop users:** Share this document at the start of any development conversation to provide application context.

---

## Application Purpose

The AMSF001 Project Tracker is a **multi-tenant SaaS application** designed for managing complex enterprise project portfolios. Originally built for Network Architecture Services projects, it provides comprehensive project management capabilities with dual-party workflows (supplier and customer), making it suitable for consultancy and professional services engagements.

### Core Value Proposition

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHO THIS IS FOR                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SUPPLIER SIDE                        CUSTOMER SIDE              │
│  ├── Project Managers                 ├── Project Managers       │
│  ├── Finance Teams                    ├── Approvers              │
│  ├── Consultants                      └── Stakeholders           │
│  └── Partners/Subcontractors                                     │
│                                                                  │
│  WHAT IT SOLVES                                                  │
│  ├── Track milestones & deliverables with dual sign-off         │
│  ├── Manage timesheets with customer approval workflow          │
│  ├── Handle expenses with validation and receipt scanning       │
│  ├── Manage subcontractor/partner billing                       │
│  ├── Formal change control (variations) process                 │
│  └── Quality management (KPIs, RAID logs, standards)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Model

The application implements a **three-tier multi-tenancy model**:

```
Organisation (Tier 1)     →  Company or business unit
    └── Project (Tier 2)  →  Individual project engagement
        └── Entity (Tier 3)  →  Milestones, deliverables, timesheets, etc.
```

**Data Isolation:**
- All business data is scoped by `project_id`
- Row Level Security (RLS) enforces access at database level
- Organisation admins can access all projects in their organisation
- Project members can only access their assigned projects

---

## Features Overview

### Feature Categories

| Category | Features | Primary Users |
|----------|----------|---------------|
| **Project Structure** | Milestones, Deliverables | All roles |
| **Time & Expense** | Timesheets, Expenses, Receipt Scanning | Contributors, Approvers |
| **Financial** | Partner Management, Invoicing, Billing | Finance, PMs |
| **Change Control** | Variations, Baseline Versions | PMs, Approvers |
| **Quality** | KPIs, Quality Standards, RAID Log | PMs, Quality |
| **Operations** | Workflow Summary, Calendar, Reports | All roles |
| **AI Assistance** | Chat Assistant, Receipt Scanner | All roles |
| **Planning & Estimation** | Planning Tool, Benchmarking, Estimator | Supplier PM, Admin |

---

## Feature Details

### 1. Milestones & Deliverables

**Purpose:** Track project phases and work products with dual-signature workflows.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MILESTONE LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Created → Baseline Locked → Work in Progress → Complete         │
│               │                                                  │
│               ├── Supplier PM signs baseline commitment          │
│               └── Customer PM signs baseline acceptance          │
│                                                                  │
│  At Completion:                                                  │
│               ├── Supplier PM signs acceptance certificate       │
│               └── Customer PM signs acceptance certificate       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Fields:**
- Payment milestone flag and value
- Target and actual dates
- Status (Active, Complete, On Hold)
- Baseline commitment signatures
- Acceptance certificate signatures

**Deliverable Workflow:**

```
Draft → Submitted for Review → Review Complete → Signed Off
          (Contributor)        (Customer PM)      (Both PMs)
```

**Code Locations:**
- Service: `src/services/milestones.service.js`, `src/services/deliverables.service.js`
- Pages: `src/pages/MilestonesHub.jsx`, `src/pages/DeliverablesHub.jsx`
- Calculations: `src/lib/milestoneCalculations.js`, `src/lib/deliverableCalculations.js`

---

### 2. Timesheets

**Purpose:** Track time entries with customer approval workflow.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIMESHEET WORKFLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Draft ────▶ Submitted ────▶ Approved                           │
│    │            │              │                                 │
│    │            │              └── Customer PM approves          │
│    │            └── Resource submits for approval                │
│    └── Resource enters time                                      │
│                                                                  │
│  Draft ◀──── Rejected (with reason)                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Fields:**
- Resource (team member)
- Week starting date
- Hours per day (Mon-Sun)
- Status (Draft, Submitted, Approved, Rejected)
- Billable/Non-billable flag

**Code Locations:**
- Service: `src/services/timesheets.service.js`
- Page: `src/pages/Timesheets.jsx`
- Calculations: `src/lib/timesheetCalculations.js`

---

### 3. Expenses

**Purpose:** Manage expense claims with receipt scanning and validation workflow.

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXPENSE WORKFLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Draft ────▶ Submitted ────▶ Validated ────▶ Paid               │
│    │            │               │                                │
│    │            │               ├── Chargeable: Customer PM      │
│    │            │               └── Non-chargeable: Supplier PM  │
│    │            └── Resource submits                             │
│    │                                                             │
│    └── AI Receipt Scanner extracts:                              │
│        • Vendor name                                             │
│        • Date                                                    │
│        • Amount & currency                                       │
│        • Suggested category                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Fields:**
- Resource, expense category, date
- Amount, currency, chargeable flag
- Receipt image (stored in Supabase Storage)
- Validation status and timestamps

**Code Locations:**
- Service: `src/services/expenses.service.js`
- Page: `src/pages/Expenses.jsx`
- AI Scanner: `src/services/receiptScanner.service.js`, `api/scan-receipt.js`

---

### 4. Partners & Invoicing

**Purpose:** Manage subcontractors/third-party suppliers and their invoices.

**Partner Features:**
- Track supplier company details
- Link resources to partners
- Manage commercial rates
- Generate and track invoices

**Invoice Workflow:**

```
Draft → Submitted → Under Review → Approved → Paid
```

**Code Locations:**
- Service: `src/services/partners.service.js`, `src/services/invoicing.service.js`
- Page: `src/pages/PartnerDetail.jsx`

---

### 5. Variations (Change Control)

**Purpose:** Formal change request process with dual-party approval and baseline versioning.

```
┌─────────────────────────────────────────────────────────────────┐
│                    VARIATION WORKFLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Draft ────▶ Submitted ────▶ Awaiting Customer ────▶ Approved   │
│    │            │                  │                     │       │
│    │            │                  │                     │       │
│    │            │                  │                     └── Creates new  │
│    │            │                  │                         baseline     │
│    │            │                  │                         version      │
│    │            │                  └── Customer signs                     │
│    │            └── Supplier creates, signs                              │
│    │                                                                      │
│    └── Impact on:                                                         │
│        • Milestones (add/modify/remove)                                   │
│        • Deliverables (add/modify/remove)                                 │
│        • Schedule changes                                                 │
│        • Cost variations                                                  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

**Related Tables:**
- `variations` - Main variation record
- `variation_milestones` - Impacted milestones
- `variation_deliverables` - Impacted deliverables
- `variation_signers` - Approval signatures
- `baseline_versions` - Version history snapshots

**Code Locations:**
- Service: `src/services/variations.service.js`
- Pages: `src/pages/Variations.css`, `src/pages/VariationDetail.jsx`, `src/pages/VariationForm.jsx`

---

### 6. Quality Management (KPIs, RAID, Standards)

**Purpose:** Track project quality through KPIs, risk management, and standards compliance.

**KPIs (Key Performance Indicators):**
- RAG status tracking (Red/Amber/Green)
- Link to deliverables
- Target vs actual values
- Trend analysis

**RAID Log:**
- **R**isks - Potential future problems
- **A**ssumptions - Working assumptions
- **I**ssues - Current problems
- **D**ependencies - External dependencies

Auto-generates reference numbers (R-001, A-001, I-001, D-001).

**Quality Standards:**
- Define quality criteria
- Link to deliverables
- Compliance tracking

**Code Locations:**
- Services: `src/services/kpis.service.js`, `src/services/raid.service.js`, `src/services/qualityStandards.service.js`
- Pages: `src/pages/KPIs.jsx`, `src/pages/RaidLog.jsx`, `src/pages/QualityStandards.jsx`

---

### 7. Workflow System

**Purpose:** Centralised tracking of all pending actions across entity types.

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW CATEGORIES (13 total)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Timesheets (1)                                                  │
│  └── Pending approval                                            │
│                                                                  │
│  Expenses (2)                                                    │
│  ├── Chargeable validation                                       │
│  └── Non-chargeable validation                                   │
│                                                                  │
│  Deliverables (3)                                                │
│  ├── Pending review                                              │
│  ├── Awaiting supplier sign-off                                  │
│  └── Awaiting customer sign-off                                  │
│                                                                  │
│  Variations (3)                                                  │
│  ├── Submitted                                                   │
│  ├── Awaiting supplier signature                                 │
│  └── Awaiting customer signature                                 │
│                                                                  │
│  Certificates (2)                                                │
│  ├── Pending supplier signature                                  │
│  └── Pending customer signature                                  │
│                                                                  │
│  Baselines (2)                                                   │
│  ├── Awaiting supplier commitment                                │
│  └── Awaiting customer acceptance                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- `WorkflowService` - Centralised data fetching
- `NotificationContext` - Real-time notification state
- `WorkflowSummary` page - Full dashboard
- `NotificationBell` - Header dropdown

**Code Locations:**
- Service: `src/services/workflow.service.js`
- Context: `src/contexts/NotificationContext.jsx`
- Page: `src/pages/WorkflowSummary.jsx`
- Component: `src/components/NotificationBell.jsx`

---

### 8. AI-Powered Features

**Purpose:** AI assistance for chat queries and receipt processing.

**Chat Assistant:**
- Context-aware responses about project data
- Query milestones, deliverables, timesheets, etc.
- Powered by Claude (Haiku for speed, Sonnet for complexity)

**Receipt Scanner:**
- OCR using Claude Vision API
- Extracts vendor, date, amount, currency
- Suggests expense categories
- Learns merchant categorizations

**Architecture:**

```
User Query → api/chat.js → Build Context → Claude API → Stream Response
                              │
                              └── api/chat-context.js
                                      │
                                      └── Supabase Queries (project data)
```

**Code Locations:**
- API Functions: `api/chat.js`, `api/chat-context.js`, `api/scan-receipt.js`
- Frontend: `src/contexts/ChatContext.jsx`, `src/components/chat/`
- Service: `src/services/receiptScanner.service.js`

---

### 9. Planning Tool

**Purpose:** High-level project planning with AI-assisted structure generation. Intended as an optional starting point for new projects, and will evolve into a re-planning and impact assessment tool.

**Current State (Implemented):**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLANNING TOOL                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Plan Items (Hierarchical)                                       │
│  ├── Milestone (phase/checkpoint)                                │
│  │   └── Deliverable (tangible output)                          │
│  │       └── Task (work item)                                   │
│  │                                                               │
│  Features:                                                       │
│  ├── Excel-like grid editing with keyboard navigation           │
│  ├── Drag-and-drop reordering                                   │
│  ├── Indent/outdent for hierarchy                               │
│  ├── Link to existing milestones/deliverables                   │
│  ├── Link to estimate components                                │
│  ├── AI Assistant panel for conversational planning             │
│  └── Document upload (PDF/images) for plan extraction           │
│                                                                  │
│  AI Assistant Can:                                               │
│  ├── Generate project structure from description                │
│  ├── Analyze uploaded documents to extract plans                │
│  ├── Refine structure through conversation                      │
│  └── Calculate dates from durations                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Plan Item Fields:**
- Item type (task, milestone, deliverable)
- Name, description
- Start date, end date, duration
- Progress percentage, status
- Parent/child relationships (hierarchy)
- Optional links to milestones, deliverables, resources, estimates

**Access:** Supplier PM (primary), Admin (support)

**Code Locations:**
- Service: `src/services/planItemsService.js`
- Pages: `src/pages/planning/Planning.jsx`, `src/pages/planning/PlanningAIAssistant.jsx`
- Components: `src/components/planning/`
- API: `api/planning-ai.js`
- Database: `plan_items` table

**Wishlist / Future Features:**
- [ ] Create milestones/deliverables directly from plan items (FF-004, near-term priority)
- [ ] Bidirectional sync between plan items and milestones/deliverables (FF-005)
- [ ] Version history and revert capability for plans (FF-006)
- [ ] Gantt chart visualization within Planning page (FF-007)
- [ ] Impact assessment when re-planning (FF-008)
- [ ] Find and suggest missing elements in existing plans (FF-009)

> See `TECHNICAL-DEBT-AND-FUTURE-FEATURES.md` for full details, acceptance criteria, and effort estimates.

---

### 10. Benchmarking Tool

**Purpose:** SFIA 8 rate comparison tool for preparing quotes and helping customers understand how skill levels and supplier tiers impact pricing.

**Current State (Implemented):**

```
┌─────────────────────────────────────────────────────────────────┐
│                    BENCHMARKING TOOL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SFIA 8 Framework (97 skills)                                    │
│  ├── 6 Categories                                                │
│  │   ├── Strategy and architecture (16 skills)                  │
│  │   ├── Change and transformation (12 skills)                  │
│  │   ├── Development and implementation                         │
│  │   ├── Delivery and operation                                 │
│  │   ├── Skills and quality                                     │
│  │   └── Relationships and engagement                           │
│  │                                                               │
│  └── 19 Subcategories                                           │
│                                                                  │
│  SFIA Levels: 1-7 (not all skills available at all levels)      │
│                                                                  │
│  Supplier Tiers (4):                                             │
│  ├── Contractor (independent)                                   │
│  ├── Boutique (specialist consultancies)                        │
│  ├── Mid-tier (Capgemini, CGI, etc.)                           │
│  └── Big 4 (Deloitte, PwC, EY, KPMG, Accenture)                │
│                                                                  │
│  Features:                                                       │
│  ├── Filter by category, subcategory, skill, level, tier        │
│  ├── Compare rates across tiers                                 │
│  ├── Calculate premium percentages                              │
│  └── Search skills by name/code                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Data Model:**
- **Organisation-level** reference data (not project-scoped)
- Centrally managed, static rates
- One rate per skill/level/tier combination

**Use Cases:**
1. Preparing quotes - understand market rates
2. Customer transparency - explain rate bands
3. Resource costing - justify skill-based pricing
4. Competitive analysis - compare tier premiums

**Access:** Supplier PM (primary), Admin (support)

**Code Locations:**
- Service: `src/services/benchmarkRates.service.js`
- Reference Data: `src/services/sfia8-reference-data.js`
- Page: `src/pages/benchmarking/Benchmarking.jsx`
- Database: `benchmark_rates` table (global, not project-scoped)

**Wishlist / Future Features:**
- [ ] When adding resource to project, choose from benchmark rates OR manual entry (FF-014)
- [ ] Rate effective dates and historical tracking
- [ ] Custom rate adjustments with audit trail

> See `TECHNICAL-DEBT-AND-FUTURE-FEATURES.md` for full details.

---

### 11. Estimator Tool

**Purpose:** Component-based cost estimation using SFIA 8 benchmark rates. Creates estimates for fixed-price proposals or rough order of magnitude for T&M engagements.

**Current State (Implemented):**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTIMATOR TOOL                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Estimate Structure:                                             │
│  └── Estimate (header)                                          │
│      └── Component (group of tasks, with quantity multiplier)   │
│          └── Task (work item)                                   │
│              └── Resource Allocation                            │
│                  ├── SFIA Skill + Level + Tier                  │
│                  ├── Day Rate (from benchmarks)                 │
│                  └── Effort (days)                              │
│                                                                  │
│  Features:                                                       │
│  ├── Excel-like grid: tasks (rows) × resource types (columns)  │
│  ├── Add/clone/delete components                                │
│  ├── Component quantity multiplier                              │
│  ├── Real-time cost/days totals                                │
│  ├── Save/load estimates to database                           │
│  ├── Duplicate estimates                                        │
│  ├── Link components to plan items                              │
│  ├── CSV export                                                 │
│  └── Unsaved changes indicator                                  │
│                                                                  │
│  Statuses: Draft → Submitted → Approved → Rejected → Archived   │
│  (Workflow not yet implemented - status is informational only)  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Estimate Flexibility:**
- Multiple estimates per project supported
- Use cases:
  - Single estimate versioned over time
  - Multiple estimates for variations/options
  - Different resource profile scenarios
  - Feature prioritization options for client decisions

**Calculation:**
```
Task Cost = Effort (days) × Day Rate
Component Cost = Sum(Task Costs) × Quantity
Estimate Total = Sum(Component Costs)
```

**Access:** Supplier PM (primary), Admin (support)

**Code Locations:**
- Service: `src/services/estimates.service.js`
- Page: `src/pages/estimator/Estimator.jsx`
- Components: `src/components/planning/EstimateLinkModal.jsx`, `EstimateGeneratorModal.jsx`
- Database: `estimates`, `estimate_components`, `estimate_tasks`, `estimate_resources` tables

**Wishlist / Future Features:**
- [ ] Formal approval workflow for estimates (FF-010)
- [ ] Lock/baseline estimates for tracking actuals vs estimate (FF-011)
- [ ] Integration with project finances (track actual spend against estimate) (FF-012)
- [ ] Generate proposals/documents from estimates (FF-013)
- [ ] Potential merge with Planning tool into single integrated solution (FF-015)

> See `TECHNICAL-DEBT-AND-FUTURE-FEATURES.md` for full details, acceptance criteria, and effort estimates.

---

### Planning, Benchmarking & Estimator Integration

**Current Relationships:**

```
┌─────────────────────────────────────────────────────────────────┐
│              CURRENT TOOL RELATIONSHIPS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Benchmark Rates (Organisation-level)                            │
│        │                                                         │
│        └──────► Estimator (uses rates for resource costing)     │
│                      │                                           │
│                      └──► Plan Items (can link to estimate      │
│                                        components)               │
│                                                                  │
│  Plan Items ◄──── Link to ────► Existing Milestones/Deliverables│
│       │                                                          │
│       └── (One-way link only, no sync or creation)              │
│                                                                  │
│  NO CONNECTION YET:                                              │
│  • Estimates ↔ Project Finances                                 │
│  • Plan Items → Create Milestones/Deliverables                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Future Vision:**

```
┌─────────────────────────────────────────────────────────────────┐
│              FUTURE INTEGRATED WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. PLAN (describe project, AI generates structure)             │
│        │                                                         │
│        ▼                                                         │
│  2. ESTIMATE (cost the plan using benchmark rates)              │
│        │                                                         │
│        ▼                                                         │
│  3. BASELINE (lock estimate, create milestones/deliverables)    │
│        │                                                         │
│        ▼                                                         │
│  4. EXECUTE (track actuals via timesheets/expenses)             │
│        │                                                         │
│        ▼                                                         │
│  5. COMPARE (actuals vs estimate in Finance Hub)                │
│                                                                  │
│  With bidirectional sync and version history throughout         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature Interactions

Understanding how features connect is crucial for development:

### 1. Resources → Timesheets → Expenses → Partners

```
Resource (team member)
    │
    ├── Submits Timesheets ─────────────────┐
    │   └── Approved hours flow to billing  │
    │                                       ▼
    ├── Submits Expenses ──────────────► Finance Hub
    │   └── Validated expenses aggregate    │
    │                                       │
    └── May be linked to Partner ──────────┤
        └── Partner invoices track costs   │
                                           ▼
                                    Project Financials
```

### 2. Milestones → Deliverables → Quality

```
Milestone (project phase)
    │
    ├── Contains Deliverables
    │       │
    │       ├── Linked to KPIs
    │       │   └── Track delivery metrics
    │       │
    │       └── Linked to Quality Standards
    │           └── Compliance requirements
    │
    ├── Baseline Commitment (locked scope)
    │   └── Both parties sign
    │
    └── Acceptance Certificate (completion)
        └── Both parties sign
```

### 3. Variations → Baseline Versions → Project Scope

```
Change Request (Variation)
    │
    ├── Defines scope changes
    │   ├── New/modified milestones
    │   └── New/modified deliverables
    │
    ├── Requires dual-party signatures
    │   ├── Supplier PM signs
    │   └── Customer PM signs
    │
    └── On approval creates new Baseline Version
        └── Captures project state snapshot
```

### 4. Workflow Integration

```
Any Entity Status Change
    │
    ├── Creates Workflow Item
    │   └── Appears in WorkflowSummary
    │
    ├── Triggers Notification
    │   └── NotificationBell updates
    │
    └── Role-based visibility
        ├── Customer PM sees customer actions
        └── Supplier PM sees supplier actions
```

---

## Technology Stack Integration

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   React Application (Vite)                 │  │
│  │                                                            │  │
│  │  Pages ──▶ Components ──▶ Hooks ──▶ Contexts ──▶ Services │  │
│  └────────────────────────────┬──────────────────────────────┘  │
└───────────────────────────────┼─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│     Supabase     │   │  Vercel Edge     │   │    Anthropic     │
│                  │   │   Functions      │   │     Claude       │
│ • PostgreSQL DB  │   │                  │   │                  │
│ • Auth           │   │ • /api/chat      │   │ • Chat responses │
│ • RLS Policies   │   │ • /api/scan-     │   │ • Receipt OCR    │
│ • Storage        │   │   receipt        │   │                  │
│                  │   │ • /api/create-   │   │                  │
│                  │   │   user           │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

### Frontend Layer (React + Vite)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | React 18 | UI components and state |
| **Routing** | React Router 6 | Client-side navigation |
| **Build** | Vite | Fast dev server and bundling |
| **Charts** | Recharts | Dashboard visualizations |
| **Layout** | React Grid Layout | Draggable dashboard widgets |
| **Icons** | Lucide React | Consistent iconography |
| **Dates** | date-fns | Date formatting/manipulation |

**State Management Pattern:**
```
Context (global state) → Hooks (logic) → Services (data access)
```

| Context | Purpose |
|---------|---------|
| `AuthContext` | User authentication state |
| `ProjectContext` | Current project selection |
| `OrganisationContext` | Current organisation |
| `ViewAsContext` | Role impersonation (admin feature) |
| `MetricsContext` | Dashboard metrics caching |
| `ChatContext` | AI chat state |
| `ToastContext` | Toast notifications |
| `NotificationContext` | Workflow notifications |

### Service Layer Pattern

All services extend `BaseService` providing:
- CRUD operations with soft delete
- Project-scoped queries
- Consistent error handling
- Caching support

```javascript
// Example service pattern
class EntityService extends BaseService {
  constructor() {
    super('table_name', { softDelete: true });
  }
  
  async customMethod(projectId) {
    return await this.query()
      .eq('project_id', projectId)
      .eq('is_deleted', false);
  }
}

export const entityService = new EntityService();
```

---

### Database Layer (Supabase/PostgreSQL)

**30 Tables organized into categories:**

| Category | Tables | Purpose |
|----------|--------|---------|
| **Organisation** | `organisations`, `user_organisations` | Multi-tenancy structure |
| **Core** | `projects`, `profiles`, `user_projects`, `milestones`, `deliverables`, `resources`, `resource_availability` | Project fundamentals |
| **Operational** | `timesheets`, `expenses`, `partners`, `partner_invoices`, `partner_invoice_lines` | Day-to-day operations |
| **Supporting** | `kpis`, `quality_standards`, `raid_items`, `variations`, `baseline_versions`, `document_templates`, `notification_preferences`, `audit_log`, `deleted_items` | Quality and tracking |
| **Junction** | `deliverable_kpis`, `deliverable_quality_standards`, `milestone_baseline_commitments`, `milestone_acceptance_certificates`, `variation_*` | Relationships |

**Row Level Security (RLS) Patterns:**

```sql
-- View pattern: Project membership required
CREATE POLICY "view_policy" ON table_name
FOR SELECT TO authenticated
USING (
  project_id IN (
    SELECT project_id FROM user_projects 
    WHERE user_id = auth.uid()
  )
);

-- Modify pattern: Role restricted
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

**Soft Delete Pattern:**
All major entities include:
```sql
is_deleted BOOLEAN DEFAULT false,
deleted_at TIMESTAMPTZ,
deleted_by UUID REFERENCES profiles(id)
```

### API Layer (Vercel Serverless Functions)

| Endpoint | Purpose | AI Model |
|----------|---------|----------|
| `api/chat.js` | Main chat endpoint with streaming | Claude Haiku/Sonnet |
| `api/chat-context.js` | Build project context for AI | - |
| `api/chat-stream.js` | Alternative streaming implementation | Claude |
| `api/scan-receipt.js` | Receipt OCR | Claude Vision |
| `api/create-user.js` | Admin user creation | - |
| `api/create-organisation.js` | Organisation provisioning | - |
| `api/create-project.js` | Project provisioning | - |
| `api/manage-project-users.js` | User assignment | - |
| `api/planning-ai.js` | AI-assisted planning | Claude |
| `api/report-ai.js` | AI report generation | Claude |

**API Integration Pattern:**
```
Frontend Service → fetch('/api/endpoint') → Vercel Function → External Service
                                                    │
                                                    ├── Supabase (data)
                                                    └── Anthropic (AI)
```

### Deployment (Vercel + GitHub)

```
Push to GitHub ──▶ Vercel Auto-Deploy ──▶ Production
       │
       └── GitHub Actions
           ├── Build verification
           └── Test suite (Vitest + Playwright)
```

**Environments:**
- Development: `localhost:5173`
- Staging: `amsf001-project-tracker-staging.vercel.app`
- Production: `amsf001-project-tracker.vercel.app`

---

## User Roles & Permissions

### Organisation Roles

| Role | Description | Access |
|------|-------------|--------|
| `org_owner` | Organisation owner | Full control including billing and deletion |
| `org_admin` | Organisation administrator | Manage members, settings, access all projects |
| `org_member` | Organisation member | Access only assigned projects |

### Project Roles

| Role | Description | Typical Actions |
|------|-------------|-----------------|
| `admin` | System administrator | Full access, user management, settings |
| `supplier_pm` | Supplier project manager | Manage resources, partners, billing, sign deliverables |
| `customer_pm` | Customer project manager | Approve timesheets, validate expenses, sign certificates |
| `contributor` | Team member | Submit timesheets, expenses, work on deliverables |
| `viewer` | Read-only stakeholder | View dashboards and reports |

### Permission Matrix Summary

| Action | Admin | Supplier PM | Customer PM | Contributor | Viewer |
|--------|-------|-------------|-------------|-------------|--------|
| View all data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create milestones | ✅ | ✅ | ❌ | ❌ | ❌ |
| Submit timesheets | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve timesheets | ✅ | ❌ | ✅ | ❌ | ❌ |
| Create variations | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sign variations | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Use Planning tool | ✅ | ✅ | ❌ | ❌ | ❌ |
| Use Estimator | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Benchmarking | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Key Files Reference

### Configuration

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `vite.config.js` | Build configuration |
| `vercel.json` | Deployment settings |
| `playwright.config.js` | E2E test configuration |
| `.env.local` | Local environment variables |

### Entry Points

| File | Purpose |
|------|---------|
| `src/main.jsx` | Application bootstrap |
| `src/App.jsx` | Root component with routing |
| `index.html` | HTML template |

### Key Directories

```
src/
├── components/           # Reusable UI components
│   ├── chat/            # AI chat widget
│   ├── planning/        # EstimateLinkModal, EstimateGeneratorModal
│   └── ...
├── contexts/            # React context providers (state)
├── hooks/               # Custom React hooks
├── lib/                 # Utilities, calculations, helpers
├── pages/               # Page components (routes)
│   ├── planning/        # Planning.jsx, PlanningAIAssistant.jsx
│   ├── estimator/       # Estimator.jsx
│   ├── benchmarking/    # Benchmarking.jsx
│   └── ...
└── services/            # Data access layer (Supabase)
    ├── planItemsService.js
    ├── estimates.service.js
    ├── benchmarkRates.service.js
    ├── sfia8-reference-data.js
    └── ...

api/                     # Vercel serverless functions
├── planning-ai.js       # AI planning assistant
└── ...
supabase/
├── migrations/          # Database schema changes
└── functions/           # Edge functions (if any)
e2e/                     # Playwright E2E tests
```

---

## Common Development Tasks

### Adding a New Feature

1. **Database:** Create migration in `supabase/migrations/`
2. **Service:** Add/update service in `src/services/`
3. **Hook:** Create permission hook if needed in `src/hooks/`
4. **Components:** Build UI components in `src/components/`
5. **Page:** Create page component in `src/pages/`
6. **Route:** Add route to `src/App.jsx`
7. **Tests:** Add E2E tests in `e2e/`

### Modifying an Entity Workflow

1. Update status constants in service
2. Update calculation logic in `src/lib/`
3. Update RLS policies if access changes
4. Update `workflow.service.js` if workflow categories affected
5. Update permission matrix in `src/lib/permissionMatrix.js`

### Adding an AI Feature

1. Create API endpoint in `api/`
2. Define tool functions for Claude
3. Add frontend service method
4. Integrate with ChatContext or create new context

---

## Related Documentation

For deeper technical details, see:

| Document | Content |
|----------|---------|
| `TECH-SPEC-01-Architecture.md` | Full architecture details |
| `TECH-SPEC-02-Database-Core.md` | Core database tables |
| `TECH-SPEC-03-Database-Operations.md` | Operational tables |
| `TECH-SPEC-04-Database-Supporting.md` | Supporting tables |
| `TECH-SPEC-05-RLS-Security.md` | Row Level Security |
| `TECH-SPEC-06-API-AI.md` | API and AI integration |
| `TECH-SPEC-07-Frontend-State.md` | Frontend architecture |
| `TECH-SPEC-08-Services.md` | Service layer |
| `TECH-SPEC-09-Testing-Infrastructure.md` | Testing setup |
| `WORKFLOW-SYSTEM-DOCUMENTATION.md` | Workflow details |
| `LOCAL-ENV-SETUP.md` | Development environment |

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Unit tests (Vitest)
npm run e2e              # E2E tests (Playwright)
npm run e2e:ui           # E2E with UI
npm run e2e:smoke        # Smoke tests only

# E2E by role
npm run e2e:admin        # Test as admin
npm run e2e:supplier-pm  # Test as supplier PM
npm run e2e:customer-pm  # Test as customer PM
```

---

*Last Updated: December 29, 2025*
*Complements: LOCAL-ENV-SETUP.md*
