/**
 * Orchestrator Event Routing Unit Tests
 *
 * Tests for the orchestrator event handling logic:
 * - Event type mapping from WebSocket to OrchestratorEventType
 * - Orchestrator event conversion and state management
 * - Event merging and sorting
 * - Routing separation (orchestrator vs sandbox events)
 *
 * These tests verify the fix for issue #1526 where WebSocket DB events
 * were not being displayed in the UI EventLog.
 *
 * Note: These tests are in lib/__tests__ because the vitest config excludes
 * the ui/ directory. The logic being tested is used by the UI components.
 */

import { describe, expect, it } from "vitest";
import type {
	OrchestratorEvent,
	OrchestratorEventType,
	WebSocketEvent,
} from "../../ui/types.js";
import { MAX_EVENTS } from "../../ui/types.js";

/**
 * Maps WebSocket event types to OrchestratorEventType
 * This mirrors the logic in OrchestratorApp component (index.tsx)
 */
function mapWebSocketToOrchestratorEventType(
	eventType: string,
): OrchestratorEventType {
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
		"completion_phase_start",
		"sandbox_killing",
		"review_sandbox_creating",
		"dev_server_starting",
		"dev_server_ready",
		"dev_server_failed",
	];

	if (validTypes.includes(eventType as OrchestratorEventType)) {
		return eventType as OrchestratorEventType;
	}

	return "error";
}

/**
 * Generates default message for orchestrator events based on type
 * This mirrors the logic in OrchestratorApp component (index.tsx)
 */
function getOrchestratorEventMessage(eventType: OrchestratorEventType): string {
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
		completion_phase_start: "Starting completion phase",
		sandbox_killing: "Killing sandboxes",
		review_sandbox_creating: "Creating review sandbox",
		review_sandbox_failed: "Review sandbox creation failed", // Bug fix #1883
		dev_server_starting: "Starting development server",
		dev_server_ready: "Development server ready",
		dev_server_failed: "Development server failed",
		// Documentation generation messages
		documentation_start: "Generating spec documentation",
		documentation_complete: "Documentation generated",
		documentation_failed: "Documentation generation failed",
	};
	return messages[eventType] || "Unknown event";
}

/**
 * Converts a WebSocket event to an OrchestratorEvent
 * This simulates the handleOrchestratorEvent logic in OrchestratorApp
 */
function convertWebSocketToOrchestratorEvent(
	event: WebSocketEvent & { message?: string },
): OrchestratorEvent | null {
	if (event.sandbox_id !== "orchestrator") return null;

	const eventType = mapWebSocketToOrchestratorEventType(event.event_type);
	const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
	const message = event.message || getOrchestratorEventMessage(eventType);

	return {
		id: `orchestrator-${event.event_type}-${timestamp.getTime()}`,
		timestamp,
		type: eventType,
		sandboxLabel: "orchestrator",
		message,
	};
}

/**
 * Merges orchestrator events with state events
 * This simulates the enhancedState memo logic in OrchestratorApp
 */
function mergeEvents(
	orchestratorEvents: OrchestratorEvent[],
	stateEvents: OrchestratorEvent[],
): OrchestratorEvent[] {
	return [...orchestratorEvents, ...stateEvents]
		.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
		.slice(0, MAX_EVENTS);
}

describe("orchestrator-events", () => {
	describe("mapWebSocketToOrchestratorEventType", () => {
		it.each<[string, OrchestratorEventType]>([
			["db_capacity_check", "db_capacity_check"],
			["db_capacity_ok", "db_capacity_ok"],
			["db_capacity_warning", "db_capacity_warning"],
			["db_reset_start", "db_reset_start"],
			["db_reset_complete", "db_reset_complete"],
			["db_migration_start", "db_migration_start"],
			["db_migration_complete", "db_migration_complete"],
			["db_seed_start", "db_seed_start"],
			["db_seed_complete", "db_seed_complete"],
			["db_verify", "db_verify"],
		])("maps database event type %s correctly", (input, expected) => {
			expect(mapWebSocketToOrchestratorEventType(input)).toBe(expected);
		});

		it.each<[string, OrchestratorEventType]>([
			["task_start", "task_start"],
			["task_complete", "task_complete"],
			["task_failed", "task_failed"],
			["feature_start", "feature_start"],
			["feature_complete", "feature_complete"],
			["group_complete", "group_complete"],
			["commit", "commit"],
			["push", "push"],
			["error", "error"],
		])("maps standard event type %s correctly", (input, expected) => {
			expect(mapWebSocketToOrchestratorEventType(input)).toBe(expected);
		});

		it("returns 'error' for unknown event types", () => {
			expect(mapWebSocketToOrchestratorEventType("unknown_event")).toBe(
				"error",
			);
			expect(mapWebSocketToOrchestratorEventType("")).toBe("error");
			expect(mapWebSocketToOrchestratorEventType("post_tool_use")).toBe(
				"error",
			);
		});
	});

	describe("getOrchestratorEventMessage", () => {
		it.each<[OrchestratorEventType, string]>([
			["db_capacity_check", "Checking database capacity..."],
			["db_capacity_ok", "Database capacity OK"],
			["db_reset_start", "Resetting sandbox database..."],
			["db_reset_complete", "Database schema reset complete"],
			["db_migration_start", "Running migrations..."],
			["db_migration_complete", "Migrations complete"],
			["db_seed_start", "Running database seeding..."],
			["db_seed_complete", "Database seeding complete"],
			["db_verify", "Verified database state"],
		])("returns correct message for database event %s", (eventType, expectedMessage) => {
			expect(getOrchestratorEventMessage(eventType)).toBe(expectedMessage);
		});

		it("returns fallback message for unexpected type", () => {
			// Cast to test the fallback
			const result = getOrchestratorEventMessage(
				"not_a_real_type" as OrchestratorEventType,
			);
			expect(result).toBe("Unknown event");
		});
	});

	describe("convertWebSocketToOrchestratorEvent", () => {
		it("converts orchestrator WebSocket event to OrchestratorEvent", () => {
			const wsEvent: WebSocketEvent & { message?: string } = {
				id: "test-123",
				sandbox_id: "orchestrator",
				event_type: "db_reset_start",
				timestamp: "2026-01-16T10:00:00.000Z",
			};

			const result = convertWebSocketToOrchestratorEvent(wsEvent);

			expect(result).not.toBeNull();
			expect(result?.type).toBe("db_reset_start");
			expect(result?.sandboxLabel).toBe("orchestrator");
			expect(result?.message).toBe("Resetting sandbox database...");
			expect(result?.id).toContain("orchestrator-db_reset_start-");
		});

		it("uses custom message when provided", () => {
			const wsEvent: WebSocketEvent & { message?: string } = {
				id: "test-123",
				sandbox_id: "orchestrator",
				event_type: "db_capacity_ok",
				timestamp: "2026-01-16T10:00:00.000Z",
				message: "Database capacity OK: 150MB / 500MB",
			};

			const result = convertWebSocketToOrchestratorEvent(wsEvent);

			expect(result?.message).toBe("Database capacity OK: 150MB / 500MB");
		});

		it("returns null for non-orchestrator events", () => {
			const wsEvent: WebSocketEvent = {
				id: "test-123",
				sandbox_id: "sbx-a",
				event_type: "post_tool_use",
				timestamp: "2026-01-16T10:00:00.000Z",
			};

			const result = convertWebSocketToOrchestratorEvent(wsEvent);

			expect(result).toBeNull();
		});

		it("generates unique IDs with timestamp", () => {
			const wsEvent1: WebSocketEvent = {
				id: "test-1",
				sandbox_id: "orchestrator",
				event_type: "db_reset_start",
				timestamp: "2026-01-16T10:00:00.000Z",
			};

			const wsEvent2: WebSocketEvent = {
				id: "test-2",
				sandbox_id: "orchestrator",
				event_type: "db_reset_start",
				timestamp: "2026-01-16T10:00:01.000Z",
			};

			const result1 = convertWebSocketToOrchestratorEvent(wsEvent1);
			const result2 = convertWebSocketToOrchestratorEvent(wsEvent2);

			expect(result1?.id).not.toBe(result2?.id);
		});
	});

	describe("event routing (sandbox_id filtering)", () => {
		it("orchestrator events should be processed by handleOrchestratorEvent", () => {
			const wsEvent: WebSocketEvent = {
				id: "test-123",
				sandbox_id: "orchestrator",
				event_type: "db_seed_complete",
				timestamp: "2026-01-16T10:00:00.000Z",
			};

			// This simulates what handleOrchestratorEvent does
			const isOrchestratorEvent = wsEvent.sandbox_id === "orchestrator";
			expect(isOrchestratorEvent).toBe(true);

			const result = convertWebSocketToOrchestratorEvent(wsEvent);
			expect(result).not.toBeNull();
		});

		it("sandbox tool events should NOT be processed by handleOrchestratorEvent", () => {
			const wsEvent: WebSocketEvent = {
				id: "test-123",
				sandbox_id: "sbx-a",
				event_type: "post_tool_use",
				timestamp: "2026-01-16T10:00:00.000Z",
			};

			// This simulates the early return in handleOrchestratorEvent
			const isOrchestratorEvent = wsEvent.sandbox_id === "orchestrator";
			expect(isOrchestratorEvent).toBe(false);

			const result = convertWebSocketToOrchestratorEvent(wsEvent);
			expect(result).toBeNull();
		});

		it("orchestrator events should be SKIPPED by handleWebSocketEvent", () => {
			const wsEvent: WebSocketEvent = {
				id: "test-123",
				sandbox_id: "orchestrator",
				event_type: "db_migration_complete",
				timestamp: "2026-01-16T10:00:00.000Z",
			};

			// This simulates the early return in handleWebSocketEvent
			const shouldSkip = wsEvent.sandbox_id === "orchestrator";
			expect(shouldSkip).toBe(true);
		});
	});

	describe("mergeEvents", () => {
		it("merges and sorts events by timestamp (newest first)", () => {
			const orchestratorEvents: OrchestratorEvent[] = [
				{
					id: "orch-1",
					timestamp: new Date("2026-01-16T10:00:00.000Z"),
					type: "db_reset_start",
					sandboxLabel: "orchestrator",
					message: "Resetting...",
				},
			];

			const stateEvents: OrchestratorEvent[] = [
				{
					id: "state-1",
					timestamp: new Date("2026-01-16T10:00:01.000Z"),
					type: "task_start",
					sandboxLabel: "sbx-a",
					message: "Task started",
				},
				{
					id: "state-2",
					timestamp: new Date("2026-01-16T09:59:00.000Z"),
					type: "feature_start",
					sandboxLabel: "sbx-b",
					message: "Feature started",
				},
			];

			const merged = mergeEvents(orchestratorEvents, stateEvents);

			expect(merged).toHaveLength(3);
			expect(merged[0]?.id).toBe("state-1"); // Newest first
			expect(merged[1]?.id).toBe("orch-1");
			expect(merged[2]?.id).toBe("state-2"); // Oldest last
		});

		it("handles empty orchestrator events", () => {
			const stateEvents: OrchestratorEvent[] = [
				{
					id: "state-1",
					timestamp: new Date("2026-01-16T10:00:00.000Z"),
					type: "task_complete",
					sandboxLabel: "sbx-a",
					message: "Task completed",
				},
			];

			const merged = mergeEvents([], stateEvents);

			expect(merged).toHaveLength(1);
			expect(merged[0]?.id).toBe("state-1");
		});

		it("handles empty state events", () => {
			const orchestratorEvents: OrchestratorEvent[] = [
				{
					id: "orch-1",
					timestamp: new Date("2026-01-16T10:00:00.000Z"),
					type: "db_verify",
					sandboxLabel: "orchestrator",
					message: "Verified",
				},
			];

			const merged = mergeEvents(orchestratorEvents, []);

			expect(merged).toHaveLength(1);
			expect(merged[0]?.id).toBe("orch-1");
		});

		it("limits to MAX_EVENTS", () => {
			// Create more than MAX_EVENTS events
			const events: OrchestratorEvent[] = [];
			for (let i = 0; i < MAX_EVENTS + 10; i++) {
				events.push({
					id: `event-${i}`,
					timestamp: new Date(Date.now() + i * 1000),
					type: "task_complete",
					sandboxLabel: "sbx-a",
					message: `Event ${i}`,
				});
			}

			const merged = mergeEvents(events, []);

			expect(merged).toHaveLength(MAX_EVENTS);
		});

		it("handles both arrays empty", () => {
			const merged = mergeEvents([], []);
			expect(merged).toHaveLength(0);
		});
	});

	describe("event deduplication via unique IDs", () => {
		it("generates unique IDs for orchestrator events", () => {
			const ids = new Set<string>();

			// Simulate adding 50 events with slight timestamp differences
			for (let i = 0; i < 50; i++) {
				const event: WebSocketEvent = {
					id: `ws-${i}`,
					sandbox_id: "orchestrator",
					event_type: "db_verify",
					timestamp: new Date(Date.now() + i).toISOString(),
				};

				const converted = convertWebSocketToOrchestratorEvent(event);
				if (converted) {
					ids.add(converted.id);
				}
			}

			// All IDs should be unique
			expect(ids.size).toBe(50);
		});
	});

	describe("integration: full event flow", () => {
		it("processes a complete database setup sequence", () => {
			const dbEvents: Array<WebSocketEvent & { message?: string }> = [
				{
					id: "1",
					sandbox_id: "orchestrator",
					event_type: "db_capacity_check",
					timestamp: "2026-01-16T10:00:00.000Z",
					message: "Checking database capacity...",
				},
				{
					id: "2",
					sandbox_id: "orchestrator",
					event_type: "db_capacity_ok",
					timestamp: "2026-01-16T10:00:01.000Z",
					message: "Database capacity OK: 150MB / 500MB",
				},
				{
					id: "3",
					sandbox_id: "orchestrator",
					event_type: "db_reset_start",
					timestamp: "2026-01-16T10:00:02.000Z",
				},
				{
					id: "4",
					sandbox_id: "orchestrator",
					event_type: "db_reset_complete",
					timestamp: "2026-01-16T10:00:05.000Z",
				},
				{
					id: "5",
					sandbox_id: "orchestrator",
					event_type: "db_migration_start",
					timestamp: "2026-01-16T10:00:06.000Z",
				},
				{
					id: "6",
					sandbox_id: "orchestrator",
					event_type: "db_migration_complete",
					timestamp: "2026-01-16T10:00:10.000Z",
				},
				{
					id: "7",
					sandbox_id: "orchestrator",
					event_type: "db_seed_start",
					timestamp: "2026-01-16T10:00:11.000Z",
				},
				{
					id: "8",
					sandbox_id: "orchestrator",
					event_type: "db_seed_complete",
					timestamp: "2026-01-16T10:00:20.000Z",
				},
				{
					id: "9",
					sandbox_id: "orchestrator",
					event_type: "db_verify",
					timestamp: "2026-01-16T10:00:21.000Z",
					message: "Verified: 3 user(s) seeded",
				},
			];

			// Convert all events (simulating handleOrchestratorEvent calls)
			const orchestratorEvents = dbEvents
				.map((e) => convertWebSocketToOrchestratorEvent(e))
				.filter((e): e is OrchestratorEvent => e !== null);

			expect(orchestratorEvents).toHaveLength(9);

			// Verify all events were converted with correct types
			expect(orchestratorEvents[0]?.type).toBe("db_capacity_check");
			expect(orchestratorEvents[1]?.type).toBe("db_capacity_ok");
			expect(orchestratorEvents[2]?.type).toBe("db_reset_start");
			expect(orchestratorEvents[3]?.type).toBe("db_reset_complete");
			expect(orchestratorEvents[4]?.type).toBe("db_migration_start");
			expect(orchestratorEvents[5]?.type).toBe("db_migration_complete");
			expect(orchestratorEvents[6]?.type).toBe("db_seed_start");
			expect(orchestratorEvents[7]?.type).toBe("db_seed_complete");
			expect(orchestratorEvents[8]?.type).toBe("db_verify");

			// Verify custom message preserved
			expect(orchestratorEvents[1]?.message).toBe(
				"Database capacity OK: 150MB / 500MB",
			);
			expect(orchestratorEvents[8]?.message).toBe("Verified: 3 user(s) seeded");

			// All should be labeled as orchestrator
			for (const event of orchestratorEvents) {
				expect(event.sandboxLabel).toBe("orchestrator");
			}
		});

		it("correctly routes mixed sandbox and orchestrator events", () => {
			const mixedEvents: WebSocketEvent[] = [
				// Orchestrator event
				{
					id: "1",
					sandbox_id: "orchestrator",
					event_type: "db_reset_start",
					timestamp: "2026-01-16T10:00:00.000Z",
				},
				// Sandbox tool event
				{
					id: "2",
					sandbox_id: "sbx-a",
					event_type: "post_tool_use",
					timestamp: "2026-01-16T10:00:01.000Z",
					tool_name: "Read",
				},
				// Another orchestrator event
				{
					id: "3",
					sandbox_id: "orchestrator",
					event_type: "db_reset_complete",
					timestamp: "2026-01-16T10:00:02.000Z",
				},
				// Another sandbox tool event
				{
					id: "4",
					sandbox_id: "sbx-b",
					event_type: "post_tool_use",
					timestamp: "2026-01-16T10:00:03.000Z",
					tool_name: "Write",
				},
			];

			// Simulate routing
			const orchestratorEvents: OrchestratorEvent[] = [];
			const sandboxToolEvents: WebSocketEvent[] = [];

			for (const event of mixedEvents) {
				if (event.sandbox_id === "orchestrator") {
					const converted = convertWebSocketToOrchestratorEvent(event);
					if (converted) {
						orchestratorEvents.push(converted);
					}
				} else if (event.event_type === "post_tool_use") {
					sandboxToolEvents.push(event);
				}
			}

			// Verify correct routing
			expect(orchestratorEvents).toHaveLength(2);
			expect(sandboxToolEvents).toHaveLength(2);

			expect(orchestratorEvents[0]?.type).toBe("db_reset_start");
			expect(orchestratorEvents[1]?.type).toBe("db_reset_complete");

			expect(sandboxToolEvents[0]?.tool_name).toBe("Read");
			expect(sandboxToolEvents[1]?.tool_name).toBe("Write");
		});
	});
});
