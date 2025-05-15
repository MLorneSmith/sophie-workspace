import { z } from 'zod';

// Define the Zod schema for a single private post definition
export const PrivatePostDefinitionSchema = z.object({
  id: z.string().uuid(), // Assuming SSOTs use UUIDs for identification
  title: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(['draft', 'published']), // Assuming similar statuses to public posts
  // Add other fields as needed based on the actual private post SSOT structure
  content: z.string(), // Raw Markdoc content
});

// Define the Zod schema for an array of private post definitions
export const PrivatePostDefinitionsSchema = z.array(PrivatePostDefinitionSchema);
