# External Video Fields Implementation Plan

## Overview

This document outlines the plan to implement support for YouTube and Vimeo videos in the course lessons collection as part of the content migration system. We need to populate the `video_source_type` and `youtube_video_id` fields in the database via our content migration system.

## Background

The course lessons collection in Payload CMS has fields for external videos (YouTube and Vimeo):

- `video_source_type`: Options for 'youtube' or 'vimeo'
- `youtube_video_id`: The ID of the external video

We need to populate these fields for two specific lessons:

1. "Storyboard in Film" - YouTube ID: BSOJiSUI0z8
2. "Overview of the Fundamental Elements of Design" - Vimeo ID: 32944253

## Current Implementation

The content migration system uses a YAML-based approach for lesson metadata:

1. Lesson metadata is stored in `packages/content-migrations/src/data/raw/lesson-metadata.yaml`
2. The YAML is processed by `yaml-generate-lessons-sql.ts` to generate SQL statements
3. The SQL statements populate the database tables

Currently, Bunny.net videos are configured in the YAML like this:

```yaml
bunnyVideo:
  id: 2620df68-c2a8-4255-986e-24c1d4c1dbf2
  library: 264486
```

## Implementation Plan

### 1. Update Lesson Metadata YAML

We'll modify the `packages/content-migrations/src/data/raw/lesson-metadata.yaml` file to add a new structure for external videos:

```yaml
externalVideo:
  source: 'youtube' # or "vimeo"
  id: 'BSOJiSUI0z8' # or "32944253"
```

Specifically, we'll update the following lessons:

```yaml
- slug: storyboards-film
  title: Storyboards in Film
  # ...
  externalVideo:
    source: 'youtube'
    id: 'BSOJiSUI0z8'

- slug: fundamental-design-overview
  title: Overview of the Fundamental Elements of Design
  # ...
  externalVideo:
    source: 'vimeo'
    id: '32944253'
```

### 2. Update SQL Generation

We'll modify the `packages/content-migrations/src/scripts/sql/generators/yaml-generate-lessons-sql.ts` file to handle the new `externalVideo` fields:

1. Extract the values from the YAML:

```typescript
const videoSourceType = lesson.externalVideo?.source || 'youtube'; // default to youtube for backwards compatibility
const youtubeVideoId = lesson.externalVideo?.id || null;
```

2. Include these fields in the SQL generation:

```typescript
sql += `-- Insert lesson: ${lesson.title}
INSERT INTO payload.course_lessons (
  // ... existing fields
  video_source_type,
  youtube_video_id,
  // ... remaining fields
) VALUES (
  // ... existing values
  ${videoSourceType ? `'${videoSourceType}'` : "'youtube'"},
  ${youtubeVideoId ? `'${youtubeVideoId}'` : 'NULL'},
  // ... remaining values
);
```

### 3. Test Implementation

1. Make the changes to the YAML and SQL generator
2. Run the content migration script:
   ```bash
   ./reset-and-migrate.ps1
   ```
3. Verify that the database has been updated correctly:
   - Check the `payload.course_lessons` table
   - Ensure the `video_source_type` and `youtube_video_id` fields are populated for the two target lessons

### 4. Verify in Payload Admin

1. Log in to the Payload admin interface
2. Navigate to the Course Lessons collection
3. Verify that the "Storyboard in Film" and "Overview of the Fundamental Elements of Design" lessons display the correct external video information

## Future Considerations

1. If additional lessons need external videos, we can follow the same pattern in the YAML file
2. We should consider updating any documentation to mention this new capability
3. If the front-end components need to be updated to display these external videos, that would be a separate task

## Implementation Tasks

1. [ ] Update the `lesson-metadata.yaml` file with external video information for the target lessons
2. [ ] Modify the `yaml-generate-lessons-sql.ts` to handle the new fields
3. [ ] Run the content migration script to test changes
4. [ ] Verify that the database has been updated correctly
5. [ ] Check the Payload admin interface to confirm changes are visible
