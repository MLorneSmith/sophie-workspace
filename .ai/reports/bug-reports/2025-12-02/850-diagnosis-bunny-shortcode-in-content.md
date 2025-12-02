# Bug Diagnosis: Bunny Video Shortcode Appearing in Lesson Content

**ID**: ISSUE-850
**Created**: 2025-12-02T15:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Lesson pages with Bunny videos correctly display the video player (using the `bunny_video_id` field), but the raw `{% bunny bunnyvideoid="..." /%}` shortcode text also appears in the lesson content area below the video. The shortcode should be stripped from the content after the video ID is extracted.

## Environment

- **Application Version**: dev branch
- **Environment**: development
- **Node Version**: 22.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown (may have always been present)

## Reproduction Steps

1. Navigate to `/home/course/lessons/lesson-0` (Welcome to DDM lesson)
2. Observe the Bunny.net video player displays correctly at the top
3. Observe the content area below the video shows the raw text: `{% bunny bunnyvideoid="2620df68-c2a8-4255-986e-24c1d4c1dbf2" /%}`

## Expected Behavior

The Bunny video shortcode should be removed from the lesson content after the video ID is extracted. Only the video player should be visible, with no raw shortcode text in the content area.

## Actual Behavior

The raw `{% bunny bunnyvideoid="..." /%}` text appears as a paragraph in the lesson content, displayed below the video player. This affects all 19+ lessons that have Bunny video embeds.

## Diagnostic Data

### Seed Data Analysis

The generated seed data in `apps/payload/src/seed/seed-data/course-lessons.json` shows:
- **Correct**: `bunny_video_id` field is properly populated (line 35)
- **Incorrect**: Content contains raw shortcode text (line 22)

```json
{
  "_ref": "lesson-0",
  "content": {
    "root": {
      "children": [
        {
          "type": "paragraph",
          "version": 1,
          "children": [
            {
              "type": "text",
              "text": "{% bunny bunnyvideoid=\"2620df68-c2a8-4255-986e-24c1d4c1dbf2\" /%}"
            }
          ]
        }
      ]
    }
  },
  "bunny_video_id": "2620df68-c2a8-4255-986e-24c1d4c1dbf2"
}
```

### Affected Lessons Count

19 lessons have this issue (grep found 19 occurrences of `bunnyvideoid` in `course-lessons.json`).

## Error Stack Traces

N/A - No runtime errors, this is a data processing bug.

## Related Code

- **Affected Files**:
  - `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts` (primary)
  - `apps/payload/src/seed/seed-data/course-lessons.json` (generated output)
  - `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx` (renders content)
- **Recent Changes**: N/A
- **Suspected Functions**: `convertToSimpleLexical()` at line 293-367

## Related Issues & Context

### Similar Issues (Same Component)
- #506 (CLOSED): "Course Lessons Converter: Missing Field Mappings Causing Incomplete Seed Data"
- #531 (CLOSED): "Payload Lexical Editor - Invalid Block Type 'video' in Posts Content"
- #551 (CLOSED): "Fix Payload CMS Lexical block validation: Incorrect block node structure causing seeding failures"

### Historical Context

The course-lessons-converter has been updated multiple times to handle various shortcode formats. This bug appears to have been present since the converter was created or updated.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `convertToSimpleLexical()` function uses a regex that doesn't match the self-closing Markdoc shortcode syntax (`/%}`), causing bunny video tags to fall through to regular paragraph handling.

**Detailed Explanation**:

The converter has two separate operations for bunny video shortcodes:

1. **Line 125**: `extractBunnyVideoId(markdownContent)` - Uses regex `/{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/i` which **correctly** matches `/%}` and extracts the video ID.

2. **Line 128**: `convertToSimpleLexical(markdownContent)` - Uses regex `/{% bunny\s+([^%]+)\s+%}/` (line 328) which expects `%}` but the actual format is `/%}`.

**Code comparison:**

```typescript
// CORRECT regex (in extractBunnyVideoId, line 461):
/{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/i  // matches /%}

// INCORRECT regex (in convertToSimpleLexical, line 328):
/{% bunny\s+([^%]+)\s+%}/  // expects %}, not /%}
```

When the regex at line 328 fails to match, the condition at line 329 (`if (videoMatch)`) is false, so no return happens. The code falls through to lines 350-355 where it becomes a regular paragraph with the raw shortcode text.

**Supporting Evidence**:

1. `mdoc-parser-simple.ts:293-294` uses the correct regex: `/^{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}$/`
2. `extractBunnyVideoId()` at line 459-463 uses the correct regex: `/{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/i`
3. Only `convertToSimpleLexical()` has the incorrect regex

### How This Causes the Observed Behavior

1. User loads lesson page (e.g., `/home/course/lessons/lesson-0`)
2. Video player renders correctly using `lesson.bunny_video_id` (extracted correctly)
3. Content renderer (`PayloadContentRenderer`) renders the `content` field
4. Content contains a paragraph node with raw text `{% bunny bunnyvideoid="..." /%}`
5. User sees the raw shortcode displayed as text

### Confidence Level

**Confidence**: High

**Reasoning**:
- The regex difference between working extraction and failing conversion is clear
- The seed data output confirms the shortcode remains in content
- The correct regex pattern exists in two other places in the codebase

## Fix Approach (High-Level)

Two possible approaches:

**Option A (Recommended)**: Fix the regex in `convertToSimpleLexical()` to match the self-closing syntax:
- Change line 328 from `/{% bunny\s+([^%]+)\s+%}/` to `/{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/`
- Return a proper block structure (or skip the line entirely since video is handled separately)

**Option B**: Strip bunny shortcodes from content before calling `convertToSimpleLexical()`:
- Add a line before line 128 to remove the shortcode: `const cleanedContent = markdownContent.replace(/{%\s*bunny\s+bunnyvideoid="[^"]+"\s*\/%}/gi, '')`

After fixing, regenerate seed data and re-seed the database.

## Diagnosis Determination

The root cause is a regex mismatch in the `convertToSimpleLexical()` function. The function attempts to detect bunny video shortcodes but uses a regex expecting `%}` instead of the actual `/%}` closing syntax. This causes the detection to fail and the raw shortcode to be included as paragraph text.

The fix is straightforward: either correct the regex or strip the shortcodes before conversion since the video ID is already extracted separately.

## Additional Context

- The `mdoc-parser-simple.ts` parser correctly handles this syntax, showing the intended behavior
- This affects all 19 lessons with Bunny video embeds
- The video playback itself is not affected, only the visual appearance of raw shortcode text

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Task (Explore agent), Bash (gh issue list)*
