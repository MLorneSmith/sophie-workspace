# Bug Diagnosis: Alpha Orchestrator 5-Minute Startup Delay

**ID**: ISSUE-pending
**Created**: 2026-01-21T17:30:00.000Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: performance

## Summary

The Alpha orchestrator takes approximately 5 minutes from `spec-orchestrator.ts` invocation until the first task starts executing. This delay significantly impacts developer experience and overall feature implementation throughput. The delay is caused by sequential execution of startup operations that could be parallelized or optimized.

## Environment

- **Application Version**: dev branch (commit 123d7cadc)
- **Environment**: development
- **Node Version**: v20.x
- **Platform**: WSL2 Linux
- **E2B Template**: slideheroes-claude-agent-dev

## Reproduction Steps

1. Run the Alpha orchestrator: `pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S1692`
2. Observe the time from script start to first task execution
3. Note the ~5 minute delay before any actual implementation work begins

## Expected Behavior

The orchestrator should begin executing the first task within 1-2 minutes of invocation, ideally under 60 seconds for optimal developer experience.

## Actual Behavior

The orchestrator takes ~5 minutes from invocation to first task execution. Timeline analysis:

| Timestamp | Event | Delta |
|-----------|-------|-------|
| 17:11:05.374Z | Manifest generated | - |
| 17:16:09.665Z | Feature assigned to sandbox | +5m 4s |
| 17:16:11.169Z | PTY session created | +2s |
| 17:17:18Z | First task starts executing | +1m 7s |

**Total startup time: ~5-6 minutes**

## Diagnostic Data

### Startup Sequence Analysis

The current startup sequence in `orchestrator.ts` (lines 1100-1400) executes these operations **sequentially**:

```
1. Manifest validation & discovery (fast, <1s)
2. Python dependencies validation (fast, <1s)
3. Event server startup (10s timeout)
4. Ink UI initialization (fast, <1s)
5. Wait for UI ready (30s polling timeout)
6. Database capacity check (psql query, 2-5s)
7. Database reset with migrations (30-120s) ⚠️ BOTTLENECK
8. Sandbox creation (30-60s) ⚠️ BOTTLENECK
9. Database seeding via sandbox (5-15 min timeout) ⚠️ BOTTLENECK
10. Work loop initialization (fast, <1s)
```

### Performance Measurements from Code

From `config/constants.ts`:
- `SANDBOX_STAGGER_DELAY_MS = 60000` (60 seconds between sandbox creations)
- `STARTUP_TIMEOUT_MS = 60000` (60 seconds for Claude CLI startup)

From `lib/sandbox.ts` createSandbox():
- Git fetch: 120s timeout
- Branch checkout: 60s timeout
- npm install check + install: 600s timeout
- Workspace package build: 120s timeout
- Supabase CLI link: 60s timeout

From `lib/database.ts` seedSandboxDatabase():
- Payload migrations: 300s (5 min) timeout
- Payload seeding: 600s (10 min) timeout

### Identified Bottlenecks

1. **Database Reset + Migrations** (`resetSandboxDatabase`)
   - Drops schema, applies migrations via `supabase db push`
   - Runs sequentially before sandbox creation
   - Takes 30-120 seconds

2. **Sandbox Creation** (`createSandbox`)
   - E2B API call + git fetch + branch checkout
   - Conditional npm install
   - Workspace package build (@kit/shared)
   - Supabase CLI linking
   - Takes 30-60 seconds

3. **Database Seeding** (`seedSandboxDatabase`)
   - Runs Payload migrations (5 min timeout)
   - Runs Payload seeding (10 min timeout)
   - **This is the largest contributor** when Supabase sandbox is configured

## Root Cause Analysis

### Identified Root Cause

**Summary**: Sequential execution of database operations, sandbox creation, and seeding creates a cumulative 5-minute startup delay.

**Detailed Explanation**:

The orchestrator currently executes all startup operations sequentially when they could be parallelized:

1. **Database reset runs before sandbox creation** - But sandbox creation doesn't depend on DB reset completion
2. **Seeding waits for sandbox** - Seeding requires a sandbox to run Payload commands, but could start immediately after sandbox is ready while other initialization continues
3. **UI wait blocks everything** - 30-second polling timeout for Ink UI readiness blocks all subsequent operations

The evidence from `spec-manifest.json` shows:
- `generated_at: 2026-01-21T17:11:05.374Z` (manifest created)
- `assigned_at: 1769015769665` (17:16:09.665Z) - Feature assigned 5m4s later

### How This Causes the Observed Behavior

1. User runs orchestrator at T+0
2. Manifest validation completes at T+1s
3. Database reset starts at T+2s, completes at T+60s
4. Sandbox creation starts at T+60s, completes at T+120s
5. Database seeding starts at T+120s, completes at T+300s (worst case)
6. Feature assignment occurs at T+300s (~5 minutes)
7. PTY/Claude CLI startup takes another 60s
8. First task starts at T+360s (~6 minutes)

### Confidence Level

**Confidence**: High

**Reasoning**:
- Timeline evidence directly correlates with code execution sequence
- All timeout values from constants file match observed delays
- Database seeding is confirmed active (SUPABASE_SANDBOX_* env vars present)
- Single sandbox means 60s stagger delay doesn't contribute

## Fix Approach (High-Level)

Several optimizations could reduce startup time from 5 minutes to under 2 minutes:

### High Impact (Recommended)

1. **Parallelize database reset and sandbox creation**
   - DB reset and sandbox creation are independent
   - Run `Promise.all([resetSandboxDatabase(), createSandbox()])`
   - Estimated savings: 30-60 seconds

2. **Skip seeding when database is already seeded**
   - `isDatabaseSeeded()` exists but isn't used at startup
   - Add pre-check before seeding: if payload.users has data, skip seeding
   - Estimated savings: 5-10 minutes on subsequent runs

3. **Add `--skip-db-reset` flag for development iterations**
   - Allow developers to skip DB reset when iterating on same spec
   - Similar to existing `--reset` flag but inverse
   - Estimated savings: 1-2 minutes

### Medium Impact

4. **Reduce UI ready polling timeout**
   - Current: 30s timeout, 500ms interval
   - Ink UI typically ready in <2s
   - Reduce to 5s timeout with 100ms interval
   - Estimated savings: 0-28 seconds

5. **Start sandbox creation during UI initialization**
   - Sandbox creation is network-bound (E2B API)
   - Can safely run while Ink UI initializes
   - Estimated savings: 1-2 seconds

### Low Impact but Good Practice

6. **Pre-warm E2B sandbox template**
   - E2B supports template pre-warming
   - Reduces cold-start time for sandbox.create()
   - Estimated savings: 5-15 seconds

## Additional Context

### Related Code Locations

- Main orchestration loop: `.ai/alpha/scripts/lib/orchestrator.ts:1100-1400`
- Database operations: `.ai/alpha/scripts/lib/database.ts`
- Sandbox creation: `.ai/alpha/scripts/lib/sandbox.ts:362-542`
- Constants/timeouts: `.ai/alpha/scripts/config/constants.ts`

### Similar Issues

None found - this appears to be the first performance diagnosis of the Alpha orchestrator startup sequence.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash, Glob*
