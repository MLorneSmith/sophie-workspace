# HTML Parsing for Lesson Content Implementation Plan

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Current State Analysis](#current-state-analysis)
3. [Solution Overview](#solution-overview)
4. [Implementation Details](#implementation-details)
5. [Integration Strategy](#integration-strategy)
6. [Testing and Validation](#testing-and-validation)
7. [Risk Assessment and Mitigation](#risk-assessment-and-mitigation)
8. [Next Steps](#next-steps)

## Problem Statement

The application's content migration system doesn't fully populate the todo fields for lessons in the Payload CMS. Currently, we have:

1. A YAML file `packages/content-migrations/src/data/raw/lesson-metadata.yaml` that serves as the source of truth for lesson content
2. An HTML file `packages/content-migrations/src/data/raw/lesson-todo-content.html` containing structured todo content for lessons
3. A script `packages/content-migrations/src/scripts/create-full-lesson-metadata.ts` that generates the YAML file but doesn't leverage the HTML content

We need to develop a solution that parses the HTML file and updates the YAML file with the properly formatted content, enabling accurate population of fields like `todo`, `todo_watch_content`, `todo_read_content`, and `todo_course_project` in richText format.

## Current State Analysis

### Data Sources

1. **YAML Metadata File**:

   - Located at `packages/content-migrations/src/data/raw/lesson-metadata.yaml`
   - Contains lesson data including basic todoFields structure
   - Most fields have generic placeholder content

2. **HTML Content File**:

   - Located at `packages/content-migrations/src/data/raw/lesson-todo-content.html`
   - Structured as sections by lesson (h1 headers)
   - Each lesson has h2 sections for To-do, Watch, Read, and Course Project
   - Content includes rich formatting with lists (ol/ul), links, and text

3. **Current Script**:
   - `packages/content-migrations/src/scripts/create-full-lesson-metadata.ts`
   - Extracts data from .mdoc files and creates YAML content
   - Generates placeholder Lexical content but doesn't parse the HTML file

### Payload Schema

The CourseLessons collection in `apps/payload/src/collections/CourseLessons.ts` defines these fields:

```typescript
{
  name: 'todo',
  type: 'richText',
  label: 'Todo',
  editor: lexicalEditor({}),
  // ...
},
{
  name: 'todo_complete_quiz',
  type: 'checkbox',
  label: 'Todo: Complete Quiz',
  defaultValue: false,
},
{
  name: 'todo_watch_content',
  type: 'richText',
  label: 'Todo: Watch Content',
  editor: lexicalEditor({}),
  // ...
},
{
  name: 'todo_read_content',
  type: 'richText',
  label: 'Todo: Read Content',
  editor: lexicalEditor({}),
  // ...
},
{
  name: 'todo_course_project',
  type: 'richText',
  label: 'Todo: Course Project',
  editor: lexicalEditor({}),
  // ...
}
```

### Content Migration System

The content migration system follows this workflow:

1. Raw data sources are processed into standardized formats
2. SQL seed files are generated from processed data
3. Database migrations are executed to apply the schema and seed data
4. The system verifies database integrity and relationships

The reset-and-migrate.ps1 script orchestrates this process in three phases:

- Setup: Reset Supabase database and run migrations
- Processing: Process raw data, generate SQL
- Loading: Apply migrations, import data, fix relationships

## Solution Overview

Our solution will create a new script to parse the HTML content and update the YAML metadata file with properly formatted Lexical content for todo fields. This approach:

1. Maintains the existing workflow and infrastructure
2. Uses the same Lexical format required by Payload CMS
3. Ensures consistent data population in the database

### Approach Comparison

| Approach                        | Pros                         | Cons                                    |
| ------------------------------- | ---------------------------- | --------------------------------------- |
| Create new parser script        | Modular, focused on one task | Additional step in workflow             |
| Modify existing generate script | Integrated solution          | Increases complexity of existing script |
| Direct SQL generation           | Bypasses YAML step           | Breaks single source of truth pattern   |

We've selected the **create new parser script** approach for its clean separation of concerns and modularity.

## Implementation Details

### 1. New Script Creation

Create a new script `packages/content-migrations/src/scripts/parse-lesson-todo-html.ts` that will:

- Parse the HTML content file
- Extract content for each lesson and each section
- Convert HTML to Lexical format
- Update the YAML metadata file

### 2. HTML Parsing Implementation

The script will use the following approach to parse the HTML:

```typescript
import fs from 'fs';
import yaml from 'js-yaml';
import { JSDOM } from 'jsdom';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const HTML_FILE_PATH = path.resolve(
  __dirname,
  '../data/raw/lesson-todo-content.html',
);
const YAML_FILE_PATH = path.resolve(
  __dirname,
  '../data/raw/lesson-metadata.yaml',
);

// Main function to process HTML and update YAML
async function parseLessonTodoHtml() {
  console.log('Parsing lesson todo HTML content...');

  // 1. Read the HTML file
  const htmlContent = fs.readFileSync(HTML_FILE_PATH, 'utf8');

  // 2. Parse the HTML content using JSDOM
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  // 3. Read the existing YAML file
  const yamlContent = fs.readFileSync(YAML_FILE_PATH, 'utf8');
  const metadata = yaml.load(yamlContent) as { lessons: any[] };

  // 4. Extract lesson sections from HTML
  const lessonSections = document.querySelectorAll('h1');
  console.log(`Found ${lessonSections.length} lesson sections in HTML file`);

  // Track which lessons were updated
  const updatedLessons = new Set<string>();

  // 5. Process each lesson section
  for (const lessonSection of Array.from(lessonSections)) {
    const lessonTitle = lessonSection.textContent?.trim() || '';
    console.log(`Processing lesson: ${lessonTitle}`);

    // Get the next element until we hit another h1
    let currentElement = lessonSection.nextElementSibling;
    const sectionContent: Record<string, string> = {
      todo: '',
      watchContent: '',
      readContent: '',
      courseProject: '',
    };
    let completeQuiz = false;

    // Collect content for each section
    while (currentElement && currentElement.tagName !== 'H1') {
      if (currentElement.tagName === 'H2') {
        const sectionType =
          currentElement.textContent?.trim().toLowerCase() || '';
        let sectionHtml = '';
        let nextElement = currentElement.nextElementSibling;

        // Collect HTML content for this section
        while (
          nextElement &&
          nextElement.tagName !== 'H1' &&
          nextElement.tagName !== 'H2'
        ) {
          sectionHtml += nextElement.outerHTML;
          nextElement = nextElement.nextElementSibling;
        }

        // Map section type to field name
        if (sectionType === 'to-do') {
          sectionContent.todo = htmlToLexical(sectionHtml);
          // Check if this includes "Complete the lesson quiz"
          if (
            sectionHtml.toLowerCase().includes('complete the lesson quiz') ||
            sectionHtml.toLowerCase().includes('complete the quiz')
          ) {
            completeQuiz = true;
          }
        } else if (sectionType === 'watch') {
          sectionContent.watchContent = htmlToLexical(sectionHtml);
        } else if (sectionType === 'read') {
          sectionContent.readContent = htmlToLexical(sectionHtml);
        } else if (sectionType === 'course project') {
          sectionContent.courseProject = htmlToLexical(sectionHtml);
        }

        currentElement = nextElement;
      } else {
        currentElement = currentElement.nextElementSibling;
      }
    }

    // 6. Find the corresponding lesson in YAML by matching title or similar title
    const yamlLesson = findLessonInYaml(metadata.lessons, lessonTitle);

    if (yamlLesson) {
      // 7. Update the YAML lesson metadata
      if (!yamlLesson.todoFields) {
        yamlLesson.todoFields = {};
      }

      // Update fields if we have content
      if (sectionContent.todo) {
        yamlLesson.todoFields.todo = sectionContent.todo;
      }
      yamlLesson.todoFields.completeQuiz = completeQuiz;
      if (sectionContent.watchContent) {
        yamlLesson.todoFields.watchContent = sectionContent.watchContent;
      }
      if (sectionContent.readContent) {
        yamlLesson.todoFields.readContent = sectionContent.readContent;
      }
      if (sectionContent.courseProject) {
        yamlLesson.todoFields.courseProject = sectionContent.courseProject;
      }

      updatedLessons.add(yamlLesson.title);
    } else {
      console.warn(
        `Could not find matching lesson in YAML for: ${lessonTitle}`,
      );
    }
  }

  console.log(`Updated ${updatedLessons.size} lessons in YAML metadata`);

  // 8. Write the updated YAML back to file
  fs.writeFileSync(YAML_FILE_PATH, yaml.dump(metadata, { lineWidth: 120 }));

  console.log(
    'Successfully updated lesson metadata with todo content from HTML file',
  );
  return true;
}

// Helper function to find lesson in YAML by matching title
function findLessonInYaml(lessons: any[], title: string): any | undefined {
  // First try exact match
  let lesson = lessons.find(
    (l) => l.title.toLowerCase() === title.toLowerCase(),
  );

  // If no exact match, try matching by partial title
  if (!lesson) {
    lesson = lessons.find((l) => {
      const lessonTitle = l.title.toLowerCase();
      const searchTitle = title.toLowerCase();

      // Check if one title contains the other
      return (
        lessonTitle.includes(searchTitle) || searchTitle.includes(lessonTitle)
      );
    });
  }

  return lesson;
}

// Export the main function
export { parseLessonTodoHtml };

// Execute the main function if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  parseLessonTodoHtml().catch((error) => {
    console.error('Error processing todo content:', error);
    process.exit(1);
  });
}
```

### 3. HTML to Lexical Conversion

The script will include a function to convert HTML to Lexical format:

```typescript
// Convert HTML content to Lexical format
function htmlToLexical(htmlContent: string): string {
  if (!htmlContent.trim()) {
    return '';
  }

  // Create base Lexical structure
  const lexicalStructure = {
    root: {
      children: [],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  };

  // Parse HTML to DOM
  const tempDom = new JSDOM(`<div>${htmlContent}</div>`);
  const tempDoc = tempDom.window.document;

  // Process each child element
  const children = tempDoc.querySelector('div')?.children || [];
  for (const child of Array.from(children)) {
    processElement(child, lexicalStructure.root.children);
  }

  return JSON.stringify(lexicalStructure);
}

// Process element and add to children array
function processElement(element: Element, children: any[]): void {
  switch (element.tagName.toLowerCase()) {
    case 'ul':
      processListItems(element, children, 'bullet');
      break;
    case 'ol':
      processListItems(element, children, 'number');
      break;
    case 'p':
      children.push({
        type: 'paragraph',
        children: processInlineContent(element),
      });
      break;
    default:
      // For other elements, create a paragraph
      children.push({
        type: 'paragraph',
        children: processInlineContent(element),
      });
      break;
  }
}

// Process list items
function processListItems(
  element: Element,
  children: any[],
  listType: 'bullet' | 'number',
): void {
  const items = element.querySelectorAll('li');
  for (const item of Array.from(items)) {
    children.push({
      type: 'listitem',
      listType,
      value: 1, // Default value
      children: processInlineContent(item),
    });
  }
}

// Process inline content (text, links, etc.)
function processInlineContent(element: Element): any[] {
  const result = [];

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        result.push({
          type: 'text',
          text,
        });
      }
    } else if (node.nodeType === node.ELEMENT_NODE) {
      const childElement = node as Element;
      switch (childElement.tagName.toLowerCase()) {
        case 'a':
          result.push({
            type: 'link',
            url: childElement.getAttribute('href') || '#',
            children: [
              {
                type: 'text',
                text: childElement.textContent || '',
              },
            ],
          });
          break;
        case 'strong':
        case 'b':
          result.push({
            type: 'text',
            text: childElement.textContent || '',
            bold: true,
          });
          break;
        case 'em':
        case 'i':
          result.push({
            type: 'text',
            text: childElement.textContent || '',
            italic: true,
          });
          break;
        default:
          // For other elements, recursively process their content
          result.push(...processInlineContent(childElement));
          break;
      }
    }
  }

  // If no content was added, add an empty text node
  if (result.length === 0) {
    result.push({
      type: 'text',
      text: '',
    });
  }

  return result;
}
```

### 4. Integration with Existing Generate Script

Modify `packages/content-migrations/src/scripts/create-full-lesson-metadata.ts` to:

```typescript
// Add import for HTML parser
import { parseLessonTodoHtml } from './parse-lesson-todo-html.js';

// In the main createLessonMetadataYaml function
async function createLessonMetadataYaml() {
  console.log('Creating lesson metadata YAML file...');

  // Load mappings
  const downloadMappings = await loadDownloadMappings();
  const quizMappings = await loadQuizMappings();

  // ... existing code to process lesson files ...

  // Create metadata structure
  const metadata = { lessons };

  // Write YAML file
  fs.writeFileSync(OUTPUT_PATH, yaml.dump(metadata, { lineWidth: 120 }));

  // Parse and update with HTML content if available
  const htmlTodoPath = path.resolve(
    __dirname,
    '../data/raw/lesson-todo-content.html',
  );
  if (fs.existsSync(htmlTodoPath)) {
    console.log('HTML todo content found, parsing and updating YAML...');
    await parseLessonTodoHtml();
  }

  console.log(
    `Created comprehensive lesson metadata with ${lessons.length} lessons at ${OUTPUT_PATH}`,
  );
}
```

## Integration Strategy

### Reset-and-Migrate Integration

The new functionality will integrate with the `reset-and-migrate.ps1` script workflow:

1. In the Processing phase, the script will:
   - Generate the initial YAML file from .mdoc files
   - Parse the HTML file to update the YAML
   - Generate SQL from the updated YAML

Update the `processing.ps1` script in the orchestration directory:

```powershell
function Ensure-LessonMetadata {
    Log-Message "Ensuring lesson metadata YAML exists..." "Cyan"
    if (-not (Test-Path "$ContentMigrationsRoot\src\data\raw\lesson-metadata.yaml") -or $ForceRegenerate) {
        Log-Message "  Generating lesson metadata YAML..." "Cyan"
        Exec-Command "cd $ContentMigrationsRoot && npx tsx src/scripts/create-full-lesson-metadata.ts" -ErrorMessage "Failed to create lesson metadata YAML"
    }
    else {
        Log-Message "  Lesson metadata YAML already exists" "Green"

        # Still parse HTML content if needed
        if ($ForceRegenerate -and (Test-Path "$ContentMigrationsRoot\src\data\raw\lesson-todo-content.html")) {
            Log-Message "  Updating YAML with HTML todo content..." "Cyan"
            Exec-Command "cd $ContentMigrationsRoot && npx tsx src/scripts/parse-lesson-todo-html.ts" -ErrorMessage "Failed to parse HTML todo content"
        }
    }
}
```

### SQL Generation Update

Ensure the SQL generation properly uses the enriched todo content:

```typescript
// In the function that generates lesson SQL
function generateLessonsSql() {
  // ... existing code ...

  // Extract todo fields
  const todo = lesson.todoFields?.todo || null;
  const todoCompleteQuiz = lesson.todoFields?.completeQuiz || false;
  const todoWatchContent = lesson.todoFields?.watchContent || null;
  const todoReadContent = lesson.todoFields?.readContent || null;
  const todoCourseProject = lesson.todoFields?.courseProject || null;

  // Include in SQL INSERT
  sql += `
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  estimated_duration,
  course_id,
  ${todo ? 'todo,' : ''}
  todo_complete_quiz,
  ${todoWatchContent ? 'todo_watch_content,' : ''}
  ${todoReadContent ? 'todo_read_content,' : ''}
  ${todoCourseProject ? 'todo_course_project,' : ''}
  created_at,
  updated_at
) VALUES (
  '${lessonId}',
  '${lesson.title.replace(/'/g, "''")}',
  '${lessonSlug}',
  '${(lesson.description || '').replace(/'/g, "''")}',
  '${lexicalContent.replace(/'/g, "''")}',
  ${lesson.lessonNumber || 0},
  ${lesson.lessonLength || 0},
  '${COURSE_ID}',
  ${todo ? `'${todo.replace(/'/g, "''")}'` : 'NULL'},
  ${todoCompleteQuiz},
  ${todoWatchContent ? `'${todoWatchContent.replace(/'/g, "''")}'` : 'NULL'},
  ${todoReadContent ? `'${todoReadContent.replace(/'/g, "''")}'` : 'NULL'},
  ${todoCourseProject ? `'${todoCourseProject.replace(/'/g, "''")}'` : 'NULL'},
  NOW(),
  NOW()
);`;

  // ... rest of function ...
}
```

## Testing and Validation

### Unit Testing

1. **HTML Parser Testing**:

   - Create a test HTML file with a subset of lessons
   - Run the parser script against this file
   - Verify the resulting Lexical content structure

2. **Integration Testing**:
   - Run the full create-full-lesson-metadata.ts script
   - Verify the YAML file is correctly updated with HTML content

### System Testing

1. **Migration Testing**:

   - Run the full reset-and-migrate.ps1 script
   - Verify the database contains the correctly populated todo fields

2. **UI Testing**:
   - Launch the application and navigate to lesson pages
   - Verify todo content displays correctly in the UI
   - Confirm rich formatting (lists, links) renders properly

### Validation Queries

```sql
-- Verify todo fields are populated
SELECT id, title,
       CASE WHEN todo IS NULL THEN 'missing' ELSE 'populated' END AS todo_status,
       todo_complete_quiz,
       CASE WHEN todo_watch_content IS NULL THEN 'missing' ELSE 'populated' END AS watch_status,
       CASE WHEN todo_read_content IS NULL THEN 'missing' ELSE 'populated' END AS read_status,
       CASE WHEN todo_course_project IS NULL THEN 'missing' ELSE 'populated' END AS project_status
FROM payload.course_lessons
ORDER BY lesson_number;
```

## Risk Assessment and Mitigation

### Identified Risks

1. **Title Matching Issues**:

   - **Risk**: HTML lesson titles may not exactly match YAML titles
   - **Mitigation**: Implement fuzzy matching and title normalization

2. **HTML Format Changes**:

   - **Risk**: HTML structure might change in future updates
   - **Mitigation**: Make the parser robust to handle variations in HTML structure

3. **Lexical Format Compatibility**:

   - **Risk**: Lexical format changes in newer Payload versions
   - **Mitigation**: Test with the actual Payload version and verify rendering

4. **Content Duplication**:
   - **Risk**: Running the script multiple times might duplicate content
   - **Mitigation**: Implement idempotent updates that don't duplicate content

### Contingency Plan

If issues arise during implementation:

1. Add a feature flag to enable/disable HTML parsing
2. Implement logging to capture which lessons couldn't be matched
3. Create a manual override mechanism in the YAML file

## Next Steps

1. **Implementation**:

   - Create the HTML parser script
   - Integrate with existing script
   - Update SQL generation

2. **Deployment**:

   - Run full migration to verify functionality
   - Document the new process for the team

3. **Future Enhancements**:
   - Add support for more HTML formatting features
   - Create a UI for editing todo content
   - Implement automatic HTML generation from YAML
