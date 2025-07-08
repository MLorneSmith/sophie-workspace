-- Comprehensive fix for all foreign key constraints that prevent user deletion
-- This migration updates ALL foreign keys to auth.users to either CASCADE or SET NULL appropriately

-- First, fix all remaining foreign keys that don't have proper deletion behavior
DO $$
DECLARE
    rec RECORD;
    sql_text TEXT;
BEGIN
    -- Fix all non-cascade, non-set-null constraints
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
    LOOP
        -- Determine appropriate action based on column name
        IF rec.column_name IN ('created_by', 'updated_by', 'invited_by') THEN
            -- Audit columns should SET NULL
            sql_text := format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL',
                              rec.schema_name, rec.table_name, rec.constraint_name, rec.constraint_name, rec.column_name);
        ELSIF rec.column_name = 'user_id' THEN
            -- User ownership columns should CASCADE (with some exceptions)
            IF rec.table_name IN ('ai_credit_transactions', 'ai_usage_allocations', 'ai_usage_limits') THEN
                -- AI tracking data should SET NULL to preserve history
                sql_text := format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL',
                                  rec.schema_name, rec.table_name, rec.constraint_name, rec.constraint_name, rec.column_name);
            ELSE
                -- Most user_id columns should CASCADE
                sql_text := format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE',
                                  rec.schema_name, rec.table_name, rec.constraint_name, rec.constraint_name, rec.column_name);
            END IF;
        ELSIF rec.column_name = 'account_id' AND rec.table_name = 'tasks' THEN
            -- Special case: tasks.account_id references auth.users, should CASCADE
            sql_text := format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE',
                              rec.schema_name, rec.table_name, rec.constraint_name, rec.constraint_name, rec.column_name);
        ELSE
            -- Default to CASCADE for other cases
            sql_text := format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I, ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE',
                              rec.schema_name, rec.table_name, rec.constraint_name, rec.constraint_name, rec.column_name);
        END IF;
        
        RAISE NOTICE 'Fixing constraint: %.%.% -> %', rec.schema_name, rec.table_name, rec.column_name, sql_text;
        EXECUTE sql_text;
    END LOOP;
END $$;

-- Handle special cases that might have duplicate constraints
-- Fix certificates table which appears to have duplicate constraints
ALTER TABLE public.certificates 
  DROP CONSTRAINT IF EXISTS certificates_user_id_fkey1;

-- Fix onboarding table
ALTER TABLE public.onboarding
  DROP CONSTRAINT IF EXISTS onboarding_user_id_fkey,
  ADD CONSTRAINT onboarding_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix building_blocks_submissions table
ALTER TABLE public.building_blocks_submissions
  DROP CONSTRAINT IF EXISTS building_blocks_submissions_user_id_fkey,
  ADD CONSTRAINT building_blocks_submissions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify final state
DO $$
DECLARE
    rec RECORD;
    constraint_count INTEGER := 0;
    problem_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Final foreign key constraints to auth.users:';
    RAISE NOTICE '=============================================';
    
    FOR rec IN 
        SELECT 
            n.nspname || '.' || cl.relname || '.' || a.attname AS full_column,
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
          AND n.nspname = 'public'
        ORDER BY full_column
    LOOP
        constraint_count := constraint_count + 1;
        RAISE NOTICE '  % -> % (%)', rec.full_column, rec.delete_action, rec.constraint_name;
        
        IF rec.delete_action NOT IN ('CASCADE', 'SET NULL') THEN
            problem_count := problem_count + 1;
            RAISE WARNING '  ⚠️  PROBLEM: % still has %!', rec.full_column, rec.delete_action;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total constraints: %', constraint_count;
    RAISE NOTICE 'Problematic constraints: %', problem_count;
    
    IF problem_count > 0 THEN
        RAISE WARNING 'There are still % constraints that might prevent user deletion!', problem_count;
    ELSE
        RAISE NOTICE '✅ All constraints are properly configured for user deletion!';
    END IF;
END $$;