"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

import type { ActivityItem as ActivityItemType } from "../_lib/types/activity.types";
import { ActivityEmptyState } from "./activity-empty-state";
import { ActivityItem } from "./activity-item";

interface RecentActivityFeedProps {
	activities: ActivityItemType[];
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
	if (activities.length === 0) {
		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<ActivityEmptyState />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-0">
					{activities.map((activity, index) => (
						<ActivityItem
							key={activity.id}
							activity={activity}
							isLast={index === activities.length - 1}
						/>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}
