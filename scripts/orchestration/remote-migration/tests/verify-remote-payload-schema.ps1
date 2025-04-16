# Payload schema verification script for remote Supabase

# Import remote config to get the database URL
. "$PSScriptRoot\..\..\utils\remote-config.ps1"

Write-Host "Verifying Payload CMS schema in remote Supabase database..." -ForegroundColor Cyan
Write-Host "Using URL: $env:REMOTE_DATABASE_URL" -ForegroundColor Gray

try {
    # First, go to the web directory where supabase config exists
    Push-Location -Path "apps/web"
    
    # Create a verification query that checks for important tables in the payload schema
    $verificationQuery = @"
    SELECT
        table_schema,
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = t.table_schema AND table_name = t.table_name) as column_count
    FROM
        information_schema.tables t
    WHERE
        table_schema = 'payload'
    ORDER BY
        table_schema, table_name;
"@

    # Execute the query
    Write-Host "`nExecuting verification query to list payload tables:" -ForegroundColor Yellow
    Write-Host $verificationQuery -ForegroundColor Gray
    
    # Use psql to execute the query directly
    $tableResults = & psql "$env:REMOTE_DATABASE_URL" -c "$verificationQuery" 2>&1
    
    # Check if critical tables exist
    $criticalTables = @(
        "posts", 
        "documentation", 
        "courses", 
        "course_lessons", 
        "course_quizzes", 
        "quiz_questions", 
        "surveys", 
        "survey_questions", 
        "media",
        "users"
    )
    
    Write-Host "`nChecking for critical Payload CMS tables:" -ForegroundColor Yellow
    $tablesFound = @()
    $tablesMissing = @()
    
    foreach ($table in $criticalTables) {
        if ($tableResults -match $table) {
            $tablesFound += $table
            Write-Host " ✓ Found table: payload.$table" -ForegroundColor Green
        } else {
            $tablesMissing += $table
            Write-Host " ✗ Missing table: payload.$table" -ForegroundColor Red
        }
    }
    
    # Check for relationship tables
    Write-Host "`nChecking for relationship tables:" -ForegroundColor Yellow
    $relationshipPattern = "(_rels|_categories|_tags|__downloads)"
    $relationshipTables = $tableResults | Where-Object { $_ -match $relationshipPattern }
    
    if ($relationshipTables) {
        Write-Host " ✓ Found relationship tables:" -ForegroundColor Green
        foreach ($table in $relationshipTables) {
            if ($table -match "payload\.(\S+)\s+\|\s+\d+") {
                Write-Host "   - $($Matches[1])" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host " ✗ No relationship tables found" -ForegroundColor Red
    }
    
    # Check for UUID pattern tables
    Write-Host "`nChecking for UUID pattern tables:" -ForegroundColor Yellow
    $uuidPattern = "[0-9a-f]{8}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}"
    $uuidTables = $tableResults | Where-Object { $_ -match $uuidPattern }
    
    if ($uuidTables) {
        Write-Host " ✓ Found UUID pattern tables:" -ForegroundColor Green
        foreach ($table in $uuidTables) {
            if ($table -match "payload\.(\S+)\s+\|\s+\d+") {
                Write-Host "   - $($Matches[1])" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host " ✗ No UUID pattern tables found" -ForegroundColor Yellow
        Write-Host "   This may be normal if no dynamic relationships have been created" -ForegroundColor Gray
    }
    
    # Now check post table structure to see if it has proper columns
    $postColumnsQuery = @"
    SELECT 
        column_name, 
        data_type, 
        is_nullable
    FROM 
        information_schema.columns 
    WHERE 
        table_schema = 'payload' 
        AND table_name = 'posts'
    ORDER BY 
        ordinal_position;
"@

    # Execute the query
    Write-Host "`nChecking post table structure:" -ForegroundColor Yellow
    $postColumns = & psql "$env:REMOTE_DATABASE_URL" -c "$postColumnsQuery" 2>&1
    
    # Check if critical columns exist
    $criticalColumns = @("id", "title", "slug", "content", "_status", "created_at", "updated_at")
    
    foreach ($column in $criticalColumns) {
        if ($postColumns -match $column) {
            Write-Host " ✓ Found column: $column" -ForegroundColor Green
        } else {
            Write-Host " ✗ Missing column: $column" -ForegroundColor Red
        }
    }
    
    # Summary
    Write-Host "`nVerification Summary:" -ForegroundColor Cyan
    Write-Host "------------------------" -ForegroundColor Cyan
    Write-Host "Critical tables found: $($tablesFound.Count)/$($criticalTables.Count)" -ForegroundColor $(if ($tablesFound.Count -eq $criticalTables.Count) { "Green" } else { "Yellow" })
    
    if ($tablesMissing.Count -gt 0) {
        Write-Host "Missing critical tables: $($tablesMissing -join ", ")" -ForegroundColor Red
    }
    
    # Next steps advice
    Write-Host "`nRecommended Next Steps:" -ForegroundColor Yellow
    
    if ($tablesFound.Count -eq $criticalTables.Count) {
        Write-Host " - Schema appears to be properly set up" -ForegroundColor Green
        Write-Host " - Proceed with data migration using the progressive approach" -ForegroundColor Green
        Write-Host " - Start with migrating posts data using postgres dump commands" -ForegroundColor Green
    } else {
        Write-Host " - Fix missing tables by rerunning schema migration" -ForegroundColor Yellow
        Write-Host " - Check for schema migration errors in the logs" -ForegroundColor Yellow
        Write-Host " - Ensure all required migrations have been applied" -ForegroundColor Yellow
    }
    
    # Give specific advice based on findings
    if (-not ($uuidTables)) {
        Write-Host "`nUUID Table Management:" -ForegroundColor Yellow
        Write-Host " - Implement the UUID table tracking functionality" -ForegroundColor Yellow
        Write-Host " - Create the dynamic_uuid_tables tracking table" -ForegroundColor Yellow
        Write-Host " - Set up the scanning mechanism for UUID pattern tables" -ForegroundColor Yellow
    }
    
    Pop-Location
    
} catch {
    Write-Host "`nException occurred: $_" -ForegroundColor Red
    
    # Provide troubleshooting steps
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host " - Check if database connection string is correct" -ForegroundColor Yellow
    Write-Host " - Verify that psql is installed and in your PATH" -ForegroundColor Yellow
    Write-Host " - Ensure the remote database is accessible from your network" -ForegroundColor Yellow
    Write-Host " - Check firewall settings that might block the connection" -ForegroundColor Yellow
}
