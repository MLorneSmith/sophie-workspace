"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@kit/ui/chart";
import {
	EmptyState,
	EmptyStateButton,
	EmptyStateHeading,
	EmptyStateText,
} from "@kit/ui/empty-state";
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
			<Card>
				<CardHeader className="items-center pb-4">
					<CardTitle>Skills Assessment</CardTitle>
				</CardHeader>
				<CardContent>
					<EmptyState>
						<EmptyStateHeading>No Assessment Yet</EmptyStateHeading>
						<EmptyStateText>
							Complete your self-assessment to see your skills profile
						</EmptyStateText>
						<EmptyStateButton asChild>
							<Link href="/home/assessment/survey">Take Assessment</Link>
						</EmptyStateButton>
					</EmptyState>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="items-center pb-4">
				<CardTitle>Skills Assessment</CardTitle>
			</CardHeader>
			<CardContent className="pb-0">
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
			</CardContent>
		</Card>
	);
}
