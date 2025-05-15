import { z } from 'zod';
// Define the Zod schema for the frontmatter of a single documentation Markdoc file
export const DocumentationFrontmatterSchema = z.object({
    title: z.string().min(1),
    status: z.enum(['draft', 'published']), // Assuming similar statuses to posts
    description: z.string().optional(),
    order: z.number().optional(), // Assuming order is important for documentation
    // Add other frontmatter fields as present in your documentation Markdoc files
});
// Define a schema for the full documentation data including content
export const DocumentationDefinitionSchema = DocumentationFrontmatterSchema.extend({
    slug: z.string().min(1), // Slug is often derived from filename or title
    content: z.string(), // Raw Markdoc content (after frontmatter)
    // Add other fields if they are part of the SSOT structure beyond frontmatter
});
// If the SSOT is a collection of these objects (e.g., in a single YAML), use this:
export const DocumentationDefinitionsSchema = z.array(DocumentationDefinitionSchema);
// If each Markdoc file is a single documentation definition, you might validate the frontmatter and content separately.
//# sourceMappingURL=documentation-definition.schema.js.map