-- ============================================
-- P14: Force Password Change on First Login
-- ============================================
-- Adds must_change_password flag to profiles table
-- Users created by admins must change their password on first login
-- Execute in Supabase SQL Editor

-- Add the must_change_password column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.must_change_password IS 
  'When true, user must change password before accessing the application. Set by admin when creating users.';

-- Update existing users to not require password change (they already set their own)
UPDATE public.profiles 
SET must_change_password = false 
WHERE must_change_password IS NULL;

-- Verification
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'must_change_password';
