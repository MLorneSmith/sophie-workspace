# Chore: Remove unused Keystatic and WordPress CMS packages

## Chore Description

The MakerKit upstream provides code for multiple CMS options (Keystatic, WordPress, and Payload) in the `packages/cms/` directory. This project exclusively uses Payload CMS for content management. The Keystatic and WordPress packages are unused dead code that:
- Increases repository size unnecessarily
- Creates maintenance overhead during dependency updates
- May cause confusion for developers unfamiliar with the codebase
- Adds unused dependencies to the lockfile

This chore removes the `packages/cms/keystatic` and `packages/cms/wordpress` directories, updates the core CMS package to remove references to these providers, and removes related turbo generator templates.

## Relevant Files

### Files to Remove
- `packages/cms/keystatic/` - Entire directory (Keystatic CMS implementation)
  - Contains `package.json`, `src/`, `tsconfig.json`, and related files
  - Has dependencies on `@keystatic/core`, `@keystatic/next`, `@markdoc/markdoc`
- `packages/cms/wordpress/` - Entire directory (WordPress CMS implementation)
  - Contains `package.json`, `src/`, `docker-compose.yml`, `wp-content/`
  - Has dependencies on `wp-types`
- `turbo/generators/templates/keystatic/` - Turbo generator templates for Keystatic
  - `generator.ts`, `layout.tsx.hbs`, `page.tsx.hbs`, `route.ts.hbs`

### Files to Modify
- `packages/cms/core/package.json` - Remove `@kit/keystatic` and `@kit/wordpress` from devDependencies
- `packages/cms/core/src/create-cms-client.ts` - Remove WordPress and Keystatic registry entries
- `packages/cms/core/src/content-renderer.tsx` - Remove WordPress and Keystatic switch cases

### Files to Keep (No Changes)
- `packages/cms/payload/` - Active Payload CMS implementation (KEEP)
- `packages/cms/core/` - Core CMS abstraction layer (MODIFY, don't remove)
- `packages/cms/types/` - CMS type definitions (KEEP, may need minor update)

## Impact Analysis

### Dependencies Affected
- `@kit/cms` (core package) - Direct dependency on both `@kit/keystatic` and `@kit/wordpress`
- No other packages in the monorepo import from `@kit/keystatic` or `@kit/wordpress`
- Root `pnpm-lock.yaml` will be updated to remove unused package dependencies:
  - `@keystatic/core`
  - `@keystatic/next`
  - `@markdoc/markdoc`
  - `wp-types`

### Risk Assessment
**Low Risk**: This is a straightforward removal of unused code with no active consumers.
- The packages are not imported anywhere in the application code
- The CMS_CLIENT environment variable is set to "payload" in all environments
- No database migrations or data changes required
- All changes are purely code removal (no new logic)

### Backward Compatibility
- No backward compatibility concerns - these packages are never used
- The `CmsType` type in `@kit/cms-types` may still include "keystatic" and "wordpress" as options, but this is fine as it's just a union type that can remain for completeness
- No API changes to the public `@kit/cms` interface

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/remove-unused-cms-packages`
- [ ] Verify no imports of `@kit/keystatic` or `@kit/wordpress` outside packages/cms/
- [ ] Verify CMS_CLIENT is set to "payload" in `.env` files
- [ ] Run `pnpm typecheck` to establish baseline

## Documentation Updates Required

- No external documentation updates needed
- The CLAUDE.md already documents that Payload CMS is used
- No migration guides needed (packages were never used)

## Rollback Plan

If issues arise:
1. Restore removed directories from git: `git checkout HEAD -- packages/cms/keystatic packages/cms/wordpress turbo/generators/templates/keystatic`
2. Restore modified files: `git checkout HEAD -- packages/cms/core/`
3. Run `pnpm install` to restore lockfile
4. No database rollback needed (no data changes)

## Step by Step Tasks

### Step 1: Create feature branch

- Create a new branch from dev: `git checkout -b chore/remove-unused-cms-packages`

### Step 2: Verify no external usage

- Search for any imports of `@kit/keystatic` or `@kit/wordpress` outside of `packages/cms/`
- Confirm all usages are only within the packages being removed or modified
- Expected: Only references in `packages/cms/core/` files

### Step 3: Remove packages/cms/keystatic directory

- Delete the entire `packages/cms/keystatic/` directory
- This removes:
  - `package.json` with `@keystatic/core`, `@keystatic/next`, `@markdoc/markdoc` dependencies
  - `src/` source files
  - `tsconfig.json` and other config files
  - `README.md`

### Step 4: Remove packages/cms/wordpress directory

- Delete the entire `packages/cms/wordpress/` directory
- This removes:
  - `package.json` with `wp-types` dependency
  - `src/` source files
  - `docker-compose.yml` for local WordPress development
  - `wp-content/` WordPress theme files
  - `tsconfig.json` and other config files
  - `README.md`

### Step 5: Remove turbo generator templates for Keystatic

- Delete the entire `turbo/generators/templates/keystatic/` directory
- This removes generator templates that were used to scaffold Keystatic routes

### Step 6: Update packages/cms/core/package.json

- Remove `@kit/keystatic` from devDependencies
- Remove `@kit/wordpress` from devDependencies
- Keep other dependencies intact

### Step 7: Update packages/cms/core/src/create-cms-client.ts

- Remove the WordPress CMS client registry entry (lines 12-16)
- Remove the Keystatic CMS client registry entry (lines 18-22)
- Keep only the Payload CMS client registry entry
- Remove the dynamic imports for `@kit/wordpress` and `@kit/keystatic`

### Step 8: Update packages/cms/core/src/content-renderer.tsx

- Remove the "keystatic" case from the switch statement (lines 31-37)
- Remove the "wordpress" case from the switch statement (lines 39-45)
- Keep only the "payload" case and default case
- Remove the dynamic imports for `@kit/keystatic/renderer` and `@kit/wordpress/renderer`

### Step 9: Regenerate lockfile and clean install

- Run `pnpm install` to regenerate `pnpm-lock.yaml`
- This will remove unused dependencies from the lockfile

### Step 10: Run validation commands

- Execute all validation commands to verify zero regressions

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# Verify removed directories no longer exist
ls packages/cms/keystatic 2>/dev/null && echo "FAIL: keystatic still exists" || echo "PASS: keystatic removed"
ls packages/cms/wordpress 2>/dev/null && echo "FAIL: wordpress still exists" || echo "PASS: wordpress removed"
ls turbo/generators/templates/keystatic 2>/dev/null && echo "FAIL: keystatic templates still exist" || echo "PASS: keystatic templates removed"

# Verify no remaining imports of removed packages (should return no results)
grep -r "@kit/keystatic" --include="*.ts" --include="*.tsx" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v pnpm-lock

grep -r "@kit/wordpress" --include="*.ts" --include="*.tsx" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v pnpm-lock

# Run TypeScript compilation to verify no broken imports
pnpm typecheck

# Run linting
pnpm lint

# Run formatting check
pnpm format

# Verify build succeeds
pnpm build

# Run unit tests to verify no regressions
pnpm test:unit
```

## Notes

- The `@kit/cms-types` package defines the `CmsType` type which likely includes "keystatic" and "wordpress" as union members. This can be left as-is since it's just a type definition and doesn't affect runtime behavior. Removing them from the type would be a separate, optional cleanup.
- The WordPress package included a `docker-compose.yml` for local WordPress development - this is safe to remove as it was never used.
- After this cleanup, the `packages/cms/` directory will contain only:
  - `core/` - The CMS abstraction layer (simplified to only support Payload)
  - `payload/` - The Payload CMS implementation
  - `types/` - Shared CMS type definitions
- Consider in the future simplifying the CMS abstraction layer further if only Payload will ever be used, but that's outside the scope of this chore.
