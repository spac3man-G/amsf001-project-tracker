-- ============================================
-- P13: RESOURCE AVAILABILITY CALENDAR
-- Creates table and RLS policies for tracking
-- team member availability (OOO, Remote, On-Site)
-- with half-day/full-day support
-- ============================================

-- Create the resource_availability table
CREATE TABLE IF NOT EXISTS resource_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('out_of_office', 'remote', 'on_site')),
  period TEXT NOT NULL DEFAULT 'full_day' CHECK (period IN ('full_day', 'am', 'pm')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Each user can only have one status per day per project
  UNIQUE(project_id, user_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resource_availability_project_id ON resource_availability(project_id);
CREATE INDEX IF NOT EXISTS idx_resource_availability_user_id ON resource_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_availability_date ON resource_availability(date);
CREATE INDEX IF NOT EXISTS idx_resource_availability_project_date ON resource_availability(project_id, date);

-- Enable RLS
ALTER TABLE resource_availability ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "resource_availability_select_policy" ON resource_availability;
DROP POLICY IF EXISTS "resource_availability_insert_policy" ON resource_availability;
DROP POLICY IF EXISTS "resource_availability_update_policy" ON resource_availability;
DROP POLICY IF EXISTS "resource_availability_delete_policy" ON resource_availability;

-- SELECT: Any project member can view availability
CREATE POLICY "resource_availability_select_policy"
ON resource_availability FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resource_availability.project_id
    AND up.user_id = auth.uid()
  )
);

-- INSERT: Users can add their own availability entries
CREATE POLICY "resource_availability_insert_policy"
ON resource_availability FOR INSERT TO authenticated
WITH CHECK (
  -- User must be assigned to the project
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resource_availability.project_id
    AND up.user_id = auth.uid()
  )
  -- And can only insert for themselves
  AND user_id = auth.uid()
);

-- UPDATE: Users can update their own entries, admins can update any
CREATE POLICY "resource_availability_update_policy"
ON resource_availability FOR UPDATE TO authenticated
USING (
  -- Own entry
  user_id = auth.uid()
  OR
  -- Admin on the project
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resource_availability.project_id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resource_availability.project_id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
);

-- DELETE: Users can delete their own entries, admins can delete any
CREATE POLICY "resource_availability_delete_policy"
ON resource_availability FOR DELETE TO authenticated
USING (
  -- Own entry
  user_id = auth.uid()
  OR
  -- Admin on the project
  EXISTS (
    SELECT 1 FROM user_projects up
    WHERE up.project_id = resource_availability.project_id
    AND up.user_id = auth.uid()
    AND up.role = 'admin'
  )
);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_resource_availability_updated_at ON resource_availability;
CREATE TRIGGER update_resource_availability_updated_at
  BEFORE UPDATE ON resource_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'resource_availability'
ORDER BY cmd;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'resource_availability'
ORDER BY ordinal_position;
