import { promises as fs } from "node:fs";
import path from "node:path";
import { convertMdocToLexical } from "../parsers/mdoc-parser-simple";
import type { ReferenceManager } from "../utils/reference-manager";
import type { ConversionResult } from "../types";
import type { Config } from "payload";

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
			direction: ('ltr' | 'rtl') | null;
			format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | '';
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
	categories?: string[];
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
					slug: frontmatter.slug || file.replace(".mdoc", ""),
					title: frontmatter.title || "Untitled Post",
					content: lexicalContent,
					excerpt: frontmatter.excerpt || frontmatter.description || "",
					meta: {
						title: frontmatter.metaTitle || frontmatter.title,
						description:
							frontmatter.metaDescription || frontmatter.description || "",
						image: frontmatter.metaImage
							? referenceManager.formatReference(
									"media",
									undefined,
									frontmatter.metaImage,
								)
							: null,
					},
					publishedAt:
						frontmatter.publishedAt ||
						frontmatter.date ||
						new Date().toISOString(),
					_status: frontmatter.status === "published" ? "published" : "draft",
				};

				// Handle featured image
				if (frontmatter.featuredImage || frontmatter.image) {
					const imagePath = frontmatter.featuredImage || frontmatter.image;
					post.featuredImage = referenceManager.formatReference(
						"media",
						undefined,
						imagePath,
					);
				}

				// Handle author reference
				if (frontmatter.author) {
					post.author = referenceManager.formatReference(
						"collection",
						"users",
						frontmatter.author,
					);
				}

				// Handle categories (tags)
				if (frontmatter.categories || frontmatter.tags) {
					const tags = frontmatter.categories || frontmatter.tags;
					post.categories = Array.isArray(tags) ? tags : [tags];
				}

				// Handle related posts
				if (frontmatter.relatedPosts) {
					const related = Array.isArray(frontmatter.relatedPosts)
						? frontmatter.relatedPosts
						: [frontmatter.relatedPosts];

					post.relatedPosts = related.map((postId) =>
						referenceManager.formatReference("collection", "posts", postId),
					);
				}

				// Add reference mapping for this post
				referenceManager.addMapping({
					type: "collection",
					collection: "posts",
					originalId: frontmatter.id || post.slug,
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
