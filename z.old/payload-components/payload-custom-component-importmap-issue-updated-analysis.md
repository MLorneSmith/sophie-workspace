# Payload CMS Custom Component ImportMap Issue - Updated Analysis

## The Issue

We've encountered a persistent issue with custom components in the Payload CMS Lexical editor. The issue manifests as a "Catch-22" situation where:

**Scenario 1: Editable But Can't View Saved Content**

- When the importMap is configured WITHOUT the entry `"./Component#default": BunnyVideoComponent`
- ✅ The input card renders properly in the editor, allowing users to add/edit components
- ❌ When trying to load saved content containing component nodes, we get the error: `Error: getFromImportMap: PayloadComponent not found in importMap {key: "./Component#default"...}`

**Scenario 2: Can View Saved Content But Can't Edit**

- When the importMap is configured WITH the entry `"./Component#default": BunnyVideoComponent`
- ✅ Saved content with component nodes loads without errors
- ❌ The input card no longer displays in the editor, making it impossible to add/edit new components

This issue affects all three custom components: BunnyVideo, CallToAction, and TestBlock.

## What We Have Tried (Unsuccessful Approaches)

1. **Multiple importMap Variations**:

   - Added various slug-based mappings: `'bunny-video/Component#default'`, etc.
   - Added path variations with different prefixes: `'./bunny-video/Component#default'`, `'blocks/BunnyVideo/Component#default'`
   - Added component mappings with block types: `'./Component#bunny-video'`
   - Added simplified mappings: `'bunny-video'`, `'bunny-video#default'`, etc.

2. **Component Wrapper Approach**:

   - Created wrapper components that can dynamically handle both editing and viewing modes
   - Updated block definitions to use these wrapper components
   - Regenerated the importMap

3. **Universal Root Component**:

   - Created a central Component.tsx that imports all individual components
   - Detects the block type from various prop structures
   - Routes to the appropriate component based on block type
   - Provides detailed debugging information for unknown block types

4. **Enhanced Component Structure**:

   - Updated components to handle various prop structures (`value`, `data`, or direct props)
   - Added detailed console logging to help diagnose issues
   - Simplified components to focus on rendering rather than data manipulation
   - Ensured consistent export patterns for maximum compatibility

5. **Comprehensive ImportMap Configuration**:
   - Manually updated the importMap to include all necessary component paths and exports
   - Added multiple path patterns to ensure compatibility with Payload's resolution system

## Latest Error Messages

After our most recent attempts, we're still encountering Scenario 2 errors, but with more detailed information:

```
Unknown block type: undefined
Available data keys: field, path, permissions, readOnly, schemaPath

{
  "field": {
    "name": "_components",
    "type": "ui",
    "admin": {}
  },
  "path": "_components",
  "permissions": true,
  "readOnly": false,
  "SchemaPath": "posts.content.lexical_internal_feature.blocks.lexical_blocks.custom-call-to-action.fields._components"
}
```

This error message reveals that the component is receiving UI field props rather than the expected block data props.

## Analysis

The error messages and our testing reveal several key insights:

1. **Different Component Rendering Contexts**:

   - Payload CMS uses different component rendering contexts for editing vs. viewing modes
   - In editing mode, components receive UI field props related to the schema structure
   - In viewing mode, components receive the actual block data

2. **Component Resolution Path Differences**:

   - During editing, Payload uses the block registration path from `index.ts -> admin.components.Block`
   - When loading saved content, Payload looks for a component at the path `"./Component#default"`

3. **Schema Structure Insights**:

   - The `SchemaPath` in the error reveals the internal structure: `posts.content.lexical_internal_feature.blocks.lexical_blocks.custom-call-to-action.fields._components`
   - This suggests components are nested deeply inside the lexical editor structure
   - The `_components` field name indicates a special UI field type used for component rendering

4. **Payload 3.29.0 Specifics**:
   - The issue appears to be specific to how Payload 3.29.0 handles component resolution
   - The importMap generation process in Payload can be sensitive to certain import structures

## Root Cause Diagnosis

Based on our analysis, we've identified the root cause as a **dual component resolution system** in Payload CMS 3.29.0:

1. **UI Field Component Resolution**:

   - During editing, Payload renders components as UI fields with specific props
   - These components are resolved using the path specified in `admin.components.Block`
   - They receive UI field props including schema information

2. **Block Data Component Resolution**:

   - When viewing saved content, Payload renders components with the actual block data
   - These components are resolved using a fixed path pattern `"./Component#default"`
   - They receive the block data directly

3. **ImportMap Conflict**:

   - The importMap can only map `"./Component#default"` to a single component
   - When multiple components need this same mapping, a conflict occurs
   - This is a fundamental limitation in how Payload's component resolution system works

4. **Schema Path Mismatch**:
   - The actual schema path used internally (`lexical_internal_feature.blocks.lexical_blocks.custom-call-to-action.fields._components`) doesn't match the paths we've been using in our importMap

## Recommended Way Forward

Based on our diagnosis, we recommend a two-pronged approach:

### 1. Create Specialized UI Field Components

Create components specifically designed to handle UI field props:

```tsx
// apps/payload/src/UiFieldComponent.tsx
'use client';

import React from 'react';

import BunnyVideoComponent from './blocks/BunnyVideo/Component';
import CallToActionComponent from './blocks/CallToAction/Component';
import TestBlockComponent from './blocks/TestBlock/Component';

// apps/payload/src/UiFieldComponent.tsx

type UiFieldProps = {
  field: {
    name: string;
    type: string;
    admin: any;
  };
  path: string;
  permissions: boolean;
  readOnly: boolean;
  SchemaPath?: string;
};

const UiFieldComponent: React.FC<UiFieldProps> = (props) => {
  console.log('UiField Component received props:', props);

  // Extract block type from schema path
  const schemaPath = props.SchemaPath || '';
  const blockMatch = schemaPath.match(/lexical_blocks\.([^.]+)\.fields/);
  const blockType = blockMatch ? blockMatch[1] : '';

  // Render appropriate component based on block type
  switch (blockType) {
    case 'bunny-video':
      return <BunnyVideoComponent {...props} />;
    case 'custom-call-to-action':
      return <CallToActionComponent {...props} />;
    case 'test-block':
      return <TestBlockComponent {...props} />;
    default:
      return <div>Unknown block type: {blockType}</div>;
  }
};

export default UiFieldComponent;
```

### 2. Update Component Props Handling

Update each component to handle both UI field props and regular data props:

```tsx
const BunnyVideoComponent: React.FC<any> = (props) => {
  console.log('BunnyVideo received props:', props);

  // Check if we're receiving UI field props or data props
  if (props.field && props.path) {
    // UI Field rendering (editing mode)
    return <EditModeUI {...props} />;
  } else {
    // Data rendering (viewing mode)
    const value = props.value || props.data || props;
    return <ViewModeUI data={value} />;
  }
};
```

### 3. Register Components with Exact Schema Paths

Update the importMap to include the exact schema paths that Payload is using internally:

```javascript
{
  // UI Field component registration
  "lexical_internal_feature.blocks.lexical_blocks.bunny-video.fields._components#Component": BunnyVideoComponent,
  "lexical_internal_feature.blocks.lexical_blocks.custom-call-to-action.fields._components#Component": CallToActionComponent,
  "lexical_internal_feature.blocks.lexical_blocks.test-block.fields._components#Component": TestBlockComponent,

  // Root UI Field handler
  "_components#Component": UiFieldComponent,

  // Standard component registration for viewing mode
  "./Component#default": UniversalComponent
}
```

### 4. Consider Payload Version Update

If the above approaches don't fully resolve the issue, consider:

1. Checking if there are any Payload CMS updates beyond 3.29.0 that address this issue
2. Reviewing the Payload CMS GitHub issues and discussions for similar problems and solutions
3. Reaching out to the Payload CMS community or support for guidance

### 5. Alternative Approach: Custom Blocks Feature

As a last resort, implement a more specialized version of the BlocksFeature that handles component resolution differently:

```typescript
// CustomBlocksFeature.ts
import { BlocksFeature as OriginalBlocksFeature } from '@payloadcms/richtext-lexical';

export const CustomBlocksFeature = ({ blocks }) => {
  // Enhanced implementation with better component resolution
  return OriginalBlocksFeature({
    blocks,
    // Additional options to fix resolution
  });
};
```

## Implementation Plan

1. Create the UiFieldComponent to handle UI field props
2. Update each component to handle both UI field and data props
3. Update the importMap with the exact schema paths
4. Test both editing and viewing scenarios
5. If issues persist, investigate Payload version updates or community solutions
6. Document the final solution for future reference

This comprehensive approach addresses both the editing and viewing contexts, and should resolve the "Catch-22" situation we've been experiencing.
