-- Migration: Fix Function Search Path Security Vulnerability
-- Description: Adds explicit search_path to all functions to prevent schema poisoning attacks
-- Issue: ISSUE-145 - Security Warning: Function Search Path Mutable

-- Public Schema Functions

-- 1. Fix insert_certificate function
CREATE OR REPLACE FUNCTION public.insert_certificate(
  p_user_id UUID,
  p_course_id TEXT,
  p_file_path TEXT
)
RETURNS TABLE (id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Added explicit search_path
AS $$
DECLARE
  v_certificate_id UUID;
BEGIN
  -- Insert the certificate record
  INSERT INTO public.certificates (user_id, course_id, file_path)
  VALUES (p_user_id, p_course_id, p_file_path)
  RETURNING public.certificates.id INTO v_certificate_id;
  
  -- Return the certificate ID
  RETURN QUERY SELECT v_certificate_id;
END;
$$;

-- 2. Fix handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 3. Fix reset_ai_allocations function
CREATE OR REPLACE FUNCTION public.reset_ai_allocations() 
RETURNS INTEGER 
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
DECLARE
  v_reset_count INTEGER := 0;
  v_allocation RECORD;
BEGIN
  -- Find allocations due for reset
  FOR v_allocation IN
    SELECT id, user_id, team_id, credits_used, allocation_type, reset_frequency
    FROM public.ai_usage_allocations
    WHERE is_active = true
      AND next_reset_at <= NOW()
      AND reset_frequency IS NOT NULL
      AND reset_frequency IN ('daily', 'weekly', 'monthly')
  LOOP
    -- Reset the usage
    UPDATE public.ai_usage_allocations
    SET
      credits_used = 0,
      next_reset_at =
        CASE
          WHEN v_allocation.reset_frequency = 'daily' THEN NOW() + INTERVAL '1 day'
          WHEN v_allocation.reset_frequency = 'weekly' THEN NOW() + INTERVAL '7 days'
          WHEN v_allocation.reset_frequency = 'monthly' THEN NOW() + INTERVAL '1 month'
          ELSE NULL
        END,
      updated_at = NOW()
    WHERE id = v_allocation.id;

    -- Record the reset transaction
    INSERT INTO public.ai_credit_transactions (
      user_id,
      team_id,
      allocation_id,
      amount,
      transaction_type,
      description
    ) VALUES (
      v_allocation.user_id,
      v_allocation.team_id,
      v_allocation.id,
      v_allocation.credits_used, -- Reset the full amount used
      'reset',
      'Periodic reset (' || v_allocation.reset_frequency || ')'
    );

    v_reset_count := v_reset_count + 1;
  END LOOP;

  RETURN v_reset_count;
END;
$$;

-- 4. Fix set_next_reset_time function
CREATE OR REPLACE FUNCTION public.set_next_reset_time() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
BEGIN
  IF NEW.reset_frequency = 'daily' THEN
    NEW.next_reset_at := NOW() + INTERVAL '1 day';
  ELSIF NEW.reset_frequency = 'weekly' THEN
    NEW.next_reset_at := NOW() + INTERVAL '7 days';
  ELSIF NEW.reset_frequency = 'monthly' THEN
    NEW.next_reset_at := NOW() + INTERVAL '1 month';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Fix create_default_ai_allocation function
CREATE OR REPLACE FUNCTION public.create_default_ai_allocation() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Added explicit search_path
AS $$
BEGIN
  INSERT INTO public.ai_usage_allocations (
    user_id,
    credits_allocated,
    allocation_type,
    reset_frequency
  ) VALUES (
    NEW.id,
    100, -- Default free credits
    'free',
    'monthly'
  );
  
  RETURN NEW;
END;
$$;

-- 6. Fix add_default_ai_allocations_for_existing_users function
CREATE OR REPLACE FUNCTION public.add_default_ai_allocations_for_existing_users() 
RETURNS INTEGER 
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
DECLARE
  v_count INTEGER := 0;
  v_user RECORD;
BEGIN
  FOR v_user IN
    SELECT id FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM public.ai_usage_allocations WHERE user_id IS NOT NULL)
  LOOP
    INSERT INTO public.ai_usage_allocations (
      user_id,
      credits_allocated,
      allocation_type,
      reset_frequency
    ) VALUES (
      v_user.id,
      100, -- Default free credits
      'free',
      'monthly'
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- 7. Fix calculate_ai_cost function
CREATE OR REPLACE FUNCTION public.calculate_ai_cost(
  p_provider TEXT,
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER
) 
RETURNS DECIMAL 
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
DECLARE
  v_input_cost DECIMAL;
  v_output_cost DECIMAL;
  v_markup DECIMAL;
  v_total_cost DECIMAL;
BEGIN
  -- Get cost configuration
  SELECT
    input_cost_per_1k_tokens,
    output_cost_per_1k_tokens,
    markup_percentage
  INTO
    v_input_cost,
    v_output_cost,
    v_markup
  FROM public.ai_cost_configuration
  WHERE provider = p_provider
    AND model = p_model
    AND is_active = true
    AND (effective_to IS NULL OR effective_to > NOW())
  ORDER BY effective_from DESC
  LIMIT 1;

  -- If no configuration found, return 0
  IF v_input_cost IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate base cost
  v_total_cost := (p_prompt_tokens / 1000.0 * v_input_cost) +
                 (p_completion_tokens / 1000.0 * v_output_cost);

  -- Apply markup
  RETURN v_total_cost * (1 + v_markup / 100.0);
END;
$$;

-- 8. Fix deduct_ai_credits function
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(
  p_entity_type TEXT, -- 'user' or 'team'
  p_entity_id UUID,
  p_amount DECIMAL,
  p_feature TEXT,
  p_request_id TEXT
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
DECLARE
  v_allocation_id UUID;
  v_balance DECIMAL;
  v_user_id UUID;
  v_team_id UUID;
  v_insufficient BOOLEAN := FALSE;
BEGIN
  -- Set user or team ID based on entity type
  IF p_entity_type = 'user' THEN
    v_user_id := p_entity_id;
  ELSIF p_entity_type = 'team' THEN
    v_team_id := p_entity_id;
  ELSE
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;

  -- Lock the allocations for update to prevent race conditions
  IF p_entity_type = 'user' THEN
    SELECT id, credits_allocated - credits_used
    INTO v_allocation_id, v_balance
    FROM public.ai_usage_allocations
    WHERE user_id = v_user_id
      AND is_active = true
    ORDER BY
      CASE
        WHEN allocation_type = 'free' THEN 3
        WHEN allocation_type = 'promotional' THEN 2
        WHEN allocation_type = 'purchased' THEN 1
      END,
      next_reset_at DESC NULLS LAST
    LIMIT 1
    FOR UPDATE;
  ELSE
    SELECT id, credits_allocated - credits_used
    INTO v_allocation_id, v_balance
    FROM public.ai_usage_allocations
    WHERE team_id = v_team_id
      AND is_active = true
    ORDER BY
      CASE
        WHEN allocation_type = 'free' THEN 3
        WHEN allocation_type = 'promotional' THEN 2
        WHEN allocation_type = 'purchased' THEN 1
      END,
      next_reset_at DESC NULLS LAST
    LIMIT 1
    FOR UPDATE;
  END IF;

  -- Check if allocation exists
  IF v_allocation_id IS NULL THEN
    -- No allocation found, return false
    RETURN FALSE;
  END IF;

  -- Check if enough balance
  IF v_balance < p_amount THEN
    v_insufficient := TRUE;
    -- Continue anyway but mark the transaction as exceeding balance
  END IF;

  -- Update allocation
  UPDATE public.ai_usage_allocations
  SET
    credits_used = credits_used + p_amount,
    updated_at = NOW()
  WHERE id = v_allocation_id;

  -- Record transaction
  INSERT INTO public.ai_credit_transactions (
    user_id,
    team_id,
    allocation_id,
    amount,
    transaction_type,
    reference_id,
    description
  ) VALUES (
    v_user_id,
    v_team_id,
    v_allocation_id,
    -p_amount,
    CASE WHEN v_insufficient THEN 'usage_exceeded' ELSE 'usage' END,
    p_request_id,
    'AI request: ' || p_feature
  );

  -- Return success status
  RETURN NOT v_insufficient;
END;
$$;

-- 9. Fix check_ai_usage_limits function
CREATE OR REPLACE FUNCTION public.check_ai_usage_limits(
  p_entity_type TEXT, -- 'user' or 'team'
  p_entity_id UUID,
  p_cost DECIMAL,
  p_tokens INTEGER
) 
RETURNS TABLE (
  limit_exceeded BOOLEAN,
  limit_type TEXT,
  time_period TEXT,
  current_usage DECIMAL,
  max_value DECIMAL
) 
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
DECLARE
  v_user_id UUID;
  v_team_id UUID;
BEGIN
  -- Set user or team ID based on entity type
  IF p_entity_type = 'user' THEN
    v_user_id := p_entity_id;
  ELSIF p_entity_type = 'team' THEN
    v_team_id := p_entity_id;
  ELSE
    RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
  END IF;

  -- Check daily cost limit
  RETURN QUERY
  WITH limits AS (
    SELECT
      l.limit_type,
      l.time_period,
      l.max_value
    FROM public.ai_usage_limits l
    WHERE (l.user_id = v_user_id OR l.team_id = v_team_id)
      AND l.is_active = true
  ),
  daily_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '1 day')
  ),
  weekly_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '7 days')
  ),
  monthly_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '30 days')
  ),
  total_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
  ),
  daily_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '1 day')
  ),
  weekly_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '7 days')
  ),
  monthly_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '30 days')
  ),
  total_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM public.ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
  )
  SELECT
    CASE
      WHEN l.limit_type = 'cost' AND l.time_period = 'daily' THEN (d.usage + p_cost) > l.max_value
      WHEN l.limit_type = 'cost' AND l.time_period = 'weekly' THEN (w.usage + p_cost) > l.max_value
      WHEN l.limit_type = 'cost' AND l.time_period = 'monthly' THEN (m.usage + p_cost) > l.max_value
      WHEN l.limit_type = 'cost' AND l.time_period = 'total' THEN (t.usage + p_cost) > l.max_value
      WHEN l.limit_type = 'tokens' AND l.time_period = 'daily' THEN (dt.usage + p_tokens) > l.max_value
      WHEN l.limit_type = 'tokens' AND l.time_period = 'weekly' THEN (wt.usage + p_tokens) > l.max_value
      WHEN l.limit_type = 'tokens' AND l.time_period = 'monthly' THEN (mt.usage + p_tokens) > l.max_value
      WHEN l.limit_type = 'tokens' AND l.time_period = 'total' THEN (tt.usage + p_tokens) > l.max_value
      ELSE FALSE
    END as limit_exceeded,
    l.limit_type,
    l.time_period,
    CASE
      WHEN l.limit_type = 'cost' AND l.time_period = 'daily' THEN d.usage
      WHEN l.limit_type = 'cost' AND l.time_period = 'weekly' THEN w.usage
      WHEN l.limit_type = 'cost' AND l.time_period = 'monthly' THEN m.usage
      WHEN l.limit_type = 'cost' AND l.time_period = 'total' THEN t.usage
      WHEN l.limit_type = 'tokens' AND l.time_period = 'daily' THEN dt.usage::decimal
      WHEN l.limit_type = 'tokens' AND l.time_period = 'weekly' THEN wt.usage::decimal
      WHEN l.limit_type = 'tokens' AND l.time_period = 'monthly' THEN mt.usage::decimal
      WHEN l.limit_type = 'tokens' AND l.time_period = 'total' THEN tt.usage::decimal
      ELSE 0
    END as current_usage,
    l.max_value
  FROM limits l
  CROSS JOIN daily_cost d
  CROSS JOIN weekly_cost w
  CROSS JOIN monthly_cost m
  CROSS JOIN total_cost t
  CROSS JOIN daily_tokens dt
  CROSS JOIN weekly_tokens wt
  CROSS JOIN monthly_tokens mt
  CROSS JOIN total_tokens tt
  WHERE
    (l.limit_type = 'cost' AND l.time_period = 'daily' AND (d.usage + p_cost) > l.max_value) OR
    (l.limit_type = 'cost' AND l.time_period = 'weekly' AND (w.usage + p_cost) > l.max_value) OR
    (l.limit_type = 'cost' AND l.time_period = 'monthly' AND (m.usage + p_cost) > l.max_value) OR
    (l.limit_type = 'cost' AND l.time_period = 'total' AND (t.usage + p_cost) > l.max_value) OR
    (l.limit_type = 'tokens' AND l.time_period = 'daily' AND (dt.usage + p_tokens) > l.max_value) OR
    (l.limit_type = 'tokens' AND l.time_period = 'weekly' AND (wt.usage + p_tokens) > l.max_value) OR
    (l.limit_type = 'tokens' AND l.time_period = 'monthly' AND (mt.usage + p_tokens) > l.max_value) OR
    (l.limit_type = 'tokens' AND l.time_period = 'total' AND (tt.usage + p_tokens) > l.max_value);
END;
$$;

-- Payload Schema Functions

-- 10. Fix collection_has_download function
CREATE OR REPLACE FUNCTION payload.collection_has_download(collection_id text, collection_type text, download_id text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
DECLARE
    has_download boolean;
    table_name text;
    query text;
BEGIN
    -- Sanitize the collection_type to prevent SQL injection
    table_name := format('%I', collection_type);
    
    -- Check if the table has a downloads_id column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND table_name = collection_type 
        AND column_name = 'downloads_id'
    ) THEN
        RETURN false;
    END IF;
    
    -- Build and execute the query
    query := format('SELECT EXISTS(SELECT 1 FROM payload.%I WHERE id = $1 AND downloads_id = $2)', collection_type);
    EXECUTE query INTO has_download USING collection_id, download_id;
    
    RETURN has_download;
EXCEPTION
    WHEN OTHERS THEN
        -- Return false on any error
        RETURN false;
END;
$$;

-- 11. Fix ensure_downloads_id_column function
CREATE OR REPLACE FUNCTION payload.ensure_downloads_id_column(table_name text)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
BEGIN
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id character varying', table_name);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors, column might already exist
        NULL;
END;
$$;

-- 12. Fix ensure_downloads_id_column_exists function
CREATE OR REPLACE FUNCTION payload.ensure_downloads_id_column_exists(table_name text)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
BEGIN
    -- Check if downloads_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'payload' 
        AND information_schema.columns.table_name = ensure_downloads_id_column_exists.table_name 
        AND column_name = 'downloads_id'
    ) THEN
        -- Add the column
        EXECUTE format('ALTER TABLE payload.%I ADD COLUMN downloads_id character varying', table_name);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Handle errors gracefully
        RAISE NOTICE 'Error adding downloads_id to %: %', table_name, SQLERRM;
END;
$$;

-- 13. Fix ensure_relationship_columns function
CREATE OR REPLACE FUNCTION payload.ensure_relationship_columns(table_name text)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
BEGIN
    -- Add relationship columns if they don't exist
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS downloads_id character varying', table_name);
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS pricing_options_id character varying', table_name);
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS call_to_action_id character varying', table_name);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors gracefully
        NULL;
END;
$$;

-- 14. Fix fix_dynamic_table function
CREATE OR REPLACE FUNCTION payload.fix_dynamic_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
BEGIN
    -- Add the path column to the dynamic table
    EXECUTE format('ALTER TABLE payload.%I ADD COLUMN IF NOT EXISTS path character varying', table_name);
EXCEPTION
    WHEN OTHERS THEN
        -- Handle errors gracefully
        RAISE NOTICE 'Error adding path column to %: %', table_name, SQLERRM;
END;
$$;

-- 15. Fix get_downloads_for_collection function
CREATE OR REPLACE FUNCTION payload.get_downloads_for_collection(collection_id text, collection_type text)
RETURNS TABLE(download_id text)
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('SELECT downloads_id::text FROM payload.%I WHERE id = $1 AND downloads_id IS NOT NULL', collection_type)
    USING collection_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Return empty result on error
        RETURN;
END;
$$;

-- 16. Fix get_relationship_data function
CREATE OR REPLACE FUNCTION payload.get_relationship_data(table_name text, id text, fallback_column text DEFAULT 'path'::text)
RETURNS json
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
DECLARE
    result json;
    query text;
    column_list text;
BEGIN
    -- Get list of columns for the table
    SELECT string_agg(quote_ident(column_name), ', ') INTO column_list
    FROM information_schema.columns
    WHERE table_schema = 'payload' 
    AND information_schema.columns.table_name = get_relationship_data.table_name;
    
    -- If no columns found, return null
    IF column_list IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Build and execute query
    query := format('SELECT row_to_json(t) FROM (SELECT %s FROM payload.%I WHERE id = $1) t', column_list, table_name);
    EXECUTE query INTO result USING id;
    
    RETURN result;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, try with fallback
        BEGIN
            query := format('SELECT row_to_json(t) FROM (SELECT * FROM payload.%I WHERE %I = $1) t', table_name, fallback_column);
            EXECUTE query INTO result USING id;
            RETURN result;
        EXCEPTION
            WHEN OTHERS THEN
                -- Return empty object on any error
                RETURN '{}'::json;
        END;
    WHEN OTHERS THEN
        -- Return empty object on any other error
        RETURN '{}'::json;
END;
$$;

-- 17. Fix safe_uuid_conversion function
CREATE OR REPLACE FUNCTION payload.safe_uuid_conversion(text_value text)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''  -- Added explicit search_path
AS $$
BEGIN
    RETURN text_value::uuid;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN NULL;
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- 18. Fix scan_and_fix_uuid_tables function (if it still exists)
-- Note: This function was dropped in a later migration, but we'll fix it for completeness
-- Only create if it doesn't exist (it may have been dropped)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'payload' AND p.proname = 'scan_and_fix_uuid_tables'
    ) THEN
        CREATE OR REPLACE FUNCTION payload.scan_and_fix_uuid_tables()
        RETURNS void
        LANGUAGE plpgsql
        SET search_path = ''  -- Added explicit search_path
        AS $func$
        DECLARE
            table_record RECORD;
            uuid_value uuid;
        BEGIN
            -- Find all tables that might be UUID-named dynamic tables
            FOR table_record IN 
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'payload' 
                AND table_type = 'BASE TABLE'
            LOOP
                -- Try to convert table name to UUID
                BEGIN
                    uuid_value := table_record.table_name::uuid;
                    -- If successful, it's a UUID table - add missing columns
                    PERFORM payload.ensure_relationship_columns(table_record.table_name);
                    PERFORM payload.fix_dynamic_table(table_record.table_name);
                    RAISE NOTICE 'Fixed UUID table: %', table_record.table_name;
                EXCEPTION
                    WHEN invalid_text_representation THEN
                        -- Not a UUID, skip
                        NULL;
                END;
            END LOOP;
        END;
        $func$;
    END IF;
END;
$$;

-- Add comment to document the security fix
COMMENT ON FUNCTION public.insert_certificate(UUID, TEXT, TEXT) IS 'Insert certificate record with fixed search_path for security';
COMMENT ON FUNCTION public.handle_updated_at() IS 'Update timestamp trigger with fixed search_path for security';
COMMENT ON FUNCTION public.reset_ai_allocations() IS 'Reset AI allocations with fixed search_path for security';
COMMENT ON FUNCTION public.set_next_reset_time() IS 'Set next reset time trigger with fixed search_path for security';
COMMENT ON FUNCTION public.create_default_ai_allocation() IS 'Create default AI allocation trigger with fixed search_path for security';
COMMENT ON FUNCTION public.add_default_ai_allocations_for_existing_users() IS 'Add default allocations for existing users with fixed search_path for security';
COMMENT ON FUNCTION public.calculate_ai_cost(TEXT, TEXT, INTEGER, INTEGER) IS 'Calculate AI cost with fixed search_path for security';
COMMENT ON FUNCTION public.deduct_ai_credits(TEXT, UUID, DECIMAL, TEXT, TEXT) IS 'Deduct AI credits with fixed search_path for security';
COMMENT ON FUNCTION public.check_ai_usage_limits(TEXT, UUID, DECIMAL, INTEGER) IS 'Check AI usage limits with fixed search_path for security';
COMMENT ON FUNCTION payload.collection_has_download(TEXT, TEXT, TEXT) IS 'Check collection download with fixed search_path for security';
COMMENT ON FUNCTION payload.ensure_downloads_id_column(TEXT) IS 'Ensure downloads_id column with fixed search_path for security';
COMMENT ON FUNCTION payload.ensure_downloads_id_column_exists(TEXT) IS 'Ensure downloads_id column exists with fixed search_path for security';
COMMENT ON FUNCTION payload.ensure_relationship_columns(TEXT) IS 'Ensure relationship columns with fixed search_path for security';
COMMENT ON FUNCTION payload.fix_dynamic_table(TEXT) IS 'Fix dynamic table with fixed search_path for security';
COMMENT ON FUNCTION payload.get_downloads_for_collection(TEXT, TEXT) IS 'Get downloads for collection with fixed search_path for security';
COMMENT ON FUNCTION payload.get_relationship_data(TEXT, TEXT, TEXT) IS 'Get relationship data with fixed search_path for security';
COMMENT ON FUNCTION payload.safe_uuid_conversion(TEXT) IS 'Safe UUID conversion with fixed search_path for security';