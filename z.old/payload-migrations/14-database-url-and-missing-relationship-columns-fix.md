# Database URL and Missing Relationship Columns Fix

## Issue Summary

We encountered two critical issues in the content migration system:

1. **Environment Variable Mismatch**: The verification scripts were looking for `DATABASE_URL` environment variable, but only `DATABASE_URI` was defined in the environment files.

2. **Missing Relationship Tables and Columns**: Some relationship tables (notably `downloads_rels`) were missing entirely, causing failures when the verification scripts attempted to check for column existence in those tables.

## Root Cause Analysis

### Environment Variable Issue

- The content migration scripts used two different environment variable names inconsistently:

  - `DATABASE_URL` in newer scripts like `verify-relationship-columns.ts`
  - `DATABASE_URI` in configuration files like `.env.development`

- This discrepancy caused scripts to fail with the error: `DATABASE_URL environment variable is not set`

### Missing Relationship Tables

- The relationship verification assumed all tables listed in `relationshipTables` already existed
- When a table like `downloads_rels` didn't exist, the script attempted to check for columns in a non-existent table
- This led to SQL errors like: `relation "payload.downloads_rels" does not exist`

## Solution Implementation

### 1. Environment Variable Standardization

We implemented a dual-approach solution:

1. **Modified `verify-relationship-columns.ts`** to check for both environment variable names:

   ```typescript
   // Database connection string from environment variables - check both possible names
   const connectionString =
     process.env.DATABASE_URL || process.env.DATABASE_URI;

   if (!connectionString) {
     console.error(
       'Neither DATABASE_URL nor DATABASE_URI environment variables are set',
     );
     console.error(
       'Please make sure one of these variables is defined in your .env file',
     );
     console.error(
       'Expected format: postgresql://username:password@host:port/database?schema=payload',
     );
     process.exit(1);
   }
   ```

2. **Added `DATABASE_URL` to `.env.development`** for future compatibility:

   ```
   # Also provide DATABASE_URL for scripts that expect that name instead
   DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres?schema=payload
   ```

3. **Updated `reset-and-migrate.ps1`** to check for environment variables before running verification:

   ```powershell
   # Check for required environment variables before running verification
   Log-Message "  Checking for required environment variables..." "Yellow"
   if (-not $env:DATABASE_URL -and $env:DATABASE_URI) {
       Log-Message "  Setting DATABASE_URL from DATABASE_URI for compatibility" "Yellow"
       $env:DATABASE_URL = $env:DATABASE_URI
   }

   # If still not set, check the .env.development file
   if (-not $env:DATABASE_URL) {
       $envFile = Join-Path -Path (Get-Location) -ChildPath ".env.development"
       if (Test-Path -Path $envFile) {
           Log-Message "  Loading environment variables from .env.development" "Yellow"
           Get-Content -Path $envFile | ForEach-Object {
               if ($_ -match '^\s*DATABASE_URL=(.*)$') {
                   $env:DATABASE_URL = $matches[1]
                   Log-Message "  Set DATABASE_URL from .env.development file" "Yellow"
               } elseif (-not $env:DATABASE_URL -and $_ -match '^\s*DATABASE_URI=(.*)$') {
                   $env:DATABASE_URL = $matches[1]
                   Log-Message "  Set DATABASE_URL from DATABASE_URI in .env.development file" "Yellow"
               }
           }
       }
   }
   ```

### 2. Relationship Table Creation and Repair

1. **Created Utility Functions** in `relationship-columns.ts`:

   ```typescript
   export function generateRelationshipTableSql(tableName: string): string {
     return `
   CREATE TABLE IF NOT EXISTS payload.${tableName} (
     id UUID PRIMARY KEY,
     _parent_id UUID NOT NULL,
     field TEXT,
     value UUID,
     parent_id UUID,
     downloads_id UUID,
     posts_id UUID,
     documentation_id UUID,
     surveys_id UUID,
     survey_questions_id UUID,
     courses_id UUID,
     course_lessons_id UUID,
     course_quizzes_id UUID,
     quiz_questions_id UUID,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   `;
   }
   ```

2. **Implemented Table Existence Check** in `fix-relationship-columns.ts`:

   ```typescript
   // First check which tables exist and create missing ones
   for (const table of relationshipTables) {
     // Check if table exists
     const tableExistsResult = await executeSQL(`
       SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'payload'
         AND table_name = '${table}'
       ) as table_exists;
     `);

     const tableExists = tableExistsResult.rows?.[0]?.table_exists === true;

     if (!tableExists) {
       console.log(`\nTable payload.${table} does not exist, creating it...`);

       // Create table with all required columns
       await executeSQL(`
         CREATE TABLE payload.${table} (
           id UUID PRIMARY KEY,
           _parent_id UUID NOT NULL,
           field TEXT,
           value UUID,
           parent_id UUID,
           downloads_id UUID,
           posts_id UUID,
           documentation_id UUID,
           surveys_id UUID,
           survey_questions_id UUID,
           courses_id UUID,
           course_lessons_id UUID,
           course_quizzes_id UUID,
           quiz_questions_id UUID,
           created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
           updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
         );
       `);

       console.log(`Table payload.${table} created successfully.`);
     } else {
       // Table exists, add any missing columns
       console.log(`\nAdding missing columns to ${table}...`);
       const sql = generateAddRelationshipColumnsSql(table);
       await executeSQL(sql);
     }
   }
   ```

3. **Updated Migration Workflow** in `reset-and-migrate.ps1` to pre-emptively fix relationship issues:

   ```powershell
   # Pre-emptively run the relationship columns repair script
   Log-Message "  Pre-emptively fixing relationship columns..." "Yellow"
   $fixResult = Exec-Command -command "pnpm --filter @kit/content-migrations run repair:relationship-columns" -description "Fixing relationship columns" -captureOutput

   # Now verify the relationship columns
   Log-Message "  Verifying relationship columns..." "Yellow"
   $relationshipColumnsVerification = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:relationship-columns" -description "Verifying relationship columns" -captureOutput
   ```

4. **Added ESM-Compatible Code** to ensure scripts work in ESM module environment:

   ```typescript
   // Run the fix directly
   fixRelationshipColumns()
     .then((success) => {
       if (process.argv[1]?.includes('fix-relationship-columns.ts')) {
         process.exit(success ? 0 : 1);
       }
     })
     .catch((error) => {
       console.error('\nUnhandled error:', error);
       if (process.argv[1]?.includes('fix-relationship-columns.ts')) {
         process.exit(1);
       }
     });
   ```

5. **Created Proper SQL Connection Functions** for database operations:
   ```typescript
   export async function executeSQL(
     sql: string,
     params: any[] = [],
   ): Promise<any> {
     let client;
     try {
       client = await pool.connect();
       const result = await client.query(sql, params);
       return result;
     } catch (error) {
       console.error('Error executing SQL:', error);
       throw error;
     } finally {
       if (client) {
         client.release();
       }
     }
   }
   ```

### 3. Migration Testing

1. **Executed Reset Script**:

   - The modified script successfully executed without errors
   - All verification steps now pass, including relationship columns

2. **Verified Fix**:
   - Missing tables like `downloads_rels` were automatically created
   - Previously missing columns were added to existing tables
   - All relationship verification checks now pass

## Benefits of the Solution

1. **Robustness**:

   - The system now handles missing tables gracefully by creating them
   - Environment variable mismatches are handled with fallbacks

2. **Self-Healing**:

   - The pre-emptive fix step automatically repairs issues before verification
   - Migration now continues even if relationship tables were missing

3. **Developer Experience**:

   - Clearer error messages with suggested actions
   - Migration logs provide more details about what is happening

4. **Future-Proofing**:
   - The solution handles both environment variable naming conventions
   - The relationship table creation works for any newly added relationship tables

## Lessons Learned

1. **Consistent Environment Variable Naming**: Standardize on a single naming convention for environment variables across the project.

2. **Defensive Programming**: Always check for the existence of database objects before attempting to modify them.

3. **Pre-emptive Fixes**: For critical validation steps, include automatic repair mechanisms that run before validation.

4. **ESM Compatibility**: Pay attention to Node.js module system compatibility when writing scripts.

5. **Comprehensive Logging**: Detailed logs significantly aid in troubleshooting complex migration scripts.
