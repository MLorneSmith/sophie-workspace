import { z } from 'zod';

// Define the schema for the Lexical JSON structure (simplified)
// A more detailed schema could be used if needed, but for validation presence is key
const LexicalRootNodeSchema = z.object({
  root: z.object({
    children: z.array(z.any()), // Can be more specific if needed
    direction: z.enum(['ltr', 'rtl']).nullable().optional(), // Corrected direction type
    format: z.string(),
    indent: z.number(),
    type: z.literal('root'),
    version: z.number(),
  }),
  // Add other potential top-level Lexical properties if necessary
});

// Define the schema for a single quiz question
export const QuizQuestionDefinitionSchema = z.object({
  id: z.string().uuid(), // Predefined UUID for the question
  questionSlug: z.string().min(1),
  text: z.string().min(1),
  options: z.array(z.object({ // Options are objects with text and isCorrect
    text: z.string().min(1),
    isCorrect: z.boolean().optional(), // isCorrect might be optional in SSOT
    // Removed optional id field as per Payload collection definition
  })), // Made options array required as per Payload collection definition
  correctOptionIndex: z.number().int().min(0).optional(), // Index of the correct option (optional if isCorrect is used in options)
  explanation: LexicalRootNodeSchema.optional(), // Explanation is optional Lexical JSON object
});

// Define the schema for a single quiz definition
export const QuizDefinitionSchema = z.object({
  id: z.string().uuid(), // Predefined UUID for the quiz
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  questions: z.array(QuizQuestionDefinitionSchema), // Array of nested question objects
});

// Define the schema for the entire quizzes object (Record mapping slug to QuizDefinition)
export const QuizzesSchema = z.record(z.string(), QuizDefinitionSchema);

// Export the types for Quiz Definition and Quiz Question Definition
export type QuizDefinition = z.infer<typeof QuizDefinitionSchema>;
export type QuizQuestionDefinition = z.infer<typeof QuizQuestionDefinitionSchema>;
