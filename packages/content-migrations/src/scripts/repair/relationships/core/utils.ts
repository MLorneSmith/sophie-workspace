/**
 * Utility functions for relationship management
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Calculate the project root for file operations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../../../../');

/**
 * Save a JSON object to a file
 *
 * @param filePath Relative path to the file
 * @param data Data to save
 */
export async function saveJsonToFile(
  filePath: string,
  data: any,
): Promise<string> {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const dirPath = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write the file
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2));

    return fullPath;
  } catch (error) {
    console.error(`Error saving JSON to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Load a JSON object from a file
 *
 * @param filePath Relative path to the file
 * @returns Parsed JSON data
 */
export async function loadJsonFromFile<T = any>(filePath: string): Promise<T> {
  try {
    const fullPath = path.join(projectRoot, filePath);
    const fileContent = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(fileContent) as T;
  } catch (error) {
    console.error(`Error loading JSON from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Check if a file exists
 *
 * @param filePath Relative path to the file
 * @returns True if the file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(projectRoot, filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the value of a nested property from an object
 *
 * @param obj The object to get the property from
 * @param path The path to the property (e.g. 'a.b.c')
 * @param defaultValue The default value to return if the property doesn't exist
 * @returns The value of the property or the default value
 */
export function getNestedValue(
  obj: any,
  path: string,
  defaultValue: any = undefined,
): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Generate a timestamp-based ID for logging and file naming
 *
 * @returns A string ID in the format YYYYMMDD-HHMMSS-SSS
 */
export function generateTimestampId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;
}

/**
 * Create a log message with timestamp
 *
 * @param message The message to log
 * @param type The type of log message (info, warn, error)
 * @returns The formatted log message
 */
export function formatLogMessage(
  message: string,
  type: 'info' | 'warn' | 'error' = 'info',
): string {
  const timestamp = new Date().toISOString();
  const prefix =
    type === 'error' ? 'ERROR' : type === 'warn' ? 'WARNING' : 'INFO';
  return `[${timestamp}] ${prefix}: ${message}`;
}

/**
 * Safely parse a string as JSON, returning undefined on failure
 *
 * @param str The string to parse
 * @returns The parsed JSON object or undefined
 */
export function safeJsonParse<T = any>(str: string): T | undefined {
  try {
    return JSON.parse(str) as T;
  } catch {
    return undefined;
  }
}

/**
 * Check if a string is a valid UUID
 *
 * @param str The string to check
 * @returns True if the string is a valid UUID
 */
export function isUuid(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generate a summary report from a verification result
 *
 * @param result The verification result
 * @returns A formatted string summary
 */
export function generateSummaryReport(result: any): string {
  // Build a summary report
  const lines = ['Verification Summary:'];

  // Add general statistics
  if (result.totalRelationships !== undefined) {
    lines.push(`- Total relationships: ${result.totalRelationships}`);
  }
  if (result.checkedRelationships !== undefined) {
    lines.push(`- Checked relationships: ${result.checkedRelationships}`);
  }

  // Add summary information
  if (result.summary) {
    if (result.summary.passedCount !== undefined) {
      lines.push(`- Passed: ${result.summary.passedCount}`);
    }
    if (result.summary.failedCount !== undefined) {
      lines.push(`- Failed: ${result.summary.failedCount}`);
    }
    if (result.summary.passRate !== undefined) {
      lines.push(`- Pass rate: ${result.summary.passRate.toFixed(2)}%`);
    }
  }

  // Add error details if present
  if (
    result.inconsistentRelationships &&
    result.inconsistentRelationships.length > 0
  ) {
    lines.push('\nInconsistent Relationships:');
    for (const issue of result.inconsistentRelationships) {
      lines.push(
        `- ${issue.collection}.${issue.field} -> ${issue.targetCollection}: ` +
          `${issue.issueType} (count: ${issue.count})`,
      );
    }
  }

  return lines.join('\n');
}
