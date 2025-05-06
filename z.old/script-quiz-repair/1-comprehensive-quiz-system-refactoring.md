# Comprehensive Quiz Relationship System Refactoring

## 1. Problem Analysis

After investigating the NextJS errors and Payload CMS "Nothing Found" issues, we've identified the following key problems:

### Core Issue

The bidirectional relationship between quizzes and questions is broken:

- The `course_quizzes_rels` table contains entries (quiz → question relationship)
- The `quiz_questions_rels` table is completely empty (question → quiz relationship)
- This results in Payload API 404 errors when attempting to fetch quizzes

### Database Evidence

1. The quiz records exist in the database (e.g., "The Who Quiz" with ID `d5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0`)
2. The question records exist in the database with appropriate structure
3. One-way relationships exist from quizzes to questions in `course_quizzes_rels`
4. Reverse relationships are completely missing in `quiz_questions_rels`
5. JSONB format inconsistencies exist between the questions array in quiz records and the actual relationship tables

### Script System Issues

The current content migration system has multiple overlapping scripts addressing quiz relationships:

1. Scripts that establish primary relationships:
   - `fix:quiz-array-relationships`
   - `quiz:fix:corrected`
2. Scripts that create bidirectional relationships:

   - `fix:bidirectional-quiz-relationships`
   - `fix:quiz-paths-and-relationships`
   - `fix:enhanced-quiz-paths-and-relationships`

3. Scripts that format JSONB data:
   - `fix:questions-jsonb-comprehensive`
   - Various fallback scripts

These scripts have implicit dependencies and make assumptions about database state, which leads to brittle behavior when the database is reset.

### Root Cause Analysis

1. **Script execution order conflict**: Scripts run in a sequence that doesn't respect dependencies:

   - Bidirectional relationship scripts assume primary relationships already exist
   - When primary relationships aren't properly established, bidirectional scripts fail silently

2. **Table state assumptions**: The `fix:bidirectional-quiz-relationships` script assumes it can find records in `course_quizzes_rels` to create reverse relationships in `quiz_questions_rels`, but it doesn't handle the case when the target table is completely empty.

3. **Proliferation of scripts**: Multiple scripts with overlapping responsibilities create a complex system that's difficult to reason about and maintain.

## 2. Decision

After analyzing the issues, we've decided to:

1. **Completely refactor the quiz relationship script system** into a single, cohesive module with clear responsibilities
2. **Replace the current multiple script approach** with a unified system that follows a clear sequence of operations
3. **Ensure the new system can work with an empty database** and doesn't depend on existing relationships
4. **Deprecate and eventually remove the old scripts** to reduce complexity and prevent future conflicts

This approach will:

- Simplify the content migration system
- Reduce the chances of relationship errors
- Make the system more robust to database resets
- Provide clearer debugging and verification capabilities

## 3. Implementation Plan

### 3.1 New Directory Structure

```
packages/content-migrations/src/scripts/repair/quiz-system/
├── index.ts                  # Main entry point
├── types.ts                  # Type definitions
├── detection.ts              # Quiz relationship detection
├── primary-relationships.ts  # Quiz → Question relationships
├── bidirectional.ts          # Question → Quiz relationships
├── jsonb-format.ts           # JSONB format consistency
├── verification.ts           # Comprehensive verification
└── utils/                    # Shared utilities
```

### 3.2 Component Responsibilities

#### 3.2.1 Quiz System Manager (`index.ts`)

- Provides a single entry point for all quiz relationship management
- Orchestrates the entire process in the correct sequence
- Handles transactions, logging, and error recovery
- Exposes clean API for the content migration system

```typescript
export async function repairQuizSystem(
  options: RepairOptions = {},
): Promise<RepairResult> {
  const { skipVerification, continueOnError, dryRun } = options;

  try {
    // Start transaction if not dry run
    if (!dryRun) await db.query('BEGIN');

    // 1. Detect current state
    const state = await detectQuizRelationships();

    // 2. Fix primary relationships (quiz → question)
    const primaryResult = await fixPrimaryRelationships(state);

    // 3. Fix bidirectional relationships (question → quiz)
    const bidirectionalResult = await fixBidirectionalRelationships(state);

    // 4. Fix JSONB format
    const jsonbResult = await fixJsonbFormat(state);

    // 5. Verify if requested
    let verificationResult = null;
    if (!skipVerification) {
      verificationResult = await verifyQuizSystem();
      if (!verificationResult.success && !continueOnError) {
        throw new Error('Verification failed: ' + verificationResult.message);
      }
    }

    // Commit transaction if not dry run
    if (!dryRun) await db.query('COMMIT');

    return {
      success: true,
      primaryResult,
      bidirectionalResult,
      jsonbResult,
      verificationResult,
    };
  } catch (error) {
    // Rollback transaction if not dry run
    if (!dryRun) await db.query('ROLLBACK');
    throw error;
  }
}
```

#### 3.2.2 Relationship Detection (`detection.ts`)

- Analyzes database to identify quiz and question entities
- Determines current state of relationships
- Identifies issues that need to be fixed

```typescript
export async function detectQuizRelationships(): Promise<QuizSystemState> {
  // Get all quizzes
  const quizzes = await db.query(
    `SELECT id, title, slug, questions FROM payload.course_quizzes`,
  );

  // Get all questions
  const questions = await db.query(
    `SELECT id, question FROM payload.quiz_questions`,
  );

  // Get existing quiz-to-question relationships
  const quizToQuestionRels = await db.query(`
    SELECT _parent_id, quiz_questions_id 
    FROM payload.course_quizzes_rels 
    WHERE quiz_questions_id IS NOT NULL
  `);

  // Get existing question-to-quiz relationships
  const questionToQuizRels = await db.query(`
    SELECT _parent_id, value 
    FROM payload.quiz_questions_rels 
    WHERE field = 'quiz_id'
  `);

  // Map relationships
  const quizToQuestions = mapQuizToQuestions(quizToQuestionRels);
  const questionToQuiz = mapQuestionToQuiz(questionToQuizRels);

  // Identify issues
  const issues = identifyRelationshipIssues(
    quizzes,
    questions,
    quizToQuestions,
    questionToQuiz,
  );

  return {
    quizzes,
    questions,
    quizToQuestions,
    questionToQuiz,
    issues,
  };
}
```

#### 3.2.3 Primary Relationships (`primary-relationships.ts`)

- Establishes quiz → question relationships
- Creates entries in `course_quizzes_rels`
- Doesn't depend on pre-existing relationships

```typescript
export async function fixPrimaryRelationships(
  state: QuizSystemState,
): Promise<PrimaryRepairResult> {
  // Insert quiz-to-question relationships
  const result = await db.query(`
    INSERT INTO payload.course_quizzes_rels (id, _parent_id, quiz_questions_id, path, created_at, updated_at)
    SELECT
        gen_random_uuid()::text as id,
        q.id as _parent_id,
        qq.id as quiz_questions_id,
        'questions' as path,
        NOW() as created_at,
        NOW() as updated_at
    FROM
        payload.course_quizzes q
    CROSS JOIN LATERAL (
        -- Extract the quiz_questions_id from the JSONB questions field
        SELECT jsonb_array_elements(q.questions)->>'id' as question_id
    ) as extracted_ids
    JOIN
        payload.quiz_questions qq ON qq.id = extracted_ids.question_id
    WHERE
        -- Only create relationships that don't already exist
        NOT EXISTS (
            SELECT 1 FROM payload.course_quizzes_rels cqr
            WHERE cqr._parent_id = q.id AND cqr.quiz_questions_id = qq.id
        )
    RETURNING *;
  `);

  return {
    relationshipsCreated: result.rowCount,
    newRelationships: result.rows,
  };
}
```

#### 3.2.4 Bidirectional Relationships (`bidirectional.ts`)

- Creates question → quiz relationships
- Creates entries in `quiz_questions_rels`
- Can work even if relationships don't exist

```typescript
export async function fixBidirectionalRelationships(
  state: QuizSystemState,
): Promise<BidirectionalRepairResult> {
  // Insert question-to-quiz relationships
  const result = await db.query(`
    INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, created_at, updated_at)
    SELECT
        gen_random_uuid()::text as id,
        cqr.quiz_questions_id as _parent_id,
        'quiz_id' as field,
        cqr._parent_id as value,
        NOW() as created_at,
        NOW() as updated_at
    FROM
        payload.course_quizzes_rels cqr
    WHERE
        cqr.path = 'questions'
        AND cqr.quiz_questions_id IS NOT NULL
        -- Only create relationships that don't already exist
        AND NOT EXISTS (
            SELECT 1 FROM payload.quiz_questions_rels qqr
            WHERE qqr._parent_id = cqr.quiz_questions_id
            AND qqr.field = 'quiz_id'
            AND qqr.value = cqr._parent_id
        )
    RETURNING *;
  `);

  return {
    relationshipsCreated: result.rowCount,
    newRelationships: result.rows,
  };
}
```

#### 3.2.5 JSONB Format (`jsonb-format.ts`)

- Ensures JSONB arrays match relationship tables
- Updates quiz records with consistent question data
- Handles various JSONB format scenarios

```typescript
export async function fixJsonbFormat(
  state: QuizSystemState,
): Promise<JsonbFormatResult> {
  // Update quiz JSONB format
  const result = await db.query(`
    WITH updated_quizzes AS (
      UPDATE payload.course_quizzes q
      SET questions = (
          SELECT jsonb_agg(
              jsonb_build_object(
                  'id', qq.id,
                  'question', qq.question,
                  'options', qq.options,
                  'correct_answer', qq.correct_answer,
                  'type', qq.type,
                  'explanation', qq.explanation
              )
          )
          FROM payload.course_quizzes_rels cqr
          JOIN payload.quiz_questions qq ON qq.id = cqr.quiz_questions_id
          WHERE cqr._parent_id = q.id AND cqr.path = 'questions'
      )
      WHERE EXISTS (
          SELECT 1 FROM payload.course_quizzes_rels cqr
          WHERE cqr._parent_id = q.id AND cqr.path = 'questions'
      )
      RETURNING id, title, slug
    )
    SELECT * FROM updated_quizzes;
  `);

  return {
    quizzesUpdated: result.rowCount,
    updatedQuizzes: result.rows,
  };
}
```

#### 3.2.6 Verification (`verification.ts`)

- Verifies relationship integrity after each phase
- Provides detailed reporting on fixed issues
- Identifies any remaining problems

```typescript
export async function verifyQuizSystem(): Promise<VerificationResult> {
  // Check primary relationships
  const primaryCheck = await db.query(`
    SELECT q.id, q.title, 
           (SELECT COUNT(*) FROM jsonb_array_elements(q.questions)) as array_count,
           (SELECT COUNT(*) FROM payload.course_quizzes_rels cqr WHERE cqr._parent_id = q.id) as rel_count
    FROM payload.course_quizzes q
    WHERE (SELECT COUNT(*) FROM jsonb_array_elements(q.questions)) != 
          (SELECT COUNT(*) FROM payload.course_quizzes_rels cqr WHERE cqr._parent_id = q.id)
  `);

  // Check bidirectional relationships
  const bidirectionalCheck = await db.query(`
    SELECT cqr._parent_id as quiz_id, cqr.quiz_questions_id as question_id
    FROM payload.course_quizzes_rels cqr
    LEFT JOIN payload.quiz_questions_rels qqr 
      ON qqr._parent_id = cqr.quiz_questions_id 
      AND qqr.value = cqr._parent_id
      AND qqr.field = 'quiz_id'
    WHERE cqr.quiz_questions_id IS NOT NULL
    AND qqr.id IS NULL
  `);

  const issues = [...primaryCheck.rows, ...bidirectionalCheck.rows];

  return {
    success: issues.length === 0,
    issues,
    message:
      issues.length === 0
        ? 'All quiz relationships are valid'
        : `Found ${issues.length} relationship issues`,
  };
}
```

### 3.3 Database SQL Implementation

#### Primary Relationships SQL

```sql
-- Insert entries in course_quizzes_rels to establish quiz → question relationships
INSERT INTO payload.course_quizzes_rels (id, _parent_id, quiz_questions_id, path, created_at, updated_at)
SELECT
    gen_random_uuid()::text as id,
    q.id as _parent_id,
    qq.id as quiz_questions_id,
    'questions' as path,
    NOW() as created_at,
    NOW() as updated_at
FROM
    payload.course_quizzes q
CROSS JOIN LATERAL (
    -- Extract the quiz_questions_id from the JSONB questions field
    SELECT jsonb_array_elements(q.questions)->>'id' as question_id
) as extracted_ids
JOIN
    payload.quiz_questions qq ON qq.id = extracted_ids.question_id
WHERE
    -- Only create relationships that don't already exist
    NOT EXISTS (
        SELECT 1 FROM payload.course_quizzes_rels cqr
        WHERE cqr._parent_id = q.id AND cqr.quiz_questions_id = qq.id
    );
```

#### Bidirectional Relationships SQL

```sql
-- Insert entries in quiz_questions_rels to establish question → quiz relationships
INSERT INTO payload.quiz_questions_rels (id, _parent_id, field, value, created_at, updated_at)
SELECT
    gen_random_uuid()::text as id,
    cqr.quiz_questions_id as _parent_id,
    'quiz_id' as field,
    cqr._parent_id as value,
    NOW() as created_at,
    NOW() as updated_at
FROM
    payload.course_quizzes_rels cqr
WHERE
    cqr.path = 'questions'
    AND cqr.quiz_questions_id IS NOT NULL
    -- Only create relationships that don't already exist
    AND NOT EXISTS (
        SELECT 1 FROM payload.quiz_questions_rels qqr
        WHERE qqr._parent_id = cqr.quiz_questions_id
        AND qqr.field = 'quiz_id'
        AND qqr.value = cqr._parent_id
    );
```

#### JSONB Format SQL

```sql
-- Update quiz JSONB format to match relationships
UPDATE payload.course_quizzes q
SET questions = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', qq.id,
            'question', qq.question,
            'options', qq.options,
            'correct_answer', qq.correct_answer,
            'type', qq.type,
            'explanation', qq.explanation
        )
    )
    FROM payload.course_quizzes_rels cqr
    JOIN payload.quiz_questions qq ON qq.id = cqr.quiz_questions_id
    WHERE cqr._parent_id = q.id AND cqr.path = 'questions'
)
WHERE EXISTS (
    SELECT 1 FROM payload.course_quizzes_rels cqr
    WHERE cqr._parent_id = q.id AND cqr.path = 'questions'
);
```

### 3.4 Integration with Content Migration System

#### 3.4.1 Package.json Updates

```json
"scripts": {
  "quiz:system:repair": "tsx src/scripts/repair/quiz-system/index.ts",
  "quiz:system:verify": "tsx src/scripts/repair/quiz-system/index.ts --verify-only",
  "quiz:system:dry-run": "tsx src/scripts/repair/quiz-system/index.ts --dry-run"
}
```

#### 3.4.2 Update loading.ps1

```powershell
# Run the consolidated quiz system repair
Log-EnhancedStep -StepName "Running consolidated quiz system repair" -StepNumber 1 -TotalSteps 10
$quizSystemRepairResult = Invoke-Step -StepName "Repairing quiz system" -Command "pnpm run quiz:system:repair" -ContinueOnError $true

# Skip legacy quiz relationship scripts if quiz system repair was successful
if ($quizSystemRepairResult) {
  Log-Success "Quiz system repair completed successfully, skipping legacy scripts"
} else {
  Log-Warning "Quiz system repair failed, falling back to legacy scripts"
  # Run legacy scripts here (for backward compatibility during transition)
  Invoke-Step -StepName "Running legacy quiz relationship repairs" -Command "pnpm run quiz:fix:corrected" -ContinueOnError $true
  Invoke-Step -StepName "Running legacy bidirectional repairs" -Command "pnpm run fix:bidirectional-quiz-relationships" -ContinueOnError $true
}
```

## 4. Migration Strategy

### 4.1 Phase 1: Development and Testing (1-2 days)

1. Create the new unified script system
2. Test the system in isolation
3. Verify that it properly repairs quiz relationships
4. Document test results

### 4.2 Phase 2: Transition (2-3 days)

1. Update content migration system to use the new scripts
2. Add fallback to legacy scripts for backward compatibility
3. Mark old scripts as deprecated with console warnings
4. Run full migration system tests

### 4.3 Phase 3: Cleanup (1-2 weeks later)

1. Remove fallback to legacy scripts
2. Create deprecation warning patches for old scripts
3. Schedule removal of old scripts in a future update

## 5. Scripts to Deprecate

The following scripts should be marked for deprecation and eventual removal:

1. `fix:quiz-array-relationships`
2. `quiz:fix:corrected`
3. `fix:bidirectional-quiz-relationships`
4. `fix:quiz-paths-and-relationships`
5. `fix:enhanced-quiz-paths-and-relationships`
6. `fix:questions-jsonb-comprehensive`

## 6. Expected Benefits

1. **Simplified System**: A single cohesive module replaces multiple overlapping scripts
2. **Increased Reliability**: Better handling of database states prevents silent failures
3. **Improved Maintenance**: Clear separation of concerns makes future updates easier
4. **Better Performance**: Optimized SQL and unified transactions reduce overhead
5. **Enhanced Debugging**: Comprehensive logging and verification simplifies troubleshooting

## 7. Potential Risks and Mitigations

### 7.1 Risks

1. **Breaking Changes**: The new system might not handle edge cases covered by old scripts
2. **Integration Issues**: Complex migration system might have hidden dependencies
3. **Performance Impact**: More comprehensive system might introduce performance overhead

### 7.2 Mitigations

1. **Phased Rollout**: Keep legacy scripts as fallback during transition
2. **Thorough Testing**: Test with various database states and content scenarios
3. **Detailed Logging**: Implement comprehensive logging for troubleshooting
4. **Transaction Management**: Use database transactions to ensure atomic operations

## 8. Next Steps

1. Create folder structure and skeleton files
2. Implement core functionality modules
3. Create integration with migration system
4. Test thoroughly with various database states
5. Update documentation and add deprecation notices
