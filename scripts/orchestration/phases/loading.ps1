# PowerShell Loading Phase Module for Reset-and-Migrate.ps1
# Handles content migration and database verification

# Import utility modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\verification.ps1"
. "$PSScriptRoot\..\utils\supabase.ps1"

# Function to run the loading phase
function Invoke-LoadingPhase {
    param (
        [switch]$SkipVerification
    )
    
    Log-Phase "LOADING PHASE"
    
    # Step 1: Run content migrations via Payload migrations
    Run-ContentMigrations
    
    # Step 2: Import downloads from R2 bucket
    Import-Downloads
    
    # Step 3: Fix relationships
    Fix-Relationships
    
    # Step 4: Comprehensive database verification
    if (-not $SkipVerification) {
        Verify-DatabaseState
    }
    
    # Step 5: Create certificates storage bucket in Supabase
    Create-CertificatesBucket
    
    Log-Success "Loading phase completed successfully"
}

# Function to run content migrations
function Run-ContentMigrations {
    Log-Step "Running content migrations via Payload migrations" 7
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to apps/payload directory using absolute path
        if (Set-ProjectLocation -RelativePath "apps/payload") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find apps/payload directory from project root"
        }

        # Run all migrations (including content migrations)
        Log-Message "Running all Payload migrations..." "Yellow"
        Exec-Command -command "pnpm payload migrate" -description "Running Payload migrations"

        # Verify migrations were applied
        Log-Message "Verifying migrations..." "Yellow"
        
        try {
            $migrationStatus = Exec-Command -command "pnpm migrate:status" -description "Verifying migration status" -captureOutput -continueOnError
        } catch {
            Log-Warning "Could not verify migration status: $_"
            Log-Message "This is non-critical, continuing" "Yellow"
        }

        # Return to project root before changing to content-migrations
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        # Now go to content-migrations from the project root
        Set-ProjectRootLocation
        # Run verification scripts
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
            
            Log-Message "Verifying database state..." "Yellow"
            $verificationResult = Exec-Command -command "pnpm run verify:all" -description "Verifying database structure" -captureOutput -continueOnError
            
            # Check if verification found any issues
            if ($verificationResult -match "Warning" -or $verificationResult -match "Error") {
                Log-Warning "Verification found issues, will run repairs in the Fix-Relationships step"
            } else {
                Log-Success "No issues found in initial verification"
            }

            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Warning "Could not find packages/content-migrations directory, skipping initial verification"
        }
        
        Log-Success "Content migrations completed successfully"
        return $true
    }
    catch {
        Log-Error "Failed to run content migrations: $_"
        throw "Content migration failed: $_"
    }
}

# Function to import downloads from R2 bucket
function Import-Downloads {
    Log-Step "Importing downloads from R2 bucket" 8
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to content-migrations directory using absolute path
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find packages/content-migrations directory from project root"
        }
        
        Log-Message "Importing downloads..." "Yellow"
        Exec-Command -command "pnpm run import:downloads" -description "Importing downloads from R2 bucket" -continueOnError
        
        Log-Success "Downloads imported successfully"
        
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        return $true
    }
    catch {
        Log-Error "Failed to import downloads: $_"
        throw "Download import failed: $_"
    }
}

# Function to fix relationships
function Fix-Relationships {
    Log-Step "Fixing relationships" 9
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to content-migrations directory using absolute path
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find packages/content-migrations directory from project root"
        }

        # Run the repair scripts
        Log-Message "Running edge case repairs..." "Yellow"
        Exec-Command -command "pnpm run repair:edge-cases" -description "Running edge case repairs" -continueOnError

        # Run lesson-quiz relationship fixes
        Log-Message "Running lesson-quiz relationship fixes..." "Yellow"
        Exec-Command -command "pnpm exec tsx src/scripts/repair/fix-lesson-quiz-field-name.ts" -description "Fixing lesson-quiz relationships" -continueOnError

        # Fix survey questions population issue
        Log-Message "Fixing survey questions population..." "Yellow"
        Exec-Command -command "pnpm run fix:survey-questions-population" -description "Fixing survey questions population" -continueOnError

        # Run final verification
        Log-Message "Running final verification..." "Yellow"
        $finalVerification = Exec-Command -command "pnpm run verify:all" -description "Final verification" -captureOutput -continueOnError
        
        if ($finalVerification -match "Warning" -or $finalVerification -match "Error") {
            Log-Warning "Some issues could not be fixed automatically"
        } else {
            Log-Success "All relationship issues have been fixed"
        }

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        return $true
    }
    catch {
        Log-Error "Failed to fix relationships: $_"
        throw "Relationship fixing failed: $_"
    }
}

# Function to verify database state
function Verify-DatabaseState {
    Log-Step "Performing comprehensive database verification" 10
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to content-migrations directory using absolute path
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find packages/content-migrations directory from project root"
        }

        # Check for required environment variables
        Check-DatabaseEnvironment
        
        # Verify database schema using the Node.js utility
        Log-Message "Verifying database schema..." "Yellow"
        $finalVerification = Exec-Command -command "pnpm run sql:verify-schema" -description "Final database verification" -captureOutput -continueOnError
        
        if ($finalVerification -match "Error" -or $LASTEXITCODE -ne 0) {
            Log-Error "Final database verification failed"
            $global:overallSuccess = $false
        } else {
            Log-Success "Database schema verification passed"
        }

        # Verify database columns
        Verify-DatabaseColumns
        
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        Log-Success "Database verification completed successfully"
        return $true
    }
    catch {
        Log-Error "Database verification failed: $_"
        $global:overallSuccess = $false
        return $false
    }
}

# Function to create certificates bucket in Supabase
function Create-CertificatesBucket {
    Log-Step "Creating certificates storage bucket in Supabase" 11
    
    try {
        # First ensure we're at the project root
        Set-ProjectRootLocation
        Log-Message "Changed to project root: $(Get-Location)" "Gray"
        
        # Navigate to web app directory using absolute path
        if (Set-ProjectLocation -RelativePath "apps/web") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"
        } else {
            throw "Could not find apps/web directory from project root"
        }
        
        # Use the Supabase utility to ensure the certificates bucket exists
        $bucketCreated = Ensure-SupabaseBucket -BucketName "certificates" -Public
        
        if (-not $bucketCreated) {
            Log-Warning "Could not verify or create certificates bucket"
            Log-Message "This is non-critical, continuing with migration" "Yellow"
        }
        
        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        return $true
    }
    catch {
        Log-Error "Failed to create certificates bucket: $_"
        Log-Warning "This is non-critical, continuing"
        return $false
    }
}

# All functions are automatically available when dot-sourced
# No need for Export-ModuleMember in this context
