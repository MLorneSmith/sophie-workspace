# TipTap Transformer Test Cases

## Overview

TipTap Transformer is a pure function class that converts TipTap JSON documents into Storyboard format. This transformation is critical for the presentation generation pipeline.

## Source File

`apps/web/app/home/(user)/ai/storyboard/_lib/services/tiptap-transformer.ts`

## Test Categories

### 1. Document Parsing Tests

- **Valid JSON string input**: Parses correctly formatted TipTap JSON
- **Invalid JSON string input**: Handles malformed JSON gracefully with empty document fallback
- **Object input**: Handles pre-parsed TipTap document objects
- **Empty string input**: Returns empty document structure
- **Null/undefined input**: Handles gracefully

### 2. Title Extraction Tests

- **Level 1 heading exists**: Extracts first H1 as title
- **Multiple level 1 headings**: Uses first one only
- **No level 1 heading**: Returns null (uses fallback title)
- **Empty heading**: Handles empty text content
- **Nested text in heading**: Extracts all text content from complex heading structures

### 3. Slide Identification Tests

- **Single level 1 heading**: Creates one title slide
- **Multiple level 1 headings**: Creates multiple title slides
- **Level 2 headings**: Creates section slides
- **Mixed heading levels**: Proper slide boundaries and types
- **No headings**: Creates default title slide
- **Content between headings**: Properly assigns to correct slides

### 4. Layout Determination Tests

- **Title layout**: Level 1 headings get "title" layout
- **Section layout**: Level 2 headings get appropriate layouts
- **Bullet list content**: Switches to "bullet-list" layout when appropriate
- **Chart data detection**: Switches to "chart" layout for numerical content
- **Multi-column layouts**: Two-column and three-column based on level 3 headings
- **Content-based layouts**: Different layouts based on content analysis

### 5. Content Processing Tests

- **Paragraph content**: Converts paragraphs to text content items
- **Bullet lists**: Processes into bullet content items with proper nesting
- **Ordered lists**: Handles numbered lists
- **Nested lists**: Processes subbullets correctly
- **Mixed content**: Handles paragraphs, lists, and headings together
- **Empty content**: Handles nodes with no content

### 6. Subheadline Processing Tests

- **Level 3 headings**: Become subheadlines
- **Multiple level 3 headings**: Creates array of subheadlines
- **Column layout adjustment**: Updates layout based on subheadline count
- **Subheadline normalization**: Ensures correct count for each layout type
- **Empty subheadlines**: Fills missing subheadlines with empty strings

### 7. Chart Data Detection Tests

- **Percentage patterns**: Detects content with percentages (e.g., "45%")
- **Numerical comparisons**: Identifies comparison data
- **Growth/trend keywords**: Recognizes trend-related language
- **Multiple numbers**: Detects data points in text
- **Chart type suggestions**: Suggests appropriate chart types based on content

### 8. UUID Generation Tests

- **Format validation**: Ensures proper UUID v4 format
- **Uniqueness**: Each call generates different UUIDs
- **Character set**: Uses correct hexadecimal characters

### 9. Text Extraction Tests

- **Simple text nodes**: Extracts plain text
- **Nested content**: Recursively extracts from complex structures
- **Empty nodes**: Handles nodes without text content
- **Text with formatting**: Extracts text regardless of markup

### 10. Edge Cases

- **Empty document**: Creates default slide
- **Document with only whitespace**: Handles gracefully
- **Very deep nesting**: Processes without stack overflow
- **Large documents**: Handles performance gracefully
- **Special characters**: Preserves Unicode and special characters
- **Malformed node structures**: Robust error handling

## Mock Requirements

None - all functions are pure transformations without external dependencies.

## Test Data Examples

### Simple TipTap Document

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Presentation Title" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Introduction content" }]
    }
  ]
}
```

### Complex Multi-Slide Document

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Main Title" }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Section 1" }]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Column 1" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Content for column 1" }]
    },
    {
      "type": "heading",
      "attrs": { "level": 3 },
      "content": [{ "type": "text", "text": "Column 2" }]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "Bullet point 1" }]
            }
          ]
        }
      ]
    }
  ]
}
```

### Chart Data Content

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Sales Growth" }]
    },
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "Revenue increased by 25% over the last quarter, with Q1 showing 100M, Q2 at 125M, and Q3 reaching 150M." }]
    }
  ]
}
```

## Expected Test Coverage

- **Lines**: 95%+ (comprehensive testing of all transformation logic)
- **Branches**: 90%+ (all conditional paths tested)
- **Functions**: 100% (all public and private methods tested)

## Performance Considerations

- Test with documents of varying sizes (10 nodes to 1000+ nodes)
- Verify no memory leaks with large document processing
- Ensure reasonable performance for typical document sizes
