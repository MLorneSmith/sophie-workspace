# Quiz Management Scripts

## Overview

This directory contains scripts for managing and repairing quiz-related data integrity issues in the database. These scripts have been organized into logical subdirectories to improve maintainability and clarity.

## Relationship Architecture

The quiz system now uses a **unidirectional relationship model**:

- Quizzes reference questions (parent → children)
- Questions do not reference quizzes (no back-reference)
- Relationships stored in both:
  - Quiz's `questions` array field
  - `course_quizzes_rels` table entries

## Directory Structure

```
quiz-management/
├── core/                         # Core functionality
│   ├── direct-quiz-fix.sql       # Direct SQL fix for quiz relationships
│   ├── run-direct-quiz-fix.ts    # Runner for direct SQL fix
│   ├── fix-quiz-course-ids.sql   # SQL for quiz course ID fixes
│   ├── fix-quiz-course-ids.ts    # TypeScript for quiz course ID fixes
│   ├── fix-unidirectional-quiz-questions.ts # Comprehensive unidirectional relationship fix
│   └── fix-course-quiz-relationships.* # Course-quiz relationship fixes
├── lesson-quiz-relationships/    # Lesson-quiz relationship scripts
│   ├── fix-lesson-quiz-field-name.ts   # Field name fixes
│   ├── fix-lesson-quiz-references.ts   # Reference fixes
│   └── fix-lessons-quiz-references-sql.ts # SQL-based fixes
├── question-relationships/       # Question relationship scripts
│   ├── fix-quiz-question-relationships.ts # Deprecated: Uses bidirectional approach
│   ├── fix-questions-quiz-references.ts   # Deprecated: Question reference fixes
│   └── fix-quizzes-without-questions.ts   # Deprecated: Handle empty quizzes
├── utilities/                    # Support scripts
│   ├── fix-invalid-quiz-references.ts      # Invalid reference fixes
│   └── fix-quiz-id-consistency.ts          # ID consistency utilities
└── backup/                       # Deprecated scripts (kept for reference)
    └── ... deprecated scripts ...
```

## Core Scripts

### Primary Recommended Scripts

- **`fix-unidirectional-quiz-questions.ts`**: Comprehensive fix ensuring all quiz-question relationships follow the unidirectional model. This script:

  - Ensures quizzes properly reference their questions in the `questions` array
  - Verifies relationship entries in `course_quizzes_rels` table
  - Updates question order for proper sorting
  - Provides detailed verification reporting

- **`fix-quiz-course-ids.ts/sql`**: Ensures all quizzes have proper course IDs in both direct storage and relationship tables.

- **`fix-course-quiz-relationships.ts/sql`**: Comprehensive fix for course-quiz relationships, handling bidirectional relationships.

- **`run-direct-quiz-fix.ts/direct-quiz-fix.sql`**: Direct SQL approach for fixing quiz relationships (used by the reset-and-migrate script).

## Deprecated Scripts

The following scripts have been replaced by the comprehensive `fix-unidirectional-quiz-questions.ts` script:

- ~~`fix-quiz-question-relationships.ts`~~: Used bidirectional model, incompatible with current architecture
- ~~`fix-questions-quiz-references.ts`~~: Attempted to fix references in removed `quiz_id` field
- ~~`fix-quizzes-without-questions.ts`~~: Now handled as part of comprehensive solution

## Usage

These scripts are primarily used by the content migration system through the `reset-and-migrate.ps1` PowerShell script. The script execution order has been carefully designed to address dependencies between different types of relationships.

### Manual Execution

To manually run the comprehensive unidirectional quiz-question fix:

```bash
# Run the comprehensive unidirectional fix (recommended approach)
pnpm run fix:unidirectional-quiz-questions

# Other quiz-related fixes if needed
pnpm run fix:quiz-course-ids          # Fix course IDs for quizzes
pnpm run fix:course-quiz-relationships # Fix course-quiz relationships
pnpm run fix:direct-quiz-fix          # Apply direct quiz fix

# Lesson-quiz relationship fixes
pnpm run fix:lesson-quiz-relationships-comprehensive   # Fix lesson-quiz references
```

## Architecture Notes

The quiz data structure uses a dual-storage approach in Payload CMS:

1. **Direct field storage**: Values stored directly in the main table columns (e.g., `questions` array in `course_quizzes` table)
2. **Relationship tables**: Relationships stored in separate tables with references (e.g., entries in `course_quizzes_rels`)

The repair scripts ensure both storage mechanisms contain consistent data following the unidirectional model.
