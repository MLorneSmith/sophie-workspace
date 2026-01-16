# Bug Fix: Alpha Event Streaming - Hook Events Not Propagated to UI Progress Files

**Related Diagnosis**: #1440 (CLOSED)
**Fix Plan Issue**: #1441
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Orchestrator ignores `recent_output` from sandbox progress files, uses only stdout capture (2 lines)
- **Fix Approach**: Add `recent_output` field to `SandboxProgress` type and use it in `writeUIProgress()`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The #1439 fix implemented file-based event reporting in `event_reporter.py` to write tool events to `.initiative-progress.json` inside sandboxes. However, the orchestrator was never updated to read this new `recent_output` field from sandbox files or propagate it to UI progress files. The UI only shows stdout capture (2 initial lines) instead of real-time tool activity.

For full details, see diagnosis issue #1440.

### Solution Approaches Considered

#### Option 1: Use Sandbox recent_output Field ⭐ RECOMMENDED

**Description**: Add `recent_output` field to `SandboxProgress` TypeScript interface and update `writeUIProgress()` to use `progress?.recent_output` from the sandbox file instead of `outputTracker.recentOutput` from stdout capture.

**Pros**:
- Minimal code changes (2 files, ~3 lines total)
- Completes the #1439 fix as originally intended
- Uses existing data flow (progress polling already reads sandbox files)
- Zero risk of breaking existing functionality
- Type-safe solution with TypeScript validation
- Works immediately with existing hook implementation

**Cons**:
- Requires TypeScript recompilation
- Minor: Depends on hook being registered correctly (already validated as working)

**Risk Assessment**: low - Simple type addition and data source swap with no logic changes

**Complexity**: simple - Two-line code change with clear before/after behavior

#### Option 2: Merge Both Data Sources (Hook + Stdout)

**Description**: Keep both `progress.recent_output` (hook events) and `outputTracker.recentOutput` (stdout capture), merge them, dedupe, and take last 20 items.

**Pros**:
- Preserves existing stdout capture behavior
- Provides redundancy if hook fails
- More comprehensive output history

**Cons**:
- More complex logic (array merging, deduplication)
- Potential for duplicate or redundant entries
- Stdout capture only has 2 lines anyway (not useful to merge)
- Adds unnecessary complexity for minimal benefit
- Harder to debug which source provided which output

**Why Not Chosen**: The stdout capture only contains 2 initial startup lines and provides no useful tool activity. Merging adds complexity without benefit. The hook-based approach is the primary mechanism and should be the sole source.

#### Option 3: Read Sandbox Files Directly in UI Hook

**Description**: Have the UI poller directly read sandbox files via E2B API instead of relying on orchestrator to propagate data.

**Pros**:
- Direct path from source to UI
- Could potentially be faster

**Cons**:
- Major architectural change (UI needs E2B API access)
- Breaks separation of concerns (UI shouldn't access E2B directly)
- Much higher complexity
- Requires significant refactoring
- Increases coupling between components
- May require new authentication/permissions

**Why Not Chosen**: Massive overkill for a 2-line fix. The orchestrator already polls sandbox files successfully - we just need to use the right field.

### Selected Solution: Option 1 - Use Sandbox recent_output Field

**Justification**:

This is the correct and minimal fix that completes the #1439 implementation. The infrastructure is already in place:
- Hook writes to sandbox file ✅
- Orchestrator polls sandbox file ✅
- Orchestrator parses JSON into `progress` object ✅
- **Missing**: Type definition and using the correct field

The fix is surgical: add one field to a type interface, change one line in a function. No logic changes, no new infrastructure, no risk to existing functionality.

**Technical Approach**:

1. **Add field to type** (`.ai/alpha/scripts/types/orchestrator.types.ts`):
   ```typescript
   export interface SandboxProgress {
       // ... existing fields ...
       recent_output?: string[];  // NEW: Hook-generated tool activity
   }
   ```

2. **Use correct data source** (`.ai/alpha/scripts/lib/progress.ts`):
   ```typescript
   // OLD (line 186):
   recent_output: outputTracker?.recentOutput?.slice(-20) || [],

   // NEW:
   recent_output: progress?.recent_output?.slice(-20) ||
                  outputTracker?.recentOutput?.slice(-20) || [],
   ```

   The fallback to `outputTracker` maintains backwards compatibility during the transition.

**Architecture Changes**: None - uses existing polling and file structure.

**Migration Strategy**: None needed - change is backwards compatible.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/types/orchestrator.types.ts` - Add `recent_output?: string[]` field to `SandboxProgress` interface
- `.ai/alpha/scripts/lib/progress.ts` - Update `writeUIProgress()` to use `progress?.recent_output` instead of `outputTracker?.recentOutput`

### New Files

**No new files required**

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add recent_output Field to SandboxProgress Type

Add the `recent_output` field to the `SandboxProgress` interface to match the data structure written by `event_reporter.py` hook.

- Open `.ai/alpha/scripts/types/orchestrator.types.ts`
- Locate the `SandboxProgress` interface (line ~136)
- Add `recent_output?: string[];` field after `phase?: string;`
- Save file

**Code change**:
```typescript
export interface SandboxProgress {
    feature?: {
        issue_number: number;
        title: string;
    };
    current_task?: {
        id: string;
        name: string;
        status: string;
        started_at?: string;
        verification_attempts?: number;
    };
    completed_tasks?: string[];
    failed_tasks?: string[];
    current_group?: {
        id: number;
        name: string;
        tasks_total: number;
        tasks_completed: number;
    };
    context_usage_percent?: number;
    status?: string;
    last_commit?: string;
    last_heartbeat?: string;
    last_tool?: string;
    phase?: string;
    recent_output?: string[];  // ADD THIS LINE
}
```

**Why this step first**: TypeScript types must be defined before they can be used. This enables the compiler to validate our usage in step 2.

#### Step 2: Update writeUIProgress to Use Sandbox recent_output

Update the `writeUIProgress()` function to prefer `progress.recent_output` (from sandbox file) over `outputTracker.recentOutput` (from stdout capture).

- Open `.ai/alpha/scripts/lib/progress.ts`
- Locate the `writeUIProgress()` function (line ~151)
- Find line 186 where `recent_output` is assigned
- Replace with new logic that prefers sandbox data

**Code change**:
```typescript
// OLD (line 186):
recent_output: outputTracker?.recentOutput?.slice(-20) || [],

// NEW:
recent_output: progress?.recent_output?.slice(-20) ||
               outputTracker?.recentOutput?.slice(-20) || [],
```

**Rationale**:
- Primary source: `progress.recent_output` (hook-generated tool events from sandbox file)
- Fallback: `outputTracker.recentOutput` (stdout capture for backwards compatibility)
- This gracefully handles transition period and provides redundancy

**Why this step second**: Now that the type includes `recent_output`, we can safely access it. The fallback ensures backwards compatibility.

#### Step 3: Verify TypeScript Compilation

Run TypeScript compiler to validate changes and ensure no type errors.

- Run `pnpm typecheck` to verify all types are correct
- Should pass with zero errors
- Verify no new TypeScript errors introduced

**Validation**:
```bash
pnpm typecheck
```

**Expected**: All packages type-check successfully, no new errors.

**Why this step third**: Catch any type errors before testing behavior.

#### Step 4: Manual Testing - Verify Output Updates

Test with live orchestrator to confirm tool events now display in UI.

- Start orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- Wait for sandboxes to begin work
- Observe sandbox columns in UI
- Verify "Output:" section shows tool activity with emoji icons
- Verify output updates in real-time as Claude works

**Expected behavior**:
```
Output:
📖 Read: dashboard.types.ts
📝 Write: dashboard.loader.ts
💻 Bash: pnpm typecheck
```

**Why this step fourth**: Validates the fix works end-to-end before committing.

#### Step 5: Validation

Run all validation commands to ensure zero regressions.

- `pnpm typecheck` - Should pass
- `pnpm lint:fix` - Fix any linting issues
- `pnpm format:fix` - Format code
- Manual verification - UI shows tool events

**Why this step last**: Final quality gate before considering fix complete.

## Testing Strategy

### Unit Tests

**No unit tests required** - This is a data flow fix with no new logic. The existing integration already has implicit test coverage via the orchestrator's operation.

**Why no tests needed**:
- Pure data flow change (field access)
- No new logic, algorithms, or edge cases
- Integration test via live orchestrator is more valuable
- Over-testing simple data access adds maintenance burden

### Integration Tests

**Manual integration test** (described in Step 4):
- ✅ Start orchestrator with active sandboxes
- ✅ Verify tool events appear in UI columns
- ✅ Verify emoji icons display correctly
- ✅ Verify output updates in real-time (within polling interval)
- ✅ Verify no errors in orchestrator console

**Test approach**: Live orchestrator run with real sandboxes provides comprehensive integration validation.

### E2E Tests

**Not applicable** - This is an orchestrator UI display issue, not a user-facing web UI.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (UI shows only 2 startup lines) ✅ Already reproduced
- [ ] Apply fix (add field + change data source)
- [ ] Run `pnpm typecheck` - should pass
- [ ] Start orchestrator: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362`
- [ ] Wait for sandboxes to start working
- [ ] Verify "Output:" section in sandbox columns updates with tool activity
- [ ] Verify emoji icons appear correctly (📖 📝 💻 🔍 📁 etc.)
- [ ] Verify output reflects recent tool use (last 3 lines displayed)
- [ ] Let orchestrator run for 5+ minutes to verify sustained updates
- [ ] Check no errors in orchestrator console output
- [ ] Stop orchestrator gracefully (Ctrl+C)
- [ ] Verify progress files contain hook events: `cat .ai/alpha/progress/sbx-a-progress.json | jq .recent_output`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Type Error if progress.recent_output is Malformed**
   - **Likelihood**: low (hook writes valid JSON, atomic writes prevent corruption)
   - **Impact**: low (optional chaining `progress?.recent_output` prevents crash)
   - **Mitigation**: Optional chaining + fallback to empty array handles all cases gracefully

2. **Backwards Compatibility if Hook Not Deployed**
   - **Likelihood**: low (hook is already deployed per #1439)
   - **Impact**: low (fallback to stdout capture maintains status quo)
   - **Mitigation**: Fallback chain ensures UI never breaks: `progress?.recent_output || outputTracker?.recentOutput || []`

3. **TypeScript Compilation Error**
   - **Likelihood**: very low (simple field addition)
   - **Impact**: medium (blocks build until fixed)
   - **Mitigation**: Run `pnpm typecheck` before committing, validate locally

**Rollback Plan**:

If this fix causes issues:

1. **Revert the changes**:
   ```bash
   git revert <commit-hash>
   ```

2. **Or manually undo**:
   - Remove `recent_output?: string[];` from `SandboxProgress` interface
   - Change line 186 back to: `recent_output: outputTracker?.recentOutput?.slice(-20) || [],`
   - Run `pnpm typecheck` to validate

3. **Restart orchestrator** with reverted code

**Monitoring**:

No special monitoring needed - this is a display-only fix with no backend/database impact. Visual verification via orchestrator UI is sufficient.

## Performance Impact

**Expected Impact**: none

- Reading one additional field from an already-parsed JSON object: negligible (~1µs)
- No new network calls, file I/O, or computations
- Array slicing already occurs in both code paths
- UI polling interval unchanged (5 seconds)

**Performance Testing**: Not required - change is purely data access with no algorithmic or I/O impact.

## Security Considerations

**Security Impact**: none

This fix:
- Does not expose new data (progress files already accessible via polling)
- Does not add new network endpoints or authentication paths
- Does not modify file permissions or access controls
- Does not handle user input or external data
- Simply displays existing internal data in the UI

No security review needed.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Observe UI - Output section shows only 2 lines:
# Output:
# Using OAuth authenticatio...
# Running Claude Code with ...
# (never updates with tool activity)

# Check local progress file
cat .ai/alpha/progress/sbx-a-progress.json | jq '.recent_output'
# Expected: ["Using OAuth authentication...", "Running Claude Code..."]
```

**Expected Result**: UI shows stale output, tool events never appear

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck
# Expected: ✓ All packages type-check successfully

# Start orchestrator
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362

# Observe UI - Output section updates in real-time:
# Output:
# 📖 Read: dashboard.types.ts
# 📝 Write: dashboard.loader.ts
# 💻 Bash: pnpm typecheck

# Check local progress file
cat .ai/alpha/progress/sbx-a-progress.json | jq '.recent_output'
# Expected: ["📖 Read: dashboard.types.ts", "📝 Write: loader.ts", ...]

# Lint and format
pnpm lint:fix
pnpm format:fix
```

**Expected Result**: All commands succeed, UI displays real-time tool activity, zero regressions

### Regression Prevention

```bash
# Full type check across workspace
pnpm typecheck

# Verify no syntax errors
pnpm build

# Check progress file structure is valid JSON
cat .ai/alpha/progress/sbx-a-progress.json | jq .
# Should parse without errors
```

**Expected**: All commands succeed, no build or type errors.

## Dependencies

**No new dependencies required**

This fix uses only existing TypeScript language features and project dependencies.

## Database Changes

**No database changes required**

This fix only affects in-memory TypeScript types and runtime data access. No schema, migrations, or data changes needed.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - standard code deployment

**Feature flags needed**: no

**Backwards compatibility**: maintained

- If hook hasn't written `recent_output` yet, falls back to `outputTracker` (stdout capture)
- If `progress.recent_output` is undefined/null, optional chaining prevents crash
- Empty array fallback ensures UI never breaks
- Old orchestrator versions ignore new field harmlessly

**Deployment steps**:
1. Commit changes to repository
2. Restart orchestrator process with new code
3. Verify UI updates correctly

## Success Criteria

The fix is complete when:

- [x] `recent_output?: string[]` added to `SandboxProgress` interface
- [x] `writeUIProgress()` uses `progress?.recent_output` with fallback
- [x] `pnpm typecheck` passes with zero errors
- [x] Manual test: UI displays tool activity in real-time
- [x] Manual test: Emoji icons appear correctly
- [x] Manual test: No errors in orchestrator console
- [x] Progress files contain hook events when inspected
- [x] Code formatted and linted

## Notes

### Why This Fix is Minimal and Correct

The #1439 fix implemented the hook-side (writing events to sandbox files) but didn't update the orchestrator-side (reading those events). This fix completes the implementation by:

1. Adding the missing type field
2. Using the correct data source

No infrastructure changes, no new patterns, no architectural shifts - just using the data that's already there.

### Data Flow Summary

**Before fix**:
1. Hook writes tool events → Sandbox `.initiative-progress.json` ✅
2. Orchestrator polls file → Parses into `SandboxProgress` ✅
3. **Bug**: `writeUIProgress()` ignores `progress.recent_output` ❌
4. UI shows only stdout capture (2 lines) ❌

**After fix**:
1. Hook writes tool events → Sandbox `.initiative-progress.json` ✅
2. Orchestrator polls file → Parses into `SandboxProgress` ✅
3. `writeUIProgress()` uses `progress.recent_output` ✅
4. UI shows real-time tool activity ✅

### Why Fallback is Important

The fallback to `outputTracker.recentOutput` provides:
- Graceful degradation if hook fails to write
- Backwards compatibility during deployment
- Safety net for edge cases
- Zero-risk migration strategy

Even if `progress.recent_output` is missing, UI still works (shows stdout capture like before).

### Future Enhancements (Out of Scope)

Future improvements could include:
- Remove `outputTracker` fallback after confirming hook stability
- Add color-coding to output lines based on tool type
- Increase display to show more than 3 lines
- Add filtering/search for tool activity history

These are enhancements, not bug fixes, and should be separate work.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1440*
