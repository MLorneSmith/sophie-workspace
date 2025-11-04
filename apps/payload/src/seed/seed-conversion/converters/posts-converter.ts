import { promises as fs } from "node:fs";
import path from "node:path";
import type { Config } from "payload";
import { convertMdocToLexical } from "../parsers/mdoc-parser-simple";
import type { ConversionResult } from "../types";
import type { ReferenceManager } from "../utils/reference-manager";

/**
 * Normalize timestamp to ISO 8601 format
 * Handles various input formats including invalid timezone formats like "GMT-0400 (Eastern Daylight Time)"
 */
function normalizeTimestamp(timestamp: unknown): string {
	if (!timestamp) {
		return new Date().toISOString();
	}

	const timestampStr = String(timestamp);

	// Try to parse the timestamp - Date constructor handles many formats
	const date = new Date(timestampStr);

	// Check if date is valid
	if (Number.isNaN(date.getTime())) {
		console.warn(
			`Invalid timestamp format: ${timestampStr}, using current time`,
		);
		return new Date().toISOString();
	}

	return date.toISOString();
}

interface PostData {
	slug: string;
	title: string;
	content: {
		root: {
			type: string;
			children: Array<{
				type: string;
				version: number;
				[k: string]: unknown;
			}>;
			direction: ("ltr" | "rtl") | null;
			format: "left" | "start" | "center" | "right" | "end" | "justify" | "";
			indent: number;
			version: number;
		};
		[k: string]: unknown;
	};
	excerpt: string;
	meta: {
		title: string;
		description: string;
		image: string | null;
	};
	publishedAt: string;
	_status: "published" | "draft";
	featuredImage?: string;
	author?: string;
	categories?: Array<{ category: string }>;
	relatedPosts?: string[];
}

export async function convertPosts(
	sourceDir: string,
	_payloadConfig: Config,
	referenceManager: ReferenceManager,
): Promise<ConversionResult> {
	const postsDir = path.join(sourceDir, "posts");
	const posts: PostData[] = [];
	const errors: string[] = [];
	const warnings: string[] = [];

	try {
		const files = await fs.readdir(postsDir);
		const mdocFiles = files.filter((f) => f.endsWith(".mdoc"));

		for (const file of mdocFiles) {
			try {
				const filePath = path.join(postsDir, file);
				const content = await fs.readFile(filePath, "utf-8");

				// Convert mdoc to Lexical
				const { frontmatter, lexicalContent } =
					await convertMdocToLexical(content);

				// Create post object
				const post: PostData = {
					slug: String(frontmatter.slug || file.replace(".mdoc", "")),
					title: String(frontmatter.title || "Untitled Post"),
					content: lexicalContent,
					excerpt: String(frontmatter.excerpt || frontmatter.description || ""),
					meta: {
						title: String(
							frontmatter.metaTitle || frontmatter.title || "Untitled Post",
						),
						description: String(
							frontmatter.metaDescription || frontmatter.description || "",
						),
						image: frontmatter.metaImage
							? referenceManager.formatReference(
									"media",
									undefined,
									String(frontmatter.metaImage),
								)
							: null,
					},
					publishedAt: normalizeTimestamp(
						frontmatter.publishedAt || frontmatter.date,
					),
					_status: frontmatter.status === "published" ? "published" : "draft",
				};

				// Handle featured image - use blog-brainstorming placeholder for all posts
				if (frontmatter.featuredImage || frontmatter.image) {
					post.featuredImage = referenceManager.formatReference(
						"media",
						undefined,
						"blog-brainstorming",
					);
				}

				// Handle author reference
				if (frontmatter.author) {
					post.author = referenceManager.formatReference(
						"collection",
						"users",
						String(frontmatter.author),
					);
				}

				// Handle categories (tags) - convert to array of objects with category property
				if (frontmatter.categories || frontmatter.tags) {
					const tags = frontmatter.categories || frontmatter.tags;
					const tagArray = Array.isArray(tags)
						? tags.map(String)
						: [String(tags)];
					post.categories = tagArray.map((category) => ({ category }));
				}

				// Handle related posts
				if (frontmatter.relatedPosts) {
					const related = Array.isArray(frontmatter.relatedPosts)
						? frontmatter.relatedPosts
						: [frontmatter.relatedPosts];

					post.relatedPosts = related.map((postId) =>
						referenceManager.formatReference(
							"collection",
							"posts",
							String(postId),
						),
					);
				}

				// Add reference mapping for this post
				referenceManager.addMapping({
					type: "collection",
					collection: "posts",
					originalId: String(frontmatter.id || post.slug),
					identifier: post.slug,
				});

				posts.push(post);
			} catch (error) {
				errors.push(`Failed to convert ${file}: ${error}`);
			}
		}

		return {
			success: errors.length === 0,
			collectionName: "posts",
			data: posts,
			errors: errors.length > 0 ? errors : undefined,
			warnings: warnings.length > 0 ? warnings : undefined,
		};
	} catch (error) {
		return {
			success: false,
			collectionName: "posts",
			errors: [`Failed to read posts directory: ${error}`],
		};
	}
}
