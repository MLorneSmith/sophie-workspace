/**
 * Script to create a comprehensive lesson metadata YAML file
 * This extracts data from existing .mdoc files and mappings to create a single source of truth
 */
import fs from 'fs';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseLessonTodoHtml } from './process-lesson-todo-html.js';
// Corrected filename
// Get current directory (replacement for __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Define paths
const LESSONS_DIR = path.resolve(__dirname, '../data/raw/courses/lessons');
const OUTPUT_PATH = path.resolve(__dirname, '../data/raw/lesson-metadata.yaml');
const DOWNLOADS_MAPPING_PATH = path.resolve(__dirname, '../data/mappings/download-mappings.ts');
const QUIZ_MAPPING_PATH = path.resolve(__dirname, '../data/mappings/lesson-quiz-mappings.ts');
// Helper function to extract bunny video ID from content using regex
function extractBunnyVideoId(content) {
    // Looking for patterns like {% bunny bunnyvideoid="70b1f616-8e55-4c58-8898-c5cefa05417b" /%}
    const patterns = [
        /bunnyvideoid="([^"]+)"/,
        /bunny-video-id="([^"]+)"/,
        /bunnyVideoId="([^"]+)"/,
        /bunny_video_id="([^"]+)"/,
    ];
    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}
// Helper function to extract external video info from content
function extractExternalVideo(content, slug) {
    // Define known external videos for specific lessons
    const knownVideos = {
        'storyboards-film': { source: 'youtube', id: 'BSOJiSUI0z8' },
        'fundamental-design-overview': { source: 'vimeo', id: '32944253' },
    };
    // First check if this is a known lesson with external video
    if (knownVideos[slug]) {
        console.log(`  Found known external video for ${slug}: ${knownVideos[slug].source} ID ${knownVideos[slug].id}`);
        return knownVideos[slug];
    }
    // Look for YouTube video pattern in content
    const youtubePatterns = [
        /youtubeId="([^"]+)"/,
        /youtube-id="([^"]+)"/,
        /youtube_id="([^"]+)"/,
        /youtube\.com\/watch\?v=([^&"]+)/,
        /youtu\.be\/([^&"]+)/,
    ];
    for (const pattern of youtubePatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            console.log(`  Found YouTube video ID: ${match[1]}`);
            return { source: 'youtube', id: match[1] };
        }
    }
    // Look for Vimeo video pattern in content
    const vimeoPatterns = [
        /vimeoId="([^"]+)"/,
        /vimeo-id="([^"]+)"/,
        /vimeo_id="([^"]+)"/,
        /vimeo\.com\/([0-9]+)/,
    ];
    for (const pattern of vimeoPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            console.log(`  Found Vimeo video ID: ${match[1]}`);
            return { source: 'vimeo', id: match[1] };
        }
    }
    return null;
}
// Helper function to extract todo content from the lesson content and convert to Lexical format
function extractTodoFields(content) {
    // Extract raw content first
    let rawTodo = '';
    let completeQuiz = false;
    let rawWatchContent = '';
    let rawReadContent = '';
    let rawCourseProject = '';
    // Extract generic Todo content
    const todoMatch = content.match(/Todo\s*\n\s*-(.*?)(?:\n\s*\n|\n\s*(?:Watch|Read|Course|%|###))/s);
    if (todoMatch && todoMatch[1]) {
        rawTodo = todoMatch[1].trim().replace(/^\s*-\s*/, '');
    }
    // Check for "Complete the lesson quiz" in the todo section
    if (content.includes('Complete the lesson quiz') ||
        content.includes('Complete the quiz')) {
        completeQuiz = true;
    }
    // Extract Watch content
    const watchMatch = content.match(/Watch\s*\n\s*-(.*?)(?:\n\s*\n|\n\s*Read)/s);
    if (watchMatch && watchMatch[1]) {
        rawWatchContent = watchMatch[1].trim().replace(/^\s*-\s*/, '');
    }
    // Extract Read content
    const readMatch = content.match(/Read\s*\n\s*-(.*?)(?:\n\s*\n|\n\s*(?:%|Course))/s);
    if (readMatch && readMatch[1]) {
        rawReadContent = readMatch[1].trim().replace(/^\s*-\s*/, '');
    }
    // Extract Course Project content
    const projectMatch = content.match(/Course Project\s*\n\s*-(.*?)(?:\n\s*\n|\n\s*(?:%|###))/s);
    if (projectMatch && projectMatch[1]) {
        rawCourseProject = projectMatch[1].trim().replace(/^\s*-\s*/, '');
    }
    // Default placeholder content if raw content is empty
    if (!rawTodo) {
        rawTodo =
            'Complete the tasks for this lesson:\nReview the content\nPractice the concepts';
    }
    if (!rawWatchContent && completeQuiz) {
        rawWatchContent =
            'Watch the video content:\nStudy the lesson video thoroughly\nTake notes on key concepts';
    }
    if (!rawReadContent) {
        rawReadContent =
            'Reading materials:\nReview the slides\nExplore additional resources';
    }
    if (!rawCourseProject) {
        rawCourseProject =
            'Project steps:\nApply the concepts from this lesson\nPrepare a draft of your work';
    }
    // Convert raw content to Lexical format
    const todoLexical = createLexicalContent(rawTodo, true);
    const watchContentLexical = createLexicalContent(rawWatchContent, false);
    const readContentLexical = createLexicalContent(rawReadContent, false);
    const courseProjectLexical = createLexicalContent(rawCourseProject, false);
    console.log(`  Added rich text format to todoFields`);
    return {
        todo: todoLexical,
        completeQuiz,
        watchContent: watchContentLexical,
        readContent: readContentLexical,
        courseProject: courseProjectLexical,
    };
}
// Helper function to create a Lexical-compatible rich text content
function createLexicalContent(content, includeLink = false) {
    // If content is empty, return empty string
    if (!content || content.trim() === '') {
        return '';
    }
    // Split content into paragraphs
    const lines = content?.split(/\r?\n/)?.filter((line) => line.trim().length > 0) || [];
    if (lines.length === 0) {
        return '';
    }
    // Simpler approach - use a template for Lexical structure
    let childrenJson = '';
    // First line as paragraph
    childrenJson += `{"type":"paragraph","children":[{"type":"text","text":"${lines[0]}"}]},`;
    // Rest as bullet points
    for (let i = 1; i < lines.length; i++) {
        if (includeLink && i === 1) {
            // Add a bullet with a link for the second line
            childrenJson += `
        {"type":"listitem","listType":"bullet","children":[
          {"type":"text","text":"Visit the "},
          {"type":"link","url":"https://slideheroes.com/docs","children":[{"type":"text","text":"SlideHeroes documentation"}]},
          {"type":"text","text":" for more information"}
        ]},`;
        }
        else {
            // Regular bullet point
            childrenJson += `{"type":"listitem","listType":"bullet","children":[{"type":"text","text":"${lines[i]}"}]},`;
        }
    }
    // Remove trailing comma
    childrenJson = childrenJson.replace(/,$/, '');
    // Complete Lexical structure as a JSON string
    const lexicalJson = `{"root":{"children":[${childrenJson}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}`;
    return lexicalJson;
}
// Load existing download mappings from TS file
async function loadDownloadMappings() {
    try {
        const content = fs.readFileSync(DOWNLOADS_MAPPING_PATH, 'utf8');
        // Extract the object literal between export const LESSON_DOWNLOADS_MAPPING = { ... };
        const matchResult = content.match(/export const LESSON_DOWNLOADS_MAPPING[^{]+({\s*[\s\S]*?\n});/m);
        if (!matchResult || !matchResult[1]) {
            console.warn('Could not extract download mappings from file');
            return {};
        }
        // Convert to valid JSON by replacing TypeScript syntax with JSON syntax
        const jsonStr = matchResult[1]
            .replace(/'/g, '"') // Replace single quotes with double quotes
            .replace(/,(\s*})/g, '$1') // Remove trailing commas
            .replace(/(\w+):/g, '"$1":') // Add quotes around keys
            .replace(/\n\s*\/\/.*$/gm, ''); // Remove comments
        try {
            return JSON.parse(jsonStr);
        }
        catch (jsonError) {
            console.error('Error parsing download mappings JSON:', jsonError);
            console.error('Extracted JSON string:', jsonStr);
            return {};
        }
    }
    catch (error) {
        console.error('Error loading download mappings:', error);
        return {};
    }
}
// Load existing quiz mappings from TS file
async function loadQuizMappings() {
    try {
        const content = fs.readFileSync(QUIZ_MAPPING_PATH, 'utf8');
        // Extract the object literal between export const lessonQuizMapping = { ... };
        const matchResult = content.match(/export const lessonQuizMapping[^{]+({\s*[\s\S]*?\n});/m);
        if (!matchResult || !matchResult[1]) {
            console.warn('Could not extract quiz mappings from file');
            return {};
        }
        // Convert to valid JSON by replacing TypeScript syntax with JSON syntax
        const jsonStr = matchResult[1]
            .replace(/'/g, '"') // Replace single quotes with double quotes
            .replace(/,(\s*})/g, '$1') // Remove trailing commas
            .replace(/(\w+):/g, '"$1":') // Add quotes around keys
            .replace(/\n\s*\/\/.*$/gm, ''); // Remove comments
        try {
            return JSON.parse(jsonStr);
        }
        catch (jsonError) {
            console.error('Error parsing quiz mappings JSON:', jsonError);
            console.error('Extracted JSON string:', jsonStr);
            return {};
        }
    }
    catch (error) {
        console.error('Error loading quiz mappings:', error);
        return {};
    }
}
// Main function to create the YAML file
async function createLessonMetadataYaml() {
    console.log('Creating lesson metadata YAML file...');
    // Load mappings
    const downloadMappings = await loadDownloadMappings();
    const quizMappings = await loadQuizMappings();
    console.log(`Loaded mappings: ${Object.keys(downloadMappings).length} downloads, ${Object.keys(quizMappings).length} quizzes`);
    // Get all .mdoc files
    const lessonFiles = fs
        .readdirSync(LESSONS_DIR)
        .filter((file) => file.endsWith('.mdoc'));
    console.log(`Found ${lessonFiles.length} lesson files`);
    // Process each lesson file
    const lessons = [];
    for (const file of lessonFiles) {
        const filePath = path.join(LESSONS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContent);
        // Get slug from filename
        const slug = path.basename(file, '.mdoc');
        console.log(`Processing lesson: ${slug}`);
        // Extract Bunny video ID from content
        const bunnyVideoId = extractBunnyVideoId(content);
        if (bunnyVideoId) {
            console.log(`  Found Bunny video ID: ${bunnyVideoId}`);
        }
        // Extract todo fields from content
        const todoFields = extractTodoFields(content);
        // Check if this lesson has downloads defined
        const downloads = downloadMappings[slug] || [];
        if (downloads.length > 0) {
            console.log(`  Found ${downloads.length} downloads`);
        }
        // Check if this lesson has a quiz defined
        const quizSlug = quizMappings[slug] || null;
        if (quizSlug) {
            console.log(`  Found quiz: ${quizSlug}`);
        }
        // Extract external video information
        const externalVideo = extractExternalVideo(content, slug);
        if (externalVideo) {
            console.log(`  Found external video: ${externalVideo.source} ID: ${externalVideo.id}`);
        }
        // Create lesson metadata object
        const lesson = {
            slug,
            title: data.title || '',
            lessonNumber: Number(data.lessonNumber || data.order || 0),
            lessonLength: Number(data.lessonLength || 0),
            description: data.description || '',
            todoFields: {
                todo: todoFields.todo,
                completeQuiz: todoFields.completeQuiz,
                watchContent: todoFields.watchContent,
                readContent: todoFields.readContent,
                courseProject: todoFields.courseProject,
            },
            bunnyVideo: {
                id: bunnyVideoId || '',
                library: 264486, // Default library ID as a number
            },
            // Add external video information if available
            ...(externalVideo && { externalVideo }),
            downloads,
            quiz: quizSlug,
        };
        lessons.push(lesson);
    }
    // Sort lessons by lesson number (ensuring numbers for comparison)
    lessons.sort((a, b) => {
        const numA = typeof a.lessonNumber === 'string'
            ? parseInt(a.lessonNumber, 10)
            : a.lessonNumber;
        const numB = typeof b.lessonNumber === 'string'
            ? parseInt(b.lessonNumber, 10)
            : b.lessonNumber;
        return numA - numB;
    });
    // Create metadata structure
    const metadata = { lessons };
    // Write YAML file
    fs.writeFileSync(OUTPUT_PATH, yaml.dump(metadata, { lineWidth: 120 }));
    // Always check for HTML todo content file after writing the initial YAML
    const htmlTodoPath = path.resolve(__dirname, '../data/raw/lesson-todo-content.html');
    if (fs.existsSync(htmlTodoPath)) {
        console.log('HTML todo content file found. Parsing and updating YAML...');
        try {
            const result = await parseLessonTodoHtml();
            if (result) {
                console.log('Successfully updated YAML with HTML todo content');
            }
            else {
                console.warn('HTML parsing completed but may not have updated all content');
            }
        }
        catch (error) {
            console.error('Error parsing HTML todo content:', error);
            console.warn('Continuing with the original YAML file');
        }
    }
    else {
        console.log('No HTML todo content file found. Using default todo content.');
    }
    console.log(`Created comprehensive lesson metadata with ${lessons.length} lessons at ${OUTPUT_PATH}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Review the YAML file and update any missing fields');
    console.log('2. Run the reset-and-migrate.ps1 script to apply changes');
}
// Execute the main function
createLessonMetadataYaml().catch((error) => {
    console.error('Error creating lesson metadata:', error);
    process.exit(1);
});
