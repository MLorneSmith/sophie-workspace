# Final Supabase Remote Migration Implementation Plan

**Document Date:** April 15, 2025  
**Status:** Implementation Plan

## 1. Current State Assessment

Based on our comprehensive analysis of the database, migration scripts, and migration logs, we've identified the following current state:

### 1.1. What's Working

1. **Remote Connection Established**:

   - Successfully established connection to the remote Supabase instance
   - Connection string working: `postgres://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`

2. **Schema Migration**:

   - Database schema successfully pushed to remote instance
   - Table structures for Payload CMS created (47+ tables in payload schema)
   - UUID table tracking infrastructure (`dynamic_uuid_tables`) created

3. **Script Organization**:
   - Migration scripts properly organized into logical directories
   - Master script (`supabase-remote-migration.ps1`) provides a central interface
   - Test scripts for connection verification implemented

### 1.2. What's Not Working

1. **Data Migration Failure**:

   - Tables exist in remote database but are empty (confirmed for posts)
   - Data migration scripts are not successfully populating content
   - Relationship tables not properly populated

2. **Script Issues**:

   - Multiple redundant connection test scripts with varying functionality
   - Apparent issues with CLI flags for dump and push operations
   - Missing progressive content migration implementation

3. **Verification System**:
   - Incomplete verification steps after migration operations
   - No comprehensive content integrity validation

## 2. Technical Challenges to Resolve

### 2.1. CLI Command Issues

1. **Supabase CLI Dump Limitations**:

   - The `supabase db dump` command has limitations with complex schemas
   - Need to use proper flags (`--local`, `--include-seed`, etc.)
   - May need to split dumps by table/schema for reliability

2. **Connection String Format**:

   - Ensure consistent connection string format across all scripts
   - Verify proper escaping in PowerShell context

3. **Permission Issues**:
   - Ensure commands run with appropriate permissions
   - Verify write access to remote database

### 2.2. Complex Data Requirements

1. **UUID Table Handling**:

   - Special handling for Payload's dynamically created UUID tables
   - Need for additional columns (`path`, `id`) on UUID tables

2. **Relationship Management**:

   - Complex relationships between content types
   - Downloads and media relationship mapping

3. **Lexical Format for Rich Text**:
   - Proper handling of Lexical format for rich text content
   - Format correction for consistent data

## 3. Implementation Plan

### 3.1. Script Cleanup and Consolidation

1. **Connection Test Scripts**:

   - **Keep**: `direct-connection-test.ps1` (comprehensive) and `basic-connection-test.ps1` (quick check)
   - **Delete**: `supabase-test.ps1` and `test-push-capability.ps1` (redundant)
   - Update references in master script to use the retained scripts

2. **Configuration Cleanup**:
   - Verify and clean up environment variable handling
   - Ensure consistent database URL formatting
   - Remove hardcoded credentials where they exist

### 3.2. Progressive Content Migration Implementation

Implement a step-by-step migration approach with verification at each stage:

1. **Core System Tables**:

   ```
   users
   media
   payload_preferences
   payload_migrations
   ```

2. **Posts Content**:

   ```
   posts
   posts_rels
   posts_categories
   posts_tags
   posts__downloads
   ```

3. **Documentation Content**:

   ```
   documentation
   documentation_rels
   documentation_categories
   documentation_tags
   documentation_breadcrumbs
   documentation__downloads
   ```

4. **Course Content**:

   ```
   courses
   courses_rels
   courses__downloads
   course_lessons
   course_lessons_rels
   course_lessons__downloads
   course_quizzes
   course_quizzes_rels
   course_quizzes__downloads
   ```

5. **Quiz/Survey Content**:
   ```
   quiz_questions
   quiz_questions_rels
   quiz_questions_options
   surveys
   surveys_rels
   surveys__downloads
   survey_questions
   survey_questions_rels
   survey_questions_options
   ```

### 3.3. Specific Implementation Updates

1. **Updated Posts Migration Command**:

   ```powershell
   # Improved approach
   supabase db dump --data-only --schema payload --table posts,posts_rels,posts_categories,posts_tags,posts__downloads --local > posts_data.sql
   supabase db push --db-url "[$REMOTE_DB_URL]" --use-seed-data
   ```

2. **UUID Table Fix Implementation**:

   ```powershell
   # In fix-remote-uuid-tables.ps1

   # First, ensure the tracking table exists
   Invoke-RemoteSql "
   CREATE TABLE IF NOT EXISTS payload.dynamic_uuid_tables (
     table_name TEXT PRIMARY KEY,
     primary_key TEXT DEFAULT 'id',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     needs_path_column BOOLEAN DEFAULT TRUE
   );"

   # Then scan and fix UUID tables
   Invoke-RemoteSql "
   DO $$
   DECLARE
     r RECORD;
     uuid_pattern TEXT := '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
   BEGIN
     FOR r IN
       SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'payload'
       AND table_name ~ uuid_pattern
     LOOP
       -- Insert into tracking table if not exists
       INSERT INTO payload.dynamic_uuid_tables (table_name)
       VALUES (r.table_name)
       ON CONFLICT (table_name) DO NOTHING;

       -- Add path column if it doesn't exist
       PERFORM payload.ensure_uuid_table_columns(r.table_name);
     END LOOP;
   END;
   $$;
   "
   ```

3. **Lexical Format Fix**:
   ```powershell
   # Fix Lexical format for specific content type
   Exec-Command -command "pnpm --filter @kit/content-migrations run fix:lexical-format -- --collection $contentType" -description "Fixing Lexical format for $contentType"
   ```

### 3.4. Master Migration Script Updates

1. **Connection Testing**:

   ```powershell
   # Basic connection test first (quick)
   if (-not (& "$PSScriptRoot\tests\basic-connection-test.ps1")) {
     Write-Host "Basic connection test failed. Attempting detailed diagnostics..." -ForegroundColor Red
     & "$PSScriptRoot\tests\direct-connection-test.ps1"
     exit 1
   }

   # More detailed test if needed
   Write-Host "Basic connection successful. Running detailed verification..." -ForegroundColor Green
   if (-not (& "$PSScriptRoot\tests\direct-connection-test.ps1")) {
     Write-Host "Detailed connection test failed. Please check the logs and try again." -ForegroundColor Red
     exit 1
   }
   ```

2. **Progressive Migration Execution**:

   ```powershell
   # Build progressive migration parameters
   $progressiveParams = @()
   if ($SkipCore) { $progressiveParams += "-SkipCore" }
   if ($SkipDocumentation) { $progressiveParams += "-SkipDocumentation" }
   if ($SkipCourses) { $progressiveParams += "-SkipCourses" }
   if ($SkipQuizzes) { $progressiveParams += "-SkipQuizzes" }
   if ($SkipSurveys) { $progressiveParams += "-SkipSurveys" }
   if ($SkipVerify) { $progressiveParams += "-SkipVerify" }

   # Run progressive migration
   Write-Host "Running progressive content migration..." -ForegroundColor Yellow
   & "$PSScriptRoot\migrate-content-progressive.ps1" @progressiveParams
   ```

## 4. Testing Strategy

### 4.1. Connection Testing

1. **Basic Connectivity**:

   - Use `basic-connection-test.ps1` for quick verification
   - Ensure proper URL format and remote project access

2. **Schema Verification**:
   - Use `direct-connection-test.ps1` for schema verification
   - Confirm all required schemas exist

### 4.2. Migration Testing

For each content type, implement verification:

1. **Table Row Count**:

   ```powershell
   Write-Host "Verifying $contentType migration..." -ForegroundColor Yellow
   $rowCount = Invoke-RemoteSql "SELECT COUNT(*) FROM payload.$contentType;"
   Write-Host "$contentType count: $rowCount" -ForegroundColor $(if ($rowCount -gt 0) { "Green" } else { "Red" })
   ```

2. **Relationship Verification**:

   ```powershell
   $relCount = Invoke-RemoteSql "SELECT COUNT(*) FROM payload.${contentType}_rels;"
   Write-Host "$contentType relationships: $relCount" -ForegroundColor $(if ($relCount -gt 0) { "Green" } else { "Red" })
   ```

3. **Content Integrity**:
   ```powershell
   # Check if required fields exist
   $integrityCheck = Invoke-RemoteSql "SELECT COUNT(*) FROM payload.$contentType WHERE title IS NULL OR title = '';"
   Write-Host "Records with missing titles: $integrityCheck" -ForegroundColor $(if ($integrityCheck -eq 0) { "Green" } else { "Red" })
   ```

## 5. Implementation Sequence

### 5.1. Immediate Steps

1. **Clean Up Test Scripts**:

   - Remove redundant test scripts while keeping the most functional ones
   - Update master script to use the correct test scripts

2. **Fix Posts Migration**:

   - Fix the posts migration script as a test case
   - Ensure proper flags and command sequence
   - Verify posts content appears in remote database

3. **Implement Progressive Migration**:
   - Create/update `migrate-content-progressive.ps1` with proper structure
   - Implement modular migration functions for each content type
   - Add detailed verification after each migration step

### 5.2. Core Functionality Implementation

1. **UUID Table Management**:

   - Fix/update `fix-remote-uuid-tables.ps1` implementation
   - Ensure the script creates and maintains the tracking table
   - Verify UUID tables have required columns

2. **Relationship Repair**:
   - Implement comprehensive relationship fixing
   - Ensure downloads and media relationships work correctly
   - Fix Lexical format in rich text fields

### 5.3. Verification System

1. **Content Verification**:

   - Implement/update verification scripts for each content type
   - Check both count and content integrity
   - Verify relationships across content types

2. **Reporting System**:
   - Add detailed reporting after migration
   - Implement color-coded console output for status
   - Generate migration summary logs

## 6. Success Criteria

The migration will be considered successful when:

1. All tables from the local database exist in the remote database
2. Row counts match between local and remote for each table
3. Content relationships are properly established
4. UUID tables have proper columns and tracking
5. Rich text content formats correctly
6. All verification scripts pass without errors

## 7. Rollback Plan

If critical issues are encountered during migration:

1. **Partial Rollback**:

   - Remove failing content tables
   - Retry migration with more detailed logging
   - Fix issues in specific content types

2. **Full Rollback**:
   - Reset remote database schema
   - Re-run schema migration
   - Begin content migration from scratch

## 8. Summary

This plan addresses the key issues currently preventing successful remote migration:

1. Fixes CLI command usage for proper data migration
2. Provides step-by-step implementation for progressive content migration
3. Ensures UUID tables and relationships are properly maintained
4. Implements comprehensive verification at each stage
5. Cleans up redundant and potentially problematic test scripts

By following this plan, we should be able to successfully migrate all content to the remote Supabase instance while maintaining proper relationships and content integrity.
