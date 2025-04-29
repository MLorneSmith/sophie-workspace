# Content Migration System Script Inventory

## Overview

This document provides a comprehensive inventory of all scripts in the `scripts/orchestration` directory and its subdirectories. It details what each script is meant to do, which scripts are part of the reset-and-migrate.ps1 content migration process, and the order in which they run.

## Main Orchestration Script

### reset-and-migrate.ps1

- **Purpose**: Main entry point that orchestrates the entire content migration process
- **Organization**: Follows a modular structure with distinct phases
- **Phases**:
  1. SETUP PHASE: Resets databases and initializes schemas
  2. PROCESSING PHASE: Processes raw data and generates SQL files
  3. LOADING PHASE: Loads content and fixes relationships
  4. POST-VERIFICATION PHASE: Verifies specific collections and content integrity
- **Parameters**:
  - `-ForceRegenerate`: Forces regeneration of data even if it exists
  - `-SkipVerification`: Skips verification steps

## Phase Scripts Inventory

### 1. Setup Phase (scripts/orchestration/phases/setup.ps1)

- **Purpose**: Handles database reset and initial schema creation
- **Functions**:
  - `Invoke-SetupPhase`: Orchestrates the setup phase
  - `Reset-SupabaseDatabase`: Resets Supabase database with retry logic
  - `Reset-PayloadSchema`: Drops and recreates the payload schema
  - `Run-PayloadMigrations`: Runs Payload migrations and UUID table management
- **Used in reset-and-migrate.ps1**: Yes - First phase

### 2. Processing Phase (scripts/orchestration/phases/processing.ps1)

- **Purpose**: Handles data processing and SQL generation
- **Functions**:
  - `Invoke-ProcessingPhase`: Orchestrates the processing phase
  - `Process-RawData`: Processes raw content data (with regeneration option)
  - `Generate-SqlSeedFiles`: Generates SQL seed files using YAML approach
  - `Fix-References`: Ensures consistency in relationships between content items
- **Used in reset-and-migrate.ps1**: Yes - Second phase

### 3. Loading Phase (scripts/orchestration/phases/loading.ps1)

- **Purpose**: Handles content migration and database verification
- **Functions**:
  - `Invoke-LoadingPhase`: Orchestrates the loading phase
  - `Run-ContentMigrations`: Runs content migrations via Payload
  - `Migrate-BlogPosts`: Specialized migration for blog posts
  - `Migrate-PrivatePosts`: Specialized migration for private posts
  - `Fix-UuidTables`: Ensures UUID tables have required columns
  - `Import-Downloads`: Imports downloads from R2 bucket
  - `Fix-Relationships`: Comprehensive relationship repair system
  - `Fix-S3StorageIssues`: Fixes S3 storage issues
  - `Verify-DatabaseState`: Performs verification of database
  - `Create-CertificatesBucket`: Creates certificates storage bucket
- **Used in reset-and-migrate.ps1**: Yes - Third phase

### 4. Fallback & Relationship Repair Scripts

- **scripts/orchestration/phases/fallbacks.ps1**:
  - **Purpose**: Provides fallback strategies for when primary approaches fail
  - **Used in reset-and-migrate.ps1**: No - Not directly imported, possibly used internally by other scripts
- **scripts/orchestration/phases/fallbacks.ps1.fixed**:
  - **Purpose**: Fixed version of fallbacks script
  - **Used in reset-and-migrate.ps1**: No - Appears to be a backup/fixed version
- **scripts/orchestration/phases/fallbacks.ps1.fixed2**:
  - **Purpose**: Second fixed version of fallbacks script
  - **Used in reset-and-migrate.ps1**: No - Appears to be a backup/fixed version
- **scripts/orchestration/phases/relationship-repair.ps1**:
  - **Purpose**: Standard relationship repair system
  - **Used in reset-and-migrate.ps1**: Yes - Imported by loading.ps1 and used in the Fix-Relationships function
- **scripts/orchestration/phases/relationship-repair-simplified.ps1**:
  - **Purpose**: Simplified version of relationship repair
  - **Used in reset-and-migrate.ps1**: Yes - Imported by loading.ps1 as a fallback if standard repair fails

## Utility Scripts Inventory

### Core Utility Scripts

- **scripts/orchestration/utils/path-management.ps1**:

  - **Purpose**: Directory navigation functions
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/logging.ps1**:

  - **Purpose**: Basic logging functionality
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/enhanced-logging.ps1**:

  - **Purpose**: Advanced logging with formatting
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/execution.ps1**:

  - **Purpose**: Command execution utilities
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/verification.ps1**:

  - **Purpose**: Database verification functions
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/diagnostic.ps1**:

  - **Purpose**: Diagnostic tools
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/configuration.ps1**:

  - **Purpose**: System configuration functions
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/performance-logging.ps1**:

  - **Purpose**: Performance measurement
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/sql-error-logging.ps1**:

  - **Purpose**: SQL error logging and handling
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/supabase.ps1**:

  - **Purpose**: Supabase-specific utilities
  - **Used in reset-and-migrate.ps1**: No - Not directly imported, but imported by loading.ps1

- **scripts/orchestration/utils/remote-config.ps1**:
  - **Purpose**: Remote configuration management
  - **Used in reset-and-migrate.ps1**: No - Not directly imported or used

### Dependency Management Scripts

- **scripts/orchestration/utils/dependency-graph.ps1**:

  - **Purpose**: Dependency graph management
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/verification-dependencies.ps1**:

  - **Purpose**: Basic verification dependency handling
  - **Used in reset-and-migrate.ps1**: No - Not directly imported, but imported by loading.ps1

- **scripts/orchestration/utils/verification-dependencies-improved.ps1**:

  - **Purpose**: Improved verification dependency handling
  - **Used in reset-and-migrate.ps1**: Yes - Imported directly

- **scripts/orchestration/utils/test-verification-dependencies.ps1**:
  - **Purpose**: Testing verification dependencies
  - **Used in reset-and-migrate.ps1**: No - Not directly imported or used

### Dependency System Directory

- **scripts/orchestration/utils/dependency-system/verification-dependencies-core.ps1**:

  - **Purpose**: Core dependency system
  - **Used in reset-and-migrate.ps1**: No - Not directly imported, likely used by other dependency modules

- **scripts/orchestration/utils/dependency-system/verification-dependencies-execution.ps1**:

  - **Purpose**: Execution handling
  - **Used in reset-and-migrate.ps1**: No - Not directly imported, likely used by other dependency modules

- **scripts/orchestration/utils/dependency-system/verification-dependencies-graph.ps1**:

  - **Purpose**: Dependency graph processing
  - **Used in reset-and-migrate.ps1**: No - Not directly imported, likely used by other dependency modules

- **scripts/orchestration/utils/dependency-system/verification-dependencies-optimized.ps1**:

  - **Purpose**: Optimized dependency system
  - **Used in reset-and-migrate.ps1**: No - Not directly imported, likely used by other dependency modules

- **scripts/orchestration/utils/dependency-system/verification-dependencies-validation.ps1**:

  - **Purpose**: Validation functionality
  - **Used in reset-and-migrate.ps1**: No - Not directly imported, likely used by other dependency modules

- **scripts/orchestration/utils/dependency-system/verification-dependencies-visualization.ps1**:

  - **Purpose**: Visualization tools
  - **Used in reset-and-migrate.ps1**: No - Not directly imported, likely used by other dependency modules

- **scripts/orchestration/utils/dependency-system/test-dependencies.ps1**:
  - **Purpose**: Testing tools for dependency system
  - **Used in reset-and-migrate.ps1**: No - Not directly imported or used

### Remote Testing

- **scripts/orchestration/remote-test/test-remote-connection.ps1**:
  - **Purpose**: Tests remote connections
  - **Used in reset-and-migrate.ps1**: No - Not directly imported or used

### Special Scripts

- **scripts/orchestration/use-fixed-verification.ps1**:
  - **Purpose**: Uses fixed verification approach
  - **Used in reset-and-migrate.ps1**: No - Not directly imported or used

## Execution Order in reset-and-migrate.ps1

The following is the execution order of scripts that are actually run as part of reset-and-migrate.ps1:

1. **Initialization**

   - Import utility modules (path-management, logging, enhanced-logging, execution, verification, etc.)
   - Initialize logging and environment
   - Move PNPM configuration

2. **SETUP PHASE**

   - Reset Supabase database
   - Reset Payload schema
   - Run Payload migrations
   - Add relationship ID columns to payload_locked_documents tables
   - Fix UUID tables

3. **PROCESSING PHASE**

   - Process raw data (with regeneration option)
   - Ensure lesson metadata YAML exists and is up to date
   - Parse lesson HTML todo content
   - Generate SQL seed files using YAML-based approach
   - Fix quiz ID consistency issues
   - Fix references between content items

4. **LOADING PHASE**

   - Run content migrations via Payload
   - Migrate blog posts with specialized script
   - Migrate private posts with specialized script
   - Fix UUID tables to ensure columns exist
   - Import downloads from R2 bucket
   - Fix relationships with comprehensive repair system
   - Fix S3 storage issues
   - Create certificates storage bucket

5. **POST-VERIFICATION PHASE** (if not skipped)

   - Verify posts content integrity with dependency management

6. **Finalization**
   - Show performance report
   - Show diagnostic summary

## Scripts Not Included in reset-and-migrate.ps1

The following orchestration scripts exist but are not directly called in the reset-and-migrate.ps1 process:

1. **scripts/orchestration/use-fixed-verification.ps1**

   - Not directly included in reset-and-migrate.ps1
   - Likely used as an alternative verification approach for troubleshooting

2. **Fallback scripts**

   - fallbacks.ps1, fallbacks.ps1.fixed, fallbacks.ps1.fixed2
   - These appear to be alternative versions of fallback strategies
   - Not directly imported in reset-and-migrate.ps1

3. **Most scripts in dependency-system directory**

   - While verification-dependencies-improved.ps1 is used, many of the specialized scripts in the dependency-system directory are not directly imported
   - Likely used by the improved dependencies script or for specialized debugging

4. **Remote testing scripts**

   - scripts/orchestration/remote-test/test-remote-connection.ps1
   - Used for testing remote connections but not part of the main migration flow

5. **Utility scripts**
   - remote-config.ps1
   - test-verification-dependencies.ps1
   - Not directly imported in reset-and-migrate.ps1

## Summary

The content migration system uses a well-structured modular approach with clear separation of concerns:

1. **Core Script**: reset-and-migrate.ps1 serves as the main orchestration script
2. **Phase Scripts**: setup.ps1, processing.ps1, and loading.ps1 handle specific phases of the migration process
3. **Utility Scripts**: Various utilities for logging, execution, verification, and dependency management
4. **Relationship Repair**: Specialized scripts for fixing relationship issues in the database

The execution flow follows a clear sequential pattern from setup to processing to loading to verification, with each phase building on the previous one. Scripts that are not directly included in reset-and-migrate.ps1 appear to be alternative implementations, testing tools, or specialized utilities used during development and debugging.
