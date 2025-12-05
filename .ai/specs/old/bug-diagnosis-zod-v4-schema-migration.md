# Bug Diagnosis: Zod v4 Migration - Schema Description API Breaking Changes

**ID**: ISSUE-631
**Created**: 2025-11-18T10:15:00-05:00
**Reporter**: system (codecheck)
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The `pnpm update --recursive --latest` command (commit 6bedbca19) updated Zod from v3.25.76 to v4.1.12, introducing breaking changes that caused TypeScript compilation failures across multiple schema files. Zod v4 removed support for passing `description` as a constructor parameter (e.g., `z.string({ description: "..." })`), requiring migration to the `.describe()` method instead.

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Browser**: N/A (build-time error)
- **Node Version**: 22.16.0
- **pnpm Version**: 10.14.0
- **Zod Version Before**: 3.25.76
- **Zod Version After**: 4.1.12
- **Last Working**: commit c3b596fe3 (before dependency update)

## Reproduction Steps

1. Run `pnpm update --recursive --latest` (updates Zod from v3 to v4)
2. Run `pnpm typecheck`
3. Observe TypeScript compilation errors in schema files

## Expected Behavior

TypeScript compilation should succeed without errors after updating dependencies.

## Actual Behavior

TypeScript compilation fails with 30+ errors across billing and mailer schemas:

```
error TS2769: No overload matches this call.
  Object literal may only specify known properties, and 'description' does not exist in type...
```

## Diagnostic Data

### Console Output

```
@kit/mailers-shared:typecheck: src/schema/smtp-config.schema.ts(7,3): error TS2769: No overload matches this call.
@kit/mailers-shared:typecheck:   Overload 1 of 2, '(params?: string | { error?: string | $ZodErrorMap<$ZodIssueInvalidType<unknown>> | undefined; message?: string | undefined; } | undefined): ZodString', gave the following error.
@kit/mailers-shared:typecheck:     Object literal may only specify known properties, and 'description' does not exist in type '{ error?: string | $ZodErrorMap<$ZodIssueInvalidType<unknown>> | undefined; message?: string | undefined; }'.

@kit/billing:typecheck: src/create-billing-schema.ts(24,5): error TS2769: No overload matches this call.
@kit/billing:typecheck:   Object literal may only specify known properties, and 'description' does not exist in type...
```

**Total Errors**: 30+ across 2 packages
- `@kit/mailers-shared`: 5 errors
- `@kit/billing`: 25+ errors

### TypeScript Error Analysis

**Error Pattern:**
The TypeScript compiler rejects the `description` property in Zod schema constructors because Zod v4 changed its API.

**Example Error Location:**
```typescript
// packages/mailers/shared/src/schema/smtp-config.schema.ts:6-9
user: z.string({
  description: "This is the email account to send emails from...",  // ❌ Error here
  required_error: "Please provide the variable EMAIL_USER",
}),
```

## Related Code

### Affected Files

**Mailers Package** (5 errors):
- `packages/mailers/shared/src/schema/smtp-config.schema.ts`
  - Lines: 6-9 (user field)
  - Lines: 11-14 (pass field)
  - Lines: 15-18 (host field)
  - Lines: 19-22 (port field)
  - Lines: 24-27 (secure field)

**Billing Package** (25+ errors):
- `packages/billing/core/src/create-billing-schema.ts`
  - Multiple fields using `description` parameter
  - Lines: 24, 30, 35, 42, 48, 54, 96, 101, 128, 213, 219, 224, 229, 235, 242, 248, 253, 258
- `packages/billing/core/src/schema/query-billing-usage.schema.ts`
  - Lines: 9, 19, 25, 29
- `packages/billing/core/src/schema/report-billing-usage.schema.ts`
  - Lines: 5, 10
- `packages/billing/core/src/schema/create-billing-checkout.schema.ts`
  - Line: 18 (also has `Expected 2-3 arguments, but got 1` error)

**Additional Files (may have similar issues)**:
- `packages/features/team-accounts/src/schema/create-team.schema.ts`
- `packages/billing/lemon-squeezy/src/schema/lemon-squeezy-server-env.schema.ts`
- `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`

### Recent Changes

**Triggering Commit**: `6bedbca19` - "chore(deps): update all dependencies and patch glob security vulnerability"

**Git History**:
```bash
6bedbca19 chore(deps): update all dependencies and patch glob security vulnerability
c3b596fe3 fix(ci): align E2E Supabase credentials with deployed environment  # ✅ Last working
```

**Dependency Change**:
```yaml
# Before (c3b596fe3)
zod@3.25.76

# After (6bedbca19)
zod@4.1.12
```

## Related Issues & Context

### Direct Predecessors

No direct Zod v4 migration issues found in repository history.

### Similar Symptoms

- #217 (CLOSED): "ZodError: Missing NEXT_PUBLIC_BILLING_PROVIDER environment variable causes home page crash" - Different Zod error, configuration-related
- #33 (CLOSED): "TypeScript Compilation Errors - 561 errors across multiple packages" - Similar TypeScript compilation failures, but unrelated root cause

### Historical Context

This is the first time Zod has been upgraded from v3 to v4 in this project. The codebase was written against Zod v3 API conventions.

## Root Cause Analysis

### Identified Root Cause

**Summary**: Zod v4 removed the `description` parameter from schema constructor functions, breaking all schemas that used `z.string({ description: "..." })` syntax.

**Detailed Explanation**:

The `pnpm update --recursive --latest` command upgraded Zod from v3.25.76 to v4.1.12. Zod v4 introduced a **breaking API change** where:

1. **Zod v3 API** (old, now invalid):
   ```typescript
   z.string({
     description: "Field description",
     required_error: "Field is required",
   })
   ```

2. **Zod v4 API** (new, required):
   ```typescript
   z.string({
     error: (issue) => issue.input === undefined
       ? "Field is required"
       : "Invalid type"
   }).describe("Field description")

   // OR using .meta() (preferred in v4)
   z.string().meta({
     description: "Field description"
   })
   ```

**Key Breaking Changes in Zod v4**:
1. `description` parameter removed from constructors → Use `.describe()` or `.meta()` method
2. `required_error` and `invalid_type_error` → Unified `error` function
3. `message` parameter → Replaced with `error`

**Supporting Evidence**:

1. **Lock file diff confirms version jump**:
   ```diff
   - zod@3.25.76
   + zod@4.1.12
   ```

2. **TypeScript error messages explicitly state**:
   ```
   'description' does not exist in type
   '{ error?: string | ... ; message?: string | undefined; }'
   ```

3. **Official Zod v4 migration guide** (from context7-expert research):
   - Confirms `description` was removed from constructor parameters
   - `.describe()` method is the replacement
   - `.meta()` is the preferred v4 approach

### How This Causes the Observed Behavior

1. **Trigger**: `pnpm update --recursive --latest` upgrades Zod to v4
2. **Effect**: TypeScript compiler reads new Zod v4 type definitions
3. **Validation**: Zod v4 types no longer include `description` in constructor parameter types
4. **Result**: TypeScript emits `TS2769` errors for all schema files using old v3 API
5. **Failure**: Typecheck fails, preventing builds and commits

### Confidence Level

**Confidence**: High

**Reasoning**:
- TypeScript errors directly reference the removed `description` property
- Lock file confirms exact version change from Zod v3 → v4
- Official Zod documentation confirms this is a documented breaking change
- Research agents (context7-expert) confirmed the API migration requirements
- Error pattern is consistent across all affected files (same root cause)

## Fix Approach (High-Level)

**Migration Strategy** (2-3 sentences):

Replace all Zod v3 constructor parameters with Zod v4 method chains. Specifically:
1. Remove `description` from constructor objects and chain `.describe("...")` instead
2. Replace `required_error` and `invalid_type_error` with unified `error` function
3. Optionally migrate to `.meta()` for richer metadata (recommended v4 approach)

**Example Fix**:
```typescript
// BEFORE (Zod v3)
user: z.string({
  description: "The email account to send emails from",
  required_error: "Please provide the variable EMAIL_USER",
}),

// AFTER (Zod v4 - Method 1: .describe())
user: z.string({
  error: (issue) => issue.input === undefined
    ? "Please provide the variable EMAIL_USER"
    : "Invalid type: expected string"
}).describe("The email account to send emails from"),

// AFTER (Zod v4 - Method 2: .meta() - preferred)
user: z.string({
  error: (issue) => issue.input === undefined
    ? "Please provide the variable EMAIL_USER"
    : "Invalid type: expected string"
}).meta({
  description: "The email account to send emails from",
  examples: ["user@example.com"]
}),
```

**Estimated Scope**:
- ~30 schema field definitions across 6-8 files
- Straightforward find-and-replace pattern
- No business logic changes required
- Can be completed in 1-2 hours

## Diagnosis Determination

**Root cause is confirmed**: Zod v4 breaking API changes are the definitive cause of all TypeScript compilation errors.

**Evidence Quality**: High - TypeScript errors, version diffs, and official documentation all align.

**Fix Certainty**: High - Migration path is well-documented and straightforward.

**Recommended Action**:
1. Create implementation plan for Zod v3 → v4 schema migration
2. Apply fixes to all affected schema files
3. Add regression test to prevent future v3 API usage
4. Update developer documentation with Zod v4 patterns

## Additional Context

### Why This Wasn't Caught Earlier

1. **Pre-commit hooks**: Skip auto-fix when uncommitted files are detected (correct behavior)
2. **Turbo cache**: May have masked errors if cached builds were reused
3. **Dependency update scope**: `--recursive --latest` was too aggressive, updating major versions

### Prevention Recommendations

1. **Pin Zod version** or use `^3.x` until migration is planned
2. **Use `pnpm update` without `--latest`** to respect semver ranges
3. **Run `pnpm typecheck` after dependency updates** before committing
4. **Add pre-commit hook** to block commits with typecheck failures

### Related Documentation

- Zod v4 Migration Guide: https://zod.dev/migrate-v4
- Zod v4 Error Handling: https://zod.dev/error-handling
- Research artifacts: `.ai/.ai/tools/context7/.cache/3ff43984fad2698fed7dc0b4958d4e37874d9ac34ef9583870fb13650e21399b.json`

---

**Tools Used**:
- TypeScript compiler (`pnpm typecheck`)
- Git log analysis (`git log`, `git show`)
- Package lock file inspection (`pnpm-lock.yaml`)
- Context7 API documentation research
- Perplexity search for breaking changes
- Grep for affected file discovery (`grep -r "description:"`)
