"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { type ChartConfig, ChartContainer } from "@kit/ui/chart";
import { Cell, Pie, PieChart } from "recharts";

const chartConfig = {
	completed: {
		label: "Completed",
		color: "hsl(var(--chart-1))",
	},
	remaining: {
		label: "Remaining",
		color: "hsl(var(--muted))",
	},
} satisfies ChartConfig;

const MOCK_PROGRESS = 75;

const mockData = [
	{ name: "Completed", value: MOCK_PROGRESS },
	{ name: "Remaining", value: 100 - MOCK_PROGRESS },
];

export function CourseProgressRadial() {
	return (
		<Card className="h-64">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium">Course Progress</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center pb-4">
				<div className="relative">
					<ChartContainer
						config={chartConfig}
						className="mx-auto aspect-square max-h-[150px]"
					>
						<PieChart>
							<Pie
								data={mockData}
								cx="50%"
								cy="50%"
								innerRadius={45}
								outerRadius={65}
								dataKey="value"
								startAngle={90}
								endAngle={-270}
								strokeWidth={0}
							>
								<Cell fill="var(--color-completed)" />
								<Cell fill="var(--color-remaining)" />
							</Pie>
						</PieChart>
					</ChartContainer>

					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<span className="text-2xl font-bold">{MOCK_PROGRESS}%</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
