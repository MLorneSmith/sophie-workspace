"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@kit/ui/chart";
import {
	PolarAngleAxis,
	PolarGrid,
	Radar,
	RadarChart as RechartsRadarChart,
} from "recharts";

export interface CategoryScores {
	[key: string]: number;
}

const chartConfig = {
	score: {
		label: "Score",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

export function RadarChart({
	categoryScores = {},
}: {
	categoryScores?: CategoryScores;
}) {
	// Handle empty or undefined category scores
	if (!categoryScores || Object.keys(categoryScores).length === 0) {
		return (
			<Card>
				<CardHeader className="items-center pb-4">
					<CardTitle>
						<span className="text-xl font-semibold">Survey Results</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="text-muted-foreground pb-0 text-center">
					<p>No category scores available</p>
				</CardContent>
			</Card>
		);
	}

	const chartData = Object.entries(categoryScores).map(([category, score]) => ({
		category,
		score,
	}));

	return (
		<Card>
			<CardHeader className="items-center pb-4">
				<CardTitle>
					<span className="text-xl font-semibold">Survey Results</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-[250px]"
				>
					<RechartsRadarChart data={chartData}>
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<PolarAngleAxis dataKey="category" />
						<PolarGrid />
						<Radar
							dataKey="score"
							fill="var(--color-score)"
							fillOpacity={0.6}
						/>
					</RechartsRadarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
