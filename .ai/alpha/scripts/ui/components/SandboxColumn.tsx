import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import type React from "react";
import type {
	HealthStatus,
	SandboxColumnProps,
	SandboxState,
} from "../types.js";
import {
	HEARTBEAT_STALL_THRESHOLD_MS,
	HEARTBEAT_WARNING_THRESHOLD_MS,
} from "../types.js";
import { ProgressBar } from "./ProgressBar.js";

/**
 * Status icons for health display
 */
const STATUS_ICONS: Record<HealthStatus, string> = {
	running: "🟢",
	warning: "🟡",
	stalled: "🔴",
	idle: "⚪",
	completed: "✅",
	failed: "❌",
};

/**
 * Border colors for health status
 */
const BORDER_COLORS: Record<HealthStatus, string> = {
	running: "green",
	warning: "yellow",
	stalled: "red",
	idle: "gray",
	completed: "green",
	failed: "red",
};

/**
 * Compute health status from sandbox state
 */
export function computeHealthStatus(state: SandboxState): HealthStatus {
	// Check explicit status first
	if (state.status === "completed") return "completed";
	if (state.status === "failed") return "failed";

	// If no feature assigned, it's idle
	if (!state.currentFeature) return "idle";

	// Check heartbeat
	if (!state.lastHeartbeat) return "warning";

	const heartbeatAge = Date.now() - state.lastHeartbeat.getTime();

	if (heartbeatAge > HEARTBEAT_STALL_THRESHOLD_MS) return "stalled";
	if (heartbeatAge > HEARTBEAT_WARNING_THRESHOLD_MS) return "warning";

	return "running";
}

/**
 * Truncate text with ellipsis
 */
function truncate(str: string, maxLen: number): string {
	if (str.length <= maxLen) return str;
	return `${str.substring(0, maxLen - 3)}...`;
}

/**
 * Format phase for display
 */
function formatPhase(phase: string): string {
	return phase.replace(/_/g, " ");
}

/**
 * Get color for context usage percentage
 */
function getContextColor(percent: number): string {
	if (percent >= 80) return "red";
	if (percent >= 60) return "yellow";
	return "green";
}

/**
 * Get color for heartbeat age
 */
function getHeartbeatColor(ageSeconds: number): string {
	if (ageSeconds > 300) return "red"; // 5 minutes
	if (ageSeconds > 120) return "yellow"; // 2 minutes
	return "green";
}

/**
 * Format heartbeat age for display
 */
function formatHeartbeatAge(ageSeconds: number): string {
	if (ageSeconds < 60) return `${ageSeconds}s ago`;
	const minutes = Math.floor(ageSeconds / 60);
	const seconds = ageSeconds % 60;
	if (minutes >= 60) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m ago`;
	}
	return `${minutes}m ${seconds}s ago`;
}

/**
 * SandboxColumn component - displays all metrics for a single sandbox
 *
 * Shows:
 * - Sandbox ID and label with health status icon
 * - Current feature with progress bar
 * - Current task with spinner (when in progress)
 * - Phase indicator
 * - Context usage percentage
 * - Heartbeat age with color coding
 * - Error message if any
 */
export const SandboxColumn: React.FC<SandboxColumnProps> = ({ state }) => {
	const healthStatus = computeHealthStatus(state);
	const heartbeatAge = state.lastHeartbeat
		? Math.round((Date.now() - state.lastHeartbeat.getTime()) / 1000)
		: null;

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={BORDER_COLORS[healthStatus]}
			paddingX={1}
			width="33%"
			minWidth={30}
		>
			{/* Header: Label and Status */}
			<Box justifyContent="space-between">
				<Text bold color="cyan">
					{state.label}
				</Text>
				<Text>{STATUS_ICONS[healthStatus]}</Text>
			</Box>

			{/* Sandbox ID */}
			<Text dimColor>ID: {state.sandboxId.substring(0, 10)}</Text>

			{/* Current Feature */}
			{state.currentFeature ? (
				<Box flexDirection="column" marginTop={1}>
					<Box>
						<Text color="yellow">#{state.currentFeature.id}</Text>
						<Text> </Text>
					</Box>
					<Text>{truncate(state.currentFeature.title, 26)}</Text>
					<ProgressBar
						current={state.tasksCompleted}
						total={state.tasksTotal}
						width={16}
						showPercentage={false}
					/>
				</Box>
			) : (
				<Box marginTop={1}>
					<Text dimColor>
						{state.status === "completed"
							? "All work complete"
							: "Waiting for work..."}
					</Text>
				</Box>
			)}

			{/* Current Task */}
			{state.currentTask && (
				<Box flexDirection="column" marginTop={1}>
					<Box>
						{state.currentTask.status === "in_progress" && (
							<Text color="green">
								<Spinner type="dots" />{" "}
							</Text>
						)}
						<Text color="yellow">{state.currentTask.id}</Text>
					</Box>
					<Text>{truncate(state.currentTask.name, 24)}</Text>
					{state.currentTask.verificationAttempts &&
						state.currentTask.verificationAttempts > 1 && (
							<Text color="yellow">
								Retry {state.currentTask.verificationAttempts}
							</Text>
						)}
				</Box>
			)}

			{/* Phase */}
			{state.phase && state.phase !== "idle" && (
				<Box marginTop={1}>
					<Text dimColor>Phase: </Text>
					<Text>{formatPhase(state.phase)}</Text>
				</Box>
			)}

			{/* Context Usage */}
			{state.contextUsage > 0 && (
				<Box>
					<Text dimColor>Context: </Text>
					<Text color={getContextColor(state.contextUsage)}>
						{state.contextUsage}%
					</Text>
				</Box>
			)}

			{/* Heartbeat */}
			{heartbeatAge !== null && (
				<Box>
					<Text dimColor>💓 </Text>
					<Text color={getHeartbeatColor(heartbeatAge)}>
						{formatHeartbeatAge(heartbeatAge)}
					</Text>
				</Box>
			)}

			{/* Last Tool (from hooks) */}
			{state.lastTool && (
				<Box>
					<Text dimColor>Tool: </Text>
					<Text>{state.lastTool}</Text>
				</Box>
			)}

			{/* Error */}
			{state.error && (
				<Box marginTop={1}>
					<Text color="red">{truncate(state.error, 26)}</Text>
				</Box>
			)}
		</Box>
	);
};

/**
 * Compact sandbox column for narrow terminals
 */
export const CompactSandboxColumn: React.FC<SandboxColumnProps> = ({
	state,
}) => {
	const healthStatus = computeHealthStatus(state);

	return (
		<Box flexDirection="column" paddingX={1}>
			<Box>
				<Text bold color="cyan">
					{state.label}
				</Text>
				<Text> {STATUS_ICONS[healthStatus]}</Text>
			</Box>
			{state.currentFeature && (
				<Text>
					#{state.currentFeature.id} ({state.tasksCompleted}/{state.tasksTotal})
				</Text>
			)}
		</Box>
	);
};

/**
 * Sandbox status summary line
 */
export const SandboxStatusLine: React.FC<{ state: SandboxState }> = ({
	state,
}) => {
	const healthStatus = computeHealthStatus(state);

	return (
		<Text>
			<Text color="cyan">{state.label}</Text>
			<Text> {STATUS_ICONS[healthStatus]} </Text>
			{state.currentFeature ? (
				<Text>
					#{state.currentFeature.id} [{state.tasksCompleted}/{state.tasksTotal}]
				</Text>
			) : (
				<Text dimColor>idle</Text>
			)}
		</Text>
	);
};
