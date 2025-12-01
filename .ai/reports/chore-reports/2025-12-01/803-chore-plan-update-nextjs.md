# Chore: Update Next.js from 16.0.3 to 16.0.6

## Chore Description
Update Next.js and related `@next/*` packages from version 16.0.3 to 16.0.6 across the monorepo. This is a patch update that includes bug fixes backported from the main branch:

**Changes in 16.0.4:**
- fix: Rename proxy.js to middleware.js in NFT file
- fix: prevent fetch abort errors propagating to user error boundaries
- Turbopack: fix passing project options from napi

**Changes in 16.0.5:**
- fix(nodejs-middleware): await for body cloning to be properly finalized

**Changes in 16.0.6:**
- Bumps browserslist version to silence a warning in CI

## Relevant Files
Use these files to resolve the chore:

- **pnpm-workspace.yaml** - Contains the pnpm catalog with centralized Next.js version (currently 16.0.3)
- **apps/web/package.json** - Main web app, uses `next: "16.0.3"` and `@next/bundle-analyzer: "16.0.3"`
- **apps/payload/package.json** - Payload CMS app, uses `next: "16.0.3"`
- **apps/dev-tool/package.json** - Dev tool app, uses `next: "16.0.3"`
- **packages/ui/package.json** - UI package, uses `next: "16.0.3"`
- **packages/next/package.json** - Next utilities package, uses `next: "16.0.3"`
- **packages/i18n/package.json** - i18n package, uses `next: "16.0.3"`
- **packages/supabase/package.json** - Supabase package, uses `next: "16.0.3"`
- **packages/features/admin/package.json** - Admin feature, uses `next: "16.0.3"`
- **packages/features/accounts/package.json** - Accounts feature, uses `next: "16.0.3"`
- **packages/features/team-accounts/package.json** - Team accounts feature, uses `next: "16.0.3"`
- **packages/plugins/testimonial/package.json** - Testimonial plugin, uses `next: "16.0.3"`
- **packages/features/auth/package.json** - Auth feature, uses `next: "catalog:"`
- **packages/billing/stripe/package.json** - Stripe billing, uses `next: "catalog:"`
- **packages/billing/lemon-squeezy/package.json** - Lemon Squeezy billing, uses `next: "catalog:"`
- **packages/billing/gateway/package.json** - Billing gateway, uses `next: "catalog:"`
- **tooling/eslint/package.json** - ESLint config, uses `@next/eslint-plugin-next: "16.0.3"`

## Impact Analysis
This is a routine patch update with minimal risk. The changes are primarily bug fixes with no breaking changes.

### Dependencies Affected
- All Next.js apps (web, payload, dev-tool) will use the updated version
- All packages with Next.js peer dependencies will be compatible
- `@next/bundle-analyzer` should be updated to 16.0.6 for version alignment
- `@next/eslint-plugin-next` should be updated to 16.0.6 for version alignment
- `eslint-config-next` should be updated to 16.0.6 for version alignment

### Risk Assessment
**Low Risk**: This is a patch update containing only bug fixes:
- No breaking changes documented
- Bug fixes are isolated and well-tested
- Browserslist update is cosmetic (silences CI warnings)

### Backward Compatibility
- Full backward compatibility expected
- No migration required
- No deprecation warnings introduced
- All existing code will continue to work

## Pre-Chore Checklist
Before starting implementation:
- [ ] Create feature branch: `chore/update-nextjs-16.0.6`
- [ ] Review CHANGELOG for breaking changes - confirmed none for 16.0.4-16.0.6
- [ ] Check for deprecation notices - none found
- [ ] Identify all consumers of code being refactored - all package.json files identified above
- [ ] Backup any critical data - N/A for dependency update

## Documentation Updates Required
- No documentation updates required for this patch update
- CHANGELOG.md entry will be auto-generated via conventional commit

## Rollback Plan
- Revert the commit that updates package.json files
- Run `pnpm install` to restore previous versions
- No database migrations or state changes to rollback
- Monitor: Build success, dev server startup, test suite pass rate

## Step by Step Tasks

### Step 1: Create Feature Branch
- Create branch `chore/update-nextjs-16.0.6` from `dev`

### Step 2: Update pnpm Catalog
- Update `pnpm-workspace.yaml` catalog entries:
  - `next: 16.0.3` → `next: 16.0.6`
  - `@next/bundle-analyzer: 16.0.1` → `@next/bundle-analyzer: 16.0.6`
  - `@next/eslint-plugin-next: 16.0.1` → `@next/eslint-plugin-next: 16.0.6`
  - `eslint-config-next: 16.0.1` → `eslint-config-next: 16.0.6`

### Step 3: Update Package Files with Explicit Versions
Update the following package.json files to use `16.0.6`:

**Apps:**
- `apps/web/package.json`: Update `next` and `@next/bundle-analyzer` to `16.0.6`
- `apps/payload/package.json`: Update `next` to `16.0.6`
- `apps/dev-tool/package.json`: Update `next` to `16.0.6`

**Packages:**
- `packages/ui/package.json`: Update `next` to `16.0.6`
- `packages/next/package.json`: Update `next` to `16.0.6`
- `packages/i18n/package.json`: Update `next` to `16.0.6`
- `packages/supabase/package.json`: Update `next` to `16.0.6`
- `packages/features/admin/package.json`: Update `next` to `16.0.6`
- `packages/features/accounts/package.json`: Update `next` to `16.0.6`
- `packages/features/team-accounts/package.json`: Update `next` to `16.0.6`
- `packages/plugins/testimonial/package.json`: Update `next` to `16.0.6`

**Tooling:**
- `tooling/eslint/package.json`: Update `@next/eslint-plugin-next` to `16.0.6`

### Step 4: Install Dependencies
- Run `pnpm install` to update lockfile
- Verify no peer dependency warnings related to Next.js

### Step 5: Run Validation Commands
- Execute all validation commands listed below

### Step 6: Commit Changes
- Stage all modified files
- Commit with message: `chore(deps): update Next.js to v16.0.6`

## Validation Commands
Execute every command to validate the chore is complete with zero regressions.

```bash
# Verify installation succeeded
pnpm install

# Type check all packages
pnpm typecheck

# Run linting
pnpm lint

# Build web app to verify no build errors
pnpm --filter web build

# Build payload app to verify no build errors
pnpm --filter payload build

# Run unit tests
pnpm test:unit

# Start dev server briefly to verify startup (manual verification)
# pnpm dev (then Ctrl+C after confirming startup)
```

## Notes
- Packages using `"next": "catalog:"` will automatically receive the updated version from the pnpm catalog
- The catalog in `pnpm-workspace.yaml` is the source of truth for version alignment
- Some packages have explicit versions rather than catalog references - these need manual updates
- The `@next/bundle-analyzer` and `@next/eslint-plugin-next` versions in the catalog are outdated (16.0.1) and should be updated to 16.0.6 for consistency

### References
- [Next.js Releases](https://github.com/vercel/next.js/releases)
- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
