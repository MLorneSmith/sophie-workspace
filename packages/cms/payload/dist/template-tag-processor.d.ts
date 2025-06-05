/**
 * Enhanced Template Tag Processor
 *
 * Provides processing for template-style tags in content strings before they are
 * rendered by the standard Lexical renderer. This improves compatibility with
 * template-based content that contains {% ... %} tags.
 *
 * Includes enhanced error handling, logging, and better r2file tag handling.
 */
import React from "react";
type TemplateTagProcessorProps = {
    content: string;
};
/**
 * Process all template tags in content
 * @param content The content string containing template tags
 * @returns Component with processed content
 */
export declare function TemplateTagProcessor({ content }: TemplateTagProcessorProps): React.JSX.Element | null;
/**
 * Check if content contains template tags that need processing
 */
export declare function containsTemplateTags(content: unknown): boolean;
export {};
