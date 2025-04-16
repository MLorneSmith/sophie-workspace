# Remote Configuration Utilities for Supabase Remote Migration
# These utilities help with configuring and managing remote Supabase instance settings

# Get Supabase project ID from database URL
function Get-SupabaseProjectId {
    param (
        [string]$dbUrl
    )
    
    if (-not $dbUrl) {
        $dbUrl = $env:REMOTE_DATABASE_URL
    }
    
    if (-not $dbUrl) {
        Log-Warning "Database URL not provided"
        return $null
    }
    
    # Extract project ID from URL
    try {
        if ($dbUrl -match "postgres://postgres\.([a-zA-Z0-9]+):") {
            return $Matches[1]
        }
        elseif ($dbUrl -match "postgresql://postgres:.*@db\.([a-zA-Z0-9]+)\.supabase\.co:") {
            return $Matches[1]
        }
        else {
            Log-Warning "Could not extract project ID from database URL: $dbUrl"
            return $null
        }
    }
    catch {
        Log-Warning "Error extracting project ID: $_"
        return $null
    }
}

# Ensure Supabase CLI is linked to the correct project
function Ensure-SupabaseCliLinked {
    param (
        [string]$projectId
    )
    
    if (-not $projectId) {
        $projectId = Get-SupabaseProjectId
    }
    
    if (-not $projectId) {
        Log-Warning "Project ID not available for linking"
        return $false
    }
    
    try {
        # Check projects list and find the project name for the ID
        $projectsOutput = Invoke-Expression "supabase projects list" -ErrorAction SilentlyContinue
        
        Log-Message "Checking Supabase projects..." "Yellow"
        Log-Message "Searching for project ID for '2025slideheroes'..." "Yellow"
        
        if ($projectsOutput -match "2025slideheroes.*\|\s*$projectId") {
            Log-Message "Found project reference ID for 2025slideheroes: $projectId" "Green"
        }
        else {
            Log-Warning "Project ID $projectId not found in Supabase projects list"
        }
        
        # Link to the project
        Log-Message "Linking to project $projectId..." "Yellow"
        Invoke-Expression "supabase link --project-ref $projectId" | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Log-Success "Successfully linked to project $projectId"
            return $true
        }
        else {
            Log-Warning "Failed to link to project $projectId"
            return $false
        }
    }
    catch {
        Log-Warning "Error linking to Supabase project: $_"
        return $false
    }
}

# Test connection to remote Supabase database
function Test-RemoteConnection {
    param (
        [string]$dbUrl
    )
    
    if (-not $dbUrl) {
        $dbUrl = $env:REMOTE_DATABASE_URL
    }
    
    if (-not $dbUrl) {
        Log-Warning "Database URL not provided"
        return $false
    }
    
    try {
        # Extract connection details
        if ($dbUrl -match "postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)") {
            $user = $Matches[1]
            $password = $Matches[2]
            $host = $Matches[3]
            $port = $Matches[4]
            $database = $Matches[5]
            
            # Create a temporary file with a test query
            $tempFile = New-TemporaryFile
            "SELECT 1 as connection_test;" | Set-Content -Path $tempFile.FullName
            
            # Test connection using psql
            $cmd = "psql -h $host -p $port -U $user -d $database -f `"$tempFile.FullName`" -v ON_ERROR_STOP=1 -t"
            $result = Invoke-Expression $cmd
            
            # Clean up
            Remove-Item -Path $tempFile.FullName -Force
            
            if ($LASTEXITCODE -eq 0) {
                Log-Success "Connection to remote database successful"
                return $true
            }
            else {
                Log-Warning "Connection to remote database failed with exit code $LASTEXITCODE"
                return $false
            }
        }
        else {
            Log-Warning "Invalid database URL format: $dbUrl"
            return $false
        }
    }
    catch {
        Log-Warning "Error testing connection: $_"
        return $false
    }
}
