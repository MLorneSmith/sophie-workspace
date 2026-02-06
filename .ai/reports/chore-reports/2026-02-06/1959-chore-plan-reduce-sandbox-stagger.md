# Chore: Reduce sandbox stagger from 60s to 30s with OAuth retry backoff

## Chore Description

The Alpha Spec Orchestrator currently waits 60 seconds between sandbox creations to avoid API thundering herd problems (see bug fix #1449). With the E2B hardware upgrade to 4 vCPU / 4 GB RAM now complete (Q1), the original conditions that required 60s stagger have changed -- sandboxes start faster and the OAuth session limit concern can be addressed more precisely with retry backoff instead of a blanket 60s delay.

This chore reduces `SANDBOX_STAGGER_DELAY_MS` from 60,000ms to 30,000ms and adds an exponential backoff retry mechanism specifically for sandbox creation failures (OAuth session limits, rate limiting, E2B API errors). This saves ~30s per additional sandbox (~60s total for a typical 3-sandbox run) while maintaining safety through targeted retry logic.

**Source**: Assessment report Q2 recommendation in `.ai/reports/research-reports/2026-02-06/alpha-orchestrator-comprehensive-assessment.md`

## Relevant Files

Use these files to resolve the chore:

- `.ai/alpha/scripts/config/constants.ts` - Contains `SANDBOX_STAGGER_DELAY_MS = 60000` (line 118). Primary constant to change.
- `.ai/alpha/scripts/config/index.ts` - Barrel export for constants. May need new exports if we add retry constants.
- `.ai/alpha/scripts/lib/orchestrator.ts` - Lines 682-721: Two stagger `sleep()` call sites in sandbox creation loops. These use `SANDBOX_STAGGER_DELAY_MS` directly. Needs retry-on-failure wrapping around `createSandbox()` calls.
- `.ai/alpha/scripts/lib/sandbox.ts` - Lines 55-84: Contains existing exponential backoff pattern for `pnpm install` (`RETRY_BASE_DELAY_MS = 3000`, `DEFAULT_INSTALL_MAX_RETRIES = 3`). Reference implementation for retry pattern.
- `.ai/alpha/scripts/lib/startup-monitor.ts` - Contains existing `getRetryDelay()` and `shouldRetry()` functions. Can be used as reference but is startup-specific.
- `.ai/alpha/scripts/lib/environment.ts` - Line 415-424: OAuth token injection and auth method detection. Context for understanding OAuth session limit concerns.
- `.ai/alpha/scripts/lib/feature.ts` - Lines 394-656: Existing startup retry loop with exponential backoff. Reference for retry pattern integration.
- `.ai/alpha/scripts/lib/__tests__/startup-monitor.spec.ts` - Existing tests for retry logic. Reference for testing pattern.

### New Files

- `.ai/alpha/scripts/lib/__tests__/sandbox-creation-retry.spec.ts` - Unit tests for the new sandbox creation retry logic.

## Impact Analysis

This change affects the orchestrator startup phase only -- the time between creating sequential sandboxes. It does not affect sandbox behavior once created, feature execution, or any user-facing functionality.

### Dependencies Affected

- `orchestrator.ts` imports `SANDBOX_STAGGER_DELAY_MS` from config -- will use new value automatically
- No downstream packages depend on the stagger constant
- No API contracts or interfaces change

### Risk Assessment

**Low Risk**:
- Simple constant change (60000 -> 30000) is trivially reversible
- Retry logic follows well-tested existing patterns in the codebase
- Only affects orchestrator startup phase (3-5 min window)
- E2B hardware upgrade (Q1) already reduces pressure on the bottleneck
- Environment variable override can be added for quick runtime adjustment

### Backward Compatibility

- Fully backward compatible -- no API changes, no behavioral changes for consumers
- The stagger delay is an internal implementation detail
- Adding an env var override (`ALPHA_SANDBOX_STAGGER_MS`) provides runtime escape hatch

## Pre-Chore Checklist

Before starting implementation:
- [x] Create feature branch: `chore/reduce-sandbox-stagger`
- [x] Review original bug fix #1449 context (thundering herd)
- [x] Verify E2B hardware upgrade (Q1) is complete
- [x] Identify all consumers of `SANDBOX_STAGGER_DELAY_MS` (2 call sites in orchestrator.ts)
- [ ] No database changes needed

## Documentation Updates Required

- Update comment on `SANDBOX_STAGGER_DELAY_MS` in `constants.ts` to reflect new rationale
- Update comment referencing bug fix #1449 to note the reduction and new retry mechanism
- No CLAUDE.md changes needed (memory file already documents 60s->30s recommendation)
- No user-facing documentation changes

## Rollback Plan

1. Revert `SANDBOX_STAGGER_DELAY_MS` back to `60000` in `constants.ts`
2. OR set `ALPHA_SANDBOX_STAGGER_MS=60000` environment variable at runtime (if env override is implemented)
3. Retry logic additions are additive and safe to leave in place even if stagger is reverted
4. No database migrations to roll back

## Step by Step Tasks

### Step 1: Add environment variable override and reduce stagger constant

- In `.ai/alpha/scripts/config/constants.ts`:
  - Change `SANDBOX_STAGGER_DELAY_MS` from `60000` to `30000`
  - Add environment variable override: `process.env.ALPHA_SANDBOX_STAGGER_MS`
  - Update the JSDoc comment to explain:
    - Reduced from 60s to 30s after E2B hardware upgrade (Q1)
    - Original 60s was conservative prevention for OAuth session limits (#1449)
    - Now relies on targeted retry backoff instead of blanket delay
    - Can be overridden via `ALPHA_SANDBOX_STAGGER_MS` env var

### Step 2: Add sandbox creation retry constants

- In `.ai/alpha/scripts/config/constants.ts`, add new constants:
  - `SANDBOX_CREATION_MAX_RETRIES = 2` -- max retry attempts for sandbox creation
  - `SANDBOX_CREATION_RETRY_BASE_DELAY_MS = 10000` -- 10s base delay (10s, 20s backoff)
  - These follow the existing pattern from `RETRY_BASE_DELAY_MS` in sandbox.ts
- In `.ai/alpha/scripts/config/index.ts`:
  - Export the two new constants

### Step 3: Add sandbox creation retry wrapper in orchestrator.ts

- In `.ai/alpha/scripts/lib/orchestrator.ts`:
  - Import `SANDBOX_CREATION_MAX_RETRIES` and `SANDBOX_CREATION_RETRY_BASE_DELAY_MS`
  - Create a local helper function `createSandboxWithRetry()` that:
    - Calls `createSandbox()` in a try/catch
    - On failure, logs the error with sandbox label
    - Retries up to `SANDBOX_CREATION_MAX_RETRIES` times with exponential backoff (`base * attempt`)
    - Throws after max retries exhausted
  - Replace both `createSandbox()` call sites (lines ~689, ~712) with `createSandboxWithRetry()`
  - Keep the existing stagger `sleep(SANDBOX_STAGGER_DELAY_MS)` calls unchanged -- they now use the reduced 30s value

### Step 4: Write unit tests for sandbox creation retry

- Create `.ai/alpha/scripts/lib/__tests__/sandbox-creation-retry.spec.ts`:
  - Test 1: Successful creation on first attempt (no retry)
  - Test 2: Failure then success on retry (verify backoff delay)
  - Test 3: All retries exhausted (verify error propagation)
  - Test 4: Verify backoff timing (10s, 20s)
  - Mock `createSandbox` to simulate failures
  - Follow existing test patterns from `startup-monitor.spec.ts`

### Step 5: Verify existing tests still pass

- Run orchestrator tests: `cd .ai/alpha/scripts && npx vitest run lib/__tests__/`
- Run typecheck: `cd .ai/alpha/scripts && npx tsc --noEmit`
- Verify no tests reference hardcoded 60000ms stagger values (already confirmed: none do)

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# Typecheck the orchestrator scripts
cd .ai/alpha/scripts && npx tsc --noEmit

# Run all orchestrator unit tests
cd .ai/alpha/scripts && npx vitest run lib/__tests__/

# Verify the constant was changed
grep -n "SANDBOX_STAGGER_DELAY_MS" .ai/alpha/scripts/config/constants.ts

# Verify new retry constants exist
grep -n "SANDBOX_CREATION_MAX_RETRIES\|SANDBOX_CREATION_RETRY_BASE_DELAY_MS" .ai/alpha/scripts/config/constants.ts

# Verify new constants are exported
grep -n "SANDBOX_CREATION" .ai/alpha/scripts/config/index.ts

# Verify retry wrapper is used in orchestrator
grep -n "createSandboxWithRetry" .ai/alpha/scripts/lib/orchestrator.ts

# Verify env var override is in place
grep -n "ALPHA_SANDBOX_STAGGER_MS" .ai/alpha/scripts/config/constants.ts
```

## Notes

- The 60s stagger was introduced in bug fix #1449 as a conservative measure against "API thundering herd" where multiple Claude CLI instances starting simultaneously caused OAuth session limits and rate limiting. With the E2B hardware upgrade (4 vCPU / 4 GB), sandboxes initialize faster and the bottleneck shifts to agent startup rather than sandbox creation.
- The retry-with-backoff approach is more precise than a blanket delay because it only adds time when there's an actual failure, rather than penalizing every creation.
- For a typical 3-sandbox run: saves ~30s per additional sandbox = ~60s total startup reduction.
- The `ALPHA_SANDBOX_STAGGER_MS` env var override allows quick runtime adjustment without code changes, useful if a specific deployment environment has stricter rate limits.
- This chore is independent of P1 (centralized state transitions), P2 (dead code removal), and P3 (runtime status validation) -- can be done in parallel.
