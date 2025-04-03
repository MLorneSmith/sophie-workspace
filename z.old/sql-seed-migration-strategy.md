# SQL Seed Migration Strategy

## Overview

This document outlines our strategy for shifting from TypeScript/JavaScript scripts to SQL seed files for adding content to Payload CMS. This approach will make our content migrations more reliable, maintainable, and performant.

## Current State Analysis

Our current content migration system:

1. Uses TypeScript scripts to read `.mdoc` files from `apps/payload/data/courses/`
2. Processes the content (parsing Markdown, converting to Lexical format, etc.)
3. Inserts the processed data directly into the Postgres database
4. Handles relationships between entities (courses, lessons, quizzes, questions)

The main issues with this approach:

1. Complex TypeScript code that's hard to maintain
2. Dependency on multiple libraries (matter, lexical, etc.)
3. Potential for race conditions when creating related entities
4. Difficulty in tracking what content has been migrated
5. Verification issues (as seen in the migration log error with `psql`)

## Migration Strategy

We'll use a phased approach to transition from scripts to SQL seed files:

### Phase 1: Infrastructure Setup

1. **Create SQL Seed Directory Structure**

   ```
   apps/payload/src/migrations/
   ├── schema/           # Schema migrations (existing)
   └── seed/
       ├── 01-courses.sql
       ├── 02-lessons.sql
       ├── 03-quizzes.sql
       ├── 04-questions.sql
       ├── 05-surveys.sql
       └── 06-posts.sql
   ```

2. **Create SQL Execution Utility**

   - Develop a Node.js utility to execute SQL files
   - This will replace the need for `psql` in the migration process

   ```typescript
   // packages/content-migrations/src/utils/execute-sql-file.ts
   import dotenv from 'dotenv';
   import fs from 'fs';
   import pg from 'pg';

   export async function executeSqlFile(filePath: string): Promise<void> {
     // Load environment variables
     dotenv.config();

     // Get database connection string
     const databaseUri = process.env.DATABASE_URI;
     if (!databaseUri) {
       throw new Error('DATABASE_URI environment variable is not set');
     }

     // Read SQL file
     const sql = fs.readFileSync(filePath, 'utf8');

     // Connect to database
     const client = new pg.Client({ connectionString: databaseUri });
     await client.connect();

     try {
       // Execute SQL
       await client.query(sql);
       console.log(`Successfully executed SQL file: ${filePath}`);
     } finally {
       await client.end();
     }
   }
   ```

3. **Update Reset Script**
   - Modify `reset-and-migrate.ps1` to use the new SQL execution utility
   - Replace `psql` commands with Node.js script calls

### Phase 2: Content Conversion

1. **Course Data (Simple)**

   - Expand the existing `seed-course-data.sql` to include all course metadata
   - Use fixed UUIDs for stable references

2. **Lessons (Medium Complexity)**

   - Create `02-lessons.sql` with INSERT statements for each lesson
   - Store Lexical JSON content directly in SQL
   - Example structure:

   ```sql
   -- 02-lessons.sql
   INSERT INTO payload.course_lessons (
     id, title, slug, description, content, lesson_number, course_id, created_at, updated_at
   ) VALUES
   ('11111111-1111-1111-1111-111111111111', 'Welcome to DDM', 'lesson-0',
    'A taster. A preview. An overview...',
    '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Welcome to Decks for Decision Makers!","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}',
    101, '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', NOW(), NOW()),
   -- Additional lessons...
   ;

   -- Create relationship entries
   INSERT INTO payload.course_lessons_rels (id, _parent_id, field, value, created_at, updated_at)
   VALUES
   (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'course', '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8', NOW(), NOW()),
   -- Additional relationships...
   ;
   ```

3. **Quizzes (Medium Complexity)**

   - Create `03-quizzes.sql` with INSERT statements for each quiz
   - Use fixed UUIDs for stable references

   ```sql
   -- 03-quizzes.sql
   INSERT INTO payload.course_quizzes (
     id, title, slug, description, passing_score, created_at, updated_at
   ) VALUES
   ('22222222-2222-2222-2222-222222222222', 'Standard Graphs Quiz', 'basic-graphs-quiz',
    'Test your knowledge of standard graphs', 70, NOW(), NOW()),
   -- Additional quizzes...
   ;
   ```

4. **Quiz Questions (High Complexity)**

   - Create `04-questions.sql` with INSERT statements for questions and options
   - Handle multi-answer vs. single-answer questions

   ```sql
   -- 04-questions.sql
   -- Insert questions
   INSERT INTO payload.quiz_questions (
     id, question, quiz_id, type, explanation, "order", created_at, updated_at
   ) VALUES
   ('33333333-3333-3333-3333-333333333333',
    'What chart type best communicates the ''Part-to-Whole'' relationship?',
    '22222222-2222-2222-2222-222222222222', 'multiple_choice', '', 0, NOW(), NOW()),
   -- Additional questions...
   ;

   -- Insert options
   INSERT INTO payload.quiz_questions_options (
     id, _order, _parent_id, text, is_correct, created_at, updated_at
   ) VALUES
   (gen_random_uuid(), 0, '33333333-3333-3333-3333-333333333333', 'Line Charts', false, NOW(), NOW()),
   (gen_random_uuid(), 1, '33333333-3333-3333-3333-333333333333', 'Scatter Plots', false, NOW(), NOW()),
   (gen_random_uuid(), 2, '33333333-3333-3333-3333-333333333333', 'Maps', false, NOW(), NOW()),
   (gen_random_uuid(), 3, '33333333-3333-3333-3333-333333333333', 'Box Plot', false, NOW(), NOW()),
   (gen_random_uuid(), 4, '33333333-3333-3333-3333-333333333333', 'Bar charts', true, NOW(), NOW()),
   -- Additional options...
   ;

   -- Create relationships
   INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, created_at, updated_at)
   VALUES
   (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 'quiz_id', '22222222-2222-2222-2222-222222222222', NOW(), NOW()),
   -- Additional relationships...
   ;

   INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, created_at, updated_at)
   VALUES
   (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'questions', '33333333-3333-3333-3333-333333333333', NOW(), NOW()),
   -- Additional relationships...
   ;
   ```

### Phase 3: Content Conversion Automation

For the initial conversion, we'll need to create a one-time script that:

1. **Reads existing .mdoc files**
2. **Generates SQL INSERT statements**
3. **Writes SQL files to the seed directory**

```typescript
// packages/content-migrations/src/scripts/generate-sql-seed-files.ts
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { $convertFromMarkdownString } from '@payloadcms/richtext-lexical';
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

async function generateSqlSeedFiles() {
  // Define paths
  const lessonsDir = path.resolve('apps/payload/data/courses/lessons');
  const quizzesDir = path.resolve('apps/payload/data/courses/quizzes');
  const sqlSeedDir = path.resolve('apps/payload/src/migrations/seed');

  // Ensure SQL seed directory exists
  if (!fs.existsSync(sqlSeedDir)) {
    fs.mkdirSync(sqlSeedDir, { recursive: true });
  }

  // Generate lessons SQL
  const lessonsSql = generateLessonsSql(lessonsDir);
  fs.writeFileSync(path.join(sqlSeedDir, '02-lessons.sql'), lessonsSql);

  // Generate quizzes SQL
  const quizzesSql = generateQuizzesSql(quizzesDir);
  fs.writeFileSync(path.join(sqlSeedDir, '03-quizzes.sql'), quizzesSql);

  // Generate questions SQL
  const questionsSql = generateQuestionsSql(quizzesDir);
  fs.writeFileSync(path.join(sqlSeedDir, '04-questions.sql'), questionsSql);

  console.log('SQL seed files generated successfully!');
}

// Helper functions to generate SQL for each entity type
function generateLessonsSql(lessonsDir: string): string {
  // Implementation details...
}

function generateQuizzesSql(quizzesDir: string): string {
  // Implementation details...
}

function generateQuestionsSql(quizzesDir: string): string {
  // Implementation details...
}

// Run the generator
generateSqlSeedFiles().catch(console.error);
```

### Phase 4: Integration with Migration Process

1. **Update `reset-and-migrate.ps1`**

   ```powershell
   # In reset-and-migrate.ps1
   Write-Host "Running seed data scripts..." -ForegroundColor Cyan

   # Execute SQL seed files in order
   $seedFiles = @(
     "apps/payload/src/migrations/seed/01-courses.sql",
     "apps/payload/src/migrations/seed/02-lessons.sql",
     "apps/payload/src/migrations/seed/03-quizzes.sql",
     "apps/payload/src/migrations/seed/04-questions.sql",
     "apps/payload/src/migrations/seed/05-surveys.sql",
     "apps/payload/src/migrations/seed/06-posts.sql"
   )

   foreach ($file in $seedFiles) {
     if (Test-Path $file) {
       Write-Host "  Seeding from $file..." -ForegroundColor Yellow
       node packages/content-migrations/src/utils/run-sql-file.js $file
     }
   }
   ```

2. **Create a Node.js Script to Execute SQL Files**

   ```typescript
   // packages/content-migrations/src/utils/run-sql-file.js
   import { executeSqlFile } from './execute-sql-file.js';

   const filePath = process.argv[2];
   if (!filePath) {
     console.error('No SQL file path provided');
     process.exit(1);
   }

   executeSqlFile(filePath)
     .then(() => {
       console.log(`Successfully executed SQL file: ${filePath}`);
     })
     .catch((error) => {
       console.error(`Error executing SQL file: ${filePath}`, error);
       process.exit(1);
     });
   ```

3. **Replace `psql` Verification with Node.js Script**

   ```typescript
   // packages/content-migrations/src/scripts/verification/verify-database-schema.js
   import dotenv from 'dotenv';
   import pg from 'pg';

   async function verifyDatabaseSchema() {
     // Load environment variables
     dotenv.config();

     // Get database connection string
     const databaseUri = process.env.DATABASE_URI;
     if (!databaseUri) {
       throw new Error('DATABASE_URI environment variable is not set');
     }

     // Connect to database
     const client = new pg.Client({ connectionString: databaseUri });
     await client.connect();

     try {
       // Check if payload schema exists
       const schemaResult = await client.query(
         "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'payload'",
       );

       if (schemaResult.rows.length === 0) {
         console.error('❌ Payload schema does not exist');
         process.exit(1);
       }

       console.log('✅ Payload schema exists');

       // Check if tables exist
       const tablesResult = await client.query(
         "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'payload'",
       );

       const tableCount = parseInt(tablesResult.rows[0].count);
       if (tableCount === 0) {
         console.error('❌ No tables found in payload schema');
         process.exit(1);
       }

       console.log(`✅ Found ${tableCount} tables in payload schema`);

       // List all tables
       const listTablesResult = await client.query(
         "SELECT table_name FROM information_schema.tables WHERE table_schema = 'payload' ORDER BY table_name",
       );

       console.log('Tables in payload schema:');
       listTablesResult.rows.forEach((row) => {
         console.log(`  - ${row.table_name}`);
       });
     } finally {
       await client.end();
     }
   }

   verifyDatabaseSchema().catch((error) => {
     console.error('Database verification failed:', error);
     process.exit(1);
   });
   ```

### Phase 5: Hybrid Approach for Complex Content

For content that requires complex processing (like converting Markdown to Lexical format), we can use a hybrid approach:

1. **Pre-processing Script**

   - Create a script that reads `.mdoc` files
   - Processes the content (converts Markdown to Lexical, etc.)
   - Generates SQL INSERT statements
   - Writes the SQL to a file

2. **SQL Execution**
   - Execute the generated SQL file as part of the migration process

This approach gives us the best of both worlds:

- Complex processing in TypeScript/JavaScript
- Reliable database operations with SQL
- Clear separation of concerns

## Implementation Timeline

1. **Week 1: Infrastructure Setup**

   - Create SQL seed directory structure
   - Develop SQL execution utility
   - Update reset script to use Node.js instead of psql

2. **Week 2: Content Conversion**

   - Convert course data to SQL
   - Convert lessons to SQL
   - Convert quizzes to SQL
   - Convert quiz questions to SQL

3. **Week 3: Automation and Integration**

   - Develop content conversion automation script
   - Integrate with migration process
   - Test end-to-end migration

4. **Week 4: Refinement and Documentation**
   - Refine SQL seed files
   - Document the new approach
   - Train team on the new process

## Benefits of This Approach

1. **Reliability**: SQL transactions ensure atomicity
2. **Performance**: Direct SQL operations are faster than ORM
3. **Maintainability**: SQL is more declarative and easier to understand
4. **Traceability**: Version control for content changes
5. **Consistency**: Ensures data integrity with proper constraints
6. **Portability**: SQL is database-agnostic (mostly)
7. **Simplicity**: Reduces dependency on complex JavaScript libraries

## Potential Challenges and Solutions

1. **Challenge**: Complex content processing (Markdown to Lexical)
   **Solution**: Use hybrid approach with pre-processing scripts

2. **Challenge**: Maintaining relationships between entities
   **Solution**: Use fixed UUIDs and proper ordering of SQL files

3. **Challenge**: SQL syntax differences between databases
   **Solution**: Stick to standard SQL features or use Postgres-specific features with clear documentation

4. **Challenge**: Large content files becoming unwieldy
   **Solution**: Split SQL files by entity type and use includes/imports
