"use client";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Alert, AlertDescription } from "@kit/ui/alert";
import { Button } from "@kit/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@kit/ui/tooltip";
import { Trans } from "@kit/ui/trans";
import {
	AlertCircleIcon,
	PlusIcon,
	RefreshCcwIcon,
	RotateCcwIcon,
} from "lucide-react";
import { useCallback, useState } from "react";

import {
	useResetTasks,
	useTasks,
	useUpdateTaskStatus,
} from "../_lib/hooks/use-tasks";
import type { Task, TaskStatus } from "../_lib/schema/task.schema";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";


const COLUMNS = [
	{ id: "do", title: "To Do" },
	{ id: "doing", title: "In Progress" },
	{ id: "done", title: "Done" },
] as const;

export function KanbanBoard() {
	const { data: tasks, isLoading, isError, refetch } = useTasks();
	const updateStatus = useUpdateTaskStatus();
	const resetTasks = useResetTasks();
	const [activeId, setActiveId] = useState<string | null>(null);
	const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const activeTask = tasks?.find((task) => task.id === activeId);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			// Require movement before activating drag
			activationConstraint: {
				distance: 8, // 8px of movement required before drag starts
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragStart = useCallback((event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	}, []);

	const handleDragEnd = useCallback(
		async (event: DragEndEvent) => {
			const { active, over } = event;

			if (!over || !tasks) return;

			const activeTask = tasks.find((t) => t.id === active.id);
			const overId = over.id as Task["status"];

			// If dragging to a column
			if (COLUMNS.some((col) => col.id === overId)) {
				if (activeTask && activeTask.status !== overId) {
					setUpdatingTaskId(activeTask.id);
					try {
						await updateStatus.mutateAsync({
							id: activeTask.id,
							status: overId as TaskStatus,
						// });
					} catch (error) {
						// TODO: Async logger needed
		// TODO: Async logger needed
		// (await getLogger()).error(
		// 	"Failed to update task status:",
		// 	{ data: error }
		// );
					} finally {
						setUpdatingTaskId(null);
					}
				}
			}

			setActiveId(null);
		},
		[tasks, updateStatus],
	);

	if (isError) {
		return (
			<Alert variant="destructive" className="mx-auto max-w-lg">
				<AlertCircleIcon className="h-4 w-4" />
				<AlertDescription className="flex items-center gap-4">
					<Trans i18nKey="common:genericServerError" />
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						className="ml-auto"
					>
						<RefreshCcwIcon className="mr-2 h-4 w-4" />
						<Trans i18nKey="common:tryAgain" />
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	if (isLoading) {
		return (
			<div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
				{COLUMNS.map((column) => (
					<div
						key={column.id}
						className="flex h-full w-full flex-col space-y-4"
					>
						<div className="flex items-center justify-between">
							<div className="bg-muted/40 h-6 w-20 animate-pulse rounded" />
							<div className="bg-muted/40 h-6 w-6 animate-pulse rounded-full" />
						</div>
						<div className="bg-muted/40 flex-1 animate-pulse rounded-lg p-4">
							<div className="space-y-4">
								<div className="bg-background/40 h-24 animate-pulse rounded-lg" />
								<div className="bg-background/40 h-24 animate-pulse rounded-lg" />
								<div className="bg-background/40 h-24 animate-pulse rounded-lg" />
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<>
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-2xl font-semibold">
					<Trans i18nKey="common:routes.kanban" />
				</h1>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								onClick={() => resetTasks.mutate({})}
								disabled={resetTasks.isPending}
							>
								<RotateCcwIcon className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<Trans i18nKey="kanban:task.resetTooltip" />
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
					{COLUMNS.map((column) => (
						<Column
							key={column.id}
							id={column.id}
							title={column.title}
							tasks={tasks?.filter((task) => task.status === column.id) ?? []}
							updatingTaskId={updatingTaskId}
						/>
					))}
				</div>

				<DragOverlay>
					{activeTask ? <TaskCard task={activeTask} /> : null}
				</DragOverlay>
			</DndContext>

			<Button
				onClick={() => setIsDialogOpen(true)}
				className="fixed right-8 bottom-8 h-12 w-12 rounded-full p-0 shadow-lg"
			>
				<PlusIcon className="h-6 w-6" />
			</Button>

			<TaskDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
		</>
	);
}
