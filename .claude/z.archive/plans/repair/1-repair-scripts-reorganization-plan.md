# Content Migration System - Repair Scripts Reorganization Plan

## Overview

This document outlines the plan to reorganize the repair scripts in the Content Migration System. The current flat structure with 37+ scripts in the repair directory plus additional scripts in the fix directory makes maintenance and navigation difficult. By categorizing scripts into functional groups, we'll improve organization, maintainability, and developer experience.

## Current Issues

1. **Flat Directory Structure**: All repair scripts are in a single directory with no categorization
2. **Scattered Scripts**: Related scripts are distributed across different directories (`repair` and `fix`)
3. **Mixed Concerns**: Scripts addressing different concerns (database, content, relationships) are intermingled
4. **Poor Discoverability**: Difficult to find related scripts when making changes
5. **Unclear Dependencies**: Relationships between scripts are not immediately obvious
6. **Maintenance Challenges**: Adding new scripts or modifying existing ones requires extensive knowledge of the codebase

## Directory Structure Reorganization

We will organize scripts into functional categories that reflect their purpose and domain:

```
packages/content-migrations/src/scripts/repair/
├── README.md                           # Updated documentation
├── database/                           # Database structure fixes
│   ├── fix-uuid-tables.ts
│   ├── fix-relationship-columns.ts
│   ├── fix-relationships-direct.ts
│   └── fix-payload-relationships-strict.ts
├── content-format/                     # Content and formatting fixes
│   ├── fix-lexical-format.ts
│   ├── fix-post-lexical-format.ts
│   ├── fix-all-lexical-fields.ts
│   ├── fix-lesson-todo-fields.ts
│   └── fix-todo-fields.ts
├── quiz-management/                    # Quiz-related fixes
│   ├── fix-quiz-id-consistency.ts
│   ├── fix-quiz-question-relationships.ts
│   ├── fix-quiz-relationships-complete.ts
│   ├── fix-quiz-course-ids.ts
│   ├── fix-course-ids-final.ts
│   ├── fix-course-quiz-relationships.ts
│   ├── fix-unidirectional-quiz-relationships.ts
│   ├── fix-quizzes-without-questions.ts
│   ├── fix-lesson-quiz-field-name.ts
│   ├── fix-invalid-quiz-references.ts
│   ├── run-direct-quiz-fix.ts          # Moved from fix directory
│   └── direct-quiz-fix.sql             # Moved from fix directory
├── media-downloads/                    # Media and download fixes
│   ├── fix-download-r2-mappings.ts
│   ├── fix-download-r2-urls.ts
│   ├── fix-downloads-metadata.ts
│   ├── fix-downloads-r2-integration.ts
│   ├── fix-downloads-relationships.ts
│   ├── fix-post-image-relationships.ts
│   └── fix-bunny-video-ids.ts
├── survey-management/                  # Survey-related fixes
│   ├── fix-survey-questions-population.ts
│   └── fix-survey-progress.ts
└── utilities/                          # Utility scripts
    ├── clear-lesson-content.ts
    ├── fix-edge-cases.ts
    ├── add-bunny-video-ids-hook.ts
    └── hook-integration-script.ps1
```

## Script Categorization Logic

Scripts are categorized based on:

1. **Primary Domain**: The main content or data type affected (quizzes, media, surveys)
2. **Operation Type**: The kind of fix performed (relationships, formatting, structure)
3. **Related Dependencies**: Scripts that often need to be run together or depend on each other

## Package.json Script Updates

The `package.json` scripts section will be updated to reflect the new directory structure:

```json
{
  "scripts": {
    // Database scripts
    "fix:uuid-tables": "tsx src/scripts/repair/database/fix-uuid-tables.ts",
    "fix:relationship-columns": "tsx src/scripts/repair/database/fix-relationship-columns.ts",
    "fix:relationships-direct": "tsx src/scripts/repair/database/fix-relationships-direct.ts",
    "fix:payload-relationships-strict": "tsx src/scripts/repair/database/fix-payload-relationships-strict.ts",

    // Content format scripts
    "fix:lexical-format": "tsx src/scripts/repair/content-format/fix-lexical-format.ts",
    "fix:post-lexical-format": "tsx src/scripts/repair/content-format/fix-post-lexical-format.ts",
    "fix:all-lexical-fields": "tsx src/scripts/repair/content-format/fix-all-lexical-fields.ts",
    "fix:todo-fields": "tsx src/scripts/repair/content-format/fix-todo-fields.ts",

    // Quiz management scripts
    "fix:quiz-id-consistency": "tsx src/scripts/repair/quiz-management/fix-quiz-id-consistency.ts",
    "fix:quiz-question-relationships": "tsx src/scripts/repair/quiz-management/fix-quiz-question-relationships.ts",
    "fix:quiz-relationships-complete": "tsx src/scripts/repair/quiz-management/fix-quiz-relationships-complete.ts",
    "fix:quiz-course-ids": "tsx src/scripts/repair/quiz-management/fix-quiz-course-ids.ts",
    "fix:course-ids-final": "tsx src/scripts/repair/quiz-management/fix-course-ids-final.ts",
    "fix:course-quiz-relationships": "tsx src/scripts/repair/quiz-management/fix-course-quiz-relationships.ts",
    "fix:unidirectional-quiz-relationships": "tsx src/scripts/repair/quiz-management/fix-unidirectional-quiz-relationships.ts",
    "fix:quizzes-without-questions": "tsx src/scripts/repair/quiz-management/fix-quizzes-without-questions.ts",
    "fix:invalid-quiz-references": "tsx src/scripts/repair/quiz-management/fix-invalid-quiz-references.ts",
    "fix:direct-quiz-fix": "tsx src/scripts/repair/quiz-management/run-direct-quiz-fix.ts", // Updated path for moved script

    // Media and downloads scripts
    "fix:download-r2-mappings": "tsx src/scripts/repair/media-downloads/fix-download-r2-mappings.ts",
    "fix:downloads-metadata": "tsx src/scripts/repair/media-downloads/fix-downloads-metadata.ts",
    "fix:downloads-r2-integration": "tsx src/scripts/repair/media-downloads/fix-downloads-r2-integration.ts",
    "fix:downloads-relationships": "tsx src/scripts/repair/media-downloads/fix-downloads-relationships.ts",
    "fix:post-image-relationships": "tsx src/scripts/repair/media-downloads/fix-post-image-relationships.ts",
    "fix:bunny-video-ids": "powershell -ExecutionPolicy Bypass -File src/scripts/repair/media-downloads/hook-integration-script.ps1",

    // Survey management scripts
    "fix:survey-questions-population": "tsx src/scripts/repair/survey-management/fix-survey-questions-population.ts",
    "fix:survey-progress": "tsx src/scripts/repair/survey-management/fix-survey-progress.ts",

    // Utility scripts
    "repair:edge-cases": "tsx src/scripts/repair/utilities/fix-edge-cases.ts",
    "clear:lesson-content": "powershell -ExecutionPolicy Bypass -File ./clear-lesson-content.ps1"
  }
}
```

## Implementation Plan

### Phase 1: Preparation

1. **Create Directory Structure**

   - Create all subdirectories in the repair folder
   - Set up the initial README.md documenting the new structure

2. **Script Analysis Validation**
   - Confirm dependencies between scripts
   - Validate that the categorization is appropriate
   - Document any special considerations for specific scripts

### Phase 2: File Migration

1. **Move Scripts with SQL Dependencies**

   - Identify all TypeScript files with SQL dependencies
   - Move paired TypeScript and SQL files together to maintain references
   - Update path references within TypeScript files

2. **Move Independent Scripts**

   - Move remaining scripts to their respective categories
   - Update any internal references between scripts

3. **Move Scripts from `fix` Directory**
   - Move `run-direct-quiz-fix.ts` to `quiz-management` subdirectory
   - Move `direct-quiz-fix.sql` to `quiz-management` subdirectory
   - Update path references in the TypeScript file

### Phase 3: Reference Updates

1. **Update package.json**

   - Update all script paths to reflect the new directory structure
   - Ensure PowerShell scripts have correct paths
   - Rename scripts as needed for consistency

2. **Update Documentation**
   - Update main README.md to reference the new structure
   - Update any other documentation referencing these scripts

### Phase 4: Testing

1. **Validation Tests**

   - Run individual scripts to verify they work in their new locations
   - Check for path-related errors
   - Verify SQL dependencies are correctly referenced

2. **Integration Test**
   - Run the full migration workflow to ensure all scripts execute correctly
   - Verify the database state after migration matches expected results

## Benefits

1. **Improved Organization**: Scripts are grouped by their functional domain
2. **Better Maintainability**: Easier to find related scripts when making changes
3. **Clearer Dependencies**: Relationship between scripts is more explicit
4. **Easier Navigation**: Developers can quickly find relevant scripts
5. **Scalability**: New scripts can be added to the appropriate category
6. **Consolidated Repairs**: All repair-related scripts are in one organized structure
7. **Reduced Complexity**: Easier to understand the repair system as a whole

## Risk Mitigation

1. **Path Dependencies**:

   - Map all file paths before migration
   - Update all file references immediately after moving files
   - Test each script individually after migration

2. **Script Execution Order**:

   - Document the current execution order in reset-and-migrate.ps1
   - Ensure the reorganization doesn't impact execution order
   - Test the full migration process

3. **PowerShell Script References**:

   - Identify all PowerShell scripts using relative paths
   - Update paths to accommodate the new directory structure
   - Test PowerShell scripts separately

4. **Documentation Alignment**:
   - Update all documentation referencing the repair scripts
   - Create or update README files for each subdirectory
   - Document the new organization in the main README.md

## Implementation Timeline

1. **Phase 1**: 1 day - Create directory structure and validate script categorization
2. **Phase 2**: 1-2 days - Move files and update internal references
3. **Phase 3**: 1 day - Update package.json and documentation
4. **Phase 4**: 1-2 days - Testing and validation
5. **Total**: 4-6 days including final verification and any necessary adjustments

## Conclusion

This reorganization will significantly improve the maintainability and usability of the Content Migration System repair scripts. By categorizing scripts according to their functional domains and consolidating related fixes, we'll create a more intuitive and developer-friendly structure that scales better as we continue to develop and maintain the system.
