# Payload CMS Custom Component ImportMap Fix Plan - Revised

## Problem Overview

We're experiencing an issue with custom components in our Payload CMS implementation. The issue is related to the importMap generation process not correctly recognizing custom components.

### Current Issues

We have two conflicting scenarios:

1. **Scenario 1: Editable But Can't View Saved Content**

   - When the importMap is configured WITHOUT the entry `"./Component#default": TestComponent`
   - ✅ The input card renders properly in the editor, allowing users to add/edit the TestComponent
   - ❌ When trying to load saved content containing TestComponent nodes, we get the error:
     `Error: getFromImportMap: PayloadComponent not found in importMap {key: "./Component#default"...}`

2. **Scenario 2: Can View Saved Content But Can't Edit**
   - When the importMap is configured WITH the entry `"./Component#default": TestComponent`
   - ✅ Saved content with TestComponent nodes loads without errors
   - ❌ The input card no longer displays in the editor, making it impossible to add/edit new TestComponents

## Root Cause Analysis

After comparing our implementation with the reference implementation and reviewing Payload CMS documentation, we've identified the following issues:

1. **Custom ImportMap Manipulation**:

   - We're using an afterStartupHook to manually modify the importMap
   - This is overriding Payload's built-in component resolution mechanism

2. **SpecialFieldHandler Component**:

   - Our custom SpecialFieldHandler is interfering with Payload's handling of the `_components` field
   - It's always returning a TestBlockField component regardless of block type

3. **Component Structure**:

   - Our current approach using a universal component is creating conflicts in how components are resolved
   - The reference implementation uses a cleaner separation between config and component files

4. **Component Resolution**:
   - Payload uses different component resolution mechanisms for editing vs. viewing content
   - Our manual approach is breaking this built-in mechanism

## Implementation Plan

### Phase 1: Disable Custom ImportMap Manipulation

1. **Disable the afterStartupHook**

   - Modify `apps/payload/src/hooks/afterStartupHook.ts` to be a no-op function
   - This will prevent it from overwriting the importMap that Payload generates

2. **Remove any other custom importMap manipulation**
   - Check for any scripts that might be modifying the importMap
   - Disable or remove the `rebuild-importmap.js` script if it exists

### Phase 2: Remove SpecialFieldHandler

3. **Delete the SpecialFieldHandler component**

   - Remove `apps/payload/src/blocks/SpecialFieldHandler.tsx`
   - Remove any imports or references to it in other files

4. **Remove references to SpecialFieldHandler in importMap**
   - Ensure there are no mappings for `_components` field in the importMap

### Phase 3: Restructure Block Components

Restructure each custom block to follow the reference pattern with separate Component and config files:

#### 3.1. Create a New Block Structure for TestBlock

```
apps/payload/src/blocks/TestBlock/
├── Component.tsx (existing - keep)
├── Field.tsx (existing - keep)
├── config.ts (new file)
└── index.ts (modify)
```

The `config.ts` file will contain:

```typescript
import { Block } from 'payload';

export const TestBlock: Block = {
  slug: 'test-block',
  interfaceName: 'TestBlock', // Important for type generation
  labels: {
    singular: 'Test Block',
    plural: 'Test Blocks',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      defaultValue: 'Test Block',
    },
  ],
};
```

The `index.ts` file will be simplified to:

```typescript
import { TestBlock } from './config';

export default TestBlock;
```

#### 1.2. Create a New Block Structure for CallToAction

Follow the same pattern for CallToAction and other custom blocks.

### Phase 4: Create a RenderBlocks Component

Create a dedicated component for rendering blocks:

```typescript
'use client'

import React, { Fragment } from 'react'
import CallToActionComponent from './CallToAction/Component'
import TestBlockComponent from './TestBlock/Component'
import DebugBlockComponent from './DebugBlock/Component'

// Map block types to their respective components
const blockComponents = {
  'call-to-action': CallToActionComponent,
  'test-block': TestBlockComponent,
  'debug-block': DebugBlockComponent,
}

type RenderBlocksProps = {
  blocks: Array<{
    blockType: string
    [key: string]: any
  }>
}

export const RenderBlocks: React.FC<RenderBlocksProps> = ({ blocks }) => {
  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]
            return <Block key={index} {...block} />
          }

          // Fallback for unknown block types
          return (
            <div key={index} className="p-4 border-2 border-red-500 bg-red-50 rounded-md">
              <h3 className="text-lg font-bold text-red-700">Unknown Block Type: {blockType}</h3>
              <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(block, null, 2)}
              </pre>
            </div>
          )
        })}
      </Fragment>
    )
  }

  return null
}

export default RenderBlocks
```

### Phase 5: Update Payload Configuration

Update the Payload configuration to use the new block structure:

```typescript
import { postgresAdapter } from '@payloadcms/db-postgres';
import { payloadCloudPlugin } from '@payloadcms/payload-cloud';
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs';
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical';
import path from 'path';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Import block configs
import CallToAction from './blocks/CallToAction';
import DebugBlock from './blocks/DebugBlock';
import TestBlock from './blocks/TestBlock';
// Import collections
import { Documentation } from './collections/Documentation';
import { Media } from './collections/Media';
import { Posts } from './collections/Posts';
import { afterStartupHook } from './hooks/afterStartupHook';

// ... other imports

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    // Remove any custom importMap configuration here
    // Let Payload generate it automatically
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  // ... other config
  editor: lexicalEditor({
    // Global editor configuration with custom blocks
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: [CallToAction, TestBlock, DebugBlock],
      }),
    ],
  }),
  // ... rest of config
});
```

### Phase 6: Create a Clean Component System

Create a new root component that handles different content structures:

```typescript
'use client'

import React from 'react'
import RenderBlocks from './blocks/RenderBlocks'

/**
 * Root component that is mapped to "./Component#default" in the importMap
 * This component handles rendering blocks from the Lexical editor
 */
const Component: React.FC<any> = (props) => {
  // Log props for debugging
  console.log('Root Component received props:', props)

  // If this is a block, render it using RenderBlocks
  if (props.blockType) {
    return <RenderBlocks blocks={[props]} />
  }

  // If this is a collection of blocks, render them all
  if (props.blocks && Array.isArray(props.blocks)) {
    return <RenderBlocks blocks={props.blocks} />
  }

  // Fallback for unknown content
  return (
    <div className="p-4 border-2 border-yellow-500 bg-yellow-50 rounded-md">
      <h3 className="text-lg font-bold text-yellow-700">Unknown Content Structure</h3>
      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
        {JSON.stringify(props, null, 2)}
      </pre>
    </div>
  )
}

export default Component
```

### Phase 7: Regenerate the ImportMap

After making all these changes, regenerate the importMap:

```bash
cd apps/payload
npx payload generate:importmap
```

### Phase 8: Testing and Verification

Test both scenarios to ensure:

1. The input card renders properly in the editor
2. Saved content loads without errors

## Implementation Notes

1. **Key Changes**:

   - Separating block configuration from components
   - Creating a dedicated RenderBlocks component
   - Simplifying the root Component.tsx
   - Letting Payload generate the importMap automatically

2. **Why This Works**:

   - The clean separation of concerns prevents conflicts
   - The RenderBlocks component provides a consistent rendering system
   - The root Component handles different content structures
   - The automatic importMap generation ensures correct mappings

3. **Potential Issues**:
   - You may need to adjust the block slugs to match existing content
   - Some custom logic in the current UniversalComponent may need to be preserved
   - The importMap generation might need manual tweaking if automatic generation fails

## References

1. Reference implementation: `D:/SlideHeroes/App/repos/payload-website-reference`
2. Payload CMS documentation on importMap and custom components
