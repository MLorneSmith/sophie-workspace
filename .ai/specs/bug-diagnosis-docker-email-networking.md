# Bug Diagnosis: Test Container Cannot Reach SMTP Server at 127.0.0.1:54525

**ID**: ISSUE-727
**Created**: 2025-11-27T14:45:00Z
**Reporter**: system (during #726 implementation)
**Severity**: medium
**Status**: new
**Type**: integration

## Summary

The test container (`slideheroes-app-test`) cannot connect to the Supabase Inbucket SMTP server because it's configured to use `EMAIL_HOST=127.0.0.1:54525`, which resolves to the container's own localhost, not the host machine where Inbucket is running. This blocks all email-related E2E tests.

## Environment

- **Application Version**: 2.13.1
- **Environment**: test (Docker)
- **Node Version**: 22-slim
- **Docker Networks**: `slideheroes-test` (app), `supabase_network_2025slideheroes-db` (Supabase)
- **Last Working**: Never (configuration issue)

## Reproduction Steps

1. Start test environment with `docker compose -f docker-compose.test.yml up -d`
2. Start Supabase with `pnpm supabase:web:start`
3. Run E2E test that sends email (e.g., team invitations test)
4. Observe SMTP connection refused error

## Expected Behavior

The test container should successfully send emails to Supabase Inbucket at port 54525.

## Actual Behavior

Container fails with `ECONNREFUSED 127.0.0.1:54525` because:
- `127.0.0.1` inside the container resolves to the container itself
- Supabase Inbucket is running on the host, not inside the container

## Diagnostic Data

### Console Output
```
{"level":50,"error":{"message":"connect ECONNREFUSED 127.0.0.1:54525","errno":-111,"code":"ESOCKET","syscall":"connect","address":"127.0.0.1","port":54525},"msg":"Failed to send invitation email"}
```

### Network Analysis

**Container network configuration:**
- App container: `slideheroes-test` network (bridge)
- Supabase containers: `supabase_network_2025slideheroes-db` network (bridge)
- App has `extra_hosts: ["host.docker.internal:host-gateway"]` configured

**Inbucket port mappings:**
- Internal port 1025 (SMTP) -> Host port 54525
- Internal port 8025 (API) -> Host port 54524

**Container can reach host via:**
- `host.docker.internal` -> 192.168.65.254 (configured in /etc/hosts)

### Configuration Analysis

**`.env.test` (line 22-23):**
```
EMAIL_PORT=54525
EMAIL_HOST=127.0.0.1
```

**`docker-compose.test.yml`:**
- Does NOT override EMAIL_HOST/EMAIL_PORT environment variables
- Other services (Supabase, DB) correctly use `host.docker.internal`

## Error Stack Traces
```
Error: connect ECONNREFUSED 127.0.0.1:54525
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1637:16)
    at TCPConnectWrap.callbackTrampoline (node:internal/async_hooks:130:17)
errno: -111
code: ESOCKET
syscall: connect
address: 127.0.0.1
port: 54525
```

## Related Code
- **Affected Files**:
  - `apps/web/.env.test` - EMAIL_HOST=127.0.0.1 (incorrect for Docker)
  - `docker-compose.test.yml` - Missing EMAIL_HOST/EMAIL_PORT overrides
- **Recent Changes**: None - this has always been misconfigured
- **Suspected Functions**: N/A - configuration issue, not code

## Related Issues & Context

### Direct Predecessors
- #726 (CLOSED): "Bug Fix: Invitation Emails Not Sent" - This issue blocked E2E validation of that fix

### Related Infrastructure Issues
None found.

### Historical Context
This is a configuration oversight. Other services (Supabase, Database) correctly use `host.docker.internal` but EMAIL_HOST was left as `127.0.0.1`.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `docker-compose.test.yml` does not override EMAIL_HOST, so the container reads `EMAIL_HOST=127.0.0.1` from `.env.test`, which resolves to the container's own loopback interface instead of the host machine where Supabase Inbucket is running.

**Detailed Explanation**:
Docker containers have network isolation. When a container tries to connect to `127.0.0.1`, it connects to itself, not the host machine. The test configuration correctly uses `host.docker.internal` for Supabase URL and Database URL (lines 28, 33 of docker-compose.test.yml) but fails to override the email configuration. The `.env.test` file has `EMAIL_HOST=127.0.0.1` which works when running the app directly on the host but fails inside a Docker container.

**Supporting Evidence**:
- Error log: `connect ECONNREFUSED 127.0.0.1:54525`
- Container /etc/hosts shows `host.docker.internal` maps to `192.168.65.254` (host)
- Inbucket container is at `172.18.0.7` on `supabase_network_2025slideheroes-db`
- `docker-compose.test.yml` has NO EMAIL_HOST/EMAIL_PORT environment variables

### How This Causes the Observed Behavior

1. Test container starts and reads `.env.test` (mounted via volume)
2. `EMAIL_HOST=127.0.0.1` is loaded (not overridden by docker-compose)
3. When email dispatch runs, nodemailer connects to `127.0.0.1:54525`
4. Container's loopback has nothing listening on port 54525
5. Connection refused error occurs

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message explicitly shows the address/port being used (`127.0.0.1:54525`)
- The pattern is identical to how other services were configured (they use `host.docker.internal`)
- The fix is straightforward and follows the existing pattern

## Fix Approach (High-Level)

Add EMAIL_HOST and EMAIL_PORT environment variable overrides to `docker-compose.test.yml`:

```yaml
environment:
  # ... existing vars ...
  - EMAIL_HOST=host.docker.internal
  - EMAIL_PORT=54525
```

This follows the same pattern used for NEXT_PUBLIC_SUPABASE_URL and DATABASE_URL.

## Diagnosis Determination

**Root cause confirmed**: Missing environment variable overrides in docker-compose.test.yml for email configuration. The fix is a simple 2-line addition to the docker-compose file, following the existing pattern for other host services.

## Additional Context

The app container was recently connected to the Supabase network (during #726 debugging), which means an alternative fix would be to use the Inbucket container's internal address (`172.18.0.7:1025` or `supabase_inbucket_2025slideheroes-db:1025`). However, the cleaner solution is to use `host.docker.internal` to match the pattern used for other services.

---
*Generated by Claude Debug Assistant*
*Tools Used: docker inspect, docker network inspect, git log, file reads*
