# Payload CMS Course Quizzes Relationship Fix

## Issue

The course quizzes collection in Payload CMS was not properly displaying the related quiz questions in the admin UI. When viewing a quiz, the questions field showed "Select a value" even though the relationships existed in the database.

## Root Causes

1. **Missing `global_slug` Column**: The `payload_locked_documents` table was missing a `global_slug` column, causing errors when trying to build the form state.

2. **Relationship Population**: The relationship between course quizzes and quiz questions was not being properly populated in the admin UI, despite the relationships existing correctly in the database.

## Solution

### 1. Add Missing Column to Database

Added the `global_slug` column to the `payload_locked_documents` table in the migration file:

```typescript
// In apps/payload/src/migrations/20250404_100000_fix_lesson_quiz_relationships.ts
// Added to the up function:
await db.execute(sql`
  DO $$
  BEGIN
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'payload' 
      AND table_name = 'payload_locked_documents'
    ) AND NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'payload' 
      AND table_name = 'payload_locked_documents' 
      AND column_name = 'global_slug'
    ) THEN
      ALTER TABLE "payload"."payload_locked_documents"
      ADD COLUMN "global_slug" varchar;
      RAISE NOTICE 'Added global_slug column to payload_locked_documents table';
    ELSE
      RAISE NOTICE 'global_slug column already exists or payload_locked_documents table does not exist';
    END IF;
  END
  $$;
`);
```

### 2. Enhance Relationship Field Configuration

Updated the relationship field in the CourseQuizzes collection to include:

1. **maxDepth**: Set to 1 to ensure related data is fetched
2. **Simple filterOptions**: To avoid UUID errors when filtering

```typescript
// In apps/payload/src/collections/CourseQuizzes.ts
{
  name: 'questions',
  type: 'relationship',
  relationTo: 'quiz_questions',
  hasMany: true,
  maxDepth: 1,
  filterOptions: () => {
    // Show all questions
    return true
  },
  admin: {
    description: 'Questions for this quiz',
  },
}
```

### 3. Add Custom Hook for Relationship Population

Added an `afterRead` hook to the CourseQuizzes collection to explicitly populate the questions:

```typescript
// In apps/payload/src/collections/CourseQuizzes.ts
hooks: {
  afterRead: [
    async ({ doc, req }) => {
      // If the doc has an ID, populate the questions
      if (doc.id) {
        try {
          // Get the questions for this quiz from the relationship table
          const questions = await req.payload.find({
            collection: 'quiz_questions',
            where: {
              quiz_id: {
                equals: doc.id,
              },
            },
            depth: 0,
          });

          // Add the questions to the doc
          if (questions?.docs?.length > 0) {
            doc.questions = questions.docs.map(question => question.id);
          }
        } catch (error) {
          console.error('Error populating quiz questions:', error);
        }
      }

      return doc;
    },
  ],
},
```

### 4. Enhance QuizQuestions Collection

Updated the relationship field in the QuizQuestions collection to improve the admin UI:

```typescript
// In apps/payload/src/collections/QuizQuestions.ts
{
  name: 'quiz_id',
  type: 'relationship',
  relationTo: 'course_quizzes',
  required: true,
  maxDepth: 1,
  admin: {
    description: 'The quiz this question belongs to',
    position: 'sidebar', // Add position to ensure it appears at the top of the form
  },
}
```

## Results

After implementing these changes:

1. The error "column 'global_slug' of relation 'payload_locked_documents' does not exist" was resolved
2. The UUID error when selecting questions was fixed
3. The questions are now properly displayed in the quiz admin UI
4. The relationship between quizzes and questions is maintained correctly

## Lessons Learned

1. **Database Schema Consistency**: Ensure all required columns exist in the database tables
2. **Custom Hooks for Complex Relationships**: Use custom hooks to handle complex relationship population
3. **Simplified Filtering**: Use simpler filtering approaches to avoid UUID errors
4. **TypeScript Type Safety**: Ensure proper types are used for all properties

## Future Considerations

1. **Performance Optimization**: The current solution works but could be optimized for larger datasets
2. **Error Handling**: Add more robust error handling for relationship population
3. **UI Improvements**: Consider adding custom UI components for better relationship management
