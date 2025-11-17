# Issue: docs-mcp Docker Container Unhealthy - Database Connection Failure

**ID**: ISSUE-439
**Created**: 2025-09-26T20:39:00Z
**Reporter**: user/system
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The docs-mcp-server Docker container consistently reports as unhealthy due to database connection timeouts. The container cannot establish connection to its embedded database, preventing the docs-mcp MCP server from functioning. This affects the Claude Code statusline component that monitors Docker health.

## Environment

- **Application Version**: docs-mcp-server:latest (ghcr.io/arabold/docs-mcp-server:latest)
- **Environment**: development
- **OS**: Ubuntu 22.04.5 LTS on WSL2
- **Docker Version**: 28.4.0, build d8eb465
- **Node Version**: v22.18.0 (container)
- **Database**: SQLite (embedded in container)
- **Last Working**: Unknown - issue discovered today (2025-09-26)

## Reproduction Steps

1. Run `docker ps -a --filter "name=docs-mcp"` to see container status
2. Check health status: `docker inspect docs-mcp-server --format='{{json .State.Health}}' | jq .`
3. View logs: `docker logs docs-mcp-server --tail 50`
4. Observe container shows as "Up X minutes (unhealthy)"

## Expected Behavior

- Container should be healthy and responsive
- Health check at <http://127.0.0.1:6280/> should return 200 status
- docs-mcp service should be accessible for MCP operations
- Docker statusline component should show green status

## Actual Behavior

- Container status: "Up 3 minutes (unhealthy)"
- Health check fails with "ECONNREFUSED 127.0.0.1:6280"
- Service logs show: "ConnectionError: Failed to initialize database connection caused by TimeoutError: Request timed out"
- Docker statusline shows red status

## Diagnostic Data

### Container Status

```
CONTAINER ID   IMAGE                                    COMMAND                CREATED          STATUS                     PORTS                                         NAMES
3ef8741a1706   ghcr.io/arabold/docs-mcp-server:latest   "node dist/index.js"   22 minutes ago   Up 3 minutes (unhealthy)   0.0.0.0:6280->6280/tcp, [::]:6280->6280/tcp   docs-mcp-server
```

### Health Check Failures

```json
{
  "Status": "starting",
  "FailingStreak": 0,
  "Log": [
    {
      "Start": "2025-09-26T20:37:17.880447921Z",
      "End": "2025-09-26T20:37:17.93878471Z",
      "ExitCode": 1,
      "Output": "node:events:496\n      throw er; // Unhandled 'error' event\n      ^\n\nError: connect ECONNREFUSED 127.0.0.1:6280\n    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1637:16)\n..."
    }
  ]
}
```

### Container Logs

```
❌ Error in CLI: ConnectionError: Failed to initialize database connection caused by TimeoutError: Request timed out.
❌ Error in CLI: ConnectionError: Failed to initialize database connection caused by TimeoutError: Request timed out.
❌ Error in CLI: ConnectionError: Failed to initialize database connection caused by TimeoutError: Request timed out.
```

### Container Process Status

```
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  3.0  0.9 11805708 149888 ?     Ssl  20:39   0:01 node dist/index.js
```

### Database Volume Mount

Database files exist and are accessible:

```
.rw-r--r-- 152k root 26 Sep 16:15 documents.db
.rw-r--r--  33k root 26 Sep 16:39 documents.db-shm
.rw-r--r--    0 root 26 Sep 16:15 documents.db-wal
.rw-r--r--   36 root 26 Sep 16:15 installation.id
```

### Network Configuration

Container network configuration shows proper host mapping:

```
172.31.160.1 host.docker.internal
```

However, LM Studio reports being accessible at `172.19.112.1:1234`, creating a mismatch.

### External Service Connectivity Tests

- Direct connection to port 6280: `Connection reset by peer`
- LM Studio at configured IP (172.31.160.1:1234): `Network is unreachable`
- LM Studio at reported IP (172.19.112.1:1234): `Network is unreachable`

## Root Cause Analysis

Based on diagnostic analysis and research findings:

### Primary Issue: LM Studio Network Binding

1. **LM Studio Configuration**: LM Studio defaults to binding to `127.0.0.1` (localhost only)
2. **Docker Network Isolation**: Container cannot access localhost-bound services on host
3. **IP Mismatch**: docker-compose.yml maps `host.docker.internal` to `172.31.160.1` but LM Studio reports `172.19.112.1`

### Secondary Issue: Container Service Startup

1. **Database Connection**: Service fails to initialize database connection during startup
2. **Health Check Timing**: Health checks fail because service never fully starts
3. **Error Propagation**: Database timeout prevents HTTP server from starting

## Research Findings: LM Studio IP Assignment

Research confirms that:

- LM Studio defaults to `127.0.0.1` binding (inaccessible from containers)
- WSL2 IP addresses can change between restarts (though newer versions try to maintain consistency)
- Multiple solutions exist for reliable Docker-to-LM Studio connectivity

## Related Code

- **Affected Files**:
  - `.mcp-servers/docs-mcp/docker-compose.yml`
  - `.claude/statusline/statusline.sh` (lines 412-514)
  - `.claude/bin/docker-health-wrapper.sh`

- **Recent Changes**:
  - f9fcd492: fix(ci): resolve module resolution issues in @kit/shared package

- **Configuration**:
  - Environment: `OPENAI_API_BASE=http://host.docker.internal:1234/v1`
  - Health check: Node.js HTTP GET to `http://127.0.0.1:6280/`

## Related Issues & Context

### Direct Predecessors

No direct predecessors found in repository.

### Related Infrastructure Issues

No related infrastructure issues found in repository.

### Similar Symptoms

No similar symptoms found in current repository.

### Historical Context

This appears to be the first documented instance of docs-mcp connectivity issues in this repository.

## Recommended Solutions

### Solution 1: Configure LM Studio for Network Access (Preferred)

1. **Enable network binding in LM Studio**:
   - UI Method: Settings → Enable "Server on Local Network"
   - Config Method: Edit `%userprofile%\.cache\lm-studio\.internal\http-server-config.json`

     ```json
     {
       "networkInterface": "0.0.0.0",
       "port": 1234
     }
     ```

2. **Update docker-compose.yml for dynamic IP resolution**:

   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"  # Dynamic resolution
   ```

### Solution 2: Alternative Network Configuration

If LM Studio must remain on localhost, implement Windows port proxy:

```cmd
netsh interface portproxy add v4tov4 listenport=1234 listenaddress=0.0.0.0 connectport=1234 connectaddress=127.0.0.1
```

### Solution 3: WSL2 Mirrored Networking (Windows 11 22H2+)

Add to `C:\Users\[username]\.wslconfig`:

```ini
[wsl2]
networkingMode=mirrored

[experimental]
hostAddressLoopback=true
```

## Immediate Action Plan

1. **Configure LM Studio for network access** (0.0.0.0 binding)
2. **Update docker-compose.yml** to use `host-gateway`
3. **Restart containers** to test connectivity
4. **Verify health checks** pass consistently
5. **Monitor statusline** for green Docker status

## Initial Analysis

This is a classic Docker-to-host connectivity issue in WSL2 environments. The primary cause is LM Studio's default localhost-only binding combined with dynamic IP assignment in WSL2. The solution requires both LM Studio network configuration and Docker Compose adjustments for reliable connectivity.

## Additional Context

- **Security Consideration**: Binding LM Studio to 0.0.0.0 makes it accessible on local network
- **Alternative**: Use Windows Firewall to restrict access if needed
- **Monitoring**: Consider implementing connectivity verification in statusline script

---
*Generated by Claude Debug Assistant*
*Tools Used: Docker inspection, container logs, network diagnostics, research-agent*
*Research Source: LM Studio documentation, WSL2 networking patterns, Docker host connectivity*
