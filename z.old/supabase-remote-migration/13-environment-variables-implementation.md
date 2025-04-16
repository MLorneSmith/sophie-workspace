# Supabase Remote Migration: Environment Variables Implementation

**Date:** April 16, 2025  
**Status:** Implemented

## Table of Contents

1. [Issues Addressed](#1-issues-addressed)
2. [Implementation Overview](#2-implementation-overview)
3. [Key Components](#3-key-components)
4. [Next Steps](#4-next-steps)
5. [Remaining Challenges](#5-remaining-challenges)

## 1. Issues Addressed

In our work today, we addressed several critical issues with the remote migration process:

1. **Manual Password Entry**: Each time the migration script ran, it required manual entry of the database password, which was not efficient for automated processes.
2. **Environment Variable Management**: There was no centralized location for environment variables, making it difficult to maintain consistent configuration.
3. **Schema Creation Failures**: The `payload` schema creation in the remote database consistently failed with the Supabase CLI.
4. **Connection String Problems**: The connection string was using the project name instead of the project reference ID, leading to connection issues.

## 2. Implementation Overview

We made the following key improvements:

1. **Centralized Environment Variables**: Created a `.env` file in the `scripts/` directory to store all database connection parameters.
2. **Environment Variable Loader**: Implemented a PowerShell script to automatically load environment variables from the `.env` file.
3. **Direct Schema Creation**: Created an alternative schema creation approach using direct psql connection (though this encountered issues with psql availability).
4. **Project ID Handling**: Enhanced the database utility to properly extract and use the Supabase project reference ID from the projects list, rather than the project name.
5. **Password Management**: Added `PGPASSWORD` environment variable to eliminate the need for manual password entry.

## 3. Key Components

### 3.1. Environment Variables Setup

We created a centralized `.env` file in `scripts/.env` with the following structure:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database connections for remote migration
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
REMOTE_DATABASE_URL=postgres://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:5432/postgres
SUPABASE_DB_PASSWORD=UcQ5TYC3Hdh0v5G0
```

### 3.2. Environment Variable Loader

Created `scripts/orchestration/remote-migration/utils/env-loader.ps1` to:

- Load environment variables from the `.env` file
- Remove quotes if present
- Set them as process-level environment variables

```powershell
function Load-EnvFile {
    param (
        [string]$filePath = ".env"
    )

    # Load variables from .env file
    foreach ($line in $envContent) {
        if ($line -match "^\s*([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()

            # Remove quotes if present
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
                $value = $value.Substring(1, $value.Length - 2)
            }

            # Set environment variable
            [Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
        }
    }
}
```

### 3.3. Direct Schema Creation

Implemented `scripts/orchestration/remote-migration/create-schema-direct.ps1` to create the Payload schema directly. This script:

- Parses the connection string to extract required parameters
- Uses Supabase CLI or alternative methods to execute schema creation SQL
- Verifies the schema was created successfully

### 3.4. Enhanced Database.ps1 Utility

Updated database utility to extract and use the correct Supabase project reference ID:

```powershell
# Find the project reference ID (not the name) from the projects list
$projectLines = $projectsOutput -split "`n" | Where-Object { $_ -match $projectName }

if ($projectLines.Count -gt 0) {
    foreach ($line in $projectLines) {
        if ($line -match "\|\s+([a-z0-9]{20})\s+\|\s+$projectName\s+\|") {
            $projectId = $matches[1]
            Write-Host "Found project reference ID for $projectName`: $projectId"

            # Update environment variable with correct reference ID
            $oldUrl = $env:REMOTE_DATABASE_URL
            if ($oldUrl -match "postgres://postgres\.([a-zA-Z0-9]+):") {
                $urlProjectId = $matches[1]
                if ($urlProjectId -ne $projectId) {
                    $env:REMOTE_DATABASE_URL = $oldUrl -replace "postgres://postgres\.$urlProjectId`:", "postgres://postgres\.$projectId`:"
                }
            }
        }
    }
}
```

### 3.5. Main Script Updates

Modified `supabase-remote-migration.ps1` to:

- Import environment variables from `.env` file
- Set PGPASSWORD for child processes
- Add new DirectSchema option for an alternative approach to schema creation
- Maintain proper dependency order in the full migration process

## 4. Next Steps

To complete the migration process, the following steps are recommended:

1. **Fix the Schema Creation SQL**: The SQL for creating the Payload schema needs proper commas between column definitions.
2. **Verify Schema Creation**: After successful schema creation, verify the payload schema exists in the remote database.
3. **Test Progressive Migration**: Test the progressive content migration starting with core tables.
4. **Check Relationship Integrity**: After data migration, verify relationship integrity between tables.
5. **Automate the Full Process**: Once all individual steps are working, test the automated full migration process.

## 5. Remaining Challenges

Several challenges remain to be addressed:

1. **Supabase CLI Limitations**: The Supabase CLI has limitations in formatting SQL commands for direct execution.
2. **PostgreSQL Client Access**: Direct psql access would be beneficial but requires proper client installation.
3. **UUID Table Relationships**: The handling of dynamic UUID tables still needs thorough testing.
4. **Schema Migration Sequence**: Proper sequencing of schema migration is critical to avoid dependency issues.
5. **Data Integrity Verification**: Comprehensive verification of data integrity after migration is needed.

By addressing these remaining challenges and completing the proposed next steps, a robust and reliable migration process can be established.
