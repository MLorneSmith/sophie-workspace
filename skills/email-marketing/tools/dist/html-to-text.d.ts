/**
 * Convert HTML email content to clean plain text
 */
export declare function htmlToPlainText(html: string): string;
/**
 * Extract plain text, preferring existing plain text over HTML conversion
 */
export declare function extractCleanText(plain: string, html: string): string;
/**
 * Extract links from HTML for reference
 */
export declare function extractLinks(html: string): Array<{
    text: string;
    url: string;
}>;
//# sourceMappingURL=html-to-text.d.ts.map