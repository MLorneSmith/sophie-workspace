# Chore: Optimize Alpha Orchestrator Startup Time

## Chore Description

Implement high-impact optimizations to reduce the Alpha orchestrator startup time from ~5 minutes to under 2 minutes. The current sequential execution of database operations, sandbox creation, and seeding creates unnecessary delays that could be eliminated through parallelization and smart caching.

This chore addresses diagnosis #1706 which identified three high-impact opportunities:
1. Parallelize database reset and sandbox creation (independent operations)
2. Check if database is seeded BEFORE creating sandboxes (avoid unnecessary seeding)
3. Document existing `--skip-db-reset` flag (already implemented but underutilized)

**Chore Type**: tooling
**Severity**: medium

## Relevant Files

### Files to Modify

- `.ai/alpha/scripts/lib/orchestrator.ts` (lines 1138-1360)
  - Contains the main orchestration startup sequence
  - Currently executes DB reset → sandbox creation → seeding sequentially
  - Needs refactoring to parallelize DB reset with sandbox creation

- `.ai/alpha/scripts/lib/database.ts`
  - Contains `isDatabaseSeeded()`, `resetSandboxDatabase()`, `seedSandboxDatabase()`
  - `isDatabaseSeeded()` is called too late in the startup sequence (after sandbox creation)
  - No changes needed to this file - just call ordering in orchestrator.ts

- `.ai/alpha/scripts/config/constants.ts`
  - Contains timeout constants
  - May need to adjust `SANDBOX_STAGGER_DELAY_MS` if parallelization changes timing assumptions

- `.ai/alpha/docs/alpha-implementation-system.md`
  - Documentation for the Alpha workflow
  - Needs update to document startup optimization flags and behavior

### Files to Reference (Read-Only)

- `.ai/alpha/scripts/cli/index.ts` - CLI flag parsing (already has `--skip-db-reset`, `--skip-db-seed`)
- `.ai/alpha/scripts/types/orchestrator.types.ts` - Type definitions for options
- `.ai/reports/bug-reports/2026-01-21/1706-diagnosis-orchestrator-slow-startup.md` - Root cause diagnosis

## Impact Analysis

### Dependencies Affected

- **Alpha orchestrator users**: Faster startup means quicker feedback loops
- **E2B sandbox API**: Parallel sandbox creation should not exceed rate limits (only 1-3 sandboxes)
- **Supabase database**: Concurrent operations (reset + sandbox linking) should not conflict

### Risk Assessment

**Medium Risk**:
- Touching core orchestration startup logic
- Parallelization introduces potential race conditions
- Database operations require careful ordering

Mitigations:
- Maintain existing sequential fallback behavior if parallel fails
- Add comprehensive error handling for parallel operations
- Test with various combinations of flags (`--skip-db-reset`, `--skip-db-seed`)

### Backward Compatibility

- **Fully backward compatible**: No breaking changes to CLI interface
- Existing flags (`--skip-db-reset`, `--skip-db-seed`) remain unchanged
- Default behavior (without flags) will be faster but produce same results

## Pre-Chore Checklist

Before starting implementation:
- [x] Create feature branch: `chore/orchestrator-startup-optimization`
- [x] Review diagnosis #1706 for root cause analysis
- [x] Verify existing `--skip-db-reset` and `--skip-db-seed` flags work
- [x] Identify all consumers of code being refactored (just orchestrator.ts)
- [ ] No database migrations needed for this chore

## Documentation Updates Required

- `.ai/alpha/docs/alpha-implementation-system.md` - Add section on startup optimization
- `CLAUDE.md` - Add orchestrator startup flags to Pre-Approved Commands section
- No CHANGELOG.md needed (internal tooling)

## Rollback Plan

1. **Immediate rollback**: Revert the commit on `chore/orchestrator-startup-optimization` branch
2. **No database changes**: This chore only affects TypeScript orchestration code
3. **Monitoring**: Compare startup times before/after in orchestrator logs
4. **Detection**: If startup fails, the orchestrator will fail fast with clear error messages

## Step by Step Tasks

### Step 1: Check Database Seeded Status Early

Move the `isDatabaseSeeded()` check to happen BEFORE sandbox creation, not after. This allows us to skip seeding entirely for subsequent runs.

**Current flow (orchestrator.ts:1313-1336)**:
```
1. Create sandboxes
2. Check if seeded
3. If not seeded, run seeding
```

**New flow**:
```
1. Check if seeded (quick psql query)
2. Store result in variable
3. Create sandboxes
4. If not seeded AND first run, run seeding
```

Changes:
- Move `isDatabaseSeeded()` call to before sandbox creation (around line 1190)
- Store result in a variable `const alreadySeeded = await isDatabaseSeeded(options.ui);`
- Use this variable later when deciding whether to seed

### Step 2: Parallelize Database Reset and Sandbox Creation

Database reset and sandbox creation are independent operations. Run them concurrently using `Promise.all()`.

**Current flow (orchestrator.ts:1159-1306)**:
```
1. Reset database (30-120s) ← SEQUENTIAL
2. Clean stale state
3. Create sandbox (30-60s) ← SEQUENTIAL
```

**New flow**:
```
1. Check if already seeded (quick query)
2. Start parallel operations:
   a. Reset database (if needed)
   b. Create first sandbox
3. Clean stale state (while waiting)
4. Await both operations
5. Seed database via sandbox (if not already seeded)
```

Implementation:
- Create a helper function `parallelStartup()` that coordinates:
  - `resetSandboxDatabase()` - runs independently
  - `createSandbox()` - runs independently
  - Both are Promise-based, can use `Promise.all()`
- Handle errors from either operation gracefully
- Maintain sequential fallback if parallel execution fails

### Step 3: Reduce UI Ready Polling Timeout

The UI typically becomes ready in <2 seconds, but the current timeout is 30 seconds with 500ms polling.

**Current (orchestrator.ts:1146)**:
```typescript
await waitForUIReady(30000, 500, log);
```

**New**:
```typescript
await waitForUIReady(10000, 200, log); // 10s timeout, 200ms poll
```

This reduces worst-case delay from 30s to 10s while still being generous.

### Step 4: Add Startup Time Logging

Add timing instrumentation to measure the effectiveness of optimizations.

Add timing logs:
- Log timestamp at orchestration start
- Log timestamp after DB reset
- Log timestamp after sandbox creation
- Log timestamp after seeding
- Log total startup time before work loop begins

Example:
```typescript
const startupStart = Date.now();
// ... operations ...
const startupTime = Date.now() - startupStart;
log(`⏱️ Startup completed in ${(startupTime / 1000).toFixed(1)}s`);
```

### Step 5: Update Documentation

Update `.ai/alpha/docs/alpha-implementation-system.md` with:
- Startup optimization section explaining the parallel execution
- Flag documentation for `--skip-db-reset` and `--skip-db-seed`
- Typical startup times: cold start (~2 min), warm start (<60s)

### Step 6: Run Validation Commands

Execute all validation commands to confirm zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. TypeScript type checking
pnpm typecheck

# 2. Lint the orchestrator code
pnpm lint --filter ".ai/alpha/scripts/**/*.ts"

# 3. Format check
pnpm format

# 4. Test dry-run mode (no sandboxes created)
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S1692 --dry-run

# 5. Test with skip flags (validates flag parsing still works)
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S1692 --dry-run --skip-db-reset --skip-db-seed

# 6. Verify help output shows flags
pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts --help | grep -E "skip-db-(reset|seed)"

# 7. Full integration test (creates real sandbox, measures startup time)
# Run this manually and compare startup time to baseline (~5 min → <2 min expected)
time pnpm tsx .ai/alpha/scripts/spec-orchestrator.ts S1692 --sandboxes 1 2>&1 | head -100
```

## Notes

### Expected Performance Improvements

| Operation | Before | After | Savings |
|-----------|--------|-------|---------|
| DB reset + sandbox creation | 90-180s (sequential) | 60-120s (parallel) | 30-60s |
| Seeding check | After sandbox (5-15 min) | Before sandbox (<5s) | 5-15 min on repeat |
| UI ready wait | Up to 30s | Up to 10s | 0-20s |
| **Total cold start** | ~5-6 min | ~2 min | **60-70%** |
| **Total warm start** | ~5-6 min | <60s | **80-90%** |

### Important Considerations

1. **E2B Rate Limits**: Creating sandboxes in parallel is safe for 1-3 sandboxes. The 60s stagger delay between sandboxes is primarily for Claude CLI OAuth rate limiting, not E2B API limits.

2. **Database Operations Order**:
   - `checkDatabaseCapacity()` must run before `resetSandboxDatabase()`
   - `seedSandboxDatabase()` must run after sandbox is created (needs sandbox to run Payload commands)
   - `isDatabaseSeeded()` can run anytime (just reads from DB)

3. **Error Handling**: If parallel startup fails, the orchestrator should fail fast with clear error messages rather than hanging or producing partial state.

4. **Testing**: The `--dry-run` flag is useful for testing flag parsing without creating sandboxes. Full integration testing requires creating real E2B sandboxes.
