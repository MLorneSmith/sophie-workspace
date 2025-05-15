import { z } from 'zod';

// Define the schema for a single Course definition
export const CourseDefinitionSchema = z.object({
  id: z.string().uuid(), // Predefined UUID for the course (required)
  title: z.string().min(1), // Title is required
  slug: z.string().min(1), // Slug is required
  description: z.string().optional(),
  // Add other fields as present in your course definitions YAML
  // For example, if courses have lessons defined within them:
  // lessons: z.array(z.object({
  //   id: z.string().uuid(),
  //   title: z.string().min(1),
  //   slug: z.string().min(1),
  //   // ... other lesson fields
  // })).optional(),
});

// Define the schema for the entire array of course definitions
export const CourseDefinitionsSchema = z.array(CourseDefinitionSchema);

// Export the type for a single Course definition
export type CourseDefinition = z.infer<typeof CourseDefinitionSchema>;
