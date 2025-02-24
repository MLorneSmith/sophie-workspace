# Lexical Editor Format Preservation Optimization

## Problem Statement

The Lexical editor in our Canvas document editor is experiencing two critical issues:

1. **Format Preservation Issue**: When formatting is applied at the beginning of the content and then the tab is switched, the content disappears when returning to the tab. The undo button functionality does not restore the content.

2. **Performance Issue**: The initial solution with multiple format preservation plugins caused the canvas editor pane to hang, eventually making the page unresponsive.

## Root Cause Analysis

### Format Preservation Issue

The root cause of the format preservation issue is related to how Lexical handles state serialization, format preservation, and state restoration when switching between tabs:

1. **State Serialization/Deserialization**: When switching tabs, Lexical needs to serialize the editor state to JSON, store it, and then deserialize it when returning to the tab. During this process, format information can be lost, especially for formatting at the beginning of content.

2. **Format Attribute Handling**: Lexical's default serialization doesn't always preserve all format attributes, particularly when they're applied at the beginning of content or when the content structure is complex.

3. **Tab Context Switching**: The issue is exacerbated when switching between tabs because the editor state is completely replaced, and any format information not properly serialized is lost.

### Performance Issue

The performance issues with the initial solution were caused by:

1. **Multiple Format Preservation Plugins**: The implementation used several plugins that performed redundant operations and caused excessive re-renders:

   - FormatValidationPlugin
   - FormatUpdatePlugin
   - TextFormatPreservationPlugin
   - ElementFormatPreservationPlugin
   - FormatClipboardPlugin
   - RestoreStatePlugin

2. **Recursive Node Processing**: The node processing functions in multiple places caused performance bottlenecks:

   - In the initialContent function
   - In the saveContent function
   - In the state recovery mechanism

3. **Inefficient State Management**: Frequent cloning of editor states, redundant format processing, and excessive state updates triggered too many re-renders.

4. **Debounce Issues**: The debounced save queued too many operations without proper cancellation.

5. **Memory Leaks**: The singleton pattern used in FormatStateManager and FormatHistory caused memory accumulation.

## Proposed Solution: Hybrid Approach

We propose a hybrid approach that addresses the format preservation issues without introducing significant performance overhead:

### 1. Single Focused FormatPreservationPlugin

Instead of using multiple plugins, we'll implement a single focused plugin that specifically addresses the format preservation issue:

- Registers a node transform for TextNodes to store format information
- Uses an update listener to restore formats when needed
- Only processes nodes with format changes to minimize overhead

### 2. Enhanced Serialization/Deserialization

We'll create utility functions to enhance the serialization and deserialization process:

- `processNodeForSerialization`: Ensures format attributes are properly preserved
- `enhanceEditorStateForSerialization`: Enhances the editor state JSON for serialization
- `parseAndEnhanceContent`: Parses and enhances content for initialization or restoration

### 3. Tab-Switch Handling

We'll implement specific handling for tab switches:

- Save the current tab's state with enhanced format preservation
- Restore the new tab's state with format awareness
- Use the serialization utilities to ensure format preservation

## Implementation Plan

### 1. Create Format Serialization Utilities

File: `apps/web/app/home/(user)/ai/canvas/_components/editor/utils/format-serialization.ts`

```typescript
/**
 * Processes a node to ensure format attributes are properly preserved
 * during serialization/deserialization.
 */
export function processNodeForSerialization(node: any): any {
  // Skip processing if node is null or undefined
  if (!node) return node;

  // Create a new object with essential properties
  const processed = {
    ...node,
    // Ensure format is preserved (default to 0 if undefined)
    format: node.format ?? 0,
    // Ensure direction is set (default to 'ltr' if undefined)
    direction: node.direction || 'ltr',
    // Ensure indent is set (default to 0 if undefined)
    indent: typeof node.indent === 'number' ? node.indent : 0,
    // Preserve type (default to 'paragraph' for non-root nodes)
    type: node.type || (node === node.root ? 'root' : 'paragraph'),
    // Ensure version is set
    version: node.version || 1,
  };

  // Process children if they exist
  if (Array.isArray(node.children)) {
    processed.children = node.children.map(processNodeForSerialization);
  }

  return processed;
}

/**
 * Enhances an editor state JSON object to ensure format preservation
 * during serialization.
 */
export function enhanceEditorStateForSerialization(stateJSON: any): any {
  // Skip processing if stateJSON is null, undefined, or doesn't have a root
  if (!stateJSON || !stateJSON.root) return stateJSON;

  // Create a new object with the root processed
  return {
    ...stateJSON,
    root: {
      ...stateJSON.root,
      // Process root children
      children: Array.isArray(stateJSON.root.children)
        ? stateJSON.root.children.map(processNodeForSerialization)
        : [],
      // Ensure root properties are set
      direction: stateJSON.root.direction || 'ltr',
      format: stateJSON.root.format || '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };
}

/**
 * Parses and enhances content for initialization or restoration.
 */
export function parseAndEnhanceContent(
  content: string | null | undefined,
): string {
  if (!content) {
    // Return default editor state if content is empty
    return JSON.stringify({
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: '',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    });
  }

  try {
    // Parse content if it's a string
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;

    // Enhance the parsed content
    const enhanced = enhanceEditorStateForSerialization(parsed);

    // Return stringified enhanced content
    return JSON.stringify(enhanced);
  } catch (e) {
    console.error('Failed to parse content:', e);
    // Return default editor state if parsing fails
    return JSON.stringify({
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: '',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    });
  }
}
```

### 2. Create Focused FormatPreservationPlugin

File: `apps/web/app/home/(user)/ai/canvas/_components/editor/plugins/format-preservation.plugin.tsx`

```tsx
'use client';

import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isElementNode, $isTextNode, TextNode } from 'lexical';

export function FormatPreservationPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Register a node transform specifically for TextNodes
    const removeTransform = editor.registerNodeTransform(
      TextNode,
      (textNode) => {
        if (!textNode.isAttached()) return;

        // Get the current format state
        const format = textNode.getFormat();

        // Only process if there's a format to preserve
        if (format !== 0) {
          // Store the format in a node attribute that will be serialized
          const writableNode = textNode.getWritable();
          writableNode.__format = format;
        }
      },
    );

    // Register an update listener to handle format restoration
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        let hasFormatChanges = false;

        // Check if there are any format changes to process
        editorState.read(() => {
          const root = $getRoot();
          const processNode = (node) => {
            if ($isTextNode(node)) {
              // If the node has a stored format, ensure it's applied
              if (
                node.__format !== undefined &&
                node.getFormat() !== node.__format
              ) {
                hasFormatChanges = true;
              }
            }

            if ($isElementNode(node)) {
              node.getChildren().forEach(processNode);
            }
          };

          root.getChildren().forEach(processNode);
        });

        // Only trigger an update if there are format changes to apply
        if (hasFormatChanges) {
          editor.update(() => {
            const root = $getRoot();
            const applyFormats = (node) => {
              if ($isTextNode(node)) {
                // If the node has a stored format, apply it
                if (node.__format !== undefined) {
                  node.setFormat(node.__format);
                }
              }

              if ($isElementNode(node)) {
                node.getChildren().forEach(applyFormats);
              }
            };

            root.getChildren().forEach(applyFormats);
          });
        }
      },
    );

    return () => {
      removeTransform();
      removeUpdateListener();
    };
  }, [editor]);

  return null;
}
```

### 3. Update LexicalEditor Component

Modify: `apps/web/app/home/(user)/ai/canvas/_components/editor/lexical-editor.tsx`

Key changes:

1. Import the new plugin and utilities:

```tsx
import { FormatPreservationPlugin } from './plugins/format-preservation.plugin';
import {
  enhanceEditorStateForSerialization,
  parseAndEnhanceContent,
} from './utils/format-serialization';
```

2. Replace the existing initialContent function:

```tsx
const initialContent = useCallback(() => {
  return parseAndEnhanceContent(content);
}, [content]);
```

3. Modify the saveContent function:

```tsx
const saveContent = useCallback(
  async (editorState: EditorState) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Clone the state to prevent modification during serialization
        const editorStateClone = editorState.clone();
        const editorStateJSON = editorStateClone.toJSON();

        // Enhance the state JSON for serialization
        const enhancedStateJSON =
          enhanceEditorStateForSerialization(editorStateJSON);

        // Call updateContent with the enhanced state
        updateContent(enhancedStateJSON, {
          onSuccess: () => resolve(),
          onError: (error) => {
            console.error('Failed to save content:', error);
            reject(error);
          },
        });
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        console.error('Error serializing editor state:', err);
        reject(err);
      }
    });
  },
  [sectionType, updateContent],
);
```

4. Update the LexicalComposer component to include only the necessary plugins:

```tsx
return (
  <LexicalComposer
    initialConfig={initialConfig}
    key={`${submissionId}-${sectionType}`}
  >
    {props.isLoading && (
      <div className="bg-background/80 absolute inset-0 z-50 backdrop-blur-sm">
        <LoadingAnimation messageIndex={0} />
      </div>
    )}
    <EditorRefPlugin editorRef={editorRef} />
    <OnChangePlugin onChange={onChange} />
    <KeyboardEventHandler />

    {/* Add only the focused format preservation plugin */}
    <FormatPreservationPlugin />

    <div className="editor-shell relative flex h-full flex-col rounded-lg border">
      <ToolbarPlugin />
      <div className="flex-1 p-4">
        <RichTextPlugin
          contentEditable={
            <div className="h-full">
              <ContentEditable className="h-full outline-none" />
            </div>
          }
          placeholder={
            <div className="pointer-events-none absolute top-[1.125rem] text-gray-400 select-none">
              Enter your content...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      <HistoryPlugin />
      <ListPlugin />
    </div>
  </LexicalComposer>
);
```

### 4. Implement Tab-Switch Handling

If the tab switching is handled in a parent component, update it to use the format serialization utilities:

```tsx
// Import the format serialization utilities
import {
  enhanceEditorStateForSerialization,
  parseAndEnhanceContent,
} from './_components/editor/utils/format-serialization';

// Handle tab switching with format preservation
const handleTabChange = async (
  newTab: 'situation' | 'complication' | 'answer' | 'outline',
) => {
  // Save current tab's state with enhanced format preservation
  if (editorRef.current) {
    try {
      const currentState = editorRef.current.getEditorState();
      const stateJSON = currentState.toJSON();

      // Enhance the state JSON for serialization
      const enhancedStateJSON = enhanceEditorStateForSerialization(stateJSON);

      // Store the enhanced state
      editorStates.current[activeTab] = JSON.stringify(enhancedStateJSON);

      // Save to database if needed
      await saveTabContent(activeTab, editorStates.current[activeTab]);
    } catch (error) {
      console.error('Error saving tab state:', error);
    }
  }

  // Switch to new tab
  setActiveTab(newTab);

  // Restore new tab's state with format awareness
  if (editorRef.current && editorStates.current[newTab]) {
    try {
      // Parse and enhance the stored state
      const enhancedState = parseAndEnhanceContent(
        editorStates.current[newTab],
      );

      // Set the editor state
      const parsedState = editorRef.current.parseEditorState(enhancedState);
      editorRef.current.setEditorState(parsedState);
    } catch (error) {
      console.error('Error restoring tab state:', error);
    }
  }
};
```

## Performance Considerations

1. **Minimized DOM Operations**:

   - The FormatPreservationPlugin avoids unnecessary DOM operations
   - Format changes are batched and only applied when needed

2. **Efficient State Processing**:

   - The serialization utilities are optimized to process only what's necessary
   - Format attributes are preserved without deep recursion for every node

3. **Reduced Plugin Overhead**:

   - Using a single focused plugin instead of multiple plugins reduces overhead
   - The plugin focuses only on the specific format preservation issue

4. **Memory Management**:
   - The implementation avoids memory leaks by properly cleaning up listeners
   - References are properly managed to prevent memory accumulation

## Expected Outcomes

1. **Format Preservation**: Formatting will be properly preserved when switching tabs, even when applied at the beginning of the content.

2. **Performance Improvement**: The editor will no longer hang or cause the page to become unresponsive.

3. **Content Persistence**: Content will no longer disappear when formatting is applied at the beginning and then switching tabs.

4. **Improved Undo Functionality**: The undo button will properly restore content after formatting changes.

## Testing Plan

1. **Format Preservation Tests**:

   - Apply formatting at the beginning of content
   - Switch tabs and return to verify content is preserved
   - Test with different formatting options (bold, italic, underline)

2. **Performance Tests**:

   - Test with large documents
   - Test with rapid tab switching
   - Monitor memory usage and CPU utilization

3. **Edge Cases**:
   - Test with empty content
   - Test with content that has complex formatting
   - Test with content that has nested elements

## Conclusion

This hybrid approach addresses the specific format preservation issues while avoiding the performance problems of the previous implementation. By focusing on the core issue and using optimized code, we can ensure a smooth user experience without sacrificing functionality.
