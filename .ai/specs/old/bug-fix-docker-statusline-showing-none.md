# Bug Fix: Docker Statusline Showing None

**Related Diagnosis**: #613
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: docker-health-wrapper.sh script was moved from `.claude/bin/` to `.old.claude/bin/` during repository cleanup (commit 752dcccd2), breaking statusline integration
- **Fix Approach**: Restore the docker-health-wrapper.sh script from archive to its expected location
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The Claude Code statusline docker component displays "⚪ docker:none" instead of showing actual Docker container status (e.g., "🟢 docker (16/16)"). This occurs because the required `docker-health-wrapper.sh` script was moved from `.claude/bin/` to `.old.claude/bin/` during a repository cleanup commit (752dcccd2), and the statusline.sh script still expects it at the original location.

For full details, see diagnosis issue #613.

### Solution Approaches Considered

#### Option 1: Restore Script from Archive ⭐ RECOMMENDED

**Description**: Copy `.old.claude/bin/docker-health-wrapper.sh` back to its expected location at `.claude/bin/docker-health-wrapper.sh`, maintaining all existing statusline code.

**Pros**:

- No code changes required - zero risk of introducing bugs
- Maintains architectural consistency (active scripts in `.claude/bin/`, archived in `.old.claude/`)
- Immediately fixes the issue with a simple file copy
- Preserves existing tested statusline integration logic
- Follows principle of least change
- Execute permissions already correct on archived file

**Cons**:

- Restores a file that was intentionally archived (may need to document why it's being unarchived)
- Could conflict with future cleanup efforts if not documented properly

**Risk Assessment**: low - Simple file copy operation with no code changes. The script already exists and works correctly (evidenced by git history showing it was fully functional before archiving).

**Complexity**: simple - Single file copy operation with verification steps.

#### Option 2: Update Statusline Path Reference

**Description**: Modify `.claude/statusline/statusline.sh` to reference the archived location `.old.claude/bin/docker-health-wrapper.sh` instead of expecting it in `.claude/bin/`.

**Pros**:

- Keeps archived files in archive location
- Explicit about using an archived/legacy script
- No file restoration needed

**Cons**:

- Requires code change to statusline.sh (line 435) - introduces modification risk
- Creates confusing architecture (active script referencing "old" directory)
- Violates separation of active vs archived files
- Makes it unclear which scripts are "live" vs "legacy"
- May cause confusion in future maintenance ("Why is statusline using .old.claude?")
- If other docker-health scripts are restored later, creates inconsistency

**Why Not Chosen**: This approach violates architectural principles by having active functionality depend on archived files. The `.old.claude/` directory should only contain truly deprecated files, not actively-used scripts. Additionally, modifying working code (statusline.sh) introduces unnecessary risk when a simpler no-code-change solution exists.

#### Option 3: Reimplement Docker Health Check

**Description**: Write new docker health monitoring functionality directly in statusline.sh, eliminating the dependency on docker-health-wrapper.sh.

**Why Not Chosen**: This is massive over-engineering for a simple missing file issue. The existing docker-health-wrapper.sh is fully functional, well-tested (evidenced by historical issues #440, #416, #418), and includes sophisticated features like multi-level caching, background monitoring, and comprehensive health checks. Reimplementing would:

- Take significantly more time (hours vs minutes)
- Introduce risk of bugs in new implementation
- Lose existing tested functionality
- Violate YAGNI and "if it ain't broke, don't fix it" principles

### Selected Solution: Restore Script from Archive

**Justification**: Restoring the script from archive is the optimal solution because it:

1. Requires zero code changes (minimal risk)
2. Follows architectural best practices (active scripts in `.claude/bin/`)
3. Preserves existing tested functionality
4. Takes minutes instead of hours
5. Maintains clear separation between active and archived files

The script was likely archived by mistake during cleanup, as it's still actively referenced by statusline.sh. The proper fix is to restore it to active use.

**Technical Approach**:

- Copy `.old.claude/bin/docker-health-wrapper.sh` to `.claude/bin/docker-health-wrapper.sh`
- Verify execute permissions (should already be 755 from archive)
- Test script execution to confirm functionality
- Verify status file creation in `/tmp/`
- Confirm statusline displays correct docker status

**Architecture Changes**: None - this restores the original architecture where active scripts reside in `.claude/bin/`.

**Migration Strategy**: Not needed - this is a simple file restoration with no data or schema changes.

## Implementation Plan

### Affected Files

No files require modification. This fix only involves restoring a missing file:

- `.claude/bin/docker-health-wrapper.sh` - **RESTORE FROM ARCHIVE** - Main docker health monitoring script expected by statusline.sh

### New Files

None - we're restoring an existing file, not creating a new one.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify current state and archive file integrity

Confirm the issue and verify the archived script is intact and functional.

- Verify docker-health-wrapper.sh is missing from expected location: `ls -la .claude/bin/docker-health-wrapper.sh` (should fail)
- Verify script exists in archive with correct permissions: `ls -la .old.claude/bin/docker-health-wrapper.sh` (should show -rwxr-xr-x)
- Verify .claude/bin directory exists: `ls -la .claude/bin/` (create if needed)
- Confirm Docker is running: `docker ps` (should show containers)

**Why this step first**: We need to confirm the diagnosis is accurate and the source file is available for restoration before proceeding.

#### Step 2: Restore docker-health-wrapper.sh from archive

Copy the script back to its expected location and verify integrity.

- Copy script from archive: `cp .old.claude/bin/docker-health-wrapper.sh .claude/bin/docker-health-wrapper.sh`
- Verify file was copied: `ls -la .claude/bin/docker-health-wrapper.sh`
- Confirm execute permissions: `chmod +x .claude/bin/docker-health-wrapper.sh` (ensure executable)
- Verify permissions are correct: `ls -la .claude/bin/docker-health-wrapper.sh` (should show -rwxr-xr-x)
- Compare checksums: `sha256sum .claude/bin/docker-health-wrapper.sh .old.claude/bin/docker-health-wrapper.sh` (should match)

#### Step 3: Test docker-health-wrapper.sh functionality

Execute the restored script to confirm it works correctly.

- Run health check: `.claude/bin/docker-health-wrapper.sh health-check`
- Verify exit code is 0: `echo $?` (should be 0)
- Check status file was created: `GIT_ROOT=$(git rev-parse --show-toplevel) && GIT_ROOT_HASH="$(echo "${GIT_ROOT}" | sha256sum | cut -d' ' -f1 | head -c16)" && ls -la /tmp/.claude_docker_status_${GIT_ROOT_HASH}`
- Read status file content: `GIT_ROOT=$(git rev-parse --show-toplevel) && GIT_ROOT_HASH="$(echo "${GIT_ROOT}" | sha256sum | cut -d' ' -f1 | head -c16)" && cat /tmp/.claude_docker_status_${GIT_ROOT_HASH}`
- Verify status file contains valid JSON with docker information
- Run health check again to test idempotency: `.claude/bin/docker-health-wrapper.sh health-check`

#### Step 4: Verify statusline integration

Confirm the statusline now detects and displays docker status correctly.

- Manually trigger statusline update: `.claude/statusline/statusline.sh` (if this command is available)
- Check for docker status in output (should show "🟢 docker (X/Y)" instead of "⚪ docker:none")
- Verify docker component shows correct number of containers
- Verify status indicator matches actual docker state (green for all healthy)
- Test with Docker stopped: `docker stop $(docker ps -q) && .claude/statusline/statusline.sh` (should show docker:off), then restart: `docker start $(docker ps -aq)`

#### Step 5: Document restoration and commit changes

Commit the restored file with appropriate documentation.

- Stage the restored file: `git add .claude/bin/docker-health-wrapper.sh`
- Create commit with proper message: Use `/commit` command with type "fix" and scope "tooling"
- Update CLAUDE.md if needed to document active docker-health monitoring
- Consider adding comment in statusline.sh explaining docker-health-wrapper.sh dependency (optional)

## Testing Strategy

### Unit Tests

No new unit tests required - the docker-health-wrapper.sh script already has existing unit tests that were archived with it (`.old.claude/bin/docker-health-unit-tests.sh`). These tests previously validated the wrapper's functionality.

**If comprehensive testing is desired**, optionally restore and run:

- `.old.claude/bin/docker-health-unit-tests.sh` - Existing unit tests for docker-health-wrapper.sh

**Current validation is sufficient** because:

- The script is unchanged from its working state
- Manual functional testing (Step 3) validates core functionality
- Statusline integration test (Step 4) validates end-to-end functionality

### Integration Tests

Integration testing is performed manually in Step 4 (Verify statusline integration):

- ✅ Statusline detects docker-health-wrapper.sh
- ✅ Wrapper script executes successfully
- ✅ Status file is created and contains valid data
- ✅ Statusline displays correct docker status
- ✅ Status updates reflect actual docker state

**Test files**: Manual integration testing via bash commands (see Step 4).

### E2E Tests

Not applicable - this is a developer tooling fix for Claude Code statusline, not user-facing application functionality.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify docker-health-wrapper.sh is missing before fix: `ls .claude/bin/docker-health-wrapper.sh` (should fail)
- [ ] Verify archived script exists: `ls -la .old.claude/bin/docker-health-wrapper.sh` (should succeed with -rwxr-xr-x)
- [ ] Restore script: `cp .old.claude/bin/docker-health-wrapper.sh .claude/bin/docker-health-wrapper.sh`
- [ ] Verify restored file permissions: `ls -la .claude/bin/docker-health-wrapper.sh` (should show -rwxr-xr-x)
- [ ] Execute health check: `.claude/bin/docker-health-wrapper.sh health-check` (should succeed with exit 0)
- [ ] Verify status file created: Check `/tmp/.claude_docker_status_*` exists
- [ ] Verify status file contains valid JSON: `cat /tmp/.claude_docker_status_*` (should show docker info)
- [ ] Test statusline displays docker status: Should show "🟢 docker (X/Y)" instead of "⚪ docker:none"
- [ ] Test with Docker running: Statusline should show green indicator with correct count
- [ ] Test with Docker stopped: Statusline should show "🔴 docker:off" (optional)
- [ ] Restart Docker and verify status updates: Status should reflect changes
- [ ] Wait 5 minutes and verify automatic refresh: Status should update without manual trigger

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **File corruption during copy**: Copied file could be corrupted or incomplete
   - **Likelihood**: low
   - **Impact**: low (statusline would still show "none", but no other systems affected)
   - **Mitigation**: Verify checksums after copy (Step 2), test execution before considering complete (Step 3)

2. **Execute permissions not preserved**: Script might not be executable after copy
   - **Likelihood**: low (cp should preserve permissions)
   - **Impact**: low (statusline shows "none" but no breakage)
   - **Mitigation**: Explicitly set execute permissions with chmod (Step 2), verify with ls -la (Step 2)

3. **Script dependencies missing**: docker-health-wrapper.sh might depend on other archived scripts
   - **Likelihood**: low (script was self-contained based on diagnosis)
   - **Impact**: medium (script execution could fail)
   - **Mitigation**: Test script execution in Step 3, monitor output for errors, restore additional scripts only if needed

**Rollback Plan**:

If this fix causes issues:

1. Remove the restored file: `rm .claude/bin/docker-health-wrapper.sh`
2. Revert commit: `git revert HEAD` (if committed)
3. Statusline will return to showing "⚪ docker:none" (original state)
4. No other systems affected - rollback is clean

**Monitoring**: No ongoing monitoring needed. The fix either works immediately or fails with obvious symptoms (statusline still shows "none").

## Performance Impact

**Expected Impact**: none

The docker-health-wrapper.sh script runs in the background every 5 minutes and uses caching to minimize performance impact (multi-level L1/L2/L3 cache system described in diagnosis). This is the same performance profile that existed before the script was archived.

**Performance characteristics**:

- Background execution (non-blocking)
- Cached results (minimal Docker API calls)
- Async status file updates
- No impact on main application or Claude Code responsiveness

**Performance Testing**: Not required - the script's performance was previously validated during original implementation (issues #416, #418, #440).

## Security Considerations

**Security Impact**: none

This fix restores an existing script without modification. The script:

- Only reads Docker container status (read-only operations)
- Writes to `/tmp/` directory (user-scoped, no privilege escalation)
- Does not expose sensitive information
- Does not modify Docker containers or system state
- Already existed in the repository (no new code)

**Security review needed**: no

**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Verify docker-health-wrapper.sh is missing
ls -la .claude/bin/docker-health-wrapper.sh

# Expected: "No such file or directory" error

# Verify statusline shows "none" for docker
.claude/statusline/statusline.sh | grep docker

# Expected: "⚪ docker:none"
```

**Expected Result**: docker-health-wrapper.sh is missing, statusline shows "⚪ docker:none"

### After Fix (Bug Should Be Resolved)

```bash
# Type check (not applicable - bash script)
# Skip: pnpm typecheck

# Lint (not applicable - bash script)
# Skip: pnpm lint

# Format (not applicable - bash script)
# Skip: pnpm format

# Verify restored file exists and is executable
ls -la .claude/bin/docker-health-wrapper.sh

# Expected: -rwxr-xr-x [...] .claude/bin/docker-health-wrapper.sh

# Execute health check
.claude/bin/docker-health-wrapper.sh health-check
echo "Exit code: $?"

# Expected: Exit code 0, no errors

# Verify status file created
GIT_ROOT=$(git rev-parse --show-toplevel)
GIT_ROOT_HASH="$(echo "${GIT_ROOT}" | sha256sum | cut -d' ' -f1 | head -c16)"
ls -la /tmp/.claude_docker_status_${GIT_ROOT_HASH}

# Expected: Status file exists with recent timestamp

# Read status file
cat /tmp/.claude_docker_status_${GIT_ROOT_HASH}

# Expected: Valid JSON with docker container information

# Verify statusline shows docker status
.claude/statusline/statusline.sh | grep docker

# Expected: "🟢 docker (X/Y)" where X/Y reflects actual container counts

# Verify checksums match (archive vs restored)
sha256sum .claude/bin/docker-health-wrapper.sh .old.claude/bin/docker-health-wrapper.sh

# Expected: Both files have identical checksums
```

**Expected Result**: All commands succeed, docker-health-wrapper.sh is restored and functional, statusline displays correct docker status (e.g., "🟢 docker (16/16)"), bug is resolved.

### Regression Prevention

```bash
# Verify other statusline components still work
.claude/statusline/statusline.sh

# Expected: All components display correctly (build, test, codecheck, CI, PR, docker)

# Verify no unintended side effects
git status

# Expected: Only .claude/bin/docker-health-wrapper.sh staged/modified

# Verify Docker is still functioning normally
docker ps

# Expected: All containers running as before fix
```

## Dependencies

### New Dependencies

**No new dependencies required**

This fix only restores an existing file. No packages, libraries, or tools need to be installed.

## Database Changes

**No database changes required**

This is a developer tooling fix that does not involve database schema, migrations, or data changes.

## Deployment Considerations

**Deployment Risk**: low

This is a local development tooling fix for Claude Code statusline. It does not affect:

- Production application
- User-facing functionality
- Server deployments
- Database operations

**Special deployment steps**: None required - this is a local developer environment fix.

**Feature flags needed**: no

**Backwards compatibility**: maintained - no breaking changes to any functionality.

## Success Criteria

The fix is complete when:

- [ ] docker-health-wrapper.sh exists at `.claude/bin/docker-health-wrapper.sh`
- [ ] Restored file has execute permissions (-rwxr-xr-x)
- [ ] Restored file checksum matches archived file checksum
- [ ] Script executes successfully: `.claude/bin/docker-health-wrapper.sh health-check` (exit code 0)
- [ ] Status file created at `/tmp/.claude_docker_status_*`
- [ ] Status file contains valid JSON with docker information
- [ ] Statusline displays docker status (e.g., "🟢 docker (16/16)") instead of "⚪ docker:none"
- [ ] Docker status reflects actual container state (green for healthy, counts match `docker ps`)
- [ ] All other statusline components still work correctly
- [ ] Changes committed with appropriate commit message
- [ ] Manual testing checklist complete

## Notes

### Why This Script Was Archived

The diagnosis shows commit 752dcccd2 ("chore(tooling): archive legacy .claude directory files") moved docker-health-wrapper.sh to `.old.claude/bin/`. This appears to have been part of a broader repository cleanup/reorganization effort.

However, the script is **not legacy** - it's actively used by statusline.sh and is essential for docker health monitoring functionality. The archiving was likely an oversight during cleanup, as the script:

- Is referenced by active code (statusline.sh line 435)
- Provides actively-used functionality (docker status display)
- Was fully functional before archiving (evidenced by issues #440, #416, #418)

### Related Archived Files (Optional Restoration)

The diagnosis mentions other docker-health related files were also archived:

- `.old.claude/bin/docker-health-background.sh` - Background monitoring daemon
- `.old.claude/bin/docker-health-integration.sh` - Integration with other systems
- `.old.claude/bin/docker-health-unit-tests.sh` - Unit tests for docker-health

**Recommendation**: Restore only docker-health-wrapper.sh for now (minimal change principle). If advanced features like background monitoring are needed later, restore additional scripts as required.

### Future Archiving Best Practices

To prevent similar issues:

1. Before archiving any file, search for references: `git grep "filename"`
2. Check if file is actively used by other scripts or systems
3. Update dependent code before archiving active files
4. Test all functionality after archiving to catch broken references
5. Document why files are being archived (legacy vs still-needed)
6. Consider archiving entire subsystems together (not piecemeal)

### Additional Context

The docker-health monitoring system was fully implemented and working before archiving:

- Issue #416: Feature implementation
- Issue #440: Refresh issue (shows system was working)
- Issues #418, #419, #420, #424, #436: Related improvements

The system includes sophisticated features:

- Multi-level caching (L1, L2, L3)
- Background monitoring with 5-minute refresh
- Comprehensive health checks
- Statusline integration

This fix restores essential functionality that was inadvertently broken during cleanup.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #613*
