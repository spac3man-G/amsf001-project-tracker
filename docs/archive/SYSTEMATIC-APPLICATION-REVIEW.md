# Systematic Application Review: Benchmarking, Planning & Estimator

**Document:** SYSTEMATIC-APPLICATION-REVIEW.md  
**Created:** 28 December 2025  
**Last Updated:** 28 December 2025  
**Status:** Complete - Phase 7 (Final Summary)
**Last Review Session:** 28 December 2025  
**Purpose:** Comprehensive review of three new tools and their integration status

---

## Executive Summary

This document provides a systematic review framework for three interconnected tools in the AMSF001 Project Tracker:

1. **Benchmarking** - UK market rate comparison by role/skill/SFIA level (SFIA 8 framework)
2. **Planning** - Project planning with AI-assisted structure generation
3. **Estimator** - Cost estimation linked to planning and benchmarks

The review will assess implementation status, documentation gaps, testing coverage, and integration points, and identify which technical specification documents require updates.

### Implementation Summary

| Tool | Implementation Date | Status | Test Coverage | Review Status |
|------|---------------------|--------|---------------|---------------|
| Benchmarking | Dec 26-27, 2025 | ✅ Complete | ❌ None | ✅ Complete |
| Planning | Dec 25-26, 2025 | ✅ Complete | ❌ None | ✅ Complete |
| Estimator | Dec 26-27, 2025 | ✅ Complete (bugs fixed) | ❌ None | ✅ Complete |

### Scope Summary (Phase 1 Complete)

| Metric | Benchmarking | Planning | Estimator | **Total** |
|--------|--------------|----------|-----------|-----------|
| Page Files | 1 (19KB) | 2 (55KB) | 1 (46KB) | **4 (120KB)** |
| Components | 0 | 2 (28KB) | 0 | **2 (28KB)** |
| Services | 1 (11KB) + 1 ref (23KB) | 1 (13KB) | 1 (27KB) | **4 (74KB)** |
| API Endpoints | 0 | 1 (17KB) | 0 | **1 (17KB)** |
| **Source Total** | **~53KB** | **~113KB** | **~73KB** | **~239KB** |
| Migrations | 8 (~159KB) | 2 (~8KB) | 2 (~14KB) | **12 (~181KB)** |
| DB Tables | 1 | 1 (+1 ALTER) | 4 | **6 new tables** |
| RLS Policies | 2 | 4 | 16 | **22 new policies** |
| DB Functions | 1 | 4 | 1 | **6 new functions** |
| DB Views | 0 | 1 | 0 | **1 new view** |
| Service Methods | 8 async + 14 helpers | 18 | 14 + 4 private | **44+ methods** |
| Tests | ❌ None | ❌ None | ❌ None | **❌ None** |

---

## Master Checklist

### Phase 1: Discovery & Inventory ✅ COMPLETE
- [x] **1.1a** Inventory Benchmarking tool files ✅
- [x] **1.1b** Inventory Planning tool files ✅
- [x] **1.1c** Inventory Estimator tool files ✅
- [x] **1.2** Verify database migrations applied ✅ All 12 applied
- [x] **1.3** Verify service layer completeness ✅
- [x] **1.4** Verify navigation and routing ✅
- [x] **1.5** Update plan with final scope ✅

### Phase 2: Benchmarking Tool Review ✅ COMPLETE
- [x] **2.1** Database schema analysis ✅ 1 table, 5 indexes, 2 RLS policies, 1 trigger
- [x] **2.2** Service layer review ✅ 8 async methods, 14+ helper functions
- [x] **2.3** UI/UX review ✅ 19KB, full filter panel, collapsible categories
- [x] **2.4** SFIA8 integration assessment ✅ 97 skills, 6 categories, 4 tiers complete
- [x] **2.5** Documentation gap analysis ✅ See findings below
- [x] **2.6** Testing coverage assessment ✅ None found
- [x] **2.7** CHANGELOG draft ✅ Prepared

### Phase 3: Planning Tool Review ✅ COMPLETE
- [x] **3.1** Database schema analysis ✅ 1 table, 6 indexes, 4 RLS policies, 4 functions, 1 view
- [x] **3.2** Service layer review ✅ 18 methods including batch create
- [x] **3.3** UI/UX review ✅ 33KB, Excel-like grid, keyboard navigation
- [x] **3.4** AI Assistant review ✅ 22KB, document upload, structure preview
- [x] **3.5** API endpoint review ✅ 17KB, Claude Sonnet 4.5, 120s timeout
- [x] **3.6** Integration components review ✅ 2 modals (28KB total)
- [x] **3.7** Documentation gap analysis ✅ See findings below
- [x] **3.8** Testing coverage assessment ✅ None found
- [x] **3.9** CHANGELOG draft ✅ Prepared

### Phase 4: Estimator Tool Review ✅ COMPLETE
- [x] **4.1** Database schema analysis ✅ 4 tables, 10 indexes, 16 RLS policies, 1 function
- [x] **4.2** Service layer review ✅ 14 public + 4 private methods
- [x] **4.3** UI/UX review ✅ 46KB, component cards, SFIA 8 selector
- [x] **4.4** Benchmark rates integration ⚠️ **BUG-001 Found: Tier mismatch**
- [x] **4.5** Planning tool integration ✅ Bidirectional linking working
- [x] **4.6** Documentation gap analysis ✅ See findings below
- [x] **4.7** Testing coverage assessment ✅ None found
- [x] **4.8** CHANGELOG draft ✅ Prepared

### Phase 5: Integration Review ✅ COMPLETE
- [x] **5.1** Planning ↔ Estimator integration ✅ Bidirectional linking, modals, view working
- [x] **5.2** Estimator ↔ Benchmarking integration ⚠️ **BUG-002 Found: Missing buildRateLookup method**
- [x] **5.3** Navigation and routing review ✅ All routes configured in Tools section
- [x] **5.4** Permission/access control review ⚠️ **CS-002 Found: URL access gap**
- [x] **5.5** Cross-tool data flow verification ✅ FK relationships working

### Phase 6: Documentation Updates ✅ COMPLETE
- [x] **6.1** Update TECH-SPEC-02 (6 tables) ✅ v4.0
- [x] **6.2** Update TECH-SPEC-05 (22 policies) ✅ v4.0
- [x] **6.3** Update TECH-SPEC-06 (API endpoint) ✅ v1.3
- [x] **6.4** Update TECH-SPEC-07 (pages/components) ✅ v5.0
- [x] **6.5** Update TECH-SPEC-08 (4 services) ✅ v4.0
- [ ] **6.6** Update TECH-SPEC-09 (test gaps) - Deferred (no new tests)
- [x] **6.7** Update CHANGELOG.md ✅ v0.9.10
- [ ] **6.8** Update AMSF001-Technical-Specification.md - Deferred
- [ ] **6.9** Update TECHNICAL-DEBT-AND-FUTURE-FEATURES.md - Deferred
- [ ] **6.10** Reconcile archived planning docs - N/A
- [ ] **6.11** Create/update user guides if needed - Deferred

### Phase 7: Final Summary ✅ COMPLETE
- [x] **7.1** Compile findings summary ✅
- [x] **7.2** Document known issues/bugs ✅ All fixed
- [x] **7.3** Identify future enhancements ✅ Testing coverage needed
- [x] **7.4** Commit all documentation updates ✅
- [x] **7.5** Create handover summary ✅

---

## Session Log

| Session | Date | Sections Completed | Notes |
|---------|------|-------------------|-------|
| 1 | 28 Dec 2025 | Pre-review setup | Created plan, fixed archive (restored TECH-SPEC-06/07/08) |
| 1 (cont) | 28 Dec 2025 | Phase 1 complete | All file inventories, migrations verified, routing confirmed |
| 1 (cont) | 28 Dec 2025 | Phase 2 complete | Benchmarking: 1 table, 8 methods, SFIA8 complete |
| 1 (cont) | 28 Dec 2025 | Phase 3 complete | Planning: 1 table, 18 methods, AI + doc upload, 2 modals |
| 1 (cont) | 28 Dec 2025 | Phase 4 complete | Estimator: 4 tables, 14 methods, **BUG-001 found** |
| 1 (cont) | 28 Dec 2025 | Phase 5 complete | Integration: **BUG-002**, **ISSUE-001** found |
| 2 | 28 Dec 2025 | Phase 5 fixes | ✅ BUG-001: Migration deployed, ✅ BUG-002: Method added, ✅ ISSUE-001: Routes fixed |
| 2 (cont) | 28 Dec 2025 | Phase 6 complete | TECH-SPEC-02,04,05,06,07,08 updated, CHANGELOG updated |
| 2 (cont) | 28 Dec 2025 | Phase 7 complete | Final review, systematic review doc updated |

---

## Phase 2: Benchmarking Tool Review ✅ COMPLETE

### 2.1 Database Schema

**Table: `benchmark_rates`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `skill_id` | VARCHAR(10) | NOT NULL | SFIA skill code |
| `skill_name` | VARCHAR(100) | NOT NULL | Full skill name |
| `skill_code` | VARCHAR(10) | NOT NULL | SFIA code |
| `subcategory_id` | VARCHAR(10) | NOT NULL | SFIA subcategory |
| `category_id` | VARCHAR(10) | NOT NULL | SFIA category |
| `sfia_level` | INTEGER | CHECK 1-7 | Responsibility level |
| `tier_id` | VARCHAR(20) | NOT NULL | Supplier tier |
| `tier_name` | VARCHAR(50) | NOT NULL | Tier display name |
| `day_rate` | DECIMAL(10,2) | NOT NULL | Day rate in GBP |
| `source` | VARCHAR(200) | - | Rate source |
| `effective_date` | DATE | DEFAULT NOW | When rate effective |
| `notes` | TEXT | - | Optional notes |
| `created_at`, `updated_at` | TIMESTAMPTZ | DEFAULT NOW | Timestamps |

**Unique Constraint:** `(skill_id, sfia_level, tier_id)`

**Indexes (5):** skill_id, category_id, subcategory_id, sfia_level, tier_id

**RLS Policies (2):**
- "Anyone can read benchmark rates" - SELECT with `USING (true)`
- "Admins can modify benchmark rates" - ALL with admin check

**Note:** This is global data (not project-scoped). Consider documenting in TECH-SPEC-04 instead of TECH-SPEC-02.

### 2.2 Service Layer

**File:** `benchmarkRates.service.js` (11KB)
**Class:** `BenchmarkRatesService` extends `BaseService`

**Async Methods (8):**

| Method | Purpose |
|--------|---------|
| `getAllRates(filters)` | Get all rates with optional filtering |
| `getRate(skillId, sfiaLevel, tierId)` | Get specific rate or calculate default |
| `getRatesGroupedByCategory()` | Hierarchical grouping for UI |
| `updateRate(id, dayRate, notes)` | Update existing rate |
| `upsertRate(...)` | Create or update rate |
| `getRateComparison(skillId, sfiaLevel)` | Compare across all tiers |
| `getStatistics()` | Summary stats (averages) |
| `getSummaryStats()` | Alias for getStatistics |

**Sync Methods (1):** `searchSkills(query)`

**Exported Helper Functions (14):**
`getSkillName`, `getSkillCode`, `getCategoryName`, `getCategoryColor`, `getSubcategoryName`, `getTierName`, `getTierColor`, `getLevelTitle`, `getLevelDescription`, `formatRate`, `calculatePremium`, `getSkillsForLevel`, `getLevelsForSkill`

### 2.3 Reference Data

**File:** `sfia8-reference-data.js` (23KB)

| Entity | Count | Details |
|--------|-------|---------|
| `SFIA_CATEGORIES` | 6 | SA, CT, DI, DO, SQ, RE |
| `SFIA_SUBCATEGORIES` | 19 | Mapped to categories |
| `SFIA_SKILLS` | 97 | Full SFIA 8 framework |
| `SFIA_LEVELS` | 7 | Follow → Set strategy |
| `TIERS` | 4 | Contractor, Boutique, Mid-tier, Big 4 |

**Rate Calculation:**
- Base rates: L1 £250/day → L7 £1,100/day
- Tier multipliers: Contractor 1.0x, Boutique 1.3x, Mid 1.5x, Big4 1.9x
- Skill premiums: ML +25%, Security +20%, Tech writing -15%

### 2.4 UI/UX

**File:** `Benchmarking.jsx` (19KB, ~600 lines)

**Features:**
- Header with stats (skills, rates, tiers count)
- Collapsible filter panel (category, subcategory, skill, level range, tier, search)
- Tier legend with color coding
- Category sections (collapsible)
- Rate tables with tier comparison and premium indicators
- Fallback to calculated rates if database empty

### 2.5 Documentation Gaps (Benchmarking)

| ID | Document | Gap | Priority |
|----|----------|-----|----------|
| DG-B01 | TECH-SPEC-02 or 04 | benchmark_rates table | Critical |
| DG-B02 | TECH-SPEC-05 | 2 RLS policies | High |
| DG-B03 | TECH-SPEC-07 | Benchmarking.jsx page | High |
| DG-B04 | TECH-SPEC-08 | benchmarkRatesService (8 methods) | Critical |
| DG-B05 | TECH-SPEC-08 | sfia8-reference-data.js | Critical |
| DG-B06 | CHANGELOG | v0.9.10 Benchmarking entries | Critical |

---

## Phase 3: Planning Tool Review ✅ COMPLETE

### 3.1 Database Schema

**Table: `plan_items`**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `project_id` | UUID | FK → projects | Project ownership |
| `parent_id` | UUID | FK → plan_items | Self-reference hierarchy |
| `item_type` | TEXT | CHECK | 'task', 'milestone', 'deliverable' |
| `name` | TEXT | NOT NULL | Item name |
| `description` | TEXT | - | Description |
| `start_date`, `end_date` | DATE | - | Schedule dates |
| `duration_days` | INTEGER | - | Duration |
| `progress` | INTEGER | CHECK 0-100 | Completion % |
| `status` | TEXT | CHECK | not_started, in_progress, completed, on_hold, cancelled |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |
| `wbs` | TEXT | - | Work breakdown structure |
| `indent_level` | INTEGER | DEFAULT 0 | Hierarchy depth |
| `milestone_id` | UUID | FK → milestones | Link to milestone |
| `deliverable_id` | UUID | FK → deliverables | Link to deliverable |
| `assigned_resource_id` | UUID | FK → resources | Assigned person |
| `estimate_component_id` | UUID | FK → estimate_components | Link to estimate |
| `created_at`, `updated_at` | TIMESTAMPTZ | - | Timestamps |
| `created_by` | UUID | FK → auth.users | Creator |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete |

**Indexes (6):** project_id, parent_id, milestone_id, deliverable_id, sort_order, estimate_component_id

**RLS Policies (4):** SELECT, INSERT, UPDATE, DELETE via `can_access_project()`

**Functions (4):**
- `update_plan_items_updated_at()` - Trigger
- `recalculate_wbs(p_project_id)` - WBS numbering
- `link_plan_item_to_estimate()` - Linking
- `unlink_plan_item_from_estimate()` - Unlinking

**View (1):** `plan_items_with_estimates` - Denormalized with estimate data

### 3.2 Service Layer

**File:** `planItemsService.js` (13KB)
**Pattern:** Object with async methods (not class-based)

**Methods (18):**

| Category | Methods |
|----------|---------|
| CRUD | `getAll`, `getAllWithEstimates`, `getById`, `create`, `update`, `delete` |
| Hierarchy | `reorder`, `indent`, `outdent` |
| Entity Linking | `linkToMilestone`, `linkToDeliverable` |
| Estimate Linking | `linkToEstimateComponent`, `unlinkFromEstimateComponent`, `getByEstimateComponent`, `getUnlinkedItems` |
| Batch | `createBatch` (for AI structures) |
| Helpers | `getProjectMilestones`, `getProjectDeliverables` |

**Note:** Not exported in `services/index.js` - uses direct import pattern (CS-001)

### 3.3 UI/UX (Planning.jsx)

**File:** `Planning.jsx` (33KB, ~650 lines)

**Excel-like Grid Features:**
- Cell navigation (Arrow keys, Tab, Enter)
- Cell editing (F2, double-click, type to start)
- Cell selection with visual indicator
- Auto-add rows on navigate past last
- Inline dropdowns for Type and Status

**Columns (10):**
1. Grip handle
2. WBS number
3. Name (editable)
4. Type (dropdown)
5. Start Date (date picker)
6. End Date (date picker)
7. Progress (0-100 with bar)
8. Status (dropdown)
9. Estimate (link button/badge)
10. Actions (indent/outdent/delete)

**Integrations:**
- Estimate summary widget
- Estimates list panel
- PlanningAIAssistant slide-out
- EstimateLinkModal, EstimateGeneratorModal

### 3.4 AI Assistant (PlanningAIAssistant.jsx)

**File:** `PlanningAIAssistant.jsx` (22KB, ~620 lines)

**Sub-components:** ChatMessage, ClarificationQuestions, StructureTreeItem, StructurePreview, QuickPrompts, DocumentUpload

**Quick Prompts (2 sets):**
- Standard: Software, Marketing, Product launch, Migration
- Document: Create plan, Extract deliverables, Build timeline, Summarize scope

**Document Upload:**
- Formats: PDF, JPEG, PNG, WebP, GIF
- Max size: 10MB
- Drag-and-drop + click
- Base64 encoding for API

### 3.5 API Endpoint

**File:** `api/planning-ai.js` (17KB, ~340 lines)

**Configuration:**
- Runtime: Node.js (Vercel)
- Max Duration: 120 seconds (Pro tier)
- Model: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)
- Max Tokens: 4,096

**Tools (3):**
- `generateProjectStructure` - New plans
- `refineStructure` - Modify existing
- `askClarification` - Request more info

**Token Costs:** $3/1M input, $15/1M output (logged per request)

### 3.6 Integration Components

**EstimateGeneratorModal.jsx (14KB):**
- Generate estimates from plan structure
- Tree preview with selection
- Component mode toggle
- Auto-linking to plan items

**EstimateLinkModal.jsx (14KB):**
- Link/unlink plan items to estimates
- Browse existing estimates
- Create new estimate option

### 3.7 Documentation Gaps (Planning)

| ID | Document | Gap | Priority |
|----|----------|-----|----------|
| DG-P01 | TECH-SPEC-02 | plan_items table | Critical |
| DG-P02 | TECH-SPEC-05 | 4 RLS policies | High |
| DG-P03 | TECH-SPEC-06 | /api/planning-ai.js endpoint | Critical |
| DG-P04 | TECH-SPEC-07 | Planning.jsx (33KB) | Critical |
| DG-P05 | TECH-SPEC-07 | PlanningAIAssistant.jsx (22KB) | Critical |
| DG-P06 | TECH-SPEC-07 | EstimateGeneratorModal, EstimateLinkModal | High |
| DG-P07 | TECH-SPEC-08 | planItemsService (18 methods) | Critical |
| DG-P08 | CHANGELOG | v0.9.10 Planning entries | Critical |

---

## Phase 4: Estimator Tool Review ✅ COMPLETE

### 4.1 Database Schema

**Table 1: `estimates` (Header)**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `project_id` | UUID | FK → projects, NOT NULL | Project ownership |
| `name` | TEXT | NOT NULL | Estimate name |
| `description` | TEXT | - | Description |
| `reference_number` | TEXT | - | e.g., 'EST-001' |
| `status` | TEXT | CHECK | draft, submitted, approved, rejected, archived |
| `total_days` | DECIMAL(10,2) | DEFAULT 0 | Denormalized total |
| `total_cost` | DECIMAL(12,2) | DEFAULT 0 | Denormalized total |
| `component_count` | INTEGER | DEFAULT 0 | Denormalized count |
| `plan_item_id` | UUID | FK → plan_items | Link to plan |
| `notes`, `assumptions`, `exclusions` | TEXT | - | Documentation |
| `created_at`, `updated_at` | TIMESTAMPTZ | DEFAULT NOW | Timestamps |
| `created_by` | UUID | FK → auth.users | Creator |
| `submitted_at`, `approved_at` | TIMESTAMPTZ | - | Workflow timestamps |
| `approved_by` | UUID | FK → auth.users | Approver |
| `is_deleted`, `deleted_at`, `deleted_by` | - | - | Soft delete |

**Table 2: `estimate_components` (Groups)**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `estimate_id` | UUID | FK → estimates, NOT NULL | Parent estimate |
| `name` | TEXT | NOT NULL | Component name |
| `description` | TEXT | - | Description |
| `quantity` | INTEGER | DEFAULT 1, CHECK ≥1 | Multiplier |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |
| `plan_item_id` | UUID | FK → plan_items | Link to plan |
| `total_days`, `total_cost` | DECIMAL | DEFAULT 0 | Denormalized |
| `created_at`, `updated_at` | TIMESTAMPTZ | - | Timestamps |

**Table 3: `estimate_tasks` (Work Items)**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `component_id` | UUID | FK → estimate_components, NOT NULL | Parent component |
| `name` | TEXT | NOT NULL | Task name |
| `description` | TEXT | - | Description |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |
| `plan_item_id` | UUID | FK → plan_items | Link to plan |
| `total_days`, `total_cost` | DECIMAL | DEFAULT 0 | Denormalized |
| `created_at`, `updated_at` | TIMESTAMPTZ | - | Timestamps |

**Table 4: `estimate_resources` (Effort)**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `task_id` | UUID | FK → estimate_tasks, NOT NULL | Parent task |
| `component_id` | UUID | FK → estimate_components, NOT NULL | Parent component |
| `role_id` | TEXT | NOT NULL | Role identifier |
| `skill_id` | TEXT | NOT NULL | SFIA skill ID |
| `sfia_level` | INTEGER | NOT NULL | SFIA level 1-7 |
| `tier` | TEXT | CHECK | ⚠️ **BUG-001**: Uses wrong values |
| `day_rate` | DECIMAL(10,2) | NOT NULL | Rate snapshot |
| `effort_days` | DECIMAL(10,2) | DEFAULT 0 | Effort allocation |
| `cost` | DECIMAL(12,2) | GENERATED | `effort_days * day_rate` |
| `created_at`, `updated_at` | TIMESTAMPTZ | - | Timestamps |

**Unique Constraint:** `(task_id, role_id, skill_id, sfia_level, tier)`

### Indexes (10)

| Table | Index | Column(s) |
|-------|-------|-----------|
| estimates | idx_estimates_project | project_id |
| estimates | idx_estimates_status | status |
| estimates | idx_estimates_plan_item | plan_item_id |
| estimates | idx_estimates_is_deleted | is_deleted |
| estimate_components | idx_estimate_components_estimate | estimate_id |
| estimate_components | idx_estimate_components_plan_item | plan_item_id |
| estimate_tasks | idx_estimate_tasks_component | component_id |
| estimate_tasks | idx_estimate_tasks_plan_item | plan_item_id |
| estimate_resources | idx_estimate_resources_task | task_id |
| estimate_resources | idx_estimate_resources_component | component_id |

### RLS Policies (16)

| Table | Policies | Pattern |
|-------|----------|---------|
| estimates | 4 (SELECT, INSERT, UPDATE, DELETE) | `can_access_project(project_id)` |
| estimate_components | 4 | JOIN to estimates → `can_access_project()` |
| estimate_tasks | 4 | JOIN components → estimates → `can_access_project()` |
| estimate_resources | 4 | JOIN components → estimates → `can_access_project()` |

### Triggers (4)

All tables have `updated_at` trigger using existing `update_updated_at()` function.

### Functions (1)

**`recalculate_estimate_totals(p_estimate_id)`**
- Updates task totals from resources
- Updates component totals from resources
- Updates estimate header with quantity-adjusted totals
- SECURITY DEFINER

### 4.2 Service Layer

**File:** `estimates.service.js` (27KB)
**Class:** `EstimatesService` extends `BaseService`
**Export:** Singleton + Class + Constants

**Exported Constants:**
```javascript
ESTIMATE_STATUS = { DRAFT, SUBMITTED, APPROVED, REJECTED, ARCHIVED }
ESTIMATE_STATUS_CONFIG = { [status]: { label, color, icon } }
```

**Public Methods (14):**

| Category | Method | Purpose |
|----------|--------|---------|
| **CRUD** | `getAll(projectId, options)` | List estimates (inherited) |
| | `getWithDetails(estimateId)` | Full nested structure |
| | `saveFullEstimate(projectId, estimateData)` | Complex upsert |
| | `duplicateEstimate(estimateId, newName)` | Copy entire estimate |
| **Status** | `updateStatus(estimateId, status)` | Workflow transitions |
| **Linking** | `linkToPlanItem(estimateId, planItemId)` | Link estimate header |
| | `linkComponentToPlanItem(componentId, planItemId)` | Link component |
| **Transform** | `toUIFormat(dbEstimate)` | DB → UI format |
| **Queries** | `getSummaryList(projectId)` | Summary for listing |
| | `generateReferenceNumber(projectId)` | Next EST-00X |
| | `recalculateTotals(estimateId)` | Calls DB function |
| **Generation** | `createFromPlanStructure(projectId, planItems, options)` | Generate from plan |

**Private Methods (4):**

| Method | Purpose |
|--------|---------|
| `_saveComponentTasks()` | Save tasks during full save |
| `_saveComponentResources()` | Save resources during full save |
| `_buildPlanHierarchy()` | Convert flat → tree for generation |
| `_linkPlanItemsToComponents()` | Bidirectional linking |

**Data Transform Pattern:**
- **DB Format:** resources stored per task with full key (role_id, skill_id, sfia_level, tier)
- **UI Format:** resourceTypes at component level (unique combinations), efforts[resourceTypeId] at task level

### 4.3 UI/UX

**File:** `Estimator.jsx` (46KB, ~950 lines)

**Sub-components (3):**
- `ResourceTypeSelector` - SFIA 8 skill/level/tier picker
- `ComponentCard` - Collapsible component with effort grid
- `EstimateSelector` - Dropdown for load/new/duplicate/delete

**State Management (11 state variables):**
- `rateLookup`, `ratesLoading`, `ratesError`, `ratesSource`
- `estimate`, `availableEstimates`, `expandedComponents`
- `isLoading`, `isSaving`, `hasUnsavedChanges`, `lastSavedAt`

**Key Features:**
- Rate loading: DB → fallback to `FALLBACK_RATE_LOOKUP`
- Resource selector: SFIA 8 hierarchy (category → subcategory → skill → level → tier)
- Effort grid: Tasks (rows) × Resource types (columns)
- Real-time totals at row, column, component, and estimate levels
- Component quantity multiplier
- Unsaved changes indicator
- URL parameter support (`?estimateId=xxx`)
- Back to Planning navigation

### 4.4 Benchmark Rates Integration

**Integration Points:**

| Component | Integration Method | Status |
|-----------|-------------------|--------|
| Estimator.jsx | `benchmarkRatesService.buildRateLookup()` | ✅ Works |
| Estimator.jsx | Imports TIERS, SFIA_SKILLS from services | ✅ Works |
| ResourceTypeSelector | Uses SFIA 8 hierarchy for selection | ✅ Works |
| Fallback data | `FALLBACK_RATE_LOOKUP` in Estimator.jsx | ✅ Works |

### 4.5 Planning Tool Integration

**Bidirectional Linking:**

| Direction | Method | Location |
|-----------|--------|----------|
| Planning → Estimator | `planItemsService.linkToEstimateComponent()` | Planning modals |
| Planning → Estimator | `planItemsService.unlinkFromEstimateComponent()` | Planning modals |
| Estimator → Planning | `estimatesService.linkToPlanItem()` | Service |
| Estimator → Planning | `estimatesService.linkComponentToPlanItem()` | Service |
| Both | `createFromPlanStructure()` | Generate + auto-link |

**Data Flow:**
```
Plan Item (plan_items)
    ↓ estimate_component_id (FK)
Estimate Component (estimate_components)
    ↓ plan_item_id (FK) [optional reverse link]
```

### 4.6 Documentation Gaps (Estimator)

| ID | Document | Gap | Priority |
|----|----------|-----|----------|
| DG-E01 | TECH-SPEC-02 | 4 tables: estimates, estimate_components, estimate_tasks, estimate_resources | Critical |
| DG-E02 | TECH-SPEC-05 | 16 RLS policies (4 per table) | Critical |
| DG-E03 | TECH-SPEC-05 | Missing `recalculate_estimate_totals` function | High |
| DG-E04 | TECH-SPEC-07 | Estimator.jsx (46KB) | Critical |
| DG-E05 | TECH-SPEC-08 | EstimatesService (14 methods + constants) | Critical |
| DG-E06 | CHANGELOG | v0.9.10 Estimator entries | Critical |

### 4.7 Testing Coverage

❌ No tests found for:
- EstimatesService methods
- Estimator UI interactions
- Planning ↔ Estimator integration
- Rate lookup and calculation

---

## Phase 5: Integration Review ✅ COMPLETE

### 5.1 Planning ↔ Estimator Integration ✅

**Integration Components:**

| Component | Purpose | Status |
|-----------|---------|--------|
| `EstimateGeneratorModal` | Generate estimate from plan structure | ✅ Working |
| `EstimateLinkModal` | Link/unlink plan items to components | ✅ Working |
| `plan_items_with_estimates` view | Denormalized query support | ✅ Working |
| `link_plan_item_to_estimate()` | DB function for linking | ✅ Working |
| `unlink_plan_item_from_estimate()` | DB function for unlinking | ✅ Working |

**Data Flow Verified:**
1. Planning → Generate Estimate → Estimator (with auto-navigation)
2. Planning → Link to Existing Component → Estimate summary displayed
3. Estimator → `createFromPlanStructure()` → Auto-links plan items

### 5.2 Estimator ↔ Benchmarking Integration ⚠️

**Integration Points:**

| Integration | Method | Status |
|-------------|--------|--------|
| Rate lookup from DB | `benchmarkRatesService.buildRateLookup()` | ⚠️ **BUG-002** |
| SFIA 8 reference data | Import from `sfia8-reference-data.js` | ✅ Working |
| Fallback rates | `FALLBACK_RATE_LOOKUP` constant | ✅ Working |
| Resource selector | Uses SFIA 8 hierarchy | ✅ Working |

⚠️ **BUG-002:** The `buildRateLookup()` method doesn't exist, so database rates are never loaded.

### 5.3 Navigation and Routing ✅

**Routes Configured:**

| Tool | Path | Access Roles | Section |
|------|------|--------------|--------|
| Planning | `/planning` | Admin, Supplier PM, Customer PM | tools |
| Benchmarking | `/benchmarking` | Admin, Supplier PM | tools |
| Estimator | `/estimator` | Admin, Supplier PM | tools |

**Cross-Navigation:**
- Estimator has "Back to Planning" link (←)
- `EstimateGeneratorModal` navigates to `/estimator?estimateId=xxx`
- `EstimateLinkModal` can navigate to Estimator

### 5.4 Permission/Access Control ⚠️

**Route Protection Analysis:**

| Tool | Route | Protection | Role Enforcement |
|------|-------|------------|------------------|
| Planning | `/planning` | `<ProtectedRoute>` | Navigation only |
| Benchmarking | `/benchmarking` | `<ProtectedRoute>` | Navigation only |
| Estimator | `/estimator` | `<ProtectedRoute>` | Navigation only |

⚠️ **ISSUE-001:** Routes don't use `requiredRoles` prop - users who know URLs can access pages they shouldn't.

**Recommended Fix:**
```jsx
<Route path="/benchmarking" element={
  <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}><Benchmarking /></ProtectedRoute>
} />
```

### 5.5 Cross-Tool Data Flow ✅

**Data Flow Diagram:**

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   BENCHMARKING  │     │      PLANNING        │     │    ESTIMATOR    │
│                 │     │                      │     │                 │
│ benchmark_rates │     │    plan_items        │     │    estimates    │
│   (global)      │     │ (project-scoped)     │     │ (project-scoped)│
└────────┬────────┘     └──────────┬───────────┘     └────────┬────────┘
         │                         │                          │
         │ buildRateLookup()       │ estimate_component_id    │
         │ (⚠️ BUG-002)            │ (FK to components)       │
         ▼                         ▼                          │
┌─────────────────────────────────────────────────────────────┤
│                       ESTIMATOR UI                          │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐│
│  │  Rate Lookup │   │ Plan Items   │   │ Estimate         ││
│  │  (for costs) │   │ (structure)  │   │ Components/Tasks ││
│  └──────────────┘   └──────────────┘   └──────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Foreign Key Relationships Verified:**

| Source Table | Column | Target Table | ON DELETE |
|--------------|--------|--------------|------------|
| plan_items | estimate_component_id | estimate_components | SET NULL |
| estimate_components | plan_item_id | plan_items | SET NULL |
| estimates | plan_item_id | plan_items | SET NULL |
| estimate_tasks | plan_item_id | plan_items | SET NULL |

---

## Findings Log

### Critical Issues

| ID | Tool | Description | Status |
|----|------|-------------|--------|
| CI-001 | All | No test coverage for any of the 3 new tools | Open - Tech Debt |
| CI-002 | All | 6 new tables not documented in TECH-SPECs | ✅ Fixed - Phase 6 |
| CI-003 | All | 22 RLS policies not documented in TECH-SPEC-05 | ✅ Fixed - Phase 6 |

### Bugs Found

| ID | Severity | Tool | Description | Status |
|----|----------|------|-------------|--------|
| **BUG-001** | **BLOCKING** | Estimator | `estimate_resources.tier` CHECK constraint mismatch | ✅ **FIXED** - Migration deployed |
| **BUG-002** | **HIGH** | Estimator | Missing `buildRateLookup()` method in BenchmarkRatesService | ✅ **FIXED** - Method added |

**BUG-002 Details:**

**Location:** `Estimator.jsx` line 819

**Code:**
```javascript
const lookup = await benchmarkRatesService.buildRateLookup();
```

**Problem:**
- `buildRateLookup()` method does not exist in `BenchmarkRatesService`
- The call fails silently (caught by try-catch) and falls back to `FALLBACK_RATE_LOOKUP`
- Database rates are **never actually loaded** into the Estimator

**Impact:**
- Estimator always uses hardcoded fallback rates
- Changes to benchmark rates in the database have no effect on Estimator

**Required Fix:** Add `buildRateLookup()` method to `BenchmarkRatesService` (see Appendix D)

---

**BUG-001 Details:**

**Database CHECK Constraint (202512261100_create_estimates.sql):**
```sql
tier TEXT NOT NULL CHECK (tier IN ('contractor', 'associate', 'top4'))
```

**SFIA 8 Reference Data (sfia8-reference-data.js):**
```javascript
TIERS = [
  { id: 'contractor', ... },
  { id: 'boutique', ... },
  { id: 'mid', ... },
  { id: 'big4', ... }
]
```

**Impact:**
- Saving estimates with `boutique`, `mid`, or `big4` tiers will fail with constraint violation
- Only `contractor` tier works (present in both)
- This is a **blocking bug** preventing normal Estimator usage

**Required Fix:**
```sql
-- Migration: Fix estimate_resources tier CHECK constraint
ALTER TABLE estimate_resources 
DROP CONSTRAINT estimate_resources_tier_check;

ALTER TABLE estimate_resources 
ADD CONSTRAINT estimate_resources_tier_check 
CHECK (tier IN ('contractor', 'boutique', 'mid', 'big4'));
```

### Documentation Gaps (Consolidated)

| Document | Gaps | Priority |
|----------|------|----------|
| TECH-SPEC-02 | plan_items, estimates (4 tables) = 5 tables | Critical |
| TECH-SPEC-04 | benchmark_rates (global data) | Critical |
| TECH-SPEC-05 | 22 RLS policies (2 + 4 + 16) | Critical |
| TECH-SPEC-05 | 6 DB functions | High |
| TECH-SPEC-06 | /api/planning-ai.js | Critical |
| TECH-SPEC-07 | 4 pages + 2 components | Critical |
| TECH-SPEC-08 | 4 services (benchmark, planning, estimates, sfia8-ref) | Critical |
| CHANGELOG | v0.9.10 entries | Critical |

### Consistency Issues

| ID | Tool | Description | Severity |
|----|------|-------------|----------|
| CS-001 | Planning | planItemsService not exported in services/index.js | Low |

### Security Issues

| ID | Tool | Description | Status |
|----|------|-------------|--------|
| ISSUE-001 | All 3 Tools | Routes use `<ProtectedRoute>` without `requiredRoles` - relies only on navigation hiding | ✅ **FIXED** - requiredRoles added |

---

## CHANGELOG Draft

```markdown
## [0.9.10] - 2025-12-27

### Added

#### Benchmarking Tool (SFIA 8)
- New `/benchmarking` page for UK market rate comparison
- Full SFIA 8 framework: 97 skills, 6 categories, 19 subcategories
- 4 supplier tiers: Contractor, Boutique/SME, Mid-tier, Big 4/Global SI
- 7 responsibility levels with descriptions
- ~1,500+ rate combinations
- Filtering by category, subcategory, skill, level range, tier
- Search by skill name or code
- Tier premium indicators (% vs contractor)
- `benchmarkRates.service.js` with 8 async methods + 14 helpers
- `sfia8-reference-data.js` with complete SFIA 8 taxonomy
- Access restricted to Admin and Supplier PM roles

#### Planning Tool
- New `/planning` page with Excel-like grid interface
- Hierarchical plan items: milestones → deliverables → tasks
- Keyboard navigation (Tab, Enter, Arrow keys, F2)
- Type-to-edit, double-click, inline dropdowns
- Indent/outdent for hierarchy management
- Link to existing milestones and deliverables
- Estimate summary widget with cost/days totals
- Estimates list panel with quick actions
- `planItemsService.js` with 18 methods including batch create
- Access for Admin, Supplier PM, Customer PM

#### Planning AI Assistant
- Conversational AI panel for natural language planning
- Quick prompts for common project types
- Document upload support (PDF, JPEG, PNG, WebP, GIF up to 10MB)
- AI-generated project structures with durations
- Structure preview with collapsible tree
- Refine and apply actions
- `/api/planning-ai.js` endpoint with Claude Sonnet 4.5
- 120 second timeout for document processing

#### Estimator Tool
- New `/estimator` page for component-based cost estimation
- Component cards with collapsible effort grids
- Resource Type Selector using SFIA 8 hierarchy
- Excel-like grid: tasks (rows) × resource types (columns)
- Real-time totals at row, column, component, and estimate levels
- Component quantity multiplier for repeated items
- Save/Load/Duplicate/Delete estimates
- Unsaved changes indicator with auto-save warning
- Back to Planning navigation link
- URL parameter support (`?estimateId=xxx`)
- Fallback to calculated rates if database empty
- `EstimatesService` with 14 methods + status constants
- Access: Admin and Supplier PM only

#### Planning ↔ Estimator Integration
- `EstimateGeneratorModal` - Generate estimates from plan structure
- `EstimateLinkModal` - Link plan items to estimate components
- Bidirectional linking via `estimate_component_id` / `plan_item_id`
- `plan_items_with_estimates` view for denormalized queries

### Database

#### New Tables
- `plan_items` - Project planning hierarchy (22 columns)
- `benchmark_rates` - SFIA 8 rate card (15 columns)
- `estimates` - Estimate headers with status workflow (20 columns)
- `estimate_components` - Component groups with quantity (10 columns)
- `estimate_tasks` - Work items within components (9 columns)
- `estimate_resources` - Effort allocations with rate snapshot (11 columns)

#### RLS Policies (22 new)
- 2 for benchmark_rates (public read, admin write)
- 4 for plan_items (CRUD via can_access_project)
- 16 for estimates hierarchy (4 tables × 4 operations)

#### Functions (6 new)
- `recalculate_wbs(p_project_id)` - WBS numbering for plan items
- `link_plan_item_to_estimate()` - Link plan item to estimate component
- `unlink_plan_item_from_estimate()` - Remove plan-estimate link
- `update_plan_items_updated_at()` - Trigger function
- `update_benchmark_rates_timestamp()` - Trigger function
- `recalculate_estimate_totals(p_estimate_id)` - Denormalized totals

#### Views (1 new)
- `plan_items_with_estimates` - Denormalized plan + estimate data

#### Indexes (21 new)
- 5 for benchmark_rates
- 6 for plan_items
- 10 for estimates hierarchy

### Known Issues
- **BUG-001:** `estimate_resources.tier` CHECK constraint uses wrong values - requires migration fix

### Technical Debt
- No test coverage for Benchmarking, Planning, or Estimator tools
- planItemsService not exported in services/index.js
```

---

## Completed Actions Summary

**All Phases Complete - Review Finished 28 December 2025**

### Bug Fixes Applied:
1. ✅ **BUG-001** - Migration `202512281500_fix_estimate_resources_tier_check.sql` deployed
2. ✅ **BUG-002** - `buildRateLookup()` method added to `BenchmarkRatesService`
3. ✅ **ISSUE-001** - `requiredRoles` prop added to Planning, Benchmarking, Estimator routes

### Documentation Updated:
- TECH-SPEC-02 v4.0 - Planning & Estimator tables
- TECH-SPEC-04 v1.2 - benchmark_rates table
- TECH-SPEC-05 v4.0 - 22 RLS policies, 6 functions
- TECH-SPEC-06 v1.3 - Planning AI API endpoint
- TECH-SPEC-07 v5.0 - Planning & Estimator tools (Section 14)
- TECH-SPEC-08 v4.0 - Planning & Estimator services (Section 15)
- CHANGELOG v0.9.10 - Full release notes

### Remaining Technical Debt:
- CI-001: No test coverage for Benchmarking, Planning, Estimator tools
- CS-001: planItemsService not exported in services/index.js (low priority)

---

## Appendix A: Resume Prompts

### Resume Prompt (Review Complete)
```
The Systematic Application Review for AMSF001 Project Tracker is COMPLETE.

Please read: /Users/glennnickols/Projects/amsf001-project-tracker/docs/SYSTEMATIC-APPLICATION-REVIEW.md

Status: All 7 phases complete
Bugs fixed: BUG-001, BUG-002, ISSUE-001
Docs updated: TECH-SPEC-02,04,05,06,07,08, CHANGELOG

Remaining tech debt:
- CI-001: No tests for new tools
- CS-001: planItemsService not in index.js
```

---

## Appendix B: Key File Locations

| Category | Path |
|----------|------|
| Documentation | `/Users/glennnickols/Projects/amsf001-project-tracker/docs/` |
| Services | `/Users/glennnickols/Projects/amsf001-project-tracker/src/services/` |
| Pages | `/Users/glennnickols/Projects/amsf001-project-tracker/src/pages/` |
| Components | `/Users/glennnickols/Projects/amsf001-project-tracker/src/components/` |
| API | `/Users/glennnickols/Projects/amsf001-project-tracker/api/` |
| Migrations | `/Users/glennnickols/Projects/amsf001-project-tracker/supabase/migrations/` |

---

## Appendix C: Migration Fix for BUG-001

**File:** `supabase/migrations/202512281400_fix_estimate_resources_tier_check.sql`

```sql
-- ============================================================
-- Migration: Fix estimate_resources tier CHECK constraint
-- Date: 28 December 2025
-- Purpose: Align tier values with SFIA 8 reference data
-- Bug: BUG-001 - Tier mismatch between DB and UI
-- ============================================================

-- Drop the incorrect constraint
ALTER TABLE estimate_resources 
DROP CONSTRAINT IF EXISTS estimate_resources_tier_check;

-- Add the correct constraint matching SFIA 8 TIERS
ALTER TABLE estimate_resources 
ADD CONSTRAINT estimate_resources_tier_check 
CHECK (tier IN ('contractor', 'boutique', 'mid', 'big4'));

-- Comment explaining the fix
COMMENT ON CONSTRAINT estimate_resources_tier_check ON estimate_resources 
IS 'Tier values aligned with SFIA 8 reference data (contractor, boutique, mid, big4)';
```

---

## Appendix D: Code Fix for BUG-002

**File:** `src/services/benchmarkRates.service.js`

**Add this method to `BenchmarkRatesService` class:**

```javascript
/**
 * Build a lookup object of all rates for quick access in Estimator
 * Key format: `${skill_id}-${sfia_level}-${tier_id}`
 * @returns {Promise<Object>} Rate lookup dictionary { key: dayRate }
 */
async buildRateLookup() {
  try {
    const { data, error } = await supabase
      .from('benchmark_rates')
      .select('skill_id, sfia_level, tier_id, day_rate');
    
    if (error) throw error;
    
    const lookup = {};
    for (const rate of data || []) {
      const key = `${rate.skill_id}-${rate.sfia_level}-${rate.tier_id}`;
      lookup[key] = Number(rate.day_rate);
    }
    
    return lookup;
  } catch (error) {
    console.error('buildRateLookup failed:', error);
    return {}; // Return empty object, Estimator will use fallback
  }
}
```

**Insert after line ~400 (before the singleton export).**

---

## Appendix E: Route Security Fix for ISSUE-001

**File:** `src/App.jsx`

**Update routes to add role enforcement:**

```jsx
{/* Planning */}
<Route path="/planning" element={
  <ProtectedRoute requiredRoles={['admin', 'supplier_pm', 'customer_pm']}>
    <Planning />
  </ProtectedRoute>
} />

{/* Benchmarking */}
<Route path="/benchmarking" element={
  <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
    <Benchmarking />
  </ProtectedRoute>
} />

{/* Estimator */}
<Route path="/estimator" element={
  <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
    <Estimator />
  </ProtectedRoute>
} />
```

---

*Document Version: 5.0 (Final)*
*Last Updated: 28 December 2025*
*Review Complete - All Phases Finished*
