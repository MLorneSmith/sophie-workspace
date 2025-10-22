import matter from "gray-matter";
import type { ParsedContent } from "../types";

export function parseMarkdownWithFrontmatter(content: string): {
	data: Record<string, unknown>;
	content: string;
} {
	return matter(content);
}

export async function parseMdocFile(content: string): Promise<ParsedContent> {
	// Parse frontmatter and content
	const { data: frontmatter, content: markdown } = matter(content);

	// Extract media references from content
	const mediaReferences: string[] = [];
	const downloadReferences: string[] = [];
	const collectionReferences: Array<{
		collection: string;
		identifier: string;
	}> = [];

	// Find image references
	const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
	const imageMatches = markdown.matchAll(imageRegex);
	for (const match of imageMatches) {
		const imagePath = match[2];
		if (
			imagePath.startsWith("/cms/images/") ||
			imagePath.startsWith("/images/")
		) {
			mediaReferences.push(imagePath);
		}
	}

	// Find image references in frontmatter
	if (frontmatter.image) {
		mediaReferences.push(frontmatter.image);
	}
	if (frontmatter.featuredImage) {
		mediaReferences.push(frontmatter.featuredImage);
	}

	// Find download links
	const downloadRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
	const linkMatches = markdown.matchAll(downloadRegex);
	for (const match of linkMatches) {
		const href = match[2];
		if (href.includes("/downloads/") || href.includes("/resources/")) {
			downloadReferences.push(href);
		}
	}

	// Find collection references
	if (frontmatter.author) {
		collectionReferences.push({
			collection: "users",
			identifier: frontmatter.author,
		});
	}

	if (frontmatter.relatedPosts) {
		const related = Array.isArray(frontmatter.relatedPosts)
			? frontmatter.relatedPosts
			: [frontmatter.relatedPosts];

		related.forEach((postId) => {
			collectionReferences.push({
				collection: "posts",
				identifier: postId,
			});
		});
	}

	if (frontmatter.quiz) {
		collectionReferences.push({
			collection: "course-quizzes",
			identifier: frontmatter.quiz,
		});
	}

	if (frontmatter.survey) {
		collectionReferences.push({
			collection: "surveys",
			identifier: frontmatter.survey,
		});
	}

	return {
		frontmatter,
		content: markdown,
		references: {
			media: [...new Set(mediaReferences)],
			downloads: [...new Set(downloadReferences)],
			collections: collectionReferences,
		},
	};
}

export async function convertMdocToLexical(
	content: string,
): Promise<{
	frontmatter: Record<string, unknown>;
	lexicalContent: {
		root: {
			type: string;
			children: Array<{
				type: string;
				version: number;
				[k: string]: unknown;
			}>;
			direction: ('ltr' | 'rtl') | null;
			format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
			indent: number;
			version: number;
		};
		[k: string]: unknown;
	};
	references: Record<string, unknown>;
}> {
	const parsed = await parseMdocFile(content);

	// For now, we'll create a simple Lexical structure without using the official converter
	// This is a temporary solution until we can properly configure the Lexical editor
	const lexicalContent = createSimpleLexicalContent(parsed.content);

	return {
		frontmatter: parsed.frontmatter,
		lexicalContent,
		references: parsed.references,
	};
}

function createSimpleLexicalContent(markdown: string): {
	root: {
		type: string;
		children: Array<{
			type: string;
			version: number;
			[k: string]: unknown;
		}>;
		direction: ('ltr' | 'rtl') | null;
		format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
		indent: number;
		version: number;
	};
	[k: string]: unknown;
} {
	// This is a simplified version - in production, we'd use the proper Lexical converter
	const lines = markdown.split("\n");
	const children: Array<{
		type: string;
		version: number;
		[k: string]: unknown;
	}> = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		if (!line) continue;

		// Headers
		const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (headerMatch) {
			const level = headerMatch[1].length;
			// Strip shortcodes from header text
			const cleanedHeaderText = headerMatch[2]
				.replace(/{%\s*highlight\s+variant="[^"]*"\s*%}/g, '')
				.replace(/{%\s*\/highlight\s*%}/g, '');

			children.push({
				type: "heading",
				version: 1,
				tag: `h${level}`,
				format: "",
				indent: 0,
				children: [
					{
						type: "text",
						version: 1,
						text: cleanedHeaderText,
						format: 0,
						detail: 0,
						style: "",
						mode: "normal",
					},
				],
			});
			continue;
		}

		// YouTube video shortcode: {% youtube src="videoId" /%}
		const youtubeMatch = line.match(/^{%\s*youtube\s+src="([^"]+)"\s*\/%}$/);
		if (youtubeMatch) {
			children.push({
				type: "block",
				version: 1,
				blockType: "youtube-video",
				fields: {
					videoId: youtubeMatch[1],
				},
			});
			continue;
		}

		// CTA shortcode (multi-line): {% cta ... /%}
		if (line.startsWith("{% cta")) {
			const ctaLines: string[] = [line];

			// Collect all lines until we find the closing /%}
			while (i < lines.length - 1 && !line.includes("/%}")) {
				i++;
				const nextLine = lines[i].trim();
				ctaLines.push(nextLine);
				if (nextLine.includes("/%}")) break;
			}

			// Parse CTA attributes
			const ctaText = ctaLines.join(" ");
			const ctatextMatch = ctaText.match(/ctatext="([^"]+)"/);
			const ctadescriptionMatch = ctaText.match(/ctadescription="([^"]+)"/);
			const ctabuttontextMatch = ctaText.match(/ctabuttontext="([^"]+)"/);

			children.push({
				type: "block",
				version: 1,
				blockType: "call-to-action",
				fields: {
					text: ctatextMatch?.[1] || "Call to Action",
					description: ctadescriptionMatch?.[1] || "",
					buttonText: ctabuttontextMatch?.[1] || "Learn More",
				},
			});
			continue;
		}

		// Quote shortcode (multi-line): {% quote ... /%}
		if (line.startsWith("{% quote")) {
			const quoteLines: string[] = [line];

			// Collect all lines until we find the closing /%}
			while (i < lines.length - 1 && !line.includes("/%}")) {
				i++;
				const nextLine = lines[i].trim();
				quoteLines.push(nextLine);
				if (nextLine.includes("/%}")) break;
			}

			// Parse quote attributes
			const quoteText = quoteLines.join(" ");
			const quoteMatch = quoteText.match(/quote="([^"]+)"/);
			const citationMatch = quoteText.match(/citation="([^"]+)"/);

			// Convert to a styled paragraph (quote block)
			children.push({
				type: "paragraph",
				version: 1,
				format: "",
				indent: 1,
				children: [
					{
						type: "text",
						version: 1,
						text: `"${quoteMatch?.[1] || ""}" — ${citationMatch?.[1] || ""}`,
						format: 2, // italic
						detail: 0,
						style: "",
						mode: "normal",
					},
				],
			});
			continue;
		}

		// Bunny video
		const bunnyMatch = line.match(
			/^{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}$/,
		);
		if (bunnyMatch) {
			children.push({
				type: "block",
				version: 1,
				blockType: "bunny-video",
				fields: {
					videoId: bunnyMatch[1],
				},
			});
			continue;
		}

		// Default to paragraph
		// Strip any remaining shortcodes from the text (inline highlights, etc.)
		const cleanedLine = line
			.replace(/{%\s*highlight\s+variant="[^"]*"\s*%}/g, '')  // Remove opening {% highlight %}
			.replace(/{%\s*\/highlight\s*%}/g, '')  // Remove closing {% /highlight %}
			.trim();

		// Skip if line is empty after cleaning
		if (!cleanedLine) continue;

		children.push({
			type: "paragraph",
			version: 1,
			format: "",
			indent: 0,
			children: [
				{
					type: "text",
					version: 1,
					text: cleanedLine,
					format: 0,
					detail: 0,
					style: "",
					mode: "normal",
				},
			],
		});
	}

	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			children,
			direction: null,
		},
	};
}
