# Bug Fix: Overall Progress Shows 0 Tasks During Feature Execution

**Related Diagnosis**: #2049
**Severity**: medium
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `overall-progress.json` reads `tasks_completed` from manifest only AFTER features finish, not during execution. Sandbox progress files have real-time data but aren't propagated to the manifest during execution.
- **Fix Approach**: Update manifest's `feature.tasks_completed` with real-time counts from sandbox progress during the polling loop
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The "Overall Progress" display shows `0/99 tasks completed` while sandboxes are actively executing tasks (sandbox progress files show 1-3 completed tasks). This is a regression from #1688, which removed sandbox-level aggregation from the UI poller but didn't maintain real-time task counts in the manifest.

**Data flow gap:**
```
Sandbox progress files (sbx-a,b,c-progress.json)  → Real-time, accurate
                              ╳ (disconnected during execution)
Manifest feature.tasks_completed → Stale (always 0 during execution)
                              ↓
overall-progress.json          → Shows 0 (incorrect)
```

For full details, see diagnosis issue #2049.

### Solution Approaches Considered

#### Option 1: Sync Sandbox Progress to Manifest During Polling ⭐ RECOMMENDED

**Description**: In `progress.ts:startProgressPolling()`, after reading each sandbox's progress file, update the corresponding feature's `tasks_completed` count in the manifest before writing `overall-progress.json`. This bridges the data flow gap without adding complexity.

**Pros**:
- Simple, surgical fix (1-2 locations to change)
- Reuses existing data flow mechanisms
- Maintains single source of truth (manifest)
- Low risk: only adds data propagation, no structural changes
- Self-corrects if counts diverge

**Cons**:
- Requires careful mapping between sandbox progress and manifest features
- Adds manifest write operations in the polling loop (minor I/O overhead)

**Risk Assessment**: low - Only reads sandbox data and updates existing fields. No architectural changes.

**Complexity**: simple - Core change is one `feature.tasks_completed = count` assignment in the polling loop.

#### Option 2: Change UI to Read Sandbox Progress Directly

**Description**: Modify `useProgressPoller.ts` to read sandbox progress files directly instead of relying on `overall-progress.json`.

**Pros**:
- Would always show real-time data

**Cons**:
- Breaks the manifest-authoritative design from #1688
- Reintroduces double-counting risk
- More complex UI logic to handle multiple files
- Harder to maintain single source of truth

**Why Not Chosen**: Option 1 is simpler and maintains the architectural principle of manifest-authoritative state.

#### Option 3: Create Separate Real-time Progress Aggregator

**Description**: Build a new aggregation service that continuously reads sandbox files and maintains a separate real-time progress file.

**Pros**:
- Cleanest separation of concerns

**Cons**:
- Over-engineering for this bug
- Adds complexity and maintenance burden
- Introduces another source of truth
- Not proportional to the problem

**Why Not Chosen**: Option 1 solves the issue with minimal changes; Option 3 would be premature abstraction.

### Selected Solution: Sync Sandbox Progress to Manifest During Polling

**Justification**: This approach is simple, surgical, and maintains the manifest-authoritative design established in #1688. By propagating real-time counts from sandbox progress files into the manifest during polling, we bridge the data flow gap without architectural changes or risk of regression.

**Technical Approach**:
1. In `progress.ts:startProgressPolling()`, after parsing each sandbox's progress file
2. Find the corresponding feature(s) being executed in that sandbox from `manifest.feature_queue`
3. Update `feature.tasks_completed = progress.completed_tasks.length`
4. Continue with existing `writeOverallProgress()` call - it now has current data

**Architecture Changes** (minimal):
- No new files or dependencies
- No schema changes to progress files or manifest
- Only adds data synchronization in existing polling loop
- All changes contained to `progress.ts`

**Migration Strategy**: None needed - this is a pure data flow fix.

## Implementation Plan

### Affected Files

List files that need modification:

- `apps/web/.ai/alpha/scripts/lib/progress.ts` - Add sandbox-to-manifest sync in polling loop
- `apps/web/.ai/alpha/scripts/lib/config/constants.ts` - No changes needed (already has progress polling interval)

### Step-by-Step Tasks

#### Step 1: Understand the Data Flow

Understand the relationships between:
- Sandbox progress format: `sbx-{a,b,c}-progress.json` with `completed_tasks: string[]`
- Manifest feature structure: `manifest.feature_queue[].tasks_completed`
- Mapping: Which feature(s) is executing in each sandbox

**Why this step first**: Critical to ensure correct mapping between sandbox and features.

#### Step 2: Implement Sync Logic in `progress.ts`

In `startProgressPolling()` function:

```typescript
// After reading and parsing sandbox progress file
const progress = JSON.parse(progressContent); // Has completed_tasks: string[]

// Find features currently executing in this sandbox
const featuresInSandbox = manifest.feature_queue.filter(f => f.current_sandbox === sandboxName);

// Update each feature's task count
for (const feature of featuresInSandbox) {
  feature.tasks_completed = progress.completed_tasks.length;
}

// existing writeOverallProgress() now sees current counts
writeOverallProgress(manifest);
```

Key details:
- The sandbox name is extracted from the progress filename (e.g., `sbx-a-progress.json` → `sbx-a`)
- Match `manifest.current_sandbox` field on features to determine which are running in that sandbox
- Use task count from sandbox progress, not from manifest (bootstrap with real data)

#### Step 3: Add Unit Tests

Add test cases to verify:
- ✅ Sandbox progress with 3 completed tasks updates manifest correctly
- ✅ Multiple sandboxes update independent features
- ✅ Feature with no active sandbox keeps existing count
- ✅ Stale sandbox progress (outdated file) doesn't regress counts
- ✅ Regression test: Original bug should not reoccur

**Test files**:
- `apps/web/.ai/alpha/scripts/lib/__tests__/progress.spec.ts` - New tests for sync logic

#### Step 4: Validate Integration

Test the fix in realistic scenarios:

- Start S2045 with GPT provider
- Wait 5+ minutes of execution
- Verify `overall-progress.json` updates with real task counts (not 0)
- Verify counts increase as sandbox completes tasks
- Check `spec-manifest.json` has matching `tasks_completed` values

**Why this step**: Ensures the fix works end-to-end without regression.

#### Step 5: Validate Against Related Issues

Ensure the fix doesn't reintroduce problems from:
- #1688: Double-counting (we're reading from one authoritative source: sandbox progress)
- #1699, #1701: UI hang/timeout (polling interval unchanged)
- #1955, #1957: Status transitions (we only update count, not status)

Run existing tests to ensure no regression.

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `syncSandboxProgressToManifest()`: Maps 3 completed tasks → manifest count 3
- ✅ Multiple sandboxes: A=2 tasks, B=1 task updates both features independently
- ✅ Edge case: Sandbox completes faster than others (counts may differ per feature)
- ✅ Edge case: Feature moves between sandboxes (count preserved, reassigned)
- ✅ Regression test: Verify bug doesn't reoccur with polling loop

**Test files**:
- `apps/web/.ai/alpha/scripts/lib/__tests__/progress.spec.ts` - Unit tests for sync logic

### Integration Tests

Test the full flow:
- `overall-progress.json` is written with current task counts (not 0)
- UI poller reads updated `overall-progress.json` and displays correct counts
- Counts increase as features complete tasks

**Test approach**:
- Mock sandbox progress files with various completion states
- Verify manifest updates before `writeOverallProgress()`
- Verify UI poller reads updated data

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start S2045 spec with GPT provider in dev environment
- [ ] Wait 3+ minutes for sandboxes to execute tasks
- [ ] Check `overall-progress.json` shows non-zero task counts (not `0/99`)
- [ ] Verify counts match sandbox progress files (sbx-a, sbx-b, etc.)
- [ ] Verify counts increase as task completion progresses
- [ ] Kill a sandbox and verify count doesn't reset to 0
- [ ] Restart the orchestrator and verify counts remain consistent
- [ ] Check browser console for no new errors or warnings
- [ ] Verify no performance degradation in polling (< 100ms per cycle)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect Sandbox-to-Feature Mapping**: Might update wrong features' task counts
   - **Likelihood**: low (we check `current_sandbox` field)
   - **Impact**: medium (shows wrong progress to user, but non-fatal)
   - **Mitigation**: Verify feature.current_sandbox is correctly set during execution. Add logging. Test with multi-sandbox specs.

2. **Stale Progress Files**: Reading an old progress file gives wrong count
   - **Likelihood**: low (files are written every polling cycle)
   - **Impact**: low (count will self-correct on next cycle)
   - **Mitigation**: Include file modification time in validation. Log when counts jump unexpectedly.

3. **Manifest Write Contention**: Polling loop writes manifest while orchestrator reads/modifies it
   - **Likelihood**: low (orchestrator stagger is 60s, polling is 5-10s)
   - **Impact**: low (JSON is atomic on modern systems)
   - **Mitigation**: Existing locking pattern (check for write-lock before reading). No change needed.

4. **Reintroduces #1688 Bug**: Double-counting if we're not careful about source of truth
   - **Likelihood**: very low (we read from one source: sandbox progress)
   - **Impact**: high (would break progress tracking)
   - **Mitigation**: Never aggregate across multiple sandboxes. Read only from sandbox progress, not manifest counts.

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit (`git revert <commit-hash>`)
2. Redeploy orchestrator
3. Delete any corrupted `overall-progress.json` files
4. Restart spec execution
5. File issue with new regression details

**Monitoring** (not required, but helpful):

- Monitor `overall-progress.json` updates in real-time during spec execution
- Log sync operations: "Updated feature X.Y from 0 to 3 tasks"
- Alert if counts diverge significantly from sandbox progress files

## Performance Impact

**Expected Impact**: minimal

The polling loop already reads sandbox progress files. Adding a few manifest field updates is negligible:
- File I/O: Same (already reading files)
- JSON parsing: Same (already parsing progress)
- Manifest update: O(n) where n = number of features in queue (typically 5-20)
- Write to disk: Same (already calling `writeOverallProgress()`)

**Performance Testing**:
- Verify polling cycle stays under 100ms (currently ~50ms)
- No memory leaks in polling loop
- Manifest file size doesn't grow due to this change (no schema changes)

## Security Considerations

**Security Impact**: none

No security implications:
- Only reading/updating internal progress metadata
- No user data affected
- No authentication/authorization changes
- No privilege escalation possible

## Validation Commands

### Before Fix (Bug Should Reproduce)

Start a spec and check progress:

```bash
# Terminal 1: Start the orchestrator with a spec
cd /home/msmith/projects/2025slideheroes
pnpm dev  # Starts orchestrator

# Terminal 2: Monitor progress
watch -n 2 'cat .ai/alpha/specs/S2045-Spec-*/overall-progress.json | jq .'
```

**Expected Result**: `tasksCompleted: 0` for first 5+ minutes despite sandboxes executing tasks.

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests (if applicable)
pnpm --filter web test -- progress.spec.ts

# Run spec execution
pnpm dev

# Monitor progress (should increment, not stay at 0)
watch -n 2 'cat .ai/alpha/specs/S2045-Spec-*/overall-progress.json | jq .'
```

**Expected Result**:
- All commands succeed
- `overall-progress.json` shows increasing task counts (e.g., 2/99, 5/99, etc.)
- Counts match sandbox progress files
- No regressions from #1688

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify progress tracking with mock spec
# (Test with S2045 or any active spec execution)

# Check for related issue regressions
# #1688: Double-counting
# #1699: UI hang
# #1701: PTY timeout
# #1955, #1957: Status transitions
```

## Dependencies

### New Dependencies

No new dependencies required.

### Existing Dependencies

Uses existing modules:
- `fs` for file operations
- `JSON` for parsing/stringifying progress data

## Database Changes

**Database changes needed**: no

Progress data is JSON-based in the filesystem, not in the database. No migrations or schema changes required.

## Deployment Considerations

**Deployment Risk**: low

No breaking changes. Safe to deploy:
- No schema migrations
- No environment variable changes
- No database changes
- Backwards compatible with existing specs

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: Maintained

Old specs with stale manifest will automatically sync on next polling cycle.

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (progress shows non-zero counts)
- [ ] All tests pass (unit, integration, E2E if applicable)
- [ ] Zero regressions detected from #1688, #1699, #1701, #1955, #1957
- [ ] Manual testing checklist complete
- [ ] Performance acceptable (polling cycle < 100ms)
- [ ] Counts sync correctly between sandbox and manifest

## Notes

**Related Work**:
- #1688: "Fix double-counting regression" - Introduced manifest-authoritative design. This fix maintains that principle.
- #1699, #1701: PTY timeout and UI hang fixes. Our change doesn't affect those flows.
- #1955, #1957: Status transition refactors. Our change only updates progress counts, not status fields.

**Implementation Details**:
- The manifest's `feature_queue` array has features in execution order
- Each feature has a `current_sandbox` field indicating which sandbox (if any) is executing it
- Sandbox progress files use task IDs in format `S#.I#.F#.T#` (e.g., `S2045.I1.F1.T1`)
- Task count is simply `completed_tasks.length` from the sandbox progress file

**Testing Strategy**:
- Start simple: Verify one feature with one sandbox syncs correctly
- Add complexity: Multiple features across multiple sandboxes
- Edge cases: Features with no active sandbox, sandbox crashes, rapid completions

**Why This Fix**:
The polling loop already reads sandbox progress files every 5-10 seconds. By propagating that data into the manifest before writing overall progress, we close the data flow gap introduced in #1688's fix. This is the minimal change that restores real-time progress tracking while maintaining manifest-authoritative state.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #2049*
