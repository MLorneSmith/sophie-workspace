import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convertHtmlToLexical, parseHtmlFile } from "../parsers/html-parser";
import type { ConversionResult } from "../types";
import type { ReferenceManager } from "../utils/reference-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PrivatePostData {
	_ref: string;
	slug: string;
	title: string;
	description: string;
	content: unknown; // Lexical JSON
	status: "published" | "draft";
	publishedAt: string;
	categories?: Array<{ category: string }>;
	tags?: Array<{ tag: string }>;
}

/**
 * Convert BPM HTML files to Private collection JSON format
 */
export async function convertPrivate(
	referenceManager: ReferenceManager,
): Promise<void> {
	console.log("  🔒 Converting private posts (BPM)...");

	const sourceDir = path.join(__dirname, "../../seed-data-raw/bpm");
	const outputDir = path.join(__dirname, "../../seed-data");

	const privatePosts: PrivatePostData[] = [];
	const errors: string[] = [];

	try {
		// Read all HTML files from bpm directory
		const files = await fs.readdir(sourceDir);
		const htmlFiles = files.filter((f) => f.endsWith(".html"));

		console.log(`    Found ${htmlFiles.length} HTML files`);

		for (const file of htmlFiles) {
			try {
				const filePath = path.join(sourceDir, file);
				const content = await fs.readFile(filePath, "utf-8");

				// Parse HTML to extract metadata
				const parsed = parseHtmlFile(content, file);

				// Convert HTML content to Lexical format
				const lexicalContent = await convertHtmlToLexical(parsed.content, null);

				// Generate slug from filename
				const slug = file.replace(".html", "");
				const ref = `private-${slug}`;

				// Create private post object
				const post: PrivatePostData = {
					_ref: ref,
					slug: slug,
					title: String(parsed.frontmatter.title || "Untitled Private Post"),
					description: String(parsed.frontmatter.description || ""),
					content: lexicalContent,
					status: "published",
					publishedAt: new Date().toISOString(),
				};

				// Add reference mapping for this post
				referenceManager.addMapping({
					type: "collection",
					collection: "private",
					originalId: ref,
					identifier: slug,
				});

				privatePosts.push(post);
				console.log(`    ✅ Converted: ${file}`);
			} catch (error) {
				const errorMsg = `Failed to convert ${file}: ${error}`;
				errors.push(errorMsg);
				console.error(`    ❌ ${errorMsg}`);
			}
		}

		// Write output file
		if (privatePosts.length > 0) {
			const outputPath = path.join(outputDir, "private.json");
			await fs.writeFile(
				outputPath,
				JSON.stringify(privatePosts, null, 2),
				"utf-8",
			);
			console.log(
				`    ✅ Wrote ${privatePosts.length} private posts to private.json`,
			);
		} else {
			console.log("    ⚠️  No private posts to write");
		}

		if (errors.length > 0) {
			console.log(`    ⚠️  ${errors.length} errors occurred during conversion`);
		}
	} catch (error) {
		console.error(`    ❌ Failed to process private posts: ${error}`);
		throw error;
	}
}
