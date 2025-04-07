# PowerShell script to reset the database and run all migrations
# with enhanced error handling and verification

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Get the script's directory for absolute paths
$scriptDir = $PSScriptRoot

# Create logs directory if it doesn't exist
$logsDir = Join-Path -Path $scriptDir -ChildPath "z.migration-logs"
if (-not (Test-Path -Path $logsDir)) {
    New-Item -Path $logsDir -ItemType Directory | Out-Null
    Write-Host "Created logs directory: $logsDir" -ForegroundColor Cyan
}

# Create timestamp for log files
# Use the timestamp from the environment variable if it's set, otherwise create a new one
if ($env:MIGRATION_TIMESTAMP) {
    $timestamp = $env:MIGRATION_TIMESTAMP
    Write-Host "Using timestamp from environment variable: $timestamp" -ForegroundColor Cyan
} else {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss-fff"
}
$logFile = Join-Path -Path $logsDir -ChildPath "migration-log-$timestamp.txt"
$detailedLogFile = Join-Path -Path $logsDir -ChildPath "migration-detailed-log-$timestamp.txt"

# Initialize success tracking
$overallSuccess = $true
$currentStep = "Initialization"

# Function to log messages to both console and detailed log
function Log-Message {
    param (
        [string]$message,
        [string]$color = "White"
    )
    
    Write-Host $message -ForegroundColor $color
    
    # Try to write to the log file, but don't fail if the file is in use
    try {
        Add-Content -Path $detailedLogFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): $message" -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "Warning: Could not write to log file: $_" -ForegroundColor Yellow
    }
}

# Function to execute a command and check its exit code
function Exec-Command {
    param (
        [string]$command,
        [string]$description,
        [switch]$captureOutput
    )
    
    $currentStep = $description
    Log-Message "EXECUTING: $command" "Gray"
    Log-Message "DESCRIPTION: $description" "Gray"
    
    try {
        if ($captureOutput) {
            # Capture both stdout and stderr
            $output = Invoke-Expression "$command 2>&1" | Out-String
            
            # Try to write to the log file, but don't fail if the file is in use
            try {
                Add-Content -Path $detailedLogFile -Value "--- Command Output Start ---`n$output`n--- Command Output End ---" -ErrorAction SilentlyContinue
            }
            catch {
                Write-Host "Warning: Could not write command output to log file: $_" -ForegroundColor Yellow
            }
            
            return $output
        } else {
            # Execute without capturing
            Invoke-Expression $command
            
            # Check exit code
            if ($LASTEXITCODE -ne 0) {
                Log-Message "Command failed with exit code: $LASTEXITCODE" "Red"
                throw "Command failed with exit code: $LASTEXITCODE"
            }
        }
    }
    catch {
        Log-Message "ERROR in step '$description': $_" "Red"
        $script:overallSuccess = $false
        throw $_
    }
}

# Function to verify database schema exists using TypeScript utility
function Verify-Schema {
    param (
        [string]$schema
    )
    
    $result = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:schema $schema" -description "Verifying schema '$schema' exists" -captureOutput
    
    if ($LASTEXITCODE -eq 0) {
        Log-Message "✅ Schema '$schema' exists" "Green"
        return $true
    } else {
        Log-Message "❌ Schema '$schema' does not exist" "Red"
        return $false
    }
}

# Function to verify table exists using TypeScript utility
function Verify-Table {
    param (
        [string]$schema,
        [string]$table
    )
    
    $result = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:table $schema $table" -description "Verifying table '$schema.$table' exists" -captureOutput
    
    if ($LASTEXITCODE -eq 0) {
        Log-Message "✅ Table '$schema.$table' exists" "Green"
        return $true
    } else {
        Log-Message "❌ Table '$schema.$table' does not exist" "Red"
        return $false
    }
}

# Start transcript to capture output to a file
try {
    Start-Transcript -Path $logFile -Append -ErrorAction SilentlyContinue
    Log-Message "Starting migration process at $(Get-Date)" "Cyan"
    Log-Message "Detailed logs will be saved to: $detailedLogFile" "Cyan"
}
catch {
    Write-Host "Warning: Could not start transcript: $_" -ForegroundColor Yellow
    Write-Host "Continuing without transcript..." -ForegroundColor Yellow
}

try {
    #
    # STEP 1: Reset Supabase database and run Web app migrations
    #
    Log-Message "STEP 1: Resetting Supabase database and running Web app migrations..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "apps/web"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"
        
        # Check if we need to restart Supabase (only needed once after config.toml changes)
        $configChangedFlag = Join-Path -Path $env:TEMP -ChildPath "supabase_config_changed.flag"
        if (-not (Test-Path -Path $configChangedFlag)) {
            Log-Message "  Restarting Supabase to apply config changes..." "Yellow"
            Exec-Command -command "supabase stop" -description "Stopping Supabase"
            Exec-Command -command "supabase start" -description "Starting Supabase"
            
            # Create flag file to indicate that Supabase has been restarted
            Set-Content -Path $configChangedFlag -Value "Supabase restarted at $(Get-Date)"
            Log-Message "  Created flag file to indicate Supabase has been restarted" "Gray"
        } else {
            Log-Message "  Skipping Supabase restart (already done)" "Gray"
        }
        
        Log-Message "  Running supabase:reset..." "Yellow"
        Exec-Command -command "pnpm run supabase:reset" -description "Resetting Supabase database"
        
        Log-Message "  Running supabase migrations..." "Yellow"
        Exec-Command -command "supabase migration up" -description "Running Supabase migrations"
        
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        # Verify supabase migrations were applied
        if (Verify-Schema -schema "public") {
            Log-Message "  Web app migrations completed successfully" "Green"
        } else {
            throw "Web app migrations failed: public schema not found"
        }
    }
    catch {
        Log-Message "ERROR: Failed to run Web app migrations: $_" "Red"
        $overallSuccess = $false
        throw "Web app migration failed"
    }

    #
    # STEP 2: Reset Payload schema
    #
    Log-Message "STEP 2: Resetting Payload schema..." "Cyan"
    try {
        # Create a SQL file to drop and recreate the payload schema
        $resetPayloadSchemaSQL = @"
-- Drop the payload schema if it exists
DROP SCHEMA IF EXISTS payload CASCADE;

-- Create the payload schema
CREATE SCHEMA payload;
"@
        
        # Write the SQL to a temporary file
        $tempSQLFile = Join-Path -Path $env:TEMP -ChildPath "reset_payload_schema.sql"
        Set-Content -Path $tempSQLFile -Value $resetPayloadSchemaSQL
        
        # Use the content-migrations package to execute the SQL file
        Log-Message "  Dropping and recreating payload schema..." "Yellow"
        Push-Location -Path "packages/content-migrations"
        Log-Message "  Temporarily changed to directory: $(Get-Location)" "Gray"
        
        # Use the existing utils:run-sql-file script to execute the SQL file
        Exec-Command -command "pnpm run utils:run-sql-file `"$tempSQLFile`"" -description "Resetting Payload schema"
        
        # Remove the temporary file
        Remove-Item -Path $tempSQLFile -Force
        
        Pop-Location
        Log-Message "  Returned to directory: $(Get-Location)" "Gray"
        Log-Message "  Payload schema reset successfully" "Green"
    }
    catch {
        Log-Message "ERROR: Failed to reset Payload schema: $_" "Red"
        $overallSuccess = $false
        throw "Payload schema reset failed"
    }

    #
    # STEP 3: Run Payload migrations
    #
    Log-Message "STEP 3: Running Payload migrations..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "apps/payload"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"

        # Run migration status to see what migrations are pending
        Log-Message "  Checking migration status..." "Yellow"
        $migrationStatus = Exec-Command -command "pnpm migrate:status" -description "Checking migration status" -captureOutput
        
        # Run all migrations using the updated index.ts file
        Log-Message "  Running all migrations..." "Yellow"
        Exec-Command -command "pnpm payload migrate" -description "Running Payload migrations"

        # Add relationship ID columns to payload_locked_documents and payload_locked_documents_rels tables
        Log-Message "  Adding relationship ID columns to locked documents tables..." "Yellow"
        
        # Temporarily change to the root directory to run the content-migrations script
        Push-Location -Path "../.."
        Log-Message "  Temporarily changed to directory: $(Get-Location)" "Gray"
        
        Exec-Command -command "pnpm --filter @kit/content-migrations run sql:add-relationship-id-columns" -description "Adding relationship ID columns to locked documents tables"
        
        # Return to the payload directory
        Pop-Location
        Log-Message "  Returned to directory: $(Get-Location)" "Gray"

        # Check migration status again to confirm all migrations were applied
        Log-Message "  Verifying migration status..." "Yellow"
        $migrationStatus = Exec-Command -command "pnpm migrate:status" -description "Verifying migration status" -captureOutput
        
        # Check if there are any pending migrations
        if ($migrationStatus -match "No migrations have been run yet") {
            Log-Message "WARNING: No migrations have been run yet" "Yellow"
            $overallSuccess = $false
        }
        elseif ($migrationStatus -match "Pending migrations") {
            Log-Message "WARNING: There are still pending migrations" "Yellow"
            $overallSuccess = $false
        }
        else {
            Log-Message "  All migrations have been applied successfully" "Green"
        }

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        # Verify payload schema and tables were created
        if (-not (Verify-Schema -schema "payload")) {
            Log-Message "ERROR: Payload schema was not created" "Red"
            $overallSuccess = $false
            throw "Payload migrations failed: payload schema not found"
        }
        
        # Verify essential tables
        $requiredTables = @("courses", "course_lessons", "course_quizzes", "quiz_questions", "surveys", "survey_questions")
        foreach ($table in $requiredTables) {
            if (-not (Verify-Table -schema "payload" -table $table)) {
                Log-Message "ERROR: Required table 'payload.$table' was not created" "Red"
                $overallSuccess = $false
                throw "Payload migrations failed: required table 'payload.$table' not found"
            }
        }
    }
    catch {
        Log-Message "ERROR: Failed to run Payload migrations: $_" "Red"
        $overallSuccess = $false
        throw "Payload migration failed"
    }

    #
    # STEP 4: Check and process raw data if needed
    #
    Log-Message "STEP 4: Checking and processing raw data if needed..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "packages/content-migrations"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"

        # Check if processed data exists
        $processedDataDir = "src/data/processed"
        $metadataFile = "$processedDataDir/metadata.json"
        
        if (-not (Test-Path -Path $metadataFile)) {
            Log-Message "  Processed data not found. Processing raw data..." "Yellow"
            Exec-Command -command "pnpm run process:raw-data" -description "Processing raw data"
        } else {
            Log-Message "  Processed data found. Validating raw data directories..." "Yellow"
            Exec-Command -command "pnpm run process:validate" -description "Validating raw data directories"
            
            # Get the timestamp from the metadata file
            $metadata = Get-Content -Path $metadataFile | ConvertFrom-Json
            Log-Message "  Processed data was generated at: $($metadata.processedAt)" "Gray"
            
            # Ask if the user wants to regenerate the processed data
            $regenerate = $false
            if ($env:FORCE_REGENERATE -eq "true") {
                $regenerate = $true
            } elseif (-not $env:CI) {
                # Only ask in interactive mode
                $response = Read-Host "Do you want to regenerate the processed data? (y/N)"
                if ($response -eq "y" -or $response -eq "Y") {
                    $regenerate = $true
                }
            }
            
            if ($regenerate) {
                Log-Message "  Regenerating processed data..." "Yellow"
                Exec-Command -command "pnpm run process:raw-data" -description "Regenerating processed data"
            } else {
                Log-Message "  Using existing processed data." "Green"
            }
        }

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
    }
    catch {
        Log-Message "ERROR: Failed to process raw data: $_" "Red"
        $overallSuccess = $false
        throw "Raw data processing failed"
    }

    #
    # STEP 5: Run content migrations via Payload migrations
    #
    Log-Message "STEP 5: Running content migrations via Payload migrations..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "apps/payload"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"

        # Run all migrations (including content migrations)
        Log-Message "  Running all Payload migrations..." "Yellow"
        Exec-Command -command "pnpm payload migrate" -description "Running Payload migrations"

        # Verify migrations were applied
        Log-Message "  Verifying migrations..." "Yellow"
        $migrationStatus = Exec-Command -command "pnpm migrate:status" -description "Verifying migration status" -captureOutput

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        # Run verification scripts
        Push-Location -Path "packages/content-migrations"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"
        
        Log-Message "  Verifying database state..." "Yellow"
        $verificationResult = Exec-Command -command "pnpm run verify:all" -description "Verifying database relationships" -captureOutput
        
        # Check if verification found any issues
        if ($verificationResult -match "Warning" -or $verificationResult -match "Error") {
            Log-Message "WARNING: Verification found issues, running edge case repairs..." "Yellow"
            
            Log-Message "  Running edge case repairs..." "Yellow"
            Exec-Command -command "pnpm run repair:edge-cases" -description "Running edge case repairs"

            # Fix survey questions population issue
            Log-Message "  Fixing survey questions population..." "Yellow"
            Exec-Command -command "pnpm run fix:survey-questions-population" -description "Fixing survey questions population"

            Log-Message "  Final verification..." "Yellow"
            $finalVerification = Exec-Command -command "pnpm run verify:all" -description "Final verification" -captureOutput
            
            if ($finalVerification -match "Warning" -or $finalVerification -match "Error") {
                Log-Message "WARNING: Some issues could not be fixed automatically" "Yellow"
                $overallSuccess = $false
            }
            else {
                Log-Message "  All issues have been fixed" "Green"
            }
        }
        else {
            Log-Message "  No issues found, skipping repairs" "Green"
        }

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
    }
    catch {
        Log-Message "ERROR: Failed to run content migrations: $_" "Red"
        $overallSuccess = $false
        throw "Content migration failed"
    }

    #
    # STEP 6: Check if SQL seed files need to be executed
    #
    Log-Message "STEP 6: Checking if SQL seed files need to be executed..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "packages/content-migrations"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"

        # Verify database schema
        Log-Message "  Verifying database schema..." "Yellow"
        $schemaVerification = Exec-Command -command "pnpm run sql:verify-schema" -description "Verifying database schema" -captureOutput
        
        if ($schemaVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Message "ERROR: Database schema verification failed" "Red"
            $overallSuccess = $false
            throw "Database schema verification failed"
        }

        # Skip SQL seed files execution since the Payload migration already executes them
        Log-Message "  Skipping SQL seed files execution since the Payload migration already executes them." "Green"

        # Fix survey questions population
        Log-Message "  Fixing survey questions population..." "Yellow"
        Exec-Command -command "pnpm run fix:survey-questions-population" -description "Fixing survey questions population"

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
    }
    catch {
        Log-Message "ERROR: Failed to check or execute SQL seed files: $_" "Red"
        $overallSuccess = $false
        throw "SQL seed files check or execution failed"
    }

    #
    # STEP 7: Comprehensive database verification using Node.js utilities
    #
    Log-Message "STEP 7: Performing comprehensive database verification..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "packages/content-migrations"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"

        # Verify database schema using the new Node.js utility
        Log-Message "  Verifying database schema..." "Yellow"
        $finalVerification = Exec-Command -command "pnpm run sql:verify-schema" -description "Final database verification" -captureOutput
        
        if ($finalVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Message "ERROR: Final database verification failed" "Red"
            $overallSuccess = $false
            throw "Final database verification failed"
        }

        # Verify course_lessons quiz_id_id column
        Log-Message "  Verifying course_lessons quiz_id_id column..." "Yellow"
        $courseLessonsVerification = Exec-Command -command "pnpm run verify:course-lessons" -description "Verifying course_lessons quiz_id_id column" -captureOutput
        
        if ($courseLessonsVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Message "ERROR: Course lessons quiz_id_id column verification failed" "Red"
            $overallSuccess = $false
            throw "Course lessons quiz_id_id column verification failed"
        } else {
            Log-Message "  Course lessons quiz_id_id column verification passed" "Green"
        }

        # Verify media_id columns
        Log-Message "  Verifying media_id columns..." "Yellow"
        $mediaColumnsVerification = Exec-Command -command "pnpm --filter @kit/content-migrations run verify:media-columns" -description "Verifying media_id columns" -captureOutput
        
        if ($mediaColumnsVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Message "ERROR: Media columns verification failed" "Red"
            $overallSuccess = $false
            throw "Media columns verification failed"
        } else {
            Log-Message "  Media columns verification passed" "Green"
        }

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
    }
    catch {
        Log-Message "ERROR: Database verification failed: $_" "Red"
        $overallSuccess = $false
        throw "Database verification failed"
    }

    # Final success/failure message
    if ($overallSuccess) {
        Log-Message "All migrations and verifications completed successfully!" "Green"
        Log-Message "Admin user created with email: michael@slideheroes.com" "Green"
    } else {
        Log-Message "Migration process completed with warnings or errors. Please check the logs for details." "Yellow"
    }
}
catch {
    Log-Message "CRITICAL ERROR: Migration process failed: $_" "Red"
    Log-Message "Please check the log files for details:" "Red"
    Log-Message "  - Transcript log: $logFile" "Red"
    Log-Message "  - Detailed log: $detailedLogFile" "Red"
    
    # Stop transcript before exiting
    try {
        Stop-Transcript -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "Warning: Could not stop transcript: $_" -ForegroundColor Yellow
    }
    exit 1
}
finally {
    # Always stop transcript
    try {
        Stop-Transcript -ErrorAction SilentlyContinue
    }
    catch {
        Write-Host "Warning: Could not stop transcript: $_" -ForegroundColor Yellow
    }
    Log-Message "Migration logs saved to:" "Cyan"
    Log-Message "  - Transcript log: $logFile" "Cyan"
    Log-Message "  - Detailed log: $detailedLogFile" "Cyan"
}
