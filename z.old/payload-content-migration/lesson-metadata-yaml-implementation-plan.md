# Lesson Metadata YAML Implementation Plan

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Current Status Analysis](#current-status-analysis)
3. [Proposed Solution](#proposed-solution)
4. [Implementation Strategy](#implementation-strategy)
5. [YAML Structure](#yaml-structure)
6. [Code Changes](#code-changes)
7. [Testing and Verification](#testing-and-verification)
8. [Migration Path](#migration-path)
9. [Risks and Mitigations](#risks-and-mitigations)

## Problem Statement

Our current content migration system is not effectively populating several important fields in the `payload.course_lessons` table:

- `bunny_video_id`: Required for embedding course videos
- `todo_complete_quiz`: Boolean flag for quiz completion
- `todo_watch_content`: Text instructions for video content
- `todo_read_content`: Text instructions for reading material
- `todo_course_project`: Text instructions for course projects

These fields are defined in the Payload collection schema (`apps/payload/src/collections/CourseLessons.ts`) and visible in the UI (`apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx`), but are currently null or false in the database.

The issue stems from inconsistent or non-existent field data in the source `.mdoc` files, leading to gaps in the SQL generation process. We need a standardized approach to populate these fields.

## Current Status Analysis

### What's Working:

1. **Downloads Field Mapping**:
   - The issue of all lessons getting the same two downloads has been fixed
   - We have defined mappings in `lesson-downloads-mappings.ts`
   - The system correctly maps specific download IDs to each lesson by slug
   - Relationship entries are properly generated in SQL

### What's Not Working:

1. **Bunny Video ID**:

   - Field exists in the schema
   - Extraction code is present using regex pattern matching
   - Values are showing as null in the database

2. **Todo Fields**:
   - All defined in schema but showing null or false in database
   - Content for these fields is not reliably available in the `.mdoc` files

## Proposed Solution

Create a centralized YAML file as the single source of truth for all lesson metadata, including:

1. Basic lesson information (title, slug, lesson number, etc.)
2. Todo fields content
3. Bunny.net video IDs
4. Downloads mappings
5. Quiz mappings

This approach provides:

- Centralized management of all lesson metadata
- Clear, structured format for maintaining field values
- Easy to update and maintain
- Consistent mapping to database fields
- More visibility into available content
- Better version control tracking of metadata changes

## Implementation Strategy

The implementation will follow these key steps:

1. **Create a YAML Structure** that houses all necessary lesson metadata
2. **Develop a Script** to extract existing data from `.mdoc` files and create the initial YAML file
3. **Modify the SQL Generation** process to use the YAML file as the source of truth
4. **Update the Content Migration System** to incorporate the new approach
5. **Document the new process** for future content additions

## YAML Structure

The proposed YAML structure will be a single file containing all lesson metadata:

```yaml
# lesson-metadata.yaml
lessons:
  - slug: our-process
    title: 'Our Process'
    lessonNumber: 201
    lessonLength: 15
    description: 'Learn about our structured approach to creating effective presentations.'
    todoFields:
      completeQuiz: true
      watchContent: 'Watch the introduction video on presentation processes'
      readContent: 'Read the provided summary of key process steps'
      courseProject: 'Create a process outline for your next presentation'
    bunnyVideo:
      id: 'abcdef123456'
      library: '264486'
    downloads:
      - our-process-slides
    quiz: our-process-quiz

  - slug: the-who
    title: 'The Who'
    lessonNumber: 202
    lessonLength: 20
    description: 'Understand how to analyze your audience for maximum impact.'
    todoFields:
      completeQuiz: true
      watchContent: 'Watch the audience analysis video'
      readContent: 'Read the audience persona worksheets'
      courseProject: 'Complete an audience analysis for your presentation'
    bunnyVideo:
      id: 'ghijkl789012'
      library: '264486'
    downloads:
      - the-who-slides
    quiz: the-who-quiz
```

This structure provides a clear organization of all metadata while keeping lesson content in the original `.mdoc` files.

## Code Changes

### 1. Create Initial YAML Template Script

```typescript
// packages/content-migrations/scripts/create-full-lesson-metadata.ts
import fs from 'fs';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import path from 'path';

const LESSONS_DIR = path.resolve(__dirname, '../src/data/raw/courses/lessons');
const OUTPUT_PATH = path.resolve(
  __dirname,
  '../src/data/raw/lesson-metadata.yaml',
);
const DOWNLOADS_MAPPING_PATH = path.resolve(
  __dirname,
  '../src/data/mappings/lesson-downloads-mappings.ts',
);
const QUIZ_MAPPING_PATH = path.resolve(
  __dirname,
  '../src/data/mappings/lesson-quiz-mappings.ts',
);

// Helper function to extract bunny video ID from content
function extractBunnyVideoId(content: string): string | null {
  const bunnyMatch = content.match(/bunnyvideoid="([^"]+)"/);
  return bunnyMatch && bunnyMatch[1] ? bunnyMatch[1] : null;
}

// Load existing download mappings
let downloadMappings = {};
try {
  const downloadMappingsContent = fs.readFileSync(
    DOWNLOADS_MAPPING_PATH,
    'utf8',
  );
  const mappingMatch = downloadMappingsContent.match(
    /export const lessonDownloadsMapping[^{]+({[\s\S]+?});/,
  );
  if (mappingMatch && mappingMatch[1]) {
    // Convert the TS object to valid JSON string, then parse it
    const jsonStr = mappingMatch[1]
      .replace(/'/g, '"')
      .replace(/,(\s*\})/g, '$1')
      .replace(/(\w+):/g, '"$1":');
    downloadMappings = JSON.parse(jsonStr);
  }
} catch (error) {
  console.error('Error loading download mappings:', error);
}

// Load quiz mappings
let quizMappings = {};
try {
  const quizMappingsContent = fs.readFileSync(QUIZ_MAPPING_PATH, 'utf8');
  const mappingMatch = quizMappingsContent.match(
    /export const lessonQuizMapping[^{]+({[\s\S]+?});/,
  );
  if (mappingMatch && mappingMatch[1]) {
    const jsonStr = mappingMatch[1]
      .replace(/'/g, '"')
      .replace(/,(\s*\})/g, '$1')
      .replace(/(\w+):/g, '"$1":');
    quizMappings = JSON.parse(jsonStr);
  }
} catch (error) {
  console.error('Error loading quiz mappings:', error);
}

// Get all lesson files
const lessonFiles = fs
  .readdirSync(LESSONS_DIR)
  .filter((file) => file.endsWith('.mdoc'));

// Process each lesson file
const lessons = lessonFiles.map((file) => {
  const filePath = path.join(LESSONS_DIR, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContent);
  const slug = path.basename(file, '.mdoc');

  // Get bunny video ID from content
  const bunnyVideoId = extractBunnyVideoId(content);

  // Get downloads from mapping
  const downloads = downloadMappings[slug] || [];

  // Get quiz reference
  const quizSlug = quizMappings[slug] || null;

  return {
    slug,
    title: data.title || '',
    lessonNumber: data.lessonNumber || data.order || 0,
    lessonLength: data.lessonLength || 0,
    description: data.description || '',
    todoFields: {
      completeQuiz: data.todoCompleteQuiz === true || false,
      watchContent: data.todoWatchContent || '',
      readContent: data.todoReadContent || '',
      courseProject: data.todoCourseProject || '',
    },
    bunnyVideo: {
      id: bunnyVideoId || '',
      library: '264486', // Default library ID
    },
    downloads: downloads,
    quiz: quizSlug || null,
  };
});

// Sort lessons by lesson number
lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);

// Create metadata structure
const metadata = { lessons };

// Write YAML file
fs.writeFileSync(OUTPUT_PATH, yaml.dump(metadata, { lineWidth: 120 }));

console.log(
  `Created comprehensive lesson metadata with ${lessons.length} lessons at ${OUTPUT_PATH}`,
);
```

### 2. Update Generate Lessons SQL Script

```typescript
// In packages/content-migrations/src/scripts/sql/generators/generate-lessons-sql.ts
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';

import { RAW_QUIZZES_DIR } from '../../../config/paths.js';
import { DOWNLOAD_ID_MAP } from '../../../data/download-id-map.js';
import { convertToLexical } from '../../utils/lexical-converter.js';
import { generateQuizMap } from '../../utils/quiz-map-generator.js';
import { COURSE_ID } from './generate-courses-sql.js';

export function generateLessonsSql(lessonsDir: string): string {
  console.log('Generating lessons SQL from YAML metadata...');

  // Load the metadata file
  const METADATA_PATH = path.resolve(
    __dirname,
    '../../../data/raw/lesson-metadata.yaml',
  );

  if (!fs.existsSync(METADATA_PATH)) {
    throw new Error(`Lesson metadata file not found at ${METADATA_PATH}`);
  }

  let lessonMetadata;
  try {
    lessonMetadata = yaml.load(fs.readFileSync(METADATA_PATH, 'utf8'));
  } catch (error) {
    console.error('Error loading lesson metadata:', error);
    throw error;
  }

  // Start building the SQL
  let sql = `-- Seed data for the course lessons table
-- This file should be run after the courses seed file to ensure the course exists

-- Start a transaction
BEGIN;

`;

  // Generate quiz map for ID lookup
  const quizMap = generateQuizMap(RAW_QUIZZES_DIR);

  // Process each lesson from the metadata
  for (const lesson of lessonMetadata.lessons) {
    // Generate a UUID for the lesson
    const lessonId = uuidv4();

    // Get the lesson slug
    const lessonSlug = lesson.slug;

    // Look up quiz ID if there's a quiz slug associated
    let quizId = null;
    if (lesson.quiz) {
      if (quizMap.has(lesson.quiz)) {
        quizId = quizMap.get(lesson.quiz);
        console.log(`Found quiz with ID ${quizId} for lesson ${lessonSlug}`);
      } else {
        console.log(`Quiz not found for lesson ${lessonSlug}: ${lesson.quiz}`);
      }
    }

    // Extract fields from metadata
    const todoCompleteQuiz = lesson.todoFields?.completeQuiz === true;
    const todoWatchContent = lesson.todoFields?.watchContent || null;
    const todoReadContent = lesson.todoFields?.readContent || null;
    const todoCourseProject = lesson.todoFields?.courseProject || null;
    const bunnyVideoId = lesson.bunnyVideo?.id || null;

    // Get the Lexical content from the .mdoc file
    const mdocFilePath = path.join(lessonsDir, `${lessonSlug}.mdoc`);
    let lexicalContent = '{}'; // Empty Lexical document as fallback

    if (fs.existsSync(mdocFilePath)) {
      const fileContent = fs.readFileSync(mdocFilePath, 'utf8');
      const { content } = matter(fileContent);
      lexicalContent = convertToLexical(content);
    }

    // Add the lesson to the SQL
    sql += `-- Insert lesson: ${lesson.title}
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  estimated_duration,
  course_id,
  ${quizId ? 'quiz_id,' : ''}
  ${quizId ? 'quiz_id_id,' : ''}
  ${bunnyVideoId ? 'bunny_video_id,' : ''}
  todo_complete_quiz,
  ${todoWatchContent ? 'todo_watch_content,' : ''}
  ${todoReadContent ? 'todo_read_content,' : ''}
  ${todoCourseProject ? 'todo_course_project,' : ''}
  created_at,
  updated_at
) VALUES (
  '${lessonId}',
  '${lesson.title.replace(/'/g, "''")}',
  '${lessonSlug}',
  '${(lesson.description || '').replace(/'/g, "''")}',
  '${lexicalContent.replace(/'/g, "''")}',
  ${lesson.lessonNumber || 0},
  ${lesson.lessonLength || 0},
  '${COURSE_ID}',
  ${quizId ? `'${quizId}',` : ''}
  ${quizId ? `'${quizId}',` : ''}
  ${bunnyVideoId ? `'${bunnyVideoId}',` : ''}
  ${todoCompleteQuiz},
  ${todoWatchContent ? `'${todoWatchContent.replace(/'/g, "''")}'` : 'NULL'},
  ${todoReadContent ? `'${todoReadContent.replace(/'/g, "''")}'` : 'NULL'},
  ${todoCourseProject ? `'${todoCourseProject.replace(/'/g, "''")}'` : 'NULL'},
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;

    // Add relationship entries

    // Add the relationship entry for the course
    sql += `-- Create relationship entry for the lesson to the course
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${lessonId}',
  'course',
  '${COURSE_ID}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;

    // Add the relationship entry for the quiz if available
    if (quizId) {
      sql += `-- Create relationship entry for the lesson to the quiz
INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${lessonId}',
  'quiz_id',
  '${quizId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;
    }

    // Add relationship entries for downloads
    if (lesson.downloads && lesson.downloads.length > 0) {
      sql += `-- Create relationship entries for the lesson to downloads\n`;

      for (const downloadKey of lesson.downloads) {
        const downloadId = DOWNLOAD_ID_MAP[downloadKey];
        if (downloadId) {
          sql += `INSERT INTO payload.course_lessons_rels (
  id,
  _parent_id,
  field,
  value,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '${lessonId}',
  'downloads',
  '${downloadId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

`;
        } else {
          console.warn(`Download ID not found for key: ${downloadKey}`);
        }
      }
    }
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}
```

### 3. Update the Content Migration System

1. Modify `packages/content-migrations/src/scripts/sql/new-generate-sql-seed-files.ts`:

   - Add logic to check for the YAML file
   - Use it as the source of truth when generating SQL

2. Add a new script `packages/content-migrations/src/scripts/process/ensure-lesson-metadata.ts`:

   - Check if lesson-metadata.yaml exists
   - Create it if it doesn't
   - Log a warning if it exists but might be out of date

3. Update the main processing script to include the metadata check.

## Testing and Verification

### Initial Testing

1. Create the YAML file with existing lesson data
2. Manually add sample values for todo fields and Bunny video IDs
3. Run `reset-and-migrate.ps1` to reset the database and apply migrations
4. Verify database state with SQL queries

### Database Verification

```sql
-- Check for populated fields
SELECT id, title, bunny_video_id, todo_complete_quiz, todo_watch_content,
       todo_read_content, todo_course_project
FROM payload.course_lessons
ORDER BY lesson_number;

-- Check for download relationships
SELECT cl.title, d.filename
FROM payload.course_lessons cl
JOIN payload.course_lessons_rels clr ON cl.id = clr._parent_id
JOIN payload.downloads d ON d.id = clr.value
WHERE clr.field = 'downloads'
ORDER BY cl.title;
```

### UI Verification

1. Navigate to various lessons in the web application
2. Verify that todo sections display correctly
3. Check that videos play correctly with the Bunny.net video IDs
4. Confirm that downloads are lesson-specific

## Migration Path

### Phase 1: Preparation (1-2 days)

1. Create the initial YAML file with existing data
2. Add placeholder values for missing fields
3. Develop the script modifications for SQL generation
4. Update the reset-and-migrate.ps1 script to use the new approach

### Phase 2: Implementation (1 day)

1. Run a test migration with a few lessons to verify the approach
2. Make any necessary adjustments to the code
3. Finalize the complete YAML file with all lesson data

### Phase 3: Rollout (1 day)

1. Run the complete migration
2. Verify field population in the database
3. Test UI display for various lessons

### Phase 4: Documentation (1/2 day)

1. Document the new process for maintaining lesson metadata
2. Update any related documentation
3. Create examples for adding new lessons

## Risks and Mitigations

### Risk: Data Loss

- **Risk**: Migration could overwrite existing data
- **Mitigation**: Use `ON CONFLICT DO NOTHING` for all inserts
- **Mitigation**: Back up the database before running migrations
- **Mitigation**: Keep original .mdoc files unchanged

### Risk: Inconsistent Metadata

- **Risk**: Manual editing of YAML could introduce errors
- **Mitigation**: Add schema validation for the YAML file
- **Mitigation**: Create a validation script to check YAML integrity
- **Mitigation**: Use clear error messages during migration if issues are found

### Risk: Migration Process Complexity

- **Risk**: Adding another data source increases complexity
- **Mitigation**: Clear documentation of the process
- **Mitigation**: Simplify implementation with helper scripts
- **Mitigation**: Consider future tooling for metadata management

### Risk: Content/Metadata Misalignment

- **Risk**: Content in .mdoc files may not align with metadata
- **Mitigation**: Keep main content in .mdoc, metadata in YAML
- **Mitigation**: Add validation to ensure referenced slugs exist
- **Mitigation**: Consider future consolidation if needed
