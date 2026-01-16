-- Migration: Add evaluator_enabled column to projects and templates
-- Purpose: Make the Evaluator module optional per project
-- When false, the Evaluator navigation items are hidden

-- ============================================
-- ADD COLUMN TO PROJECTS TABLE
-- ============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS evaluator_enabled BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN projects.evaluator_enabled IS 'When true, shows Evaluator module in navigation';

-- ============================================
-- ADD COLUMN TO PROJECT_TEMPLATES TABLE
-- ============================================

ALTER TABLE project_templates
ADD COLUMN IF NOT EXISTS evaluator_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN project_templates.evaluator_enabled IS 'Template default for evaluator_enabled';

-- ============================================
-- UPDATE EXISTING TEMPLATES
-- ============================================

-- Formal Fixed-Price: Enable evaluator (formal vendor selection)
UPDATE project_templates
SET evaluator_enabled = true
WHERE slug = 'formal-fixed-price';

-- Time & Materials: Enable evaluator (may need vendor selection)
UPDATE project_templates
SET evaluator_enabled = true
WHERE slug = 'time-materials';

-- Internal Project: Disable evaluator (no vendor needed)
UPDATE project_templates
SET evaluator_enabled = false
WHERE slug = 'internal-project';

-- Agile/Iterative: Disable evaluator (typically existing vendor)
UPDATE project_templates
SET evaluator_enabled = false
WHERE slug = 'agile-iterative';

-- Regulated Industry: Enable evaluator (formal procurement)
UPDATE project_templates
SET evaluator_enabled = true
WHERE slug = 'regulated-industry';

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  enabled_count INTEGER;
  disabled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO enabled_count FROM project_templates WHERE evaluator_enabled = true;
  SELECT COUNT(*) INTO disabled_count FROM project_templates WHERE evaluator_enabled = false;
  RAISE NOTICE 'Templates with evaluator enabled: %, disabled: %', enabled_count, disabled_count;
END $$;
