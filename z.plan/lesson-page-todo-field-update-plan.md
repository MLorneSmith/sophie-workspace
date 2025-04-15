# Lesson Page Todo Field Update Plan

## Overview

This document outlines the specific changes needed for the lesson page in our course section, focusing on updating the todo fields display, content field handling during migration, and download rendering.

## Current Implementation Analysis

Based on my review of `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx`, the current implementation:

- Displays todo fields in the following order:
  1. todo (General To-Do)
  2. todo_complete_quiz (Complete Quiz)
  3. todo_watch_content (Watch Content)
  4. todo_read_content (Read Content)
  5. todo_course_project (Course Project)
- Uses specific formatting for each todo field:

  - todo: Uses `CheckSquare` icon and "To-Do:" label
  - todo_complete_quiz: Uses `CheckSquare` icon and "To-Do:" label
  - todo_watch_content: Uses `Play` icon and "Watch:" label
  - todo_read_content: Uses `BookOpen` icon and "Read:" label
  - todo_course_project: Uses `Briefcase` icon and "Course Project:" label

- Handles downloads with a proper UI showing the download name and a download button

## Required Changes

### 1. Rename "Todo: Complete Quiz" field

- Change the display label for the `todo_complete_quiz` field from "To-Do: Complete the lesson quiz" to "Test Yourself: Complete the lesson quiz"
- Keep using the `CheckSquare` icon for consistency

### 2. Reorder Todo Fields Display

Reorder the display of todo fields to:

1. todo (General To-Do)
2. todo_watch_content (Watch Content)
3. todo_read_content (Read Content)
4. todo_course_project (Course Project)
5. todo_complete_quiz (Test Yourself)

This reordering should be done in the JSX structure while keeping all conditional checks intact.

### 3. Content Field Depopulation During Migration

This is a migration process issue rather than a UI rendering issue. We need to:

- Identify where in the migration process the content field is being populated
- Ensure that the parsing for extracting bunnyVideo ID and other metadata from raw content continues to work
- Modify the migration script to avoid storing the parsed content in the final lesson's content field

### 4. Downloads Rendering

The downloads rendering appears to be correctly implemented in the current code:

- Each download is displayed in a card with:
  - The download name/description
  - A download button

However, we should verify that:

- The download name is correctly displayed
- The download button is working correctly
- The UI matches the latest design specifications

## Implementation Approach

### 1. Update Todo Field Label and Order

Modify the `LessonViewClient.tsx` component to:

1. Change the complete quiz label:

```tsx
{
  /* Complete Quiz */
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

2. Reorder the JSX sections for todo fields:

```tsx
{
  /* Todo */
}
{
  /* Watch Content */
}
{
  /* Read Content */
}
{
  /* Course Project */
}
{
  /* Complete Quiz (now Test Yourself) */
}
```

### 2. Handling Content Field Depopulation

This requires modifying the content migration process:

1. Identify the script that processes lesson content in `packages/content-migrations/src/scripts/processing/`
2. Ensure the parsed metadata is extracted from the HTML content
3. Modify the script to avoid inserting the raw HTML into the content field during SQL generation
4. Verify the migration still works correctly after these changes

Steps to investigate:

1. Examine `packages/content-migrations/src/scripts/processing/generate-full-lesson-metadata.ts`
2. Check `packages/content-migrations/src/scripts/processing/process-lesson-todo-html.ts`
3. Review `packages/content-migrations/src/scripts/processing/generate-sql-seed-files.ts`

### 3. Verify Download Rendering

The current implementation appears correct:

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

## Implementation Steps

1. Update `LessonViewClient.tsx`:

   - Change the "To-Do: Complete the lesson quiz" label to "Test Yourself: Complete the lesson quiz"
   - Reorder the todo sections in the JSX

2. Investigate content migration process:

   - Review the content migration scripts
   - Identify where content is being populated
   - Modify the scripts to avoid storing the parsed content

3. Test the changes:
   - Ensure todo fields appear in the correct order
   - Verify the quiz label is updated
   - Confirm downloads render correctly
   - Validate the content field handling during migration

## Testing Plan

1. Test the UI changes:

   - Check the todo field ordering
   - Verify the "Test Yourself" label appears correctly
   - Ensure downloads render as expected

2. Test the migration process:
   - Run a content migration using the reset-and-migrate.ps1 script
   - Verify metadata is correctly extracted
   - Confirm the content field doesn't contain duplicated content
   - Check that bunnyVideo ID and other metadata are still correctly extracted

## Potential Challenges

1. Content field depopulation:

   - Ensuring metadata extraction still works without the full content
   - Maintaining backward compatibility with existing code

2. Todo field ordering:

   - Ensuring the conditional rendering logic works correctly with the new order

3. Migration process complexity:
   - Understanding the full migration flow
   - Making targeted changes without breaking other parts

## Conclusion

This plan outlines the specific changes needed to update the lesson page todo fields display, handle content field depopulation during migration, and verify download rendering. Once implemented, these changes will improve the lesson page experience and ensure the content migration process works correctly.
