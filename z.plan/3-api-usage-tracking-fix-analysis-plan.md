# API Usage Tracking System - Issue Analysis and Implementation Plan

## 1. Executive Summary

The API Usage Dashboard for SlideHeroes is currently not capturing real usage data, showing only dummy data instead. After thorough investigation, we've found that while the underlying database structure is correctly set up and the code includes proper implementation of usage tracking, database permission issues are preventing successful recording of API usage data. This document analyzes the current state, identifies root causes, and outlines a clear implementation plan to resolve these issues.

## 2. Current State Analysis

### 2.1 Issue Symptoms

Based on server logs and database examination:

1. **Almost Empty Database**: The `ai_request_logs` table exists with correct schema but contains only 1 record despite many API calls
2. **Permission Errors**: Server logs show clear permission errors: `'permission denied for function calculate_ai_cost'`
3. **Silent Failures**: The application continues to function due to robust error handling but silently fails to record usage
4. **Dashboard Showing Dummy Data**: The admin dashboard displays sample data rather than actual usage metrics

### 2.2 System Components Review

#### 2.2.1 Database Schema

The database schema is correctly implemented with all required tables:

- `ai_request_logs`: For tracking individual API calls and their costs
- `ai_cost_configuration`: For cost calculation based on model and token usage
- `ai_usage_allocations`: For managing user/team usage allocations
- `ai_credit_transactions`: For recording credit transactions
- `ai_usage_limits`: For defining and enforcing usage limits

#### 2.2.2 API Gateway Implementation

The Portkey AI Gateway integration is working correctly:

- Correctly configured with API keys and virtual keys
- Successfully making API calls to language models
- Properly handling configuration through headers
- Retrieving token usage from API responses

#### 2.2.3 Usage Tracking Code

The usage tracking code is well-structured with multiple layers:

- `recordApiUsage()`: Main function for recording usage in the database
- `calculateCost()`: Function for determining the cost of an API call
- `extractCostFromHeaders()`: Function for extracting cost data from Portkey headers
- `checkUsageLimits()`: Function for enforcing usage limits

#### 2.2.4 Error Handling

The code includes comprehensive error handling:

- Graceful fallback to local cost calculation when database function fails
- Continuation of core functionality when usage tracking fails
- Detailed logging of errors to the console
- Mock client creation when database client initialization fails

### 2.3 Database State Verification

A query of the database confirms:

- The `ai_request_logs` table exists with correct schema
- There is 1 record in the table (from a recent API call) with timestamp 2025-04-17
- The record contains proper data including token counts and calculated cost
- Other tables appear to be empty (no cost configuration, allocations, etc.)

## 3. Root Cause Analysis

Based on the evidence, we've identified the following root causes:

### 3.1 Primary Issues

1. **Database Function Permission Problems**:

   - The error `'permission denied for function calculate_ai_cost'` indicates the authenticated or service role lacks execution permissions for this function.
   - This prevents proper cost calculation through the database.

2. **RLS Policy Issues**:

   - Row Level Security policies may be preventing insertions to the `ai_request_logs` table.
   - The single record suggests successful insertion is possible but inconsistent.

3. **Incomplete Database Initialization**:
   - Supporting tables like `ai_cost_configuration` appear to be empty.
   - This could cause cascading errors in cost calculation and credit management.

### 3.2 Secondary Issues

1. **Error Logging Limitations**:

   - While error logging exists, it doesn't capture enough context about database errors.
   - Some error details are lost, making diagnosis difficult.

2. **Supabase Client Authentication**:

   - The way the Supabase client is obtained may not ensure proper permissions.
   - Admin functions may require a specific admin client.

3. **Environment Configuration**:
   - Feature flags controlled by environment variables are set to bypass credit tracking.
   - This may mask underlying issues with credit allocation.

## 4. Implementation Plan

### 4.1 Database Permissions Fix

```sql
-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.calculate_ai_cost(text, text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deduct_ai_credits(text, uuid, numeric, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_ai_usage_limits(text, uuid, numeric, integer) TO authenticated, service_role;
```

### 4.2 RLS Policy Updates

```sql
-- Allow authenticated and service_role to insert records
CREATE POLICY IF NOT EXISTS "Allow inserts to ai_request_logs"
  ON public.ai_request_logs
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

-- Verify other policies aren't interfering
SELECT * FROM pg_policies WHERE tablename = 'ai_request_logs';
```

### 4.3 Enhanced Error Logging

Update the `recordApiUsage` function in `packages/ai-gateway/src/utils/usage-tracking.ts`:

```typescript
try {
  const { data, error: logError } = await supabase
    .from('ai_request_logs')
    .insert({
      // ...fields...
    })
    .select('id')
    .single();

  if (logError) {
    console.error('Error recording AI request log:', {
      error: logError,
      errorMessage: logError.message,
      errorDetails: logError.details,
      errorCode: logError.code,
      errorHint: logError.hint,
      sql: logError.query, // Get the SQL causing issues
      tableName: 'ai_request_logs',
      record: JSON.stringify(record),
    });
  }
} catch (insertError) {
  // Enhance error capture with more details
  console.error('Exception in AI request log insertion:', {
    error: insertError,
    stack: (insertError as Error).stack,
    message: (insertError as Error).message,
    name: (insertError as Error).name,
    // Add any properties available on the error object
    ...(insertError as any),
  });
}
```

### 4.4 Supabase Client Improvement

Update the `getSupabaseClient` function in `packages/ai-gateway/src/utils/supabase-client.ts` to use the admin client when needed:

```typescript
export async function getSupabaseClient(
  options: { admin?: boolean } = {},
): Promise<SupabaseClient> {
  try {
    // For functions requiring admin access, use the admin client
    if (options.admin) {
      const { getSupabaseServerAdminClient } = await import(
        '@kit/supabase/server-admin-client'
      );

      console.log('Getting Supabase admin client for privileged operations');
      return getSupabaseServerAdminClient();
    } else {
      const { getSupabaseServerClient } = await import(
        '@kit/supabase/server-client'
      );

      console.log(
        'Getting Supabase regular client for AI gateway usage tracking',
      );
      return getSupabaseServerClient();
    }
  } catch (error) {
    console.error('Error getting Supabase client:', error);
    return createMockClient();
  }
}
```

### 4.5 Database Initialization

Create an initialization function to ensure the database is properly set up:

```typescript
// Add to packages/ai-gateway/src/utils/db-init.ts
export async function initializeCostConfiguration(
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    const { count } = await supabase
      .from('ai_cost_configuration')
      .select('*', { count: 'exact', head: true });

    if (count === 0) {
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
        {
          provider: 'anthropic',
          model: 'claude-3-opus',
          input_cost_per_1k_tokens: 0.015,
          output_cost_per_1k_tokens: 0.075,
          markup_percentage: 10,
          is_active: true,
        },
        {
          provider: 'anthropic',
          model: 'claude-3-sonnet',
          input_cost_per_1k_tokens: 0.003,
          output_cost_per_1k_tokens: 0.015,
          markup_percentage: 10,
          is_active: true,
        },
        {
          provider: 'anthropic',
          model: 'claude-3-haiku',
          input_cost_per_1k_tokens: 0.00025,
          output_cost_per_1k_tokens: 0.00125,
          markup_percentage: 10,
          is_active: true,
        },
      ]);

      console.log('Initialized AI cost configuration data');
      return true;
    }

    console.log('AI cost configuration already exists');
    return true;
  } catch (error) {
    console.error('Failed to initialize cost configuration:', error);
    return false;
  }
}
```

### 4.6 Environment Variable Configuration

Create environment variable controls for phased rollout:

```typescript
// In index.ts and other relevant files
// Default to true for bypassing credits unless explicitly set to false
const bypassCreditsFlag = process.env.BYPASS_AI_CREDITS !== 'false';

// Default to false for usage limits checking unless explicitly enabled
const checkUsageLimitsFlag = process.env.CHECK_AI_USAGE_LIMITS === 'true';

// Use these flags consistently in the code
```

## 5. Implementation Strategy

### 5.1 Phase 1: Diagnosis Enhancement (Day 1)

1. **Add Diagnostic Logging**:

   - Enhance error logging in the usage tracking code
   - Add more detailed SQL query logging
   - Log all database interaction attempts

2. **Verify Table Structure**:
   - Confirm all tables exist with correct schema
   - Check current RLS policies
   - Verify function permissions

### 5.2 Phase 2: Database Fixes (Day 1)

1. **Update Permissions**:

   - Grant execute permissions to the database functions
   - Update RLS policies for the tables
   - Test basic insertions directly with SQL

2. **Initialize Database**:
   - Implement the database initialization function
   - Seed cost configuration data
   - Create test allocation records if needed

### 5.3 Phase 3: Code Updates (Day 2)

1. **Improve Supabase Client**:

   - Update the client utility to support admin operations
   - Add connection verification logic
   - Improve error handling and fallbacks

2. **Update Usage Tracking Code**:
   - Enhance error logging with more context
   - Improve permission error detection
   - Add transaction support for critical operations

### 5.4 Phase 4: Feature Enablement (Day 2-3)

1. **Enable Basic Recording**:

   - Turn on basic usage recording without credits
   - Test with the Canvas Editor
   - Verify records are being created

2. **Enable Credit Tracking**:

   - Gradually enable credit tracking once recording works
   - Update environment variables
   - Test with different user accounts

3. **Update Dashboard**:
   - Enable the dashboard to use real data
   - Validate data visualization
   - Test filtering and time range selection

## 6. Testing Plan

### 6.1 Unit Tests

- Test each utility function independently
- Verify cost calculation with different models
- Test error handling with mocked errors

### 6.2 Integration Tests

- Test the full flow from API call to database recording
- Verify usage data appears in the dashboard
- Test with different users and teams

### 6.3 Edge Cases

- Test with malformed API responses
- Test with database connection issues
- Test with very large token counts

## 7. Rollback Plan

If issues arise during implementation:

1. **Feature Flag Rollback**:

   - Set environment variables to bypass problematic features
   - `BYPASS_AI_CREDITS=true`
   - `CHECK_AI_USAGE_LIMITS=false`

2. **Code Rollback**:

   - Revert to previous implementation of key files
   - Document what worked and what didn't for future attempts

3. **Partial Implementation**:
   - If some fixes work but others don't, keep the working ones
   - Document partial success for future implementation

## 8. Expected Outcomes

Upon successful implementation:

1. Every AI API call will be properly recorded in the database
2. Cost calculations will use the database function
3. The admin dashboard will show real usage data
4. The system will gracefully handle errors with better logging
5. We'll have a foundation for future enhancements like credit management and limits
