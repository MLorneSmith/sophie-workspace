import { Box, Text, useApp, useInput } from "ink";
import type { FC } from "react";
// biome-ignore lint/correctness/noUnusedImports: React must be in scope at runtime for Ink/react-reconciler
import React from "react";
import type { OrchestratorUIProps } from "../types.js";
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
export const OrchestratorUI: FC<OrchestratorUIProps> = ({ state }) => {
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
	specId: number;
	featuresCompleted: number;
	tasksCompleted: number;
	elapsed: string;
}> = ({ specId, featuresCompleted, tasksCompleted, elapsed }) => {
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
			<Box marginTop={2}>
				<Text dimColor>Press Enter or 'q' to exit</Text>
			</Box>
		</Box>
	);
};
