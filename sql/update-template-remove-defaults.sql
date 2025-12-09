-- =============================================================================
-- Update GOJ CR Template - Remove default role titles
-- Run this in Supabase SQL Editor to update existing template
-- Date: 9 December 2025
-- =============================================================================

-- Update the template definition to remove default job titles from signature block
UPDATE document_templates
SET template_definition = jsonb_set(
  jsonb_set(
    template_definition,
    '{sections,17,parties,0,fields,1,default}',
    '""'::jsonb
  ),
  '{sections,17,parties,1,fields,1,default}',
  '""'::jsonb
)
WHERE code = 'goj_cr_v1';

-- Verify the change
SELECT 
  name,
  template_definition->'sections'->17->'parties'->0->'fields'->1->>'default' as authority_title_default,
  template_definition->'sections'->17->'parties'->1->'fields'->1->>'default' as contractor_title_default
FROM document_templates
WHERE code = 'goj_cr_v1';
