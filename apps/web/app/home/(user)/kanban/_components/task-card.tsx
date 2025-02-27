'use client';

import { forwardRef, useState } from 'react';

import Image from 'next/image';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  CheckCircle2Icon,
  AlertCircleIcon as _AlertCircleIcon,
  Loader2Icon as _Loader2Icon,
} from 'lucide-react';

import {
  Alert as _Alert,
  AlertDescription as _AlertDescription,
} from '@kit/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Checkbox } from '@kit/ui/checkbox';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { useUpdateSubtask } from '../_lib/hooks/use-tasks';
import type { Subtask, Task } from '../_lib/schema/task.schema';
import { TaskDialog } from './task-dialog';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task }, _ref) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const updateSubtask = useUpdateSubtask();
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const completedSubtasks =
      task.subtasks?.filter((s) => s.is_completed).length ?? 0;
    const totalSubtasks = task.subtasks?.length ?? 0;

    return (
      <>
        <div ref={setNodeRef}>
          <Card
            style={style}
            className={cn(
              'relative',
              'cursor-grab touch-none',
              isDragging && 'opacity-50',
              task.priority === 'high' &&
                'border-l-destructive hover:border-l-destructive/80 border-l-4',
              task.priority === 'medium' &&
                'border-l-warning hover:border-l-warning/80 border-l-4',
              task.priority === 'low' &&
                'border-l-success hover:border-l-success/80 border-l-4',
            )}
            onClick={(_e) => {
              if (!isDragging) {
                setIsDialogOpen(true);
              }
            }}
            {...attributes}
            {...listeners}
          >
            <CardHeader className="space-y-3 p-4 pb-2">
              <CardTitle className="text-base">{task.title}</CardTitle>
              {task.image_url && (
                <div className="relative h-32 w-full overflow-hidden rounded-lg">
                  <Image
                    src={task.image_url}
                    alt={task.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}
              {task.description && (
                <CardDescription className="line-clamp-2">
                  {task.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4 p-4 pt-0">
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <CheckCircle2Icon className="h-4 w-4" />
                    <span className="text-muted-foreground">
                      {completedSubtasks} / {totalSubtasks}{' '}
                      <Trans i18nKey="kanban:task.form.subtasks" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    {task.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                        onMouseDown={(e) => {
                          // Prevent drag initiation when clicking subtasks
                          e.stopPropagation();
                        }}
                      >
                        <div className="relative z-20">
                          <Checkbox
                            id={subtask.id}
                            checked={subtask.is_completed}
                            disabled={(subtask as Subtask).isUpdating}
                            onCheckedChange={(checked) => {
                              updateSubtask.mutate({
                                id: subtask.id!,
                                task_id: task.id,
                                title: subtask.title,
                                is_completed: checked as boolean,
                              });
                            }}
                          />
                        </div>
                        <label
                          htmlFor={subtask.id}
                          className={cn(
                            'text-sm',
                            subtask.is_completed &&
                              'text-muted-foreground decoration-muted-foreground line-through',
                          )}
                        >
                          {subtask.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <TaskDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          task={task}
        />
      </>
    );
  },
);

TaskCard.displayName = 'TaskCard';
