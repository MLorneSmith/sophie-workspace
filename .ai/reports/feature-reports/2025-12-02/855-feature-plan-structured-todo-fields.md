# Feature: Structured Todo Fields for Lesson Content

## Feature Description

Implement structured content fields for lesson "action items" (To-Do, Watch, Read, Course Project sections) in the Payload CMS CourseLessons collection. Currently, these sections are embedded as plain text paragraphs in the main `content` field, but the Payload schema already has dedicated richText fields defined (currently commented out) and the frontend already has rendering logic to display them with appropriate icons.

This feature will:
1. Enable the commented-out fields in the Payload schema (`todo`, `todo_watch_content`, `todo_read_content`, `todo_course_project`)
2. Update the seed converter to parse and extract these sections from raw mdoc files into their respective fields
3. Remove these sections from the main content field to avoid duplication
4. Ensure seamless rendering on the frontend (already implemented)

## User Story

As a **course learner**
I want to **see lesson action items (To-Do, Watch, Read, Course Project) displayed in a clear, structured format with visual icons**
So that **I can quickly identify what tasks I need to complete for each lesson and track my progress more effectively**

## Problem Statement

Currently, lesson action items (To-Do, Watch, Read, Course Project) are stored as plain text paragraphs within the main `content` field of lessons. This causes:

1. **Poor visual hierarchy**: Action items blend into the main content without distinct styling
2. **Data structure issues**: Unstructured text makes it impossible to programmatically identify or query specific action types
3. **CMS editor friction**: Content editors cannot independently manage these sections
4. **Frontend rendering gaps**: The frontend has rendering logic for structured fields that isn't being utilized

The raw mdoc files (e.g., `our-process.mdoc`) contain these sections as plain text headings:
```
To-Do
- Complete the lesson quiz

Watch
- None

Read
- None

{% custombullet status="right-arrow" /%}Course Project
- None
```

But the seed converter flattens everything into the `content` field as paragraphs.

## Solution Statement

Enable the pre-defined structured fields in the Payload CMS schema and update the seed conversion pipeline to:

1. **Parse** raw mdoc content to identify To-Do, Watch, Read, and Course Project sections
2. **Extract** each section's content into its corresponding richText field
3. **Remove** these sections from the main content to prevent duplication
4. **Convert** extracted content to Lexical JSON format for Payload richText fields

The frontend (`LessonViewClient.tsx`) already has complete rendering logic for these fields with icons (CheckSquare, Play, BookOpen, Briefcase), so no frontend changes are required.

## Relevant Files

### Files to Modify

- **`apps/payload/src/collections/CourseLessons.ts`** (lines 82-120)
  - Uncomment the `todo`, `todo_watch_content`, `todo_read_content`, `todo_course_project` richText field definitions
  - These fields are already defined with proper Lexical editor configuration

- **`apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts`**
  - Add parsing functions to extract To-Do, Watch, Read, Course Project sections
  - Update `convertToSimpleLexical()` to exclude these sections from main content
  - Add helper functions to convert extracted text to Lexical richText format
  - Update the `CourseLessonJson` interface to include the new fields

### Files for Reference (No Changes)

- **`apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx`** (lines 516-592)
  - Already renders `lesson.todo`, `lesson.todo_watch_content`, `lesson.todo_read_content`, `lesson.todo_course_project` with icons
  - Uses `PayloadContentRenderer` component for richText display

- **`apps/payload/src/seed/seed-data-raw/lessons/our-process.mdoc`**
  - Example lesson with all four sections present
  - Reference for parsing pattern

- **`apps/payload/src/seed/seed-data/course-lessons.json`**
  - Output file that will contain the new structured fields after conversion

### New Files

None required - all necessary infrastructure exists.

## Impact Analysis

### Dependencies Affected

- **`apps/payload`**: Schema change requires Payload migration regeneration
- **`apps/web`**: No code changes, but will consume new data structure
- **Seed data pipeline**: Conversion output format changes

No new npm dependencies required.

### Risk Assessment

**Low Risk**
- Changes are isolated to the CMS schema and seed conversion pipeline
- Frontend already supports the fields (no UI changes needed)
- Fields are optional (lessons without these sections will have null/empty values)
- Easy to rollback by re-commenting schema fields

### Backward Compatibility

- **Fully backward compatible**: Fields are nullable, so existing lessons continue to work
- **No breaking changes**: Frontend gracefully handles null/undefined values
- **No migration required for existing data**: Only affects seed data regeneration

### Performance Impact

- **Minimal**: Adds 4 optional richText fields to lesson documents
- **No additional database queries**: Fields are fetched with the lesson document
- **Slightly larger payloads**: ~100-500 bytes per lesson if fields are populated
- **No client bundle changes**: No new frontend code

### Security Considerations

- **No new attack vectors**: RichText fields use existing Lexical sanitization
- **No authentication changes**: Same RLS policies apply
- **Content validation**: Payload handles richText validation automatically

## Pre-Feature Checklist

Before starting implementation:
- [x] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/structured-todo-fields`
- [x] Review existing similar features for patterns
- [x] Identify all integration points
- [x] Define success metrics
- [x] Confirm feature doesn't duplicate existing functionality
- [x] Verify all required dependencies are available
- [ ] Plan feature flag strategy (if needed) - Not needed, fields are nullable

## Documentation Updates Required

- **`apps/payload/src/collections/CourseLessons.ts`**: Add inline comments explaining field purposes
- **Seed conversion README** (if exists): Document the new section parsing logic
- **No user-facing docs needed**: Feature is internal to CMS/content pipeline

## Rollback Plan

1. **Comment out fields** in `CourseLessons.ts` (revert to current state)
2. **Revert converter changes** in `course-lessons-converter.ts`
3. **Regenerate seed data**: `pnpm --filter payload seed:convert`
4. **Reset and reseed**: `/supabase-reset --regenerate-payload-migrations`

**Monitoring**: Check Payload admin panel for any lesson loading errors after deployment.

## Implementation Plan

### Phase 1: Foundation (Schema Changes)

1. Uncomment the four richText fields in `CourseLessons.ts`
2. Regenerate Payload migrations to update database schema
3. Verify schema changes in Payload admin panel

### Phase 2: Core Implementation (Seed Converter)

1. Add section parsing functions to extract To-Do, Watch, Read, Course Project content
2. Update the main conversion function to populate the new fields
3. Modify `convertToSimpleLexical()` to exclude parsed sections from main content
4. Add helper to convert extracted text to Lexical richText format

### Phase 3: Integration (Data Pipeline)

1. Run seed conversion: `pnpm --filter payload seed:convert`
2. Validate JSON output contains new fields
3. Reset database and reseed: `/supabase-reset`
4. Verify rendering on frontend lesson page

## Step by Step Tasks

### Step 1: Uncomment Payload Schema Fields

- Open `apps/payload/src/collections/CourseLessons.ts`
- Uncomment lines 82-120 containing the field definitions:
  - `todo` (richText) - General todo instructions
  - `todo_watch_content` (richText) - Content to watch
  - `todo_read_content` (richText) - Content to read
  - `todo_course_project` (richText) - Course project instructions
- Keep the existing `todo_complete_quiz` (checkbox) field unchanged
- Save the file

### Step 2: Regenerate Payload Migrations

- Run `/supabase-reset --regenerate-payload-migrations` to:
  - Delete existing Payload migrations
  - Generate new migrations with the updated schema
  - Apply migrations to create the new columns

### Step 3: Add Section Parsing to Seed Converter

- Open `apps/payload/src/seed/seed-conversion/converters/course-lessons-converter.ts`
- Add new parsing functions:
  ```typescript
  function extractTodoSection(content: string): string | null
  function extractWatchSection(content: string): string | null
  function extractReadSection(content: string): string | null
  function extractCourseProjectSection(content: string): string | null
  ```
- Each function should:
  - Use regex to find section headers (e.g., `To-Do\n`, `Watch\n`, `Read\n`)
  - Extract bullet points until next section or end of content
  - Return null if section not found or contains only "None"

### Step 4: Add Lexical Conversion Helper

- Add function to convert plain text to Lexical richText format:
  ```typescript
  function textToLexicalRichText(text: string): LexicalContent | null
  ```
- Handle bullet points as list items
- Return null for empty/None content

### Step 5: Update Main Conversion Function

- In the main conversion loop, call the extraction functions
- Populate the new fields on the lesson object:
  - `todo`: Result of `extractTodoSection()` converted to Lexical
  - `todo_watch_content`: Result of `extractWatchSection()` converted to Lexical
  - `todo_read_content`: Result of `extractReadSection()` converted to Lexical
  - `todo_course_project`: Result of `extractCourseProjectSection()` converted to Lexical

### Step 6: Update Content Stripping

- Modify `convertToSimpleLexical()` to remove the To-Do, Watch, Read, Course Project sections from the main content
- This prevents duplication between the structured fields and main content
- Use regex to identify and remove these sections before paragraph splitting

### Step 7: Update TypeScript Interface

- Update `CourseLessonJson` interface to include:
  ```typescript
  todo?: LexicalContent;
  todo_watch_content?: LexicalContent;
  todo_read_content?: LexicalContent;
  todo_course_project?: LexicalContent;
  ```

### Step 8: Run Seed Conversion

- Execute: `pnpm --filter payload seed:convert`
- Verify `apps/payload/src/seed/seed-data/course-lessons.json` contains the new fields
- Check that `our-process` lesson has populated fields
- Check that lessons without sections have null/undefined values

### Step 9: Reset Database and Reseed

- Run: `/supabase-reset`
- This will:
  - Reset Supabase database
  - Apply Payload migrations (with new columns)
  - Seed all content including the new structured fields

### Step 10: Verify Frontend Rendering

- Start development server: `pnpm dev`
- Navigate to `/home/course/lessons/our-process`
- Verify:
  - To-Do section renders with CheckSquare icon
  - Watch section renders with Play icon (if not "None")
  - Read section renders with BookOpen icon (if not "None")
  - Course Project section renders with Briefcase icon (if not "None")
  - Main content no longer contains these sections

### Step 11: Run Validation Commands

- Execute all validation commands to ensure zero regressions

## Testing Strategy

### Unit Tests

- **Parser tests**: Test each extraction function with various input patterns
  - Section present with bullet points
  - Section present with "None"
  - Section not present
  - Multiple sections in content
- **Lexical conversion tests**: Verify proper richText structure output

### Integration Tests

- **Seed conversion**: Run full conversion and verify JSON output structure
- **Database seeding**: Verify records are created with proper field values

### E2E Tests

- **Lesson page rendering**: Verify structured fields display correctly
- **Graceful degradation**: Verify lessons without sections render without errors

### Edge Cases

- Lessons with only some sections (e.g., only To-Do, no Watch/Read)
- Lessons with empty sections (e.g., `To-Do\n\n`)
- Lessons with "None" in all sections
- Lessons with no action sections at all
- Sections with multiple bullet points
- Sections with rich content (links, bold text)

## Acceptance Criteria

1. **Schema fields are active**: Four richText fields exist in Payload admin for CourseLessons
2. **Seed conversion extracts sections**: `course-lessons.json` contains populated fields for lessons with these sections
3. **No duplicate content**: Main `content` field does not contain To-Do/Watch/Read/Course Project text
4. **Frontend renders correctly**: Lesson pages display structured fields with appropriate icons
5. **Graceful handling**: Lessons without sections render without errors
6. **Type safety**: No TypeScript errors in affected files
7. **All tests pass**: Unit, integration, and E2E tests succeed

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

```bash
# Type checking - verify no TypeScript errors
pnpm typecheck

# Lint check - verify code quality
pnpm lint

# Run unit tests
pnpm test:unit

# Build production bundles
pnpm build

# Verify seed conversion output (manual check)
# Look for todo, todo_watch_content, todo_read_content, todo_course_project fields
cat apps/payload/src/seed/seed-data/course-lessons.json | grep -A5 '"our-process"'

# E2E tests for lesson pages
pnpm test:e2e -- --grep "lesson"
```

## Notes

### Field Value Handling

- **Null vs Empty**: Use `null` for sections not present in source, empty Lexical for sections with "None"
- **Lexical Format**: Match existing richText field structure used elsewhere in the codebase

### Future Considerations

- **CMS Editing**: Content editors can now independently edit each section in Payload admin
- **Querying**: Structured fields enable filtering lessons by action type (e.g., "lessons with course projects")
- **Reporting**: Can generate reports on lesson task types across the course

### Dependencies on This Feature

- No features currently depend on this
- Enables future features like "lesson task checklist" or "course progress by task type"

### Section Detection Patterns

Based on analysis of `our-process.mdoc`, sections follow this pattern:
```
Section Header (no colon, single word or phrase)
- Bullet point 1
- Bullet point 2

Next Section or ### Heading
```

The `{% custombullet status="right-arrow" /%}` prefix should be stripped from Course Project section.
