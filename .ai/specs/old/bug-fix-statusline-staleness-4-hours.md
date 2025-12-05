# Bug Fix: Update Statusline Staleness Threshold to 4 Hours

**Related Diagnosis**: #619
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Staleness threshold hardcoded to 1800 seconds (30 minutes) instead of 14400 seconds (4 hours)
- **Fix Approach**: Update three hardcoded threshold values from 1800 to 14400 seconds
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The statusline components (build, test, codecheck) turn yellow (stale) after only 30 minutes instead of the desired 4 hours, creating unnecessary visual noise for successful builds that are still relatively fresh in development workflows.

For full details, see diagnosis issue #619.

### Solution Approaches Considered

#### Option 1: Direct Value Update ⭐ RECOMMENDED

**Description**: Change the three hardcoded `1800` values to `14400` in the statusline.sh script at lines 84, 124, and 167. This is the most straightforward fix with minimal code changes.

**Pros**:
- Simplest possible fix - just change three numbers
- Zero risk of introducing bugs
- No architectural changes needed
- Immediately testable and verifiable
- No performance impact
- Maintains existing code structure

**Cons**:
- Still hardcoded (but this is acceptable for statusline configuration)
- If future changes are needed, requires editing three locations again

**Risk Assessment**: low - Changes only numeric constants in isolated conditional checks with no side effects

**Complexity**: simple - Three identical single-value changes in a bash script

#### Option 2: Extract to Configuration Constant

**Description**: Define a constant `readonly DEV_FRESHNESS_THRESHOLD=14400` at the top of the file, then replace all three occurrences of `1800` with `$DEV_FRESHNESS_THRESHOLD`.

**Pros**:
- Single source of truth for the threshold
- Easier to modify in the future
- More maintainable
- Self-documenting with a descriptive constant name

**Cons**:
- Slightly more changes (4 lines instead of 3)
- Requires careful testing to ensure variable expansion works correctly
- Adds minor complexity to the script

**Why Not Chosen**: While this is better for long-term maintainability, the immediate value doesn't justify the additional changes. Option 1 is sufficient for now, and we can refactor to constants later if needed.

#### Option 3: Make Threshold Configurable via Environment Variable

**Description**: Allow users to set a `CLAUDE_STATUSLINE_FRESHNESS` environment variable to customize the threshold, with 14400 as the default.

**Pros**:
- Maximum flexibility for users
- No hardcoding at all
- Different projects could use different thresholds

**Cons**:
- Significantly more complex implementation
- Requires documentation
- Adds another configuration surface
- Over-engineering for a simple fix
- Potential for user confusion

**Why Not Chosen**: This is over-engineering. The user simply wants 4 hours instead of 30 minutes, not a fully configurable system. This would add unnecessary complexity for minimal benefit.

### Selected Solution: Direct Value Update

**Justification**: Given the straightforward nature of the bug (wrong hardcoded values), the simplest fix is the best. Changing three numbers carries virtually zero risk, requires minimal testing, and solves the problem completely. There's no need to introduce additional complexity when the fix is this simple.

**Technical Approach**:
- Locate the three `is_fresh` calls that use `1800` as the threshold
- Replace `1800` with `14400` in each location
- Update the inline comments from "30 minutes" to "4 hours"
- Optionally update the header comment on line 12 to reflect reality

**Architecture Changes**: None - this is a configuration value update

**Migration Strategy**: Not needed - the change is backwards compatible and takes effect immediately

## Implementation Plan

### Affected Files

- `.claude/statusline/statusline.sh` - Update staleness thresholds from 30 minutes to 4 hours

### New Files

None required

### Step-by-Step Tasks

#### Step 1: Update Build Status Threshold

Change line 84 and its comment:

- Locate line 84: `if is_fresh "$timestamp" 1800; then  # 30 minutes`
- Change to: `if is_fresh "$timestamp" 14400; then  # 4 hours`
- Update line 83 comment from "Green < 30m" to "Green < 4h"

**Why this step first**: Build status is the first component listed and most frequently viewed

#### Step 2: Update Test Status Threshold

Change line 124 and its comment:

- Locate line 124: `if is_fresh "$timestamp" 1800; then  # 30 minutes`
- Change to: `if is_fresh "$timestamp" 14400; then  # 4 hours`
- Update line 123 comment from "Green < 30m" to "Green < 4h"

#### Step 3: Update Codecheck Status Threshold

Change line 167 and its comment:

- Locate line 167: `if is_fresh "$timestamp" 1800; then  # 30 minutes`
- Change to: `if is_fresh "$timestamp" 14400; then  # 4 hours`
- Update line 166 comment from "Green < 30m" to "Green < 4h"

#### Step 4: Update Header Comment (Optional but Recommended)

Update line 12 to reflect the actual implementation:

- Current: `# 🟢 = Success, fresh (< 30min for dev, < 4h for CI)`
- Change to: `# 🟢 = Success, fresh (< 4h for dev tools, varies for CI)`

**Why**: The comment was misleading because dev tools were using 30min, not 4h

#### Step 5: Validation

- Verify syntax with shellcheck (if available)
- Manually test by running a build/codecheck and observing statusline behavior
- Wait 30 minutes to confirm green indicator persists (previously would turn yellow)
- Optionally wait 4 hours to confirm yellow indicator appears at correct threshold

## Testing Strategy

### Unit Tests

No unit tests exist for bash statusline scripts. Testing will be manual and observational.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run successful build: `pnpm build`
- [ ] Verify statusline shows green build indicator immediately
- [ ] Wait 35 minutes (past old 30-minute threshold)
- [ ] Verify statusline still shows green (not yellow)
- [ ] Run successful codecheck: `pnpm codecheck`
- [ ] Verify statusline shows green codecheck indicator immediately
- [ ] Wait 35 minutes
- [ ] Verify statusline still shows green codecheck indicator
- [ ] Verify no shell errors or warnings in debug log (if DEBUG_STATUSLINE=true)
- [ ] Check that time ago displays correctly (should show "Xm" or "Xh")

**Optional extended test** (if time permits):
- [ ] Wait 4+ hours after a successful build
- [ ] Verify statusline turns yellow at the correct threshold

### Regression Prevention

Verify that:
- Red (failed) indicators still work correctly
- Running process indicators (⟳) still work
- Other statusline components (docker, CI, PR) are unaffected
- Time formatting function still works correctly

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect value calculation**
   - **Likelihood**: low
   - **Impact**: low (would just have wrong threshold again)
   - **Mitigation**: Double-check math (4 hours × 60 min × 60 sec = 14400)

2. **Syntax error in bash script**
   - **Likelihood**: low
   - **Impact**: medium (statusline would break)
   - **Mitigation**: Use shellcheck if available, test manually before committing

3. **Unexpected side effects on other statusline components**
   - **Likelihood**: very low
   - **Impact**: low
   - **Mitigation**: The changes are isolated to three specific conditional checks

**Rollback Plan**:

If this fix causes issues:
1. Revert the commit with `git revert <commit-hash>`
2. Or manually change the three values back from `14400` to `1800`
3. Restart Claude Code to reload statusline script

**Monitoring**:
- Watch for any statusline errors in terminal
- Verify statusline continues to update correctly
- Check debug logs if DEBUG_STATUSLINE=true

## Performance Impact

**Expected Impact**: none

The `is_fresh()` function performs the same arithmetic comparison regardless of threshold value. Changing from 1800 to 14400 has zero performance impact.

## Security Considerations

**Security Impact**: none

This is a display-only configuration change with no security implications. The statusline script does not handle user input or execute privileged operations.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Run a successful build
pnpm build

# Check statusline immediately (should be green)
# Then wait 31 minutes and check again (should turn yellow - this is the bug)

# Alternative: Manually create a status file with old timestamp
timestamp=$(( $(date +%s) - 1900 ))  # 31 minutes ago
echo "success|${timestamp}|0" > /tmp/.claude_build_status_$(git rev-parse --show-toplevel | tr '/' '_')

# Now check statusline - should show yellow
```

**Expected Result**: Build indicator turns yellow after 30 minutes (demonstrating the bug)

### After Fix (Bug Should Be Resolved)

```bash
# Run the fix (apply changes)
# Then test:

# Run a successful build
pnpm build

# Check statusline immediately (should be green)
# Wait 31 minutes and check again (should STILL be green)

# Alternative: Test with manually created timestamp
timestamp=$(( $(date +%s) - 1900 ))  # 31 minutes ago
echo "success|${timestamp}|0" > /tmp/.claude_build_status_$(git rev-parse --show-toplevel | tr '/' '_')

# Now check statusline - should show green (not yellow)

# Test that yellow still appears after 4+ hours
timestamp=$(( $(date +%s) - 14500 ))  # 4 hours + 5 minutes ago
echo "success|${timestamp}|0" > /tmp/.claude_build_status_$(git rev-parse --show-toplevel | tr '/' '_')

# Check statusline - should show yellow
```

**Expected Result**: Build indicator stays green for 4 hours, then turns yellow after

### Regression Prevention

```bash
# Verify failed builds still show red
echo "failed|$(date +%s)|5" > /tmp/.claude_build_status_$(git rev-parse --show-toplevel | tr '/' '_')
# Check statusline - should show red with error count

# Verify running indicator works
echo "$$" > /tmp/.claude_build_running_$(git rev-parse --show-toplevel | tr '/' '_').pid
# Check statusline - should show ⟳ building

# Clean up test files
rm -f /tmp/.claude_*_status_* /tmp/.claude_*_running_*.pid
```

## Dependencies

**No new dependencies required**

This is a pure configuration change to an existing bash script.

## Database Changes

**No database changes required**

The statusline uses temporary files in `/tmp/` for state management. No database or persistent storage is involved.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None - the change takes effect immediately when Claude Code reloads the statusline script (happens automatically on next statusline refresh)

**Feature flags needed**: no

**Backwards compatibility**: maintained - the change only affects display behavior, not functionality

**Rollout strategy**:
- Apply fix in development branch
- Test manually for 35+ minutes to verify green persists
- Merge to main branch
- Change takes effect on next Claude Code session

## Success Criteria

The fix is complete when:
- [ ] All three threshold values updated from 1800 to 14400
- [ ] Comments updated to reflect "4 hours" instead of "30 minutes"
- [ ] Manual testing confirms green indicators persist past 30 minutes
- [ ] No shell errors or warnings in statusline script
- [ ] Regression checks pass (red indicators, running indicators still work)
- [ ] Code committed with proper conventional commit message

## Notes

### Why 4 Hours?

The 4-hour threshold provides a good balance for development workflows:
- Long enough that builds from earlier in the workday don't appear stale
- Short enough that truly old builds from previous days are marked as stale
- Matches common development session lengths (half a workday)

### Future Enhancements (Not in Scope)

If configurable thresholds become desired in the future, consider:
- Extract to a constant at the top of the file
- Read from `.claude/settings.json` if that becomes a pattern
- Support environment variables for per-project customization

However, for now, the simple hardcoded 4-hour threshold is sufficient.

### Related Work

The diagnosis mentioned that line 12's comment suggested different thresholds for "dev" vs "CI", but the implementation never distinguished between contexts. This fix updates the dev threshold to 4 hours. If CI/CD components need different thresholds in the future, that would be a separate enhancement.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #619*
