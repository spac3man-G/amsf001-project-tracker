# AMSF001 Project Tracker - Master Documentation v4.0

**Last Updated:** 1 December 2025  
**Version:** 4.0  
**Status:** Production Ready with Enhanced Invoicing & AI Roadmap

---

## Executive Summary

The AMSF001 Project Tracker is a production-ready React/Supabase web application for managing the Network Standards and Design Architectural Services project between Government of Jersey and JT Telecom. The application has achieved 92% production readiness with comprehensive partner invoicing capabilities.

### Recent Major Updates (1 December 2025)
- ✅ **Invoice Summary Redesign** - Clear chargeable/non-chargeable expense breakdown
- ✅ **Print to PDF** - Invoice details exportable to PDF
- ✅ **AI Chat Assistant Specification** - Requirements approved for development
- ✅ **Full Drag-and-Drop Dashboard** - React Grid Layout implementation
- ✅ **Smart Receipt Scanner** - AI-powered expense capture (pending deployment)

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Feature Inventory](#feature-inventory)
5. [Partner Invoicing System](#partner-invoicing-system)
6. [AI Chat Assistant](#ai-chat-assistant)
7. [Dashboard Customization](#dashboard-customization)
8. [Service Layer](#service-layer)
9. [Deployment Configuration](#deployment-configuration)
10. [Production Readiness](#production-readiness)
11. [Development Roadmap](#development-roadmap)
12. [Appendices](#appendices)

---

## System Architecture

### Overview
```
┌─────────────────────────────────────────────────────────────┐
│                      AMSF001 Project Tracker                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend: React 18.2 + Vite 5.4                           │
│  Routing: React Router 6.20                                 │
│  UI: Custom Components + Lucide Icons                       │
│  State: Context API (Auth, Project, TestUsers)             │
│  Grid: React Grid Layout 1.5.2 (Drag & Drop)              │
├─────────────────────────────────────────────────────────────┤
│  Backend: Supabase (PostgreSQL + Auth + Storage)           │
│  Auth: Row Level Security (RLS)                            │
│  Database: 35+ Tables                                       │
│  APIs: RESTful via Supabase Client                         │
│  AI: Claude Haiku 3.5 (Chat & Receipt Scanning)            │
├─────────────────────────────────────────────────────────────┤
│  Hosting: Vercel (Pro Plan)                                │
│  Domain: amsf001-project-tracker.vercel.app                │
│  Analytics: Vercel Analytics + Speed Insights              │
│  Monitoring: Error tracking, performance metrics            │
└─────────────────────────────────────────────────────────────┘
```

### Application Structure
```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── dashboard/       # Dashboard widgets
│   ├── expenses/        # Receipt scanner, expense forms
│   └── layout/          # Layout components
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── pages/               # Page components
│   ├── Dashboard.jsx    # Main dashboard (v4.0)
│   ├── PartnerDetail.jsx # Partner invoicing (v2.0)
│   └── ...
├── services/            # API service layer (18 services)
├── config/              # Configuration files
└── lib/                 # Utilities
api/
├── chat.js              # AI Chat Edge Function
└── scan-receipt.js      # Receipt Scanner Edge Function
```

---

## Technology Stack

### Core Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.2.0 | UI framework |
| react-dom | 18.2.0 | DOM rendering |
| react-router-dom | 6.20.0 | Client-side routing |
| @supabase/supabase-js | 2.39.0 | Database & auth client |
| vite | 5.4.21 | Build tool |
| lucide-react | 0.294.0 | Icon library |
| recharts | 2.10.0 | Data visualization |
| date-fns | 3.0.0 | Date utilities |
| react-grid-layout | 1.5.2 | Drag-and-drop grid |
| @anthropic-ai/sdk | latest | Claude AI integration |
| @vercel/analytics | 1.5.0 | Usage analytics |
| @vercel/speed-insights | 1.2.0 | Performance monitoring |

---

## Database Schema

### Core Tables (35+ total)

#### Project Management
- **projects** - Project master data
- **milestones** - Project milestones with progress tracking
- **deliverables** - Milestone deliverables and verification
- **milestone_certificates** - Digital certificates for completion

#### Resource & Time Tracking
- **resources** - Team members with partner linkage
- **timesheets** - Time tracking with approval workflow
- **expenses** - Expense tracking with procurement method
- **resource_allocations** - Resource assignment to milestones

#### Partner Invoicing
- **partners** - Partner organizations
- **partner_invoices** - Invoice headers with period and totals
- **partner_invoice_lines** - Line items (timesheets, expenses)
- **partner_payments** - Payment records

#### Performance Monitoring
- **kpis** - Key Performance Indicators
- **quality_standards** - Quality metrics and targets

#### System
- **users** - User accounts and profiles
- **user_projects** - User-project assignments with roles
- **audit_logs** - System activity tracking
- **deleted_items** - Soft delete recovery
- **dashboard_layouts** - User dashboard customization
- **receipt_scans** - AI receipt scan history
- **expense_classification_rules** - Receipt scanner learning

---

## Feature Inventory

### ✅ Implemented Features

#### Partner Invoicing (v2.0 - Enhanced)

**Invoice Generation:**
- Period-based invoice creation (select date range)
- Automatic aggregation of approved timesheets
- Automatic aggregation of submitted/approved expenses
- Grouped line items by type (timesheets, partner expenses, supplier expenses)

**Invoice Summary Display (1 December 2025):**
- Top row summary cards:
  - Timesheets total (all billable)
  - Expenses Billable (chargeable to customer)
  - Expenses Non-Billable (not chargeable)
  - Invoice Total (to be paid by partner)
- Expenses Breakdown section:
  - Total Expenses (all expenses combined)
  - Chargeable to Customer
  - Not Chargeable
  - Paid by Partner (on this invoice)
  - Paid by Supplier (not on this invoice)

**Supplier Expenses Handling:**
- Supplier-procured expenses tracked separately
- Clear "NOT ON THIS INVOICE" messaging
- Always-visible section even when empty
- Separate reconciliation guidance

**Print to PDF:**
- Full invoice printable via browser print dialog
- All timesheets and expenses included (no truncation)
- Clean formatting optimized for A4
- Save as PDF option

#### Dashboard (v4.0 - Fully Interactive)
- Drag-and-drop widget positioning
- Widget resizing with constraints
- Auto-save layouts (1-second debounce)
- 8 customizable widgets
- Role-based presets

#### Smart Receipt Scanner (Pending Deployment)
- AI-powered receipt scanning (Claude Vision)
- Automatic field extraction (merchant, amount, date)
- Category suggestion with confidence scores
- Learning system for improved accuracy
- Batch mode for multiple receipts

#### Core Project Management
- Project creation and configuration
- Milestone tracking with progress %
- Deliverable management and verification
- Resource allocation and scheduling
- KPI monitoring and reporting
- Quality standards tracking
- Risk and issue management

#### Time & Expense Tracking
- Timesheet entry with approval workflow
- Expense tracking with receipt upload
- Procurement method (partner vs supplier)
- Chargeable/non-chargeable classification

#### Security & Audit
- Row Level Security (RLS) on all tables
- Audit logging for all data changes
- Soft delete with recovery
- Role-based access control

---

## Partner Invoicing System

### Invoice Generation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Select Period  │────▶│  Fetch Data     │────▶│  Display Modal  │
│  (Date Range)   │     │  (Timesheets +  │     │  (Summary +     │
│                 │     │   Expenses)     │     │   Details)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Print / Save   │
                                                │  PDF            │
                                                └─────────────────┘
```

### Expense Classification

| Procurement Method | Chargeable | Included in Invoice | Notes |
|-------------------|------------|---------------------|-------|
| Partner | Yes | ✅ Yes | Billed to partner, passed to customer |
| Partner | No | ✅ Yes | Billed to partner, absorbed as cost |
| Supplier | Yes | ❌ No | Supplier bills customer directly |
| Supplier | No | ❌ No | Supplier bills customer directly |

### Invoice Total Calculation

```
Invoice Total (Partner Pays) = Timesheets + All Partner Expenses
                             = £8,250.00 + £2,338.76
                             = £10,588.76

Total Chargeable to Customer = Timesheets + Chargeable Partner + Chargeable Supplier
                             = £8,250.00 + £2,066.42 + £0.00
                             = £10,316.42
```

---

## AI Chat Assistant

### Status: Specification Complete, Approved for Development

### Overview
The AI Chat Assistant enhances the existing chat widget to become a context-aware assistant capable of querying project data, understanding user roles, and providing personalised guidance.

### Key Capabilities (Planned)

1. **Data Queries**
   - "How many outstanding timesheets are there?"
   - "What's the spend to date vs budget for Technical Design?"
   - "Show me expenses submitted by Glenn Nickols"

2. **Personal Guidance**
   - "What do I need to do next?"
   - "What's waiting for my approval?"
   - "What's my role and what can I do?"

3. **Role Awareness**
   - Queries automatically scoped to user's permissions
   - Partner users only see their partner's data
   - Resources only see their own timesheets/expenses

### Technical Approach
- Claude Haiku 3.5 with function calling
- 12+ tools for database queries
- Permission scoping at query level
- Estimated cost: £0.40/month for 100 queries

### Full Specification
See: `AI-CHAT-ASSISTANT-SPEC.md`

---

## Dashboard Customization

### Widget Library (8 Widgets)
1. Progress Hero - Overall completion %
2. Budget Summary - Spend vs budget
3. PMO Cost Tracking - PMO/Non-PMO split
4. Key Statistics - Item counts
5. Milestone Certificates - Signing status
6. Milestones List - All milestones with spend
7. KPIs by Category - KPI performance
8. Quality Standards - Quality achievement

### Drag-and-Drop Features
- 12-column responsive grid
- Resize from corner handles
- Visual drag feedback
- 1-second debounce auto-save
- Per-user, per-project layouts

---

## Service Layer

### Implemented Services (18)
| Service | Purpose |
|---------|---------|
| auth.service.js | Authentication |
| projects.service.js | Project CRUD |
| milestones.service.js | Milestone management |
| deliverables.service.js | Deliverable tracking |
| resources.service.js | Resource management |
| timesheets.service.js | Time tracking |
| expenses.service.js | Expense management |
| partners.service.js | Partner organizations |
| invoicing.service.js | Invoice generation |
| kpis.service.js | KPI management |
| qualityStandards.service.js | Quality tracking |
| risks.service.js | Risk management |
| issues.service.js | Issue tracking |
| dashboard.service.js | Dashboard layouts |
| auditLog.service.js | Audit logging |
| deletedItems.service.js | Recovery |
| receiptScanner.service.js | AI receipt processing |
| notifications.service.js | User notifications |

---

## Production Readiness

### Current Score: 92%

| Category | Status | Score |
|----------|--------|-------|
| Core Features | ✅ Complete | 100% |
| Security | ✅ Complete | 100% |
| Performance | ✅ Good | 90% |
| Documentation | ✅ Comprehensive | 95% |
| Monitoring | ✅ Active | 90% |
| Error Handling | ✅ Implemented | 85% |
| Testing | 🔄 Partial | 70% |

---

## Development Roadmap

### Phase 1: Stabilization (COMPLETE)
**Status:** ✅ 100% Complete

- [x] Service layer migration
- [x] Production hardening
- [x] Vercel/GitHub/Supabase Pro upgrades
- [x] Audit logging
- [x] Deleted items recovery
- [x] Documentation consolidation

### Phase 2: Multi-Tenant & Reporting (IN PROGRESS)
**Status:** 🔄 25% Complete  
**Target:** February 2026

#### Completed
- [x] Dashboard customization with drag-and-drop
- [x] Invoice summary redesign
- [x] Print to PDF functionality
- [x] Smart Receipt Scanner (code complete)
- [x] AI Chat Assistant specification

#### In Progress
- [ ] AI Chat Assistant implementation
- [ ] Smart Receipt Scanner deployment
- [ ] Multi-tenant architecture
- [ ] Advanced reporting

### Phase 3: Collaboration & Integration (PLANNED)
**Status:** 📋 Planned  
**Target:** April 2026

- Real-time features
- External integrations (Calendar, Slack, Teams)
- Mobile applications

### Phase 4: AI & Automation (FUTURE)
**Status:** 🔮 Future  
**Target:** Q3 2026

- AI-powered insights
- Predictive analytics
- Automated reporting
- Smart scheduling

---

## Appendices

### A. Recent Commits (1 December 2025)

```
3ee21801 - fix: print view now shows all timesheet and expense entries
5557f75d - feat: redesign invoice summary with expenses breakdown and print to PDF
b523fc92 - feat: redesign invoice summary with chargeable breakdown
8382ea5a - feat: improve invoice supplier expenses UI with always-visible section
```

### B. Key Files Modified (1 December 2025)

| File | Changes |
|------|---------|
| src/pages/PartnerDetail.jsx | Invoice modal redesign, print to PDF |
| src/services/invoicing.service.js | Procurement method null handling |
| AI-CHAT-ASSISTANT-SPEC.md | New specification document |

### C. Document Versions

| Document | Version | Date |
|----------|---------|------|
| Master Document | 4.0 | 1 Dec 2025 |
| User Manual | 7.0 | 1 Dec 2025 |
| Development Playbook | 20.0 | 1 Dec 2025 |
| Configuration Guide | 8.0 | 1 Dec 2025 |
| AI Chat Assistant Spec | 1.0 | 1 Dec 2025 |

### D. Key URLs

| Service | URL |
|---------|-----|
| Live Application | https://amsf001-project-tracker.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/ltkbfbqfnskqgpcnvdxy |
| Vercel Dashboard | https://vercel.com/glenns-projects-56c63cc4/amsf001-project-tracker |
| GitHub Repository | https://github.com/spac3man-G/amsf001-project-tracker |

---

## Conclusion

The AMSF001 Project Tracker continues to evolve with enhanced invoicing capabilities and a clear roadmap for AI-powered features. The Print to PDF functionality and improved expense breakdown provide immediate value for partner billing, while the AI Chat Assistant specification lays groundwork for natural language data access.

### Key Achievements (1 December 2025)
✅ Invoice summary redesigned with clear expense categorization  
✅ Print to PDF with full data export  
✅ AI Chat Assistant specification approved  
✅ Production readiness at 92%

---

*Document Version: 4.0 | Last Updated: 1 December 2025*
