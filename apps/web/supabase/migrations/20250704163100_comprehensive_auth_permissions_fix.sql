-- Comprehensive fix for auth service permissions during user sign-up
-- This migration ensures all triggers and functions can execute properly

-- Grant supabase_auth_admin the necessary permissions for all operations during user creation

-- 1. Basic schema permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA kit TO supabase_auth_admin;
GRANT USAGE ON SCHEMA extensions TO supabase_auth_admin;

-- 2. Permissions for kit.setup_new_user function (creates personal account)
GRANT EXECUTE ON FUNCTION kit.setup_new_user() TO supabase_auth_admin;
GRANT INSERT ON TABLE public.accounts TO supabase_auth_admin;
GRANT SELECT ON TABLE public.config TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION extensions.uuid_generate_v4() TO supabase_auth_admin;

-- 3. Permissions for create_default_ai_allocation function
GRANT EXECUTE ON FUNCTION public.create_default_ai_allocation() TO supabase_auth_admin;
GRANT INSERT ON TABLE public.ai_usage_allocations TO supabase_auth_admin;

-- 4. Permissions for set_next_reset_time trigger function
GRANT EXECUTE ON FUNCTION public.set_next_reset_time() TO supabase_auth_admin;

-- 5. Permissions for any sequences used
DO $$
BEGIN
    -- Grant permissions on ai_usage_allocations sequence if it exists
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'ai_usage_allocations_id_seq') THEN
        GRANT USAGE ON SEQUENCE public.ai_usage_allocations_id_seq TO supabase_auth_admin;
    END IF;
END $$;

-- 6. Although not used in current triggers, grant permission on accounts_memberships
-- in case it's accessed by other code paths
GRANT INSERT ON TABLE public.accounts_memberships TO supabase_auth_admin;

-- 7. Ensure all trigger functions run with proper privileges
ALTER FUNCTION kit.setup_new_user() SECURITY DEFINER;
ALTER FUNCTION public.create_default_ai_allocation() SECURITY DEFINER;
ALTER FUNCTION public.set_next_reset_time() SECURITY DEFINER;

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Auth permissions have been comprehensively updated for user sign-up flow';
END $$;