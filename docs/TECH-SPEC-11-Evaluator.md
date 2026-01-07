# AMSF001 Technical Specification: Evaluator Module

**Document:** TECH-SPEC-11-Evaluator.md  
**Version:** 1.0  
**Created:** 7 January 2026  
**Updated:** 7 January 2026  
**Status:** New - Initial Creation

---

> **📝 Version 1.0 (7 January 2026)**
> 
> Initial creation of Evaluator module documentation.
> - Comprehensive database schema for 24 tables
> - Frontend architecture (15 pages, 1 context)
> - Service layer (18 services)
> - API endpoints (8 Vercel Edge Functions)
> - Integration with existing multi-tenancy model

---

## 1. Overview

The **Evaluator Module** is a complete vendor evaluation and procurement tool that operates parallel to the main Project Tracker. It enables organisations to conduct structured IT vendor assessments, manage RFP processes, and make data-driven procurement decisions.

### 1.1 Module Summary

| Component | Count | Description |
|-----------|-------|-------------|
| Database Tables | 24 | Complete evaluation data model |
| Frontend Pages | 15 | React pages with CSS modules |
| Services | 18 | Business logic layer |
| API Endpoints | 8 | AI-powered features + auth |
| Contexts | 1 | EvaluationContext for state |

### 1.2 Key Capabilities

- **Requirements Management** - Capture, categorise, and approve evaluation requirements
- **Vendor Assessment** - Structured vendor evaluation with scoring scales
- **Workshop Facilitation** - Plan and track stakeholder workshops
- **Survey System** - Pre/post workshop questionnaires
- **AI Features** - Document parsing, gap analysis, requirement suggestions
- **Scoring & Consensus** - Individual and consensus scoring mechanisms
- **Evidence Management** - Track supporting evidence for scores
- **Traceability** - Link requirements → criteria → questions → responses
- **Portals** - Client and vendor portal access

### 1.3 Multi-Tenancy Integration

The Evaluator module follows the same three-tier multi-tenancy as the Project Tracker:

```
organisations (top-level tenant)
    │
    └── evaluation_projects (org-scoped - parallel to projects)
            │
            ├── evaluation_project_users (membership + roles)
            │
            └── [all evaluator entity tables scoped by evaluation_project_id]
```

---

## 2. Database Schema - Core Tables

### 2.1 evaluation_projects

Main container for vendor evaluation projects. Operates parallel to `projects` table (not nested within it).

```sql
CREATE TABLE IF NOT EXISTS evaluation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_name VARCHAR(255),
  client_logo_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'setup'
    CHECK (status IN ('setup', 'discovery', 'requirements', 'evaluation', 'complete', 'on_hold', 'cancelled')),
  target_start_date DATE,
  target_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  branding JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{
    "requireApproval": true,
    "allowVendorPortal": true,
    "scoringScale": 5,
    "requireEvidence": true,
    "allowAIFeatures": true
  }'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

**Status Workflow:** `setup → discovery → requirements → evaluation → complete`

### 2.2 evaluation_project_users

Junction table for evaluation project membership with role-based access.

```sql
CREATE TABLE IF NOT EXISTS evaluation_project_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'evaluator'
    CHECK (role IN ('owner', 'admin', 'evaluator', 'observer', 'vendor_liaison')),
  permissions JSONB DEFAULT '{}'::jsonb,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(evaluation_project_id, user_id)
);
```

**Roles:**
| Role | Description |
|------|-------------|
| `owner` | Full control, can delete project |
| `admin` | Manage users, settings, all content |
| `evaluator` | Score vendors, add evidence |
| `observer` | Read-only access |
| `vendor_liaison` | Manage vendor communications |


### 2.3 stakeholder_areas

Categories of stakeholder groups participating in the evaluation.

```sql
CREATE TABLE IF NOT EXISTS stakeholder_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  weighting DECIMAL(5,2) DEFAULT 1.0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

### 2.4 evaluation_categories

Hierarchical categories for organising requirements and criteria.

```sql
CREATE TABLE IF NOT EXISTS evaluation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES evaluation_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weighting DECIMAL(5,2) DEFAULT 1.0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  color VARCHAR(20),
  icon VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

### 2.5 scoring_scales

Configurable scoring scales for consistent evaluation.

```sql
CREATE TABLE IF NOT EXISTS scoring_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scale_type VARCHAR(50) NOT NULL DEFAULT 'numeric'
    CHECK (scale_type IN ('numeric', 'letter', 'rag', 'custom')),
  min_value INTEGER NOT NULL DEFAULT 0,
  max_value INTEGER NOT NULL DEFAULT 5,
  scale_values JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Scale Values Example:**
```json
[
  { "value": 0, "label": "Not Met", "color": "#ef4444" },
  { "value": 1, "label": "Partially Met", "color": "#f59e0b" },
  { "value": 2, "label": "Largely Met", "color": "#22c55e" },
  { "value": 3, "label": "Fully Met", "color": "#10b981" }
]
```

---

## 3. Database Schema - Requirements & Criteria

### 3.1 requirements

Core requirements captured during discovery phase.

```sql
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES evaluation_categories(id) ON DELETE SET NULL,
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id) ON DELETE SET NULL,
  source_workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,
  code VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'should_have'
    CHECK (priority IN ('must_have', 'should_have', 'could_have', 'wont_have')),
  type VARCHAR(50) NOT NULL DEFAULT 'functional'
    CHECK (type IN ('functional', 'non_functional', 'technical', 'integration', 'security', 'compliance', 'other')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'proposed', 'approved', 'rejected', 'deferred')),
  weighting DECIMAL(5,2) DEFAULT 1.0,
  acceptance_criteria TEXT,
  notes TEXT,
  -- AI-generated fields
  ai_suggested BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,2),
  ai_source_text TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

**Priority (MoSCoW):**
- `must_have` - Critical requirements
- `should_have` - Important but not critical
- `could_have` - Nice to have
- `wont_have` - Out of scope for this evaluation


### 3.2 requirement_approvals

Approval workflow tracking for requirements.

```sql
CREATE TABLE IF NOT EXISTS requirement_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  approved_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  decision VARCHAR(20) NOT NULL
    CHECK (decision IN ('approved', 'rejected', 'deferred')),
  comments TEXT,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3.3 requirement_comments

Discussion and feedback on requirements.

```sql
CREATE TABLE IF NOT EXISTS requirement_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES requirement_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);
```

### 3.4 evaluation_criteria

Specific evaluation criteria derived from requirements.

```sql
CREATE TABLE IF NOT EXISTS evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES evaluation_categories(id) ON DELETE SET NULL,
  code VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  evaluation_guidance TEXT,
  scoring_scale_id UUID REFERENCES scoring_scales(id) ON DELETE SET NULL,
  weighting DECIMAL(5,2) DEFAULT 1.0,
  max_score INTEGER DEFAULT 5,
  is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

### 3.5 requirement_criteria (Junction)

Links requirements to evaluation criteria for traceability.

```sql
CREATE TABLE IF NOT EXISTS requirement_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requirement_id, criterion_id)
);
```

---

## 4. Database Schema - Workshops & Surveys

### 4.1 workshops

Facilitated sessions for requirements gathering.

```sql
CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  objectives TEXT,
  scheduled_date TIMESTAMPTZ,
  scheduled_duration_minutes INTEGER DEFAULT 60,
  actual_date TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  facilitator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('draft', 'scheduled', 'in_progress', 'complete', 'cancelled')),
  notes TEXT,
  summary TEXT,
  recording_url TEXT,
  location VARCHAR(255),
  meeting_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```


### 4.2 workshop_attendees

Track workshop invitations and attendance.

```sql
CREATE TABLE IF NOT EXISTS workshop_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  external_name VARCHAR(255),
  external_email VARCHAR(255),
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  rsvp_status VARCHAR(20) DEFAULT 'pending'
    CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'tentative')),
  attended BOOLEAN DEFAULT FALSE,
  followup_sent BOOLEAN NOT NULL DEFAULT FALSE,
  followup_sent_at TIMESTAMPTZ,
  followup_completed BOOLEAN NOT NULL DEFAULT FALSE,
  followup_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workshop_id, user_id),
  CHECK (user_id IS NOT NULL OR external_email IS NOT NULL)
);
```

### 4.3 surveys

Questionnaires for structured input collection.

```sql
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'standalone'
    CHECK (type IN ('pre_workshop', 'post_workshop', 'standalone', 'vendor_rfp')),
  linked_workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  allow_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  allow_multiple_responses BOOLEAN NOT NULL DEFAULT FALSE,
  closes_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

**Questions JSONB Structure:**
```json
[
  {
    "id": "q1",
    "type": "text|textarea|number|select|multiselect|rating|yes_no|file",
    "text": "Question text",
    "required": true,
    "options": ["Option 1", "Option 2"],
    "validation": { "minLength": 10 },
    "order": 1
  }
]
```

### 4.4 survey_responses

Individual responses to surveys.

```sql
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  respondent_email VARCHAR(255),
  respondent_name VARCHAR(255),
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'submitted')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Database Schema - Vendors

### 5.1 vendors

Vendor companies being evaluated.

```sql
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50),
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  headquarters_location VARCHAR(255),
  employee_count VARCHAR(50),
  year_founded INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'active', 'withdrawn', 'disqualified', 'shortlisted', 'selected', 'rejected')),
  portal_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  portal_access_token TEXT,
  portal_token_expires_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  response_deadline TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```


### 5.2 vendor_contacts

Contact persons at each vendor.

```sql
CREATE TABLE IF NOT EXISTS vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  job_title VARCHAR(255),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 5.3 vendor_questions

RFP questions sent to vendors.

```sql
CREATE TABLE IF NOT EXISTS vendor_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'text'
    CHECK (question_type IN (
      'text', 'textarea', 'yes_no', 'multiple_choice',
      'multi_select', 'number', 'date', 'file_upload', 'compliance'
    )),
  options JSONB,
  section VARCHAR(100),
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  max_length INTEGER,
  guidance_for_vendors TEXT,
  scoring_guidance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

### 5.4 vendor_question_links

Links questions to requirements/criteria for traceability.

```sql
CREATE TABLE IF NOT EXISTS vendor_question_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES vendor_questions(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (requirement_id IS NOT NULL OR criterion_id IS NOT NULL)
);
```

### 5.5 vendor_responses

Vendor answers to questions.

```sql
CREATE TABLE IF NOT EXISTS vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  question_id UUID REFERENCES vendor_questions(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  response_text TEXT,
  response_value JSONB,
  compliance_level VARCHAR(50)
    CHECK (compliance_level IS NULL OR compliance_level IN (
      'fully_compliant', 'partially_compliant', 'non_compliant', 'not_applicable', 'roadmap'
    )),
  compliance_notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'updated')),
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vendor_id, question_id),
  CHECK (question_id IS NOT NULL OR requirement_id IS NOT NULL)
);
```

### 5.6 vendor_documents

Documents uploaded by vendors.

```sql
CREATE TABLE IF NOT EXISTS vendor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(50) NOT NULL DEFAULT 'other'
    CHECK (document_type IN (
      'rfp_response', 'technical_spec', 'pricing', 'reference',
      'demo_recording', 'case_study', 'certification', 'contract_sample', 'other'
    )),
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_via VARCHAR(20) DEFAULT 'portal'
    CHECK (uploaded_via IN ('portal', 'internal')),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

### 5.7 vendor_response_attachments

Links documents to specific vendor responses.

```sql
CREATE TABLE IF NOT EXISTS vendor_response_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES vendor_responses(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES vendor_documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(response_id, document_id)
);
```


---

## 6. Database Schema - Scoring & Evidence

### 6.1 evidence

Supporting evidence for evaluation scores.

```sql
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  evidence_type VARCHAR(50) NOT NULL DEFAULT 'document'
    CHECK (evidence_type IN (
      'document', 'demo', 'reference_call', 'site_visit', 'poc', 'interview', 'other'
    )),
  source_url TEXT,
  file_url TEXT,
  file_path TEXT,
  captured_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

### 6.2 evidence_links

Links evidence to requirements/criteria.

```sql
CREATE TABLE IF NOT EXISTS evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES requirements(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (requirement_id IS NOT NULL OR criterion_id IS NOT NULL)
);
```

### 6.3 scores

Individual evaluator scores for vendors against criteria.

```sql
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL DEFAULT 5,
  confidence VARCHAR(20)
    CHECK (confidence IS NULL OR confidence IN ('low', 'medium', 'high')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vendor_id, criterion_id, evaluator_id)
);
```

### 6.4 score_evidence

Links specific evidence to scores.

```sql
CREATE TABLE IF NOT EXISTS score_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id UUID NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(score_id, evidence_id)
);
```

### 6.5 consensus_scores

Agreed consensus scores after evaluation discussions.

```sql
CREATE TABLE IF NOT EXISTS consensus_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) NOT NULL DEFAULT 5,
  rationale TEXT,
  decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vendor_id, criterion_id)
);
```

### 6.6 consensus_score_sources

Links consensus scores to individual contributing scores.

```sql
CREATE TABLE IF NOT EXISTS consensus_score_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consensus_score_id UUID NOT NULL REFERENCES consensus_scores(id) ON DELETE CASCADE,
  individual_score_id UUID NOT NULL REFERENCES scores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(consensus_score_id, individual_score_id)
);
```


---

## 7. Database Schema - Documents & Audit

### 7.1 evaluation_documents

Documents uploaded to the evaluation project.

```sql
CREATE TABLE IF NOT EXISTS evaluation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(50) NOT NULL DEFAULT 'other'
    CHECK (document_type IN (
      'rfp', 'sow', 'requirements_doc', 'scoring_template',
      'vendor_response', 'meeting_notes', 'report', 'contract', 'other'
    )),
  file_url TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  -- AI processing fields
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_processed_at TIMESTAMPTZ,
  ai_extracted_text TEXT,
  ai_summary TEXT,
  ai_requirements_extracted JSONB,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);
```

### 7.2 evaluation_audit_log (ai_tasks)

Audit trail for AI operations and system activities.

```sql
CREATE TABLE IF NOT EXISTS ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL
    CHECK (task_type IN (
      'document_parse', 'requirement_suggest', 'gap_analysis',
      'market_research', 'report_generate', 'other'
    )),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  tokens_used INTEGER,
  model_used VARCHAR(100),
  initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 8. Table Summary

| # | Table | Purpose | Parent |
|---|-------|---------|--------|
| 1 | evaluation_projects | Main evaluation containers | organisations |
| 2 | evaluation_project_users | Team membership | evaluation_projects |
| 3 | stakeholder_areas | Stakeholder categorisation | evaluation_projects |
| 4 | evaluation_categories | Requirement/criteria taxonomy | evaluation_projects |
| 5 | scoring_scales | Scoring definitions | evaluation_projects |
| 6 | workshops | Discovery sessions | evaluation_projects |
| 7 | workshop_attendees | Workshop participation | workshops |
| 8 | surveys | Questionnaires | evaluation_projects |
| 9 | survey_responses | Survey answers | surveys |
| 10 | requirements | Business requirements | evaluation_projects |
| 11 | requirement_approvals | Approval workflow | requirements |
| 12 | requirement_comments | Discussions | requirements |
| 13 | requirement_criteria | Req-criteria links | requirements/evaluation_criteria |
| 14 | evaluation_criteria | Scoring criteria | evaluation_projects |
| 15 | vendors | Vendor companies | evaluation_projects |
| 16 | vendor_contacts | Vendor contacts | vendors |
| 17 | vendor_questions | RFP questions | evaluation_projects |
| 18 | vendor_question_links | Question-req links | vendor_questions |
| 19 | vendor_responses | Vendor answers | vendors |
| 20 | vendor_documents | Vendor uploads | vendors |
| 21 | vendor_response_attachments | Response-doc links | vendor_responses |
| 22 | evidence | Supporting evidence | evaluation_projects |
| 23 | evidence_links | Evidence-req links | evidence |
| 24 | scores | Individual scores | evaluation_projects |
| 25 | score_evidence | Score-evidence links | scores |
| 26 | consensus_scores | Agreed scores | evaluation_projects |
| 27 | consensus_score_sources | Consensus-score links | consensus_scores |
| 28 | evaluation_documents | Project documents | evaluation_projects |
| 29 | ai_tasks | AI operation audit | evaluation_projects |

**Total: 29 tables** (including junction tables)


---

## 9. Frontend Architecture

### 9.1 EvaluationContext

Central state management for evaluator module.

**Location:** `/src/contexts/EvaluationContext.jsx`

```jsx
const EvaluationContext = createContext();

export function EvaluationProvider({ children }) {
  const [evaluationProject, setEvaluationProject] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [userRole, setUserRole] = useState(null);
  
  // ... provider implementation
}

export const useEvaluation = () => useContext(EvaluationContext);
```

**Key State:**
- `evaluationProject` - Current evaluation project
- `requirements` - Requirements list with filters
- `vendors` - Vendors being evaluated
- `criteria` - Evaluation criteria
- `userRole` - Current user's role in the evaluation

### 9.2 Frontend Pages

| # | Page | Route | Purpose |
|---|------|-------|---------|
| 1 | EvaluatorDashboard | `/evaluator` | Module dashboard |
| 2 | EvaluationHub | `/evaluator/:id` | Project overview |
| 3 | EvaluationSettings | `/evaluator/:id/settings` | Project configuration |
| 4 | RequirementsHub | `/evaluator/:id/requirements` | Requirements management |
| 5 | RequirementDetail | `/evaluator/:id/requirements/:reqId` | Single requirement |
| 6 | VendorsHub | `/evaluator/:id/vendors` | Vendor management |
| 7 | VendorDetail | `/evaluator/:id/vendors/:vendorId` | Single vendor |
| 8 | WorkshopsHub | `/evaluator/:id/workshops` | Workshop management |
| 9 | WorkshopDetail | `/evaluator/:id/workshops/:workshopId` | Single workshop |
| 10 | QuestionsHub | `/evaluator/:id/questions` | RFP questions |
| 11 | DocumentsHub | `/evaluator/:id/documents` | Document management |
| 12 | TraceabilityView | `/evaluator/:id/traceability` | Req-criteria matrix |
| 13 | ReportsHub | `/evaluator/:id/reports` | Report generation |
| 14 | ClientPortal | `/evaluator/client/:token` | Client-facing portal |
| 15 | VendorPortal | `/evaluator/vendor/:token` | Vendor response portal |

### 9.3 Page Descriptions

**EvaluatorDashboard**
- Lists all evaluation projects for the organisation
- Quick-create new evaluation
- Status overview cards

**RequirementsHub**
- List, filter, and manage requirements
- Drag-and-drop categorisation
- Bulk approval workflow
- AI-powered requirement suggestions

**VendorsHub**
- Vendor onboarding and status tracking
- Portal access management
- Score summary per vendor

**TraceabilityView**
- Matrix view: requirements vs. criteria
- Coverage analysis
- Gap identification

**ClientPortal / VendorPortal**
- Token-authenticated external access
- Branded interface
- Limited, role-appropriate functionality

---

## 10. Services Layer

### 10.1 Service Architecture

All evaluator services follow the base service pattern with Supabase client.

**Location:** `/src/services/evaluator/`

**Barrel Export:** `/src/services/evaluator/index.js`

```javascript
export * from './evaluationProjects.service';
export * from './requirements.service';
export * from './vendors.service';
// ... etc
```

### 10.2 Service Inventory

| # | Service | Purpose |
|---|---------|---------|
| 1 | ai.service.js | AI feature orchestration |
| 2 | approvals.service.js | Requirement approval workflow |
| 3 | base.evaluator.service.js | Base class for evaluator services |
| 4 | clientPortal.service.js | Client portal access/data |
| 5 | comments.service.js | Requirement comments |
| 6 | emailNotifications.service.js | Email delivery |
| 7 | evaluationCategories.service.js | Category CRUD |
| 8 | evaluationDocuments.service.js | Document management |
| 9 | evaluationProjects.service.js | Project CRUD |
| 10 | evidence.service.js | Evidence management |
| 11 | requirements.service.js | Requirements CRUD |
| 12 | scores.service.js | Scoring operations |
| 13 | stakeholderAreas.service.js | Stakeholder CRUD |
| 14 | surveys.service.js | Survey management |
| 15 | traceability.service.js | Traceability matrix |
| 16 | vendorQuestions.service.js | RFP questions |
| 17 | vendors.service.js | Vendor CRUD |
| 18 | workshops.service.js | Workshop management |

**Total: 18 services**


---

## 11. API Endpoints

### 11.1 Endpoint Architecture

All evaluator APIs are Vercel Edge Functions using Claude AI.

**Location:** `/api/evaluator/`

### 11.2 Endpoint Inventory

| # | Endpoint | Method | Purpose |
|---|----------|--------|---------|
| 1 | ai-document-parse | POST | Extract text/requirements from uploaded documents |
| 2 | ai-gap-analysis | POST | Identify gaps in requirements vs. criteria |
| 3 | ai-market-research | POST | Research vendor market landscape |
| 4 | ai-requirement-suggest | POST | Generate requirement suggestions |
| 5 | client-portal-auth | POST | Authenticate client portal access |
| 6 | create-evaluation | POST | Create new evaluation project |
| 7 | generate-report | POST | Generate evaluation report |
| 8 | vendor-portal-auth | POST | Authenticate vendor portal access |

### 11.3 AI Document Parse

**Endpoint:** `POST /api/evaluator/ai-document-parse`

Extracts structured data from uploaded documents using Claude.

**Request:**
```json
{
  "documentId": "uuid",
  "extractionType": "requirements|summary|both"
}
```

**Response:**
```json
{
  "success": true,
  "extractedText": "...",
  "summary": "...",
  "requirements": [
    {
      "title": "Extracted requirement",
      "description": "...",
      "priority": "should_have",
      "type": "functional",
      "confidence": 0.85
    }
  ]
}
```

### 11.4 AI Requirement Suggest

**Endpoint:** `POST /api/evaluator/ai-requirement-suggest`

Suggests additional requirements based on context.

**Request:**
```json
{
  "evaluationProjectId": "uuid",
  "category": "optional filter",
  "context": "additional context"
}
```

### 11.5 Portal Authentication

Both client and vendor portals use token-based authentication:

```javascript
// Token validation flow
const validatePortalToken = async (token, type) => {
  const { data, error } = await supabase
    .from(type === 'client' ? 'evaluation_projects' : 'vendors')
    .select('*')
    .eq('portal_access_token', token)
    .gt('portal_token_expires_at', new Date().toISOString())
    .single();
  
  return data;
};
```

---

## 12. RLS Security

All evaluator tables implement Row Level Security.

### 12.1 Core Security Pattern

```sql
-- Evaluator project access helper
CREATE OR REPLACE FUNCTION can_access_evaluation(eval_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM evaluation_project_users
    WHERE evaluation_project_id = eval_project_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 12.2 Example Policy

```sql
-- Requirements table RLS
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requirements in their evaluations"
  ON requirements FOR SELECT
  USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "Admins can manage requirements"
  ON requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM evaluation_project_users
      WHERE evaluation_project_id = requirements.evaluation_project_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

### 12.3 Role-Based Access

| Role | View | Create | Update | Delete |
|------|------|--------|--------|--------|
| owner | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ |
| evaluator | ✅ | ✅ | Own only | ❌ |
| observer | ✅ | ❌ | ❌ | ❌ |
| vendor_liaison | ✅ | Vendors only | Vendors only | ❌ |

---

## 13. Storage

### 13.1 Supabase Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| evaluation-documents | Project documents | RLS via evaluation access |
| vendor-documents | Vendor uploads | RLS via vendor access |

### 13.2 File Upload Pattern

```javascript
const uploadDocument = async (file, evaluationProjectId) => {
  const path = `${evaluationProjectId}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('evaluation-documents')
    .upload(path, file);
    
  return data?.path;
};
```

---

## Appendix A: Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          EVALUATOR MODULE ERD                           │
└─────────────────────────────────────────────────────────────────────────┘

organisations
    │
    └── evaluation_projects
            │
            ├── evaluation_project_users
            ├── stakeholder_areas
            ├── evaluation_categories (self-referencing hierarchy)
            ├── scoring_scales
            │
            ├── workshops ─────┬── workshop_attendees
            │                  └── surveys (linked) ─── survey_responses
            │
            ├── requirements ──┬── requirement_approvals
            │                  ├── requirement_comments
            │                  └── requirement_criteria ──┐
            │                                             │
            ├── evaluation_criteria ──────────────────────┘
            │
            ├── vendors ───────┬── vendor_contacts
            │                  ├── vendor_responses ──── vendor_response_attachments
            │                  └── vendor_documents
            │
            ├── vendor_questions ── vendor_question_links
            │
            ├── evidence ────── evidence_links
            │
            ├── scores ──────── score_evidence
            │
            ├── consensus_scores ── consensus_score_sources
            │
            ├── evaluation_documents
            │
            └── ai_tasks (audit log)
```

---

## Appendix B: Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 7 January 2026 | Initial creation - complete module documentation |

---

*End of TECH-SPEC-11-Evaluator.md*
