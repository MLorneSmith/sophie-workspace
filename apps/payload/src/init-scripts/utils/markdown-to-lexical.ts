import type { SanitizedConfig } from 'payload';
import {
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical';

/**
 * Converts Markdown content to Payload's Lexical JSON format using the Payload-provided converter.
 * @param markdownContent - The Markdown content string.
 * @param config - The Payload SanitizedConfig object.
 * @returns A Promise that resolves to the Lexical JSON structure.
 */
export async function markdownToLexical(
  markdownContent: string,
  config: SanitizedConfig,
): Promise<any> { // Use any for now, can refine type later if needed
  try {
    const lexicalJSON = await convertMarkdownToLexical({
      editorConfig: await editorConfigFactory.default({ config }),
      markdown: markdownContent,
    });
    return lexicalJSON;
  } catch (error) {
    console.error('Error converting Markdown to Lexical:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}
