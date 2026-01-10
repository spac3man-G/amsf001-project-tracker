-- Migration: Fix RLS policies by adding explicit WITH CHECK clauses
-- Issue: BUG-003 - Create Requirement fails
--
-- PostgreSQL's FOR ALL policies with only USING should use it for WITH CHECK,
-- but explicitly adding WITH CHECK ensures INSERT operations work correctly.
-- This migration recreates the modify policies with both USING and WITH CHECK.
--
-- Date: 2026-01-10

-- ============================================================================
-- REQUIREMENTS TABLE
-- ============================================================================

-- Drop existing modify policy
DROP POLICY IF EXISTS "requirements_modify" ON requirements;

-- Recreate with explicit USING and WITH CHECK
CREATE POLICY "requirements_insert" ON requirements
FOR INSERT TO authenticated
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "requirements_update" ON requirements
FOR UPDATE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']))
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "requirements_delete" ON requirements
FOR DELETE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- ============================================================================
-- STAKEHOLDER_AREAS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "stakeholder_areas_modify" ON stakeholder_areas;

CREATE POLICY "stakeholder_areas_insert" ON stakeholder_areas
FOR INSERT TO authenticated
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "stakeholder_areas_update" ON stakeholder_areas
FOR UPDATE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']))
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "stakeholder_areas_delete" ON stakeholder_areas
FOR DELETE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- ============================================================================
-- EVALUATION_CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "evaluation_categories_modify" ON evaluation_categories;

CREATE POLICY "evaluation_categories_insert" ON evaluation_categories
FOR INSERT TO authenticated
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

CREATE POLICY "evaluation_categories_update" ON evaluation_categories
FOR UPDATE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']))
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

CREATE POLICY "evaluation_categories_delete" ON evaluation_categories
FOR DELETE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

-- ============================================================================
-- VENDORS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "vendors_modify" ON vendors;

CREATE POLICY "vendors_insert" ON vendors
FOR INSERT TO authenticated
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "vendors_update" ON vendors
FOR UPDATE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']))
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "vendors_delete" ON vendors
FOR DELETE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- ============================================================================
-- VENDOR_QUESTIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "vendor_questions_modify" ON vendor_questions;

CREATE POLICY "vendor_questions_insert" ON vendor_questions
FOR INSERT TO authenticated
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "vendor_questions_update" ON vendor_questions
FOR UPDATE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']))
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "vendor_questions_delete" ON vendor_questions
FOR DELETE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- ============================================================================
-- WORKSHOPS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "workshops_modify" ON workshops;

CREATE POLICY "workshops_insert" ON workshops
FOR INSERT TO authenticated
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "workshops_update" ON workshops
FOR UPDATE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']))
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

CREATE POLICY "workshops_delete" ON workshops
FOR DELETE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin', 'evaluator']));

-- ============================================================================
-- SCORING_SCALES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "scoring_scales_modify" ON scoring_scales;

CREATE POLICY "scoring_scales_insert" ON scoring_scales
FOR INSERT TO authenticated
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

CREATE POLICY "scoring_scales_update" ON scoring_scales
FOR UPDATE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']))
WITH CHECK (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

CREATE POLICY "scoring_scales_delete" ON scoring_scales
FOR DELETE TO authenticated
USING (has_evaluation_role(evaluation_project_id, ARRAY['admin']));

-- ============================================================================
-- VENDOR_RESPONSES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "vendor_responses_all" ON vendor_responses;

CREATE POLICY "vendor_responses_select" ON vendor_responses
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendors v WHERE v.id = vendor_responses.vendor_id
  AND can_access_evaluation(v.evaluation_project_id)
));

CREATE POLICY "vendor_responses_insert" ON vendor_responses
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM vendors v WHERE v.id = vendor_responses.vendor_id
  AND has_evaluation_role(v.evaluation_project_id, ARRAY['admin', 'evaluator', 'vendor'])
));

CREATE POLICY "vendor_responses_update" ON vendor_responses
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendors v WHERE v.id = vendor_responses.vendor_id
  AND has_evaluation_role(v.evaluation_project_id, ARRAY['admin', 'evaluator', 'vendor'])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM vendors v WHERE v.id = vendor_responses.vendor_id
  AND has_evaluation_role(v.evaluation_project_id, ARRAY['admin', 'evaluator', 'vendor'])
));

CREATE POLICY "vendor_responses_delete" ON vendor_responses
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendors v WHERE v.id = vendor_responses.vendor_id
  AND has_evaluation_role(v.evaluation_project_id, ARRAY['admin', 'evaluator'])
));

-- ============================================================================
-- VENDOR_QUESTION_LINKS TABLE (junction table)
-- ============================================================================

DROP POLICY IF EXISTS "vendor_question_links_all" ON vendor_question_links;

CREATE POLICY "vendor_question_links_select" ON vendor_question_links
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendor_questions q WHERE q.id = vendor_question_links.question_id
  AND can_access_evaluation(q.evaluation_project_id)
));

CREATE POLICY "vendor_question_links_insert" ON vendor_question_links
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM vendor_questions q WHERE q.id = vendor_question_links.question_id
  AND has_evaluation_role(q.evaluation_project_id, ARRAY['admin', 'evaluator'])
));

CREATE POLICY "vendor_question_links_update" ON vendor_question_links
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendor_questions q WHERE q.id = vendor_question_links.question_id
  AND has_evaluation_role(q.evaluation_project_id, ARRAY['admin', 'evaluator'])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM vendor_questions q WHERE q.id = vendor_question_links.question_id
  AND has_evaluation_role(q.evaluation_project_id, ARRAY['admin', 'evaluator'])
));

CREATE POLICY "vendor_question_links_delete" ON vendor_question_links
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM vendor_questions q WHERE q.id = vendor_question_links.question_id
  AND has_evaluation_role(q.evaluation_project_id, ARRAY['admin', 'evaluator'])
));

-- ============================================================================
-- COMMENT
-- ============================================================================
COMMENT ON POLICY "requirements_insert" ON requirements IS
  'Allow admin/evaluator roles to create requirements with explicit WITH CHECK';
