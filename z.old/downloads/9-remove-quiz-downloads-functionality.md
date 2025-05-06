# Remove Quiz Downloads Functionality

## Issue Analysis

### Current Symptoms

Server logs show repeated errors when rendering courses with quizzes:

```
Error using direct SQL approach: error: relation "payload.course_quizzes_downloads" does not exist
```

These errors occur in the `getDownloadsViaDirectSQL` function in `relationship-helpers.ts` when it tries to:

1. Construct SQL queries for quiz-downloads relationships
2. Query tables that don't exist in the database

Although the application doesn't crash because of fallback mechanisms, the errors pollute the logs and the code is unnecessarily complex for features we don't need.

### Root Causes

1. **Unnecessary Functionality**: The system is trying to handle downloads for quizzes, but we don't need quiz-specific downloads.
2. **Non-existent Tables**: The SQL queries reference relationship tables that don't exist (`course_quizzes_downloads`).
3. **Error-prone Code Paths**: The system tries multiple approaches to resolve downloads, causing multiple error messages.

## Code Analysis

### CourseQuizzes Collection Configuration

The `CourseQuizzes.ts` collection defines:

- A downloads field that enables relationships with downloadable files
- An afterRead hook that attempts to fetch related downloads

The download functionality in course quizzes is:

1. Not used in the actual application
2. Generating unnecessary errors
3. Adding complexity without providing value

### Relationship Helpers Implementation

The relationship helpers try to resolve downloads for all collection types, including quizzes, leading to:

1. SQL errors for non-existent tables
2. Fallback to predefined mappings that aren't needed
3. Unnecessary database queries and processing

## Simplification Strategy

Our solution is to completely remove the quiz downloads functionality, rather than just fixing the errors. This will:

1. Improve code maintainability
2. Eliminate unnecessary errors
3. Simplify the codebase
4. Reduce database queries

### Key Files to Modify

1. `apps/payload/src/collections/CourseQuizzes.ts`: Remove downloads field and related hook logic
2. `apps/payload/src/db/relationship-helpers.ts`: Add early exit for quiz collections and remove quiz mapping
3. `apps/payload/src/db/downloads.ts`: Add early exit for quiz collections in the wrapper function

## Detailed Code Changes

### 1. Update CourseQuizzes Collection Definition

Remove the downloads field from `CourseQuizzes.ts`:

```typescript
// Remove this field entirely
{
  name: 'downloads',
  type: 'relationship',
  relationTo: 'downloads',
  hasMany: true,
  admin: {
    description: 'Files for download in this quiz',
  },
}
```

Simplify or remove the afterRead hook:

```typescript
// Either remove the entire hook or simplify it to:
hooks: {
  afterRead: [
    async ({ req, doc }) => {
      // Return doc without attempting to find downloads
      return doc;
    }
  ],
},
```

### 2. Update Relationship Helpers

Add early exit for quiz collections in `relationship-helpers.ts`:

```typescript
export async function getDownloadsForCollection(
  payload: Payload,
  collectionId: string,
  collectionType: string,
): Promise<string[]> {
  // Add early return for quizzes to skip all processing
  if (collectionType === 'course_quizzes') {
    return [];
  }

  console.log(
    `Fetching downloads for ${collectionType} with ID ${collectionId}`,
  );
  // Rest of the function remains unchanged
}
```

Remove quiz mapping from the collection column map:

```typescript
// Remove quiz mapping completely
const collectionColumnMap: Record<string, string> = {
  course_lessons: 'lesson_id',
  // course_quizzes entry completely removed
};
```

### 3. Update Downloads Wrapper Functions

Add early exit for quiz collections in `downloads.ts`:

```typescript
export async function findDownloadsForCollection(
  payload: Payload,
  collectionId: string,
  collectionType: string,
): Promise<any[]> {
  // Skip processing entirely for quizzes
  if (collectionType === 'course_quizzes') {
    return [];
  }

  try {
    // Existing code...
  } catch (error) {
    console.error(`Error finding downloads for collection:`, error);
    return [];
  }
}
```

## Testing Strategy

1. **Run Migration**: Execute `reset-and-migrate.ps1` to ensure the database is properly set up
2. **Access Course Lessons**: Test navigating to course lesson pages to verify downloads still appear correctly
3. **Access Course Quizzes**: Verify quizzes still function properly without downloads
4. **Monitor Logs**: Check server logs to confirm no more errors related to quiz downloads
5. **Verify Database**: Confirm relationship integrity in the database

## Benefits of This Approach

1. **Error Elimination**: This will completely eliminate the errors related to quiz downloads in the server logs
2. **Code Simplification**: Removes unused functionality, making the codebase cleaner
3. **Reduced Database Queries**: Fewer database queries will be made, improving performance
4. **Clearer Intent**: The code now clearly shows that quizzes don't have downloads

## Implementation Process

1. First, update `CourseQuizzes.ts` to remove the downloads field
2. Then, update the relationship helpers to explicitly handle quiz collections
3. Finally, update the downloads wrapper functions to add early exits for quizzes
4. Test by verifying that the errors no longer appear in the server logs
