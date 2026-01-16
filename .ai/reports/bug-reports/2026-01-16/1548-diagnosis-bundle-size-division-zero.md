# Bug Diagnosis: Bundle Size Alert Fails with Division by Zero

**ID**: ISSUE-pending
**Created**: 2026-01-16T19:55:00Z
**Reporter**: system/CI
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The Bundle Size Alert workflow fails with a bash arithmetic error "division by 0" when processing bundle size comparisons. The `convert_to_bytes()` function returns an empty string for certain size formats (like "0K"), causing the integer comparison and division operations to fail.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions)
- **Node Version**: 20
- **Runner**: runs-on (AWS spot instances)
- **Last Working**: Unknown - may have intermittent failures

## Reproduction Steps

1. Create a PR targeting `dev`, `staging`, or `main`
2. Observe "Bundle Size Alert" workflow run
3. Wait for "Analyze PR bundle sizes and compare" step
4. Observe failure when a bundle has "0K" size

## Expected Behavior

Bundle size comparison should handle "0K" or empty values gracefully and produce a valid report.

## Actual Behavior

Workflow fails with:
```
line 50: [: : integer expression expected
line 59: (current_bytes - base_bytes) * 100 / base_bytes : division by 0 (error token is "base_bytes ")
##[error]Process completed with exit code 1.
```

## Diagnostic Data

### Console Output
```
/home/runner/_work/_temp/449e1824-3915-42fc-8c46-fd13525b81fc.sh: line 50: [: : integer expression expected
/home/runner/_work/_temp/449e1824-3915-42fc-8c46-fd13525b81fc.sh: line 59: (current_bytes - base_bytes) * 100 / base_bytes : division by 0 (error token is "base_bytes ")
##[error]Process completed with exit code 1.
```

### Problematic Code Analysis

The `convert_to_bytes()` function at lines 117-141 in `.github/workflows/bundle-size-alert.yml`:

```bash
convert_to_bytes() {
  local size=$1
  # Remove any decimal points by extracting integer part only
  if [[ $size == *"."* ]]; then
    size=${size%%.*}${size##*.}  # BUG: Malformed extraction
    # ...
  fi

  if [[ $size == *"K" ]]; then
    echo $((${size%K} * 1024))  # BUG: "0K" -> ${size%K} = "0" -> 0 * 1024 = 0, but empty input fails
  elif [[ $size == *"M" ]]; then
    echo $((${size%M} * 1024 * 1024))
  elif [[ $size == *"G" ]]; then
    echo $((${size%G} * 1024 * 1024 * 1024))
  else
    echo ${size%B}  # BUG: If size is empty or just "0", returns empty string
  fi
}
```

**Bug 1**: The decimal handling creates malformed values (e.g., "1.5M" → "15M" instead of proper handling)

**Bug 2**: When `size` is empty or "0" (without unit), `${size%B}` returns empty string, not "0"

**Bug 3**: The division check at line 151 fails when `base_bytes` is empty:
```bash
if [ "$base_bytes" -eq 0 ]; then  # Empty string fails -eq comparison
```

## Error Stack Traces
```
line 50: [: : integer expression expected
line 59: division by 0 (error token is "base_bytes ")
```

- Line 50 maps to: `if [ "$base_bytes" -eq 0 ]; then`
- Line 59 maps to: `local change=$(( (current_bytes - base_bytes) * 100 / base_bytes ))`

## Related Code
- **Affected Files**:
  - `.github/workflows/bundle-size-alert.yml` (lines 117-162)
- **Recent Changes**:
  - `dc482af30` fix(ci): make bundle size check non-blocking for promotion PRs
  - `0166c636b` fix(ci): correct RunsOn runner syntax
- **Suspected Functions**: `convert_to_bytes()`, `calculate_change()`

## Related Issues & Context

### Similar Symptoms
- #588 (CLOSED): "CI/CD: Dependabot PR failures" - Related CI workflow issues

### Historical Context
This workflow was added as part of the CI/CD improvements. The bash arithmetic handling has edge cases that weren't fully tested.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `convert_to_bytes()` function returns an empty string instead of "0" when input is empty or lacks a recognized unit suffix, causing downstream integer operations to fail.

**Detailed Explanation**:
When a bundle size file contains "0K" or is empty:
1. The function strips the "K" suffix: `${size%K}` → "0"
2. But if the input has no recognized suffix, it falls to `echo ${size%B}` which returns empty string for "0"
3. The empty string is assigned to `base_bytes`
4. `[ "$base_bytes" -eq 0 ]` fails because `[ "" -eq 0 ]` is invalid bash
5. The script continues to the arithmetic expression which then fails with division by zero

**Supporting Evidence**:
- Error message explicitly shows "integer expression expected" and "division by 0"
- The `base_bytes` variable contains empty string (shown as space in error: `"base_bytes "`)
- The workflow logic at lines 150-162 doesn't handle empty values

### How This Causes the Observed Behavior

1. Base branch build creates bundle size files (some may be "0K" or missing)
2. `convert_to_bytes "0K"` is called
3. Function returns "0" for "0K" but returns empty for "" or "0" (no suffix)
4. `calculate_change` receives empty `base_bytes`
5. Integer comparison `[ "" -eq 0 ]` fails with "integer expression expected"
6. Script continues (no `set -e` at that point) to arithmetic
7. `$(( (x - ) * 100 / ))` causes "division by 0" error
8. Workflow fails with exit code 1

### Confidence Level

**Confidence**: High

**Reasoning**: The error messages directly point to the arithmetic operations, and code analysis reveals the empty string handling bug. The function's else clause at line 139 (`echo ${size%B}`) returns empty string when input lacks any recognized suffix.

## Fix Approach (High-Level)

1. Add default value handling in `convert_to_bytes()`:
   ```bash
   else
     # Default to 0 for empty or unrecognized input
     echo "${size:-0}" | tr -d 'B' | grep -o '[0-9]*' || echo "0"
   fi
   ```

2. Add empty check in `calculate_change()` before arithmetic:
   ```bash
   local base_bytes=$(convert_to_bytes "$base")
   local current_bytes=$(convert_to_bytes "$current")

   # Handle empty values
   base_bytes=${base_bytes:-0}
   current_bytes=${current_bytes:-0}
   ```

3. Quote variables in integer comparisons to handle empty strings.

## Diagnosis Determination

Root cause is definitively identified: The `convert_to_bytes()` bash function returns empty string for edge cases, and the downstream code doesn't validate inputs before performing integer operations. This is a bash scripting bug that requires proper empty value handling.

## Additional Context

This is a non-essential alerting workflow. The failure doesn't block deployments or other critical CI paths. However, it does add noise to PR reviews and should be fixed for cleanliness.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, Read, code analysis*
