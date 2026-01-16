/**
 * Event Emitter for Orchestrator Operations
 *
 * Sends orchestrator events (database setup, sandbox creation, etc.) to the
 * event server via HTTP POST. Uses fire-and-forget pattern to avoid blocking
 * orchestrator operations.
 *
 * Events are sent to the same event server that handles sandbox WebSocket events,
 * allowing the UI dashboard to display orchestrator-side operations in real-time.
 */

import { EVENT_SERVER_PORT } from "../config/constants.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Event types emitted by the orchestrator for database operations
 */
export type OrchestratorDatabaseEventType =
	| "db_capacity_check"
	| "db_capacity_ok"
	| "db_capacity_warning"
	| "db_reset_start"
	| "db_reset_complete"
	| "db_migration_start"
	| "db_migration_complete"
	| "db_seed_start"
	| "db_seed_complete"
	| "db_verify";

/**
 * Structure of an orchestrator event sent to the event server
 */
export interface OrchestratorEmittedEvent {
	/** Special sandbox_id to distinguish orchestrator events */
	sandbox_id: "orchestrator";
	/** Event type for categorization */
	event_type: OrchestratorDatabaseEventType;
	/** ISO 8601 timestamp when event occurred */
	timestamp: string;
	/** Human-readable message for display */
	message: string;
	/** Optional additional details */
	details?: Record<string, unknown>;
}

// ============================================================================
// Configuration
// ============================================================================

/** URL for the event server API endpoint */
const EVENT_SERVER_URL = `http://localhost:${EVENT_SERVER_PORT}/api/events`;

// ============================================================================
// Event Emitter
// ============================================================================

/**
 * Emit an orchestrator event to the event server.
 *
 * This function uses fire-and-forget pattern:
 * - Does not await the HTTP request
 * - Silently handles any errors (event server may not be running)
 * - Never blocks or throws - orchestrator continues regardless of event delivery
 *
 * @param eventType - Type of event being emitted
 * @param message - Human-readable message for the event
 * @param details - Optional additional details to include
 */
export function emitOrchestratorEvent(
	eventType: OrchestratorDatabaseEventType,
	message: string,
	details?: Record<string, unknown>,
): void {
	const event: OrchestratorEmittedEvent = {
		sandbox_id: "orchestrator",
		event_type: eventType,
		timestamp: new Date().toISOString(),
		message,
		...(details && { details }),
	};

	// Fire-and-forget: send event without blocking
	// Using fetch with .catch() to handle errors gracefully
	fetch(EVENT_SERVER_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(event),
	}).catch((err) => {
		// In non-UI mode (ORCHESTRATOR_UI_ENABLED not set), log the error to help with debugging
		// In UI mode, silently ignore - orchestrator continues regardless of event delivery
		if (!process.env.ORCHESTRATOR_UI_ENABLED) {
			console.error(
				`⚠️ Failed to emit event to event server: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	});
}

/**
 * Emit multiple orchestrator events in sequence.
 * Useful for batch operations where multiple status updates are needed.
 *
 * @param events - Array of event specifications
 */
export function emitOrchestratorEvents(
	events: Array<{
		eventType: OrchestratorDatabaseEventType;
		message: string;
		details?: Record<string, unknown>;
	}>,
): void {
	for (const { eventType, message, details } of events) {
		emitOrchestratorEvent(eventType, message, details);
	}
}
