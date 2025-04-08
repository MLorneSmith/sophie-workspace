# Quiz ID Consistency Fix Implementation Plan

## Problem Analysis

### Current Issue

We're experiencing a critical issue with quiz ID inconsistency in our content migration system:

1. In the quiz-id-map.json file, the ID for "basic-graphs-quiz" is:

   ```
   "basic-graphs-quiz": "c11dbb26-7561-4d12-88c8-141c653a43fd"
   ```

2. In the 04-questions.sql file, questions reference this same ID:

   ```
   quiz_id = 'c11dbb26-7561-4d12-88c8-141c653a43fd'
   ```

3. However, in the 03-quizzes.sql file, the ID for "basic-graphs-quiz" is completely different:
   ```
   'b48a3ab3-25a8-457f-a510-39ef3311ddb4'
   ```

This inconsistency causes a foreign key constraint violation when the system tries to insert questions with a quiz_id that doesn't exist in the course_quizzes table.

### Root Cause

After examining the code, we've identified the root cause:

1. The system uses a `knownQuizIds` object in `quiz-map-generator.ts` which defines fixed UUIDs for known quizzes
2. In `generate-quizzes-sql.ts`, there's verification code that checks if the quiz ID matches what's in `knownQuizIds`, but it only logs an error and doesn't correct the inconsistency
3. Meanwhile, the questions SQL generator relies on the quiz map which is correctly using the IDs from `knownQuizIds`

This creates a discrepancy where quiz questions reference one ID while the actual quiz tables use a different ID.

## Why a Static Definition System Makes Sense

The current system is unnecessarily complex for what is essentially static content:

1. **Course content is relatively stable**: Quizzes, lessons, and their relationships don't change frequently, making dynamic UUID generation unnecessary
2. **Relationships are known in advance**: We know which quizzes belong to which lessons at development time
3. **Consistency is critical**: Foreign key relationships require absolute consistency between related tables
4. **Simplicity reduces errors**: A declarative approach with a single source of truth is less error-prone than procedural generation
5. **Type safety improves reliability**: Using TypeScript interfaces ensures data integrity at compile time
6. **Verification becomes simpler**: With a single source of truth, verification is straightforward

## Implementation Plan

### Phase 1: Create a Single Source of Truth

#### Step 1: Create Quiz Definition Types and Schema

Create a new file `packages/content-migrations/src/data/definitions/quiz-types.ts`:

```typescript
/**
 * Type definitions for the quiz system
 */

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface QuizDefinition {
  id: string; // Fixed UUID
  slug: string; // Slug for URL and file references
  title: string; // Human-readable title
  description: string; // Description of the quiz
  passingScore: number; // Score needed to pass (percentage)
  questions: QuizQuestion[]; // All questions for this quiz
}

export interface LessonQuizRelation {
  lessonSlug: string;
  quizSlug: string; // References a QuizDefinition's slug
}

// Schema validation functions
export function validateQuizDefinition(quiz: QuizDefinition): boolean {
  // Basic validation
  if (!quiz.id || !quiz.slug || !quiz.title) return false;

  // UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(quiz.id)) return false;

  // Ensure all questions have valid IDs and options
  return quiz.questions.every(
    (q) =>
      !!q.id &&
      !!q.text &&
      Array.isArray(q.options) &&
      q.options.length > 0 &&
      q.correctOptionIndex >= 0 &&
      q.correctOptionIndex < q.options.length,
  );
}
```

#### Step 2: Create the Quiz Definitions Source File

Create `packages/content-migrations/src/data/definitions/quizzes.ts`:

```typescript
import { QuizDefinition } from './quiz-types';

/**
 * Static definitions for all quizzes in the system.
 * This is the SINGLE SOURCE OF TRUTH for quiz data.
 */
export const QUIZZES: Record<string, QuizDefinition> = {
  'basic-graphs-quiz': {
    id: 'c11dbb26-7561-4d12-88c8-141c653a43fd',
    slug: 'basic-graphs-quiz',
    title: 'Basic Graphs',
    description: 'Quiz on basic graph concepts and their applications',
    passingScore: 70,
    questions: [
      {
        id: '8f5e1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b',
        text: 'Which type of graph is best for showing trends over time?',
        options: ['Pie chart', 'Line graph', 'Bar chart', 'Scatter plot'],
        correctOptionIndex: 1,
        explanation:
          'Line graphs are ideal for showing how values change over a continuous period of time.',
      },
      // Add all other questions here
    ],
  },
  // Add all other quizzes following the same pattern
  'elements-of-design-detail-quiz': {
    id: '42564568-76bb-4405-88a9-8e9fd0a9154a',
    slug: 'elements-of-design-detail-quiz',
    title: 'Elements of Design in Detail',
    description: 'Comprehensive quiz on the detailed elements of design',
    passingScore: 75,
    questions: [
      // Questions here
    ],
  },
  // Continue with all other quizzes...
};

// Export a function to get a quiz by slug for convenience
export function getQuizBySlug(slug: string): QuizDefinition | undefined {
  return QUIZZES[slug];
}

// Export a function to get a quiz by ID
export function getQuizById(id: string): QuizDefinition | undefined {
  return Object.values(QUIZZES).find((quiz) => quiz.id === id);
}
```

#### Step 3: Create the Lesson-Quiz Relationships File

Create `packages/content-migrations/src/data/definitions/lesson-quiz-relations.ts`:

```typescript
import { LessonQuizRelation } from './quiz-types';
import { QUIZZES } from './quizzes';

/**
 * Defines which lessons have which quizzes.
 * This is the single source of truth for lesson-quiz relationships.
 */
export const LESSON_QUIZ_RELATIONS: LessonQuizRelation[] = [
  {
    lessonSlug: 'basic-graphs',
    quizSlug: 'basic-graphs-quiz',
  },
  {
    lessonSlug: 'elements-of-design-detail',
    quizSlug: 'elements-of-design-detail-quiz',
  },
  // Add all other lesson-quiz relationships
];

// Validation to ensure all referenced quizzes exist
export function validateLessonQuizRelations(): boolean {
  return LESSON_QUIZ_RELATIONS.every(
    (relation) => !!QUIZZES[relation.quizSlug],
  );
}

// Helper to get the quiz for a lesson
export function getQuizForLesson(lessonSlug: string): string | null {
  const relation = LESSON_QUIZ_RELATIONS.find(
    (r) => r.lessonSlug === lessonSlug,
  );
  return relation ? relation.quizSlug : null;
}

// Helper to get quiz ID for a lesson
export function getQuizIdForLesson(lessonSlug: string): string | null {
  const quizSlug = getQuizForLesson(lessonSlug);
  return quizSlug ? QUIZZES[quizSlug]?.id : null;
}
```

### Phase 2: Create SQL Generation Functions

#### Step 1: Create SQL Generator for Quizzes

Create `packages/content-migrations/src/scripts/sql/generators/new-generate-quizzes-sql.ts`:

```typescript
/**
 * Generator for quizzes SQL using the static quiz definitions
 */
import { QUIZZES } from '../../../data/definitions/quizzes';

/**
 * Generates SQL for quizzes from static definitions
 * @returns SQL for quizzes
 */
export function generateQuizzesSql(): string {
  // Start building the SQL
  let sql = `-- Seed data for the course quizzes table
-- This file is generated from static quiz definitions

-- Start a transaction
BEGIN;

`;

  // Process each quiz from the static definitions
  for (const quiz of Object.values(QUIZZES)) {
    console.log(`Generating SQL for quiz ${quiz.slug} with ID ${quiz.id}`);

    // Add the quiz to the SQL
    sql += `-- Insert quiz: ${quiz.title}
INSERT INTO payload.course_quizzes (
  id,
  title,
  slug,
  description,
  passing_score,
  created_at,
  updated_at
) VALUES (
  '${quiz.id}', -- UUID for the quiz
  '${quiz.title.replace(/'/g, "''")}',
  '${quiz.slug}',
  '${quiz.description.replace(/'/g, "''")}',
  ${quiz.passingScore}, 
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the quiz already exists

`;
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}
```

#### Step 2: Create SQL Generator for Questions

Create `packages/content-migrations/src/scripts/sql/generators/new-generate-questions-sql.ts`:

```typescript
/**
 * Generator for quiz questions SQL using the static quiz definitions
 */
import { QUIZZES } from '../../../data/definitions/quizzes';

/**
 * Generates SQL for quiz questions from static definitions
 * @returns SQL for quiz questions
 */
export function generateQuestionsSql(): string {
  // Start building the SQL
  let sql = `-- Seed data for the quiz questions table
-- This file is generated from static quiz definitions

-- Start a transaction
BEGIN;

`;

  // Process each quiz from the static definitions
  for (const quiz of Object.values(QUIZZES)) {
    console.log(
      `Generating SQL for ${quiz.questions.length} questions in quiz ${quiz.slug}`,
    );

    // Process each question in the quiz
    for (const question of quiz.questions) {
      // Add the question to the SQL
      sql += `-- Insert question for quiz: ${quiz.title}
INSERT INTO payload.quiz_questions (
  id,
  quiz_id,
  question_text,
  options,
  correct_option_index,
  explanation,
  created_at,
  updated_at
) VALUES (
  '${question.id}', -- UUID for the question
  '${quiz.id}', -- UUID of the parent quiz
  '${question.text.replace(/'/g, "''")}',
  ARRAY[${question.options.map((opt) => `'${opt.replace(/'/g, "''")}'`).join(', ')}],
  ${question.correctOptionIndex},
  ${question.explanation ? `'${question.explanation.replace(/'/g, "''")}'` : 'NULL'},
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the question already exists

`;
    }
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}
```

#### Step 3: Create SQL Generator for Lesson-Quiz References

Create `packages/content-migrations/src/scripts/sql/generators/new-generate-lesson-quiz-references-sql.ts`:

```typescript
/**
 * Generator for lesson-quiz references SQL using the static definitions
 */
import { LESSON_QUIZ_RELATIONS } from '../../../data/definitions/lesson-quiz-relations';
import { QUIZZES } from '../../../data/definitions/quizzes';

/**
 * Generates SQL for lesson-quiz references from static definitions
 * @returns SQL for lesson-quiz references
 */
export function generateLessonQuizReferencesSql(): string {
  // Start building the SQL
  let sql = `-- Seed data for lesson-quiz references
-- This file is generated from static lesson-quiz relation definitions

-- Start a transaction
BEGIN;

`;

  // Process each lesson-quiz relation
  for (const relation of LESSON_QUIZ_RELATIONS) {
    const quiz = QUIZZES[relation.quizSlug];
    if (!quiz) {
      console.error(
        `Error: Quiz ${relation.quizSlug} not found for lesson ${relation.lessonSlug}`,
      );
      continue;
    }

    console.log(
      `Generating SQL for lesson ${relation.lessonSlug} referencing quiz ${relation.quizSlug}`,
    );

    // Add the reference to the SQL
    sql += `-- Update lesson to reference quiz
UPDATE payload.course_lessons
SET quiz_id = '${quiz.id}'
WHERE slug = '${relation.lessonSlug}';

`;
  }

  // End the transaction
  sql += `-- Commit the transaction
COMMIT;
`;

  return sql;
}
```

### Phase 3: Create Main Generator and Verification

#### Step 1: Create the Main SQL Generation Function

Create `packages/content-migrations/src/scripts/sql/new-generate-sql-seed-files.ts`:

```typescript
/**
 * Main SQL seed files generator using static definitions
 */
import fs from 'fs';
import path from 'path';

import {
  LESSON_QUIZ_RELATIONS,
  validateLessonQuizRelations,
} from '../../data/definitions/lesson-quiz-relations';
import { validateQuizDefinition } from '../../data/definitions/quiz-types';
import { QUIZZES } from '../../data/definitions/quizzes';
import { generateLessonQuizReferencesSql } from './generators/new-generate-lesson-quiz-references-sql';
import { generateQuestionsSql } from './generators/new-generate-questions-sql';
import { generateQuizzesSql } from './generators/new-generate-quizzes-sql';

/**
 * Main function to generate all SQL seed files
 * @param outputDir Directory to write SQL files to
 */
export async function generateSqlSeedFiles(outputDir: string): Promise<void> {
  console.log('Generating SQL seed files from static definitions...');

  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Step 1: Validate quiz definitions
  console.log('Validating quiz definitions...');
  const allQuizzesValid = Object.values(QUIZZES).every(validateQuizDefinition);
  if (!allQuizzesValid) {
    throw new Error('Invalid quiz definitions found');
  }

  // Step 2: Validate lesson-quiz relations
  console.log('Validating lesson-quiz relations...');
  if (!validateLessonQuizRelations()) {
    throw new Error('Invalid lesson-quiz relations found');
  }

  // Step 3: Generate and write SQL files
  console.log('Generating SQL files...');

  // 3.1: Generate quizzes SQL
  const quizzesSql = generateQuizzesSql();
  fs.writeFileSync(path.join(outputDir, '03-quizzes.sql'), quizzesSql);
  console.log('Generated quizzes SQL file');

  // 3.2: Generate questions SQL
  const questionsSql = generateQuestionsSql();
  fs.writeFileSync(path.join(outputDir, '04-questions.sql'), questionsSql);
  console.log('Generated questions SQL file');

  // 3.3: Generate lesson-quiz references SQL
  const referencesSql = generateLessonQuizReferencesSql();
  fs.writeFileSync(
    path.join(outputDir, '03a-lesson-quiz-references.sql'),
    referencesSql,
  );
  console.log('Generated lesson-quiz references SQL file');

  console.log('All SQL seed files generated successfully!');
}

// Add a CLI entrypoint if needed
if (require.main === module) {
  // Default output directory
  const outputDir =
    process.argv[2] || path.resolve(process.cwd(), 'apps/payload/src/seed');

  generateSqlSeedFiles(outputDir)
    .then(() => console.log('Done!'))
    .catch((err) => {
      console.error('Error generating SQL seed files:', err);
      process.exit(1);
    });
}
```

#### Step 2: Create Verification Tool

Create `packages/content-migrations/src/scripts/verification/verify-quiz-system-integrity.ts`:

```typescript
/**
 * Verification tool for the quiz system integrity
 */
import fs from 'fs';
import path from 'path';

import {
  LESSON_QUIZ_RELATIONS,
  validateLessonQuizRelations,
} from '../../data/definitions/lesson-quiz-relations';
import { validateQuizDefinition } from '../../data/definitions/quiz-types';
import {
  QUIZZES,
  getQuizById,
  getQuizBySlug,
} from '../../data/definitions/quizzes';

/**
 * Performs comprehensive verification of the quiz system
 */
export function verifyQuizSystemIntegrity(): boolean {
  console.log('Verifying quiz system integrity...');
  let allValid = true;

  // Step 1: Verify all quiz definitions are valid
  console.log('Verifying quiz definitions...');
  for (const [slug, quiz] of Object.entries(QUIZZES)) {
    if (!validateQuizDefinition(quiz)) {
      console.error(`Invalid quiz definition for ${slug}`);
      allValid = false;
    }

    // Verify slug consistency
    if (quiz.slug !== slug) {
      console.error(
        `Slug mismatch for quiz ${slug}: object key is ${slug} but internal slug is ${quiz.slug}`,
      );
      allValid = false;
    }
  }

  // Step 2: Verify quiz IDs are unique
  console.log('Verifying quiz IDs are unique...');
  const quizIds = new Set<string>();
  for (const quiz of Object.values(QUIZZES)) {
    if (quizIds.has(quiz.id)) {
      console.error(`Duplicate quiz ID: ${quiz.id} (${quiz.slug})`);
      allValid = false;
    }
    quizIds.add(quiz.id);

    // Verify question IDs are unique within the quiz
    const questionIds = new Set<string>();
    for (const question of quiz.questions) {
      if (questionIds.has(question.id)) {
        console.error(
          `Duplicate question ID in quiz ${quiz.slug}: ${question.id}`,
        );
        allValid = false;
      }
      questionIds.add(question.id);
    }
  }

  // Step 3: Verify lesson-quiz relations
  console.log('Verifying lesson-quiz relations...');
  if (!validateLessonQuizRelations()) {
    console.error('Invalid lesson-quiz relations');
    allValid = false;
  }

  // Step 4: Verify lookup functions work correctly
  console.log('Verifying lookup functions...');
  for (const quiz of Object.values(QUIZZES)) {
    const bySlug = getQuizBySlug(quiz.slug);
    if (!bySlug || bySlug.id !== quiz.id) {
      console.error(`getQuizBySlug failed for ${quiz.slug}`);
      allValid = false;
    }

    const byId = getQuizById(quiz.id);
    if (!byId || byId.slug !== quiz.slug) {
      console.error(`getQuizById failed for ${quiz.id}`);
      allValid = false;
    }
  }

  if (allValid) {
    console.log('Quiz system integrity verified successfully!');
  } else {
    console.error('Quiz system integrity verification failed!');
  }

  return allValid;
}

// CLI entrypoint
if (require.main === module) {
  const result = verifyQuizSystemIntegrity();
  process.exit(result ? 0 : 1);
}
```

### Phase 4: Integration with reset-and-migrate.ps1

Update the reset-and-migrate.ps1 script to use the new SQL generation system:

```powershell
# ... existing script content ...

# Use the new SQL generation system
Write-Host "Generating SQL seed files using static quiz definitions..." -ForegroundColor Blue
pnpm --filter content-migrations exec tsx src/scripts/sql/new-generate-sql-seed-files.ts

# Verify quiz system integrity before proceeding
Write-Host "Verifying quiz system integrity..." -ForegroundColor Blue
pnpm --filter content-migrations exec tsx src/scripts/verification/verify-quiz-system-integrity.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "Quiz system integrity verification failed! Aborting migration." -ForegroundColor Red
    exit 1
}

# ... continue with the rest of the script ...
```

### Phase 5: Testing and Validation

Create a test plan in `packages/content-migrations/src/tests/quiz-system-test-plan.md`:

```markdown
# Quiz System Test Plan

## Unit Tests

1. **Quiz Definition Validation**

   - Test that valid quiz definitions pass validation
   - Test that invalid quiz definitions fail validation
   - Test edge cases (empty questions, invalid option indices, etc.)

2. **Lesson-Quiz Relation Validation**

   - Test that valid relations pass validation
   - Test that references to non-existent quizzes fail validation

3. **SQL Generation**
   - Test that SQL is generated correctly
   - Test that IDs are consistent between files
   - Test SQL syntax validity

## Integration Tests

1. **Full Migration Process**

   - Test the full reset-and-migrate.ps1 script
   - Verify database state after migration
   - Verify foreign key constraints are satisfied

2. **API Tests**
   - Test that quizzes can be loaded from the API
   - Test that questions are correctly associated with quizzes
   - Test that lessons reference the correct quizzes

## Manual Verification

1. **Database Inspection**

   - Manually inspect database tables to ensure consistency
   - Verify that the IDs in the database match those in the static definitions

2. **UI Testing**
   - Verify quizzes display correctly in the UI
   - Verify questions are correctly associated with their quizzes
   - Verify navigation between lessons and quizzes
```

## Implementation Timeline

1. **Week 1: Foundation**

   - Develop quiz types and interfaces
   - Create initial static quiz definitions
   - Set up validation functions

2. **Week 2: SQL Generation**

   - Implement new SQL generators
   - Create verification tools
   - Test SQL output

3. **Week 3: Integration**

   - Update reset-and-migrate.ps1
   - Create comprehensive test suite

4. **Week 4: Testing and Rollout**
   - Run full test suite
   - Update documentation
   - Deploy to test environment
   - Final verification

## Success Metrics

1. **Consistency**: No ID mismatches between quiz and question SQL files
2. **Simplicity**: Reduced code complexity and potential error sources
3. **Maintainability**: Clear, single source of truth for quiz data
4. **Reliability**: Robust verification and validation at build time

## Advantages Over Current System

1. **Eliminates Dynamic ID Generation**: By using predefined IDs, we eliminate the possibility of ID mismatches
2. **Type Safety**: TypeScript interfaces ensure data integrity at compile time
3. **Single Source of Truth**: All quiz data comes from one place, eliminating inconsistencies
4. **Simplified Debugging**: When issues occur, there's only one place to look
5. **Better Developer Experience**: Clear, declarative definitions are easier to understand and modify
6. **Stronger Validation**: Comprehensive validation ensures data integrity before SQL generation

## Conclusion

The proposed static quiz definition system addresses the root cause of the quiz ID inconsistency by replacing the dynamic, procedural generation approach with a declarative, type-safe system. This approach is more appropriate for course content that doesn't change frequently and has known relationships.

By implementing this system, we'll eliminate the foreign key constraint violations and create a more maintainable, reliable content migration process.
