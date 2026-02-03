import { convert, type HtmlToTextOptions } from "html-to-text";

const DEFAULT_OPTIONS: HtmlToTextOptions = {
	wordwrap: false,
	preserveNewlines: true,
	selectors: [
		{ selector: "a", options: { hideLinkHrefIfSameAsText: true } },
		{ selector: "img", format: "skip" },
		{ selector: "table", format: "dataTable" },
		{ selector: "br", format: "inlineString", options: { string: "\n" } },
		{ selector: "hr", format: "inlineString", options: { string: "\n---\n" } },
		{ selector: "blockquote", format: "blockquote" },
	],
};

/**
 * Convert HTML email content to clean plain text
 */
export function htmlToPlainText(html: string): string {
	if (!html || html.trim().length === 0) {
		return "";
	}

	// Pre-process common email HTML patterns
	const processed = preprocessEmailHtml(html);

	// Convert HTML to text
	let text = convert(processed, DEFAULT_OPTIONS);

	// Post-process the text
	text = postprocessText(text);

	return text;
}

/**
 * Pre-process HTML to handle common email patterns
 */
function preprocessEmailHtml(html: string): string {
	let processed = html;

	// Remove tracking pixels and tiny images
	processed = processed.replace(
		/<img[^>]*(?:width|height)\s*=\s*["']?[01](?:px)?["']?[^>]*>/gi,
		"",
	);

	// Remove style and script tags entirely
	processed = processed.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
	processed = processed.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

	// Convert common signature markers
	processed = processed.replace(
		/<div[^>]*class="[^"]*gmail_signature[^"]*"[^>]*>/gi,
		'<div class="signature">\n---\n',
	);

	// Handle quoted reply sections
	processed = processed.replace(
		/<div[^>]*class="[^"]*gmail_quote[^"]*"[^>]*>/gi,
		"<blockquote>",
	);

	// Normalize line break tags
	processed = processed.replace(/<br\s*\/?>/gi, "<br>");

	// Convert divs with explicit line breaks to preserve paragraph structure
	processed = processed.replace(/<\/div>\s*<div/gi, "</div>\n<div");

	return processed;
}

/**
 * Post-process converted text to clean up formatting
 */
function postprocessText(text: string): string {
	let processed = text;

	// Normalize whitespace
	processed = processed.replace(/\r\n/g, "\n");
	processed = processed.replace(/\r/g, "\n");

	// Remove excessive blank lines (more than 2 consecutive)
	processed = processed.replace(/\n{3,}/g, "\n\n");

	// Remove leading/trailing whitespace from lines
	processed = processed
		.split("\n")
		.map((line) => line.trim())
		.join("\n");

	// Remove leading/trailing whitespace from entire text
	processed = processed.trim();

	// Handle common signature patterns
	processed = normalizeSignature(processed);

	// Clean up quoted text markers
	processed = cleanQuotedText(processed);

	return processed;
}

/**
 * Normalize email signature formatting
 */
function normalizeSignature(text: string): string {
	// Add separator before common signature patterns
	const signaturePatterns = [
		/^(Best regards?,?)/im,
		/^(Kind regards?,?)/im,
		/^(Thanks?,?)/im,
		/^(Thank you,?)/im,
		/^(Sincerely,?)/im,
		/^(Cheers,?)/im,
		/^(Regards,?)/im,
		/^(--\s*$)/m,
	];

	let processed = text;

	for (const pattern of signaturePatterns) {
		const match = processed.match(pattern);
		if (match?.index && match.index > 50) {
			// Ensure there's proper spacing before signature
			const before = processed.substring(0, match.index);
			const after = processed.substring(match.index);
			if (!before.endsWith("\n\n")) {
				processed = `${before.trimEnd()}\n\n${after.trimStart()}`;
			}
			break;
		}
	}

	return processed;
}

/**
 * Clean up quoted text from email replies
 */
function cleanQuotedText(text: string): string {
	let processed = text;

	// Clean up "On <date>, <person> wrote:" patterns
	processed = processed.replace(
		/On .+? wrote:\s*>/gm,
		"On [previous message]:\n>",
	);

	// Normalize quote markers
	processed = processed.replace(/^>\s*>/gm, ">>");

	return processed;
}

/**
 * Extract plain text, preferring existing plain text over HTML conversion
 */
export function extractCleanText(plain: string, html: string): string {
	// If we have good plain text, use it (with light cleanup)
	if (plain && plain.trim().length > 0) {
		return postprocessText(plain);
	}

	// Otherwise, convert HTML
	if (html && html.trim().length > 0) {
		return htmlToPlainText(html);
	}

	return "";
}

/**
 * Extract links from HTML for reference
 */
export function extractLinks(
	html: string,
): Array<{ text: string; url: string }> {
	const links: Array<{ text: string; url: string }> = [];
	const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;

	for (const match of html.matchAll(linkRegex)) {
		const url = match[1];
		const text = match[2].trim();

		// Skip tracking links and empty links
		if (
			url &&
			!url.startsWith("mailto:") &&
			!url.includes("tracking") &&
			!url.includes("click.") &&
			text.length > 0
		) {
			links.push({ text, url });
		}
	}

	return links;
}
