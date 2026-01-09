/**

* Feature Implementation Module
*
* Handles running feature implementations in E2B sandboxes.
* Manages progress polling, git operations, and result tracking.
 */

import process from "node:process";

import {
 FEATURE_TIMEOUT_MS,
 PROGRESS_FILE,
 WORKSPACE_DIR,
} from "../config/index.js";
import type {
 FeatureEntry,
 FeatureImplementationResult,
 SandboxInstance,
 SpecManifest,
} from "../types/index.js";
import { getAllEnvVars } from "./environment.js";
import { saveManifest } from "./manifest.js";
import { checkForStall, startProgressPolling } from "./progress.js";
import { updateNextFeatureId } from "./work-queue.js";

// ============================================================================
// Feature Implementation
// ============================================================================

/**

* Run feature implementation in a sandbox.
*
* @param instance - The sandbox instance
* @param manifest - The spec manifest
* @param feature - The feature to implement
* @param uiEnabled - Whether UI mode is enabled
* @returns Result with success status, tasks completed, and error if any
 */
export async function runFeatureImplementation(
 instance: SandboxInstance,
 manifest: SpecManifest,
 feature: FeatureEntry,
 uiEnabled: boolean = false,
): Promise<FeatureImplementationResult> {
 console.log(
  `\n   ┌── [${instance.label}] Feature #${feature.id}: ${feature.title}`,
 );
 console.log(`│   Tasks: ${feature.task_count}`);

 // Mark feature as in_progress
 feature.status = "in_progress";
 feature.assigned_sandbox = instance.label;
 instance.currentFeature = feature.id;
 instance.status = "busy";
 instance.featureStartedAt = new Date();
 instance.lastProgressSeen = undefined;
 instance.lastHeartbeat = undefined;
 saveManifest(manifest);

 // Clear stale progress file from previous runs
 try {
  await instance.sandbox.commands.run(
   `cd ${WORKSPACE_DIR} && rm -f ${PROGRESS_FILE}`,
   { timeoutMs: 5000 },
  );
 } catch {
  // Ignore - file may not exist
 }

 // CRITICAL: Pull latest code before starting feature
 const branchName = manifest.sandbox.branch_name;

 // Check if remote branch exists before attempting pull
 const remoteBranchCheck = await instance.sandbox.commands.run(
  `cd ${WORKSPACE_DIR} && git ls-remote --heads origin "${branchName}" | wc -l`,
  { timeoutMs: 30000 },
 );
 const remoteBranchExists = remoteBranchCheck.stdout.trim() === "1";

 if (!remoteBranchExists) {
  console.log("   │   ℹ️ Remote branch not yet pushed - skipping pull");
 } else {
  console.log("   │   Pulling latest code...");
  try {
   await instance.sandbox.commands.run(
    `cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git reset --hard FETCH_HEAD`,
    { timeoutMs: 60000 },
   );
   console.log("   │   ✓ Code synced");
  } catch (pullError) {
   console.log(`│   ⚠ Pull failed (continuing anyway): ${pullError}`);
  }
 }

 const prompt = `/alpha:implement ${feature.id}`;
 console.log(`│   Running: ${prompt}`);

 let capturedStdout = "";
 let capturedStderr = "";

 // Track when this session started
 const sessionStartTime = new Date();

 // Start progress polling
 const progressPoller = startProgressPolling(
  instance.sandbox,
  feature.task_count,
  instance.label,
  sessionStartTime,
  uiEnabled,
  instance,
  feature,
 );

 // Start stall detection interval
 let stallDetected = false;
 const stallCheckInterval = setInterval(() => {
  const lastProgress = progressPoller.getLastProgress();
  const stallCheck = checkForStall(lastProgress, sessionStartTime);
  if (stallCheck.stalled && !stallDetected) {
   stallDetected = true;
   console.log(`│   ⚠️ STALL DETECTED: ${stallCheck.reason}`);
  }
 }, 60000);

 try {
  const result = await instance.sandbox.commands.run(
   `stdbuf -oL -eL run-claude "${prompt.replace(/"/g, '\\"')}"`,
   {
    timeoutMs: FEATURE_TIMEOUT_MS,
    envs: getAllEnvVars(),
    onStdout: (data) => {
     capturedStdout += data;
     const lines = data.split("\n");
     for (const line of lines) {
      if (line.trim()) {
       process.stdout.write(`│   ${line}\n`);
      }
     }
    },
    onStderr: (data) => {
     capturedStderr += data;
    },
   },
  );

  // Stop polling and stall detection
  progressPoller.stop();
  clearInterval(stallCheckInterval);

  // Get last progress from poller as a fallback
  const lastPolledProgress = progressPoller.getLastProgress();

  // Read progress file
  const progressResult = await instance.sandbox.commands.run(
   `cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null || echo '{}'`,
   { timeoutMs: 10000 },
  );

  let tasksCompleted = 0;
  let status: FeatureEntry["status"] = "completed";

  try {
   const parsed = JSON.parse(progressResult.stdout || "{}");
   tasksCompleted = parsed.completed_tasks?.length || 0;

   if (parsed.status === "completed" || result.exitCode === 0) {
    status = "completed";
   } else if (parsed.status === "blocked") {
    status = "blocked";
   } else {
    status = "failed";
   }
  } catch {
   status = result.exitCode === 0 ? "completed" : "failed";
  }

  // Fallback: Use last polled progress if available
  if (tasksCompleted === 0 && lastPolledProgress?.completed_tasks) {
   tasksCompleted = lastPolledProgress.completed_tasks.length;
  }

  // Fallback: If completed, try to extract from output or assume all tasks done
  if (
   status === "completed" &&
   result.exitCode === 0 &&
   tasksCompleted === 0
  ) {
   const taskMatch = capturedStdout.match(
    /Tasks?:?\s*(\d+)\s*\/\s*(\d+)\s*(?:completed|complete|\(100%\))/i,
   );
   const taskCountStr = taskMatch?.[1];
   if (taskCountStr) {
    tasksCompleted = parseInt(taskCountStr, 10);
   } else {
    tasksCompleted = feature.task_count;
   }
  }

  // Update feature
  feature.status = status;
  feature.tasks_completed = tasksCompleted;
  feature.assigned_sandbox = undefined;
  instance.currentFeature = null;
  instance.status = "ready";

  // Update progress
  if (status === "completed") {
   manifest.progress.features_completed++;
   manifest.progress.last_completed_feature_id = feature.id;

   // Update initiative status
   const initiative = manifest.initiatives.find(
    (i) => i.id === feature.initiative_id,
   );
   if (initiative) {
    initiative.features_completed++;
    const initFeatures = manifest.feature_queue.filter(
     (f) => f.initiative_id === initiative.id,
    );
    if (initFeatures.every((f) => f.status === "completed")) {
     initiative.status = "completed";
     manifest.progress.initiatives_completed++;
    } else {
     initiative.status = "in_progress";
    }
   }

   // CRITICAL: Push after completing feature
   try {
    await instance.sandbox.commands.run(
     `cd ${WORKSPACE_DIR} && git push origin "${manifest.sandbox.branch_name}"`,
     { timeoutMs: 120000 },
    );
   } catch (pushError) {
    console.log(`   │   ⚠ Push failed: ${pushError}`);
   }
  }

  manifest.progress.tasks_completed += tasksCompleted;
  updateNextFeatureId(manifest);
  saveManifest(manifest);

  const icon =
   status === "completed" ? "✅" : status === "blocked" ? "🚫" : "❌";
  console.log(
   `   └── ${icon} ${status} (${tasksCompleted}/${feature.task_count} tasks)`,
  );

  return {
   success: status === "completed",
   tasksCompleted,
   error: status !== "completed" ? `Feature ${status}` : undefined,
  };
 } catch (error) {
  // Stop polling and stall detection on error
  progressPoller.stop();
  clearInterval(stallCheckInterval);

  const errorMessage = error instanceof Error ? error.message : String(error);

  feature.status = "failed";
  feature.error = errorMessage;
  feature.assigned_sandbox = undefined;
  instance.currentFeature = null;
  instance.status = "ready";
  updateNextFeatureId(manifest);
  saveManifest(manifest);

  console.log(`   └── ❌ Error: ${errorMessage}`);

  return {
   success: false,
   tasksCompleted: 0,
   error: errorMessage,
  };
 }
}
