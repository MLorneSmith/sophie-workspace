# Fallback & Relationship Repair Phase Scripts Inventory

## Overview

This document provides a comprehensive inventory of all scripts in the Fallback & Relationship Repair phase of the content migration system. It details what each script is meant to do, which scripts are actually running as part of the reset-and-migrate.ps1 process, and the order in which they run.

The Fallback & Relationship Repair phase is a critical component of the content migration system that ensures database relationships are correctly maintained, particularly when dealing with Payload CMS's dynamic UUID tables and complex relationships. This phase provides:

1. Detection and mapping of database relationships between collections
2. Creation of database infrastructure (views and helper functions) for relationship management
3. Relationship repair mechanisms with a focus on quiz-question relationships
4. Verification of relationship integrity after repairs
5. Fallback mechanisms when primary relationship approaches fail

## Main Orchestration Scripts

### scripts/orchestration/phases/relationship-repair.ps1

- **Purpose**: Provides the standard relationship repair system with full functionality
- **Functions**:
  - `Invoke-RelationshipRepair`: Main entry point for relationship repair
- **Parameters**:
  - `SkipVerification`: Skip the verification phase
  - `SkipFallback`: Skip creation of fallback database views and helpers
  - `VerboseOutput`: Enable detailed logging
  - `ContinueOnError`: Continue execution despite errors
- **Used in reset-and-migrate.ps1**: Yes - Imported by loading.ps1 and called by Fix-Relationships function
- **Execution Order**: Called near the end of the Fix-Relationships function in loading.ps1

### scripts/orchestration/phases/relationship-repair-simplified.ps1

- **Purpose**: Provides a simplified version of relationship repair that doesn't rely on direct fields
- **Functions**:
  - `Invoke-SimplifiedRelationshipRepair`: Main entry point for simplified repair
- **Parameters**:
  - `SkipVerification`: Skip the verification phase
  - `SkipFallback`: Skip creation of fallback database views and helpers
  - `VerboseOutput`: Enable detailed logging
- **Used in reset-and-migrate.ps1**: Yes - Imported by loading.ps1 and used as fallback if standard repair fails
- **Execution Order**: Called conditionally if Invoke-RelationshipRepair fails

## Core Implementation Scripts

### packages/content-migrations/src/cli/run-relationship-repair.ts

- **Purpose**: Provides a command-line interface for running the relationship repair process
- **Functions**:
  - Fully-featured CLI with command-line parameter parsing
  - Imports and calls `runRelationshipRepair` from the orchestration module
- **Used in reset-and-migrate.ps1**: Only indirectly via the repair:relationships script
- **Execution Order**: Launched by pnpm run repair:relationships in the relationship-repair.ps1 script

### packages/content-migrations/src/cli/run-simplified-relationship-repair.ts

- **Purpose**: CLI for running the simplified relationship repair process
- **Functions**:
  - Simple CLI with command-line parameter parsing
  - Imports and calls `runRelationshipRepairSimplified` from the orchestration module
- **Used in reset-and-migrate.ps1**: Only indirectly via the repair:relationships:simplified script
- **Execution Order**: Launched by pnpm run repair:relationships:simplified in the simplified repair script

### packages/content-migrations/src/orchestration/relationship-repair.ts

- **Purpose**: Main orchestration module for the standard relationship repair process
- **Functions**:
  - `runRelationshipRepair`: Core function to orchestrate the entire process
- **Phases**:
  1. Detection: Find and map all database relationships
  2. Database Infrastructure: Create views and helper functions
  3. Fix: Apply relationship fixes (focus on quiz-question relationships)
  4. Verification: Validate relationship integrity
- **Used in reset-and-migrate.ps1**: Only indirectly via the CLI scripts
- **Execution Order**: Called by run-relationship-repair.ts

### packages/content-migrations/src/orchestration/simplified-relationship-repair.ts

- **Purpose**: Simplified orchestration for relationship repair
- **Functions**:
  - `runRelationshipRepairSimplified`: Orchestrates simplified relationship repair
- **Differences from standard repair**:
  - Uses simplified verification approach that doesn't rely on direct fields
  - Otherwise follows the same phases as the standard approach
- **Used in reset-and-migrate.ps1**: Only indirectly via the CLI scripts
- **Execution Order**: Called by run-simplified-relationship-repair.ts

## Relationship Detection Scripts

### packages/content-migrations/src/scripts/repair/relationships/core/detection.ts

- **Purpose**: Analyzes the database to identify and map relationships between collections
- **Functions**:
  - `detectAllRelationships`: Finds all relationships in the database
  - `saveRelationshipMap`: Saves relationship map to a file for future use
  - `loadRelationshipMap`: Loads relationship map from a file
  - `detectAndSaveRelationships`: Main function to detect and save relationships
- **Key Features**:
  - Identifies collections, relationship tables, and UUID tables
  - Maps relationships between collections using database analysis
  - Determines relationship types (hasOne/hasMany) and target collections
  - Uses sophisticated inference when exact relationships can't be determined
- **Used in reset-and-migrate.ps1**: Only indirectly via the orchestration scripts
- **Execution Order**: First phase of relationship repair in orchestration scripts

## Database Infrastructure Scripts

### packages/content-migrations/src/scripts/repair/relationships/database/views.ts

- **Purpose**: Creates standardized database views for commonly accessed relationships
- **Functions**:
  - `createQuizQuestionViews`: Creates views for quiz-question relationships
  - `createInvalidRelationshipsView`: Creates a view to track invalid relationships
  - `createAllRelationshipViews`: Main function to create all relationship views
- **Key Features**:
  - Creates course_quiz_questions_view: Maps quizzes to their questions
  - Creates lesson_quiz_view: Maps lessons to their quizzes
  - Creates survey_questions_view: Maps surveys to their questions
  - Creates course_content_view: Unifies courses, lessons, and quizzes
  - Creates downloads_relationships_view: Maps downloads to their parent content
  - Creates invalid_relationships_view: Identifies inconsistent relationships
- **Used in reset-and-migrate.ps1**: Only indirectly via the orchestration scripts
- **Execution Order**: Second phase of relationship repair in orchestration scripts

### packages/content-migrations/src/scripts/repair/relationships/database/helpers.ts

- **Purpose**: Creates database helper functions for relationship data access
- **Functions**:
  - `createQuizQuestionHelpers`: Creates helper functions for quiz-question relationships
  - `createAllRelationshipHelpers`: Main function to create all helper functions
- **Key Features**:
  - Creates get_quiz_questions function: Returns questions for a quiz
  - Creates get_lesson_quiz function: Returns quiz for a lesson
  - Creates get_survey_questions function: Returns questions for a survey
  - Creates get_related_downloads function: Returns downloads for a content item
  - Creates lookup_relationships function: Generic relationship lookup
  - Creates check_relationship_consistency function: Summarizes relationship consistency
- **Used in reset-and-migrate.ps1**: Only indirectly via the orchestration scripts
- **Execution Order**: Second phase of relationship repair in orchestration scripts

## Relationship Fixing Scripts

### packages/content-migrations/src/scripts/repair/relationships/fixes/quiz-question.ts

- **Purpose**: Fixes quiz-question relationships in the database
- **Functions**:
  - `fixQuizQuestionRelationships`: Main function to fix quiz-question relationships
  - `verifyQuizQuestionRelationships`: Verifies relationships after fixing
  - `fixAndVerifyQuizQuestionRelationships`: Combined fix and verify
- **Key Features**:
  - Ensures consistency between direct fields and relationship tables
  - Handles order mismatches in question sequences
  - Adds missing questions to quizzes and relationship tables
  - Cleans up orphaned relationship entries
- **Used in reset-and-migrate.ps1**: Only indirectly via the orchestration scripts
- **Execution Order**: Third phase of relationship repair in orchestration scripts

## Verification Scripts

### packages/content-migrations/src/scripts/verification/relationships/verify-all.ts

- **Purpose**: Provides comprehensive verification of all relationship types
- **Functions**:
  - `verifyAllRelationships`: Main function to verify all relationships
  - `verifyQuizQuestionRelationships`: Specifically verifies quiz-question relationships
  - `verifyLessonQuizRelationships`: Specifically verifies lesson-quiz relationships
  - `verifySurveyQuestionRelationships`: Specifically verifies survey-question relationships
  - `verifyDownloadRelationships`: Specifically verifies download relationships
- **Key Features**:
  - Checks for missing entries in relationship tables
  - Checks for missing entries in direct fields
  - Verifies correct ordering in relationship tables
  - Provides detailed inconsistency reporting
- **Used in reset-and-migrate.ps1**: Only indirectly via the orchestration scripts
- **Execution Order**: Fourth phase of relationship repair in orchestration scripts

### packages/content-migrations/src/scripts/verification/relationships/verify-simplified.ts

- **Purpose**: Simplified verification that doesn't rely on direct fields
- **Functions**: Similar to verify-all.ts but with modifications
- **Key Differences**:
  - Focuses only on validating relationship table entries against actual collection entries
  - Does not check direct field consistency (which may not exist)
  - Provides more resilient verification when schema is in flux
- **Used in reset-and-migrate.ps1**: Only indirectly via the simplified orchestration script
- **Execution Order**: Fourth phase of simplified relationship repair

## Fallback System Scripts

### packages/content-migrations/src/scripts/repair/fallbacks/database/create-fallback-views.ts

- **Purpose**: Creates database views as fallback for direct relationships
- **Functions**: Creates views that mimic expected relationship structures
- **Used in reset-and-migrate.ps1**: Only indirectly via the fallback:database-views script
- **Execution Order**: Called as part of the database infrastructure phase when needed

### packages/content-migrations/src/scripts/repair/fallbacks/database/create-fallback-functions.ts

- **Purpose**: Creates database functions as fallback for relationship queries
- **Functions**: Creates functions that provide relationship data using fallback mechanisms
- **Used in reset-and-migrate.ps1**: Only indirectly via the fallback:database-functions script
- **Execution Order**: Called as part of the database infrastructure phase when needed

### packages/content-migrations/src/scripts/repair/fallbacks/database/generate-static-mappings.ts

- **Purpose**: Generates static relationship mappings as a last-resort fallback
- **Functions**: Creates hard-coded mappings for critical relationships
- **Used in reset-and-migrate.ps1**: Only indirectly via the fallback:static-mappings script
- **Execution Order**: Called as part of the database infrastructure phase when needed

### packages/content-migrations/src/scripts/repair/fallbacks/payload/create-hooks.ts

- **Purpose**: Creates Payload CMS hooks for relationship handling
- **Functions**: Sets up hooks to manage relationships in Payload CMS
- **Used in reset-and-migrate.ps1**: Only indirectly via the fallback:payload-hooks script
- **Execution Order**: Called as part of the database infrastructure phase when needed

### packages/content-migrations/src/scripts/repair/fallbacks/payload/create-api-endpoints.ts

- **Purpose**: Creates API endpoints for relationship data access
- **Functions**: Sets up endpoints to retrieve relationship data
- **Used in reset-and-migrate.ps1**: Only indirectly via the fallback:api-endpoints script
- **Execution Order**: Called as part of the database infrastructure phase when needed

## Additional Scripts in package.json

The following scripts are defined in packages/content-migrations/package.json and can be run individually:

### Relationship Management Scripts

- **repair:relationships**: Runs the full relationship repair process
- **repair:relationships:simplified**: Runs the simplified relationship repair process
- **repair:relationships:help**: Shows help for relationship repair options
- **repair:relationships:verify-only**: Runs only the verification phase
- **repair:quiz-relationships**: Targets specifically quiz-question relationships

### Fallback System Scripts

- **fallback:install-dependencies**: Installs dependencies needed by the fallback system
- **fallback:database-views**: Creates database views for relationship fallbacks
- **fallback:database-functions**: Creates database functions for relationship fallbacks
- **fallback:static-mappings**: Generates static relationship mappings
- **fallback:payload-hooks**: Creates Payload CMS hooks for relationship handling
- **fallback:api-endpoints**: Creates API endpoints for relationship access
- **fallback:register**: Registers all fallback systems
- **fallback:verify**: Verifies that fallback systems are working
- **fallback:all**: Runs all fallback system scripts

## Integration with Loading Phase

The relationship repair scripts are integrated into the loading phase of reset-and-migrate.ps1 through the Fix-Relationships function in loading.ps1. Here is how they fit into the overall flow:

1. **Early Relationship Fixes**: The Fix-Relationships function first runs a series of individual relationship fixes:

   - Fixing edge cases
   - Payload relationship fixes with strict typing
   - Quiz relationship fixes (multiple approaches)
   - Survey question population fixes
   - Todo field fixes
   - Lexical format fixes
   - Media relationship fixes

2. **Comprehensive Relationship Repair**: Near the end of the Fix-Relationships function, the comprehensive relationship repair system is invoked:

   - `Invoke-RelationshipRepair` is called from relationship-repair.ps1
   - If it fails, `Invoke-SimplifiedRelationshipRepair` is called as a fallback
   - Both functions handle the complete relationship repair process in four phases:
     1. Detection: Map all relationships in the database
     2. Database Infrastructure: Create views and helper functions
     3. Fixes: Apply relationship fixes
     4. Verification: Validate relationship integrity

3. **Final Verification**: After the relationship repair, a final verification is run:
   - Runs `pnpm run verify:all` to validate all aspects of the database

## Execution Flow in Fallback & Relationship Repair

The following is the execution order within the Fallback & Relationship Repair phase when triggered by Invoke-RelationshipRepair:

1. **Phase 1: Enhanced Relationship Detection**

   - Call detectAndSaveRelationships() to create relationship map
   - Detect collections, relationship tables, and UUID tables
   - Analyze database to identify relationships between collections

2. **Phase 2: Database Helpers and Views**

   - Create standardized database views for commonly accessed relationships
   - Create helper functions for relationship data access
   - Set up invalid relationships view for monitoring

3. **Phase 3: Relationship Fixes**

   - Begin database transaction
   - Fix quiz-question relationships if not skipped
   - Create invalid relationships view for monitoring
   - Commit transaction

4. **Phase 4: Verification**
   - Verify relationships using appropriate verification approach
   - Report inconsistencies and calculate pass rate
   - Generate verification summary

## Fallback Strategy

The Fallback & Relationship Repair phase implements a multi-tiered fallback strategy:

1. **Primary Approach**: Standard relationship repair with direct field consistency checking
2. **First Fallback**: Simplified relationship repair without reliance on direct fields
3. **Database Fallbacks**:
   - Database views for standardized relationship access
   - Database helper functions for relationship queries
4. **Code-Level Fallbacks**:
   - Payload CMS hooks for relationship interception
   - API endpoints for relationship data access
5. **Last Resort**: Static relationship mappings hard-coded into the system

This multi-tiered approach ensures that the system can continue to function even when facing schema changes, dynamic UUID tables, or other relationship challenges.

## Summary

The Fallback & Relationship Repair phase is a sophisticated system designed to handle the complex relationship requirements of the content migration process. It provides:

1. **Robust Relationship Management**: Ensures relationships between content items are consistent and valid
2. **Dynamic Adaptation**: Handles dynamically created UUID tables and changing schemas
3. **Fallback Mechanisms**: Provides multiple layers of fallbacks when primary approaches fail
4. **Comprehensive Verification**: Validates relationship integrity with detailed reporting

The scripts work together as a coordinated system to maintain relationship integrity in the database, play a critical role in ensuring that the front-end application can correctly navigate relationships between content items, and provide resilience against schema changes and other database challenges.
