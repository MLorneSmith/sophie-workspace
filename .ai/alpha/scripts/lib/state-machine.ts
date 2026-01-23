/**
 * State Machine Module for Alpha Orchestrator
 *
 * Provides a unified state machine with explicit transitions and guards
 * for feature execution states. This replaces the distributed state management
 * that caused cascading failures due to competing detection systems.
 *
 * Bug fix #1786: Event-driven architecture refactor
 *
 * Design Principles:
 * 1. Single Source of Truth: Progress file heartbeat is the ONLY source of feature state
 * 2. Explicit State Machine: Clear states with explicit transitions and guards
 * 3. Event-Driven Updates: React to heartbeat changes, not polling timeouts
 * 4. Atomic State Transitions: No partial updates possible
 * 5. Cleanup Before Retry: Always kill processes before creating new ones
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Valid states for a feature in the orchestrator.
 *
 * State flow:
 * queued → assigning → initializing → executing → completing → completed
 *                  ↘         ↓           ↓           ↓
 *                    retrying ← ← ← ← ← ← ← ← ← ← ←
 *                       ↓
 *                    failed (after max retries)
 */
export type FeatureState =
	| "queued" // In queue, not yet assigned
	| "assigning" // Being assigned to sandbox (atomic)
	| "initializing" // Sandbox preparing, Claude CLI starting
	| "executing" // Claude CLI running, heartbeats active
	| "completing" // Tasks done, waiting for final commit
	| "completed" // Successfully finished
	| "failed" // Failed with error
	| "retrying"; // Cleaning up for retry

/**
 * Context passed to state machine guards and actions.
 */
export interface FeatureContext {
	/** The feature ID (semantic or legacy string format) */
	featureId: string;
	/** Current feature status */
	currentState: FeatureState;
	/** Sandbox ID if assigned */
	sandboxId?: string;
	/** Whether sandbox is available and idle */
	sandboxIdle: boolean;
	/** Whether all feature dependencies are completed */
	dependenciesCompleted: boolean;
	/** Whether progress file exists */
	progressFileExists: boolean;
	/** Whether heartbeat is recent (not stale) */
	heartbeatRecent: boolean;
	/** Progress file status */
	progressStatus?: "in_progress" | "completed" | "failed" | "blocked";
	/** Whether tasks have started executing */
	tasksStarted: boolean;
	/** Whether git push succeeded */
	gitPushSuccess: boolean;
	/** Current retry count */
	retryCount: number;
	/** Maximum retry attempts */
	maxRetries: number;
	/** Whether process was killed successfully */
	processKilled: boolean;
	/** Whether there was an error */
	hasError: boolean;
	/** Error message if any */
	errorMessage?: string;
}

/**
 * A state transition definition.
 */
export interface StateTransition {
	/** Valid source states for this transition */
	from: FeatureState[];
	/** Target state */
	to: FeatureState;
	/** Name of this transition (for logging) */
	name: string;
	/** Guard function - returns true if transition is allowed */
	guard: (context: FeatureContext) => boolean;
}

/**
 * Result of attempting a state transition.
 */
export interface TransitionResult {
	/** Whether the transition was successful */
	success: boolean;
	/** Previous state */
	fromState: FeatureState;
	/** New state (same as fromState if transition failed) */
	toState: FeatureState;
	/** Transition name if successful */
	transitionName?: string;
	/** Error message if transition failed */
	error?: string;
}

// ============================================================================
// State Transitions
// ============================================================================

/**
 * All valid state transitions for the feature state machine.
 *
 * Each transition has:
 * - from: Array of valid source states
 * - to: Target state
 * - name: Human-readable transition name
 * - guard: Function that returns true if transition is allowed
 */
export const STATE_TRANSITIONS: StateTransition[] = [
	// Queued → Assigning: Sandbox is idle and dependencies are met
	{
		from: ["queued"],
		to: "assigning",
		name: "assign_to_sandbox",
		guard: (ctx) => ctx.sandboxIdle && ctx.dependenciesCompleted,
	},

	// Assigning → Initializing: Sandbox assigned and progress file created
	{
		from: ["assigning"],
		to: "initializing",
		name: "start_initialization",
		guard: (ctx) => ctx.sandboxId !== undefined && ctx.progressFileExists,
	},

	// Initializing → Executing: Heartbeat is recent and tasks have started
	{
		from: ["initializing"],
		to: "executing",
		name: "start_execution",
		guard: (ctx) => ctx.heartbeatRecent && ctx.tasksStarted,
	},

	// Executing → Completing: Progress file shows completed
	{
		from: ["executing"],
		to: "completing",
		name: "tasks_completed",
		guard: (ctx) => ctx.progressStatus === "completed",
	},

	// Completing → Completed: Git push succeeded
	{
		from: ["completing"],
		to: "completed",
		name: "finalize_completion",
		guard: (ctx) => ctx.gitPushSuccess,
	},

	// Initializing/Executing → Retrying: Heartbeat is stale or error occurred
	{
		from: ["initializing", "executing"],
		to: "retrying",
		name: "trigger_retry",
		guard: (ctx) => !ctx.heartbeatRecent || ctx.hasError,
	},

	// Retrying → Queued: Can retry and process was killed
	{
		from: ["retrying"],
		to: "queued",
		name: "reset_for_retry",
		guard: (ctx) => ctx.retryCount < ctx.maxRetries && ctx.processKilled,
	},

	// Retrying → Failed: Max retries exceeded
	{
		from: ["retrying"],
		to: "failed",
		name: "max_retries_exceeded",
		guard: (ctx) => ctx.retryCount >= ctx.maxRetries,
	},

	// Any error state → Failed: Direct failure path
	{
		from: ["assigning", "initializing", "executing", "completing"],
		to: "failed",
		name: "direct_failure",
		guard: (ctx) => ctx.hasError && ctx.retryCount >= ctx.maxRetries,
	},
];

// ============================================================================
// State Machine Class
// ============================================================================

/**
 * Event listener type for state transitions.
 */
export type TransitionListener = (
	featureId: string,
	fromState: FeatureState,
	toState: FeatureState,
	transitionName: string,
) => void;

/**
 * Feature State Machine
 *
 * Manages state transitions for features with explicit guards and logging.
 * Ensures all transitions are valid and atomic.
 */
export class FeatureStateMachine {
	private states: Map<string, FeatureState> = new Map();
	private listeners: TransitionListener[] = [];

	/**
	 * Register a listener for state transitions.
	 */
	onTransition(listener: TransitionListener): void {
		this.listeners.push(listener);
	}

	/**
	 * Remove a transition listener.
	 */
	offTransition(listener: TransitionListener): void {
		const index = this.listeners.indexOf(listener);
		if (index >= 0) {
			this.listeners.splice(index, 1);
		}
	}

	/**
	 * Initialize a feature with the given state.
	 */
	initializeFeature(featureId: string, state: FeatureState = "queued"): void {
		this.states.set(featureId, state);
	}

	/**
	 * Get the current state of a feature.
	 */
	getState(featureId: string): FeatureState | undefined {
		return this.states.get(featureId);
	}

	/**
	 * Check if a feature exists in the state machine.
	 */
	hasFeature(featureId: string): boolean {
		return this.states.has(featureId);
	}

	/**
	 * Remove a feature from the state machine.
	 */
	removeFeature(featureId: string): void {
		this.states.delete(featureId);
	}

	/**
	 * Attempt a state transition for a feature.
	 *
	 * @param featureId - The feature ID
	 * @param targetState - The desired target state
	 * @param context - Context for evaluating transition guards
	 * @returns Result indicating success/failure and state changes
	 */
	transition(
		featureId: string,
		targetState: FeatureState,
		context: Omit<FeatureContext, "featureId" | "currentState">,
	): TransitionResult {
		const currentState = this.states.get(featureId);

		if (!currentState) {
			return {
				success: false,
				fromState: "queued",
				toState: "queued",
				error: `Feature ${featureId} not found in state machine`,
			};
		}

		// Find a valid transition
		const transition = STATE_TRANSITIONS.find(
			(t) =>
				t.from.includes(currentState) &&
				t.to === targetState &&
				t.guard({ ...context, featureId, currentState }),
		);

		if (!transition) {
			return {
				success: false,
				fromState: currentState,
				toState: currentState,
				error: `No valid transition from ${currentState} to ${targetState}`,
			};
		}

		// Execute the transition
		this.states.set(featureId, targetState);

		// Notify listeners
		for (const listener of this.listeners) {
			try {
				listener(featureId, currentState, targetState, transition.name);
			} catch {
				// Ignore listener errors
			}
		}

		return {
			success: true,
			fromState: currentState,
			toState: targetState,
			transitionName: transition.name,
		};
	}

	/**
	 * Get all possible transitions from the current state.
	 *
	 * @param featureId - The feature ID
	 * @returns Array of possible target states
	 */
	getPossibleTransitions(featureId: string): FeatureState[] {
		const currentState = this.states.get(featureId);
		if (!currentState) {
			return [];
		}

		return STATE_TRANSITIONS.filter((t) => t.from.includes(currentState)).map(
			(t) => t.to,
		);
	}

	/**
	 * Check if a transition is valid without executing it.
	 *
	 * @param featureId - The feature ID
	 * @param targetState - The desired target state
	 * @param context - Context for evaluating transition guards
	 * @returns true if the transition would be valid
	 */
	canTransition(
		featureId: string,
		targetState: FeatureState,
		context: Omit<FeatureContext, "featureId" | "currentState">,
	): boolean {
		const currentState = this.states.get(featureId);
		if (!currentState) {
			return false;
		}

		return STATE_TRANSITIONS.some(
			(t) =>
				t.from.includes(currentState) &&
				t.to === targetState &&
				t.guard({ ...context, featureId, currentState }),
		);
	}

	/**
	 * Get a snapshot of all feature states.
	 */
	getAllStates(): Map<string, FeatureState> {
		return new Map(this.states);
	}

	/**
	 * Clear all feature states.
	 */
	clear(): void {
		this.states.clear();
	}
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a state is a terminal state (completed or failed).
 */
export function isTerminalState(state: FeatureState): boolean {
	return state === "completed" || state === "failed";
}

/**
 * Check if a state is an active state (feature is being worked on).
 */
export function isActiveState(state: FeatureState): boolean {
	return ["assigning", "initializing", "executing", "completing"].includes(
		state,
	);
}

/**
 * Check if a state indicates the feature can be assigned.
 */
export function isAssignableState(state: FeatureState): boolean {
	return state === "queued";
}

/**
 * Create a default feature context with safe defaults.
 */
export function createDefaultContext(): Omit<
	FeatureContext,
	"featureId" | "currentState"
> {
	return {
		sandboxIdle: false,
		dependenciesCompleted: false,
		progressFileExists: false,
		heartbeatRecent: false,
		tasksStarted: false,
		gitPushSuccess: false,
		retryCount: 0,
		maxRetries: 3,
		processKilled: false,
		hasError: false,
	};
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global state machine instance for the orchestrator.
 */
export const featureStateMachine = new FeatureStateMachine();
