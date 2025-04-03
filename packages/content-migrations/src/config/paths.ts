/**
 * Central configuration for data paths
 *
 * This file provides a central location for all path configurations used in the content migration system.
 * Using these constants instead of hardcoded paths makes it easier to update path references in the future.
 */
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base directories
export const CONFIG_DIR = __dirname;
export const SRC_DIR = path.resolve(__dirname, '..');
export const DATA_DIR = path.resolve(SRC_DIR, 'data');
export const SCRIPTS_DIR = path.resolve(SRC_DIR, 'scripts');
export const UTILS_DIR = path.resolve(SRC_DIR, 'utils');

// Data directories
export const RAW_DATA_DIR = path.resolve(DATA_DIR, 'raw');
export const PROCESSED_DATA_DIR = path.resolve(DATA_DIR, 'processed');
export const PROCESSED_SQL_DIR = path.resolve(PROCESSED_DATA_DIR, 'sql');
export const PROCESSED_JSON_DIR = path.resolve(PROCESSED_DATA_DIR, 'json');

// Raw data subdirectories
export const RAW_COURSES_DIR = path.resolve(RAW_DATA_DIR, 'courses');
export const RAW_LESSONS_DIR = path.resolve(RAW_COURSES_DIR, 'lessons');
export const RAW_QUIZZES_DIR = path.resolve(RAW_COURSES_DIR, 'quizzes');
export const RAW_DOCUMENTATION_DIR = path.resolve(
  RAW_DATA_DIR,
  'documentation',
);
export const RAW_POSTS_DIR = path.resolve(RAW_DATA_DIR, 'posts');
export const RAW_SURVEYS_DIR = path.resolve(RAW_DATA_DIR, 'surveys');

// Payload directories
export const PAYLOAD_DIR = path.resolve(SRC_DIR, '../../../apps/payload');
export const PAYLOAD_SEED_DIR = path.resolve(PAYLOAD_DIR, 'src/seed');
export const PAYLOAD_SQL_SEED_DIR = path.resolve(PAYLOAD_SEED_DIR, 'sql');

/**
 * Gets a file path relative to the project root
 * @param absolutePath - The absolute path to convert
 * @returns The relative path from the project root
 */
export function getRelativePath(absolutePath: string): string {
  const projectRoot = path.resolve(SRC_DIR, '../../..');
  return path.relative(projectRoot, absolutePath);
}

/**
 * Logs the path configuration for debugging
 */
export function logPathConfiguration(): void {
  console.log('Path Configuration:');
  console.log('------------------');
  console.log(`CONFIG_DIR: ${getRelativePath(CONFIG_DIR)}`);
  console.log(`SRC_DIR: ${getRelativePath(SRC_DIR)}`);
  console.log(`DATA_DIR: ${getRelativePath(DATA_DIR)}`);
  console.log(`RAW_DATA_DIR: ${getRelativePath(RAW_DATA_DIR)}`);
  console.log(`PROCESSED_DATA_DIR: ${getRelativePath(PROCESSED_DATA_DIR)}`);
  console.log(`PROCESSED_SQL_DIR: ${getRelativePath(PROCESSED_SQL_DIR)}`);
  console.log(`PROCESSED_JSON_DIR: ${getRelativePath(PROCESSED_JSON_DIR)}`);
  console.log(`PAYLOAD_DIR: ${getRelativePath(PAYLOAD_DIR)}`);
  console.log(`PAYLOAD_SEED_DIR: ${getRelativePath(PAYLOAD_SEED_DIR)}`);
  console.log(`PAYLOAD_SQL_SEED_DIR: ${getRelativePath(PAYLOAD_SQL_SEED_DIR)}`);
}

// Run the log function if this file is executed directly
if (import.meta.url === import.meta.resolve('./paths.ts')) {
  logPathConfiguration();
}
