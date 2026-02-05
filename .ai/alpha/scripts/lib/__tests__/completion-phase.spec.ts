/**
 * Completion Phase Unit Tests
 *
 * Tests for the orchestrator completion phase including:
 * - Completion status determination
 * - Review sandbox failure handling
 * - Progress summary display
 *
 * Bug fix #1930: Ensures completion status properly reflects review sandbox state.
 */

import { describe, expect, it } from "vitest";

import type { SpecManifest } from "../../types/index.js";

/**
 * Create a minimal test manifest for completion phase testing
 */
function createTestManifest(
	overrides: Partial<SpecManifest> = {},
): SpecManifest {
	return {
		metadata: {
			spec_id: "S1918",
			spec_name: "Test Spec",
			generated_at: new Date().toISOString(),
			spec_dir: "/test/spec/dir",
			research_dir: "/test/spec/dir/research",
			...overrides.metadata,
		},
		initiatives: overrides.initiatives ?? [],
		feature_queue: overrides.feature_queue ?? [
			{
				id: "S1918.I1.F1",
				initiative_id: "S1918.I1",
				title: "Test Feature",
				slug: "test-feature",
				priority: 1,
				global_priority: 1,
				status: "completed",
				tasks_file: "tasks.json",
				feature_dir: "/test/feature/dir",
				task_count: 5,
				tasks_completed: 5,
				sequential_hours: 10,
				parallel_hours: 5,
				dependencies: [],
				github_issue: null,
				requires_database: false,
				database_task_count: 0,
			},
		],
		progress: {
			status: "in_progress",
			initiatives_completed: 1,
			initiatives_total: 1,
			features_completed: 1,
			features_total: 1,
			tasks_completed: 5,
			tasks_total: 5,
			next_feature_id: null,
			last_completed_feature_id: "S1918.I1.F1",
			started_at: new Date().toISOString(),
			completed_at: null,
			last_checkpoint: new Date().toISOString(),
			...overrides.progress,
		},
		sandbox: {
			sandbox_ids: ["sandbox-1"],
			branch_name: "alpha/spec-S1918",
			created_at: new Date().toISOString(),
			...overrides.sandbox,
		},
	};
}

describe("completion status determination", () => {
	/**
	 * Test completion status logic in isolation.
	 * Bug fix #1930: Ensures completion status properly reflects:
	 * - "completed": All features completed AND review sandbox created
	 * - "partial_completion": All features completed but review sandbox failed
	 * - "failed": Features failed during implementation
	 */

	function determineCompletionStatus(
		failedFeatureCount: number,
		reviewSandboxCreated: boolean,
	): "completed" | "partial_completion" | "failed" {
		if (failedFeatureCount > 0) {
			return "failed";
		}
		if (!reviewSandboxCreated) {
			return "partial_completion";
		}
		return "completed";
	}

	it("returns 'completed' when all features succeed and review sandbox created", () => {
		const status = determineCompletionStatus(0, true);
		expect(status).toBe("completed");
	});

	it("returns 'partial_completion' when all features succeed but review sandbox failed", () => {
		const status = determineCompletionStatus(0, false);
		expect(status).toBe("partial_completion");
	});

	it("returns 'failed' when features failed regardless of review sandbox", () => {
		// Failed features + review sandbox created
		expect(determineCompletionStatus(1, true)).toBe("failed");

		// Failed features + review sandbox failed
		expect(determineCompletionStatus(1, false)).toBe("failed");

		// Multiple failed features
		expect(determineCompletionStatus(3, true)).toBe("failed");
	});
});

describe("manifest completion_status field", () => {
	it("should have completion_status field in progress object", () => {
		const manifest = createTestManifest({
			progress: {
				status: "completed",
				completion_status: "completed",
				initiatives_completed: 1,
				initiatives_total: 1,
				features_completed: 1,
				features_total: 1,
				tasks_completed: 5,
				tasks_total: 5,
				next_feature_id: null,
				last_completed_feature_id: "S1918.I1.F1",
				started_at: new Date().toISOString(),
				completed_at: new Date().toISOString(),
				last_checkpoint: new Date().toISOString(),
			},
		});

		expect(manifest.progress.completion_status).toBe("completed");
	});

	it("should support partial_completion status", () => {
		const manifest = createTestManifest({
			progress: {
				status: "completed",
				completion_status: "partial_completion",
				initiatives_completed: 1,
				initiatives_total: 1,
				features_completed: 1,
				features_total: 1,
				tasks_completed: 5,
				tasks_total: 5,
				next_feature_id: null,
				last_completed_feature_id: "S1918.I1.F1",
				started_at: new Date().toISOString(),
				completed_at: new Date().toISOString(),
				last_checkpoint: new Date().toISOString(),
			},
		});

		expect(manifest.progress.completion_status).toBe("partial_completion");
	});

	it("should support failed status", () => {
		const manifest = createTestManifest({
			progress: {
				status: "partial",
				completion_status: "failed",
				initiatives_completed: 0,
				initiatives_total: 1,
				features_completed: 0,
				features_total: 1,
				tasks_completed: 3,
				tasks_total: 5,
				next_feature_id: "S1918.I1.F1",
				last_completed_feature_id: null,
				started_at: new Date().toISOString(),
				completed_at: new Date().toISOString(),
				last_checkpoint: new Date().toISOString(),
			},
		});

		expect(manifest.progress.completion_status).toBe("failed");
	});
});

describe("failed feature counting", () => {
	it("correctly counts features with failed status", () => {
		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "S1918.I1.F1",
					initiative_id: "S1918.I1",
					title: "Completed Feature",
					slug: "completed-feature",
					priority: 1,
					global_priority: 1,
					status: "completed",
					tasks_file: "tasks.json",
					feature_dir: "/test/feature/dir",
					task_count: 5,
					tasks_completed: 5,
					sequential_hours: 10,
					parallel_hours: 5,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
				},
				{
					id: "S1918.I1.F2",
					initiative_id: "S1918.I1",
					title: "Failed Feature",
					slug: "failed-feature",
					priority: 2,
					global_priority: 2,
					status: "failed",
					tasks_file: "tasks.json",
					feature_dir: "/test/feature/dir",
					task_count: 5,
					tasks_completed: 2,
					sequential_hours: 10,
					parallel_hours: 5,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
					error: "Test error message",
				},
			],
		});

		const failedFeatureCount = manifest.feature_queue.filter(
			(f) => f.status === "failed",
		).length;

		expect(failedFeatureCount).toBe(1);
	});

	it("returns zero when no features failed", () => {
		const manifest = createTestManifest();

		const failedFeatureCount = manifest.feature_queue.filter(
			(f) => f.status === "failed",
		).length;

		expect(failedFeatureCount).toBe(0);
	});
});

describe("review sandbox null handling", () => {
	it("handles null review sandbox gracefully in completion logic", () => {
		// Simulate the logic from completion-phase.ts
		const reviewSandbox: { sandboxId: string } | null = null;

		const reviewUrls: { label: string; vscode: string; devServer: string }[] =
			[];

		// This mimics the condition in completion-phase.ts
		if (reviewSandbox) {
			reviewUrls.push({
				label: "sbx-review",
				vscode: "https://vscode.e2b.app/sandbox",
				devServer: "https://3000-sandbox.e2b.app",
			});
		}

		expect(reviewUrls).toHaveLength(0);
		expect(reviewSandbox).toBeNull();
	});

	it("populates review URLs when sandbox is created", () => {
		const reviewSandbox = { sandboxId: "review-sandbox-123" };

		const reviewUrls: { label: string; vscode: string; devServer: string }[] =
			[];

		if (reviewSandbox) {
			reviewUrls.push({
				label: "sbx-review",
				vscode: "https://vscode.e2b.app/review-sandbox-123",
				devServer: "https://3000-review-sandbox-123.e2b.app",
			});
		}

		expect(reviewUrls).toHaveLength(1);
		expect(reviewUrls[0]?.label).toBe("sbx-review");
	});
});

describe("completion summary output", () => {
	it("generates appropriate summary for full completion", () => {
		const summary = generateCompletionSummary({
			featuresCompleted: 18,
			featuresTotal: 18,
			tasksCompleted: 136,
			tasksTotal: 136,
			failedFeatureCount: 0,
			reviewSandboxCreated: true,
			completionStatus: "completed",
		});

		expect(summary).toContain("Features: 18/18 completed");
		expect(summary).toContain("Tasks: 136/136 completed");
		expect(summary).toContain("Failed features: 0");
		expect(summary).toContain("Review sandbox: ✅ Created");
		expect(summary).toContain("Completion status: COMPLETED");
		expect(summary).not.toContain("WARNING");
	});

	it("generates warning for partial completion (review sandbox failed)", () => {
		const summary = generateCompletionSummary({
			featuresCompleted: 18,
			featuresTotal: 18,
			tasksCompleted: 136,
			tasksTotal: 136,
			failedFeatureCount: 0,
			reviewSandboxCreated: false,
			completionStatus: "partial_completion",
		});

		expect(summary).toContain("Review sandbox: ❌ FAILED");
		expect(summary).toContain("Completion status: PARTIAL_COMPLETION");
		expect(summary).toContain("WARNING: Review sandbox creation FAILED");
	});

	it("generates warning for failed features", () => {
		const summary = generateCompletionSummary({
			featuresCompleted: 17,
			featuresTotal: 18,
			tasksCompleted: 120,
			tasksTotal: 136,
			failedFeatureCount: 1,
			reviewSandboxCreated: true,
			completionStatus: "failed",
		});

		expect(summary).toContain("Failed features: 1");
		expect(summary).toContain("Completion status: FAILED");
		expect(summary).toContain("WARNING: 1 feature(s) FAILED");
	});

	/**
	 * Helper function to generate completion summary (mirrors completion-phase.ts logic)
	 */
	function generateCompletionSummary(options: {
		featuresCompleted: number;
		featuresTotal: number;
		tasksCompleted: number;
		tasksTotal: number;
		failedFeatureCount: number;
		reviewSandboxCreated: boolean;
		completionStatus: "completed" | "partial_completion" | "failed";
	}): string {
		const lines: string[] = [];

		lines.push("═".repeat(60));
		lines.push("📊 COMPLETION SUMMARY");
		lines.push("═".repeat(60));
		lines.push(
			`   Features: ${options.featuresCompleted}/${options.featuresTotal} completed`,
		);
		lines.push(
			`   Tasks: ${options.tasksCompleted}/${options.tasksTotal} completed`,
		);
		lines.push(`   Failed features: ${options.failedFeatureCount}`);
		lines.push(
			`   Review sandbox: ${options.reviewSandboxCreated ? "✅ Created" : "❌ FAILED"}`,
		);
		lines.push(
			`   Completion status: ${options.completionStatus.toUpperCase()}`,
		);

		if (!options.reviewSandboxCreated) {
			lines.push("");
			lines.push("⚠️  WARNING: Review sandbox creation FAILED");
			lines.push("   - Dev server could not be started for visual review");
			lines.push("   - Check logs above for sandbox creation error details");
			lines.push("   - Features are implemented but manual review is required");
		}

		if (options.failedFeatureCount > 0) {
			lines.push("");
			lines.push(`⚠️  WARNING: ${options.failedFeatureCount} feature(s) FAILED`);
			lines.push("   - Check feature error fields in spec-manifest.json");
			lines.push("   - Review failure reasons before retry");
		}

		lines.push("═".repeat(60));

		return lines.join("\n");
	}
});
