# Bug Diagnosis: Lesson field labels display inconsistently for lessons 10-29

**ID**: ISSUE-861
**Created**: 2025-12-03T10:00:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

Lesson pages display field labels (To-Do, Read, Watch, Course Project, Test Yourself) inconsistently. Some lessons (like "The Who", lesson 11) show all field labels with content, while other lessons (like "Our Process", lesson 10) hide labels entirely when the field content is empty or missing. The user wants consistent behavior for lessons 10-29 where all labels are always shown, with "none" displayed when content is empty.

## Environment

- **Application Version**: Development
- **Environment**: development
- **Browser**: N/A (Server-side rendering issue + client component logic)
- **Node Version**: See package.json
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: N/A (Design inconsistency, not regression)

## Reproduction Steps

1. Navigate to `/home/course/lessons/our-process` (lesson 10)
2. Observe that only "Test Yourself: Complete the lesson quiz" is visible, not To-Do, Read, Watch, Course Project labels
3. Navigate to `/home/course/lessons/the-who` (lesson 11)
4. Observe that To-Do, Read, Course Project, and Test Yourself labels are all visible with content

## Expected Behavior

For lessons 10-29 (Our Process through Performance):
1. Always show all field labels: To-Do, Watch, Read, Course Project, Test Yourself
2. If a field has no content, display "none" as the content value

## Actual Behavior

- Field labels only render when their corresponding content field is truthy
- Lessons with empty/missing content fields don't display those labels at all
- Creates visual inconsistency across lessons in the same range

## Diagnostic Data

### Code Analysis

**Primary Location**: `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx`

Lines 517-592 contain the conditional rendering logic:

```tsx
{/* Render To-Do Items if any exist */}
{(lesson.todo ||
  lesson.todo_complete_quiz ||
  lesson.todo_watch_content ||
  lesson.todo_read_content ||
  lesson.todo_course_project) && (
  <div className="my-6">
    {/* General To-Do (first position) */}
    {lesson.todo && (
      <div className="mb-4 flex items-start">
        <CheckSquare className="text-primary mt-0.5 mr-2 h-5 w-5" />
        <div>
          <span className="font-medium">To-Do: </span>
          ...
        </div>
      </div>
    )}

    {/* Similar pattern for Watch, Read, Course Project, Test Yourself */}
  </div>
)}
```

Each field uses a truthy check (`{lesson.todo && (...)}`) which hides the entire label+content block when the field is falsy (null, undefined, empty).

### Seed Data Analysis

**Location**: `apps/payload/src/seed/seed-data/course-lessons.json`

**Lesson 10 (our-process)** - lines 197-266:
```json
{
  "slug": "our-process",
  "lesson_number": 10,
  "todo_complete_quiz": true
  // Missing: todo, todo_read_content, todo_watch_content, todo_course_project
}
```

**Lesson 11 (the-who)** - lines 268-450:
```json
{
  "slug": "the-who",
  "lesson_number": 11,
  "todo_complete_quiz": true,
  "todo": { /* rich text content */ },
  "todo_read_content": { /* rich text content */ },
  "todo_course_project": { /* rich text content */ }
  // Missing: todo_watch_content
}
```

### Database Schema

**Location**: `apps/payload/src/collections/CourseLessons.ts`

The fields are defined as optional richText fields (lines 77-121):
- `todo_complete_quiz` (checkbox, default: false)
- `todo` (richText, optional)
- `todo_watch_content` (richText, optional)
- `todo_read_content` (richText, optional)
- `todo_course_project` (richText, optional)

## Error Stack Traces

N/A - This is a display logic issue, not an error condition.

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx` (rendering logic)
  - `apps/payload/src/seed/seed-data/course-lessons.json` (seed data)
  - `apps/payload/src/collections/CourseLessons.ts` (field definitions)
- **Recent Changes**: None affecting this logic
- **Suspected Functions**: LessonViewClient component, lines 517-592

## Related Issues & Context

### Direct Predecessors
None found - this is a new design consistency issue.

### Historical Context
This appears to be original behavior that was never standardized across all lessons.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The seed converter intentionally filters out "None" values from raw `.mdoc` files, causing the generated JSON to be missing fields that exist in the source data. The UI then hides labels for missing fields.

**Detailed Explanation**:
The `extractSection()` function in `course-lessons-converter.ts` (line 549) explicitly returns `null` when section content is "None":

```typescript
// Return null if section contains only "None" or is empty
if (!sectionContent || /^\s*-?\s*None\s*$/i.test(sectionContent)) {
  return null;
}
```

This means:
1. Raw `.mdoc` files contain all sections with "- None" as placeholder content
2. The converter filters these out, returning `null`
3. `null` values are not added to the JSON output
4. The UI conditionally hides labels when fields are missing

**Supporting Evidence**:

Raw file `our-process.mdoc` has all sections:
```markdown
To-Do
- Complete the lesson quiz

Watch
- None

Read
- None

Course Project
- None
```

Converter code at `course-lessons-converter.ts:549`:
```typescript
if (!sectionContent || /^\s*-?\s*None\s*$/i.test(sectionContent)) {
  return null;
}
```

Generated JSON at `course-lessons.json:265` only has:
```json
{
  "slug": "our-process",
  "lesson_number": 10,
  "todo_complete_quiz": true
  // Missing: todo, todo_read_content, todo_watch_content, todo_course_project
}
```

### How This Causes the Observed Behavior

1. Raw `.mdoc` file has "Watch: - None"
2. Converter's `extractSection("Watch")` matches the section
3. Content "- None" matches the filter regex at line 549
4. Function returns `null` instead of the content
5. `watchContent` is `null`, so `lesson.todo_watch_content` is not set
6. UI checks `{lesson.todo_watch_content && (...)}` → evaluates to false
7. "Watch:" label is not rendered
8. User sees inconsistent labels across lessons

### Confidence Level

**Confidence**: High

**Reasoning**: The converter code explicitly shows the "None" filtering logic. The raw files contain the data. The JSON output is missing the fields. The causal chain is complete and verified.

## Fix Approach (High-Level)

**Fix the converter** (`course-lessons-converter.ts`) to preserve "None" values:

1. Modify `extractSection()` to NOT filter out "None" content (remove/modify line 549)
2. Update `textToLexicalRichText()` to convert "None" to proper Lexical format
3. Re-run the converter: `pnpm --filter payload seed:convert`
4. Re-seed the database: `pnpm --filter payload seed:run`
5. Optionally update UI to style "none" values appropriately

## Diagnosis Determination

The root cause has been conclusively identified: The seed converter (`course-lessons-converter.ts`) intentionally filters out "None" values from raw `.mdoc` files, causing the generated JSON to be missing fields. The UI then hides labels for missing fields.

The fix should be implemented in the converter by removing/modifying the "None" filter at line 549, then regenerating the seed data and re-seeding the database.

## Additional Context

- The user specifically requested this behavior for lessons 10-29 ("Our Process" to "Performance")
- The lesson_number field can be accessed as either `lesson.lesson_number` or `lesson.lessonNumber` depending on data source
- PayloadContentRenderer is used to render rich text content, so "none" should be rendered as plain text, not passed to the renderer

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Glob for codebase exploration; direct file analysis for seed data and component inspection*
