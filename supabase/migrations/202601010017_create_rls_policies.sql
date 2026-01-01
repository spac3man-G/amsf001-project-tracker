-- Migration: Create RLS policies for all evaluator tables
-- Part of: Evaluator Tool Implementation - Phase 1 (Task 1.17)
-- Description: Row Level Security policies for multi-tenant data isolation
-- Date: 2026-01-01

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE evaluation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_question_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_response_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE consensus_score_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTION: Check evaluation project access
-- ============================================================================

CREATE OR REPLACE FUNCTION can_access_evaluation(eval_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM evaluation_project_users
    WHERE evaluation_project_id = eval_project_id
      AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM evaluation_projects ep
    JOIN user_organisations uo ON ep.organisation_id = uo.organisation_id
    WHERE ep.id = eval_project_id
      AND uo.user_id = auth.uid()
      AND uo.org_role IN ('org_owner', 'org_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Check evaluation project role
-- ============================================================================

CREATE OR REPLACE FUNCTION has_evaluation_role(eval_project_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM evaluation_project_users
    WHERE evaluation_project_id = eval_project_id
      AND user_id = auth.uid()
      AND role = ANY(required_roles)
  )
  OR EXISTS (
    SELECT 1 FROM evaluation_projects ep
    JOIN user_organisations uo ON ep.organisation_id = uo.organisation_id
    WHERE ep.id = eval_project_id
      AND uo.user_id = auth.uid()
      AND uo.org_role IN ('org_owner', 'org_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EVALUATION_PROJECTS POLICIES
-- ============================================================================

CREATE POLICY "evaluation_projects_select" ON evaluation_projects
FOR SELECT TO authenticated
USING (can_access_evaluation(id));

CREATE POLICY "evaluation_projects_insert" ON evaluation_projects
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organisations
    WHERE organisation_id = evaluation_projects.organisation_id
      AND user_id = auth.uid()
      AND org_role IN ('org_owner', 'org_admin')
  )
);

CREATE POLICY "evaluation_projects_update" ON evaluation_projects
FOR UPDATE TO authenticated
USING (has_evaluation_role(id, ARRAY['admin']))
WITH CHECK (has_evaluation_role(id, ARRAY['admin']));

CREATE POLICY "evaluation_projects_delete" ON evaluation_projects
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_organisations
    WHERE organisation_id = evaluation_projects.organisation_id
      AND user_id = auth.uid()
      AND org_role IN ('org_owner', 'org_admin')
  )
);

-- ============================================================================
-- EVALUATION_PROJECT_USERS POLICIES
-- ============================================================================

CREATE POLICY "eval_project_users_select" ON evaluation_project_users
FOR SELECT TO authenticated
USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "eval_project_users_insert" ON evaluation_project_users
FOR INSERT TO authenticated
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

CREATE POLICY "eval_project_users_update" ON evaluation_project_users
FOR UPDATE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']))
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

CREATE POLICY "eval_project_users_delete" ON evaluation_project_users
FOR DELETE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']));


-- ============================================================================
-- STANDARD EVALUATION-SCOPED TABLES POLICIES
-- ============================================================================

-- STAKEHOLDER_AREAS
CREATE POLICY "stakeholder_areas_select" ON stakeholder_areas
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "stakeholder_areas_modify" ON stakeholder_areas
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- EVALUATION_CATEGORIES
CREATE POLICY "evaluation_categories_select" ON evaluation_categories
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "evaluation_categories_modify" ON evaluation_categories
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

-- SCORING_SCALES
CREATE POLICY "scoring_scales_select" ON scoring_scales
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "scoring_scales_modify" ON scoring_scales
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

-- WORKSHOPS
CREATE POLICY "workshops_select" ON workshops
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "workshops_modify" ON workshops
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- SURVEYS
CREATE POLICY "surveys_select" ON surveys
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "surveys_modify" ON surveys
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- EVALUATION_DOCUMENTS
CREATE POLICY "evaluation_documents_select" ON evaluation_documents
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "evaluation_documents_modify" ON evaluation_documents
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- REQUIREMENTS
CREATE POLICY "requirements_select" ON requirements
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "requirements_modify" ON requirements
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- EVALUATION_CRITERIA
CREATE POLICY "evaluation_criteria_select" ON evaluation_criteria
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "evaluation_criteria_modify" ON evaluation_criteria
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

-- VENDORS
CREATE POLICY "vendors_select" ON vendors
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "vendors_modify" ON vendors
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- VENDOR_QUESTIONS
CREATE POLICY "vendor_questions_select" ON vendor_questions
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "vendor_questions_modify" ON vendor_questions
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- EVIDENCE
CREATE POLICY "evidence_select" ON evidence
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "evidence_modify" ON evidence
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- AI_TASKS
CREATE POLICY "ai_tasks_select" ON ai_tasks
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "ai_tasks_insert" ON ai_tasks
FOR INSERT TO authenticated WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- EVALUATION_AUDIT_LOG
CREATE POLICY "evaluation_audit_log_select" ON evaluation_audit_log
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "evaluation_audit_log_insert" ON evaluation_audit_log
FOR INSERT TO authenticated WITH CHECK (can_access_evaluation(evaluation_project_id));

-- SCORES
CREATE POLICY "scores_select" ON scores
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "scores_insert" ON scores
FOR INSERT TO authenticated WITH CHECK (
  has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator'])
  AND evaluator_id = auth.uid()
);

CREATE POLICY "scores_update" ON scores
FOR UPDATE TO authenticated USING (
  evaluator_id = auth.uid() OR has_evaluation_role(evaluation_project_id, ARRAY['admin'])
);

-- CONSENSUS_SCORES
CREATE POLICY "consensus_scores_select" ON consensus_scores
FOR SELECT TO authenticated USING (can_access_evaluation(evaluation_project_id));

CREATE POLICY "consensus_scores_modify" ON consensus_scores
FOR ALL TO authenticated USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']));


-- ============================================================================
-- JUNCTION/CHILD TABLE POLICIES (access via parent)
-- ============================================================================

-- WORKSHOP_ATTENDEES
CREATE POLICY "workshop_attendees_all" ON workshop_attendees
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM workshops w WHERE w.id = workshop_attendees.workshop_id
  AND can_access_evaluation(w.evaluation_project_id)
));

-- SURVEY_RESPONSES
CREATE POLICY "survey_responses_select" ON survey_responses
FOR SELECT TO authenticated
USING (
  respondent_id = auth.uid() OR
  EXISTS (SELECT 1 FROM surveys s WHERE s.id = survey_responses.survey_id AND can_access_evaluation(s.evaluation_project_id))
);

CREATE POLICY "survey_responses_insert" ON survey_responses
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM surveys s WHERE s.id = survey_responses.survey_id AND can_access_evaluation(s.evaluation_project_id)));

CREATE POLICY "survey_responses_update" ON survey_responses
FOR UPDATE TO authenticated
USING (respondent_id = auth.uid() OR EXISTS (
  SELECT 1 FROM surveys s WHERE s.id = survey_responses.survey_id AND has_evaluation_role(s.evaluation_project_id, ARRAY['admin', 'evaluator'])
));

-- REQUIREMENT_CRITERIA
CREATE POLICY "requirement_criteria_all" ON requirement_criteria
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM requirements r WHERE r.id = requirement_criteria.requirement_id
  AND can_access_evaluation(r.evaluation_project_id)
));

-- VENDOR_CONTACTS
CREATE POLICY "vendor_contacts_all" ON vendor_contacts
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendors v WHERE v.id = vendor_contacts.vendor_id
  AND can_access_evaluation(v.evaluation_project_id)
));

-- VENDOR_QUESTION_LINKS
CREATE POLICY "vendor_question_links_all" ON vendor_question_links
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendor_questions q WHERE q.id = vendor_question_links.question_id
  AND can_access_evaluation(q.evaluation_project_id)
));

-- VENDOR_RESPONSES
CREATE POLICY "vendor_responses_all" ON vendor_responses
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendors v WHERE v.id = vendor_responses.vendor_id
  AND can_access_evaluation(v.evaluation_project_id)
));

-- VENDOR_DOCUMENTS
CREATE POLICY "vendor_documents_all" ON vendor_documents
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendors v WHERE v.id = vendor_documents.vendor_id
  AND can_access_evaluation(v.evaluation_project_id)
));

-- VENDOR_RESPONSE_ATTACHMENTS
CREATE POLICY "vendor_response_attachments_all" ON vendor_response_attachments
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendor_responses vr JOIN vendors v ON v.id = vr.vendor_id
  WHERE vr.id = vendor_response_attachments.response_id
  AND can_access_evaluation(v.evaluation_project_id)
));

-- EVIDENCE_LINKS
CREATE POLICY "evidence_links_all" ON evidence_links
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM evidence e WHERE e.id = evidence_links.evidence_id
  AND can_access_evaluation(e.evaluation_project_id)
));

-- SCORE_EVIDENCE
CREATE POLICY "score_evidence_all" ON score_evidence
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM scores s WHERE s.id = score_evidence.score_id
  AND can_access_evaluation(s.evaluation_project_id)
));

-- CONSENSUS_SCORE_SOURCES
CREATE POLICY "consensus_score_sources_all" ON consensus_score_sources
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM consensus_scores cs WHERE cs.id = consensus_score_sources.consensus_score_id
  AND can_access_evaluation(cs.evaluation_project_id)
));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION can_access_evaluation IS 'Check if current user has any access to an evaluation project';
COMMENT ON FUNCTION has_evaluation_role IS 'Check if current user has specified role(s) in an evaluation project';
