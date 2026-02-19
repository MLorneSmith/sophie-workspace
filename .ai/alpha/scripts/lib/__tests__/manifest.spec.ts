/**
 * Manifest Management Unit Tests
 *
 * Tests for spec directory discovery, manifest loading/saving,
 * progress calculations, and archive management.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import process from "node:process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	ARCHIVE_DIR,
	MAX_ARCHIVED_RUNS,
	UI_PROGRESS_DIR,
} from "../../config/index.js";
import type { SpecManifest } from "../../types/index.js";
import { clearProjectRootCache } from "../lock.js";
import {
	archiveAndClearPreviousRun,
	ensureUIProgressDir,
	findSpecDir,
	generateSpecManifest,
	loadManifest,
	saveManifest,
	syncSandboxProgressToManifest,
	writeOverallProgress,
} from "../manifest.js";

// Test with a temp directory to avoid affecting real files
let tempDir: string;

/**
 * Create a minimal test manifest
 */
function createTestManifest(
	overrides: Partial<SpecManifest> = {},
): SpecManifest {
	return {
		metadata: {
			spec_id: "1362",
			spec_name: "Test Spec",
			generated_at: new Date().toISOString(),
			spec_dir: path.join(tempDir, ".ai", "alpha", "specs", "1362-Spec-test"),
			research_dir: path.join(
				tempDir,
				".ai",
				"alpha",
				"specs",
				"1362-Spec-test",
				"research",
			),
			...overrides.metadata,
		},
		initiatives: overrides.initiatives ?? [],
		feature_queue: overrides.feature_queue ?? [],
		progress: {
			status: "pending",
			initiatives_completed: 0,
			initiatives_total: 1,
			features_completed: 0,
			features_total: 0,
			tasks_completed: 0,
			tasks_total: 0,
			next_feature_id: null,
			last_completed_feature_id: null,
			started_at: null,
			completed_at: null,
			last_checkpoint: null,
			...overrides.progress,
		},
		sandbox: {
			sandbox_ids: [],
			branch_name: null,
			created_at: null,
			...overrides.sandbox,
		},
	};
}

beforeEach(() => {
	// Create temp directory with .git marker
	tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
	fs.mkdirSync(path.join(tempDir, ".git"), { recursive: true });

	// Clear cached project root
	clearProjectRootCache();

	// Mock process.cwd to return temp directory
	vi.spyOn(process, "cwd").mockReturnValue(tempDir);
});

afterEach(() => {
	// Restore mocks
	vi.restoreAllMocks();

	// Clean up temp directory
	try {
		fs.rmSync(tempDir, { recursive: true, force: true });
	} catch {
		// Ignore cleanup errors
	}

	// Clear cached project root
	clearProjectRootCache();
});

describe("findSpecDir", () => {
	it("finds spec directory matching ID", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test-spec",
		);
		fs.mkdirSync(specDir, { recursive: true });

		const result = findSpecDir(tempDir, 1362);

		expect(result).toBe(specDir);
	});

	it("returns null when specs directory does not exist", () => {
		const result = findSpecDir(tempDir, 1362);

		expect(result).toBeNull();
	});

	it("returns null when spec ID not found", () => {
		const specsDir = path.join(tempDir, ".ai", "alpha", "specs");
		fs.mkdirSync(specsDir, { recursive: true });
		fs.mkdirSync(path.join(specsDir, "9999-Spec-other"), { recursive: true });

		const result = findSpecDir(tempDir, 1362);

		expect(result).toBeNull();
	});

	it("matches exact spec ID prefix pattern", () => {
		const specsDir = path.join(tempDir, ".ai", "alpha", "specs");
		fs.mkdirSync(specsDir, { recursive: true });
		// Create directories that shouldn't match
		fs.mkdirSync(path.join(specsDir, "136-Spec-short"), { recursive: true });
		fs.mkdirSync(path.join(specsDir, "13620-Spec-longer"), { recursive: true });
		// Create the one that should match
		fs.mkdirSync(path.join(specsDir, "1362-Spec-match"), { recursive: true });

		const result = findSpecDir(tempDir, 1362);

		expect(result).toBe(path.join(specsDir, "1362-Spec-match"));
	});

	it("handles multiple specs and returns first match", () => {
		const specsDir = path.join(tempDir, ".ai", "alpha", "specs");
		fs.mkdirSync(specsDir, { recursive: true });
		fs.mkdirSync(path.join(specsDir, "1000-Spec-first"), { recursive: true });
		fs.mkdirSync(path.join(specsDir, "1362-Spec-match"), { recursive: true });
		fs.mkdirSync(path.join(specsDir, "2000-Spec-last"), { recursive: true });

		const result = findSpecDir(tempDir, 1362);

		expect(result).toBe(path.join(specsDir, "1362-Spec-match"));
	});
});

describe("loadManifest", () => {
	it("returns null when manifest file does not exist", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test",
		);
		fs.mkdirSync(specDir, { recursive: true });

		const result = loadManifest(specDir);

		expect(result).toBeNull();
	});

	it("loads valid manifest JSON", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test",
		);
		fs.mkdirSync(specDir, { recursive: true });

		const manifest = createTestManifest();
		fs.writeFileSync(
			path.join(specDir, "spec-manifest.json"),
			JSON.stringify(manifest),
		);

		const result = loadManifest(specDir);

		expect(result?.metadata.spec_id).toBe("1362");
		expect(result?.metadata.spec_name).toBe("Test Spec");
	});

	it("returns null for invalid JSON", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test",
		);
		fs.mkdirSync(specDir, { recursive: true });
		fs.writeFileSync(
			path.join(specDir, "spec-manifest.json"),
			"invalid json {{{",
		);

		const result = loadManifest(specDir);

		expect(result).toBeNull();
	});
});

describe("saveManifest", () => {
	it("writes manifest to spec directory", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test",
		);
		fs.mkdirSync(specDir, { recursive: true });
		const manifest = createTestManifest();
		manifest.metadata.spec_dir = specDir;

		saveManifest(manifest);

		const saved = JSON.parse(
			fs.readFileSync(path.join(specDir, "spec-manifest.json"), "utf-8"),
		);
		expect(saved.metadata.spec_id).toBe("1362");
	});

	it("updates last_checkpoint timestamp", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test",
		);
		fs.mkdirSync(specDir, { recursive: true });
		const manifest = createTestManifest();
		manifest.metadata.spec_dir = specDir;

		const before = new Date().toISOString();
		saveManifest(manifest);
		const after = new Date().toISOString();

		expect(manifest.progress.last_checkpoint).toBeDefined();
		const checkpoint = manifest.progress.last_checkpoint;
		if (checkpoint) {
			expect(checkpoint >= before).toBe(true);
			expect(checkpoint <= after).toBe(true);
		}
	});

	it("writes overall progress file for UI", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test",
		);
		fs.mkdirSync(specDir, { recursive: true });
		const manifest = createTestManifest();
		manifest.metadata.spec_dir = specDir;

		saveManifest(manifest);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"overall-progress.json",
		);
		expect(fs.existsSync(progressFile)).toBe(true);
	});

	it("passes reviewUrls through to writeOverallProgress", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test",
		);
		fs.mkdirSync(specDir, { recursive: true });
		const manifest = createTestManifest();
		manifest.metadata.spec_dir = specDir;
		manifest.progress.status = "completed";

		const reviewUrls = [
			{
				label: "sbx-a",
				vscode: "https://vscode.dev/test",
				devServer: "https://e2b-sandbox.dev:3000",
			},
		];

		saveManifest(manifest, reviewUrls);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"overall-progress.json",
		);
		const progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(progress.reviewUrls).toEqual(reviewUrls);
		expect(progress.status).toBe("completed");
	});

	it("passes runId through to writeOverallProgress", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test",
		);
		fs.mkdirSync(specDir, { recursive: true });
		const manifest = createTestManifest();
		manifest.metadata.spec_dir = specDir;

		saveManifest(manifest, undefined, "run-test-abc123");

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"overall-progress.json",
		);
		const progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(progress.runId).toBe("run-test-abc123");
	});

	it("writes status and reviewUrls atomically for completion", () => {
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"1362-Spec-test",
		);
		fs.mkdirSync(specDir, { recursive: true });
		const manifest = createTestManifest();
		manifest.metadata.spec_dir = specDir;
		manifest.progress.status = "completed";
		manifest.progress.completed_at = new Date().toISOString();

		const reviewUrls = [
			{
				label: "sbx-a",
				vscode: "https://vscode.dev/test",
				devServer: "https://e2b-sandbox.dev:3000",
			},
		];

		// This simulates the completion sequence fix:
		// Status and reviewUrls should be written together
		saveManifest(manifest, reviewUrls, "run-completion-test");

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"overall-progress.json",
		);
		const progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		// Both should be present in the same write - this prevents race condition
		expect(progress.status).toBe("completed");
		expect(progress.reviewUrls).toEqual(reviewUrls);
		expect(progress.runId).toBe("run-completion-test");
	});
});

describe("ensureUIProgressDir", () => {
	it("creates progress directory if it does not exist", () => {
		const result = ensureUIProgressDir();

		expect(fs.existsSync(result)).toBe(true);
		expect(result).toBe(path.join(tempDir, UI_PROGRESS_DIR));
	});

	it("returns existing directory without error", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });

		const result = ensureUIProgressDir();

		expect(result).toBe(progressDir);
	});
});

describe("writeOverallProgress", () => {
	it("calculates features_completed from manifest state", () => {
		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "1",
					initiative_id: "1",
					title: "Feature 1",
					priority: 1,
					global_priority: 1,
					status: "completed",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 5,
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
				},
				{
					id: "2",
					initiative_id: "1",
					title: "Feature 2",
					priority: 2,
					global_priority: 2,
					status: "in_progress",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 2,
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
				},
			],
			progress: {
				status: "in_progress",
				initiatives_completed: 0,
				initiatives_total: 1,
				features_completed: 0, // Will be recalculated
				features_total: 2,
				tasks_completed: 0, // Will be recalculated
				tasks_total: 10,
				next_feature_id: null,
				last_completed_feature_id: null,
				started_at: null,
				completed_at: null,
				last_checkpoint: null,
			},
		});

		writeOverallProgress(manifest);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"overall-progress.json",
		);
		const progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(progress.featuresCompleted).toBe(1); // Only 1 completed
		// Fix #1688, #1699: tasksCompleted now includes ALL features (completed + in_progress)
		// Feature 1: 5 tasks completed, Feature 2: 2 tasks completed = 7 total
		expect(progress.tasksCompleted).toBe(7); // From all features
	});

	it("caps values at totals to prevent >100% display", () => {
		const manifest = createTestManifest({
			progress: {
				status: "in_progress",
				initiatives_completed: 10, // More than total
				initiatives_total: 5,
				features_completed: 20, // More than total
				features_total: 10,
				tasks_completed: 100, // More than total
				tasks_total: 50,
				next_feature_id: null,
				last_completed_feature_id: null,
				started_at: null,
				completed_at: null,
				last_checkpoint: null,
			},
		});

		writeOverallProgress(manifest);

		// Progress values should be capped by actual status counts (0 since no features)
		expect(manifest.progress.features_completed).toBe(0);
		expect(manifest.progress.initiatives_completed).toBe(0);
	});

	it("includes review URLs when provided", () => {
		const manifest = createTestManifest();
		const reviewUrls = [
			{
				label: "Review Feature 1",
				vscode: "vscode://file/path",
				devServer: "http://localhost:3000",
			},
		];

		writeOverallProgress(manifest, reviewUrls);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"overall-progress.json",
		);
		const progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(progress.reviewUrls).toEqual(reviewUrls);
	});

	it("includes runId when provided", () => {
		const manifest = createTestManifest();

		writeOverallProgress(manifest, undefined, "run-abc123-xyz9");

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"overall-progress.json",
		);
		const progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(progress.runId).toBe("run-abc123-xyz9");
	});
});

describe("syncSandboxProgressToManifest", () => {
	it("updates in-progress feature tasks_completed from sandbox progress file", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });

		// Write sandbox progress file with 3 completed tasks
		fs.writeFileSync(
			path.join(progressDir, "sbx-a-progress.json"),
			JSON.stringify({
				completed_tasks: ["S2045.I1.F1.T1", "S2045.I1.F1.T2", "S2045.I1.F1.T3"],
				status: "in_progress",
			}),
		);

		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "S2045.I1.F1",
					initiative_id: "S2045.I1",
					title: "Feature 1",
					priority: 1,
					global_priority: 1,
					status: "in_progress",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 0, // Stale: 0 during execution
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
					assigned_sandbox: "sbx-a",
				},
			],
		});

		syncSandboxProgressToManifest(manifest, progressDir);

		expect(manifest.feature_queue[0]?.tasks_completed).toBe(3);
	});

	it("updates multiple features from different sandboxes independently", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });

		// Sandbox A: 2 tasks completed
		fs.writeFileSync(
			path.join(progressDir, "sbx-a-progress.json"),
			JSON.stringify({ completed_tasks: ["T1", "T2"] }),
		);

		// Sandbox B: 1 task completed
		fs.writeFileSync(
			path.join(progressDir, "sbx-b-progress.json"),
			JSON.stringify({ completed_tasks: ["T1"] }),
		);

		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "F1",
					initiative_id: "I1",
					title: "Feature 1",
					priority: 1,
					global_priority: 1,
					status: "in_progress",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 0,
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
					assigned_sandbox: "sbx-a",
				},
				{
					id: "F2",
					initiative_id: "I1",
					title: "Feature 2",
					priority: 2,
					global_priority: 2,
					status: "in_progress",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 3,
					tasks_completed: 0,
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
					assigned_sandbox: "sbx-b",
				},
			],
		});

		syncSandboxProgressToManifest(manifest, progressDir);

		expect(manifest.feature_queue[0]?.tasks_completed).toBe(2);
		expect(manifest.feature_queue[1]?.tasks_completed).toBe(1);
	});

	it("skips completed features (does not overwrite their count)", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });

		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "F1",
					initiative_id: "I1",
					title: "Feature 1",
					priority: 1,
					global_priority: 1,
					status: "completed",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 5,
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
				},
			],
		});

		syncSandboxProgressToManifest(manifest, progressDir);

		// Should remain 5 (not changed)
		expect(manifest.feature_queue[0]?.tasks_completed).toBe(5);
	});

	it("skips features without assigned sandbox", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });

		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "F1",
					initiative_id: "I1",
					title: "Feature 1",
					priority: 1,
					global_priority: 1,
					status: "in_progress",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 0,
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
					// No assigned_sandbox
				},
			],
		});

		syncSandboxProgressToManifest(manifest, progressDir);

		expect(manifest.feature_queue[0]?.tasks_completed).toBe(0);
	});

	it("never regresses task count (keeps higher value)", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });

		// Sandbox progress shows only 1 task (possibly stale/reset)
		fs.writeFileSync(
			path.join(progressDir, "sbx-a-progress.json"),
			JSON.stringify({ completed_tasks: ["T1"] }),
		);

		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "F1",
					initiative_id: "I1",
					title: "Feature 1",
					priority: 1,
					global_priority: 1,
					status: "in_progress",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 3, // Already has 3 from previous sync
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
					assigned_sandbox: "sbx-a",
				},
			],
		});

		syncSandboxProgressToManifest(manifest, progressDir);

		// Should stay at 3 (not regress to 1)
		expect(manifest.feature_queue[0]?.tasks_completed).toBe(3);
	});

	it("handles missing sandbox progress file gracefully", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });

		// No sbx-a-progress.json file exists

		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "F1",
					initiative_id: "I1",
					title: "Feature 1",
					priority: 1,
					global_priority: 1,
					status: "in_progress",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 0,
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
					assigned_sandbox: "sbx-a",
				},
			],
		});

		// Should not throw
		syncSandboxProgressToManifest(manifest, progressDir);

		expect(manifest.feature_queue[0]?.tasks_completed).toBe(0);
	});

	it("handles malformed sandbox progress file gracefully", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });

		// Write invalid JSON
		fs.writeFileSync(
			path.join(progressDir, "sbx-a-progress.json"),
			"not valid json{{{",
		);

		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "F1",
					initiative_id: "I1",
					title: "Feature 1",
					priority: 1,
					global_priority: 1,
					status: "in_progress",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 0,
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
					assigned_sandbox: "sbx-a",
				},
			],
		});

		// Should not throw
		syncSandboxProgressToManifest(manifest, progressDir);

		expect(manifest.feature_queue[0]?.tasks_completed).toBe(0);
	});

	it("integrates with writeOverallProgress to show real-time counts", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });

		// Write sandbox progress with 3 completed tasks
		fs.writeFileSync(
			path.join(progressDir, "sbx-a-progress.json"),
			JSON.stringify({ completed_tasks: ["T1", "T2", "T3"] }),
		);

		const manifest = createTestManifest({
			feature_queue: [
				{
					id: "F1",
					initiative_id: "I1",
					title: "Completed Feature",
					priority: 1,
					global_priority: 1,
					status: "completed",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 5,
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
				},
				{
					id: "F2",
					initiative_id: "I1",
					title: "In Progress Feature",
					priority: 2,
					global_priority: 2,
					status: "in_progress",
					tasks_file: "/test",
					feature_dir: "/test",
					task_count: 5,
					tasks_completed: 0, // Bug: stays at 0 during execution
					sequential_hours: 1,
					parallel_hours: 1,
					dependencies: [],
					github_issue: null,
					requires_database: false,
					database_task_count: 0,
					assigned_sandbox: "sbx-a",
				},
			],
			progress: {
				status: "in_progress",
				initiatives_completed: 0,
				initiatives_total: 1,
				features_completed: 1,
				features_total: 2,
				tasks_completed: 0,
				tasks_total: 10,
				next_feature_id: null,
				last_completed_feature_id: null,
				started_at: null,
				completed_at: null,
				last_checkpoint: null,
			},
		});

		writeOverallProgress(manifest);

		const overallFile = path.join(progressDir, "overall-progress.json");
		const overall = JSON.parse(fs.readFileSync(overallFile, "utf-8"));

		// Should be 5 (completed feature) + 3 (synced from sandbox) = 8
		expect(overall.tasksCompleted).toBe(8);
	});
});

describe("archiveAndClearPreviousRun", () => {
	it("does nothing when no progress or log files exist", () => {
		const archiveDir = path.join(tempDir, ARCHIVE_DIR);

		archiveAndClearPreviousRun("run-test-1234");

		// Archive directory should not be created
		expect(fs.existsSync(archiveDir)).toBe(false);
	});

	it("archives existing progress files", () => {
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });
		fs.writeFileSync(
			path.join(progressDir, "sbx-a-progress.json"),
			JSON.stringify({ test: true }),
		);

		archiveAndClearPreviousRun("run-test-1234");

		// Original file should be removed
		expect(fs.existsSync(path.join(progressDir, "sbx-a-progress.json"))).toBe(
			false,
		);

		// Archive should exist
		const archiveDir = path.join(tempDir, ARCHIVE_DIR);
		const archives = fs.readdirSync(archiveDir);
		expect(archives.length).toBe(1);

		// Archived file should exist
		const firstArchive = archives[0];
		if (!firstArchive) throw new Error("No archive found");
		const archivePath = path.join(archiveDir, firstArchive, "progress");
		expect(fs.existsSync(path.join(archivePath, "sbx-a-progress.json"))).toBe(
			true,
		);
	});

	it("cleans up old archives beyond MAX_ARCHIVED_RUNS", () => {
		const archiveDir = path.join(tempDir, ARCHIVE_DIR);
		fs.mkdirSync(archiveDir, { recursive: true });

		// Create more than MAX_ARCHIVED_RUNS archives
		for (let i = 0; i < MAX_ARCHIVED_RUNS + 3; i++) {
			const date = new Date(Date.now() - i * 86400000); // Each day older
			const archiveName = date.toISOString().replace(/[:.]/g, "-").slice(0, 19);
			fs.mkdirSync(path.join(archiveDir, archiveName), { recursive: true });
		}

		// Create a progress file to trigger archive
		const progressDir = path.join(tempDir, UI_PROGRESS_DIR);
		fs.mkdirSync(progressDir, { recursive: true });
		fs.writeFileSync(
			path.join(progressDir, "overall-progress.json"),
			JSON.stringify({ test: true }),
		);

		archiveAndClearPreviousRun("run-test-1234");

		// Should have at most MAX_ARCHIVED_RUNS + 1 (new archive) directories
		const remainingArchives = fs.readdirSync(archiveDir);
		expect(remainingArchives.length).toBeLessThanOrEqual(MAX_ARCHIVED_RUNS + 1);
	});
});

describe("generateSpecManifest - Initiative Dependency Propagation", () => {
	/**
	 * Helper to create a tasks.json file for testing
	 */
	function createTasksJson(
		featureDir: string,
		featureId: string,
		initiativeId: string,
		specId: string,
	): void {
		const tasksJson = {
			metadata: {
				feature_id: featureId,
				feature_name: "Test Feature",
				feature_slug: "test-feature",
				initiative_id: initiativeId,
				spec_id: specId,
			},
			tasks: [
				{
					id: "T1",
					name: "Task 1",
					status: "pending",
					estimated_hours: 1,
				},
			],
			execution: {
				duration: {
					sequential: 1,
					parallel: 1,
				},
			},
		};
		fs.writeFileSync(
			path.join(featureDir, "tasks.json"),
			JSON.stringify(tasksJson, null, 2),
		);
	}

	/**
	 * Helper to create a feature.md file with metadata
	 */
	function createFeatureMd(
		featureDir: string,
		featureId: string,
		priority: number,
		blockedBy?: string[],
	): void {
		const blockedBySection = blockedBy?.length
			? `\n### Blocked By\n${blockedBy.join(", ")}`
			: "";

		const content = `# Feature: Test Feature

| Field | Value |
|-------|-------|
| **Feature ID** | ${featureId} |
| **Priority** | ${priority} |
${blockedBySection}
`;
		fs.writeFileSync(path.join(featureDir, "feature.md"), content);
	}

	/**
	 * Helper to create an initiative.md file with dependencies
	 */
	function createInitiativeMd(
		initDir: string,
		priority: number,
		blockedBy?: string[],
	): void {
		const blockedBySection = blockedBy?.length
			? `\n### Blocked By\n${blockedBy.join(", ")}`
			: "";

		const content = `# Initiative: Test Initiative

| Field | Value |
|-------|-------|
| **Priority** | ${priority} |
${blockedBySection}
`;
		fs.writeFileSync(path.join(initDir, "initiative.md"), content);
	}

	it("propagates single initiative dependency to features", () => {
		// Setup: Create spec with 2 initiatives, I2 depends on I1
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"S9999-Spec-test",
		);

		// Create I1 with F1 (no initiative dependencies)
		const i1Dir = path.join(specDir, "S9999.I1-Initiative-foundation");
		const f1Dir = path.join(i1Dir, "S9999.I1.F1-Feature-core");
		fs.mkdirSync(f1Dir, { recursive: true });
		createInitiativeMd(i1Dir, 1);
		createTasksJson(f1Dir, "S9999.I1.F1", "S9999.I1", "S9999");
		createFeatureMd(f1Dir, "S9999.I1.F1", 1);

		// Create I2 with F1, I2 is blocked by I1
		const i2Dir = path.join(specDir, "S9999.I2-Initiative-dependent");
		const f2Dir = path.join(i2Dir, "S9999.I2.F1-Feature-secondary");
		fs.mkdirSync(f2Dir, { recursive: true });
		createInitiativeMd(i2Dir, 2, ["S9999.I1"]);
		createTasksJson(f2Dir, "S9999.I2.F1", "S9999.I2", "S9999");
		createFeatureMd(f2Dir, "S9999.I2.F1", 1);

		// Generate manifest
		const manifest = generateSpecManifest(tempDir, 9999, specDir, true);

		expect(manifest).not.toBeNull();
		if (!manifest) return;

		// F1 in I1 should have no dependencies
		const f1 = manifest.feature_queue.find((f) => f.id === "S9999.I1.F1");
		expect(f1?.dependencies).toEqual([]);

		// F1 in I2 should inherit I1 dependency from its initiative
		const f2 = manifest.feature_queue.find((f) => f.id === "S9999.I2.F1");
		expect(f2?.dependencies).toEqual(["S9999.I1"]);
	});

	it("propagates multiple initiative dependencies to features", () => {
		// Setup: Create spec with I3 depending on both I1 and I2
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"S9998-Spec-multi",
		);

		// Create I1, I2, and I3
		for (let i = 1; i <= 3; i++) {
			const initDir = path.join(specDir, `S9998.I${i}-Initiative-part${i}`);
			const featureDir = path.join(initDir, `S9998.I${i}.F1-Feature-main`);
			fs.mkdirSync(featureDir, { recursive: true });

			const blockedBy = i === 3 ? ["S9998.I1", "S9998.I2"] : undefined;
			createInitiativeMd(initDir, i, blockedBy);
			createTasksJson(featureDir, `S9998.I${i}.F1`, `S9998.I${i}`, "S9998");
			createFeatureMd(featureDir, `S9998.I${i}.F1`, 1);
		}

		// Generate manifest
		const manifest = generateSpecManifest(tempDir, 9998, specDir, true);

		expect(manifest).not.toBeNull();
		if (!manifest) return;

		// F1 in I3 should inherit both I1 and I2 dependencies
		const f3 = manifest.feature_queue.find((f) => f.id === "S9998.I3.F1");
		expect(f3?.dependencies).toContain("S9998.I1");
		expect(f3?.dependencies).toContain("S9998.I2");
		expect(f3?.dependencies.length).toBe(2);
	});

	it("combines initiative dependencies with feature dependencies", () => {
		// Setup: Feature has own dependency F1, plus initiative depends on I1
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"S9997-Spec-combined",
		);

		// Create I1 with F1
		const i1Dir = path.join(specDir, "S9997.I1-Initiative-base");
		const f1Dir = path.join(i1Dir, "S9997.I1.F1-Feature-first");
		fs.mkdirSync(f1Dir, { recursive: true });
		createInitiativeMd(i1Dir, 1);
		createTasksJson(f1Dir, "S9997.I1.F1", "S9997.I1", "S9997");
		createFeatureMd(f1Dir, "S9997.I1.F1", 1);

		// Create I2 (blocked by I1) with F1 and F2 (F2 blocked by F1)
		const i2Dir = path.join(specDir, "S9997.I2-Initiative-dependent");
		fs.mkdirSync(i2Dir, { recursive: true });
		createInitiativeMd(i2Dir, 2, ["S9997.I1"]);

		const f2_1Dir = path.join(i2Dir, "S9997.I2.F1-Feature-setup");
		fs.mkdirSync(f2_1Dir, { recursive: true });
		createTasksJson(f2_1Dir, "S9997.I2.F1", "S9997.I2", "S9997");
		createFeatureMd(f2_1Dir, "S9997.I2.F1", 1);

		const f2_2Dir = path.join(i2Dir, "S9997.I2.F2-Feature-build");
		fs.mkdirSync(f2_2Dir, { recursive: true });
		createTasksJson(f2_2Dir, "S9997.I2.F2", "S9997.I2", "S9997");
		// F2 blocked by F1 within same initiative
		createFeatureMd(f2_2Dir, "S9997.I2.F2", 2, ["F1"]);

		// Generate manifest
		const manifest = generateSpecManifest(tempDir, 9997, specDir, true);

		expect(manifest).not.toBeNull();
		if (!manifest) return;

		// F1 in I2 should inherit I1 dependency
		const f2_1 = manifest.feature_queue.find((f) => f.id === "S9997.I2.F1");
		expect(f2_1?.dependencies).toEqual(["S9997.I1"]);

		// F2 in I2 should have both initiative dep (I1) and feature dep (F1)
		const f2_2 = manifest.feature_queue.find((f) => f.id === "S9997.I2.F2");
		expect(f2_2?.dependencies).toContain("S9997.I1");
		expect(f2_2?.dependencies).toContain("S9997.I2.F1");
		expect(f2_2?.dependencies.length).toBe(2);
	});

	it("maintains correct dependency order (initiative deps first)", () => {
		// Setup: Feature has own dep, initiative also has dep
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"S9996-Spec-order",
		);

		// Create I1 with F1
		const i1Dir = path.join(specDir, "S9996.I1-Initiative-first");
		const f1Dir = path.join(i1Dir, "S9996.I1.F1-Feature-one");
		fs.mkdirSync(f1Dir, { recursive: true });
		createInitiativeMd(i1Dir, 1);
		createTasksJson(f1Dir, "S9996.I1.F1", "S9996.I1", "S9996");
		createFeatureMd(f1Dir, "S9996.I1.F1", 1);

		// Create I2 (blocked by I1) with F1 and F2
		const i2Dir = path.join(specDir, "S9996.I2-Initiative-second");
		fs.mkdirSync(i2Dir, { recursive: true });
		createInitiativeMd(i2Dir, 2, ["S9996.I1"]);

		const f2_1Dir = path.join(i2Dir, "S9996.I2.F1-Feature-setup");
		fs.mkdirSync(f2_1Dir, { recursive: true });
		createTasksJson(f2_1Dir, "S9996.I2.F1", "S9996.I2", "S9996");
		createFeatureMd(f2_1Dir, "S9996.I2.F1", 1);

		const f2_2Dir = path.join(i2Dir, "S9996.I2.F2-Feature-build");
		fs.mkdirSync(f2_2Dir, { recursive: true });
		createTasksJson(f2_2Dir, "S9996.I2.F2", "S9996.I2", "S9996");
		createFeatureMd(f2_2Dir, "S9996.I2.F2", 2, ["S9996.I2.F1"]);

		const manifest = generateSpecManifest(tempDir, 9996, specDir, true);

		expect(manifest).not.toBeNull();
		if (!manifest) return;

		const f2_2 = manifest.feature_queue.find((f) => f.id === "S9996.I2.F2");
		// Initiative deps come first (using Set preserves insertion order)
		expect(f2_2?.dependencies[0]).toBe("S9996.I1");
	});

	it("avoids duplicate dependencies", () => {
		// Edge case: Feature explicitly depends on same ID as initiative
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"S9995-Spec-dedup",
		);

		// Create I1 with F1
		const i1Dir = path.join(specDir, "S9995.I1-Initiative-base");
		const f1Dir = path.join(i1Dir, "S9995.I1.F1-Feature-core");
		fs.mkdirSync(f1Dir, { recursive: true });
		createInitiativeMd(i1Dir, 1);
		createTasksJson(f1Dir, "S9995.I1.F1", "S9995.I1", "S9995");
		createFeatureMd(f1Dir, "S9995.I1.F1", 1);

		// Create I2 (blocked by I1), with F1 that also explicitly blocks on I1
		const i2Dir = path.join(specDir, "S9995.I2-Initiative-dependent");
		const f2Dir = path.join(i2Dir, "S9995.I2.F1-Feature-explicit");
		fs.mkdirSync(f2Dir, { recursive: true });
		createInitiativeMd(i2Dir, 2, ["S9995.I1"]);
		createTasksJson(f2Dir, "S9995.I2.F1", "S9995.I2", "S9995");
		// Feature explicitly depends on I1 (same as initiative)
		createFeatureMd(f2Dir, "S9995.I2.F1", 1, ["S9995.I1"]);

		const manifest = generateSpecManifest(tempDir, 9995, specDir, true);

		expect(manifest).not.toBeNull();
		if (!manifest) return;

		const f2 = manifest.feature_queue.find((f) => f.id === "S9995.I2.F1");
		// Should only have one S9995.I1, not duplicated
		expect(f2?.dependencies).toEqual(["S9995.I1"]);
		expect(f2?.dependencies.length).toBe(1);
	});

	it("handles empty initiative dependencies correctly", () => {
		// Initiative with no dependencies should not affect features
		const specDir = path.join(
			tempDir,
			".ai",
			"alpha",
			"specs",
			"S9994-Spec-empty",
		);

		const i1Dir = path.join(specDir, "S9994.I1-Initiative-standalone");
		const f1Dir = path.join(i1Dir, "S9994.I1.F1-Feature-solo");
		fs.mkdirSync(f1Dir, { recursive: true });
		createInitiativeMd(i1Dir, 1); // No blockedBy
		createTasksJson(f1Dir, "S9994.I1.F1", "S9994.I1", "S9994");
		createFeatureMd(f1Dir, "S9994.I1.F1", 1);

		const manifest = generateSpecManifest(tempDir, 9994, specDir, true);

		expect(manifest).not.toBeNull();
		if (!manifest) return;

		const f1 = manifest.feature_queue.find((f) => f.id === "S9994.I1.F1");
		expect(f1?.dependencies).toEqual([]);
	});
});
