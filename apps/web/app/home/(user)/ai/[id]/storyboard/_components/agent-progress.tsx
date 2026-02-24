"use client";

import { Progress } from "@kit/ui/progress";
import { cn } from "@kit/ui/utils";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface AgentProgressProps {
	agentName: string;
	slideCount: number;
	className?: string;
}

function formatElapsed(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function AgentProgress({
	agentName,
	slideCount,
	className,
}: AgentProgressProps) {
	const [elapsedSeconds, setElapsedSeconds] = useState(0);

	useEffect(() => {
		const interval = window.setInterval(() => {
			setElapsedSeconds((previous) => previous + 1);
		}, 1000);

		return () => window.clearInterval(interval);
	}, []);

	const stepText = useMemo(() => {
		if (elapsedSeconds < 4) {
			return "Reading storyboard...";
		}

		if (elapsedSeconds < 16) {
			if (slideCount <= 0) {
				return "Analyzing slides...";
			}
			const analyzedSlide = Math.min(
				slideCount,
				Math.max(1, Math.floor((elapsedSeconds - 3) / 1.8) + 1),
			);
			return `Analyzing slide ${analyzedSlide} of ${slideCount}...`;
		}

		return "Generating feedback...";
	}, [elapsedSeconds, slideCount]);

	const progressValue = Math.min(94, 12 + elapsedSeconds * 4);

	return (
		<div
			className={cn(
				"space-y-3 rounded-lg border border-white/15 bg-white/5 p-3",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2">
					<Loader2 className="h-3.5 w-3.5 animate-spin text-blue-300" />
					<p className="truncate text-xs font-medium text-white/90">
						{agentName} analyzing...
					</p>
				</div>
				<p className="text-muted-foreground text-xs">
					{formatElapsed(elapsedSeconds)}
				</p>
			</div>

			<Progress value={progressValue} className="h-1.5 bg-white/10" />

			<p className="text-muted-foreground text-xs">{stepText}</p>
		</div>
	);
}
