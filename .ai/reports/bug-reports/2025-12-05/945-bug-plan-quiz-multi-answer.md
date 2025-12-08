# Bug Fix: Quiz multi-answer questions not being detected

**Related Diagnosis**: #944
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: The `questiontype` field is discarded during seed conversion. Payload schema lacks `questiontype` field, but the component has working fallback logic that counts `isCorrect: true` options.
- **Fix Approach**: Add `questiontype` field to Payload schema and update converter to preserve it from source data
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Quiz questions with multiple correct answers are not being detected as multi-answer in the UI. The seed data (.mdoc files) contains `questiontype: multi-answer` but this field is discarded during seed conversion and never stored in the database. While the QuizComponent has a working fallback mechanism that counts `isCorrect: true` options, the explicit field should exist for:

1. Data integrity - preserving source intent
2. Explicit UI control - `questiontype` field can directly determine question type
3. Future extensibility - allows other question types beyond multi-answer

For full details, see diagnosis issue #944.

### Solution Approaches Considered

#### Option 1: Add Explicit `questiontype` Field (Recommended) ⭐

**Description**:
Add a `questiontype` field to the Payload QuizQuestions collection schema, then update the quiz-questions-converter to output this field. This preserves the source data intent and provides explicit control.

**Pros**:
- Data fidelity: Seed intent preserved in database
- Future-proof: Can support additional question types easily
- Explicit control: UI can use field directly without fallback logic
- Low risk: Additive change (doesn't affect existing functionality)
- Simple implementation: Only schema and converter changes needed

**Cons**:
- Requires migration (one-time)
- Payload types need regeneration
- Existing quiz data won't have the field

**Risk Assessment**: Low - Additive change, fallback logic still works if field is missing

**Complexity**: Simple - Only schema field + converter update + types regeneration

#### Option 2: Keep Existing Fallback Logic

**Description**:
Do nothing. The QuizComponent already has working fallback that counts `isCorrect: true` options. If questions with multiple correct answers are showing radio buttons, the issue is likely in data flow (isCorrect values not flowing correctly).

**Pros**:
- Zero schema changes
- Zero migration needed
- Faster to implement (just debug data flow)

**Cons**:
- Doesn't preserve source intent
- Fragile (depends on counting logic)
- Harder to extend to other question types
- Inconsistent with source data

**Why Not Chosen**: Doesn't fix the root cause (discarded source data). Also doesn't clarify why fallback might not be working in production.

#### Option 3: Hybrid - Add Field + Keep Fallback

**Description**:
Add the `questiontype` field to schema AND keep the fallback logic. Component uses field if present, falls back to counting if not.

**Pros**:
- Best of both worlds
- Backward compatible
- Explicit intent + safety

**Cons**:
- More code to maintain
- Slightly more complex

**Why Not Chosen**: Option 1 is sufficient. Fallback logic can remain for backward compatibility without being the primary mechanism.

### Selected Solution: Add Explicit `questiontype` Field

**Justification**:
This is the cleanest approach that fixes the root cause (discarded data), provides explicit control, and enables future extensibility. The change is minimal, low-risk (additive), and maintains backward compatibility since the component has fallback logic.

**Technical Approach**:

1. **Schema Change**: Add `questiontype` select field to QuizQuestions collection with options: "single-answer" | "multi-answer"
2. **Converter Update**: Map the `questiontype` from mdoc source to the new field
3. **Type Generation**: Regenerate Payload types to include the new field
4. **Component Verification**: Verify component uses the field correctly (it already does)

**Architecture Changes**:
- None - this is purely additive data preservation
- Existing fallback logic remains unchanged for backward compatibility

**Migration Strategy**:
- Seed conversion runs automatically when database is reset
- No data migration needed for fresh development databases
- Existing production data can omit the field (fallback will handle it)

## Implementation Plan

### Affected Files

- `apps/payload/src/collections/QuizQuestions.ts` - Add `questiontype` field to schema
- `apps/payload/src/seed/seed-conversion/converters/quiz-questions-converter.ts` - Output `questiontype` from mdoc source
- `apps/web/app/home/(user)/course/lessons/[slug]/_components/QuizComponent.tsx` - Already handles this correctly (no changes)

### New Files

None - all changes are within existing files.

### Step-by-Step Tasks

#### Step 1: Add `questiontype` field to Payload schema

Add the field to `QuizQuestions.ts` between the `type` field and `options` field:

**What this accomplishes**:
Enables Payload CMS to store the question type, making it queryable and displayable in the admin UI.

- Add new `questiontype` select field with options "single-answer" and "multi-answer"
- Set default to "single-answer" for backward compatibility
- Make it required since seed converter will always provide it
- Update Payload types via typegen

**Why this step first**:
Schema must exist before converter can populate it, and types must be generated before code can reference the field.

#### Step 2: Update seed conversion to preserve `questiontype`

Modify `quiz-questions-converter.ts` to output the `questiontype` field from source mdoc data:

**What this accomplishes**:
Ensures that when seed data is converted, the explicit question type is preserved and stored in the database.

- Update the `quizQuestion` object (line 68) to include `questiontype` field
- Map it from `question.questiontype` (already parsed from mdoc)
- Both mdoc and TypeScript sources should include this

#### Step 3: Regenerate Payload types

Run typegen to generate updated `payload-types.ts`:

**What this accomplishes**:
Ensures TypeScript knows about the new field and the seed converter can reference it properly.

- Execute `pnpm supabase:web:typegen` (already part of workflow)
- Verify `QuizQuestion` type includes `questiontype` field

#### Step 4: Verify seed data has new field

Re-run seed conversion and verify the new field appears in `quiz-questions.json`:

**What this accomplishes**:
Confirms the converter is working correctly and outputting the field.

- Run `pnpm --filter payload seed:convert`
- Check `apps/payload/src/seed/seed-data/quiz-questions.json` for `questiontype` field
- Spot-check that "Deviation relationship" question has `questiontype: "multi-answer"`

#### Step 5: Verify quiz component works

Test that quizzes display correctly with multi-answer detection:

**What this accomplishes**:
Confirms the component uses the new field and multi-answer questions render checkboxes.

- Start dev server: `pnpm dev`
- Navigate to "Standard Graphs Quiz"
- Question 4 ("Deviation relationship") should display checkboxes
- Question 1-3 should display radio buttons
- Verify "Select all that apply" text appears for multi-answer questions

## Testing Strategy

### Unit Tests

Add/update unit tests for:
- ✅ `isMultiAnswerQuestion()` detects based on `questiontype` field
- ✅ Fallback logic still works if `questiontype` is missing (backward compat)
- ✅ Question with `questiontype: "multi-answer"` renders checkboxes
- ✅ Question with `questiontype: "single-answer"` renders radio buttons
- ✅ Multi-answer question requires selecting ALL correct options (already tested)

**Test files**:
- `apps/web/app/home/(user)/course/lessons/[slug]/_components/QuizComponent.test.tsx` - Update existing tests

### Integration Tests

- ✅ Seed conversion outputs `questiontype` field for all questions
- ✅ Payload stores `questiontype` field correctly
- ✅ QuizComponent fetches `questiontype` from Payload and uses it

### E2E Tests

- ✅ Navigate to "Standard Graphs Quiz" (contains multi-answer questions)
- ✅ Verify Question 4 displays checkboxes (multi-answer)
- ✅ Verify Questions 1-3 display radio buttons (single-answer)
- ✅ Complete multi-answer question by selecting multiple correct options
- ✅ Verify score calculation is correct

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Start dev server: `pnpm dev`
- [ ] Navigate to a lesson with quiz (e.g., "Standard Graphs")
- [ ] Verify Question 4 shows checkboxes (not radio buttons)
- [ ] Verify "Select all that apply" text appears
- [ ] Verify Questions 1-3 still show radio buttons
- [ ] Try to select multiple options in Question 4 (should work)
- [ ] Try to select multiple in Question 1 (should switch back on click)
- [ ] Complete quiz and verify score is correct
- [ ] Check browser console for no new errors

## Risk Assessment

**Overall Risk Level**: Low

**Potential Risks**:

1. **Backward Compatibility**: Existing quiz data in production won't have `questiontype` field
   - **Likelihood**: Low (development database resets automatically)
   - **Impact**: Low (fallback logic handles missing field)
   - **Mitigation**: Fallback logic in component ensures it works with or without field

2. **Type Generation Failure**: Payload typegen might not pick up new field
   - **Likelihood**: Very Low (standard process)
   - **Impact**: Medium (TypeScript errors in converter)
   - **Mitigation**: Run typegen explicitly, verify types exist before using

3. **Seed Conversion Regression**: Update to converter might break other questions
   - **Likelihood**: Very Low (only adding one field)
   - **Impact**: Medium (seed data generation fails)
   - **Mitigation**: Test conversion with all quiz types, spot-check output JSON

**Rollback Plan**:

If this fix causes issues in production:

1. Remove the `questiontype` field from QuizQuestions schema
2. Remove the field from converter output
3. Regenerate types
4. Component fallback logic handles it transparently

**Monitoring** (optional for this fix):
- No monitoring needed - this is a data-at-rest fix with fallback protection

## Performance Impact

**Expected Impact**: None

- Adding one select field to schema has no performance impact
- Converter processes one additional field (negligible)
- Component already reads one more field (negligible)
- No database query changes

**Performance Testing**: Not needed for this fix

## Security Considerations

**Security Impact**: None

- Adding a schema field does not introduce security risks
- No authentication/authorization changes
- No data exposure risks (field is metadata about question type)

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Navigate to Standard Graphs Quiz in dev
# Observe Question 4 ("Deviation relationship") shows radio buttons
# Try to select multiple answers - only one can be selected
# This is the bug: should show checkboxes and allow multiple selection
```

**Expected Result**: Question 4 displays radio buttons and prevents multi-select

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Regenerate types
pnpm supabase:web:typegen

# Re-run seed conversion
pnpm --filter payload seed:convert

# Start dev server
pnpm dev

# Navigate to Standard Graphs Quiz
# Verify Question 4 shows checkboxes
# Verify "Select all that apply" text appears
# Verify can select multiple answers
# Verify score calculation is correct
```

**Expected Result**: All commands succeed, Question 4 displays checkboxes, multi-select works

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# Verify quiz-questions.json has questiontype field
grep -c "questiontype" apps/payload/src/seed/seed-data/quiz-questions.json

# Verify QuizComponent test passes
pnpm --filter web test QuizComponent.test.tsx
```

## Dependencies

**No new dependencies required**

- All changes use existing packages and frameworks
- No new npm packages needed

## Database Changes

**Database changes**: No direct changes

**Why**: This is a Payload CMS schema change, not a PostgreSQL schema change

**Migration needed**: No

- Payload CMS handles schema evolution
- New field will be added via admin UI or Payload migrations
- No data migration needed (new field has default value)

## Deployment Considerations

**Deployment Risk**: Low

**Special deployment steps**:
- None - this is a safe, additive change
- New field defaults to "single-answer" for backward compatibility

**Feature flags needed**: No

**Backwards compatibility**: Maintained
- Existing data without `questiontype` falls back to counting logic
- No breaking changes to API or component

## Success Criteria

The fix is complete when:
- [ ] `questiontype` field exists in QuizQuestions schema
- [ ] Seed converter outputs `questiontype` from mdoc source
- [ ] Payload types are regenerated and include `questiontype`
- [ ] Quiz component test passes
- [ ] Manual testing confirms multi-answer questions show checkboxes
- [ ] Score calculation is correct for multi-answer questions
- [ ] No regressions in existing tests
- [ ] No TypeScript errors

## Notes

**Implementation Considerations**:
- The component already has correct logic to handle `questiontype` field (lines 216-229 in QuizComponent.tsx)
- Fallback logic (counting isCorrect options) can remain as safety mechanism
- This fix is backward compatible - old data without the field will still work via fallback
- Quiz data with explicit question types will be more maintainable and extensible

**Related Code**:
- Quiz seed data patterns: `apps/payload/src/seed/seed-data-raw/quizzes/*.mdoc`
- Converter source: `apps/payload/src/seed/seed-conversion/converters/quiz-questions-converter.ts`
- Component logic: `apps/web/app/home/(user)/course/lessons/[slug]/_components/QuizComponent.tsx:216-229`

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #944*
