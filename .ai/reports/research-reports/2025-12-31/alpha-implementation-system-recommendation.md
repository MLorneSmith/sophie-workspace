# Alpha Implementation System: Comprehensive Recommendation

**Date**: 2025-12-31
**Author**: Claude Opus 4.5
**Topic**: Alpha Autonomous Coding Workflow - Implementation System Design

## Executive Summary

This document provides a comprehensive recommendation for developing the Alpha autonomous coding implementation system. The system consists of two parts:

1. **TypeScript Orchestrator Script** - External script using Claude Agent SDK that manages E2B sandboxes and coordinates across features
2. **`/alpha:implement` Slash Command** - Runs inside the sandbox and implements tasks for a single feature

This addresses the nested sub-agent limitation by keeping orchestration external while implementation runs inside the sandbox.

---

## Background

The Alpha Autonomous Coding workflow consists of four existing phases:
1. `/alpha:spec` - Create coding project specification
2. `/alpha:initiative-decompose` - Decompose spec into initiatives
3. `/alpha:feature-decompose` - Decompose initiative into features
4. `/alpha:task-decompose` - Decompose features into atomic tasks

The next step is to develop the implementation system that executes these decomposed tasks.

### Current Task Structure

Tasks are currently distributed across multiple files:
```
.ai/alpha/specs/1362-Spec-user-dashboard-home/
├── 1363-Initiative-dashboard-foundation/
│   ├── decomposition-state.json
│   ├── 1367-Feature-dashboard-page-grid/tasks.json  # 20 tasks
│   ├── 1368-Feature-presentation-table/tasks.json   # 12 tasks
│   ├── 1369-Feature-quick-actions/tasks.json        # 6 tasks
│   └── 1370-Feature-empty-state/tasks.json          # 5 tasks
```

### Existing Infrastructure

- **E2B Sandbox CLI** (`sandbox-cli.ts`): 2400+ line mature TypeScript implementation
- **Sandbox Template**: `slideheroes-claude-agent` with pre-cloned repo, Claude Code, VS Code Web
- **Task Schema**: Well-defined `tasks.schema.json` with execution groups, dependencies, verification commands

---

## Questions Addressed

### 1. How to Organize Tasks (Currently Distributed Across Multiple Files)?

**Recommendation**: Create a consolidated **initiative-tasks-manifest.json** that aggregates all features.

```json
{
  "initiative_id": 1363,
  "spec_id": 1362,
  "generated_at": "2026-01-01T00:00:00Z",
  "features": [
    {
      "id": 1367,
      "title": "Dashboard Page & Grid Layout",
      "priority": 1,
      "status": "pending",
      "tasks_file": "1367-Feature-dashboard-page-grid/tasks.json",
      "task_count": 20,
      "parallel_hours": 17,
      "dependencies": []
    },
    {
      "id": 1368,
      "title": "Presentation Outline Table",
      "priority": 2,
      "status": "pending",
      "tasks_file": "1368-Feature-presentation-table/tasks.json",
      "task_count": 12,
      "parallel_hours": 12,
      "dependencies": [1367]
    },
    {
      "id": 1369,
      "title": "Quick Actions Panel",
      "priority": 1,
      "status": "pending",
      "tasks_file": "1369-Feature-quick-actions/tasks.json",
      "task_count": 6,
      "parallel_hours": 8,
      "dependencies": []
    },
    {
      "id": 1370,
      "title": "Empty State System",
      "priority": 2,
      "status": "pending",
      "tasks_file": "1370-Feature-empty-state/tasks.json",
      "task_count": 5,
      "parallel_hours": 6,
      "dependencies": [1367]
    }
  ],
  "execution_plan": {
    "parallel_groups": [
      { "group": 0, "features": [1367, 1369], "description": "Foundation features - no dependencies" },
      { "group": 1, "features": [1368, 1370], "description": "Dependent features - wait for group 0" }
    ],
    "total_tasks": 43,
    "estimated_sequential_hours": 86,
    "estimated_parallel_hours": 43
  }
}
```

**Implementation**: Add `.ai/alpha/scripts/generate-initiative-manifest.ts` to generate this file from existing task files.

### 2. How to Identify and Manage Parallel Execution?

**Three levels of parallelism:**

| Level | Scope | How to Parallelize |
|-------|-------|-------------------|
| **Initiative** | Features within initiative | Use `features[].dependencies` - run features with no unmet deps in parallel |
| **Feature** | Tasks within feature | Use `execution.groups` from tasks.json - tasks in same group run in parallel |
| **Session** | Within Claude Code | Use Task tool to spawn sub-agents for independent exploration |

**Parallel execution strategy in orchestrator:**

```typescript
async function executeInitiative(manifestPath: string) {
  const manifest = await loadManifest(manifestPath);

  for (const group of manifest.execution_plan.parallel_groups) {
    // Run all features in this group in parallel
    const promises = group.features.map(featureId =>
      spawnFeatureSession(featureId, manifest)
    );

    // Wait for all features in group to complete before next group
    await Promise.all(promises);
  }
}
```

**Within `/alpha:implement`, task-level parallelism:**
- Use the Task tool with sub-agents for parallel exploration
- Independent tasks within same execution group can be explored in parallel
- Sequential dependency chains handled by group ordering in tasks.json

### 3. TypeScript or Python for Orchestrator?

**Recommendation: TypeScript**

| Factor | TypeScript | Python |
|--------|------------|--------|
| Existing infrastructure | ✅ sandbox-cli.ts is 2400+ lines, mature | ❌ sandbox_manager.py is basic (229 lines) |
| E2B SDK parity | ✅ Full feature parity | ✅ Full feature parity |
| Claude Agent SDK | ✅ Official support | ✅ Official support |
| Your codebase | ✅ Next.js/TypeScript project | ⚠️ Would add Python dependency |
| Shared types | ✅ Can import tasks.schema.json types | ❌ Would need to duplicate |
| Package ecosystem | ✅ pnpm monorepo integration | ❌ Separate virtualenv needed |
| Team familiarity | ✅ Primary language | ⚠️ Secondary |

**Strong preference for TypeScript** because:
1. Extends existing `sandbox-cli.ts` patterns and utilities
2. Shares types with the codebase (tasks.schema.json, decomposition-state.json)
3. No Python runtime dependency for your team
4. Consistent developer experience across the project
5. Can reuse existing sandbox management functions (createSandbox, setupGitCredentials, etc.)

### 4. How to Run E2E Tests in E2B Sandbox?

**Yes, E2E tests can run in E2B**, with proper configuration:

**Current template already supports Playwright:**
```dockerfile
# From template - already has Playwright deps
RUN npx playwright install --with-deps chromium
```

**Execution pattern:**
```typescript
async function runE2ETests(sandbox: Sandbox): Promise<TestResult> {
  // Start dev server first
  await sandbox.commands.run("start-dev &", { timeoutMs: 30000 });
  await waitForServer(sandbox, 3000);

  // Run E2E tests
  const result = await sandbox.commands.run(
    "pnpm --filter web-e2e test:shard1",
    {
      timeoutMs: 600000,  // 10 min for E2E
      onStdout: (data) => console.log(data)
    }
  );

  return { passed: result.exitCode === 0, output: result.stdout };
}
```

**Resource recommendation for E2E testing:**
```toml
# e2b.toml - increase resources for E2E
cpu_count = 4
memory_mb = 4096
```

**Considerations:**
- Visual tests may have pixel differences due to VM rendering - use snapshot testing with tolerance
- Run E2E tests after feature completion, not per-task
- Consider running a subset of critical path E2E tests to save time

### 5. What Validation Steps to Implement?

**Multi-layer validation strategy:**

| Phase | Validation | Implementation |
|-------|------------|----------------|
| **Pre-task** | Dependencies met | Check `blocked_by` tasks are completed in manifest |
| **Per-task** | Verification command | Run `verification_command` from task definition |
| **Post-task** | Type check | `pnpm typecheck` after each task |
| **Post-group** | Lint check | `pnpm lint` after each execution group |
| **Post-feature** | Feature acceptance | Run all tasks' verification commands + feature-level E2E |
| **Post-initiative** | Integration | Full `pnpm codecheck` + comprehensive E2E suite |

**Validation in `/alpha:implement`:**

```markdown
## Validation Protocol

After each task:
1. Run the task's `verification_command`
2. If fails: iterate up to 3 times, then mark task as blocked
3. If passes: run `pnpm typecheck` to catch regressions
4. Update task status in tasks.json

After each execution group:
1. Run `pnpm lint` to ensure code quality
2. Create git commit with group completion message
3. Push to remote

After all tasks:
1. Run `pnpm codecheck` (typecheck + lint + format)
2. Run feature-level E2E tests if defined
3. Create final commit with validation results
4. Update GitHub issue status
```

**Error handling:**
- 3 retry attempts per task before marking blocked
- Blocked tasks don't prevent parallel tasks from running
- Report blocked tasks to orchestrator for human intervention

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     LOCAL MACHINE (Host)                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │         alpha-orchestrator.ts (Claude Agent SDK)              │  │
│  │                                                                │  │
│  │  1. Load initiative manifest                                  │  │
│  │  2. Create E2B sandbox                                        │  │
│  │  3. For each parallel group:                                  │  │
│  │     └─> Spawn Claude Code session per feature                 │  │
│  │  4. Monitor progress via /sandbox progress                    │  │
│  │  5. Handle session failures/restarts                          │  │
│  │  6. Report completion to user                                 │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              │ spawn sessions                        │
│                              ▼                                       │
└─────────────────────────────────────────────────────────────────────┘
                               │
                   E2B API (spawn sandboxes)
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        E2B SANDBOX                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                Claude Code Session                             │  │
│  │                                                                │  │
│  │  /alpha:implement <feature-id>                                │  │
│  │                                                                │  │
│  │  1. Load tasks.json for feature                               │  │
│  │  2. Load research-library context                             │  │
│  │  3. For each task group (sequential):                         │  │
│  │     a. For tasks in group (can use sub-agents):               │  │
│  │        - Read task context                                    │  │
│  │        - Implement task                                       │  │
│  │        - Run verification_command                             │  │
│  │        - Update task status                                   │  │
│  │     b. Run typecheck after group                              │  │
│  │  4. Commit after each group                                   │  │
│  │  5. Report progress to .initiative-progress.json              │  │
│  │  6. Exit when complete or at 60% context                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Proposed File Structure

```
.ai/alpha/
├── scripts/
│   ├── alpha-orchestrator.ts        # Main orchestrator (Claude Agent SDK)
│   ├── generate-initiative-manifest.ts  # Aggregates tasks into manifest
│   ├── resolve-feature-paths.sh     # Existing - path resolution
│   └── list-initiative-features.sh  # Existing - feature listing
├── templates/
│   ├── tasks.schema.json            # Existing
│   ├── initiative-manifest.schema.json  # NEW - manifest schema
│   └── progress-report.schema.json  # NEW - progress reporting
└── specs/
    └── <spec-id>-<name>/
        ├── initiative-tasks-manifest.json  # NEW - aggregated manifest
        └── <initiative-id>-Initiative-*/
            ├── decomposition-state.json
            └── <feature-id>-Feature-*/
                └── tasks.json

.claude/commands/alpha/
├── spec.md              # Existing
├── initiative-decompose.md  # Existing
├── feature-decompose.md     # Existing
├── task-decompose.md        # Existing
└── implement.md             # NEW - in-sandbox implementation
```

---

## `/alpha:implement` Slash Command Design

```markdown
---
description: Implement tasks for a feature within E2B sandbox. Sixth step in Alpha autonomous coding process.
argument-hint: [feature-#]
model: opus
allowed-tools: [Read, Write, Edit, Grep, Glob, Bash, Task, TodoWrite]
---

# Alpha: Feature Implementation

Implement all tasks for a feature following the decomposed task structure.

## Context Management Strategy

**CRITICAL**: Finish work before context is 60% full.

1. Monitor context usage via token count estimates
2. Aggressively delegate to sub-agents for:
   - Code exploration (code-explorer)
   - Research (alpha-context7, alpha-perplexity)
   - Validation (Task tool for typecheck/lint)
3. Commit frequently to preserve progress
4. If approaching limit, write progress to .initiative-progress.json and exit gracefully

## Implementation Protocol

### Phase 1: Setup
1. Load feature's tasks.json
2. Load research-library files relevant to this feature
3. Use conditional-docs-router for context documentation
4. Create TodoWrite tasks from task list for visibility

### Phase 2: Execute Task Groups
For each execution group (from tasks.json execution.groups):
1. **Load task context** - Read only files listed in task.context.files
2. **Implement** - Execute task.action.verb on task.action.target
3. **Verify** - Run task.verification_command
4. **Update status** - Mark task completed in tasks.json
5. **Typecheck** - Run pnpm typecheck after each group
6. **Commit** - Git commit after each group completes

### Phase 3: Validation & Reporting
1. Run full validation (pnpm codecheck)
2. Write completion report to .initiative-progress.json
3. Push commits to origin
4. Update GitHub issue status via gh CLI

## Progress Reporting

Write progress to `.initiative-progress.json`:
```json
{
  "feature": { "issue_number": 1367, "title": "Dashboard Page" },
  "current_task": { "id": "T5", "name": "Add loader", "index": 5, "total": 20 },
  "completed_tasks": ["T1", "T2", "T3", "T4"],
  "blocked_tasks": [],
  "entries": [
    { "timestamp": "...", "type": "task_complete", "message": "T4: Created skeleton component" }
  ],
  "status": "in_progress",
  "context_usage_percent": 45
}
```

## Exit Conditions

Exit session when:
1. ✅ All tasks completed - status: "completed"
2. ⚠️ Context window 60% full - status: "context_limit" (orchestrator will resume)
3. ❌ Task fails after 3 retry attempts - status: "blocked" (mark task, continue others)
4. ❌ Timeout approaching - status: "timeout" (save progress)
```

---

## Orchestrator Script Design (`alpha-orchestrator.ts`)

```typescript
#!/usr/bin/env tsx
/**
 * Alpha Initiative Orchestrator
 *
 * Manages E2B sandboxes and Claude Code sessions to implement
 * all tasks across all features in an initiative.
 *
 * Usage:
 *   tsx alpha-orchestrator.ts <initiative-id> [--parallel 2] [--resume]
 */

import { Sandbox } from "@e2b/code-interpreter";
import * as fs from "node:fs";
import * as path from "node:path";

// Types
interface InitiativeManifest {
  initiative_id: number;
  spec_id: number;
  features: FeatureEntry[];
  execution_plan: {
    parallel_groups: ParallelGroup[];
    total_tasks: number;
    estimated_parallel_hours: number;
  };
}

interface FeatureEntry {
  id: number;
  title: string;
  priority: number;
  status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
  tasks_file: string;
  task_count: number;
  parallel_hours: number;
  dependencies: number[];
}

interface ParallelGroup {
  group: number;
  features: number[];
  description?: string;
}

interface OrchestratorState {
  initiative_id: number;
  sandbox_id: string | null;
  current_group: number;
  features: Record<number, FeatureStatus>;
  started_at: string;
  last_checkpoint: string;
}

type FeatureStatus = "pending" | "in_progress" | "completed" | "failed" | "partial";

// State management
const STATE_FILE = ".ai/alpha/orchestrator-state.json";

async function loadOrCreateState(initiativeId: number): Promise<OrchestratorState> {
  const statePath = path.join(process.cwd(), STATE_FILE);

  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
    if (state.initiative_id === initiativeId) {
      console.log("📂 Resuming from saved state");
      return state;
    }
  }

  return {
    initiative_id: initiativeId,
    sandbox_id: null,
    current_group: 0,
    features: {},
    started_at: new Date().toISOString(),
    last_checkpoint: new Date().toISOString(),
  };
}

async function saveState(state: OrchestratorState): Promise<void> {
  state.last_checkpoint = new Date().toISOString();
  fs.writeFileSync(
    path.join(process.cwd(), STATE_FILE),
    JSON.stringify(state, null, 2)
  );
}

// Main orchestration
async function orchestrateInitiative(initiativeId: number, maxParallel: number = 2) {
  // 1. Load or create state
  const state = await loadOrCreateState(initiativeId);
  const manifest = await loadManifest(initiativeId);

  console.log(`\n🚀 Starting Alpha Implementation for Initiative #${initiativeId}`);
  console.log(`   Features: ${manifest.features.length}`);
  console.log(`   Total Tasks: ${manifest.execution_plan.total_tasks}`);
  console.log(`   Estimated Hours (parallel): ${manifest.execution_plan.estimated_parallel_hours}`);

  // 2. Create or resume sandbox
  let sandbox: Sandbox;
  if (state.sandbox_id) {
    try {
      sandbox = await Sandbox.connect(state.sandbox_id, {
        apiKey: process.env.E2B_API_KEY
      });
      const isRunning = await sandbox.isRunning();
      if (isRunning) {
        console.log(`   📦 Resuming sandbox: ${state.sandbox_id}`);
      } else {
        throw new Error("Sandbox not running");
      }
    } catch {
      console.log("   ⚠️ Previous sandbox not available, creating new one");
      sandbox = await createAlphaSandbox();
      state.sandbox_id = sandbox.sandboxId;
      await saveState(state);
    }
  } else {
    sandbox = await createAlphaSandbox();
    state.sandbox_id = sandbox.sandboxId;
    await saveState(state);
    console.log(`   📦 Created sandbox: ${sandbox.sandboxId}`);
  }

  // 3. Execute parallel groups
  for (const group of manifest.execution_plan.parallel_groups) {
    if (group.group < state.current_group) {
      console.log(`   ⏭️ Skipping completed group ${group.group}`);
      continue;
    }

    console.log(`\n📦 Executing Group ${group.group}: ${group.features.length} features`);
    if (group.description) {
      console.log(`   ${group.description}`);
    }

    // Run features in parallel (up to maxParallel)
    const batches = chunk(group.features, maxParallel);

    for (const batch of batches) {
      console.log(`   🔄 Running batch: ${batch.map(f => `#${f}`).join(", ")}`);

      const sessions = batch.map(featureId =>
        runFeatureSession(sandbox, featureId, manifest, state)
      );

      const results = await Promise.allSettled(sessions);

      // Log results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const featureId = batch[i];
        if (result.status === "fulfilled") {
          console.log(`   ✅ Feature #${featureId}: ${result.value}`);
        } else {
          console.log(`   ❌ Feature #${featureId}: ${result.reason}`);
        }
      }
    }

    // Update state after group completes
    state.current_group = group.group + 1;
    await saveState(state);
  }

  // 4. Final validation
  console.log(`\n🔍 Running final validation...`);
  const validationResult = await runFinalValidation(sandbox);

  if (validationResult.passed) {
    console.log(`✅ All validations passed!`);
  } else {
    console.log(`⚠️ Validation issues found:`);
    console.log(validationResult.output);
  }

  // 5. Report results
  console.log(`\n📊 Initiative Implementation Complete!`);
  await reportResults(state, manifest);
}

async function runFeatureSession(
  sandbox: Sandbox,
  featureId: number,
  manifest: InitiativeManifest,
  state: OrchestratorState
): Promise<string> {
  const prompt = `/alpha:implement ${featureId}`;

  state.features[featureId] = "in_progress";
  await saveState(state);

  // Run Claude Code in sandbox
  const result = await sandbox.commands.run(
    `run-claude "${prompt}"`,
    {
      timeoutMs: 0,  // No timeout for long-running
      envs: {
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
      },
      onStdout: (data) => process.stdout.write(`[#${featureId}] ${data}`),
      onStderr: (data) => process.stderr.write(`[#${featureId}] ${data}`),
    }
  );

  // Check progress file for status
  const progressResult = await sandbox.commands.run(
    `cat /home/user/project/.initiative-progress.json 2>/dev/null || echo '{}'`,
    { timeoutMs: 10000 }
  );

  let progress: { status?: string } = {};
  try {
    progress = JSON.parse(progressResult.stdout || "{}");
  } catch {
    // Ignore parse errors
  }

  // Handle different completion states
  if (progress.status === "context_limit") {
    console.log(`   ⚠️ Feature #${featureId} hit context limit - will resume`);
    state.features[featureId] = "partial";
    await saveState(state);

    // Recursively resume (will continue where left off)
    return runFeatureSession(sandbox, featureId, manifest, state);
  } else if (progress.status === "completed" || result.exitCode === 0) {
    state.features[featureId] = "completed";
    await saveState(state);
    return "completed";
  } else if (progress.status === "blocked") {
    state.features[featureId] = "failed";
    await saveState(state);
    return "blocked - tasks require attention";
  } else {
    state.features[featureId] = "failed";
    await saveState(state);
    return `failed with exit code ${result.exitCode}`;
  }
}

// Helper functions
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function createAlphaSandbox(): Promise<Sandbox> {
  return Sandbox.create("slideheroes-claude-agent", {
    timeoutMs: 7200000, // 2 hours
    apiKey: process.env.E2B_API_KEY,
    envs: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
    },
  });
}

async function loadManifest(initiativeId: number): Promise<InitiativeManifest> {
  // Find manifest file by initiative ID
  const specsDir = path.join(process.cwd(), ".ai/alpha/specs");
  // Implementation would search for initiative-tasks-manifest.json
  // This is a placeholder
  throw new Error("Implement manifest loading");
}

async function runFinalValidation(sandbox: Sandbox): Promise<{ passed: boolean; output: string }> {
  const result = await sandbox.commands.run(
    "cd /home/user/project && pnpm codecheck",
    { timeoutMs: 300000 }
  );

  return {
    passed: result.exitCode === 0,
    output: result.stdout + result.stderr,
  };
}

async function reportResults(state: OrchestratorState, manifest: InitiativeManifest): Promise<void> {
  const completed = Object.values(state.features).filter(s => s === "completed").length;
  const failed = Object.values(state.features).filter(s => s === "failed").length;
  const total = manifest.features.length;

  console.log(`\n📈 Summary:`);
  console.log(`   Completed: ${completed}/${total}`);
  console.log(`   Failed: ${failed}/${total}`);
  console.log(`   Started: ${state.started_at}`);
  console.log(`   Finished: ${new Date().toISOString()}`);
}

// CLI
const args = process.argv.slice(2);
const initiativeId = parseInt(args[0], 10);
const maxParallel = args.includes("--parallel")
  ? parseInt(args[args.indexOf("--parallel") + 1], 10)
  : 2;

if (isNaN(initiativeId)) {
  console.error("Usage: tsx alpha-orchestrator.ts <initiative-id> [--parallel N]");
  process.exit(1);
}

orchestrateInitiative(initiativeId, maxParallel).catch(console.error);
```

---

## Key Design Decisions

### 1. Session Management
- **One sandbox per initiative** (not per feature) - reduces overhead and startup time
- **Multiple Claude Code sessions** within same sandbox - shares git state
- **Progress file** (`.initiative-progress.json`) enables resume after context limit

### 2. Context Management
- **60% context limit** triggers graceful exit with state preservation
- **Aggressive sub-agent delegation** preserves main session context
- **Frequent commits** prevent work loss on any failure

### 3. Parallelism Strategy
- **Feature-level parallelism** managed by orchestrator (external to sandbox)
- **Task-level parallelism** through sub-agents in `/alpha:implement`
- **Configurable max parallel** (default 2) to avoid E2B resource contention
- **Dependency-aware grouping** ensures correct execution order

### 4. Validation Layers
- **Per-task**: `verification_command` from task definition
- **Per-group**: `pnpm typecheck` after each execution group
- **Per-feature**: All verification commands pass
- **Per-initiative**: Full `pnpm codecheck` + E2E tests

### 5. Error Handling
- **3 retry attempts** per task before marking blocked
- **Partial completion** tracked and resumed automatically
- **Failed features** don't block parallel features in same group
- **State persisted** after each group for crash recovery

---

## Implementation Roadmap

| Phase | Deliverable | Effort | Priority |
|-------|-------------|--------|----------|
| **1** | `generate-initiative-manifest.ts` script | 2-3 hours | High |
| **2** | `initiative-manifest.schema.json` validation | 1 hour | High |
| **3** | `/alpha:implement` slash command | 4-6 hours | High |
| **4** | `alpha-orchestrator.ts` basic version | 4-6 hours | High |
| **5** | Progress reporting & resume capability | 2-3 hours | Medium |
| **6** | E2E test integration | 2-3 hours | Medium |
| **7** | GitHub issue status updates | 1-2 hours | Low |
| **8** | Dashboard/monitoring UI | 4-6 hours | Low |

**Total estimated effort**: 20-30 hours

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Context window exhaustion | 60% limit trigger, aggressive sub-agent delegation |
| Sandbox timeout | 2-hour timeout, progress persistence, auto-resume |
| Task verification failures | 3 retry attempts, continue with other tasks |
| E2B rate limits | Exponential backoff, limit parallel sandboxes |
| Lost work on crash | Git commits after each group, state file persistence |
| Dependency cycles | Validated during manifest generation |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Task completion rate | >95% |
| Average time per task | <15 minutes |
| Context limit hits | <20% of sessions |
| Retry success rate | >80% |
| E2E test pass rate | >90% |

---

## Next Steps

1. **Review and approve** this architecture
2. **Create `generate-initiative-manifest.ts`** to aggregate tasks from feature directories
3. **Create `/alpha:implement.md`** slash command for in-sandbox implementation
4. **Create `alpha-orchestrator.ts`** orchestrator script for external coordination
5. **Test with 1362-Spec-user-dashboard-home** initiative (43 tasks across 4 features)

---

## Appendix: Claude Agent SDK Patterns

### Starting a Session
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const session = query({
  prompt: "/alpha:implement 1367",
  options: {
    allowedTools: ["Read", "Write", "Edit", "Bash"],
    permissionMode: "acceptEdits",
    model: "claude-opus-4-5",
    cwd: "/home/user/project"
  }
});

for await (const message of session) {
  if (message.type === 'system' && message.subtype === 'init') {
    console.log(`Session ID: ${message.session_id}`);
  }
  if (message.type === 'result') {
    console.log(`Completed in ${message.duration_ms}ms, cost: $${message.total_cost_usd}`);
  }
}
```

### Progress Monitoring with Hooks
```typescript
const progressTracker: HookCallback = async (input) => {
  if (input.hook_event_name === 'PreToolUse') {
    console.log(`Tool: ${input.tool_name}`);
  }
  return {};
};

const session = query({
  prompt: "task",
  options: {
    hooks: {
      PreToolUse: [{ hooks: [progressTracker] }]
    }
  }
});
```

### Session Resumption
```typescript
// Resume from previous session
const resumed = query({
  prompt: "Continue implementation",
  options: {
    resume: "previous-session-id"
  }
});
```

---

## References

- Existing E2B sandbox CLI: `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts`
- Task schema: `.ai/alpha/templates/tasks.schema.json`
- Decomposition state example: `.ai/alpha/specs/1362-Spec-user-dashboard-home/1363-Initiative-dashboard-foundation/decomposition-state.json`
- Claude Agent SDK documentation: https://platform.claude.com/docs/en/agent-sdk/
