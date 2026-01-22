/**

* Type definitions for the Alpha Spec Orchestrator UI
*
* These types define the state management for the persistent 3-column
* dashboard that monitors E2B sandboxes running Claude Code agents.
 */

// =============================================================================
// Health & Status Types
// =============================================================================

/**

* Health status of a sandbox, computed from heartbeat age and task state
 */
export type HealthStatus =
	| "running" // Active and healthy (heartbeat recent)
	| "warning" // Heartbeat getting stale (2-5 minutes)
	| "stalled" // No activity for too long (>5 minutes)
	| "idle" // No work assigned
	| "completed" // All work finished successfully
	| "failed"; // Fatal error occurred

/**

* Execution phase of a sandbox
 */
export type Phase =
	| "idle"
	| "loading_context"
	| "loading_research"
	| "loading_docs"
	| "analyzing_parallelism"
	| "executing"
	| "verifying"
	| "committing"
	| "pushing"
	| "completed"
	| "failed";

/**

* Sandbox operational status (from orchestrator)
 */
export type SandboxStatus = "ready" | "busy" | "completed" | "failed";

// =============================================================================
// Feature & Task Types
// =============================================================================

/**

* Information about the feature being implemented
 */
export interface FeatureInfo {
	/** Feature ID (semantic: S1362.I1.F1 or legacy: 1367) */
	id: string;
	/** Feature title */
	title: string;
}

/**

* Information about the current task
 */
export interface TaskInfo {
	/**Task ID (e.g., "T5") */
	id: string;
	/** Task name/description */
	name: string;
	/**Current task status */
	status: "starting" | "in_progress" | "completed" | "failed" | "blocked";
	/** Number of verification attempts (for retry tracking) */
	verificationAttempts?: number;
	/**When the task started*/
	startedAt?: Date;
}

/**

* Information about the current execution group
 */
export interface GroupInfo {
	/**Group ID (1-based) */
	id: number;
	/** Group name */
	name: string;
	/**Total tasks in group */
	tasksTotal: number;
	/** Completed tasks in group */
	tasksCompleted: number;
}

// =============================================================================
// Sandbox State Types
// =============================================================================

/**

* Complete state of a single sandbox for UI display
 */
export interface SandboxState {
	/**E2B sandbox ID */
	sandboxId: string;
	/** Display label (sbx-a, sbx-b, sbx-c) */
	label: string;
	/**Operational status from orchestrator */
	status: SandboxStatus;
	/** Feature currently being implemented */
	currentFeature: FeatureInfo | null;
	/**Task currently being worked on */
	currentTask: TaskInfo | null;
	/** Current execution group */
	currentGroup: GroupInfo | null;
	/**Current execution phase */
	phase: Phase;
	/** Number of completed tasks */
	tasksCompleted: number;
	/**Total tasks for current feature */
	tasksTotal: number;
	/** Context window usage percentage (0-100) */
	contextUsage: number;
	/**Last heartbeat timestamp */
	lastHeartbeat: Date | null;
	/** Last tool that was executed (from PostToolUse hook) */
	lastTool: string | null;
	/**Total tool call count */
	toolCount: number;
	/** Number of session restarts/resumes */
	retryCount: number;
	/**Error message if failed */
	error?: string;
	/** Last git commit hash */
	lastCommit?: string;
	/** Reason why sandbox is waiting for work */
	waitingReason?: string;
	/** Feature IDs blocking this sandbox from getting work */
	blockedBy?: number[];
	/** Recent output lines from sandbox log (last 3 lines) */
	recentOutput?: string[];
}

// =============================================================================
// Overall Progress Types
// =============================================================================

/**

* Review URL for accessing sandbox after completion
 */
export interface ReviewUrl {
	/**Sandbox label (e.g., "sbx-a") */
	label: string;
	/** VS Code server URL */
	vscode: string;
	/**Dev server URL*/
	devServer: string;
}

/**
 * Overall spec-level progress
 */
export interface OverallProgress {
	/**Spec ID (semantic S1362 or legacy 1362) */
	specId: string;
	/** Spec name/title */
	specName: string;
	/**Completed initiatives count */
	initiativesCompleted: number;
	/** Total initiatives count */
	initiativesTotal: number;
	/**Completed features count */
	featuresCompleted: number;
	/** Total features count */
	featuresTotal: number;
	/**Completed tasks count (across all features) */
	tasksCompleted: number;
	/** Total tasks count (across all features) */
	tasksTotal: number;
	/**Overall status*/
	status: "pending" | "in_progress" | "completed" | "partial" | "failed";
	/** Git branch name for the spec */
	branchName?: string;
	/** Review URLs for accessing completed sandboxes*/
	reviewUrls?: ReviewUrl[];
	/** Run ID for this orchestrator session */
	runId?: string;
}

// =============================================================================
// Event Types
// =============================================================================

/**

* Event types for the event log
 */
export type OrchestratorEventType =
	| "task_start"
	| "task_complete"
	| "task_failed"
	| "feature_start"
	| "feature_complete"
	| "group_complete"
	| "commit"
	| "push"
	| "error"
	| "health_warning"
	| "stall_detected"
	| "sandbox_restart"
	| "context_limit"
	| "sandbox_idle"
	| "sandbox_unblocked"
	// Database operation event types (from orchestrator)
	| "db_capacity_check"
	| "db_capacity_ok"
	| "db_capacity_warning"
	| "db_reset_start"
	| "db_reset_complete"
	| "db_migration_start"
	| "db_migration_complete"
	| "db_seed_start"
	| "db_seed_complete"
	| "db_verify"
	// Completion phase event types (from orchestrator)
	| "completion_phase_start"
	| "sandbox_killing"
	| "review_sandbox_creating"
	| "dev_server_starting"
	| "dev_server_ready"
	| "dev_server_failed";

/**

* Event for the event log display
 */
export interface OrchestratorEvent {
	/**Unique event ID */
	id: string;
	/** Event timestamp */
	timestamp: Date;
	/**Event type */
	type: OrchestratorEventType;
	/** Which sandbox generated this event */
	sandboxLabel: string;
	/**Human-readable message */
	message: string;
	/** Additional event details */
	details?: Record<string, unknown>;
}

// =============================================================================
// UI State Types
// =============================================================================

/**

* UI display mode
 */
export type UIMode = "dashboard" | "streaming";

/**

* Complete UI state
 */
export interface UIState {
	/**State for each sandbox (keyed by label) */
	sandboxes: Map<string, SandboxState>;
	/** Overall spec progress */
	overallProgress: OverallProgress;
	/**Recent events for event log */
	events: OrchestratorEvent[];
	/** When the orchestrator session started */
	sessionStartTime: Date;
	/**Current UI mode*/
	uiMode: UIMode;
}

// =============================================================================
// Progress File Types (from sandbox)
// =============================================================================

/**

* Structure of .initiative-progress.json file in sandbox
* This is what gets written by /alpha:implement and the heartbeat hook
 */
export interface SandboxProgressFile {
	/**Feature being implemented */
	feature?: {
		issue_number: string;
		title: string;
	};
	/** Current task information */
	current_task?: {
		id: string;
		name: string;
		status: string;
		started_at?: string;
		verification_attempts?: number;
	};
	/**Current execution group */
	current_group?: {
		id: number;
		name: string;
		tasks_total: number;
		tasks_completed: number;
		batch?: {
			batch_id: number;
			task_ids: string[];
			status: string;
		};
		execution_mode?: string;
	};
	/** Completed task IDs */
	completed_tasks?: string[];
	/**Failed task IDs */
	failed_tasks?: string[];
	/** Context window usage percentage */
	context_usage_percent?: number;
	/**Overall status */
	status?: string;
	/** Current phase */
	phase?: string;
	/**Last heartbeat timestamp (ISO 8601) */
	last_heartbeat?: string;
	/** Last tool executed (from PostToolUse hook) */
	last_tool?: string;
	/**Tool usage counts by tool name */
	tool_counts?: Record<string, number>;
	/** Total tool call count */
	tool_count?: number;
	/**Last commit hash */
	last_commit?: string;
	/** Session ID (from Claude Code) */
	session_id?: string;
	/** Reason why sandbox is waiting (when idle) */
	waiting_reason?: string;
	/** Feature IDs blocking this sandbox from getting work */
	blocked_by?: number[];
	/**Subagent completion count */
	subagent_count?: number;
	/** Last subagent stop timestamp */
	last_subagent_stop?: string;
	/**Checkpoint type for crash recovery */
	checkpoint_type?: "pre_task" | "post_task" | "pre_group" | "post_group";
	/** Last checkpoint timestamp */
	last_checkpoint?: string;
	/**Parallel execution info */
	parallel_execution?: {
		mode: "parallel" | "sequential";
		batch_started_at?: string;
		agents?: Record<
			string,
			{
				agent_id: string;
				status: string;
				result?: string;
			}
		>;
		completed?: string[];
		pending?: string[];
	};
	/** Event log entries */
	entries?: Array<{
		timestamp: string;
		type: string;
		message: string;
	}>;
	/** Recent output lines from Claude Code execution (real-time from JSON) */
	recent_output?: string[];
	/** Run ID for this orchestrator session */
	runId?: string;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**

* Props for ProgressBar component
 */
export interface ProgressBarProps {
	/**Current value */
	current: number;
	/** Total/maximum value */
	total: number;
	/**Width in characters */
	width?: number;
	/** Show percentage after bar */
	showPercentage?: boolean;
	/**Show count (current/total) after bar */
	showCount?: boolean;
	/** Character for filled portion */
	filledChar?: string;
	/**Character for empty portion */
	emptyChar?: string;
	/** Color for filled portion */
	filledColor?: string;
	/**Color for empty portion*/
	emptyColor?: string;
}

/**

* Props for Header component
 */
export interface HeaderProps {
	/**Overall progress data */
	progress: OverallProgress;
	/** Session start time for elapsed calculation */
	sessionStartTime: Date;
	/** Event stream connection status (optional) */
	eventStreamStatus?: EventServerStatus;
	/** Event stream event count (optional) */
	eventStreamCount?: number;
	/** Run ID for this orchestrator session (optional) */
	runId?: string;
}

/**

* Props for SandboxColumn component
 */
export interface SandboxColumnProps {
	/**Sandbox state to display*/
	state: SandboxState;
}

/**

* Props for SandboxGrid component
 */
export interface SandboxGridProps {
	/**All sandbox states*/
	sandboxes: Map<string, SandboxState>;
}

/**

* Props for OverallProgress component
 */
export interface OverallProgressProps {
	/**Progress data*/
	progress: OverallProgress;
}

/**

* Props for EventLog component
 */
export interface EventLogProps {
	/**Events to display */
	events: OrchestratorEvent[];
	/** Maximum events to show */
	maxEvents?: number;
}

/**

* Props for root OrchestratorUI component
 */
export interface OrchestratorUIProps {
	/**Complete UI state*/
	state: UIState;
	/** Event stream connection status (optional) */
	eventStreamStatus?: EventServerStatus;
	/** Event stream event count (optional) */
	eventStreamCount?: number;
}

// =============================================================================
// Callback Types
// =============================================================================

/**

* Callback for sandbox state updates
 */
export type SandboxStateUpdateCallback = (
	label: string,
	update: Partial<SandboxState>,
) => void;

/**

* Callback for adding events
 */
export type AddEventCallback = (
	event: Omit<OrchestratorEvent, "id" | "timestamp">,
) => void;

/**

* Callback for overall progress updates
 */
export type UpdateProgressCallback = (update: Partial<OverallProgress>) => void;

// =============================================================================
// Hook Types
// =============================================================================

/**

* Options for useProgressPoller hook
 */
export interface UseProgressPollerOptions {
	/**E2B sandbox instance */
	sandbox: {
		commands: {
			run: (
				command: string,
				options?: { timeoutMs?: number },
			) => Promise<{ stdout?: string; stderr?: string; exitCode?: number }>;
		};
	};
	/** Sandbox label (sbx-a, sbx-b, sbx-c) */
	label: string;
	/**Session start time for filtering stale data */
	sessionStartTime: Date;
	/** Callback when progress updates */
	onUpdate: SandboxStateUpdateCallback;
	/**Callback on polling error */
	onError?: (label: string, error: Error) => void;
	/** Polling interval in ms (default: 15000) */
	pollInterval?: number;
	/**Whether polling is enabled*/
	enabled?: boolean;
}

// =============================================================================
// UI Manager Types
// =============================================================================

/**

* Sandbox instance passed to UI manager
 */
export interface SandboxInstance {
	/**E2B sandbox object */
	sandbox: UseProgressPollerOptions["sandbox"];
	/** E2B sandbox ID */
	id: string;
	/**Display label*/
	label: string;
}

/**
 * Options for starting the UI
 */
export interface StartUIOptions {
	/**Spec ID (semantic S1362 or legacy 1362) */
	specId: string;
	/** Spec name */
	specName: string;
	/**Sandbox instances to monitor */
	sandboxInstances: SandboxInstance[];
	/** Initial progress state */
	initialProgress: OverallProgress;
}

/**

* Return value from startUI function
 */
export interface UIHandle {
	/**Update overall progress */
	updateOverallProgress: UpdateProgressCallback;
	/** Add an event to the log */
	addEvent: AddEventCallback;
	/**Update a specific sandbox state */
	updateSandboxState: SandboxStateUpdateCallback;
	/** Promise that resolves when UI exits */
	waitUntilExit: Promise<void>;
}

// =============================================================================
// Constants
// =============================================================================

/**

* Polling interval for progress checks (ms) - reduced from 15s to 5s for more responsive updates
 */
export const POLL_INTERVAL_MS = 5000;

/**

* Heartbeat age threshold for warning status (ms)
 */
export const HEARTBEAT_WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

/**

* Heartbeat age threshold for stalled status (ms)
 */
export const HEARTBEAT_STALL_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**

* Workspace directory in sandbox
 */
export const WORKSPACE_DIR = "/home/user/project";

/**

* Progress file path in sandbox
 */
export const PROGRESS_FILE = ".initiative-progress.json";

/**

* Maximum events to keep in memory
 */
export const MAX_EVENTS = 100;

/**
 * Maximum events to display in UI
 * Kept intentionally small to prevent visual clutter in sandbox columns
 */
export const MAX_DISPLAY_EVENTS = 6;

// =============================================================================
// Event Streaming Types
// =============================================================================

/**
 * Status of the WebSocket connection to the event server
 */
export type EventServerStatus =
	| "connected"
	| "connecting"
	| "disconnected"
	| "error";

/**
 * Event received from the WebSocket stream
 */
export interface WebSocketEvent {
	/** Unique event ID */
	id: string;
	/** Sandbox that generated this event */
	sandbox_id: string;
	/** Type of event (post_tool_use, subagent_stop, session_stop, task_progress, heartbeat) */
	event_type: string;
	/** ISO timestamp when event occurred */
	timestamp: string;
	/** ISO timestamp when server received the event */
	server_received_at?: string;
	/** Claude Code session ID */
	session_id?: string;
	/** Tool name (for post_tool_use events) */
	tool_name?: string;
	/** File path (for file operations) */
	file_path?: string;
	/** Todo summary (for task_progress events) */
	todo_summary?: {
		completed: number;
		in_progress: number;
		pending: number;
		total: number;
	};
	/** Subagent info (for subagent_stop events) */
	subagent_id?: string;
	subagent_type?: string;
	/** Stop reason (for session_stop events) */
	exit_reason?: string;
	exit_code?: number;
	/** Result info */
	result_success?: boolean;
	result_error?: string;
}

/**
 * Message types received from WebSocket
 */
export type WebSocketMessageType =
	| "connected"
	| "initial_events"
	| "event"
	| "ping"
	| "pong"
	| "ui_ready_confirmed"
	| "ui_status";

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
	type: WebSocketMessageType;
	timestamp?: string;
	events_available?: number;
	data?: WebSocketEvent | WebSocketEvent[];
}

/**
 * State for the event stream hook
 */
export interface EventStreamState {
	/** Connection status */
	status: EventServerStatus;
	/** Recent events from the stream */
	events: WebSocketEvent[];
	/** Last error message */
	error: string | null;
	/** When connection was last established */
	connectedAt: Date | null;
	/** Number of events received this session */
	eventCount: number;
	/** Reconnection attempt count */
	reconnectAttempts: number;
}

/**
 * Options for the useEventStream hook
 */
export interface UseEventStreamOptions {
	/** WebSocket server URL (e.g., ws://localhost:9000/ws) */
	url: string;
	/** Whether streaming is enabled */
	enabled?: boolean;
	/** Callback when an event is received */
	onEvent?: (event: WebSocketEvent) => void;
	/** Callback when connection status changes */
	onStatusChange?: (status: EventServerStatus) => void;
	/** Maximum events to keep in memory */
	maxEvents?: number;
	/** Reconnect delay in ms (default: 3000) */
	reconnectDelay?: number;
	/** Max reconnect attempts before giving up (default: 10) */
	maxReconnectAttempts?: number;
}

/**
 * Return type for useEventStream hook
 */
export interface UseEventStreamResult {
	/** Current connection status */
	status: EventServerStatus;
	/** Recent events */
	events: WebSocketEvent[];
	/** Last error */
	error: string | null;
	/** Total events received this session */
	eventCount: number;
	/** Manually reconnect */
	reconnect: () => void;
	/** Manually disconnect */
	disconnect: () => void;
}

/**
 * Props for EventStreamStatus component
 */
export interface EventStreamStatusProps {
	/** Current connection status */
	status: EventServerStatus;
	/** Events received count */
	eventCount?: number;
	/** Last event timestamp */
	lastEventAt?: Date | null;
}

/**
 * Event server port
 */
export const EVENT_SERVER_PORT = 9000;

/**
 * Default WebSocket reconnect delay
 */
export const WEBSOCKET_RECONNECT_DELAY_MS = 3000;

/**
 * Maximum reconnect attempts
 */
export const WEBSOCKET_MAX_RECONNECT_ATTEMPTS = 10;
