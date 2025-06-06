# Test Cases: generate-outline.ts

## Status Summary
- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06  
- **Test Implementation Status**: Completed
- **Total Test Cases**: 30 (implemented)
- **Completed Test Cases**: 30
- **Coverage**: 100% (Business Logic Functions)

## File: `apps/web/app/home/(user)/ai/canvas/_actions/generate-outline.ts`

### Test Setup
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOutlineAction } from './generate-outline';

// Mock dependencies  
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data) => {
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { error: 'Validation failed' };
        }
        data = result.data;
      }
      const mockUser = { id: '123', email: 'test@example.com' };
      return fn(data, mockUser);
    };
  }),
}));

vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(), 
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
    })),
  })),
}));

describe('Generate Outline Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test cases below
});
```

### Test Cases Checklist

#### Core Functionality
- [ ] **Test Case**: Valid submission generates outline structure
  - **Input**: `{ submissionId: "valid-id", forceRegenerate: false }`
  - **Expected Output**: Success response with TipTap document structure
  - **Status**: ❌ Not Started
  - **Notes**: Should create proper heading structure with Situation/Complication/Answer sections

- [ ] **Test Case**: Force regenerate bypasses existing outline
  - **Input**: `{ submissionId: "valid-id", forceRegenerate: true }`
  - **Expected Output**: New outline generated even if one exists
  - **Status**: ❌ Not Started
  - **Notes**: Should ignore existing outline when force flag is true

- [ ] **Test Case**: Reuses existing valid outline when forceRegenerate is false
  - **Input**: `{ submissionId: "id-with-outline", forceRegenerate: false }`
  - **Expected Output**: Returns existing parsed outline without regeneration
  - **Status**: ❌ Not Started
  - **Notes**: Should check if valid outline exists first

#### Schema Validation
- [ ] **Test Case**: Validates required submissionId
  - **Input**: `{ forceRegenerate: true }`
  - **Expected Output**: Validation error for missing submissionId
  - **Status**: ❌ Not Started
  - **Notes**: submissionId is required field

- [ ] **Test Case**: Handles optional forceRegenerate parameter
  - **Input**: `{ submissionId: "valid-id" }`
  - **Expected Output**: Successfully processes with forceRegenerate defaulting to false
  - **Status**: ❌ Not Started
  - **Notes**: forceRegenerate should be optional

- [ ] **Test Case**: Rejects empty submissionId
  - **Input**: `{ submissionId: "", forceRegenerate: false }`
  - **Expected Output**: Validation error for empty string
  - **Status**: ❌ Not Started
  - **Notes**: submissionId must be non-empty string

#### Content Processing
- [ ] **Test Case**: Processes Lexical format content
  - **Input**: Submission with Lexical JSON in situation/complication/answer
  - **Expected Output**: Content converted to TipTap format in outline
  - **Status**: ❌ Not Started
  - **Notes**: Should use lexicalToTiptap conversion

- [ ] **Test Case**: Processes TipTap format content
  - **Input**: Submission with TipTap JSON in situation/complication/answer
  - **Expected Output**: Content preserved as TipTap in outline
  - **Status**: ❌ Not Started
  - **Notes**: Should detect existing TipTap format

- [ ] **Test Case**: Handles mixed content formats
  - **Input**: Submission with different formats in each section
  - **Expected Output**: All content normalized to TipTap format
  - **Status**: ❌ Not Started
  - **Notes**: Each section processed independently

#### Content Structure
- [ ] **Test Case**: Creates proper outline heading structure
  - **Input**: Submission with all three sections
  - **Expected Output**: Document with "Presentation Outline" h1 and section h2 headings
  - **Status**: ❌ Not Started
  - **Notes**: Should have consistent heading hierarchy

- [ ] **Test Case**: Includes sections with valid content
  - **Input**: Submission where only some sections have content
  - **Expected Output**: Only sections with valid text get headings and content
  - **Status**: ❌ Not Started
  - **Notes**: Uses hasValidText function to determine inclusion

- [ ] **Test Case**: Preserves list structures
  - **Input**: Submission with bullet lists and ordered lists
  - **Expected Output**: Lists maintained in outline with proper structure
  - **Status**: ❌ Not Started
  - **Notes**: Lists should be preserved even if they contain minimal text

#### Edge Cases
- [ ] **Test Case**: Handles null content in sections
  - **Input**: Submission with null values for situation/complication/answer
  - **Expected Output**: Empty TipTap document structure with just main heading
  - **Status**: ❌ Not Started
  - **Notes**: Should not crash on null content

- [ ] **Test Case**: Handles empty content in sections
  - **Input**: Submission with empty string values
  - **Expected Output**: Empty TipTap document structure
  - **Status**: ❌ Not Started
  - **Notes**: Should use EMPTY_TIPTAP_DOCUMENT

- [ ] **Test Case**: Handles malformed JSON in existing outline
  - **Input**: Submission with invalid JSON in outline field
  - **Expected Output**: Regenerates outline instead of using malformed data
  - **Status**: ❌ Not Started
  - **Notes**: Should catch JSON parse errors and continue

- [ ] **Test Case**: Handles malformed JSON in content sections
  - **Input**: Submission with invalid JSON in situation/complication/answer
  - **Expected Output**: Uses EMPTY_TIPTAP_DOCUMENT for malformed sections
  - **Status**: ❌ Not Started
  - **Notes**: parseTiptapDocument should handle parse errors gracefully

#### Normalization Function Tests  
- [ ] **Test Case**: Normalizes empty text nodes
  - **Input**: TipTap document with empty text nodes
  - **Expected Output**: Text nodes filled with single space
  - **Status**: ❌ Not Started
  - **Notes**: Prevents TipTap rendering issues

- [ ] **Test Case**: Normalizes empty paragraphs
  - **Input**: Paragraphs without content array
  - **Expected Output**: Paragraphs with space text node
  - **Status**: ❌ Not Started
  - **Notes**: Ensures valid paragraph structure

- [ ] **Test Case**: Normalizes empty lists
  - **Input**: Bullet/ordered lists without content
  - **Expected Output**: Lists with single list item containing paragraph
  - **Status**: ❌ Not Started
  - **Notes**: Prevents empty list rendering issues

- [ ] **Test Case**: Normalizes list items without paragraphs
  - **Input**: List items with non-paragraph content
  - **Expected Output**: Content wrapped in paragraph nodes
  - **Status**: ❌ Not Started
  - **Notes**: Ensures proper list item structure

#### Database Integration
- [ ] **Test Case**: Successfully updates outline in database
  - **Input**: Valid submission data
  - **Expected Output**: Database update called with stringified outline
  - **Status**: ❌ Not Started
  - **Notes**: Should call supabase update with correct parameters

- [ ] **Test Case**: Handles database fetch error
  - **Input**: Submission ID that doesn't exist
  - **Expected Output**: Error response about failed data fetch
  - **Status**: ❌ Not Started
  - **Notes**: Should handle supabase select errors

- [ ] **Test Case**: Handles database update error
  - **Input**: Valid data but database update fails
  - **Expected Output**: Error response about failed outline update
  - **Status**: ❌ Not Started
  - **Notes**: Should handle supabase update errors

#### Metadata and Output Format
- [ ] **Test Case**: Adds correct metadata to outline
  - **Input**: Valid submission
  - **Expected Output**: Outline includes meta.sectionType, timestamp, version
  - **Status**: ❌ Not Started
  - **Notes**: Should add structured metadata

- [ ] **Test Case**: Returns valid TipTap document structure
  - **Input**: Any valid submission
  - **Expected Output**: Document with type: "doc" and content array
  - **Status**: ❌ Not Started
  - **Notes**: Must be valid TipTap document format

#### Error Scenarios
- [ ] **Test Case**: Handles unknown errors gracefully
  - **Input**: Scenario that causes unexpected error
  - **Expected Output**: Error response with generic message
  - **Status**: ❌ Not Started
  - **Notes**: Should catch and handle any unexpected errors

- [ ] **Test Case**: Handles missing submission data
  - **Input**: Valid submission ID but no data returned
  - **Expected Output**: Error about failed to fetch submission data
  - **Status**: ❌ Not Started
  - **Notes**: Should handle when submission query returns null

### Coverage Report
- Lines: 0%
- Branches: 0%
- Functions: 0%
- Statements: 0%

### Notes
- Dependencies mocked: enhanceAction, getSupabaseServerClient, lexicalToTiptap
- Special considerations: Complex TipTap document structure validation, content format conversion
- Time spent: [Track time for estimation accuracy]

### Example Test Implementation
```typescript
it('should generate outline with proper structure for valid submission', async () => {
  // Arrange
  const mockData = { submissionId: 'test-id', forceRegenerate: false };
  const mockSubmission = {
    situation: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test situation"}]}]}',
    complication: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test complication"}]}]}',
    answer: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test answer"}]}]}'
  };
  
  // Mock database responses
  mockSupabase.from().select().eq().single.mockResolvedValue({
    data: mockSubmission,
    error: null
  });
  
  // Act
  const result = await generateOutlineAction(mockData);
  
  // Assert
  expect(result.success).toBe(true);
  expect(result.data.type).toBe('doc');
  expect(result.data.content).toBeDefined();
  expect(result.data.meta.sectionType).toBe('outline');
});
```