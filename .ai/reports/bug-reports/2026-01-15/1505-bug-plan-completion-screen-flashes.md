# Bug Fix: Completion Screen Flashes and Disappears

**Issue**: #1505
**Related Diagnosis**: #1504
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: useEffect unconditionally resets phase to "running" when startPolling reference changes, overwriting "completed" phase
- **Fix Approach**: Add phase state guard to only transition from "loading" to "running", preserving terminal states
- **Estimated Effort**: small (single line change)
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The orchestrator completion screen appears briefly when a spec finishes, but immediately disappears because a React useEffect unconditionally sets the phase to "running" whenever the `startPolling` callback reference changes. This overwrites the "completed" phase and causes the CompletionUI to be replaced by the OrchestratorUI.

For full details, see diagnosis issue #1504.

### Solution Approaches Considered

#### Option 1: Phase Transition Guard ⭐ RECOMMENDED

**Description**: Modify the useEffect to use a functional state update that only transitions from "loading" to "running", preserving terminal phases like "completed" and "error".

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    startPolling();
    // Only transition to running if currently loading
    setPhase(prev => prev === 'loading' ? 'running' : prev);
  }, 500);

  return () => clearTimeout(timer);
}, [startPolling]);
```

**Pros**:
- Minimal code change (single line)
- Preserves React's dependency tracking
- Follows state machine pattern (loading → running, but not completed → running)
- No additional complexity or state tracking needed
- Easy to understand and maintain
- Works for all terminal phases (completed, error)

**Cons**:
- None identified

**Risk Assessment**: low - This is a surgical fix that only affects phase transition logic. The guard is defensive and prevents unintended state changes without affecting correct behavior.

**Complexity**: simple - Single line change using functional setState pattern, a standard React idiom.

#### Option 2: Run-Once Flag with useRef

**Description**: Use a ref to track whether the effect has already run, preventing re-execution even when dependencies change.

```tsx
const hasStartedRef = useRef(false);

useEffect(() => {
  if (hasStartedRef.current) return;
  hasStartedRef.current = true;

  const timer = setTimeout(() => {
    startPolling();
    setPhase("running");
  }, 500);

  return () => clearTimeout(timer);
}, [startPolling]);
```

**Pros**:
- Guarantees effect only runs once
- No conditional logic in setState

**Cons**:
- Adds extra state tracking (ref)
- Violates React dependency tracking (effect depends on startPolling but ignores changes)
- More complex mental model
- Could hide other bugs if startPolling actually should re-start

**Why Not Chosen**: This approach fights against React's dependency tracking system. While it would fix the immediate bug, it masks the real issue and could hide future bugs if the effect actually needs to re-run. Option 1 is cleaner and more aligned with React best practices.

#### Option 3: Remove startPolling from Dependencies

**Description**: Remove `startPolling` from the useEffect dependency array to prevent re-runs.

**Why Not Chosen**: This violates React's exhaustive-deps rule and would require a linter suppression. It also introduces potential bugs if startPolling's implementation changes in ways that require re-running the effect. This is an anti-pattern in modern React.

### Selected Solution: Phase Transition Guard (Option 1)

**Justification**: Option 1 is the cleanest and most idiomatic React solution. It:
- Respects React's dependency tracking
- Uses functional setState (recommended pattern for state updates based on previous state)
- Implements a proper state machine pattern (terminal states are immutable)
- Requires minimal code change (lowest risk)
- Is immediately understandable to any React developer

**Technical Approach**:
- Change `setPhase("running")` to `setPhase(prev => prev === 'loading' ? 'running' : prev)`
- This creates a unidirectional state flow: loading → running
- Terminal states (completed, error) cannot transition back to running
- The guard is defensive and prevents regression if other code paths have similar issues

**Architecture Changes**: None - this is a localized fix within the OrchestratorApp component.

**Migration Strategy**: Not applicable - this is a pure bug fix with no breaking changes.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/ui/index.tsx` - Line 190: Change setPhase call to use functional update with guard

### New Files

None - this is a modification to existing code.

### Step-by-Step Tasks

#### Step 1: Modify phase transition logic

Change the unconditional `setPhase("running")` to a guarded functional update that only transitions from "loading" to "running".

- Open `.ai/alpha/scripts/ui/index.tsx`
- Navigate to line 190
- Replace `setPhase("running");` with `setPhase(prev => prev === 'loading' ? 'running' : prev);`
- Save the file

**Why this step first**: This is the only change needed - it's a complete fix.

#### Step 2: Add unit tests for phase transitions

Create unit tests that verify the OrchestratorApp component's phase state machine logic.

- Create test file: `.ai/alpha/scripts/ui/__tests__/OrchestratorApp.test.tsx`
- Test case 1: Phase remains "completed" when startPolling reference changes
- Test case 2: Phase transitions from "loading" to "running" on initial mount
- Test case 3: Phase remains "error" when startPolling reference changes
- Regression test: Verify completion screen stays visible after status changes to "completed"

#### Step 3: Manual testing

- Run the orchestrator with a small spec to completion
- Verify completion screen appears and stays visible
- Verify user can press 'q' or Enter to exit
- Test with a spec that has errors to ensure error UI isn't affected

#### Step 4: Validation

- Run type check: `pnpm typecheck`
- Run lint: `pnpm lint`
- Run format: `pnpm format`
- Run tests if created: `pnpm --filter @alpha/ui test`

## Testing Strategy

### Unit Tests

Add unit tests for the OrchestratorApp component:
- ✅ Phase starts as "loading"
- ✅ Phase transitions to "running" after startPolling begins
- ✅ Phase transitions to "completed" when status becomes "completed"
- ✅ Phase stays "completed" even if startPolling reference changes
- ✅ Phase stays "error" even if startPolling reference changes
- ✅ Regression test: CompletionUI remains visible once rendered

**Test files**:
- `.ai/alpha/scripts/ui/__tests__/OrchestratorApp.test.tsx` - Phase state machine tests

### Integration Tests

Not applicable - this is a UI state management fix that doesn't affect the orchestration logic.

### E2E Tests

Manual E2E testing is sufficient:
- Run orchestrator to completion and verify UI behavior

**Manual test procedure documented in Step 3 above.**

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug on current code (completion screen flashes)
- [ ] Apply fix
- [ ] Run orchestrator with a small spec (1-2 features)
- [ ] Wait for spec to complete
- [ ] Verify: Completion screen appears and stays visible
- [ ] Verify: Preview URLs are readable on screen
- [ ] Verify: Can press 'q' to exit
- [ ] Verify: Can press Enter to exit
- [ ] Test with a spec that has intentional errors
- [ ] Verify: Error UI appears and stays stable (not affected by fix)
- [ ] Verify: No console errors in terminal

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Phase could get stuck in "loading"**: If there's a code path that should transition loading→running but is missed
   - **Likelihood**: low
   - **Impact**: medium (UI would show loading screen indefinitely)
   - **Mitigation**: The onStateChange callback still sets phase based on actual progress status, so this is a fallback. The 500ms timer would need to fail completely.

2. **Other phase transitions might be affected**: If there are other ways phase gets set that we haven't identified
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: We've audited all setPhase calls. The only places are: initial state, onStateChange callback, and this useEffect. The fix is defensive (only guards this specific path).

**Rollback Plan**:

If this fix causes issues:
1. Revert the single line change: `setPhase("running")` → `setPhase(prev => prev === 'loading' ? 'running' : prev)`
2. Git commit: `git revert <commit-hash>`
3. The orchestrator will return to the buggy behavior where completion screen flashes

**Monitoring**:
- None required - this is a UI fix with no backend impact
- Verify manually after deployment that completion screen works

## Performance Impact

**Expected Impact**: none

No performance implications. This changes the condition under which a state update occurs, but doesn't add any computation or change the frequency of state updates.

**Performance Testing**: Not applicable.

## Security Considerations

**Security Impact**: none

This is a UI state management fix with no security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run orchestrator with a small spec
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Observe: Completion screen appears briefly then disappears
# Observe: Main orchestrator UI reappears
```

**Expected Result**: Completion screen flashes and disappears within ~1 second.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format

# Run orchestrator with a small spec
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Manual verification:
# 1. Wait for spec to complete
# 2. Observe: Completion screen appears and STAYS visible
# 3. Verify: Can read preview URLs
# 4. Press 'q' or Enter to exit
```

**Expected Result**: All commands succeed, completion screen stays visible, user can exit cleanly.

### Regression Prevention

```bash
# Verify TypeScript compilation
pnpm typecheck

# Verify linting passes
pnpm lint

# Run UI tests if created
pnpm --filter @alpha/ui test

# Manual regression test:
# Run orchestrator with error-inducing spec
# Verify: Error UI appears and stays stable (not affected by fix)
```

## Dependencies

**No new dependencies required**

This is a pure logic fix using existing React patterns.

## Database Changes

**No database changes required**

This is a UI-only fix.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - this is a standard code change.

**Feature flags needed**: no

**Backwards compatibility**: maintained (no API changes, no breaking changes)

## Success Criteria

The fix is complete when:
- [ ] Code change applied (single line in index.tsx)
- [ ] Type check passes
- [ ] Lint passes
- [ ] Format check passes
- [ ] Manual test confirms completion screen stays visible
- [ ] Manual test confirms user can press 'q' or Enter to exit
- [ ] Manual test confirms error UI is not affected
- [ ] No console errors when orchestrator completes
- [ ] Code review approved (if required)

## Notes

### Why Functional setState?

The fix uses `setPhase(prev => ...)` instead of checking `phase` directly. This is important because:
1. **Stale closures**: The effect's closure might have an old `phase` value
2. **Race conditions**: Multiple state updates could interleave
3. **React best practices**: Functional updates guarantee you're working with the latest state

### State Machine Pattern

This fix implements a simple state machine:
```
loading → running → (completed | error)
  ↓         ↓            ↓
(terminal states cannot transition back)
```

The guard `prev === 'loading' ? 'running' : prev` enforces the rule that only "loading" can transition to "running". Terminal states are preserved.

### Why Not Remove startPolling Dependency?

We considered removing `startPolling` from the dependency array, but this violates React's rules and could introduce subtle bugs. The better fix is to handle the re-run correctly rather than suppress it.

### Related Fix Attempt

Commit `e9807e807` fixed the orchestrator side by adding `waitForExit()`, but the UI side was still broken. This fix completes the solution by ensuring the CompletionUI actually stays rendered while `waitForExit()` waits.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1504*
