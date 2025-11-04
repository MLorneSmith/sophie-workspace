import { promises as fs } from "node:fs";
import * as path from "node:path";
import { createServiceLogger } from "@kit/shared/logger";
import type { Course } from "../../../../payload-types";
import type { ReferenceManager } from "../utils/reference-manager";

const { getLogger } = createServiceLogger("SEED-CONVERTER");

interface RawCourse {
	slug: string;
	title: string;
	description: string;
	status: "draft" | "published";
	content?: unknown;
	downloads?: string[];
	publishedAt?: string;
}

export async function convertCourses(
	referenceManager: ReferenceManager,
): Promise<void> {
	const logger = await getLogger();
	logger.info("Converting courses from raw data...");

	try {
		// Read course data from raw data directory
		const coursesDir = path.join(
			process.cwd(),
			"src/seed/seed-data-raw/courses",
		);

		// Ensure directory exists
		await fs.mkdir(coursesDir, { recursive: true });

		const courseFiles = await fs.readdir(coursesDir);
		const jsonFiles = courseFiles.filter((f) => f.endsWith(".json"));

		if (jsonFiles.length === 0) {
			logger.warn("No course files found in seed-data-raw/courses");
			return;
		}

		const courses: Partial<Course>[] = [];

		for (const file of jsonFiles) {
			const filePath = path.join(coursesDir, file);
			const fileContent = await fs.readFile(filePath, "utf-8");
			const rawCourse: RawCourse = JSON.parse(fileContent);

			// Build course object matching Courses collection schema
			const course: Partial<Course> & { _ref: string } = {
				id: rawCourse.slug, // Add id field for Payload CMS validation
				_ref: rawCourse.slug, // Add _ref for seed engine reference resolution
				slug: rawCourse.slug,
				title: rawCourse.title,
				description: rawCourse.description,
				status: rawCourse.status,
				content: rawCourse.content as Course["content"],
				downloads: rawCourse.downloads,
				publishedAt: rawCourse.publishedAt,
			};

			courses.push(course);

			// Add reference for future converters
			referenceManager.addMapping({
				type: "collection",
				collection: "courses",
				originalId: rawCourse.slug,
				identifier: rawCourse.slug,
				newId: rawCourse.slug,
			});

			logger.info(`Loaded course: ${rawCourse.title} (${rawCourse.slug})`);
		}

		// Save to JSON
		const outputDir = path.join(process.cwd(), "src/seed/seed-data");
		await fs.mkdir(outputDir, { recursive: true });
		await fs.writeFile(
			path.join(outputDir, "courses.json"),
			JSON.stringify(courses, null, 2),
		);

		logger.info(`Successfully converted ${courses.length} courses`);
	} catch (error) {
		logger.error("Failed to convert courses", { error });
		throw error;
	}
}
