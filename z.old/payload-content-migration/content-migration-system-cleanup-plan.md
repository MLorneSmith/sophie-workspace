# Content Migration System Cleanup Plan

## System Overview

The content migration system consists of several key components working together to properly migrate content for the Payload CMS integration with our Makerkit-based Next.js 15 app. The migration process is orchestrated by `reset-and-migrate.ps1` and divided into distinct phases.

### Core Components

1. **Main Orchestration Script**: `reset-and-migrate.ps1`

   - Manages the overall migration process
   - Divided into Setup, Processing, Loading, and Post-Verification phases
   - Uses PowerShell modules from `scripts/orchestration/`

2. **PowerShell Orchestration Modules**:

   - **Utils** (`scripts/orchestration/utils/`):
     - Path management, logging, execution, verification, Supabase utilities
   - **Phases** (`scripts/orchestration/phases/`):
     - Setup: Resets databases and runs initial migrations
     - Processing: Processes raw data and generates SQL files
     - Loading: Loads content and fixes relationships

3. **Content Migrations Package** (`packages/content-migrations/`):
   - Contains specialized TypeScript scripts for migration tasks
   - Structured into subdirectories for different migration concerns
   - Contains both raw data and processed output

### Migration Process Flow

1. **Setup Phase**:

   - Reset Supabase database and run Web app migrations
   - Reset Payload schema
   - Run Payload migrations

2. **Processing Phase**:

   - Process raw data
   - Generate SQL seed files
   - Fix quiz ID consistency
   - Fix references to ensure consistency

3. **Loading Phase**:

   - Run content migrations via Payload migrations
   - Run specialized blog post migration
   - Run specialized private posts migration
   - Import downloads from R2 bucket
   - Fix relationships
   - Verify database state
   - Create certificates storage bucket

4. **Post-Verification**:
   - Verify posts content integrity

## Identified Orphaned Files

After reviewing the code structure and execution paths, the following files appear to be orphaned or no longer part of the active migration system:

### 1. Duplicate JavaScript Files (superseded by TypeScript versions)

- `packages/content-migrations/src/data/download-id-map.js`
- `packages/content-migrations/src/data/mappings/lesson-downloads-mappings.js`
- `packages/content-migrations/src/utils/get-env-vars.js`
- `packages/content-migrations/src/utils/payload-client.js`

### 2. Redundant Core Scripts

- `packages/content-migrations/src/scripts/core/migrate-all-direct-fixed.ts`
  - Likely replaced by individual migration scripts called directly from the loading phase

### 3. Outdated SQL Generation Scripts

- `packages/content-migrations/src/scripts/sql/new-generate-sql-seed-files.ts`
  - Superseded by `updated-generate-sql-seed-files.ts` which is called in the process phase

### 4. Redundant Repair Scripts

- `packages/content-migrations/src/scripts/repair/repair-edge-cases.ts`
  - Duplicates functionality in `fix-edge-cases.ts` which is used in the repair:edge-cases script

### 5. Duplicate Raw Data

- `packages/content-migrations/src/data/raw/quizzes/`
  - Appears to duplicate content from `raw/courses/quizzes/` which is the primary source used in processing

### 6. Test/Development Scripts

These scripts appear to be for testing and development purposes and are not part of the main migration flow:

- `packages/content-migrations/src/scripts/analyze-lesson-content.ts`
- `packages/content-migrations/src/scripts/test-lesson-enhancements.ts`
- `packages/content-migrations/src/scripts/test-yaml-lesson-generation.ts`
- `packages/content-migrations/src/scripts/integrate-yaml-generator.ts`

## Reorganization Opportunities

### 1. Script Naming Standardization

Current script naming is inconsistent across different directories. Standardize the naming conventions:

- `fix-*`: Scripts that repair or correct data issues
- `verify-*`: Scripts that verify data integrity
- `migrate-*`: Scripts that perform actual migrations
- `generate-*`: Scripts that generate output files
- `process-*`: Scripts that transform raw data

### 2. Directory Structure Improvements

#### Current Structure Issues:

- Unclear boundaries between similar directories (verification/validation)
- Script categorization doesn't always reflect their function
- Lack of clear hierarchy for execution order

#### Proposed Structure:

```
packages/content-migrations/src/
├─ data/
│  ├─ raw/              # Raw input data
│  ├─ definitions/      # Schema definitions
│  ├─ mappings/         # ID and field mappings
│  └─ processed/        # Processed output (JSON and SQL)
│
├─ scripts/
│  ├─ setup/            # Scripts run in the setup phase
│  ├─ processing/       # Scripts run in the processing phase
│  │  ├─ raw-data/      # Process raw data
│  │  └─ sql/           # Generate SQL files
│  ├─ loading/          # Scripts run in the loading phase
│  │  ├─ migration/     # Core migration scripts
│  │  ├─ import/        # Import scripts for external data
│  │  └─ repair/        # Relationship and data fixes
│  └─ verification/     # All verification scripts
│
├─ utils/               # Utility functions
│  ├─ db/               # Database utilities
│  ├─ file/             # File system utilities
│  └─ payload/          # Payload-specific utilities
│
└─ types/               # TypeScript types
```

### 3. Consolidation of Similar Functionality

1. **Merge Validation and Verification**:

   - Combine `src/scripts/validation` and `src/scripts/verification` since they both validate data integrity

2. **Consolidate Repair Scripts**:

   - Group all repair scripts in a single directory with clear naming

3. **Unify SQL Generation**:
   - Have a single approach to SQL generation (currently multiple scripts with similar purposes)

### 4. Documentation Improvements

1. **Add README files**:

   - Each major directory should include a README explaining:
     - Purpose of scripts in that directory
     - When they are used in the migration process
     - Dependencies and prerequisites

2. **Script Headers**:
   - Each script should include a standardized header comment:
     - Purpose
     - Input and output
     - Dependencies
     - Usage in the migration process

## Implementation Plan

### Phase 1: Cleanup of Clear Duplicates

1. Remove JavaScript files that have TypeScript equivalents:

   - `download-id-map.js`
   - `lesson-downloads-mappings.js`
   - `get-env-vars.js`
   - `payload-client.js`

2. Remove the duplicate quiz files directory if confirmed it's not used

### Phase 2: Address Unused Scripts

1. Identify and document scripts not in the execution path of `reset-and-migrate.ps1`
2. Move development/testing scripts to a dedicated `dev` directory
3. Archive unused scripts to a temporary `archive` directory for validation before removal

### Phase 3: Structural Reorganization

1. Implement the new directory structure
2. Standardize script naming conventions
3. Update import paths and dependencies
4. Update package.json script references

### Phase 4: Documentation and Verification

1. Add README files to each directory
2. Add header comments to each script
3. Run full migration to verify no functionality is lost
4. Create a migration system diagram for documentation

## Testing Strategy

For each phase of implementation:

1. Create a backup branch before making changes
2. Run full migration test after each set of changes
3. Compare database state before and after changes
4. Check for any regressions in migration functionality

## Conclusion

This cleanup and reorganization plan will result in a more maintainable, better-documented content migration system. By removing orphaned files, standardizing naming, and improving the directory structure, the system will be easier to understand and extend.

The phased approach ensures that we can make incremental improvements while maintaining system integrity throughout the process.
