"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYLOAD_SQL_SEED_DIR = exports.PAYLOAD_SEED_DIR = exports.PAYLOAD_DIR = exports.RAW_SURVEYS_DIR = exports.RAW_POSTS_DIR = exports.RAW_DOCUMENTATION_DIR = exports.RAW_QUIZZES_DIR = exports.RAW_LESSONS_DIR = exports.RAW_COURSES_DIR = exports.PROCESSED_JSON_DIR = exports.PROCESSED_SQL_DIR = exports.PROCESSED_DATA_DIR = exports.RAW_DATA_DIR = exports.UTILS_DIR = exports.SCRIPTS_DIR = exports.DATA_DIR = exports.SRC_DIR = exports.CONFIG_DIR = void 0;
exports.getRelativePath = getRelativePath;
exports.logPathConfiguration = logPathConfiguration;
/**
 * Central configuration for data paths
 *
 * This file provides a central location for all path configurations used in the content migration system.
 * Using these constants instead of hardcoded paths makes it easier to update path references in the future.
 */
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
// Get the current file's directory
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Base directories
exports.CONFIG_DIR = __dirname;
exports.SRC_DIR = path_1.default.resolve(__dirname, '..');
exports.DATA_DIR = path_1.default.resolve(exports.SRC_DIR, 'data');
exports.SCRIPTS_DIR = path_1.default.resolve(exports.SRC_DIR, 'scripts');
exports.UTILS_DIR = path_1.default.resolve(exports.SRC_DIR, 'utils');
// Data directories
exports.RAW_DATA_DIR = path_1.default.resolve(exports.DATA_DIR, 'raw');
exports.PROCESSED_DATA_DIR = path_1.default.resolve(exports.DATA_DIR, 'processed');
exports.PROCESSED_SQL_DIR = path_1.default.resolve(exports.PROCESSED_DATA_DIR, 'sql');
exports.PROCESSED_JSON_DIR = path_1.default.resolve(exports.PROCESSED_DATA_DIR, 'json');
// Raw data subdirectories
exports.RAW_COURSES_DIR = path_1.default.resolve(exports.RAW_DATA_DIR, 'courses');
exports.RAW_LESSONS_DIR = path_1.default.resolve(exports.RAW_COURSES_DIR, 'lessons');
exports.RAW_QUIZZES_DIR = path_1.default.resolve(exports.RAW_COURSES_DIR, 'quizzes');
exports.RAW_DOCUMENTATION_DIR = path_1.default.resolve(exports.RAW_DATA_DIR, 'documentation');
exports.RAW_POSTS_DIR = path_1.default.resolve(exports.RAW_DATA_DIR, 'posts');
exports.RAW_SURVEYS_DIR = path_1.default.resolve(exports.RAW_DATA_DIR, 'surveys');
// Payload directories
exports.PAYLOAD_DIR = path_1.default.resolve(exports.SRC_DIR, '../../../apps/payload');
exports.PAYLOAD_SEED_DIR = path_1.default.resolve(exports.PAYLOAD_DIR, 'src/seed');
exports.PAYLOAD_SQL_SEED_DIR = path_1.default.resolve(exports.PAYLOAD_SEED_DIR, 'sql');
/**
 * Gets a file path relative to the project root
 * @param absolutePath - The absolute path to convert
 * @returns The relative path from the project root
 */
function getRelativePath(absolutePath) {
    const projectRoot = path_1.default.resolve(exports.SRC_DIR, '../../..');
    return path_1.default.relative(projectRoot, absolutePath);
}
/**
 * Logs the path configuration for debugging
 */
function logPathConfiguration() {
    console.log('Path Configuration:');
    console.log('------------------');
    console.log(`CONFIG_DIR: ${getRelativePath(exports.CONFIG_DIR)}`);
    console.log(`SRC_DIR: ${getRelativePath(exports.SRC_DIR)}`);
    console.log(`DATA_DIR: ${getRelativePath(exports.DATA_DIR)}`);
    console.log(`RAW_DATA_DIR: ${getRelativePath(exports.RAW_DATA_DIR)}`);
    console.log(`PROCESSED_DATA_DIR: ${getRelativePath(exports.PROCESSED_DATA_DIR)}`);
    console.log(`PROCESSED_SQL_DIR: ${getRelativePath(exports.PROCESSED_SQL_DIR)}`);
    console.log(`PROCESSED_JSON_DIR: ${getRelativePath(exports.PROCESSED_JSON_DIR)}`);
    console.log(`PAYLOAD_DIR: ${getRelativePath(exports.PAYLOAD_DIR)}`);
    console.log(`PAYLOAD_SEED_DIR: ${getRelativePath(exports.PAYLOAD_SEED_DIR)}`);
    console.log(`PAYLOAD_SQL_SEED_DIR: ${getRelativePath(exports.PAYLOAD_SQL_SEED_DIR)}`);
}
// Run the log function if this file is executed directly
if (import.meta.url === import.meta.resolve('./paths.ts')) {
    logPathConfiguration();
}
