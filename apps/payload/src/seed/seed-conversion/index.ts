#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { program } from "commander";
import configPromise from "../../payload.config";
import {
	MediaExtractor,
	extractMediaFromDirectory,
} from "./extractors/media-extractor";
import {
	DownloadExtractor,
	extractDownloadsFromDirectory,
} from "./extractors/download-extractor";
import { ReferenceManager } from "./utils/reference-manager";
import { convertPosts } from "./converters/posts-converter";
import { convertCourses } from "./converters/courses-converter";
import { convertQuizQuestions } from "./converters/quiz-questions-converter";
import { convertSurveyQuestions } from "./converters/survey-questions-converter";
import { convertCourseLessons } from "./converters/course-lessons-converter";
import { convertCourseQuizzes } from "./converters/course-quizzes-converter";
import { convertSurveys } from "./converters/surveys-converter";
import { convertDocumentation } from "./converters/documentation-converter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ConversionOptions {
	dryRun?: boolean;
	verbose?: boolean;
	collections?: string[];
}

async function main() {
	program
		.name("seed-converter")
		.description("Convert raw seed data to Payload JSON format")
		.option("-d, --dry-run", "Run without writing files", false)
		.option("-v, --verbose", "Verbose output", false)
		.option(
			"-c, --collections <collections...>",
			"Specific collections to convert",
		)
		.parse();

	const options: ConversionOptions = program.opts();

	console.log("🚀 Starting seed data conversion...");

	// Paths
	const sourceDir = path.join(__dirname, "../seed-data-raw");
	const outputDir = path.join(__dirname, "../seed-data");

	// Ensure output directory exists
	if (!options.dryRun) {
		await fs.mkdir(outputDir, { recursive: true });
	}

	try {
		// Step 1: Extract all media and download references
		console.log("\n📸 Extracting media references...");
		const mediaExtractor = new MediaExtractor();
		await extractMediaFromDirectory(sourceDir, mediaExtractor);

		if (!options.dryRun) {
			await mediaExtractor.saveReferences(
				path.join(outputDir, "media-references.json"),
			);
		}

		console.log(
			`  ✅ Found ${mediaExtractor.getReferences().length} media references`,
		);

		console.log("\n📥 Extracting download references...");
		const downloadExtractor = new DownloadExtractor();
		await extractDownloadsFromDirectory(sourceDir, downloadExtractor);

		if (!options.dryRun) {
			await downloadExtractor.saveReferences(
				path.join(outputDir, "download-references.json"),
			);
		}

		console.log(
			`  ✅ Found ${downloadExtractor.getReferences().length} download references`,
		);

		// Step 2: Initialize reference manager
		const referenceManager = new ReferenceManager();

		// Add media references to manager
		mediaExtractor.getReferences().forEach((ref) => {
			referenceManager.addMapping({
				type: "media",
				originalId: ref.originalPath,
				identifier: ref.originalPath,
			});
		});

		// Add download references to manager
		downloadExtractor.getReferences().forEach((ref) => {
			referenceManager.addMapping({
				type: "download",
				originalId: ref.originalPath,
				identifier: ref.originalPath,
			});
		});

		// Step 3: Create a minimal config for conversion
		// We don't need the full Payload config, just enough for the Lexical editor
		const payloadConfig = {} as any; // We'll pass this to converters but they can handle it

		// Step 4: Convert collections in dependency order
		const conversionOrder = [
			"users", // No dependencies
			"media", // No dependencies (references already extracted)
			"downloads", // No dependencies (references already extracted)
			"posts", // Depends on: users, media
			"courses", // Depends on: downloads
			"course-quizzes", // Depends on: courses
			"quiz-questions", // No dependencies
			"surveys", // Depends on: downloads
			"survey-questions", // No dependencies
			"course-lessons", // Depends on: courses, quizzes, surveys, downloads
			"documentation", // Depends on: media
			"private", // Depends on: users, media
		];

		const collectionsToConvert = options.collections || conversionOrder;

		console.log("\n🔄 Converting collections...");

		for (const collection of collectionsToConvert) {
			if (!conversionOrder.includes(collection)) {
				console.log(`  ⚠️  Unknown collection: ${collection}`);
				continue;
			}

			console.log(`\n  📦 Converting ${collection}...`);

			let result;

			switch (collection) {
				case "posts":
					result = await convertPosts(
						sourceDir,
						payloadConfig,
						referenceManager,
					);
					break;

				case "courses":
					await convertCourses(referenceManager);
					// Return a success result for consistency
					result = { success: true, data: [] };
					break;

				case "quiz-questions":
					await convertQuizQuestions(referenceManager);
					// Return a success result for consistency
					result = { success: true, data: [] };
					break;

				case "survey-questions":
					await convertSurveyQuestions(referenceManager);
					// Return a success result for consistency
					result = { success: true, data: [] };
					break;

				case "course-lessons":
					await convertCourseLessons(referenceManager);
					result = { success: true, data: [] };
					break;

				case "course-quizzes":
					await convertCourseQuizzes(referenceManager);
					result = { success: true, data: [] };
					break;

				case "surveys":
					await convertSurveys(referenceManager);
					result = { success: true, data: [] };
					break;

				case "documentation":
					await convertDocumentation(referenceManager);
					result = { success: true, data: [] };
					break;

				case "private":
					console.log("    ⏭️  Private converter not yet implemented");
					continue;

				case "users":
				case "media":
				case "downloads":
					console.log("    ℹ️  Handled separately");
					continue;

				default:
					console.log("    ❓ Unknown collection");
					continue;
			}

			if (result) {
				if (result.success) {
					console.log(`    ✅ Converted ${result.data?.length || 0} items`);

					if (!options.dryRun && result.data && result.data.length > 0) {
						const outputPath = path.join(outputDir, `${collection}.json`);
						await fs.writeFile(
							outputPath,
							JSON.stringify(result.data, null, 2),
						);
					}
				} else {
					console.log("    ❌ Conversion failed");
					result.errors?.forEach((error) => console.log(`      - ${error}`));
				}

				if (result.warnings?.length) {
					console.log("    ⚠️  Warnings:");
					result.warnings.forEach((warning) =>
						console.log(`      - ${warning}`),
					);
				}
			}
		}

		// Step 5: Save reference mappings
		if (!options.dryRun) {
			const mappingsPath = path.join(outputDir, "reference-mappings.json");
			await fs.writeFile(
				mappingsPath,
				JSON.stringify(referenceManager.getMappings(), null, 2),
			);
		}

		console.log("\n✨ Conversion complete!");
	} catch (error) {
		console.error("\n❌ Conversion failed:", error);
		process.exit(1);
	}
}

// Run the conversion
main().catch(console.error);
