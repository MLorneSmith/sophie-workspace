# API Usage Cost Tracking Fix Implementation Plan

## Table of Contents

1. [Issue Summary](#1-issue-summary)
2. [Root Cause Analysis](#2-root-cause-analysis)
3. [Proposed Solutions](#3-proposed-solutions)
4. [Implementation Plan](#4-implementation-plan)
5. [Technical Details](#5-technical-details)
6. [Testing Strategy](#6-testing-strategy)
7. [Rollback Plan](#7-rollback-plan)

## 1. Issue Summary

The API Usage dashboard in the admin section is currently only displaying dummy data rather than real API usage information. The dashboard components are functional, but no actual API usage data is being recorded in the database. Key symptoms include:

- Dashboard UI is properly integrated but showing dummy data
- The `ai_request_logs` table exists in the database schema but contains no records
- Other related tables (`ai_cost_configuration`, `ai_credit_transactions`, `ai_usage_allocations`, `ai_usage_limits`) are empty
- Usage tracking functionality appears to fail silently without any visible errors

## 2. Root Cause Analysis

After reviewing the codebase, documentation, and implementation, we've identified the following root causes:

### 2.1 Database Permission Issues

- The code explicitly mentions "permission issues" as the reason for bypassing credits and disabling usage limits checking:
  ```typescript
  bypassCredits: true, // Bypass credits since we're having permission issues
  ```
  ```typescript
  // Temporarily disable usage limits checking due to permission issues
  // if (shouldCheckLimits && (userId || teamId)) {
  //   const limitExceeded = await checkUserLimits(userId, teamId);
  //   if (limitExceeded) {
  //     throw new AiUsageLimitError(
  //       'Usage limit exceeded. Please contact support to increase your limit.',
  //     );
  //   }
  // }
  ```
- These comments suggest that Row-Level Security (RLS) policies may be preventing proper data insertion
- The issue appears to involve the Supabase client permissions rather than a code error

### 2.2 Silent Error Handling Masks Issues

- The code has robust error handling in multiple layers that often logs errors but continues execution:
  ```typescript
  try {
    // Record usage with proper Supabase client parameter
    await recordApiUsage(supabase, {
      // ...parameters...
    });
  } catch (error) {
    console.error('Error recording usage data:', error);
    // Continue without failing the response delivery
  }
  ```
- This approach correctly prioritizes AI functionality over usage tracking but masks the real issues

### 2.3 Portkey Configuration and Metadata

- The Portkey integration appears to work for making API calls but might be inconsistent in returning usage data
- The client is correctly configured with tracking metadata but may encounter issues when extracting cost information from headers

### 2.4 Always Bypassing Credits System

- The `bypassCredits` flag is hardcoded to `true` in both regular and streaming functions, which prevents the system from recording credit deductions
- This was likely an interim fix to avoid API functionality being disrupted by permission issues

### 2.5 Potential Database Initialization Gaps

- The required tables exist, but supporting data like pricing configuration or allocation records might be missing
- This could cause cascading errors in the usage tracking system even if permissions are fixed

## 3. Proposed Solutions

Based on our analysis, we propose the following solutions:

### 3.1 Fix Database Permission Issues

1. **Update RLS Policies**: Ensure that the service role and authenticated users have proper permissions to insert data into the relevant tables
2. **Grant Function Execution Rights**: Verify that the necessary functions can be executed by the appropriate roles

### 3.2 Add Enhanced Error Logging

1. **Detailed Error Capturing**: Modify the error handling to capture and log more context about database operations
2. **Structured Logging**: Implement structured logging to make it easier to identify the exact nature of permission issues

### 3.3 Implement Database Initialization

1. **Seed Cost Configuration Data**: Ensure the `ai_cost_configuration` table has the necessary pricing data for all supported models
2. **Create User Allocations**: Initialize allocation records for users to ensure credit tracking works properly

### 3.4 Re-enable Disabled Features Gradually

1. **Environment Variable Control**: Add environment variable flags to control which features are enabled/disabled
2. **Phased Rollout**: Re-enable features in phases, starting with basic usage recording and then moving to credit tracking

### 3.5 Improve Supabase Client Authentication

1. **Verify Client Authentication**: Ensure the Supabase client is properly authenticated for server-side operations
2. **Test Connection**: Add connection verification logic to confirm database access before attempting operations

## 4. Implementation Plan

Our implementation will proceed in four phases:

### 4.1 Phase 1 - Diagnostics & Logging (Day 1)

- Implement enhanced error logging in the usage tracking code
- Add structured logging for all database operations
- Run the Canvas Editor to generate API calls and collect diagnostic information
- Analyze logs to identify the specific permission errors

### 4.2 Phase 2 - Database Setup & Permissions (Day 1-2)

- Update RLS policies based on diagnostic results
- Seed initial data for cost configuration
- Create test queries to verify permission issues are fixed
- Implement error catching mechanism to verify database write capability

### 4.3 Phase 3 - Code Updates (Day 2)

- Implement the improved Supabase client authentication
- Add environment variable control for feature toggling
- Create database initialization functions
- Update gateway client to better handle Portkey responses

### 4.4 Phase 4 - Gradual Feature Enablement (Day 3)

- Enable basic usage recording without credit deduction
- Test with real API calls and verify database records
- Gradually enable credit tracking once recording is confirmed
- Re-enable usage limits after credit tracking is stable

## 5. Technical Details

### 5.1 Enhanced Error Logging

```typescript
// In recordApiUsage function
try {
  const { error: logError } = await supabase
    .from('ai_request_logs')
    .insert({
      // ...data fields...
    })
    .select('id')
    .single();

  if (logError) {
    console.error('Error recording AI request log:', {
      error: logError,
      errorMessage: logError.message,
      errorDetails: logError.details,
      errorCode: logError.code,
      userId,
      teamId,
      requestId,
      // Add additional context
    });
  }
} catch (insertError) {
  console.error('Exception in AI request log insertion:', {
    error: insertError,
    stack: insertError.stack,
    message: insertError.message,
  });
}
```

### 5.2 Updated RLS Policies

```sql
-- Allow authenticated users/service role to insert records
CREATE POLICY "Allow inserts to ai_request_logs" ON public.ai_request_logs
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

-- Allow authenticated users/service role to use RPC functions
GRANT EXECUTE ON FUNCTION public.calculate_ai_cost TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_ai_credits TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_ai_usage_limits TO authenticated, service_role;
```

### 5.3 Improved Supabase Client Utility

```typescript
export async function getSupabaseClient(): Promise<SupabaseClient> {
  try {
    // Try to import directly to avoid potential circular dependencies
    const { getSupabaseServerClient } = await import(
      '@kit/supabase/server-client'
    );

    // Log authentication context for debugging
    console.log('Getting Supabase client for AI gateway usage tracking');

    const client = getSupabaseServerClient();

    // Test connection with a simple query
    const { data, error } = await client
      .from('ai_cost_configuration')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase client authentication test failed:', error);
      return createMockClient();
    }

    console.log('Supabase client successfully connected');
    return client;
  } catch (error) {
    console.error('Error getting Supabase client:', error);
    return createMockClient();
  }
}
```

### 5.4 Environment Variable Control for Feature Flags

```typescript
// In index.ts for both regular and streaming functions
const bypassCreditsFlag = process.env.BYPASS_AI_CREDITS === 'true';
const checkUsageLimitsFlag = process.env.CHECK_AI_USAGE_LIMITS === 'true';

// Only check usage limits if explicitly enabled
if (checkUsageLimitsFlag && shouldCheckLimits && (userId || teamId)) {
  const limitExceeded = await checkUserLimits(userId, teamId);
  if (limitExceeded) {
    throw new AiUsageLimitError(
      'Usage limit exceeded. Please contact support to increase your limit.',
    );
  }
}

await recordApiUsage(supabase, {
  userId,
  teamId,
  requestId,
  provider: 'openai',
  model,
  promptTokens: usage.prompt_tokens,
  completionTokens: usage.completion_tokens,
  totalTokens: usage.total_tokens,
  cost,
  feature,
  sessionId,
  bypassCredits: bypassCreditsFlag, // Use environment variable instead of hardcoding
});
```

### 5.5 Database Initialization Function

```typescript
// Create a utility function to seed pricing data
async function ensureCostConfigurationData(supabase: SupabaseClient) {
  const { count } = await supabase
    .from('ai_cost_configuration')
    .select('*', { count: 'exact', head: true });

  if (count === 0) {
    // No pricing data exists, insert defaults
    await supabase.from('ai_cost_configuration').insert([
      {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        input_cost_per_1k_tokens: 0.0015,
        output_cost_per_1k_tokens: 0.002,
        markup_percentage: 10,
        is_active: true,
      },
      {
        provider: 'openai',
        model: 'gpt-4',
        input_cost_per_1k_tokens: 0.03,
        output_cost_per_1k_tokens: 0.06,
        markup_percentage: 10,
        is_active: true,
      },
      // Add more models as needed
    ]);

    console.log('Seeded initial AI cost configuration data');
  }
}

// Main initialization function
async function initializeAiUsageTracking() {
  try {
    const supabase = await getSupabaseClient();

    // Seed cost configuration data
    await ensureCostConfigurationData(supabase);

    // Test basic insert capability
    const testId = `test-${Date.now()}`;
    const { error } = await supabase
      .from('ai_request_logs')
      .insert({
        user_id: null,
        team_id: null,
        request_id: testId,
        provider: 'test',
        model: 'test-model',
        prompt_tokens: 1,
        completion_tokens: 1,
        total_tokens: 2,
        cost: 0,
        feature: 'system-test',
      })
      .select('id')
      .single();

    if (error) {
      console.error('AI usage tracking initialization test failed:', error);
      return false;
    }

    console.log('AI usage tracking initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize AI usage tracking:', error);
    return false;
  }
}
```

## 6. Testing Strategy

### 6.1 Diagnostic Testing

1. **Database Permission Tests**:

   - Run simple SQL queries to test insert permissions
   - Execute the stored procedures directly to verify access

2. **Logging Analysis**:
   - Generate API calls with enhanced logging
   - Review logs for specific error patterns

### 6.2 Integration Testing

1. **Canvas Editor Test**:

   - Use the Canvas Editor to generate AI suggestions
   - Verify that API calls are successful
   - Check that usage data is recorded in the database

2. **Multi-User Testing**:
   - Test with different users to verify correct user attribution
   - Test with team accounts to verify team attribution

### 6.3 Feature Flag Testing

1. **Environment Variable Testing**:

   - Test with different combinations of environment variables
   - Verify that features enable/disable as expected

2. **Database Seeding Test**:
   - Verify cost configuration data is properly seeded
   - Check that test records can be inserted

## 7. Rollback Plan

If issues arise during the implementation, we have the following rollback strategies:

### 7.1 Feature Flag Rollback

- Set environment variables to bypass problematic features:
  - `BYPASS_AI_CREDITS=true`
  - `CHECK_AI_USAGE_LIMITS=false`

### 7.2 Code Rollback

- Revert to the previous implementation of key files:
  - `packages/ai-gateway/src/utils/supabase-client.ts`
  - `packages/ai-gateway/src/utils/usage-tracking.ts`
  - `packages/ai-gateway/src/index.ts`

### 7.3 Database Rollback

- If database modifications cause issues:
  - Revert RLS policy changes
  - Roll back any schema modifications

### 7.4 Partial Implementation

If some fixes work while others cause issues, we can:

- Keep working features (e.g., basic usage recording)
- Continue to bypass problematic features (e.g., credit deduction)
- Document partial success for future implementation
