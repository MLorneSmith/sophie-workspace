# Bug Fix: Lesson field labels display inconsistently for lessons 10-29

**Related Diagnosis**: #861 (REQUIRED)
**Severity**: medium
**Bug Type**: integration
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Seed converter intentionally filters out "None" values, causing JSON fields to be missing when content is "None"
- **Fix Approach**: Preserve "None" values in converter as richText format with "none" text content, ensuring all field labels always exist
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Lesson 10 ("Our Process") shows only the "Test Yourself" label because the converter filters out fields where content is "None". Lesson 11 ("The Who") shows all labels because it has actual content in some fields. This causes inconsistent UI rendering where some lessons hide labels entirely and others show them.

**Expected behavior**: All lessons 10-29 should always show labels: To-Do, Watch, Read, Course Project, Test Yourself (with "none" value if no content).

For full details, see diagnosis issue #861.

### Solution Approaches Considered

#### Option 1: Preserve "None" as richText with "none" content ⭐ RECOMMENDED

**Description**: Modify the converter to detect "None" content and convert it to richText format with "none" as the display text, ensuring fields always exist in JSON.

**Pros**:
- Minimal code changes (3-4 lines in `extractSection` function)
- Preserves intent ("None" explicitly shown in UI)
- No data loss or schema changes needed
- Works with existing UI logic
- Aligns with requirement: "display 'none' as the content value"

**Cons**:
- Requires re-running seed converter for all lessons
- Minor semantic change: "None" becomes "none" in display

**Risk Assessment**: low - confined to converter logic, no database schema changes

**Complexity**: simple - straightforward text-to-richText conversion

#### Option 2: Handle in UI layer

**Description**: Modify the lesson view component to check for missing fields and display default "none" content.

**Pros**:
- No converter changes needed
- Preserves original JSON structure

**Cons**:
- Requires UI component modifications
- Logic scattered between converter and UI
- More fragile (converter-UI contract implicit)
- Doesn't match requirement: "Always show all field labels"

**Why Not Chosen**: Converter should ensure data completeness; UI should display it as-is.

#### Option 3: Update to store "None" literally in JSON

**Description**: Change converter to store "None" string value directly without filtering.

**Pros**:
- Minimal converter changes

**Cons**:
- Requires UI logic to convert "None" string to richText
- Duplicates conversion logic across codebase
- Harder to maintain consistency

**Why Not Chosen**: Converter already handles richText conversion; better to do it there.

### Selected Solution: Preserve "None" as richText with "none" content

**Justification**: This approach:
1. Keeps data complete and self-describing (all fields always exist)
2. Minimizes code changes (single function modification)
3. Allows UI to display fields consistently without special handling
4. Directly matches diagnosis requirement: "display 'none' as content value"
5. Is the most maintainable long-term solution

**Technical Approach**:
- Modify `extractSection()` function in converter to detect "None" content
- Instead of returning `null`, create richText structure with "none" as text
- This ensures `todo`, `todo_watch_content`, `todo_read_content`, `todo_course_project` fields always exist
- Re-run seed converter to regenerate `course-lessons.json`

**Architecture Changes**: None - pure converter improvement

**Migration Strategy**: None needed - seed data regeneration

## Implementation Plan

### Affected Files

- `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts` - Modify `extractSection()` and helper functions to preserve "None" as richText
- `apps/payload/src/seed/seed-data/course-lessons.json` - Will be regenerated with updated lesson data

### New Files

None - modifying existing converter

### Step-by-Step Tasks

#### Step 1: Modify converter to preserve "None" values

Modify the `extractSection()` function (line 532) and add a new helper function:

**Changes needed**:
1. Add new function `convertNoneToLexical()` that creates richText structure with "none" text
2. Update `extractSection()` to:
   - Check if section content is exactly "None" (or empty)
   - Instead of returning `null`, return "- none" which will be processed like a bullet point
   - Or alternatively, return the "None" string and handle it in `textToLexicalRichText()`
3. Update `textToLexicalRichText()` helper to handle the special "none" value

**Rationale**: By preserving "None" values instead of filtering them, all lesson fields will have consistent structure.

**Why this step first**: Foundation for subsequent changes; enables proper data generation.

#### Step 2: Verify converter logic handles all section types

Test that the modification works for:
- `extractTodoSectionContent()` → `lesson.todo`
- `extractWatchSection()` → `lesson.todo_watch_content`
- `extractReadSection()` → `lesson.todo_read_content`
- `extractCourseProjectSection()` → `lesson.todo_course_project`

**Changes**: No changes needed - they all use `extractSection()` internally, so fix applies to all.

#### Step 3: Run seed converter to regenerate JSON

```bash
cd apps/payload
pnpm seed:convert
```

This will regenerate `apps/payload/src/seed/seed-data/course-lessons.json` with updated lesson data where "None" fields are preserved as richText.

**Validation**: Check that lessons 10 and 20 (which only have `todo_complete_quiz`) now have all four fields populated.

#### Step 4: Update tests if needed

- No existing unit tests found for converter (checked converter directory)
- Manual verification sufficient for this fix
- Could add regression test if test infrastructure exists

#### Step 5: Validate final seed data

Verify that:
- Lesson 10 now has: `todo`, `todo_watch_content`, `todo_read_content`, `todo_course_project` all with richText structure
- All lessons 10-29 have consistent field structure
- Quiz and other references still intact
- No data corruption

## Testing Strategy

### Converter Unit Tests

**Current state**: Converter doesn't appear to have unit tests

**Tests to add** (optional):
- ✅ Extracting "None" value should create richText with "none" text
- ✅ Extracting actual content should work unchanged
- ✅ Empty sections should create richText with "none" text
- ✅ All lesson numbers 10-29 should have all four todo fields

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Run converter: `pnpm --filter payload seed:convert`
- [ ] Check lesson 10 JSON structure: `jq '.[] | select(.lesson_number == 10)' apps/payload/src/seed/seed-data/course-lessons.json`
- [ ] Verify all four fields exist: `todo`, `todo_watch_content`, `todo_read_content`, `todo_course_project`
- [ ] Verify lesson 10 has richText structure (not null)
- [ ] Check lesson 20 also has all four fields with "none" content
- [ ] Spot-check lesson 11 to ensure actual content unchanged
- [ ] Navigate to `/home/course/lessons/our-process` in dev environment
- [ ] Verify all five labels visible: To-Do, Watch, Read, Course Project, Test Yourself
- [ ] Click through lessons 10-29 to verify consistent label display
- [ ] Verify lesson 11 still shows actual content in each section

### E2E Tests

If lesson view tests exist:

- [ ] Verify all labels render for lesson 10
- [ ] Verify content displays "none" when field was "None"
- [ ] Verify normal lessons (11+) display actual content unchanged

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Converter breaks unexpectedly**: The modification is in well-isolated `extractSection()` function
   - **Likelihood**: low
   - **Impact**: medium (all lessons fail to seed)
   - **Mitigation**: Test locally with `pnpm seed:convert`, validate output manually before applying

2. **"None" values display as "none" text**: This is expected behavior per requirement
   - **Likelihood**: high (intentional)
   - **Impact**: low (user expects to see something)
   - **Mitigation**: None - this is the desired outcome

3. **Lesson content regression**: Other lessons might get affected
   - **Likelihood**: low (touching only "None" handling)
   - **Impact**: medium (breaks content)
   - **Mitigation**: Spot-check lesson 11 and 14 (mixed content) after conversion

**Rollback Plan**:

If this fix causes issues in production:
1. Revert converter change: `git checkout HEAD -- apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts`
2. Re-run converter: `pnpm --filter payload seed:convert`
3. Regenerate seed: `/supabase-reset`
4. Verify lessons display only available fields

**Monitoring** (if needed):
- Monitor lesson view pages for rendering errors
- Check browser console for errors on lesson pages
- Monitor seed operations for failures

## Performance Impact

**Expected Impact**: none

No performance implications - seed conversion is offline operation, no database query changes.

## Security Considerations

**Security Impact**: none

No security implications - purely data formatting change in seed converter.

## Validation Commands

### Before Fix (Bug Should Reproduce)

Verify lesson 10 only has `todo_complete_quiz` field:

```bash
cat apps/payload/src/seed/seed-data/course-lessons.json | jq '.[] | select(.lesson_number == 10) | keys'
```

**Expected Result**: Only includes `todo_complete_quiz`, not `todo`, `todo_watch_content`, `todo_read_content`, `todo_course_project`

### After Fix (Bug Should Be Resolved)

```bash
# 1. Run converter
pnpm --filter payload seed:convert

# 2. Check lesson 10 has all fields
cat apps/payload/src/seed/seed-data/course-lessons.json | \
  jq '.[] | select(.lesson_number == 10) | {todo, todo_watch_content, todo_read_content, todo_course_project}'

# 3. Verify structure
pnpm --filter payload seed:validate

# 4. Type check and lint
pnpm typecheck
pnpm lint:fix
pnpm format:fix

# 5. Reset database to test with UI
/supabase-reset

# 6. Navigate to lesson in browser
# http://localhost:3000/home/course/lessons/our-process
```

**Expected Result**:
- All four `todo_*` fields present and populated with richText structure
- Fields contain `{root: {type: "root", children: [{type: "list", ...}]}}` structure
- Lesson 10 displays all five labels in UI
- All 29 lessons show consistent label structure

### Regression Prevention

```bash
# Verify other lessons still have correct content
pnpm --filter payload seed:convert

# Check lesson 11 (should have actual content unchanged)
cat apps/payload/src/seed/seed-data/course-lessons.json | \
  jq '.[] | select(.lesson_number == 11) | {todo, todo_watch_content, todo_read_content}'

# Spot-check lesson 14
cat apps/payload/src/seed/seed-data/course-lessons.json | \
  jq '.[] | select(.lesson_number == 14) | {todo, todo_watch_content, todo_read_content, todo_course_project}' | head -20
```

## Dependencies

### New Dependencies (if any)

No new dependencies required - using existing converter infrastructure.

## Database Changes

**Migration needed**: no

The fix is purely in the seed data generation (JSON conversion). No database schema changes.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- Run seed converter after merge: `pnpm --filter payload seed:convert`
- Regenerate seed data locally before committing
- No special deployment flags needed
- No database migrations required

**Feature flags needed**: no

**Backwards compatibility**: maintained

Existing seed data format doesn't change - we're just adding missing fields.

## Success Criteria

The fix is complete when:
- [ ] Converter modified to preserve "None" values as richText
- [ ] Seed converter runs without errors: `pnpm --filter payload seed:convert`
- [ ] Lesson 10 JSON has all four `todo_*` fields with richText structure
- [ ] Lesson 20 JSON has all four `todo_*` fields with richText structure
- [ ] All lessons 10-29 have consistent field structure
- [ ] No regressions in lessons with actual content (11, 14, etc.)
- [ ] Lessons 10-29 display all five labels in UI
- [ ] All validation commands pass
- [ ] Code passes typecheck, lint, and format checks

## Notes

### Code Location Reference

- **Converter main file**: `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts`
- **Key function to modify**: `extractSection()` at line 532
- **Helper functions**: `extractTodoSectionContent()`, `extractWatchSection()`, `extractReadSection()`, `extractCourseProjectSection()` all use `extractSection()`
- **Utility function**: `textToLexicalRichText()` handles conversion to richText (used for actual content, may need slight modification for "none" text)
- **Output file**: `apps/payload/src/seed/seed-data/course-lessons.json`

### Diagnosis Evidence

Raw file shows "None" values:
```markdown
Watch
- None

Read
- None
```

Converter filters these out (line 549):
```typescript
if (!sectionContent || /^\s*-?\s*None\s*$/i.test(sectionContent)) {
  return null;
}
```

Result in JSON: Fields are missing entirely.

**Fix**: Change logic to preserve "None" as richText with "none" text instead of returning null.

### Affected Lessons Analysis

From diagnosis:
- **Lessons with only `todo_complete_quiz`** (all fields filtered): 10, 20
- **Lessons with partial fields** (some filtered): 11, 12, 13, 15, 18, 19, 22, 23, 25, 27, 28, 29
- **Lessons with all fields present**: 14, 16, 17, 21, 24, 26

After fix: All 29 lessons should have consistent structure with "none" values where needed.

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #861*
