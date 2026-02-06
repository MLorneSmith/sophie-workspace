# Bug Fix: APP_ID Secret Points to Wrong GitHub App

**Related Diagnosis**: #1951 (REQUIRED)
**Severity**: medium
**Bug Type**: configuration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: `APP_ID` and `APP_PRIVATE_KEY` repository secrets configured with Approval Bot credentials instead of main GitHub App
- **Fix Approach**: Update secrets to point to correct main GitHub App
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The GitHub Actions workflow in `.github/workflows/dev-promotion-readiness.yml` creates pull requests and attempts to auto-approve them. However, both operations use the same GitHub App (Approval Bot), which violates GitHub's rule that an app cannot approve its own PRs. This results in the error: "Can not approve your own pull request".

The system architecture intends:
- **Main App** (`APP_ID`): Create PRs
- **Approval Bot** (`APPROVAL_APP_ID`): Approve PRs

Currently both secrets point to the Approval Bot.

For full details, see diagnosis issue #1951.

### Solution Approaches Considered

#### Option 1: Update Secret Values to Correct App IDs ⭐ RECOMMENDED

**Description**: Update the `APP_ID` and `APP_PRIVATE_KEY` repository secrets to reference the main GitHub App instead of the Approval Bot. Keep `APPROVAL_APP_ID` and `APPROVAL_APP_PRIVATE_KEY` unchanged.

**Pros**:
- Simple, surgical fix requiring only secret updates
- No code changes needed
- Immediate resolution
- Maintains intended two-app architecture
- Low risk of unintended side effects

**Cons**:
- Requires access to GitHub organization settings
- Manual secret management process
- No validation that the new values are correct until workflow runs

**Risk Assessment**: low - Secrets are straightforward configuration, no code paths affected

**Complexity**: simple - Update 2 repository secrets

#### Option 2: Use Single GitHub App for Both Operations

**Description**: Configure both `APP_ID` and `APPROVAL_APP_ID` to use the same main GitHub App, then remove the self-approval logic or use a different approval method.

**Why Not Chosen**: Creates unnecessary coupling and removes the security benefit of separating concerns (PR creation vs approval). Also violates GitHub's API rules about self-approval.

#### Option 3: Use GitHub Token (GITHUB_TOKEN) Instead

**Description**: Use the default `GITHUB_TOKEN` provided by GitHub Actions instead of custom GitHub Apps.

**Why Not Chosen**: `GITHUB_TOKEN` has limited permissions and doesn't persist across workflow runs. Doesn't solve the auto-approval requirement.

### Selected Solution: Update Secret Values to Correct App IDs

**Justification**: This approach is the minimal, surgical fix that addresses the root cause without architectural changes. The two-app design is sound - we just need to point the secrets to the correct applications. This is a configuration error, not a design flaw.

**Technical Approach**:
- Identify the main GitHub App (SlideHeroes) vs Approval Bot (SlideHeroes Approval Bot)
- Extract App ID and private key from main GitHub App settings
- Update `APP_ID` secret to main App's ID
- Update `APP_PRIVATE_KEY` secret to main App's private key
- Verify `APPROVAL_APP_ID` and `APPROVAL_APP_PRIVATE_KEY` are correct
- Trigger a test workflow run to confirm

**Architecture Changes** (none):
- No code changes required
- No workflow modifications needed
- Secrets remain the only system of record for credentials

**Migration Strategy** (none):
- No data migration needed
- No code deployment required
- Secrets update is immediate upon edit

## Implementation Plan

### Affected Files

No code files affected. Only repository secrets:
- `APP_ID` - Update to main App ID
- `APP_PRIVATE_KEY` - Update to main App's private key

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Identify the Correct GitHub Apps

**Navigate to GitHub organization settings:**

1. Visit: https://github.com/organizations/slideheroes/settings/apps
2. You should see two GitHub Apps:
   - **SlideHeroes Approval Bot** - Used for PR approvals
   - **SlideHeroes** (or similar) - Main app for PR creation and other operations
3. Click on the **main app** (NOT the Approval Bot)
4. Note the **App ID** (number displayed at the top of the page)

**Why this step first**: We need to identify which app is which before updating secrets. The diagnosis confirms the Approval Bot is incorrectly in `APP_ID`.

#### Step 2: Extract Main App Credentials

**For the main GitHub App:**

1. On the main app's settings page, scroll to "Private keys"
2. Click "Generate a private key"
3. The `.pem` file downloads automatically
4. Open the file in a text editor
5. Copy the **entire contents** (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)

**Store temporarily** (for next step):
- Keep the `.pem` file contents in a secure location
- Mark which app this key belongs to

#### Step 3: Update APP_ID Secret

**Update in GitHub:**

1. Navigate to: https://github.com/slideheroes/2025slideheroes/settings/secrets/actions
2. Click on the `APP_ID` secret
3. Click "Update"
4. Replace the current value with the **main App's ID** (from Step 1)
5. Click "Update secret"

**Verification**: The secret value should change immediately. You can see the last updated timestamp.

#### Step 4: Update APP_PRIVATE_KEY Secret

**Update in GitHub:**

1. Navigate to: https://github.com/slideheroes/2025slideheroes/settings/secrets/actions
2. Click on the `APP_PRIVATE_KEY` secret
3. Click "Update"
4. Replace the current value with the **main App's private key** (from Step 2)
5. Click "Update secret"

**Verification**: The secret value is masked but shows as updated.

#### Step 5: Verify APPROVAL App Secrets

**Confirm approval secrets are correct:**

1. Navigate to: https://github.com/slideheroes/2025slideheroes/settings/secrets/actions
2. Check `APPROVAL_APP_ID` - Should point to Approval Bot's ID
3. Check `APPROVAL_APP_PRIVATE_KEY` - Should contain Approval Bot's private key

If these are incorrect or missing:
- Obtain correct values from Approval Bot's settings page
- Update both secrets following the same process as Steps 3-4

#### Step 6: Test the Fix with Workflow Trigger

**Trigger the workflow manually:**

```bash
# Trigger the dev promotion readiness workflow
gh workflow run "Dev Promotion Readiness" \
  --repo slideheroes/2025slideheroes \
  -f force_promotion=true
```

**Expected result**:
- Workflow completes successfully
- New PR is created by main app (not Approval Bot)
- Main app auto-approves the PR without error
- PR author shows as main app name

**Verify PR author:**

```bash
# Get the workflow run ID from the trigger output
# Then check the created PR
gh pr view <pr-number> \
  --repo slideheroes/2025slideheroes \
  --json author \
  --jq '.author.login'

# Expected output: app/<main-app-name>
# NOT: app/slideheroes-approval-bot
```

#### Step 7: Validate No Side Effects

**Confirm other workflows still work:**

1. Create a small test branch from `dev`
2. Make a trivial change (e.g., comment in README)
3. Push and create a PR to `dev`
4. Verify PR validation workflow completes
5. Verify no unexpected errors in workflow logs

**Check for related issues:**
- Review recent workflow runs in GitHub Actions
- Verify no new errors or warnings
- Check that deployments still work as expected

#### Step 8: Clean Up Test Resources

**Remove test PR:**

```bash
# Close any test PR created during validation
gh pr close <test-pr-number> --repo slideheroes/2025slideheroes
```

**Secure cleanup:**
- Delete the downloaded `.pem` file from Step 2
- Clear browser history if credentials were visible
- Note: Regenerated keys are now in use; old keys should be revoked

## Testing Strategy

### Unit Tests

No unit tests required for secret configuration.

### Integration Tests

**Workflow Integration Test:**
- ✅ Trigger workflow with new secrets
- ✅ Verify PR is created by correct app
- ✅ Verify PR is auto-approved without errors
- ✅ Verify no "Can not approve your own pull request" error

**Test file**: Not applicable (secrets are external configuration)

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Access GitHub organization settings (verify permissions)
- [ ] Identify main app vs Approval Bot
- [ ] Note main app ID and private key location
- [ ] Update `APP_ID` secret in repository
- [ ] Update `APP_PRIVATE_KEY` secret in repository
- [ ] Verify `APPROVAL_APP_ID` secret is correct
- [ ] Verify `APPROVAL_APP_PRIVATE_KEY` secret is correct
- [ ] Trigger "Dev Promotion Readiness" workflow manually
- [ ] Wait for workflow to complete
- [ ] Check created PR author (should be main app, not Approval Bot)
- [ ] Verify PR was auto-approved successfully
- [ ] Check GitHub Actions logs for any errors
- [ ] Create test PR to verify other workflows still work
- [ ] Verify no regressions in deployment workflow
- [ ] Clean up test resources

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Incorrect Credentials**: Paste wrong app ID or private key
   - **Likelihood**: medium (manual copy-paste)
   - **Impact**: high (workflow fails, PR creation broken)
   - **Mitigation**: Double-check values against GitHub UI before updating. Verify app name in UI matches expected main app.

2. **Permissions Issue**: Main app lacks required permissions
   - **Likelihood**: low (apps pre-configured)
   - **Impact**: high (workflow fails)
   - **Mitigation**: Verify main app has "Pull requests" and "Contents" permissions enabled in GitHub settings.

3. **Old Secrets Still Active**: If secrets aren't updated properly
   - **Likelihood**: low (GitHub UI prevents this)
   - **Impact**: high (bug persists)
   - **Mitigation**: Refresh browser after updating, check "Updated" timestamps in secrets list.

**Rollback Plan**:

If the workflow fails after applying the fix:

1. Revert to previous `APP_ID` value (note it before updating)
2. Revert to previous `APP_PRIVATE_KEY` value
3. Trigger workflow again to confirm rollback works
4. Investigate why new values didn't work (may need to regenerate app keys)

**Monitoring** (if needed):

- Monitor GitHub Actions workflow runs for this workflow
- Watch for "Can not approve your own pull request" errors (should disappear)
- Check PR creation timestamps to ensure automation is working

## Performance Impact

**Expected Impact**: none

No performance implications. This is a secrets configuration fix.

## Security Considerations

**Security Impact**: low (positive)

This fix actually improves security by:
- Ensuring credentials are scoped correctly (each app has one role)
- Maintaining separation of concerns (PR creation vs approval)
- Preventing credential reuse across different purposes

**Security notes**:
- Old private key should be revoked after new key is in use
- Repository secrets are encrypted at rest by GitHub
- Only repository administrators can view/update secrets
- All secret access is audited in GitHub's security logs

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current secret values (cannot view values directly, but can see metadata)
gh secret list --repo slideheroes/2025slideheroes | grep APP

# Note: APP_ID should currently point to Approval Bot
# This can be verified by checking the value matches APPROVAL_APP_ID
```

**Expected Result**: Workflow fails with "Can not approve your own pull request" error when triggered.

### After Fix (Bug Should Be Resolved)

```bash
# Trigger the workflow that was failing
gh workflow run "Dev Promotion Readiness" \
  --repo slideheroes/2025slideheroes \
  -f force_promotion=true

# Wait for workflow to complete (check GitHub Actions UI)

# Verify PR was created and approved
gh pr list --repo slideheroes/2025slideheroes --state merged --limit 5

# Check PR details to confirm correct app created it
gh pr view <pr-number> \
  --repo slideheroes/2025slideheroes \
  --json author,reviews
```

**Expected Result**:
- Workflow completes successfully
- PR created by main app (not Approval Bot)
- PR is auto-approved without errors
- No "Can not approve your own pull request" in logs

### Regression Prevention

```bash
# Run other workflows that use GitHub Apps
gh workflow run "PR Validation" \
  --repo slideheroes/2025slideheroes

# Verify standard PR workflows still work
gh workflow list --repo slideheroes/2025slideheroes

# Check recent workflow runs for any new failures
gh run list --repo slideheroes/2025slideheroes --limit 20
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

This fix requires only:
- GitHub CLI (gh command line tool) - already installed
- Browser access to GitHub.com
- GitHub organization administrator permissions

## Database Changes

**No database changes required**

This is a secrets configuration issue, not a database schema or migration issue.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
1. Update secrets (external to code deployment)
2. Trigger workflow to verify fix
3. No code deployment or database migration needed

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix maintains full backwards compatibility with existing workflows and code.

## Success Criteria

The fix is complete when:
- [ ] `APP_ID` secret contains main app's ID (verified by checking app name in GitHub UI)
- [ ] `APP_PRIVATE_KEY` secret contains main app's private key
- [ ] Workflow runs successfully without "Can not approve your own pull request" error
- [ ] PR is created by correct app (main app, not Approval Bot)
- [ ] PR is auto-approved without errors
- [ ] Other workflows continue to function normally
- [ ] No regressions detected in related workflows

## Notes

**Key Points**:
- This is purely a secrets/configuration fix - no code changes needed
- The two-app architecture is correct; values were just reversed
- Regenerating a new private key is preferred over reusing old keys
- All changes are reversible by reverting secret values

**Additional Context**:
- GitHub prevents apps from approving their own PRs for security reasons
- The architecture supports CI/CD workflows by having separate apps for different concerns
- Diagnosis issue #1951 includes the exact error message and evidence

**Related Documentation**:
- CI/CD Complete: `.ai/ai_docs/context-docs/infrastructure/ci-cd-complete.md`
- Auth Security: `.ai/ai_docs/context-docs/infrastructure/auth-security.md`
- GitHub Apps Documentation: https://docs.github.com/en/developers/apps

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1951*
