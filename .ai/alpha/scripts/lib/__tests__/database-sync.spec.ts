/**
 * Database Migration Sync Unit Tests
 *
 * Tests for the syncFeatureMigrations function which pushes
 * feature-generated migrations to the remote sandbox database.
 *
 * See bug fix #1506 for context on why this functionality was added.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock environment module before importing database module
const mockHasSupabaseAuth = vi.fn();
const mockValidateSupabaseConfig = vi.fn();
const mockSupabaseAccessToken = vi.fn().mockReturnValue("sbp_test_token");

vi.mock("../environment.js", () => ({
	getAllEnvVars: vi.fn().mockReturnValue({}),
	hasSupabaseAuth: () => mockHasSupabaseAuth(),
	validateSupabaseConfig: () => mockValidateSupabaseConfig(),
	get SUPABASE_ACCESS_TOKEN() {
		return mockSupabaseAccessToken();
	},
}));

// Mock lock module
vi.mock("../lock.js", () => ({
	getProjectRoot: vi.fn().mockReturnValue("/mock/project"),
	releaseLock: vi.fn(),
	updateLockResetState: vi.fn(),
}));

// Import after mocks are set up
import type { Sandbox } from "@e2b/code-interpreter";
import { syncFeatureMigrations } from "../database.js";

/**
 * Create a mock sandbox for testing
 */
function createMockSandbox(commandResponses: Record<string, unknown> = {}) {
	const defaultResponses: Record<
		string,
		{ stdout: string; stderr: string; exitCode: number }
	> = {
		"ls -la supabase/migrations": { stdout: "3", stderr: "", exitCode: 0 },
		"pnpm exec supabase db push": {
			stdout: "Migrations applied",
			stderr: "",
			exitCode: 0,
		},
		psql: { stdout: "5", stderr: "", exitCode: 0 },
	};

	const responses = { ...defaultResponses, ...commandResponses };

	return {
		commands: {
			run: vi.fn().mockImplementation((cmd: string) => {
				// Find matching response based on command substring
				for (const [key, value] of Object.entries(responses)) {
					if (cmd.includes(key)) {
						return Promise.resolve(value);
					}
				}
				return Promise.resolve({ stdout: "", stderr: "", exitCode: 0 });
			}),
		},
	} as unknown as Sandbox;
}

describe("syncFeatureMigrations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default to having auth configured
		mockHasSupabaseAuth.mockReturnValue(true);
		mockValidateSupabaseConfig.mockReturnValue({
			valid: true,
			hasToken: true,
			hasProjectRef: true,
			message: "Supabase CLI authentication configured",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("when Supabase auth is not configured", () => {
		it("skips sync and returns true (non-blocking)", async () => {
			mockHasSupabaseAuth.mockReturnValue(false);
			mockValidateSupabaseConfig.mockReturnValue({
				valid: false,
				hasToken: false,
				hasProjectRef: false,
				message: "Supabase CLI not configured",
			});

			const sandbox = createMockSandbox();

			const result = await syncFeatureMigrations(sandbox, "feature #1", true);

			expect(result).toBe(true);
			// Should not have run any commands
			expect(sandbox.commands.run).not.toHaveBeenCalled();
		});

		it("returns true when only token is missing", async () => {
			mockHasSupabaseAuth.mockReturnValue(false);
			mockValidateSupabaseConfig.mockReturnValue({
				valid: false,
				hasToken: false,
				hasProjectRef: true,
				message: "Missing SUPABASE_ACCESS_TOKEN",
			});

			const sandbox = createMockSandbox();

			const result = await syncFeatureMigrations(sandbox, "feature #1", true);

			expect(result).toBe(true);
		});
	});

	describe("when no migrations exist", () => {
		it("skips sync and returns true", async () => {
			const sandbox = createMockSandbox({
				"ls -la supabase/migrations": { stdout: "0", stderr: "", exitCode: 0 },
			});

			const result = await syncFeatureMigrations(sandbox, "feature #1", true);

			expect(result).toBe(true);
			// Should check for migrations but not push
			expect(sandbox.commands.run).toHaveBeenCalledTimes(1);
			expect(sandbox.commands.run).toHaveBeenCalledWith(
				expect.stringContaining("ls -la supabase/migrations"),
				expect.any(Object),
			);
		});
	});

	describe("when migrations exist", () => {
		it("pushes migrations successfully", async () => {
			const sandbox = createMockSandbox();

			const result = await syncFeatureMigrations(sandbox, "feature #1", true);

			expect(result).toBe(true);
			// Should run: migration check, push, verify
			expect(sandbox.commands.run).toHaveBeenCalledTimes(3);
			expect(sandbox.commands.run).toHaveBeenCalledWith(
				expect.stringContaining("pnpm exec supabase db push"),
				expect.objectContaining({
					envs: expect.objectContaining({
						SUPABASE_ACCESS_TOKEN: expect.any(String),
					}),
				}),
			);
		});

		it("handles authentication failure", async () => {
			const sandbox = createMockSandbox({
				"pnpm exec supabase db push": {
					stdout: "",
					stderr: "authentication failed",
					exitCode: 1,
				},
			});

			const result = await syncFeatureMigrations(sandbox, "feature #1", true);

			expect(result).toBe(false);
		});

		it("handles 'no new migrations' as success", async () => {
			const sandbox = createMockSandbox({
				"pnpm exec supabase db push": {
					stdout: "no new migrations",
					stderr: "",
					exitCode: 1,
				},
			});

			const result = await syncFeatureMigrations(sandbox, "feature #1", true);

			expect(result).toBe(true);
		});

		it("handles push failure gracefully (non-blocking)", async () => {
			const sandbox = createMockSandbox({
				"pnpm exec supabase db push": {
					stdout: "",
					stderr: "some other error",
					exitCode: 1,
				},
			});

			const result = await syncFeatureMigrations(sandbox, "feature #1", true);

			// Should return true (non-blocking) even on failure
			expect(result).toBe(true);
		});
	});

	describe("error handling", () => {
		it("catches exceptions and returns true (non-blocking)", async () => {
			const sandbox = createMockSandbox();
			// Make the first command throw
			vi.mocked(sandbox.commands.run).mockRejectedValueOnce(
				new Error("Network error"),
			);

			const result = await syncFeatureMigrations(sandbox, "feature #1", true);

			expect(result).toBe(true);
		});
	});
});
