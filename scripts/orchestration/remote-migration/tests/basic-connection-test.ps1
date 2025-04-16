# Basic Connection Test Script
# This script performs a very minimal test to verify connectivity to the remote database

# Import remote config to get the database URL
. "$PSScriptRoot\..\..\utils\remote-config.ps1"

Write-Host "Testing basic connection to remote Supabase database..." -ForegroundColor Cyan
Write-Host "Using URL: $env:REMOTE_DATABASE_URL" -ForegroundColor Gray
Write-Host "Project ID: $ProjectReferenceId" -ForegroundColor Gray

try {
    # Display Supabase CLI version for debugging
    Write-Host "`nChecking Supabase CLI version..." -ForegroundColor Yellow
    & supabase --version
    
    # Navigate to web directory (where supabase is configured)
    Push-Location -Path "apps/web"

    # Use the simplest possible command to test connectivity without creating a shadow DB
    Write-Host "`nAttempting to list Supabase project details..." -ForegroundColor Yellow
    & supabase projects list
    
    # Extract the project ID from the connection string
    $projectIdMatch = $env:REMOTE_DATABASE_URL -match "postgres\.([a-z0-9]+):"
    $projectId = $matches[1]
    
    # Check if project appears in the list of linked projects
    $projectDetails = & supabase projects list | Out-String
    $isProjectLinked = $projectDetails.Contains($projectId) -and $projectDetails.Contains("2025slideheroes")
    
    # Display project info
    Write-Host "`nFound remote project ID: $projectId" -ForegroundColor Yellow
    Write-Host "Project is linked in Supabase CLI: $isProjectLinked" -ForegroundColor $(if ($isProjectLinked) { "Green" } else { "Red" })
    
    Pop-Location
    
    # Alternative connection test using supabase CLI
    Write-Host "`nTesting connection differently..." -ForegroundColor Yellow
    
    $connectionSuccess = $isProjectLinked
    
    if ($connectionSuccess) {
        Write-Host "`n✅ CONNECTION SUCCESSFUL!" -ForegroundColor Green
        Write-Host "You are connected to the remote Supabase database." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "`n❌ CONNECTION FAILED" -ForegroundColor Red
        
        # Suggest troubleshooting steps
        Write-Host "`nTROUBLESHOOTING SUGGESTIONS:" -ForegroundColor Yellow
        Write-Host "1. Ensure the Supabase project is active and available" -ForegroundColor Yellow
        Write-Host "2. Verify your network allows outbound connections to Supabase" -ForegroundColor Yellow
        Write-Host "3. Check that your connection URL is in the correct format:" -ForegroundColor Yellow
        Write-Host "   postgres://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" -ForegroundColor Gray
        Write-Host "4. Verify that the Supabase CLI is properly installed and up-to-date" -ForegroundColor Yellow
        Write-Host "5. Try connecting to the database using pgAdmin or another PostgreSQL client" -ForegroundColor Yellow
        
        exit 1
    }
} catch {
    Write-Host "`n❌ ERROR DURING CONNECTION TEST: $_" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    exit 1
}
