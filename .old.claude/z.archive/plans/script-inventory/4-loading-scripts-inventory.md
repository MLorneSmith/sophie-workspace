# Loading Phase Scripts Inventory

## Overview

This document provides a comprehensive inventory of all scripts in the Loading Phase of the content migration system. It details what each script is meant to do, which scripts are actually running as part of the reset-and-migrate.ps1 process, and the order in which they run.

## Core Loading Phase Script

### scripts/orchestration/phases/loading.ps1

- **Purpose**: Orchestrates the entire loading phase of the content migration system
- **Functions**:
  - `Invoke-LoadingPhase`: Main entry point that orchestrates the loading phase
  - `Run-ContentMigrations`: Runs content migrations via Payload migrations
  - `Migrate-BlogPosts`: Specialized migration for blog posts
  - `Migrate-PrivatePosts`: Specialized migration for private posts
  - `Fix-UuidTables`: Ensures UUID tables have required columns
  - `Import-Downloads`: Imports downloads from R2 bucket
  - `Fix-Relationships`: Comprehensive relationship repair system
  - `Fix-S3StorageIssues`: Fixes S3 storage issues
  - `Verify-DatabaseState`: Performs verification of database
  - `Create-CertificatesBucket`: Creates certificates storage bucket
- **Used in reset-and-migrate.ps1**: Yes - Third phase of the migration process
- **Execution Order**: Third phase in the content migration system

## Detailed Script Inventory

### 1. Content Migration Scripts

#### pnpm payload migrate (CLI command in apps/payload)

- **Purpose**: Runs Payload migrations to populate the database with content
- **Called by**: `Run-ContentMigrations` function in loading.ps1
- **Functionality**:
  - Executes all content migrations defined in Payload CMS
  - Populates the database with initial content
  - Sets up relationships between content items
- **Used in reset-and-migrate.ps1**: Yes, via Run-ContentMigrations function
- **Execution Order**: First step in the loading phase

#### packages/content-migrations/src/scripts/verification/todo-fields.ts

- **Purpose**: Verifies todo fields in lessons
- **Called via**: `pnpm run verify:todo-fields`
- **Functionality**:
  - Checks if todo fields are properly formatted
  - Validates that the structure matches what's expected by the UI
  - Ensures proper Lexical format
- **Used in reset-and-migrate.ps1**: Yes, via Run-ContentMigrations function
- **Execution Order**: Runs after Payload migrations

#### packages/content-migrations/src/scripts/sql/verify-schema.ts

- **Purpose**: Basic verification of database schema
- **Called via**: `pnpm run sql:verify-schema`
- **Functionality**:
  - Verifies that all required tables exist
  - Checks for required columns in tables
  - Ensures proper data types are used
- **Used in reset-and-migrate.ps1**: Yes, via Run-ContentMigrations function
- **Execution Order**: Runs after todo fields verification

### 2. Blog and Private Post Migration Scripts

#### packages/content-migrations/src/scripts/migrate/posts-direct.ts

- **Purpose**: Specialized migration for blog posts
- **Called via**: `pnpm run migrate:posts-direct`
- **Functionality**:
  - Migrates blog posts with complete content
  - Handles Markdown-to-Lexical conversion
  - Sets up post image relationships
  - Reports on success/failure
- **Used in reset-and-migrate.ps1**: Yes, via Migrate-BlogPosts function
- **Execution Order**: Runs in parallel with other specialized migrations

#### packages/content-migrations/src/scripts/migrate/private-direct.ts

- **Purpose**: Specialized migration for private posts
- **Called via**: `pnpm run migrate:private-direct`
- **Functionality**:
  - Migrates private posts with complete content
  - Handles Markdown-to-Lexical conversion
  - Sets up post image relationships
  - Reports on success/failure
- **Used in reset-and-migrate.ps1**: Yes, via Migrate-PrivatePosts function
- **Execution Order**: Runs in parallel with other specialized migrations

### 3. UUID Table Management Scripts

#### packages/content-migrations/src/scripts/repair/uuid/fix-critical-columns.ts

- **Purpose**: Fixes critical columns in UUID tables
- **Called via**: `pnpm run uuid:fix-critical-columns`
- **Functionality**:
  - Adds critical columns to UUID tables
  - Ensures columns needed for relationships exist
- **Used in reset-and-migrate.ps1**: Yes, via Fix-UuidTables function
- **Execution Order**: First step in UUID table management

#### packages/content-migrations/src/scripts/repair/uuid/ensure-env.ts

- **Purpose**: Ensures environment variables for UUID tables
- **Called via**: `pnpm run uuid:ensure-env`
- **Functionality**:
  - Sets up environment variables needed for UUID table management
  - Verifies configuration is correct
- **Used in reset-and-migrate.ps1**: Yes, via Fix-UuidTables function
- **Execution Order**: Second step in UUID table management

#### packages/content-migrations/src/scripts/repair/uuid/fix-critical-columns-safe.ts

- **Purpose**: Safer version of critical columns fix
- **Called via**: `pnpm run uuid:fix-critical-columns-safe`
- **Functionality**:
  - Adds critical columns to UUID tables with improved safety checks
  - Uses transaction management for reliability
- **Used in reset-and-migrate.ps1**: Yes, via Fix-UuidTables function
- **Execution Order**: Third step in UUID table management

#### packages/content-migrations/src/scripts/repair/uuid/verify-critical-columns.ts

- **Purpose**: Verifies critical columns in UUID tables
- **Called via**: `pnpm run uuid:verify-critical-columns`
- **Functionality**:
  - Checks if critical columns were added properly
  - Reports on any missing columns
- **Used in reset-and-migrate.ps1**: Yes, via Fix-UuidTables function
- **Execution Order**: Fourth step in UUID table management

#### packages/content-migrations/src/scripts/repair/database/uuid-tables.ts

- **Purpose**: Comprehensive UUID table fix script
- **Called via**: `pnpm run fix:uuid-tables`
- **Functionality**:
  - Adds all columns to UUID tables
  - More comprehensive than critical columns fix
- **Used in reset-and-migrate.ps1**: Yes, via Fix-UuidTables function
- **Execution Order**: Fifth step in UUID table management

#### packages/content-migrations/src/scripts/verification/uuid-tables-fixed.ts

- **Purpose**: Enhanced verification for UUID tables
- **Called via**: `pnpm run uuid:verify:fixed`
- **Functionality**:
  - Uses enhanced detection for UUID tables
  - Verifies all columns are present
- **Used in reset-and-migrate.ps1**: Yes, via Fix-UuidTables function
- **Execution Order**: Sixth step in UUID table management

#### packages/content-migrations/src/scripts/repair/relationship-columns.ts

- **Purpose**: Fixes relationship columns
- **Called via**: `pnpm run repair:relationship-columns`
- **Functionality**:
  - Adds columns specifically for relationships
  - Ensures relationship tables have required columns
- **Used in reset-and-migrate.ps1**: Yes, via Fix-UuidTables function
- **Execution Order**: Seventh step in UUID table management

#### packages/content-migrations/src/scripts/verification/relationship-columns.ts

- **Purpose**: Verifies relationship columns
- **Called via**: `pnpm run verify:relationship-columns`
- **Functionality**:
  - Checks if relationship columns were added properly
  - Reports on any missing columns
- **Used in reset-and-migrate.ps1**: Yes, via Fix-UuidTables function
- **Execution Order**: Final step in UUID table management

### 4. Download Management Scripts

#### packages/content-migrations/src/scripts/import/downloads.ts

- **Purpose**: Imports downloads from R2 bucket
- **Called via**: `pnpm run import:downloads`
- **Functionality**:
  - Fetches download files from R2 bucket
  - Updates download records with proper metadata
  - Links downloads to appropriate content items
- **Used in reset-and-migrate.ps1**: Yes, via Import-Downloads function
- **Execution Order**: Runs after UUID table management

### 5. Relationship Repair Scripts

#### packages/content-migrations/src/scripts/repair/edge-cases.ts

- **Purpose**: Repairs edge case relationship issues
- **Called via**: `pnpm run repair:edge-cases`
- **Functionality**:
  - Fixes special case relationship problems
  - Handles unusual data patterns
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: First step in relationship fixing

#### packages/content-migrations/src/scripts/repair/payload-relationships-strict.ts

- **Purpose**: Fixes Payload relationships with strict typing
- **Called via**: `pnpm run fix:payload-relationships-strict`
- **Functionality**:
  - Ensures type consistency in relationships
  - Uses strict typing for all relationships
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Second step in relationship fixing

#### packages/content-migrations/src/scripts/repair/quiz/corrected.ts

- **Purpose**: Optimized quiz relationship repair
- **Called via**: `pnpm run quiz:fix:corrected`
- **Functionality**:
  - Uses optimized approach for quiz relationships
  - Fixes quiz-specific relationship issues
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Third step in relationship fixing

#### packages/content-migrations/src/scripts/diagnostic/quiz-relationships.ts

- **Purpose**: Diagnoses quiz relationship issues
- **Called via**: `pnpm run diagnostic:quiz-relationships`
- **Functionality**:
  - Checks current state of quiz relationships
  - Identifies specific issues to fix
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function (called twice)
- **Execution Order**: Fourth step in relationship fixing (and again later)

#### packages/content-migrations/src/scripts/repair/bidirectional-quiz-relationships.ts

- **Purpose**: Fixes bidirectional quiz relationships
- **Called via**: `pnpm run fix:bidirectional-quiz-relationships`
- **Functionality**:
  - Ensures relationships are correctly set in both directions
  - Aligns with schema expectations
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Fifth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/quiz-paths-and-relationships.ts

- **Purpose**: Combined quiz paths and relationships fix
- **Called via**: `pnpm run fix:quiz-paths-and-relationships`
- **Functionality**:
  - Fixes both paths and relationships in one operation
  - Ensures consistency between paths and relationships
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Sixth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/enhanced-quiz-paths-and-relationships.ts

- **Purpose**: Enhanced quiz paths and relationships fix
- **Called via**: `pnpm run fix:enhanced-quiz-paths-and-relationships`
- **Functionality**:
  - Improved version of combined paths and relationships fix
  - More comprehensive and reliable
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Seventh step in relationship fixing

#### Direct SQL Update for Field Names

- **Purpose**: Fixes wrong field names in quiz_questions_rels
- **Called via**: `pnpm run utils:run-sql`
- **Functionality**:
  - Updates field names to 'quiz_id' when incorrect
  - Direct SQL execution to fix specific issues
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Eighth step in relationship fixing

#### packages/content-migrations/src/scripts/verification/quiz-relationship-migration.ts

- **Purpose**: Verifies bidirectional quiz relationships
- **Called via**: `pnpm run verify:quiz-relationship-migration`
- **Functionality**:
  - Standard verification for quiz relationships
  - Checks that relationships are properly bidirectional
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Ninth step in relationship fixing

#### packages/content-migrations/src/scripts/verification/comprehensive-quiz-relationships.ts

- **Purpose**: Comprehensive quiz relationship verification
- **Called via**: `pnpm run verify:comprehensive-quiz-relationships`
- **Functionality**:
  - More thorough verification of quiz relationships
  - Checks multiple aspects of relationship integrity
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Tenth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/questions-jsonb-comprehensive.ts

- **Purpose**: Comprehensive JSONB formatter for quiz questions
- **Called via**: `pnpm run fix:questions-jsonb-comprehensive`
- **Functionality**:
  - Formats quiz questions JSONB arrays for Payload compatibility
  - Ensures proper structure for UI display
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Eleventh step in relationship fixing (with fallbacks)

#### packages/content-migrations/src/scripts/repair/format-questions-jsonb-drizzle.ts

- **Purpose**: Formats quiz questions JSONB using Drizzle
- **Called via**: `pnpm run fix:format-questions-jsonb-drizzle`
- **Functionality**:
  - Alternative approach using Drizzle ORM
  - Used as fallback if comprehensive fix fails
- **Used in reset-and-migrate.ps1**: Conditional fallback in Fix-Relationships function
- **Execution Order**: Fallback if comprehensive JSONB fix fails

#### packages/content-migrations/src/scripts/repair/format-questions-jsonb-direct.ts

- **Purpose**: Direct approach to JSONB formatting
- **Called via**: `pnpm run fix:format-questions-jsonb-direct`
- **Functionality**:
  - Most direct approach to fixing JSONB format
  - Secondary fallback option
- **Used in reset-and-migrate.ps1**: Conditional secondary fallback in Fix-Relationships function
- **Execution Order**: Second fallback if other JSONB formats fail

#### packages/content-migrations/src/scripts/verification/questions-jsonb-format.ts

- **Purpose**: Verifies questions JSONB format
- **Called via**: `pnpm run verify:questions-jsonb-format`
- **Functionality**:
  - Checks if quiz questions JSONB is properly formatted
  - Reports on formatting issues
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twelfth step in relationship fixing

#### packages/content-migrations/src/scripts/verification/unidirectional-quiz-questions.ts

- **Purpose**: Verifies unidirectional quiz-question relationships
- **Called via**: `pnpm run verify:unidirectional-quiz-questions`
- **Functionality**:
  - Legacy verification approach
  - Checks single-direction relationships
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Thirteenth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/survey-questions-population.ts

- **Purpose**: Fixes survey questions population
- **Called via**: `pnpm run fix:survey-questions-population`
- **Functionality**:
  - Ensures survey questions are properly populated
  - Fixes any issues with survey question relationships
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Fourteenth step in relationship fixing

#### packages/content-migrations/src/scripts/sql/ensure-todo-column.ts

- **Purpose**: Ensures todo column exists in course_lessons table
- **Called via**: `pnpm run sql:ensure-todo-column`
- **Functionality**:
  - Adds todo column if it doesn't exist
  - Sets up proper data type for the column
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Fifteenth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/todo-fields.ts

- **Purpose**: Fixes todo fields in course_lessons table
- **Called via**: `pnpm run fix:todo-fields`
- **Functionality**:
  - Updates todo fields to correct format
  - Ensures data is properly structured
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Sixteenth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/lexical-format.ts

- **Purpose**: Fixes Lexical format in todo fields
- **Called via**: `pnpm run fix:lexical-format`
- **Functionality**:
  - Ensures Lexical format is correct in todo fields
  - Standardizes format across all records
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Seventeenth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/post-lexical-format.ts

- **Purpose**: Fixes Lexical format in posts and private posts
- **Called via**: `pnpm run fix:post-lexical-format`
- **Functionality**:
  - Applies Lexical format fixes to post content
  - Ensures consistency across posts and private posts
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Eighteenth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/all-lexical-fields.ts

- **Purpose**: Fixes all Lexical fields across all collections
- **Called via**: `pnpm run fix:all-lexical-fields`
- **Functionality**:
  - Comprehensive fix for all Lexical fields
  - Ensures consistent format across the entire database
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Nineteenth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/bunny-video-ids.ts

- **Purpose**: Fixes bunny_video_id fields in course_lessons table
- **Called via**: `pnpm run fix:bunny-video-ids`
- **Functionality**:
  - Updates bunny video IDs to correct format
  - Ensures proper links to video content
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twentieth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/post-image-relationships.ts

- **Purpose**: Fixes post image relationships
- **Called via**: `pnpm run fix:post-image-relationships`
- **Functionality**:
  - Ensures posts are correctly linked to images
  - Fixes relationship tables for post images
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twenty-first step in relationship fixing

#### packages/content-migrations/src/scripts/repair/downloads-relationships.ts

- **Purpose**: Fixes downloads relationships and URLs
- **Called via**: `pnpm run fix:downloads-relationships`
- **Functionality**:
  - Updates download relationships to correct format
  - Updates URLs to use custom domain
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twenty-second step in relationship fixing

#### packages/content-migrations/src/scripts/repair/downloads-r2-integration.ts

- **Purpose**: Fixes downloads R2 integration
- **Called via**: `pnpm run fix:downloads-r2-integration`
- **Functionality**:
  - Ensures proper integration with R2 storage
  - Sets up correct path handling
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twenty-third step in relationship fixing

#### packages/content-migrations/src/scripts/repair/downloads-metadata.ts

- **Purpose**: Fixes downloads metadata
- **Called via**: `pnpm run fix:downloads-metadata`
- **Functionality**:
  - Updates metadata with correct column names
  - Adds thumbnail information
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twenty-fourth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/download-r2-urls.ts

- **Purpose**: Fixes download R2 URLs
- **Called via**: `pnpm run fix:download-r2-urls`
- **Functionality**:
  - Updates URLs to use proper CDN links
  - Ensures correct format for accessing files
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twenty-fifth step in relationship fixing

#### packages/content-migrations/src/scripts/repair/download-r2-mappings.ts

- **Purpose**: Fixes download R2 mappings
- **Called via**: `pnpm run fix:download-r2-mappings`
- **Functionality**:
  - Updates mappings for placeholder files
  - Ensures correct file references
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twenty-sixth step in relationship fixing

#### packages/content-migrations/src/scripts/clear/lesson-content.ts

- **Purpose**: Clears lesson content fields
- **Called via**: `pnpm run clear:lesson-content`
- **Functionality**:
  - Clears content to fix template tag rendering issues
  - Prepares for proper content rendering
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twenty-seventh step in relationship fixing

#### scripts/orchestration/phases/relationship-repair.ps1

- **Purpose**: Comprehensive relationship repair system
- **Called via**: `Invoke-RelationshipRepair` function
- **Functionality**:
  - Detects, repairs, and verifies all relationships
  - Uses standard relationship repair approach
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Twenty-eighth step in relationship fixing

#### scripts/orchestration/phases/relationship-repair-simplified.ps1

- **Purpose**: Simplified relationship repair system
- **Called via**: `Invoke-SimplifiedRelationshipRepair` function
- **Functionality**:
  - Fallback if standard repair fails
  - Uses simpler approach for reliability
- **Used in reset-and-migrate.ps1**: Conditional fallback in Fix-Relationships function
- **Execution Order**: Fallback if standard relationship repair fails

#### packages/content-migrations/src/scripts/verification/all.ts

- **Purpose**: Final verification of all aspects
- **Called via**: `pnpm run verify:all`
- **Functionality**:
  - Runs all verification scripts
  - Final check of database integrity
- **Used in reset-and-migrate.ps1**: Yes, via Fix-Relationships function
- **Execution Order**: Final step in relationship fixing

### 6. S3 Storage Fix Scripts

#### packages/content-migrations/src/scripts/create/fallback-files.ts

- **Purpose**: Creates fallback files for S3 storage
- **Called via**: `pnpm run create:fallback-files`
- **Functionality**:
  - Creates fallback files when S3 content is missing
  - Ensures UI doesn't break with missing files
- **Used in reset-and-migrate.ps1**: Yes, via Fix-S3StorageIssues function
- **Execution Order**: First step in S3 storage fixing

#### packages/content-migrations/src/scripts/setup/s3-fallback-middleware.ts

- **Purpose**: Sets up S3 fallback middleware
- **Called via**: `pnpm run setup:s3-fallback-middleware`
- **Functionality**:
  - Configures middleware to handle missing S3 files
  - Sets up fallback paths
- **Used in reset-and-migrate.ps1**: Yes, via Fix-S3StorageIssues function
- **Execution Order**: Second step in S3 storage fixing

#### packages/content-migrations/src/scripts/repair/s3-references.ts

- **Purpose**: Fixes S3 references in database
- **Called via**: `pnpm run fix:s3-references`
- **Functionality**:
  - Updates database references to S3 content
  - Ensures correct paths and URLs
- **Used in reset-and-migrate.ps1**: Yes, via Fix-S3StorageIssues function
- **Execution Order**: Third step in S3 storage fixing

#### packages/content-migrations/src/scripts/create/thumbnail-placeholders.ts

- **Purpose**: Creates thumbnail placeholders
- **Called via**: `pnpm run create:thumbnail-placeholders`
- **Functionality**:
  - Generates placeholder thumbnails for missing images
  - Ensures UI displays something rather than breaking
- **Used in reset-and-migrate.ps1**: Yes, via Fix-S3StorageIssues function
- **Execution Order**: Fourth step in S3 storage fixing

### 7. Database Verification Scripts

#### packages/content-migrations/src/scripts/verification/todo-fields.ts

- **Purpose**: Verifies todo fields with dependency handling
- **Called via**: `pnpm run verify:todo-fields`
- **Functionality**:
  - Checks todo fields integrity
  - Uses dependency-aware verification
- **Used in reset-and-migrate.ps1**: Yes, via Verify-DatabaseState function
- **Execution Order**: First step in database verification

#### packages/content-migrations/src/scripts/verification/comprehensive-quiz-relationships.ts

- **Purpose**: Comprehensive quiz relationship verification
- **Called via**: `pnpm run verify:comprehensive-quiz-relationships`
- **Functionality**:
  - Thorough verification of quiz relationships
  - Checks multiple aspects of quiz data
- **Used in reset-and-migrate.ps1**: Yes, via Verify-DatabaseState function
- **Execution Order**: Second step in database verification

#### packages/content-migrations/src/scripts/sql/verify-schema.ts

- **Purpose**: Final database schema verification
- **Called via**: `pnpm run sql:verify-schema`
- **Functionality**:
  - Verifies entire database schema
  - Checks tables, columns, and relationships
- **Used in reset-and-migrate.ps1**: Yes, via Verify-DatabaseState function
- **Execution Order**: Third step in database verification

#### packages/content-migrations/src/scripts/verification/relationships/hybrid.ts

- **Purpose**: Hybrid relationship verification
- **Called via**: `pnpm run verify:relationships:hybrid`
- **Functionality**:
  - Combines multiple verification approaches
  - More robust than standard verification
- **Used in reset-and-migrate.ps1**: Yes, via Verify-DatabaseState function
- **Execution Order**: Fourth step in database verification

#### packages/content-migrations/src/scripts/verification/relationships.ts

- **Purpose**: Standard relationship verification
- **Called via**: `pnpm run verify:relationships`
- **Functionality**:
  - Basic approach to relationship verification
  - Used as fallback if hybrid verification fails
- **Used in reset-and-migrate.ps1**: Conditional fallback in Verify-DatabaseState function
- **Execution Order**: Fallback if hybrid verification fails

#### packages/content-migrations/src/scripts/verification/all.ts

- **Purpose**: Final comprehensive verification
- **Called via**: `pnpm run verify:all`
- **Functionality**:
  - Runs all verification scripts with dependencies
  - Final check of the entire database
- **Used in reset-and-migrate.ps1**: Yes, via Verify-DatabaseState function
- **Execution Order**: Final step in database verification

### 8. Certificates Bucket Scripts

#### Supabase Migration SQL (apps/web/supabase/migrations/20250407140654_create_certificates_bucket.sql)

- **Purpose**: Creates certificates storage bucket in Supabase
- **Called via**: Supabase migration process
- **Functionality**:
  - Creates bucket for storing course certificates
  - Sets up proper permissions
- **Used in reset-and-migrate.ps1**: Yes, but via Supabase migrations not direct call
- **Execution Order**: Handled by Supabase migration system

## Scripts Not Included in reset-and-migrate.ps1

The following scripts exist but are not directly called in the reset-and-migrate.ps1 process:

1. **Legacy Quiz Relationship Scripts**:

   - `fix:quiz-relationships-complete`: Replaced by newer approaches
   - `fix:unidirectional-quiz-relationships`: Replaced by bidirectional approaches
   - `fix:lesson-quiz-field-name`: Replaced by more comprehensive approaches
   - `fix:quiz-course-ids`: Alternative approach not in the main flow
   - `fix:course-quiz-relationships`: Alternative approach for quiz relationships

2. **Alternative Implementation Scripts**:

   - `fix:direct-quiz-fix`: Direct approach not in the main flow
   - `fix:quiz-question-relationships-enhanced`: Enhanced version not in the main flow
   - `fix:downloads-r2-direct`: Replaced by more robust approaches
   - `fix:quiz-export`: Used for exporting quiz data, not for migration
   - `fix:quiz-questions-jsonb`: Replaced by comprehensive JSONB formatter

3. **Development/Testing Scripts**:

   - Various diagnostic and testing scripts not used in production migration
   - Scripts with "test" in their name are typically for development only
   - Debugging scripts used during development of the migration system

4. **Deprecated UUID Table Scripts**:
   - Early versions of UUID table management that have been replaced
   - Simple column addition scripts that don't handle edge cases
   - Scripts without proper transaction management

## Execution Flow in the Loading Phase

The following is the complete execution order of all scripts that run during the loading phase in reset-and-migrate.ps1:

```mermaid
flowchart TD
    %% Main sections
    start([Start Loading Phase]) --> contentMigrations[Run Content Migrations]
    contentMigrations --> blogPosts[Migrate Blog Posts]
    blogPosts --> privatePosts[Migrate Private Posts]
    privatePosts --> uuidTables[Fix UUID Tables]
    uuidTables --> downloads[Import Downloads]
    downloads --> relationships[Fix Relationships]
    relationships --> s3Storage[Fix S3 Storage Issues]
    s3Storage --> verify{Skip Verification?}
    verify -->|No| verifyDB[Verify Database State]
    verify -->|Yes| certificatesBucket[Create Certificates Bucket]
    verifyDB --> certificatesBucket
    certificatesBucket --> end([End Loading Phase])

    %% Content Migrations
    subgraph contMig[1. Content Migrations]
    cm1[Run Payload Migrations] --> cm2[Verify Todo Fields]
    cm2 --> cm3[Verify Database Schema]
    end
    contentMigrations --> contMig

    %% Blog Posts
    subgraph blogPostsMig[2. Blog Posts]
    bp1[Run Specialized Post Migration] --> bp2[Verify Posts Were Migrated]
    end
    blogPosts --> blogPostsMig

    %% Private Posts
    subgraph privatePostsMig[3. Private Posts]
    pp1[Run Specialized Private Posts Migration] --> pp2[Verify Private Posts Were Migrated]
    end
    privatePosts --> privatePostsMig

    %% UUID Tables
    subgraph uuidTablesFix[4. UUID Tables]
    ut1[Fix Critical Columns] --> ut2[Ensure Environment Variables]
    ut2 --> ut3[Fix Critical Columns Safely]
    ut3 --> ut4[Verify Critical Columns]
    ut4 --> ut5[Fix Additional Columns]
    ut5 --> ut6[Verify with Enhanced Detection]
    ut6 --> ut7[Fix Relationship Columns]
    ut7 --> ut8[Verify Relationship Columns]
    end
    uuidTables --> uuidTablesFix

    %% Downloads
    subgraph downloadsMig[5. Downloads]
    dl1[Import Downloads from R2 Bucket]
    end
    downloads --> downloadsMig

    %% Relationships
    subgraph relationshipsFix[6. Relationships - Part 1]
    r1[
```
