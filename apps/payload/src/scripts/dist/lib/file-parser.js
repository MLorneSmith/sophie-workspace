import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import matter from 'gray-matter';
/**
 * Parse a YAML file
 */
export function parseYamlFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return yaml.parse(fileContent);
    }
    catch (error) {
        console.error(`Error parsing YAML file ${filePath}:`, error);
        throw error;
    }
}
/**
 * Parse a Markdoc file (.mdoc)
 * Returns an object with frontmatter and content
 */
export function parseMarkdocFile(filePath) {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContent);
        return {
            frontmatter: data,
            content: content.trim(),
        };
    }
    catch (error) {
        console.error(`Error parsing Markdoc file ${filePath}:`, error);
        throw error;
    }
}
/**
 * Read all files from a directory with a specific extension
 */
export function readFilesWithExtension(dirPath, extension) {
    try {
        const files = fs.readdirSync(dirPath);
        return files.filter((file) => file.endsWith(extension)).map((file) => path.join(dirPath, file));
    }
    catch (error) {
        console.error(`Error reading files from ${dirPath}:`, error);
        throw error;
    }
}
/**
 * Convert Markdoc content to Lexical format
 * This is a simplified version - in a real implementation, you would need
 * a more sophisticated parser to handle all Markdoc features
 */
export function convertMarkdocToLexical(content) {
    // Basic conversion - this is a simplified example
    // In a real implementation, you would need a more sophisticated parser
    // Create a basic Lexical document structure
    const lexicalContent = {
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: content,
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
    };
    return lexicalContent;
}
/**
 * Extract Bunny video ID from Markdoc content
 */
export function extractBunnyVideoId(content) {
    const bunnyMatch = content.match(/{% bunny bunnyvideoid="([^"]+)" \/%}/);
    return bunnyMatch ? bunnyMatch[1] : null;
}
