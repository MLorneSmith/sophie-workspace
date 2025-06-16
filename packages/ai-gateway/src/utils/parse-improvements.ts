/**
 * Utility for parsing AI responses into standardized improvement objects
 */
import type {
import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("AI-GATEWAY");

	BaseImprovement,
	ImprovementType,
} from "../prompts/types/improvements";

interface RawImprovement {
	improvementHeadline?: string;
	headline?: string;
	improvementDescription?: string;
	rationale?: string;
	implementedSummaryPoint?: string;
	summaryPoint?: string;
	implementedSupportingPoints?: string[];
	supportingPoints?: string[];
}

/**
 * Extracts JSON from a string that might contain additional text
 */
function extractJson(text: string): string | null {
	try {
		// First try to match the most specific JSON pattern
		const jsonPattern =
			/```json\s*([\s\S]*?)\s*```|```\s*([\s\S]*?)\s*```|\{[\s\S]*\}|\[[\s\S]*\]/;
		const match = text.match(jsonPattern);

		if (!match) return null;

		// If we matched a code block, use the content inside it
		if (match[1] || match[2]) {
			return match[1] || match[2] || null;
		}

		// Otherwise, return the whole match (direct JSON)
		return match[0];
	} catch (error) {
		/* TODO: Async logger needed */ logger.error("Error extracting JSON:", { data: error });
		return null;
	}
}

/**
 * Parses text format into improvement objects
 */
function parseTextFormat(text: string): RawImprovement[] {
	const improvements: RawImprovement[] = [];
	const improvementRegex =
		/Improvement \d+:\s*Headline: (.*?)\s*Rationale: (.*?)\s*Summary Point: (.*?)\s*Supporting Points:(.*?)(?=Improvement|\s*$)/g;
	const bulletPointRegex = /[-•]\s*(.*?)(?=[-•]|\s*$)/g;

	let match: RegExpExecArray | null = improvementRegex.exec(text);
	while (match !== null) {
		const [
			,
			headline = "",
			rationale = "",
			summaryPoint = "",
			supportingPointsText = "",
		] = match;

		const supportingPoints: string[] = [];
		let pointMatch: RegExpExecArray | null = bulletPointRegex.exec(supportingPointsText);
		while (pointMatch !== null) {
			if (pointMatch[1]) {
				supportingPoints.push(pointMatch[1].trim());
			}
			// Get next match for the inner loop
			pointMatch = bulletPointRegex.exec(supportingPointsText);
		}

		improvements.push({
			headline: headline.trim(),
			rationale: rationale.trim(),
			summaryPoint: summaryPoint.trim(),
			supportingPoints:
				supportingPoints.length > 0
					? supportingPoints
					: supportingPointsText
							.split("\n")
							.map((line) => line.trim())
							.filter((line) => line.length > 0),
		});
		
		// Get next match for the outer loop
		match = improvementRegex.exec(text);
	}

	return improvements;
}

/**
 * Normalizes a raw improvement object into our standard format
 */
function normalizeImprovement(
	raw: RawImprovement,
	index: number,
): BaseImprovement {
	return {
		id: `imp_${index + 1}`,
		improvementHeadline: raw.improvementHeadline || raw.headline || "",
		improvementDescription: raw.improvementDescription || raw.rationale || "",
		implementedSummaryPoint:
			raw.implementedSummaryPoint || raw.summaryPoint || "",
		implementedSupportingPoints:
			raw.implementedSupportingPoints || raw.supportingPoints || [],
	};
}

/**
 * Process parsed JSON into improvements
 * Extracted to avoid code duplication
 */
function improvementsFromParsed(parsed: unknown): BaseImprovement[] {
	const parsedObj = parsed as { improvements?: unknown[] } | unknown[];
	const improvementsArray = Array.isArray(parsedObj)
		? parsedObj
		: (parsedObj as { improvements?: unknown[] }).improvements || [];

	if (improvementsArray.length > 0) {
		return improvementsArray.map((imp: unknown, index: number) =>
			normalizeImprovement(imp as RawImprovement, index),
		);
	}

	return [];
}

/**
 * Parses an AI response into standardized improvement objects
 */
export function parseImprovements(
	response: string,
	_type: ImprovementType,
): BaseImprovement[] {
	try {
		// Log the raw response for debugging
		/* TODO: Async logger needed */ logger.info("Raw AI response:", { arg1: response.substring(0, arg2: 500 }) + (response.length > 500 ? "..." : ""),
		);

		// First try to parse as JSON
		const jsonContent = extractJson(response);
		if (jsonContent) {
			try {
				// Clean and repair the content before parsing
				const cleanedJson = jsonContent
					.replace(/\\n/g, "\\n") // Normalize newlines
					.replace(/"/g, '"') // Replace smart quotes
					.replace(/"/g, '"')
					.replace(/'/g, "'") // Replace smart single quotes
					.replace(/'/g, "'")
					.replace(/\n/g, " "); // Replace newlines with spaces

				/* TODO: Async logger needed */ logger.info("Attempting alternative json parsing strategies...");

				// Option 1: Manual regex-based extraction of JSON objects
				try {
					const improvementResults = [];
					const regex = /{[^{}]*"improvementHeadline"[\s\S]*?}/g;
					let match: RegExpExecArray | null;

					// Extract individual improvement objects
					match = regex.exec(cleanedJson);
					while (match !== null) {
						let improvementJson = match[0];

						// Aggressively clean the JSON before parsing
						improvementJson = improvementJson
							// Fix apostrophes and quotes
							.replace(/(\w)'(\w)/g, "$1\\'$2") // Fix apostrophes
							.replace(/'/g, '"') // Replace all single quotes with double quotes
							.replace(/:\s*"([^"]*)[^\\"]([\s,}])/g, ': "$1"$2') // Add missing close quotes
							.replace(/,\s*}/g, "}") // Remove trailing commas in objects
							.replace(/,\s*\]/g, "]"); // Remove trailing commas in arrays

						try {
							const improvement = JSON.parse(improvementJson);
							improvementResults.push(improvement);
						} catch (_err) {
							/* TODO: Async logger needed */ logger.info("Failed to parse individual improvement:", { arg1: improvementJson, arg2:  });
						}
						
						// Get next match
						match = regex.exec(cleanedJson);
					}

					if (improvementResults.length > 0) {
						/* TODO: Async logger needed */ logger.info("Successfully extracted improvements using regex");
						return improvementsFromParsed(improvementResults);
					}
				} catch (regexError) {
					/* TODO: Async logger needed */ logger.error("Regex extraction failed:", { data: regexError });
				}

				// Option 2: Direct parsing with strict fixes for all problematic characters
				try {
					// More aggressive cleaning - replace ALL special quotes and apostrophes
					const strictlyCleaned = cleanedJson
						.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035\u0060\u00B4]/g, "'") // Fix special apostrophes
						.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // Fix special quotes
						.replace(/'/g, "\\'") // Escape all apostrophes
						.replace(/\\/g, "\\\\") // Double escape existing escapes
						.replace(/\\\\\\/g, "\\") // Fix over-escaping
						.replace(/,(\s*[\]}])/g, "$1") // Remove trailing commas
						.replace(
							/([{,]\s*["]?[^":\s]+["]?)\s*:\s*([^",}\]]*)(,|}|\])/g,
							'$1: "$2"$3',
						); // Add quotes around unquoted values

					const parsed = JSON.parse(strictlyCleaned);
					/* TODO: Async logger needed */ logger.info("Successfully parsed with strict character fixes");
					return improvementsFromParsed(parsed);
				} catch (strictError) {
					/* TODO: Async logger needed */ logger.error("Strict cleaning parse failed:", { data: strictError });
				}

				// Option 3: Use direct object creation as a last resort
				try {
					// Extract data directly with regex patterns for each field
					/* TODO: Async logger needed */ logger.info("Attempting direct extraction for each field");
					const improvements = [];

					// Match patterns for each improvement block
					const _blockPattern =
						/"improvementHeadline"[^}]+?(?="improvementHeadline"|$)/g;
					const headlines =
						cleanedJson.match(/"improvementHeadline"\s*:\s*"([^"]+)"/g) || [];
					const descriptions =
						cleanedJson.match(/"improvementDescription"\s*:\s*"([^"]+)"/g) ||
						[];
					const summaries =
						cleanedJson.match(/"implementedSummaryPoint"\s*:\s*"([^"]+)"/g) ||
						[];

					// Build improvements from the extracted data
					// Get the maximum length to determine how many improvements to create
					const maxItems = Math.max(
						headlines.length,
						descriptions.length,
						summaries.length,
					);

					// Process each potential improvement
					for (let i = 0; i < maxItems; i++) {
						// Add safe extraction with null/undefined checks
						let headline = `Improvement ${i + 1}`;
						let description = "";
						let summary = "";

						// Use optional chaining for TypeScript safety
						if (i < headlines.length && headlines[i]) {
							const headlineText = headlines[i];
							const headlineMatch = headlineText?.match?.(/"([^"]+)"$/);
							if (headlineMatch?.[1]) {
								headline = headlineMatch[1];
							}
						}

						// Use optional chaining for TypeScript safety
						if (i < descriptions.length && descriptions[i]) {
							const descriptionText = descriptions[i];
							const descMatch = descriptionText?.match?.(/"([^"]+)"$/);
							if (descMatch?.[1]) {
								description = descMatch[1];
							}
						}

						// Use optional chaining for TypeScript safety
						if (i < summaries.length && summaries[i]) {
							const summaryText = summaries[i];
							const summaryMatch = summaryText?.match?.(/"([^"]+)"$/);
							if (summaryMatch?.[1]) {
								summary = summaryMatch[1];
							}
						}

						improvements.push({
							improvementHeadline: headline,
							improvementDescription: description,
							implementedSummaryPoint: summary,
							implementedSupportingPoints: [],
						});
					}

					if (improvements.length > 0) {
						/* TODO: Async logger needed */ logger.info("Successfully created objects through direct extraction", { data:  });
						return improvementsFromParsed(improvements);
					}
				} catch (directError) {
					/* TODO: Async logger needed */ logger.error("Direct extraction failed:", { data: directError });
				}
				// The function is now defined at the top level
			} catch (jsonError) {
				/* TODO: Async logger needed */ logger.error("Failed to parse JSON content:", { data: jsonError });
				/* TODO: Async logger needed */ logger.info("Attempted to parse JSON:", { data: jsonContent });
				// Fall through to text parsing
			}
		}

		// If JSON parsing fails, try text format
		const textImprovements = parseTextFormat(response);
		if (textImprovements.length > 0) {
			return textImprovements.map((imp, index) =>
				normalizeImprovement(imp, index),
			);
		}

		// If all else fails, create a fallback improvement from the raw text
		return [
			{
				id: "imp_1",
				improvementHeadline: "Generated Suggestions",
				improvementDescription:
					"The AI generated content that could not be parsed in the expected format.",
				implementedSummaryPoint: "Review the full content below:",
				implementedSupportingPoints: [
					response.slice(0, 250) + (response.length > 250 ? "..." : ""),
				],
			},
		];
	} catch (error) {
		/* TODO: Async logger needed */ logger.error("Failed to parse improvements:", { data: error });
		/* TODO: Async logger needed */ logger.error("Raw response:", { data: response });
		throw new Error("Failed to parse AI response");
	}
}
