# Bug Fix: Missing YouTube and Vimeo Video Embeds on Lesson Pages 17 and 20

**Related Diagnosis**: #870
**Severity**: medium
**Bug Type**: bug
**Risk Level**: low
**Complexity**: simple

## Quick Reference

- **Root Cause**: Converter doesn't output `youtube_video_id` and `video_source_type` fields; .mdoc files lack video frontmatter
- **Fix Approach**: Update converter to output YouTube/Vimeo fields, add frontmatter to .mdoc files, re-seed database
- **Estimated Effort**: small
- **Breaking Changes**: no

## Solution Design

### Problem Recap

Video embeds are expected on two lesson pages but don't render:

1. **Lesson 17 (Storyboards in Film)**: Should show YouTube video for Pixar storyboarding content
2. **Lesson 20 (Overview of Fundamental Elements of Design)**: Should show Vimeo video embed

The infrastructure for YouTube/Vimeo embeds already exists:
- **Payload collection** has `youtube_video_id` and `video_source_type` fields (CourseLessons.ts:48-73)
- **Front-end** renders these videos correctly (LessonViewClient.tsx:490-514)
- **BUT the converter** doesn't output these fields to the seed data

For full details, see diagnosis issue #870.

### Solution Approaches Considered

#### Option 1: Add YouTube/Vimeo Support to Converter ⭐ RECOMMENDED

**Description**: Update the converter to extract `videoID` and `videoPlatform` from frontmatter and output them as `youtube_video_id` and `video_source_type` fields in the seed data. Then add the appropriate frontmatter to the .mdoc files.

**Pros**:
- Uses existing infrastructure (Payload fields and front-end rendering already work)
- No new dependencies - just connecting existing pieces
- Videos stream directly from YouTube/Vimeo (no hosting costs)
- Follows the pattern already established in the codebase
- Minimal code changes (add 2 fields to interface + 2 assignments)

**Cons**:
- Requires small code change to converter (not just content)

**Risk Assessment**: low - Small, well-defined code change to add field mapping

**Complexity**: simple - Add 2 fields to interface, 2 assignments in converter

#### Option 2: Use YouTube Shortcode in Content

**Description**: Use the existing `{% youtube src="videoId" /%}` shortcode format within the lesson content body.

**Pros**:
- Parser already supports this format
- No code changes needed

**Cons**:
- Creates a Lexical block embedded in content, not a prominent top-level video
- Different UX from the expected prominent video at top of lesson
- Doesn't use the dedicated `youtube_video_id` field designed for this purpose
- Would need to add Vimeo shortcode support (doesn't exist yet)

**Why Not Chosen**: The application has dedicated fields for lesson videos that render prominently at the top of the lesson. Using inline shortcodes would create a different, inferior user experience.

#### Option 3: Convert YouTube/Vimeo to Bunny.net

**Description**: Upload the videos to Bunny.net CDN and use the existing Bunny embed flow.

**Why Not Chosen**: User confirmed videos should remain on YouTube/Vimeo. No need to re-host content that's already available on those platforms.

### Selected Solution: Add YouTube/Vimeo Support to Converter

**Justification**: The application already has complete infrastructure for YouTube/Vimeo video embeds - the Payload collection has the fields, and the front-end has the rendering code. The only missing piece is the converter mapping. This is a minimal, surgical change that connects existing functionality.

**Technical Approach**:

1. Add `youtube_video_id` and `video_source_type` to the `CourseLessonJson` interface
2. Extract `videoID` and `videoPlatform` from frontmatter (already read, just not output)
3. Output these values to the seed JSON
4. Add frontmatter to .mdoc files with the video information
5. Re-seed database

**Architecture Changes**: None. Just wiring up existing fields.

## Implementation Plan

### Affected Files

List files that need modification:
- `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts` - Add youtube_video_id and video_source_type to interface and output
- `apps/payload/src/seed/seed-data-raw/lessons/storyboards-film.mdoc` - Add videoID and videoPlatform frontmatter
- `apps/payload/src/seed/seed-data-raw/lessons/fundamental-design-overview.mdoc` - Add videoID and videoPlatform frontmatter

### New Files

No new files needed.

### Step-by-Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

#### Step 1: Update Converter Interface

Add YouTube/Vimeo fields to the `CourseLessonJson` interface in `course-lessons-converter.ts`:

```typescript
interface CourseLessonJson {
  // ... existing fields ...
  bunny_video_id?: string;
  youtube_video_id?: string;      // ADD THIS
  video_source_type?: string;     // ADD THIS
  // ... rest of fields ...
}
```

**Why this step first**: The interface defines the shape of output data. Must be updated before we can add the field assignments.

#### Step 2: Add Field Assignments in Converter

After the `bunny_video_id` assignment (around line 166-168), add assignments for external videos:

```typescript
// Add bunny video ID if present (extracted from shortcode)
if (bunnyVideoId) {
  lesson.bunny_video_id = bunnyVideoId;
}

// ADD: External video support (YouTube/Vimeo)
if (lessonMeta.videoID) {
  lesson.youtube_video_id = lessonMeta.videoID;
  lesson.video_source_type = lessonMeta.videoPlatform || 'youtube';
}
```

**Note**: The converter already extracts `videoID` and `videoPlatform` from frontmatter into `lessonMeta` (lines 96-105), so this just outputs those values.

#### Step 3: Update storyboards-film.mdoc

Add video frontmatter to the file. Extract video ID from the YouTube URL:
- URL: `https://www.youtube.com/watch?v=7LKPVAIcDXY`
- Video ID: `7LKPVAIcDXY`

```yaml
---
title: Storyboards in Film
status: published
description: The origin of storyboarding
lessonID: 17
chapter: storytelling
lessonNumber: 402
image: /cms/images/storyboards-film/image.png
publishedAt: 2024-08-29
language: en
order: 17
videoID: 7LKPVAIcDXY
videoPlatform: youtube
---
```

#### Step 4: Update fundamental-design-overview.mdoc

Add video frontmatter to the file. Extract video ID from the Vimeo URL:
- URL: `https://vimeo.com/32944253`
- Video ID: `32944253`

```yaml
---
title: Overview of the Fundamental Elements of Design
status: published
description: A brief overview of the fundamentals
lessonID: 20
chapter: design
lessonNumber: 502
image: /cms/images/fundamental-design-overview/image.png
publishedAt: 2024-09-09
language: en
order: 20
videoID: 32944253
videoPlatform: vimeo
---
```

#### Step 5: Run Seed Conversion and Re-seed Database

After updating the converter and .mdoc files:

```bash
pnpm --filter web supabase:web:reset
```

This will:
1. Reset the local database
2. Run migrations
3. Execute seed conversion with updated converter
4. Populate `youtube_video_id` and `video_source_type` in lessons table

#### Step 6: Verify Videos Render Correctly

Test that videos now appear on the lesson pages:

- Navigate to Lesson 17 (Storyboards in Film)
- Verify YouTube video appears as an embedded player at the top of the lesson
- Navigate to Lesson 20 (Overview of Fundamental Elements of Design)
- Verify Vimeo video appears as an embedded player at the top of the lesson
- Check that videos play correctly without errors

#### Step 7: Run Validation

```bash
pnpm typecheck
pnpm lint
pnpm format
```

## Testing Strategy

### Manual Testing Checklist

Execute these manual tests before considering the fix complete:

- [ ] Converter typecheck passes after interface update
- [ ] Run `pnpm --filter web supabase:web:reset` successfully
- [ ] Verify Lesson 17 loads without errors
- [ ] Verify YouTube video (Pixar storyboarding) appears as embedded player on Lesson 17
- [ ] Verify video can be played in the embedded player
- [ ] Verify Lesson 20 loads without errors
- [ ] Verify Vimeo video (design fundamentals) appears as embedded player on Lesson 20
- [ ] Verify video can be played in the embedded player
- [ ] Check browser console for no new errors or warnings
- [ ] Verify other lessons still render correctly (regression check)

### Unit Tests

Consider adding a test case to `course-lessons-converter.test.ts`:
- Test that frontmatter with `videoID` and `videoPlatform` produces correct output fields

**Test files**: `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.test.ts`

## Risk Assessment

**Overall Risk Level**: low

**Potential Risks**:

1. **Invalid Video IDs**: If the extracted video IDs are incorrect
   - **Likelihood**: low (URLs provided in diagnosis are valid)
   - **Impact**: low (video just won't display)
   - **Mitigation**: Test video playback after seeding

2. **Converter Type Error**: If interface change causes type issues
   - **Likelihood**: low (adding optional fields)
   - **Impact**: low (caught by typecheck)
   - **Mitigation**: Run `pnpm typecheck` before seeding

**Rollback Plan**:

If this fix causes issues:
1. Revert converter changes: `git checkout apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts`
2. Revert .mdoc changes: `git checkout apps/payload/src/seed/seed-data-raw/lessons/*.mdoc`
3. Re-run database reset: `pnpm --filter web supabase:web:reset`

## Validation Commands

### Before Fix (Bug Should Reproduce)

```bash
# Start development server
pnpm dev

# Navigate to lesson 17 and 20 in the browser
# Observe: No video players visible
```

### After Fix (Bug Should Be Resolved)

```bash
# Type check after converter changes
pnpm typecheck

# Reset database with updated content
pnpm --filter web supabase:web:reset

# Lint and format
pnpm lint
pnpm format

# Start development server
pnpm dev

# Navigate to lesson 17 - YouTube video should be visible
# Navigate to lesson 20 - Vimeo video should be visible
```

## Dependencies

**No new dependencies required**

## Database Changes

**Migration needed**: no

The `youtube_video_id` and `video_source_type` columns already exist in the database (created by Payload collection schema). Only data changes needed via re-seeding.

## Success Criteria

The fix is complete when:
- [ ] Converter interface updated with youtube_video_id and video_source_type
- [ ] Converter outputs these fields when frontmatter contains videoID/videoPlatform
- [ ] storyboards-film.mdoc has videoID: 7LKPVAIcDXY, videoPlatform: youtube
- [ ] fundamental-design-overview.mdoc has videoID: 32944253, videoPlatform: vimeo
- [ ] `pnpm typecheck` passes
- [ ] Database successfully re-seeded
- [ ] Lesson 17 displays YouTube video embedded player
- [ ] Lesson 20 displays Vimeo video embedded player
- [ ] Both videos play without errors
- [ ] No console errors on either lesson page

## Notes

### Video IDs

Extracted from URLs in diagnosis:

| Lesson | Platform | URL | Video ID |
|--------|----------|-----|----------|
| 17 | YouTube | https://www.youtube.com/watch?v=7LKPVAIcDXY | 7LKPVAIcDXY |
| 20 | Vimeo | https://vimeo.com/32944253 | 32944253 |

### Existing Infrastructure

The front-end rendering code is already in place (LessonViewClient.tsx:490-514):
```tsx
{lesson.youtube_video_id && lesson.video_source_type && (
  <iframe
    src={
      lesson.video_source_type === "youtube"
        ? `https://www.youtube.com/embed/${lesson.youtube_video_id}`
        : `https://player.vimeo.com/video/${lesson.youtube_video_id}`
    }
    // ...
  />
)}
```

---
*Generated by Bug Fix Planning Assistant*
*Based on diagnosis: #870*
