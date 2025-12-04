# Bug Diagnosis: Missing Download Documents in Lesson Pages

**ID**: ISSUE-pending
**Created**: 2025-12-03T16:45:00.000Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Three lesson pages are missing downloadable documents that are referenced in their To-Do sections. The issue stems from two separate problems in the seed data pipeline: (1) downloads.json is missing entries for "Audience Map" and "SlideHeroes PowerPoint template" documents, and (2) the LESSON_DOWNLOADS_MAPPING doesn't include these additional downloads for the affected lessons.

## Environment

- **Application Version**: development
- **Environment**: development
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown (ongoing issue)

## Reproduction Steps

1. Navigate to lesson 11 (The Who) page
2. Observe the To-Do section mentions "Download and complete Audience Map template"
3. Note that no Audience Map download is available for download
4. Repeat for lesson 23 (Slide Composition) - missing "SlideHeroes PowerPoint presentation template"
5. Repeat for lesson 29 (Performance) - missing "Golden Rules" reference

## Expected Behavior

Each lesson page should display downloadable documents that match what's referenced in the lesson's To-Do section:
- Lesson 11: Audience Map template download
- Lesson 23: SlideHeroes PowerPoint presentation template download
- Lesson 29: Golden Rules PDF download (in addition to Performance slides)

## Actual Behavior

The affected lessons only show their respective lesson slides PDFs as downloads:
- Lesson 11: Only shows "the-who-slides" (202 The Who.pdf)
- Lesson 23: Only shows "slide-composition-slides" (505 Slide Composition.pdf)
- Lesson 29: Only shows "performance-slides" (702 Performance.pdf)

## Diagnostic Data

### Source Files Examined

1. **Raw lesson files** (`apps/payload/src/seed/seed-data-raw/lessons/`):
   - `the-who.mdoc` - References "Download and complete Audience Map template"
   - `slide-composition.mdoc` - References "Grab a copy of the SlideHeroes PowerPoint presentation template"
   - `performance.mdoc` - Does not directly reference Golden Rules (clarification needed)

2. **Downloads data** (`apps/payload/src/seed/seed-data/downloads.json`):
   - Contains 20 download entries
   - Missing: "Audience Map" entry
   - Missing: "SlideHeroes PowerPoint template" entry
   - Has `swipe-file` with filename "SlideHeroes Golden Rules.pdf" but only mapped to `tools-and-resources` lesson

3. **Seed assets** (`apps/payload/src/seed/seed-assets/downloads/`):
   - `Audience Map.pdf` EXISTS (169k)
   - `SlideHeroes Golden Rules.pdf` EXISTS (326k)
   - No PowerPoint template file found

4. **Download mappings** (`apps/payload/src/seed/seed-data-raw/mappings/download-mappings.js`):
   - `DOWNLOAD_ID_MAP` missing entries for: `audience-map`
   - `LESSON_DOWNLOADS_MAPPING` for affected lessons:
     - `the-who`: `['the-who-slides']` - missing `audience-map`
     - `slide-composition`: `['slide-composition-slides']` - missing template
     - `performance`: `['performance-slides']` - may need `swipe-file` (Golden Rules)

### Generated Lesson Data

```json
// the-who lesson (lesson_number: 11)
{
  "_ref": "the-who",
  "downloads": ["{ref:downloads:the-who-slides}"],
  "todo": {
    // Contains: "Download and complete Audience Map template"
  }
}

// slide-composition lesson (lesson_number: 23)
{
  "_ref": "slide-composition",
  "downloads": ["{ref:downloads:slide-composition-slides}"],
  "todo": {
    // Contains: "Grab a copy of the SlideHeroes PowerPoint presentation template"
  }
}

// performance lesson (lesson_number: 29)
{
  "_ref": "performance",
  "downloads": ["{ref:downloads:performance-slides}"],
  "todo": {
    // Contains: "Record video of yourself presenting and watch it"
  }
}
```

## Error Stack Traces

N/A - This is a data completeness issue, not a runtime error.

## Related Code

- **Affected Files**:
  - `apps/payload/src/seed/seed-data/downloads.json` - Missing download entries
  - `apps/payload/src/seed/seed-data-raw/mappings/download-mappings.js` - Incomplete mappings
  - `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts:177-186` - Uses LESSON_DOWNLOADS_MAPPING
  - `apps/payload/src/seed/seed-conversion/fix-downloads-urls.ts:74-77` - Has mapping for "Audience Map" but not applied

- **Suspected Functions**:
  - The downloads.json file appears to be manually created/maintained rather than auto-generated
  - `LESSON_DOWNLOADS_MAPPING` in download-mappings.js is incomplete

## Related Issues & Context

### Similar Symptoms

No direct predecessors found in issue history for this specific problem.

### Same Component

Seed data conversion has been actively worked on recently with several related issues.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The downloads.json seed data file is missing entries for "Audience Map" and the lesson-downloads mapping does not link additional resources to their respective lessons.

**Detailed Explanation**:

The seed data pipeline has two gaps:

1. **downloads.json is incomplete**:
   - The file `apps/payload/src/seed/seed-data/downloads.json` contains 20 download entries but is missing:
     - An entry for "Audience Map" (the PDF file EXISTS at `seed-assets/downloads/Audience Map.pdf`)
     - An entry for "SlideHeroes PowerPoint template" (file may not exist - needs verification)

2. **LESSON_DOWNLOADS_MAPPING is incomplete**:
   - In `download-mappings.js`, the mapping only links each lesson to its respective slides PDF
   - It does NOT include additional supplementary downloads mentioned in lesson To-Do sections
   - For example, `the-who: ['the-who-slides']` should be `the-who: ['the-who-slides', 'audience-map']`

3. **Mismatch between fix-downloads-urls.ts and downloads.json**:
   - `fix-downloads-urls.ts` has a `titleToFilename` mapping that includes "Audience Map" and "SlideHeroes Golden Rules"
   - But these entries don't exist in downloads.json, so the fix script has no records to update

**Evidence**:
- `Audience Map.pdf` exists in seed-assets but no corresponding entry in downloads.json
- Course lesson converter at line 177-186 uses `LESSON_DOWNLOADS_MAPPING` which lacks the additional downloads
- The lesson's `todo` field contains text referencing downloads that aren't in the `downloads` array

### How This Causes the Observed Behavior

1. User visits lesson page (e.g., The Who)
2. Frontend renders downloads from `lesson.downloads` array
3. Array only contains `{ref:downloads:the-who-slides}`
4. Frontend shows only "The Who Slides" PDF
5. User sees To-Do mentioning "Audience Map template" but cannot download it

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct examination of downloads.json confirms missing entries
- Direct examination of LESSON_DOWNLOADS_MAPPING confirms incomplete mappings
- Physical PDF files exist in seed-assets directory proving intent to include them
- The fix-downloads-urls.ts script has mappings for these files, indicating they were intended

## Fix Approach (High-Level)

1. **Add missing entries to downloads.json**:
   - Add "audience-map" entry with URL pointing to `Audience Map.pdf`
   - Determine if PowerPoint template file exists; if so, add entry

2. **Update LESSON_DOWNLOADS_MAPPING in download-mappings.js**:
   - `the-who`: Add `'audience-map'` to the array
   - `slide-composition`: Add template reference if file exists
   - `performance`: Consider adding `'swipe-file'` (Golden Rules) if appropriate

3. **Add DOWNLOAD_ID_MAP entries**:
   - Add UUID for `'audience-map'`
   - Add UUID for any other new downloads

4. **Re-run seed conversion** to regenerate course-lessons.json with updated download references

## Diagnosis Determination

The root cause has been definitively identified. The downloads.json seed data file is missing entries for documents that are:
1. Referenced in lesson To-Do content
2. Physically present in the seed-assets/downloads directory
3. Already mapped in fix-downloads-urls.ts (indicating prior intent to include them)

The fix requires updating:
1. `downloads.json` - Add missing download entries
2. `download-mappings.js` - Update DOWNLOAD_ID_MAP and LESSON_DOWNLOADS_MAPPING
3. Re-run seed conversion to update course-lessons.json

## Additional Context

- The "SlideHeroes PowerPoint template" reference in lesson 23 may need clarification - no .pptx file was found in seed-assets
- The Golden Rules PDF exists as `swipe-file` download with filename "SlideHeroes Golden Rules.pdf", currently only mapped to `tools-and-resources` lesson
- Consider whether Golden Rules should also be linked to the Performance lesson (lesson 29)

---
*Generated by Claude Debug Assistant*
*Tools Used: Glob, Grep, Read, Bash*
