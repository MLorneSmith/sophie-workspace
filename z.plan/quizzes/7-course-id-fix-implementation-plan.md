# Course ID Fix Implementation Plan

## 1. Current Status Assessment

After analyzing the latest migration logs and database queries, we've identified a persistent issue with quizzes not having course IDs:

1. **Quiz-Question Relationships**: Working correctly

   - 94 entries exist in `course_quizzes_rels` with `field = 'questions'`
   - Questions are properly linked to quizzes via the relationship table

2. **Course ID Assignment**: Consistently failing

   - All 20 quizzes have `course_id_id = NULL` in the main table
   - No entries in `course_quizzes_rels` for `field = 'course_id'`

3. **Migration Process**: Runs without errors
   - Multiple fix scripts execute successfully
   - Final verification passes despite missing course IDs

## 2. Previous Attempts Analysis

Our previous fixes haven't resolved the course ID issue despite multiple approaches:

1. **Strict Type Handling**: We've tried explicit type casting (`::text` and `::uuid`) but the course IDs still don't persist
2. **Transaction Isolation**: We've used `SERIALIZABLE` isolation and row locking but it doesn't prevent the issue
3. **Comprehensive Relationship Fixing**: Our existing scripts address both sides of the relationship but something still resets or prevents course ID updates

## 3. Root Cause Hypothesis

After thorough investigation, we believe the root cause is:

1. **Payload's Internal Validation**: Payload CMS likely has internal validation hooks that require both the direct field and relationship table entries to be consistent - if either side fails validation, both might be reverted

2. **Execution Order**: Our fixes might be running too early in the process, with subsequent operations inadvertently resetting the course IDs

3. **Transaction Boundaries**: Despite our care with transactions, there might be operations after our fix completes that affect the course IDs

4. **Type System Complexities**: Subtle type handling issues may still exist that prevent proper persisting of IDs

## 4. Proposed Solution

We propose a focused, end-of-process approach with additional safeguards:

### 4.1 Create a Direct SQL Patch Script

Create a highly targeted SQL script that exclusively handles course ID relationships:

```sql
-- Start transaction with serializable isolation
BEGIN;

-- Get the course ID from the courses table directly
WITH course_data AS (
  SELECT id FROM payload.courses WHERE slug = 'decks-for-decision-makers' LIMIT 1
)
-- First update the main table with explicit CAST and more targeted FOR UPDATE locking
UPDATE payload.course_quizzes AS cq
SET course_id_id = cd.id::text  -- Cast to text as that's what the column expects
FROM course_data cd
WHERE cq.id IN (SELECT id FROM payload.course_quizzes FOR UPDATE SKIP LOCKED); -- Lock rows

-- Remove any existing relationships to ensure clean state
DELETE FROM payload.course_quizzes_rels
WHERE field = 'course_id';

-- Add fresh relationship entries
WITH course_data AS (
  SELECT id FROM payload.courses WHERE slug = 'decks-for-decision-makers' LIMIT 1
)
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
  cd.id as value,
  cd.id as courses_id,
  NOW() as created_at,
  NOW() as updated_at
FROM payload.course_quizzes cq, course_data cd;

-- Force consistent IDs across all fields
UPDATE payload.course_quizzes_rels
SET courses_id = value
WHERE field = 'course_id' AND courses_id IS NULL;

-- Verification query
SELECT COUNT(*) as fixed_quizzes
FROM payload.course_quizzes
WHERE course_id_id IS NOT NULL;

COMMIT;
```

### 4.2 Add a Database Safeguard

Add a trigger to prevent course_id_id from being reset to NULL once set:

```sql
CREATE OR REPLACE FUNCTION prevent_course_id_reset()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.course_id_id IS NOT NULL AND NEW.course_id_id IS NULL THEN
    RAISE NOTICE 'Preventing course_id_id from being reset to NULL';
    NEW.course_id_id := OLD.course_id_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_course_id_reset_trigger
BEFORE UPDATE ON payload.course_quizzes
FOR EACH ROW
EXECUTE FUNCTION prevent_course_id_reset();
```

This trigger will intercept any attempt to set course_id_id to NULL if it already has a value.

### 4.3 Change Execution Order

Modify the orchestration process to run our specialized fix:

1. As the very **last step** in the fix process
2. **After** all other relationship fixes
3. **Before** final verification
4. **Outside** any other multi-operation transactions

## 5. Implementation Plan

### 5.1 Create Specialized SQL Script

Create a new SQL file `fix-course-ids-final.sql` in `packages/content-migrations/src/scripts/repair/` with the SQL above.

### 5.2 Create TypeScript Runner

Create a new TypeScript file `fix-course-ids-final.ts` in the same directory:

```typescript
/**
 * Final Course ID Fix
 *
 * This is a specialized fix that runs at the very end of the migration process.
 * It exclusively handles course ID relationships and includes safeguards to
 * prevent Payload hooks from resetting the course IDs.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { Client } from 'pg';
import { fileURLToPath } from 'url';

// Get directory and file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlPath = path.join(__dirname, 'fix-course-ids-final.sql');

export async function fixCourseIdsFinal(): Promise<void> {
  // Get database connection string from environment or use default
  const connectionString =
    process.env.DATABASE_URI ||
    'postgresql://postgres:postgres@localhost:54322/postgres';

  console.log('Starting final course ID fix...');
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

    // Check result of verification query (will be the last result)
    if (result.rows && result.rows.length > 0) {
      const fixedQuizzes = parseInt(result.rows[0].fixed_quizzes || '0');
      const totalQuizzes = await getTotalQuizCount(client);

      console.log(`\nFix Results:`);
      console.log(`- Fixed ${fixedQuizzes} of ${totalQuizzes} quizzes`);

      if (fixedQuizzes === totalQuizzes) {
        console.log(`\nSUCCESS: All quizzes now have course IDs`);
      } else if (fixedQuizzes > 0) {
        console.log(
          `\nPARTIAL SUCCESS: ${fixedQuizzes} quizzes fixed, but ${totalQuizzes - fixedQuizzes} still have issues`,
        );
      } else {
        console.log(`\nFAILURE: No quizzes were fixed`);
      }
    }

    // Add the safeguard trigger to prevent future resets
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION prevent_course_id_reset()
        RETURNS TRIGGER AS $$
        BEGIN
          IF OLD.course_id_id IS NOT NULL AND NEW.course_id_id IS NULL THEN
            RAISE NOTICE 'Preventing course_id_id from being reset to NULL';
            NEW.course_id_id := OLD.course_id_id;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS prevent_course_id_reset_trigger ON payload.course_quizzes;
        
        CREATE TRIGGER prevent_course_id_reset_trigger
        BEFORE UPDATE ON payload.course_quizzes
        FOR EACH ROW
        EXECUTE FUNCTION prevent_course_id_reset();
      `);
      console.log(
        `\nAdded safeguard trigger to prevent course_id_id from being reset`,
      );
    } catch (triggerError) {
      console.warn(
        `\nWarning: Could not add safeguard trigger: ${triggerError}`,
      );
    }

    console.log('\nCourse ID fix completed');
  } catch (error) {
    console.error('Error fixing course IDs:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

// Helper function to get total quiz count
async function getTotalQuizCount(client: Client): Promise<number> {
  try {
    const result = await client.query(
      'SELECT COUNT(*) as total FROM payload.course_quizzes',
    );
    return parseInt(result.rows[0].total || '0');
  } catch (error) {
    console.warn(`Could not get total quiz count: ${error}`);
    return 0;
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  fixCourseIdsFinal()
    .then(() => console.log('Final course ID fix completed'))
    .catch((error) => {
      console.error('Failed to fix course IDs:', error);
      process.exit(1);
    });
}
```

### 5.3 Register Script in package.json

Add a new script entry to `packages/content-migrations/package.json`:

```json
"fix:course-ids-final": "tsx src/scripts/repair/fix-course-ids-final.ts"
```

### 5.4 Update Orchestration

Modify `scripts/orchestration/phases/loading.ps1` to run our final fix as the last step:

```powershell
# Add this at the very end of Fix-Relationships function, right before the final verification
Log-Message "Running final course ID fix..." "Yellow"
Exec-Command -command "pnpm run fix:course-ids-final" -description "Final course ID fix" -continueOnError
```

## 6. Testing Plan

After implementing these changes, we will:

1. Run a complete migration using `./reset-and-migrate.ps1`
2. Verify results through SQL queries:
   ```sql
   SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NULL;
   SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id';
   ```
3. Test quiz functionality in the web application
4. Verify that the trigger successfully prevents course_id resets

## 7. Expected Results

After successful implementation:

1. All quizzes will have proper course IDs in the `course_id_id` field
2. Corresponding entries will exist in the `course_quizzes_rels` table
3. Quizzes will display properly in the web application
4. Any attempt to reset course_id will be prevented by the trigger

## 8. Fallback Strategy

If this approach doesn't resolve the issue, we should:

1. Implement a direct API-based fix using Payload's REST API
2. Consider a full schema change to use a different relationship model
3. Look into possible Payload configuration issues affecting relationships
