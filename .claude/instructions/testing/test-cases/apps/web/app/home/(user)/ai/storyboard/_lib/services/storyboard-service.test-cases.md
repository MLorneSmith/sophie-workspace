# Test Cases: storyboard-service.ts

## File: `apps/web/app/home/(user)/ai/storyboard/_lib/services/storyboard-service.ts`

## Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: In Progress
- **Total Test Cases**: 16
- **Completed Test Cases**: 0
- **Coverage**: 0%

## Analysis Summary

This file contains three main server actions that handle storyboard operations:

1. **`getPresentationAction`** - Retrieves presentation data with fallback storyboard generation
2. **`getPresentationsAction`** - Lists all presentations for a user
3. **`saveStoryboardAction`** - Saves storyboard data to database
4. **`generateStoryboardFromOutline`** - Helper function to transform outlines to storyboards

### Dependencies to Mock

- `@kit/supabase/server-client` - Database operations
- `@kit/shared/logger` - Logging functionality
- `@kit/next/actions` (enhanceAction wrapper) - Server action framework
- `next/cache` (revalidatePath) - Cache invalidation
- `./tiptap-transformer` (TipTapTransformer) - Content transformation

### Test Cases Checklist

#### getPresentationAction Tests

- [ ] **Test Case**: Successfully retrieves presentation with existing storyboard

  - **Input**: `{ presentationId: "valid-id" }` with complete presentation data
  - **Expected Output**: `{ id, title, outline, storyboard }` object
  - **Status**: ❌ Not Started
  - **Notes**: Happy path with fully populated data

- [ ] **Test Case**: Retrieves presentation and generates storyboard from outline

  - **Input**: `{ presentationId: "valid-id" }` with outline but no storyboard
  - **Expected Output**: Presentation with generated storyboard and saved to DB
  - **Status**: ❌ Not Started
  - **Notes**: Tests automatic storyboard generation flow

- [ ] **Test Case**: Handles missing storyboard column gracefully

  - **Input**: `{ presentationId: "valid-id" }` when storyboard column doesn't exist
  - **Expected Output**: Falls back to outline-only query and generates storyboard
  - **Status**: ❌ Not Started
  - **Notes**: Tests database schema backward compatibility

- [ ] **Test Case**: Handles presentation not found

  - **Input**: `{ presentationId: "non-existent-id" }`
  - **Expected Output**: Throws error with user-friendly message
  - **Status**: ❌ Not Started
  - **Notes**: Should handle database query errors properly

- [ ] **Test Case**: Handles invalid JSON in outline

  - **Input**: Presentation with malformed outline string
  - **Expected Output**: Returns presentation without storyboard, logs error
  - **Status**: ❌ Not Started
  - **Notes**: Should not crash on invalid JSON

- [ ] **Test Case**: Handles TipTap transformer errors
  - **Input**: Valid presentation but transformer throws error
  - **Expected Output**: Returns presentation without storyboard, logs error
  - **Status**: ❌ Not Started
  - **Notes**: Graceful degradation when transformation fails

#### getPresentationsAction Tests

- [ ] **Test Case**: Successfully retrieves list of presentations

  - **Input**: No parameters (uses authenticated user)
  - **Expected Output**: Array of `{ id, title, created_at }` objects sorted by date
  - **Status**: ❌ Not Started
  - **Notes**: Basic list retrieval with proper ordering

- [ ] **Test Case**: Returns empty array when no presentations

  - **Input**: User with no presentations
  - **Expected Output**: `[]` empty array
  - **Status**: ❌ Not Started
  - **Notes**: Should handle empty result gracefully

- [ ] **Test Case**: Handles database query errors
  - **Input**: Database connection fails
  - **Expected Output**: Throws error with user-friendly message
  - **Status**: ❌ Not Started
  - **Notes**: Error handling for database issues

#### saveStoryboardAction Tests

- [ ] **Test Case**: Successfully saves valid storyboard data

  - **Input**: `{ presentationId: "valid-id", storyboard: validStoryboardData }`
  - **Expected Output**: `{ success: true }` and path revalidation
  - **Status**: ❌ Not Started
  - **Notes**: Happy path for storyboard saving

- [ ] **Test Case**: Validates storyboard data against schema

  - **Input**: `{ presentationId: "valid-id", storyboard: invalidData }`
  - **Expected Output**: Validation error before database call
  - **Status**: ❌ Not Started
  - **Notes**: Tests Zod schema validation

- [ ] **Test Case**: Handles missing storyboard column error

  - **Input**: Valid data but storyboard column doesn't exist in DB
  - **Expected Output**: Specific error about database migrations needed
  - **Status**: ❌ Not Started
  - **Notes**: Provides actionable error message for setup issues

- [ ] **Test Case**: Handles general database errors
  - **Input**: Valid data but database update fails
  - **Expected Output**: User-friendly error with details
  - **Status**: ❌ Not Started
  - **Notes**: Generic error handling for unexpected DB issues

#### generateStoryboardFromOutline Tests

- [ ] **Test Case**: Successfully transforms valid outline

  - **Input**: `{ outline: validTipTapDocument, title: "Test Presentation" }`
  - **Expected Output**: Valid StoryboardData object
  - **Status**: ❌ Not Started
  - **Notes**: Tests successful transformation flow

- [ ] **Test Case**: Handles string outline input

  - **Input**: `{ outline: '{"type":"doc","content":[]}', title: "Test" }`
  - **Expected Output**: Parsed and transformed storyboard
  - **Status**: ❌ Not Started
  - **Notes**: Tests JSON string parsing

- [ ] **Test Case**: Handles invalid JSON outline

  - **Input**: `{ outline: "invalid json", title: "Test" }`
  - **Expected Output**: Throws error with descriptive message
  - **Status**: ❌ Not Started
  - **Notes**: Should handle JSON parse errors gracefully

- [ ] **Test Case**: Uses default title when none provided
  - **Input**: `{ outline: validTipTapDocument }` (no title)
  - **Expected Output**: Storyboard with "Untitled Presentation" title
  - **Status**: ❌ Not Started
  - **Notes**: Tests default parameter handling

### Edge Cases

#### Authentication & Authorization

- [ ] **Test Case**: All actions require authentication
  - **Input**: Unauthenticated request
  - **Expected Output**: Authentication error
  - **Status**: ❌ Not Started
  - **Notes**: Tests enhanceAction auth requirement

#### Data Validation

- [ ] **Test Case**: Invalid presentation ID format
  - **Input**: `{ presentationId: 123 }` (number instead of string)
  - **Expected Output**: Validation error
  - **Status**: ❌ Not Started
  - **Notes**: Tests Zod schema validation

### Mock Setup Requirements

```typescript
// Supabase Client Mock
vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      order: vi.fn(),
    })),
  })),
}));

// Logger Mock
vi.mock('@kit/shared/logger', () => ({
  getLogger: vi.fn(() =>
    Promise.resolve({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    }),
  ),
}));

// TipTap Transformer Mock
vi.mock('./tiptap-transformer', () => ({
  TipTapTransformer: {
    transform: vi.fn(),
  },
}));

// Next.js Cache Mock
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// enhanceAction Mock
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data) => {
      // Validate with schema if provided
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          throw new Error('Validation failed');
        }
        data = result.data;
      }

      // Mock authenticated user
      const mockUser = {
        id: '123',
        email: 'test@example.com',
      };

      return fn(data, mockUser);
    };
  }),
}));
```

### Test Data Examples

```typescript
const mockPresentationData = {
  id: 'presentation-123',
  title: 'Test Presentation',
  outline: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Test Title' }],
      },
    ],
  },
  storyboard: {
    title: 'Test Presentation',
    slides: [
      {
        id: 'slide-1',
        title: 'Test Title',
        layoutId: 'title',
        content: [],
        order: 0,
      },
    ],
  },
};

const mockStoryboardData = {
  title: 'Test Presentation',
  slides: [
    {
      id: 'slide-1',
      title: 'Slide 1',
      slideType: 'title',
      subheadlines: [],
      layoutId: 'title',
      content: [
        {
          type: 'text',
          text: 'Sample content',
          columnIndex: 0,
        },
      ],
      order: 0,
    },
  ],
};
```

### Coverage Goals

- **Target Lines**: 85%
- **Target Branches**: 80%
- **Target Functions**: 100%
- **Focus Areas**: Error handling paths, validation logic, fallback mechanisms

### Notes

- **Dependencies mocked**: Supabase, Logger, TipTap Transformer, Next.js Cache
- **Special considerations**:
  - Complex error handling with multiple fallback strategies
  - Database schema evolution (storyboard column may not exist)
  - JSON parsing and validation at multiple levels
  - Server action wrapper testing
- **Time estimate**: 4-5 hours for comprehensive coverage
- **Priority**: Critical - core business logic for storyboard system

### Implementation Priority

1. Start with `generateStoryboardFromOutline` (pure function, easier to test)
2. Test `getPresentationsAction` (simpler database operation)
3. Test `saveStoryboardAction` (validation and error handling)
4. Test `getPresentationAction` (most complex with multiple fallbacks)
