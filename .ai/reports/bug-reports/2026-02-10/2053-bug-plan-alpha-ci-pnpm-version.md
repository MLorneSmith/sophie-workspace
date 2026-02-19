# Bug Fix: Alpha validation CI fails - pnpm/action-setup@v4 dual version rejection

**Related Diagnosis**: #2052 (REQUIRED)
**Severity**: high
**Bug Type**: error
**Risk Level**: low
**Complexity**: moderate

## Quick Reference

- **Root Cause**: `pnpm/action-setup@v4` now enforces single-source version specification and rejects having version specified in both workflow YAML and `package.json`'s `packageManager` field
- **Fix Approach**: Remove `version` parameter from workflows + update E2B templates to use pnpm 10.29.2
- **Estimated Effort**: medium
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `alpha-validation.yml` and `bundle-size-alert.yml` GitHub Actions workflows failed with error:
```
Error: Multiple versions of pnpm specified:
  - version 10.29.2 in the GitHub Action config with the key "version"
  - version pnpm@10.29.2+sha512... in the package.json with the key "packageManager"
```

This is caused by `pnpm/action-setup@v4` (released 2026-02-07) enforcing stricter version specification rules. Previously, providing `version` in the workflow while having `packageManager` in `package.json` was tolerated; now it's explicitly rejected.

For full details, see diagnosis issue #2052.

### Solution Approaches Considered

#### Option 1: Remove `version` parameter from workflows ⭐ RECOMMENDED

**Description**: Remove the explicit `version: ${{ env.PNPM_VERSION }}` parameter from both `pnpm/action-setup@v4` calls. The action will auto-detect the version from `package.json`'s `packageManager` field, which is already set to `pnpm@10.29.2+sha512...`.

**Pros**:
- Single source of truth (version in `package.json` only)
- Simplifies workflow files
- Automatic version propagation when `package.json` updates
- Zero environment variable maintenance
- Already applied in the codebase

**Cons**:
- None significant

**Risk Assessment**: low - this is the recommended approach from `pnpm/action-setup` maintainers

**Complexity**: simple - single-line removal in 2 files

#### Option 2: Move version to environment variable only

**Description**: Remove `packageManager` from `package.json` and keep `version` parameter in workflows using environment variables.

**Pros**:
- Explicit version control in workflows

**Cons**:
- Breaks Corepack support (Node.js built-in package manager manager)
- Loses versioning from package.json metadata
- Creates additional environment variable to maintain
- Inconsistent with Node.js best practices

**Why Not Chosen**: Creates more complexity and loses benefits of Corepack integration; the chosen option (1) is simpler.

#### Option 3: Use Corepack with prepared=false

**Description**: Enable Corepack in the action with `with: { run: 'pnpm' }` and rely purely on Corepack.

**Pros**:
- Follows Node.js best practices

**Cons**:
- Would require additional workflow changes
- Current setup already works with Option 1

**Why Not Chosen**: Option 1 (already applied) is simpler and sufficient for current needs.

### Selected Solution: Remove `version` parameter from workflows

**Justification**: This is the simplest, most maintainable solution. The `pnpm/action-setup@v4` documentation explicitly recommends auto-detection from `package.json`. With `packageManager: "pnpm@10.29.2+sha512..."` already in `package.json`, the action will correctly detect and use pnpm 10.29.2 without any explicit `version` parameter.

**Technical Approach**:
- The `pnpm/action-setup@v4` action checks for version in this order:
  1. Explicit `version:` parameter in the action
  2. `packageManager` field in `package.json`
  3. Latest pnpm (fallback)
- By removing the `version:` parameter, we allow step 2 to take effect
- This is already correctly applied in the codebase

**Architecture Changes**: None - this is a simplification, not an architectural change.

## Implementation Plan

### Affected Files

List files that need modification:
- `.github/workflows/alpha-validation.yml` - ✅ ALREADY FIXED (removed `version` parameter, line 34-35)
- `.github/workflows/bundle-size-alert.yml` - ✅ ALREADY FIXED (removed `version` parameter, line 39)
- `.ai/alpha/e2b-templates/slideheroes-gpt-agent-dev/e2b.Dockerfile` - Update `pnpm@9` to `pnpm@10` (line 18)
- `packages/e2b/e2b-template/template.ts` - Update `pnpm@10.14.0` to `pnpm@10.29.2` (line 8 comment, line 254 corepack prepare)

**Status**: The CI workflow fix has been applied. E2B template updates are pending.

### New Files

No new files needed.

### Step-by-Step Tasks

**IMPORTANT**: These steps validate the already-applied fix and commit the changes.

#### Step 1: Validate the CI Fix Changes

<describe what this step accomplishes>
Confirm that both workflow files have been correctly updated to remove the `version` parameter from `pnpm/action-setup@v4`.

- Review `.github/workflows/alpha-validation.yml` line 34-35 confirms `uses: pnpm/action-setup@v4` without `version:` parameter
- Review `.github/workflows/bundle-size-alert.yml` line 39 confirms `uses: pnpm/action-setup@v4` without `version:` parameter
- Verify `package.json` contains `"packageManager": "pnpm@10.29.2+sha512..."`

**Why this step first**: Ensures the fix is correctly applied before proceeding to testing.

#### Step 2: Run CI Validation

<describe what this step accomplishes>
Execute the validation commands to ensure workflows will function correctly.

- Run `pnpm typecheck` to verify no build issues
- Run `pnpm lint` to verify code quality
- Verify no changes to package manager detection

**Why this step**: Confirms that the removed `version` parameter doesn't break any local setup.

#### Step 3: Commit the CI Fix

<describe what this step accomplishes>
Create a git commit with the CI workflow fixes. This must follow Conventional Commits format.

- Stage the changed workflow files: `.github/workflows/alpha-validation.yml` and `.github/workflows/bundle-size-alert.yml`
- Create commit with message: `fix(ci): resolve pnpm/action-setup@v4 dual version rejection`
- Commit message should reference the diagnosis issue #2052

#### Step 4: Update GPT Agent E2B Template - pnpm Version

Update the GPT agent Dockerfile to use pnpm 10 instead of the outdated pnpm 9.

**File**: `.ai/alpha/e2b-templates/slideheroes-gpt-agent-dev/e2b.Dockerfile`

- Change line 18 from `RUN npm install -g pnpm@9` to `RUN npm install -g pnpm@10`
- This aligns the GPT sandbox with the project's `package.json` (`packageManager: "pnpm@10.29.2"`)
- Using `pnpm@10` (major version) allows minor/patch updates without Dockerfile changes

**Why this step**: The GPT agent sandbox uses pnpm 9 which cannot read the pnpm 10 lockfile format. This causes `pnpm install --frozen-lockfile` to fail inside GPT sandboxes when the lockfile has been updated by pnpm 10.

#### Step 5: Update Claude Agent E2B Template - pnpm Version

Update the Claude agent template to use pnpm 10.29.2 instead of the stale 10.14.0.

**File**: `packages/e2b/e2b-template/template.ts`

- Update line 8 comment: `pnpm 10.14.0` → `pnpm 10.29.2`
- Update line 254 corepack command: `corepack prepare pnpm@10.14.0 --activate` → `corepack prepare pnpm@10.29.2 --activate`

**Why this step**: Keeps Claude sandbox pnpm version aligned with `package.json`. Prevents lockfile checksum mismatches when the sandbox runs `pnpm install --frozen-lockfile`.

#### Step 6: Rebuild Claude Dev Template

Rebuild the Claude agent E2B template to include the updated pnpm version and agent-browser support.

- Run `pnpm e2b:build:dev` to rebuild the `slideheroes-claude-agent-dev` template
- This picks up the pnpm 10.29.2 change from Step 5
- Also includes agent-browser support (related to #2048)
- Template has not been rebuilt since November 2025

**Note**: This step requires E2B API key and takes several minutes. Can be deferred if API access is unavailable, but should be done before next Alpha orchestrator run.

#### Step 7: Commit All Changes

Create a single commit with all fixes (CI workflows + E2B templates).

- Stage all changed files:
  - `.github/workflows/alpha-validation.yml`
  - `.github/workflows/bundle-size-alert.yml`
  - `.ai/alpha/e2b-templates/slideheroes-gpt-agent-dev/e2b.Dockerfile`
  - `packages/e2b/e2b-template/template.ts`
- Create commit: `fix(ci): resolve pnpm version mismatches in CI and E2B templates`

#### Step 8: Validation

Verify the fix is complete and ready for deployment.

- Run all validation commands (see Validation Commands section)
- Confirm all files have been committed
- Verify diagnosis issue #2052 will pass CI on next push to `alpha/spec-*` branch
- Verify GPT Dockerfile uses pnpm@10
- Verify Claude template uses pnpm@10.29.2

## Testing Strategy

### Unit Tests

No unit tests needed - this is a GitHub Actions configuration fix.

### Integration Tests

**Workflow Validation**:
- Push to any `alpha/spec-*` branch should trigger `alpha-validation.yml` workflow
- PR to `main`, `staging`, or `dev` should trigger `bundle-size-alert.yml` workflow
- Both workflows should:
  - ✅ Successfully run "Setup pnpm" step without version conflict error
  - ✅ Auto-detect pnpm version from `package.json` (10.29.2)
  - ✅ Complete "Install dependencies" step successfully
  - ✅ Complete "Type check" and "Build" steps without errors

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Review `.github/workflows/alpha-validation.yml` confirms `uses: pnpm/action-setup@v4` without `version:` parameter
- [ ] Review `.github/workflows/bundle-size-alert.yml` confirms `uses: pnpm/action-setup@v4` without `version:` parameter
- [ ] Verify GPT Dockerfile line 18 reads `RUN npm install -g pnpm@10`
- [ ] Verify Claude template.ts line 254 reads `corepack prepare pnpm@10.29.2 --activate`
- [ ] Run `pnpm typecheck` to ensure no build issues
- [ ] Run `pnpm lint` to ensure code quality
- [ ] Rebuild Claude dev template with `pnpm e2b:build:dev` (if API access available)
- [ ] Commit all changes with proper Conventional Commits message

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Workflow Regression**: Removing the explicit `version` parameter could theoretically cause version mismatch
   - **Likelihood**: low - pnpm/action-setup@v4 explicitly supports auto-detection from `package.json`
   - **Impact**: medium - workflow failure would block all alpha/spec-* pushes
   - **Mitigation**: The fix has already been applied and can be validated immediately with a test push to an alpha branch

2. **Corepack Compatibility**: If Corepack behavior changes in future Node.js versions
   - **Likelihood**: low - Corepack is stable API
   - **Impact**: low - can easily be reverted
   - **Mitigation**: Monitor Node.js release notes

3. **GPT Sandbox pnpm 10 Compatibility**: OpenAI Codex CLI or sandbox scripts may have pnpm 9 assumptions
   - **Likelihood**: low - pnpm 10 is backwards compatible for CLI usage
   - **Impact**: medium - GPT agent sandbox failures would block Alpha orchestrator GPT features
   - **Mitigation**: Test sandbox creation after rebuild; pnpm 10 CLI is a superset of pnpm 9

4. **Claude Template Rebuild Failure**: E2B build may fail if API key expired or infra changed
   - **Likelihood**: low - E2B SDK is stable
   - **Impact**: low - existing template still works, just has older pnpm
   - **Mitigation**: Defer rebuild if API access unavailable; existing template functions correctly

**Rollback Plan**:

If the fix causes workflow failures:
1. Revert commits: `git revert <commit-hash>`
2. Push to `dev` branch
3. If immediate fix needed, add back `version: ${{ env.PNPM_VERSION }}` parameter to both action calls
4. Revert `package.json` `packageManager` field if necessary (unlikely)

**Monitoring** (if needed):
- Watch for workflow failures on next `alpha/spec-*` push
- Monitor for version mismatch errors in GitHub Actions logs

## Performance Impact

**Expected Impact**: none

The removal of an explicit version parameter has no performance impact. The auto-detection from `package.json` happens at the same point in the workflow.

## Security Considerations

**Security Impact**: none

This fix has no security implications. It's purely a configuration adjustment to align with `pnpm/action-setup@v4` requirements.

## Validation Commands

### Before Fix (Bug Should Reproduce)

The bug has already been fixed. To understand the original issue, the error would have been:
```
Error: Multiple versions of pnpm specified:
  - version 10.29.2 in the GitHub Action config with the key "version"
  - version pnpm@10.29.2+sha512... in the package.json with the key "packageManager"
```

This would occur at the "Setup pnpm" step in GitHub Actions workflows when pushing to `alpha/spec-*` branches.

### After Fix (Bug Should Be Resolved)

```bash
# Verify workflow files are correctly formatted
cat .github/workflows/alpha-validation.yml | grep -A 1 "Setup pnpm"
# Should show: uses: pnpm/action-setup@v4 (WITHOUT version: parameter)

cat .github/workflows/bundle-size-alert.yml | grep -A 1 "pnpm/action-setup"
# Should show: uses: pnpm/action-setup@v4 (WITHOUT version: parameter)

# Verify package.json has packageManager field
grep packageManager package.json
# Should show: "packageManager": "pnpm@10.29.2+sha512..."

# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Verify no other changes
git status
# Should show only .github/workflows/alpha-validation.yml and .github/workflows/bundle-size-alert.yml modified
```

**Expected Result**: Workflows should successfully pass the "Setup pnpm" step, correctly auto-detecting pnpm version from `package.json` without version conflict errors.

### Regression Prevention

```bash
# Run full validation
pnpm typecheck
pnpm lint

# Confirm changes are minimal (only workflow files)
git diff --name-only

# Build and test to ensure no side effects
pnpm build
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix removes explicit version specification, relying on the existing `package.json` `packageManager` field and `pnpm/action-setup@v4` auto-detection.

## Database Changes

**No database changes required**

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None - this is a workflow configuration change only
- No code changes, no database changes, no environment variable changes

**Feature flags needed**: no

**Backwards compatibility**: maintained

The fix maintains full backwards compatibility. After these changes, the workflows will behave identically - they will use pnpm 10.29.2 as specified in `package.json`.

## Success Criteria

The fix is complete when:
- [ ] Both workflow files are verified to have `version` parameter removed from `pnpm/action-setup@v4`
- [ ] GPT Dockerfile uses `pnpm@10` instead of `pnpm@9`
- [ ] Claude template uses `pnpm@10.29.2` instead of `pnpm@10.14.0`
- [ ] Claude dev template rebuilt with `pnpm e2b:build:dev` (or documented as deferred)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] Changes are committed with Conventional Commits message
- [ ] Next push to `alpha/spec-*` branch passes CI without "pnpm version conflict" errors
- [ ] `bundle-size-alert` workflow runs successfully on next PR to main/staging/dev

## Notes

### E2B Template Details

**GPT Agent Template** (`.ai/alpha/e2b-templates/slideheroes-gpt-agent-dev/`):
- Uses Dockerfile-based E2B build (`e2b.Dockerfile` + `e2b.toml`)
- Template ID: `3gil4oz7vo9ij2ki9zmm`
- The GPT template does NOT need a rebuild command from us - E2B rebuilds from Dockerfile when pushed via `e2b template build`
- For this fix, we only update the Dockerfile source; rebuild happens when the orchestrator next uses `e2b template build`

**Claude Agent Template** (`packages/e2b/e2b-template/`):
- Uses E2B SDK TypeScript-based build (no Dockerfile)
- Build command: `pnpm e2b:build:dev` (runs `packages/e2b/e2b-template/build.dev.ts`)
- Template alias: `slideheroes-claude-agent-dev`
- Not rebuilt since November 2025 - will pick up pnpm 10.29.2 and agent-browser on rebuild

### Related Issues
- #1955, #1956, #1957, #1959, #1961, #1962 - orchestrator refactors (all working correctly)
- #2048 - agent-browser template update (included in Claude template rebuild)

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #2052*
