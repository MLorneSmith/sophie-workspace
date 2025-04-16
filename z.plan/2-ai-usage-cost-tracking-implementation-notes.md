# AI Usage Cost Tracking - Implementation Notes

## Implementation Date: April 16, 2025

## Overview

This document outlines the implementation of the AI usage cost tracking system in the SlideHeroes application. The system tracks API calls to various LLM providers through the Portkey AI Gateway, recording costs and usage metrics for analytics and management purposes.

## Components Implemented

### 1. Database Schema Updates

Created a Supabase migration script (`apps/web/supabase/migrations/20250416140521_web_ai_usage_cost_tracking.sql`) with:

- **Tables:**

  - `ai_request_logs`: Records each API request with detailed metadata
  - `ai_pricing`: Stores model-specific pricing information
  - `ai_credits`: Manages user/team credit balances
  - `ai_usage_limits`: Sets and enforces usage quotas

- **Functions and Procedures:**
  - `calculate_ai_cost`: Calculates cost based on token usage and model-specific pricing
  - `deduct_ai_credits`: Manages credit deduction for each API request
  - `check_ai_usage_limits`: Verifies if a user/team has exceeded their usage quotas

### 2. AI Gateway Integration

Enhanced the AI Gateway package (`packages/ai-gateway/`) with:

- **Usage Tracking Module** (`packages/ai-gateway/src/utils/usage-tracking.ts`):

  - `recordApiUsage`: Records detailed API usage information in the database
  - `calculateCost`: Calculates the cost of API requests based on token usage
  - `extractCostFromHeaders`: Extracts cost info from Portkey response headers
  - `checkUsageLimits`: Verifies if user/team has exceeded usage limits

- **Enhanced Gateway Client** (`packages/ai-gateway/src/enhanced-gateway-client.ts`):

  - Creates Portkey headers with tracking metadata
  - Configures the OpenAI client to use Portkey as a proxy

- **Updated Main Module** (`packages/ai-gateway/src/index.ts`):
  - Modified `getChatCompletion` to track usage and associate costs with users/teams
  - Added support for feature tagging and session tracking

### 3. Admin Dashboard UI

Created an admin dashboard for monitoring AI usage:

- **Components:**

  - `UsageDashboard` (`apps/web/app/home/(user)/admin/ai-usage/_components/usage-dashboard.tsx`): Main dashboard component with charts and filters
  - `types.ts` (`apps/web/app/home/(user)/admin/ai-usage/_lib/types.ts`): TypeScript interfaces for usage data
  - `fetch-usage-data.ts` (`apps/web/app/home/(user)/admin/ai-usage/_actions/fetch-usage-data.ts`): Server action for fetching usage data
  - `page.tsx` (`apps/web/app/home/(user)/admin/ai-usage/page.tsx`): Main page component

- **Features:**
  - Summary cards with total costs and tokens
  - Interactive charts for usage by day, model, feature, and user
  - Time range filtering (24h, 7d, 30d, 90d)
  - Built with shadcn UI components for a consistent look and feel

### 4. Feature Integration

Updated the Canvas Editor's outline suggestions feature to track usage:

- Modified `get-outline-suggestions.ts` to:
  - Pass user ID and feature information to the AI gateway
  - Track usage with consistent session IDs
  - Associate costs with specific features for analytics

## Technical Design Decisions

1. **Cost Calculation Strategy:**

   - Primary: Extract cost from Portkey response headers when available
   - Fallback: Calculate based on token usage and pricing database
   - Last resort: Use hardcoded model pricing if database is unavailable

2. **User Attribution:**

   - Personal workspaces: Associate costs with user ID
   - Team workspaces: Associate costs with team ID
   - Session tracking: Use session IDs to group related requests

3. **Database Design:**

   - Added 10% markup on costs for business overhead
   - Optimized schema for efficient queries and reporting
   - Added timestamps and request IDs for comprehensive analytics

4. **UI Dashboard:**
   - Used shadcn UI components for consistency
   - Implemented responsive design for all screen sizes
   - Used chart components with proper accessibility features

## Next Steps

1. **Integration Testing:**

   - Test with real API calls to ensure proper tracking
   - Verify cost calculations across different models

2. **Dashboard Enhancement:**

   - Add export functionality for reports
   - Implement user filtering and more granular analytics

3. **Monitoring Alerts:**
   - Implement alerts for unusual usage patterns
   - Create notifications for approaching usage limits

## Technical Debt and Considerations

1. The current implementation has some TypeScript errors related to cross-package dependencies. These will be resolved when the packages are compiled together in the application.

2. The server action for fetching usage data needs to be updated in the database schema to handle the new `ai_request_logs` table.

3. For optimal performance with large datasets, we should implement pagination and data aggregation in the database queries.
