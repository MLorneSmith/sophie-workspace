# Bug Fix: Suppress Console Logging in UI Mode for Alpha Orchestrator

**Related Diagnosis**: #1458
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Unconditional console.log calls in health.ts, database.ts, and progress.ts interfere with Ink terminal UI
- **Fix Approach**: Add createLogger utility and wrap all console.log calls with conditional logging based on uiEnabled flag
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Alpha Orchestrator crashes at ~5-6 minutes when running in UI mode because several modules (health.ts, database.ts, progress.ts) have direct `console.log` calls that are not wrapped with the `if (!uiEnabled)` check. These rogue console outputs interfere with Ink's terminal control, causing crashes or undefined behavior. The crash timing correlates with health check execution near the 5-minute PROGRESS_FILE_TIMEOUT_MS threshold.

For full details, see diagnosis issue #1458.

### Solution Approaches Considered

#### Option 1: Add createLogger Utility to Each Module ⭐ RECOMMENDED

**Description**: Add a `createLogger(uiEnabled)` utility function to each affected module (health.ts, database.ts, progress.ts) that returns a logger object with conditional logging. Pass `uiEnabled` parameter through the call chain from orchestrator.ts to all functions that need to log.

**Pros**:
- Consistent with existing pattern in orchestrator.ts, sandbox.ts, lock.ts, work-queue.ts, and feature.ts
- Type-safe and explicit - each module controls its own logging
- Zero risk of breaking other modules
- Simple to implement and understand
- Each module can customize log/error behavior if needed

**Cons**:
- Requires passing `uiEnabled` through function signatures (minor refactor)
- Adds one utility function per module (3 functions total)

**Risk Assessment**: low - This is the established pattern in the codebase, well-understood and proven to work

**Complexity**: simple - Straightforward copy of existing pattern, clear implementation path

#### Option 2: Centralized Logger Module

**Description**: Create a shared `logger.ts` module that exports a configured logger instance. Set the UI mode globally and import the logger in all modules.

**Pros**:
- Single source of truth for logging configuration
- No need to pass `uiEnabled` through function signatures
- Could add log levels, formatting, file logging in future

**Cons**:
- Introduces global state (uiEnabled must be set before any module imports)
- Module initialization order becomes critical
- Breaks the explicit parameter passing pattern established in the codebase
- Could cause subtle bugs if logger is used before configuration
- More architectural change for a simple problem

**Why Not Chosen**: Introduces unnecessary complexity and global state management when the established pattern works well. Would require careful initialization ordering and testing.

#### Option 3: Wrapper Functions with Conditional Logic

**Description**: Create wrapper functions like `logIfNotUI()` that check a global flag or environment variable before logging.

**Pros**:
- Minimal code changes
- No parameter passing needed

**Cons**:
- Global state issues (same as Option 2)
- Less explicit than current pattern
- Could mask logging issues in development
- Not consistent with existing codebase patterns

**Why Not Chosen**: Introduces global state and deviates from the established explicit parameter passing pattern used throughout the codebase.

### Selected Solution: Add createLogger Utility to Each Module

**Justification**: This approach is consistent with the existing codebase pattern, has low risk, requires minimal changes, and maintains explicit control flow. It's proven to work in 5 other modules (orchestrator.ts, sandbox.ts, lock.ts, work-queue.ts, feature.ts) and follows TypeScript best practices of explicit dependencies rather than global state.

**Technical Approach**:
- Add `createLogger(uiEnabled: boolean)` utility function to health.ts, database.ts, and progress.ts
- The utility returns an object with `log()` method that conditionally calls console.log
- Add `uiEnabled` parameter to all exported functions that need logging
- Thread `uiEnabled` from orchestrator.ts through the call chain
- Replace all direct `console.log` calls with `log()` calls from the logger

**Architecture Changes**:
- No architectural changes - this maintains the existing explicit parameter passing pattern
- Function signatures will gain `uiEnabled: boolean` parameter where needed
- The change is backwards compatible (default to false if not provided)

**Migration Strategy**:
Not needed - this is a transparent fix that maintains existing behavior while adding conditional logging.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/health.ts` - Add createLogger, pass uiEnabled through call chain
  - Lines with console.log: 117-120, 175, 188, 201, 210, 215, 220, 252, 258, 285, 288, 293
  - Functions: `checkSandboxHealth`, `killClaudeProcess`, `runHealthChecks`

- `.ai/alpha/scripts/lib/database.ts` - Add createLogger, pass uiEnabled through call chain
  - Lines with console.log: 33, 48, 68, 89, 93, 113, 120, 127, 159, 163, 167, 181, 184, 198, 201, 209
  - Functions: `checkDatabaseCapacity`, `resetSandboxDatabase`, `seedSandboxDatabase`

- `.ai/alpha/scripts/lib/progress.ts` - Add createLogger, pass uiEnabled through call chain
  - Lines with console.log: 68, 69, 74, 86, 89, 96, 104, 108, 120, 124
  - Function: `displayProgressUpdate`

- `.ai/alpha/scripts/lib/orchestrator.ts` - Update call sites to pass uiEnabled
  - Pass uiEnabled to: health check functions, database functions, progress functions

### New Files

None - all changes are to existing files.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add createLogger to health.ts

Add the createLogger utility function and thread uiEnabled through the call chain:

- Add createLogger utility at the top of health.ts (after imports, before first function):
  ```typescript
  function createLogger(uiEnabled: boolean) {
    return {
      log: (...args: unknown[]) => {
        if (!uiEnabled) console.log(...args);
      },
    };
  }
  ```

- Add `uiEnabled: boolean` parameter to `checkSandboxHealth()`:
  ```typescript
  export async function checkSandboxHealth(
    instance: SandboxInstance,
    manifest: SpecManifest,
    uiEnabled: boolean = false, // Add this parameter with default
  ): Promise<HealthCheckResult>
  ```

- Add `uiEnabled: boolean` parameter to `killClaudeProcess()`:
  ```typescript
  export async function killClaudeProcess(
    instance: SandboxInstance,
    uiEnabled: boolean = false,
  ): Promise<boolean>
  ```

- Add `uiEnabled: boolean` parameter to `runHealthChecks()`:
  ```typescript
  export async function runHealthChecks(
    instances: SandboxInstance[],
    manifest: SpecManifest,
    uiEnabled: boolean = false,
  ): Promise<void>
  ```

- Create logger at start of each function:
  ```typescript
  const { log } = createLogger(uiEnabled);
  ```

- Replace all `console.log(...)` with `log(...)`

**Why this step first**: health.ts is the primary culprit (most console.log calls) and the crash correlates with health check execution

#### Step 2: Add createLogger to database.ts

Apply the same pattern to database.ts:

- Add createLogger utility at the top of database.ts
- Add `uiEnabled: boolean = false` parameter to:
  - `checkDatabaseCapacity()`
  - `resetSandboxDatabase()`
  - `seedSandboxDatabase(sandbox: Sandbox, uiEnabled?: boolean)`
- Create logger at start of each function
- Replace all `console.log(...)` with `log(...)`

**Why this step second**: Database operations run during sandbox initialization, before the health check crash window

#### Step 3: Add createLogger to progress.ts

Apply the same pattern to progress.ts:

- Add createLogger utility at the top of progress.ts
- Add `uiEnabled: boolean = false` parameter to:
  - `displayProgressUpdate(sandboxLabel: string, progress: SandboxProgress, uiEnabled?: boolean)`
- Create logger at start of function
- Replace all `console.log(...)` with `log(...)`

**Why this step third**: Progress updates are less frequent and less likely to be the immediate crash trigger

#### Step 4: Update call sites in orchestrator.ts

Update all call sites that invoke these functions to pass the `uiEnabled` flag:

- Find all calls to `runHealthChecks()` and pass `uiEnabled`
- Find all calls to `checkSandboxHealth()` and pass `uiEnabled`
- Find all calls to `resetSandboxDatabase()` and pass `uiEnabled`
- Find all calls to `seedSandboxDatabase()` and pass `uiEnabled`
- Find all calls to `displayProgressUpdate()` and pass `uiEnabled`

The `uiEnabled` variable is already available in orchestrator.ts scope.

#### Step 5: Update call sites in other modules (if any)

Search for any other modules that call these functions and update them:

```bash
# Search for calls to these functions
grep -r "checkSandboxHealth\|runHealthChecks\|killClaudeProcess" .ai/alpha/scripts --include="*.ts" | grep -v "export function"
grep -r "resetSandboxDatabase\|seedSandboxDatabase" .ai/alpha/scripts --include="*.ts" | grep -v "export function"
grep -r "displayProgressUpdate" .ai/alpha/scripts --include="*.ts" | grep -v "export function"
```

Update any found call sites to pass `uiEnabled` (likely only in orchestrator.ts and feature.ts).

#### Step 6: Add comprehensive tests

Add unit tests to verify the logging behavior:

- Test that logger suppresses output when uiEnabled=true
- Test that logger allows output when uiEnabled=false
- Test that all functions accept the uiEnabled parameter

#### Step 7: Manual validation

- Run the orchestrator with UI mode: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- Wait for >6 minutes to ensure no crash
- Verify the UI remains stable and no console output leaks through
- Run the orchestrator without UI mode and verify logs still appear

## Testing Strategy

### Unit Tests

Add unit tests for the conditional logging behavior:

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/health.spec.ts` - Test health.ts logging suppression
- `.ai/alpha/scripts/lib/__tests__/database.spec.ts` - Test database.ts logging suppression
- `.ai/alpha/scripts/lib/__tests__/progress.spec.ts` - Test progress.ts logging suppression

**Test cases**:
- ✅ createLogger suppresses console.log when uiEnabled=true
- ✅ createLogger allows console.log when uiEnabled=false
- ✅ checkSandboxHealth accepts uiEnabled parameter
- ✅ runHealthChecks accepts uiEnabled parameter
- ✅ killClaudeProcess accepts uiEnabled parameter
- ✅ resetSandboxDatabase accepts uiEnabled parameter
- ✅ seedSandboxDatabase accepts uiEnabled parameter
- ✅ displayProgressUpdate accepts uiEnabled parameter
- ✅ Regression test: Orchestrator doesn't crash at 6 minutes with UI enabled

### Integration Tests

Not required - this is a logging change that doesn't affect business logic.

### E2E Tests

Not required - the fix is internal to the orchestrator and doesn't affect user-facing functionality.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with UI mode: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Wait for >6 minutes to verify no crash occurs
- [ ] Verify Ink TUI remains stable and responsive
- [ ] Verify no console output leaks through to terminal
- [ ] Press Ctrl+C and verify clean shutdown
- [ ] Run orchestrator without UI mode: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --no-ui` (if flag exists)
- [ ] Verify console logs appear normally in non-UI mode
- [ ] Check that database operations still log properly
- [ ] Check that health checks still log properly
- [ ] Verify progress updates work in both modes

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Missing a call site**: Some function might call these logging functions without passing uiEnabled
   - **Likelihood**: low (TypeScript will catch missing parameters)
   - **Impact**: low (defaults to false, logs will appear but won't crash)
   - **Mitigation**: TypeScript compiler will error on missing required params; add defaults to all params

2. **Silent debugging issues**: Developers might not see logs they expect in UI mode
   - **Likelihood**: medium (developers accustomed to seeing all logs)
   - **Impact**: low (logs still work in non-UI mode, can disable UI for debugging)
   - **Mitigation**: Document the behavior; add --no-ui flag for debugging; logs go to file

3. **Performance regression from parameter passing**: Adding uiEnabled to call chain
   - **Likelihood**: very low (boolean parameter is negligible)
   - **Impact**: negligible (no measurable performance impact)
   - **Mitigation**: None needed - parameter passing is trivial overhead

**Rollback Plan**:

If this fix causes issues:
1. Revert the commits that added createLogger and uiEnabled parameters
2. Run orchestrator in non-UI mode temporarily
3. Re-diagnose if new issues appear

**Monitoring**:
- Monitor crash reports for any new orchestrator failures
- Watch for user reports of missing log output
- No specific metrics needed - this is a stability fix

## Performance Impact

**Expected Impact**: none

No performance implications - adding a boolean parameter and conditional check is negligible overhead (< 1 microsecond per log call).

**Performance Testing**:
Not required - the change has no measurable performance impact.

## Security Considerations

**Security Impact**: none

This change only affects logging behavior and has no security implications. No data exposure, no authentication changes, no authorization changes.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with UI mode and wait for crash
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Wait for approximately 6 minutes
# Expected: Orchestrator crashes silently, UI disappears
```

**Expected Result**: Orchestrator crashes at ~5-6 minutes, terminal returns to prompt

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Build (if orchestrator is part of build)
pnpm build

# Manual verification - run with UI mode
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Wait for >6 minutes (e.g., 10 minutes)
# Expected: Orchestrator continues running, UI remains stable

# Verify no console output leaking through
# Expected: Clean Ink UI with no raw console.log output

# Test without UI mode (if --no-ui flag exists)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --no-ui

# Expected: Console logs appear normally
```

**Expected Result**:
- All validation commands succeed
- Orchestrator runs stably for >10 minutes with UI enabled
- No console output leaks through to terminal in UI mode
- Console logs work normally in non-UI mode

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Specific tests for logging modules
pnpm test:unit --filter="health.spec"
pnpm test:unit --filter="database.spec"
pnpm test:unit --filter="progress.spec"

# Check for any other console.log calls in lib/ that might be missed
grep -r "console\.log" .ai/alpha/scripts/lib --include="*.ts" | grep -v "if (!uiEnabled)" | grep -v "createLogger" | grep -v "test" | grep -v "spec"

# Verify no new console.log calls were added
git diff origin/dev .ai/alpha/scripts/lib | grep "console.log"
```

## Dependencies

**No new dependencies required**

The fix uses only built-in TypeScript features and existing patterns.

## Database Changes

**No database changes required**

This is a pure code change affecting logging behavior only.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
None - standard deployment process applies.

**Feature flags needed**: no

**Backwards compatibility**: maintained

The changes add optional parameters with defaults, maintaining full backwards compatibility. Existing code continues to work unchanged.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Orchestrator runs for >10 minutes with UI enabled without crashing
- [ ] No console output leaks through Ink UI
- [ ] Console logs work normally in non-UI mode
- [ ] TypeScript compilation succeeds with no errors
- [ ] All unit tests pass
- [ ] Manual testing checklist complete
- [ ] Code review approved
- [ ] No regressions detected in existing orchestrator functionality

## Notes

### Implementation Tips

1. **Copy existing pattern**: The `createLogger` utility already exists in orchestrator.ts:75-87, sandbox.ts:29-35, lock.ts, work-queue.ts, and feature.ts. Copy the exact same pattern for consistency.

2. **Parameter defaults**: Add `uiEnabled: boolean = false` as the default to maintain backwards compatibility.

3. **Grep for call sites**: Use grep to find all call sites that need updating:
   ```bash
   grep -rn "checkSandboxHealth\|runHealthChecks\|resetSandboxDatabase" .ai/alpha/scripts
   ```

4. **Test incrementally**: Test each module after adding createLogger to ensure logging works correctly before moving to the next module.

### Related Documentation

- Ink documentation: https://github.com/vadimdemedes/ink
- TypeScript function parameter patterns: https://www.typescriptlang.org/docs/handbook/functions.html
- Existing createLogger implementations:
  - `.ai/alpha/scripts/lib/orchestrator.ts:75-87`
  - `.ai/alpha/scripts/lib/sandbox.ts:29-35`
  - `.ai/alpha/scripts/lib/lock.ts:33`
  - `.ai/alpha/scripts/lib/work-queue.ts:24`
  - `.ai/alpha/scripts/lib/feature.ts:59`

### Future Enhancements (Out of Scope)

While implementing this fix, we could consider (but should NOT implement as part of this fix):
- Centralized logger module with log levels
- File-based logging for debugging
- Structured logging with timestamps
- Log rotation and management

These should be separate features if needed, not part of this bug fix.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1458*
