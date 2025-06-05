"use client";

import { Progress } from "@kit/ui/progress";

interface CourseProgressBarProps {
	percentage: number;
	totalLessons: number;
	completedLessons: number;
}

export function CourseProgressBar({
	percentage,
	totalLessons,
	completedLessons,
}: CourseProgressBarProps) {
	// Calculate the percentage based on completed lessons vs total lessons
	// This ensures the progress bar is consistent with the text display
	const calculatedPercentage =
		totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm">
				<span>Course Progress</span>
				<span>
					{completedLessons} of {totalLessons} lessons completed
				</span>
			</div>
			<Progress value={calculatedPercentage} className="h-2" />
		</div>
	);
}
