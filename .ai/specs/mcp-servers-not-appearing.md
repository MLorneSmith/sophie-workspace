# Bug Diagnosis: MCP Servers Not Appearing in Claude Code

**ID**: ISSUE-601
**Created**: 2025-11-15T15:34:00Z
**Reporter**: msmith
**Severity**: critical
**Status**: new
**Type**: integration

## Summary

MCP servers configured in `.mcp.json` are not appearing in Claude Code despite having multiple servers configured. The user specifically wants only the `docs-mcp` server but none of the configured servers (including docs-mcp) are loading. The issue started this week in the development environment.

## Environment

- **Application Version**: SlideHeroes (Next.js 16)
- **Environment**: Development (WSL2 on Linux)
- **OS**: Linux 6.6.87.2-microsoft-standard-WSL2
- **Node Version**: v22.16.0
- **Database**: PostgreSQL (via Supabase)
- **Last Working**: Earlier this week
- **docs-mcp Container**: Healthy, running on localhost:6280

## Reproduction Steps

1. Configure `.mcp.json` with multiple MCP servers including docs-mcp
2. Start docs-mcp container: `docker compose -f .mcp-servers/docs-mcp/docker-compose.yml up -d`
3. Verify container is healthy: `docker ps | grep docs-mcp-server`
4. Launch Claude Code
5. Run `/mcp` command to check connected servers
6. Observe: "No MCP servers configured"

## Expected Behavior

- Claude Code should detect and load MCP servers from `.mcp.json`
- The docs-mcp server should appear as connected
- MCP tools from docs-mcp should be available for use
- At minimum, docs-mcp should be the only active server

## Actual Behavior

- Claude Code reports "No MCP servers configured"
- No MCP servers appear in the available tools list
- `/mcp` command shows no configured servers
- docs-mcp container is running and healthy but not detected

## Diagnostic Data

### Configuration Analysis

**Current `.mcp.json` (PROBLEMATIC):**

```json
{
  "mcpServers": {
    "docs-mcp": {
      "type": "http",
      "url": "http://localhost:6280/mcp"
    }
  }
}
```

**Example `.mcp.example.json` (REFERENCE):**

```json
{
  "mcpServers": {
    "cloudflare-observability": {
      "command": "npx",
      "args": ["mcp-remote", "https://observability.mcp.cloudflare.com/sse"]
    }
  }
}
```

### Container Status

```
docs-mcp-server Up 6 minutes (healthy) 0.0.0.0:6280->6280/tcp, [::]:6280->6280/tcp
```

### SSE Endpoint Test

```bash
$ timeout 3 curl -N http://localhost:6280/sse
event: endpoint
data: /messages?sessionId=9f29e14d-962c-4c54-ab9e-ffa83d72cdf8
```

### HTTP Endpoint Test

```bash
$ curl -s http://localhost:6280/mcp
{"message":"Route GET:/mcp not found","error":"Not Found","statusCode":404}
```

### Container Logs

The docs-mcp server is running correctly and provides:

- Web interface: <http://127.0.0.1:6280>
- MCP endpoints: <http://127.0.0.1:6280/mcp>, <http://127.0.0.1:6280/sse>
- SSE endpoint is responding with session information

### Security Issue Discovered

The `.mcp.json` file contains **EXPOSED API KEYS**:

- Line 10: Exa API key exposed
- Line 20: Perplexity API key exposed

**CRITICAL**: These keys should be moved to environment variables immediately.

## Error Stack Traces

No explicit error messages in Claude Code. The MCP client simply doesn't detect any servers.

## Related Code

- **Affected Files**:
  - `.mcp.json` (incorrect configuration format)
  - `.mcp.example.json` (reference for correct format)
  - `.mcp-servers/docs-mcp/docker-compose.yml` (container configuration)

- **Recent Changes**:
  - `38e4467e0` - refactor(tooling): migrate docs to .ai/ai_docs structure
  - No recent changes to `.mcp.json` itself

- **Container Configuration**: docs-mcp server running on port 6280

## Related Issues & Context

### Direct Predecessors

- #599 (CLOSED): "Bug Fix: docs-mcp MCP Server Not Loading in Claude Code" - **SAME PROBLEM**
- #598 (CLOSED): "Bug Diagnosis: docs-mcp MCP Server Not Loading in Claude Code" - **IDENTICAL DIAGNOSIS**

### Related Infrastructure Issues

- #439 (CLOSED): "docs-mcp Docker Container Unhealthy - Database Connection Failure"
- #436 (CLOSED): "[TASK] Add health checks for 4 containers and integrate with docker-health monitoring"

### Historical Context

**THIS IS A REGRESSION!** Issues #598 and #599 were closed this week (2025-11-14) addressing the exact same problem. The fix applied then appears to have been reverted or is no longer working.

From issue #599, the previous solution involved:

- Changing `.mcp.json` configuration from `"type": "http"` to using `npx mcp-remote`
- SSE endpoint validation
- MCP protocol handshake verification

**Pattern**: This is the third time docs-mcp integration has had issues:

1. #439 (Sep 26): Container health issues
2. #598/#599 (Nov 14): MCP server not loading - **SAME AS CURRENT**
3. Current issue (Nov 15): MCP servers not appearing - **REGRESSION**

## Initial Analysis

### Root Cause: Invalid MCP Configuration Format

The `.mcp.json` file uses an **unsupported configuration format** for Claude Code:

**Problem:**

```json
"docs-mcp": {
  "type": "http",
  "url": "http://localhost:6280/mcp"
}
```

**Why It Fails:**

1. Claude Code does not support `"type": "http"` servers directly in `.mcp.json`
2. The URL points to `/mcp` endpoint which returns 404 (Not Found)
3. The correct endpoint is `/sse` (Server-Sent Events) which is working
4. Based on `.mcp.example.json`, SSE servers should use `npx mcp-remote` wrapper

**Evidence from Testing:**

- `http://localhost:6280/mcp` → 404 Not Found
- `http://localhost:6280/sse` → ✅ Working (returns SSE stream with session ID)
- `.mcp.example.json` shows remote SSE servers use: `npx mcp-remote https://...sse`

### Secondary Issues

1. **Too Many Servers Configured**: User wants only docs-mcp but has 7 servers configured
2. **Exposed API Keys**: Security vulnerability with hardcoded keys
3. **Configuration Drift**: The fix from #599 has been lost/reverted

## Suggested Investigation Areas

1. **Immediate Fix**: Update `.mcp.json` to use correct format for SSE servers:

   ```json
   "docs-mcp": {
     "command": "npx",
     "args": ["mcp-remote", "http://localhost:6280/sse"]
   }
   ```

2. **Remove Unwanted Servers**: Clean up `.mcp.json` to only include docs-mcp

3. **Secure API Keys**: Move exposed keys to environment variables

4. **Verify Resolution**: Test that Claude Code detects the server after configuration change

5. **Prevent Regression**: Document the correct configuration format to prevent future reversions

## Additional Context

**From Previous Fix (#599):**
The previous diagnosis identified that Claude Code requires SSE-based MCP servers to use the `mcp-remote` wrapper via npx. Direct HTTP connections are not supported in Claude Code's MCP client implementation.

**User Intent:**

- Only wants docs-mcp server active
- All other servers should be removed or disabled
- Needs documentation search/indexing tools available

**Tools Used:**

- Docker (container management)
- curl (endpoint testing)
- gh CLI (GitHub issue search)
- Read tool (configuration inspection)
- Bash (diagnostics)

---
*Generated by Claude Debug Assistant*
*Diagnostic Session: 2025-11-15T15:34:00Z*
