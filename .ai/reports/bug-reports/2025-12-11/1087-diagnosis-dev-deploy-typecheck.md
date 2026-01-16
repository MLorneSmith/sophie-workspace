# Bug Diagnosis: dev-deploy.yml workflow TypeScript error causes CI failure

**ID**: ISSUE-1087
**Created**: 2025-12-11T15:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The `dev-deploy.yml` workflow is failing at the "Pre-deployment Validation" step due to a TypeScript type error introduced in commit `6fef3eec8`. The error occurs in `apps/e2e/global-setup.ts:454` where `AuthError | null` is cast to `Record<string, unknown>` to access the `.code` property, but TypeScript's strict checking rejects this cast because `AuthError` lacks an index signature.

## Environment

- **Application Version**: 2.13.1
- **Environment**: CI (GitHub Actions)
- **Node Version**: Latest (via setup-deps action)
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Commit `db73faae0` (2025-12-11T14:12:01Z)

## Reproduction Steps

1. Run `pnpm --filter web-e2e typecheck`
2. Observe TypeScript error TS2352 at `global-setup.ts:454:18`

## Expected Behavior

The `pnpm typecheck` command should pass without errors, allowing the CI workflow to proceed to deployment.

## Actual Behavior

TypeScript fails with error TS2352:
```
global-setup.ts(454,18): error TS2352: Conversion of type 'AuthError | null' to type 'Record<string, unknown>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'AuthError' is not comparable to type 'Record<string, unknown>'.
    Index signature for type 'string' is missing in type 'AuthError'.
```

## Diagnostic Data

### Console Output

```
> web-e2e@1.0.0 typecheck /home/runner/_work/2025slideheroes/2025slideheroes/apps/e2e
> tsc --noEmit

global-setup.ts(454,18): error TS2352: Conversion of type 'AuthError | null' to type 'Record<string, unknown>' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'AuthError' is not comparable to type 'Record<string, unknown>'.
    Index signature for type 'string' is missing in type 'AuthError'.
 ELIFECYCLE  Command failed with exit code 2.
```

### Workflow Run Details

- **Run ID**: 20137032521
- **Commit**: 6fef3eec8
- **Duration**: 2m32s
- **Failed Job**: Pre-deployment Validation
- **Failed Step**: Run validation checks in parallel (typecheck)

## Error Stack Traces

```
error TS2352: Conversion of type 'AuthError | null' to type 'Record<string, unknown>' may be a mistake because neither type sufficiently overlaps with the other.
```

## Related Code

- **Affected Files**:
  - `apps/e2e/global-setup.ts:454`

- **Recent Changes**: Commit `6fef3eec8` "fix(e2e): implement cookie verification and auth session diagnostics for Vercel preview deployments"

- **Suspected Functions**: Error diagnostics code in global-setup.ts authentication failure handler

### Problematic Code (lines 453-454)

```typescript
  Error: ${error?.message || "No error message"}
  Error Code: ${(error as Record<string, unknown>)?.code || "unknown"}
```

The cast `(error as Record<string, unknown>)` is invalid because TypeScript's `AuthError` type (from `@supabase/supabase-js`) is a class that does not have an index signature, making it incompatible with `Record<string, unknown>`.

## Related Issues & Context

### Direct Predecessors
- This is a new regression introduced in the latest commit.

### Similar Symptoms
- No similar previous TypeScript cast errors found in E2E tests.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The commit `6fef3eec8` added diagnostic logging that uses an invalid TypeScript cast from `AuthError | null` to `Record<string, unknown>`.

**Detailed Explanation**:
In `apps/e2e/global-setup.ts:454`, the code attempts to access the `.code` property of a Supabase `AuthError` using:
```typescript
Error Code: ${(error as Record<string, unknown>)?.code || "unknown"}
```

The `AuthError` type from `@supabase/supabase-js` is defined as a class with specific properties (`message`, `status`, `code`, `__isAuthError`), but it does NOT have an index signature (`[key: string]: unknown`). TypeScript correctly flags this cast as potentially incorrect because the type structures don't overlap sufficiently.

**Supporting Evidence**:
- TypeScript error TS2352 at exact line 454:18
- The workflow `db73faae0` (previous commit) passed successfully
- Local reproduction confirms the same error

### How This Causes the Observed Behavior

1. Commit `6fef3eec8` added diagnostic logging code to improve debugging for auth failures
2. The code uses `(error as Record<string, unknown>)?.code` to access the error code
3. TypeScript's strict checking rejects this cast because `AuthError` class lacks an index signature
4. `pnpm typecheck` fails → CI validation step fails → entire workflow fails

### Confidence Level

**Confidence**: High

**Reasoning**: The error message is explicit, the line number matches, and local reproduction confirms the exact same error.

## Fix Approach (High-Level)

Cast through `unknown` first, which is the TypeScript-recommended approach for uncertain type conversions:

```typescript
// Instead of:
${(error as Record<string, unknown>)?.code || "unknown"}

// Use:
${(error as unknown as Record<string, unknown>)?.code || "unknown"}

// Or better, use optional chaining with type guard:
${error && 'code' in error ? (error as { code?: string }).code : "unknown"}
```

Alternatively, since `AuthError` has a `.code` property, simply use:
```typescript
${error?.code || "unknown"}
```

## Diagnosis Determination

This is a straightforward TypeScript type safety issue introduced in commit `6fef3eec8`. The fix is simple: either cast through `unknown` first, or access the `.code` property directly since `AuthError` already has this property defined.

## Additional Context

The commit was attempting to add helpful debugging output for E2E authentication failures in Vercel preview deployments. The functionality is correct, only the type cast is problematic.

---
*Generated by Claude Debug Assistant*
*Tools Used: gh run list, gh run view --log-failed, git show, Read, Grep, Bash*
