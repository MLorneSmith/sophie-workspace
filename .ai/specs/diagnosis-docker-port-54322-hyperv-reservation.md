# Bug Diagnosis: Docker Port 54322 Reserved by Windows Hyper-V

**ID**: ISSUE-[pending]
**Created**: 2025-11-21T12:30:00Z
**Reporter**: user
**Severity**: critical
**Status**: new
**Type**: bug

## Summary

Supabase Docker containers fail to start because port 54322 (PostgreSQL) is reserved by Windows Hyper-V dynamic port allocation. The Docker Desktop error `/forwards/expose returned unexpected status: 500` indicates the port forwarding proxy cannot bind to the reserved port. This issue persists across Docker restarts because the reservation is at the Windows kernel level.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development (WSL2)
- **Node Version**: v22.16.0
- **Docker Version**: 29.0.1
- **Platform**: Linux 6.6.87.2-microsoft-standard-WSL2
- **Last Working**: Unknown

## Reproduction Steps

1. Run `pnpm supabase:web:start` or `/docker-fix`
2. Docker attempts to start Supabase database container
3. Container creation fails with port binding error
4. Error: `ports are not available: exposing port TCP 0.0.0.0:54322 -> 127.0.0.1:0: /forwards/expose returned unexpected status: 500`
5. Restarting Docker Desktop does not resolve the issue

## Expected Behavior

Supabase containers should start with PostgreSQL bound to port 54322.

## Actual Behavior

Container creation fails with HTTP 500 error from Docker's port forwarding proxy.

## Diagnostic Data

### Console Output
```
Starting database...
Stopping containers...
failed to start docker container: Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:54322 -> 127.0.0.1:0: /forwards/expose returned unexpected status: 500
```

### Network Analysis
```
Port 54322 is within the Windows TCP port exclusion range 54265-54364.

Protocol tcp Port Exclusion Ranges:

Start Port    End Port
----------    --------
     54265       54364      ← Port 54322 falls here!
```

### Database Analysis
N/A - Cannot connect to database due to port binding failure

### Performance Metrics
N/A - Infrastructure cannot start

## Error Stack Traces
```
Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:54322 -> 127.0.0.1:0: /forwards/expose returned unexpected status: 500
```

## Related Code
- **Affected Files**:
  - Supabase CLI configuration (port assignments)
  - Docker Desktop vpnkit port forwarding proxy (external)
  - Windows Hyper-V dynamic port allocation (OS level)
- **Recent Changes**: None - this is a system configuration issue
- **Suspected Functions**: Windows TCP dynamic port allocation conflicts with Hyper-V

## Related Issues & Context

### Direct Predecessors
- #665 (CLOSED): "Bug Diagnosis: Supabase Docker Port Binding Failure in WSL2" - Same symptom but different root cause (vpnkit sync issue vs port reservation)
- #666 (CLOSED): "Bug Fix: Supabase Docker Port Binding Failure in WSL2" - Implemented port binding verifier but doesn't address port reservation

### Similar Symptoms
- docker/for-win#14712: "Ports not available after upgrade"
- docker/for-win#5306: "Huge amount of ports reserved"

### Historical Context
The previous issues (#665, #666) diagnosed and fixed vpnkit synchronization failures, but did not address Windows Hyper-V dynamic port reservations. This is a different root cause for the same symptom.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Windows Hyper-V reserves port 54322 in its dynamic TCP port range, preventing Docker from binding to it.

**Detailed Explanation**:

Windows dynamically reserves TCP port ranges for Hyper-V and WSL2 networking. The default dynamic port range starts at 49152, and Hyper-V reserves blocks of 100 ports from this range. Port 54322 falls within the reserved range 54265-54364.

When Docker's vpnkit port forwarding proxy attempts to bind to port 54322, it receives a "port in use" error from the Windows networking stack. The proxy returns HTTP 500 because it cannot establish the binding. This error persists across Docker restarts because:

1. Port reservations are at the Windows kernel level
2. Reservations are created at boot by Hyper-V HNS (Host Networking Service)
3. Docker has no control over Windows port reservations

**Supporting Evidence**:

1. `netsh int ipv4 show excludedportrange protocol=tcp` shows port 54322 in range 54265-54364
2. No process is listening on port 54322 (`lsof -i :54322` returns empty)
3. Docker containers not using the port (`docker ps -a` shows no Supabase containers)
4. Issue persists across Docker Desktop restarts

### How This Causes the Observed Behavior

1. User runs `supabase start`
2. Supabase CLI pulls and creates Docker containers
3. When creating the PostgreSQL container, Supabase CLI specifies `-p 54322:5432`
4. Docker asks vpnkit to forward host port 54322 to container port 5432
5. vpnkit calls Windows networking APIs to bind to 54322
6. Windows rejects the bind because 54322 is in Hyper-V reserved range
7. vpnkit returns HTTP 500 to Docker daemon
8. Docker returns the error: `/forwards/expose returned unexpected status: 500`
9. Container creation fails

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct evidence from `netsh` showing port 54322 in reserved range
- Error message specifically indicates port forwarding failure
- Issue persists across Docker restarts (rules out transient vpnkit issues)
- Matches known Hyper-V port reservation behavior documented in multiple GitHub issues

## Fix Approach (High-Level)

Two approaches to fix this:

**Option 1: Reset Windows Dynamic Port Range** (Recommended)
- Change the Windows dynamic TCP port start to avoid Supabase ports
- Run as Administrator: `netsh int ipv4 set dynamic tcp start=55001 num=10000`
- Reboot Windows to apply

**Option 2: Change Supabase Ports** (Alternative)
- Configure Supabase to use different ports (e.g., 54400 range)
- Requires updating all dependent configurations

Option 1 is recommended because it fixes the root cause without requiring application changes.

## Diagnosis Determination

This is a Windows system configuration issue, not a Docker or Supabase bug. Windows Hyper-V dynamically reserves port ranges that conflict with Supabase's default ports. The solution requires either:
1. Changing the Windows port reservation behavior (recommended)
2. Changing the application port configuration

The previous fix (#666) implemented port binding verification which would catch this issue earlier and provide better error messages, but it cannot resolve the underlying port reservation conflict.

## Additional Context

### Windows Port Reservation Commands

```powershell
# View current reservations
netsh int ipv4 show excludedportrange protocol=tcp

# Set dynamic port range to avoid Supabase ports (requires reboot)
netsh int ipv4 set dynamic tcp start=55001 num=10000

# Delete specific reservation (if possible)
netsh int ipv4 delete excludedportrange protocol=tcp startport=54265 numberofports=100
```

### Related GitHub Issues
- [docker/for-win#14712](https://github.com/docker/for-win/issues/14712) - Ports not available after upgrade
- [docker/for-win#5306](https://github.com/docker/for-win/issues/5306) - Huge amount of ports reserved
- [microsoft/WSL#5306](https://github.com/microsoft/WSL/issues/5306) - Port reservation conflicts

### Prevention
- Monitor port exclusions before starting Supabase
- Add pre-flight check for port availability in Supabase CLI
- Consider using port ranges above 55000 for development tools

---
*Generated by Claude Debug Assistant*
*Tools Used: netsh, docker inspect, gh issue list, perplexity-expert research agent*
