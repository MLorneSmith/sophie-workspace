# Enhanced Quiz Relationship Fix Plan

## Current Issues Identified

1. **The `path` Field in Relationship Tables is NULL**:

   - The `path` field in the `course_quizzes_rels` table should be set to 'questions', but it's NULL for all records
   - Payload CMS requires this field for proper relationship resolution

2. **Missing Bidirectional Relationships**:

   - The `quiz_questions_rels` table is completely empty
   - One-way references exist (quizzes → questions) but not the reverse (questions → quizzes)
   - Payload CMS expects bidirectional relationships for its API to function correctly

3. **Inconsistent Relationship Counts**:
   - The migration logs show: "Quiz 'Standard Graphs Quiz' has 11 questions in array but 12 in relationship table"
   - This mismatch prevents proper verification and causes API errors

## Why Previous Fixes Failed

1. **Verification Methodology Issues**:

   - Verification scripts only check counts, not field values (like NULL `path`)
   - Different verification scripts use different methods to count relationships
   - One counts all records, another counts distinct records

2. **Script Timing and Order**:

   - The repair scripts may be running in a suboptimal order
   - Some scripts may add duplicate entries that aren't cleaned up

3. **Duplicate Records**:
   - The logs show some quizzes have more relationship records than array items
   - No deduplication step exists in the current fix script

## Enhanced Solution

### Phase 1: Comprehensive Database Analysis

1. **Analyze current state**:

   ```sql
   -- Check quiz questions array format
   SELECT id, title, jsonb_typeof(questions) as array_type
   FROM payload.course_quizzes;

   -- Check path field values
   SELECT COUNT(*) as null_path_count
   FROM payload.course_quizzes_rels
   WHERE field = 'questions' AND path IS NULL;

   -- Check for duplicate relationship records
   SELECT _parent_id, quiz_questions_id, COUNT(*) as count
   FROM payload.course_quizzes_rels
   GROUP BY _parent_id, quiz_questions_id
   HAVING COUNT(*) > 1;

   -- Check bidirectional relationships
   SELECT COUNT(*) FROM payload.quiz_questions_rels;
   ```

### Phase 2: Enhanced Relationship Fix Script

1. **Remove duplicate relationship records**:

   ```sql
   DELETE FROM payload.course_quizzes_rels a
   WHERE a.ctid <> (
     SELECT min(b.ctid)
     FROM payload.course_quizzes_rels b
     WHERE a._parent_id = b._parent_id
       AND a.quiz_questions_id = b.quiz_questions_id
   );
   ```

2. **Fix NULL path values**:

   ```sql
   UPDATE payload.course_quizzes_rels
   SET path = 'questions'
   WHERE field = 'questions' AND path IS NULL;
   ```

3. **Create bidirectional relationships using only distinct records**:

   ```sql
   INSERT INTO payload.quiz_questions_rels (id, _parent_id, path, field, "order", course_quizzes_id)
   SELECT
     gen_random_uuid()::text as id,
     cqr.quiz_questions_id as _parent_id,
     'quizzes' as path,
     'quizzes' as field,
     0 as "order",
     cqr._parent_id as course_quizzes_id
   FROM
     (SELECT DISTINCT _parent_id, quiz_questions_id FROM payload.course_quizzes_rels WHERE quiz_questions_id IS NOT NULL) cqr
   WHERE
     NOT EXISTS (
       SELECT 1 FROM payload.quiz_questions_rels qr
       WHERE qr._parent_id = cqr.quiz_questions_id AND qr.course_quizzes_id = cqr._parent_id
     );
   ```

4. **Normalize questions arrays to match relationships**:
   ```sql
   -- Get all question IDs from relationship table for each quiz
   WITH quiz_questions AS (
     SELECT
       _parent_id as quiz_id,
       array_agg(DISTINCT quiz_questions_id ORDER BY quiz_questions_id) as question_ids
     FROM
       payload.course_quizzes_rels
     WHERE
       field = 'questions'
     GROUP BY
       _parent_id
   )
   -- Update questions array in each quiz to match relationship records
   UPDATE payload.course_quizzes cq
   SET questions = (
     SELECT jsonb_agg(
       jsonb_build_object(
         'id', gen_random_uuid()::text,
         'relationTo', 'quiz_questions',
         'value', jsonb_build_object('id', q)
       )
     )
     FROM unnest(qq.question_ids) as q
   )
   FROM quiz_questions qq
   WHERE cq.id::text = qq.quiz_id::text;
   ```

### Phase 3: Comprehensive Verification

Create a new verification script that checks:

1. All records in `course_quizzes_rels` have `path = 'questions'` (not NULL)
2. No duplicate relationship records exist
3. For each quiz, the questions array length matches the relationship count
4. Each question in the questions array has a corresponding relationship record
5. Each relationship record has a corresponding entry in the questions array

### Phase 4: Integration with Migration Process

1. Update the migration orchestration to:

   - Run the enhanced fix script early in the loading phase
   - Add explicit transaction management with locks on the relevant tables
   - Run comprehensive verification after the fix
   - Fail fast with clear error messages if verification fails

2. Add the fix to the `scripts/orchestration/phases/loading.ps1` file after the UUID table fixes but before the content migrations.

## Expected Outcomes

After implementing this plan:

1. All `path` fields will be properly set in relationship tables
2. Bidirectional relationships will be correctly established
3. No duplicate relationship records will exist
4. Questions arrays and relationship tables will be in sync
5. NextJS errors will be resolved
6. Quiz content will correctly appear in Payload CMS

## Implementation Steps

1. Create an enhanced version of the `fix-quiz-paths-and-relationships.ts` script that includes:

   - Deduplication of relationship records
   - Proper `path` field setting
   - Bidirectional relationship creation
   - Normalization of questions arrays

2. Create a comprehensive verification script that checks all aspects of the relationship integrity

3. Update the migration process to run these scripts in the correct order

4. Test the fix by running a full migration and verifying:
   - The NextJS errors are resolved
   - Quiz content correctly appears in Payload CMS
   - All verification scripts pass
