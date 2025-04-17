# API Usage Admin Page Implementation Plan

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Current Implementation Analysis](#2-current-implementation-analysis)
3. [Root Cause Identification](#3-root-cause-identification)
4. [Implementation Plan](#4-implementation-plan)
5. [Technical Details](#5-technical-details)
6. [Testing and Verification Strategy](#6-testing-and-verification-strategy)
7. [Future Enhancements](#7-future-enhancements)

## 1. Problem Statement

The API usage monitoring page intended to be accessible under the route `/admin/api-usage` is not appearing in the admin panel. This page is crucial for administrators to monitor and manage AI API usage and costs within the application. Currently, while there's evidence of implementation work for AI usage tracking, the admin interface does not have a dedicated section to access this functionality.

## 2. Current Implementation Analysis

### 2.1 Admin Panel Structure

The admin panel uses the following structure:

- Root entry point: `apps/web/app/admin/page.tsx`
- Layout component: `apps/web/app/admin/layout.tsx`
- Navigation components:
  - `apps/web/app/admin/_components/admin-sidebar.tsx`
  - `apps/web/app/admin/_components/mobile-navigation.tsx`
- Existing routes:
  - `/admin` (main dashboard)
  - `/admin/accounts`
  - `/admin/testimonials`

The admin sidebar currently does not have a link for accessing the API usage monitoring page.

### 2.2 AI Usage Implementation

Based on the implementation notes in the API billing documentation, the following components have been developed:

1. **Database Schema**:

   - Tables for tracking API usage: `ai_request_logs`, `ai_pricing`, `ai_credits`, `ai_usage_limits`
   - Functions for cost calculation, credit deduction, and usage limit checking

2. **AI Gateway Integration**:

   - Usage tracking module in `packages/ai-gateway/src/utils/usage-tracking.ts`
   - Enhanced gateway client for Portkey integration
   - Cost tracking through Portkey response headers or fallback calculation

3. **Dashboard UI Components**:
   - Implementation suggests a dashboard exists at `apps/web/app/home/(user)/admin/ai-usage/`
   - Components for visualizing usage data, costs, and tokens
   - Server actions for fetching usage data

### 2.3 Portkey Integration

The API monitoring functionality relies on Portkey AI Gateway integration, which:

- Routes API calls to various AI providers
- Tracks usage data and costs
- Provides headers with cost information
- Supports configuration for different use cases

## 3. Root Cause Identification

The issue appears to be a misplacement of the API usage monitoring dashboard. Instead of being integrated into the main admin interface at `/admin/api-usage`, the implementation seems to have been developed at an alternative path: `apps/web/app/home/(user)/admin/ai-usage/`.

This mismatch means that:

1. The dashboard components exist but are not properly accessible
2. The admin sidebar does not have a link to the API usage page
3. The expected route structure for admin features isn't being followed

## 4. Implementation Plan

To resolve this issue, we will implement a proper API usage monitoring page in the admin section with the following steps:

### 4.1 Create Admin API Usage Route

Create a new route at `apps/web/app/admin/api-usage/` following the existing admin route pattern:

```
apps/web/app/admin/api-usage/
├── page.tsx                 # Main page component
├── _components/             # UI components
├── _actions/                # Server actions
└── _lib/                    # Types and utilities
```

### 4.2 Adapt Existing Dashboard Components

Adapt the components from the existing implementation:

1. **Move or replicate components**:

   - Relocate or copy components from `apps/web/app/home/(user)/admin/ai-usage/_components/`
   - Update imports and paths as necessary

2. **Adapt data fetching logic**:
   - Move server actions from the existing location
   - Ensure proper authentication checks for admin access

### 4.3 Update Admin Sidebar

Update the admin sidebar to include a link to the API usage page:

- Add a new menu item in `apps/web/app/admin/_components/admin-sidebar.tsx`
- Use an appropriate icon (e.g., BarChart, LineChart)
- Set up correct active state handling

### 4.4 Implement Page Structure

Structure the page according to admin design patterns:

- Use `PageHeader` and `PageBody` components
- Include appropriate metadata and titles
- Apply consistent styling with the rest of the admin interface

## 5. Technical Details

### 5.1 New API Usage Page

**File**: `apps/web/app/admin/api-usage/page.tsx`

```tsx
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

import { UsageDashboard } from './_components/usage-dashboard';

function ApiUsagePage() {
  return (
    <>
      <PageHeader description="API Usage Monitoring" />

      <PageBody>
        <UsageDashboard />
      </PageBody>
    </>
  );
}

export default AdminGuard(ApiUsagePage);
```

### 5.2 Admin Sidebar Update

**File**: `apps/web/app/admin/_components/admin-sidebar.tsx`

```tsx
// Add import for the icon
import { BarChart, LayoutDashboard, Users } from 'lucide-react';

// ... existing code ...

// Add this to the SidebarMenu component
<SidebarMenuButton isActive={path.includes('/admin/api-usage')} asChild>
  <Link className={'flex size-full gap-2.5'} href={'/admin/api-usage'}>
    <BarChart className={'h-4'} />
    <span>API Usage</span>
  </Link>
</SidebarMenuButton>;
```

### 5.3 Usage Dashboard Component

**File**: `apps/web/app/admin/api-usage/_components/usage-dashboard.tsx`

Adapt the existing dashboard component from `apps/web/app/home/(user)/admin/ai-usage/_components/usage-dashboard.tsx`, ensuring it works in the new location.

### 5.4 Server Actions

**File**: `apps/web/app/admin/api-usage/_actions/fetch-usage-data.ts`

Adapt the existing server actions to work in the new location, ensuring proper authentication and authorization checks.

## 6. Testing and Verification Strategy

### 6.1 Admin Route Verification

1. Verify that the `/admin/api-usage` route is accessible to super-admin users
2. Check that the API usage link appears in the admin sidebar
3. Confirm active state highlighting works correctly

### 6.2 Functionality Testing

1. Verify data loading and visualization works correctly
2. Test all filtering and time range selection features
3. Confirm all usage charts and metrics display proper data
4. Verify data refreshes correctly

### 6.3 Error Handling

1. Test behavior when data is unavailable
2. Verify appropriate loading states are shown
3. Confirm error messaging is clear and helpful

### 6.4 Responsive Design

1. Test layout on different screen sizes
2. Verify mobile navigation works correctly
3. Ensure charts and data visualizations adapt to screen sizes

## 7. Future Enhancements

Once the basic API usage monitoring page is working correctly, consider these future enhancements:

1. **Export Functionality**:

   - Add CSV/Excel export for usage data
   - Generate PDF reports for specific time periods

2. **Advanced Filtering**:

   - Filter by specific users or teams
   - Group by various dimensions (feature, model, etc.)

3. **Alert Configuration**:

   - Set up thresholds for usage notifications
   - Configure email alerts for unusual patterns

4. **Cost Management**:

   - Implement budget management features
   - Add credit allocation controls

5. **Integration with Billing**:
   - Connect with the billing system
   - Provide cost reconciliation features
