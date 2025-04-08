# Quiz ID Consistency Fix Plan

## Problem Statement

The content migration process is failing with the following error:

```
Error in content processing migration: error: insert or update on table "quiz_questions" violates foreign key constraint "quiz_questions_quiz_id_fkey"
Key (quiz_id)=(c11dbb26-7561-4d12-88c8-141c653a43fd) is not present in table "course_quizzes".
```

This indicates a mismatch between quiz IDs referenced in the quiz questions and the quiz IDs that exist in the course_quizzes table. Specifically, a quiz question is trying to reference a quiz with ID `c11dbb26-7561-4d12-88c8-141c653a43fd`, but this quiz doesn't exist in the course_quizzes table.

## Current System Architecture

### Key Components

1. **Quiz ID Mapping**:

   - `quiz-id-map.json` contains mappings between quiz slugs and UUIDs
   - `knownQuizIds` in `generate-sql-seed-files-fixed.ts` also contains similar mappings

2. **Lesson-Quiz Mapping**:

   - `lesson-quiz-mappings.ts` maps lesson slugs to quiz slugs
   - This ensures consistent relationships between lessons and quizzes

3. **SQL Generation Process**:

   - `generate-sql-seed-files-fixed.ts` generates SQL files for courses, lessons, quizzes, and questions
   - It uses the mappings to ensure consistent relationships

4. **Database Schema**:
   - `course_quizzes` table contains the quizzes
   - `quiz_questions` table contains questions with foreign keys to quizzes
   - `course_lessons` table contains lessons with optional references to quizzes

### Migration Process Flow

The migration process follows this sequence:

1. Reset Supabase database and run Web app migrations
2. Reset Payload schema
3. Run Payload migrations
4. Process raw data if needed
5. Run content migrations via Payload migrations
   - This includes executing SQL seed files in sequence:
     - 01-courses.sql
     - 02-lessons.sql
     - 03-quizzes.sql
     - 04-questions.sql (error occurs here)
6. Verify database state

## Root Cause Analysis

The root cause of the issue is a discrepancy between the quiz IDs used in different parts of the system:

1. There are two sources of quiz ID mappings:

   - `quiz-id-map.json` - Used as a reference
   - `knownQuizIds` in `generate-sql-seed-files-fixed.ts` - Used during SQL generation

2. The quiz ID `c11dbb26-7561-4d12-88c8-141c653a43fd` is being referenced in the questions SQL (04-questions.sql) but wasn't properly included in the quizzes SQL (03-quizzes.sql).

3. The verification script `verify-quiz-ids.ts` is designed to catch these inconsistencies, but it's only checking the SQL files after they've been generated, not preventing the inconsistencies during generation.

4. The issue may be related to how quiz IDs are generated and used across the system, particularly in the `generateQuizMap` function in `generate-sql-seed-files-fixed.ts`.

## Implementation Plan

### Step 1: Ensure Consistency Between Quiz ID Sources

1. Compare the quiz IDs in `quiz-id-map.json` with the `knownQuizIds` in `generate-sql-seed-files-fixed.ts` to ensure they match.
2. Update either source as needed to ensure consistency.

### Step 2: Fix the SQL Generation Process

1. Modify `generate-sql-seed-files-fixed.ts` to ensure that all quiz IDs referenced in questions are properly included in the quizzes SQL.
2. Add additional validation to ensure that quiz IDs are consistent across all generated SQL files.

### Step 3: Add a Verification Step Before Migration

1. Enhance the `verify-quiz-ids.ts` script to run before the migration process starts.
2. Make the migration process fail early if inconsistencies are detected.

### Step 4: Add a Repair Mechanism

1. Create a script to automatically fix quiz ID inconsistencies if they are detected.
2. This could involve updating the quiz IDs in the questions SQL to match those in the quizzes SQL.

### Step 5: Update the Migration Process

1. Modify the `reset-and-migrate.ps1` script to include the enhanced verification and repair steps.
2. Add better error handling and reporting for quiz ID inconsistencies.

## Implementation Details

### Specific Changes to Make

1. **Update `quiz-id-map.json`**:

   - Ensure all quiz slugs have consistent UUIDs.
   - Add any missing quiz slugs.

2. **Update `knownQuizIds` in `generate-sql-seed-files-fixed.ts`**:

   - Ensure it matches the UUIDs in `quiz-id-map.json`.
   - Add any missing quiz slugs.

3. **Enhance `generateQuizMap` function**:

   - Add validation to ensure all quiz slugs have a corresponding UUID.
   - Log warnings for any quiz slugs that don't have a known UUID.

4. **Modify `generateQuestionsSql` function**:

   - Add validation to ensure all quiz IDs referenced in questions exist in the quizzes map.
   - Skip questions that reference non-existent quizzes or use a default quiz ID.

5. **Enhance `verify-quiz-ids.ts`**:

   - Add more detailed reporting of inconsistencies.
   - Add an option to automatically fix inconsistencies.

6. **Add a new script `repair-quiz-ids.ts`**:

   - Automatically fix quiz ID inconsistencies in the generated SQL files.
   - Update the quiz IDs in the questions SQL to match those in the quizzes SQL.

7. **Update `reset-and-migrate.ps1`**:
   - Add a step to run the enhanced verification script before migration.
   - Add a step to run the repair script if inconsistencies are detected.

## Success Criteria

1. The migration process completes successfully without any quiz ID inconsistency errors.
2. All quiz questions are properly linked to their corresponding quizzes.
3. The verification script confirms that all quiz IDs are consistent across the system.
4. The repair mechanism successfully fixes any inconsistencies that are detected.

## Risks and Mitigations

1. **Risk**: Changing quiz IDs could break existing data.
   **Mitigation**: Only update quiz IDs in the generated SQL files, not in existing data.

2. **Risk**: The repair mechanism could introduce new inconsistencies.
   **Mitigation**: Add thorough validation and testing of the repair mechanism.

3. **Risk**: The verification script could miss some inconsistencies.
   **Mitigation**: Add comprehensive tests for the verification script.

4. **Risk**: The migration process could fail for other reasons.
   **Mitigation**: Add better error handling and reporting throughout the migration process.
