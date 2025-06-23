# Test Cases: cost-tracking-context.tsx

## File: `apps/web/app/home/(user)/ai/canvas/_lib/contexts/cost-tracking-context.tsx`

### Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: Starting
- **Total Test Cases**: 20
- **Completed Test Cases**: 0
- **Coverage**: 0%

### Test Setup

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { CostTrackingProvider, useCostTracking } from './cost-tracking-context';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123'),
}));

vi.mock('@kit/supabase/hooks/use-user', () => ({
  useUser: vi.fn(),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('CostTrackingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test cases below
});
```

### Test Cases Checklist

#### Provider Component Tests

- [ ] **Test Case**: Provider initializes with default values when user is not loaded
  - **Input**: No user data (useUser returns null)
  - **Expected Output**: Default state (sessionCost: 0, sessionId: '', isLoading: true)
  - **Status**: ❌ Not Started
  - **Notes**: Should not make API call without user

- [ ] **Test Case**: Provider generates session ID when user loads
  - **Input**: useUser returns valid user data
  - **Expected Output**: sessionId is generated using uuid v4
  - **Status**: ❌ Not Started
  - **Notes**: Should call uuidv4() once

- [ ] **Test Case**: Provider fetches initial costs on user load
  - **Input**: useUser returns user, API returns success with cost data
  - **Expected Output**: sessionCost updated with fetched value, isLoading becomes false
  - **Status**: ❌ Not Started
  - **Notes**: Should call /api/ai-usage/session-cost

- [ ] **Test Case**: Provider handles successful API response with zero cost
  - **Input**: API returns { success: true, cost: 0 }
  - **Expected Output**: sessionCost = 0, isLoading = false
  - **Status**: ❌ Not Started
  - **Notes**: Should handle zero as valid cost

- [ ] **Test Case**: Provider handles successful API response with existing cost
  - **Input**: API returns { success: true, cost: 5.25 }
  - **Expected Output**: sessionCost = 5.25, isLoading = false
  - **Status**: ❌ Not Started
  - **Notes**: Should preserve decimal precision

- [ ] **Test Case**: Provider handles API response without cost property
  - **Input**: API returns { success: true } (no cost property)
  - **Expected Output**: sessionCost = 0 (default), isLoading = false
  - **Status**: ❌ Not Started
  - **Notes**: Should use || 0 fallback

- [ ] **Test Case**: Provider handles API failure response
  - **Input**: API returns { success: false, error: 'Database error' }
  - **Expected Output**: sessionCost remains 0, isLoading = false
  - **Status**: ❌ Not Started
  - **Notes**: Should not update sessionCost on failure

- [ ] **Test Case**: Provider handles network error
  - **Input**: fetch() throws network error
  - **Expected Output**: sessionCost remains 0, isLoading = false, error logged
  - **Status**: ❌ Not Started
  - **Notes**: Should catch and log error

- [ ] **Test Case**: Provider handles malformed JSON response
  - **Input**: API returns invalid JSON
  - **Expected Output**: sessionCost remains 0, isLoading = false, error logged
  - **Status**: ❌ Not Started
  - **Notes**: Should catch JSON parsing errors

- [ ] **Test Case**: Provider re-initializes when user ID changes
  - **Input**: useUser data changes (different user ID)
  - **Expected Output**: New session ID generated, new API call made
  - **Status**: ❌ Not Started
  - **Notes**: useEffect dependency on userQuery.data?.id

#### addCost Function Tests

- [ ] **Test Case**: addCost increases session cost correctly
  - **Input**: Initial cost 10, addCost(5)
  - **Expected Output**: sessionCost becomes 15
  - **Status**: ❌ Not Started
  - **Notes**: Should use functional state update

- [ ] **Test Case**: addCost handles decimal values
  - **Input**: Initial cost 0, addCost(2.75)
  - **Expected Output**: sessionCost becomes 2.75
  - **Status**: ❌ Not Started
  - **Notes**: Should preserve decimal precision

- [ ] **Test Case**: addCost handles multiple sequential additions
  - **Input**: addCost(1), addCost(2), addCost(3)
  - **Expected Output**: sessionCost becomes 6
  - **Status**: ❌ Not Started
  - **Notes**: Should accumulate correctly

- [ ] **Test Case**: addCost handles zero values
  - **Input**: Initial cost 5, addCost(0)
  - **Expected Output**: sessionCost remains 5
  - **Status**: ❌ Not Started
  - **Notes**: Adding zero should work without issues

- [ ] **Test Case**: addCost handles negative values (edge case)
  - **Input**: Initial cost 10, addCost(-3)
  - **Expected Output**: sessionCost becomes 7
  - **Status**: ❌ Not Started
  - **Notes**: Function doesn't validate positive-only, should work mathematically

#### Hook Tests

- [ ] **Test Case**: useCostTracking returns context values correctly
  - **Input**: Provider with sessionCost: 15, sessionId: 'test-id'
  - **Expected Output**: Hook returns { sessionCost: 15, sessionId: 'test-id', addCost: function, isLoading: false }
  - **Status**: ❌ Not Started
  - **Notes**: Should return all context properties

- [ ] **Test Case**: useCostTracking throws error when used outside provider
  - **Input**: Component using hook without CostTrackingProvider
  - **Expected Output**: Error: 'useCostTracking must be used within a CostTrackingProvider'
  - **Status**: ❌ Not Started
  - **Notes**: Should validate context exists

- [ ] **Test Case**: addCost function from hook updates context state
  - **Input**: Call addCost(10) through hook
  - **Expected Output**: sessionCost increases by 10
  - **Status**: ❌ Not Started
  - **Notes**: Should trigger re-render with updated state

#### Integration Tests

- [ ] **Test Case**: Complete user flow from loading to cost tracking
  - **Input**: User loads → API succeeds → addCost called
  - **Expected Output**: Full state progression from loading to tracking costs
  - **Status**: ❌ Not Started
  - **Notes**: End-to-end scenario

- [ ] **Test Case**: Multiple components can share cost tracking state
  - **Input**: Two components both using useCostTracking hook
  - **Expected Output**: Both components see same sessionCost and can add costs
  - **Status**: ❌ Not Started
  - **Notes**: Context sharing verification

### Edge Cases

- [ ] **Test Case**: Provider handles very large cost values
  - **Input**: addCost(999999.99)
  - **Expected Output**: Handles large numbers without precision loss
  - **Status**: ❌ Not Started
  - **Notes**: JavaScript number precision limits

### Coverage Report

- Lines: 0%
- Branches: 0%
- Functions: 0%
- Statements: 0%

### Notes

- Dependencies mocked: uuid, @kit/supabase/hooks/use-user, global fetch
- Special considerations: React context testing requires wrapper components
- Time spent: [To be tracked]
- Test focuses on business logic: cost calculation, state management, API integration
- UI rendering aspects minimized per project standards

### Example Test Implementation

```typescript
it('should initialize provider with default values when no user', () => {
  // Arrange
  const mockUseUser = vi.mocked(useUser);
  mockUseUser.mockReturnValue({ data: null });
  
  const TestComponent = () => {
    const { sessionCost, sessionId, isLoading } = useCostTracking();
    return (
      <div>
        <span data-testid="cost">{sessionCost}</span>
        <span data-testid="session-id">{sessionId}</span>
        <span data-testid="loading">{isLoading.toString()}</span>
      </div>
    );
  };
  
  // Act
  render(
    <CostTrackingProvider>
      <TestComponent />
    </CostTrackingProvider>
  );
  
  // Assert
  expect(screen.getByTestId('cost')).toHaveTextContent('0');
  expect(screen.getByTestId('session-id')).toHaveTextContent('');
  expect(screen.getByTestId('loading')).toHaveTextContent('true');
});
```
