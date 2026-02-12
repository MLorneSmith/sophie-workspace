"use client";

import type { DashboardData } from "../_lib/dashboard/types";
import { CoachingSessionsCard } from "./coaching-sessions-card";
import { CourseProgressRadial } from "./dashboard/course-progress-radial";
import QuickActionsPanel from "./quick-actions-panel";
import { RecentActivityFeed } from "./recent-activity-feed";
import { SkillsSpiderDiagram } from "./dashboard/skills-spider-diagram";
import { KanbanSummaryCard } from "./kanban-summary-card";
import { PresentationsTable } from "./presentations-table";

interface DashboardGridProps {
	data: DashboardData;
}

export function DashboardGrid({ data }: DashboardGridProps) {
	return (
		<div className="dashboard-grid space-y-6">
			{/* Row 1: Progress Widgets */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				<CourseProgressRadial data={data.courseProgress} />

				<SkillsSpiderDiagram
					categoryScores={data.skillsRadar?.categoryScores ?? null}
				/>

				<KanbanSummaryCard kanbanSummary={data.kanbanSummary} />
			</div>

			{/* Row 2: Activity & Actions Widgets */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				<RecentActivityFeed activities={data.activities} />

				<QuickActionsPanel
					courseInProgress={data.quickActionsContext.courseInProgress}
					assessmentCompleted={data.quickActionsContext.assessmentCompleted}
					hasPresentationDrafts={data.quickActionsContext.hasPresentationDrafts}
				/>

				<CoachingSessionsCard sessions={data.coachingSessions} />
			</div>

			{/* Row 3: Full-Width Presentations Table */}
			<div className="grid grid-cols-1">
				<PresentationsTable presentations={data.presentations} />
			</div>
		</div>
	);
}
