# Bidirectional Quiz Relationship Empty Tables Fix

## Problem Analysis

After investigating the NextJS errors and Payload CMS "Nothing Found" issues, I've identified the root cause of the problems:

### Current State Assessment

1. **Empty Relationship Tables**:

   - `quiz_questions_rels` table is completely empty (confirmed via SQL query)
   - `course_quizzes_rels` table is also empty
   - This means both bidirectional relationship paths are missing

2. **Error Symptoms**:

   - NextJS errors: `Payload API error: 404 "Not Found"` when trying to fetch quizzes
   - Errors occur on specific lesson pages that require quizzes
   - Quizzes for certain lessons aren't appearing in Payload admin interface

3. **Failed Repair Attempts**:
   - Migration logs show execution of repair scripts without errors
   - Verification steps failing with array length mismatches
   - The comprehensive quiz relationship verification is failing

### Root Cause Analysis

The existing repair scripts (`quiz:fix:corrected` and `fix:bidirectional-quiz-relationships`) aren't effective because:

1. **Missing Initial Relationships**:

   - The repair scripts assume at least one direction of the relationship exists
   - The bidirectional relationship script relies on `course_quizzes_rels` entries to create the reverse relationships
   - Since both tables are empty, there's nothing to build from

2. **Execution Order Problem**:

   - The current approach assumes relationships in one direction already exist
   - Scripts that should be creating primary relationships are running after scripts that assume they exist
   - This creates a cascade of silent failures

3. **JSONB Format Inconsistencies**:
   - Mismatch between quiz questions array and relationship counts
   - Error: `"Quiz has 11 questions in array but 12 in relationship table"`

## Solution Approach

We need a comprehensive fix that addresses both directions of the relationship:

### 1. Create Primary Quiz-to-Question Relationships

First, we need to establish the primary relationships from quizzes to questions:

```sql
-- Insert entries in course_quizzes_rels to establish quiz → question relationships
INSERT INTO payload.course_quizzes_rels (id, _parent_id, quiz_questions_id, path, created_at, updated_at)
SELECT
    gen_random_uuid()::text as id,
    q.id as _parent_id,
    qq.id as quiz_questions_id,
    'questions' as path,
    NOW() as created_at,
    NOW() as updated_at
FROM
    payload.course_quizzes q
CROSS JOIN LATERAL (
    -- Extract the quiz_questions_id from the JSONB questions field
    SELECT jsonb_array_elements(q.questions)->>'id' as question_id
) as extracted_ids
JOIN
    payload.quiz_questions qq ON qq.id = extracted_ids.question_id
WHERE
    -- Only create relationships that don't already exist
    NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels cqr
        WHERE cqr._parent_id = q.id AND cqr.quiz_questions_id = qq.id
    );
```

### 2. Create Bidirectional Question-to-Quiz Relationships

After establishing the primary relationships, create the reverse relationships:

```sql
-- Insert entries in quiz_questions_rels to establish question → quiz relationships
INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, created_at, updated_at)
SELECT
    gen_random_uuid()::text as id,
    cqr.quiz_questions_id as _parent_id,
    'quiz_id' as field,
    cqr._parent_id as value,
    NOW() as created_at,
    NOW() as updated_at
FROM
    payload.course_quizzes_rels cqr
WHERE
    cqr.path = 'questions'
    AND cqr.quiz_questions_id IS NOT NULL
    -- Only create relationships that don't already exist
    AND NOT EXISTS (
        SELECT 1 FROM payload.quiz_questions_rels qqr
        WHERE qqr._parent_id = cqr.quiz_questions_id
        AND qqr.field = 'quiz_id'
        AND qqr.value = cqr._parent_id
    );
```

### 3. Update JSONB Format

Ensure the JSONB questions arrays in quiz records match the relationships:

```sql
-- Update quiz JSONB format to match relationships
UPDATE payload.course_quizzes q
SET questions = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', qq.id,
            'question', qq.question,
            'options', qq.options,
            'correct_answer', qq.correct_answer,
            'type', qq.type,
            'explanation', qq.explanation
        )
    )
    FROM payload.course_quizzes_rels cqr
    JOIN payload.quiz_questions qq ON qq.id = cqr.quiz_questions_id
    WHERE cqr._parent_id = q.id AND cqr.path = 'questions'
)
WHERE EXISTS (
    SELECT 1 FROM payload.course_quizzes_rels cqr
    WHERE cqr._parent_id = q.id AND cqr.path = 'questions'
);
```

### 4. Verification and Validation

After implementing the fix, we need to verify that:

1. Both relationship tables have appropriate entries
2. The JSONB format matches the relationship structure
3. The NextJS errors are resolved
4. Quizzes appear in the Payload admin interface

## Implementation Plan

1. Create a new TypeScript script in `packages/content-migrations/src/scripts/repair/quiz-management/` that:

   - Implements all three steps of the solution
   - Includes comprehensive validation
   - Provides detailed logging

2. Register the script in `package.json` with appropriate dependencies

3. Update the migration process to ensure this script runs before other relationship repair scripts

## Expected Outcomes

After implementing this fix:

1. The NextJS errors will be resolved as quizzes will be properly linked to questions
2. Quizzes will appear in the Payload admin interface
3. The JSONB format will be consistent with the relationship structure
4. Both `course_quizzes_rels` and `quiz_questions_rels` tables will have appropriate entries

## Next Steps

1. Develop the comprehensive fix script
2. Test the solution in a controlled environment
3. Update the migration process to incorporate the fix
4. Monitor subsequent migrations to ensure the fix is effective
