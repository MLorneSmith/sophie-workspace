# Chore: Update Supabase packages to latest versions

## Chore Description

Update Supabase packages to their latest versions:
- `@supabase/ssr`: 0.8.0 → 0.8.0 (already at latest)
- `@supabase/supabase-js`: 2.86.0 → 2.86.2 (patch update)
- `supabase` CLI: 2.64.2 → 2.65.6 (minor update)

This is routine maintenance to keep dependencies current and benefit from bug fixes, security patches, and improvements in the Supabase ecosystem.

## Relevant Files

### Direct Package Configuration Files
- `apps/web/package.json` - Contains supabase CLI and @supabase/supabase-js dependencies
- `packages/supabase/package.json` - Contains @supabase/ssr and @supabase/supabase-js dependencies
- `pnpm-lock.yaml` - Locked dependency versions (will be regenerated)

### Configuration Files
- `apps/web/supabase/config.toml` - Supabase local configuration (may need version compatibility check)

### Related Code (for testing)
- `packages/supabase/src/` - Supabase client code that uses these packages
- `apps/web/app/` - Application code that uses Supabase

## Impact Analysis

### Scope
This is a **minor/patch update** across the Supabase package ecosystem:
- `@supabase/supabase-js` 2.86.0 → 2.86.2: Patch update (bug fixes only)
- `supabase` CLI 2.64.2 → 2.65.6: Minor update (new features, backwards compatible)
- `@supabase/ssr` 0.8.0 → 0.8.0: Already at latest (no change needed)

### Dependencies Affected
- **Direct**:
  - `apps/web` - Uses supabase CLI for local development and @supabase/supabase-js
  - `packages/supabase` - Core Supabase integration package (@supabase/ssr, @supabase/supabase-js)

- **Indirect**:
  - All packages that import from `@kit/supabase/*` will use updated client
  - Server components, server actions, and client components that use Supabase

### Risk Assessment
**Risk Level: Low**

**Why Low Risk**:
- Patch updates (2.86.0 → 2.86.2) contain only bug fixes
- Minor CLI update (2.64.2 → 2.65.6) is backwards compatible per semver
- @supabase/ssr already at latest - no changes needed
- Supabase maintains excellent backwards compatibility
- Extensive test coverage (unit + E2E) will catch any regressions

**Potential Issues** (unlikely):
- CLI changes could affect local development workflow
- Type definition changes (rare in patch releases)
- Realtime or auth edge cases

### Backward Compatibility
**Full backward compatibility expected** because:
- Patch releases never introduce breaking changes
- Minor releases are backwards compatible per semver
- API surface remains unchanged
- No migration required for database or auth

## Pre-Chore Checklist
Before starting implementation:
- [ ] Create feature branch: `chore/update-supabase-packages`
- [ ] Review @supabase/supabase-js changelog for v2.86.1 and v2.86.2
- [ ] Review supabase CLI changelog for v2.65.x releases
- [ ] Verify local Supabase is running: `pnpm supabase:web:status`
- [ ] Check current Supabase types are generated

## Documentation Updates Required
- [ ] No CLAUDE.md updates needed (version-agnostic)
- [ ] No README updates needed
- [ ] No user-facing docs affected
- [ ] No CHANGELOG entry needed for routine dependency updates

## Rollback Plan

If issues arise after update:

1. **Quick Rollback** (if not yet committed):
   ```bash
   git restore apps/web/package.json packages/supabase/package.json pnpm-lock.yaml
   pnpm install
   ```

2. **Commit Rollback** (if already committed):
   ```bash
   git revert <commit-hash>
   pnpm install
   ```

3. **Monitoring**: After update, verify:
   - Local Supabase starts correctly: `pnpm supabase:web:start`
   - Auth flows work (login, signup, logout)
   - Database queries execute correctly
   - Realtime subscriptions function (if used)

## Step by Step Tasks

### 1. Prepare Feature Branch
- [ ] Create feature branch from `dev`: `git checkout -b chore/update-supabase-packages`
- [ ] Verify branch is clean and up-to-date with latest `dev`

### 2. Update Package Versions
- [ ] Update `apps/web/package.json`:
  - Change `"supabase": "^2.64.2"` to `"supabase": "^2.65.6"`
  - Change `"@supabase/supabase-js": "2.86.0"` to `"@supabase/supabase-js": "2.86.2"`

- [ ] Update `packages/supabase/package.json`:
  - Change `"@supabase/supabase-js": "2.86.0"` to `"@supabase/supabase-js": "2.86.2"`
  - Note: `@supabase/ssr` is already at `^0.8.0` (latest) - no change needed

### 3. Regenerate Dependencies
- [ ] Run `pnpm install` to update lock file
- [ ] Verify pnpm-lock.yaml has been updated
- [ ] Check only Supabase packages changed: `git diff pnpm-lock.yaml | grep -i supabase | head -30`

### 4. Verify Local Supabase
- [ ] Stop any running Supabase instance: `pnpm supabase:web:stop`
- [ ] Start Supabase with new CLI: `pnpm supabase:web:start`
- [ ] Verify status: `pnpm supabase:web:status`
- [ ] Check all services are healthy (API, Auth, Storage, Realtime)

### 5. Regenerate Types (Important)
- [ ] Regenerate TypeScript types: `pnpm supabase:web:typegen`
- [ ] Verify types generated successfully
- [ ] Check for any type changes: `git diff packages/supabase/src/database.types.ts`

### 6. Type Checking & Build Validation
- [ ] Run TypeScript compiler: `pnpm typecheck`
  - Verify no new type errors from Supabase package updates
  - Should complete without errors

- [ ] Run linting: `pnpm lint`
  - Should complete without errors

- [ ] Test build for web app: `pnpm --filter web build`
  - Verify build succeeds
  - Check for warnings related to Supabase

### 7. Unit Tests
- [ ] Run unit tests: `pnpm test:unit`
  - All tests should pass
  - Pay attention to tests involving Supabase client

### 8. End-to-End Tests (Critical for Auth)
- [ ] Run full E2E test suite: `pnpm test:e2e`
  - E2E tests validate auth flows, database operations
  - Critical for catching Supabase-related regressions
  - All tests should pass

- [ ] If tests fail, investigate:
  - Auth-related failures could indicate SSR package issues
  - Database query failures could indicate client issues
  - Compare with release notes for known issues

### 9. Code Quality Check
- [ ] Run full codecheck: `pnpm codecheck`
  - Final validation before commit
  - Should complete without errors

### 10. Manual Testing (Recommended)
- [ ] Start dev server: `pnpm dev`
- [ ] Test authentication:
  - Sign up flow (if test accounts available)
  - Login flow
  - Logout flow
  - Session persistence (refresh page while logged in)
- [ ] Test database operations:
  - View team data
  - Create/update records
- [ ] Check browser console for Supabase errors

### 11. Create Git Commit
- [ ] Stage changes: `git add apps/web/package.json packages/supabase/package.json pnpm-lock.yaml`
- [ ] Commit with conventional message:
  ```
  chore(deps): update Supabase packages to latest versions

  - @supabase/supabase-js: 2.86.0 → 2.86.2
  - supabase CLI: 2.64.2 → 2.65.6
  - @supabase/ssr: already at 0.8.0 (no change)

  [agent: claude]
  ```

### 12. Push & Create Pull Request
- [ ] Push feature branch: `git push origin chore/update-supabase-packages`
- [ ] Create pull request targeting `dev`
- [ ] Verify CI/CD pipeline passes
- [ ] Merge when approved

## Validation Commands

Execute every command to validate the chore is complete with zero regressions:

```bash
# 1. Verify package.json changes
grep '"@supabase/supabase-js"' apps/web/package.json | grep "2.86.2"
grep '"supabase"' apps/web/package.json | grep "2.65.6"
grep '"@supabase/supabase-js"' packages/supabase/package.json | grep "2.86.2"

# 2. Verify Supabase local services (if running)
pnpm supabase:web:status

# 3. Type checking
pnpm typecheck

# 4. Linting
pnpm lint

# 5. Build validation
pnpm --filter web build

# 6. Full code quality check
pnpm codecheck

# 7. Unit tests
pnpm test:unit

# 8. E2E tests (validates auth and database operations)
pnpm test:e2e
```

## Notes

### Supabase Package Ecosystem
- **@supabase/supabase-js**: Core JavaScript client for Supabase (database queries, auth, storage, realtime)
- **@supabase/ssr**: Server-side rendering utilities for Next.js App Router (cookie handling, session management)
- **supabase**: CLI tool for local development, migrations, type generation

### Version Pinning Strategy
- `@supabase/supabase-js` uses exact version (`2.86.2`) for stability
- `@supabase/ssr` uses caret (`^0.8.0`) for automatic patch updates
- `supabase` CLI uses caret (`^2.65.6`) for CLI improvements

### Release Notes References
- @supabase/supabase-js: https://github.com/supabase/supabase-js/releases
- supabase CLI: https://github.com/supabase/cli/releases
- @supabase/ssr: https://github.com/supabase/ssr/releases

### Testing Focus Areas
1. **Authentication**: Login, signup, logout, session refresh
2. **Database queries**: SELECT, INSERT, UPDATE, DELETE operations
3. **RLS policies**: Ensure row-level security still functions
4. **Type safety**: Verify generated types match database schema
