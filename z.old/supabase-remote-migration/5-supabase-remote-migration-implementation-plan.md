# Supabase Remote Migration Implementation Plan

**Document Date:** April 15, 2025  
**Status:** Proposed Implementation Plan

## Overview

This document outlines the detailed implementation plan for completing the migration of our local Supabase database to the remote Supabase instance for the SlideHeroes application. Based on a comprehensive analysis of the current migration status, this plan addresses the remaining work needed to successfully complete the migration.

## Current Status Assessment

### Completed Components

1. **Remote Connection**:

   - Successfully established connection to remote Supabase instance
   - Connection string: `postgres://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:5432/postgres`

2. **Schema Migration**:

   - Successfully migrated the payload schema (47+ tables)
   - Table structures match the expected schema design

3. **Initial Data Migration**:

   - Posts data successfully migrated (9 posts confirmed)
   - UUID table management infrastructure in place
   - `dynamic_uuid_tables` tracking system established with 5 entries

4. **Support Infrastructure**:
   - Downloads relationship view created
   - UUID table monitor function and event trigger established
   - Migration script structure organized

### Pending Components

1. **Content Migration**:

   - Core system tables (users, media, preferences)
   - Documentation content
   - Course content (lessons, quizzes)
   - Survey/quiz question content
   - Download relationships

2. **Verification System**:

   - Comprehensive content verification
   - Relationship integrity checks
   - Lexical format validation

3. **Relationship Fixes**:
   - UUID table relationship repairs
   - Content relationship integrity
   - Lexical format corrections

## Implementation Plan

### Phase 1: Progressive Content Migration

Create a new script `scripts/orchestration/remote-migration/migrate-content-progressive.ps1` that implements the progressive content migration approach:

```powershell
# migrate-content-progressive.ps1

param (
    [switch]$SkipCore,
    [switch]$SkipDocumentation,
    [switch]$SkipCourses,
    [switch]$SkipQuizzes,
    [switch]$SkipSurveys,
    [switch]$SkipVerify
)

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

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
    Run-MigrationPhase -PhaseName "Core" -Tables $coreTables -Skip:$SkipCore

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

### Phase 2: Enhanced Verification System

Create a new script `scripts/orchestration/remote-migration/verify-remote-content.ps1` for comprehensive verification:

```powershell
# verify-remote-content.ps1

param (
    [switch]$VerifyPosts,
    [switch]$VerifyDocumentation,
    [switch]$VerifyCourses,
    [switch]$VerifyQuizzes,
    [switch]$VerifySurveys,
    [switch]$VerifyAll
)

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "remote-verification"

try {
    Log-Phase "REMOTE CONTENT VERIFICATION"

    # Temporarily set DATABASE_URI to remote
    $originalDatabaseUri = $env:DATABASE_URI
    $env:DATABASE_URI = $env:REMOTE_DATABASE_URL

    Set-ProjectRootLocation
    if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
        # General data integrity verification
        if ($VerifyAll -or $VerifyPosts) {
            Log-Step "Verifying Posts Content" 1
            Exec-Command -command "pnpm run verify:post-content" -description "Verifying posts content"
        }

        if ($VerifyAll -or $VerifyDocumentation) {
            Log-Step "Verifying Documentation Content" 2
            Exec-Command -command "pnpm run verify:documentation-content" -description "Verifying documentation content"
        }

        if ($VerifyAll -or $VerifyCourses) {
            Log-Step "Verifying Course Content" 3
            Exec-Command -command "pnpm run verify:course-content" -description "Verifying course content"
        }

        if ($VerifyAll -or $VerifyQuizzes) {
            Log-Step "Verifying Quiz Content" 4
            Exec-Command -command "pnpm run verify:quiz-content" -description "Verifying quiz content"
        }

        if ($VerifyAll -or $VerifySurveys) {
            Log-Step "Verifying Survey Content" 5
            Exec-Command -command "pnpm run verify:survey-content" -description "Verifying survey content"
        }

        # UUID table verification
        Log-Step "Verifying UUID Tables" 6
        Exec-Command -command "pnpm run verify:uuid-tables" -description "Verifying UUID tables"

        # Relationship verification
        Log-Step "Verifying Relationships" 7
        Exec-Command -command "pnpm run verify:relationships" -description "Verifying relationships"

        # Lexical format verification
        Log-Step "Verifying Lexical Format" 8
        Exec-Command -command "pnpm run verify:lexical-format" -description "Verifying lexical format"

        # Comprehensive verification
        if ($VerifyAll) {
            Log-Step "Running Comprehensive Verification" 9
            Exec-Command -command "pnpm run verify:all" -description "Running comprehensive verification"
        }

        # Restore original DATABASE_URI
        $env:DATABASE_URI = $originalDatabaseUri
    }
    else {
        Log-Error "Could not find content-migrations package"
        exit 1
    }

    Log-Success "Remote content verification completed"
}
catch {
    Log-Error "CRITICAL ERROR: Verification failed: $_"
    exit 1
}
finally {
    # Restore original DATABASE_URI if not already done
    if ($env:DATABASE_URI -eq $env:REMOTE_DATABASE_URL) {
        $env:DATABASE_URI = $originalDatabaseUri
    }

    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
```

### Phase 3: Relationship Fixes Implementation

Create a new script `scripts/orchestration/remote-migration/fix-remote-relationships.ps1` for fixing relationships:

```powershell
# fix-remote-relationships.ps1

param (
    [switch]$FixPosts,
    [switch]$FixDocumentation,
    [switch]$FixCourses,
    [switch]$FixQuizzes,
    [switch]$FixSurveys,
    [switch]$FixAll,
    [switch]$FixLexical
)

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "relationship-fixes"

try {
    Log-Phase "REMOTE RELATIONSHIP FIXES"

    # Temporarily set DATABASE_URI to remote
    $originalDatabaseUri = $env:DATABASE_URI
    $env:DATABASE_URI = $env:REMOTE_DATABASE_URL

    Set-ProjectRootLocation
    if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
        # UUID table fixes
        Log-Step "Fixing UUID Tables" 1
        Exec-Command -command "pnpm run fix:uuid-tables" -description "Fixing UUID tables"

        # Content-specific relationship fixes
        if ($FixAll -or $FixPosts) {
            Log-Step "Fixing Post Relationships" 2
            Exec-Command -command "pnpm run fix:post-image-relationships" -description "Fixing post image relationships"
        }

        if ($FixAll -or $FixDocumentation) {
            Log-Step "Fixing Documentation Relationships" 3
            Exec-Command -command "pnpm run fix:documentation-relationships" -description "Fixing documentation relationships"
        }

        if ($FixAll -or $FixCourses) {
            Log-Step "Fixing Course Relationships" 4
            Exec-Command -command "pnpm run fix:course-relationships" -description "Fixing course relationships"
        }

        if ($FixAll -or $FixQuizzes) {
            Log-Step "Fixing Quiz Relationships" 5
            Exec-Command -command "pnpm run fix:quiz-relationships" -description "Fixing quiz relationships"
        }

        if ($FixAll -or $FixSurveys) {
            Log-Step "Fixing Survey Relationships" 6
            Exec-Command -command "pnpm run fix:survey-relationships" -description "Fixing survey relationships"
        }

        # General relationship fixes
        Log-Step "Fixing General Relationships" 7
        Exec-Command -command "pnpm run fix:relationships-direct" -description "Fixing general relationships"

        # Lexical format fixes
        if ($FixAll -or $FixLexical) {
            Log-Step "Fixing Lexical Format" 8
            Exec-Command -command "pnpm run fix:lexical-format" -description "Fixing lexical format"
            Exec-Command -command "pnpm run fix:all-lexical-fields" -description "Fixing all lexical fields"
        }

        # Restore original DATABASE_URI
        $env:DATABASE_URI = $originalDatabaseUri
    }
    else {
        Log-Error "Could not find content-migrations package"
        exit 1
    }

    Log-Success "Remote relationship fixes completed"
}
catch {
    Log-Error "CRITICAL ERROR: Relationship fixes failed: $_"
    exit 1
}
finally {
    # Restore original DATABASE_URI if not already done
    if ($env:DATABASE_URI -eq $env:REMOTE_DATABASE_URL) {
        $env:DATABASE_URI = $originalDatabaseUri
    }

    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
```

### Phase 4: Master Migration Controller Script

Create an updated master migration script `scripts/orchestration/remote-migration/master-migration.ps1`:

```powershell
# master-migration.ps1

param (
    [switch]$SchemaOnly,
    [switch]$UUIDTablesOnly,
    [switch]$PostsOnly,
    [switch]$ProgressiveOnly,
    [switch]$VerifyOnly,
    [switch]$FixOnly,
    [switch]$SkipDiff,
    [switch]$SkipCore,
    [switch]$SkipDocumentation,
    [switch]$SkipCourses,
    [switch]$SkipQuizzes,
    [switch]$SkipSurveys,
    [switch]$SkipVerify
)

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "master-migration"

try {
    Log-Phase "MASTER MIGRATION PROCESS"

    # Phase 1: Test connection
    Log-Step "Testing Remote Connection" 1
    Exec-Command -command "$PSScriptRoot\tests\direct-connection-test.ps1" -description "Testing remote connection"

    # Phase 2: Schema Migration (if not skipped)
    if ($SchemaOnly) {
        Log-Step "Running Schema Migration Only" 2
        Exec-Command -command "$PSScriptRoot\migrate-schema.ps1 $(if ($SkipDiff) { '-SkipDiff' })" -description "Migrating schema"
        Log-Success "Schema migration completed. Exiting as SchemaOnly was specified."
        exit 0
    }

    # Phase 3: UUID Table Fixes (if specified)
    if ($UUIDTablesOnly) {
        Log-Step "Running UUID Table Fixes Only" 2
        Exec-Command -command "$PSScriptRoot\fix-remote-uuid-tables.ps1" -description "Fixing UUID tables"
        Log-Success "UUID table fixes completed. Exiting as UUIDTablesOnly was specified."
        exit 0
    }

    # Phase 4: Posts Migration Only (if specified)
    if ($PostsOnly) {
        Log-Step "Running Posts Migration Only" 2
        Exec-Command -command "$PSScriptRoot\migrate-posts-direct.ps1" -description "Migrating posts"
        Log-Success "Posts migration completed. Exiting as PostsOnly was specified."
        exit 0
    }

    # Phase 5: Progressive Content Migration Only (if specified)
    if ($ProgressiveOnly) {
        Log-Step "Running Progressive Content Migration Only" 2

        # Build parameter string for progressive migration
        $params = @()
        if ($SkipCore) { $params += "-SkipCore" }
        if ($SkipDocumentation) { $params += "-SkipDocumentation" }
        if ($SkipCourses) { $params += "-SkipCourses" }
        if ($SkipQuizzes) { $params += "-SkipQuizzes" }
        if ($SkipSurveys) { $params += "-SkipSurveys" }
        if ($SkipVerify) { $params += "-SkipVerify" }

        Exec-Command -command "$PSScriptRoot\migrate-content-progressive.ps1 $($params -join ' ')" -description "Running progressive migration"
        Log-Success "Progressive content migration completed. Exiting as ProgressiveOnly was specified."
        exit 0
    }

    # Phase 6: Verification Only (if specified)
    if ($VerifyOnly) {
        Log-Step "Running Verification Only" 2
        Exec-Command -command "$PSScriptRoot\verify-remote-content.ps1 -VerifyAll" -description "Verifying remote content"
        Log-Success "Verification completed. Exiting as VerifyOnly was specified."
        exit 0
    }

    # Phase 7: Relationship Fixes Only (if specified)
    if ($FixOnly) {
        Log-Step "Running Relationship Fixes Only" 2
        Exec-Command -command "$PSScriptRoot\fix-remote-relationships.ps1 -FixAll" -description "Fixing remote relationships"
        Log-Success "Relationship fixes completed. Exiting as FixOnly was specified."
        exit 0
    }

    # Phase 8: Full Migration Process
    Log-Step "Running Full Migration Process" 2

    # Schema Migration
    Log-Message "Step 1: Schema Migration" "Yellow"
    Exec-Command -command "$PSScriptRoot\migrate-schema.ps1 $(if ($SkipDiff) { '-SkipDiff' })" -description "Migrating schema"

    # UUID Table Fixes
    Log-Message "Step 2: UUID Table Setup" "Yellow"
    Exec-Command -command "$PSScriptRoot\fix-remote-uuid-tables.ps1" -description "Setting up UUID tables"

    # Progressive Content Migration
    Log-Message "Step 3: Progressive Content Migration" "Yellow"

    # Build parameter string for progressive migration
    $params = @()
    if ($SkipCore) { $params += "-SkipCore" }
    if ($SkipDocumentation) { $params += "-SkipDocumentation" }
    if ($SkipCourses) { $params += "-SkipCourses" }
    if ($SkipQuizzes) { $params += "-SkipQuizzes" }
    if ($SkipSurveys) { $params += "-SkipSurveys" }
    if ($SkipVerify) { $params += "-SkipVerify" }

    Exec-Command -command "$PSScriptRoot\migrate-content-progressive.ps1 $($params -join ' ')" -description "Running progressive migration"

    # Relationship Fixes
    Log-Message "Step 4: Relationship Fixes" "Yellow"
    Exec-Command -command "$PSScriptRoot\fix-remote-relationships.ps1 -FixAll" -description "Fixing remote relationships"

    # Final Verification
    if (-not $SkipVerify) {
        Log-Message "Step 5: Final Verification" "Yellow"
        Exec-Command -command "$PSScriptRoot\verify-remote-content.ps1 -VerifyAll" -description "Final verification"
    }

    Log-Success "Full migration process completed successfully"
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

### Phase 5: Wrapper Script Update

Update the root wrapper script `supabase-remote-migration.ps1` to include the new functionality:

```powershell
# Supabase Remote Migration Wrapper Script
# This wrapper script makes it easy to run the migration process from the root directory
# while keeping the actual scripts organized in subdirectories

# Parameters for the script
param (
    [switch]$Test,
    [switch]$SchemaOnly,
    [switch]$DataOnly,
    [switch]$PostsOnly,
    [switch]$VerifyOnly,
    [switch]$UUIDTablesOnly,
    [switch]$FixOnly,
    [switch]$ProgressiveOnly,
    [switch]$SkipDiff,
    [switch]$SkipFixes,
    [switch]$SkipVerify,
    [switch]$SkipCore,
    [switch]$SkipDocumentation,
    [switch]$SkipCourses,
    [switch]$SkipQuizzes,
    [switch]$SkipSurveys
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Display banner
function Show-Banner {
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "         SLIDEHEROES REMOTE MIGRATION UTILITY          " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "This wrapper script calls the organized migration scripts in the"
    Write-Host "scripts/orchestration/remote-migration directory."
    Write-Host ""
    Write-Host "Command options:"
    Write-Host "  -Test           : Run connection test only"
    Write-Host "  -SchemaOnly     : Migrate schema only"
    Write-Host "  -DataOnly       : Migrate data only (legacy)"
    Write-Host "  -PostsOnly      : Migrate only posts data"
    Write-Host "  -ProgressiveOnly: Run progressive content migration only"
    Write-Host "  -VerifyOnly     : Run content verification only"
    Write-Host "  -UUIDTablesOnly : Set up UUID table management only"
    Write-Host "  -FixOnly        : Run relationship fixes only"
    Write-Host "  -SkipDiff       : Skip schema diff generation"
    Write-Host "  -SkipFixes      : Skip data relationship fixes"
    Write-Host "  -SkipVerify     : Skip verification steps"
    Write-Host "  -SkipCore       : Skip core tables migration"
    Write-Host "  -SkipDocumentation : Skip documentation migration"
    Write-Host "  -SkipCourses    : Skip courses migration"
    Write-Host "  -SkipQuizzes    : Skip quizzes migration"
    Write-Host "  -SkipSurveys    : Skip surveys migration"
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host ""
}

# Show banner
Show-Banner

try {
    # Path to the scripts
    $migrationDir = Join-Path -Path $PSScriptRoot -ChildPath "scripts\orchestration\remote-migration"
    $masterScript = Join-Path -Path $migrationDir -ChildPath "master-migration.ps1"
    $testScript = Join-Path -Path $migrationDir -ChildPath "tests\direct-connection-test.ps1"
    $schemaScript = Join-Path -Path $migrationDir -ChildPath "migrate-schema.ps1"
    $dataScript = Join-Path -Path $migrationDir -ChildPath "migrate-data.ps1"
    $verifyScript = Join-Path -Path $migrationDir -ChildPath "verify-remote-content.ps1"
    $postsScript = Join-Path -Path $migrationDir -ChildPath "migrate-posts-direct.ps1"
    $uuidTablesScript = Join-Path -Path $migrationDir -ChildPath "fix-remote-uuid-tables.ps1"
    $progressiveScript = Join-Path -Path $migrationDir -ChildPath "migrate-content-progressive.ps1"
    $fixScript = Join-Path -Path $migrationDir -ChildPath "fix-remote-relationships.ps1"

    # Check for master migration script first
    if (Test-Path -Path $masterScript) {
        # Build parameter string
        $params = @()
        if ($SchemaOnly) { $params += "-SchemaOnly" }
        if ($UUIDTablesOnly) { $params += "-UUIDTablesOnly" }
        if ($PostsOnly) { $params += "-PostsOnly" }
        if ($ProgressiveOnly) { $params += "-ProgressiveOnly" }
        if ($VerifyOnly) { $params += "-VerifyOnly" }
        if ($FixOnly) { $params += "-FixOnly" }
        if ($SkipDiff) { $params += "-SkipDiff" }
        if ($SkipVerify) { $params += "-SkipVerify" }
        if ($SkipCore) { $params += "-SkipCore" }
        if ($SkipDocumentation) { $params += "-SkipDocumentation" }
        if ($SkipCourses) { $params += "-SkipCourses" }
        if ($SkipQuizzes) { $params += "-SkipQuizzes" }
        if ($SkipSurveys) { $params += "-SkipSurveys" }

        # If test was specified, run that script directly
        if ($Test) {
            Write-Host "Running connection test only..." -ForegroundColor Yellow
            & $testScript
            exit $LASTEXITCODE
        }

        # If dataOnly was specified, run legacy script
        if ($DataOnly) {
            Write-Host "Running legacy data migration only..." -ForegroundColor Yellow
            $dataParams = @()
            if ($SkipFixes) {
                $dataParams += "-SkipFixes"
            }
            if ($SkipVerify) {
                $dataParams += "-SkipVerification"
            }
            & $dataScript @dataParams
            exit $LASTEXITCODE
        }

        # Run the master script
        & $masterScript @params
        exit $LASTEXITCODE
    }
    else {
        # Fallback to individual scripts
        Write-Host "Master migration script not found. Using individual scripts..." -ForegroundColor Yellow

        # Run the appropriate script based on parameters
        if ($Test) {
            Write-Host "Running connection test only..." -ForegroundColor Yellow
            & $testScript
            exit $LASTEXITCODE
        }

        if ($SchemaOnly) {
            Write-Host "Running schema migration only..." -ForegroundColor Yellow
            $params = @()
            if ($SkipDiff) {
                $params += "-SkipDiff"
            }
            & $schemaScript @params
            exit $LASTEXITCODE
        }

        if ($DataOnly) {
            Write-Host "Running legacy data migration only..." -ForegroundColor Yellow
            $params = @()
            if ($SkipFixes) {
                $params += "-SkipFixes"
            }
            if ($SkipVerify) {
                $
```
