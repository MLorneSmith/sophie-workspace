# Test remote database connection

# Import utility modules
. "$PSScriptRoot\..\utils\path-management.ps1"
. "$PSScriptRoot\..\utils\logging.ps1"
. "$PSScriptRoot\..\utils\execution.ps1"
. "$PSScriptRoot\..\utils\remote-config.ps1"
. "$PSScriptRoot\..\utils\supabase.ps1"

# Initialize logging
Initialize-Logging -logPrefix "remote-test"

try {
    # Test connection
    if (Connect-RemoteSupabase) {
        Log-Success "Successfully connected to remote database"

        # Test a simple query
        $result = Invoke-RemoteSql -sql "SELECT schema_name FROM information_schema.schemata"
        Log-Message "Schemas found on remote database:" "Green"
        Log-Message $result "Gray"
    } else {
        Log-Error "Failed to connect to remote database"
    }
}
catch {
    Log-Error "Test failed: $_"
}
finally {
    # Finalize logging
    Finalize-Logging -success ($LASTEXITCODE -eq 0)
}
