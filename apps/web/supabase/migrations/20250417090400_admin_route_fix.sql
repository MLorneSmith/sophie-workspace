-- Fix for the admin route 404 error
-- This migration updates the is_super_admin() function to check for the super-admin role in app_metadata
-- instead of checking the is_super_admin column in the auth.users table

-- Create or replace the is_aal2 function to check for MFA authentication
-- This is used by the is_super_admin function
CREATE OR REPLACE FUNCTION public.is_aal2() 
RETURNS boolean
SET search_path = '' 
AS $$
DECLARE
    is_aal2 boolean;
BEGIN
    SELECT auth.jwt() ->> 'aal' = 'aal2' INTO is_aal2;
    RETURN COALESCE(is_aal2, false);
END
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_aal2() TO authenticated;

-- Create or replace the is_super_admin function to check for the super-admin role
-- in app_metadata instead of the is_super_admin column
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
SET search_path = ''
AS $$
DECLARE
    is_super_admin boolean;
BEGIN
    -- CRITICAL: MFA verification is REQUIRED for super-admin access
    -- This check ensures that super-admins must have second-factor authentication
    IF NOT public.is_aal2() THEN
        RETURN false;
    END IF;

    SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' INTO is_super_admin;
    RETURN COALESCE(is_super_admin, false);
END
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE 'Admin route fix has been successfully applied.';
    RAISE NOTICE 'The is_super_admin() function now checks for the super-admin role in app_metadata.';
    RAISE NOTICE 'MFA requirement is ENFORCED for super-admin access for security compliance.';
END $$;
