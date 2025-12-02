# Bug Fix: Survey Slug Mismatch Causes "Survey Not Found" Error

**Related Diagnosis**: #833 (REQUIRED)
**Severity**: high
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Seed data missing explicit `slug` field; Payload auto-generates slug from title that doesn't match hardcoded query
- **Fix Approach**: Add explicit `slug` field to surveys.json using the surveyId, ensuring queries find the correct survey
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

The assessment page queries for a survey with `slug="self-assessment"`, but the seeded survey has an auto-generated slug of `"highstakes-presentations-selfassessment"` (derived from the title "High-Stakes Presentations Self-Assessment"). This mismatch causes "Survey Not Found" to display.

For full details, see diagnosis issue #833.

### Solution Approaches Considered

#### Option 1: Add `slug` field to seed data and converter ⭐ RECOMMENDED

**Description**: Update `surveys.json` to include explicit `slug` fields for all surveys, and modify the surveys converter to generate the `slug` field using the `surveyId` (which is derived from the source filename).

**Pros**:
- Simple, surgical fix targeting the root cause
- Consistent with how other collections (e.g., `downloads`) handle slugs
- Uses existing surveyId which matches expected query values
- No changes needed to frontend query code
- Idempotent - re-running seed will produce same results

**Cons**:
- Requires regenerating seed data files

**Risk Assessment**: low - Only affects seed data generation, no runtime code changes

**Complexity**: simple - Two small file modifications

#### Option 2: Change frontend queries to use auto-generated slug format

**Description**: Update all frontend queries to use the auto-generated slug pattern (e.g., `"highstakes-presentations-selfassessment"` instead of `"self-assessment"`).

**Pros**:
- No seed data changes required

**Cons**:
- Requires updating multiple frontend files
- Auto-generated slugs are less readable/predictable
- Future title changes would break queries again
- Harder to maintain consistency across surveys

**Why Not Chosen**: Creates coupling between survey titles and query logic, making the system fragile to title changes.

#### Option 3: Query by ID instead of slug

**Description**: Change frontend to query surveys by their database ID rather than slug.

**Pros**:
- IDs are guaranteed unique

**Cons**:
- IDs are UUIDs, not human-readable
- Would require knowing database IDs at build time
- Breaks URL-friendly patterns
- Major architectural change

**Why Not Chosen**: Defeats the purpose of having slugs for URL-friendly identifiers.

### Selected Solution: Add `slug` field to seed data and converter

**Justification**: This is the most surgical fix that addresses the root cause without changing frontend behavior. It follows the established pattern used by other collections (like `downloads`) and ensures the `slug` matches the expected query value.

**Technical Approach**:
- Add `slug` field to `SurveyJson` interface in converter
- Generate `slug` from `surveyId` in the converter (same value used for `id`)
- Regenerate `surveys.json` by running the converter
- Verify the seeded data has correct slugs

**Architecture Changes**: None - this follows existing patterns

**Migration Strategy**: None needed - this only affects seed data

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/payload/src/seed/seed-conversion/converters/surveys-converter.ts` - Add `slug` field generation to converter
- `apps/payload/src/seed/seed-data/surveys.json` - Will be regenerated with `slug` fields

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update surveys converter to include slug field

Update the `SurveyJson` interface and survey object construction to include the `slug` field.

- Add `slug: string` to the `SurveyJson` interface (around line 22)
- Add `slug: surveyId` to the survey object construction (around line 110-121)

**Code changes in `surveys-converter.ts`**:

```typescript
// In SurveyJson interface, add:
interface SurveyJson {
  id: string;
  slug: string;  // ADD THIS LINE
  title: string;
  // ... rest of interface
}

// In survey object construction, add slug field:
const survey: SurveyJson = {
  id: surveyId,
  slug: surveyId,  // ADD THIS LINE - uses same value as id
  title: surveyMeta.title,
  // ... rest of object
};
```

**Why this step first**: The converter must be updated before regenerating the seed data.

#### Step 2: Regenerate surveys.json by running the converter

Run the seed conversion to regenerate `surveys.json` with the new `slug` fields.

- Navigate to the payload app directory
- Run the seed conversion command

```bash
cd /home/msmith/projects/2025slideheroes/apps/payload
pnpm seed:convert
```

**Expected output**: `surveys.json` should now contain `slug` fields matching the `id` values:
- `"id": "self-assessment", "slug": "self-assessment"`
- `"id": "feedback", "slug": "feedback"`
- `"id": "three-quick-questions", "slug": "three-quick-questions"`

#### Step 3: Verify surveys.json has correct slugs

Manually inspect the regenerated file to confirm slugs are present.

- Open `apps/payload/src/seed/seed-data/surveys.json`
- Verify each survey object has a `slug` field
- Verify `slug` values match expected query values

#### Step 4: Re-seed the Payload CMS database

Apply the updated seed data to the database.

```bash
cd /home/msmith/projects/2025slideheroes
pnpm supabase:web:reset  # Reset Supabase first if needed
pnpm --filter payload seed  # Re-seed Payload CMS
```

Or use the combined command if available:
```bash
pnpm supabase:web:reset && pnpm --filter payload seed
```

#### Step 5: Verify the fix works

Test the assessment page to confirm the survey loads correctly.

- Start the development server: `pnpm dev`
- Log in to the application
- Navigate to `/home/assessment`
- Verify the "High-Stakes Presentations Self-Assessment" survey displays
- Verify the "Take Survey" button appears

#### Step 6: Run validation commands

Ensure no regressions were introduced.

```bash
pnpm typecheck
pnpm lint
pnpm format
```

## Testing Strategy

### Unit Tests

No new unit tests required - this is a seed data fix.

### Integration Tests

No new integration tests required - existing survey tests will validate the fix.

### E2E Tests

The existing E2E tests should pass after the fix. If there are specific assessment page tests, they will now pass.

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Navigate to `/home/assessment` while logged in
- [ ] Verify "High-Stakes Presentations Self-Assessment" survey title displays
- [ ] Verify "Take Survey" button is visible
- [ ] Click "Take Survey" and verify survey questions load
- [ ] Verify feedback survey still works (if applicable)
- [ ] Verify three-quick-questions survey still works (if applicable)
- [ ] Check browser console for any new errors

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Seed conversion command fails**:
   - **Likelihood**: low
   - **Impact**: low
   - **Mitigation**: Verify converter syntax before running; seed data is version controlled

2. **Other surveys break due to slug changes**:
   - **Likelihood**: low
   - **Impact**: medium
   - **Mitigation**: All surveys get consistent slug treatment; test all survey pages

**Rollback Plan**:

If this fix causes issues:
1. Revert changes to `surveys-converter.ts`
2. Restore `surveys.json` from git: `git checkout apps/payload/src/seed/seed-data/surveys.json`
3. Re-seed the database

**Monitoring**: None needed - this is a seed data fix with immediate verification.

## Performance Impact

**Expected Impact**: none

No runtime performance changes - this only affects seed data generation.

## Security Considerations

**Security Impact**: none

No security implications - slugs are public identifiers used for URL routing.

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start dev server and navigate to /home/assessment
# Should see "Survey Not Found" message
pnpm dev
# Open browser to http://localhost:3000/home/assessment
```

**Expected Result**: "Survey Not Found" error message displays

### After Fix (Bug Should Be Resolved)

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Format
pnpm format

# Start dev server
pnpm dev
# Open browser to http://localhost:3000/home/assessment
```

**Expected Result**: Survey title and "Take Survey" button display correctly.

### Regression Prevention

```bash
# Run full test suite to ensure no regressions
pnpm test

# If E2E tests exist for assessment page
pnpm test:e2e
```

## Dependencies

**No new dependencies required**

## Database Changes

**Migration needed**: no

**No database schema changes required** - this only affects seed data content.

## Deployment Considerations

**Deployment Risk**: low

**Special deployment steps**:
- After deploying, re-seed the Payload CMS database if using seeded data in the target environment

**Feature flags needed**: no

**Backwards compatibility**: maintained

## Success Criteria

The fix is complete when:
- [ ] `surveys-converter.ts` includes `slug` field generation
- [ ] `surveys.json` contains `slug` fields for all surveys
- [ ] Assessment page displays survey correctly (no "Survey Not Found")
- [ ] All validation commands pass (typecheck, lint, format)
- [ ] Manual testing checklist complete
- [ ] No console errors on assessment page

## Notes

The `id` field in `surveys.json` is the seeding engine's internal reference identifier, not the Payload database ID. Payload generates UUIDs for actual database IDs. The `slug` field is what Payload uses for URL-friendly lookups.

This pattern of using `surveyId` for both `id` and `slug` is consistent with how the seeding system works - the filename becomes the identifier used throughout the system.

**Related files for reference**:
- `apps/payload/src/seed/seed-data/downloads.json` - Example of collection with proper `slug` field
- `apps/payload/src/collections/Surveys.ts:30-51` - Slug field definition with auto-generation hook

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #833*
