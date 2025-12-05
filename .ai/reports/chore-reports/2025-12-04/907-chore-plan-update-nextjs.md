# Chore: Update Next.js to v16.0.7

## Chore Description

Update Next.js and related Next.js packages (@next/bundle-analyzer, @next/eslint-plugin-next) from v16.0.3 to v16.0.7 (latest minor version in the v16 series). This is a routine maintenance update that includes bug fixes and performance improvements accumulated between v16.0.3 and v16.0.7.

The update involves:
1. Bumping Next.js version across all packages that depend on it
2. Verifying compatibility with the existing codebase
3. Running full test suite to catch any regressions
4. Validating build and type checking passes

## Relevant Files

### Direct Package Configuration Files
- `apps/web/package.json` - Main web application depends on next
- `apps/payload/package.json` - Payload CMS app depends on next
- `apps/e2e/package.json` - E2E tests app (indirect dependency)
- `apps/dev-tool/package.json` - Dev tool app (indirect dependency)
- `pnpm-lock.yaml` - Locked dependency versions (will be regenerated)

### Configuration & Build Files
- `apps/web/next.config.ts` - Next.js configuration (potential compatibility checks needed)
- `apps/payload/next.config.ts` - Payload's Next.js config
- `tsconfig.json` - TypeScript configuration (may need review for Next.js compatibility)
- `.biome.json` - Code linting/formatting config

### Testing Files
- `apps/e2e/playwright.config.ts` - E2E test configuration that may depend on Next.js build output
- Various test files across packages

### Documentation
- `CLAUDE.md` - Project instructions (contains Next.js guidance)
- `.claude/config/command-profiles.yaml` - Documentation routing config

## Impact Analysis

### Scope
This is a **patch-level version bump** (16.0.3 → 16.0.7) within the same minor version. Patch updates typically include:
- Bug fixes
- Security patches
- Performance optimizations
- Minor enhancements within the stable API

**Expected Impact**: Low to very low, as patch releases maintain API compatibility.

### Dependencies Affected
- **Direct**:
  - `apps/web` - Next.js, @next/bundle-analyzer, @next/eslint-plugin-next
  - `apps/payload` - Next.js, @next/bundle-analyzer, @next/eslint-plugin-next

- **Indirect**: All packages that import from web/payload apps will inherit the update through monorepo linking

- **Transitive Dependencies**: Next.js patch updates rarely change peer dependencies, so pnpm-lock.yaml may only update Next.js-related packages

### Risk Assessment
**Risk Level: Low**

**Why Low Risk**:
- Patch version update (semantic versioning: same major.minor, only patch bumped)
- Between-version changes (16.0.3 → 16.0.7) are 4 patches, typically all backwards compatible
- No API changes expected in patch releases
- Existing middleware, app router, and server components usage should remain compatible
- Tests are extensive (unit + E2E) to catch any regressions

**Potential Issues** (unlikely):
- Edge cases in build optimizations could affect performance
- Rare compatibility issue with specific package combinations
- Type definitions changes (unlikely but possible)

### Backward Compatibility
**Full backward compatibility expected** because:
- Patch releases (x.y.Z) never introduce breaking changes per semver
- API surface remains the same
- Configuration should require no changes
- Existing code patterns (server components, server actions, middleware) are unaffected

**Migration Path**: None required - direct replacement should work

## Pre-Chore Checklist
Before starting implementation:
- [ ] Create feature branch: `chore/update-nextjs-16-0-7`
- [ ] Review Next.js release notes for v16.0.4, v16.0.5, v16.0.6, v16.0.7 (https://github.com/vercel/next.js/releases)
- [ ] Check for any deprecation notices that may affect current code
- [ ] Verify current Next.js version in package.json: `grep "next" package.json`
- [ ] Note any custom Next.js configurations that might be affected
- [ ] Ensure CI/CD pipeline is available and not currently running

## Documentation Updates Required
- [ ] CLAUDE.md - Update Next.js version reference if mentioned
- [ ] README.md - Verify technical stack section reflects v16.0.7
- [ ] .ai/ai_docs/context-docs/development/architecture-overview.md - Update if version-specific
- [ ] No CHANGELOG needed (internal maintenance task)
- [ ] No user-facing docs needed

## Rollback Plan

If issues arise after update:

1. **Quick Rollback** (if not yet committed):
   ```bash
   git restore apps/web/package.json apps/payload/package.json pnpm-lock.yaml
   pnpm install
   ```

2. **Commit Rollback** (if already committed):
   ```bash
   git revert <commit-hash>
   pnpm install
   ```

3. **Branch Deletion** (if branches exist):
   ```bash
   git branch -D chore/update-nextjs-16-0-7
   ```

4. **Monitoring**: After deployment, monitor:
   - Build times (should not significantly increase)
   - Error logs in production (e2g., check Sentry if enabled)
   - Core Web Vitals metrics

## Step by Step Tasks

### 1. Prepare Feature Branch
- [ ] Create feature branch from `dev`: `git checkout -b chore/update-nextjs-16-0-7`
- [ ] Verify branch is clean and up-to-date with latest `dev`

### 2. Update Next.js Packages
- [ ] Update `apps/web/package.json`:
  - Change `"next": "16.0.3"` to `"next": "16.0.7"`
  - Change `"@next/bundle-analyzer": "16.0.3"` to `"@next/bundle-analyzer": "16.0.7"`
  - Change `"@next/eslint-plugin-next": "16.0.3"` to `"@next/eslint-plugin-next": "16.0.7"`

- [ ] Update `apps/payload/package.json`:
  - Change `"next": "16.0.3"` to `"next": "16.0.7"`
  - Change `"@next/bundle-analyzer": "16.0.3"` to `"@next/bundle-analyzer": "16.0.7"`
  - Change `"@next/eslint-plugin-next": "16.0.3"` to `"@next/eslint-plugin-next": "16.0.7"`

### 3. Regenerate Dependencies
- [ ] Run `pnpm install` to update lock file and install new versions
- [ ] Verify pnpm-lock.yaml has been updated with new versions
- [ ] Check git diff to ensure only Next.js packages changed: `git diff pnpm-lock.yaml | grep -A2 -B2 next | head -50`

### 4. Type Checking & Build Validation
- [ ] Run TypeScript compiler: `pnpm typecheck`
  - Verify no new type errors are introduced
  - Should complete without errors

- [ ] Run linting: `pnpm lint`
  - Check for any ESLint or Biome issues with new Next.js version
  - Should complete without errors

- [ ] Test build for web app: `pnpm --filter web build`
  - Verify Next.js builds successfully
  - Check for any new warnings or deprecation notices
  - Build should complete in reasonable time (~60-120s)

- [ ] Test build for payload app: `pnpm --filter payload build`
  - Verify Payload CMS builds successfully
  - Check for warnings

### 5. Unit & Integration Tests
- [ ] Run unit tests: `pnpm test:unit`
  - All tests should pass
  - No new failures related to Next.js changes
  - If any tests fail, investigate and determine if it's Next.js-related

- [ ] Run specific web app tests if available: `pnpm --filter web test:unit`
  - Ensure web-specific tests pass

### 6. End-to-End Tests (Critical)
- [ ] Run full E2E test suite: `pnpm test:e2e`
  - This validates real user workflows work correctly
  - Should pass all tests
  - If any E2E tests fail, investigate thoroughly:
    - Check if related to Next.js changes
    - Review browser console for errors
    - Validate against Next.js v16.0.7 release notes

- [ ] If E2E tests fail:
  - Run shard tests individually for debugging: `pnpm test:e2e -- --shard=1/4`
  - Check Playwright test output for specific failures
  - Determine if issue is Next.js-related or test infrastructure issue

### 7. Code Quality Check
- [ ] Run full codecheck: `pnpm codecheck`
  - Validates lint, format, and type check all pass together
  - Should complete without errors
  - This is the final validation before commit

### 8. Manual Testing (Optional but Recommended)
- [ ] Start dev server: `pnpm dev`
- [ ] Test key user flows manually in browser:
  - Authentication flow
  - Create/view presentation
  - Basic navigation
  - Form submission
- [ ] Check browser console for errors: Open DevTools → Console tab
- [ ] Check Network tab for any failed requests

### 9. Create Git Commit
- [ ] Stage changes: `git add apps/web/package.json apps/payload/package.json pnpm-lock.yaml`
- [ ] Commit with conventional message: `git commit -m "chore(deps): update Next.js to v16.0.7 and related packages"`
  - Message format: `chore(deps): update Next.js to v16.0.7 and related packages [agent: claude]`
  - Include summary of what changed (minor patch update, no breaking changes)

### 10. Push & Create Pull Request
- [ ] Push feature branch: `git push origin chore/update-nextjs-16-0-7`
- [ ] Create pull request on GitHub:
  - Title: "chore(deps): update Next.js to v16.0.7"
  - Description: Include summary of changes, testing performed, and that no breaking changes expected
  - Label: `type:chore`, `area:infra`
- [ ] Verify CI/CD pipeline passes all checks
- [ ] Request code review if needed
- [ ] Merge to `dev` branch once approved

## Validation Commands

Execute every command to validate the chore is complete with zero regressions:

```bash
# 1. Verify package.json changes
grep '"next":' apps/web/package.json | grep "16.0.7"
grep '"@next/bundle-analyzer":' apps/web/package.json | grep "16.0.7"
grep '"@next/eslint-plugin-next":' apps/web/package.json | grep "16.0.7"

# 2. Verify lock file updated
grep -A2 '"next"' pnpm-lock.yaml | head -10 | grep "16.0.7"

# 3. Type checking
pnpm typecheck

# 4. Linting
pnpm lint

# 5. Build validation
pnpm --filter web build
pnpm --filter payload build

# 6. Full code quality check
pnpm codecheck

# 7. Unit tests
pnpm test:unit

# 8. E2E tests (comprehensive)
pnpm test:e2e

# 9. Final verification - dev server should start and run
pnpm dev &
sleep 10
curl -s http://localhost:3000 | head -20
kill %1
```

## Notes

- **Release Notes**: Review Next.js releases between v16.0.3 and v16.0.7 at https://github.com/vercel/next.js/releases for detailed changelog
- **Breaking Changes**: Patch releases (x.y.Z) should never include breaking changes per semantic versioning
- **Performance**: Patch updates often include performance improvements; monitor build time after update
- **Security**: Check if any security patches are included in the v16.0.4-16.0.7 range
- **Deployment**: After merging to `dev`, the CI/CD pipeline will automatically deploy to development environment for integration testing
- **Estimated Time**: 30-45 minutes for execution, including test runs

### Common Next.js Patch Update Issues (Rare)
- Build cache invalidation (usually handled automatically)
- Turbopack changes in experimental features (unlikely to affect stable builds)
- Edge Runtime compatibility (verify if using edge functions)
- Image Optimization changes (verify if using next/image)

All of these are unlikely for a patch version bump within the v16.0.x range.
