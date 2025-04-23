# PowerShell Configuration Management Module for Reset-and-Migrate.ps1
# Handles configuration-related tasks and environment setup

# Import utility modules
. "$PSScriptRoot\logging.ps1"
. "$PSScriptRoot\path-management.ps1"

# Function to move PNPM configuration from apps/payload to the project root
# to ensure we reuse the same PNPM modules across the project
function Move-PnpmConfiguration {
    try {
        Log-Message "Checking PNPM configuration..." "Gray"
        
        # First ensure we're at the project root
        Set-ProjectRootLocation
        $projectRoot = Get-Location
        Log-Message "Project root: $projectRoot" "Gray"
        
        # Source and destination paths
        $sourcePnpmrc = Join-Path -Path $projectRoot -ChildPath "apps\payload\.npmrc"
        $destPnpmrc = Join-Path -Path $projectRoot -ChildPath ".npmrc"
        
        if (Test-Path -Path $sourcePnpmrc) {
            # Check if there's a difference between the source and destination
            $needsUpdate = $true
            
            if (Test-Path -Path $destPnpmrc) {
                $sourceContent = Get-Content -Path $sourcePnpmrc -Raw
                $destContent = Get-Content -Path $destPnpmrc -Raw
                
                if ($sourceContent -eq $destContent) {
                    Log-Message "PNPM configuration in root directory is already up to date" "Gray"
                    $needsUpdate = $false
                }
            }
            
            if ($needsUpdate) {
                # Copy the .npmrc file from apps/payload to project root
                Log-Message "Updating PNPM configuration in root directory..." "Yellow"
                Copy-Item -Path $sourcePnpmrc -Destination $destPnpmrc -Force
                Log-Success "PNPM configuration updated in root directory"
            }
        } else {
            Log-Message "Source PNPM configuration not found in apps/payload, skipping" "Gray"
        }
        
        # Check for .yarnrc in payload directory and move that too if needed
        $sourceYarnrc = Join-Path -Path $projectRoot -ChildPath "apps\payload\.yarnrc"
        $destYarnrc = Join-Path -Path $projectRoot -ChildPath ".yarnrc"
        
        if (Test-Path -Path $sourceYarnrc) {
            # Check if there's a difference between the source and destination
            $needsUpdate = $true
            
            if (Test-Path -Path $destYarnrc) {
                $sourceContent = Get-Content -Path $sourceYarnrc -Raw
                $destContent = Get-Content -Path $destYarnrc -Raw
                
                if ($sourceContent -eq $destContent) {
                    Log-Message "Yarn configuration in root directory is already up to date" "Gray"
                    $needsUpdate = $false
                }
            }
            
            if ($needsUpdate) {
                # Copy the .yarnrc file from apps/payload to project root
                Log-Message "Updating Yarn configuration in root directory..." "Yellow"
                Copy-Item -Path $sourceYarnrc -Destination $destYarnrc -Force
                Log-Success "Yarn configuration updated in root directory"
            }
        }
        
        return $true
    }
    catch {
        Log-Warning "Could not move PNPM configuration: $_"
        Log-Message "This is non-critical, continuing" "Yellow"
        return $false
    }
}

# Function to ensure .env files have required variables for database connections
function Ensure-EnvConfiguration {
    param (
        [string]$EnvDirectory = ""
    )
    
    try {
        if (-not $EnvDirectory) {
            # First ensure we're at the project root
            Set-ProjectRootLocation
            $EnvDirectory = Join-Path -Path (Get-Location) -ChildPath "packages\content-migrations"
        }
        
        if (Test-Path -Path $EnvDirectory) {
            $envDevFile = Join-Path -Path $EnvDirectory -ChildPath ".env.development"
            
            # Check if .env.development exists and create it if not
            if (-not (Test-Path -Path $envDevFile)) {
                Log-Message "Creating .env.development file..." "Yellow"
                
                # Create a basic .env.development file with database connection
                $envContent = @"
# Database connection
DATABASE_URI=postgresql://postgres:postgres@localhost:54322/postgres
"@
                Set-Content -Path $envDevFile -Value $envContent
                Log-Success "Created .env.development file with database connection"
            } else {
                # Check if DATABASE_URI exists in the file
                $envContent = Get-Content -Path $envDevFile -Raw
                
                if (-not ($envContent -match 'DATABASE_URI=')) {
                    Log-Message "Adding DATABASE_URI to .env.development file..." "Yellow"
                    
                    # Try to extract DATABASE_URL if it exists
                    $databaseUrl = ""
                    if ($envContent -match 'DATABASE_URL=(.+?)(\r?\n|$)') {
                        $databaseUrl = $matches[1]
                    } else {
                        # Use default supabase local URL
                        $databaseUrl = "postgresql://postgres:postgres@localhost:54322/postgres"
                    }
                    
                    # Add DATABASE_URI to the file
                    $newEnvContent = $envContent + "`nDATABASE_URI=$databaseUrl"
                    Set-Content -Path $envDevFile -Value $newEnvContent
                    Log-Success "Added DATABASE_URI to .env.development file"
                }
            }
        } else {
            Log-Warning "Environment directory not found: $EnvDirectory"
        }
        
        return $true
    }
    catch {
        Log-Warning "Could not ensure environment configuration: $_"
        Log-Message "This is non-critical, continuing" "Yellow"
        return $false
    }
}

# Function to check if database environment variables are properly set
function Check-DatabaseEnvironment {
    try {
        # Check if DATABASE_URI or DATABASE_URL environment variables are set
        if (-not $env:DATABASE_URI -and -not $env:DATABASE_URL) {
            Log-Warning "Neither DATABASE_URI nor DATABASE_URL environment variables are set"
            
            # Try to get from .env.development file in content-migrations package
            Set-ProjectRootLocation
            $envFile = Join-Path -Path (Get-Location) -ChildPath "packages\content-migrations\.env.development"
            
            if (Test-Path -Path $envFile) {
                Log-Message "Loading environment variables from .env.development" "Gray"
                $envContent = Get-Content -Path $envFile -Raw
                
                # Extract DATABASE_URI or DATABASE_URL from the env file
                if ($envContent -match 'DATABASE_URI=(.+)(\r?\n|$)') {
                    $databaseUri = $matches[1]
                    Log-Message "Setting DATABASE_URI from .env.development file" "Gray"
                    $env:DATABASE_URI = $databaseUri
                } elseif ($envContent -match 'DATABASE_URL=(.+)(\r?\n|$)') {
                    $databaseUrl = $matches[1]
                    Log-Message "Setting DATABASE_URI from DATABASE_URL in .env.development file" "Gray"
                    $env:DATABASE_URI = $databaseUrl
                } else {
                    Log-Warning "No DATABASE_URI or DATABASE_URL found in .env.development file"
                    
                    # Set a default value for Supabase local development
                    Log-Message "Setting default DATABASE_URI for Supabase local development" "Yellow"
                    $env:DATABASE_URI = "postgresql://postgres:postgres@localhost:54322/postgres"
                }
            } else {
                # Set a default value for Supabase local development
                Log-Message "Setting default DATABASE_URI for Supabase local development" "Yellow"
                $env:DATABASE_URI = "postgresql://postgres:postgres@localhost:54322/postgres"
            }
        }
        
        # If only DATABASE_URL is set, set DATABASE_URI too for compatibility
        if (-not $env:DATABASE_URI -and $env:DATABASE_URL) {
            Log-Message "Setting DATABASE_URI from DATABASE_URL environment variable" "Gray"
            $env:DATABASE_URI = $env:DATABASE_URL
        }
        
        # Verify we have a database connection string
        if ($env:DATABASE_URI) {
            Log-Success "Database environment variables set"
            return $true
        } else {
            Log-Error "Could not set database environment variables"
            return $false
        }
    }
    catch {
        Log-Warning "Error checking database environment: $_"
        return $false
    }
}
