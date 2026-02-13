"use client";

import { Button } from "@kit/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@kit/ui/card";
import { type ChartConfig, ChartContainer } from "@kit/ui/chart";
import Link from "next/link";
import { useId } from "react";
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
	const descId = useId();
	const percentage = data?.courseProgress.completion_percentage ?? 0;
	const isZero = percentage === 0;
	const chartData = toChartData(percentage);
	const completedLessons = data?.completedLessons ?? 0;
	const totalLessons = data?.totalLessons ?? 0;
	const roundedPercentage = Math.round(percentage);

	if (isZero) {
		return (
			<Card className="border-l-4 border-l-teal-500 bg-teal-50/40 dark:bg-teal-950/20">
				<CardHeader className="pb-2">
					<CardTitle className="font-heading">Course Progress</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col items-center justify-center gap-3 py-6 text-center">
					<p className="text-sm text-muted-foreground">
						Start your first lesson to track progress here.
					</p>
					<Button asChild size="sm">
						<Link href="/home/course">Start Course</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-l-4 border-l-teal-500 bg-teal-50/40 dark:bg-teal-950/20">
			<CardHeader className="pb-2">
				<CardTitle className="font-heading">Course Progress</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col items-center justify-center pb-4">
				<div
					className="relative"
					role="img"
					aria-label={`Course progress: ${roundedPercentage}% complete, ${completedLessons} of ${totalLessons} lessons`}
					aria-describedby={descId}
				>
					<span id={descId} className="sr-only">
						Radial chart showing course completion progress. You have completed{" "}
						{completedLessons} out of {totalLessons} total lessons, which is{" "}
						{roundedPercentage} percent of the course.
					</span>
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

					<div
						className="pointer-events-none absolute inset-0 flex items-center justify-center"
						aria-hidden="true"
					>
						<span className="text-2xl font-bold">{roundedPercentage}%</span>
					</div>
				</div>

				<p className="mt-2 text-sm text-muted-foreground">
					{completedLessons} of {totalLessons} lessons
				</p>
			</CardContent>
		</Card>
	);
}
