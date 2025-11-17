# Bug Diagnosis: Docker Component in Statusline Showing 'none'

**ID**: ISSUE-613
**Created**: 2025-11-17T17:30:00Z
**Reporter**: msmith
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The Claude Code statusline docker component is displaying 'none' instead of showing the actual Docker container status. Docker is running with 16 healthy containers, but the statusline cannot detect them because the required `docker-health-wrapper.sh` script was moved to `.old.claude/bin/` during repository archiving (commit 752dcccd2), breaking the docker monitoring integration.

## Environment

- **Application Version**: Claude Code (latest)
- **Environment**: development
- **OS**: Linux (WSL2) - Linux 6.6.87.2-microsoft-standard-WSL2
- **Platform**: linux
- **Git Branch**: dev
- **Last Commit**: 236373c61 docs(tooling): add bug diagnosis and implementation specs
- **Docker Containers**: 16 running (all healthy)
- **Last Working**: Before commit 752dcccd2 (2025-11-15) - "chore(tooling): archive legacy .claude directory files"

## Reproduction Steps

1. Start Claude Code in the project directory
2. Ensure Docker is running with containers (`docker ps` shows 16 containers)
3. Observe the statusline in Claude Code
4. Notice the docker component displays "⚪ docker:none" instead of "🟢 docker (16/16)"
5. Check for the docker-health-wrapper.sh script at `.claude/bin/docker-health-wrapper.sh`
6. Script is missing (returns "No such file or directory")

## Expected Behavior

The docker component should display:

- "🟢 docker (16/16)" - when all containers are healthy
- "🟡 docker (X/Y)" - when some containers have unknown status
- "🔴 docker (X/Y)" - when some containers are unhealthy
- "🔴 docker:off" - when Docker daemon is not running
- "⟳ docker" - when initial health check is running

The status should update automatically every 5 minutes or when triggered manually.

## Actual Behavior

The docker component shows "⚪ docker:none" which indicates the docker-health-wrapper.sh script is not found at the expected location (`.claude/bin/docker-health-wrapper.sh`).

From the statusline.sh code (line 440):

```bash
else
    docker_status="⚪ docker:none"
fi
```

This fallback is triggered when the docker-health-wrapper.sh script is not executable at the expected path.

## Diagnostic Data

### Docker Container Status

```
$ docker ps --format "{{.Names}}\t{{.Status}}"

docs-mcp-server Up 52 minutes (healthy)
supabase_studio_2025slideheroes-db Up 52 minutes (healthy)
supabase_pg_meta_2025slideheroes-db Up 52 minutes (healthy)
supabase_edge_runtime_2025slideheroes-db Up 49 minutes
supabase_storage_2025slideheroes-db Up 52 minutes (healthy)
supabase_rest_2025slideheroes-db Up 52 minutes
supabase_realtime_2025slideheroes-db Up 52 minutes (healthy)
supabase_inbucket_2025slideheroes-db Up 52 minutes (healthy)
supabase_auth_2025slideheroes-db Up 51 minutes (healthy)
supabase_kong_2025slideheroes-db Up 49 minutes (healthy)
supabase_vector_2025slideheroes-db Up 49 minutes (healthy)
supabase_analytics_2025slideheroes-db Up 52 minutes (healthy)
supabase_db_2025slideheroes-db Up 52 minutes (healthy)
slideheroes-payload-test Up 50 minutes (healthy)
slideheroes-app-test Up 50 minutes (healthy)
ccmp-dashboard Up 52 minutes (healthy)
```

**Result**: Docker is running with 16 containers, all healthy. Docker daemon is operational.

### Missing Docker Health Wrapper Script

```
$ ls -la .claude/bin/docker-health-wrapper.sh
".claude/bin/docker-health-wrapper.sh": No such file or directory (os error 2)
```

**Result**: Script is missing from expected location.

### Git History Analysis

```
$ git log --all --full-history --oneline --name-status -- "*docker-health-wrapper.sh"

752dcccd2 chore(tooling): archive legacy .claude directory files
R100 .claude/bin/docker-health-wrapper.sh .old.claude/bin/docker-health-wrapper.sh
```

**Result**: The script was **moved (renamed)** from `.claude/bin/` to `.old.claude/bin/` in commit 752dcccd2 with a 100% rename detection confidence (R100).

### Verification of Script in Archive Location

```
$ ls -la .old.claude/bin/docker-health-wrapper.sh
.rwxr-xr-x 18k msmith 15 Nov 11:39 .old.claude/bin/docker-health-wrapper.sh
```

**Result**: Script exists in archive location with correct execute permissions (755).

### Docker Status File Check

```
$ GIT_ROOT=$(git rev-parse --show-toplevel)
$ GIT_ROOT_HASH="$(echo "${GIT_ROOT}" | sha256sum | cut -d' ' -f1 | head -c16)"
$ ls -la "/tmp/.claude_docker_status_${GIT_ROOT_HASH}"

"/tmp/.claude_docker_status_baeae0fd06681005": No such file or directory
```

**Result**: No status file exists because the wrapper script has never run (it's missing).

### Statusline Script Logic (lines 435-441)

```bash
elif [ -x "${GIT_ROOT}/.claude/bin/docker-health-wrapper.sh" ]; then
    # Trigger initial health check
    "${GIT_ROOT}/.claude/bin/docker-health-wrapper.sh" health-check >/dev/null 2>&1 &
    docker_status="⟳ docker"
else
    docker_status="⚪ docker:none"
fi
```

**Analysis**: The statusline checks if `.claude/bin/docker-health-wrapper.sh` is executable (`-x` test). When not found, it falls back to "⚪ docker:none".

## Related Code

- **Affected Files**:
  - `.claude/statusline/statusline.sh` (lines 339-441) - Docker status detection logic
  - `.claude/bin/docker-health-wrapper.sh` - **MISSING** (moved to archive)
  - `.old.claude/bin/docker-health-wrapper.sh` - Original script in archive location

- **Recent Changes**:
  - `752dcccd2` - **chore(tooling): archive legacy .claude directory files** - MOVED docker-health-wrapper.sh to archive
  - `236373c61` - docs(tooling): add bug diagnosis and implementation specs
  - `fca093f33` - feat(tooling): add codecheck and test commands with improved diagnostics
  - `2414b169c` - fix(tooling): enable Claude Code statusline with configuration

- **Suspected Functions**: None (missing file issue, not code issue)

## Related Issues & Context

### Direct Predecessors

- #604 (CLOSED): "Bug Diagnosis: Claude Code Statusline Not Appearing" - Previous statusline configuration issue (missing execute permissions and settings.json config)
- #611 (CLOSED): "Bug Fix: Claude Code Statusline Not Appearing" - Fixed statusline configuration, but did NOT address docker-health-wrapper being missing

### Related Infrastructure Issues

- #440 (CLOSED): "Docker-health component in Claude Code statusline not refreshing" - Previous docker-health refresh issue, shows docker component was working before
- #416 (CLOSED): "Feature: docker-health - Real-time Docker container monitoring in statusline" - Original docker-health implementation

### Similar Symptoms

- None found - this is a unique issue caused by file archiving

### Historical Context

The docker-health monitoring system was fully implemented and working (evidenced by issues #440, #416, #418, #419, #420, #424, #436). The system includes:

1. **docker-health-wrapper.sh** - Main wrapper script for health checks
2. **Multi-level caching** - L1, L2, L3 cache for performance
3. **Background monitoring** - Automatic health check updates
4. **Statusline integration** - Real-time status display

On 2025-11-15, commit `752dcccd2` ("chore(tooling): archive legacy .claude directory files") moved the entire `.claude/bin/docker-health-wrapper.sh` script to `.old.claude/bin/`. This was part of a larger reorganization that archived:

- Docker health monitoring scripts
- Docker health documentation
- Docker health implementation plans
- Docker health tracking files

The statusline.sh script was NOT updated to reflect the new location, causing the docker component to fail silently with "docker:none".

Issues #604 and #611 fixed the statusline appearing issue by adding execute permissions and configuration, but did NOT notice the docker-health-wrapper.sh was missing because:

1. The statusline still appeared (other components worked)
2. The docker component silently showed "none" (not an obvious error)
3. The fix focused on permissions/configuration, not missing files

## Root Cause Analysis

### Identified Root Cause

**Summary**: The docker component shows 'none' because the `docker-health-wrapper.sh` script was moved from `.claude/bin/` to `.old.claude/bin/` during repository archiving (commit 752dcccd2), breaking the statusline's docker health monitoring integration.

**Detailed Explanation**:

The statusline.sh script expects the docker-health-wrapper.sh to be located at:

```
${GIT_ROOT}/.claude/bin/docker-health-wrapper.sh
```

In commit `752dcccd2`, this file was moved (100% rename) to:

```
${GIT_ROOT}/.old.claude/bin/docker-health-wrapper.sh
```

The statusline.sh code (line 435) checks:

```bash
elif [ -x "${GIT_ROOT}/.claude/bin/docker-health-wrapper.sh" ]; then
```

When this test fails (file not found or not executable), it falls through to line 440:

```bash
else
    docker_status="⚪ docker:none"
fi
```

**Why this happened**:

1. **Repository cleanup/reorganization**: Commit 752dcccd2 archived "legacy" `.claude` directory files, including the docker-health monitoring system
2. **No path update**: The statusline.sh script was not updated to use the new archive location
3. **Silent failure**: The statusline displays "none" instead of an error, making the issue non-obvious
4. **Working statusline elsewhere**: Other components (build, test, codecheck, CI, PR) work fine, so the overall statusline appears functional

**Supporting Evidence**:

1. Git history shows explicit rename operation:

   ```
   752dcccd2 chore(tooling): archive legacy .claude directory files
   R100 .claude/bin/docker-health-wrapper.sh .old.claude/bin/docker-health-wrapper.sh
   ```

2. Script exists at archive location with correct permissions:

   ```
   .rwxr-xr-x 18k msmith 15 Nov 11:39 .old.claude/bin/docker-health-wrapper.sh
   ```

3. Docker is running and healthy (16 containers up), ruling out Docker daemon issues

4. No status file exists (`/tmp/.claude_docker_status_*`), confirming wrapper has never run

5. Statusline code explicitly shows "docker:none" when wrapper script not found (line 440)

### How This Causes the Observed Behavior

The causal chain is:

1. Commit 752dcccd2 moves docker-health-wrapper.sh to `.old.claude/bin/`
2. Statusline.sh executes and reaches docker status check (line 342)
3. Status file check fails (no file exists at `/tmp/.claude_docker_status_*`) - line 347
4. Script checks if docker-health-wrapper.sh is executable at `.claude/bin/` - line 435
5. Test fails (file not found at expected location)
6. Code falls through to else block - line 439
7. Sets `docker_status="⚪ docker:none"` - line 440
8. Statusline displays "⚪ docker:none" to user
9. Docker health check never runs (wrapper script never executed)
10. No status file is ever created (no background monitoring)

### Confidence Level

**Confidence**: High

**Reasoning**:

1. **Verified file location**: Git history definitively shows file was moved from `.claude/bin/` to `.old.claude/bin/`
2. **Confirmed missing at expected location**: Direct check shows file doesn't exist at `.claude/bin/docker-health-wrapper.sh`
3. **Confirmed exists at archive location**: File exists with correct permissions at `.old.claude/bin/docker-health-wrapper.sh`
4. **Code logic is clear**: Statusline.sh explicitly shows "docker:none" when wrapper not found (line 440)
5. **Docker is healthy**: 16 containers running and healthy, ruling out Docker daemon issues
6. **No status file exists**: Confirms wrapper has never run (would create status file on first run)
7. **Reproducible**: Issue appears consistently because file is persistently missing

This is definitively the root cause - the docker-health-wrapper.sh script is missing from its expected location due to being archived, causing the statusline to show "none".

## Fix Approach (High-Level)

**Two possible approaches**:

1. **Restore from archive** (RECOMMENDED): Copy `.old.claude/bin/docker-health-wrapper.sh` back to `.claude/bin/docker-health-wrapper.sh`
   - Restores working docker health monitoring
   - No code changes needed
   - Maintains existing functionality

2. **Update statusline path**: Modify `.claude/statusline/statusline.sh` to point to `.old.claude/bin/docker-health-wrapper.sh`
   - Keeps files in archive location
   - Requires code change (line 435)
   - Less intuitive (active script in "old" directory)

**Recommended: Approach 1** - Restore the script to `.claude/bin/` because:

- The `.claude/bin/` directory is the standard location for active Claude Code scripts
- Other active scripts are in `.claude/` (statusline, commands, hooks)
- The `.old.claude/` directory should only contain archived/legacy files
- Restoring maintains consistency with existing architecture
- No code changes required (less risk)

**Implementation**:

```bash
# Copy script from archive back to active location
cp .old.claude/bin/docker-health-wrapper.sh .claude/bin/docker-health-wrapper.sh

# Ensure execute permissions
chmod +x .claude/bin/docker-health-wrapper.sh

# Verify permissions
ls -la .claude/bin/docker-health-wrapper.sh

# Test script execution
.claude/bin/docker-health-wrapper.sh health-check

# Verify status file created
ls -la /tmp/.claude_docker_status_*

# Restart Claude Code to see updated statusline
```

After fix, the statusline should display "🟢 docker (16/16)" or similar based on actual container health.

## Diagnosis Determination

**Root cause definitively identified**: The docker component displays 'none' because the `docker-health-wrapper.sh` script was moved to the archive directory (`.old.claude/bin/`) during commit 752dcccd2, and the statusline.sh script still expects it at the original location (`.claude/bin/`).

**Evidence summary**:

- Git history shows file was explicitly moved (R100 rename)
- File missing at expected location (`.claude/bin/docker-health-wrapper.sh`)
- File exists at archive location (`.old.claude/bin/docker-health-wrapper.sh`)
- Statusline code shows "docker:none" when script not found (line 440)
- Docker is healthy (16 containers up), ruling out Docker issues
- No status file exists, confirming wrapper never ran

**Fix is straightforward**: Restore the docker-health-wrapper.sh script from `.old.claude/bin/` back to `.claude/bin/` to re-enable docker health monitoring in the statusline.

## Additional Context

### Related Files to Restore (Optional)

The archiving commit moved several docker-health related files. Consider whether to restore:

**Essential (required for basic functionality)**:

- `.claude/bin/docker-health-wrapper.sh` - Main wrapper script (REQUIRED)

**Optional (for advanced features)**:

- `.claude/bin/docker-health-background.sh` - Background monitoring daemon
- `.claude/bin/docker-health-integration.sh` - Integration with other systems
- `.claude/bin/docker-health-unit-tests.sh` - Unit tests for docker-health

**Recommendation**: Start by restoring only the wrapper script to verify basic functionality. Restore additional scripts only if needed for specific features.

### Verification Steps

After restoring the docker-health-wrapper.sh:

1. **Verify file location**: `ls -la .claude/bin/docker-health-wrapper.sh`
2. **Verify permissions**: Should show `-rwxr-xr-x` (755)
3. **Test execution**: `.claude/bin/docker-health-wrapper.sh health-check`
4. **Check status file**: `ls -la /tmp/.claude_docker_status_*` (should exist after test)
5. **Read status file**: `cat /tmp/.claude_docker_status_*` (should show JSON with docker info)
6. **Test statusline**: Manually trigger statusline update
7. **Verify display**: Docker component should show "🟢 docker (X/Y)" instead of "⚪ docker:none"
8. **Monitor updates**: Verify status updates automatically (check every 5 minutes)

### Archive Strategy Going Forward

To prevent similar issues in the future:

1. **Document active vs archived**: Clearly distinguish active scripts (`.claude/`) from archived/legacy (`.old.claude/`)
2. **Check dependencies before archiving**: Search for references to files before moving them
3. **Update dependent code**: If moving active files, update all references
4. **Test after archiving**: Verify all functionality still works after reorganization
5. **Consider git grep**: Use `git grep "docker-health-wrapper"` to find all references before moving

---
*Generated by Claude Debug Assistant*
*Tools Used: Bash (git, docker, ls, cat), Read, gh, TodoWrite*
