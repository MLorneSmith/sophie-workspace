# Update Payload CMS Workflow

## Overview
This workflow guides you through updating Payload CMS and all related dependencies across the SlideHeroes project.

## Prerequisites
- Ensure all changes are committed before starting
- Have access to npm registry to check latest versions
- Backup your database if updating major versions

## Steps

### 1. Check Current Version
First, identify the current Payload version in use:

```bash
rg '"payload":\s*"[^"]*"' apps/payload/package.json
```

### 2. Check Latest Available Version
Get the latest Payload CMS version:

```bash
curl -s https://registry.npmjs.org/payload/latest | grep -o '"version":"[^"]*"' | cut -d'"' -f4
```

### 3. Review Breaking Changes
Before updating, check the [Payload CMS changelog](https://github.com/payloadcms/payload/blob/main/CHANGELOG.md) for any breaking changes between your current version and the target version.

### 4. Update All Package.json Files

Update the following files with the new version:

#### Main Payload App
- **File**: `apps/payload/package.json`
- **Dependencies to update**:
  - `"payload": "^[VERSION]"`
  - `"@payloadcms/db-postgres": "^[VERSION]"`
  - `"@payloadcms/next": "^[VERSION]"`
  - `"@payloadcms/payload-cloud": "^[VERSION]"`
  - `"@payloadcms/plugin-nested-docs": "^[VERSION]"`
  - `"@payloadcms/richtext-lexical": "^[VERSION]"`
  - `"@payloadcms/storage-s3": "^[VERSION]"`

#### Payload Integration Package
- **File**: `packages/cms/payload/package.json`
- **Dependencies to update**:
  - `"payload": "[VERSION]"` (Note: No caret ^ here)

#### Web App Package
- **File**: `apps/web/package.json`
- **Dependencies to update**:
  - `"@payloadcms/db-postgres": "^[VERSION]"`

### 5. Update Dependencies Script
Run this script to update all at once (replace [VERSION] with the target version):

```bash
# Set the new version
NEW_VERSION="3.41.0"  # Update this to your target version

# Update apps/payload/package.json
sed -i "s/\"payload\": \"[^^]*\"/\"payload\": \"^$NEW_VERSION\"/g" apps/payload/package.json
sed -i "s/\"@payloadcms\/[^\"]*\": \"[^^]*\"/\"@payloadcms\/&\": \"^$NEW_VERSION\"/g" apps/payload/package.json

# Update packages/cms/payload/package.json (exact version, no caret)
sed -i "s/\"payload\": \"[^\"]*\"/\"payload\": \"$NEW_VERSION\"/g" packages/cms/payload/package.json

# Update apps/web/package.json
sed -i "s/\"@payloadcms\/db-postgres\": \"[^^]*\"/\"@payloadcms\/db-postgres\": \"^$NEW_VERSION\"/g" apps/web/package.json
```

### 6. Install Updated Dependencies
Clean install to ensure all dependencies are properly resolved:

```bash
# Remove lock file to ensure fresh resolution
rm -f pnpm-lock.yaml

# Install dependencies
pnpm install

# If there are any peer dependency warnings, address them
```

### 7. Regenerate Types
If Payload types need regeneration:

```bash
cd apps/payload
pnpm generate:types
```

### 8. Run Database Migrations
Check if any database migrations are needed:

```bash
cd apps/payload
pnpm payload migrate
```

### 9. Test the Update

#### Start Development Servers
```bash
# Test Payload admin
pnpm --filter payload dev

# In another terminal, test web app
pnpm --filter web dev
```

#### Verify Key Functionality
- [ ] Payload Admin UI loads correctly
- [ ] Can create/edit content
- [ ] API endpoints work
- [ ] Web app can fetch Payload data
- [ ] No TypeScript errors
- [ ] No console errors

### 10. Run Tests
```bash
# Type checking
pnpm typecheck

# Unit tests (if applicable)
pnpm test

# Linting
pnpm lint
```

### 11. Update Documentation
If the update includes significant changes:
- Update `z.instructions/update-payload-version.md` with new version info
- Document any migration steps or breaking changes
- Update any API documentation if endpoints changed

### 12. Commit Changes
```bash
git add -A
git commit -m "chore: update Payload CMS to version [VERSION]

- Updated payload and all @payloadcms/* packages to [VERSION]
- Updated dependencies in apps/payload, packages/cms/payload, and apps/web
- Regenerated types
- Ran database migrations (if applicable)
- Tested admin UI and API functionality"
```

## Troubleshooting

### Version Mismatch Errors
If you see errors like "Module not found" or "Cannot find export":
1. Ensure all @payloadcms/* packages are the same version
2. Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`
3. Check that payload and @payloadcms/* versions match

### Database Migration Failures
1. Check Payload migration docs for your version
2. Backup database before retrying
3. May need to run migrations manually

### Type Errors
1. Regenerate types: `pnpm --filter payload generate:types`
2. Check for breaking changes in type definitions
3. Update any custom type extensions

### Build Failures
1. Clear Next.js cache: `rm -rf apps/payload/.next apps/web/.next`
2. Check for deprecated APIs in changelog
3. Update any custom Payload plugins

## Version Compatibility Notes

All @payloadcms/* packages should match the main payload version:
- If payload is 3.41.0, all plugins should be 3.41.0
- Never mix versions (e.g., payload 3.41.0 with @payloadcms/next 3.40.0)

## Rollback Plan
If issues arise:
1. Revert the commit: `git revert HEAD`
2. Reinstall dependencies: `pnpm install`
3. Restart services
4. Document issues for investigation

## Success Criteria
- [ ] All packages updated to same version
- [ ] No TypeScript errors
- [ ] Admin UI functions correctly
- [ ] API endpoints return expected data
- [ ] Web app displays Payload content
- [ ] All tests pass
- [ ] No console errors in development