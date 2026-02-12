"use client";

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { type ChartConfig, ChartContainer } from "@kit/ui/chart";
import Link from "next/link";
import { Cell, Pie, PieChart } from "recharts";

import type { CourseProgressData } from "../../_lib/dashboard/types";

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

interface CourseProgressRadialProps {
	data: CourseProgressData | null;
}

function toChartData(percentage: number) {
	const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
	return [
		{ name: "Completed", value: clamped },
		{ name: "Remaining", value: 100 - clamped },
	];
}

export function CourseProgressRadial({ data }: CourseProgressRadialProps) {
	const percentage = data?.courseProgress.completion_percentage ?? 0;
	const isZero = percentage === 0;
	const chartData = toChartData(percentage);

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
								data={chartData}
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
						<span className="text-2xl font-bold">
							{Math.round(percentage)}%
						</span>
					</div>
				</div>

				{isZero ? (
					<Button asChild variant="outline" size="sm" className="mt-2">
						<Link href="/home/course">Start Course</Link>
					</Button>
				) : (
					<p className="text-muted-foreground mt-2 text-sm">
						{data?.completedLessons ?? 0} of {data?.totalLessons ?? 0} lessons
					</p>
				)}
			</CardContent>
		</Card>
	);
}
