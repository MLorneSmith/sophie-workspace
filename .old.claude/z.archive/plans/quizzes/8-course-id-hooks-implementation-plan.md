# Course ID Hooks Implementation Plan

## 1. Problem Analysis and Context

### Current Issues

After thorough analysis of migration logs, database queries, and multiple fix attempts, we've identified persistent relationship issues in our quiz system:

1. **Quiz Course ID Problem**:

   - All 20 quizzes have `course_id_id = NULL` in the database
   - This breaks the relationship between quizzes and courses
   - SQL-based fixes have repeatedly failed to resolve this issue

2. **Relationship Data Persistence**:

   - Direct SQL updates to `course_id_id` aren't persisting
   - Our attempts to set course IDs via migration scripts succeed initially but don't remain

3. **Bidirectional Relationships**:
   - Quiz-to-question relationships work correctly
   - Lesson-to-quiz relationships also work
   - But quiz-to-course relationships consistently fail

### Root Cause Analysis

After researching Payload CMS's relationship mechanism and analyzing our collection configurations, we've identified the likely root cause:

1. **Payload's Dual-Storage Relationship System**:

   - Payload stores relationships in two locations:
     - A direct field in the main table (`course_id_id` in `course_quizzes`)
     - Entries in a relationship table (`course_quizzes_rels`)
   - Payload uses hooks to synchronize these two representations
   - When modifications are made outside Payload's API (e.g., via SQL), these hooks don't trigger

2. **Missing Relationship Hooks**:

   - Our `CourseQuizzes` collection lacks the necessary hooks to maintain course relationships
   - In contrast, the `Courses` collection has comprehensive `afterRead` hooks for downloads
   - This explains why quiz-course relationships aren't maintained while other relationships work

3. **SQL Limitations**:
   - Our SQL fixes only update one side of the relationship (the direct field)
   - Without Payload hooks triggering, the relationship tables don't get updated
   - Later Payload operations may reset the direct field based on the relationship table

## 2. Solution Strategy: Collection Configuration Approach

Rather than continuing with direct SQL fixes, we'll address the root cause by modifying the collection configuration to include proper hooks for relationship maintenance:

```mermaid
flowchart TD
    A[Update CourseQuizzes.ts with Hooks] --> B[Create Helper Function]
    B --> C[Run One-time SQL Repair]
    C --> D[Deploy and Test]
```

This approach:

- Works with Payload's relationship model rather than fighting against it
- Makes the system self-healing through multiple relationship recovery strategies
- Is sustainable for long-term maintenance

## 3. Detailed Implementation Plan

### 3.1. Create Relationship Helper Function

Create a new file `src/db/relationships.ts` with a helper function to find courses for quizzes using multiple strategies:

```typescript
// In src/db/relationships.ts
export async function findCourseForQuiz(payload, quizId) {
  try {
    // First check relationship table
    const result = await payload.db.query(
      `
      SELECT courses_id 
      FROM payload.course_quizzes_rels 
      WHERE _parent_id = $1 AND field = 'course_id'
      LIMIT 1
    `,
      [quizId],
    );

    if (result.rows?.length > 0) {
      return result.rows[0].courses_id;
    }

    // Check course_id_id column as fallback
    const directResult = await payload.db.query(
      `
      SELECT course_id_id 
      FROM payload.course_quizzes 
      WHERE id = $1 AND course_id_id IS NOT NULL
      LIMIT 1
    `,
      [quizId],
    );

    if (directResult.rows?.length > 0) {
      return directResult.rows[0].course_id_id;
    }

    // Final fallback - check if any lesson references this quiz
    const lessonResult = await payload.db.query(
      `
      SELECT course_id_id 
      FROM payload.course_lessons 
      WHERE quiz_id_id = $1 AND course_id_id IS NOT NULL
      LIMIT 1
    `,
      [quizId],
    );

    if (lessonResult.rows?.length > 0) {
      return lessonResult.rows[0].course_id_id;
    }

    // Default to main course if we have to
    const mainCourse = await payload.find({
      collection: 'courses',
      where: {
        slug: { equals: 'decks-for-decision-makers' },
      },
    });

    if (mainCourse.docs?.length > 0) {
      return mainCourse.docs[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error finding course for quiz:', error);
    return null;
  }
}
```

### 3.2. Update CourseQuizzes Collection Configuration

Modify `apps/payload/src/collections/CourseQuizzes.ts` to add hooks that maintain the relationship:

```typescript
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
    // Add hooks to manage course relationship
    beforeChange: [
      async ({ data, req }) => {
        // If no course_id provided but we're not creating a new quiz
        // (i.e., updating an existing one), attempt to get existing course_id
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
    // Existing fields remain the same
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
    // Add field-level hooks to the course_id field
    {
      name: 'course_id',
      type: 'relationship',
      relationTo: 'courses' as any,
      required: true,
      hooks: {
        // Add field-level hook for additional validation
        beforeValidate: [
          async ({ value, operation, originalDoc, data, req }) => {
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
    // Other fields remain unchanged
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
    {
      name: 'questions',
      type: 'relationship',
      relationTo: 'quiz_questions' as any,
      hasMany: true,
      required: true,
      admin: {
        description: 'Questions included in this quiz',
      },
    },
  ],
};
```

### 3.3. Create a One-Time SQL Repair Script

To fix existing data, we'll create a script that runs once to establish course IDs:

```typescript
// In packages/content-migrations/src/scripts/repair/fix-quiz-course-ids.ts
import { Client } from 'pg';

/**
 * Fix course IDs for all quizzes
 *
 * This script ensures that all quizzes have proper course IDs in both the
 * direct field and relationship tables
 */
export async function fixQuizCourseIds(): Promise<void> {
  console.log('Fixing quiz course IDs...');

  const client = new Client({
    connectionString:
      process.env.DATABASE_URI ||
      'postgresql://postgres:postgres@localhost:54322/postgres',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // 1. Get main course ID - needs to be a real ID from your database
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
    const quizResult = await client.query(`
      SELECT id, title FROM payload.course_quizzes
    `);

    console.log(`Found ${quizResult.rowCount} quizzes to update`);

    for (const quiz of quizResult.rows) {
      // Update direct field
      await client.query(
        `
        UPDATE payload.course_quizzes
        SET course_id_id = $1
        WHERE id = $2
      `,
        [courseId, quiz.id],
      );

      // Delete any existing relationship entries
      await client.query(
        `
        DELETE FROM payload.course_quizzes_rels
        WHERE _parent_id = $1 AND field = 'course_id'
      `,
        [quiz.id],
      );

      // Create relationship entry
      await client.query(
        `
        INSERT INTO payload.course_quizzes_rels
        (id, _parent_id, field, value, created_at, updated_at, courses_id)
        VALUES (gen_random_uuid(), $1, 'course_id', $2, NOW(), NOW(), $2)
      `,
        [quiz.id, courseId],
      );

      console.log(`Updated quiz: ${quiz.title} (${quiz.id})`);
    }

    // 3. Verify updates
    const verifyResult = await client.query(`
      SELECT 
        cq.id, 
        cq.title, 
        cq.course_id_id, 
        (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE _parent_id = cq.id AND field = 'course_id') as rel_count
      FROM payload.course_quizzes cq
    `);

    console.log('\nVerification results:');
    let allValid = true;

    verifyResult.rows.forEach((row) => {
      const valid = row.course_id_id === courseId && row.rel_count === '1';
      console.log(
        `Quiz "${row.title}": course_id = ${row.course_id_id}, rel_count = ${row.rel_count} - ${valid ? '✅' : '❌'}`,
      );
      if (!valid) allValid = false;
    });

    if (allValid) {
      console.log('\n✅ All quizzes have valid course IDs');
      await client.query('COMMIT');
    } else {
      console.error('\n❌ Some quizzes have invalid course IDs');
      await client.query('ROLLBACK');
      throw new Error('Verification failed');
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing quiz course IDs:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the function if called directly
if (require.main === module) {
  fixQuizCourseIds()
    .then(() => console.log('Complete'))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
```

### 3.4. Register the Script in package.json

Add the script to `packages/content-migrations/package.json`:

```json
"fix:quiz-course-ids": "tsx src/scripts/repair/fix-quiz-course-ids.ts"
```

### 3.5. Integrate with Migration Process

Update `scripts/orchestration/phases/loading.ps1` to run our new script:

```powershell
# Add this right before the final verification step
Log-Message "Fixing quiz course IDs..." "Yellow"
Exec-Command -command "pnpm run fix:quiz-course-ids" -description "Fixing quiz course IDs" -continueOnError
```

## 4. Advantages of This Approach

1. **Root Cause Targeting**: Addresses the fundamental issue with how relationships are maintained

2. **Self-Healing System**: Multiple recovery strategies ensure relationships stay consistent

3. **Payload Integration**: Works with Payload's relationship model instead of fighting against it

4. **Default Course Fallback**: Even if all other methods fail, quizzes get a reasonable default course ID

5. **Multi-layered Hooks**: Both field-level and collection-level hooks maximize relationship maintenance

6. **Similar to Working Patterns**: Follows patterns used in the Courses collection, which successfully maintains its relationships

## 5. Testing and Validation

After implementation, we'll validate the solution through:

1. **Database Checks**:

   ```sql
   -- Should return 0 rows
   SELECT COUNT(*) FROM payload.course_quizzes WHERE course_id_id IS NULL;

   -- Should return 20 rows (one for each quiz)
   SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'course_id';
   ```

2. **UI Verification**:

   - Check that quizzes appear correctly in the Payload Admin UI
   - Verify course relationships are displayed and can be edited

3. **Integration Testing**:
   - Run a complete migration to ensure the fix integrates with the process
   - Update a quiz through the Admin UI and verify course relationship persists

## 6. Fallback Plans

If the collection configuration approach doesn't fully resolve the issue, we have these alternatives:

1. **API-Based Fix**: Use Payload's REST API to update relationships, triggering all hooks properly

2. **Schema Redesign**: Consider a different data model for courses and quizzes

3. **Custom Plugin**: Develop a Payload plugin specifically for relationship management

## 7. Implementation Timeline

1. **Day 1**: Create helper function and update collection configuration
2. **Day 1**: Create and test one-time repair script
3. **Day 1**: Update migration orchestration
4. **Day 2**: Deploy and validate fix in development environment
5. **Day 2**: Run complete migration to verify integration
6. **Day 3**: Monitor and address any issues

## 8. Long-term Considerations

1. **Documentation**: Update relationship documentation to explain how relationships work

2. **Schema Validation**: Add monitoring for relationship health to prevent future issues

3. **Migration Enhancement**: Consider enhancing the migration system to validate relationships
