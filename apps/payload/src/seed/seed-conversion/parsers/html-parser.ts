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

	// Extract metadata from the HTML
	const title = document.querySelector("title")?.textContent || filename;
	const description =
		document
			.querySelector('meta[name="description"]')
			?.getAttribute("content") || "";

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
	// For HTML content, we might want to convert it to markdown first
	// then use the markdown to Lexical converter
	// Or we could parse the HTML directly into Lexical nodes

	// For now, we'll store HTML content as a single HTML block
	// This preserves the original formatting and interactivity

	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			children: [
				{
					type: "block",
					version: 1,
					blockType: "htmlContent",
					fields: {
						html: htmlContent,
					},
				},
			],
			direction: null,
		},
	};
}
