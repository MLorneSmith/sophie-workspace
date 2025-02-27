'use client';

import { useCallback } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusIcon, XIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import type {
  CreateTaskInput,
  Task as _Task,
} from '../_lib/schema/task.schema';
import {
  CreateTaskSchema,
  TaskPriorityEnum,
  TaskStatusEnum,
} from '../_lib/schema/task.schema';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => void;
  defaultValues?: Partial<CreateTaskInput>;
  isSubmitting?: boolean;
}

export function TaskForm({
  onSubmit,
  defaultValues,
  isSubmitting,
}: TaskFormProps) {
  const form = useForm({
    resolver: zodResolver(CreateTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'do',
      priority: 'medium',
      subtasks: [],
      ...defaultValues,
    },
  });

  const handleSubmit = useCallback(
    (data: CreateTaskInput) => {
      onSubmit(data);
      form.reset();
    },
    [onSubmit, form],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Task title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Task description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TaskStatusEnum.options.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'do'
                          ? 'To Do'
                          : status === 'doing'
                            ? 'In Progress'
                            : 'Done'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TaskPriorityEnum.options.map((priority) => (
                      <SelectItem
                        key={priority}
                        value={priority}
                        className={cn(
                          priority === 'high' && 'text-destructive',
                          priority === 'medium' && 'text-warning',
                          priority === 'low' && 'text-success',
                        )}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="subtasks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtasks</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {field.value?.map((subtask, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="Subtask title"
                          value={subtask.title}
                          onChange={(e) => {
                            const newSubtasks = [...(field.value || [])];
                            newSubtasks[index] = {
                              ...newSubtasks[index],
                              title: e.target.value,
                              is_completed:
                                newSubtasks[index]?.is_completed ?? false,
                            };
                            field.onChange(newSubtasks);
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newSubtasks = [...(field.value || [])];
                            newSubtasks.splice(index, 1);
                            field.onChange(newSubtasks);
                          }}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        field.onChange([
                          ...(field.value || []),
                          { title: '', is_completed: false } as const,
                        ]);
                      }}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Add Subtask
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : defaultValues
              ? 'Update Task'
              : 'Create Task'}
        </Button>
      </form>
    </Form>
  );
}
