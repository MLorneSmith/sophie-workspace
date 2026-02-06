# Alpha Orchestrator: Comprehensive Assessment & Unified Recommendations

**Date**: 2026-02-06
**Scope**: Robustness, Performance, and Spec Sizing
**Evidence Base**: 4 parallel research agents analyzing ~15,600 lines across 35+ source files, 14 recent GitHub issues, E2B SDK documentation, and industry benchmarks (SWE-bench, Devin, Cursor, PARC)

---

## Executive Summary

The Alpha Spec Orchestrator has a **single systemic root cause** driving most of its issues: **well-designed infrastructure that was built but never connected**. A state machine, recovery manager, and heartbeat monitor exist as dead code while the actual execution path uses raw string mutations across 8 files. This creates a "whack-a-mole" pattern where each bug fix adds a new recovery mechanism that doesn't compose with the others.

The three assessment topics converge on a unified recommendation:

| Topic | Diagnosis | Recommendation |
|-------|-----------|----------------|
| **Robustness** | 26 unguarded status mutations across 8 files; 3 dead-code subsystems; 5 overlapping recovery mechanisms | Enforce centralized state transitions (the existing state machine) |
| **Speed** | 30-45% of wall-clock time is overhead (sandbox restarts, git ops, stagger delays); only 55-70% is productive coding | Upgrade E2B hardware, reduce stagger, use pause/resume, enforce smaller features |
| **Spec Sizing** | S1918 (18 features, 136 tasks) is 2x too large; 33% completion rate; industry consensus is 8-10 features max | Split specs into phases of 7-8 features with max 12 tasks per feature |

**The agents unanimously agree**: fix robustness first (Phase 1-2 refactoring), then improve speed (quick wins), then implement phase-based spec splitting.

---

## Topic 1: Robustness

### The Core Problem

The orchestrator has a `FeatureStateMachine` class (438 lines) with proper transitions, guards, and event listeners -- **but zero production code imports it**. Instead, `feature.status = "string"` appears in **26 locations across 8 files** with no validation, no centralized transitions, and no guard logic.

**Impact**: Every new bug fix patches one status transition path while leaving others unguarded. Issue #1952 is the canonical example: a GPT agent wrote `"blocked"` to the progress file, `feature.ts:701` blindly propagated it, and then every consumer missed it because they only check for `"pending" | "in_progress" | "failed"`.

### Dead Code (1,305 lines)

| Module | Lines | Purpose | Status |
|--------|-------|---------|--------|
| `state-machine.ts` | 438 | Centralized state transitions | **Never imported** |
| `heartbeat-monitor.ts` | 453 | Event-driven heartbeat tracking | **Never imported** |
| `recovery-manager.ts` | 414 | Centralized recovery coordination | **Never imported** |

All three were designed as part of bug fix #1786 ("event-driven architecture") but the migration was never completed.

### Recovery Mechanism Overlap

5 independent systems address different failure scenarios without coordination:

| System | File | Action |
|--------|------|--------|
| Health checks | `health.ts` | Kill process, reset to pending |
| Promise timeout | `promise-age-tracker.ts` + `work-loop.ts` | Reset to pending or mark failed |
| Stuck task detection | `work-loop.ts:713-767` | Reset to pending |
| PTY fallback | `work-loop.ts:879-924` | Mark completed from progress file |
| Phantom completion | `work-queue.ts` + `deadlock-handler.ts` | Mark completed |

These can conflict because they all independently mutate `feature.status` without coordination.

### Additional Issues

- **55 bare `catch {}` blocks** silently swallow errors, including 11 in `manifest.ts` where save failures go undetected
- **`createLogger(uiEnabled)`** copy-pasted identically in 9 files
- **Initiative status update logic** duplicated in 5 files with subtle differences
- **No runtime validation** of status values from agent progress files (TypeScript unions are erased at runtime)

### Robustness Recommendations

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| **P1** | Create `transitionFeatureStatus()` that all 26 mutation sites route through | 3-4 hours | ROOT CAUSE FIX -- prevents all "unknown status" bugs |
| **P2** | Remove dead code (heartbeat-monitor, recovery-manager) + extract shared logger | 2 hours | Reduces noise, removes 1,305 dead lines |
| **P3** | Add runtime validation for progress file status values (reject/remap `"blocked"`) | 1 hour | Prevents agent-written garbage from corrupting state |
| **P4** | Decompose `feature.ts` (932 lines, 1 exported function) and `sandbox.ts` (1524 lines) | 8 hours | Testability, maintainability |
| **P5** | Consolidate 5 recovery mechanisms into single coordinator | 10 hours | Predictable recovery (depends on P1) |

---

## Topic 2: Speed

### Where Time Goes (S1918: 78 min, 6/18 features completed)

| Phase | Time | % |
|-------|------|---|
| Productive coding by agent | ~40-55 min | 55-70% |
| Sandbox restarts (3x due to 60-min max age) | ~9-15 min | 12-19% |
| Git operations (ls-remote, fetch, reset per feature) | ~3-9 min | 5-12% |
| Sandbox creation (3x with 60s stagger) | ~3-5 min | 5% |
| Agent startup (OAuth, prompt setup) | ~1.5-6 min | 2-8% |
| Post-work (git commit, push per feature) | ~3-12 min | 4-15% |
| Polling/health/keepalive | <1 min | ~1% |

**Key insight**: Validation overhead (polling, health checks) is negligible at ~1.2% of wall-clock time. **Do NOT reduce validation frequency.** The real overhead is sandbox restarts and git operations.

### E2B Hardware Analysis

Current: 2 vCPU, 512 MiB RAM (default). Cost for S1918: ~$0.39.

Upgraded: 4 vCPU, 4 GB RAM. Cost: ~$0.91 (+$0.52/run).

The cost increase is trivial vs. AI API token costs. **Doubling vCPU speeds up `pnpm install`, `pnpm typecheck`, `pnpm build`, and `git` by 20-40%.**

### Speed Recommendations

**Quick Wins (< 1 day):**

| # | Action | Savings |
|---|--------|---------|
| Q1 | Upgrade E2B template to 4 vCPU / 4 GB RAM | 5-10 min/run |
| Q2 | Reduce sandbox stagger from 60s to 30s (add OAuth retry backoff) | 60s/run |
| Q3 | Skip git pull for same-sandbox sequential features | 1-2 min/run |
| Q4 | Use shallow fetch (`git fetch --depth=1`) | 30-60s/run |

**Medium Effort (1-3 days):**

| # | Action | Savings |
|---|--------|---------|
| M1 | Enforce max 8-10 tasks per feature (prevents restarts) | 6-10 min/run |
| M2 | Use E2B pause/resume instead of kill/create | 3-8 min/run |
| M3 | Dynamic sandbox count from dependency graph max parallelism | Avoids idle sandboxes |

**Cumulative Expected Impact** (quick wins + medium effort):

| Metric | Before | After |
|--------|--------|-------|
| Startup time | ~3-5 min | ~1-2 min |
| Per-feature overhead | ~3-5 min | ~1-2 min |
| Sandbox restarts | 3/run | 0-1/run |
| Time to complete 6 features | 78 min | ~40-50 min |

---

## Topic 3: Spec Sizing

### S1918 Was 2x Too Large

S1918: 6 initiatives, 18 features, 136 tasks. Result: 33% completion (6/18 features) in 78 min before deadlock.

### Industry Evidence for Feature Limits

| System | Recommended Unit Size | Key Finding |
|--------|----------------------|-------------|
| SWE-bench Pro | 15 min - 4 hours per task | Tasks >4 hours have near-zero success rates |
| Devin AI | 1-6 hours per delegated task | "Medium-to-large tasks give the highest ROI" |
| Cursor Agents | Small focused tasks | "Clear termination criteria prevent aimless timeout" |
| PARC | 1 task per worker context | "Each task operates in an independent context limited to that task" |

**Universal pattern**: every successful system keeps individual work units to 5-12 tasks and uses fresh contexts per unit. None attempt 136 tasks in a single orchestration session.

### Recommended Limits

| Metric | Recommended | Hard Maximum |
|--------|-------------|--------------|
| Features per phase | 7-8 | 10 |
| Tasks per phase | 60-80 | 100 |
| Dependency depth | 3-4 levels | 5 |
| Max tasks per feature | 10 | 12 |

### Recommended Split for S1918

**Phase 1 -- Foundation (I1 + I2):** 7 features, 42 tasks
- Split I1.F3 (16 tasks) into 2 features of 8 tasks each

**Phase 2 -- Widgets (I3 + I4 + I5):** 8 features, 42 tasks
- All features well-sized (3-9 tasks each)

**Phase 3 -- Polish (I6):** 6 features, 52 tasks
- Split I6.F3 (19 tasks) and I6.F4 (14 tasks) into sub-features

### Implementation: Sequential Runs with Branch Chaining

```bash
# Phase 1
tsx spec-orchestrator.ts S1918 --phase P1
# Human reviews branch alpha/spec-S1918-P1

# Phase 2 (starts from P1's branch)
tsx spec-orchestrator.ts S1918 --phase P2 --base-branch alpha/spec-S1918-P1

# Phase 3
tsx spec-orchestrator.ts S1918 --phase P3 --base-branch alpha/spec-S1918-P2
```

### Expected Reliability Impact

| Metric | 1 phase (18 features) | 3 phases (7/8/6) |
|--------|----------------------|-------------------|
| Completion rate | ~33% | ~85-95% per phase |
| Wall-clock time | 78 min then deadlock | ~45-60 min/phase, ~2.5-3 hours total |
| Sandbox restarts | 3 (cascading) | 0-1 per phase |
| Blast radius | 12 features blocked by 1 failure | Limited to 1 phase |

---

## Unified Execution Plan

### Phase 1: Quick Wins (1-2 days)

1. **Upgrade E2B template** to 4 vCPU / 4 GB RAM
2. **Reduce sandbox stagger** from 60s to 30s
3. **Add runtime status validation** for progress file values (remap `"blocked"` -> `"failed"`)
4. **Skip redundant git pulls** for same-sandbox sequential features

### Phase 2: Robustness Foundation (3-5 days)

5. **Create `transitionFeatureStatus()`** function -- route all 26 mutation sites through it
6. **Remove dead code** (heartbeat-monitor.ts, recovery-manager.ts) -- save state-machine.ts as design reference
7. **Extract shared `createLogger()`** to lib/logger.ts (9 files)
8. **Centralize initiative status update** (eliminate 5 copies)

### Phase 3: Spec Sizing (3-5 days)

9. **Add `phases` field to SpecManifest** with topological grouping algorithm
10. **Add `--phase` and `--base-branch` flags** to spec-orchestrator.ts
11. **Enforce max 12 tasks per feature** in `/alpha:task-decompose` validation
12. **Add phase validation** in pre-flight checks (feature count, dependency depth)

### Phase 4: Performance (1 week)

13. **Implement E2B pause/resume** for sandbox lifecycle
14. **Enforce max 8-10 tasks per feature** in decomposition
15. **Dynamic sandbox count** based on dependency graph analysis
16. **Shallow git fetch** for per-feature pulls

### Phase 5: Recovery Consolidation (1 week, depends on Phase 2)

17. **Create unified `RecoveryCoordinator`** combining health, promise timeout, stuck detection, and phantom completion
18. **Route all recovery through `transitionFeatureStatus()`** (from Phase 2)
19. **Decompose `feature.ts`** (932 lines) and **split `sandbox.ts`** (1524 lines)
20. **Add comprehensive integration tests** for all known failure scenarios

---

## Key Insight

The robustness, speed, and sizing problems are not independent -- they form a vicious cycle:

```
Large specs (18+ features)
  -> deep dependency chains
    -> long critical paths
      -> sandboxes expire mid-feature
        -> restart loops burn retries
          -> state corruption from unguarded transitions
            -> deadlock from unknown statuses
              -> run fails at 33% completion
```

Breaking this cycle requires attacking all three simultaneously:
- **Smaller phases** reduce dependency depth and blast radius
- **Faster infrastructure** (hardware, git, stagger) reduces time pressure
- **Enforced state transitions** prevent corruption even when things fail

The good news: the hardest part (designing the state machine and recovery architecture) was already done. It just needs to be connected.

---

## Detailed Reports

Full analysis from each specialist agent:

1. **Robustness**: Agent output (inline above)
2. **Performance**: Agent output (inline above)
3. **Spec Sizing**: Agent output (inline above)
4. **Refactoring**: `.ai/reports/chore-reports/2026-02-06/pending-refactor-analysis-alpha-orchestrator.md`

## Sources

- [E2B Pricing](https://e2b.dev/pricing) | [Sandbox Persistence](https://e2b.dev/docs/sandbox/persistence) | [CPU/RAM Customization](https://e2b.dev/docs/sandbox-template/customize-cpu-ram)
- [E2B Issue #879](https://github.com/e2b-dev/e2b/issues/879) (Timeout not honored) | [#921](https://github.com/e2b-dev/e2b/issues/921) (Peer closed connection) | [#1078](https://github.com/e2b-dev/e2b/issues/1078) (PTY + Claude Code)
- [SWE-bench Pro](https://arxiv.org/pdf/2509.16941) | [SWE-bench](https://arxiv.org/pdf/2310.06770)
- [Devin AI Agents 101](https://devin.ai/agents101) | [Devin 2.0 Deep Dive](https://medium.com/@takafumi.endo/agent-native-development-a-deep-dive-into-devin-2-0s-technical-design-3451587d23c0)
- [Cursor Scaling Agents](https://cursor.com/blog/scaling-agents)
- [PARC Architecture](https://arxiv.org/html/2512.03549v1)
- [Building Effective Agents (Anthropic)](https://www.anthropic.com/research/building-effective-agents)
- [Temporal: Beyond State Machines](https://temporal.io/blog/temporal-replaces-state-machines-for-distributed-applications)
