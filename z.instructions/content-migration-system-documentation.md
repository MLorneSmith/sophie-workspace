# Content Migration System Documentation

This document provides a detailed explanation of the content migration system implemented in our Makerkit-based Next.js 15 application with Payload CMS. This documentation is intended for AI coding assistants to better understand how the content migration system works.

## Table of Contents

- [System Overview](#system-overview)
- [Key Components](#key-components)
- [Migration Workflow](#migration-workflow)
- [Data Flow](#data-flow)
- [Directory Structure](#directory-structure)
- [Payload Collections](#payload-collections)
- [ID Management and Relations](#id-management-and-relations)
- [Quiz System Architecture](#quiz-system-architecture)
- [Survey System Architecture](#survey-system-architecture)
- [Verification and Repair Mechanisms](#verification-and-repair-mechanisms)
- [Edge Case Handling](#edge-case-handling)
- [Extending the System](#extending-the-system)
- [Troubleshooting](#troubleshooting)

## System Overview

The content migration system is a sophisticated two-phase process designed to populate Payload CMS collections in our Next.js application with content from various sources. The system is built around the following principles:

1. **Separation of Concerns**: Clear distinction between data processing and database migration
2. **Single Source of Truth**: Static definitions serve as the authoritative source for content structure
3. **Data Integrity**: Comprehensive validation and verification throughout the process
4. **Relationship Consistency**: Automated handling of complex relationships between content types
5. **Recovery Mechanisms**: Built-in repair scripts for addressing edge cases and inconsistencies

The system leverages a Turborepo architecture with two key applications:

- **Web App** (`apps/web`): The main Makerkit-based Next.js 15 application
- **Payload App** (`apps/payload`): The Payload CMS instance for content management

These apps share a single Supabase PostgreSQL database, with Payload content stored in the `payload` schema and web app data in the `public` schema.

## Key Components

1. **Raw Data Sources**:

   - Markdown files (`.mdoc`)
   - YAML configurations
   - Static TypeScript definitions

2. **Processing Pipeline**:

   - Raw data processors
   - SQL seed generators
   - Definition validators

3. **Migration System**:

   - Supabase migration files
   - Payload migration scripts
   - SQL seed runners

4. **Verification Tools**:

   - Relationship validators
   - Schema verifiers
   - Integrity checkers

5. **Repair Mechanisms**:
   - Edge case fixers
   - Relationship repairers
   - ID consistency enforcers

## Migration Workflow

The content migration process consists of two main phases:

### Phase 1: Data Processing (One-time)

This phase processes raw data files into a standardized format that can be used by the migration scripts. It's designed to be run only when the raw data changes.

1. **Input**: Raw data files (`.mdoc`, `.yaml`, etc.) and static definitions
2. **Process**:
   - Validation of raw data integrity
   - Transformation into SQL insert statements
   - Generation of relationship mappings
3. **Output**: SQL seed files and JSON data ready for migration

### Phase 2: Database Migration (Repeatable)

This phase uses the processed data to populate the database tables. It can be run multiple times without reprocessing the raw data.

1. **Input**: Processed SQL seed files and JSON data
2. **Process**:
   - Database schema creation
   - Table population via SQL inserts
   - Relationship establishment
   - Verification and repair
3. **Output**: Populated database tables with proper relationships

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                 │     │                  │     │                   │
│   Raw Data      │────▶│  Data Processing │────▶│  Processed Data   │
│   (.mdoc, .yaml)│     │   Scripts        │     │  (SQL, JSON)      │
│                 │     │                  │     │                   │
└─────────────────┘     └──────────────────┘     └─────────┬─────────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                 │     │                  │     │                   │
│  Verification & │◀────│  Database        │◀────│  Migration        │
│  Repair Scripts │     │  (Supabase)      │     │  Scripts          │
│                 │     │                  │     │                   │
└─────────────────┘     └──────────────────┘     └───────────────────┘
```

## Directory Structure

```
packages/content-migrations/
├── src/
│   ├── config/           # Configuration files and paths
│   ├── data/             # Data files
│   │   ├── raw/          # Raw data files (.mdoc, .yaml)
│   │   ├── definitions/  # TypeScript definitions (single source of truth)
│   │   ├── mappings/     # ID mappings for relationships
│   │   └── processed/    # Processed data ready for migration
│   │       ├── sql/      # SQL seed files
│   │       └── json/     # JSON data for direct insertion
│   ├── scripts/          # Migration scripts
│   │   ├── core/         # Core migration scripts
│   │   ├── process/      # Data processing scripts
│   │   ├── repair/       # Repair scripts for edge cases
│   │   ├── sql/          # SQL-related scripts
│   │   │   └── generators/ # SQL generation scripts
│   │   └── verification/ # Verification scripts
│   └── utils/            # Utility functions
└── README.md             # Package documentation
```

## Payload Collections

The system manages the following Payload CMS collections:

1. **Courses**: Course metadata and structure
2. **Course Lessons**: Individual lessons within courses
3. **Course Quizzes**: Quizzes associated with lessons
4. **Quiz Questions**: Questions within quizzes
5. **Surveys**: User surveys for feedback
6. **Survey Questions**: Questions within surveys
7. **Documentation**: Technical documentation pages
8. **Posts**: Blog posts

Each collection has specific relationships and field requirements that must be maintained during migration.

## ID Management and Relations

A critical aspect of the content migration system is managing IDs consistently across related content types. The system employs several strategies:

1. **Static UUID Assignment**: Predefined UUIDs in static definitions

   ```typescript
   const QUIZZES: Record<string, QuizDefinition> = {
     'basic-graphs-quiz': {
       id: 'c11dbb26-7561-4d12-88c8-141c653a43fd',
       // Other properties...
     },
   };
   ```

2. **ID Mapping Files**: JSON files that map between different ID systems

   ```json
   {
     "survey1": "uuid-for-survey-1",
     "question1": "uuid-for-question-1"
   }
   ```

3. **Relationship Tables**: Dedicated tables for managing many-to-many relationships

   ```sql
   CREATE TABLE payload.quiz_questions_rels (
     id UUID PRIMARY KEY,
     _parent_id UUID REFERENCES payload.quiz_questions(id),
     field TEXT,
     value UUID
   );
   ```

4. **Consistent ID Enforcement**: Scripts that ensure IDs are consistent across tables
   ```typescript
   // From fix-quiz-id-consistency.ts
   const CORRECT_QUIZ_IDS: Record<string, string> = {
     'basic-graphs-quiz': 'c11dbb26-7561-4d12-88c8-141c653a43fd',
     // Other mappings...
   };
   ```

## Quiz System Architecture

The quiz system is particularly complex due to its relationship structure:

1. **Courses contain Lessons**
2. **Lessons may have optional Quizzes**
3. **Quizzes contain multiple Questions**

To maintain this structure, the system:

1. Uses a `lesson-quiz-relations.ts` file to define which lessons have quizzes
2. Ensures consistent quiz IDs across all related tables
3. Maintains bidirectional relationships between quizzes and questions
4. Uses a dedicated repair script to fix quiz ID inconsistencies

The single source of truth for quiz data is the `quizzes.ts` file, which defines:

- Quiz metadata (title, description, passing score)
- Quiz questions and correct answers
- Relationships between quizzes and questions

## Survey System Architecture

Similar to quizzes, surveys have a complex relationship structure:

1. **Surveys contain multiple Questions**
2. **Questions can be associated with different question types**
3. **User responses are stored in separate tables**

The survey system maintains:

- Bidirectional relationships between surveys and questions
- Question order and sequence
- Question type-specific metadata

## Verification and Repair Mechanisms

The system includes robust verification and repair mechanisms:

### Verification Scripts

1. **verify-quiz-system-integrity.ts**: Ensures quiz IDs are consistent across all tables
2. **verify-schema.ts**: Verifies that required database schemas exist
3. **verify-table.ts**: Checks for the existence of required tables
4. **verify-all.ts**: Comprehensive verification of all relationships

### Repair Scripts

1. **repair-edge-cases.ts**: Fixes common edge cases like missing bidirectional relationships
2. **fix-relationships-direct.ts**: Corrects relationship inconsistencies
3. **fix-survey-questions-population.ts**: Ensures survey questions are properly populated
4. **fix-quiz-id-consistency.ts**: Maintains quiz ID consistency across tables

## Edge Case Handling

The system addresses several edge cases:

1. **Missing Bidirectional Relationships**: Automatically creates missing relationship records

   ```sql
   WITH questions_to_link AS (
     SELECT sq.id as question_id, sqr.surveys_id as survey_id
     FROM payload.survey_questions sq
     JOIN payload.survey_questions_rels sqr ON sq.id = sqr._parent_id
     WHERE sqr.surveys_id IS NOT NULL
     AND NOT EXISTS (/* Check for existing relationship */)
   )
   INSERT INTO payload.surveys_rels (id, _parent_id, field, value, updated_at, created_at)
   SELECT
     gen_random_uuid(),
     survey_id,
     'questions',
     question_id,
     NOW(),
     NOW()
   FROM questions_to_link;
   ```

2. **Incorrect Field Names**: Fixes field name inconsistencies in relationship tables

   ```sql
   UPDATE payload.quiz_questions_rels
   SET field = 'quiz_id'
   WHERE field = 'quiz_id_id';
   ```

3. **Missing Columns**: Adds required columns when they're missing
   ```sql
   IF NOT EXISTS (
     SELECT FROM information_schema.columns
     WHERE table_schema = 'payload'
     AND table_name = 'quiz_questions'
     AND column_name = 'quiz_id_id'
   ) THEN
     ALTER TABLE "payload"."quiz_questions"
     ADD COLUMN "quiz_id_id" uuid REFERENCES "payload"."course_quizzes"("id") ON DELETE SET NULL;
   END IF;
   ```

## Extending the System

To extend the content migration system for new content types:

1. **Add Raw Data**: Place new raw data files in the appropriate directory under `src/data/raw/`

2. **Create Definition Files**: Define the structure of the new content type

   ```typescript
   export const NEW_CONTENT_TYPE: Record<string, NewContentTypeDefinition> = {
     'item-1': {
       id: 'generate-a-uuid',
       title: 'Item 1',
       // Other properties...
     },
   };
   ```

3. **Create SQL Generator**: Add a new generator in `src/scripts/sql/generators/`

   ```typescript
   export function generateNewContentTypeSql(): string {
     // Generate SQL for the new content type
   }
   ```

4. **Update the Processing Script**: Modify `process-raw-data.ts` to include the new content type

   ```typescript
   // Add to processRawData function
   await generateNewContentTypeSqlFiles();
   ```

5. **Add Verification**: Create verification scripts for the new content type

   ```typescript
   export function verifyNewContentTypeIntegrity(): boolean {
     // Verify integrity of the new content type
   }
   ```

6. **Create Repair Scripts**: Add repair scripts if needed
   ```typescript
   export function fixNewContentTypeIssues(): void {
     // Fix issues with the new content type
   }
   ```

## Troubleshooting

Common issues and solutions:

1. **Quiz ID Inconsistencies**: Run the fix-quiz-id-consistency.ts script to ensure quiz IDs are consistent across all tables.

2. **Missing Relationships**: The repair-edge-cases.ts script fixes most relationship issues. If problems persist, investigate the specific relationship using SQL queries.

3. **Migration Failures**: Check the migration logs in z.migration-logs/ for detailed error information. The logs include both summary and detailed information about each step of the migration process.

4. **Schema Verification Failures**: Ensure that all required schemas exist by running the verify:schema script. If schemas are missing, check the migration scripts for errors.

5. **Table Verification Failures**: Verify table existence with the verify:table script. If tables are missing, ensure that the correct migration scripts are being run.

6. **Data Processing Errors**: If raw data processing fails, check the raw data files for format errors or inconsistencies. The validation scripts can help identify specific issues.

---

This documentation provides a comprehensive overview of the content migration system. By understanding the architecture, workflow, and key components, AI coding assistants can effectively assist with maintaining and extending the system.
