# Simplified connection test script
# This script performs a basic connection test to the remote Supabase database

# Import remote config to get the database URL
. "$PSScriptRoot\..\..\utils\remote-config.ps1"

Write-Host "Testing direct connection to remote Supabase database..." -ForegroundColor Cyan
Write-Host "Using URL: $env:REMOTE_DATABASE_URL" -ForegroundColor Gray

try {
    # First, go to the web directory where supabase config exists
    Push-Location -Path "apps/web"
    
    # Test connection using a very limited diff to check basic connectivity
    Write-Host "Testing basic connection to remote database..." -ForegroundColor Yellow
    
    # Use --schema with a simple limit to reduce output and just check connectivity
    $connectionCmd = "supabase db diff --db-url `"$env:REMOTE_DATABASE_URL`" --schema public -s 1"
    Write-Host "Running: $connectionCmd" -ForegroundColor Gray
    
    $result = & supabase db diff --db-url "$env:REMOTE_DATABASE_URL" --schema public -s 1 2>&1
    $connectionSuccess = ($LASTEXITCODE -eq 0)
    
    Pop-Location
    
    if ($connectionSuccess) {
        Write-Host "`nBASIC CONNECTION SUCCESSFUL!" -ForegroundColor Green
        Write-Host "The Supabase CLI was able to establish a connection to the remote database." -ForegroundColor Green
        
        Write-Host "`nCurrent Environment Variables:" -ForegroundColor Cyan
        Write-Host "REMOTE_DATABASE_URL: $env:REMOTE_DATABASE_URL" -ForegroundColor White
        
        # Print schema test
        Push-Location -Path "apps/web"
        Write-Host "`nListing available schemas..." -ForegroundColor Yellow
        & supabase db dump --db-url "$env:REMOTE_DATABASE_URL" --schema-only --schema information_schema -t information_schema.schemata
        Pop-Location
        
        Write-Host "`nConnection verification completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nCONNECTION FAILED!" -ForegroundColor Red
        Write-Host "The Supabase CLI was unable to establish a connection to the remote database." -ForegroundColor Red
        
        Write-Host "`nError details:" -ForegroundColor Red
        foreach ($line in $result) {
            Write-Host " > $line" -ForegroundColor Red
        }
        
        Write-Host "`nTroubleshooting suggestions:" -ForegroundColor Yellow
        Write-Host " - Verify the connection string format (it should match the Supabase pooler format)" -ForegroundColor Yellow
        Write-Host " - Check network connectivity (no firewall blocking outbound connections)" -ForegroundColor Yellow
        Write-Host " - Confirm the remote Supabase instance is running" -ForegroundColor Yellow
        Write-Host " - Ensure the credentials in the connection string are correct" -ForegroundColor Yellow
        Write-Host " - Try connecting from another tool (e.g., pgAdmin or DBeaver)" -ForegroundColor Yellow
        
        Write-Host "`nConnection String:" -ForegroundColor Cyan
        Write-Host "$env:REMOTE_DATABASE_URL" -ForegroundColor White
    }
} catch {
    Write-Host "`nException occurred during connection test: $_" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    
    # Return a non-zero exit code
    exit 1
}
