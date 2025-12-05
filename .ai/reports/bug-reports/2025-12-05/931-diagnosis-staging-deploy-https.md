# Bug Diagnosis: Staging Deploy Fails with HTTPS URL Validation Error

**ID**: ISSUE-pending
**Created**: 2025-12-05T19:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The staging deployment workflow fails during the "Full Test Suite" job at the "Build application" step. The Zod schema validation requires an HTTPS URL for `NEXT_PUBLIC_SITE_URL`, but the previous fix (#930) set it to `http://localhost:3000`. Additionally, the `NEXT_PUBLIC_CI` environment variable that would bypass this check is not set.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions staging deploy)
- **Node Version**: 20.x (via setup-node)
- **Last Working**: Unknown (staging deploys have been failing)
- **Workflow**: `.github/workflows/staging-deploy.yml`

## Reproduction Steps

1. Push to `staging` branch to trigger the staging deploy workflow
2. Wait for the `test-full` job to reach the "Build application" step
3. Build fails with Zod validation error

## Expected Behavior

The `test-full` job should successfully build the application with the provided environment variables.

## Actual Behavior

The build fails with multiple ZodError instances:
```
Error [ZodError]: [
  {
    "code": "custom",
    "path": ["url"],
    "message": "Please provide a valid HTTPS URL. Set the variable NEXT_PUBLIC_SITE_URL with a valid URL, such as: 'https://example.com'"
  }
]
```

## Diagnostic Data

### Console Output
```
Full Test Suite	Build application	2025-12-05T19:20:06.7907273Z  ✓ Compiled successfully in 19.8s
Full Test Suite	Build application	2025-12-05T19:20:06.7907517Z    Skipping validation of types
Full Test Suite	Build application	2025-12-05T19:20:06.7907765Z    Collecting page data using 3 workers ...
Full Test Suite	Build application	2025-12-05T19:20:06.7908012Z Error [ZodError]: [
Full Test Suite	Build application	2025-12-05T19:20:06.7908182Z   {
Full Test Suite	Build application	2025-12-05T19:20:06.7908345Z     "code": "custom",
Full Test Suite	Build application	2025-12-05T19:20:06.7908522Z     "path": [
Full Test Suite	Build application	2025-12-05T19:20:06.7908684Z       "url"
Full Test Suite	Build application	2025-12-05T19:20:06.7908839Z     ],
Full Test Suite	Build application	2025-12-05T19:20:06.7909262Z     "message": "Please provide a valid HTTPS URL..."
Full Test Suite	Build application	2025-12-05T19:20:06.7909662Z   }
Full Test Suite	Build application	2025-12-05T19:20:06.7909807Z ]
```

### Environment Variables Set
```yaml
NEXT_PUBLIC_SITE_URL: http://localhost:3000  # ← Set in fix #930, but HTTP not HTTPS
NEXT_PUBLIC_PRODUCT_NAME: SlideHeroes
EMAIL_SENDER: noreply@slideheroes.com
# NEXT_PUBLIC_CI: NOT SET ← Missing, would bypass HTTPS check
```

## Error Stack Traces
```
Error [ZodError]: [{"code":"custom","path":["url"],"message":"Please provide a valid HTTPS URL..."}]
    at module evaluation (.next/server/chunks/[root-of-the-server]__f7a029d6._.js:1:9450)
    at instantiateModule (.next/server/chunks/[turbopack]_runtime.js:715:9)
    ...
```

Multiple routes affected: `/sitemap.xml`, `/robots.txt`, `/_not-found`

## Related Code

- **Affected Files**:
  - `.github/workflows/staging-deploy.yml` (lines 125-136) - Missing `NEXT_PUBLIC_CI`
  - `apps/web/config/app.config.ts` (lines 52-66) - Zod schema with HTTPS validation

- **Recent Changes**:
  - Commit `02b4381e3` - Added `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PRODUCT_NAME`, `EMAIL_SENDER` but with HTTP URL

- **Suspected Functions**:
  - `AppConfigSchema.refine()` in `apps/web/config/app.config.ts:52-66`

## Related Issues & Context

### Direct Predecessors
- #930 (CLOSED): "Bug Fix: Staging Deploy Fails Due to Missing Environment Variables" - Added the env vars but with wrong URL protocol
- #929: Related diagnosis issue

### Same Component
- Issues affecting `.github/workflows/staging-deploy.yml`

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `NEXT_PUBLIC_CI` environment variable is not set in the staging deploy workflow, causing the HTTPS URL validation to be enforced during builds.

**Detailed Explanation**:

The validation logic in `apps/web/config/app.config.ts:52-66`:

```typescript
.refine(
  (schema) => {
    const isCI = process.env.NEXT_PUBLIC_CI;

    if (isCI ?? !schema.production) {
      return true;  // Skip HTTPS check
    }

    return !schema.url.startsWith("http:");  // Enforce HTTPS
  },
  ...
)
```

The condition `isCI ?? !schema.production` works as follows:
1. If `NEXT_PUBLIC_CI` is set to any value (including empty string), use that value
2. If `NEXT_PUBLIC_CI` is `undefined`, fall back to `!schema.production`

During Next.js builds, `NODE_ENV` is **always forced to `production`** regardless of what you set (this is Next.js behavior). So:
- `schema.production = true` (because NODE_ENV=production during build)
- `!schema.production = false`
- `isCI` is `undefined` (not set in workflow)
- The condition evaluates to `false`, triggering HTTPS enforcement

The previous fix (#930) set `NEXT_PUBLIC_SITE_URL: http://localhost:3000` (HTTP), but the schema requires HTTPS when the CI bypass isn't active.

**Supporting Evidence**:
- Stack trace shows error in `app.config.ts` during module evaluation
- Error message exactly matches the schema's custom message at line 63
- The workflow logs show `NEXT_PUBLIC_CI` is not in the environment variables list

### How This Causes the Observed Behavior

1. GitHub Actions runs `pnpm turbo build:test --filter=web`
2. Next.js starts build with `NODE_ENV=production` (Next.js default behavior)
3. `apps/web/config/app.config.ts` is loaded
4. Zod schema parses environment variables
5. `NEXT_PUBLIC_CI` is undefined, so condition falls to `!production` = `false`
6. HTTPS check runs: `!schema.url.startsWith("http:")` → `!"http://localhost:3000".startsWith("http:")` → `!true` → `false`
7. Validation fails, throws ZodError
8. Build crashes during "Collecting page data" phase

### Confidence Level

**Confidence**: High

**Reasoning**:
- The error message exactly matches the schema validation message
- The logic path is deterministic and can be traced through the code
- The missing `NEXT_PUBLIC_CI` variable is clearly visible in the workflow env dump
- This is a known pattern used elsewhere in the codebase (`next.config.mjs:64`, `billing-gateway-provider-factory.ts:20`)

## Fix Approach (High-Level)

Add `NEXT_PUBLIC_CI: true` to the `test-full` job's `env:` block in `.github/workflows/staging-deploy.yml`. This will:
1. Set `process.env.NEXT_PUBLIC_CI` to "true" (truthy string)
2. The condition `isCI ?? !schema.production` will evaluate `isCI` first
3. Since "true" is truthy, the refinement returns `true` (skip HTTPS check)
4. The HTTP URL `http://localhost:3000` will be accepted

Alternative: Change `NEXT_PUBLIC_SITE_URL` to an HTTPS URL like `https://localhost:3000` or `https://staging.slideheroes.com`, but the CI flag approach is more correct for test builds.

## Diagnosis Determination

Root cause confirmed: Missing `NEXT_PUBLIC_CI=true` environment variable in the staging deploy workflow's `test-full` job causes Zod schema to enforce HTTPS URL validation, rejecting the `http://localhost:3000` value.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view --log-failed, grep, read*
