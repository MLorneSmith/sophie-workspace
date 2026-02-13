"use client";

import type { DashboardData } from "../_lib/dashboard/types";
import { CoachingSessionsCard } from "./coaching-sessions-card";
import { CourseProgressRadial } from "./dashboard/course-progress-radial";
import { RecentActivityFeed } from "./recent-activity-feed";
import { SkillsSpiderDiagram } from "./dashboard/skills-spider-diagram";
import { KanbanSummaryCard } from "./kanban-summary-card";
import { PresentationsTable } from "./presentations-table";
import { WelcomeHero } from "./welcome-hero";

interface DashboardGridProps {
	data: DashboardData;
}

function isNewUser(data: DashboardData): boolean {
	return (
		data.courseProgress === null &&
		data.skillsRadar === null &&
		data.kanbanSummary === null &&
		data.activities.length === 0 &&
		data.presentations.length === 0
	);
}

export function DashboardGrid({ data }: DashboardGridProps) {
	if (isNewUser(data)) {
		return (
			<div className="dashboard-grid space-y-6">
				<WelcomeHero />
			</div>
		);
	}

	const hasCoachingSessions = data.coachingSessions.length > 0;
	const hasPresentations = data.presentations.length > 0;

	return (
		<div className="dashboard-grid space-y-6">
			{/* Row 1: Progress & Skills */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
				<CourseProgressRadial data={data.courseProgress} />

				<SkillsSpiderDiagram
					categoryScores={data.skillsRadar?.categoryScores ?? null}
				/>

				<KanbanSummaryCard kanbanSummary={data.kanbanSummary} />
			</div>

			{/* Row 2: Activity & Coaching (only show widgets that have content) */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<RecentActivityFeed activities={data.activities} />

				{hasCoachingSessions && (
					<CoachingSessionsCard sessions={data.coachingSessions} />
				)}
			</div>

			{/* Row 3: Presentations Table (only when data exists) */}
			{hasPresentations && (
				<PresentationsTable presentations={data.presentations} />
			)}
		</div>
	);
}
