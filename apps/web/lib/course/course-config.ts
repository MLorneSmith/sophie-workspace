/**
 * Configuration for course completion requirements.
 *
 * A course is considered completed when all 23 required lessons are marked as completed.
 * The required lessons are: 101, 103, 104, 201, 202, 203, 204, 301, 302, 401, 402, 403,
 * 501, 502, 503, 504, 511, 602, 603, 604, 611, 701, 702
 *
 * Lessons 801 and 802 are not required for completion and are only shown after
 * the course is completed.
 */

/**
 * List of lesson numbers that are required for course completion.
 */
export const REQUIRED_LESSON_NUMBERS = [
  '101',
  '103',
  '104',
  '201',
  '202',
  '203',
  '204',
  '301',
  '302',
  '401',
  '402',
  '403',
  '501',
  '502',
  '503',
  '504',
  '511',
  '602',
  '603',
  '604',
  '611',
  '701',
  '702',
];

/**
 * Total number of required lessons for course completion.
 */
export const TOTAL_REQUIRED_LESSONS = REQUIRED_LESSON_NUMBERS.length; // 23
