#!/usr/bin/env tsx

/**

* Generate Spec Manifest
*
* Aggregates all initiatives and features under a spec into a single
* spec-manifest.json for the Alpha orchestrator.
*
* Usage:
* tsx generate-spec-manifest.ts <spec-id>
* tsx generate-spec-manifest.ts 1362
*
* Output:
* Creates .ai/alpha/specs/<spec-dir>/spec-manifest.json
 */

import *as fs from "node:fs";
import* as path from "node:path";

// ============================================================================
// Types
// ============================================================================

interface TasksJson {
 metadata: {
  feature_id: number;
  feature_name: string;
  feature_slug?: string;
  initiative_id: number;
  spec_id: number;
  requires_database?: boolean;
  database_tasks?: string[];
 };
 tasks: Array<{
  id: string;
  name: string;
  status: string;
  estimated_hours: number;
  requires_database?: boolean;
 }>;
 execution: {
  duration: {
   sequential: number;
   parallel: number;
  };
 };
 github?: {
  feature_tasks_issue?: number;
 };
}

interface FeatureEntry {
 id: number;
 initiative_id: number;
 title: string;
 slug?: string;
 priority: number;
 global_priority: number; // Priority across all initiatives
 status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
 tasks_file: string;
 feature_dir: string;
 task_count: number;
 tasks_completed: number;
 sequential_hours: number;
 parallel_hours: number;
 dependencies: number[]; // Feature IDs this is blocked by
 github_issue: number | null;
 assigned_sandbox?: string;
 error?: string;
 requires_database: boolean; // True if any task requires DB access
 database_task_count: number; // Count of tasks requiring DB access
}

interface InitiativeEntry {
 id: number;
 name: string;
 slug: string;
 priority: number;
 status: "pending" | "in_progress" | "completed" | "failed" | "partial";
 initiative_dir: string;
 feature_count: number;
 features_completed: number;
 dependencies: number[]; // Initiative IDs this is blocked by
}

interface SpecManifest {
 metadata: {
  spec_id: number;
  spec_name: string;
  generated_at: string;
  spec_dir: string;
  research_dir: string;
 };
 initiatives: InitiativeEntry[];
 feature_queue: FeatureEntry[];
 progress: {
  status: "pending" | "in_progress" | "completed" | "failed" | "partial";
  initiatives_completed: number;
  initiatives_total: number;
  features_completed: number;
  features_total: number;
  tasks_completed: number;
  tasks_total: number;
  next_feature_id: number | null;
  last_completed_feature_id: number | null;
  started_at: string | null;
  completed_at: string | null;
  last_checkpoint: string | null;
 };
 sandbox: {
  sandbox_ids: string[];
  branch_name: string | null;
  created_at: string | null;
 };
}

// ============================================================================
// Utility Functions
// ============================================================================

function findProjectRoot(): string {
 let dir = process.cwd();
 while (dir !== "/") {
  if (fs.existsSync(path.join(dir, ".git"))) {
   return dir;
  }
  dir = path.dirname(dir);
 }
 return process.cwd();
}

function findSpecDir(projectRoot: string, specId: number): string | null {
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

function findInitiativeDirectories(specDir: string): string[] {
 const initDirs: string[] = [];

 const contents = fs.readdirSync(specDir);
 for (const item of contents) {
  const itemPath = path.join(specDir, item);
  if (!fs.statSync(itemPath).isDirectory()) continue;

  // Match pattern: <id>-Initiative-<name>
  if (item.match(/^\d+-Initiative-/)) {
   initDirs.push(itemPath);
  }
 }

 // Sort by initiative ID
 return initDirs.sort((a, b) => {
  const idA = parseInt(path.basename(a).match(/^(\d+)/)?.[1] || "0", 10);
  const idB = parseInt(path.basename(b).match(/^(\d+)/)?.[1] || "0", 10);
  return idA - idB;
 });
}

function findFeatureDirectories(initDir: string): string[] {
 const featureDirs: string[] = [];

 const contents = fs.readdirSync(initDir);
 for (const item of contents) {
  const itemPath = path.join(initDir, item);
  if (!fs.statSync(itemPath).isDirectory()) continue;

  // Match pattern: <id>-Feature-<name>
  if (item.match(/^\d+-Feature-/)) {
   const tasksFile = path.join(itemPath, "tasks.json");
   if (fs.existsSync(tasksFile)) {
    featureDirs.push(itemPath);
   }
  }
 }

 // Sort by feature ID
 return featureDirs.sort((a, b) => {
  const idA = parseInt(path.basename(a).match(/^(\d+)/)?.[1] || "0", 10);
  const idB = parseInt(path.basename(b).match(/^(\d+)/)?.[1] || "0", 10);
  return idA - idB;
 });
}

function loadTasksJson(featureDir: string): TasksJson | null {
 const tasksFile = path.join(featureDir, "tasks.json");
 try {
  const content = fs.readFileSync(tasksFile, "utf-8");
  return JSON.parse(content) as TasksJson;
 } catch (error) {
  console.error(`Failed to load ${tasksFile}:`, error);
  return null;
 }
}

/**

* Raw dependency reference - can be either a GitHub issue number or internal F# reference.
 */
interface RawDependency {
 type: "issue" | "internal";
 value: number; // Issue number or F# number (e.g., F1 → 1)
}

/**

* Extract feature dependencies from feature.md file.
* Looks for "Blocked By:" section with issue numbers (#123) or internal references (F1, F2).
* Returns raw references that need to be resolved after all features are loaded.
 */
function extractFeatureDependenciesRaw(featureDir: string): RawDependency[] {
 const featureFile = path.join(featureDir, "feature.md");
 if (!fs.existsSync(featureFile)) return [];

 try {
  const content = fs.readFileSync(featureFile, "utf-8");
  const deps: RawDependency[] = [];

  // Look for "Blocked By" section (handle various formats)
  const patterns = [
   /### Blocked By\s*\n([^#]*)/i,
   /\*\*Blocked By\*\*:?\s*([^\n]*)/i,
   /Blocked By:?\s*([^\n]*)/i,
  ];

  for (const pattern of patterns) {
   const match = content.match(pattern);
   if (!match?.[1]) continue;
   const section: string = match[1];

   // Match GitHub issue numbers: #1234
   const issueMatches = section.match(/#(\d+)/g);
   if (issueMatches) {
    for (const issueMatch of issueMatches) {
     const issueNum = parseInt(issueMatch.slice(1), 10);
     if (!deps.some((d) => d.type === "issue" && d.value === issueNum)) {
      deps.push({ type: "issue", value: issueNum });
     }
    }
   }

   // Match internal feature references: F1, F2, F3, etc.
   // Pattern: F1: or F1 or F1, - captures the number after F
   const internalMatches = section.match(/\bF(\d+)\b/g);
   if (internalMatches) {
    for (const internalMatch of internalMatches) {
     const fNum = parseInt(internalMatch.slice(1), 10);
     if (!deps.some((d) => d.type === "internal" && d.value === fNum)) {
      deps.push({ type: "internal", value: fNum });
     }
    }
   }
  }

  return deps;
 } catch {
  return [];
 }
}

/**

* Resolve raw dependencies to actual feature IDs.
* Internal F# references are resolved within the same initiative based on priority.
*
* @param rawDeps - Raw dependencies from extractFeatureDependenciesRaw
* @param initiativeId - The initiative this feature belongs to
* @param featurePriorityMap - Map of initiative_id -> priority -> feature_id
 */
function resolveFeatureDependencies(
 rawDeps: RawDependency[],
 initiativeId: number,
 featurePriorityMap: Map<string, number>,
): number[] {
 const resolved: number[] = [];

 for (const dep of rawDeps) {
  if (dep.type === "issue") {
   // GitHub issue number - use directly
   if (!resolved.includes(dep.value)) {
    resolved.push(dep.value);
   }
  } else if (dep.type === "internal") {
   // Internal F# reference - resolve within same initiative
   // F1 = priority 1, F2 = priority 2, etc.
   const key = `${initiativeId}-${dep.value}`;
   const featureId = featurePriorityMap.get(key);
   if (featureId && !resolved.includes(featureId)) {
    resolved.push(featureId);
   }
  }
 }

 return resolved;
}

/**

* Extract initiative dependencies from initiative.md file.
 */
function extractInitiativeDependencies(initDir: string): number[] {
 const initFile = path.join(initDir, "initiative.md");
 if (!fs.existsSync(initFile)) return [];

 try {
  const content = fs.readFileSync(initFile, "utf-8");
  const deps: number[] = [];

  // Look for "Blocked By" section
  const patterns = [
   /### Blocked By\s*\n([^#]*)/i,
   /\*\*Blocked By\*\*:?\s*([^\n]*)/i,
   /Blocked By:?\s*([^\n]*)/i,
  ];

  for (const pattern of patterns) {
   const match = content.match(pattern);
   const section = match?.[1];
   if (section) {
    const issueMatches = section.match(/#(\d+)/g);
    if (issueMatches) {
     for (const issueMatch of issueMatches) {
      const issueNum = parseInt(issueMatch.slice(1), 10);
      if (!deps.includes(issueNum)) {
       deps.push(issueNum);
      }
     }
    }
   }
  }

  return deps;
 } catch {
  return [];
 }
}

/**

* Extract initiative priority from initiative.md metadata table.
 */
function extractInitiativePriority(initDir: string): number {
 const initFile = path.join(initDir, "initiative.md");
 if (!fs.existsSync(initFile)) return 999;

 try {
  const content = fs.readFileSync(initFile, "utf-8");

  // Look for Priority in metadata table: | **Priority** | 1 |
  const match = content.match(/\|\s*\*\*Priority\*\*\s*\|\s*(\d+)\s*\|/i);
  const priorityStr = match?.[1];
  if (priorityStr) {
   return parseInt(priorityStr, 10);
  }

  return 999;
 } catch {
  return 999;
 }
}

/**

* Extract feature priority from feature.md metadata table.
 */
function extractFeaturePriority(featureDir: string): number {
 const featureFile = path.join(featureDir, "feature.md");
 if (!fs.existsSync(featureFile)) return 999;

 try {
  const content = fs.readFileSync(featureFile, "utf-8");

  // Look for Priority in metadata table: | **Priority** | 1 |
  const match = content.match(/\|\s*\*\*Priority\*\*\s*\|\s*(\d+)\s*\|/i);
  const priorityStr = match?.[1];
  if (priorityStr) {
   return parseInt(priorityStr, 10);
  }

  return 999;
 } catch {
  return 999;
 }
}

/**

* Extract the F# number from Feature ID in feature.md metadata table.
* Feature ID format: "1365-F1" -> returns 1
* This is used for mapping internal F# references.
 */
function extractFeatureFNumber(featureDir: string): number | null {
 const featureFile = path.join(featureDir, "feature.md");
 if (!fs.existsSync(featureFile)) return null;

 try {
  const content = fs.readFileSync(featureFile, "utf-8");

  // Look for Feature ID in metadata table: | **Feature ID** | 1365-F1 |
  const match = content.match(
   /\|\s*\*\*Feature ID\*\*\s*\|\s*\d+-F(\d+)\s*\|/i,
  );
  if (match?.[1]) {
   return parseInt(match[1], 10);
  }

  return null;
 } catch {
  return null;
 }
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
 const args = process.argv.slice(2);
 const specIdArg = args[0];
 const specId = specIdArg ? parseInt(specIdArg, 10) : NaN;

 if (Number.isNaN(specId)) {
  console.error("Usage: tsx generate-spec-manifest.ts <spec-id>");
  console.error("Example: tsx generate-spec-manifest.ts 1362");
  process.exit(1);
 }

 const projectRoot = findProjectRoot();
 console.log(`Project root: ${projectRoot}`);

 // Find spec directory
 const specDir = findSpecDir(projectRoot, specId);
 if (!specDir) {
  console.error(`Spec #${specId} not found in .ai/alpha/specs/`);
  process.exit(1);
 }

 console.log(`Spec directory: ${specDir}`);

 const specName = path
  .basename(specDir)
  .replace(/^\d+-Spec-/, "")
  .replace(/-/g, " ");

 // Find all initiative directories
 const initDirs = findInitiativeDirectories(specDir);
 console.log(`Found ${initDirs.length} initiatives`);

 if (initDirs.length === 0) {
  console.error("No initiatives found under spec");
  process.exit(1);
 }

 // =========================================================================
 // Two-pass processing:
 // Pass 1: Collect all features and build priority map
 // Pass 2: Resolve internal F# references to actual feature IDs
 // =========================================================================

 const initiatives: InitiativeEntry[] = [];
 const featureQueue: FeatureEntry[] = [];
 let totalTasks = 0;
 let totalTasksCompleted = 0;

 // Map: "initiative_id-priority" -> feature_id
 // Used to resolve F1, F2, etc. references within an initiative
 const featurePriorityMap = new Map<string, number>();

 // Temporary storage for raw dependencies (before resolution)
 const rawDependenciesMap = new Map<number, RawDependency[]>();

 // Pass 1: Collect all features and build the priority map
 console.log("\n📦 Pass 1: Collecting features...");

 for (const initDir of initDirs) {
  const initDirName = path.basename(initDir);
  const initIdMatch = initDirName.match(/^(\d+)/);
  const initIdStr = initIdMatch?.[1];
  const initId = initIdStr ? parseInt(initIdStr, 10) : 0;
  const initName = initDirName
   .replace(/^\d+-Initiative-/, "")
   .replace(/-/g, " ");
  const initSlug = initDirName.replace(/^\d+-Initiative-/, "");

  const initPriority = extractInitiativePriority(initDir);
  const initDeps = extractInitiativeDependencies(initDir);

  // Find features in this initiative
  const featureDirs = findFeatureDirectories(initDir);

  const initiativeFeatures: FeatureEntry[] = [];

  for (const featureDir of featureDirs) {
   const tasksJson = loadTasksJson(featureDir);
   if (!tasksJson) continue;

   const featureId = tasksJson.metadata.feature_id;
   const relativePath = path.relative(
    specDir,
    path.join(featureDir, "tasks.json"),
   );
   const featurePriority = extractFeaturePriority(featureDir);

   // Extract raw dependencies (will resolve in Pass 2)
   const rawDeps = extractFeatureDependenciesRaw(featureDir);
   rawDependenciesMap.set(featureId, rawDeps);

   // Build F# map: initiative_id-F# -> feature_id
   // Uses Feature ID (e.g., "1365-F1") not Priority for correct mapping
   // This allows us to resolve "F1" -> feature with Feature ID "1365-F1"
   const fNumber = extractFeatureFNumber(featureDir);
   if (fNumber !== null) {
    const fKey = `${initId}-${fNumber}`;
    featurePriorityMap.set(fKey, featureId);
   }

   const completedTasks = tasksJson.tasks.filter(
    (t) => t.status === "completed",
   ).length;
   const taskCount = tasksJson.tasks.length;

   totalTasks += taskCount;
   totalTasksCompleted += completedTasks;

   const featureStatus =
    completedTasks === taskCount
     ? "completed"
     : completedTasks > 0
      ? "in_progress"
      : "pending";

   // Aggregate database flags from tasks.json
   const requiresDatabase =
    tasksJson.metadata.requires_database ||
    tasksJson.tasks.some((t) => t.requires_database === true);
   const databaseTaskCount =
    tasksJson.metadata.database_tasks?.length ||
    tasksJson.tasks.filter((t) => t.requires_database === true).length;

   initiativeFeatures.push({
    id: featureId,
    initiative_id: initId,
    title: tasksJson.metadata.feature_name,
    slug: tasksJson.metadata.feature_slug,
    priority: featurePriority,
    global_priority: 0, // Will be calculated after sorting
    status: featureStatus,
    tasks_file: relativePath,
    feature_dir: featureDir,
    task_count: taskCount,
    tasks_completed: completedTasks,
    sequential_hours: tasksJson.execution.duration.sequential,
    parallel_hours: tasksJson.execution.duration.parallel,
    dependencies: [], // Will be resolved in Pass 2
    github_issue: tasksJson.github?.feature_tasks_issue || null,
    requires_database: requiresDatabase,
    database_task_count: databaseTaskCount,
   });
  }

  // Sort features within initiative by priority
  initiativeFeatures.sort((a, b) => a.priority - b.priority);

  // Add to global queue
  featureQueue.push(...initiativeFeatures);

  // Calculate initiative status
  const completedFeatures = initiativeFeatures.filter(
   (f) => f.status === "completed",
  ).length;
  const initStatus: InitiativeEntry["status"] =
   completedFeatures === initiativeFeatures.length
    ? "completed"
    : completedFeatures > 0
     ? "in_progress"
     : "pending";

  initiatives.push({
   id: initId,
   name: initName,
   slug: initSlug,
   priority: initPriority,
   status: initStatus,
   initiative_dir: initDir,
   feature_count: initiativeFeatures.length,
   features_completed: completedFeatures,
   dependencies: initDeps,
  });
 }

 // =========================================================================
 // Pass 2: Resolve internal F# references to actual feature IDs
 // =========================================================================
 console.log("🔗 Pass 2: Resolving dependencies...");

 for (const feature of featureQueue) {
  const rawDeps = rawDependenciesMap.get(feature.id);
  if (rawDeps && rawDeps.length > 0) {
   feature.dependencies = resolveFeatureDependencies(
    rawDeps,
    feature.initiative_id,
    featurePriorityMap,
   );

   if (feature.dependencies.length > 0) {
    console.log(
     `   ${feature.title}: depends on [${feature.dependencies.join(", ")}]`,
    );
   }
  }
 }

 // Sort initiatives by priority
 initiatives.sort((a, b) => a.priority - b.priority);

 // Sort feature queue: first by initiative priority, then by feature priority
 featureQueue.sort((a, b) => {
  const initA = initiatives.find((i) => i.id === a.initiative_id);
  const initB = initiatives.find((i) => i.id === b.initiative_id);
  const initPriorityA = initA?.priority || 999;
  const initPriorityB = initB?.priority || 999;

  if (initPriorityA !== initPriorityB) {
   return initPriorityA - initPriorityB;
  }
  return a.priority - b.priority;
 });

 // Assign global priorities
 featureQueue.forEach((f, index) => {
  f.global_priority = index + 1;
 });

 // Find next feature (first pending with satisfied dependencies)
 const completedFeatureIds = new Set(
  featureQueue.filter((f) => f.status === "completed").map((f) => f.id),
 );

 let nextFeatureId: number | null = null;
 for (const feature of featureQueue) {
  if (feature.status === "pending") {
   const depsComplete = feature.dependencies.every((depId) =>
    completedFeatureIds.has(depId),
   );
   if (depsComplete) {
    nextFeatureId = feature.id;
    break;
   }
  }
 }

 // Find last completed feature
 const completedFeatures = featureQueue.filter(
  (f) => f.status === "completed",
 );
 const lastCompletedFeature = completedFeatures[completedFeatures.length - 1];
 const lastCompletedFeatureId = lastCompletedFeature?.id ?? null;

 // Calculate overall status
 const featuresCompleted = featureQueue.filter(
  (f) => f.status === "completed",
 ).length;
 const initiativesCompleted = initiatives.filter(
  (i) => i.status === "completed",
 ).length;

 let overallStatus: SpecManifest["progress"]["status"] = "pending";
 if (featuresCompleted === featureQueue.length) {
  overallStatus = "completed";
 } else if (featuresCompleted > 0) {
  overallStatus = "in_progress";
 }

 // Build manifest
 const manifest: SpecManifest = {
  metadata: {
   spec_id: specId,
   spec_name: specName,
   generated_at: new Date().toISOString(),
   spec_dir: specDir,
   research_dir: path.join(specDir, "research-library"),
  },
  initiatives,
  feature_queue: featureQueue,
  progress: {
   status: overallStatus,
   initiatives_completed: initiativesCompleted,
   initiatives_total: initiatives.length,
   features_completed: featuresCompleted,
   features_total: featureQueue.length,
   tasks_completed: totalTasksCompleted,
   tasks_total: totalTasks,
   next_feature_id: nextFeatureId,
   last_completed_feature_id: lastCompletedFeatureId,
   started_at: null,
   completed_at: null,
   last_checkpoint: null,
  },
  sandbox: {
   sandbox_ids: [],
   branch_name: null,
   created_at: null,
  },
 };

 // Write manifest
 const manifestPath = path.join(specDir, "spec-manifest.json");
 fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

 // Print summary
 console.log(`\n✅ Spec manifest generated: ${manifestPath}`);
 console.log("\n" + "═".repeat(60));
 console.log(`   SPEC #${specId}: ${specName.toUpperCase()}`);
 console.log("═".repeat(60));

 console.log("\n📊 Summary:");
 console.log(`   Initiatives: ${initiatives.length}`);
 console.log(`   Features: ${featureQueue.length}`);
 console.log(`   Tasks: ${totalTasks}`);
 console.log(
  `   Completed: ${featuresCompleted}/${featureQueue.length} features`,
 );

 console.log("\n📋 Initiatives:");
 for (const init of initiatives) {
  const statusIcon =
   init.status === "completed"
    ? "✅"
    : init.status === "in_progress"
     ? "🔄"
     : "⏳";
  const depsStr =
   init.dependencies.length > 0
    ? ` (blocked by: ${init.dependencies.map((d) => `#${d}`).join(", ")})`
    : "";
  console.log(
   `   ${statusIcon} #${init.id}: ${init.name} [P${init.priority}] - ${init.features_completed}/${init.feature_count} features${depsStr}`,
  );
 }

 // Count DB features
 const dbFeatureCount = featureQueue.filter((f) => f.requires_database).length;

 console.log("\n📦 Feature Queue:");
 for (const feature of featureQueue) {
  const statusIcon =
   feature.status === "completed"
    ? "✅"
    : feature.status === "in_progress"
     ? "🔄"
     : "⏳";
  const depsStr =
   feature.dependencies.length > 0
    ? ` [blocked by: ${feature.dependencies.map((d) => `#${d}`).join(", ")}]`
    : "";
  const dbMarker = feature.requires_database ? " 🗄️" : "";
  const nextMarker = feature.id === nextFeatureId ? " ← NEXT" : "";
  console.log(
   `   ${statusIcon} [${feature.global_priority}] #${feature.id}: ${feature.title}${dbMarker}${depsStr}${nextMarker}`,
  );
 }

 if (dbFeatureCount > 0) {
  console.log(
   `\n🗄️  Database Features: ${dbFeatureCount} features require database access`,
  );
  console.log("   (These will be serialized to prevent migration conflicts)");
 }

 if (nextFeatureId) {
  console.log(`\n🎯 Next feature to implement: #${nextFeatureId}`);
 } else if (overallStatus === "completed") {
  console.log("\n🎉 All features completed!");
 } else {
  console.log("\n⚠️ No features available (check dependencies)");
 }

 console.log("\n" + "═".repeat(60));

 return manifest;
}

main().catch((error) => {
 console.error("Error:", error);
 process.exit(1);
});
