# Comprehensive ESM Import and UUID Tables Fix Plan - 2025-04-23

## Problem Analysis

After examining the migration logs and source code, we've identified two critical issues affecting the content migration system:

### 1. ES Module Import and Execution Issues

The migration process is failing with the error:

```
ReferenceError: require is not defined in ES module scope, you can use import instead
at <anonymous> (D:\SlideHeroes\App\repos\2025slideheroes\packages\content-migrations\src\scripts\repair\quiz-management\core\fix-quiz-course-ids.ts:173:1)
```

This occurs because:

1. The `package.json` is configured with `"type": "module"`, indicating ES module usage
2. The affected scripts are using CommonJS patterns like `require.main === module` to check if they're being executed directly
3. While `pg` is imported correctly (`import pg from 'pg'`), the module execution pattern is still using CommonJS conventions

The most immediately affected file is `fix-quiz-course-ids.ts`, but this pattern is likely repeated across multiple files in the `quiz-management` directory and potentially other utility scripts.

### 2. UUID Tables Schema Potential Issues

While not explicitly causing errors in the current run, there's a risk of schema mismatch issues with UUID tables:

1. The current tracking table schema uses columns: `table_name`, `primary_key`, `created_at`, `needs_path_column`
2. Some SQL scripts might be using inconsistent columns like `last_checked` and `has_downloads_id`
3. The `scan_and_fix_uuid_tables()` function and related utilities might have inconsistent implementations

## Solution Design

### 1. Fix ES Module Execution Pattern

We need to update all scripts that are executed directly to use ES module patterns:

```javascript
// BEFORE (CommonJS - causing errors):
if (require.main === module) {
  someFunction()
    .then(() => console.log('Success'))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

// AFTER (ESM-compatible):
// Check if this module is being run directly
if (import.meta.url.endsWith(process.argv[1])) {
  someFunction()
    .then(() => console.log('Success'))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
```

### 2. Verify and Fix UUID Tables Schema

We'll ensure all SQL scripts and functions that work with UUID tables use the correct schema:

1. Verify all SQL scripts use the correct columns (`table_name`, `primary_key`, `created_at`, `needs_path_column`)
2. Update any functions that assume incorrect column names
3. Add defensive code to handle schema variations

## Implementation Strategy

### Phase 1: ES Module Fix

1. **Identify Affected Files**:

   Search for pattern `require.main === module` across the codebase:

   ```
   packages/content-migrations/src/scripts/repair/quiz-management/core/fix-quiz-course-ids.ts
   packages/content-migrations/src/scripts/repair/quiz-management/utilities/verify-quiz-system-integrity-comprehensive.ts
   packages/content-migrations/src/scripts/repair/quiz-management/utilities/fix-invalid-quiz-references.ts
   packages/content-migrations/src/scripts/repair/quiz-management/lesson-quiz-relationships/fix-lesson-quiz-relationships-comprehensive.ts
   packages/content-migrations/src/scripts/repair/quiz-management/core/run-direct-quiz-fix.ts
   packages/content-migrations/src/scripts/repair/quiz-management/core/repair-quiz-system.ts
   packages/content-migrations/src/scripts/repair/quiz-management/core/fix-unidirectional-quiz-questions.ts
   packages/content-migrations/src/scripts/repair/quiz-management/core/fix-course-quiz-relationships.ts
   packages/content-migrations/src/scripts/repair/database/fix-payload-relationships-strict.ts
   ```

2. **Update Each Affected File**:

   - Replace CommonJS direct execution checks with ESM-compatible alternatives
   - Ensure any other `require()` calls are converted to `import` statements
   - Keep the functionality identical while updating only the module system compatibility

3. **Create a Helper Utility**:

   Add a simple utility function that can be imported to standardize the "is this file being executed directly" check:

   ```javascript
   // File: src/utils/module-utils.ts
   /**
    * Check if the current module is being run directly (not imported)
    * This is the ESM equivalent of 'require.main === module'
    * @returns boolean
    */
   export function isDirectExecution(): boolean {
     return import.meta.url.endsWith(process.argv[1]);
   }
   ```

### Phase 2: UUID Tables Schema Verification

1. **Verify Current Schema**:

   Create a schema verification script:

   ```javascript
   // File: src/scripts/verification/verify-uuid-table-schema.ts
   /**
    * Verifies that the dynamic_uuid_tables table has the expected schema
    * and provides a detailed report of any discrepancies
    */
   ```

2. **Update SQL Scripts**:

   - Ensure all SQL scripts use the correct column names
   - Add defensive SQL code to detect and handle schema variations

3. **Implement Schema Validation in Functions**:

   Modify functions to validate schema before using it:

   ```javascript
   // Check schema before using
   const schemaResult = await client.query(`
     SELECT column_name 
     FROM information_schema.columns 
     WHERE table_schema = 'payload' 
     AND table_name = 'dynamic_uuid_tables'
   `);

   const columns = schemaResult.rows.map((row) => row.column_name);
   console.log(
     `Available columns in dynamic_uuid_tables: ${columns.join(', ')}`,
   );

   // Determine which schema version to use based on available columns
   ```

### Phase 3: Testing

1. **Incremental Testing**:

   Test each fixed file individually:

   ```bash
   pnpm --filter @kit/content-migrations run fix:quiz-course-ids
   ```

2. **Full Migration Test**:

   Run the complete migration script to ensure all issues are resolved:

   ```bash
   ./reset-and-migrate.ps1
   ```

## Implementation Details

### Files to Update (ES Module Fix)

1. **`fix-quiz-course-ids.ts`**:

   - Remove `require.main === module` check
   - Replace with `if (import.meta.url.endsWith(process.argv[1]))`
   - Ensure proper error handling

2. **Other Affected Files**:
   - Apply the same pattern to all identified files
   - Use the utility function to standardize the direct execution check

### SQL Script Updates

1. **Ensure Correct Schema**:

   ```sql
   -- Create the UUID tables tracking table if not exists
   CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
     table_name TEXT PRIMARY KEY,
     primary_key TEXT DEFAULT 'parent_id',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     needs_path_column BOOLEAN DEFAULT TRUE
   );
   ```

2. **Add Schema Validation**:

   ```sql
   DO $$
   DECLARE
     column_exists BOOLEAN;
   BEGIN
     -- Check for correct columns
     SELECT EXISTS (
       SELECT FROM information_schema.columns
       WHERE table_schema = 'payload'
       AND table_name = 'dynamic_uuid_tables'
       AND column_name = 'needs_path_column'
     ) INTO column_exists;

     IF NOT column_exists THEN
       RAISE NOTICE 'Schema incompatibility detected - missing needs_path_column';
       -- Add the column if needed
       ALTER TABLE payload.dynamic_uuid_tables ADD COLUMN IF NOT EXISTS needs_path_column BOOLEAN DEFAULT FALSE;
     END IF;
   END
   $$;
   ```

## Expected Outcomes

After implementing these fixes:

1. **ES Module Compatibility**:

   - All scripts will execute correctly using ES module patterns
   - No more `require is not defined` errors
   - Consistent module pattern across the codebase

2. **UUID Tables Schema**:

   - All code will use the correct schema columns
   - Any schema mismatches will be automatically detected and addressed
   - All database operations will be resilient to schema variations

3. **Migration Process**:
   - The content migration process will complete successfully
   - All verification steps will pass
   - Database integrity will be maintained

## Implementation Timeline

1. **Phase 1 (ES Module Fix)**: Immediate priority

   - Fix all files with the direct execution pattern
   - Test each fix individually

2. **Phase 2 (UUID Tables Schema)**: Secondary priority

   - Verify current schema
   - Update any mismatched SQL scripts
   - Add schema validation to functions

3. **Phase 3 (Testing)**: Final step
   - Test individual fixes
   - Test complete migration process
   - Document any additional findings

## Long-term Recommendations

1. **Standardize Module Patterns**:

   - Use consistent ES module patterns throughout the codebase
   - Create utility functions for common tasks
   - Add ESLint rules to prevent mixing of module patterns

2. **Database Schema Management**:

   - Implement formal database schema migrations
   - Add schema version tracking
   - Add comprehensive schema validation on startup

3. **Error Handling Improvements**:
   - Implement more robust error handling
   - Add detailed logging for schema-related issues
   - Provide clear error messages and recovery steps
