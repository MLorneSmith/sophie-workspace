# SQL Generator Refactoring Implementation Plan

## Overview

This document outlines the detailed implementation plan for refactoring the `packages/content-migrations/src/scripts/sql/generate-sql-seed-files-fixed.ts` file. The current file is over 1000 lines long and handles multiple responsibilities, making it difficult to maintain and understand. This refactoring will break it down into smaller, more manageable modules while maintaining the existing functionality.

## Current Structure Analysis

The current `generate-sql-seed-files-fixed.ts` file has several responsibilities:

1. **Main orchestration function** (`generateSqlSeedFiles`): Coordinates the entire SQL generation process
2. **Quiz map generation** (`generateQuizMap`): Creates a map of quiz slugs to UUIDs
3. **SQL generation functions**:
   - `generateCoursesSql`: Generates SQL for courses
   - `generateMediaSql`: Generates SQL for media entries
   - `generateLessonsSql`: Generates SQL for lessons
   - `generateQuizzesSql`: Generates SQL for quizzes
   - `generateQuestionsSql`: Generates SQL for quiz questions
   - `generateSurveysSql`: Generates SQL for surveys
   - `generateSurveyQuestionsSql`: Generates SQL for survey questions
4. **Verification functions**:
   - `verifyQuizIds`: Verifies quiz IDs in SQL match those in knownQuizIds
   - `verifyCrossFileQuizIds`: Verifies quiz IDs in questions SQL match those in quizzes SQL
5. **Utility functions**:
   - `convertToLexical`: Converts Markdown content to Lexical JSON
   - `getMimeType`: Determines MIME type based on file extension

## Implementation Plan

### 1. Create Directory Structure

First, we'll create the necessary directory structure:

```
packages/content-migrations/src/
├── scripts/
│   ├── sql/
│   │   ├── generate-sql-seed-files.ts         # Main orchestration function
│   │   ├── generators/                        # New directory for SQL generators
│   │   │   ├── generate-courses-sql.ts
│   │   │   ├── generate-lessons-sql.ts
│   │   │   ├── generate-media-sql.ts
│   │   │   ├── generate-quizzes-sql.ts
│   │   │   ├── generate-questions-sql.ts
│   │   │   ├── generate-surveys-sql.ts
│   │   │   └── generate-survey-questions-sql.ts
│   ├── utils/
│   │   ├── lexical-converter.ts
│   │   ├── quiz-map-generator.ts
│   │   └── mime-type-helper.ts
│   └── verification/
│       ├── verify-cross-file-quiz-ids.ts
```

### 2. Create Type Definitions

Create necessary type definitions to ensure type safety across the refactored modules:

```typescript
// src/types/lexical.ts
export interface LexicalJSON {
  root: {
    children: Array<{
      children: Array<{
        detail: number;
        format: number;
        mode: string;
        style: string;
        text: string;
        type: string;
        version: number;
      }>;
      direction: string;
      format: string;
      indent: number;
      type: string;
      version: number;
    }>;
    direction: string;
    format: string;
    indent: number;
    type: string;
    version: number;
  };
}
```

### 3. Extract Utility Functions

#### 3.1. Create `utils/lexical-converter.ts`

Extract the `convertToLexical` function to its own file:

```typescript
/**
 * Utility for converting Markdown content to Lexical JSON format
 */
import { LexicalJSON } from '../../types/lexical.js';

/**
 * Converts Markdown content to a simple Lexical JSON structure
 * @param content - Markdown content
 * @returns Lexical JSON structure as a string
 */
export function convertToLexical(content: string): string {
  // Split the content into paragraphs
  const paragraphs = content.split('\n\n');

  // Create a simple Lexical JSON structure
  const lexical: LexicalJSON = {
    root: {
      children: paragraphs.map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph.trim(),
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };

  return JSON.stringify(lexical);
}
```

#### 3.2. Create `utils/mime-type-helper.ts`

Extract the `getMimeType` function to its own file:

```typescript
/**
 * Utility for determining MIME types based on file extensions
 */
import path from 'path';

/**
 * Helper function to determine MIME type based on file extension
 * @param filename - Filename
 * @returns MIME type
 */
export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}
```

#### 3.3. Create `utils/quiz-map-generator.ts`

Extract the `generateQuizMap` function and `knownQuizIds` constant to their own file:

```typescript
/**
 * Utility for generating a map of quiz slugs to UUIDs
 */
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define fixed UUIDs for known quizzes for consistency
// These IDs match the ones in packages/content-migrations/src/data/mappings/quiz-id-map.json
export const knownQuizIds: Record<string, string> = {
  'basic-graphs-quiz': 'c11dbb26-7561-4d12-88c8-141c653a43fd',
  'elements-of-design-detail-quiz': '42564568-76bb-4405-88a9-8e9fd0a9154a',
  'fact-persuasion-quiz': '791e27de-2c98-49ef-b684-6c88667d1571',
  'gestalt-principles-quiz': '3c72b383-e17e-4b07-8a47-451cfbff29c0',
  'idea-generation-quiz': '19d1674c-373d-4b29-92e6-ac0d384f9ddc',
  'introductions-quiz': 'b787a684-1cc6-4fe4-85ef-1f672c64b20c',
  'our-process-quiz': '448140ae-8dd3-4605-a0f1-126582aab97f',
  'overview-elements-of-design-quiz': '5562d734-ee5a-4753-a332-5e8b870dfd02',
  'performance-quiz': '6ff1884a-2c09-429b-833b-e13be7de15a3',
  'preparation-practice-quiz': 'ec99ed0f-0ac0-49dc-a736-8a50e0f5f292',
  'slide-composition-quiz': '043690ea-f43b-4e23-8d60-1f1b644e19e5',
  'specialist-graphs-quiz': 'dec09f8e-8b8d-4d8e-9a03-e2259b268d9f',
  'storyboards-in-film-quiz': '48d72a15-d246-462e-9da7-277fc87ea27f',
  'storyboards-in-presentations-quiz': '47f598bf-fdf6-4a94-93d9-63b5eb0f727d',
  'structure-quiz': '824f49a8-eefc-4a20-8bcb-f8d2eff78316',
  'tables-vs-graphs-quiz': 'a8e110e6-dc17-49ff-9e06-04f6dce0f710',
  'the-who-quiz': '66de941e-3c28-4933-851e-9e5e27566d0f',
  'using-stories-quiz': '1fd979ef-274c-4e25-97d8-858d664289a1',
  'visual-perception-quiz': '1d2e8232-35bf-4de9-8274-71b9a53c2334',
  'why-next-steps-quiz': '4fca61fb-8e25-416a-a2ef-43132fbf90fb',
};

/**
 * Generates a map of quiz slugs to UUIDs
 * @param quizzesDir - Directory containing quiz .mdoc files
 * @returns Map of quiz slugs to UUIDs
 */
export function generateQuizMap(quizzesDir: string): Map<string, string> {
  const quizMap = new Map<string, string>();

  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  console.log(`Found ${quizFiles.length} quiz files to process.`);

  // Generate a UUID for each quiz, using known IDs when available
  for (const file of quizFiles) {
    const slug = path.basename(file, '.mdoc');

    // Check if we have a known ID for this quiz
    if (knownQuizIds[slug]) {
      const quizId = knownQuizIds[slug];
      quizMap.set(slug, quizId);
      console.log(`Using known ID ${quizId} for quiz ${slug}`);
    } else {
      // Generate a new UUID if we don't have a known ID
      const quizId = uuidv4();
      quizMap.set(slug, quizId);
      console.log(
        `Generated new ID ${quizId} for quiz ${slug} (no known ID found)`,
      );
    }
  }

  // Validate that all quiz IDs in the map match those in knownQuizIds
  for (const [slug, id] of quizMap.entries()) {
    if (knownQuizIds[slug] && id !== knownQuizIds[slug]) {
      console.error(
        `Error: ID mismatch for quiz ${slug}. Map has ${id}, knownQuizIds has ${knownQuizIds[slug]}`,
      );
      // Fix the mismatch by using the known ID
      quizMap.set(slug, knownQuizIds[slug]);
      console.log(`Fixed ID for quiz ${slug} to ${knownQuizIds[slug]}`);
    }
  }

  return quizMap;
}
```

### 4. Extract Verification Functions

#### 4.1. Create `verification/verify-cross-file-quiz-ids.ts`

Extract the `verifyCrossFileQuizIds` function to its own file:

```typescript
/**
 * Verification utility for cross-file quiz ID consistency
 */

/**
 * Verifies that the quiz IDs in the questions SQL match those in the quizzes SQL
 * @param quizzesSql - The generated quizzes SQL
 * @param questionsSql - The generated questions SQL
 * @returns True if all quiz IDs match, false otherwise
 */
export function verifyCrossFileQuizIds(
  quizzesSql: string,
  questionsSql: string,
): boolean {
  // Extract quiz IDs from quizzes SQL
  const quizIdRegex =
    /INSERT INTO payload\.course_quizzes[\s\S]*?id = '([^']+)'[\s\S]*?/g;
  const quizIds = new Set<string>();
  let match;

  while ((match = quizIdRegex.exec(quizzesSql)) !== null) {
    const id = match[1];
    quizIds.add(id);
  }

  // Extract quiz IDs from questions SQL
  const questionQuizIdRegex = /quiz_id = '([^']+)'/g;
  const questionQuizIds = new Set<string>();

  while ((match = questionQuizIdRegex.exec(questionsSql)) !== null) {
    const id = match[1];
    questionQuizIds.add(id);
  }

  // Check if all question quiz IDs exist in quizzes
  let allExist = true;
  for (const id of questionQuizIds) {
    if (!quizIds.has(id)) {
      console.error(
        `Error: Quiz ID ${id} referenced in questions does not exist in quizzes`,
      );
      allExist = false;
    }
  }

  return allExist;
}
```

### 5. Extract SQL Generation Functions

#### 5.1. Create `generators/generate-courses-sql.ts`

Extract the `generateCoursesSql` function and `COURSE_ID` constant to their own file:

```typescript
/**
 * Generator for courses SQL
 */

// Define the course ID (fixed UUID)
export const COURSE_ID = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8';

/**
 * Generates SQL for the courses table
 * @returns SQL for courses
 */
export function generateCoursesSql(): string {
  return `-- Seed data for the courses table
-- This file should be run after the migrations to ensure the courses table exists

-- Start a transaction
BEGIN;

-- Insert the main course
INSERT INTO payload.courses (
  id,
  title,
  slug,
  description,
  status,
  estimated_duration,
  show_progress_bar,
  published_at,
  updated_at,
  created_at
) VALUES (
  '${COURSE_ID}', -- Fixed UUID for the course
  'Decks for Decision Makers',
  'decks-for-decision-makers',
  'Learn how to create effective presentations for decision makers',
  'published',
  240, -- 4 hours
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the course already exists

-- Create a simple content structure for intro_content
UPDATE payload.courses
SET intro_content = '{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Welcome to Decks for Decision Makers! This course will teach you how to create effective presentations for decision makers.",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}'::jsonb
WHERE id = '${COURSE_ID}';

-- Create a simple content structure for completion_content
UPDATE payload.courses
SET completion_content = '{
  "root": {
    "children": [
      {
        "children": [
          {
            "detail": 0,
            "format": 0,
            "mode": "normal",
            "style": "",
            "text": "Congratulations on completing the course! You now have the skills to create effective presentations for decision makers.",
            "type": "text",
            "version": 1
          }
        ],
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "type": "paragraph",
        "version": 1
      }
    ],
    "direction": "ltr",
    "format": "",
    "indent": 0,
    "type": "root",
    "version": 1
  }
}'::jsonb
WHERE id = '${COURSE_ID}';

-- Commit the transaction
COMMIT;
`;
}
```

#### 5.2. Create `generators/generate-media-sql.ts`

Extract the `generateMediaSql` function to its own file:

```typescript
/**
 * Generator for media SQL
 */
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import {
  lessonImageMappings,
  postImageMappings,
} from '../../../data/mappings/image-mappings.js';
import { getMimeType } from '../../utils/mime-type-helper.js';

// Declare global mediaIds property for TypeScript
declare global {
  var mediaIds: Record<string, string>;
}

/**
 * Generates SQL for media entries based on image mappings
 * @returns SQL for media entries
 */
export function generateMediaSql(): string {
  // Start building the SQL
  let sql = `-- Seed data for the media table
-- This file should be run after the migrations to ensure the media table exists

-- Start a transaction
BEGIN;

`;

  // Create a map to store media IDs by frontmatter path
  const mediaIds: Record<string, string> = {};
  global.mediaIds = mediaIds;

  // Process lesson images
  Object.entries(lessonImageMappings).forEach(
    ([frontmatterPath, actualFilename]) => {
      const mediaId = uuidv4();
      mediaIds[frontmatterPath] = mediaId;

      sql += `-- Insert media for ${frontmatterPath}
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '${mediaId}',
  '${path.basename(actualFilename, path.extname(actualFilename)).replace(/_/g, ' ')}',
  '${actualFilename}',
  '${getMimeType(actualFilename)}',
  0,
  'https://images.slideheroes.com/${actualFilename}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;
    },
  );

  // Process post images
  Object.entries(postImageMappings).forEach(
    ([frontmatterPath, actualFilename]) => {
      const mediaId = uuidv4();
      mediaIds[frontmatterPath] = mediaId;

      sql += `-- Insert media for ${frontmatterPath}
INSERT INTO payload.media (
  id,
  alt,
  filename,
  mime_type,
  filesize,
  url,
  updated_at,
  created_at
) VALUES (
  '${mediaId}',
  '${path.basename(actualFilename, path.extname(actualFilename)).replace(/_/g, ' ')}',
  '${actualFilename}',
  '${getMimeType(actualFilename)}',
  0,
  'https://images.slideheroes.com/${actualFilename}',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

`;
    },
  );

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}
```

#### 5.3. Create `generators/generate-lessons-sql.ts`

Extract the `generateLessonsSql` function to its own file:

```typescript
/**
 * Generator for lessons SQL
 */
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { RAW_QUIZZES_DIR } from '../../../config/paths.js';
import { lessonQuizMapping } from '../../../data/mappings/lesson-quiz-mappings.js';
import { convertToLexical } from '../../utils/lexical-converter.js';
import { generateQuizMap } from '../../utils/quiz-map-generator.js';
import { COURSE_ID } from './generate-courses-sql.js';

/**
 * Generates SQL for lessons from .mdoc files
 * @param lessonsDir - Directory containing lesson .mdoc files
 * @returns SQL for lessons
 */
export function generateLessonsSql(lessonsDir: string): string {
  // Get all .mdoc files in the lessons directory
  const lessonFiles = fs
    .readdirSync(lessonsDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Start building the SQL
  let sql = `-- Seed data for the course lessons table
-- This file should be run after the courses seed file to ensure the course exists

-- Start a transaction
BEGIN;

`;

  // Process each lesson file
  for (const file of lessonFiles) {
    const filePath = path.join(lessonsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    // Generate a UUID for the lesson
    const lessonId = uuidv4();

    // Convert the content to a simple Lexical JSON structure
    const lexicalContent = convertToLexical(content);

    // Get the media ID for this lesson's image
    const mediaId =
      data.image && global.mediaIds ? global.mediaIds[data.image] : null;

    // Get the lesson slug
    const lessonSlug = path.basename(file, '.mdoc');

    // Check if this lesson has an associated quiz using the mapping
    let quizId = null;
    if (lessonQuizMapping[lessonSlug]) {
      // Get the quiz slug from the mapping
      const quizSlug = lessonQuizMapping[lessonSlug];

      // Find the quiz ID from the quiz map
      const quizMap = generateQuizMap(RAW_QUIZZES_DIR);
      if (quizMap.has(quizSlug)) {
        const id = quizMap.get(quizSlug);
        if (id) {
          quizId = id;
          console.log(`Found quiz with ID ${quizId} for lesson ${lessonSlug}`);
        }
      } else {
        console.log(`Quiz not found for lesson ${lessonSlug}: ${quizSlug}`);
      }
    }

    // Add the lesson to the SQL
    sql += `-- Insert lesson: ${data.title}
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  estimated_duration,
  course_id,
  ${mediaId ? 'featured_image_id,' : ''}
  ${quizId ? 'quiz_id,' : ''}
  ${quizId ? 'quiz_id_id,' : ''}
  created_at,
  updated_at
) VALUES (
  '${lessonId}', -- Generated UUID for the lesson
  '${data.title.replace(/'/g, "''")}',
  '${lessonSlug}',
  '${((data.description || '') + '').replace(/'/g, "''")}',
  '${lexicalContent.replace(/'/g, "''")}',
  ${data.lessonNumber || data.order || 0},
  ${data.lessonLength || 0}, -- Set estimated_duration from lessonLength
  '${COURSE_ID}', -- Course ID
  ${mediaId ? `'${mediaId}',` : ''}
  ${quizId ? `'${quizId}',` : ''}
  ${quizId ? `'${quizId}',` : ''}
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists

`;

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
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;

    // Add the relationship entry for the media if available
    if (mediaId) {
      sql += `-- Create relationship entry for the lesson to the media
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
  'featured_image',
  '${mediaId}',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;
    }

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
) ON CONFLICT DO NOTHING; -- Skip if the relationship already exists

`;
    }
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}
```

#### 5.4. Create `generators/generate-quizzes-sql.ts`

Extract the `generateQuizzesSql` function to its own file:

```typescript
/**
 * Generator for quizzes SQL
 */
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

/**
 * Generates SQL for quizzes from .mdoc files
 * @param quizzesDir - Directory containing quiz .mdoc files
 * @param quizMap - Map of quiz slugs to UUIDs
 * @returns SQL for quizzes
 */
export function generateQuizzesSql(
  quizzesDir: string,
  quizMap: Map<string, string>,
): string {
  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Start building the SQL
  let sql = `-- Seed data for the course quizzes table
-- This file should be run after the courses seed file to ensure the course exists

-- Start a transaction
BEGIN;

`;

  // Process each quiz file
  for (const file of quizFiles) {
    const filePath = path.join(quizzesDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    // Get the quiz slug and UUID
    const quizSlug = path.basename(file, '.mdoc');
    const quizId = quizMap.get(quizSlug);

    if (!quizId) {
      console.error(`Error: No ID found for quiz ${quizSlug}`);
      continue;
    }

    console.log(`Generating SQL for quiz ${quizSlug} with ID ${quizId}`);

    // Add the quiz to the SQL
    sql += `-- Insert quiz: ${data.title}
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '${quizId}', -- UUID for the quiz
  '${data.title.replace(/'/g, "''")}',
  '${quizSlug}',
  '${(data.description || `Quiz for ${data.title}`).replace(/'/g, "''")}',
  ${data.passingScore || 70}, -- Default passing score is 70
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

`;
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}
```

#### 5.5. Create `generators/generate-questions-sql.ts`

Extract the `generateQuestionsSql` function to its own file:

```typescript
/**
 * Generator for quiz questions SQL
 */
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates SQL for quiz questions from .mdoc files
 * @param quizzesDir - Directory containing quiz .mdoc files
 * @param quizMap - Map of quiz slugs to UUIDs
 * @returns SQL for quiz questions
 */
export function generateQuestionsSql(
  quizzesDir: string,
  quizMap: Map<string, string>
): string {
  // Get all .mdoc files in the quizzes directory
  const quizFiles = fs
    .readdirSync(quizzesDir)
    .filter((file) => file.endsWith('.mdoc'));

  // Start building the SQL
  let sql = `-- Seed data for the quiz questions table
-- This file should be run after the quizzes seed file to ensure the quizzes exist

-- Start a transaction
BEGIN;

`;

  // Process each quiz file
  for (const file of quizFiles) {
    const filePath = path.join(quizzesDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    // Skip if there are no questions
    if (!data.questions || !Array.isArray(data.questions)) {
      continue;
    }

    // Get the quiz slug and UUID
    const quizSlug = path.basename(file, '.mdoc');
    let quizId = quizMap.get(quizSlug);

    // If the quiz ID is not found in the map, generate a new one
    if (!quizId) {
      quizId = uuidv4();
      console.log(
        `Generated new ID ${quizId} for quiz ${quizSlug} in questions SQL`
      );
    }

    sql += `-- Questions for quiz: ${data.title} (${quizSlug}, ID: ${quizId})
`;

    // Process each question
    for (let i = 0; i < data.questions.length; i++) {
      const question = data.questions[i];
      const questionId = uuidv4();

      // Add the question to the SQL
      sql += `-- Insert question ${i + 1} for quiz: ${data.title}
INSERT INTO payload.quiz_questions (
  id,
  question,
  quiz_id,
  quiz_id_id, -- Duplicate field for compatibility
  type,
  explanation,
  "order",
  created_at,
  updated_at
) VALUES (
  '${questionId}', -- Generated UUID for the question
  '${(question.question || '').replace(/'/g, "''")}',
  '${quizId}', -- Quiz ID
  '${quizId}', -- Quiz ID (duplicate)
  '${question.questiontype || 'multiple_choice'}',
  '${(question.explanation || '').replace(/'/g, "''")}',
  ${i},
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

`;

      // Process each answer
      if (question.answers && Array.isArray(question.answers)) {
        for (let j = 0; j
```
