# Changelog

All notable changes to the AMSF001 Project Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.14] - 2026-01-15

### Added

#### Component Filter for Filtering Views
Added component-based filtering across Task View, Milestones, and Deliverables pages.

**Task View Page:**
- Component dropdown filter above milestone filter chips
- Filters milestones by selected component
- New `getMilestoneComponentMap()` method maps milestones to their parent components

**Milestones Page:**
- Component filter dropdown in filter bar
- Filters milestone list by component

**Deliverables Page:**
- Component filter as first dropdown in filter bar
- Filters both milestone dropdown and deliverable list

**Service Methods:**
- `planItemsService.getComponents(projectId)` - Returns all component items for a project
- `planItemsService.getMilestoneComponentMap(projectId)` - Returns map of milestone IDs to component info

### Fixed

#### Planner Edit Blocking for Committed Items (Critical Bug Fix)
Fixed incorrect edit blocking in Planner where committed-but-not-baselined items were blocked from editing.

**Previous Behavior (Bug):**
- All committed items showed "This item is managed in Tracker. Changes must be made there."
- Users could not edit any committed items in Planner, even when the milestone was not baselined

**Correct Behavior (Per TECH-SPEC-12):**
| Item State | Editable Fields | Structural Changes |
|------------|-----------------|-------------------|
| Uncommitted | All fields | Allowed |
| Committed (not baselined) | All fields | Allowed (syncs to Tracker) |
| Baselined | name, description, status, progress only | Blocked |

**Implementation:**
- Added `BASELINE_PROTECTED_FIELDS` constant: `['start_date', 'end_date', 'duration_days', 'billable']`
- Added `getEditBlockStatus(item, field)` helper function for field-level edit checking
- Updated `startEditing()` to use helper function
- Updated `clearCell()` to use helper function
- Updated `handleDeleteItem()` to only block baselined items
- Updated `handleIndent()` to only block baselined items
- Updated `handleOutdent()` to only block baselined items

**Files Changed:**
- `src/pages/planning/Planning.jsx` - Added helper function, updated 5 functions
- `src/services/planItemsService.js` - Added getComponents, getMilestoneComponentMap methods
- `src/pages/TaskView.jsx` - Added component filter
- `src/pages/milestones/MilestonesContent.jsx` - Added component filter
- `src/pages/deliverables/DeliverablesContent.jsx` - Added component filter

---

## [0.9.13] - 2026-01-06

### Added

#### Component Item Type
Added `component` as a top-level organizational item type in the Planning hierarchy.

**Database:**
- Updated `plan_items.item_type` CHECK constraint: `('component', 'milestone', 'deliverable', 'task')`
- Components serve as grouping containers (e.g., "Frontend", "Backend", "Infrastructure")

**Service Layer:**
- Updated clipboard validation in `planningClipboard.js`
- Updated hierarchy rules in `planItemsService.js`

**UI:**
- Added amber/orange styling for component rows in Planning grid
- Updated AI Assistant tool schemas to include component generation

#### Tracker-as-Master Sync
Implemented one-way sync from Tracker to Planner for committed items.

**New Method:**
- `planItemsService.syncFromTracker(projectId)` - Updates plan_items from Tracker data

**Sync Fields:**
| Tracker | → | Planner |
|---------|---|---------|
| milestone.status | → | plan_item.status (mapped) |
| milestone.percent_complete | → | plan_item.progress |
| milestone.start_date | → | plan_item.start_date |
| milestone.forecast_end_date | → | plan_item.end_date |
| deliverable.status | → | plan_item.status (mapped) |
| deliverable.progress | → | plan_item.progress |
| deliverable.due_date | → | plan_item.end_date |

**Behavior:**
- Sync runs automatically on Planning page load
- Committed items are visually distinct (greyed, 🔗 icon)
- Committed items are read-only (cannot edit, delete, drag, indent)
- Info toast shown when user attempts to edit committed items

**Safety:**
- READ-ONLY from milestones and deliverables tables
- Only updates plan_items table
- Tracker workflows (timesheets, variations, certificates) untouched

#### Resizable Columns
Added drag-to-resize columns in Planning grid with localStorage persistence.

**New Hook:**
- `useResizableColumns.js` - Manages column widths with persistence

**Features:**
- Drag handles on column headers
- Minimum widths enforced
- Purple gradient visual feedback on hover/drag
- Widths persist across sessions via localStorage

#### Soft-Delete Cleanup
Added hard delete and purge methods for cleaning up soft-deleted items.

**New Methods:**
- `planItemsService.hardDelete(id)` - Permanently removes item
- `planItemsService.purgeSoftDeleted(projectId)` - Removes all soft-deleted items

**Migration:**
- `migrations/cleanup_soft_deleted_plan_items.sql` - SQL for manual cleanup

### Changed

#### Planning AI Model Upgrade
Upgraded Planning AI from Claude Sonnet 4.5 to Claude Opus 4.

**Configuration Changes:**
- Model: `claude-sonnet-4-5-20250929` → `claude-opus-4-20250514`
- MAX_TOKENS: `8192` → `16384`
- Backend timeout: `120s` → `300s` (via vercel.json)
- Frontend timeout: → `5.5 minutes`

**Benefits:**
- Improved accuracy for complex project documents
- Better extraction of hierarchical structure from PDFs
- Cost increase: ~5x (justified by quality improvement)

#### Planning AI Tool Choice
Added forced tool usage to prevent text-only responses.

```javascript
tool_choice: { type: 'tool', name: 'generate_wbs' }
```

#### Default Collapsed View
Planning grid now defaults to collapsed view on load.
- All parent items (components, milestones, deliverables with children) start collapsed
- User can expand individually or use "Expand All" button

### Removed

#### Estimate Column
Removed Estimate column from Planning grid.
- Column header removed
- Cell rendering removed
- ColSpan updated from 13 to 12

### Fixed

#### Schema Error - deleted_at Column
Fixed `"Could not find the 'deleted_at' column"` errors.

**Root Cause:** Code attempted to set `deleted_at` and `deleted_by` columns that don't exist.

**Fixed Files:**
- `planItemsService.js` - delete() method
- `syncService.js` - syncPlanItemDeleteToTracker(), syncMilestoneDeleteToPlanner(), syncDeliverableDeleteToPlanner()

**Solution:** Now only sets `is_deleted: true` (the actual column)

#### Ghost Uncommitted Count
Fixed incorrect "56 uncommitted" count despite empty plan.

**Root Cause:** Soft-deleted items (is_deleted=true) still counted.

**Solution:**
- Updated uncommittedCount filter to exclude is_deleted items
- Purged 269 soft-deleted items from production database

---

## [0.9.12] - 2026-01-05

### Added

#### Planner-Tracker Integration
Implemented integration between the Planning tool and Milestone Tracker with baseline protection.

**New Service:**
- `planCommitService.js` - Commits plan items to Tracker, detects baseline changes, manages published items

**New Hook:**
- `usePlanningIntegration` - React hook providing baseline protection, commit logic, and variation creation

**New Components:**
- `BaselineProtectionModal` - Modal for editing baseline-protected fields (shows impact, offers variation creation)
- `CommitToTrackerButton` - Toolbar button showing uncommitted count
- `PlanItemIndicators` - Visual indicators (✓ published, 🔒 locked) for table rows
- `PendingChangesBanner` - Banner for queued baseline changes
- `SyncStatusFooter` - Footer showing commit stats and sync status

**Database Migration:**
- Added `published_at` column to `plan_items`
- Created `project_plans` table for tracking plan versions
- Added indexes for efficient published item queries

**Features:**
- Commit milestones/deliverables from Planning to Tracker with one click
- Baseline protection prevents direct edits to locked milestone fields
- Automatic variation creation workflow when modifying baselined items
- Visual indicators show published and locked status per row
- Status mapping between plan_items (lowercase) and milestones (Title Case)

**Protected Baseline Fields:**
- `start_date`, `end_date`, `duration`, `cost`, `billable`

**Permissions:**
- Only `admin` and `supplier_pm` roles can commit plans and create variations

---

## [0.9.11] - 2025-12-28

### Changed

#### TD-001: Permission Hook Consolidation
Refactored all entity detail modals to use internal permission hooks instead of receiving permission props from parent pages. This eliminates prop drilling and creates a single source of truth for permissions per entity.

**New Hooks Created:**
- `useExpensePermissions` - Expense-specific permissions with ownership, status, and chargeable logic
- `useRaidPermissions` - RAID item permissions with status-based logic
- `useNetworkStandardPermissions` - Simple permission hook for network standards

**Modals Refactored:**
- `ExpenseDetailModal` - Removed 6 permission props, uses `useExpensePermissions` internally
- `RaidDetailModal` - Removed 2 permission props, uses `useRaidPermissions` internally
- `TimesheetDetailModal` - Removed 5 permission props, uses `useTimesheetPermissions` internally
- `CertificateModal` - Removed 2 permission props, uses `useMilestonePermissions` internally
- `NetworkStandardDetailModal` - Removed 1 permission prop, uses `useNetworkStandardPermissions` internally
- `DeliverableDetailModal` - Removed 4 permission props, uses `useDeliverablePermissions` exclusively

**Parent Pages Updated:**
- `Expenses.jsx` - Removed modal permission prop calculations
- `RaidLog.jsx` - Removed modal permission prop calculations
- `Timesheets.jsx` - Removed modal permission prop calculations
- `MilestonesContent.jsx` - Removed certificate modal permission props
- `NetworkStandards.jsx` - Removed modal permission prop
- `Deliverables.jsx` / `DeliverablesContent.jsx` - Removed modal permission props

**Benefits:**
- Single source of truth for permissions per entity
- Self-contained modals that manage their own permissions
- Reduced prop drilling through component hierarchies
- Consistent pattern across all entities
- Easier maintenance - permission changes in one place per entity

---

## [0.9.10] - 2025-12-28

### Added

#### Planning Tool
- New `/planning` page with Excel-like hierarchical grid interface
- `plan_items` table for storing WBS (Work Breakdown Structure) data
- 22-column schema supporting milestones, deliverables, and tasks
- Self-referencing hierarchy with `parent_id` for tree structure
- Automatic WBS numbering via `recalculate_wbs()` function
- Keyboard navigation (Arrow keys, Tab, Enter, Escape)
- Inline editing with auto-save
- Drag-and-drop reordering
- Expand/collapse tree nodes
- Status tracking (not_started, in_progress, completed, on_hold, cancelled)
- Progress percentage with visual indicators
- Links to milestones, deliverables, and resources
- `planItemsService` with 18 methods for CRUD operations

#### Planning AI Assistant
- `PlanningAIAssistant.jsx` component (22KB)
- Document upload and parsing (PDF, DOCX, TXT)
- AI-powered WBS extraction using Claude Sonnet 4.5
- `/api/planning-ai.js` serverless function (17KB)
- 120-second timeout for large document processing
- Streaming responses with progress indication
- Multi-format prompt templates for extraction

#### Estimator Tool
- New `/estimator` page with component-based cost estimation
- 4 database tables: `estimates`, `estimate_components`, `estimate_tasks`, `estimate_resources`
- SFIA 8 skills framework integration (97 skills, 7 levels, 4 tiers)
- `ResourceTypeSelector` component with hierarchical skill selection
- Excel-like effort grid for resource allocation
- Real-time cost calculations with totals
- Component quantity multipliers
- Save, load, and duplicate estimates
- Status workflow (draft, submitted, approved, rejected, archived)
- `estimatesService` with 14 methods + constants
- Bidirectional linking to Planning tool

#### Benchmarking Tool
- New `/benchmarking` page for SFIA 8 rate comparison
- `benchmark_rates` table (global, not project-scoped)
- 15-column schema for rate data
- UK market day rates by skill, level, and tier
- Collapsible category/subcategory navigation
- Tier comparison view (Contractor, Boutique, Mid, Big4)
- Rate filtering and search
- `benchmarkRatesService` with 8 async methods + 14 helpers
- `sfia8-reference-data.js` with 97 skills, 6 categories, 19 subcategories

#### Planning ↔ Estimator Integration
- `EstimateGeneratorModal` - Generate estimate from plan structure
- `EstimateLinkModal` - Link/unlink plan items to estimate components
- `plan_items_with_estimates` view for denormalized queries
- `link_plan_item_to_estimate()` and `unlink_plan_item_from_estimate()` functions
- Auto-navigation from Planning to Estimator with deep linking
- Bidirectional FK relationships (plan_items ↔ estimate_components)

### Changed

#### Navigation
- Added "Tools" section with Planning, Benchmarking, Estimator
- Planning: Available to Admin, Supplier PM, Customer PM
- Benchmarking: Available to Admin, Supplier PM
- Estimator: Available to Admin, Supplier PM

#### Route Security
- Added `requiredRoles` prop to ProtectedRoute for tool pages
- Planning: `['admin', 'supplier_pm', 'customer_pm']`
- Benchmarking: `['admin', 'supplier_pm']`
- Estimator: `['admin', 'supplier_pm']`

### Fixed

#### BUG-001: Tier Constraint Mismatch (CRITICAL)
- **Issue:** `estimate_resources` CHECK constraint used wrong tier values ('associate', 'top4')
- **Impact:** Database rejected valid tier selections from UI
- **Fix:** Migration `202512281500_fix_estimate_resources_tier_check.sql`
- **Correct values:** 'contractor', 'boutique', 'mid', 'big4'

#### BUG-002: Missing buildRateLookup Method (HIGH)
- **Issue:** `benchmarkRatesService.buildRateLookup()` method did not exist
- **Impact:** Estimator always fell back to hardcoded rates, ignoring database
- **Fix:** Added `buildRateLookup()` method to BenchmarkRatesService

#### ISSUE-001: Route Access Control Gap (MEDIUM)
- **Issue:** Tool routes lacked `requiredRoles` parameter
- **Impact:** Users knowing URLs could access pages beyond their role
- **Fix:** Added explicit `requiredRoles` to Planning, Benchmarking, Estimator routes

### New Files

```
# Planning
src/pages/planning/Planning.jsx (33KB)
src/components/planning/PlanningAIAssistant.jsx (22KB)
src/components/planning/EstimateGeneratorModal.jsx
src/components/planning/EstimateLinkModal.jsx
src/services/planItems.service.js
api/planning-ai.js (17KB)

# Estimator
src/pages/estimator/Estimator.jsx (46KB)
src/components/estimator/ResourceTypeSelector.jsx
src/services/estimates.service.js

# Benchmarking
src/pages/benchmarking/Benchmarking.jsx (19KB)
src/services/benchmarkRates.service.js
src/services/sfia8-reference-data.js

# Database
supabase/migrations/202512261000_create_planning_tables.sql
supabase/migrations/202512261100_create_estimates_tables.sql
supabase/migrations/202512261200_add_estimate_link_to_plan_items.sql
supabase/migrations/202512261300_create_benchmark_rates.sql
supabase/migrations/202512261400_seed_benchmark_rates.sql
supabase/migrations/202512281500_fix_estimate_resources_tier_check.sql
```

### Documentation

- Updated TECH-SPEC-02 (v4.0) with Planning & Estimator tables
- Updated TECH-SPEC-04 (v1.2) with benchmark_rates table
- Updated TECH-SPEC-05 (v4.0) with 22 new RLS policies
- Updated TECH-SPEC-06 (v1.3) with Planning AI API documentation (Section 6.7)
- Updated TECH-SPEC-07 (v5.0) with Planning & Estimator tools (Section 14)
- Updated TECH-SPEC-08 (v4.0) with Planning & Estimator services (Section 15)
- Created SYSTEMATIC-APPLICATION-REVIEW.md with comprehensive analysis

---

## [0.9.9] - 2025-12-24

### Added

#### Public Landing Page
- New marketing landing page at `/` for unauthenticated visitors
- Hero section with key messaging and CTAs
- Features grid showcasing platform capabilities
- Responsive design with mobile support
- `PublicHomeRoute` component - shows landing page or redirects to dashboard

#### Self-Service Organisation Creation (Phase 2)
- `/api/create-organisation.js` - API endpoint for org creation
- `/onboarding/create-organisation` - Page for users without orgs
- Automatic org admin assignment on creation
- Slug validation and duplicate checking

#### Onboarding Wizard (Phase 2)
- 4-step wizard for new organisation setup
- Step 1: Organisation details (name, display name)
- Step 2: Invite team members (optional, up to 5)
- Step 3: Create first project (optional)
- Step 4: Completion with next steps
- Progress indicator and navigation
- Skippable steps with "Skip for now" option

#### Invitation UI Enhancements (Phase 2)
- `PendingInvitationCard` component with expiry countdown
- Copy invitation link to clipboard
- Resend invitation (generates new token)
- Revoke invitation functionality
- Pending invitations section in OrganisationMembers page

#### Subscription & Limits System (Phase 3)
- `src/lib/subscriptionTiers.js` - Tier definitions (free/starter/professional/enterprise)
- `src/services/subscription.service.js` - Limit checking and usage tracking
- `UpgradePrompt` component (banner/modal/card/inline variants)
- `UsageMeter` component for visual usage display
- `OrganisationUsageWidget` dashboard widget for org admins
- Limit enforcement in create-project API, invitation service, organisation service
- **Note:** Free tier currently set to unlimited (no paid tiers active)

#### Security Hardening (Phase 1)
- User queries now filtered by organisation membership
- API authorization checks validate org membership
- Database trigger prevents cross-org project assignments
- `src/lib/queries.js` - Centralised org-filtered user queries

### Changed

#### Login Page
- Now supports `?mode=signup` parameter to pre-select signup form
- Redirects authenticated users to dashboard

#### Dashboard
- Added `OrganisationUsageWidget` for org admins (shows member/project counts)

#### Routes
- `/` now shows landing page for unauthenticated users
- `/` redirects to `/dashboard` for authenticated users

### New Files

```
src/pages/LandingPage.jsx
src/pages/LandingPage.css
src/pages/onboarding/CreateOrganisation.jsx
src/pages/onboarding/CreateOrganisation.css
src/pages/onboarding/OnboardingWizardPage.jsx
src/pages/onboarding/index.js
src/components/onboarding/OnboardingWizard.jsx
src/components/onboarding/OnboardingWizard.css
src/components/onboarding/Step1OrgDetails.jsx
src/components/onboarding/Step2InviteTeam.jsx
src/components/onboarding/Step3FirstProject.jsx
src/components/onboarding/Step4Complete.jsx
src/components/onboarding/index.js
src/components/organisation/PendingInvitationCard.jsx
src/components/organisation/PendingInvitationCard.css
src/components/organisation/index.js
src/components/common/UpgradePrompt.jsx
src/components/common/UpgradePrompt.css
src/components/common/UsageMeter.jsx
src/components/common/UsageMeter.css
src/components/dashboard/OrganisationUsageWidget.jsx
src/components/dashboard/OrganisationUsageWidget.css
src/lib/subscriptionTiers.js
src/lib/queries.js
src/services/subscription.service.js
api/create-organisation.js
docs/MULTI-TENANCY-IMPLEMENTATION-GUIDE.md
```

### Database Migrations

**Enforce Org Membership:** `202512241700_enforce_org_membership_on_project_assignment.sql`
- Trigger function to validate user is org member before project assignment
- Prevents cross-organisation data leakage

---

## [0.9.8] - 2025-12-24

### Added

#### Organisation Admin Permission Hierarchy
- Org admins now automatically get `effectiveRole = 'admin'` within their organisation
- Org admins see full admin sidebar (Settings, Resources, Team Members, etc.)
- System admins still see System Users and System Admin pages (org admins do not)
- New `isOrgLevelAdmin` flag in usePermissions hook for UI decisions

#### RLS Policy Updates
- Updated 33 SELECT policies to use `can_access_project()` helper function
- Org admins can now query all project data within their organisation
- System admins can access all data everywhere
- Cross-organisation isolation maintained

### Changed

#### Frontend Permission System
- `ViewAsContext.jsx` v3.0: Now respects System Admin > Org Admin > Project Role hierarchy
- `usePermissions.js` v5.0: Exports `isSystemAdmin`, `isOrgAdmin`, `isOrgLevelAdmin`
- `navigation.js` v3.0: Added `getNavigationForUser()` function
- `Layout.jsx` v13.0: Uses new navigation function for sidebar

### Database Migrations Required

**Fix RLS Policies:** `202512241500_fix_rls_policies_use_can_access_project.sql`
```sql
-- Updates 27 SELECT policies to use can_access_project() helper
-- Example:
CREATE POLICY "timesheets_select_policy" ON timesheets
  FOR SELECT TO authenticated
  USING (can_access_project(project_id));
```

**Fix Remaining Policies:** `202512241502_fix_remaining_rls_policies.sql`
```sql
-- Updates 8 more SELECT policies for:
-- deliverable_kpis, deliverable_quality_standards, milestone_certificates,
-- network_standards, quality_checks, report_generations, report_templates,
-- resource_availability
```

### Documentation Updated
- `TECH-SPEC-02-Database-Core.md` v3.0: Updated org roles (3→2)
- `TECH-SPEC-05-RLS-Security.md` v3.0: Updated access hierarchy, can_access_project()
- `TECH-SPEC-07-Frontend-State.md` v3.0: Updated ViewAsContext, usePermissions
- `ADDENDUM-Permission-Hierarchy.md`: New - detailed implementation notes

---

## [0.9.7] - 2025-12-24

### Added

#### Organisation Invitation System
- Invite users by email to join organisations
- Email invitations sent via Resend API
- Accept invitation page for new user signup
- Pending invitations management in System Admin and Org Members pages
- Resend and revoke invitation capabilities

#### System Admin Page
- New `/admin/system` page for system administrators
- Create new organisations with initial admin assignment
- View all organisations with member/admin counts
- Manage pending invitations across all organisations

### Changed

#### Organisation Role Simplification
- Simplified from 3 roles to 2: `org_admin` and `org_member`
- Removed `org_owner` role (replaced by `org_admin` with equal privileges)
- Multiple org admins can now share administrative responsibilities

### Database Migrations Required

**Role Simplification:** `202512231600_simplify_org_roles.sql`
**Invitations Table:** `202512241000_create_org_invitations.sql`

---

## [0.9.6] - 2025-12-18

### Added

#### Customer PM Assessment During Deliverable Sign-off
- Customer PM now sees KPI/QS assessment UI when signing off deliverables
- Assessment section appears regardless of whether Supplier PM has signed first
- Customer PM can add or remove KPIs and Quality Standards during sign-off
- Each linked KPI/QS must be marked Yes (met) or No (not met) before signing
- Assessments are saved to `deliverable_kpi_assessments` and `deliverable_qs_assessments` tables
- Removed redundant "Assess & Sign Off" button from deliverable modal footer

### Fixed

#### Missing Database Columns
- Added missing `submitted_date`, `submitted_by`, `delivered_date`, `delivered_by` columns to `deliverables` table
- Fixed "Could not find the 'delivered_by' column of 'deliverables' in the schema cache" error

### Database Migrations Required

**Deliverables Workflow Columns:** `20251218_add_delivered_by_column.sql`
```sql
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS submitted_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_by UUID REFERENCES profiles(id);
```

---

## [0.9.5] - 2025-12-19

### Added

#### Variation Auto-Apply on Dual Signature
- Variations now **automatically apply to baselines** when both parties sign
- Auto-apply logic moved from UI to service layer for reliability
- Fallback "Apply to Baselines" button added for variations stuck in 'approved' status
- Fixes edge cases where variations got stuck between 'approved' and 'applied' states

#### Receipt Scanner - Image Linking
- Scanned receipt images now properly linked to expense records
- Receipt thumbnails display in expense detail modal
- Images stored in `receipt-scans` bucket with proper RLS policies

### Fixed

#### Receipt Scanner RLS Policies
- Fixed "new row violates row-level security policy for table receipt_scans" error
- Added proper RLS policies for `receipt_scans` table
- Added storage policies for `receipt-scans` bucket

### Database Migrations Required

**Receipt Scans RLS:** `20251219_receipt_scans_rls.sql`
```sql
-- Run the full migration file or these key policies:
ALTER TABLE receipt_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "receipt_scans_insert_policy" ON receipt_scans 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = receipt_scans.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
    )
  );
```

**Expense Files Bucket Column:** `20251219_expense_files_bucket.sql`
```sql
ALTER TABLE expense_files 
ADD COLUMN IF NOT EXISTS bucket TEXT DEFAULT 'receipts';
```

**Storage Policies:**
```sql
UPDATE storage.buckets SET public = true WHERE id = 'receipt-scans';

CREATE POLICY "Authenticated users can view receipt scans"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipt-scans');
```

### Files Changed
- `src/services/variations.service.js` - Auto-apply in signVariation()
- `src/pages/VariationDetail.jsx` - Fallback Apply button, simplified handleSign()
- `src/pages/Expenses.jsx` - Link scanned receipts to expense_files
- `src/components/expenses/ExpenseDetailModal.jsx` - Support multiple storage buckets
- `src/services/receiptScanner.service.js` - Receipt scanning service

---

## [0.9.4] - 2025-12-18

### Added

#### RAID Category Change in Edit Mode
- RAID items can now have their **category changed** after creation
- Category selector buttons added to the edit modal (Risk, Assumption, Issue, Dependency)
- Header updates dynamically to reflect the selected category
- **Use cases:**
  - Risk materializes → convert to Issue
  - Issue resolved → convert to Risk for future tracking
  - Dependency becomes a blocker → convert to Issue

#### RAID Owner - Any Team Member
- Owner dropdown now shows **all project team members** (not just billable resources)
- Includes Customer PM, Finance roles, Viewers - anyone assigned to the project
- Role displayed in dropdown: "Glenn Nickols (supplier pm)"
- Works in both Add and Edit forms

### Fixed

#### Report Milestone Status Calculation
- **Bug fix:** Reports now calculate milestone status from deliverables dynamically
- Previously, reports read stale `status` field from milestone table
- Now uses `calculateMilestoneStatus()` from deliverables, matching the Milestones page
- Milestones with started deliverables now correctly show as "In Progress" in reports

### Technical Details

**RAID Owner Migration Required:**
```sql
ALTER TABLE raid_items 
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_raid_items_owner_user_id ON raid_items(owner_user_id);
```

**Files Changed:**
- `src/components/raid/RaidDetailModal.jsx` - Category selector, self-contained team member fetch
- `src/components/raid/RaidDetailModal.css` - Category button styles
- `src/components/raid/RaidAddForm.jsx` - Team member fetch (two-step query)
- `src/services/raid.service.js` - Fallback query for owner_user_id
- `src/services/metrics.service.js` - Calculate milestone status from deliverables

---

## [0.9.3] - 2025-12-18

### Added

#### Milestone Reference Editing
- Milestone reference codes can now be edited after creation
- Reference field added to the Edit Milestone modal on the detail page
- Reference appears alongside Name at the top of the edit form

#### Milestone Soft Delete with Undo
- Added **Delete button** to the Edit Milestone modal (bottom-left corner)
- Delete triggers a confirmation warning showing:
  - The milestone reference and name being deleted
  - Count of linked deliverables that will be affected
  - Information that the item goes to "Deleted Items" and can be restored
- **Soft delete** implementation - records are marked as `is_deleted = true` rather than permanently deleted
- **Undo capability** via toast notification with "Undo" button (appears for ~5 seconds after deletion)
- Deleted milestones can also be restored from the **Deleted Items** page

### Changed

#### MilestoneDetail Page (v4.5)
- Edit modal now includes Reference field (editable)
- Edit modal footer redesigned with Delete button on left, Save/Cancel on right
- Delete confirmation section with warning about linked deliverables

#### MilestoneForms Component
- `MilestoneEditModal` already supported reference editing and delete (now consistent with detail page)

### Technical Details

**Delete Workflow:**
1. User clicks Edit on milestone detail page
2. Clicks Delete button (red, bottom-left)
3. Confirmation section appears with impact warning
4. On confirm: `milestonesService.delete()` performs soft delete
5. User redirected to milestones list
6. Toast appears with Undo option
7. If Undo clicked: `milestonesService.restore()` reverses the deletion

**Files Changed:**
- `src/pages/MilestoneDetail.jsx` (v4.5) - Reference field, delete UI
- `src/pages/MilestoneDetail.css` - Form row layout updates
- `src/components/milestones/MilestoneForms.jsx` - Already had delete capability
- `src/pages/Milestones.jsx` - Delete from list also supports undo

---

## [0.9.2] - 2025-12-17

### Fixed

#### Baseline Commitment Display
- **Critical Fix:** Baseline Commitment section now correctly shows the **original signed values**
- Previously, when a variation was applied, the section showed updated values but with original signatures
- This was misleading because signatures appeared to approve values they didn't actually sign off on

### Added

#### Original Baseline Version (v1) Creation
- When both PMs sign and lock the baseline, a v1 record is now created in `milestone_baseline_versions`
- This preserves the original signed commitment for audit trail and display purposes
- New `createOriginalBaselineVersion()` method in `MilestonesService` (v2.2)

#### Baseline Commitment UI Enhancements (v4.4)
- **Original Commitment section:** Always shows the values that were actually signed (v1)
- **Variation Amendments section:** Shows all variations that modified the baseline with:
  - Link to the variation (e.g., VAR-001)
  - Version indicator (→ v2, → v3, etc.)
  - Date range changes
  - Cost change (+/- indicator with color coding)
  - Variation title/reason
- **Current Baseline summary:** Shows the current cumulative baseline values after all variations
- Section labels and version badges for clarity

#### Data Migration
- New migration `20251217_backfill_original_baseline_versions.sql`
- Backfills v1 records for existing locked milestones without baseline history
- Reconstructs original values from variation records where possible

### Technical Details

**Data Model Clarification:**
- `milestone_baseline_versions.version = 1` with `variation_id = NULL` = Original signed commitment
- `milestone_baseline_versions.version > 1` with `variation_id` set = Variation amendment
- Current baseline = Original + Sum of all applied variations

**Files Changed:**
- `src/services/milestones.service.js` (v2.2) - Create v1 on baseline lock
- `src/pages/MilestoneDetail.jsx` (v4.4) - New baseline commitment UI structure
- `src/pages/MilestoneDetail.css` - Styles for amendments section
- `supabase/migrations/20251217_backfill_original_baseline_versions.sql` - Data migration

---

## [0.9.1] - 2025-12-17

### Fixed

#### Variations - Baseline Update Bug
- **Critical Fix:** `applyVariation()` now correctly updates milestone fields when a variation is applied:
  - `baseline_billable` (was incorrectly updating `billable` instead)
  - `forecast_end_date`, `forecast_billable`, `start_date` (were not being updated at all)
  - `billable` (now also updated to reflect new contract value)
- Data migration applied to fix 2 milestones affected by previously applied variations

### Added

#### Milestone Baseline History UI
- New collapsible "Baseline History" section on Milestone Detail page
- Timeline view showing all baseline versions with:
  - Version number and "Original Baseline" / "Current" badges
  - Link to the variation that caused each change
  - Period (start - end dates) and billable amount for each version
  - Change amount between versions (+ or - indicator)
  - Variation title/reason
  - Signature timestamps
- Version indicator badge in Schedule section header (e.g., "v2")
- Clickable variation link icon to navigate to source variation

### Changed

#### Variations Service (v1.2)
- `applyVariation()` method now updates all relevant milestone fields
- Added inline comments documenting field purposes (baseline vs forecast vs billable)

#### Milestone Detail Page (v4.3)
- Imports `variationsService` for baseline history
- New state: `baselineHistory`, `historyExpanded`
- Fetches baseline history on page load via `getMilestoneBaselineHistory()`

---

## [0.9.0] - 2025-12-16

### Added

#### Workflow Service Layer
- New centralised `src/services/workflow.service.js` for all workflow operations
- 13 workflow categories covering all entity types:
  - Timesheets (1 category)
  - Expenses (2 categories: chargeable, non-chargeable)
  - Deliverables (3 categories: review, supplier sign-off, customer sign-off)
  - Variations (3 categories: submitted, awaiting supplier, awaiting customer)
  - Certificates (2 categories: pending supplier, pending customer)
  - Baselines (2 categories: awaiting supplier, awaiting customer)
- Role-based filtering methods: `getItemsForRole()`, `getItemsVisibleToRole()`
- Deep linking URLs with `?highlight=uuid` parameter for direct item access
- Accurate days pending calculation from actual database timestamps

#### Workflow Summary Page Enhancements
- 8 stat cards (Total, Timesheets, Expenses, Deliverables, Variations, Baselines, Certificates, Urgent)
- Clickable stat cards filter the table to show only that category
- "Your Action" vs "Info Only" column showing role-based responsibility
- "Show only my actions" toggle filter
- Visual distinction: green background for actionable rows
- Green "Act" button vs blue "View" button
- New icons: GitBranch (variations), Lock (baselines)

#### Notification Bell Improvements
- Green badge for actionable items count
- Shows "X actions for you" prominently in header
- Left border indicator for actionable items in dropdown
- Badge color priority: red (urgent actions) > green (actions) > amber (urgent info) > blue (info)
- Real timestamps replacing "Just now" bug

### Changed

#### NotificationContext
- Uses `workflowService` instead of direct Supabase queries
- Filters by current project from `ProjectContext`
- Shows real timestamps from database
- Includes all 13 workflow categories
- Refreshes when project changes

#### WorkflowSummary Page
- Uses `useProject()` hook instead of hardcoded "AMSF001"
- All data fetched through `workflowService`
- Removed direct Supabase queries

### Fixed
- "Just now" timestamp bug - now shows actual submission dates
- Hardcoded project ID - now uses current project from context
- Missing workflow entities - added variations, deliverable sign-offs, baseline signatures

---

## [0.8.0] - 2025-12-16

### Added
- Role permission matrix for deliverable workflows
- Entity permission hook consolidation plan (TD-001)
- Z-index scale standardisation plan (TD-002)

### Fixed
- Customer PM deliverable permissions (Issues #5, #6)
- Project Switcher dropdown z-index (appearing behind page headers)

---

## [0.7.0] - 2025-12-15

### Added
- Multi-tenancy roadmap documentation
- E2E testing status reports

### Changed
- Vite security investigation completed - confirmed v5.4.21 is fully patched
- Branch cleanup - deleted stale feature branches

### Fixed
- Unit test configuration - all 515 tests now passing
- Legacy test user cleanup

---

## [0.6.0] - 2025-12-14

### Added
- Project state assessment checklist
- AI prompt context documentation (v2)
- E2E testing status report
- Test infrastructure documentation

### Changed
- Documentation cleanup - archived 21 historical files
- Test data seeding improvements

### Fixed
- Duplicate seed data cleanup
- Finance user profile misconfiguration

---

## Version History Notes

- **0.9.x** - Workflow System Enhancement Phase
- **0.8.x** - Permission Refinement Phase
- **0.7.x** - Security & Testing Phase
- **0.6.x** - Documentation & State Assessment Phase
- **0.5.x** - E2E Testing Infrastructure Phase
- **0.4.x** - Multi-tenancy Preparation Phase
- **0.3.x** - Feature Development Phase
- **0.2.x** - Core Functionality Phase
- **0.1.x** - Initial Development Phase

---

## Unreleased

### Planned for 0.9.1
- Segment 5: Testing & Polish
  - E2E tests for workflow system
  - Loading states for workflow fetches
  - Error handling improvements
  - Mobile responsive layout verification
  - Empty state messages per category
  - Accessibility improvements

---

*For detailed implementation notes, see `/docs/WORKFLOW-IMPLEMENTATION-PROGRESS.md`*
