# Video Source Implementation Plan

## Overview

This document outlines the plan for enhancing the video support in our course lessons to handle multiple video platforms, specifically extending the existing YouTube video support to include Vimeo videos as well. 

## Current State

Currently, the course lesson collection (`apps/payload/src/collections/CourseLessons.ts`) includes the following video-related fields:

- `bunny_video_id`: For specifying a Bunny.net video ID
- `bunny_library_id`: For specifying the Bunny.net library ID
- `youtube_video_id`: Recently added field for YouTube videos

A migration file (`apps/payload/src/migrations/20250415_190000_add_youtube_video_id.ts`) was previously created to add the `youtube_video_id` column to the database schema.

## Problem Statement

We need to expand our video support to include Vimeo videos alongside YouTube videos. This requires:

1. A way to specify the video source (YouTube or Vimeo)
2. A field to store the video ID for either platform
3. An appropriate database schema update

## Solution Approach

We will implement a more flexible, scalable solution that can accommodate multiple video platforms:

1. Add a new `video_source_type` field (Select type) to indicate the source (YouTube/Vimeo)
2. Update the existing `youtube_video_id` field (keeping the name for backward compatibility) to be used for both YouTube and Vimeo video IDs
3. Create a new, comprehensive migration that handles all the necessary schema changes

This approach offers several advantages:

- **Scalability**: Can be easily extended to support additional video platforms in the future
- **Backward Compatibility**: Existing YouTube videos continue to work without requiring content migration
- **Simplicity**: Single field for video IDs with a source type indicator is more maintainable than separate fields for each platform

## Implementation Plan

### 1. Update Payload Collection Definition

Modify `apps/payload/src/collections/CourseLessons.ts` to:

1. Add a new `video_source_type` field (Select type) with YouTube and Vimeo options
2. Update the label and description of `youtube_video_id` to indicate it's now used for both YouTube and Vimeo

```typescript
{
  name: 'video_source_type',
  type: 'select',
  label: 'External Video Source',
  defaultValue: 'youtube', // For backward compatibility
  admin: {
    description: 'Source platform for the external video',
    isClearable: true,
  },
  options: [
    {
      label: 'YouTube',
      value: 'youtube',
    },
    {
      label: 'Vimeo',
      value: 'vimeo',
    }
  ],
},
{
  name: 'youtube_video_id', // Keeping name for backward compatibility
  type: 'text',
  label: 'External Video ID', // Updated label
  admin: {
    description: 'Video ID from YouTube or Vimeo (if this lesson includes an external video)', // Updated description
  },
},
```

### 2. Create a New Migration File

Create a new migration file `apps/payload/src/migrations/20250415_[timestamp]_add_video_support.ts` that:

1. Adds the `youtube_video_id` column (if it doesn't exist)
2. Adds the new `video_source_type` column with a default value of 'youtube' for backward compatibility

```typescript
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration to add video support with source type selection
 *
 * This migration addresses the following:
 * 1. Adding the external video ID field (for YouTube and Vimeo)
 * 2. Adding video source type selection field
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  console.log('Running migration to add video support to course_lessons table')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Add youtube_video_id column to course_lessons table if it doesn't exist
    await db.execute(sql`
      ALTER TABLE payload.course_lessons ADD COLUMN IF NOT EXISTS youtube_video_id TEXT DEFAULT NULL;
    `)

    // Add video_source_type column to course_lessons table with default 'youtube'
    await db.execute(sql`
      ALTER TABLE payload.course_lessons ADD COLUMN IF NOT EXISTS video_source_type TEXT DEFAULT 'youtube';
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully added video support columns to course_lessons table')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error adding video support columns to course_lessons table:', error)
    throw error
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  console.log('Rolling back video support columns addition')

  try {
    // Start transaction for atomicity
    await db.execute(sql`BEGIN;`)

    // Remove video_source_type column from course_lessons table
    await db.execute(sql`
      ALTER TABLE payload.course_lessons DROP COLUMN IF EXISTS video_source_type;
    `)

    // Remove youtube_video_id column from course_lessons table
    await db.execute(sql`
      ALTER TABLE payload.course_lessons DROP COLUMN IF EXISTS youtube_video_id;
    `)

    // Commit transaction
    await db.execute(sql`COMMIT;`)
    console.log('Successfully removed video support columns from course_lessons table')
  } catch (error) {
    // Rollback on error
    await db.execute(sql`ROLLBACK;`)
    console.error('Error removing video support columns from course_lessons table:', error)
    throw error
  }
}
```

### 3. Remove the Existing Migration File

Remove `apps/payload/src/migrations/20250415_190000_add_youtube_video_id.ts` to avoid redundancy and potential conflicts.

### 4. Frontend Considerations

Any frontend components that display videos from course lessons should be updated to:

1. Check the `video_source_type` field to determine the appropriate player to use
2. Use either a YouTube or Vimeo embed based on the source type

For example, a simplified React component might look like:

```tsx
const VideoPlayer = ({ lesson }) => {
  const { youtube_video_id, video_source_type } = lesson;
  
  if (!youtube_video_id) return null;
  
  if (video_source_type === 'vimeo') {
    return <VimeoEmbed videoId={youtube_video_id} />;
  }
  
  // Default to YouTube
  return <YouTubeEmbed videoId={youtube_video_id} />;
};
```

## Migration and Testing Considerations

1. **Database Migration**: The new migration should be compatible with our content migration system.

2. **Existing Content**: By setting a default value of 'youtube' for `video_source_type`, we ensure existing content continues to work without modification.

3. **Testing Plan**:
   - Verify existing YouTube videos still work correctly with the updated schema
   - Test adding new videos with both YouTube and Vimeo sources
   - Ensure the correct player is used based on the video source type

## Implementation Files

1. **Modify**: `apps/payload/src/collections/CourseLessons.ts`
2. **Create**: `apps/payload/src/migrations/20250415_[timestamp]_add_video_support.ts`
3. **Remove**: `apps/payload/src/migrations/20250415_190000_add_youtube_video_id.ts`

## Future Considerations

This implementation provides a foundation that can be extended for additional video platforms in the future by:

1. Adding new options to the `video_source_type` select field
2. Updating any frontend components to handle the new video source types
3. No database schema changes would be needed for adding more platforms
