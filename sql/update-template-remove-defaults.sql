-- =============================================================================
-- Update GOJ CR Template - Remove default role titles (SIMPLE VERSION)
-- Run this in Supabase SQL Editor
-- Date: 9 December 2025
-- =============================================================================

-- Step 1: Find the signature_block section index
SELECT 
  idx - 1 as array_index,  -- JSONB arrays are 0-indexed
  section->>'type' as section_type
FROM document_templates,
     jsonb_array_elements(template_definition->'sections') WITH ORDINALITY arr(section, idx)
WHERE code = 'goj_cr_v1'
  AND section->>'type' = 'signature_block';

-- Step 2: Once you know the index (let's say it's 24), run this update:
-- IMPORTANT: Replace '24' below with the actual index from Step 1

UPDATE document_templates
SET template_definition = jsonb_set(
  template_definition,
  '{sections,24}',  -- <-- CHANGE THIS INDEX if needed
  '{
    "type": "signature_block",
    "parties": [
      {
        "title": "Authority Authorisation",
        "subtitle": "(Required for all Change Requests)",
        "fields": [
          { "label": "Name", "source": "variation.customer_signer.full_name", "default": "" },
          { "label": "Title", "source": "variation.customer_signer.job_title", "default": "" },
          { "label": "Date", "source": "variation.customer_signed_at", "format": "date", "default": "" },
          { "label": "Signature", "type": "signature_line" }
        ]
      },
      {
        "title": "Contractor Authorisation",
        "subtitle": "(Required for all Change Requests)",
        "fields": [
          { "label": "Name", "source": "variation.supplier_signer.full_name", "default": "" },
          { "label": "Title", "source": "variation.supplier_signer.job_title", "default": "" },
          { "label": "Date", "source": "variation.supplier_signed_at", "format": "date", "default": "" },
          { "label": "Signature", "type": "signature_line" }
        ]
      }
    ]
  }'::jsonb
)
WHERE code = 'goj_cr_v1';

-- Step 3: Verify the change
SELECT 
  section->'parties'->0->'fields'->1->>'default' as authority_title_default,
  section->'parties'->1->'fields'->1->>'default' as contractor_title_default
FROM document_templates,
     jsonb_array_elements(template_definition->'sections') section
WHERE code = 'goj_cr_v1'
  AND section->>'type' = 'signature_block';
