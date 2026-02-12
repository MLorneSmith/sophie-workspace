"use client";

import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import type { ActivityItem as ActivityItemType } from "../_lib/types/activity.types";
import { getActivityIcon } from "../_lib/utils/activity-icon-map";

interface ActivityItemProps {
	activity: ActivityItemType;
	isLast?: boolean;
}

export function ActivityItem({ activity, isLast = false }: ActivityItemProps) {
	const { icon: Icon, colorClass } = getActivityIcon(activity.activity_type);

	const relativeTime = formatDistanceToNow(new Date(activity.timestamp), {
		addSuffix: true,
	});

	const content = (
		<li
			className={`relative flex list-none gap-3 pb-4 pl-6 ${!isLast ? "border-l-2 border-border" : ""}`}
			aria-label={`${activity.title} — ${relativeTime}`}
		>
			<div
				className={`absolute -left-2 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-2 ring-border ${colorClass}`}
			>
				<Icon className="h-2.5 w-2.5" />
			</div>

			<div className="min-w-0 flex-1">
				<p className="text-foreground truncate text-sm font-medium">
					{activity.title}
				</p>
				<p className="text-muted-foreground text-xs">{relativeTime}</p>
			</div>
		</li>
	);

	if (activity.link) {
		return (
			<Link href={activity.link} className="block">
				{content}
			</Link>
		);
	}

	return content;
}
