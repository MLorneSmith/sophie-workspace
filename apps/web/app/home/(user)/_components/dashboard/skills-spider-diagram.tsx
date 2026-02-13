"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@kit/ui/chart";
import { EmptyStateButton } from "@kit/ui/empty-state";
import Link from "next/link";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

const chartConfig = {
	score: {
		label: "Score",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

interface SkillsSpiderDiagramProps {
	categoryScores?: Record<string, number> | null;
}

function transformCategoryScores(
	categoryScores: Record<string, number> | null | undefined,
) {
	if (!categoryScores || Object.keys(categoryScores).length === 0) {
		return null;
	}

	return Object.entries(categoryScores).map(([category, score]) => ({
		category,
		score,
	}));
}

export function SkillsSpiderDiagram({
	categoryScores,
}: SkillsSpiderDiagramProps) {
	const chartData = transformCategoryScores(categoryScores);

	if (!chartData) {
		return (
			<Card className="border-l-4 border-l-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20">
				<CardHeader className="pb-2">
					<CardTitle className="font-heading">Skills Assessment</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col items-center justify-center gap-3 py-6 text-center">
					<p className="text-sm text-muted-foreground">
						Discover your strengths across 5 presentation skill categories.
					</p>
					<EmptyStateButton asChild>
						<Link href="/home/assessment/survey">Take Assessment</Link>
					</EmptyStateButton>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-l-4 border-l-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20">
			<CardHeader className="items-center pb-4">
				<CardTitle className="font-heading">Skills Assessment</CardTitle>
			</CardHeader>
			<CardContent className="pb-0">
				<div
					role="img"
					aria-label={`Skills assessment results across ${chartData.length} categories: ${chartData.map((d) => `${d.category} ${d.score}`).join(", ")}`}
					aria-describedby="skills-chart-desc"
				>
					<p id="skills-chart-desc" className="sr-only">
						{`Radar chart showing skill scores: ${chartData.map((d) => `${d.category}: ${d.score} out of 100`).join(". ")}.`}
					</p>
					<ChartContainer
						config={chartConfig}
						className="mx-auto aspect-square max-h-[250px]"
					>
						<RadarChart data={chartData}>
							<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
							<PolarAngleAxis dataKey="category" />
							<PolarGrid />
							<Radar
								dataKey="score"
								fill="var(--color-score)"
								fillOpacity={0.6}
							/>
						</RadarChart>
					</ChartContainer>
				</div>
			</CardContent>
		</Card>
	);
}
