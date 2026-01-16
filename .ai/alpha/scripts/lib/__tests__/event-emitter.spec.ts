/**
 * Event Emitter Unit Tests
 *
 * Tests for the emitOrchestratorEvent function which sends HTTP POST
 * requests to the event server for real-time UI updates.
 *
 * Tests verify:
 * - Correct HTTP POST structure is sent
 * - Graceful failure handling when event server is unavailable
 * - Fire-and-forget pattern (no blocking, no throws)
 * - Event structure includes all required fields
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock global fetch before importing the module
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Import after mocks are set up
import {
	emitOrchestratorEvent,
	emitOrchestratorEvents,
	type OrchestratorDatabaseEventType,
} from "../event-emitter.js";

describe("event-emitter", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default: successful fetch
		mockFetch.mockResolvedValue({ ok: true });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("emitOrchestratorEvent", () => {
		it("should send HTTP POST with correct structure", async () => {
			// Act
			emitOrchestratorEvent(
				"db_capacity_check",
				"Checking database capacity...",
			);

			// Wait for async fire-and-forget to complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Assert
			expect(mockFetch).toHaveBeenCalledTimes(1);
			expect(mockFetch).toHaveBeenCalledWith(
				"http://localhost:9000/api/events",
				expect.objectContaining({
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				}),
			);

			// Verify body structure
			const callArgs = mockFetch.mock.calls[0] as [string, { body: string }];
			const body = JSON.parse(callArgs[1].body) as Record<string, unknown>;
			expect(body).toMatchObject({
				sandbox_id: "orchestrator",
				event_type: "db_capacity_check",
				message: "Checking database capacity...",
			});
			expect(body.timestamp).toBeDefined();
			expect(typeof body.timestamp).toBe("string");
		});

		it("should include optional details when provided", async () => {
			// Act
			emitOrchestratorEvent("db_capacity_ok", "Database capacity OK", {
				sizeMB: 150.5,
				limitMB: 500,
			});

			// Wait for async fire-and-forget
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Assert
			const callArgs = mockFetch.mock.calls[0] as [string, { body: string }];
			const body = JSON.parse(callArgs[1].body) as Record<string, unknown>;
			expect(body.details).toEqual({
				sizeMB: 150.5,
				limitMB: 500,
			});
		});

		it("should not include details when not provided", async () => {
			// Act
			emitOrchestratorEvent("db_reset_start", "Resetting database...");

			// Wait for async fire-and-forget
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Assert
			const callArgs = mockFetch.mock.calls[0] as [string, { body: string }];
			const body = JSON.parse(callArgs[1].body) as Record<string, unknown>;
			expect(body.details).toBeUndefined();
		});

		it("should not throw when fetch fails", async () => {
			// Arrange: simulate network error
			mockFetch.mockRejectedValue(new Error("Connection refused"));

			// Act & Assert: should not throw
			expect(() => {
				emitOrchestratorEvent("db_seed_start", "Starting seeding...");
			}).not.toThrow();

			// Wait to ensure the catch handler runs
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it("should not throw when event server returns error status", async () => {
			// Arrange: simulate server error response
			mockFetch.mockResolvedValue({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
			});

			// Act & Assert: should not throw
			expect(() => {
				emitOrchestratorEvent("db_verify", "Verifying data...");
			}).not.toThrow();

			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it("should use correct sandbox_id for orchestrator events", async () => {
			// Act
			emitOrchestratorEvent("db_migration_complete", "Migrations applied");

			await new Promise((resolve) => setTimeout(resolve, 10));

			// Assert
			const callArgs = mockFetch.mock.calls[0] as [string, { body: string }];
			const body = JSON.parse(callArgs[1].body) as Record<string, unknown>;
			expect(body.sandbox_id).toBe("orchestrator");
		});

		it("should generate ISO 8601 timestamp", async () => {
			// Act
			emitOrchestratorEvent("db_seed_complete", "Seeding complete");

			await new Promise((resolve) => setTimeout(resolve, 10));

			// Assert
			const callArgs = mockFetch.mock.calls[0] as [string, { body: string }];
			const body = JSON.parse(callArgs[1].body) as Record<string, unknown>;

			// Should be valid ISO 8601 format
			const timestamp = new Date(body.timestamp as string);
			expect(timestamp.toISOString()).toBe(body.timestamp);
		});

		it.each<[OrchestratorDatabaseEventType, string]>([
			["db_capacity_check", "Checking capacity"],
			["db_capacity_ok", "Capacity OK"],
			["db_capacity_warning", "Capacity warning"],
			["db_reset_start", "Reset started"],
			["db_reset_complete", "Reset complete"],
			["db_migration_start", "Migration started"],
			["db_migration_complete", "Migration complete"],
			["db_seed_start", "Seeding started"],
			["db_seed_complete", "Seeding complete"],
			["db_verify", "Verification done"],
		])("should handle event type: %s", async (eventType, message) => {
			// Act
			emitOrchestratorEvent(eventType, message);

			await new Promise((resolve) => setTimeout(resolve, 10));

			// Assert
			const callArgs = mockFetch.mock.calls[0] as [string, { body: string }];
			const body = JSON.parse(callArgs[1].body) as Record<string, unknown>;
			expect(body.event_type).toBe(eventType);
			expect(body.message).toBe(message);
		});
	});

	describe("emitOrchestratorEvents", () => {
		it("should emit multiple events in sequence", async () => {
			// Act
			emitOrchestratorEvents([
				{ eventType: "db_capacity_check", message: "Checking..." },
				{ eventType: "db_capacity_ok", message: "OK" },
				{ eventType: "db_reset_start", message: "Resetting..." },
			]);

			await new Promise((resolve) => setTimeout(resolve, 20));

			// Assert
			expect(mockFetch).toHaveBeenCalledTimes(3);

			// Verify each event
			const bodies = mockFetch.mock.calls.map((call) =>
				JSON.parse(call[1].body),
			);
			expect(bodies[0].event_type).toBe("db_capacity_check");
			expect(bodies[1].event_type).toBe("db_capacity_ok");
			expect(bodies[2].event_type).toBe("db_reset_start");
		});

		it("should handle empty events array", async () => {
			// Act
			emitOrchestratorEvents([]);

			await new Promise((resolve) => setTimeout(resolve, 10));

			// Assert
			expect(mockFetch).not.toHaveBeenCalled();
		});

		it("should include details for each event", async () => {
			// Act
			emitOrchestratorEvents([
				{
					eventType: "db_capacity_ok",
					message: "OK",
					details: { sizeMB: 100 },
				},
				{
					eventType: "db_verify",
					message: "Verified",
					details: { userCount: 5 },
				},
			]);

			await new Promise((resolve) => setTimeout(resolve, 20));

			// Assert
			const bodies = mockFetch.mock.calls.map((call) =>
				JSON.parse(call[1].body),
			);
			expect(bodies[0].details).toEqual({ sizeMB: 100 });
			expect(bodies[1].details).toEqual({ userCount: 5 });
		});
	});

	describe("concurrent event emission", () => {
		it("should handle multiple rapid fire events without issues", async () => {
			// Arrange: Add small delay to simulate network
			mockFetch.mockImplementation(
				() =>
					new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 5)),
			);

			// Act: Fire many events quickly
			for (let i = 0; i < 10; i++) {
				emitOrchestratorEvent("db_verify", `Event ${i}`);
			}

			// Wait for all events to process
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Assert: All events should have been sent
			expect(mockFetch).toHaveBeenCalledTimes(10);
		});

		it("should not block caller when fetch is slow", async () => {
			// Arrange: Very slow fetch
			mockFetch.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve({ ok: true }), 1000),
					),
			);

			const startTime = Date.now();

			// Act: Fire event
			emitOrchestratorEvent("db_reset_start", "Starting...");

			const elapsed = Date.now() - startTime;

			// Assert: Should return immediately (< 50ms)
			expect(elapsed).toBeLessThan(50);
		});
	});
});
