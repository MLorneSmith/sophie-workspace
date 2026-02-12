"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@kit/ui/chart";
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

const MOCK_DATA = [
	{ category: "Structure", score: 75 },
	{ category: "Story", score: 60 },
	{ category: "Substance", score: 85 },
	{ category: "Style", score: 70 },
	{ category: "Self-Confidence", score: 55 },
];

export function SkillsSpiderDiagram({
	categoryScores,
}: SkillsSpiderDiagramProps) {
	const chartData = categoryScores
		? Object.entries(categoryScores).map(([category, score]) => ({
				category,
				score,
			}))
		: MOCK_DATA;

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
