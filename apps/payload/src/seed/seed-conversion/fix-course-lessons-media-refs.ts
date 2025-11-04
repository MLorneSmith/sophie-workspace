/**
 * Fix course-lessons.json media references to match actual media.json _ref values
 *
 * Problem: course-lessons.json uses kebab-case/hyphenated references but
 * media.json _refs use actual filename stems (with underscores)
 *
 * Solution: Update course-lessons media references to match actual filenames
 *
 * Usage: npx tsx src/seed/seed-conversion/fix-course-lessons-media-refs.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const COURSE_LESSONS_JSON = path.join(
	__dirname,
	"../seed-data/course-lessons.json",
);
const MEDIA_JSON = path.join(__dirname, "../seed-data/media.json");

interface MediaRecord {
	_ref: string;
	filename: string;
	[key: string]: unknown;
}

interface CourseLessonRecord {
	[key: string]: unknown;
}

// Load media.json to get actual _ref values
const mediaRecords: MediaRecord[] = JSON.parse(
	fs.readFileSync(MEDIA_JSON, "utf-8"),
);

// Create filename → _ref mapping
const filenameToRef = new Map<string, string>();
mediaRecords.forEach((record) => {
	const filenameStem = record.filename.replace(
		/\.(webp|jpg|png|gif|svg|ico)$/i,
		"",
	);
	filenameToRef.set(filenameStem, record._ref);

	// Also map some common variations
	const kebabVersion = filenameStem.replace(/_/g, "-");
	filenameToRef.set(kebabVersion, record._ref);

	// Handle numbered files with underscores (e.g., "1-our_process" → "our-process")
	if (filenameStem.match(/^\d+-/)) {
		const withoutNumber = filenameStem.replace(/^\d+-/, "");
		const kebabWithoutNumber = withoutNumber.replace(/_/g, "-");
		filenameToRef.set(kebabWithoutNumber, record._ref);
	}
});

// Manual mappings for special cases
const manualMappings: Record<string, string> = {
	"lesson-0": "lesson_zero",
	"before-we-begin": "before_we_begin",
	"tools-and-resources": "tools_resources",
	"what-structure": "6-what_structure",
	"overview-elements-design": "11-overview_elements_design",
	"gestalt-principles": "13-gestalt_principles_of_perception",
	"fact-based-persuasion": "15-fact_based_persuasion_overview",
};

// Load course-lessons.json
const courseLessons: CourseLessonRecord[] = JSON.parse(
	fs.readFileSync(COURSE_LESSONS_JSON, "utf-8"),
);

console.log(`Processing ${courseLessons.length} course lessons\n`);

// Track changes
let changeCount = 0;

// Recursive function to replace media references in nested objects
function replaceMediaRefs(obj: any): any {
	if (typeof obj === "string") {
		const refPattern = /\{ref:media:([^}]+)\}/g;
		const matches = Array.from(obj.matchAll(refPattern));

		if (matches.length > 0) {
			let result = obj;
			for (const match of matches) {
				const oldRef = match[1];

				// Try manual mapping first
				let newRef = manualMappings[oldRef];

				// If no manual mapping, try automatic lookup
				if (!newRef) {
					newRef = filenameToRef.get(oldRef) || oldRef;
				}

				if (newRef !== oldRef) {
					result = result.replace(
						`{ref:media:${oldRef}}`,
						`{ref:media:${newRef}}`,
					);
					console.log(`  ✓ ${oldRef} → ${newRef}`);
					changeCount++;
				}
			}
			return result;
		}
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(replaceMediaRefs);
	}

	if (obj !== null && typeof obj === "object") {
		const result: any = {};
		for (const [key, value] of Object.entries(obj)) {
			result[key] = replaceMediaRefs(value);
		}
		return result;
	}

	return obj;
}

// Process all lessons
const updatedLessons = courseLessons.map((lesson) => replaceMediaRefs(lesson));

// Write updated course-lessons.json
fs.writeFileSync(COURSE_LESSONS_JSON, JSON.stringify(updatedLessons, null, 2));

console.log(`\n✅ Updated ${courseLessons.length} course lesson records`);
console.log(`📝 Written to: ${COURSE_LESSONS_JSON}`);
console.log("\n📊 Summary:");
console.log(`   Total references changed: ${changeCount}`);
