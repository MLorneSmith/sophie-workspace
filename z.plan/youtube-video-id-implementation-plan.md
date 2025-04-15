# YouTube Video ID Implementation Plan

## Overview

This document outlines the plan for adding a YouTube video ID field to the course lesson collection in our Payload CMS setup. This addition will allow course lessons to have an associated YouTube video, similar to the existing Bunny.net video integration.

## Context

Currently, the course lesson collection (`apps/payload/src/collections/CourseLessons.ts`) includes fields for Bunny.net videos:

- `bunny_video_id`: For specifying a Bunny.net video ID
- `bunny_library_id`: For specifying the Bunny.net library ID

We need to add a similar field for YouTube videos to provide additional video hosting options for course content.

## Database Analysis

The database currently has the following relevant structure:

- Schema: `payload`
- Table: `course_lessons`
- Existing video-related columns: `bunny_video_id`, `bunny_library_id`

## Implementation Plan

### 1. Add Field to Payload Collection

Add a `youtube_video_id` field to the CourseLessons collection definition in `apps/payload/src/collections/CourseLessons.ts`. The field should be placed near the existing Bunny.net fields for consistent organization:

```typescript
{
  name: 'youtube_video_id',
  type: 'text',
  label: 'YouTube Video ID',
  admin: {
    description: 'Video ID from YouTube (if this lesson includes a YouTube video)',
  },
}
```

### 2. Create Database Migration File

Create a migration file to add the column to the database schema:

```typescript
// apps/payload/src/migrations/[next-number]-add-youtube-video-id.ts
import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.postgres.query(`
    ALTER TABLE payload.course_lessons 
    ADD COLUMN IF NOT EXISTS youtube_video_id TEXT DEFAULT NULL;
  `);
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.postgres.query(`
    ALTER TABLE payload.course_lessons 
    DROP COLUMN IF EXISTS youtube_video_id;
  `);
}
```

## Implementation Files

1. **Modify**: `apps/payload/src/collections/CourseLessons.ts`
2. **Create**: `apps/payload/src/migrations/[next-number]-add-youtube-video-id.ts`

## Notes

- The content migration system and population of this field will be addressed in a subsequent task
- The existing YouTube block functionality for rich text fields will continue to work as before
- This implementation focuses only on schema changes and doesn't affect existing content

## Future Considerations

- Update the content migration system to handle YouTube video IDs
- Consider UI changes in the course viewing interface to handle displaying YouTube videos
- Document usage guidelines for when to use Bunny.net vs. YouTube videos
