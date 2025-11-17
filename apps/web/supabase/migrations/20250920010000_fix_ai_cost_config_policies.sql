-- Quick fix for ai_cost_configuration multiple ALL policies
-- Issue: Service role and authenticated role both have ALL policies

BEGIN;

-- Drop our created policy since service_role already has ALL access
DROP POLICY IF EXISTS "ai_cost_configuration_write_policy" ON public.ai_cost_configuration;

-- The service_role policy "Service role can do all operations on ai_cost_configuration" should remain
-- The select policy "ai_cost_configuration_select_policy" should also remain for public access

COMMIT;
