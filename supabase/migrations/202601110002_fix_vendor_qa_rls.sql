-- Migration: Fix Vendor Q&A RLS Policies
-- Description: Add broader RLS policy for authenticated users to read vendor_qa
-- Date: 2026-01-11

-- ============================================================================
-- FIX VENDOR_QA RLS POLICIES
-- ============================================================================

-- Add policy for authenticated users who have access to the organisation
-- This covers users who are part of the organization

DROP POLICY IF EXISTS "vendor_qa_select_authenticated" ON vendor_qa;
CREATE POLICY "vendor_qa_select_authenticated" ON vendor_qa
    FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_qa.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

-- Allow insert for authenticated users
DROP POLICY IF EXISTS "vendor_qa_insert_authenticated" ON vendor_qa;
CREATE POLICY "vendor_qa_insert_authenticated" ON vendor_qa
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_qa.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

-- Allow update for authenticated users
DROP POLICY IF EXISTS "vendor_qa_update_authenticated" ON vendor_qa;
CREATE POLICY "vendor_qa_update_authenticated" ON vendor_qa
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_qa.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

-- Allow delete for authenticated users
DROP POLICY IF EXISTS "vendor_qa_delete_authenticated" ON vendor_qa;
CREATE POLICY "vendor_qa_delete_authenticated" ON vendor_qa
    FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_qa.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

-- ============================================================================
-- FIX VENDOR_QUESTIONS RLS POLICIES
-- ============================================================================

-- Ensure vendor_questions has RLS enabled
ALTER TABLE vendor_questions ENABLE ROW LEVEL SECURITY;

-- Add policy for authenticated users to read vendor_questions
DROP POLICY IF EXISTS "vendor_questions_select_authenticated" ON vendor_questions;
CREATE POLICY "vendor_questions_select_authenticated" ON vendor_questions
    FOR SELECT USING (
        is_deleted = FALSE
        AND auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_questions.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

-- Allow insert for authenticated users
DROP POLICY IF EXISTS "vendor_questions_insert_authenticated" ON vendor_questions;
CREATE POLICY "vendor_questions_insert_authenticated" ON vendor_questions
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_questions.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

-- Allow update for authenticated users
DROP POLICY IF EXISTS "vendor_questions_update_authenticated" ON vendor_questions;
CREATE POLICY "vendor_questions_update_authenticated" ON vendor_questions
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_questions.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );

-- Allow delete for authenticated users
DROP POLICY IF EXISTS "vendor_questions_delete_authenticated" ON vendor_questions;
CREATE POLICY "vendor_questions_delete_authenticated" ON vendor_questions
    FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM evaluation_projects ep
            JOIN user_organisations uo ON uo.organisation_id = ep.organisation_id
            WHERE ep.id = vendor_questions.evaluation_project_id
            AND uo.user_id = auth.uid()
        )
    );
