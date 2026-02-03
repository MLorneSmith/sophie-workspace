# Bug Diagnosis: Dev-deploy workflow fails with TypeScript and lint errors

**ID**: ISSUE-pending
**Created**: 2026-02-03T21:30:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The dev-deploy workflow fails during the "Pre-deployment Validation" step due to two distinct issues: (1) a TypeScript error in the orchestrator-ui package where `verificationAttempts` is possibly undefined, and (2) Biome lint errors from broken symlinks in `.github/skills/` pointing to non-existent files in `.agents/skills/`.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions with RunsOn runners)
- **Node Version**: 22
- **Last Working**: 2026-02-03T16:24:51Z (run 21638294456)
- **Current Commit**: 9157d43ce

## Reproduction Steps

1. Push to the `dev` branch
2. Dev-deploy workflow triggers
3. "Pre-deployment Validation" job runs typecheck and lint in parallel
4. Both checks fail

## Expected Behavior

The dev-deploy workflow should pass validation checks and deploy to the development environment.

## Actual Behavior

The workflow fails at the "Pre-deployment Validation" step with:
1. TypeScript error: `TS18048: 'state.currentTask.verificationAttempts' is possibly 'undefined'`
2. Biome lint errors: Multiple "Dereferenced symlink" errors for broken symbolic links

## Diagnostic Data

### Console Output
```
TypeScript Error:
@slideheroes/orchestrator-ui#typecheck:
components/SandboxColumn.tsx(263,7): error TS18048: 'state.currentTask.verificationAttempts' is possibly 'undefined'.

Biome Lint Errors:
.github/skills/blog-post-optimizer internalError/fs
  ! Dereferenced symlink.
  i Biome encountered a file system entry that is a broken symbolic link.

(104 warnings, 8 errors total - "The number of diagnostics exceeds the limit allowed")
```

### Error Analysis

**Issue 1: TypeScript Error**
- File: `.ai/alpha/scripts/ui/components/SandboxColumn.tsx`
- Line: 263
- Code: `{state.currentTask.verificationAttempts > 1 && (`
- Problem: `verificationAttempts` property is optional but accessed without null check

**Issue 2: Broken Symlinks**
- File: `.github/skills/blog-post-optimizer`
- Content: `../../.agents/skills/blog-post-optimizer` (relative symlink)
- Problem: Target `.agents/skills/blog-post-optimizer` does not exist
- The `.agents/` directory is untracked and not committed to the repo

## Related Code
- **Affected Files**:
  - `.ai/alpha/scripts/ui/components/SandboxColumn.tsx:263`
  - `.github/skills/blog-post-optimizer` (broken symlink)
- **Recent Changes**: CI workflow fixes in commit 9157d43ce
- **Suspected Functions**: SandboxColumn component rendering logic

## Root Cause Analysis

### Identified Root Cause

**Summary**: Two independent issues cause the workflow failure: an optional property accessed without a null check, and broken symlinks to an untracked directory.

**Detailed Explanation**:

1. **TypeScript Error**: In `SandboxColumn.tsx`, the `verificationAttempts` property on `state.currentTask` is typed as optional (possibly undefined), but line 263 performs a comparison `> 1` without first checking if the value exists. TypeScript strict mode catches this as error TS18048.

2. **Broken Symlinks**: The file `.github/skills/blog-post-optimizer` is a symlink pointing to `../../.agents/skills/blog-post-optimizer`. The `.agents/` directory is in `.gitignore` or untracked, so when CI clones the repo, the symlink target doesn't exist. Biome treats broken symlinks as errors.

**Supporting Evidence**:
- TypeScript error confirmed locally: `pnpm typecheck` reproduces the error
- Symlink content verified: `cat .github/skills/blog-post-optimizer` shows `../../.agents/skills/blog-post-optimizer`
- Target missing: `.agents/skills/blog-post-optimizer` does not exist

### How This Causes the Observed Behavior

1. CI clones the repository (without `.agents/` directory since it's untracked)
2. Validation step runs `pnpm typecheck` and `pnpm lint` in parallel
3. TypeScript fails on the undefined property check
4. Biome fails when it encounters the broken symlink
5. Both failures cause the validation step to exit with code 1
6. Subsequent deployment jobs are skipped

### Confidence Level

**Confidence**: High

**Reasoning**: Both errors are reproducible locally and the root causes are clearly visible in the code and filesystem.

## Fix Approach (High-Level)

1. **TypeScript fix**: Add optional chaining or nullish check before accessing `verificationAttempts`:
   ```typescript
   {(state.currentTask.verificationAttempts ?? 0) > 1 && (
   ```

2. **Symlink fix**: Either:
   - Remove the broken symlink from `.github/skills/`
   - Add `.github/skills/` to `.gitignore`
   - Or ensure the target exists in the repo

## Diagnosis Determination

The dev-deploy workflow failure is caused by two unrelated code quality issues that were introduced or exposed by recent changes. Both issues are straightforward to fix with minimal code changes.

## Additional Context

- The `.agents/` directory appears to be a local development artifact that shouldn't have symlinks pointing to it from tracked files
- Multiple similar broken symlinks exist in `.claude/skills/email-style/emails/` directories

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run view, gh run list, grep, cat, ls, pnpm typecheck*
