/**
 * Utilities for converting content to Lexical format for Payload CMS
 */
/**
 * Convert plain text to Lexical format
 */
export declare function textToLexical(text: string): {
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
 * Convert HTML to Lexical format
 * This is a simplified version - in a real implementation, you would need
 * a more sophisticated parser to handle all HTML features
 */
export declare function htmlToLexical(html: string): {
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
 * Convert Markdoc content to Lexical format
 * This is a simplified version - in a real implementation, you would need
 * a more sophisticated parser to handle all Markdoc features
 */
export declare function markdocToLexical(content: string): {
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
 * Create a Lexical node for a Bunny video
 */
export declare function createBunnyVideoNode(videoId: string): {
    type: string;
    version: number;
    bunnyVideoId: string;
    fields: {
        autoPlay: boolean;
        loop: boolean;
        muted: boolean;
    };
};
/**
 * Create a Lexical document with a Bunny video
 */
export declare function createLexicalWithBunnyVideo(videoId: string, text?: string): {
    root: {
        children: ({
            type: string;
            version: number;
            bunnyVideoId: string;
            fields: {
                autoPlay: boolean;
                loop: boolean;
                muted: boolean;
            };
            children?: undefined;
            direction?: undefined;
            format?: undefined;
            indent?: undefined;
        } | {
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
            bunnyVideoId?: undefined;
            fields?: undefined;
        })[];
        direction: string;
        format: string;
        indent: number;
        type: string;
        version: number;
    };
};
