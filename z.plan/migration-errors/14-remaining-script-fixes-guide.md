# Guide to Fix Remaining Scripts - 2025-04-23

This guide outlines the process to fix the remaining scripts in the content migration system that may be affected by ESM import issues. The approach is based on the successful fix we implemented for `clear-lesson-content.ts`.

## Scripts to Fix

Based on the error logs and our analysis, these additional scripts likely need fixing:

1. `packages/content-migrations/src/scripts/repair/quiz-management/utilities/verify-quiz-system-integrity-comprehensive.ts`
2. `packages/content-migrations/src/scripts/repair/quiz-management/utilities/fix-invalid-quiz-references.ts`
3. `packages/content-migrations/src/scripts/repair/quiz-management/lesson-quiz-relationships/fix-lesson-quiz-relationships-comprehensive.ts`
4. `packages/content-migrations/src/scripts/repair/quiz-management/core/run-direct-quiz-fix.ts`
5. `packages/content-migrations/src/scripts/repair/quiz-management/core/repair-quiz-system.ts`
6. `packages/content-migrations/src/scripts/repair/quiz-management/core/fix-unidirectional-quiz-questions.ts`
7. `packages/content-migrations/src/scripts/repair/quiz-management/core/fix-course-quiz-relationships.ts`
8. `packages/content-migrations/src/scripts/repair/database/fix-payload-relationships-strict.ts`

## Fix Approach

We'll use the same approach that worked for `clear-lesson-content.ts` since it proved effective. For each script, follow these steps:

### 1. Script Assessment

Before modifying each script:

1. Examine the script's imports to identify problematic patterns
2. Check for CommonJS patterns like `require.main === module`
3. Note any dependencies on external utility functions

### 2. Implementation Process

For each script:

1. **Inline Database Utilities**:

   ```typescript
   // Inline the database utility to avoid ESM import issues
   async function executeSQL(
     query: string,
     params: any[] = [],
   ): Promise<pg.QueryResult> {
     const { Pool } = pg;

     // Create a pool for this execution
     const pool = new Pool({
       connectionString:
         process.env.DATABASE_URI ||
         'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload',
     });

     const client = await pool.connect();
     try {
       return await client.query(query, params);
     } catch (error) {
       console.error(
         `SQL Error executing query: ${query.substring(0, 100)}...`,
       );
       console.error(`Error details: ${error}`);
       throw error;
     } finally {
       client.release();
       // Close pool when done
       await pool.end();
     }
   }
   ```

2. **Inline Module Detection Utility**:

   ```typescript
   // Inline the module utility to avoid ESM import issues
   function isDirectExecution(): boolean {
     const currentUrl = import.meta.url;
     const executedUrl = process.argv[1];

     if (!executedUrl) {
       return false;
     }

     // Handle both Windows and Unix paths
     const normalizedCurrentUrl = currentUrl.replace(/\\/g, '/');
     const normalizedExecutedUrl = executedUrl.replace(/\\/g, '/');

     // Check if this file is the entry point
     return normalizedCurrentUrl.endsWith(normalizedExecutedUrl);
   }
   ```

3. **Replace CommonJS Execution Pattern**:

   ```typescript
   // Replace CommonJS pattern
   if (require.main === module) {
     // code
   }

   // With ES Module pattern
   if (isDirectExecution()) {
     // code
   }
   ```

4. **Fix Import Statements**:

   If you decide to keep imports instead of inlining:

   ```typescript
   // Add .js extension to relative imports
   import { something } from './path/to/module.js';
   ```

### 3. Testing Process

For each fixed script:

1. **Individual Testing**:

   ```powershell
   cd packages/content-migrations; pnpm run [script-command]
   ```

2. **Verify Output**:

   - Check for successful execution
   - Ensure no import/module errors
   - Verify the script's functionality remains unchanged

3. **Rollback if Needed**:
   - If the script fails, consider a more specific fix
   - Examine any errors carefully to understand root causes

## Implementation Schedule

Implement fixes in this order to address the most critical components first:

1. Core database utility scripts
2. Quiz management core scripts
3. Relationship management scripts
4. Verification and integrity check scripts

This approach prioritizes the scripts that are most likely to be used during the migration process.

## Tips for Successful Implementation

1. **Consistent Patterns**: Use the same coding patterns across all scripts for maintainability
2. **Documentation**: Add comments explaining the ESM-specific patterns
3. **Error Handling**: Include robust error handling in all scripts
4. **Test After Each Fix**: Test each script individually before moving to the next
5. **Keep Backups**: Create backups of original files before modifications

By following this guide, you should be able to systematically fix the remaining scripts and ensure the content migration system works reliably.
