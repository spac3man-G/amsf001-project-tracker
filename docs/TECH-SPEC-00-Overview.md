# TECH-SPEC-00: Master Overview & Index

> **Version:** 1.0  
> **Created:** 7 January 2026  
> **Status:** Complete  
> **Purpose:** Master navigation index for all TECH-SPEC documentation

> **Version 1.0 (7 January 2026):**
> - Created as master index for 9 TECH-SPEC documents
> - Added comprehensive quick reference tables
> - Cross-references all 45+ database tables, 53 services, 18 API endpoints

---

## Table of Contents

1. [Document Index](#1-document-index)
2. [System Overview](#2-system-overview)
3. [Quick Reference: Database Tables](#3-quick-reference-database-tables)
4. [Quick Reference: Services](#4-quick-reference-services)
5. [Quick Reference: API Endpoints](#5-quick-reference-api-endpoints)
6. [Quick Reference: Frontend Pages](#6-quick-reference-frontend-pages)
7. [Quick Reference: Contexts](#7-quick-reference-contexts)
8. [Architecture Diagram](#8-architecture-diagram)
9. [Document History](#9-document-history)

---

## 1. Document Index

### 1.1 Core Technical Specifications

| Document | Version | Content Summary | Key Topics |
|----------|---------|-----------------|------------|
| **TECH-SPEC-01** | v2.3 | [Architecture](./TECH-SPEC-01-Architecture.md) | Tech stack, project structure, multi-tenancy, deployment |
| **TECH-SPEC-02** | v5.2 | [Database Core](./TECH-SPEC-02-Database-Core.md) | organisations, projects, profiles, milestones, deliverables, resources, plan_items, estimates, computed fields |
| **TECH-SPEC-03** | v1.2 | [Database Operations](./TECH-SPEC-03-Database-Operations.md) | timesheets, expenses, partners, invoices, receipt scanning |
| **TECH-SPEC-04** | v1.3 | [Database Supporting](./TECH-SPEC-04-Database-Supporting.md) | KPIs, quality standards, RAID, variations, audit, dashboard_layouts |
| **TECH-SPEC-05** | v4.1 | [RLS & Security](./TECH-SPEC-05-RLS-Security.md) | Row Level Security, org-aware policies, role matrix, authentication |
| **TECH-SPEC-06** | v1.5 | [API & AI Integration](./TECH-SPEC-06-API-AI.md) | Vercel Edge Functions, Claude integration, chat tools, Evaluator APIs |
| **TECH-SPEC-07** | v5.3 | [Frontend & State](./TECH-SPEC-07-Frontend-State.md) | Contexts, hooks, permissions, pages, Planning/Estimator/Evaluator UI |
| **TECH-SPEC-08** | v5.2 | [Services](./TECH-SPEC-08-Services.md) | Service layer, CRUD patterns, calculations, Evaluator services, Workflow system |
| **TECH-SPEC-11** | v1.0 | [Evaluator Module](./TECH-SPEC-11-Evaluator.md) | Complete Evaluator documentation: 17 tables, 15 pages, 18 services, 8 APIs |

### 1.2 Document by Topic

| Topic | Primary Document | Related Documents |
|-------|-----------------|-------------------|
| **Multi-tenancy** | TECH-SPEC-01 §4, TECH-SPEC-02 §3 | TECH-SPEC-05 §2-3 |
| **Authentication** | TECH-SPEC-05 §7-8 | TECH-SPEC-07 §2 |
| **Database Schema** | TECH-SPEC-02, 03, 04 | TECH-SPEC-11 §3 |
| **Row Level Security** | TECH-SPEC-05 | TECH-SPEC-11 §3.3 |
| **AI Integration** | TECH-SPEC-06 | TECH-SPEC-11 §6 |
| **Frontend State** | TECH-SPEC-07 | TECH-SPEC-11 §4 |
| **Service Layer** | TECH-SPEC-08 | TECH-SPEC-11 §5 |
| **Planning Tool** | TECH-SPEC-02 §15, TECH-SPEC-07 §14 | TECH-SPEC-08 §15 |
| **Evaluator Module** | TECH-SPEC-11 | TECH-SPEC-06 §10, 07 §15-16, 08 §16 |

---

## 2. System Overview

### 2.1 What is AMSF001 Project Tracker?

A **multi-tenant SaaS application** for managing enterprise project portfolios with:

- **Core Project Management** - Milestones, deliverables, resources, time/expense tracking
- **Financial Management** - Partner invoicing, variations, billing
- **Quality Management** - KPIs, quality standards, RAID log
- **Planning Tools** - Gantt-style planning, estimating, benchmarking
- **Evaluator Module** - Software evaluation with requirements, vendors, scoring, reports
- **AI Features** - Chat assistant, receipt scanning, document parsing

### 2.2 Three-Tier Multi-Tenancy

```
Organisation (Tier 1)     →  Top-level tenant (company)
    └── Project (Tier 2)  →  Project container with team
        └── Entity (Tier 3)  →  Business data (milestones, timesheets, etc.)
```

### 2.3 Technology Stack Summary

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite 5, React Router 6, Recharts, TailwindCSS |
| **Backend** | Supabase (PostgreSQL, Auth, Storage), Vercel Edge Functions |
| **AI** | Claude API (Opus 4, Sonnet 4.5, Haiku) |
| **Deployment** | Vercel (hosting), GitHub (CI/CD) |

---

## 3. Quick Reference: Database Tables

### 3.1 Tables by Document

| Document | Category | Tables |
|----------|----------|--------|
| **TECH-SPEC-02** | Core/Multi-tenancy | `organisations`, `user_organisations`, `projects`, `profiles`, `user_projects`, `org_invitations` |
| **TECH-SPEC-02** | Milestones/Deliverables | `milestones`, `deliverables`, `deliverable_tasks`, `deliverable_kpis`, `deliverable_quality_standards`, `deliverable_kpi_assessments`, `deliverable_qs_assessments`, `milestone_certificates`, `milestone_baseline_versions` |
| **TECH-SPEC-02** | Resources | `resources`, `resource_availability` |
| **TECH-SPEC-02** | Planning/Estimates | `plan_items`, `project_plans`, `estimates`, `estimate_components`, `estimate_tasks`, `estimate_resources` |
| **TECH-SPEC-03** | Operations | `timesheets`, `expenses`, `expense_files`, `receipt_scans`, `classification_rules` |
| **TECH-SPEC-03** | Partners | `partners`, `partner_invoices`, `partner_invoice_lines` |
| **TECH-SPEC-04** | Quality | `kpis`, `quality_standards` |
| **TECH-SPEC-04** | RAID | `raid_items` |
| **TECH-SPEC-04** | Variations | `variations`, `variation_milestones`, `variation_deliverables` |
| **TECH-SPEC-04** | Supporting | `benchmark_rates`, `document_templates`, `dashboard_layouts`, `audit_log` |
| **TECH-SPEC-11** | Evaluator Core | `evaluation_projects`, `evaluation_project_users`, `stakeholder_areas`, `evaluation_categories`, `scoring_scales` |
| **TECH-SPEC-11** | Evaluator Workshops | `workshops`, `workshop_attendees`, `surveys`, `survey_responses` |
| **TECH-SPEC-11** | Evaluator Requirements | `requirements`, `requirement_approvals`, `requirement_comments`, `evaluation_criteria` |
| **TECH-SPEC-11** | Evaluator Vendors | `vendors`, `vendor_questions`, `vendor_responses`, `evidence` |
| **TECH-SPEC-11** | Evaluator Scoring | `scores`, `consensus_scores` |
| **TECH-SPEC-11** | Evaluator Documents | `evaluation_documents`, `ai_tasks_audit_log` |

### 3.2 Table Count Summary

| Module | Table Count |
|--------|-------------|
| Core/Multi-tenancy | 6 |
| Milestones/Deliverables | 9 |
| Resources | 2 |
| Planning/Estimates | 6 |
| Operations | 5 |
| Partners | 3 |
| Quality/RAID | 3 |
| Variations | 3 |
| Supporting | 4 |
| **Evaluator** | 17 |
| **TOTAL** | **58+** |

---

## 4. Quick Reference: Services

### 4.1 Core Services (`/src/services/`)

| Service | Purpose | Document |
|---------|---------|----------|
| `organisation.service.js` | Organisation CRUD, member management | TECH-SPEC-08 §3 |
| `invitation.service.js` | Org invitation workflow | TECH-SPEC-08 §3 |
| `subscription.service.js` | Subscription management | TECH-SPEC-08 §3 |
| `milestones.service.js` | Milestone management, certificates | TECH-SPEC-08 §4 |
| `deliverables.service.js` | Deliverable workflow, sign-offs | TECH-SPEC-08 §5 |
| `resources.service.js` | Resource management, utilization | TECH-SPEC-08 §6 |
| `timesheets.service.js` | Timesheet submission/approval | TECH-SPEC-08 §7 |
| `expenses.service.js` | Expense workflow, receipts | TECH-SPEC-08 §8 |
| `partners.service.js` | Partner management | TECH-SPEC-08 §9 |
| `kpis.service.js` | KPI tracking, RAG status | TECH-SPEC-08 §10 |
| `qualityStandards.service.js` | Quality standard tracking | TECH-SPEC-08 §10 |
| `raid.service.js` | RAID log management | TECH-SPEC-08 §10 |
| `variations.service.js` | Change control workflow | TECH-SPEC-08 §10 |
| `metrics.service.js` | Dashboard aggregations | TECH-SPEC-08 §11 |
| `dashboard.service.js` | Layout persistence | TECH-SPEC-08 §11 |
| `invoicing.service.js` | Invoice generation | TECH-SPEC-08 §11 |
| `calendar.service.js` | Calendar integration | TECH-SPEC-08 §11 |
| `documentTemplates.service.js` | JSONB templates | TECH-SPEC-08 §12 |
| `documentRenderer.service.js` | Document generation | TECH-SPEC-08 §12 |
| `receiptScanner.service.js` | AI receipt processing | TECH-SPEC-08 §13 |
| `workflow.service.js` | Workflow orchestration | TECH-SPEC-08 §1.3 |
| `email.service.js` | Email notifications | TECH-SPEC-08 §1.3 |
| `standards.service.js` | Standards management | TECH-SPEC-08 §1.3 |
| `syncService.js` | Data synchronization | TECH-SPEC-08 §1.3 |

### 4.2 Planning & Estimator Services

| Service | Purpose | Document |
|---------|---------|----------|
| `planItemsService.js` | Plan item CRUD | TECH-SPEC-08 §15 |
| `planCommitService.js` | Plan commit workflow | TECH-SPEC-08 §15 |
| `estimates.service.js` | Estimate management | TECH-SPEC-08 §15 |
| `benchmarkRates.service.js` | SFIA 8 rate card | TECH-SPEC-08 §15 |
| `reportTemplates.service.js` | Report templates | TECH-SPEC-08 §14 |
| `reportDataFetcher.service.js` | Report data fetching | TECH-SPEC-08 §14 |
| `reportRenderer.service.js` | Report rendering | TECH-SPEC-08 §14 |

### 4.3 Evaluator Services (`/src/services/evaluator/`)

| Service | Purpose | Document |
|---------|---------|----------|
| `base.evaluator.service.js` | Base class for Evaluator services | TECH-SPEC-11 §5 |
| `evaluationProjects.service.js` | Evaluation project CRUD | TECH-SPEC-11 §5.2 |
| `stakeholderAreas.service.js` | Stakeholder area management | TECH-SPEC-11 §5.3 |
| `evaluationCategories.service.js` | Category management | TECH-SPEC-11 §5.3 |
| `requirements.service.js` | Requirements workflow | TECH-SPEC-11 §5.4 |
| `approvals.service.js` | Approval management | TECH-SPEC-11 §5.5 |
| `comments.service.js` | Comments on requirements | TECH-SPEC-11 §5.5 |
| `vendors.service.js` | Vendor management | TECH-SPEC-11 §5.6 |
| `vendorQuestions.service.js` | Vendor questionnaires | TECH-SPEC-11 §5.6 |
| `evidence.service.js` | Evidence management | TECH-SPEC-11 §5.6 |
| `workshops.service.js` | Workshop management | TECH-SPEC-11 §5.7 |
| `surveys.service.js` | Survey management | TECH-SPEC-11 §5.8 |
| `scores.service.js` | Scoring & consensus | TECH-SPEC-11 §5.9 |
| `evaluationDocuments.service.js` | Document management | TECH-SPEC-11 §5.10 |
| `ai.service.js` | AI integration | TECH-SPEC-11 §5.11 |
| `clientPortal.service.js` | Client portal auth | TECH-SPEC-11 §5.12 |
| `emailNotifications.service.js` | Email notifications | TECH-SPEC-11 §5.13 |
| `traceability.service.js` | Traceability matrix | TECH-SPEC-11 §5.14 |

### 4.4 Service Count Summary

| Location | Count |
|----------|-------|
| `/src/services/` (core) | 34 |
| `/src/services/evaluator/` | 18 |
| **TOTAL** | **52+** |

---

## 5. Quick Reference: API Endpoints

### 5.1 Core API Endpoints (`/api/`)

| Endpoint | Method | Purpose | Document |
|----------|--------|---------|----------|
| `/api/chat` | POST | AI chat (standard) | TECH-SPEC-06 §3 |
| `/api/chat-stream` | POST | AI chat (streaming) | TECH-SPEC-06 §3 |
| `/api/chat-context` | POST | Retrieve AI context | TECH-SPEC-06 §5 |
| `/api/create-user` | POST | Admin user creation | TECH-SPEC-06 §6 |
| `/api/create-organisation` | POST | Organisation creation | TECH-SPEC-06 §7 |
| `/api/create-project` | POST | Project creation | TECH-SPEC-06 §8 |
| `/api/manage-project-users` | POST | Project team management | TECH-SPEC-06 §2.1 |
| `/api/planning-ai` | POST | AI planning assistance | TECH-SPEC-06 §9 |
| `/api/report-ai` | POST | AI report generation | TECH-SPEC-06 §2.1 |
| `/api/scan-receipt` | POST | Receipt OCR | TECH-SPEC-06 §9.4 |

### 5.2 Evaluator API Endpoints (`/api/evaluator/`)

| Endpoint | Method | Purpose | Document |
|----------|--------|---------|----------|
| `/api/evaluator/ai-document-parse` | POST | Parse uploaded documents | TECH-SPEC-11 §6.2 |
| `/api/evaluator/ai-gap-analysis` | POST | AI gap analysis | TECH-SPEC-11 §6.3 |
| `/api/evaluator/ai-market-research` | POST | AI market research | TECH-SPEC-11 §6.4 |
| `/api/evaluator/ai-requirement-suggest` | POST | AI requirement suggestions | TECH-SPEC-11 §6.5 |
| `/api/evaluator/client-portal-auth` | POST | Client portal authentication | TECH-SPEC-11 §6.6 |
| `/api/evaluator/create-evaluation` | POST | Create evaluation project | TECH-SPEC-11 §6.7 |
| `/api/evaluator/generate-report` | POST | Generate evaluation report | TECH-SPEC-11 §6.8 |
| `/api/evaluator/vendor-portal-auth` | POST | Vendor portal authentication | TECH-SPEC-11 §6.9 |

### 5.3 API Endpoint Count

| Location | Count |
|----------|-------|
| `/api/` (core) | 10 |
| `/api/evaluator/` | 8 |
| **TOTAL** | **18** |

---

## 6. Quick Reference: Frontend Pages

### 6.1 Core Application Pages (`/src/pages/`)

| Page | Route | Purpose | Document |
|------|-------|---------|----------|
| Dashboard | `/dashboard` | Customizable dashboard | TECH-SPEC-07 §10 |
| Workflow Summary | `/workflow-summary` | Pending actions | TECH-SPEC-07 §10 |
| Milestones | `/milestones`, `/milestones/:id` | Milestone management | TECH-SPEC-07 §10 |
| Deliverables | `/deliverables`, `/deliverables/:id` | Deliverable management | TECH-SPEC-07 §10 |
| Timesheets | `/timesheets` | Time entry management | TECH-SPEC-07 §10 |
| Expenses | `/expenses` | Expense management | TECH-SPEC-07 §10 |
| Resources | `/resources`, `/resources/:id` | Resource management | TECH-SPEC-07 §10 |
| Partners | `/partners`, `/partners/:id` | Partner & invoicing | TECH-SPEC-07 §10 |
| Variations | `/variations`, `/variations/:id`, `/variations/new` | Change control | TECH-SPEC-07 §10 |
| KPIs | `/kpis` | KPI management | TECH-SPEC-07 §10 |
| Quality Standards | `/quality-standards` | Quality tracking | TECH-SPEC-07 §10 |
| RAID | `/raid` | RAID log | TECH-SPEC-07 §10 |
| Billing | `/billing` | Billing overview | TECH-SPEC-07 §10 |
| Calendar | `/calendar` | Resource calendar | TECH-SPEC-07 §10 |
| Gantt | `/gantt` | Gantt chart | TECH-SPEC-07 §10 |
| Reports | `/reports` | Report generation | TECH-SPEC-07 §10 |
| Users | `/users` | User management | TECH-SPEC-07 §10 |
| Settings | `/settings` | Project settings | TECH-SPEC-07 §10 |
| Audit Log | `/audit-log` | Audit trail | TECH-SPEC-07 §10 |
| Deleted Items | `/deleted-items` | Soft-deleted records | TECH-SPEC-07 §10 |
| Account | `/account` | User profile | TECH-SPEC-07 §10 |

### 6.2 Planning & Estimator Pages (`/src/pages/planning/`)

| Page | Route | Purpose | Document |
|------|-------|---------|----------|
| Planning | `/planning` | Gantt-style planning | TECH-SPEC-07 §14 |
| Estimator | `/estimator` | Project estimation | TECH-SPEC-07 §14 |
| Benchmarking | `/benchmarking` | SFIA 8 rate card | TECH-SPEC-07 §14 |
| Plan Items | `/plan-items` | Plan item management | TECH-SPEC-07 §14 |
| Estimates | `/estimates` | Estimate management | TECH-SPEC-07 §14 |

### 6.3 Evaluator Pages (`/src/pages/evaluator/`)

| Page | Route | Purpose | Document |
|------|-------|---------|----------|
| EvaluatorDashboard | `/evaluator` | Evaluator home | TECH-SPEC-11 §4.2 |
| EvaluationProject | `/evaluator/project/:id` | Project detail | TECH-SPEC-11 §4.2 |
| RequirementsList | `/evaluator/requirements` | Requirements management | TECH-SPEC-11 §4.2 |
| RequirementDetail | `/evaluator/requirements/:id` | Requirement detail | TECH-SPEC-11 §4.2 |
| VendorsList | `/evaluator/vendors` | Vendor management | TECH-SPEC-11 §4.2 |
| VendorDetail | `/evaluator/vendors/:id` | Vendor detail | TECH-SPEC-11 §4.2 |
| WorkshopsList | `/evaluator/workshops` | Workshop management | TECH-SPEC-11 §4.2 |
| WorkshopDetail | `/evaluator/workshops/:id` | Workshop detail | TECH-SPEC-11 §4.2 |
| SurveysList | `/evaluator/surveys` | Survey management | TECH-SPEC-11 §4.2 |
| SurveyDetail | `/evaluator/surveys/:id` | Survey detail | TECH-SPEC-11 §4.2 |
| ScoringMatrix | `/evaluator/scoring` | Scoring interface | TECH-SPEC-11 §4.2 |
| ReportBuilder | `/evaluator/reports` | Report generation | TECH-SPEC-11 §4.2 |
| ClientPortal | `/client-portal` | Client-facing portal | TECH-SPEC-11 §4.2 |
| VendorPortal | `/vendor-portal` | Vendor response portal | TECH-SPEC-11 §4.2 |
| TraceabilityMatrix | `/evaluator/traceability` | Traceability view | TECH-SPEC-11 §4.2 |

### 6.4 Admin Pages (`/src/pages/admin/`)

| Page | Route | Purpose | Document |
|------|-------|---------|----------|
| AdminDashboard | `/admin` | Admin overview | TECH-SPEC-07 §13 |
| OrganisationSettings | `/admin/organisation` | Org settings | TECH-SPEC-07 §13 |
| UserManagement | `/admin/users` | User admin | TECH-SPEC-07 §13 |
| BillingAdmin | `/admin/billing` | Billing admin | TECH-SPEC-07 §13 |

### 6.5 Onboarding Pages (`/src/pages/onboarding/`)

| Page | Route | Purpose | Document |
|------|-------|---------|----------|
| OnboardingWizard | `/onboarding` | New user onboarding | TECH-SPEC-07 §13 |
| LandingPage | `/` | Public landing | TECH-SPEC-07 §13 |
| UpgradePrompt | `/upgrade` | Subscription upgrade | TECH-SPEC-07 §13 |

### 6.6 Page Count Summary

| Module | Count |
|--------|-------|
| Core Application | 21 |
| Planning/Estimator | 5 |
| Evaluator | 15 |
| Admin | 4 |
| Onboarding | 3 |
| **TOTAL** | **48+** |

---

## 7. Quick Reference: Contexts

### 7.1 Context Provider Hierarchy

```jsx
<AuthProvider>
  <OrganisationProvider>
    <ProjectProvider>
      <ViewAsProvider>
        <ToastProvider>
          <NotificationProvider>
            <MetricsProvider>
              <ChatProvider>
                <EvaluationProvider>      {/* For Evaluator routes */}
                  <ReportBuilderProvider> {/* For Evaluator reports */}
                    <App />
                  </ReportBuilderProvider>
                </EvaluationProvider>
              </ChatProvider>
            </MetricsProvider>
          </NotificationProvider>
        </ToastProvider>
      </ViewAsProvider>
    </ProjectProvider>
  </OrganisationProvider>
</AuthProvider>
```

### 7.2 Context Summary

| Context | Purpose | Key State | Document |
|---------|---------|-----------|----------|
| `AuthContext` | Authentication | user, profile, session | TECH-SPEC-07 §2 |
| `OrganisationContext` | Org selection | currentOrg, orgRole | TECH-SPEC-07 §3 |
| `ProjectContext` | Project selection | currentProject, projectRole | TECH-SPEC-07 §4 |
| `ViewAsContext` | Role impersonation | effectiveRole, isImpersonating | TECH-SPEC-07 §5 |
| `ToastContext` | Notifications | toast queue | TECH-SPEC-07 §8 |
| `NotificationContext` | System alerts | notifications | TECH-SPEC-07 §8 |
| `MetricsContext` | Dashboard data | metrics, loading | TECH-SPEC-07 §7 |
| `ChatContext` | AI chat | messages, streaming | TECH-SPEC-07 §6 |
| `HelpContext` | Help system | help content | TECH-SPEC-07 §8 |
| `TestUserContext` | Testing | test mode state | TECH-SPEC-07 §8 |
| `EvaluationContext` | Evaluator state | evaluation, requirements | TECH-SPEC-11 §4 |
| `ReportBuilderContext` | Report building | report config | TECH-SPEC-07 §15 |

---

## 8. Architecture Diagram

### 8.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         React Application                              │ │
│  │  ┌─────────┐  ┌────────────┐  ┌─────────┐  ┌──────────────────────┐  │ │
│  │  │  Pages  │  │ Components │  │  Hooks  │  │      Contexts        │  │ │
│  │  └────┬────┘  └─────┬──────┘  └────┬────┘  │ (Auth, Project, etc) │  │ │
│  │       │             │              │       └──────────┬───────────┘  │ │
│  │       └─────────────┼──────────────┘                  │              │ │
│  │                     ▼                                 ▼              │ │
│  │          ┌───────────────────────────────────────────────┐          │ │
│  │          │               Services Layer                  │          │ │
│  │          │  (53 services: CRUD, calculations, reports)   │          │ │
│  │          └────────────────────┬──────────────────────────┘          │ │
│  └───────────────────────────────┼─────────────────────────────────────┘ │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│    SUPABASE     │    │   VERCEL EDGE       │    │   ANTHROPIC     │
│                 │    │    FUNCTIONS        │    │    CLAUDE       │
│ ┌─────────────┐ │    │                     │    │                 │
│ │ PostgreSQL  │ │    │ • /api/chat         │    │ • Opus 4        │
│ │ (58+ tables)│ │    │ • /api/evaluator/*  │    │ • Sonnet 4.5    │
│ │             │ │    │ • /api/planning-ai  │    │ • Haiku         │
│ │ ┌─────────┐ │ │    │ • /api/scan-receipt │    │                 │
│ │ │   RLS   │ │ │    │                     │    │ Tools:          │
│ │ │Policies │ │ │    │ 18 endpoints        │    │ • Query data    │
│ │ └─────────┘ │ │    │                     │    │ • Parse docs    │
│ └─────────────┘ │    └─────────────────────┘    │ • Generate      │
│                 │                               └─────────────────┘
│ ┌─────────────┐ │
│ │ Supabase    │ │
│ │    Auth     │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │  Storage    │ │
│ │ (files)     │ │
│ └─────────────┘ │
└─────────────────┘
```

### 8.2 Data Flow Pattern

```
User Action → Page → Hook → Service → Supabase (RLS) → PostgreSQL
                               ↓
                          Context Update → UI Re-render
```

---

## 9. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 7 Jan 2026 | Initial creation as master index for 9 TECH-SPEC documents |

---

## Appendix A: Quick Links

### Documentation Files

- [TECH-SPEC-01-Architecture.md](./TECH-SPEC-01-Architecture.md)
- [TECH-SPEC-02-Database-Core.md](./TECH-SPEC-02-Database-Core.md)
- [TECH-SPEC-03-Database-Operations.md](./TECH-SPEC-03-Database-Operations.md)
- [TECH-SPEC-04-Database-Supporting.md](./TECH-SPEC-04-Database-Supporting.md)
- [TECH-SPEC-05-RLS-Security.md](./TECH-SPEC-05-RLS-Security.md)
- [TECH-SPEC-06-API-AI.md](./TECH-SPEC-06-API-AI.md)
- [TECH-SPEC-07-Frontend-State.md](./TECH-SPEC-07-Frontend-State.md)
- [TECH-SPEC-08-Services.md](./TECH-SPEC-08-Services.md)
- [TECH-SPEC-11-Evaluator.md](./TECH-SPEC-11-Evaluator.md)

### Related Documentation

- [DOC-REVIEW-CHECKPOINT.md](./DOC-REVIEW-CHECKPOINT.md) - Documentation review tracking
- [AMSF001-Technical-Specification.md](./AMSF001-Technical-Specification.md) - Original master document (legacy)
- [APPLICATION-CONTEXT.md](./APPLICATION-CONTEXT.md) - Application context overview
- [LOCAL-ENV-SETUP.md](./LOCAL-ENV-SETUP.md) - Local development setup

---

*This master index was created as part of the documentation review completed 7 January 2026.*
