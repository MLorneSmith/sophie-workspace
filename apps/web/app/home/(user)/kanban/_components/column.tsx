"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { Trans } from "@kit/ui/trans";
import { cn } from "@kit/ui/utils";
import { Loader2Icon } from "lucide-react";

import type { Task } from "../_lib/schema/task.schema";
import { TaskCard } from "./task-card";

interface ColumnProps {
	id: string;
	title: string;
	tasks: Task[];
	updatingTaskId: string | null;
}

export function Column({
	id,
	title: _title,
	tasks,
	updatingTaskId,
}: ColumnProps) {
	const { setNodeRef } = useDroppable({
		id,
		data: { type: "column" },
	});

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between pb-4">
				<h3 className="text-lg font-semibold">
					<Trans i18nKey={`kanban:task.status.${id}`} />
				</h3>
				<div className="text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 text-sm font-medium">
					{tasks.length}
				</div>
			</div>

			<div
				ref={setNodeRef}
				className={cn(
					"bg-muted/40 relative flex flex-1 flex-col gap-2 rounded-lg border p-4",
					tasks.length === 0 && "items-center justify-center",
				)}
			>
				{tasks.length === 0 ? (
					<p className="text-muted-foreground text-center text-sm">
						<Trans i18nKey="kanban:task.dropHint" />
					</p>
				) : (
					<SortableContext
						items={tasks.map((t) => t.id)}
						strategy={rectSortingStrategy}
					>
						{tasks.map((task) => (
							<div key={task.id} className="relative">
								<TaskCard task={task} />
								{updatingTaskId === task.id && (
									<div className="bg-background/50 absolute inset-0 flex items-center justify-center rounded-lg backdrop-blur-sm">
										<Loader2Icon className="h-6 w-6 animate-spin" />
									</div>
								)}
							</div>
						))}
					</SortableContext>
				)}
			</div>
		</div>
	);
}
