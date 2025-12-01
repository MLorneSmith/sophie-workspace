# Bug Fix: Build warnings for baseline-browser-mapping and Prettier infrastructure removal

**Related Diagnosis**: #801
**Severity**: low
**Bug Type**: tooling
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Transitive dependency baseline-browser-mapping outdated (v2.8.29 vs v2.8.32) + Prettier infrastructure retained after Biome migration
- **Fix Approach**: Update baseline-browser-mapping via pnpm overrides + remove unused Prettier packages and configs
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

During `pnpm run build`, the build displays warning messages:
1. `[baseline-browser-mapping] The data in this module is over two months old` - repeated 10+ times during payload build
2. Prettier infrastructure remains despite migration to Biome (unnecessary dependencies, configs, scripts)

The warnings are informational only and don't prevent the build from succeeding, but they clutter the build output and indicate unresolved technical debt.

For full details, see diagnosis issue #801.

### Solution Approaches Considered

#### Option 1: Targeted Baseline Update + Prettier Cleanup ⭐ RECOMMENDED

**Description**:
- Use pnpm overrides to pin baseline-browser-mapping to latest (v2.8.32)
- Remove Prettier devDependency from root package.json
- Remove `@kit/prettier-config` package export
- Update format scripts in packages to use Biome
- Delete obsolete Prettier configuration files

**Pros**:
- Eliminates both warnings in one focused fix
- Removes unneeded dependencies (reduced bundle size)
- Consolidates formatter tooling to single solution (Biome)
- Aligns codebase with migration intent
- Low risk since Biome is already active and working

**Cons**:
- Requires updating multiple package.json files
- Need to verify Biome handles all formatting cases previously handled by Prettier

**Risk Assessment**: low - This is a straightforward cleanup with no behavioral changes. Biome is already the primary formatter.

**Complexity**: simple - Just dependency updates and file deletion.

#### Option 2: Update Baseline Only (Leave Prettier)

**Description**: Only update baseline-browser-mapping to v2.8.32, leave Prettier infrastructure intact.

**Why Not Chosen**: Doesn't address the underlying technical debt of the Prettier migration. Since Biome is already active, maintaining both formatter packages is redundant.

### Selected Solution: Targeted Baseline Update + Prettier Cleanup

**Justification**: This approach completely resolves both warnings while cleaning up technical debt. The Prettier migration was intended to consolidate to Biome, so removing the legacy infrastructure aligns with that intent. The risk is minimal since Biome is already the active formatter and has been proven working.

**Technical Approach**:
- Add pnpm override for baseline-browser-mapping to pin to 2.8.32
- Remove `prettier` from root devDependencies
- Remove `@kit/prettier-config` export from @kit/ui or relevant packages
- Update package scripts that reference Prettier to use Biome
- Delete `tooling/prettier/` directory (if it exists as separate package)
- Delete `apps/payload/.prettierrc.json` config file

**Architecture Changes**: None - This is pure cleanup.

## Implementation Plan

### Affected Files

Files that need modification:
- `pnpm-workspace.yaml` or `package.json` (root) - Add pnpm overrides, remove Prettier devDependency
- `packages/features/*/package.json` - Update format scripts from Prettier to Biome
- `apps/*/package.json` - Update format scripts from Prettier to Biome
- `apps/payload/.prettierrc.json` - Delete (Prettier config)
- `tooling/prettier/` - Delete directory if it exists as separate package
- `.prettierrc` or similar root config - Delete if exists

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Add baseline-browser-mapping Override

Update root `package.json` or `pnpm-workspace.yaml` with override:

```json
{
  "pnpm": {
    "overrides": {
      "baseline-browser-mapping": "^2.8.32"
    }
  }
}
```

**Why this step first**: This is the quickest fix for one of the warnings and validates the approach.

#### Step 2: Remove Prettier Dependencies

- Remove `prettier` from root `package.json` devDependencies
- Remove `"prettier": "@kit/prettier-config"` export from package.json if present
- Run `pnpm install` to update lock file

**Why this step second**: Dependency cleanup must happen before updating scripts to avoid references to missing packages.

#### Step 3: Update Format Scripts

Search for and update all package.json scripts that use Prettier:

Search pattern: `prettier --check` or `prettier --write`

Replace with Biome equivalents:
- `prettier --check` → `biome check`
- `prettier --write` → `biome check --write`
- `prettier` → `biome check`

Files to check:
- `apps/payload/package.json`
- `apps/web/package.json`
- `apps/e2e/package.json`
- `apps/dev-tool/package.json` (if exists)
- `packages/*/package.json`

#### Step 4: Delete Obsolete Prettier Files

- Delete `apps/payload/.prettierrc.json`
- Delete `tooling/prettier/` directory if it exists as separate package
- Delete any root-level `.prettierrc`, `.prettierrc.json`, `.prettierrc.js` configs

Verify no remaining Prettier config files:
```bash
find . -name ".prettierrc*" -type f 2>/dev/null
find . -name "prettier.config.*" -type f 2>/dev/null
```

#### Step 5: Validate Changes

- Run `pnpm install` to verify no dependency conflicts
- Run `pnpm typecheck` to ensure no type errors
- Run `pnpm lint` to verify Biome works as expected
- Run `pnpm build` to verify baseline-browser-mapping warning is gone
- Run `pnpm format:check` (or equivalent Biome command) to verify formatting works

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm install` - succeeds without conflicts
- [ ] Run `pnpm build` - no baseline-browser-mapping warnings appear
- [ ] Search build output for "baseline-browser-mapping" - no results
- [ ] Search build output for "prettier" - no unexpected references (except in comments/docs)
- [ ] Run `pnpm lint` - passes without errors
- [ ] Run `pnpm format:check` - passes and uses Biome, not Prettier
- [ ] Verify `tooling/prettier/` directory is deleted
- [ ] Verify `apps/payload/.prettierrc.json` is deleted
- [ ] Verify `prettier` is not in `package.json` devDependencies
- [ ] Manual code check: no lingering references to `@kit/prettier-config`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Breaking formatting changes**: If Prettier and Biome handle certain formatting differently
   - **Likelihood**: low
   - **Impact**: medium (CI lint failures)
   - **Mitigation**: Biome is already the active formatter with working CI, so this is unlikely. Run full lint suite after changes.

2. **Deleted files still referenced**: If some config references Prettier package
   - **Likelihood**: low
   - **Impact**: medium (build failures)
   - **Mitigation**: Search codebase for "prettier" and "format: prettier" before deleting. Update all found references.

3. **Script errors**: If Biome command syntax differs from updated scripts
   - **Likelihood**: low
   - **Impact**: low (format scripts fail but build succeeds)
   - **Mitigation**: Test format scripts locally before commit.

**Rollback Plan**:

If issues arise after this fix:
1. Revert changes to package.json files
2. Restore deleted files from git history
3. Run `pnpm install` to restore dependencies
4. The baseline-browser-mapping warning will return, but everything else will work

**Monitoring**: No special monitoring needed - this is low-risk infrastructure cleanup.

## Performance Impact

**Expected Impact**: minimal

Removing unused dependencies slightly reduces:
- Install time (one fewer package)
- Node_modules size (prettier and related packages removed)
- Build time (marginally, from fewer transitive dependencies)

No functional performance changes since Biome is the actual formatter.

## Security Considerations

**Security Impact**: low

Removing Prettier removes potential attack surface from that dependency. No security vulnerabilities expected in this change.

## Validation Commands

### Before Fix (Warnings Should Appear)

```bash
# Build and observe warnings
pnpm run build 2>&1 | grep -i "baseline-browser-mapping\|over two months old" | head -5
```

**Expected Result**: See 10+ instances of baseline-browser-mapping warning.

### After Fix (Warnings Should Be Gone)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format check
pnpm format:check

# Build (should show no baseline-browser-mapping warnings)
pnpm build 2>&1 | grep -i "baseline-browser-mapping"
# Should return empty (no matches)

# Verify Prettier is not in dependencies
grep -i "prettier" package.json
# Should show no "prettier" devDependency

# Verify .prettierrc files are gone
find . -name ".prettierrc*" -type f 2>/dev/null
# Should return empty
```

**Expected Result**: All commands succeed, no baseline-browser-mapping warnings, Prettier completely removed from project.

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Run linting on all code
pnpm lint

# Verify build succeeds
pnpm build
```

## Dependencies

No new dependencies required. This fix removes dependencies.

**Dependencies removed**:
- `prettier`
- `@prettier/plugin-*` (if any)
- `@kit/prettier-config` (if published separately)

## Database Changes

No database changes required.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None needed. This is a pure dependency cleanup.

**Feature flags needed**: No

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] `pnpm install` succeeds without errors
- [ ] `pnpm build` completes with zero baseline-browser-mapping warnings
- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] No remaining `.prettierrc` files in the repository
- [ ] No remaining `prettier` in devDependencies
- [ ] All format scripts updated to use Biome
- [ ] Build output verified clean of formatter-related warnings

## Notes

This fix addresses low-severity build warnings but improves code quality by:
1. Removing technical debt from an incomplete migration
2. Consolidating formatter tooling to a single solution
3. Reducing unnecessary dependencies
4. Keeping build output clean and signal-focused

The baseline-browser-mapping warning is from a transitive dependency (eslint-plugin-react-hooks → @babel/core → browserslist → baseline-browser-mapping), so the override approach is the cleanest solution without requiring changes to direct dependencies.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #801*
