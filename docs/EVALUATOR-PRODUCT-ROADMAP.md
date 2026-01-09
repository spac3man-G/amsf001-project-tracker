# Evaluator Product Roadmap

## Consolidated Implementation Plan

**Document Version**: 2.0
**Created**: 08 January 2026
**Updated**: 09 January 2026
**Status**: Active Development
**Project Context**: CSP Technology Procurement Exercise

---

## Executive Summary

This document consolidates the Evaluator module enhancement plan with specific requirements from the **CSP (Carey Olsen Corporate Services) Technology Platform Selection** project. The CSP project involves evaluating 4 vendors (CSC Entity Management, Athennian, Vistra Platform, Quantios Core) across 55 requirements spanning 7 categories.

### Current State Assessment

| Category | Readiness | Gap Severity | Notes |
|----------|-----------|--------------|-------|
| Core Evaluation Framework | 85% | Minimal | Scoring, consensus, audit trail built |
| Requirements Management | 80% | Minor | Consolidation needed |
| Workshop & Collaboration | 50% | **Major** | Live collaboration critical gap |
| RFP & Vendor Management | 75% | Medium | Q&A forum now complete |
| AI Integration | 65% | Medium | Response analysis in roadmap |
| Reporting & Analytics | 70% | Minor | Traceability matrix needed |
| Stakeholder Portals | 70% | Medium | Client portal needed |
| Project Management | 40% | Major | Risk tracking needed |
| **Overall** | **68%** | **Medium-High** | |

### What's Complete (as of 09 Jan 2026)

- **Vendor Q&A System** (Feature 1.4) - Completed and pushed
  - `vendor_qa` table with RLS policies
  - VendorQAService with full workflow
  - QASubmissionForm and QAHistory components
  - QAManagementHub for evaluation team
  - Q&A period management (enable/disable, dates)
  - Share answered Q&A with all vendors (anonymized)

---

## Strategic Themes

1. **CSP Project Enablement** - Features required for Jan-May 2026 procurement
2. **Automation & Intelligence** - AI-powered analysis and workflow automation
3. **Decision Confidence** - Better visualization and analytics for decision-making
4. **Collaboration Excellence** - Real-time stakeholder engagement

---

## Release Schedule (Updated)

| Release | Theme | Target | Duration | Status |
|---------|-------|--------|----------|--------|
| **v1.0.x** | CSP Critical Path | Jan 2026 | 2-3 weeks | **IN PROGRESS** |
| **v1.1** | Quick Wins + CSP Phase 2 | Feb 2026 | 4-6 weeks | Planned |
| **v1.2** | Templates & Analytics | Mar 2026 | 6-8 weeks | Planned |
| **v1.3** | Collaboration Excellence | May 2026 | 8-10 weeks | Planned |
| **v2.0** | Platform Evolution | Aug 2026 | 12-16 weeks | Planned |

---

# PHASE 0: CSP CRITICAL PATH (v1.0.x)

## Priority Matrix: Must-Build Before CSP Launch

These features are required before the CSP project can proceed effectively.

| Feature | Effort | Status | Priority |
|---------|--------|--------|----------|
| ~~Vendor Q&A Forum~~ | ~~12h~~ | **COMPLETE** | ~~Critical~~ |
| Live Workshop Collaboration | 40h | Not Started | **Critical** |
| Client Approval Portal | 20h | Not Started | **Critical** |
| AI Response Scoring | 8h | Not Started | High |
| Traceability Matrix Enhancement | 8h | Partial | High |
| Risk Dashboard | 12h | Not Started | Medium |
| Financial Analysis View | 6h | Not Started | Medium |

**Total Remaining Effort**: ~94h (excluding completed Q&A)

---

## Feature 0.1: Live Workshop Collaboration [CRITICAL]

### Purpose
Enable real-time requirement capture during stakeholder workshops - essential for CSP requirements gathering phase.

### User Journey: UJ1.1 - Business Stakeholder Contributing Requirements via Workshop

**Actor:** CSP manager, Finance team member, Compliance officer
**Trigger:** Workshop date arrival

**Journey Steps:**
1. User receives workshop invite (email with Outlook integration)
2. User accepts RSVP through invite link
3. On workshop day, user joins live collaboration session
4. Facilitator explains evaluation context and scoring framework
5. **Requirements entry mode:**
   - User clicks "Add Requirement"
   - Types requirement title and description
   - System provides real-time AI category suggestions based on text content
   - User selects category (or accepts AI suggestion)
   - User rates priority (MoSCoW: Must/Should/Could/Won't)
   - Requirement appears instantly in shared list with "new" indicator
6. User votes on other requirements (thumbs up, priority dots)
7. AI consolidation engine runs in real-time, flagging duplicates
8. Facilitator guides consolidation discussion
9. User reviews consolidated requirement set
10. Post-workshop: User completes follow-up survey

**AI Integration Points:**
- Real-time category suggestion based on requirement text
- Duplicate/similar requirement detection with merge suggestions
- Stakeholder perspective analysis

### Use Case: UC1 - Collect stakeholder requirements via workshop

**Actors:** Facilitator, Stakeholders (Finance, IT, Compliance, CSP Partners)
**Precondition:** Workshop scheduled
**Flow:**
1. Facilitator starts live workshop session
2. Stakeholders join via web portal or Teams link
3. Facilitator explains evaluation context and success criteria
4. Stakeholders enter requirements in real-time via quick-add form
5. System shows live vote counts on requirements (priority/importance)
6. AI flags likely duplicates in real-time
7. Facilitator guides final prioritization discussion
8. Post-workshop: System sends follow-up questionnaire to attendees

**Post-Condition:** All workshop requirements captured and attributed to stakeholder

### Technical Specification

#### Database Changes

```sql
-- Live Workshop Tables
CREATE TABLE workshop_live_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  requirement_title VARCHAR(255) NOT NULL,
  requirement_description TEXT,
  contributor_id UUID REFERENCES profiles(id),
  contributor_name VARCHAR(100),
  ai_suggested_category UUID REFERENCES evaluation_categories(id),
  category_confidence DECIMAL(3,2),
  selected_category UUID REFERENCES evaluation_categories(id),
  priority VARCHAR(20), -- must_have, should_have, could_have, wont_have
  status VARCHAR(20) DEFAULT 'draft', -- draft, proposed, voted, locked, finalized
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES workshop_live_requirements(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workshop_live_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_requirement_id UUID NOT NULL REFERENCES workshop_live_requirements(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES profiles(id),
  voter_name VARCHAR(100),
  vote_type VARCHAR(20) NOT NULL, -- thumbs_up, priority_1, priority_2, priority_3
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(live_requirement_id, voter_id, vote_type)
);

CREATE TABLE workshop_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  phase VARCHAR(30) NOT NULL, -- entry, voting, discussion, consolidation, locked
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  started_by UUID REFERENCES profiles(id)
);

-- Indexes
CREATE INDEX idx_workshop_live_req_workshop ON workshop_live_requirements(workshop_id);
CREATE INDEX idx_workshop_live_votes_req ON workshop_live_votes(live_requirement_id);
```

#### New Service: WorkshopCollaborationService

```javascript
// src/services/evaluator/workshopCollaboration.service.js

class WorkshopCollaborationService {
  // Start live session
  async startLiveSession(workshopId, facilitatorId) { }

  // Add live requirement
  async addLiveRequirement(workshopId, data) { }

  // Cast vote
  async castVote(liveRequirementId, voterId, voteType) { }

  // Remove vote
  async removeVote(liveRequirementId, voterId, voteType) { }

  // Get vote counts
  async getVoteCounts(workshopId) { }

  // Change workshop phase
  async setPhase(workshopId, phase, userId) { }

  // Mark as duplicate
  async markDuplicate(requirementId, duplicateOfId) { }

  // Finalize to requirements table
  async finalizeToRequirements(workshopId, userId) { }

  // Get AI category suggestion
  async suggestCategory(requirementText, evaluationProjectId) { }

  // Detect duplicates
  async detectDuplicates(workshopId) { }
}
```

#### New Hook: useLiveWorkshop

```javascript
// src/hooks/useLiveWorkshop.js

export function useLiveWorkshop(workshopId) {
  const [liveRequirements, setLiveRequirements] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [votes, setVotes] = useState({});
  const [currentPhase, setCurrentPhase] = useState('entry');

  useEffect(() => {
    // Subscribe to requirement changes via Supabase Realtime
    const reqChannel = supabase
      .channel(`workshop:${workshopId}:requirements`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workshop_live_requirements',
        filter: `workshop_id=eq.${workshopId}`
      }, handleRequirementChange)
      .subscribe();

    // Subscribe to presence (active users)
    const presenceChannel = supabase
      .channel(`workshop:${workshopId}:presence`)
      .on('presence', { event: 'sync' }, () => {
        setActiveUsers(presenceChannel.presenceState());
      })
      .subscribe();

    // Subscribe to votes broadcast
    const voteChannel = supabase
      .channel(`workshop:${workshopId}:votes`)
      .on('broadcast', { event: 'vote' }, handleVote)
      .subscribe();

    return () => {
      reqChannel.unsubscribe();
      presenceChannel.unsubscribe();
      voteChannel.unsubscribe();
    };
  }, [workshopId]);

  return {
    liveRequirements,
    activeUsers,
    votes,
    currentPhase,
    addRequirement,
    castVote,
    removeVote,
    setPhase
  };
}
```

#### UI Components

```
src/pages/evaluator/LiveWorkshop.jsx           # Main live workshop page
src/components/evaluator/workshop/
├── LiveRequirementEntry.jsx                   # Quick-add form
├── LiveRequirementList.jsx                    # Real-time updating list
├── LiveRequirementCard.jsx                    # Single requirement with votes
├── LiveVotingPanel.jsx                        # Vote buttons
├── WorkshopPhaseControl.jsx                   # Facilitator phase controls
├── ActiveUsersIndicator.jsx                   # Who's online
├── DuplicateDetectionAlert.jsx                # AI duplicate warning
├── CategorySuggestionChip.jsx                 # AI category suggestion
└── WorkshopTimer.jsx                          # Session timer
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration for live workshop tables | 3h | None |
| WorkshopCollaborationService implementation | 6h | Database |
| useLiveWorkshop hook with Supabase Realtime | 6h | Service |
| LiveWorkshop page | 6h | Hook |
| LiveRequirementEntry component | 3h | Page |
| LiveRequirementList + Card components | 4h | Page |
| LiveVotingPanel component | 3h | Hook |
| WorkshopPhaseControl component | 3h | Service |
| ActiveUsersIndicator component | 2h | Hook |
| AI category suggestion endpoint | 3h | None |
| DuplicateDetectionAlert + AI endpoint | 4h | Service |
| Finalize to requirements logic | 3h | Service |
| Testing and polish | 4h | All |
| **Total** | **50h** | |

---

## Feature 0.2: Client Approval Portal [CRITICAL]

### Purpose
Separate portal for internal client stakeholders (Carey Olsen partners, Finance, IT) to review and approve consolidated requirements before RFP.

### User Journey: UJ4.1 - Client Stakeholder Accessing Portal for Requirements Approval

**Actor:** Carey Olsen partner, Finance director
**Trigger:** User receives email: "Please review and approve CSP requirements"

**Journey Steps:**
1. User clicks portal link in email (unique token-authenticated)
2. Portal loads with Carey Olsen branding
3. User sees "Requirements for Approval" dashboard:
   - 55 requirements organized by category
   - Status indicators (approved, pending review, revision requested)
4. User can:
   - **View by category** (e.g., show only "Integration Requirements")
   - **View by priority** (e.g., show only "Must Have")
   - **View by stakeholder area** (e.g., requirements contributed by Finance team)
5. For each requirement, user sees:
   - Requirement title and description
   - Category and priority
   - Stakeholders who contributed/supported it
   - Links to RFP questions addressing this requirement
6. User can add comments on individual requirements
7. User can:
   - Approve requirement individually
   - Flag for revision
   - Request evidence
8. User views overall approval progress:
   - "Your team has approved 42 of 55 requirements (76%)"
9. User submits final approval with signature
10. System notifies all stakeholders: "Finance team has approved requirements"

### Use Case: UC10 - Client stakeholders review and approve consolidated requirements

**Actors:** Stakeholders (Finance, IT, Compliance, CSP Partners)
**Precondition:** Requirements consolidation complete
**Flow:**
1. System sends approval email to stakeholders with portal link
2. Stakeholders access client portal
3. Each stakeholder reviews requirements
4. Stakeholders vote on requirement approval
5. System tracks approval percentage per stakeholder area
6. Once all stakeholder areas approve, requirements are "Approved"
7. Final approved requirement set locked for RFP

**Post-Condition:** Client-approved requirement set ready for RFP

### Technical Specification

#### Database Changes

```sql
-- Client Portal Access
CREATE TABLE client_portal_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id),
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  access_token VARCHAR(64) UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Requirement Approvals (extends existing requirement_approvals)
ALTER TABLE requirement_approvals ADD COLUMN IF NOT EXISTS
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id);
ALTER TABLE requirement_approvals ADD COLUMN IF NOT EXISTS
  approval_note TEXT;
ALTER TABLE requirement_approvals ADD COLUMN IF NOT EXISTS
  revision_requested BOOLEAN DEFAULT false;

-- Stakeholder Area Approval Summary
CREATE TABLE stakeholder_area_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  stakeholder_area_id UUID NOT NULL REFERENCES stakeholder_areas(id),
  approved_by UUID REFERENCES profiles(id),
  approved_by_name VARCHAR(255),
  approved_at TIMESTAMPTZ,
  approval_signature TEXT, -- Digital signature/confirmation
  total_requirements INTEGER,
  approved_count INTEGER,
  revision_requested_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_portal_token ON client_portal_access_tokens(access_token);
```

#### New Service: ClientPortalService

```javascript
// src/services/evaluator/clientPortal.service.js

class ClientPortalService {
  // Generate access token
  async generateAccessToken(evaluationProjectId, stakeholderAreaId, email, name) { }

  // Validate token
  async validateToken(token) { }

  // Get requirements for approval
  async getRequirementsForApproval(token, filters) { }

  // Approve requirement
  async approveRequirement(token, requirementId, note) { }

  // Request revision
  async requestRevision(token, requirementId, reason) { }

  // Submit final area approval
  async submitAreaApproval(token, signature) { }

  // Get approval progress
  async getApprovalProgress(evaluationProjectId) { }

  // Send invitation emails
  async sendInvitations(evaluationProjectId, stakeholderAreaId, emails) { }
}
```

#### UI Components

```
src/pages/evaluator/ClientPortal.jsx           # Main client portal page
src/components/evaluator/clientPortal/
├── ClientPortalLogin.jsx                      # Token entry if not in URL
├── RequirementsApprovalList.jsx               # List with filters
├── RequirementApprovalCard.jsx                # Single requirement
├── ApprovalProgressBar.jsx                    # Overall progress
├── StakeholderAreaProgress.jsx                # Progress by area
├── ApprovalCommentForm.jsx                    # Add comments
├── RevisionRequestModal.jsx                   # Request changes
├── FinalApprovalModal.jsx                     # Digital signature
└── ClientPortalHeader.jsx                     # Branded header
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration for client portal | 2h | None |
| ClientPortalService implementation | 5h | Database |
| Token validation API endpoint | 2h | Service |
| ClientPortal page | 4h | Service |
| RequirementsApprovalList component | 3h | Page |
| RequirementApprovalCard component | 2h | List |
| ApprovalProgressBar component | 2h | Page |
| StakeholderAreaProgress component | 2h | Page |
| ApprovalCommentForm component | 2h | Card |
| RevisionRequestModal component | 2h | Card |
| FinalApprovalModal component | 2h | Page |
| Email invitation integration | 3h | Service |
| Testing and polish | 3h | All |
| **Total** | **34h** | |

---

## Feature 0.3: AI Response Scoring Enhancement

### Purpose
Extend AI response analysis to include score suggestions, helping evaluators score faster and more consistently.

### User Journey: UJ2.3 - Evaluator Reviewing Vendor Response with AI Analysis

**Actor:** Technical evaluator, Solution architect
**Trigger:** Evaluator clicks "Review Response" on vendor dashboard

**Journey Steps:**
1. Evaluator opens vendor response view
2. System displays response with:
   - Vendor name and submission date
   - Overall completion percentage
   - Question-by-question navigation
3. For each question response, evaluator sees:
   - **Response text** (vendor's answer)
   - **Supporting documents** (linked case studies, specs)
   - **AI Analysis Panel** (system-generated insights)
4. AI Analysis includes:
   - **Summary** (2-3 sentence distilled version)
   - **Key Points** (bullet-point extraction of main claims)
   - **Compliance Gaps** (areas where response is ambiguous or incomplete)
   - **Strengths** (positive differentiators)
   - **Suggested Score** (0-5 with rationale) **[NEW]**
   - **Confidence Level** (low/medium/high) **[NEW]**
   - **Comparison Notes** (how this compares to other vendors)
5. Evaluator scores response using guidance:
   - Reviews vendor response and AI summary
   - Sees AI suggested score with rationale
   - Enters score (can accept, modify, or override AI suggestion)
   - Enters confidence level
   - Adds written justification for score
6. System tracks when evaluator accepts vs overrides AI suggestion

### Technical Specification

#### API Enhancement

```javascript
// api/evaluator/ai-analyze-response.js (enhanced)

export default async function handler(req, res) {
  const {
    responseId,
    questionText,
    responseText,
    requirementContext,
    scoringScale,
    scoringGuidance, // NEW: Scoring criteria descriptions
    otherVendorResponses
  } = req.body;

  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: [{ role: 'user', content: buildAnalysisPrompt(...) }],
    tools: [analyzeResponseTool]
  });

  return res.json({
    summary: analysis.summary,
    keyPoints: analysis.keyPoints,
    complianceGaps: analysis.gaps,
    strengths: analysis.strengths,
    suggestedScore: {
      value: analysis.score,           // 0-5
      rationale: analysis.scoreRationale,
      confidence: analysis.confidence   // low, medium, high
    },
    comparisonNotes: analysis.comparison
  });
}
```

#### Database Changes

```sql
-- Track AI score suggestions
ALTER TABLE scores ADD COLUMN IF NOT EXISTS ai_suggested_score DECIMAL(3,1);
ALTER TABLE scores ADD COLUMN IF NOT EXISTS ai_suggestion_accepted BOOLEAN;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS ai_analysis_id UUID;

-- Cache AI analysis
CREATE TABLE vendor_response_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_response_id UUID NOT NULL REFERENCES vendor_responses(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  suggested_score DECIMAL(3,1),
  confidence VARCHAR(20),
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  model_used VARCHAR(100),
  token_usage INTEGER
);
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Enhance ai-analyze-response endpoint | 4h | None |
| Database migration for AI tracking | 1h | None |
| Update tool definition with scoring | 2h | API |
| ResponseAnalysisPanel scoring display | 3h | API |
| Score suggestion acceptance UI | 2h | Panel |
| AI suggestion tracking in scores | 2h | Database |
| Testing and prompt refinement | 4h | All |
| **Total** | **18h** | |

---

## Feature 0.4: Enhanced Traceability Matrix

### Purpose
Interactive matrix showing Requirements × Vendors × Scores with drill-down capability.

### User Journey: UJ3.2 - Evaluator Viewing Traceability Matrix

**Actor:** CSP consultant, Steering committee member
**Trigger:** User navigates to "Traceability View" tab

**Journey Steps:**
1. System displays interactive traceability matrix:
   - **Rows:** 55 requirements (grouped by category)
   - **Columns:** 4 vendors
   - **Cells:** Colored by score (5=dark green, 4=green, 3=yellow, 2=orange, 1=red)
2. User can:
   - **Filter by category** (show only "Integration Requirements")
   - **Filter by priority** (show only "Must Have" requirements)
   - **Sort by vendor** (show which vendor scores highest)
3. User clicks on a cell:
   - Right panel opens showing:
     - **Requirement:** Original requirement text
     - **Related RFP Question:** The question asked
     - **Vendor Response:** Vendor's response text
     - **Evidence:** Supporting documents
     - **Evaluation:** Individual scores + consensus score
     - **Rationale:** Why consensus score was chosen
4. System highlights key insights:
   - "Vistra scores highest on real-time reporting (avg 4.6)"
   - "All vendors have gap on AEOI automation (avg 3.1)"
5. User can export traceability report (spreadsheet, detailed PDF)

### Technical Specification

```javascript
// src/services/evaluator/traceability.service.js

class TraceabilityService {
  // Get matrix data
  async getTraceabilityMatrix(evaluationProjectId, options = {}) {
    const { categoryFilter, priorityFilter, vendorIds } = options;
    // Returns: {
    //   requirements: [],
    //   vendors: [],
    //   scores: { [reqId]: { [vendorId]: scoreData } },
    //   insights: []
    // }
  }

  // Get drill-down detail
  async getCellDetail(requirementId, vendorId) {
    // Returns full detail including response, evidence, scores
  }

  // Generate insights
  async generateInsights(evaluationProjectId) {
    // AI-generated insights about gaps and differentiators
  }

  // Export matrix
  async exportMatrix(evaluationProjectId, format) {
    // format: 'xlsx', 'pdf', 'csv'
  }
}
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| TraceabilityService implementation | 4h | None |
| Matrix data query optimization | 2h | Service |
| TraceabilityMatrix component | 5h | Service |
| CellDetailPanel component | 3h | Matrix |
| Matrix filters and sorting | 2h | Matrix |
| Insights generation (AI) | 3h | Service |
| Export functionality | 3h | Service |
| Testing and polish | 2h | All |
| **Total** | **24h** | |

---

## Feature 0.5: Risk Dashboard

### Purpose
Track procurement project risks including integration risks, vendor viability, and implementation risks.

### Technical Specification

#### Database Changes

```sql
CREATE TABLE procurement_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Risk details
  risk_title VARCHAR(255) NOT NULL,
  risk_description TEXT,
  risk_category VARCHAR(50), -- integration, vendor_viability, implementation, commercial, technical

  -- Assessment
  probability VARCHAR(20), -- low, medium, high
  impact VARCHAR(20), -- low, medium, high
  risk_score INTEGER GENERATED ALWAYS AS (
    CASE probability WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END *
    CASE impact WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END
  ) STORED,

  -- Mitigation
  mitigation_plan TEXT,
  mitigation_owner UUID REFERENCES profiles(id),
  mitigation_status VARCHAR(50) DEFAULT 'identified', -- identified, mitigating, mitigated, accepted, escalated
  mitigation_due_date DATE,

  -- Vendor association (optional)
  vendor_id UUID REFERENCES vendors(id),

  -- Timestamps
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE procurement_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  issue_title VARCHAR(255) NOT NULL,
  issue_description TEXT,
  priority VARCHAR(20), -- low, medium, high, critical

  resolution_plan TEXT,
  owner_id UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed

  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration | 2h | None |
| RisksService implementation | 4h | Database |
| RiskDashboard component | 4h | Service |
| RiskCard component | 2h | Dashboard |
| RiskForm (create/edit) | 3h | Service |
| Risk matrix visualization | 3h | Dashboard |
| Issues list component | 2h | Service |
| Testing and polish | 2h | All |
| **Total** | **22h** | |

---

## v1.0.x Phase Summary

| Feature | Effort | Status | Priority |
|---------|--------|--------|----------|
| ~~Vendor Q&A Forum~~ | ~~12h~~ | **COMPLETE** | ~~Critical~~ |
| Live Workshop Collaboration | 50h | Not Started | Critical |
| Client Approval Portal | 34h | Not Started | Critical |
| AI Response Scoring | 18h | Not Started | High |
| Traceability Matrix | 24h | Not Started | High |
| Risk Dashboard | 22h | Not Started | Medium |
| **Total Remaining** | **148h** | | |

**Timeline**: 4-5 weeks with 1 FTE developer

---

# PHASE 1: QUICK WINS (v1.1)

Building on existing roadmap with CSP-specific enhancements.

## Feature 1.1: Smart Notifications & Reminders

### Enhanced for CSP Requirements

**Additional Notification Types:**

| Type | Trigger | Recipients | Timing |
|------|---------|------------|--------|
| `requirement_approval_needed` | Requirement submitted for approval | Client stakeholders | Immediate |
| `requirement_approved` | Client approves requirement | Evaluation team | Immediate |
| `workshop_reminder` | Upcoming workshop | Attendees, Facilitator | 24h, 1h before |
| `qa_question_submitted` | Vendor asks question | Evaluation team | Immediate |
| `qa_answer_published` | Question answered | Asking vendor | Immediate |
| `qa_shared` | Q&A shared with all vendors | All vendors | Immediate |
| `client_comment_added` | Client adds comment | Evaluation team | Immediate |
| `evaluation_milestone` | Phase completion | All stakeholders | Immediate |

**Estimated Effort**: 36h (as per original roadmap)

---

## Feature 1.2: AI-Powered Response Analysis

**Enhancements from CSP requirements:**
- Include score suggestion (covered in Feature 0.3)
- Add comparison across vendors
- Cache analysis for reuse

**Estimated Effort**: 28h (as per original roadmap)

---

## Feature 1.3: Dashboard Analytics Widgets

**Additional Widgets for CSP:**
- Stakeholder participation by area (who contributed requirements)
- Q&A activity (questions asked, response times)
- Client approval progress

**Estimated Effort**: 36h (as per original roadmap)

---

## Feature 1.4: Vendor Q&A Management [COMPLETE]

**Status**: Implemented and pushed on 09 January 2026

**What was built:**
- `vendor_qa` table with full RLS policies
- Q&A period settings (qa_enabled, qa_start_date, qa_end_date)
- VendorQAService with complete workflow
- QASubmissionForm component for vendor portal
- QAHistory component showing own + shared Q&A
- QAManagementHub for evaluation team
- Share with all vendors (anonymized option)
- Withdraw question capability

---

## v1.1 Release Summary

| Feature | Effort | Status |
|---------|--------|--------|
| Smart Notifications | 36h | Planned |
| AI Response Analysis | 28h | Planned |
| Dashboard Analytics | 36h | Planned |
| ~~Vendor Q&A~~ | ~~12h~~ | **COMPLETE** |
| **Total v1.1** | **100h** | |

---

# PHASE 2: TEMPLATES & ANALYTICS (v1.2)

## Feature 2.1: Evaluation Templates

### CSP-Specific Templates

**Template: CSP Entity Management Evaluation**
```json
{
  "name": "CSP Entity Management Evaluation",
  "domain": "Entity Management",
  "categories": [
    { "name": "Functional Requirements", "weight": 36 },
    { "name": "Integration Requirements", "weight": 30 },
    { "name": "Technical Architecture", "weight": 12 },
    { "name": "Compliance Automation", "weight": 9 },
    { "name": "Vendor Viability", "weight": 6 },
    { "name": "Commercial Terms", "weight": 7 }
  ],
  "stakeholderAreas": [
    { "name": "Finance" },
    { "name": "IT" },
    { "name": "Compliance" },
    { "name": "CSP Partners" }
  ],
  "integrations": [
    "3E/Elite",
    "Intapp",
    "Peppermint"
  ]
}
```

**Estimated Effort**: 43h (as per original roadmap)

---

## Feature 2.2: Scenario Comparison Tool

**CSP Use Case:**
- Baseline: Current weightings (Integration 30%, Functional 36%, etc.)
- Scenario 2: Integration-First (increase integration weight to 50%)
- Scenario 3: Cost-Conscious (increase cost weight to 20%)

**Estimated Effort**: 49h (as per original roadmap)

---

## Feature 2.3: Advanced Reporting

### AI Executive Summary Enhancement

**CSP-Specific Report Sections:**
- Integration capability comparison (3E, Intapp, Peppermint)
- AEOI/CRS compliance gap analysis
- ViewPoint migration risk assessment
- 3-year TCO comparison

**Estimated Effort**: 48h (as per original roadmap)

---

## Feature 2.4: AI Requirement Consolidation

### User Journey: UJ1.3 - Evaluator Consolidating Requirements

**Actor:** CSP consultant, Procurement manager
**Trigger:** User navigates to "Requirements Hub" > "Consolidation" tab

**Journey Steps:**
1. System displays all raw requirements (workshop + form submissions)
2. User clicks "Run AI Consolidation"
3. System analyzes for:
   - Semantic similarity (AI identifies clusters)
   - Conflicts/contradictions between stakeholder groups
   - Categorization suggestions
4. AI consolidation report displays:
   - **Duplicate Groups** (e.g., "These 3 requirements mean the same thing")
   - **Conflicts** (e.g., "Finance wants 'real-time'; IT says 'daily batch sufficient'")
   - **Auto-Grouping Suggestions**
5. User reviews and manually adjusts
6. For each group, user:
   - Selects canonical requirement
   - Marks others as absorbed
   - Adds consolidation note
7. System generates consolidation report with audit trail

### Technical Specification

```sql
CREATE TABLE requirement_consolidation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  canonical_requirement_id UUID REFERENCES requirements(id),
  group_name VARCHAR(255),
  consolidation_type VARCHAR(50), -- duplicate, conflict, variant
  ai_confidence DECIMAL(3,2),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requirement_consolidation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES requirement_consolidation_groups(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  role VARCHAR(20), -- canonical, absorbed, variant
  consolidation_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Estimated Effort**: 42h (from v1.3, accelerated for CSP)

---

## v1.2 Release Summary

| Feature | Effort | Priority |
|---------|--------|----------|
| Evaluation Templates | 43h | High |
| Scenario Comparison | 49h | High |
| Advanced Reporting | 48h | High |
| AI Requirement Consolidation | 42h | High |
| **Total v1.2** | **182h** | |

---

# PHASE 3: COLLABORATION EXCELLENCE (v1.3)

## Feature 3.1: Real-Time Multi-User Editing

Beyond workshops - enable live collaboration on:
- Requirements editing
- Scoring sessions
- Report collaboration

**Estimated Effort**: 56h (as per original roadmap)

---

## Feature 3.2: Vendor Portal Enhancements

### CSP-Specific Enhancements

- Real-time validation (min character counts, required fields)
- Progress indicator (3 of 25 sections complete)
- Question importance badges (Critical, High, Medium, Low)
- Compliance checklist sidebar
- Document preview before upload
- Auto-save functionality

**Estimated Effort**: 33h (as per original roadmap)

---

## Feature 3.3: Financial Analysis View

### Use Case: UC12 - Compare vendor scenarios and analyze sensitivity

**Components:**
- 3-year TCO breakdown per vendor
- Implementation cost vs ongoing operations
- Cost sensitivity analysis ("If implementation runs 10% over...")
- Financial risk indicators

**Estimated Effort**: 20h

---

## v1.3 Release Summary

| Feature | Effort |
|---------|--------|
| Real-Time Multi-User Editing | 56h |
| Vendor Portal Enhancements | 33h |
| Financial Analysis View | 20h |
| **Total v1.3** | **109h** |

---

# PHASE 4: PLATFORM EVOLUTION (v2.0)

## Feature 4.1: Procurement Workflow Extension

Track post-selection:
- Contract negotiation progress
- Commercial terms checklist
- Implementation planning
- Success metrics tracking

**Estimated Effort**: 55h (as per original roadmap)

---

## Feature 4.2: Multi-Evaluation Benchmarking

- Vendor performance across evaluations
- Category benchmarks vs org averages
- Best practices library
- Historical trends

**Estimated Effort**: 56h (as per original roadmap)

---

## Feature 4.3: Advanced Access Control

- Category-restricted evaluators
- Blinded scoring mode
- Time-limited access
- Delegation management

**Estimated Effort**: 49h (as per original roadmap)

---

## Feature 4.4: AI Recommendation Generation

### Use Case: UC13 - Generate executive recommendation report

**AI generates:**
- Recommended vendor with rationale
- Risk assessment per vendor
- Scenario-based recommendations
- Critical success factors

**Estimated Effort**: 18h

---

## v2.0 Release Summary

| Feature | Effort |
|---------|--------|
| Procurement Workflow | 55h |
| Multi-Evaluation Benchmarking | 56h |
| Advanced Access Control | 49h |
| AI Recommendation Generation | 18h |
| **Total v2.0** | **178h** |

---

# GAP ANALYSIS: COMPLETE STATUS

## Updated Gap Status Table

| Feature | CSP Need | Current State | Gap | Priority |
|---------|----------|---------------|-----|----------|
| **Requirements Management** | | | | |
| Requirement capture | Required | Built | None | - |
| AI categorization | Required | v1.2 planned | Minor | High |
| AI consolidation | Required | v1.2 planned | Minor | High |
| Requirement approval workflow | Required | Built | None | - |
| **Workshop Management** | | | | |
| Workshop scheduling | Required | Built | None | - |
| Live collaboration | Required | **v1.0.x planned** | **Major** | **Critical** |
| Real-time requirement entry | Required | **v1.0.x planned** | **Major** | **Critical** |
| Live voting/prioritization | Required | **v1.0.x planned** | **Major** | **Critical** |
| **RFP Management** | | | | |
| RFP templates | Required | v1.2 planned | Minor | High |
| Question-to-requirement linking | Required | Built | None | - |
| Vendor portal | Required | Built | None | - |
| **Vendor Response** | | | | |
| Response capture | Required | Built | None | - |
| AI response analysis | Required | v1.1 planned | Minor | High |
| **AI score suggestion** | Required | **v1.0.x planned** | Medium | High |
| Q&A forum | Required | **COMPLETE** | **None** | - |
| **Evaluation & Scoring** | | | | |
| Individual scoring | Required | Built | None | - |
| Consensus scoring | Required | Built | None | - |
| Score variance detection | Required | v1.1 planned | Minor | High |
| **Traceability** | | | | |
| Requirement-to-Criteria | Required | Built | None | - |
| **Traceability matrix view** | Required | **v1.0.x planned** | Medium | High |
| **Stakeholder Portals** | | | | |
| Vendor portal | Required | Built | None | - |
| **Client approval portal** | Required | **v1.0.x planned** | **Major** | **Critical** |
| **Project Management** | | | | |
| Project status tracking | Required | Built | None | - |
| **Risk tracking** | Required | **v1.0.x planned** | Major | Medium |
| **Reporting** | | | | |
| Score heatmap | Required | v1.1 planned | Minor | Medium |
| Vendor comparison | Required | v1.1 planned | Minor | Medium |
| Scenario comparison | Required | v1.2 planned | Minor | Medium |
| PDF generation | Required | v1.2 planned | Minor | High |
| **AI recommendation** | Required | v2.0 planned | Medium | High |

---

# COMPLETE ROADMAP SUMMARY

| Release | Focus | Effort | Cumulative | Target |
|---------|-------|--------|------------|--------|
| v1.0.x | CSP Critical Path | 148h | 148h | Jan 2026 |
| v1.1 | Quick Wins | 100h | 248h | Feb 2026 |
| v1.2 | Templates & Analytics | 182h | 430h | Mar-Apr 2026 |
| v1.3 | Collaboration | 109h | 539h | May 2026 |
| v2.0 | Platform Evolution | 178h | 717h | Aug 2026 |

**Total Estimated Effort**: 717 hours (~18 person-weeks)

---

# USE CASES REFERENCE

## Complete Use Case Map

### Phase 1: Requirements Collection
- **UC1**: Collect stakeholder requirements via workshop (Live collaboration)
- **UC2**: Distribute e-form for asynchronous requirement collection
- **UC3**: Consolidate duplicate/similar requirements using AI

### Phase 2: Vendor Assessment
- **UC4**: Create and customize RFP from template
- **UC5**: Track vendor response status and send reminders
- **UC6**: Evaluate vendor response with AI-powered guidance

### Phase 3: Evaluation & Decision
- **UC7**: Reconcile evaluator score variance through consensus discussion
- **UC8**: View traceability matrix (requirements → RFP → scores)
- **UC9**: Generate vendor comparison and recommendation report

### Phase 4: Stakeholder Collaboration
- **UC10**: Client stakeholders review and approve consolidated requirements
- **UC11**: Vendor portal post-submission access for Q&A [COMPLETE]

### Phase 5: Decision Support
- **UC12**: Compare vendor scenarios and analyze sensitivity
- **UC13**: Generate executive recommendation report

---

# USER JOURNEYS REFERENCE

| ID | Journey | Phase | Status |
|----|---------|-------|--------|
| UJ1.1 | Stakeholder Contributing Requirements via Workshop | 1 | v1.0.x |
| UJ1.2 | Stakeholder Submitting Requirements via E-Form | 1 | Built |
| UJ1.3 | Evaluator Consolidating Requirements | 1 | v1.2 |
| UJ2.1 | Evaluator Creating RFP from Template | 2 | v1.2 |
| UJ2.2 | Vendor Completing RFP Response | 2 | Built |
| UJ2.3 | Evaluator Reviewing Response with AI | 2 | v1.1 |
| UJ3.1 | Team Reconciling Score Variance | 3 | Built |
| UJ3.2 | Viewing Traceability Matrix | 3 | v1.0.x |
| UJ4.1 | Client Stakeholder Approval Portal | 4 | v1.0.x |
| UJ4.2 | Vendor Post-Submission Q&A | 4 | **COMPLETE** |
| UJ5.1 | Steering Committee Scenario Analysis | 5 | v1.2 |

---

# NEXT STEPS

## Immediate Actions (This Week)

1. **Apply database migration** for vendor_qa (if not done)
2. **Begin Feature 0.1**: Live Workshop Collaboration
   - Database migration for workshop tables
   - WorkshopCollaborationService
   - useLiveWorkshop hook

## Week 2

3. **Continue Feature 0.1**: Workshop UI components
4. **Begin Feature 0.2**: Client Approval Portal

## Week 3

5. **Complete Feature 0.2**: Client Portal testing
6. **Begin Feature 0.3**: AI Response Scoring

## Week 4

7. **Complete Features 0.3, 0.4**: AI Scoring + Traceability Matrix
8. **Begin Feature 0.5**: Risk Dashboard

---

*Document maintained by: Product Team*
*Last updated: 09 January 2026*
*Version: 2.0*
