/**
 * Event Ordering Unit Tests
 *
 * Tests for the event ordering fix in ui/index.tsx
 * Bug fix #1580: Events should be prepended (newest first) not appended
 */

import { describe, expect, it } from "vitest";

/**
 * Helper to simulate the event ordering logic from handleWebSocketEvent
 */
function updateRealtimeOutput(existing: string[], newEvent: string): string[] {
	// Skip if duplicate of most recent event
	if (existing.length > 0 && existing[0] === newEvent) {
		return existing;
	}

	// Prepend new event and keep first 10 items (newest first)
	return [newEvent, ...existing].slice(0, 10);
}

describe("event ordering", () => {
	describe("updateRealtimeOutput", () => {
		it("should prepend new events (newest first)", () => {
			const existing = ["event-1", "event-2", "event-3"];
			const result = updateRealtimeOutput(existing, "event-4");

			expect(result[0]).toBe("event-4"); // Newest is first
			expect(result[1]).toBe("event-1"); // Previous newest is second
			expect(result).toEqual(["event-4", "event-1", "event-2", "event-3"]);
		});

		it("should skip duplicate of most recent event", () => {
			const existing = ["event-1", "event-2", "event-3"];
			const result = updateRealtimeOutput(existing, "event-1");

			expect(result).toBe(existing); // Should return same array reference
			expect(result).toEqual(["event-1", "event-2", "event-3"]); // Unchanged
		});

		it("should limit to 10 events", () => {
			const existing = Array.from({ length: 10 }, (_, i) => `event-${i + 1}`);
			const result = updateRealtimeOutput(existing, "event-new");

			expect(result.length).toBe(10);
			expect(result[0]).toBe("event-new"); // Newest first
			expect(result[9]).toBe("event-9"); // Oldest kept is event-9 (event-10 dropped)
		});

		it("should handle empty existing array", () => {
			const result = updateRealtimeOutput([], "first-event");

			expect(result).toEqual(["first-event"]);
		});

		it("should allow duplicate if not most recent", () => {
			// Duplicate of an older event should be allowed (not filtered)
			const existing = ["event-1", "event-2", "event-3"];
			const result = updateRealtimeOutput(existing, "event-2");

			expect(result[0]).toBe("event-2"); // New event is first
			expect(result[1]).toBe("event-1");
			expect(result).toEqual(["event-2", "event-1", "event-2", "event-3"]);
		});
	});

	describe("SandboxColumn display", () => {
		it("should display first 3 items from newest-first array", () => {
			// The SandboxColumn uses slice(0, 3) to show 3 events
			// With newest-first ordering, this shows the 3 most recent events
			const events = ["newest", "second", "third", "fourth", "fifth"];
			const displayed = events.slice(0, 3);

			expect(displayed).toEqual(["newest", "second", "third"]);
		});

		it("should show correct events after series of updates", () => {
			let events: string[] = [];

			// Simulate a series of tool events
			events = updateRealtimeOutput(events, "📖 Read: config.ts");
			events = updateRealtimeOutput(events, "✏️ Edit: config.ts");
			events = updateRealtimeOutput(events, "💻 Bash: npm test");
			events = updateRealtimeOutput(events, "📋 Todo: 3/5 done");

			// SandboxColumn shows first 3
			const displayed = events.slice(0, 3);

			expect(displayed).toEqual([
				"📋 Todo: 3/5 done",
				"💻 Bash: npm test",
				"✏️ Edit: config.ts",
			]);
		});
	});
});
