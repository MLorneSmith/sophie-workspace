"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

export function DashboardGrid() {
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
							Course progress widget placeholder
						</p>
					</CardContent>
				</Card>

				<Card className="h-64">
					<CardHeader>
						<CardTitle>Skills Radar</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							Skills radar widget placeholder
						</p>
					</CardContent>
				</Card>

				<Card className="h-64">
					<CardHeader>
						<CardTitle>Kanban Summary</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							Kanban summary widget placeholder
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
							Activity feed widget placeholder
						</p>
					</CardContent>
				</Card>

				<Card className="h-64">
					<CardHeader>
						<CardTitle>Quick Actions</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							Quick actions widget placeholder
						</p>
					</CardContent>
				</Card>

				<Card className="h-64">
					<CardHeader>
						<CardTitle>Coaching Sessions</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							Coaching sessions widget placeholder
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
							Presentations table widget placeholder
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
