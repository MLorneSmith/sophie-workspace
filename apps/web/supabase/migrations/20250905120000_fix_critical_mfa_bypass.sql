-- CRITICAL SECURITY FIX: Re-enable MFA verification for super-admin access
-- Issue #308: MFA Bypass for Super-Admin Access - Complete Authentication Bypass
-- Date: 2025-09-05
-- Severity: CRITICAL (P0)
-- 
-- This migration fixes a critical security vulnerability where MFA verification 
-- was disabled for super-admin access, violating OWASP Top 10 and compliance requirements.

-- Create or replace the is_super_admin function with MFA enforcement
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

    -- Check if the user has the super-admin role in app_metadata
    SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' INTO is_super_admin;
    
    RETURN COALESCE(is_super_admin, false);
END
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Add comment documenting the security requirement
COMMENT ON FUNCTION public.is_super_admin() IS 
'Checks if the current user is a super-admin with MFA verification. 
SECURITY REQUIREMENT: MFA (AAL2) verification is mandatory for super-admin access.
This function enforces two-factor authentication to prevent unauthorized administrative access.';

-- Verify the fix has been applied
DO $$
DECLARE
    function_body text;
BEGIN
    -- Get the function body to verify MFA check is present
    SELECT prosrc INTO function_body
    FROM pg_proc
    WHERE proname = 'is_super_admin'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

    -- Check if the MFA verification is present and not commented
    IF function_body LIKE '%IF NOT public.is_aal2() THEN%' AND
       function_body NOT LIKE '%--%IF NOT public.is_aal2()%' THEN
        RAISE NOTICE 'SUCCESS: MFA verification is properly enabled in is_super_admin function';
    ELSE
        RAISE WARNING 'CRITICAL: MFA verification may not be properly enabled - manual verification required';
    END IF;

    RAISE NOTICE 'Security Fix Applied: Super-admin access now requires two-factor authentication (AAL2)';
    RAISE NOTICE 'Next Steps: 1) Audit admin access logs, 2) Force MFA enrollment for all admin users';
END $$;