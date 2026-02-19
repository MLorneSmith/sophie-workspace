# Bug Diagnosis: S2045 GPT Orchestrator Cascade Failure — 1/14 Features Completed

**ID**: ISSUE-2069
**Created**: 2026-02-12T16:00:00Z
**Reporter**: user
**Severity**: critical
**Status**: new
**Type**: bug

## Summary

Running `tsx spec-orchestrator.ts 2045 --provider gpt` completed with only 1/14 features (7% success rate). The orchestrator exited with `"No review sandbox available - could not start dev server"`. Root cause is a **cascade failure**: S2045.I1.F1 (Dashboard Page Shell) failed after 3 retries because the GPT/Codex agent corrupted the sandbox's `node_modules` while trying to fix a pre-existing typecheck error in the orchestrator's own packages. Since 12/13 remaining features depend (directly or transitively) on F1, the entire spec was permanently blocked. There are also 5 additional compounding issues in the E2B sandbox environment that prevent any GPT-based run from succeeding reliably.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (E2B sandbox)
- **Agent Provider**: GPT (OpenAI Codex v0.98.0, model gpt-5.3-codex)
- **Node Version**: 20 (E2B template)
- **Orchestrator Run ID**: run-mljl2cvp-n1t0
- **Spec ID**: S2045 (User Dashboard)
- **E2B Template**: slideheroes-gpt-agent-dev

## Reproduction Steps

1. Ensure S2045 spec is decomposed (4 initiatives, 14 features, 97 tasks)
2. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 2045 --provider gpt`
3. Wait for orchestrator to complete (~8 minutes)
4. Observe: only 1/14 features completed, review sandbox creation fails

## Expected Behavior

All 14 features should be implemented across 3 sandboxes with the GPT/Codex provider, similar to how it works with the Claude provider.

## Actual Behavior

- **1/14 features completed** (S2045.I1.F2: Activity Events Database — the only feature with no dependency on F1)
- **1/14 features permanently failed** (S2045.I1.F1: Dashboard Page Shell — 3 retries exhausted)
- **12/14 features permanently blocked** (all depend transitively on F1 or I1)
- **Review sandbox creation failed** with exit status 1
- Orchestrator exited with status "partial" after ~8 minutes
- No code pushed to GitHub (DNS resolution failure in sandbox)

## Diagnostic Data

### Console Output (Key Events)

```
14:59:46 - Orchestrator start (run-mljl2cvp-n1t0)
14:59:46 - sbx-a assigned S2045.I1.F1 (Dashboard Page Shell)
14:59:46 - sbx-b assigned S2045.I1.F2 (Activity Events Database)
14:59:47 - Both sandboxes start codex exec --full-auto
14:59:47 - bash: command substitution: syntax error (template prompt escaping bug)
~15:01   - sbx-a: GPT runs pnpm typecheck, discovers zod missing from node_modules
~15:01   - sbx-a: GPT tries `pnpm install --filter` → ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY
~15:02   - sbx-a: GPT tries `CI=true pnpm install --filter` → corrupts workspace node_modules
~15:03   - sbx-a: GPT tries `pnpm install --offline` → ERR_PNPM_NO_OFFLINE_TARBALL (@e2b/code-interpreter missing)
~15:04   - sbx-a: Killed (timeout) after spending entire session on node_modules fix
~15:04   - sbx-a: Retry #2 starts for S2045.I1.F1
~15:04   - sbx-a: Same node_modules corruption from retry #1 persists (same sandbox)
15:04:51 - sbx-a progress: phase "starting", 0 completed tasks
~15:07   - sbx-a: Retry #3 fails → feature permanently failed
15:06:58 - sbx-b: S2045.I1.F2 completed (4/4 tasks)
15:07:04 - sbx-b, sbx-c: idle, waiting for dependencies (12 features blocked)
15:07:05 - Review sandbox creation attempted (GPT template)
15:07:17 - Review sandbox creation failed (exit status 1)
15:07:17 - Orchestrator exits with status "partial"
```

### sbx-a Log (F1 Failure Chain)

```
# GPT discovers typecheck failure in orchestrator packages
../lib/schemas/progress.schema.ts(11,19): error TS2307: Cannot find module 'zod'

# GPT attempts to fix (WRONG — should implement feature, not fix env)
pnpm install --filter @slideheroes/alpha-scripts --filter @slideheroes/orchestrator-ui
→ ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY

CI=true pnpm install --filter ...
→ Corrupts workspace node_modules (removes symlinks)

pnpm install --offline
→ ERR_PNPM_NO_OFFLINE_TARBALL (@e2b/code-interpreter)

# Now ALL typecheck/lint fails across workspace
pnpm typecheck → tsc not found, biome not found
# GPT spent entire context budget on env fix, never implemented a single task
→ Killed
```

### sbx-b Log (F2 Success with Issues)

```
# F2 completed but with environment issues:
pnpm lint → "sh: 1: biome: not found"
pnpm typecheck → cache miss on @slideheroes/orchestrator-ui (zod missing)
git push → "fatal: Could not resolve host: github.com"

# Despite failures, GPT correctly marked progress as completed
# and committed 2 git commits (locally only — push failed)
```

### Spec Manifest State

```json
{
  "progress": {
    "status": "partial",
    "features_completed": 1,
    "features_total": 14,
    "tasks_completed": 4,
    "tasks_total": 97,
    "review_error": "exit status 1",
    "completion_status": "failed"
  }
}
```

F1 entry:
```json
{
  "id": "S2045.I1.F1",
  "status": "failed",
  "error": "Implementation error: Sandbox is probably not running anymore - max retries (3) exceeded",
  "retry_count": 3
}
```

### Screenshots
N/A (review sandbox failed to create)

## Error Stack Traces

```
# Review sandbox creation (completion-phase.ts:184)
createReviewSandbox() → pnpm typecheck fails → exit status 1
# This is the same typecheck that fails due to zod not being resolved
# in @slideheroes/orchestrator-ui package
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/sandbox.ts` (lines 1369-1564) — createReviewSandbox runs full `pnpm typecheck`
  - `.ai/alpha/scripts/lib/completion-phase.ts` (lines 158-228) — setupReviewSandbox catches error
  - `.ai/alpha/scripts/lib/feature.ts` — feature implementation and retry logic
  - `.ai/alpha/scripts/lib/schemas/progress.schema.ts` — imports zod (causes typecheck failure in sandbox)
  - `packages/e2b/e2b-template/template.ts` — E2B template definition
- **Recent Changes**: 7 orchestrator bug fixes in last 2 days (commits 1ba9c54..011c587)
- **Suspected Functions**: `createReviewSandbox()`, `runFeatureImplementation()`, `pnpm typecheck` scope

## Related Issues & Context

### Direct Predecessors
- #2068 (OPEN): "Zod validation rejects null progress fields" — GPT writes null, Zod rejects
- #2065 (OPEN): "UI crash — truncate() receives undefined from GPT" — GPT omits required fields
- #2060 (OPEN): "False Completion with GPT — Raise Threshold to 80%" — GPT marks features done prematurely
- #2059 (CLOSED): "False completion with GPT — agent ignores mandatory rules"
- #2048 (CLOSED): "GPT Agent writes 'context_limit' causing retry loop"
- #1937 (CLOSED): "S1918 GPT Provider Multiple Issues"
- #1924 (CLOSED): "GPT provider review sandbox failures"

### Same Infrastructure
- #2057 (CLOSED): "Orchestrator stalls on S2045 — impossible database tasks"
- #2058 (CLOSED): "Remove impossible database tasks from S2045.I1.F2"
- #2064 (CLOSED): "Infinite retry loop prevents completion phase"
- #2063 (CLOSED): "Stale progress file race"

### Historical Context
This is the **3rd failed S2045 run** and the **6th+ GPT-specific failure pattern**. Issues #1937, #2048, #2059, #2060, #2065, #2068 all share the same theme: GPT/Codex agents do not reliably follow the orchestrator's behavioral contract (progress file format, status values, mandatory rules).

## Root Cause Analysis

### Identified Root Cause

**Summary**: Six compounding issues caused cascade failure — the primary root cause is the GPT agent wasting its entire context budget trying to fix a pre-existing typecheck error in the orchestrator's own packages (not the feature code), combined with a dependency graph where 12/13 features depend on the one that failed.

### Detailed Explanation — Six Compounding Issues

**Issue 1 (PRIMARY): GPT Agent Distraction — Fixing Environment Instead of Implementing Feature**

When GPT/Codex runs `pnpm typecheck` as part of the Alpha implement workflow, it discovers that `@slideheroes/orchestrator-ui` fails to compile because `zod` is not properly symlinked in its `node_modules`. Instead of recognizing this is an unrelated pre-existing issue and proceeding with the feature implementation (which only needs `apps/web` to typecheck), GPT spends its entire context budget (~5 minutes) trying to fix the symlinks via `pnpm install`. Each install attempt makes things worse:

1. `pnpm install --filter` → fails (no TTY)
2. `CI=true pnpm install --filter` → corrupts workspace symlinks
3. `pnpm install --offline` → fails (missing tarball)

After corruption, even basic tools like `tsc` and `biome` become unavailable. GPT never implements a single task. This repeats on all 3 retry attempts (same corrupted sandbox).

**Evidence**: sbx-a.log lines 824-832, 1125-1173, 1189 (Killed)

**Issue 2: Cascade Dependency — Single Point of Failure**

The S2045 spec dependency graph creates a fatal bottleneck:
```
F1 (Dashboard Shell) ← F3, all of I2 (3 features), all of I3 (4 features), all of I4 (4 features)
F2 (Activity Events DB) ← F3, F4
```

When F1 fails, 12 of 13 remaining features are permanently blocked. Only F2 has no dependency on F1 and can complete independently.

**Evidence**: spec-manifest.json feature_queue dependencies; sbx-b/sbx-c progress showing "Waiting for dependencies (12 features blocked)"

**Issue 3: E2B Template — Missing Zod Symlink**

The E2B template runs `pnpm install` during build, which installs all workspace dependencies. However, `zod` is not symlinked at the root `node_modules` level — it exists in the pnpm store (`.pnpm/zod@4.1.13/`) but the workspace package `@slideheroes/alpha-scripts` and `@slideheroes/orchestrator-ui` don't get a proper `node_modules/zod` symlink. This is a template build issue.

**Evidence**: sbx-a.log line 800 `ROOT_ZOD_MISSING`, lines 851-852 showing zod@4.1.13 exists in `.pnpm` store

**Issue 4: Typecheck Scope Too Broad**

Both the feature implementation and the review sandbox run `pnpm typecheck` which typechecks ALL 45 workspace packages, including `@slideheroes/alpha-scripts` and `@slideheroes/orchestrator-ui`. These orchestrator packages:
- Import `zod` (missing symlink in sandbox)
- Import `@e2b/code-interpreter` (not in offline tarball store)
- Are completely irrelevant to feature implementation

The typecheck should be scoped to only `apps/web` and its dependencies in the sandbox context.

**Evidence**: sbx-a.log lines 1140-1141 showing 45 packages in typecheck scope; line 829 showing progress.schema.ts zod error

**Issue 5: DNS Resolution Failure in E2B**

`git push origin HEAD` fails with `Could not resolve host: github.com`. This means even successfully completed features can't push their code, making the review sandbox's branch checkout also fail.

**Evidence**: sbx-b.log line 1262-1263

**Issue 6: Prompt Template Escaping Bug**

The mandatory rules prompt contains `git add <file1> <file2> ...` which bash interprets as a command substitution, producing:
```
bash: command substitution: line 1: syntax error near unexpected token `<'
```
This error is cosmetic (doesn't block execution) but adds noise and confusion.

**Evidence**: sbx-a.log line 26-27, sbx-b.log line 26-27

### How This Causes the Observed Behavior

1. Template starts with broken zod symlink → typecheck of orchestrator packages fails
2. GPT sees typecheck failure → tries to fix it (instead of implementing feature)
3. GPT's fix attempts corrupt node_modules → entire workspace breaks
4. Feature F1 fails after 3 retries → permanently blocked
5. 12/13 remaining features depend on F1 → permanently blocked
6. Orchestrator has no more workable features → enters completion phase
7. Review sandbox created → runs `pnpm typecheck` → fails on same zod issue → exit status 1
8. No review sandbox available → "could not start dev server"
9. Orchestrator exits with "partial" status, 1/14 features completed

### Confidence Level

**Confidence**: High

**Reasoning**: The causal chain is fully documented in the log files. The zod symlink issue is confirmed by the `ROOT_ZOD_MISSING` check in sbx-a.log. The cascade failure from F1's permanent failure to 12 blocked features is verified in the spec manifest and progress files. The review sandbox failure matches the same typecheck error.

## Fix Approach (High-Level)

### Immediate Fixes (Orchestrator Code)

1. **Scope typecheck in sandbox to feature packages only**: Change `pnpm typecheck` in both `feature.ts` (implementation) and `sandbox.ts:1536` (review sandbox) to `pnpm --filter web typecheck` or exclude orchestrator packages. This prevents the GPT agent from even seeing the orchestrator typecheck failures.

2. **Fix the prompt template escaping**: Replace `git add <file1> <file2> ...` with `git add path/to/file1 path/to/file2` or escape the angle brackets in the mandatory rules prompt to prevent the bash syntax error.

3. **Fix DNS resolution in E2B**: Investigate why `github.com` cannot be resolved. This may require adding DNS configuration to the E2B template or using a retry mechanism for git push.

### E2B Template Fixes

4. **Rebuild the GPT template** after ensuring zod is properly installed: Run `pnpm e2b:build:gpt-dev` to rebuild with the latest code. The template may be stale — the recent addition of zod to `@slideheroes/alpha-scripts` (commit 9e959627 for #2066) happened after the template was last built.

### Spec Decomposition Fixes

5. **Restructure S2045 dependency graph**: The current dependency chain where 12/13 features depend on F1 is a single point of failure. Options:
   - Make F1 a "Phase 0" prerequisite that runs first on a single sandbox before parallel execution begins
   - Split F1 into smaller, independent pieces so other features can proceed even if part of F1 fails
   - Reduce F1's scope to the absolute minimum (just the page shell) and move grid layout to a separate feature

### Open Issues to Merge

6. **Commit the 3 open bug fixes**: Issues #2068 (Zod null handling), #2065 (UI crash), and #2060 (task audit + 80% threshold) have fixes staged but uncommitted. These should be committed and would prevent several of the compounding failure modes.

## Broader Health Assessment

The Alpha orchestrator codebase has significant structural issues that explain the recurring failures:

1. **20+ bug fixes in 10 days** (issues #2048-#2068) — the rate of bug discovery is not decreasing
2. **GPT/Codex as a provider is fundamentally unreliable**: 6+ issues (#1937, #2048, #2059, #2060, #2065, #2068) stem from GPT not following the behavioral contract. The orchestrator keeps adding defensive code, but GPT finds new ways to break the contract.
3. **Shared mutable JSON state** (spec-manifest.json) with no locking — identified as root cause in the Feb 6 assessment but not yet addressed
4. **26 direct status mutations** across 8 files — the centralized state transition system (`feature-transitions.ts`) exists but isn't enforced everywhere
5. **The E2B sandbox environment is fragile**: Missing dependencies, DNS failures, package corruption from install attempts — each run discovers new environmental issues

The code works with Claude as the provider because Claude follows the behavioral contract more reliably. The fundamental question is whether to continue investing in GPT provider hardening or focus on Claude-only reliability.

## Diagnosis Determination

The immediate failure (1/14 features, no review sandbox) is caused by a cascade from a broken zod symlink in the E2B template combined with GPT's tendency to fix environment issues instead of implementing features. The fix is straightforward: scope typechecks to feature packages only, rebuild the GPT template, and restructure the S2045 dependency graph.

However, the broader pattern — 20+ bugs in 10 days, all related to GPT provider non-compliance — suggests that GPT/Codex support requires significantly more investment in I/O boundary validation and defensive coding than Claude support. The recommended approach is:

1. Fix the 6 immediate issues identified above
2. Commit the 3 pending bug fixes (#2068, #2065, #2060)
3. Re-run S2045 with Claude provider to validate the spec itself works
4. Make a strategic decision about GPT provider support based on the Claude run results

## Additional Context

- The E2B GPT template was migrated from v1 to v2 on 2026-02-11 (commit 09816256c) but may not have been rebuilt since the zod validation was added to the orchestrator (commit 9e959627 for #2066)
- The S2045 spec has 4 initiatives, 14 features, and 97 tasks — within the recommended limits (max 7-8 features per phase, max 12 tasks per feature)
- The prior S2045 run (pre-GPT template migration) also failed due to impossible database tasks (#2057-#2058), which were fixed before this run

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git log, gh issue list/view), Task (Explore agent, Bash agent)*
