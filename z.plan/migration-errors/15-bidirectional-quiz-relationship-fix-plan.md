# Bidirectional Quiz Relationship Fix Plan - 2025-04-23

## Problem Analysis

The content migration system is currently failing with the following error during the repair phase:

```
Error fixing edge cases: error: column qq.quiz_id_id does not exist
    at D:\SlideHeroes\App\repos\2025slideheroes\node_modules\.pnpm\pg-pool@3.8.0_pg@8.14.1\node_modules\pg-pool\index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at main (D:\SlideHeroes\App\repos\2025slideheroes\packages\content-migrations\src\scripts\repair\utilities\fix-edge-cases.ts:91:5) {
  length: 173,
  severity: 'ERROR',
  code: '42703',
  detail: undefined,
  hint: 'Perhaps you meant to reference the column "qqr.quiz_id_id".',
  position: '134',
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: undefined,
  table: undefined,
  column: undefined,
  dataType: undefined,
  constraint: undefined,
  file: 'parse_relation.c',
  line: '3665',
  routine: 'errorMissingColumn'
}
```

This error is occurring specifically in the script `packages/content-migrations/src/scripts/repair/utilities/fix-edge-cases.ts` when it tries to fix bidirectional relationships for quizzes and questions.

### Error Details

1. The error is a PostgreSQL error with code `42703` (undefined_column)
2. The error message specifically indicates that the column `qq.quiz_id_id` does not exist
3. PostgreSQL suggests that we might have meant to use `qqr.quiz_id_id` instead
4. The error occurs on line 91 of the `fix-edge-cases.ts` file

## Database Schema Investigation

I've examined the database schema using the PostgreSQL MCP server and confirmed:

### Quiz Questions Table (`payload.quiz_questions`)

```
Column Name      | Data Type
-----------------+-------------------------
id               | uuid
question         | text
options          | jsonb
correct_answer   | text
type             | text
explanation      | text
order            | integer
_order           | integer
media_id         | uuid
created_at       | timestamp with time zone
updated_at       | timestamp with time zone
path             | text
parent_id        | text
downloads_id     | uuid
private_id       | uuid
```

Important finding: The `quiz_questions` table does **NOT** contain a `quiz_id_id` column as the code expects.

### Quiz Questions Relationships Table (`payload.quiz_questions_rels`)

```
Column Name        | Data Type
-------------------+-------------------------
id                 | uuid
_parent_id         | uuid
field              | character varying
value              | uuid
order              | integer
_order             | integer
path               | character varying
created_at         | timestamp with time zone
updated_at         | timestamp with time zone
parent_id          | uuid
downloads_id       | uuid
posts_id           | uuid
documentation_id   | uuid
surveys_id         | uuid
survey_questions_id| uuid
courses_id         | uuid
course_lessons_id  | uuid
course_quizzes_id  | uuid
quiz_questions_id  | uuid
quiz_id_id         | uuid
media_id           | uuid
private_id         | uuid
```

Important finding: The `quiz_questions_rels` table **DOES** contain a `quiz_id_id` column, confirming the error message hint.

## Root Cause

The root cause of the issue is in the `fix-edge-cases.ts` script where the SQL query incorrectly references columns from the wrong table:

```javascript
// Problematic code in fix-edge-cases.ts
console.log('Fixing bidirectional relationships for quizzes and questions...');
await pool.query(`
  -- Add missing relationships from questions to quizzes
  WITH questions_to_link AS (
    SELECT qq.id as question_id, qq.quiz_id_id as quiz_id
    FROM payload.quiz_questions qq
    JOIN payload.quiz_questions_rels qqr ON qq.id = qqr._parent_id
    WHERE qq.quiz_id_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM payload.course_quizzes_rels cqr 
      WHERE cqr._parent_id = qq.quiz_id_id
      AND cqr.value = qq.id
    )
  )
  INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, updated_at, created_at)
  SELECT
    gen_random_uuid(),
    quiz_id,
    'questions',
    question_id,
    NOW(),
    NOW()
  FROM questions_to_link;
`);
```

The specific issue:

1. The SQL query attempts to select `qq.quiz_id_id` but this column doesn't exist in the `quiz_questions` table
2. The column actually exists in the `quiz_questions_rels` table as `qqr.quiz_id_id`
3. The `WHERE` clause and `NOT EXISTS` subquery are also incorrectly referencing `qq.quiz_id_id`

## Solution Design

We need to modify the SQL query to correctly reference the columns from the appropriate tables:

1. Change `qq.quiz_id_id` to `qqr.quiz_id_id` in the SELECT clause
2. Update the WHERE clause to check if `qqr.quiz_id_id IS NOT NULL`
3. Update the NOT EXISTS condition to reference `qqr.quiz_id_id` instead of `qq.quiz_id_id`

### Corrected SQL Query

```sql
-- Add missing relationships from questions to quizzes
WITH questions_to_link AS (
  SELECT qq.id as question_id, qqr.quiz_id_id as quiz_id
  FROM payload.quiz_questions qq
  JOIN payload.quiz_questions_rels qqr ON qq.id = qqr._parent_id
  WHERE qqr.quiz_id_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM payload.course_quizzes_rels cqr
    WHERE cqr._parent_id = qqr.quiz_id_id
    AND cqr.value = qq.id
  )
)
INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, updated_at, created_at)
SELECT
  gen_random_uuid(),
  quiz_id,
  'questions',
  question_id,
  NOW(),
  NOW()
FROM questions_to_link;
```

## Implementation Plan

1. **Update `fix-edge-cases.ts`**:

   - Modify the SQL query as described above
   - Ensure proper error handling is maintained

2. **Test the Fix**:

   - Run the `reset-and-migrate.ps1` script to verify the fix resolves the error
   - Monitor the output for any additional errors that might be exposed

3. **Review Other Potential Issues**:
   - Check if there are other SQL queries in the codebase that might have similar assumptions about the `quiz_id_id` column
   - Pay special attention to files in the quiz-management directory

## Expected Outcomes

After implementing these fixes:

1. The edge case repair process should complete without SQL errors
2. Bidirectional relationships between quizzes and questions should be properly established
3. The overall migration process should successfully complete

## Related Areas To Investigate

While fixing this issue, we should also consider:

1. **Schema Documentation**: Consider updating any documentation about the database schema to reflect the actual column locations
2. **Code Patterns**: Look for similar patterns of incorrect column references in other parts of the codebase

## References

- Database error code `42703`: PostgreSQL 'undefined_column' error
- Payload CMS Collections documentation
