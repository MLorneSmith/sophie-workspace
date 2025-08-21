-- Migration: Fix AI Usage Cost Tracking Permissions
-- Description: Adds necessary function permissions and enhances RLS policies

-- Grant execute permissions on required functions to authenticated users and service role
DO $$
BEGIN
  -- Grant execute permissions on the AI functions
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.calculate_ai_cost(text, text, integer, integer) TO authenticated, service_role';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.deduct_ai_credits(text, uuid, numeric, text, text) TO authenticated, service_role';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.check_ai_usage_limits(text, uuid, numeric, integer) TO authenticated, service_role';
  
  RAISE NOTICE 'Function permissions granted to authenticated and service_role users';
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error granting function permissions: %', SQLERRM;
END;
$$;

-- Ensure RLS policies are correctly set
DO $$
BEGIN
  -- Ensure the insert policy for ai_request_logs is set correctly
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_request_logs' 
    AND cmd = 'INSERT' 
    AND rolname = 'authenticated'
  ) THEN
    CREATE POLICY "Allow insert for authenticated users" ON public.ai_request_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
    
    RAISE NOTICE 'Created insert policy for ai_request_logs';
  ELSE
    RAISE NOTICE 'Insert policy for ai_request_logs already exists';
  END IF;

  -- Ensure service role has full access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_request_logs' 
    AND cmd = 'ALL' 
    AND rolname = 'service_role'
  ) THEN
    CREATE POLICY "Service role can do all operations on ai_request_logs" ON public.ai_request_logs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    
    RAISE NOTICE 'Created all-access policy for service_role on ai_request_logs';
  ELSE
    RAISE NOTICE 'Service role all-access policy for ai_request_logs already exists';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error ensuring RLS policies: %', SQLERRM;
END;
$$;

-- Add more models to cost configuration if they don't exist
INSERT INTO public.ai_cost_configuration 
(provider, model, input_cost_per_1k_tokens, output_cost_per_1k_tokens, markup_percentage)
VALUES
  -- OpenAI models - additional models
  ('openai', 'gpt-4-turbo', 0.01, 0.03, 10),
  ('openai', 'gpt-4o', 0.01, 0.03, 10),
  
  -- Mistral models
  ('mistral', 'mistral-large', 0.008, 0.024, 10),
  ('mistral', 'mistral-medium', 0.002, 0.006, 10),
  ('mistral', 'mistral-small', 0.0008, 0.0024, 10),
  
  -- Google models
  ('google', 'gemini-pro', 0.00025, 0.00125, 10),
  ('google', 'gemini-1.5-pro', 0.0005, 0.0015, 10)
ON CONFLICT (provider, model, effective_from) DO NOTHING;

-- Add missing indexes if any
DO $$
BEGIN
  -- Check for and add additional indexes that might help performance
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ai_request_logs' 
    AND indexname = 'idx_request_logs_provider_model_tokens'
  ) THEN
    CREATE INDEX idx_request_logs_provider_model_tokens 
    ON public.ai_request_logs(provider, model, total_tokens);
    
    RAISE NOTICE 'Created index idx_request_logs_provider_model_tokens';
  END IF;

  -- Add index for quicker cost analytics
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ai_request_logs' 
    AND indexname = 'idx_request_logs_cost_timestamp'
  ) THEN
    CREATE INDEX idx_request_logs_cost_timestamp 
    ON public.ai_request_logs(cost, request_timestamp);
    
    RAISE NOTICE 'Created index idx_request_logs_cost_timestamp';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error adding indexes: %', SQLERRM;
END;
$$;

-- Environment config variables
DO $$
BEGIN
  -- Check if config table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'config') THEN
    -- Insert AI gateway configuration if not exists
    IF NOT EXISTS (SELECT 1 FROM public.config WHERE key = 'ai_gateway') THEN
      INSERT INTO public.config (key, value, description)
      VALUES (
        'ai_gateway', 
        jsonb_build_object(
          'bypass_credits', true,
          'check_usage_limits', false,
          'debug_mode', false
        ),
        'AI Gateway configuration settings'
      );
      
      RAISE NOTICE 'Added ai_gateway configuration';
    ELSE
      RAISE NOTICE 'ai_gateway configuration already exists';
    END IF;
  ELSE
    RAISE NOTICE 'Config table does not exist, skipping environment configuration';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error setting environment configuration: %', SQLERRM;
END;
$$;

-- Verify permission grants
DO $$
BEGIN
  -- Test function access
  PERFORM public.calculate_ai_cost('openai', 'gpt-3.5-turbo', 10, 5);
  RAISE NOTICE 'Successfully executed calculate_ai_cost function, permissions are working';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING 'Permission denied when testing calculate_ai_cost. The grant may not have worked correctly.';
  WHEN others THEN
    RAISE WARNING 'Error testing function permissions: %', SQLERRM;
END;
$$;
