# Chore: Setup @posthog/nextjs-config for source maps

## Chore Description

This chore integrates PostHog's `@posthog/nextjs-config` package into the Next.js 16 build pipeline to automatically handle source map injection, uploading, and cleanup for production error tracking. This enables PostHog to de-minify stack traces in production, making debugging production errors significantly easier.

The integration will:
- Automatically enable source map generation during the Next.js build
- Inject metadata into bundled JavaScript files for error tracking
- Upload source maps to PostHog's servers during CI/CD
- Remove source maps from the production deployment (they contain your source code)
- Provide type-safe event tracking through schema generation

## Relevant Files

**Configuration:**
- `apps/web/next.config.mjs` - Next.js configuration where PostHog integration hooks in
- `apps/web/package.json` - Dependencies management for @posthog/nextjs-config package
- `apps/web/.env.example` - Environment variables template

**Build & Deployment:**
- `.github/workflows/*.yml` - CI/CD pipelines that need to be updated for source map uploads
- `vercel.json` (if exists) - Vercel-specific configuration

**Documentation:**
- `CLAUDE.md` (root) - Project guide to be updated with PostHog integration notes
- `apps/web/CLAUDE.md` - Web app specific instructions

### New Files

No new files need to be created. The integration is purely a configuration update to `next.config.mjs` and environment setup.

## Impact Analysis

### Dependencies Affected
- **Direct**: `@posthog/nextjs-config` (new dependency)
- **Transitive**: PostHog SDK is already used in the app, this just extends it for error tracking
- **CI/CD**: GitHub Actions workflows will need environment variable configuration
- **Build process**: Next.js build step will be enhanced but not fundamentally changed

### Risk Assessment

**Risk Level: Low**

- **Simple integration**: `@posthog/nextjs-config` is a drop-in wrapper for `next.config.mjs`
- **Well-tested package**: PostHog provides official Next.js integration
- **Isolated changes**: Doesn't affect existing application code or data models
- **No breaking changes**: Purely additive - adds source map handling without modifying existing build behavior
- **Easy rollback**: Can be disabled by removing the wrapper if needed

### Backward Compatibility

- Completely backward compatible
- Existing build behavior unchanged (only enhanced with source map handling)
- No changes to application logic, API, or data structures
- No migration path needed - works immediately after setup

## Pre-Chore Checklist

Before starting implementation:
- [ ] Review PostHog documentation for Next.js integration
- [ ] Verify PostHog project credentials are available (API token, environment ID)
- [ ] Check if source maps are currently being generated in builds
- [ ] Identify where CI/CD environment variables should be stored (GitHub secrets)
- [ ] Confirm staging and production environment IDs are available

## Documentation Updates Required

- **CLAUDE.md (root)**: Add PostHog source map setup instructions to project guide
- **apps/web/CLAUDE.md**: Add PostHog-specific configuration notes
- **.env.example**: Add PostHog environment variable templates
- **GitHub Actions workflows**: Document source map upload setup in CI/CD section

## Rollback Plan

If issues arise:

1. **Disable PostHog wrapper**: Remove `withPostHog()` wrapper from `next.config.mjs`, keep base config
2. **Revert package.json**: Remove `@posthog/nextjs-config` and run `pnpm install`
3. **Remove environment variables**: Delete PostHog-related secrets from GitHub
4. **No database impact**: Zero database changes, no migrations to rollback

**Monitoring**: Watch build logs and production errors to ensure source maps are being uploaded correctly after deployment.

## Step by Step Tasks

### 1. Install and Configure @posthog/nextjs-config

- [ ] Install package: `pnpm --filter web add @posthog/nextjs-config`
- [ ] Update `apps/web/next.config.mjs` to wrap config with `withPostHog()`
- [ ] Add PostHog configuration options (API key, environment ID, host URL)
- [ ] Verify configuration doesn't break existing Next.js build

### 2. Set Up Environment Variables

- [ ] Add to `.env.example` for local development:
  - `POSTHOG_API_KEY` - PostHog API key for local development
  - `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL (optional, defaults to cloud)
  - `POSTHOG_CLI_ENV_ID` - PostHog project/environment ID
- [ ] Document which variables are required vs optional
- [ ] Verify environment variables load correctly in local dev

### 3. Configure GitHub Actions CI/CD

- [ ] Add PostHog credentials to GitHub repository secrets:
  - `POSTHOG_API_KEY_STAGING`
  - `POSTHOG_API_KEY_PRODUCTION`
  - `POSTHOG_ENV_ID_STAGING`
  - `POSTHOG_ENV_ID_PRODUCTION`
- [ ] Update build workflows to pass PostHog environment variables to build process
- [ ] Ensure CI/CD doesn't attempt uploads in pull request builds (only main branch)
- [ ] Verify source maps are uploaded after successful builds

### 4. Test Local Build

- [ ] Build application locally: `pnpm --filter web build`
- [ ] Verify build completes successfully
- [ ] Check that source maps are generated in `.next` directory
- [ ] Verify no security warnings or build errors introduced

### 5. Test Build Output

- [ ] Run `pnpm typecheck` to ensure no TypeScript errors
- [ ] Run `pnpm lint` to ensure code quality standards
- [ ] Run `pnpm format` to ensure consistent formatting
- [ ] Build and verify in test environment matches production configuration

### 6. Update Documentation

- [ ] Update root `CLAUDE.md` with PostHog source map setup section
- [ ] Update `apps/web/CLAUDE.md` with environment variable reference
- [ ] Add troubleshooting section for common PostHog CLI issues
- [ ] Document how to test source maps in production errors

### 7. Validation Commands

Execute every command to validate the chore is complete with zero regressions:

```bash
# Verify package installation
pnpm --filter web ls @posthog/nextjs-config

# Verify Next.js configuration builds without errors
pnpm --filter web build

# Verify TypeScript passes
pnpm typecheck

# Verify linting passes
pnpm lint

# Verify formatting passes
pnpm format
```

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# Verify package is installed correctly
pnpm --filter web ls | grep posthog

# Build application to ensure PostHog integration doesn't break build
pnpm --filter web build

# Run typecheck to ensure no TypeScript errors introduced
pnpm typecheck

# Run linter to ensure code quality
pnpm lint

# Run formatter to ensure consistent formatting
pnpm format

# Run full code quality check
pnpm codecheck

# Test dev server starts correctly with PostHog config
pnpm --filter web dev:test &
# Let it start, then:
sleep 5
# Kill the test server
pkill -f "next dev"
```

## Notes

### Why @posthog/nextjs-config vs PostHog CLI?

The `@posthog/nextjs-config` package is the recommended approach for Next.js apps:
- **Automatic**: Hooks into the Next.js build process, no manual commands needed
- **Integrated**: Works with Vercel deployments out of the box
- **Simpler**: Single configuration point in `next.config.mjs`
- **CLI Alternative**: The CLI would require manual commands in build scripts, less reliable in CI/CD

### Source Map Security

Source maps contain your original source code. The integration ensures:
1. Maps are generated during build (needed for minified code mapping)
2. Maps are uploaded to PostHog's secure servers (private, not public)
3. Maps are deleted from production deployments (prevents public exposure)
4. Only PostHog can access them when errors occur in your app

### PostHog Features Enabled

After this setup, you get:
- **De-minified stack traces**: Errors show original file paths and line numbers
- **Source code links**: Jump from errors to exact code locations
- **Session recordings**: See user actions leading up to errors
- **Error trends**: Track which errors are most impactful
- **Source map schema generation** (experimental): Type-safe event tracking

### Environment-Specific Configuration

For local development:
- Source maps are generated but NOT uploaded to production (uses test key)
- Allows testing the integration without affecting real PostHog project

For staging/production:
- Source maps generated and uploaded with appropriate credentials
- Different PostHog projects can be used for each environment
