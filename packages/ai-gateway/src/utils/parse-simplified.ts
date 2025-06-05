/**
 * Utility for parsing AI responses into simplified text sections
 */

export interface SimplifiedSection {
	type: "heading" | "bullet";
	content: string;
}

export interface SimplifiedContent {
	sections: SimplifiedSection[];
}

/**
 * Extracts JSON from a string that might contain additional text
 */
function extractJson(text: string): string | null {
	const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
	return match ? match[0] : null;
}

/**
 * Parses an AI response into standardized simplified content
 */
export function parseSimplified(response: string): SimplifiedContent {
	try {
		// First try to parse as JSON
		const jsonContent = extractJson(response);
		if (jsonContent) {
			try {
				const parsed = JSON.parse(jsonContent);
				if (parsed?.sections?.length > 0) {
					// Validate each section has required fields
					const validSections = parsed.sections.every(
						(section: any) =>
							section.type &&
							(section.type === "heading" || section.type === "bullet") &&
							typeof section.content === "string",
					);

					if (validSections) {
						return parsed as SimplifiedContent;
					}
				}
			} catch (jsonError) {
				console.error("Failed to parse JSON content:", jsonError);
			}
		}

		// If JSON parsing fails or validation fails, return a basic structure
		return {
			sections: [
				{
					type: "heading",
					content: "Simplified Content",
				},
				{
					type: "bullet",
					content: response.trim(),
				},
			],
		};
	} catch (error) {
		console.error("Failed to parse simplified content:", error);
		console.error("Raw response:", response);
		throw new Error("Failed to parse AI response");
	}
}
