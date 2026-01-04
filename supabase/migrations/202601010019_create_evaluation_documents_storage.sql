-- Migration: Create evaluation-documents storage bucket and policies
-- Part of: Evaluator Tool Implementation - Phase 4 (Session 4C)
-- Description: Storage bucket for evaluation project documents
-- Date: 2026-01-01
-- 
-- NOTE: Supabase storage buckets cannot be created via SQL migrations.
-- The bucket must be created via the Supabase Dashboard or API.
-- 
-- MANUAL STEPS REQUIRED:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create new bucket named: evaluation-documents
-- 3. Set bucket as "Private" (not public)
-- 4. Enable RLS on the bucket
--
-- The policies below will then be applied automatically.

-- ============================================================================
-- STORAGE POLICIES FOR evaluation-documents BUCKET
-- ============================================================================
-- These policies control who can upload, read, and delete files in the bucket.
-- They rely on the can_access_evaluation and has_evaluation_role functions
-- created in migration 202601010017_create_rls_policies.sql

-- Note: Storage policies use a different syntax than table RLS policies.
-- The bucket_id is automatically included in policy conditions.

-- Policy: Allow authenticated users to read files they have evaluation access to
-- Files are stored as: {evaluation_project_id}/{timestamp}-{filename}
CREATE POLICY "evaluation_documents_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evaluation-documents'
  AND can_access_evaluation((storage.foldername(name))[1]::uuid)
);

-- Policy: Allow evaluators and admins to upload files
CREATE POLICY "evaluation_documents_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evaluation-documents'
  AND has_evaluation_role((storage.foldername(name))[1]::uuid, ARRAY['admin', 'evaluator'])
);

-- Policy: Allow evaluators and admins to update files
CREATE POLICY "evaluation_documents_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evaluation-documents'
  AND has_evaluation_role((storage.foldername(name))[1]::uuid, ARRAY['admin', 'evaluator'])
);

-- Policy: Allow evaluators and admins to delete files
CREATE POLICY "evaluation_documents_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evaluation-documents'
  AND has_evaluation_role((storage.foldername(name))[1]::uuid, ARRAY['admin', 'evaluator'])
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "evaluation_documents_select" ON storage.objects IS 
  'Allow reading evaluation documents for users with evaluation project access';

COMMENT ON POLICY "evaluation_documents_insert" ON storage.objects IS 
  'Allow uploading evaluation documents for evaluators and admins';

COMMENT ON POLICY "evaluation_documents_update" ON storage.objects IS 
  'Allow updating evaluation documents for evaluators and admins';

COMMENT ON POLICY "evaluation_documents_delete" ON storage.objects IS 
  'Allow deleting evaluation documents for evaluators and admins';
