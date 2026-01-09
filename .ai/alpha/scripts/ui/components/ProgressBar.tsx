import { Box, Text } from "ink";
// biome-ignore lint/correctness/noUnusedImports: React must be in scope at runtime for Ink/react-reconciler
import React from "react";
import type { FC } from "react";
import type { ProgressBarProps } from "../types.js";

/**
 * Reusable progress bar component for displaying completion status
 *
 * @example
 * <ProgressBar current={5} total={10} width={20} />
 * // Renders: [██████████░░░░░░░░░░] 5/10 (50%)
 */
export const ProgressBar: FC<ProgressBarProps> = ({
	current,
	total,
	width = 20,
	showPercentage = true,
	showCount = true,
	filledChar = "█",
	emptyChar = "░",
	filledColor = "green",
	emptyColor = "gray",
}) => {
	// Handle edge cases
	const safeCurrent = Math.max(0, current);
	const safeTotal = Math.max(1, total); // Prevent division by zero
	const clampedCurrent = Math.min(safeCurrent, safeTotal);

	const percent = Math.round((clampedCurrent / safeTotal) * 100);
	const filledWidth = Math.round((percent / 100) * width);
	const emptyWidth = width - filledWidth;

	// Determine color based on progress
	const getFilledColor = (): string => {
		if (percent === 100) return "green";
		if (percent >= 75) return "cyan";
		if (percent >= 50) return "yellow";
		return filledColor;
	};

	return (
		<Box>
			<Text>[</Text>
			<Text color={getFilledColor()}>{filledChar.repeat(filledWidth)}</Text>
			<Text color={emptyColor}>{emptyChar.repeat(emptyWidth)}</Text>
			<Text>]</Text>
			{showCount && (
				<Text>
					{" "}
					{clampedCurrent}/{safeTotal}
				</Text>
			)}
			{showPercentage && <Text dimColor> ({percent}%)</Text>}
		</Box>
	);
};

/**
 * Compact progress bar without count/percentage for tight spaces
 */
export const CompactProgressBar: FC<
	Omit<ProgressBarProps, "showCount" | "showPercentage">
> = (props) => (
	<ProgressBar {...props} showCount={false} showPercentage={false} />
);

/**
 * Context usage bar with color thresholds
 */
export const ContextUsageBar: FC<{
	percent: number;
	width?: number;
}> = ({ percent }) => {
	const getColor = (): string => {
		if (percent >= 80) return "red";
		if (percent >= 60) return "yellow";
		return "green";
	};

	return (
		<Box>
			<Text color={getColor()}>{percent}%</Text>
			<Text dimColor> context</Text>
		</Box>
	);
};
