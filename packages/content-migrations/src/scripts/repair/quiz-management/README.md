# Quiz Management Scripts

## Overview

This directory contains scripts for managing and repairing quiz-related data integrity issues in the database. These scripts have been organized into logical subdirectories to improve maintainability and clarity.

## Directory Structure

```
quiz-management/
├── core/                         # Core functionality
│   ├── direct-quiz-fix.sql       # Direct SQL fix for quiz relationships
│   ├── run-direct-quiz-fix.ts    # Runner for direct SQL fix
│   ├── fix-quiz-course-ids.sql   # SQL for quiz course ID fixes
│   ├── fix-quiz-course-ids.ts    # TypeScript for quiz course ID fixes
│   └── fix-course-quiz-relationships.* # Course-quiz relationship fixes
├── lesson-quiz-relationships/    # Lesson-quiz relationship scripts
│   ├── fix-lesson-quiz-field-name.ts   # Field name fixes
│   ├── fix-lesson-quiz-references.ts   # Reference fixes
│   └── fix-lessons-quiz-references-sql.ts # SQL-based fixes
├── question-relationships/       # Question relationship scripts
│   ├── fix-quiz-question-relationships.ts # Main quiz-question fixes
│   ├── fix-questions-quiz-references.ts   # Question reference fixes
│   └── fix-quizzes-without-questions.ts   # Handle empty quizzes
├── utilities/                    # Support scripts
│   ├── fix-invalid-quiz-references.ts      # Invalid reference fixes
│   └── fix-quiz-id-consistency.ts          # ID consistency utilities
└── backup/                       # Deprecated scripts (kept for reference)
    └── ... deprecated scripts ...
```

## Core Scripts

These scripts handle the fundamental quiz relationship fixes:

- **`fix-quiz-course-ids.ts/sql`**: Ensures all quizzes have proper course IDs in both direct storage and relationship tables.
- **`fix-course-quiz-relationships.ts/sql`**: Comprehensive fix for course-quiz relationships, handling bidirectional relationships.
- **`run-direct-quiz-fix.ts/direct-quiz-fix.sql`**: Direct SQL approach for fixing quiz relationships (used by the reset-and-migrate script).

## Lesson-Quiz Relationship Scripts

Scripts that handle relationships between lessons and quizzes:

- **`fix-lesson-quiz-field-name.ts`**: Fixes field name issues in lesson-quiz relationships.
- **`fix-lesson-quiz-references.ts`**: Repairs lesson references to quizzes.
- **`fix-lessons-quiz-references-sql.ts`**: SQL implementation for fixing lesson-quiz references.

## Question-Relationships Scripts

Scripts that handle relationships between quizzes and questions:

- **`fix-quiz-question-relationships.ts`**: Fixes specific quiz-question relationship issues.
- **`fix-questions-quiz-references.ts`**: Repairs question references to quizzes.
- **`fix-quizzes-without-questions.ts`**: Addresses cases where quizzes don't have questions.

## Utility Scripts

Supporting scripts that provide specific functionality:

- **`fix-invalid-quiz-references.ts`**: Fixes invalid references to quizzes.
- **`fix-quiz-id-consistency.ts`**: Ensures quiz IDs match across different tables.

## Usage

These scripts are primarily used by the content migration system through the `reset-and-migrate.ps1` PowerShell script. The script execution order has been carefully designed to address dependencies between different types of relationships.

### Manual Execution

To manually run these scripts for troubleshooting:

```bash
# Core fixes
pnpm run fix:quiz-course-ids          # Fix course IDs for quizzes
pnpm run fix:course-quiz-relationships # Fix course-quiz relationships
pnpm run fix:direct-quiz-fix          # Apply direct quiz fix

# Lesson-quiz relationship fixes
pnpm run fix:lesson-quiz-field-name   # Fix lesson-quiz field names
pnpm run fix:lesson-quiz-references   # Fix lesson-quiz references

# Question-relationship fixes
pnpm run fix:quiz-question-relationships # Fix quiz-question relationships
pnpm run fix:quizzes-without-questions  # Fix quizzes without questions

# Utility functions
pnpm run fix:quiz-id-consistency      # Ensure quiz ID consistency
pnpm run fix:invalid-quiz-references  # Fix invalid quiz references
```

## Architecture Notes

The quiz data structure uses a dual-storage approach in Payload CMS:

1. **Direct field storage**: Values stored directly in the main table columns (e.g., `course_id_id` in `course_quizzes` table)
2. **Relationship tables**: Relationships stored in separate tables with references (e.g., entries in `course_quizzes_rels`)

Many of the repair scripts ensure both storage mechanisms contain consistent data.
