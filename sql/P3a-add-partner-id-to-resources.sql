-- Phase P3a: Add partner_id column to resources table
-- Run this in Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/ljqpmrcqxzgcfojrkxce/sql

-- Add partner_id column with foreign key to partners table
ALTER TABLE resources 
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

-- Create index for performance when querying resources by partner
CREATE INDEX IF NOT EXISTS idx_resources_partner_id ON resources(partner_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'resources' 
AND column_name = 'partner_id';
