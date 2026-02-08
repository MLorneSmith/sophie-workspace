# Bug Fix: Event Server Environment Variable Not Set in UI Mode

**Related Diagnosis**: #1581
**Severity**: low
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `ORCHESTRATOR_UI_ENABLED` environment variable is checked but never set anywhere in the codebase
- **Fix Approach**: Set `process.env.ORCHESTRATOR_UI_ENABLED = "true"` when UI mode is enabled
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When running the Alpha Spec Orchestrator without the `--ui` flag, the console displays a confusing warning: `⚠️ Failed to emit event to event server: fetch failed`. This occurs because:

1. Events are emitted unconditionally during database operations
2. The event emitter checks `ORCHESTRATOR_UI_ENABLED` to decide whether to log errors
3. This environment variable is never set anywhere in the code
4. Result: The user sees error messages even in non-UI mode where events are not expected

For full details, see diagnosis issue #1581.

### Solution Approaches Considered

#### Option 1: Set the environment variable when UI is enabled ⭐ RECOMMENDED

**Description**: Add a single line to `orchestrator.ts` that sets `process.env.ORCHESTRATOR_UI_ENABLED = "true"` when UI mode is determined to be active. This makes the existing error check in `event-emitter.ts` work as intended.

**Pros**:
- Minimal code change (1 line)
- No changes to event emitter logic or API
- Follows existing pattern (environment variable already checked)
- Works with fire-and-forget event emission pattern
- Easy to understand and maintain
- Zero performance impact

**Cons**:
- Uses environment variable as a simple flag (not ideal for highly principled designs)
- Doesn't prevent events from being sent, just silences the error

**Risk Assessment**: Low - This is a simple flag assignment with no side effects. The environment variable is only used in error handling.

**Complexity**: simple - Single line addition

#### Option 2: Pass uiEnabled flag to event emitter

**Description**: Modify `emitOrchestratorEvent()` to accept a `uiEnabled` parameter and only attempt the fetch if UI is enabled.

**Pros**:
- More explicit - function signature makes intent clear
- Prevents unnecessary fetch attempts

**Cons**:
- Requires changing function signature (impacts multiple call sites)
- Requires passing `uiEnabled` through many function layers
- More invasive changes across the codebase
- Adds complexity without much benefit (fire-and-forget is already non-blocking)

**Why Not Chosen**: Higher complexity with minimal benefit. Since event emission is fire-and-forget and doesn't block operations, preventing the fetch attempt doesn't significantly improve behavior. Option 1 is simpler and more pragmatic.

#### Option 3: Add health check before emission

**Description**: Implement a quick check to see if the event server is running before attempting emission.

**Pros**:
- Truly prevents failed fetches

**Cons**:
- Adds latency (extra network call)
- Complex implementation
- Doesn't improve user experience significantly
- Over-engineered for a fire-and-forget system

**Why Not Chosen**: Adds unnecessary complexity and latency. The fire-and-forget pattern already handles failures gracefully.

### Selected Solution: Set the environment variable when UI is enabled

**Justification**: This approach is the simplest, most pragmatic solution that solves the problem with minimal code changes. The error check already exists in `event-emitter.ts` - we just need to set the variable that controls it. No architectural changes, no invasive modifications to multiple functions, just one line to make the existing logic work as designed.

**Technical Approach**:
- Set `process.env.ORCHESTRATOR_UI_ENABLED = "true"` in `orchestrator.ts` early in the `orchestrate()` function when UI mode is determined
- Place it right before any database operations to ensure the flag is set before events are emitted
- The existing error check in `event-emitter.ts:96` will then work correctly

**Architecture Changes**: None - this is a configuration flag, not a structural change

**Migration Strategy**: Not needed - this is a simple fix with no backward compatibility concerns

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/orchestrator.ts` - Add one line to set the environment variable when UI is enabled

### New Files

None - this is a simple modification to existing code

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Set the environment variable at the right place

Set `ORCHESTRATOR_UI_ENABLED` in `orchestrator.ts` after UI mode is determined but before any database operations that emit events.

**Specific location**: In the `orchestrate()` function, right after the environment is checked and lock is acquired, add the flag.

- Open `.ai/alpha/scripts/lib/orchestrator.ts`
- Find the section after line 1024 (after lock acquisition begins)
- Add: `if (options.ui) process.env.ORCHESTRATOR_UI_ENABLED = "true";`
- Place it just before database operations begin (before line 1056 where `checkDatabaseCapacity` is called)

**Why this step first**: The environment variable needs to be set before any code that emits events runs. The database capacity check at line 1056 emits events, so this must be set before that.

#### Step 2: Verify error message changes

After the fix, run the orchestrator without `--ui` and verify:
- No `⚠️ Failed to emit event to event server` messages appear
- The orchestrator functions normally
- No other console output is affected

#### Step 3: Add regression test

Create a simple unit test to verify the environment variable behavior.

- Add test to `.ai/alpha/scripts/lib/__tests__/orchestrator.spec.ts` (create if it doesn't exist)
- Test: "should set ORCHESTRATOR_UI_ENABLED when UI mode is enabled"
- Test: "should not set ORCHESTRATOR_UI_ENABLED when UI mode is disabled"

**Why**: Prevent accidental regression if someone removes the line in the future

#### Step 4: Validation

Run the orchestrator in both modes to ensure no regressions:
- Non-UI mode: `tsx spec-orchestrator.ts 1362`
- UI mode: `tsx spec-orchestrator.ts 1362 --ui`

Both should work without console errors.

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Environment variable is set when `options.ui` is true
- ✅ Environment variable is not set when `options.ui` is false
- ✅ Error logging in event-emitter respects the flag

**Test file**:
- `.ai/alpha/scripts/lib/__tests__/orchestrator-env-flag.spec.ts` - Tests for environment variable behavior

### Integration Tests

Not needed - this is a simple flag that doesn't integrate with other systems.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator without `--ui` flag: `tsx spec-orchestrator.ts 1362`
  - Verify: No `⚠️ Failed to emit event to event server` warnings appear
  - Verify: Orchestrator continues to function normally
  - Verify: Database capacity check runs successfully
- [ ] Run orchestrator with `--ui` flag: `tsx spec-orchestrator.ts 1362 --ui`
  - Verify: UI starts normally
  - Verify: Event server connects successfully
  - Verify: No new error messages appear
- [ ] Check that both modes produce their expected console output
- [ ] Verify no other warnings or errors in console

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Risk**: Setting environment variable might affect other code that checks this variable
   - **Likelihood**: low - only used in event-emitter.ts error handler
   - **Impact**: low - would only affect error logging, not functionality
   - **Mitigation**: Grep for `ORCHESTRATOR_UI_ENABLED` throughout codebase before implementing

2. **Risk**: Variable name collision with user-defined environment variables
   - **Likelihood**: very low - "ORCHESTRATOR_UI_ENABLED" is very specific
   - **Impact**: low - even if collision occurs, worst case is behavior toggle
   - **Mitigation**: Use a distinct variable name (current name is already very specific)

**Rollback Plan**:

If this fix causes issues:
1. Remove the line: `if (options.ui) process.env.ORCHESTRATOR_UI_ENABLED = "true";`
2. The error messages will reappear, but orchestrator will function identically
3. No data loss or system corruption possible

**Monitoring** (if needed):
- None - this is purely a console output fix with zero system impact

## Performance Impact

**Expected Impact**: none

No performance implications. This is just a flag assignment - zero computational overhead.

## Security Considerations

**Security Impact**: none

This is a local environment variable used only for conditional logging. No security implications whatsoever.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator without UI - should show the warning
cd /home/msmith/projects/2025slideheroes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 2>&1 | grep "Failed to emit event"
```

**Expected Result**: Warning message appears in console output

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Run orchestrator without UI - should NOT show the warning
cd /home/msmith/projects/2025slideheroes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 2>&1 | grep -c "Failed to emit event" || echo "No warnings found - SUCCESS"

# Run orchestrator with UI to verify no regressions
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --ui --dry-run
```

**Expected Result**: All commands succeed, no "Failed to emit event" warnings, dry-run completes successfully

### Regression Prevention

```bash
# Run full spec orchestrator tests
pnpm --filter @kit/scripts test

# Verify event-emitter still works
pnpm --filter @kit/scripts test -- event-emitter
```

## Dependencies

### New Dependencies (if any)

None - this fix doesn't add any dependencies

## Database Changes

None - this is a configuration flag with no database impact

## Deployment Considerations

**Deployment Risk**: none

No special deployment steps needed. This is a simple code fix.

**Feature flags needed**: no

**Backwards compatibility**: maintained - fix only affects error logging

## Success Criteria

The fix is complete when:
- [ ] Environment variable assignment added to orchestrator.ts
- [ ] All validation commands pass
- [ ] Manual testing checklist complete
- [ ] No `⚠️ Failed to emit event` messages in non-UI mode
- [ ] All tests pass (both unit and manual)
- [ ] Zero regressions detected
- [ ] Code review approved

## Notes

This is a straightforward fix that aligns the code implementation with its design. The error check for `ORCHESTRATOR_UI_ENABLED` was already in place in `event-emitter.ts`, but the variable was never being set, causing the check to always fail in a logging context.

The fix is intentionally minimal - just one line to make the existing logic work. This avoids over-engineering while solving the issue completely.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1581*
