"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSqlSeedFiles = generateSqlSeedFiles;
/**
 * Main SQL seed files generator using static definitions
 */
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lesson_quiz_relations_js_1 = require("../../data/definitions/lesson-quiz-relations.js");
const quiz_types_js_1 = require("../../data/definitions/quiz-types.js");
const quizzes_js_1 = require("../../data/definitions/quizzes.js");
const new_generate_lesson_quiz_references_sql_js_1 = require("./generators/new-generate-lesson-quiz-references-sql.js");
const new_generate_questions_sql_js_1 = require("./generators/new-generate-questions-sql.js");
const new_generate_quizzes_sql_js_1 = require("./generators/new-generate-quizzes-sql.js");
/**
 * Main function to generate all SQL seed files
 * @param outputDir Directory to write SQL files to
 */
async function generateSqlSeedFiles(outputDir) {
    console.log('Generating SQL seed files from static definitions...');
    // Create the output directory if it doesn't exist
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    // Step 1: Validate quiz definitions
    console.log('Validating quiz definitions...');
    const allQuizzesValid = Object.values(quizzes_js_1.QUIZZES).every(quiz_types_js_1.validateQuizDefinition);
    if (!allQuizzesValid) {
        throw new Error('Invalid quiz definitions found');
    }
    // Step 2: Validate lesson-quiz relations
    console.log('Validating lesson-quiz relations...');
    if (!(0, lesson_quiz_relations_js_1.validateLessonQuizRelations)()) {
        throw new Error('Invalid lesson-quiz relations found');
    }
    // Step 3: Generate and write SQL files
    console.log('Generating SQL files...');
    // 3.1: Generate quizzes SQL
    const quizzesSql = (0, new_generate_quizzes_sql_js_1.generateQuizzesSql)();
    fs_1.default.writeFileSync(path_1.default.join(outputDir, '03-quizzes.sql'), quizzesSql);
    console.log('Generated quizzes SQL file');
    // 3.2: Generate questions SQL
    const questionsSql = (0, new_generate_questions_sql_js_1.generateQuestionsSql)();
    fs_1.default.writeFileSync(path_1.default.join(outputDir, '04-questions.sql'), questionsSql);
    console.log('Generated questions SQL file');
    // 3.3: Generate lesson-quiz references SQL
    const referencesSql = (0, new_generate_lesson_quiz_references_sql_js_1.generateLessonQuizReferencesSql)();
    fs_1.default.writeFileSync(path_1.default.join(outputDir, '03a-lesson-quiz-references.sql'), referencesSql);
    console.log('Generated lesson-quiz references SQL file');
    console.log('All SQL seed files generated successfully!');
}
// Add a CLI entrypoint if needed
// Use ESM approach to check if this file is being executed directly
if (import.meta.url === import.meta.resolve('./new-generate-sql-seed-files.ts')) {
    // Default output directory
    const outputDir = process.argv[2] || path_1.default.resolve(process.cwd(), 'apps/payload/src/seed');
    generateSqlSeedFiles(outputDir)
        .then(() => console.log('Done!'))
        .catch((err) => {
        console.error('Error generating SQL seed files:', err);
        process.exit(1);
    });
}
