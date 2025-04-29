# Canvas Outline Tab - Implementation Plan

## Executive Summary

The Canvas Editor's Outline tab is designed to provide a consolidated view of content from other tabs (Situation, Complication, Answer) and allow users to edit this combined view. We've encountered several issues with this feature:

1. **Missing Content**: The outline wasn't including bullet points and nested structures from the source tabs
2. **Reset Button Failure**: The Reset Outline button wasn't properly regenerating content
3. **ProseMirror Model Conflicts**: Editing the outline content causes errors related to ProseMirror model versions

After analyzing multiple approaches, we've selected a Content Normalization Pipeline as our implementation strategy to resolve these issues while maintaining full editing capabilities for the outline tab.

## Problem Analysis

### Issue 1: Missing List Content

The outline generation process wasn't properly including bullet lists and nested structures from the source tabs, particularly from the Answer tab. This was due to a restrictive content filtering function that only preserved paragraphs and headings with direct text content.

**Root Cause**: The `hasValidText` function only checked for paragraphs and headings, ignoring list structures.

### Issue 2: Reset Button Functionality

When clicking the Reset Outline button, the outline would not properly regenerate with the latest content from the source tabs.

**Root Cause**: The invalidation of React Query cache wasn't sufficient to trigger a full refresh of the component, and the component wasn't properly remounting with the latest data.

### Issue 3: ProseMirror Model Conflicts

When attempting to edit content in the outline tab, users encounter this error:

```
RangeError: Can not convert <> to a Fragment (looks like multiple versions of prosemirror-model were loaded)
    at Fragment.from (http://localhost:3000/_next/static/chunks/node_modules__pnpm_5bb9fb08._.js:3384:15)
    at NodeType.create (http://localhost:3000/_next/static/chunks/node_modules__pnpm_5bb9fb08._.js:5021:66)
    at NodeContext.finish (http://localhost:3000/_next/static/chunks/node_modules__pnpm_5bb9fb08._.js:2475:38)
    at ParseContext.finish (http://localhost:3000/_next/static/chunks/node_modules__pnpm_5bb9fb08._.js:2733:30)
    at DOMParser.parse (http://localhost:3000/_next/static/chunks/node_modules__pnpm_5bb9fb08._.js:2300:24)
```

**Root Cause**: The error indicates that multiple versions of the ProseMirror model are being used simultaneously, which causes conflicts in the editor. This occurs because the outline content is a combination of content from different sources, and the ProseMirror instances might not be properly isolated.

## Solution Options

We evaluated four potential approaches:

### Option 1: Separate Editor Instance

Create a specialized editor instance specifically for the outline tab, with its own ProseMirror configuration.

**Pros:**

- Clean separation between content creation and outline viewing
- Prevents model conflicts by design

**Cons:**

- Code duplication
- Additional maintenance burden

### Option 2: Custom DOM Handlers

Implement specialized DOM event handlers for the outline editor to intercept problematic operations.

**Pros:**

- Maintains single editor architecture
- Targeted fix for specific errors

**Cons:**

- Requires deep ProseMirror knowledge
- Potentially brittle solution

### Option 3: Different Schema

Define a separate ProseMirror schema specifically for outline content.

**Pros:**

- Strong schema integrity
- Forward-compatible

**Cons:**

- Complex implementation
- Requires significant schema design work

### Option 4: Content Normalization Pipeline

Create a processing layer that normalizes content before it reaches the editor to ensure compatibility.

**Pros:**

- Less invasive to editor components
- Centralized error handling
- Consistent experience across tabs
- More easily testable

**Cons:**

- Additional processing overhead
- Potential content fidelity issues

## Selected Approach: Content Normalization Pipeline

After evaluation, we've selected Option 4 (Content Normalization Pipeline) as our implementation strategy because it provides the best balance of maintainability, effectiveness, and development effort.

## Implementation Plan

### Phase 1: Core Normalization Module (2 days)

1. Create a new utility file `apps/web/app/home/(user)/ai/canvas/_lib/utils/normalize-editor-content.ts`
2. Implement the core normalization function:
   ```typescript
   export function normalizeEditorContent(
     content: any,
     sectionType: string,
   ): TiptapDocument {
     // Basic implementation with parsing and validation
   }
   ```
3. Add specialized normalization for outline content
4. Implement node structure normalization to fix common issues:
   - Empty text nodes
   - Properly structured list items
   - Valid paragraph content

### Phase 2: Schema Validation (1 day)

1. Create a schema validation utility:
   ```typescript
   function validateAgainstSchema(content: TiptapDocument): void {
     // Validate all nodes against ProseMirror schema
   }
   ```
2. Add error handling with fallback options
3. Implement logging for debugging

### Phase 3: Integration (2 days)

1. Integrate normalization at key points:
   - TiptapTabContent query functions
   - TiptapEditor initialization
   - Content update effects
   - Save operations
2. Add specialized handling for the outline section

### Phase 4: Error Handling Improvements (1 day)

1. Implement robust error recovery mechanisms
2. Add fallback content options
3. Enhance logging and debugging tools

### Phase 5: Testing and Refinement (2 days)

1. Create comprehensive tests for normalization logic
2. Test with various content types and structures
3. Refine normalization rules based on testing results
4. Document edge cases and solutions

## Detailed Implementation

### Core Normalization Functions

```typescript
// normalize-editor-content.ts
import { TiptapDocument, TiptapNode } from '../types';

export function normalizeEditorContent(
  content: any,
  sectionType: string,
): TiptapDocument {
  // Parse input content
  let parsedContent = parseContent(content);

  // Apply section-specific transformations
  if (sectionType === 'outline') {
    parsedContent = applyOutlineSpecificTransformations(parsedContent);
  }

  // Normalize all node structures
  parsedContent = normalizeNodeStructures(parsedContent);

  // Add source metadata
  parsedContent = addSourceMetadata(parsedContent, sectionType);

  // Validate (with safe fallback)
  try {
    validateAgainstSchema(parsedContent);
  } catch (error) {
    console.error('Schema validation failed:', error);
    // Use safe fallback content if validation fails
    return createSafeContent();
  }

  return parsedContent;
}

function parseContent(content: any): TiptapDocument {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse content JSON:', e);
      return createSafeContent();
    }
  }

  if (content && typeof content === 'object') {
    return JSON.parse(JSON.stringify(content)); // Deep clone
  }

  return createSafeContent();
}

function createSafeContent(): TiptapDocument {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: ' ' }],
      },
    ],
  };
}

function normalizeNodeStructures(content: TiptapDocument): TiptapDocument {
  // Deep clone
  const result = JSON.parse(JSON.stringify(content));

  function normalizeNode(node: TiptapNode): TiptapNode {
    // Fix empty text nodes
    if (node.type === 'text' && (!node.text || node.text === '')) {
      node.text = ' ';
    }

    // Fix paragraphs without content
    if (
      node.type === 'paragraph' &&
      (!node.content || node.content.length === 0)
    ) {
      node.content = [{ type: 'text', text: ' ' }];
    }

    // Fix list structures
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      if (!node.content || node.content.length === 0) {
        node.content = [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: ' ' }],
              },
            ],
          },
        ];
      } else {
        node.content = node.content.map((item) => {
          if (item.type !== 'listItem') {
            return {
              type: 'listItem',
              content: [item],
            };
          }
          return normalizeNode(item);
        });
      }
    }

    // Ensure listItems have paragraph content
    if (node.type === 'listItem') {
      if (!node.content || node.content.length === 0) {
        node.content = [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: ' ' }],
          },
        ];
      } else if (node.content[0].type !== 'paragraph') {
        node.content = [
          {
            type: 'paragraph',
            content: [node.content[0]],
          },
        ];
      }
    }

    // Recursively normalize content
    if (node.content && Array.isArray(node.content)) {
      node.content = node.content.map(normalizeNode);
    }

    return node;
  }

  if (result.content && Array.isArray(result.content)) {
    result.content = result.content.map(normalizeNode);
  }

  return result;
}

function addSourceMetadata(
  content: TiptapDocument,
  sectionType: string,
): TiptapDocument {
  // Add metadata at document level
  const result = {
    ...content,
    meta: { sectionType, timestamp: new Date().toISOString() },
  };
  return result;
}

function validateAgainstSchema(content: TiptapDocument): void {
  // Basic validation logic - to be expanded
  if (content.type !== 'doc') {
    throw new Error('Root node must be of type "doc"');
  }

  if (!content.content || !Array.isArray(content.content)) {
    throw new Error('Root node must have content array');
  }

  // Additional validation rules would be added here
}

function applyOutlineSpecificTransformations(
  content: TiptapDocument,
): TiptapDocument {
  // Special handling for outline content
  // This might involve restructuring, ensuring heading hierarchy, etc.
  return content;
}
```

### Integration Points

#### TiptapTabContent Integration

```typescript
// Modify in TiptapTabContent.tsx
import { normalizeEditorContent } from '../../_lib/utils/normalize-editor-content';

// In the query function
const { data: content } = useQuery({
  queryFn: async () => {
    // Existing code to fetch content
    const rawContent = data[sectionType];

    // Apply normalization
    return normalizeEditorContent(rawContent, sectionType);
  },
});

// When preparing editor content
let editorContent = '';
try {
  if (content) {
    // Apply normalization again before stringifying
    const normalized = normalizeEditorContent(content, sectionType);
    editorContent = JSON.stringify(normalized);
  } else {
    editorContent = JSON.stringify(EMPTY_EDITOR_STATE);
  }
} catch (e) {
  console.error('Error preparing editor content:', e);
  editorContent = JSON.stringify(EMPTY_EDITOR_STATE);
}
```

#### TiptapEditor Integration

```typescript
// Modify in TiptapEditor.tsx
import { normalizeEditorContent } from '../../_lib/utils/normalize-editor-content';

// In content parsing
const initialContent = useMemo(() => {
  try {
    if (typeof content !== 'string') {
      return normalizeEditorContent(content, sectionType);
    }

    const parsed = JSON.parse(content);
    return normalizeEditorContent(parsed, sectionType);
  } catch (e) {
    console.error('Failed to parse content:', e);
    return normalizeEditorContent(null, sectionType); // Will return safe default
  }
}, [content, sectionType]);

// In the editor update effect
useEffect(() => {
  if (!editor || !initialContent) return;

  try {
    const currentContent = editor.getJSON();
    const currentContentStr = JSON.stringify(currentContent);
    const normalizedContent = normalizeEditorContent(
      initialContent,
      sectionType,
    );
    const normalizedContentStr = JSON.stringify(normalizedContent);

    if (currentContentStr !== normalizedContentStr) {
      setTimeout(() => {
        if (editor) {
          editor.commands.clearContent();
          editor.commands.setContent(normalizedContent);
        }
      }, 0);
    }
  } catch (error) {
    console.error('Error in editor update effect:', error);
  }
}, [editor, initialContent, sectionType]);
```

#### Save Handling

```typescript
// In the save content function
const saveContent = useCallback(
  async (editorContent: any) => {
    try {
      setSaveStatus('saving');
      // Normalize before saving
      const normalizedContent = normalizeEditorContent(
        editorContent,
        sectionType,
      );
      await updateContent(normalizedContent);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveStatus('error');
    }
  },
  [updateContent, setSaveStatus, sectionType],
);
```

## Risk Mitigation

1. **Performance Concerns**

   - Monitor and profile normalization performance
   - Add memoization for expensive operations
   - Consider adding a worker for heavy normalization tasks

2. **Content Fidelity**

   - Maintain original content for comparison and debugging
   - Implement a way to recover original content if normalization causes issues

3. **User Experience**
   - Add clear error messages if normalization fails
   - Implement automatic recovery paths
   - Add user feedback mechanisms to report issues

## Success Metrics

1. Users can successfully view and edit outline content without errors
2. Reset Outline button properly regenerates the outline with all content
3. Bullet points and nested structures are preserved in the outline
4. No ProseMirror model conflict errors during editing

## Follow-up Improvements

1. **Performance Optimization**

   - Profile and optimize the normalization pipeline
   - Consider lazy loading or worker-based processing

2. **Enhanced Validation**

   - Add more sophisticated schema validation
   - Implement visual indicators for potentially problematic content

3. **UI Enhancements**
   - Add visual feedback during normalization processing
   - Improve error reporting and recovery UI

## Conclusion

The Content Normalization Pipeline approach provides a robust solution to the outline editing issues while maintaining the existing architecture. By normalizing content before it reaches the ProseMirror editor, we can prevent model conflicts and ensure a consistent editing experience across all tabs.

This implementation is designed to be maintainable, testable, and extensible, allowing us to refine the normalization rules as we encounter new edge cases.
