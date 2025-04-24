# ESM Import Path Resolution Fix Plan - 2025-04-23

## Problem Analysis

After analyzing migration logs and examining the codebase, we've identified several critical issues affecting the content migration system. The most prominent errors relate to ES Module (ESM) import path resolution and execution patterns.

### Primary Error Pattern

The migration process is currently failing with the following error:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'D:\SlideHeroes\App\repos\2025slideheroes\packages\content-migrations\src\scripts\utils\db\execute-sql.js' imported from D:\SlideHeroes\App\repos\2025slideheroes\packages\content-migrations\src\scripts\repair\utilities\clear-lesson-content.ts
```

This occurs because:

1. The project is configured as an ES module (`"type": "module"` in package.json)
2. Files are incorrectly importing from `.js` extensions when those files haven't been compiled yet
3. The directory structure may have inconsistencies, with utilities located in different paths

### Root Causes

Through detailed analysis, we've identified three primary root causes:

#### 1. Incorrect ES Module Import Patterns

The package is configured with `"type": "module"` in package.json, but still uses import paths that explicitly reference `.js` file extensions, such as:

```typescript
// In clear-lesson-content.ts
import { executeSQL } from '../../utils/db/execute-sql.js';
```

In an ESM environment, when TypeScript files are run directly using `tsx`, this creates a mismatch because:

- The file being referenced doesn't exist as `.js` (hasn't been compiled yet)
- Node.js ESM loader is trying to resolve the exact path specified

#### 2. Inconsistent Directory Structure

The utility functions may be located in different paths:

- Some files import from `src/utils/db/execute-sql.js`
- Others import from `src/scripts/utils/db/execute-sql.js`

This inconsistency creates confusion and import failures when paths are hard-coded.

#### 3. CommonJS Execution Pattern in ESM Environment

Some files still use the CommonJS pattern to check if they're being executed directly:

```typescript
if (require.main === module) {
  // This script is being run directly
}
```

This pattern is not compatible with ES modules and generates `ReferenceError: require is not defined in ES module scope`.

## Solution Design

Our solution addresses all identified root causes with a comprehensive approach:

### 1. Fix Import Path References

Update all import statements to follow ES module best practices:

```typescript
// BEFORE - Problematic import with .js extension
import { executeSQL } from '../../utils/db/execute-sql.js';

// AFTER - Extension-less import
import { executeSQL } from '../../utils/db/execute-sql';
```

This allows Node.js to resolve the correct file extension based on the environment.

### 2. Create Consistent Directory Structure

Ensure utility functions are accessible from a single, consistent location:

1. Create unified database utilities in a centralized location
2. Update all imports to reference the standard path
3. Remove duplicate utility implementations

### 3. Implement ES Module Execution Pattern

Replace CommonJS execution checks with ES Module compatible alternatives:

```typescript
// BEFORE - CommonJS pattern (problematic)
if (require.main === module) {
  // This script is being run directly
}

// AFTER - ES Module pattern
if (import.meta.url.endsWith(process.argv[1])) {
  // This script is being run directly
}
```

### 4. Create Module Utility Function

Implement a shared utility function for script execution detection:

```typescript
// File: src/utils/module-utils.ts
/**
 * Check if the current module is being run directly (not imported)
 * This is the ESM equivalent of 'require.main === module'
 */
export function isDirectExecution(): boolean {
  return import.meta.url.endsWith(process.argv[1]);
}
```

## Implementation Plan

The implementation will be executed in several phases:

### Phase 1: Fix Database Utility Structure

1. **Create Unified Database Connection Module**:

   ```typescript
   // File: packages/content-migrations/src/utils/db/execute-sql.ts
   import dotenv from 'dotenv';
   import pg from 'pg';

   // Load environment variables
   dotenv.config({ path: '.env.development' });

   const { Pool } = pg;

   // Connection pool for reuse
   let pool: pg.Pool | null = null;

   /**
    * Get database connection pool
    */
   export function getPool(): pg.Pool {
     if (!pool) {
       const connectionString =
         process.env.DATABASE_URI ||
         'postgresql://postgres:postgres@localhost:54322/postgres?schema=payload';
       pool = new Pool({ connectionString });
     }
     return pool;
   }

   /**
    * Execute SQL query with proper error handling
    */
   export async function executeSQL(
     query: string,
     params: any[] = [],
   ): Promise<pg.QueryResult> {
     const client = await getPool().connect();
     try {
       return await client.query(query, params);
     } finally {
       client.release();
     }
   }

   /**
    * Close database connections (for cleanup)
    */
   export async function closeConnections(): Promise<void> {
     if (pool) {
       await pool.end();
       pool = null;
     }
   }
   ```

2. **Create Symbolic Link or Copy in Scripts Directory**:
   - Ensure the database utility is accessible from both import paths

### Phase 2: Update Problematic Scripts

1. **Fix `clear-lesson-content.ts`**:

   ```typescript
   // File: packages/content-migrations/src/scripts/repair/utilities/clear-lesson-content.ts
   import { executeSQL } from '../../../../utils/db/execute-sql';

   // Rest of file remains the same, but update execution check

   // Execute the function if this script is run directly
   if (import.meta.url.endsWith(process.argv[1])) {
     clearLessonContent()
       .then((result) => {
         console.log('Result:', result);
         process.exit(result.success ? 0 : 1);
       })
       .catch((error) => {
         console.error('Unhandled error:', error);
         process.exit(1);
       });
   }
   ```

2. **Update Other Scripts with Similar Issues**:
   - Apply the same pattern to all affected scripts identified in the analysis
   - Prioritize scripts in the quiz management module

### Phase 3: Create Module Utility

1. **Implement Module Execution Check Utility**:

   ```typescript
   // File: packages/content-migrations/src/utils/module-utils.ts

   /**
    * Check if the current module is being run directly (not imported)
    * This is the ESM equivalent of 'require.main === module'
    */
   export function isDirectExecution(): boolean {
     // Using import.meta.url which is only available in ES modules
     return import.meta.url.endsWith(process.argv[1]);
   }
   ```

2. **Update Scripts to Use the Utility**:

   ```typescript
   import { isDirectExecution } from '../../utils/module-utils';

   // At the end of the file
   if (isDirectExecution()) {
     // This script is being run directly
     // Execute main function
   }
   ```

### Phase 4: Testing and Verification

1. **Test Individual Scripts**:

   - Run each fixed script individually to verify it works
   - Verify database connections open and close properly

2. **Test Migration Process**:
   - Run the full migration script to verify all issues are resolved
   - Monitor for any new errors or warnings

## Files to Modify

Based on our analysis, the following files need to be modified:

1. `packages/content-migrations/src/scripts/repair/utilities/clear-lesson-content.ts`
2. `packages/content-migrations/src/utils/db/execute-sql.ts` (create if missing)
3. `packages/content-migrations/src/scripts/utils/db/execute-sql.ts` (create if missing)
4. `packages/content-migrations/src/utils/module-utils.ts` (new file)
5. `packages/content-migrations/src/scripts/repair/quiz-management/core/fix-quiz-course-ids.ts`
6. Other quiz management scripts with similar import patterns

## Expected Outcomes

After implementing these fixes:

1. **ESM Compatibility**:

   - All scripts will execute correctly in ES module mode
   - No more errors about missing `.js` files or undefined `require`

2. **Consistent Import Paths**:

   - All files will use a consistent approach to importing utilities
   - Reduced duplication of utility code

3. **Robust Error Handling**:

   - Better error messages with more context
   - Proper connection pooling and cleanup

4. **Simplified Maintenance**:
   - Standardized patterns for direct script execution
   - Easier to understand and maintain utility functions

## Implementation Timeline

The implementation follows this timeline:

1. **Create Core Utilities** - Create the necessary utility files
2. **Fix Clear Lesson Content** - Repair the immediate error in the clear-lesson-content.ts file
3. **Fix Other Scripts** - Update all other affected scripts with the same pattern
4. **Test Migration** - Verify the full migration process works end-to-end

This approach prioritizes the most critical issues first while ensuring backward compatibility with existing code.
