# Intra-Sandbox Parallelization Analysis

## Executive Summary

**Question**: Can we add further parallelization within a sandbox by using multiple sub-agents simultaneously?

**Answer**: Yes, but with significant caveats. The Task tool supports launching multiple sub-agents in parallel within a single Claude Code session. However, the benefits are constrained by file conflicts, context limits, and coordination overhead.

**Recommendation**: Implement **Task-Level Parallelism** for tasks within the same execution group that operate on independent files. Expected speedup: 20-40% within a feature, compounding with existing dual-sandbox parallelism.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CURRENT PARALLELISM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Orchestrator (Local)                                                   │
│       │                                                                 │
│       ├──→ Sandbox A ──→ Feature #1 ──→ Tasks T1→T2→T3 (sequential)    │
│       │                  Feature #2 ──→ Tasks T4→T5    (sequential)    │
│       │                                                                 │
│       └──→ Sandbox B ──→ Feature #3 ──→ Tasks T6→T7→T8 (sequential)    │
│                         Feature #4 ──→ Tasks T9→T10   (sequential)    │
│                                                                         │
│  PARALLEL: Features across sandboxes                                    │
│  SEQUENTIAL: Tasks within features                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Parallelization Opportunities

### Option 1: Task-Level Parallelism (Recommended)

**Concept**: Within `/alpha:implement`, use the Task tool to spawn multiple sub-agents for independent tasks in the same execution group.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROPOSED: TASK-LEVEL PARALLELISM                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  /alpha:implement Feature #1367                                         │
│       │                                                                 │
│       │  Group 1: Foundation (no deps)                                  │
│       ├──→ Task tool: T1 (types)        ─┐                              │
│       ├──→ Task tool: T2 (loader)       ─┼─→ Wait all ─→ Commit        │
│       └──→ Task tool: T3 (skeleton)     ─┘                              │
│                                                                         │
│       │  Group 2: Components (depends on Group 1)                       │
│       ├──→ Task tool: T4 (card.tsx)     ─┐                              │
│       └──→ Task tool: T5 (grid.tsx)     ─┼─→ Wait all ─→ Commit        │
│                                                 ─┘                      │
│                                                                         │
│  PARALLEL: Tasks within same execution group                            │
│  SEQUENTIAL: Execution groups                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Pros**:
- Leverages existing Task tool infrastructure
- Respects existing dependency graph (execution groups)
- Natural fit with current tasks.json structure
- 20-40% speedup per feature

**Cons**:
- File conflicts if tasks modify overlapping files
- Context usage increases (each sub-agent uses context)
- Progress tracking complexity
- Need to validate task independence

**Implementation Changes**:
1. Modify `/alpha:implement` to batch tasks by execution group
2. Add file-overlap detection before parallelizing
3. Use Task tool with `run_in_background=true` for parallel execution
4. Aggregate results with `TaskOutput`

### Option 2: Feature-Level Parallelism Within Sandbox

**Concept**: Run multiple features simultaneously in a single sandbox, each with its own sub-agent.

```
┌─────────────────────────────────────────────────────────────────────────┐
│              ALTERNATIVE: FEATURE-LEVEL IN SINGLE SANDBOX               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Orchestrator Session (Single Sandbox)                                  │
│       │                                                                 │
│       ├──→ Task tool: /alpha:implement Feature #1 (background)          │
│       ├──→ Task tool: /alpha:implement Feature #2 (background)          │
│       └──→ Poll TaskOutput for both until completion                    │
│                                                                         │
│  PROBLEM: Both features likely modify overlapping files                 │
│           (page.tsx, loaders, shared components)                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Pros**:
- Maximum parallelism
- Single sandbox cost

**Cons**:
- High file conflict probability (features often share files)
- Git merge conflicts within sandbox
- No dependency isolation
- **Not Recommended**

### Option 3: Hybrid Approach (Future Enhancement)

**Concept**: Combine dual sandbox with task-level parallelism.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FUTURE: HYBRID PARALLELISM                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Orchestrator (Local)                                                   │
│       │                                                                 │
│       ├──→ Sandbox A ──→ Feature #1                                     │
│       │                     │                                           │
│       │                     ├──→ [T1, T2, T3] parallel                  │
│       │                     ├──→ [T4, T5] parallel                      │
│       │                     └──→ [T6] sequential                        │
│       │                                                                 │
│       └──→ Sandbox B ──→ Feature #2                                     │
│                            │                                            │
│                            ├──→ [T7, T8] parallel                       │
│                            └──→ [T9, T10] parallel                      │
│                                                                         │
│  3 LEVELS: Sandboxes × Features × Tasks                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Expected Total Speedup**:
- Dual sandbox: ~50% (2 features in parallel)
- Task parallelism: ~20-40% per feature
- Combined: ~60-70% faster than sequential

---

## Implementation Approach for Option 1

### Phase 1: Task Independence Analysis

Add a pre-flight check to determine which tasks can safely run in parallel:

```typescript
interface TaskParallelizability {
  task_id: string;
  outputs: string[];        // Files this task creates/modifies
  conflicts_with: string[]; // Task IDs that touch same files
  can_parallel: boolean;    // True if no conflicts in same group
}

function analyzeTaskParallelism(tasks: Task[]): TaskParallelizability[] {
  // For each execution group:
  // 1. Extract output files from each task
  // 2. Detect overlaps between tasks in same group
  // 3. Mark tasks as parallelizable if no overlaps
}
```

### Phase 2: Modify `/alpha:implement`

Update the implementation command to use parallel sub-agents:

```markdown
### Modified Execution Loop

For each execution_group (sorted by group.id):

    # Analyze parallelizability
    parallel_tasks = tasks where can_parallel=true
    sequential_tasks = tasks where can_parallel=false

    # Execute parallel tasks using Task tool
    If parallel_tasks.length > 1:
        For each task in parallel_tasks:
            Launch Task tool with run_in_background=true:
                subagent_type: general-purpose
                prompt: "Implement task {task_id}: {description}
                        Files to modify: {outputs}
                        Constraints: {constraints}
                        Verification: {verification_command}"

        Wait for all with TaskOutput (blocking)
        Aggregate results

    # Execute sequential tasks normally
    For each task in sequential_tasks:
        Implement directly (current behavior)

    # Commit after group completes
    git add -A && git commit
```

### Phase 3: Progress Tracking Updates

Modify `.initiative-progress.json` to track parallel execution:

```json
{
  "feature": { "issue_number": 1367 },
  "current_group": {
    "id": 1,
    "parallel_batch": ["T1", "T2", "T3"],
    "status": "in_progress"
  },
  "parallel_tasks": {
    "T1": { "status": "completed", "agent_id": "abc123" },
    "T2": { "status": "in_progress", "agent_id": "def456" },
    "T3": { "status": "completed", "agent_id": "ghi789" }
  },
  "completed_tasks": ["T1", "T3"],
  "status": "in_progress"
}
```

---

## Task Decomposition Changes

To enable safe parallelization, the task decomposer should:

1. **Explicit Output Declaration**: Each task must declare files it creates/modifies
2. **No Shared Files in Group**: Tasks in same execution group should not share outputs
3. **Dependency Edge Annotations**: Mark why tasks are in different groups

### Updated tasks.json Schema

```json
{
  "tasks": [
    {
      "id": "T1",
      "name": "Create dashboard types",
      "action": {
        "verb": "Create",
        "target": "apps/web/app/home/(user)/_lib/types/dashboard.types.ts"
      },
      "outputs": [
        "apps/web/app/home/(user)/_lib/types/dashboard.types.ts"
      ],
      "parallelizable": true,
      "parallel_safe_reason": "Creates new file, no overlaps in Group 1"
    },
    {
      "id": "T2",
      "name": "Create data loader",
      "outputs": [
        "apps/web/app/home/(user)/_lib/server/dashboard-page.loader.ts"
      ],
      "parallelizable": true
    }
  ],
  "execution_groups": [
    {
      "id": 1,
      "task_ids": ["T1", "T2"],
      "parallel_batch": ["T1", "T2"],  // NEW: Tasks safe to run together
      "sequential": []                   // NEW: Tasks that must run sequentially
    }
  ]
}
```

---

## Risk Analysis

### Risk 1: File Conflicts
**Mitigation**: Pre-analyze task outputs, only parallelize if no overlaps

### Risk 2: Context Exhaustion
**Mitigation**:
- Limit parallel batch size (max 3-4 tasks)
- Use lightweight sub-agents (haiku model for simple tasks)
- Exit early if context usage > 40% before batch completes

### Risk 3: Progress Tracking Race Conditions
**Mitigation**: Use file locking or atomic writes for progress file

### Risk 4: Git Conflicts
**Mitigation**: Tasks in same batch don't touch same files (by design)

### Risk 5: Verification Order
**Mitigation**: Run verification commands after ALL parallel tasks complete

---

## Comparison Summary

| Approach | Speedup | Complexity | Risk | Recommendation |
|----------|---------|------------|------|----------------|
| Task-Level Parallelism | 20-40% | Medium | Low | ✅ Implement |
| Feature-Level in Sandbox | 50%+ | High | High | ❌ Avoid |
| Hybrid (Dual + Task) | 60-70% | High | Medium | 🔜 Future |

---

## Implementation Phases

### Phase 1: Analysis Only ✅ COMPLETE
- Added parallelizability analysis to task decomposer
- Generated `parallel_batch` arrays in execution groups
- Created `.ai/alpha/scripts/analyze-task-parallelism.ts` utility
- Updated `generate-initiative-manifest.ts` to include parallelism data
- Schema updated with `parallel_batches`, `sequential_tasks`, `parallelization_analysis`

### Phase 2: Sequential with Analysis ✅ COMPLETE
- Updated `/alpha:implement` with `--parallel-dry-run` flag
- Added Phase 1.5: Parallel Batch Analysis section
- Logs what WOULD run in parallel with detailed output
- Progress file includes `parallelism_summary` field
- Execution mode selection (dry_run, parallel, sequential)

### Phase 3: Parallel Execution ✅ COMPLETE
- Added detailed "Parallel Batch Execution" section to `/alpha:implement`
- Step-by-step instructions for launching Task tool sub-agents
- Uses `run_in_background=true` for true parallel execution
- `TaskOutput` waiting and result aggregation
- Progress tracking with `parallel_execution` field in progress file
- Error handling: retry failed tasks sequentially
- Post-batch verification with `pnpm typecheck`
- Example output showing parallel vs sequential execution

**Key Implementation Details**:
```
1. Pre-batch checkpoint (status: "launching")
2. Launch ALL batch tasks in SINGLE message (multiple Task tool calls)
3. Wait for each agent with TaskOutput (block=true)
4. Aggregate results (success/failed arrays)
5. Retry failed tasks sequentially
6. Post-batch typecheck verification
7. Commit after group completes
```

### Phase 4: Integration Testing (NEXT)
- Test with dual sandbox + task parallelism
- Measure actual speedup vs estimates
- Tune batch sizes and timeouts
- Document best practices and edge cases
- Consider context limits with parallel sub-agents

---

## Conclusion

**Task-level parallelization within a sandbox is now implemented** using the Task tool to spawn multiple sub-agents for independent tasks.

### Implementation Status

| Component | Status | Description |
|-----------|--------|-------------|
| Parallelism Analyzer | ✅ Complete | `analyze-task-parallelism.ts` detects parallel opportunities |
| Schema Updates | ✅ Complete | `parallel_batches`, `parallelization_analysis` fields |
| Manifest Generator | ✅ Complete | Includes `task_parallelism` summary per feature |
| Dry Run Mode | ✅ Complete | `--parallel-dry-run` flag validates analysis |
| Parallel Execution | ✅ Complete | **DEFAULT** when `parallel_batches` exist (use `--sequential` to opt-out) |
| Integration Testing | 🔜 Next | Phase 4 - test in real sandbox environment |

### Usage

```bash
# Analyze parallelism for a feature
npx tsx .ai/alpha/scripts/analyze-task-parallelism.ts path/to/tasks.json --update

# Execute feature (parallel is DEFAULT when batches exist)
/alpha:implement 1369

# Validate parallel execution plan (dry run)
/alpha:implement 1369 --parallel-dry-run

# Force sequential execution
/alpha:implement 1369 --sequential
```

### Expected Results

For Initiative #1363 (Dashboard Foundation):
- **Total Tasks**: 43
- **Parallelizable**: 19 (44%)
- **Groups with Parallel Batches**: 8 across 4 features
- **Estimated Speedup**: 20-40% per feature (compounding with dual sandbox)

### Key Constraint

**File overlap detection** determines parallelizability. Tasks can only run in parallel if they don't modify the same files. The analyzer automatically detects conflicts and groups tasks into safe parallel batches.
