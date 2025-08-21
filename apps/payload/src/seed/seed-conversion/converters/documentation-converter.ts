import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseMarkdownWithFrontmatter } from "../parsers/mdoc-parser-simple";
import type { ReferenceManager } from "../utils/reference-manager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DocumentationMeta {
	title: string;
	description: string;
	category?: string;
	parent?: string;
	order?: number;
	featured?: boolean;
	tags?: string[];
	sourceFile: string;
	sourcePath: string;
}

interface DocumentationJson {
	id: string;
	title: string;
	description: string;
	content: any; // Lexical JSON
	category?: string;
	parent?: string; // Reference to parent documentation
	children?: string[]; // References to child documentation
	order: number;
	featured: boolean;
	tags: string[];
	breadcrumbs: Array<{
		title: string;
		slug: string;
	}>;
	slug: string;
	published: boolean;
	createdAt: string;
	updatedAt: string;
}

export async function convertDocumentation(
	referenceManager: ReferenceManager,
): Promise<void> {
	console.log("  📚 Converting documentation...");

	const sourceDir = path.join(
		__dirname,
		"../../../seed/seed-data-raw/documentation",
	);
	const outputDir = path.join(__dirname, "../../../seed/seed-data");

	// Recursively read all documentation files
	const documentationFiles = await readDocumentationFiles(sourceDir);

	const documentation: DocumentationJson[] = [];
	const warnings: string[] = [];

	// First pass: create all documentation entries
	for (const fileInfo of documentationFiles) {
		try {
			const content = await fs.readFile(fileInfo.fullPath, "utf-8");
			const { data: frontmatter, content: markdownContent } =
				parseMarkdownWithFrontmatter(content);

			// Extract documentation metadata
			const docMeta: DocumentationMeta = {
				title: frontmatter.title || fileInfo.name.replace(".mdoc", ""),
				description: frontmatter.description || "",
				category:
					frontmatter.category || inferCategoryFromPath(fileInfo.relativePath),
				parent: frontmatter.parent,
				order: frontmatter.order
					? parseInt(frontmatter.order)
					: getOrderFromPath(fileInfo.relativePath),
				featured: frontmatter.featured ?? false,
				tags: frontmatter.tags || [],
				sourceFile: fileInfo.name,
				sourcePath: fileInfo.relativePath,
			};

			// Generate documentation ID from path
			const docId = generateDocIdFromPath(fileInfo.relativePath);

			// Convert content to Lexical format
			const lexicalContent = convertToSimpleLexical(markdownContent);

			// Generate slug from path
			const slug = generateSlugFromPath(fileInfo.relativePath);

			// Build documentation object
			const doc: DocumentationJson = {
				id: docId,
				title: docMeta.title,
				description: docMeta.description,
				content: lexicalContent,
				slug: slug,
				order: docMeta.order || 0,
				featured: docMeta.featured ?? false,
				tags: Array.isArray(docMeta.tags) ? docMeta.tags : [],
				breadcrumbs: [], // Will be populated in second pass
				published: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Add optional fields
			if (docMeta.category) {
				doc.category = docMeta.category;
			}

			documentation.push(doc);

			// Add to reference manager
			referenceManager.addMapping({
				type: "collection",
				collection: "documentation",
				originalId: docId,
				identifier: docId,
			});
		} catch (error) {
			warnings.push(
				`Failed to parse documentation ${fileInfo.relativePath}: ${error}`,
			);
			console.log(`    ⚠️  Warning: ${warnings[warnings.length - 1]}`);
		}
	}

	// Second pass: establish parent-child relationships and breadcrumbs
	establishHierarchy(documentation);

	// Sort by category and order
	documentation.sort((a, b) => {
		if (a.category !== b.category) {
			return (a.category || "").localeCompare(b.category || "");
		}
		return a.order - b.order;
	});

	console.log(`    ✅ Converted ${documentation.length} documentation entries`);
	if (warnings.length > 0) {
		console.log(`    ⚠️  ${warnings.length} warnings`);
	}

	// Save documentation
	const outputPath = path.join(outputDir, "documentation.json");
	await fs.writeFile(outputPath, JSON.stringify(documentation, null, 2));
}

async function readDocumentationFiles(
	dir: string,
	basePath = "",
): Promise<
	Array<{
		name: string;
		fullPath: string;
		relativePath: string;
	}>
> {
	const files: Array<{ name: string; fullPath: string; relativePath: string }> =
		[];

	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		const relativePath = path.join(basePath, entry.name);

		if (entry.isDirectory()) {
			// Recursively read subdirectories
			const subFiles = await readDocumentationFiles(fullPath, relativePath);
			files.push(...subFiles);
		} else if (
			entry.name.endsWith(".mdoc") &&
			!entry.name.includes("Zone.Identifier")
		) {
			files.push({
				name: entry.name,
				fullPath,
				relativePath,
			});
		}
	}

	return files;
}

function inferCategoryFromPath(relativePath: string): string {
	const pathParts = relativePath.split(path.sep);

	// Get the first directory as category
	if (pathParts.length > 1) {
		return pathParts[0]
			.replace(/-/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
	}

	return "General";
}

function getOrderFromPath(relativePath: string): number {
	const pathParts = relativePath.split(path.sep);

	// Use depth and alphabetical order to determine order
	const depth = pathParts.length;
	const filename = pathParts[pathParts.length - 1];

	// Extract number from filename if present
	const numberMatch = filename.match(/^(\d+)/);
	if (numberMatch) {
		return parseInt(numberMatch[1]);
	}

	// Use depth * 100 + character code for relative ordering
	return depth * 100 + filename.charCodeAt(0);
}

function generateDocIdFromPath(relativePath: string): string {
	return relativePath
		.replace(/\.mdoc$/, "")
		.replace(/[/\\]/g, "-")
		.replace(/[^a-zA-Z0-9-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase();
}

function generateSlugFromPath(relativePath: string): string {
	return relativePath
		.replace(/\.mdoc$/, "")
		.replace(/[/\\]/g, "/")
		.replace(/[^a-zA-Z0-9/-]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.toLowerCase();
}

function establishHierarchy(documentation: DocumentationJson[]): void {
	// Create a map for easy lookup
	const docMap = new Map<string, DocumentationJson>();
	documentation.forEach((doc) => docMap.set(doc.id, doc));

	// Establish parent-child relationships based on path structure
	documentation.forEach((doc) => {
		const pathParts = doc.slug.split("/");

		if (pathParts.length > 1) {
			// Try to find parent document
			const parentPath = pathParts.slice(0, -1).join("/");
			const parentId = generateDocIdFromPath(parentPath + ".mdoc");

			// Look for parent by path or by directory index
			let parent = docMap.get(parentId);

			// Try finding a parent with same directory name
			if (!parent) {
				const parentDirName = pathParts[pathParts.length - 2];
				for (const [id, candidate] of docMap) {
					if (
						candidate.slug.endsWith(parentDirName) &&
						candidate.slug.split("/").length === pathParts.length - 1
					) {
						parent = candidate;
						break;
					}
				}
			}

			if (parent) {
				doc.parent = `{ref:documentation:${parent.id}}`;

				// Add this doc to parent's children
				if (!parent.children) {
					parent.children = [];
				}
				parent.children.push(`{ref:documentation:${doc.id}}`);
			}
		}

		// Generate breadcrumbs
		doc.breadcrumbs = generateBreadcrumbs(doc, docMap);
	});
}

function generateBreadcrumbs(
	doc: DocumentationJson,
	docMap: Map<string, DocumentationJson>,
): Array<{
	title: string;
	slug: string;
}> {
	const breadcrumbs: Array<{ title: string; slug: string }> = [];
	const pathParts = doc.slug.split("/");

	// Build breadcrumbs from path
	for (let i = 0; i < pathParts.length; i++) {
		const partialPath = pathParts.slice(0, i + 1).join("/");
		const partialId = generateDocIdFromPath(partialPath + ".mdoc");

		if (i === pathParts.length - 1) {
			// Current page
			breadcrumbs.push({
				title: doc.title,
				slug: doc.slug,
			});
		} else {
			// Try to find document for this path segment
			const segmentDoc = docMap.get(partialId);
			if (segmentDoc) {
				breadcrumbs.push({
					title: segmentDoc.title,
					slug: segmentDoc.slug,
				});
			} else {
				// Generate title from path segment
				const title = pathParts[i]
					.replace(/-/g, " ")
					.replace(/\b\w/g, (l) => l.toUpperCase());

				breadcrumbs.push({
					title,
					slug: partialPath,
				});
			}
		}
	}

	return breadcrumbs;
}

function convertToSimpleLexical(markdown: string): any {
	// Split content into paragraphs
	const paragraphs = markdown
		.split("\n\n")
		.filter((p) => p.trim())
		.map((p) => p.trim());

	const children = paragraphs.map((paragraph) => {
		// Handle different types of content
		if (paragraph.startsWith("#")) {
			// Headers
			const level = paragraph.match(/^#+/)?.[0].length || 1;
			const text = paragraph.replace(/^#+\s*/, "");
			return {
				type: "heading",
				tag: `h${Math.min(level, 6)}`,
				children: [{ type: "text", text }],
			};
		} else if (paragraph.startsWith("- ") || paragraph.startsWith("* ")) {
			// Lists
			const items = paragraph
				.split("\n")
				.filter((line) => line.trim().match(/^[-*]\s/))
				.map((line) => line.replace(/^[-*]\s/, ""));

			return {
				type: "list",
				listType: "bullet",
				children: items.map((item) => ({
					type: "listitem",
					children: [{ type: "text", text: item }],
				})),
			};
		} else if (paragraph.match(/^\d+\.\s/)) {
			// Numbered lists
			const items = paragraph
				.split("\n")
				.filter((line) => line.trim().match(/^\d+\.\s/))
				.map((line) => line.replace(/^\d+\.\s/, ""));

			return {
				type: "list",
				listType: "number",
				children: items.map((item) => ({
					type: "listitem",
					children: [{ type: "text", text: item }],
				})),
			};
		}

		// Regular paragraph
		return {
			type: "paragraph",
			children: [{ type: "text", text: paragraph }],
		};
	});

	return {
		root: {
			type: "root",
			format: "",
			indent: 0,
			version: 1,
			children,
		},
	};
}
