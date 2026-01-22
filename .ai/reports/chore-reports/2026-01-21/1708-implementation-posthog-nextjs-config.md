## ✅ Implementation Complete

### Summary
- Added `@posthog/nextjs-config` package to enable automatic source map handling
- Wrapped `next.config.mjs` with `withPostHogConfig()` for source map uploads
- Source maps only upload when `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_ENV_ID` are set (CI/CD only)
- Added environment variable documentation to `.env.local.example`

### Additional Fix: PostHog Analytics Client/Server Split
Fixed a **pre-existing build issue** where `posthog-node` (server-side package) was being bundled into client components, breaking Turbopack production builds.

**Root Cause:** The `@kit/posthog` package mixed client and server code in a single file, causing Turbopack to try bundling Node.js APIs (like `node:fs`) into browser bundles.

**Solution:** Split the posthog package into proper client/server exports:
- `packages/plugins/analytics/posthog/src/client.ts` - Browser-only code (posthog-js)
- `packages/plugins/analytics/posthog/src/server.ts` - Server-only code (posthog-node)
- `packages/plugins/analytics/posthog/src/index.ts` - Re-exports client code

### Files Changed
```
 apps/web/.env.local.example                      |  11 +-
 apps/web/next.config.mjs                         |  20 +-
 packages/analytics/src/index.ts                  |  10 +-
 packages/analytics/src/server.ts                 |  12 +-
 packages/plugins/analytics/posthog/src/client.ts | 138 +++++++++++++
 packages/plugins/analytics/posthog/src/index.ts  | 238 +----------------------
 packages/plugins/analytics/posthog/src/server.ts | 153 +++++++++++++++
 7 files changed, 340 insertions(+), 242 deletions(-)
```

### Validation Results
✅ All validation commands passed successfully:
- `pnpm --filter web build` - Build completed without errors
- `pnpm typecheck` - All packages pass TypeScript checks
- `pnpm lint` - No errors (11 warnings from unrelated files)
- `pnpm format:fix` - Formatting applied

### Next Steps (CI/CD Setup)
To enable source map uploads in production:

1. Generate a PostHog Personal API Key at https://eu.posthog.com/settings/user-api-keys
2. Get your Environment ID from https://eu.posthog.com/settings/environment-variables
3. Add these secrets to GitHub:
   - `POSTHOG_PERSONAL_API_KEY`
   - `POSTHOG_ENV_ID`
4. Pass these to the build step in your CI/CD workflow

---
*Implementation completed by Claude*
