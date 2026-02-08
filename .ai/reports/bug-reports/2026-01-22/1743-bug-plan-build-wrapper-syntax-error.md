# Bug Fix: build-wrapper.sh Syntax Error in Arithmetic Expression

**Related Diagnosis**: #1738 (REQUIRED)
**Severity**: low
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `grep -c` outputs "0" even when returning exit code 1 (no matches). The `|| echo "0"` fallback appends another "0", resulting in "0\n0" which cannot be parsed in bash arithmetic
- **Fix Approach**: Replace `|| echo "0"` with proper exit code handling using conditional assignment
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `build-wrapper.sh` script crashes with a bash arithmetic syntax error when parsing build output. The issue occurs in `parse_build_errors()` function where `grep -c` is used with a fallback pattern that causes malformed output.

When `grep -c` finds no matches, it:
1. Outputs "0" to stdout
2. Returns exit code 1

The current pattern `grep -c ... || echo "0"` incorrectly handles this:
- `grep` succeeds in outputting "0"
- Exit code 1 is ignored because the output isn't empty
- Result becomes "0\n0" (two zeros separated by newline)
- Bash arithmetic fails: `error_count=$((error_count + 0\n0))` → syntax error

For full details, see diagnosis issue #1738.

### Solution Approaches Considered

#### Option 1: Conditional Assignment with Proper Exit Handling ⭐ RECOMMENDED

**Description**: Replace the `||` pattern with proper bash conditional assignment that correctly handles both grep output and exit codes.

```bash
# Before (buggy):
webpack_errors=$(grep -cE "^ERROR in" "$output_file" 2>/dev/null || echo "0")

# After (fixed):
webpack_errors=$(grep -cE "^ERROR in" "$output_file" 2>/dev/null) || webpack_errors=0
```

**Pros**:
- Simple, idiomatic bash pattern
- Correctly handles grep exit codes
- `grep -c` always outputs a number (even when no matches)
- Exit code properly checked after command completes
- No duplicate output or newlines
- Minimal changes to existing code

**Cons**:
- Requires understanding bash exit code handling
- Slightly more verbose than inline fallback

**Risk Assessment**: low - This is standard bash pattern used throughout Unix systems

**Complexity**: simple - One-line changes in 4 locations

#### Option 2: Redirect stderr Explicitly

**Description**: Use explicit stderr redirection with `2>&1` before the fallback.

```bash
# Alternative approach:
webpack_errors=$(grep -cE "^ERROR in" "$output_file" 2>&1 || echo "0")
```

**Pros**:
- Explicit about stderr handling
- Clear intent

**Cons**:
- Still has the same fundamental issue with the `||` fallback
- grep already uses `2>/dev/null`, adding `2>&1` introduces mixed stderr
- More complex than recommended approach

**Why Not Chosen**: Doesn't fix the root cause; grep still outputs "0" when no matches found

#### Option 3: Use Variable Assignment with Conditional

**Description**: Pre-assign a default value, then conditionally overwrite.

```bash
webpack_errors=0
grep -cE "^ERROR in" "$output_file" 2>/dev/null && webpack_errors=$(...)
```

**Pros**:
- Very explicit about intent
- Clear separation of concerns

**Cons**:
- More verbose (multiple lines per fix)
- Requires restructuring multiple conditional blocks
- Harder to read in the context of the existing code

**Why Not Chosen**: Option 1 is clearer and more idiomatic

### Selected Solution: Conditional Assignment with Proper Exit Handling

**Justification**: This approach leverages bash's standard exit code handling patterns. It's simple, idiomatic, and fixes the root cause with minimal code changes. The pattern is widely used in production shell scripts throughout the Unix ecosystem.

**Technical Approach**:
- Replace the problematic `||` pattern in all 4 locations
- Let `grep -c` output its natural value (always a number)
- Use conditional assignment `|| variable=0` to set a default only if grep fails
- This properly respects exit codes while avoiding duplicate output

**Key Points**:
- `grep -c "pattern" file` outputs "0" when no matches (exit code 1)
- `$(command || fallback)` should use command substitution exit code, not output
- The fix uses `command || variable=0` outside of command substitution

## Implementation Plan

### Affected Files

- `.claude/statusline/build-wrapper.sh` - 4 occurrences of the buggy pattern (lines 45, 52, 59, 75)

### New Files

None required - this is a fix to existing code.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix Line 45 (ESBuild errors)

Replace:
```bash
esbuild_errors=$(grep -oE "^([0-9]+) errors?" "$output_file" | grep -oE "[0-9]+" | head -1 || echo "0")
```

With:
```bash
esbuild_errors=$(grep -oE "^([0-9]+) errors?" "$output_file" | grep -oE "[0-9]+" | head -1) || esbuild_errors=0
```

**Why this step first**: This is the first occurrence in the function; fixing in order prevents confusion.

#### Step 2: Fix Line 52 (Webpack errors)

Replace:
```bash
webpack_errors=$(grep -cE "^ERROR in" "$output_file" 2>/dev/null || echo "0")
```

With:
```bash
webpack_errors=$(grep -cE "^ERROR in" "$output_file" 2>/dev/null) || webpack_errors=0
```

**Why sequential**: Maintains code readability by fixing in source order.

#### Step 3: Fix Line 59 (Vite errors)

Replace:
```bash
vite_errors=$(grep -cE "error:" "$output_file" 2>/dev/null || echo "0")
```

With:
```bash
vite_errors=$(grep -cE "error:" "$output_file" 2>/dev/null) || vite_errors=0
```

#### Step 4: Fix Line 75 (Generic error fallback)

Replace:
```bash
error_count=$(grep -ciE "^[^w]*error[^s]" "$output_file" 2>/dev/null || echo "0")
```

With:
```bash
error_count=$(grep -ciE "^[^w]*error[^s]" "$output_file" 2>/dev/null) || error_count=0
```

#### Step 5: Validation and Testing

- Verify no bash syntax errors: `bash -n .claude/statusline/build-wrapper.sh`
- Test with a failing build that produces no specific error patterns
- Confirm error_count arithmetic completes without syntax error
- Verify build status is correctly recorded as "failed"

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ Grep returns "0" with exit code 1 (no matches) → properly assigned to variable
- ✅ Multiple consecutive grep commands without syntax errors
- ✅ Arithmetic operations on error_count succeeds (main regression test)
- ✅ Build output parsing with various build tool error formats

**Test files**:
- `.claude/statusline/test-build-wrapper.sh` (or equivalent shell test framework)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Script has no bash syntax errors: `bash -n .claude/statusline/build-wrapper.sh`
- [ ] Run script with a build that has no specific error patterns (triggers line 75)
- [ ] Verify no "syntax error in expression" message appears
- [ ] Verify error_count is correctly parsed and recorded
- [ ] Verify build status is updated to "failed" with error count
- [ ] Test with various build tools (pnpm, npm, turbo) to ensure all patterns work
- [ ] Check that successful builds still report as "success"

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Exit Code Behavior Change**: The fix changes when `error_count` gets set
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: grep always outputs a number for `grep -c`, so the conditional assignment only applies when grep fails entirely (missing file, permission error)

2. **Variable Scope Issues**: Variables assigned in command substitution may not persist
   - **Likelihood**: very low (not applicable - assignment is outside substitution)
   - **Impact**: high
   - **Mitigation**: The fix moves assignment outside command substitution, making it persist

3. **Unexpected Error Counts**: If grep fails with non-1 exit code
   - **Likelihood**: low (grep exits 0 or 1)
   - **Impact**: medium (wrong error count reported)
   - **Mitigation**: grep consistently returns 0 (match found) or 1 (no match), with 2 for errors

**Rollback Plan**:

If this fix causes issues (unlikely):
1. Revert `.claude/statusline/build-wrapper.sh` to previous version
2. Build wrapper will resume using old behavior
3. Original error will reoccur if build has no specific error patterns

**Monitoring** (if needed):
- Monitor build status updates for a few CI runs
- Watch for any "syntax error" messages in logs
- Verify error counts are still accurate

## Performance Impact

**Expected Impact**: none

The fix has zero performance impact - it's a syntax correction with no additional operations or logic changes.

## Security Considerations

**Security Impact**: none

No security implications - this is a bash syntax fix for a local development tool script.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Script with bugs exhibits syntax error when no specific error patterns match
# This happens when running a build that fails but doesn't match any of the
# specific error patterns (TypeScript, Webpack, Vite, etc.)

# To demonstrate:
bash -n .claude/statusline/build-wrapper.sh
# Output shows no syntax errors (the bug is runtime, not syntax-check detectable)

# Run a build that will produce no matches for the grep patterns
./.claude/statusline/build-wrapper.sh echo "generic build failure"
# ERROR: ./.claude/statusline/build-wrapper.sh: line 75: error_count + 0
# 0: syntax error in expression (error token is "0")
```

**Expected Result**: Script crashes with "syntax error in expression" when no specific build tool patterns match

### After Fix (Bug Should Be Resolved)

```bash
# Type check (bash syntax validation)
bash -n .claude/statusline/build-wrapper.sh

# Lint for common issues
shellcheck .claude/statusline/build-wrapper.sh

# Test with a build that produces no specific error patterns
./.claude/statusline/build-wrapper.sh echo "generic build failure"

# Verify error parsing works
./.claude/statusline/build-wrapper.sh true  # Should succeed
./.claude/statusline/build-wrapper.sh false # Should fail gracefully
```

**Expected Result**: All commands succeed, no syntax errors, error counting works correctly.

### Regression Prevention

```bash
# Run full validation
bash -n .claude/statusline/build-wrapper.sh
shellcheck .claude/statusline/build-wrapper.sh

# Test with various build scenarios
./.claude/statusline/build-wrapper.sh echo "No error patterns" 2>&1 | grep -q "syntax error"
# Should NOT find syntax error (test should return exit code 1 = grep found nothing)
```

## Dependencies

**No new dependencies required** - This is a bash script fix using only built-in utilities.

## Database Changes

**No database changes required** - This is a shell script fix with no data layer impact.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None required

**Feature flags needed**: no

**Backwards compatibility**: maintained - No changes to script interface or behavior, only internal syntax fix

## Success Criteria

The fix is complete when:
- [ ] All 4 locations in `.claude/statusline/build-wrapper.sh` are updated
- [ ] `bash -n` validation passes (no syntax errors)
- [ ] `shellcheck` passes (no style issues)
- [ ] Manual test with failing build completes without "syntax error" message
- [ ] Error count is correctly parsed and reported
- [ ] Build status is correctly updated in status line
- [ ] No regressions in normal (successful) builds

## Notes

This is a straightforward bash syntax fix that corrects improper error code handling in command substitutions. The root cause was a misunderstanding of how `grep -c` behaves:

- `grep -c "pattern" file` outputs a number (0-N) regardless of exit code
- Exit code 0 = matches found (output > 0)
- Exit code 1 = no matches (output = 0)

The buggy pattern `$(cmd || echo "0")` relies on cmd outputting nothing on failure, but `grep -c` always outputs a number. The fix moves the fallback outside the substitution where it properly handles exit codes.

**Related Issues**:
- Dependent on fixing #1737 (PAYLOAD_SECRET configuration) for the error to manifest in CI
- Secondary issue that adds confusion to CI output when build fails

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1738*
