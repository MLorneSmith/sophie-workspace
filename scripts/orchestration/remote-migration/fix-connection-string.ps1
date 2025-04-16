# fix-connection-string.ps1

# Import required modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"

# Initialize logging
Initialize-Logging -logPrefix "connection-fix"

try {
    Log-Phase "CONNECTION STRING FIX"

    # Get the current database URL environment variable
    $currentUrl = $env:REMOTE_DATABASE_URL
    Log-Message "Current remote database URL: $currentUrl" "Yellow"

    # Check if the URL matches the expected format
    $isPoolerFormat = $currentUrl -match "postgres://postgres\.([a-zA-Z0-9]+):(.+)@aws-\d+-([a-z0-9-]+)\.pooler\.supabase\.com:\d+/postgres"
    
    if ($isPoolerFormat) {
        $projectId = $matches[1]
        $password = $matches[2]
        $region = $matches[3]
        
        Log-Message "URL appears to be in the correct pooler format" "Green"
        Log-Message "Project ID: $projectId" "Cyan"
        Log-Message "Region: $region" "Cyan"
        
        # Check if password contains URL-unsafe characters
        $needsEncoding = $password -match "[^a-zA-Z0-9\-_\.]"
        if ($needsEncoding) {
            Log-Message "Password may need URL encoding" "Yellow"
            
            # Create an encoded version of the password
            Add-Type -AssemblyName System.Web
            $encodedPassword = [System.Web.HttpUtility]::UrlEncode($password)
            
            # Construct a properly encoded connection string
            $encodedUrl = "postgres://postgres.${projectId}:${encodedPassword}@aws-0-${region}.pooler.supabase.com:5432/postgres"
            
            Log-Message "Suggested encoded URL: $encodedUrl" "Cyan"
            $env:REMOTE_DATABASE_URL = $encodedUrl
            Log-Message "Updated REMOTE_DATABASE_URL environment variable" "Green"
        }
        
        # Test connection with modified URL
        Log-Step "Testing updated connection string" 1
        
        Push-Location -Path "apps/web"
        
        # Test connection using projects list command
        Log-Message "Verifying Supabase CLI connectivity..." "Yellow"
        Exec-Command -command "supabase projects list" -description "Testing Supabase CLI" -continueOnError
        
        Pop-Location
        
        Log-Message "Connection parameter check completed" "Green"
    } else {
        Log-Error "Remote database URL does not match the expected format for Supabase"
        Log-Message "Expected format: postgres://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" "Red"
        
        # Try to extract project info from Supabase CLI
        Log-Step "Checking linked projects" 2
        
        Push-Location -Path "apps/web"
        
        Log-Message "Fetching project information..." "Yellow"
        $projectsOutput = Exec-Command -command "supabase projects list" -description "Getting projects list" -captureOutput
        
        $activeProject = $projectsOutput | Where-Object { $_ -match "\s●\s.*2025slideheroes" }
        if ($activeProject) {
            $projectLine = $activeProject -replace '\s+', ' '
            if ($projectLine -match "\s●\s+\S+\s+(\S+)\s+2025slideheroes\s+(\S+)") {
                $foundProjectId = $matches[1]
                $foundRegion = $matches[2].Replace("us-east-2", "us-east-2")
                
                Log-Message "Found active project: 2025slideheroes" "Green"
                Log-Message "Project ID: $foundProjectId" "Cyan"
                Log-Message "Region: $foundRegion" "Cyan"
                
                # Prompt for password
                Log-Message "Please update your .env file with the correct password for this project" "Yellow"
                Log-Message "Example connection string:" "Yellow"
                Log-Message "REMOTE_DATABASE_URL=postgres://postgres.$foundProjectId:YOUR_PASSWORD@aws-0-$foundRegion.pooler.supabase.com:5432/postgres" "Cyan"
            }
        }
        
        Pop-Location
    }
    
    Log-Success "Connection string analysis completed"
}
catch {
    Log-Error "CRITICAL ERROR: Connection string analysis failed: $_"
    exit 1
}
finally {
    # Make sure we're back to the original directory
    if ((Get-Location).Path -match "apps[/\\]web$") {
        Pop-Location
    }
    
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
