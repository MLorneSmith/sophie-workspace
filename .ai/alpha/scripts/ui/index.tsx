import { render } from "ink";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
	CompletionUI,
	ErrorUI,
	LoadingUI,
	MinimalOrchestratorUI,
	OrchestratorUI,
} from "./components/OrchestratorUI.js";
import {
	createFsProgressReader,
	createInitialState,
	type ProgressPollerConfig,
	type ProgressReader,
	useProgressPoller,
} from "./hooks/useProgressPoller.js";
import { useEventStream } from "./hooks/useEventStream.js";
import type { UIState, WebSocketEvent } from "./types.js";
import { EVENT_SERVER_PORT } from "./types.js";

/**
 * UI Manager configuration
 */
export interface UIManagerConfig {
	/** Spec ID being orchestrated */
	specId: number;
	/** Spec name for display */
	specName: string;
	/** Directory containing sandbox progress files */
	progressDir: string;
	/** Directory containing sandbox log files */
	logsDir: string;
	/** Sandbox labels to monitor (default: ['sbx-a', 'sbx-b', 'sbx-c']) */
	sandboxLabels?: string[];
	/** Polling interval in ms (default: 15000) */
	pollInterval?: number;
	/** Use minimal UI for narrow terminals */
	minimal?: boolean;
	/** Custom progress reader (for testing) */
	progressReader?: ProgressReader;
	/** Event server URL for WebSocket streaming (optional) */
	eventServerUrl?: string;
	/** Whether event streaming is enabled (default: true if eventServerUrl provided) */
	eventStreamEnabled?: boolean;
}

/**
 * UI phase for rendering appropriate screen
 */
type UIPhase = "loading" | "running" | "completed" | "error";

/**
 * Main orchestrator UI app component
 */
const OrchestratorApp: React.FC<{
	config: UIManagerConfig;
}> = ({ config }) => {
	const {
		specId,
		specName,
		progressDir,
		logsDir,
		sandboxLabels = ["sbx-a", "sbx-b", "sbx-c"],
		pollInterval,
		minimal = false,
		progressReader = createFsProgressReader(),
		eventServerUrl,
		eventStreamEnabled = !!eventServerUrl,
	} = config;

	const [phase, setPhase] = useState<UIPhase>("loading");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [sessionStart] = useState(() => new Date());

	// Real-time output from WebSocket events (keyed by sandbox_id)
	const [realtimeOutput, setRealtimeOutput] = useState<Map<string, string[]>>(
		() => new Map(),
	);

	// Map sandbox_id to label for event routing
	const sandboxIdToLabelRef = useRef<Map<string, string>>(new Map());

	// Format WebSocket event for display (similar to update_recent_output.py)
	const formatEventForDisplay = useCallback(
		(event: WebSocketEvent): string | null => {
			const toolName = event.tool_name;
			if (!toolName) return null;

			// Tool name display mapping with emoji
			const TOOL_DISPLAY_NAMES: Record<string, string> = {
				Read: "📖 Read",
				Write: "📝 Write",
				Edit: "✏️ Edit",
				Bash: "💻 Bash",
				Grep: "🔍 Grep",
				Glob: "📁 Glob",
				TodoWrite: "📋 Todo",
				Task: "🤖 Task",
				WebFetch: "🌐 WebFetch",
				WebSearch: "🔎 Search",
				AskUserQuestion: "❓ AskUser",
				LSP: "🔧 LSP",
			};

			const displayName = TOOL_DISPLAY_NAMES[toolName] || `🔧 ${toolName}`;

			// Add file path or other context if available
			if (event.file_path) {
				// Shorten path for display
				const path = event.file_path;
				const shortPath =
					path.length > 40 ? path.split("/").pop() || path : path;
				return `${displayName}: ${shortPath}`;
			}

			// Show todo summary for TodoWrite events
			if (event.todo_summary) {
				const { completed, total, in_progress } = event.todo_summary;
				return `${displayName}: ${completed}/${total} done, ${in_progress} active`;
			}

			return displayName;
		},
		[],
	);

	// Handle incoming WebSocket event - update real-time output
	const handleWebSocketEvent = useCallback(
		(event: WebSocketEvent) => {
			const sandboxId = event.sandbox_id;
			if (!sandboxId) return;

			// Skip non-tool events (heartbeats, etc.)
			if (event.event_type !== "post_tool_use") return;

			const displayText = formatEventForDisplay(event);
			if (!displayText) return;

			setRealtimeOutput((prev) => {
				const newMap = new Map(prev);
				const existing = newMap.get(sandboxId) || [];
				// Keep last 10 items for rolling buffer
				const updated = [...existing, displayText].slice(-10);
				newMap.set(sandboxId, updated);
				return newMap;
			});
		},
		[formatEventForDisplay],
	);

	// Event streaming hook
	const wsUrl = eventServerUrl || `ws://localhost:${EVENT_SERVER_PORT}/ws`;
	const eventStream = useEventStream({
		url: wsUrl,
		enabled: eventStreamEnabled,
		onEvent: handleWebSocketEvent,
	});

	// Progress poller configuration
	const pollerConfig: ProgressPollerConfig = {
		specId,
		specName,
		progressDir,
		logsDir,
		sandboxLabels,
		pollInterval,
		onStateChange: (state) => {
			// Update phase based on state
			if (state.overallProgress.status === "completed") {
				setPhase("completed");
			} else if (state.overallProgress.status === "failed") {
				setPhase("error");
				setErrorMessage("One or more sandboxes failed");
			} else if (phase === "loading") {
				setPhase("running");
			}
		},
		onError: (_error) => {},
	};

	const { state, startPolling, error } = useProgressPoller(
		pollerConfig,
		progressReader,
	);

	// Start polling on mount
	useEffect(() => {
		const timer = setTimeout(() => {
			startPolling();
			// Only transition to running if currently loading - preserve terminal states
			setPhase((prev) => (prev === "loading" ? "running" : prev));
		}, 500); // Brief delay for loading screen

		return () => clearTimeout(timer);
	}, [startPolling]);

	// Track sandbox_id to label mapping when progress files are read
	// This allows us to route WebSocket events to the correct sandbox column
	useEffect(() => {
		for (const [label, sandbox] of state.sandboxes) {
			if (sandbox.sandboxId) {
				sandboxIdToLabelRef.current.set(sandbox.sandboxId, label);
			}
		}
	}, [state.sandboxes]);

	// Create enhanced state with real-time output overlay
	// This merges WebSocket events with the polled state for display
	const enhancedState = React.useMemo((): UIState => {
		// If no real-time output yet, return original state
		if (realtimeOutput.size === 0) {
			return state;
		}

		// Create new sandboxes map with real-time output
		const enhancedSandboxes = new Map(state.sandboxes);

		for (const [sandboxId, output] of realtimeOutput) {
			// Find the label for this sandbox ID
			const label = sandboxIdToLabelRef.current.get(sandboxId);
			if (!label) continue;

			const existingSandbox = enhancedSandboxes.get(label);
			if (!existingSandbox) continue;

			// Overlay real-time output (last 3 lines for display)
			enhancedSandboxes.set(label, {
				...existingSandbox,
				recentOutput: output.slice(-3),
			});
		}

		return {
			...state,
			sandboxes: enhancedSandboxes,
		};
	}, [state, realtimeOutput]);

	// Calculate elapsed time for completion screen
	const getElapsedTime = useCallback((): string => {
		const elapsed = Date.now() - sessionStart.getTime();
		const hours = Math.floor(elapsed / (1000 * 60 * 60));
		const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

		if (hours > 0) {
			return `${hours}h ${minutes}m ${seconds}s`;
		}
		if (minutes > 0) {
			return `${minutes}m ${seconds}s`;
		}
		return `${seconds}s`;
	}, [sessionStart]);

	// Render based on phase
	switch (phase) {
		case "loading":
			return <LoadingUI message="Connecting to sandboxes..." />;

		case "error":
			return (
				<ErrorUI
					error={errorMessage ?? "Unknown error"}
					details={error?.message}
				/>
			);

		case "completed":
			return (
				<CompletionUI
					specId={specId}
					featuresCompleted={enhancedState.overallProgress.featuresCompleted}
					tasksCompleted={enhancedState.overallProgress.tasksCompleted}
					elapsed={getElapsedTime()}
					branchName={enhancedState.overallProgress.branchName}
					reviewUrls={enhancedState.overallProgress.reviewUrls}
				/>
			);
		default:
			if (minimal) {
				return <MinimalOrchestratorUI state={enhancedState} />;
			}
			return (
				<OrchestratorUI
					state={enhancedState}
					eventStreamStatus={eventStream.status}
					eventStreamCount={eventStream.eventCount}
				/>
			);
	}
};

/**
 * UI Manager class for programmatic control
 */
export class UIManager {
	private config: UIManagerConfig;
	private instance: ReturnType<typeof render> | null = null;
	private state: UIState;
	private onExit?: () => void;

	constructor(config: UIManagerConfig) {
		this.config = config;
		this.state = createInitialState(config.specId, config.specName);
	}

	/**
	 * Start the UI
	 */
	start(onExit?: () => void): void {
		this.onExit = onExit;

		// Use patchConsole to capture stderr and prevent it from escaping the TUI
		this.instance = render(<OrchestratorApp config={this.config} />, {
			patchConsole: true,
		});

		// Handle process signals
		process.on("SIGINT", () => this.stop());
		process.on("SIGTERM", () => this.stop());
	}

	/**
	 * Stop the UI and cleanup
	 */
	stop(): void {
		if (this.instance) {
			this.instance.unmount();
			this.instance = null;
		}
		this.onExit?.();
	}

	/**
	 * Get current state (for external access)
	 */
	getState(): UIState {
		return this.state;
	}

	/**
	 * Wait for the UI to exit
	 */
	async waitForExit(): Promise<void> {
		if (this.instance) {
			await this.instance.waitUntilExit();
		}
	}
}

/**
 * Start the orchestrator UI
 *
 * Main entry point for running the UI from the orchestrator script.
 *
 * @example
 * ```ts
 * const manager = startOrchestratorUI({
 *   specId: 1362,
 *   specName: 'User Dashboard Home',
 *   progressDir: '/path/to/progress',
 * });
 *
 * // Later...
 * manager.stop();
 * ```
 */
export function startOrchestratorUI(
	config: UIManagerConfig,
	onExit?: () => void,
): UIManager {
	const manager = new UIManager(config);
	manager.start(onExit);
	return manager;
}

/**
 * Run the UI and wait for completion
 *
 * Convenience function that starts the UI and waits for it to exit.
 *
 * @example
 * ```ts
 * await runOrchestratorUI({
 *   specId: 1362,
 *   specName: 'User Dashboard Home',
 *   progressDir: '/path/to/progress',
 * });
 * console.log('UI exited');
 * ```
 */
export async function runOrchestratorUI(
	config: UIManagerConfig,
): Promise<void> {
	const manager = new UIManager(config);

	return new Promise<void>((resolve) => {
		manager.start(() => resolve());
	});
}

// Re-export types and components for external use
export {
	OrchestratorUI,
	MinimalOrchestratorUI,
	LoadingUI,
	ErrorUI,
	CompletionUI,
};
export { useProgressPoller, createFsProgressReader };
export type { UIState, ProgressPollerConfig, ProgressReader };
export * from "./types.js";
