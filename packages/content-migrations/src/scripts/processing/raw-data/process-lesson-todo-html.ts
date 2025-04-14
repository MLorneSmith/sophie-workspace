/**
 * Script to parse lesson todo HTML content and update the YAML metadata file
 * Includes improved title matching and detailed logging
 */
import fs from 'fs';
import yaml from 'js-yaml';
import { JSDOM } from 'jsdom';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (replacement for __dirname in ESM)
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

/**
 * Normalize a title for comparison by:
 * - Converting to lowercase
 * - Removing punctuation
 * - Removing "The" prefix
 * - Removing extra whitespace
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Helper function to find lesson in YAML by matching title
 * Using enhanced matching algorithm with multiple fallback strategies
 */
function findLessonInYaml(lessons: any[], title: string): any | undefined {
  console.log(`Finding match for HTML lesson title: "${title}"`);

  // Strategy 0: Special case mapping for known problem titles
  const specialCaseMappings: Record<string, string> = {
    'The Why: Building Introductions': 'The Why: Building the Introduction',
    'Tables versus Graphs': 'Tables vs. Graphs',
    'Basic Graphs': 'Standard Graphs',
  };

  if (specialCaseMappings[title]) {
    const matchedLesson = lessons.find(
      (l) => l.title === specialCaseMappings[title],
    );
    if (matchedLesson) {
      console.log(`  ✓ Found special case match: "${matchedLesson.title}"`);
      return matchedLesson;
    }
  }

  // Strategy 1: Exact match
  let lesson = lessons.find(
    (l) => l.title.toLowerCase() === title.toLowerCase(),
  );

  if (lesson) {
    console.log(`  ✓ Found exact match: "${lesson.title}"`);
    return lesson;
  }

  // Strategy 2: Normalized match
  const normalizedTitle = normalizeTitle(title);
  lesson = lessons.find((l) => normalizeTitle(l.title) === normalizedTitle);

  if (lesson) {
    console.log(`  ✓ Found normalized match: "${lesson.title}"`);
    return lesson;
  }

  // Strategy 3: Try matching sections with colon (e.g., "The Why: Building Introductions")
  if (title.includes(':')) {
    const [mainPart, subPart] = title.split(':');
    const mainPartNormalized = normalizeTitle(mainPart);

    // First try to match just the main part exactly
    const similiarLessons = lessons.filter(
      (l) =>
        normalizeTitle(l.title).includes(mainPartNormalized) ||
        mainPartNormalized.includes(
          normalizeTitle(l.title.split(':')[0] || ''),
        ),
    );

    if (similiarLessons.length === 1) {
      console.log(`  ✓ Found main part match: "${similiarLessons[0].title}"`);
      return similiarLessons[0];
    }

    // If we have multiple matches, try to find the closest one by comparing with subPart
    if (similiarLessons.length > 1 && subPart) {
      const subPartNormalized = normalizeTitle(subPart);
      const bestMatch = similiarLessons.reduce((best, current) => {
        const currentSubPart = current.title.includes(':')
          ? normalizeTitle(current.title.split(':')[1])
          : '';

        // Calculate similarity score (crude but effective)
        const currentSimilarity =
          currentSubPart.includes(subPartNormalized) ||
          subPartNormalized.includes(currentSubPart)
            ? 1
            : 0;

        const bestSubPart = best?.title.includes(':')
          ? normalizeTitle(best.title.split(':')[1])
          : '';
        const bestSimilarity =
          bestSubPart.includes(subPartNormalized) ||
          subPartNormalized.includes(bestSubPart)
            ? 1
            : 0;

        return currentSimilarity > bestSimilarity ? current : best;
      }, null);

      if (bestMatch) {
        console.log(`  ✓ Found best subpart match: "${bestMatch.title}"`);
        return bestMatch;
      }
    }
  }

  // Strategy 4: General partial matching
  const partialMatches = lessons.filter((l) => {
    const lessonTitle = normalizeTitle(l.title);
    const searchTitle = normalizeTitle(title);

    // Check if one title contains the other
    return (
      lessonTitle.includes(searchTitle) || searchTitle.includes(lessonTitle)
    );
  });

  if (partialMatches.length === 1) {
    console.log(`  ✓ Found partial match: "${partialMatches[0].title}"`);
    return partialMatches[0];
  }

  // If we have multiple partial matches, log them for debugging
  if (partialMatches.length > 1) {
    console.log(`  ⚠ Multiple partial matches found:`);
    partialMatches.forEach((match) => {
      console.log(`    - "${match.title}"`);
    });

    // Return the shortest match as it's likely to be more precise
    const shortestMatch = partialMatches.reduce(
      (shortest, current) =>
        current.title.length < shortest.title.length ? current : shortest,
      partialMatches[0],
    );

    console.log(`  ✓ Using shortest match: "${shortestMatch.title}"`);
    return shortestMatch;
  }

  console.log(`  ✗ No match found for "${title}"`);
  return undefined;
}

/**
 * Main function to process HTML and update YAML
 */
async function parseLessonTodoHtml() {
  console.log('Parsing lesson todo HTML content...');

  // 1. Check if both files exist
  if (!fs.existsSync(HTML_FILE_PATH)) {
    console.error(`HTML file not found at ${HTML_FILE_PATH}`);
    return false;
  }

  if (!fs.existsSync(YAML_FILE_PATH)) {
    console.error(`YAML file not found at ${YAML_FILE_PATH}`);
    return false;
  }

  // 2. Read the HTML file
  const htmlContent = fs.readFileSync(HTML_FILE_PATH, 'utf8');

  // 3. Parse the HTML content using JSDOM
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  // 4. Read the existing YAML file
  const yamlContent = fs.readFileSync(YAML_FILE_PATH, 'utf8');
  const metadata = yaml.load(yamlContent) as { lessons: any[] };

  if (!metadata.lessons || !Array.isArray(metadata.lessons)) {
    console.error('Invalid YAML structure: Missing or invalid lessons array');
    return false;
  }

  // 5. Extract lesson sections from HTML
  const lessonSections = document.querySelectorAll('h1');
  console.log(`Found ${lessonSections.length} lesson sections in HTML file`);

  // Track which lessons were updated
  const updatedLessons = new Set<string>();
  const unmatchedLessons = new Set<string>();

  // 6. Process each lesson section
  for (const lessonSection of Array.from(lessonSections)) {
    const lessonTitle = lessonSection.textContent?.trim() || '';
    console.log(`\nProcessing lesson: "${lessonTitle}"`);

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
        console.log(`  Processing section: ${sectionType}`);

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
          console.log(
            `  ✓ Converted todo section to Lexical format (${sectionHtml.length} chars)`,
          );

          // Check if this includes "Complete the lesson quiz"
          if (
            sectionHtml.toLowerCase().includes('complete the lesson quiz') ||
            sectionHtml.toLowerCase().includes('complete the quiz')
          ) {
            completeQuiz = true;
            console.log(`  ✓ Detected quiz completion requirement`);
          }
        } else if (sectionType === 'watch') {
          sectionContent.watchContent = htmlToLexical(sectionHtml);
          console.log(
            `  ✓ Converted watch section to Lexical format (${sectionHtml.length} chars)`,
          );
        } else if (sectionType === 'read') {
          sectionContent.readContent = htmlToLexical(sectionHtml);
          console.log(
            `  ✓ Converted read section to Lexical format (${sectionHtml.length} chars)`,
          );
        } else if (sectionType === 'course project') {
          sectionContent.courseProject = htmlToLexical(sectionHtml);
          console.log(
            `  ✓ Converted course project section to Lexical format (${sectionHtml.length} chars)`,
          );
        } else {
          console.log(`  ⚠ Unknown section type: ${sectionType}`);
        }

        currentElement = nextElement;
      } else {
        currentElement = currentElement.nextElementSibling;
      }
    }

    // 7. Find the corresponding lesson in YAML by matching title or similar title
    const yamlLesson = findLessonInYaml(metadata.lessons, lessonTitle);

    if (yamlLesson) {
      // 8. Update the YAML lesson metadata
      if (!yamlLesson.todoFields) {
        yamlLesson.todoFields = {};
      }

      // Update fields if we have content
      let updatedFields = 0;

      if (sectionContent.todo) {
        yamlLesson.todoFields.todo = sectionContent.todo;
        updatedFields++;
      }

      yamlLesson.todoFields.completeQuiz = completeQuiz;
      updatedFields++;

      if (sectionContent.watchContent) {
        yamlLesson.todoFields.watchContent = sectionContent.watchContent;
        updatedFields++;
      }

      if (sectionContent.readContent) {
        yamlLesson.todoFields.readContent = sectionContent.readContent;
        updatedFields++;
      }

      if (sectionContent.courseProject) {
        yamlLesson.todoFields.courseProject = sectionContent.courseProject;
        updatedFields++;
      }

      console.log(
        `  ✓ Updated ${updatedFields} fields in YAML for "${yamlLesson.title}"`,
      );
      updatedLessons.add(yamlLesson.title);
    } else {
      console.warn(
        `  ⚠ Could not find matching lesson in YAML for: "${lessonTitle}"`,
      );
      unmatchedLessons.add(lessonTitle);
    }
  }

  // 9. Report results
  console.log(`\n=== HTML PARSING SUMMARY ===`);
  console.log(`Total lessons in HTML: ${lessonSections.length}`);
  console.log(`Total lessons in YAML: ${metadata.lessons.length}`);
  console.log(`Updated ${updatedLessons.size} lessons in YAML metadata`);

  if (unmatchedLessons.size > 0) {
    console.log(`\nUnmatched lessons (${unmatchedLessons.size}):`);
    Array.from(unmatchedLessons).forEach((title) => {
      console.log(`  - "${title}"`);
    });
  }

  // 10. Write the updated YAML back to file
  fs.writeFileSync(YAML_FILE_PATH, yaml.dump(metadata, { lineWidth: 120 }));

  console.log(
    `\nSuccessfully updated lesson metadata with todo content from HTML file`,
  );
  return true;
}

/**
 * Convert HTML content to Lexical format
 * Enhanced with better element handling
 */
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

/**
 * Process element and add to children array
 * Enhanced with better element type handling
 */
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
    case 'div':
      // Process div by processing its children
      Array.from(element.children).forEach((child) => {
        processElement(child, children);
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

/**
 * Process list items
 * Enhanced with better list handling
 */
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

/**
 * Process inline content (text, links, etc.)
 * Enhanced with better text and link handling
 */
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
        case 'span':
        case 'div':
          // For container elements, process their content
          result.push(...processInlineContent(childElement));
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

// Export the main function
export { parseLessonTodoHtml };

// Execute the main function if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  parseLessonTodoHtml().catch((error) => {
    console.error('Error processing todo content:', error);
    process.exit(1);
  });
}
