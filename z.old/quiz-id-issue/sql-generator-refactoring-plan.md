# SQL Generator Refactoring Plan

## Overview

The `packages/content-migrations/src/scripts/sql/generate-sql-seed-files-fixed.ts` file has grown to over 1000 lines of code, making it difficult to maintain and understand. This document outlines a plan to refactor this file into a more modular structure while maintaining consistency with the existing project organization.

## Current Issues

1. **File Size**: At over 1000 lines, the file is difficult to navigate and understand.
2. **Multiple Responsibilities**: The file handles SQL generation for multiple entity types (courses, lessons, quizzes, questions, surveys, etc.).
3. **TypeScript Errors**: There are unresolved TypeScript errors related to handling potentially undefined values.
4. **Code Duplication**: There are patterns that repeat across different SQL generation functions.
5. **Complex Logic**: Some functions contain complex logic that could be simplified or extracted.

## Current Project Structure

The project has a well-organized structure with directories for different types of operations:

- `core/` - Direct migration scripts
- `process/` - Data processing scripts
- `repair/` - Scripts to fix issues
- `sql/` - SQL-related scripts
- `utils/` - Utility scripts
- `verification/` - Verification scripts

## Refactoring Approach

The refactoring will maintain consistency with the existing project structure while breaking down the large file into more manageable pieces.

### Proposed File Structure

```
packages/content-migrations/src/
├── scripts/
│   ├── sql/
│   │   ├── generate-sql-seed-files.ts         # Main orchestration function
│   │   ├── generators/                        # New directory for SQL generators
│   │   │   ├── generate-courses-sql.ts        # Course SQL generation
│   │   │   ├── generate-lessons-sql.ts        # Lesson SQL generation
│   │   │   ├── generate-media-sql.ts          # Media SQL generation
│   │   │   ├── generate-quizzes-sql.ts        # Quiz SQL generation
│   │   │   ├── generate-questions-sql.ts      # Question SQL generation
│   │   │   ├── generate-surveys-sql.ts        # Survey SQL generation
│   │   │   └── generate-survey-questions-sql.ts # Survey question SQL generation
│   │   └── ...
│   ├── verification/
│   │   ├── verify-quiz-ids-in-sql.ts          # Extend the existing verification
│   │   ├── verify-cross-file-quiz-ids.ts      # New verification function
│   │   └── ...
│   └── utils/
│       ├── lexical-converter.ts               # Markdown to Lexical conversion
│       ├── quiz-map-generator.ts              # Quiz map generation
│       └── ...
└── ...
```

### Implementation Steps

1. **Create the Directory Structure**

   - Create the `scripts/sql/generators` directory if it doesn't exist

2. **Extract Utility Functions**

   - Create `utils/lexical-converter.ts` for the Markdown to Lexical conversion
   - Create `utils/quiz-map-generator.ts` for quiz map generation

3. **Extract Verification Functions**

   - Create `verification/verify-quiz-ids-in-sql.ts` for quiz ID verification
   - Create `verification/verify-cross-file-quiz-ids.ts` for cross-file verification

4. **Extract SQL Generation Functions**

   - Create individual files for each SQL generation function in the `sql/generators` directory
   - Each file should export a single main function

5. **Create the Main Orchestration Function**

   - Create `sql/generate-sql-seed-files.ts` that imports and uses all the extracted functions
   - Ensure it maintains the same functionality as the original file

6. **Fix TypeScript Errors**

   - Address TypeScript errors in each module
   - Ensure proper handling of potentially undefined values

7. **Update Tests**

   - Update any tests that rely on the original file
   - Add new tests for the extracted functions if needed

8. **Deprecate the Original File**
   - Keep the original file temporarily with a deprecation notice
   - Remove it once the refactored version is fully tested and integrated

## Function Responsibilities

### Main Orchestration Function

- `generateSqlSeedFiles()` in `generate-sql-seed-files.ts`
  - Coordinates the entire SQL generation process
  - Calls all the individual generator functions
  - Handles file writing and error handling

### Utility Functions

- `convertToLexical()` in `lexical-converter.ts`
  - Converts Markdown content to Lexical JSON structure
- `generateQuizMap()` in `quiz-map-generator.ts`
  - Generates a map of quiz slugs to UUIDs

### Verification Functions

- `verifyQuizIds()` in `verify-quiz-ids-in-sql.ts`
  - Verifies that quiz IDs in SQL match those in knownQuizIds
- `verifyCrossFileQuizIds()` in `verify-cross-file-quiz-ids.ts`
  - Verifies that quiz IDs in questions SQL match those in quizzes SQL

### SQL Generation Functions

- `generateCoursesSql()` in `generate-courses-sql.ts`
  - Generates SQL for courses
- `generateMediaSql()` in `generate-media-sql.ts`
  - Generates SQL for media entries
- `generateLessonsSql()` in `generate-lessons-sql.ts`
  - Generates SQL for lessons
- `generateQuizzesSql()` in `generate-quizzes-sql.ts`
  - Generates SQL for quizzes
- `generateQuestionsSql()` in `generate-questions-sql.ts`
  - Generates SQL for quiz questions
- `generateSurveysSql()` in `generate-surveys-sql.ts`
  - Generates SQL for surveys
- `generateSurveyQuestionsSql()` in `generate-survey-questions-sql.ts`
  - Generates SQL for survey questions

## Benefits of Refactoring

1. **Improved Maintainability**

   - Smaller files are easier to understand and maintain
   - Each file has a single responsibility

2. **Better Organization**

   - Related functionality is grouped together
   - Follows the existing project structure

3. **Easier Testing**

   - Each function can be tested independently
   - Simplified test setup and assertions

4. **Reduced Cognitive Load**

   - Developers can focus on one aspect at a time
   - Easier to understand the overall flow

5. **Clearer Dependencies**

   - The relationships between different parts of the code become more explicit
   - Easier to see what depends on what

6. **Easier to Fix TypeScript Errors**

   - Smaller files make it easier to identify and fix type issues
   - More focused scope for type checking

7. **Consistency with Existing Codebase**
   - Follows the patterns established in other parts of the codebase
   - Maintains the existing architectural approach

## Timeline and Resources

### Estimated Timeline

- Setup and directory creation: 0.5 day
- Utility function extraction: 0.5 day
- Verification function extraction: 0.5 day
- SQL generation function extraction: 1-2 days
- Main function creation and integration: 0.5 day
- Testing and bug fixing: 1 day
- Documentation and cleanup: 0.5 day
- **Total**: 4-5 days

### Required Resources

- 1 developer familiar with the codebase
- Access to the existing test environment
- Code review from at least one other team member

## Conclusion

This refactoring plan provides a structured approach to breaking down the large `generate-sql-seed-files-fixed.ts` file into smaller, more manageable pieces while maintaining consistency with the existing project structure. The result will be a more maintainable, testable, and understandable codebase.
