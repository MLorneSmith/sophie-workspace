# Lesson Todo SQL Generation Implementation Plan

## Problem Statement

While the YAML file is correctly populated with all todo content from the HTML file, the content isn't making it into the database because the SQL generation process doesn't include the todo fields in the SQL INSERT statements. The `apps/payload/src/seed/sql/02-lessons.sql` file doesn't include the `todo_watch_content`, `todo_read_content`, and `todo_course_project` columns in the INSERT statements, which explains why these fields remain NULL in the database.

## Current State

1. The HTML parsing correctly extracts todo content from `packages/content-migrations/src/data/raw/lesson-todo-content.html`
2. The YAML file at `packages/content-migrations/src/data/raw/lesson-metadata.yaml` is properly populated with this content
3. The SQL generation script doesn't include these fields when creating SQL seed files
4. As a result, the database tables don't receive the todo content

## Implementation Plan

### 1. Analysis Phase

1. **Identify the SQL Generation Scripts**

   - Examine `packages/content-migrations/src/scripts/sql/updated-generate-sql-seed-files.ts` which appears to be the script that generates the SQL seed files
   - Review how it processes the lesson metadata from the YAML file and converts it to SQL
   - Determine where in the process the todo fields are being omitted

2. **Understand Current Field Mapping**

   - Identify how other fields from the YAML file are mapped to SQL columns
   - Check if there's a specific mapping or filtering process that's excluding the todo fields

3. **Verify Database Schema**
   - Confirm that the `payload.course_lessons` table has the following columns: `todo`, `todo_complete_quiz`, `todo_watch_content`, `todo_read_content`, and `todo_course_project`

### 2. Implementation Phase

1. **Update SQL Generation Script**

   - Modify `packages/content-migrations/src/scripts/sql/updated-generate-sql-seed-files.ts` to include the todo fields in the SQL generation
   - Add the following fields to the SQL INSERT statement template:
     ```
     todo,
     todo_complete_quiz,
     todo_watch_content,
     todo_read_content,
     todo_course_project
     ```
   - Ensure the values from the YAML file are properly formatted for SQL insertion (especially the JSON Lexical format)

2. **Create SQL Update Script for Existing Lessons**

   - Create a new script to update existing records in the database
   - This script should read the YAML file and generate UPDATE statements for each lesson
   - Example:
     ```sql
     UPDATE payload.course_lessons
     SET todo = 'JSON_CONTENT',
         todo_complete_quiz = true,
         todo_watch_content = 'JSON_CONTENT',
         todo_read_content = 'JSON_CONTENT',
         todo_course_project = 'JSON_CONTENT'
     WHERE id = 'LESSON_ID';
     ```

3. **Update SQL Seed File Template**
   - If there's a template file used for generating the SQL, update it to include the todo fields
   - Ensure the template handles Lexical JSON format correctly (with proper escaping)

### 3. Testing Phase

1. **Generate Updated SQL Files**

   - Run the modified SQL generation script to create updated SQL seed files
   - Verify the generated files include the todo fields
   - Check for SQL syntax errors or formatting issues

2. **Test SQL in Development Environment**

   - Apply the SQL to a development database
   - Verify the database records contain the correct todo content
   - Check for any errors during SQL execution

3. **Run Full Migration Process**
   - Run the complete `reset-and-migrate.ps1` script
   - Verify that the todo fields are properly populated in the database

### 4. Validation Phase

1. **Create Validation Script**

   - Create a script to compare the todo content in the YAML file with the database records
   - Verify all fields are correctly transferred from YAML to database

2. **Add to Existing Verification Process**
   - Update the existing verification scripts to check for the presence of todo content in the database

### 5. Documentation

1. **Update Implementation Documentation**

   - Create `z.plan/lesson-todo-sql-generation-implementation-plan.md` (this document)
   - Explain the changes made and how the SQL generation now includes the todo fields

2. **Update Migration Documentation**
   - Update any relevant documentation about the migration process
   - Highlight the addition of todo fields to the SQL generation

## Implementation Details

### Modifying SQL Generation

The key changes will be in the SQL generation function that creates the lesson insert statements. Here's a pseudo-code example of the required changes:

```typescript
// In the function that generates SQL for lessons
function generateLessonSql(lesson) {
  const fields = [
    'id',
    'title',
    'slug',
    'description',
    'content',
    'lesson_number',
    'estimated_duration',
    'course_id',
    'featured_image_id',
    'quiz_id',
    'quiz_id_id',
    // Add new todo fields
    'todo',
    'todo_complete_quiz',
    'todo_watch_content',
    'todo_read_content',
    'todo_course_project',
    'created_at',
    'updated_at',
  ];

  const values = [
    `'${lesson.id}'`,
    `'${escapeSql(lesson.title)}'`,
    `'${lesson.slug}'`,
    `'${escapeSql(lesson.description)}'`,
    `'${escapeSql(JSON.stringify(lesson.content))}'`,
    lesson.lessonNumber,
    lesson.lessonLength || 0,
    `'${lesson.courseId}'`,
    lesson.featuredImageId ? `'${lesson.featuredImageId}'` : 'NULL',
    lesson.quizId ? `'${lesson.quizId}'` : 'NULL',
    lesson.quizId ? `'${lesson.quizId}'` : 'NULL',
    // Add values for new todo fields
    lesson.todoFields?.todo ? `'${escapeSql(lesson.todoFields.todo)}'` : 'NULL',
    lesson.todoFields?.completeQuiz ? 'true' : 'false',
    lesson.todoFields?.watchContent
      ? `'${escapeSql(lesson.todoFields.watchContent)}'`
      : 'NULL',
    lesson.todoFields?.readContent
      ? `'${escapeSql(lesson.todoFields.readContent)}'`
      : 'NULL',
    lesson.todoFields?.courseProject
      ? `'${escapeSql(lesson.todoFields.courseProject)}'`
      : 'NULL',
    'NOW()',
    'NOW()',
  ];

  return `INSERT INTO payload.course_lessons (
    ${fields.join(',\n    ')}
  ) VALUES (
    ${values.join(',\n    ')}
  ) ON CONFLICT (id) DO NOTHING;`;
}
```

### Handling Lexical JSON Format

Special care must be taken to properly escape the Lexical JSON format strings:

```typescript
function escapeSql(str) {
  if (!str) return '';
  return str
    .replace(/'/g, "''") // Escape single quotes with double single quotes for SQL
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r'); // Escape carriage returns
}
```

## Timeline

1. Analysis Phase: 1-2 hours
2. Implementation Phase: 3-4 hours
3. Testing Phase: 2-3 hours
4. Validation Phase: 1-2 hours
5. Documentation: 1 hour

Total Estimated Time: 8-12 hours

## Next Steps

1. Review this plan for completeness and accuracy
2. Obtain approval for implementation
3. Proceed with the Analysis Phase
4. Make the necessary code changes in the SQL generation script
5. Test the changes in a development environment
6. Run the complete migration process to verify end-to-end functionality
