# Quiz Management Scripts

This directory contains scripts that repair quiz-related data and relationships. These scripts address various issues related to quiz consistency, relationships between quizzes and questions, and the integration of quizzes with courses and lessons.

## Script Purposes

| Script                                     | Purpose                                                               |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `fix-quiz-id-consistency.ts`               | Ensures that quiz IDs are consistent across all collections           |
| `fix-quiz-question-relationships.ts`       | Repairs the relationships between quizzes and their questions         |
| `fix-quiz-relationships-complete.ts`       | Comprehensive fix for all quiz relationships                          |
| `fix-quizzes-without-questions.ts`         | Handles cases where quizzes exist without any associated questions    |
| `fix-quiz-course-ids.ts`                   | Ensures quizzes have correct course IDs                               |
| `fix-course-ids-final.ts`                  | Final cleanup of course IDs after other fixes                         |
| `fix-course-quiz-relationships.ts`         | Repairs relationships between courses and quizzes                     |
| `fix-unidirectional-quiz-relationships.ts` | Addresses cases where relationships are only defined in one direction |
| `fix-invalid-quiz-references.ts`           | Fixes references to quizzes that no longer exist or have invalid IDs  |
| `fix-lesson-quiz-field-name.ts`            | Ensures consistent field names for quiz references in lessons         |
| `run-direct-quiz-fix.ts`                   | Direct SQL-based fix for critical quiz relationship issues            |

## Running Order

The scripts in this directory should generally be run in the following order:

1. `fix-quiz-id-consistency.ts` - First establish consistent IDs
2. `fix-quiz-question-relationships.ts` - Fix basic quiz-question connections
3. `fix-quizzes-without-questions.ts` - Handle edge cases with missing questions
4. `fix-quiz-course-ids.ts` - Ensure quizzes are associated with the right courses
5. `fix-course-quiz-relationships.ts` - Fix course-to-quiz connections
6. `fix-unidirectional-quiz-relationships.ts` - Address one-sided relationships
7. `fix-invalid-quiz-references.ts` - Clean up any remaining invalid references
8. `fix-lesson-quiz-field-name.ts` - Ensure consistent field naming
9. `run-direct-quiz-fix.ts` - Apply direct fixes for any remaining issues
10. `fix-course-ids-final.ts` - Final cleanup

## Background

These fixes address issues documented in the quiz-related implementation plans:

- `z.plan/quizzes/8-course-id-hooks-implementation-plan.md`
- `z.plan/quizzes/9-unidirectional-relationship-implementation-plan.md`
- `z.plan/quizzes/10-unidirectional-quiz-relationship-fix-plan.md`
- `z.plan/quizzes/11-dual-storage-relationship-fix-plan.md`

Some of the key challenges addressed by these scripts include:

- Ensuring bidirectional relationships work correctly
- Handling the dual storage of relationship data (both in object fields and relationship tables)
- Managing course context for quizzes
- Addressing race conditions in relationship updates
