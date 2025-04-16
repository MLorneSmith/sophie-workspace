# Script to specifically migrate posts data to remote database
# This assumes schema has been properly migrated

param (
    [string]$RemoteDbUrl
)

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Import modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"

# Initialize logging
Initialize-Logging -logPrefix "posts-migration"

try {
    # Check remote DB URL
    if ($RemoteDbUrl) {
        $env:REMOTE_DATABASE_URL = $RemoteDbUrl
        Log-Message "Using provided Remote Database URL" "Yellow"
    }
    
    # Make sure the URL is properly formatted for CLI
    $dbUrl = $env:REMOTE_DATABASE_URL
    
    # Validate connection URL format
    if (-not ($dbUrl.StartsWith("postgresql://") -or $dbUrl.StartsWith("postgres://"))) {
        throw "Invalid database URL format"
    }
    
    # Go to web directory
    Set-ProjectRootLocation
    Push-Location -Path "apps/web"
    Log-Message "Changed directory to: $(Get-Location)" "Gray"
    
    # Create a posts-specific seed file
    Log-Message "Creating posts-specific seed file..." "Yellow"
    $postsDir = Join-Path -Path $env:TEMP -ChildPath "posts_seed"
    if (-not (Test-Path -Path $postsDir)) {
        New-Item -ItemType Directory -Path $postsDir -Force | Out-Null
    }
    $postsSeedFile = Join-Path -Path $postsDir -ChildPath "posts_seed.sql"
    
    # Dump posts-related tables from the local database
    Log-Message "Dumping posts tables from local database..." "Yellow"
    
    # Create a temporary directory for each table's dump
    $tempDumpDir = Join-Path -Path $env:TEMP -ChildPath "posts_dumps"
    if (-not (Test-Path -Path $tempDumpDir)) {
        New-Item -ItemType Directory -Path $tempDumpDir -Force | Out-Null
    }
    
    # Dump all payload schema data from local database
    Log-Message "Dumping all payload schema data from local database..." "Yellow"
    $fullDumpFile = Join-Path -Path $tempDumpDir -ChildPath "full_payload_dump.sql"
    Exec-Command -command "supabase db dump --data-only --schema payload --local > `"$fullDumpFile`"" -description "Dumping payload schema"
    
    # Extract posts-related data using PowerShell
    Log-Message "Extracting posts-related data..." "Yellow"
    $content = Get-Content -Path $fullDumpFile -Raw
    
    # Filter for posts tables using regex patterns
    $postsContent = ""
    
    # Pattern for INSERT statements for posts tables
    $patterns = @(
        "INSERT INTO payload\.posts",
        "INSERT INTO payload\.posts_rels",
        "INSERT INTO payload\.posts_categories",
        "INSERT INTO payload\.posts_tags", 
        "INSERT INTO payload\.posts__downloads",
        "INSERT INTO payload\.private",
        "INSERT INTO payload\.private_rels",
        "INSERT INTO payload\.private_categories",
        "INSERT INTO payload\.private_tags",
        "INSERT INTO payload\.private__downloads"
    )
    
    # Extract all matching INSERT statements and copy them to the posts seed file
    foreach ($pattern in $patterns) {
        if ($content -match "$pattern.*(?:\n.*)*?;") {
            $matches = [regex]::Matches($content, "$pattern.*(?:\n.*)*?;")
            foreach ($match in $matches) {
                $postsContent += $match.Value + "`n"
            }
        }
    }
    
    # Write filtered content to posts seed file
    Set-Content -Path $postsSeedFile -Value $postsContent
    
    # Verify the seed file was created and has content
    if (Test-Path -Path $postsSeedFile) {
        $seedContent = Get-Content -Path $postsSeedFile -Raw
        if ($seedContent.Length -gt 0) {
            Log-Message "Posts seed file created with $($seedContent.Length) bytes of content" "Green"
        } else {
            Log-Warning "Posts seed file was created but is empty"
        }
    } else {
        Log-Error "Failed to create posts seed file"
        exit 1
    }
    
    # Create a temporary copy of the seed file in the Supabase directory
    $tempSeedFile = Join-Path -Path "supabase" -ChildPath "posts_temp_seed.sql"
    Copy-Item -Path $postsSeedFile -Destination $tempSeedFile -Force
    
    # Push only the posts seed data to the remote database
    Log-Message "Pushing posts seed data to remote database..." "Yellow"
    Exec-Command -command "supabase db push --db-url `"$dbUrl`" --ignore-migration-errors --use-seed-data `"$tempSeedFile`"" -description "Pushing posts seed data to remote"
    
    # Check if seed push was successful
    if ($LASTEXITCODE -eq 0) {
        Log-Success "Posts data migration successful!"
        
        # Clean up temporary seed file
        if (Test-Path -Path $tempSeedFile) {
            Remove-Item -Path $tempSeedFile -Force
        }
        
        # Navigate to content-migrations directory for verification and fixes
        Set-Location -Path "../../packages/content-migrations"
        
        # Set DATABASE_URI to remote for verification
        $originalDatabaseUri = $env:DATABASE_URI
        $env:DATABASE_URI = $env:REMOTE_DATABASE_URL
        
        # Fix post-specific relationships
        Log-Message "Fixing post relationships on remote database..." "Yellow"
        Exec-Command -command "pnpm run fix:post-image-relationships" -description "Fixing post image relationships" -continueOnError
        
        # Verify posts content
        Log-Message "Verifying posts content on remote database..." "Yellow"
        $verified = $false
        try {
            Exec-Command -command "pnpm run verify:post-content" -description "Verifying posts content" -continueOnError
            $verified = ($LASTEXITCODE -eq 0)
        } catch {
            Log-Warning "Error during verification: $_"
        }
        
        # Restore original DATABASE_URI
        $env:DATABASE_URI = $originalDatabaseUri
        
        if ($verified) {
            Log-Success "Posts content verification successful!"
        } else {
            Log-Warning "Posts content verification failed or had warnings."
            Log-Message "You may want to check the post content manually." "Yellow"
        }
    } else {
        Log-Error "Posts data migration failed with exit code $LASTEXITCODE"
    }
    
    # Return to project root
    Set-ProjectRootLocation
    Log-Message "Returned to directory: $(Get-Location)" "Gray"
}
catch {
    Log-Error "CRITICAL ERROR: Posts migration failed: $_"
    exit 1
}
finally {
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
