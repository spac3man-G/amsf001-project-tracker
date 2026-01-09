# GAP ANALYSIS & IMPLEMENTATION ROADMAP
## "The Evaluator" Module Enhancement Plan for CSP Procurement Project

**Document:** Evaluator-Gap-Analysis-Implementation.md  
**Version:** 1.0  
**Created:** 9 January 2026  
**Status:** Technical Assessment Ready

---

## EXECUTIVE SUMMARY

This document provides a detailed technical gap analysis comparing your existing "Evaluator" module to CSP procurement requirements, with specific implementation recommendations and effort estimates.

### Key Findings

| Category | Readiness | Gap Severity | Build Effort |
|---|---|---|---|
| **Core Evaluation Framework** | 85% Ready | Minimal | 8h |
| **Requirements Management** | 80% Ready | Minor | 24h |
| **Workshop & Collaboration** | 50% Ready | Major | 68h |
| **RFP & Vendor Management** | 75% Ready | Medium | 32h |
| **AI Integration** | 65% Ready | Medium | 44h |
| **Reporting & Analytics** | 70% Ready | Minor | 20h |
| **Stakeholder Portals** | 60% Ready | Major | 40h |
| **Project Management** | 40% Ready | Major | 36h |
| **TOTAL** | **68% Ready** | **MEDIUM-HIGH** | **272h** |

**Realistic Timeline:** 7-8 weeks (1 developer full-time, or 2 developers half-time)

---

## DETAILED GAP ANALYSIS BY CATEGORY

### 1. CORE EVALUATION FRAMEWORK (85% Ready)

#### Current State
✅ 29-table database schema with all entity types  
✅ 8 scoring models (individual, consensus, confidence)  
✅ Role-based access control (5 roles defined)  
✅ Multi-tenancy support  
✅ Audit logging on all changes  

#### CSP Requirements
- Individual vendor scoring (0-5 scale)
- Consensus scoring with rationale capture
- Score variance detection and alerts
- Evidence linking to scores
- Complete audit trail

#### Gap Assessment: MINIMAL ❌

**Issues Identified:**
1. **Score Threshold Configuration** - Doesn't specify variance threshold for alerts
   - Need to make consensus alert threshold configurable per project
   - Impact: Medium
   - Effort: 2h

2. **Evidence Linking** - Evidence table exists but linking could be clearer
   - Current: evidence_links is generic (requirement OR criterion)
   - Needed: Also link evidence directly to scores for clearer audit trail
   - Impact: Low
   - Effort: 1h (add score_evidence_links table)

3. **Consensus Decision Capture** - Consensus rationale field exists
   - Current: rationale field is just text
   - Enhancement: Could be structured with "decision type" (unanimous, majority vote, tiebreaker)
   - Impact: Low
   - Effort: 3h

4. **Blinded Scoring Option** - Not currently available
   - Requirement: Optional feature to hide other evaluators' scores during individual scoring phase
   - Impact: Low (nice-to-have)
   - Effort: 2h (add RLS policy)

**Recommendation:** Add 2-3 enhancements for full alignment
**Build Effort:** 8h

---

### 2. REQUIREMENTS MANAGEMENT (80% Ready)

#### Current State
✅ requirements table with full fields (title, description, priority, type, acceptance criteria)  
✅ requirement_approvals for approval workflow  
✅ requirement_comments for discussions  
✅ Categorization support via evaluation_categories  
✅ Requirements consolidation planned (v1.3 roadmap)  

#### CSP Requirements
- Capture requirements from multiple sources (workshops, e-forms, stakeholders)
- Consolidate duplicates and conflicts
- Track stakeholder contributions
- Manage approval workflow
- Link requirements to RFP questions and evaluation criteria

#### Gap Assessment: MINOR

**Gaps Identified:**

1. **Requirement Source Tracking** - Which stakeholder/workshop contributed each requirement?
   - Current: created_by field only shows who last edited
   - Needed: Track original source (workshop #1, e-form submission, etc.)
   - Solution: Add source_type and source_id to requirements table
   - Impact: Medium (needed for traceability)
   - Effort: 3h (schema + service methods)

2. **Requirement Consolidation Audit Trail** - Current plan uses shadow tables
   - Current: v1.3 roadmap mentions ConsolidationWizard but no schema designed
   - Needed: requirement_consolidation_groups and requirement_consolidation_members tables
   - Solution: Add tables and consolidation service
   - Impact: Medium (critical for audit)
   - Effort: 6h (schema + service + UI logic)

3. **MoSCoW Priority Tracking** - Partially supported
   - Current: priority field has 4 values (must_have, should_have, could_have, wont_have) ✓
   - Needed: Voting mechanism to determine priority during consolidation
   - Solution: Add requirement_priority_votes table for consensus prioritization
   - Impact: Low
   - Effort: 4h

4. **Requirement Weighting** - Field exists but not fully utilized
   - Current: weighting DECIMAL(5,2) field exists
   - Needed: Auto-calculate weighting based on stakeholder voting
   - Impact: Low
   - Effort: 3h

5. **AI Categorization** - In roadmap but not detailed
   - Current: v1.1 mentions "requirement suggestions" but not live categorization during entry
   - Needed: Real-time category suggestion as user types
   - Solution: Call Claude API with partial requirement text
   - Impact: Medium (improves UX)
   - Effort: 4h (API endpoint + UI component)

**Recommendation:** Enhance consolidation tracking and add AI categorization
**Build Effort:** 24h

---

### 3. WORKSHOP & REAL-TIME COLLABORATION (50% Ready)

#### Current State
✅ workshops table (scheduling, facilitation, recording)  
✅ workshop_attendees table (RSVP tracking, attendance)  
✅ survey_responses for post-workshop questionnaires  
✅ RLS security for workshop access  
⚠️ Live collaboration planned (v1.3 roadmap) but not specified  

#### CSP Requirements
- **Live Workshop Mode:**
  - Real-time requirement entry during workshop
  - Live vote counts on requirements
  - Real-time duplicate detection
  - Live voting (priority dots, thumbs up/down)
  - Facilitator controls (pause, lock for voting)
- **Post-Workshop:**
  - Pre/post workshop questionnaires
  - AI-powered consolidation suggestions based on workshop capture

#### Gap Assessment: MAJOR

**Gaps Identified:**

1. **Real-Time Workshop Updates** - NOT BUILT
   - Current: No mechanism for live updates during workshop
   - Needed: Supabase Realtime subscription to broadcast requirement entries, votes
   - Solution: 
     - Add useLiveWorkshop hook
     - Add live requirement table (real-time inserts)
     - Add workshop_live_votes table for temporary voting
   - Impact: Critical
   - Effort: 40h
     - 8h: Database schema (live_requirements, live_votes tables)
     - 6h: useLiveWorkshop hook with Supabase Realtime
     - 8h: LiveWorkshopFacilitator component
     - 8h: LiveRequirementEntry component with validation
     - 6h: LiveVotingInterface component
     - 4h: Testing + error handling

2. **Facilitator Controls** - NOT BUILT
   - Current: No controls for workshop phases
   - Needed: Ability to pause for discussion, lock for voting, finalize votes
   - Solution: Add workshop_phase state (entry, voting, discussion, locked)
   - Impact: Medium (affects UX)
   - Effort: 6h

3. **Live Duplicate Detection** - NOT BUILT
   - Current: Consolidation is post-hoc in v1.3
   - Needed: Real-time alerts during workshop ("This is similar to requirement X")
   - Solution: Run lightweight semantic check on each new requirement entry
   - Impact: Medium
   - Effort: 8h (lightweight Claude call for each entry)

4. **Requirement Entry Validation** - NOT BUILT
   - Current: No validation on workshop entry
   - Needed: Require min 20 chars, offer category suggestion, mark priority
   - Impact: Medium
   - Effort: 4h

5. **Workshop Recording & Transcription** - MENTIONED BUT NOT IMPLEMENTED
   - Current: recording_url field in workshops table
   - Needed: Integration with Zoom/Teams for auto-recording
   - Optional: Auto-transcription and AI requirement extraction
   - Impact: Low (nice-to-have)
   - Effort: 12h (depends on 3rd-party API integration)

6. **Participant Engagement Tracking** - NOT BUILT
   - Current: attendees table only tracks RSVP and attendance
   - Needed: Who contributed how many requirements? Who voted?
   - Solution: Add requirement_author and vote_author tracking
   - Impact: Low (analytics only)
   - Effort: 3h

**Recommendation:** Build live collaboration as Priority 1 before CSP project
**Build Effort:** 68h (38h core + 30h optional enhancements)

---

### 4. RFP & VENDOR MANAGEMENT (75% Ready)

#### Current State
✅ vendor_questions table (RFP questions)  
✅ vendor_question_links (question-to-requirement mapping)  
✅ vendor_responses (vendor answers)  
✅ vendor_documents (uploaded docs)  
✅ vendors table (vendor company info)  
✅ RFP templates planned (v1.2 roadmap)  
⚠️ Q&A forum NOT planned  
⚠️ Response validation NOT specified  

#### CSP Requirements
- Create and customize RFP from templates
- Link RFP questions to requirements (traceability)
- Distribute RFP to vendors with portal access
- Track response status and deadlines
- Vendor Q&A forum (post-submission)
- Vendor can submit supplementary info
- Evaluator can request reference calls

#### Gap Assessment: MEDIUM

**Gaps Identified:**

1. **RFP Templates** - IN ROADMAP (v1.2, 43h planned)
   - Current: No templates exist
   - Needed: Pre-built template library (CSP Specialized, Integration-focused, Generic)
   - Status: DEFER to v1.2 but could accelerate for CSP project
   - Effort: 24h (templates only; service already planned)

2. **Question Importance Badges** - NOT BUILT
   - Current: vendor_questions has basic fields
   - Needed: Importance field (critical, high, medium, low) with visual badges
   - Impact: Medium (vendor experience improvement)
   - Effort: 2h (schema + UI)

3. **Vendor Q&A Forum** - NOT BUILT
   - Current: No Q&A mechanism
   - Needed: 
     - vendor_qa_threads table
     - vendor_qa_answers table
     - Q&A portal UI for vendors
     - Q&A dashboard for evaluators (with 48h response SLA)
   - Impact: Critical for vendor experience
   - Effort: 12h
     - 2h: Database schema
     - 3h: QA service
     - 4h: Vendor portal QA interface
     - 3h: Evaluator Q&A dashboard

4. **Supplementary Information** - NOT BUILT
   - Current: No post-submission updates
   - Needed: Vendors can submit additional docs/responses after deadline (within window)
   - Impact: Medium
   - Effort: 4h (add supplementary_submissions table)

5. **Reference Call Scheduling** - NOT BUILT
   - Current: No built-in scheduling
   - Needed: Evaluators request reference call; vendors see request; scheduling integration
   - Integration: Could use Calendly API or manual scheduling
   - Impact: Low (nice-to-have)
   - Effort: 8h (with Calendly integration) or 3h (manual)

6. **Response Deadline Management** - PARTIALLY BUILT
   - Current: response_deadline field exists on vendors table
   - Needed: Auto-calculate business days, send reminder emails, show countdown
   - Status: Need email notification service
   - Impact: Medium
   - Effort: 6h (notification service + scheduler job)

7. **Response Validation** - NOT BUILT
   - Current: No validation rules
   - Needed: Enforce required fields, min/max length, attachment requirements
   - Solution: Add validation_rules JSONB to vendor_questions
   - Impact: Medium
   - Effort: 4h

**Recommendation:** Build Q&A forum + supplementary info as Priority 2
**Build Effort:** 32h (core essentials; defer templates to v1.2)

---

### 5. AI INTEGRATION (65% Ready)

#### Current State
✅ 8 AI-powered endpoints in roadmap (v1.1-v2.0):
  - ai-document-parse (v1.1)
  - ai-gap-analysis (built)
  - ai-market-research (v2.0)
  - ai-requirement-suggest (v1.1)
  - ai-consolidate-requirements (v1.3)
  - ai-analyze-response (v1.1)
  - generate-report (v1.2)
  - ai-executive-summary (v1.2)

⚠️ **Most AI features are planned but not yet built**

#### CSP Requirements
- **Requirements Phase:**
  - Real-time category suggestion (as user types)
  - Consolidation wizard with AI clustering
  - Conflict detection between requirements
- **Vendor Response Phase:**
  - Summarize vendor response
  - Extract key points
  - Flag compliance gaps
  - Suggest score (0-5)
  - Compare to other vendors' responses
- **Decision Support Phase:**
  - Generate executive summary (1-page AI synthesis)
  - Recommend best vendor
  - Scenario analysis recommendations
  - Risk assessment synthesis

#### Gap Assessment: MEDIUM

**Gaps Identified:**

1. **Requirement Categorization** - PARTIALLY BUILT
   - Current: AI roadmap mentions this in v1.1 but no implementation detail
   - Needed: Real-time Claude API call with partial requirement text
   - Solution: Create ai-categorize-requirement endpoint
   - Impact: Medium (UX improvement)
   - Effort: 4h (API + UI)

2. **Response Analysis with Scoring** - IN ROADMAP (v1.1, 28h)
   - Current: ai-analyze-response planned but not including score suggestion
   - Needed: Extended analysis to include suggestedScore (0-5) with confidence
   - Impact: High
   - Effort: 8h additional (API extension + UI)

3. **Consolidation Algorithm** - IN ROADMAP (v1.3, 42h)
   - Current: Designed for v1.3 but CSP project needs it sooner
   - Can likely accelerate: Use simpler clustering + manual review
   - Impact: High
   - Effort: 20h (core clustering; defer advanced conflict detection)

4. **Executive Summary** - IN ROADMAP (v1.2, 48h for full reporting)
   - Current: Planned but complex implementation
   - Needed: AI-generated 1-page summary of vendor evaluation findings
   - Simplified approach: Focus on key findings + top vendor recommendation
   - Impact: Medium
   - Effort: 12h (focused implementation vs full reporting)

5. **Vendor Recommendation** - NOT EXPLICITLY PLANNED
   - Current: No AI recommendation endpoint
   - Needed: AI suggests "CSC Entity Management is best fit" with rationale
   - Impact: High
   - Effort: 8h

6. **Conflict Detection** - IN ROADMAP (v1.3)
   - Current: Planned but not detailed
   - Needed: AI identifies contradictions (e.g., "Finance wants real-time; IT wants daily")
   - Impact: Medium
   - Effort: 6h

7. **Evidence Summarization** - NOT PLANNED
   - Current: AI analyzes response text but not supporting documents
   - Needed: AI could summarize case studies, technical specs
   - Optional enhancement
   - Impact: Low
   - Effort: 6h (with file parsing)

**Recommendation:** Prioritize response analysis + scoring + recommendation
**Build Effort:** 44h (core AI features for CSP; defer advanced features)

---

### 6. REPORTING & ANALYTICS (70% Ready)

#### Current State
✅ Analytics service in roadmap (v1.1, 36h):
  - Score heatmap
  - Vendor comparison radar
  - Evaluation timeline
  - Risk indicators
  - Stakeholder participation

✅ Advanced reporting planned (v1.2, 48h):
  - Report builder (customizable sections)
  - PDF generation
  - Executive summary
  - Multiple export formats

#### CSP Requirements
- Traceability matrix (Requirements × Vendors × Scores)
- Vendor comparison (heatmap, radar, financial)
- Scenario analysis (what-if with different weightings)
- Gap analysis (which requirements have low scores)
- Risk dashboard (integration risks, vendor viability risks)
- Financial comparison (3-year TCO per vendor)

#### Gap Assessment: MINOR

**Gaps Identified:**

1. **Traceability Matrix** - PARTIALLY BUILT
   - Current: Planned in core Evaluator design but not detailed in roadmap
   - Needed: Interactive matrix (Requirements × Vendors) with drill-down
   - Impact: High
   - Effort: 8h
     - 2h: SQL query for matrix data
     - 3h: TraceabilityMatrix component
     - 3h: Drill-down detail view

2. **Financial Analysis** - NOT EXPLICITLY PLANNED
   - Current: No financial comparison features
   - Needed: 3-year TCO breakdown, cost sensitivity analysis
   - Note: Financial data enters via RFP responses (pricing section)
   - Impact: Medium
   - Effort: 6h
     - 2h: TCO calculation logic
     - 4h: FinancialComparison component + charts

3. **Risk Dashboard** - MENTIONED IN ROADMAP (v1.1)
   - Current: Risk indicators card mentioned but not detailed
   - Needed: Track integration risks, vendor viability, implementation risks
   - Solution: Use new procurement_risks table (from Phase 2 database enhancements)
   - Impact: Low (nice-to-have for CSP)
   - Effort: 6h

4. **PDF Report Generation** - IN ROADMAP (v1.2)
   - Current: HTML-based PDF approach planned
   - Needed: Upgrade to Puppeteer for professional PDF
   - Impact: Medium
   - Effort: 8h (Puppeteer integration, template design)

5. **Scenario Comparison** - IN ROADMAP (v1.2)
   - Current: Planned (49h for full feature)
   - Needed: "What if Integration weight is 50%?" - see how rankings change
   - Can use simplified version: Clone evaluation with adjusted weights, recalculate scores
   - Impact: Medium
   - Effort: 6h (simplified scenario builder)

**Recommendation:** Build traceability matrix + financial analysis for CSP
**Build Effort:** 20h (core reporting features)

---

### 7. STAKEHOLDER PORTALS (60% Ready)

#### Current State
✅ Vendor portal designed (pages in roadmap):
  - ClientPortal page
  - VendorPortal page
  - Portal access token management
  - Token expiration handling

⚠️ Client (internal stakeholder) portal NOT DESIGNED

#### CSP Requirements
- **Client Portal:**
  - Requirements review and approval
  - Comments on requirements
  - Status tracking (42 of 55 approved)
  - Stakeholder area dashboard
  - Per-stakeholder approval voting
- **Vendor Portal:**
  - RFP response entry
  - Real-time validation
  - Progress indicator
  - Document upload
  - Compliance checklist
  - Q&A forum access
  - Post-submission supplementary info
  - Status tracking during evaluation

#### Gap Assessment: MAJOR

**Gaps Identified:**

1. **Client Portal** - NOT BUILT
   - Current: No client-facing portal exists
   - Needed: Separate from vendor portal; shows requirements for approval
   - Solution: Create ClientPortal page + token-authenticated routes
   - Impact: Critical
   - Effort: 20h
     - 2h: Database (client_portal_access_tokens table)
     - 3h: ClientPortal page
     - 4h: RequirementsApprovalPanel component
     - 3h: ApprovalVoting component
     - 3h: StakeholderDashboard widget
     - 5h: Token management + security

2. **Vendor Portal Enhancements** - PARTIALLY NEEDED
   - Current: Basic vendor portal designed but enhancements needed
   - Needed:
     - Real-time validation on form submission
     - Progress indicator (3 of 25 sections complete)
     - Question importance badges
     - Compliance checklist sidebar
     - Document preview before upload
     - Auto-save functionality
   - Impact: Medium (improves response quality)
   - Effort: 12h
     - 2h: Real-time validation system
     - 2h: ProgressIndicator component
     - 2h: ImportanceBadges component
     - 2h: ComplianceChecklist component
     - 2h: DocumentPreview component
     - 2h: Auto-save implementation

3. **Portal Security & Token Management** - PARTIALLY BUILT
   - Current: Portal access token management exists for vendors
   - Needed: 
     - Extend for client portal tokens
     - Configure expiration periods per portal type (90 days vendor, 30 days client)
     - IP whitelist option (for client portal)
   - Impact: Medium
   - Effort: 4h

4. **Portal Branding & Customization** - PARTIALLY BUILT
   - Current: evaluation_projects.branding JSONB field supports this
   - Needed: UI to configure branding (logo, colors, footer text)
   - Impact: Low
   - Effort: 4h

5. **Mobile Optimization** - PLANNED BUT NOT DETAILED
   - Current: Responsive design mentioned but not detailed
   - Needed: Vendor portal mobile-first (stakeholders complete on mobile)
   - Impact: Medium
   - Effort: 4h (testing + responsive adjustments)

**Recommendation:** Build client portal as Priority 1, enhance vendor portal
**Build Effort:** 40h (core portals)

---

### 8. PROJECT MANAGEMENT (40% Ready)

#### Current State
✅ evaluation_projects table (status, timelines, branding)  
✅ Phase tracking via status field (setup → discovery → requirements → evaluation → complete)  
⚠️ Risk tracking NOT in Evaluator module  
⚠️ Issue tracking NOT in Evaluator module  
⚠️ Project dashboard NOT detailed  

#### CSP Requirements
- Project timeline visualization (Gantt-style phases)
- Risk identification and tracking (integration risks, vendor risks)
- Issue tracking (blockers, dependencies)
- Status reporting to steering committee
- Project milestones and deliverables
- Resource allocation tracking

#### Gap Assessment: MAJOR

**Gaps Identified:**

1. **Risk Management** - NOT BUILT
   - Current: No risk table or tracking
   - Needed: procurement_risks table + UI for risk identification/mitigation
   - Impact: Medium (best practice but not critical for evaluation)
   - Effort: 12h
     - 2h: Database schema
     - 4h: RisksService
     - 4h: RiskDashboard component
     - 2h: RiskForm component

2. **Issue Tracking** - NOT BUILT
   - Current: No issue table
   - Needed: procurement_issues table + UI for issue escalation
   - Impact: Low (nice-to-have)
   - Effort: 10h

3. **Timeline Visualization** - PARTIALLY BUILT
   - Current: EvaluationTimeline component mentioned in v1.1 roadmap
   - Needed: Gantt-style view of phases with actual vs target dates
   - Impact: Medium
   - Effort: 6h

4. **Project Status Dashboard** - PARTIALLY BUILT
   - Current: EvaluatorDashboard exists (project list + stat cards)
   - Needed: Single project view with timeline, risk/issue list, team assignments
   - Impact: Medium
   - Effort: 8h
     - 3h: ProjectStatusDashboard component
     - 2h: Phase tracker
     - 3h: Team assignments UI

**Recommendation:** Build basic risk tracking; defer issue tracking to v2.0
**Build Effort:** 36h (core project tracking)

---

## PRIORITY MATRIX: WHAT TO BUILD FOR CSP PROJECT

### Must-Build (Before Project Launch - Week 1-2 of CSP)

| Feature | Effort | Risk | ROI | Owner |
|---|---|---|---|---|
| **Live Workshop Collaboration** | 40h | High (new feature) | Critical | Dev Lead |
| **Q&A Forum** | 12h | Medium | Critical | Dev |
| **Client Portal** | 20h | Medium | Critical | Dev |
| **Vendor Portal Enhancements** | 12h | Low | High | Dev |
| **AI Response Scoring** | 8h | Low | High | Dev |
| **Traceability Matrix** | 8h | Medium | High | Dev |
| **Risk Tracking** | 12h | Low | Medium | Dev |
| **Financial Analysis** | 6h | Low | Medium | Dev |

**Subtotal Must-Build:** 118h

### Should-Build (Weeks 2-4 of CSP)

| Feature | Effort | Risk | ROI | Owner |
|---|---|---|---|---|
| **RFP Templates** | 24h | Low | Medium | Dev |
| **AI Consolidation** | 20h | Medium | High | Dev/ML |
| **Requirement Consolidation UI** | 6h | Low | High | Dev |
| **PDF Report Generation** | 8h | Low | High | Dev |
| **Email Notifications** | 16h | Medium | Medium | Dev |
| **Scenario Comparison** | 6h | Low | Medium | Dev |
| **Facilitator Controls** | 6h | Low | Medium | Dev |
| **Question Importance Badges** | 2h | Low | Low | Dev |

**Subtotal Should-Build:** 88h

### Nice-to-Have (Post-Project Enhancements)

| Feature | Effort | Risk | ROI | Owner |
|---|---|---|---|---|
| Blinded Scoring | 2h | Low | Low | Dev |
| Supplementary Info Submission | 4h | Low | Low | Dev |
| Reference Call Scheduling | 8h | Medium | Low | Dev |
| Project Timeline Gantt | 6h | Low | Low | Dev |
| Issue Tracking | 10h | Low | Low | Dev |
| Recording Transcription | 12h | High | Low | Dev/ML |
| Vendor Intelligence | 40h | High | Low | Dev/Ops |

**Subtotal Nice-to-Have:** 82h

### TOTAL Build Effort for CSP Project

| Phase | Hours | Timeline | Team |
|---|---|---|---|
| **Must-Build** | 118h | Weeks 1-2 | 1 FTE |
| **Should-Build** | 88h | Weeks 2-4 | 1 FTE |
| **Testing & Polish** | 20h | Weeks 4-5 | 1 FTE |
| **TOTAL** | **226h** | **5 weeks** | **1 FTE** |

**Alternative: 2 developers × 3 weeks (parallel tracks)**

---

## IMPLEMENTATION PLAN: PHASE 1 (Must-Build)

### Week 1: Live Workshop + Portal Foundation

**Days 1-2: Database Schema** (6h)
```sql
-- Live Workshop Tables
CREATE TABLE workshop_live_requirements (
  id UUID PRIMARY KEY,
  workshop_id UUID REFERENCES workshops(id),
  requirement_title VARCHAR(255) NOT NULL,
  requirement_description TEXT,
  contributor_name VARCHAR(100),
  ai_suggested_category UUID REFERENCES evaluation_categories(id),
  category_confidence DECIMAL(3,2),
  status VARCHAR(20), -- draft, proposed, voted, locked
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE workshop_live_votes (
  id UUID PRIMARY KEY,
  live_requirement_id UUID REFERENCES workshop_live_requirements(id),
  voter_name VARCHAR(100),
  vote_type VARCHAR(20), -- thumbs_up, priority_1, priority_2, priority_3
  created_at TIMESTAMPTZ
);

-- Client Portal Tables
CREATE TABLE client_portal_access_tokens (
  id UUID PRIMARY KEY,
  evaluation_project_id UUID REFERENCES evaluation_projects(id),
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id),
  access_token VARCHAR(255) UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ
);

-- Q&A Forum Tables
CREATE TABLE vendor_qa_threads (
  id UUID PRIMARY KEY,
  evaluation_project_id UUID REFERENCES evaluation_projects(id),
  vendor_id UUID REFERENCES vendors(id),
  question_text TEXT NOT NULL,
  asked_by VARCHAR(100),
  asked_at TIMESTAMPTZ,
  status VARCHAR(20) -- open, answered, closed
);

CREATE TABLE vendor_qa_answers (
  id UUID PRIMARY KEY,
  thread_id UUID REFERENCES vendor_qa_threads(id),
  answer_text TEXT NOT NULL,
  answered_by UUID REFERENCES profiles(id),
  answered_at TIMESTAMPTZ
);

-- Risk Tracking
CREATE TABLE procurement_risks (
  id UUID PRIMARY KEY,
  evaluation_project_id UUID REFERENCES evaluation_projects(id),
  risk_title VARCHAR(255),
  probability VARCHAR(20), -- low, medium, high
  impact VARCHAR(20), -- low, medium, high
  mitigation_plan TEXT,
  status VARCHAR(50) -- identified, mitigating, mitigated
);
```

**Days 3-4: Hook + Service Layer** (8h)
```javascript
// Create useLiveWorkshop hook
export function useLiveWorkshop(workshopId) {
  // Subscribe to real-time requirement changes
  // Subscribe to vote changes
  // Subscribe to presence (who's online)
  // Provide addRequirement, castVote, updatePhase methods
}

// Create WorkshopCollaborationService
class WorkshopCollaborationService {
  async startLiveSession(workshopId)
  async addLiveRequirement(workshopId, data)
  async castVote(liveRequirementId, voteData)
  async consolidateToFinal(workshopId)
  async getRealTimeStatus(workshopId)
}
```

**Days 5: Unit Testing** (2h)

---

### Week 1 (cont'd): Component Development

**Days 6-10: UI Components** (40h)
- LiveWorkshopFacilitator page (8h)
- LiveRequirementEntry component (8h)
- LiveVotingPanel component (8h)
- ClientPortal page (6h)
- ClientPortalToken management (6h)
- QAForum component (4h)

---

### Week 2: Integration & Testing

**Days 1-3: API Endpoints** (12h)
- POST /api/evaluator/workshop/add-live-requirement
- POST /api/evaluator/workshop/cast-vote
- POST /api/evaluator/client-portal/validate-token
- POST /api/evaluator/qa/ask-question
- POST /api/evaluator/qa/answer-question

**Days 4-5: Testing & Fixes** (8h)
- Functional testing of live features
- Supabase Realtime testing at scale
- Security testing (token validation)
- Mobile testing

**Day 6-10: AI + Analytics** (40h)
- ai-analyze-response endpoint enhancement (8h)
- Traceability matrix query (4h)
- TraceabilityMatrix component (8h)
- Financial analysis component (6h)
- Risk dashboard component (6h)
- Vendor portal enhancement (8h)

---

## IMPLEMENTATION ROADMAP: COMPLETE TIMELINE

### Sprint 1: Core Platforms (Weeks 1-2)

**Deliverables:**
- ✅ Live workshop collaboration (real-time entry + voting)
- ✅ Client approval portal
- ✅ Vendor Q&A forum
- ✅ Enhanced vendor portal (validation + progress)
- ✅ AI response scoring
- ✅ Traceability matrix view
- ✅ Risk dashboard

**Output:** MVP ready for CSP project with all critical features

### Sprint 2: Templates & Analytics (Weeks 3-4)

**Deliverables:**
- ✅ RFP templates (CSP Specialized, Integration-focus, Generic)
- ✅ AI consolidation wizard
- ✅ Requirement consolidation audit trail
- ✅ PDF report generation
- ✅ Financial comparison view
- ✅ Scenario comparison

**Output:** Enhanced platform with templates and decision support

### Sprint 3: Polish & Documentation (Week 5)

**Deliverables:**
- ✅ End-to-end testing
- ✅ Performance optimization
- ✅ User documentation
- ✅ Administrator guide
- ✅ Bug fixes
- ✅ Security audit

**Output:** Production-ready platform

---

## DEVELOPMENT TEAM & RESOURCE PLAN

### Recommended Team Structure

**Option A: 1 Full-Time Developer (5 weeks)**
- Senior Full-Stack Developer (React + Node + Supabase + Claude AI)
- Effort: 226 hours ÷ 40 hours/week = 5.65 weeks
- Cost: ~£28k-35k (assuming £120-150/hour rates)
- Risk: Single point of failure; tight timeline

**Option B: 2 Part-Time Developers (3 weeks)**
- Developer A: Frontend + UX (React, portals, components)
- Developer B: Backend + AI (APIs, Supabase, Claude)
- Effort: 226 hours ÷ 80 hours/week = 2.8 weeks
- Cost: ~£32k-40k (split between 2 developers)
- Risk: Lower risk; good collaboration
- **RECOMMENDED**

**Option C: 1 Developer + 1 Contractor (4 weeks)**
- Full-time developer: Core features + integration
- Contractor: UI components + testing
- Effort: 226 hours ÷ 60 hours/week = 3.8 weeks
- Cost: ~£30k-45k
- Risk: Medium; coordination overhead

### Recommended: Option B (2 Part-Time Developers)

**Developer A (Frontend):** 80h across 4 weeks
- Days 1-2: Client Portal (20h)
- Days 3-4: Vendor Portal Enhancements (12h)
- Days 5-6: Q&A Forum UI (8h)
- Days 7-8: Live Workshop UI (20h)
- Days 9-10: Traceability Matrix (12h)
- Days 11-12: Risk Dashboard (8h)

**Developer B (Backend/AI):** 80h across 4 weeks
- Days 1-2: Database Schema + Live Workshop Service (16h)
- Days 3-4: Portal Auth + Q&A Service (16h)
- Days 5-6: AI Response Scoring Endpoint (12h)
- Days 7-8: Financial Analysis Service (8h)
- Days 9-10: Risk Service (12h)
- Days 11-12: Integration & Testing (16h)

---

## RISK MITIGATION

### High Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Supabase Realtime scalability** | Medium | High | Load testing early; fallback to polling if needed |
| **AI API costs** | Medium | Medium | Implement token usage tracking; set daily limits |
| **Performance with large datasets** | Low | High | Query optimization; pagination on matrices |
| **Timeline slippage** | Medium | High | Agile approach; cut nice-to-haves first |
| **Security vulnerabilities in portals** | Low | Critical | Security audit; penetration testing |

### Medium Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| **Portal UX issues** | Medium | Medium | User testing with stakeholders; iterate quickly |
| **AI recommendation accuracy** | Medium | Medium | Tuning with example data; evaluator review |
| **Integration testing complexity** | Medium | Medium | Early 3E/Intapp/Peppermint testing |

---

## SUCCESS CRITERIA

### Project Success Metrics

| Metric | Target | How to Measure |
|---|---|---|
| **All must-build features deployed** | 100% | Feature checklist completion |
| **Performance (live workshop)** | <500ms latency | Load testing results |
| **Portal security** | 0 vulnerabilities | Security audit report |
| **Test coverage** | 80%+ | Jest coverage report |
| **Documentation complete** | 100% | Admin + user guides finished |
| **End-user satisfaction** | 4.5/5 | Post-launch survey |

### CSP Project Success Metrics (Using Platform)

| Metric | Target | Owner |
|---|---|---|
| Requirements captured | 55+ | CSP team |
| Stakeholder approval rate | 95%+ | CSP PM |
| Vendor response rate | 100% (4/4) | CSP PM |
| Evaluation consensus rate | 85%+ | Evaluation team |
| Evaluation cycle time | 13 weeks | CSP PM |
| Executive satisfaction | 4.5/5 | Executive sponsor |

---

## COST ESTIMATE

### Development Costs

| Item | Cost | Notes |
|---|---|---|
| **Developer A (Frontend)** | £16,000 | 80h @ £200/h |
| **Developer B (Backend)** | £16,000 | 80h @ £200/h |
| **QA/Testing** | £3,000 | 15h @ £200/h |
| **Security Audit** | £2,000 | External contractor |
| **Claude API usage** | £500 | ~50k tokens @ $0.01/1k tokens |
| **Supabase (increased quota)** | £1,000 | 4 weeks @ £250/week |
| **Project Management** | £2,000 | 10h PM time |
| **Contingency (10%)** | £4,150 | Risk buffer |
| **TOTAL** | **£44,650** | |

### Ongoing Costs (Post-Launch)

| Item | Monthly | Notes |
|---|---|---|
| **Supabase Standard** | £400 | Continued operations |
| **Claude API** | £200 | AI features usage |
| **Vercel** | £100 | Hosting |
| **Support & Maintenance** | £1,000 | Retainer for bug fixes |
| **TOTAL/Month** | **£1,700** | |

---

## CONCLUSION & RECOMMENDATIONS

### Summary

Your existing Evaluator module is **68% complete** for the CSP procurement project. With **226 hours of focused development** (5 weeks, 1 FTE or 3 weeks, 2 developers), you can build all critical missing features and have a production-ready platform.

### Key Recommendations

1. **Prioritize Live Workshop Collaboration** (40h) - This is the most complex feature and highest risk
2. **Use 2-Part-Time Developers** - Better than 1 FTE for both speed and risk mitigation
3. **Accelerate AI Consolidation** (20h) - Defer full feature to post-CSP; build minimal MVP
4. **Defer Nice-to-Have Features** - Templates, Gantt charts, recording transcription → v2.0
5. **Lock Scope Early** - CSP project doesn't need perfection; good enough is good enough

### Next Steps

1. **Week 1:** Executive approval of requirements + resource allocation
2. **Week 2:** Kick-off sprint; assign developers; start database schema
3. **Week 3-5:** Development sprint (parallel frontend + backend work)
4. **Week 6:** Testing, bug fixes, security audit
5. **Week 7:** Production deployment + CSP project kick-off

### Success Factors

✅ Committed developers (no context switching)  
✅ Clear requirements (this document)  
✅ Agile approach (iterate weekly)  
✅ Stakeholder feedback loop (weekly demos)  
✅ Risk management (daily standup)  

---

*Document version 1.0 - Ready for Development Team Review*
*Prepared by: Technical Assessment*
*Date: 9 January 2026*