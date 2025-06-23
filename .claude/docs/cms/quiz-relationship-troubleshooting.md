# Quiz Relationship Troubleshooting

## Common Quiz Relationship Issues

The quiz system has complex relationships between quizzes, questions, and courses that can sometimes become inconsistent. This document covers specific troubleshooting for quiz-related relationship issues.

### Quiz-Question Relationship Issues

**Symptoms:**

- Questions missing from quizzes in the admin UI
- Incorrect question order in quizzes
- API errors when fetching quiz questions

**Solutions:**

1. Run the consolidated quiz relationship fix:

   ```powershell
   pnpm --filter @kit/content-migrations run repair:quiz-relationships:consolidated
   ```

2. Verify quiz-question relationships:

   ```powershell
   pnpm --filter @kit/content-migrations run verify:quiz-question-relationships
   ```

3. For persistent issues, use the database-level fix:

   ```sql
   -- Fix quiz-question relationships
   WITH quiz_questions AS (
     SELECT 
       q.id AS quiz_id,
       jsonb_array_elements(q.questions->'ids') AS question_id
     FROM 
       payload.course_quizzes q
     WHERE 
       q.questions IS NOT NULL
   )
   INSERT INTO payload.course_quizzes_rels (id, parent_id, path, order, value, collection)
   SELECT 
     uuid_generate_v4(),
     qq.quiz_id,
     'questions',
     0,
     qq.question_id->>'id',
     'quiz_questions'
   FROM 
     quiz_questions qq
   LEFT JOIN 
     payload.course_quizzes_rels r 
     ON r.parent_id = qq.quiz_id 
     AND r.path = 'questions' 
     AND r.value = qq.question_id->>'id'
   WHERE 
     r.id IS NULL;
   ```

### Quiz-Course Relationship Issues

**Symptoms:**

- Quizzes not appearing in courses
- Incorrect quiz order in courses
- Missing quiz results

**Solutions:**

1. Run the course-quiz relationship repair:

   ```powershell
   pnpm --filter @kit/content-migrations run repair:course-quiz-relationships
   ```

2. Verify course-quiz relationships:

   ```powershell
   pnpm --filter @kit/content-migrations run verify:course-quiz-relationships
   ```

3. For manual fixes:

   ```sql
   -- Fix course-quiz relationships
   WITH course_quizzes AS (
     SELECT 
       c.id AS course_id,
       jsonb_array_elements(c.quizzes->'ids') AS quiz_id
     FROM 
       payload.courses c
     WHERE 
       c.quizzes IS NOT NULL
   )
   INSERT INTO payload.courses_rels (id, parent_id, path, order, value, collection)
   SELECT 
     uuid_generate_v4(),
     cq.course_id,
     'quizzes',
     0,
     cq.quiz_id->>'id',
     'course_quizzes'
   FROM 
     course_quizzes cq
   LEFT JOIN 
     payload.courses_rels r 
     ON r.parent_id = cq.course_id 
     AND r.path = 'quizzes' 
     AND r.value = cq.quiz_id->>'id'
   WHERE 
     r.id IS NULL;
   ```

## Quiz Data Integrity Issues

### Inconsistent Question Data

**Symptoms:**

- Quiz questions showing incorrect options
- Missing question content
- Incorrect answer validation

**Solutions:**

1. Run the quiz question data integrity check:

   ```powershell
   pnpm --filter @kit/content-migrations run verify:quiz-question-data
   ```

2. Fix quiz question data:

   ```powershell
   pnpm --filter @kit/content-migrations run repair:quiz-question-data
   ```

3. For specific issues with answer options:

   ```powershell
   pnpm --filter @kit/content-migrations run repair:quiz-answer-options
   ```

### Quiz Results Issues

**Symptoms:**

- Missing quiz results
- Incorrect scoring
- Results not being saved

**Solutions:**

1. Check quiz results table:

   ```sql
   -- Check quiz results
   SELECT * FROM payload.quiz_results LIMIT 10;
   ```

2. Repair quiz results:

   ```powershell
   pnpm --filter @kit/content-migrations run repair:quiz-results
   ```

3. For user-specific issues:

   ```powershell
   pnpm --filter @kit/content-migrations run repair:user-quiz-results --userId=<user_id>
   ```

## Prevention Strategies

1. **Use Single Source of Truth**: Always use the designated SSOT files for quiz relationships
2. **Validate After Updates**: Run verification scripts after updating quiz content
3. **Atomic Updates**: Update both JSONB fields and relationship tables in the same operation
4. **Regular Audits**: Periodically run verification scripts to catch issues early
5. **Comprehensive Testing**: Test quiz functionality thoroughly after migrations

## Consolidated Fix Implementation

The consolidated quiz relationship fix (`apps/payload/src/migrations/20250425_150000_consolidated_quiz_relationship_fix.ts`) implements:

1. Database triggers to maintain consistency between JSONB fields and relationship tables
2. Verification functions to check relationship integrity
3. UUID table monitoring to ensure proper column existence
4. Schema structure validation and repair

This migration should be run whenever quiz relationship issues are detected:

```powershell
pnpm --filter @kit/content-migrations run repair:relationships:consolidated
```

After running the fix, verify the results:

```powershell
pnpm --filter @kit/content-migrations run verify:quiz-relationship-migration
```
