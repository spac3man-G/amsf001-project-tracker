# Evaluator Tool - Implementation Plan

## Document Purpose

This document serves as the **master implementation guide** for the Evaluator tool. It is designed to:

1. **Provide full context** for any AI assistant session to understand the project
2. **Track progress** through clearly defined checkpoints
3. **Enable multi-session work** by maintaining state between chat sessions
4. **Define stopping points** where the AI should check in before proceeding

**Usage:** At the start of any new AI session, share this document along with `APPLICATION-CONTEXT.md` and `LOCAL-ENV-SETUP.md` to provide complete context.

---

## Progress Tracker

### Current Status

| Phase | Status | Last Updated | Notes |
|-------|--------|--------------|-------|
| Phase 0: Documentation | ✅ COMPLETE | 2026-01-01 | Architecture doc created |
| Phase 1: Database Foundation | ✅ COMPLETE | 2026-01-01 | All 18 migrations created and pushed |
| Phase 2: Core Infrastructure | ✅ COMPLETE | 2026-01-01 | Context, hooks, services, routing, navigation |
| Phase 3: Requirements Module | 🔄 IN PROGRESS | 2026-01-01 | Session 3A & 3B complete, Session 3C pending |
| Phase 4: Input Capture | 🔲 NOT STARTED | - | - |
| Phase 5: Vendor Management | 🔲 NOT STARTED | - | - |
| Phase 6: Evaluation & Scoring | 🔲 NOT STARTED | - | - |
| Phase 7: Traceability & Reports | 🔲 NOT STARTED | - | - |
| Phase 8: AI Features | 🔲 NOT STARTED | - | - |
| Phase 9: Portals | 🔲 NOT STARTED | - | - |
| Phase 10: Testing & Polish | 🔲 NOT STARTED | - | - |

**Legend:** ✅ Complete | 🔄 In Progress | 🔲 Not Started | ⏸️ Blocked

### Last Checkpoint Completed

```
Checkpoint: SESSION-3B-COMPLETE
Date: 2026-01-01
Summary: Session 3B complete. Requirements CRUD fully implemented with:
         - RequirementForm modal (create/edit) with validation
         - Auto-generated reference codes (REQ-001, REQ-002, etc.)
         - RequirementCard component for detailed view
         - RequirementDetail page with full traceability chain
         - Status workflow (draft → review → approved/rejected)
         - Approval/rejection dialog with required notes for rejection
         - Soft delete with bulk operations
         - CSV export functionality
Files Created:
  - src/components/evaluator/requirements/RequirementForm.jsx
  - src/components/evaluator/requirements/RequirementForm.css
  - src/components/evaluator/requirements/RequirementCard.jsx
  - src/components/evaluator/requirements/RequirementCard.css
  - src/pages/evaluator/RequirementDetail.jsx
  - src/pages/evaluator/RequirementDetail.css
Files Modified:
  - src/components/evaluator/requirements/index.js (added exports)
  - src/App.jsx (added RequirementDetail route)
Build Status: ✅ Passing
Next Action: Session 3C - Requirements Matrix & Settings
```

---

## Part 1: Project Context

### 1.1 Business Context

**Client Engagement:** Smart Consulting has been engaged by Carey Olsen (law firm) to replace their ViewPoint CSP (Corporate Service Provider) platform. This is a 5-phase consulting project running January to June 2025.

**The Need:** During this engagement, Smart Consulting identified a gap in their tooling. They need a structured way to:
- Gather and trace requirements back to stakeholders
- Evaluate multiple vendors against weighted criteria
- Maintain full audit trails of decisions
- Provide clients with visibility into the process
- Generate professional reports and traceability matrices

**The Solution:** Build "Evaluator" - a new tool within the existing AMSF001 Project Tracker application that handles technology procurement evaluations with full traceability.

### 1.2 Product Vision

**Evaluator** is a multi-tenant vendor evaluation platform designed for consultancy use. It provides:

1. **Workshop-Centric Input Capture** - Requirements gathered in facilitated sessions, validated post-workshop
2. **Full Traceability** - Every score traceable to evidence, requirements, workshops, and stakeholders
3. **Weighted Evaluation** - Configurable categories and criteria with percentage weights
4. **Multi-Stakeholder Perspectives** - Different specialist areas (CSP Ops, IT, Finance, Compliance)
5. **Client Portal** - Branded dashboards for client visibility
6. **Vendor Portal** - Light-touch interface for vendor responses
7. **AI Assistance** - Gap analysis, market research, document parsing

### 1.3 Key Differentiators

Compared to existing tools (Olive.app, procurement suites):
- **Workshop-centric** not survey-first
- **Consultant-led multi-client** not single-company focused
- **Deep provenance tracking** with full audit trails
- **Interactive client experience** not just PDF reports
- **Lightweight vendor portal** without complex procurement workflows

### 1.4 User Roles

| Role | Description | Key Actions |
|------|-------------|-------------|
| **Consultant Admin** | Smart Consulting team lead | Full access, configure projects, manage users |
| **Consultant Evaluator** | Smart Consulting team member | Capture requirements, score vendors, collect evidence |
| **Client Stakeholder** | Carey Olsen project team | View progress, approve requirements, participate in workshops |
| **Workshop Participant** | Anyone invited to workshop | Complete follow-up forms, validate attributed requirements |
| **Vendor** | Vendor sales/presales team | Respond to questions, upload materials (portal only) |

---

## Part 2: Technical Context

### 2.1 Existing Application

Evaluator is being built within the **AMSF001 Project Tracker** application. Key facts:

- **Stack:** React 18 + Vite, Supabase (PostgreSQL + Auth + RLS), Vercel (hosting + serverless)
- **Multi-tenancy:** Organisation → Project → Entity hierarchy with Row Level Security
- **Patterns:** BaseService for data access, React Context for state, custom hooks for permissions
- **AI Integration:** Claude API for chat assistant, receipt scanning
- **Existing Tools:** Tracker (timesheets, expenses, milestones), Planner (project planning), Estimator (cost estimation), Benchmarking (SFIA rates)

**Key Files to Reference:**
- `docs/APPLICATION-CONTEXT.md` - Full application architecture
- `docs/LOCAL-ENV-SETUP.md` - Development environment setup
- `docs/EVALUATOR-TECHNICAL-ARCHITECTURE.md` - Detailed technical design

### 2.2 Development Environment

```
Location: ~/Projects/amsf001-project-tracker/
Repository: github.com/spac3man-G/amsf001-project-tracker
Database: Supabase project ljqpmrcqxzgcfojrkxce
Deployment: Vercel (auto-deploy from GitHub)

Key Commands:
  npm run dev          # Start dev server (localhost:5173)
  npm run build        # Production build
  supabase db push     # Push migrations to database
  supabase migration new <name>  # Create new migration
```

### 2.3 Architecture Decision: Parallel Not Nested

Evaluator sits **parallel** to the existing Project structure:

```
Organisation
├── Project (existing - delivery tracking)
│   └── Milestones, Deliverables, Timesheets, etc.
│
└── EvaluationProject (new - vendor evaluation)
    └── Requirements, Vendors, Scores, etc.
```

This means:
- Completely separate data model
- Independent permission system
- No coupling to delivery project lifecycle
- Future option to link evaluation outcomes to delivery projects

### 2.4 Key Technical Patterns to Follow

**Services:** Extend `BaseService`, use `evaluation_project_id` for scoping
**Contexts:** Follow `ProjectContext` pattern for `EvaluationContext`
**Hooks:** Follow `usePermissions` pattern for `useEvaluatorPermissions`
**Components:** Reuse common components, new components in `src/components/evaluator/`
**Pages:** New pages in `src/pages/evaluator/`
**API:** New endpoints in `api/evaluator/`

---

## Part 3: Data Model Summary

### 3.1 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `evaluation_projects` | Main container | name, organisation_id, status, client_name |
| `evaluation_project_users` | Access control | user_id, role, stakeholder_area_id |
| `stakeholder_areas` | Departments/functions | name, evaluation_project_id |
| `evaluation_categories` | Scoring categories | name, weight, evaluation_project_id |
| `scoring_scales` | Score definitions | value (1-5), label, description |

### 3.2 Input Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `workshops` | Workshop sessions | name, scheduled_date, facilitator_id, status |
| `workshop_attendees` | Who attended | user_id, stakeholder_area_id, attended |
| `surveys` | Forms/questionnaires | name, type, questions (JSONB) |
| `survey_responses` | Form submissions | respondent_id, answers (JSONB) |
| `evaluation_documents` | Uploaded files | name, file_url, parse_results |

### 3.3 Requirements Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `requirements` | Core requirements | reference_code, title, category_id, priority, status, source_* |
| `evaluation_criteria` | Scoring criteria | name, category_id, weight |
| `requirement_criteria` | Links reqs to criteria | requirement_id, criterion_id |

### 3.4 Vendor Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `vendors` | Vendor records | name, status, portal_access_code |
| `vendor_contacts` | Vendor people | vendor_id, name, email, is_primary |
| `vendor_questions` | RFP questions | question_text, question_type |
| `vendor_responses` | Vendor answers | vendor_id, question_id, response_text |
| `vendor_documents` | Uploaded materials | vendor_id, document_type, file_url |

### 3.5 Evaluation Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `evidence` | Supporting evidence | vendor_id, type, title, content |
| `evidence_links` | Links to reqs/criteria | evidence_id, requirement_id |
| `scores` | Individual evaluator scores | vendor_id, criterion_id, evaluator_id, score_value |
| `consensus_scores` | Reconciled scores | vendor_id, criterion_id, consensus_value |

### 3.6 Supporting Tables

| Table | Purpose |
|-------|---------|
| `ai_tasks` | Track AI operations |
| `evaluation_audit_log` | Full audit trail |

**Full schema details:** See `docs/EVALUATOR-TECHNICAL-ARCHITECTURE.md`

---

## Part 4: Implementation Phases


### Phase 1: Database Foundation

**Objective:** Create all database tables and RLS policies

**Estimated Effort:** 1-2 sessions

#### Tasks

- [x] **1.1** Create migration: `evaluation_projects` table
- [x] **1.2** Create migration: `evaluation_project_users` table  
- [x] **1.3** Create migration: `stakeholder_areas` table
- [x] **1.4** Create migration: `evaluation_categories` table
- [x] **1.5** Create migration: `scoring_scales` table
- [x] **1.6** Create migration: `workshops` and `workshop_attendees` tables
- [x] **1.7** Create migration: `surveys` and `survey_responses` tables
- [x] **1.8** Create migration: `evaluation_documents` table
- [x] **1.9** Create migration: `requirements` table
- [x] **1.10** Create migration: `evaluation_criteria` and `requirement_criteria` tables
- [x] **1.11** Create migration: `vendors` and `vendor_contacts` tables
- [x] **1.12** Create migration: `vendor_questions`, `vendor_responses`, `vendor_documents` tables
- [x] **1.13** Create migration: `evidence` and `evidence_links` tables
- [x] **1.14** Create migration: `scores` and `score_evidence` tables
- [x] **1.15** Create migration: `consensus_scores` and `consensus_score_sources` tables
- [x] **1.16** Create migration: `ai_tasks` and `evaluation_audit_log` tables
- [x] **1.17** Create migration: RLS policies for all tables
- [x] **1.18** Create migration: Seed test data
- [x] **1.19** Push migrations and verify in Supabase dashboard

#### Checkpoint: PHASE-1-COMPLETE

```
☑ All tables created and visible in Supabase
☑ RLS policies applied
☑ Test data seeded
☑ Can query tables via Supabase MCP
```

**✅ PHASE 1 COMPLETE** - Database foundation established (2026-01-01)

---

### Phase 2: Core Infrastructure

**Objective:** Create contexts, hooks, and base services

**Estimated Effort:** 1-2 sessions

#### Tasks

- [x] **2.1** Create `src/services/evaluator/` directory structure
- [x] **2.2** Create `base.evaluator.service.js` extending BaseService
- [x] **2.3** Create `evaluationProjects.service.js`
- [x] **2.4** Create `src/contexts/EvaluationContext.jsx`
- [x] **2.5** Create `src/hooks/useEvaluatorPermissions.js`
- [x] **2.6** Create `src/hooks/useEvaluationRole.js`
- [x] **2.7** Update `App.jsx` to include EvaluationProvider
- [x] **2.8** Create basic routing structure for evaluator pages
- [x] **2.9** Create `src/pages/evaluator/` directory
- [x] **2.10** Create shell `EvaluatorDashboard.jsx` page
- [x] **2.11** Create `EvaluationSwitcher.jsx` component
- [x] **2.12** Add Evaluator to main navigation (for appropriate roles)
- [ ] **2.13** Verify context works - can switch evaluations, see role

#### Checkpoint: PHASE-2-COMPLETE

```
☑ Can navigate to /evaluator/dashboard
☑ EvaluationContext provides current evaluation
☑ Can switch between evaluations (if multiple exist)
☑ Permissions hook returns correct permissions for role
☑ Build compiles successfully
□ Manual testing pending
```

**✅ PHASE 2 COMPLETE** - Core infrastructure implemented (2026-01-01)

---

### Phase 3: Requirements Module

**Objective:** Full requirements management functionality

**Estimated Effort:** 2-3 sessions

#### Session 3A: Requirements Service & List

- [x] **3A.1** Create `requirements.service.js` with full CRUD
- [x] **3A.2** Create `stakeholderAreas.service.js`
- [x] **3A.3** Create `evaluationCategories.service.js`
- [x] **3A.4** Create `RequirementsHub.jsx` page
- [x] **3A.5** Create `RequirementFilters.jsx` component
- [x] **3A.6** Create requirements list view with DataTable
- [x] **3A.7** Implement filtering by category, area, priority, status

**Mini-checkpoint 3A:**
```
☑ Can view list of requirements
☑ Filters work correctly
☑ Shows category, stakeholder area, priority, status
```

#### Session 3B: Requirements CRUD

- [x] **3B.1** Create `RequirementForm.jsx` component (add/edit modal)
- [x] **3B.2** Implement create requirement with auto-generated reference code
- [x] **3B.3** Implement edit requirement
- [x] **3B.4** Implement delete requirement (soft delete)
- [x] **3B.5** Implement status workflow (draft → review → approved)
- [x] **3B.6** Create `RequirementCard.jsx` for detail view
- [x] **3B.7** Implement requirement validation/approval flow

**Mini-checkpoint 3B:**
```
☑ Can create new requirements
☑ Can edit requirements
☑ Can delete requirements
☑ Status transitions work
☑ Approval workflow works
```

#### Session 3C: Requirements Matrix & Settings

- [ ] **3C.1** Create `RequirementMatrix.jsx` component (grid view)
- [ ] **3C.2** Implement grouping by category/area/priority
- [ ] **3C.3** Create stakeholder areas management UI
- [ ] **3C.4** Create evaluation categories management UI (with weights)
- [ ] **3C.5** Create scoring scale configuration UI
- [ ] **3C.6** Add requirements count to dashboard

#### Checkpoint: PHASE-3-COMPLETE

```
□ Full requirements CRUD working
□ Matrix view displays requirements grouped
□ Can manage stakeholder areas
□ Can manage evaluation categories with weights
□ Weights sum to 100% validation
□ Scoring scale configured
```

**🛑 STOP HERE** - Report completion, demonstrate requirements module, ask to proceed to Phase 4

---

### Phase 4: Input Capture

**Objective:** Workshops, surveys, and document upload

**Estimated Effort:** 2-3 sessions

#### Session 4A: Workshops

- [ ] **4A.1** Create `workshops.service.js`
- [ ] **4A.2** Create `WorkshopsHub.jsx` page
- [ ] **4A.3** Create `WorkshopCard.jsx` component
- [ ] **4A.4** Implement workshop CRUD (schedule, edit, delete)
- [ ] **4A.5** Implement attendee management
- [ ] **4A.6** Create `WorkshopCapture.jsx` - live requirement capture mode
- [ ] **4A.7** Link captured requirements to workshop + attendee

**Mini-checkpoint 4A:**
```
□ Can create/edit/delete workshops
□ Can manage attendees
□ Live capture mode works
□ Requirements linked to workshop source
```

#### Session 4B: Surveys & Follow-up

- [ ] **4B.1** Create `surveys.service.js`
- [ ] **4B.2** Create simple survey builder (question types: text, choice, rating)
- [ ] **4B.3** Create `WorkshopFollowup.jsx` - post-workshop validation form
- [ ] **4B.4** Implement "Share with attendees" functionality
- [ ] **4B.5** Create survey response capture
- [ ] **4B.6** Allow adding requirements from survey responses

**Mini-checkpoint 4B:**
```
□ Can create post-workshop surveys
□ Can send to attendees (email placeholder)
□ Can capture responses
□ Requirements from surveys linked correctly
```

#### Session 4C: Document Upload

- [ ] **4C.1** Create `evaluationDocuments.service.js`
- [ ] **4C.2** Implement file upload to Supabase Storage
- [ ] **4C.3** Create document list view
- [ ] **4C.4** Create document viewer/preview
- [ ] **4C.5** Placeholder for AI parsing (implemented in Phase 8)

#### Checkpoint: PHASE-4-COMPLETE

```
□ Workshop management complete
□ Live capture mode functional
□ Post-workshop follow-up surveys work
□ Document upload works
□ All inputs link to requirements with provenance
```

**🛑 STOP HERE** - Report completion, demonstrate input capture, ask to proceed to Phase 5

---

### Phase 5: Vendor Management

**Objective:** Vendor pipeline and basic portal

**Estimated Effort:** 2 sessions

#### Session 5A: Vendor CRUD & Pipeline

- [ ] **5A.1** Create `vendors.service.js`
- [ ] **5A.2** Create `VendorsHub.jsx` page
- [ ] **5A.3** Create `VendorPipeline.jsx` - Kanban-style status view
- [ ] **5A.4** Create `VendorCard.jsx` component
- [ ] **5A.5** Implement vendor CRUD
- [ ] **5A.6** Implement status transitions with history
- [ ] **5A.7** Create `VendorDetail.jsx` page
- [ ] **5A.8** Implement vendor contacts management

**Mini-checkpoint 5A:**
```
□ Can create/edit/delete vendors
□ Pipeline view shows vendors by status
□ Can move vendors through pipeline
□ Vendor detail page works
```

#### Session 5B: Questions & Portal Setup

- [ ] **5B.1** Create `vendorQuestions.service.js`
- [ ] **5B.2** Create question management UI
- [ ] **5B.3** Link questions to requirements/criteria
- [ ] **5B.4** Implement portal access code generation
- [ ] **5B.5** Create `api/evaluator/vendor-portal-auth.js`
- [ ] **5B.6** Create basic `VendorPortal.jsx` page (shell)
- [ ] **5B.7** Create `VendorResponseForm.jsx` component

#### Checkpoint: PHASE-5-COMPLETE

```
□ Vendor pipeline management works
□ Can manage vendor questions
□ Portal access codes generated
□ Basic vendor portal authenticates
□ Vendors can view questions (responses in Phase 6)
```

**🛑 STOP HERE** - Report completion, demonstrate vendor management, ask to proceed to Phase 6

---

### Phase 6: Evaluation & Scoring

**Objective:** Scoring interface, evidence management, reconciliation

**Estimated Effort:** 2-3 sessions

#### Session 6A: Evidence Management

- [ ] **6A.1** Create `evidence.service.js`
- [ ] **6A.2** Create evidence capture UI (demo notes, reference checks)
- [ ] **6A.3** Link evidence to vendors
- [ ] **6A.4** Link evidence to requirements/criteria
- [ ] **6A.5** Create evidence list view on vendor detail page

**Mini-checkpoint 6A:**
```
□ Can add evidence for vendors
□ Evidence linked to requirements/criteria
□ Evidence displays on vendor detail
```

#### Session 6B: Scoring Interface

- [ ] **6B.1** Create `scores.service.js`
- [ ] **6B.2** Create `EvaluationHub.jsx` page
- [ ] **6B.3** Create `ScoringInterface.jsx` component
- [ ] **6B.4** Implement score entry with rationale
- [ ] **6B.5** Link evidence to scores
- [ ] **6B.6** Create `ScoreCard.jsx` component
- [ ] **6B.7** Show vendor response and evidence when scoring

**Mini-checkpoint 6B:**
```
□ Can score vendors against criteria
□ Scores require rationale
□ Can link evidence to scores
□ Shows relevant context when scoring
```

#### Session 6C: Vendor Responses & Reconciliation

- [ ] **6C.1** Complete vendor portal response submission
- [ ] **6C.2** Create vendor document upload in portal
- [ ] **6C.3** Create `ReconciliationPanel.jsx` component
- [ ] **6C.4** Show multiple evaluator scores side-by-side
- [ ] **6C.5** Implement consensus score entry
- [ ] **6C.6** Calculate weighted totals

#### Checkpoint: PHASE-6-COMPLETE

```
□ Vendors can submit responses via portal
□ Vendors can upload documents
□ Evaluators can score with evidence
□ Reconciliation shows evaluator variance
□ Consensus scores can be entered
□ Weighted totals calculate correctly
```

**🛑 STOP HERE** - Report completion, demonstrate full evaluation flow, ask to proceed to Phase 7

---


### Phase 7: Traceability & Reports

**Objective:** Traceability matrix, client dashboard, report generation

**Estimated Effort:** 2 sessions

#### Session 7A: Traceability Matrix

- [ ] **7A.1** Create `traceability.service.js` with complex queries
- [ ] **7A.2** Create `TraceabilityView.jsx` page
- [ ] **7A.3** Create `TraceabilityMatrix.jsx` component
- [ ] **7A.4** Implement matrix: requirements (rows) × vendors (columns)
- [ ] **7A.5** Show scores in cells with visual indicators
- [ ] **7A.6** Create `TraceabilityDrilldown.jsx` modal
- [ ] **7A.7** Show full chain: requirement → evidence → score → rationale
- [ ] **7A.8** Add grouping by category

**Mini-checkpoint 7A:**
```
□ Matrix displays all requirements vs vendors
□ Scores visible with RAG styling
□ Can drill down to see full traceability
□ Grouping by category works
```

#### Session 7B: Client Dashboard & Reports

- [ ] **7B.1** Create `ClientPortal.jsx` page
- [ ] **7B.2** Create client authentication flow (access code based)
- [ ] **7B.3** Create `ClientDashboard.jsx` component
- [ ] **7B.4** Show progress summary
- [ ] **7B.5** Show requirements summary (contributed, approved)
- [ ] **7B.6** Show vendor comparison (if allowed)
- [ ] **7B.7** Create `ReportsHub.jsx` page
- [ ] **7B.8** Create `api/evaluator/generate-report.js`
- [ ] **7B.9** Implement PDF export of evaluation report
- [ ] **7B.10** Implement CSV export of requirements/scores

#### Checkpoint: PHASE-7-COMPLETE

```
□ Traceability matrix fully functional
□ Drill-down shows complete chain
□ Client portal authenticates and shows dashboard
□ Progress visible to clients
□ PDF report generates
□ CSV exports work
```

**🛑 STOP HERE** - Report completion, demonstrate traceability and reports, ask to proceed to Phase 8

---

### Phase 8: AI Features

**Objective:** AI-powered analysis and suggestions

**Estimated Effort:** 2 sessions

#### Session 8A: Document Parsing & Gap Analysis

- [ ] **8A.1** Create `api/evaluator/ai-document-parse.js`
- [ ] **8A.2** Implement document parsing for requirements extraction
- [ ] **8A.3** Create UI for reviewing parsed requirements
- [ ] **8A.4** Allow importing parsed requirements
- [ ] **8A.5** Create `api/evaluator/ai-gap-analysis.js`
- [ ] **8A.6** Create `GapAnalysisResults.jsx` component
- [ ] **8A.7** Show suggested requirements from gap analysis
- [ ] **8A.8** Allow adding AI suggestions to requirements

**Mini-checkpoint 8A:**
```
□ Can upload document and extract requirements
□ Review and import flow works
□ Gap analysis identifies missing areas
□ Can add suggestions to requirements
```

#### Session 8B: Market Research & AI Assistant

- [ ] **8B.1** Create `api/evaluator/ai-market-research.js`
- [ ] **8B.2** Create `MarketResearchResults.jsx` component
- [ ] **8B.3** Allow adding researched vendors to long list
- [ ] **8B.4** Create `api/evaluator/ai-requirement-suggest.js`
- [ ] **8B.5** Implement requirement language improvement
- [ ] **8B.6** Create `AIAssistantPanel.jsx` sidebar
- [ ] **8B.7** Integrate AI functions into main UI

#### Checkpoint: PHASE-8-COMPLETE

```
□ Document parsing extracts requirements
□ Gap analysis suggests missing requirements
□ Market research returns vendor information
□ AI assistant panel accessible
□ All AI tasks logged to ai_tasks table
```

**🛑 STOP HERE** - Report completion, demonstrate AI features, ask to proceed to Phase 9

---

### Phase 9: Portal Refinement

**Objective:** Polish client and vendor portals

**Estimated Effort:** 1-2 sessions

#### Tasks

- [ ] **9.1** Refine client portal branding (use evaluation project branding)
- [ ] **9.2** Add client requirement approval workflow
- [ ] **9.3** Add client comments/feedback on requirements
- [ ] **9.4** Improve vendor portal UX
- [ ] **9.5** Add vendor response progress tracking
- [ ] **9.6** Add vendor document categorization
- [ ] **9.7** Email notification placeholders (for portal access)
- [ ] **9.8** Session timeout handling for portals
- [ ] **9.9** Mobile responsiveness for portals

#### Checkpoint: PHASE-9-COMPLETE

```
□ Client portal fully branded
□ Client can approve/comment on requirements
□ Vendor portal polished and functional
□ Progress tracking works
□ Portals work on mobile
```

**🛑 STOP HERE** - Report completion, demonstrate polished portals, ask to proceed to Phase 10

---

### Phase 10: Testing & Polish

**Objective:** Full testing, bug fixes, documentation

**Estimated Effort:** 2-3 sessions

#### Session 10A: E2E Tests

- [ ] **10A.1** Create `e2e/evaluator/` directory
- [ ] **10A.2** Create `evaluator-admin.spec.js` - full admin workflow
- [ ] **10A.3** Create `evaluator-evaluator.spec.js` - evaluator workflow
- [ ] **10A.4** Create `evaluator-client.spec.js` - client portal tests
- [ ] **10A.5** Create `evaluator-vendor-portal.spec.js` - vendor portal tests
- [ ] **10A.6** Run all tests, fix failures

**Mini-checkpoint 10A:**
```
□ All E2E tests pass
□ No console errors during tests
```

#### Session 10B: Unit Tests & Bug Fixes

- [ ] **10B.1** Add unit tests for services
- [ ] **10B.2** Add unit tests for permission functions
- [ ] **10B.3** Add unit tests for calculations (weights, totals)
- [ ] **10B.4** Fix any bugs found during testing
- [ ] **10B.5** Performance review and optimization

#### Session 10C: Documentation & Handoff

- [ ] **10C.1** Update APPLICATION-CONTEXT.md with Evaluator section
- [ ] **10C.2** Create user documentation / help content
- [ ] **10C.3** Review and update EVALUATOR-TECHNICAL-ARCHITECTURE.md
- [ ] **10C.4** Final code review and cleanup
- [ ] **10C.5** Create release notes

#### Checkpoint: PHASE-10-COMPLETE (FINAL)

```
□ All tests passing
□ No known bugs
□ Documentation complete
□ Ready for production use
```

**🎉 IMPLEMENTATION COMPLETE**

---

## Part 5: Session Handoff Protocol

### Starting a New Session

When starting a new AI chat session for Evaluator development:

1. **Share Context Documents:**
   ```
   Please read these documents to understand the project:
   - docs/EVALUATOR-IMPLEMENTATION-PLAN.md (this document)
   - docs/APPLICATION-CONTEXT.md
   - docs/EVALUATOR-TECHNICAL-ARCHITECTURE.md
   ```

2. **State Current Position:**
   ```
   We are currently at [CHECKPOINT NAME].
   The last completed task was [TASK NUMBER].
   Please continue with [NEXT TASK].
   ```

3. **Provide Any Session-Specific Context:**
   ```
   In the last session, we encountered [ISSUE] and decided [DECISION].
   ```

### Ending a Session

Before ending an AI chat session:

1. **Update Progress Tracker** at top of this document
2. **Update Last Checkpoint Completed** section
3. **Note any decisions made** that affect future work
4. **Note any issues encountered** that need resolution
5. **Commit all changes** to git

### Example Session Start Prompt

```
I'm continuing work on the Evaluator tool for AMSF001 Project Tracker.

Please read these files to get context:
1. ~/Projects/amsf001-project-tracker/docs/EVALUATOR-IMPLEMENTATION-PLAN.md
2. ~/Projects/amsf001-project-tracker/docs/APPLICATION-CONTEXT.md

Current status: Phase 3 (Requirements Module), task 3B.3 complete.
Next task: 3B.4 - Implement delete requirement (soft delete)

Please continue implementation.
```

---

## Part 6: Decision Log

Track important decisions made during implementation.

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-01-01 | EvaluationProject parallel to Project | Clean separation, independent lifecycle | Separate context provider needed |
| 2026-01-01 | Vendor portal uses access codes not accounts | Lower barrier for vendor participation | Separate auth flow needed |
| | | | |

---

## Part 7: Issue Tracker

Track issues encountered and their resolution.

| ID | Issue | Status | Resolution |
|----|-------|--------|------------|
| | | | |

---

## Part 8: File Reference

Quick reference for key files created during implementation.

### Database Migrations
```
supabase/migrations/
├── [timestamp]_create_evaluation_projects.sql
├── [timestamp]_create_stakeholder_areas.sql
├── ... (filled in as created)
```

### Services
```
src/services/evaluator/
├── index.js
├── base.evaluator.service.js
├── evaluationProjects.service.js
├── requirements.service.js
├── ... (filled in as created)
```

### Contexts & Hooks
```
src/contexts/EvaluationContext.jsx
src/hooks/useEvaluatorPermissions.js
src/hooks/useEvaluationRole.js
```

### Pages
```
src/pages/evaluator/
├── EvaluatorDashboard.jsx
├── RequirementsHub.jsx
├── ... (filled in as created)
```

### Components
```
src/components/evaluator/
├── index.js
├── EvaluationSwitcher.jsx
├── requirements/
├── workshops/
├── ... (filled in as created)
```

### API Endpoints
```
api/evaluator/
├── vendor-portal-auth.js
├── ai-gap-analysis.js
├── ... (filled in as created)
```

---

*Document Version: 1.0*
*Created: 2026-01-01*
*Last Updated: 2026-01-01*

