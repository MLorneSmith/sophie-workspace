# Direct connection test script
# Import remote config to get the database URL
. "$PSScriptRoot\..\..\utils\remote-config.ps1"

Write-Host "Testing direct connection to remote Supabase database..." -ForegroundColor Cyan
Write-Host "Using URL: $env:REMOTE_DATABASE_URL" -ForegroundColor Gray

try {
    # Use psql to execute a simple query
    $query = "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name LIMIT 10;"
    
    Write-Host "`nExecuting test query to list schemas:" -ForegroundColor Yellow
    Write-Host $query -ForegroundColor Gray
    
    # First, go to the web directory where supabase config exists
    Push-Location -Path "apps/web"
    
    # Test connection using db diff, which is a non-destructive operation
    Write-Host "Testing connection with 'supabase db diff'..." -ForegroundColor Yellow
    $result = & supabase db diff --db-url "$env:REMOTE_DATABASE_URL" 2>&1
    
    Pop-Location
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nConnection successful!" -ForegroundColor Green
        Write-Host "Available schemas:" -ForegroundColor Cyan
        foreach ($line in $result) {
            if (-not [string]::IsNullOrWhiteSpace($line) -and $line -notmatch '^\s*\(\d+ rows?\)' -and $line -notmatch '^-+$' -and $line -notmatch '^schema_name$') {
                Write-Host " - $line" -ForegroundColor White
            }
        }
        
        # Analyze the connection results
        if ($result -match "Connecting to remote database") {
            Write-Host "`nConnection to remote database successful!" -ForegroundColor Green
            
            # Try to determine if schemas exist by looking at the output
            if ($result -match "payload") {
                Write-Host "`n'payload' schema appears to exist." -ForegroundColor Green
            } else {
                Write-Host "`nWARNING: 'payload' schema not detected in the output. Schema migration may not have been completed." -ForegroundColor Yellow
            }
            
            if ($result -match "public") {
                Write-Host "`n'public' schema appears to exist." -ForegroundColor Green
            } else {
                Write-Host "`nWARNING: 'public' schema not detected in the output. This is unexpected for a Supabase database." -ForegroundColor Red
            }
            
            # Extract more detailed information about what we can from the output
            Write-Host "`nConnection details from output:" -ForegroundColor Cyan
            $result | ForEach-Object {
                if ($_ -match "(schema|table|migration|version|database)") {
                    Write-Host " > $_" -ForegroundColor White
                }
            }
        } else {
            Write-Host "`nConnection attempt completed, but we couldn't verify if it was successful." -ForegroundColor Yellow
            Write-Host "Please check the raw output below for more details." -ForegroundColor Yellow
        }
        
        # Try another approach to test the connection
        Write-Host "`nAttempting to get database structure..." -ForegroundColor Yellow
        
        Push-Location -Path "apps/web"
    # Check database structure using db dump (with --dry-run flag)
    Write-Host "`nTesting database structure using 'supabase db dump'..." -ForegroundColor Yellow
    $dumpResult = & supabase db dump --db-url "$env:REMOTE_DATABASE_URL" --schema public,payload --dry-run 2>&1
        Pop-Location
        
        # Analyze both test results
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`nDatabase connection tests successful! This confirms we can connect to and read from the database." -ForegroundColor Green
            
            # Try to print schema information from the results
            Write-Host "`nSchema information:" -ForegroundColor Cyan
            $result | Where-Object { $_ -match "schema|table|public|payload" } | ForEach-Object {
                Write-Host " > $_" -ForegroundColor White
            }
            
            Write-Host "`nDatabase structure dump results:" -ForegroundColor Cyan
            $dumpResult | Where-Object { $_ -match "schema|table|public|payload" } | ForEach-Object {
                Write-Host " > $_" -ForegroundColor White
            }
        } else {
            Write-Host "`nDatabase connection tests failed. Error details:" -ForegroundColor Red
            
            Write-Host "`nDB diff command results:" -ForegroundColor Red
            $result | ForEach-Object { 
                Write-Host " > $_" -ForegroundColor Red 
            }
            
            Write-Host "`nDB dump command results:" -ForegroundColor Red
            $dumpResult | ForEach-Object { 
                Write-Host " > $_" -ForegroundColor Red 
            }
            
            # Provide guidance on connection issues
            Write-Host "`nTroubleshooting tips:" -ForegroundColor Yellow
            Write-Host " - Check if the connection string is correct" -ForegroundColor Yellow
            Write-Host " - Verify that the remote Supabase project is running" -ForegroundColor Yellow
            Write-Host " - Ensure the network allows connections to the remote database" -ForegroundColor Yellow
            Write-Host " - Check if the Supabase CLI is properly installed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "`nConnection failed! Error details:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "`nException occurred: $_" -ForegroundColor Red
}
