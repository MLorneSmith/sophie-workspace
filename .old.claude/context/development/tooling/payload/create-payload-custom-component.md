---
id: create-payload-custom-component
title: Creating Custom Components for Payload CMS
version: 2.0.0
category: implementation
description: Comprehensive guide for creating custom Payload CMS components with Lexical editor integration, TypeScript patterns, and best practices
tags: ["payload", "cms", "custom-components", "lexical", "blocks", "react", "typescript"]
dependencies: []
cross_references:
  - id: payload-configuration
    type: related
    description: Global Payload CMS configuration patterns
  - id: react-patterns
    type: prerequisite
    description: React component development patterns
created: 2025-01-05
last_updated: 2025-09-15
author: create-context
---

# Creating Custom Components for Payload CMS

## Overview

This guide provides comprehensive instructions for creating custom components for Payload CMS that integrate with the Lexical rich text editor. Payload uses a block-based architecture with TypeScript-first design, enabling modular content structures with automatic type generation and strong React integration.

## Key Concepts

### Block Architecture Foundation

Payload CMS blocks are TypeScript-defined configurations that generate both database schemas and React components. Each block automatically includes:

- **blockType**: References the block's slug for rendering decisions
- **blockName**: Optional editable label for admin UI organization
- **Fields Array**: Defines data structure and UI components
- **InterfaceName**: TypeScript interface generation target

### Component Separation Pattern

Payload maintains clear separation between:

- **Field Components**: Handle data input in admin UI
- **Rendering Components**: Display content to end users
- **Configuration**: Defines block structure and metadata

### TypeScript Integration

Payload automatically generates TypeScript interfaces from block configurations, providing type safety throughout the application.

## Implementation Details

### Directory Structure

Custom components should be organized in the following structure:

```
apps/payload/src/blocks/
  ├── YourCustomComponent/
  │   ├── config.ts          # Block configuration
  │   ├── index.ts           # Export file
  │   ├── Component.tsx      # React component for frontend rendering
  │   └── Field.tsx          # React component for admin UI input
```

## Step-by-Step Implementation

### Step 1: Create the Component Directory

```bash
mkdir -p apps/payload/src/blocks/YourCustomComponent
```

### Step 2: Create the Block Configuration

Create `config.ts` with the block definition:

```typescript
import type { Block } from "payload";

export const YourCustomComponent: Block = {
  slug: "your-custom-component", // Unique identifier
  interfaceName: "YourCustomComponentBlock", // TypeScript interface name
  labels: {
    singular: "Your Custom Component",
    plural: "Your Custom Components",
  },
  imageAltText: "Your Custom Component", // Alt text for admin UI
  fields: [
    {
      name: "text",
      type: "text",
      defaultValue: "Default Text",
      required: true,
      admin: {
        description: "Main text content for the component",
      },
    },
    {
      name: "alignment",
      type: "select",
      defaultValue: "left",
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
        { label: "Right", value: "right" },
      ],
      admin: {
        condition: (data) => data.showAlignment === true,
      },
    },
    // Add more fields as needed
  ],
};
```

### Step 3: Create the Frontend Component

Create `Component.tsx` for frontend rendering:

```typescript
"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

// Define the type matching your block fields
type YourComponentData = {
  text?: string;
  alignment?: "left" | "center" | "right";
  [key: string]: unknown;
};

// Component props from Lexical
type ComponentProps = {
  data?: YourComponentData;
  blockType?: string;
  id?: string;
};

const Component: React.FC<ComponentProps> = (props) => {
  const { data } = props;

  // Extract data with defaults
  const {
    text = "Default Text",
    alignment = "left"
  } = data || {};

  // Handle missing data gracefully
  if (!data) {
    return (
      <Card className="my-6">
        <CardContent>
          <p className="text-muted-foreground">No data provided</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Your Component</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-${alignment}`}>{text}</p>
      </CardContent>
    </Card>
  );
};

export default Component;
```

### Step 4: Create the Admin Field Component

Create `Field.tsx` for the admin UI:

```typescript
"use client";

import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Input } from "@kit/ui/input";
import { Label } from "@kit/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kit/ui/select";

type FieldProps = {
  path: string;
  name: string;
  label?: string;
  value?: Record<string, unknown>;
  onChange?: (value: Record<string, unknown>) => void;
  [key: string]: unknown;
};

const Field: React.FC<FieldProps> = (props) => {
  const { value = {}, onChange } = props;

  const handleChange = (fieldName: string, fieldValue: unknown) => {
    if (onChange) {
      onChange({
        ...value,
        [fieldName]: fieldValue,
      });
    }
  };

  return (
    <Card className="mb-4 p-4">
      <CardHeader>
        <CardTitle>Your Component</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Text</Label>
          <Input
            value={(value.text as string) || "Default Text"}
            onChange={(e) => handleChange("text", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Alignment</Label>
          <Select
            value={(value.alignment as string) || "left"}
            onValueChange={(val) => handleChange("alignment", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default Field;
```

### Step 5: Create the Index Export

Create `index.ts` to export the block:

```typescript
import { YourCustomComponent } from "./config";

export default YourCustomComponent;
```

### Step 6: Update RenderBlocks Component

Add your component to `apps/payload/src/blocks/RenderBlocks.tsx`:

```typescript
"use client";

import type React from "react";
import { Fragment } from "react";

// Import your component
import YourCustomComponent from "./YourCustomComponent/Component";
// ... other imports

// Add to BlockType union
type BlockType =
  | "call-to-action"
  | "test-block"
  | "your-custom-component" // Add your slug
  // ... other types

// Add to blockComponents mapping
const blockComponents: Record<BlockType, React.FC<Record<string, unknown>>> = {
  "call-to-action": CallToActionComponent,
  "test-block": TestBlockComponent,
  "your-custom-component": YourCustomComponent, // Add mapping
  // ... other mappings
};

// Update type guard
const isValidBlockType = (type: string): type is BlockType =>
  type === "call-to-action" ||
  type === "test-block" ||
  type === "your-custom-component" || // Add check
  // ... other checks
```

### Step 7: Export from Blocks Index

Add to `apps/payload/src/blocks/index.ts`:

```typescript
import { YourCustomComponent } from "./YourCustomComponent/config";
// ... other imports

export {
  YourCustomComponent,
  // ... other exports
};

export const allBlocks = [
  YourCustomComponent,
  // ... other blocks
];
```

### Step 8: Register in Collections

Add your block to collections that should support it:

```typescript
// apps/payload/src/collections/Posts.ts
import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import { YourCustomComponent } from "../blocks";

export const Posts: CollectionConfig = {
  // ... configuration
  fields: [
    {
      name: "content",
      type: "richText",
      required: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [YourCustomComponent, /* other blocks */],
          }),
        ],
      }),
    },
  ],
};
```

### Step 9: Generate ImportMap

```bash
cd apps/payload
npx payload generate:importmap
```

### Step 10: Restart Development Server

```bash
cd apps/payload
pnpm dev:clean
```

## Code Examples

### Advanced Block with Conditional Logic

```typescript
export const AdvancedBlock: Block = {
  slug: "advanced-block",
  interfaceName: "AdvancedBlock",
  fields: [
    {
      name: "type",
      type: "select",
      options: [
        { label: "Simple", value: "simple" },
        { label: "Advanced", value: "advanced" },
      ],
    },
    {
      name: "advancedOptions",
      type: "group",
      admin: {
        condition: (data) => data.type === "advanced",
      },
      fields: [
        {
          name: "complexity",
          type: "number",
          min: 1,
          max: 10,
        },
      ],
    },
  ],
};
```

### Custom Validation Example

```typescript
{
  name: "slug",
  type: "text",
  validate: (val, args) => {
    if (!val?.match(/^[a-z0-9-]+$/)) {
      return args.t("validation:invalidSlugFormat");
    }
    return true;
  },
}
```

### Responsive Component Pattern

```typescript
const Component: React.FC<ComponentProps> = ({ data }) => {
  const getPaddingBottom = () => {
    const { aspectRatio = "16:9" } = data || {};
    if (aspectRatio === "16:9") return "56.25%";
    if (aspectRatio === "4:3") return "75%";
    if (aspectRatio === "1:1") return "100%";
    return "56.25%";
  };

  return (
    <div className="relative" style={{ paddingBottom: getPaddingBottom() }}>
      {/* Responsive content */}
    </div>
  );
};
```

## Related Files

Based on repository analysis, these files demonstrate the patterns:

- `/apps/payload/src/blocks/BunnyVideo/`: Complete video component implementation
- `/apps/payload/src/blocks/YouTubeVideo/`: YouTube integration example
- `/apps/payload/src/blocks/RenderBlocks.tsx`: Block rendering orchestration
- `/apps/payload/src/blocks/index.ts`: Centralized block exports
- `/apps/payload/src/collections/Posts.ts`: Collection integration pattern

## Common Patterns

### Field Type Mappings

```typescript
// Text fields
{ name: "title", type: "text", required: true }

// Select with options
{
  name: "size",
  type: "select",
  options: [
    { label: "Small", value: "sm" },
    { label: "Large", value: "lg" }
  ]
}

// Relationships
{
  name: "author",
  type: "relationship",
  relationTo: "users",
  hasMany: false
}

// Media uploads
{
  name: "image",
  type: "upload",
  relationTo: "media"
}

// Rich text
{
  name: "content",
  type: "richText",
  editor: lexicalEditor()
}
```

### Error Handling Pattern

```typescript
const Component: React.FC<ComponentProps> = ({ data }) => {
  if (!data || !data.requiredField) {
    return (
      <Card className="my-6">
        <CardContent>
          <p className="text-gray-500">Missing required data</p>
        </CardContent>
      </Card>
    );
  }

  // Normal rendering
};
```

## Troubleshooting

### Block Not Appearing in Editor

1. **Check RenderBlocks**: Verify component is registered with correct slug
2. **Collection Registration**: Ensure BlocksFeature includes your block
3. **ImportMap**: Regenerate with `npx payload generate:importmap`
4. **Server Restart**: Use `pnpm dev:clean` for clean restart
5. **Console Errors**: Check browser console for registration errors

### TypeScript Errors

1. **Interface Generation**: Run `pnpm payload generate:types`
2. **Type Imports**: Use `import type { Block } from "payload"`
3. **Component Props**: Match field types exactly in component interfaces

### Rendering Issues

1. **Data Structure**: Log props to verify data shape
2. **Default Values**: Always provide defaults for optional fields
3. **Client Directive**: Ensure `"use client"` for interactive components
4. **Import Paths**: Verify all imports resolve correctly

### Field Component Problems

1. **onChange Handler**: Must update entire value object
2. **Value Types**: Cast values appropriately (e.g., `value.text as string`)
3. **Controlled Components**: Always provide value and onChange

## Performance Optimization

### Bundle Size Management

- Use dynamic imports for large components
- Tree-shake unused block features
- Optimize media assets with proper sizing

### Query Optimization

```typescript
{
  name: "relatedPosts",
  type: "relationship",
  relationTo: "posts",
  hasMany: true,
  maxDepth: 1, // Limit query depth
  maxRows: 5,   // Limit results
}
```

### Lazy Loading Pattern

```typescript
const LazyComponent = dynamic(
  () => import("./HeavyComponent"),
  { loading: () => <div>Loading...</div> }
);
```

## Security Considerations

### Input Validation

- Always validate user input on both client and server
- Use Zod schemas for runtime validation
- Sanitize HTML content before rendering

### Access Control

```typescript
export const SecureBlock: Block = {
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => user?.role === "admin",
  },
  // ... fields
};
```

## See Also

- [[payload-configuration]]: Global Payload CMS configuration
- [[lexical-editor]]: Lexical rich text editor integration
- [[react-server-components]]: RSC patterns for Payload
- [[typescript-patterns]]: TypeScript best practices
- [[field-validation]]: Comprehensive validation strategies
