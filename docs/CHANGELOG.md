# Changelog

All notable changes to the AMSF001 Project Tracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
