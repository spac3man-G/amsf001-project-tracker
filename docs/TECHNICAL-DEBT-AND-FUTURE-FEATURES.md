# Technical Debt and Future Features

**Version:** 1.4  
**Created:** 2025-12-16  
**Last Updated:** 2025-12-29  
**Purpose:** Track technical debt items and planned future features for prioritisation

> **Version 1.5 Updates (30 December 2025):**
> - **ALL DEFERRED:** FF-016, FF-018, and FF-019 work deferred
> - Archived all implementation plans to `docs/archive/FF018-Option-B-Unified-Table/`
> - Key insight: Milestones and deliverables are the core architecture; planning tool is a visual layer
> - Architecture documentation retained as reference: `docs/MILESTONE-DELIVERABLE-ARCHITECTURE.md`
> - No database changes were made — all migration files archived before execution

> **Version 1.4 Updates (29 December 2025):**
> - Added FF-016: Deliverable Task Checklists
> - Added FF-017: Project Types and Workflow Configuration
> - Added FF-018: Unified Project Structure Model (MAJOR - supersedes FF-004/FF-005)
> - Added FF-019: Milestone Billing Types
> - Marked FF-004 and FF-005 as SUPERSEDED by FF-018
> - Created detailed implementation plan: `IMPLEMENTATION-PLAN-FF018-Unified-Project-Structure.md`

> **Version 1.3 Updates (29 December 2025):**
> - Added FF-004 to FF-015: Planning, Benchmarking, and Estimator feature roadmap
> - 12 new future feature items covering tool integration and enhancements

> **Version 1.2 Updates (28 December 2025):**
> - Completed TD-001: Entity Permission Hook Consolidation
> - Moved TD-001 to Completed Items section

> **Version 1.1 Updates (23 December 2025):**
> - Added completed item: Organisation-level multi-tenancy implementation
> - Added Document History section

> **Note:** Items TD-004 through TD-008 were added during E2E testing documentation consolidation.  
> See `TECH-SPEC-09-Testing-Infrastructure.md` for the consolidated testing reference.

---

## Technical Debt

Items that require refactoring or architectural improvements to maintain code quality and consistency.


### TD-002: Z-Index Scale Standardisation

**Priority:** Low  
**Added:** 2025-12-16  
**Context:** Project Switcher dropdown appearing behind page headers

#### Problem

The application uses inconsistent z-index values across components:

| Component | Current z-index | Purpose |
|-----------|-----------------|----------|
| Layout sidebar | 50 | Fixed sidebar navigation |
| Layout header | 40 | Top header bar |
| ProjectSwitcher dropdown | 1000 (was 100) | Project selection dropdown |
| Page sticky headers | 100 | Milestones, Timesheets, Expenses, etc. |
| Modals | 1000+ | Dialog overlays |

This was discovered when the Project Switcher dropdown was appearing behind page sticky headers because both used `z-index: 100`.

#### Current State (Tactical Fix Applied)

A tactical fix was applied on 2025-12-16:
- Increased `ProjectSwitcher.jsx` dropdown z-index from `100` to `1000`

This resolves the immediate issue but doesn't address the underlying inconsistency.

#### Strategic Solution

Establish a global z-index scale using CSS custom properties:

1. **Create a z-index scale** in a global CSS file or design tokens:
   ```css
   :root {
     /* Z-Index Scale */
     --z-dropdown: 1000;
     --z-modal-backdrop: 900;
     --z-modal: 950;
     --z-toast: 1100;
     --z-tooltip: 1050;
     --z-header-global: 50;
     --z-header-page: 30;
     --z-sidebar: 40;
     --z-sticky: 10;
   }
   ```

2. **Update Layout.jsx** to use CSS variables or consistent inline values

3. **Update all page CSS files** to use the scale:
   - `Milestones.css` - `.ms-header { z-index: var(--z-header-page); }`
   - `Timesheets.css` - `.ts-header { z-index: var(--z-header-page); }`
   - `Expenses.css` - `.exp-header { z-index: var(--z-header-page); }`
   - `Resources.css` - `.res-header { z-index: var(--z-header-page); }`
   - `QualityStandards.css`
   - `VariationDetail.css`
   - `TeamMembers.css`
   - And others...

4. **Update component dropdowns** to use `--z-dropdown`

5. **Document the scale** in the codebase for future reference

#### Benefits

- Clear, predictable stacking order
- Single source of truth for z-index values
- Easier debugging of overlay issues
- Prevents future z-index conflicts
- Follows CSS best practices

#### Files Affected

- Create: `src/styles/variables.css` or add to existing global CSS
- `src/components/Layout.jsx`
- `src/components/ProjectSwitcher.jsx`
- `src/components/ViewAsBar.jsx`
- `src/components/NotificationBell.jsx`
- All page CSS files with sticky headers (~10+ files)
- Modal components

#### Effort Estimate

Low-Medium (0.5-1 day) - Systematic but straightforward changes

---

## Future Features

Planned features that are not yet implemented.

### FF-001: Workflow Email Notifications

**Priority:** Medium  
**Added:** 2025-12-16  
**Requested By:** Workflow System Enhancement

#### Description
Send email notifications when workflow items require user action.

#### User Story
As a Project Manager, I want to receive email notifications when items require my action, so that I don't miss important approvals.

#### Acceptance Criteria
- Email sent when item enters user's action queue
- Email includes item summary and direct link
- Configurable notification preferences per user
- Daily digest option for low-priority items
- Immediate notification for urgent items (5+ days pending)

#### Dependencies
- Email service integration (e.g., Resend, SendGrid)
- User notification preferences table
- Background job processing

#### Effort Estimate
Medium (2-3 days)

---

### FF-002: Workflow Audit Trail

**Priority:** Low  
**Added:** 2025-12-16  
**Requested By:** Workflow System Enhancement

#### Description
Track and display history of all actions taken on workflow items.

#### User Story
As an Admin, I want to see the complete history of actions on workflow items, so that I can audit approval processes.

#### Acceptance Criteria
- Record timestamp, user, action for each workflow state change
- Display audit trail in item detail modal
- Filter audit log by date range, user, action type
- Export audit data for compliance

#### Dependencies
- Workflow audit log table
- UI for displaying audit trail

#### Effort Estimate
Low-Medium (1-2 days)

---

### FF-003: Workflow Delegation

**Priority:** Low  
**Added:** 2025-12-16  
**Requested By:** Workflow System Enhancement

#### Description
Allow users to delegate their workflow responsibilities to another user temporarily.

#### User Story
As a Customer PM, I want to delegate my approval responsibilities to a colleague when I'm on leave, so that approvals don't get blocked.

#### Acceptance Criteria
- Set delegation period (start/end date)
- Choose which workflow categories to delegate
- Delegated items appear in delegate's action queue
- Original user still has visibility
- Audit trail shows delegation

#### Dependencies
- Delegation configuration table
- Modification to role-based filtering logic

#### Effort Estimate
Medium (2-3 days)

---

### ~~FF-004: Planning Tool - Create Milestones/Deliverables from Plan Items~~ [SUPERSEDED]

**Status:** ⚠️ SUPERSEDED by FF-018 (Unified Project Structure Model)  
**Priority:** ~~High~~  
**Added:** 2025-12-29  
**Requested By:** Planning Tool Enhancement

> **Note:** This feature has been superseded by FF-018. In the unified model, there is no "creation" from plan items—instead, users change the `item_type` of an existing record from 'phase'/'task' to 'milestone'/'deliverable', which makes governance fields available. See `IMPLEMENTATION-PLAN-FF018-Unified-Project-Structure.md` for details.

#### Description
Allow users to create actual milestones and deliverables directly from plan items, converting the planning structure into trackable project entities.

#### User Story
As a Supplier PM, I want to convert my plan items into milestones and deliverables, so that I can move from planning into execution without re-entering data.

#### Acceptance Criteria
- Select one or more plan items to convert
- Choose conversion options (create milestone, deliverable, or both)
- Automatically populate milestone/deliverable fields from plan item data
- Maintain link between plan item and created entity
- Bulk conversion for entire plan or selected items
- Preview before conversion with field mapping display
- Handle parent-child relationships (milestone plan items create milestones, nested items create deliverables)

#### Dependencies
- Plan items table relationship to milestones/deliverables (partially exists)
- Transaction handling for bulk operations
- UI for conversion wizard/modal

#### Effort Estimate
Medium-High (2-3 days)

---

### ~~FF-005: Planning Tool - Bidirectional Sync with Milestones/Deliverables~~ [SUPERSEDED]

**Status:** ⚠️ SUPERSEDED by FF-018 (Unified Project Structure Model)  
**Priority:** ~~Medium~~  
**Added:** 2025-12-29  
**Requested By:** Planning Tool Enhancement

> **Note:** This feature has been superseded by FF-018. In the unified model, there is no sync needed—milestones, deliverables, and plan items are the same records displayed differently. Changes in any view are immediately visible in all other views. See `IMPLEMENTATION-PLAN-FF018-Unified-Project-Structure.md` for details.

#### Description
Enable two-way synchronisation between plan items and their linked milestones/deliverables, keeping both views consistent.

#### User Story
As a Supplier PM, I want changes to milestones/deliverables to reflect in my plan (and vice versa), so that I have a single source of truth for project structure.

#### Acceptance Criteria
- Changes to milestone dates sync to linked plan item
- Changes to plan item dates sync to linked milestone
- Status changes propagate bidirectionally
- Conflict detection when both sides changed
- User can choose sync direction (plan → entities, entities → plan, or bidirectional)
- Manual sync trigger option
- Auto-sync toggle in settings
- Audit trail of sync operations

#### Dependencies
- FF-004 (Create from Plan Items)
- Sync conflict resolution UI
- Database triggers or application-level sync logic

#### Effort Estimate
High (3-5 days)

---

### FF-006: Planning Tool - Version History and Revert

**Priority:** Medium  
**Added:** 2025-12-29  
**Requested By:** Planning Tool Enhancement

#### Description
Maintain version history of the project plan with ability to view previous versions and revert changes.

#### User Story
As a Supplier PM, I want to see how my plan has evolved and revert to a previous version if needed, so that I can recover from planning mistakes or compare approaches.

#### Acceptance Criteria
- Automatic version capture on significant changes
- Manual "save version" with user-provided description
- Version list with timestamps and descriptions
- Side-by-side comparison between versions
- View-only mode for historical versions
- Revert to specific version (creates new version, doesn't delete history)
- Export version as snapshot

#### Dependencies
- Plan version history table
- Diff calculation logic
- Version comparison UI

#### Effort Estimate
Medium-High (2-4 days)

---

### FF-007: Planning Tool - Gantt Chart Visualisation

**Priority:** Medium  
**Added:** 2025-12-29  
**Requested By:** Planning Tool Enhancement

#### Description
Add Gantt chart view to the Planning tool for visual timeline representation of the project plan.

#### User Story
As a Supplier PM, I want to see my plan as a Gantt chart, so that I can visualise dependencies, timeline, and resource allocation.

#### Acceptance Criteria
- Toggle between grid view and Gantt view
- Display plan items as bars on timeline
- Show parent-child relationships (nested bars)
- Drag to adjust dates directly on chart
- Zoom levels (day, week, month, quarter)
- Today marker and baseline comparison
- Critical path highlighting (future)
- Export as image/PDF
- Print-friendly view

#### Dependencies
- Gantt chart library (e.g., frappe-gantt, dhtmlx-gantt, or custom)
- Date calculation utilities

#### Effort Estimate
Medium-High (3-4 days)

---

### FF-008: Planning Tool - Impact Assessment

**Priority:** Low  
**Added:** 2025-12-29  
**Requested By:** Planning Tool Enhancement

#### Description
Analyse the impact of proposed changes to the plan before applying them, showing affected items and schedule implications.

#### User Story
As a Supplier PM, I want to see what happens if I change a task's duration or move a milestone, so that I can make informed planning decisions.

#### Acceptance Criteria
- "What-if" mode for planning changes
- Show downstream impacts (affected dates, dependent items)
- Highlight schedule conflicts
- Cost impact calculation (if linked to estimates)
- Compare current vs proposed plan
- Apply or discard proposed changes
- Generate impact report

#### Dependencies
- FF-005 (Bidirectional Sync) - for accurate impact on linked entities
- Dependency tracking between plan items

#### Effort Estimate
High (4-5 days)

---

### FF-009: Planning Tool - Missing Element Detection

**Priority:** Low  
**Added:** 2025-12-29  
**Requested By:** Planning Tool Enhancement

#### Description
AI-assisted analysis to identify gaps in the project plan and suggest missing elements.

#### User Story
As a Supplier PM, I want the system to identify what might be missing from my plan, so that I don't overlook important deliverables or tasks.

#### Acceptance Criteria
- Analyse plan structure against project type templates
- Identify common missing elements (e.g., testing phase, documentation, sign-off)
- Suggest additions based on similar projects
- Compare against best practices
- User can accept/reject suggestions
- Learn from user choices over time

#### Dependencies
- AI integration (Claude API)
- Project type classification
- Best practices database or training data

#### Effort Estimate
Medium (2-3 days)

---

### FF-010: Estimator - Formal Approval Workflow

**Priority:** Medium  
**Added:** 2025-12-29  
**Requested By:** Estimator Enhancement

#### Description
Implement a proper approval workflow for estimates with submission, review, and approval stages.

#### User Story
As a Supplier PM, I want to submit estimates for review and approval, so that there's a formal sign-off process before presenting to customers.

#### Acceptance Criteria
- Submit estimate for review (changes status from Draft to Submitted)
- Reviewer can approve, reject, or request changes
- Rejection requires reason/comments
- Approved estimates become read-only
- Approval audit trail (who, when, comments)
- Email notifications for workflow steps
- Estimate can be recalled before approval

#### Dependencies
- Estimate status workflow (partially exists: Draft → Submitted → Approved)
- Reviewer role definition (likely senior Supplier PM or Admin)
- Email notification service (FF-001)

#### Effort Estimate
Medium (2-3 days)

---

### FF-011: Estimator - Lock/Baseline Estimates

**Priority:** Medium  
**Added:** 2025-12-29  
**Requested By:** Estimator Enhancement

#### Description
Allow estimates to be locked/baselined to create an immutable snapshot for tracking actuals against.

#### User Story
As a Supplier PM, I want to baseline an approved estimate, so that I can track actual project costs against the original estimate.

#### Acceptance Criteria
- "Baseline" action on approved estimates
- Baselined estimate creates immutable snapshot
- Original estimate can continue to be modified (creates variance)
- Compare current estimate vs baseline
- Multiple baselines over time (re-baseline after variations)
- Baseline metadata (date, reason, version number)
- Baseline appears in Finance Hub for comparison

#### Dependencies
- FF-010 (Approval Workflow)
- Estimate baseline history table
- Finance Hub integration (FF-012)

#### Effort Estimate
Medium (2-3 days)

---

### FF-012: Estimator - Finance Integration

**Priority:** High  
**Added:** 2025-12-29  
**Requested By:** Estimator Enhancement

#### Description
Connect estimates to project finances to track actual spend against estimated costs.

#### User Story
As a Supplier PM, I want to see how actual project costs compare to my estimate, so that I can identify budget variances early and take corrective action.

#### Acceptance Criteria
- Link estimate to project financials
- Show estimate vs actuals comparison in Finance Hub
- Actuals sourced from:
  - Approved timesheets (hours × rates)
  - Validated expenses
  - Partner invoices
- Variance calculation (estimate - actuals)
- Variance by component/task breakdown
- RAG status based on variance thresholds
- Forecast to completion based on burn rate
- Dashboard widget for estimate vs actuals

#### Dependencies
- FF-011 (Lock/Baseline Estimates)
- Actuals aggregation queries
- Finance Hub modifications

#### Effort Estimate
High (4-5 days)

---

### FF-013: Estimator - Proposal/Document Generation

**Priority:** Low  
**Added:** 2025-12-29  
**Requested By:** Estimator Enhancement

#### Description
Generate professional proposal documents from estimates.

#### User Story
As a Supplier PM, I want to generate a customer-facing proposal document from my estimate, so that I can quickly produce professional quotes.

#### Acceptance Criteria
- Generate proposal from approved estimate
- Customisable templates (cover page, terms, etc.)
- Include/exclude cost breakdowns by section
- Add narrative text per component
- Output formats: PDF, DOCX
- Branding options (logo, colours)
- Save generated proposals for audit

#### Dependencies
- Document generation service (may use existing DocumentRendererService)
- Proposal template management

#### Effort Estimate
Medium (2-3 days)

---

### FF-014: Benchmarking - Resource Rate Selection

**Priority:** Medium  
**Added:** 2025-12-29  
**Requested By:** Benchmarking Integration

#### Description
When adding a resource to a project, allow selection from benchmark rates or manual entry.

#### User Story
As a Supplier PM, I want to choose from benchmark rates when setting up a resource's cost/sell rates, so that I can ensure consistent pricing aligned with market rates.

#### Acceptance Criteria
- Resource form shows "Select from Benchmarks" option
- Browse/search benchmark rates by skill, level, tier
- Auto-populate cost and sell rates from selection
- Override option for manual adjustment
- Track whether rate is benchmark-based or manual
- Show benchmark comparison on resource detail (% above/below)
- Bulk apply benchmark rates to multiple resources

#### Dependencies
- Resource form modifications
- Benchmark rate lookup integration

#### Effort Estimate
Medium (1-2 days)

---

### FF-015: Planning + Estimator Integration

**Priority:** Medium  
**Added:** 2025-12-29  
**Requested By:** Tool Integration

#### Description
Deeper integration between Planning and Estimator tools, potentially merging into a single unified experience.

#### User Story
As a Supplier PM, I want planning and estimation to work seamlessly together, so that I can plan my project and cost it in one workflow.

#### Acceptance Criteria
- Create estimate directly from plan structure
- Plan items automatically linked to estimate components
- Estimate totals visible in planning view
- Single navigation between plan and estimate views
- Unified toolbar/actions
- Option for combined or separate views based on preference

#### Dependencies
- FF-004 (Create from Plan Items)
- EstimateLinkModal enhancements
- Unified data model consideration

#### Effort Estimate
High (5+ days) - Architectural decision required

---

### FF-016: Deliverable Task Checklists

**Priority:** Medium  
**Added:** 2025-12-29  
**Requested By:** Planning Tool Enhancement  
**Status:** ⏸️ DEFERRED (30 Dec 2025)  
**Archive:** `docs/archive/FF018-Option-B-Unified-Table/IMPLEMENTATION-PLAN-FF016-FF019-Incremental.md`

#### Description
Add the ability to create checklist-style tasks within deliverables. These are lightweight work items that can be ticked off as complete, without the governance overhead of milestones/deliverables.

#### User Story
As a Contributor, I want to add tasks to a deliverable and tick them off as I complete them, so that I can track granular progress without creating formal deliverables.

#### Acceptance Criteria
- Add/edit/delete tasks within a deliverable
- Tasks have: name, description (optional), completed (boolean), completed_by, completed_at
- Tasks display as a checklist on the deliverable detail view
- Deliverable progress can optionally auto-calculate from task completion %
- Tasks are visible to all project members
- No approval workflow on tasks (immediate save)
- Reorder tasks via drag-and-drop
- Bulk actions: mark all complete, delete selected

#### Data Model
Tasks are stored in a new `deliverable_tasks` table with `deliverable_id` FK to deliverables.

> **Note (30 Dec 2025):** Originally planned to use unified `project_structure_items` table (FF-018).
> Decision made to use standalone table to avoid risk to core milestone/deliverable architecture.
> See `docs/archive/FF018-Option-B-Unified-Table/README.md` for rationale.

#### Dependencies
- None (standalone implementation)

#### Effort Estimate
Low-Medium (2-3 days)

---

### FF-017: Project Types and Workflow Configuration

**Priority:** High  
**Added:** 2025-12-29  
**Requested By:** Core System Enhancement

#### Description
Enable different project types with configurable governance workflows. Not all projects require dual-party sign-off, customer approval of timesheets, or formal variation processes.

#### User Story
As an Organisation Admin, I want to configure different project types with appropriate workflows, so that internal projects, agile projects, or simple engagements don't require unnecessary governance overhead.

#### Project Types

| Type | Description | Characteristics |
|------|-------------|-----------------|
| **Fixed Price (Dual-Party)** | Current default | Customer + Supplier PMs, dual signatures |
| **T&M (Dual-Party)** | Time & Materials with customer oversight | Customer approves timesheets, simpler sign-off |
| **Internal Project** | No external customer | Single-party approval, Supplier PM only |
| **Agile/Iterative** | Sprint-based delivery | Simplified milestones, no formal baseline lock |
| **Custom** | Fully configurable | Pick and choose governance features |

#### Acceptance Criteria
- Project settings page allows selecting project type
- Project type determines:
  - Whether customer PM role is required
  - Whether dual signatures are required
  - Whether timesheets require customer approval
  - Whether variations process is enabled
  - Whether milestone certificates are required
  - Default milestone billing type
- Existing projects default to "Fixed Price (Dual-Party)"
- Permission matrix respects project type settings
- Workflow categories adapt to project type

#### Dependencies
- FF-018 (Unified Project Structure Model) recommended first
- Updates to permission hooks
- Updates to workflow service

#### Effort Estimate
High (5-7 days) - Touches many areas of the application

---

### FF-018: Unified Project Structure Model

**Priority:** Low (Deferred)  
**Added:** 2025-12-29  
**Requested By:** Architecture Enhancement  
**Status:** ⏸️ DEFERRED — See archived documentation  
**Archive Location:** `docs/archive/FF018-Option-B-Unified-Table/`

#### Description
Refactor the data model so that milestones, deliverables, and plan items share a **single underlying table** with different "views" for different contexts.

#### Why Deferred (30 December 2025)

After detailed analysis, the decision was made to defer this work because:

1. **Live System Risk:** Users are actively using milestones, deliverables, variations, and certificates. All are working correctly.

2. **Core Architecture Clarity:** Milestones and deliverables ARE the core architecture:
   - Milestone progress is COMPUTED from deliverable progress
   - 12+ tables have FK dependencies on milestones/deliverables
   - The variation system modifies milestone baselines
   - The certificate system gates billing

3. **Planning Tool Role:** The `plan_items` table is a VISUAL LAYER for:
   - Preparing to create milestones/deliverables
   - Adjusting dates after creation
   - It creates M/D entries on commit, not replaces them

4. **Risk vs Reward:** Option A (incremental additions) delivers FF-016 and FF-019 with significantly lower risk.

#### What Was Preserved

- Full implementation plan archived for future reference
- Schema analysis and workflow documentation archived
- Lessons learned captured and carried forward

#### Reactivation Criteria

Consider reactivating when:
- Quiet period with no active projects
- Compelling new requirement justifies the migration risk
- Time available for thorough testing
- Clear benefit over incremental approach

#### Original Design (Archived)

See `docs/archive/FF018-Option-B-Unified-Table/IMPLEMENTATION-PLAN-FF018-Unified-Project-Structure.md` for the complete original design.

---

### FF-019: Milestone Billing Types

**Priority:** Medium  
**Added:** 2025-12-29  
**Requested By:** Planning Tool Enhancement  
**Status:** ⏸️ DEFERRED (30 Dec 2025)  
**Archive:** `docs/archive/FF018-Option-B-Unified-Table/IMPLEMENTATION-PLAN-FF016-FF019-Incremental.md`

#### Description
When creating a milestone (whether from Planning tool or directly), prompt for the billing type and associated financial information.

#### Billing Types

| Type | Description | Financial Fields |
|------|-------------|------------------|
| **Fixed Price** | Pre-agreed payment amount | `billable` (fixed amount) |
| **T&M Capped** | Time & Materials with ceiling | `billable` (cap), link to estimate |
| **T&M Uncapped** | Time & Materials, no limit | Link to estimate for tracking |
| **Non-Billable** | Internal/included work | None |

#### Acceptance Criteria
- Milestone form includes billing type selector
- Conditional fields based on type
- Planning tool conversion flow prompts for billing type
- Finance Hub respects billing types for reporting
- Existing milestones default to "Fixed Price" if billable > 0

#### Data Model
Add `billing_type` column to existing `milestones` table:
```sql
ALTER TABLE milestones ADD COLUMN billing_type TEXT 
CHECK (billing_type IN ('fixed_price', 'tm_capped', 'tm_uncapped', 'non_billable'));
```

#### Dependencies
- None (standalone implementation)

#### Effort Estimate
Low (0.5-1 day)

---

### TD-003: Workflow System - Segment 5 Testing & Polish

**Priority:** Medium  
**Added:** 2025-12-17  
**Context:** Workflow System Enhancement - Segments 1-4 complete, Segment 5 pending

#### Problem

The Workflow System implementation (Segments 1-4) is complete and functional, but comprehensive E2E testing and final polish items remain unfinished. The system is working but lacks:

1. **Dedicated E2E test coverage** - No `e2e/workflow.spec.js` file exists
2. **Formal test verification** of role-based action indicators
3. **Polish items** for production readiness

#### Current State

**Implemented (Segments 1-4):**
- `src/services/workflow.service.js` - Centralised workflow service with all 13 categories
- `src/contexts/NotificationContext.jsx` - Uses workflow service, actual timestamps
- `src/pages/WorkflowSummary.jsx` - Full UI with role-based indicators
- `src/components/NotificationBell.jsx` - Actionable item highlighting
- Project builds successfully with no errors

**Missing (Segment 5):**

##### E2E Tests Required (`e2e/workflow.spec.js`)

| Test | Description | Status |
|------|-------------|--------|
| Supplier PM View | Login → Workflow Summary → Verify supplier actions as "Your Action" | 🔲 |
| Customer PM View | Login → Workflow Summary → Verify customer actions as "Your Action" | 🔲 |
| Notification Bell | Count matches actionable items, correct timestamps, navigation | 🔲 |
| Deep Linking | Submit item → Workflow Summary → "Go" button → Verify highlight | 🔲 |
| All 13 Categories | Test data for each → Verify in WorkflowSummary and NotificationBell | 🔲 |

##### Polish Items

| Item | Description | Status |
|------|-------------|--------|
| Loading States | Add loading indicators for workflow fetches | ⚠️ Partial (LoadingSpinner used) |
| Error Handling | Graceful error states for failed fetches | ⚠️ Basic try/catch exists |
| Mobile Responsive | Verify layout works on mobile devices | 🔲 Not verified |
| Empty States | Category-specific empty state messages | ⚠️ Partial |
| Accessibility | ARIA labels, keyboard navigation | 🔲 Not verified |
| Performance | Prevent duplicate fetches, optimise queries | 🔲 Not verified |

#### Strategic Solution

1. **Create `e2e/workflow.spec.js`** with comprehensive test scenarios:
   ```javascript
   // Test scenarios to implement:
   // - Supplier PM sees only supplier actions as "Your Action"
   // - Customer PM sees timesheets/chargeable expenses as actionable
   // - Customer PM sees non-chargeable expenses as "Info Only"
   // - Notification bell count matches actionable items
   // - Deep linking with ?highlight= parameter works
   // - All 13 workflow categories appear correctly
   ```

2. **Add data-testid attributes** to WorkflowSummary.jsx for testability:
   - `workflow-summary-page`
   - `workflow-stat-total`, `workflow-stat-timesheets`, etc.
   - `workflow-item-row`
   - `workflow-action-badge` / `workflow-info-badge`
   - `workflow-my-actions-toggle`

3. **Polish items**:
   - Add error boundary around WorkflowSummary
   - Improve empty state messages per category
   - Add `aria-label` attributes to interactive elements
   - Test mobile layout and fix any issues
   - Add React Query or similar for cache management

#### Benefits

- Confidence in role-based filtering logic
- Regression protection for workflow system
- Production-ready polish
- Accessibility compliance
- Better user experience on mobile

#### Files Affected

- Create: `e2e/workflow.spec.js`
- Modify: `src/pages/WorkflowSummary.jsx` (add data-testid, polish)
- Modify: `src/components/NotificationBell.jsx` (add data-testid, polish)
- Potentially: `src/contexts/NotificationContext.jsx` (error handling)

#### Effort Estimate

Medium (1-2 days)
- E2E tests: 0.5-1 day
- Polish items: 0.5-1 day

#### Reference Documents

- `/docs/WORKFLOW-SYSTEM-IMPLEMENTATION-PLAN.md` - Full implementation plan
- `/docs/WORKFLOW-IMPLEMENTATION-PROGRESS.md` - Progress tracking

---

### TD-004: Finance Role Workflow Implementation

**Priority:** Medium  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - Legacy documentation consolidation

#### Problem

The `supplier_finance` and `customer_finance` roles have permissions defined in `permissionMatrix.js`, but their UI workflows have not been built. The E2E test infrastructure marks these roles as `workflowsImplemented: false` in `e2e/helpers/test-users.js`.

#### Current State

- Permissions are defined in the permission matrix
- Test users exist in Supabase
- Auth states are generated for these roles
- E2E tests for these roles will fail because UI workflows don't exist

#### Strategic Solution

1. Design and implement finance-specific UI workflows:
   - Expense validation workflow for customer_finance
   - Invoice/billing workflow for supplier_finance
   - Budget approval workflow

2. Update `e2e/helpers/test-users.js` to set `workflowsImplemented: true` once complete

3. Add finance-specific E2E tests

#### Files Affected

- `src/pages/Expenses.jsx` - Add finance approval workflow
- `src/pages/Billing.jsx` - Add finance-specific views
- `e2e/helpers/test-users.js` - Update workflow flags
- Create new E2E spec files for finance workflows

#### Effort Estimate

High (3-5 days) - Requires new UI design and implementation

---

### TD-005: Unit Test React Testing Library Fix

**Priority:** Medium  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - 27 failing unit tests

#### Problem

27 unit test failures in `usePermissions.test.jsx` due to React Testing Library compatibility issue with Vitest.

#### Root Cause

React Testing Library requires `mode: 'development'` in Vitest config for proper operation.

#### Strategic Solution

Add to `vite.config.js`:

```javascript
test: {
  mode: 'development',
  // ... other config
}
```

#### Files Affected

- `vite.config.js`

#### Effort Estimate

Low (30 minutes)

---

### TD-006: Mobile Chrome Responsive Design Fix

**Priority:** Low  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - 1 failing E2E test on Mobile Chrome

#### Problem

1 E2E test failure on Mobile Chrome: Sidebar overlaps user menu on mobile viewport.

#### Strategic Solution

CSS fix to ensure proper z-index and layout on mobile breakpoints. Related to TD-002 (Z-Index Scale Standardisation).

#### Files Affected

- `src/components/Layout.jsx` or related CSS

#### Effort Estimate

Low (1 hour)

---

### TD-007: Database Tests (pgTAP) Setup

**Priority:** Low  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - Legacy documentation consolidation

#### Problem

Database tests using pgTAP are documented but not regularly executed. The `npm run test:db` script exists but requires local Supabase CLI setup.

#### Current State

- Schema documented in `supabase/` directory
- RLS policies documented in tech specs
- No automated CI/CD pipeline for database tests

#### Strategic Solution

1. Create comprehensive pgTAP test suite for RLS policies
2. Add database tests to CI/CD pipeline (if Supabase CLI available)
3. Document local setup requirements

#### Files Affected

- Create `supabase/tests/*.test.sql` files
- Update GitHub Actions workflows

#### Effort Estimate

Medium (2-3 days)

---

### TD-008: Test Data Cleanup Automation

**Priority:** Low  
**Added:** 2025-12-17  
**Context:** E2E Testing Infrastructure - Legacy documentation consolidation

#### Problem

Test data uses `[TEST]` prefix for identification, but automated cleanup after test runs is not implemented in CI/CD.

#### Current State

- `npm run e2e:cleanup` script exists
- Manual cleanup required
- Test data can accumulate over time

#### Strategic Solution

1. Add post-test cleanup to CI workflows
2. Consider implementing automatic cleanup via database triggers
3. Add data retention policies

#### Files Affected

- `.github/workflows/staging-tests.yml`
- `scripts/e2e/cleanup-test-data.js`

#### Effort Estimate

Low (1-2 hours)

---

## Completed Items

Items that have been resolved and can be archived for reference.

### COMPLETE-002: TD-001 Entity Permission Hook Consolidation

**Completed:** 28 December 2025  
**Original Priority:** Medium  
**Effort:** 1 day (6 phases)

#### Summary

Refactored all entity detail modals to use internal permission hooks instead of receiving permission props from parent pages. This eliminates prop drilling and creates a single source of truth for permissions per entity.

#### Implementation Details

**New Hooks Created (3):**
- `useExpensePermissions.js` - Expense-specific permissions with ownership, status, and chargeable logic
- `useRaidPermissions.js` - RAID item permissions with status-based close/reopen logic
- `useNetworkStandardPermissions.js` - Simple permission hook for network standards

**Existing Hooks Used (3):**
- `useDeliverablePermissions.js` - Already existed, modal refactored to use exclusively
- `useTimesheetPermissions.js` - Already existed, modal refactored to use exclusively
- `useMilestonePermissions.js` - Already existed, certificate modal refactored to use

**Modals Refactored (6):**

| Modal | Props Removed | Hook Used |
|-------|---------------|----------|
| `ExpenseDetailModal` | 6 props | `useExpensePermissions` |
| `RaidDetailModal` | 2 props | `useRaidPermissions` |
| `TimesheetDetailModal` | 5 props | `useTimesheetPermissions` |
| `CertificateModal` | 2 props | `useMilestonePermissions` |
| `NetworkStandardDetailModal` | 1 prop | `useNetworkStandardPermissions` |
| `DeliverableDetailModal` | 4 props | `useDeliverablePermissions` |

**Parent Pages Updated (7):**
- `Expenses.jsx` - Removed 6 modal permission props
- `RaidLog.jsx` - Removed 2 modal permission props
- `Timesheets.jsx` - Removed 5 modal permission props
- `MilestonesContent.jsx` - Removed 2 certificate modal props
- `NetworkStandards.jsx` - Removed 1 modal permission prop
- `Deliverables.jsx` - Removed 4 modal permission props
- `DeliverablesContent.jsx` - Removed 4 modal permission props

#### Benefits Achieved

- **Single source of truth**: Each entity has one hook for all permission logic
- **Self-contained modals**: Modals no longer depend on parent pages for permissions
- **Reduced prop drilling**: ~20 permission props eliminated across 7 parent pages
- **Consistent pattern**: All entity modals now follow the same approach
- **Easier maintenance**: Permission changes only need to be made in one place per entity

#### Related Files

- Implementation Plan: `/docs/IMPLEMENTATION-PLAN-TD-001-Permission-Hook-Consolidation.md`
- All hooks exported from: `src/hooks/index.js`

---

### COMPLETE-001: Organisation-Level Multi-Tenancy

**Completed:** 22-23 December 2025  
**Original Priority:** High  
**Effort:** 2 days

#### Summary

Implemented three-tier multi-tenancy model:
- **Tier 1:** Organisations (top-level tenants)
- **Tier 2:** Projects (belong to organisations)
- **Tier 3:** Entities (project-scoped data)

#### Implementation Details

**Database (12 migrations):**
- `organisations` table with settings JSONB
- `user_organisations` junction table with org_role
- `organisation_members_with_profiles` view
- Updated `projects` table with `organisation_id` FK
- RLS helper functions: `is_org_admin()`, `is_org_owner()`, `can_access_project()`
- Organisation-aware RLS policies on all tables

**Frontend:**
- `OrganisationContext.jsx` - State management for current org
- `OrganisationSwitcher.jsx` - UI component for org selection
- `organisation.service.js` - CRUD, member mgmt, settings, statistics
- Updated `ProjectContext` to filter by current organisation
- Added org roles: `org_owner`, `org_admin`, `org_member`

**Testing:**
- `org-permissions.test.js` - 118 unit tests for org permission matrix
- All 28 implementation checkpoints verified

#### Related Documentation Updates

- TECH-SPEC-01-Architecture.md (v2.0)
- TECH-SPEC-02-Database-Core.md (v2.0)
- TECH-SPEC-05-RLS-Security.md (v2.0)
- TECH-SPEC-06-API-AI.md (v1.1)
- TECH-SPEC-07-Frontend-State.md (v2.0)
- TECH-SPEC-08-Services.md (v2.0)
- TECH-SPEC-09-Testing-Infrastructure.md (v1.1)
- AMSF001-Technical-Specification.md (v2.0)

---

## How to Use This Document

### Adding Technical Debt

Use the format:
```
### TD-XXX: [Short Title]

**Priority:** High/Medium/Low  
**Added:** YYYY-MM-DD  
**Context:** [Where this was discovered]

#### Problem
[Description of the issue]

#### Current State
[What's in place now, if any tactical fix was applied]

#### Strategic Solution
[What the proper fix looks like]

#### Benefits
[Why this matters]

#### Files Affected
[List of files]

#### Effort Estimate
[Time estimate]
```

### Adding Future Features

Use the format:
```
### FF-XXX: [Feature Name]

**Priority:** High/Medium/Low  
**Added:** YYYY-MM-DD  
**Requested By:** [Source]

#### Description
[What the feature does]

#### User Story
[As a [role], I want [feature], so that [benefit]]

#### Acceptance Criteria
[List of requirements]

#### Dependencies
[What needs to be in place first]

#### Effort Estimate
[Time estimate]
```

### Moving to Completed

When an item is resolved:
1. Move it to the "Completed Items" section
2. Add **Completed:** date and **Resolution:** notes

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 16 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 23 Dec 2025 | Claude AI | Added COMPLETE-001 (Organisation Multi-Tenancy), added Document History section |
| 1.2 | 28 Dec 2025 | Claude AI | Completed TD-001 (Permission Hook Consolidation), moved to COMPLETE-002 |
