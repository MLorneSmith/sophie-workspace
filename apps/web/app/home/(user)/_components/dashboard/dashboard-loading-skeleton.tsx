"use client";

import { WidgetSkeletonCard } from "./widget-skeleton-card";

export function DashboardLoadingSkeleton() {
	return (
		<div className="space-y-6">
			{/* Row 1: Progress Widgets */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				<WidgetSkeletonCard height="h-64" label="Course Progress" />
				<WidgetSkeletonCard height="h-64" label="Skills" />
				<WidgetSkeletonCard height="h-64" label="Current Tasks" />
			</div>

			{/* Row 2: Activity & Actions Widgets */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				<WidgetSkeletonCard height="h-64" label="Activity Feed" />
				<WidgetSkeletonCard height="h-64" label="Quick Actions" />
				<WidgetSkeletonCard height="h-64" label="Coaching Sessions" />
			</div>

			{/* Row 3: Full-Width Presentations Table */}
			<div className="grid grid-cols-1">
				<WidgetSkeletonCard height="h-48" label="Presentations" />
			</div>
		</div>
	);
}
