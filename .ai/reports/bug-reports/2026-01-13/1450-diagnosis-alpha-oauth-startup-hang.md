# Bug Diagnosis: Alpha Sandbox OAuth Startup Timeout Too Aggressive

**ID**: ISSUE-1450
**Created**: 2026-01-13T22:10:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

Alpha sandboxes using OAuth authentication (Claude Max plan) are being killed prematurely by the startup timeout mechanism. The 60-second `STARTUP_TIMEOUT_MS` is too aggressive for OAuth initialization in containerized E2B environments. Evidence shows that sandboxes DO eventually start working (progress files show real tool activity), but the startup hang detection kills them before they produce enough output to be considered "started."

## Environment

- **Application Version**: dev branch (commit 016d3862a)
- **Environment**: development (E2B sandboxes)
- **Node Version**: 20.x (in sandbox)
- **Authentication**: OAuth (Claude Max plan)
- **Last Working**: Prior to startup timeout implementation

## Reproduction Steps

1. Run `tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --sandboxes 3`
2. Observe sandbox logs showing "Using OAuth authentication (Max plan)"
3. Wait 60 seconds - startup timeout triggers due to insufficient output
4. Retry attempts (3x with 5s, 10s, 30s delays) all fail with same pattern
5. "Recovery failed" message appears

## Expected Behavior

- Sandboxes should successfully start with OAuth authentication
- Startup detection should accommodate OAuth's longer initialization time
- Sandboxes should begin executing features without being prematurely killed

## Actual Behavior

- OAuth authentication starts but takes longer to produce output than API key
- After 60 seconds, startup timeout triggers (detecting "hung" state)
- Process is killed and retry loop begins
- Each retry encounters same timeout, exhausting all attempts
- Progress files show sandboxes WERE working (tool calls visible) before being killed

## Diagnostic Data

### Evidence That OAuth Works (Eventually)

Progress files from the session show **real tool activity**:
```json
{
  "sandbox_id": "ipdbrbgeuuozvuxrz5w6n",
  "feature": { "issue_number": 1367, "title": "Dashboard Page & Grid Layout" },
  "status": "running",
  "phase": "executing",
  "last_tool": "Bash",
  "recent_output": [
    "💻 Bash: cat > .initiative-progress.jso...",
    "📖 Read: load-user-workspace.ts",
    "📖 Read: page.tsx",
    "🔍 Grep: database.types.ts"
  ]
}
```

This proves OAuth authentication DOES succeed and sandboxes DO start working - they're just being killed before producing enough initial output.

### Startup Timeout Configuration
```typescript
// config/constants.ts
export const STARTUP_TIMEOUT_MS = 60 * 1000; // 60 seconds
export const MIN_STARTUP_OUTPUT_LINES = 5;
export const MIN_STARTUP_OUTPUT_BYTES = 100;
```

### Log File Pattern
```
Using OAuth authentication (Max plan)
Running Claude Code with prompt: /alpha:implement 1367

=== WAITING 5s BEFORE RETRY ===
=== RETRY ATTEMPT 2/3 ===
...
```

Logs show only initial banner (93-400 bytes) - OAuth initialization produces minimal output before the timeout kills it.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The 60-second startup timeout is too aggressive for OAuth authentication, which has a longer initialization phase in containerized environments compared to API key authentication.

**Detailed Explanation**:

1. **OAuth Initialization Delay**: OAuth authentication in E2B containers requires:
   - Token validation over network
   - Session establishment with Claude API
   - Additional handshakes not needed with API key
   - This can take 60-90+ seconds before producing meaningful output

2. **Startup Detection Logic**: The startup hang detection in `feature.ts:263-306` checks:
   - If `elapsedMs > STARTUP_TIMEOUT_MS` (60s)
   - AND `outputLineCount < 5` OR `outputByteCount < 100`
   - Then marks startup as "hung" and kills the process

3. **OAuth Produces Less Early Output**: Unlike API key auth which starts immediately, OAuth:
   - May have silent network operations during initialization
   - Produces the same "Using OAuth..." banner but then pauses
   - The pause triggers the hang detection before work begins

4. **Retry Loop Compounds the Problem**: Each retry:
   - Kills the process that was actually initializing
   - Waits only 5s/10s/30s before trying again
   - Never gives OAuth enough time to complete

### Supporting Evidence

1. Progress files show **real tool activity** (Read, Grep, Bash) - OAuth DOES work
2. Log files show minimal output (93-400 bytes) - OAuth produces less early output
3. The 60s timeout was designed for API key (fast start), not OAuth (slow start)
4. Retries don't help because each attempt restarts the OAuth initialization

### Confidence Level

**Confidence**: High

**Reasoning**:
- Progress files prove OAuth eventually works (tool calls visible)
- The pattern is consistent: minimal output → timeout → kill → retry → same result
- The 60s timeout aligns with when OAuth would still be initializing

## Fix Approach (High-Level)

### Option 1: Increase Startup Timeout for OAuth (Recommended)

Increase `STARTUP_TIMEOUT_MS` to accommodate OAuth initialization:

```typescript
// config/constants.ts
// Increase from 60s to 180s (3 minutes) for OAuth compatibility
export const STARTUP_TIMEOUT_MS = 180 * 1000;
```

**Pros**: Simple, non-invasive change
**Cons**: Delays detection of actual hung processes

### Option 2: Auth-Aware Startup Timeout

Detect auth method and use appropriate timeout:

```typescript
// In feature.ts startup detection
const startupTimeout = getAuthMethod() === 'oauth'
  ? 180 * 1000  // 3 minutes for OAuth
  : 60 * 1000;  // 60 seconds for API key
```

**Pros**: Optimal timeout for each auth method
**Cons**: More complex implementation

### Option 3: Disable Startup Hang Detection Initially

Make the first attempt more lenient:

```typescript
// Only enable startup hang detection on retries
const enableStartupHangDetection = attemptNumber > 1;
```

**Pros**: Gives first attempt full time to start
**Cons**: May delay detection of immediate failures

### Option 4: Use Heartbeat Instead of Output Count

Instead of counting output lines, wait for first heartbeat/progress file:

```typescript
// Wait for progress file creation instead of output bytes
const startupSuccessful = await waitForProgressFile(instance, 180000);
```

**Pros**: More reliable indicator of actual startup
**Cons**: Requires refactoring startup detection logic

## Recommended Fix

**Option 1** (increase timeout to 180s) is the simplest and most reliable fix. OAuth authentication in containers legitimately takes longer, and the retry mechanism will still catch actual failures after 3 minutes.

## Additional Context

- The user is using Claude Max plan (OAuth) intentionally
- API key authentication is not desired as an alternative
- The startup timeout was implemented to catch hung processes but is too aggressive for OAuth
- The existing retry mechanism is working correctly - it's the timeout that's wrong

## Affected Files

- `.ai/alpha/scripts/config/constants.ts:128` - `STARTUP_TIMEOUT_MS`
- `.ai/alpha/scripts/lib/feature.ts:263-306` - Startup hang detection
- `.ai/alpha/scripts/lib/startup-monitor.ts` - Startup monitoring utilities

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Bash, Progress file analysis*
