# Bug Fix: E2B Sandbox Template Missing GitHub CLI

**Related Diagnosis**: #769
**Fix Plan Issue**: #771
**Severity**: medium
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: GitHub CLI (`gh`) not installed in E2B sandbox template build configuration
- **Fix Approach**: Add `gh` CLI installation to template build script
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The E2B sandbox template `slideheroes-claude-agent` does not include the GitHub CLI (`gh`), which is required for automated GitHub workflows. When Claude Code attempts to create GitHub issues or pull requests using `gh` commands, they fail with "command not found" errors.

This blocks the automated feature workflow where `/feature` commands need to create GitHub issues directly within the sandbox.

For full details, see diagnosis issue #769.

### Solution Approaches Considered

#### Option 1: Add GitHub CLI to apt packages ⭐ RECOMMENDED

**Description**: Add GitHub CLI installation steps to the E2B template builder script. This involves:
1. Adding the GitHub CLI apt repository
2. Installing the `gh` package via apt
3. Rebuilding the template

**Pros**:
- Straightforward one-time addition to template build script
- GitHub CLI will be available in all new sandbox instances
- No ongoing maintenance required once template is rebuilt
- Aligns with how other CLI tools are installed (git, curl, jq)
- GitHub CLI comes with full feature support out of the box

**Cons**:
- Requires template rebuild, which takes time
- Adds slight overhead to template image size
- Existing sandbox instances won't have the fix until template is rebuilt

**Risk Assessment**: low - This is a standard package installation, no complex interactions

**Complexity**: simple - Only requires adding ~10 lines of shell commands to existing build script

#### Option 2: Install `gh` on-demand in sandbox-cli.ts

**Description**: Modify sandbox-cli.ts to check for `gh` availability and install it if missing before using it.

**Pros**:
- Works with existing template without rebuild
- Can be deployed immediately

**Cons**:
- Adds installation latency to each feature workflow execution
- More fragile - dependent on internet connectivity at runtime
- Adds complexity to runtime code
- Installation would happen repeatedly for each sandbox instance
- Harder to debug if installation fails during user workflow

**Why Not Chosen**: Option 1 is cleaner - baking the dependency into the template is a better long-term approach than installing on-demand.

#### Option 3: Use GitHub REST API directly instead of `gh` CLI

**Description**: Replace `gh` CLI calls with direct GitHub REST API calls using authenticated requests.

**Cons**:
- Requires significant rewrite of sandbox-cli.ts code
- Loses the benefits of `gh` CLI's validation and formatting
- More error-prone API interaction code
- Conflicts with the existing architecture where `gh` is already expected
- More code to maintain

**Why Not Chosen**: This adds unnecessary complexity when the simpler fix (installing `gh`) addresses the root cause directly.

### Selected Solution: Add GitHub CLI to apt packages

**Justification**: This is the simplest, most maintainable solution. The GitHub CLI is the standard tool for GitHub automation, and installing it in the template follows the established pattern for other CLI tools. The template builder already has examples of adding packages via `aptInstall()`, making this a low-risk, straightforward addition.

**Technical Approach**:

1. **Add apt repository** for GitHub CLI:
   - Use the official GitHub CLI apt repository
   - This ensures we get official, signed packages

2. **Install gh package** via apt:
   - Once the repository is added, install via `apt install gh`
   - This brings in all necessary dependencies

3. **Verify installation** in template build:
   - Add a simple `gh --version` check to confirm installation succeeded

4. **Rebuild template**:
   - Run the template builder to create the updated image
   - All future sandbox instances will have `gh` available

**Architecture Changes** (if any):
- None - this is purely additive to the template build process
- No code changes to sandbox-cli.ts or other runtime code
- Existing fallback handling in sandbox-cli.ts (lines 849-858) can be removed once template is updated

## Implementation Plan

### Affected Files

- `.claude/skills/e2b-sandbox/scripts/build-template.ts` - Add GitHub CLI installation commands to template builder

### Step-by-Step Tasks

#### Step 1: Add GitHub CLI repository and installation to build-template.ts

Add the following commands to the template builder in the `.runCmd()` section after the existing `aptInstall()` call (approximately after line 184):

```typescript
// Add GitHub CLI repository and install
.runCmd([
  "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg",
  "chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg",
  'echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null',
  "apt-get update && apt-get install -y gh",
  "gh --version" // Verify installation
], { user: "root" })
```

**Why this step first**: The GitHub CLI must be installed before we test it, and adding it to the template builder ensures it's available from the start in all future sandbox instances.

#### Step 2: Rebuild the E2B template

Execute the template builder to create the updated sandbox image:

```bash
# Ensure you have E2B_API_KEY set (from environment or secrets)
tsx .claude/skills/e2b-sandbox/scripts/build-template.ts
```

Monitor the build output to ensure:
- GitHub CLI repository is added successfully
- `apt-get install -y gh` completes without errors
- `gh --version` verification step succeeds
- Template build completes successfully

**Expected output**: The builder should report successful template creation with the new image ID logged.

#### Step 3: Test GitHub CLI in sandbox

Create a test sandbox from the updated template and verify `gh` is available:

```bash
# Create a test sandbox using the new template
pnpm --filter=@kit/e2b-sandbox test:sandbox -- --template slideheroes-claude-agent

# Or manually in a sandbox:
gh --version
gh auth status  # Should fail with "not authenticated" but command exists
```

**Expected behavior**: `gh` command should be found and version should be displayed.

#### Step 4: Verify sandbox-cli feature workflow

Test the actual use case that was failing:

```bash
# In a sandbox instance, test creating an issue with gh
gh issue create --repo MLorneSmith/2025slideheroes --title "Test Issue" --body "Test body" 2>&1
```

With proper `GH_TOKEN` environment variable set, this should succeed.

#### Step 5: Remove fallback handling (optional follow-up)

Once confirmed working in production, the fallback handling in `.claude/skills/e2b-sandbox/scripts/sandbox-cli.ts` at lines 849-858 can be simplified or removed since `gh` will now always be available:

```typescript
// BEFORE (lines 849-858):
if (prResult.exitCode === 0 && prResult.stdout) {
    console.log("\n=== Pull Request Created ===");
    console.log(prResult.stdout);
} else {
    console.log("\n=== Branch Pushed ===");
    console.log(`Branch: ${branch}`);
    console.log(`Create PR at: https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/dev...${branch}`);
    if (prResult.stderr) {
        console.log("\nNote: gh CLI not available, manual PR creation needed");
    }
}

// AFTER (simplified):
if (prResult.exitCode === 0 && prResult.stdout) {
    console.log("\n=== Pull Request Created ===");
    console.log(prResult.stdout);
} else {
    console.error("\n❌ Failed to create pull request:");
    console.error(prResult.stderr || "Unknown error");
    throw new Error("PR creation failed");
}
```

But this can be done separately - the template fix is the critical part.

## Testing Strategy

### Unit Tests

No new unit tests needed - this is an infrastructure change. Existing tests that use `gh` commands will now pass instead of failing.

### Integration Tests

If you have integration tests that use the sandbox:
- ✅ Any test using `gh issue create` should now work
- ✅ Any test using `gh pr create` should now work
- ✅ Verify GitHub token authentication works with commands

### Manual Testing Checklist

Execute these manual tests to verify the fix:

- [ ] Template builds successfully with no errors
- [ ] Run `gh --version` in a new sandbox from the template (should show version)
- [ ] Run `gh auth status` in sandbox with `GH_TOKEN` env var (should show authenticated)
- [ ] Create a test issue with `gh issue create` in sandbox with valid token
- [ ] Create a test PR with `gh pr create` in sandbox with valid token
- [ ] Run a feature workflow in sandbox that creates a GitHub issue (should succeed)
- [ ] Verify no new errors or warnings in template build output

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Template Build Failure**: The GitHub CLI installation could fail
   - **Likelihood**: low - GitHub provides official apt repository
   - **Impact**: low - Template build would fail, no production impact
   - **Mitigation**: Monitor build output, check GitHub CLI apt repository status, have rollback plan (revert the change)

2. **GitHub CLI Version Conflicts**: Future versions of `gh` could introduce breaking changes
   - **Likelihood**: low - GitHub CLI is stable
   - **Impact**: low - Would only affect new sandbox instances
   - **Mitigation**: Pin to specific version if needed, test before rebuilding

3. **Sandbox Instances Using Old Template**: Existing sandboxes created from old template won't have `gh`
   - **Likelihood**: high - Template must be rebuilt and redeployed
   - **Impact**: medium - Users with existing sandboxes need new instances
   - **Mitigation**: Clear communication that new sandboxes should be used, update documentation

4. **GitHub CLI Authentication Issues**: GitHub CLI might not authenticate properly with provided token
   - **Likelihood**: low - Token support is standard in `gh`
   - **Impact**: medium - Feature workflows would fail
   - **Mitigation**: Verify `GITHUB_TOKEN` environment variable is properly passed to sandbox, test with sandbox that has valid token

**Rollback Plan**:

If this causes issues in production:
1. Revert the change to `.claude/skills/e2b-sandbox/scripts/build-template.ts`
2. Rebuild the template with the reverted code
3. Users can request new sandbox instances from the reverted template
4. All GitHub operations will fall back to manual creation (existing fallback behavior)

**Monitoring** (if needed):
- Monitor template build logs for GitHub CLI installation success/failure
- Track sandbox creation success rates
- Monitor feature workflow completion rates for GitHub issue creation

## Performance Impact

**Expected Impact**: minimal

- Template build will be slightly slower due to additional apt operations (~10-20 seconds)
- Sandbox startup time unchanged (installation happens during template build, not startup)
- No runtime performance impact
- Sandbox disk usage increases by ~10-15 MB for GitHub CLI binary

## Security Considerations

**Security Impact**: none to low

**Rationale**:
- GitHub CLI is an official GitHub tool with good security practices
- Installation via official apt repository uses signed packages
- No secrets are baked into the template
- GitHub token is passed via environment variable at runtime (not stored in template)
- No privilege escalation needed (installation as root during build is standard)

**Security Note**: Ensure `GITHUB_TOKEN` environment variable is:
- Only passed to sandboxes that need it
- Not logged or exposed in output
- Using a token with minimal required permissions (verify scope in GitHub settings)

## Validation Commands

### Before Fix (GitHub CLI should NOT exist)

```bash
# In the old template, this should fail:
gh --version
# Expected: command not found error
```

### After Fix (GitHub CLI should work)

```bash
# Type check the modified file
pnpm typecheck

# Lint the modified file
pnpm lint

# Build the new template
tsx .claude/skills/e2b-sandbox/scripts/build-template.ts

# In a new sandbox created from updated template:
gh --version
# Expected: "gh version X.Y.Z (YYYY-MM-DD)" or similar

# With valid GitHub token:
gh auth status
# Expected: "Logged in to github.com as <username>"

# Create a test issue (requires valid GITHUB_TOKEN):
GH_TOKEN=<your_token> gh issue create --repo MLorneSmith/2025slideheroes --title "Test" --body "Fix test"
# Expected: Issue created successfully
```

### Regression Prevention

After deploying the template update:
- Any existing feature workflow tests that create GitHub issues should now succeed
- No new errors should appear in sandbox execution logs
- The fallback message "gh CLI not available" should no longer appear

## Dependencies

**No new dependencies required** - GitHub CLI is installed as a system package via apt, not as a JavaScript dependency.

## Database Changes

**No database changes required** - This is a template infrastructure change.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
1. Rebuild the E2B template after merging this change
2. Update documentation to note that new sandboxes have GitHub CLI available
3. Optionally clean up fallback handling code in sandbox-cli.ts (can be done in a follow-up)

**Feature flags needed**: no

**Backwards compatibility**: maintained
- This change is purely additive
- Existing sandboxes without `gh` will continue to work (fallback behavior)
- New sandboxes will have `gh` available

## Success Criteria

The fix is complete when:
- [ ] GitHub CLI installation code added to build-template.ts
- [ ] Template builds successfully with no errors
- [ ] New sandboxes created from updated template have `gh` available
- [ ] `gh --version` works in sandbox
- [ ] `gh` can authenticate with `GITHUB_TOKEN` environment variable
- [ ] Feature workflow `/feature` command succeeds in creating GitHub issues
- [ ] All validation commands pass
- [ ] No regressions detected in other sandbox functionality
- [ ] Code review approved (if applicable)

## Notes

### GitHub CLI Installation Reference

The GitHub CLI apt repository is the official installation method:
- Repository: https://cli.github.com/packages
- Maintained by GitHub
- Supports all major Linux distributions

### Environment Variable Support

The sandbox-cli.ts code already properly passes `GH_TOKEN`:
```typescript
envs: { ...getGitEnvVars(), GH_TOKEN: GITHUB_TOKEN }
```

This means once `gh` is installed, existing code should work without modification.

### Related Template Setup

The template builder script already follows this pattern for other tools:
- `aptInstall()` for system packages
- `npm install -g` for Node.js tools
- Health checks and version verifications

This change follows the established pattern.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #769*
