# Context7 Research: Payload CMS Lexical RichText Structure

**Date**: 2025-12-03
**Agent**: context7-expert
**Libraries Researched**: payloadcms/payload

## Query Summary

Researched the correct Lexical richText structure for Payload CMS v3.x, specifically investigating:
1. Correct JSON structure for lists with links
2. Required editor features configuration
3. Why validation errors occur with link nodes inside list items
4. What features `lexicalEditor({})` with no configuration supports

## Findings

### Problem Root Cause

**The issue is that `lexicalEditor({})` with an empty configuration object does NOT include link support by default.**

When you use:
```typescript
editor: lexicalEditor({})
```

You only get basic text formatting features. Links require explicitly adding `LinkFeature()` to the features array.

### Default Features

The `defaultFeatures` array in Payload CMS Lexical editor includes:
- `BoldFeature()`
- `ItalicFeature()`
- `UnderlineFeature()`
- `ParagraphFeature()`
- `OrderedListFeature()`
- `UnorderedListFeature()`
- `HeadingFeature()`

**Link support is NOT included in defaultFeatures** - it must be added explicitly.

### Correct Editor Configuration

To support links in richText fields, you MUST configure the editor like this:

```typescript
import { lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'

{
  name: "todo_read_content",
  type: "richText",
  label: "Todo: Read Content",
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      LinkFeature({
        // Optional: restrict to specific collections for internal links
        enabledCollections: ['pages', 'posts'],
        // Optional: disable auto-link conversion
        disableAutoLinks: false,
      }),
    ],
  }),
}
```

### Correct Lexical JSON Structure

The JSON structure for lists with links in the seed data is **actually correct**:

```json
{
  "root": {
    "type": "root",
    "format": "",
    "indent": 0,
    "version": 1,
    "direction": null,
    "children": [
      {
        "type": "list",
        "listType": "bullet",
        "tag": "ul",
        "start": 1,
        "version": 1,
        "children": [
          {
            "type": "listitem",
            "value": 1,
            "version": 1,
            "children": [
              {
                "type": "link",
                "fields": {
                  "url": "https://example.com",
                  "linkType": "custom",
                  "newTab": false
                },
                "direction": "ltr",
                "format": "",
                "indent": 0,
                "version": 2,
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
        ]
      }
    ]
  }
}
```

**Key Points**:
1. Link nodes can be children of listitem nodes
2. Link nodes require a `fields` object with `url`, `linkType`, and `newTab`
3. Link nodes must have `version: 2` (not version 1)
4. Link nodes need `direction`, `format`, and `indent` properties

### Alternative Simplified Structure

For simpler cases without the full fields object:

```json
{
  "type": "link",
  "url": "https://example.com",
  "children": [
    {
      "type": "text",
      "text": "Link text"
    }
  ]
}
```

However, the full structure with `fields` is more robust and matches Payload's internal representation.

## Key Takeaways

1. **Root Cause**: `lexicalEditor({})` does not support links - must add `LinkFeature()` explicitly
2. **Fix Required**: Update collection definition to add `LinkFeature()` to all richText fields that need link support
3. **JSON Structure**: The seed data structure is correct - it's the editor configuration that's missing features
4. **Best Practice**: Always explicitly configure features rather than relying on defaults
5. **Link Node Version**: Link nodes must use `version: 2`, not `version: 1`

## Code Examples

### Minimal Fix (Add LinkFeature)

```typescript
import { lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'

{
  name: "todo_read_content",
  type: "richText",
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      LinkFeature(),
    ],
  }),
}
```

### Comprehensive Configuration

```typescript
import {
  lexicalEditor,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
  BoldFeature,
  ItalicFeature,
} from '@payloadcms/richtext-lexical'

export const CourseLessons: CollectionConfig = {
  slug: 'course-lessons',
  fields: [
    {
      name: 'todo_read_content',
      type: 'richText',
      label: 'Todo: Read Content',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          LinkFeature({
            // Allow both internal and external links
            enabledCollections: ['posts', 'pages'],
            // Optionally customize fields
            fields: ({ defaultFields }) => [
              ...defaultFields,
              {
                name: 'rel',
                type: 'select',
                options: ['noopener', 'noreferrer', 'nofollow'],
                admin: {
                  description: 'Set link relationship attributes',
                },
              },
            ],
          }),
        ],
      }),
    },
  ],
}
```

### Full Link Node Structure (for seed data)

```typescript
{
  "type": "link",
  "fields": {
    "url": "https://www.example.com/article",
    "linkType": "custom",  // or "internal" for internal docs
    "newTab": false,       // open in new tab?
    "doc": null            // relationship ID if linkType is "internal"
  },
  "direction": "ltr",
  "format": "",
  "indent": 0,
  "version": 2,           // MUST be version 2 for link nodes
  "children": [
    {
      "type": "text",
      "text": "Link text here",
      "format": 0,
      "mode": "normal",
      "style": "",
      "detail": 0,
      "version": 1
    }
  ]
}
```

## Implementation Steps

1. **Update Collection Definition**: Add `LinkFeature()` to `lexicalEditor()` configuration in `/home/msmith/projects/2025slideheroes/apps/payload/src/collections/CourseLessons.ts`

2. **Apply to All RichText Fields**: Update these fields:
   - `todo`
   - `todo_watch_content`
   - `todo_read_content`
   - `todo_course_project`

3. **Optional: Clear Cache**: After modifying collection config:
   ```bash
   pnpm --filter payload cache:clear
   pnpm --filter payload dev
   ```

4. **Verify Seed Data**: The existing JSON structure in seed data is correct and will work once `LinkFeature()` is added

## Sources

- Payload CMS v3.x via Context7 (payloadcms/payload)
- Official documentation on Lexical editor configuration
- Link feature configuration reference
- Lexical node structure specifications

## Related Files

- `/home/msmith/projects/2025slideheroes/apps/payload/src/collections/CourseLessons.ts` - Collection definition (needs update)
- `/home/msmith/projects/2025slideheroes/apps/payload/src/seed/seed-data/course-lessons.json` - Seed data (correct structure)
- `/home/msmith/projects/2025slideheroes/apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts` - Converter (generates correct structure)
