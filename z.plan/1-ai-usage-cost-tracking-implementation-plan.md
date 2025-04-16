# AI API Usage and Cost Tracking System - Implementation Plan

## Table of Contents

1. [Overview](#1-overview)
2. [Portkey Integration Analysis](#2-portkey-integration-analysis)
3. [Database Schema](#3-database-schema)
4. [Implementation Components](#4-implementation-components)
5. [Implementation Timeline](#5-implementation-timeline)
6. [Technical Considerations](#6-technical-considerations)
7. [Future Enhancements](#7-future-enhancements)

## 1. Overview

### 1.1 Purpose

The AI API Usage and Cost Tracking System will provide comprehensive tracking, management, and reporting of AI API usage and associated costs within the SlideHeroes application. It will integrate with our existing Portkey AI Gateway implementation to capture usage data and costs for each AI API call.

### 1.2 Core Requirements

1. **Usage Tracking**: Capture detailed metrics for each AI API call
2. **Cost Calculation**: Accurately determine the cost of each API call
3. **User/Team Allocation**: Manage and enforce AI usage credits for users and teams
4. **Reporting**: Provide comprehensive usage and cost analytics
5. **Administrative Controls**: Allow administrators to manage quotas and pricing

### 1.3 Key Benefits

1. **Cost Control**: Prevent unexpected AI usage costs
2. **Usage Transparency**: Give users visibility into their AI consumption
3. **Resource Allocation**: Fairly distribute AI resources among users
4. **Business Intelligence**: Support data-driven decisions about AI feature development
5. **Revenue Management**: Enable accurate cost allocation and potential monetization

## 2. Portkey Integration Analysis

### 2.1 Current Implementation

Our application currently uses Portkey for AI Gateway services:

```typescript
// packages/ai-gateway/src/gateway-client.ts
import OpenAI from 'openai';

if (!process.env.PORTKEY_API_KEY) {
  throw new Error('PORTKEY_API_KEY environment variable is not set');
}

if (!process.env.PORTKEY_VIRTUAL_KEY) {
  throw new Error('PORTKEY_VIRTUAL_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: '', // Can be left blank when using virtual keys
  baseURL: 'https://api.portkey.ai/v1/proxy',
  defaultHeaders: {
    'x-portkey-api-key': process.env.PORTKEY_API_KEY,
    'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY,
    'x-portkey-provider': 'openai',
  },
});

export default openai;
```

### 2.2 Portkey Cost Tracking Capabilities

Based on our review of Portkey documentation, the following capabilities are available:

1. **Request-Level Cost Data**:

   - Cost information is returned in response headers (`x-portkey-cost`)
   - Token usage is provided in the OpenAI response object
   - Request IDs can be used to correlate requests with Portkey analytics

2. **Metadata Tracking**:

   - Requests can include metadata via headers for categorization
   - `x-portkey-request-metadata-*` headers can attach custom tracking information
   - This enables segmentation by user, team, feature, etc.

3. **Virtual Keys with Budget Limits** (Enterprise feature):

   - Budget limits can be set on virtual keys in USD
   - Automatic key expiration when limits are reached
   - Monthly reset options available

4. **Analytics API**:
   - Usage data can be queried via Portkey's API
   - Provides cost aggregation across different dimensions
   - Enables reconciliation and verification of internal tracking

### 2.3 Portkey Cost Tracking Approach

We will implement a dual approach for cost tracking:

1. **Real-time Tracking**:

   - Capture cost data from response headers during API calls
   - Supplement with our own cost calculation when header data is unavailable
   - Log all requests to our database with user context and cost information

2. **Reconciliation**:
   - Periodically query Portkey's API to verify cost data
   - Update our records if discrepancies are found
   - Ensure accurate reporting even if real-time tracking has gaps

## 3. Database Schema

The following database schema will support our AI usage tracking system:

### 3.1 AI Request Logs Table

```sql
-- Tracks individual AI request logs with cost data
CREATE TABLE ai_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_request_logs_user_id ON ai_request_logs(user_id);
CREATE INDEX idx_request_logs_team_id ON ai_request_logs(team_id);
CREATE INDEX idx_request_logs_feature ON ai_request_logs(feature);
CREATE INDEX idx_request_logs_provider_model ON ai_request_logs(provider, model);
CREATE INDEX idx_request_logs_timestamp ON ai_request_logs(request_timestamp);
```

### 3.2 AI Usage Allocations Table

```sql
-- User/Team usage allocations
CREATE TABLE ai_usage_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_allocations_user_id ON ai_usage_allocations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_allocations_team_id ON ai_usage_allocations(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_allocations_active ON ai_usage_allocations(is_active);
```

### 3.3 AI Credit Transactions Table

```sql
-- Credit transaction ledger
CREATE TABLE ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES public.accounts(id),
  allocation_id UUID REFERENCES ai_usage_allocations(id),
  amount DECIMAL(10, 4) NOT NULL, -- negative for debits, positive for credits
  transaction_type TEXT NOT NULL, -- 'usage', 'purchase', 'allocation', 'expiration', 'adjustment'
  reference_id TEXT, -- request_id for usage, payment_id for purchases
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  CHECK (user_id IS NOT NULL OR team_id IS NOT NULL)
);

-- Indexes for query optimization
CREATE INDEX idx_transactions_user_id ON ai_credit_transactions(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_transactions_team_id ON ai_credit_transactions(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_transactions_allocation_id ON ai_credit_transactions(allocation_id);
CREATE INDEX idx_transactions_type ON ai_credit_transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON ai_credit_transactions(created_at);
```

### 3.4 AI Cost Configuration Table

```sql
-- Cost configuration for different models
CREATE TABLE ai_cost_configuration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
INSERT INTO ai_cost_configuration
(provider, model, input_cost_per_1k_tokens, output_cost_per_1k_tokens, markup_percentage)
VALUES
('openai', 'gpt-3.5-turbo', 0.0015, 0.002, 10),
('openai', 'gpt-4', 0.03, 0.06, 10),
('anthropic', 'claude-3-opus', 0.015, 0.075, 10),
('anthropic', 'claude-3-sonnet', 0.003, 0.015, 10),
('anthropic', 'claude-3-haiku', 0.00025, 0.00125, 10);
```

### 3.5 Usage Limits Table

```sql
-- Usage limits configuration
CREATE TABLE ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
```

### 3.6 Row Level Security Policies

```sql
-- RLS policies
ALTER TABLE ai_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_limits ENABLE ROW LEVEL SECURITY;

-- User access policies
CREATE POLICY "Users can view their own AI requests" ON ai_request_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teams can view their AI requests" ON ai_request_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM memberships
    WHERE team_id = ai_request_logs.team_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own allocations" ON ai_usage_allocations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can view team allocations" ON ai_usage_allocations
  FOR SELECT USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM memberships
      WHERE team_id = ai_usage_allocations.team_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own transactions" ON ai_credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can view team transactions" ON ai_credit_transactions
  FOR SELECT USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM memberships
      WHERE team_id = ai_credit_transactions.team_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Cost configuration is viewable by all" ON ai_cost_configuration
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own usage limits" ON ai_usage_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Team members can view team usage limits" ON ai_usage_limits
  FOR SELECT USING (
    team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM memberships
      WHERE team_id = ai_usage_limits.team_id
      AND user_id = auth.uid()
    )
  );

-- Admin policies (using the is_admin() function for authorization)
CREATE POLICY "Admins can manage all tables" ON ai_request_logs
  USING (is_admin());

CREATE POLICY "Admins can manage all allocations" ON ai_usage_allocations
  USING (is_admin());

CREATE POLICY "Admins can manage all transactions" ON ai_credit_transactions
  USING (is_admin());

CREATE POLICY "Admins can manage cost configuration" ON ai_cost_configuration
  USING (is_admin());

CREATE POLICY "Admins can manage usage limits" ON ai_usage_limits
  USING (is_admin());
```

### 3.7 Stored Procedures

```sql
-- Function to calculate cost based on token usage
CREATE OR REPLACE FUNCTION calculate_ai_cost(
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
  FROM ai_cost_configuration
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
CREATE OR REPLACE FUNCTION deduct_ai_credits(
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
    FROM ai_usage_allocations
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
    FROM ai_usage_allocations
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
  UPDATE ai_usage_allocations
  SET
    credits_used = credits_used + p_amount,
    updated_at = NOW()
  WHERE id = v_allocation_id;

  -- Record transaction
  INSERT INTO ai_credit_transactions (
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
CREATE OR REPLACE FUNCTION check_ai_usage_limits(
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
    FROM ai_usage_limits l
    WHERE (l.user_id = v_user_id OR l.team_id = v_team_id)
      AND l.is_active = true
  ),
  daily_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '1 day')
  ),
  weekly_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '7 days')
  ),
  monthly_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '30 days')
  ),
  total_cost AS (
    SELECT COALESCE(SUM(cost), 0) as usage
    FROM ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
  ),
  daily_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '1 day')
  ),
  weekly_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '7 days')
  ),
  monthly_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM ai_request_logs
    WHERE (user_id = v_user_id OR team_id = v_team_id)
      AND request_timestamp > (NOW() - INTERVAL '30 days')
  ),
  total_tokens AS (
    SELECT COALESCE(SUM(total_tokens), 0) as usage
    FROM ai_request_logs
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
CREATE OR REPLACE FUNCTION reset_ai_allocations() RETURNS INTEGER AS $$
DECLARE
  v_reset_count INTEGER := 0;
  v_allocation RECORD;
BEGIN
  -- Find allocations due for reset
  FOR v_allocation IN
    SELECT id, user_id, team_id, credits_used, allocation_type, reset_frequency
    FROM ai_usage_allocations
    WHERE is_active = true
      AND next_reset_at <= NOW()
      AND reset_frequency IS NOT NULL
      AND reset_frequency IN ('daily', 'weekly', 'monthly')
  LOOP
    -- Reset the usage
    UPDATE ai_usage_allocations
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
    INSERT INTO ai_credit_transactions (
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
```

## 4. Implementation Components

### 4.1 Enhanced Portkey Client

```typescript
// packages/ai-gateway/src/gateway-client.ts
import OpenAI from 'openai';

interface PortkeyHeadersOptions {
  userId?: string;
  teamId?: string;
  feature?: string;
  sessionId?: string;
}

export function createPortkeyHeaders(options: PortkeyHeadersOptions = {}) {
  const { userId, teamId, feature, sessionId } = options;

  const headers: Record<string, string> = {
    'x-portkey-api-key': process.env.PORTKEY_API_KEY || '',
    'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY || '',
    'x-portkey-provider': 'openai',
  };

  // Add tracking metadata
  if (userId) headers['x-portkey-request-metadata-user-id'] = userId;
  if (teamId) headers['x-portkey-request-metadata-team-id'] = teamId;
  if (feature) headers['x-portkey-request-metadata-feature'] = feature;
  if (sessionId) headers['x-portkey-trace-id'] = sessionId;

  return headers;
}

export function createGatewayClient(options: PortkeyHeadersOptions = {}) {
  const headers = createPortkeyHeaders(options);

  return new OpenAI({
    apiKey: '', // Can be left blank when using virtual keys
    baseURL: 'https://api.portkey.ai/v1/proxy',
    defaultHeaders: headers,
  });
}
```

### 4.2 Updated AI Gateway Functions

```typescript
// packages/ai-gateway/src/index.ts
import { z } from 'zod';

import { createGatewayClient } from './gateway-client';
import { recordApiUsage } from './utils/usage-tracking';

// Types for chat messages
export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

// Zod schema for validation
const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const ChatMessagesSchema = z.array(ChatMessageSchema);

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  config?: any;
  userId?: string;
  teamId?: string;
  feature?: string;
  sessionId?: string;
  checkUsageLimits?: boolean;
  bypassCredits?: boolean;
}

export interface CompletionResult {
  content: string;
  metadata: {
    requestId: string;
    cost: number;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    provider: string;
    model: string;
    feature?: string;
    userId?: string;
    teamId?: string;
    usageLimitExceeded?: boolean;
  };
}

/**
 * Get a chat completion from the AI model with cost tracking
 * @param messages Array of chat messages
 * @param options Configuration options for the chat completion
 * @returns The AI model's response text and usage metadata
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<CompletionResult> {
  try {
    // Validate messages
    ChatMessagesSchema.parse(messages);

    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      userId,
      teamId,
      feature,
      sessionId,
      checkUsag
```
