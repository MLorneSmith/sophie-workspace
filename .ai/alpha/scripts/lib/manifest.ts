/**

* Manifest Management Module
*
* Handles loading, saving, and finding spec manifests and directories.
* Also manages the overall progress file for UI consumption.
 */

import *as fs from "node:fs";
import* as path from "node:path";

import { UI_PROGRESS_DIR } from "../config/index.js";
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

* Write overall progress to local file for UI consumption.
* This provides authoritative counts from the manifest since sandbox
* progress files only contain current feature info.
*
* @param manifest - The manifest to extract progress from
 */
export function writeOverallProgress(manifest: SpecManifest): void {
 const progressDir = ensureUIProgressDir();
 const filePath = path.join(progressDir, "overall-progress.json");

 const overallProgress = {
  specId: manifest.metadata.spec_id,
  specName: manifest.metadata.spec_name,
  status: manifest.progress.status,
  initiativesCompleted: manifest.progress.initiatives_completed,
  initiativesTotal: manifest.progress.initiatives_total,
  featuresCompleted: manifest.progress.features_completed,
  featuresTotal: manifest.progress.features_total,
  tasksCompleted: manifest.progress.tasks_completed,
  tasksTotal: manifest.progress.tasks_total,
  lastCheckpoint: new Date().toISOString(),
 };

 try {
  fs.writeFileSync(filePath, JSON.stringify(overallProgress, null, "\t"));
 } catch {
  // Ignore write errors
 }
}

/**

* Clear all UI progress files.
* Called at orchestration start to clean up stale data.
 */
export function clearUIProgress(): void {
 const progressDir = path.join(getProjectRoot(), UI_PROGRESS_DIR);
 if (fs.existsSync(progressDir)) {
  for (const file of fs.readdirSync(progressDir)) {
   if (file.endsWith("-progress.json")) {
    try {
     fs.unlinkSync(path.join(progressDir, file));
    } catch {
     // Ignore
    }
   }
  }
 }
}
