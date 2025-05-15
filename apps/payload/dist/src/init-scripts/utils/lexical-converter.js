// @ts-ignore
import pkg from '@markdoc/markdoc'; // Import the default export for runtime values
// @ts-ignore
const { parse, transform, Tag, Config, RenderableTreeNode } = pkg; // Destructure necessary components, excluding Node
// Define a basic Markdoc configuration.
// This can be expanded later to handle custom tags more specifically.
const markdocConfig = {
    // Define nodes to override default rendering or add custom logic
    nodes: {
        // Example: Override the default heading node to ensure correct tag is used
        heading: {
            render: 'heading', // This tells Markdoc to render it as a 'heading' node
            attributes: {
                level: { type: Number, required: true },
            },
        },
        // Add definitions for other standard nodes if needed, or rely on defaults
        // paragraph: { render: 'paragraph' },
        // list: { render: 'list', attributes: { kind: { type: String } } },
        // item: { render: 'listitem' },
        // fence: { render: 'code' }, // Code blocks
        // blockquote: { render: 'blockquote' }, // Blockquotes
        // Placeholder for custom tags - Markdoc will parse them, but we need to handle conversion
        // highlight: {
        //   render: 'highlight', // Or a custom component name
        //   attributes: { variant: { type: String } },
        // },
        // cta: {
        //   render: 'cta', // Or a custom component name
        //   attributes: {
        //     ctatext: { type: String },
        //     ctadescription: { type: String },
        //     ctabuttontext: { type: String },
        //   },
        //   selfClosing: true, // Assuming it's self-closing based on example
        // },
    },
    // Define tags to handle custom syntax like {% tag %}
    tags: {
    // Placeholder for custom tags - Markdoc will parse them, but we need to handle conversion
    // highlight: {
    //   attributes: { variant: { type: String } },
    // },
    // cta: {
    //   attributes: {
    //     ctatext: { type: String },
    //     ctadescription: { type: String },
    //     ctabuttontext: { type: String },
    //   },
    //   selfClosing: true,
    // },
    },
    // Define functions if needed for custom logic within Markdoc
    // functions: {},
    // Define variables if needed
    // variables: {},
};
/**
 * Converts a Markdoc RenderableTreeNode to a Lexical JSON node-like object or an array of such objects.
 * This is a recursive function.
 * @param node - The Markdoc RenderableTreeNode
 * @returns A Lexical JSON node-like object or an array of such objects, or null if the node is skipped
 */
function markdocNodeToLexical(node) {
    // Handle primitive types and null/undefined returned by Markdoc.transform
    if (node === null || typeof node === 'undefined') {
        return null; // Skip null or undefined nodes
    }
    if (typeof node === 'string') {
        return {
            type: 'text',
            text: node,
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            version: 1,
        };
    }
    if (typeof node === 'number' || typeof node === 'boolean') {
        return {
            type: 'text',
            text: String(node),
            detail: 0, format: 0, mode: 'normal', style: '', version: 1,
        };
    }
    if (node === null || typeof node === 'undefined') {
        return null; // Skip null or undefined nodes
    }
    // Handle Markdoc Node types
    if (node instanceof Node) {
        // Handle text nodes (already covered by string primitive, but keeping for clarity)
        if (node.type === 'text') {
            return {
                type: 'text',
                text: node.attributes.content,
                detail: 0, format: 0, mode: 'normal', style: '', version: 1,
            };
        }
        // Helper to process children recursively and filter out null/undefined
        // This helper is specifically for arrays of Markdoc Node
        const processNodeChildren = (children) => {
            const processed = [];
            for (const childNode of children) {
                const lexicalChild = markdocNodeToLexical(childNode); // Cast to unknown first
                if (lexicalChild !== null) {
                    if (Array.isArray(lexicalChild)) {
                        processed.push(...lexicalChild);
                    }
                    else {
                        processed.push(lexicalChild);
                    }
                }
            }
            return processed;
        };
        // Handle standard block nodes
        if (node.type === 'paragraph') {
            const children = processNodeChildren(node.children);
            return {
                type: 'paragraph',
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
                children: children,
            };
        }
        if (node.type === 'heading') {
            const level = node.attributes.level;
            const children = processNodeChildren(node.children);
            return {
                type: 'heading',
                tag: `h${level}`, // e.g., 'h1', 'h2'
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
                children: children,
            };
        }
        if (node.type === 'list') {
            const listType = node.attributes.kind === 'ordered' ? 'number' : 'bullet';
            const children = processNodeChildren(node.children);
            return {
                type: 'list',
                listType: listType,
                start: node.attributes.start, // For ordered lists
                tag: listType === 'number' ? 'ol' : 'ul',
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
                children: children,
            };
        }
        if (node.type === 'item') {
            const children = processNodeChildren(node.children);
            return {
                type: 'listitem',
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
                children: children,
            };
        }
        if (node.type === 'link') {
            const children = processNodeChildren(node.children);
            return {
                type: 'link',
                url: node.attributes.href,
                // title: node.attributes.title as string, // Optional title attribute
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
                children: children,
            };
        }
        // Handle inline formatting (strong, em) - these modify text nodes
        if (node.type === 'strong') {
            // Apply bold format to children text nodes
            return node.children.map(child => {
                // Use type assertion when calling markdocNodeToLexical with a Node
                const lexicalChild = markdocNodeToLexical(child); // Cast to unknown first
                if (lexicalChild && !Array.isArray(lexicalChild) && lexicalChild.type === 'text') {
                    return { ...lexicalChild, format: (lexicalChild.format | 1) }; // Set bold format flag
                }
                return lexicalChild;
            }).flat().filter(Boolean);
        }
        if (node.type === 'em') {
            // Apply italic format to children text nodes
            return node.children.map(child => {
                // Use type assertion when calling markdocNodeToLexical with a Node
                const lexicalChild = markdocNodeToLexical(child); // Cast to unknown first
                if (lexicalChild && !Array.isArray(lexicalChild) && lexicalChild.type === 'text') {
                    return { ...lexicalChild, format: (lexicalChild.format | 2) }; // Set italic format flag
                }
                return lexicalChild;
            }).flat().filter(Boolean);
        }
        // Handle other standard nodes (code_block, blockquote, image, table, etc.)
        // Add cases here as needed based on expected Markdoc content
        if (node.type === 'fence') { // Code block
            const children = processNodeChildren(node.children);
            return {
                type: 'code',
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
                language: node.attributes.language,
                children: children,
            };
        }
        if (node.type === 'blockquote') {
            const children = processNodeChildren(node.children);
            return {
                type: 'quote',
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
                children: children,
            };
        }
        // Add image, table, etc. if needed
        // Handle custom tags - basic placeholder
        if (node.type === 'tag') {
            const tagName = node.attributes.name;
            const attributes = node.attributes;
            const childrenContent = processNodeChildren(node.children);
            // Basic handling: render inner content or a placeholder
            if (childrenContent.length > 0) {
                return {
                    type: 'paragraph', // Wrap in a paragraph
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: childrenContent,
                };
            }
            else {
                // For self-closing tags or tags with no content
                return {
                    type: 'paragraph', // Wrap in a paragraph
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [{
                            type: 'text',
                            text: `[Custom Tag: ${tagName}]`, // Placeholder text
                            detail: 0, format: 0, mode: 'normal', style: '', version: 1,
                        }],
                };
            }
        }
        // If it's a Markdoc Node type we don't explicitly handle, skip it
        console.warn(`[markdocToLexical] Skipping unhandled Markdoc Node type: ${node.type}`);
        return null;
    }
    else if (node instanceof Tag) {
        // Handle Markdoc Tag types (should be covered by node.type === 'tag' above, but keeping for robustness)
        console.warn(`[markdocToLexical] Skipping unhandled Markdoc Tag type: ${node.name}`);
        return null;
    }
    else if (Array.isArray(node)) {
        // Handle arrays of RenderableTreeNode
        return node.map(markdocNodeToLexical).flat().filter(Boolean);
    }
    else {
        // Handle any other unexpected types
        console.warn(`[markdocToLexical] Skipping unexpected RenderableTreeNode type: ${typeof node}`);
        return null;
    }
}
/**
 * Converts Markdoc content to Payload's Lexical JSON format.
 * @param markdocContent - The Markdoc content string (without frontmatter)
 * @returns A Lexical JSON structure (RootNode object)
 */
export function markdocToLexical(markdocContent) {
    // 1. Parse the Markdoc content into an AST
    const ast = parse(markdocContent);
    // 2. Transform the AST into a renderable tree (applies configuration)
    const content = transform(ast, markdocConfig);
    // 3. Convert the renderable tree to Lexical JSON structure
    // The root node should contain the children from the transformed content
    const rootChildren = Array.isArray(content)
        ? content.map(markdocNodeToLexical).flat().filter(Boolean)
        : (content ? [markdocNodeToLexical(content)].flat().filter(Boolean) : []);
    const lexicalRoot = {
        type: 'root',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: rootChildren,
    };
    return lexicalRoot;
}
// Note: Payload's Rich Text field might expect the Lexical JSON as a string.
// Seeders should call JSON.stringify(markdocToLexical(content)) if needed.
//# sourceMappingURL=lexical-converter.js.map