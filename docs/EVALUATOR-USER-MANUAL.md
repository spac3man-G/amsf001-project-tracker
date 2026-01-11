# Evaluator Module - User Manual & UAT Guide

**Version**: 1.1
**Last Updated**: 10 January 2026
**Purpose**: Training documentation and User Acceptance Testing guide

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Phase 1: Project Setup](#3-phase-1-project-setup)
4. [Phase 2: Requirements Management](#4-phase-2-requirements-management)
5. [Phase 3: Vendor Management](#5-phase-3-vendor-management)
6. [Phase 4: RFP & Vendor Responses](#6-phase-4-rfp--vendor-responses)
7. [Phase 5: Evaluation & Scoring](#7-phase-5-evaluation--scoring)
8. [Phase 6: Analysis & Decision Support](#8-phase-6-analysis--decision-support)
9. [Phase 7: Stakeholder Approvals](#9-phase-7-stakeholder-approvals)
10. [UAT Test Scenarios](#10-uat-test-scenarios)
11. [Appendix: Quick Reference](#11-appendix-quick-reference)

---

## 1. Introduction

### 1.1 What is the Evaluator Module?

The Evaluator module is a comprehensive IT vendor procurement and evaluation platform that enables procurement teams to:

- Systematically capture and manage requirements from stakeholders
- Conduct structured vendor evaluations using weighted scoring
- Leverage AI-powered analysis for response review and gap detection
- Generate audit-compliant traceability from requirements to vendor selection
- Manage the complete procurement lifecycle through to contract award

### 1.2 Key Benefits

| Benefit | Description |
|---------|-------------|
| **Structured Process** | Industry best-practice procurement workflow |
| **AI Assistance** | Automated gap detection, response scoring, vendor intelligence |
| **Full Traceability** | Audit trail from requirements through to decision |
| **Excel-Like Grid** | Bulk requirements entry with spreadsheet-style editing |
| **Real-time Analytics** | Dashboard widgets showing progress and insights |
| **Portal Access** | Secure portals for vendors and client stakeholders |

### 1.3 User Roles

| Role | Access Level | Typical Users |
|------|--------------|---------------|
| **Admin** | Full access to all features | System administrators |
| **Supplier PM** | Full access to all features | Procurement leads, evaluation managers |
| **Contributor** | Edit assigned areas | Team members helping with evaluation |
| **Viewer** | Read-only access | Observers and reviewers |

**External Portal Roles:**
| Role | Portal | Description |
|------|--------|-------------|
| **Vendor Lead** | Vendor Portal | Primary vendor contact for RFP responses |
| **Vendor Contributor** | Vendor Portal | Vendor team submitting responses |
| **Client Stakeholder** | Client Portal | External stakeholder for requirement approvals |

### 1.4 Navigation Overview

Access the Evaluator module from the sidebar menu under "Evaluator". The main dashboard provides:

- **Quick Actions** - Tile-based navigation to all major features
- **Statistics Cards** - Summary metrics (requirements, vendors, workshops, categories)
- **Analytics Widgets** - Visual progress indicators, heatmaps, and charts
- **Evaluation Switcher** - Quick switch between evaluation projects

**Main Features:**
- **Requirements** - Manage evaluation requirements (including Grid View)
- **Vendors** - Track vendor pipeline with Kanban view
- **Questions** - Create RFP questions linked to requirements
- **Q&A** - Vendor question management during RFP period
- **Evaluation** - Score vendor responses with AI assistance
- **Traceability** - View requirements-to-scores matrix
- **Reports** - Generate evaluation reports
- **Settings** - Configure project parameters

---

## 2. Getting Started

### 2.1 First-Time Access

1. Log in to Tracker with your credentials
2. Click **Evaluator** in the sidebar navigation
3. You'll see the Evaluator Dashboard

If no evaluation projects exist, you'll see an empty state prompting you to create your first project.

### 2.2 Understanding the Dashboard

The dashboard provides a comprehensive overview:

**Header Section:**
- **Evaluation Status Banner** - Shows current phase (Setup, Discovery, Requirements, Evaluation, Complete)
- **Evaluation Switcher** - Dropdown to switch between evaluation projects

**Quick Stats Cards (4):**
| Card | Shows |
|------|-------|
| Requirements | Total count and approved percentage |
| Workshops | Total and completed count |
| Vendors | Total and shortlisted count |
| Categories | Total count and weight validation status |

**Analytics Widgets (Multi-row layout):**

| Row | Widgets |
|-----|---------|
| Row 1 | Evaluation Timeline + Risk Indicators |
| Row 2 | Stakeholder Participation + Q&A Activity + Client Approval + Security Status |
| Row 3 | Score Heatmap (full-width, clickable cells) |
| Row 4 | Vendor Radar Chart (comparison view) |

**UAT Checkpoint: EV-DASH-001 - Verify Dashboard**

1. Access the Evaluator Dashboard
2. Verify all 4 stats cards display data
3. Verify analytics widgets render correctly
4. Click on Score Heatmap cells - should navigate to vendor detail

**Expected Result**: Dashboard loads with real-time data. Heatmap cells are interactive.

---

## 3. Phase 1: Project Setup

### 3.1 Creating an Evaluation Project

**UAT Checkpoint: EV-001 - Create Evaluation Project**

1. From the Dashboard, click **Create Evaluation** or navigate to **Settings**
2. Enter project details:

| Field | Example Value | Description |
|-------|---------------|-------------|
| Project Name | CSP Entity Management System | Name of the procurement project |
| Description | Procurement of entity management software | Brief description |
| Client Name | Carey Olsen Partners | Client or organisation name |
| Status | Planning | Current phase (Planning, Active, On Hold, Completed) |

3. Click **Save** to create the project

**Expected Result**: Project is created and you're redirected to the dashboard with the new project selected.

---

### 3.2 Configuring Evaluation Categories

Categories define the areas against which vendors will be evaluated. Each category has a weight that determines its importance in the overall score.

**UAT Checkpoint: EV-002 - Configure Categories**

1. Navigate to **Settings** → **Categories & Weights**
2. Click **Add Category** and create the following:

| Category Name | Weight | Description |
|---------------|--------|-------------|
| Functional Requirements | 36% | Core product functionality |
| Integration Requirements | 30% | API, data migration, system integration |
| Technical Architecture | 12% | Security, scalability, infrastructure |
| Compliance & Regulatory | 9% | GDPR, AEOI, industry standards |
| Vendor Viability | 6% | Financial stability, market position |
| Commercial Terms | 7% | Pricing, licensing, support terms |

3. Verify the **Total Weight = 100%** (validation will warn if not)
4. Click **Save Categories**

**Expected Result**: Categories are saved. Dashboard shows weight validation status.

---

### 3.3 Configuring Stakeholder Areas

Stakeholder areas represent the groups who will contribute requirements and provide approvals.

**UAT Checkpoint: EV-003 - Configure Stakeholder Areas**

1. Navigate to **Settings** → **Stakeholder Areas**
2. Click **Add Stakeholder Area** and create:

| Area Name | Color | Primary Contact |
|-----------|-------|-----------------|
| Finance | Blue | [Select user] |
| IT | Green | [Select user] |
| Compliance | Orange | [Select user] |
| Operations | Purple | [Select user] |

3. Click **Save**

**Expected Result**: Stakeholder areas are created with color coding.

---

### 3.4 Configuring Deadline Reminders

**UAT Checkpoint: EV-004 - Configure Reminders**

1. Navigate to **Settings** → **Deadline Reminders**
2. Configure reminder frequencies for:

| Reminder Type | Options |
|---------------|---------|
| Scoring Deadlines | None / 1 day / 3 days / 7 days before |
| Review Deadlines | None / 1 day / 3 days / 7 days before |
| Q&A Period End | None / 1 day / 3 days / 7 days before |
| Approval Deadlines | None / 1 day / 3 days / 7 days before |

3. Click **Save**

**Expected Result**: Reminder configurations saved. Notifications will trigger automatically.

---

## 4. Phase 2: Requirements Management

### 4.1 Understanding Requirements

Requirements are the needs and specifications that vendors must address. Each requirement has:

- **Reference Code** - Unique identifier (auto-generated, e.g., REQ-001)
- **Title** - Short descriptive name (required, max 255 chars)
- **Description** - Detailed specification (max 5000 chars)
- **Category** - Which evaluation category it belongs to
- **Stakeholder Area** - Which stakeholder group contributed it
- **Priority** - MoSCoW prioritisation (Must/Should/Could/Won't Have)
- **Status** - Workflow status (Draft, Under Review, Approved, Rejected)
- **Source Type** - How the requirement was captured
- **Weighting** - Individual requirement weighting (0-100)

---

### 4.2 Requirements Grid View (Excel-Like Interface)

The Requirements Grid View provides a spreadsheet-style interface for efficient bulk entry and editing.

**UAT Checkpoint: EV-005 - Grid View Basics**

1. Navigate to **Requirements** from the dashboard
2. Click **Grid View** to switch to spreadsheet mode
3. Observe the Excel-like interface with:
   - Frozen reference code column
   - Resizable columns
   - Row selection checkboxes
   - Toolbar with actions

**Expected Result**: Grid displays with virtualized scrolling for large datasets.

---

### 4.3 Adding Requirements via Grid

**UAT Checkpoint: EV-006 - Add Requirements in Grid**

1. In Grid View, click **Add Row** (or press `Ctrl+Insert`)
2. A new row appears with "NEW" reference code
3. Fill in the following columns:

| Column | Value | Notes |
|--------|-------|-------|
| Title | Maintain Entity Register | Required field |
| Description | System must maintain comprehensive register... | Optional |
| Priority | Must Have | Dropdown selection |
| Category | Functional Requirements | Dropdown with color badges |
| Stakeholder | Operations | Dropdown with color badges |
| Status | Draft | Default value |
| Source Type | Manual | How requirement was captured |
| Weighting | 10 | 0-100 scale |

4. Press Enter or Tab to move between cells
5. Observe auto-save indicator in toolbar

**Expected Result**: New requirement is created with auto-generated REQ-XXX reference code. Save status shows "Saved".

---

### 4.4 Grid Keyboard Shortcuts

**UAT Checkpoint: EV-007 - Keyboard Navigation**

1. Press `?` key to open Keyboard Shortcuts help modal
2. Test the following shortcuts:

| Shortcut | Action | Test Result |
|----------|--------|-------------|
| `Tab` / `Shift+Tab` | Next/Previous cell | |
| `Enter` / `Shift+Enter` | Move down/up | |
| `Arrow keys` | Move in direction | |
| `Home` / `End` | First/Last cell in row | |
| `F2` | Edit current cell | |
| `Escape` | Cancel edit | |
| `Ctrl+Z` | Undo | |
| `Ctrl+Y` | Redo | |
| `Ctrl+Insert` | Add new row | |
| `Delete` | Delete selected rows | |
| `Ctrl+C` | Copy selected rows | |
| `Ctrl+V` | Paste (opens wizard) | |

**Expected Result**: All keyboard shortcuts work. Help modal displays organized shortcuts.

---

### 4.5 Bulk Operations in Grid

**UAT Checkpoint: EV-008 - Bulk Operations**

1. Select multiple rows using checkboxes or `Ctrl+Click`
2. Selection count appears in toolbar
3. Click **Bulk Actions** dropdown
4. Test each bulk operation:

| Operation | Test Steps |
|-----------|------------|
| Set Status | Select rows → Bulk Actions → Set Status → Under Review |
| Set Priority | Select rows → Bulk Actions → Set Priority → Must Have |
| Set Category | Select rows → Bulk Actions → Set Category → [Select] |
| Set Stakeholder | Select rows → Bulk Actions → Set Stakeholder → [Select] |
| Submit for Approval | Select draft rows → Submit for Approval button |
| Delete | Select rows → Delete button → Confirm |

5. Observe progress indicator during bulk operations

**Expected Result**: Bulk operations complete with progress feedback. All selected rows updated.

---

### 4.6 Import from Excel/CSV

**UAT Checkpoint: EV-009 - File Import**

1. Click **Import** button in toolbar
2. Import Wizard opens with steps:

| Step | Description |
|------|-------------|
| 1. Upload | Drag & drop or browse for .xlsx/.csv file |
| 2. Sheet | Select which sheet to import (Excel only) |
| 3. Map Columns | Match file columns to requirement fields |
| 4. Validate | Review validation results (errors & warnings) |
| 5. Complete | See import summary |

3. Upload a test file with requirement data
4. Map columns (wizard auto-detects common names)
5. Review validation:
   - **Errors** (red) - Rows that cannot be imported
   - **Warnings** (yellow) - Rows with potential issues
6. Click **Import** - observe progress bar
7. Click **Close** when complete

**Expected Result**: Requirements imported. Progress bar shows batch progress. Validation catches issues.

---

### 4.7 Paste from Clipboard

**UAT Checkpoint: EV-010 - Paste Wizard**

1. Copy data from Excel (multiple rows, tab-separated)
2. With Grid View focused, press `Ctrl+V`
3. Paste Wizard opens:
   - Raw data preview table
   - "First row is header" checkbox
   - Column mapping dropdowns
   - Toggle between raw and mapped preview
   - Validation summary

4. Map columns to fields
5. Review validation warnings
6. Click **Import**

**Expected Result**: Paste wizard correctly parses clipboard data. Mapping applies. Data imported.

---

### 4.8 Undo/Redo Operations

**UAT Checkpoint: EV-011 - Undo/Redo**

1. Make several edits (add rows, change values)
2. Observe undo/redo buttons with badge counts
3. Hover over undo button - tooltip shows operation description
4. Click **Undo** or press `Ctrl+Z`
5. Hover over redo button - tooltip shows operation description
6. Click **Redo** or press `Ctrl+Y`

**Expected Result**: Undo/redo work with descriptive tooltips. Badge shows stack depth.

---

### 4.9 Using AI Gap Analysis

The AI Gap Analysis feature identifies potential missing requirements.

**UAT Checkpoint: EV-012 - Run AI Gap Analysis**

1. In the Requirements hub, click **AI Gap Analysis**
2. Review the AI-suggested requirements:
   - Missing security requirements?
   - Missing training/support requirements?
   - Missing performance requirements?
3. For each suggestion, click **Add** to create or **Dismiss** to ignore

**Expected Result**: AI identifies 3-5 potential gaps. You can add suggestions as new requirements.

---

### 4.10 Submitting Requirements for Review

**UAT Checkpoint: EV-013 - Submit for Review**

1. In Grid View, select draft requirements
2. Click **Submit for Approval** button
3. Confirm the submission

**Expected Result**: Selected requirements change status from "Draft" to "Under Review".

---

## 5. Phase 3: Vendor Management

### 5.1 Adding Vendors

**UAT Checkpoint: EV-014 - Add Vendors**

1. Navigate to **Vendors** from the dashboard
2. Click **Add Vendor**
3. Create vendor with fields:

| Field | Example Value |
|-------|---------------|
| Name | Vistra Technology |
| Description | Global entity management software provider |
| Website | https://vistra.com |

4. Click **Save**

**Expected Result**: Vendor appears in list with "Prospect" status.

---

### 5.2 Managing Vendor Pipeline

**UAT Checkpoint: EV-015 - Pipeline View**

1. Click **Pipeline View** toggle (Kanban view)
2. Observe columns:
   - Prospect → Pipeline → Shortlisted → Finalist → Selected
3. Drag vendor cards between columns
4. Status updates automatically

**Expected Result**: Kanban board displays vendors. Drag-and-drop updates status.

---

### 5.3 Vendor Detail Page

**UAT Checkpoint: EV-016 - Vendor Details**

1. Click on a vendor card to open details
2. Observe three tabs:
   - **Details** - Basic info, status, contacts
   - **Responses** - RFP responses with AI analysis
   - **Intelligence** - External intelligence data

3. Test the following in Details tab:
   - Edit vendor information
   - Add/edit/delete contacts
   - Set primary contact
   - Change vendor status

**Expected Result**: All vendor management actions work. Status changes are logged.

---

### 5.4 Vendor Portal Access

**UAT Checkpoint: EV-017 - Portal Access**

1. In Vendor Detail, locate **Portal Access** section
2. Click **Generate Access Code** (if not already generated)
3. Observe:
   - Access Code (8 characters)
   - Expiry Date
   - "Extend 14 days" button
   - "Revoke Access" button
4. Copy access code

**Expected Result**: Access code generated. Can extend or revoke access.

---

### 5.5 AI Market Research

**UAT Checkpoint: EV-018 - Market Research**

1. Click **Market Research** button
2. Review AI-generated content:
   - Market Summary with maturity indicator
   - Vendor count breakdown (Leaders, Challengers, Niche)
   - Key Market Trends
   - Buyer Considerations
   - Vendor suggestions with fit scores
3. Click **Add to Evaluation** for promising vendors

**Expected Result**: AI suggests relevant vendors. Can add directly to evaluation.

---

### 5.6 Vendor Intelligence Panel

**UAT Checkpoint: EV-019 - Vendor Intelligence**

1. Navigate to Vendor Detail → Intelligence tab
2. Review sections:
   - Financial Health (revenue, growth, profitability)
   - Compliance (certifications, audit status)
   - Market Data (position, ratings, reviews)
3. Click **Generate Assessment** for AI analysis
4. Review viability score and recommendations

**Expected Result**: Intelligence data displays. AI assessment provides actionable insights.

---

## 6. Phase 4: RFP & Vendor Responses

### 6.1 Creating RFP Questions

**UAT Checkpoint: EV-020 - Create Questions**

1. Navigate to **Questions** from the dashboard
2. Click **Add Question**
3. Fill in:

| Field | Value |
|-------|-------|
| Question | Describe your entity register functionality... |
| Question Type | Textarea (long response) |
| Section | Functional Requirements |
| Help Text | Include support for different entity types |
| Required | Yes (checked) |
| Linked Requirement | REQ-001 |

4. Click **Save**

**Expected Result**: Question created with requirement linkage.

**Question Types Available:**
- Text (short answer)
- Textarea (long answer)
- Yes/No (boolean)
- Multiple Choice (single selection)
- Multi-Select (multiple selections)
- Number (numeric input)
- Date (date picker)
- File Upload (document attachment)
- Compliance (compliance declaration)

---

### 6.2 Vendor Portal - Submitting Responses

**UAT Checkpoint: EV-021 - Vendor Portal Experience**

1. Open new browser window (or incognito)
2. Navigate to `/vendor-portal`
3. Enter vendor access code
4. Observe vendor portal:
   - RFP questions by section
   - Response text areas
   - File upload capability
   - Progress indicator
5. Enter test responses
6. Submit responses

**Expected Result**: Vendor can view questions, enter responses, upload files, and submit.

---

### 6.3 Managing Vendor Q&A

**UAT Checkpoint: EV-022 - Q&A Management**

1. Navigate to **Q&A** from the dashboard
2. View Q&A statistics:
   - Total questions
   - Pending / In Progress / Answered
   - Shared count
3. Expand a question to see full text
4. Respond to a question:
   - Enter response text
   - Toggle "Share with all vendors" (anonymized)
   - Click **Submit Answer**
5. Configure Q&A period:
   - Click **Settings** (gear icon)
   - Set start and end dates
   - Toggle period active/inactive

**Expected Result**: Q&A workflow works. Shared questions anonymized for other vendors.

---

## 7. Phase 5: Evaluation & Scoring

### 7.1 Understanding the Scoring System

Vendors are scored on a 1-5 scale for each criterion:

| Score | Label | Description |
|-------|-------|-------------|
| 1 | Does Not Meet | Fails to meet requirement |
| 2 | Partially Meets | Addresses some aspects |
| 3 | Meets | Fully addresses requirement |
| 4 | Exceeds | Goes beyond requirement |
| 5 | Exceptional | Outstanding response |

---

### 7.2 Scoring Vendor Responses

**UAT Checkpoint: EV-023 - Score Responses**

1. Navigate to **Evaluation** from the dashboard
2. Select a vendor from the dropdown
3. For each question/criterion:
   - Read vendor response
   - Click **AI Assist** for AI analysis
   - Enter score (1-5)
   - Add rationale
   - Click **Save Score**
4. Observe score progress indicator

**Expected Result**: Scores save successfully. Progress updates.

---

### 7.3 AI Response Analysis Panel

**UAT Checkpoint: EV-024 - AI Analysis**

1. In Scoring view, click **AI Assist** for a response
2. Review the AI Analysis panel:

| Section | Description |
|---------|-------------|
| Score Gauge | Visual 1-5 score display with color coding |
| Key Points | Extracted highlights from response |
| Identified Gaps | Missing elements with severity (Minor/Moderate/Major) |
| Strengths | Positive aspects identified |
| Suggested Score | AI recommendation with confidence level |
| Follow-up Questions | Suggested clarification questions |

3. Choose action:
   - **Accept** - Apply AI suggested score
   - **Modify** - Adjust score before saving
   - **Ignore** - Enter your own score

**Expected Result**: AI provides detailed analysis. Can accept or modify suggestions.

---

### 7.4 Adding Evidence

**UAT Checkpoint: EV-025 - Add Evidence**

1. In Evaluation view, click **Add Evidence**
2. Complete form:

| Field | Value |
|-------|-------|
| Vendor | Vistra Technology |
| Criteria | Select applicable criteria (checkboxes) |
| Evidence Type | Document Reference / Demo Notes / etc. |
| Description | Technical spec document pages 12-15... |
| Confidence Level | High / Medium / Low |
| File | Upload supporting document |

3. Click **Save**

**Expected Result**: Evidence linked to vendor/criteria. Appears in evidence list.

---

### 7.5 Viewing Response Gaps

**UAT Checkpoint: EV-026 - Response Gaps**

1. Navigate to Vendor Detail → Responses tab
2. Look for gap indicators on responses
3. Gaps show:
   - **Severity** - Minor (yellow), Moderate (orange), Major (red)
   - **Description** - What's missing
   - **Requirement** - Which requirement affected
4. Actions per gap:
   - Request Clarification
   - Accept Risk
   - Resolve
   - Dismiss

**Expected Result**: Gaps visible with severity indicators. Actions available.

---

## 8. Phase 6: Analysis & Decision Support

### 8.1 Traceability Matrix

**UAT Checkpoint: EV-027 - Traceability View**

1. Navigate to **Traceability** from the dashboard
2. View the enhanced matrix:
   - **Rows**: Requirements grouped by category
   - **Columns**: Vendors
   - **Cells**: RAG color-coded scores (Green ≥4, Amber 3-4, Red <3)
3. Use filters panel:
   - Category filter
   - Priority filter
   - MoSCoW filter
   - RAG Status filter
   - Vendor checkboxes
4. Click on a cell to drill down:
   - Original requirement
   - RFP question
   - Vendor response
   - Score and rationale
   - Evidence
5. Click **Generate Insights** for AI analysis
6. Export: **CSV**, **Excel**, or **PDF**

**Expected Result**: Matrix displays with interactive filters. Cell drill-down shows context.

---

### 8.2 AI-Generated Insights

**UAT Checkpoint: EV-028 - Matrix Insights**

1. In Traceability view, click **Generate Insights**
2. Review insight cards:

| Insight Type | Description |
|--------------|-------------|
| Vendor Strength | Areas where vendor excels |
| Vendor Weakness | Areas needing attention |
| Category Leader | Top performer per category |
| Consensus Needed | High variance in scores |
| Coverage Gap | Missing data points |
| Risk Area | Identified risks |
| Differentiator | Unique vendor capabilities |
| Recommendation | AI recommendations |

**Expected Result**: Insights generate with icons and descriptions.

---

### 8.3 Dashboard Analytics

**UAT Checkpoint: EV-029 - Analytics Widgets**

Test each dashboard widget:

| Widget | Test |
|--------|------|
| Evaluation Timeline | Shows phases and milestones |
| Risk Indicators | Displays risk summary with RAG |
| Stakeholder Participation | Engagement heatmap by area |
| Q&A Activity | Question counts and response rate |
| Client Approval | Progress ring with approval % |
| Security Status | Assessment stage and findings |
| Score Heatmap | Interactive vendor × category grid |
| Vendor Radar | Spider chart comparison |

**Expected Result**: All widgets render with real-time data.

---

### 8.4 Generating Reports

**UAT Checkpoint: EV-030 - Generate Reports**

1. Navigate to **Reports** from the dashboard
2. Select report type:

| Report | Format | Description |
|--------|--------|-------------|
| Executive Summary | PDF | High-level recommendation |
| Traceability Matrix | PDF, CSV | Requirements-to-scores mapping |
| Requirements Export | CSV | All requirements data |
| Vendor Scores | CSV | Detailed scoring data |
| Vendor Comparison | PDF, CSV | Side-by-side comparison |
| Evidence Register | CSV | All evidence collected |

3. Click **Generate**
4. Download when ready

**Expected Result**: Report generates and downloads in selected format.

---

## 9. Phase 7: Stakeholder Approvals

### 9.1 Client Portal Overview

The Client Portal allows external stakeholders to review and approve requirements.

**UAT Checkpoint: EV-031 - Client Portal Access**

1. Generate access token (admin function)
2. Share portal URL with stakeholder
3. Stakeholder accesses portal with token
4. Portal features:
   - Dashboard with progress
   - Requirements list with approval actions
   - Approval status tracking
   - Comment/revision requests

---

### 9.2 Tracking Approval Progress

**UAT Checkpoint: EV-032 - Approval Widget**

1. View **Client Approval Widget** on dashboard
2. See progress ring with overall approval %
3. View breakdown by stakeholder area
4. Click to see which stakeholders have approved

**Expected Result**: Approval progress visible with stakeholder breakdown.

---

## 10. UAT Test Scenarios

### 10.1 Complete End-to-End Scenario

**Scenario: CSP Entity Management System Procurement**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Create evaluation project "CSP Entity Management" | Project created, dashboard loads | |
| 2 | Configure 6 evaluation categories (total 100%) | Categories saved, validation passes | |
| 3 | Configure 4 stakeholder areas | Areas created with colors | |
| 4 | Open Requirements Grid View | Excel-like interface displays | |
| 5 | Add 5 requirements using keyboard shortcuts | Requirements created with ref codes | |
| 6 | Test Undo/Redo functionality | Operations reverse/restore correctly | |
| 7 | Import 10 requirements from Excel file | Import wizard completes with progress | |
| 8 | Paste 5 requirements from clipboard | Paste wizard maps and imports | |
| 9 | Use bulk operations to set category | All selected rows updated | |
| 10 | Run AI Gap Analysis | AI suggests additional requirements | |
| 11 | Submit requirements for review | Status changes to Under Review | |
| 12 | Add 3 vendors | Vendors appear with Prospect status | |
| 13 | Move vendors through pipeline | Kanban updates vendor status | |
| 14 | Generate vendor portal access | Access codes created | |
| 15 | Create 5 RFP questions linked to requirements | Questions created with mappings | |
| 16 | Submit vendor responses (via portal) | Responses recorded | |
| 17 | Score vendor responses with AI assist | Scores saved with AI analysis | |
| 18 | Add evidence for key scores | Evidence linked | |
| 19 | View traceability matrix | Matrix displays with RAG colors | |
| 20 | Generate AI insights | Insights display | |
| 21 | Export traceability report | CSV/PDF downloads | |
| 22 | Generate executive summary report | Report generates | |

---

### 10.2 Requirements Grid View Test Scenarios

**Scenario: Grid Navigation & Editing**

| Test | Steps | Expected |
|------|-------|----------|
| Cell navigation | Tab through cells | Moves left-to-right, top-to-bottom |
| Edit cell | Press F2 or start typing | Cell enters edit mode |
| Cancel edit | Press Escape | Edit cancelled, original value restored |
| Save edit | Press Enter or Tab | Edit saved, auto-save triggers |
| Add row | Press Ctrl+Insert | New row added at bottom |
| Delete rows | Select rows, press Delete | Rows removed after confirm |
| Undo | Press Ctrl+Z | Previous state restored |
| Redo | Press Ctrl+Y | Undone change reapplied |
| Copy rows | Select rows, Ctrl+C | Tab-separated data to clipboard |
| Paste data | Ctrl+V with tabular data | Paste wizard opens |

**Scenario: Bulk Operations**

| Test | Steps | Expected |
|------|-------|----------|
| Select all | Click header checkbox | All rows selected |
| Multi-select | Ctrl+Click multiple rows | Multiple rows selected |
| Range select | Shift+Click | Range of rows selected |
| Bulk status | Select → Bulk Actions → Set Status | All selected updated |
| Bulk priority | Select → Bulk Actions → Set Priority | All selected updated |
| Bulk category | Select → Bulk Actions → Set Category | All selected updated |
| Bulk stakeholder | Select → Bulk Actions → Set Stakeholder | All selected updated |
| Submit for approval | Select draft rows → Submit | Status changes to Under Review |

---

### 10.3 Error Handling Scenarios

| Scenario | Action | Expected Behavior |
|----------|--------|-------------------|
| Missing title | Save row without title | Cell shows error, row not saved |
| Title too long | Enter >255 characters | Validation error displayed |
| Invalid category weights | Save categories totaling ≠100% | Warning displayed |
| Expired portal token | Access client portal with expired token | Error: "Token has expired" |
| Delete vendor with responses | Attempt delete | Warning with confirmation |
| Network error during save | Disconnect during save | Error status shown, retry available |

---

### 10.4 Performance Test Scenarios

| Scenario | Test | Acceptable Threshold |
|----------|------|---------------------|
| Load 100 requirements in grid | Time to display | < 2 seconds |
| Bulk update 50 rows | Time to complete | < 5 seconds |
| Import 100 row Excel file | Import time | < 10 seconds |
| Load traceability matrix (50 req × 5 vendors) | Render time | < 3 seconds |
| Generate AI analysis | Response time | < 10 seconds |
| Export large report | Generation time | < 30 seconds |

---

## 11. Appendix: Quick Reference

### 11.1 Keyboard Shortcuts

**Requirements Grid:**

| Shortcut | Action |
|----------|--------|
| `Tab` / `Shift+Tab` | Next/Previous cell |
| `Enter` / `Shift+Enter` | Move down/up |
| `Arrow keys` | Move in direction |
| `Home` / `End` | First/Last cell in row |
| `Page Up` / `Page Down` | Scroll page |
| `F2` | Edit cell |
| `Escape` | Cancel edit |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Ctrl+Insert` | Add new row |
| `Delete` | Delete selected rows |
| `Ctrl+C` | Copy selected rows |
| `Ctrl+V` | Paste (opens wizard) |
| `?` | Show keyboard help |

**Global:**

| Shortcut | Action |
|----------|--------|
| `Escape` | Close modal/dialog |
| `Enter` | Confirm action |

### 11.2 Status Definitions

**Requirement Status:**
| Status | Description |
|--------|-------------|
| Draft | Initial creation, can be edited |
| Under Review | Submitted for stakeholder review |
| Approved | Stakeholder approved, locked |
| Rejected | Stakeholder rejected, needs revision |

**Vendor Status:**
| Status | Description |
|--------|-------------|
| Prospect | Initial lead |
| Pipeline | Under evaluation |
| Shortlisted | Selected for detailed evaluation |
| Finalist | Final candidates |
| Selected | Chosen vendor |
| Rejected | Not proceeding |
| Archived | Historical record |

**Q&A Status:**
| Status | Description |
|--------|-------------|
| Pending | Awaiting response |
| In Progress | Being answered |
| Answered | Response provided |
| Rejected | Question rejected |

### 11.3 Score Definitions

| Score | Label | Description |
|-------|-------|-------------|
| 1 | Does Not Meet | Fails to meet requirement |
| 2 | Partially Meets | Addresses some aspects |
| 3 | Meets | Fully addresses requirement |
| 4 | Exceeds | Goes beyond requirement |
| 5 | Exceptional | Outstanding response |

### 11.4 MoSCoW Priority Definitions

| Priority | Description |
|----------|-------------|
| Must Have | Essential requirement, non-negotiable |
| Should Have | Important but not critical |
| Could Have | Desirable if time/budget allows |
| Won't Have | Out of scope for this evaluation |

### 11.5 RAG Status Colors

| Status | Color | Criteria |
|--------|-------|----------|
| Green | #dcfce7 | Score ≥ 4 |
| Amber | #fef3c7 | Score 3-4 |
| Red | #fee2e2 | Score < 3 |
| None | #f3f4f6 | No score |

### 11.6 Gap Severity Definitions

| Severity | Color | Description |
|----------|-------|-------------|
| Minor | Yellow | Small omission |
| Moderate | Orange | Notable gap |
| Major | Red | Significant issue |

### 11.7 Source Types

| Type | Description |
|------|-------------|
| Manual | Manually entered |
| Workshop | Captured in workshop |
| Interview | From stakeholder interview |
| Document | Extracted from document |
| Survey | From survey response |
| Market Analysis | From market research |
| Competitor Analysis | From competitive analysis |
| AI | AI-generated suggestion |

### 11.8 Common Workflows

**Creating a New Evaluation:**
```
Settings → Create Project → Configure Categories →
Configure Stakeholder Areas → Open Requirements →
Add via Grid View or Import → Submit for Review
```

**Bulk Requirements Entry:**
```
Requirements → Grid View → Add Row (Ctrl+Insert) →
Fill cells (Tab to navigate) → Auto-save →
Select rows → Bulk Actions → Set Category/Priority
```

**Import from Excel:**
```
Grid View → Import → Upload file → Select sheet →
Map columns → Validate → Import → Close
```

**Scoring a Vendor:**
```
Evaluation → Select Vendor → Review Response →
Click AI Assist → Review Analysis →
Accept/Modify Score → Add Rationale → Save
```

**Client Approval:**
```
Generate Token → Send to Client → Client Reviews →
Approves/Requests Revision → Track in Dashboard
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 09 Jan 2026 | System | Initial creation |
| 1.1 | 10 Jan 2026 | System | Added Requirements Grid View (FE-007), updated analytics, fixed bug status |

---

*For technical support or feature requests, contact the system administrator.*
