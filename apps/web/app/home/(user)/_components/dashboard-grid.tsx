"use client";

import {
	ArrowRight,
	BookOpen,
	ClipboardList,
	KanbanSquare,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";

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

interface SuggestedAction {
	icon: React.ElementType;
	label: string;
	description: string;
	href: string;
	accentClass: string;
}

function getSuggestedActions(data: DashboardData): SuggestedAction[] {
	const actions: SuggestedAction[] = [];

	if (data.skillsRadar === null) {
		actions.push({
			icon: ClipboardList,
			label: "Take Assessment",
			description: "Discover your presentation strengths",
			href: "/home/assessment/survey",
			accentClass: "text-indigo-600 dark:text-indigo-400",
		});
	}

	if (data.courseProgress === null) {
		actions.push({
			icon: BookOpen,
			label: "Start Course",
			description: "Learn proven presentation techniques",
			href: "/home/course",
			accentClass: "text-teal-600 dark:text-teal-400",
		});
	}

	if (data.kanbanSummary === null) {
		actions.push({
			icon: KanbanSquare,
			label: "Plan Tasks",
			description: "Organize your presentation prep",
			href: "/home/kanban",
			accentClass: "text-amber-600 dark:text-amber-400",
		});
	}

	return actions;
}

function SuggestedActionsCard({ actions }: { actions: SuggestedAction[] }) {
	return (
		<Card className="border-dashed bg-muted/30">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Suggested Next
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{actions.map((action) => {
					const Icon = action.icon;
					return (
						<Link
							key={action.href}
							href={action.href}
							className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
						>
							<Icon
								className={`h-4 w-4 shrink-0 ${action.accentClass}`}
								aria-hidden="true"
							/>
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium">{action.label}</p>
								<p className="truncate text-xs text-muted-foreground">
									{action.description}
								</p>
							</div>
							<ArrowRight
								className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
								aria-hidden="true"
							/>
						</Link>
					);
				})}
			</CardContent>
		</Card>
	);
}

/** Determine responsive grid class based on child count */
function gridColsClass(count: number): string {
	if (count >= 3) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
	if (count === 2) return "grid-cols-1 md:grid-cols-2";
	return "grid-cols-1";
}

export function DashboardGrid({ data }: DashboardGridProps) {
	if (isNewUser(data)) {
		return (
			<div className="space-y-6">
				<WelcomeHero />
			</div>
		);
	}

	const hasProgress = data.courseProgress !== null;
	const hasSkills = data.skillsRadar !== null;
	const hasKanban = data.kanbanSummary !== null;
	const hasCoaching = data.coachingSessions.length > 0;
	const hasPresentations = data.presentations.length > 0;

	// Build Row 1: only populated widgets + optional suggestions
	const row1Widgets: ReactNode[] = [];
	if (hasProgress) {
		row1Widgets.push(
			<CourseProgressRadial key="progress" data={data.courseProgress} />,
		);
	}
	if (hasSkills) {
		row1Widgets.push(
			<SkillsSpiderDiagram
				key="skills"
				categoryScores={data.skillsRadar?.categoryScores ?? null}
			/>,
		);
	}
	if (hasKanban) {
		row1Widgets.push(
			<KanbanSummaryCard key="kanban" kanbanSummary={data.kanbanSummary} />,
		);
	}

	const suggestions = getSuggestedActions(data);
	if (suggestions.length > 0) {
		row1Widgets.push(
			<SuggestedActionsCard key="suggestions" actions={suggestions} />,
		);
	}

	const row1Cols = gridColsClass(row1Widgets.length);

	return (
		<div className="space-y-6">
			{/* Row 1: Populated widgets + suggested actions */}
			{row1Widgets.length > 0 && (
				<div className={`grid gap-6 ${row1Cols}`}>{row1Widgets}</div>
			)}

			{/* Row 2: Activity & Coaching */}
			<div
				className={`grid grid-cols-1 gap-6 ${hasCoaching ? "md:grid-cols-2" : ""}`}
			>
				<RecentActivityFeed activities={data.activities} />

				{hasCoaching && (
					<CoachingSessionsCard sessions={data.coachingSessions} />
				)}
			</div>

			{/* Row 3: Presentations Table */}
			{hasPresentations && (
				<PresentationsTable presentations={data.presentations} />
			)}
		</div>
	);
}
