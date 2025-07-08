-- Fix foreign key constraints that prevent user deletion
-- This migration updates audit columns (created_by, updated_by) to SET NULL on user deletion
-- instead of preventing the deletion entirely

-- Fix accounts table
ALTER TABLE public.accounts 
  DROP CONSTRAINT IF EXISTS accounts_created_by_fkey,
  ADD CONSTRAINT accounts_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.accounts 
  DROP CONSTRAINT IF EXISTS accounts_updated_by_fkey,
  ADD CONSTRAINT accounts_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix accounts_memberships table
ALTER TABLE public.accounts_memberships 
  DROP CONSTRAINT IF EXISTS accounts_memberships_created_by_fkey,
  ADD CONSTRAINT accounts_memberships_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.accounts_memberships 
  DROP CONSTRAINT IF EXISTS accounts_memberships_updated_by_fkey,
  ADD CONSTRAINT accounts_memberships_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix other tables that might have created_by/updated_by without CASCADE
-- Check and fix any other tables with audit columns

-- First, let's identify all foreign keys to auth.users that don't have CASCADE or SET NULL
DO $$
DECLARE
    rec RECORD;
    sql_text TEXT;
BEGIN
    FOR rec IN 
        SELECT 
            n.nspname AS schema_name,
            cl.relname AS table_name,
            a.attname AS column_name,
            con.conname AS constraint_name,
            CASE con.confdeltype
                WHEN 'a' THEN 'NO ACTION'
                WHEN 'r' THEN 'RESTRICT'
                WHEN 'c' THEN 'CASCADE'
                WHEN 'n' THEN 'SET NULL'
                WHEN 'd' THEN 'SET DEFAULT'
            END AS delete_action
        FROM pg_constraint con
        JOIN pg_class cl ON cl.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = cl.relnamespace
        JOIN pg_attribute a ON a.attnum = ANY(con.conkey) AND a.attrelid = con.conrelid
        WHERE con.contype = 'f'
          AND con.confrelid = 'auth.users'::regclass
          AND con.confdeltype NOT IN ('c', 'n') -- Not CASCADE or SET NULL
          AND n.nspname = 'public'
          AND a.attname IN ('created_by', 'updated_by') -- Only audit columns
    LOOP
        -- Drop and recreate the constraint with SET NULL
        sql_text := format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL',
                          rec.schema_name, rec.table_name, rec.constraint_name, rec.constraint_name, rec.column_name);
        
        RAISE NOTICE 'Fixing constraint: %.%.% -> %', rec.schema_name, rec.table_name, rec.column_name, sql_text;
        EXECUTE sql_text;
    END LOOP;
END $$;

-- Also check for tables that might not have proper CASCADE on user_id columns
-- (These should cascade, not set null, as they represent ownership)

-- Fix any missing CASCADE on primary user relationships
-- Note: Most of these should already have CASCADE, but let's verify

-- Verify the changes by listing all foreign keys to auth.users
-- This is just for logging/verification, not making changes
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current foreign key constraints to auth.users:';
    FOR rec IN 
        SELECT 
            n.nspname || '.' || cl.relname || '.' || a.attname AS full_column,
            CASE con.confdeltype
                WHEN 'a' THEN 'NO ACTION'
                WHEN 'r' THEN 'RESTRICT'
                WHEN 'c' THEN 'CASCADE'
                WHEN 'n' THEN 'SET NULL'
                WHEN 'd' THEN 'SET DEFAULT'
            END AS delete_action
        FROM pg_constraint con
        JOIN pg_class cl ON cl.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = cl.relnamespace
        JOIN pg_attribute a ON a.attnum = ANY(con.conkey) AND a.attrelid = con.conrelid
        WHERE con.contype = 'f'
          AND con.confrelid = 'auth.users'::regclass
          AND n.nspname = 'public'
        ORDER BY full_column
    LOOP
        RAISE NOTICE '  % -> %', rec.full_column, rec.delete_action;
    END LOOP;
END $$;