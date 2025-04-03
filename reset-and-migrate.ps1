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
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
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
    Add-Content -Path $detailedLogFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'): $message"
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
            Add-Content -Path $detailedLogFile -Value "--- Command Output Start ---`n$output`n--- Command Output End ---"
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
Start-Transcript -Path $logFile -Append
Log-Message "Starting migration process at $(Get-Date)" "Cyan"
Log-Message "Detailed logs will be saved to: $detailedLogFile" "Cyan"

try {
    #
    # STEP 1: Reset Supabase database and run Web app migrations
    #
    Log-Message "STEP 1: Resetting Supabase database and running Web app migrations..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "apps/web"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"
        
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
    # STEP 2: Run Payload migrations
    #
    Log-Message "STEP 2: Running Payload migrations..." "Cyan"
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
    # STEP 3: Run content migrations and verification
    #
    Log-Message "STEP 3: Running content migrations and verification..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "packages/content-migrations"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"

        Log-Message "  Running fixed migration scripts..." "Yellow"
        Exec-Command -command "pnpm run migrate:all:direct:fixed" -description "Running fixed migration scripts"

        Log-Message "  Verifying database state..." "Yellow"
        $verificationResult = Exec-Command -command "pnpm run verify:all-relationships" -description "Verifying database relationships" -captureOutput
        
        # Check if verification found any issues
        if ($verificationResult -match "Warning" -or $verificationResult -match "Error") {
            Log-Message "WARNING: Verification found issues, running edge case repairs..." "Yellow"
            
            Log-Message "  Running edge case repairs..." "Yellow"
            Exec-Command -command "pnpm run repair:edge-cases" -description "Running edge case repairs"

            Log-Message "  Final verification..." "Yellow"
            $finalVerification = Exec-Command -command "pnpm run verify:all-relationships" -description "Final verification" -captureOutput
            
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
    # STEP 4: Skip SQL seed files (now handled by Payload migrations)
    #
    Log-Message "STEP 4: Skipping SQL seed files (now handled by Payload migrations)..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "packages/content-migrations"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"

        # Verify database schema
        Log-Message "  Verifying database schema..." "Yellow"
        $schemaVerification = Exec-Command -command "pnpm run verify:sql-schema" -description "Verifying database schema" -captureOutput
        
        if ($schemaVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Message "ERROR: Database schema verification failed" "Red"
            $overallSuccess = $false
            throw "Database schema verification failed"
        }

        # Skip SQL seed files
        Log-Message "  Skipping SQL seed files generation and execution..." "Yellow"
        Log-Message "  NOTE: Course data is now seeded by Payload migration 20250402_305000_seed_course_data.ts" "Yellow"
        Log-Message "  NOTE: Lessons and quizzes are seeded by direct migrations in Step 3" "Yellow"

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
    }
    catch {
        Log-Message "ERROR: Failed to verify database schema: $_" "Red"
        $overallSuccess = $false
        throw "Database schema verification failed"
    }

    #
    # STEP 5: Comprehensive database verification using Node.js utilities
    #
    Log-Message "STEP 5: Performing comprehensive database verification..." "Cyan"
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "packages/content-migrations"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"

        # Verify database schema using the new Node.js utility
        Log-Message "  Verifying database schema..." "Yellow"
        $finalVerification = Exec-Command -command "pnpm run verify:sql-schema" -description "Final database verification" -captureOutput
        
        if ($finalVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Message "ERROR: Final database verification failed" "Red"
            $overallSuccess = $false
            throw "Final database verification failed"
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
    Stop-Transcript
    exit 1
}
finally {
    # Always stop transcript
    Stop-Transcript
    Log-Message "Migration logs saved to:" "Cyan"
    Log-Message "  - Transcript log: $logFile" "Cyan"
    Log-Message "  - Detailed log: $detailedLogFile" "Cyan"
}
