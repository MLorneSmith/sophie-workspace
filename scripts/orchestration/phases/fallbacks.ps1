# Fallbacks Phase Script
# This script orchestrates the implementation of fallback mechanisms for the content migration system

# Import utility modules using the standard approach used by other phase scripts
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\verification.ps1"

function Invoke-FallbacksPhase {
    Log-Phase "FALLBACKS PHASE"
    $overallSuccess = $true

    try {
        # Step 1: Deploy fallback mechanisms
        Log-Step "Deploying fallback mechanisms" 1

        Set-ProjectRootLocation
        if (Set-ProjectLocation -RelativePath "packages/content-migrations") {
            Log-Message "Changed directory to: $(Get-Location)" "Gray"

            # Create necessary directories
            $dirs = @(
                "src/data/mappings",
                "src/data/fallbacks"
            )

            foreach ($dir in $dirs) {
                if (-not (Test-Path $dir)) {
                    New-Item -Path $dir -ItemType Directory -Force | Out-Null
                    Log-Message "Created directory: $dir" "Gray"
                }
            }

            # Database-level fallbacks
            Log-Message "Implementing database-level fallbacks..." "Yellow"

            Log-Message "Creating fallback database views..." "Yellow"
            Exec-Command -command "pnpm tsx src/scripts/repair/fallbacks/database/create-fallback-views-sql.ts" -description "Creating fallback database views" -continueOnError
            if (-not $?) {
                Log-Warning "Database views creation encountered issues, but continuing"
                $overallSuccess = $false
            }

            Log-Message "Creating fallback database functions..." "Yellow"
            Exec-Command -command "pnpm tsx src/scripts/repair/fallbacks/database/create-fallback-functions-sql.ts" -description "Creating fallback database functions" -continueOnError
            if (-not $?) {
                Log-Warning "Database functions creation encountered issues, but continuing"
                $overallSuccess = $false
            }

            Log-Message "Generating static mappings..." "Yellow"
            Exec-Command -command "pnpm tsx src/scripts/repair/fallbacks/database/generate-static-mappings-sql.ts" -description "Generating static mappings" -continueOnError
            if (-not $?) {
                Log-Warning "Static mappings generation encountered issues, but continuing"
                $overallSuccess = $false
            }

            # API-level fallbacks
            Log-Message "Implementing API-level fallbacks..." "Yellow"

            # Check if scripts exist before attempting to run them
            if (Test-Path "src/scripts/repair/fallbacks/payload/create-hooks.ts") {
                Log-Message "Creating Payload hooks..." "Yellow"
                Exec-Command -command "pnpm tsx src/scripts/repair/fallbacks/payload/create-hooks.ts" -description "Creating Payload hooks" -continueOnError
                if (-not $?) {
                    Log-Warning "Payload hooks creation encountered issues, but continuing"
                    $overallSuccess = $false
                }
            } else {
                Log-Warning "Payload hooks script not found, skipping"
            }

            if (Test-Path "src/scripts/repair/fallbacks/payload/create-api-endpoints.ts") {
                Log-Message "Creating API endpoints..." "Yellow"
                Exec-Command -command "pnpm tsx src/scripts/repair/fallbacks/payload/create-api-endpoints.ts" -description "Creating API endpoints" -continueOnError
                if (-not $?) {
                    Log-Warning "API endpoints creation encountered issues, but continuing"
                    $overallSuccess = $false
                }
            } else {
                Log-Warning "API endpoints script not found, skipping"
            }

            if (Test-Path "src/scripts/repair/fallbacks/payload/register-fallbacks.ts") {
                Log-Message "Registering fallbacks with Payload..." "Yellow"
                Exec-Command -command "pnpm tsx src/scripts/repair/fallbacks/payload/register-fallbacks.ts" -description "Registering fallbacks" -continueOnError
                if (-not $?) {
                    Log-Warning "Fallbacks registration encountered issues, but continuing"
                    $overallSuccess = $false
                }
            } else {
                Log-Warning "Fallbacks registration script not found, skipping"
            }

            # Verify fallback implementation
            Log-Message "Verifying fallback system implementation..." "Yellow"
            Exec-Command -command "pnpm tsx src/scripts/verification/verify-fallbacks-sql.ts" -description "Verifying fallback implementation" -continueOnError
            if (-not $?) {
                Log-Warning "Fallback verification encountered issues, but continuing"
                $overallSuccess = $false
            }

            Pop-Location
            Log-Message "Returned to directory: $(Get-Location)" "Gray"
        } else {
            Log-Error "Could not find packages/content-migrations directory"
            $overallSuccess = $false
        }

        if ($overallSuccess) {
            Log-Success "Fallbacks phase completed successfully"
        } else {
            Log-Warning "Fallbacks phase completed with warnings"
        }

        return $overallSuccess
    }
    catch {
        Log-Error "Failed to implement fallback mechanisms: $_"
        return $false
    }
}

# NOTE: Do not auto-execute the phase here
# The phase will be invoked by the main reset-and-migrate.ps1 script
# Removed: Invoke-FallbacksPhase
