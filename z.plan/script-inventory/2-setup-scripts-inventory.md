# Setup Phase Scripts Inventory

## Overview

This document provides a comprehensive inventory of all scripts in the Setup Phase of the content migration system. It details what each script is meant to do, which scripts are actually running as part of the reset-and-migrate.ps1 process, and the order in which they run.

## Core Setup Phase Script

### scripts/orchestration/phases/setup.ps1

- **Purpose**: Orchestrates the entire setup phase of the content migration system
- **Functions**:
  - `Invoke-SetupPhase`: Main entry point that orchestrates the setup phase
  - `Reset-SupabaseDatabase`: Resets Supabase database with retry logic
  - `Reset-PayloadSchema`: Drops and recreates the payload schema
  - `Run-PayloadMigrations`: Runs Payload migrations and manages UUID tables
- **Used in reset-and-migrate.ps1**: Yes - First phase of the migration process
- **Execution Order**: First phase in the content migration system

## Detailed Script Inventory

### 1. Database Reset and Schema Scripts

#### pnpm run supabase:reset (CLI command in apps/web)

- **Purpose**: Resets the Supabase database by dropping and recreating all tables
- **Called by**: `Reset-SupabaseDatabase` function in setup.ps1
- **Functionality**:
  - Drops all existing tables in the Supabase database
  - Recreates the database structure
  - Provides a clean slate for subsequent migrations
- **Used in reset-and-migrate.ps1**: Yes, via setup.ps1
- **Execution Order**: First step in the setup phase

#### supabase migration up (CLI command in apps/web)

- **Purpose**: Applies all Supabase migrations to set up the basic schema structure
- **Called by**: `Reset-SupabaseDatabase` function in setup.ps1
- **Functionality**:
  - Runs all migrations in the Supabase migrations directory
  - Establishes the core database structure needed by the web app
- **Used in reset-and-migrate.ps1**: Yes, via setup.ps1
- **Execution Order**: Runs after supabase:reset

#### SQL DROP/CREATE SCHEMA (Temporary SQL file)

- **Purpose**: SQL script that drops and recreates the payload schema
- **Called by**: `Reset-PayloadSchema` function in setup.ps1
- **Functionality**:
  - Drops the payload schema if it exists (CASCADE)
  - Creates a new empty payload schema
- **Used in reset-and-migrate.ps1**: Yes, via setup.ps1
- **Execution Order**: Runs after the Supabase migrations

#### pnpm run utils:run-sql-file (packages/content-migrations)

- **Purpose**: Utility to execute a SQL file against the database
- **Called by**: `Reset-PayloadSchema` function in setup.ps1
- **Functionality**:
  - Executes the SQL in the temporary file for dropping/recreating the payload schema
- **Used in reset-and-migrate.ps1**: Yes, via setup.ps1
- **Execution Order**: Used to execute the Schema SQL file

#### pnpm payload migrate (CLI command in apps/payload)

- **Purpose**: Runs all Payload CMS migrations to establish the collection schemas
- **Called by**: `Run-PayloadMigrations` function in setup.ps1
- **Functionality**:
  - Applies all migrations defined in the Payload CMS system
  - Creates tables for all collections (courses, lessons, quizzes, etc.)
  - Sets up relationship schemas
- **Used in reset-and-migrate.ps1**: Yes, via setup.ps1
- **Execution Order**: Runs after the payload schema is reset

### 2. Relationship Management Scripts

#### packages/content-migrations/src/scripts/sql/add-media-id-columns.ts

- **Purpose**: Adds relationship ID columns to payload_locked_documents tables
- **Called via**: `pnpm --filter @kit/content-migrations run sql:add-relationship-id-columns`
- **Functionality**:
  - Checks if the locked documents tables exist
  - Adds columns for various content types if they don't exist:
    - media_id
    - documentation_id
    - posts_id
    - surveys_id
    - survey_questions_id
    - courses_id
    - course_lessons_id
    - course_quizzes_id
    - quiz_questions_id
  - Adds foreign key constraints to maintain referential integrity
- **Used in reset-and-migrate.ps1**: Yes, via setup.ps1
- **Execution Order**: Runs after Payload migrations

### 3. UUID Table Management Scripts

#### packages/content-migrations/src/scripts/repair/database/uuid-management/cli/comprehensive.ts

- **Purpose**: Comprehensive system for managing UUID tables
- **Called via**: `pnpm run uuid:comprehensive`
- **Functionality**:
  - Runs the complete UUID table management process:
    1. Detects all UUID tables in the database
    2. Adds missing columns to each table
    3. Sets up monitoring for future UUID tables
    4. Verifies all tables have the required columns
- **Used in reset-and-migrate.ps1**: Yes, via setup.ps1
- **Execution Order**: Runs after adding relationship ID columns

#### packages/content-migrations/src/scripts/repair/database/uuid-management/repair.ts

- **Purpose**: Core implementation for repairing UUID tables
- **Called by**: comprehensive.ts
- **Functionality**:
  - Manages the repair process flow
  - Coordinates between detection, column addition, monitoring, and verification
  - Handles transaction management and error recovery
- **Used in reset-and-migrate.ps1**: Yes, indirectly via uuid:comprehensive
- **Execution Order**: Called by comprehensive.ts

#### packages/content-migrations/src/scripts/repair/database/uuid-management/detection.js

- **Purpose**: Detects all UUID pattern tables in the database
- **Called by**: repair.ts
- **Functionality**:
  - Scans database for tables with UUID pattern names
  - Returns list of tables that need to be processed
- **Used in reset-and-migrate.ps1**: Yes, indirectly via uuid:comprehensive
- **Execution Order**: First step in UUID table management

#### packages/content-migrations/src/scripts/repair/database/uuid-management/columns.js

- **Purpose**: Adds required columns to UUID tables
- **Called by**: repair.ts
- **Functionality**:
  - Adds missing columns to UUID tables
  - Focuses on columns needed for proper relationships
- **Used in reset-and-migrate.ps1**: Yes, indirectly via uuid:comprehensive
- **Execution Order**: Second step in UUID table management

#### packages/content-migrations/src/scripts/repair/database/uuid-management/monitoring.js

- **Purpose**: Sets up monitoring for future UUID tables
- **Called by**: repair.ts
- **Functionality**:
  - Creates triggers and functions to monitor table creation
  - Ensures future UUID tables get proper columns automatically
- **Used in reset-and-migrate.ps1**: Yes, indirectly via uuid:comprehensive
- **Execution Order**: Third step in UUID table management

#### packages/content-migrations/src/scripts/repair/database/uuid-management/cli/verify.ts

- **Purpose**: Verifies that all UUID tables have the required columns
- **Called via**: `pnpm run uuid:verify`
- **Functionality**:
  - Detects all UUID tables
  - Checks if each table has all required columns
  - Generates a verification report
  - Reports success or failure
- **Used in reset-and-migrate.ps1**: Yes, via setup.ps1
- **Execution Order**: Runs after comprehensive UUID table management

#### packages/content-migrations/src/scripts/repair/database/uuid-management/verification.js

- **Purpose**: Core implementation for UUID table verification
- **Called by**: verify.ts
- **Functionality**:
  - Checks each UUID table for required columns
  - Creates verification report with detailed table status
- **Used in reset-and-migrate.ps1**: Yes, indirectly via uuid:verify
- **Execution Order**: Called by verify.ts

## Execution Flow in the Setup Phase

The following is the detailed execution flow of scripts in the Setup Phase of reset-and-migrate.ps1:

1. **Initialization**

   - Import utility modules (logging.ps1, execution.ps1, verification.ps1)
   - Set up logging and execution environment

2. **Reset Supabase Database** (Reset-SupabaseDatabase)

   - Check if Supabase needs restarting
     - If needed, run `supabase stop` and `supabase start`
   - Run `pnpm run supabase:reset` with retry logic for transient errors
     - If retry needed, restart Supabase and try again with debug flag
   - Run `supabase migration up` to apply Supabase migrations
   - Verify public schema exists

3. **Reset Payload Schema** (Reset-PayloadSchema)

   - Generate SQL for dropping and recreating payload schema
   - Write SQL to a temporary file
   - Execute SQL using `pnpm run utils:run-sql-file`
   - Remove temporary file

4. **Run Payload Migrations** (Run-PayloadMigrations)
   - Check migration status: `pnpm migrate:status`
   - Run all migrations: `pnpm payload migrate`
   - Add relationship ID columns:
     - Change to root directory
     - Run `pnpm --filter @kit/content-migrations run sql:add-relationship-id-columns`
       - For each table (payload_locked_documents and payload_locked_documents_rels):
         - Check if table exists
         - Add columns for various content types if missing
   - Manage UUID tables:
     - Run `pnpm run uuid:comprehensive`
       - Detect all UUID tables
       - Add missing columns
       - Set up monitoring
       - Verify tables after repair
     - Run `pnpm run uuid:verify`
       - Detect all UUID tables
       - Get verification report
       - Report success/failure
   - Verify migration status: `pnpm migrate:status`
   - Verify payload schema and required tables exist

## Flow Diagram

```
┌─────────────────────────────┐
│ Setup Phase Orchestration   │
└───────────────┬─────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
┌─────────────────┐  ┌─────────────────┐
│Reset Supabase DB│  │Reset Payload    │
└───────┬─────────┘  │Schema           │
        │            └────────┬────────┘
        ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│pnpm run         │  │Generate SQL     │
│supabase:reset   │  │DROP/CREATE      │
└───────┬─────────┘  └────────┬────────┘
        │                    ▼
        ▼            ┌─────────────────┐
┌─────────────────┐  │pnpm run         │
│supabase         │  │utils:run-sql-file│
│migration up     │  └────────┬────────┘
└───────┬─────────┘          │
        │            ┌────────▼────────┐
        ▼            │Run Payload      │
┌─────────────────┐  │Migrations       │
│Verify Schema    │  └────────┬────────┘
└─────────────────┘          │
                             ▼
                    ┌─────────────────┐
                    │pnpm payload     │
                    │migrate          │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │Add Relationship │
                    │ID Columns       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │Manage UUID      │
                    │Tables           │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │Verify Migration │
                    │Status           │
                    └─────────────────┘
```

## Summary

The Setup Phase is the foundational first phase of the content migration system. It:

1. Resets the database environment to ensure a clean state
2. Creates and configures the necessary schemas
3. Runs migrations to set up the table structure
4. Adds required columns for relationships
5. Implements robust UUID table management
6. Verifies that everything is correctly set up

This phase ensures that the database is in the correct state before content processing and loading begin in subsequent phases. The scripts are organized in a logical sequence that handles dependencies appropriately, with error handling and verification at critical points.
