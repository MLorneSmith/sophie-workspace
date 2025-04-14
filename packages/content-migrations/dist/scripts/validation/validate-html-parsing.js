/**
 * Script to validate that HTML todo content was properly parsed and populated in the YAML file
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
const HTML_FILE_PATH = path.resolve(__dirname, '../../data/raw/lesson-todo-content.html');
const YAML_FILE_PATH = path.resolve(__dirname, '../../data/raw/lesson-metadata.yaml');
/**
 * Normalize a title for comparison
 */
function normalizeTitle(title) {
    return title
        .toLowerCase()
        .replace(/^the\s+/, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Special case mapping for known problematic titles
 */
const specialCaseMappings = {
    'The Why: Building Introductions': 'The Why: Building the Introduction',
    'Tables versus Graphs': 'Tables vs. Graphs',
    'Basic Graphs': 'Standard Graphs',
};
/**
 * Enhanced title matching to find corresponding lesson in YAML
 */
function findMatchingLesson(lessons, title) {
    // Special case mapping
    if (specialCaseMappings[title]) {
        const matchedLesson = lessons.find((l) => l.title === specialCaseMappings[title]);
        if (matchedLesson) {
            return matchedLesson;
        }
    }
    // Exact match
    let match = lessons.find((l) => l.title.toLowerCase() === title.toLowerCase());
    if (match)
        return match;
    // Normalized match
    const normalizedTitle = normalizeTitle(title);
    match = lessons.find((l) => normalizeTitle(l.title) === normalizedTitle);
    if (match)
        return match;
    // Partial match based on title segments
    if (title.includes(':')) {
        const [mainPart, subPart] = title.split(':');
        const mainPartNormalized = normalizeTitle(mainPart);
        // Find lessons with similar main part
        const similarLessons = lessons.filter((l) => normalizeTitle(l.title).includes(mainPartNormalized) ||
            mainPartNormalized.includes(normalizeTitle(l.title.split(':')[0] || '')));
        if (similarLessons.length === 1) {
            return similarLessons[0];
        }
    }
    // General partial match
    const partialMatches = lessons.filter((l) => {
        const lessonTitle = normalizeTitle(l.title);
        const searchTitle = normalizeTitle(title);
        return (lessonTitle.includes(searchTitle) || searchTitle.includes(lessonTitle));
    });
    if (partialMatches.length === 1) {
        return partialMatches[0];
    }
    return undefined;
}
/**
 * Main validation function
 */
async function validateHtmlParsing() {
    console.log('Validating HTML parsing results...');
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
    const metadata = yaml.load(yamlContent);
    if (!metadata.lessons || !Array.isArray(metadata.lessons)) {
        console.error('Invalid YAML structure: Missing or invalid lessons array');
        return false;
    }
    // 5. Extract lesson sections from HTML
    const lessonSections = document.querySelectorAll('h1');
    console.log(`Found ${lessonSections.length} lesson sections in HTML file`);
    console.log(`Found ${metadata.lessons.length} lessons in YAML file`);
    // Track validation results
    let lessonsWithTodoContent = 0;
    let lessonsWithMatchingContent = 0;
    const unverifiedLessons = new Set();
    // 6. Process each lesson section
    for (const lessonSection of Array.from(lessonSections)) {
        const lessonTitle = lessonSection.textContent?.trim() || '';
        // Find all h2 elements following this h1 until next h1
        const todoSections = {
            'to-do': false,
            watch: false,
            read: false,
            'course project': false,
        };
        let currentElement = lessonSection.nextElementSibling;
        while (currentElement && currentElement.tagName !== 'H1') {
            if (currentElement.tagName === 'H2') {
                const sectionType = currentElement.textContent?.trim().toLowerCase() || '';
                if (Object.keys(todoSections).includes(sectionType)) {
                    todoSections[sectionType] = true;
                }
            }
            currentElement = currentElement.nextElementSibling;
        }
        // Find matching lesson in YAML using enhanced matching
        const yamlLesson = findMatchingLesson(metadata.lessons, lessonTitle);
        if (yamlLesson && yamlLesson.todoFields) {
            let hasMatchingContent = true;
            // Check if YAML has content for the sections that exist in HTML
            if (todoSections['to-do'] && !yamlLesson.todoFields.todo) {
                hasMatchingContent = false;
                console.log(`  Missing todo content for "${yamlLesson.title}"`);
            }
            if (todoSections['watch'] && !yamlLesson.todoFields.watchContent) {
                hasMatchingContent = false;
                console.log(`  Missing watch content for "${yamlLesson.title}"`);
            }
            if (todoSections['read'] && !yamlLesson.todoFields.readContent) {
                hasMatchingContent = false;
                console.log(`  Missing read content for "${yamlLesson.title}"`);
            }
            if (todoSections['course project'] &&
                !yamlLesson.todoFields.courseProject) {
                hasMatchingContent = false;
                console.log(`  Missing course project content for "${yamlLesson.title}"`);
            }
            // Count lessons with todoFields content
            if (yamlLesson.todoFields.todo ||
                yamlLesson.todoFields.watchContent ||
                yamlLesson.todoFields.readContent ||
                yamlLesson.todoFields.courseProject) {
                lessonsWithTodoContent++;
            }
            if (hasMatchingContent) {
                lessonsWithMatchingContent++;
            }
            else {
                unverifiedLessons.add(yamlLesson.title);
            }
        }
        else {
            if (yamlLesson) {
                console.log(`  Lesson "${yamlLesson.title}" has no todoFields`);
                unverifiedLessons.add(yamlLesson.title);
            }
            else {
                console.log(`  No matching lesson found for HTML title "${lessonTitle}"`);
            }
        }
    }
    // 7. Report results
    console.log('\n=== VALIDATION SUMMARY ===');
    console.log(`Lessons in HTML file: ${lessonSections.length}`);
    console.log(`Lessons in YAML file: ${metadata.lessons.length}`);
    console.log(`Lessons with todo content: ${lessonsWithTodoContent}`);
    console.log(`Lessons with all matching content: ${lessonsWithMatchingContent}`);
    const validationSuccess = lessonsWithMatchingContent === lessonSections.length;
    if (!validationSuccess) {
        console.log(`\nIncomplete or missing content for ${unverifiedLessons.size} lessons:`);
        Array.from(unverifiedLessons).forEach((title) => {
            console.log(`  - "${title}"`);
        });
        console.log('\nValidation failed: Some lesson content was not properly populated');
    }
    else {
        console.log('\nValidation successful: All lesson content was properly populated');
    }
    return validationSuccess;
}
// Run the validation function
validateHtmlParsing()
    .then((success) => {
    if (!success) {
        console.log('Warning: HTML parsing validation found issues');
        // Don't exit with error to allow the migration process to continue
    }
    else {
        console.log('HTML parsing validation completed successfully');
    }
})
    .catch((error) => {
    console.error('Error during validation:', error);
});
