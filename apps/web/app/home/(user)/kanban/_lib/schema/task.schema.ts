import { z } from 'zod';

export const TaskPriorityEnum = z.enum(['low', 'medium', 'high']);
const TaskStatusEnum = z.enum(['do', 'doing', 'done']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;
export { TaskStatusEnum };

export const SubtaskSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required'),
  is_completed: z.boolean().default(false),
});

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export const CreateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: TaskStatusEnum.default('do'),
  priority: TaskPriorityEnum.default('medium'),
  subtasks: z.array(SubtaskSchema).optional(),
  image: z
    .custom<File>()
    .optional()
    .refine(
      (file) => !file || file.size <= MAX_FILE_SIZE,
      'Image must be less than 1MB',
    ),
  image_url: z
    .union([z.string().url(), z.string().startsWith('/')])
    .nullable()
    .optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.extend({
  id: z.string().uuid(),
});

export const UpdateTaskStatusSchema = z.object({
  id: z.string().uuid(),
  status: TaskStatusEnum,
});

export type Task = z.infer<typeof CreateTaskSchema> & {
  id: string;
  created_at: string;
  updated_at: string;
  account_id: string;
  image_url: string | null;
};

export type Subtask = z.infer<typeof SubtaskSchema> & {
  id: string;
  task_id: string;
  created_at: string;
  updated_at: string;
  // UI state
  isUpdating?: boolean;
  error?: boolean;
};

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;
