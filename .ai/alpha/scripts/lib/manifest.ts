/**

* Manifest Management Module
*
* Handles loading, saving, and finding spec manifests and directories.
* Also manages the overall progress file for UI consumption.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { LOGS_DIR, UI_PROGRESS_DIR } from "../config/index.js";
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
 */
export function saveManifest(manifest: SpecManifest): void {
	const manifestPath = path.join(
		manifest.metadata.spec_dir,
		"spec-manifest.json",
	);
	manifest.progress.last_checkpoint = new Date().toISOString();
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

	// Also write overall progress for UI consumption
	writeOverallProgress(manifest);
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
 */
export function writeOverallProgress(
	manifest: SpecManifest,
	reviewUrls?: ReviewUrlForUI[],
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

* Clear all UI progress files and log files.
* Called at orchestration start to clean up stale data.
 */
export function clearUIProgress(): void {
	const projectRoot = getProjectRoot();

	// Clear JSON progress files
	const progressDir = path.join(projectRoot, UI_PROGRESS_DIR);
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

	// Clear log files from previous runs to prevent stale data display
	const logsDir = path.join(projectRoot, LOGS_DIR);
	if (fs.existsSync(logsDir)) {
		for (const file of fs.readdirSync(logsDir)) {
			if (file.startsWith("sbx-") && file.endsWith(".log")) {
				try {
					fs.unlinkSync(path.join(logsDir, file));
				} catch {
					// Ignore deletion errors
				}
			}
		}
	}
}
