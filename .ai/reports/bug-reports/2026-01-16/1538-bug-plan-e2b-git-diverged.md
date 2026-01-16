# Bug Fix: E2B Sandbox Git Branch Divergence on Startup

**Issue**: #1538
**Related Diagnosis**: #1537
**Severity**: critical
**Bug Type**: error
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: E2B template contains stale git repo where local `dev` diverged from `origin/dev`; `git pull` fails without merge strategy
- **Fix Approach**: Replace `git pull` with `git fetch` + `git reset --hard` to force-sync template's stale branch to remote state
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The orchestrator fails at sandbox creation when trying to create a new feature branch. The E2B template contains a git repository snapshot from months ago where the local `dev` branch has diverged from `origin/dev` (1 local commit vs 2923 remote commits). The code runs `git pull origin dev` which fails with exit code 128 because git doesn't know whether to merge or rebase.

For full details, see diagnosis issue #1537.

### Solution Approaches Considered

#### Option 1: Force Reset to Remote State ⭐ RECOMMENDED

**Description**: Replace `git pull origin dev` with `git fetch origin dev && git reset --hard origin/dev`. This discards the template's stale local branch and forces it to match the remote state exactly.

**Pros**:
- Simple, surgical change (one line modification)
- Always works regardless of divergence amount or history
- No git configuration needed
- Fast execution (no merge computation)
- Idempotent - can run multiple times safely
- Matches the "existing branch" code path logic (line 151 uses similar pattern)

**Cons**:
- Discards any local commits in template (not a real concern - template shouldn't have custom commits)
- Slightly less intuitive than `git pull` for developers reading the code

**Risk Assessment**: low - This is standard git practice for syncing to remote state. Since the template should never have custom commits, discarding local state is safe and desired.

**Complexity**: simple - Single line change, well-tested git operations

#### Option 2: Configure Pull Strategy

**Description**: Add `git config pull.rebase false` or `git config pull.ff only` before the pull command to give git a merge strategy.

**Pros**:
- Uses standard `git pull` command
- More familiar to developers

**Cons**:
- Requires extra command (slower)
- `pull.rebase false` would create merge commits (undesired)
- `pull.ff only` would fail if fast-forward impossible (same problem)
- Doesn't solve the fundamental issue of diverged history

**Why Not Chosen**: Configuring pull strategy doesn't actually solve the problem - if branches have truly diverged, we'd still get errors or unwanted merge commits. Force reset is cleaner.

#### Option 3: Use `git checkout -B dev origin/dev`

**Description**: Use `git checkout -B` flag to force-create/reset the `dev` branch to point at `origin/dev`.

**Pros**:
- Single command (concise)
- Built-in git flag for this exact scenario

**Cons**:
- Requires `git fetch origin dev` first anyway (same number of commands)
- Less explicit about what's happening (magic flag)
- Doesn't handle case where we're already on `dev` branch as cleanly

**Why Not Chosen**: Functionally equivalent to Option 1 but less explicit and requires same fetch step. Option 1 is clearer about intent.

### Selected Solution: Force Reset to Remote State

**Justification**:
- Solves the root cause directly: template's stale local branch is discarded
- Minimal change: one line modification
- Low risk: standard git practice, no chance of breaking working scenarios
- Consistent: matches pattern already used in "existing branch" path (line 151)
- Future-proof: will work even if template becomes more diverged over time

**Technical Approach**:
1. Keep `git fetch origin` (already done at line 137)
2. Replace the problematic chained command at lines 156-159
3. Use `git fetch origin dev && git reset --hard origin/dev` to force local `dev` to match remote
4. Then create new branch as before: `git checkout -b "${branchName}"`

**Architecture Changes**: None - this is a drop-in replacement that doesn't affect system architecture.

**Migration Strategy**: Not needed - fix is backwards compatible and applies at runtime.

## Implementation Plan

### Affected Files

- `.ai/alpha/scripts/lib/sandbox.ts` (lines 154-159) - Replace git pull with fetch + reset pattern

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Modify git branch setup logic

Replace the problematic `git pull` with force reset pattern.

**In `.ai/alpha/scripts/lib/sandbox.ts`**:
- Locate lines 154-159 (the `else` block for creating new branch from dev)
- Replace the single chained command with three separate commands for better error handling and logging:
  1. `git fetch origin dev` - Fetch latest remote state
  2. `git reset --hard origin/dev` - Force local dev to match remote (discard template's stale state)
  3. `git checkout -b "${branchName}"` - Create feature branch from now-current dev

**Why this step first**: This is the only code change needed and directly fixes the root cause.

#### Step 2: Add inline documentation

Add a code comment explaining why we use `reset --hard` instead of `pull`.

- Add comment above the git commands explaining: "Force reset to match remote state (template may have stale/diverged dev branch)"

**Why this step**: Prevents future developers from "fixing" this back to `git pull` without understanding the context.

#### Step 3: Verify the fix works

Manually test the fix with the actual orchestrator command.

- Run: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock --dry-run`
- Run: `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock` (actual run)
- Verify sandbox creation succeeds past the git setup phase
- Check that feature branch is created correctly

#### Step 4: Run validation commands

Run full validation suite to ensure no regressions.

- `pnpm typecheck` - Ensure TypeScript is happy
- `pnpm lint` - Check code style
- `pnpm format` - Format code
- Review git diff to confirm change is minimal and surgical

## Testing Strategy

### Unit Tests

No new unit tests required - this is orchestrator infrastructure code that requires live E2B sandbox to test.

**Rationale**: The git operations happen inside E2B sandboxes which can't be easily mocked. Manual testing with actual orchestrator run is the appropriate validation.

### Integration Tests

Not applicable - this code runs in the context of E2B sandbox orchestration.

### E2E Tests

Not applicable - orchestrator is developer tooling, not production code.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (run orchestrator before fix, should fail with exit 128)
- [ ] Apply fix
- [ ] Run orchestrator with `--dry-run` to verify parsing/validation
- [ ] Run orchestrator for real: `tsx spec-orchestrator.ts 1362 --force-unlock`
- [ ] Verify sandbox creation succeeds (passes git setup phase)
- [ ] Verify feature branch is created: `alpha/spec-1362`
- [ ] Verify multiple sandboxes can be created (stagger delay works)
- [ ] Check sandbox git log to confirm dev branch is at correct state
- [ ] Verify features can be implemented (full workflow test)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Template has intentional local commits that need preservation**
   - **Likelihood**: very low
   - **Impact**: low
   - **Mitigation**: E2B templates should only contain clean repo snapshots. If custom commits exist, they indicate a template build problem that should be fixed separately. Our approach discards them (correct behavior).

2. **Git reset command fails for other reasons**
   - **Likelihood**: very low
   - **Impact**: medium
   - **Mitigation**: If fetch succeeds but reset fails, the error will be caught and logged. The chained command approach ensures we fail fast with clear error message.

3. **Performance impact of separate commands vs chained**
   - **Likelihood**: certain
   - **Impact**: very low
   - **Mitigation**: Separating into 3 commands adds ~100ms total (negligible). Better error visibility outweighs microseconds of extra overhead.

**Rollback Plan**:

If this fix causes unexpected issues:
1. Revert the single line change in `sandbox.ts`
2. Original chained command: `git checkout dev && git pull origin dev && git checkout -b "${branchName}"`
3. Investigate why reset approach failed (very unlikely)

**Monitoring**: Not needed - this is developer tooling that either works or fails visibly.

## Performance Impact

**Expected Impact**: none

The change from `git pull` to `fetch + reset` is actually slightly faster:
- `git pull` = fetch + merge computation
- `git reset --hard` = pointer update (no merge needed)

Difference is negligible (~50-100ms in either case).

**Performance Testing**: Manual observation during orchestrator run is sufficient.

## Security Considerations

**Security Impact**: none

This change affects git operations inside ephemeral E2B sandboxes. No security boundaries are crossed.

**Security review needed**: no
**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Reproduce the original bug
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock

# Expected: Fails with exit code 128 during sandbox creation
# Error: "Your branch and 'origin/dev' have diverged..."
```

**Expected Result**: Orchestrator crashes with `CommandExitError: exit status 128`

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint:fix

# Format
pnpm format:fix

# Verify orchestrator can create sandboxes
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock --dry-run

# Full run (validates complete workflow)
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock

# Verify git state in sandbox (if needed for debugging)
# Inside sandbox: git log --oneline -5
```

**Expected Result**: All commands succeed. Orchestrator creates sandboxes successfully and proceeds to feature implementation phase.

### Regression Prevention

```bash
# Verify no TypeScript errors introduced
pnpm typecheck

# Ensure code style is consistent
pnpm lint

# Run orchestrator in dry-run mode multiple times
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run
```

## Dependencies

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: none

This is developer tooling that runs locally. No deployment to production systems.

**Special deployment steps**: None - developers pull the fix via git

**Feature flags needed**: no

**Backwards compatibility**: maintained - fix only affects orchestrator startup, all other behavior unchanged

## Success Criteria

The fix is complete when:
- [ ] Code change applied to `sandbox.ts`
- [ ] Inline comment added explaining the approach
- [ ] TypeScript check passes
- [ ] Linter passes
- [ ] Manual test: orchestrator runs without git exit 128 error
- [ ] Manual test: sandbox creation succeeds and feature branch is created
- [ ] Manual test: multiple sandboxes can be created (full workflow)
- [ ] Code review approved (if applicable)
- [ ] Git diff shows minimal, surgical change

## Notes

### Why Not Fix the Template Instead?

The diagnosis suggested two fixes: code change (immediate) and template rebuild (long-term). This plan focuses on the code fix because:

1. **Template staleness is inevitable**: Even if we rebuild the template today, it will become stale again over time as new commits accumulate. The code must handle this scenario.

2. **Code fix is permanent**: Once we use `reset --hard`, the orchestrator will always work regardless of template state.

3. **Template rebuild is orthogonal**: We can rebuild the template separately as a performance optimization (reduce git operations at startup), but it's not required to fix the bug.

4. **Defense in depth**: Even with a fresh template, the code should be resilient to diverged branches.

### Git Strategy Rationale

The fix uses `git reset --hard origin/dev` because:

- **Correctness**: Template's local dev should always match remote dev (no custom commits)
- **Simplicity**: One command, no merge logic, always works
- **Consistency**: Matches the pattern used for existing branch checkout (line 151)
- **Idempotency**: Safe to run multiple times

This is the standard git pattern for "make my local branch exactly match remote, I don't care about local changes."

### Related Code Patterns

Note that the "existing branch" path (lines 148-153) already uses a similar force-update pattern:
```typescript
git checkout -B "${branchName}" FETCH_HEAD
```

The `-B` flag force-updates the branch. Our fix brings the "new branch" path into alignment with this pattern.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1537*
