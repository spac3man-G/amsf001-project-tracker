# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Security & Architecture Audit (January 2026)

**Status**: COMPLETE - All 6 Phases Finished

A comprehensive 6-phase security and architecture audit has been completed.

**Audit Plan:** `audit/SECURITY-AUDIT-PLAN.md`
**Findings Tracker:** `audit/FINDINGS-TRACKER.md`

### Progress Overview

| Phase | Focus | Status | Findings |
|-------|-------|--------|----------|
| 1 | Security Foundation | **COMPLETE** | 1 Critical, 2 High, 4 Medium |
| 2 | Data Security & Multi-Tenancy | **COMPLETE** | 0 Critical, 1 High, 3 Medium |
| 3 | Frontend Security | **COMPLETE** | 0 Critical, 1 High, 2 Medium |
| 4 | Architecture & Scalability | **COMPLETE** | 0 Critical, 1 High, 3 Medium |
| 5 | Technology & Integration | **COMPLETE** | 1 Critical, 0 High, 3 Medium |
| 6 | Code Quality | **COMPLETE** | 0 Critical, 1 High, 2 Medium |

**Final Totals:** 2 Critical, 6 High, 17 Medium, 14 Low (39 actionable findings)

### Critical/High Findings Summary

| ID | Finding | Phase | Status |
|----|---------|-------|--------|
| AUDIT-01-001 | Chat API Missing JWT Verification | 1 | Open |
| AUDIT-05-001 | React Router XSS Vulnerability | 5 | Open |
| AUDIT-01-002 | Rate Limiting Bypassable | 1 | Open |
| AUDIT-01-003 | Missing Security Headers | 1 | Open |
| AUDIT-02-001 | No Data Retention/Deletion Mechanism | 2 | Open |
| AUDIT-03-001 | XSS Vulnerability in Chat Components | 3 | Open |
| AUDIT-04-001 | Duplicate Base Service Classes | 4 | Open |
| AUDIT-06-001 | Unit Tests Failing After Role Changes | 6 | Open |

### Quick Wins (Immediate Actions)

1. `npm update react-router-dom` - Fix critical XSS vulnerability (~5 min)
2. Add security headers to `vercel.json` (~15 min)
3. Remove `src/pages/Dashboard.jsx.backup` (~1 min)
4. Fix unit test expectations for v3.0 roles (~2 hours)

### Remediation Roadmap

See `audit/SECURITY-AUDIT-REMEDIATION-ROADMAP.md` for the complete prioritized action plan:
- **Phase 0 (Critical):** 2 findings, 4-6 hours, immediate
- **Phase 1 (High):** 6 findings, 15-20 hours, Week 1-2
- **Phase 2 (Medium):** 17 findings, 40-50 hours, Week 3-6
- **Phase 3 (Low):** 14 findings, 30-40 hours, Week 7-12

### Compliance Frameworks

- **GDPR** (mandatory - Channel Islands jurisdiction)
- **SOC 2 Type II** (recommended for enterprise SaaS)
- **ISO 27001** (recommended)

---

## NEW FEATURE: Component-Based Commit & Plan Templates (17 January 2026)

**Status**: COMPLETE

### Component-Based Commit

Fixed bug where "Commit to Tracker" committed ALL components instead of just the selected one.

**New Behavior:**
- Commit dropdown with "Commit All Components" and "Select Components..." options
- CommitComponentsModal for selecting specific components to commit
- Per-component breakdown in commit summary (`byComponent` field)

**Key Changes:**
- `planCommitService.commitPlan()` now accepts optional `componentIds` parameter
- Added `getDescendantIds(items, componentIds)` helper method
- Updated `getCommitSummary()` to include per-component statistics

**Files:**
- `src/services/planCommitService.js` - Added component filtering
- `src/hooks/usePlanningIntegration.js` - Added component selection state
- `src/pages/planning/PlanningIntegrationUI.jsx` - Added CommitComponentsModal

### Plan Templates

New feature allowing Supplier PMs to save components as reusable templates and import them into any project within the same organisation.

**Database:**
- New `plan_templates` table (organisation-scoped)
- JSONB structure with nested children and `duration_days` (dates calculated on import)
- Migration: `supabase/migrations/202601170005_create_plan_templates.sql`

**Service Methods:**
- `planTemplatesService.saveComponentAsTemplate()` - Export component to template
- `planTemplatesService.importTemplate()` - Import template into project
- `planTemplatesService.getAllByOrganisation()` - List org templates
- `planTemplatesService.update()` / `delete()` - Manage templates

**UI Components:**
- `SaveAsTemplateModal` - Save component as template (via save icon on component rows)
- `ImportTemplateModal` - Import template with start date picker
- `TemplateManageModal` - View, edit, delete organisation templates
- Templates dropdown in Planning toolbar

**Files:**
- `src/services/planTemplates.service.js` - Template CRUD service
- `src/components/planning/SaveAsTemplateModal.jsx`
- `src/components/planning/ImportTemplateModal.jsx`
- `src/components/planning/TemplateManageModal.jsx`
- `src/components/planning/PlanTemplates.css`

---

## AI Enablement Initiative (17 January 2026)

**Status**: COMPLETE - All Phases Implemented

### Overview

Transforming the application from "AI-assisted query" to "AI-enabled execution". The AI now provides intelligent suggestions that users can choose to apply.

**Key Principle:** AI advises, human decides. All AI actions require explicit user confirmation before execution.

### Completed Features

#### 1. AI Action Framework (v4.0) - NEW (17 January 2026)
- Chat assistant can now **execute actions** via natural language commands
- 13 action tools: submit, update, complete, reassign
- Confirmation workflow: AI shows preview, user confirms, then executes
- Permission enforcement: Server-side validation of user role permissions
- Available actions:
  - Submit timesheets/expenses (single or bulk)
  - Update milestone status/progress
  - Update deliverable status
  - Complete/update/reassign tasks
  - Update/resolve RAID items, assign owners

**Files:**
- `api/chat.js` (v4.0) - Action tool integration
- `api/lib/ai-actions.js` - Action execution handlers
- `api/lib/ai-action-schemas.js` - Action tool definitions

**Usage Examples:**
```
User: "Submit my timesheets for this week"
AI: "I found 3 timesheets totaling 24 hours. Submit for approval?"
User: "Yes"
AI: "Done! 3 timesheets submitted."

User: "Mark milestone Requirements Complete as done"
AI: "Change 'Requirements Complete' from In Progress to Completed?"
User: "Confirm"
AI: "Milestone updated to Completed."
```

#### 2. Chat Assistant Upgrade (v3.5)
- Upgraded complex query handling from Sonnet 4.5 to **Opus 4.5**
- Simple queries still use Haiku 4.5 for speed
- Better reasoning and more accurate tool use for complex questions

**File:** `api/chat.js`

#### 3. RAID Auto-Categorization
- AI analyzes RAID item text and suggests category, severity, probability
- Integrated into RaidAddForm with "AI Suggest Category" button
- User must click "Apply Suggestion" to use the recommendation

**Endpoint:** `POST /api/ai-raid-categorize`

**Files:**
- `api/ai-raid-categorize.js` - Endpoint (uses Sonnet 4.5)
- `src/components/raid/RaidAddForm.jsx` - UI integration
- `src/components/raid/RaidAddForm.css` - AI suggestion styles

#### 4. Approval Assistant (Dashboard Widget)
- Analyzes pending approval queue and provides recommendations
- Identifies anomalies, flags items needing review, suggests batch approvals
- Only shown to users with approval permissions
- User must manually approve each item

**Endpoint:** `POST /api/ai-approval-assist`

**Files:**
- `api/ai-approval-assist.js` - Endpoint (uses Opus 4.5)
- `src/components/dashboard/ApprovalAssistantWidget.jsx` - Dashboard widget
- `src/components/dashboard/ApprovalAssistantWidget.css` - Widget styles

#### 5. Anomaly Detection (Dashboard Widget)
- Proactively analyzes project data for anomalies and issues
- Displays on dashboard after page load - no user action required to trigger
- Shows severity-sorted alerts with suggested actions
- Users can dismiss alerts or click to navigate to affected items

**Endpoint:** `POST /api/ai-anomaly-detect`

**Files:**
- `api/ai-anomaly-detect.js` - Endpoint (uses Opus 4.5)
- `src/components/dashboard/AnomalyAlertsWidget.jsx` - Dashboard widget
- `src/components/dashboard/AnomalyAlertsWidget.css` - Widget styles

#### 6. Deliverable Quality Assessment
- Analyzes deliverable readiness before sign-off
- Evaluates task completion, KPI linkages, quality standards, timeline
- Shows on DeliverableSidePanel for submitted/review-complete items
- Provides readiness score (0-100) and actionable recommendations

**Endpoint:** `POST /api/ai-deliverable-assess`

**Files:**
- `api/ai-deliverable-assess.js` - Endpoint (uses Opus 4.5)
- `src/components/deliverables/QualityAssessmentPanel.jsx` - Assessment panel
- `src/components/deliverables/QualityAssessmentPanel.css` - Panel styles

#### 7. Variation Impact Analyzer
- Analyzes impact of proposed variations (change requests)
- Evaluates timeline, budget, scope impacts and downstream dependencies
- Shows on VariationDetail page for submitted/pending variations
- Provides risk assessment and approval recommendation

**Endpoint:** `POST /api/ai-variation-impact`

**Files:**
- `api/ai-variation-impact.js` - Endpoint (uses Opus 4.5)
- `src/components/variations/VariationImpactPanel.jsx` - Impact panel
- `src/components/variations/VariationImpactPanel.css` - Panel styles

#### 8. Project Forecasting (Dashboard Panel)
- Predicts project completion date with confidence intervals
- Forecasts budget (expected final cost) with burn rate assessment
- Shows health score (0-100) with traffic light indicators
- Provides key insights and actionable recommendations
- Displays on dashboard, auto-refreshes with other widgets

**Endpoint:** `POST /api/ai-forecast`

**Files:**
- `api/ai-forecast.js` - Endpoint (uses Opus 4.5)
- `src/components/dashboard/ProjectForecastPanel.jsx` - Dashboard panel
- `src/components/dashboard/ProjectForecastPanel.css` - Panel styles

#### 9. Schedule Risk Predictor
- Identifies milestones at risk of slipping before they slip
- Analyzes progress gaps, activity patterns, blockers, dependencies
- Returns risk level (low/medium/high/critical) with predicted delay
- Provides specific mitigation actions with estimated days recoverable
- Integrated into ProjectForecastPanel on dashboard

**Endpoint:** `POST /api/ai-schedule-risk`

**Files:**
- `api/ai-schedule-risk.js` - Endpoint (uses Opus 4.5)

### AI Model Routing

| Endpoint | Model | Rationale |
|----------|-------|-----------|
| Chat (simple queries) | Haiku 4.5 | Fast, cost-effective |
| Chat (complex analysis) | Opus 4.5 | Better reasoning |
| RAID Categorization | Sonnet 4.5 | Straightforward classification |
| Approval Assistant | Opus 4.5 | Risk assessment quality |
| Anomaly Detection | Opus 4.5 | Pattern recognition |
| Deliverable Assessment | Opus 4.5 | Nuanced evaluation |
| Variation Impact | Opus 4.5 | Complex dependency analysis |
| Project Forecasting | Opus 4.5 | Statistical reasoning, trend analysis |
| Schedule Risk | Opus 4.5 | Multi-factor risk calculation |
| Document Generation | Opus 4.5 | High-quality writing, formatting |
| Portfolio Insights | Opus 4.5 | Strategic analysis, pattern synthesis |

#### 10. Document Generation
- Generates formatted project documents from structured data
- Supports: Status Reports, Project Summaries, Milestone Reports, RAID Summaries, Handover Documents
- Produces Markdown-formatted content with sections, highlights, concerns, and next steps
- Returns RAG status indicators and actionable recommendations

**Endpoint:** `POST /api/ai-document-generate`

**Request Parameters:**
- `projectId` (required) - Project UUID
- `documentType` (required) - One of: `status_report`, `project_summary`, `milestone_report`, `raid_summary`, `handover_document`
- `options` (optional) - `{ reportingPeriod, includeFinancials, tone, audienceLevel }`

**File:** `api/ai-document-generate.js` - Endpoint (uses Opus 4.5)

#### 11. Portfolio Insights
- Cross-project analysis for organisation-level intelligence
- Analyzes: Resource utilization, risk patterns, budget trends, team performance
- Identifies projects needing attention with urgency levels
- Provides strategic recommendations with priority and impact

**Endpoint:** `POST /api/ai-portfolio-insights`

**Request Parameters:**
- `organisationId` (required) - Organisation UUID
- `options` (optional) - `{ focusAreas, timeHorizon }`

**File:** `api/ai-portfolio-insights.js` - Endpoint (uses Opus 4.5)

**UI Component:** Organisation Admin > Insights tab
- `src/components/admin/PortfolioInsightsPanel.jsx` - Dashboard panel
- `src/components/admin/PortfolioInsightsPanel.css` - Panel styles

### AI Document Generator UI

Located in Reports page, allows users to generate AI-powered documents:
- Status Reports, Project Summaries, Milestone Reports, RAID Summaries, Handover Documents
- Copy to clipboard or download as Markdown
- Displays executive summary, highlights, concerns, and next steps

**Files:**
- `src/components/reports/AIDocumentGenerator.jsx` - Generator panel
- `src/components/reports/AIDocumentGenerator.css` - Panel styles

### All AI Endpoints Summary

| Endpoint | Phase | Purpose |
|----------|-------|---------|
| `/api/chat` | - | Chat assistant (Haiku/Opus 4.5) |
| `/api/ai-raid-categorize` | Quick Win | RAID auto-categorization |
| `/api/ai-approval-assist` | Quick Win | Approval recommendations |
| `/api/ai-anomaly-detect` | Phase 2 | Proactive anomaly detection |
| `/api/ai-deliverable-assess` | Phase 3 | Deliverable quality assessment |
| `/api/ai-variation-impact` | Phase 3 | Variation impact analysis |
| `/api/ai-document-generate` | Phase 3 | Document generation |
| `/api/ai-forecast` | Phase 4 | Project forecasting |
| `/api/ai-schedule-risk` | Phase 4 | Schedule risk prediction |
| `/api/ai-portfolio-insights` | Phase 4 | Portfolio-level insights |

See plan file: `/Users/glennnickols/.claude/plans/valiant-weaving-hedgehog.md`

---

## RECENTLY FIXED: Planner Edit Blocking & Component Filters (15 January 2026)

### Planner Edit Blocking Bug (Critical)

Fixed a critical bug where committed-but-not-baselined items in Planner were incorrectly blocked from editing.

**Previous (Bug):** All committed items showed "This item is managed in Tracker. Changes must be made there."

**Correct Behavior (Per TECH-SPEC-08 Section 15.1.2):**
| Item State | Editable | Structural Changes |
|------------|----------|-------------------|
| Uncommitted | All fields | Allowed |
| Committed (not baselined) | All fields | Allowed |
| Baselined | name, description, status, progress only | Blocked |

**Fix:** Added `getEditBlockStatus(item, field)` helper function to Planning.jsx that checks both `is_published` AND `_baselineLocked` flags.

**Commits:**
- `c7afd5cf` - fix: Allow editing committed-but-not-baselined items in Planner

**Files updated:**
- `src/pages/planning/Planning.jsx` - Added helper function, updated 5 functions

### Component Filter Feature

Added component-based filtering across three pages:
- **Task View** - Component dropdown above milestone chips
- **Milestones** - Component dropdown in filter bar
- **Deliverables** - Component dropdown as first filter

**New service methods:**
- `planItemsService.getComponents(projectId)` - Returns component items
- `planItemsService.getMilestoneComponentMap(projectId)` - Maps milestones to components

---

## RECENTLY FIXED: Permission System (15 January 2026)

Fixed two issues related to the v3.0 role simplification:

1. **View As dropdown** was showing "Admin (You)" instead of "Supplier PM (You)"
2. **RAID Log** edit button wasn't appearing for Supplier PM users

**Root cause:** Permission hooks were using `useAuth().role` (global profile role) instead of `useViewAs().effectiveRole` (project-scoped role).

**Commits:**
- `880c0720` - fix: Resolve role resolution issues in permission hooks and View As display

**Files updated:**
- `src/contexts/ViewAsContext.jsx` (v4.0)
- `src/hooks/useRaidPermissions.js` (v2.0)
- `src/hooks/useTimesheetPermissions.js` (v2.0)
- `src/hooks/useExpensePermissions.js` (v2.0)
- `src/hooks/useMilestonePermissions.js` (v2.0)
- `src/hooks/useNetworkStandardPermissions.js` (v2.0)
- `src/hooks/usePermissions.js`

---

## NEW FEATURE: Baseline Breach Detection (16 January 2026)

**Status**: COMPLETE

### Overview

When a deliverable's date exceeds the baselined milestone end date, the milestone is automatically flagged as "at risk" (baseline breach). This visual indicator persists across the application until resolved.

### Database Changes

Added to `milestones` table (see TECH-SPEC-02):
- `baseline_breached` - BOOLEAN indicating milestone is at risk
- `baseline_breach_reason` - TEXT explaining which deliverable caused breach
- `baseline_breached_at` - TIMESTAMPTZ when breach was first detected
- `baseline_breached_by` - UUID of user who caused the breach

Migration: `supabase/migrations/202601160002_add_baseline_breach_fields.sql`

### Service Methods (milestones.service.js)

| Method | Purpose |
|--------|---------|
| `setBaselineBreach(milestoneId, breached, options)` | Set/clear breach flag with reason |
| `checkAndClearBreach(milestoneId)` | Auto-clear if no deliverables exceed date |
| `checkDeliverableDateBreach(milestoneId, proposedDate)` | Pre-check if a date would cause breach |

### Breach Resolution

A breached milestone can be resolved by:
1. **Adjusting deliverable dates** - Move dates back within milestone range
2. **Signing a Variation** - Formally extend the milestone end date

### UI Components

- **DeliverableSidePanel** - MS Planner-style slide-out panel for inline editing
- **InlineEditField** - Click-to-edit field component
- **InlineChecklist** - Always-editable task checklist

See TECH-SPEC-07 Section 16 for component documentation.

### Commits

- `bdd28cd7` - feat: Add deliverable date management and baseline breach detection

---

## COMPLETE: Workflow Settings System (17 January 2026)

**Status**: COMPLETE (WP-01 through WP-10)

### Overview

Per-project workflow customization enabling different approval authorities, feature toggles, and workflow templates.

### Key Features

1. **Approval Authority Settings** - Configure who can approve baselines, variations, certificates, deliverables, timesheets, and expenses
2. **Feature Toggles** - Enable/disable RAID, Variations, KPIs, Quality Standards, etc.
3. **Workflow Templates** - 5 system templates for quick project setup:
   - Formal Fixed-Price, Time & Materials, Internal Project, Agile/Iterative, Regulated Industry
4. **Settings UI** - MS Planner-style collapsible sections with auto-save

### Technical Details

| Component | Location |
|-----------|----------|
| Database columns | 24 new columns on `projects` table |
| Templates table | `project_templates` |
| Service | `src/services/projectSettings.service.js` |
| Hook | `src/hooks/useProjectSettings.js` |
| Settings UI | `src/components/settings/WorkflowSettingsTab.jsx` |

### Approval Authority Options

| Value | Description |
|-------|-------------|
| `supplier_only` | Only supplier PM can approve |
| `customer_only` | Only customer PM can approve |
| `dual` | Both supplier and customer must sign |
| `conditional` | Depends on context (e.g., chargeable vs non-chargeable expenses) |
| `none` | No approval required |

### Using Workflow Settings in Code

```javascript
// Check if feature is enabled
import { useWorkflowFeatures } from '../hooks/useProjectSettings';
const { timesheetsEnabled, raidEnabled } = useWorkflowFeatures();

// Check approval authority
import { usePermissions } from '../hooks/usePermissions';
const { canApproveEntity } = usePermissions();
const canApprove = canApproveEntity('timesheets', timesheet);
```

### Documentation

- **TECH-SPEC-02** Section 5.4: Workflow settings columns
- **TECH-SPEC-02** Section 5A: Project templates table
- **TECH-SPEC-07** Section 17: Workflow settings hooks and components
- **TECH-SPEC-08** Section 18: Project settings service

---

## IN PROGRESS: Member Project Assignments Feature (13 January 2026)

**Status**: BLOCKED - Database function error, needs debugging

### What We're Building

Adding the ability for org admins to manage member project assignments from the Organisation > Members tab:
1. **Expandable member rows** - Click chevron to see project assignments
2. **Project assignment management** - Add/remove members from projects, change roles
3. **Resend invitation button** - Send new invitation email to existing members

### What's Been Done

**Frontend (committed and deployed):**
- `src/pages/admin/OrganisationAdmin.jsx` - Updated MembersTab with:
  - Expandable rows (chevron button)
  - Projects column showing "X of Y" count
  - Project assignments panel in expanded row
  - Role dropdown and Add/Remove buttons
  - Resend invite button (mail icon)
- `src/services/organisation.service.js` - Added methods:
  - `getMemberProjectAssignments()` - calls RPC function
  - `addMemberToProject()` - calls RPC function
  - `removeMemberFromProject()` - calls RPC function
  - `changeMemberProjectRole()` - calls RPC function
- `src/services/invitation.service.js` - Added `reinviteExistingMember()` method

**Database migrations (pushed via `supabase db push`):**
- `supabase/migrations/202601130001_add_org_admin_user_projects_function.sql`
- `supabase/migrations/202601130002_fix_org_admin_role_check.sql`

These create SECURITY DEFINER functions to bypass RLS:
- `get_user_project_assignments_for_org(org_id, user_id)`
- `add_user_to_project_as_org_admin(user_id, project_id, role)`
- `remove_user_from_project_as_org_admin(user_id, project_id)`
- `change_user_project_role_as_org_admin(user_id, project_id, new_role)`

### Current Error

"Failed to load project assignments" when clicking the expand chevron on any member row.

### Suspected Issues (To Debug)

1. **Database function may not exist or have errors**
   - The migrations were pushed but the RPC call is failing
   - Need to verify functions exist: Check Supabase Dashboard > Database > Functions
   - Test the function directly in SQL Editor:
     ```sql
     SELECT * FROM get_user_project_assignments_for_org(
       'YOUR_ORG_ID'::uuid,
       'YOUR_USER_ID'::uuid
     );
     ```

2. **Role mismatch**
   - Function checks for `org_role IN ('org_owner', 'org_admin', 'supplier_pm')`
   - Need to verify what role the current user actually has in `user_organisations`
   - Check: `SELECT org_role FROM user_organisations WHERE user_id = 'YOUR_USER_ID'`

3. **Browser/Vercel caching**
   - User tested on both `tracker.progressive.gg` and `amsf001-project-tracker.vercel.app`
   - Try hard refresh (Cmd+Shift+R) or incognito mode

4. **Environment mismatch**
   - Verify both URLs point to the same Supabase instance
   - Check `.env` files for `VITE_SUPABASE_URL`

### Files to Review

| File | Purpose |
|------|---------|
| `src/pages/admin/OrganisationAdmin.jsx` | MembersTab component (lines 444-1200) |
| `src/services/organisation.service.js` | Service methods (lines 700-812) |
| `supabase/migrations/202601130001_*.sql` | Original DB functions |
| `supabase/migrations/202601130002_*.sql` | Fix for org_owner role |

### How to Debug

1. Open browser DevTools > Network tab
2. Expand a member row
3. Look for the RPC call to `get_user_project_assignments_for_org`
4. Check the response body for the actual error message

Or check Supabase Dashboard > Logs for database errors.

### Git Commits for This Feature

```
ef949568 fix: Include org_owner role in admin checks for backwards compatibility
50e2756f fix: Add SECURITY DEFINER functions for org admin project management
98f6fb3b fix: Use correct column name 'reference' for project code
49b68fa8 fix: Add expandable rows to MembersTab in OrganisationAdmin
e26da7ee feat: Add expandable member rows with project assignments and resend invite
```

---

## Evaluator Module UAT Testing

**Status**: Ready for UAT Round 2

When the user wants to run UAT testing on the Evaluator module, use these documents:

| Document | Purpose |
|----------|---------|
| `docs/EVALUATOR-USER-MANUAL.md` | User manual with 32 UAT checkpoints (EV-001 to EV-032) |
| `docs/EVALUATOR-UAT-FINDINGS.md` | Bug status, feature status, and UAT Round 2 test plan |

**At session start, if user mentions Evaluator UAT:**
> "Ready for Evaluator UAT testing. The test documents are:
> - `docs/EVALUATOR-USER-MANUAL.md` - 32 checkpoints across 7 phases
> - `docs/EVALUATOR-UAT-FINDINGS.md` - Current bug/feature status
>
> Would you like to run specific checkpoints, or do a full end-to-end test?"

---

## Project Overview

**Tracker by Progressive** is an enterprise-grade, multi-tenant SaaS application for project portfolio management. It includes:

- **Project Management**: Milestones, deliverables, tasks with sign-off workflows
- **Financial Operations**: Timesheets, expenses, partner invoices
- **Planning & Estimation**: WBS planning tool, SFIA 8-based cost estimator
- **Quality & Compliance**: KPIs, RAID logs, variations (change control)
- **Evaluator Module**: IT vendor procurement and evaluation platform
- **AI Features**: Chat assistant, receipt OCR, planning AI

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Recharts
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **AI**: Anthropic Claude (Opus 4.5 for Evaluator, Sonnet 4 for chat, Haiku for simple tasks) via Vercel Edge Functions
- **Hosting**: Vercel
- **Testing**: Vitest (unit), Playwright (E2E with 7 role-based profiles)

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build (localhost:4173)

# Unit Tests (Vitest)
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run with coverage report
npm run test:ui          # Open Vitest UI

# E2E Tests (Playwright)
npm run e2e              # Run all E2E tests
npm run e2e:ui           # Open Playwright UI
npm run e2e:headed       # Run with visible browser
npm run e2e:smoke        # Run smoke tests only

# Run E2E for specific role
npm run e2e:supplier-pm  # Has full admin capabilities
npm run e2e:customer-pm
npm run e2e:contributor
npm run e2e:viewer

# E2E against deployed environments
npm run e2e:staging
npm run e2e:production

# E2E data management
npm run e2e:seed         # Seed test data
npm run e2e:cleanup      # Clean up test data
npm run e2e:reset        # Cleanup + seed
```

## Architecture

### Provider Hierarchy (Critical Order)

The provider order in `src/App.jsx` is essential for proper context dependencies:

```
AuthProvider           → User authentication (no dependencies)
  OrganisationProvider → Fetches user's organisations (needs Auth)
    ProjectProvider    → Fetches projects filtered by org (needs Auth + Org)
      EvaluationProvider → Evaluator module context
        ViewAsProvider → Role impersonation (needs Auth + Project)
```

### Multi-Tenancy Model

Three-tier isolation: **Organisation → Project → Entity**

- All queries are project-scoped via `project_id`
- RLS policies enforce data isolation at database level
- Services extend `BaseService` which handles project scoping automatically

### Role System (v3.0 - January 2026)

**Organisation Roles** (from `user_organisations` table):
- `org_admin` - Emergency backup admin, full org access (doesn't do project work)
- `supplier_pm` - Full admin capabilities + active project participant
- `org_member` - Access assigned projects only (includes customers)

**Project Roles** (from `user_projects` table):
- `supplier_pm` - Supplier project manager with full admin capabilities
- `supplier_finance` - Supplier finance team
- `customer_pm` - Customer project manager
- `customer_finance` - Customer finance team
- `contributor` - Can log time/expenses, update deliverables
- `viewer` - Read-only access

> **Note:** The project-level `admin` role has been removed. `supplier_pm` now has full
> admin capabilities at both organisation and project levels.

Role checks use `usePermissions()` hook or `src/lib/permissions.js` directly.

### Key Directories

```
src/
├── contexts/        # 12 React contexts (Auth, Project, Organisation, etc.)
├── hooks/           # 21 custom hooks (usePermissions, useProjectRole, etc.)
├── services/        # 34+ service files extending BaseService
├── lib/             # Utilities (permissions.js, supabase.js, formatters.js)
├── components/      # UI components organized by feature
└── pages/           # Page components (lazy-loaded)

api/                 # Vercel Edge Functions
├── chat.js          # AI chat (streaming)
├── planning-ai.js   # WBS generation (Claude Opus 4)
├── scan-receipt.js  # Receipt OCR
└── evaluator/       # Evaluator module APIs

e2e/                 # Playwright E2E tests
├── auth.setup.js    # Authentication setup for all roles
├── helpers/         # Test utilities and user configs
└── workflows/       # Multi-step workflow tests

supabase/migrations/ # Database migrations (92 files)
```

### Service Pattern

Services extend `BaseService` for consistent CRUD operations:

```javascript
class PartnersService extends BaseService {
  constructor() {
    super('partners', { supportsSoftDelete: true });
  }
}
```

All queries automatically include `project_id` filtering and soft-delete handling.

### Permission Checks

```javascript
// In components - use hook
const { canEditDeliverable, can, isOrgLevelAdmin } = usePermissions();
if (can('deliverables', 'edit')) { ... }

// In services/utilities - use lib directly
import { hasPermission } from '../lib/permissions';
if (hasPermission(role, 'deliverables', 'edit')) { ... }
```

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

For API functions (Vercel):
```
ANTHROPIC_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Testing Notes

### E2E Test Users

Test users are defined in `e2e/helpers/test-users.js` with password `TestPass123!`:
- `e2e.supplier.pm@amsf001.test` (has full admin capabilities)
- `e2e.customer.pm@amsf001.test`
- `e2e.contributor@amsf001.test`
- `e2e.viewer@amsf001.test`

> **Note (v3.0):** The separate admin test user has been removed.
> `supplier_pm` now has all admin capabilities.

### Running Single Test File

```bash
# Vitest
npm test -- src/components/MyComponent.test.jsx

# Playwright
npx playwright test e2e/timesheets.spec.js --project=admin
```

## Code Conventions

- Use `date-fns` for date manipulation (already imported throughout)
- Use `lucide-react` for icons
- Services return promises; handle errors in components
- Soft delete is default (`is_deleted` flag); use `hardDelete()` for permanent removal
- All database tables have RLS policies; check `supabase/migrations/` for policy definitions
