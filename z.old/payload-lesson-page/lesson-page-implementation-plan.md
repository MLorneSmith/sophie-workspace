# Lesson Page Implementation Plan

## Overview

This document provides a detailed implementation plan for updating the lesson page in the course section. Based on my analysis of the existing code and the requirements, I will outline the specific changes needed to:

1. Rename and reorder todo fields
2. Handle content field depopulation during migration
3. Ensure downloads are rendering correctly

## Current Code Analysis

### Todo Fields Processing

From examining `create-full-lesson-metadata.ts` and `parse-lesson-todo-html.ts`, I can see:

- Todo content is extracted from raw lesson content during the migration process
- The content is converted to Lexical format for the Payload CMS
- These fields are then stored in the database and accessible in the lesson object

### Content Field Management

- The `create-full-lesson-metadata.ts` script extracts metadata from the lesson content including:
  - Bunny video IDs
  - External video IDs and sources
  - Todo content
- This content is then stored in both the metadata YAML and eventually in the database

### Downloads Rendering

- Downloads are properly mapped to lessons and retrieved via a custom view
- The UI component in `LessonViewClient.tsx` handles the display of downloads correctly

## Implementation Details

### 1. Update Todo Field Label and Order in LessonViewClient.tsx

#### A. Change the Quiz Label

```tsx
{
  /* Complete Quiz (renamed to Test Yourself) */
}
{
  lesson.todo_complete_quiz && (
    <div className="mb-4 flex items-start">
      <CheckSquare className="text-primary mr-2 mt-0.5 h-5 w-5" />
      <div>
        <span className="font-medium">Test Yourself: </span>
        <span>Complete the lesson quiz</span>
      </div>
    </div>
  );
}
```

#### B. Reorder Todo Fields

Reorder the rendering of todo fields in this sequence:

1. todo (General Todo)
2. todo_watch_content (Watch Content)
3. todo_read_content (Read Content)
4. todo_course_project (Course Project)
5. todo_complete_quiz (Test Yourself)

The updated section will look like:

```tsx
{
  /* Render To-Do Items if any exist */
}
{
  (lesson.todo ||
    lesson.todo_complete_quiz ||
    lesson.todo_watch_content ||
    lesson.todo_read_content ||
    lesson.todo_course_project) && (
    <div className="my-6">
      {/* Todo */}
      {lesson.todo && (
        <div className="mb-4 flex items-start">
          <CheckSquare className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">To-Do: </span>
            <span className="prose prose-sm dark:prose-invert inline">
              <PayloadContentRenderer content={lesson.todo} />
            </span>
          </div>
        </div>
      )}

      {/* Watch Content */}
      {lesson.todo_watch_content && (
        <div className="mb-4 flex items-start">
          <Play className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">Watch: </span>
            <span className="prose prose-sm dark:prose-invert inline">
              <PayloadContentRenderer content={lesson.todo_watch_content} />
            </span>
          </div>
        </div>
      )}

      {/* Read Content */}
      {lesson.todo_read_content && (
        <div className="mb-4 flex items-start">
          <BookOpen className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">Read: </span>
            <span className="prose prose-sm dark:prose-invert inline">
              <PayloadContentRenderer content={lesson.todo_read_content} />
            </span>
          </div>
        </div>
      )}

      {/* Course Project */}
      {lesson.todo_course_project && (
        <div className="mb-4 flex items-start">
          <Briefcase className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">Course Project: </span>
            <span className="prose prose-sm dark:prose-invert inline">
              <PayloadContentRenderer content={lesson.todo_course_project} />
            </span>
          </div>
        </div>
      )}

      {/* Complete Quiz (now Test Yourself) */}
      {lesson.todo_complete_quiz && (
        <div className="mb-4 flex items-start">
          <CheckSquare className="text-primary mr-2 mt-0.5 h-5 w-5" />
          <div>
            <span className="font-medium">Test Yourself: </span>
            <span>Complete the lesson quiz</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 2. Content Field Depopulation

To handle the content field depopulation during migration, I will:

1. Identify where the content is being generated in the `create-full-lesson-metadata.ts` script
2. Modify the code to extract necessary metadata but not include the full content

Based on my analysis, the metadata extraction already happens in separate functions:

- `extractBunnyVideoId()` extracts Bunny video IDs
- `extractExternalVideo()` extracts external video sources and IDs
- `extractTodoFields()` extracts todo content

The issue appears to be that when the Payload content is being generated, the original raw content is still included in the content field. We need to modify this to ensure the content field is not populated with duplicate content.

The key change will be in `packages/content-migrations/src/scripts/processing/sql/generate-sql-seed-files.ts` (or equivalent) to modify the content field handling:

```typescript
// Conceptual change - actual implementation will depend on the exact file
function generateSqlForLessons(lessons: any[]) {
  for (const lesson of lessons) {
    // Keep metadata extraction
    const bunnyVideoId = extractBunnyVideoId(lesson.content);
    const externalVideo = extractExternalVideo(lesson.content);
    const todoFields = extractTodoFields(lesson.content);

    // Don't include the original content in the SQL generation
    // Either set it to empty or a minimal placeholder
    const contentForSql = ''; // Or a minimal placeholder

    // Generate SQL with the metadata but not the full content
    // ...
  }
}
```

### 3. Verify Download Rendering

The current implementation appears correct. The key part:

```tsx
{
  lesson.downloads && lesson.downloads.length > 0 && (
    <div className="my-6">
      <div className="space-y-2">
        {lesson.downloads.map((download: any, index: number) => {
          // Ensure we have a download with URL
          if (!download || !download.url) return null;

          return (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
            >
              <div className="flex-grow">
                <p className="font-medium">
                  {download.description || download.filename}
                </p>
              </div>
              <a
                href={download.url}
                download
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

I will verify this is working correctly by checking that:

1. The download name is displayed correctly using `download.description || download.filename`
2. The download URL is correct
3. The UI styling matches the design requirements

## Implementation Steps

### Step 1: Update LessonViewClient.tsx

1. Modify the todo field order in the JSX
2. Change the "To-Do: Complete the lesson quiz" label to "Test Yourself: Complete the lesson quiz"
3. Keep all the conditional logic intact
4. Test to ensure renders correctly

### Step 2: Investigate Content Field Depopulation

1. Examine the SQL generation scripts in the content-migrations package
2. Identify where lesson content is being stored in the database
3. Modify the script to only extract necessary metadata and not store the full content
4. Ensure this doesn't break the metadata extraction process
5. Test with the reset-and-migrate.ps1 script

### Step 3: Verify Download Rendering

1. Check the download rendering code in LessonViewClient.tsx
2. Verify download name and URL display correctly
3. Confirm UI matches the design requirements

## Testing Plan

### For UI Changes

1. Run the app locally
2. Navigate to a lesson page
3. Check the todo fields are displayed in the correct order
4. Verify the "Test Yourself" label appears correctly
5. Ensure downloads render as expected

### For Migration Changes

1. Make a backup of the current database state
2. Run the reset-and-migrate.ps1 script
3. Verify metadata is correctly extracted
4. Confirm the content field doesn't contain duplicated content
5. Check that bunnyVideo ID and other metadata are still correctly extracted

## Migration Considerations

Since we're modifying the content migration process, we need to be careful to:

1. Not break the existing migration flow
2. Ensure all metadata is still correctly extracted
3. Test thoroughly with the reset-and-migrate.ps1 script
4. Document the changes for future reference

## Conclusion

This implementation plan outlines the specific changes needed to update the lesson page todo fields display, handle content field depopulation during migration, and verify download rendering. The most critical part is the content field depopulation which requires careful modification of the migration scripts to ensure all metadata is still extracted correctly while avoiding duplicate content.
