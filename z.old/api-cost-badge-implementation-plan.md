# API Cost Badge Implementation Plan

## Table of Contents

1. [Overview](#1-overview)
2. [Current System Analysis](#2-current-system-analysis)
3. [Implementation Components](#3-implementation-components)
4. [Technical Approach](#4-technical-approach)
5. [User Experience Considerations](#5-user-experience-considerations)
6. [Implementation Steps](#6-implementation-steps)
7. [Testing Strategy](#7-testing-strategy)

## 1. Overview

### 1.1 Purpose

The API Cost Badge feature will provide users with real-time visibility into the running total of API call costs during their current session in the Canvas Editor. This feature enhances transparency by showing users the financial impact of their AI usage as they work with the Canvas Editor's various AI-powered features.

### 1.2 Core Requirements

1. **Real-time Cost Display**: Show the aggregated cost of all API calls made during the current session
2. **Clear Positioning**: Display the badge to the left of the save button in the Canvas Editor's top bar
3. **Intuitive Design**: Use Shadcn UI components to maintain consistent styling
4. **Tooltip Information**: Provide context when users hover over the badge
5. **Session Tracking**: Associate API calls with the current user session

## 2. Current System Analysis

### 2.1 Canvas Editor Structure

The Canvas Editor follows this structure:

- Entry point at `apps/web/app/home/(user)/ai/canvas/page.tsx`
- Main component in `apps/web/app/home/(user)/ai/canvas/_components/canvas-page.tsx`
- Top bar component in `apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx`
- Various editor components that make AI API calls

The top bar currently contains:

- A title input field on the left
- Save and fullscreen buttons on the right

### 2.2 AI Gateway Usage

The application uses Portkey AI Gateway through the `@kit/ai-gateway` package:

- API calls are made using `getChatCompletion` and other methods
- Cost tracking is implemented in `packages/ai-gateway/src/utils/usage-tracking.ts`
- Usage data is stored in the `ai_request_logs` table with cost information
- Cost calculation uses token counts and model-specific pricing

### 2.3 Server Actions for AI Features

The Canvas Editor uses several server actions for AI-powered features:

- `generate-ideas.ts`
- `generate-outline.ts`
- `get-outline-suggestions.ts`
- `simplify-text.ts`

Each action makes API calls via the AI Gateway, which already tracks usage data.

## 3. Implementation Components

### 3.1 Cost Tracking Context

We'll create a React context to track and manage session costs:

- `CostTrackingProvider`: Manages the running total of API costs
- `useCostTracking` hook: Provides access to session cost data
- Unique session ID generation for tracking related API calls

### 3.2 Session Cost API

We'll add an API route to fetch aggregated cost data:

- Route: `/api/ai-usage/session-cost`
- Functionality: Query the `ai_request_logs` table for the current session
- Options to filter by session ID or time period

### 3.3 Cost Badge Component

We'll create a reusable cost badge component:

- Styled with Shadcn UI's Badge component
- Displays formatted cost with appropriate precision
- Includes a Coins icon for visual clarity
- Provides a tooltip with additional information

### 3.4 AI Gateway Enhancements

We'll update the AI Gateway to support session tracking:

- Add session ID parameter to `ChatCompletionOptions`
- Pass session ID to the usage tracking system
- Ensure cost data is properly associated with sessions

## 4. Technical Approach

### 4.1 State Management

We'll use React Context to maintain the session cost state:

```tsx
// CostTrackingContext structure
type CostTrackingContextType = {
  sessionCost: number;
  sessionId: string;
  addCost: (cost: number) => void;
  isLoading: boolean;
};
```

This will allow components throughout the Canvas Editor to access the cost data without prop drilling.

### 4.2 Data Flow

1. When the Canvas Editor loads, we'll:

   - Generate a unique session ID
   - Initialize the cost tracking context
   - Fetch any existing costs from recent API calls

2. For each AI action:

   - Include the session ID in the API call
   - Record the cost in the database with the session ID
   - Update the cost context with the new cost

3. The cost badge will:
   - Subscribe to the cost context
   - Display the current total cost
   - Update in real-time as new costs are added

### 4.3 API Integration

We'll enhance the server actions to include session tracking:

```typescript
// Example of updated server action
export const generateIdeasAction = enhanceAction(
  async function (data, user) {
    // ... existing code

    const response = await getChatCompletion(messages, {
      config: normalizedConfig,
      userId: user.id,
      feature: `canvas-${data.type}-ideas`,
      sessionId: data.sessionId, // Include session ID
    });

    // ... rest of implementation
  },
  {
    schema: IdeasSchema.extend({
      sessionId: z.string().optional(), // Add to schema
    }),
    auth: true,
  },
);
```

## 5. User Experience Considerations

### 5.1 Visual Design

The cost badge will:

- Use a subtle, non-distracting design
- Follow Shadcn UI styling for consistency
- Include a small coin icon for quick recognition
- Format costs with appropriate decimal precision
  - 4 decimal places for very small amounts ($0.0001)
  - 2 decimal places for larger amounts ($0.25)

### 5.2 Interaction Design

- Tooltip provides context on hover
- Badge is positioned for visibility without interfering with workflow
- Updates happen in real-time without disrupting the user experience

### 5.3 Accessibility

- Ensure proper contrast ratios for text readability
- Maintain keyboard navigability
- Include proper ARIA attributes for screen readers

## 6. Implementation Steps

### 6.1 Phase 1: Foundation

1. **Create Cost Tracking Context**

   - Implement `CostTrackingContext` and provider
   - Create `useCostTracking` hook
   - Set up session ID generation

2. **Implement Session Cost API Route**

   - Create `/api/ai-usage/session-cost` route
   - Implement filtering by session ID and time period
   - Add appropriate error handling and validation

3. **Create Cost Badge Component**
   - Implement the badge using Shadcn UI components
   - Add formatting logic for cost display
   - Include tooltip and icon

### 6.2 Phase 2: Integration

4. **Update Canvas Page Component**

   - Wrap with `CostTrackingProvider`
   - Ensure proper context initialization

5. **Update Top Bar Component**

   - Add the cost badge component
   - Position it to the left of the save button
   - Style it to match the existing UI

6. **Update AI Gateway**
   - Add session ID support to `ChatCompletionOptions`
   - Update usage tracking to store session ID
   - Ensure cost data is properly associated

### 6.3 Phase 3: Action Integration

7. **Create Utility Hook for Actions**

   - Implement `useActionWithCost` hook to streamline integration
   - Handle automatic session ID inclusion
   - Process cost updates after action completion

8. **Update AI Actions**
   - Modify schemas to include session ID
   - Update action implementations to use session ID
   - Ensure proper cost tracking

### 6.4 Phase 4: Testing and Refinement

9. **Test Implementation**

   - Verify cost tracking across different session scenarios
   - Test with various API calls and models
   - Ensure real-time updates work correctly

10. **Refine User Experience**
    - Adjust styling based on feedback
    - Optimize performance if needed
    - Ensure consistency across devices and screen sizes

## 7. Testing Strategy

### 7.1 Unit Testing

- Test context provider state management
- Verify cost formatting logic
- Validate session ID generation and handling

### 7.2 Integration Testing

- Verify server actions correctly include session ID
- Test API cost fetching with different parameters
- Ensure cost updates propagate through the system

### 7.3 End-to-End Testing

- Test complete workflow from user interaction to cost display
- Verify multiple API calls correctly aggregate costs
- Test session persistence during page navigation

### 7.4 Edge Cases

- Test with very large and very small cost values
- Verify behavior when API calls fail
- Test with missing or invalid session IDs
- Validate behavior on session timeout or expiration

## 8. Code Samples

### 8.1 Cost Tracking Context

```tsx
// apps/web/app/home/(user)/ai/canvas/_lib/contexts/cost-tracking-context.tsx
'use client';

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { v4 as uuidv4 } from 'uuid';

import { useUser } from '@kit/supabase/hooks/use-user';

// apps/web/app/home/(user)/ai/canvas/_lib/contexts/cost-tracking-context.tsx

// Define the context type
type CostTrackingContextType = {
  sessionCost: number;
  sessionId: string;
  addCost: (cost: number) => void;
  isLoading: boolean;
};

// Create the context with default values
const CostTrackingContext = createContext<CostTrackingContextType>({
  sessionCost: 0,
  sessionId: '',
  addCost: () => {},
  isLoading: true,
});

// Create the provider component
export function CostTrackingProvider({ children }: { children: ReactNode }) {
  const [sessionCost, setSessionCost] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  // Initialize the session ID and load initial costs
  useEffect(() => {
    // Generate a unique session ID when the component mounts
    const newSessionId = uuidv4();
    setSessionId(newSessionId);

    // Fetch initial costs (if any) for this session
    async function fetchInitialCosts() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/ai-usage/session-cost');
        const data = await response.json();

        if (data.success) {
          setSessionCost(data.cost || 0);
        }
      } catch (error) {
        console.error('Failed to fetch initial costs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitialCosts();
  }, [user?.id]);

  // Function to add new costs
  const addCost = (cost: number) => {
    setSessionCost((prevCost) => prevCost + cost);
  };

  return (
    <CostTrackingContext.Provider
      value={{
        sessionCost,
        sessionId,
        addCost,
        isLoading,
      }}
    >
      {children}
    </CostTrackingContext.Provider>
  );
}

// Custom hook to use the context
export function useCostTracking() {
  const context = useContext(CostTrackingContext);

  if (context === undefined) {
    throw new Error(
      'useCostTracking must be used within a CostTrackingProvider',
    );
  }

  return context;
}
```

### 8.2 Cost Badge Component

```tsx
// apps/web/app/home/(user)/ai/canvas/_components/cost-badge.tsx
'use client';

import { useEffect } from 'react';

import { Coins } from 'lucide-react';

import { Badge, BadgeProps } from '@kit/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';

import { useCostTracking } from '../_lib/contexts/cost-tracking-context';

// apps/web/app/home/(user)/ai/canvas/_components/cost-badge.tsx

interface CostBadgeProps extends Omit<BadgeProps, 'children'> {
  showIcon?: boolean;
}

export function CostBadge({ showIcon = true, ...props }: CostBadgeProps) {
  const { sessionCost, isLoading } = useCostTracking();

  // Format cost to display with appropriate precision
  const formattedCost = isLoading
    ? '...'
    : `$${sessionCost.toFixed(sessionCost < 0.01 ? 4 : 2)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="bg-muted/50 hover:bg-muted flex items-center gap-1 py-1 font-mono"
          {...props}
        >
          {showIcon && <Coins className="text-muted-foreground h-3 w-3" />}
          <span>{formattedCost}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>API usage cost for this session</TooltipContent>
    </Tooltip>
  );
}
```

### 8.3 Updated Top Bar Component

```tsx
// apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx
'use client';

import { useState } from 'react';

import { useSearchParams } from 'next/navigation';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Maximize2, Minimize2, Save } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/ui/tooltip';

import { updateBuildingBlockTitleAction } from '../_actions/update-building-block-title.action';
import { useSaveContext } from '../_lib/contexts/save-context';
import { useCanvasTitle } from '../_lib/hooks/use-canvas-title';
import { CostBadge } from './cost-badge';

// apps/web/app/home/(user)/ai/canvas/_components/top-bar.tsx
// Import the new component

export function TopBar() {
  // ... existing code

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder={isLoading ? 'Loading...' : 'Untitled Document'}
          value={data?.data?.title ?? ''}
          className="w-[400px] text-lg font-semibold"
          onChange={handleTitleChange}
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center gap-2">
        {/* Add the cost badge here, before the save button */}
        <CostBadge className="mr-1" />

        {/* Existing buttons */}
        {/* ... */}
      </div>
    </div>
  );
}
```
