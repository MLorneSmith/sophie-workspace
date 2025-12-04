# Context7 Research: Lexical List Node Structure for Payload CMS

**Date**: 2025-12-03
**Agent**: context7-expert
**Libraries Researched**: facebook/lexical, payloadcms/payload

## Query Summary

Investigated validation errors in Payload CMS seed data for richText fields. Errors indicated invalid field structure:
- "The following field is invalid: Todo: Read Content"
- "The following fields are invalid: Todo, Todo: Watch Content, Todo: Read Content"

The seed data had Lexical list items with paragraph-wrapped text nodes, but the correct structure requires direct text children.

## Findings

### Lexical Core Documentation (facebook/lexical)

**General Serialization Pattern**:
- All Lexical nodes export to JSON via `exportJSON()` method
- All nodes must have `type` and `version` properties
- Parent nodes (ElementNode) contain `children` arrays
- Nodes use internal pointers (`__prev`, `__next`, `__parent`, `__key`)

**List Features** (@lexical/list package):
- ListNode represents the container (`<ul>` or `<ol>`)
- ListItemNode represents individual list items (`<li>`)
- Theme classes can be applied to nested lists
- Commands like `INSERT_UNORDERED_LIST_COMMAND` available

**Key Finding**: The documentation shows list integration but doesn't specify the exact children structure for ListItemNode in JSON serialization.

### Payload CMS Lexical Documentation (payloadcms/payload)

**Lexical Editor Integration**:
- Uses `@payloadcms/richtext-lexical` package
- Default editor: `lexicalEditor({})`
- Provides typed structures via `DefaultTypedEditorState`
- Includes serialized node types:
  - `SerializedListNode`
  - `SerializedListItemNode`
  - `SerializedParagraphNode`
  - `SerializedTextNode`

**Conversion Functions**:
- `convertLexicalToHTML()` - Convert to HTML
- `convertLexicalToPlaintext()` - Convert to plaintext
- `convertLexicalToMarkdown()` - Convert to Markdown
- `convertMarkdownToLexical()` - Import from Markdown

**Key Finding**: Payload expects specific node structures but documentation doesn't show list item children format explicitly.

### Codebase Analysis

**WORKING Structure** (documentation.json):
```json
{
  "type": "list",
  "listType": "bullet",
  "children": [
    {
      "type": "listitem",
      "children": [
        {
          "type": "text",
          "text": "Review our [Refund Policy](/refund-policy)"
        }
      ]
    }
  ]
}
```

**FAILING Structure** (course-lessons.json):
```json
{
  "type": "list",
  "version": 1,
  "listType": "bullet",
  "start": 1,
  "tag": "ul",
  "children": [
    {
      "type": "listitem",
      "version": 1,
      "value": 1,
      "children": [
        {
          "type": "paragraph",
          "version": 1,
          "children": [
            {
              "type": "text",
              "text": "None"
            }
          ]
        }
      ]
    }
  ]
}
```

**Key Difference**: `listitem` children should be direct **text nodes**, not paragraph-wrapped.

## Key Takeaways

1. **ListItemNode children must be direct text nodes** in Payload CMS Lexical implementation
2. Wrapping text in paragraph nodes within list items causes validation errors
3. The `version`, `value`, `start`, and `tag` properties are optional/may be auto-generated
4. Working minimal structure requires only `type`, `listType`, and proper children nesting
5. Text nodes within list items should have `type: "text"` and `text: "content"` properties

## Correct JSON Structure

### Minimal Working List Structure
```json
{
  "type": "list",
  "listType": "bullet",
  "children": [
    {
      "type": "listitem",
      "children": [
        {
          "type": "text",
          "text": "First bullet point"
        }
      ]
    },
    {
      "type": "listitem",
      "children": [
        {
          "type": "text",
          "text": "Second bullet point"
        }
      ]
    }
  ]
}
```

### Complete List Structure (with optional properties)
```json
{
  "type": "list",
  "version": 1,
  "listType": "bullet",
  "start": 1,
  "tag": "ul",
  "children": [
    {
      "type": "listitem",
      "version": 1,
      "value": 1,
      "children": [
        {
          "type": "text",
          "detail": 0,
          "format": 0,
          "mode": "normal",
          "style": "",
          "text": "First bullet point",
          "version": 1
        }
      ]
    }
  ]
}
```

### Ordered List Structure
```json
{
  "type": "list",
  "listType": "number",
  "tag": "ol",
  "children": [
    {
      "type": "listitem",
      "value": 1,
      "children": [
        {
          "type": "text",
          "text": "First numbered item"
        }
      ]
    },
    {
      "type": "listitem",
      "value": 2,
      "children": [
        {
          "type": "text",
          "text": "Second numbered item"
        }
      ]
    }
  ]
}
```

## Code Examples

### Fix for Seed Data Converter
```typescript
// WRONG: Wrapping text in paragraph
function createListItem(text: string) {
  return {
    type: "listitem",
    version: 1,
    value: 1,
    children: [
      {
        type: "paragraph",  // ❌ Don't wrap in paragraph
        version: 1,
        children: [
          {
            type: "text",
            text: text
          }
        ]
      }
    ]
  };
}

// CORRECT: Direct text node
function createListItem(text: string) {
  return {
    type: "listitem",
    children: [
      {
        type: "text",  // ✅ Direct text child
        text: text
      }
    ]
  };
}
```

### Creating a Bullet List
```typescript
function createBulletList(items: string[]) {
  return {
    type: "list",
    listType: "bullet",
    children: items.map(item => ({
      type: "listitem",
      children: [
        {
          type: "text",
          text: item
        }
      ]
    }))
  };
}

// Usage
const list = createBulletList([
  "First item",
  "Second item",
  "Third item"
]);
```

## Sources

- **Lexical Core**: facebook/lexical via Context7 (serialization, list nodes, node structure)
- **Payload CMS**: payloadcms/payload via Context7 (Lexical integration, typed structures)
- **Codebase Examples**: 
  - `/home/msmith/projects/2025slideheroes/apps/payload/src/seed/seed-data/documentation.json` (working)
  - `/home/msmith/projects/2025slideheroes/apps/payload/src/seed/seed-data/course-lessons.json` (failing)

## Recommendations

1. Update `course-lessons-converter.ts` to remove paragraph wrappers from list items
2. Regenerate `course-lessons.json` seed data with correct structure
3. Consider adding validation tests for Lexical node structures
4. Document the correct structure in seed converter comments
5. Add TypeScript types from `@payloadcms/richtext-lexical` for type safety
