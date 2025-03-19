'use client';

import { useEffect, useRef } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $isElementNode,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
  TextNode,
} from 'lexical';

export function FormatPreservationPlugin() {
  const [editor] = useLexicalComposerContext();
  // Add a ref to track if the component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;

    // Register command listener for text formatting (bold, italic, underline)
    // We'll let the default handler handle the command by returning false
    const removeFormatListener = editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      () => {
        // Return false to let the default handler handle the command
        return false;
      },
      0, // Normal priority
    );

    // Register a node transform specifically for TextNodes
    const removeTransform = editor.registerNodeTransform(
      TextNode,
      (textNode) => {
        if (!textNode.isAttached()) return;

        // Get the current format state
        const format = textNode.getFormat();

        // Only process if there's a format to preserve AND it's different from the stored format
        // This prevents infinite recursion by avoiding unnecessary node modifications
        if (format !== 0 && textNode.__format !== format) {
          // Store the format in a node attribute that will be serialized
          const writableNode = textNode.getWritable();
          writableNode.__format = format;
        }
      },
    );

    // Store a reference to the editor for cleanup
    const editorRef = editor;

    // Register an update listener to handle format restoration
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        // Skip processing if component is unmounting
        if (!isMountedRef.current) return;

        // Use a debounced update to avoid excessive processing
        // We'll collect nodes that need format restoration
        const nodesToUpdate = new Map();
        let hasFormatChanges = false;

        try {
          // Check if there are any format changes to process
          editorState.read(() => {
            const root = $getRoot();
            const processNode = (node: any) => {
              if ($isTextNode(node)) {
                // If the node has a stored format that's different from current format
                if (
                  node.__format !== undefined &&
                  node.getFormat() !== node.__format
                ) {
                  // Store the node and its target format for later update
                  nodesToUpdate.set(node.getKey(), node.__format);
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
          // and we have specific nodes to update
          if (
            hasFormatChanges &&
            nodesToUpdate.size > 0 &&
            isMountedRef.current
          ) {
            editor.update(() => {
              try {
                // Apply formats only to the specific nodes that need updating
                const root = $getRoot();
                const applyFormats = (node: any) => {
                  if ($isTextNode(node)) {
                    const nodeKey = node.getKey();
                    // Check if this node needs format restoration
                    if (nodesToUpdate.has(nodeKey)) {
                      const targetFormat = nodesToUpdate.get(nodeKey);
                      // Only set the format if it's different from current format
                      if (node.getFormat() !== targetFormat) {
                        node.setFormat(targetFormat);
                      }
                    }
                  }

                  if ($isElementNode(node)) {
                    node.getChildren().forEach(applyFormats);
                  }
                };

                root.getChildren().forEach(applyFormats);
              } catch (error) {
                // Silently catch errors during format application
                console.warn('Error applying formats:', error);
              }
            });
          }
        } catch (error) {
          // Catch any errors during the read operation
          console.warn(
            'Error reading editor state for format preservation:',
            error,
          );
        }
      },
    );

    return () => {
      // Set mounted flag to false on unmount
      isMountedRef.current = false;

      // Wrap cleanup in try/catch to handle errors safely
      try {
        // Only attempt to clean up if the editor is still valid and available
        if (
          editorRef &&
          typeof editorRef.isEditable === 'function' &&
          editorRef.isEditable()
        ) {
          removeFormatListener();
          removeTransform();
          removeUpdateListener();
        }
      } catch (e) {
        console.warn('Error during FormatPreservationPlugin cleanup:', e);
      }
    };
  }, [editor]);

  return null;
}
