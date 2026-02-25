"use client";

import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import { DataTable } from "@kit/ui/enhanced-data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";

import type { PresentationData } from "../_lib/dashboard/types";

function getColumns(): ColumnDef<PresentationData>[] {
	return [
		{
			id: "title",
			header: "Title",
			cell: ({ row }) => {
				return (
					<span className="block max-w-[200px] truncate font-medium sm:max-w-none">
						{row.original.submission.title ?? "Untitled"}
					</span>
				);
			},
		},
		{
			id: "created_at",
			header: () => <span className="hidden sm:inline">Created</span>,
			cell: ({ row }) => {
				const date = row.original.submission.created_at;

				if (!date)
					return (
						<span className="hidden text-muted-foreground sm:inline">—</span>
					);

				return (
					<span className="hidden sm:inline">
						{new Date(date).toLocaleDateString("en-US", {
							month: "short",
							day: "numeric",
							year: "numeric",
						})}
					</span>
				);
			},
		},
		{
			id: "status",
			header: "Status",
			cell: ({ row }) => {
				const hasStoryboard = row.original.hasStoryboard;

				return (
					<Badge variant={hasStoryboard ? "default" : "secondary"}>
						{hasStoryboard ? "Complete" : "Draft"}
					</Badge>
				);
			},
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				return (
					<div className="flex justify-end">
						<Button variant="ghost" size="icon" asChild>
							<Link
								href={`/home/ai/storyboard/${row.original.submission.id}`}
								aria-label={`Edit presentation: ${row.original.submission.title ?? "Untitled"}`}
							>
								<Pencil className="h-4 w-4" aria-hidden="true" />
							</Link>
						</Button>
					</div>
				);
			},
		},
	];
}

export function PresentationsTable({
	presentations,
}: {
	presentations: PresentationData[];
}) {
	return (
		<Card className="border-l-4 border-l-[#2431E0]">
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="font-heading">Your Presentations</CardTitle>
					<CardDescription>Recent presentation outlines</CardDescription>
				</div>

				<Button asChild size="sm">
					<Link href="/home/ai/storyboard" aria-label="Create new presentation">
						<Plus className="mr-2 h-4 w-4" aria-hidden="true" />
						New Presentation
					</Link>
				</Button>
			</CardHeader>

			<CardContent className="w-full">
				<section
					className="overflow-x-auto"
					aria-label={`Presentations list with ${presentations.length} items`}
				>
					<DataTable data={presentations} columns={getColumns()} />
				</section>
			</CardContent>
		</Card>
	);
}
