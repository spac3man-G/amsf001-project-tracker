# Evaluator Product Roadmap

## Master Implementation Plan - Version 3.0

**Document Version**: 3.0 (Industry Best Practices Edition)
**Created**: 08 January 2026
**Updated**: 09 January 2026
**Status**: Active Development
**Project Context**: CSP Technology Procurement Exercise

---

## ⚠️ CRITICAL: APPLICATION SEGREGATION POLICY

### Tracker vs Evaluator: Architectural Boundaries

The **Tracker** and **Evaluator** applications share a codebase but serve fundamentally different purposes and MUST remain segregated to protect data integrity.

| Aspect | Tracker App | Evaluator App |
|--------|-------------|---------------|
| **Purpose** | Enterprise project portfolio management | IT vendor procurement & evaluation |
| **Data Status** | ✅ **LIVE PRODUCTION** - Customer data | 🔧 **Development** - No customer data |
| **Data Sensitivity** | HIGH - Protected customer data | LOWER - Internal procurement data |
| **Change Risk** | HIGH - Requires careful planning | LOWER - Can iterate freely |
| **User Base** | External customers, partners | Internal procurement teams |

### Segregation Principles

1. **Database Isolation**
   - Evaluator tables use `evaluation_` prefix
   - No foreign keys between Tracker and Evaluator entity tables
   - Shared references only to: `profiles`, `organisations` (read-only)
   - RLS policies are independent

2. **Service Layer Isolation**
   - Evaluator services in `src/services/evaluator/`
   - No imports from Tracker services into Evaluator
   - Shared utilities only from `src/lib/` (formatters, permissions)

3. **Context Isolation**
   - `EvaluationContext` is independent of `ProjectContext`
   - `EvaluationProvider` sits alongside (not inside) `ProjectProvider`
   - No cross-context dependencies

4. **Route Isolation**
   - Evaluator routes under `/evaluator/*`
   - Separate navigation structure
   - Distinct permission model

5. **API Isolation**
   - Evaluator APIs in `api/evaluator/`
   - Independent authentication for vendor/client portals
   - No shared API endpoints

### Integration Points (Carefully Controlled)

| Integration | Direction | Purpose | Implementation |
|-------------|-----------|---------|----------------|
| User Authentication | Shared | Single sign-on | Supabase Auth (read-only) |
| Organisation Context | Tracker → Evaluator | Org membership | Read `user_organisations` only |
| User Profiles | Shared | Display names, avatars | Read `profiles` only |

### When Making Changes

**✅ SAFE for Evaluator:**
- New tables with `evaluation_` prefix
- New services in `evaluator/` directory
- New API endpoints in `api/evaluator/`
- New components in `components/evaluator/`
- Modifications to Evaluator-only features

**⚠️ REQUIRES REVIEW:**
- Any changes to shared contexts (Auth, Organisation)
- Any changes to `src/lib/` utilities
- Any new database policies affecting Tracker tables
- Any modifications to App.jsx provider hierarchy

**❌ PROHIBITED:**
- Direct writes to Tracker tables from Evaluator code
- New foreign keys between Tracker and Evaluator tables
- Importing Tracker services into Evaluator
- Shared API endpoints serving both apps

---

## EXECUTIVE SUMMARY

This document consolidates the Evaluator module roadmap incorporating **industry best practices** from comprehensive research into procurement platforms (Coupa, SAP Ariba, Nvelop, Arphie) and AI-driven evaluation frameworks.

### What's New in v3.0

✅ **Stakeholder Engagement Framework** - Structured multi-phase stakeholder involvement
✅ **Multi-Stage Security Assessment** - Security checkpoints throughout procurement
✅ **Enhanced AI Gap Detection** - Automated scope gap identification
✅ **Anomaly Detection & Risk Flagging** - Statistical outlier detection
✅ **Financial Analysis Module** - True TCO calculations and sensitivity analysis
✅ **Vendor Intelligence Enrichment** - External vendor viability assessment (v1.1)
✅ **Procurement Workflow Tracking** - Post-evaluation workflow management

### Key Metrics

| Metric | v2.0 | v3.0 | Change |
|--------|------|------|--------|
| Total Effort | 717h | 811h | +94h (+13%) |
| Post-Selection Risk | Baseline | -50% | Significant reduction |
| Evaluation Cycle Time | 6-8 weeks | 3-4 weeks | 50% faster |
| Gap Detection Rate | ~70% | ~95% | 35% improvement |

---

## CURRENT STATE ASSESSMENT

| Category | Readiness | Gap Severity | Best Practice Alignment |
|----------|-----------|--------------|------------------------|
| Core Evaluation Framework | 85% ✅ | Minimal | ✅ Weighted scoring built |
| Requirements Management | 80% ✅ | Minor | ⚠️ Stakeholder framework needed |
| Workshop & Collaboration | 50% ⚠️ | **Major** | 🔴 Live collaboration critical gap |
| RFP & Vendor Management | 75% ✅ | Medium | ⚠️ AI validation needed |
| AI Integration | 65% ⚠️ | Medium | ⚠️ Response analysis + gap detection needed |
| Compliance & Security | 60% ⚠️ | **Major** | 🔴 Security questionnaire framework needed |
| Reporting & Analytics | 70% ✅ | Minor | ⚠️ Anomaly detection, audit trail needed |
| Stakeholder Portals | 70% ⚠️ | Medium | ⚠️ Client portal needed |
| Project Management | 40% ⚠️ | Major | 🔴 Risk tracking + workflow needed |
| Financial Analysis | 30% 🔴 | **Major** | 🔴 TCO, sensitivity analysis needed |
| Vendor Intelligence | 20% 🔴 | **Major** | 🔴 External risk assessment needed |
| **Overall** | **60%** | **Medium-High** | |

### What's Complete (as of 09 Jan 2026)

✅ **Vendor Q&A System** (Feature 1.4) - Complete
- `vendor_qa` table with RLS policies
- VendorQAService with full workflow
- Q&A period management (enable/disable, dates)
- Share answered Q&A with all vendors (anonymized)
- Full audit trail

---

## STRATEGIC THEMES

1. **CSP Project Enablement** - Features required for Jan-May 2026 procurement
2. **Procurement Excellence** - AI-powered analysis aligned with industry best practices
3. **Risk Mitigation** - Early detection and management of procurement risks
4. **Decision Confidence** - Transparent, documented, defensible vendor selection
5. **Institutional Learning** - Templates, historical data, lessons learned

---

## RELEASE SCHEDULE

| Release | Theme | Effort | Target | Status |
|---------|-------|--------|--------|--------|
| **v1.0.x** | CSP Critical Path + Best Practices | **208h** | Jan-Feb 2026 | **IN PROGRESS** |
| **v1.1** | Quick Wins + Vendor Intelligence | **124h** | Feb-Mar 2026 | Planned |
| **v1.2** | Templates & Analytics | **182h** | Mar-Apr 2026 | Planned |
| **v1.3** | Collaboration & Workflow | **119h** | May 2026 | Planned |
| **v2.0** | Platform Evolution | **178h** | Aug 2026 | Planned |

**Total**: 811 hours (~20 person-weeks)

---

# PHASE 0: CSP CRITICAL PATH (v1.0.x)

## Priority Matrix

| Feature | Effort | Status | Priority | Best Practice |
|---------|--------|--------|----------|---------------|
| ~~Vendor Q&A Forum~~ | ~~12h~~ | **COMPLETE** | ~~Critical~~ | ✅ Vendor communication |
| **Stakeholder Engagement Framework** | **8h** | Not Started | **Critical** | ✅ Structured engagement |
| **Multi-Stage Security Assessment** | **12h** | Not Started | **Critical** | ✅ Compliance checkpoints |
| Live Workshop Collaboration | 50h | Not Started | **Critical** | ✅ Stakeholder engagement |
| Client Approval Portal | 34h | Not Started | **Critical** | ✅ Stakeholder endorsement |
| AI Response Scoring | 18h | Not Started | High | ✅ Objective evaluation |
| **Enhanced AI Gap Detection** | **12h** | Not Started | High | ✅ Scope validation |
| Traceability Matrix | 24h | Not Started | High | ✅ Transparency + audit |
| **Anomaly Detection** | **6h** | Not Started | High | ✅ Outlier detection |
| Risk Dashboard | 22h | Not Started | Medium | ✅ Risk management |
| **Financial Analysis** | **10h** | Not Started | Medium | ✅ TCO calculation |
| **Workflow Tracking** | **20h** | Not Started | Medium | ✅ Post-evaluation |

**Total v1.0.x Effort**: 208h | **Timeline**: 4-5 weeks (2 developers)

---

## Feature 0.0: Stakeholder Engagement Framework [NEW - CRITICAL]

### Purpose
Establish structured multi-phase stakeholder engagement with phase gates, ensuring stakeholder endorsement at each milestone.

### Why This Matters (Research: SSEN Innovation, ISM)
- **45% faster evaluation cycles** - Clear decision-makers identified upfront
- **80% fewer post-selection disputes** - Everyone feels heard
- **Better decisions** - Comprehensive perspective gathering
- **Documented consensus** - Audit trail of stakeholder approval

### Use Case: UC0 - Establish stakeholder framework

**Actors:** Procurement lead, CSP partners, Finance, IT, Compliance leads
**Precondition:** Evaluation project created

**Flow:**
1. Procurement lead creates "Stakeholder Areas":
   - Finance (weight: 36%, threshold: 75%)
   - IT (weight: 30%, threshold: 75%)
   - Compliance (weight: 21%, threshold: 75%)
   - Operations (weight: 13%, threshold: 75%)
2. For each area, define primary and secondary stakeholders
3. System tracks participation metrics:
   - Requirements contributed
   - Workshop sessions attended
   - Approvals completed
4. Phase gates require stakeholder area approval:
   - **Requirements Approved** (≥75% per area)
   - **RFP Ready** (≥75% per area)
   - **Vendor Selected** (≥80% per area)

**Post-Condition:** Stakeholder framework documented, phase gates defined

### Technical Specification

#### Database Schema

```sql
-- Extend evaluation_projects with phase gates
ALTER TABLE evaluation_projects ADD COLUMN IF NOT EXISTS
  phase_gates JSONB DEFAULT jsonb_build_object(
    'requirements_approved', jsonb_build_object('enabled', true, 'threshold', 0.75),
    'rfp_ready', jsonb_build_object('enabled', true, 'threshold', 0.75),
    'vendor_selected', jsonb_build_object('enabled', true, 'threshold', 0.80)
  );

-- Extend stakeholder_areas with weightings
ALTER TABLE stakeholder_areas ADD COLUMN IF NOT EXISTS
  weight DECIMAL(3,2) DEFAULT 0.25;
ALTER TABLE stakeholder_areas ADD COLUMN IF NOT EXISTS
  approval_threshold DECIMAL(3,2) DEFAULT 0.75;
ALTER TABLE stakeholder_areas ADD COLUMN IF NOT EXISTS
  primary_contact_id UUID REFERENCES profiles(id);

-- Track stakeholder participation
CREATE TABLE stakeholder_participation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  stakeholder_area_id UUID NOT NULL REFERENCES stakeholder_areas(id),
  user_id UUID REFERENCES profiles(id),
  requirements_contributed INTEGER DEFAULT 0,
  workshop_sessions_attended INTEGER DEFAULT 0,
  approvals_completed INTEGER DEFAULT 0,
  participation_score DECIMAL(3,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase gate approvals
CREATE TABLE phase_gate_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  phase_gate VARCHAR(50) NOT NULL,
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id),
  approved BOOLEAN NOT NULL,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  rejection_reason TEXT,
  UNIQUE(evaluation_project_id, phase_gate, stakeholder_area_id)
);

-- RLS Policies
ALTER TABLE stakeholder_participation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_gate_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Evaluation team can manage participation metrics"
  ON stakeholder_participation_metrics FOR ALL
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));

CREATE POLICY "Evaluation team can manage phase approvals"
  ON phase_gate_approvals FOR ALL
  USING (evaluation_project_id IN (
    SELECT ep.id FROM evaluation_projects ep
    JOIN evaluation_project_users epu ON ep.id = epu.evaluation_project_id
    WHERE epu.user_id = auth.uid()
  ));
```

#### Service: StakeholderEngagementService

```javascript
// src/services/evaluator/stakeholderEngagement.service.js

class StakeholderEngagementService extends BaseEvaluatorService {
  constructor() {
    super('stakeholder_areas');
  }

  // Configure stakeholder area with weighting
  async configureStakeholderArea(areaId, config) { }

  // Track participation
  async recordParticipation(evaluationProjectId, userId, type) { }

  // Get participation metrics
  async getParticipationMetrics(evaluationProjectId) { }

  // Submit phase gate approval
  async submitPhaseApproval(evaluationProjectId, phase, stakeholderAreaId, approved, reason) { }

  // Check if phase gate is passed
  async checkPhaseGate(evaluationProjectId, phase) { }

  // Get overall approval status
  async getApprovalStatus(evaluationProjectId) { }
}
```

### Implementation Tasks

| Task | Estimate |
|------|----------|
| Database schema updates | 2h |
| StakeholderEngagementService | 3h |
| Phase gate logic | 2h |
| Stakeholder participation dashboard | 1h |
| **Total** | **8h** |

---

## Feature 0.1: Multi-Stage Security Assessment [NEW - CRITICAL]

### Purpose
Implement security checkpoints throughout procurement - not as a final hurdle but integrated from RFP through POC.

### Why This Matters (Research: Sprinto, AuditBoard)
- **30-40% fewer implementation delays** - Catch security issues early
- **Prevents costly retrofitting** - Vendors can address gaps during process
- **Better vendor selection** - Security-critical requirements clearly validated
- **Clear audit trail** - Documented security due diligence

### Security Assessment Stages

#### Stage 1: Initial RFP Security (Sent with RFP)
- Technical controls, organizational measures, incident response
- Response time: 2 weeks
- Questions: Encryption standards, SOC 2/ISO 27001, incident response SLA

#### Stage 2: Shortlist Technical Review (8h per vendor)
- For shortlisted vendors (2-3)
- Evaluators: Security architect + compliance officer
- Architecture review, penetration test reports, compliance audit

#### Stage 3: Proof-of-Concept Validation (2 weeks)
- Final vendor before contract signature
- Sandbox testing, integration security, data handling verification

### Technical Specification

#### Database Schema

```sql
CREATE TABLE security_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  stage VARCHAR(50) NOT NULL, -- 'initial_rfp', 'technical_review', 'poc'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  send_with_rfp BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE security_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  questionnaire_id UUID REFERENCES security_questionnaires(id),
  stage VARCHAR(50) NOT NULL,

  -- Assessment results
  score DECIMAL(3,1), -- 0-10 scale
  risk_level VARCHAR(20), -- low, medium, high, critical
  findings JSONB,

  assessed_by UUID REFERENCES profiles(id),
  assessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES security_assessments(id) ON DELETE CASCADE,
  finding_text TEXT NOT NULL,
  severity VARCHAR(20), -- low, medium, high, critical
  remediation_plan TEXT,
  remediation_owner VARCHAR(255),
  remediation_due_date DATE,
  status VARCHAR(20) DEFAULT 'open' -- open, in_progress, resolved, accepted
);

-- RLS Policies
ALTER TABLE security_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_findings ENABLE ROW LEVEL SECURITY;
```

#### Service: SecurityAssessmentService

```javascript
// src/services/evaluator/securityAssessment.service.js

class SecurityAssessmentService extends BaseEvaluatorService {
  constructor() {
    super('security_assessments');
  }

  // Create questionnaire for stage
  async createQuestionnaire(evaluationProjectId, stage, questions) { }

  // Get questionnaire template
  async getTemplateByStage(stage) { }

  // Submit assessment
  async submitAssessment(assessmentData) { }

  // Add finding
  async addFinding(assessmentId, finding) { }

  // Update finding status
  async updateFindingStatus(findingId, status, notes) { }

  // Get vendor security summary
  async getVendorSecuritySummary(evaluationProjectId, vendorId) { }

  // Get overall security status
  async getSecurityStatus(evaluationProjectId) { }
}
```

### Implementation Tasks

| Task | Estimate |
|------|----------|
| Database schema | 2h |
| Security questionnaire templates (3 stages) | 4h |
| SecurityAssessmentService | 3h |
| Finding management and tracking | 2h |
| Security assessment UI components | 1h |
| **Total** | **12h** |

---

## Feature 0.2: Enhanced AI Gap Detection [ENHANCED - 12h]

### What Changed from v2.0
- **Before**: Basic AI response analysis (summary, key points)
- **Now**: Automated scope gap identification with specific remediation

### Scope Gap Detection Capabilities

When evaluator opens vendor response, system automatically:

1. **Validates completeness** - Checks all required sections answered
2. **Identifies missing scope** - "Vendor did not address Lines 45-50 (Database Migration)"
3. **Flags ambiguous responses** - "Response uses 'may' instead of 'will' - unclear commitment"
4. **Checks for exclusions** - "Vendor excluded 'implementation support' from pricing"
5. **Highlights risk areas** - "No mention of AEOI automation (CSP critical requirement)"

### Technical Specification

#### API Enhancement

```javascript
// api/evaluator/ai-validate-vendor-response.js

export default async function handler(req, res) {
  const {
    vendorId,
    responseText,
    evaluationProjectId,
    requiredRequirements,
    scoringRubric
  } = req.body;

  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: `You are a procurement compliance analyst. Identify gaps, ambiguities, and missing scope in vendor responses.`,
    messages: [{
      role: 'user',
      content: buildGapAnalysisPrompt({
        responseText,
        requiredRequirements,
        scoringRubric
      })
    }],
    tools: [gapDetectionTool]
  });

  return res.json({
    scopeGaps: analysis.gaps,
    ambiguities: analysis.ambiguities,
    exclusions: analysis.exclusions,
    riskFlags: analysis.riskFlags,
    completenessScore: analysis.completeness
  });
}
```

#### Database Schema

```sql
CREATE TABLE vendor_response_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  vendor_response_id UUID REFERENCES vendor_responses(id),

  gap_type VARCHAR(50), -- 'scope', 'ambiguity', 'exclusion', 'risk'
  requirement_id UUID REFERENCES requirements(id),

  gap_description TEXT NOT NULL,
  vendor_statement TEXT, -- What vendor actually said
  expected_statement TEXT, -- What was expected

  severity VARCHAR(20), -- low, medium, high, critical
  recommended_action TEXT,

  resolved BOOLEAN DEFAULT false,
  resolution_note TEXT,
  resolved_at TIMESTAMPTZ,

  detected_at TIMESTAMPTZ DEFAULT NOW(),
  detected_by VARCHAR(20) DEFAULT 'ai' -- 'ai', 'manual'
);

ALTER TABLE vendor_response_gaps ENABLE ROW LEVEL SECURITY;
```

### Implementation Tasks

| Task | Estimate |
|------|----------|
| Database schema for gap tracking | 1h |
| Enhanced AI gap detection endpoint | 3h |
| Gap analysis tool definition | 1h |
| UI to display gaps + resolutions | 2h |
| Force-completion logic (can't score until gaps resolved) | 2h |
| Testing and prompt refinement | 3h |
| **Total** | **12h** |

---

## Feature 0.3: Anomaly Detection & Risk Flagging [NEW - 6h]

### Purpose
Automatically flag statistical outliers in bids and responses that might indicate errors, risk, or missing scope.

### Why This Matters (Research: Datagrid, Ivalua)
- Catches **75% of red flags** humans miss
- Price outliers (vendor 30% cheaper) often indicate scope gaps
- Schedule outliers (vendor 50% faster) indicate unrealistic timelines
- Compliance outliers (missing certifications) indicate missing scope

### Anomaly Types

| Type | Example | Risk Level | Action |
|------|---------|------------|--------|
| **Price** | Vistra £450k vs others £515k (13% gap) | Medium | Request detailed SOW |
| **Schedule** | Vistra 3 months vs others 5-6 months | High | Request detailed plan |
| **Compliance** | Vistra missing SOC 2 | Medium | Ask certification timeline |
| **Feature** | Vistra AEOI as "roadmap" vs others built-in | High | Flag as critical gap |

### Technical Specification

```sql
CREATE TABLE vendor_response_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),

  anomaly_type VARCHAR(50), -- 'price', 'schedule', 'compliance', 'scope', 'feature'
  severity VARCHAR(20), -- 'info', 'warning', 'critical'

  description TEXT NOT NULL,
  detected_value TEXT,
  typical_range TEXT,
  deviation_percentage DECIMAL(5,2),

  recommended_action TEXT,

  resolved BOOLEAN DEFAULT false,
  resolution_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vendor_response_anomalies ENABLE ROW LEVEL SECURITY;
```

### Implementation Tasks

| Task | Estimate |
|------|----------|
| AnomalyDetectionService (pricing, schedule, compliance) | 3h |
| Database schema | 1h |
| Anomaly flag UI + dismissal logic | 2h |
| **Total** | **6h** |

---

## Feature 0.4: Financial Analysis Module [NEW - 10h]

### Purpose
Calculate true Total Cost of Ownership (TCO) and enable scenario-based financial comparison.

### Why This Matters (Research: ISM, CollegeBuys)
- Purchase price is only **20-30% of total cost**
- TCO analysis **changes vendor selection in 45% of cases**
- Hidden costs (implementation, support, training) often exceed contract price

### TCO Components

```json
{
  "vendor_id": "vendor-csc",
  "tco_analysis": {
    "year_1": {
      "license_cost": 180000,
      "implementation": 120000,
      "data_migration": 50000,
      "training": 30000,
      "support": 45000,
      "contingency_10pct": 42500,
      "total_year_1": 467500
    },
    "year_2": {
      "license_cost": 180000,
      "support": 45000,
      "maintenance": 15000,
      "total_year_2": 240000
    },
    "year_3": {
      "license_cost": 180000,
      "support": 45000,
      "maintenance": 20000,
      "total_year_3": 245000
    },
    "three_year_tco": 952500,
    "cost_per_user_per_month": 8750
  }
}
```

### Sensitivity Analysis

User can model "what if" scenarios:
- "If implementation runs 20% over budget..."
- "If license cost increases 5% annually..."
- "If adoption is only 60% of target..."

### Implementation Tasks

| Task | Estimate |
|------|----------|
| TCO data model and calculation service | 4h |
| Financial analysis component | 3h |
| Sensitivity analysis engine | 2h |
| Financial comparison visualization | 1h |
| **Total** | **10h** |

---

## Feature 0.5: Live Workshop Collaboration [CRITICAL - 50h]

### Purpose
Enable real-time requirement capture during stakeholder workshops.

### User Journey: UJ1.1 - Stakeholder Contributing Requirements

**Actor:** CSP manager, Finance team member, Compliance officer
**Trigger:** Workshop date arrival

**Journey Steps:**
1. User receives workshop invite (email with calendar integration)
2. User joins live collaboration session
3. **Requirements entry mode:**
   - User clicks "Add Requirement"
   - Types requirement title and description
   - System provides real-time AI category suggestions
   - User rates priority (MoSCoW)
   - Requirement appears instantly with "new" indicator
4. User votes on other requirements (thumbs up, priority dots)
5. AI consolidation flags duplicates in real-time
6. Facilitator guides consolidation discussion
7. Post-workshop: System sends follow-up survey

### Technical Specification

#### Database Schema

```sql
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
  status VARCHAR(20) DEFAULT 'draft',
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

-- RLS Policies
ALTER TABLE workshop_live_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_live_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_phases ENABLE ROW LEVEL SECURITY;
```

#### Hook: useLiveWorkshop

```javascript
// src/hooks/useLiveWorkshop.js

export function useLiveWorkshop(workshopId) {
  const [liveRequirements, setLiveRequirements] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [votes, setVotes] = useState({});
  const [currentPhase, setCurrentPhase] = useState('entry');

  useEffect(() => {
    // Subscribe to Supabase Realtime for requirements
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

    return () => {
      reqChannel.unsubscribe();
      presenceChannel.unsubscribe();
    };
  }, [workshopId]);

  return {
    liveRequirements,
    activeUsers,
    votes,
    currentPhase,
    addRequirement,
    castVote,
    setPhase
  };
}
```

### Implementation Tasks

| Task | Estimate |
|------|----------|
| Database migration | 3h |
| WorkshopCollaborationService | 6h |
| useLiveWorkshop hook with Supabase Realtime | 6h |
| LiveWorkshop page | 6h |
| LiveRequirementEntry component | 3h |
| LiveRequirementList + Card components | 4h |
| LiveVotingPanel component | 3h |
| WorkshopPhaseControl component | 3h |
| ActiveUsersIndicator component | 2h |
| AI category suggestion endpoint | 3h |
| DuplicateDetectionAlert + AI endpoint | 4h |
| Finalize to requirements logic | 3h |
| Testing and polish | 4h |
| **Total** | **50h** |

---

## Feature 0.6: Client Approval Portal [CRITICAL - 34h]

### Purpose
Separate portal for client stakeholders to review and approve consolidated requirements before RFP.

### User Journey: UJ4.1 - Client Stakeholder Approval

**Actor:** Carey Olsen partner, Finance director
**Trigger:** Email: "Please review and approve CSP requirements"

**Journey Steps:**
1. User clicks portal link (unique token-authenticated)
2. Portal loads with client branding
3. User sees "Requirements for Approval" dashboard:
   - 55 requirements by category
   - Status indicators (approved, pending, revision requested)
4. User can filter by category, priority, or stakeholder area
5. For each requirement:
   - View title, description, category, priority
   - See stakeholders who contributed
   - Add comments
   - Approve or flag for revision
6. User views overall progress: "42 of 55 approved (76%)"
7. User submits final approval with signature
8. System notifies: "Finance team has approved requirements"

### Technical Specification

#### Database Schema

```sql
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

ALTER TABLE requirement_approvals ADD COLUMN IF NOT EXISTS
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id);
ALTER TABLE requirement_approvals ADD COLUMN IF NOT EXISTS
  approval_note TEXT;
ALTER TABLE requirement_approvals ADD COLUMN IF NOT EXISTS
  revision_requested BOOLEAN DEFAULT false;

CREATE TABLE stakeholder_area_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  stakeholder_area_id UUID NOT NULL REFERENCES stakeholder_areas(id),
  approved_by_name VARCHAR(255),
  approved_at TIMESTAMPTZ,
  approval_signature TEXT,
  total_requirements INTEGER,
  approved_count INTEGER,
  revision_requested_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_portal_token ON client_portal_access_tokens(access_token);

ALTER TABLE client_portal_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_area_approvals ENABLE ROW LEVEL SECURITY;
```

### Implementation Tasks

| Task | Estimate |
|------|----------|
| Database migration | 2h |
| ClientPortalService | 5h |
| Token validation API endpoint | 2h |
| ClientPortal page | 4h |
| RequirementsApprovalList component | 3h |
| RequirementApprovalCard component | 2h |
| ApprovalProgressBar component | 2h |
| StakeholderAreaProgress component | 2h |
| ApprovalCommentForm component | 2h |
| RevisionRequestModal component | 2h |
| FinalApprovalModal component | 2h |
| Email invitation integration | 3h |
| Testing and polish | 3h |
| **Total** | **34h** |

---

## Feature 0.7: AI Response Scoring [HIGH - 18h]

### Purpose
Extend AI response analysis to include score suggestions for consistent evaluation.

### User Journey: UJ2.3 - Evaluator with AI Analysis

**Actor:** Technical evaluator
**Trigger:** Evaluator opens vendor response

**Journey Steps:**
1. Evaluator opens vendor response view
2. For each question response, evaluator sees:
   - **Response text** (vendor's answer)
   - **Supporting documents**
   - **AI Analysis Panel**:
     - Summary (2-3 sentences)
     - Key Points (bullet extraction)
     - Compliance Gaps
     - Strengths
     - **Suggested Score** (0-5 with rationale) [NEW]
     - **Confidence Level** (low/medium/high) [NEW]
3. Evaluator can accept, modify, or override AI suggestion
4. System tracks AI acceptance rate for analysis

### Technical Specification

```sql
ALTER TABLE scores ADD COLUMN IF NOT EXISTS ai_suggested_score DECIMAL(3,1);
ALTER TABLE scores ADD COLUMN IF NOT EXISTS ai_suggestion_accepted BOOLEAN;
ALTER TABLE scores ADD COLUMN IF NOT EXISTS ai_analysis_id UUID;

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

ALTER TABLE vendor_response_ai_analysis ENABLE ROW LEVEL SECURITY;
```

### Implementation Tasks

| Task | Estimate |
|------|----------|
| Enhance ai-analyze-response endpoint | 4h |
| Database migration | 1h |
| Update tool definition with scoring | 2h |
| ResponseAnalysisPanel scoring display | 3h |
| Score suggestion acceptance UI | 2h |
| AI suggestion tracking in scores | 2h |
| Testing and prompt refinement | 4h |
| **Total** | **18h** |

---

## Feature 0.8: Enhanced Traceability Matrix [HIGH - 24h]

### Purpose
Interactive matrix showing Requirements × Vendors × Scores with drill-down.

### User Journey: UJ3.2 - Viewing Traceability Matrix

**Actor:** CSP consultant, Steering committee
**Trigger:** Navigate to "Traceability View"

**Journey Steps:**
1. System displays interactive matrix:
   - **Rows:** 55 requirements (grouped by category)
   - **Columns:** 4 vendors
   - **Cells:** Colored by score (5=green, 1=red)
2. User can filter by category, priority, or sort by vendor
3. User clicks cell to see:
   - Original requirement
   - RFP question asked
   - Vendor response text
   - Evidence/documents
   - Individual + consensus scores
   - Score rationale
4. System highlights insights:
   - "Vistra scores highest on real-time reporting (avg 4.6)"
   - "All vendors have gap on AEOI automation (avg 3.1)"
5. User can export to spreadsheet or PDF

### Implementation Tasks

| Task | Estimate |
|------|----------|
| TraceabilityService implementation | 4h |
| Matrix data query optimization | 2h |
| TraceabilityMatrix component | 5h |
| CellDetailPanel component | 3h |
| Matrix filters and sorting | 2h |
| Insights generation (AI) | 3h |
| Export functionality | 3h |
| Testing and polish | 2h |
| **Total** | **24h** |

---

## Feature 0.9: Risk Dashboard [MEDIUM - 22h]

### Purpose
Track procurement project risks including integration, vendor viability, and implementation risks.

### Technical Specification

```sql
CREATE TABLE procurement_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  risk_title VARCHAR(255) NOT NULL,
  risk_description TEXT,
  risk_category VARCHAR(50), -- integration, vendor_viability, implementation, commercial, technical

  probability VARCHAR(20), -- low, medium, high
  impact VARCHAR(20), -- low, medium, high
  risk_score INTEGER GENERATED ALWAYS AS (
    CASE probability WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END *
    CASE impact WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END
  ) STORED,

  mitigation_plan TEXT,
  mitigation_owner UUID REFERENCES profiles(id),
  mitigation_status VARCHAR(50) DEFAULT 'identified',
  mitigation_due_date DATE,

  vendor_id UUID REFERENCES vendors(id),

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
  status VARCHAR(50) DEFAULT 'open',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE procurement_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_issues ENABLE ROW LEVEL SECURITY;
```

### Implementation Tasks

| Task | Estimate |
|------|----------|
| Database migration | 2h |
| RisksService implementation | 4h |
| RiskDashboard component | 4h |
| RiskCard component | 2h |
| RiskForm (create/edit) | 3h |
| Risk matrix visualization | 3h |
| Issues list component | 2h |
| Testing and polish | 2h |
| **Total** | **22h** |

---

## Feature 0.10: Procurement Workflow Tracking [NEW - 20h]

### Purpose
Track post-evaluation workflow from vendor selection through contract award and onboarding.

### Workflow Stages

```
Evaluation Complete
    ↓
Contract Negotiation (14 days target)
    - Commercial terms finalized
    - Security addendum signed
    - SLA agreement
    ↓
Reference & Background Checks (10 days target)
    - Customer reference calls (3-5)
    - Financial stability confirmation
    - Compliance verification
    ↓
Legal Review (7 days target)
    - Contract legal review
    - Regulatory approval
    - Sign-off
    ↓
Contract Signed
    ↓
Onboarding Kickoff
    - Implementation planning
    - Success metrics agreement
    - Governance structure
```

### Technical Specification

```sql
CREATE TABLE procurement_workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),

  stage_name VARCHAR(100) NOT NULL,
  stage_order INTEGER NOT NULL,
  target_days INTEGER,

  status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, blocked, completed
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  blocked_reason TEXT,

  owner_id UUID REFERENCES profiles(id),
  owner_name VARCHAR(255),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES procurement_workflow_stages(id) ON DELETE CASCADE,

  milestone_name VARCHAR(255) NOT NULL,
  description TEXT,

  status VARCHAR(30) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE procurement_workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_milestones ENABLE ROW LEVEL SECURITY;
```

### Implementation Tasks

| Task | Estimate |
|------|----------|
| Database schema | 2h |
| ProcurementWorkflowService | 4h |
| WorkflowTimeline component | 5h |
| MilestoneCard component | 3h |
| StatusAlert + notifications | 3h |
| Workflow templates | 2h |
| Testing | 1h |
| **Total** | **20h** |

---

## v1.0.x Phase Summary

| Feature | Effort | Status | Priority |
|---------|--------|--------|----------|
| ~~Vendor Q&A Forum~~ | ~~12h~~ | **COMPLETE** | ~~Critical~~ |
| Stakeholder Engagement Framework | 8h | Not Started | Critical |
| Multi-Stage Security Assessment | 12h | Not Started | Critical |
| Live Workshop Collaboration | 50h | Not Started | Critical |
| Client Approval Portal | 34h | Not Started | Critical |
| AI Response Scoring | 18h | Not Started | High |
| Enhanced AI Gap Detection | 12h | Not Started | High |
| Traceability Matrix | 24h | Not Started | High |
| Anomaly Detection | 6h | Not Started | High |
| Risk Dashboard | 22h | Not Started | Medium |
| Financial Analysis | 10h | Not Started | Medium |
| Workflow Tracking | 20h | Not Started | Medium |
| **Total v1.0.x** | **208h** | | |

**Timeline**: 4-5 weeks with 2 developers (Front + Back)

---

# PHASE 1: QUICK WINS + VENDOR INTELLIGENCE (v1.1)

## Feature 1.1: Smart Notifications (36h)

### Notification Types

| Type | Trigger | Recipients | Timing |
|------|---------|------------|--------|
| `requirement_approval_needed` | Requirement submitted | Client stakeholders | Immediate |
| `requirement_approved` | Client approves | Evaluation team | Immediate |
| `workshop_reminder` | Upcoming workshop | Attendees | 24h, 1h before |
| `qa_question_submitted` | Vendor asks question | Evaluation team | Immediate |
| `qa_answer_published` | Question answered | Asking vendor | Immediate |
| `security_review_due` | Security milestone | Security team | 3 days before |
| `anomaly_detected` | Anomaly flagged | Evaluation lead | Immediate |
| `phase_gate_ready` | Gate threshold met | Stakeholder leads | Immediate |

---

## Feature 1.2: AI-Powered Response Analysis (28h)

Enhanced with:
- Score suggestions (from v1.0.x)
- Cross-vendor comparison
- Analysis caching for reuse

---

## Feature 1.3: Dashboard Analytics Widgets (36h)

Additional widgets:
- Stakeholder participation by area
- Q&A activity metrics
- Client approval progress
- Anomaly detection summary
- Security assessment status

---

## Feature 1.4: Vendor Q&A Management [COMPLETE]

**Status**: Implemented and pushed 09 January 2026

---

## Feature 1.5: Vendor Intelligence Enrichment [NEW - 24h]

### Purpose
Integrate external vendor data for viability assessment.

### Data Sources

1. **Financial Health** (Crunchbase, D&B)
   - Revenue growth, funding, profitability
2. **Compliance Risk** (Thomson Reuters)
   - Regulatory actions, litigation, sanctions screening
3. **Product Reviews** (G2, Capterra, Gartner)
   - Customer ratings, feature comparisons
4. **Market Reputation** (NewsAPI)
   - Recent news, announcements, concerns

### Implementation Tasks

| Task | Estimate |
|------|----------|
| Financial data integration | 6h |
| Compliance data integration | 4h |
| Product review aggregation | 4h |
| News and market intelligence | 4h |
| UI components and caching | 6h |
| **Total** | **24h** |

---

## v1.1 Release Summary

| Feature | Effort |
|---------|--------|
| Smart Notifications | 36h |
| AI Response Analysis | 28h |
| Dashboard Analytics | 36h |
| Vendor Intelligence | 24h |
| **Total v1.1** | **124h** |

---

# PHASE 2: TEMPLATES & ANALYTICS (v1.2)

## Feature 2.1: Evaluation Templates (43h)

### CSP-Specific Template

```json
{
  "name": "CSP Entity Management Evaluation",
  "domain": "Entity Management",
  "stakeholder_framework": {
    "areas": [
      { "name": "Finance", "weight": 0.36 },
      { "name": "IT", "weight": 0.30 },
      { "name": "Compliance", "weight": 0.21 },
      { "name": "Operations", "weight": 0.13 }
    ],
    "approval_threshold": 0.75
  },
  "categories": [
    { "name": "Functional Requirements", "weight": 36 },
    { "name": "Integration Requirements", "weight": 30 },
    { "name": "Technical Architecture", "weight": 12 },
    { "name": "Compliance Automation", "weight": 9 },
    { "name": "Vendor Viability", "weight": 6 },
    { "name": "Commercial Terms", "weight": 7 }
  ],
  "security_stages": [
    { "stage": "initial_rfp", "enabled": true },
    { "stage": "technical_review", "enabled": true },
    { "stage": "poc_validation", "enabled": true }
  ]
}
```

---

## Feature 2.2: AI Requirement Consolidation (42h)

### User Journey: UJ1.3 - Consolidating Requirements

**Flow:**
1. System displays all raw requirements
2. User clicks "Run AI Consolidation"
3. AI analyzes for semantic similarity, conflicts, categorization
4. AI report displays:
   - Duplicate groups
   - Conflicts between stakeholder groups
   - Auto-grouping suggestions
5. User reviews and manually adjusts
6. System generates consolidation report with audit trail

---

## Feature 2.3: Scenario Comparison Tool (49h)

### CSP Use Case

- **Baseline**: Current weightings (Integration 30%, Functional 36%)
- **Scenario 2**: Integration-First (increase integration to 50%)
- **Scenario 3**: Cost-Conscious (increase cost weight to 20%)

System recalculates rankings and shows which scenarios change the recommendation.

---

## Feature 2.4: Advanced Reporting with AI Narrative (48h)

### Executive Summary Generation

AI generates narrative including:
- Recommended vendor with rationale
- Key differentiators per vendor
- Risk assessment and mitigation plans
- Financial summary (3-year TCO, ROI)
- Scenario analysis summary
- Critical success factors

---

## v1.2 Release Summary

| Feature | Effort |
|---------|--------|
| Evaluation Templates | 43h |
| AI Requirement Consolidation | 42h |
| Scenario Comparison | 49h |
| Advanced Reporting | 48h |
| **Total v1.2** | **182h** |

---

# PHASE 3: COLLABORATION & WORKFLOW (v1.3)

## Feature 3.1: Real-Time Multi-User Editing (56h)

Beyond workshops - enable live collaboration on:
- Requirements editing
- Scoring sessions
- Report collaboration

Uses Supabase Realtime for presence and conflict resolution.

---

## Feature 3.2: Vendor Portal Enhancements (33h)

CSP-Specific:
- Real-time validation
- Progress indicator with badges
- Compliance checklist sidebar
- Document preview before upload
- Auto-save with version history

---

## Feature 3.3: Procurement Workflow Extension (20h)

Enhanced workflow tracking post-v1.0.x:
- Integration with contract management
- Success metrics tracking
- Governance structure setup
- Post-implementation review scheduling

---

## Feature 3.4: Financial Analysis Expansion (10h)

- Integration with scenario comparison
- Impact of delay/cost overrun on ROI
- "What if we negotiate 10% discount" modeling
- Multi-year cash flow projection

---

## v1.3 Release Summary

| Feature | Effort |
|---------|--------|
| Real-Time Multi-User Editing | 56h |
| Vendor Portal Enhancements | 33h |
| Procurement Workflow Extension | 20h |
| Financial Analysis Expansion | 10h |
| **Total v1.3** | **119h** |

---

# PHASE 4: PLATFORM EVOLUTION (v2.0)

## Feature 4.1: Procurement Workflow Extensions (55h)

- Contract negotiation progress tracking
- Commercial terms checklist
- Implementation planning integration
- Success metrics tracking post-award

---

## Feature 4.2: Multi-Evaluation Benchmarking (56h)

- Vendor performance across evaluations
- Category benchmarks vs org averages
- Best practices library
- Historical trends

---

## Feature 4.3: Advanced Access Control (49h)

- Category-restricted evaluators
- Blinded scoring mode
- Time-limited access
- Delegation management

---

## Feature 4.4: AI Recommendation Engine (18h)

AI generates:
1. Primary recommendation with confidence level
2. Alternative options for different scenarios
3. Risk mitigation per vendor
4. Probability of success based on references

---

## v2.0 Release Summary

| Feature | Effort |
|---------|--------|
| Procurement Workflow Extensions | 55h |
| Multi-Evaluation Benchmarking | 56h |
| Advanced Access Control | 49h |
| AI Recommendation Engine | 18h |
| **Total v2.0** | **178h** |

---

# BUSINESS IMPACT SUMMARY

## Risk Reduction

| Risk | v2.0 Mitigation | v3.0 Enhancement | Reduction |
|------|-----------------|------------------|-----------|
| Scope gaps → change orders | Manual review (70%) | AI gap detection (95%) | **60%** |
| Vendor viability issues | Basic Q&A (50%) | Vendor intelligence (80%) | **50%** |
| Security gaps discovered late | Post-selection (60%) | 3-stage assessment (90%) | **70%** |
| Stakeholder dissatisfaction | Ad-hoc engagement (40%) | Structured framework (90%) | **80%** |
| Financial surprises (TCO) | Rough estimates (45%) | Full TCO analysis (85%) | **55%** |
| Evaluation bias | Manual scoring (60%) | AI suggestions + anomaly (85%) | **45%** |

## Time Savings

| Activity | v2.0 | v3.0 | Savings |
|----------|------|------|---------|
| Evaluation cycle | 6-8 weeks | 3-4 weeks | **50%** |
| Per-vendor review | 4-6 hours | 2-3 hours | **50%** |
| Gap analysis per vendor | 2-3 days | 2-3 hours | **95%** |
| Financial analysis | 1-2 weeks | 2 hours | **98%** |
| Vendor intelligence | 1-2 weeks | 2 hours | **95%** |

## Cost Impact

| Item | Investment | Payoff |
|------|------------|--------|
| Development | £44-55k (2 devs, 4-5 weeks) | ROI positive in first project |
| Per-evaluation savings | — | £2,250-3,750 staff cost |
| Risk avoidance | — | £20-50k per project |
| Better vendor selection | — | £50k+ value per project |

---

# GAP ANALYSIS: COMPLETE STATUS

| Feature | CSP Need | Current State | Gap | Priority |
|---------|----------|---------------|-----|----------|
| **Requirements Management** | | | | |
| Requirement capture | Required | Built | None | - |
| AI categorization | Required | v1.2 planned | Minor | High |
| AI consolidation | Required | v1.2 planned | Minor | High |
| **Stakeholder Framework** | Required | **v1.0.x planned** | **Major** | **Critical** |
| **Workshop Management** | | | | |
| Workshop scheduling | Required | Built | None | - |
| **Live collaboration** | Required | **v1.0.x planned** | **Major** | **Critical** |
| **RFP Management** | | | | |
| RFP templates | Required | v1.2 planned | Minor | High |
| Q&A forum | Required | **COMPLETE** | **None** | - |
| **Security Assessment** | Required | **v1.0.x planned** | **Major** | **Critical** |
| **Evaluation & Scoring** | | | | |
| Individual scoring | Required | Built | None | - |
| Consensus scoring | Required | Built | None | - |
| **AI score suggestion** | Required | **v1.0.x planned** | Medium | High |
| **AI gap detection** | Required | **v1.0.x planned** | Medium | High |
| **Anomaly detection** | Required | **v1.0.x planned** | Medium | High |
| **Stakeholder Portals** | | | | |
| Vendor portal | Required | Built | None | - |
| **Client approval portal** | Required | **v1.0.x planned** | **Major** | **Critical** |
| **Project Management** | | | | |
| Status tracking | Required | Built | None | - |
| **Risk tracking** | Required | **v1.0.x planned** | Major | Medium |
| **Workflow tracking** | Required | **v1.0.x planned** | Medium | Medium |
| **Financial Analysis** | | | | |
| **TCO calculation** | Required | **v1.0.x planned** | **Major** | Medium |
| **Vendor Intelligence** | Required | v1.1 planned | Medium | Medium |

---

# COMPLETE ROADMAP SUMMARY

| Release | Focus | Effort | Cumulative | Target |
|---------|-------|--------|------------|--------|
| **v1.0.x** | **CSP Critical Path + Best Practices** | **208h** | 208h | Jan-Feb 2026 |
| v1.1 | Quick Wins + Vendor Intelligence | 124h | 332h | Feb-Mar 2026 |
| v1.2 | Templates & Analytics | 182h | 514h | Mar-Apr 2026 |
| v1.3 | Collaboration & Workflow | 119h | 633h | May 2026 |
| v2.0 | Platform Evolution | 178h | 811h | Aug 2026 |

**Total Estimated Effort**: 811 hours (~20 person-weeks)
**Team Structure**: 2 developers (Frontend + Backend) working in parallel

---

# USE CASES REFERENCE

## Complete Use Case Map

### Phase 1: Requirements Collection
- **UC0**: Establish stakeholder framework [NEW]
- **UC1**: Collect stakeholder requirements via workshop
- **UC2**: Distribute e-form for asynchronous collection
- **UC3**: Consolidate duplicate/similar requirements using AI

### Phase 2: Vendor Assessment
- **UC4**: Create and customize RFP from template
- **UC5**: Track vendor response status and send reminders
- **UC6**: Evaluate vendor response with AI-powered guidance
- **UC6a**: Conduct multi-stage security assessment [NEW]

### Phase 3: Evaluation & Decision
- **UC7**: Reconcile evaluator score variance through consensus
- **UC8**: View traceability matrix (requirements → RFP → scores)
- **UC8a**: Review anomaly detection alerts [NEW]
- **UC9**: Generate vendor comparison and recommendation report

### Phase 4: Stakeholder Collaboration
- **UC10**: Client stakeholders review and approve requirements
- **UC11**: Vendor portal post-submission access for Q&A [COMPLETE]
- **UC10a**: Submit phase gate approvals [NEW]

### Phase 5: Decision Support
- **UC12**: Compare vendor scenarios and analyze sensitivity
- **UC12a**: Conduct TCO analysis and comparison [NEW]
- **UC13**: Generate executive recommendation report

### Phase 6: Post-Selection [NEW]
- **UC14**: Track procurement workflow to contract
- **UC15**: Manage contract negotiation milestones

---

# USER JOURNEYS REFERENCE

| ID | Journey | Phase | Status |
|----|---------|-------|--------|
| UJ0.1 | Configuring Stakeholder Framework | 0 | v1.0.x |
| UJ0.2 | Conducting Security Assessment | 0 | v1.0.x |
| UJ1.1 | Stakeholder Contributing via Workshop | 1 | v1.0.x |
| UJ1.2 | Stakeholder Submitting via E-Form | 1 | Built |
| UJ1.3 | Evaluator Consolidating Requirements | 1 | v1.2 |
| UJ2.1 | Evaluator Creating RFP from Template | 2 | v1.2 |
| UJ2.2 | Vendor Completing RFP Response | 2 | Built |
| UJ2.3 | Evaluator Reviewing Response with AI | 2 | v1.0.x |
| UJ3.1 | Team Reconciling Score Variance | 3 | Built |
| UJ3.2 | Viewing Traceability Matrix | 3 | v1.0.x |
| UJ3.3 | Reviewing Anomaly Alerts | 3 | v1.0.x |
| UJ4.1 | Client Stakeholder Approval Portal | 4 | v1.0.x |
| UJ4.2 | Vendor Post-Submission Q&A | 4 | **COMPLETE** |
| UJ5.1 | Steering Committee Scenario Analysis | 5 | v1.2 |
| UJ5.2 | TCO Comparison and Sensitivity | 5 | v1.0.x |
| UJ6.1 | Tracking Procurement Workflow | 6 | v1.0.x |

---

# IMPLEMENTATION SCHEDULE

## Week 1 (Jan 13-17)

**Focus**: Foundation + Stakeholder Framework

| Task | Developer | Hours |
|------|-----------|-------|
| Database migrations (stakeholder, security, workshop) | Backend | 6h |
| StakeholderEngagementService | Backend | 3h |
| Phase gate logic + UI | Frontend | 3h |
| SecurityAssessmentService | Backend | 4h |
| Security questionnaire templates | Frontend | 4h |

## Week 2 (Jan 20-24)

**Focus**: Live Workshop + Client Portal (Start)

| Task | Developer | Hours |
|------|-----------|-------|
| WorkshopCollaborationService | Backend | 6h |
| useLiveWorkshop hook | Frontend | 6h |
| LiveWorkshop page + components | Frontend | 12h |
| ClientPortalService | Backend | 5h |
| Database migrations (client portal) | Backend | 2h |

## Week 3 (Jan 27-31)

**Focus**: Client Portal + AI Features

| Task | Developer | Hours |
|------|-----------|-------|
| ClientPortal page + components | Frontend | 12h |
| AI category suggestion endpoint | Backend | 3h |
| AI gap detection endpoint | Backend | 5h |
| AnomalyDetectionService | Backend | 3h |
| AI Response Scoring endpoint | Backend | 4h |

## Week 4 (Feb 3-7)

**Focus**: Traceability + Risk + Financial

| Task | Developer | Hours |
|------|-----------|-------|
| TraceabilityService + Matrix UI | Full-stack | 12h |
| RiskDashboard + components | Frontend | 8h |
| FinancialAnalysisService | Backend | 4h |
| Financial analysis UI | Frontend | 3h |
| ProcurementWorkflowService | Backend | 4h |

## Week 5 (Feb 10-14)

**Focus**: Workflow + Testing + Polish

| Task | Developer | Hours |
|------|-----------|-------|
| WorkflowTimeline + MilestoneCard | Frontend | 8h |
| Integration testing | Full-stack | 8h |
| Security audit | Backend | 4h |
| Performance optimization | Full-stack | 4h |
| Documentation + training | Full-stack | 4h |

---

# RISK MITIGATION

## Known Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep on workshops | High | Strict feature scope; vendor Q&A separate |
| AI model reliability | High | Human review required on all AI suggestions |
| User adoption | Medium | Early stakeholder feedback; weekly demos |
| Integration complexity | Medium | Use Supabase Realtime; proven patterns |
| Security questionnaire scope | Medium | Start with NIST framework; add over time |
| Tracker/Evaluator crossover | High | Strict segregation policy; code reviews |

---

# APPENDIX A: INDUSTRY RESEARCH SOURCES

| Source | Focus Area | Key Finding |
|--------|-----------|-------------|
| Datagrid | Scope Gap Detection | AI catches 95% vs 70% manual; 60% fewer change orders |
| Sprinto, AuditBoard | Security Assessment | 3-stage approach reduces delays 30-40% |
| ISM, CollegeBuys | TCO Analysis | Changes vendor selection 45% of time |
| SSEN Innovation | Stakeholder Engagement | Structured gates reduce cycle 45% |
| Ivalua, Datagrid | Anomaly Detection | Statistical detection catches 75% more red flags |
| Certa, Sievo | Vendor Intelligence | Reduces viability risk by 50% |
| Coupa, SAP Ariba | Workflow Tracking | Clear post-award accountability standard |

---

# APPENDIX B: DATABASE SCHEMA SUMMARY

## New Tables in v3.0

| Table | Purpose | Phase |
|-------|---------|-------|
| `stakeholder_participation_metrics` | Track stakeholder engagement | v1.0.x |
| `phase_gate_approvals` | Phase gate approvals by area | v1.0.x |
| `security_questionnaires` | Security question templates | v1.0.x |
| `security_assessments` | Vendor security scores | v1.0.x |
| `security_findings` | Security issues + remediation | v1.0.x |
| `vendor_response_gaps` | AI-detected scope gaps | v1.0.x |
| `vendor_response_anomalies` | Statistical outlier flags | v1.0.x |
| `vendor_response_ai_analysis` | Cached AI analysis | v1.0.x |
| `procurement_workflow_stages` | Post-evaluation workflow | v1.0.x |
| `workflow_milestones` | Workflow milestone tracking | v1.0.x |

## Modified Tables in v3.0

| Table | Changes |
|-------|---------|
| `evaluation_projects` | Add `phase_gates` JSONB |
| `stakeholder_areas` | Add `weight`, `approval_threshold`, `primary_contact_id` |
| `requirement_approvals` | Add `stakeholder_area_id`, `approval_note`, `revision_requested` |
| `scores` | Add `ai_suggested_score`, `ai_suggestion_accepted`, `ai_analysis_id` |

---

*Document maintained by: Product Team*
*Last updated: 09 January 2026*
*Version: 3.0 (Industry Best Practices Edition)*
