# Bug Diagnosis: Deploy to Dev fails - PostHog env vars configured in wrong Vercel project

**ID**: ISSUE-1717
**Created**: 2026-01-22T14:50:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: error

## Summary

The "Deploy to Dev" workflow fails because PostHog environment variables were accidentally configured in the wrong Vercel project (`web`) instead of the correct project (`2025slideheroes-web`). This causes the Vercel build to fail with exit code 1 due to missing environment variables.

## Environment

- **Application Version**: commit 12d973c62
- **Environment**: CI/CD (Vercel build)
- **Browser**: N/A
- **Node Version**: N/A
- **Database**: N/A
- **Last Working**: 2026-01-21T19:38:26Z (before PostHog EU integration)

## Reproduction Steps

1. Push a commit to the `dev` branch
2. "Deploy to Dev" workflow triggers
3. Workflow deploys to Vercel project `2025slideheroes-web`
4. Vercel build runs `pnpm turbo run build --filter=web`
5. Build fails because PostHog environment variables are missing
6. Workflow fails with exit code 1

## Expected Behavior

The build should succeed with all required environment variables available from the correct Vercel project (`2025slideheroes-web`).

## Actual Behavior

Build fails with:
```
Error: Command "pnpm turbo run build --filter=web" exited with 1
```

The build succeeds locally because local `.env` files have the correct PostHog configuration.

## Diagnostic Data

### Console Output
```
Deploy Web App to Dev	Deploy to Vercel	2026-01-22T14:44:29.9864981Z Building
Deploy Web App to Dev	Deploy to Vercel	2026-01-22T14:44:31.6574242Z Building
Deploy Web App to Dev	Deploy to Vercel	2026-01-22T14:45:01.7445419Z Error: Command "pnpm turbo run build --filter=web" exited with 1
```

### Network Analysis
N/A - Build failure, not network issue

### Database Analysis
N/A - Not database related

### Performance Metrics
N/A

### Screenshots
N/A

## Error Stack Traces
```
Error: Command "pnpm turbo run build --filter=web" exited with 1
```

The full Vercel build log is not available in GitHub Actions output - only the final error is shown.

## Related Code
- **Affected Files**:
  - Vercel project configuration (external)
  - PostHog integration: `packages/plugins/analytics/posthog/`
- **Recent Changes**:
  - `cb0b79bb9` - feat(web): configure PostHog EU analytics integration
  - PostHog environment variables were set up during this change
- **Suspected Functions**: PostHog initialization requiring env vars at build time

## Related Issues & Context

### Direct Predecessors
- #1716 (OPEN): "Bug Diagnosis: Deploy to Dev workflow fails with GitHub 500 Internal Server Error" - Different root cause (transient GitHub outage), but same workflow failing

### Historical Context
- On 2026-01-21, PostHog EU analytics integration was configured
- During setup, a duplicate Vercel project named `web` was accidentally created
- PostHog environment variables (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, etc.) were configured in the wrong `web` project instead of `2025slideheroes-web`
- This caused all subsequent deployments to fail

## Root Cause Analysis

### Identified Root Cause

**Summary**: PostHog environment variables are configured in the wrong Vercel project (`web`) instead of the correct project (`2025slideheroes-web`).

**Detailed Explanation**:
When the PostHog EU analytics integration was set up on 2026-01-21, environment variables were accidentally added to a newly created `web` project in Vercel instead of the existing `2025slideheroes-web` project. The GitHub Actions workflow correctly deploys to `2025slideheroes-web` (via `VERCEL_PROJECT_ID_WEB` secret), but that project is missing the PostHog environment variables needed for the build.

**Supporting Evidence**:
- Build succeeds locally (has correct `.env` configuration)
- Build fails on Vercel with generic exit code 1
- User confirmed PostHog variables exist in wrong `web` project
- Timeline correlates with PostHog integration commit `cb0b79bb9`

### How This Causes the Observed Behavior

1. Developer pushes to `dev` branch
2. GitHub Actions workflow triggers
3. `vercel deploy` command runs against `2025slideheroes-web` project
4. Vercel pulls environment variables from `2025slideheroes-web` (missing PostHog vars)
5. Build starts with `pnpm turbo run build --filter=web`
6. PostHog initialization or Next.js config fails due to missing env vars
7. Build exits with code 1

### Confidence Level

**Confidence**: High

**Reasoning**:
- User directly confirmed the misconfiguration exists
- Timeline matches when PostHog was integrated
- Local builds succeed (proving code is correct)
- Only Vercel builds fail (proving env var issue)

## Fix Approach (High-Level)

1. **Copy PostHog environment variables** from Vercel project `web` to `2025slideheroes-web`:
   - `NEXT_PUBLIC_POSTHOG_KEY`
   - `NEXT_PUBLIC_POSTHOG_HOST`
   - `POSTHOG_PERSONAL_API_KEY` (if configured)
   - `POSTHOG_ENV_ID` (if configured)
   - Any other PostHog-related variables

2. **Delete the duplicate `web` project** from Vercel to prevent future confusion

3. **Re-run the failed workflow** to verify the fix

## Diagnosis Determination

Root cause confirmed: PostHog environment variables are in the wrong Vercel project. This is a configuration issue, not a code bug. The fix is to move the environment variables to the correct project.

## Additional Context

- The duplicate `web` project should be deleted after migrating the environment variables
- Consider documenting which Vercel project corresponds to which app to prevent future confusion
- The `VERCEL_PROJECT_ID_WEB` GitHub secret is correct - it points to `2025slideheroes-web`

---
*Generated by Claude Debug Assistant*
*Tools Used: gh CLI, Vercel CLI, workflow logs analysis*
