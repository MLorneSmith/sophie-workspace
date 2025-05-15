import { z } from 'zod';

// Define the schema for a single survey question within a survey definition
export const SurveyQuestionSchema = z.object({ // Export SurveyQuestionSchema
  id: z.string().uuid().optional(), // Assuming questions might have optional UUIDs
  type: z.enum(['text', 'textarea', 'select', 'checkbox', 'radio', 'scale']), // Added 'scale'
  label: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(), // Options for select, checkbox, radio
  // Add other fields as present in survey YAMLs
});

// Define the schema for a single survey definition from the YAML files
export const SurveyDefinitionSchema = z.object({
  id: z.string().uuid(), // Survey ID is required and must be a UUID
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  introduction: z.string().optional(), // Added introduction field
  status: z.enum(['draft', 'published']).optional(), // Added status field, assuming optional and similar enum as posts
  questions: z.array(SurveyQuestionSchema), // Array of survey questions
  // Add other fields as present in survey YAMLs
});

// If the YAML files contain a single survey object at the root, use this:
// export const SurveyFileSchema = SurveyDefinitionSchema;

// If the YAML files contain an array of survey objects at the root, use this:
// export const SurveyFileSchema = z.array(SurveyDefinitionSchema);

// If the YAML files contain an array of survey objects at the root, use this:
export const SurveyDefinitionsSchema = z.array(SurveyDefinitionSchema);

// Based on the file listing, it seems each YAML is a single survey object.
// export const SurveyFileSchema = SurveyDefinitionSchema;
