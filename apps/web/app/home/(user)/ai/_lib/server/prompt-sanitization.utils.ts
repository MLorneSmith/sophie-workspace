import "server-only";

/**
 * Common prompt injection patterns to strip from untrusted content.
 * These patterns attempt to override or ignore LLM system instructions.
 */
const PROMPT_INJECTION_PATTERNS = [
	/ignore\s+(all\s+)?previous\s+instructions/gi,
	/ignore\s+(all\s+)?(your\s+)?(instructions?|rules?|prompts?)/gi,
	/(forget|disregard)\s+(everything|all|your)/gi,
	/(you\s+are|act\s+as|pretend\s+to\s+be)\s+(a\s+)?(different|new|alternative)/gi,
	/^system:/gim,
	/^assistant:/gim,
	/^user:/gim,
	/^admin:/gim,
	/^\[SYSTEM\]/gim,
	/^\[INST\]/gim,
	/<\/?(system|assistant|user|admin)>/gi,
	/#!/gim,
	/```system\s*[\s\S]*?```/gi,
	/```instructions\s*[\s\S]*?```/gi,
	/^\s*---\s*$/gm,
];

/**
 * Markdown code block pattern that could contain injected instructions.
 */
const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;

/**
 * Sanitizes scraped text to mitigate prompt injection risks.
 * Removes common injection patterns and normalizes whitespace.
 *
 * @param value - The untrusted scraped text to sanitize
 * @returns Cleaned text safe for prompt interpolation
 */
export function sanitizeScrapedText(value: string): string {
	if (!value) {
		return "";
	}

	let sanitized = value;

	// Remove markdown code blocks that could contain injected instructions
	sanitized = sanitized.replace(CODE_BLOCK_PATTERN, "");

	// Strip common prompt injection patterns
	for (const pattern of PROMPT_INJECTION_PATTERNS) {
		sanitized = sanitized.replace(pattern, "");
	}

	// Normalize excessive whitespace and newlines
	sanitized = sanitized
		// Replace multiple newlines with double newline (paragraph break)
		.replace(/\n{3,}/g, "\n\n")
		// Replace multiple spaces with single space
		.replace(/[ \t]{2,}/g, " ")
		// Trim leading/trailing whitespace from each line
		.split("\n")
		.map((line) => line.trim())
		.join("\n")
		// Trim overall result
		.trim();

	return sanitized;
}

/**
 * Safely truncates text to a maximum length with ellipsis handling.
 *
 * @param value - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @param addEllipsis - Whether to add "..." when truncated (default: true)
 * @returns Truncated text
 */
export function safeTruncate(
	value: string,
	maxLength: number,
	addEllipsis: boolean = true,
): string {
	if (!value || value.length <= maxLength) {
		return value;
	}

	const truncated = value.substring(0, maxLength);

	if (addEllipsis && maxLength > 3) {
		return `${truncated.substring(0, maxLength - 3)}...`;
	}

	return truncated;
}
