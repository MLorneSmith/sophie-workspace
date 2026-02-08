# Bug Diagnosis: Staging Deploy Fails Due to Missing Environment Variables

**ID**: ISSUE-pending
**Created**: 2025-12-05T18:52:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The staging deployment workflow (`staging-deploy.yml`) fails during the "Full Test Suite" job at the "Build application" step. The Next.js build fails because required environment variables (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PRODUCT_NAME`, `EMAIL_SENDER`) are not set, and the Supabase environment variable extraction returns empty values.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions staging deployment)
- **Node Version**: Latest LTS (per setup-deps action)
- **Database**: Supabase (local instance in CI)
- **Last Working**: Unknown (workflow may have always had this issue)
- **Workflow Run**: https://github.com/slideheroes/2025slideheroes/actions/runs/19972690271

## Reproduction Steps

1. Push code to the `staging` branch
2. The `staging-deploy.yml` workflow triggers
3. The "Full Test Suite" job runs
4. Supabase services start successfully
5. The "Export Supabase environment variables" step runs but extracts empty values
6. The "Build application" step (`pnpm turbo build:test --filter=web`) fails with Zod validation errors

## Expected Behavior

The build should succeed with all required environment variables properly set:
- `NEXT_PUBLIC_SUPABASE_URL` - Extracted from local Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Extracted from local Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Extracted from local Supabase
- `NEXT_PUBLIC_SITE_URL` - Should be set for the build
- `NEXT_PUBLIC_PRODUCT_NAME` - Should be set for the build
- `EMAIL_SENDER` - Should be set for the build

## Actual Behavior

Build fails with multiple Zod validation errors:

```
Error: Failed to collect configuration for /join
[cause]: Error [ZodError]: [
  {
    "expected": "string",
    "code": "invalid_type",
    "path": ["siteURL"],
    "message": "Invalid input: expected string, received undefined"
  },
  {
    "origin": "string",
    "code": "too_small",
    "minimum": 1,
    "path": ["productName"],
    "message": "NEXT_PUBLIC_PRODUCT_NAME is required"
  },
  {
    "expected": "string",
    "code": "invalid_type",
    "path": ["emailSender"],
    "message": "Invalid input: expected string, received undefined"
  }
]
```

## Diagnostic Data

### Console Output

From workflow logs:
```
✅ Exported NEXT_PUBLIC_SUPABASE_URL=
✅ Exported NEXT_PUBLIC_SUPABASE_ANON_KEY=...
✅ Exported SUPABASE_SERVICE_ROLE_KEY=...
```

The Supabase URL is empty, and the keys show only "..." (meaning they're also empty since the truncation shows nothing before the ellipsis).

### Supabase Status Parsing Issue

The workflow uses this command to extract Supabase URL:
```bash
SUPABASE_URL=$(npx supabase status | grep "API URL" | awk '{print $3}')
```

This parsing likely fails because:
1. The Supabase CLI output format may have changed
2. The `grep "API URL"` pattern may not match the actual output
3. The field position (`$3`) may be incorrect

### Missing Build-Time Environment Variables

The workflow's `env:` block only sets:
- `SUPABASE_DB_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ENABLE_BILLING_TESTS`
- `DO_NOT_TRACK`

It does NOT set:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_PRODUCT_NAME`
- `EMAIL_SENDER`

## Error Stack Traces

```
Error: Failed to collect configuration for /join
    at ignore-listed frames {
  [cause]: Error [ZodError]: [
    {
      "expected": "string",
      "code": "invalid_type",
      "path": ["siteURL"],
      "message": "Invalid input: expected string, received undefined"
    },
    ...
  ]
      at module evaluation (.next/server/chunks/ssr/78e4a_team-accounts_src_server_actions_team-invitations-server-actions_ts_12502c77._.js:1:4557)
```

## Related Code

- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 155-171, 180-181)
  - `packages/features/team-accounts/src/server/services/account-invitations-dispatcher.service.ts` (lines 11-31)
  - `packages/otp/src/server/otp-email.service.ts` (lines 6-14)
  - `packages/features/admin/src/lib/server/services/admin-auth-user.service.ts` (line 187)

- **Recent Changes**: The `staging` branch was force-pushed to match `dev` after being 470 commits behind

- **Suspected Functions**:
  - Zod schema validation at module load time in `account-invitations-dispatcher.service.ts`
  - Environment variable extraction in `staging-deploy.yml`

## Related Issues & Context

### Direct Predecessors
None found - this appears to be a configuration issue that may have existed since the workflow was created or was introduced by recent changes.

### Similar Symptoms
The error pattern (Zod validation of env vars at build time) could affect any build that doesn't have proper environment variables set.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The staging deployment workflow fails because it doesn't set required build-time environment variables (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PRODUCT_NAME`, `EMAIL_SENDER`) and the Supabase status parsing returns empty values.

**Detailed Explanation**:

1. **Primary Issue - Missing Build Environment Variables**: The `staging-deploy.yml` workflow's `test-full` job does not define `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PRODUCT_NAME`, or `EMAIL_SENDER` in its `env:` block. These are required at build time by:
   - `packages/features/team-accounts/src/server/services/account-invitations-dispatcher.service.ts` (lines 11-31)
   - `packages/otp/src/server/otp-email.service.ts` (lines 6-14)
   - `packages/features/admin/src/lib/server/services/admin-auth-user.service.ts` (line 187)

2. **Secondary Issue - Supabase URL Extraction Failure**: The script at lines 159-161 attempts to parse `npx supabase status` output but returns empty values. The logs show `NEXT_PUBLIC_SUPABASE_URL=` (empty).

**Supporting Evidence**:
- Workflow logs show: `✅ Exported NEXT_PUBLIC_SUPABASE_URL=` (empty value)
- Build error explicitly states: `"message": "NEXT_PUBLIC_PRODUCT_NAME is required"`
- Build error explicitly states: `"path": ["siteURL"], "message": "Invalid input: expected string, received undefined"`
- The `env:` block in `staging-deploy.yml` (lines 125-132) does not include these variables

### How This Causes the Observed Behavior

1. Workflow starts Supabase services successfully
2. "Export Supabase environment variables" step runs but parsing fails, resulting in empty values
3. "Build application" step runs `pnpm turbo build:test --filter=web`
4. Next.js build starts collecting page configurations
5. When loading `/join` route, it imports `account-invitations-dispatcher.service.ts`
6. This file has module-level Zod validation that runs immediately on import
7. The Zod schema requires `siteURL`, `productName`, and `emailSender` to be non-empty strings
8. Since these env vars are undefined/empty, Zod throws `ZodError`
9. Next.js reports: "Failed to collect configuration for /join"
10. Build fails with exit code 1

### Confidence Level

**Confidence**: High

**Reasoning**: The error messages directly state which environment variables are missing. The workflow configuration clearly shows these variables are not set. The code at `account-invitations-dispatcher.service.ts:15-31` shows the exact Zod schema that validates these variables at module load time.

## Fix Approach (High-Level)

1. **Add missing environment variables to the workflow**: Add `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PRODUCT_NAME`, and `EMAIL_SENDER` to the `env:` block of the `test-full` job. These can be hardcoded for CI (e.g., `http://localhost:3000`, `SlideHeroes`, `noreply@slideheroes.com`) or pulled from GitHub secrets/variables.

2. **Fix Supabase status parsing**: Update the script to handle the current Supabase CLI output format. Consider using `npx supabase status -o json` for more reliable parsing.

Example fix for the env block:
```yaml
env:
  NEXT_PUBLIC_SITE_URL: http://localhost:3000
  NEXT_PUBLIC_PRODUCT_NAME: SlideHeroes
  EMAIL_SENDER: noreply@slideheroes.com
  # ... existing vars
```

## Diagnosis Determination

The staging deployment fails due to missing required environment variables at build time. The root cause is a configuration gap in the `staging-deploy.yml` workflow where three critical environment variables (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PRODUCT_NAME`, `EMAIL_SENDER`) are not defined. Additionally, the Supabase URL extraction is failing, though this may be a secondary issue if the primary env vars are fixed.

## Additional Context

- The `dev-integration-tests.yml` workflow does NOT build locally - it tests against the deployed URL, which is why it doesn't hit this issue
- The `dev-deploy.yml` workflow uses Vercel for building, which has these environment variables configured in the Vercel project settings
- This issue specifically affects the "Full Test Suite" job which attempts to build and run tests locally in CI

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, grep, read, bash*
