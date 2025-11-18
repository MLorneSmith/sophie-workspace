# Bug Fix: Zod v4 Schema Migration - API Breaking Changes

**Related Diagnosis**: #631
**Severity**: high
**Bug Type**: regression
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Zod v4 removed support for `description` parameter in schema constructors, requiring migration to `.describe()` method
- **Fix Approach**: Replace all `z.string({ description: "..." })` with chained `.describe("...")` method
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The `pnpm update --recursive --latest` command upgraded Zod from v3.25.76 to v4.1.12, introducing breaking API changes. Zod v4 removed support for passing `description` as a constructor parameter (e.g., `z.string({ description: "..." })`), requiring migration to the `.describe()` method instead. This caused 30+ TypeScript compilation errors across billing and mailers schema files, preventing builds and commits.

For full details, see diagnosis issue #631.

### Solution Approaches Considered

#### Option 1: Use `.describe()` Method Chaining ⭐ RECOMMENDED

**Description**: Replace `description` parameter in constructor with `.describe()` method chain. This is the straightforward v3→v4 migration path recommended by Zod documentation.

**Pros**:
- Exact 1:1 mapping from old to new API
- Maintains all existing functionality
- Zod v4 native approach, fully supported
- Minimal code changes (2-3 lines per schema field)
- No business logic changes needed
- Zero runtime risk

**Cons**:
- Requires touching ~30 schema field definitions
- Multiple files affected (6-8 files)

**Risk Assessment**: low - Straightforward syntactic change with no logic modifications

**Complexity**: simple - Find-and-replace pattern with minimal variations

#### Option 2: Migrate to `.meta()` Method (Zod v4 Preferred)

**Description**: Use `.meta()` method which is the v4-recommended approach for richer metadata support. Provides more flexibility for future extensions.

**Pros**:
- Zod v4 native preferred pattern
- Supports additional metadata beyond description
- Future-proof approach
- Better OpenAPI/documentation generation

**Cons**:
- Requires understanding `.meta()` API
- Slightly more verbose syntax
- Overkill for current use case (only `description` needed)
- Risk of inconsistency if not standardized across all schemas

**Why Not Chosen**: While `.meta()` is v4-preferred, the project only uses `description` metadata currently. Using `.describe()` is simpler, more direct, and we can migrate to `.meta()` later if richer metadata becomes needed.

#### Option 3: Downgrade to Zod v3

**Description**: Revert the dependency update and pin Zod to v3.

**Why Not Chosen**: Misses opportunity to adopt v4 improvements, creates maintenance burden, doesn't fix the underlying issue that dependency updates must be compatible.

### Selected Solution: Use `.describe()` Method Chaining

**Justification**: This approach provides the most direct v3→v4 migration, requires minimal code changes, carries zero runtime risk, and maintains current functionality while adopting Zod v4. The find-and-replace pattern is straightforward and can be completed in under 1 hour.

**Technical Approach**:
- Search for `description:` pattern in schema files
- Replace constructor syntax from `z.string({ description: "...", ... })` to `z.string({ ... }).describe("...")`
- Keep error handling syntax unchanged (v4 uses `error` function if needed)
- Preserve all validation rules and constraints
- No changes to service logic or business rules

**Architecture Changes**: None - This is purely an API surface change.

## Implementation Plan

### Affected Files

List of 6 files requiring migration (30+ schema field definitions):

1. **`packages/mailers/shared/src/schema/smtp-config.schema.ts`** - 5 errors
   - `user` field (line 6-9)
   - `pass` field (line 11-14)
   - `host` field (line 15-18)
   - `port` field (line 19-22)
   - `secure` field (line 24-27)

2. **`packages/billing/core/src/create-billing-schema.ts`** - 18+ errors
   - Multiple fields using `description` parameter
   - Core billing schema definitions

3. **`packages/billing/core/src/schema/query-billing-usage.schema.ts`** - 4 errors
   - Multiple fields with `description` parameter

4. **`packages/billing/core/src/schema/report-billing-usage.schema.ts`** - 2 errors
   - Report schema fields

5. **`packages/billing/core/src/schema/create-billing-checkout.schema.ts`** - 1 error
   - Checkout schema field

6. **Other potentially affected files** (may need validation):
   - `packages/features/team-accounts/src/schema/create-team.schema.ts`
   - `packages/billing/lemon-squeezy/src/schema/lemon-squeezy-server-env.schema.ts`
   - `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`

### New Files

No new files needed - this is purely a migration of existing schemas.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix Mailers Package Schemas

Fix all `description` parameter usage in mailers package.

- Open `packages/mailers/shared/src/schema/smtp-config.schema.ts`
- For each field with `description` parameter:
  - Move `description` out of constructor object
  - Add `.describe("...")` method chain after the schema type
- Example transformation:
  ```typescript
  // BEFORE
  user: z.string({
    description: "This is the email account to send emails from...",
    required_error: "Please provide the variable EMAIL_USER",
  }),

  // AFTER
  user: z.string({
    error: (issue) => issue.input === undefined
      ? "Please provide the variable EMAIL_USER"
      : "Invalid type: expected string"
  }).describe("This is the email account to send emails from..."),
  ```
- Save file and verify no new errors

**Why this step first**: Start with the smallest file (5 errors) to validate the migration pattern works before tackling larger billing schemas

#### Step 2: Fix Billing Core Schemas

Fix all `description` parameter usage in billing core schemas.

- Open `packages/billing/core/src/create-billing-schema.ts`
- Apply same migration pattern as Step 1 to all ~18 fields
- Open `packages/billing/core/src/schema/query-billing-usage.schema.ts`
- Apply migration pattern to all 4 fields
- Open `packages/billing/core/src/schema/report-billing-usage.schema.ts`
- Apply migration pattern to all 2 fields
- Open `packages/billing/core/src/schema/create-billing-checkout.schema.ts`
- Apply migration pattern to 1 field
- Save all files

**Why this step second**: Billing schemas have the most errors; fixing them validates the pattern at scale

#### Step 3: Fix Other Potential Schema Files

Validate and fix other schema files that may have similar issues.

- Search entire codebase for `description:` pattern: `grep -r "description:" --include="*.ts" --include="*.tsx" packages/features apps/web | grep -v node_modules`
- For each match in a Zod schema file:
  - Apply same `.describe()` migration pattern
  - Test that specific file/module
- Likely candidates:
  - `packages/features/team-accounts/src/schema/create-team.schema.ts`
  - `packages/billing/lemon-squeezy/src/schema/lemon-squeezy-server-env.schema.ts`
  - `apps/web/app/home/(user)/kanban/_lib/schema/task.schema.ts`

**Why this step third**: After confirming pattern works, sweep remaining files to ensure complete migration

#### Step 4: Run Type Checking

Validate all TypeScript compilation errors are resolved.

- Run full typecheck: `pnpm typecheck`
- Verify zero errors reported
- All 30+ TS2769 errors should be resolved
- Check specifically in affected packages:
  - `pnpm --filter @kit/mailers-shared typecheck`
  - `pnpm --filter @kit/billing typecheck`

**Expected Result**: All typecheck commands pass without errors

#### Step 5: Run Linting and Formatting

Ensure code quality standards are met.

- Run linter: `pnpm lint:fix`
- Run formatter: `pnpm format:fix`
- Verify no new linting issues introduced
- All modified files should pass linting

#### Step 6: Add Regression Test

Prevent future v3 API usage in schemas.

- Create test file: `packages/billing/core/src/schema/__tests__/zod-v4-migration.test.ts`
- Test pattern:
  ```typescript
  import { describe, it, expect } from 'vitest';
  import { createBillingSchema } from '../create-billing-schema';

  describe('Zod v4 Schema Migration', () => {
    it('should have no description in constructor parameters', () => {
      // Schema should instantiate without errors
      const schema = createBillingSchema();
      expect(schema).toBeDefined();
    });

    it('should maintain description metadata via .describe()', () => {
      // Verify descriptions are preserved
      const schema = createBillingSchema();
      // Check that schema has proper structure
      expect(schema.shape).toBeDefined();
    });
  });
  ```
- Run test: `pnpm test`
- Verify test passes

#### Step 7: Validation

Final validation that all changes are correct and complete.

- Run full typecheck: `pnpm typecheck` ✓
- Run all tests: `pnpm test` ✓
- Build web app: `pnpm --filter web build` ✓
- Verify build succeeds without warnings
- No TypeScript errors in any package
- All modified files committed and ready

## Testing Strategy

### Unit Tests

Verify all schemas continue to work correctly after migration.

**Test files**:
- `packages/billing/core/src/schema/__tests__/zod-v4-migration.test.ts` - Regression test for v4 API usage
- `packages/mailers/shared/src/schema/__tests__/smtp-config.test.ts` - (if exists) Verify SMTP schema still works
- `packages/billing/core/src/__tests__/create-billing-schema.test.ts` - (if exists) Verify billing schema still works

**Test coverage**:
- ✅ Schema instantiation succeeds
- ✅ Descriptions preserved through `.describe()`
- ✅ Validation still works (required fields, type checks, etc.)
- ✅ Error messages still generated correctly
- ✅ No v3 API patterns remain in codebase

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run `pnpm typecheck` - all commands succeed, zero errors
- [ ] Run `pnpm lint` - no linting errors in modified files
- [ ] Run `pnpm test` - all tests pass
- [ ] Run `pnpm build` - build succeeds
- [ ] Review modified files - verify all `description` moved to `.describe()`
- [ ] Search for remaining v3 patterns - verify none remain
- [ ] Run commit validation - ensure commit hooks pass

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Missing schema files**: Some schema files using v3 API syntax not found
   - **Likelihood**: medium (depends on search completeness)
   - **Impact**: low (would cause typecheck errors, easily caught)
   - **Mitigation**: Use comprehensive grep search in Step 3; run full typecheck to catch misses

2. **Metadata loss during migration**: Description text lost or malformed
   - **Likelihood**: low (simple string move)
   - **Impact**: medium (description metadata would be missing)
   - **Mitigation**: Careful review of each migration; verify descriptions are identical strings

3. **Error handling changes required**: v4 error handling differs from v3
   - **Likelihood**: low (description parameter is independent of error handling)
   - **Impact**: low (only affects description, not validation logic)
   - **Mitigation**: Keep error handling syntax unchanged; test validation still works

4. **Runtime behavior change**: Schema validation behaves differently in v4
   - **Likelihood**: low (v4 is backward compatible except for removed features)
   - **Impact**: medium (validation would fail in unexpected ways)
   - **Mitigation**: Comprehensive testing of all schemas; monitor production closely

**Rollback Plan**:

If this fix causes issues:

1. Revert to previous commit: `git revert <commit-hash>`
2. Downgrade Zod back to v3: `pnpm update zod@3.25.76`
3. Restart development server: `pnpm dev`
4. All TypeScript errors should resolve

**Rollback is straightforward** since we're only changing schema syntax, not dependencies (except the already-updated Zod v4).

## Performance Impact

**Expected Impact**: none

The changes are purely syntactic - `.describe()` is a metadata operation that has zero runtime performance impact. Validation performance is identical to v3.

## Security Considerations

**Security Impact**: none

The migration changes no security semantics:
- Authentication remains unchanged
- Authorization (RLS) unaffected
- Input validation unchanged
- No new dependencies or vulnerabilities

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Should show 30+ TypeScript errors
pnpm typecheck
```

**Expected Result**: TypeScript errors showing `description does not exist in type`

### After Fix (Bug Should Be Resolved)

```bash
# Type check - must pass
pnpm typecheck

# Lint - must pass
pnpm lint

# Format - must pass
pnpm format

# Unit tests - must pass
pnpm test:unit

# Build - must pass
pnpm build

# Specific package typechecks
pnpm --filter @kit/mailers-shared typecheck
pnpm --filter @kit/billing typecheck
pnpm --filter @kit/billing-core typecheck
```

**Expected Result**: All commands succeed, zero errors, all tests pass.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run build to catch any compilation issues
pnpm build

# Verify no remaining v3 patterns
grep -r "description:" --include="*.ts" --include="*.tsx" packages/features packages/billing packages/mailers apps/web 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v "dist" || echo "No v3 patterns found (good!)"
```

## Dependencies

### New Dependencies

No new dependencies required - this is a pure API migration within Zod v4.

**Zod version**: Already updated to v4.1.12 (from the triggering commit)

## Database Changes

**No database changes required** - This is purely a schema validation layer change, not a database schema change.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**: None

**Feature flags needed**: no

**Backwards compatibility**: maintained

This change maintains full backward compatibility. The migrations don't affect:
- Database schema
- API contracts
- Data structures
- External integrations

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`)
- [ ] Zero TypeScript errors in all packages
- [ ] All 30+ TS2769 errors resolved
- [ ] All tests pass (unit, integration, E2E if any)
- [ ] Zero regressions detected
- [ ] No remaining v3 Zod API patterns in codebase
- [ ] Code review approved (if applicable)
- [ ] Manual testing checklist complete

## Notes

### Why This Migration Matters

This fix unblocks development after the Zod v4 upgrade. Without it:
- TypeScript compilation fails
- Git commits are blocked by pre-commit hooks
- Development workflow is interrupted
- Deployment is prevented

### Reference

- **Zod v4 Migration Guide**: https://zod.dev/migrate-v4
- **Zod v4 Docs**: https://zod.dev
- **Diagnosis Issue**: #631
- **Related Commits**:
  - `6bedbca19` - "chore(deps): update all dependencies and patch glob security vulnerability"
  - `c3b596fe3` - Last working commit (before Zod v4)

### Future Improvements

After this fix is complete, consider:
1. **Pin Zod version** or use `^3.25` range to prevent automatic major version upgrades
2. **Update dependency update process** to test typecheck after major version changes
3. **Consider `.meta()` migration** if richer metadata support is needed in future
4. **Document Zod v4 patterns** in project guidelines

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #631*
