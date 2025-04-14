# Mappings Directory

This directory contains mapping files used for the content migration system. These mappings provide critical ID relationships and lookups between different collections.

## Files Overview

- **download-mappings.ts** - The consolidated mapping file for downloads, including:

  - Predefined UUIDs for downloads (ensures consistent IDs)
  - Mappings between lesson slugs and their associated downloads
  - Helper functions for accessing these mappings

- **lesson-downloads-mappings.ts** - Backward compatibility module that re-exports from download-mappings.ts

- **lesson-quiz-mappings.ts** - Mappings between lessons and quizzes

- **image-mappings.ts** - Mappings for image relationships

- **collection-table-mappings.ts** - Mappings between collection names and database tables

## Recent Changes

As part of the content migration system cleanup plan, we've consolidated the download-related mapping files:

1. Combined `download-id-map.ts` and `lesson-downloads-mappings.ts` into a single `download-mappings.ts` file
2. Maintained backward compatibility by having the original files re-export from the consolidated file
3. Enhanced the helpers with proper TypeScript typing and error handling

## Usage

For new code, import directly from the consolidated files:

```typescript
import {
  DOWNLOAD_ID_MAP,
  getDownloadIdByKey,
  getDownloadIdsForLesson,
} from '../data/mappings/download-mappings';
```

For migration scripts that need to parse mappings from these files directly, use the appropriate regex pattern:

```typescript
// Example for extracting the download mappings object from the file
const matchResult = content.match(
  /export const LESSON_DOWNLOADS_MAPPING[^{]+({\s*[\s\S]*?\n});/m,
);
```
