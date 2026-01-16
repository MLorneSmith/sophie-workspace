# Bug Fix: ESM Import Hoisting Race Condition with Environment Variables

**Related Diagnosis**: #1512 (REQUIRED)
**Severity**: high
**Bug Type**: environment-configuration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: ES Module import hoisting executes imports before top-level code, capturing undefined environment variables before `loadEnvFile()` runs
- **Fix Approach**: Convert const exports to getter functions that read `process.env` lazily at call time instead of module load time
- **Estimated Effort**: small
- **Breaking Changes**: no (getter functions are API-compatible with const accesses when properly replaced at call sites)

## Solution Design

### Problem Recap

The Alpha Spec Orchestrator fails with "Missing required Supabase configuration" even when `SUPABASE_ACCESS_TOKEN` and `SUPABASE_SANDBOX_PROJECT_REF` are correctly set in the environment file.

**Root cause**: ES Modules hoist all imports, executing them BEFORE top-level code:

1. **FIRST**: All imports execute (hoisted)
   - `environment.ts` evaluates `export const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN`
   - At this moment, `process.env.SUPABASE_ACCESS_TOKEN` is `undefined` because `loadEnvFile()` hasn't run yet

2. **THEN**: Top-level code runs
   - `loadEnvFile()` sets `process.env.SUPABASE_ACCESS_TOKEN`
   - But the `const` exports already captured `undefined`

For full details, see diagnosis issue #1512.

### Solution Approaches Considered

#### Option 1: Convert to Getter Functions ⭐ RECOMMENDED

**Description**: Replace const exports with functions that read `process.env` at call time

```typescript
// Before (broken - captures at load time):
export const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

// After (works - reads at call time):
export function getSupabaseAccessToken(): string | undefined {
  return process.env.SUPABASE_ACCESS_TOKEN;
}
```

**Pros**:
- Guaranteed to read fresh environment variable state after `loadEnvFile()`
- No timing/execution order issues
- Simple, mechanical fix
- Works with dynamic environment changes
- Minimal code changes needed

**Cons**:
- Requires updating all call sites (but only 3 files affected)
- Slightly more verbose at call sites (`getSupabaseAccessToken()` vs `SUPABASE_ACCESS_TOKEN`)

**Risk Assessment**: low - straightforward function replacement, well-understood pattern

**Complexity**: simple - mechanical changes only

#### Option 2: Lazy Initialization with `once()`

**Description**: Use a lazy initialization pattern with caching to read variables on first access

```typescript
let cachedToken: string | undefined;
export function getSupabaseAccessToken(): string | undefined {
  if (!cachedToken) {
    cachedToken = process.env.SUPABASE_ACCESS_TOKEN;
  }
  return cachedToken;
}
```

**Pros**:
- Reads value only once (slightly more efficient)
- Same benefits as getter functions

**Cons**:
- More complex than simple getters
- Unnecessary optimization for this use case (environment files don't change during execution)
- Adds caching complexity without real benefit

**Why Not Chosen**: Adds unnecessary complexity for no real benefit. Simple getters are clearer and sufficient.

#### Option 3: Move `loadEnvFile()` to ESM Module Level

**Description**: Create a separate module that loads env file, then import from it

```typescript
// env-loader.mts
import { loadEnvFile } from 'node:process';
loadEnvFile();

// Then import environment.ts after this runs
export {};
```

**Pros**:
- Could work if executed in correct order

**Cons**:
- Fragile - depends on correct import order
- Doesn't guarantee execution before environment module
- ESM still hoists all imports regardless of order
- More complex than necessary

**Why Not Chosen**: Fundamental limitation of ESM - imports are always hoisted. This doesn't solve the underlying problem.

### Selected Solution: Convert to Getter Functions

**Justification**: This is the simplest, most direct fix. Getter functions guarantee lazy evaluation after `loadEnvFile()` completes. The fix is mechanical, affects only 3 files, and requires no dependency changes or architectural modifications.

**Technical Approach**:
- Convert const exports to functions in `environment.ts`
- Update all call sites to invoke the getters (`SUPABASE_ACCESS_TOKEN` → `getSupabaseAccessToken()`)
- Add clear comments explaining why we use getters
- Ensure TypeScript types are correct (return types match previous const types)

**Architecture Changes**: None - this is a pure implementation detail change. The public API changes from `const` to `function`, but both are called at the same call sites with `.()` added.

**Migration Strategy**: Not needed - a single, focused change across 3 files. No data or state to migrate.

## Implementation Plan

### Affected Files

List files that need modification:

- `.ai/alpha/scripts/lib/environment.ts` (lines 97-99) - Convert const exports to getter functions
- `.ai/alpha/scripts/lib/sandbox.ts` (lines 103-111) - Update validation call sites
- `.ai/alpha/scripts/spec-orchestrator.ts` (potential call sites) - Update any references

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update environment.ts to use getter functions

Convert the constant exports to getter functions that read `process.env` at call time:

- Change `export const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN` to `export function getSupabaseAccessToken(): string | undefined { return process.env.SUPABASE_ACCESS_TOKEN; }`
- Change `export const SUPABASE_SANDBOX_PROJECT_REF = process.env.SUPABASE_SANDBOX_PROJECT_REF` to `export function getSupabaseProjectRef(): string | undefined { return process.env.SUPABASE_SANDBOX_PROJECT_REF; }`
- Add JSDoc comments explaining why we use getters (ESM hoisting issue)
- Verify TypeScript compilation succeeds

**Why this step first**: Foundation - must update source exports before updating call sites

#### Step 2: Update sandbox.ts validation to use getter functions

Update the `validateSupabaseConfig()` function to call the new getter functions:

- Change `SUPABASE_ACCESS_TOKEN` to `getSupabaseAccessToken()`
- Change `SUPABASE_SANDBOX_PROJECT_REF` to `getSupabaseProjectRef()`
- Verify the validation logic remains unchanged
- Test that validation passes when env vars are set

#### Step 3: Search for and update other call sites

Search the entire `.ai/alpha/scripts/` directory for any other references to the old constants:

- `grep -r "SUPABASE_ACCESS_TOKEN" .ai/alpha/scripts/` to find all usages
- `grep -r "SUPABASE_SANDBOX_PROJECT_REF" .ai/alpha/scripts/` to find all usages
- Update each call site to use the getter functions
- Verify no references to old const names remain

#### Step 4: Validate the fix

- Run TypeScript compiler to ensure no type errors: `pnpm typecheck`
- Run linter and formatter: `pnpm lint:fix && pnpm format:fix`
- Manually test orchestrator with env file: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- Verify no "Missing required Supabase configuration" error appears
- Check that orchestrator properly reads token from environment file

#### Step 5: Verify no regressions

- Run any existing tests for orchestrator or environment utilities
- Manually test with missing env vars to confirm validation still catches errors
- Test with partial env var set (only token, no project ref) to verify partial validation works

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `getSupabaseAccessToken()` returns value from `process.env.SUPABASE_ACCESS_TOKEN`
- ✅ `getSupabaseProjectRef()` returns value from `process.env.SUPABASE_SANDBOX_PROJECT_REF`
- ✅ Getters return `undefined` when env var not set
- ✅ Getters return correct values after `loadEnvFile()`

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/environment.test.ts` - Tests for getter functions

### Integration Tests

- ✅ `validateSupabaseConfig()` succeeds when env vars are set via `loadEnvFile()`
- ✅ `validateSupabaseConfig()` throws error when env vars are missing
- ✅ Orchestrator starts successfully with proper environment file

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Set `SUPABASE_ACCESS_TOKEN` and `SUPABASE_SANDBOX_PROJECT_REF` in `.env` or local environment file
- [ ] Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Verify no "Missing required Supabase configuration" error (original bug should NOT appear)
- [ ] Verify orchestrator proceeds past validation to normal execution
- [ ] Clear/unset environment variables and run orchestrator again
- [ ] Verify validation error appears when env vars are truly missing
- [ ] Run with only one env var set - verify appropriate error for missing var
- [ ] Run `pnpm typecheck` - must pass with zero errors
- [ ] Run `pnpm lint` and `pnpm format` - must pass

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Missing call sites**: Some references to old constants not found and updated
   - **Likelihood**: low
   - **Impact**: medium (orchestrator would still fail with undefined error)
   - **Mitigation**: Comprehensive grep search for all occurrences before committing. Use TypeScript type checking to catch references to const names.

2. **Type mismatch**: Getter functions return `string | undefined` but call sites expect `string`
   - **Likelihood**: low
   - **Impact**: high (runtime error if not validated)
   - **Mitigation**: Keep validation logic strict - `validateSupabaseConfig()` ensures values exist before use. TypeScript will catch most issues at compile time.

3. **Performance**: Function calls slightly slower than const access
   - **Likelihood**: high
   - **Impact**: negligible (orchestrator is not performance-critical, runs once per spec)
   - **Mitigation**: Not a concern for this use case. getters are microseconds per call.

**Rollback Plan**:

If this fix causes issues:
1. Revert changes to `environment.ts`, `sandbox.ts`, and any call sites
2. Return const exports: `export const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN`
3. Verify orchestrator fails again with same error (confirms revert worked)
4. Original bug will reappear but no new issues introduced

**Monitoring** (not needed):
- This is a tooling fix, not production code
- Success is deterministic - either orchestrator validates and runs, or it doesn't

## Performance Impact

**Expected Impact**: none

No performance implications. Getter functions are microseconds faster/slower than const access. Orchestrator runs once per spec and is not performance-critical.

## Security Considerations

**Security Impact**: none

No security implications. Environment variables are already being read by `loadEnvFile()`. Getter functions don't change what data is exposed or how it's stored.

## Validation Commands

### Before Fix (Bug Should Reproduce)

If you revert to the buggy code:

```bash
# With env vars set in .env file but not shell environment
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

**Expected Result**: "Missing required Supabase configuration" error, orchestrator fails

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Manual verification (orchestrator should start successfully)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362
```

**Expected Result**: All commands succeed, no type errors, no lint issues. Orchestrator validates environment successfully and proceeds to normal execution.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Specific check: orchestrator tests
pnpm --filter @kit/alpha test
```

## Dependencies

### New Dependencies (if any)

No new dependencies required. Uses only Node.js built-in modules.

## Database Changes

**Migration needed**: no

No database changes required. This is a pure environment configuration fix at the tooling level.

## Deployment Considerations

**Deployment Risk**: low

This is a tooling fix, not production code. No deployment needed. Changes only affect local orchestrator script execution.

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

Getter functions are API-compatible. Call sites updated from `SUPABASE_ACCESS_TOKEN` to `getSupabaseAccessToken()`.

## Success Criteria

The fix is complete when:
- [ ] All constant exports converted to getter functions in `environment.ts`
- [ ] All call sites updated to use getter functions
- [ ] TypeScript compiler passes (`pnpm typecheck`)
- [ ] Linter and formatter pass (`pnpm lint:fix && pnpm format:fix`)
- [ ] Orchestrator successfully validates environment when env vars set
- [ ] Orchestrator properly reports error when env vars missing
- [ ] Manual testing checklist complete
- [ ] No regressions in existing tests

## Notes

**Related work**:
- #1511: Added fail-fast validation that surfaced this pre-existing race condition

**Why this bug existed**:
The bug existed because environment configuration was captured at module import time. This is a classic ESM gotcha - imports are hoisted and execute before top-level code. The validation from #1511 exposed this by checking values immediately at orchestrator start.

**Prevention**:
Future environment configuration should use getter functions or lazy initialization patterns by default when dynamic configuration is needed.

**Related documentation**:
- ESM hoisting: https://javascript.info/modules-dynamic-import (section on timing)
- Node.js `loadEnvFile()`: https://nodejs.org/api/process.html#processloadenvfilepath

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1512*
