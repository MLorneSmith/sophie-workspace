/**
 * Utility functions for converting Markdown content to Lexical editor format
 */

/**
 * Converts Markdown content to a Lexical editor compatible format
 * @param markdown The markdown content to convert
 * @returns A Lexical editor compatible object
 */
export function convertMarkdownToLexical(markdown: string) {
  // Split the markdown into paragraphs
  const paragraphs = markdown.split(/\n\n+/);

  // Create a Lexical editor compatible object
  return {
    root: {
      children: paragraphs.map((paragraph) => {
        // Check if this is a heading
        const headingMatch = paragraph.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch && headingMatch[1] && headingMatch[2]) {
          const level = headingMatch[1].length;
          const text = headingMatch[2];

          return {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text,
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'heading',
            version: 1,
            tag: `h${level}`,
          };
        }

        // Regular paragraph
        return {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: paragraph,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        };
      }),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };
}
