import { Box, Text, useApp, useInput } from "ink";
import type { FC } from "react";
// biome-ignore lint/correctness/noUnusedImports: React must be in scope at runtime for Ink/react-reconciler
import React from "react";
import type {
	OrchestratorEvent,
	OrchestratorUIProps,
	OverallProgress as OverallProgressType,
	ReviewUrl,
} from "../types.js";
import { EventLog } from "./EventLog.js";
import { Header } from "./Header.js";
import { OverallProgress } from "./OverallProgress.js";
import { SandboxGrid } from "./SandboxGrid.js";

/**
 * Root OrchestratorUI component
 *
 * Combines all UI sections into a cohesive dashboard:
 * - Header: Spec info and elapsed time
 * - SandboxGrid: 3-column display of sandbox states
 * - OverallProgress: Aggregate progress bars
 * - EventLog: Recent events feed
 * - Footer: Keyboard shortcut hints
 *
 * Handles keyboard input for:
 * - 'q' or Ctrl+C: Exit the UI
 */
export const OrchestratorUI: FC<OrchestratorUIProps> = ({
	state,
	eventStreamStatus,
	eventStreamCount,
}) => {
	const { exit } = useApp();

	// Handle keyboard input
	useInput((input, key) => {
		// Exit on 'q' or Ctrl+C
		if (input === "q" || (key.ctrl && input === "c")) {
			exit();
		}
	});

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Header
				progress={state.overallProgress}
				sessionStartTime={state.sessionStartTime}
				eventStreamStatus={eventStreamStatus}
				eventStreamCount={eventStreamCount}
			/>

			{/* Sandbox Grid */}
			<SandboxGrid sandboxes={state.sandboxes} />

			{/* Overall Progress */}
			<OverallProgress progress={state.overallProgress} />

			{/* Event Log */}
			<EventLog events={state.events} />

			{/* Footer */}
			<Box marginTop={1} paddingX={1}>
				<Text dimColor>Press </Text>
				<Text color="yellow">'q'</Text>
				<Text dimColor> to exit</Text>
			</Box>
		</Box>
	);
};

/**
 * Minimal UI showing just essential info
 */
export const MinimalOrchestratorUI: FC<OrchestratorUIProps> = ({ state }) => {
	const { exit } = useApp();

	useInput((input, key) => {
		if (input === "q" || (key.ctrl && input === "c")) {
			exit();
		}
	});

	return (
		<Box flexDirection="column">
			<Box justifyContent="space-between" paddingX={1}>
				<Text bold color="cyan">
					Spec #{state.overallProgress.specId}
				</Text>
				<Text>
					{state.overallProgress.featuresCompleted}/
					{state.overallProgress.featuresTotal} features
				</Text>
			</Box>
			<SandboxGrid sandboxes={state.sandboxes} />
			<Text dimColor>Press 'q' to exit</Text>
		</Box>
	);
};

/**
 * Loading screen while initializing
 */
export const LoadingUI: FC<{ message?: string }> = ({
	message = "Initializing...",
}) => {
	return (
		<Box flexDirection="column" alignItems="center" paddingY={2}>
			<Text bold color="cyan">
				ALPHA ORCHESTRATOR
			</Text>
			<Box marginTop={1}>
				<Text color="yellow">{message}</Text>
			</Box>
		</Box>
	);
};

/**
 * Error screen for fatal errors
 */
export const ErrorUI: FC<{
	error: string;
	details?: string;
}> = ({ error, details }) => {
	const { exit } = useApp();

	useInput((input) => {
		if (input === "q") {
			exit();
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="red"
			padding={2}
		>
			<Text bold color="red">
				Error
			</Text>
			<Box marginTop={1}>
				<Text color="red">{error}</Text>
			</Box>
			{details && (
				<Box marginTop={1}>
					<Text dimColor>{details}</Text>
				</Box>
			)}
			<Box marginTop={2}>
				<Text dimColor>Press 'q' to exit</Text>
			</Box>
		</Box>
	);
};

/**
 * Completion screen when all work is done
 */
export const CompletionUI: FC<{
	specId: string;
	featuresCompleted: number;
	tasksCompleted: number;
	elapsed: string;
	branchName?: string;
	reviewUrls?: ReviewUrl[];
}> = ({
	specId,
	featuresCompleted,
	tasksCompleted,
	elapsed,
	branchName,
	reviewUrls,
}) => {
	const { exit } = useApp();

	useInput((input) => {
		if (input === "q" || input === "\r") {
			exit();
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="double"
			borderColor="green"
			padding={2}
			alignItems="center"
		>
			<Text bold color="green">
				✅ Spec #{specId} Complete!
			</Text>
			<Box marginTop={1} flexDirection="column" alignItems="center">
				<Text>
					<Text color="cyan">{featuresCompleted}</Text> features implemented
				</Text>
				<Text>
					<Text color="green">{tasksCompleted}</Text> tasks completed
				</Text>
				<Text dimColor>Elapsed: {elapsed}</Text>
			</Box>

			{branchName && (
				<Box marginTop={1}>
					<Text>
						Branch: <Text color="yellow">{branchName}</Text>
					</Text>
				</Box>
			)}

			{reviewUrls && reviewUrls.length > 0 && (
				<Box marginTop={1} flexDirection="column" alignItems="center">
					<Text bold color="cyan">
						🔗 Review URLs:
					</Text>
					{reviewUrls.map((url) => (
						<Box key={url.label} flexDirection="column" marginTop={1}>
							<Text bold>{url.label}:</Text>
							<Text>
								VS Code:{" "}
								<Text color="blue" underline>
									{url.vscode}
								</Text>
							</Text>
							<Text>
								Dev Server:{" "}
								<Text color="blue" underline>
									{url.devServer}
								</Text>
							</Text>
						</Box>
					))}
				</Box>
			)}

			<Box marginTop={2}>
				<Text dimColor>Press Enter or 'q' to exit</Text>
			</Box>
		</Box>
	);
};

/**
 * Intermediate completing screen during review sandbox setup
 * Bug fix #1754: Shows progress during completion phase instead of premature "completed" state
 *
 * Displays:
 * - "Setting up review environment..." header
 * - List of completion phase events (review_sandbox_creating, dev_server_starting, etc.)
 * - Dev server URL when available
 * - Loading indicator while sandbox operations run
 */
export const CompletingUI: FC<{
	specId: string;
	progress: OverallProgressType;
	events: OrchestratorEvent[];
	elapsed: string;
}> = ({ specId, progress, events, elapsed }) => {
	// Filter for completion phase events only
	const completionPhaseEventTypes = [
		"completion_phase_start",
		"sandbox_killing",
		"review_sandbox_creating",
		"dev_server_starting",
		"dev_server_ready",
		"dev_server_failed",
	];

	const completionEvents = events
		.filter((e) => completionPhaseEventTypes.includes(e.type))
		.slice(-10); // Show last 10 completion events

	// Check if dev server URL is available from events
	const devServerReadyEvent = events.find((e) => e.type === "dev_server_ready");
	const devServerUrl = devServerReadyEvent?.details?.url as string | undefined;

	// Determine current phase from most recent event
	const latestEvent = completionEvents[completionEvents.length - 1];
	const currentPhase = latestEvent?.type ?? "completion_phase_start";

	// Get phase description
	const getPhaseDescription = (phase: string): string => {
		switch (phase) {
			case "completion_phase_start":
				return "Starting cleanup...";
			case "sandbox_killing":
				return "Stopping implementation sandboxes...";
			case "review_sandbox_creating":
				return "Creating review sandbox...";
			case "dev_server_starting":
				return "Starting dev server...";
			case "dev_server_ready":
				return "Dev server ready!";
			case "dev_server_failed":
				return "Dev server failed to start";
			default:
				return "Setting up...";
		}
	};

	// Get event icon
	const getEventIcon = (type: string): string => {
		switch (type) {
			case "completion_phase_start":
				return "🔄";
			case "sandbox_killing":
				return "🛑";
			case "review_sandbox_creating":
				return "📦";
			case "dev_server_starting":
				return "🚀";
			case "dev_server_ready":
				return "✅";
			case "dev_server_failed":
				return "❌";
			default:
				return "•";
		}
	};

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="yellow"
			padding={2}
		>
			<Box flexDirection="column" alignItems="center">
				<Text bold color="yellow">
					⏳ Setting Up Review Environment
				</Text>
				<Text dimColor>Spec #{specId}</Text>
			</Box>

			<Box marginTop={1} flexDirection="column" alignItems="center">
				<Text>
					<Text color="cyan">{progress.featuresCompleted}</Text> features
					implemented
				</Text>
				<Text>
					<Text color="green">{progress.tasksCompleted}</Text> tasks completed
				</Text>
				<Text dimColor>Elapsed: {elapsed}</Text>
			</Box>

			{progress.branchName && (
				<Box marginTop={1} justifyContent="center">
					<Text>
						Branch: <Text color="yellow">{progress.branchName}</Text>
					</Text>
				</Box>
			)}

			{/* Current phase status */}
			<Box marginTop={1} justifyContent="center">
				<Text color="cyan">{getPhaseDescription(currentPhase)}</Text>
			</Box>

			{/* Completion phase event log */}
			{completionEvents.length > 0 && (
				<Box marginTop={1} flexDirection="column">
					<Text bold dimColor>
						Completion Phase Events:
					</Text>
					{completionEvents.map((event) => (
						<Box key={event.id}>
							<Text dimColor>
								{new Date(event.timestamp).toLocaleTimeString()}{" "}
							</Text>
							<Text>{getEventIcon(event.type)} </Text>
							<Text>{event.message}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Show dev server URL if available */}
			{devServerUrl && (
				<Box marginTop={1} flexDirection="column" alignItems="center">
					<Text bold color="green">
						🔗 Dev Server Ready:
					</Text>
					<Text color="blue" underline>
						{devServerUrl}
					</Text>
				</Box>
			)}

			{/* Show review URLs if already populated */}
			{progress.reviewUrls && progress.reviewUrls.length > 0 && (
				<Box marginTop={1} flexDirection="column" alignItems="center">
					<Text bold color="cyan">
						🔗 Review URLs:
					</Text>
					{progress.reviewUrls.map((url) => (
						<Box key={url.label} flexDirection="column" marginTop={1}>
							<Text bold>{url.label}:</Text>
							<Text>
								VS Code:{" "}
								<Text color="blue" underline>
									{url.vscode}
								</Text>
							</Text>
							<Text>
								Dev Server:{" "}
								<Text color="blue" underline>
									{url.devServer}
								</Text>
							</Text>
						</Box>
					))}
				</Box>
			)}

			<Box marginTop={2} justifyContent="center">
				<Text dimColor>
					Please wait while review environment is being set up...
				</Text>
			</Box>
		</Box>
	);
};
