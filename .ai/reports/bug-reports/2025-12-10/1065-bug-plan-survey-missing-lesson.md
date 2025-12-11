# Bug Fix: Missing Survey in Before You Go Lesson

**Related Diagnosis**: #1064
**Severity**: high
**Bug Type**: regression + incomplete fix
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Missing `survey_id` field in seed data linking lesson 31 ("before-you-go") to the "feedback" survey
- **Fix Approach**: Add `survey_id` field to both survey lessons in `course-lessons.json`
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The "Before you go..." lesson (lesson_number 31, slug: `before-you-go`) should display the "Course Feedback" survey when navigated to. However, the survey is missing because:

1. **Root cause**: The lesson record in `course-lessons.json` lacks the `survey_id` field
2. **Code dependency**: `LessonDataProvider-enhanced.tsx:242` expects `lesson.survey_id` to fetch the survey
3. **Bidirectional relationship**: The survey has `lesson` field pointing back to the lesson, but the code requires the forward reference
4. **Regression**: "before-we-begin" lesson had this field before but lost it in commit `5885661d4`

### Solution Approaches Considered

#### Option 1: Add `survey_id` to Lesson Seed Data ⭐ RECOMMENDED

**Description**: Add the `survey_id` field to both survey lessons in `course-lessons.json`, following the same reference pattern used for other foreign keys like `course_id`.

**Pros**:
- Directly addresses root cause with minimal change
- Aligns with existing seed data architecture (uses `{ref:collection:identifier}` pattern)
- Single file change required (course-lessons.json)
- Resolves regression for "before-we-begin" lesson simultaneously
- Fast deployment with `pnpm supabase:web:reset`
- Zero breaking changes

**Cons**:
- Requires understanding the seed data structure
- Must remember the exact survey slug identifiers

**Risk Assessment**: low - simple data addition, no code changes, well-established pattern in codebase

**Complexity**: simple - straightforward seed data update

#### Option 2: Create Bidirectional Reference Resolution in Code

**Description**: Enhance `LessonDataProvider-enhanced.tsx` to look up surveys both ways: directly via `lesson.survey_id` and also by querying surveys where `survey.lesson === lesson.id`.

**Pros**:
- Provides fallback for existing lessons without `survey_id`
- More defensive code pattern

**Cons**:
- Adds unnecessary complexity to data fetching logic
- Extra database query if forward reference missing
- Creates technical debt by allowing incomplete data
- Doesn't prevent future incomplete fixes

**Why Not Chosen**: Over-engineering. The code correctly expects `survey_id` on the lesson. The bug is in incomplete seed data, not in the data fetching logic.

#### Option 3: Data Migration SQL

**Description**: Create a Supabase migration to populate `survey_id` by querying the surveys table for records with matching `lesson` foreign keys.

**Pros**:
- Programmatic fix that would work in production

**Cons**:
- Requires database schema to have survey-lesson relationship (it does via `lesson` field on survey)
- More complex than needed for local seed data
- Doesn't fix the root cause in seed-data JSON

**Why Not Chosen**: Seed data is the source of truth for local development. Should be fixed at source, not worked around with migrations.

### Selected Solution: Add `survey_id` to Lesson Seed Data

**Justification**: This is a straightforward seed data completeness issue. The fix aligns with:
- Existing codebase patterns (reference syntax already used throughout `course-lessons.json`)
- Code expectations (`LessonDataProvider-enhanced.tsx:242` expects this field)
- The principle of fixing data at source, not working around it in code
- Minimal risk with maximum clarity

**Technical Approach**:

1. Locate the "before-you-go" lesson record in `course-lessons.json`
2. Add `"survey_id": "{ref:surveys:feedback}"` field to the lesson object
3. Locate the "before-we-begin" lesson record in the same file
4. Add `"survey_id": "{ref:surveys:three-quick-questions}"` field to fix the regression
5. Apply the seed data changes by resetting the database

**Why This Mapping**:
- The "feedback" survey has `lesson` field pointing to "before-you-go" (verified in surveys.json line 20)
- The "three-quick-questions" survey has `lesson` field pointing to "lesson-0" but "before-we-begin" needs it (diagnosed in issue #1064)
- Actually, looking more carefully: "three-quick-questions" points to "lesson-0", "self-assessment" points to "before-we-begin"

Let me verify this more carefully by checking which survey should link to "before-we-begin":

**Survey Lesson Mappings** (from surveys.json):
- "feedback" → "before-you-go" (line 20)
- "self-assessment" → "before-we-begin" (line 61)
- "three-quick-questions" → "lesson-0" (line 80)

**Fix**:
- "before-you-go" lesson: Add `"survey_id": "{ref:surveys:feedback}"`
- "before-we-begin" lesson: Add `"survey_id": "{ref:surveys:self-assessment}"`

**Architecture Changes**: None - seed data schema already supports this field pattern

**Migration Strategy**: Database reset applies seed data changes immediately via `pnpm supabase:web:reset`

## Implementation Plan

### Affected Files

- `apps/payload/src/seed/seed-data/course-lessons.json` - Add `survey_id` fields to two lesson records

### New Files

None - existing seed data file updated

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Verify current lesson data structure

Examine both lesson records to confirm current structure before modification.

- Read the "before-we-begin" lesson record (~line 28-63 in course-lessons.json)
- Read the "before-you-go" lesson record (~line 4412-4434 in course-lessons.json)
- Confirm neither has `survey_id` field
- Note the exact structure and all existing fields

**Why this step first**: Ensures we don't accidentally modify correct data and understand field positioning

#### Step 2: Add `survey_id` to "before-you-go" lesson

Update the "before-you-go" lesson record (around line 4428) to include the survey reference.

- Locate line with `"lesson_number": 31` (only lesson with this number)
- Add `"survey_id": "{ref:surveys:feedback}",` field
- Place after `"course_id"` field for consistency with lesson structure
- Ensure proper JSON formatting (trailing comma if more fields follow)

#### Step 3: Add `survey_id` to "before-we-begin" lesson

Update the "before-we-begin" lesson record (around line 55-62) to include the survey reference.

- Locate line with `"slug": "before-we-begin"`
- Add `"survey_id": "{ref:surveys:self-assessment}",` field
- Place after `"course_id"` field for consistency
- Ensure proper JSON formatting

#### Step 4: Validate JSON syntax

Verify the modified `course-lessons.json` is valid JSON.

- Check for syntax errors (balanced braces, proper commas)
- Verify no accidental duplicate fields
- Confirm all existing fields are preserved

#### Step 5: Apply seed data changes

Reset the local database to apply the updated seed data.

- Run `pnpm supabase:web:reset` from project root
- This drops and recreates the database with new seed data
- Verify all 25 lessons are seeded successfully

#### Step 6: Verify the fix

Test that the survey displays correctly in the lesson.

- Start dev server: `pnpm dev`
- Navigate to `/home/course/lessons/before-you-go`
- Confirm "Course Feedback" survey is displayed
- Navigate to `/home/course/lessons/before-we-begin`
- Confirm "Self-Assessment" survey is displayed (regression test)

#### Step 7: Run validation

Execute quality checks to ensure no regressions.

- Run type checking: `pnpm typecheck`
- Run linting: `pnpm lint`
- Run formatting check: `pnpm format`

## Testing Strategy

### Unit Tests

No unit tests needed - this is seed data, not code logic.

### Integration Tests

Test the data is correctly seeded and accessible:

- Verify `survey_id` field exists on lesson records in database
- Verify survey can be loaded via lesson reference
- Verify bidirectional relationship works (lesson → survey → lesson)

**Manual Verification**:
```bash
# Connect to local database
npx supabase db connect

# Check lesson has survey_id
SELECT id, slug, survey_id FROM payload.course_lessons WHERE slug IN ('before-you-go', 'before-we-begin');

# Verify survey links back correctly
SELECT id, slug, lesson FROM payload.surveys WHERE slug IN ('feedback', 'self-assessment');
```

### E2E Tests

Test user-facing survey display:

- E2E test: Navigate to before-you-go lesson → survey displays
- E2E test: Navigate to before-we-begin lesson → survey displays
- E2E test: Survey submission works correctly

**Test files**:
- `apps/e2e/tests/course-lessons.spec.ts` - Add tests for survey display

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/course/lessons/before-you-go` (Firefox, Chrome, Safari)
- [ ] Observe "Course Feedback" survey displays instead of empty content
- [ ] Navigate to `/home/course/lessons/before-we-begin` (Firefox, Chrome, Safari)
- [ ] Observe "Self-Assessment" survey displays (regression test)
- [ ] Both surveys allow submissions
- [ ] Survey responses persist to database
- [ ] No console errors or warnings
- [ ] No UI rendering issues or layout shifts

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **JSON syntax error breaking seed data**: Likelihood (low) / Impact (high)
   - Likelihood: low - simple field addition to well-formed JSON
   - Impact: high - bad JSON prevents database reset
   - Mitigation: Validate JSON syntax before applying; test JSON parsing with `cat course-lessons.json | jq .`

2. **Wrong survey reference**: Likelihood (low) / Impact (medium)
   - Likelihood: low - verified survey mappings in surveys.json
   - Impact: medium - wrong survey displays but lesson still works
   - Mitigation: Double-check survey IDs match those in surveys.json before applying

3. **Database seed conflict**: Likelihood (very low) / Impact (low)
   - Likelihood: very low - seed reset is idempotent
   - Impact: low - can re-run reset if needed
   - Mitigation: Standard reset procedure handles edge cases

4. **Circular reference issue**: Likelihood (very low) / Impact (low)
   - Likelihood: very low - seed engine handles circular references in two-pass seeding
   - Impact: low - seed documentation covers this pattern
   - Mitigation: Seed engine already designed for lesson ↔ survey relationships

**Rollback Plan**:

If this fix causes issues in production:

1. Revert the `course-lessons.json` changes to previous state
2. Run `pnpm supabase:web:reset` to revert database state
3. Application continues with surveys not displaying (original bug state)
4. Investigate root cause and design revised approach

## Performance Impact

**Expected Impact**: none - seed data only, no schema or query changes

The addition of `survey_id` field:
- Does not increase database load (existing lookup pattern)
- Does not add new queries
- Does not change fetch logic
- Improves performance by removing fallback query logic need

## Security Considerations

**Security Impact**: none

- Seed data is development/test only
- No authentication or authorization changes
- No sensitive data exposed
- Existing RLS policies unchanged

## Validation Commands

### Before Fix (Bug Should Reproduce)

Navigate to `/home/course/lessons/before-you-go` and observe that the "Course Feedback" survey does NOT display.

```bash
# Check that lesson doesn't have survey_id
grep -A 10 '"before-you-go"' apps/payload/src/seed/seed-data/course-lessons.json | grep survey_id
# Should output: (empty - field doesn't exist)
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Reset database with new seed data
pnpm supabase:web:reset

# Start dev server
pnpm dev

# Verify in browser:
# 1. Navigate to http://localhost:3000/home/course/lessons/before-you-go
# 2. Confirm "Course Feedback" survey displays
# 3. Navigate to http://localhost:3000/home/course/lessons/before-we-begin
# 4. Confirm "Self-Assessment" survey displays
```

**Expected Result**:
- Surveys display correctly in both lessons
- No console errors
- Zero regressions in other lessons
- All validation commands pass

### Regression Prevention

```bash
# Run full database seed validation
pnpm --filter payload seed:validate

# Run full E2E tests
pnpm test:e2e

# Check for seed data integrity
grep -c '"survey_id"' apps/payload/src/seed/seed-data/course-lessons.json
# Should show increased count from 0 to 2
```

## Dependencies

### New Dependencies

None - uses existing seed data patterns

### No new dependencies required

## Database Changes

**Migration needed**: no

This is a seed data change, not a schema change. The `survey_id` field already exists in the Payload CMS schema - it's just missing from seed data.

**Why no migration**:
- Column already exists in database (from existing Payload migrations)
- Seed data is only for local development and CI environments
- Production data loaded separately via migrations

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- None required - local-only seed data change
- No production database changes needed
- Safe to deploy alongside other changes

**Feature flags needed**: no

**Backwards compatibility**: fully maintained

## Success Criteria

The fix is complete when:
- [ ] `course-lessons.json` has valid JSON syntax
- [ ] "before-you-go" lesson has `survey_id: {ref:surveys:feedback}`
- [ ] "before-we-begin" lesson has `survey_id: {ref:surveys:self-assessment}`
- [ ] `pnpm supabase:web:reset` completes successfully
- [ ] Surveys display correctly in browser for both lessons
- [ ] No console errors or warnings
- [ ] All validation commands pass
- [ ] Manual testing checklist complete
- [ ] E2E tests pass

## Notes

**Important Context**:
- This is a regression introduced in commit `5885661d4` where "before-we-begin" lost the survey mapping
- The "before-you-go" lesson was never fixed despite the identical pattern
- The seed engine in `apps/payload/src/seed/seed-engine/` handles both circular references and dependency resolution - this fix leverages that infrastructure

**Related Documentation**:
- Seeding system: `.ai/ai_docs/context-docs/infrastructure/supabase-reset-system.md`
- Seed data architecture: `.ai/ai_docs/context-docs/infrastructure/database-seeding.md`
- Database patterns: `.ai/ai_docs/context-docs/development/database-patterns.md`

**Verification**: The exact survey IDs were verified against:
- `apps/payload/src/seed/seed-data/surveys.json` lines 1-82
- Lesson mappings confirmed for all three survey definitions

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #1064*
