-- Dashboard Layouts Table Migration
-- Created: 1 December 2025
-- Purpose: Store user dashboard customization preferences

-- Create dashboard_layouts table
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  layout_config JSONB NOT NULL DEFAULT '{
    "version": "1.0",
    "widgets": {
      "progress-hero": {"visible": true},
      "budget-summary": {"visible": true},
      "pmo-tracking": {"visible": true},
      "stats-grid": {"visible": true},
      "certificates": {"visible": true},
      "milestones-list": {"visible": true},
      "kpis-category": {"visible": true},
      "quality-standards": {"visible": true}
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_project 
ON dashboard_layouts(user_id, project_id);

-- Enable Row Level Security
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own layouts
CREATE POLICY "Users can view own layouts"
ON dashboard_layouts FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own layouts
CREATE POLICY "Users can insert own layouts"
ON dashboard_layouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own layouts
CREATE POLICY "Users can update own layouts"
ON dashboard_layouts FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own layouts
CREATE POLICY "Users can delete own layouts"
ON dashboard_layouts FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dashboard_layouts_timestamp
BEFORE UPDATE ON dashboard_layouts
FOR EACH ROW
EXECUTE FUNCTION update_dashboard_layouts_updated_at();

-- Comments
COMMENT ON TABLE dashboard_layouts IS 'Stores user dashboard widget visibility preferences per project';
COMMENT ON COLUMN dashboard_layouts.layout_config IS 'JSONB object containing widget visibility and configuration';
