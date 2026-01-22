# Bug Diagnosis: build-wrapper.sh Syntax Error in Arithmetic Expression

**ID**: ISSUE-pending
**Created**: 2026-01-22T17:35:00Z
**Reporter**: user/CI
**Severity**: low
**Status**: new
**Type**: bug

## Summary

The `build-wrapper.sh` script crashes with a bash arithmetic syntax error when parsing build output because `grep -c` returns "0" but exits with code 1 when no matches are found, causing the `|| echo "0"` fallback to append a second "0", resulting in "0\n0" which cannot be parsed as a number in bash arithmetic expressions.

## Environment

- **Application Version**: dev branch (bc5a9681e)
- **Environment**: CI (GitHub Actions)
- **Shell**: bash
- **Affected Script**: `.claude/statusline/build-wrapper.sh`
- **Last Working**: Unknown - bug existed since script creation

## Reproduction Steps

1. Trigger a build that fails (e.g., missing PAYLOAD_SECRET)
2. The build-wrapper.sh script attempts to parse error counts from build output
3. When `grep -cE "^ERROR in"` finds no matches, it outputs "0" but exits with code 1
4. The `|| echo "0"` fallback triggers, appending another "0"
5. The variable contains "0\n0" (two zeros separated by newline)
6. Bash arithmetic `$((error_count + ${webpack_errors:-0}))` fails to parse "0\n0"
7. Syntax error: `error_count + 0\n0: syntax error in expression`

## Expected Behavior

When grep finds no matches, the variable should be set to "0" (a single digit).

## Actual Behavior

The variable is set to "0\n0" (two zeros with newline), causing bash arithmetic to fail.

## Diagnostic Data

### Console Output
```
./.claude/statusline/build-wrapper.sh: line 53: error_count + 0
0: syntax error in expression (error token is "0")
```

### Proof of Root Cause
```bash
$ echo "some text" > /tmp/test.txt
$ result=$(grep -cE "^ERROR in" /tmp/test.txt 2>/dev/null || echo "0")
$ echo "Result: '$result'"
Result: '0
0'
$ echo -n "$result" | xxd
00000000: 300a 30                                  0.0
```

The hex dump shows: `30` (ASCII "0"), `0a` (newline), `30` (ASCII "0") = "0\n0"

## Error Stack Traces
```
./.claude/statusline/build-wrapper.sh: line 53: error_count + 0
0: syntax error in expression (error token is "0")
```

## Related Code

- **Affected Files**:
  - `.claude/statusline/build-wrapper.sh` (lines 45, 52, 59, 75)
- **Recent Changes**: None - bug existed since script creation
- **Suspected Functions**: `parse_build_errors()` function

### Buggy Pattern (4 occurrences)

```bash
# Line 45:
esbuild_errors=$(grep -oE "^([0-9]+) errors?" "$output_file" | grep -oE "[0-9]+" | head -1 || echo "0")

# Line 52:
webpack_errors=$(grep -cE "^ERROR in" "$output_file" 2>/dev/null || echo "0")

# Line 59:
vite_errors=$(grep -cE "error:" "$output_file" 2>/dev/null || echo "0")

# Line 75:
error_count=$(grep -ciE "^[^w]*error[^s]" "$output_file" 2>/dev/null || echo "0")
```

## Related Issues & Context

### Similar Infrastructure Issues
- #1547 (CLOSED): "Shell Scripts Lack Execute Permissions in Git" - Same script family
- #611 (CLOSED): "Claude Code Statusline Not Appearing" - Related statusline tooling

### Historical Context
The statusline scripts were created to provide build status feedback. The `|| echo "0"` pattern was intended as a fallback for when grep fails, but the author didn't account for `grep -c` behavior where it outputs "0" even when returning exit code 1.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `|| echo "0"` fallback after `grep -c` commands causes "0\n0" output because `grep -c` outputs "0" AND exits with code 1 when no matches are found.

**Detailed Explanation**:
The `grep -c` command has special behavior:
1. It ALWAYS outputs a count to stdout (even "0" when no matches)
2. It exits with code 0 when matches are found
3. It exits with code 1 when NO matches are found (but still outputs "0")

The script pattern `$(grep -c ... || echo "0")` was intended to provide "0" as a fallback, but:
1. `grep -c` outputs "0" to stdout
2. `grep -c` exits with code 1 (no matches)
3. The `||` operator sees exit code 1 and runs `echo "0"`
4. The subshell captures both outputs: "0" (from grep) + "0" (from echo)
5. Result: "0\n0"

When this is used in arithmetic `$((error_count + ${webpack_errors:-0}))`, bash sees:
```
$((error_count + 0
0))
```
This is invalid syntax because bash cannot parse "0\n0" as a number.

**Supporting Evidence**:
- Error message: `line 53: error_count + 0\n0: syntax error in expression`
- Hex dump proves "0\n0": `300a30` = "0", newline, "0"
- Code reference: `.claude/statusline/build-wrapper.sh:52`

### How This Causes the Observed Behavior

1. Build fails (e.g., due to missing PAYLOAD_SECRET)
2. build-wrapper.sh runs to parse error counts
3. `grep -cE "^ERROR in"` finds no "ERROR in" lines in output
4. grep outputs "0", exits with code 1
5. `|| echo "0"` runs, appending second "0"
6. `webpack_errors` = "0\n0"
7. Arithmetic expression `$((error_count + ${webpack_errors:-0}))` fails
8. Script crashes with syntax error
9. Exit code is non-zero, adding to CI confusion

### Confidence Level

**Confidence**: High

**Reasoning**:
1. Error message explicitly shows the problematic value ("error_count + 0\n0")
2. Reproduced the exact behavior with test commands
3. Hex dump proves the variable contains two zeros with newline
4. `grep -c` behavior is documented (exit 1 when no matches, but still outputs count)

## Fix Approach (High-Level)

Replace the `|| echo "0"` pattern with proper exit code handling. Two options:

**Option 1**: Separate the output capture from exit code handling
```bash
webpack_errors=$(grep -cE "^ERROR in" "$output_file" 2>/dev/null) || true
webpack_errors=${webpack_errors:-0}
```

**Option 2**: Use || with variable assignment instead of echo
```bash
webpack_errors=$(grep -cE "^ERROR in" "$output_file" 2>/dev/null) || webpack_errors=0
```

Apply this fix to all 4 occurrences: lines 45, 52, 59, and 75.

## Diagnosis Determination

The root cause is definitively identified: incorrect use of `|| echo "0"` fallback with `grep -c`, which outputs a count even when returning non-zero exit code. This is a subtle bash scripting bug that occurs because the author assumed grep would not produce output on failure.

## Additional Context

This bug is a secondary issue - it only manifests when there's already a build failure (like missing PAYLOAD_SECRET). The primary failures (missing env vars) should be fixed first, but this bug adds confusion by making the error output harder to parse.

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (grep testing, hex dump), Read (script files), gh CLI (issue search)*
