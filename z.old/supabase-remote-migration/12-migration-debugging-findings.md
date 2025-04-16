# Supabase Remote Migration Debugging Findings

**Date:** April 16, 2025  
**Status:** In Progress

## Table of Contents

1. [Issue Assessment](#1-issue-assessment)
2. [Root Causes](#2-root-causes)
3. [Migration Script Analysis](#3-migration-script-analysis)
4. [Current Progress](#4-current-progress)
5. [Recommendations](#5-recommendations)

## 1. Issue Assessment

During our attempt to migrate Payload CMS data to the remote Supabase instance, we encountered several issues:

1. The script `supabase-remote-migration.ps1` fails when using various flags like `-UUIDTablesOnly` and `-SyncOnly` with an error: "The term 'param' is not recognized as the name of a cmdlet function..."
2. Schema migration fails with the error: "ERROR: relation 'payload.course_lessons\_\_downloads' does not exist" when trying to add columns to tables that don't exist yet.
3. The remote database reports that the 'payload' schema doesn't exist when running connection tests.
4. There are authentication/connection issues with the remote database.

## 2. Root Causes

The main root causes identified are:

1. **Schema Creation Order**: The migration attempts to modify tables in the 'payload' schema before the schema itself and the tables are created.
2. **Parameter Passing Issues**: There are issues with PowerShell parameter passing between scripts.
3. **Connection String Format**: The connection string format had issues, which we fixed by updating the URL format.
4. **Authentication Problems**: The database password in the connection string may not be correct for some operations.
5. **Script Execution Path**: The scripts assume certain functionality exists before it's actually created.

## 3. Migration Script Analysis

The migration system consists of multiple PowerShell scripts:

- **supabase-remote-migration.ps1**: Main wrapper script that orchestrates the migration process
- **setup-uuid-tables.ps1**: Responsible for detecting and managing UUID tables
- **migrate-schema.ps1**: Handles schema migration
- **migrate-content-progressive.ps1**: Implements progressive content migration
- **sync-migrations.ps1**: Synchronizes migration records between local and remote
- **utils/database.ps1**: Provides database connectivity functions
- **utils/logging.ps1**: Provides consistent logging functionality

The migration approach follows the strategy outlined in `10-revised-migration-strategy.md`:

1. Fix connection string issues
2. Synchronize migrations between local and remote
3. Migrate schema
4. Set up UUID table management
5. Progressively migrate content by type
6. Fix relationships
7. Verify content

However, these steps make an assumption that the 'payload' schema already exists in the remote database, which isn't the case.

## 4. Current Progress

We've identified and fixed the following issues:

1. **Connection String Fix**: Updated the connection string to the correct format with the proper project ID and region:

   ```
   postgres://postgres.ldebzombxtszzcgnylgq:password@aws-0-us-east-2.pooler.supabase.com:5432/postgres
   ```

2. **Schema Creation Script**: Created a SQL script (`create-payload-schema.sql`) to establish the 'payload' schema and necessary tracking tables.

3. **Logging and Database Utils**: Fixed issues in the logging and database utility modules:

   - Simplified logging functions to avoid string concatenation issues
   - Updated database connection testing to better handle Supabase CLI interactions
   - Improved error handling and reporting

4. **Connection Testing**: Modified the connection test script to focus primarily on the remote database, making it more resilient to local database issues.

## 5. Recommendations

Based on our findings, we recommend the following approach to fix the migration issues:

1. **Execute Create Schema SQL**: Directly execute the `create-payload-schema.sql` against the remote database to establish the 'payload' schema before running any other migration steps.

2. **Fix Parameter Passing**: Investigate and fix the parameter passing issue in the PowerShell scripts. The error suggests there might be syntax errors in the param blocks.

3. **Progressive Table Creation**: Modify the schema migration process to create tables incrementally rather than trying to modify them all at once. The current approach attempts to alter tables that don't exist.

4. **Simplified Migration Approach**: Consider breaking down the migration process into smaller, more focused steps:

   ```
   # 1. Initialize schema
   psql "postgres://postgres.ldebzombxtszzcgnylgq:password@aws-0-us-east-2.pooler.supabase.com:5432/postgres" -f scripts/orchestration/remote-migration/create-payload-schema.sql

   # 2. Migrate core tables first
   ./supabase-remote-migration.ps1 -ProgressiveOnly -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys

   # 3. Migrate posts content
   ./supabase-remote-migration.ps1 -ProgressiveOnly -SkipCore -SkipDocumentation -SkipCourses -SkipQuizzes -SkipSurveys
   ```

5. **Improved Error Handling**: Enhance error handling and logging in all scripts to provide more detailed information when issues occur. This will make it easier to diagnose and fix problems.

6. **Database State Verification**: Add more comprehensive verification steps to check the state of the database before executing potentially disruptive operations.

## Next Steps

1. Execute the `create-payload-schema.sql` directly against the remote database
2. Fix the parameter passing issues in the PowerShell scripts
3. Retry the progressive migration with one content type at a time
4. Implement improved error handling and verification

By addressing these issues, we should be able to successfully migrate the Payload CMS data to the remote Supabase instance.
