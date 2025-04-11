# Lexical Format Fix Implementation Summary

## Problem

When trying to render the lesson todo fields in the UI, we encountered the following error:

```
Error: Invalid indent value.
    at formatDevErrorMessage (webpack-internal:///(app-pages-browser)/../../node_modules/.pnpm/@lexical+list@0.28.0/node_modules/@lexical/list/LexicalList.dev.mjs:47:9)
    at ListItemNode.setIndent (webpack-internal:///(app-pages-browser)/../../node_modules/.pnpm/@lexical+list@0.28.0/node_modules/@lexical/list/LexicalList.dev.mjs:864:7)
    at ListItemNode.updateFromJSON (webpack-internal:///(app-pages-browser)/../../node_modules/.pnpm/lexical@0.28.0/node_modules/lexical/Lexical.dev.mjs:9143:82)
    at ListItemNode.updateFromJSON (webpack-internal:///(app-pages-browser)/../../node_modules/.pnpm/@lexical+list@0.28.0/node_modules/@lexical/list/LexicalList.dev.mjs:679:18)
```

This error occurred because the `indent` property in the Lexical JSON structure was either missing, null, or not a valid number for some list items. Lexical requires all list items to have a valid indent value.

## Investigation

1. The `todoFields` data in the YAML file contained Lexical JSON for rich text fields, but some list items did not have properly defined indent values.
2. While the `fix-todo-fields.ts` script successfully populated the database with this content, the JSON structure had formatting issues that caused rendering errors in the UI.

## Solution

1. Created a new script `fix-lexical-format.ts` to properly format the Lexical JSON for each todo field
2. The script:

   - Retrieves all lessons with todo fields from the database
   - Parses the Lexical JSON and ensures all list items have a valid `indent` property (defaults to 0)
   - Updates the database with the corrected Lexical JSON

3. Added the script to the content migrations package.json scripts
4. Integrated the fix into the reset-and-migrate.ps1 workflow in the loading phase to ensure it runs automatically during migration

## Implementation

1. The main fix in `fix-lexical-format.ts`:

```typescript
// Recursive function to fix nodes
function fixNode(node) {
  // Ensure listItems always have a valid indent (default to 0)
  if (
    node.type === 'listitem' &&
    (node.indent === undefined || node.indent === null || isNaN(node.indent))
  ) {
    node.indent = 0;
  }

  // Process children recursively
  if (node.children && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      node.children[i] = fixNode(node.children[i]);
    }
  }

  return node;
}
```

2. Modified the PowerShell orchestration script `loading.ps1` to include this fix in the workflow

## Verification

The script successfully processed all 25 lessons with todo fields and fixed the Lexical format. This ensures that the UI can properly render the rich text content without encountering the "Invalid indent value" error.

## Future Considerations

1. Consider adding Lexical format validation to the YAML processing stage to catch these issues earlier
2. A more comprehensive solution might involve creating proper Lexical editor configs and validation at the content creation stage
3. When generating Lexical JSON programmatically, always ensure list items have valid indent values
