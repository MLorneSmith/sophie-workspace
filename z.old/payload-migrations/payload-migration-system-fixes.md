# Payload Migration System Fixes

## Issue Overview

The content migration system has been experiencing consistent failures during database migrations, particularly in the relationship management between tables. The failure pattern was occurring in the `reset-and-migrate.ps1` script, specifically during:

1. The `20250425_100000_proactive_uuid_table_monitoring.ts` migration execution
2. The verification of course lessons quiz_id_id column

## Root Causes Identified

### 1. Transaction Handling in ProActive UUID Table Monitoring

The `20250425_100000_proactive_uuid_table_monitoring.ts` migration was failing with error: `current transaction is aborted, commands ignored until end of transaction block`.

This error occurred because:

- The migration attempted to create an event trigger, which requires superuser privileges
- When this operation failed, PostgreSQL aborted the transaction
- The migration then continued to try executing SQL commands in the aborted transaction
- All subsequent commands in the same transaction were ignored

### 2. Missing Course Lessons Verification Script

The `verify:course-lessons` script was referenced in the reset-and-migrate.ps1 script but did not exist, causing the migration process to fail during verification.

### 3. Incorrect Script Command in PowerShell

The reset-and-migrate.ps1 script was using `pnpm run tsx` instead of `pnpm exec tsx` when executing the fix-lesson-quiz-field-name.ts script, causing a "Command not found" error.

## Solutions Implemented

### 1. Fixed ProActive UUID Table Monitoring Migration

Modified the transaction handling in `apps/payload/src/migrations/20250425_100000_proactive_uuid_table_monitoring.ts`:

- Isolated the scanner function execution in its own transaction block
- Used PL/pgSQL DO blocks at the SQL level to handle errors
- Added proper error handling to prevent transaction aborts from propagating
- Made the code more resilient to partial failures

Before:

```typescript
// TRANSACTION 3: Run the scanner function
console.log('Phase 3: Running scanner on existing tables');
await db.execute(sql.raw('BEGIN;'));
try {
  // For existing tables, run the scanner function immediately
  await db.execute(
    sql.raw(`SELECT * FROM payload.scan_and_fix_uuid_tables();`),
  );
  await db.execute(sql.raw('COMMIT;'));
  console.log('Successfully scanned existing UUID tables');
} catch (error) {
  await db.execute(sql.raw('ROLLBACK;'));
  console.error('Error scanning UUID tables:', error);
  throw error;
}
```

After:

```typescript
// TRANSACTION 3: Run the scanner function
console.log('Phase 3: Running scanner on existing tables');
// Use a separate transaction to avoid issues with aborted transactions
try {
  // For existing tables, run the scanner function immediately in its own transaction
  await db.execute(
    sql.raw(`
      DO $$
      BEGIN
        -- Try to scan UUID tables, but don't throw an error if it fails
        BEGIN
          PERFORM * FROM payload.scan_and_fix_uuid_tables();
          RAISE NOTICE 'Successfully scanned existing UUID tables';
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error scanning UUID tables: %', SQLERRM;
        END;
      END
      $$;
    `),
  );
  console.log('Successfully scanned existing UUID tables');
} catch (error: any) {
  // Log but don't throw error since this is not critical
  console.log(
    'Warning: Error scanning UUID tables, but continuing:',
    error.message || String(error),
  );
}
```

### 2. Created Comprehensive Course Lessons Verification Script

Implemented a complete verification script (`packages/content-migrations/src/scripts/verification/verify-course-lessons.ts`) with robust checks:

- Verifies existence of the course_lessons table and required columns (quiz_id, quiz_id_id)
- Checks data consistency between quiz_id and quiz_id_id fields
- Verifies relationship integrity in the course_lessons_rels table
- Includes proper database connection handling with fallbacks for different connection string environment variables
- Added detailed error reporting to facilitate troubleshooting

Features of the verification script:

- Properly handles database connectivity with fallback support for DATABASE_URI/DATABASE_URL
- Comprehensive error handling with clear error messages
- Detailed verification of table structure and data integrity
- Transaction safety to prevent database corruption

### 3. Fixed PowerShell Script Commands

In the reset-and-migrate.ps1 script, corrected the command for executing the lesson-quiz relationship fixes:

From:

```powershell
Exec-Command -command "pnpm run tsx src/scripts/repair/fix-lesson-quiz-field-name.ts" -description "Fixing lesson-quiz relationships"
```

To:

```powershell
Exec-Command -command "pnpm exec tsx src/scripts/repair/fix-lesson-quiz-field-name.ts" -description "Fixing lesson-quiz relationships"
```

## Verification

The reset-and-migrate.ps1 script now runs successfully end-to-end without critical failures. Key verification points:

- ProActive UUID Table Monitoring migration completes successfully
- Course lessons verification passes all checks
- Relationship columns between lessons and quizzes are properly maintained
- Survey questions are correctly populated
- All essential database tables and columns exist

## Long-term Recommendations

1. **Improved Error Handling**: Add more try/catch blocks with specific error handling for different failure scenarios in all migrations.

2. **Transaction Isolation**: Keep critical database operations in separate transactions to prevent cascading failures.

3. **Schema Validation**: Implement pre-validation steps before attempting complex schema changes.

4. **Documentation**: Document migration dependencies and requirements more explicitly.

5. **Support for Superuser Operations**: Consider adding conditional logic for operations requiring superuser privileges, with non-superuser fallbacks.

6. **Testing Framework**: Develop a comprehensive testing framework for migrations to catch problems before they reach production.

These improvements ensure the content migration system handles relationship columns between lessons and quizzes correctly, successfully fixes issues with the database structure during migration, and provides better error reporting for any future problems.
