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
import type {
	OrchestratorEvent,
	OrchestratorEventType,
	UIState,
	WebSocketEvent,
} from "./types.js";
import { EVENT_SERVER_PORT, MAX_EVENTS } from "./types.js";

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

	// Orchestrator events from WebSocket (for EventLog display)
	const [orchestratorEvents, setOrchestratorEvents] = useState<
		OrchestratorEvent[]
	>([]);

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

	// Map WebSocket event types to OrchestratorEventType
	// Returns the event_type if it's a valid OrchestratorEventType, otherwise 'error'
	const mapWebSocketToOrchestratorEventType = useCallback(
		(eventType: string): OrchestratorEventType => {
			const validTypes: OrchestratorEventType[] = [
				"task_start",
				"task_complete",
				"task_failed",
				"feature_start",
				"feature_complete",
				"group_complete",
				"commit",
				"push",
				"error",
				"health_warning",
				"stall_detected",
				"sandbox_restart",
				"context_limit",
				"sandbox_idle",
				"sandbox_unblocked",
				"db_capacity_check",
				"db_capacity_ok",
				"db_capacity_warning",
				"db_reset_start",
				"db_reset_complete",
				"db_migration_start",
				"db_migration_complete",
				"db_seed_start",
				"db_seed_complete",
				"db_verify",
			];

			if (validTypes.includes(eventType as OrchestratorEventType)) {
				return eventType as OrchestratorEventType;
			}

			// Unknown event types are mapped to 'error' type for graceful handling
			return "error";
		},
		[],
	);

	// Generate default message for orchestrator events based on type
	const getOrchestratorEventMessage = useCallback(
		(eventType: OrchestratorEventType): string => {
			const messages: Record<OrchestratorEventType, string> = {
				task_start: "Task started",
				task_complete: "Task completed",
				task_failed: "Task failed",
				feature_start: "Feature started",
				feature_complete: "Feature completed",
				group_complete: "Group completed",
				commit: "Changes committed",
				push: "Changes pushed",
				error: "Error occurred",
				health_warning: "Health warning",
				stall_detected: "Stall detected",
				sandbox_restart: "Sandbox restarted",
				context_limit: "Context limit reached",
				sandbox_idle: "Sandbox idle",
				sandbox_unblocked: "Sandbox unblocked",
				db_capacity_check: "Checking database capacity...",
				db_capacity_ok: "Database capacity OK",
				db_capacity_warning: "Database capacity warning",
				db_reset_start: "Resetting sandbox database...",
				db_reset_complete: "Database schema reset complete",
				db_migration_start: "Running migrations...",
				db_migration_complete: "Migrations complete",
				db_seed_start: "Running database seeding...",
				db_seed_complete: "Database seeding complete",
				db_verify: "Verified database state",
			};
			return messages[eventType] || "Unknown event";
		},
		[],
	);

	// Handle orchestrator-specific WebSocket events
	// These are events with sandbox_id === "orchestrator" (database operations, etc.)
	const handleOrchestratorEvent = useCallback(
		(event: WebSocketEvent) => {
			// Only process orchestrator events (not sandbox tool events)
			if (event.sandbox_id !== "orchestrator") return;

			const eventType = mapWebSocketToOrchestratorEventType(event.event_type);
			const timestamp = event.timestamp
				? new Date(event.timestamp)
				: new Date();

			// Extract message from event or use default based on type
			// WebSocket events may include a message in the data, or we generate one
			const message =
				(event as WebSocketEvent & { message?: string }).message ||
				getOrchestratorEventMessage(eventType);

			const orchestratorEvent: OrchestratorEvent = {
				id: `orchestrator-${event.event_type}-${timestamp.getTime()}`,
				timestamp,
				type: eventType,
				sandboxLabel: "orchestrator",
				message,
			};

			setOrchestratorEvents((prev) => {
				// Add new event at the beginning (newest first)
				// Keep last MAX_EVENTS events
				return [orchestratorEvent, ...prev].slice(0, MAX_EVENTS);
			});
		},
		[mapWebSocketToOrchestratorEventType, getOrchestratorEventMessage],
	);

	// Handle incoming WebSocket event - update real-time output for sandbox tools
	// Note: Orchestrator events (sandbox_id === "orchestrator") are handled by handleOrchestratorEvent
	const handleWebSocketEvent = useCallback(
		(event: WebSocketEvent) => {
			const sandboxId = event.sandbox_id;
			if (!sandboxId) return;

			// Skip orchestrator events - they are handled separately by handleOrchestratorEvent
			// This ensures clean separation between sandbox tool events and orchestrator operation events
			if (sandboxId === "orchestrator") return;

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

	// Combined event handler that routes events to appropriate handlers
	// - Orchestrator events (sandbox_id === "orchestrator") go to handleOrchestratorEvent
	// - Sandbox tool events go to handleWebSocketEvent
	const handleIncomingEvent = useCallback(
		(event: WebSocketEvent) => {
			// Route to appropriate handler based on sandbox_id
			// Both handlers have their own filtering, so we call both
			handleOrchestratorEvent(event);
			handleWebSocketEvent(event);
		},
		[handleOrchestratorEvent, handleWebSocketEvent],
	);

	// Event streaming hook
	const wsUrl = eventServerUrl || `ws://localhost:${EVENT_SERVER_PORT}/ws`;
	const eventStream = useEventStream({
		url: wsUrl,
		enabled: eventStreamEnabled,
		onEvent: handleIncomingEvent,
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

	// Create enhanced state with real-time output overlay and merged events
	// This merges:
	// - WebSocket sandbox tool events with the polled sandbox state for display
	// - WebSocket orchestrator events with the polled event log for display
	const enhancedState = React.useMemo((): UIState => {
		// Create new sandboxes map with real-time output
		const enhancedSandboxes = new Map(state.sandboxes);

		if (realtimeOutput.size > 0) {
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
		}

		// Merge orchestrator events with state.events
		// - state.events comes from progress file polling (sandbox state events)
		// - orchestratorEvents comes from WebSocket (database operations, etc.)
		// Sort by timestamp (newest first) and limit to MAX_EVENTS
		const mergedEvents = [...orchestratorEvents, ...state.events]
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, MAX_EVENTS);

		return {
			...state,
			sandboxes: enhancedSandboxes,
			events: mergedEvents,
		};
	}, [state, realtimeOutput, orchestratorEvents]);

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
