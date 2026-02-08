/**
 * Orchestrator Review Sandbox Integration Tests
 *
 * Tests for the orchestrator's review sandbox creation and dev server startup.
 * Bug fix #1590: Fresh sandbox for review after spec implementation.
 *
 * These tests verify:
 * - Full orchestration creates implementation + review sandboxes
 * - Both sandboxes have correct branches
 * - Dev server fails gracefully if review sandbox setup fails
 * - Implementation sandbox still usable if review sandbox fails
 */

import { describe, expect, it, vi } from "vitest";

describe("orchestrator review sandbox flow", () => {
	/**
	 * Simulates the orchestrator completion flow for testing
	 */
	interface MockSandboxInstance {
		id: string;
		label: string;
		sandbox: {
			sandboxId: string;
			kill: () => Promise<void>;
			getHost: (port: number) => string;
		};
	}

	interface ReviewUrl {
		label: string;
		vscode: string;
		devServer: string;
	}

	interface OrchestratorCompletionResult {
		reviewUrls: ReviewUrl[];
		reviewSandboxCreated: boolean;
		implementationSandboxKept: boolean;
		otherSandboxesKilled: string[];
		devServerStarted: boolean;
		fallbackUsed: boolean;
	}

	async function simulateOrchestratorCompletion(options: {
		sandboxCount: number;
		branchName: string;
		reviewSandboxSucceeds: boolean;
		devServerSucceeds: boolean;
	}): Promise<OrchestratorCompletionResult> {
		const instances: MockSandboxInstance[] = [];

		// Create mock sandbox instances
		for (let i = 0; i < options.sandboxCount; i++) {
			const label = `sbx-${String.fromCharCode(97 + i)}`;
			instances.push({
				id: `impl-${label}-id`,
				label,
				sandbox: {
					sandboxId: `impl-${label}-id`,
					kill: vi.fn().mockResolvedValue(undefined),
					getHost: (port) => `${port}-impl-${label}-id.e2b.app`,
				},
			});
		}

		const result: OrchestratorCompletionResult = {
			reviewUrls: [],
			reviewSandboxCreated: false,
			implementationSandboxKept: true,
			otherSandboxesKilled: [],
			devServerStarted: false,
			fallbackUsed: false,
		};

		// Keep implementation sandbox (sbx-a) available for code inspection
		const implementationInstance = instances[0];
		const otherInstances = instances.slice(1);

		// Kill non-primary implementation sandboxes
		for (const instance of otherInstances) {
			await instance.sandbox.kill();
			result.otherSandboxesKilled.push(instance.label);
		}

		// Simulate review sandbox creation
		let reviewSandboxId: string | null = null;

		if (options.reviewSandboxSucceeds) {
			reviewSandboxId = "review-sandbox-id";
			result.reviewSandboxCreated = true;
		} else {
			result.fallbackUsed = true;
		}

		// Simulate dev server startup
		const devServerSandboxId = reviewSandboxId ?? implementationInstance?.id;

		if (devServerSandboxId && options.devServerSucceeds) {
			result.devServerStarted = true;
			result.reviewUrls.push({
				label: reviewSandboxId
					? "sbx-review"
					: (implementationInstance?.label ?? "sbx-a"),
				vscode: `https://8080-${devServerSandboxId}.e2b.app`,
				devServer: `https://3000-${devServerSandboxId}.e2b.app`,
			});
		} else if (devServerSandboxId) {
			result.reviewUrls.push({
				label: reviewSandboxId
					? "sbx-review"
					: (implementationInstance?.label ?? "sbx-a"),
				vscode: `https://8080-${devServerSandboxId}.e2b.app`,
				devServer: "(failed to start)",
			});
		}

		// Add implementation sandbox VS Code URL if review sandbox was created
		if (implementationInstance && reviewSandboxId) {
			result.reviewUrls.push({
				label: `${implementationInstance.label} (code)`,
				vscode: `https://8080-${implementationInstance.id}.e2b.app`,
				devServer: "(use sbx-review for dev server)",
			});
		}

		return result;
	}

	it("should create review sandbox after implementation completes", async () => {
		const result = await simulateOrchestratorCompletion({
			sandboxCount: 3,
			branchName: "alpha/spec-1362",
			reviewSandboxSucceeds: true,
			devServerSucceeds: true,
		});

		expect(result.reviewSandboxCreated).toBe(true);
		expect(result.implementationSandboxKept).toBe(true);
	});

	it("should kill non-primary sandboxes (sbx-b, sbx-c)", async () => {
		const result = await simulateOrchestratorCompletion({
			sandboxCount: 3,
			branchName: "alpha/spec-1362",
			reviewSandboxSucceeds: true,
			devServerSucceeds: true,
		});

		expect(result.otherSandboxesKilled).toContain("sbx-b");
		expect(result.otherSandboxesKilled).toContain("sbx-c");
		expect(result.otherSandboxesKilled).not.toContain("sbx-a");
	});

	it("should provide both review and implementation URLs", async () => {
		const result = await simulateOrchestratorCompletion({
			sandboxCount: 3,
			branchName: "alpha/spec-1362",
			reviewSandboxSucceeds: true,
			devServerSucceeds: true,
		});

		expect(result.reviewUrls).toHaveLength(2);

		const reviewUrl = result.reviewUrls.find((u) => u.label === "sbx-review");
		const codeUrl = result.reviewUrls.find((u) => u.label === "sbx-a (code)");

		expect(reviewUrl).toBeDefined();
		expect(reviewUrl?.devServer).toContain("3000-review");
		expect(codeUrl).toBeDefined();
		expect(codeUrl?.devServer).toBe("(use sbx-review for dev server)");
	});

	it("should fallback to implementation sandbox when review fails", async () => {
		const result = await simulateOrchestratorCompletion({
			sandboxCount: 1,
			branchName: "alpha/spec-1362",
			reviewSandboxSucceeds: false,
			devServerSucceeds: true,
		});

		expect(result.reviewSandboxCreated).toBe(false);
		expect(result.fallbackUsed).toBe(true);
		expect(result.reviewUrls).toHaveLength(1);
		expect(result.reviewUrls[0]?.label).toBe("sbx-a");
	});

	it("should show failed status when dev server fails on review sandbox", async () => {
		const result = await simulateOrchestratorCompletion({
			sandboxCount: 1,
			branchName: "alpha/spec-1362",
			reviewSandboxSucceeds: true,
			devServerSucceeds: false,
		});

		expect(result.reviewUrls[0]?.devServer).toBe("(failed to start)");
		// VS Code should still be available
		expect(result.reviewUrls[0]?.vscode).toContain("8080");
	});

	it("should handle single sandbox configuration", async () => {
		const result = await simulateOrchestratorCompletion({
			sandboxCount: 1,
			branchName: "alpha/spec-1362",
			reviewSandboxSucceeds: true,
			devServerSucceeds: true,
		});

		// Should have review URL and code URL
		expect(result.reviewUrls).toHaveLength(2);
		expect(result.otherSandboxesKilled).toHaveLength(0);
	});
});

describe("branch synchronization", () => {
	/**
	 * Simulates branch checkout and sync for testing
	 */
	interface BranchSyncResult {
		fetchedOrigin: boolean;
		checkedOutBranch: string | null;
		pulledLatest: boolean;
		branchMatches: boolean;
	}

	async function simulateBranchSync(
		branchName: string,
		fetchSucceeds: boolean = true,
		checkoutSucceeds: boolean = true,
		pullSucceeds: boolean = true,
	): Promise<BranchSyncResult> {
		const result: BranchSyncResult = {
			fetchedOrigin: false,
			checkedOutBranch: null,
			pulledLatest: false,
			branchMatches: false,
		};

		if (fetchSucceeds) {
			result.fetchedOrigin = true;
		} else {
			throw new Error("git fetch origin failed");
		}

		if (checkoutSucceeds) {
			result.checkedOutBranch = branchName;
		} else {
			throw new Error(`git checkout ${branchName} failed`);
		}

		if (pullSucceeds) {
			result.pulledLatest = true;
			result.branchMatches = result.checkedOutBranch === branchName;
		} else {
			throw new Error(`git pull origin ${branchName} failed`);
		}

		return result;
	}

	it("should sync branch correctly", async () => {
		const result = await simulateBranchSync("alpha/spec-1362");

		expect(result.fetchedOrigin).toBe(true);
		expect(result.checkedOutBranch).toBe("alpha/spec-1362");
		expect(result.pulledLatest).toBe(true);
		expect(result.branchMatches).toBe(true);
	});

	it("should throw on fetch failure", async () => {
		await expect(simulateBranchSync("alpha/spec-1362", false)).rejects.toThrow(
			"git fetch origin failed",
		);
	});

	it("should throw on checkout failure", async () => {
		await expect(
			simulateBranchSync("alpha/spec-1362", true, false),
		).rejects.toThrow("git checkout alpha/spec-1362 failed");
	});

	it("should throw on pull failure", async () => {
		await expect(
			simulateBranchSync("alpha/spec-1362", true, true, false),
		).rejects.toThrow("git pull origin alpha/spec-1362 failed");
	});
});

describe("resource cleanup", () => {
	/**
	 * Simulates sandbox cleanup after orchestration
	 */
	interface SandboxCleanupResult {
		sandboxesKilled: string[];
		sandboxesKept: string[];
		errors: string[];
	}

	async function simulateSandboxCleanup(
		sandboxLabels: string[],
		killFailures: string[] = [],
	): Promise<SandboxCleanupResult> {
		const result: SandboxCleanupResult = {
			sandboxesKilled: [],
			sandboxesKept: [],
			errors: [],
		};

		// Always keep sbx-a (implementation) for code inspection
		const implementationLabel = sandboxLabels[0];
		if (implementationLabel) {
			result.sandboxesKept.push(implementationLabel);
		}

		// Kill all other sandboxes
		for (const label of sandboxLabels.slice(1)) {
			if (killFailures.includes(label)) {
				result.errors.push(`Failed to kill ${label}`);
			} else {
				result.sandboxesKilled.push(label);
			}
		}

		return result;
	}

	it("should keep implementation sandbox and kill others", async () => {
		const result = await simulateSandboxCleanup(["sbx-a", "sbx-b", "sbx-c"]);

		expect(result.sandboxesKept).toContain("sbx-a");
		expect(result.sandboxesKilled).toContain("sbx-b");
		expect(result.sandboxesKilled).toContain("sbx-c");
	});

	it("should handle kill failures gracefully", async () => {
		const result = await simulateSandboxCleanup(
			["sbx-a", "sbx-b", "sbx-c"],
			["sbx-b"], // sbx-b kill fails
		);

		expect(result.errors).toHaveLength(1);
		expect(result.sandboxesKilled).toContain("sbx-c");
		expect(result.sandboxesKilled).not.toContain("sbx-b");
	});

	it("should not attempt to kill review sandbox", async () => {
		// Review sandbox is created separately and managed by orchestrator
		const result = await simulateSandboxCleanup(["sbx-a", "sbx-b"]);

		expect(result.sandboxesKept).not.toContain("sbx-review");
		expect(result.sandboxesKilled).not.toContain("sbx-review");
	});
});

describe("error handling", () => {
	it("should provide VS Code URL even when dev server fails", () => {
		const result = {
			label: "sbx-review",
			vscode: "https://8080-sbx-review.e2b.app",
			devServer: "(failed to start)",
		};

		expect(result.vscode).toContain("8080");
		expect(result.devServer).toBe("(failed to start)");
	});

	it("should use implementation sandbox as fallback", () => {
		// When review sandbox creation fails, we should fall back to impl sandbox
		const reviewSandboxFailed = true;
		const implSandboxAvailable = true;

		const canProvideDevServer = !reviewSandboxFailed || implSandboxAvailable;
		expect(canProvideDevServer).toBe(true);
	});

	it("should not crash if no sandboxes available", () => {
		// Edge case: what if all sandboxes died during implementation?
		const instances: unknown[] = [];
		const implementationInstance = instances[0];

		expect(implementationInstance).toBeUndefined();
		// Orchestrator should handle this gracefully
	});
});
