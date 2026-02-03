# Bug Diagnosis: Dev Deploy fails with pnpm lockfile mismatch

**ID**: ISSUE-pending
**Created**: 2026-01-29T18:44:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The dev-deploy CI/CD pipeline fails during Vercel deployment because the `pnpm-lock.yaml` file is out of sync with `apps/web/package.json`. A new dependency `agentation@^1.3.2` was added to package.json but the lockfile was not regenerated, causing `pnpm install --frozen-lockfile` to fail on Vercel's build servers.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI/CD (GitHub Actions → Vercel)
- **Node Version**: Not directly relevant (pnpm version mismatch)
- **pnpm Version**: 10.14.0 (packageManager field)
- **Last Working**: Commit `4487df5f4` - "chore(deps): bump next from 16.0.10 to 16.1.5"

## Reproduction Steps

1. Run `pnpm install --frozen-lockfile` in the repository root
2. Observe the error: `ERR_PNPM_OUTDATED_LOCKFILE`
3. Or push to `dev` branch and observe the dev-deploy workflow failure

## Expected Behavior

The `pnpm install --frozen-lockfile` command should complete successfully, and Vercel deployment should proceed to the build phase.

## Actual Behavior

Vercel build fails with:
```
Error: Command "pnpm install --frozen-lockfile" exited with 1
```

## Diagnostic Data

### Console Output
```
Scope: all 46 workspace projects
 ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>/apps/web/package.json

Note that in CI environments this setting is true by default. If you still need to run install in such cases, use "pnpm install --no-frozen-lockfile"

  Failure reason:
  specifiers in the lockfile don't match specifiers in package.json:
* 1 dependencies were added: agentation@^1.3.2
```

### Network Analysis
```
Not applicable - this is a local dependency resolution issue
```

### Database Analysis
```
Not applicable - this is a CI/CD pipeline issue
```

### Performance Metrics
```
Not applicable
```

### Screenshots
- GitHub Actions Run: https://github.com/slideheroes/2025slideheroes/actions/runs/21490390294
- Vercel Build: https://vercel.com/slideheroes/2025slideheroes-web/21EFb4UE7k5C4Q8yD4bHhfh3vzLs

## Error Stack Traces
```
Deploy Web App to Dev	UNKNOWN STEP	2026-01-29T18:44:38.2660466Z Error: Command "pnpm install --frozen-lockfile" exited with 1
Deploy Web App to Dev	UNKNOWN STEP	2026-01-29T18:44:38.3634752Z ##[error]Process completed with exit code 1.
```

## Related Code
- **Affected Files**:
  - `apps/web/package.json` (line 84: contains `agentation@^1.3.2`)
  - `pnpm-lock.yaml` (missing entry for `agentation`)
- **Recent Changes**:
  - Commit `58ae44046` ("feat(ui): implement design system typography and styling") added the `agentation` dependency
  - Commit `50ce06164` ("chore(tooling): add reports, skills, and update orchestrator state") was pushed triggering the failed deploy
- **Suspected Functions**: N/A - this is a dependency management issue

## Related Issues & Context

### Direct Predecessors
- #1785 (CLOSED): "Bug Fix: Deploy to Dev fails with pnpm lockfile mismatch" - Exact same issue pattern
- #1784 (CLOSED): "Bug Diagnosis: Deploy to Dev fails with pnpm lockfile mismatch" - Previous diagnosis of same issue

### Related Infrastructure Issues
- #1846 (CLOSED): "Bug Diagnosis: Alpha Orchestrator Crashes with E2B Timeout During pnpm install"
- #1478 (CLOSED): "Bug Diagnosis: Vercel Deploy to Dev fails with corepack enable exit code 1"

### Similar Symptoms
- Same error pattern: `ERR_PNPM_OUTDATED_LOCKFILE`
- Same failure point: Vercel's `pnpm install --frozen-lockfile`

### Same Component
- CI/CD pipeline (dev-deploy.yml)
- Vercel deployment action

### Historical Context
This is a **recurring pattern** where dependencies are added to package.json files without regenerating the lockfile. This has happened at least twice before (#1784, #1785). The root cause is human error during development - the lockfile regeneration step is sometimes forgotten.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `agentation@^1.3.2` dependency was added to `apps/web/package.json` in commit `58ae44046` but the `pnpm-lock.yaml` was not regenerated to include this new dependency.

**Detailed Explanation**:
When a developer added the `agentation` dependency to `apps/web/package.json`, they did not run `pnpm install` to update the lockfile. Vercel's build process uses `pnpm install --frozen-lockfile` which requires the lockfile to exactly match all package.json files. Since the lockfile is missing the `agentation` entry, pnpm refuses to install with the `--frozen-lockfile` flag.

**Supporting Evidence**:
1. Local reproduction confirms the error:
   ```
   ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date
   Failure reason: specifiers in the lockfile don't match specifiers in package.json:
   * 1 dependencies were added: agentation@^1.3.2
   ```

2. Git diff shows the dependency was added in commit `58ae44046`:
   ```diff
   +		"agentation": "^1.3.2",
   ```

3. Grep confirms `agentation` exists in package.json but NOT in pnpm-lock.yaml

### How This Causes the Observed Behavior

1. Developer adds `agentation@^1.3.2` to `apps/web/package.json`
2. Developer does NOT run `pnpm install` to regenerate lockfile
3. Changes are committed and pushed to `dev` branch
4. GitHub Actions triggers `dev-deploy` workflow
5. Workflow deploys to Vercel
6. Vercel runs `pnpm install --frozen-lockfile` during build
7. pnpm detects lockfile is out of sync with package.json
8. pnpm exits with error code 1
9. Vercel build fails
10. GitHub Actions marks the job as failed

### Confidence Level

**Confidence**: High

**Reasoning**:
- Local reproduction produces the exact same error
- The error message explicitly names `agentation@^1.3.2` as the missing dependency
- Git history confirms this dependency was added without lockfile update
- This exact pattern has occurred before (#1784, #1785)

## Fix Approach (High-Level)

Run `pnpm install` at the repository root to regenerate `pnpm-lock.yaml` with the new `agentation` dependency, then commit and push the updated lockfile. This will bring the lockfile back in sync with all package.json files.

```bash
pnpm install
git add pnpm-lock.yaml
git commit -m "fix(deps): regenerate lockfile to include agentation dependency"
git push
```

## Diagnosis Determination

The root cause is definitively identified: the `agentation@^1.3.2` dependency was added to `apps/web/package.json` without regenerating `pnpm-lock.yaml`. This causes Vercel's `pnpm install --frozen-lockfile` to fail because it requires exact lockfile-to-package.json synchronization.

This is a straightforward fix that requires regenerating the lockfile and pushing the update.

## Additional Context

**Prevention Recommendation**: Consider adding a pre-commit hook or CI check that verifies `pnpm install --frozen-lockfile` succeeds before allowing commits that modify package.json files. This would catch lockfile mismatches before they reach CI/CD.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh issue list, git log, git show, grep, pnpm install --frozen-lockfile (local test)*
