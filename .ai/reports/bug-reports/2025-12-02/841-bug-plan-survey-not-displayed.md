# Bug Fix: Survey Not Displayed on 'Before we begin' Lesson Page

**Related Diagnosis**: #840
**Severity**: medium
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Three independent issues preventing survey display: missing `survey_id` in lesson seed data, wrong lesson reference in survey seed data, and incorrect hardcoded lesson_number fallback
- **Fix Approach**: Fix seed data configuration and hardcoded fallback to properly link survey to lesson
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The "Three Quick Questions" survey is not being displayed on the lesson page at `/home/course/lessons/before-we-begin`. The survey should appear automatically when the user visits this lesson, similar to how the self-assessment survey appears on the `/home/assessment` page.

For full details, see diagnosis issue #840.

### Solution Approaches Considered

#### Option 1: Fix All Three Root Causes ⭐ RECOMMENDED

**Description**: Address all three identified issues comprehensively:
1. Add `survey_id` field to "before-we-begin" lesson in seed data
2. Correct the survey's lesson reference from `lesson-0` to `before-we-begin` in seed data
3. Fix hardcoded lesson_number fallback from 103 to 8

**Pros**:
- Complete solution that addresses all root causes
- Eliminates all potential failure points
- No workarounds or technical debt
- Establishes correct data relationships going forward
- Simple surgical changes to seed data files and one code line

**Cons**:
- Requires database reset to apply seed data changes
- Requires updating two seed data files

**Risk Assessment**: low - Changes are isolated to seed data and a single hardcoded value, with no impact to production code logic

**Complexity**: simple - Only requires updating JSON seed files and one conditional check

#### Option 2: Only Fix the Hardcoded Fallback

**Description**: Only update the hardcoded lesson_number from 103 to 8, relying on the fallback mechanism

**Pros**:
- Minimal code change
- Doesn't require seed data updates

**Cons**:
- Leaves the underlying data relationship broken
- Doesn't establish proper lesson-survey linkage
- Hardcoded fallback is a code smell - indicates missing proper data configuration
- Won't scale if more lessons need surveys
- Creates brittle dependency on specific lesson_number values

**Why Not Chosen**: Creates technical debt by leaving broken data relationships intact. Future lessons would need similar hardcoded fallbacks.

#### Option 3: Only Update Seed Data

**Description**: Only fix the seed data (add survey_id and correct lesson reference), leave hardcoded fallback as is

**Pros**:
- Fixes the proper data relationship

**Cons**:
- Leaves hardcoded fallback in code even though it shouldn't be needed
- Code smell remains
- Future developers might be confused by the hardcoded value

**Why Not Chosen**: Leaves code in a confusing state even though it would technically work. Best to clean it up while fixing the data.

### Selected Solution: Fix All Three Root Causes

**Justification**: This approach comprehensively addresses the root cause by establishing proper data relationships through seed data while eliminating technical debt from the hardcoded fallback. All changes are minimal and low-risk. The surgical approach ensures the survey display system works correctly for the "before-we-begin" lesson and provides a clean pattern for any future lessons that need surveys.

**Technical Approach**:
- Update `course-lessons.json` to add `survey_id` field referencing the three-quick-questions survey
- Update `surveys.json` to correct the lesson reference to point to the correct lesson
- Update the hardcoded lesson_number conditional from 103 to 8 (or remove it if survey_id lookup works)
- Reset database to apply seed data changes

**Architecture Changes** (if any):
- None - this fix doesn't change the architecture, it just corrects data configuration
- The existing `LessonDataProvider` components already support survey_id lookup, so no code changes needed beyond the hardcoded value

**Migration Strategy** (if needed):
- Reset the local Supabase database to reload seed data with corrected values
- No production migration needed (this is seed data for local development and staging)

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/payload/src/seed/seed-data/course-lessons.json` - Add `survey_id` field to "before-we-begin" lesson with reference to three-quick-questions survey
- `apps/payload/src/seed/seed-data/surveys.json` - Change lesson reference from `{ref:course-lessons:lesson-0}` to `{ref:course-lessons:before-we-begin}`
- `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider-enhanced.tsx:265` - Update hardcoded lesson_number from 103 to 8
- `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider.tsx:268` - Update hardcoded lesson_number from 103 to 8

### New Files

No new files required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Lesson Seed Data

Add the `survey_id` field to the "before-we-begin" lesson in `course-lessons.json`.

- Open `apps/payload/src/seed/seed-data/course-lessons.json`
- Find the lesson object with `"slug": "before-we-begin"`
- Add field: `"survey_id": "{ref:surveys:three-quick-questions}"`
- Verify the change is syntactically correct JSON

**Why this step first**: This establishes the proper lesson-survey relationship at the data level

#### Step 2: Update Survey Seed Data

Correct the survey's lesson reference in `surveys.json`.

- Open `apps/payload/src/seed/seed-data/surveys.json`
- Find the survey object with `"slug": "three-quick-questions"`
- Locate the `"lesson"` field currently set to `"{ref:course-lessons:lesson-0}"`
- Change it to: `"{ref:course-lessons:before-we-begin}"`
- Verify the change is syntactically correct JSON

**Why this step second**: Completes the bidirectional relationship - now both lesson and survey reference each other correctly

#### Step 3: Fix Hardcoded Fallback in LessonDataProvider-enhanced.tsx

Update the hardcoded lesson_number conditional.

- Open `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider-enhanced.tsx`
- Find line 265: `if (lesson.lesson_number === 103) {`
- Change to: `if (lesson.lesson_number === 8) {`
- Save the file

**Why this step third**: Updates the fallback to match the correct lesson_number for before-we-begin

#### Step 4: Fix Hardcoded Fallback in LessonDataProvider.tsx

Update the hardcoded lesson_number conditional in the non-enhanced version.

- Open `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider.tsx`
- Find line 268: `if (lesson.lesson_number === 103) {`
- Change to: `if (lesson.lesson_number === 8) {`
- Save the file

**Why this step fourth**: Ensures consistency between both provider implementations

#### Step 5: Reset Database and Apply Seed Data Changes

Apply the seed data changes to the local database.

- Run: `pnpm supabase:web:reset`
- This will clear the database and reload seed data with the corrected values
- Wait for the command to complete successfully

**Why this step fifth**: Database reset applies the seed data changes to make them active

#### Step 6: Verify the Fix

Verify that the survey now appears on the lesson page.

- Start the development server: `pnpm dev`
- Log in to the application
- Navigate to `/home/course/lessons/before-we-begin`
- Verify that the "Three Quick Questions" survey is now displayed
- Compare the display with the self-assessment survey on `/home/assessment` to ensure consistency

#### Step 7: Run Type Checks and Linting

Ensure code quality standards are met.

- Run: `pnpm typecheck`
- Run: `pnpm lint`
- Run: `pnpm format:fix`
- Verify all commands pass without errors

**Why this step last**: Ensures code changes don't introduce type errors or style violations

## Testing Strategy

### Unit Tests

No unit tests required - this is a seed data and configuration fix, not a functional code change.

### Integration Tests

No integration tests required - this fix is configuration-based.

### E2E Tests

Add/update E2E tests for the lesson survey display:
- ✅ Survey displays on before-we-begin lesson page
- ✅ Survey has correct content and questions
- ✅ User can interact with survey (if applicable)
- ✅ Regression test: Self-assessment survey still displays on assessment page

**Test files**:
- `apps/e2e/tests/lessons.spec.ts` - Add test for survey display on lesson page

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reset database with `pnpm supabase:web:reset`
- [ ] Start development server with `pnpm dev`
- [ ] Log in to the application
- [ ] Navigate to `/home/course/lessons/before-we-begin`
- [ ] Verify survey "Three Quick Questions" is displayed
- [ ] Check survey content is correct
- [ ] Compare with self-assessment survey display on `/home/assessment`
- [ ] Verify no console errors appear
- [ ] Test that survey can be interacted with (if interactive)
- [ ] Verify lesson content still displays correctly above/below survey

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Seed Data JSON Syntax Error**: If JSON is malformed, seed data won't load
   - **Likelihood**: low
   - **Impact**: medium (database reset would fail)
   - **Mitigation**: Carefully verify JSON syntax before running reset; test locally first

2. **Incorrect Reference IDs**: If survey or lesson slug doesn't match the reference
   - **Likelihood**: low
   - **Impact**: medium (survey won't link properly)
   - **Mitigation**: Double-check that `three-quick-questions` and `before-we-begin` are exact slugs in their respective files

3. **Database Reset Side Effects**: Reset clears all local development data
   - **Likelihood**: low
   - **Impact**: low (expected behavior of reset command)
   - **Mitigation**: Inform developers to back up any important test data before running reset

**Rollback Plan**:

If this fix causes issues:
1. Revert the seed data changes: `git checkout apps/payload/src/seed/seed-data/course-lessons.json apps/payload/src/seed/seed-data/surveys.json`
2. Revert the code changes: `git checkout apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider*.tsx`
3. Run database reset again: `pnpm supabase:web:reset`
4. Restart development server

**Monitoring** (if needed):
- Monitor that survey displays correctly on the lesson page after fix
- Check console logs for any relationship/reference errors

## Performance Impact

**Expected Impact**: none

This is a configuration fix that doesn't affect performance. The survey lookup mechanism already exists and is optimized.

## Security Considerations

No security implications - this is seed data configuration only.

**Security Impact**: none

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start dev server with current (broken) seed data
pnpm dev

# Navigate to lesson page - survey should NOT be displayed
# Check browser console for any errors
```

**Expected Result**: Survey does not appear on `/home/course/lessons/before-we-begin`

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format:fix

# Reset database with corrected seed data
pnpm supabase:web:reset

# Start development server
pnpm dev

# Manual verification:
# 1. Log in
# 2. Navigate to /home/course/lessons/before-we-begin
# 3. Verify "Three Quick Questions" survey is displayed
# 4. Check browser console - no errors
```

**Expected Result**: Survey displays correctly on the lesson page, all validation commands pass, no console errors.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Run E2E tests specifically for lesson pages
pnpm test:e2e lessons
```

## Dependencies

### New Dependencies (if any)

No new dependencies required.

## Database Changes

**Migration needed**: no

**Changes**:
- Seed data updates only (no schema changes)
- Corrects references between `lessons` and `surveys` tables
- No data migration needed (applies on reset)

**Notes**:
- Changes are applied via seed data on database reset
- No new migration files needed
- Development-only changes (affects seed data, not production schema)

## Deployment Considerations

**Deployment Risk**: none

**Special deployment steps**: none needed

**Feature flags needed**: no

**Backwards compatibility**: maintained (no breaking changes)

**Notes**:
- This fix is for seed data configuration only
- No production database changes required
- No deployment changes needed
- Development teams should run `pnpm supabase:web:reset` after pulling changes

## Success Criteria

The fix is complete when:
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Survey "Three Quick Questions" displays on lesson page
- [ ] Survey content appears correctly formatted
- [ ] No console errors appear
- [ ] Self-assessment survey still displays on assessment page (no regression)
- [ ] Manual testing checklist complete
- [ ] E2E tests pass

## Notes

This is a surgical, low-risk fix that addresses all three root causes identified in the diagnosis. The changes are isolated to seed data configuration and a single hardcoded value. No architectural changes are needed since the LessonDataProvider already supports survey_id-based lookups.

The hardcoded lesson_number fallback on lines 265 and 268 should ideally be removed entirely once we confirm the survey_id lookup works properly, but that's beyond the scope of this fix. This fix corrects the value to match the actual lesson_number for "before-we-begin".

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #840*
