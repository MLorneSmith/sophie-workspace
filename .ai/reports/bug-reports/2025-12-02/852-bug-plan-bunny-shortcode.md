# Bug Fix: Bunny Video Shortcode Appearing in Lesson Content

**Related Diagnosis**: #850 (REQUIRED)
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Regex mismatch in `convertToSimpleLexical()` - expects `%}` but shortcode uses `/%}` (self-closing)
- **Fix Approach**: Correct regex pattern to match self-closing `/{%.../%}/` syntax
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Lesson pages with Bunny videos correctly extract and display the video via the `bunny_video_id` field, but the raw shortcode text `{% bunny bunnyvideoid="..." /%}` appears as a paragraph in the lesson content area below the video.

Root cause: The regex at line 328 in `convertToSimpleLexical()` uses incorrect syntax:
```typescript
// INCORRECT (expects %})
/{% bunny\s+([^%]+)\s+%}/

// ACTUAL SHORTCODE FORMAT (self-closing /%})
{% bunny bunnyvideoid="2620df68-c2a8-4255-986e-24c1d4c1dbf2" /%}
```

When the regex fails to match, the shortcode paragraph falls through to become a regular text paragraph instead of being removed.

For full details, see diagnosis issue #850.

### Solution Approaches Considered

#### Option 1: Fix the Regex in `convertToSimpleLexical()` ⭐ RECOMMENDED

**Description**: Update the regex pattern at line 328 to correctly match the self-closing `/{%.../%}/` syntax used in actual shortcodes. When a shortcode is detected and processed, return `null` or skip it entirely so it doesn't become a paragraph.

**Pros**:
- Minimal code change (2-3 lines)
- Fixes the root cause directly
- Consistent with how the code already handles other shortcodes
- No ripple effects on other parts of the conversion system

**Cons**:
- None significant for this case

**Risk Assessment**: low - Contained change to single regex pattern

**Complexity**: simple - Just fixing a regex pattern

#### Option 2: Strip Bunny Shortcodes Before Calling `convertToSimpleLexical()`

**Description**: In the lesson conversion process, remove bunny shortcodes from content before passing to `convertToSimpleLexical()`. This would prevent the shortcode from ever reaching the paragraph conversion.

**Pros**:
- Ensures shortcodes are removed regardless of regex accuracy
- Separates concerns (extraction vs. rendering)

**Cons**:
- Additional preprocessing step
- Duplicates extraction logic already in `extractBunnyVideoId()`
- More complex solution than needed

**Why Not Chosen**: Option 1 is simpler, more direct, and already consistent with the code structure.

### Selected Solution: Fix the Regex in `convertToSimpleLexical()`

**Justification**: The regex pattern is the root cause. Fixing it directly resolves the issue with minimal complexity and no side effects. This is consistent with how the codebase handles other shortcodes (highlight, survey, etc.). The fix is surgical - change one regex pattern and ensure unmatched paragraphs don't create content blocks.

**Technical Approach**:
1. Update the regex from `/{% bunny\s+([^%]+)\s+%}/` to `/{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/i`
2. Ensure unmatched shortcodes don't become paragraphs by returning a skip/null value
3. The `extractBunnyVideoId()` function already has the correct regex, so we align with that pattern

**Architecture Changes** (if any):
- None. This is a bug fix in existing functionality, not a new feature.

**Migration Strategy** (if needed):
- Regenerate seed data after fix to remove shortcode text from existing lessons
- Run `pnpm supabase:web:reset` to rebuild database with corrected seed data

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts:328` - Fix regex pattern in `convertToSimpleLexical()` function
- `apps/payload/src/seed/seed-data/course-lessons.json` - Regenerate after fix (will be recreated by seed script)

### New Files

None required.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Fix the Regex Pattern

Update the bunny shortcode detection in `convertToSimpleLexical()` function:

- Locate line 328 in `course-lessons-converter.ts`
- Change regex from: `/{% bunny\s+([^%]+)\s+%}/`
- Change to: `/{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/i`
- Update the return statement to skip the shortcode (don't create a paragraph node)
- Ensure alignment with `extractBunnyVideoId()` function regex (line 461)

**Why this step first**: It's the core fix that must happen before regenerating seed data.

#### Step 2: Verify Regex Consistency

- Cross-check that the regex matches the format used by `extractBunnyVideoId()`
- Both should match the exact shortcode format: `{% bunny bunnyvideoid="UUID" /%}`
- Consider case-insensitive matching with `i` flag

#### Step 3: Handle Edge Cases

- Ensure the function doesn't create a paragraph node for failed matches
- Current code at line 329 checks `if (videoMatch)` - this is good
- If regex doesn't match, the code continues to the `else if` for highlight components
- Ensure it eventually becomes a regular paragraph only if ALL shortcode checks fail

#### Step 4: Regenerate Seed Data

- Delete the current seed data: `rm apps/payload/src/seed/seed-data/course-lessons.json`
- Run the conversion script to regenerate seed data with the corrected regex:
  ```bash
  cd apps/payload && node src/seed/seed-conversion/run-converters.js
  ```
- Verify the output: Check that regenerated `course-lessons.json` no longer contains raw bunny shortcodes in paragraph content

#### Step 5: Reset Database

- Reset the local Supabase database to apply the corrected seed data:
  ```bash
  pnpm supabase:web:reset
  ```
- This will use the regenerated `course-lessons.json` with corrected content

#### Step 6: Add/Update Tests

Test the regex fix:

- Add unit test for `extractBunnyVideoId()` to verify it matches the correct format
- Add test for the corrected regex in `convertToSimpleLexical()`
- Add regression test to ensure shortcodes are removed from content after fix

**Test coverage**:
- Valid shortcode: `{% bunny bunnyvideoid="2620df68-c2a8-4255-986e-24c1d4c1dbf2" /%}` - should match
- Invalid formats should not match (prevent false positives)
- Shortcode should not appear in final paragraph content

#### Step 7: Manual Verification

- Manually verify in the application that:
  - The video player displays correctly
  - No raw shortcode text appears in the lesson content
  - All 19 affected lessons render properly
  - Navigate to `/home/course/lessons/lesson-0` (Welcome to DDM) to test

#### Step 8: Validation

- Run all validation commands (see Validation Commands section)
- Verify zero regressions
- Confirm bug is fixed

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `extractBunnyVideoId()` matches valid shortcodes
- ✅ Regex correctly identifies bunny video ID from shortcode
- ✅ `convertToSimpleLexical()` doesn't create paragraphs for shortcodes
- ✅ Edge case: Multiple shortcodes in same lesson
- ✅ Edge case: Malformed shortcodes are handled gracefully
- ✅ Regression test: Original bug (shortcode text in content) should not reoccur

**Test files**:
- `apps/payload/src/seed/seed-conversion/converters/__tests__/course-lessons-converter.spec.ts` - Tests for the converter functions

### Integration Tests

Test the full conversion pipeline:
- Seed data generation with corrected regex
- Database seeding produces lessons without shortcode text

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Reproduce original bug (should see shortcode text before fix)
- [ ] Apply fix and regenerate seed data
- [ ] Reset database with new seed data
- [ ] Navigate to `/home/course/lessons/lesson-0` - verify video displays and NO shortcode text appears
- [ ] Check all 19 affected lessons render properly without shortcode text
- [ ] Verify no console errors in browser
- [ ] Test with different video IDs to ensure regex is flexible
- [ ] Check that other shortcodes (highlight, survey) still work properly

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Regex doesn't match all valid shortcodes**: If there are variations in shortcode format
   - **Likelihood**: low
   - **Impact**: low (would just create a paragraph instead)
   - **Mitigation**: Review actual shortcode formats in seed data files; test with real examples

2. **Unintended side effects in other shortcode handling**: If changes affect highlight or other shortcodes
   - **Likelihood**: very low
   - **Impact**: low
   - **Mitigation**: Keep changes isolated to bunny video handling; run full test suite

3. **Database inconsistency**: If seed data regeneration fails
   - **Likelihood**: very low
   - **Impact**: medium
   - **Mitigation**: Backup seed data before regeneration; verify regeneration completes without errors

**Rollback Plan**:

If this fix causes issues in production:
1. Revert the regex change in `course-lessons-converter.ts`
2. Regenerate seed data with the original (buggy) regex
3. Reset database with the old seed data
4. Deploy the reverted code

**Monitoring** (if needed):
- No special monitoring needed for this fix
- This is a data correction, not a behavioral change

## Performance Impact

**Expected Impact**: none

This is a data correctness fix, not a performance change. No performance implications.

## Security Considerations

**Security Impact**: none

This fix only affects how lesson content is processed during seed data generation. No security implications.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Check current lesson-0 content for shortcode text
# This should show raw bunny shortcode in the content
curl -X GET http://localhost:3000/api/lessons/lesson-0
# Or inspect the course-lessons.json file directly
cat apps/payload/src/seed/seed-data/course-lessons.json | grep -i "bunny" | head -5
```

**Expected Result**: Raw shortcode text like `{% bunny bunnyvideoid="..." /%}` appears in lesson content

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Regenerate seed data
cd apps/payload && node src/seed/seed-conversion/run-converters.js

# Reset database
pnpm supabase:web:reset

# Run unit tests
pnpm test:unit

# Build
pnpm build

# Manual verification - check lesson content for shortcodes
cat apps/payload/src/seed/seed-data/course-lessons.json | grep -c "{% bunny"
# Expected: 0 occurrences
```

**Expected Result**:
- All commands succeed
- Seed data regeneration completes without errors
- No raw shortcode text in `course-lessons.json`
- Bug is resolved - video displays correctly without shortcode text
- Zero regressions

### Regression Prevention

```bash
# Run full test suite
pnpm test

# Check that other shortcodes still work (highlight, survey)
pnpm test:unit -- course-lessons-converter

# Verify seed data integrity
# Check for:
# - bunny_video_id field populated correctly
# - No raw shortcodes in content paragraphs
# - No highlight or survey shortcodes in content
```

## Dependencies

### New Dependencies (if any)

**No new dependencies required**

The fix uses existing TypeScript regex capabilities.

## Database Changes

**No database schema changes required**

**Seed data regeneration needed**: yes
- The `course-lessons.json` seed data file will be regenerated with corrected content
- No migrations needed, just data correction

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Before deploying: Regenerate and commit updated seed data
- The fix is backward compatible (doesn't change the database schema)
- Existing data should be re-seeded on deployment if using the reset approach

**Feature flags needed**: no

**Backwards compatibility**: maintained
- This is a data correction, not an API change
- No breaking changes to interfaces or functions

## Success Criteria

The fix is complete when:
- [ ] Regex pattern corrected to match actual shortcode format
- [ ] `convertToSimpleLexical()` properly skips shortcodes
- [ ] Seed data regenerated without raw shortcode text
- [ ] Database reset with new seed data
- [ ] All validation commands pass
- [ ] Bug no longer reproduces (video displays without shortcode text)
- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero regressions detected
- [ ] All 19 affected lessons render correctly
- [ ] Code review approved (if applicable)

## Notes

**Implementation order is critical**: The regex fix must be applied before regenerating seed data, otherwise the shortcodes will still be in the output.

**Regex pattern explanation**:
- `/{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/i`
- `{%` - literal opening (curly brace, percent)
- `\s*` - optional whitespace
- `bunny` - literal "bunny"
- `\s+` - required whitespace
- `bunnyvideoid="` - literal attribute name and opening quote
- `([^"]+)` - capture group: one or more non-quote characters (the video ID)
- `"` - closing quote
- `\s*` - optional whitespace
- `/%}` - literal closing (slash, percent, curly brace)
- `i` - case-insensitive flag

**Related files for context**:
- `extractBunnyVideoId()` at line 459 - already has the correct regex
- `convertToSimpleLexical()` at line 293 - where the fix applies
- Seed data affected: 19 lessons with Bunny video embeds

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #850*
