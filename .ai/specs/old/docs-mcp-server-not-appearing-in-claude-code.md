# Bug Diagnosis: docs-mcp Server Not Appearing in Claude Code Despite Correct Configuration

**ID**: ISSUE-603
**Created**: 2025-11-15T16:02:06Z
**Reporter**: user/msmith
**Severity**: high
**Status**: new
**Type**: integration

## Summary

Despite issue #602 being closed with a fix that correctly configured the docs-mcp server in `.mcp.json` using the proper SSE format, the docs-mcp server is still not appearing in Claude Code when running the `/mcp` command. The configuration is correct, the Docker container is healthy, the SSE endpoint is responding, and manual testing with `npx mcp-remote` successfully establishes a connection. However, Claude Code continues to report "No MCP servers configured."

## Environment

- **Application Version**: Claude Code (version unknown)
- **Environment**: development
- **Browser**: N/A (CLI tool)
- **Node Version**: v22.16.0
- **Database**: PostgreSQL (via Supabase)
- **Docker Version**: 28.5.2
- **Last Working**: Unknown (never confirmed working after fix)
- **Platform**: Linux (WSL2 - 6.6.87.2-microsoft-standard-WSL2)

## Reproduction Steps

1. Verify issue #602 was closed (2025-11-15 at 15:46:19Z)
2. Verify `.mcp.json` contains correct configuration:

   ```json
   {
     "mcpServers": {
       "docs-mcp": {
         "command": "npx",
         "args": ["mcp-remote", "http://localhost:6280/sse"]
       }
     }
   }
   ```

3. Verify docs-mcp Docker container is running and healthy: `docker ps | grep docs-mcp`
4. Verify SSE endpoint responds: `curl -N http://localhost:6280/sse`
5. Launch Claude Code in the project directory
6. Run `/mcp` command
7. Observe: "No MCP servers configured"

## Expected Behavior

- Claude Code should detect the docs-mcp server from `.mcp.json`
- `/mcp` command should list "docs-mcp" as a configured server
- docs-mcp tools (e.g., `mcp__docs-mcp__search_docs`, `mcp__docs-mcp__scrape_docs`) should be available

## Actual Behavior

- `/mcp` command reports: "No MCP servers configured. Please run /doctor if this is unexpected."
- No MCP tools are available in Claude Code
- The docs-mcp server is not detected despite correct configuration

## Diagnostic Data

### Configuration Verification

**`.mcp.json` content:**

```json
{
  "mcpServers": {
    "docs-mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:6280/sse"
      ]
    }
  }
}
```

**JSON validation:**

```bash
$ jq empty .mcp.json && echo "✓ Valid JSON"
✓ Valid JSON
```

**Configuration verification:**

```bash
$ jq '.mcpServers | keys' .mcp.json
["docs-mcp"]
```

**Git status:**

```bash
$ git ls-files .mcp.json
# No output (file not tracked)

$ grep -n "^\.mcp\.json$" .gitignore
60:.mcp.json
```

**Finding**: `.mcp.json` is gitignored (line 60 in `.gitignore`), so the fix from #602 only modified the local file and is not tracked in version control.

### Docker Container Status

```bash
$ docker ps | grep docs-mcp
fd07bcc52e9d   ghcr.io/arabold/docs-mcp-server:latest   "node dist/index.js …"    18 hours ago   Up 33 minutes (healthy)   0.0.0.0:6280->6280/tcp, [::]:6280->6280/tcp   docs-mcp-server
```

**Status**: ✅ Container is running and healthy

### SSE Endpoint Testing

```bash
$ timeout 3 curl -N http://localhost:6280/sse 2>&1 | head -3
event: endpoint
data: /messages?sessionId=e198765a-df83-4fdb-b94e-13ce531f4161
```

**Status**: ✅ SSE endpoint is responding correctly

### Manual mcp-remote Connection Test

```bash
$ timeout 5 npx -y mcp-remote http://localhost:6280/sse 2>&1 | head -20
[37023] Using automatically selected callback port: 21113
[37023] [37023] Connecting to remote server: http://localhost:6280/sse
[37023] Using transport strategy: http-first
[37023] Received error: Error POSTing to endpoint (HTTP 404): {"message":"Route POST:/sse not found","error":"Not Found","statusCode":404}
[37023] Recursively reconnecting for reason: falling-back-to-alternate-transport
[37023] [37023] Connecting to remote server: http://localhost:6280/sse
[37023] Using transport strategy: sse-only
[37023] Connected to remote server using SSEClientTransport
[37023] Local STDIO server running
[37023] Proxy established successfully between local STDIO and remote SSEClientTransport
[37023] Press Ctrl+C to exit
```

**Status**: ✅ `mcp-remote` successfully connects and establishes proxy

**Note**: The initial POST attempt fails (expected - docs-mcp only supports SSE), but `mcp-remote` successfully falls back to SSE-only transport and establishes the connection.

### Claude Code Configuration Check

```bash
$ ls -la ~/.config/claude-code/ 2>/dev/null || ls -la ~/.claude-code/ 2>/dev/null
No Claude Code directories found

$ ls -la ~/.cache/claude-code/ 2>/dev/null
No Claude Code directories found
```

**Finding**: No Claude Code configuration or cache directories found in standard locations (`~/.config/claude-code/`, `~/.claude-code/`, `~/.cache/claude-code/`)

### Working Directory Verification

```bash
$ pwd
/home/msmith/projects/2025slideheroes

$ ls -la .mcp.json*
.rw-r--r--  156 msmith 15 Nov 10:42 .mcp.json
.rw-r--r-- 1.4k msmith 15 Nov 10:42 .mcp.json.backup
```

**Status**: ✅ `.mcp.json` exists in project root with correct permissions

## Error Stack Traces

No error stack traces available. Claude Code silently fails to detect the MCP server without providing error messages or logs.

## Related Code

- **Affected Files**:
  - `.mcp.json` - MCP server configuration (gitignored)
  - `.mcp.example.json` - Example configuration reference
  - `.ai/ai_docs/tool-docs/mcp-configuration.md` - Documentation created in #602

- **Recent Changes**:
  - Commit `4b8045e85` (2025-11-15): "fix(tooling): fix MCP servers not appearing in Claude Code"
    - Created `.ai/ai_docs/tool-docs/mcp-configuration.md` (+298 lines)
    - Updated `.env.example` (+11 lines, -1 line)
    - **Note**: Commit did NOT include changes to `.mcp.json` (gitignored)

- **Suspected Components**:
  - Claude Code MCP server detection mechanism
  - Claude Code configuration file loading
  - Possible caching or stale state in Claude Code

## Related Issues & Context

### Direct Predecessors

- #602 ([CLOSED]): "Bug Fix: MCP Servers Not Appearing in Claude Code" - **Same problem, marked as fixed but issue persists**
- #601 ([CLOSED]): "Bug Diagnosis: MCP Servers Not Appearing in Claude Code" - Diagnosis that led to #602
- #599 ([CLOSED]): "Bug Fix: docs-mcp MCP Server Not Loading in Claude Code" - Previous fix for same issue (2025-11-14)
- #598 ([CLOSED]): "Bug Diagnosis: docs-mcp MCP Server Not Loading in Claude Code" - Diagnosis that led to #599

### Related Infrastructure Issues

- #439 ([CLOSED]): "docs-mcp Docker Container Unhealthy - Database Connection Failure" - Earlier docs-mcp infrastructure issue

### Historical Context

This is the **FOURTH occurrence** of docs-mcp integration issues with Claude Code:

1. **Issue #439** (closed) - Initial Docker container health issues
2. **Issues #598, #599** (closed 2025-11-14) - First configuration regression (using unsupported `"type": "http"` format)
3. **Issues #601, #602** (closed 2025-11-15) - Second configuration regression (same root cause as #598/#599)
4. **Current issue** - docs-mcp still not appearing despite correct configuration after #602 fix

**Pattern Analysis:**

- Issues #598, #599, #601, #602 all diagnosed the same root cause: using unsupported `"type": "http"` format
- Fix has been to convert to `npx mcp-remote` with SSE endpoint
- Current issue is different: configuration is already correct per the #602 fix, but server still not detected

## Initial Analysis

Based on diagnostic evidence, the following factors have been **ruled out** as the root cause:

1. ❌ **Incorrect `.mcp.json` format** - Configuration is correct per #602 fix
2. ❌ **Docker container not running** - Container is healthy and running
3. ❌ **SSE endpoint not responding** - Endpoint responds correctly to curl
4. ❌ **mcp-remote not working** - Manual test successfully establishes connection
5. ❌ **Invalid JSON syntax** - JSON validates successfully
6. ❌ **File permissions** - File is readable (644 permissions)
7. ❌ **Wrong working directory** - `.mcp.json` is in project root where Claude Code runs

**Remaining possibilities:**

1. ✅ **Claude Code cache/state issue** - Claude Code may be caching the old broken configuration
2. ✅ **Claude Code not restarted** - Changes to `.mcp.json` may require Claude Code restart
3. ✅ **Missing `-y` flag** - `.mcp.example.json` shows some `mcp-remote` uses with `-y` flag (though not consistently)
4. ✅ **Claude Code configuration loading mechanism** - Claude Code may not be reading `.mcp.json` from project root
5. ✅ **Environment-specific issue** - WSL2 environment may have path resolution or networking issues

## Suggested Investigation Areas

1. **Claude Code Restart Required**
   - Verify whether Claude Code needs to be restarted after `.mcp.json` changes
   - Check if there's a reload command or hot-reload capability
   - Test: Restart Claude Code and re-run `/mcp` command

2. **Configuration File Location**
   - Verify Claude Code is looking in the correct location for `.mcp.json`
   - Check if Claude Code requires `.mcp.json` in a specific directory (project root, home directory, etc.)
   - Test: Check Claude Code documentation for config file location

3. **Caching/State Management**
   - Investigate if Claude Code caches MCP server configuration
   - Look for cache invalidation mechanisms
   - Test: Clear any Claude Code cache/state and retry

4. **Compare with Working Examples**
   - Check `.mcp.example.json` for any differences in format
   - Notice: Some entries use `-y` flag before `mcp-remote`, others don't
   - Test: Add `-y` flag to `.mcp.json` configuration:

     ```json
     "args": ["-y", "mcp-remote", "http://localhost:6280/sse"]
     ```

5. **WSL2-Specific Issues**
   - Test if `localhost:6280` is accessible from Claude Code's context in WSL2
   - Consider using `127.0.0.1:6280` instead of `localhost:6280`
   - Test host networking configuration

6. **Claude Code Logging**
   - Enable verbose logging in Claude Code if available
   - Check for hidden log files or error messages
   - Look for MCP server initialization errors

7. **Verify npx Resolution**
   - Ensure `npx` is available in the environment where Claude Code runs
   - Test: `which npx && npx --version`
   - Current result: `/home/msmith/.nvm/versions/node/v22.16.0/bin/npx` (version 10.9.2)

## Additional Context

### Configuration Comparison

**Current `.mcp.json`:**

```json
{
  "mcpServers": {
    "docs-mcp": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:6280/sse"]
    }
  }
}
```

**`.mcp.example.json` SSE servers:**

```json
{
  "mcpServers": {
    "cloudflare-observability": {
      "command": "npx",
      "args": ["mcp-remote", "https://observability.mcp.cloudflare.com/sse"]
    },
    "cloudflare-bindings": {
      "command": "npx",
      "args": ["mcp-remote", "https://bindings.mcp.cloudflare.com/sse"]
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.exa.ai/mcp?exaApiKey=YOUR_EXA_API_KEY"]
    }
  }
}
```

**Observation**: The Cloudflare examples omit `-y` flag, while the Exa example includes it. Current `.mcp.json` omits `-y` flag, matching the Cloudflare pattern.

### Security Note

The `.mcp.json.backup` file contains exposed API keys that were properly moved to `.env.local` during the #602 fix. The backup should be deleted or secured to prevent accidental exposure.

### Issue Closure Concern

Issue #602 was marked as closed and completed, but the validation was only done on configuration correctness, not on actual Claude Code detection. The completion report states:

> ### Manual Testing Required
>
> Please verify the following in Claude Code:
>
> 1. **Restart Claude Code** (if currently running)
> 2. **Run `/mcp` command** - Expected: docs-mcp appears in configured servers list
> 3. **Verify docs-mcp tools available** - Expected: Tools like `mcp__docs-mcp__search_docs`, `mcp__docs-mcp__scrape_docs` appear

It appears the manual testing steps were never completed, or they were completed but still showed the issue.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh, git, docker, curl, jq, npx, timeout, grep, ls, cat, node*
