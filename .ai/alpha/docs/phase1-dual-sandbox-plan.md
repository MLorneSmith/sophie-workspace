# Phase 1: Dual-Sandbox Orchestration Implementation Plan

## Overview

Transform the single-sandbox orchestrator into a dual-sandbox system that can execute independent features in parallel, reducing implementation time by ~50%.

### Current State (Initiative #1363)

| Feature | Tasks | Parallel Hours | Dependencies |
|---------|-------|----------------|--------------|
| #1367 Dashboard Page & Grid | 20 | 17h | None |
| #1368 Presentation Table | 12 | 12h | None |
| #1369 Quick Actions Panel | 6 | 8h | None |
| #1370 Empty State System | 5 | 6h | None |

**Current**: Sequential execution = 43h (all features run one after another in single sandbox)
**With 2 Sandboxes**: ~23h (longest sandbox determines total time)

### Optimal Assignment for Initiative #1363

```
Sandbox A (23h):          Sandbox B (20h):
├── #1367 (17h, 20 tasks) ├── #1368 (12h, 12 tasks)
└── #1370 (6h, 5 tasks)   └── #1369 (8h, 6 tasks)
    Total: 25 tasks           Total: 18 tasks
```

**Improvement**: 43h → 23h = **47% time reduction**

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         alpha-orchestrator.ts                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SandboxPool (NEW)                               │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  sandboxes: Map<sandboxId, SandboxInstance>                         │   │
│  │  assignments: Map<featureId, sandboxId>                             │   │
│  │                                                                     │   │
│  │  + createPool(count: 2): Promise<void>                              │   │
│  │  + assignFeatures(features: Feature[]): Assignment[]                │   │
│  │  + executeInParallel(assignments: Assignment[]): Promise<Results>   │   │
│  │  + mergeAllBranches(targetBranch: string): Promise<void>            │   │
│  │  + cleanup(): Promise<void>                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐                      │
│  │    Sandbox A         │    │    Sandbox B         │                      │
│  │    ────────────      │    │    ────────────      │                      │
│  │    Branch: sbx-a     │    │    Branch: sbx-b     │                      │
│  │    Features: [...]   │    │    Features: [...]   │                      │
│  │    Status: running   │    │    Status: running   │                      │
│  └──────────────────────┘    └──────────────────────┘                      │
│              │                          │                                   │
│              └──────────┬───────────────┘                                   │
│                         ▼                                                   │
│              ┌──────────────────────┐                                       │
│              │   Merge Coordinator  │                                       │
│              │   (runs locally)     │                                       │
│              └──────────────────────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Branch Strategy

```
dev (base)
 │
 ├── alpha/init-1363-sbx-a  ← Sandbox A works here
 │
 ├── alpha/init-1363-sbx-b  ← Sandbox B works here
 │
 └── alpha/init-1363        ← Final merged branch (created after merge)
```

### Merge Flow

```
Phase 1: Parallel Execution
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Sandbox A                      Sandbox B                       │
│  ──────────                     ──────────                      │
│  git checkout -b sbx-a          git checkout -b sbx-b           │
│       │                              │                          │
│       ▼                              ▼                          │
│  Implement #1367               Implement #1368                  │
│       │                              │                          │
│       ▼                              ▼                          │
│  Implement #1370               Implement #1369                  │
│       │                              │                          │
│       ▼                              ▼                          │
│  git push origin sbx-a         git push origin sbx-b            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Phase 2: Local Merge (on orchestrator machine)
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  git fetch origin                                               │
│  git checkout -b alpha/init-1363 origin/dev                     │
│  git merge origin/alpha/init-1363-sbx-a --no-edit               │
│  git merge origin/alpha/init-1363-sbx-b --no-edit               │
│  git push origin alpha/init-1363                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Add Types for Multi-Sandbox Support

**File**: `.ai/alpha/scripts/alpha-orchestrator.ts`

```typescript
// NEW TYPES (add after existing types ~line 125)

interface SandboxInstance {
  sandbox: Sandbox;
  id: string;
  branch: string;
  status: 'creating' | 'ready' | 'busy' | 'completed' | 'failed';
  assignedFeatures: number[];
  completedFeatures: number[];
  error?: string;
}

interface FeatureAssignment {
  featureId: number;
  sandboxId: string;
  estimatedHours: number;
}

interface SandboxPool {
  instances: Map<string, SandboxInstance>;
  initiativeId: number;
  baseBranch: string;
}

interface ParallelExecutionResult {
  sandboxId: string;
  featureResults: ProgressReport[];
  branch: string;
  success: boolean;
  error?: string;
}
```

### Task 2: Create Sandbox Pool Manager

**File**: `.ai/alpha/scripts/alpha-orchestrator.ts`

Add new class after utilities section (~line 1300):

```typescript
// ============================================================================
// Sandbox Pool Management (Phase 1: Dual Sandbox)
// ============================================================================

class SandboxPoolManager {
  private pool: SandboxPool;
  private manifest: InitiativeManifest;
  private timeout: number;

  constructor(manifest: InitiativeManifest, timeout: number) {
    this.manifest = manifest;
    this.timeout = timeout;
    this.pool = {
      instances: new Map(),
      initiativeId: manifest.metadata.initiative_id,
      baseBranch: 'dev',
    };
  }

  /**
   * Create N sandboxes in parallel.
   */
  async createPool(count: number = 2): Promise<void> {
    console.log(`\n📦 Creating sandbox pool (${count} sandboxes)...`);

    const createPromises = Array.from({ length: count }, (_, i) =>
      this.createSandboxInstance(`sbx-${String.fromCharCode(97 + i)}`) // sbx-a, sbx-b
    );

    const results = await Promise.allSettled(createPromises);

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(`   ❌ Failed to create sandbox: ${result.reason}`);
      }
    }

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    console.log(`   ✅ Created ${successCount}/${count} sandboxes`);

    if (successCount === 0) {
      throw new Error('Failed to create any sandboxes');
    }
  }

  /**
   * Create a single sandbox instance with its own branch.
   */
  private async createSandboxInstance(suffix: string): Promise<SandboxInstance> {
    const branchName = `alpha/init-${this.pool.initiativeId}-${suffix}`;

    console.log(`   Creating sandbox ${suffix}...`);

    const sandbox = await Sandbox.create(TEMPLATE_ALIAS, {
      timeoutMs: this.timeout * 1000,
      apiKey: E2B_API_KEY,
      envs: getAllEnvVars(),
    });

    console.log(`   ${suffix}: ID=${sandbox.sandboxId}`);

    // Setup git
    if (GITHUB_TOKEN) {
      await setupGitCredentials(sandbox);
    }

    // Pull latest and create branch
    await sandbox.commands.run(
      `cd ${WORKSPACE_DIR} && git fetch origin && git checkout dev && git pull origin dev`,
      { timeoutMs: 120000 }
    );

    await sandbox.commands.run(
      `cd ${WORKSPACE_DIR} && git checkout -b "${branchName}"`,
      { timeoutMs: 30000 }
    );

    // Verify dependencies
    const checkResult = await sandbox.commands.run(
      `cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
      { timeoutMs: 10000 }
    );

    if (checkResult.stdout.trim() === 'missing') {
      console.log(`   ${suffix}: Installing dependencies...`);
      await sandbox.commands.run(
        `cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
        { timeoutMs: 600000 }
      );
    }

    const instance: SandboxInstance = {
      sandbox,
      id: suffix,
      branch: branchName,
      status: 'ready',
      assignedFeatures: [],
      completedFeatures: [],
    };

    this.pool.instances.set(suffix, instance);
    return instance;
  }

  /**
   * Assign features to sandboxes using load balancing by estimated hours.
   */
  assignFeatures(features: FeatureEntry[]): FeatureAssignment[] {
    const assignments: FeatureAssignment[] = [];
    const sandboxLoads = new Map<string, number>();

    // Initialize loads
    for (const id of this.pool.instances.keys()) {
      sandboxLoads.set(id, 0);
    }

    // Sort features by hours descending (assign largest first for better balance)
    const sortedFeatures = [...features].sort(
      (a, b) => b.parallel_hours - a.parallel_hours
    );

    for (const feature of sortedFeatures) {
      // Find sandbox with lowest current load
      let minLoad = Infinity;
      let targetSandbox = '';

      for (const [sandboxId, load] of sandboxLoads) {
        if (load < minLoad) {
          minLoad = load;
          targetSandbox = sandboxId;
        }
      }

      // Assign feature
      assignments.push({
        featureId: feature.id,
        sandboxId: targetSandbox,
        estimatedHours: feature.parallel_hours,
      });

      // Update load
      sandboxLoads.set(
        targetSandbox,
        (sandboxLoads.get(targetSandbox) || 0) + feature.parallel_hours
      );

      // Update instance
      const instance = this.pool.instances.get(targetSandbox);
      if (instance) {
        instance.assignedFeatures.push(feature.id);
      }
    }

    // Log assignments
    console.log('\n📋 Feature Assignments:');
    for (const [sandboxId, instance] of this.pool.instances) {
      const load = sandboxLoads.get(sandboxId) || 0;
      console.log(`   ${sandboxId}: Features ${instance.assignedFeatures.join(', ')} (${load}h)`);
    }

    return assignments;
  }

  /**
   * Execute features in parallel across all sandboxes.
   */
  async executeInParallel(): Promise<ParallelExecutionResult[]> {
    console.log('\n🚀 Starting parallel execution...');

    const executionPromises: Promise<ParallelExecutionResult>[] = [];

    for (const [sandboxId, instance] of this.pool.instances) {
      if (instance.assignedFeatures.length === 0) continue;

      executionPromises.push(
        this.executeSandboxFeatures(instance)
      );
    }

    const results = await Promise.all(executionPromises);
    return results;
  }

  /**
   * Execute all assigned features in a single sandbox sequentially.
   */
  private async executeSandboxFeatures(
    instance: SandboxInstance
  ): Promise<ParallelExecutionResult> {
    instance.status = 'busy';
    const featureResults: ProgressReport[] = [];

    console.log(`\n   ┌── Sandbox ${instance.id} starting ──────────────────────`);

    for (const featureId of instance.assignedFeatures) {
      const result = await runFeatureImplementation(
        instance.sandbox,
        this.manifest,
        featureId
      );

      featureResults.push(result);

      if (result.status === 'completed') {
        instance.completedFeatures.push(featureId);
      }

      // Handle resource exhaustion
      if (result.status === 'resource_exhausted') {
        console.log(`   ${instance.id}: Feature #${featureId} hit OOM, recovering...`);
        const recovered = await waitForSandboxRecovery(instance.sandbox);
        if (recovered) {
          // Retry
          const retryResult = await runFeatureImplementation(
            instance.sandbox,
            this.manifest,
            featureId
          );
          featureResults[featureResults.length - 1] = retryResult;
          if (retryResult.status === 'completed') {
            instance.completedFeatures.push(featureId);
          }
        }
      }
    }

    // Push branch
    console.log(`   ${instance.id}: Pushing branch ${instance.branch}...`);
    await instance.sandbox.commands.run(
      `cd ${WORKSPACE_DIR} && git push -u origin "${instance.branch}"`,
      { timeoutMs: 120000 }
    );

    instance.status = 'completed';
    console.log(`   └── Sandbox ${instance.id} completed ──────────────────────\n`);

    return {
      sandboxId: instance.id,
      featureResults,
      branch: instance.branch,
      success: featureResults.every(r => r.status === 'completed'),
    };
  }

  /**
   * Get URLs for all sandboxes.
   */
  getReviewUrls(): { sandboxId: string; vscode: string; devServer: string }[] {
    const urls: { sandboxId: string; vscode: string; devServer: string }[] = [];

    for (const [sandboxId, instance] of this.pool.instances) {
      const vscodeHost = instance.sandbox.getHost(VSCODE_PORT);
      const devServerHost = instance.sandbox.getHost(DEV_SERVER_PORT);

      urls.push({
        sandboxId,
        vscode: `https://${vscodeHost}`,
        devServer: `https://${devServerHost}`,
      });
    }

    return urls;
  }

  /**
   * Start VS Code Web on all sandboxes.
   */
  async startVSCodeOnAll(): Promise<void> {
    console.log('\n🚀 Starting VS Code Web on all sandboxes...');

    for (const [sandboxId, instance] of this.pool.instances) {
      instance.sandbox.commands
        .run('nohup start-vscode > /tmp/vscode.log 2>&1 &', { timeoutMs: 5000 })
        .catch(() => {});
    }

    await sleep(5000);

    for (const [sandboxId, instance] of this.pool.instances) {
      const host = instance.sandbox.getHost(VSCODE_PORT);
      console.log(`   ${sandboxId}: https://${host}`);
    }
  }

  /**
   * Get all sandbox branches that need to be merged.
   */
  getBranches(): string[] {
    return Array.from(this.pool.instances.values())
      .filter(i => i.status === 'completed')
      .map(i => i.branch);
  }

  /**
   * Cleanup all sandboxes.
   */
  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up sandboxes...');
    for (const [sandboxId, instance] of this.pool.instances) {
      try {
        await instance.sandbox.kill();
        console.log(`   ${sandboxId}: killed`);
      } catch (error) {
        console.log(`   ${sandboxId}: already stopped`);
      }
    }
  }
}
```

### Task 3: Create Local Merge Coordinator

**File**: `.ai/alpha/scripts/alpha-orchestrator.ts`

Add after SandboxPoolManager:

```typescript
// ============================================================================
// Local Git Merge Coordinator
// ============================================================================

/**
 * Merge all sandbox branches into a single target branch.
 * Runs on the local machine (orchestrator), not in sandboxes.
 */
async function mergeAllBranches(
  branches: string[],
  targetBranch: string,
  projectRoot: string
): Promise<{ success: boolean; conflicts: string[] }> {
  console.log(`\n🔀 Merging ${branches.length} branches into ${targetBranch}...`);

  const { execSync } = await import('child_process');
  const conflicts: string[] = [];

  try {
    // Fetch all remote branches
    console.log('   Fetching remote branches...');
    execSync('git fetch origin', { cwd: projectRoot, stdio: 'pipe' });

    // Create target branch from dev
    console.log(`   Creating target branch: ${targetBranch}`);
    try {
      execSync(`git branch -D ${targetBranch}`, { cwd: projectRoot, stdio: 'pipe' });
    } catch {
      // Branch doesn't exist, that's fine
    }
    execSync(`git checkout -b ${targetBranch} origin/dev`, { cwd: projectRoot, stdio: 'pipe' });

    // Merge each sandbox branch
    for (const branch of branches) {
      console.log(`   Merging ${branch}...`);
      try {
        execSync(
          `git merge origin/${branch} --no-edit -m "Merge ${branch} into ${targetBranch}"`,
          { cwd: projectRoot, stdio: 'pipe' }
        );
        console.log(`   ✅ ${branch} merged successfully`);
      } catch (error) {
        // Check if it's a conflict
        const status = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf-8' });
        if (status.includes('UU ') || status.includes('AA ') || status.includes('DD ')) {
          console.log(`   ⚠️ ${branch} has conflicts`);
          conflicts.push(branch);
          // Abort this merge
          execSync('git merge --abort', { cwd: projectRoot, stdio: 'pipe' });
        } else {
          throw error;
        }
      }
    }

    // Push if no conflicts
    if (conflicts.length === 0) {
      console.log(`   Pushing ${targetBranch} to origin...`);
      execSync(`git push -u origin ${targetBranch}`, { cwd: projectRoot, stdio: 'pipe' });
      console.log(`   ✅ All branches merged and pushed`);
    }

    // Return to dev
    execSync('git checkout dev', { cwd: projectRoot, stdio: 'pipe' });

    return { success: conflicts.length === 0, conflicts };
  } catch (error) {
    console.error(`   ❌ Merge failed: ${error}`);
    // Try to recover
    try {
      execSync('git merge --abort', { cwd: projectRoot, stdio: 'pipe' });
    } catch {}
    try {
      execSync('git checkout dev', { cwd: projectRoot, stdio: 'pipe' });
    } catch {}
    return { success: false, conflicts: ['FATAL_ERROR'] };
  }
}
```

### Task 4: Modify Main Orchestration Function

**File**: `.ai/alpha/scripts/alpha-orchestrator.ts`

Replace the main `orchestrate` function with parallel-aware version:

```typescript
async function orchestrate(options: OrchestratorOptions): Promise<void> {
  // Skip environment check for dry-run
  if (!options.dryRun) {
    checkEnvironment();
  }

  const projectRoot = findProjectRoot();
  const initDir = findInitiativeDir(projectRoot, options.initiativeId);

  if (!initDir) {
    console.error(`Initiative #${options.initiativeId} not found`);
    process.exit(1);
  }

  const manifest = loadManifest(initDir);
  if (!manifest) {
    console.error('Initiative manifest not found');
    process.exit(1);
  }

  // Print header
  console.log('═'.repeat(70));
  console.log('   ALPHA INITIATIVE ORCHESTRATOR (Dual Sandbox)');
  console.log('═'.repeat(70));
  console.log(`\n📊 Initiative #${manifest.metadata.initiative_id}: ${manifest.metadata.initiative_name}`);
  console.log(`   Features: ${manifest.execution_plan.total_features}`);
  console.log(`   Tasks: ${manifest.execution_plan.total_tasks}`);
  console.log(`   Mode: ${options.maxParallel} parallel sandboxes`);

  if (options.dryRun) {
    printDryRunPlan(manifest, options.maxParallel);
    return;
  }

  // Determine sandbox count (Phase 1: max 2)
  const sandboxCount = Math.min(options.maxParallel, 2);

  // Create sandbox pool
  const pool = new SandboxPoolManager(manifest, options.timeout);
  await pool.createPool(sandboxCount);

  // Start VS Code on all sandboxes
  await pool.startVSCodeOnAll();

  // Print sandbox info
  console.log('\n' + '═'.repeat(70));
  console.log('   SANDBOXES READY');
  console.log('═'.repeat(70));
  const urls = pool.getReviewUrls();
  for (const { sandboxId, vscode } of urls) {
    console.log(`   ${sandboxId}: ${vscode}`);
  }

  // Process groups
  manifest.progress.status = 'in_progress';
  manifest.progress.started_at = new Date().toISOString();
  saveManifest(manifest);

  console.log('\n' + '═'.repeat(70));
  console.log('   IMPLEMENTATION');
  console.log('═'.repeat(70));

  for (const group of manifest.execution_plan.parallel_groups) {
    console.log(`\n📦 Group ${group.group}: ${group.description}`);

    // Get pending features in this group
    const pendingFeatures = manifest.features.filter(
      f => group.feature_ids.includes(f.id) && f.status !== 'completed'
    );

    if (pendingFeatures.length === 0) {
      console.log('   All features completed');
      continue;
    }

    // Assign features to sandboxes
    pool.assignFeatures(pendingFeatures);

    // Execute in parallel
    const results = await pool.executeInParallel();

    // Update manifest with results
    for (const result of results) {
      for (const featureResult of result.featureResults) {
        const feature = manifest.features.find(f => f.id === featureResult.feature_id);
        if (feature) {
          feature.status = featureResult.status as FeatureEntry['status'];
          feature.tasks_completed = featureResult.tasks_completed;
          if (featureResult.status === 'completed') {
            manifest.progress.features_completed++;
          }
          manifest.progress.tasks_completed += featureResult.tasks_completed;
        }
      }
    }

    saveManifest(manifest);

    // Merge branches after group completes
    const branches = pool.getBranches();
    if (branches.length > 0) {
      const targetBranch = `alpha/initiative-${manifest.metadata.initiative_id}`;
      const mergeResult = await mergeAllBranches(branches, targetBranch, projectRoot);

      if (!mergeResult.success) {
        console.log('   ⚠️ Merge conflicts detected:');
        for (const conflict of mergeResult.conflicts) {
          console.log(`      - ${conflict}`);
        }
        console.log('   Manual merge required');
      }

      manifest.sandbox.branch_name = targetBranch;
      saveManifest(manifest);
    }

    manifest.progress.current_group = group.group + 1;
  }

  // Final summary
  printSummary(manifest, pool.getReviewUrls());

  // Cleanup
  await pool.cleanup();
}

function printDryRunPlan(manifest: InitiativeManifest, sandboxCount: number): void {
  console.log('\n🔍 DRY RUN - Execution Plan:');

  // Simulate assignment
  const features = [...manifest.features].sort((a, b) => b.parallel_hours - a.parallel_hours);
  const sandboxLoads = Array.from({ length: sandboxCount }, () => ({ features: [] as number[], hours: 0 }));

  for (const feature of features) {
    // Find sandbox with lowest load
    let minIdx = 0;
    for (let i = 1; i < sandboxLoads.length; i++) {
      if (sandboxLoads[i].hours < sandboxLoads[minIdx].hours) {
        minIdx = i;
      }
    }
    sandboxLoads[minIdx].features.push(feature.id);
    sandboxLoads[minIdx].hours += feature.parallel_hours;
  }

  for (let i = 0; i < sandboxLoads.length; i++) {
    const id = String.fromCharCode(97 + i);
    console.log(`\n   Sandbox ${id} (${sandboxLoads[i].hours}h):`);
    for (const featureId of sandboxLoads[i].features) {
      const feature = manifest.features.find(f => f.id === featureId);
      if (feature) {
        console.log(`      #${feature.id}: ${feature.title} (${feature.parallel_hours}h)`);
      }
    }
  }

  const maxHours = Math.max(...sandboxLoads.map(s => s.hours));
  const sequentialHours = manifest.execution_plan.duration.sequential_hours;
  const savings = Math.round((1 - maxHours / sequentialHours) * 100);

  console.log(`\n   📊 Estimated Duration:`);
  console.log(`      Sequential: ${sequentialHours}h`);
  console.log(`      Parallel (${sandboxCount} sandboxes): ${maxHours}h`);
  console.log(`      Time saved: ${savings}%`);
}

function printSummary(
  manifest: InitiativeManifest,
  urls: { sandboxId: string; vscode: string; devServer: string }[]
): void {
  const completed = manifest.features.filter(f => f.status === 'completed').length;
  const failed = manifest.features.filter(f => f.status === 'failed').length;

  console.log('\n' + '═'.repeat(70));
  console.log('   SUMMARY');
  console.log('═'.repeat(70));

  console.log('\n   📊 Results:');
  console.log(`      Features: ${completed}/${manifest.execution_plan.total_features} completed`);
  console.log(`      Failed: ${failed}`);
  console.log(`      Tasks: ${manifest.progress.tasks_completed}/${manifest.progress.tasks_total}`);

  console.log('\n   🔗 Review URLs:');
  for (const { sandboxId, vscode } of urls) {
    console.log(`      ${sandboxId}: ${vscode}`);
  }

  console.log(`\n   🌿 Merged Branch: ${manifest.sandbox.branch_name}`);

  if (manifest.progress.started_at) {
    const duration = Math.round(
      (Date.now() - new Date(manifest.progress.started_at).getTime()) / 60000
    );
    console.log(`\n   ⏱️ Duration: ${duration} minutes`);
  }

  console.log('\n' + '═'.repeat(70));

  if (failed > 0) {
    console.log('\n   ⚠️ Some features failed. Review branches and re-run with --resume');
  } else {
    console.log('\n   ✅ Initiative implementation complete!');
  }
}
```

### Task 5: Update CLI Options

**File**: `.ai/alpha/scripts/alpha-orchestrator.ts`

Update `parseArgs` and help:

```typescript
function parseArgs(): OrchestratorOptions {
  const args = process.argv.slice(2);
  const options: OrchestratorOptions = {
    initiativeId: 0,
    maxParallel: 2,  // Default to 2 sandboxes in Phase 1
    resume: false,
    timeout: 3600,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if ((arg === '--parallel' || arg === '-p') && args[i + 1]) {
      options.maxParallel = Math.min(parseInt(args[i + 1], 10), 2); // Cap at 2 for Phase 1
      i++;
    } else if (arg === '--resume') {
      options.resume = true;
    } else if (arg === '--timeout' && args[i + 1]) {
      options.timeout = parseInt(args[i + 1], 10);
      i++;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--single') {
      options.maxParallel = 1; // Force single sandbox mode
    } else if (!arg.startsWith('--') && !options.initiativeId) {
      options.initiativeId = parseInt(arg, 10);
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
Alpha Initiative Orchestrator (Phase 1: Dual Sandbox)

Usage:
  tsx alpha-orchestrator.ts <initiative-id> [options]

Options:
  --parallel <n>, -p  Number of parallel sandboxes (default: 2, max: 2)
  --single            Force single sandbox mode (equivalent to -p 1)
  --resume            Resume from previous state
  --timeout <s>       Sandbox timeout in seconds (default: 3600)
  --dry-run           Show execution plan without running

Examples:
  tsx alpha-orchestrator.ts 1363                  # Default: 2 sandboxes
  tsx alpha-orchestrator.ts 1363 --dry-run        # Preview assignment
  tsx alpha-orchestrator.ts 1363 --single         # Single sandbox mode
  tsx alpha-orchestrator.ts 1363 -p 1             # Same as --single
`);
}
```

### Task 6: Update Manifest Schema

**File**: `.ai/alpha/templates/initiative-manifest.schema.json`

Add multi-sandbox tracking:

```json
{
  "sandbox": {
    "type": "object",
    "properties": {
      "sandbox_id": { "type": ["string", "null"] },
      "branch_name": { "type": ["string", "null"] },
      "vscode_url": { "type": ["string", "null"] },
      "dev_server_url": { "type": ["string", "null"] },
      "created_at": { "type": ["string", "null"] },
      "mode": {
        "type": "string",
        "enum": ["single", "dual"],
        "default": "single"
      },
      "instances": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "sandbox_id": { "type": "string" },
            "branch": { "type": "string" },
            "assigned_features": { "type": "array", "items": { "type": "number" } },
            "completed_features": { "type": "array", "items": { "type": "number" } },
            "status": { "type": "string" }
          }
        }
      }
    }
  }
}
```

---

## Testing Plan

### Test 1: Dry Run Verification

```bash
# Verify assignment algorithm without creating sandboxes
tsx .ai/alpha/scripts/alpha-orchestrator.ts 1363 --dry-run

# Expected output:
# Sandbox a (23h):
#    #1367: Dashboard Page & Grid Layout (17h)
#    #1370: Empty State System (6h)
# Sandbox b (20h):
#    #1368: Presentation Outline Table (12h)
#    #1369: Quick Actions Panel (8h)
```

### Test 2: Single Sandbox Fallback

```bash
# Verify single-sandbox mode still works
tsx .ai/alpha/scripts/alpha-orchestrator.ts 1363 --single --dry-run
```

### Test 3: Dual Sandbox Execution

```bash
# Full execution with 2 sandboxes
tsx .ai/alpha/scripts/alpha-orchestrator.ts 1363
```

### Test 4: Merge Conflict Handling

Create a test scenario where two features modify the same file:
1. Manually create conflicting changes in sandbox branches
2. Run merge coordinator
3. Verify conflict is detected and reported

---

## Rollback Plan

If Phase 1 has issues, the `--single` flag provides immediate fallback to original behavior:

```bash
# If dual sandbox has problems, use single mode
tsx .ai/alpha/scripts/alpha-orchestrator.ts 1363 --single
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time reduction | 40-50% | Compare single vs dual execution time |
| Merge success rate | >95% | Track merge conflicts |
| Resource efficiency | <90% CPU/RAM per sandbox | Monitor E2B metrics |
| Feature completion | Same as single sandbox | Compare completion rates |

---

## Future Phases (Out of Scope)

### Phase 2: Dynamic Pool
- Configurable 3+ sandboxes
- Auto-scaling based on feature count
- Parallel merge with conflict resolution

### Phase 3: Smart Assignment
- File overlap analysis at decomposition time
- Automatic conflict risk scoring
- Feature grouping optimization

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `.ai/alpha/scripts/alpha-orchestrator.ts` | Modify | Add SandboxPoolManager, merge coordinator |
| `.ai/alpha/templates/initiative-manifest.schema.json` | Modify | Add multi-sandbox fields |
| `.ai/alpha/docs/phase1-dual-sandbox-plan.md` | Create | This document |

---

## Estimated Implementation Time

| Task | Hours |
|------|-------|
| Task 1: Add types | 0.5 |
| Task 2: SandboxPoolManager | 3 |
| Task 3: Merge coordinator | 2 |
| Task 4: Modify orchestrate() | 2 |
| Task 5: Update CLI | 0.5 |
| Task 6: Schema update | 0.5 |
| Testing | 2 |
| **Total** | **10.5h** |
