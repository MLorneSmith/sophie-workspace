# Reset and Migrate Script Reorganization Plan

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Current Status Analysis](#current-status-analysis)
3. [Proposed Organization](#proposed-organization)
4. [Modular Architecture](#modular-architecture)
5. [Directory Structure](#directory-structure)
6. [Module Details](#module-details)
7. [Implementation Steps](#implementation-steps)
8. [Integration with Lesson Metadata YAML](#integration-with-lesson-metadata-yaml)
9. [Benefits](#benefits)

## Problem Statement

The current `reset-and-migrate.ps1` script has become difficult to maintain and understand due to its length, lack of clear organization, and the absence of a modular structure. Additionally, the script was truncated while implementing the Lesson Metadata YAML functionality, making it incomplete.

## Current Status Analysis

The current script has several issues:

1. **Monolithic Structure**: All functionality is in a single, long file.
2. **No Clear Phase Divisions**: Steps are sequential without clear logical grouping.
3. **Limited Reusability**: Functions are not designed for reuse across different contexts.
4. **Poor Maintainability**: Making changes requires navigating a complex file.
5. **Truncation**: The script is incomplete, missing parts of the implementation.

## Proposed Organization

We will reorganize the script into three clear phases:

### Phase 1: Setup

- Reset Supabase database
- Run Web app migrations
- Reset Payload schema
- Run Payload migrations

### Phase 2: Processing

- Process raw data (conditionally regenerate if needed)
- Generate SQL seed files with YAML metadata support
- Fix quiz ID consistency issues
- Fix relationship references

### Phase 3: Loading

- Run content migrations
- Import downloads
- Fix relationships
- Comprehensive verification

## Modular Architecture

Instead of a single monolithic script, we will adopt a modular architecture:

1. **Main Orchestrator**: A slim script that manages the overall flow.
2. **Utility Modules**: Shared functions for logging, execution, verification.
3. **Phase Modules**: Separate modules for each logical phase.

This approach enhances maintainability, readability, and allows for better error handling and future extensions.

## Directory Structure

```
/                             # Root directory
├── reset-and-migrate.ps1     # Main orchestrator (kept in the root)
└── scripts/
    └── orchestration/        # Scripts for orchestration
        ├── utils/
        │   ├── logging.ps1      # Logging and output formatting
        │   ├── execution.ps1    # Command execution helpers
        │   └── verification.ps1 # Verification utilities
        └── phases/
            ├── setup.ps1        # Setup phase functions
            ├── processing.ps1   # Processing phase functions
            └── loading.ps1      # Loading phase functions
```

## Module Details

### Main Orchestrator (`reset-and-migrate.ps1`)

- **Purpose**: Coordinate the overall migration process
- **Functionality**:
  - Import all required modules
  - Initialize logging and environment
  - Execute each phase in sequence
  - Handle overall error reporting
  - Provide command-line parameters

```powershell
# Example structure
param (
    [switch]$ForceRegenerate,
    [switch]$SkipVerification
)

# Import modules
. "$PSScriptRoot\scripts\orchestration\utils\logging.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\execution.ps1"
. "$PSScriptRoot\scripts\orchestration\utils\verification.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\setup.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\processing.ps1"
. "$PSScriptRoot\scripts\orchestration\phases\loading.ps1"

# Initialize
Initialize-Migration

try {
    # Phase 1: Setup
    Log-Phase "SETUP PHASE"
    Invoke-SetupPhase

    # Phase 2: Processing
    Log-Phase "PROCESSING PHASE"
    Invoke-ProcessingPhase -ForceRegenerate:$ForceRegenerate

    # Phase 3: Loading
    Log-Phase "LOADING PHASE"
    Invoke-LoadingPhase -SkipVerification:$SkipVerification

    # Success
    Log-Success "Migration completed successfully"
}
catch {
    Log-Error "Migration failed: $_"
    exit 1
}
finally {
    Finalize-Migration
}
```

### Utility Modules

#### `logging.ps1`

- **Purpose**: Provide consistent logging capabilities
- **Key Functions**:
  - `Initialize-Logging`: Set up log files and environment
  - `Log-Message`: Log a message to console and file
  - `Log-Phase`: Log a phase header
  - `Log-Success`: Log a success message
  - `Log-Error`: Log an error message
  - `Finalize-Logging`: Complete logging and provide summary

#### `execution.ps1`

- **Purpose**: Execute commands with proper error handling
- **Key Functions**:
  - `Exec-Command`: Execute a command and check exit code
  - `Try-Command`: Try executing a command with fallback

#### `verification.ps1`

- **Purpose**: Verify database and file states
- **Key Functions**:
  - `Verify-Schema`: Check if a database schema exists
  - `Verify-Table`: Check if a table exists
  - `Verify-Column`: Check if a column exists in a table
  - `Verify-Relationship`: Check if relationship records exist

### Phase Modules

#### `setup.ps1`

- **Purpose**: Handle database reset and initial schema creation
- **Key Functions**:
  - `Invoke-SetupPhase`: Main entry point for this phase
  - `Reset-SupabaseDatabase`: Reset the Supabase database
  - `Run-WebAppMigrations`: Run web app migrations
  - `Reset-PayloadSchema`: Reset the Payload schema
  - `Run-PayloadMigrations`: Run Payload migrations

#### `processing.ps1`

- **Purpose**: Process raw data and generate SQL files
- **Key Functions**:
  - `Invoke-ProcessingPhase`: Main entry point for this phase
  - `Process-RawData`: Process raw data files
  - `Ensure-LessonMetadata`: Ensure lesson metadata YAML exists
  - `Generate-SqlSeedFiles`: Generate SQL seed files
  - `Fix-QuizIdConsistency`: Fix quiz ID consistency issues
  - `Fix-References`: Fix relationship references

#### `loading.ps1`

- **Purpose**: Load processed data and verify integrity
- **Key Functions**:
  - `Invoke-LoadingPhase`: Main entry point for this phase
  - `Run-ContentMigrations`: Run content migrations
  - `Import-Downloads`: Import downloads from R2
  - `Fix-Relationships`: Fix relationship issues
  - `Verify-Database`: Verify database integrity

## Implementation Steps

1. **Create Directory Structure**:

   - Create `scripts/orchestration` directory
   - Create subdirectories for utils and phases

2. **Develop Utility Modules**:

   - Extract and enhance logging functions
   - Extract and enhance execution functions
   - Extract and enhance verification functions

3. **Develop Phase Modules**:

   - Extract setup phase functions
   - Extract processing phase functions
   - Extract loading phase functions

4. **Create Main Orchestrator**:

   - Create a slim `reset-and-migrate.ps1` that imports modules
   - Add phase invocation and error handling

5. **Test Each Module**:
   - Test utilities independently
   - Test each phase independently
   - Test the complete flow

## Integration with Lesson Metadata YAML

The reorganized script will support the Lesson Metadata YAML implementation:

1. **Processing Phase**:

   - The `Ensure-LessonMetadata` function will check for and create the YAML file if needed
   - `Generate-SqlSeedFiles` will use the updated approach that supports YAML metadata

2. **Verification**:

   - Verification steps will validate the resulting database entries
   - Specific checks for the todo fields and Bunny video IDs

3. **Error Handling**:
   - Clear error messages for YAML parsing issues
   - Recovery mechanisms for metadata problems

## Benefits

1. **Improved Maintainability**:

   - Smaller, focused files
   - Clear separation of concerns
   - Easier to understand and modify

2. **Enhanced Reusability**:

   - Functions can be reused across different scripts
   - Utilities are generalized for multiple contexts

3. **Better Error Handling**:

   - Structured approach to errors
   - Centralized logging
   - Clearer diagnostic information

4. **Extensibility**:

   - Easy to add new phases or capabilities
   - Modular design allows targeted enhancements

5. **Documentation**:

   - Self-documenting structure
   - Clear phase boundaries
   - Descriptive function names

6. **Robust Support for New Features**:
   - Lesson Metadata YAML implementation is cleanly integrated
   - Future enhancements can be added with minimal disruption
