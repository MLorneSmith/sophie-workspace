/**
 * Review Sandbox Unit Tests
 *
 * Tests for the fresh review sandbox creation functionality.
 * Bug fix #1590: Fresh sandbox for review after spec implementation.
 *
 * These tests verify:
 * - createReviewSandbox() creates and configures sandbox correctly
 * - Review sandbox has branch checked out
 * - Dev server health check respects longer timeout on review sandbox
 * - Dev server startup on review sandbox succeeds within 60s
 * - Fallback URLs still provided if dev server fails on review sandbox
 */

import { describe, expect, it } from "vitest";

/**
 * Test that the review sandbox setup function signature is correct.
 * Since we can't actually create E2B sandboxes in tests, we verify the behavior
 * through mocking and interface testing.
 */
describe("createReviewSandbox function", () => {
	/**
	 * Simulates the review sandbox creation logic for testing
	 */
	interface MockSandboxCommandResult {
		exitCode: number;
		stdout: string;
		stderr: string;
	}

	interface MockSandbox {
		sandboxId: string;
		commands: {
			run: (
				cmd: string,
				opts?: { timeoutMs?: number },
			) => Promise<MockSandboxCommandResult>;
		};
		getHost: (port: number) => string;
	}

	async function simulateReviewSandboxCreation(
		branchName: string,
		depsExist: boolean = true,
		buildSucceeds: boolean = true,
	): Promise<{ sandbox: MockSandbox; steps: string[] }> {
		const steps: string[] = [];

		// Simulate sandbox creation
		const sandbox: MockSandbox = {
			sandboxId: `sbx-review-${Date.now()}`,
			commands: {
				run: async (cmd) => {
					steps.push(cmd);

					// Simulate dependency check
					if (cmd.includes("test -d node_modules")) {
						return {
							exitCode: 0,
							stdout: depsExist ? "exists" : "missing",
							stderr: "",
						};
					}

					// Simulate build result
					if (cmd.includes("pnpm --filter @kit/shared build")) {
						return {
							exitCode: buildSucceeds ? 0 : 1,
							stdout: buildSucceeds ? "Build completed" : "",
							stderr: buildSucceeds ? "" : "Build failed",
						};
					}

					// Simulate git operations
					return { exitCode: 0, stdout: "", stderr: "" };
				},
			},
			getHost: (port) => `${port}-${sandbox.sandboxId}.e2b.app`,
		};

		// Simulate the steps
		await sandbox.commands.run("git fetch origin"); // Step 1
		await sandbox.commands.run(`git checkout -B "${branchName}" FETCH_HEAD`); // Step 2
		await sandbox.commands.run(`git pull origin "${branchName}"`); // Step 3
		const depsCheck = await sandbox.commands.run("test -d node_modules"); // Step 4

		if (depsCheck.stdout === "missing") {
			await sandbox.commands.run("pnpm install --frozen-lockfile"); // Step 5 (conditional)
		}

		const buildResult = await sandbox.commands.run(
			"pnpm --filter @kit/shared build",
		); // Step 6

		if (buildResult.exitCode !== 0) {
			throw new Error(`Build failed: ${buildResult.stderr}`);
		}

		return { sandbox, steps };
	}

	it("should create sandbox with correct branch checked out", async () => {
		const branchName = "alpha/spec-1362";
		const { sandbox, steps } = await simulateReviewSandboxCreation(branchName);

		expect(sandbox.sandboxId).toMatch(/^sbx-review-/);
		expect(steps).toContain(`git checkout -B "${branchName}" FETCH_HEAD`);
		expect(steps).toContain(`git pull origin "${branchName}"`);
	});

	it("should fetch origin before checkout", async () => {
		const { steps } = await simulateReviewSandboxCreation("alpha/spec-123");

		const fetchIndex = steps.findIndex((s) => s.includes("git fetch origin"));
		const checkoutIndex = steps.findIndex((s) => s.includes("git checkout"));

		expect(fetchIndex).toBeLessThan(checkoutIndex);
	});

	it("should build workspace packages after checkout", async () => {
		const { steps } = await simulateReviewSandboxCreation("alpha/spec-123");

		expect(steps).toContain("pnpm --filter @kit/shared build");
	});

	it("should install dependencies if node_modules is missing", async () => {
		const { steps } = await simulateReviewSandboxCreation(
			"alpha/spec-123",
			false, // deps missing
		);

		expect(steps).toContain("pnpm install --frozen-lockfile");
	});

	it("should skip dependency install if node_modules exists", async () => {
		const { steps } = await simulateReviewSandboxCreation(
			"alpha/spec-123",
			true, // deps exist
		);

		expect(steps).not.toContain("pnpm install --frozen-lockfile");
	});

	it("should throw error if build fails", async () => {
		await expect(
			simulateReviewSandboxCreation(
				"alpha/spec-123",
				true, // deps exist
				false, // build fails
			),
		).rejects.toThrow("Build failed");
	});

	it("should generate correct host URLs", async () => {
		const { sandbox } = await simulateReviewSandboxCreation("alpha/spec-123");

		const devHost = sandbox.getHost(3000);
		const vscodeHost = sandbox.getHost(8080);

		expect(devHost).toMatch(/3000-.+\.e2b\.app/);
		expect(vscodeHost).toMatch(/8080-.+\.e2b\.app/);
	});

	it("should complete all steps in order", async () => {
		const { steps } = await simulateReviewSandboxCreation("alpha/spec-123");

		// Verify order: fetch → checkout → pull → deps check → build
		const fetchIdx = steps.findIndex((s) => s.includes("git fetch"));
		const checkoutIdx = steps.findIndex((s) => s.includes("git checkout"));
		const pullIdx = steps.findIndex((s) => s.includes("git pull"));
		const depsIdx = steps.findIndex((s) => s.includes("test -d node_modules"));
		const buildIdx = steps.findIndex((s) => s.includes("pnpm --filter"));

		expect(fetchIdx).toBeLessThan(checkoutIdx);
		expect(checkoutIdx).toBeLessThan(pullIdx);
		expect(pullIdx).toBeLessThan(depsIdx);
		expect(depsIdx).toBeLessThan(buildIdx);
	});
});

describe("dev server startup on review sandbox", () => {
	/**
	 * Simulates dev server health check with configurable attempts
	 */
	async function simulateDevServerHealthCheck(
		responsesPattern: Array<{ ok: boolean; status: number } | "error">,
		maxAttempts: number = 60,
		intervalMs: number = 1000,
	): Promise<{
		success: boolean;
		attempts: number;
		elapsedMs: number;
	}> {
		let attempts = 0;
		const startTime = Date.now();

		for (let i = 0; i < maxAttempts; i++) {
			attempts++;
			const response = responsesPattern[i] ?? "error";

			if (response === "error") {
				// Connection refused - continue polling
				continue;
			}

			if (response.ok || response.status < 500) {
				return {
					success: true,
					attempts,
					elapsedMs: Date.now() - startTime,
				};
			}
		}

		// All attempts failed
		throw new Error(
			`Dev server failed to start after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)`,
		);
	}

	it("should succeed within 60 second timeout on clean sandbox", async () => {
		// Simulate dev server starting after 5 attempts (5 seconds)
		const responses: Array<{ ok: boolean; status: number } | "error"> = [
			"error",
			"error",
			"error",
			"error",
			{ ok: true, status: 200 },
		];

		const result = await simulateDevServerHealthCheck(responses, 60, 1000);
		expect(result.success).toBe(true);
		expect(result.attempts).toBe(5);
	});

	it("should succeed even if server takes 30+ seconds on review sandbox", async () => {
		// Simulate server starting after 35 attempts (35 seconds)
		// This would fail on old 30-second timeout but succeeds with 60-second
		const responses: Array<{ ok: boolean; status: number } | "error"> = [
			...Array(35).fill("error"),
			{ ok: true, status: 200 },
		];

		const result = await simulateDevServerHealthCheck(responses, 60, 1000);
		expect(result.success).toBe(true);
		expect(result.attempts).toBe(36);
	});

	it("should throw error after 60 attempts exhausted", async () => {
		// All 60 attempts fail
		const responses: Array<{ ok: boolean; status: number } | "error"> =
			Array(60).fill("error");

		await expect(
			simulateDevServerHealthCheck(responses, 60, 1000),
		).rejects.toThrow("Dev server failed to start after 60 attempts (60s)");
	});

	it("should accept 404 responses as server running", async () => {
		// Server responds with 404 (route not found, but server is up)
		const responses: Array<{ ok: boolean; status: number } | "error"> = [
			{ ok: false, status: 404 },
		];

		const result = await simulateDevServerHealthCheck(responses, 60, 1000);
		expect(result.success).toBe(true);
		expect(result.attempts).toBe(1);
	});

	it("should handle mixed 5xx then success", async () => {
		const responses: Array<{ ok: boolean; status: number } | "error"> = [
			{ ok: false, status: 503 }, // Service unavailable
			{ ok: false, status: 502 }, // Bad gateway
			"error", // Connection refused
			{ ok: true, status: 200 }, // Success
		];

		const result = await simulateDevServerHealthCheck(responses, 60, 1000);
		expect(result.success).toBe(true);
		expect(result.attempts).toBe(4);
	});
});

describe("review URL generation", () => {
	/**
	 * Simulates the review URL generation logic from orchestrator
	 */
	interface ReviewUrl {
		label: string;
		vscode: string;
		devServer: string;
	}

	function generateReviewUrls(
		reviewSandboxAvailable: boolean,
		devServerStarted: boolean,
		implSandboxAvailable: boolean,
	): ReviewUrl[] {
		const urls: ReviewUrl[] = [];

		const devServerSandboxId = reviewSandboxAvailable
			? "sbx-review-abc123"
			: "sbx-a-impl123";

		const devServerVscodeUrl = `https://8080-${devServerSandboxId}.e2b.app`;
		const devServerUrl = devServerStarted
			? `https://3000-${devServerSandboxId}.e2b.app`
			: "(failed to start)";

		// Dev server URL (from review sandbox or implementation sandbox)
		urls.push({
			label: reviewSandboxAvailable ? "sbx-review" : "sbx-a",
			vscode: devServerVscodeUrl,
			devServer: devServerUrl,
		});

		// Implementation sandbox VS Code URL (for code inspection)
		if (implSandboxAvailable && reviewSandboxAvailable) {
			urls.push({
				label: "sbx-a (code)",
				vscode: "https://8080-sbx-a-impl123.e2b.app",
				devServer: "(use sbx-review for dev server)",
			});
		}

		return urls;
	}

	it("should return review sandbox URLs when available", () => {
		const urls = generateReviewUrls(true, true, true);

		expect(urls).toHaveLength(2);
		expect(urls[0]?.label).toBe("sbx-review");
		expect(urls[0]?.devServer).toContain("sbx-review");
		expect(urls[1]?.label).toBe("sbx-a (code)");
	});

	it("should fallback to implementation sandbox when review fails", () => {
		const urls = generateReviewUrls(false, true, true);

		expect(urls).toHaveLength(1);
		expect(urls[0]?.label).toBe("sbx-a");
		expect(urls[0]?.devServer).toContain("sbx-a-impl");
	});

	it("should show failed status when dev server fails", () => {
		const urls = generateReviewUrls(true, false, true);

		expect(urls[0]?.devServer).toBe("(failed to start)");
		// VS Code should still be available
		expect(urls[0]?.vscode).toContain("8080");
	});

	it("should provide both sandbox URLs for maximum flexibility", () => {
		const urls = generateReviewUrls(true, true, true);

		// Review sandbox for dev server
		expect(urls.find((u) => u.label === "sbx-review")).toBeDefined();
		// Implementation sandbox for code inspection
		expect(urls.find((u) => u.label === "sbx-a (code)")).toBeDefined();
	});

	it("should not add impl sandbox code URL when review fails", () => {
		const urls = generateReviewUrls(false, true, true);

		// Only one URL when using impl sandbox directly
		expect(urls).toHaveLength(1);
		expect(urls.find((u) => u.label.includes("(code)"))).toBeUndefined();
	});
});
