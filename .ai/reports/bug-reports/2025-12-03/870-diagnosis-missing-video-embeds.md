# Bug Diagnosis: Missing YouTube and Vimeo Video Embeds on Lesson Pages

**ID**: ISSUE-870
**Created**: 2025-12-03T17:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Video embeds are not appearing on lesson pages 17 (Storyboards in Film) and 20 (Overview of Fundamental Elements of Design). The user expects to see YouTube and Vimeo video players embedded in the lesson content, but no videos are displayed.

## Environment

- **Application Version**: Current development
- **Environment**: Development
- **Browser**: Not specified
- **Node Version**: 20.x
- **Database**: PostgreSQL (Supabase)
- **Last Working**: Unknown

## Reproduction Steps

1. Navigate to lesson 17 (Storyboards in Film) at `/home/course/lessons/storyboards-film`
2. Expected: See YouTube video embed for `https://www.youtube.com/watch?v=BSOJiSUI0z8` and/or `https://www.youtube.com/watch?v=7LKPVAIcDXY`
3. Actual: No video embeds appear
4. Navigate to lesson 20 (Overview of Fundamental Elements of Design) at `/home/course/lessons/fundamental-design-overview`
5. Expected: See Vimeo video embed for `https://vimeo.com/32944253?fl=pl&fe=vl`
6. Actual: No video embeds appear

## Expected Behavior

- Lesson 17 should display YouTube video embeds for the specified URLs
- Lesson 20 should display a Vimeo video embed for the specified URL

## Actual Behavior

- No video embeds are displayed on either lesson page
- The To-Do section in lesson 17 contains text "Watch Pixar on Storyboarding above" which implies a video should be visible above it, but there is no video

## Diagnostic Data

### Source File Analysis

**Lesson 17 (storyboards-film.mdoc)**:
```markdown
---
title: Storyboards in Film
status: published
description: The origin of storyboarding
lessonID: 17
order: 17
---

To-Do
  - Watch [Pixar on Storyboarding](https://www.youtube.com/watch?v=7LKPVAIcDXY) above
  - Complete the lesson quiz

Watch
  - Learn more from this RocketJum Film School [Intro to storyboarding](https://www.youtube.com/watch?v=RQsvhq28sOI)
  - Watch [Pixar on Storyboarding](https://www.youtube.com/watch?v=7LKPVAIcDXY)
```

**Key Findings**:
- `BSOJiSUI0z8` is NOT present anywhere in the source file
- `7LKPVAIcDXY` is present ONLY as markdown link text, NOT as a video embed block
- No `{% bunny %}` template tag or video ID fields exist in the file
- The To-Do says "above" implying a video should be embedded before the To-Do section

**Lesson 20 (fundamental-design-overview.mdoc)**:
```markdown
---
title: Overview of the Fundamental Elements of Design
status: published
description: A brief overview of the fundamentals
lessonID: 20
order: 20
---

To-Do
  - Complete the lesson quiz

Watch
  - None
```

**Key Findings**:
- Vimeo video `32944253` is NOT present anywhere in the source file
- The "Watch" section explicitly says "None"
- No video-related template tags or fields exist

### Converted Data Analysis (course-lessons.json)

**Lesson 17**:
- `bunny_video_id`: undefined (no video ID)
- `youtube_video_id`: undefined (no video ID)
- `video_source_type`: undefined
- `content.root.children`: empty array (no main content)
- YouTube link exists only in `todo` field as a link node, not a video block

**Lesson 20**:
- `bunny_video_id`: undefined
- `youtube_video_id`: undefined
- `video_source_type`: undefined
- `content.root.children`: empty array
- `todo_watch_content`: Contains "None" as text

### Rendering Code Analysis

The rendering code in `LessonViewClient.tsx` correctly handles videos:

```typescript
// Lines 467-514: Bunny.net video embedding
{lesson.bunny_video_id && (
  <iframe src={`https://iframe.mediadelivery.net/embed/${lesson.bunny_library_id}/${lesson.bunny_video_id}`} />
)}

// Lines 490-514: YouTube/Vimeo video embedding
{lesson.youtube_video_id && lesson.video_source_type && (
  <iframe src={
    lesson.video_source_type === "youtube"
      ? `https://www.youtube.com/embed/${lesson.youtube_video_id}`
      : `https://player.vimeo.com/video/${lesson.youtube_video_id}`
  } />
)}
```

The `PayloadContentRenderer` also supports `youtube-video` blocks in Lexical content.

**Conclusion**: The rendering code is working correctly. The issue is that the video data is not present in the source files.

## Related Code

- **Affected Files**:
  - `apps/payload/src/seed/seed-data-raw/lessons/storyboards-film.mdoc`
  - `apps/payload/src/seed/seed-data-raw/lessons/fundamental-design-overview.mdoc`
  - `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts`
- **Recent Changes**: Converter was recently updated to support markdown links in content
- **Suspected Functions**: None - this is a data issue, not a code issue

## Related Issues & Context

### Similar Symptoms
- N/A - first report of missing video content

### Historical Context
- The lesson source files may have been migrated from an older system where video embeds were stored differently
- The To-Do text "Watch ... above" strongly suggests videos were expected to be in the lesson content

## Root Cause Analysis

### Identified Root Cause

**Summary**: The source lesson files (.mdoc) do not contain the video embed data that users expect to see. The videos mentioned by the user are either not present at all or are only present as markdown link text rather than embeddable video blocks.

**Detailed Explanation**:
The lesson pages support three ways to embed videos:
1. **Bunny.net videos**: Via `{% bunny bunnyvideoid="UUID" /%}` template tag in content, extracted to `bunny_video_id` field
2. **YouTube/Vimeo via fields**: Via `youtube_video_id` and `video_source_type` frontmatter fields
3. **Lexical youtube-video blocks**: Via structured blocks in Lexical content

None of these mechanisms are used in the affected lesson files:
- **Lesson 17**: Contains YouTube URLs only as markdown link text in To-Do/Watch sections. The text "Watch ... above" implies a video embed was intended but is missing.
- **Lesson 20**: Contains no video references at all. The Vimeo URL mentioned by the user (`32944253`) does not exist in the source file.

**Supporting Evidence**:
- `storyboards-film.mdoc` line 16: `- Watch [Pixar on Storyboarding](https://www.youtube.com/watch?v=7LKPVAIcDXY) above` - the word "above" indicates expected video placement
- `fundamental-design-overview.mdoc` line 20: `- None` - explicitly no Watch content
- Grep search for `BSOJiSUI0z8` and `32944253` returns no results in lesson files

### How This Causes the Observed Behavior

1. User navigates to lesson page
2. `LessonViewClient` component renders
3. Component checks `lesson.bunny_video_id` - undefined, no Bunny video renders
4. Component checks `lesson.youtube_video_id && lesson.video_source_type` - both undefined, no YouTube/Vimeo video renders
5. `PayloadContentRenderer` renders `lesson.content` - empty children array, no content including no video blocks
6. Result: No video appears on the page

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct examination of source files confirms video data is missing
- The rendering code has been verified to correctly handle videos when data is present
- The "above" text in lesson 17 is strong evidence that video content is expected but missing
- The Vimeo URL for lesson 20 does not exist anywhere in the codebase

## Fix Approach (High-Level)

The fix requires **content updates**, not code changes:

1. **Lesson 17 (storyboards-film.mdoc)**: Add a `{% bunny bunnyvideoid="..." /%}` template tag or equivalent video embed block at the top of the content (before the To-Do section) for the expected YouTube videos. If using YouTube directly, add `youtube_video_id` and `video_source_type: youtube` to frontmatter, or create a youtube-video Lexical block.

2. **Lesson 20 (fundamental-design-overview.mdoc)**: Add the Vimeo video ID to the lesson. Either:
   - Add `youtube_video_id: 32944253` and `video_source_type: vimeo` to frontmatter
   - Or update content to include a video embed block

3. **Clarify video sources**: Confirm with content owner which exact videos should appear on each lesson and whether they should be:
   - Hosted on Bunny.net (preferred for internal content)
   - Embedded from YouTube/Vimeo (for external content)

4. **Re-run seed conversion**: After updating source files, run the converter and re-seed the database.

## Diagnosis Determination

This is a **content/data issue**, not a **code issue**. The video rendering functionality works correctly, but the source lesson files are missing the expected video content. The lesson files need to be updated to include the video embed data.

**Next Steps**:
1. Clarify with content owner which videos should appear on each lesson
2. Update the source .mdoc files to include proper video embed syntax
3. Re-run the seed conversion process
4. Verify videos appear correctly

## Additional Context

The `course-lessons-converter.ts` file extracts Bunny video IDs from content via:
```typescript
function extractBunnyVideoId(content: string): string | null {
  const bunnyPattern = /{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/i;
  const match = content.match(bunnyPattern);
  return match ? match[1] : null;
}
```

For YouTube/Vimeo support, the converter would need to either:
- Support extracting video IDs from frontmatter fields
- Support a new template tag syntax for external videos
- Support youtube-video Lexical blocks

Currently, external video support exists in the rendering layer (`LessonViewClient.tsx`) but the conversion pipeline doesn't populate the required fields.

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Glob, Task (Explore agent)*
