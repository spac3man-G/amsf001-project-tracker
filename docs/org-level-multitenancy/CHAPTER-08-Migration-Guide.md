# Organisation-Level Multi-Tenancy Implementation Guide

## Chapter 8: Migration Guide

**Document:** CHAPTER-08-Migration-Guide.md  
**Version:** 1.0  
**Created:** 22 December 2025  
**Status:** Draft  

---

## 8.1 Overview

This chapter provides a comprehensive guide for migrating an existing AMSF001 installation from project-scoped multi-tenancy to organisation-level multi-tenancy. The migration is designed to be non-destructive and reversible.

### Migration Goals

1. **Zero data loss** - All existing data preserved
2. **Minimal downtime** - Can be executed in stages
3. **Backward compatible** - Existing functionality continues to work
4. **Reversible** - Can be rolled back if needed

### Migration Phases

```
Phase 1: Schema Updates (Database)
    ↓
Phase 2: Data Migration (Populate new tables)
    ↓
Phase 3: RLS Policy Updates (Security)
    ↓
Phase 4: Application Deployment (Code)
    ↓
Phase 5: Verification & Cleanup
```

---

## 8.2 Pre-Migration Checklist

### 8.2.1 Prerequisites

- [ ] Full database backup completed
- [ ] Application is in maintenance mode (recommended)
- [ ] All pending migrations applied
- [ ] Test environment validated with migration scripts
- [ ] Rollback scripts tested
- [ ] Stakeholders notified of migration window

### 8.2.2 Information Gathering

```sql
-- Count existing records to validate migration
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'user_projects', COUNT(*) FROM user_projects
UNION ALL
SELECT 'timesheets', COUNT(*) FROM timesheets
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'milestones', COUNT(*) FROM milestones;

-- Identify users with multiple projects (will need org assignment)
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  COUNT(up.project_id) as project_count
FROM profiles p
LEFT JOIN user_projects up ON p.id = up.user_id
GROUP BY p.id, p.full_name, p.email
ORDER BY project_count DESC;

-- Identify the default org owner (highest access user)
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.role as system_role,
  COUNT(CASE WHEN up.role = 'admin' THEN 1 END) as admin_projects
FROM profiles p
LEFT JOIN user_projects up ON p.id = up.user_id
GROUP BY p.id, p.full_name, p.email, p.role
ORDER BY admin_projects DESC
LIMIT 5;
```

---

## 8.3 Phase 1: Schema Updates

### 8.3.1 Migration Script: Create New Tables

```sql
-- ============================================================
-- Migration: 001_create_organisations_table.sql
-- Description: Create organisations and user_organisations tables
-- ============================================================

-- Create organisations table
CREATE TABLE IF NOT EXISTS public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier TEXT DEFAULT 'free',
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

-- Create user_organisations junction table
CREATE TABLE IF NOT EXISTS public.user_organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL DEFAULT 'org_member' 
    CHECK (org_role IN ('org_owner', 'org_admin', 'org_member')),
  
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, organisation_id)
);

-- Add organisation_id to projects (nullable initially for migration)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS organisation_id UUID REFERENCES public.organisations(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organisations_slug ON public.organisations(slug);
CREATE INDEX IF NOT EXISTS idx_organisations_active ON public.organisations(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_orgs_user ON public.user_organisations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org ON public.user_organisations(organisation_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_user_active ON public.user_organisations(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_orgs_org_role ON public.user_organisations(organisation_id, org_role);
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(organisation_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_active ON public.projects(organisation_id, is_deleted) WHERE is_deleted = FALSE;

-- Enable RLS (policies added in Phase 3)
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organisations ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organisations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_organisations TO authenticated;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organisations_updated_at
  BEFORE UPDATE ON public.organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_organisations_updated_at
  BEFORE UPDATE ON public.user_organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log migration
INSERT INTO public.schema_migrations (version, description, executed_at)
VALUES ('001', 'Create organisations tables', NOW())
ON CONFLICT (version) DO NOTHING;
```

### 8.3.2 Verification

```sql
-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organisations', 'user_organisations');

-- Verify column added to projects
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'organisation_id';

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('organisations', 'user_organisations', 'projects')
AND indexname LIKE 'idx_%';
```

---

## 8.4 Phase 2: Data Migration

### 8.4.1 Migration Strategy

For existing installations, we need to:
1. Create a default organisation
2. Assign all existing projects to the default organisation
3. Create user_organisations entries for all users with project access
4. Designate an organisation owner

### 8.4.2 Migration Script: Populate Data

```sql
-- ============================================================
-- Migration: 002_migrate_existing_data.sql
-- Description: Migrate existing data to organisation structure
-- ============================================================

-- Configuration: Set these values before running
DO $$
DECLARE
  v_default_org_name TEXT := 'Default Organisation';
  v_default_org_slug TEXT := 'default-org';
  v_owner_email TEXT := NULL; -- Set to specific email, or NULL to auto-select
  v_org_id UUID;
  v_owner_id UUID;
  v_user_record RECORD;
BEGIN
  -- ============================================================
  -- Step 1: Create default organisation
  -- ============================================================
  
  -- Check if default org already exists
  SELECT id INTO v_org_id FROM organisations WHERE slug = v_default_org_slug;
  
  IF v_org_id IS NULL THEN
    INSERT INTO organisations (name, slug, display_name, settings)
    VALUES (
      v_default_org_name, 
      v_default_org_slug,
      v_default_org_name,
      jsonb_build_object(
        'features', jsonb_build_object(
          'ai_chat_enabled', true,
          'receipt_scanner_enabled', true,
          'variations_enabled', true
        ),
        'defaults', jsonb_build_object(
          'currency', 'GBP',
          'hours_per_day', 8
        ),
        'migrated_from_legacy', true,
        'migration_date', NOW()
      )
    )
    RETURNING id INTO v_org_id;
    
    RAISE NOTICE 'Created default organisation: %', v_org_id;
  ELSE
    RAISE NOTICE 'Default organisation already exists: %', v_org_id;
  END IF;

  -- ============================================================
  -- Step 2: Assign all projects to default organisation
  -- ============================================================
  
  UPDATE projects 
  SET organisation_id = v_org_id
  WHERE organisation_id IS NULL;
  
  RAISE NOTICE 'Updated % projects with organisation_id', 
    (SELECT COUNT(*) FROM projects WHERE organisation_id = v_org_id);

  -- ============================================================
  -- Step 3: Determine organisation owner
  -- ============================================================
  
  IF v_owner_email IS NOT NULL THEN
    -- Use specified owner
    SELECT id INTO v_owner_id FROM profiles WHERE email = v_owner_email;
    IF v_owner_id IS NULL THEN
      RAISE EXCEPTION 'Specified owner email not found: %', v_owner_email;
    END IF;
  ELSE
    -- Auto-select: prefer system_admin, then user with most admin roles
    SELECT p.id INTO v_owner_id
    FROM profiles p
    LEFT JOIN user_projects up ON p.id = up.user_id
    WHERE p.role = 'system_admin'
       OR up.role = 'admin'
    GROUP BY p.id, p.role
    ORDER BY 
      CASE WHEN p.role = 'system_admin' THEN 0 ELSE 1 END,
      COUNT(CASE WHEN up.role = 'admin' THEN 1 END) DESC
    LIMIT 1;
    
    IF v_owner_id IS NULL THEN
      -- Fallback: first user in profiles
      SELECT id INTO v_owner_id FROM profiles ORDER BY created_at LIMIT 1;
    END IF;
  END IF;
  
  RAISE NOTICE 'Selected organisation owner: %', v_owner_id;

  -- ============================================================
  -- Step 4: Create user_organisations entries
  -- ============================================================
  
  -- First, add the owner
  INSERT INTO user_organisations (user_id, organisation_id, org_role, is_default, accepted_at)
  VALUES (v_owner_id, v_org_id, 'org_owner', TRUE, NOW())
  ON CONFLICT (user_id, organisation_id) DO UPDATE 
  SET org_role = 'org_owner', is_default = TRUE;
  
  RAISE NOTICE 'Added organisation owner';

  -- Add all users who have project access as org_members
  FOR v_user_record IN 
    SELECT DISTINCT up.user_id, p.role as system_role
    FROM user_projects up
    JOIN profiles p ON up.user_id = p.id
    WHERE up.user_id != v_owner_id
  LOOP
    INSERT INTO user_organisations (
      user_id, 
      organisation_id, 
      org_role, 
      is_default,
      accepted_at
    )
    VALUES (
      v_user_record.user_id, 
      v_org_id, 
      -- Promote system_admins and users with admin project roles to org_admin
      CASE 
        WHEN v_user_record.system_role = 'system_admin' THEN 'org_admin'
        WHEN EXISTS (
          SELECT 1 FROM user_projects 
          WHERE user_id = v_user_record.user_id AND role = 'admin'
        ) THEN 'org_admin'
        ELSE 'org_member'
      END,
      TRUE,
      NOW()
    )
    ON CONFLICT (user_id, organisation_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Added % organisation members', 
    (SELECT COUNT(*) FROM user_organisations WHERE organisation_id = v_org_id);

  -- ============================================================
  -- Step 5: Add orphan users (profiles without project access)
  -- ============================================================
  
  INSERT INTO user_organisations (user_id, organisation_id, org_role, is_default, accepted_at)
  SELECT 
    p.id,
    v_org_id,
    CASE WHEN p.role = 'system_admin' THEN 'org_admin' ELSE 'org_member' END,
    TRUE,
    NOW()
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM user_organisations uo 
    WHERE uo.user_id = p.id AND uo.organisation_id = v_org_id
  )
  ON CONFLICT (user_id, organisation_id) DO NOTHING;
  
  RAISE NOTICE 'Migration completed successfully';
  
END $$;

-- ============================================================
-- Verification queries
-- ============================================================

-- Verify all projects have organisation_id
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All projects have organisation_id'
    ELSE 'FAIL: ' || COUNT(*) || ' projects missing organisation_id'
  END as check_result
FROM projects WHERE organisation_id IS NULL AND is_deleted = FALSE;

-- Verify all users with project access have org membership
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: All project users have org membership'
    ELSE 'FAIL: ' || COUNT(*) || ' users missing org membership'
  END as check_result
FROM (
  SELECT DISTINCT user_id FROM user_projects
  EXCEPT
  SELECT user_id FROM user_organisations WHERE is_active = TRUE
) missing_users;

-- Verify at least one org_owner exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'PASS: Organisation has owner(s)'
    ELSE 'FAIL: No organisation owner found'
  END as check_result
FROM user_organisations WHERE org_role = 'org_owner' AND is_active = TRUE;

-- Summary
SELECT 
  (SELECT COUNT(*) FROM organisations) as org_count,
  (SELECT COUNT(*) FROM user_organisations WHERE is_active = TRUE) as org_membership_count,
  (SELECT COUNT(*) FROM projects WHERE organisation_id IS NOT NULL) as projects_with_org,
  (SELECT COUNT(*) FROM projects WHERE organisation_id IS NULL AND is_deleted = FALSE) as projects_without_org;
```

### 8.4.3 Make organisation_id Required

After verifying migration, make the column NOT NULL:

```sql
-- ============================================================
-- Migration: 003_enforce_organisation_id.sql
-- Description: Make organisation_id required on projects
-- ONLY RUN AFTER VERIFYING ALL PROJECTS HAVE organisation_id
-- ============================================================

-- Final check before enforcing
DO $$
DECLARE
  v_missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_missing_count 
  FROM projects 
  WHERE organisation_id IS NULL AND is_deleted = FALSE;
  
  IF v_missing_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce NOT NULL: % projects still missing organisation_id', v_missing_count;
  END IF;
END $$;

-- Add NOT NULL constraint
ALTER TABLE public.projects 
ALTER COLUMN organisation_id SET NOT NULL;

-- Add constraint to ensure projects belong to valid organisations
ALTER TABLE public.projects
ADD CONSTRAINT fk_projects_organisation
FOREIGN KEY (organisation_id) REFERENCES public.organisations(id);

RAISE NOTICE 'organisation_id is now required on projects';
```

---

## 8.5 Phase 3: RLS Policy Updates

### 8.5.1 Create Helper Functions

```sql
-- ============================================================
-- Migration: 004_create_rls_helper_functions.sql
-- Description: Create helper functions for RLS policies
-- ============================================================

-- Check if user is system admin
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'system_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is member of an organisation
CREATE OR REPLACE FUNCTION public.is_org_member(p_organisation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organisations 
    WHERE user_id = auth.uid() 
    AND organisation_id = p_organisation_id 
    AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's role in an organisation
CREATE OR REPLACE FUNCTION public.get_org_role(p_organisation_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT org_role INTO v_role
  FROM user_organisations 
  WHERE user_id = auth.uid() 
  AND organisation_id = p_organisation_id 
  AND is_active = TRUE;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is org admin (owner or admin)
CREATE OR REPLACE FUNCTION public.is_org_admin(p_organisation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := get_org_role(p_organisation_id);
  RETURN v_role IN ('org_owner', 'org_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is org owner
CREATE OR REPLACE FUNCTION public.is_org_owner(p_organisation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_org_role(p_organisation_id) = 'org_owner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user can access a project (validates both project AND org membership)
CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- System admin can access everything
  IF is_system_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- Get the project's organisation
  SELECT organisation_id INTO v_org_id 
  FROM projects 
  WHERE id = p_project_id;
  
  IF v_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Must be org member
  IF NOT is_org_member(v_org_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Must have project membership (or be org admin for visibility)
  RETURN EXISTS (
    SELECT 1 FROM user_projects 
    WHERE user_id = auth.uid() 
    AND project_id = p_project_id
  ) OR is_org_admin(v_org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's role in a project
CREATE OR REPLACE FUNCTION public.get_project_role(p_project_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM user_projects 
  WHERE user_id = auth.uid() 
  AND project_id = p_project_id;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has specific project role(s)
CREATE OR REPLACE FUNCTION public.has_project_role(p_project_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  IF is_system_admin() THEN
    RETURN TRUE;
  END IF;
  
  RETURN get_project_role(p_project_id) = ANY(p_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get all accessible project IDs for current user
CREATE OR REPLACE FUNCTION public.get_accessible_project_ids()
RETURNS SETOF UUID AS $$
BEGIN
  -- System admin gets all projects
  IF is_system_admin() THEN
    RETURN QUERY SELECT id FROM projects WHERE is_deleted = FALSE;
    RETURN;
  END IF;
  
  -- Return projects user has explicit access to (within their orgs)
  RETURN QUERY
  SELECT DISTINCT p.id
  FROM projects p
  JOIN user_organisations uo ON p.organisation_id = uo.organisation_id
  WHERE uo.user_id = auth.uid()
  AND uo.is_active = TRUE
  AND p.is_deleted = FALSE
  AND (
    -- Has project membership
    EXISTS (
      SELECT 1 FROM user_projects up 
      WHERE up.user_id = auth.uid() 
      AND up.project_id = p.id
    )
    -- Or is org admin
    OR uo.org_role IN ('org_owner', 'org_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_system_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_project_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_project_ids() TO authenticated;
```

### 8.5.2 Update RLS Policies

```sql
-- ============================================================
-- Migration: 005_update_rls_policies.sql
-- Description: Update RLS policies for organisation awareness
-- ============================================================

-- ============================================================
-- Organisations table policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view their organisations" ON organisations;
DROP POLICY IF EXISTS "System admins can insert organisations" ON organisations;
DROP POLICY IF EXISTS "Org admins can update their organisations" ON organisations;
DROP POLICY IF EXISTS "Org owners can delete their organisations" ON organisations;

CREATE POLICY "Users can view their organisations"
ON organisations FOR SELECT
USING (
  is_system_admin() OR
  is_org_member(id)
);

CREATE POLICY "System admins can insert organisations"
ON organisations FOR INSERT
WITH CHECK (is_system_admin());

CREATE POLICY "Org admins can update their organisations"
ON organisations FOR UPDATE
USING (is_system_admin() OR is_org_admin(id))
WITH CHECK (is_system_admin() OR is_org_admin(id));

CREATE POLICY "Org owners can delete their organisations"
ON organisations FOR DELETE
USING (is_system_admin() OR is_org_owner(id));

-- ============================================================
-- User organisations table policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view org memberships" ON user_organisations;
DROP POLICY IF EXISTS "Org admins can insert memberships" ON user_organisations;
DROP POLICY IF EXISTS "Org admins can update memberships" ON user_organisations;
DROP POLICY IF EXISTS "Users can remove themselves or admins can remove others" ON user_organisations;

CREATE POLICY "Users can view org memberships"
ON user_organisations FOR SELECT
USING (
  is_system_admin() OR
  user_id = auth.uid() OR
  is_org_admin(organisation_id)
);

CREATE POLICY "Org admins can insert memberships"
ON user_organisations FOR INSERT
WITH CHECK (
  is_system_admin() OR
  (
    is_org_admin(organisation_id) AND
    -- Cannot add org_owner unless system admin
    (org_role != 'org_owner' OR is_system_admin())
  )
);

CREATE POLICY "Org admins can update memberships"
ON user_organisations FOR UPDATE
USING (
  is_system_admin() OR
  is_org_admin(organisation_id)
)
WITH CHECK (
  is_system_admin() OR
  (
    is_org_admin(organisation_id) AND
    -- Cannot change to/from org_owner unless system admin
    (org_role != 'org_owner' OR is_system_admin())
  )
);

CREATE POLICY "Users can remove themselves or admins can remove others"
ON user_organisations FOR DELETE
USING (
  is_system_admin() OR
  user_id = auth.uid() OR
  (
    is_org_admin(organisation_id) AND
    -- Cannot remove org_owner
    org_role != 'org_owner'
  )
);

-- ============================================================
-- Projects table policies (updated)
-- ============================================================

DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

CREATE POLICY "Users can view accessible projects"
ON projects FOR SELECT
USING (
  is_deleted = FALSE AND
  (is_system_admin() OR can_access_project(id))
);

CREATE POLICY "Org admins can insert projects"
ON projects FOR INSERT
WITH CHECK (
  is_system_admin() OR
  is_org_admin(organisation_id)
);

CREATE POLICY "Project admins and org admins can update projects"
ON projects FOR UPDATE
USING (
  is_system_admin() OR
  has_project_role(id, ARRAY['admin', 'supplier_pm']) OR
  is_org_admin(organisation_id)
)
WITH CHECK (
  is_system_admin() OR
  has_project_role(id, ARRAY['admin', 'supplier_pm']) OR
  is_org_admin(organisation_id)
);

CREATE POLICY "Project admins and org admins can delete projects"
ON projects FOR DELETE
USING (
  is_system_admin() OR
  has_project_role(id, ARRAY['admin']) OR
  is_org_admin(organisation_id)
);

-- ============================================================
-- User projects table policies (updated)
-- ============================================================

DROP POLICY IF EXISTS "Users can view project memberships" ON user_projects;
DROP POLICY IF EXISTS "Admins can insert project memberships" ON user_projects;
DROP POLICY IF EXISTS "Admins can update project memberships" ON user_projects;
DROP POLICY IF EXISTS "Users can delete project memberships" ON user_projects;

CREATE POLICY "Users can view project memberships"
ON user_projects FOR SELECT
USING (
  is_system_admin() OR
  user_id = auth.uid() OR
  has_project_role(project_id, ARRAY['admin', 'supplier_pm']) OR
  is_org_admin((SELECT organisation_id FROM projects WHERE id = project_id))
);

CREATE POLICY "Admins can insert project memberships"
ON user_projects FOR INSERT
WITH CHECK (
  is_system_admin() OR
  has_project_role(project_id, ARRAY['admin', 'supplier_pm']) OR
  is_org_admin((SELECT organisation_id FROM projects WHERE id = project_id))
);

CREATE POLICY "Admins can update project memberships"
ON user_projects FOR UPDATE
USING (
  is_system_admin() OR
  has_project_role(project_id, ARRAY['admin', 'supplier_pm']) OR
  is_org_admin((SELECT organisation_id FROM projects WHERE id = project_id))
);

CREATE POLICY "Users can delete own membership or admins can delete others"
ON user_projects FOR DELETE
USING (
  is_system_admin() OR
  user_id = auth.uid() OR
  has_project_role(project_id, ARRAY['admin', 'supplier_pm']) OR
  is_org_admin((SELECT organisation_id FROM projects WHERE id = project_id))
);

-- ============================================================
-- Entity tables template (apply to each entity table)
-- Example: timesheets
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can insert timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can update timesheets" ON timesheets;
DROP POLICY IF EXISTS "Users can delete timesheets" ON timesheets;

-- Create new org-aware policies
CREATE POLICY "Users can view timesheets"
ON timesheets FOR SELECT
USING (
  is_deleted = FALSE AND
  (is_system_admin() OR can_access_project(project_id))
);

CREATE POLICY "Users can insert timesheets"
ON timesheets FOR INSERT
WITH CHECK (
  is_system_admin() OR
  (
    can_access_project(project_id) AND
    has_project_role(project_id, ARRAY['admin', 'supplier_pm', 'contributor'])
  )
);

CREATE POLICY "Users can update timesheets"
ON timesheets FOR UPDATE
USING (
  is_system_admin() OR
  (
    can_access_project(project_id) AND
    (
      -- Own draft/rejected timesheets
      (resource_id IN (SELECT linked_resource_id FROM profiles WHERE id = auth.uid()) 
       AND status IN ('Draft', 'Rejected'))
      -- Or admin/pm
      OR has_project_role(project_id, ARRAY['admin', 'supplier_pm', 'customer_pm'])
    )
  )
);

CREATE POLICY "Users can delete timesheets"
ON timesheets FOR DELETE
USING (
  is_system_admin() OR
  (
    can_access_project(project_id) AND
    (
      -- Own draft timesheets
      (resource_id IN (SELECT linked_resource_id FROM profiles WHERE id = auth.uid()) 
       AND status = 'Draft')
      -- Or admin
      OR has_project_role(project_id, ARRAY['admin'])
    )
  )
);

-- Repeat similar pattern for other entity tables:
-- expenses, milestones, deliverables, resources, partners, 
-- kpis, quality_standards, raid_items, variations, etc.
```

### 8.5.3 Entity Table Policy Template

```sql
-- ============================================================
-- Template for entity table RLS policies
-- Replace {TABLE_NAME} and adjust roles as needed
-- ============================================================

-- Standard entity policy (view/create/edit/delete)
CREATE POLICY "Users can view {TABLE_NAME}"
ON {TABLE_NAME} FOR SELECT
USING (
  (is_deleted = FALSE OR is_deleted IS NULL) AND
  (is_system_admin() OR can_access_project(project_id))
);

CREATE POLICY "Users can insert {TABLE_NAME}"
ON {TABLE_NAME} FOR INSERT
WITH CHECK (
  is_system_admin() OR
  (
    can_access_project(project_id) AND
    has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
  )
);

CREATE POLICY "Users can update {TABLE_NAME}"
ON {TABLE_NAME} FOR UPDATE
USING (
  is_system_admin() OR
  (
    can_access_project(project_id) AND
    has_project_role(project_id, ARRAY['admin', 'supplier_pm'])
  )
);

CREATE POLICY "Users can delete {TABLE_NAME}"
ON {TABLE_NAME} FOR DELETE
USING (
  is_system_admin() OR
  (
    can_access_project(project_id) AND
    has_project_role(project_id, ARRAY['admin'])
  )
);
```

---

## 8.6 Phase 4: Application Deployment

### 8.6.1 Deployment Checklist

```markdown
## Pre-Deployment
- [ ] All migration scripts tested in staging
- [ ] Database backup completed
- [ ] New code deployed to staging and tested
- [ ] Rollback plan documented

## Deployment Steps
1. [ ] Enable maintenance mode
2. [ ] Run Phase 1 (schema updates)
3. [ ] Run Phase 2 (data migration)
4. [ ] Run Phase 3 (RLS policies)
5. [ ] Deploy new application code
6. [ ] Run verification tests
7. [ ] Disable maintenance mode
8. [ ] Monitor for errors

## Post-Deployment
- [ ] Verify user login works
- [ ] Verify organisation switcher appears
- [ ] Verify project access unchanged
- [ ] Verify data visibility correct
- [ ] Monitor error logs for 24 hours
```

### 8.6.2 Environment Variables

```bash
# No new environment variables required
# Existing SUPABASE_URL and SUPABASE_ANON_KEY continue to work
```

### 8.6.3 Cache Invalidation

```javascript
// After deployment, clear all caches
// This can be done via admin endpoint or manually

// In browser console for each logged-in user:
localStorage.clear();
sessionStorage.clear();

// Or programmatically after login:
import { invalidateAllCaches } from './lib/cache';
invalidateAllCaches();
```

---

## 8.7 Phase 5: Verification & Cleanup

### 8.7.1 Verification Queries

```sql
-- ============================================================
-- Post-Migration Verification Script
-- ============================================================

-- 1. Check organisation structure
SELECT 
  o.id,
  o.name,
  o.slug,
  (SELECT COUNT(*) FROM user_organisations WHERE organisation_id = o.id AND is_active = TRUE) as member_count,
  (SELECT COUNT(*) FROM projects WHERE organisation_id = o.id AND is_deleted = FALSE) as project_count
FROM organisations o
WHERE is_deleted = FALSE;

-- 2. Check all users have org membership
SELECT 
  p.id,
  p.full_name,
  p.email,
  CASE WHEN uo.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_org,
  uo.org_role
FROM profiles p
LEFT JOIN user_organisations uo ON p.id = uo.user_id AND uo.is_active = TRUE
ORDER BY has_org, p.full_name;

-- 3. Check projects have organisation
SELECT 
  p.id,
  p.name,
  p.project_ref,
  o.name as organisation_name,
  (SELECT COUNT(*) FROM user_projects WHERE project_id = p.id) as member_count
FROM projects p
LEFT JOIN organisations o ON p.organisation_id = o.id
WHERE p.is_deleted = FALSE;

-- 4. Check RLS is working (run as different users)
-- This should only return accessible organisations
SELECT * FROM organisations;

-- This should only return accessible projects
SELECT id, name FROM projects;

-- 5. Check helper functions work
SELECT 
  is_system_admin() as am_i_system_admin,
  is_org_member((SELECT id FROM organisations LIMIT 1)) as am_i_org_member,
  get_org_role((SELECT id FROM organisations LIMIT 1)) as my_org_role;
```

### 8.7.2 Functional Tests

```markdown
## Manual Verification Tests

### Authentication
- [ ] User can log in successfully
- [ ] Session persists after refresh
- [ ] Logout clears all state

### Organisation
- [ ] Organisation name appears in header
- [ ] Organisation switcher shows (if multi-org)
- [ ] Switching organisations clears project selection
- [ ] Org settings accessible to org admins only
- [ ] Org members page shows correct members

### Projects
- [ ] Projects list shows only org projects
- [ ] Creating project assigns to current org
- [ ] Project access works for assigned users
- [ ] Project access denied for non-members

### Data Access
- [ ] Timesheets visible for accessible projects only
- [ ] Cross-org data not visible
- [ ] System admin can see all data
- [ ] Org admin can see all org projects
```

### 8.7.3 Cleanup Tasks

```sql
-- ============================================================
-- Post-Migration Cleanup (Optional)
-- ============================================================

-- Remove any temporary migration markers
UPDATE organisations 
SET settings = settings - 'migrated_from_legacy' - 'migration_date'
WHERE settings ? 'migrated_from_legacy';

-- Analyze tables for query optimizer
ANALYZE organisations;
ANALYZE user_organisations;
ANALYZE projects;
ANALYZE user_projects;

-- Update table statistics
VACUUM ANALYZE;
```

---

## 8.8 Rollback Procedures

### 8.8.1 Full Rollback Script

```sql
-- ============================================================
-- ROLLBACK: Revert organisation multi-tenancy migration
-- WARNING: This will remove all organisation data
-- ============================================================

-- Step 1: Drop new RLS policies
DROP POLICY IF EXISTS "Users can view their organisations" ON organisations;
DROP POLICY IF EXISTS "System admins can insert organisations" ON organisations;
DROP POLICY IF EXISTS "Org admins can update their organisations" ON organisations;
DROP POLICY IF EXISTS "Org owners can delete their organisations" ON organisations;

DROP POLICY IF EXISTS "Users can view org memberships" ON user_organisations;
DROP POLICY IF EXISTS "Org admins can insert memberships" ON user_organisations;
DROP POLICY IF EXISTS "Org admins can update memberships" ON user_organisations;
DROP POLICY IF EXISTS "Users can remove themselves or admins can remove others" ON user_organisations;

-- Step 2: Restore original project policies
-- (Re-apply your original project RLS policies here)

-- Step 3: Remove organisation_id from projects
ALTER TABLE projects DROP CONSTRAINT IF EXISTS fk_projects_organisation;
ALTER TABLE projects DROP COLUMN IF EXISTS organisation_id;

-- Step 4: Drop helper functions
DROP FUNCTION IF EXISTS public.is_system_admin();
DROP FUNCTION IF EXISTS public.is_org_member(UUID);
DROP FUNCTION IF EXISTS public.get_org_role(UUID);
DROP FUNCTION IF EXISTS public.is_org_admin(UUID);
DROP FUNCTION IF EXISTS public.is_org_owner(UUID);
DROP FUNCTION IF EXISTS public.can_access_project(UUID);
DROP FUNCTION IF EXISTS public.get_project_role(UUID);
DROP FUNCTION IF EXISTS public.has_project_role(UUID, TEXT[]);
DROP FUNCTION IF EXISTS public.get_accessible_project_ids();

-- Step 5: Drop new tables
DROP TABLE IF EXISTS public.user_organisations;
DROP TABLE IF EXISTS public.organisations;

-- Step 6: Verify rollback
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organisations') 
    THEN 'FAIL: organisations table still exists'
    ELSE 'PASS: organisations table removed'
  END as rollback_status;
```

### 8.8.2 Partial Rollback (Keep Schema, Revert Policies)

```sql
-- ============================================================
-- PARTIAL ROLLBACK: Revert RLS policies only
-- Use if policies cause issues but schema is fine
-- ============================================================

-- Temporarily disable RLS
ALTER TABLE organisations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_organisations DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their organisations" ON organisations;
-- ... drop other policies as needed

-- Create permissive temporary policy
CREATE POLICY "Temporary: allow all" ON organisations FOR ALL USING (true);
CREATE POLICY "Temporary: allow all" ON user_organisations FOR ALL USING (true);

-- Re-enable RLS
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organisations ENABLE ROW LEVEL SECURITY;

-- Note: Fix and re-apply proper policies before going to production
```

---

## 8.9 Migration Timeline

### 8.9.1 Estimated Durations

| Phase | Duration | Notes |
|-------|----------|-------|
| Pre-migration checks | 15 min | Run queries, gather info |
| Phase 1: Schema | 2 min | DDL statements |
| Phase 2: Data | 5-30 min | Depends on data volume |
| Phase 3: RLS | 5 min | Policy updates |
| Phase 4: Deploy | 10 min | Application deployment |
| Phase 5: Verify | 30 min | Testing and validation |
| **Total** | **~1-2 hours** | With buffer |

### 8.9.2 Recommended Migration Window

```
Recommended: Low-traffic period (e.g., weekend evening)
Duration: 2-hour maintenance window
Rollback buffer: 30 minutes additional
Communication: Notify users 24 hours in advance
```

---

## 8.10 Chapter Summary

This chapter established:

1. **Pre-Migration Checklist** - Prerequisites and information gathering

2. **Phase 1: Schema Updates** - Create organisations and user_organisations tables

3. **Phase 2: Data Migration** - Populate default organisation, assign projects, create memberships

4. **Phase 3: RLS Policies** - Helper functions and updated policies for all tables

5. **Phase 4: Application Deployment** - Deployment checklist and cache invalidation

6. **Phase 5: Verification** - SQL verification queries and functional tests

7. **Rollback Procedures** - Full and partial rollback scripts

8. **Timeline** - Estimated durations and recommended migration window

---

## Next Chapter Preview

**Chapter 9: Testing Strategy** will cover:
- Unit test updates
- E2E test updates
- Test data seeding
- Role-based test scenarios
- CI/CD integration

---

*Document generated as part of AMSF001 Organisation-Level Multi-Tenancy Implementation Guide*
