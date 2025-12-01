# Bug Diagnosis: /test 7 fails due to unhandled pkill rejection in setupPayloadServer

**ID**: ISSUE-804
**Created**: 2025-12-01T15:35:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The `/test 7` command fails because `setupPayloadServer()` in infrastructure-manager.cjs contains an unhandled promise rejection. The `pkill` command at line 747 is not wrapped in a try-catch block, causing the function to fail even though the `pkill` command includes `|| true` to suppress shell errors.

## Environment

- **Application Version**: Current dev branch
- **Environment**: development (WSL2)
- **Node Version**: v20+
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown - may never have worked in Claude Code sandbox environment

## Reproduction Steps

1. Run `/test 7` command
2. Observe that shard 7 (Payload CMS tests) fails to start
3. Check output showing: `ERROR: Failed to setup Payload server: Command failed: pkill -f "payload.*dev" 2>/dev/null || true`

## Expected Behavior

- The `pkill` command should silently fail when no matching processes exist
- The Payload CMS server should start on port 3021
- Shard 7 tests should execute

## Actual Behavior

- The `pkill` command triggers a promise rejection (exit code 144)
- `setupPayloadServer()` catches the error and returns "failed"
- Shard 7 tests are skipped with "Payload CMS server failed to start"
- All 31 Payload tests are marked as failed

## Diagnostic Data

### Console Output

```
[2025-12-01T15:18:29.345Z] INFO: 🚀 Starting Payload CMS server on port 3021...
[2025-12-01T15:18:29.456Z] ERROR: Failed to setup Payload server: Command failed: pkill -f "payload.*dev" 2>/dev/null || true
[2025-12-01T15:18:29.456Z] INFO: ❌ Failed to start Payload CMS server
[2025-12-01T15:18:29.456Z] INFO: 💡 Suggestion: Start Payload manually with: pnpm --filter payload dev:test
```

### Network Analysis

N/A - failure occurs during process management, not network operations

### Database Analysis

N/A - database is healthy, failure occurs before database operations

### Performance Metrics

N/A

## Error Stack Traces

```
ERROR: Failed to setup Payload server: Command failed: pkill -f "payload.*dev" 2>/dev/null || true
Exit code: 144 (128 + 16 = SIGSTKFLT signal)
```

## Related Code

- **Affected Files**:
  - `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs:747`
- **Recent Changes**: Unknown
- **Suspected Functions**: `setupPayloadServer()` at line 719-799

## Related Issues & Context

### Direct Predecessors

None found - this appears to be a new issue.

### Related Infrastructure Issues

- This only affects shard 7 and shard 8 (Payload CMS tests)
- Shards 1-6 work correctly because they don't require Payload server setup

### Similar Symptoms

None found with similar `pkill` failure pattern.

### Same Component

Tests in `apps/e2e/tests/payload/` directory:
- payload-auth.spec.ts
- payload-collections.spec.ts
- payload-database.spec.ts

### Historical Context

The Payload CMS tests were recently added with a new infrastructure setup process. The `pkill` command was added to clean up stale processes but wasn't properly wrapped in error handling.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `await execAsync('pkill -f "payload.*dev" 2>/dev/null || true')` at line 747 is not wrapped in a try-catch block, causing promise rejection even when the shell command includes `|| true`.

**Detailed Explanation**:
The issue is a fundamental misunderstanding of how Node.js `child_process.exec` handles shell commands with signal-based exit codes:

1. **Shell-level `|| true`** only suppresses the shell's interpretation of the exit code
2. **Node.js `execAsync`** (which is `util.promisify(exec)`) rejects the promise when:
   - The exit code is non-zero, OR
   - The process receives a signal (exit code 128 + signal number)

3. When `pkill` runs in the Claude Code environment, it returns exit code 144 (128 + 16), indicating the process received signal 16 (SIGSTKFLT or similar)

4. The `|| true` in the shell command cannot prevent Node.js from rejecting the promise when a signal is involved

5. The code at line 747 is NOT wrapped in a try-catch:
   ```javascript
   // Line 747 - NOT in try-catch
   await execAsync('pkill -f "payload.*dev" 2>/dev/null || true');
   ```

6. When this line rejects, it's caught by the outer try-catch at line 722, which logs the error and returns "failed"

**Supporting Evidence**:
- Error message matches exactly: `Command failed: pkill -f "payload.*dev" 2>/dev/null || true`
- Exit code 144 = 128 + 16 (signal-based exit)
- Similar `pkill` patterns at lines 733-744 ARE properly wrapped in try-catch and work correctly

### How This Causes the Observed Behavior

1. `/test 7` starts and reaches infrastructure check phase
2. Infrastructure manager detects Payload CMS is required for shard 7
3. `setupPayloadServer()` is called
4. Line 747 executes `pkill` to clean up existing Payload processes
5. `pkill` fails with signal-based exit code 144
6. Node.js rejects the promise
7. Outer try-catch catches error and returns "failed"
8. Test controller receives "failed" status
9. Tests are skipped with "Payload CMS server failed to start"
10. All 31 tests are marked as failed

### Confidence Level

**Confidence**: High

**Reasoning**:
1. The error message explicitly states the failing command
2. Direct testing confirms `pkill` fails with exit code 144 in this environment
3. Code inspection shows the line is not wrapped in try-catch
4. Similar patterns in the same file (lines 733-744) use try-catch and work correctly

## Fix Approach (High-Level)

Wrap the `pkill` command at line 747 in a try-catch block to silently ignore failures:

```javascript
// Current (broken):
await execAsync('pkill -f "payload.*dev" 2>/dev/null || true');

// Fixed:
try {
  await execAsync('pkill -f "payload.*dev" 2>/dev/null || true');
} catch {
  // Ignore errors - process might not exist
}
```

This matches the pattern already used at lines 733-744 for port clearing.

## Diagnosis Determination

The root cause has been definitively identified: **Missing try-catch wrapper around pkill command at line 747 of infrastructure-manager.cjs**.

The fix is straightforward and low-risk: add a try-catch wrapper around the problematic line, following the same pattern used elsewhere in the same file.

## Additional Context

- Shards 1-6 work because they don't require Payload CMS
- Shards 7-8 both fail because they share the same `setupPayloadServer()` code path
- The `pkill` command is used for cleanup purposes only; its failure should not prevent server startup
- This may be environment-specific to Claude Code sandbox (signal handling)

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash, Read, Glob, Grep*
