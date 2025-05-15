import { z } from 'zod';

// Define the schema for a single lesson definition from the YAML file
export const LessonDefinitionSchema = z.object({
  id: z.string().uuid(), // Predefined UUID for the lesson
  title: z.string().min(1),
  slug: z.string().min(1),
  lesson_number: z.number().int().min(0), // Added required lesson_number
  description: z.string().optional(),
  objectives: z.array(z.string()).optional(), // Assuming objectives are an array of strings
  content_file: z.string().optional(), // Path to the raw markdown/mdoc file
  downloads: z.array(z.string()).optional(), // Array of download keys/IDs
  quiz_id: z.string().optional(), // Quiz key/ID
  // Add other fields as present in lesson-definitions.yaml
  todo_items: z.array(z.string()).optional(), // Assuming todo_items are an array of strings
});

// Define the schema for the entire array of lesson definitions
export const LessonDefinitionsSchema = z.array(LessonDefinitionSchema);

// Export the type for a single Lesson definition
export type LessonDefinition = z.infer<typeof LessonDefinitionSchema>;
