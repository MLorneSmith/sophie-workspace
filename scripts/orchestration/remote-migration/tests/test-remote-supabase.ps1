# PowerShell script to test connectivity to remote Supabase instance
param (
    [string]$RemoteDbUrl
)

# Import modules
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\remote-config.ps1"

# Initialize variables
$success = $true

function Show-Banner {
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host "         SUPABASE REMOTE CONNECTION TEST                " -ForegroundColor Cyan
    Write-Host "=======================================================" -ForegroundColor Cyan
    
    if ($RemoteDbUrl) {
        Write-Host "Using custom remote URL: $RemoteDbUrl" -ForegroundColor Yellow
    } else {
        Write-Host "Using default remote URL from remote-config.ps1" -ForegroundColor Yellow
    }
    
    Write-Host "=======================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-CliAvailability {
    Write-Host "Step 1: Testing Supabase CLI availability..." -ForegroundColor Yellow
    
    try {
        $version = supabase --version
        Write-Host "✓ Supabase CLI detected: $version" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ Supabase CLI not found. Please install using: npm install -g supabase" -ForegroundColor Red
        return $false
    }
}

function Test-RemoteConnection {
    Write-Host "Step 2: Testing remote database connection..." -ForegroundColor Yellow
    
    # Create a temporary SQL file
    $tempSql = "$env:TEMP\test_connection.sql"
    "SELECT 1 as connection_test;" | Set-Content -Path $tempSql
    
    try {
        supabase db execute "$tempSql" --db-url "$env:REMOTE_DATABASE_URL" | Out-Null
        Write-Host "✓ Successfully connected to remote database" -ForegroundColor Green
        Remove-Item -Path $tempSql -Force -ErrorAction SilentlyContinue
        return $true
    } catch {
        Write-Host "✗ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
        Remove-Item -Path $tempSql -Force -ErrorAction SilentlyContinue
        return $false
    }
}

function Test-SchemaAccess {
    Write-Host "Step 3: Testing schema access..." -ForegroundColor Yellow
    
    # Create a temporary SQL file
    $tempSql = "$env:TEMP\test_schemas.sql"
    "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;" | Set-Content -Path $tempSql
    
    try {
        $schemas = supabase db execute "$tempSql" --db-url "$env:REMOTE_DATABASE_URL"
        Remove-Item -Path $tempSql -Force -ErrorAction SilentlyContinue
        
        $hasPublic = $schemas -match "public"
        $hasPayload = $schemas -match "payload"
        
        if ($hasPublic) {
            Write-Host "✓ Public schema accessible" -ForegroundColor Green
        } else {
            Write-Host "✗ Public schema not found" -ForegroundColor Red
            return $false
        }
        
        if ($hasPayload) {
            Write-Host "✓ Payload schema already exists" -ForegroundColor Green
        } else {
            Write-Host "ℹ Payload schema not found (normal for first migration)" -ForegroundColor Yellow
        }
        
        return $true
    } catch {
        Write-Host "✗ Schema access failed: $($_.Exception.Message)" -ForegroundColor Red
        Remove-Item -Path $tempSql -Force -ErrorAction SilentlyContinue
        return $false
    }
}

# Main execution
Show-Banner

# Set database URL if provided
if ($RemoteDbUrl) {
    $env:REMOTE_DATABASE_URL = $RemoteDbUrl
}

# Check if URL is set
if (-not $env:REMOTE_DATABASE_URL) {
    Write-Host "ERROR: Remote database URL not set." -ForegroundColor Red
    Write-Host "Set it in scripts/orchestration/utils/remote-config.ps1 or provide with -RemoteDbUrl" -ForegroundColor Red
    exit 1
}

# Validate connection URL format
if (-not $env:REMOTE_DATABASE_URL.StartsWith("postgresql://")) {
    Write-Host "ERROR: Invalid database URL format. Must be in format:" -ForegroundColor Red
    Write-Host "postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres" -ForegroundColor Red
    exit 1
}

# Run tests
if (-not (Test-CliAvailability)) { 
    $success = $false 
    Write-Host "Test failed at Step 1: Supabase CLI not available" -ForegroundColor Red
    exit 1
}

if (-not (Test-RemoteConnection)) { 
    $success = $false 
    Write-Host "Test failed at Step 2: Cannot connect to remote database" -ForegroundColor Red
    exit 1
}

if (-not (Test-SchemaAccess)) { 
    $success = $false 
    Write-Host "Test failed at Step 3: Cannot access database schemas" -ForegroundColor Red
    exit 1
}

# Final result
if ($success) {
    Write-Host ""
    Write-Host "==== CONNECTION TEST COMPLETED SUCCESSFULLY ====" -ForegroundColor Green
    Write-Host "You can proceed with the database migration using:" -ForegroundColor Yellow
    Write-Host "./migrate-to-remote.ps1" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host ""
    Write-Host "==== CONNECTION TEST FAILED ====" -ForegroundColor Red
    Write-Host "Please fix the issues above before proceeding" -ForegroundColor Red
    exit 1
}
