import { render } from "ink";
import React from "react";
import { useCallback, useEffect, useState } from "react";
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
import type { UIState } from "./types.js";

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
	/** Sandbox labels to monitor (default: ['sbx-a', 'sbx-b', 'sbx-c']) */
	sandboxLabels?: string[];
	/** Polling interval in ms (default: 15000) */
	pollInterval?: number;
	/** Use minimal UI for narrow terminals */
	minimal?: boolean;
	/** Custom progress reader (for testing) */
	progressReader?: ProgressReader;
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
		sandboxLabels = ["sbx-a", "sbx-b", "sbx-c"],
		pollInterval,
		minimal = false,
		progressReader = createFsProgressReader(),
	} = config;

	const [phase, setPhase] = useState<UIPhase>("loading");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [sessionStart] = useState(() => new Date());

	// Progress poller configuration
	const pollerConfig: ProgressPollerConfig = {
		specId,
		specName,
		progressDir,
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
			setPhase("running");
		}, 500); // Brief delay for loading screen

		return () => clearTimeout(timer);
	}, [startPolling]);

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
					featuresCompleted={state.overallProgress.featuresCompleted}
					tasksCompleted={state.overallProgress.tasksCompleted}
					elapsed={getElapsedTime()}
				/>
			);
		default:
			if (minimal) {
				return <MinimalOrchestratorUI state={state} />;
			}
			return <OrchestratorUI state={state} />;
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

		// Use maxFps to throttle terminal redraws and reduce flicker
		this.instance = render(<OrchestratorApp config={this.config} />, {
			patchConsole: false,
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
