# Evaluator Module - Gap Analysis & Customer Readiness Assessment

**Document Version:** 1.0
**Date:** January 9, 2026
**Purpose:** Plain English description, user journeys, and gap analysis for strategic IT procurement

---

## 1. Plain English Description

### What is the Evaluator?

The Evaluator is a **software procurement platform** that helps organisations run formal IT vendor selection exercises from start to finish. Think of it as a digital command center for running an RFP (Request for Proposal) or tender process.

**In simple terms:** When a company needs to buy new software (like a CRM, HR system, or ERP), they need to:
1. Figure out what they actually need (requirements)
2. Find vendors who might provide it
3. Send those vendors questions about their product
4. Score and compare the vendor responses
5. Make a defensible recommendation

The Evaluator manages this entire process, keeping everything organized, traceable, and audit-ready.

### Who Uses It?

| User Type | What They Do |
|-----------|--------------|
| **Procurement Consultant** | Runs the evaluation, facilitates workshops, manages vendors, coordinates scoring |
| **Evaluators** (SMEs) | Subject matter experts who score vendor responses against requirements |
| **Client Stakeholders** | Business users who provide requirements and approve the final list |
| **Vendors** | Companies being evaluated - they answer RFP questions via a portal |

### What Makes It Different?

1. **AI-Powered** - Uses Claude to parse documents, analyze vendor responses, and identify gaps
2. **Full Traceability** - Every requirement links back to who raised it, which vendor addresses it, and how it was scored
3. **Vendor Portal** - Vendors self-serve their RFP responses, reducing admin overhead
4. **Client Portal** - Stakeholders can approve requirements and track progress without needing full system access
5. **Evidence-Based** - Every score must be justified with evidence (demos, references, documents)

---

## 2. The Strategic Procurement Journey

### End-to-End Process Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STRATEGIC PROCUREMENT LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: DISCOVERY        PHASE 2: REQUIREMENTS     PHASE 3: RFP           │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐   │
│  │ • Stakeholder    │      │ • Capture needs  │      │ • Build vendor   │   │
│  │   identification │ ───► │ • Categorize     │ ───► │   longlist       │   │
│  │ • Workshop setup │      │ • Client approve │      │ • Draft questions│   │
│  │ • Document review│      │ • Weight criteria│      │ • Issue RFP      │   │
│  └──────────────────┘      └──────────────────┘      └──────────────────┘   │
│           │                         │                         │              │
│           ▼                         ▼                         ▼              │
│  PHASE 6: DECISION         PHASE 5: EVALUATION       PHASE 4: RESPONSES     │
│  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐   │
│  │ • Final scoring  │      │ • Score responses│      │ • Vendor portal  │   │
│  │ • Recommendation │ ◄─── │ • Capture evidence│ ◄─── │ • Q&A management │   │
│  │ • Client present │      │ • Reconcile scores│      │ • Response tracking│ │
│  │ • Contract award │      │ • Generate reports│      │ • Document uploads│  │
│  └──────────────────┘      └──────────────────┘      └──────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. User Journeys (Detailed)

### Journey 1: Procurement Consultant Sets Up Evaluation

**Goal:** Create a new evaluation project and configure it for a CRM procurement

**Steps:**
1. Log in → Navigate to Evaluator Dashboard
2. Click "Create Evaluation Project"
3. Enter details:
   - Name: "CRM Platform Selection 2026"
   - Client: "Acme Corporation"
   - Target decision date: March 31, 2026
4. Configure evaluation categories:
   - Functional Fit (30%)
   - Technical Architecture (25%)
   - Vendor Viability (20%)
   - Implementation & Support (15%)
   - Commercial (10%)
5. Define criteria within each category:
   - Functional Fit: Contact Management, Sales Pipeline, Reporting, Integration
   - (etc.)
6. Create stakeholder areas:
   - Sales Team, Marketing, Customer Service, IT, Finance
7. Invite team members:
   - Jane (Evaluator - Sales SME)
   - Bob (Evaluator - IT SME)
   - Sarah (Client Stakeholder - Sales Director)
8. Project is ready for requirement gathering

**Current State:** ✅ Fully supported
**Gaps:**
- No templates for common evaluation types (CRM, ERP, HRIS)
- Cannot clone from previous evaluations
- Manual weight entry (no AI suggestions)

---

### Journey 2: Gathering Requirements via Workshop

**Goal:** Run a discovery workshop with Sales stakeholders to capture CRM requirements

**Steps:**
1. Create workshop:
   - Name: "Sales Team CRM Discovery"
   - Date: January 15, 2026
   - Location: "Conference Room A"
   - Stakeholder Area: Sales Team
2. Add attendees (from contacts or manual entry)
3. Send calendar invites (email integration)
4. **During workshop:**
   - Facilitator captures requirements in real-time
   - Each requirement tagged with:
     - Priority (Must Have / Should Have / Nice to Have)
     - Category (Functional Fit)
     - Source (Workshop - Sales Discovery)
5. **After workshop:**
   - Send follow-up survey to attendees
   - Review and refine captured requirements
   - Submit for client approval
6. Workshop marked complete with attendance recorded

**Current State:** ⚠️ Partially supported
**Gaps:**
- No real-time collaborative capture (requirements entered one at a time)
- Calendar integration is manual (no Google/Outlook sync)
- No workshop agenda templates
- Cannot capture voting/prioritization during workshop

---

### Journey 3: AI-Assisted Document Parsing

**Goal:** Extract requirements from a 50-page RFP specification document

**Steps:**
1. Navigate to Documents Hub
2. Upload "CRM-Specification-v2.pdf"
3. Click "Parse with AI"
4. AI processes document and extracts:
   - 47 potential requirements
   - Suggested categories for each
   - Confidence scores
5. Review AI suggestions:
   - Accept 38 as-is
   - Edit 6 for clarity
   - Reject 3 duplicates
6. Create requirement records from accepted items
7. All requirements linked to source document

**Current State:** ✅ Fully supported
**Gaps:**
- Cannot parse Excel/structured RFP templates
- No bulk edit of parsed requirements
- Cannot re-parse same document with different settings

---

### Journey 4: Client Stakeholder Approves Requirements

**Goal:** Sales Director reviews and approves captured requirements

**Steps:**
1. Sarah receives email: "15 requirements ready for approval"
2. Clicks link → Client Portal login
3. Views requirements list filtered to "Pending Approval"
4. For each requirement:
   - Review title and description
   - See who raised it (workshop/survey/document)
   - Approve, Reject, or Request Changes
   - Add comments if needed
5. Requirements move to "Approved" status
6. Consultant notified of approvals

**Current State:** ✅ Fully supported
**Gaps:**
- No bulk approve/reject
- Cannot delegate approval to another stakeholder
- No approval deadline reminders
- Cannot see other stakeholders' comments during approval

---

### Journey 5: Building the Vendor Longlist

**Goal:** Identify potential CRM vendors for evaluation

**Steps:**
1. Navigate to Vendors Hub
2. Add vendors manually:
   - Salesforce, HubSpot, Microsoft Dynamics, Zoho, Pipedrive
3. **OR** use AI Market Research:
   - Click "Research Vendors"
   - AI searches for CRM vendors matching criteria
   - Returns company profiles with:
     - Size, funding, market position
     - Customer reviews summary
     - Recent news
4. Move vendors through pipeline:
   - Identified → Long List (initial consideration)
   - Long List → Short List (passed initial screening)
   - Short List → RFP Issued (invited to respond)
5. Rejected vendors archived with reason

**Current State:** ✅ Fully supported
**Gaps:**
- No vendor scoring at longlist stage (pre-RFP)
- Cannot import vendor list from Excel
- No automatic vendor deduplication
- Limited vendor intelligence (no Gartner/G2 integration)

---

### Journey 6: Creating and Issuing the RFP

**Goal:** Build RFP questions and send to shortlisted vendors

**Steps:**
1. Navigate to Questions Hub
2. Create question sections:
   - Company Overview
   - Functional Capabilities
   - Technical Architecture
   - Implementation Approach
   - Commercial Terms
3. Add questions to each section:
   - "Describe your contact management capabilities"
   - "How does your system handle duplicate records?"
   - (etc.)
4. Link questions to evaluation criteria:
   - "Contact management" question → "Contact Management" criterion
5. Review question set
6. For each shortlisted vendor:
   - Enable Portal Access
   - Set response deadline
   - Send invitation email with access code
7. Track response status on dashboard

**Current State:** ✅ Fully supported
**Gaps:**
- No question templates by industry/solution type
- Cannot import questions from previous RFPs
- No conditional questions (show Q5 only if Q4 = Yes)
- Cannot set per-section deadlines
- No vendor Q&A management (clarification questions)

---

### Journey 7: Vendor Completes RFP via Portal

**Goal:** Vendor sales rep completes RFP response

**Steps:**
1. Vendor receives email with portal link and access code
2. Logs into Vendor Portal
3. Views:
   - Evaluation overview and timeline
   - List of requirements (read-only)
   - Questions organized by section
4. For each question:
   - Enter response text
   - Upload supporting documents
   - Save progress (auto-save)
5. Mark section as complete
6. Review all responses
7. Submit final response
8. Status changes to "Response Received"
9. Consultant notified

**Current State:** ✅ Fully supported
**Gaps:**
- No response validation (required fields, word limits)
- Cannot request deadline extension via portal
- No progress indicator for vendor
- Cannot save response drafts with notes
- No collaborative vendor response (multiple vendor users)

---

### Journey 8: Evaluator Scores Vendor Responses

**Goal:** Sales SME scores Salesforce against functional requirements

**Steps:**
1. Navigate to Evaluation Hub
2. Select Vendor: Salesforce
3. Select Category: Functional Fit
4. For each criterion (e.g., "Contact Management"):
   - View vendor's response to linked questions
   - View any uploaded documents
   - **Click "AI Analyze"** to get:
     - Response summary
     - Compliance assessment
     - Identified gaps
     - Suggested score with confidence
   - Enter score (1-5):
     - 5 = Fully meets, exceeds expectations
     - 4 = Meets requirements
     - 3 = Partially meets
     - 2 = Significant gaps
     - 1 = Does not meet
   - Add evidence:
     - Type: Vendor Response
     - Text: "Response clearly addresses all contact management needs"
     - Sentiment: Positive
   - Save score
5. Complete all criteria in category
6. View summary and variance indicators

**Current State:** ✅ Fully supported (AI analysis added in v1.1)
**Gaps:**
- No guided scoring workflow (step-by-step wizard)
- Cannot score multiple vendors side-by-side
- No auto-populate from demo observations
- Cannot attach screenshots/recordings as evidence
- No scoring lock (prevent changes after deadline)

---

### Journey 9: Score Reconciliation

**Goal:** Resolve scoring differences between evaluators

**Steps:**
1. Navigate to Evaluation Hub → Reconciliation View
2. View variance indicators:
   - Red: >2 point difference between evaluators
   - Amber: 1-2 point difference
   - Green: Aligned scores
3. Click on high-variance item:
   - See each evaluator's score and rationale
   - View their evidence
4. Discuss in reconciliation meeting
5. Enter consensus score with notes
6. Mark as reconciled
7. Consensus score used in final calculation

**Current State:** ✅ Fully supported
**Gaps:**
- No in-app discussion thread (must use external meeting)
- Cannot schedule reconciliation meeting from app
- No voting mechanism for consensus
- No blind scoring mode (hide other evaluators' scores initially)

---

### Journey 10: Generate Evaluation Report

**Goal:** Create final recommendation report for client

**Steps:**
1. Navigate to Reports Hub
2. Select report type: "Vendor Evaluation Summary"
3. Configure sections:
   - Executive Summary
   - Vendor Comparison Matrix
   - Detailed Scoring by Category
   - Risk Analysis
   - Recommendation
4. Preview report
5. Export as PDF
6. Share via Client Portal

**Current State:** ✅ Fully supported
**Gaps:**
- Limited customization of report templates
- No PowerPoint export
- Cannot include custom branding/logos
- No executive dashboard (1-page summary)
- Cannot generate draft recommendation text with AI

---

## 4. Gap Analysis Summary

### Critical Gaps (Must Fix for Customer Readiness)

| # | Gap | Impact | Effort | Priority |
|---|-----|--------|--------|----------|
| 1 | **No evaluation criteria tweaking controls** | Users cannot easily adjust weights or add criteria mid-evaluation | Medium | P1 - Critical |
| 2 | **No vendor Q&A management** | Cannot handle clarification questions during RFP period | High | P1 - Critical |
| 3 | **No response validation** | Vendors can submit incomplete responses | Medium | P1 - Critical |
| 4 | **No deadline reminders** | Manual follow-up required for late vendors/approvals | High | P1 - Critical |
| 5 | **No scoring lock mechanism** | Scores can be changed after evaluation closes | Medium | P1 - Critical |
| 6 | **No blind scoring option** | Evaluators can see each other's scores, creating bias | High | P1 - Critical |

### Important Gaps (Should Fix)

| # | Gap | Impact | Effort | Priority |
|---|-----|--------|--------|----------|
| 7 | **No question templates** | Manual creation of questions for each evaluation | Medium | P2 - High |
| 8 | **No evaluation templates** | Cannot reuse configurations across evaluations | Medium | P2 - High |
| 9 | **No real-time workshop capture** | Single-user entry during workshops | High | P2 - High |
| 10 | **No bulk operations** | Cannot bulk approve requirements or import vendors | Low | P2 - High |
| 11 | **No calendar integration** | Manual workshop scheduling | Medium | P2 - High |
| 12 | **No progress tracking for vendors** | Vendors cannot see completion percentage | Low | P2 - High |
| 13 | **Limited evidence types** | Cannot attach screenshots/recordings | Medium | P2 - High |
| 14 | **No side-by-side scoring** | Must switch between vendors to compare | Medium | P2 - High |

### Nice to Have Gaps (Future Enhancement)

| # | Gap | Impact | Effort | Priority |
|---|-----|--------|--------|----------|
| 15 | Clone evaluation from previous | Medium | Medium | P3 - Medium |
| 16 | AI-generated recommendation text | Medium | Medium | P3 - Medium |
| 17 | PowerPoint export | Low | Medium | P3 - Medium |
| 18 | Gartner/G2 vendor intelligence | Medium | High | P3 - Medium |
| 19 | Mobile scoring app | Low | High | P4 - Low |
| 20 | Conditional RFP questions | Low | Medium | P4 - Low |

---

## 5. Requirements Capture Analysis

### Current Requirement Sources

| Source | Status | Gaps |
|--------|--------|------|
| Manual Entry | ✅ Complete | None |
| Workshop Capture | ✅ Complete | No real-time collaboration |
| Survey Responses | ✅ Complete | Limited question types |
| Document Parsing (AI) | ✅ Complete | No Excel parsing |
| AI Suggestions | ✅ Complete | Limited training data |

### Missing Requirement Capture Features

1. **Requirement Import from Excel**
   - Many clients have existing requirements in spreadsheets
   - Need column mapping wizard
   - Need duplicate detection

2. **Requirement Consolidation (AI)**
   - Duplicate detection across sources
   - Similar requirement merging suggestions
   - Conflict identification

3. **Requirement Versioning**
   - Track changes over time
   - See who changed what and when
   - Rollback capability

4. **Requirement Dependencies**
   - Link related requirements
   - Parent/child hierarchies
   - Impact analysis when changing requirements

5. **MoSCoW Prioritization Workflow**
   - Structured prioritization sessions
   - Stakeholder voting
   - Automatic Must/Should/Could/Won't sorting

---

## 6. Vendor Response Analysis Assessment

### Current AI Capabilities

| Feature | Status | Quality |
|---------|--------|---------|
| Response Summary | ✅ Implemented | Good |
| Gap Identification | ✅ Implemented | Good |
| Strength Highlighting | ✅ Implemented | Good |
| Score Suggestion | ✅ Implemented | Fair (needs calibration) |
| Follow-up Questions | ✅ Implemented | Good |

### Missing AI Analysis Features

1. **Cross-Vendor Comparison**
   - "How does Vendor A's response compare to Vendor B's?"
   - Automatic comparison matrix generation
   - Relative strength/weakness analysis

2. **Compliance Checking**
   - Check response against specific requirements
   - Flag non-compliant or partial responses
   - Generate compliance matrix

3. **Red Flag Detection**
   - Identify concerning statements
   - Spot unrealistic claims
   - Flag missing information

4. **Reference Analysis**
   - Parse reference check notes
   - Summarize reference feedback
   - Identify patterns across references

5. **Pricing Analysis**
   - Parse pricing documents
   - Normalize different pricing models
   - TCO comparison

---

## 7. Evaluation Controls Assessment

### Current Criteria Management

| Feature | Status | Gaps |
|---------|--------|------|
| Create Categories | ✅ Complete | None |
| Add Criteria | ✅ Complete | Cannot add mid-evaluation |
| Set Weights | ✅ Complete | No AI suggestions |
| Weight Validation | ✅ Complete | None |
| Scoring Scales | ✅ Complete | Cannot customize per-criterion |

### Missing Criteria Controls

1. **In-Flight Adjustments**
   - Add/remove criteria after scoring starts
   - Adjust weights with recalculation
   - Audit trail for changes

2. **Criteria Templates**
   - Pre-built criteria sets by solution type
   - Industry-standard frameworks (CMMI, ISO)
   - Import from previous evaluations

3. **Scoring Scale Customization**
   - Different scales for different criteria
   - Yes/No criteria
   - Numeric ranges (price-based)

4. **Weighted Sub-Criteria**
   - Nested criteria with weights
   - Roll-up calculations
   - Drill-down reporting

5. **Knockout Criteria**
   - Mandatory pass/fail requirements
   - Auto-disqualify vendors who fail
   - Clear visual indicators

---

## 8. Automation vs Manual Evaluation

### Current Automation

| Process | Automation Level | Manual Steps |
|---------|------------------|--------------|
| Document Parsing | 80% Auto | Review/approve |
| Gap Analysis | 90% Auto | Review suggestions |
| Vendor Research | 70% Auto | Verify/edit |
| Response Analysis | 60% Auto | Review, adjust score |
| Score Calculation | 100% Auto | None |
| Report Generation | 90% Auto | Select options |

### Automation Opportunities

1. **Auto-Score Suggestions**
   - AI suggests initial scores based on response analysis
   - Evaluator reviews and adjusts
   - Track AI vs human score correlation

2. **Auto-Deadline Reminders**
   - Configurable reminder schedules
   - Escalation paths
   - Vendor and internal reminders

3. **Auto-Reconciliation Triggers**
   - Detect high variance automatically
   - Schedule reconciliation meetings
   - Notify relevant evaluators

4. **Auto-Report Updates**
   - Live-updating dashboards
   - Auto-refresh on score changes
   - Scheduled report distribution

5. **Auto-Vendor Qualification**
   - Pre-qualification questionnaire
   - Auto-score basic criteria
   - Auto-shortlist based on thresholds

---

## 9. Recommended Prioritized Roadmap

### Phase 1: Customer-Ready MVP (4-6 weeks)

**Goal:** Address critical gaps to support a real procurement exercise

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Deadline reminders & notifications | 2 weeks | Email service |
| Scoring lock mechanism | 3 days | None |
| Blind scoring mode | 1 week | Permissions |
| Vendor Q&A management | 1.5 weeks | Vendor portal |
| Response validation rules | 1 week | Vendor portal |
| Criteria adjustment controls | 1 week | None |

### Phase 2: Efficiency & Templates (4-6 weeks)

**Goal:** Reduce setup time and improve usability

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Evaluation templates | 2 weeks | None |
| Question templates | 1 week | None |
| Requirements Excel import | 1 week | None |
| Bulk operations | 1 week | None |
| Side-by-side scoring view | 1.5 weeks | None |
| Calendar integration | 1 week | OAuth |

### Phase 3: Advanced AI & Collaboration (6-8 weeks)

**Goal:** Differentiate with AI and real-time features

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Real-time workshop capture | 3 weeks | WebSockets |
| AI requirement consolidation | 2 weeks | AI service |
| Cross-vendor comparison AI | 2 weeks | AI service |
| AI recommendation draft | 1 week | AI service |
| Compliance checking | 1.5 weeks | AI service |

### Phase 4: Enterprise Features (8-10 weeks)

**Goal:** Support large, complex procurements

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| Procurement workflow stages | 3 weeks | None |
| Multi-evaluation benchmarking | 2 weeks | Analytics |
| Vendor intelligence integration | 2 weeks | External APIs |
| Advanced access control | 2 weeks | Permissions |
| Mobile scoring app | 3 weeks | React Native |

---

## 10. Customer Readiness Checklist

### Before First Customer Deployment

- [ ] **Critical Gaps Addressed**
  - [ ] Deadline reminders working
  - [ ] Scoring lock implemented
  - [ ] Blind scoring available
  - [ ] Vendor Q&A functional
  - [ ] Response validation active

- [ ] **Documentation Complete**
  - [ ] User guide for consultants
  - [ ] User guide for evaluators
  - [ ] User guide for vendors (portal)
  - [ ] User guide for clients (portal)
  - [ ] Admin configuration guide

- [ ] **Testing Complete**
  - [ ] End-to-end workflow tested
  - [ ] All user roles tested
  - [ ] Email notifications tested
  - [ ] Report generation tested
  - [ ] AI features tested

- [ ] **Support Ready**
  - [ ] FAQ prepared
  - [ ] Known issues documented
  - [ ] Support escalation path defined
  - [ ] Feedback mechanism in place

- [ ] **Security & Compliance**
  - [ ] Data isolation verified
  - [ ] Access controls audited
  - [ ] Audit logging confirmed
  - [ ] Backup procedures tested

---

## 11. Conclusion

The Evaluator module has a **solid foundation** covering the core procurement workflow from requirements through scoring and reporting. The AI capabilities for document parsing and response analysis are differentiating features.

**To be customer-ready for a strategic procurement exercise, the priority actions are:**

1. **Notifications & Deadlines** - Automated reminders are essential for managing vendor and evaluator timelines
2. **Scoring Controls** - Lock mechanism and blind scoring protect evaluation integrity
3. **Vendor Q&A** - Critical for handling clarification questions during RFP period
4. **Response Validation** - Ensures vendors submit complete, usable responses
5. **Criteria Flexibility** - Allow adjustments to weights and criteria during evaluation

With these addressed (estimated 4-6 weeks), the platform can support a full strategic procurement exercise. The subsequent phases add efficiency (templates, bulk ops) and differentiation (advanced AI, real-time collaboration).

---

*Document prepared for internal planning. Review and prioritize based on customer requirements.*
