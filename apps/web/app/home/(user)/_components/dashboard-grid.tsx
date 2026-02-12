"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

import type { DashboardData } from "../_lib/dashboard/types";

interface DashboardGridProps {
	data: DashboardData;
}

export function DashboardGrid({ data }: DashboardGridProps) {
	return (
		<div className="dashboard-grid space-y-6">
			{/* Row 1: Progress Widgets */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				<Card className="h-64">
					<CardHeader>
						<CardTitle>Course Progress</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							{data.courseProgress
								? `${data.courseProgress.completedLessons} of ${data.courseProgress.totalLessons} lessons completed`
								: "No course progress yet"}
						</p>
					</CardContent>
				</Card>

				<Card className="h-64">
					<CardHeader>
						<CardTitle>Skills Radar</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							{data.skillsRadar
								? `Strongest: ${data.skillsRadar.highestCategory ?? "N/A"}`
								: "No assessment data yet"}
						</p>
					</CardContent>
				</Card>

				<Card className="h-64">
					<CardHeader>
						<CardTitle>Kanban Summary</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							{data.kanbanSummary
								? `${data.kanbanSummary.doingCount} tasks in progress`
								: "No tasks yet"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Row 2: Activity & Actions Widgets */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				<Card className="h-64">
					<CardHeader>
						<CardTitle>Activity Feed</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							{data.activityFeed.length > 0
								? `${data.activityFeed.length} recent activities`
								: "No recent activity"}
						</p>
					</CardContent>
				</Card>

				<Card className="h-64">
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							{data.quickActions.length > 0
								? `${data.quickActions.length} actions available`
								: "No actions available"}
						</p>
					</CardContent>
				</Card>

				<Card className="h-64">
					<CardHeader>
						<CardTitle>Coaching Sessions</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							{data.coachingSessions.length > 0
								? `${data.coachingSessions.length} sessions`
								: "No upcoming sessions"}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Row 3: Full-Width Presentations Table */}
			<div className="grid grid-cols-1">
				<Card className="h-96">
					<CardHeader>
						<CardTitle>Presentations Table</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							{data.presentations.length > 0
								? `${data.presentations.length} presentations`
								: "No presentations yet"}
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
