# API Usage Dashboard Data Tracking Issue Analysis

## 1. Issue Description

The API Usage dashboard in the admin section has been successfully implemented, but it's currently only displaying dummy data rather than real API usage information. The dashboard components are in place, but no actual usage data is being recorded in the database, resulting in an empty `ai_request_logs` table.

Key symptoms:

- Dashboard UI is functional and properly integrated into the admin interface
- Sample/dummy data is being displayed instead of real API usage data
- The `ai_request_logs` table exists in the database schema but contains no records
- Other related tables (`ai_cost_configuration`, `ai_credit_transactions`, `ai_usage_allocations`, `ai_usage_limits`) also appear to be empty

## 2. Root Cause Analysis

After examining the codebase, we've identified the following issues preventing actual data from being recorded:

### 2.1 Database Tables Properly Created but Empty

The database schema for AI usage tracking is properly implemented:

- The `ai_request_logs` table exists with the expected columns
- Supporting tables like `ai_cost_configuration`, `ai_usage_allocations`, etc. are present
- However, querying `ai_request_logs` returns no records, indicating usage data isn't being recorded

### 2.2 Usage Tracking Code Analysis

The AI gateway implementation in `packages/ai-gateway/src/index.ts` and `packages/ai-gateway/src/utils/usage-tracking.ts` reveals that:

1. **Usage Tracking is Implemented** - The code for recording API usage is present and well-structured:

   ```typescript
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
     bypassCredits: true, // <-- This is important
   });
   ```

2. **Usage Limits Checking is Disabled** - The following code is commented out:

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

3. **Credits System is Bypassed** - The `bypassCredits` parameter is explicitly set to `true`:

   ```typescript
   bypassCredits: true, // Bypass credits since we're having permission issues
   ```

4. **Comments Indicate Database Permission Issues** - Several comments reference "permission issues":

   ```typescript
   // Bypass credits since we're having permission issues
   ```

   ```typescript
   // Temporarily disable usage limits checking due to permission issues
   ```

5. **Error Handling is Defensive** - The code has robust error handling that continues execution even when database operations fail:
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

### 2.3 Dashboard Implementation

The dashboard component in `apps/web/app/admin/api-usage/_components/usage-dashboard.tsx` includes commented-out code for fetching real data:

```typescript
// When the API is ready, uncomment this code:
/*
const result = await fetchUsageDataAction({
  timeRange: selectedTimeRange as '24h' | '7d' | '30d' | '90d',
});

if (result.success && result.data) {
  setCurrentData(result.data);
}
*/
```

This suggests the dashboard was intentionally configured to use dummy data until the data tracking issues were resolved.

## 3. Recommended Actions

To fix the API usage dashboard and enable real data tracking, we recommend the following actions:

### 3.1 Fix Database Permission Issues

1. **Verify RLS Policies**: Check Row Level Security policies for the `ai_request_logs` table to ensure they allow inserts from the appropriate Supabase roles.

   ```sql
   -- Example RLS policy to allow inserts for authenticated users
   CREATE POLICY "Allow inserts for authenticated users" ON public.ai_request_logs
     FOR INSERT
     TO authenticated
     WITH CHECK (true);
   ```

2. **Check Function Permissions**: Ensure the `calculate_ai_cost` and `deduct_ai_credits` functions are accessible to the appropriate Supabase roles.

   ```sql
   -- Example grant for function permissions
   GRANT EXECUTE ON FUNCTION public.calculate_ai_cost(text, text, integer, integer) TO authenticated;
   GRANT EXECUTE ON FUNCTION public.deduct_ai_credits(text, uuid, numeric, text, text) TO authenticated;
   ```

### 3.2 Add Detailed Error Logging

1. **Enhance Gateway Client Error Logging**: Modify the AI gateway client to log more detailed error information, specifically for database operations:

   ```typescript
   // In recordApiUsage function
   const { error: logError } = await supabase
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
       sqlQuery: logError.query,
       table: 'ai_request_logs',
     });
   }
   ```

2. **Create a Test Endpoint**: Implement a diagnostic endpoint that attempts to write a test record to the `ai_request_logs` table and returns detailed success/failure information.

### 3.3 Implement Database Initialization

1. **Seed Pricing Data**: Add seed data to the `ai_cost_configuration` table to ensure proper cost calculation:

   ```typescript
   // Function to seed pricing data if not present
   async function seedPricingData(supabase) {
     const { count } = await supabase
       .from('ai_cost_configuration')
       .select('id', { count: 'exact', head: true });

     if (count === 0) {
       // Insert default pricing data
       await supabase.from('ai_cost_configuration').insert([
         {
           provider: 'openai',
           model: 'gpt-3.5-turbo',
           input_cost_per_1k_tokens: 0.0015,
           output_cost_per_1k_tokens: 0.002,
           markup_percentage: 10,
           is_active: true,
         },
         // Add more models...
       ]);
     }
   }
   ```

2. **Initialize User Allocations**: Create default credit allocations for users:

   ```typescript
   // Function to initialize user allocations
   async function initializeUserAllocation(supabase, userId) {
     const { count } = await supabase
       .from('ai_usage_allocations')
       .select('id', { count: 'exact', head: true })
       .eq('user_id', userId);

     if (count === 0) {
       await supabase.from('ai_usage_allocations').insert({
         user_id: userId,
         credits_allocated: 100.0,
         credits_used: 0.0,
         allocation_type: 'free',
         is_active: true,
       });
     }
   }
   ```

### 3.4 Re-enable Usage Tracking Features

1. **Uncomment Usage Limits Checking**:

   ```typescript
   if (shouldCheckLimits && (userId || teamId)) {
     const limitExceeded = await checkUserLimits(userId, teamId);
     if (limitExceeded) {
       throw new AiUsageLimitError(
         'Usage limit exceeded. Please contact support to increase your limit.',
       );
     }
   }
   ```

2. **Disable Credit Bypassing** (after fixing permission issues):

   ```typescript
   bypassCredits: false, // Re-enable credit tracking
   ```

3. **Enable Real Data Fetching in Dashboard**:

   ```typescript
   const result = await fetchUsageDataAction({
     timeRange: selectedTimeRange as '24h' | '7d' | '30d' | '90d',
   });

   if (result.success && result.data) {
     setCurrentData(result.data);
   }
   ```

### 3.5 Testing Plan

1. **Verify Database Permissions**: Run test queries to confirm the application has proper permissions.
2. **Generate Test Data**: Use the AI features to generate some real usage data.
3. **Validate Data Recording**: Confirm that usage data is being properly recorded in the database.
4. **Test Dashboard with Real Data**: Verify the dashboard displays actual usage data correctly.

By implementing these recommendations, the API usage dashboard should start showing real usage data instead of dummy data, providing administrators with valuable insights into API usage patterns and costs.
