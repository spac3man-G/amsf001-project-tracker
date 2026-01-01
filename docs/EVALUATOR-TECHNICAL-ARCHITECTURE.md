# Evaluator Tool - Technical Architecture

## Overview

The Evaluator is a new tool within the AMSF001 Project Tracker application designed to support technology procurement evaluation projects. It enables structured requirements gathering, vendor assessment, and traceable decision-making with full audit trails.

This document describes how Evaluator integrates with and extends the existing application architecture.

---

## Architecture Principles (Aligned with Existing App)

### 1. Multi-Tenancy Model

Evaluator follows the existing three-tier hierarchy but adds a fourth tier:

```
Organisation (Tier 1)     →  Company or consultancy (e.g., Smart Consulting)
    └── Project (Tier 2)  →  Existing project management (unchanged)
    └── EvaluationProject (Tier 2b) →  New: Evaluation engagement
        └── Entity (Tier 3)  →  Requirements, Vendors, Scores, etc.
```

**Key Decision:** EvaluationProject is a peer to Project, not a child. This allows:
- Evaluations to exist independently of delivery projects
- Different permission models for evaluation vs delivery
- Clean separation of concerns
- Future possibility to link evaluation outcomes to delivery projects

### 2. Data Isolation

- All evaluation data is scoped by `evaluation_project_id`
- Row Level Security (RLS) enforces access at database level
- Organisation admins can access all evaluations in their organisation
- Evaluation members have role-based access

### 3. Technology Stack (Unchanged)

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | React 18, Vite, React Router | Same as existing |
| **Styling** | Custom CSS, Lucide Icons | Design system extended |
| **State** | React Context | New contexts for evaluation |
| **Backend** | Supabase (PostgreSQL, Auth, RLS) | New tables, same patterns |
| **API** | Vercel Serverless Functions | New endpoints for AI features |
| **AI** | Claude API | Requirements analysis, market research |

---

## Database Schema

### New Tables

#### Core Evaluation Tables

```sql
-- Evaluation Projects (parallel to projects table)
CREATE TABLE evaluation_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  client_name VARCHAR(255),
  client_logo_url TEXT,
  status VARCHAR(50) DEFAULT 'setup',  -- setup, discovery, requirements, evaluation, complete
  target_start_date DATE,
  target_end_date DATE,
  branding JSONB DEFAULT '{}',  -- Custom branding for client portal
  settings JSONB DEFAULT '{}',  -- Project-specific settings
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id)
);

-- User access to evaluation projects
CREATE TABLE evaluation_project_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  role VARCHAR(50) NOT NULL,  -- admin, evaluator, client_stakeholder, participant, vendor
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id),
  permissions JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(evaluation_project_id, user_id)
);

-- Stakeholder areas (departments/functions being consulted)
CREATE TABLE stakeholder_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Evaluation categories (weighted scoring categories)
CREATE TABLE evaluation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) DEFAULT 0,  -- Percentage weight
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Scoring scale definitions
CREATE TABLE scoring_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  value INTEGER NOT NULL,  -- 1-5 typically
  label VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Input Capture Tables

```sql
-- Workshops
CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ,
  actual_date TIMESTAMPTZ,
  facilitator_id UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'scheduled',  -- scheduled, in_progress, complete
  notes TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Workshop attendees
CREATE TABLE workshop_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id),
  attended BOOLEAN DEFAULT FALSE,
  followup_sent BOOLEAN DEFAULT FALSE,
  followup_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surveys/Forms
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'standalone',  -- pre_workshop, post_workshop, standalone
  linked_workshop_id UUID REFERENCES workshops(id),
  status VARCHAR(50) DEFAULT 'draft',  -- draft, active, closed
  questions JSONB DEFAULT '[]',  -- Array of question definitions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Survey responses
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id),
  respondent_id UUID NOT NULL REFERENCES profiles(id),
  answers JSONB DEFAULT '[]',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded documents (for AI parsing)
CREATE TABLE evaluation_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50),  -- strategy_doc, existing_rfp, other
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES profiles(id),
  parsed_at TIMESTAMPTZ,
  parse_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);
```

#### Requirements Tables

```sql
-- Requirements
CREATE TABLE requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  reference_code VARCHAR(20) NOT NULL,  -- REQ-001, REQ-002, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES evaluation_categories(id),
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id),
  priority VARCHAR(20) DEFAULT 'should_have',  -- must_have, should_have, could_have, wont_have
  status VARCHAR(20) DEFAULT 'draft',  -- draft, under_review, approved, rejected
  
  -- Provenance tracking
  source_type VARCHAR(20),  -- workshop, survey, document, ai, manual
  source_workshop_id UUID REFERENCES workshops(id),
  source_survey_response_id UUID REFERENCES survey_responses(id),
  source_document_id UUID REFERENCES evaluation_documents(id),
  raised_by UUID REFERENCES profiles(id),
  
  -- Validation
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id),
  validation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id)
);

-- Evaluation criteria (linkable to requirements)
CREATE TABLE evaluation_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  category_id UUID REFERENCES evaluation_categories(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) DEFAULT 0,  -- Weight within category
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Link requirements to criteria
CREATE TABLE requirement_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id),
  criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requirement_id, criterion_id)
);
```


#### Vendor Tables

```sql
-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website TEXT,
  status VARCHAR(50) DEFAULT 'identified',  -- identified, long_list, short_list, rfp_issued, response_received, under_evaluation, selected, rejected
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID REFERENCES profiles(id),
  portal_enabled BOOLEAN DEFAULT FALSE,
  portal_access_code VARCHAR(100),
  portal_access_expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Vendor contacts
CREATE TABLE vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  user_id UUID REFERENCES profiles(id),  -- If they have an account
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions to vendors (RFP questions)
CREATE TABLE vendor_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'text',  -- text, multiple_choice, yes_no, file_upload
  options JSONB,  -- For multiple choice
  is_required BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Link questions to requirements/criteria
CREATE TABLE vendor_question_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES vendor_questions(id),
  requirement_id UUID REFERENCES requirements(id),
  criterion_id UUID REFERENCES evaluation_criteria(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor responses to questions
CREATE TABLE vendor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  question_id UUID REFERENCES vendor_questions(id),
  requirement_id UUID REFERENCES requirements(id),  -- Direct requirement response
  response_text TEXT,
  compliance_level VARCHAR(50),  -- fully_compliant, partially_compliant, non_compliant, not_applicable
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor document uploads
CREATE TABLE vendor_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50),  -- rfp_response, technical_spec, pricing, reference, demo, other
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Link documents to responses
CREATE TABLE vendor_response_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES vendor_responses(id),
  document_id UUID NOT NULL REFERENCES vendor_documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Evidence & Evaluation Tables

```sql
-- Evidence items (demo notes, reference checks, market research)
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  type VARCHAR(50) NOT NULL,  -- vendor_response, demo_notes, reference_check, market_research, ai_analysis, other
  title VARCHAR(255) NOT NULL,
  content TEXT,
  source_vendor_response_id UUID REFERENCES vendor_responses(id),
  source_vendor_document_id UUID REFERENCES vendor_documents(id),
  captured_by UUID REFERENCES profiles(id),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Link evidence to requirements/criteria
CREATE TABLE evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidence(id),
  requirement_id UUID REFERENCES requirements(id),
  criterion_id UUID REFERENCES evaluation_criteria(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual evaluator scores
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id),
  evaluator_id UUID NOT NULL REFERENCES profiles(id),
  score_value INTEGER NOT NULL,  -- 1-5 typically
  rationale TEXT,
  status VARCHAR(20) DEFAULT 'draft',  -- draft, submitted
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, criterion_id, evaluator_id)
);

-- Score evidence links
CREATE TABLE score_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id UUID NOT NULL REFERENCES scores(id),
  evidence_id UUID NOT NULL REFERENCES evidence(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consensus scores (after reconciliation)
CREATE TABLE consensus_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  criterion_id UUID NOT NULL REFERENCES evaluation_criteria(id),
  consensus_value INTEGER NOT NULL,
  consensus_rationale TEXT,
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, criterion_id)
);

-- Link individual scores to consensus
CREATE TABLE consensus_score_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consensus_score_id UUID NOT NULL REFERENCES consensus_scores(id),
  score_id UUID NOT NULL REFERENCES scores(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### AI & Audit Tables

```sql
-- AI task tracking
CREATE TABLE ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  task_type VARCHAR(50) NOT NULL,  -- document_parse, gap_analysis, market_research, requirement_suggestion, vendor_analysis
  status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, complete, failed
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluation audit log (extends existing audit_log pattern)
CREATE TABLE evaluation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID NOT NULL REFERENCES evaluation_projects(id),
  user_id UUID REFERENCES profiles(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  previous_value JSONB,
  new_value JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security (RLS) Policies

Following the existing app pattern:

```sql
-- Example: Requirements table policies

-- View policy: Evaluation project membership required
CREATE POLICY "requirements_view" ON requirements
FOR SELECT TO authenticated
USING (
  evaluation_project_id IN (
    SELECT evaluation_project_id FROM evaluation_project_users 
    WHERE user_id = auth.uid()
  )
  OR
  -- Org admins can see all in their org
  EXISTS (
    SELECT 1 FROM evaluation_projects ep
    JOIN user_organisations uo ON ep.organisation_id = uo.organisation_id
    WHERE ep.id = requirements.evaluation_project_id
    AND uo.user_id = auth.uid()
    AND uo.role IN ('org_owner', 'org_admin')
  )
);

-- Modify policy: Role restricted
CREATE POLICY "requirements_modify" ON requirements
FOR ALL TO authenticated
USING (
  evaluation_project_id IN (
    SELECT evaluation_project_id FROM evaluation_project_users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'evaluator')
  )
);
```

---

## Service Layer

### Base Service Extension

Evaluator services extend `BaseService` with evaluation-project scoping:

```javascript
// src/services/evaluator/base.evaluator.service.js

import { BaseService } from '../base.service';

export class EvaluatorBaseService extends BaseService {
  constructor(tableName, options = {}) {
    super(tableName, {
      ...options,
      projectField: 'evaluation_project_id'  // Override default project_id
    });
  }

  // Override to use evaluation_project_id
  async getAll(evaluationProjectId, options = {}) {
    return super.getAll(evaluationProjectId, {
      ...options,
      projectField: 'evaluation_project_id'
    });
  }
}
```

### Service Structure

```
src/services/
├── base.service.js                    # Existing (unchanged)
├── evaluator/
│   ├── index.js                       # Export all evaluator services
│   ├── base.evaluator.service.js      # Extended base for evaluation scoping
│   ├── evaluationProjects.service.js  # Evaluation project CRUD
│   ├── requirements.service.js        # Requirements management
│   ├── workshops.service.js           # Workshop management
│   ├── surveys.service.js             # Survey/form management
│   ├── vendors.service.js             # Vendor pipeline
│   ├── vendorPortal.service.js        # Vendor portal operations
│   ├── evidence.service.js            # Evidence collection
│   ├── scores.service.js              # Scoring and consensus
│   └── traceability.service.js        # Traceability matrix queries
```


### Example Service Implementation

```javascript
// src/services/evaluator/requirements.service.js

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

export class RequirementsService extends EvaluatorBaseService {
  constructor() {
    super('requirements', {
      supportsSoftDelete: true,
      sanitizeConfig: 'requirement'
    });
  }

  /**
   * Get all requirements with category and stakeholder area details
   */
  async getAllWithDetails(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('requirements')
        .select(`
          *,
          category:evaluation_categories(id, name, weight),
          stakeholder_area:stakeholder_areas(id, name),
          raised_by_profile:profiles!raised_by(id, full_name, email),
          source_workshop:workshops(id, name, scheduled_date)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('reference_code', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('RequirementsService getAllWithDetails error:', error);
      throw error;
    }
  }

  /**
   * Get requirements by stakeholder area
   */
  async getByStakeholderArea(evaluationProjectId, stakeholderAreaId) {
    return this.getAll(evaluationProjectId, {
      filters: [{ column: 'stakeholder_area_id', operator: 'eq', value: stakeholderAreaId }],
      orderBy: { column: 'reference_code', ascending: true }
    });
  }

  /**
   * Get requirements by category
   */
  async getByCategory(evaluationProjectId, categoryId) {
    return this.getAll(evaluationProjectId, {
      filters: [{ column: 'category_id', operator: 'eq', value: categoryId }],
      orderBy: { column: 'reference_code', ascending: true }
    });
  }

  /**
   * Get requirements summary for dashboard
   */
  async getSummary(evaluationProjectId) {
    const requirements = await this.getAll(evaluationProjectId);
    
    return {
      total: requirements.length,
      byStatus: {
        draft: requirements.filter(r => r.status === 'draft').length,
        under_review: requirements.filter(r => r.status === 'under_review').length,
        approved: requirements.filter(r => r.status === 'approved').length,
        rejected: requirements.filter(r => r.status === 'rejected').length
      },
      byPriority: {
        must_have: requirements.filter(r => r.priority === 'must_have').length,
        should_have: requirements.filter(r => r.priority === 'should_have').length,
        could_have: requirements.filter(r => r.priority === 'could_have').length,
        wont_have: requirements.filter(r => r.priority === 'wont_have').length
      }
    };
  }

  /**
   * Generate next reference code
   */
  async getNextReferenceCode(evaluationProjectId) {
    const { data } = await supabase
      .from('requirements')
      .select('reference_code')
      .eq('evaluation_project_id', evaluationProjectId)
      .order('reference_code', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return 'REQ-001';
    }

    const lastCode = data[0].reference_code;
    const num = parseInt(lastCode.replace('REQ-', ''), 10);
    return `REQ-${String(num + 1).padStart(3, '0')}`;
  }

  /**
   * Approve requirement (status change with validation)
   */
  async approve(requirementId, userId, notes = null) {
    return this.update(requirementId, {
      status: 'approved',
      validated_at: new Date().toISOString(),
      validated_by: userId,
      validation_notes: notes
    });
  }

  /**
   * Get full traceability chain for a requirement
   */
  async getTraceabilityChain(requirementId) {
    try {
      // Get requirement with source details
      const { data: requirement, error: reqError } = await supabase
        .from('requirements')
        .select(`
          *,
          category:evaluation_categories(id, name),
          stakeholder_area:stakeholder_areas(id, name),
          source_workshop:workshops(id, name, scheduled_date),
          source_survey_response:survey_responses(id, survey:surveys(id, name)),
          source_document:evaluation_documents(id, name),
          raised_by_profile:profiles!raised_by(id, full_name)
        `)
        .eq('id', requirementId)
        .limit(1);

      if (reqError) throw reqError;

      // Get linked criteria
      const { data: criteria } = await supabase
        .from('requirement_criteria')
        .select('criterion:evaluation_criteria(id, name, weight)')
        .eq('requirement_id', requirementId);

      // Get evidence linked to this requirement
      const { data: evidenceLinks } = await supabase
        .from('evidence_links')
        .select('evidence:evidence(id, title, type, vendor_id, captured_at)')
        .eq('requirement_id', requirementId);

      // Get scores for this requirement (via criteria)
      const criterionIds = (criteria || []).map(c => c.criterion?.id).filter(Boolean);
      let scores = [];
      if (criterionIds.length > 0) {
        const { data: scoreData } = await supabase
          .from('scores')
          .select(`
            *,
            evaluator:profiles(id, full_name),
            vendor:vendors(id, name)
          `)
          .in('criterion_id', criterionIds)
          .eq('status', 'submitted');
        scores = scoreData || [];
      }

      return {
        requirement: requirement?.[0],
        criteria: criteria || [],
        evidence: evidenceLinks?.map(e => e.evidence) || [],
        scores
      };
    } catch (error) {
      console.error('RequirementsService getTraceabilityChain error:', error);
      throw error;
    }
  }
}

export const requirementsService = new RequirementsService();
export default requirementsService;
```

---

## Context Providers

### New Contexts for Evaluator

```
src/contexts/
├── AuthContext.jsx                    # Existing (unchanged)
├── OrganisationContext.jsx            # Existing (unchanged)
├── ProjectContext.jsx                 # Existing (unchanged)
├── EvaluationContext.jsx              # NEW: Current evaluation project
├── EvaluationViewAsContext.jsx        # NEW: Role impersonation for evaluator
```

### EvaluationContext Implementation

```javascript
// src/contexts/EvaluationContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useOrganisation } from './OrganisationContext';

const EvaluationContext = createContext(null);

const EVALUATION_STORAGE_KEY = 'amsf_current_evaluation_id';

export function EvaluationProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const { organisationId, isOrgAdmin, isSystemAdmin, isLoading: orgLoading } = useOrganisation();
  
  const [availableEvaluations, setAvailableEvaluations] = useState([]);
  const [currentEvaluationId, setCurrentEvaluationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derive current evaluation and role
  const currentAssignment = useMemo(() => {
    if (!currentEvaluationId || availableEvaluations.length === 0) return null;
    return availableEvaluations.find(a => a.evaluation_project_id === currentEvaluationId) || null;
  }, [currentEvaluationId, availableEvaluations]);

  const currentEvaluation = currentAssignment?.evaluation_project || null;
  const currentEvaluationRole = currentAssignment?.role || null;

  // Fetch user's evaluation projects
  const fetchUserEvaluations = useCallback(async () => {
    if (!user?.id || !organisationId) {
      setAvailableEvaluations([]);
      setCurrentEvaluationId(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let assignments = [];

      if (isOrgAdmin || isSystemAdmin) {
        // Org admins see all evaluations in their org
        const { data: orgEvaluations, error: evalError } = await supabase
          .from('evaluation_projects')
          .select('*')
          .eq('organisation_id', organisationId)
          .eq('is_deleted', false)
          .order('name');

        if (evalError) throw evalError;

        const { data: userAssignments } = await supabase
          .from('evaluation_project_users')
          .select('evaluation_project_id, role, is_default')
          .eq('user_id', user.id);

        const roleMap = {};
        (userAssignments || []).forEach(a => {
          roleMap[a.evaluation_project_id] = { role: a.role, is_default: a.is_default };
        });

        assignments = (orgEvaluations || []).map(ep => ({
          id: `${user.id}-${ep.id}`,
          evaluation_project_id: ep.id,
          role: roleMap[ep.id]?.role || 'admin',
          is_default: roleMap[ep.id]?.is_default || false,
          evaluation_project: ep
        }));
      } else {
        // Regular users see only assigned evaluations
        const { data: userAssignments, error: fetchError } = await supabase
          .from('evaluation_project_users')
          .select(`
            id,
            evaluation_project_id,
            role,
            is_default,
            evaluation_project:evaluation_projects(*)
          `)
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });

        if (fetchError) throw fetchError;

        assignments = (userAssignments || []).filter(
          a => a.evaluation_project?.organisation_id === organisationId &&
               !a.evaluation_project?.is_deleted
        );
      }

      setAvailableEvaluations(assignments);

      // Select evaluation (localStorage → default → first)
      let selectedId = null;
      try {
        const storedId = localStorage.getItem(EVALUATION_STORAGE_KEY);
        if (storedId && assignments.find(a => a.evaluation_project_id === storedId)) {
          selectedId = storedId;
        }
      } catch (e) { /* ignore */ }

      if (!selectedId) {
        const defaultAssignment = assignments.find(a => a.is_default);
        selectedId = defaultAssignment?.evaluation_project_id || assignments[0]?.evaluation_project_id;
      }

      setCurrentEvaluationId(selectedId);
      if (selectedId) {
        try { localStorage.setItem(EVALUATION_STORAGE_KEY, selectedId); } catch (e) { /* ignore */ }
      }

    } catch (err) {
      console.error('Evaluation fetch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, organisationId, isOrgAdmin, isSystemAdmin]);

  useEffect(() => {
    if (!authLoading && !orgLoading) {
      fetchUserEvaluations();
    }
  }, [authLoading, orgLoading, fetchUserEvaluations]);

  const switchEvaluation = useCallback((evaluationId) => {
    const assignment = availableEvaluations.find(a => a.evaluation_project_id === evaluationId);
    if (!assignment) return false;

    setCurrentEvaluationId(evaluationId);
    try { localStorage.setItem(EVALUATION_STORAGE_KEY, evaluationId); } catch (e) { /* ignore */ }
    return true;
  }, [availableEvaluations]);

  const refreshEvaluation = useCallback(async () => {
    if (!currentEvaluationId) return;

    const { data, error: fetchError } = await supabase
      .from('evaluation_projects')
      .select('*')
      .eq('id', currentEvaluationId)
      .single();

    if (!fetchError && data) {
      setAvailableEvaluations(prev => prev.map(a =>
        a.evaluation_project_id === currentEvaluationId
          ? { ...a, evaluation_project: data }
          : a
      ));
    }
  }, [currentEvaluationId]);

  const value = useMemo(() => ({
    currentEvaluation,
    evaluationId: currentEvaluation?.id || null,
    evaluationName: currentEvaluation?.name || null,
    evaluationRole: currentEvaluationRole,
    availableEvaluations,
    hasMultipleEvaluations: availableEvaluations.length > 1,
    switchEvaluation,
    isLoading: isLoading || authLoading || orgLoading,
    error,
    refreshEvaluation,
    refreshEvaluationAssignments: fetchUserEvaluations,
  }), [
    currentEvaluation,
    currentEvaluationRole,
    availableEvaluations,
    switchEvaluation,
    isLoading,
    authLoading,
    orgLoading,
    error,
    refreshEvaluation,
    fetchUserEvaluations,
  ]);

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  );
}

export function useEvaluation() {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluation must be used within an EvaluationProvider');
  }
  return context;
}

export { EvaluationContext };
```


---

## Hooks

### Permission Hook for Evaluator

```javascript
// src/hooks/useEvaluatorPermissions.js

import { useEvaluation } from '../contexts/EvaluationContext';
import { useOrganisation } from '../contexts/OrganisationContext';

// Permission matrix for evaluator roles
const EVALUATOR_PERMISSION_MATRIX = {
  admin: {
    evaluation: { view: true, edit: true, delete: true },
    requirements: { view: true, create: true, edit: true, delete: true, approve: true },
    workshops: { view: true, create: true, edit: true, delete: true, facilitate: true },
    surveys: { view: true, create: true, edit: true, delete: true },
    vendors: { view: true, create: true, edit: true, delete: true },
    scoring: { view: true, score: true, reconcile: true },
    reports: { view: true, generate: true },
    settings: { view: true, edit: true }
  },
  evaluator: {
    evaluation: { view: true, edit: false, delete: false },
    requirements: { view: true, create: true, edit: true, delete: false, approve: false },
    workshops: { view: true, create: true, edit: true, delete: false, facilitate: true },
    surveys: { view: true, create: true, edit: true, delete: false },
    vendors: { view: true, create: false, edit: false, delete: false },
    scoring: { view: true, score: true, reconcile: false },
    reports: { view: true, generate: true },
    settings: { view: true, edit: false }
  },
  client_stakeholder: {
    evaluation: { view: true, edit: false, delete: false },
    requirements: { view: true, create: false, edit: false, delete: false, approve: true },
    workshops: { view: true, create: false, edit: false, delete: false, facilitate: false },
    surveys: { view: true, create: false, edit: false, delete: false },
    vendors: { view: true, create: false, edit: false, delete: false },
    scoring: { view: true, score: false, reconcile: false },
    reports: { view: true, generate: false },
    settings: { view: false, edit: false }
  },
  participant: {
    evaluation: { view: false, edit: false, delete: false },
    requirements: { view: false, create: false, edit: false, delete: false, approve: false },
    workshops: { view: false, create: false, edit: false, delete: false, facilitate: false },
    surveys: { view: true, create: false, edit: false, delete: false },  // Can respond to surveys
    vendors: { view: false, create: false, edit: false, delete: false },
    scoring: { view: false, score: false, reconcile: false },
    reports: { view: false, generate: false },
    settings: { view: false, edit: false }
  },
  vendor: {
    evaluation: { view: false, edit: false, delete: false },
    requirements: { view: true, create: false, edit: false, delete: false, approve: false },  // See requirements to respond
    workshops: { view: false, create: false, edit: false, delete: false, facilitate: false },
    surveys: { view: false, create: false, edit: false, delete: false },
    vendors: { view: false, create: false, edit: false, delete: false },  // Own vendor record managed differently
    scoring: { view: false, score: false, reconcile: false },
    reports: { view: false, generate: false },
    settings: { view: false, edit: false }
  }
};

export function useEvaluatorPermissions() {
  const { evaluationRole } = useEvaluation();
  const { isOrgAdmin, isSystemAdmin } = useOrganisation();
  
  // Effective role (org/system admins get admin role)
  const effectiveRole = (isOrgAdmin || isSystemAdmin) ? 'admin' : (evaluationRole || 'participant');
  
  // Get permission from matrix
  const can = (entity, action) => {
    const rolePerms = EVALUATOR_PERMISSION_MATRIX[effectiveRole];
    return rolePerms?.[entity]?.[action] ?? false;
  };

  return {
    effectiveRole,
    can,
    
    // Convenience methods
    canEditEvaluation: can('evaluation', 'edit'),
    canManageRequirements: can('requirements', 'create'),
    canApproveRequirements: can('requirements', 'approve'),
    canFacilitateWorkshops: can('workshops', 'facilitate'),
    canManageVendors: can('vendors', 'create'),
    canScore: can('scoring', 'score'),
    canReconcileScores: can('scoring', 'reconcile'),
    canGenerateReports: can('reports', 'generate'),
    canEditSettings: can('settings', 'edit'),
    
    // Role checks
    isAdmin: effectiveRole === 'admin',
    isEvaluator: effectiveRole === 'evaluator',
    isClientStakeholder: effectiveRole === 'client_stakeholder',
    isParticipant: effectiveRole === 'participant',
    isVendor: effectiveRole === 'vendor',
  };
}

export default useEvaluatorPermissions;
```

---

## Component Structure

### Directory Structure

```
src/
├── components/
│   ├── common/                     # Existing shared components
│   ├── evaluator/                  # NEW: Evaluator components
│   │   ├── index.js
│   │   ├── EvaluationSwitcher.jsx  # Switch between evaluations
│   │   ├── requirements/
│   │   │   ├── RequirementCard.jsx
│   │   │   ├── RequirementForm.jsx
│   │   │   ├── RequirementMatrix.jsx
│   │   │   └── RequirementFilters.jsx
│   │   ├── workshops/
│   │   │   ├── WorkshopCard.jsx
│   │   │   ├── WorkshopCapture.jsx
│   │   │   └── WorkshopFollowup.jsx
│   │   ├── vendors/
│   │   │   ├── VendorCard.jsx
│   │   │   ├── VendorPipeline.jsx
│   │   │   └── VendorPortalPreview.jsx
│   │   ├── scoring/
│   │   │   ├── ScoringInterface.jsx
│   │   │   ├── ScoreCard.jsx
│   │   │   └── ReconciliationPanel.jsx
│   │   ├── traceability/
│   │   │   ├── TraceabilityMatrix.jsx
│   │   │   ├── TraceabilityDrilldown.jsx
│   │   │   └── TraceabilityChain.jsx
│   │   ├── ai/
│   │   │   ├── AIAssistantPanel.jsx
│   │   │   ├── GapAnalysisResults.jsx
│   │   │   └── MarketResearchResults.jsx
│   │   └── portal/
│   │       ├── ClientDashboard.jsx
│   │       ├── VendorPortalLayout.jsx
│   │       └── VendorResponseForm.jsx
├── pages/
│   ├── evaluator/                  # NEW: Evaluator pages
│   │   ├── EvaluatorDashboard.jsx
│   │   ├── RequirementsHub.jsx
│   │   ├── WorkshopsHub.jsx
│   │   ├── VendorsHub.jsx
│   │   ├── VendorDetail.jsx
│   │   ├── EvaluationHub.jsx
│   │   ├── TraceabilityView.jsx
│   │   ├── ReportsHub.jsx
│   │   └── EvaluationSettings.jsx
│   ├── portal/                     # NEW: External portal pages
│   │   ├── ClientPortal.jsx
│   │   └── VendorPortal.jsx
```

### Using Existing Common Components

Evaluator will leverage existing components from `src/components/common/`:

| Component | Use in Evaluator |
|-----------|-----------------|
| `PageHeader` | All hub pages |
| `Card`, `CardGrid` | Dashboard widgets |
| `StatCard` | Statistics display |
| `DataTable` | Requirements list, vendor list |
| `StatusBadge` | Requirement status, vendor status |
| `FilterBar` | Filtering requirements, vendors |
| `ConfirmDialog` | Delete confirmations |
| `LoadingSpinner`, `Skeleton` | Loading states |
| `ErrorBoundary` | Error handling |
| `Toast` | Success/error notifications |

---

## API Layer (Vercel Serverless Functions)

### New Endpoints

```
api/
├── evaluator/
│   ├── ai-gap-analysis.js        # AI: Analyse requirements for gaps
│   ├── ai-market-research.js     # AI: Research vendor landscape
│   ├── ai-document-parse.js      # AI: Parse uploaded documents
│   ├── ai-requirement-suggest.js # AI: Suggest requirement language
│   ├── ai-vendor-analysis.js     # AI: Analyse vendor responses
│   ├── generate-report.js        # Generate PDF/PPTX reports
│   └── vendor-portal-auth.js     # Vendor portal authentication
```

### Example API Endpoint

```javascript
// api/evaluator/ai-gap-analysis.js

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { evaluationProjectId, evaluationType } = req.body;

  if (!evaluationProjectId) {
    return res.status(400).json({ error: 'evaluationProjectId is required' });
  }

  try {
    // Fetch current requirements
    const { data: requirements, error: reqError } = await supabase
      .from('requirements')
      .select('id, title, description, category:evaluation_categories(name), priority')
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('is_deleted', false);

    if (reqError) throw reqError;

    // Build prompt for gap analysis
    const prompt = `You are an expert technology procurement consultant. 
Analyse the following requirements for a ${evaluationType || 'software'} evaluation project.

Current Requirements:
${requirements.map(r => `- ${r.title}: ${r.description} (${r.category?.name}, ${r.priority})`).join('\n')}

Based on industry best practice for ${evaluationType} evaluations, identify:
1. Potential gaps in the requirements (important areas not covered)
2. Areas that have strong coverage
3. Suggested additional requirements

Return your analysis as JSON with the following structure:
{
  "gaps": [
    {
      "area": "string",
      "description": "string", 
      "suggested_requirement": {
        "title": "string",
        "description": "string",
        "category": "string",
        "priority": "must_have|should_have|could_have"
      }
    }
  ],
  "wellCovered": ["string"],
  "summary": "string"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].text;
    
    // Parse JSON from response (handle markdown code blocks)
    let analysis;
    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || 
                       responseText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return res.status(500).json({ error: 'Failed to parse AI analysis' });
    }

    // Log AI task
    await supabase.from('ai_tasks').insert({
      evaluation_project_id: evaluationProjectId,
      task_type: 'gap_analysis',
      status: 'complete',
      input_data: { requirementCount: requirements.length, evaluationType },
      output_data: analysis,
      completed_at: new Date().toISOString()
    });

    return res.status(200).json(analysis);

  } catch (error) {
    console.error('Gap analysis error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```


---

## Routing

### App.jsx Updates

Evaluator routes added alongside existing routes:

```javascript
// In App.jsx - add to imports
const EvaluatorDashboard = lazy(() => import('./pages/evaluator/EvaluatorDashboard'));
const RequirementsHub = lazy(() => import('./pages/evaluator/RequirementsHub'));
const WorkshopsHub = lazy(() => import('./pages/evaluator/WorkshopsHub'));
const VendorsHub = lazy(() => import('./pages/evaluator/VendorsHub'));
const VendorDetail = lazy(() => import('./pages/evaluator/VendorDetail'));
const EvaluationHub = lazy(() => import('./pages/evaluator/EvaluationHub'));
const TraceabilityView = lazy(() => import('./pages/evaluator/TraceabilityView'));
const EvaluatorReports = lazy(() => import('./pages/evaluator/ReportsHub'));
const EvaluationSettings = lazy(() => import('./pages/evaluator/EvaluationSettings'));
const ClientPortal = lazy(() => import('./pages/portal/ClientPortal'));
const VendorPortal = lazy(() => import('./pages/portal/VendorPortal'));

// In Routes - add evaluator routes
<Route path="evaluator">
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={
    <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
      <EvaluatorDashboard />
    </ProtectedRoute>
  } />
  <Route path="requirements" element={
    <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
      <RequirementsHub />
    </ProtectedRoute>
  } />
  <Route path="workshops" element={
    <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
      <WorkshopsHub />
    </ProtectedRoute>
  } />
  <Route path="vendors" element={
    <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
      <VendorsHub />
    </ProtectedRoute>
  } />
  <Route path="vendors/:vendorId" element={
    <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
      <VendorDetail />
    </ProtectedRoute>
  } />
  <Route path="evaluation" element={
    <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
      <EvaluationHub />
    </ProtectedRoute>
  } />
  <Route path="traceability" element={
    <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
      <TraceabilityView />
    </ProtectedRoute>
  } />
  <Route path="reports" element={
    <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
      <EvaluatorReports />
    </ProtectedRoute>
  } />
  <Route path="settings" element={
    <ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>
      <EvaluationSettings />
    </ProtectedRoute>
  } />
</Route>

// Portal routes (separate authentication flow)
<Route path="portal">
  <Route path="client/:accessCode" element={<ClientPortal />} />
  <Route path="vendor/:accessCode" element={<VendorPortal />} />
</Route>
```

### Navigation Integration

Evaluator appears in the main navigation for users with appropriate roles:

```javascript
// In Layout.jsx - navigation items
const EVALUATOR_NAV_ITEMS = [
  { path: '/evaluator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/evaluator/requirements', label: 'Requirements', icon: ClipboardList },
  { path: '/evaluator/workshops', label: 'Workshops', icon: Users },
  { path: '/evaluator/vendors', label: 'Vendors', icon: Building },
  { path: '/evaluator/evaluation', label: 'Evaluation', icon: CheckSquare },
  { path: '/evaluator/traceability', label: 'Traceability', icon: GitBranch },
  { path: '/evaluator/reports', label: 'Reports', icon: FileText },
];
```

---

## Vendor Portal Architecture

### Authentication Flow

Vendors don't need full accounts - they use access codes:

```
1. Admin creates vendor → Portal access code generated
2. Vendor receives email with portal URL + code
3. Vendor clicks link → /portal/vendor/{accessCode}
4. System validates code → Creates temporary session
5. Vendor interacts with portal → Session tied to vendor record
6. Responses saved with vendor_id, no user_id needed
```

### Portal Security

```javascript
// api/evaluator/vendor-portal-auth.js

export default async function handler(req, res) {
  const { accessCode } = req.body;

  // Find vendor by access code
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('id, name, evaluation_project_id, portal_access_expires_at')
    .eq('portal_access_code', accessCode)
    .eq('portal_enabled', true)
    .single();

  if (error || !vendor) {
    return res.status(401).json({ error: 'Invalid access code' });
  }

  // Check expiry
  if (vendor.portal_access_expires_at && new Date(vendor.portal_access_expires_at) < new Date()) {
    return res.status(401).json({ error: 'Access code has expired' });
  }

  // Create session token (JWT)
  const token = jwt.sign(
    { 
      vendorId: vendor.id, 
      evaluationProjectId: vendor.evaluation_project_id,
      type: 'vendor_portal' 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return res.status(200).json({ 
    token, 
    vendor: { id: vendor.id, name: vendor.name }
  });
}
```

### Client Portal

Similar pattern for client stakeholders who may not have full system accounts.

---

## Data Flow Diagrams

### Requirements Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REQUIREMENTS DATA FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUTS                           REQUIREMENTS                   │
│                                                                  │
│  Workshop ─────────────────────────┐                            │
│    (live capture)                  │                            │
│                                    ▼                            │
│  Survey Response ──────────────▶ Requirement                    │
│    (post-workshop)                 │                            │
│                                    │  ┌─────────────────────┐   │
│  Document Parse ───────────────────┤  │ • reference_code    │   │
│    (AI extraction)                 │  │ • title             │   │
│                                    │  │ • description       │   │
│  AI Suggestions ───────────────────┤  │ • category_id       │   │
│    (gap analysis)                  │  │ • stakeholder_area  │   │
│                                    │  │ • priority          │   │
│  Manual Entry ─────────────────────┘  │ • status            │   │
│                                       │ • source_type       │   │
│                                       │ • source_*_id       │   │
│                                       │ • raised_by         │   │
│                                       └─────────────────────┘   │
│                                                                  │
│                                    OUTPUTS                       │
│                                    ───────                       │
│                                    │                            │
│                                    ├──▶ Evaluation Criteria     │
│                                    │    (linked)                │
│                                    │                            │
│                                    ├──▶ Vendor Questions        │
│                                    │    (generated)             │
│                                    │                            │
│                                    ├──▶ Evidence Links          │
│                                    │    (traceability)          │
│                                    │                            │
│                                    └──▶ Scores                  │
│                                         (via criteria)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Scoring Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      SCORING DATA FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Vendor Response ──────────┐                                    │
│                            │                                    │
│  Demo Notes ───────────────┼──▶ Evidence ──┐                   │
│                            │               │                    │
│  Reference Check ──────────┘               │                    │
│                                            ▼                    │
│                                    ┌───────────────┐            │
│  Requirement ──▶ Criterion ──────▶ │    Score      │            │
│                                    │  (per eval-   │            │
│                                    │   uator)      │            │
│                                    └───────┬───────┘            │
│                                            │                    │
│                            Multiple        │                    │
│                            Evaluators      ▼                    │
│                                    ┌───────────────┐            │
│                                    │  Consensus    │            │
│                                    │   Score       │            │
│                                    └───────┬───────┘            │
│                                            │                    │
│                                            ▼                    │
│                                    ┌───────────────┐            │
│                                    │ Traceability  │            │
│                                    │   Matrix      │            │
│                                    └───────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

- [ ] Database schema creation (all tables)
- [ ] RLS policies
- [ ] EvaluationContext and provider
- [ ] Base evaluator services
- [ ] Basic routing and navigation
- [ ] EvaluatorDashboard (shell)

### Phase 2: Requirements Core (Weeks 3-4)

- [ ] RequirementsHub page
- [ ] Requirements CRUD
- [ ] Stakeholder areas management
- [ ] Evaluation categories management
- [ ] Requirements matrix view
- [ ] Filtering and search

### Phase 3: Input Capture (Weeks 5-6)

- [ ] WorkshopsHub page
- [ ] Workshop creation and management
- [ ] Live capture mode
- [ ] Survey/form builder
- [ ] Post-workshop follow-up forms
- [ ] Document upload and storage

### Phase 4: Vendor Management (Weeks 7-8)

- [ ] VendorsHub page
- [ ] Vendor CRUD
- [ ] Vendor pipeline status tracking
- [ ] Vendor portal (basic)
- [ ] Question management
- [ ] Response capture

### Phase 5: Evaluation (Weeks 9-10)

- [ ] Scoring interface
- [ ] Evidence management
- [ ] Multi-evaluator scoring
- [ ] Reconciliation view
- [ ] Consensus scoring

### Phase 6: Traceability & Reporting (Weeks 11-12)

- [ ] TraceabilityMatrix view
- [ ] Drilldown functionality
- [ ] Full traceability chain
- [ ] Client dashboard
- [ ] PDF report generation
- [ ] Export capabilities

### Phase 7: AI Features (Weeks 13-14)

- [ ] Document parsing API
- [ ] Gap analysis API
- [ ] Market research API
- [ ] Requirement suggestions
- [ ] AI assistant panel

### Phase 8: Polish & Testing (Weeks 15-16)

- [ ] E2E tests
- [ ] Performance optimization
- [ ] Client portal refinement
- [ ] Vendor portal refinement
- [ ] Documentation

---

## Testing Strategy

### Unit Tests (Vitest)

- Service methods
- Permission checks
- Calculation functions
- Data transformations

### E2E Tests (Playwright)

Following existing pattern with role-based test files:

```
e2e/
├── evaluator/
│   ├── evaluator-admin.spec.js
│   ├── evaluator-evaluator.spec.js
│   ├── evaluator-client.spec.js
│   └── evaluator-vendor-portal.spec.js
```

### Test Data

Seeded evaluation projects with:
- Sample requirements across categories
- Sample vendors at different pipeline stages
- Sample workshop with attendees
- Sample scores for matrix testing

---

## Migration Notes

### Database Migrations

```
supabase/migrations/
├── 20250101000000_create_evaluation_projects.sql
├── 20250101000001_create_stakeholder_areas.sql
├── 20250101000002_create_evaluation_categories.sql
├── 20250101000003_create_requirements.sql
├── 20250101000004_create_workshops.sql
├── 20250101000005_create_vendors.sql
├── 20250101000006_create_evidence.sql
├── 20250101000007_create_scores.sql
├── 20250101000008_create_rls_policies.sql
└── 20250101000009_seed_test_data.sql
```

### No Breaking Changes

Evaluator is entirely additive:
- New tables (no modifications to existing)
- New contexts (coexist with existing)
- New routes (no route conflicts)
- New components (isolated in evaluator/)

Existing functionality remains unchanged.

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Related: APPLICATION-CONTEXT.md, LOCAL-ENV-SETUP.md*
