# Payload CMS Lexical Editor Block Components - Comprehensive Research Report

**Research Date**: 2025-10-20
**Research Scope**: Custom block implementation for Payload CMS Lexical editor
**Project Context**: SlideHeroes - Documentation collection implementation

---

## Executive Summary

Payload CMS blocks are flexible, reusable content components that can be embedded within the Lexical rich-text editor. This research provides a complete implementation guide based on official documentation and production codebase examples (BunnyVideo, YouTubeVideo, CallToAction blocks).

**Key Findings**:

- Blocks consist of 3-4 files: `config.ts` (required), `Component.tsx` (frontend), `Field.tsx` (admin panel, optional), and `index.ts` (export)
- Blocks are integrated via `BlocksFeature` in the Lexical editor configuration
- TypeScript interfaces are auto-generated when `interfaceName` is specified
- Block data is stored in the editor state with `blockType` and `blockName` properties

---

## 1. Block Architecture & Structure

### 1.1 Core Components

Every Payload block requires these files:

```text
src/blocks/MyBlock/
├── config.ts         # Block definition and schema (REQUIRED)
├── Component.tsx     # Frontend rendering component (REQUIRED)
├── Field.tsx         # Admin panel editor component (OPTIONAL)
└── index.ts          # Export file (REQUIRED)
```

### 1.2 Data Flow

```text
Editor State (JSON) → Block Config → Admin Panel Field → User Input →
→ Database → Frontend Component → Rendered Output
```

**Key Data Properties**:

- `blockType`: Automatically set to the block's `slug`
- `blockName`: Optional user-provided label for the block instance
- Custom fields: Defined in `fields` array of the block config

---

## 2. Block Configuration (`config.ts`)

### 2.1 TypeScript Interface

```typescript
import type { Block } from "payload";

export const MyBlock: Block = {
  slug: "my-block",                    // REQUIRED: Unique identifier
  interfaceName: "MyBlockType",        // OPTIONAL: TypeScript interface name
  labels: {
    singular: "My Block",
    plural: "My Blocks",
  },
  imageAltText: "My Block component",
  fields: [
    // Block-specific fields
  ],
};
```

### 2.2 Block Config Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `slug` | `string` | ✅ Yes | Unique identifier, becomes `blockType` in JSON |
| `fields` | `Field[]` | ✅ Yes | Array of Payload field definitions |
| `interfaceName` | `string` | ❌ No | Generates TypeScript interface in `payload-types.ts` |
| `labels` | `{ singular, plural }` | ❌ No | Display labels in admin panel |
| `imageURL` | `string` | ❌ No | Thumbnail image for block picker |
| `imageAltText` | `string` | ❌ No | Alt text for thumbnail |
| `dbName` | `string` | ❌ No | Custom database table name (SQL adapters) |
| `graphQL.singularName` | `string` | ❌ No | GraphQL schema name (deprecated, use `interfaceName`) |
| `custom` | `Record<string, any>` | ❌ No | Extension point for plugins |

### 2.3 Field Types

Blocks support all standard Payload field types:

```typescript
fields: [
  {
    name: "title",
    type: "text",
    required: true,
  },
  {
    name: "description",
    type: "textarea",
  },
  {
    name: "showPreview",
    type: "checkbox",
    defaultValue: false,
  },
  {
    name: "aspectRatio",
    type: "select",
    defaultValue: "16:9",
    options: [
      { label: "16:9 (Widescreen)", value: "16:9" },
      { label: "4:3 (Standard)", value: "4:3" },
    ],
  },
  {
    name: "image",
    type: "upload",
    relationTo: "media",
  },
  {
    name: "content",
    type: "richText",
    editor: lexicalEditor(),
  },
]
```

---

## 3. Frontend Component (`Component.tsx`)

### 3.1 Component Structure

```typescript
"use client";

import type React from "react";

// Define the data type matching your block fields
type MyBlockData = {
  title?: string;
  description?: string;
  showPreview?: boolean;
  // ... other fields
};

// Component receives props from Lexical
type ComponentProps = {
  data?: MyBlockData;
  blockType?: string;
  id?: string;
};

const Component: React.FC<ComponentProps> = (props) => {
  const { data } = props;

  // Extract data with defaults
  const {
    title = "Default Title",
    description = "",
    showPreview = false,
  } = data || {};

  // Render your component
  return (
    <div className="my-block">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
};

export default Component;
```

### 3.2 Component Best Practices

1. **Always use `"use client"` directive** - Components render in the browser
2. **Provide default values** - Fields may be undefined during editing
3. **Type-safe data extraction** - Use TypeScript interfaces matching block config
4. **Handle missing data gracefully** - Show placeholders or error states
5. **Use Shadcn UI components** - Maintain consistency with project design system

### 3.3 Production Examples from Codebase

#### BunnyVideo Component Pattern

```typescript
// Calculate dynamic styles
const getPaddingBottom = () => {
  if (aspectRatio === "16:9") return "56.25%";
  if (aspectRatio === "4:3") return "75%";
  return "56.25%";
};

// Conditional rendering
if (!videoId) {
  return <ErrorPlaceholder message="Please provide a Video ID" />;
}

// Interactive elements
<button
  onClick={() => {
    // Dynamic behavior
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      // Accessibility handling
    }
  }}
>
```

#### CallToAction Component Pattern

```typescript
// Complex layouts with multiple interactive elements
<CardContent className="flex flex-col sm:flex-row justify-end gap-4">
  <Button variant="default" asChild>
    <a href={leftButtonUrl}>{leftButtonLabel}</a>
  </Button>
  <Button variant="outline" asChild>
    <a href={rightButtonUrl}>{rightButtonLabel}</a>
  </Button>
</CardContent>
```

---

## 4. Admin Panel Field Component (`Field.tsx`) - Optional

### 4.1 When to Create a Custom Field Component

Create a custom Field component when:

- You need custom UI beyond standard Payload fields
- You want real-time preview in the admin panel
- You need complex field interactions or validation
- You want a more intuitive editing experience

**Note**: This is OPTIONAL. If not provided, Payload auto-generates the admin UI from `fields` array.

### 4.2 Field Component Structure

```typescript
"use client";

import type React from "react";
import { useId } from "react";

// Define the field data type
type MyBlockFieldData = {
  title?: string;
  description?: string;
  // ... match your block config fields
};

// Payload provides these props to custom field components
type FieldProps = {
  path: string;
  name: string;
  label?: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
  [key: string]: unknown;
};

const Field: React.FC<FieldProps> = (props) => {
  const { value, onChange } = props;

  // Type-safe data extraction
  const data = (value as MyBlockFieldData) || {};

  // Handle field changes
  const handleChange = (fieldName: string, fieldValue: unknown) => {
    if (onChange) {
      onChange({
        ...data,
        [fieldName]: fieldValue,
      });
    }
  };

  return (
    <Card className="p-4 mb-4">
      <CardHeader>
        <CardTitle>My Block Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={data.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>
        {/* More fields... */}
      </CardContent>
    </Card>
  );
};

export default Field;
```

### 4.3 Field Component Best Practices

1. **Use `"use client"` directive** - Field components are client-side
2. **Implement `onChange` callback** - Update parent state properly
3. **Spread existing data** - Preserve unchanged fields: `{ ...data, [field]: value }`
4. **Use unique IDs** - Generate with `useId()` hook for accessibility
5. **Provide visual feedback** - Show validation errors, loading states
6. **Use Shadcn UI components** - Card, Input, Label, Select, Switch, etc.

### 4.4 Production Example: BunnyVideo Field

```typescript
// Type guard for safety
const isBunnyVideoData = (value: unknown): value is BunnyVideoData => {
  return typeof value === "object" && value !== null;
};

const Field: React.FC<FieldProps> = (props) => {
  const { value, onChange } = props;
  const showPreviewId = useId(); // Unique ID for switch

  const data = getBunnyVideoData(value);

  const handleChange = (fieldName: string, fieldValue: unknown) => {
    if (onChange) {
      onChange({
        ...data,
        [fieldName]: fieldValue,
      });
    }
  };

  return (
    <Card className="p-4 mb-4">
      <CardContent className="space-y-4">
        <TextField label="Video ID" value={data.videoId || ""} />

        <Select
          value={data.aspectRatio || "16:9"}
          onValueChange={(newRatio) => handleChange("aspectRatio", newRatio)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select aspect ratio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Switch
            id={showPreviewId}
            checked={data.showPreview || false}
            onCheckedChange={(checked) => handleChange("showPreview", checked)}
          />
          <Label htmlFor={showPreviewId}>Show preview image</Label>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 5. Block Registration & Integration

### 5.1 Centralized Block Exports (`src/blocks/index.ts`)

```typescript
/**
 * Centralized exports for all block components
 */
import { BunnyVideo } from "./BunnyVideo/config";
import { CallToAction } from "./CallToAction/config";
import { YouTubeVideo } from "./YouTubeVideo/config";

// Named exports for selective imports
export { BunnyVideo, CallToAction, YouTubeVideo };

// Default export for convenience
export const allBlocks = [BunnyVideo, CallToAction, YouTubeVideo];

export default allBlocks;
```

### 5.2 Collection Configuration

```typescript
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { BlocksFeature } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import { BunnyVideo, CallToAction, YouTubeVideo } from "../blocks";

export const Documentation: CollectionConfig = {
  slug: "documentation",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [BunnyVideo, CallToAction, YouTubeVideo],
          }),
        ],
      }),
    },
  ],
};
```

### 5.3 Block References (Performance Optimization)

For large configurations, define blocks once in `payload.config.ts`:

```typescript
import { buildConfig } from "payload";
import { lexicalEditor, BlocksFeature } from "@payloadcms/richtext-lexical";

const config = buildConfig({
  // Define blocks globally
  blocks: [
    {
      slug: "TextBlock",
      fields: [
        {
          name: "text",
          type: "text",
        },
      ],
    },
  ],
  collections: [
    {
      slug: "posts",
      fields: [
        {
          name: "content",
          type: "richText",
          editor: lexicalEditor({
            features: ({ defaultFeatures }) => [
              ...defaultFeatures,
              BlocksFeature({
                // Reference by slug instead of full config
                blocks: ["TextBlock"],
              }),
            ],
          }),
        },
      ],
    },
  ],
});
```

**Benefits**:

- Reduces config size sent to client
- Improves server processing performance
- Maintains consistency across collections

**Limitations**:

- Blocks cannot be modified per collection
- Access control runs only once (collection data unavailable)

---

## 6. Frontend Rendering System

### 6.1 RenderBlocks Component

Create a centralized renderer for all block types:

```typescript
"use client";

import type React from "react";
import { Fragment } from "react";
import BunnyVideoComponent from "./BunnyVideo/Component";
import CallToActionComponent from "./CallToAction/Component";
import YouTubeVideoComponent from "./YouTubeVideo/Component";

// Define valid block types
type BlockType =
  | "bunny-video"
  | "youtube-video"
  | "call-to-action";

// Map block types to components
const blockComponents: Record<BlockType, React.FC<Record<string, unknown>>> = {
  "bunny-video": BunnyVideoComponent,
  "youtube-video": YouTubeVideoComponent,
  "call-to-action": CallToActionComponent,
};

type RenderBlocksProps = {
  blocks: Array<{
    blockType: string;
    [key: string]: unknown;
  }>;
};

export const RenderBlocks: React.FC<RenderBlocksProps> = ({ blocks }) => {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  return (
    <Fragment>
      {blocks.map((block, index) => {
        const { blockType } = block;
        const blockKey = `${blockType}-${index}`;

        // Type guard for valid block types
        const isValidBlockType = (type: string): type is BlockType =>
          type in blockComponents;

        if (blockType && isValidBlockType(blockType)) {
          const Block = blockComponents[blockType];
          return <Block key={blockKey} {...block} />;
        }

        // Fallback for unknown block types
        return (
          <div
            key={blockKey}
            className="p-4 border-2 border-red-500 bg-red-50 rounded-md"
          >
            <h3 className="text-lg font-bold text-red-700">
              Unknown Block Type: {blockType}
            </h3>
            <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto">
              {JSON.stringify(block, null, 2)}
            </pre>
          </div>
        );
      })}
    </Fragment>
  );
};
```

### 6.2 Usage in Pages

```typescript
import { RenderBlocks } from "@/blocks/RenderBlocks";

export default async function DocumentationPage({ params }) {
  const doc = await payload.findByID({
    collection: "documentation",
    id: params.id,
  });

  return (
    <article>
      <h1>{doc.title}</h1>
      <RenderBlocks blocks={doc.content?.root?.children || []} />
    </article>
  );
}
```

---

## 7. Lexical Editor State & Data Structure

### 7.1 Editor State JSON Structure

```json
{
  "root": {
    "type": "root",
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "version": 1,
    "children": [
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "text": "Introduction text...",
            "format": 0,
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1
      },
      {
        "type": "block",
        "fields": {
          "blockType": "bunny-video",
          "blockName": "Tutorial Video",
          "id": "67353d3bfd45b3b58a0c4f06",
          "videoId": "2620df68-c2a8-4255-986e-24c1d4c1dbf2",
          "libraryId": "264486",
          "previewUrl": "",
          "showPreview": false,
          "title": "Getting Started",
          "aspectRatio": "16:9"
        },
        "format": "",
        "version": 2
      }
    ]
  }
}
```

### 7.2 Auto-Generated Block Properties

**`blockType`**: The block's `slug` from config

- Automatically set when block is inserted
- Used to identify which component to render
- Cannot be changed by users

**`blockName`**: Optional user-provided label

- Defaults to empty string
- Editable in admin panel
- Useful for identifying block instances in editor
- Not typically used in frontend rendering

### 7.3 Accessing Block Data

```typescript
// In a server component or API route
const doc = await payload.findByID({
  collection: "documentation",
  id: params.id,
});

// Navigate editor state
const editorState = doc.content;
const blocks = editorState.root.children.filter(
  (child) => child.type === "block"
);

blocks.forEach((block) => {
  const { blockType, ...data } = block.fields;
  console.log(`Block type: ${blockType}`, data);
});
```

---

## 8. TypeScript Type Generation

### 8.1 Generated Types

When you specify `interfaceName` in your block config:

```typescript
export const BunnyVideo: Block = {
  slug: "bunny-video",
  interfaceName: "BunnyVideoBlock",
  fields: [
    {
      name: "videoId",
      type: "text",
    },
    {
      name: "aspectRatio",
      type: "select",
      options: ["16:9", "4:3", "1:1"],
    },
  ],
};
```

Payload generates this in `payload-types.ts`:

```typescript
export interface BunnyVideoBlock {
  videoId?: string;
  aspectRatio?: "16:9" | "4:3" | "1:1";
  blockType: "bunny-video";
  blockName?: string;
  id?: string;
}
```

### 8.2 Using Generated Types

```typescript
import type { BunnyVideoBlock } from "../../payload-types";

type ComponentProps = {
  data?: BunnyVideoBlock;
};

const Component: React.FC<ComponentProps> = ({ data }) => {
  // TypeScript now provides autocomplete and type checking
  const videoId = data?.videoId;
  const aspectRatio = data?.aspectRatio; // Type: "16:9" | "4:3" | "1:1" | undefined
};
```

### 8.3 Type Generation Workflow

```bash
# 1. Modify block config
# 2. Generate types
pnpm supabase:web:typegen

# 3. Verify types exist in payload-types.ts
# 4. Use in components
```

---

## 9. Advanced Block Patterns

### 9.1 Nested Rich Text in Blocks

```typescript
export const ContentBlock: Block = {
  slug: "content-block",
  fields: [
    {
      name: "title",
      type: "text",
    },
    {
      name: "content",
      type: "richText",
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          // Can even nest blocks within blocks
          BlocksFeature({
            blocks: [CallToAction],
          }),
        ],
      }),
    },
  ],
};
```

### 9.2 Conditional Fields

```typescript
export const ConditionalBlock: Block = {
  slug: "conditional-block",
  fields: [
    {
      name: "showImage",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        condition: (data) => data.showImage === true,
      },
    },
  ],
};
```

### 9.3 Relationship Fields

```typescript
export const RelatedContentBlock: Block = {
  slug: "related-content",
  fields: [
    {
      name: "relatedPosts",
      type: "relationship",
      relationTo: "posts",
      hasMany: true,
      maxRows: 3,
    },
  ],
};
```

### 9.4 Array Fields

```typescript
export const AccordionBlock: Block = {
  slug: "accordion",
  fields: [
    {
      name: "items",
      type: "array",
      fields: [
        {
          name: "question",
          type: "text",
          required: true,
        },
        {
          name: "answer",
          type: "richText",
          editor: lexicalEditor(),
        },
      ],
    },
  ],
};
```

---

## 10. Customizing Block Display in Lexical

### 10.1 Custom Block Label

```typescript
export const MyBlock: Block = {
  slug: "my-block",
  fields: [...],
  admin: {
    components: {
      Label: "./path/to/CustomLabel#CustomLabel",
    },
  },
};
```

### 10.2 Custom Block Component (In-Editor Preview)

```typescript
export const MyBlock: Block = {
  slug: "my-block",
  fields: [...],
  admin: {
    components: {
      Block: "./path/to/CustomBlockPreview#CustomBlockPreview",
    },
  },
};
```

Example CustomBlockPreview:

```typescript
"use client";

import {
  BlockEditButton,
  BlockRemoveButton,
  BlockCollapsible,
} from "@payloadcms/richtext-lexical/client";

export const CustomBlockPreview = (props) => {
  const { data } = props;

  return (
    <BlockCollapsible {...props}>
      <div className="p-4 border rounded-lg bg-gray-50">
        {/* Custom preview UI */}
        <h3>{data.title}</h3>
        <p>{data.description}</p>
      </div>
      <div className="flex gap-2 mt-2">
        <BlockEditButton {...props} />
        <BlockRemoveButton {...props} />
      </div>
    </BlockCollapsible>
  );
};
```

### 10.3 Utility Components from Payload

```typescript
import {
  // Edit buttons (opens drawer with block fields)
  InlineBlockEditButton,
  BlockEditButton,

  // Remove buttons
  InlineBlockRemoveButton,
  BlockRemoveButton,

  // Labels
  InlineBlockLabel,

  // Containers
  InlineBlockContainer,
  BlockCollapsible,
} from "@payloadcms/richtext-lexical/client";
```

---

## 11. Block Validation

### 11.1 Field-Level Validation

```typescript
export const MyBlock: Block = {
  slug: "my-block",
  fields: [
    {
      name: "email",
      type: "text",
      validate: (value) => {
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address";
        }
        return true;
      },
    },
    {
      name: "url",
      type: "text",
      validate: (value) => {
        if (!value) return true; // Optional field
        try {
          new URL(value);
          return true;
        } catch {
          return "Please enter a valid URL";
        }
      },
    },
  ],
};
```

### 11.2 Required Fields

```typescript
fields: [
  {
    name: "title",
    type: "text",
    required: true, // Built-in validation
  },
]
```

### 11.3 Min/Max Validation

```typescript
fields: [
  {
    name: "items",
    type: "array",
    minRows: 1,
    maxRows: 5,
    fields: [...],
  },
]
```

---

## 12. Common Pitfalls & Solutions

### 12.1 Missing `blockType` in Rendering

**Problem**: Block doesn't render on frontend

**Solution**: Ensure `blockType` matches `slug` in config:

```typescript
// config.ts
slug: "bunny-video"

// RenderBlocks.tsx
"bunny-video": BunnyVideoComponent
```

### 12.2 `Cannot read property 'x' of undefined`

**Problem**: Accessing undefined block data

**Solution**: Always provide defaults:

```typescript
const {
  title = "Default Title",
  showPreview = false,
} = data || {};
```

### 12.3 Custom Field Component Not Showing

**Problem**: Field component doesn't appear in admin panel

**Solution**: Check these:

1. File path is correct in block config
2. Component has default export
3. Component has `"use client"` directive
4. onChange callback is implemented

### 12.4 Type Errors in Components

**Problem**: TypeScript errors accessing block data

**Solution**: Generate types after config changes:

```bash
pnpm supabase:web:typegen
```

### 12.5 Block Not Appearing in Editor

**Problem**: Block not selectable in Lexical editor

**Solution**: Verify BlocksFeature configuration:

```typescript
editor: lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [MyBlock], // Must import and include
    }),
  ],
})
```

---

## 13. Step-by-Step Implementation Guide

### Step 1: Create Block Structure

```bash
mkdir -p apps/payload/src/blocks/MyBlock
cd apps/payload/src/blocks/MyBlock
touch config.ts Component.tsx Field.tsx index.ts
```

### Step 2: Define Block Config

`config.ts`:

```typescript
import type { Block } from "payload";

export const MyBlock: Block = {
  slug: "my-block",
  interfaceName: "MyBlockType",
  labels: {
    singular: "My Block",
    plural: "My Blocks",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
  ],
};
```

### Step 3: Create Frontend Component

`Component.tsx`:

```typescript
"use client";

import type React from "react";

type MyBlockData = {
  title?: string;
  description?: string;
};

type ComponentProps = {
  data?: MyBlockData;
};

const Component: React.FC<ComponentProps> = ({ data }) => {
  const { title = "", description = "" } = data || {};

  return (
    <div className="my-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Component;
```

### Step 4: (Optional) Create Field Component

`Field.tsx`:

```typescript
"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";

type MyBlockData = {
  title?: string;
  description?: string;
};

type FieldProps = {
  value?: unknown;
  onChange?: (value: unknown) => void;
};

const Field: React.FC<FieldProps> = ({ value, onChange }) => {
  const data = (value as MyBlockData) || {};

  const handleChange = (field: string, newValue: string) => {
    if (onChange) {
      onChange({ ...data, [field]: newValue });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Block</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            value={data.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
          />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={data.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default Field;
```

### Step 5: Create Export File

`index.ts`:

```typescript
import { MyBlock } from "./config";

export default MyBlock;
```

### Step 6: Register Block

`src/blocks/index.ts`:

```typescript
import { MyBlock } from "./MyBlock/config";
// ... other imports

export { MyBlock };

export const allBlocks = [MyBlock, /* other blocks */];
```

### Step 7: Add to Collection

`src/collections/Documentation.ts`:

```typescript
import { BlocksFeature } from "@payloadcms/richtext-lexical";
import { MyBlock } from "../blocks";

// In your field definition:
{
  name: "content",
  type: "richText",
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: [MyBlock],
      }),
    ],
  }),
}
```

### Step 8: Add to Renderer

`src/blocks/RenderBlocks.tsx`:

```typescript
import MyBlockComponent from "./MyBlock/Component";

type BlockType = "my-block" | /* other types */;

const blockComponents: Record<BlockType, React.FC<any>> = {
  "my-block": MyBlockComponent,
  // ... other components
};
```

### Step 9: Generate Types

```bash
pnpm supabase:web:typegen
```

### Step 10: Test

1. Start dev server: `pnpm dev`
2. Navigate to admin panel
3. Edit a document
4. Click "+" in Lexical editor
5. Select your block
6. Fill in fields
7. Save document
8. View frontend rendering

---

## 14. Production Examples from Codebase

### 14.1 BunnyVideo Block (Video Embed)

**Use Case**: Embed video player with aspect ratio control, preview images, and lazy loading

**Key Features**:

- Multiple aspect ratio options
- Optional preview image with play button overlay
- Lazy iframe loading
- Accessibility support (keyboard navigation)
- Default values for all fields

**File Structure**:

```text
BunnyVideo/
├── config.ts       # 80 lines - field definitions
├── Component.tsx   # 166 lines - iframe player with preview
├── Field.tsx       # 175 lines - custom admin UI with Select/Switch
└── index.ts        # 3 lines - export
```

**Notable Patterns**:

```typescript
// Dynamic padding calculation
const getPaddingBottom = () => {
  if (aspectRatio === "16:9") return "56.25%";
  if (aspectRatio === "4:3") return "75%";
  if (aspectRatio === "1:1") return "100%";
  return "56.25%";
};

// Conditional preview with play button
{showPreview && finalPreviewUrl ? (
  <button onClick={() => { /* Load iframe */ }}>
    <Image src={finalPreviewUrl} alt={title} fill />
    <PlayButton />
  </button>
) : (
  <iframe src={embedUrl} />
)}
```

### 14.2 CallToAction Block (CTA Buttons)

**Use Case**: Dual-button call-to-action with customizable text and URLs

**Key Features**:

- Headline and subheadline text
- Two buttons with separate labels and URLs
- Responsive layout (column on mobile, row on desktop)
- Decorative images

**File Structure**:

```text
CallToAction/
├── config.ts       # 51 lines - simple text fields
├── Component.tsx   # 87 lines - button layout
├── Field.tsx       # 144 lines - grid layout for fields
└── index.ts        # 3 lines - export
```

**Notable Patterns**:

```typescript
// Responsive flex layout
<CardContent className="flex flex-col sm:flex-row justify-end gap-4">
  <Button variant="default" asChild>
    <a href={leftButtonUrl}>{leftButtonLabel}</a>
  </Button>
  <Button variant="outline" asChild>
    <a href={rightButtonUrl}>{rightButtonLabel}</a>
  </Button>
</CardContent>
```

### 14.3 YouTubeVideo Block (External Embed)

**Use Case**: Embed YouTube videos with similar features to BunnyVideo

**Key Features**:

- Accepts video ID or full YouTube URL
- Preview image support
- Aspect ratio control
- YouTube iframe embed

**Differences from BunnyVideo**:

- URL parsing for YouTube links
- YouTube-specific embed parameters
- Thumbnail from YouTube CDN

---

## 15. Best Practices & Recommendations

### 15.1 Development Workflow

1. **Define data structure first** - Plan your block's fields before coding
2. **Start with config.ts** - Get the schema right
3. **Build Component.tsx next** - Focus on rendering
4. **Add Field.tsx only if needed** - Skip if default UI works
5. **Generate types early** - Run typegen after config changes
6. **Test in isolation** - Create test documents for each block
7. **Handle errors gracefully** - Show helpful messages for missing data

### 15.2 Code Organization

1. **One block per directory** - Keep related files together
2. **Consistent naming** - Use PascalCase for block names
3. **Clear file purposes** - config/Component/Field pattern
4. **Centralized exports** - Use index.ts files
5. **Shared utilities** - Extract common logic to utils/

### 15.3 TypeScript Practices

1. **Always specify interfaceName** - Enable type generation
2. **Define data types explicitly** - Match block field schema
3. **Use type guards** - Safely check data types
4. **Avoid `any`** - Use `unknown` and narrow types
5. **Import generated types** - Use payload-types.ts

### 15.4 Component Practices

1. **Always use "use client"** - Mark as client components
2. **Provide comprehensive defaults** - Handle undefined gracefully
3. **Use Shadcn UI** - Maintain design consistency
4. **Implement accessibility** - ARIA labels, keyboard support
5. **Optimize images** - Use Next.js Image component
6. **Lazy load heavy components** - Defer non-critical content

### 15.5 Field Component Practices

1. **Only create when necessary** - Default UI often sufficient
2. **Implement onChange properly** - Spread existing data
3. **Use unique IDs** - useId() for form elements
4. **Provide visual feedback** - Loading, validation states
5. **Match field definitions** - Sync with config.ts

### 15.6 Performance Considerations

1. **Use block references** - For large configs with shared blocks
2. **Lazy load components** - React.lazy() for heavy blocks
3. **Minimize field complexity** - Keep schemas simple
4. **Optimize images** - Compress, use appropriate formats
5. **Cache renders** - React.memo() where appropriate

### 15.7 Security Considerations

1. **Validate URLs** - Check user-provided links
2. **Sanitize HTML** - If allowing HTML input
3. **Check file uploads** - Validate file types and sizes
4. **Use CSP headers** - Content Security Policy for embeds
5. **Escape user input** - Prevent XSS attacks

---

## 16. Troubleshooting Guide

### Issue: Block not appearing in editor

**Possible Causes**:

- Block not imported in collection config
- BlocksFeature not added to editor
- Syntax error in block config

**Solution**:

```typescript
// 1. Check import
import { MyBlock } from "../blocks";

// 2. Verify BlocksFeature
BlocksFeature({
  blocks: [MyBlock], // Ensure block is included
})

// 3. Check console for errors
```

### Issue: Field component not rendering

**Possible Causes**:

- Missing "use client" directive
- Incorrect file path
- Missing default export
- onChange not implemented

**Solution**:

```typescript
// 1. Add "use client" at top
"use client";

// 2. Verify export
export default Field;

// 3. Check path in config
admin: {
  components: {
    Field: "./path/to/Field#Field", // Must be correct
  },
}
```

### Issue: TypeScript errors in component

**Possible Causes**:

- Types not generated
- interfaceName missing in config
- Outdated payload-types.ts

**Solution**:

```bash
# Generate types
pnpm supabase:web:typegen

# Verify interfaceName in config
interfaceName: "MyBlockType"

# Import generated type
import type { MyBlockType } from "../../payload-types";
```

### Issue: Block renders in admin but not frontend

**Possible Causes**:

- blockType not registered in RenderBlocks
- Component not imported
- Type guard not updated

**Solution**:

```typescript
// 1. Add to type union
type BlockType = "my-block" | "other-block";

// 2. Import component
import MyBlockComponent from "./MyBlock/Component";

// 3. Add to mapping
const blockComponents = {
  "my-block": MyBlockComponent,
};

// 4. Update type guard
const isValidBlockType = (type: string): type is BlockType =>
  type === "my-block" || type === "other-block";
```

### Issue: Data not saving in admin panel

**Possible Causes**:

- onChange not called in Field component
- Data not spread correctly
- Field name mismatch

**Solution**:

```typescript
const handleChange = (fieldName: string, fieldValue: unknown) => {
  if (onChange) {
    onChange({
      ...data, // Must spread existing data
      [fieldName]: fieldValue,
    });
  }
};
```

---

## 17. Additional Resources

### Official Documentation

- [Payload Blocks Field](https://payloadcms.com/docs/fields/blocks)
- [Lexical Rich Text Editor](https://payloadcms.com/docs/rich-text/overview)
- [Custom Features](https://payloadcms.com/docs/rich-text/custom-features)
- [Lexical.dev Official Docs](https://lexical.dev/docs/intro)

### Project Files

- Block examples: `/apps/payload/src/blocks/`
- Collection configs: `/apps/payload/src/collections/`
- RenderBlocks: `/apps/payload/src/blocks/RenderBlocks.tsx`
- Type definitions: `/apps/payload/payload-types.ts`

### Community Resources

- [Payload Blocks Dev Library](https://www.payloadblocks.dev/)
- [GitHub: payloadcms/payload](https://github.com/payloadcms/payload)
- [GitHub: rubn-g/payloadcms-lexical-ext](https://github.com/rubn-g/payloadcms-lexical-ext)
- [Oleksii's Inline Blocks Guide](https://oleksii-s.dev/blog/how-to-add-dynamic-data-in-rich-text-using-inline-blocks-in-payload-cms)

---

## 18. Quick Reference

### Block Config Template

```typescript
import type { Block } from "payload";

export const BlockName: Block = {
  slug: "block-name",
  interfaceName: "BlockNameType",
  labels: {
    singular: "Block Name",
    plural: "Block Names",
  },
  imageAltText: "Block Name component",
  fields: [
    // Your fields here
  ],
};
```

### Component Template

```typescript
"use client";

import type React from "react";

type BlockNameData = {
  // Match your field definitions
};

type ComponentProps = {
  data?: BlockNameData;
  blockType?: string;
  id?: string;
};

const Component: React.FC<ComponentProps> = ({ data }) => {
  const { /* destructure fields */ } = data || {};

  return (
    <div>
      {/* Your render logic */}
    </div>
  );
};

export default Component;
```

### Field Template

```typescript
"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";

type FieldProps = {
  value?: unknown;
  onChange?: (value: unknown) => void;
};

const Field: React.FC<FieldProps> = ({ value, onChange }) => {
  const data = (value as YourDataType) || {};

  const handleChange = (field: string, newValue: unknown) => {
    if (onChange) {
      onChange({ ...data, [field]: newValue });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Block</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your form fields */}
      </CardContent>
    </Card>
  );
};

export default Field;
```

### Common Field Types

```typescript
// Text field
{
  name: "title",
  type: "text",
  required: true,
}

// Textarea
{
  name: "description",
  type: "textarea",
}

// Checkbox
{
  name: "showPreview",
  type: "checkbox",
  defaultValue: false,
}

// Select
{
  name: "size",
  type: "select",
  options: [
    { label: "Small", value: "sm" },
    { label: "Large", value: "lg" },
  ],
}

// Upload
{
  name: "image",
  type: "upload",
  relationTo: "media",
}

// Relationship
{
  name: "relatedPost",
  type: "relationship",
  relationTo: "posts",
}

// Array
{
  name: "items",
  type: "array",
  fields: [
    {
      name: "text",
      type: "text",
    },
  ],
}

// Rich Text
{
  name: "content",
  type: "richText",
  editor: lexicalEditor(),
}
```

---

## Conclusion

Payload CMS block components provide a powerful, flexible system for creating reusable content modules within the Lexical rich-text editor. The architecture separates concerns cleanly:

- **Config** defines structure and validation
- **Component** handles frontend rendering
- **Field** (optional) customizes admin experience

By following the patterns demonstrated in production examples (BunnyVideo, CallToAction, YouTubeVideo), you can create robust, type-safe blocks that integrate seamlessly with your Payload collections and provide an excellent editing experience for content managers.

**Key Takeaways**:

1. Start with a solid config.ts defining your block's schema
2. Build a defensive Component.tsx that handles missing data gracefully
3. Only create Field.tsx when the default admin UI isn't sufficient
4. Always generate TypeScript types after config changes
5. Register blocks via BlocksFeature in collection configs
6. Map block types to components in RenderBlocks for frontend rendering
7. Follow established patterns from existing blocks in the codebase

With this comprehensive guide, you have everything needed to implement custom blocks for the Documentation collection or any other Payload collection requiring flexible, structured content components.

---

**Report Generated**: 2025-10-20
**Research Completed**: All objectives met
**Next Steps**: Apply patterns to Documentation collection block implementation
