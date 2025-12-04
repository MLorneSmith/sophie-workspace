# Perplexity Research: Payload CMS Lexical richText Link Validation

**Date**: 2025-12-03
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API
**Payload CMS Version**: 3.65.0
**Package**: @payloadcms/richtext-lexical

## Query Summary

Investigated validation errors when seeding course-lessons with Lexical richText fields containing links inside list items. The error message was:

```
[ERROR] Failed to create course-lessons record: The following field is invalid: Todo: Read Content
```

The problematic data structure:
```json
{
  "type": "listitem",
  "children": [
    {
      "type": "link",
      "url": "https://example.com",
      "children": [{ "type": "text", "text": "Link text" }]
    }
  ]
}
```

## Research Questions

1. Does Payload CMS lexicalEditor({}) include link support by default?
2. What is the correct Lexical JSON structure for links in Payload CMS v3.x?
3. Are there known issues with links inside list items?
4. What features are included by default in lexicalEditor({})?

## Key Findings

### 1. LinkFeature is Included by Default

**CONFIRMED**: The LinkFeature is included by default in Payload CMS's Lexical editor without requiring explicit configuration.

When you initialize the editor with `lexicalEditor({})`, link support is automatically available. This means you do NOT need to explicitly add LinkFeature to the features array.

**Default Features Included**:
- **LinkFeature** - Internal and external links with toolbar buttons, automatic URL conversion, markdown syntax support `[anchor](url)`
- **ChecklistFeature** - Interactive checklists
- **RelationshipFeature** - Block-level relationships to other documents
- **UploadFeature** - Upload/media nodes for all file types

All are marked as "Included by default: Yes" in official documentation.

### 2. Correct JSON Structure for Links

Based on the search results, the correct Lexical link node structure includes:

**Standard Link Properties**:
```json
{
  "type": "link",
  "version": 1,
  "direction": "ltr",
  "format": "",
  "indent": 0,
  "children": [
    {
      "type": "text",
      "text": "Link text",
      "format": 0,
      "mode": "normal",
      "style": "",
      "detail": 0,
      "version": 1
    }
  ],
  "fields": {
    "url": "https://example.com",
    "newTab": false,
    "linkType": "custom"
  }
}
```

**Key Differences from Your Structure**:
1. ✅ Your structure has: `"type": "link"` at root level
2. ❌ Your structure has: `"url": "https://example.com"` at root level
3. ✅ Payload expects: `"fields": { "url": "...", "linkType": "custom" }`

**The problem**: Your link structure has `url` directly on the node instead of nested under `fields.url`.

### 3. Internal Link Population Issue

One search result revealed an important detail about internal links in Payload Lexical:

**Issue #6547**: "Lexical Editor's Internal Link includes the whole referenced document, making requests super heavy"

Internal links behave like relationships and populate by default. To control this:

```typescript
LinkFeature({
  maxDepth: 0  // Disable population
})
```

Or set maxDepth on the entire richText field to control relationship/upload population.

### 4. Links Inside List Items

No specific known issues were found with links inside list items. The structure should work if the link node format is correct.

**Expected Structure for Link in List Item**:
```json
{
  "type": "listitem",
  "value": 1,
  "children": [
    {
      "type": "link",
      "version": 1,
      "direction": "ltr",
      "format": "",
      "indent": 0,
      "fields": {
        "url": "https://example.com",
        "linkType": "custom",
        "newTab": false
      },
      "children": [
        {
          "type": "text",
          "text": "Link text",
          "format": 0,
          "mode": "normal",
          "style": "",
          "detail": 0,
          "version": 1
        }
      ]
    }
  ]
}
```

### 5. Feature Configuration Examples

From Community Help and GitHub discussions:

**Minimal Feature Set** (if you want to disable defaults):
```typescript
import {
  lexicalEditor,
  BoldFeature,
  UnderlineFeature,
  ItalicFeature,
  OrderedListFeature,
  UnorderedListFeature,
  LinkFeature,
  FixedToolbarFeature,
} from '@payloadcms/richtext-lexical'

{
  name: 'description',
  type: 'richText',
  editor: lexicalEditor({
    features: [
      BoldFeature(),
      UnderlineFeature(),
      ItalicFeature(),
      OrderedListFeature(),
      UnorderedListFeature(),
      LinkFeature(),
      FixedToolbarFeature(),
    ],
  }),
}
```

**Filter Default Features**:
```typescript
editor: lexicalEditor({
  features: ({ defaultFeatures }) => 
    defaultFeatures.filter(feature => 
      !['superscript', 'subscript', 'inline-code'].includes(feature.key)
    )
})
```

### 6. TypeScript Types

Every Lexical node has a serialized type exported from `@payloadcms/richtext-lexical`:

- `SerializedLinkNode` - For link nodes
- `SerializedListItemNode` - For list item nodes
- `SerializedTextNode` - For text nodes

Use `TypedEditorState` or `DefaultTypedEditorState` for full type safety:

```typescript
import type { 
  SerializedLinkNode,
  SerializedListItemNode,
  DefaultTypedEditorState 
} from '@payloadcms/richtext-lexical'

const editorState: DefaultTypedEditorState = {
  root: {
    type: 'root',
    children: [...]
  }
}
```

## Root Cause Analysis

Based on the research, the validation error is likely caused by:

**Primary Issue**: Incorrect link node structure
- Your data has `url` at root level: `{ "type": "link", "url": "..." }`
- Payload expects `fields` object: `{ "type": "link", "fields": { "url": "...", "linkType": "custom" } }`

**Secondary Issues** (potential):
1. Missing required properties like `version`, `direction`, `format`, `indent`
2. Missing `linkType` field (should be "custom" or "internal")
3. Text node missing required properties (`format`, `mode`, `style`, `detail`, `version`)

## Recommended Solutions

### Solution 1: Fix Link Node Structure

Update your conversion code to generate correct Payload Lexical link structure:

```typescript
// WRONG (what you have now)
{
  type: "link",
  url: "https://example.com",
  children: [{ type: "text", text: "Link text" }]
}

// CORRECT (what Payload expects)
{
  type: "link",
  version: 1,
  direction: "ltr",
  format: "",
  indent: 0,
  fields: {
    url: "https://example.com",
    linkType: "custom",
    newTab: false
  },
  children: [
    {
      type: "text",
      text: "Link text",
      format: 0,
      mode: "normal",
      style: "",
      detail: 0,
      version: 1
    }
  ]
}
```

### Solution 2: Validate Against TypeScript Types

Import and use the official Serialized types:

```typescript
import type { SerializedLinkNode, SerializedTextNode } from '@payloadcms/richtext-lexical'

function createLinkNode(url: string, text: string): SerializedLinkNode {
  return {
    type: "link",
    version: 1,
    direction: "ltr",
    format: "",
    indent: 0,
    fields: {
      url,
      linkType: "custom",
      newTab: false
    },
    children: [
      {
        type: "text",
        text,
        format: 0,
        mode: "normal",
        style: "",
        detail: 0,
        version: 1
      }
    ]
  }
}
```

### Solution 3: Test with Actual Payload Data

Create a test document in Payload admin with links in list items, then inspect the JSON structure:

1. Go to Payload admin
2. Create a richText field with a list item containing a link
3. Save and inspect the database/API response
4. Use that exact structure as your template

## Related Issues

### GitHub Issue #6547
Internal links populate entire referenced documents by default. If using internal links, consider:

```typescript
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter(f => f.key !== 'link'),
    LinkFeature({
      maxDepth: 0  // Prevent full document population
    })
  ]
})
```

### Community Help
Multiple users have asked about filtering/customizing features. The toolbar itself is also a feature (`InlineToolbarFeature` or `FixedToolbarFeature`) and must be included if removing default features.

## Next Steps

1. **Immediate Fix**: Update link node structure to use `fields.url` instead of root-level `url`
2. **Add Required Properties**: Ensure all nodes have required Lexical properties (version, direction, format, indent)
3. **Test**: Create test document in Payload admin and compare JSON structure
4. **Validate**: Import TypeScript types and validate against `SerializedLinkNode`
5. **Document**: Update conversion code documentation with correct structure

## Sources & Citations

- [Payload CMS Rich Text Documentation](https://payloadcms.com/docs/rich-text/overview)
- [Payload CMS Official Features Documentation](https://payloadcms.com/docs/rich-text/lexical)
- [GitHub Issue #6547: Lexical Internal Link Population](https://github.com/payloadcms/payload/issues/6547)
- [Community Help: Lexical Disable Features](https://payloadcms.com/community-help/discord/lexical-disable-features)
- [GitHub: Building Custom Features](https://github.com/payloadcms/payload/blob/main/docs/lexical/building-custom-features.mdx)
- [GitHub: Replace Lexical LinkNode Discussion #12911](https://github.com/payloadcms/payload/discussions/12911)
- [@payloadcms/richtext-lexical npm package](https://www.npmjs.com/package/@payloadcms/richtext-lexical)

## Key Takeaways

1. ✅ **LinkFeature is included by default** - No explicit configuration needed
2. ❌ **Your link structure is incorrect** - Must use `fields.url` not root-level `url`
3. ✅ **Links in list items are supported** - No known issues when structure is correct
4. 📝 **Required properties**: version, direction, format, indent, fields object
5. 🔧 **LinkType field**: Must specify "custom" or "internal"
6. 📦 **TypeScript types**: Use `SerializedLinkNode` for type safety
7. ⚠️ **Internal links**: Populate full documents by default (use maxDepth: 0 to disable)

## Related Files to Update

Based on your project structure:
- `/home/msmith/projects/2025slideheroes/apps/payload/src/seed/seed-conversion/` - Conversion scripts
- `/home/msmith/projects/2025slideheroes/apps/payload/src/seed/seed-data/course-lessons.json` - Seeded data
- Any converters that generate Lexical JSON structures for links

The validation error will be resolved by ensuring link nodes follow Payload's expected structure with the `fields` object containing `url`, `linkType`, and other link-specific properties.
