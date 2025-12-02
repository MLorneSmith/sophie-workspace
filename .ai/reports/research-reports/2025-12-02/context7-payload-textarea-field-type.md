# Context7 Research: Payload CMS Textarea Field Type

**Date**: 2025-12-02
**Agent**: context7-expert
**Libraries Researched**: payloadcms/payload

## Query Summary

Investigated whether "textarea" is a valid distinct field type in Payload CMS, and the differences between "text" and "textarea" field types.

## Findings

### Textarea Field Type - CONFIRMED VALID

**YES, "textarea" is a distinct, valid field type in Payload CMS.**

From the official documentation (docs/fields/textarea.mdx):

```typescript
import type { CollectionConfig } from 'payload'

export const ExampleCollection: CollectionConfig = {
  slug: 'example-collection',
  fields: [
    {
      name: 'metaDescription',
      type: 'textarea', // VALID FIELD TYPE
      required: true,
    },
  ],
}
```

### Differences Between "text" and "textarea"

| Feature | Text Field | Textarea Field |
|---------|-----------|----------------|
| **Type Value** | `type: 'text'` | `type: 'textarea'` |
| **UI Rendering** | Single-line text input | Multi-line text area |
| **Data Storage** | String | String |
| **Use Case** | Short text (titles, names, labels) | Longer text (descriptions, notes, meta descriptions) |
| **Admin Options** | `placeholder`, `autoComplete`, `rtl` | `placeholder`, `autoComplete`, `rows`, `rtl` |
| **Component** | `TextField` from `@payloadcms/ui` | `TextareaField` from `@payloadcms/ui` |

### Key Differences

1. **rows property** - Textarea fields support a `rows` admin option to control the height:
   ```typescript
   admin: {
     rows: 4, // Only available for textarea
   }
   ```

2. **UI Component** - Different React components are used:
   - Text: `TextField` and `TextFieldClientComponent`
   - Textarea: `TextareaField` and `TextareaFieldClientComponent`

3. **Intended Use**:
   - **Text**: Page titles, names, short labels (one line)
   - **Textarea**: Meta descriptions, notes, longer content (multi-line)

## Code Examples

### Text Field Configuration
```typescript
import type { TextField } from 'payload'

const textField: TextField = {
  name: 'title',
  type: 'text',
  required: true,
  maxLength: 100,
  admin: {
    placeholder: 'Enter title...',
  },
}
```

### Textarea Field Configuration
```typescript
import type { Field } from 'payload'

export const MyTextareaField: Field = {
  name: 'metaDescription',
  type: 'textarea',
  required: true,
  admin: {
    placeholder: 'Enter meta description...',
    rows: 4, // Textarea-specific option
  },
}
```

### Real-World Example from E-commerce Plugin
```typescript
// Adding notes field to products collection
products: {
  productsCollectionOverride: ({ defaultCollection }) => ({
    ...defaultCollection,
    fields: [
      ...defaultCollection.fields,
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea' // Multi-line notes field
      }
    ]
  })
}
```

## Key Takeaways

1. **"textarea" is absolutely a valid field type** in Payload CMS
2. It is distinct from "text" and serves a different purpose (multi-line vs single-line)
3. Both store strings in the database, but render differently in the admin UI
4. Textarea has the unique `rows` admin option to control height
5. Common use cases: meta descriptions, notes, comments, longer text content
6. Documentation is located at: `docs/fields/textarea.mdx` in the Payload repository

## Validation

The field type is confirmed across multiple documentation sources:
- Field type overview (docs/fields/overview.mdx)
- Textarea-specific documentation (docs/fields/textarea.mdx)
- E-commerce plugin examples (docs/ecommerce/plugin.mdx)
- Multiple collection override examples showing real-world usage

## Sources

- Payload CMS via Context7 (payloadcms/payload)
- Version: latest
- Documentation: docs/fields/textarea.mdx, docs/fields/text.mdx, docs/fields/overview.mdx
