# Payload CMS Custom Component ImportMap Issue - Solution

## Issue Summary

We encountered a persistent issue with custom components in the Payload CMS Lexical editor, which manifested as a "Catch-22" situation:

**Scenario 1: Editable But Can't View Saved Content**

- When the importMap is configured WITHOUT the entry `"./Component#default": BunnyVideoComponent`
- ✅ The input card renders properly in the editor, allowing users to add/edit components
- ❌ When trying to load saved content containing component nodes, we get the error: `Error: getFromImportMap: PayloadComponent not found in importMap {key: "./Component#default"...}`

**Scenario 2: Can View Saved Content But Can't Edit**

- When the importMap is configured WITH the entry `"./Component#default": BunnyVideoComponent`
- ✅ Saved content with component nodes loads without errors
- ❌ The input card no longer displays in the editor, making it impossible to add/edit new components

## Solution Implemented

After extensive investigation and testing, we've successfully implemented a solution that resolves both scenarios. Here's what we did:

### 1. Fixed \_components Field Handling

The key insight was that the `_components` field is a special field that Payload uses to render the input card for block attributes. We were incorrectly trying to render our custom component for this field, but Payload expects to handle it itself.

```tsx
// Special handling for _components field which is part of the block input UI
if (props.field.name === '_components') {
  console.log('Found _components field - this is a block input wrapper')

  // Extract block type from schemaPath which contains the full path
  const schemaPath = props.schemaPath || props.SchemaPath || ''
  console.log('Full SchemaPath:', schemaPath)

  // For _components field, we should return null to let Payload handle the rendering
  // This allows Payload to render the input card for the block's attributes
  console.log('Returning null for _components field to let Payload handle it')
  return null
}
```

By returning null for the `_components` field, we allow Payload to handle the rendering of the input card, which fixes Scenario 2.

### 2. Fixed Case Sensitivity Issue

We discovered that Payload passes the schema path property as `schemaPath` (lowercase 's'), but our code was expecting `SchemaPath` (uppercase 'S'). We updated our code to handle both casing variants:

```tsx
// Extract block type from schemaPath which contains the full path
const schemaPath = props.schemaPath || props.SchemaPath || '';
```

### 3. Enhanced Block Type Detection

We implemented multiple strategies to extract the block type from the schemaPath:

```tsx
// Pattern 1: Exact format from logs
const exactMatch = schemaPath.match(
  /blocks\.lexical_blocks\.([^.]+)\.fields\._components$/,
);
if (exactMatch && exactMatch[1]) {
  blockType = exactMatch[1];
  console.log('Matched exact pattern:', blockType);
}

// Pattern 2: Original pattern
if (!blockType) {
  const blockTypeMatch = schemaPath.match(/lexical_blocks\.([^.]+)\.fields/);
  if (blockTypeMatch && blockTypeMatch[1]) {
    blockType = blockTypeMatch[1];
    console.log('Matched original pattern:', blockType);
  }
}

// Additional fallback patterns...
```

### 4. Created Debug Block Component

We created a DebugBlock component that displays detailed information about the props it receives. This helps diagnose issues with component resolution and provides a fallback for unknown block types.

### 5. Fixed Front-end Error

We created the missing `client-api.ts` file in the packages/cms/payload/src/api directory with inline type definitions. This resolved the "Module not found" error in the web app.

### 6. Enhanced afterStartupHook

We improved the afterStartupHook to better handle importMap enhancement:

```typescript
export const afterStartupHook = async (payload: Payload) => {
  console.log('========================================');
  console.log('Running afterStartupHook to enhance importMap...');
  console.log('========================================');
  const importMapPath = path.resolve(
    __dirname,
    '../app/(payload)/admin/importMap.js',
  );

  if (fs.existsSync(importMapPath)) {
    console.log('ImportMap file found at:', importMapPath);
    let importMapContent = fs.readFileSync(importMapPath, 'utf8');

    // Log the current importMap content for debugging
    console.log(
      'Current importMap content (first 500 chars):',
      importMapContent.substring(0, 500),
    );

    // Check for existing component mappings
    const hasBunnyVideo = importMapContent.includes(
      './blocks/BunnyVideo/Component',
    );
    const hasCallToAction = importMapContent.includes(
      './blocks/CallToAction/Component',
    );
    const hasTestBlock = importMapContent.includes(
      './blocks/TestBlock/Component',
    );
    const hasDebugBlock = importMapContent.includes(
      './blocks/DebugBlock/Component',
    );

    // Add component mappings if needed...
  }
};
```

## Testing Results

After implementing these changes:

1. **Payload Admin UI**:

   - ✅ Input cards for block attributes now display correctly
   - ✅ Users can add and edit custom components
   - ✅ Saved content with custom components loads without errors

2. **Web App**:
   - ✅ Custom components render correctly
   - ✅ No console errors related to missing modules

## Key Insights

1. **\_components Field Handling**:

   - The `_components` field is a special field that Payload uses to render the input card for block attributes
   - We should return null for this field to let Payload handle the rendering

2. **Case Sensitivity Matters**:

   - Payload passes the schema path property as `schemaPath` (lowercase 's')
   - Our code was expecting `SchemaPath` (uppercase 'S')
   - We need to handle both casing variants

3. **SchemaPath Format**:

   - The SchemaPath follows a specific format: `posts.content.lexical_internal_feature.blocks.lexical_blocks.custom-call-to-action.fields._components`
   - We need to use regex patterns to extract the block type from this path

4. **Front-end Integration**:
   - The web app expects certain files and types to be available
   - Missing files can cause "Module not found" errors
   - We need to create these files with appropriate content

## Future Recommendations

1. **Clean Up Debug Logging**:

   - Once everything is working correctly, consider removing or conditionally enabling debug logging

2. **Document Component Structure**:

   - Create clear documentation for how custom components should be structured
   - Include examples of handling both editing and viewing modes

3. **Consider Payload Version Updates**:

   - Keep an eye on Payload CMS updates that might address these issues
   - Test with newer versions when available

4. **Automated Testing**:
   - Add automated tests for component resolution
   - Test both editing and viewing modes
   - Test with different block types

This solution ensures that both the Payload admin UI and the web app can properly handle custom Lexical editor components.
