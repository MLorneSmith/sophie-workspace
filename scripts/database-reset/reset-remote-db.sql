-- SQL script to reset application tables in the remote database
-- Preserves system schemas: auth, storage, extensions, etc.

-- Drop all user tables in 'public' schema except system schemas
DO
$$
DECLARE
    r RECORD;
BEGIN
    -- Drop tables in 'public' schema
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('auth', 'storage', 'extensions') LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE;', r.tablename);
    END LOOP;

    -- Drop all tables in 'payload' schema
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'payload' LOOP
        EXECUTE format('DROP TABLE IF EXISTS payload.%I CASCADE;', r.tablename);
    END LOOP;

    -- Reset migration history
    DELETE FROM supabase_migrations.migrations;

    -- Recreate payload schema with permissions
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS payload;';
    EXECUTE 'GRANT ALL ON SCHEMA payload TO postgres;';
END
$$;