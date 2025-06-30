#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationResult {
	collection: string;
	valid: boolean;
	errors: string[];
	warnings: string[];
	itemCount: number;
}

async function validateGeneratedJSON(): Promise<void> {
	console.log("🔍 Validating generated JSON files...");

	const seedDataDir = path.join(__dirname, "../seed-data");
	const results: ValidationResult[] = [];

	// Define expected collections and their basic structure
	const collections = {
		"posts.json": {
			requiredFields: [
				"id",
				"title",
				"content",
				"published",
				"createdAt",
				"updatedAt",
			],
			optionalFields: [
				"description",
				"excerpt",
				"author",
				"featuredImage",
				"tags",
				"category",
			],
		},
		"courses.json": {
			requiredFields: [
				"id",
				"title",
				"description",
				"published",
				"createdAt",
				"updatedAt",
			],
			optionalFields: [
				"image",
				"price",
				"duration",
				"difficulty",
				"learningOutcomes",
				"prerequisites",
			],
		},
		"course-lessons.json": {
			requiredFields: [
				"id",
				"title",
				"content",
				"course",
				"order",
				"published",
				"createdAt",
				"updatedAt",
			],
			optionalFields: [
				"description",
				"video",
				"quiz",
				"surveys",
				"downloads",
				"duration",
			],
		},
		"course-quizzes.json": {
			requiredFields: [
				"id",
				"title",
				"questions",
				"passingScore",
				"maxAttempts",
				"published",
				"createdAt",
				"updatedAt",
			],
			optionalFields: [
				"description",
				"instructions",
				"timeLimit",
				"showCorrectAnswers",
				"randomizeQuestions",
				"course",
				"lesson",
			],
		},
		"quiz-questions.json": {
			requiredFields: [
				"id",
				"question",
				"questionType",
				"options",
				"correctAnswer",
				"createdAt",
				"updatedAt",
			],
			optionalFields: [
				"explanation",
				"points",
				"difficulty",
				"tags",
				"category",
			],
		},
		"surveys.json": {
			requiredFields: [
				"id",
				"title",
				"questions",
				"anonymous",
				"multipleSubmissions",
				"published",
				"createdAt",
				"updatedAt",
			],
			optionalFields: [
				"description",
				"instructions",
				"completionMessage",
				"course",
				"lesson",
			],
		},
		"survey-questions.json": {
			requiredFields: [
				"id",
				"question",
				"questionType",
				"createdAt",
				"updatedAt",
			],
			optionalFields: [
				"options",
				"required",
				"placeholder",
				"validation",
				"description",
			],
		},
		"documentation.json": {
			requiredFields: [
				"id",
				"title",
				"content",
				"slug",
				"published",
				"createdAt",
				"updatedAt",
			],
			optionalFields: [
				"description",
				"category",
				"parent",
				"children",
				"order",
				"featured",
				"tags",
				"breadcrumbs",
			],
		},
	};

	for (const [filename, schema] of Object.entries(collections)) {
		const filepath = path.join(seedDataDir, filename);

		try {
			// Check if file exists
			const content = await fs.readFile(filepath, "utf-8");
			const data = JSON.parse(content);

			const result = validateCollection(
				filename.replace(".json", ""),
				data,
				schema,
			);
			results.push(result);

			if (result.valid) {
				console.log(
					`  ✅ ${filename}: ${result.itemCount} items, valid structure`,
				);
			} else {
				console.log(
					`  ❌ ${filename}: ${result.itemCount} items, ${result.errors.length} errors`,
				);
				result.errors.forEach((error) => console.log(`    - ${error}`));
			}

			if (result.warnings.length > 0) {
				console.log(`    ⚠️  ${result.warnings.length} warnings`);
				result.warnings.forEach((warning) => console.log(`    - ${warning}`));
			}
		} catch (error) {
			results.push({
				collection: filename.replace(".json", ""),
				valid: false,
				errors: [`Failed to read or parse file: ${error}`],
				warnings: [],
				itemCount: 0,
			});
			console.log(`  ❌ ${filename}: Failed to read or parse`);
		}
	}

	// Validate cross-collection references
	console.log("\n🔗 Validating cross-collection references...");
	await validateReferences(seedDataDir);

	// Summary
	const validCollections = results.filter((r) => r.valid).length;
	const totalCollections = results.length;
	const totalItems = results.reduce((sum, r) => sum + r.itemCount, 0);

	console.log("\n📊 Validation Summary:");
	console.log(`  Collections: ${validCollections}/${totalCollections} valid`);
	console.log(`  Total Items: ${totalItems}`);
	console.log(
		`  Status: ${validCollections === totalCollections ? "✅ All Valid" : "❌ Some Issues"}`,
	);
}

function validateCollection(
	collectionName: string,
	data: any[],
	schema: { requiredFields: string[]; optionalFields: string[] },
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!Array.isArray(data)) {
		errors.push("Data is not an array");
		return {
			collection: collectionName,
			valid: false,
			errors,
			warnings,
			itemCount: 0,
		};
	}

	data.forEach((item, index) => {
		// Check required fields
		schema.requiredFields.forEach((field) => {
			if (!(field in item)) {
				errors.push(`Item ${index}: Missing required field '${field}'`);
			} else if (item[field] === null || item[field] === undefined) {
				errors.push(
					`Item ${index}: Required field '${field}' is null/undefined`,
				);
			}
		});

		// Check for unknown fields
		const allValidFields = [...schema.requiredFields, ...schema.optionalFields];
		Object.keys(item).forEach((field) => {
			if (!allValidFields.includes(field)) {
				warnings.push(`Item ${index}: Unknown field '${field}'`);
			}
		});

		// Validate specific field types
		if ("id" in item && (typeof item.id !== "string" || !item.id.trim())) {
			errors.push(`Item ${index}: Invalid id field`);
		}

		if ("published" in item && typeof item.published !== "boolean") {
			errors.push(`Item ${index}: 'published' must be boolean`);
		}

		// Validate date fields
		const dateFields = ["createdAt", "updatedAt"];
		dateFields.forEach((dateField) => {
			if (dateField in item) {
				const date = new Date(item[dateField]);
				if (isNaN(date.getTime())) {
					errors.push(`Item ${index}: Invalid date in '${dateField}'`);
				}
			}
		});

		// Validate references (should start with {ref:)
		Object.entries(item).forEach(([key, value]) => {
			if (typeof value === "string" && value.startsWith("{ref:")) {
				if (!value.match(/^\{ref:[a-zA-Z0-9-]+:[a-zA-Z0-9-]+\}$/)) {
					errors.push(
						`Item ${index}: Invalid reference format in '${key}': ${value}`,
					);
				}
			} else if (Array.isArray(value)) {
				value.forEach((arrItem, arrIndex) => {
					if (typeof arrItem === "string" && arrItem.startsWith("{ref:")) {
						if (!arrItem.match(/^\{ref:[a-zA-Z0-9-]+:[a-zA-Z0-9-]+\}$/)) {
							errors.push(
								`Item ${index}.${key}[${arrIndex}]: Invalid reference format: ${arrItem}`,
							);
						}
					}
				});
			}
		});
	});

	return {
		collection: collectionName,
		valid: errors.length === 0,
		errors,
		warnings,
		itemCount: data.length,
	};
}

async function validateReferences(seedDataDir: string): Promise<void> {
	try {
		// Load all collections to build a reference map
		const referenceMap = new Map<string, Set<string>>();

		const files = await fs.readdir(seedDataDir);
		const jsonFiles = files.filter(
			(f) =>
				f.endsWith(".json") &&
				!f.includes("mapping") &&
				!f.includes("references"),
		);

		for (const file of jsonFiles) {
			const collectionName = file.replace(".json", "");
			const content = await fs.readFile(path.join(seedDataDir, file), "utf-8");
			const data = JSON.parse(content);

			const ids = new Set<string>();
			if (Array.isArray(data)) {
				data.forEach((item) => {
					if (item.id) {
						ids.add(item.id);
					}
				});
			}
			referenceMap.set(collectionName, ids);
		}

		// Validate that all references exist
		let brokenReferences = 0;

		for (const file of jsonFiles) {
			const content = await fs.readFile(path.join(seedDataDir, file), "utf-8");
			const data = JSON.parse(content);

			if (Array.isArray(data)) {
				data.forEach((item, index) => {
					Object.entries(item).forEach(([key, value]) => {
						const refs = extractReferences(value);
						refs.forEach((ref) => {
							const [collection, id] = ref.split(":");
							const targetIds = referenceMap.get(collection);

							if (!targetIds || !targetIds.has(id)) {
								console.log(
									`    ❌ Broken reference: ${file}[${index}].${key} -> {ref:${ref}}`,
								);
								brokenReferences++;
							}
						});
					});
				});
			}
		}

		if (brokenReferences === 0) {
			console.log("  ✅ All references valid");
		} else {
			console.log(`  ❌ Found ${brokenReferences} broken references`);
		}
	} catch (error) {
		console.log(`  ❌ Reference validation failed: ${error}`);
	}
}

function extractReferences(value: any): string[] {
	const refs: string[] = [];

	if (typeof value === "string" && value.startsWith("{ref:")) {
		const match = value.match(/^\{ref:([^}]+)\}$/);
		if (match) {
			refs.push(match[1]);
		}
	} else if (Array.isArray(value)) {
		value.forEach((item) => {
			refs.push(...extractReferences(item));
		});
	} else if (typeof value === "object" && value !== null) {
		Object.values(value).forEach((subValue) => {
			refs.push(...extractReferences(subValue));
		});
	}

	return refs;
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	validateGeneratedJSON().catch(console.error);
}

export { validateGeneratedJSON };
