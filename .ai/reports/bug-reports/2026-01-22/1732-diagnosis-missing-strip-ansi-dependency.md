# Bug Diagnosis: Missing strip-ansi Dependency in orchestrator-ui Package

**ID**: ISSUE-1732
**Created**: 2026-01-22T17:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The "Deploy to Dev" CI workflow fails on the pre-deployment validation step because the `strip-ansi` package is imported in `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` but was never added as a dependency to `.ai/alpha/scripts/ui/package.json`. This is the same class of bug as issues #1721/#1723 (missing @posthog/nextjs-config dependency).

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: 22.x (via runs-on spot instances)
- **Last Working**: 2026-01-22T16:15:28Z (commit `95d6abdeb` - before the strip-ansi import was added)

## Reproduction Steps

1. Push any commit to the `dev` branch
2. The "Deploy to Dev" workflow triggers
3. The "Pre-deployment Validation" job runs `pnpm typecheck`
4. Turbo runs `@slideheroes/orchestrator-ui:typecheck`
5. TypeScript fails with error TS2307: Cannot find module 'strip-ansi'

## Expected Behavior

The typecheck should pass because all imports have corresponding dependencies declared in package.json.

## Actual Behavior

TypeScript compilation fails with:
```
error TS2307: Cannot find module 'strip-ansi' or its corresponding type declarations.
```

## Diagnostic Data

### Console Output
```
@slideheroes/orchestrator-ui:typecheck
cache miss, executing b94681b8388aa59e

> @slideheroes/orchestrator-ui@1.0.0 typecheck /home/runner/_work/2025slideheroes/2025slideheroes/.ai/alpha/scripts/ui
> tsc --noEmit

components/SandboxColumn.tsx(4,23): error TS2307: Cannot find module 'strip-ansi' or its corresponding type declarations.
 ELIFECYCLE  Command failed with exit code 2.
```

### Network Analysis
N/A - This is a local dependency resolution issue.

### Database Analysis
N/A

### Performance Metrics
N/A

### Screenshots
N/A

## Error Stack Traces
```
##[error]components/SandboxColumn.tsx(4,23): error TS2307: Cannot find module 'strip-ansi' or its corresponding type declarations.
##[error]@slideheroes/orchestrator-ui#typecheck: command (/home/runner/_work/2025slideheroes/2025slideheroes/.ai/alpha/scripts/ui) /home/runner/setup-pnpm/node_modules/.bin/pnpm run typecheck exited (2)
```

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/ui/components/SandboxColumn.tsx` (line 4: `import stripAnsi from "strip-ansi";`)
  - `.ai/alpha/scripts/ui/package.json` (missing `strip-ansi` dependency)
- **Recent Changes**: Commit `e43560245` ("fix(tooling): resolve orchestrator completion phase issues") introduced the strip-ansi import without updating package.json
- **Suspected Functions**: N/A - this is a dependency management issue

## Related Issues & Context

### Direct Predecessors
- #1721 (CLOSED): "Bug Diagnosis: Missing @posthog/nextjs-config Dependency" - Identical issue pattern where an import was added without updating package.json
- #1723 (CLOSED): "Bug Fix: Missing @posthog/nextjs-config dependency" - The fix for #1721, demonstrates the required solution pattern
- #1727 (CLOSED): "Bug Fix: Alpha Orchestrator Completion Phase Issues" - The PR that introduced this bug (Step 4: "Strip ANSI escape sequences before rendering output")

### Related Infrastructure Issues
- #1730 (CLOSED): "Bug Fix: Flaky Timing Test" - Fixed in same commit but unrelated to this issue

### Historical Context
This is a **repeat pattern** of the same bug type. Commit `e43560245` was created to fix issue #1727 but introduced the same class of bug that was just fixed in #1723. The implementation added a new import (`strip-ansi`) without updating the package.json dependencies.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Commit `e43560245` added `import stripAnsi from "strip-ansi"` to `SandboxColumn.tsx` without adding `strip-ansi` to the `package.json` dependencies.

**Detailed Explanation**:
In commit `e43560245` (fix for #1727), the developer added ANSI stripping functionality to the orchestrator UI to fix truncation artifacts. The implementation correctly imported the `strip-ansi` package on line 4 of `SandboxColumn.tsx`:

```typescript
import stripAnsi from "strip-ansi";
```

However, the `strip-ansi` package was never added to `.ai/alpha/scripts/ui/package.json`. This went undetected locally because:
1. `strip-ansi` is a transitive dependency of `@commitlint/cli` (via `yargs` → `cliui` → `strip-ansi`)
2. pnpm's hoisting mechanism made it available locally
3. Local TypeScript could resolve the module through node_modules

In CI, the `@slideheroes/orchestrator-ui` package is type-checked independently, and without `strip-ansi` as a declared dependency, the module cannot be resolved.

**Supporting Evidence**:
- Stack trace: `components/SandboxColumn.tsx(4,23): error TS2307: Cannot find module 'strip-ansi'`
- Code reference: `.ai/alpha/scripts/ui/components/SandboxColumn.tsx:4` contains `import stripAnsi from "strip-ansi";`
- Git blame: `git log --oneline -5 -- .ai/alpha/scripts/ui/components/SandboxColumn.tsx` shows commit `e43560245` modified this file
- The package.json at `.ai/alpha/scripts/ui/package.json` does not include `strip-ansi` in dependencies or devDependencies

### How This Causes the Observed Behavior

1. Developer adds `strip-ansi` import to fix ANSI truncation issue (#1727)
2. Developer runs typecheck locally - passes (strip-ansi available via hoisting)
3. Developer commits and pushes to `dev` branch
4. CI runs `pnpm install --frozen-lockfile` in clean environment
5. Turbo runs typecheck on `@slideheroes/orchestrator-ui` package
6. TypeScript cannot find `strip-ansi` - package not in package.json
7. Build fails with TS2307

### Confidence Level

**Confidence**: High

**Reasoning**: The error message explicitly identifies the exact file and line number where the missing import occurs. The package.json clearly lacks the dependency. This is the same pattern as issue #1721/#1723 which was just fixed, confirming the diagnosis.

## Fix Approach (High-Level)

Add `strip-ansi` as a dependency to `.ai/alpha/scripts/ui/package.json`:

```bash
pnpm --filter @slideheroes/orchestrator-ui add strip-ansi
```

This will:
1. Add `"strip-ansi": "^X.Y.Z"` to package.json dependencies
2. Update pnpm-lock.yaml with the resolution
3. Allow CI typecheck to resolve the module

## Diagnosis Determination

**Root cause confirmed**: Missing dependency declaration in package.json.

The fix is straightforward and matches the pattern used for #1723:
1. Run `pnpm --filter @slideheroes/orchestrator-ui add strip-ansi`
2. Verify with `pnpm --filter @slideheroes/orchestrator-ui typecheck`
3. Commit and push

## Additional Context

This is the second occurrence of this bug pattern within 2 hours:
- #1723: Missing @posthog/nextjs-config (fixed 2026-01-22T15:48:52Z)
- This issue: Missing strip-ansi (failed 2026-01-22T16:33:23Z)

**Recommendation**: Consider adding a pre-commit hook or CI check that validates all imports have corresponding package.json entries.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view --log-failed, gh issue view, git log, git show, Read, pnpm why*
