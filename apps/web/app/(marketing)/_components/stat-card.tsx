"use client";

import { cn } from "@kit/ui/utils";
import { useCallback } from "react";

import { useCountUp } from "../_hooks/use-count-up";

interface StatCardProps {
	value: number;
	label: string;
	prefix?: string;
	suffix?: string;
	decimals?: number;
	className?: string;
}

export function StatCard({
	value,
	label,
	prefix = "",
	suffix = "",
	decimals = 0,
	className,
}: StatCardProps) {
	const formatter = useCallback(
		(v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`,
		[prefix, suffix, decimals],
	);

	const ref = useCountUp({
		target: value,
		duration: 2,
		formatter,
	});

	return (
		<div className={cn("flex flex-col items-center text-center", className)}>
			<span
				ref={ref}
				className="text-5xl font-bold text-[var(--homepage-accent)]"
			>
				{prefix}0{suffix}
			</span>
			<span className="mt-2 text-sm text-[var(--homepage-text-muted)]">
				{label}
			</span>
		</div>
	);
}
