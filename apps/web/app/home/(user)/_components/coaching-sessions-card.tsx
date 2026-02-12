"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { Calendar } from "lucide-react";

import type { CoachingSessionData } from "../_lib/dashboard/types";

interface CoachingSessionsCardProps {
	sessions?: CoachingSessionData[] | null;
}

export function CoachingSessionsCard({ sessions }: CoachingSessionsCardProps) {
	return (
		<Card className="flex h-64 flex-col">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2">
					<Calendar className="h-4 w-4" />
					Coaching Sessions
				</CardTitle>
			</CardHeader>

			<CardContent className="flex-1">
				<p className="text-muted-foreground text-sm">
					{sessions && sessions.length > 0
						? `${sessions.length} upcoming`
						: "No upcoming sessions"}
				</p>
			</CardContent>
		</Card>
	);
}
