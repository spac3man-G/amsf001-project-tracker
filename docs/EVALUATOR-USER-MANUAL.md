# Evaluator Module - User Manual & UAT Guide

**Version**: 1.0
**Last Updated**: 09 January 2026
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
10. [Phase 8: Post-Selection Workflow](#10-phase-8-post-selection-workflow)
11. [UAT Test Scenarios](#11-uat-test-scenarios)
12. [Appendix: Quick Reference](#12-appendix-quick-reference)

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
| **AI Assistance** | Automated gap detection, response scoring, anomaly flagging |
| **Full Traceability** | Audit trail from requirements through to decision |
| **Stakeholder Engagement** | Portals for client approval and vendor response |
| **Financial Analysis** | TCO calculation and sensitivity analysis |
| **Risk Management** | Integrated risk tracking and security assessments |

### 1.3 User Roles

| Role | Access Level | Typical Users |
|------|--------------|---------------|
| **Admin** | Full access to all features | System administrators |
| **Supplier PM** | Full access to all features | Procurement leads, evaluation managers |

### 1.4 Navigation Overview

Access the Evaluator module from the sidebar menu under "Evaluator". The main dashboard provides quick-action tiles for all major features:

- **Requirements** - Manage evaluation requirements
- **Vendors** - Track vendor pipeline
- **Questions** - Create RFP questions
- **Q&A** - Vendor question management
- **Evaluation** - Score vendor responses
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

The dashboard provides:

- **Evaluation Switcher** - Select between multiple evaluation projects (top of page)
- **Quick Actions** - Tile-based navigation to all features
- **Statistics Cards** - Summary metrics (requirements, vendors, workshops, categories)
- **Analytics Widgets** - Visual progress indicators and charts

---

## 3. Phase 1: Project Setup

### 3.1 Creating an Evaluation Project

**UAT Checkpoint: EV-001 - Create Evaluation Project**

1. From the Dashboard, click **Create Evaluation** or navigate to **Settings**
2. Enter project details:

| Field | Example Value | Description |
|-------|---------------|-------------|
| Project Name | CSP Entity Management System | Name of the procurement project |
| Description | Procurement of entity management software for CSP operations | Brief description |
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

3. Verify the **Total Weight = 100%** (validation will prevent saving if not)
4. Click **Save Categories**

**Expected Result**: Categories are saved. Dashboard shows "100%" for category weight validation.

---

### 3.3 Configuring Stakeholder Areas

Stakeholder areas represent the groups who will contribute requirements and provide approvals.

**UAT Checkpoint: EV-003 - Configure Stakeholder Areas**

1. Navigate to **Settings** → **Stakeholder Areas**
2. Click **Add Stakeholder Area** and create:

| Area Name | Weight | Approval Threshold | Primary Contact |
|-----------|--------|-------------------|-----------------|
| Finance | 36% | 75% | [Select user] |
| IT | 30% | 75% | [Select user] |
| Compliance | 21% | 75% | [Select user] |
| Operations | 13% | 75% | [Select user] |

3. Click **Save**

**Expected Result**: Stakeholder areas are created. Phase gate approvals will require sign-off from each area.

---

### 3.4 Configuring Phase Gates

Phase gates are approval checkpoints that require stakeholder sign-off before proceeding.

**UAT Checkpoint: EV-004 - Configure Phase Gates**

1. Navigate to **Settings** → **Approval Workflow**
2. Configure the following phase gates:

| Phase Gate | Enabled | Threshold | Description |
|------------|---------|-----------|-------------|
| Requirements Approved | Yes | 75% | All stakeholder areas must approve requirements |
| RFP Ready | Yes | 75% | Approval before sending RFP to vendors |
| Vendor Selected | Yes | 80% | Final approval for vendor selection |

3. Click **Save**

**Expected Result**: Phase gates are configured. Progress will be tracked in the dashboard.

---

## 4. Phase 2: Requirements Management

### 4.1 Understanding Requirements

Requirements are the needs and specifications that vendors must address. Each requirement has:

- **Reference Code** - Unique identifier (e.g., REQ-001)
- **Title** - Short descriptive name
- **Description** - Detailed specification
- **Category** - Which evaluation category it belongs to
- **Stakeholder Area** - Which stakeholder group contributed it
- **Priority** - MoSCoW prioritisation (Must/Should/Could/Won't Have)
- **Status** - Workflow status (Draft, Under Review, Approved, Rejected)

---

### 4.2 Creating Requirements

**UAT Checkpoint: EV-005 - Create Requirements**

1. Navigate to **Requirements** from the dashboard
2. Click **Add Requirement**
3. Enter the following example requirements:

**Requirement 1: Entity Register**
| Field | Value |
|-------|-------|
| Reference Code | REQ-001 |
| Title | Maintain Entity Register |
| Description | System must maintain a comprehensive register of all entities including companies, trusts, and partnerships with full ownership hierarchy |
| Category | Functional Requirements |
| Stakeholder Area | Operations |
| Priority | Must Have |

**Requirement 2: AEOI Automation**
| Field | Value |
|-------|-------|
| Reference Code | REQ-002 |
| Title | AEOI Automated Reporting |
| Description | System must automatically generate AEOI (CRS/FATCA) reports with validation rules and submission to tax authorities |
| Category | Compliance & Regulatory |
| Stakeholder Area | Compliance |
| Priority | Must Have |

**Requirement 3: API Integration**
| Field | Value |
|-------|-------|
| Reference Code | REQ-003 |
| Title | REST API for Integration |
| Description | System must provide documented REST APIs for integration with existing practice management and accounting systems |
| Category | Integration Requirements |
| Stakeholder Area | IT |
| Priority | Must Have |

**Requirement 4: Real-time Reporting**
| Field | Value |
|-------|-------|
| Reference Code | REQ-004 |
| Title | Real-time Dashboard Reporting |
| Description | System should provide real-time dashboards showing entity status, upcoming deadlines, and compliance metrics |
| Category | Functional Requirements |
| Stakeholder Area | Finance |
| Priority | Should Have |

**Requirement 5: Data Migration**
| Field | Value |
|-------|-------|
| Reference Code | REQ-005 |
| Title | Legacy Data Migration |
| Description | Vendor must provide tools and support for migrating data from existing entity management spreadsheets and systems |
| Category | Integration Requirements |
| Stakeholder Area | IT |
| Priority | Must Have |

4. Click **Save** after each requirement

**Expected Result**: Requirements appear in the list with "Draft" status. Dashboard shows requirement count updated.

---

### 4.3 Using AI Gap Analysis

The AI Gap Analysis feature identifies potential missing requirements based on your evaluation context.

**UAT Checkpoint: EV-006 - Run AI Gap Analysis**

1. In the Requirements hub, click **AI Gap Analysis**
2. Review the AI-suggested requirements:
   - Missing security requirements?
   - Missing training/support requirements?
   - Missing performance requirements?
3. For each suggestion, click **Add** to create as a new requirement or **Dismiss** to ignore

**Expected Result**: AI identifies 3-5 potential gaps. You can add relevant suggestions as new requirements.

---

### 4.4 Submitting Requirements for Review

Once requirements are complete, submit them for stakeholder approval.

**UAT Checkpoint: EV-007 - Submit for Review**

1. Select requirements to submit (use checkboxes for bulk selection)
2. Click **Submit for Review**
3. Confirm the submission

**Expected Result**: Selected requirements change status from "Draft" to "Under Review".

---

### 4.5 Filtering and Searching Requirements

**UAT Checkpoint: EV-008 - Filter Requirements**

1. Use the filter panel to:
   - Filter by Category: Select "Functional Requirements"
   - Filter by Priority: Select "Must Have"
   - Filter by Status: Select "Under Review"
   - Search: Type "entity" in the search box

2. Click **Clear Filters** to reset

**Expected Result**: Requirements list updates to show only matching items. Filter badges show active filters.

---

## 5. Phase 3: Vendor Management

### 5.1 Adding Vendors

**UAT Checkpoint: EV-009 - Add Vendors**

1. Navigate to **Vendors** from the dashboard
2. Click **Add Vendor**
3. Create the following test vendors:

**Vendor 1: Vistra Technology**
| Field | Value |
|-------|-------|
| Name | Vistra Technology |
| Description | Global entity management software provider specialising in corporate services |
| Website | https://vistra.com |
| Primary Contact Name | John Smith |
| Primary Contact Email | john.smith@vistra.com |
| Primary Contact Phone | +44 20 1234 5678 |

**Vendor 2: CSC Global**
| Field | Value |
|-------|-------|
| Name | CSC Global |
| Description | Enterprise entity management and compliance platform |
| Website | https://cscglobal.com |
| Primary Contact Name | Sarah Johnson |
| Primary Contact Email | sarah.johnson@csc.com |

**Vendor 3: Diligent Entities**
| Field | Value |
|-------|-------|
| Name | Diligent Entities |
| Description | Board and entity management software with compliance automation |
| Website | https://diligent.com |
| Primary Contact Name | Michael Brown |
| Primary Contact Email | m.brown@diligent.com |

4. Click **Save** after each vendor

**Expected Result**: Vendors appear in the list with "Lead" status.

---

### 5.2 Managing Vendor Pipeline

The vendor pipeline shows vendors progressing through evaluation stages.

**UAT Checkpoint: EV-010 - Manage Pipeline**

1. Click **Pipeline View** toggle (Kanban view)
2. Observe the columns: Lead → In Pipeline → Shortlist → Under Evaluation → Selected
3. Drag "Vistra Technology" from Lead to "In Pipeline"
4. Drag "CSC Global" from Lead to "In Pipeline"
5. Drag "Diligent Entities" from Lead to "In Pipeline"

**Expected Result**: Vendors move between columns. Status is updated automatically.

---

### 5.3 AI Market Research

Use AI to discover additional vendors based on your requirements.

**UAT Checkpoint: EV-011 - AI Market Research**

1. Click **Market Research** button
2. Review the AI-generated vendor suggestions
3. For promising vendors, click **Add to Evaluation**

**Expected Result**: AI suggests 3-5 relevant vendors based on your requirements. You can add them directly to the evaluation.

---

### 5.4 Generating Vendor Portal Access

Vendors need portal access to submit their RFP responses.

**UAT Checkpoint: EV-012 - Generate Portal Access**

1. Click on a vendor card to open details
2. Click **Portal Access** tab
3. Click **Generate Access Code**
4. Copy the generated access URL

**Expected Result**: A unique access code is generated. The URL can be shared with the vendor for portal access.

---

## 6. Phase 4: RFP & Vendor Responses

### 6.1 Creating RFP Questions

RFP questions are sent to vendors and mapped to requirements.

**UAT Checkpoint: EV-013 - Create RFP Questions**

1. Navigate to **Questions** from the dashboard
2. Click **Add Question**
3. Create the following questions:

**Question 1:**
| Field | Value |
|-------|-------|
| Question Text | Describe your entity register functionality including support for different entity types (companies, trusts, partnerships) and ownership hierarchies. |
| Category | Functional Requirements |
| Linked Requirements | REQ-001 |
| Order | 1 |

**Question 2:**
| Field | Value |
|-------|-------|
| Question Text | Explain your AEOI (CRS/FATCA) automated reporting capabilities including validation rules, submission formats, and supported jurisdictions. |
| Category | Compliance & Regulatory |
| Linked Requirements | REQ-002 |
| Order | 2 |

**Question 3:**
| Field | Value |
|-------|-------|
| Question Text | Provide technical documentation for your REST API including authentication, available endpoints, rate limits, and integration patterns. |
| Category | Integration Requirements |
| Linked Requirements | REQ-003 |
| Order | 3 |

**Question 4:**
| Field | Value |
|-------|-------|
| Question Text | Describe your approach to data migration from legacy systems including tools provided, typical timelines, and support offered. |
| Category | Integration Requirements |
| Linked Requirements | REQ-005 |
| Order | 4 |

**Question 5:**
| Field | Value |
|-------|-------|
| Question Text | Provide a detailed pricing breakdown including licensing model, implementation costs, annual support fees, and any additional charges. |
| Category | Commercial Terms |
| Order | 5 |

4. Click **Save** after each question

**Expected Result**: Questions appear in the list, linked to their respective requirements and categories.

---

### 6.2 Vendor Portal - Submitting Responses

This simulates what vendors see when accessing their portal.

**UAT Checkpoint: EV-014 - Vendor Portal Experience**

1. Open a new browser window (or incognito mode)
2. Navigate to the vendor portal URL: `/vendor-portal`
3. Enter the access code generated for Vistra Technology
4. Observe:
   - RFP questions are displayed
   - Response text areas are available
   - Document upload option is present
   - Submission progress is tracked

5. Enter test responses:

**Response to Question 1 (Entity Register):**
> Vistra's Entity Management platform provides comprehensive entity register functionality supporting:
> - Companies (private, public, holding)
> - Trusts (discretionary, unit, charitable)
> - Partnerships (limited, general, LLP)
> - Foundations and associations
>
> Our multi-level ownership hierarchy supports unlimited levels with visual org chart representation. Key features include beneficial ownership tracking, UBO identification, and automatic ownership percentage calculations.

**Response to Question 2 (AEOI):**
> Our AEOI module delivers fully automated CRS and FATCA reporting:
> - Supports 100+ jurisdictions
> - Automatic data validation against schema requirements
> - Direct XML generation in OECD-compliant format
> - Integration with tax authority portals where available
>
> Annual licence includes unlimited report generation. Implementation typically takes 2-4 weeks.

6. Click **Submit Response** for each question
7. Click **Final Submission** when all responses are complete

**Expected Result**: Vendor can view questions, enter responses, upload documents, and submit. Submission status updates to "Submitted".

---

### 6.3 Managing Vendor Q&A

Vendors can submit clarifying questions during the RFP period.

**UAT Checkpoint: EV-015 - Vendor Q&A Management**

1. Navigate to **Q&A** from the dashboard
2. Observe any questions submitted by vendors
3. To answer a question:
   - Click on the question
   - Enter your response
   - Choose whether to **Share with All Vendors** (anonymised)
   - Click **Submit Answer**

4. To enable/disable Q&A period:
   - Click **Q&A Settings**
   - Set start and end dates
   - Toggle **Q&A Period Active**

**Expected Result**: Questions are answered and optionally shared with all vendors. Q&A period can be controlled.

---

## 7. Phase 5: Evaluation & Scoring

### 7.1 Understanding the Scoring System

Vendors are scored on a 0-5 scale for each criterion:

| Score | Meaning |
|-------|---------|
| 0 | Not addressed / No response |
| 1 | Does not meet requirement |
| 2 | Partially meets requirement |
| 3 | Meets requirement |
| 4 | Exceeds requirement |
| 5 | Significantly exceeds requirement |

---

### 7.2 Scoring Vendor Responses

**UAT Checkpoint: EV-016 - Score Vendor Responses**

1. Navigate to **Evaluation** from the dashboard
2. Select **Scoring** tab
3. Select "Vistra Technology" from the vendor dropdown
4. For each question/criterion, review the vendor response and assign a score:

| Question | Response Summary | Score | Rationale |
|----------|-----------------|-------|-----------|
| Entity Register | Comprehensive support for all entity types, ownership hierarchy | 4 | Exceeds requirements with visual org charts |
| AEOI Reporting | Full automation, 100+ jurisdictions | 5 | Significantly exceeds with direct portal integration |
| REST API | Documentation provided, standard patterns | 3 | Meets requirements |
| Data Migration | Tools provided, 2-4 week timeline | 4 | Exceeds with dedicated migration support |
| Pricing | Clear breakdown, competitive rates | 3 | Meets expectations |

5. Click **Save Score** after each entry

**Expected Result**: Scores are saved. Vendor progress indicator updates. Average score calculates.

---

### 7.3 Using AI Score Suggestions

The AI can analyse vendor responses and suggest appropriate scores.

**UAT Checkpoint: EV-017 - AI Score Suggestions**

1. In the Scoring tab, click **AI Analysis** for a vendor response
2. Review the AI panel showing:
   - **Summary**: Brief summary of the response
   - **Key Points**: Extracted highlights
   - **Gaps**: Identified missing elements
   - **Strengths**: Notable positives
   - **Suggested Score**: AI-recommended score with confidence level
   - **Rationale**: Explanation for the suggestion

3. Choose to:
   - **Accept** the AI suggestion (applies score automatically)
   - **Modify** the suggestion (adjust and save with your rationale)
   - **Ignore** and enter your own score

**Expected Result**: AI provides analysis and score suggestion. You can accept, modify, or override.

---

### 7.4 Adding Evidence

Support your scores with evidence from vendor submissions.

**UAT Checkpoint: EV-018 - Add Evidence**

1. Select **Evidence** tab
2. Click **Add Evidence**
3. Complete the form:

| Field | Value |
|-------|-------|
| Vendor | Vistra Technology |
| Criterion | Entity Register |
| Evidence Type | Document Reference |
| Description | Technical specification document page 12-15 demonstrates entity hierarchy capability |
| Document | [Upload or link to document] |
| Sentiment | Positive |

4. Click **Save**

**Expected Result**: Evidence is linked to the vendor/criterion combination. Appears in evidence list and scoring context.

---

### 7.5 Multi-Evaluator Score Reconciliation

When multiple evaluators score the same vendor, reconciliation ensures consensus.

**UAT Checkpoint: EV-019 - Score Reconciliation**

1. Select **Reconciliation** tab
2. View the reconciliation matrix showing:
   - Evaluator scores side-by-side
   - Variance indicators (highlight discrepancies > 1 point)
   - Discussion thread for each criterion

3. For items with variance:
   - Click to expand discussion
   - Add comments explaining your score
   - Propose a consensus score
   - Other evaluators can agree or counter-propose

4. Click **Set Consensus Score** when agreement is reached

**Expected Result**: Discrepancies are highlighted. Discussion facilitates consensus. Final consensus score is recorded.

---

### 7.6 AI Gap Detection

AI automatically identifies gaps in vendor responses.

**UAT Checkpoint: EV-020 - Review Response Gaps**

1. Navigate to **Evaluation** → **Gaps** tab
2. Review the gap panel showing:
   - **Gap Type**: Scope, Ambiguity, Exclusion, Risk, Incomplete, Commitment, Compliance
   - **Severity**: Low, Medium, High, Critical
   - **Description**: What's missing or unclear
   - **Requirement**: Which requirement is affected

3. For each gap:
   - **Request Clarification**: Send question to vendor
   - **Accept Risk**: Acknowledge and proceed
   - **Resolve**: Mark as addressed
   - **Dismiss**: Remove if not valid

**Expected Result**: Gaps are listed with severity. You can manage resolution workflow for each.

---

### 7.7 Anomaly Detection

Statistical analysis flags outliers that may indicate issues.

**UAT Checkpoint: EV-021 - Review Anomalies**

1. Navigate to **Evaluation** → **Anomalies** tab (or Dashboard widget)
2. Review flagged anomalies:

| Type | Example | Risk |
|------|---------|------|
| Price | Vistra 30% below median pricing | May indicate scope gap |
| Schedule | Vendor promising 50% faster implementation | May be unrealistic |
| Compliance | Missing SOC 2 certification | May require clarification |

3. For each anomaly:
   - Click to expand details
   - View comparison data
   - Choose action: **Investigate**, **Accept Risk**, **Dismiss**

**Expected Result**: Statistical outliers are highlighted. You can investigate or accept with documented rationale.

---

### 7.8 Security Assessments

Multi-stage security evaluation throughout the procurement process.

**UAT Checkpoint: EV-022 - Security Assessment**

1. Navigate to **Evaluation** → **Security** tab (or from Dashboard)
2. Observe the three assessment stages:

| Stage | When | Focus |
|-------|------|-------|
| Initial RFP | With RFP submission | Basic security questionnaire |
| Technical Review | Shortlisted vendors | Architecture review, pen test reports |
| POC Validation | Final vendor | Sandbox testing, integration security |

3. For Stage 1 (Initial RFP):
   - Click **Send Questionnaire** for a vendor
   - Review submitted responses
   - Score the assessment (0-10)
   - Assign risk level (Low/Medium/High/Critical)

4. For identified issues:
   - Click **Add Finding**
   - Enter finding details, severity, remediation required
   - Assign owner and due date
   - Track resolution status

**Expected Result**: Security questionnaires are sent and tracked. Findings are logged with remediation workflow.

---

## 8. Phase 6: Analysis & Decision Support

### 8.1 Traceability Matrix

The traceability matrix provides complete visibility from requirements to scores.

**UAT Checkpoint: EV-023 - Traceability Matrix**

1. Navigate to **Traceability** from the dashboard
2. Observe the matrix:
   - **Rows**: Requirements (grouped by category)
   - **Columns**: Vendors
   - **Cells**: Color-coded scores (green=high, yellow=medium, red=low)

3. Use filters to focus:
   - Category: "Functional Requirements"
   - Priority: "Must Have"
   - RAG Status: "Red" (to see problem areas)

4. Click on a cell to see:
   - Original requirement text
   - RFP question asked
   - Vendor response
   - Score with rationale
   - Supporting evidence

5. Click **Generate Insights** for AI analysis
6. Click **Export CSV** to download the matrix

**Expected Result**: Matrix displays with filters. Cell drill-down shows full context. Export generates CSV file.

---

### 8.2 Risk Dashboard

Track procurement risks and issues throughout the evaluation.

**UAT Checkpoint: EV-024 - Risk Dashboard**

1. Navigate to **Risks** (from Dashboard or side panel)
2. View the risk matrix (Probability × Impact)
3. Click **Add Risk** and create:

| Field | Value |
|-------|-------|
| Title | Vendor Integration Complexity |
| Description | Vistra's API documentation suggests complex integration patterns that may extend implementation timeline |
| Category | Integration |
| Probability | Medium |
| Impact | High |
| Mitigation Plan | Request detailed integration workshop during POC phase |
| Owner | [Select user] |
| Due Date | [Select date] |

4. Click **Save**
5. View the risk on the matrix (position based on probability/impact)
6. Update status as mitigation progresses

**Expected Result**: Risk is created and positioned on matrix. Can track mitigation status.

---

### 8.3 Financial Analysis (TCO)

Calculate Total Cost of Ownership for vendor comparison.

**UAT Checkpoint: EV-025 - TCO Analysis**

1. Navigate to **Financial Analysis** (from Dashboard or Reports)
2. Select **Cost Breakdown** tab
3. Click **Add Cost** for Vistra Technology:

| Category | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|----------|--------|--------|--------|--------|--------|
| License | £180,000 | £180,000 | £185,400 | £185,400 | £190,962 |
| Implementation | £120,000 | - | - | - | - |
| Data Migration | £50,000 | - | - | - | - |
| Training | £30,000 | £5,000 | £5,000 | £5,000 | £5,000 |
| Support | £45,000 | £45,000 | £46,350 | £46,350 | £47,741 |
| Infrastructure | £20,000 | £20,000 | £20,000 | £20,000 | £20,000 |

4. Click **Calculate TCO** to see:
   - 5-Year TCO
   - Net Present Value (NPV)
   - Cost per user per month
   - Vendor ranking by TCO

5. Repeat for other vendors to enable comparison

**Expected Result**: TCO calculates for each vendor. Comparison chart shows ranking.

---

### 8.4 Sensitivity Analysis

Model "what if" scenarios to test decision robustness.

**UAT Checkpoint: EV-026 - Sensitivity Analysis**

1. In Financial Analysis, select **Sensitivity** tab
2. Click **Create Scenario**
3. Enter scenario details:

| Field | Value |
|-------|-------|
| Scenario Name | Implementation Overrun 20% |
| Variable | Implementation Cost |
| Adjustment Type | Percent |
| Adjustment Value | +20% |

4. Click **Run Analysis**
5. Review impact:
   - Does the ranking change?
   - What's the TCO impact?
   - Which vendors are most sensitive?

**Expected Result**: Scenario is applied. Impact on vendor ranking is shown. Sensitivity to different variables is visible.

---

### 8.5 ROI Calculation

Calculate return on investment for the selected solution.

**UAT Checkpoint: EV-027 - ROI Calculation**

1. In Financial Analysis, select **ROI** tab
2. Click **Add Benefit** and enter expected benefits:

| Benefit Category | Annual Value | Description |
|-----------------|--------------|-------------|
| Efficiency Gains | £150,000 | Staff time saved on manual entity management |
| Risk Reduction | £50,000 | Avoided compliance penalties |
| Revenue Enablement | £30,000 | Faster client onboarding |

3. Click **Calculate ROI** to see:
   - Total 5-year benefits
   - Net ROI
   - Payback period
   - ROI percentage

**Expected Result**: ROI calculates based on costs and benefits. Payback period shows when investment recovers.

---

### 8.6 Vendor Intelligence

Review external intelligence on shortlisted vendors.

**UAT Checkpoint: EV-028 - Vendor Intelligence**

1. Navigate to Vendor details for a shortlisted vendor
2. Select **Intelligence** tab
3. Review available data sections:

| Section | Data |
|---------|------|
| Financial Health | Funding rounds, revenue estimates, employee count |
| Compliance | Certifications (SOC 2, ISO 27001), sanctions check |
| Reviews | G2, Capterra, Gartner ratings |
| Market Intel | Recent news, partnerships, awards |

4. Click **Generate AI Assessment** to get:
   - Viability score (0-100)
   - Risk factors
   - Strengths and weaknesses
   - Due diligence recommendations

**Expected Result**: Intelligence data is displayed. AI assessment provides viability scoring with recommendations.

---

### 8.7 Generating Reports

Create comprehensive evaluation reports.

**UAT Checkpoint: EV-029 - Generate Reports**

1. Navigate to **Reports** from the dashboard
2. Select report type:

| Report | Purpose |
|--------|---------|
| Executive Summary | High-level recommendation with rationale |
| Detailed Evaluation | Complete scoring breakdown by vendor/category |
| Financial Analysis | TCO comparison and ROI analysis |
| Risk Assessment | Risk matrix and mitigation status |
| Traceability Report | Full audit trail |

3. Configure options:
   - Include/exclude vendors
   - Date range
   - Sections to include

4. Click **Generate Report**
5. Choose format: **PDF** or **Excel**

**Expected Result**: Report generates with selected content. Download is available in chosen format.

---

## 9. Phase 7: Stakeholder Approvals

### 9.1 Understanding Phase Gates

Phase gates require stakeholder sign-off before proceeding to the next phase:

| Phase Gate | Purpose | Threshold |
|------------|---------|-----------|
| Requirements Approved | Confirm requirements are complete and accurate | 75% of stakeholder areas |
| RFP Ready | Approve RFP for distribution to vendors | 75% of stakeholder areas |
| Vendor Selected | Final approval of vendor recommendation | 80% of stakeholder areas |

---

### 9.2 Generating Client Portal Access

Create tokens for external stakeholders to access the approval portal.

**UAT Checkpoint: EV-030 - Create Client Portal Access**

1. Navigate to **Settings** → **Client Portal Access**
2. Click **Generate Token**
3. Enter stakeholder details:

| Field | Value |
|-------|-------|
| Stakeholder Name | Jane Wilson |
| Email | jane.wilson@client.com |
| Stakeholder Area | Finance |
| Expiry | 14 days from now |

4. Click **Generate**
5. Copy the portal URL and token
6. Send to the stakeholder

**Expected Result**: Unique token is generated. URL can be shared with external stakeholder.

---

### 9.3 Client Portal - Approving Requirements

This simulates what external stakeholders see in the approval portal.

**UAT Checkpoint: EV-031 - Client Portal Approval**

1. Open a new browser window (or incognito mode)
2. Navigate to the client portal URL with token parameter
3. Observe:
   - Welcome message with stakeholder name
   - Requirements grouped by category
   - Approval status indicators
   - Progress bar showing overall approval %

4. For each requirement:
   - Click to expand details
   - Review title, description, priority
   - Click **Approve** or **Request Revision**
   - If requesting revision, enter note explaining what's needed

5. When all requirements reviewed, click **Submit Final Approval**
6. Optionally add signature/sign-off note

**Expected Result**: Client can review and approve requirements. Final approval is recorded. Team is notified.

---

### 9.4 Tracking Approval Progress

Monitor stakeholder approvals from the internal dashboard.

**UAT Checkpoint: EV-032 - Track Approvals**

1. View the **Client Approval Widget** on the dashboard
2. See progress ring showing overall approval %
3. View breakdown by stakeholder area
4. Click to expand and see:
   - Which stakeholders have approved
   - Which stakeholders have pending approvals
   - Any revision requests

5. Navigate to **Settings** → **Approval Status** for detailed view

**Expected Result**: Approval progress is visible. Can identify which stakeholders need follow-up.

---

### 9.5 Phase Gate Sign-off

When thresholds are met, phase gates can be formally closed.

**UAT Checkpoint: EV-033 - Phase Gate Approval**

1. Navigate to **Settings** → **Phase Gates**
2. View the phase gate status:
   - **Requirements Approved**: Shows % of stakeholder areas approved
   - When threshold met, **Complete Phase Gate** button appears

3. Click **Complete Phase Gate**
4. Add sign-off notes if required
5. Confirm completion

**Expected Result**: Phase gate is marked complete. Project progresses to next phase. Activity is logged.

---

## 10. Phase 8: Post-Selection Workflow

### 10.1 Understanding Procurement Workflow

After vendor selection, the procurement workflow tracks progress to contract award.

**Workflow Stages:**
1. **Evaluation Complete** - Vendor selected
2. **Contract Negotiation** - Commercial terms, security addendum, SLA
3. **Reference Checks** - Customer references, financial stability
4. **Legal Review** - Contract review, regulatory approval
5. **Contract Signed** - Final execution
6. **Onboarding Kickoff** - Implementation planning begins

---

### 10.2 Creating a Procurement Workflow

**UAT Checkpoint: EV-034 - Create Workflow**

1. Navigate to **Workflow** (from Dashboard or after vendor selection)
2. Click **Create Workflow**
3. Select options:

| Field | Value |
|-------|-------|
| Vendor | Vistra Technology |
| Template | Standard Software Procurement |
| Start Date | [Today] |

4. Click **Create**
5. Review the generated stages and milestones

**Expected Result**: Workflow is created from template. All stages and milestones are populated.

---

### 10.3 Managing Workflow Stages

Progress through workflow stages as procurement advances.

**UAT Checkpoint: EV-035 - Manage Workflow**

1. View the workflow timeline
2. For the first stage (Contract Negotiation):
   - Click **Start Stage**
   - Assign owner
   - Review milestones

3. Complete milestones as they're achieved:
   - Click milestone checkbox
   - Add completion notes if needed

4. When all milestones complete:
   - Click **Complete Stage**
   - Stage moves to "Completed" status
   - Next stage becomes available

5. If blocked:
   - Click **Block Stage**
   - Enter blocking reason
   - Stage shows as "Blocked" until resolved

**Expected Result**: Stages progress through workflow. Milestones track completion. Activity is logged.

---

### 10.4 Workflow Activity Log

All workflow changes are logged for audit purposes.

**UAT Checkpoint: EV-036 - View Activity Log**

1. In the workflow view, click **Activity Log** tab
2. Review logged activities:
   - Stage started/completed
   - Milestones completed
   - Blocks and resolutions
   - Owner changes
   - Notes added

**Expected Result**: Complete audit trail of workflow changes is visible.

---

## 11. UAT Test Scenarios

### 11.1 Complete End-to-End Scenario

This scenario walks through a complete procurement cycle.

**Scenario: CSP Entity Management System Procurement**

| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1 | Create evaluation project "CSP Entity Management" | Project created, dashboard loads | |
| 2 | Configure 6 evaluation categories (total 100%) | Categories saved, validation passes | |
| 3 | Configure 4 stakeholder areas | Areas created with weights and thresholds | |
| 4 | Create 5 requirements (REQ-001 to REQ-005) | Requirements appear with Draft status | |
| 5 | Run AI Gap Analysis | AI suggests additional requirements | |
| 6 | Submit requirements for review | Status changes to Under Review | |
| 7 | Add 3 vendors (Vistra, CSC, Diligent) | Vendors appear with Lead status | |
| 8 | Move vendors to "In Pipeline" | Status updates in pipeline view | |
| 9 | Create 5 RFP questions linked to requirements | Questions created with mappings | |
| 10 | Generate vendor portal access | Access codes created for each vendor | |
| 11 | Submit vendor responses (via portal) | Responses recorded, status is Submitted | |
| 12 | Score vendor responses (3 vendors × 5 questions) | Scores saved, averages calculate | |
| 13 | Use AI score suggestions | AI provides analysis and suggestions | |
| 14 | Add evidence for key scores | Evidence linked to vendor/criterion | |
| 15 | Review AI gap detection | Gaps identified with severity levels | |
| 16 | Review anomaly detection | Outliers flagged if present | |
| 17 | View traceability matrix | Matrix displays with filters working | |
| 18 | Create procurement risk | Risk appears on risk matrix | |
| 19 | Enter TCO data for vendors | TCO calculates and ranks vendors | |
| 20 | Generate client portal token | Token created with expiry | |
| 21 | Approve requirements (via client portal) | Approvals recorded, progress updates | |
| 22 | Complete phase gate (Requirements Approved) | Phase gate marked complete | |
| 23 | Move top vendor to "Selected" | Vendor status updates | |
| 24 | Create procurement workflow | Workflow stages populated | |
| 25 | Progress through workflow stages | Stages complete with milestones | |
| 26 | Generate executive summary report | Report generates with recommendations | |

---

### 11.2 Role-Based Test Scenarios

**Scenario A: Procurement Lead**
- Create and configure evaluation project
- Manage vendors and RFP
- Oversee evaluation progress
- Generate reports

**Scenario B: Technical Evaluator**
- Score vendor responses
- Add technical evidence
- Participate in score reconciliation
- Review security assessments

**Scenario C: External Stakeholder (Client Portal)**
- Access portal via token
- Review requirements
- Approve or request revisions
- Submit final sign-off

**Scenario D: Vendor (Vendor Portal)**
- Access portal via code
- View RFP questions
- Submit responses
- Participate in Q&A

---

### 11.3 Error Handling Scenarios

| Scenario | Action | Expected Behavior |
|----------|--------|-------------------|
| Invalid category weights | Save categories totaling 95% | Error: "Weights must total 100%" |
| Duplicate requirement code | Create requirement with existing code | Error: "Reference code already exists" |
| Expired portal token | Access client portal with expired token | Error: "Token has expired" |
| Missing required fields | Save vendor without name | Error: "Name is required" |
| Delete vendor with responses | Attempt to delete vendor with submissions | Warning: "Vendor has responses. Confirm delete?" |

---

### 11.4 Performance Test Scenarios

| Scenario | Test | Acceptable Threshold |
|----------|------|---------------------|
| Load 100 requirements | Time to display list | < 2 seconds |
| Load traceability matrix (50 req × 5 vendors) | Time to render | < 3 seconds |
| Generate AI analysis | Response time | < 10 seconds |
| Export large report | Generation time | < 30 seconds |

---

## 12. Appendix: Quick Reference

### 12.1 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save current form |
| `Escape` | Close modal/dialog |
| `Enter` | Confirm action in dialogs |

### 12.2 Status Definitions

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
| Lead | Initial contact, not yet engaged |
| In Pipeline | Actively being considered |
| Shortlist | Selected for detailed evaluation |
| Under Evaluation | Currently being scored |
| Selected | Chosen vendor |
| Rejected | Not proceeding |

**Workflow Stage Status:**
| Status | Description |
|--------|-------------|
| Pending | Not yet started |
| In Progress | Currently active |
| Blocked | Waiting on issue resolution |
| Completed | Successfully finished |
| Skipped | Bypassed (not required) |

### 12.3 Score Definitions

| Score | Label | Description |
|-------|-------|-------------|
| 0 | Not Addressed | No response provided |
| 1 | Does Not Meet | Fails to meet requirement |
| 2 | Partially Meets | Addresses some aspects |
| 3 | Meets | Fully addresses requirement |
| 4 | Exceeds | Goes beyond requirement |
| 5 | Significantly Exceeds | Exceptional response |

### 12.4 MoSCoW Priority Definitions

| Priority | Description |
|----------|-------------|
| Must Have | Essential requirement, non-negotiable |
| Should Have | Important but not critical |
| Could Have | Desirable if time/budget allows |
| Won't Have | Out of scope for this evaluation |

### 12.5 Gap Severity Definitions

| Severity | Description | Action |
|----------|-------------|--------|
| Low | Minor omission | Document and monitor |
| Medium | Notable gap | Request clarification |
| High | Significant issue | Must be addressed |
| Critical | Deal-breaker | Cannot proceed without resolution |

### 12.6 Common Workflows

**Creating a New Evaluation:**
```
Settings → Create Project → Configure Categories →
Configure Stakeholder Areas → Add Requirements →
Add Vendors → Create RFP Questions → Distribute RFP
```

**Scoring a Vendor:**
```
Evaluation Hub → Select Vendor → Review Response →
View AI Analysis → Enter Score → Add Rationale →
Add Evidence → Save
```

**Client Approval:**
```
Generate Token → Send to Client → Client Accesses Portal →
Reviews Requirements → Approves/Requests Revision →
Submits Final Approval → Phase Gate Closes
```

**Vendor Selection:**
```
Complete Scoring → Review Traceability Matrix →
Review Risks → Review TCO → Generate Report →
Present to Steering Committee → Get Approvals →
Select Vendor → Create Workflow
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 09 Jan 2026 | System | Initial creation |

---

*For technical support or feature requests, contact the system administrator.*
