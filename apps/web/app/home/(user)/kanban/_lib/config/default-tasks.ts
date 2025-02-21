import type { CreateTaskInput } from '../schema/task.schema';

export const DEFAULT_TASKS: CreateTaskInput[] = [
  {
    title: 'Welcome to Kanban',
    description:
      'This is your first task in the Do column. Click on it to see more details and edit.',
    status: 'do',
    priority: 'medium',
    image_url: '/images/default-tasks/placeholder-small.png',
    subtasks: [
      {
        title: 'Try dragging this task to another column',
        is_completed: false,
      },
      { title: 'Add more subtasks by editing this task', is_completed: false },
      {
        title: 'Check off this subtask to track progress',
        is_completed: false,
      },
    ],
  },
  {
    title: 'Task in Progress',
    description:
      'This task is already in the Doing column to show you how it works.',
    status: 'doing',
    priority: 'high',
    image_url: '/images/default-tasks/placeholder-small.png',
    subtasks: [
      {
        title: 'Notice the red border indicating high priority',
        is_completed: true,
      },
      {
        title: 'Try changing the priority in the edit dialog',
        is_completed: false,
      },
    ],
  },
  {
    title: 'Completed Example',
    description: 'This task is in the Done column to demonstrate the workflow.',
    status: 'done',
    priority: 'low',
    image_url: '/images/default-tasks/placeholder-small.png',
    subtasks: [
      { title: 'All subtasks completed', is_completed: true },
      { title: 'Task moved to Done column', is_completed: true },
    ],
  },
  {
    title: 'Try Adding Subtasks',
    description: 'Click this task to learn how to add and manage subtasks.',
    status: 'do',
    priority: 'medium',
    image_url: '/images/default-tasks/placeholder-small.png',
    subtasks: [
      { title: 'Click the + button below', is_completed: false },
      { title: 'Type a subtask title', is_completed: false },
      { title: 'Add as many as you need', is_completed: false },
    ],
  },
];
