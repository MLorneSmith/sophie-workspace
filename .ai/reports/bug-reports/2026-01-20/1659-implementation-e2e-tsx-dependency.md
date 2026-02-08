# Implementation Report: E2E Sharded Workflow tsx Dependency Fix

**Issue**: [#1659](https://github.com/slideheroes/2025slideheroes/issues/1659)
**Status**: Complete
**Date**: 2026-01-20

## Summary

- Added `tsx` v4.21.0 as explicit devDependency to `apps/e2e/package.json`
- Updated `pnpm-lock.yaml` with the new dependency
- Verified tsx is available in the E2E workspace via `pnpm --filter web-e2e exec tsx --version`

## Files Changed

```
apps/e2e/package.json |  3 ++-
pnpm-lock.yaml        | 11 +++++++----
2 files changed, 9 insertions(+), 5 deletions(-)
```

## Commit

```
5fd56a462 fix(e2e): add tsx as explicit dependency for E2E sharded workflow
```

## Validation Results

All validation commands passed successfully:
- `pnpm typecheck` - 39 packages, all successful
- `pnpm lint` - No errors (pre-existing warnings in unrelated .ai/ scripts)
- `pnpm biome format apps/e2e/package.json` - Correctly formatted
- `pnpm --filter web-e2e exec tsx --version` - Returns `tsx v4.21.0`

## Root Cause

The previous fix (Issue #1657) replaced `ts-node` with `tsx` in the E2E sharded workflow's health check script, but didn't add `tsx` as a dependency to `apps/e2e/package.json`. Due to pnpm's strict hoisting rules, undeclared dependencies are not accessible even if installed elsewhere in the monorepo.

## Solution

Added `"tsx": "^4.21.0"` to devDependencies in `apps/e2e/package.json`. This makes the dependency explicit and available in the E2E workspace.

## Follow-up Items

None. The fix is complete and the E2E sharded workflow should now pass the "Wait for Supabase health" step.

---
*Implementation completed by Claude*
