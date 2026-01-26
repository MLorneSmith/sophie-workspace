/**
 * State Machine Unit Tests
 *
 * Tests for the FeatureStateMachine class which manages feature state
 * transitions with explicit guards.
 *
 * Bug fix #1786: Event-driven architecture refactor
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	createDefaultContext,
	FeatureStateMachine,
	isActiveState,
	isAssignableState,
	isTerminalState,
	STATE_TRANSITIONS,
} from "../state-machine.js";

describe("state-machine", () => {
	let stateMachine: FeatureStateMachine;

	beforeEach(() => {
		stateMachine = new FeatureStateMachine();
	});

	describe("FeatureStateMachine - Basic Operations", () => {
		it("should initialize a feature with default state", () => {
			stateMachine.initializeFeature("F1");
			expect(stateMachine.getState("F1")).toBe("queued");
		});

		it("should initialize a feature with custom state", () => {
			stateMachine.initializeFeature("F1", "executing");
			expect(stateMachine.getState("F1")).toBe("executing");
		});

		it("should return undefined for unknown features", () => {
			expect(stateMachine.getState("unknown")).toBeUndefined();
		});

		it("should check if feature exists", () => {
			stateMachine.initializeFeature("F1");
			expect(stateMachine.hasFeature("F1")).toBe(true);
			expect(stateMachine.hasFeature("F2")).toBe(false);
		});

		it("should remove a feature", () => {
			stateMachine.initializeFeature("F1");
			stateMachine.removeFeature("F1");
			expect(stateMachine.hasFeature("F1")).toBe(false);
		});

		it("should clear all features", () => {
			stateMachine.initializeFeature("F1");
			stateMachine.initializeFeature("F2");
			stateMachine.clear();
			expect(stateMachine.hasFeature("F1")).toBe(false);
			expect(stateMachine.hasFeature("F2")).toBe(false);
		});

		it("should return all states as a snapshot", () => {
			stateMachine.initializeFeature("F1", "queued");
			stateMachine.initializeFeature("F2", "executing");
			const states = stateMachine.getAllStates();
			expect(states.get("F1")).toBe("queued");
			expect(states.get("F2")).toBe("executing");
		});
	});

	describe("FeatureStateMachine - State Transitions", () => {
		it("should transition from queued to assigning when sandbox is idle and deps complete", () => {
			stateMachine.initializeFeature("F1", "queued");
			const context = {
				...createDefaultContext(),
				sandboxIdle: true,
				dependenciesCompleted: true,
			};

			const result = stateMachine.transition("F1", "assigning", context);

			expect(result.success).toBe(true);
			expect(result.fromState).toBe("queued");
			expect(result.toState).toBe("assigning");
			expect(result.transitionName).toBe("assign_to_sandbox");
			expect(stateMachine.getState("F1")).toBe("assigning");
		});

		it("should fail transition when guard conditions not met", () => {
			stateMachine.initializeFeature("F1", "queued");
			const context = {
				...createDefaultContext(),
				sandboxIdle: false, // Sandbox not idle
				dependenciesCompleted: true,
			};

			const result = stateMachine.transition("F1", "assigning", context);

			expect(result.success).toBe(false);
			expect(result.error).toContain("No valid transition");
			expect(stateMachine.getState("F1")).toBe("queued"); // State unchanged
		});

		it("should fail transition for unknown feature", () => {
			const context = createDefaultContext();
			const result = stateMachine.transition("unknown", "assigning", context);

			expect(result.success).toBe(false);
			expect(result.error).toContain("not found");
		});

		it("should transition from assigning to initializing", () => {
			stateMachine.initializeFeature("F1", "assigning");
			const context = {
				...createDefaultContext(),
				sandboxId: "sbx-1",
				progressFileExists: true,
			};

			const result = stateMachine.transition("F1", "initializing", context);

			expect(result.success).toBe(true);
			expect(result.toState).toBe("initializing");
		});

		it("should transition from initializing to executing", () => {
			stateMachine.initializeFeature("F1", "initializing");
			const context = {
				...createDefaultContext(),
				heartbeatRecent: true,
				tasksStarted: true,
			};

			const result = stateMachine.transition("F1", "executing", context);

			expect(result.success).toBe(true);
			expect(result.toState).toBe("executing");
		});

		it("should transition from executing to completing", () => {
			stateMachine.initializeFeature("F1", "executing");
			const context = {
				...createDefaultContext(),
				progressStatus: "completed" as const,
			};

			const result = stateMachine.transition("F1", "completing", context);

			expect(result.success).toBe(true);
			expect(result.toState).toBe("completing");
		});

		it("should transition from completing to completed", () => {
			stateMachine.initializeFeature("F1", "completing");
			const context = {
				...createDefaultContext(),
				gitPushSuccess: true,
			};

			const result = stateMachine.transition("F1", "completed", context);

			expect(result.success).toBe(true);
			expect(result.toState).toBe("completed");
		});

		it("should transition from executing to retrying when heartbeat is stale", () => {
			stateMachine.initializeFeature("F1", "executing");
			const context = {
				...createDefaultContext(),
				heartbeatRecent: false, // Stale heartbeat
			};

			const result = stateMachine.transition("F1", "retrying", context);

			expect(result.success).toBe(true);
			expect(result.toState).toBe("retrying");
			expect(result.transitionName).toBe("trigger_retry");
		});

		it("should transition from retrying to queued when under max retries", () => {
			stateMachine.initializeFeature("F1", "retrying");
			const context = {
				...createDefaultContext(),
				retryCount: 1,
				maxRetries: 3,
				processKilled: true,
			};

			const result = stateMachine.transition("F1", "queued", context);

			expect(result.success).toBe(true);
			expect(result.toState).toBe("queued");
		});

		it("should transition from retrying to failed when max retries exceeded", () => {
			stateMachine.initializeFeature("F1", "retrying");
			const context = {
				...createDefaultContext(),
				retryCount: 3,
				maxRetries: 3,
			};

			const result = stateMachine.transition("F1", "failed", context);

			expect(result.success).toBe(true);
			expect(result.toState).toBe("failed");
			expect(result.transitionName).toBe("max_retries_exceeded");
		});
	});

	describe("FeatureStateMachine - Transition Listeners", () => {
		it("should notify listeners on successful transition", () => {
			const listener = vi.fn();
			stateMachine.onTransition(listener);
			stateMachine.initializeFeature("F1", "queued");

			const context = {
				...createDefaultContext(),
				sandboxIdle: true,
				dependenciesCompleted: true,
			};

			stateMachine.transition("F1", "assigning", context);

			expect(listener).toHaveBeenCalledWith(
				"F1",
				"queued",
				"assigning",
				"assign_to_sandbox",
			);
		});

		it("should not notify listeners on failed transition", () => {
			const listener = vi.fn();
			stateMachine.onTransition(listener);
			stateMachine.initializeFeature("F1", "queued");

			const context = {
				...createDefaultContext(),
				sandboxIdle: false,
			};

			stateMachine.transition("F1", "assigning", context);

			expect(listener).not.toHaveBeenCalled();
		});

		it("should allow removing listeners", () => {
			const listener = vi.fn();
			stateMachine.onTransition(listener);
			stateMachine.offTransition(listener);
			stateMachine.initializeFeature("F1", "queued");

			const context = {
				...createDefaultContext(),
				sandboxIdle: true,
				dependenciesCompleted: true,
			};

			stateMachine.transition("F1", "assigning", context);

			expect(listener).not.toHaveBeenCalled();
		});

		it("should handle listener errors gracefully", () => {
			const errorListener = vi.fn().mockImplementation(() => {
				throw new Error("Listener error");
			});
			const goodListener = vi.fn();

			stateMachine.onTransition(errorListener);
			stateMachine.onTransition(goodListener);
			stateMachine.initializeFeature("F1", "queued");

			const context = {
				...createDefaultContext(),
				sandboxIdle: true,
				dependenciesCompleted: true,
			};

			// Should not throw
			expect(() =>
				stateMachine.transition("F1", "assigning", context),
			).not.toThrow();

			// Both listeners should have been called
			expect(errorListener).toHaveBeenCalled();
			expect(goodListener).toHaveBeenCalled();
		});
	});

	describe("FeatureStateMachine - Query Methods", () => {
		it("should return possible transitions from current state", () => {
			stateMachine.initializeFeature("F1", "queued");
			const possible = stateMachine.getPossibleTransitions("F1");
			expect(possible).toContain("assigning");
		});

		it("should return empty array for unknown feature", () => {
			const possible = stateMachine.getPossibleTransitions("unknown");
			expect(possible).toEqual([]);
		});

		it("should check if transition is valid with canTransition", () => {
			stateMachine.initializeFeature("F1", "queued");
			const context = {
				...createDefaultContext(),
				sandboxIdle: true,
				dependenciesCompleted: true,
			};

			expect(stateMachine.canTransition("F1", "assigning", context)).toBe(true);
			expect(stateMachine.canTransition("F1", "completed", context)).toBe(
				false,
			);
		});
	});

	describe("Utility Functions", () => {
		it("isTerminalState should identify completed and failed", () => {
			expect(isTerminalState("completed")).toBe(true);
			expect(isTerminalState("failed")).toBe(true);
			expect(isTerminalState("executing")).toBe(false);
			expect(isTerminalState("queued")).toBe(false);
		});

		it("isActiveState should identify active states", () => {
			expect(isActiveState("assigning")).toBe(true);
			expect(isActiveState("initializing")).toBe(true);
			expect(isActiveState("executing")).toBe(true);
			expect(isActiveState("completing")).toBe(true);
			expect(isActiveState("queued")).toBe(false);
			expect(isActiveState("completed")).toBe(false);
		});

		it("isAssignableState should identify queued", () => {
			expect(isAssignableState("queued")).toBe(true);
			expect(isAssignableState("assigning")).toBe(false);
			expect(isAssignableState("completed")).toBe(false);
		});

		it("createDefaultContext should return safe defaults", () => {
			const context = createDefaultContext();
			expect(context.sandboxIdle).toBe(false);
			expect(context.dependenciesCompleted).toBe(false);
			expect(context.heartbeatRecent).toBe(false);
			expect(context.retryCount).toBe(0);
			expect(context.maxRetries).toBe(3);
		});
	});

	describe("STATE_TRANSITIONS", () => {
		it("should have all expected transitions defined", () => {
			const transitionNames = STATE_TRANSITIONS.map((t) => t.name);

			expect(transitionNames).toContain("assign_to_sandbox");
			expect(transitionNames).toContain("start_initialization");
			expect(transitionNames).toContain("start_execution");
			expect(transitionNames).toContain("tasks_completed");
			expect(transitionNames).toContain("finalize_completion");
			expect(transitionNames).toContain("trigger_retry");
			expect(transitionNames).toContain("reset_for_retry");
			expect(transitionNames).toContain("max_retries_exceeded");
		});

		it("should have guards that are functions", () => {
			for (const transition of STATE_TRANSITIONS) {
				expect(typeof transition.guard).toBe("function");
			}
		});
	});
});
