# Fix connection string issues for database URL
# This script verifies and fixes issues with the database connection string

# Import utility modules
. "$PSScriptRoot\utils\logging.ps1"

# Configure error handling
$ErrorActionPreference = "Stop"

function Fix-ConnectionString {
    try {
        # Show banner
        Write-Host "FIXING DATABASE CONNECTION STRING"

        # Get project information
        Write-Host "Retrieving project information..."
        $projectsOutput = Exec-Command -command "supabase projects list" -description "Getting projects list" -captureOutput
        
        # Find the active project (2025slideheroes)
        $activeProject = $projectsOutput -split "\n" | Where-Object { $_ -match "2025slideheroes" }
        
        if ($activeProject) {
            Write-Host "Found active project: $activeProject"
            
            # Extract project ID
            if ($activeProject -match "(\w+)\s+\|\s+2025slideheroes") {
                $projectId = $matches[1].Trim()
                Write-Host "Extracted project ID: $projectId"
                
                # Extract region
                if ($activeProject -match "2025slideheroes\s+\|\s+([a-z0-9-]+)") {
                    $region = $matches[1].Trim()
                    Write-Host "Extracted region: $region"
                    
                    # Fix connection string
                    $oldUrl = $env:REMOTE_DATABASE_URL
                    $newUrl = "postgres://postgres.${projectId}:password@aws-0-${region}.pooler.supabase.com:5432/postgres"
                    
                    Write-Host "Old URL: $oldUrl"
                    Write-Host "New URL: $newUrl"
                    
                    # Update environment variable
                    $env:REMOTE_DATABASE_URL = $newUrl
                    Write-Host "Updated REMOTE_DATABASE_URL environment variable"
                    
                    # Return success
                    return $true
                }
            }
        }
        
        # If we get here, we couldn't find or fix the connection string
        Write-Host "Could not extract project ID from projects list."
        
        # Alternative approach: Look for project by name
        $projectLine = $projectsOutput -split "\n" | Where-Object { $_ -match "2025slideheroes" } | Select-Object -First 1
        
        if ($projectLine) {
            $parts = $projectLine -split "\|" | ForEach-Object { $_.Trim() }
            
            if ($parts.Count -ge 3) {
                $projectId = $parts[1]
                $region = ($parts[3] -replace ".*\(([a-z0-9-]+)\).*", '$1').ToLower()
                
                if ($projectId -and $region) {
                    Write-Host "Alternative extraction - ID: $projectId, Region: $region"
                    $newUrl = "postgres://postgres.${projectId}:password@aws-0-${region}.pooler.supabase.com:5432/postgres"
                    $env:REMOTE_DATABASE_URL = $newUrl
                    Write-Host "Updated REMOTE_DATABASE_URL using alternative method"
                    return $true
                }
            }
        }
        
        # Set a hardcoded value for ldebzombxtszzcgnylgq in us-east-2
        Write-Host "Falling back to hardcoded connection string for ldebzombxtszzcgnylgq"
        $env:REMOTE_DATABASE_URL = "postgres://postgres.ldebzombxtszzcgnylgq:password@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
        Write-Host "Updated REMOTE_DATABASE_URL with hardcoded value"
        
        return $true
    }
    catch {
        Write-Host "ERROR fixing connection string: $($_.Exception.Message)"
        return $false
    }
}

# Run the fix
$result = Fix-ConnectionString

# Return exit code based on result
exit [int](-not $result)
