import { z } from 'zod';

// Define the schema directly without using createStepSchema
// This allows it to be used in both client and server contexts
export const FormSchemaShape = {
  welcome: z.object({}),
  profile: z.object({
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters' })
      .max(255, { message: 'Name must be 255 characters or less' }),
  }),
  goals: z.object({
    primary: z.enum(['work', 'personal', 'school']),
    secondary: z.object({
      learn: z.boolean(),
      automate: z.boolean(),
      feedback: z.boolean(),
    }),
    workDetails: z
      .object({
        role: z.string().min(1, 'Role is required'),
        industry: z.string().min(1, 'Industry is required'),
      })
      .optional(),
    personalDetails: z
      .object({
        project: z.string().min(1, 'Project is required'),
      })
      .optional(),
    schoolDetails: z
      .object({
        level: z.enum(['highschool', 'undergraduate', 'graduate']),
        major: z.string().min(1, 'Major is required'),
      })
      .optional(),
  }),
  theme: z.object({
    style: z.enum(['dark', 'light']),
  }),
};

// Server-side schema for validation in server actions
export const ServerFormSchema = z.object({
  ...FormSchemaShape,
  isFinalSubmission: z.boolean().optional(),
});

// Client-side schema will be created in the component using createStepSchema
