# Bug Diagnosis: Alpha Orchestrator Crashes with E2B Timeout During pnpm install

**ID**: ISSUE-1846
**Created**: 2026-01-27T15:15:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The Alpha Orchestrator crashes during sandbox initialization when `pnpm install` exceeds the 600,000ms (10-minute) timeout configured in the E2B SDK `sandbox.commands.run()` call. The crash occurs at `.ai/alpha/scripts/lib/sandbox.ts:476` despite Issue #1844 being implemented (which addressed a different bug - stream write after end, not command timeouts).

## Environment

- **Application Version**: dev branch (commit 023679427)
- **Environment**: development
- **Node Version**: (detected at runtime)
- **E2B SDK Version**: 2.10.4
- **Spec Being Implemented**: S1823 (user dashboard)
- **Last Working**: Unknown (first run of S1823)

## Reproduction Steps

1. Run the Alpha Orchestrator with Spec S1823:
   ```bash
   tsx .ai/alpha/scripts/spec-orchestrator.ts S1823
   ```
2. Wait for sandbox creation phase
3. Observe the orchestrator attempt to run `pnpm install` in the sandbox
4. After approximately 10 minutes and 26 seconds, the orchestrator crashes

## Expected Behavior

The orchestrator should successfully run `pnpm install` in the E2B sandbox and continue with feature implementation, even if the command takes longer than 10 minutes.

## Actual Behavior

The orchestrator crashes with a `TimeoutError: [deadline_exceeded]` error after the `pnpm install` command exceeds its 600,000ms timeout.

## Diagnostic Data

### Console Output
```
Orchestrator error: TimeoutError: [deadline_exceeded] context deadline exceeded: This error is likely due to exceeding 'timeoutMs' — the total time a long running request (like command execution or directory watch) can be active. It can be modified by passing 'timeoutMs' when making the request. Use '0' to disable the timeout.
    at handleRpcError (/home/msmith/projects/2025slideheroes/node_modules/.pnpm/e2b@2.10.4/node_modules/e2b/src/envd/rpc.ts:32:16)
    at CommandHandle.handleEvents (/home/msmith/projects/2025slideheroes/node_modules/.pnpm/e2b@2.10.4/node_modules/e2b/src/sandbox/commands/commandHandle.ts:237:29)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async CommandHandle.wait (/home/msmith/projects/2025slideheroes/node_modules/.pnpm/e2b@2.10.4/node_modules/e2b/src/sandbox/commands/commandHandle.ts:150:5)
    at async createSandbox (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/sandbox.ts:476:3)
    at async orchestrate (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/lib/orchestrator.ts:694:24)
    at async main (/home/msmith/projects/2025slideheroes/.ai/alpha/scripts/spec-orchestrator.ts:149:2)
```

### UI Dashboard State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  ALPHA ORCHESTRATOR - Spec #S1823                                  ⏳ PENDING  ║
║  user dashboard                                    🟢 Stream (3)  Elapsed: 10m 26s  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Sandboxes: sbx-a, sbx-b, sbx-c - all showing "Waiting for work..."
Progress: 0% (0/5 Initiatives, 0/17 Features, 0/117 Tasks)
```

### E2B SDK Analysis
The E2B SDK (v2.10.4) wraps the RPC timeout error with the message:
```javascript
// From node_modules/.pnpm/e2b@2.10.4/node_modules/e2b/dist/index.js:581
`${err.message}: This error is likely due to exceeding 'timeoutMs' — the total time a long running request...`
```

## Error Stack Traces
```
TimeoutError: [deadline_exceeded] context deadline exceeded
  at handleRpcError (node_modules/.pnpm/e2b@2.10.4/node_modules/e2b/src/envd/rpc.ts:32:16)
  at CommandHandle.handleEvents (node_modules/.pnpm/e2b@2.10.4/node_modules/e2b/src/sandbox/commands/commandHandle.ts:237:29)
  at CommandHandle.wait (node_modules/.pnpm/e2b@2.10.4/node_modules/e2b/src/sandbox/commands/commandHandle.ts:150:5)
  at createSandbox (.ai/alpha/scripts/lib/sandbox.ts:476:3)
  at orchestrate (.ai/alpha/scripts/lib/orchestrator.ts:694:24)
  at main (.ai/alpha/scripts/spec-orchestrator.ts:149:2)
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/lib/sandbox.ts:476` - The `pnpm install` command with 600,000ms timeout
  - `.ai/alpha/scripts/lib/orchestrator.ts:694` - Call to `createSandbox()`
  - `.ai/alpha/scripts/spec-orchestrator.ts:149` - Entry point calling `orchestrate()`
- **Recent Changes**: None relevant to timeout handling
- **Suspected Functions**:
  - `createSandbox()` in `sandbox.ts`
  - `sandbox.commands.run()` E2B SDK method

## Related Issues & Context

### Direct Predecessors
- #1844 (CLOSED): "Bug Fix: Alpha Orchestrator Stream Crash & Workflow Cancellation" - Fixed `ERR_STREAM_WRITE_AFTER_END` and GitHub Actions concurrency, **NOT** command timeout issues

### Related Infrastructure Issues
- #1699, #1701: PTY timeout issues (different mechanism)
- #1767, #1786: PTY recovery monitoring (different mechanism)

### Historical Context
This appears to be a new issue with S1823 spec which has 117 tasks across 17 features. The larger project size may require longer `pnpm install` times due to dependency resolution.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `pnpm install` command in E2B sandbox takes longer than the hardcoded 600,000ms (10-minute) timeout, causing the E2B SDK to throw a `TimeoutError`.

**Detailed Explanation**:

The `createSandbox()` function in `.ai/alpha/scripts/lib/sandbox.ts` runs `pnpm install` with a fixed 10-minute timeout:

```typescript
// Line 476-478
await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
  timeoutMs: 600000,  // 10 minutes - INSUFFICIENT
});
```

The E2B SDK's `sandbox.commands.run()` method uses this timeout for the entire command execution. When the command exceeds this timeout, the SDK throws:
```
TimeoutError: [deadline_exceeded] context deadline exceeded
```

**Why pnpm install is slow (Root Cause: Stale E2B Template)**:

Investigation revealed that the lockfile diff between `alpha/spec-S1823` and `origin/dev` is **minimal** (only 28 lines):
```
pnpm-lock.yaml | 28 ++++++++++++++++++++++++++++
1 file changed, 28 insertions(+)
```

With only 28 lines changed, `pnpm install` should complete in seconds, not 10+ minutes. The excessive duration indicates the **E2B template `slideheroes-claude-agent-dev` is stale**:

1. **Template's node_modules is outdated** - Built from an old lockfile that doesn't match current `dev`
2. **pnpm must reconcile mismatches** - Even though lockfile diff is small, pnpm verifies all packages and rebuilds mismatched ones
3. **No persistent pnpm store** - Fresh sandbox has empty global cache, all packages download from registry
4. **Native module rebuilds** - Version mismatches trigger recompilation of native dependencies
5. **Network latency** - E2B cloud environment downloads all packages fresh

**Supporting Evidence**:
- Stack trace shows the error at `sandbox.ts:476` (the `pnpm install` line)
- Orchestrator ran for 10m 26s before crashing (just over the 10-minute timeout)
- Progress was 0% - crash occurred during sandbox initialization, not feature implementation

### How This Causes the Observed Behavior

1. Orchestrator starts and creates E2B sandboxes
2. First sandbox checks if `node_modules` exists or if lockfile changed
3. Since the branch likely has lockfile changes (new spec), it runs `pnpm install`
4. `pnpm install` takes >10 minutes due to fresh sandbox + many dependencies
5. E2B SDK's gRPC deadline expires at 600,000ms
6. `TimeoutError` is thrown and bubbles up through the call stack
7. Orchestrator crashes and exits

### Confidence Level

**Confidence**: High

**Reasoning**:
- The stack trace directly points to line 476 (`pnpm install` with timeout)
- The elapsed time (10m 26s) matches the timeout (10 minutes)
- The error message explicitly mentions `timeoutMs` as the cause
- E2B SDK source code confirms this behavior

## Fix Approach (High-Level)

### Immediate Fix: Increase Timeout (Short-term)

**Option A (Recommended for immediate fix)**: Increase the timeout for `pnpm install` from 600,000ms to 1,200,000ms (20 minutes):
```typescript
await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
  timeoutMs: 1200000,  // 20 minutes
});
```

**Option B**: Use `timeoutMs: 0` to disable timeout entirely:
```typescript
await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
  timeoutMs: 0,  // No timeout
});
```

**Affected locations** (all need updating):
- `sandbox.ts:469` - frozen-lockfile install (node_modules missing)
- `sandbox.ts:477` - regular install (lockfile changed)
- `sandbox.ts:917` - review sandbox install

### Root Fix: Rebuild E2B Template (Long-term)

**Option C (Recommended for permanent fix)**: Rebuild the E2B template `slideheroes-claude-agent-dev` with current `dev` dependencies:

1. Update the template build to use current `pnpm-lock.yaml`
2. Pre-populate `node_modules` with all dependencies
3. Pre-warm pnpm global store
4. Schedule regular template rebuilds (weekly) to prevent staleness

This would reduce `pnpm install` time from 10+ minutes to <30 seconds.

### Optional Enhancement: Add Streaming Output

**Option D**: Add streaming output to diagnose slow installs:
```typescript
const proc = await sandbox.commands.start(`cd ${WORKSPACE_DIR} && pnpm install`, {
  onStdout: (data) => log(`   [pnpm] ${data.line}`),
  onStderr: (data) => log(`   [pnpm] ${data.line}`),
});
await proc.wait(1200000);  // 20 min with visibility
```

This helps diagnose whether pnpm is:
- Downloading packages (network issue)
- Running postinstall scripts (rebuild issue)
- Stuck on something specific

## Diagnosis Determination

**Two interrelated root causes identified:**

1. **Immediate cause**: The 10-minute timeout for `pnpm install` is insufficient
2. **Underlying cause**: The E2B template `slideheroes-claude-agent-dev` has stale `node_modules` that doesn't match current `dev` dependencies

**Evidence supporting stale template theory:**
- Lockfile diff is minimal (28 lines)
- Yet `pnpm install` takes 10+ minutes
- This indicates pnpm is doing significant reconciliation work beyond the 28 changed lines

**Recommended fix approach:**
1. **Immediate**: Increase timeout to 20 minutes in `sandbox.ts` (lines 469, 477-478, 917)
2. **Long-term**: Rebuild E2B template with current dependencies and schedule regular rebuilds

## Additional Context

**Why Issue #1844 didn't fix this**:
Issue #1844 addressed two unrelated bugs:
1. `ERR_STREAM_WRITE_AFTER_END` - A race condition in PTY log stream handling
2. GitHub Actions concurrency cancellation - Workflow configuration issue

Neither of these relates to the E2B command execution timeout. The current bug is a separate issue requiring a different fix.

**Recommended timeout values based on research**:
- `pnpm install`: 20-30 minutes (fresh install can be slow)
- `pnpm build`: 5-10 minutes
- `git` operations: 2-5 minutes

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Bash, Task (perplexity-expert)*
