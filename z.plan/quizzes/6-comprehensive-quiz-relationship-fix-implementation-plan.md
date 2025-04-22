# Comprehensive Quiz Relationship Fix Implementation Plan

## 1. Issue Summary

We're experiencing persistent issues with our quiz system in Payload CMS:

1. **Empty Quizzes Without Content**: 14 quizzes are missing content in the UI, including:

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

2. **Missing Course IDs**: All quizzes have `course_id_id = NULL` despite being required in the schema

3. **Broken Bidirectional Relationships**: Quiz questions aren't properly associated with quizzes in both directions

## 2. Root Cause Analysis

After thorough investigation, we've identified that the fundamental issue is a **mismatch between how Payload CMS handles relationships and assumptions in previous fix attempts**:

### 2.1 Payload's Dual-Storage Architecture

Payload CMS uses a dual-storage approach for relationships:

1. **Direct Field Storage**: A reference field in the main table (e.g., `course_id_id` in `course_quizzes`)
2. **Relationship Table Storage**: Entries in a relationship table (e.g., `course_quizzes_rels` with appropriate mapping)

For a relationship to work correctly, **both parts must be properly populated**.

### 2.2 Database Schema Issues

Our schema analysis revealed critical details:

- `course_id_id` is a **TEXT type** in `course_quizzes` (not UUID)
- `value` is a **UUID type** in `course_quizzes_rels`
- Previous fixes attempted UUID insertion directly without proper type handling
- No `questions` array column exists in `course_quizzes` (contrary to assumptions in earlier fixes)

### 2.3 Transaction and Timing Issues

Previous fixes suffered from:

- Inadequate transaction isolation
- Potential overriding by later migration steps
- No row locking to prevent concurrent modifications
- Execution order problems in the migration process

## 3. Why Previous Attempts Failed

Previous fix attempts (documented in files 1-5) made incorrect assumptions:

1. **Assumed Single-Storage Model**: Many fixes attempted to update a non-existent `questions` array column in the `course_quizzes` table
2. **Type Mismatch Issues**: Previous scripts didn't properly handle the text vs. UUID type differences

3. **Incomplete Relationship Handling**: Fixes often updated only one side of the dual-storage relationship

4. **Execution Timing**: Fixes may have been executing too late in the migration process, after other steps reset certain values

5. **No Transaction Isolation**: Lack of proper transaction isolation allowed other processes to interfere with changes

## 4. Implementation Plan

We'll create a comprehensive solution that addresses all identified issues:

### 4.1 Create a New SQL Fix Script

Create `fix-quiz-relationships-complete.sql` with a comprehensive solution:

```sql
-- Use serializable isolation to prevent concurrent interference
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- 1. Fix course_id_id in main table with proper TEXT type casting
-- Also use FOR UPDATE to lock rows during modification
UPDATE payload.course_quizzes
SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::text
WHERE id IN (SELECT id FROM payload.course_quizzes FOR UPDATE)
AND (course_id_id IS NULL OR course_id_id = '');

-- 2. Create course relationship entries in relationship table
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  courses_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  cq.id as _parent_id,
  'course_id' as field,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as value,
  '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid as courses_id,
  NOW() as created_at,
  NOW() as updated_at
FROM payload.course_quizzes cq
WHERE NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = cq.id
  AND rel.field = 'course_id'
)
AND cq.id IN (SELECT id FROM payload.course_quizzes FOR UPDATE);

-- 3. Create quiz-question bidirectional relationships
INSERT INTO payload.course_quizzes_rels (
  id,
  _parent_id,
  field,
  value,
  quiz_questions_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  qq.quiz_id as _parent_id,
  'questions' as field,
  qq.id as value,
  qq.id as quiz_questions_id,
  NOW() as created_at,
  NOW() as updated_at
FROM payload.quiz_questions qq
WHERE qq.quiz_id IS NOT NULL
AND qq.quiz_id IN (SELECT id FROM payload.course_quizzes FOR UPDATE)
AND NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = qq.quiz_id
  AND rel.field = 'questions'
  AND rel.value = qq.id
);

-- 4. Verification queries to confirm changes
SELECT COUNT(*) as quizzes_with_course_id
FROM payload.course_quizzes
WHERE course_id_id IS NOT NULL;

SELECT COUNT(*) as course_relationships
FROM payload.course_quizzes_rels
WHERE field = 'course_id';

SELECT COUNT(*) as question_relationships
FROM payload.course_quizzes_rels
WHERE field = 'questions';

-- Commit all changes
COMMIT;
```

### 4.2 Create TypeScript Runner

Create a new file `fix-quiz-relationships-complete.ts` in `packages/content-migrations/src/scripts/repair/`:

```typescript
/**
 * Comprehensive Quiz Relationship Fix
 *
 * This script fixes all issues with quiz relationships:
 * 1. Sets course_id_id on all quizzes with proper type casting
 * 2. Creates course relationship entries in course_quizzes_rels
 * 3. Creates bidirectional quiz-question relationships in course_quizzes_rels
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-quiz-relationships-complete.sql');

export async function fixQuizRelationshipsComplete(): Promise<void> {
  // Get database connection string from environment or use default
  const connectionString =
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres';

  console.log('Starting comprehensive quiz relationship fix...');
  console.log(`Using connection string: ${connectionString}`);

  // Create database client
  const client = new Client({ connectionString });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database successfully');

    // Load and execute SQL script
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    console.log('Loaded SQL script successfully');

    // Execute SQL script - execute as a single command to maintain transaction integrity
    const result = await client.query(sqlContent);

    // Parse and log verification results
    const results = result.rows;
    if (results && results.length >= 3) {
      console.log('\nVerification Results:');
      console.log(
        `- Quizzes with course ID: ${results[0].quizzes_with_course_id}`,
      );
      console.log(`- Course relationships: ${results[1].course_relationships}`);
      console.log(
        `- Question relationships: ${results[2].question_relationships}`,
      );

      // Check if all quizzes have course IDs
      const allQuizzesResult = await client.query(
        'SELECT COUNT(*) as total FROM payload.course_quizzes',
      );
      const totalQuizzes = allQuizzesResult.rows[0].total;
      const quizzesWithCourseId = parseInt(results[0].quizzes_with_course_id);

      if (quizzesWithCourseId === totalQuizzes) {
        console.log(
          `\nSUCCESS: All ${totalQuizzes} quizzes now have course IDs`,
        );
      } else {
        console.warn(
          `\nWARNING: Only ${quizzesWithCourseId} of ${totalQuizzes} quizzes have course IDs`,
        );
      }
    } else {
      console.log(
        'Script executed but verification results were not as expected',
      );
    }

    console.log('\nQuiz relationship fix completed successfully');
  } catch (error) {
    console.error('Error fixing quiz relationships:', error);
    throw error;
  } finally {
    // Always disconnect from database
    await client.end();
    console.log('Disconnected from database');
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  fixQuizRelationshipsComplete()
    .then(() => console.log('Quiz relationships fixed successfully'))
    .catch((error) => {
      console.error('Failed to fix quiz relationships:', error);
      process.exit(1);
    });
}
```

### 4.3 Update Package.json

Add a new script entry to `packages/content-migrations/package.json`:

```json
{
  "scripts": {
    "fix:quiz-relationships-complete": "tsx src/scripts/repair/fix-quiz-relationships-complete.ts"
  }
}
```

### 4.4 Update Migration Process

Update `scripts/orchestration/phases/loading.ps1` to run our new fix early in the process:

```powershell
# After the Payload migrations but before other relationship fixes
# (typically after "Applying payload migrations" but before "Running edge case repairs")
Log-Message "Running comprehensive quiz relationship fix..." "Yellow"
Exec-Command -command "pnpm --filter @kit/content-migrations run fix:quiz-relationships-complete" -description "Fixing all quiz relationships" -continueOnError
```

## 5. Key Implementation Details

### 5.1 Type Handling

We're explicitly handling types:

- Using `::text` for `course_id_id` in `course_quizzes`
- Using `::uuid` for `value` and other UUID fields in `course_quizzes_rels`

### 5.2 Transaction Isolation

Using `SERIALIZABLE` isolation level with `FOR UPDATE` locking to:

- Prevent concurrent modification of rows
- Ensure atomic updating of both sides of relationships
- Prevent other processes from breaking integrity

### 5.3 Verification

Built-in verification queries to confirm:

- All quizzes have course IDs
- Relationship entries exist in the relationship table
- Bidirectional quiz-question relationships are established

### 5.4 Execution Timing

Running early in migration process to:

- Establish correct relationships before other fixes
- Prevent later steps from overriding our fixes
- Allow other fixes to still run as a safety net

## 6. Expected Outcomes

After implementing this fix:

1. **All quizzes will have course IDs**:

   - `course_id_id` field in `course_quizzes` will be populated
   - Corresponding entries in `course_quizzes_rels` will exist

2. **Bidirectional quiz-question relationships will work**:

   - Quiz questions will correctly reference quizzes via `quiz_id`
   - Quizzes will correctly reference questions via relationship entries in `course_quizzes_rels`

3. **UI display will be fixed**:
   - All 14 previously empty quizzes will show content
   - Quiz questions will display correctly when taking quizzes
   - "Take Quiz" button will appear on lesson pages

## 7. Implementation Timeline

1. Create SQL script: `fix-quiz-relationships-complete.sql`
2. Create TypeScript runner: `fix-quiz-relationships-complete.ts`
3. Update package.json with new script entry
4. Update migration orchestration to run the fix early
5. Test with a full migration run using `./reset-and-migrate.ps1`
6. Verify results in database and UI

## 8. Future Improvements

Once this fix is verified working, we should consider:

1. **Add Foreign Key Constraints**:

   - Add constraints between `quiz_id` in questions and quiz IDs
   - Add constraints for `course_id_id` to ensure valid course references

2. **Schema Validation**:

   - Add validation in migration process to verify relationship integrity
   - Create automated tests for relationship structures

3. **Documentation**:
   - Document Payload's dual-storage relationship model
   - Create reference guides for future relationship implementations
