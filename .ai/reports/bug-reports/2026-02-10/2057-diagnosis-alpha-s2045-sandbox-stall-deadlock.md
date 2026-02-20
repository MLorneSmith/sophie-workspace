# Bug Diagnosis: Alpha orchestrator stalls on S2045 — impossible database tasks cause deadlock

**ID**: ISSUE-2057
**Created**: 2026-02-10T20:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha orchestrator stalled at 13% completion (2/14 features, 13/99 tasks) during S2045 (user dashboard) execution with GPT provider. Feature S2045.I1.F2 (Activity Events Database) repeatedly failed because tasks T5 and T6 require a local Docker-based Supabase instance, which is unavailable in E2B sandboxes. After 3 retries over ~60 minutes, the feature remained stuck in `in_progress` state while the 4th attempt was ongoing. Since 12 of 14 features depend (directly or transitively) on S2045.I1.F2 completing, the entire spec was effectively deadlocked.

## Environment

- **Application Version**: dev branch at commit 5c30727c0
- **Environment**: development (local orchestrator + E2B sandboxes)
- **Node Version**: N/A (E2B sandbox)
- **Database**: PostgreSQL (remote Supabase sandbox project)
- **Agent Provider**: GPT (Codex v0.94.0, model gpt-5.2-codex)
- **Last Working**: N/A (first S2045 run)

## Reproduction Steps

1. Run `tsx spec-orchestrator.ts 2045 --provider gpt` with S2045 spec
2. S2045.I1.F1 completes (5/5 tasks, non-database)
3. S2045.I3.F2 completes (4/4 tasks, non-database)
4. S2045.I1.F2 (Activity Events Database) is assigned — all 6 tasks are `requires_database: true`
5. Tasks T1-T4 complete (schema creation, RLS, triggers, migration generation)
6. Task T5 ("Apply migration to local database") fails: `pnpm --filter web supabase migration up` cannot connect to `127.0.0.1:54522` (no local Docker/Supabase in E2B)
7. Task T6 ("Generate TypeScript types") is blocked by T5
8. Feature fails, gets retried up to 3 times, same failure each time
9. All other features are blocked waiting for S2045.I1.F2 — complete deadlock

## Expected Behavior

The orchestrator should either:
1. Execute database migrations against the remote Supabase sandbox project (already configured), OR
2. Recognize the deterministic failure pattern and mark the feature as permanently failed faster, allowing the deadlock handler to trigger

## Actual Behavior

- Feature S2045.I1.F2 retried 3 times (retry_count: 3), each time hitting the same Docker/local-DB error
- Each retry cycle wastes ~15 minutes (agent runs ~5min, stall detection waits ~10min)
- ~60 minutes wasted before the feature could be permanently failed
- sbx-c sat completely idle the entire run ("Waiting for dependencies")
- At time of observation: feature still `in_progress` on its 4th total attempt (which will also fail)

## Diagnostic Data

### Progress File Evidence

**sbx-a (retry #3/4th attempt):**
```json
{
  "feature": { "issue_number": "S2045.I1.F2", "title": "Activity Events Database" },
  "current_task": { "id": "S2045.I1.F2.T3", "name": "Create trigger functions for 5 source tables", "status": "starting" },
  "completed_tasks": ["S2045.I1.F2.T1", "S2045.I1.F2.T2"],
  "context_usage_percent": 25,
  "status": "in_progress",
  "phase": "executing",
  "last_heartbeat": "2026-02-10T19:28:08+00:00"
}
```
Output includes: `pnpm --filter web supabase migration up ❌ (failed 3x: cannot connect to local DB)`, `pnpm --filter web supabase start ❌ (Docker socket permission denied)`

**sbx-b (retry #1):**
```json
{
  "feature": { "issue_number": "S2045.I1.F2", "title": "Activity Events Database" },
  "current_task": { "id": "S2045.I1.F2.T5", "name": "Apply migration to local database", "status": "failed" },
  "completed_tasks": ["S2045.I1.F2.T1", "S2045.I1.F2.T2", "S2045.I1.F2.T3", "S2045.I1.F2.T4"],
  "status": "failed",
  "phase": "pushing",
  "last_heartbeat": "2026-02-10T18:48:57Z"
}
```
Output includes: `fatal: unable to access 'https://github.com/...' Could not resolve host: github.com`

**sbx-c (idle):**
```json
{
  "status": "idle",
  "phase": "waiting",
  "waiting_reason": "Waiting for dependencies (11 features blocked)",
  "blocked_by": ["S2045.I1.F3", "S2045.I2.F1", "S2045.I2.F2"]
}
```

### Manifest State

```json
{
  "id": "S2045.I1.F2",
  "status": "in_progress",
  "retry_count": 3,
  "assigned_sandbox": "sbx-a",
  "tasks_completed": 4,
  "task_count": 6,
  "requires_database": true,
  "database_task_count": 6
}
```

### GPT Agent Error Output (from sbx-b log)

```
**Why T5/T6 failed**
- Local Supabase requires Docker, and the environment blocks access to `/var/run/docker.sock`.
  Without a running local DB, migrations and typegen cannot succeed.

**Tasks failed:**
- [S2045.I1.F2.T5]: Apply migration to local database (local DB unavailable)
- [S2045.I1.F2.T6]: Generate TypeScript types (blocked by T5)
```

### Screenshots
N/A (terminal UI captured in user report)

## Error Stack Traces

No stack traces — the failure is environmental (Docker not available in E2B sandbox), not a code crash.

## Related Code

- **Affected Files**:
  - `.ai/alpha/specs/S2045-Spec-user-dashboard/S2045.I1-Initiative-foundation-data-layer/S2045.I1.F2-Feature-activity-events-database/tasks.json` — Task T5/T6 verification commands reference local Supabase
  - `.ai/alpha/scripts/lib/work-loop.ts` — Stall recovery + retry logic
  - `.ai/alpha/scripts/lib/feature.ts` — Feature execution + completion handling
  - `.ai/alpha/scripts/lib/deadlock-handler.ts` — Deadlock detection
  - `.ai/alpha/scripts/lib/work-queue.ts` — `DEFAULT_MAX_RETRIES = 3`
  - `.ai/alpha/scripts/lib/database.ts` — `syncFeatureMigrations()` (the correct remote DB mechanism)
- **Recent Changes**: #2056 (3 stall recovery blind spots), #2054 (progress updates), #2050 (writeOverallProgress)
- **Suspected Functions**: Task decomposition for database features, stall recovery cycle timing

## Related Issues & Context

### Direct Predecessors
- #2054 (CLOSED): "Overall Progress still shows 0 tasks during execution" — same S2045 run, progress display issue
- #2050 (CLOSED): "Overall Progress Shows 0 Tasks During Feature Execution" — related regression
- #2056 (CLOSED): "3 stall recovery blind spots in Alpha orchestrator" — fixed deadlock detection gaps

### Related Infrastructure Issues
- #1955 (CLOSED): "Centralize feature status transitions" — foundational refactor that added `transitionFeatureStatus()`
- #1957 (CLOSED): "Add runtime validation for progress file status values" — prevents invalid status propagation
- #1959 (CLOSED): "Reduce sandbox stagger from 60s to 30s" — startup optimization

### Similar Symptoms
- #1952 (from S1918): "blocked" status from GPT agent created unrecoverable state — similar pattern of agent writing invalid status
- S1918 deadlock: 33% completion (6/18) in 78 min — similar scale of deadlock

### Historical Context
This is the third deadlock scenario in the Alpha orchestrator (S1918, S2045 run 1, now S2045 run 2). Each time the root pattern is the same: a single feature fails repeatedly, blocking all downstream features. The orchestrator's retry mechanism works correctly but slowly (10-15 min per detection cycle). The deeper issue is task decomposition creating tasks that are fundamentally impossible in the E2B environment.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Feature S2045.I1.F2 tasks T5 and T6 use verification commands that require a local Docker-based Supabase instance (`supabase migration up` + `psql 127.0.0.1:54322`), which is impossible in E2B sandboxes. Combined with a critical dependency chain (12/14 features depend on this feature), this creates a guaranteed deadlock.

**Detailed Explanation**:

**Root Cause 1 — Task decomposition creates impossible tasks (PRIMARY):**

The task decomposition for S2045.I1.F2 generated verification commands targeting a LOCAL Supabase instance:
- T5: `pnpm --filter web supabase migration up` → requires local Docker (port 54322/54522)
- T5 verification: `psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'`
- T6: `pnpm supabase:web:typegen` → requires local Supabase introspection

E2B sandboxes don't have Docker. The orchestrator already has a remote Supabase sandbox project configured with `syncFeatureMigrations()` (in `database.ts`) that uses `supabase db push --linked` to apply migrations remotely. But the task decomposition didn't account for this — it used the standard local development workflow commands.

**Root Cause 2 — Slow deterministic failure recovery (SECONDARY):**

The stall recovery cycle takes ~15 minutes per attempt:
- Agent runs for ~5 minutes before encountering the error
- Promise timeout detection requires both PROMISE_TIMEOUT_MS (10 min) AND HEARTBEAT_TIMEOUT_MS (5 min) to be stale
- With DEFAULT_MAX_RETRIES = 3, the feature goes through 4 total attempts (initial + 3 retries) before permanent failure
- Total wasted time: ~60 minutes

The orchestrator has no mechanism to detect "deterministic failure" — when the same environmental error occurs on every retry, retrying is pointless.

**Root Cause 3 — Critical dependency bottleneck (CONTRIBUTING):**

The dependency graph creates a massive single point of failure:
```
S2045.I1.F2 (Activity Events Database) ← BLOCKED (impossible in E2B)
    ├── S2045.I1.F3 (Dashboard Data Loader) — depends on I1.F2
    │   ├── S2045.I3.F1 (Presentation Outlines Table) — depends on I1.F3
    │   ├── S2045.I3.F3 (Quick Actions Panel) — depends on I1.F3
    │   └── S2045.I3.F4 (Recent Activity Feed) — depends on I1.F2 + I1.F3
    ├── S2045.I2.F1-F3 (all 3) — depend on S2045.I1 (initiative)
    └── S2045.I4.F1-F4 (all 4) — depend on S2045.I2 + I3

Total blocked: 12 of 14 features (86%)
```

**Supporting Evidence**:
- sbx-b log line 18036: `S2045.I1.F2.T5 apply migration: failed (local DB connection to 127.0.0.1:54522 not permitted; no local Supabase)`
- sbx-a progress: `pnpm --filter web supabase start ❌ (Docker socket permission denied)`
- GPT agent explicitly stated: "Local Supabase requires Docker, and the environment blocks access to /var/run/docker.sock"
- Manifest shows retry_count: 3 with status still "in_progress" (4th attempt ongoing)
- 12 of 14 features have direct/transitive dependency on S2045.I1.F2

### How This Causes the Observed Behavior

1. S2045.I1.F2 is assigned to sandbox
2. Agent completes T1-T4 (schema, RLS, triggers, migration file) successfully
3. T5 fails: `supabase migration up` requires Docker which E2B doesn't have
4. Agent sets status "failed", exits
5. Orchestrator detects failure after ~10 min (promise timeout + heartbeat staleness)
6. Orchestrator retries (retry_count < 3), same failure occurs
7. After 3 retries (~45-60 min), feature should be marked permanently failed
8. Meanwhile, sbx-c has been idle the entire time — all unblocked features are already done (I1.F1, I3.F2)
9. Deadlock handler detects blocked features, marks initiative as failed, exits
10. Net result: 2/14 features completed in 1.5 hours with 2 of 3 sandboxes wasting time on retries

### Confidence Level

**Confidence**: High

**Reasoning**: The GPT agent's own output explicitly identifies the cause ("Docker socket permission denied", "Local Supabase requires Docker"). The task T5 verification command `psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'` is provably impossible in E2B. The retry_count: 3 in the manifest confirms 3 failed retry attempts. The dependency graph analysis confirms 12/14 features are blocked.

## Fix Approach (High-Level)

### Fix 1: Task Decomposition (Spec Issue — Recommendation)

The `/alpha:task-decompose` command (or the user during task review) should ensure database feature tasks use **remote Supabase sandbox commands** instead of local ones. Specifically for S2045.I1.F2:

- **T5 should use**: `supabase db push --linked` (pushes migration to remote sandbox project) instead of `supabase migration up` (requires local Docker)
- **T5 verification should use**: `psql "$SUPABASE_SANDBOX_DB_URL" -c "SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'activity_event_%';"` (remote) instead of `psql 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'` (local)
- **T6 should use**: The orchestrator's `syncFeatureMigrations()` already handles remote typegen, or typegen should run against the remote sandbox DB

Alternatively, T5 and T6 can be removed entirely — the orchestrator's post-feature `syncFeatureMigrations()` already handles applying migrations to the remote database and the schema+migration files are the real deliverables.

### Fix 2: Task Decomposer Guardrail (Orchestrator Enhancement)

Add validation in `/alpha:task-decompose` to detect and reject verification commands that reference `127.0.0.1`, `localhost`, or `supabase migration up` (which requires local Docker). Replace with remote sandbox equivalents automatically.

### Fix 3: Faster Deterministic Failure Detection (Orchestrator Enhancement)

When a feature fails with the same error pattern across retries, reduce PROMISE_TIMEOUT_MS for subsequent retries or mark as permanently failed sooner. For example: if retry 1 and retry 2 produce the same error substring ("Docker socket permission denied"), skip retry 3 and mark as failed immediately.

## Diagnosis Determination

The stall is caused by a **spec decomposition issue**, not an orchestrator code bug. The task decomposition for S2045.I1.F2 created tasks with local-database verification commands that are impossible in E2B sandboxes. The orchestrator's stall recovery mechanisms work correctly but slowly, wasting ~60 minutes on retries before reaching permanent failure and deadlock resolution.

**Recommendation**: Re-decompose S2045.I1.F2 with remote sandbox database commands, or remove T5/T6 entirely since the orchestrator already handles migration sync post-feature. Then re-run the orchestrator.

## Additional Context

- The orchestrator already has `syncFeatureMigrations()` in `database.ts` that pushes migrations to the remote Supabase sandbox project after feature completion
- The orchestrator's seeding flow (documented in alpha-implementation-system.md) uses `supabase db push` with the remote sandbox project, confirming the remote pattern works
- #2056 (merged before this run) fixed feature-level dependency detection in `getBlockingFailedFeatures()`, which would help the deadlock handler detect this scenario faster
- S1918 had a similar deadlock pattern (33% completion before deadlock) suggesting this is a recurring architectural vulnerability

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (spec-orchestrator.ts, work-loop.ts, feature.ts, deadlock-handler.ts, work-queue.ts, promise-age-tracker.ts, constants.ts, tasks.json, progress files, logs), Glob (logs, progress, lib files), Bash (git log, wc), Task (GitHub issue fetcher)*
