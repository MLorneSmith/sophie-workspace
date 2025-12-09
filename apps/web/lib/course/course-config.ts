/**
 * Configuration for course completion requirements.
 *
 * A course is considered completed when all 23 required lessons are marked as completed.
 * The required lessons are numbered 6-29 in the database (sequential IDs).
 *
 * Lessons 30 and 31 are not required for completion and are only shown after
 * the course is completed.
 */

/**
 * List of lesson numbers that are required for course completion.
 * These match the lesson_number values in the course_lessons table.
 */
export const REQUIRED_LESSON_NUMBERS = [
	"6",
	"8",
	"9",
	"10",
	"11",
	"12",
	"13",
	"14",
	"15",
	"16",
	"17",
	"18",
	"19",
	"20",
	"21",
	"22",
	"23",
	"24",
	"25",
	"26",
	"27",
	"28",
	"29",
];

/**
 * Total number of required lessons for course completion.
 */
export const TOTAL_REQUIRED_LESSONS = REQUIRED_LESSON_NUMBERS.length; // 23
