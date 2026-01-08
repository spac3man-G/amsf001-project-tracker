# Evaluator Product Roadmap

## Implementation Plan for Product Improvements

**Document Version**: 1.0
**Created**: 08 January 2026
**Status**: Planning

---

## Overview

This document outlines the implementation plan for enhancing the Evaluator module with new features focused on three strategic themes:

1. **Automation & Intelligence** - Reduce manual effort with AI and workflow automation
2. **Decision Confidence** - Better visualization and analytics for decision-making
3. **Collaboration Excellence** - Improve stakeholder engagement across all parties

---

## Release Schedule

| Release | Theme | Target | Duration |
|---------|-------|--------|----------|
| **v1.1** | Quick Wins | Feb 2026 | 4-6 weeks |
| **v1.2** | Templates & Analytics | Mar 2026 | 6-8 weeks |
| **v1.3** | Collaboration | May 2026 | 8-10 weeks |
| **v2.0** | Platform Evolution | Aug 2026 | 12-16 weeks |

---

# Release v1.1: Quick Wins

## Feature 1.1.1: Smart Notifications & Reminders

### Purpose
Automated notifications to keep evaluations moving without manual follow-up.

### User Stories
- As a consultant, I want to be notified when a vendor submits their response so I can review promptly
- As a vendor, I want reminder emails before my response deadline
- As a client stakeholder, I want to know when requirements need my approval
- As an evaluator, I want alerts when score reconciliation is needed

### Technical Specification

#### Database Changes

```sql
-- New table: notification_preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evaluation_project_id UUID REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Notification types (all default true)
  notify_vendor_response BOOLEAN DEFAULT true,
  notify_requirement_approval BOOLEAN DEFAULT true,
  notify_score_reconciliation BOOLEAN DEFAULT true,
  notify_workshop_reminder BOOLEAN DEFAULT true,
  notify_deadline_approaching BOOLEAN DEFAULT true,
  notify_client_activity BOOLEAN DEFAULT true,

  -- Delivery preferences
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,

  -- Timing preferences
  reminder_days_before INTEGER DEFAULT 2,
  digest_frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table: notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evaluation_project_id UUID REFERENCES evaluation_projects(id) ON DELETE CASCADE,

  -- Notification content
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,

  -- Related entities
  related_entity_type VARCHAR(50), -- vendor, requirement, workshop, score
  related_entity_id UUID,

  -- Status
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
```

#### Notification Types

| Type | Trigger | Recipients | Timing |
|------|---------|------------|--------|
| `vendor_response_submitted` | Vendor submits response | Evaluation team | Immediate |
| `vendor_response_deadline` | Deadline approaching | Vendor contacts | 7d, 3d, 1d before |
| `requirement_approval_needed` | Requirement submitted for approval | Client stakeholders | Immediate |
| `requirement_approved` | Client approves requirement | Evaluation team | Immediate |
| `score_reconciliation_needed` | Score variance > threshold | Evaluators for that criterion | Immediate |
| `workshop_reminder` | Upcoming workshop | Attendees, Facilitator | 24h, 1h before |
| `evaluation_milestone` | Phase completion | Evaluation team | Immediate |
| `client_comment_added` | Client adds comment | Evaluation team | Immediate |

#### New Service: NotificationService

```javascript
// src/services/evaluator/notifications.service.js

class NotificationsService extends EvaluatorBaseService {
  constructor() {
    super('notifications');
  }

  // Create notification for user(s)
  async notify(type, options) {
    const { evaluationProjectId, recipientUserIds, title, message, actionUrl, relatedEntity } = options;
    // Check user preferences before creating
    // Create notification records
    // Trigger email if preference enabled
  }

  // Get unread notifications for user
  async getUnread(userId, evaluationProjectId = null) { }

  // Mark as read
  async markRead(notificationId, userId) { }

  // Mark all as read
  async markAllRead(userId, evaluationProjectId = null) { }

  // Get notification preferences
  async getPreferences(userId, evaluationProjectId) { }

  // Update preferences
  async updatePreferences(userId, evaluationProjectId, preferences) { }
}
```

#### New API Endpoint: Email Delivery

```javascript
// api/evaluator/send-notification.js

// POST /api/evaluator/send-notification
// Sends email notification using configured email service
// Called by database trigger or background job

export default async function handler(req, res) {
  const { notificationId, userId, type, title, message, actionUrl } = req.body;

  // Get user email from profiles
  // Render email template based on type
  // Send via email service (Resend, SendGrid, etc.)
  // Log delivery status
}
```

#### UI Components

```
src/components/evaluator/notifications/
├── NotificationBell.jsx        # Header icon with badge
├── NotificationDropdown.jsx    # Dropdown list of recent
├── NotificationItem.jsx        # Single notification row
├── NotificationPreferences.jsx # Settings modal
└── NotificationCenter.jsx      # Full page view (optional)
```

#### Integration Points

1. **Header Component**: Add NotificationBell to EvaluatorDashboard header
2. **Vendor Response Submit**: Trigger `vendor_response_submitted`
3. **Requirement Status Change**: Trigger `requirement_approval_needed` / `requirement_approved`
4. **Score Save**: Check variance, trigger `score_reconciliation_needed`
5. **Workshop Create/Update**: Schedule `workshop_reminder` notifications
6. **Background Job**: Daily check for approaching deadlines

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration for notification tables | 2h | None |
| NotificationService implementation | 4h | Database |
| Email API endpoint | 4h | Service |
| NotificationBell component | 3h | Service |
| NotificationDropdown component | 4h | Service |
| NotificationPreferences component | 3h | Service |
| Integration with vendor response flow | 2h | Components |
| Integration with requirement approval flow | 2h | Components |
| Integration with scoring flow | 2h | Components |
| Integration with workshop flow | 2h | Components |
| Background job for deadline reminders | 4h | Service |
| Testing and polish | 4h | All |
| **Total** | **36h** | |

---

## Feature 1.1.2: AI-Powered Response Analysis

### Purpose
Help evaluators quickly understand vendor responses and identify key points.

### User Stories
- As an evaluator, I want AI to summarize long vendor responses so I can review faster
- As an evaluator, I want AI to flag potential compliance gaps in responses
- As an evaluator, I want AI to suggest a score based on response quality
- As an evaluator, I want to see how this vendor's response compares to others

### Technical Specification

#### New API Endpoint

```javascript
// api/evaluator/ai-analyze-response.js

// POST /api/evaluator/ai-analyze-response
// Analyzes a vendor response using Claude

export default async function handler(req, res) {
  const {
    responseId,
    questionText,
    responseText,
    requirementContext, // linked requirement details
    scoringScale,       // what scale we're using
    otherVendorResponses // anonymized for comparison
  } = req.body;

  // System prompt for analysis
  const systemPrompt = `You are an expert technology procurement analyst...`;

  // Call Claude API with structured output
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: systemPrompt,
    messages: [{ role: 'user', content: buildAnalysisPrompt(...) }],
    tools: [analyzeResponseTool]
  });

  // Return structured analysis
  return res.json({
    summary: analysis.summary,           // 2-3 sentence summary
    keyPoints: analysis.keyPoints,       // bullet points
    complianceGaps: analysis.gaps,       // potential concerns
    strengths: analysis.strengths,       // positive differentiators
    suggestedScore: analysis.score,      // recommended score with rationale
    confidence: analysis.confidence,     // AI confidence level
    comparisonNotes: analysis.comparison // how it compares to others
  });
}
```

#### Tool Definition

```javascript
const analyzeResponseTool = {
  name: 'analyze_vendor_response',
  description: 'Analyze a vendor response to an RFP question',
  input_schema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: '2-3 sentence summary of the response'
      },
      keyPoints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Key points from the response (3-5 bullets)'
      },
      gaps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            issue: { type: 'string' },
            severity: { enum: ['minor', 'moderate', 'major'] },
            suggestion: { type: 'string' }
          }
        },
        description: 'Potential compliance gaps or concerns'
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: 'Strengths and differentiators'
      },
      suggestedScore: {
        type: 'object',
        properties: {
          value: { type: 'number' },
          rationale: { type: 'string' }
        }
      },
      confidence: {
        enum: ['low', 'medium', 'high'],
        description: 'Confidence in the analysis'
      },
      comparisonNotes: {
        type: 'string',
        description: 'How this response compares to others (if provided)'
      }
    },
    required: ['summary', 'keyPoints', 'suggestedScore', 'confidence']
  }
};
```

#### Database Changes

```sql
-- Add AI analysis caching to vendor_responses
ALTER TABLE vendor_responses ADD COLUMN ai_analysis JSONB;
ALTER TABLE vendor_responses ADD COLUMN ai_analyzed_at TIMESTAMPTZ;

-- Track AI usage
-- (Uses existing ai_tasks table)
```

#### UI Components

```
src/components/evaluator/ai/
├── ResponseAnalysisButton.jsx  # "Analyze with AI" button
├── ResponseAnalysisPanel.jsx   # Analysis results display
├── AnalysisSummaryCard.jsx     # Compact summary view
└── ComplianceGapsList.jsx      # List of identified gaps
```

#### Integration

1. Add "Analyze with AI" button to VendorResponseForm view mode
2. Add analysis panel to ScoringInterface when viewing responses
3. Cache analysis results to avoid re-processing
4. Show analysis alongside score input

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| API endpoint implementation | 6h | None |
| Claude tool definition and testing | 4h | API |
| Database migration for caching | 1h | None |
| ResponseAnalysisButton component | 2h | API |
| ResponseAnalysisPanel component | 4h | API |
| Integration with scoring interface | 3h | Components |
| Comparison feature (cross-vendor) | 4h | API |
| Testing and prompt refinement | 4h | All |
| **Total** | **28h** | |

---

## Feature 1.1.3: Dashboard Analytics Widgets

### Purpose
Provide at-a-glance visibility into evaluation health and progress.

### User Stories
- As a consultant, I want to see a score heatmap across all vendors and categories
- As a consultant, I want to see a vendor comparison radar chart
- As a consultant, I want to track evaluation timeline progress
- As a consultant, I want to see risk indicators for vendors with issues

### Technical Specification

#### New Dashboard Widgets

**Widget 1: Score Heatmap**
- Matrix visualization: Vendors (columns) × Categories (rows)
- Cell color: RAG based on weighted average score
- Click cell to drill into that vendor-category

**Widget 2: Vendor Comparison Radar**
- Radar/spider chart with category axes
- Each vendor as a different colored line
- Toggle vendors on/off
- Hover for exact values

**Widget 3: Evaluation Timeline**
- Gantt-style progress bar
- Phases: Setup → Discovery → Requirements → Vendors → Evaluation → Decision
- Current phase highlighted
- Key milestones marked

**Widget 4: Risk Indicators**
- Cards showing potential issues:
  - Vendors with incomplete responses
  - Requirements with no scores
  - High score variance needing reconciliation
  - Overdue deadlines
- Click to navigate to issue

**Widget 5: Stakeholder Participation**
- Bar chart of participation by stakeholder area
- Metrics: requirements contributed, approvals completed, workshop attendance
- Identify under-represented groups

#### New Service Methods

```javascript
// src/services/evaluator/analytics.service.js

class AnalyticsService {
  // Score heatmap data
  async getScoreHeatmap(evaluationProjectId) {
    // Returns: { vendors: [], categories: [], scores: [[]] }
  }

  // Radar chart data
  async getVendorRadarData(evaluationProjectId, vendorIds) {
    // Returns: { categories: [], vendors: [{ name, scores: [] }] }
  }

  // Timeline progress
  async getTimelineProgress(evaluationProjectId) {
    // Returns: { phases: [{ name, status, startDate, endDate, completion }] }
  }

  // Risk indicators
  async getRiskIndicators(evaluationProjectId) {
    // Returns: { incompleteResponses, unscoredRequirements, varianceIssues, overdueItems }
  }

  // Stakeholder participation
  async getStakeholderParticipation(evaluationProjectId) {
    // Returns: { areas: [{ name, requirementsCount, approvalsCount, attendanceRate }] }
  }
}
```

#### UI Components

```
src/components/evaluator/analytics/
├── ScoreHeatmap.jsx           # Matrix heatmap with Recharts
├── VendorRadarChart.jsx       # Radar chart with Recharts
├── EvaluationTimeline.jsx     # Gantt-style progress
├── RiskIndicatorCards.jsx     # Alert cards
├── StakeholderParticipation.jsx # Bar chart
└── AnalyticsDashboard.jsx     # Container with all widgets
```

#### Dashboard Layout Update

```jsx
// Updated EvaluatorDashboard.jsx structure

<div className="evaluator-dashboard">
  <PageHeader ... />

  {/* Existing Quick Actions */}
  <QuickActionsGrid />

  {/* Existing Stat Cards */}
  <StatCardsRow />

  {/* NEW: Analytics Section */}
  <AnalyticsDashboard>
    <div className="analytics-row">
      <ScoreHeatmap />
      <VendorRadarChart />
    </div>
    <div className="analytics-row">
      <EvaluationTimeline />
      <RiskIndicatorCards />
    </div>
    <div className="analytics-row">
      <StakeholderParticipation />
    </div>
  </AnalyticsDashboard>
</div>
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| AnalyticsService implementation | 6h | None |
| ScoreHeatmap component | 5h | Service |
| VendorRadarChart component | 4h | Service |
| EvaluationTimeline component | 4h | Service |
| RiskIndicatorCards component | 3h | Service |
| StakeholderParticipation component | 3h | Service |
| AnalyticsDashboard container | 2h | All widgets |
| Dashboard layout integration | 2h | Container |
| Responsive design adjustments | 3h | Integration |
| Testing and polish | 4h | All |
| **Total** | **36h** | |

---

## v1.1 Release Summary

| Feature | Effort | Business Value |
|---------|--------|----------------|
| Smart Notifications | 36h | Reduces cycle time 20-30% |
| AI Response Analysis | 28h | Saves 2-3h per vendor |
| Dashboard Analytics | 36h | Better executive visibility |
| **Total v1.1** | **100h** | |

**Estimated Duration**: 4-6 weeks (assuming 1 developer)

---

# Release v1.2: Templates & Analytics

## Feature 1.2.1: Evaluation Templates

### Purpose
Enable rapid evaluation setup using pre-built templates.

### User Stories
- As a consultant, I want to select a template when creating an evaluation
- As a consultant, I want templates for common evaluation types (CRM, ERP, HRIS)
- As a consultant, I want to save my evaluation setup as a template for reuse
- As a consultant, I want to clone from a previous evaluation

### Technical Specification

#### Database Changes

```sql
-- New table: evaluation_templates
CREATE TABLE evaluation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Template metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  domain VARCHAR(100), -- CRM, ERP, HRIS, Custom, etc.
  tags TEXT[],

  -- Template content (JSONB for flexibility)
  template_data JSONB NOT NULL,
  /* template_data structure:
  {
    "categories": [
      { "name": "...", "weight": 20, "description": "...", "criteria": [...] }
    ],
    "stakeholderAreas": [
      { "name": "...", "description": "..." }
    ],
    "scoringScale": {
      "type": "numeric",
      "minValue": 0,
      "maxValue": 5,
      "labels": { "0": "Not Met", "5": "Fully Met" }
    },
    "questionLibrary": [
      { "section": "...", "question": "...", "type": "..." }
    ],
    "phases": [
      { "name": "Discovery", "durationDays": 14 }
    ]
  }
  */

  -- Visibility
  is_public BOOLEAN DEFAULT false, -- visible to all orgs
  is_system BOOLEAN DEFAULT false, -- provided by platform

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track template usage
CREATE TABLE evaluation_template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES evaluation_templates(id) ON DELETE SET NULL,
  evaluation_project_id UUID REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Pre-Built System Templates

**Template: CRM Evaluation**
```json
{
  "name": "CRM Platform Evaluation",
  "domain": "CRM",
  "categories": [
    { "name": "Sales Automation", "weight": 25 },
    { "name": "Marketing Automation", "weight": 20 },
    { "name": "Customer Service", "weight": 20 },
    { "name": "Analytics & Reporting", "weight": 15 },
    { "name": "Integration & API", "weight": 10 },
    { "name": "Vendor Viability", "weight": 10 }
  ],
  "stakeholderAreas": [
    { "name": "Sales" },
    { "name": "Marketing" },
    { "name": "Customer Success" },
    { "name": "IT" },
    { "name": "Finance" }
  ],
  "questionLibrary": [
    { "section": "Sales Automation", "question": "Describe your lead scoring capabilities..." },
    // ... 20+ questions
  ]
}
```

**Other System Templates:**
- ERP Platform Evaluation
- HRIS/HCM Evaluation
- Cloud Infrastructure Evaluation
- Cybersecurity Tools Evaluation
- Data Analytics Platform Evaluation
- Collaboration Tools Evaluation
- Custom (Blank)

#### New Service: TemplatesService

```javascript
// src/services/evaluator/templates.service.js

class TemplatesService {
  // Get available templates (system + org-specific)
  async getAvailable(organisationId) { }

  // Get single template
  async getTemplate(templateId) { }

  // Create new template
  async createTemplate(organisationId, userId, data) { }

  // Create evaluation from template
  async applyTemplate(templateId, evaluationProjectId) { }

  // Save evaluation as template
  async saveAsTemplate(evaluationProjectId, templateData) { }

  // Clone from existing evaluation
  async cloneEvaluation(sourceEvaluationId, newEvaluationData) { }
}
```

#### UI Components

```
src/components/evaluator/templates/
├── TemplateSelector.jsx        # Template picker in create flow
├── TemplateCard.jsx            # Single template preview
├── TemplatePreview.jsx         # Full template details modal
├── SaveAsTemplateModal.jsx     # Save current as template
└── CloneEvaluationModal.jsx    # Clone from existing
```

#### Create Evaluation Flow Update

```
Current: Create → Enter details → Save → Manually configure

New: Create → Select template (or blank) → Enter details → Auto-configure → Review → Save
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration | 2h | None |
| TemplatesService implementation | 6h | Database |
| System templates data (7 templates) | 8h | Service |
| TemplateSelector component | 4h | Service |
| TemplateCard component | 2h | Service |
| TemplatePreview component | 3h | Service |
| SaveAsTemplateModal component | 3h | Service |
| CloneEvaluationModal component | 3h | Service |
| Create evaluation flow integration | 4h | Components |
| Template application logic | 4h | Service |
| Testing and polish | 4h | All |
| **Total** | **43h** | |

---

## Feature 1.2.2: Scenario Comparison Tool

### Purpose
Model "what-if" scenarios to support decision-making.

### User Stories
- As a consultant, I want to adjust category weights and see how rankings change
- As a consultant, I want to exclude optional requirements and see impact
- As a consultant, I want to compare multiple scenarios side-by-side
- As a consultant, I want to export scenario analysis to reports

### Technical Specification

#### Database Changes

```sql
-- New table: evaluation_scenarios
CREATE TABLE evaluation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Scenario details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Scenario configuration
  config JSONB NOT NULL,
  /* config structure:
  {
    "categoryWeights": { "cat-uuid-1": 30, "cat-uuid-2": 25, ... },
    "excludedRequirements": ["req-uuid-1", "req-uuid-2"],
    "excludedCriteria": ["crit-uuid-1"],
    "vendorSubset": ["vendor-uuid-1", "vendor-uuid-2"] // null = all
  }
  */

  -- Calculated results (cached)
  results JSONB,
  /* results structure:
  {
    "rankings": [
      { "vendorId": "...", "vendorName": "...", "score": 85.2, "rank": 1 }
    ],
    "calculatedAt": "2026-01-15T..."
  }
  */

  -- Flags
  is_baseline BOOLEAN DEFAULT false, -- marks the "current" scenario

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### New Service: ScenariosService

```javascript
// src/services/evaluator/scenarios.service.js

class ScenariosService extends EvaluatorBaseService {
  constructor() {
    super('evaluation_scenarios');
  }

  // Get all scenarios for evaluation
  async getAll(evaluationProjectId) { }

  // Create scenario
  async create(evaluationProjectId, userId, config) { }

  // Calculate scenario results
  async calculate(scenarioId) {
    // Get scenario config
    // Apply weight overrides
    // Exclude specified requirements/criteria
    // Recalculate vendor scores
    // Return and cache results
  }

  // Compare multiple scenarios
  async compare(scenarioIds) {
    // Return side-by-side comparison data
  }

  // Get baseline (current actual)
  async getBaseline(evaluationProjectId) { }

  // Set as baseline
  async setAsBaseline(scenarioId) { }
}
```

#### UI Components

```
src/components/evaluator/scenarios/
├── ScenarioBuilder.jsx         # Create/edit scenario
├── ScenarioCard.jsx            # Scenario summary card
├── ScenarioComparison.jsx      # Side-by-side comparison
├── WeightSliders.jsx           # Category weight adjusters
├── RequirementExcluder.jsx     # Toggle requirements on/off
├── RankingChangeIndicator.jsx  # Shows rank movement
└── ScenarioExport.jsx          # Export to report
```

#### New Page: Scenarios View

```
/evaluator/scenarios

- List of saved scenarios
- "Create Scenario" button
- Side-by-side comparison view
- Export options
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration | 2h | None |
| ScenariosService implementation | 8h | Database |
| Calculation engine | 6h | Service |
| ScenarioBuilder component | 6h | Service |
| ScenarioCard component | 2h | Service |
| WeightSliders component | 3h | Builder |
| RequirementExcluder component | 3h | Builder |
| ScenarioComparison component | 6h | Service |
| RankingChangeIndicator component | 2h | Comparison |
| Scenarios page | 4h | Components |
| Export functionality | 3h | Page |
| Testing and polish | 4h | All |
| **Total** | **49h** | |

---

## Feature 1.2.3: Advanced Reporting

### Purpose
Enhanced report generation with customization and additional formats.

### User Stories
- As a consultant, I want customizable report sections
- As a consultant, I want to include scenario analysis in reports
- As a consultant, I want professional PDF output (not HTML)
- As a consultant, I want executive summary auto-generation
- As a consultant, I want to export to PowerPoint format

### Technical Specification

#### Report Builder System

```javascript
// Report configuration structure
const reportConfig = {
  title: "Vendor Evaluation Report",
  subtitle: "CRM Platform Selection",
  date: "2026-01-15",
  preparedFor: "Client Name",
  preparedBy: "Consultant Name",

  sections: [
    { type: "executive_summary", enabled: true, aiGenerated: true },
    { type: "methodology", enabled: true },
    { type: "requirements_overview", enabled: true, groupBy: "category" },
    { type: "vendor_profiles", enabled: true, vendorIds: ["all"] },
    { type: "scoring_matrix", enabled: true },
    { type: "vendor_comparison", enabled: true, chartType: "radar" },
    { type: "scenario_analysis", enabled: true, scenarioIds: [...] },
    { type: "recommendation", enabled: true, aiAssisted: true },
    { type: "appendix_evidence", enabled: false },
    { type: "appendix_responses", enabled: false }
  ],

  branding: {
    primaryColor: "#3B82F6",
    logo: "url-to-logo",
    footerText: "Confidential"
  }
};
```

#### PDF Generation Upgrade

Replace HTML-based PDF with proper PDF generation:

```javascript
// api/evaluator/generate-report.js (updated)

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// OR use Puppeteer for HTML-to-PDF
import puppeteer from 'puppeteer';

async function generatePDF(reportConfig, data) {
  // Option 1: jsPDF for programmatic PDF
  const doc = new jsPDF();
  // ... build PDF programmatically

  // Option 2: Puppeteer for HTML template rendering
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(renderHTMLTemplate(reportConfig, data));
  const pdf = await page.pdf({ format: 'A4' });

  return pdf;
}
```

#### AI Executive Summary

```javascript
// api/evaluator/ai-executive-summary.js

// POST /api/evaluator/ai-executive-summary
// Generates executive summary using Claude

export default async function handler(req, res) {
  const { evaluationProjectId, includeRecommendation } = req.body;

  // Gather all evaluation data
  const data = await gatherEvaluationData(evaluationProjectId);

  // Generate summary with Claude
  const summary = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: 'You are an expert technology procurement consultant...',
    messages: [{
      role: 'user',
      content: buildSummaryPrompt(data, includeRecommendation)
    }]
  });

  return res.json({
    executiveSummary: summary.content,
    keyFindings: extractKeyFindings(summary),
    recommendation: includeRecommendation ? extractRecommendation(summary) : null
  });
}
```

#### UI Components

```
src/components/evaluator/reports/
├── ReportBuilder.jsx           # Report configuration UI
├── SectionToggle.jsx           # Enable/disable sections
├── SectionOrderer.jsx          # Drag to reorder
├── BrandingConfig.jsx          # Colors, logo, footer
├── ReportPreview.jsx           # Live preview
└── ExportOptions.jsx           # PDF, PPTX, Word options
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Report configuration schema | 2h | None |
| PDF generation upgrade (Puppeteer) | 8h | Schema |
| AI executive summary endpoint | 6h | None |
| ReportBuilder component | 6h | Schema |
| SectionToggle component | 2h | Builder |
| SectionOrderer component | 3h | Builder |
| BrandingConfig component | 3h | Builder |
| ReportPreview component | 4h | Builder |
| PowerPoint export (basic) | 6h | Schema |
| Report templates (3 styles) | 4h | PDF generation |
| Testing and polish | 4h | All |
| **Total** | **48h** | |

---

## v1.2 Release Summary

| Feature | Effort | Business Value |
|---------|--------|----------------|
| Evaluation Templates | 43h | Setup time: days → hours |
| Scenario Comparison | 49h | Better decision support |
| Advanced Reporting | 48h | Professional deliverables |
| **Total v1.2** | **140h** | |

**Estimated Duration**: 6-8 weeks (assuming 1 developer)

---

# Release v1.3: Collaboration Excellence

## Feature 1.3.1: Live Collaboration Mode

### Purpose
Enable real-time requirement capture during workshops.

### User Stories
- As a facilitator, I want multiple people to add requirements simultaneously
- As a facilitator, I want live voting/prioritization with stakeholders
- As a facilitator, I want instant AI categorization suggestions
- As a facilitator, I want session recording with auto-transcription

### Technical Specification

#### Real-Time Architecture

```
Option 1: Supabase Realtime (Recommended)
- Uses existing Supabase infrastructure
- Postgres LISTEN/NOTIFY under the hood
- Presence tracking for active users
- Broadcast for live updates

Option 2: Socket.io
- Separate WebSocket server
- More control but more infrastructure
```

#### Supabase Realtime Implementation

```javascript
// src/hooks/useLiveWorkshop.js

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useLiveWorkshop(workshopId) {
  const [liveRequirements, setLiveRequirements] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [votes, setVotes] = useState({});

  useEffect(() => {
    // Subscribe to requirement changes
    const reqChannel = supabase
      .channel(`workshop:${workshopId}:requirements`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'evaluation_requirements',
        filter: `source_workshop_id=eq.${workshopId}`
      }, (payload) => {
        // Handle insert/update/delete
        handleRequirementChange(payload);
      })
      .subscribe();

    // Subscribe to presence (active users)
    const presenceChannel = supabase
      .channel(`workshop:${workshopId}:presence`)
      .on('presence', { event: 'sync' }, () => {
        setActiveUsers(presenceChannel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: currentUser.id, name: currentUser.name });
        }
      });

    // Subscribe to votes broadcast
    const voteChannel = supabase
      .channel(`workshop:${workshopId}:votes`)
      .on('broadcast', { event: 'vote' }, (payload) => {
        handleVote(payload);
      })
      .subscribe();

    return () => {
      reqChannel.unsubscribe();
      presenceChannel.unsubscribe();
      voteChannel.unsubscribe();
    };
  }, [workshopId]);

  const addRequirement = async (reqData) => {
    // Insert via Supabase - realtime will broadcast
  };

  const castVote = async (requirementId, voteType) => {
    // Broadcast vote
    await supabase.channel(`workshop:${workshopId}:votes`)
      .send({
        type: 'broadcast',
        event: 'vote',
        payload: { requirementId, voteType, userId: currentUser.id }
      });
  };

  return { liveRequirements, activeUsers, votes, addRequirement, castVote };
}
```

#### Live Capture UI

```
src/pages/evaluator/LiveWorkshop.jsx

Features:
- Split view: Facilitator controls | Participant view
- Real-time requirement list with "just added" highlights
- Quick-add form (minimal fields)
- AI categorization chip suggestions
- Live voting buttons (thumbs up/down, priority dots)
- Active users indicator
- Timer/agenda tracker
- Recording controls (if enabled)
```

#### AI-Assisted Transcription (Optional)

```javascript
// api/evaluator/transcribe-workshop.js

// POST /api/evaluator/transcribe-workshop
// Takes audio file, returns transcript with extracted requirements

// Uses OpenAI Whisper for transcription
// Uses Claude for requirement extraction from transcript
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Supabase Realtime setup | 4h | None |
| useLiveWorkshop hook | 6h | Realtime |
| LiveWorkshop page | 8h | Hook |
| Quick-add requirement form | 3h | Page |
| Live voting system | 4h | Hook |
| Active users presence | 3h | Hook |
| AI categorization suggestions | 4h | Form |
| Timer/agenda component | 2h | Page |
| Participant view (simplified) | 4h | Page |
| Facilitator controls | 4h | Page |
| Transcription API (optional) | 8h | None |
| Testing and polish | 6h | All |
| **Total** | **56h** | |

---

## Feature 1.3.2: Smart Requirement Consolidation

### Purpose
AI-powered detection and merging of duplicate/similar requirements.

### User Stories
- As a consultant, I want AI to identify similar requirements
- As a consultant, I want to merge requirements with one click
- As a consultant, I want to see conflicting requirements between stakeholder groups
- As a consultant, I want auto-grouping suggestions

### Technical Specification

#### New API Endpoint

```javascript
// api/evaluator/ai-consolidate-requirements.js

// POST /api/evaluator/ai-consolidate-requirements
// Analyzes all requirements for duplicates and conflicts

export default async function handler(req, res) {
  const { evaluationProjectId } = req.body;

  // Fetch all requirements
  const requirements = await fetchAllRequirements(evaluationProjectId);

  // Use Claude to analyze semantic similarity
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: 'You are a requirements analyst...',
    messages: [{
      role: 'user',
      content: buildConsolidationPrompt(requirements)
    }],
    tools: [consolidationTool]
  });

  return res.json({
    duplicates: analysis.duplicates,      // Groups of similar requirements
    conflicts: analysis.conflicts,         // Contradicting requirements
    suggestions: analysis.suggestions,     // Merge/consolidation suggestions
    groupings: analysis.groupings          // Suggested categorization
  });
}

const consolidationTool = {
  name: 'analyze_requirements',
  input_schema: {
    type: 'object',
    properties: {
      duplicates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            requirementIds: { type: 'array', items: { type: 'string' } },
            similarity: { type: 'number' },
            suggestedMerge: { type: 'string' }
          }
        }
      },
      conflicts: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            requirementIds: { type: 'array', items: { type: 'string' } },
            conflictType: { type: 'string' },
            resolution: { type: 'string' }
          }
        }
      },
      groupings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            suggestedCategory: { type: 'string' },
            requirementIds: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }
};
```

#### UI Components

```
src/components/evaluator/consolidation/
├── ConsolidationWizard.jsx     # Step-by-step consolidation flow
├── DuplicateGroupCard.jsx      # Shows similar requirements
├── ConflictCard.jsx            # Shows conflicting requirements
├── MergePreview.jsx            # Preview merged requirement
├── BulkCategorize.jsx          # Apply suggested categories
└── ConsolidationReport.jsx     # Summary of changes made
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Consolidation API endpoint | 8h | None |
| Semantic similarity prompt tuning | 4h | API |
| ConsolidationWizard component | 6h | API |
| DuplicateGroupCard component | 3h | Wizard |
| ConflictCard component | 3h | Wizard |
| MergePreview component | 3h | Wizard |
| Merge execution logic | 4h | Service |
| BulkCategorize component | 3h | Wizard |
| ConsolidationReport component | 2h | Wizard |
| Integration with RequirementsHub | 2h | Components |
| Testing and polish | 4h | All |
| **Total** | **42h** | |

---

## Feature 1.3.3: Vendor Portal Enhancements

### Purpose
Improve vendor experience for higher response quality and completion rates.

### User Stories
- As a vendor, I want real-time validation as I complete the form
- As a vendor, I want to see my progress through the RFP
- As a vendor, I want to preview documents before uploading
- As a vendor, I want to understand question importance/priority
- As a vendor, I want a compliance checklist to track requirements

### Technical Specification

#### Enhanced Vendor Portal Features

**1. Real-Time Validation**
```javascript
// Validation rules per question type
const validationRules = {
  textarea: { minLength: 50, maxLength: 5000 },
  compliance: { required: true },
  file: { maxSize: '10MB', allowedTypes: ['pdf', 'docx'] }
};

// Show inline validation errors as user types
// Prevent submission until all required fields valid
```

**2. Progress Indicator**
```jsx
// Multi-step progress bar
<ProgressBar>
  <Step status="complete">Company Info</Step>
  <Step status="current">Functional Requirements</Step>
  <Step status="pending">Technical Requirements</Step>
  <Step status="pending">Pricing</Step>
  <Step status="pending">Review & Submit</Step>
</ProgressBar>
```

**3. Question Importance Indicators**
```jsx
// Visual priority markers
<Question>
  <ImportanceBadge level="critical" /> {/* Red - must answer fully */}
  <ImportanceBadge level="high" />     {/* Orange */}
  <ImportanceBadge level="medium" />   {/* Yellow */}
  <ImportanceBadge level="low" />      {/* Gray */}
</Question>
```

**4. Compliance Checklist Sidebar**
```jsx
// Sticky sidebar showing compliance tracking
<ComplianceSidebar>
  <ChecklistItem status="met">Security certifications</ChecklistItem>
  <ChecklistItem status="partial">Data residency</ChecklistItem>
  <ChecklistItem status="not_met">API documentation</ChecklistItem>
  <ChecklistItem status="pending">Reference customers</ChecklistItem>
</ComplianceSidebar>
```

**5. Document Preview**
```jsx
// Preview uploaded documents before final submit
<DocumentPreview
  file={uploadedFile}
  onReplace={handleReplace}
  onRemove={handleRemove}
/>
```

#### Database Changes

```sql
-- Add importance to vendor questions
ALTER TABLE vendor_questions ADD COLUMN importance VARCHAR(20) DEFAULT 'medium';
-- Values: critical, high, medium, low

-- Add validation rules to vendor questions
ALTER TABLE vendor_questions ADD COLUMN validation_rules JSONB;

-- Track partial saves
ALTER TABLE vendor_responses ADD COLUMN last_saved_at TIMESTAMPTZ;
ALTER TABLE vendor_responses ADD COLUMN auto_saved BOOLEAN DEFAULT false;
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration | 1h | None |
| Real-time validation system | 4h | Migration |
| ProgressBar component | 3h | None |
| Question importance badges | 2h | Migration |
| ComplianceSidebar component | 4h | None |
| DocumentPreview component | 3h | None |
| Auto-save functionality | 3h | None |
| VendorPortal page updates | 6h | All components |
| Mobile responsiveness | 3h | Page |
| Testing and polish | 4h | All |
| **Total** | **33h** | |

---

## v1.3 Release Summary

| Feature | Effort | Business Value |
|---------|--------|----------------|
| Live Collaboration Mode | 56h | Real-time workshop capture |
| Smart Requirement Consolidation | 42h | Cleaner requirement sets |
| Vendor Portal Enhancements | 33h | Higher response rates |
| **Total v1.3** | **131h** | |

**Estimated Duration**: 8-10 weeks (assuming 1 developer)

---

# Release v2.0: Platform Evolution

## Feature 2.0.1: Procurement Workflow Extension

### Purpose
Extend Evaluator beyond selection into procurement execution.

### User Stories
- As a consultant, I want to track contract negotiation progress
- As a consultant, I want a checklist of commercial terms to negotiate
- As a consultant, I want to link evaluation outcomes to delivery projects
- As a consultant, I want to track post-implementation success metrics

### Technical Specification

#### Database Changes

```sql
-- New table: procurement_workflows
CREATE TABLE procurement_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  selected_vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,

  -- Workflow status
  status VARCHAR(50) NOT NULL DEFAULT 'negotiation',
  -- Values: negotiation, contracting, implementation_planning, complete, cancelled

  -- Key dates
  selection_date DATE,
  target_contract_date DATE,
  actual_contract_date DATE,
  target_go_live_date DATE,
  actual_go_live_date DATE,

  -- Commercial tracking
  proposed_value DECIMAL(15,2),
  negotiated_value DECIMAL(15,2),
  final_contract_value DECIMAL(15,2),

  -- Links
  linked_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  contract_document_id UUID,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table: procurement_checklist_items
CREATE TABLE procurement_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_workflow_id UUID NOT NULL REFERENCES procurement_workflows(id) ON DELETE CASCADE,

  -- Item details
  category VARCHAR(100), -- commercial, legal, technical, operational
  item_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  -- Values: pending, in_progress, complete, not_applicable

  -- Tracking
  assigned_to UUID REFERENCES profiles(id),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- New table: success_metrics
CREATE TABLE success_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_workflow_id UUID NOT NULL REFERENCES procurement_workflows(id) ON DELETE CASCADE,

  -- Metric definition
  metric_name VARCHAR(255) NOT NULL,
  description TEXT,
  target_value VARCHAR(100),
  measurement_frequency VARCHAR(50), -- monthly, quarterly, annually

  -- Tracking
  current_value VARCHAR(100),
  last_measured_at TIMESTAMPTZ,
  status VARCHAR(50), -- on_track, at_risk, off_track

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### New Pages

```
/evaluator/procurement/:workflowId
├── Overview (status, key dates, value tracking)
├── Checklist (negotiation items)
├── Documents (contracts, amendments)
├── Success Metrics (post-implementation)
└── Linked Project (if connected)
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration | 3h | None |
| ProcurementService | 8h | Database |
| Procurement dashboard page | 8h | Service |
| Checklist management | 6h | Service |
| Document management | 4h | Service |
| Success metrics tracking | 6h | Service |
| Project linking integration | 6h | Service |
| Value tracking charts | 4h | Page |
| Default checklist templates | 4h | Service |
| Testing and polish | 6h | All |
| **Total** | **55h** | |

---

## Feature 2.0.2: Multi-Evaluation Benchmarking

### Purpose
Enable cross-evaluation analytics and organizational learning.

### User Stories
- As a consultant, I want to see vendor performance across multiple evaluations
- As a consultant, I want to compare this evaluation's requirements to industry benchmarks
- As a consultant, I want to build a best practices library from past evaluations
- As a consultant, I want to see historical trends

### Technical Specification

#### Cross-Evaluation Analytics

```javascript
// src/services/evaluator/benchmarking.service.js

class BenchmarkingService {
  // Vendor performance across evaluations
  async getVendorHistory(vendorName, organisationId) {
    // Find vendor by name across evaluations
    // Return: evaluations participated, average score, win rate
  }

  // Category benchmark comparison
  async getCategoryBenchmarks(evaluationProjectId, categoryId) {
    // Compare category weights to org average
    // Compare requirement counts to similar evaluations
  }

  // Best practices library
  async getBestPractices(domain, organisationId) {
    // Aggregate successful patterns from past evaluations
    // Return: common categories, typical weights, effective questions
  }

  // Historical trends
  async getTrends(organisationId, timeRange) {
    // Evaluations over time
    // Average duration
    // Vendor selection patterns
  }
}
```

#### New Pages

```
/evaluator/benchmarking
├── Vendor History (cross-evaluation vendor view)
├── Category Benchmarks (compare to org averages)
├── Best Practices (learnings library)
└── Trends (historical analytics)
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| BenchmarkingService | 10h | None |
| Vendor history analytics | 6h | Service |
| Category benchmarks | 6h | Service |
| Best practices aggregation | 8h | Service |
| Historical trends | 6h | Service |
| Benchmarking dashboard page | 8h | Service |
| Visualization components | 6h | Page |
| Testing and polish | 6h | All |
| **Total** | **56h** | |

---

## Feature 2.0.3: Advanced Access Control

### Purpose
Support complex enterprise governance requirements.

### User Stories
- As an admin, I want to restrict evaluators to specific categories
- As an admin, I want to enable blinded scoring (can't see other scores)
- As an admin, I want time-limited access for external consultants
- As an admin, I want to delegate my access to someone temporarily

### Technical Specification

#### Database Changes

```sql
-- Extend evaluation_project_users with granular permissions
ALTER TABLE evaluation_project_users ADD COLUMN permissions JSONB DEFAULT '{}';
/* permissions structure:
{
  "categories": ["cat-uuid-1", "cat-uuid-2"], // null = all
  "vendors": ["vendor-uuid-1"], // null = all
  "blindedScoring": true, // can't see other evaluator scores
  "expiresAt": "2026-02-01T00:00:00Z", // null = no expiry
  "canDelegate": true
}
*/

-- New table: access_delegations
CREATE TABLE access_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  delegator_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delegate_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Delegation scope
  permissions JSONB NOT NULL, -- same structure as above
  reason TEXT,

  -- Validity
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Permission Enforcement

```javascript
// src/hooks/useEvaluatorPermissions.js (updated)

export function useEvaluatorPermissions() {
  const { evaluationRole, permissions } = useEvaluationRole();

  const canViewCategory = (categoryId) => {
    if (!permissions.categories) return true; // null = all
    return permissions.categories.includes(categoryId);
  };

  const canViewVendor = (vendorId) => {
    if (!permissions.vendors) return true;
    return permissions.vendors.includes(vendorId);
  };

  const canSeeOtherScores = () => {
    return !permissions.blindedScoring;
  };

  const isAccessExpired = () => {
    if (!permissions.expiresAt) return false;
    return new Date(permissions.expiresAt) < new Date();
  };

  // ... existing permissions
}
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration | 2h | None |
| Permission service updates | 6h | Database |
| useEvaluatorPermissions updates | 4h | Service |
| Category restriction UI | 4h | Hook |
| Vendor restriction UI | 4h | Hook |
| Blinded scoring mode | 4h | Hook |
| Time-limited access UI | 3h | Hook |
| Delegation management UI | 6h | Service |
| Access control admin page | 6h | All |
| RLS policy updates | 4h | Database |
| Testing and polish | 6h | All |
| **Total** | **49h** | |

---

## Feature 2.0.4: Mobile Scoring App

### Purpose
Enable scoring and evidence capture on mobile devices.

### User Stories
- As an evaluator, I want to score vendors during live demos
- As an evaluator, I want to capture voice notes as evidence
- As an evaluator, I want to take photos/screenshots as evidence
- As an evaluator, I want offline mode with sync

### Technical Specification

#### Technical Approach

**Option 1: Progressive Web App (PWA)**
- Reuse existing React codebase
- Add service worker for offline
- Responsive mobile-first views
- Web push notifications

**Option 2: React Native**
- Separate codebase
- Better native features
- More development effort
- App store deployment

**Recommended: PWA** (lower effort, shared codebase)

#### PWA Implementation

```javascript
// service-worker.js
// Cache API responses for offline use
// Queue score submissions for sync when online

// src/pages/evaluator/MobileScoring.jsx
// Simplified mobile-first scoring interface

// src/components/evaluator/mobile/
// VoiceNoteRecorder.jsx
// PhotoCapture.jsx
// OfflineIndicator.jsx
// SyncStatus.jsx
```

#### Mobile-Specific Features

1. **Quick Score Entry**: Large touch-friendly score buttons
2. **Voice Notes**: Record audio, auto-transcribe (optional)
3. **Photo Capture**: Camera integration for evidence
4. **Offline Queue**: Save locally, sync when online
5. **Push Notifications**: Score reminders, deadline alerts

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| PWA service worker setup | 6h | None |
| Offline data caching | 8h | Service worker |
| Sync queue implementation | 6h | Caching |
| MobileScoring page | 8h | None |
| VoiceNoteRecorder component | 6h | Page |
| PhotoCapture component | 4h | Page |
| OfflineIndicator component | 2h | Service worker |
| SyncStatus component | 2h | Sync queue |
| Push notification setup | 4h | Service worker |
| Mobile-responsive CSS | 6h | Page |
| Testing on devices | 6h | All |
| **Total** | **58h** | |

---

## Feature 2.0.5: Vendor Intelligence Integration

### Purpose
Auto-populate vendor information from external sources.

### User Stories
- As a consultant, I want vendor profiles auto-populated with company data
- As a consultant, I want to see recent news about vendors
- As a consultant, I want financial stability indicators
- As a consultant, I want employee reviews/ratings

### Technical Specification

#### Integration Sources

| Source | Data | API |
|--------|------|-----|
| LinkedIn | Company size, employees, location | LinkedIn API |
| Crunchbase | Funding, revenue, growth | Crunchbase API |
| Glassdoor | Employee ratings, reviews | Glassdoor API |
| News API | Recent articles, sentiment | NewsAPI / Bing News |
| G2/Capterra | Product reviews, ratings | Scraping or API |

#### New API Endpoint

```javascript
// api/evaluator/vendor-intelligence.js

// POST /api/evaluator/vendor-intelligence
// Fetches external data for a vendor

export default async function handler(req, res) {
  const { vendorName, vendorWebsite } = req.body;

  const [linkedin, crunchbase, news, reviews] = await Promise.allSettled([
    fetchLinkedInData(vendorName),
    fetchCrunchbaseData(vendorName),
    fetchNewsArticles(vendorName),
    fetchProductReviews(vendorName)
  ]);

  return res.json({
    company: {
      employees: linkedin.value?.employees,
      founded: crunchbase.value?.founded,
      funding: crunchbase.value?.totalFunding,
      headquarters: linkedin.value?.headquarters
    },
    financials: {
      revenue: crunchbase.value?.revenue,
      growth: crunchbase.value?.growthRate,
      fundingRounds: crunchbase.value?.rounds
    },
    reputation: {
      glassdoorRating: null, // if available
      g2Rating: reviews.value?.g2,
      recentNews: news.value?.articles
    },
    lastUpdated: new Date().toISOString()
  });
}
```

#### Database Changes

```sql
-- Cache vendor intelligence data
ALTER TABLE vendors ADD COLUMN intelligence_data JSONB;
ALTER TABLE vendors ADD COLUMN intelligence_updated_at TIMESTAMPTZ;
```

### Implementation Tasks

| Task | Estimate | Dependencies |
|------|----------|--------------|
| Database migration | 1h | None |
| LinkedIn integration | 6h | API keys |
| Crunchbase integration | 6h | API keys |
| News API integration | 4h | API keys |
| Review aggregation | 4h | APIs |
| Intelligence API endpoint | 4h | Integrations |
| VendorIntelligencePanel component | 6h | API |
| Auto-populate on vendor create | 3h | API |
| Refresh intelligence action | 2h | API |
| Testing and error handling | 4h | All |
| **Total** | **40h** | |

---

## v2.0 Release Summary

| Feature | Effort | Business Value |
|---------|--------|----------------|
| Procurement Workflow | 55h | End-to-end lifecycle |
| Multi-Evaluation Benchmarking | 56h | Organizational learning |
| Advanced Access Control | 49h | Enterprise governance |
| Mobile Scoring App | 58h | Field capture capability |
| Vendor Intelligence | 40h | Richer vendor profiles |
| **Total v2.0** | **258h** | |

**Estimated Duration**: 12-16 weeks (assuming 1 developer)

---

# Complete Roadmap Summary

| Release | Effort | Cumulative | Target Date |
|---------|--------|------------|-------------|
| v1.1 Quick Wins | 100h | 100h | Feb 2026 |
| v1.2 Templates & Analytics | 140h | 240h | Mar 2026 |
| v1.3 Collaboration | 131h | 371h | May 2026 |
| v2.0 Platform Evolution | 258h | 629h | Aug 2026 |

**Total Estimated Effort**: 629 hours (~16 person-weeks)

---

# Dependencies & Prerequisites

## Technical Dependencies

| Dependency | Required For | Notes |
|------------|--------------|-------|
| Email service (Resend/SendGrid) | Notifications | Need API key setup |
| Puppeteer/Chromium | PDF generation | Vercel configuration |
| Supabase Realtime | Live collaboration | Already available |
| External APIs | Vendor intelligence | LinkedIn, Crunchbase keys |

## Infrastructure Considerations

1. **Database**: No schema changes require downtime
2. **API**: Vercel serverless scales automatically
3. **Storage**: Existing Supabase storage sufficient
4. **Performance**: May need caching for benchmarking queries

---

# Success Metrics

| Metric | Baseline | v1.1 Target | v2.0 Target |
|--------|----------|-------------|-------------|
| Evaluation setup time | 2-3 days | 4-6 hours | 1-2 hours |
| Time per vendor review | 4-6 hours | 2-3 hours | 1-2 hours |
| Workshop-to-requirements time | 2 days | Same day | Real-time |
| Vendor response rate | Unknown | 85% | 95% |
| Report generation time | 30 min | 5 min | 2 min |
| Mobile score capture | 0% | 0% | 50% |

---

# Risk Mitigation

| Risk | Mitigation |
|------|------------|
| AI costs scaling | Token tracking, usage limits, caching |
| External API rate limits | Caching, queue-based fetching |
| Mobile offline sync conflicts | Last-write-wins with audit log |
| Real-time scalability | Supabase handles, monitor usage |
| Template quality | Start with 3-4 well-tested templates |

---

*Document maintained by: Product Team*
*Last updated: 08 January 2026*
