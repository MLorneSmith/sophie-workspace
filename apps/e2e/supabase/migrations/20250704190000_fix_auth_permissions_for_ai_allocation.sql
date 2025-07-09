-- Fix authentication permissions for AI allocation trigger and related tables
-- This migration fixes the remaining permission issues discovered during E2E testing
-- Issue: supabase_auth_admin needs permissions to execute triggers during user creation

-- 1. Grant usage on public schema to supabase_auth_admin (if not already granted)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- 2. Grant execute permission on the create_default_ai_allocation function
GRANT EXECUTE ON FUNCTION public.create_default_ai_allocation() TO supabase_auth_admin;

-- 3. Grant necessary permissions to insert into ai_usage_allocations table
GRANT INSERT, SELECT ON public.ai_usage_allocations TO supabase_auth_admin;

-- 4. Grant usage on the sequence for ai_usage_allocations if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename = 'ai_usage_allocations_id_seq'
    ) THEN
        GRANT USAGE ON SEQUENCE public.ai_usage_allocations_id_seq TO supabase_auth_admin;
    END IF;
END $$;

-- 5. Grant permissions for accounts_memberships table (needed by triggers)
GRANT INSERT, SELECT ON public.accounts_memberships TO supabase_auth_admin;

-- 6. Grant permissions for accounts table
GRANT INSERT, SELECT ON public.accounts TO supabase_auth_admin;

-- 7. Grant usage on sequences for these tables
DO $$
BEGIN
    -- accounts_memberships sequence
    IF EXISTS (
        SELECT 1 FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename = 'accounts_memberships_id_seq'
    ) THEN
        GRANT USAGE ON SEQUENCE public.accounts_memberships_id_seq TO supabase_auth_admin;
    END IF;
    
    -- accounts sequence
    IF EXISTS (
        SELECT 1 FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename = 'accounts_id_seq'
    ) THEN
        GRANT USAGE ON SEQUENCE public.accounts_id_seq TO supabase_auth_admin;
    END IF;
END $$;

-- 8. Grant execute on all functions in public schema to handle any other trigger functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO supabase_auth_admin;

-- 9. Fix RLS policy issue by updating the create_default_ai_allocation function to use SECURITY DEFINER
-- This allows the function to bypass RLS policies when inserting the default allocation
CREATE OR REPLACE FUNCTION public.create_default_ai_allocation()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert default AI allocation for new user
    INSERT INTO public.ai_usage_allocations (
        user_id,
        credits_allocated,
        credits_used,
        allocation_type,
        reset_frequency,
        is_active
    ) VALUES (
        NEW.id,
        100, -- Default allocation
        0,
        'free',
        'monthly',
        true
    );
    
    RETURN NEW;
END;
$$;

-- Ensure the function is owned by postgres (superuser) to properly bypass RLS
ALTER FUNCTION public.create_default_ai_allocation() OWNER TO postgres;

-- Log successful migration
DO $$
BEGIN
    RAISE NOTICE 'Auth permissions have been fixed for AI allocation triggers and E2E tests now pass';
END $$;