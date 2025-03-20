/**
 * Utilities for converting content to Lexical format for Payload CMS
 */

/**
 * Convert plain text to Lexical format
 */
export function textToLexical(text: string) {
  // Split text into paragraphs
  const paragraphs = text.split('\n\n').filter(Boolean)

  // Create Lexical children nodes for each paragraph
  const children = paragraphs.map((paragraph) => ({
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
  }))

  // Create the Lexical document structure
  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

/**
 * Convert HTML to Lexical format
 * This is a simplified version - in a real implementation, you would need
 * a more sophisticated parser to handle all HTML features
 */
export function htmlToLexical(html: string) {
  // For a real implementation, you would use a proper HTML parser
  // This is just a simplified example
  return textToLexical(html.replace(/<[^>]*>/g, ''))
}

/**
 * Convert Markdoc content to Lexical format
 * This is a simplified version - in a real implementation, you would need
 * a more sophisticated parser to handle all Markdoc features
 */
export function markdocToLexical(content: string) {
  // For a real implementation, you would use a proper Markdoc parser
  // This is just a simplified example that treats it as plain text
  return textToLexical(content)
}

/**
 * Create a Lexical node for a Bunny video
 */
export function createBunnyVideoNode(videoId: string) {
  return {
    type: 'bunnyVideo',
    version: 1,
    bunnyVideoId: videoId,
    fields: {
      autoPlay: false,
      loop: false,
      muted: false,
    },
  }
}

/**
 * Create a Lexical document with a Bunny video
 */
export function createLexicalWithBunnyVideo(videoId: string, text?: string) {
  const children = []

  // Add the Bunny video node
  children.push({
    type: 'bunnyVideo',
    version: 1,
    bunnyVideoId: videoId,
    fields: {
      autoPlay: false,
      loop: false,
      muted: false,
    },
  })

  // Add text paragraph if provided
  if (text) {
    children.push({
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
      type: 'paragraph',
      version: 1,
    })
  }

  // Create the Lexical document structure
  return {
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}
