# Bug Fix: Resolve Duplicate Vite Versions

**Related Diagnosis**: #740 (REQUIRED)
**Severity**: low
**Bug Type**: dependency-resolution
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Version mismatch between `vitest@^4.0.10` and `@vitest/coverage-v8@^4.0.14` causing peer dependency resolution to install two versions of Vite (7.2.2 and 7.2.4)
- **Fix Approach**: Align `vitest` versions to `^4.0.14` across all root and workspace packages
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The project has two versions of Vite installed (7.2.2 and 7.2.4) due to inconsistent `vitest` version specifications:

- Root `package.json` has `vitest: ^4.0.10` and `@vitest/coverage-v8: ^4.0.14`
- `@vitest/coverage-v8@4.0.14` has a peer dependency on `vitest@4.0.14`
- This creates a conflict where `vitest@4.0.10` depends on `vite@7.2.2` while the peer requirement `vitest@4.0.14` depends on `vite@7.2.4`
- `packages/e2b/package.json` also has the same `vitest: ^4.0.10` specification

This wastes disk space (approximately 50-100MB) and violates the principle of having a single version in the monorepo.

For full details, see diagnosis issue #740.

### Solution Approaches Considered

#### Option 1: Align vitest Versions to 4.0.14 ⭐ RECOMMENDED

**Description**: Update `vitest` from `^4.0.10` to `^4.0.14` in both root `package.json` and `packages/e2b/package.json` to match the peer dependency requirement of `@vitest/coverage-v8@^4.0.14`. This ensures a single Vite version is installed.

**Pros**:
- Simple, minimal changes (2 files)
- Solves root cause completely
- Maintains caret ranges for flexibility
- No breaking changes between 4.0.10 and 4.0.14
- Aligns with best practices (version consistency in monorepos)
- Improves disk space usage and dependency resolution efficiency

**Cons**:
- None - this is a straightforward upgrade

**Risk Assessment**: low - Vitest patch versions (4.0.10 → 4.0.14) are stable and safe. No breaking changes expected. Coverage integration is already tested in CI/CD.

**Complexity**: simple - Only package.json version updates required, no logic changes.

#### Option 2: Pin vitest to Exact Versions

**Description**: Replace caret ranges with exact versions to lock down specific vitest/vite combinations.

**Why Not Chosen**: Less flexible than option 1. Caret ranges provide reasonable flexibility while solving the root cause. Exact pinning is overkill for this situation.

#### Option 3: Use pnpm Overrides

**Description**: Add pnpm overrides to force a single Vite version across the workspace.

**Why Not Chosen**: Unnecessary when the root cause (version mismatch) can be fixed directly. Overrides are better suited for conflicts between independent packages.

### Selected Solution: Align vitest Versions to 4.0.14

**Justification**: This approach is the most direct fix addressing the root cause. By aligning `vitest` to `^4.0.14` everywhere, we ensure consistency with `@vitest/coverage-v8@^4.0.14`'s peer dependency requirements. This is a minimal change with zero risk and maximum benefit (disk space savings, cleaner dependency tree, standard monorepo practice).

**Technical Approach**:
- Update root `package.json` line 150: `"vitest": "^4.0.14"` (from `^4.0.10`)
- Update `packages/e2b/package.json` line 42: `"vitest": "^4.0.14"` (from `^4.0.10`)
- Run `pnpm install` to update `pnpm-lock.yaml`
- Verify single Vite version with `pnpm why vite`

**Architecture Changes**: None. This is a pure dependency version synchronization with no code changes.

**Migration Strategy**: Not needed - this is a dependency-only change with no breaking changes.

## Implementation Plan

### Affected Files

- `package.json` (line 150) - Update root `vitest` version from `^4.0.10` to `^4.0.14`
- `packages/e2b/package.json` (line 42) - Update workspace `vitest` version from `^4.0.10` to `^4.0.14`
- `pnpm-lock.yaml` - Will be auto-regenerated with correct dependency tree

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Root package.json

Update the `vitest` version specification in the root `package.json` to match `@vitest/coverage-v8` peer requirements.

- Edit `package.json` line 150
- Change `"vitest": "^4.0.10"` to `"vitest": "^4.0.14"`

**Why this step first**: Root changes affect the entire monorepo dependency resolution.

#### Step 2: Update packages/e2b/package.json

Update the `vitest` version in the E2B workspace package to align with root.

- Edit `packages/e2b/package.json` line 42
- Change `"vitest": "^4.0.10"` to `"vitest": "^4.0.14"`

**Why this step second**: Workspace packages must align with root versions in monorepos using pnpm.

#### Step 3: Regenerate Lock File

Run `pnpm install` to update `pnpm-lock.yaml` with the corrected dependency tree.

- Execute: `pnpm install`
- Verify `pnpm-lock.yaml` is updated with single Vite version

#### Step 4: Verify Single Vite Version

Confirm the duplicate is resolved and only one Vite version exists.

- Execute: `pnpm why vite`
- Expected output: Single Vite version (7.2.4) with clear dependency path
- If duplicate still exists, investigate for other vitest mismatches

#### Step 5: Run Validation

Run all quality checks to ensure no regressions.

- Run `pnpm typecheck` - Must pass without errors
- Run `pnpm lint` - Must pass without errors
- Run `pnpm format` - Check formatting is correct

## Testing Strategy

### Unit Tests

No new unit tests needed - this is a dependency version change with no code changes.

**Test files**: None required

Existing tests will implicitly verify vitest 4.0.14 compatibility:
- ✅ `pnpm test:unit` - All existing unit tests will run with new vitest version
- ✅ `pnpm test:coverage` - Coverage testing will run with `@vitest/coverage-v8@^4.0.14`

### Integration Tests

No integration tests needed for dependency changes.

### E2E Tests

No E2E tests needed - the change affects build/test tooling, not application functionality.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] `pnpm install` completes successfully
- [ ] No error messages during dependency resolution
- [ ] `pnpm why vite` shows only one Vite version (7.2.4)
- [ ] `pnpm typecheck` passes without errors
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm test:unit` runs successfully
- [ ] `pnpm test:coverage` runs without errors
- [ ] Build process succeeds: `pnpm build`
- [ ] Verify disk space: `du -sh node_modules` (should be smaller than before)

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Vitest Incompatibility**: Upgrading from 4.0.10 to 4.0.14 could introduce breaking changes
   - **Likelihood**: low - These are patch versions with no documented breaking changes
   - **Impact**: medium - Would break CI/CD and tests
   - **Mitigation**: Run full test suite (`pnpm test`) before committing. Vitest patch releases are stable.

2. **Vite Plugin Incompatibility**: Changes in Vite 7.2.4 could affect build/dev server
   - **Likelihood**: low - Same major.minor version, only patch upgrade
   - **Impact**: medium - Could affect dev experience or build success
   - **Mitigation**: Start dev server with `pnpm dev` to verify. Test build with `pnpm build`.

3. **Lock File Conflicts**: Large lock file changes could cause merge conflicts
   - **Likelihood**: low - Isolated to vitest/vite subtree
   - **Impact**: low - Easily resolved by rerunning `pnpm install`
   - **Mitigation**: Commit lock file changes immediately after install. Document in PR.

**Rollback Plan**:

If issues arise after this change:
1. Revert `package.json` changes: `git checkout package.json packages/e2b/package.json`
2. Revert lock file: `git checkout pnpm-lock.yaml`
3. Reinstall dependencies: `pnpm install`
4. Investigate root cause of incompatibility and file issue for more comprehensive fix

**Monitoring** (if needed):

No special monitoring required - this is a development dependency change with no runtime impact.

## Performance Impact

**Expected Impact**: minimal improvement

- **Disk space saved**: 50-100MB (approximate)
- **Install time**: May be slightly faster (one less Vite version to fetch/install)
- **Build time**: No change expected (Vite functionality equivalent between 7.2.2 and 7.2.4)

**Performance Testing**:
- Measure before: `du -sh node_modules`
- Apply fix: Update versions, run `pnpm install`
- Measure after: `du -sh node_modules`
- Compare install time: Time `pnpm install` before and after

## Security Considerations

**Security Impact**: none

No security vulnerabilities are known between Vite 7.2.2 and 7.2.4 that would impact this upgrade. This is purely a dependency cleanup.

## Validation Commands

### Before Fix (Duplicate Should Exist)

```bash
# Show both Vite versions before fix
pnpm why vite
# Expected output: Multiple Vite entries (7.2.2 and 7.2.4)
```

**Expected Result**: Two Vite versions listed in dependency tree

### After Fix (Single Version Should Exist)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Unit tests
pnpm test:unit

# Coverage tests
pnpm test:coverage

# Build
pnpm build

# Manual verification - check single Vite version
pnpm why vite
# Expected: Single Vite 7.2.4 entry

# Check disk space improvement
du -sh node_modules
```

**Expected Result**:
- All commands succeed
- Single Vite version (7.2.4) shown in `pnpm why vite`
- Reduced `node_modules` disk usage
- Zero regressions in tests

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify dev server starts
pnpm dev &
# Wait 10 seconds, check for errors
pkill -f "turbo dev"

# Additional regression check - verify workspace health
pnpm manypkg:check
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

**No new dependencies added** - this is purely a version alignment of existing dependencies.

## Database Changes

No database changes required - this is a build/test tooling change.

## Deployment Considerations

**Deployment Risk**: low

This change is development/build-time only and has no impact on production:
- No code changes
- No runtime behavior changes
- No database changes
- No API changes

**Special deployment steps**: None required

**Feature flags needed**: No

**Backwards compatibility**: fully maintained - Vite 7.2.2 and 7.2.4 are compatible at the application level

## Success Criteria

The fix is complete when:
- [ ] `package.json` line 150 updated to `vitest: ^4.0.14`
- [ ] `packages/e2b/package.json` line 42 updated to `vitest: ^4.0.14`
- [ ] `pnpm install` completes successfully with updated lock file
- [ ] `pnpm why vite` shows only one Vite version (7.2.4)
- [ ] `pnpm typecheck` passes without errors
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm test:unit` passes without errors
- [ ] `pnpm test:coverage` passes without errors
- [ ] `pnpm build` succeeds
- [ ] Zero regressions detected
- [ ] Disk space reduced by approximately 50-100MB

## Notes

This is a straightforward dependency cleanup addressing a monorepo health issue. The root cause is a version mismatch between `vitest` and `@vitest/coverage-v8` peer dependencies. By aligning to the required versions, we improve:

1. **Monorepo cleanliness** - Single version of Vite in dependency tree
2. **Disk space** - Removes unnecessary duplicate Vite installation
3. **Dependency resolution** - Cleaner pnpm lock file
4. **Development experience** - Reduced node_modules size, faster installs

The change is low-risk because Vitest 4.0.14 is patch-compatible with 4.0.10 and introduces no breaking changes.

Related to: SlideHeroes monorepo structure using Turborepo and pnpm workspaces (see `development/architecture-overview.md` and `development/makerkit-integration.md`)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #740*
