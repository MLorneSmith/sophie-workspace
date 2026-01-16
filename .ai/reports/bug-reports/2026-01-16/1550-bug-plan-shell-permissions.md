# Bug Fix: Shell Scripts Lack Execute Permissions in Git

**Related Diagnosis**: #1547 (REQUIRED)
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Shell scripts committed with git file mode `100644` (non-executable) instead of `100755` (executable)
- **Fix Approach**: Use `git update-index --chmod=+x` to update file permissions in git index and commit
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Two shell scripts used in CI/CD workflows are committed to the git repository with incorrect file permissions. When workflows attempt to execute these scripts, the OS denies execution with "Permission denied" errors, causing CI/CD pipelines to fail and blocking deployments.

The affected files are:
- `fix-build-permissions.sh`
- `.claude/statusline/build-wrapper.sh`

For full details, see diagnosis issue #1547.

### Solution Approaches Considered

#### Option 1: Using `git update-index --chmod` ⭐ RECOMMENDED

**Description**: Modify the git index to mark the files as executable, then commit the change. This is the standard Git approach that preserves file history while updating permissions.

**Pros**:
- Standard Git workflow - exactly what `git update-index --chmod` is designed for
- Minimal changes - only updates file mode bits in git index
- Preserves full file history and blame information
- Works across all platforms (Windows, Mac, Linux)
- No need to modify file contents
- Simple, single command per file

**Cons**:
- Requires team members on Windows to ensure `core.filemode = true` in local git config

**Risk Assessment**: low - Git's `chmod` operation is well-tested and safe. Only modifies metadata, not file contents.

**Complexity**: simple - Two one-line git commands, no code changes required.

#### Option 2: Using File System Permissions + Git Add

**Description**: Change file permissions on disk using `chmod +x`, then use `git add` to stage the change.

**Pros**:
- Also standard Git workflow
- Works well on Unix-like systems
- Updates permissions on disk automatically

**Cons**:
- Requires running additional shell command on disk before git
- Less portable (requires understanding of `chmod` command)
- More steps than `git update-index`

**Why Not Chosen**: `git update-index --chmod` is more direct and requires no file system changes.

#### Option 3: Remove and Re-add Files

**Description**: Delete the files from git and re-add them with current file permissions.

**Pros**:
- Would correctly set permissions

**Cons**:
- Loses file history
- More destructive
- Unnecessary complexity for a metadata-only change
- Not idiomatic Git

**Why Not Chosen**: Overkill for a simple permissions issue. Git history should be preserved.

### Selected Solution: Using `git update-index --chmod=+x`

**Justification**: This is the standard, idiomatic Git approach for fixing file permissions. It's minimal, safe, preserves history, and is exactly what Git provides for this use case. The operation only modifies permission bits in the git index and requires no file system changes.

**Technical Approach**:

1. Use `git update-index --chmod=+x` for each script file
   - This marks the files as executable in git's internal index
   - Does not modify the actual file contents
   - Updates git's metadata for the file mode

2. Commit the changes with descriptive message
   - Single commit containing both file permission updates
   - Conventional commit format: `fix(ci): add execute permissions to shell scripts`

3. Push to origin
   - Ensures all environments have the correct permissions
   - CI/CD can proceed without local workarounds

**Architecture Changes**: None - this is a pure metadata fix with no code or architecture impact.

## Implementation Plan

### Affected Files

- `fix-build-permissions.sh` - Build permission fix script used in CI/CD
- `.claude/statusline/build-wrapper.sh` - Status line build wrapper script used in development

Both files need their git file mode updated from `100644` to `100755`.

### New Files

None - this is a metadata-only fix.

### Step-by-Step Tasks

#### Step 1: Verify Current File Permissions

Confirm that both files are marked as non-executable in git before making changes.

- Check git file modes for both scripts
- Verify error message matches diagnosis (Permission denied when executing)

**Why this step first**: Establishes baseline and ensures we're fixing the right issue.

#### Step 2: Update File Permissions in Git Index

Use `git update-index --chmod=+x` to mark both files as executable.

- Execute: `git update-index --chmod=+x fix-build-permissions.sh`
- Execute: `git update-index --chmod=+x .claude/statusline/build-wrapper.sh`
- Verify change: `git ls-files -s fix-build-permissions.sh .claude/statusline/build-wrapper.sh`
- Expected output: Both files should show `100755` instead of `100644`

**Why this step first**: Updates the git metadata that controls file execution permissions.

#### Step 3: Create Commit

Commit the file permission changes with a descriptive message following Conventional Commits format.

- Use `/commit` skill with: `fix(ci): add execute permissions to shell scripts`
- This ensures proper commit message format and agent traceability

**What this accomplishes**: Creates a properly formatted commit with conventional commit standards, making the change part of the project history.

#### Step 4: Verify Commit Success

Ensure the commit was created successfully and file modes are correctly recorded.

- Run: `git log -1 --pretty=format:%B` to see commit message
- Run: `git log -1 --pretty=format:%H` to see commit hash
- Run: `git show --name-status HEAD` to see files in commit
- Verify git shows file mode change in commit history

**What this accomplishes**: Confirms the fix is correctly committed before proceeding to CI/CD testing.

#### Step 5: Validate CI/CD Pipeline

Run the CI/CD workflows to verify scripts execute successfully.

- Trigger E2E test workflow on dev branch
- Monitor `.claude/statusline/build-wrapper.sh` execution in workflow logs
- Verify both scripts execute without "Permission denied" errors
- Check that workflows complete successfully

**What this accomplishes**: Confirms the actual issue is fixed in CI/CD environments.

## Testing Strategy

### Unit Tests

**Not applicable** - This is a permissions/metadata fix with no code logic to unit test.

### Integration Tests

**Not applicable** - No code changes affect integration logic.

### E2E Tests

The best validation is running actual CI/CD workflows that depend on these scripts:

**Test files**:
- `.github/workflows/e2e-sharded.yml` - Uses `.claude/statusline/build-wrapper.sh`
- `.github/workflows/dev-deploy.yml` - Uses fix-build-permissions.sh indirectly

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Verify git shows file mode `100755` for both scripts
- [ ] Clone the repository to a fresh directory
- [ ] Run the scripts directly: `./fix-build-permissions.sh`
- [ ] Run the scripts directly: `./.claude/statusline/build-wrapper.sh`
- [ ] Both should execute without "Permission denied" error
- [ ] Run E2E test workflow on dev branch to completion
- [ ] Verify no "Permission denied" errors in workflow logs
- [ ] Trigger deployment workflow and verify success

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Windows Developers Without `core.filemode = true`**: On Windows with `core.filemode = false` in local git config, the permission change may not be visible locally
   - **Likelihood**: low (only affects Windows users with non-standard config)
   - **Impact**: low (Windows users would need to configure git, but wouldn't break anything)
   - **Mitigation**: Document in CONTRIBUTING.md that `core.filemode` should be `true` on all platforms for this project. The permission change is in git's metadata and will apply in CI/CD regardless.

2. **CI/CD Environment Not Respecting Permissions**: Hypothetically, if the CI/CD environment doesn't respect git file modes (extremely unlikely)
   - **Likelihood**: very low (GitHub Actions respects git file modes)
   - **Impact**: high (scripts would still fail)
   - **Mitigation**: N/A - This would be a platform issue, but it's so unlikely we don't need special handling

**Rollback Plan**:

If for some reason the fix causes issues:

1. Revert the commit: `git revert <commit-hash>`
2. Run: `git update-index --chmod=-x fix-build-permissions.sh .claude/statusline/build-wrapper.sh` to remove execute permissions
3. Push revert commit to origin
4. Workflows will return to previous state

The revert is trivial because this is a pure metadata change with no side effects.

**Monitoring**: None required - this is a one-time fix with no ongoing monitoring needed.

## Performance Impact

**Expected Impact**: none

No performance implications. This change only affects CI/CD startup time (no more permission errors = slightly faster job execution due to no permission-denied failures).

## Security Considerations

**Security Impact**: none - positive

Making scripts executable is a **security improvement**:
- Scripts can now execute as intended
- Removes reliance on workarounds that might bypass security
- Aligns with principle of least surprise (scripts should execute when CI/CD calls them)

**Security review needed**: no
**Penetration testing needed**: no

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Show current git file modes
git ls-files -s fix-build-permissions.sh .claude/statusline/build-wrapper.sh

# Expected output: Both show 100644 (non-executable)
# 100644 indicates non-executable regular file
```

**Expected Result**: Both files show `100644` file mode, confirming they're non-executable in git.

### After Fix (Bug Should Be Resolved)

```bash
# Verify file modes changed
git ls-files -s fix-build-permissions.sh .claude/statusline/build-wrapper.sh

# Expected output: Both show 100755 (executable)
# 100755 indicates executable file

# Verify commit message
git log -1 --oneline

# Expected output: Should show fix(ci): add execute permissions to shell scripts

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Build
pnpm build

# Run E2E tests to verify scripts execute
pnpm test:e2e
```

**Expected Result**: All commands succeed, file modes show `100755`, E2E tests complete without "Permission denied" errors.

### Regression Prevention

```bash
# Verify no other shell scripts have incorrect permissions
git ls-files -s | grep -E '\.(sh|bash)$' | grep -v '100755'

# Expected output: No results (all shell scripts should be executable)

# If there are results, they need the same fix
```

## Dependencies

### New Dependencies (if any)

None - this uses only standard Git functionality.

**No new dependencies required**

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- No special steps - the permission fix is automatically handled by git
- Just push the commit to origin
- All CI/CD environments will automatically use the correct permissions

**Feature flags needed**: no

**Backwards compatibility**: maintained - This is a pure metadata fix with no code changes

## Success Criteria

The fix is complete when:
- [ ] File modes updated to `100755` in git
- [ ] Commit created with proper message format
- [ ] `git ls-files -s` shows both files with `100755` mode
- [ ] E2E test workflow runs successfully on dev branch
- [ ] No "Permission denied" errors in workflow logs
- [ ] Scripts execute successfully when CI/CD calls them
- [ ] All validation commands pass
- [ ] Zero regressions (all other workflows still pass)

## Notes

This is a straightforward fix for a metadata issue. The root cause is clear from the diagnosis, the solution is well-established (git's `chmod` operation), and the risk is minimal.

The fix requires no code changes, no testing infrastructure updates, and no database modifications. It's a single-commit, low-risk update that resolves a deployment-blocking issue.

**Related Documentation**:
- Diagnosis issue: #1547
- CI/CD documentation: `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md`
- Git documentation: `git-update-index(1)` - Focus on `--chmod` option

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1547*
