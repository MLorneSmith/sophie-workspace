'use client';

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
