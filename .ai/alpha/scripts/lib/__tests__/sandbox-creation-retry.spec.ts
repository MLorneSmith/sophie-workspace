/**
 * Unit tests for sandbox creation retry logic (Chore #1959).
 *
 * Tests cover:
 * - Successful creation on first attempt (no retry)
 * - Failure then success on retry
 * - All retries exhausted (error propagation)
 * - Backoff timing verification (10s, 20s)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock createSandbox from sandbox.ts
vi.mock("../sandbox.js", () => ({
	createSandbox: vi.fn(),
	clearStaleSandboxData: vi.fn(),
	getSandboxAgeMinutes: vi.fn(),
	isSandboxExpired: vi.fn(),
	reconnectToStoredSandboxes: vi.fn(),
}));

// Mock sleep from utils.ts to avoid real delays
vi.mock("../utils.js", () => ({
	sleep: vi.fn().mockResolvedValue(undefined),
}));

// Mock config constants
vi.mock("../../config/index.js", async () => {
	const actual = await vi.importActual<
		typeof import("../../config/index.js")
	>("../../config/index.js");
	return {
		...actual,
		SANDBOX_CREATION_MAX_RETRIES: 2,
		SANDBOX_CREATION_RETRY_BASE_DELAY_MS: 10000,
	};
});

// Mock logger
vi.mock("../logger.js", () => ({
	createLogger: vi.fn(() => ({
		log: vi.fn(),
	})),
}));

import { createSandbox } from "../sandbox.js";
import { sleep } from "../utils.js";
import { createSandboxWithRetry } from "../orchestrator.js";
import type { SandboxInstance, SpecManifest } from "../../types/index.js";

const mockCreateSandbox = vi.mocked(createSandbox);
const mockSleep = vi.mocked(sleep);

function createMockManifest(): SpecManifest {
	return {
		metadata: { spec_id: "test", spec_name: "Test Spec" },
		sandbox: {
			sandbox_ids: [],
			branch_name: "alpha/spec-test",
			created_at: null,
		},
		initiatives: [],
		feature_queue: [],
		progress: {
			status: "pending",
			initiatives_total: 0,
			initiatives_completed: 0,
			features_total: 0,
			features_completed: 0,
			tasks_total: 0,
			tasks_completed: 0,
			started_at: null,
		},
	} as unknown as SpecManifest;
}

function createMockSandboxInstance(label: string): SandboxInstance {
	return {
		sandbox: {} as SandboxInstance["sandbox"],
		id: `sbx-${label}`,
		label,
		status: "ready",
		currentFeature: null,
		retryCount: 0,
		createdAt: new Date(),
		lastKeepaliveAt: new Date(),
	};
}

describe("createSandboxWithRetry", () => {
	const mockLog = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should succeed on first attempt without retry", async () => {
		const manifest = createMockManifest();
		const expected = createMockSandboxInstance("sbx-a");
		mockCreateSandbox.mockResolvedValueOnce(expected);

		const result = await createSandboxWithRetry(
			manifest,
			"sbx-a",
			300,
			false,
			"run-1",
			"claude",
			mockLog,
		);

		expect(result).toBe(expected);
		expect(mockCreateSandbox).toHaveBeenCalledTimes(1);
		expect(mockSleep).not.toHaveBeenCalled();
	});

	it("should retry and succeed on second attempt", async () => {
		const manifest = createMockManifest();
		const expected = createMockSandboxInstance("sbx-a");

		mockCreateSandbox
			.mockRejectedValueOnce(new Error("OAuth session limit"))
			.mockResolvedValueOnce(expected);

		const result = await createSandboxWithRetry(
			manifest,
			"sbx-a",
			300,
			false,
			"run-1",
			"claude",
			mockLog,
		);

		expect(result).toBe(expected);
		expect(mockCreateSandbox).toHaveBeenCalledTimes(2);
		// First retry delay: base * 1 = 10000ms
		expect(mockSleep).toHaveBeenCalledTimes(1);
		expect(mockSleep).toHaveBeenCalledWith(10000);
	});

	it("should retry and succeed on third attempt", async () => {
		const manifest = createMockManifest();
		const expected = createMockSandboxInstance("sbx-a");

		mockCreateSandbox
			.mockRejectedValueOnce(new Error("E2B API error"))
			.mockRejectedValueOnce(new Error("Rate limited"))
			.mockResolvedValueOnce(expected);

		const result = await createSandboxWithRetry(
			manifest,
			"sbx-a",
			300,
			false,
			"run-1",
			"claude",
			mockLog,
		);

		expect(result).toBe(expected);
		expect(mockCreateSandbox).toHaveBeenCalledTimes(3);
		expect(mockSleep).toHaveBeenCalledTimes(2);
		// First retry: base * 1 = 10000ms, Second retry: base * 2 = 20000ms
		expect(mockSleep).toHaveBeenNthCalledWith(1, 10000);
		expect(mockSleep).toHaveBeenNthCalledWith(2, 20000);
	});

	it("should throw after all retries exhausted", async () => {
		const manifest = createMockManifest();
		const error = new Error("Persistent E2B failure");

		mockCreateSandbox.mockRejectedValue(error);

		await expect(
			createSandboxWithRetry(
				manifest,
				"sbx-a",
				300,
				false,
				"run-1",
				"claude",
				mockLog,
			),
		).rejects.toThrow("Persistent E2B failure");

		// 1 initial + 2 retries = 3 total attempts
		expect(mockCreateSandbox).toHaveBeenCalledTimes(3);
		expect(mockSleep).toHaveBeenCalledTimes(2);
	});

	it("should use correct backoff delays (10s, 20s)", async () => {
		const manifest = createMockManifest();
		const error = new Error("Failure");

		mockCreateSandbox.mockRejectedValue(error);

		await expect(
			createSandboxWithRetry(
				manifest,
				"sbx-b",
				300,
				false,
				"run-1",
				"claude",
				mockLog,
			),
		).rejects.toThrow();

		// Verify exact backoff delays
		expect(mockSleep).toHaveBeenCalledTimes(2);
		expect(mockSleep).toHaveBeenNthCalledWith(1, 10000); // base * 1
		expect(mockSleep).toHaveBeenNthCalledWith(2, 20000); // base * 2
	});

	it("should log failure messages on retry", async () => {
		const manifest = createMockManifest();
		const expected = createMockSandboxInstance("sbx-a");

		mockCreateSandbox
			.mockRejectedValueOnce(new Error("Transient error"))
			.mockResolvedValueOnce(expected);

		await createSandboxWithRetry(
			manifest,
			"sbx-a",
			300,
			false,
			"run-1",
			"claude",
			mockLog,
		);

		// Should have logged a warning about the failure
		expect(mockLog).toHaveBeenCalledWith(
			expect.stringContaining("Sandbox sbx-a creation failed"),
		);
		expect(mockLog).toHaveBeenCalledWith(
			expect.stringContaining("Retrying in"),
		);
	});

	it("should pass all arguments through to createSandbox", async () => {
		const manifest = createMockManifest();
		const expected = createMockSandboxInstance("sbx-c");
		mockCreateSandbox.mockResolvedValueOnce(expected);

		await createSandboxWithRetry(
			manifest,
			"sbx-c",
			600,
			true,
			"run-42",
			"gpt",
			mockLog,
			"alpha/spec-S1918-P1",
			"P2",
		);

		expect(mockCreateSandbox).toHaveBeenCalledWith(
			manifest,
			"sbx-c",
			600,
			true,
			"run-42",
			"gpt",
			"alpha/spec-S1918-P1",
			"P2",
		);
	});
});
