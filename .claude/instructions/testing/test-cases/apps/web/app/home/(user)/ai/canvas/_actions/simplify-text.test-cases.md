# Test Cases: simplify-text.ts

## File: `apps/web/app/home/(user)/ai/canvas/_actions/simplify-text.ts`

## Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: In Progress
- **Total Test Cases**: 12
- **Completed Test Cases**: 0
- **Coverage**: 0%

## Function Overview

Server action that simplifies text content using AI. Takes complex text and returns a simplified version while preserving key information.

### Test Setup

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { simplifyTextAction } from './simplify-text';

// Mock dependencies
vi.mock('@kit/ai-gateway', () => ({
  getChatCompletion: vi.fn(),
  createReasoningOptimizedConfig: vi.fn(),
}));

vi.mock('@kit/ai-gateway/src/prompts/prompt-manager', () => ({
  PromptManager: {
    compile: vi.fn(),
  },
}));

vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data) => {
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { error: 'Validation failed' };
        }
      }
      const mockUser = { id: '123', email: 'test@example.com' };
      return fn(data, mockUser);
    };
  }),
}));

describe('simplifyTextAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test cases below
});
```

### Test Cases Checklist

#### Schema Validation

- [ ] **Test Case**: Validates required fields are present

  - **Input**: `{ content: "test", userId: "123", canvasId: "456", sectionType: "intro" }`
  - **Expected Output**: Successful validation, action proceeds
  - **Status**: ❌ Not Started
  - **Notes**: All fields are required

- [ ] **Test Case**: Rejects missing content field

  - **Input**: `{ userId: "123", canvasId: "456", sectionType: "intro" }`
  - **Expected Output**: Validation error
  - **Status**: ❌ Not Started
  - **Notes**: Content is required for simplification

- [ ] **Test Case**: Rejects missing userId field

  - **Input**: `{ content: "test", canvasId: "456", sectionType: "intro" }`
  - **Expected Output**: Validation error
  - **Status**: ❌ Not Started
  - **Notes**: User ID required for config creation

- [ ] **Test Case**: Rejects missing canvasId field

  - **Input**: `{ content: "test", userId: "123", sectionType: "intro" }`
  - **Expected Output**: Validation error
  - **Status**: ❌ Not Started
  - **Notes**: Canvas ID required for cache namespacing

- [ ] **Test Case**: Rejects missing sectionType field
  - **Input**: `{ content: "test", userId: "123", canvasId: "456" }`
  - **Expected Output**: Validation error
  - **Status**: ❌ Not Started
  - **Notes**: Section type required for context

#### Core Functionality

- [ ] **Test Case**: Successfully simplifies text with valid input

  - **Input**: `{ content: "Complex business terminology...", userId: "123", canvasId: "456", sectionType: "situation" }`
  - **Expected Output**: `{ success: true, response: "Simplified text..." }`
  - **Status**: ❌ Not Started
  - **Notes**: Happy path test

- [ ] **Test Case**: Handles different section types

  - **Input**: Multiple calls with different sectionType values
  - **Expected Output**: Config context includes section type
  - **Status**: ❌ Not Started
  - **Notes**: Should affect cache namespacing

- [ ] **Test Case**: Preserves user and canvas context in config
  - **Input**: Valid data with specific userId and canvasId
  - **Expected Output**: Config created with correct context
  - **Status**: ❌ Not Started
  - **Notes**: Check createReasoningOptimizedConfig call

#### AI Integration

- [ ] **Test Case**: Compiles prompt template correctly

  - **Input**: Content with specific text to simplify
  - **Expected Output**: PromptManager.compile called with content
  - **Status**: ❌ Not Started
  - **Notes**: Verify template compilation

- [ ] **Test Case**: Uses correct model and parameters
  - **Input**: Any valid input
  - **Expected Output**: getChatCompletion called with gpt-4, temperature 0.7
  - **Status**: ❌ Not Started
  - **Notes**: Check AI configuration

#### Error Scenarios

- [ ] **Test Case**: Handles AI service failures

  - **Input**: Valid data but getChatCompletion throws error
  - **Expected Output**: `{ success: false, error: "Error message" }`
  - **Status**: ❌ Not Started
  - **Notes**: Should catch and return user-friendly error

- [ ] **Test Case**: Handles prompt compilation failures
  - **Input**: Valid data but PromptManager.compile throws error
  - **Expected Output**: `{ success: false, error: "Error message" }`
  - **Status**: ❌ Not Started
  - **Notes**: Should handle template compilation errors

### Coverage Report

- Lines: 0%
- Branches: 0%
- Functions: 0%
- Statements: 0%

### Notes

- Dependencies mocked: @kit/ai-gateway, @kit/next/actions, PromptManager
- Special considerations: AI service calls need mocking, error handling critical
- Time spent: [Track time for estimation accuracy]

### Example Test Implementation

```typescript
it('should simplify text with valid input', async () => {
  // Arrange
  const mockResponse = 'This is simplified text';
  vi.mocked(getChatCompletion).mockResolvedValue(mockResponse);
  vi.mocked(PromptManager.compile).mockReturnValue('Compiled prompt');

  const input = {
    content: 'Complex business synergies and paradigm shifts',
    userId: 'user-123',
    canvasId: 'canvas-456',
    sectionType: 'situation',
  };

  // Act
  const result = await simplifyTextAction(input);

  // Assert
  expect(result).toEqual({
    success: true,
    response: mockResponse,
  });
  expect(getChatCompletion).toHaveBeenCalledWith(
    expect.any(Array),
    expect.objectContaining({
      model: 'gpt-4',
      temperature: 0.7,
    }),
  );
});
```
