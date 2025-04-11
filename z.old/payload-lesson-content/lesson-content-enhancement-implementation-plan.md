# Lesson Content Enhancement Implementation Plan

## Overview

This document outlines the implementation plan for enhancing course lessons in our Payload CMS with structured fields for to-do items, bunny.net video integration, and file downloads from Cloudflare R2. The plan follows an SQL-first approach with YAML content definitions.

## Current State Analysis

### Course Lessons Structure

- Course lessons are defined in `apps/payload/src/collections/CourseLessons.ts`
- Uses a rich text `content` field with Lexical editor
- Bunny.net videos are embedded as custom blocks in the content
- To-do items are included as text in the content
- File downloads use custom syntax in the content: `{% r2file awsurl="..." filedescription="..." /%}`

### Content Migration System

- Two-phase process using raw data processing and SQL migration
- Raw data is processed into SQL seed files
- Database migrations are executed via the `reset-and-migrate.ps1` script
- Example: "Our Process" lesson (201) includes:
  - Bunny.net video (ID: 70b1f616-8e55-4c58-8898-c5cefa05417b)
  - Structured to-do text
  - Two R2 file links

### Cloudflare R2 Integration

- Already implemented for media storage
- Downloads bucket exists with public URL: `https://pub-40e84da466344af19a7192a514a7400e.r2.dev`
- Files are already stored in the downloads bucket

## Implementation Strategy

We'll take an SQL-first approach with YAML as the content definition format:

1. Define a YAML structure for lesson enhancements
2. Create a schema migration for new structured fields
3. Generate SQL from YAML to populate the fields
4. Update Payload CMS collections
5. Update frontend components
6. Integrate with the content migration system

## Detailed Implementation Plan

### 1. Schema Modifications

First, we need to add new columns to the `course_lessons` table and create a `downloads` table.

```sql
-- Add structured fields to course_lessons table
ALTER TABLE payload.course_lessons
ADD COLUMN IF NOT EXISTS bunny_video_id TEXT,
ADD COLUMN IF NOT EXISTS bunny_library_id TEXT DEFAULT '264486',
ADD COLUMN IF NOT EXISTS todo_complete_quiz BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS todo_watch_content TEXT,
ADD COLUMN IF NOT EXISTS todo_read_content TEXT,
ADD COLUMN IF NOT EXISTS todo_course_project TEXT;

-- Create downloads table if it doesn't exist
CREATE TABLE IF NOT EXISTS payload.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  lesson_id UUID REFERENCES payload.course_lessons(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create relationship table for lessons and downloads
CREATE TABLE IF NOT EXISTS payload.course_lessons_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES payload.course_lessons(id) NOT NULL,
  download_id UUID REFERENCES payload.downloads(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id, download_id)
);
```

### 2. YAML Template for Content Definitions

Create a YAML template for defining lesson enhancements. This allows for a clear separation of content from migration logic.

```yaml
# lessons_structured_content.yaml
# This file defines the structured content for course lessons
# Each lesson is identified by its ID or slug

lessons:
  # Example: "Our Process" lesson
  - id: 'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1' # ID takes precedence over slug
    slug: 'our-process' # Used for lookup if ID not provided
    bunny_video:
      video_id: '70b1f616-8e55-4c58-8898-c5cefa05417b'
      library_id: '264486' # Optional, defaults to "264486"
    todo_items:
      complete_quiz: true
      watch_content: 'None'
      read_content: 'None'
      course_project: 'None'
    downloads:
      - filename: '201 Our Process.pdf'
        url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf'
        description: "'Our Process' Lesson slides"
      - filename: '202 The Who.pdf'
        url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf'
        description: 'Second download (The Who)'
```

### 3. Content Analysis Script

Create a script to analyze existing content and generate the initial YAML files:

```typescript
// packages/content-migrations/src/scripts/analyze-lesson-content.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const prisma = new PrismaClient();

async function analyzeContent() {
  // Get all lessons
  const lessons = await prisma.payload_course_lessons.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
    },
  });

  const lessonsData = [];

  for (const lesson of lessons) {
    const lessonData: any = {
      id: lesson.id,
      slug: lesson.slug,
    };

    // Extract Bunny Video information
    const videoMatch = lesson.content.match(
      /blockType":"bunny-video".*?"videoId":"([^"]+)".*?"libraryId":"([^"]+)"/,
    );
    if (videoMatch) {
      lessonData.bunny_video = {
        video_id: videoMatch[1],
        library_id: videoMatch[2] || '264486',
      };
    }

    // Extract To-Do items
    if (
      lesson.content.includes('To-Do') &&
      lesson.content.includes('Complete the lesson quiz')
    ) {
      lessonData.todo_items = {
        complete_quiz: true,
      };

      // Extract Watch content
      const watchMatch = lesson.content.match(/Watch\s*\n\s*-\s*([^\n]+)/);
      if (watchMatch) {
        lessonData.todo_items.watch_content = watchMatch[1].trim();
      }

      // Extract Read content
      const readMatch = lesson.content.match(/Read\s*\n\s*-\s*([^\n]+)/);
      if (readMatch) {
        lessonData.todo_items.read_content = readMatch[1].trim();
      }

      // Extract Course Project
      const projectMatch = lesson.content.match(
        /Course Project\s*\n\s*-\s*([^\n]+)/,
      );
      if (projectMatch) {
        lessonData.todo_items.course_project = projectMatch[1].trim();
      }
    }

    // Extract R2 file downloads
    const r2FileMatches = Array.from(
      lesson.content.matchAll(
        /r2file\s*\n\s*awsurl="([^"]+)"\s*\n\s*filedescription="([^"]+)"/g,
      ),
    );
    if (r2FileMatches.length > 0) {
      lessonData.downloads = [];

      for (const match of r2FileMatches) {
        lessonData.downloads.push({
          url: match[1],
          description: match[2],
          filename: match[1].split('/').pop(),
        });
      }
    }

    // Only add lessons with enhanced content
    if (
      lessonData.bunny_video ||
      lessonData.todo_items ||
      lessonData.downloads
    ) {
      lessonsData.push(lessonData);
    }
  }

  // Write to YAML file
  const yamlData = {
    lessons: lessonsData,
  };

  const yamlStr = yaml.dump(yamlData, { noRefs: true });
  fs.writeFileSync(
    path.join(
      __dirname,
      '../../src/data/definitions/lessons_structured_content.yaml',
    ),
    yamlStr,
  );

  console.log(
    `Generated YAML for ${lessonsData.length} lessons with enhanced content`,
  );
}

analyzeContent()
  .then(() => console.log('Content analysis complete'))
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 4. SQL Generator Script

Create a script to generate SQL from the YAML files:

```typescript
// packages/content-migrations/src/scripts/sql/generate-lesson-enhancements-sql.ts
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load the YAML file
const yamlPath = path.join(
  __dirname,
  '../../src/data/definitions/lessons_structured_content.yaml',
);
const yamlContent = fs.readFileSync(yamlPath, 'utf8');
const data = yaml.load(yamlContent) as any;

let sql = `-- Generated SQL for structured lesson content
-- Generated at ${new Date().toISOString()}

-- Start a transaction
BEGIN;

`;

// Process each lesson
for (const lesson of data.lessons) {
  if (!lesson.id && !lesson.slug) {
    console.warn('Skipping lesson with no ID or slug');
    continue;
  }

  const whereClause = lesson.id
    ? `id = '${lesson.id}'`
    : `slug = '${lesson.slug}'`;

  // Update bunny video fields
  if (lesson.bunny_video) {
    sql += `
-- Update bunny video information for lesson ${lesson.id || lesson.slug}
UPDATE payload.course_lessons
SET 
  bunny_video_id = '${lesson.bunny_video.video_id}',
  bunny_library_id = '${lesson.bunny_video.library_id || '264486'}'
WHERE ${whereClause};
`;
  }

  // Update todo items
  if (lesson.todo_items) {
    sql += `
-- Update todo items for lesson ${lesson.id || lesson.slug}
UPDATE payload.course_lessons
SET 
  todo_complete_quiz = ${lesson.todo_items.complete_quiz || false},
  todo_watch_content = ${lesson.todo_items.watch_content ? `'${lesson.todo_items.watch_content}'` : 'NULL'},
  todo_read_content = ${lesson.todo_items.read_content ? `'${lesson.todo_items.read_content}'` : 'NULL'},
  todo_course_project = ${lesson.todo_items.course_project ? `'${lesson.todo_items.course_project}'` : 'NULL'}
WHERE ${whereClause};
`;
  }

  // Process downloads
  if (lesson.downloads && lesson.downloads.length > 0) {
    sql += `
-- Get the lesson ID for ${lesson.id || lesson.slug}
DO $$
DECLARE
  lesson_id UUID;
BEGIN
  SELECT id INTO lesson_id FROM payload.course_lessons WHERE ${whereClause} LIMIT 1;
  
  IF lesson_id IS NOT NULL THEN
`;

    for (const download of lesson.downloads) {
      const downloadId = uuidv4();

      sql += `
    -- Insert download: ${download.filename}
    INSERT INTO payload.downloads (
      id,
      filename,
      url,
      description,
      lesson_id,
      created_at,
      updated_at
    ) VALUES (
      '${downloadId}',
      '${download.filename}',
      '${download.url}',
      ${download.description ? `'${download.description.replace(/'/g, "''")}'` : 'NULL'},
      lesson_id,
      NOW(),
      NOW()
    );
    
    -- Create relationship between lesson and download
    INSERT INTO payload.course_lessons_downloads (
      id,
      lesson_id,
      download_id,
      created_at,
      updated_at
    ) VALUES (
      '${uuidv4()}',
      lesson_id,
      '${downloadId}',
      NOW(),
      NOW()
    );
`;
    }

    sql += `
  END IF;
END $$;
`;
  }
}

sql += `
-- Commit the transaction
COMMIT;
`;

// Write the SQL to a file
const outputDir = path.join(__dirname, '../../src/data/processed/sql');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sqlOutputPath = path.join(outputDir, '08-lesson-enhancements.sql');
fs.writeFileSync(sqlOutputPath, sql);
console.log(`SQL generated and saved to ${sqlOutputPath}`);
```

### 5. Update Payload Collections

#### 5.1 Create Downloads Collection

Create the Downloads collection in Payload:

```typescript
// apps/payload/src/collections/Downloads.ts
import { CollectionConfig } from 'payload';

export const Downloads: CollectionConfig = {
  slug: 'downloads',
  labels: {
    singular: 'Download',
    plural: 'Downloads',
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'url', 'updatedAt'],
    description: 'Files available for download',
  },
  access: {
    read: () => true, // Public read access
  },
  fields: [
    {
      name: 'filename',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'Full URL to the file in R2 bucket',
      },
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'lesson',
      type: 'relationship',
      relationTo: 'course_lessons',
      hasMany: false,
    },
  ],
};
```

#### 5.2 Update CourseLessons Collection

Modify the CourseLessons collection to include the new structured fields:

```typescript
// Modify apps/payload/src/collections/CourseLessons.ts
// Add these fields to the fields array

// Add for video support
{
  name: 'bunny_video_id',
  type: 'text',
  label: 'Bunny.net Video ID',
  admin: {
    description: 'Video ID from Bunny.net (if this lesson includes a video)',
  },
},
{
  name: 'bunny_library_id',
  type: 'text',
  label: 'Bunny.net Library ID',
  defaultValue: '264486',
  admin: {
    description: 'Library ID from Bunny.net (defaults to main library)',
  },
},

// Add for structured to-do items
{
  name: 'todo_complete_quiz',
  type: 'checkbox',
  label: 'Todo: Complete Quiz',
  defaultValue: false,
},
{
  name: 'todo_watch_content',
  type: 'text',
  label: 'Todo: Watch Content',
},
{
  name: 'todo_read_content',
  type: 'text',
  label: 'Todo: Read Content',
},
{
  name: 'todo_course_project',
  type: 'text',
  label: 'Todo: Course Project',
},

// Add for downloads
{
  name: 'downloads',
  type: 'relationship',
  relationTo: 'downloads',
  hasMany: true,
  admin: {
    description: 'Files for download in this lesson',
  },
},
```

#### 5.3 Register the Downloads Collection

Register the new Downloads collection in the Payload config:

```typescript
// apps/payload/src/payload.config.ts
// Import the Downloads collection
import { Downloads } from './collections/Downloads';

// Add to collections array
export default buildConfig({
  collections: [
    // ... other collections
    Downloads,
  ],
  // ... rest of config
});
```

### 6. Update Frontend Components

Modify the LessonViewClient component to use the new structured fields:

```tsx
// Update apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx

// After the content section, add these components:

{
  /* Render Bunny.net Video if available */
}
{
  lesson.bunny_video_id && (
    <div className="my-6">
      <h3 className="mb-2 text-lg font-bold">{lesson.title} Video</h3>
      <div className="relative" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={`https://iframe.mediadelivery.net/embed/${lesson.bunny_library_id || '264486'}/${lesson.bunny_video_id}`}
          loading="lazy"
          style={{
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen={true}
          title={lesson.title}
        />
      </div>
    </div>
  );
}

{
  /* Render To-Do Items if any exist */
}
{
  (lesson.todo_complete_quiz ||
    lesson.todo_watch_content ||
    lesson.todo_read_content ||
    lesson.todo_course_project) && (
    <div className="my-6 rounded-lg border border-gray-200 p-4">
      <h3 className="mb-2 text-lg font-semibold">Lesson To-Do's</h3>

      {lesson.todo_complete_quiz && (
        <div className="mb-2">
          <h4 className="font-medium">To-Do</h4>
          <ul className="list-disc pl-5">
            <li>Complete the lesson quiz</li>
          </ul>
        </div>
      )}

      <div className="mb-2">
        <h4 className="font-medium">Watch</h4>
        <p>{lesson.todo_watch_content || 'None'}</p>
      </div>

      <div className="mb-2">
        <h4 className="font-medium">Read</h4>
        <p>{lesson.todo_read_content || 'None'}</p>
      </div>

      <div>
        <h4 className="font-medium">Course Project</h4>
        <p>{lesson.todo_course_project || 'None'}</p>
      </div>
    </div>
  );
}

{
  /* Render Downloads if available */
}
{
  lesson.downloads && lesson.downloads.length > 0 && (
    <div className="my-6">
      <h3 className="mb-2 text-lg font-semibold">Lesson Downloads</h3>
      <div className="space-y-2">
        {lesson.downloads.map((download, index) => {
          // Ensure we have a download with URL
          if (!download || !download.url) return null;

          return (
            <div
              key={index}
              className="flex items-center rounded-lg border border-gray-200 p-3"
            >
              <div className="flex-grow">
                <p className="font-medium">
                  {download.description || download.filename}
                </p>
              </div>
              <a
                href={download.url}
                download
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 7. Integration with Content Migration System

#### 7.1 Add Migration SQL File

Create a migration file to set up the new schema:

```typescript
// apps/payload/src/migrations/20250409_000001_add_lesson_enhancements.ts
import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/seed';
import fs from 'fs';
import path from 'path';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const sql = `
-- Add structured fields to course_lessons table
ALTER TABLE payload.course_lessons 
ADD COLUMN IF NOT EXISTS bunny_video_id TEXT,
ADD COLUMN IF NOT EXISTS bunny_library_id TEXT DEFAULT '264486',
ADD COLUMN IF NOT EXISTS todo_complete_quiz BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS todo_watch_content TEXT,
ADD COLUMN IF NOT EXISTS todo_read_content TEXT,
ADD COLUMN IF NOT EXISTS todo_course_project TEXT;

-- Create downloads table if it doesn't exist
CREATE TABLE IF NOT EXISTS payload.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  lesson_id UUID REFERENCES payload.course_lessons(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create relationship table for lessons and downloads
CREATE TABLE IF NOT EXISTS payload.course_lessons_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES payload.course_lessons(id) NOT NULL,
  download_id UUID REFERENCES payload.downloads(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lesson_id, download_id)
);
`;

  await payload.db.query(sql);
  payload.logger.info('Added lesson enhancement fields');
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  // Revert the changes
  const sql = `
ALTER TABLE payload.course_lessons 
DROP COLUMN IF EXISTS bunny_video_id,
DROP COLUMN IF EXISTS bunny_library_id,
DROP COLUMN IF EXISTS todo_complete_quiz,
DROP COLUMN IF EXISTS todo_watch_content,
DROP COLUMN IF EXISTS todo_read_content,
DROP COLUMN IF EXISTS todo_course_project;

DROP TABLE IF EXISTS payload.course_lessons_downloads;
DROP TABLE IF EXISTS payload.downloads;
`;

  await payload.db.query(sql);
  payload.logger.info('Removed lesson enhancement fields');
}
```

#### 7.2 Update Content Migration Process

Add a step to process the lesson enhancements YAML file:

```typescript
// apps/payload/src/migrations/20250409_200000_process_content.ts
// Update seedFiles array to include the lesson enhancements SQL file
const seedFiles = [
  '01-courses.sql',
  '02-lessons.sql',
  '03-quizzes.sql',
  '04-questions.sql',
  '05-surveys.sql',
  '06-survey-questions.sql',
  '07-media.sql',
  '08-lesson-enhancements.sql', // Add this line
  // ... other seed files
];
```

### 8. Testing and Validation Strategy

#### 8.1 Test Database Migrations

1. Verify that the schema changes are applied correctly:

   - Check that new columns are added to the course_lessons table
   - Check that the downloads table is created
   - Check that the course_lessons_downloads table is created

2. Verify data migrations:
   - Check that bunny video fields are populated
   - Check that to-do items are populated
   - Check that downloads are created and linked to lessons

#### 8.2 Test Payload CMS Admin Interface

1. Verify that the new fields appear in the Payload CMS admin interface
2. Test creating and editing lessons with the new fields
3. Test uploading files to the downloads collection

#### 8.3 Test Frontend Components

1. Verify that bunny.net videos are displayed correctly
2. Verify that to-do items are displayed correctly
3. Verify that downloads are listed correctly and links work

### 9. Implementation Timeline

#### Phase 1: Schema and Collection Updates (Day 1)

- Create the Downloads collection
- Update the CourseLessons collection
- Add the schema migration

#### Phase 2: Content Analysis and YAML Generation (Day 1-2)

- Develop the content analysis script
- Generate initial YAML files
- Review and refine the YAML content

#### Phase 3: SQL Generation and Migration (Day 2)

- Develop the SQL generator script
- Add the generated SQL to the migration process
- Test the migration

#### Phase 4: Frontend Updates (Day 3)

- Update the LessonViewClient component
- Test the frontend changes

#### Phase 5: Testing and Deployment (Day 3-4)

- Comprehensive testing of all components
- Fix any issues that arise
- Deploy to production

## Conclusion

This implementation plan provides a structured approach to enhancing course lessons with dedicated fields for bunny.net videos, to-do items, and file downloads. By using a YAML-based, SQL-first approach, we maintain a clean separation between content definitions and migration logic, making the system more maintainable and extensible in the future.

The plan addresses all the requirements while leveraging existing infrastructure such as the R2 downloads bucket and the content migration system.
