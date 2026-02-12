"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@kit/ui/enhanced-data-table";
import { Badge } from "@kit/ui/badge";
import { Button } from "@kit/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import { Plus } from "lucide-react";
import Link from "next/link";

import type { PresentationData } from "../_lib/dashboard/types";

function getColumns(): ColumnDef<PresentationData>[] {
	return [
		{
			id: "title",
			header: "Title",
			cell: ({ row }) => {
				return (
					<span className="font-medium">
						{row.original.submission.title ?? "Untitled"}
					</span>
				);
			},
		},
		{
			id: "created_at",
			header: "Created",
			cell: ({ row }) => {
				const date = row.original.submission.created_at;

				if (!date) return <span className="text-muted-foreground">—</span>;

				return new Date(date).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
					year: "numeric",
				});
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
			cell: () => {
				return null;
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
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Your Presentations</CardTitle>
					<CardDescription>Recent presentation outlines</CardDescription>
				</div>

				<Button asChild>
					<Link href="/home/ai/storyboard">
						<Plus className="mr-2 h-4 w-4" />
						New Presentation
					</Link>
				</Button>
			</CardHeader>

			<CardContent>
				<DataTable data={presentations} columns={getColumns()} />
			</CardContent>
		</Card>
	);
}
