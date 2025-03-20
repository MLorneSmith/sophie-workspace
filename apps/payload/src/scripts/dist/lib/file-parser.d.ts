/**
 * Parse a YAML file
 */
export declare function parseYamlFile(filePath: string): any;
/**
 * Parse a Markdoc file (.mdoc)
 * Returns an object with frontmatter and content
 */
export declare function parseMarkdocFile(filePath: string): {
    frontmatter: {
        [key: string]: any;
    };
    content: string;
};
/**
 * Read all files from a directory with a specific extension
 */
export declare function readFilesWithExtension(dirPath: string, extension: string): string[];
/**
 * Convert Markdoc content to Lexical format
 * This is a simplified version - in a real implementation, you would need
 * a more sophisticated parser to handle all Markdoc features
 */
export declare function convertMarkdocToLexical(content: string): {
    root: {
        children: {
            children: {
                detail: number;
                format: number;
                mode: string;
                style: string;
                text: string;
                type: string;
                version: number;
            }[];
            direction: string;
            format: string;
            indent: number;
            type: string;
            version: number;
        }[];
        direction: string;
        format: string;
        indent: number;
        type: string;
        version: number;
    };
};
/**
 * Extract Bunny video ID from Markdoc content
 */
export declare function extractBunnyVideoId(content: string): string | null;
