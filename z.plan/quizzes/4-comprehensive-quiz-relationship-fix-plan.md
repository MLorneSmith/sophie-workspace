# Comprehensive Quiz Relationship Fix Plan

## 1. Summary

This document outlines a comprehensive plan to fix the following persistent issues with our quiz system:

1. Empty quizzes without content in the UI
2. Missing course IDs on all quizzes
3. Broken bidirectional relationships between quizzes and questions

Our analysis has revealed that previous fix attempts focused on the wrong table structure and relationship model, which is why they failed despite appearing to execute successfully.

## 2. Current Issue Analysis

### 2.1 Database Analysis Findings

Database queries have revealed:

- All quizzes have `course_id_id = NULL` (confirmed via SQL query)
- The `course_quizzes` table doesn't have a `questions` column, unlike what earlier fix attempts assumed
- Quiz questions correctly reference their parent quizzes via `quiz_id`
- The relationship entries in `course_quizzes_rels` are missing or incomplete

### 2.2 Affected Quiz List

The following quizzes are affected:

- The Who Quiz
- The Why (Next Steps) Quiz
- What is Structure? Quiz
- Using Stories Quiz
- Storyboards in Film Quiz
- Storyboards in Presentations Quiz
- Visual Perception and Communication Quiz
- Overview of the Fundamental Elements of Design Quiz
- Slide Composition Quiz
- Tables vs Graphs Quiz
- Standard Graphs Quiz
- Specialist Graphs Quiz
- Preparation and Practice Quiz
- Performance Quiz

## 3. Root Causes Identified

### 3.1 Schema-Code Mismatch

Payload CMS uses a different relationship model than what our fix scripts assumed:

- Payload doesn't store related IDs directly in array columns (unlike some other CMSes)
- Instead, it creates entries in relationship tables (e.g., `course_quizzes_rels`)
- Previous fixes attempted to update a non-existent `questions` array column

### 3.2 Course ID Assignment Failure

The course ID in our direct SQL fix matches the actual course ID (`3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8`), but:

- The script might be applying changes that are later overwritten by other fixes
- There could be transaction issues causing partial application of changes
- The relationship entries in `course_quizzes_rels` for the course relationship aren't being created

### 3.3 Relationship Model Misunderstanding

Previous fixes didn't properly account for Payload's bidirectional relationship model:

- Quiz questions have a `quiz_id` field that references their parent quiz
- Quizzes need entries in `course_quizzes_rels` with field='questions' for each question
- This bidirectional relationship is essential for Payload to populate related items

## 4. Why Previous Fixes Failed

The `direct-quiz-fix.sql` script has the right general approach but contains critical assumptions that don't match the actual schema:

1. It attempts to update a non-existent `questions` array field in the `course_quizzes` table
2. The script might have transaction issues (partially applying changes)
3. The script is executed after several other fixes that might interfere with its effects

The previous fixes focused on the array field approach instead of the relationship table model that Payload actually uses.

## 5. Proposed Solution

We'll create a targeted SQL fix script that:

1. **Works with Payload's actual schema**: Focus on relationship tables instead of array fields
2. **Fixes course IDs**: Properly set `course_id_id` and create relationship entries
3. **Creates bidirectional relationships**: Add entries in `course_quizzes_rels` for questions
4. **Runs earlier in the process**: Ensure it's not overwritten by other fixes

## 6. Implementation Plan

### 6.1 Create Updated SQL Fix Script

```sql
-- 1. Fix missing course IDs
UPDATE payload.course_quizzes
SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'
WHERE course_id_id IS NULL;

-- 2. Add course relationships in relationship table
INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, courses_id, created_at, updated_at)
SELECT
  gen_random_uuid() as id,
  cq.id as _parent_id,
  'course_id' as field,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8' as value,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8' as courses_id,
  NOW() as created_at,
  NOW() as updated_at
FROM payload.course_quizzes cq
WHERE NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = cq.id AND rel.field = 'course_id'
);

-- 3. Create quiz-question relationships (bidirectional)
INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, quiz_questions_id, created_at, updated_at)
SELECT
  gen_random_uuid() as id,
  qq.quiz_id as _parent_id,
  'questions' as field,
  qq.id as value,
  qq.id as quiz_questions_id,
  NOW() as created_at,
  NOW() as updated_at
FROM payload.quiz_questions qq
WHERE quiz_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = qq.quiz_id
  AND rel.field = 'questions'
  AND rel.value = qq.id::text
);

-- 4. Verification queries to check the result
SELECT COUNT(*) as quizzes_with_course_id
FROM payload.course_quizzes
WHERE course_id_id IS NOT NULL;

SELECT COUNT(*) as course_relationships
FROM payload.course_quizzes_rels
WHERE field = 'course_id';

SELECT COUNT(*) as question_relationships
FROM payload.course_quizzes_rels
WHERE field = 'questions';
```

### 6.2 Create TypeScript Runner

Create a new `fix-quiz-relationships-complete.ts` script:

```typescript
/**
 * Comprehensive Quiz Relationship Fix
 *
 * This script fixes all issues with quiz relationships:
 * 1. Sets course_id_id on all quizzes
 * 2. Creates course relationship entries in course_quizzes_rels
 * 3. Creates bidirectional quiz-question relationships in course_quizzes_rels
 */
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Load SQL script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-quiz-relationships-complete.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

// Execute SQL in transaction
export async function fixQuizRelationshipsComplete(): Promise<void> {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Start transaction
    await client.query('BEGIN');
    console.log('Starting transaction...');

    // Execute SQL commands
    const commands = sql.split(';').filter((cmd) => cmd.trim());

    // Execute all except verification queries
    const mainCommands = commands.slice(0, -3);
    for (const command of mainCommands) {
      const result = await client.query(command);
      console.log(`Command executed: ${result.rowCount} rows affected`);
    }

    // Execute verification queries
    const verificationQueries = commands.slice(-3);
    console.log('\nVerification Results:');

    for (const query of verificationQueries) {
      if (query.trim()) {
        const result = await client.query(query);
        console.log(result.rows[0]);
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Transaction committed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing quiz relationships:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  fixQuizRelationshipsComplete()
    .then(() => console.log('Quiz relationships fixed successfully'))
    .catch((error) => {
      console.error('Failed to fix quiz relationships:', error);
      process.exit(1);
    });
}
```

### 6.3 Update package.json

Add a new script entry to package.json:

```json
{
  "scripts": {
    "fix:quiz-relationships-complete": "tsx src/scripts/repair/fix-quiz-relationships-complete.ts"
  }
}
```

### 6.4 Update Migration Process

Modify `scripts/orchestration/phases/loading.ps1` to run our fix early in the process:

```powershell
# After "Running edge case repairs..." but before other quiz fixes
Log-Message "Running comprehensive quiz relationship fix..." "Yellow"
Exec-Command -command "pnpm run fix:quiz-relationships-complete" -description "Fixing all quiz relationships" -continueOnError
```

## 7. Verification Steps

After implementing the fix, we'll verify success through:

### 7.1 Database Checks

```sql
-- Check all quizzes have course_id_id set
SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NULL;
-- Should return 0

-- Check relationship entries for course_id exist
SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id';
-- Should equal the count of quizzes

-- Check relationship entries for questions exist
SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions';
-- Should equal the count of quiz questions
```

### 7.2 UI Verification

1. Check if quizzes appear correctly in the Payload CMS admin interface
2. Verify the "Take Quiz" button appears on lesson pages
3. Take each quiz to verify questions are displayed correctly

## 8. Expected Outcomes

After applying this fix:

1. All quizzes will have their `course_id_id` properly set to the main course ID
2. Proper relationship entries will exist in `course_quizzes_rels` for both:
   - Course relationships (`field = 'course_id'`)
   - Question relationships (`field = 'questions'`)
3. The "Take Quiz" button will appear on lesson pages
4. Questions will display correctly when taking quizzes

## 9. Long-term Improvements

To prevent similar issues in the future:

1. Add foreign key constraints to ensure referential integrity
2. Create automated tests to verify relationship integrity
3. Add schema validation to the migration process
4. Document Payload's relationship model to avoid similar misunderstandings
