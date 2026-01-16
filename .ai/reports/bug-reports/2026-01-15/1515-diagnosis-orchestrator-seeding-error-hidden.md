# Bug Diagnosis: Alpha Orchestrator Seeding Fails with Hidden Error Message

**ID**: ISSUE-1515
**Created**: 2026-01-15T22:50:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

When running the Alpha Spec Orchestrator (`tsx .ai/alpha/scripts/spec-orchestrator.ts`), database seeding fails with a generic error message `CommandExitError: exit status 1` that hides the actual underlying error. The error handling in `seedSandboxDatabase()` does not properly extract the `stderr` property from E2B's `CommandExitError`, making it impossible to diagnose the actual Payload migration failure.

## Environment

- **Application Version**: Alpha Implementation System v1.0
- **Environment**: development (E2B sandbox)
- **Node Version**: 20.x
- **E2B SDK Version**: @e2b/code-interpreter ^2.3.1, e2b 2.8.2
- **Last Working**: Unknown (may never have worked with proper error reporting)

## Reproduction Steps

1. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --force-unlock`
2. Observe sandbox creation succeeds
3. Observe "🌱 Seeding sandbox database..." message
4. Observe "📦 Running Payload migrations..." message
5. Observe error: `❌ Seeding failed: CommandExitError: exit status 1`
6. Note that the actual Payload migration error is not displayed

## Expected Behavior

The error message should include the actual stderr output from the Payload migration command, allowing developers to diagnose and fix the underlying issue.

## Actual Behavior

The error message only shows `CommandExitError: exit status 1` without the stderr content that would explain why the Payload migration failed.

## Diagnostic Data

### Console Output
```
📦 Creating sandbox sbx-a...
ID: i1qw1tasv1e6k8craijtp
Checking out existing branch: alpha/spec-1362
   Setting up Supabase CLI...
   ⚠️ Supabase CLI not found in project dependencies, DB features may fail
🌱 Seeding sandbox database...
   📦 Running Payload migrations...
❌ Seeding failed: CommandExitError: exit status 1
❌ Database seeding failed, aborting orchestration
```

### E2B SDK CommandExitError Type Definition
```typescript
declare class CommandExitError extends SandboxError implements CommandResult {
    get exitCode(): number;
    get error(): string | undefined;
    get stdout(): string;
    get stderr(): string;  // <-- This property exists but is not being logged
}
```

### Current Error Handling (database.ts:264-267)
```typescript
} catch (err) {
    error(`❌ Seeding failed: ${err}`);  // Only logs toString(), not stderr
    return false;
}
```

### Local Migration Test (Works Successfully)
```
Testing Payload migrate command...
> payload@3.70.0 payload /home/msmith/projects/2025slideheroes/apps/payload
> cross-env PAYLOAD_CONFIG_PATH=src/payload.config.ts payload migrate --forceAcceptWarning

[17:45:19] INFO: Reading migration files from /home/msmith/projects/2025slideheroes/apps/payload/src/migrations
[17:45:19] INFO: Migrating: 20251208_141121
[17:45:20] INFO: Migrated:  20251208_141121 (581ms)
[17:45:20] INFO: Migrating: 20251210_195519
[17:45:20] INFO: Migrated:  20251210_195519 (122ms)
[17:45:20] INFO: Done.
```

## Error Stack Traces
```
❌ Seeding failed: CommandExitError: exit status 1
❌ Database seeding failed, aborting orchestration
```

Note: No stack trace is shown because the error is caught and converted to string.

## Related Code

**Affected Files**:
- `.ai/alpha/scripts/lib/database.ts:199-267` (seedSandboxDatabase function)

**Recent Changes**: N/A

**Suspected Functions**:
- `seedSandboxDatabase()` - catch block at line 264-267 doesn't extract stderr from CommandExitError

## Related Issues & Context

### Similar Symptoms
- This may be related to any E2B command execution that fails - similar error hiding pattern exists throughout the codebase

## Root Cause Analysis

### Identified Root Cause

**Summary**: The catch block in `seedSandboxDatabase()` converts the `CommandExitError` to a string using template literal interpolation (`${err}`), which only shows the error type and exit code, not the stderr property that contains the actual error message.

**Detailed Explanation**:
When E2B SDK's `sandbox.commands.run()` executes a command that returns a non-zero exit code, it throws a `CommandExitError` that implements the `CommandResult` interface. This error object has a `stderr` property containing the actual error output from the command. However, the current catch block in database.ts does:

```typescript
} catch (err) {
    error(`❌ Seeding failed: ${err}`);  // This calls err.toString()
    return false;
}
```

The `toString()` method on `CommandExitError` returns `"CommandExitError: exit status 1"` but does not include the stderr content. To access stderr, the code must explicitly access `err.stderr`.

**Supporting Evidence**:
- E2B SDK type definitions confirm `CommandExitError` has `stderr` getter (node_modules/.pnpm/e2b@2.8.2/node_modules/e2b/dist/index.d.ts)
- Local Payload migration runs successfully, proving the command itself works
- Error message shows exactly `CommandExitError: exit status 1` with no additional context

### How This Causes the Observed Behavior

1. User runs orchestrator
2. Sandbox is created successfully
3. `seedSandboxDatabase()` runs Payload migration command in sandbox
4. Something fails in the sandbox (likely environment variable, network, or permission issue)
5. E2B SDK throws `CommandExitError` with full stderr content
6. Catch block converts error to string, losing the stderr
7. User sees generic "exit status 1" message with no useful debugging information
8. Orchestration aborts with no way to diagnose the actual problem

### Confidence Level

**Confidence**: High

**Reasoning**:
1. E2B SDK source code confirms `CommandExitError` has `stderr` property
2. The error message format `CommandExitError: exit status 1` matches the error's `toString()` output
3. Local testing confirms Payload migration command works with correct environment
4. The catch block code clearly shows only `${err}` being logged

## Fix Approach (High-Level)

Update the error handling in `seedSandboxDatabase()` to properly extract and log the stderr from `CommandExitError`:

```typescript
} catch (err) {
    // Extract stderr from E2B CommandExitError for better debugging
    if (err && typeof err === 'object' && 'stderr' in err) {
        const cmdErr = err as { stderr: string; stdout: string; exitCode: number };
        error(`❌ Seeding failed (exit code ${cmdErr.exitCode}):`);
        if (cmdErr.stderr) error(`   stderr: ${cmdErr.stderr}`);
        if (cmdErr.stdout) error(`   stdout: ${cmdErr.stdout}`);
    } else {
        error(`❌ Seeding failed: ${err}`);
    }
    return false;
}
```

This pattern should also be applied to other places in the codebase that catch E2B command errors.

## Diagnosis Determination

**Root Cause Confirmed**: The error handling in `seedSandboxDatabase()` at `.ai/alpha/scripts/lib/database.ts:264-267` does not extract the `stderr` property from E2B's `CommandExitError`, causing the actual Payload migration error to be hidden.

**Underlying Issue Unknown**: While we've identified why the error is hidden, the actual reason for the Payload migration failure in the sandbox is still unknown. Once the error handling is fixed, the actual migration error will be visible and can be addressed.

## Additional Context

The same pattern may exist in other files that catch errors from E2B `sandbox.commands.run()` calls. A codebase-wide review should be done to ensure all E2B command errors properly extract stderr.

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash, Grep, Glob*
