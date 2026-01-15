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
	loadManifest,
	saveManifest,
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
			spec_id: 1362,
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

		expect(result?.metadata.spec_id).toBe(1362);
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
		expect(saved.metadata.spec_id).toBe(1362);
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
		expect(manifest.progress.last_checkpoint! >= before).toBe(true);
		expect(manifest.progress.last_checkpoint! <= after).toBe(true);
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
					id: 1,
					initiative_id: 1,
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
					id: 2,
					initiative_id: 1,
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
		expect(progress.tasksCompleted).toBe(5); // Only from completed feature
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
		const archivePath = path.join(archiveDir, archives[0]!, "progress");
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
