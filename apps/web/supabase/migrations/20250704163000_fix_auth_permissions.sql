-- Fix permissions for auth service to execute setup_new_user function
-- This resolves the "permission denied for schema public" and "permission denied for table ai_usage_allocations" errors during sign-up

-- Grant usage on the public schema to supabase_auth_admin
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Grant execute permission on kit.setup_new_user function to supabase_auth_admin
GRANT EXECUTE ON FUNCTION kit.setup_new_user() TO supabase_auth_admin;

-- Grant necessary permissions for the setup_new_user function to create personal accounts
-- The function needs to insert into public.accounts table
GRANT INSERT ON TABLE public.accounts TO supabase_auth_admin;

-- The function also needs to access kit schema
GRANT USAGE ON SCHEMA kit TO supabase_auth_admin;

-- Grant permissions to access the config table for checking if personal accounts are enabled
GRANT SELECT ON TABLE public.config TO supabase_auth_admin;

-- Grant access to extensions schema for uuid generation
GRANT USAGE ON SCHEMA extensions TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION extensions.uuid_generate_v4() TO supabase_auth_admin;

-- Fix permission denied for table ai_usage_allocations
-- This table is used during user creation for AI usage tracking
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_usage_allocations') THEN
        GRANT INSERT, SELECT ON TABLE public.ai_usage_allocations TO supabase_auth_admin;
    END IF;
END $$;

-- Grant permissions on any sequences used by ai_usage_allocations
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'ai_usage_allocations_id_seq') THEN
        GRANT USAGE ON SEQUENCE public.ai_usage_allocations_id_seq TO supabase_auth_admin;
    END IF;
END $$;

-- Grant permissions on accounts_memberships table
-- This is needed for the setup_new_user function to create the membership
GRANT INSERT ON TABLE public.accounts_memberships TO supabase_auth_admin;

-- Ensure the trigger can execute properly
ALTER FUNCTION kit.setup_new_user() SECURITY DEFINER;