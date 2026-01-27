# Bug Fix: Alpha Orchestrator hangs when Claude Code crashes - manifest not updated

**Related Diagnosis**: #1852 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `attemptProgressFileRecovery()` doesn't check `status === "failed"` before returning `stillRunning: true`
- **Fix Approach**: Add failure status check using existing `isFeatureFailed()` function
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

When Claude Code crashes with `Error: No messages returned`, the PTY wait loop in `pty-wrapper.ts` continues indefinitely because `attemptProgressFileRecovery()` only checks if heartbeat is stale, not if `status === "failed"`. The progress file shows `status: "failed"` but the heartbeat was recently updated before the crash, so the function returns `stillRunning: true` and the loop continues forever.

For full details, see diagnosis issue #1852.

### Solution Approaches Considered

#### Option 1: Add failure status check in `attemptProgressFileRecovery()` ⭐ RECOMMENDED

**Description**: Import the existing `isFeatureFailed()` function from `progress-file.ts` and add a new case in `attemptProgressFileRecovery()` to check for `status === "failed"` between the stale check and the completed check. When status is "failed", throw a `PTYTimeoutError` to propagate the failure.

**Pros**:
- Minimal code change (5-10 lines)
- Uses existing utility function (`isFeatureFailed()` already exists)
- Follows established error handling patterns in the codebase
- Fixes the root cause directly
- No changes to external interfaces

**Cons**:
- None significant

**Risk Assessment**: Low - Uses existing code patterns and doesn't change external APIs

**Complexity**: Simple - One function modification with existing utilities

#### Option 2: Detect crash from PTY output in `feature.ts`

**Description**: Watch for crash patterns like `Error: No messages returned` in the `onData` callback and set a flag to exit the wait loop early.

**Pros**:
- Catches crashes earlier (before timeout)
- Can detect specific crash types

**Cons**:
- Requires string matching for error patterns (fragile)
- Doesn't fix the underlying logic bug in `attemptProgressFileRecovery()`
- More complex implementation
- May miss other crash patterns

**Why Not Chosen**: Addresses symptom rather than root cause. The progress file status check is the proper fix since it's the authoritative source of truth.

#### Option 3: Add heartbeat freshness threshold per status

**Description**: Treat heartbeats as "stale" more aggressively when status is "failed" (e.g., 30 seconds instead of 5 minutes).

**Pros**:
- Could catch failures faster

**Cons**:
- Adds complexity to staleness logic
- Doesn't fix the root cause (still ignoring `status` field)
- May cause false positives for legitimate in-progress features

**Why Not Chosen**: Over-engineering. The simple status check is sufficient.

### Selected Solution: Add failure status check in `attemptProgressFileRecovery()`

**Justification**: This is the minimal, surgical fix that addresses the root cause directly. The `isFeatureFailed()` function already exists and is tested - we just need to call it. The fix follows existing code patterns and doesn't change any external interfaces.

**Technical Approach**:
- Import `isFeatureFailed` from `progress-file.ts` in `pty-wrapper.ts`
- Add new Case 2.5 in `attemptProgressFileRecovery()` after stale check, before completed check
- When `isFeatureFailed(progressData)` returns true, throw `PTYTimeoutError` with descriptive message
- Update telemetry counter (`recoveryFailed++`) for failed status

**Architecture Changes**: None - this is a pure bug fix within existing architecture.

## Implementation Plan

### Affected Files

List files that need modification:
- `.ai/alpha/scripts/lib/pty-wrapper.ts` - Add import and failure status check in `attemptProgressFileRecovery()`

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update imports in pty-wrapper.ts

Add `isFeatureFailed` to the existing imports from `progress-file.ts`.

**Current (line 24-29)**:
```typescript
import {
	isFeatureCompleted,
	isProgressFileStale,
	type ProgressFileData,
	readProgressFile,
} from "./progress-file.js";
```

**Updated**:
```typescript
import {
	isFeatureCompleted,
	isFeatureFailed,
	isProgressFileStale,
	type ProgressFileData,
	readProgressFile,
} from "./progress-file.js";
```

**Why this step first**: Imports must be updated before the function can use `isFeatureFailed`.

#### Step 2: Add failure status check in `attemptProgressFileRecovery()`

Insert a new case between the stale check (Case 2) and the completed check (Case 3) to handle `status === "failed"`.

**Location**: After line 219 (the stale check throw), before line 222 (the completed check)

**Code to add**:
```typescript
	// Case 2.5: Feature explicitly failed - propagate failure
	// Bug fix #1852: Check for failed status before checking if still running
	// When Claude Code crashes, progress file shows status: "failed" with recent heartbeat
	if (isFeatureFailed(progressData)) {
		ptyTelemetry.recoveryFailed++;
		throw new PTYTimeoutError(
			sandboxId,
			progressData,
			timeoutMs,
			`Progress file indicates feature failed (status: ${progressData.status})`,
		);
	}
```

**Why**: This catches the case where Claude Code crashed but the heartbeat is still fresh. The progress file's `status` field is the authoritative indicator of failure.

#### Step 3: Add unit tests for failure status handling

Create tests to verify the new failure detection works correctly.

**Test scenarios**:
- Progress file with `status: "failed"` and recent heartbeat should throw `PTYTimeoutError`
- Progress file with `status: "failed"` and stale heartbeat should throw `PTYTimeoutError` (stale check first)
- Progress file with `status: "completed"` should recover successfully (existing test)
- Progress file with `status: "in_progress"` and recent heartbeat should return `stillRunning: true` (existing test)

#### Step 4: Validate the fix

- Run typecheck: `pnpm typecheck`
- Run linting: `pnpm lint:fix`
- Run unit tests for the orchestrator scripts
- Manually verify with a test spec run

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `attemptProgressFileRecovery()` returns error when `status === "failed"` with fresh heartbeat
- ✅ `attemptProgressFileRecovery()` returns error when `status === "failed"` with stale heartbeat
- ✅ Existing tests still pass for `status === "completed"` recovery
- ✅ Existing tests still pass for `status === "in_progress"` with fresh heartbeat
- ✅ Regression test: Simulate Claude crash scenario and verify manifest is updated

**Test files**:
- `.ai/alpha/scripts/lib/__tests__/pty-wrapper.test.ts` (create if doesn't exist)

### Integration Tests

Manual integration test by running the orchestrator with a spec that has features that may fail.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run orchestrator with a spec (e.g., S1823)
- [ ] If a feature fails due to Claude crash, verify orchestrator doesn't hang
- [ ] Verify manifest is updated with `status: "failed"` for the feature
- [ ] Verify other sandboxes continue processing
- [ ] Verify failed feature can be retried
- [ ] Run `pnpm typecheck` - must pass
- [ ] Run `pnpm lint` - must pass

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **False positives on "failed" status**:
   - **Likelihood**: Low - The `isFeatureFailed()` function is straightforward
   - **Impact**: Low - Would cause feature to be retried, not lost
   - **Mitigation**: Unit tests verify correct behavior

2. **Existing tests may need updates**:
   - **Likelihood**: Low - We're adding behavior, not changing existing behavior
   - **Impact**: Low - Easy to update mocks
   - **Mitigation**: Run full test suite before merging

**Rollback Plan**:

If this fix causes issues:
1. Revert the single commit that adds the failure check
2. The previous behavior (hanging on crash) is undesirable but not data-losing
3. Investigate the unexpected failure pattern and adjust

**Monitoring**:
- Monitor orchestrator runs for any unexpected failures
- Check telemetry counters (`ptyTelemetry.recoveryFailed`) for increase

## Performance Impact

**Expected Impact**: None

The fix adds one additional function call (`isFeatureFailed()`) which is a simple string comparison. This has negligible performance impact.

## Security Considerations

**Security Impact**: None

This is purely an internal error handling fix with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with a spec
cd .ai/alpha/scripts && tsx spec-orchestrator.ts S1823

# If Claude crashes, observe that the orchestrator hangs indefinitely
# Progress shows features stuck as "in_progress" in manifest
```

**Expected Result**: Orchestrator hangs when Claude crashes with recent heartbeat.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Build the orchestrator scripts
cd .ai/alpha/scripts && pnpm build

# Run orchestrator with a spec
tsx spec-orchestrator.ts S1823

# If Claude crashes, observe that:
# 1. Feature is marked as "failed" in manifest
# 2. Sandbox is freed for new work
# 3. Orchestrator continues processing other features
```

**Expected Result**: All commands succeed, orchestrator handles crashes gracefully.

### Regression Prevention

```bash
# Run full typecheck
pnpm typecheck

# Run linting
pnpm lint:fix

# Verify the fix doesn't break existing behavior
# (Manual verification with orchestrator run)
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: Low

This is a development tooling fix that only affects the Alpha Orchestrator scripts. No production deployment needed.

**Special deployment steps**: None

**Feature flags needed**: No

**Backwards compatibility**: Maintained - no external API changes

## Success Criteria

The fix is complete when:
- [x] Import `isFeatureFailed` added to pty-wrapper.ts
- [x] Failure status check added in `attemptProgressFileRecovery()`
- [ ] All validation commands pass (`pnpm typecheck`, `pnpm lint`)
- [ ] Manual test: Orchestrator handles Claude crash without hanging
- [ ] Manual test: Failed features are marked correctly in manifest
- [ ] Manual test: Dependent features are properly blocked/unblocked

## Notes

### E2B SDK Limitations (from Context7 Research)

The E2B SDK has known limitations for crash detection:
- **No `on_exit` callback** for PTY process termination
- **No `is_alive()` method** for checking process state
- The `wait()` function blocks but doesn't reliably detect crashes

This is why the progress file serves as the authoritative source of truth for feature status. The fix leverages this existing pattern by checking the `status` field that Claude Code updates.

### Related Research

Full E2B PTY handling research saved to:
`.ai/reports/research-reports/2026-01-27/context7-e2b-pty-handling.md`

### Similar Patterns

The fix follows the same pattern used in:
- `isFeatureCompleted()` check (line 223)
- `isProgressFileStale()` check (line 212)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1852*
