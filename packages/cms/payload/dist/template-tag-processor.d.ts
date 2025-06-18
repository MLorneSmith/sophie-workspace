type TemplateTagProcessorProps = {
    content: string;
};
/**
 * Process all template tags in content
 * @param content The content string containing template tags
 * @returns Component with processed content
 */
export declare function TemplateTagProcessor({ content }: TemplateTagProcessorProps): import("react").JSX.Element | null;
/**
 * Check if content contains template tags that need processing
 */
export declare function containsTemplateTags(content: unknown): boolean;
export {};
