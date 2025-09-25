import matter from "gray-matter";
import {
	convertMarkdownToLexical,
	defaultEditorConfig,
	defaultEditorFeatures,
} from "@payloadcms/richtext-lexical";
import type { Config } from "payload";
import { type ParsedContent, MediaReference } from "../types";

export async function parseMdocFile(
	content: string,
	payloadConfig: Config,
): Promise<ParsedContent> {
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

	// Find Bunny video references
	const bunnyRegex = /{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/g;
	const bunnyMatches = markdown.matchAll(bunnyRegex);
	for (const match of bunnyMatches) {
		// Bunny videos are not stored as media references, they're external
		// But we might want to track them for validation
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

	// Find collection references (e.g., author references, related posts)
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
			media: [...new Set(mediaReferences)], // Remove duplicates
			downloads: [...new Set(downloadReferences)],
			collections: collectionReferences,
		},
	};
}

export async function convertMdocToLexical(
	content: string,
	payloadConfig: Config,
): Promise<{
	frontmatter: Record<string, any>;
	lexicalContent: any;
	references: any;
}> {
	const parsed = await parseMdocFile(content, payloadConfig);

	// Use the default editor config
	const editorConfig = defaultEditorConfig;

	// Convert markdown to Lexical, handling special components
	let processedMarkdown = parsed.content;

	// Replace Bunny video components with a placeholder that Lexical can understand
	// We'll need to post-process these to create proper block nodes
	processedMarkdown = processedMarkdown.replace(
		/{%\s*bunny\s+bunnyvideoid="([^"]+)"\s*\/%}/g,
		"<!-- BUNNY_VIDEO:$1 -->",
	);

	// Replace highlight components similarly
	processedMarkdown = processedMarkdown.replace(
		/{%\s*highlight\s+([^%]+)\s*%}([\s\S]*?){%\s*\/highlight\s*%}/g,
		(match, attrs, content) => {
			return `<!-- HIGHLIGHT_START:${attrs} -->\n${content}\n<!-- HIGHLIGHT_END -->`;
		},
	);

	// Convert to Lexical
	const lexicalContent = await convertMarkdownToLexical({
		editorConfig,
		markdown: processedMarkdown,
	});

	// Post-process to handle custom components
	if (lexicalContent?.root?.children) {
		lexicalContent.root.children = postProcessLexicalNodes(
			lexicalContent.root.children,
		);
	}

	return {
		frontmatter: parsed.frontmatter,
		lexicalContent,
		references: parsed.references,
	};
}

function postProcessLexicalNodes(nodes: any[]): any[] {
	const processedNodes: any[] = [];

	for (const node of nodes) {
		// Check for Bunny video placeholders
		if (node.type === "paragraph" && node.children?.length === 1) {
			const textNode = node.children[0];
			if (
				textNode.type === "text" &&
				textNode.text?.includes("<!-- BUNNY_VIDEO:")
			) {
				const match = textNode.text.match(/<!-- BUNNY_VIDEO:([^-]+) -->/);
				if (match) {
					processedNodes.push({
						type: "block",
						version: 1,
						blockType: "bunnyVideo",
						fields: {
							videoId: match[1],
							provider: "bunny",
						},
					});
					continue;
				}
			}
		}

		// Check for highlight placeholders
		if (node.type === "paragraph" && node.children?.length === 1) {
			const textNode = node.children[0];
			if (
				textNode.type === "text" &&
				textNode.text?.includes("<!-- HIGHLIGHT_START:")
			) {
				// TODO: Parse highlight attributes and content
				// For now, keep as is
			}
		}

		// Recursively process children
		if (node.children && Array.isArray(node.children)) {
			node.children = postProcessLexicalNodes(node.children);
		}

		processedNodes.push(node);
	}

	return processedNodes;
}
