# AMSF001 Project Tracker - Documentation Approach

**Created:** 10 December 2025  
**Purpose:** Systematic approach for creating comprehensive documentation  
**Target Outputs:** Technical Specification + User Guide + UAT Scripts  

---

## Executive Summary

Based on my analysis of the AMSF001 Project Tracker codebase, this document outlines a systematic approach to create two comprehensive documents plus UAT scripts across multiple sessions. The application is substantial with approximately:

- **28 database tables** with RLS policies
- **~30 pages/views** (src/pages)
- **~50 components** (src/components)
- **~15 services** (src/services)
- **~12 contexts** (src/contexts)
- **~15 hooks** (src/hooks)
- **5 serverless API functions** (api/)
- **Multi-tenancy** with project-scoped RBAC

---

## Document Deliverables

### Document 1: Technical Specification
A complete developer/AI-readable specification covering:
- System architecture and tech stack
- Database schema with all tables, columns, relationships
- RLS policy documentation
- API endpoints and serverless functions
- Service layer architecture
- Component hierarchy
- State management (contexts)
- Deployment configuration (Vercel + Supabase)
- Environment variables
- AI integration details

### Document 2: User Guide
A complete end-user guide covering:
- Getting started (login, navigation, roles)
- Each feature module with step-by-step instructions
- Workflow diagrams for each process
- Role-based permissions reference
- Troubleshooting guide

### Document 3: UAT Scripts (Phase 3)
End-to-end test scripts covering:
- Authentication and authorization
- Each module's CRUD operations
- Workflow transitions
- Role-based access testing
- Edge cases and error handling

---

## Session Strategy

### Why Multiple Sessions?

| Risk | Mitigation |
|------|------------|
| Context overflow | Sessions limited to 1-2 modules per session |
| Timeout on large operations | Each session produces incremental output files |
| Lost progress | Each session creates saved artifacts |
| Inconsistency | Master checklist tracks completion status |

### Session Duration Target

Each session should take approximately **30-45 minutes** and produce:
- One or more completed markdown files
- Clear stopping point with notes for next session
- Updated checklist status

---

## Phase 1: Technical Specification (8 Sessions)

### Session 1.1: Architecture & Infrastructure
**Scope:** Overview, tech stack, project structure, deployment

**Files to Review:**
- `package.json` - Dependencies
- `vite.config.js` - Build configuration
- `vercel.json` - Deployment routing
- `.env.example` - Environment variables
- `src/lib/supabase.js` - Supabase client config

**Output:** `TECH-SPEC-01-Architecture.md`

**Checklist:**
- [ ] Tech stack overview (React, Supabase, Vercel, Claude)
- [ ] Project structure diagram
- [ ] Build and deployment process
- [ ] Environment variables reference
- [ ] External service dependencies

---

### Session 1.2: Database Schema - Core Tables
**Scope:** Primary entities (projects, milestones, deliverables, resources)

**Files to Review:**
- `database-schema-2025-12-08.sql`
- `sql/variations-tables.sql`
- `sql/soft-delete-implementation.sql`

**Output:** `TECH-SPEC-02-Database-Core.md`

**Checklist:**
- [ ] projects table
- [ ] profiles table
- [ ] user_projects table (multi-tenancy)
- [ ] milestones table
- [ ] deliverables table
- [ ] resources table
- [ ] resource_availability table
- [ ] Entity relationships diagram

---

### Session 1.3: Database Schema - Operational Tables
**Scope:** Timesheets, expenses, invoicing, partners

**Files to Review:**
- `database-schema-2025-12-08.sql`
- `sql/P5a-partner-invoices-tables.sql`
- `sql/add-resource-id-to-expenses.sql`

**Output:** `TECH-SPEC-03-Database-Operations.md`

**Checklist:**
- [ ] timesheets table
- [ ] expenses table
- [ ] partners table
- [ ] partner_invoices table
- [ ] partner_invoice_lines table
- [ ] Relationships and foreign keys

---

### Session 1.4: Database Schema - Supporting Tables
**Scope:** KPIs, quality, RAID, variations, audit, templates

**Files to Review:**
- `sql/variations-tables.sql`
- `sql/P10-raid-log.sql`
- `sql/audit-triggers.sql`
- `sql/P16-document-templates.sql`

**Output:** `TECH-SPEC-04-Database-Supporting.md`

**Checklist:**
- [ ] kpis table
- [ ] quality_standards table
- [ ] raid_items table
- [ ] variations table
- [ ] variation_milestones table
- [ ] document_templates table
- [ ] audit_log table
- [ ] deleted_items table

---

### Session 1.5: RLS Policies & Security
**Scope:** All Row Level Security policies, authentication

**Files to Review:**
- `sql/rls-migration/phase-1-junction-tables.sql`
- `sql/rls-migration/phase-2-main-entities.sql`
- `sql/rls-migration/phase-3-additional-tables.sql`

**Output:** `TECH-SPEC-05-RLS-Security.md`

**Checklist:**
- [ ] RLS policy patterns used
- [ ] Per-table policy documentation
- [ ] Role-based access matrix
- [ ] Authentication flow
- [ ] Service role vs anon key usage

---

### Session 1.6: API Layer & AI Integration
**Scope:** Serverless functions, Claude integration

**Files to Review:**
- `api/chat.js`
- `api/chat-stream.js`
- `api/chat-context.js`
- `api/create-user.js`
- `api/scan-receipt.js`

**Output:** `TECH-SPEC-06-API-AI.md`

**Checklist:**
- [ ] API endpoint inventory
- [ ] Chat assistant architecture
- [ ] Tool definitions for Claude
- [ ] Model routing (Haiku/Sonnet)
- [ ] Receipt scanner integration
- [ ] Token usage and cost tracking

---

### Session 1.7: Frontend Architecture - Contexts & Hooks
**Scope:** State management, custom hooks

**Files to Review:**
- `src/contexts/*.jsx` (all context files)
- `src/hooks/*.js` (all hook files)
- `src/lib/permissions.js`
- `src/lib/permissionMatrix.js`

**Output:** `TECH-SPEC-07-Frontend-State.md`

**Checklist:**
- [ ] Context provider hierarchy
- [ ] AuthContext documentation
- [ ] ProjectContext (multi-tenancy)
- [ ] ViewAsContext (role impersonation)
- [ ] Permission hooks
- [ ] Metrics and caching

---

### Session 1.8: Service Layer
**Scope:** All data services

**Files to Review:**
- `src/services/*.service.js` (all service files)

**Output:** `TECH-SPEC-08-Services.md`

**Checklist:**
- [ ] Service architecture pattern
- [ ] Each service's methods
- [ ] Error handling patterns
- [ ] Caching strategies
- [ ] Computed calculations

---

## Phase 2: User Guide (7 Sessions)

### Session 2.1: Getting Started & Navigation
**Scope:** Login, navigation, roles, project switching

**Files to Review:**
- `src/pages/Login.jsx`
- `src/components/Layout.jsx`
- `src/components/ProjectSwitcher.jsx`
- `src/components/ViewAsBar.jsx`
- Existing User Guide sections 1-4

**Output:** `USER-GUIDE-01-Getting-Started.md`

**Checklist:**
- [ ] Login process
- [ ] Navigation menu
- [ ] Role descriptions and permissions
- [ ] Project switching
- [ ] View As feature

---

### Session 2.2: Dashboard & Customization
**Scope:** Dashboard widgets, customization, metrics

**Files to Review:**
- `src/pages/Dashboard.jsx`
- `src/components/dashboard/*.jsx`
- `src/config/dashboardPresets.js`
- `src/hooks/useDashboardLayout.js`

**Output:** `USER-GUIDE-02-Dashboard.md`

**Checklist:**
- [ ] Dashboard overview
- [ ] Widget descriptions
- [ ] Customization options
- [ ] KPI cards
- [ ] Finance widgets

---

### Session 2.3: Milestones & Deliverables
**Scope:** Milestone and deliverable management

**Files to Review:**
- `src/pages/Milestones.jsx`
- `src/pages/MilestoneDetail.jsx`
- `src/pages/Deliverables.jsx`
- `src/components/milestones/*.jsx`
- `src/components/deliverables/*.jsx`

**Output:** `USER-GUIDE-03-Milestones-Deliverables.md`

**Checklist:**
- [ ] Milestone list view
- [ ] Milestone detail view
- [ ] Baseline commitment workflow
- [ ] Acceptance certificates
- [ ] Deliverable management
- [ ] Deliverable workflows
- [ ] Dual signatures

---

### Session 2.4: Time & Expense Management
**Scope:** Timesheets and expenses

**Files to Review:**
- `src/pages/Timesheets.jsx`
- `src/pages/Expenses.jsx`
- `src/components/timesheets/*.jsx`
- `src/components/expenses/*.jsx`

**Output:** `USER-GUIDE-04-Time-Expenses.md`

**Checklist:**
- [ ] Timesheet submission
- [ ] Timesheet validation workflow
- [ ] Expense submission
- [ ] Receipt scanning
- [ ] Expense validation
- [ ] Status workflows

---

### Session 2.5: Partners & Invoicing
**Scope:** Partner management, invoice generation

**Files to Review:**
- `src/pages/Partners.jsx`
- `src/pages/PartnerDetail.jsx`
- `src/components/partners/*.jsx`
- `src/services/invoicing.service.js`

**Output:** `USER-GUIDE-05-Partners-Invoicing.md`

**Checklist:**
- [ ] Partner setup
- [ ] Resource linking
- [ ] Invoice generation
- [ ] Invoice types
- [ ] Invoice workflow

---

### Session 2.6: Variations (Change Control)
**Scope:** Variation management and CR documents

**Files to Review:**
- `src/pages/Variations.jsx`
- `src/pages/VariationDetail.jsx`
- `src/pages/VariationForm.jsx`
- `src/components/variations/*.jsx`
- `docs/DOCUMENT-TEMPLATES-SPECIFICATION.md`

**Output:** `USER-GUIDE-06-Variations.md`

**Checklist:**
- [ ] Creating variations
- [ ] Variation types
- [ ] Affected milestones
- [ ] Submission workflow
- [ ] Approval workflow
- [ ] CR document generation
- [ ] Deletion rules

---

### Session 2.7: RAID, KPIs, Quality & Resources
**Scope:** Supporting modules

**Files to Review:**
- `src/pages/RaidLog.jsx`
- `src/pages/KPIs.jsx`
- `src/pages/QualityStandards.jsx`
- `src/pages/Resources.jsx`
- `src/pages/ResourceDetail.jsx`

**Output:** `USER-GUIDE-07-Supporting-Modules.md`

**Checklist:**
- [ ] RAID log management
- [ ] KPI tracking
- [ ] Quality standards
- [ ] Resource management
- [ ] Resource availability
- [ ] AI Chat assistant

---

## Phase 3: UAT Scripts (5 Sessions)

### Session 3.1: Authentication & Authorization UAT
**Output:** `UAT-01-Auth.md`

**Test Cases:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Password reset flow
- [ ] Role-based menu visibility
- [ ] Project switching
- [ ] View As functionality

---

### Session 3.2: Core Modules UAT
**Output:** `UAT-02-Core.md`

**Test Cases:**
- [ ] Milestone CRUD
- [ ] Baseline commitment signing
- [ ] Acceptance certificate signing
- [ ] Deliverable CRUD
- [ ] Deliverable status workflow
- [ ] Dual signature completion

---

### Session 3.3: Time & Expense UAT
**Output:** `UAT-03-Time-Expense.md`

**Test Cases:**
- [ ] Timesheet creation
- [ ] Timesheet submission
- [ ] Timesheet validation/rejection
- [ ] Expense creation
- [ ] Receipt scanning
- [ ] Expense validation

---

### Session 3.4: Variations & Partners UAT
**Output:** `UAT-04-Variations-Partners.md`

**Test Cases:**
- [ ] Variation creation
- [ ] Variation submission
- [ ] Dual approval workflow
- [ ] CR document generation
- [ ] Partner invoice generation

---

### Session 3.5: Supporting Modules & Edge Cases UAT
**Output:** `UAT-05-Supporting.md`

**Test Cases:**
- [ ] RAID item management
- [ ] KPI updates
- [ ] Dashboard customization
- [ ] AI Chat queries
- [ ] Error handling
- [ ] Data integrity

---

## Final Assembly (2 Sessions)

### Session 4.1: Technical Specification Assembly
Combine all `TECH-SPEC-*` files into single document with:
- Master table of contents
- Cross-references
- Index

**Output:** `AMSF001-Technical-Specification-v1.0.md`

---

### Session 4.2: User Guide Assembly
Combine all `USER-GUIDE-*` files into single document with:
- Master table of contents
- Workflow diagrams
- Quick reference cards

**Output:** `AMSF001-User-Guide-v8.0.md`

---

## Master Checklist

### Phase 1: Technical Specification
| Session | Topic | Status | Output File |
|---------|-------|--------|-------------|
| 1.1 | Architecture & Infrastructure | ✅ Complete | TECH-SPEC-01-Architecture.md |
| 1.2 | Database - Core Tables | ✅ Complete | TECH-SPEC-02-Database-Core.md |
| 1.3 | Database - Operational Tables | ✅ Complete | TECH-SPEC-03-Database-Operations.md |
| 1.4 | Database - Supporting Tables | ✅ Complete | TECH-SPEC-04-Database-Supporting.md |
| 1.5 | RLS Policies & Security | ✅ Complete | TECH-SPEC-05-RLS-Security.md |
| 1.6 | API Layer & AI Integration | ✅ Complete | TECH-SPEC-06-API-AI.md |
| 1.7 | Frontend Architecture | ✅ Complete | TECH-SPEC-07-Frontend-State.md |
| 1.8 | Service Layer | ✅ Complete | TECH-SPEC-08-Services.md |

### Phase 2: User Guide
| Session | Topic | Status | Output File |
|---------|-------|--------|-------------|
| 2.1 | Getting Started & Navigation | ⬜ Pending | USER-GUIDE-01-Getting-Started.md |
| 2.2 | Dashboard & Customization | ⬜ Pending | USER-GUIDE-02-Dashboard.md |
| 2.3 | Milestones & Deliverables | ⬜ Pending | USER-GUIDE-03-Milestones-Deliverables.md |
| 2.4 | Time & Expense Management | ⬜ Pending | USER-GUIDE-04-Time-Expenses.md |
| 2.5 | Partners & Invoicing | ⬜ Pending | USER-GUIDE-05-Partners-Invoicing.md |
| 2.6 | Variations (Change Control) | ⬜ Pending | USER-GUIDE-06-Variations.md |
| 2.7 | RAID, KPIs, Quality & Resources | ⬜ Pending | USER-GUIDE-07-Supporting-Modules.md |

### Phase 3: UAT Scripts
| Session | Topic | Status | Output File |
|---------|-------|--------|-------------|
| 3.1 | Authentication & Authorization | ⬜ Pending | UAT-01-Auth.md |
| 3.2 | Core Modules | ⬜ Pending | UAT-02-Core.md |
| 3.3 | Time & Expense | ⬜ Pending | UAT-03-Time-Expense.md |
| 3.4 | Variations & Partners | ⬜ Pending | UAT-04-Variations-Partners.md |
| 3.5 | Supporting Modules | ⬜ Pending | UAT-05-Supporting.md |

### Phase 4: Assembly
| Session | Topic | Status | Output File |
|---------|-------|--------|-------------|
| 4.1 | Technical Spec Assembly | ⬜ Pending | AMSF001-Technical-Specification-v1.0.md |
| 4.2 | User Guide Assembly | ⬜ Pending | AMSF001-User-Guide-v8.0.md |

---

## Session Prompts

### Starting a New Session

Use this prompt template to start each session:

```
I'm continuing the AMSF001 documentation project. 

**Session:** [Session Number, e.g., 1.1]
**Topic:** [Topic Name, e.g., Architecture & Infrastructure]
**Target Output:** [Output file, e.g., TECH-SPEC-01-Architecture.md]

Please read the approach document at:
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Documentation-Approach-2025-12-10.md

Then complete the checklist items for this session by:
1. Reading the specified source files
2. Creating comprehensive documentation
3. Saving the output file to /Users/glennnickols/Projects/amsf001-project-tracker/docs/

Let me know when you're ready to begin.
```

### Resuming After a Break

```
I'm resuming the AMSF001 documentation project.

**Last completed session:** [Previous Session]
**Current session:** [Current Session Number]

Please review:
1. The approach document for the current session scope
2. Any previously created documentation in /docs/

Then continue with the documentation work.
```

---

## File Locations

All documentation should be saved to:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/
```

Approach document location:
```
/Users/glennnickols/Projects/amsf001-project-tracker/docs/AMSF001-Documentation-Approach-2025-12-10.md
```

---

## Estimated Timeline

| Phase | Sessions | Est. Time |
|-------|----------|-----------|
| Phase 1: Tech Spec | 8 sessions | ~4-6 hours |
| Phase 2: User Guide | 7 sessions | ~3-5 hours |
| Phase 3: UAT Scripts | 5 sessions | ~3-4 hours |
| Phase 4: Assembly | 2 sessions | ~1-2 hours |
| **Total** | **22 sessions** | **~11-17 hours** |

Spread across 2-3 days with breaks, this is very achievable.

---

## Success Criteria

### Technical Specification Complete When:
- [ ] All 8 sections drafted
- [ ] Database schema fully documented
- [ ] All RLS policies documented
- [ ] API endpoints documented
- [ ] Frontend architecture documented
- [ ] Assembled into single document

### User Guide Complete When:
- [ ] All 7 sections drafted
- [ ] All features covered
- [ ] Workflows include diagrams
- [ ] Role permissions documented
- [ ] Assembled into single document

### UAT Scripts Complete When:
- [ ] All 5 test sections drafted
- [ ] Test cases cover all features
- [ ] Expected results documented
- [ ] Role-based tests included

---

*Document created by Claude AI for AMSF001 Project Tracker documentation project*
