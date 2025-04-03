# Payload CMS Content Migration Fixes

## Overview

This document outlines the fixes implemented to address the content migration issues in our Payload CMS integration. We identified several issues with the content migration process and implemented solutions to ensure all collections are properly populated with content.

## Issues Identified

1. **Documentation Collection**:

   - The nested-docs plugin was correctly configured, but no parent-child relationships were being established
   - All documents had `parent=null`, preventing proper nesting
   - The SQL seed file for documentation didn't set up the hierarchical structure

2. **Survey Collection and Survey Questions**:

   - Only 1 survey question existed in the database, despite having 25 questions in `self-assessment.yaml`
   - The `generateSurveyQuestionsSql()` function was just a placeholder that didn't process the YAML file
   - The `questionspin` field was defined as an integer in the database, but the YAML had string values ('positive'/'negative')

3. **Course Lessons**:

   - The `course_lessons` table was completely empty (0 rows)
   - The `02-lessons.sql` file existed and contained lesson data
   - The migration file `20250403_200000_process_content.ts` didn't include `01-courses.sql` and `02-lessons.sql` in the list of seed files to execute

4. **Course Quizzes and Quiz Questions**:
   - Quiz questions had quiz_id references, but the bidirectional relationships were missing
   - No entries in the `course_quizzes_rels` table to establish the relationship from quizzes to questions
   - The SQL seed file included the bidirectional relationship code, but it wasn't being executed properly

## Root Causes

1. **Incomplete Migration File**: The migration file `20250403_200000_process_content.ts` only included some of the SQL seed files, missing critical ones like courses and lessons.

2. **Placeholder SQL Generation**: The survey questions SQL generator was just a placeholder that didn't actually process the YAML data.

3. **Data Type Mismatch**: The `questionspin` field in the survey_questions table was an integer, but the YAML had string values.

4. **Missing Bidirectional Relationships**: The relationships between collections were not properly established in both directions.

## Solutions Implemented

### 1. Updated Migration File

Modified `20250403_200000_process_content.ts` to include ALL SQL seed files in the correct order:

```typescript
// Define the SQL seed files in the order they should be executed
const seedFiles = [
  '01-courses.sql',
  '02-lessons.sql',
  '03-quizzes.sql',
  '04-questions.sql',
  '05-surveys.sql',
  '06-survey-questions.sql',
  '07-documentation.sql',
  '08-posts.sql',
  '09-fix-quiz-questions.sql',
];
```

Also added verification for course lessons:

```typescript
// Check course lessons
const { rows: courseLessonsCount } = await db.execute(sql`
  SELECT COUNT(*) as count FROM payload.course_lessons
`);
console.log(`Course lessons count: ${courseLessonsCount[0].count}`);

if (parseInt(courseLessonsCount[0].count) === 0) {
  console.warn('WARNING: No course lessons found!');
}
```

### 2. Created Proper Survey Questions SQL File

Replaced the placeholder `06-survey-questions.sql` with a proper implementation that:

- Creates a function to handle survey question creation
- Processes all 25 questions from the self-assessment survey
- Converts string values ('positive'/'negative') to integer values (0/1)
- Establishes bidirectional relationships between surveys and questions

```sql
-- Create a function to create survey questions with proper data types
CREATE OR REPLACE FUNCTION create_survey_question(
  survey_id UUID,
  question_text TEXT,
  category TEXT,
  spin INTEGER, -- 0 = Positive, 1 = Negative
  position INTEGER,
  options JSONB
) RETURNS UUID AS $$
DECLARE
  question_id UUID;
BEGIN
  -- Generate a UUID for the question
  question_id := gen_random_uuid();

  -- Insert the question
  INSERT INTO payload.survey_questions (
    id,
    question,
    text,
    type,
    category,
    questionspin,
    position,
    options,
    surveys_id,
    created_at,
    updated_at
  ) VALUES (
    question_id,
    question_text,
    question_text,
    'multiple_choice',
    category,
    spin,
    position,
    options,
    survey_id,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Create relationship entry for the question to the survey
  INSERT INTO payload.survey_questions_rels (
    id,
    _parent_id,
    field,
    value,
    surveys_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    question_id,
    'surveys',
    survey_id,
    survey_id,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

  -- Create bidirectional relationship entry for the survey to the question
  INSERT INTO payload.surveys_rels (
    id,
    _parent_id,
    field,
    value,
    survey_questions_id,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    survey_id,
    'questions',
    question_id,
    question_id,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

  RETURN question_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. Updated Documentation SQL File

Modified `07-documentation.sql` to create a nested structure for documentation:

- Added parent documents with fixed UUIDs
- Added child documents with references to their parents
- Used ON CONFLICT clauses to handle updates gracefully

```sql
-- Add parent documentation entries for subdirectories
DO $$
DECLARE
  product_id UUID;
  security_id UUID;
  billing_id UUID;
BEGIN
  -- Insert parent documents
  INSERT INTO payload.documentation (
    id,
    title,
    slug,
    description,
    content,
    status,
    updated_at,
    created_at
  ) VALUES
  (
    'c4f14964-e4b6-4ea4-9e5c-4508d1da6143', -- Fixed UUID for Our Product
    'Our Product',
    'our-product',
    'Information about our product',
    markdown_to_lexical('This section contains information about our product.'),
    'published',
    NOW(),
    NOW()
  ),
  -- More parent documents...

  -- Insert child documents with parent references
  INSERT INTO payload.documentation (
    id,
    title,
    slug,
    description,
    content,
    parent_id,
    status,
    updated_at,
    created_at
  ) VALUES
  (
    'c7f14964-e4b6-4ea4-9e5c-4508d1da6143',
    'Features',
    'features',
    'Information about product features',
    markdown_to_lexical('This section contains information about our product features.'),
    product_id,
    'published',
    NOW(),
    NOW()
  ),
  -- More child documents...
END;
$$;
```

### 4. Enhanced Quiz Questions Fix SQL File

Enhanced `09-fix-quiz-questions.sql` to fix bidirectional relationships for all collections:

- Added code to fix relationships between quizzes and questions
- Added code to fix relationships between courses and lessons
- Added code to fix relationships between lessons and quizzes
- Added code to fix nested documentation structure

```sql
-- Fix bidirectional relationships between quizzes and questions
DO $$
DECLARE
  quiz_id UUID;
  question_id UUID;
  quiz_cursor CURSOR FOR
    SELECT DISTINCT quiz_id_id FROM payload.quiz_questions WHERE quiz_id_id IS NOT NULL;
BEGIN
  -- Process each quiz
  OPEN quiz_cursor;
  LOOP
    FETCH quiz_cursor INTO quiz_id;
    EXIT WHEN NOT FOUND;

    -- Get all questions for this quiz
    FOR question_id IN
      SELECT id FROM payload.quiz_questions WHERE quiz_id_id = quiz_id
    LOOP
      -- Check if the bidirectional relationship exists
      IF NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels
        WHERE _parent_id = quiz_id AND field = 'questions' AND value = question_id
      ) THEN
        -- Create the bidirectional relationship
        INSERT INTO payload.course_quizzes_rels (
          id,
          _parent_id,
          field,
          value,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          quiz_id,
          'questions',
          question_id,
          NOW(),
          NOW()
        );

        RAISE NOTICE 'Created bidirectional relationship from quiz % to question %', quiz_id, question_id;
      END IF;
    END LOOP;
  END LOOP;
  CLOSE quiz_cursor;
END;
$$;
```

## Testing and Verification

The solution has been tested by running the reset-and-migrate.ps1 script, which:

1. Resets the database
2. Runs all migrations
3. Executes all SQL seed files in the correct order
4. Verifies that content was properly populated

The verification step checks that:

- Documentation has at least 9 entries
- Survey questions has 25 entries
- Course lessons has entries
- Quiz questions has entries
- All bidirectional relationships are properly established

## Benefits of This Approach

1. **Simplicity**: SQL is more declarative and easier to understand
2. **Reliability**: SQL transactions ensure atomicity
3. **Maintainability**: Reduced dependency on complex TypeScript code
4. **Consistency**: Standardized approach for all content types
5. **Verifiability**: Easier to verify and validate the migration process
6. **Integration**: Integrated with Payload's migration system

## Future Recommendations

1. **Continue Using SQL-First Approach**: For future content migrations, continue using the SQL-first approach with Payload migrations
2. **Document Schema Changes**: Keep track of schema changes in the migration files
3. **Verify Content After Migration**: Always verify that content was properly populated after migration
4. **Use Transactions**: Always use transactions to ensure atomicity
5. **Handle Data Type Conversions**: Be careful with data type conversions, especially when dealing with enums or select fields
6. **Establish Bidirectional Relationships**: Always establish bidirectional relationships for all collections

## Conclusion

This implementation successfully addresses the content migration issues in our Payload CMS integration. By fixing the migration file, creating proper SQL seed files, and ensuring bidirectional relationships, we've created a reliable, maintainable, and consistent content population process. The solution is now complete and ready for use. The reset-and-migrate.ps1 script can be run to reset the database and populate all content correctly.
