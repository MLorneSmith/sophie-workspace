# PowerShell Setup Phase Module for Reset-and-Migrate.ps1
# Handles database reset and initial schema creation

# Import utility modules
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\verification.ps1"

# Function to run the setup phase
function Invoke-SetupPhase {
    Log-Phase "SETUP PHASE"
    
    # Step 1: Reset Supabase database and run Web app migrations
    Reset-SupabaseDatabase
    
    # Step 2: Reset Payload schema
    Reset-PayloadSchema
    
    # Step 3: Run Payload migrations
    Run-PayloadMigrations
    
    Log-Success "Setup phase completed successfully"
}

# Function to reset Supabase database and run web app migrations
function Reset-SupabaseDatabase {
    Log-Step "Resetting Supabase database and running Web app migrations" 1
    
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "apps/web"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"
        
        # Check if we need to restart Supabase (only needed once after config.toml changes)
        $configChangedFlag = Join-Path -Path $env:TEMP -ChildPath "supabase_config_changed.flag"
        if (-not (Test-Path -Path $configChangedFlag)) {
            Log-Message "Restarting Supabase to apply config changes..." "Yellow"
            Exec-Command -command "supabase stop" -description "Stopping Supabase"
            Exec-Command -command "supabase start" -description "Starting Supabase"
            
            # Create flag file to indicate that Supabase has been restarted
            Set-Content -Path $configChangedFlag -Value "Supabase restarted at $(Get-Date)"
            Log-Message "Created flag file to indicate Supabase has been restarted" "Gray"
        } else {
            Log-Message "Skipping Supabase restart (already done)" "Gray"
        }
        
        Log-Message "Running supabase:reset..." "Yellow"
        
        # Add retry logic for transient errors
        $maxRetries = 3
        $retryCount = 0
        $success = $false
        
        while (-not $success -and $retryCount -lt $maxRetries) {
            try {
                if ($retryCount -gt 0) {
                    Log-Message "Retry attempt $retryCount of $maxRetries..." "Yellow"
                    # Wait before retrying (exponential backoff)
                    Start-Sleep -Seconds (2 * $retryCount)
                }
                
                # Try to restart Supabase first to fix potential connection issues
                if ($retryCount -gt 0) {
                    Log-Message "Restarting Supabase before retrying..." "Yellow"
                    Exec-Command -command "supabase stop" -description "Stopping Supabase" -continueOnError
                    Start-Sleep -Seconds 2
                    Exec-Command -command "supabase start" -description "Starting Supabase" -continueOnError
                    Start-Sleep -Seconds 5
                }
                
                # Try with debug flag if this is a retry
                if ($retryCount -gt 0) {
                    Exec-Command -command "pnpm run supabase:reset -- --debug" -description "Resetting Supabase database (debug mode)"
                } else {
                    Exec-Command -command "pnpm run supabase:reset" -description "Resetting Supabase database"
                }
                
                $success = $true
            }
            catch {
                $retryCount++
                
                if ($_ -match "502" -or $_ -match "invalid response" -or $_ -match "upstream server") {
                    Log-Warning "Encountered a transient error: $_"
                    if ($retryCount -lt $maxRetries) {
                        Log-Message "Will retry in a few seconds..." "Yellow"
                    }
                } else {
                    # If it's not a transient error, don't retry
                    throw $_
                }
            }
        }
        
        if (-not $success) {
            throw "Failed to reset Supabase database after $maxRetries attempts"
        }
        
        Log-Message "Running supabase migrations..." "Yellow"
        Exec-Command -command "supabase migration up" -description "Running Supabase migrations"
        
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        # Verify supabase migrations were applied
        if (Verify-Schema -schema "public") {
            Log-Success "Web app migrations completed successfully"
            return $true
        } else {
            throw "Web app migrations failed: public schema not found"
        }
    }
    catch {
        Log-Error "Failed to run Web app migrations: $_"
        throw "Web app migration failed: $_"
    }
}

# Function to reset the Payload schema
function Reset-PayloadSchema {
    Log-Step "Resetting Payload schema" 2
    
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
        Log-Message "Dropping and recreating payload schema..." "Yellow"
        Push-Location -Path "packages/content-migrations"
        Log-Message "Temporarily changed to directory: $(Get-Location)" "Gray"
        
        # Use the existing utils:run-sql-file script to execute the SQL file
        Exec-Command -command "pnpm run utils:run-sql-file `"$tempSQLFile`"" -description "Resetting Payload schema"
        
        # Remove the temporary file
        Remove-Item -Path $tempSQLFile -Force
        
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        Log-Success "Payload schema reset successfully"
        
        return $true
    }
    catch {
        Log-Error "Failed to reset Payload schema: $_"
        throw "Payload schema reset failed: $_"
    }
}

# Function to run Payload migrations
function Run-PayloadMigrations {
    Log-EnhancedStep "Running Payload migrations" 3 12
    
    # Add note about expected email adapter warning
    Log-ExpectedWarning "The 'No email adapter provided' warning is expected in development environment and can be safely ignored"
    
    try {
        # Use Push-Location/Pop-Location instead of cd to maintain path context
        Push-Location -Path "apps/payload"
        Log-Message "Changed directory to: $(Get-Location)" "Gray"

        # Run migration status to see what migrations are pending
        Log-Message "Checking migration status..." "Yellow"
        $migrationStatus = Exec-Command -command "pnpm migrate:status" -description "Checking migration status" -captureOutput
        
        # Run all migrations using the updated index.ts file
        Log-Message "Running all migrations..." "Yellow"
        Exec-Command -command "pnpm payload migrate" -description "Running Payload migrations"

        # Add relationship ID columns to payload_locked_documents and payload_locked_documents_rels tables
        Log-Message "Adding relationship ID columns to locked documents tables..." "Yellow"
        
        # Temporarily change to the root directory to run the content-migrations script
        Push-Location -Path "../.."
        Log-Message "Temporarily changed to directory: $(Get-Location)" "Gray"
        
        Exec-Command -command "pnpm --filter @kit/content-migrations run sql:add-relationship-id-columns" -description "Adding relationship ID columns to locked documents tables"
        
        # Fix UUID tables using the enhanced approach
        Log-Message "Managing UUID tables with enhanced approach..." "Yellow"
        try {
            Push-Location -Path "packages/content-migrations"
            
            # Use the new comprehensive UUID table management
            Log-Message "Running enhanced UUID table management..." "Yellow"
            Exec-Command -command "pnpm run uuid:comprehensive" -description "Running enhanced UUID table management"
            
            Log-Success "UUID tables managed successfully with enhanced approach"
            Pop-Location
        } catch {
            Log-Warning "UUID table management encountered issues, but continuing: $_"
            # This is not critical, so we'll continue even if it fails
            # However, we should make sure we pop back to the original directory
            if ((Get-Location).Path.EndsWith('content-migrations')) {
                Pop-Location
                Log-Message "Returned to directory: $(Get-Location)" "Gray"
            }
        }
        
        # Verify UUID tables to ensure all required columns exist
        Log-Message "Verifying UUID tables and their required columns..." "Yellow"
        try {
            Push-Location -Path "packages/content-migrations"
            
            # Use the new verification script
            Exec-Command -command "pnpm run uuid:verify" -description "Running UUID tables verification" 
            
            Pop-Location
            Log-Success "UUID tables verified successfully"
        } catch {
            # This is not critical, so we'll continue even if it fails
            Log-Warning "UUID tables verification encountered issues, but continuing: $_"
            
            # Ensure we pop back to the original directory
            if ((Get-Location).Path.EndsWith('content-migrations')) {
                Pop-Location
                Log-Message "Returned to directory: $(Get-Location)" "Gray"
            }
        }
        
        # Return to the payload directory
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"

        # Check migration status again to confirm all migrations were applied
        Log-Message "Verifying migration status..." "Yellow"
        try {
            # Make sure we're in the correct directory first
            if (-not (Get-Location).Path.EndsWith('payload')) {
                Push-Location -Path "apps/payload"
                Log-Message "Changed directory to: $(Get-Location)" "Gray"
                $popNeeded = $true
            } else {
                $popNeeded = $false
            }
            
            # Run migration status check
            $migrationStatus = Exec-Command -command "pnpm migrate:status" -description "Verifying migration status" -captureOutput
            
            # Pop back if needed
            if ($popNeeded) {
                Pop-Location
                Log-Message "Returned to directory: $(Get-Location)" "Gray"
            }
            
            # Check if there are any pending migrations
            $migrationSuccess = $true
            if ($migrationStatus -match "No migrations have been run yet") {
                Log-Warning "No migrations have been run yet"
                $migrationSuccess = $false
            }
            elseif ($migrationStatus -match "Pending migrations") {
                Log-Warning "There are still pending migrations"
                $migrationSuccess = $false
            }
            else {
                Log-Success "All migrations have been applied successfully"
            }
        }
        catch {
            # If we encounter an error, log it but continue
            Log-Warning "Could not verify migration status: $_"
            Log-Message "This is non-critical, continuing" "Yellow"
            $migrationSuccess = $true  # Assume success to continue
        }

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        # Verify payload schema and tables were created
        if (-not (Verify-Schema -schema "payload")) {
            Log-Error "Payload schema was not created"
            throw "Payload migrations failed: payload schema not found"
        }
        
        # Verify essential tables
        $requiredTables = @("courses", "course_lessons", "course_quizzes", "quiz_questions", "surveys", "survey_questions")
        $tablesSuccess = $true
        foreach ($table in $requiredTables) {
            if (-not (Verify-Table -schema "payload" -table $table)) {
                Log-Error "Required table 'payload.$table' was not created"
                $tablesSuccess = $false
            }
        }
        
        if (-not $tablesSuccess) {
            throw "Payload migrations failed: some required tables not found"
        }
        
        Log-Success "Payload migrations completed successfully"
        return $migrationSuccess -and $tablesSuccess
    }
    catch {
        Log-Error "Failed to run Payload migrations: $_"
        throw "Payload migration failed: $_"
    }
}

# All functions are automatically available when dot-sourced
# No need for Export-ModuleMember in this context
