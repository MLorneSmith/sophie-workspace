"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToLexical = convertToLexical;
/**
 * Converts Markdown content to a simple Lexical JSON structure
 * @param content - Markdown content
 * @returns Lexical JSON structure as a string
 */
function convertToLexical(content) {
    // Split the content into paragraphs
    const paragraphs = content.split('\n\n');
    // Create a simple Lexical JSON structure
    const lexical = {
        root: {
            children: paragraphs.map((paragraph) => ({
                children: [
                    {
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: paragraph.trim(),
                        type: 'text',
                        version: 1,
                    },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
            })),
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
        },
    };
    return JSON.stringify(lexical);
}
