// @ts-expect-error - jsdom types not available
import type { Element } from "jsdom";
// @ts-expect-error - jsdom types not available
import { JSDOM } from "jsdom";
import type { ParsedContent } from "../types";

export function parseHtmlFile(
	content: string,
	filename: string,
): ParsedContent {
	const dom = new JSDOM(content);
	const document = dom.window.document;

	// Extract title from h1 in the article/main content area (not from <title> tag)
	// Look for h1 within article or main content areas first
	let title =
		document.querySelector("article h1")?.textContent ||
		document.querySelector("main h1")?.textContent ||
		document.querySelector(".container h1")?.textContent ||
		document.querySelector("h1")?.textContent ||
		document.querySelector("title")?.textContent ||
		filename;

	// Clean up title
	title = title.trim();

	// Extract description from first paragraph in article/main content
	// Skip the navigation/header areas
	let description = "";
	const articleElement =
		document.querySelector("article") ||
		document.querySelector("main") ||
		document.querySelector(".container");

	if (articleElement) {
		const firstParagraph = articleElement.querySelector("p");
		if (firstParagraph?.textContent) {
			// Get first 200 characters of first paragraph
			description = firstParagraph.textContent.trim().substring(0, 200);
			if (firstParagraph.textContent.length > 200) {
				description += "...";
			}
		}
	}

	// Fallback to meta description if we couldn't find a good one
	if (!description) {
		description =
			document
				.querySelector('meta[name="description"]')
				?.getAttribute("content") || "";
	}

	// Extract media references
	const mediaReferences: string[] = [];

	// Find all images
	const images = document.querySelectorAll("img");
	images.forEach((img: Element) => {
		const src = img.getAttribute("src");
		if (src && (src.includes("/cms/images/") || src.includes("/images/"))) {
			mediaReferences.push(src);
		}
	});

	// Find background images in style attributes
	const elementsWithStyle = document.querySelectorAll(
		'[style*="background-image"]',
	);
	elementsWithStyle.forEach((element: Element) => {
		const style = element.getAttribute("style") || "";
		const matches = style.match(/url\(['"]?([^'"]+)['"]?\)/g);
		if (matches) {
			matches.forEach((match: string) => {
				const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
				if (url && (url.includes("/cms/images/") || url.includes("/images/"))) {
					mediaReferences.push(url);
				}
			});
		}
	});

	// Extract download references
	const downloadReferences: string[] = [];
	const links = document.querySelectorAll("a[href]");
	links.forEach((link: Element) => {
		const href = link.getAttribute("href");
		if (
			href &&
			(href.includes("/downloads/") || href.includes("/resources/"))
		) {
			downloadReferences.push(href);
		}
	});

	// Extract the main content (usually from a container)
	let mainContent = "";
	const contentContainer =
		document.querySelector("article") ||
		document.querySelector(".container") ||
		document.querySelector("main") ||
		document.querySelector("body");

	if (contentContainer) {
		mainContent = contentContainer.innerHTML || "";
	}

	return {
		frontmatter: {
			title,
			description,
			type: "bpm-content",
			filename: filename.replace(".html", ""),
			status: "published",
		},
		content: mainContent,
		references: {
			media: [...new Set(mediaReferences)],
			downloads: [...new Set(downloadReferences)],
			collections: [],
		},
	};
}

export async function convertHtmlToLexical(
	htmlContent: string,
	_payloadConfig: unknown,
): Promise<unknown> {
	// Parse the HTML into a DOM structure
	const dom = new JSDOM(htmlContent);
	const document = dom.window.document;

	// Extract text content and convert to simple Lexical paragraph nodes
	// This is a simplified version - a full implementation would preserve
	// headings, lists, links, etc.

	const children: any[] = [];

	// Function to extract text from HTML elements
	function extractTextContent(element: Element): string {
		// Remove script and style elements
		const scripts = element.querySelectorAll("script, style");
		scripts.forEach((script: Element) => script.remove());

		return element.textContent || "";
	}

	// Try to find the article content
	const article =
		document.querySelector("article") ||
		document.querySelector(".container") ||
		document.querySelector("main") ||
		document.querySelector("body");

	if (article) {
		const text = extractTextContent(article);

		// Split into paragraphs (by double newlines or by existing HTML paragraphs)
		const paragraphs = text
			.split(/\n\n+/)
			.map((p) => p.trim())
			.filter((p) => p.length > 0 && p.length < 10000); // Filter out empty and extremely long paragraphs

		// Limit to first 50 paragraphs to avoid massive documents
		const limitedParagraphs = paragraphs.slice(0, 50);

		limitedParagraphs.forEach((paragraph) => {
			// Only add paragraphs with meaningful content
			if (paragraph.length > 10) {
				children.push({
					type: "paragraph",
					children: [
						{
							type: "text",
							text: paragraph,
							format: 0,
							mode: "normal",
							style: "",
							detail: 0,
							version: 1,
						},
					],
					format: "",
					indent: 0,
					version: 1,
					direction: "ltr",
				});
			}
		});
	}

	// If no children were created, add a placeholder
	if (children.length === 0) {
		children.push({
			type: "paragraph",
			children: [
				{
					type: "text",
					text: "[Content from HTML - requires manual review]",
					format: 0,
					mode: "normal",
					style: "",
					detail: 0,
					version: 1,
				},
			],
			format: "",
			indent: 0,
			version: 1,
			direction: "ltr",
		});
	}

	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			children: children,
			direction: "ltr",
		},
	};
}
