-- ============================================================
-- Migration: Create Organisations Table
-- Date: 22 December 2025
-- Purpose: Add organisation-level multi-tenancy support
-- Checkpoint: 1.1
-- ============================================================

-- Create organisations table
CREATE TABLE IF NOT EXISTS public.organisations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  
  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{
    "features": {
      "ai_chat_enabled": true,
      "receipt_scanner_enabled": true,
      "variations_enabled": true,
      "report_builder_enabled": true
    },
    "defaults": {
      "currency": "GBP",
      "hours_per_day": 8,
      "date_format": "DD/MM/YYYY",
      "timezone": "Europe/London"
    },
    "branding": {},
    "limits": {}
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Subscription (future use)
  subscription_tier TEXT DEFAULT 'standard',
  subscription_expires_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id)
);

-- ============================================================
-- Indexes
-- ============================================================

-- Unique slug lookup
CREATE INDEX IF NOT EXISTS idx_organisations_slug 
ON public.organisations(slug);

-- Active organisations
CREATE INDEX IF NOT EXISTS idx_organisations_active 
ON public.organisations(is_active) 
WHERE is_active = TRUE AND is_deleted = FALSE;

-- ============================================================
-- Updated at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_organisations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organisations_timestamp
BEFORE UPDATE ON public.organisations
FOR EACH ROW
EXECUTE FUNCTION update_organisations_updated_at();

-- ============================================================
-- Enable RLS (policies added in separate migration)
-- ============================================================

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Permissions
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisations TO authenticated;

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE public.organisations IS 'Top-level organisational units for multi-tenancy';
COMMENT ON COLUMN public.organisations.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN public.organisations.settings IS 'JSONB containing features, defaults, branding, and limits';
COMMENT ON COLUMN public.organisations.subscription_tier IS 'Future: subscription level (free, standard, premium)';
