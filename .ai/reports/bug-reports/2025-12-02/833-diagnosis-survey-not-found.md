# Bug Diagnosis: Self-Assessment Survey Not Found on Assessment Page

**ID**: ISSUE-833
**Created**: 2025-12-02T00:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The self-assessment page (`/home/assessment`) displays "Survey Not Found" instead of the "High-Stakes Presentations Self-Assessment" survey. The root cause is a mismatch between the slug the page queries for (`"self-assessment"`) and the auto-generated slug from the survey title when seeded into Payload CMS.

## Environment

- **Application Version**: dev branch (commit d216d4d1d)
- **Environment**: development
- **Node Version**: N/A
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown - likely never worked correctly with current seeding approach

## Reproduction Steps

1. Seed the Payload CMS database using the seed engine
2. Navigate to `/home/assessment` while logged in
3. Observe "Survey Not Found" error message

## Expected Behavior

The page should display the "High-Stakes Presentations Self-Assessment" survey with a title and "Take Survey" button.

## Actual Behavior

The page displays:
- "Survey Not Found" heading
- "The assessment survey is not available at this time. Please try again later."

## Diagnostic Data

### Code Analysis

**Assessment Page Query** (`apps/web/app/home/(user)/assessment/page.tsx:35`):
```typescript
const surveyData = await getSurvey("self-assessment");
```

**getSurvey Function** (`packages/cms/payload/src/api/survey.ts:24-25`):
```typescript
const result = await callPayloadAPI(
  `surveys?where[slug][equals]=${slug}&depth=3`,
```

**Survey Seed Data** (`apps/payload/src/seed/seed-data/surveys.json`):
```json
{
  "id": "self-assessment",
  "title": "High-Stakes Presentations Self-Assessment",
  // NO slug field provided
}
```

**Surveys Collection Auto-Generation Hook** (`apps/payload/src/collections/Surveys.ts:38-49`):
```typescript
hooks: {
  beforeValidate: [
    ({ value, data }) => {
      if (!value && data?.title) {
        return data.title
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .replace(/\s+/g, "-");
      }
      return value;
    },
  ],
},
```

### Slug Generation Analysis

When the survey is seeded without a `slug` field:
1. Title: `"High-Stakes Presentations Self-Assessment"`
2. toLowerCase: `"high-stakes presentations self-assessment"`
3. replace(/[^\w\s]/g, ""): `"highstakes presentations selfassessment"` (removes hyphens)
4. replace(/\s+/g, "-"): `"highstakes-presentations-selfassessment"`

**Auto-generated slug**: `"highstakes-presentations-selfassessment"`
**Query slug**: `"self-assessment"`

**MISMATCH** - The query will never find the survey.

## Error Stack Traces

No stack traces - the issue is a data/query mismatch, not a runtime error.

## Related Code

- **Affected Files**:
  - `apps/payload/src/seed/seed-data/surveys.json` - Missing `slug` field
  - `apps/payload/src/seed/seed-conversion/converters/surveys-converter.ts` - Doesn't generate slug
  - `apps/web/app/home/(user)/assessment/page.tsx:35` - Queries for hardcoded slug
  - `apps/web/app/home/(user)/assessment/survey/page.tsx:80` - Same query
  - `packages/cms/payload/src/api/survey.ts:20-28` - Query implementation
  - `apps/payload/src/collections/Surveys.ts:30-51` - Slug field definition with auto-generation
- **Recent Changes**: Seeding infrastructure overhaul (1c2bb0e2d) may have changed how surveys are seeded
- **Suspected Functions**:
  - `convertSurveys()` in surveys-converter.ts - doesn't add slug to output
  - `getSurvey()` - queries by slug that doesn't exist

## Related Issues & Context

### Historical Context

The surveys.json uses `id` field for internal reference tracking by the seeding engine, but this is NOT the same as the Payload `slug` field. This architectural disconnect appears to have existed since the seeding infrastructure was refactored.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The surveys seed data (`surveys.json`) doesn't include a `slug` field, causing Payload to auto-generate a slug from the title that doesn't match the hardcoded query value in the assessment page.

**Detailed Explanation**:

1. **Seed Data Structure**: `surveys.json` has `"id": "self-assessment"` which is used by the seeding engine for reference resolution (e.g., `{ref:surveys:self-assessment}`). This is NOT the Payload `slug` field.

2. **Payload Collection Behavior**: When a record is created without a `slug`, the Surveys collection's `beforeValidate` hook auto-generates one from the title by:
   - Converting to lowercase
   - Removing non-word/non-space characters (including hyphens!)
   - Replacing spaces with hyphens

3. **Slug Mismatch**:
   - Title "High-Stakes Presentations Self-Assessment" becomes slug "highstakes-presentations-selfassessment"
   - Assessment page queries for `slug="self-assessment"`
   - No match found, survey returns empty

4. **surveys-converter.ts Gap**: The converter creates survey JSON with `id` field but doesn't add a `slug` field, unlike other converters (e.g., downloads-converter adds proper `slug` fields).

**Supporting Evidence**:
- `surveys.json` has no `slug` field (confirmed via grep)
- `downloads.json` DOES have `slug` fields (confirmed via grep)
- Assessment page hardcodes query for `"self-assessment"`
- Surveys collection auto-generates slug from title

### How This Causes the Observed Behavior

1. User navigates to `/home/assessment`
2. Page calls `getSurvey("self-assessment")`
3. API queries Payload: `surveys?where[slug][equals]=self-assessment`
4. Payload searches for survey with `slug="self-assessment"`
5. No survey found (actual slug is "highstakes-presentations-selfassessment")
6. `surveyData.docs` is empty
7. Page renders "Survey Not Found" UI

### Confidence Level

**Confidence**: High

**Reasoning**:
- Clear code path traced from seed data → Payload storage → query → UI
- Confirmed surveys.json lacks slug field while other collections (downloads) include it
- Auto-generation logic produces predictable, mismatched slug
- Same pattern affects both assessment pages (page.tsx and survey/page.tsx)

## Fix Approach (High-Level)

Two complementary fixes needed:

1. **Add `slug` field to surveys.json**: Update the seed data to include explicit `slug` values:
   ```json
   {
     "id": "self-assessment",
     "slug": "self-assessment",
     "title": "High-Stakes Presentations Self-Assessment",
     ...
   }
   ```

2. **Update surveys-converter.ts**: Modify the converter to include `slug` field in generated JSON (using the surveyId as the slug value), similar to how other converters handle it.

Alternative (less recommended): Change the assessment page to query by a different identifier, but using slug is the standard Payload pattern.

## Diagnosis Determination

The root cause is definitively identified: missing `slug` field in survey seed data causes auto-generation of a mismatched slug that the assessment page cannot query.

## Additional Context

- The `id` field in surveys.json serves a different purpose (seeding engine reference tracking) than the Payload `slug` field
- Other collections like `downloads` properly include both `id` and `slug` fields
- This is likely a gap in the surveys-converter.ts that was missed during the seeding infrastructure refactoring

---
*Generated by Claude Debug Assistant*
*Tools Used: Glob, Grep, Read, Bash (git log)*
