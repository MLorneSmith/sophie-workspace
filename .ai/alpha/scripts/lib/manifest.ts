/**

* Manifest Management Module
*
* Handles loading, saving, and finding spec manifests and directories.
* Also manages the overall progress file for UI consumption.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import {
	ARCHIVE_DIR,
	LOGS_DIR,
	MAX_ARCHIVED_RUNS,
	UI_PROGRESS_DIR,
} from "../config/index.js";
import type { SpecManifest } from "../types/index.js";
import { getProjectRoot } from "./lock.js";

// ============================================================================
// Spec Directory Discovery
// ============================================================================

/**

* Find the spec directory for a given spec ID.
* Searches .ai/alpha/specs/ for directories matching the pattern `{id}-Spec-*`
*
* @param projectRoot - The project root directory
* @param specId - The spec ID to find
* @returns The spec directory path, or null if not found
 */
export function findSpecDir(
	projectRoot: string,
	specId: number,
): string | null {
	const specsDir = path.join(projectRoot, ".ai", "alpha", "specs");

	if (!fs.existsSync(specsDir)) {
		return null;
	}

	const specDirs = fs.readdirSync(specsDir);

	for (const specDir of specDirs) {
		const match = specDir.match(/^(\d+)-Spec-/);
		const idStr = match?.[1];
		if (idStr && parseInt(idStr, 10) === specId) {
			return path.join(specsDir, specDir);
		}
	}

	return null;
}

// ============================================================================
// Manifest Loading & Saving
// ============================================================================

/**

* Load a spec manifest from a spec directory.
*
* @param specDir - The spec directory containing spec-manifest.json
* @returns The loaded manifest, or null if not found/invalid
 */
export function loadManifest(specDir: string): SpecManifest | null {
	const manifestPath = path.join(specDir, "spec-manifest.json");

	if (!fs.existsSync(manifestPath)) {
		return null;
	}

	try {
		const content = fs.readFileSync(manifestPath, "utf-8");
		return JSON.parse(content) as SpecManifest;
	} catch (error) {
		console.error(`Failed to load manifest: ${error}`);
		return null;
	}
}

/**

* Save a spec manifest to its directory.
* Updates the last_checkpoint timestamp and writes overall progress for UI.
*
* @param manifest - The manifest to save
* @param reviewUrls - Optional review URLs to include in progress (for completion)
* @param runId - Optional run ID for this orchestrator session
 */
export function saveManifest(
	manifest: SpecManifest,
	reviewUrls?: ReviewUrlForUI[],
	runId?: string,
): void {
	const manifestPath = path.join(
		manifest.metadata.spec_dir,
		"spec-manifest.json",
	);
	manifest.progress.last_checkpoint = new Date().toISOString();
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

	// Also write overall progress for UI consumption
	// Pass through reviewUrls and runId to ensure they're written atomically with status
	writeOverallProgress(manifest, reviewUrls, runId);
}

// ============================================================================
// Overall Progress (for UI)
// ============================================================================

/**

* Ensure the UI progress directory exists.
 */
export function ensureUIProgressDir(): string {
	const progressDir = path.join(getProjectRoot(), UI_PROGRESS_DIR);
	if (!fs.existsSync(progressDir)) {
		fs.mkdirSync(progressDir, { recursive: true });
	}
	return progressDir;
}

/**

* Review URL for UI display
 */
export interface ReviewUrlForUI {
	label: string;
	vscode: string;
	devServer: string;
}

/**

* Write overall progress to local file for UI consumption.
* This provides authoritative counts from the manifest since sandbox
* progress files only contain current feature info.
*
* IMPORTANT: Counts are now calculated from manifest state instead of using
* stored increment values. This prevents counts from exceeding totals when
* features are retried or fail and restart.
*
* @param manifest - The manifest to extract progress from
* @param reviewUrls - Optional review URLs to include (for completion screen)
* @param runId - Optional run ID for this orchestrator session
 */
export function writeOverallProgress(
	manifest: SpecManifest,
	reviewUrls?: ReviewUrlForUI[],
	runId?: string,
): void {
	const progressDir = ensureUIProgressDir();
	const filePath = path.join(progressDir, "overall-progress.json");

	// Calculate features completed by counting status from manifest state
	// This prevents counts from exceeding totals when features are retried
	const featuresCompleted = manifest.feature_queue.filter(
		(f) => f.status === "completed",
	).length;

	// Calculate tasks completed by summing from all completed features
	const tasksCompleted = manifest.feature_queue
		.filter((f) => f.status === "completed")
		.reduce((sum, f) => sum + (f.tasks_completed || 0), 0);

	// Calculate initiatives completed by counting status from manifest state
	const initiativesCompleted = manifest.initiatives.filter(
		(i) => i.status === "completed",
	).length;

	// Cap at totals to prevent > 100% display in case of any edge cases
	const cappedFeaturesCompleted = Math.min(
		featuresCompleted,
		manifest.progress.features_total,
	);
	const cappedTasksCompleted = Math.min(
		tasksCompleted,
		manifest.progress.tasks_total,
	);
	const cappedInitiativesCompleted = Math.min(
		initiativesCompleted,
		manifest.progress.initiatives_total,
	);

	// Update manifest.progress with calculated values for consistency
	manifest.progress.features_completed = cappedFeaturesCompleted;
	manifest.progress.tasks_completed = cappedTasksCompleted;
	manifest.progress.initiatives_completed = cappedInitiativesCompleted;

	const overallProgress: Record<string, unknown> = {
		specId: manifest.metadata.spec_id,
		specName: manifest.metadata.spec_name,
		status: manifest.progress.status,
		initiativesCompleted: cappedInitiativesCompleted,
		initiativesTotal: manifest.progress.initiatives_total,
		featuresCompleted: cappedFeaturesCompleted,
		featuresTotal: manifest.progress.features_total,
		tasksCompleted: cappedTasksCompleted,
		tasksTotal: manifest.progress.tasks_total,
		lastCheckpoint: new Date().toISOString(),
		branchName: manifest.sandbox.branch_name,
		runId,
	};

	// Include review URLs if provided
	if (reviewUrls && reviewUrls.length > 0) {
		overallProgress.reviewUrls = reviewUrls;
	}

	try {
		fs.writeFileSync(filePath, JSON.stringify(overallProgress, null, "\t"));
	} catch {
		// Ignore write errors
	}
}

/**
 * Archive and clear previous run data.
 * Moves old progress files and logs to timestamped archive directory
 * instead of deleting them, then cleans up archives beyond MAX_ARCHIVED_RUNS.
 *
 * @param runId - The new run ID (for logging purposes)
 */
export function archiveAndClearPreviousRun(_runId: string): void {
	const projectRoot = getProjectRoot();
	const archiveDir = path.join(projectRoot, ARCHIVE_DIR);
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
	const archivePath = path.join(archiveDir, timestamp);

	const progressDir = path.join(projectRoot, UI_PROGRESS_DIR);
	const logsDir = path.join(projectRoot, LOGS_DIR);

	// Check if there's anything to archive
	const hasProgressFiles =
		fs.existsSync(progressDir) &&
		fs.readdirSync(progressDir).some((f) => f.endsWith("-progress.json"));
	const hasLogFiles =
		fs.existsSync(logsDir) &&
		fs
			.readdirSync(logsDir)
			.some(
				(f) =>
					(f.startsWith("sbx-") && f.endsWith(".log")) || f.startsWith("run-"),
			);

	if (!hasProgressFiles && !hasLogFiles) {
		// Nothing to archive
		return;
	}

	// Create archive directory
	try {
		fs.mkdirSync(archivePath, { recursive: true });
	} catch {
		// If we can't create archive, fall back to clearing files
		clearProgressAndLogs(progressDir, logsDir);
		return;
	}

	// Archive progress files
	if (fs.existsSync(progressDir)) {
		const progressArchive = path.join(archivePath, "progress");
		fs.mkdirSync(progressArchive, { recursive: true });

		for (const file of fs.readdirSync(progressDir)) {
			if (file.endsWith("-progress.json")) {
				try {
					const src = path.join(progressDir, file);
					const dest = path.join(progressArchive, file);
					fs.copyFileSync(src, dest);
					fs.unlinkSync(src);
				} catch {
					// Ignore individual file errors
				}
			}
		}
	}

	// Archive log files/directories
	if (fs.existsSync(logsDir)) {
		const logsArchive = path.join(archivePath, "logs");
		fs.mkdirSync(logsArchive, { recursive: true });

		for (const entry of fs.readdirSync(logsDir)) {
			const srcPath = path.join(logsDir, entry);
			const destPath = path.join(logsArchive, entry);

			try {
				const stat = fs.statSync(srcPath);
				if (stat.isDirectory()) {
					// Copy directory recursively (run-specific log directories)
					copyDirRecursive(srcPath, destPath);
					removeDirRecursive(srcPath);
				} else if (entry.startsWith("sbx-") && entry.endsWith(".log")) {
					// Copy individual log files (legacy format)
					fs.copyFileSync(srcPath, destPath);
					fs.unlinkSync(srcPath);
				}
			} catch {
				// Ignore individual file errors
			}
		}
	}

	// Clean up old archives if exceeding MAX_ARCHIVED_RUNS
	cleanupOldArchives(archiveDir);
}

/**
 * Clear progress and log files without archiving (fallback).
 */
function clearProgressAndLogs(progressDir: string, logsDir: string): void {
	if (fs.existsSync(progressDir)) {
		for (const file of fs.readdirSync(progressDir)) {
			if (file.endsWith("-progress.json")) {
				try {
					fs.unlinkSync(path.join(progressDir, file));
				} catch {
					// Ignore deletion errors
				}
			}
		}
	}

	if (fs.existsSync(logsDir)) {
		for (const entry of fs.readdirSync(logsDir)) {
			const entryPath = path.join(logsDir, entry);
			try {
				const stat = fs.statSync(entryPath);
				if (stat.isDirectory()) {
					removeDirRecursive(entryPath);
				} else if (entry.startsWith("sbx-") && entry.endsWith(".log")) {
					fs.unlinkSync(entryPath);
				}
			} catch {
				// Ignore deletion errors
			}
		}
	}
}

/**
 * Copy a directory recursively.
 */
function copyDirRecursive(src: string, dest: string): void {
	fs.mkdirSync(dest, { recursive: true });
	for (const entry of fs.readdirSync(src)) {
		const srcPath = path.join(src, entry);
		const destPath = path.join(dest, entry);
		const stat = fs.statSync(srcPath);
		if (stat.isDirectory()) {
			copyDirRecursive(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

/**
 * Remove a directory recursively.
 */
function removeDirRecursive(dir: string): void {
	if (fs.existsSync(dir)) {
		for (const entry of fs.readdirSync(dir)) {
			const entryPath = path.join(dir, entry);
			const stat = fs.statSync(entryPath);
			if (stat.isDirectory()) {
				removeDirRecursive(entryPath);
			} else {
				fs.unlinkSync(entryPath);
			}
		}
		fs.rmdirSync(dir);
	}
}

/**
 * Clean up old archives beyond MAX_ARCHIVED_RUNS.
 */
function cleanupOldArchives(archiveDir: string): void {
	if (!fs.existsSync(archiveDir)) {
		return;
	}

	const archives = fs
		.readdirSync(archiveDir)
		.filter((d) => {
			const fullPath = path.join(archiveDir, d);
			return fs.statSync(fullPath).isDirectory();
		})
		.sort()
		.reverse(); // Most recent first

	// Remove archives beyond the limit
	for (let i = MAX_ARCHIVED_RUNS; i < archives.length; i++) {
		const archiveName = archives[i];
		if (!archiveName) continue;
		const archivePath = path.join(archiveDir, archiveName);
		try {
			removeDirRecursive(archivePath);
		} catch {
			// Ignore cleanup errors
		}
	}
}

/**
 * @deprecated Use archiveAndClearPreviousRun instead.
 * Clear all UI progress files and log files.
 * Called at orchestration start to clean up stale data.
 */
export function clearUIProgress(): void {
	const projectRoot = getProjectRoot();
	const progressDir = path.join(projectRoot, UI_PROGRESS_DIR);
	const logsDir = path.join(projectRoot, LOGS_DIR);
	clearProgressAndLogs(progressDir, logsDir);
}
