import { z } from 'zod';
// Define the Zod schema for the frontmatter of a single post Markdoc file
export const PostFrontmatterSchema = z.object({
    title: z.string().min(1),
    status: z.enum(['draft', 'published']),
    description: z.string().optional(),
    authors: z.array(z.string()).optional(), // Assuming authors are strings (e.g., usernames or IDs)
    image: z.string().optional(), // Assuming image is a path or URL string
    categories: z.array(z.string()).optional(), // Assuming categories are strings (e.g., slugs or names)
    tags: z.array(z.string()).optional(), // Assuming tags are strings (e.g., slugs or names)
    publishedAt: z.string().optional(), // Assuming date string, could refine to z.preprocess(val => new Date(val), z.date()) if needed
    language: z.string().optional(), // Assuming language code string
    order: z.number().optional(), // Assuming order is a number
    // Add other frontmatter fields as present in your Markdoc files
});
// Define a schema for the full post data including content
export const PostDefinitionSchema = PostFrontmatterSchema.extend({
    slug: z.string().min(1), // Slug is often derived from filename or title, but include in schema if present in frontmatter or needed for validation
    content: z.string(), // Raw Markdoc content (after frontmatter)
    // Add other fields if they are part of the SSOT structure beyond frontmatter
});
// If the SSOT is a collection of these objects (e.g., in a single YAML), use this:
export const PostDefinitionsSchema = z.array(PostDefinitionSchema);
// If each Markdoc file is a single post definition, you might validate the frontmatter and content separately.
//# sourceMappingURL=post-definition.schema.js.map