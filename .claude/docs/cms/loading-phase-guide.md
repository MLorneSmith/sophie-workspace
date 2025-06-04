# Loading Phase Guide

The Loading Phase is a critical component of the content migration system, responsible for populating the database with content and ensuring relationships are properly established.

## Overview

The Loading Phase follows the Processing Phase and precedes the Verification Phase in the content migration workflow. Its primary responsibilities include:

1. Running content migrations via Payload
2. Executing specialized migrations for specific content types
3. Fixing UUID tables and ensuring required columns exist
4. Importing external content from storage buckets
5. Repairing relationships between content items
6. Fixing storage issues
7. Verifying database state

## Implementation

The Loading Phase is implemented in `scripts/orchestration/phases/loading.ps1` and is invoked by the main orchestration script `reset-and-migrate.ps1`.

### Main Function

```powershell
function Invoke-LoadingPhase {
    param (
        [switch]$SkipVerification
    )

    # Step 7: Run content migrations via Payload migrations
    Run-ContentMigrations

    # Identify potentially parallelizable steps
    Log-Message "Identifying steps that could potentially be run in parallel..." "Cyan"

    # Step 8.1: Run specialized blog post migration
    Migrate-BlogPosts

    # Step 8.2: Run specialized private posts migration
    Migrate-PrivatePosts

    # Step 8.3: Fix UUID tables to ensure columns exist
    Fix-UuidTables

    # Step 9: Import downloads from R2 bucket
    Import-Downloads

    # Step 10: Fix relationships
    Fix-Relationships

    # Step 10.5: Fix S3 storage issues
    Fix-S3StorageIssues

    # Step 11: Comprehensive database verification
    if (-not $SkipVerification) {
        Verify-DatabaseState
    }

    # Step 12: Create certificates storage bucket in Supabase
    Create-CertificatesBucket

    Log-Success "Loading phase completed successfully"
}
```

## Key Components

### Content Migrations

The `Run-ContentMigrations` function executes Payload migrations to populate the database with content:

```powershell
function Run-ContentMigrations {
    Log-Step "Running content migrations via Payload migrations..."
    
    # Navigate to Payload directory
    Set-Location -Path (Get-PayloadPath)
    
    # Run Payload migrations
    Exec-Command -command "pnpm run migrate" -description "Running Payload migrations"
    
    Log-Success "Content migrations completed successfully"
}
```

These migrations are defined in the Payload CMS application and handle the core content loading process.

### Specialized Migrations

#### Blog Posts Migration

The `Migrate-BlogPosts` function handles specialized migration for blog posts:

```powershell
function Migrate-BlogPosts {
    Log-Step "Running specialized blog post migration..."
    
    # Execute blog post migration script
    Exec-Command -command "pnpm --filter @kit/content-migrations run migrate:blog-posts" -description "Migrating blog posts"
    
    Log-Success "Blog post migration completed successfully"
}
```

#### Private Posts Migration

The `Migrate-PrivatePosts` function handles specialized migration for private posts:

```powershell
function Migrate-PrivatePosts {
    Log-Step "Running specialized private posts migration..."
    
    # Execute private posts migration script
    Exec-Command -command "pnpm --filter @kit/content-migrations run migrate:private-posts" -description "Migrating private posts"
    
    Log-Success "Private posts migration completed successfully"
}
```

### UUID Table Fixes

The `Fix-UuidTables` function ensures that all UUID tables have the required columns:

```powershell
function Fix-UuidTables {
    Log-Step "Fixing UUID tables to ensure columns exist..."
    
    # Execute UUID table fix script
    Exec-Command -command "pnpm --filter @kit/content-migrations run fix:uuid-tables" -description "Fixing UUID tables"
    
    Log-Success "UUID tables fixed successfully"
}
```

This step is crucial for ensuring that relationship tables have the correct structure.

### Downloads Import

The `Import-Downloads` function imports download files from an R2 bucket:

```powershell
function Import-Downloads {
    Log-Step "Importing downloads from R2 bucket..."
    
    # Execute downloads import script
    Exec-Command -command "pnpm --filter @kit/content-migrations run import:downloads" -description "Importing downloads"
    
    Log-Success "Downloads imported successfully"
}
```

This step ensures that all downloadable content is available in the system.

### Relationship Fixes

The `Fix-Relationships` function repairs relationships between content items:

```powershell
function Fix-Relationships {
    Log-Step "Fixing relationships between content items..."
    
    # Execute relationship fix script
    Exec-Command -command "pnpm --filter @kit/content-migrations run fix:relationships" -description "Fixing relationships"
    
    Log-Success "Relationships fixed successfully"
}
```

This step ensures that all content relationships are properly established and consistent.

### S3 Storage Fixes

The `Fix-S3StorageIssues` function addresses issues with S3 storage:

```powershell
function Fix-S3StorageIssues {
    Log-Step "Fixing S3 storage issues..."
    
    # Step 1: Create fallback files
    Log-Message "Creating fallback files for S3 storage..." "Yellow"
    Exec-Command -command "pnpm --filter @kit/content-migrations run create:fallback-files" -description "Creating fallback files" -continueOnError
    
    # Step 2: Set up S3 fallback middleware
    Log-Message "Setting up S3 fallback middleware..." "Yellow"
    Exec-Command -command "pnpm --filter @kit/content-migrations run setup:s3-fallback-middleware" -description "Setting up S3 fallback middleware" -continueOnError
    
    # Step 3: Fix S3 references in database
    Log-Message "Fixing S3 references in database..." "Yellow"
    Exec-Command -command "pnpm --filter @kit/content-migrations run fix:s3-references" -description "Fixing S3 references" -continueOnError
    
    Log-Success "S3 storage issues fixed successfully"
}
```

This step ensures that all S3 storage references are valid and that fallback mechanisms are in place.

### Database Verification

The `Verify-DatabaseState` function performs comprehensive verification of the database state:

```powershell
function Verify-DatabaseState {
    Log-Step "Performing comprehensive database verification..."
    
    # Execute database verification script
    Exec-Command -command "pnpm --filter @kit/content-migrations run verify:database" -description "Verifying database state"
    
    Log-Success "Database verification completed successfully"
}
```

This step ensures that the database is in a consistent state after all migrations and fixes.

### Certificates Bucket Creation

The `Create-CertificatesBucket` function creates a storage bucket for certificates in Supabase:

```powershell
function Create-CertificatesBucket {
    Log-Step "Creating certificates storage bucket in Supabase..."
    
    # Execute bucket creation script
    Exec-Command -command "pnpm --filter @kit/content-migrations run create:certificates-bucket" -description "Creating certificates bucket"
    
    Log-Success "Certificates bucket created successfully"
}
```

This step ensures that the system has a dedicated storage location for certificates.

## Enhanced Loading Phase

An enhanced version of the Loading Phase is available in `scripts/orchestration/phases/loading-with-quiz-repair.ps1`, which includes additional steps for repairing quiz-related content:

```powershell
# Import additional module
. "$PSScriptRoot\quiz-system-repair.ps1"

function Invoke-LoadingPhase {
    param (
        [switch]$SkipVerification
    )
    
    # Standard loading steps...
    
    # Additional quiz repair steps
    Fix-QuizRelationships
    Fix-QuizJsonbSync
    
    # Continue with standard steps...
}
```

This enhanced version is useful when dealing with complex quiz content that requires specialized repair.

## Dependency Management

The Loading Phase uses a dependency system to ensure that steps are executed in the correct order and that dependencies are satisfied:

```powershell
# Import dependency system
. "$PSScriptRoot\..\utils\dependency-system\verification-dependencies-optimized.ps1"

# Define dependencies
$dependencies = @{
    "Fix-UuidTables" = @("Run-ContentMigrations")
    "Import-Downloads" = @("Fix-UuidTables")
    "Fix-Relationships" = @("Migrate-BlogPosts", "Migrate-PrivatePosts", "Fix-UuidTables")
    "Fix-S3StorageIssues" = @("Fix-Relationships")
    "Verify-DatabaseState" = @("Fix-S3StorageIssues")
    "Create-CertificatesBucket" = @("Verify-DatabaseState")
}

# Register dependencies
Register-Dependencies -dependencies $dependencies
```

This ensures that steps are executed in the correct order and that dependencies are satisfied.

## Parallelization Opportunities

The Loading Phase identifies steps that could potentially be run in parallel to improve performance:

```powershell
# Potentially parallelizable steps
$parallelizableSteps = @(
    "Migrate-BlogPosts",
    "Migrate-PrivatePosts",
    "Fix-UuidTables"
)

# Execute steps in parallel
Invoke-Parallel -steps $parallelizableSteps
```

This can significantly improve performance on multi-core systems.

## Error Handling

The Loading Phase includes robust error handling to ensure that the process can continue even if individual steps fail:

```powershell
function Exec-Command {
    param (
        [string]$command,
        [string]$description,
        [switch]$continueOnError
    )
    
    try {
        Invoke-Expression $command
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code $LASTEXITCODE"
        }
    }
    catch {
        Log-Error "$description failed: $_"
        if (-not $continueOnError) {
            throw
        }
    }
}
```

This ensures that the process can continue even if individual steps fail, while still providing detailed error information.

## Logging

The Loading Phase includes detailed logging to provide visibility into the process:

```powershell
function Log-Step {
    param (
        [string]$message
    )
    
    Log-Message "STEP: $message" "Green"
}

function Log-Success {
    param (
        [string]$message
    )
    
    Log-Message "SUCCESS: $message" "Green"
}

function Log-Error {
    param (
        [string]$message
    )
    
    Log-Message "ERROR: $message" "Red"
}
```

This provides detailed information about the progress of the Loading Phase.

## Usage

### Basic Usage

To run the Loading Phase with default settings:

```powershell
# Import the module
. "$PSScriptRoot\phases\loading.ps1"

# Run the Loading Phase
Invoke-LoadingPhase
```

### Skip Verification

To skip the verification step for faster execution:

```powershell
Invoke-LoadingPhase -SkipVerification
```

### With Quiz Repair

To run the enhanced Loading Phase with quiz repair:

```powershell
# Import the enhanced module
. "$PSScriptRoot\phases\loading-with-quiz-repair.ps1"

# Run the enhanced Loading Phase
Invoke-LoadingPhase
```

## Best Practices

1. **Run Full Process**: Always run the full Loading Phase process to ensure all steps are executed
2. **Verify Results**: Always verify the results of the Loading Phase to ensure data integrity
3. **Handle Errors**: Implement proper error handling to ensure the process can continue
4. **Log Progress**: Log detailed information about the progress of the Loading Phase
5. **Optimize Performance**: Identify opportunities for parallelization to improve performance
6. **Manage Dependencies**: Ensure that dependencies are properly managed to avoid issues
7. **Test in Development**: Always test the Loading Phase in development before running in production
8. **Document Custom Steps**: Document any custom steps added to the Loading Phase
9. **Monitor Resources**: Monitor system resources during the Loading Phase to avoid issues
10. **Backup Before Running**: Always create a backup before running the Loading Phase

## Troubleshooting

### Common Issues

#### Content Migration Failures

If content migrations fail:

1. Check the Payload migration logs for errors
2. Ensure that the database schema is correct
3. Verify that all required tables exist
4. Check for permission issues

#### Relationship Fix Failures

If relationship fixes fail:

1. Run the comprehensive relationship repair script
2. Check for orphaned relationships
3. Verify that UUID tables have the correct structure
4. Check for inconsistent relationship data

#### S3 Storage Issues

If S3 storage fixes fail:

1. Verify that the S3 bucket exists and is accessible
2. Check for permission issues
3. Ensure that fallback mechanisms are properly configured
4. Verify that S3 references in the database are correct

## Conclusion

The Loading Phase is a critical component of the content migration system, responsible for populating the database with content and ensuring relationships are properly established. By following the guidelines in this document, you can ensure that the Loading Phase runs smoothly and produces consistent results.
