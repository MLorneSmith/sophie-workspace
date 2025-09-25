# Dual Storage Relationship Fix Plan

## 1. Last Fix Applied and Results

Our previous implementation in `10-unidirectional-quiz-relationship-fix-plan.md` focused on simplifying the complex bidirectional relationship between quizzes and questions to a unidirectional model. This approach:

1. **Removed the `questions` field** from the `CourseQuizzes` collection
2. **Maintained the `quiz_id` field** on the `QuizQuestions` collection
3. **Implemented a repair script** (`fix-unidirectional-quiz-relationships.ts`) to fix relationships
4. **Updated the orchestration script** to run our fix during migration

However, despite successful migrations and all verification checks passing, the following issues persist:

- 14 specific quizzes still don't display any content
- Server logs continue to show "not-found" errors
- Admin interface shows empty quizzes
- Database queries confirm both `course_id_id` and relationship records are missing

## 2. Additional Research Findings

### 2.1 Payload CMS's Dual Storage Architecture

Through detailed research on Payload CMS, we've discovered that it uses a **dual storage mechanism** for relationships:

1. **Direct Field Storage**:

   - References are stored directly in the document table (e.g., `course_id_id` in `payload.course_quizzes`)
   - Used for quick direct lookups and enforcing constraints
   - Essential for basic relationship functionality

2. **Relationship Tables Storage**:
   - Separate tables like `payload.course_quizzes_rels` store relationship records
   - Each record contains `_parent_id`, `field`, and target ID (e.g., `courses_id`)
   - Used for complex queries, filtering, and bi-directional operations
   - Critical for Payload's admin UI and relationship fetching

**Critical Finding**: Both mechanisms must be properly synchronized for relationships to work correctly. Our database queries confirm both are broken:

```sql
-- Direct field is NULL for all quizzes
SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NULL; -- Returns 20

-- No entries exist in the relationship table
SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id'; -- Returns 0
```

### 2.2 Common Payload Relationship Issues

Research revealed several patterns in Payload relationship problems:

1. **Asynchronous Field Loading**:

   - Admin UI loads relationship fields asynchronously
   - Race conditions occur when component logic runs before loading completes
   - This explains the inconsistent UI behavior

2. **API Structure Requirements**:

   - Payload expects exact IDs for relationship references
   - Object references instead of IDs cause validation failures
   - Many-to-many relationships need proper join table entries

3. **SQL Script Limitations**:
   - Transactions may fail silently or partially complete
   - Schema inconsistencies can block updates
   - Proper error handling is essential

### 2.3 Why Previous Fixes Failed

Our previous fixes focused on the wrong aspects of the problem:

1. **Incomplete Storage Coverage**:

   - Fixed quiz-question relationships but not course-quiz relationships
   - Failed to address both storage mechanisms simultaneously

2. **Script Execution Issues**:

   - SQL may have executed but with silent failures
   - Error handling wasn't robust enough to catch and report issues

3. **Verification Gaps**:
   - Verification scripts didn't specifically check for proper course-quiz relationships
   - Tests passed without detecting the actual problem

## 3. Root Cause Analysis

The root cause is now clear: **Payload requires both storage mechanisms to be correctly populated for relationships to work**. Specifically:

1. Each quiz must have a valid `course_id_id` value in the `payload.course_quizzes` table
2. Each quiz must have a corresponding entry in `payload.course_quizzes_rels` with:
   - `_parent_id` = quiz ID
   - `field` = 'course_id'
   - `courses_id` = course ID
   - `value` = course ID

Our previous fixes addressed only one side of this dual-storage system, or failed to properly execute the SQL to update both sides.

## 4. Comprehensive Solution Plan

We need a focused fix that specifically addresses the course-quiz relationship in both storage mechanisms:

### 4.1 Create a Direct Fix SQL Script

```sql
-- fix-course-quiz-relationships.sql
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Set variables for better readability and maintenance
DO $$
DECLARE
    main_course_id TEXT := '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8';
    main_course_id_uuid UUID := '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'::uuid;
    affected_rows INTEGER;
BEGIN
    -- Log initial state for debugging
    RAISE NOTICE 'Initial state:';
    RAISE NOTICE '  Quizzes without course_id_id: %', (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NULL);
    RAISE NOTICE '  Course relationship entries: %', (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id');

    -- Step 1: Update course_id_id in course_quizzes table (direct field storage)
    UPDATE payload.course_quizzes
    SET course_id_id = main_course_id
    WHERE course_id_id IS NULL OR course_id_id = '';

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Updated % quizzes with course_id_id', affected_rows;

    -- Step 2: Delete any existing course relationship entries to ensure clean state
    DELETE FROM payload.course_quizzes_rels
    WHERE field = 'course_id';

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Removed % existing course relationship entries', affected_rows;

    -- Step 3: Create course relationship entries in course_quizzes_rels table (relationship table storage)
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
        main_course_id_uuid as value,
        main_course_id_uuid as courses_id,
        NOW() as created_at,
        NOW() as updated_at
    FROM payload.course_quizzes cq;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Created % course relationship entries', affected_rows;

    -- Step 4: Verify results to ensure consistency
    RAISE NOTICE 'Verification results:';

    -- Verify course_id_id in course_quizzes table
    RAISE NOTICE '  Quizzes without course_id_id: %', (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NULL);

    -- Verify course relationships in course_quizzes_rels table
    RAISE NOTICE '  Course relationship entries: %', (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id');

    -- Verify mismatch between direct field and relationship entries
    RAISE NOTICE '  Consistency check: %',
    CASE WHEN
        (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NOT NULL) =
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id')
    THEN 'Consistent' ELSE 'Inconsistent' END;
END $$;

COMMIT;
```

### 4.2 Create a TypeScript Runner Script

```typescript
// fix-course-quiz-relationships.ts
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-course-quiz-relationships.sql');

export async function fixCourseQuizRelationships(): Promise<void> {
  // Get database connection string from environment or use default
  const connectionString =
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres';

  console.log('Starting course-quiz relationship fix...');
  console.log(`Using connection string: ${connectionString}`);

  // Create database client
  const client = new Client({ connectionString });

  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database successfully');

    // Load SQL script
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    console.log('Loaded SQL script successfully');

    // First check the current state
    console.log('\nCurrent state before fix:');
    const beforeCounts = await getRelationshipCounts(client);

    // Execute SQL script as a single transaction
    console.log('\nExecuting fix script...');
    await client.query(sqlContent);

    // Get counts after fix
    console.log('\nState after fix:');
    const afterCounts = await getRelationshipCounts(client);

    // Report results
    console.log('\nResults summary:');
    console.log(
      `  - Direct field: ${beforeCounts.directCount} → ${afterCounts.directCount} quizzes linked to course`,
    );
    console.log(
      `  - Relationship entries: ${beforeCounts.relCount} → ${afterCounts.relCount} entries created`,
    );

    if (afterCounts.directCount === 0) {
      console.error('\n❌ Failed to fix direct quiz-course links');
    } else if (afterCounts.relCount === 0) {
      console.error('\n❌ Failed to create relationship entries');
    } else if (afterCounts.directCount !== afterCounts.relCount) {
      console.warn(
        '\n⚠️ Inconsistency between direct fields and relationship entries',
      );
    } else {
      console.log(
        `\n✅ Successfully fixed ${afterCounts.directCount} quiz-course relationships`,
      );
    }
  } catch (error) {
    console.error('Error fixing course-quiz relationships:', error);
    throw error;
  } finally {
    // Always disconnect from database
    await client.end();
    console.log('Disconnected from database');
  }
}

/**
 * Get counts of relationship fields and entries
 */
async function getRelationshipCounts(client: Client): Promise<{
  directCount: number;
  relCount: number;
}> {
  // Check direct field in course_quizzes
  const directResult = await client.query(
    `SELECT COUNT(*) as count FROM payload.course_quizzes WHERE course_id_id IS NOT NULL AND course_id_id != ''`,
  );

  // Check relationship entries in course_quizzes_rels
  const relResult = await client.query(
    `SELECT COUNT(*) as count FROM payload.course_quizzes_rels WHERE field = 'course_id'`,
  );

  const directCount = parseInt(directResult.rows[0].count);
  const relCount = parseInt(relResult.rows[0].count);

  console.log(`  - Quizzes with course_id_id set: ${directCount}`);
  console.log(`  - Quiz-course relationship entries: ${relCount}`);

  return { directCount, relCount };
}

// Run the function if this file is executed directly
if (require.main === module) {
  fixCourseQuizRelationships()
    .then(() => console.log('Course-quiz relationship fix completed'))
    .catch((error) => {
      console.error('Failed to fix course-quiz relationships:', error);
      process.exit(1);
    });
}
```

### 4.3 Ensure Script Registration

Our package.json should already include:

```json
"fix:course-quiz-relationships": "tsx src/scripts/repair/fix-course-quiz-relationships.ts"
```

And the orchestration script should include:

```powershell
# In scripts/orchestration/phases/loading.ps1
Log-Message "Applying specialized course-quiz relationship fix..." "Yellow"
Exec-Command -command "pnpm run fix:course-quiz-relationships" -description "Fixing course-quiz relationships" -continueOnError
```

### 4.4 Testing and Verification

After implementation, we'll verify:

1. **Database State**:

   - All quizzes have a valid `course_id_id` value
   - All quizzes have a corresponding entry in `course_quizzes_rels`
   - The counts match (consistent state)

2. **UI Behavior**:
   - Quizzes appear properly in the admin UI
   - Quiz content is displayed correctly
   - "not-found" errors are eliminated

## 5. Why This Solution Will Work

1. **Direct Dual-Storage Fix**: Targets both storage mechanisms Payload requires for relationships
2. **Explicit SQL**: Clearly written and transaction-protected SQL with thorough error handling
3. **Comprehensive Verification**: Checks both before and after state to ensure complete fix
4. **Focused Approach**: Addresses only what's broken (course-quiz relationship) without disturbing working aspects

## 6. Implementation Phases

1. **Phase 1**: Create and test SQL and TypeScript files in isolation
2. **Phase 2**: Run the fix script directly to verify it resolves the issue
3. **Phase 3**: Run full migration to ensure integration works properly

## 7. Fallback Options

If this approach doesn't resolve the issue, we have these fallbacks:

1. **API-Based Fix**: Use Payload's Admin API to update the relationships
2. **Schema Changes**: Consider a more extensive schema overhaul
3. **UI Adaptation**: Modify the frontend to handle missing relationships gracefully

By targeting Payload's dual-storage architecture directly, we expect this solution to finally resolve the persistent quiz content issues.
