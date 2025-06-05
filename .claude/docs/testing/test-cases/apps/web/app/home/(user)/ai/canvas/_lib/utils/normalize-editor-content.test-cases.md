# Test Cases: normalize-editor-content.ts

## Status Summary
- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: In Progress
- **Total Test Cases**: 15
- **Completed Test Cases**: 0
- **Coverage**: 0%

## File: `apps/web/app/home/(user)/ai/canvas/_lib/utils/normalize-editor-content.ts`

### Test Setup
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeEditorContent } from './normalize-editor-content';
import type { EditorContentTypes, TiptapDocument, TiptapNode } from '../../_types/editor-types';

describe('normalizeEditorContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date.now for consistent timestamps
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-01T00:00:00.000Z');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test cases below
});
```

### Test Cases Checklist

#### Core Functionality - Main Function
- [ ] **Test Case**: Normalizes valid TiptapDocument object
  - **Input**: `{ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }] }` with `sectionType: 'situation'`
  - **Expected Output**: Normalized document with metadata
  - **Status**: ❌ Not Started
  - **Notes**: Test the main happy path

- [ ] **Test Case**: Normalizes JSON string content
  - **Input**: JSON string of valid TiptapDocument with `sectionType: 'complication'`
  - **Expected Output**: Parsed and normalized document
  - **Status**: ❌ Not Started
  - **Notes**: Test string parsing

- [ ] **Test Case**: Applies outline-specific transformations
  - **Input**: Document without heading, `sectionType: 'outline'`
  - **Expected Output**: Document with "Presentation Outline" heading added
  - **Status**: ❌ Not Started
  - **Notes**: Test outline transformation logic

#### Content Parsing Tests
- [ ] **Test Case**: Handles null input gracefully
  - **Input**: `null` with any section type
  - **Expected Output**: Safe default document with paragraph containing space
  - **Status**: ❌ Not Started
  - **Notes**: Should return EMPTY_DOCUMENT structure

- [ ] **Test Case**: Handles undefined input gracefully
  - **Input**: `undefined` with any section type
  - **Expected Output**: Safe default document
  - **Status**: ❌ Not Started
  - **Notes**: Should return EMPTY_DOCUMENT structure

- [ ] **Test Case**: Handles invalid JSON string
  - **Input**: `"{ invalid json }"` with any section type
  - **Expected Output**: Safe default document
  - **Status**: ❌ Not Started
  - **Notes**: Should catch JSON parse error and return safe content

- [ ] **Test Case**: Handles empty string
  - **Input**: `""` with any section type
  - **Expected Output**: Safe default document
  - **Status**: ❌ Not Started
  - **Notes**: Should treat as falsy content

#### Node Structure Normalization Tests
- [ ] **Test Case**: Fixes empty text nodes
  - **Input**: Document with text node having empty string or no text
  - **Expected Output**: Text node with single space
  - **Status**: ❌ Not Started
  - **Notes**: Test `normalizeNode` function for text nodes

- [ ] **Test Case**: Fixes paragraphs without content
  - **Input**: Paragraph node with no content array
  - **Expected Output**: Paragraph with text node containing space
  - **Status**: ❌ Not Started
  - **Notes**: Test paragraph normalization

- [ ] **Test Case**: Fixes empty bullet lists
  - **Input**: BulletList with no content
  - **Expected Output**: BulletList with single listItem containing paragraph
  - **Status**: ❌ Not Started
  - **Notes**: Test list normalization

- [ ] **Test Case**: Fixes empty ordered lists
  - **Input**: OrderedList with no content
  - **Expected Output**: OrderedList with single listItem containing paragraph
  - **Status**: ❌ Not Started
  - **Notes**: Test ordered list normalization

- [ ] **Test Case**: Fixes list items without paragraph content
  - **Input**: ListItem with direct text node instead of paragraph
  - **Expected Output**: ListItem with paragraph wrapping the content
  - **Status**: ❌ Not Started
  - **Notes**: Test listItem normalization

#### Nested Structure Tests
- [ ] **Test Case**: Recursively normalizes nested content
  - **Input**: Complex nested structure with multiple levels
  - **Expected Output**: All levels properly normalized
  - **Status**: ❌ Not Started
  - **Notes**: Test deep nesting scenarios

- [ ] **Test Case**: Handles malformed nested arrays
  - **Input**: Content array with null/undefined elements
  - **Expected Output**: Null elements replaced with safe paragraph nodes
  - **Status**: ❌ Not Started
  - **Notes**: Test robustness of recursive normalization

#### Schema Validation Tests
- [ ] **Test Case**: Validates document type is 'doc'
  - **Input**: Document with wrong root type
  - **Expected Output**: Should throw error and fallback to safe content
  - **Status**: ❌ Not Started
  - **Notes**: Test schema validation error handling

- [ ] **Test Case**: Validates root content array exists
  - **Input**: Document without content property
  - **Expected Output**: Should throw error and fallback to safe content
  - **Status**: ❌ Not Started
  - **Notes**: Test content array validation

### Coverage Report
- Lines: 0%
- Branches: 0%
- Functions: 0%
- Statements: 0%

### Implementation Notes
- **Dependencies mocked**: `Date.prototype.toISOString` for consistent timestamps
- **Special considerations**: 
  - Function uses console.error for logging - consider spying on console methods
  - Deep cloning is used extensively - test that mutations don't affect input
  - Schema validation errors trigger fallback behavior
- **Time spent**: [To be tracked]

### Example Test Implementation
```typescript
it('should normalize valid TiptapDocument and add metadata', () => {
  // Arrange
  const input = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello World' }]
      }
    ]
  };
  const sectionType: EditorContentTypes = 'situation';
  
  // Act
  const result = normalizeEditorContent(input, sectionType);
  
  // Assert
  expect(result.type).toBe('doc');
  expect(result.content).toHaveLength(1);
  expect(result.meta).toEqual({
    sectionType: 'situation',
    timestamp: '2024-01-01T00:00:00.000Z',
    version: '1.0'
  });
});
```