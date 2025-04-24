# ESM PostgreSQL Import Fix Plan - 2025-04-23

## Problem Analysis

The content migration system is currently failing with the following error during the migration process:

```
SyntaxError: The requested module 'pg' does not provide an export named 'Client'
```

This error occurs specifically in the script `packages/content-migrations/src/scripts/repair/quiz-management/core/fix-quiz-course-ids.ts` and potentially other scripts that use a similar import pattern.

### Root Cause

After analyzing the codebase, I've identified several key issues:

1. **Incorrect ES Module Import Pattern**:

   - The project is configured as an ES module (`"type": "module"` in package.json)
   - Many scripts are using the CommonJS import pattern with the 'pg' package:
     ```typescript
     import { Client } from 'pg';

     // This is incorrect in ES modules
     ```
   - The 'pg' package doesn't expose named exports directly when used in an ES module context

2. **Inconsistent Import Patterns**:

   - Some files in the project already use the correct ES module import pattern:
     ```typescript
     import pg from 'pg';

     const { Client } = pg;
     ```
   - Others use:
     ```typescript
     import pkg from 'pg';

     const { Pool } = pkg;
     ```

3. **Error Occurs During Migration Step**:
   - The error happens during the "Running consolidated quiz course ID fix" step
   - This indicates that the problematic file is being executed as part of the migration process

## Affected Files

Based on the search of import patterns in the codebase, these files require attention:

1. Primary file causing the error:

   - `packages/content-migrations/src/scripts/repair/quiz-management/core/fix-quiz-course-ids.ts`

2. Other files with the same import pattern:
   - `packages/content-migrations/src/scripts/repair/quiz-management/utilities/verify-quiz-system-integrity-comprehensive.ts`
   - `packages/content-migrations/src/scripts/repair/quiz-management/utilities/fix-invalid-quiz-references.ts`
   - `packages/content-migrations/src/scripts/repair/quiz-management/lesson-quiz-relationships/fix-lesson-quiz-relationships-comprehensive.ts`
   - `packages/content-migrations/src/scripts/repair/quiz-management/core/run-direct-quiz-fix.ts`
   - `packages/content-migrations/src/scripts/repair/quiz-management/core/repair-quiz-system.ts`
   - `packages/content-migrations/src/scripts/repair/quiz-management/core/fix-unidirectional-quiz-questions.ts`
   - `packages/content-migrations/src/scripts/repair/quiz-management/core/fix-course-quiz-relationships.ts`
   - `packages/content-migrations/src/scripts/repair/database/fix-payload-relationships-strict.ts`

## Solution Design

### 1. Update Import Pattern in Affected Files

Replace incorrect import statements with the proper ES module pattern:

```typescript
// BEFORE:
import { Client } from 'pg';

// AFTER:
import pg from 'pg';
const { Client } = pg;
```

This change aligns with the successful pattern used in other files in the project.

### 2. Improve Environment Variable Handling

The error happens in the context of trying to load environment variables. Enhance the error handling to make scripts more resilient:

```typescript
// Add this error handling for dotenv loading
try {
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.development' });
  console.log('Loaded environment variables');
} catch (error) {
  console.log('Could not load dotenv, using default connection string');
}
```

### 3. Consolidate Database Connection Logic

To prevent future issues and improve maintainability:

1. Update or create a centralized database utility that properly handles ES module imports:

   - `packages/content-migrations/src/utils/db/connection.ts`
   - This would expose functions for creating Clients and Pools with proper error handling

2. Consider updating the scripts to use this centralized utility rather than implementing connection logic independently.

## Implementation Plan

1. **Fix Primary Error**:

   - Update import pattern in `fix-quiz-course-ids.ts`
   - Test by running the specific script in isolation

2. **Fix Related Files**:

   - Apply the same import pattern fix to all identified files
   - Prioritize files in the quiz management module

3. **Test Full Migration**:

   - Run the full `reset-and-migrate.ps1` script
   - Monitor for any additional errors

4. **Long-term Improvements** (optional, after initial fixes):
   - Create or update the centralized database connection utility
   - Gradually refactor scripts to use this central utility
   - Add ESLint rule to prevent incorrect import patterns in the future

## Expected Outcomes

After implementation, the migration process should:

1. Successfully complete the "Running consolidated quiz course ID fix" step
2. No longer show "module 'pg' does not provide an export named 'Client'" errors
3. Successfully execute all quiz management scripts as part of the migration

## References

- ES Module documentation: https://nodejs.org/api/esm.html
- PostgreSQL Node.js client (pg) package: https://node-postgres.com/
- TypeScript ESM support: https://www.typescriptlang.org/docs/handbook/esm-node.html
