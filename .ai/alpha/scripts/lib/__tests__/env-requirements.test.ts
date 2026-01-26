/**
 * Unit tests for env-requirements module.
 */

import * as fs from "node:fs";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RequiredEnvVar } from "../../types/index.js";
import {
	extractEnvRequirementsFromResearch,
	extractEnvRequirementsFromTasks,
	getEnvVarStatusSummary,
	hasAllRequiredEnvVars,
	validateRequiredEnvVars,
} from "../env-requirements.js";

// Mock fs module
vi.mock("node:fs");

// Helper to cast mock return values safely
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asReaddirReturn = (files: string[]): any => files;

describe("env-requirements", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("extractEnvRequirementsFromResearch", () => {
		it("extracts env vars from research file with env block", () => {
			const mockContent = `
# Research: Cal.com API

## Findings
Some documentation here.

## Environment Variables Required

\`\`\`env
CAL_OAUTH_CLIENT_ID=your_oauth_client_id
CAL_API_URL=https://api.cal.com/v2
CAL_WEBHOOK_SECRET=your_webhook_secret
\`\`\`

## Sources
- Cal.com docs
`;

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readdirSync).mockReturnValue(asReaddirReturn(["context7-calcom.md"]));
			vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

			const result = extractEnvRequirementsFromResearch("/tmp/research-library");

			expect(result).toHaveLength(3);
			expect(result[0]).toMatchObject({
				name: "CAL_OAUTH_CLIENT_ID",
				required: true,
				scope: "server",
			});
			expect(result[1]).toMatchObject({
				name: "CAL_API_URL",
				required: true,
				scope: "server",
			});
			expect(result[2]).toMatchObject({
				name: "CAL_WEBHOOK_SECRET",
				required: true,
				scope: "server",
			});
		});

		it("handles bash-style env blocks", () => {
			const mockContent = `
## Environment Variables Required

\`\`\`bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
\`\`\`
`;

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readdirSync).mockReturnValue(asReaddirReturn(["perplexity-stripe.md"]));
			vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

			const result = extractEnvRequirementsFromResearch("/tmp/research-library");

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({ name: "STRIPE_SECRET_KEY" });
			expect(result[1]).toMatchObject({ name: "STRIPE_WEBHOOK_SECRET" });
		});

		it("returns empty array for non-existent directory", () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);

			const result = extractEnvRequirementsFromResearch("/tmp/nonexistent");

			expect(result).toEqual([]);
		});

		it("skips comments and invalid lines", () => {
			const mockContent = `
## Environment Variables Required

\`\`\`env
# This is a comment
VALID_VAR=value
not_valid_lowercase=value
ALSO_VALID=value
\`\`\`
`;

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readdirSync).mockReturnValue(asReaddirReturn(["test.md"]));
			vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

			const result = extractEnvRequirementsFromResearch("/tmp/research-library");

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({ name: "VALID_VAR" });
			expect(result[1]).toMatchObject({ name: "ALSO_VALID" });
		});

		it("detects NEXT_PUBLIC_ prefix as client scope", () => {
			const mockContent = `
## Environment Variables Required

\`\`\`env
NEXT_PUBLIC_API_URL=https://api.example.com
BACKEND_SECRET=secret
\`\`\`
`;

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readdirSync).mockReturnValue(asReaddirReturn(["test.md"]));
			vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

			const result = extractEnvRequirementsFromResearch("/tmp/research-library");

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				name: "NEXT_PUBLIC_API_URL",
				scope: "client",
			});
			expect(result[1]).toMatchObject({ name: "BACKEND_SECRET", scope: "server" });
		});
	});

	describe("extractEnvRequirementsFromTasks", () => {
		it("extracts env vars from tasks.json metadata", () => {
			const mockTasks = {
				metadata: {
					required_env_vars: [
						{
							name: "CAL_OAUTH_CLIENT_ID",
							description: "Cal.com OAuth client ID",
							source: "Cal.com developer settings",
							required: true,
							scope: "server" as const,
						},
						{
							name: "CAL_API_URL",
							description: "Cal.com API URL",
							source: "Default: https://api.cal.com/v2",
							required: false,
							scope: "server" as const,
						},
					],
				},
				tasks: [],
			};

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockTasks));

			const result = extractEnvRequirementsFromTasks("/tmp/tasks.json");

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({
				name: "CAL_OAUTH_CLIENT_ID",
				required: true,
			});
			expect(result[1]).toMatchObject({ name: "CAL_API_URL", required: false });
		});

		it("returns empty array for non-existent file", () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);

			const result = extractEnvRequirementsFromTasks("/tmp/nonexistent.json");

			expect(result).toEqual([]);
		});

		it("returns empty array for tasks without required_env_vars", () => {
			const mockTasks = {
				metadata: { feature_id: 123 },
				tasks: [],
			};

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockTasks));

			const result = extractEnvRequirementsFromTasks("/tmp/tasks.json");

			expect(result).toEqual([]);
		});

		it("handles invalid JSON gracefully", () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue("not valid json");

			const result = extractEnvRequirementsFromTasks("/tmp/invalid.json");

			expect(result).toEqual([]);
		});
	});

	describe("validateRequiredEnvVars", () => {
		it("returns missing required vars", () => {
			const required: RequiredEnvVar[] = [
				{
					name: "EXISTING_VAR",
					description: "test",
					source: "test",
					required: true,
					scope: "server",
					features: ["F1"],
				},
				{
					name: "MISSING_VAR",
					description: "test",
					source: "test",
					required: true,
					scope: "server",
					features: ["F1"],
				},
			];

			// Set one env var
			const originalEnv = process.env.EXISTING_VAR;
			process.env.EXISTING_VAR = "value";

			const result = validateRequiredEnvVars(required);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({ name: "MISSING_VAR" });

			// Cleanup
			if (originalEnv !== undefined) {
				process.env.EXISTING_VAR = originalEnv;
			} else {
				delete process.env.EXISTING_VAR;
			}
		});

		it("ignores optional vars", () => {
			const required: RequiredEnvVar[] = [
				{
					name: "MISSING_OPTIONAL",
					description: "test",
					source: "test",
					required: false,
					scope: "server",
					features: ["F1"],
				},
			];

			const result = validateRequiredEnvVars(required);

			expect(result).toEqual([]);
		});
	});

	describe("hasAllRequiredEnvVars", () => {
		it("returns true when all required vars are set", () => {
			const required: RequiredEnvVar[] = [];

			expect(hasAllRequiredEnvVars(required)).toBe(true);
		});

		it("returns false when required vars are missing", () => {
			const required: RequiredEnvVar[] = [
				{
					name: "DEFINITELY_NOT_SET_12345",
					description: "test",
					source: "test",
					required: true,
					scope: "server",
					features: ["F1"],
				},
			];

			expect(hasAllRequiredEnvVars(required)).toBe(false);
		});
	});

	describe("getEnvVarStatusSummary", () => {
		it("returns no requirements message for empty array", () => {
			const result = getEnvVarStatusSummary([]);

			expect(result).toBe("No external service requirements detected");
		});

		it("returns all set message when vars are present", () => {
			const originalEnv = process.env.TEST_VAR_123;
			process.env.TEST_VAR_123 = "value";

			const required: RequiredEnvVar[] = [
				{
					name: "TEST_VAR_123",
					description: "test",
					source: "test",
					required: true,
					scope: "server",
					features: ["F1"],
				},
			];

			const result = getEnvVarStatusSummary(required);

			expect(result).toBe("All 1 required environment variable(s) are set");

			// Cleanup
			if (originalEnv !== undefined) {
				process.env.TEST_VAR_123 = originalEnv;
			} else {
				delete process.env.TEST_VAR_123;
			}
		});

		it("returns missing count message when vars are missing", () => {
			const required: RequiredEnvVar[] = [
				{
					name: "NOT_SET_ABC",
					description: "test",
					source: "test",
					required: true,
					scope: "server",
					features: ["F1"],
				},
				{
					name: "NOT_SET_DEF",
					description: "test",
					source: "test",
					required: true,
					scope: "server",
					features: ["F1"],
				},
			];

			const result = getEnvVarStatusSummary(required);

			expect(result).toBe(
				"Missing 2 of 2 required environment variable(s)",
			);
		});
	});

	// Note: aggregateRequiredEnvVars tests require complex manifest mocking
	// and are better tested via integration tests with real spec directories
});
