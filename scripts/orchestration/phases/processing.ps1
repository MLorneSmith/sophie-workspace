# PowerShell Processing Phase Module for Reset-and-Migrate.ps1
# Handles data processing and SQL generation

# Import utility modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\verification.ps1"

# Function to run the processing phase
function Invoke-ProcessingPhase {
    param (
        [switch]$ForceRegenerate
    )
    
    Log-Phase "PROCESSING PHASE"
    
    # Step 1: Check and process raw data if needed
    Process-RawData -ForceRegenerate:$ForceRegenerate
    
    # Step 2: Generate SQL seed files and fix quiz ID consistency
    Generate-SqlSeedFiles
    
    # Step 3: Fix references to ensure consistency
    Fix-References
    
    Log-Success "Processing phase completed successfully"
}

# Function to check and process raw data
function Process-RawData {
    param (
        [switch]$ForceRegenerate
    )
    
    Log-Step "Checking and processing raw data" 4
    
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

        # Check if processed data exists
        $processedDataDir = "src/data/processed"
        $metadataFile = "$processedDataDir/metadata.json"
        
        if (-not (Test-Path -Path $metadataFile)) {
            Log-Message "Processed data not found. Processing raw data..." "Yellow"
            Exec-Command -command "pnpm run process:raw-data" -description "Processing raw data"
        } else {
            Log-Message "Processed data found. Validating raw data directories..." "Yellow"
            Exec-Command -command "pnpm run process:validate" -description "Validating raw data directories"
            
            # Get the timestamp from the metadata file
            $metadata = Get-Content -Path $metadataFile | ConvertFrom-Json
            Log-Message "Processed data was generated at: $($metadata.processedAt)" "Gray"
            
            # Process data again if regeneration is forced
            $regenerate = $ForceRegenerate
            if (-not $regenerate -and -not $env:CI) {
                # Only ask in interactive mode
                $response = Read-Host "Do you want to regenerate the processed data? (y/N)"
                if ($response -eq "y" -or $response -eq "Y") {
                    $regenerate = $true
                }
            }
            
            if ($regenerate) {
                Log-Message "Regenerating processed data..." "Yellow"
                Exec-Command -command "pnpm run process:raw-data" -description "Regenerating processed data"
            } else {
                Log-Success "Using existing processed data"
            }
        }

        # Ensure lesson metadata YAML exists and is up to date
        Log-Message "Ensuring lesson metadata YAML is up to date..." "Yellow"
        $yamlExists = Test-Path -Path "src/data/raw/lesson-metadata.yaml"
        
        if (-not $yamlExists -or $regenerate) {
            Log-Message "Creating or updating lesson metadata YAML..." "Yellow"
            
            # Check for required dependencies
            try {
                # Verify gray-matter dependency is installed
                $packageJson = Get-Content -Path "package.json" | ConvertFrom-Json
                $hasDependency = $false
                
                if ($packageJson.dependencies -and $packageJson.dependencies.'gray-matter') {
                    $hasDependency = $true
                }
                elseif ($packageJson.devDependencies -and $packageJson.devDependencies.'gray-matter') {
                    $hasDependency = $true
                }
                
                if (-not $hasDependency) {
                    Log-Message "Installing missing gray-matter dependency..." "Yellow"
                    Exec-Command -command "pnpm add gray-matter" -description "Installing gray-matter dependency"
                }
                
                # Now run the YAML generation script
                Exec-Command -command "pnpm exec tsx src/scripts/create-full-lesson-metadata.ts" -description "Creating lesson metadata YAML"
                Log-Success "Lesson metadata YAML created successfully"
            }
            catch {
                Log-Warning "Could not create lesson metadata YAML: $_"
                Log-Message "Will continue without YAML metadata" "Yellow"
            }
        } else {
            Log-Success "Lesson metadata YAML exists and is up to date"
        }

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        Log-Success "Raw data processing completed"
        return $true
    }
    catch {
        Log-Error "Failed to process raw data: $_"
        throw "Raw data processing failed: $_"
    }
}

# Function to generate SQL seed files and fix quiz ID consistency
function Generate-SqlSeedFiles {
    Log-Step "Generating SQL seed files and fixing quiz ID consistency" 5
    
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

        # Verify quiz system integrity
        Log-Message "Verifying quiz system integrity..." "Yellow"
        $quizSystemVerification = Exec-Command -command "pnpm exec tsx src/scripts/verification/verify-quiz-system-integrity.ts" -description "Verifying quiz system integrity" -captureOutput -continueOnError
        
        if ($LASTEXITCODE -ne 0) {
            Log-Warning "Quiz system integrity verification failed. Will attempt to fix during generation."
        }
        
        # Generate SQL seed files, with a fallback to the traditional approach if YAML method fails
        Log-Message "Generating SQL seed files..." "Yellow"
        try {
            # First try the YAML-based approach
            Log-Message "Attempting to generate SQL seed files using YAML-based approach..." "Yellow"
            
            # Check for required dependencies (similar to what we did for the YAML generation)
            $packageJson = Get-Content -Path "package.json" | ConvertFrom-Json
            $hasYamlDep = $false
            
            if ($packageJson.dependencies -and ($packageJson.dependencies.'gray-matter' -or $packageJson.dependencies.'yaml')) {
                $hasYamlDep = $true
            }
            elseif ($packageJson.devDependencies -and ($packageJson.devDependencies.'gray-matter' -or $packageJson.devDependencies.'yaml')) {
                $hasYamlDep = $true
            }
            
            if (-not $hasYamlDep) {
                Log-Message "Installing missing YAML dependencies..." "Yellow"
                Exec-Command -command "pnpm add gray-matter yaml" -description "Installing YAML dependencies"
            }
            
            # Try the YAML-based approach
            Exec-Command -command "pnpm --filter @kit/content-migrations run generate:updated-sql" -description "Generating SQL seed files using YAML metadata"
            Log-Success "Successfully generated SQL seed files using YAML approach"
        }
        catch {
            # If YAML approach fails, fall back to the traditional method
            Log-Warning "YAML-based SQL generation failed: $_"
            Log-Message "Installing missing yaml dependency..." "Yellow"
            Exec-Command -command "pnpm add -w yaml" -description "Installing yaml dependency" -continueOnError
            
            Log-Message "Falling back to traditional SQL generation method..." "Yellow"
            Exec-Command -command "pnpm run generate:sql" -description "Generating SQL seed files - fallback method" -continueOnError
        }
        
        # Fix quiz ID consistency issue - this will overwrite the 03-quizzes.sql with correct IDs
        Log-Message "Fixing quiz ID consistency issues..." "Yellow"
        Exec-Command -command "pnpm exec tsx src/scripts/fix-quiz-id-consistency.ts" -description "Fixing quiz ID consistency"
        
        Log-Success "SQL seed files generated and ID consistency fixed successfully"

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        return $true
    }
    catch {
        Log-Error "Failed to generate SQL seed files or fix quiz ID consistency: $_"
        throw "SQL seed files generation or quiz ID consistency fix failed: $_"
    }
}

# Function to fix references to ensure consistency
function Fix-References {
    Log-Step "Fixing references to ensure consistency" 6
    
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
        
        # Fix lesson-quiz references to ensure they match the corrected quiz IDs
        Log-Message "Fixing lesson-quiz reference consistency..." "Yellow"
        Exec-Command -command "pnpm exec tsx src/scripts/fix-lesson-quiz-references.ts" -description "Fixing lesson-quiz references"
        
        # Fix additional lesson-quiz references in 03a-lesson-quiz-references.sql
        Log-Message "Fixing additional lesson-quiz reference consistency..." "Yellow"
        Exec-Command -command "pnpm exec tsx src/scripts/fix-lessons-quiz-references-sql.ts" -description "Fixing additional lesson-quiz references"
        
        # Fix quiz question references in 04-questions.sql
        Log-Message "Fixing quiz question references..." "Yellow"
        Exec-Command -command "pnpm exec tsx src/scripts/fix-questions-quiz-references.ts" -description "Fixing quiz question references"
        
        Log-Success "All references fixed successfully"

        Pop-Location
        Log-Message "Returned to directory: $(Get-Location)" "Gray"
        
        return $true
    }
    catch {
        Log-Error "Failed to fix references: $_"
        throw "Reference fixing failed: $_"
    }
}

# All functions are automatically available when dot-sourced
# No need for Export-ModuleMember in this context
