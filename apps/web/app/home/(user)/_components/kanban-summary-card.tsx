"use client";

import { Badge } from "@kit/ui/badge";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import {
	EmptyState,
	EmptyStateButton,
	EmptyStateHeading,
	EmptyStateText,
} from "@kit/ui/empty-state";
import { Skeleton } from "@kit/ui/skeleton";
import { ClipboardList } from "lucide-react";
import Link from "next/link";

import type { KanbanSummaryData } from "../_lib/dashboard/types";

const priorityVariant = {
	low: "info",
	medium: "warning",
	high: "destructive",
} as const;

interface KanbanSummaryCardProps {
	kanbanSummary?: KanbanSummaryData | null;
}

export function KanbanSummaryCard({ kanbanSummary }: KanbanSummaryCardProps) {
	if (kanbanSummary === undefined) {
		return <KanbanSummaryCardSkeleton />;
	}

	const doingCount = kanbanSummary?.doingCount ?? 0;

	return (
		<Card className="flex flex-col border-l-4 border-l-amber-500">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<ClipboardList className="h-4 w-4" aria-hidden="true" />
						Current Tasks
					</CardTitle>
					{doingCount > 0 && (
						<Badge variant="secondary" data-testid="doing-count-badge">
							{doingCount} in progress
						</Badge>
					)}
				</div>
			</CardHeader>

			<CardContent className="flex-1">
				{doingCount === 0 ? (
					<EmptyState>
						<EmptyStateHeading>No tasks in progress</EmptyStateHeading>
						<EmptyStateText>
							Move a task to &quot;Doing&quot; to see it here
						</EmptyStateText>
						<EmptyStateButton asChild>
							<Link href="/home/kanban">View Kanban</Link>
						</EmptyStateButton>
					</EmptyState>
				) : (
					<TaskPreview kanbanSummary={kanbanSummary} />
				)}
			</CardContent>

			{doingCount > 0 && (
				<CardFooter className="pt-0">
					<Link
						href="/home/kanban"
						className="text-muted-foreground hover:text-foreground text-sm transition-colors"
						data-testid="view-kanban-link"
						aria-label={`View all ${doingCount} in-progress tasks in Kanban board`}
					>
						View Kanban &rarr;
					</Link>
				</CardFooter>
			)}
		</Card>
	);
}

function TaskPreview({
	kanbanSummary,
}: {
	kanbanSummary: KanbanSummaryData | null;
}) {
	const nextTask = kanbanSummary?.nextTask;

	if (!nextTask) {
		return null;
	}

	return (
		<div className="space-y-3" data-testid="task-preview">
			<div className="rounded-md border p-3">
				<div className="flex items-start justify-between gap-2">
					<p className="truncate text-sm font-medium leading-tight">
						{nextTask.title}
					</p>
					<Badge
						variant={
							priorityVariant[
								nextTask.priority as keyof typeof priorityVariant
							] ?? "secondary"
						}
						data-testid="priority-badge"
					>
						{nextTask.priority}
					</Badge>
				</div>
			</div>
			{kanbanSummary && kanbanSummary.totalTasks > 0 && (
				<output
					className="flex gap-3 text-xs text-muted-foreground"
					aria-label={`Task status summary: ${kanbanSummary.statusCounts.do ?? 0} to do, ${kanbanSummary.statusCounts.doing ?? 0} doing, ${kanbanSummary.statusCounts.done ?? 0} done`}
				>
					<span>{kanbanSummary.statusCounts.do ?? 0} to do</span>
					<span>{kanbanSummary.statusCounts.doing ?? 0} doing</span>
					<span>{kanbanSummary.statusCounts.done ?? 0} done</span>
				</output>
			)}
		</div>
	);
}

function KanbanSummaryCardSkeleton() {
	return (
		<Card
			className="flex flex-col border-l-4 border-l-amber-500"
			data-testid="kanban-summary-skeleton"
		>
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-5 w-20" />
				</div>
			</CardHeader>
			<CardContent className="flex-1 space-y-3">
				<Skeleton className="h-16 w-full rounded-md" />
				<div className="flex gap-3">
					<Skeleton className="h-3 w-12" />
					<Skeleton className="h-3 w-12" />
					<Skeleton className="h-3 w-12" />
				</div>
			</CardContent>
		</Card>
	);
}
