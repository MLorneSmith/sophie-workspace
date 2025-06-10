# Test Cases: storyboard-service-client.ts

## File: `apps/web/app/home/(user)/ai/storyboard/_lib/services/storyboard-service-client.ts`

## Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: Partially Complete
- **Total Test Cases**: 24
- **Completed Test Cases**: 10
- **Coverage**: 42% (10 passing tests out of 24)

## Test Cases Checklist

### Core Functionality - getStoryboard

- [ ] **Test Case**: Fetch existing storyboard successfully

  - **Input**: Valid submissionId with existing storyboard data
  - **Expected Output**: Returns storyboard data directly
  - **Status**: ⏳ Pending
  - **Notes**: Primary success path

- [ ] **Test Case**: Generate storyboard from outline when missing

  - **Input**: Valid submissionId with outline but no storyboard
  - **Expected Output**: Generated storyboard from outline data
  - **Status**: ⏳ Pending
  - **Notes**: Fallback generation logic

- [ ] **Test Case**: Handle missing storyboard column gracefully

  - **Input**: Database without storyboard column
  - **Expected Output**: Fallback to outline-only query and generate storyboard
  - **Status**: ⏳ Pending
  - **Notes**: Database migration compatibility

- [ ] **Test Case**: Handle JSON parse errors in outline

  - **Input**: Outline as invalid JSON string
  - **Expected Output**: Throws error about failed generation
  - **Status**: ⏳ Pending
  - **Notes**: Data integrity handling

- [ ] **Test Case**: Handle missing submission ID
  - **Input**: Non-existent submissionId
  - **Expected Output**: Throws error about fetching presentation
  - **Status**: ⏳ Pending
  - **Notes**: Error handling for invalid IDs

### Core Functionality - saveStoryboard

- [ ] **Test Case**: Save storyboard successfully

  - **Input**: Valid submissionId and storyboard data
  - **Expected Output**: Returns true on successful save
  - **Status**: ⏳ Pending
  - **Notes**: Primary save operation

- [ ] **Test Case**: Handle missing storyboard column during save

  - **Input**: Database without storyboard column
  - **Expected Output**: Returns false and shows toast error
  - **Status**: ⏳ Pending
  - **Notes**: Migration compatibility for saves

- [ ] **Test Case**: Handle database errors during save
  - **Input**: Database error during update operation
  - **Expected Output**: Returns false and shows toast error
  - **Status**: ⏳ Pending
  - **Notes**: General error handling

### Core Functionality - listPresentations

- [ ] **Test Case**: List presentations successfully

  - **Input**: User with existing presentations
  - **Expected Output**: Array of presentations ordered by created_at desc
  - **Status**: ⏳ Pending
  - **Notes**: Basic listing functionality

- [ ] **Test Case**: Handle empty presentations list

  - **Input**: User with no presentations
  - **Expected Output**: Empty array
  - **Status**: ⏳ Pending
  - **Notes**: Edge case for new users

- [ ] **Test Case**: Handle database errors during listing
  - **Input**: Database error during select operation
  - **Expected Output**: Throws error about listing failure
  - **Status**: ⏳ Pending
  - **Notes**: Error handling

### Core Functionality - generatePowerPoint

- [ ] **Test Case**: PowerPoint generation not implemented
  - **Input**: Valid storyboard data
  - **Expected Output**: Throws "not implemented yet" error
  - **Status**: ⏳ Pending
  - **Notes**: Placeholder implementation

### Private Methods - generateStoryboardFromOutline

- [ ] **Test Case**: Generate slides from headings

  - **Input**: Outline with level 1 and 2 headings
  - **Expected Output**: Creates slides for each heading
  - **Status**: ⏳ Pending
  - **Notes**: Core slide generation logic

- [ ] **Test Case**: Extract title from level 1 heading

  - **Input**: Outline with level 1 heading
  - **Expected Output**: Uses level 1 heading as title
  - **Status**: ⏳ Pending
  - **Notes**: Title extraction logic

- [ ] **Test Case**: Handle subheadlines from level 3 headings

  - **Input**: Outline with level 3 headings
  - **Expected Output**: Adds level 3 headings as subheadlines to current slide
  - **Status**: ⏳ Pending
  - **Notes**: Nested content handling

- [ ] **Test Case**: Apply correct layout based on heading level

  - **Input**: Level 1 vs level 2 headings
  - **Expected Output**: Level 1 gets "title" layout, level 2 gets "content" layout
  - **Status**: ⏳ Pending
  - **Notes**: Layout assignment logic

- [ ] **Test Case**: Create default title slide when no content

  - **Input**: Empty or missing outline content
  - **Expected Output**: Creates single title slide with provided title
  - **Status**: ⏳ Pending
  - **Notes**: Fallback for empty presentations

- [ ] **Test Case**: Handle malformed outline structure
  - **Input**: Outline without content property
  - **Expected Output**: Creates default title slide
  - **Status**: ⏳ Pending
  - **Notes**: Defensive programming

### Private Methods - extractTitle

- [ ] **Test Case**: Extract title from first level 1 heading

  - **Input**: Multiple headings with level 1 first
  - **Expected Output**: Returns text from first level 1 heading
  - **Status**: ⏳ Pending
  - **Notes**: Title priority logic

- [ ] **Test Case**: Return null when no level 1 heading

  - **Input**: Outline with only level 2+ headings
  - **Expected Output**: Returns null
  - **Status**: ⏳ Pending
  - **Notes**: Fallback behavior

- [ ] **Test Case**: Handle empty outline
  - **Input**: Outline without content
  - **Expected Output**: Returns null
  - **Status**: ⏳ Pending
  - **Notes**: Edge case handling

### Private Methods - extractTextFromNode

- [ ] **Test Case**: Extract text from text nodes

  - **Input**: Node with text content
  - **Expected Output**: Returns concatenated text
  - **Status**: ⏳ Pending
  - **Notes**: Basic text extraction

- [ ] **Test Case**: Handle nested text nodes

  - **Input**: Node with nested content containing text
  - **Expected Output**: Returns flattened text content
  - **Status**: ⏳ Pending
  - **Notes**: Recursive text extraction

- [ ] **Test Case**: Handle nodes without content
  - **Input**: Node with no content property
  - **Expected Output**: Returns empty string
  - **Status**: ⏳ Pending
  - **Notes**: Defensive programming

### Integration & Edge Cases

- [ ] **Test Case**: Full workflow with complex outline

  - **Input**: Complex outline with multiple heading levels, lists, paragraphs
  - **Expected Output**: Generated storyboard with proper structure
  - **Status**: ⏳ Pending
  - **Notes**: End-to-end functionality test

- [ ] **Test Case**: Handle large presentations
  - **Input**: Outline with 50+ slides worth of content
  - **Expected Output**: Generates all slides with proper ordering
  - **Status**: ⏳ Pending
  - **Notes**: Performance and scalability

## Dependencies to Mock

- `@supabase/supabase-js` - Database client for all operations
- `@kit/ui/sonner` - Toast notifications for error handling
- PRESET_LAYOUTS constant - Layout template definitions
- Type imports from `../types/index` - TypeScript interfaces

## Test Setup Template

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toast } from '@kit/ui/sonner';

import { StoryboardService } from './storyboard-service-client';

// Mock dependencies
vi.mock('@kit/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// Mock types and constants
const MOCK_PRESET_LAYOUTS = [
  {
    id: 'title',
    contentAreas: [{ id: 'title-area', type: 'text' }],
  },
  {
    id: 'content',
    contentAreas: [{ id: 'content-area', type: 'text' }],
  },
];

describe('StoryboardService', () => {
  let service: StoryboardService;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn(),
      order: vi.fn().mockReturnThis(),
    };

    service = new StoryboardService(mockSupabase);
  });

  // Tests here
});
```

## Coverage Goals

- Lines: 90%+
- Branches: 85%+
- Functions: 100%
- Statements: 90%

## Notes

- This service has complex business logic for storyboard generation
- Focus on testing the outline parsing and slide generation algorithms
- Mock all Supabase operations and UI components
- Test both happy path and error scenarios thoroughly
- The generateStoryboardFromOutline method is particularly complex and needs thorough testing
