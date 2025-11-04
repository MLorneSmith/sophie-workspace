-- Migration: AI Usage Cost Tracking System
-- Description: Creates tables and functions for tracking AI API usage and costs

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Request Logs Table
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  request_id TEXT,
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  feature TEXT, -- which feature used this (canvas, outline generator, etc)
  session_id TEXT,
  status TEXT DEFAULT 'completed',
  error TEXT,
  portkey_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for query optimization
CREATE INDEX idx_request_logs_user_id ON public.ai_request_logs(user_id);
CREATE INDEX idx_request_logs_team_id ON public.ai_request_logs(team_id);
CREATE INDEX idx_request_logs_feature ON public.ai_request_logs(feature);
CREATE INDEX idx_request_logs_provider_model ON public.ai_request_logs(provider, model);
CREATE INDEX idx_request_logs_timestamp ON public.ai_request_logs(request_timestamp);

-- AI Usage Allocations Table
CREATE TABLE IF NOT EXISTS public.ai_usage_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.accounts(id),
  credits_allocated DECIMAL(10, 4) NOT NULL DEFAULT 0,
  credits_used DECIMAL(10, 4) NOT NULL DEFAULT 0,
  allocation_type TEXT NOT NULL, -- 'free', 'purchased', 'promotional'
  reset_frequency TEXT, -- 'never', 'daily', 'weekly', 'monthly'
  next_reset_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR team_id IS NOT NULL),
  CHECK (credits_allocated >= 0),
  CHECK (credits_used >= 0)
);

-- Indexes for query optimization
CREATE INDEX idx_allocations_user_id ON public.ai_usage_allocations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_allocations_team_id ON public.ai_usage_allocations(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_allocations_active ON public.ai_usage_allocations(is_active);

-- AI Credit Transactions Table
CREATE TABLE IF NOT EXISTS public.ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.accounts(id),
  allocation_id UUID REFERENCES public.ai_usage_allocations(id),
  amount DECIMAL(10, 4) NOT NULL, -- negative for debits, positive for credits
  transaction_type TEXT NOT NULL, -- 'usage', 'purchase', 'allocation', 'expiration', 'adjustment'
  reference_id TEXT, -- request_id for usage, payment_id for purchases
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  CHECK (user_id IS NOT NULL OR team_id IS NOT NULL)
);

-- Indexes for query optimization
CREATE INDEX idx_transactions_user_id ON public.ai_credit_transactions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_transactions_team_id ON public.ai_credit_transactions(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_transactions_allocation_id ON public.ai_credit_transactions(allocation_id);
CREATE INDEX idx_transactions_type ON public.ai_credit_transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON public.ai_credit_transactions(created_at);

-- AI Cost Configuration Table
CREATE TABLE IF NOT EXISTS public.ai_cost_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_cost_per_1k_tokens DECIMAL(10, 6) NOT NULL,
  output_cost_per_1k_tokens DECIMAL(10, 6) NOT NULL,
  markup_percentage DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (provider, model, effective_from)
);

-- Initial data for common models
INSERT INTO public.ai_cost_configuration
(provider, model, input_cost_per_1k_tokens, output_cost_per_1k_tokens, markup_percentage)
VALUES
('openai', 'gpt-3.5-turbo', 0.0015, 0.002, 10),
('openai', 'gpt-4', 0.03, 0.06, 10),
('anthropic', 'claude-3-opus', 0.015, 0.075, 10),
('anthropic', 'claude-3-sonnet', 0.003, 0.015, 10),
('anthropic', 'claude-3-haiku', 0.00025, 0.00125, 10);

-- Usage Limits Table
CREATE TABLE IF NOT EXISTS public.ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.accounts(id),
  limit_type TEXT NOT NULL, -- 'cost' or 'tokens'
  time_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'total'
  max_value DECIMAL(10, 4) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR team_id IS NOT NULL)
);

-- RLS policies
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_cost_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

-- User access policies for ai_request_logs
CREATE POLICY "Users can view their own AI requests" ON public.ai_request_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teams can view their AI requests" ON public.ai_request_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.accounts_memberships
    WHERE account_id = ai_request_logs.team_id
    AND user_id = auth.uid()
  ));

-- Add explicit insert permissions for ai_request_logs
CREATE POLICY "Allow insert for authenticated users" ON public.ai_request_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add service role policies to all AI tracking tables
CREATE POLICY "Service role can do all operations on ai_request_logs" ON public.ai_request_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all operations on ai_usage_allocations" ON public.ai_usage_allocations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all operations on ai_credit_transactions" ON public.ai_credit_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all operations on ai_cost_configuration" ON public.ai_cost_configuration
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do all operations on ai_usage_limits" ON public.ai_usage_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User access policies for ai_usage_allocations
CREATE POLICY "Users can view their own allocations" ON public.ai_usage_allocations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can view team allocations" ON public.ai_usage_allocations
  FOR SELECT USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE account_id = ai_usage_allocations.team_id
      AND user_id = auth.uid()
    )
  );

-- User access policies for ai_credit_transactions
CREATE POLICY "Users can view their own transactions" ON public.ai_credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can view team transactions" ON public.ai_credit_transactions
  FOR SELECT USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE account_id = ai_credit_transactions.team_id
      AND user_id = auth.uid()
    )
  );

-- Public access policies for ai_cost_configuration
CREATE POLICY "Cost configuration is viewable by all" ON public.ai_cost_configuration
  FOR SELECT USING (true);

-- User access policies for ai_usage_limits
CREATE POLICY "Users can view their own usage limits" ON public.ai_usage_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can view team usage limits" ON public.ai_usage_limits
  FOR SELECT USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE account_id = ai_usage_limits.team_id
      AND user_id = auth.uid()
    )
  );

-- Admin policies
-- Owners of any account can manage AI resources
CREATE POLICY "Owners can manage all request logs" ON public.ai_request_logs
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships 
      WHERE user_id = auth.uid() 
      AND account_role = 'owner'
    )
  );

CREATE POLICY "Owners can manage all allocations" ON public.ai_usage_allocations
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships 
      WHERE user_id = auth.uid() 
      AND account_role = 'owner'
    )
  );

CREATE POLICY "Owners can manage all transactions" ON public.ai_credit_transactions
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships 
      WHERE user_id = auth.uid() 
      AND account_role = 'owner'
    )
  );

CREATE POLICY "Owners can manage cost configuration" ON public.ai_cost_configuration
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships 
      WHERE user_id = auth.uid() 
      AND account_role = 'owner'
    )
  );

CREATE POLICY "Owners can manage usage limits" ON public.ai_usage_limits
  USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships 
      WHERE user_id = auth.uid() 
      AND account_role = 'owner'
    )
  );

-- Function to calculate cost based on token usage
CREATE OR REPLACE FUNCTION public.calculate_ai_cost(
  p_provider TEXT,
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER
) RETURNS DECIMAL AS $$
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
$$ LANGUAGE plpgsql;

-- Function to deduct credits from user/team allocation
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(
  p_entity_type TEXT, -- 'user' or 'team'
  p_entity_id UUID,
  p_amount DECIMAL,
  p_feature TEXT,
  p_request_id TEXT
) RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql;

-- Function to check if a user/team has exceeded usage limits
CREATE OR REPLACE FUNCTION public.check_ai_usage_limits(
  p_entity_type TEXT, -- 'user' or 'team'
  p_entity_id UUID,
  p_cost DECIMAL,
  p_tokens INTEGER
) RETURNS TABLE (
  limit_exceeded BOOLEAN,
  limit_type TEXT,
  time_period TEXT,
  current_usage DECIMAL,
  max_value DECIMAL
) AS $$
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
$$ LANGUAGE plpgsql;

-- Function to process allocation resets
CREATE OR REPLACE FUNCTION public.reset_ai_allocations() RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create a trigger to set next_reset_at when a new allocation is created
CREATE OR REPLACE FUNCTION public.set_next_reset_time() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_ai_allocation_reset_time
BEFORE INSERT ON public.ai_usage_allocations
FOR EACH ROW
WHEN (NEW.reset_frequency IS NOT NULL)
EXECUTE FUNCTION public.set_next_reset_time();

-- Create default allocations for new users
CREATE OR REPLACE FUNCTION public.create_default_ai_allocation() RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_default_ai_allocation
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_default_ai_allocation();

-- Create a function to add default allocations for existing users
CREATE OR REPLACE FUNCTION public.add_default_ai_allocations_for_existing_users() RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Execute the function to add default allocations for existing users
SELECT public.add_default_ai_allocations_for_existing_users();
