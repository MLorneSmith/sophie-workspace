# Bug Diagnosis: Statusline Components Turn Yellow After 30 Minutes Instead of 4 Hours

**ID**: ISSUE-PENDING (will be assigned after GitHub creation)
**Created**: 2025-11-17T05:52:28Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Claude Code statusline components (build and codecheck) incorrectly turn yellow (stale) after 30 minutes instead of the desired 4 hours. This causes successful builds and codecheck runs to appear stale too quickly, creating unnecessary visual noise and reducing the usefulness of the statusline indicators.

## Environment

- **Application Version**: Claude Code (current)
- **Environment**: development
- **Node Version**: v22.16.0
- **Branch**: dev
- **Last Working**: Unknown (user reports issue started "in last few days")

## Reproduction Steps

1. Run a successful build: `pnpm build`
2. Run a successful codecheck: `pnpm codecheck`
3. Observe statusline components show green (🟢) immediately after completion
4. Wait 30 minutes without running build or codecheck again
5. Observe statusline components turn yellow (🟡) at the 30-minute mark

## Expected Behavior

- Green indicator (🟢) should remain for 4 hours after a successful build/codecheck
- Yellow indicator (🟡) should only appear after 4 hours to indicate staleness
- This provides a reasonable staleness threshold for development workflows

## Actual Behavior

- Green indicator (🟢) only lasts 30 minutes after successful build/codecheck
- Yellow indicator (🟡) appears at 30 minutes, making recent successful runs appear stale
- Creates unnecessary visual noise as builds are flagged as "old" too quickly

## Diagnostic Data

### Code Analysis

**File**: `.claude/statusline/statusline.sh`

**Build Status Logic** (lines 82-88):
```bash
if [ "$result" = "success" ]; then
    # Success: Green < 30m, Yellow after 30m
    if is_fresh "$timestamp" 1800; then  # 30 minutes
        build_status="🟢 build ($time_ago)"
    else
        build_status="🟡 build ($time_ago)"
    fi
```

**Test Status Logic** (lines 122-128):
```bash
if [ "$result" = "success" ]; then
    # Success: Green < 30m, Yellow after 30m
    if is_fresh "$timestamp" 1800; then  # 30 minutes
        test_status="🟢 test ($time_ago)"
    else
        test_status="🟡 test ($time_ago)"
    fi
```

**Codecheck Status Logic** (lines 165-171):
```bash
if [ "$result" = "success" ]; then
    # Success: Green < 30m, Yellow after 30m
    if is_fresh "$timestamp" 1800; then  # 30 minutes
        codecheck_status="🟢 codecheck ($time_ago)"
    else
        codecheck_status="🟡 codecheck ($time_ago)"
    fi
```

### Helper Function

**Function**: `is_fresh` (lines 56-64):
```bash
is_fresh() {
    local timestamp="$1"
    local threshold="$2"
    local current_time
    current_time=$(date +%s)
    local age=$((current_time - timestamp))

    [ $age -lt "$threshold" ]
}
```

### Recent Changes

Recent commits to statusline:
```
8d7f23303 docs(tooling): reorganize tool documentation and update integrations
```

No recent changes to the actual staleness threshold logic.

## Related Code

- **Affected Files**:
  - `.claude/statusline/statusline.sh` (main statusline script)
  - `.claude/statusline/lib/status-common.sh` (shared library, no staleness logic here)

- **Suspected Functions**:
  - `is_fresh()` function (helper, working correctly)
  - Build status block (lines 70-104)
  - Test status block (lines 108-147)
  - Codecheck status block (lines 150-193)

- **Recent Changes**:
  - No recent changes to staleness threshold values
  - Comment on line 12 claims "< 30min for dev, < 4h for CI" but implementation only uses 30min

## Related Issues & Context

No related issues found in repository history for statusline staleness configuration.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The staleness threshold is hardcoded to 1800 seconds (30 minutes) instead of 14400 seconds (4 hours) for development builds, tests, and codecheck components.

**Detailed Explanation**:

The statusline script `.claude/statusline/statusline.sh` contains three status check blocks (build, test, codecheck) that determine when to show green vs yellow indicators based on how old the status is. All three blocks call `is_fresh "$timestamp" 1800` where `1800` is the threshold in seconds.

**Calculation**:
- Current: `1800 seconds = 30 minutes`
- Desired: `14400 seconds = 4 hours (4 × 60 × 60)`

The comment on line 12 even documents the intended behavior:
```bash
# 🟢 = Success, fresh (< 30min for dev, < 4h for CI)
```

However, this comment is misleading or outdated. The code only implements the 30-minute threshold and does not distinguish between dev builds and CI builds. All three components (build, test, codecheck) use the same 30-minute threshold.

**Supporting Evidence**:

1. **Build status check** (`.claude/statusline/statusline.sh:84`):
   ```bash
   if is_fresh "$timestamp" 1800; then  # 30 minutes
   ```

2. **Test status check** (`.claude/statusline/statusline.sh:124`):
   ```bash
   if is_fresh "$timestamp" 1800; then  # 30 minutes
   ```

3. **Codecheck status check** (`.claude/statusline/statusline.sh:167`):
   ```bash
   if is_fresh "$timestamp" 1800; then  # 30 minutes
   ```

All three locations use the hardcoded value `1800` (30 minutes).

### How This Causes the Observed Behavior

When a user runs a successful build or codecheck:

1. Status file is written with current timestamp
2. Statusline reads the status file
3. Calls `is_fresh()` with 1800-second threshold
4. If status is < 30 minutes old → shows 🟢 green
5. If status is ≥ 30 minutes old → shows 🟡 yellow

After exactly 30 minutes, the condition `age < 1800` becomes false, triggering the yellow indicator even though the build is still relatively fresh for a development workflow.

### Confidence Level

**Confidence**: High

**Reasoning**:
- Root cause is definitively identified through code inspection
- Hardcoded values are clearly visible in three locations
- Logic flow is straightforward and deterministic
- User-reported behavior (yellow at 30min) exactly matches the implementation
- No environmental factors or race conditions involved
- Fix is trivial: change three numeric constants

## Fix Approach (High-Level)

Change the staleness threshold from 1800 seconds (30 minutes) to 14400 seconds (4 hours) in three locations:

1. Build status check (line 84): `if is_fresh "$timestamp" 1800;` → `if is_fresh "$timestamp" 14400;`
2. Test status check (line 124): `if is_fresh "$timestamp" 1800;` → `if is_fresh "$timestamp" 14400;`
3. Codecheck status check (line 167): `if is_fresh "$timestamp" 1800;` → `if is_fresh "$timestamp" 14400;`

Optionally update the comment on line 12 to clarify the actual thresholds used.

**Alternative approach**: Extract the threshold to a constant at the top of the file for easier future configuration:
```bash
readonly DEV_FRESHNESS_THRESHOLD=14400  # 4 hours
```

## Diagnosis Determination

**Root cause identified with high confidence**: The issue is caused by hardcoded 30-minute staleness thresholds in three locations within `.claude/statusline/statusline.sh`. The fix requires changing these three values from 1800 to 14400 seconds.

## Additional Context

The comment on line 12 suggests there was intended to be different thresholds for dev vs CI:
```bash
# 🟢 = Success, fresh (< 30min for dev, < 4h for CI)
```

However, the implementation does not distinguish between dev and CI contexts. The CI/CD status block (lines 196-272) uses GitHub API data with adaptive caching but does not use the same freshness logic. This suggests the comment may be outdated or the feature was never fully implemented.

For this fix, we'll simply update the dev threshold to 4 hours as requested by the user.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (git, node version check), Glob (file pattern search), Grep (code search), Read (file inspection)*
