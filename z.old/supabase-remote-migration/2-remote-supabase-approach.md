# Supabase Remote Migration Plan (Updated)

## Solution

We've successfully established a connection to the remote Supabase database using the session mode pooler format:

```
postgres://postgres.ldebzombxtszzcgnylgq:UcQ5TYC3Hdh0v5G0@aws-0-us-east-2.pooler.supabase.com:5432/postgres
```

This follows the Supabase documentation recommendation for using the Supavisor session mode for persistent connections.

## Migration Approach

We've implemented a three-step migration process using PowerShell scripts:

### 1. Schema Migration (`migrate-schema.ps1`)

- Changes to the web app's local database schema are diffed and applied to the remote database
- Custom roles are included with `--include-roles` flag
- Migration sequences:
  1. Generate schema diff to create new migration file
  2. Review migration file (optional)
  3. Push schema changes to remote database

### 2. Data Migration (`migrate-data.ps1`)

- Data from both public and payload schemas is exported and imported
- Uses the `--include-seed` flag to transfer data
- Migration sequences:
  1. Verify schema exists on remote database
  2. Create seed.sql file with data dumps from public and payload schemas
  3. Push seed data to remote database

### 3. Relationship Fixes

- Content migration system's fix scripts are run against the remote database
- Database connection is temporarily redirected to remote
- Key fixes:
  1. UUID table fixes
  2. Downloads relationship fixes
  3. Post image relationship fixes
  4. Lexical format fixes

### 4. Verification

- Data integrity verification scripts are run against the remote database
- Special attention to verifying post content integrity

## Orchestration

All steps are orchestrated by the main script `migrate-to-remote.ps1`, which:

1. Tests connection to remote database
2. Runs schema migration
3. Runs data migration
4. Produces comprehensive logs for troubleshooting

## Benefits of This Approach

1. **Direct CLI Integration**: Uses Supabase CLI tools for reliable migrations
2. **Content Integrity**: Leverages existing content migration system for fixes
3. **Verification**: Built-in verification to ensure data integrity
4. **Logging**: Comprehensive logging for troubleshooting
5. **Modular**: Each step can be run independently if needed

## Usage

```powershell
# Run the full migration process
./migrate-to-remote.ps1

# Skip the diff generation and review phase
./migrate-to-remote.ps1 -SkipDiff

# Skip relationship fixes (if needed)
./migrate-to-remote.ps1 -SkipFixes

# Skip verification phase
./migrate-to-remote.ps1 -SkipVerification
```

The migration scripts handle the connection to the remote database using the configured URL in `scripts/orchestration/utils/remote-config.ps1`.
