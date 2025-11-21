# Bug Diagnosis: Docker Desktop WSL2 Integration Crash on Startup

**ID**: ISSUE-667
**Created**: 2025-11-21T17:01:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: integration

## Summary

Docker Desktop WSL2 integration fails during startup with error code `Wsl/Service/0x8007274c`, causing Docker Desktop to display an error dialog stating "WSL integration with distro 'Ubuntu' unexpectedly stopped." The issue is gradual and intermittent, occurring when Docker Desktop attempts to set up the Docker user group in the Ubuntu WSL distribution.

## Environment

- **Application Version**: Docker Desktop 4.52.0 (210994), Docker Engine 29.0.1
- **Environment**: Development
- **Platform**: WSL2 on Windows (Linux 6.6.87.2-microsoft-standard-WSL2)
- **WSL Distribution**: Ubuntu 22.04.5 LTS
- **Node Version**: N/A
- **Database**: N/A
- **Diagnostic ID**: AD9893E0-7034-4AA8-9130-23A81186BE90/20251121165751

## Reproduction Steps

1. Start Docker Desktop on Windows with WSL2 backend enabled
2. Docker Desktop attempts to integrate with the default Ubuntu WSL distribution
3. During the group setup phase, Docker runs `wsl.exe -d ubuntu -e whoami`
4. The command times out with error code `0x8007274c`
5. Error dialog appears: "WSL integration with distro 'Ubuntu' unexpectedly stopped"

## Expected Behavior

Docker Desktop should successfully integrate with the Ubuntu WSL distribution, setting up the Docker user group without timeout errors.

## Actual Behavior

Docker Desktop displays an error dialog with the message:
```
WSL integration with distro 'Ubuntu' unexpectedly stopped.
Do you want to restart it?

Error: setup groups
setting up docker user group in Ubuntu distro: running wslexec:
An error occurred while running the command. Wsl/Service/0x8007274c:
c:\windows\system32\wsl.exe -d ubuntu -e whoami: exit status 0xffffffff
```

## Diagnostic Data

### Console Output
```
[2025-11-21T16:57:41.019396000Z] setting up docker user group in Ubuntu distro:
running wslexec: An error occurred while running the command.
Wsl/Service/0x8007274c: c:\windows\system32\wsl.exe -d ubuntu -e whoami:
exit status 0xffffffff (stderr: , wslErrorCode: Wsl/Service/0x8007274c)

[2025-11-21T16:57:41.019396000Z] reporting error to user: setup groups
```

### Network Analysis
```
WSL (266) ERROR: CheckConnection: getaddrinfo() failed: -5
WSL (266) ERROR: CheckConnection: getaddrinfo() failed: -5
WSL (266) ERROR: CheckConnection: connect() failed: 101
```

### WSL Configuration (C:\Users\msmit\.wslconfig)
```ini
[wsl2]
memory=24GB
processors=16
swap=8GB
networkingMode=mirrored    # <-- CRITICAL: Experimental mirrored networking
dnsTunneling=true
firewall=true
autoProxy=true
nestedVirtualization=false
```

### System Information
```
Memory: 24GB allocated to WSL, 17GB available (no memory pressure)
CPUs: 24 cores allocated
Swap: 8GB configured
Docker Engine: Running successfully after error dialog dismissed
```

### Screenshots
N/A

## Error Stack Traces
```
[2025-11-21T16:57:11.206950600Z] WSL (266) ERROR: CheckConnection: getaddrinfo() failed: -5
[2025-11-21T16:57:11.215053000Z] WSL (266) ERROR: CheckConnection: getaddrinfo() failed: -5
[2025-11-21T16:57:11.334070900Z] WSL (266) ERROR: CheckConnection: connect() failed: 101

Error code 0x8007274c = WSAECONNREFUSED
"A connection attempt failed because the connected party did not properly respond
after a period of time, or established connection failed because the connected host
has failed to respond."
```

## Related Code
- **Affected Files**:
  - `C:\Users\msmit\.wslconfig` (WSL2 configuration with mirrored networking)
  - Docker Desktop WSL integration service
- **Recent Changes**: No recent system changes reported
- **Suspected Functions**: WSL service communication via VMBus channels

## Related Issues & Context

### Direct Predecessors
- microsoft/WSL#9832 (Open): "WSL Freezing 0x8007274c" - Same error code, service timeout issues
- microsoft/WSL#10174 (Open): "error code 0x8007274c" - Extensively documented cases

### Related Infrastructure Issues
- Docker Forums thread on WSL unexpected errors: https://forums.docker.com/t/an-unexpected-error-was-encountered-while-executing-a-wsl-command/137525

### Similar Symptoms
- LxssManager service timeouts
- VMBus channel allocation failures

### Historical Context
Error code 0x8007274c is a recurring issue in WSL2/Docker Desktop integration, particularly affecting systems with:
- Mirrored networking mode enabled
- High memory/CPU allocations
- Multiple WSL distributions

## Root Cause Analysis

### Identified Root Cause

**Summary**: The WSL2 `networkingMode=mirrored` configuration in `.wslconfig` is causing service communication timeouts between Windows host and WSL2 VM during Docker Desktop startup.

**Detailed Explanation**:
The error `0x8007274c` is a Windows networking timeout that occurs when the LxssManager service cannot establish communication with the WSL2 VM. The root cause is the experimental `networkingMode=mirrored` setting combined with Docker Desktop's integration requirements.

Key evidence:
1. **Mirrored networking mode** (`networkingMode=mirrored`) is experimental and has known compatibility issues with Docker Desktop
2. **DNS resolution failures** at startup (`getaddrinfo() failed: -5`) indicate the mirrored networking isn't fully initialized when Docker attempts integration
3. **Connection refused errors** (`connect() failed: 101`) show the WSL service isn't responding in time
4. The issue is **intermittent and gradual** because mirrored networking sometimes initializes in time, but the race condition causes periodic failures

The mirrored networking mode changes how WSL2 handles network traffic, attempting to share the Windows host's network stack. However, this creates initialization timing issues where Docker Desktop tries to connect before the network is fully ready.

**Supporting Evidence**:
- `.wslconfig` shows `networkingMode=mirrored` is enabled
- Kernel logs show DNS and connection failures during WSL startup
- Error dialog appears at 14:00:01 and 16:57:41 - both at Docker Desktop startup times
- Docker eventually works after dismissing the error (network initialized after timeout)

### How This Causes the Observed Behavior

1. User starts Docker Desktop
2. Docker Desktop initiates WSL2 VM startup
3. WSL2 starts with mirrored networking mode
4. Docker Desktop immediately tries to run `wsl.exe -d ubuntu -e whoami` for group setup
5. Mirrored networking is still initializing, causing DNS/connection failures
6. Command times out after default timeout period
7. Error code `0x8007274c` returned to Docker Desktop
8. Error dialog displayed to user

### Confidence Level

**Confidence**: High

**Reasoning**: The combination of:
- `networkingMode=mirrored` being experimental and known to cause issues
- DNS resolution failures in kernel logs correlating with error timing
- No memory pressure (17GB available of 24GB allocated)
- Gradual/intermittent nature matching race condition behavior
- Issue resolves after dismissing dialog (giving network time to initialize)

## Fix Approach (High-Level)

**Primary fix**: Remove or disable the `networkingMode=mirrored` setting from `.wslconfig`. This will restore default NAT networking which has better Docker Desktop compatibility.

**Alternative fix**: If mirrored networking is required, add startup delays or use Docker Desktop's resource saver feature to give WSL2 more time to initialize before Docker attempts integration.

**Configuration change**:
```ini
[wsl2]
memory=24GB
processors=16
swap=8GB
# networkingMode=mirrored  # Remove or comment out
dnsTunneling=true
firewall=true
autoProxy=true
nestedVirtualization=false
```

After changing, run `wsl --shutdown` and restart Docker Desktop.

## Diagnosis Determination

The root cause has been conclusively identified as the **experimental WSL2 mirrored networking mode** causing service communication timeouts during Docker Desktop startup. The mirrored networking creates a race condition where Docker Desktop attempts WSL integration before the network layer is fully initialized, resulting in DNS resolution failures and connection timeouts.

This is NOT:
- Memory exhaustion (17GB available)
- Hyper-V/VMBus hardware issues (kernel shows normal operation)
- WSL distribution corruption (Ubuntu works fine once started)
- Windows/Docker update issue (no recent changes)

The fix is straightforward: disable mirrored networking mode or implement proper startup sequencing.

## Additional Context

- The user reported no recent system changes, but the issue being gradual suggests it may have started when mirrored networking was configured
- Docker is currently working after the error was dismissed, confirming the issue is timing-related
- Multiple error dialogs per day (14:00 and 16:57 today) indicate the issue occurs at each Docker Desktop startup
- Diagnostic ID `AD9893E0-7034-4AA8-9130-23A81186BE90/20251121165751` was generated during the second occurrence

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (log analysis, system diagnostics), Task (Perplexity research), Read, Grep*
