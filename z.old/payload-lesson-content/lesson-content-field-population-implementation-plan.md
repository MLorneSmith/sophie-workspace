# Lesson Content Field Population Implementation Plan

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Implementation Goals](#implementation-goals)
3. [New Field Implementation](#new-field-implementation)
4. [YAML Metadata Enhancement](#yaml-metadata-enhancement)
5. [SQL Generation Updates](#sql-generation-updates)
6. [Database Migration](#database-migration)
7. [Testing Strategy](#testing-strategy)
8. [Implementation Steps](#implementation-steps)

## Current State Analysis

### What's Working

- YAML metadata system infrastructure is in place
- `packages/content-migrations/src/data/raw/lesson-metadata.yaml` exists and contains basic lesson data
- SQL generation scripts can use the YAML data as a source of truth
- Downloads mapping has been fixed to assign lesson-specific downloads

### Current Issues

1. **Field Population Gaps**:

   - Many lessons have empty values for todo fields and Bunny video IDs
   - The YAML file has data for some lessons, but not all fields are populated

2. **Integration Consistency**:

   - The YAML-based generator may not be consistently used during migration
   - Fallback mechanism might not preserve YAML data if generation fails

3. **Field Coverage**:
   - Additional `todo` field needed for general lesson instructions
   - Need to ensure all fields are properly mapped between YAML and database

## Implementation Goals

1. Add a new general `todo` field to the lesson collection
2. Update the YAML metadata structure to include the new field
3. Modify SQL generation to include the new field
4. Create a database migration to add the column if it doesn't exist
5. Ensure all fields are consistently populated through the entire process
6. Test and verify the field population works end-to-end

## New Field Implementation

### Collection Schema Update

The CourseLessons collection needs to be updated in `apps/payload/src/collections/CourseLessons.ts`:

```typescript
{
  name: 'todo',
  type: 'text',
  label: 'Todo',
  admin: {
    description: 'General todo instructions for this lesson',
  },
}
```

### Database Schema Update

The new column needs to be added to the `payload.course_lessons` table:

```sql
ALTER TABLE payload.course_lessons
ADD COLUMN IF NOT EXISTS todo TEXT;
```

## YAML Metadata Enhancement

### Updated YAML Structure

The lesson-metadata.yaml file will be enhanced with the new field:

```yaml
todoFields:
  todo: 'General todo instructions for this lesson'
  completeQuiz: true/false
  watchContent: 'Instructions for watching content'
  readContent: 'Instructions for reading material'
  courseProject: 'Instructions for course project'
```

### YAML Generator Update

The `create-full-lesson-metadata.ts` script will need updates to extract todo content from lesson files:

```typescript
// Extract todo content
const todoMatch = content.match(
  /Todo\s*\n\s*-(.*?)(?:\n\s*\n|\n\s*(?:%|###))/s,
);
if (todoMatch && todoMatch[1]) {
  result.todo = todoMatch[1].trim().replace(/^\s*-\s*/, '');
}
```

## SQL Generation Updates

### Field Extraction in YAML-based Generator

The `yaml-generate-lessons-sql.ts` file will need updates to handle the new field:

```typescript
// Extract fields from metadata
const todo = lesson.todoFields?.todo || null;
// ... other fields ...

// Add to SQL INSERT statement
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
  ${bunnyLibraryId ? 'bunny_library_id,' : ''}
  ${todo ? 'todo,' : ''}
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
  ${bunnyLibraryId ? `'${bunnyLibraryId}',` : ''}
  ${todo ? `'${todo.replace(/'/g, "''")}'` : 'NULL'},
  ${todoCompleteQuiz ? 'TRUE' : 'FALSE'},
  ${todoWatchContent ? `'${todoWatchContent.replace(/'/g, "''")}'` : 'NULL'},
  ${todoReadContent ? `'${todoReadContent.replace(/'/g, "''")}'` : 'NULL'},
  ${todoCourseProject ? `'${todoCourseProject.replace(/'/g, "''")}'` : 'NULL'},
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;`;
```

## Database Migration

### Migration Script

Create or update a migration script to add the new column:

```typescript
// In a migration file like 20250430_120001_add_todo_column.ts
export async function up(db) {
  await db.query(`
    ALTER TABLE payload.course_lessons 
    ADD COLUMN IF NOT EXISTS todo TEXT;
  `);
}

export async function down(db) {
  await db.query(`
    ALTER TABLE payload.course_lessons 
    DROP COLUMN IF EXISTS todo;
  `);
}
```

## Testing Strategy

1. **Schema Verification**:

   - Verify the todo field appears in the Payload admin UI
   - Check that the database column exists after migration

2. **Data Population Testing**:

   - Manually update sample values in the YAML file
   - Run the migration to see if values are populated
   - Verify the database contains the expected values

3. **UI Display Testing**:

   - Check that the todo values appear correctly in the lesson view
   - Verify the field is properly displayed to users

4. **Error Handling Testing**:
   - Test the fallback mechanism if YAML generation fails
   - Verify that data is preserved during fallback

## Implementation Steps

1. **Schema Updates**:

   - Add the todo field to CourseLessons.ts collection
   - Create a migration to add the database column

2. **YAML Metadata**:

   - Update the lesson-metadata.yaml structure
   - Modify create-full-lesson-metadata.ts to extract todo content

3. **SQL Generation**:

   - Update yaml-generate-lessons-sql.ts to include the new field
   - Test the SQL generation directly

4. **Test the Complete Flow**:

   - Run the reset-and-migrate.ps1 script
   - Verify all fields are properly populated

5. **UI Verification**:
   - Check the lesson view in the web app
   - Verify all todo fields display correctly

This implementation plan outlines a comprehensive approach to addressing the lesson content field population issues and adding the new general todo field.
