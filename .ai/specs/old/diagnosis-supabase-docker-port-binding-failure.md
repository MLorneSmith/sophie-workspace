# Bug Diagnosis: Supabase Docker Port Binding Failure in WSL2

**ID**: ISSUE-2025-11-21-port-binding
**Created**: 2025-11-21T16:30:00Z
**Reporter**: system/test-controller
**Severity**: critical
**Status**: new
**Type**: bug

## Summary

Supabase containers start successfully and report healthy status, but Docker fails to bind container ports (54321, 54322, 54323) to the host in WSL2 environment. This causes all infrastructure health checks to fail with connection timeouts, preventing test execution.

## Environment

- **Application Version**: 56252cab7 (dev branch)
- **Environment**: development (WSL2)
- **Node Version**: v22.16.0
- **Docker Version**: 29.0.1, build eedd969
- **Platform**: Linux 6.6.87.2-microsoft-standard-WSL2
- **Database**: PostgreSQL 17 (Supabase local)
- **Last Working**: Unknown (intermittent issue)

## Reproduction Steps

1. Run `/test` command or `bash .ai/ai_scripts/testing/infrastructure/safe-test-runner.sh`
2. Test controller attempts infrastructure health checks
3. Health checks fail with "4/7 healthy" - specifically Supabase API check fails
4. Controller attempts to start Supabase via `npx supabase start`
5. Supabase containers start and show "healthy" status in Docker
6. Controller times out waiting for Supabase API at `http://127.0.0.1:54321`

## Expected Behavior

- Docker should bind container port 8000 to host port 54321
- `curl http://127.0.0.1:54321/rest/v1/` should return 200 or 401
- `docker ps` should show `0.0.0.0:54321->8000/tcp` for Kong container

## Actual Behavior

- Docker containers start and report healthy
- Port bindings are configured but NOT established
- `docker ps` shows `8000/tcp` without host mapping
- `docker port supabase_kong_*` returns empty
- `curl` to port 54321 returns connection refused (exit code 28)
- Multiple `SYN_SENT` connections accumulate waiting for response

## Diagnostic Data

### Console Output
```
[2025-11-21T14:13:11.959Z] INFO: ⚠️ Infrastructure needs setup (4/7 healthy)
[2025-11-21T14:13:11.959Z] INFO: 🚀 Setting up Supabase...
[2025-11-21T14:13:13.960Z] INFO: Starting Web Supabase...
[2025-11-21T14:13:13.961Z] INFO: ⏳ Waiting for Web Supabase startup (timeout: 120000ms)
[2025-11-21T14:15:15.186Z] ERROR: Failed to setup Web Supabase: Timeout waiting for Web Supabase startup after 121225ms (41 attempts)
```

### Network Analysis
```bash
# Port binding configuration exists but not established
$ docker inspect supabase_kong_2025slideheroes-db --format '{{json .HostConfig.PortBindings}}'
{
  "8000/tcp": [
    {
      "HostIp": "",
      "HostPort": "54321"
    }
  ]
}

# Actual port bindings are empty
$ docker inspect supabase_kong_2025slideheroes-db --format '{{json .NetworkSettings.Ports}}'
{
  "8000/tcp": []
}

# Docker ps shows no host mapping
$ docker ps --format "{{.Names}}\t{{.Ports}}" | grep kong
supabase_kong_2025slideheroes-db	8000/tcp

# Multiple SYN_SENT connections waiting
$ lsof -i :54321
COMMAND    PID   USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
supabase 47570 msmith    3u  IPv4 1236729      0t0  TCP localhost:44918->localhost:54321 (SYN_SENT)
```

### Container Status
```bash
$ docker ps -a --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}"
NAMES                                      STATUS
supabase_kong_2025slideheroes-db           Up 4 minutes (healthy)
supabase_db_2025slideheroes-db             Up 5 minutes (healthy)
# All 12 containers show healthy but ports not bound
```

## Error Stack Traces
```
Starting database...
Stopping containers...
failed to connect to postgres: failed to connect to `host=127.0.0.1 user=postgres database=postgres`: dial error (timeout: dial tcp 127.0.0.1:54322: i/o timeout)
```

## Related Code
- **Affected Files**:
  - `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs:175-200` (health checks)
  - `.ai/ai_scripts/testing/infrastructure/infrastructure-manager.cjs:611-700` (setupSupabase)
  - `apps/web/supabase/config.toml` (port configuration)
- **Recent Changes**: None relevant - this is a Docker/WSL2 infrastructure issue
- **Suspected Functions**: Docker Desktop port forwarding in WSL2

## Related Issues & Context

### Similar Symptoms
- Known Docker Desktop + WSL2 port binding issues
- Supabase CLI GitHub issues related to port forwarding

### Historical Context
This is a known class of issues with Docker Desktop in WSL2 where port bindings silently fail. The issue is intermittent and often resolves with Docker Desktop restart.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Docker Desktop's port forwarding proxy fails to establish host port bindings in WSL2, causing container ports to be unreachable from localhost despite healthy container status.

**Detailed Explanation**:
Docker Desktop in WSL2 uses a userland proxy to forward ports from containers to the host. When this proxy fails to initialize properly (often due to stale state, resource exhaustion, or WSL2 networking issues), the port binding configuration exists in container metadata (`HostConfig.PortBindings`) but the actual port mapping fails to establish (`NetworkSettings.Ports` shows empty arrays).

The Supabase CLI and test controller both wait for the API to respond on port 54321, but since the port isn't actually bound to the host, all connection attempts result in `SYN_SENT` states that eventually timeout.

**Supporting Evidence**:
- `docker inspect` shows `HostPort: "54321"` configured but `NetworkSettings.Ports["8000/tcp"]: []` empty
- `docker ps` shows `8000/tcp` without the expected `0.0.0.0:54321->8000/tcp` mapping
- Multiple curl processes stuck in `SYN_SENT` state trying to connect to unbound port
- All containers report healthy status - the issue is port forwarding, not container health

### How This Causes the Observed Behavior

1. Test controller starts infrastructure check
2. Health check attempts `curl http://127.0.0.1:54321/rest/v1/`
3. Port 54321 is not listening (Docker proxy failed to bind)
4. Connection times out → health check fails
5. Controller tries to start Supabase
6. Supabase CLI also waits for port 54321 → times out
7. Phase timeout (180s) exceeded → test execution aborted

### Confidence Level

**Confidence**: High

**Reasoning**:
- The evidence clearly shows the disconnect between configured port bindings and actual port state
- This is a well-documented class of issues with Docker Desktop in WSL2
- Container logs show no errors - the containers themselves are working correctly
- The port binding metadata confirms Docker received the correct configuration but failed to execute it

## Fix Approach (High-Level)

1. **Immediate fix**: Restart Docker Desktop to reset the port forwarding proxy
   - On Windows: Right-click Docker Desktop tray icon → Restart
   - Or: `wsl --shutdown` followed by restarting Docker Desktop

2. **Preventive measures**:
   - Add Docker Desktop restart to troubleshooting documentation
   - Consider adding a pre-flight check that verifies port bindings are actually established (not just configured)
   - Test controller could detect this specific failure mode and provide actionable guidance

3. **Alternative approach**: Use Docker's internal network to communicate between test runner and Supabase containers (avoids host port binding entirely)

## Diagnosis Determination

The root cause is definitively identified as a Docker Desktop port forwarding failure in WSL2. The port binding configuration is correct, but Docker's userland proxy fails to establish the actual port mappings. This is an infrastructure/environment issue, not a code bug. The fix is to restart Docker Desktop to reset the port forwarding subsystem.

## Additional Context

This issue is intermittent and related to the WSL2 + Docker Desktop architecture. The Docker containers themselves are functioning correctly (all health checks pass internally). The problem is specifically in the Docker Desktop layer that forwards ports from the Linux VM to the Windows host.

Common triggers for this issue:
- Long-running Docker Desktop sessions
- Previous unclean shutdown of containers
- WSL2 networking subsystem issues
- Resource pressure on the Docker VM

---
*Generated by Claude Debug Assistant*
*Tools Used: docker ps, docker inspect, docker port, docker logs, curl, lsof, netstat, supabase status, supabase start/stop*
