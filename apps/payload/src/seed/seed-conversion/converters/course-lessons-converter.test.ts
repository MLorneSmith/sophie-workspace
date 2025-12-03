/**
 * Unit Tests for Course Lessons Converter
 * Tests markdown link parsing and Lexical node generation
 */

import { describe, expect, it } from "vitest";

/**
 * Test helper: Parses markdown links from text
 * Mirrors the parseMarkdownLinks function in the converter
 */
function parseMarkdownLinks(
	lineText: string,
): Array<{
	type: string;
	text?: string;
	url?: string;
	children?: Array<{ type: string; text: string }>;
}> {
	const nodes: Array<{
		type: string;
		text?: string;
		url?: string;
		children?: Array<{ type: string; text: string }>;
	}> = [];
	const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

	let lastIndex = 0;
	let match: RegExpExecArray | null;

	// biome-ignore lint/suspicious/noAssignInExpressions: Intentional assignment in loop condition for regex matching
	while ((match = linkPattern.exec(lineText)) !== null) {
		if (match.index > lastIndex) {
			const textBefore = lineText.substring(lastIndex, match.index);
			if (textBefore) {
				nodes.push({ type: "text", text: textBefore });
			}
		}

		const linkText = match[1];
		const linkUrl = match[2];
		nodes.push({
			type: "link",
			url: linkUrl,
			children: [{ type: "text", text: linkText }],
		});

		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < lineText.length) {
		const textAfter = lineText.substring(lastIndex);
		if (textAfter) {
			nodes.push({ type: "text", text: textAfter });
		}
	}

	if (nodes.length === 0) {
		nodes.push({ type: "text", text: lineText });
	}

	return nodes;
}

describe("Course Lessons Converter", () => {
	describe("parseMarkdownLinks", () => {
		it("should parse a simple markdown link", () => {
			const input =
				"[HBR Guide](https://www.amazon.com/product/123)";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: "link",
				url: "https://www.amazon.com/product/123",
				children: [{ type: "text", text: "HBR Guide" }],
			});
		});

		it("should handle text before the link", () => {
			const input =
				"Read this book: [HBR Guide](https://www.amazon.com/product/123)";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				type: "text",
				text: "Read this book: ",
			});
			expect(result[1]).toEqual({
				type: "link",
				url: "https://www.amazon.com/product/123",
				children: [{ type: "text", text: "HBR Guide" }],
			});
		});

		it("should handle text after the link", () => {
			const input =
				"[HBR Guide](https://www.amazon.com/product/123) by Nancy Duarte";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				type: "link",
				url: "https://www.amazon.com/product/123",
				children: [{ type: "text", text: "HBR Guide" }],
			});
			expect(result[1]).toEqual({
				type: "text",
				text: " by Nancy Duarte",
			});
		});

		it("should handle multiple links on the same line", () => {
			const input =
				"Check [Book 1](https://example.com/1) and [Book 2](https://example.com/2)";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(4);
			expect(result[0]).toEqual({ type: "text", text: "Check " });
			expect(result[1]).toEqual({
				type: "link",
				url: "https://example.com/1",
				children: [{ type: "text", text: "Book 1" }],
			});
			expect(result[2]).toEqual({ type: "text", text: " and " });
			expect(result[3]).toEqual({
				type: "link",
				url: "https://example.com/2",
				children: [{ type: "text", text: "Book 2" }],
			});
		});

		it("should handle plain text without links", () => {
			const input = "This is just regular text without any links";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: "text",
				text: "This is just regular text without any links",
			});
		});

		it("should handle URLs with special characters", () => {
			const input =
				"[Book](https://www.amazon.com/gp/product/123?tag=foo&ref=bar#section)";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: "link",
				url: "https://www.amazon.com/gp/product/123?tag=foo&ref=bar#section",
				children: [{ type: "text", text: "Book" }],
			});
		});

		it("should handle links with spaces in text", () => {
			const input =
				"[HBR Guide to Persuasive Presentations by Nancy Duarte](https://www.amazon.com/product)";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: "link",
				url: "https://www.amazon.com/product",
				children: [
					{
						type: "text",
						text: "HBR Guide to Persuasive Presentations by Nancy Duarte",
					},
				],
			});
		});

		it("should handle YouTube links", () => {
			const input =
				"[Watch this video](https://www.youtube.com/watch?v=RgPIkx2JyQU)";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: "link",
				url: "https://www.youtube.com/watch?v=RgPIkx2JyQU",
				children: [{ type: "text", text: "Watch this video" }],
			});
		});

		it("should handle empty string", () => {
			const input = "";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({ type: "text", text: "" });
		});

		it("should not match incomplete link syntax", () => {
			const input = "[broken link(https://example.com)";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: "text",
				text: "[broken link(https://example.com)",
			});
		});

		it("should handle text with brackets that are not links", () => {
			const input = "Use [bracket notation] for arrays";
			const result = parseMarkdownLinks(input);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				type: "text",
				text: "Use [bracket notation] for arrays",
			});
		});
	});
});
