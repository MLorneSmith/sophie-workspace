# Bug Fix: docs-mcp MCP Server Not Loading in Claude Code

**Related Diagnosis**: #598

## Bug Description

The docs-mcp MCP server running in Docker is not loading in Claude Code despite being correctly configured in `.mcp.json`. The server is healthy and responding to SSE requests, but Claude Code does not establish a connection or make the MCP tools available. This is part of a broader issue where NO MCP servers are loading in Claude Code, suggesting a systemic problem with MCP client initialization or SSE protocol support.

**Key Symptoms:**

- docs-mcp container is healthy and serving SSE endpoint correctly
- SSE endpoint at <http://localhost:6280/sse> returns proper event-stream responses
- `.mcp.json` contains valid configuration for SSE-type server
- Claude Code does not show docs-mcp as connected
- No MCP tools from docs-mcp are available in Claude Code
- Other MCP servers (npx-based) are also not loading

**Note:** The HTTP 404 error at root endpoint (/) was a red herring and has been resolved by updating docker-compose.yml to remove the "mcp" subcommand. The web UI now loads correctly.

## Problem Statement

Claude Code's MCP client is not connecting to the docs-mcp SSE server despite proper configuration. The SSE endpoint is accessible and returns valid event-stream responses, but the MCP protocol handshake is not completing. This prevents documentation search and indexing tools from being available within Claude Code.

The broader issue is that NO MCP servers (including npx-based ones) are loading, indicating a potential MCP client initialization failure rather than a docs-mcp-specific problem.

## Solution Statement

Investigate and resolve the Claude Code MCP client initialization and SSE protocol connection issues through:

1. **MCP Client Diagnostics**: Examine Claude Code logs and configuration to identify why MCP client is not initializing or connecting to servers
2. **SSE Protocol Validation**: Verify the SSE endpoint implements the full MCP protocol handshake required by Claude Code
3. **Configuration Verification**: Ensure `.mcp.json` schema and format are correct for SSE-type servers
4. **Alternative Transport Testing**: Test if stdio-based connection works as fallback
5. **Network/WSL2 Validation**: Rule out localhost networking issues in WSL2 environment

## Steps to Reproduce

1. Start docs-mcp-server container: `docker compose -f .mcp-servers/docs-mcp/docker-compose.yml up -d`
2. Verify container is healthy: `docker ps | grep docs-mcp-server`
3. Verify SSE endpoint is responding: `curl -v http://localhost:6280/sse`
4. Check `.mcp.json` contains docs-mcp configuration with type "sse"
5. Start Claude Code
6. Observe that docs-mcp server is not listed as connected
7. Attempt to use MCP tools - none available from docs-mcp
8. Check other MCP servers - observe none are loading

## Root Cause Analysis

From the diagnosis issue #598, the investigation identified:

**What's Working:**

- ✅ Docker container is healthy and running
- ✅ HTTP server responding on port 6280
- ✅ SSE endpoint returns proper `text/event-stream` responses with correct headers
- ✅ Database migrations completed successfully
- ✅ Web UI accessible at <http://localhost:6280/>
- ✅ MCP endpoints exposed at /sse and /mcp

**What's Not Working:**

- ❌ No MCP servers loading in Claude Code (systemic issue)
- ❌ SSE connection not being established by Claude Code
- ❌ No MCP tools available from any configured server
- ❌ MCP client may not be initializing at all

**Root Cause Hypotheses** (in priority order):

1. **Claude Code MCP Client Not Initializing**
   - `.mcp.json` may not be in the correct location or format
   - MCP client service may not be starting in Claude Code
   - All servers failing suggests client-side issue, not server-side

2. **SSE Protocol Not Supported**
   - Claude Code version may only support stdio/npx transport
   - SSE transport may require additional configuration not documented
   - MCP protocol over SSE may need specific headers/handshake

3. **MCP Protocol Handshake Missing**
   - SSE endpoint may not be implementing full MCP protocol initialization
   - Server may not be responding to MCP protocol messages over SSE
   - Connection established but protocol negotiation failing

4. **WSL2 Networking Issues**
   - localhost:6280 may not be accessible to Claude Code from WSL2
   - Port forwarding or firewall rules blocking connection
   - IPv4 vs IPv6 binding issues

## Relevant Files

### Configuration Files

- **`.mcp.json`** - MCP server configuration
  - Contains docs-mcp configuration with type "sse" and url "<http://localhost:6280/sse>"
  - Needs verification of correct schema and format for SSE-type servers
  - May need to be relocated or reformatted based on Claude Code requirements

- **`.mcp-servers/docs-mcp/docker-compose.yml`** - Docker container configuration
  - Already fixed to run in standalone mode (web UI + MCP endpoints)
  - Correctly exposes port 6280 and health checks passing
  - May need adjustments for SSE protocol requirements

### New Files

- **`.ai/reports/mcp-client-diagnostics.md`** - Diagnostic report for MCP client investigation
  - Claude Code logs and error messages
  - MCP client initialization status
  - Network connection attempts and failures

- **`temp/test-mcp-sse-connection.sh`** - Script to test SSE connection manually
  - Validate SSE protocol handshake
  - Test MCP protocol messages over SSE
  - Compare with working MCP client behavior

## Step by Step Tasks

### Step 1: Verify MCP Client Status and Logs

- Check if `.mcp.json` is in the correct location for Claude Code to read
  - Verify file is at project root: `/home/msmith/projects/2025slideheroes/.mcp.json`
  - Check file permissions are readable: `ls -la .mcp.json`
- Locate and examine Claude Code MCP client logs
  - Find Claude Code log directory (typically `~/.config/claude-code/logs` or similar)
  - Search for MCP initialization messages, errors, or connection attempts
  - Check if MCP client service is starting at all
- Document findings in `.ai/reports/mcp-client-diagnostics.md`
- Determine if this is a client initialization issue vs connection issue

### Step 2: Test stdio-based MCP Servers

- Test if npx-based MCP servers work (to isolate SSE-specific issues)
  - Try simple npx-based server like `context7` or `perplexity-ask`
  - Check if Claude Code loads and connects to stdio servers
- If stdio servers work:
  - Issue is specific to SSE transport protocol
  - Proceed to SSE protocol validation (Step 3)
- If stdio servers also fail:
  - Systemic MCP client issue
  - Focus on MCP client configuration and initialization
- Document results in diagnostic report

### Step 3: SSE Protocol Handshake Validation

- Create test script to manually validate SSE protocol handshake
  - Script location: `temp/test-mcp-sse-connection.sh`
  - Connect to <http://localhost:6280/sse>
  - Capture SSE events and messages
  - Send MCP protocol initialization messages
  - Verify server responds with proper MCP protocol messages
- Compare SSE stream with MCP protocol specification
  - Check for required MCP protocol headers
  - Verify event stream format matches expected MCP over SSE format
  - Look for protocol version negotiation
- Test if docs-mcp-server properly implements MCP protocol over SSE
- Document any protocol mismatches or missing handshake steps

### Step 4: Configuration Format Validation

- Review Claude Code documentation for `.mcp.json` schema
  - Verify "type": "sse" is supported configuration
  - Check if additional parameters required for SSE servers
  - Compare with examples from Claude Code documentation
- Validate current `.mcp.json` configuration
  - Schema validation for SSE-type servers
  - Check if URL format is correct (<http://localhost:6280/sse>)
  - Verify autoApprove configuration is valid
- Test alternative configuration formats if needed
  - Try with/without autoApprove
  - Test with explicit headers or authentication
  - Try alternative URL formats if documented

### Step 5: Network and WSL2 Validation

- Test if localhost:6280 is accessible from Claude Code's perspective
  - Check if Claude Code runs in different network context
  - Test with explicit 127.0.0.1 vs localhost
  - Try binding to 0.0.0.0 if needed
- Monitor network traffic during Claude Code startup
  - Use `tcpdump` or similar to capture connection attempts
  - Check if Claude Code attempts to connect to port 6280
  - Identify any connection failures or timeouts
- Test from different network contexts
  - Direct curl from WSL2 (already works)
  - Test from Windows host if Claude Code runs there
  - Check IPv4 vs IPv6 binding

### Step 6: Implement Fix Based on Findings

- Based on diagnostics from Steps 1-5, implement appropriate fix:
  - **If MCP client not initializing**: Fix configuration or file location
  - **If SSE not supported**: Document limitation and recommend stdio transport
  - **If SSE protocol incomplete**: Update docker-compose or server configuration
  - **If configuration invalid**: Update `.mcp.json` to correct format
  - **If network issue**: Update docker-compose networking configuration
- Apply minimal changes to fix the specific root cause identified
- Document the fix reasoning and implementation

### Step 7: Verify Fix with Comprehensive Testing

- Restart Claude Code after applying fix
- Verify docs-mcp server appears as connected in Claude Code
- Test MCP tools from docs-mcp are available:
  - `list_docs` - List indexed documentation
  - `search_docs` - Search documentation content
  - `get_doc_content` - Retrieve specific documentation
- Verify other MCP servers also load correctly
- Test full workflow: documentation indexing and search
- Run `Validation Commands` to confirm zero regressions

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

```bash
# Verify docker container is healthy
docker ps | grep docs-mcp-server
# Expected: Status shows "Up X minutes (healthy)"

# Verify SSE endpoint responds correctly
curl -v http://localhost:6280/sse 2>&1 | head -n 20
# Expected: HTTP/1.1 200 OK, Content-Type: text/event-stream

# Verify web UI is accessible
curl -s http://localhost:6280/ | grep -q "MCP Docs"
echo "Web UI check: $?"
# Expected: Output "Web UI check: 0" (success)

# Verify .mcp.json file exists and is readable
test -r .mcp.json && echo ".mcp.json is readable" || echo ".mcp.json NOT readable"
# Expected: ".mcp.json is readable"

# Verify .mcp.json contains docs-mcp configuration
grep -q "docs-mcp" .mcp.json && echo "docs-mcp configured" || echo "docs-mcp NOT configured"
# Expected: "docs-mcp configured"

# Check container logs for errors
docker logs docs-mcp-server --tail 20 2>&1 | grep -i "error"
# Expected: No error messages (empty output or only non-error lines)

# Verify all MCP endpoints are accessible
curl -s -o /dev/null -w "SSE endpoint: %{http_code}\n" http://localhost:6280/sse
curl -s -o /dev/null -w "Web UI: %{http_code}\n" http://localhost:6280/
# Expected: Both return 200

# After fix is applied and Claude Code restarted:
# Manual verification required - Check Claude Code UI for:
# 1. docs-mcp appears in connected MCP servers list
# 2. MCP tools are available (list_docs, search_docs, get_doc_content)
# 3. Other configured MCP servers are also loading
# 4. Documentation search functionality works end-to-end
```

## Notes

### Critical Investigation Points

1. **Systemic vs Isolated Issue**: The fact that NO MCP servers are loading (not just docs-mcp) suggests this is a Claude Code MCP client initialization issue rather than a docs-mcp-specific problem.

2. **SSE Protocol Support**: Need to confirm if Claude Code version being used supports SSE transport for MCP servers. Documentation should specify supported transports.

3. **Previous Issues**: This project has history of Docker/MCP issues:
   - Issue #439: docs-mcp container health issues (resolved)
   - Issue #25: Migration from npx to Docker for reliability
   - Issue #27: Multiple Docker MCP servers not achieving healthy status

4. **WSL2 Networking**: Running in WSL2 environment may have localhost networking complications. The container is accessible via curl from WSL2, but Claude Code may run in different context.

5. **Configuration Location**: Verify `.mcp.json` is in the correct location that Claude Code reads from. May need to be in home directory, project root, or specific config directory.

### Alternative Solutions

If SSE transport is not supported or cannot be made to work:

1. **Fallback to stdio transport**: docs-mcp-server may support stdio mode
2. **Use npx wrapper**: Create npx-based wrapper that starts docker container and proxies stdio
3. **Wait for Claude Code update**: If SSE support is coming in future release
4. **Contact support**: Reach out to Claude Code support for SSE server configuration guidance

### Testing Dependencies

- None - all testing uses existing infrastructure
- Manual verification in Claude Code UI required after fix
- No new packages needed for diagnostics

### Success Criteria

- ✅ docs-mcp server shows as connected in Claude Code
- ✅ MCP tools (list_docs, search_docs, get_doc_content) are available
- ✅ Other MCP servers (npx-based) also load successfully
- ✅ Documentation can be indexed and searched through Claude Code
- ✅ No errors in Claude Code logs related to MCP client
- ✅ All validation commands pass without errors
