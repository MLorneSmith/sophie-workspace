# Unidirectional Relationship Implementation Plan

## 1. Current Issues Analysis

After extensive investigation of the quiz system, we've identified several persistent issues:

1. **Empty Quizzes Problem**:

   - 14 specific quizzes don't display any content
   - The following quizzes are empty in the Payload admin interface:
     - The Who Quiz
     - The Why (Next Steps) Quiz
     - What is Structure? Quiz
     - Using Stories Quiz
     - Storyboards in Film Quiz
     - Storyboards in Presentations Quiz
     - Visual Perception and Communication Quiz
     - Overview of the Fundamental Elements of Design Quiz
     - Slide Composition Quiz
     - Tables vs Graphs Quiz
     - Standard Graphs Quiz
     - Specialist Graphs Quiz
     - Preparation and Practice Quiz
     - Performance Quiz

2. **Missing Quiz Questions Association**:

   - Quiz questions exist but aren't properly linked to their parent quizzes
   - The bidirectional relationship between quizzes and questions is broken

3. **Missing Course IDs**:
   - All quizzes have `course_id_id = NULL` in the database
   - This breaks proper course navigation and relationship mapping

## 2. Root Cause Analysis

Through examining database schema, collection configuration, and previous fix attempts, we've determined that:

1. **Bidirectional Relationship Complexity**:

   - Payload CMS maintains relationships in two places:
     - Direct field in the main tables (e.g., `quiz_id` in quiz_questions)
     - Relationship tables (e.g., `course_quizzes_rels`)
   - This dual-storage approach requires perfect synchronization
   - When one side is updated without the other, inconsistencies arise

2. **Payload Hooks Limitations**:

   - Current hooks in the collections don't fully maintain bidirectional relationships
   - SQL fixes bypass Payload's relationship management system
   - Migrations don't properly establish all relationship aspects

3. **Unnecessary Complexity**:
   - The current data model uses bidirectional relationships when they aren't needed
   - We only need to see questions associated with quizzes (not vice versa)
   - This unnecessary complexity is a primary source of issues

## 3. Unidirectional Approach: Simpler Solution

Instead of fixing the complex bidirectional relationship, we propose simplifying to a unidirectional model where:

- Quiz questions reference their parent quiz through `quiz_id`
- Quizzes don't directly reference their questions

```mermaid
flowchart TD
    Quiz[Course Quiz] --- hasOne --> Course[Course]
    QuizQuestion[Quiz Question] --- belongsTo --> Quiz
```

### Benefits of This Approach

1. **Simplified Data Model**: Only maintain one direction of the relationship
2. **Fewer Points of Failure**: No need to keep bidirectional references in sync
3. **Clearer Responsibility**: Each question knows its parent quiz (natural hierarchy)
4. **Easier Maintenance**: Less complex code and fewer potential issues
5. **Alignment with Requirements**: Matches actual need (viewing questions for a quiz)

## 4. Implementation Plan

Our implementation will proceed in these phases:

### 4.1 Remove Bidirectional References

1. **Update CourseQuizzes Collection**:
   - Remove the `questions` relationship field from `CourseQuizzes.ts`
   - Keep other fields like `title`, `slug`, `course_id`
   - Simplify hooks to only handle course relationship

```typescript
// Modified CourseQuizzes.ts
import { CollectionConfig } from 'payload';

import { findCourseForQuiz } from '../db/relationships';

export const CourseQuizzes: CollectionConfig = {
  slug: 'course_quizzes',
  labels: {
    singular: 'Course Quiz',
    plural: 'Course Quizzes',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'course_id'],
    description: 'Quizzes for courses in the learning management system',
  },
  access: {
    read: () => true, // Public read access
  },
  hooks: {
    // Keep only course-related hooks
    beforeChange: [
      async ({ data, req }) => {
        // Course ID recovery logic remains the same
        if (!data.course_id && req.method !== 'POST') {
          try {
            const courseId = await findCourseForQuiz(req.payload, data.id);
            if (courseId) {
              data.course_id = courseId;
            }
          } catch (error) {
            console.error('Error finding course for quiz:', error);
          }
        }

        // Default to main course if still no course_id
        if (!data.course_id) {
          try {
            const mainCourse = await req.payload.find({
              collection: 'courses',
              where: {
                slug: { equals: 'decks-for-decision-makers' },
              },
            });

            if (mainCourse.docs && mainCourse.docs.length > 0) {
              data.course_id = mainCourse.docs[0].id;
            }
          } catch (error) {
            console.error('Error finding default course:', error);
          }
        }

        return data;
      },
    ],
    afterRead: [
      async ({ req, doc }) => {
        // Only process if we have a doc with ID
        if (doc?.id) {
          try {
            // If course_id is missing, attempt to find it
            if (!doc.course_id) {
              const courseId = await findCourseForQuiz(req.payload, doc.id);
              if (courseId) {
                doc.course_id = courseId;
              }
            }
          } catch (error) {
            console.error('Error fetching course for quiz:', error);
          }
        }

        return doc;
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The URL-friendly identifier for this quiz',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'course_id',
      type: 'relationship',
      relationTo: 'courses' as any,
      required: true,
      hooks: {
        // Keep field-level hook for course ID validation
        beforeValidate: [
          async ({ value, operation, originalDoc, req }) => {
            // If value is missing but we're not creating a new document
            if (!value && operation !== 'create') {
              try {
                // Try to fetch from existing document
                const courseId = await findCourseForQuiz(
                  req.payload,
                  originalDoc.id,
                );
                return courseId || value;
              } catch (error) {
                console.error('Error in course_id beforeValidate hook:', error);
              }
            }
            return value;
          },
        ],
      },
    },
    {
      name: 'pass_threshold',
      type: 'number',
      min: 0,
      max: 100,
      defaultValue: 70,
      admin: {
        description: 'Percentage required to pass the quiz',
      },
    },
    // "questions" field removed completely
  ],
};
```

2. **Keep QuizQuestions Collection Unchanged**:
   - The existing structure with `quiz_id` pointing to parent quiz is perfect
   - No changes needed to this collection

### 4.2 Database Schema Update

Create a Payload migration to update the database schema:

```typescript
// New migration file: apps/payload/src/migrations/remove-questions-from-quizzes.ts
import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  try {
    // Remove the questions array field from course_quizzes table
    await payload.db.query(`
      ALTER TABLE payload.course_quizzes 
      DROP COLUMN IF EXISTS questions;
    `);

    // Remove related relationship entries from course_quizzes_rels
    await payload.db.query(`
      DELETE FROM payload.course_quizzes_rels 
      WHERE field = 'questions';
    `);

    console.log('Successfully removed questions field from quizzes');
  } catch (error) {
    console.error('Error removing questions field from quizzes:', error);
    throw error;
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  try {
    // Add back the questions array field (as empty array)
    await payload.db.query(`
      ALTER TABLE payload.course_quizzes 
      ADD COLUMN IF NOT EXISTS questions TEXT[] DEFAULT '{}';
    `);

    console.log('Restored questions field to quizzes (empty)');
  } catch (error) {
    console.error('Error restoring questions field to quizzes:', error);
    throw error;
  }
}
```

### 4.3 Data Repair Script

Create a script to ensure all quiz questions have valid `quiz_id` references and all quizzes have valid `course_id` values:

```typescript
// packages/content-migrations/src/scripts/repair/fix-unidirectional-quiz-relationships.ts
import { Client } from 'pg';

/**
 * Fix quiz relationships in unidirectional model
 *
 * This script:
 * 1. Ensures all quiz questions have valid quiz_id references
 * 2. Sets proper course_id for all quizzes
 * 3. Verifies data integrity after changes
 */
export async function fixUnidirectionalQuizRelationships(): Promise<void> {
  console.log('Fixing quiz relationships for unidirectional model...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // 1. Get main course ID
    const courseResult = await client.query(`
      SELECT id FROM payload.courses
      WHERE slug = 'decks-for-decision-makers'
      LIMIT 1
    `);

    if (courseResult.rowCount === 0) {
      throw new Error('Main course not found');
    }

    const courseId = courseResult.rows[0].id;
    console.log(`Using course ID: ${courseId}`);

    // 2. Update all quizzes to have this course ID
    const updateQuizResult = await client.query(
      `
      UPDATE payload.course_quizzes
      SET course_id_id = $1
      WHERE course_id_id IS NULL
      RETURNING id, title
    `,
      [courseId],
    );

    console.log(`Updated ${updateQuizResult.rowCount} quizzes with course ID`);

    // 3. Ensure course relationship entries exist
    for (const quiz of updateQuizResult.rows) {
      // Check if relationship already exists
      const existingRel = await client.query(
        `
        SELECT id FROM payload.course_quizzes_rels
        WHERE _parent_id = $1 AND field = 'course_id'
        LIMIT 1
      `,
        [quiz.id],
      );

      // If not exists, create it
      if (existingRel.rowCount === 0) {
        await client.query(
          `
          INSERT INTO payload.course_quizzes_rels
          (id, _parent_id, field, value, created_at, updated_at, courses_id)
          VALUES (gen_random_uuid(), $1, 'course_id', $2, NOW(), NOW(), $2)
        `,
          [quiz.id, courseId],
        );
        console.log(`Created course relationship for quiz: ${quiz.title}`);
      }
    }

    // 4. Verify quiz questions have valid quiz_id
    const orphanedQuestionsResult = await client.query(`
      SELECT id, question FROM payload.quiz_questions
      WHERE quiz_id IS NULL OR quiz_id = ''
    `);

    if (orphanedQuestionsResult.rowCount > 0) {
      console.warn(
        `Found ${orphanedQuestionsResult.rowCount} questions without quiz_id`,
      );
      // We could assign them to a default quiz here if needed
    }

    // 5. Final verification
    const verifyResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM payload.course_quizzes) as total_quizzes,
        (SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NOT NULL) as quizzes_with_course,
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id') as course_relationships,
        (SELECT COUNT(*) FROM payload.quiz_questions) as total_questions,
        (SELECT COUNT(*) FROM payload.quiz_questions WHERE quiz_id IS NOT NULL) as questions_with_quiz
    `);

    const stats = verifyResult.rows[0];
    console.log('\nVerification results:');
    console.log(`- Total quizzes: ${stats.total_quizzes}`);
    console.log(`- Quizzes with course_id: ${stats.quizzes_with_course}`);
    console.log(`- Course relationship entries: ${stats.course_relationships}`);
    console.log(`- Total quiz questions: ${stats.total_questions}`);
    console.log(`- Questions with quiz_id: ${stats.questions_with_quiz}`);

    const success =
      stats.total_quizzes === stats.quizzes_with_course &&
      stats.total_quizzes === stats.course_relationships &&
      stats.total_questions === stats.questions_with_quiz;

    if (success) {
      console.log('\n✅ All relationships valid for unidirectional model');
      await client.query('COMMIT');
    } else {
      console.error('\n❌ Some relationships are invalid');
      await client.query('ROLLBACK');
      throw new Error('Verification failed');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing quiz relationships:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  fixUnidirectionalQuizRelationships()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
```

### 4.4 Frontend Adaptation

Ensure the UI still works with the unidirectional model. The `LessonDataProvider.tsx` component already handles this correctly:

```typescript
// In LessonDataProvider.tsx
// This code already works by fetching questions for a quiz:

// Existing code in LessonDataProvider.tsx already checks if quiz has questions
if (quiz && (!quiz.questions || quiz.questions.length === 0)) {
  console.log(
    `Quiz ${quizIdStr} found but has no questions - fetching questions separately`,
  );

  // If quiz exists but questions aren't loaded, try to fetch questions directly
  try {
    const { callPayloadAPI } = await import('@kit/cms/payload');
    const questionsResponse = await callPayloadAPI(
      `quiz_questions?where[quiz_id][equals]=${quiz.id}&sort=order&depth=0`,
    );

    if (questionsResponse?.docs && questionsResponse.docs.length > 0) {
      quiz.questions = questionsResponse.docs;
      console.log(
        `Successfully loaded ${questionsResponse.docs.length} questions for quiz ${quiz.id}`,
      );
    } else {
      console.warn(`No questions found for quiz ${quiz.id}`);
    }
  } catch (questionsError) {
    console.error(
      `Error fetching questions separately: ${questionsError instanceof Error ? questionsError.message : 'Unknown error'}`,
    );
  }
}
```

This approach already handles the unidirectional model by fetching questions separately when needed.

### 4.5 Integration with Migration Process

Update `packages/content-migrations/package.json` to add the new script:

```json
"fix:unidirectional-quiz-relationships": "tsx src/scripts/repair/fix-unidirectional-quiz-relationships.ts"
```

Update `scripts/orchestration/phases/loading.ps1` to run our new script:

```powershell
# Add after dropping the bidirectional relationship fields
Log-Message "Fixing quiz relationships for unidirectional model..." "Yellow"
Exec-Command -command "pnpm run fix:unidirectional-quiz-relationships" -description "Fixing unidirectional quiz relationships" -continueOnError
```

## 5. Implementation Sequence

1. **Collection Definition Updates**:

   - Remove the `questions` field from `CourseQuizzes.ts`
   - Simplify hooks to focus on course relationships

2. **Migration Creation**:

   - Create database migration to drop `questions` field
   - Remove related relationship table entries

3. **Data Repair**:

   - Ensure all quiz questions reference valid quizzes
   - Set proper course IDs for all quizzes
   - Verify data integrity

4. **Integration Testing**:
   - Test the updated code in development
   - Run a full migration with the new changes
   - Verify quizzes display properly

## 6. Advantages of Unidirectional Approach

1. **Simplification**: Removes unnecessary complexity in the data model
2. **Natural Hierarchy**: Follows the natural parent-child relationship
3. **Fewer Points of Failure**: Only one relationship direction to maintain
4. **Better Alignment**: Matches the actual usage (viewing questions for a quiz)
5. **Future-Proof**: More maintainable going forward

## 7. Testing and Verification Plan

After implementation, we'll verify through:

1. **Database Checks**:

   - Confirm `questions` field is removed from `course_quizzes`
   - Verify each question has valid `quiz_id`
   - Verify each quiz has valid `course_id`

2. **UI Verification**:

   - Test quiz display in Admin UI
   - Verify quiz questions display properly on lesson pages
   - Complete a quiz to ensure results are recorded properly

3. **Migration Process**:
   - Run a full migration to ensure changes integrate properly
   - Check logs for any warnings or errors

## 8. Fallback Plan

If issues persist after implementing the unidirectional model:

1. **Direct API Fix**: Use Payload's REST API to update quiz and question data
2. **Database Constraints**: Add foreign key constraints to enforce relationships
3. **Payload Config Review**: Examine Payload configuration for any other issues
