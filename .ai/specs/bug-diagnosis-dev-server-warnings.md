# Bug Diagnosis: Dev Server Startup Warnings

**ID**: ISSUE-pending (to be assigned)
**Created**: 2025-11-19T18:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: error

## Summary

When running `pnpm dev`, the development server displays multiple warnings related to Next.js 16 configuration deprecation, missing AWS SDK dependencies in the Payload app, and unconfigured image quality settings. While the apps still start successfully, these warnings indicate configuration issues that should be resolved for proper Next.js 16 compatibility and cleaner development experience.

## Environment

- **Application Version**: 3.62.1 (Payload)
- **Environment**: development
- **Node Version**: 22.16.0
- **pnpm Version**: 10.14.0
- **Next.js Version**: 16.0.3
- **Last Working**: Unknown (warnings may have existed since Next.js 16 upgrade)

## Reproduction Steps

1. Open terminal in project root
2. Run `pnpm dev`
3. Observe console output showing multiple warnings

## Expected Behavior

Development server should start without configuration warnings about deprecated options or missing dependencies.

## Actual Behavior

Development server displays:
1. Warning about deprecated `experimental.serverComponentsExternalPackages`
2. Repeated warnings about `@aws-sdk/client-s3` not being resolvable
3. Warning about image quality 85 not being configured

## Diagnostic Data

### Console Output
```
web:dev:  ⚠ Invalid next.config.mjs options detected:
web:dev:  ⚠     Unrecognized key(s) in object: 'serverComponentsExternalPackages' at "experimental"
web:dev:  ⚠ `experimental.serverComponentsExternalPackages` has been moved to `serverExternalPackages`. Please update your next.config.mjs file accordingly.

payload:dev: Package @aws-sdk/client-s3 can't be external
payload:dev: The request @aws-sdk/client-s3 matches serverExternalPackages (or the default list).
payload:dev: The request could not be resolved by Node.js from the project directory.
payload:dev: Try to install it into the project directory by running npm install @aws-sdk/client-s3 from the project directory.

web:dev: Image with src "/images/video-hero-preview.avif" is using quality "85" which is not configured in images.qualities [75]. Please update your config to [75, 85].
```

### Network Analysis
N/A - This is a configuration issue, not a runtime network problem.

### Database Analysis
N/A - Database connections work correctly as shown in logs.

### Performance Metrics
Apps still start successfully:
- web:dev: Ready in 885ms
- payload:dev: Ready in 355ms
- dev-tool:dev: Ready in 481ms

### Screenshots
N/A

## Error Stack Traces

No stack traces - these are configuration warnings, not runtime errors.

## Related Code

- **Affected Files**:
  - `apps/web/next.config.mjs` (lines 37, 73)
  - `apps/payload/package.json` (missing dependency)
  - `apps/web/app/(marketing)/page.tsx` (lines 112, 159)

- **Recent Changes**: `2c0d0bf7a` - Next.js 16, React 19.2, PNPM Catalogs upgrade

- **Suspected Functions**:
  - `getImagesConfig()` in `apps/web/next.config.mjs` (missing qualities array)
  - `experimental` object in `apps/web/next.config.mjs` (deprecated key)

## Related Issues & Context

### Direct Predecessors
None found - this appears to be new from the Next.js 16 upgrade.

### Related Infrastructure Issues
None found.

### Similar Symptoms
None found.

### Same Component
None found.

### Historical Context
These warnings likely appeared after the Next.js 16 upgrade in commit `2c0d0bf7a`. The project was updated to Next.js 16 which changed the location of `serverComponentsExternalPackages` from `experimental` to root-level `serverExternalPackages`.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Three distinct configuration issues causing dev server warnings after Next.js 16 upgrade.

**Detailed Explanation**:

#### Issue 1: Deprecated Next.js Config Key

**Location**: `apps/web/next.config.mjs:73`

The configuration file contains BOTH:
- Line 37: `serverExternalPackages: ["pino", "pino-pretty", "thread-stream"]` (correct)
- Line 73: `experimental.serverComponentsExternalPackages: ["pino", "pino-pretty", "thread-stream"]` (deprecated)

In Next.js 16, `experimental.serverComponentsExternalPackages` was moved to root-level `serverExternalPackages`. The code has both, but the deprecated one should be removed.

**Evidence**:
```javascript
// Line 37 (correct)
serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],

// Line 73 (deprecated - should be removed)
experimental: {
  serverComponentsExternalPackages: ["pino", "pino-pretty", "thread-stream"],
  ...
}
```

#### Issue 2: Missing AWS SDK Dependency

**Location**: `apps/payload/package.json`

The `@payloadcms/storage-s3@3.64.0` package requires `@aws-sdk/client-s3` as a peer dependency, but it's not listed in the payload app's dependencies. The package exists in node_modules through pnpm's hoisting, but Next.js Turbopack's `serverExternalPackages` resolution requires it to be directly installed in the project.

**Evidence**:
- `@payloadcms/storage-s3` is listed at version `^3.64.0` in dependencies
- `@aws-sdk/client-s3` is NOT listed as a dependency
- Warning explicitly states: "Try to install it into the project directory by running npm install @aws-sdk/client-s3 from the project directory"

#### Issue 3: Image Quality Not Configured

**Location**: `apps/web/app/(marketing)/page.tsx:112,159` and `apps/web/next.config.mjs`

Images use `quality={85}` but the Next.js images config doesn't define a `qualities` array. Next.js 16 requires explicit quality values to be configured.

**Evidence**:
```typescript
// apps/web/app/(marketing)/page.tsx:112
quality={85}

// apps/web/next.config.mjs - getImagesConfig() returns remotePatterns but no qualities
function getImagesConfig() {
  // No 'qualities' array defined
  return {
    remotePatterns,
  };
}
```

### How This Causes the Observed Behavior

1. **Deprecated key warning**: Next.js 16 validates config and warns about unrecognized experimental keys
2. **AWS SDK warning**: Turbopack sees `@aws-sdk/client-s3` in `serverExternalPackages` defaults but can't resolve it from project directory
3. **Image quality warning**: Next.js sees quality=85 used but only quality=75 is in the default qualities list

### Confidence Level

**Confidence**: High

**Reasoning**:
- The warnings explicitly state what needs to be fixed
- Code inspection confirms the exact lines causing each issue
- These are straightforward configuration problems with clear solutions

## Fix Approach (High-Level)

1. **Next.js config**: Remove `experimental.serverComponentsExternalPackages` from `apps/web/next.config.mjs:73` since the correct `serverExternalPackages` already exists at line 37.

2. **AWS SDK dependency**: Add `@aws-sdk/client-s3` to `apps/payload/package.json` dependencies, matching the version used by `@payloadcms/storage-s3`.

3. **Image quality**: Add `qualities: [75, 85]` to the images config in `getImagesConfig()` in `apps/web/next.config.mjs`.

## Diagnosis Determination

All three root causes have been conclusively identified through code inspection and are straightforward configuration fixes. The warnings are non-blocking (apps still work) but should be resolved for:
- Clean developer experience
- Proper Next.js 16 compatibility
- Future-proofing against deprecation removal

## Additional Context

- The Makerkit version is 6 commits behind upstream, which may contain fixes for some of these issues
- These warnings appear on every page load in the Payload admin, creating significant console noise
- The project recently upgraded to Next.js 16 in commit `2c0d0bf7a`

---
*Generated by Claude Debug Assistant*
*Tools Used: Read (next.config.mjs files, package.json), Grep (quality search), Bash (git log)*
