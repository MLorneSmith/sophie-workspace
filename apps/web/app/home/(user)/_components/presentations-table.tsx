"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@kit/ui/enhanced-data-table";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";

import type { PresentationData } from "../_lib/dashboard/types";

const columns: ColumnDef<PresentationData>[] = [];

export function PresentationsTable({
	presentations,
}: {
	presentations: PresentationData[];
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Your Presentations</CardTitle>
				<CardDescription>Recent presentation outlines</CardDescription>
			</CardHeader>

			<CardContent>
				<DataTable data={presentations} columns={columns} />
			</CardContent>
		</Card>
	);
}
