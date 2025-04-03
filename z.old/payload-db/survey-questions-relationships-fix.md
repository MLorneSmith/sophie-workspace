# Survey Questions Relationships Fix

## Issue Overview

We identified an issue with the bidirectional relationships between surveys and survey questions in Payload CMS. The issue was similar to the one we previously fixed for quiz questions:

1. The relationship from survey questions to surveys was properly established in the database:
   - The `survey_questions_rels` table had entries with `surveys_id` values for all survey questions
2. However, the relationship from surveys to survey questions was not properly established:
   - The `surveys_rels` table didn't have a 'field' column, which is needed for bidirectional relationships
   - There were no entries in the `surveys_rels` table to establish the reverse relationship

This meant that in the Payload CMS admin interface, when viewing a survey, the questions field would not show the associated questions.

## Root Cause Analysis

The root cause was that Payload CMS requires bidirectional relationships to be established in both directions in the database:

1. From survey questions to surveys (via the `survey_questions_rels` table)
2. From surveys to survey questions (via the `surveys_rels` table)

The second part was missing, which is why the questions weren't showing up in the admin interface.

## Solution

We implemented a comprehensive solution that addresses the issue:

1. **Created a Migration File**: `20250402_200000_fix_survey_questions_bidirectional_relationships.ts`

   - Ensures the `surveys_rels` table exists with the proper structure
   - Adds 'field' and 'value' columns if they don't exist
   - Creates entries in the `surveys_rels` table with `_parent_id = survey_id`, `field = 'questions'`, and `value = question_id` for each survey question

2. **Created Direct Fix Script**: `fix-survey-questions-relationships-direct.ts`

   - Performs the same operations as the migration file but can be run directly
   - Includes verification to ensure all relationships are properly established

3. **Created Verification Script**: `verify-survey-questions-relationships-direct.ts`

   - Verifies that the `surveys_rels` table exists with the proper structure
   - Verifies that all survey questions have a corresponding entry in the `surveys_rels` table
   - Provides detailed information about the surveys and their questions

4. **Updated Package.json**: Added new scripts

   - `fix:survey-questions-relationships:direct`
   - `verify:survey-questions-relationships:direct`

5. **Updated Reset-and-Migrate Script**: Added steps to fix and verify survey questions relationships

## Implementation Details

### Migration File

The migration file `20250402_200000_fix_survey_questions_bidirectional_relationships.ts` performs the following operations:

1. Ensures the `surveys_rels` table exists with the proper structure
2. Adds 'field' and 'value' columns if they don't exist
3. Creates entries in the `surveys_rels` table for each survey question

### Direct Fix Script

The direct fix script `fix-survey-questions-relationships-direct.ts` performs the same operations as the migration file but can be run directly. It includes verification to ensure all relationships are properly established.

### Verification Script

The verification script `verify-survey-questions-relationships-direct.ts` verifies that the `surveys_rels` table exists with the proper structure and that all survey questions have a corresponding entry in the `surveys_rels` table. It provides detailed information about the surveys and their questions.

## Testing

The solution can be tested by running the reset-and-migrate.ps1 script, which will:

1. Reset the database
2. Run all migrations
3. Run content migrations
4. Fix and verify relationships

After running the script, you should be able to see the survey questions in the Payload CMS admin interface when viewing a survey.

## Future Considerations

1. **Consolidate Relationship Fixes**: Consider consolidating all relationship fixes into a single migration file to simplify the process.
2. **Improve Content Migration**: Update the content migration process to correctly establish bidirectional relationships from the start.
3. **Add Join Fields**: Consider adding Join fields to the collection definitions to make the bidirectional relationships more explicit.
