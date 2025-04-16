# Revised Supabase Remote Migration Plan

**Document Date:** April 15, 2025

## Current Status Assessment

Based on analysis of project files, logs, and existing migration plans, here's the current state of the migration effort:

### What's Working

1. **Schema Migration**:

   - Successful schema push to the remote Supabase instance confirmed in logs (migration-log-20250415-161158-761.txt)
   - Schema structure properly deployed with all necessary tables
   - The remote connection using session mode pooler format is functional:
     ```
     postgres://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:5432/postgres
     ```

2. **Migration Script Organization**:
   - Scripts reorganized into a maintainable structure
   - Centralized wrapper script (`supabase-remote-migration.ps1`) implemented
   - Test scripts in place for connection verification

### What's Not Working

1. **Post Data Migration**:

   - Dump attempts for the payload schema fail (migration-log-20250415-162500-474.txt)
   - Command `supabase db dump --data-only --schema payload` fails with exit code 1

2. **Content Relationship Handling**:
   - Specialized handling for UUID tables not fully implemented on remote database
   - Relationship fixes not yet applied
   - Lexical format corrections not applied

## Migration Challenges Analysis

The migration presents several technical challenges:

### 1. Complex Content Schema

- Payload CMS integration uses a sophisticated schema with 48+ tables in the payload schema
- Complex relationship tables with multiple foreign keys
- Special handling required for downloads and media relationships

### 2. UUID Table Management

- Payload CMS dynamically creates tables with UUID names for relationship queries
- These tables require additional columns (`path`, `id`) that aren't created automatically
- Current system uses a multi-tiered approach with database views and helper functions

### 3. CLI Tool Limitations

- Supabase CLI has limitations with complex schema dumping
- Payload-specific tables may require special handling
- PostgreSQL type consistency issues between local and remote

### 4. Rich Text Content

- Lexical rich text format requires special handling
- Post content integrity verification needed
- Relationship integrity for embedded content must be maintained

## Recommended Migration Strategy

We propose a revised strategy focusing on progressive, incremental migration with thorough verification at each stage.

### 1. Fix the Posts Migration Approach

The current approach using `supabase db dump --schema payload` is failing. We should:

1. **Use Table-Specific Dumps**:

   ```powershell
   supabase db dump --data-only --table payload.posts,payload.posts_rels,payload.posts_categories,payload.posts_tags > posts_dump.sql
   ```

2. **Alternatively, Use PostgreSQL Native Commands**:

   ```powershell
   pg_dump --data-only --schema=payload --table=posts --table=posts_rels --table=posts_categories --table=posts_tags postgres://localhost:54322/postgres > posts_dump.sql
   ```

3. **Process Dump Files With PowerShell**:
   - Extract relevant INSERT statements
   - Create dedicated seed files for each content type

### 2. Progressive Content Migration

Rather than migrating all data in one step, implement a staged approach:

1. **Phase 1: Core System Tables**

   - `payload.users`
   - `payload.media`
   - `payload.payload_preferences`
   - `payload.payload_migrations`

2. **Phase 2: Blog Content**

   - `payload.posts` and related tables
   - `payload.posts_categories` and `payload.posts_tags`
   - `payload.posts_rels` and relationship tables

3. **Phase 3: Documentation Content**

   - `payload.documentation` and related tables
   - `payload.documentation_categories` and `payload.documentation_tags`
   - `payload.documentation_breadcrumbs`

4. **Phase 4: Course Content**

   - `payload.courses` and related tables
   - `payload.course_lessons` and related tables
   - `payload.course_quizzes` and related tables

5. **Phase 5: Quiz and Survey Content**
   - `payload.quiz_questions` and related tables
   - `payload.survey_questions` and related tables
   - `payload.surveys` and related tables

### 3. UUID Table Monitoring Implementation

Port the existing UUID table monitoring to the remote database:

1. **Create Required Tracking Tables**:

   - Ensure `payload.dynamic_uuid_tables` exists on remote
   - Port tracking mechanisms for UUID-pattern tables

2. **Implement Multi-Tiered Approach for Remote**:
   - Create database views as primary abstraction layer
   - Implement helper functions for UUID table access
   - Configure fallback strategy for remote environment

### 4. Verification and Integration

After each migration phase:

1. **Content Verification**:

   - Run verification scripts against remote database
   - Check relationship integrity
   - Verify content completeness

2. **Integration Testing**:
   - Test application functionality with remote database
   - Verify Payload CMS admin interface functionality
   - Test course progression and content relationships

## Detailed Implementation Plan

### Phase 1: Improved Posts Migration Implementation

1. **Create Direct PostgreSQL Dump Script**:

```powershell
# migrate-posts-direct.ps1
param (
    [switch]$SkipVerify
)

# Import required modules
. "$PSScriptRoot\scripts\orchestration\utils\path-management.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "posts-migration-direct"

try {
    Log-Phase "POSTS DUMP PHASE"

    # Create temporary directory for dumps
    $dumpDir = Join-Path -Path $env:TEMP -ChildPath "posts_dumps_direct"
    New-Item -ItemType Directory -Path $dumpDir -Force | Out-Null

    # Create dumps for each posts-related table
    $postsTables = @(
        "posts",
        "posts_rels",
        "posts_categories",
        "posts_tags",
        "posts__downloads"
    )

    # Dump each table individually using pg_dump
    foreach ($table in $postsTables) {
        $dumpFile = Join-Path -Path $dumpDir -ChildPath "$table.sql"
        Log-Message "Dumping payload.$table table to $dumpFile" "Yellow"

        # Use pg_dump for more control
        $pgDumpCmd = "pg_dump --data-only --schema=payload --table=payload.$table postgres://postgres:postgres@localhost:54322/postgres > `"$dumpFile`""
        Exec-Command -command $pgDumpCmd -description "Dumping payload.$table"
    }

    # Combine dumps into a single file
    $combinedDumpFile = Join-Path -Path $dumpDir -ChildPath "posts_combined.sql"
    Log-Message "Combining dumps into $combinedDumpFile" "Yellow"

    # Create empty combined file
    New-Item -ItemType File -Path $combinedDumpFile -Force | Out-Null

    # Add header
    Add-Content -Path $combinedDumpFile -Value "-- Posts Data Migration Script"
    Add-Content -Path $combinedDumpFile -Value "-- Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Add-Content -Path $combinedDumpFile -Value ""
    Add-Content -Path $combinedDumpFile -Value "BEGIN;"

    # Concatenate all dump files
    foreach ($table in $postsTables) {
        $dumpFile = Join-Path -Path $dumpDir -ChildPath "$table.sql"
        if (Test-Path $dumpFile) {
            $content = Get-Content -Path $dumpFile -Raw
            Add-Content -Path $combinedDumpFile -Value "-- Table: payload.$table"
            Add-Content -Path $combinedDumpFile -Value $content
            Add-Content -Path $combinedDumpFile -Value ""
        }
    }

    # Add transaction end
    Add-Content -Path $combinedDumpFile -Value "COMMIT;"

    Log-Phase "POSTS RESTORE PHASE"

    # Apply to remote database
    Log-Message "Applying posts data to remote database..." "Yellow"
    $psqlCmd = "psql `"$env:REMOTE_DATABASE_URL`" -f `"$combinedDumpFile`""
    Exec-Command -command $psqlCmd -description "Applying posts data to remote"

    # Run verification if needed
    if (-not $SkipVerify) {
        Log-Phase "VERIFICATION PHASE"

        # Temporarily set DATABASE_URI to remote
        $originalDatabaseUri = $env:DATABASE_URI
        $env:DATABASE_URI = $env:REMOTE_DATABASE_URL

        # Run verification script
        Set-ProjectRootLocation
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Verifying posts content on remote..." "Yellow"
            Exec-Command -command "pnpm run verify:post-content" -description "Verifying posts content"

            # Restore original DATABASE_URI
            $env:DATABASE_URI = $originalDatabaseUri
        }
    }

    Log-Success "Posts migration completed successfully"
}
catch {
    Log-Error "CRITICAL ERROR: Posts migration failed: $_"
    exit 1
}
finally {
    # Clean up temp files
    if (Test-Path $dumpDir) {
        Remove-Item -Path $dumpDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
```

### Phase 2: UUID Table Handling Implementation

1. **Create a Remote UUID Table Fix Script**:

```powershell
# fix-remote-uuid-tables.ps1

param (
    [string]$RemoteDbUrl = $env:REMOTE_DATABASE_URL
)

# Import required modules
. "$PSScriptRoot\scripts\orchestration\utils\path-management.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"

# Initialize logging
Initialize-Logging -logPrefix "uuid-tables-fix"

try {
    Log-Phase "UUID TABLE FIX PHASE"

    # Connect to remote database
    Log-Message "Connecting to remote database..." "Yellow"
    $testConnection = Exec-Command -command "psql `"$RemoteDbUrl`" -c `"SELECT 1`"" -description "Testing remote connection" -captureOutput

    # Port the UUID table scanner to work on remote
    Log-Step "Running UUID table scanner on remote" 1

    # SQL to set up tracking table
    $setupSql = @"
    DO \$\$
    BEGIN
        -- Create tracking table if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'payload' AND table_name = 'dynamic_uuid_tables') THEN
            CREATE TABLE payload.dynamic_uuid_tables (
                id SERIAL PRIMARY KEY,
                table_name TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        END IF;
    END;
    \$\$;
"@

    # Execute setup SQL
    Exec-Command -command "psql `"$RemoteDbUrl`" -c `"$setupSql`"" -description "Setting up UUID tracking table"

    # SQL to scan for UUID tables and fix them
    $scanSql = @"
    DO \$\$
    DECLARE
        r RECORD;
        uuid_pattern TEXT := '^[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}$';
    BEGIN
        -- Scan for tables matching UUID pattern
        FOR r IN
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'payload'
            AND table_name ~ uuid_pattern
        LOOP
            -- Insert into tracking table if it doesn't exist
            INSERT INTO payload.dynamic_uuid_tables (table_name)
            VALUES (r.table_name)
            ON CONFLICT (table_name) DO NOTHING;

            -- Add path column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'payload'
                AND table_name = r.table_name
                AND column_name = 'path'
            ) THEN
                EXECUTE format('ALTER TABLE payload.%I ADD COLUMN path TEXT', r.table_name);
            END IF;

            -- Add id column if it doesn't exist
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = 'payload'
                AND table_name = r.table_name
                AND column_name = 'id'
            ) THEN
                EXECUTE format('ALTER TABLE payload.%I ADD COLUMN id TEXT', r.table_name);
            END IF;
        END LOOP;
    END;
    \$\$;
"@

    # Execute scan SQL
    Exec-Command -command "psql `"$RemoteDbUrl`" -c `"$scanSql`"" -description "Scanning and fixing UUID tables"

    # SQL to create downloads_relationships view if it doesn't exist
    $viewSql = @"
    DO \$\$
    BEGIN
        -- Drop view if it exists
        DROP VIEW IF EXISTS payload.downloads_relationships;

        -- Create view
        CREATE OR REPLACE VIEW payload.downloads_relationships AS
        SELECT
            d.id AS download_id,
            d.filename,
            rel.collection,
            rel.document_id
        FROM
            payload.downloads d
        LEFT JOIN (
            -- Union all known relationship tables
            SELECT
                'posts' AS collection,
                p.id AS document_id,
                p__d.downloads_id AS download_id
            FROM
                payload.posts_rels p
            JOIN
                payload.posts__downloads p__d ON p.id = p__d.posts_id
            UNION ALL
            SELECT
                'courses' AS collection,
                c.id AS document_id,
                c__d.downloads_id AS download_id
            FROM
                payload.courses_rels c
            JOIN
                payload.courses__downloads c__d ON c.id = c__d.courses_id
            UNION ALL
            SELECT
                'course_lessons' AS collection,
                cl.id AS document_id,
                cl__d.downloads_id AS download_id
            FROM
                payload.course_lessons_rels cl
            JOIN
                payload.course_lessons__downloads cl__d ON cl.id = cl__d.course_lessons_id
            UNION ALL
            SELECT
                'course_quizzes' AS collection,
                cq.id AS document_id,
                cq__d.downloads_id AS download_id
            FROM
                payload.course_quizzes_rels cq
            JOIN
                payload.course_quizzes__downloads cq__d ON cq.id = cq__d.course_quizzes_id
            UNION ALL
            SELECT
                'documentation' AS collection,
                doc.id AS document_id,
                doc__d.downloads_id AS download_id
            FROM
                payload.documentation_rels doc
            JOIN
                payload.documentation__downloads doc__d ON doc.id = doc__d.documentation_id
            UNION ALL
            SELECT
                'surveys' AS collection,
                s.id AS document_id,
                s__d.downloads_id AS download_id
            FROM
                payload.surveys_rels s
            JOIN
                payload.surveys__downloads s__d ON s.id = s__d.surveys_id
            UNION ALL
            SELECT
                'private' AS collection,
                priv.id AS document_id,
                priv__d.downloads_id AS download_id
            FROM
                payload.private_rels priv
            JOIN
                payload.private__downloads priv__d ON priv.id = priv__d.private_id
        ) rel ON d.id = rel.download_id;
    END;
    \$\$;
"@

    # Execute view creation SQL
    Exec-Command -command "psql `"$RemoteDbUrl`" -c `"$viewSql`"" -description "Creating downloads_relationships view"

    Log-Success "UUID tables fixed successfully on remote database"
}
catch {
    Log-Error "CRITICAL ERROR: UUID table fix failed: $_"
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
```

### Phase 3: Progressive Content Migration Implementation

1. **Create a Master Content Migration Script**:

```powershell
# migrate-content-progressive.ps1

param (
    [switch]$SkipPosts,
    [switch]$SkipDocumentation,
    [switch]$SkipCourses,
    [switch]$SkipQuizzes,
    [switch]$SkipSurveys,
    [switch]$SkipVerify
)

# Import required modules
. "$PSScriptRoot\scripts\orchestration\utils\path-management.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "progressive-migration"

try {
    Log-Phase "PROGRESSIVE MIGRATION PHASE"

    # Function to run a migration phase
    function Run-MigrationPhase {
        param (
            [string]$PhaseName,
            [string[]]$Tables,
            [switch]$Skip
        )

        if ($Skip) {
            Log-Message "Skipping $PhaseName phase (requested)" "Yellow"
            return
        }

        Log-Step "Running $PhaseName Migration Phase" 1

        # Create temporary directory for dumps
        $dumpDir = Join-Path -Path $env:TEMP -ChildPath "migration_${PhaseName}"
        New-Item -ItemType Directory -Path $dumpDir -Force | Out-Null

        # Create dumps for each table
        foreach ($table in $Tables) {
            $dumpFile = Join-Path -Path $dumpDir -ChildPath "$table.sql"
            Log-Message "Dumping payload.$table table to $dumpFile" "Yellow"

            # Use pg_dump for more control
            $pgDumpCmd = "pg_dump --data-only --schema=payload --table=payload.$table postgres://postgres:postgres@localhost:54322/postgres > `"$dumpFile`""
            Exec-Command -command $pgDumpCmd -description "Dumping payload.$table" -continueOnError
        }

        # Combine dumps into a single file
        $combinedDumpFile = Join-Path -Path $dumpDir -ChildPath "${PhaseName}_combined.sql"
        Log-Message "Combining dumps into $combinedDumpFile" "Yellow"

        # Create empty combined file
        New-Item -ItemType File -Path $combinedDumpFile -Force | Out-Null

        # Add header
        Add-Content -Path $combinedDumpFile -Value "-- $PhaseName Data Migration Script"
        Add-Content -Path $combinedDumpFile -Value "-- Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Add-Content -Path $combinedDumpFile -Value ""
        Add-Content -Path $combinedDumpFile -Value "BEGIN;"

        # Concatenate all dump files
        foreach ($table in $Tables) {
            $dumpFile = Join-Path -Path $dumpDir -ChildPath "$table.sql"
            if (Test-Path $dumpFile) {
                $content = Get-Content -Path $dumpFile -Raw
                Add-Content -Path $combinedDumpFile -Value "-- Table: payload.$table"
                Add-Content -Path $combinedDumpFile -Value $content
                Add-Content -Path $combinedDumpFile -Value ""
            }
        }

        # Add transaction end
        Add-Content -Path $combinedDumpFile -Value "COMMIT;"

        # Apply to remote database
        Log-Message "Applying $PhaseName data to remote database..." "Yellow"
        $psqlCmd = "psql `"$env:REMOTE_DATABASE_URL`" -f `"$combinedDumpFile`""
        Exec-Command -command $psqlCmd -description "Applying $PhaseName data to remote"

        # Run relationship fixes
        Log-Message "Running relationship fixes for $PhaseName..." "Yellow"

        # Temporarily set DATABASE_URI to remote
        $originalDatabaseUri = $env:DATABASE_URI
        $env:DATABASE_URI = $env:REMOTE_DATABASE_URL

        Set-ProjectRootLocation
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            # Generic fix script based on content type
            Exec-Command -command "pnpm run fix:relationships-direct" -description "Fixing relationships" -continueOnError

            # Type-specific fixes if available
            switch ($PhaseName) {
                "Posts" {
                    Exec-Command -command "pnpm run fix:post-image-relationships" -description "Fixing post image relationships" -continueOnError
                }
                "Documentation" {
                    # Add doc-specific fixes if any
                }
                "Courses" {
                    # Add course-specific fixes if any
                }
            }

            # Always fix Lexical format
            Exec-Command -command "pnpm run fix:lexical-format" -description "Fixing Lexical format" -continueOnError

            # Restore original DATABASE_URI
            $env:DATABASE_URI = $originalDatabaseUri
        }

        # Cleanup
        if (Test-Path $dumpDir) {
            Remove-Item -Path $dumpDir -Recurse -Force -ErrorAction SilentlyContinue
        }

        Log-Success "$PhaseName migration completed"
    }

    # Core Tables Migration
    $coreTables = @(
        "users",
        "media",
        "payload_preferences",
        "payload_migrations"
    )
    Run-MigrationPhase -PhaseName "Core" -Tables $coreTables

    # Posts Migration
    $postsTables = @(
        "posts",
        "posts_rels",
        "posts_categories",
        "posts_tags",
        "posts__downloads"
    )
    Run-MigrationPhase -PhaseName "Posts" -Tables $postsTables -Skip:$SkipPosts

    # Documentation Migration
    $docTables = @(
        "documentation",
        "documentation_rels",
        "documentation_categories",
        "documentation_tags",
        "documentation_breadcrumbs",
        "documentation__downloads"
    )
    Run-MigrationPhase -PhaseName "Documentation" -Tables $docTables -Skip:$SkipDocumentation

    # Course Migration
    $courseTables = @(
        "courses",
        "courses_rels",
        "courses__downloads",
        "course_lessons",
        "course_lessons_rels",
        "course_lessons__downloads",
        "course_quizzes",
        "course_quizzes_rels",
        "course_quizzes__downloads"
    )
    Run-MigrationPhase -PhaseName "Courses" -Tables $courseTables -Skip:$SkipCourses

    # Quiz Migration
    $quizTables = @(
        "quiz_questions",
        "quiz_questions_rels",
        "quiz_questions_options"
    )
    Run-MigrationPhase -PhaseName "Quizzes" -Tables $quizTables -Skip:$SkipQuizzes

    # Survey Migration
    $surveyTables = @(
        "surveys",
        "surveys_rels",
        "surveys__downloads",
        "survey_questions",
        "survey_questions_rels",
        "survey_questions_options"
    )
    Run-MigrationPhase -PhaseName "Surveys" -Tables $surveyTables -Skip:$SkipSurveys

    # Run final verification if required
    if (-not $SkipVerify) {
        Log-Phase "FINAL VERIFICATION PHASE"

        # Temporarily set DATABASE_URI to remote
        $originalDatabaseUri = $env:DATABASE_URI
        $env:DATABASE_URI = $env:REMOTE_DATABASE_URL

        Set-ProjectRootLocation
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Running full verification on remote database..." "Yellow"
            Exec-Command -command "pnpm run verify:all" -description "Running full verification"

            # Restore original DATABASE_URI
            $env:DATABASE_URI = $originalDatabaseUri
        }
    }

    Log-Success "Progressive content migration completed successfully"
}
catch {
    Log-Error "CRITICAL ERROR: Progressive migration failed: $_"
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
```

### 4. Master Migration Controller Script

Create a master script that controls the entire migration process:

```powershell
# master-migration.ps1

param (
    [switch]$SchemaOnly,
    [switch]$UUIDTablesOnly,
    [switch]$PostsOnly,
    [switch]$SkipVerify,
    [switch]$SkipPosts,
    [switch]$SkipDocumentation,
    [switch]$SkipCourses,
    [switch]$SkipQuizzes,
    [switch]$SkipSurveys
)

# Import required modules
. "$PSScriptRoot\scripts\orchestration\utils\path-management.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "master-migration"

try {
    Log-Phase "MASTER MIGRATION PROCESS"

    # Phase 1: Test connection
    Log-Step "Testing Remote Connection" 1
    Exec-Command -command "scripts\orchestration\remote-migration\tests\supabase-test.ps1" -description "Testing remote connection"

    # Phase 2: Schema Migration (if not skipped)
    if ($SchemaOnly) {
        Log-Step "Running Schema Migration Only" 2
        Exec-Command -command "scripts\orchestration\remote-migration\migrate-schema.ps1 -SkipDiff" -description "Migrating schema"

        Log-Success "Schema migration completed. Exiting as SchemaOnly was specified."
        exit 0
    }

    # Phase 3: UUID Table Fixes (if specified)
    if ($UUIDTablesOnly) {
        Log-Step "Running UUID Table Fixes Only" 2
        Exec-Command -command "scripts\orchestration\remote-migration\fix-remote-uuid-tables.ps1" -description "Fixing UUID tables"

        Log-Success "UUID table fixes completed. Exiting as UUIDTablesOnly was specified."
        exit 0
    }

    # Phase 4: Posts Migration Only (if specified)
    if ($PostsOnly) {
        Log-Step "Running Posts Migration Only" 2
        Exec-Command -command "scripts\orchestration\remote-migration\migrate-posts-direct.ps1" -description "Migrating posts"

        Log-Success "Posts migration completed. Exiting as PostsOnly was specified."
        exit 0
    }

    # Phase 5: Full Progressive Migration
    Log-Step "Running Full Progressive Migration" 2

    # Build parameter string for progressive migration
    $params = @()
    if ($SkipPosts) { $params += "-SkipPosts" }
    if ($SkipDocumentation) { $params += "-SkipDocumentation" }
    if ($SkipCourses) { $params += "-SkipCourses" }
    if ($SkipQuizzes) { $params += "-SkipQuizzes" }
    if ($SkipSurveys) { $params += "-SkipSurveys" }
    if ($SkipVerify) { $params += "-SkipVerify" }

    # Execute the progressive migration
    Exec-Command -command "scripts\orchestration\remote-migration\migrate-content-progressive.ps1 $($params -join ' ')" -description "Running progressive migration"

    Log-Success "Master migration process completed successfully"
}
catch {
    Log-Error "CRITICAL ERROR: Master migration failed: $_"
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
```

## Verification Strategy

1. **After Schema Migration**:

   - Verify all required tables exist in remote database
   - Check that table structures match local development

2. **After Each Content Migration**:

   - Run content-specific verification scripts
   - Check relationship integrity
   - Verify media and download references

3. **Final Verification**:
   - Run comprehensive verification with `verify:all`
   - Test application functionality with remote database
   - Verify all relationships across schemas

## Conclusion

This migration plan addresses the challenges faced in the current implementation by:

1. Taking a progressive, incremental approach to content migration
2. Addressing the specific issues with the Supabase CLI
3. Implementing proper UUID table management on the remote database
4. Providing comprehensive verification at every stage

The implementation scripts provided are designed to be robust, with proper error handling, logging, and transaction management, to ensure a reliable migration process.

## Next Steps After Implementation

1. **Performance Optimization**:

   - Analyze query performance on remote database
   - Implement additional indexes if needed

2. **Documentation Updates**:

   - Document the migration process and verification steps
   - Update application configuration for remote database

3. **Monitoring**:
   - Implement performance monitoring
   - Configure alerting for critical issues
