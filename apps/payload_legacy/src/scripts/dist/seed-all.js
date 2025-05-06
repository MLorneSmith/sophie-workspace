#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import { program } from 'commander';
import { logger, LogLevel, setLogLevel } from './lib/logger';
import { loadSurvey } from './loaders/survey-loader';
import { loadCourse } from './loaders/course-loader';
// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Set up the command-line interface
program.name('seed-all').description('Load data into Payload CMS').version('1.0.0');
// Add global options
program
    .option('-v, --verbose', 'Enable verbose logging')
    .option('-q, --quiet', 'Suppress all but error logs')
    .option('-u, --url <url>', 'Payload API URL', 'http://localhost:3020/api')
    .option('-e, --email <email>', 'Admin email', 'michael@slideheroes.com')
    .option('-p, --password <password>', 'Admin password', 'aiesec1992');
// Default paths
const DEFAULT_SURVEY_PATH = path.resolve(__dirname, '../../data/surveys/self-assessment.yaml');
const DEFAULT_LESSONS_PATH = path.resolve(__dirname, '../../data/courses/lessons');
const DEFAULT_QUIZZES_PATH = path.resolve(__dirname, '../../data/courses/quizzes');
// Add survey command
program
    .command('survey')
    .description('Load survey data from a YAML file')
    .argument('[yaml-file]', 'Path to the YAML file', DEFAULT_SURVEY_PATH)
    .action(async (yamlFile, options, command) => {
    const globalOptions = command.parent?.opts() || {};
    setupLogging(globalOptions);
    logger.section('Loading Survey Data');
    logger.info(`YAML file: ${yamlFile}`);
    try {
        const result = await loadSurvey(yamlFile);
        if (result.success) {
            logger.success(`Survey loaded successfully with ID: ${result.surveyId}`);
            process.exit(0);
        }
        else {
            logger.error('Failed to load survey:', result.error);
            process.exit(1);
        }
    }
    catch (error) {
        logger.error('Error loading survey:', error);
        process.exit(1);
    }
});
// Add course command
program
    .command('course')
    .description('Load course data from Markdoc files')
    .argument('[lessons-dir]', 'Path to the lessons directory', DEFAULT_LESSONS_PATH)
    .argument('[quizzes-dir]', 'Path to the quizzes directory', DEFAULT_QUIZZES_PATH)
    .action(async (lessonsDir, quizzesDir, options, command) => {
    const globalOptions = command.parent?.opts() || {};
    setupLogging(globalOptions);
    logger.section('Loading Course Data');
    logger.info(`Lessons directory: ${lessonsDir}`);
    logger.info(`Quizzes directory: ${quizzesDir}`);
    try {
        const result = await loadCourse(lessonsDir, quizzesDir);
        if (result.success) {
            logger.success(`Course loaded successfully with ID: ${result.courseId}`);
            process.exit(0);
        }
        else {
            logger.error('Failed to load course:', result.error);
            process.exit(1);
        }
    }
    catch (error) {
        logger.error('Error loading course:', error);
        process.exit(1);
    }
});
// Add all command to load both survey and course data
program
    .command('all')
    .description('Load both survey and course data')
    .argument('[yaml-file]', 'Path to the survey YAML file', DEFAULT_SURVEY_PATH)
    .argument('[lessons-dir]', 'Path to the lessons directory', DEFAULT_LESSONS_PATH)
    .argument('[quizzes-dir]', 'Path to the quizzes directory', DEFAULT_QUIZZES_PATH)
    .action(async (yamlFile, lessonsDir, quizzesDir, options, command) => {
    const globalOptions = command.parent?.opts() || {};
    setupLogging(globalOptions);
    logger.section('Loading All Data');
    try {
        // Load survey data
        logger.info('Loading survey data...');
        const surveyResult = await loadSurvey(yamlFile);
        if (surveyResult.success) {
            logger.success(`Survey loaded successfully with ID: ${surveyResult.surveyId}`);
        }
        else {
            logger.error('Failed to load survey:', surveyResult.error);
            process.exit(1);
        }
        // Load course data
        logger.info('Loading course data...');
        const courseResult = await loadCourse(lessonsDir, quizzesDir);
        if (courseResult.success) {
            logger.success(`Course loaded successfully with ID: ${courseResult.courseId}`);
        }
        else {
            logger.error('Failed to load course:', courseResult.error);
            process.exit(1);
        }
        logger.success('All data loaded successfully!');
        process.exit(0);
    }
    catch (error) {
        logger.error('Error loading data:', error);
        process.exit(1);
    }
});
// Setup logging based on command-line options
function setupLogging(options) {
    if (options.verbose) {
        setLogLevel(LogLevel.DEBUG);
    }
    else if (options.quiet) {
        setLogLevel(LogLevel.ERROR);
    }
    else {
        setLogLevel(LogLevel.INFO);
    }
}
// Parse command-line arguments
program.parse();
// If no command is provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
