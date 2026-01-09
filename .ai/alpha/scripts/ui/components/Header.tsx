import { Box, Text } from "ink";
import React, { useEffect, useState } from "react";
import type { HeaderProps, OverallProgress } from "../types.js";

/**
 * Format elapsed time as human-readable string
 */
function formatElapsedTime(startTime: Date): string {
	const elapsed = Math.round((Date.now() - startTime.getTime()) / 1000);

	if (elapsed < 60) {
		return `${elapsed}s`;
	}

	const hours = Math.floor(elapsed / 3600);
	const minutes = Math.floor((elapsed % 3600) / 60);
	const seconds = elapsed % 60;

	if (hours > 0) {
		return `${hours}h ${minutes}m ${seconds}s`;
	}

	return `${minutes}m ${seconds}s`;
}

/**
 * Get color for status display
 */
function getStatusColor(status: OverallProgress["status"]): string {
	const colors: Record<OverallProgress["status"], string> = {
		pending: "gray",
		in_progress: "cyan",
		completed: "green",
		partial: "yellow",
		failed: "red",
	};
	return colors[status];
}

/**
 * Get status icon
 */
function getStatusIcon(status: OverallProgress["status"]): string {
	const icons: Record<OverallProgress["status"], string> = {
		pending: "⏳",
		in_progress: "🔄",
		completed: "✅",
		partial: "⚠️",
		failed: "❌",
	};
	return icons[status];
}

/**
 * Header component showing spec info and elapsed time
 *
 * Displays:
 * - Spec ID and name
 * - Current status with icon
 * - Elapsed time (auto-updates every second)
 *
 * Memoized to prevent re-renders when other parts of state change
 */
const HeaderImpl: React.FC<HeaderProps> = ({ progress, sessionStartTime }) => {
	// Auto-update elapsed time every second
	const [elapsed, setElapsed] = useState(() =>
		formatElapsedTime(sessionStartTime),
	);

	useEffect(() => {
		// Update every 5 seconds instead of 1 second to reduce re-renders
		// Elapsed time doesn't need second-level precision for UI display
		const interval = setInterval(() => {
			setElapsed(formatElapsedTime(sessionStartTime));
		}, 5000);

		return () => clearInterval(interval);
	}, [sessionStartTime]);

	const statusColor = getStatusColor(progress.status);
	const statusIcon = getStatusIcon(progress.status);

	return (
		<Box
			flexDirection="column"
			borderStyle="double"
			borderColor="cyan"
			paddingX={2}
			paddingY={1}
		>
			{/* Top row: Title and Status */}
			<Box justifyContent="space-between">
				<Box>
					<Text bold color="cyan">
						ALPHA ORCHESTRATOR
					</Text>
					<Text color="gray"> - </Text>
					<Text bold>Spec #{progress.specId}</Text>
				</Box>
				<Box>
					<Text>{statusIcon} </Text>
					<Text color={statusColor} bold>
						{progress.status.toUpperCase().replace("_", " ")}
					</Text>
				</Box>
			</Box>

			{/* Bottom row: Spec name and Elapsed time */}
			<Box justifyContent="space-between" marginTop={1}>
				<Text>{truncateText(progress.specName, 60)}</Text>
				<Box>
					<Text dimColor>Elapsed: </Text>
					<Text color="white">{elapsed}</Text>
				</Box>
			</Box>
		</Box>
	);
};

export const Header = React.memo(HeaderImpl);

/**
 * Truncate text with ellipsis if too long
 */
function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Minimal header for compact displays
 */
export const CompactHeader: React.FC<HeaderProps> = ({
	progress,
	sessionStartTime,
}) => {
	const [elapsed, setElapsed] = useState(() =>
		formatElapsedTime(sessionStartTime),
	);

	useEffect(() => {
		// Update every 5 seconds to reduce re-renders
		const interval = setInterval(() => {
			setElapsed(formatElapsedTime(sessionStartTime));
		}, 5000);
		return () => clearInterval(interval);
	}, [sessionStartTime]);

	return (
		<Box justifyContent="space-between" paddingX={1}>
			<Text bold color="cyan">
				Spec #{progress.specId}
			</Text>
			<Text dimColor>{elapsed}</Text>
		</Box>
	);
};
