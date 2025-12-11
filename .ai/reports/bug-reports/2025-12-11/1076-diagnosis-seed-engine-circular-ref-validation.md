# Bug Diagnosis: Seed Engine Validation Fails on Circular References

**ID**: ISSUE-1076
**Created**: 2025-12-11T14:00:00Z
**Reporter**: system (test suite)
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The seed-engine's data validator fails when validating seed data containing circular references (e.g., `course-lessons` referencing `surveys` and vice versa). The validator checks all references exist in the reference map BEFORE the three-pass seeding strategy handles circular references, causing 22 unit tests to fail with "Unresolved reference" errors.

## Environment

- **Application Version**: dev branch (commit ebcc9992b)
- **Environment**: development/test
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown - may have always been an issue

## Reproduction Steps

1. Run the unit test suite: `pnpm --filter payload test:unit`
2. Observe failures in:
   - `seed-orchestrator.test.ts` (3 failures)
   - `collection-filtering.test.ts` (10 failures)
   - `full-workflow.test.ts` (4 failures)
   - `idempotency.test.ts` (5 failures)

## Expected Behavior

The validator should recognize circular references (defined in `CIRCULAR_REFERENCES` config) and either:
- Skip validation for those specific fields, OR
- Allow "unresolved" references for fields marked as circular

## Actual Behavior

The validator fails with errors like:
```
course-lessons[before-we-begin]: Unresolved reference "{ref:surveys:self-assessment}" - no record with _ref="self-assessment" in surveys
course-lessons[before-you-go]: Unresolved reference "{ref:surveys:feedback}" - no record with _ref="feedback" in surveys
```

Despite `surveys.json` containing records with `_ref: "self-assessment"` and `_ref: "feedback"`.

## Diagnostic Data

### Console Output
```
[ERROR] 2025-12-11T13:51:47.577Z Validation failed with 2 errors:
[ERROR]   - course-lessons[before-we-begin]: Unresolved reference "{ref:surveys:self-assessment}" - no record with _ref="self-assessment" in surveys
[ERROR]   - course-lessons[before-you-go]: Unresolved reference "{ref:surveys:feedback}" - no record with _ref="feedback" in surveys
[ERROR] Seeding failed
```

### Test Failure Summary
```
22 unit test failures in apps/payload/src/seed/seed-engine:
- seed-orchestrator.test.ts: 3 failures
- collection-filtering.test.ts: 10 failures
- full-workflow.test.ts: 4 failures
- idempotency.test.ts: 5 failures
```

## Error Stack Traces
```
Error: Data validation failed with 2 errors
    at SeedOrchestrator.validateData (seed-orchestrator.ts:244)
    at SeedOrchestrator.run (seed-orchestrator.ts:98)
```

## Related Code
- **Affected Files**:
  - `apps/payload/src/seed/seed-engine/core/seed-orchestrator.ts` (lines 210-248)
  - `apps/payload/src/seed/seed-engine/validators/data-validator.ts` (lines 37-111)
  - `apps/payload/src/seed/seed-engine/config.ts` (lines 79-95)
- **Recent Changes**: None affecting this logic directly
- **Suspected Functions**: `validateReferences()` and `validateData()`

## Related Issues & Context

### Configuration Shows Circular References Are Known
The `CIRCULAR_REFERENCES` config in `config.ts` acknowledges the circularity:
```typescript
export const CIRCULAR_REFERENCES: Record<string, {...}> = {
  'course-lessons': {
    fields: ['quiz_id', 'survey_id'],
    targetCollection: 'course-quizzes',
  },
  'surveys': {
    fields: ['lesson'],
    targetCollection: 'course-lessons',
  },
};
```

### Three-Pass Seeding Strategy
The orchestrator implements a three-pass strategy (lines 292-295):
- Pass 1: Seed all collections, skipping circular reference fields
- Pass 2: Resolve circular references after both collections exist
- Pass 3: Verify all references are resolved

**Problem**: Validation runs BEFORE processing begins, so it doesn't account for the three-pass strategy.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `validateData()` method in `SeedOrchestrator` runs comprehensive reference validation before the three-pass seeding strategy executes, failing on circular references that would be resolved in Pass 2.

**Detailed Explanation**:

1. **Validation Order**: In `SeedOrchestrator.run()`, validation happens at step 3 (line 98) before processing at step 4 (line 101-103).

2. **Reference Map Building**: The `buildReferenceMap()` function creates a map of all `_ref` values from loaded data. For `surveys`, this includes `surveys:self-assessment` and `surveys:feedback`.

3. **The Bug**: When validating `course-lessons`, the validator finds `{ref:surveys:self-assessment}` and checks if `surveys:self-assessment` exists in the reference map. **It does exist** (surveys.json is loaded), but the validator still fails because it's checking if the *field value* can be resolved, not just if the target record exists.

4. **Wait - Actually**: Re-reading the error more carefully:
   ```
   no record with _ref="self-assessment" in surveys
   ```
   This means the reference map lookup is failing. Let me verify the surveys.json structure.

**Supporting Evidence**:
- The `surveys.json` file contains `"_ref": "feedback"` and `"_ref": "self-assessment"` (verified lines 3 and 24)
- The validator function `validateReferences()` in `data-validator.ts` doesn't import or use `CIRCULAR_REFERENCES`
- The seed order places `course-lessons` BEFORE `surveys` in SEED_ORDER (lines 53-54 of config.ts)

### How This Causes the Observed Behavior

1. Tests run `SeedOrchestrator.run()` with dry-run mode
2. `loadData()` loads collections including `course-lessons` and `surveys`
3. `validateData()` builds reference map from all loaded collections
4. When validating `course-lessons`, it finds `{ref:surveys:self-assessment}`
5. The check `referenceMap.has('surveys:self-assessment')` should return true
6. **Key insight**: The issue may be that `buildReferenceMap()` is only building from `loadResults` which may not include all collections when filtering is applied

### Actual Root Cause (Refined)

The tests filter collections (e.g., `collections: ['media', 'downloads', 'quiz-questions', 'courses', 'course-quizzes', 'course-lessons']`) which means `surveys` is NOT loaded. The reference map doesn't include survey records, so validation fails.

The fix should either:
1. Skip validation for circular reference fields defined in `CIRCULAR_REFERENCES`
2. Or auto-include dependent collections in the reference map for validation purposes

### Confidence Level

**Confidence**: High

**Reasoning**: The error message explicitly states "no record with _ref in surveys", and the test filters exclude surveys from being loaded. The three-pass strategy handles this during actual seeding, but validation doesn't account for it.

## Fix Approach (High-Level)

Modify `validateReferences()` in `data-validator.ts` to:
1. Accept `CIRCULAR_REFERENCES` config as a parameter
2. Skip validation for fields listed in `CIRCULAR_REFERENCES[collection].fields`
3. Or: mark these as warnings instead of errors

Alternative: Modify the test fixtures to include all dependent collections.

## Diagnosis Determination

**Root Cause Identified**: The data validator in `data-validator.ts` doesn't account for circular references. When tests filter collections (not loading `surveys`), references from `course-lessons` to `surveys` fail validation even though the three-pass seeding strategy would handle them during actual processing.

**Two Sub-Issues**:
1. **Unit Test Issue**: Tests that filter collections (like `collection-filtering.test.ts`) don't include all dependency chains
2. **Validator Gap**: The validator doesn't know about circular references and can't distinguish between "missing data" and "circular reference to be resolved later"

## Additional Context

### Secondary Issue: E2E Billing Test Flakiness

The E2E test `user-billing.spec.ts` is flaky (failed once, passed on retry). This is a separate timing issue with Stripe webhook delivery and is unrelated to the seed engine validation bug.

---
*Generated by Claude Debug Assistant*
*Tools Used: grep, cat, git log, read file*
