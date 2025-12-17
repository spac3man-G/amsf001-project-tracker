# Changelog

All notable changes to the AMSF001 Project Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
