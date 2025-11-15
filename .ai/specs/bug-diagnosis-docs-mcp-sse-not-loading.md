# Bug Diagnosis: docs-mcp MCP Server Not Loading in Claude Code

**ID**: ISSUE-598
**Created**: 2025-11-14T22:05:57Z
**Reporter**: user/system
**Severity**: high
**Status**: new
**Type**: integration

## Summary

The docs-mcp MCP server running in Docker is not loading in Claude Code despite being configured in .mcp.json. Additionally, no MCP servers are loading even though several are listed in the configuration. When accessing the server's root endpoint at <http://localhost:6280/>, a 404 "Route GET:/ not found" error is returned, though this is expected behavior as the server only exposes /sse and /mcp endpoints.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Browser**: N/A (CLI tool)
- **Node Version**: v22.16.0
- **Docker Version**: 28.4.0, build d8eb465
- **Database**: SQLite (embedded in docs-mcp container)
- **Container Image**: ghcr.io/arabold/docs-mcp-server:latest v1.23.0
- **OS**: Ubuntu 22.04.5 LTS on WSL2 (Linux 6.6.87.2-microsoft-standard-WSL2)
- **Last Working**: Unknown - issue reported today (2025-11-14)

## Reproduction Steps

1. Check that docs-mcp-server container is running: `docker ps -a | grep mcp`
2. Verify .mcp.json contains docs-mcp configuration with SSE protocol
3. Start Claude Code and check MCP server status
4. Attempt to access <http://localhost:6280/> in browser
5. Observe 404 error and MCP server not loading in Claude Code

## Expected Behavior

### For HTTP Root Endpoint

- The root endpoint (/) returning 404 is **correct behavior** - docs-mcp only exposes /sse and /mcp endpoints

### For Claude Code Integration

- docs-mcp server should appear as connected in Claude Code
- MCP tools from docs-mcp should be available
- All configured MCP servers should load and connect

## Actual Behavior

### HTTP Endpoint (Expected)

- GET <http://localhost:6280/> returns 404 with message: `{"message":"Route GET:/ not found","error":"Not Found","statusCode":404}`
- This is correct - the server only has /sse and /mcp routes

### MCP Server Integration (Issue)

- docs-mcp is not loading in Claude Code
- No MCP servers are loading despite being configured in .mcp.json
- SSE endpoint at <http://localhost:6280/sse> is accessible and returns proper SSE stream

## Diagnostic Data

### Docker Container Status

```
CONTAINER ID   IMAGE                                        CREATED      STATUS                   PORTS
3cad6a3b2ffd   ghcr.io/arabold/docs-mcp-server:latest      7 weeks ago   Up 4 hours (healthy)   0.0.0.0:6280->6280/tcp, [::]:6280->6280/tcp
```

Container name: `docs-mcp-server`
Health status: **healthy**
Network: docs-mcp_default (172.22.0.2)

### Container Logs (Last 100 Lines)

```
🚀 Starting MCP server (http mode)
🚀 AppServer available at http://127.0.0.1:6280
   • MCP endpoints: http://127.0.0.1:6280/mcp, http://127.0.0.1:6280/sse
   • Embedded worker: enabled
🔄 Applying 9 database migration(s)...
✅ Successfully applied 9 migration(s)
```

Container is successfully starting and serving on the expected endpoints. Migrations are applying successfully.

### SSE Endpoint Test

```bash
$ curl -v http://localhost:6280/sse 2>&1
> GET /sse HTTP/1.1
> Host: localhost:6280
> User-Agent: curl/7.81.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Content-Type: text/event-stream
< Cache-Control: no-cache, no-transform
< Connection: keep-alive
```

**Result**: SSE endpoint is working correctly and returns proper event-stream response.

### MCP Endpoint Test

```bash
$ curl -v http://localhost:6280/mcp 2>&1
< HTTP/1.1 404 Not Found
< content-type: application/json; charset=utf-8
< content-length: 75
```

**Result**: /mcp endpoint returns 404 (may require POST or specific headers).

### .mcp.json Configuration

```json
{
  "mcpServers": {
    "docs-mcp": {
      "type": "sse",
      "url": "http://localhost:6280/sse",
      "disabled": false,
      "autoApprove": [
        "list_docs",
        "search_docs",
        "get_doc_content"
      ]
    }
  }
}
```

Configuration appears correct for SSE-type MCP server.

### Docker Compose Configuration

```yaml
services:
  docs-mcp:
    image: ghcr.io/arabold/docs-mcp-server:latest
    container_name: docs-mcp-server
    ports:
      - "6280:6280"
    environment:
      - OPENAI_API_KEY=lmstudio
      - OPENAI_API_BASE=http://host.docker.internal:1234/v1
      - DOCS_MCP_EMBEDDING_MODEL=text-embedding-qwen3-embedding-4b
      - DOCS_MCP_TELEMETRY=false
    volumes:
      - ~/.local/share/docs-mcp-server:/data
      - ../../.claude/docs:/docs/slideheroes:ro
    command: ["mcp", "--protocol", "http", "--port", "6280"]
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:6280/', (res) => process.exit(res.statusCode === 404 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
```

Health check explicitly expects 404 from root endpoint, which is correct behavior.

### Container Environment Variables

```
DOCS_MCP_EMBEDDING_MODEL=text-embedding-qwen3-embedding-4b
DOCS_MCP_TELEMETRY=false
OPENAI_API_KEY=lmstudio
OPENAI_API_BASE=http://host.docker.internal:1234/v1
DOCS_MCP_STORE_PATH=/data
```

### Container Mounts

- `/home/msmith/.local/share/docs-mcp-server` → `/data` (rw)
- `/home/msmith/projects/2025slideheroes/.claude/docs` → `/docs/slideheroes` (ro)

## Error Stack Traces

No error stack traces observed. The server is running correctly at the HTTP level.

## Related Code

### Affected Files

- `.mcp.json` - MCP server configuration
- `.mcp-servers/docs-mcp/docker-compose.yml` - Docker container configuration
- Claude Code internal MCP client (not visible/accessible)

### Recent Git Changes

```
545f33ff3 docs(tooling): fix citation format examples in Perplexity docs
61d215b57 fix(tooling): handle citations as URL strings in Perplexity Chat API
ca733dd84 feat(tooling): add Perplexity API integration scripts
```

No recent changes to MCP configuration files.

## Related Issues & Context

### Direct Predecessors

- **#439** (CLOSED): "docs-mcp Docker Container Unhealthy - Database Connection Failure"
  - Previous issue with docs-mcp container failing to start due to LM Studio network binding
  - Resolved by configuring LM Studio for network access and using host-gateway
  - Container is now healthy, but MCP integration still not working

### Related Infrastructure Issues

- **#25** (CLOSED): "Replace unreliable npx-based MCP servers with Docker containers"
  - Migration strategy from npx to Docker for MCP servers
  - Identified 11 npx-based servers with connection issues
  - Proposed Docker Compose architecture for reliable MCP hosting

### Similar Integration Issues

- **#27** (CLOSED): "MCP Docker Infrastructure - Multiple Servers Not Achieving Healthy Status"
  - Previous issues with Docker-based MCP server health and connectivity

## Initial Analysis

### Root Cause Hypothesis

The issue has **two distinct problems**:

#### Problem 1: HTTP 404 Error on Root Endpoint (CONFIGURATION BUG - ROOT CAUSE IDENTIFIED)

The 404 error at <http://localhost:6280/> is **NOT expected behavior for standalone mode**.

**Root Cause**: The docker-compose.yml is using the wrong command:

```yaml
command: ["mcp", "--protocol", "http", "--port", "6280"]
```

This starts the server in **MCP-only mode**, which:

- ✅ Provides `/mcp` and `/sse` endpoints
- ❌ Does NOT provide the web interface at `/`
- ❌ Does NOT provide the full app server functionality

**Correct Configuration**: According to the docs-mcp-server documentation, to get both MCP endpoints AND the web interface in standalone mode, the command should be:

```yaml
command: ["--protocol", "http", "--host", "0.0.0.0", "--port", "6280"]
```

Or simply omit the "mcp" subcommand entirely. The default behavior is to run as a standalone server with both MCP and web UI.

**From docs-mcp-server Documentation**:

- Running **without "mcp" command** = Standalone server with web interface + MCP endpoints
- Running **with "mcp" command** = MCP server only (no web interface)
- Running **with "web" command** = Web interface only (no MCP endpoints)

#### Problem 2: MCP Servers Not Loading in Claude Code

This is a **separate issue** that may be related to:

1. **Claude Code MCP Client Configuration**
   - SSE protocol may require additional configuration
   - .mcp.json configuration may need adjustment
   - Claude Code may have issues with SSE-type MCP servers

2. **Network/Connection Issues**
   - Claude Code may not be able to connect to localhost:6280 from WSL2
   - Port accessibility or firewall issues

3. **MCP Client Not Loading**
   - The statement "no MCP servers are loading" suggests broader issue
   - May indicate Claude Code not reading .mcp.json at all
   - MCP client may not be initializing

### Supporting Evidence

**What's Working:**

- ✅ Docker container is healthy and running
- ✅ HTTP server is responding on port 6280
- ✅ SSE endpoint returns proper event-stream responses
- ✅ Database migrations completed successfully
- ✅ Health checks passing (correctly expecting 404 for MCP-only mode)

**What's Not Working:**

- ❌ Web interface not available at <http://localhost:6280/> (404 error)
- ❌ No MCP servers loading in Claude Code (not just docs-mcp)
- ❌ SSE connection not being established by Claude Code
- ❌ No MCP tools available from any configured server

**What's Misconfigured:**

- ❌ docker-compose.yml using "mcp" command instead of default standalone mode
- ❌ Health check expecting 404, which is correct for MCP-only mode but wrong for desired standalone mode

### Critical Finding

**Docker Command Issue**: The container is running in MCP-only mode when it should be running in standalone mode with both MCP endpoints and web interface. This explains the 404 error at the root endpoint.

**Claude Code Integration Issue**: Separately, even with the MCP endpoints working (SSE at /sse), Claude Code is not connecting to ANY MCP servers, suggesting a broader integration problem.

## Suggested Investigation Areas

### Priority 1: Fix Docker Configuration (IMMEDIATE)

**ROOT CAUSE IDENTIFIED** - Fix the docker-compose.yml configuration:

1. **Update docker-compose.yml**:

   ```yaml
   # WRONG (current):
   command: ["mcp", "--protocol", "http", "--port", "6280"]

   # CORRECT (standalone mode with web UI + MCP):
   command: ["--protocol", "http", "--host", "0.0.0.0", "--port", "6280"]
   ```

2. **Update health check** to expect 200 instead of 404:

   ```yaml
   healthcheck:
     test: ["CMD", "node", "-e", "require('http').get('http://127.0.0.1:6280/', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"]
   ```

3. **Restart container** and verify web UI is accessible at <http://localhost:6280/>

### Priority 2: Verify Claude Code MCP Client Status

After fixing the Docker configuration, investigate Claude Code integration:

1. Check Claude Code logs for MCP initialization errors
2. Verify .mcp.json is being read (check file location and permissions)
3. Test if stdio-based MCP servers are working (not just SSE)
4. Check Claude Code version and MCP protocol support

### Priority 3: SSE Connection Debugging

If web UI works but MCP still doesn't connect:

1. Monitor network traffic to see if Claude Code attempts SSE connection
2. Check if additional HTTP headers are required
3. Verify SSE endpoint returns MCP protocol handshake
4. Test SSE connection with MCP client tools/examples

### Priority 4: Configuration Validation

1. Validate .mcp.json schema and format
2. Check if "type": "sse" is supported configuration
3. Review Claude Code documentation for SSE server setup
4. Compare with working MCP server configurations

## Additional Context

### Container Configuration Details

- **Docker Network**: docs-mcp_default (bridge network)
- **Container IP**: 172.22.0.2
- **Port Mapping**: 0.0.0.0:6280→6280/tcp, [::]:6280→6280/tcp
- **Restart Policy**: unless-stopped
- **Extra Hosts**: host.docker.internal → host-gateway

### LM Studio Configuration (from #439 resolution)

- Configured for network access (0.0.0.0 binding)
- Accessible at <http://host.docker.internal:1234/v1>
- Using text-embedding-qwen3-embedding-4b model

### Historical Context

This project previously had issues with:

- npx-based MCP servers having unreliable connections
- Docker health checks failing for docs-mcp
- Network binding issues between WSL2/Docker/LM Studio

The current Docker setup was implemented to solve reliability issues with npx-based servers, but SSE-based MCP integration may not be fully configured in Claude Code.

## Next Steps for Fix

### Immediate Fix (Docker Configuration)

1. **Update `.mcp-servers/docs-mcp/docker-compose.yml`**:
   - Remove "mcp" from command array to enable standalone mode
   - Add `--host 0.0.0.0` for Docker networking
   - Update health check to expect 200 instead of 404

2. **Restart container**:

   ```bash
   cd .mcp-servers/docs-mcp
   docker compose down
   docker compose up -d
   ```

3. **Verify web UI** - Access <http://localhost:6280/> and confirm web interface loads

### Follow-up Investigation (Claude Code Integration)

4. **Test MCP connection** - Check if docs-mcp appears in Claude Code after fix
5. **Check other MCP servers** - Investigate why no MCP servers are loading
6. **Review Claude Code logs** - Find MCP client initialization logs
7. **Validate .mcp.json** - Ensure configuration is correct for SSE servers

---
*Generated by Claude Debug Assistant*
*Tools Used: Docker inspection, curl, network testing, configuration analysis, issue research*
*Container Version: ghcr.io/arabold/docs-mcp-server:latest v1.23.0*
*Related Issues: #439 (docker health), #25 (npx migration), #27 (docker infrastructure)*
