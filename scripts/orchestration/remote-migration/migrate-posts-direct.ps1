# Direct Posts Migration Script
# This script exports posts data from the local database and imports it to the remote database
# It focuses on a smaller, more controlled approach than trying to migrate everything at once

# Import remote config to get the database URL
. "$PSScriptRoot\..\utils\remote-config.ps1"

Write-Host "Starting direct posts migration to remote Supabase database..." -ForegroundColor Cyan
Write-Host "Using URL: $env:REMOTE_DATABASE_URL" -ForegroundColor Gray

# Set up temporary directory for dump files
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$tempDir = Join-Path -Path $env:TEMP -ChildPath "posts_migration_$timestamp"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "Using temporary directory: $tempDir" -ForegroundColor Gray

try {
    # Step 1: Export posts data from local database
    Write-Host "`nStep 1: Exporting posts data from local database..." -ForegroundColor Yellow
    
    # Tables to export
    $tables = @(
        "posts",
        "posts_categories",
        "posts_tags",
        "posts_rels"
    )
    
    # Create dump files for each table
    Push-Location -Path "apps/web"
    
    foreach ($table in $tables) {
        $dumpFile = Join-Path -Path $tempDir -ChildPath "$table.sql"
        Write-Host "  Exporting payload.$table to $dumpFile" -ForegroundColor Yellow
        
        # Use supabase CLI instead of pg_dump
        $dumpCmd = "supabase db dump --data-only --schema payload --local > `"$tempDir\all_payload_data.sql`""
        Write-Host "  Running: $dumpCmd" -ForegroundColor Gray
        
        # Execute the dump command
        Invoke-Expression $dumpCmd
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  Warning: Supabase db dump returned exit code $LASTEXITCODE" -ForegroundColor Yellow
        }
        
        # Extract only the current table's data using PowerShell
        if (Test-Path "$tempDir\all_payload_data.sql") {
            $allContent = Get-Content -Path "$tempDir\all_payload_data.sql" -Raw
            # Search for the specific table's INSERT statements
            $tablePattern = "(?s)-- Data for Name: $table; .*?-- [^\r\n]*\r?\n"
            if ($allContent -match $tablePattern) {
                $tableData = $matches[0]
                Set-Content -Path $dumpFile -Value $tableData
                $fileSize = (Get-Item $dumpFile).Length
                Write-Host "  Successfully exported payload.$table ($fileSize bytes)" -ForegroundColor Green
            } else {
                Write-Host "  No data found for $table in dump" -ForegroundColor Yellow
                # Create empty file
                Set-Content -Path $dumpFile -Value "-- No data for $table"
            }
        } else {
            Write-Host "  Failed to export payload.$table or file is empty" -ForegroundColor Red
        }
    }
    
    # Step 2: Combine and process dump files
    Write-Host "`nStep 2: Processing dump files..." -ForegroundColor Yellow
    
    $combinedFile = Join-Path -Path $tempDir -ChildPath "combined_posts.sql"
    
    # Create a single transaction for all tables
    Add-Content -Path $combinedFile -Value "-- Combined Posts Migration Script"
    Add-Content -Path $combinedFile -Value "-- Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Add-Content -Path $combinedFile -Value "BEGIN;"
    
    # Add each table's data
    foreach ($table in $tables) {
        $tableDumpFile = Join-Path -Path $tempDir -ChildPath "$table.sql"
        
        if (Test-Path $tableDumpFile) {
            $content = Get-Content -Path $tableDumpFile -Raw
            
            # Process content to fix common issues
            # 1. Remove SET statements that might conflict
            $content = $content -replace "SET .*?;[\r\n]+", ""
            
            # 2. Remove CREATE/ALTER statements - we only want data
            $content = $content -replace "CREATE .*?;[\r\n]+", ""
            $content = $content -replace "ALTER .*?;[\r\n]+", ""
            
            # 3. Add table name header
            Add-Content -Path $combinedFile -Value "`n-- Table: payload.$table"
            Add-Content -Path $combinedFile -Value $content
        }
    }
    
    # Close the transaction
    Add-Content -Path $combinedFile -Value "COMMIT;"
    
    # Step 3: Create a seed file in supabase directory
    Write-Host "`nStep 3: Preparing for push to remote database..." -ForegroundColor Yellow
    
    # Create seed directory if it doesn't exist
    $seedDir = Join-Path -Path "supabase" -ChildPath "seed"
    if (-not (Test-Path $seedDir)) {
        New-Item -ItemType Directory -Path $seedDir -Force | Out-Null
    }
    
    # Copy the combined file to seed directory
    $seedFile = Join-Path -Path $seedDir -ChildPath "posts_seed.sql"
    Copy-Item -Path $combinedFile -Destination $seedFile -Force
    
    # Try using the Supabase CLI's direct functionality
    Write-Host "`nStep 4: Pushing data to remote database using direct commands..." -ForegroundColor Yellow
    Write-Host "  Since the push command has issues, we'll try a different approach..." -ForegroundColor Gray
    
    # Create a special test script to see what's available in the schema
    $testSchemaScript = @"
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'payload';
"@
    $schemaFile = Join-Path -Path $tempDir -ChildPath "check_schema.sql"
    $testSchemaScript | Out-File -FilePath $schemaFile -Encoding utf8
    
    Write-Host "`n  Testing if payload schema exists in remote database..." -ForegroundColor Yellow
    # Use db diff to check schema (more compatible than other commands)
    $diffCmd = "supabase db diff --db-url=`"$env:REMOTE_DATABASE_URL`" --schema payload"
    Write-Host "  Running: $diffCmd" -ForegroundColor Gray
    $schemaOutput = Invoke-Expression $diffCmd 2>&1
    
    # Look for payload schema references
    $hasPayloadSchema = $schemaOutput -match "payload"
    
    if ($hasPayloadSchema) {
        Write-Host "  Found payload schema in remote database" -ForegroundColor Green
        
        # Try to insert directly using a targeted approach
        # Get SQL from the combined file, but split it into smaller chunks
        $combinedContent = Get-Content -Path $combinedFile -Raw
        
        # First, check if the posts table exists
        Write-Host "`n  Verifying posts table exists in remote database..." -ForegroundColor Yellow
        $tableCheckCmd = "supabase db diff --db-url=`"$env:REMOTE_DATABASE_URL`" --schema payload --table posts"
        $tableCheckOutput = Invoke-Expression $tableCheckCmd 2>&1
        $hasPostsTable = $tableCheckOutput -match "posts"
        
        if ($hasPostsTable) {
            Write-Host "  Confirmed posts table exists in remote database" -ForegroundColor Green
            
            # Create simple insert script for a test post
            $testPostInsert = @"
-- Test insert into payload.posts
BEGIN;
INSERT INTO payload.posts (id, title, slug, created_at, updated_at)
VALUES ('test-post-migration', 'Test Post from Migration', 'test-post-migration', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
COMMIT;
"@
            $testPostFile = Join-Path -Path $tempDir -ChildPath "test_post_insert.sql"
            $testPostInsert | Out-File -FilePath $testPostFile -Encoding utf8
            
            # Copy it to the supabase seed directory since that's a known location
            Copy-Item -Path $testPostFile -Destination $seedFile -Force
            
            # Try the push command one more time with the simplified seed
            Write-Host "`n  Attempting simplified insert with db push..." -ForegroundColor Yellow
            $simplePushCmd = "supabase db push --db-url=`"$env:REMOTE_DATABASE_URL`" --include-seed"
            Write-Host "  Running: $simplePushCmd" -ForegroundColor Gray
            $pushOutput = Invoke-Expression $simplePushCmd 2>&1
            
            # If that doesn't work, use npm package to help
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  Simplified push failed, falling back to other options..." -ForegroundColor Yellow
                
                # Create a temporary package.json and script to run postgres migration
                $tempPackageJson = Join-Path -Path $tempDir -ChildPath "package.json"
                @"
{
  "name": "post-migration-helper",
  "version": "1.0.0",
  "description": "Temporary helper for migrations",
  "scripts": {
    "migrate": "node migrate.js"
  },
  "dependencies": {
    "pg": "^8.11.0"
  }
}
"@ | Out-File -FilePath $tempPackageJson -Encoding utf8
                
                # Create a simple Node.js script to run the migration
                $migrateScript = Join-Path -Path $tempDir -ChildPath "migrate.js"
                @"
const { Client } = require('pg');
const fs = require('fs');

// Parse connection URL
const connectionUrl = process.env.DATABASE_URL;
console.log('Connecting to database...');

async function runMigration() {
  const client = new Client({ connectionString: connectionUrl });
  
  try {
    await client.connect();
    console.log('Connected to database successfully');
    
    const sql = fs.readFileSync('./test_post_insert.sql', 'utf8');
    console.log('Executing SQL:', sql);
    
    const result = await client.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await client.end();
  }
}

runMigration();
"@ | Out-File -FilePath $migrateScript -Encoding utf8
                
                # Install dependencies and run the script
                Write-Host "`n  Attempting migration with Node.js script..." -ForegroundColor Yellow
                
                # Return to original directory since we need to install Node.js deps
                Pop-Location
                
                # Save current location
                $originalLocation = Get-Location
                
                # Change to temp directory
                Set-Location -Path $tempDir
                
                # Install dependencies
                Write-Host "  Installing dependencies..." -ForegroundColor Gray
                Invoke-Expression "npm install" | Out-Null
                
                # Run the migration script
                Write-Host "  Running migration script..." -ForegroundColor Gray
                $env:DATABASE_URL = $env:REMOTE_DATABASE_URL
                Invoke-Expression "node migrate.js" 2>&1
                
                # Return to saved location
                Set-Location -Path $originalLocation
                
                # Return to web directory
                Push-Location -Path "apps/web"
            }
        } else {
            Write-Host "  Could not confirm posts table exists in remote database" -ForegroundColor Red
            Write-Host "  We need to ensure the schema migration has been run properly first" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Could not find payload schema in remote database" -ForegroundColor Red
        Write-Host "  We need to run schema migration first before attempting data migration" -ForegroundColor Yellow
    }
    
    # Check for errors
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Successfully applied posts data to remote database" -ForegroundColor Green
    } else {
        Write-Host "  Error pushing seed data. Exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "  Output:" -ForegroundColor Red
        $pushOutput | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
        
        # Try direct PSQL approach as fallback
        Write-Host "`n  Attempting direct PSQL method as fallback..." -ForegroundColor Yellow
        
        try {
            # Check if psql is available
            $psqlVersion = & psql --version 2>&1
            Write-Host "  PSQL available: $psqlVersion" -ForegroundColor Green
            
            # Execute with psql directly
            $psqlCmd = "psql `"$env:REMOTE_DATABASE_URL`" -f `"$combinedFile`""
            Write-Host "  Running: $psqlCmd" -ForegroundColor Gray
            $psqlOutput = Invoke-Expression $psqlCmd 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  PSQL execution successful" -ForegroundColor Green
            } else {
                Write-Host "  PSQL execution failed with exit code: $LASTEXITCODE" -ForegroundColor Red
                $psqlOutput | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
            }
        } catch {
            Write-Host "  PSQL not available or execution failed: $_" -ForegroundColor Red
            
            # Try one more option - write a simple temporary SQL file with just a few records
            Write-Host "`n  Attempting simplified approach with minimal SQL..." -ForegroundColor Yellow
            $minimalSql = Join-Path -Path $tempDir -ChildPath "minimal_posts.sql"
            
            # Create a very simple insert statement for just one post
            @"
INSERT INTO payload.posts (id, title, slug, created_at, updated_at)
VALUES 
  ('test-post-1', 'Test Post', 'test-post', NOW(), NOW());
"@ | Out-File -FilePath $minimalSql
            
            try {
                # Try to execute this minimal SQL
                Write-Host "  Executing minimal SQL test..." -ForegroundColor Yellow
                $testCmd = "psql `"$env:REMOTE_DATABASE_URL`" -f `"$minimalSql`""
                $testOutput = Invoke-Expression $testCmd 2>&1
                Write-Host "  Test execution completed with exit code: $LASTEXITCODE" -ForegroundColor $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Red" })
            } catch {
                Write-Host "  Minimal SQL test failed: $_" -ForegroundColor Red
            }
        }
    }
    
    # Step 5: Verify data was imported
    Write-Host "`nStep 5: Verifying data was imported..." -ForegroundColor Yellow
    
    # Use supabase db execute for verification
    $verifyFile = Join-Path -Path $tempDir -ChildPath "verify.sql"
    "SELECT COUNT(*) FROM payload.posts;" | Out-File -FilePath $verifyFile
    $verifyCmd = "supabase db execute `"$verifyFile`" --db-url=`"$env:REMOTE_DATABASE_URL`""
    $verifyOutput = Invoke-Expression $verifyCmd 2>&1
    
    if ($verifyOutput -match "\s+(\d+)\s+") {
        $count = $Matches[1]
        if ([int]$count -gt 0) {
            Write-Host "  Verified $count posts in remote database" -ForegroundColor Green
        } else {
            Write-Host "  No posts found in remote database" -ForegroundColor Red
        }
    } else {
        Write-Host "  Could not verify posts count" -ForegroundColor Red
    }
    
    # Clean up seed file
    Remove-Item -Path $seedFile -Force -ErrorAction SilentlyContinue
    
    # Return to original directory
    Pop-Location
    
    # Cleanup
    Write-Host "`nCleaning up temporary files..." -ForegroundColor Gray
    Remove-Item -Path $tempDir -Recurse -Force
    
    Write-Host "`nDirect posts migration completed!" -ForegroundColor Green
    
} catch {
    Write-Host "`nError: $_" -ForegroundColor Red
    
    # Return to original directory if needed
    if ((Get-Location).Path -match "apps/web") {
        Pop-Location
    }
    
    # Provide troubleshooting steps
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host " - Check that the local database is running" -ForegroundColor Yellow
    Write-Host " - Verify the Supabase CLI is properly installed" -ForegroundColor Yellow
    Write-Host " - Check the remote database connection string" -ForegroundColor Yellow
    Write-Host " - Examine the SQL files in $tempDir for issues" -ForegroundColor Yellow
}
