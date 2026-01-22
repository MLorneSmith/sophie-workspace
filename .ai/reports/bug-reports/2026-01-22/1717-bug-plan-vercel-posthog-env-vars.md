# Bug Fix: Deploy to Dev fails - PostHog env vars in wrong Vercel project

**Related Diagnosis**: #1717 (REQUIRED)
**Severity**: high
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: PostHog environment variables were configured in duplicate Vercel project (`web`) instead of the correct project (`2025slideheroes-web`)
- **Fix Approach**: Copy PostHog env vars from wrong project to correct project, then delete the duplicate
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The "Deploy to Dev" workflow fails because during PostHog EU analytics integration on 2026-01-21, a duplicate Vercel project named `web` was accidentally created. PostHog environment variables (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, etc.) were then configured in this wrong project instead of `2025slideheroes-web`.

This causes the build to fail with:
```
Error: Command "pnpm turbo run build --filter=web" exited with 1
```

Locally, builds succeed because the correct `.env` configuration is used. On Vercel, the build fails because it's reading env vars from the wrong project.

For full details, see diagnosis issue #1717.

### Solution Approaches Considered

#### Option 1: Copy PostHog vars and delete duplicate ⭐ RECOMMENDED

**Description**:
1. Copy all PostHog environment variables from the duplicate `web` Vercel project to the correct `2025slideheroes-web` project
2. Delete the duplicate `web` Vercel project to prevent future confusion
3. Re-run the failed Deploy to Dev workflow

**Pros**:
- Completely resolves the issue
- Simple, straightforward approach with minimal risk
- Prevents future confusion by removing the duplicate project
- Takes ~5 minutes total

**Cons**:
- Requires manual action in Vercel UI
- None significant

**Risk Assessment**: low - Just copying environment variables and deleting unused project

**Complexity**: simple - Direct env var copy/paste

#### Option 2: Delete duplicate, configure from scratch

**Description**:
Delete the duplicate project and manually re-configure all PostHog variables in `2025slideheroes-web` from documentation.

**Why Not Chosen**:
Higher risk of transcription error, requires finding current PostHog values. Option 1 is simpler by copying from existing configuration.

#### Option 3: Use Vercel API to migrate configuration

**Description**:
Use Vercel CLI or API to programmatically copy environment variables between projects.

**Why Not Chosen**:
Over-engineered for a one-time task. Manual copy is simpler and less error-prone.

### Selected Solution: Copy PostHog vars and delete duplicate

**Justification**:
This approach is the simplest and lowest-risk solution. Environment variables are configuration, not code, so copying them is straightforward. Deleting the duplicate project removes a source of future confusion. The entire fix takes approximately 5 minutes of manual Vercel UI interaction.

**Technical Approach**:
- Verify both Vercel projects exist
- Copy PostHog environment variables from `web` project to `2025slideheroes-web` project
- Verify all variables are present in correct project
- Delete duplicate `web` project
- Trigger workflow re-run to verify fix

**Architecture Changes** (if any):
None - This is just correcting environment variable configuration.

**Migration Strategy** (if needed):
Not needed - No code or data migration required.

## Implementation Plan

### Affected Files

No code files are affected. This is purely an environment variable configuration fix in Vercel.

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: List PostHog variables in duplicate project

Navigate to the Vercel dashboard:
1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Find the project named `web` (the duplicate)
3. Go to Settings → Environment Variables
4. Document these PostHog variables:
   - `NEXT_PUBLIC_POSTHOG_KEY`
   - `NEXT_PUBLIC_POSTHOG_HOST`
   - `POSTHOG_PERSONAL_API_KEY` (if present)
   - `POSTHOG_ENV_ID` (if present)
   - Any other PostHog-related variables

**Why this step first**: We need to see what variables exist before copying them to avoid missing any configuration.

#### Step 2: Add PostHog variables to correct project

1. Still in Vercel dashboard
2. Switch to project `2025slideheroes-web`
3. Go to Settings → Environment Variables
4. Add each PostHog variable from Step 1:
   - Use same names and values as the duplicate project
   - Apply to all environments (Production, Preview, Development)
5. Verify each variable was saved

**Verification**: Check that each variable shows in the environment variables list.

#### Step 3: Delete the duplicate project

1. Go back to Vercel dashboard → Projects list
2. Find project named `web`
3. Click on the project name to enter its settings
4. Scroll to bottom → "Danger Zone" section
5. Click "Delete Project"
6. Confirm deletion by typing the project name
7. Wait for deletion to complete

**Why delete**: Removes the source of confusion. Future developers won't accidentally configure the wrong project.

#### Step 4: Re-run the failed workflow

1. Go to GitHub Actions: [https://github.com/MLorneSmith/2025slideheroes/actions](https://github.com/MLorneSmith/2025slideheroes/actions)
2. Find the "Deploy to Dev" workflow
3. Look for the failed run (#21252558567 from diagnosis)
4. Click "Re-run all jobs" button
5. Watch the workflow complete

**Expected result**: The workflow should succeed now that PostHog env vars are in the correct Vercel project.

#### Step 5: Validation

- Verify the re-run completed successfully
- Check that the web app deployed to Vercel without errors
- Review Vercel deployment logs to confirm no missing env var errors
- Optionally verify PostHog analytics are working in the deployed app

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Log into Vercel dashboard and confirm `web` duplicate project is deleted
- [ ] Verify `2025slideheroes-web` project has all PostHog environment variables
- [ ] Re-run the failed GitHub Actions workflow and verify it succeeds
- [ ] Check Vercel deployment logs show no environment variable errors
- [ ] (Optional) Visit deployed web app and verify PostHog analytics are working

### Regression Testing

No regression risk - this is configuration-only change.

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Accidentally delete wrong project**:
   - **Likelihood**: low - Project names are clearly different (`web` vs `2025slideheroes-web`)
   - **Impact**: medium - Would require restoring from backup or reconfiguring
   - **Mitigation**: Double-check project name before deleting. Vercel shows deletion confirmation dialog.

2. **Miss a PostHog variable during copy**:
   - **Likelihood**: low - Only a few variables, can be verified against workflow logs
   - **Impact**: medium - Build would fail again with missing env var error
   - **Mitigation**: Document all variables before deletion. Easy to re-add if missed.

3. **Variables not applied to all environments**:
   - **Likelihood**: low - Vercel UI makes this clear
   - **Impact**: medium - App would fail in specific environments
   - **Mitigation**: Apply to "All" environments when adding variables.

**Rollback Plan**:

If this fix causes issues in production:
1. Restore Vercel project backup if available (Vercel retains recent deployments)
2. Re-create the `2025slideheroes-web` environment variables from history
3. Re-run the deployment
4. If PostHog integration needed, manually re-add variables from documentation

## Performance Impact

**Expected Impact**: none

No performance implications - this only affects environment configuration during deployment.

## Security Considerations

**Security Impact**: none

- Environment variables are already in Vercel (no new exposure)
- PostHog variables are analytics configuration, not secrets
- Deleting unused project reduces security surface area

## Validation Commands

### Before Fix (Bug Should Reproduce)

The failed workflow run is documented here:
- [Run #21252558567](https://github.com/MLorneSmith/2025slideheroes/actions/runs/21252558567)

Expected error: Build exits with code 1 due to missing PostHog env vars.

### After Fix (Bug Should Be Resolved)

```bash
# Trigger workflow re-run via GitHub Actions UI
# Navigate to: https://github.com/MLorneSmith/2025slideheroes/actions/workflows/deploy-dev.yml
# Click on the failed run and select "Re-run all jobs"

# Expected Result: Workflow succeeds, web app deploys successfully
```

**Expected Result**: All commands succeed, workflow completes successfully, app deploys to Vercel without errors.

### Regression Prevention

```bash
# After fix, verify no future deployments fail with same error
# Monitor: https://github.com/MLorneSmith/2025slideheroes/actions
# Check: Vercel deployment logs for "missing environment variable" errors
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

All tooling already exists (Vercel, GitHub Actions, etc.).

## Database Changes

**No database changes required**

This is purely environment configuration.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Manually copy env vars in Vercel UI (no automated deployment needed)
- Delete duplicate project (one-time manual action)
- Re-run failed workflow to verify fix

**Feature flags needed**: no

**Backwards compatibility**: maintained - No code changes, only configuration

## Success Criteria

The fix is complete when:
- [ ] PostHog environment variables exist in `2025slideheroes-web` project
- [ ] Duplicate `web` project is deleted from Vercel
- [ ] The previously failed workflow run succeeds when re-run
- [ ] No new "missing environment variable" errors appear in subsequent deployments
- [ ] PostHog analytics continue to work correctly

## Notes

This is a simple configuration fix with minimal risk. The root cause was a one-time accident during PostHog integration (duplicate project created). The fix prevents recurrence by removing the duplicate project.

Related documentation:
- [Vercel Deployment Guide](/.ai/ai_docs/context-docs/infrastructure/vercel-deployment.md) - Environment variables section
- [GitHub Actions Workflow](/.github/workflows/deploy-dev.yml) - Trigger workflow from here

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1717*
