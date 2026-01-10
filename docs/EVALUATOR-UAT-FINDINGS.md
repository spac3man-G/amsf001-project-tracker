# Evaluator Module - UAT Findings

**UAT Session Started**: 09 January 2026
**Participants**: Glenn Nickols, Claude Code
**Manual Version**: 1.0
**Status**: In Progress

---

## Role Requirements Matrix

As we step through the manual, we'll capture which roles need access to each feature.

### Proposed Roles

| Role | Type | Access Method | Description |
|------|------|---------------|-------------|
| Administration | Internal | Full App | System administrators |
| Supplier PM | Internal | Full App | Procurement lead running evaluations |
| Supplier Contributor | Internal | Full App (Limited) | Supplier team helping with evaluation |
| Customer PM | Internal | Full App (Limited) | Client-side PM overseeing procurement |
| Customer Contributor | Internal | Full App (Limited) | Client team contributing to evaluation |
| Customer Stakeholder | External | Client Portal | External stakeholder approving requirements |
| Vendor Lead | External | Vendor Portal | Primary vendor contact |
| Vendor Contributor | External | Vendor Portal | Vendor team member |

### Feature Access by Role

| Feature | Admin | Supplier PM | Supplier Contrib | Customer PM | Customer Contrib | Customer Stakeholder | Vendor Lead | Vendor Contrib |
|---------|-------|-------------|------------------|-------------|------------------|---------------------|-------------|----------------|
| **Phase 1: Project Setup** | | | | | | | | |
| Create evaluation project | | | | | | | | |
| Configure categories | | | | | | | | |
| Configure stakeholder areas | | | | | | | | |
| Configure phase gates | | | | | | | | |
| **Phase 2: Requirements** | | | | | | | | |
| Create requirements | | | | | | | | |
| Edit requirements | | | | | | | | |
| Delete requirements | | | | | | | | |
| Run AI Gap Analysis | | | | | | | | |
| Submit for review | | | | | | | | |
| Approve requirements | | | | | | | | |
| **Phase 3: Vendors** | | | | | | | | |
| Add vendors | | | | | | | | |
| Edit vendors | | | | | | | | |
| Delete vendors | | | | | | | | |
| Manage pipeline | | | | | | | | |
| AI Market Research | | | | | | | | |
| Generate portal access | | | | | | | | |
| **Phase 4: RFP & Responses** | | | | | | | | |
| Create RFP questions | | | | | | | | |
| View vendor responses | | | | | | | | |
| Submit responses | | | | | | | | |
| Manage Q&A | | | | | | | | |
| **Phase 5: Evaluation** | | | | | | | | |
| Score vendors | | | | | | | | |
| Use AI scoring | | | | | | | | |
| Add evidence | | | | | | | | |
| Score reconciliation | | | | | | | | |
| Review gaps | | | | | | | | |
| Review anomalies | | | | | | | | |
| Security assessment | | | | | | | | |
| **Phase 6: Analysis** | | | | | | | | |
| View traceability | | | | | | | | |
| Risk dashboard | | | | | | | | |
| Financial analysis | | | | | | | | |
| Generate reports | | | | | | | | |
| **Phase 7: Approvals** | | | | | | | | |
| Generate client tokens | | | | | | | | |
| Approve via portal | | | | | | | | |
| Complete phase gates | | | | | | | | |
| **Phase 8: Workflow** | | | | | | | | |
| Create workflow | | | | | | | | |
| Manage stages | | | | | | | | |
| View activity log | | | | | | | | |

*Legend: ✅ = Full Access, 👁️ = View Only, ❌ = No Access, ⚙️ = Configurable*

---

## UAT Findings Log

### Section 1: Introduction

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-001 | Manual Gap | Section 1.3 only lists 2 roles (Admin, Supplier PM) but 8 roles are required | High | Open |

**Notes:**
- 8 roles identified: Administration, Supplier PM, Supplier Contributor, Customer PM, Customer Contributor, Customer Stakeholder, Vendor Lead, Vendor Contributor
- Current implementation only has 3 access tiers: Full App, Client Portal, Vendor Portal
- Advanced Access Control is planned for v2.0 (Aug 2026)

---

### Section 2: Getting Started

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-002 | Manual Error | Manual mentions "Evaluation Switcher" but this doesn't exist - only project switcher | Medium | Open |
| UAT-003 | UI Change | Quick Action tiles to be replaced with sidebar navigation (ARCH-001) | Medium | Planned |
| UAT-004 | Bug | Categories card shows "Weights: 257%" - should be 100% max | High | Open |
| UAT-005 | Observation | Statistics cards working: Requirements (69), Workshops (3), Vendors (7), Categories (11) | N/A | Verified |
| UAT-006 | Observation | Analytics widgets working: Evaluation Progress, Risk Indicators, Score Heatmap, Vendor Comparison, Overall Rankings | N/A | Verified |

**Screenshots reviewed:** Dashboard showing full analytics overview

**Notes:**
- Sidebar already has TRACKER/PLANNER/EVALUATOR/SETTINGS sections (good foundation for ARCH-001)
- Evaluator currently single link - needs to expand to show sub-navigation
- Dashboard analytics are comprehensive and useful
- Role access: All roles with Evaluator enabled should see dashboard (role-specific visibility TBD)

---

### Section 3: Phase 1 - Project Setup

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-007 | Bug Confirmed | Categories total 257% - BUG-001 confirmed. System shows warning but allows invalid state | High | Open |
| UAT-008 | Manual Error | Manual says scoring scale is 0-5, but UI shows 1-5 scale | Medium | Open |
| UAT-009 | Missing Feature | Stakeholder Areas don't show weights/thresholds - manual says they should | Medium | Open |
| UAT-010 | Missing Feature | No Phase Gates / Approval Workflow section visible in Settings | High | Open |
| UAT-011 | Observation | Deadline Reminders section exists with 6 reminder types (all set to "No reminders") | N/A | Verified |
| UAT-012 | Observation | Project Details editable (Name, Client, Description, Target Dates, Status) | N/A | Verified |
| UAT-013 | Observation | Stakeholder Areas (4): IT, Finance, Security, Operations - can add/edit/delete | N/A | Verified |
| UAT-014 | Observation | Categories (11) with descriptions, req counts, criteria counts - can add/edit/delete | N/A | Verified |

**Screenshots reviewed:** Settings page showing Project Details, Stakeholder Areas, Categories, Scoring Scale, Deadline Reminders

**Categories with weights (totaling 257%):**
- Security compliance: 25%
- Functional Requirements: 36%
- Technical Requirements: 27%
- Interoperability and integration: 25%
- Integration Requirements: 30%
- Ease of migration: 25%
- Compliance Requirements: 28%
- Life cycle cost: 25%
- User Experience: 7%
- Vendor Stability: 16%
- Financial Considerations: 13%

**Scoring Scale (1-5, not 0-5):**
1. Does Not Meet
2. Partially Meets
3. Meets
4. Exceeds
5. Exceptional

**Notes:**
- System correctly warns "157% over" but doesn't prevent saving
- Should either enforce 100% total or allow flexible weighting with clear documentation
- Phase Gates feature appears to be in database/service but not exposed in UI yet

---

### Section 4: Phase 2 - Requirements Management

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-015 | Bug | "Create Requirement" button does nothing - no error message, silent failure | **Critical** | Open |
| UAT-016 | Missing Feature | No project switcher/create new project from Evaluator Settings | Medium | Open |
| UAT-017 | Enhancement | Stakeholder Area should allow MULTIPLE selection (requirement can apply to multiple areas) | High | Open |
| UAT-018 | Enhancement | Source Type missing options: Interview, Market Analysis, Competitor Analysis | Medium | Open |
| UAT-019 | Enhancement | Need Excel-like spreadsheet interface for bulk requirements entry | High | Open |
| UAT-020 | Enhancement | Need drag-and-drop, reorder, grouping capabilities for requirements | Medium | Open |
| UAT-021 | Observation | Requirements list working - 69 requirements with status/priority filters | N/A | Verified |
| UAT-022 | Observation | AI Gap Analysis button visible and functional | N/A | Verified |
| UAT-023 | Observation | Export button available | N/A | Verified |
| UAT-024 | Observation | Search and filter by Category, Stakeholder, Priority, Status working | N/A | Verified |

**Screenshots reviewed:** Requirements list, New Requirement modal (multiple states)

**Current Source Type options:**
- Manual Entry
- Workshop
- Survey Response
- Document
- AI Suggestion

**Requested additional Source Types:**
- Interview
- Market Analysis
- Competitor Analysis

**New Requirement Form Fields:**
- Reference Code (auto-generated, e.g., REQ-001)
- Title*
- Description (2000 char limit)
- Category dropdown
- Stakeholder Area dropdown (single select - needs multi-select)
- Priority: Must Have | Should Have | Could Have | Won't Have
- Status: Draft | Under Review | Approved | Rejected
- Source Type dropdown
- Validation Notes (appears for Under Review status)

**Status Workflow (from UI):**
- Draft: "Initial capture, not yet reviewed"
- Under Review: "Submitted for stakeholder review"
- Approved: (implied - accepted by stakeholders)
- Rejected: (implied - rejected by stakeholders)

**Spreadsheet/Bulk Entry Feature Request:**
User needs Excel-like interface for requirements with:
- All fields as columns
- Add multiple rows quickly
- Copy/paste support
- Drag-and-drop reordering
- Grouping capabilities
- Makes requirements capture/review much faster

---

### Section 5: Phase 3 - Vendor Management

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-025 | Bug | "Failed to add vendor" error when trying to add vendor manually | High | Open |
| UAT-026 | Bug | Adding vendor from Market Research silent failure (no error shown) | High | Open |
| UAT-027 | Bug | Vendor category buttons (CHALLENGER, ENTERPRISE) don't do anything | Medium | Open |
| UAT-028 | Missing Feature | No vendor portal access visible from Vendor Management screens | High | Open |
| UAT-029 | UX Issue | Page layout uses too much space for shortlist/longlist stats | Medium | Open |
| UAT-030 | UX Issue | Kanban pipeline view may not be best use of space | Low | Review |
| UAT-031 | Config Issue | All Evaluator AI features using Sonnet 4, should use Opus 4.5 | High | Open |
| UAT-032 | Observation | Market Research AI working - shows market summary, trends, buyer considerations | N/A | Verified |
| UAT-033 | Observation | Vendor cards show fit scores (8.5, 7.5 etc), position badges, descriptions | N/A | Verified |
| UAT-034 | Observation | Kanban pipeline working: Identified → Long List → Short List → RFP Issued → Response Received → Under Evaluation | N/A | Verified |

**Screenshots reviewed:** Vendor Management (Kanban), Add Vendor error, Market Research Results (Market Overview + Vendors tabs)

**AI Models Currently Used (should be Opus 4.5):**
- ai-gap-analysis.js: claude-sonnet-4-20250514
- ai-requirement-suggest.js: claude-sonnet-4-20250514
- ai-validate-vendor-response.js: claude-sonnet-4-20250514
- ai-market-research.js: claude-sonnet-4-20250514
- vendor-intelligence.js: claude-sonnet-4-20250514
- ai-document-parse.js: claude-sonnet-4-20250514
- ai-matrix-insights.js: claude-sonnet-4-20250514
- ai-analyze-response.js: claude-sonnet-4-20250514

**Vendor Pipeline Stages:**
1. Identified
2. Long List
3. Short List
4. RFP Issued
5. Response Received
6. Under Evaluation
7. (Selected - implied)

**Market Research Features Working:**
- Market Summary with maturity indicator
- Vendor count breakdown (Leaders, Challengers, Niche/Emerging)
- Key Market Trends
- Buyer Considerations
- Vendor fit scores
- Position/segment badges

**Notes:**
- Manual says vendor portal access should be available from vendor details
- Need to click into a vendor to find portal access (not visible from list view)
- Consider redesigning vendor page layout for better space utilization

---

### Section 6: Phase 4 - RFP & Vendor Responses

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-035 | Bug | "Failed to load questions" error on Questions page | **Critical** | Open |
| UAT-036 | Bug | "Failed to save question" error when trying to add question | **Critical** | Open |
| UAT-037 | Bug | Linked Requirement dropdown only shows "None" - not populated with requirements | High | Open |
| UAT-038 | Bug | Linked Criterion dropdown only shows "None" - not populated | High | Open |
| UAT-039 | Missing Feature | No AI tool to suggest vendor questions based on requirements | High | Open |
| UAT-040 | Observation | Add Question form has fields: Question, Question Type, Section, Help Text, Required checkbox | N/A | Verified |
| UAT-041 | Observation | 9 Sections configured (shown in stats) | N/A | Verified |

**Screenshots reviewed:** Vendor Questions page (empty state), Add Question modal, error states

**Add Question Form Fields:**
- Question* (text area)
- Question Type dropdown (Short Text, etc.)
- Section dropdown (Implementation, etc.)
- Help Text
- Required question checkbox
- Link to Requirements/Criteria:
  - Linked Requirement dropdown (not working - only shows "None")
  - Linked Criterion dropdown (not working - only shows "None")

**Question Types Available:**
- Short Text (confirmed)
- (others not visible in screenshots)

**Notes:**
- The Questions page is completely broken - can't load or save
- Linking questions to requirements is a key traceability feature but dropdowns not populated
- AI question suggestion would speed up RFP creation significantly

---

### Section 7: Phase 5 - Evaluation & Scoring

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-042 | Bug | "Failed to load Q&A data" error on Q&A Management page | **Critical** | Open |
| UAT-043 | UX Issue | Q&A section purpose unclear - what is it meant to do? | High | Open |
| UAT-044 | Bug | AI Response Analysis returns "Failed to load vendor responses" error | High | Open |
| UAT-045 | Bug | Evidence saves but shows error message in background | High | Open |
| UAT-046 | Bug | Clicking on evidence items doesn't open them / do anything | High | Open |
| UAT-047 | Bug | Clicking on evaluation criteria doesn't do anything | High | Open |
| UAT-048 | Bug | Clicking on Top Score card doesn't do anything | Medium | Open |
| UAT-049 | Observation | Evaluation dashboard shows: 4 vendors, 24 criteria, 5 evidence items | N/A | Verified |
| UAT-050 | Observation | Vendor scoring page accessible with AI Assist button | N/A | Verified |
| UAT-051 | Observation | Add Evidence modal has form fields and criteria checkboxes | N/A | Verified |

**Screenshots reviewed:** Q&A Management (error), Evaluation Dashboard, Vendor Scoring Page, AI Response Analysis Panel (error), Add Evidence Modal

**Working Features:**
- Evaluation dashboard statistics displaying
- Can navigate into vendor scoring page
- Add Evidence modal opens
- Evidence appears to save (despite error message)

**Broken Features:**
- Q&A Management completely non-functional
- AI Response Analysis returning errors
- Evidence items not clickable/viewable
- Evaluation criteria not interactive
- Top Score card not interactive

**Q&A Section Clarification Needed:**
- User unclear on purpose of Q&A section
- Manual may need better explanation of Q&A vs Questions vs Vendor Responses workflow
- Is Q&A for back-and-forth clarification questions from vendors?

---

### Section 8: Phase 6 - Analysis & Decision Support

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-052 | Bug | Traceability Matrix: "Failed to load traceability data" error | **Critical** | Open |
| UAT-053 | Missing Feature | Risk Dashboard not visible in UI - no navigation to it | High | Open |
| UAT-054 | Missing Feature | Financial Analysis (TCO/Sensitivity/ROI) not visible - no navigation | High | Open |
| UAT-055 | Bug | "Failed to generate report" error when generating reports | **Critical** | Open |
| UAT-056 | Observation | Reports & Exports page exists with 6 report types | N/A | Verified |
| UAT-057 | Observation | Report types available: Executive Summary, Traceability Matrix, Requirements Export, Vendor Scores, Vendor Comparison, Evidence Register | N/A | Verified |
| UAT-058 | Manual Discrepancy | Manual lists 5 report types but UI shows 6 different ones | Medium | Open |

**Screenshots reviewed:** Traceability error page, Reports & Exports page (success and error states)

**Working Features:**
- Reports & Exports page loads
- Six report cards displayed with PDF/CSV options

**Broken Features:**
- Traceability Matrix page fails to load
- Report generation fails with error

**Missing Features (documented in manual but not in UI):**
- Risk Dashboard (EV-024) - No navigation visible
- Financial Analysis TCO (EV-025) - No navigation visible
- Sensitivity Analysis (EV-026) - No navigation visible
- ROI Calculation (EV-027) - No navigation visible
- Vendor Intelligence tab (EV-028) - Not seen on vendor details

**Report Types Comparison:**

| Manual Says | UI Shows |
|-------------|----------|
| Executive Summary | Executive Summary |
| Detailed Evaluation | (not present) |
| Financial Analysis | (not present) |
| Risk Assessment | (not present) |
| Traceability Report | Traceability Matrix |
| (not listed) | Requirements Export |
| (not listed) | Vendor Scores |
| (not listed) | Vendor Comparison |
| (not listed) | Evidence Register |

---

### Section 9: Phase 7 - Stakeholder Approvals

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-059 | Missing Feature | Client Portal Access section not in Settings - can't generate tokens | High | Open |
| UAT-060 | Missing Feature | Phase Gates section not in Settings - can't configure approval thresholds | High | Open |
| UAT-061 | Missing Feature | Approval Status section not in Settings - can't track stakeholder approvals | High | Open |
| UAT-062 | Manual Discrepancy | Manual describes full approval workflow but UI only has basic settings | High | Open |
| UAT-063 | Observation | Settings page shows: Project Details, Stakeholder Areas, Categories, Scoring Scale, Deadline Reminders | N/A | Verified |

**Screenshots reviewed:** Settings page (full view)

**Settings Sections Present:**
- Project Details (editable)
- Stakeholder Areas (4) with add/edit/delete
- Evaluation Categories (11) with add/edit/delete and Edit Weights
- (Scoring Scale - not shown in screenshot but seen earlier)
- (Deadline Reminders - not shown in screenshot but seen earlier)

**Settings Sections Missing (documented in manual):**
- Client Portal Access (EV-030)
- Phase Gates / Approval Workflow (EV-033)
- Approval Status tracking (EV-032)

**Client Approval Widget (EV-032):**
- Need to check if visible on main dashboard
- Manual says it should show progress ring with approval %

**Notes:**
- The entire Phase 7 workflow appears to be documented but not implemented in UI
- Client Portal may exist but navigation to configure/generate tokens is missing
- Phase Gates were mentioned earlier as missing - confirmed again here

---

### Section 10: Phase 8 - Post-Selection Workflow

| ID | Type | Finding | Severity | Status |
|----|------|---------|----------|--------|
| UAT-064 | Missing Feature | Workflow section not visible - no navigation to create/manage workflows | High | Open |
| UAT-065 | Bug | Vendor Responses tab: "Failed to load vendor responses" error | High | Open |
| UAT-066 | Observation | Vendor Portal Access IS implemented on vendor detail page | N/A | Verified |
| UAT-067 | Observation | Vendor Portal shows: Access Code, Expiry, Extend/Revoke options | N/A | Verified |
| UAT-068 | Clarification | Vendor Portal (for vendors) is different from Client Portal (for stakeholders) | N/A | Documented |
| UAT-069 | Observation | Vendor Detail has Details + Responses tabs | N/A | Verified |
| UAT-070 | Observation | Status actions: Move to Long List, Rejected | N/A | Verified |

**Screenshots reviewed:** Vendor Detail page (Filejet) - Details tab, Responses tab

**Working Features:**
- Vendor Portal Access on vendor detail page
  - "Portal Enabled" toggle/status
  - Access Code: 8GXKYLA6
  - Expiry: 2/9/2026
  - "Extend 14 days" button
  - "Revoke Access" button
- Vendor status with move actions (Long List, Rejected)
- Contacts section (empty state shown)

**Broken Features:**
- Vendor Responses tab fails to load

**Missing Features:**
- Procurement Workflow (EV-034, EV-035, EV-036) - no navigation visible
- Workflow stages, milestones, activity log not accessible

**Portal Clarification:**
- **Vendor Portal** = For vendors to submit RFP responses (EXISTS - on vendor detail)
- **Client Portal** = For stakeholders to approve requirements (MISSING - not in Settings)

**Notes:**
- Earlier noted vendor portal access was missing from Vendor Management - it's actually on vendor DETAIL page
- This resolves FE-009 partially - portal access IS visible, just need to click into vendor first
- Manual should clarify portal is per-vendor, not a global settings feature

---

## Bug Fixes Required

| ID | Description | Component | Priority | Status |
|----|-------------|-----------|----------|--------|
| BUG-001 | Categories weights must enforce 100% total (decided) | Settings/Categories | High | Open |
| BUG-002 | System warns about weight overage but doesn't prevent saving invalid state | Settings/Categories | High | Open |
| BUG-003 | "Create Requirement" button does nothing - silent failure, no error | Requirements | **Critical** | Open |
| BUG-004 | "Failed to add vendor" error when adding vendor manually | Vendors | High | **Fixed** (Sprint 2) |
| BUG-005 | Adding vendor from Market Research silent failure | Vendors | High | Open |
| BUG-006 | Vendor category buttons (CHALLENGER, ENTERPRISE) non-functional | Vendors | Medium | Open |
| BUG-007 | All Evaluator AI endpoints using Sonnet 4 instead of Opus 4.5 | API/AI | High | **Fixed** (Sprint 5) |
| BUG-008 | "Failed to load questions" error on Questions page | Questions | **Critical** | **Fixed** (Sprint 2) |
| BUG-009 | "Failed to save question" error when adding question | Questions | **Critical** | **Fixed** (Sprint 2) |
| BUG-010 | Linked Requirement dropdown not populated (only shows "None") | Questions | High | **Fixed** (Sprint 2) |
| BUG-011 | Linked Criterion dropdown not populated (only shows "None") | Questions | High | **Fixed** (Sprint 2) |
| BUG-012 | "Failed to load Q&A data" error on Q&A Management page | Q&A | **Critical** | **Fixed** (Sprint 2) |
| BUG-013 | AI Response Analysis returns "Failed to load vendor responses" error | Evaluation/AI | High | Open |
| BUG-014 | Evidence saves but shows error message in background | Evaluation/Evidence | High | **Fixed** (Sprint 2) |
| BUG-015 | Clicking on evidence items doesn't do anything | Evaluation/Evidence | High | Open |
| BUG-016 | Clicking on evaluation criteria doesn't do anything | Evaluation | High | Open |
| BUG-017 | Clicking on Top Score card doesn't do anything | Evaluation | Medium | Open |
| BUG-018 | Traceability Matrix: "Failed to load traceability data" error | Traceability | **Critical** | **Fixed** (Sprint 2) |
| BUG-019 | "Failed to generate report" error when generating any report | Reports | **Critical** | Open |
| BUG-020 | Vendor Responses tab: "Failed to load vendor responses" error | Vendors | High | Open |

---

## Feature Enhancements Required

| ID | Description | Component | Priority | Status |
|----|-------------|-----------|----------|--------|
| FE-001 | Implement role-based access control for Evaluator roles | Permissions | High | Open |
| FE-002 | Add weights and approval thresholds to Stakeholder Areas UI | Settings | High | Open |
| FE-003 | Expose Phase Gates / Approval Workflow UI in Settings | Settings | High | Open |
| FE-004 | Add evaluation project switcher/create new from Evaluator | Navigation | Medium | Open |
| FE-005 | Allow MULTIPLE stakeholder area selection for requirements | Requirements | High | Open |
| FE-006 | Add Source Types: Interview, Market Analysis, Competitor Analysis | Requirements | Medium | Open |
| FE-007 | Excel-like spreadsheet interface for bulk requirements entry | Requirements | High | Open |
| FE-008 | Drag-and-drop, reorder, grouping for requirements | Requirements | Medium | Open |
| FE-009 | Make vendor portal access visible from Vendor Management screens | Vendors | Low | RESOLVED - visible on vendor detail page |
| FE-010 | Redesign Vendor page layout - better use of space | Vendors | Medium | Open |
| FE-011 | AI tool to suggest vendor questions based on requirements | Questions | High | Open |
| FE-012 | Q&A section needs better UX/documentation - purpose unclear | Q&A | High | Open |
| FE-013 | Evidence items should be viewable/clickable to see full details | Evaluation/Evidence | High | Open |
| FE-014 | Evaluation criteria should be interactive (expand details, add scores) | Evaluation | High | Open |
| FE-015 | Top Score card should be clickable (show breakdown or vendor details) | Evaluation | Medium | Open |
| FE-016 | Risk Dashboard - needs UI navigation and full implementation | Risks | High | Open |
| FE-017 | Financial Analysis (TCO) - needs UI navigation and implementation | Financial | High | Open |
| FE-018 | Sensitivity Analysis - needs UI navigation and implementation | Financial | Medium | Open |
| FE-019 | ROI Calculation - needs UI navigation and implementation | Financial | Medium | Open |
| FE-020 | Vendor Intelligence tab on vendor details | Vendors | High | Open |
| FE-021 | Client Portal Access in Settings - token generation for stakeholders | Settings/Portal | High | Open |
| FE-022 | Phase Gates section in Settings - approval thresholds configuration | Settings | High | Open |
| FE-023 | Approval Status tracking in Settings | Settings | High | Open |
| FE-024 | Client Approval Widget on dashboard - approval progress tracking | Dashboard | Medium | Open |
| FE-025 | Procurement Workflow - create/manage workflows after vendor selection | Workflow | High | Open |

---

## Manual Corrections Required

| Section | Issue | Correction Needed | Status |
|---------|-------|-------------------|--------|
| 1.3 | Only 2 roles documented | Document all 8 roles with access levels | Open |
| 2.2 | Mentions "Evaluation Switcher" | Remove - only project switcher exists | Open |
| 2.2 | Describes tile-based navigation | Update for sidebar navigation (post ARCH-001) | Open |
| 3.2 | Manual shows 6 example categories totaling 100% | Update to reflect actual implementation allows flexible weighting | Open |
| 3.3 | Manual shows stakeholder areas with weights/thresholds | UI doesn't show these fields - either update manual or add to UI | Open |
| 3.4 | Manual describes Phase Gates configuration | Phase Gates UI not visible in Settings - add or document location | Open |
| 7.1 | Manual shows 0-5 scoring scale | UI shows 1-5 scale - update manual or add 0 option | Open |
| 8.1 | Q&A section not well explained | Add clear explanation of Q&A vs Questions vs Vendor Responses | Open |
| 8.2 | Risk Dashboard documented but not in UI | Either implement feature or remove from manual | Open |
| 8.3-8.5 | Financial Analysis (TCO/Sensitivity/ROI) documented but not in UI | Either implement features or remove from manual | Open |
| 8.6 | Vendor Intelligence tab documented but not visible | Either implement feature or remove from manual | Open |
| 8.7 | Report types don't match implementation | Update manual to match actual reports available | Open |
| 9.1-9.5 | Phase 7 Stakeholder Approvals workflow documented but not in UI | Either implement full workflow or remove/defer from manual | Open |
| 10.1-10.4 | Phase 8 Procurement Workflow documented but not in UI | Either implement workflow feature or remove/defer from manual | Open |
| 5.x | Manual should clarify vendor portal is on vendor DETAIL page | Update navigation instructions for vendor portal access | Open |

---

## Architectural Changes Required

### ARCH-001: Unified Navigation & App Toggles

**Decision Date**: 09 January 2026
**Status**: Design Phase

#### Current State
- Evaluator is a single link in sidebar
- Evaluator dashboard has tile-based navigation to features
- Planner is separate
- Roles are inconsistent across apps

#### Proposed Changes

**1. Sidebar Navigation Restructure**

Replace flat navigation with sectioned navigation:

```
TRACKER (if enabled)
├── Dashboard
├── Projects
├── Milestones
├── Deliverables
├── Timesheets
├── Expenses
├── Partners
├── KPIs
├── RAID
├── Variations

PLANNER (if enabled)
├── WBS Builder
├── Estimates
├── Templates

EVALUATOR (if enabled)
├── Dashboard
├── Requirements
├── Vendors
├── Questions
├── Q&A
├── Evaluation
├── Traceability
├── Reports
├── Settings
```

**2. Project Settings: App Toggles**

In Project Settings, add toggles:
- [ ] Enable Tracker
- [ ] Enable Planner
- [ ] Enable Evaluator

At least one must be enabled. Disabling an app hides its sidebar section.

**3. Unified Role System**

See ARCH-002 below.

---

### ARCH-002: Consolidated Role System

**Decision Date**: 09 January 2026
**Status**: DECIDED - Option C Selected

#### Current Tracker Roles
| Role | Description |
|------|-------------|
| admin | System administrator |
| supplier_pm | Supplier project manager |
| supplier_finance | Supplier finance team |
| customer_pm | Customer project manager |
| customer_finance | Customer finance team |
| contributor | Can log time/expenses, update deliverables |
| viewer | Read-only access |

#### Proposed Evaluator Roles
| Role | Description |
|------|-------------|
| Administration | System administrators |
| Supplier PM | Procurement lead |
| Supplier Contributor | Supplier team member |
| Customer PM | Client-side PM |
| Customer Contributor | Client team member |
| Customer Stakeholder | External approver (portal) |
| Vendor Lead | Primary vendor contact (portal) |
| Vendor Contributor | Vendor team member (portal) |

#### Options for Role Consolidation

**Option A: Unified Base Roles + Per-App Permissions**

Define 6-8 base roles that work across all apps:

| Base Role | Tracker | Planner | Evaluator |
|-----------|---------|---------|-----------|
| Admin | Full | Full | Full |
| Supplier PM | Full | Full | Full |
| Supplier Contributor | Edit assigned | Edit | Score, Evidence |
| Supplier Finance | Finance only | View | Financial Analysis |
| Customer PM | View + Approve | View | View + Approve |
| Customer Contributor | View | View | Requirements only |
| Viewer | View | View | View |

*Pros*: Simple, consistent role names
*Cons*: May not capture all nuances

**Option B: Role Templates with App-Specific Customization**

Define role templates, then customize per-app:

```
User: John Smith
Role Template: Supplier Contributor

App Permissions:
├── Tracker: ✅ Enabled
│   └── Permissions: Timesheets, Expenses, Deliverables
├── Planner: ✅ Enabled
│   └── Permissions: View WBS, Edit Estimates
├── Evaluator: ✅ Enabled
│   └── Permissions: Score Vendors, Add Evidence
```

*Pros*: Maximum flexibility
*Cons*: More complex UI, harder to understand

**Option C: Separate Roles Per App (Current + Extended)**

Keep app-specific roles but consolidate naming:

| App | Available Roles |
|-----|-----------------|
| Tracker | Admin, PM, Finance, Contributor, Viewer |
| Planner | Admin, PM, Contributor, Viewer |
| Evaluator | Admin, PM, Contributor, Stakeholder, Viewer |

User assignment:
```
User: John Smith
├── Tracker Role: Contributor
├── Planner Role: Viewer
├── Evaluator Role: PM
```

*Pros*: Clear separation, familiar pattern
*Cons*: User could have different "PM" permissions in different apps

**Option D: Permission-Based (No Named Roles)**

Instead of roles, assign granular permissions:

```
User: John Smith
├── Tracker Permissions: [timesheets.edit, expenses.edit, deliverables.view]
├── Planner Permissions: [wbs.view, estimates.edit]
├── Evaluator Permissions: [vendors.edit, scoring.full, reports.view]
```

*Pros*: Maximum granularity
*Cons*: Complex to manage, harder for users to understand

#### External Portal Roles

Regardless of option chosen, external roles remain separate:
- **Customer Stakeholder** - Client Portal access (token-based)
- **Vendor Lead** - Vendor Portal access (code-based)
- **Vendor Contributor** - Vendor Portal access (code-based)

These are not "app roles" but portal access types.

#### DECISION: Option C Selected

**Confirmed**: 09 January 2026

**Key Points:**
1. **Option C** - Separate Role Per App with consistent naming conventions
2. **Project Level** - Role assignment is per-project (users can have different roles on different projects)
3. **Consistent Naming** - Use same role names across apps where applicable

**Unified Role Names (to be used across all apps where applicable):**

| Role | Description |
|------|-------------|
| Admin | Full access to all features |
| PM | Project Manager - full operational access |
| Finance | Finance-specific features only |
| Contributor | Can create/edit content, limited config |
| Viewer | Read-only access |

**App-Specific Additions:**

| App | Additional Roles |
|-----|-----------------|
| Tracker | (none - base roles sufficient) |
| Planner | (none - base roles sufficient) |
| Evaluator | Stakeholder (internal customer approver - TBD) |

**User Management UI:**
```
┌─────────────────────────────────────────────┐
│ User: John Smith                            │
│ Email: john@example.com                     │
├─────────────────────────────────────────────┤
│ App Access & Roles (Project: CSP Entity Mgmt)│
│                                             │
│ ☑ Tracker     Role: [Contributor ▼]        │
│ ☑ Planner     Role: [Viewer ▼]             │
│ ☑ Evaluator   Role: [PM ▼]                 │
└─────────────────────────────────────────────┘
```

**DECISION (10 January 2026):**
- Customer PM and Customer Contributor will use the **FULL APP** access
- Client Portal does not exist in current implementation
- This aligns with Supplier PM/Contributor having full app access
- Client Portal can be built later for external stakeholders (Customer Stakeholder role)

---

## Remediation Plan

### Overview

UAT identified **20 bugs** and **25 feature gaps**. Rather than fix everything at once, this plan organizes work into logical sprints that address root causes first, then fix dependent issues.

### Sprint Structure

| Sprint | Focus | Bugs | Duration Est. |
|--------|-------|------|---------------|
| Sprint 1 | Root Cause Investigation | - | 1 day |
| Sprint 2 | Core CRUD Operations | BUG-003,004,005,008,009 | 2-3 days |
| Sprint 3 | Data Loading Features | BUG-012,013,018,019,020 | 2-3 days |
| Sprint 4 | UI/Interaction Fixes | BUG-001,002,006,010,011,014-17 | 2 days |
| Sprint 5 | AI Configuration | BUG-007 | 0.5 day |
| Sprint 6+ | Feature Enhancements | FE-001 to FE-025 | Future |

---

### Sprint 1: Root Cause Investigation

**Objective:** Understand why so many data operations are failing before attempting fixes.

**Tasks:**
1. Check browser console for JavaScript errors on failing pages
2. Check Supabase logs for database errors
3. Verify all required database tables exist (run migrations if needed)
4. Check RLS policies - are Evaluator tables accessible?
5. Test services directly to isolate frontend vs backend issues
6. Document findings for Sprint 2

**Key Files to Investigate:**
```
src/services/evaluator/*.service.js
src/pages/evaluator/*.jsx
supabase/migrations/202601090*.sql (recent Evaluator migrations)
```

**Hypothesis:** Many "Failed to load/save" errors likely share a common cause:
- Missing database migrations
- RLS policy issues
- Service initialization problems
- Project context not being passed correctly

---

### Sprint 2: Core CRUD Operations

**Objective:** Fix the fundamental create/read/update/delete operations.

**Bugs to Fix:**

| Bug | Issue | Likely Cause | Fix |
|-----|-------|--------------|-----|
| BUG-003 | Create Requirement fails | Service error / RLS | Debug requirements.service.js |
| BUG-004 | Add Vendor fails | Service error / RLS | Debug vendors.service.js |
| BUG-005 | Add from Market Research fails | Missing handler | Add click handler for market research add |
| BUG-008 | Load Questions fails | Service/table issue | Debug questions.service.js |
| BUG-009 | Save Question fails | Service/RLS | Debug questions.service.js |

**Verification:**
- [ ] Can create a new requirement
- [ ] Can add a vendor manually
- [ ] Can add a vendor from market research
- [ ] Questions page loads
- [ ] Can add a new question

---

### Sprint 3: Data Loading Features

**Objective:** Fix remaining data loading/generation features.

**Bugs to Fix:**

| Bug | Issue | Likely Cause | Fix |
|-----|-------|--------------|-----|
| BUG-012 | Q&A page fails | Missing table/service | Debug vendorQA.service.js |
| BUG-013 | AI Response Analysis fails | API/service error | Debug AI response endpoint |
| BUG-018 | Traceability fails | Service/query error | Debug traceability.service.js |
| BUG-019 | Reports fail | Service/data issue | Debug reports generation |
| BUG-020 | Vendor Responses fails | Service/query error | Debug vendor responses query |

**Verification:**
- [ ] Q&A Management page loads
- [ ] AI Response Analysis shows data
- [ ] Traceability matrix displays
- [ ] Can generate at least one report type
- [ ] Vendor Responses tab shows data

---

### Sprint 4: UI/Interaction Fixes

**Objective:** Fix UI validation, dropdowns, and clickable elements.

**Bugs to Fix:**

| Bug | Issue | Fix |
|-----|-------|-----|
| BUG-001/002 | Category weights not enforced | Add validation to prevent save if total ≠ 100% |
| BUG-006 | Vendor category buttons | Add click handlers for CHALLENGER/ENTERPRISE |
| BUG-010/011 | Dropdowns empty | Populate requirements/criteria in question form |
| BUG-014 | Evidence error message | Fix error handling (success but shows error) |
| BUG-015 | Evidence not clickable | Add click handler to view evidence details |
| BUG-016 | Criteria not clickable | Add click handler for criteria expansion |
| BUG-017 | Top Score not clickable | Add click handler for score breakdown |

**Verification:**
- [ ] Cannot save categories if weights ≠ 100%
- [ ] Vendor category buttons work
- [ ] Question form shows requirements in dropdown
- [ ] Evidence saves without error message
- [ ] Can click evidence to view details
- [ ] Can click criteria to expand
- [ ] Can click Top Score for details

---

### Sprint 5: AI Configuration

**Objective:** Update all AI endpoints to use Opus 4.5.

**Bug:** BUG-007

**Files to Update:**
```
api/evaluator/ai-gap-analysis.js
api/evaluator/ai-requirement-suggest.js
api/evaluator/ai-validate-vendor-response.js
api/evaluator/ai-market-research.js
api/evaluator/vendor-intelligence.js
api/evaluator/ai-document-parse.js
api/evaluator/ai-matrix-insights.js
api/evaluator/ai-analyze-response.js
```

**Change:** `claude-sonnet-4-20250514` → `claude-opus-4-5-20250514`

**Verification:**
- [ ] All 8 AI endpoints using Opus 4.5
- [ ] AI features still function correctly

---

### Sprint 6+: Feature Enhancements (Future)

**Phase A - Settings & Configuration:**
- FE-002: Stakeholder Area weights/thresholds
- FE-003: Phase Gates UI
- FE-022: Phase Gates configuration
- FE-023: Approval Status tracking

**Phase B - Requirements Improvements:**
- FE-005: Multi-select stakeholder areas
- FE-006: Additional source types
- FE-007: Spreadsheet interface (larger effort)
- FE-008: Drag-and-drop (larger effort)

**Phase C - Evaluation Improvements:**
- FE-013: Evidence details view
- FE-014: Criteria expansion
- FE-015: Score breakdown
- FE-011: AI question suggestions

**Phase D - New Modules:**
- FE-016: Risk Dashboard
- FE-017/18/19: Financial Analysis
- FE-020: Vendor Intelligence
- FE-025: Procurement Workflow

**Phase E - Portal & Approvals:**
- FE-021: Client Portal Access
- FE-024: Approval Widget

**Phase F - Architecture:**
- ARCH-001: Unified sidebar navigation
- ARCH-002: Consolidated role system
- FE-001: Role-based access control

---

### Recommended Starting Point

**Start with Sprint 1** (Root Cause Investigation) because:
1. Many bugs likely share common causes
2. Fixing root causes may resolve multiple bugs at once
3. Avoids wasted effort fixing symptoms instead of causes

**First Actions:**
1. Open browser DevTools on Evaluator pages with errors
2. Check Network tab for failed API calls
3. Check Console for JavaScript errors
4. Check Supabase dashboard for database errors
5. Verify evaluator tables exist and have correct RLS

---

## Sprint 1 Findings (10 January 2026)

### ROOT CAUSE IDENTIFIED: Schema Mismatch

**Primary Issue:** Service files use different column names than database migrations.

**Example: `vendor_questions` table**

| Service Expects | Migration Has | Status |
|-----------------|---------------|--------|
| `display_order` | `sort_order` | ❌ Mismatch |
| `help_text` | `guidance_for_vendors` | ❌ Mismatch |
| `requirement_id` (direct column) | `vendor_question_links` table | ❌ Wrong structure |
| `criterion_id` (direct column) | `vendor_question_links` table | ❌ Wrong structure |
| `long_text` type | `textarea` type | ❌ Mismatch |
| `single_choice` type | `multiple_choice` type | ❌ Mismatch |
| `rating` type | N/A | ❌ Missing |

**Why This Happened:** Services were written with assumed column names, then migrations were created with different names. No synchronization occurred.

### Impact

This explains ALL the "Failed to load/save" errors:
- BUG-003: Requirements - likely similar mismatch
- BUG-004/005: Vendors - likely similar mismatch
- BUG-008/009: Questions - confirmed mismatch above
- BUG-012: Q&A - depends on questions schema
- BUG-018: Traceability - depends on multiple tables
- BUG-019: Reports - depends on multiple tables
- BUG-020: Vendor Responses - table structure mismatch

### Fix Strategy

**Option A:** Update services to match migrations (RECOMMENDED)
- Migrations are "source of truth" for database
- Safer than altering production schema
- More work but more correct

**Option B:** Update migrations to match services
- Requires new migrations to alter tables
- Risk of data loss if columns renamed
- Faster but riskier

**Recommendation:** Option A - Update services to match existing migrations

### Services to Audit and Fix

1. `vendorQuestions.service.js` - CONFIRMED mismatch
2. `requirements.service.js` - needs audit
3. `vendors.service.js` - needs audit
4. `vendorQA.service.js` - needs audit
5. `traceability.service.js` - needs audit
6. `scores.service.js` - needs audit
7. All other evaluator services - need audit

### Next Steps

1. ~~Audit each service against its corresponding migration~~ ✅ COMPLETE
2. ~~Create mapping of mismatches for each table~~ ✅ COMPLETE (see below)
3. Update services to use correct column names
4. Test each fix

---

## Complete Schema Mismatch Mapping

**Audit Completed:** 10 January 2026

This section documents ALL schema mismatches between service files and database migrations.

### 1. vendor_questions (CRITICAL - Most Mismatches)

**Service:** `src/services/evaluator/vendorQuestions.service.js`
**Migration:** `supabase/migrations/202601010012_create_vendor_questions_responses.sql`

| Category | Service Uses | Migration Has | Fix Required |
|----------|--------------|---------------|--------------|
| **Column Name** | `display_order` | `sort_order` | Rename in service |
| **Column Name** | `help_text` | `guidance_for_vendors` | Rename in service |
| **Structure** | `requirement_id` (direct column) | N/A (use `vendor_question_links` table) | Major refactor - use junction table |
| **Structure** | `criterion_id` (direct column) | N/A (use `vendor_question_links` table) | Major refactor - use junction table |
| **Question Type** | `long_text` | `textarea` | Map type value |
| **Question Type** | `single_choice` | `multiple_choice` | Map type value |
| **Question Type** | `rating` | N/A (not in migration) | Remove or use `number` |

**Migration Question Types:** `text`, `textarea`, `yes_no`, `multiple_choice`, `multi_select`, `number`, `date`, `file_upload`, `compliance`

**Service Question Types:** `text`, `long_text`, `single_choice`, `multiple_choice`, `rating`, `yes_no`, `file_upload`, `date`, `number`

**Migration Missing Columns:** None that service needs
**Service Missing Columns:** `max_length`, `scoring_guidance`

### 2. vendors (Minor Mismatch)

**Service:** `src/services/evaluator/vendors.service.js`
**Migration:** `supabase/migrations/202601010011_create_vendors.sql`

| Category | Service Uses | Migration Has | Fix Required |
|----------|--------------|---------------|--------------|
| **Column Name** | `notes` | `internal_notes` | Rename in service |

**Additional Service Assumptions to Verify:**
- Service queries `company_name` but migration has `name`
- Service uses `pipeline_stage` but column needs verification

### 3. scores (Status Value Mismatch)

**Service:** `src/services/evaluator/scores.service.js`
**Migration:** `supabase/migrations/202601010014_create_scores.sql`

| Category | Service Uses | Migration Has | Fix Required |
|----------|--------------|---------------|--------------|
| **Status Value** | `reconciled` | `locked` | Map status or add enum value |
| **Column** | `rationale` (nullable) | `rationale NOT NULL` | Service allows null but migration requires it |
| **Column** | `scored_at` | N/A | Service sets this but column doesn't exist |

**Migration Score Statuses:** `draft`, `submitted`, `locked`
**Service Score Statuses:** `draft`, `submitted`, `reconciled`

### 4. evidence (Type/Column Mismatches)

**Service:** `src/services/evaluator/evidence.service.js`
**Migration:** `supabase/migrations/202601010013_create_evidence.sql`

| Category | Service Uses | Migration Has | Fix Required |
|----------|--------------|---------------|--------------|
| **Column Name** | `evidence_type` | `type` | Rename in service (some places) |
| **Field Reference** | `sentiment` | `confidence_level` | Service has EVIDENCE_SENTIMENT config but migration uses confidence_level |
| **Field Reference** | `created_by` (in some queries) | `captured_by` | Use correct column name |

**Evidence Type Mapping:**

| Service Type | Migration Type | Status |
|--------------|----------------|--------|
| `demo_note` | `demo_notes` | Mismatch (singular vs plural) |
| `reference_check` | `reference_check` | ✅ Match |
| `document_excerpt` | N/A | Not in migration |
| `vendor_response` | `vendor_response` | ✅ Match |
| `meeting_note` | N/A | Not in migration |
| `technical_review` | `technical_review` | ✅ Match |
| `pricing_analysis` | `commercial_review` | Mismatch |
| `poc_result` | `poc_results` | Mismatch (singular vs plural) |
| `other` | `other` | ✅ Match |

**Migration Evidence Types:** `vendor_response`, `demo_notes`, `reference_check`, `market_research`, `ai_analysis`, `poc_results`, `technical_review`, `commercial_review`, `security_review`, `compliance_review`, `other`

### 5. vendor_qa (Reference Mismatch)

**Service:** `src/services/evaluator/vendorQA.service.js`
**Migration:** `supabase/migrations/202601090003_add_vendor_qa_system.sql`

| Category | Service Uses | Migration Has | Fix Required |
|----------|--------------|---------------|--------------|
| **Join Reference** | `vendors.company_name` | `vendors.name` | Fix join query |

The service queries `vendor_qa` correctly but joins to `vendors` using wrong column name.

### 6. traceability.service.js (Multiple Issues)

**Service:** `src/services/evaluator/traceability.service.js`

| Category | Service Uses | Migration Has | Fix Required |
|----------|--------------|---------------|--------------|
| **Column** | `vendors.pipeline_stage` | Column may not exist | Verify column exists or remove query |
| **Column** | `evaluation_categories.display_order` | `sort_order` | Fix column name |

### 7. evaluation_categories (Minor)

**Service:** `src/services/evaluator/evaluationCategories.service.js`
**Migration:** `supabase/migrations/202601010004_create_evaluation_categories.sql`

| Category | Service Uses | Migration Has | Status |
|----------|--------------|---------------|--------|
| **Column** | `sort_order` | `sort_order` | ✅ Match |
| **Column** | `weight` | `weight` | ✅ Match |

**Status:** This service appears to be correctly aligned with migration.

### 8. requirements (Minor)

**Service:** `src/services/evaluator/requirements.service.js`
**Migration:** `supabase/migrations/202601010009_create_requirements.sql`

| Category | Service Uses | Migration Has | Status |
|----------|--------------|---------------|--------|
| **All columns** | Standard columns | Standard columns | ✅ Appears aligned |

**Status:** This service appears to be correctly aligned with migration. The requirement CRUD operations should work.

---

## Fix Priority Order

Based on the audit, here is the recommended fix order:

### Priority 1: Critical Path Fixes (Fix These First)

1. **vendorQuestions.service.js** - Most broken, causes BUG-008, BUG-009
   - `display_order` → `sort_order`
   - `help_text` → `guidance_for_vendors`
   - Refactor to use `vendor_question_links` junction table for requirement/criterion links
   - Map question types: `long_text`→`textarea`, `single_choice`→`multiple_choice`

2. **vendors.service.js** - Causes BUG-004, BUG-005
   - `notes` → `internal_notes`
   - Verify `name` vs `company_name` usage

3. **vendorQA.service.js** - Causes BUG-012
   - Fix join: `vendors.company_name` → `vendors.name`

### Priority 2: Data Loading Fixes

4. **traceability.service.js** - Causes BUG-018
   - Fix `display_order` → `sort_order` in category queries
   - Verify/fix `pipeline_stage` column reference

5. **scores.service.js** - May cause scoring issues
   - Map status `reconciled` → `locked` (or add migration for new status)
   - Handle required `rationale` field
   - Remove/fix `scored_at` references

6. **evidence.service.js** - Causes BUG-014
   - Fix `evidence_type` → `type` references
   - Fix `sentiment` → `confidence_level`
   - Fix `created_by` → `captured_by` references
   - Map evidence types to match migration

### Priority 3: Nice to Have

7. **Question type mapping** - Add helper function to map service types to migration types

---

## Session Notes

### 2026-01-09 Session 1

**Progress:**
- Started UAT walkthrough
- Identified 8 roles for Evaluator module
- Created this findings document for persistence
- **MAJOR**: Identified need for unified navigation and role system (ARCH-001, ARCH-002)

**Decisions Made:**
1. ✅ Role consolidation: Option C (Separate roles per app, consistent naming)
2. ✅ Role assignment: Project level
3. ⏳ Customer access method: Open question (revisit at end of UAT)

**Next Steps:**
- Continue UAT Section 2: Getting Started
- Capture feature-level permission requirements as we test
- Note which roles need access to each feature

---

### 2026-01-10 Session 2

**Progress:**
- Completed UAT Sections 7-10
- Identified total of 20 bugs and 25 feature gaps
- Created systematic remediation plan with 6 sprints

**Key Findings:**
- Many "Failed to load/save" errors suggest common root cause
- Vendor Portal Access IS working (on vendor detail page)
- Client Portal does not exist
- Entire sections missing: Risk Dashboard, Financial Analysis, Procurement Workflow

**Decisions Made:**
1. ✅ Customer PM/Contributor: Full app access (not Client Portal)
2. ✅ Remediation approach: Investigate root cause first, then fix in sprints

**UAT Statistics:**
- Bugs: 20 (6 Critical, 12 High, 2 Medium)
- Feature Gaps: 25
- Manual Corrections: 12

**Next Steps:**
- Begin Sprint 1: Root Cause Investigation
- Check browser console, network tab, Supabase logs
- Identify common causes before fixing individual bugs

---

*Document maintained during UAT session*
*Last updated: 10 January 2026*
