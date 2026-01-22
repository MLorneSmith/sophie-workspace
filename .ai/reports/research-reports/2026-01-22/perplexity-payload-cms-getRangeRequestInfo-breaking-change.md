# Perplexity Research: Payload CMS 3.72.0 getRangeRequestInfo Breaking Change

**Date**: 2026-01-22
**Agent**: perplexity-expert
**Search Type**: Chat API / Search API (combined)

## Query Summary

Investigated the error "Attempted import error: 'getRangeRequestInfo' is not exported from 'payload/internal'" occurring when using `@payloadcms/next` version 3.72.0 with `payload` version 3.70.0.

## Findings

### What the Breaking Change Is

The `getRangeRequestInfo` function is a new utility introduced in Payload CMS 3.72.0 for handling HTTP Range requests according to RFC 7233. This function is located at:

- **Source file**: `payload/src/uploads/getRangeRequestInfo.ts`
- **Export path**: `payload/dist/uploads/getRangeRequestInfo.js`
- **Import path used by dependent packages**: `payload/internal`

The function provides HTTP Range request handling for partial content responses (HTTP 206), which is used for features like:
- Streaming large file uploads
- Resumable downloads
- Partial content serving for media files

When `@payloadcms/next@3.72.0` attempts to import `getRangeRequestInfo` from `payload/internal`, it fails if the `payload` package is at version 3.70.0 or earlier because the function was not yet exported in those versions.

### Version Compatibility Requirements

**CRITICAL**: All `payload` and `@payloadcms/*` packages MUST be on exactly the same version.

| Package | Required Version for 3.72.0 Compatibility |
|---------|-------------------------------------------|
| `payload` | 3.72.0 |
| `@payloadcms/next` | 3.72.0 |
| `@payloadcms/ui` | 3.72.0 |
| `@payloadcms/db-mongodb` | 3.72.0 |
| `@payloadcms/db-postgres` | 3.72.0 |
| `@payloadcms/richtext-lexical` | 3.72.0 |
| All other `@payloadcms/*` packages | 3.72.0 |

### Root Cause

The error occurs due to version mismatch between Payload packages:
- `@payloadcms/next@3.72.0` imports `getRangeRequestInfo` from `payload/internal`
- `payload@3.70.0` does not export this function (it was added in 3.71.x or 3.72.0)
- This causes a runtime import error

### How to Fix the Incompatibility

#### Option 1: Update All Packages to 3.72.0 (Recommended)

1. **Remove version prefixes** (^, ~) from all Payload packages in `package.json`:
   ```json
   {
     "dependencies": {
       "payload": "3.72.0",
       "@payloadcms/next": "3.72.0",
       "@payloadcms/ui": "3.72.0",
       "@payloadcms/db-mongodb": "3.72.0",
       "@payloadcms/richtext-lexical": "3.72.0"
     }
   }
   ```

2. **Clean install**:
   ```bash
   # Delete node_modules and lockfile, then reinstall
   pnpm install
   ```

3. **Clear Next.js cache**:
   ```bash
   # Delete .next folder to clear build cache
   ```

4. **Verify versions**:
   ```bash
   pnpm list payload @payloadcms/next @payloadcms/ui
   ```

#### Option 2: Downgrade All Packages to 3.70.0

If you need to stay on 3.70.0 for compatibility reasons:

1. **Pin all packages to 3.70.0**:
   ```json
   {
     "dependencies": {
       "payload": "3.70.0",
       "@payloadcms/next": "3.70.0",
       "@payloadcms/ui": "3.70.0"
     }
   }
   ```

2. **Clean install** (same steps as above)

#### Option 3: For Monorepos with Version Conflicts

For pnpm workspaces or other monorepo setups:

1. **Install Payload packages at the monorepo root** to ensure single installation

2. **Use pnpm overrides** if needed:
   ```json
   {
     "pnpm": {
       "overrides": {
         "payload": "3.72.0",
         "@payloadcms/*": "3.72.0"
       }
     }
   }
   ```

3. **For npm/yarn, use resolutions**:
   ```json
   {
     "resolutions": {
       "payload": "3.72.0"
     }
   }
   ```

### Payload 3.72.0 Release Notes Summary

Version 3.72.0 (released 2026-01-16) included:

**Features:**
- Experimental `localizeStatus` option for per-locale publication status
- `depth` parameter support in plugin-mcp tools
- HTTP Range request support (`getRangeRequestInfo` function)

**Bug Fixes:**
- `thumbnailURL` hook improvements
- `isValidID` validation fixes
- `select` in `findByID` with `draft: true` fixes
- Various UI and database fixes

### Prevention

To avoid future version mismatch issues:

1. **Never use caret (^) or tilde (~) prefixes** for Payload packages
2. **Always update all Payload packages together** to the same version
3. **Use `pnpm` over npm/yarn** for better dependency isolation
4. **Check the GitHub releases page** before upgrading: https://github.com/payloadcms/payload/releases

## Sources & Citations

- UNPKG - payload@3.72.0 getRangeRequestInfo source: https://app.unpkg.com/payload@3.72.0/files/dist/uploads/getRangeRequestInfo.js.map
- Payload CMS Troubleshooting - Fixing Dependency Issues: https://payloadcms.com/docs/troubleshooting/troubleshooting
- NewReleases.io - Payload v3.72.0 Release Notes: https://newreleases.io/project/github/payloadcms/payload/release/v3.72.0
- GitHub - Payload CMS Releases: https://github.com/payloadcms/payload/releases
- GitHub - Payload CMS Issues #10512 (version mismatch): https://github.com/payloadcms/payload/issues/10512
- NLV Codes - Upgrading Payload from 3.65 to 3.72: https://www.youtube.com/watch?v=dDYkQ-fXJvw

## Key Takeaways

- **Root Cause**: Version mismatch between `payload` (3.70.0) and `@payloadcms/next` (3.72.0)
- **The Function**: `getRangeRequestInfo` was added in 3.71.x/3.72.0 for HTTP Range request handling
- **Required Fix**: All `payload` and `@payloadcms/*` packages must be on version 3.72.0
- **Best Practice**: Pin exact versions without ^ or ~ prefixes
- **Tool Recommendation**: Use pnpm for better dependency management

## Related Searches

- Payload CMS 3.73.0+ breaking changes (for future upgrades)
- Payload CMS monorepo configuration best practices
- Next.js 16 + Payload CMS compatibility status
