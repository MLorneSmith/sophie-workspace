'use client';

/**
 * Utility to convert Lexical editor state to Tiptap format
 * This is primarily used for migrating existing content
 */
interface LexicalNode {
  type: string;
  tag?: string;
  listType?: string;
  textContent?: string;
  children?: LexicalNode[];
  format?: number;
  text?: string;
  [key: string]: any;
}

// Base node interface
interface TiptapNode {
  type: string;
  attrs?: Record<string, any>;
  marks?: TiptapMark[];
}

// Mark interface
interface TiptapMark {
  type: string;
  attrs?: Record<string, any>;
}

// Text node - must have text property
interface TiptapTextNode extends TiptapNode {
  type: 'text';
  text: string;
}

// Paragraph node - can contain text nodes
interface TiptapParagraphNode extends TiptapNode {
  type: 'paragraph';
  content?: Array<TiptapTextNode>;
}

// List item node - can contain paragraph nodes
interface TiptapListItemNode extends TiptapNode {
  type: 'listItem';
  content: Array<TiptapParagraphNode>;
}

// Bullet list node - can contain list item nodes
interface TiptapBulletListNode extends TiptapNode {
  type: 'bulletList';
  content: Array<TiptapListItemNode>;
}

// Ordered list node - can contain list item nodes
interface TiptapOrderedListNode extends TiptapNode {
  type: 'orderedList';
  content: Array<TiptapListItemNode>;
}

// Heading node - can contain text nodes
interface TiptapHeadingNode extends TiptapNode {
  type: 'heading';
  attrs: { level: number };
  content: Array<TiptapTextNode>;
}

// Union type for all possible content node types
type TiptapContentNode =
  | TiptapParagraphNode
  | TiptapBulletListNode
  | TiptapOrderedListNode
  | TiptapHeadingNode;

// Document interface - the root node
interface TiptapDocument {
  type: 'doc';
  content: Array<TiptapContentNode>;
}

export function lexicalToTiptap(lexicalContent: any): TiptapDocument {
  if (!lexicalContent) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        } as TiptapParagraphNode,
      ],
    };
  }

  // Parse if it's a string
  const parsed =
    typeof lexicalContent === 'string'
      ? JSON.parse(lexicalContent)
      : lexicalContent;

  // Basic conversion for existing data
  const tiptapDoc: TiptapDocument = {
    type: 'doc',
    content: [],
  };

  if (parsed?.root?.children) {
    const contentNodes: TiptapContentNode[] = [];

    for (const node of parsed.root.children) {
      // Map paragraph nodes
      if (node.type === 'paragraph') {
        const textNodes: TiptapTextNode[] = (node.children || []).map(
          (textNode: LexicalNode) => {
            const marks: TiptapMark[] = [];

            // Handle text formatting
            if (textNode.format) {
              // Bold (format & 1)
              if (textNode.format & 1) marks.push({ type: 'bold' });
              // Italic (format & 2)
              if (textNode.format & 2) marks.push({ type: 'italic' });
              // Underline (format & 4)
              if (textNode.format & 4) marks.push({ type: 'underline' });
            }

            const textNodeResult: TiptapTextNode = {
              type: 'text',
              text: textNode.text || '',
              marks: marks.length > 0 ? marks : undefined,
            };

            return textNodeResult;
          },
        );

        if (textNodes.length > 0) {
          const paragraphNode: TiptapParagraphNode = {
            type: 'paragraph',
            content: textNodes,
          };

          contentNodes.push(paragraphNode);
        }
      }

      // Map heading nodes
      else if (node.type === 'heading') {
        const textNodes: TiptapTextNode[] = (node.children || []).map(
          (textNode: LexicalNode) => ({
            type: 'text',
            text: textNode.text || '',
          }),
        );

        if (textNodes.length > 0) {
          const headingNode: TiptapHeadingNode = {
            type: 'heading',
            attrs: { level: node.tag === 'h1' ? 1 : node.tag === 'h2' ? 2 : 3 },
            content: textNodes,
          };

          contentNodes.push(headingNode);
        }
      }

      // Map list nodes
      else if (node.type === 'list') {
        const listItemNodes: TiptapListItemNode[] = (node.children || []).map(
          (listItemNode: LexicalNode) => {
            const paragraphTextNodes: TiptapTextNode[] = (
              listItemNode.children || []
            ).map((textNode: LexicalNode) => ({
              type: 'text',
              text: textNode.text || '',
            }));

            const paragraphNode: TiptapParagraphNode = {
              type: 'paragraph',
              content: paragraphTextNodes,
            };

            return {
              type: 'listItem',
              content: [paragraphNode],
            };
          },
        );

        if (listItemNodes.length > 0) {
          if (node.listType === 'bullet') {
            const bulletListNode: TiptapBulletListNode = {
              type: 'bulletList',
              content: listItemNodes,
            };

            contentNodes.push(bulletListNode);
          } else {
            const orderedListNode: TiptapOrderedListNode = {
              type: 'orderedList',
              content: listItemNodes,
            };

            contentNodes.push(orderedListNode);
          }
        }
      }

      // Default to paragraph if type is unknown
      else {
        const textNode: TiptapTextNode = {
          type: 'text',
          text: node.textContent || '',
        };

        const paragraphNode: TiptapParagraphNode = {
          type: 'paragraph',
          content: [textNode],
        };

        contentNodes.push(paragraphNode);
      }
    }

    tiptapDoc.content = contentNodes;
  }

  // Ensure we have at least an empty paragraph
  if (tiptapDoc.content.length === 0) {
    tiptapDoc.content.push({
      type: 'paragraph',
      content: [],
    } as TiptapParagraphNode);
  }

  return tiptapDoc;
}

/**
 * Creates an empty Tiptap document
 */
export function createEmptyTiptapDocument(): TiptapDocument {
  const emptyParagraph: TiptapParagraphNode = {
    type: 'paragraph',
    content: [],
  };

  return {
    type: 'doc',
    content: [emptyParagraph],
  };
}

/**
 * Utility to create a Tiptap document from plain text
 * Used for initial content creation
 */
export function createTiptapFromText(text: string): TiptapDocument {
  // Split text into paragraphs and remove empty lines
  const paragraphs = text.split('\n').filter((line) => line.trim());

  // Convert each paragraph into a Tiptap node
  const contentNodes: TiptapContentNode[] = paragraphs.map((paragraph) => {
    // Check if the line is a bullet point
    const trimmedParagraph = paragraph.trim();
    const isBulletPoint =
      trimmedParagraph.startsWith('-') || trimmedParagraph.startsWith('•');

    // Remove the bullet point character and trim whitespace
    const textContent = isBulletPoint
      ? trimmedParagraph.substring(1).trim()
      : trimmedParagraph;

    if (isBulletPoint) {
      // Create a bullet list item
      const textNode: TiptapTextNode = {
        type: 'text',
        text: textContent,
      };

      const paragraphNode: TiptapParagraphNode = {
        type: 'paragraph',
        content: [textNode],
      };

      const listItemNode: TiptapListItemNode = {
        type: 'listItem',
        content: [paragraphNode],
      };

      const bulletListNode: TiptapBulletListNode = {
        type: 'bulletList',
        content: [listItemNode],
      };

      return bulletListNode;
    } else {
      // Create a regular paragraph
      const textNode: TiptapTextNode = {
        type: 'text',
        text: textContent,
      };

      const paragraphNode: TiptapParagraphNode = {
        type: 'paragraph',
        content: [textNode],
      };

      return paragraphNode;
    }
  });

  // Return Tiptap document format
  return {
    type: 'doc',
    content: contentNodes,
  };
}
