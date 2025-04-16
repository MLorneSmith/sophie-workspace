# Remote Supabase Migration Script Reorganization

**Date: April 15, 2025**

## Overview

This document outlines the reorganization of the Supabase remote migration scripts to improve organization, maintainability, and address specific issues with the content migration, particularly for blog posts.

## Problems Identified

1. **Script Clutter**: Multiple migration-related scripts were in the root directory, causing clutter
2. **Post Data Migration Issue**: Post data was not properly migrating to the remote database
3. **Lack of Specialized Scripts**: No dedicated script for migrating specific content types
4. **No Central Documentation**: No single documentation source for the migration process

## Solution Implementation

### 1. Directory Structure Creation

Created a dedicated directory structure for migration scripts:

```
scripts/
└── orchestration/
    └── remote-migration/
        ├── migrate-to-remote.ps1     (Main orchestration script)
        ├── migrate-schema.ps1        (Schema migration script)
        ├── migrate-data.ps1          (Data migration script)
        ├── migrate-posts-data.ps1    (Posts-specific migration)
        ├── README.md                 (Documentation)
        └── tests/
            ├── supabase-test.ps1
            ├── test-remote-supabase.ps1
            ├── test-push-capability.ps1
            └── simple-test.ps1
```

### 2. Path Reference Updates

Updated all script references to work correctly from the new locations:

- Changed references from `$PSScriptRoot\scripts\orchestration\utils\...` to `$PSScriptRoot\..\utils\...`
- Fixed test script paths
- Adjusted all relative paths

### 3. Specialized Posts Migration Script

Created a specialized script for posts migration that:

1. Dumps the full payload schema from the local database (fixed to use `--local` flag)
2. Extracts posts-related data using PowerShell regex
3. Creates a posts-specific seed file
4. Pushes only that data to the remote database
5. Verifies the posts content after migration

### 4. Root Wrapper Script

Created `supabase-remote-migration.ps1` in the root directory that:

1. Provides a clean, consistent interface
2. Offers parameter-based operation selection
3. Routes to appropriate scripts in the new directory structure
4. Includes comprehensive help and error handling

### 5. Documentation

1. Added comprehensive `README.md` in the migration directory
2. Documented each script's purpose, parameters, and usage
3. Added troubleshooting guidance

## Migration Process Workflow

The new process follows these steps:

1. Test remote connection:

   ```powershell
   ./supabase-remote-migration.ps1 -Test
   ```

2. Migrate schema:

   ```powershell
   ./supabase-remote-migration.ps1 -SchemaOnly
   ```

3. Migrate data:

   ```powershell
   ./supabase-remote-migration.ps1 -DataOnly
   ```

4. If posts data is missing, migrate posts specifically:
   ```powershell
   ./supabase-remote-migration.ps1 -PostsOnly
   ```

## Implementation Details

### Posts Migration Technical Approach

The posts migration script was updated to address the issues with the previous approach:

1. Instead of using `supabase db dump --schema payload --table posts ...` which was failing due to flags not compatible with Supabase CLI, the script now:

   - Dumps the entire payload schema with `supabase db dump --data-only --schema payload --local`
   - Uses PowerShell to extract only the posts-related INSERT statements using regex
   - Writes these to a temporary seed file
   - Uses `supabase db push --use-seed-data` to apply just the posts data

2. Added proper error handling, logging, and verification

### Common Issues Fixed

1. **Parameter Order**: Fixed parameter ordering to ensure script parameters work correctly
2. **Local vs. Remote Flag**: Added `--local` flag to specify local database for dumps
3. **Regex Pattern Matching**: Used PowerShell regex to extract only relevant INSERT statements
4. **Error Handling**: Improved error handling throughout all scripts

## Results & Verification

The reorganized scripts were tested and verified to:

1. Successfully connect to the remote database
2. Successfully push schema to remote database
3. Successfully migrate posts data to remote database
4. Properly verify post content integrity

## Future Recommendations

1. Consider adding more specialized content migration scripts (e.g., for lessons, quizzes)
2. Add additional verification steps and reporting for all content types
3. Consider integration with CI/CD for automated migrations
4. Add logging of migration results to a central database for auditing
