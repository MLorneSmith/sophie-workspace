# Research: Claude CLI Hanging in E2B Sandbox

**Date**: 2026-01-13
**Agent**: perplexity-expert
**Status**: Completed (using existing research and documentation - Perplexity API unavailable)

## Problem Summary

When running Claude Code CLI inside E2B sandboxes, the CLI starts successfully (shows "Using OAuth authentication (Max plan)" and "Running Claude Code with prompt:") but then produces no more output and hangs. This triggers startup timeouts and causes approximately 64% of sandbox sessions to fail without making progress.

## Key Findings

### 1. Root Cause: Claude Code CLI Hangs During Initialization

Based on existing project research and diagnostics:

**Observed Pattern**:
- "Using OAuth authentication (Max plan)" appears (echoed by wrapper script)
- "Running Claude Code with prompt: /alpha:implement XXXX" appears (echoed by wrapper script)
- **NO FURTHER OUTPUT** - Claude CLI hangs silently
- No error messages in stderr
- Session times out after 60+ seconds

**Failure Rate**: ~64% (108 failed sessions vs 60 successful sessions in analyzed logs)

### 2. Known Causes for CLI Hanging in E2B

#### A. API Connection/Rate Limiting Issues

When multiple sandboxes start Claude simultaneously:
- All sandboxes hit Anthropic API at roughly the same time
- Potential rate limiting or connection throttling
- OAuth token session limits (Max plan may have concurrent session restrictions)

**Evidence**: Staggering sandbox creation by 20-30 seconds reduces failure rate

#### B. OAuth Token Issues in Headless Environments

OAuth authentication in headless/sandbox environments can be problematic:
- Token refresh may require interactive browser flow
- Session limits on concurrent OAuth sessions
- Token expiry during long-running operations

**Recommendation from project docs**: Consider using API key (ANTHROPIC_API_KEY) instead of OAuth for sandboxes

#### C. Output Buffering (Node.js)

From research file context7-e2b-claude-stdout-streaming.md:

- Claude Code CLI is Node.js-based
- Node.js manages its own output buffering via libuv
- stdbuf is **ineffective** for Node.js programs (only works with C/libc programs)
- When stdout is not connected to a TTY, Node.js uses block buffering

**However**: This explains delayed output, not complete hanging. Complete hangs suggest initialization failure, not buffering.

#### D. PTY Allocation Issues

- The run-claude script uses unbuffer to force PTY allocation
- If unbuffer fails or is unavailable, output may be delayed indefinitely
- PTY allocation in containerized environments can be unreliable

### 3. E2B SDK Specific Considerations

From context7-e2b-sdk-sandbox-timeout.md research:

**Sandbox Timeouts**:
- Pro tier: Max 24 hours
- Hobby tier: Max 1 hour
- Use sandbox.setTimeout() to extend timeouts

**Command Execution**:

E2B command execution with streaming callbacks works via onStdout and onStderr callbacks.

**E2B PTY Alternative** (for truly real-time output):

The SDK provides sandbox.pty.create() which allocates a pseudo-terminal and provides onData callback for real-time streaming.

### 4. Implemented Mitigations (Already in Codebase)

From 1445-implementation-alpha-sandbox-hanging.md:

**a) Startup Timeout Detection**:
- STARTUP_TIMEOUT_MS = 60000 (60 seconds)
- Detects if Claude produces fewer than 5 lines or 100 bytes within timeout
- Kills process on hang detection

**b) Retry Configuration (Partially Implemented)**:
- STARTUP_RETRY_DELAYS_MS = [5000, 10000, 30000] (exponential backoff)
- MAX_STARTUP_RETRIES = 3
- **Issue**: Retry loop not fully implemented (detection works, retry does not)

**c) Sandbox Staggering**:
- SANDBOX_STAGGER_DELAY_MS = 30000 (increased from 20s)
- Prevents simultaneous API calls

### 5. Known Working Configuration

From successful session logs, Claude Code works when:
- OAuth token is fresh and valid
- Network connectivity to Anthropic API is stable
- No concurrent sessions competing for same OAuth token
- PTY is properly allocated via unbuffer

## Workarounds and Solutions

### Solution 1: Implement Full Startup Retry Loop (RECOMMENDED)

The startup detection exists but retry loop is incomplete. Fix needed in feature.ts:

The retry loop should:
1. Track attempt count
2. Reset the startup tracker on each attempt
3. Catch startup hang errors
4. Wait the configured backoff delay
5. Retry up to MAX_STARTUP_RETRIES times

### Solution 2: Use API Key Instead of OAuth

OAuth tokens may have session limits. API keys are more reliable for automated systems.
Pass ANTHROPIC_API_KEY to sandbox environment instead of OAuth token.

### Solution 3: Increase Sandbox Staggering

Currently 30 seconds between sandbox creation. Consider 45-60 seconds to avoid API rate limits.

### Solution 4: Use PTY Instead of Commands.run

For more reliable output streaming, use sandbox.pty.create() instead of sandbox.commands.run().
PTY forces terminal mode which provides line-buffered output.

### Solution 5: Add Health Check for Claude Startup Phase

Monitor for meaningful output (not just initial echo lines) within 2-3 minutes:
- Check for tool calls (Read, Write, Bash, etc.)
- Check for assistant messages
- Check for progress file creation

### Solution 6: Pre-warm Claude in Template

Add Claude Code CLI initialization to the E2B template build:
- Run claude --version during template build
- Pre-authenticate and cache tokens
- Reduces cold start time

## GitHub Issues and Discussions

**Note**: Perplexity API was unavailable (401 error) for fresh searches. The following are based on known E2B and Claude Code issues:

### E2B Known Issues

1. **Long-running CLI processes**: E2B commands.run() is designed for short commands. Long-running interactive tools may have issues with output buffering and timeout handling.

2. **PTY vs Commands**: The SDK provides both sandbox.commands.run() and sandbox.pty.create(). PTY is recommended for interactive processes.

3. **Network isolation**: E2B sandboxes can only make outbound HTTPS connections. Ensure Anthropic API is reachable.

### Claude Code Known Issues

1. **Headless/non-interactive mode**: The -p (pipe) mode is designed for non-interactive use but may still expect certain TTY behaviors.

2. **OAuth in automation**: OAuth tokens work in automated systems but may have session limits.

3. **Startup time**: Claude Code has initialization overhead when loading project context and slash commands.

## Diagnostic Commands

To troubleshoot hanging issues:

```bash
# Check if Claude is responsive
timeout 30 claude --version

# Test basic prompt (should complete quickly)
echo "Hello" | timeout 60 claude -p --dangerously-skip-permissions

# Check PTY allocation
which unbuffer
unbuffer bash -c 'echo test'

# Check network connectivity to Anthropic
curl -s https://api.anthropic.com/ -o /dev/null -w "%{http_code}"
```

## Key Takeaways

1. **64% failure rate** is primarily due to Claude CLI hanging during initialization
2. **Root cause is likely** OAuth token issues or API rate limiting when multiple sandboxes start simultaneously
3. **Detection works** (60-second timeout) but **retry loop not fully implemented**
4. **Staggering helps** - 30s delay between sandbox creation reduces concurrent API calls
5. **Consider API key** over OAuth for more reliable automated systems
6. **PTY provides more reliable output** than commands.run() for interactive tools

## Sources

Project documentation and research files:
- 1444-diagnosis-alpha-sandbox-hanging.md
- 1445-implementation-alpha-sandbox-hanging.md
- 1446-diagnosis-alpha-startup-retry-missing.md
- context7-e2b-claude-stdout-streaming.md
- context7-e2b-sdk-sandbox-timeout.md
- perplexity-e2b-sandbox-logs-not-updating.md
- e2b-sandbox.md (infrastructure docs)

## Related Searches (Suggested)

If Perplexity becomes available, search for:
- "Claude Code CLI headless mode hanging"
- "E2B sandbox interactive CLI tools best practices"
- "Anthropic API rate limits concurrent connections"
- "Claude Code OAuth token session limits"
- "Node.js CLI tools in containerized environments"

---
*Research compiled from existing project documentation*
*Perplexity API Status: Unavailable (401 Authorization Error)*
