/**
 * Playbook Seeding Script
 *
 * This script embeds SlideHeroes' internal presentation frameworks as global
 * knowledge accessible to all agents. It is idempotent - running it multiple
 * times will not create duplicate embeddings.
 *
 * Usage:
 *   pnpm --filter @kit/mastra seed:playbooks
 *
 * Or import and call programmatically:
 *   import { seedPlaybooks } from '@kit/mastra/rag';
 *   await seedPlaybooks();
 */

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { embedDocument, querySimilarFiltered } from "./index";

/**
 * Metadata for playbook embeddings
 */
export interface PlaybookMetadata extends Record<string, unknown> {
	/** The type of content - always "playbook" for playbook content */
	contentType: "playbook";
	/** Unique identifier for the playbook */
	playbookId: string;
	/** Human-readable name of the playbook */
	playbookName: string;
	/** Optional description of the playbook content */
	description?: string;
}

/**
 * Playbook content descriptor
 */
interface PlaybookFile {
	/** Unique identifier matching the filename */
	id: string;
	/** Display name */
	name: string;
	/** Short description */
	description: string;
	/** Path to the content file */
	filePath: string;
}

/**
 * Get all playbook content files from the playbook-content directory
 */
async function getPlaybookFiles(): Promise<PlaybookFile[]> {
	const currentDir = dirname(fileURLToPath(import.meta.url));
	const playbookContentDir = join(currentDir, "playbook-content");

	const files = await readdir(playbookContentDir).catch(() => []);

	return files
		.filter((file) => file.endsWith(".md"))
		.map((file) => {
			const id = file.replace(".md", "");
			// Convert kebab-case to Title Case for display name
			const name = id
				.split("-")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ");

			const descriptions: Record<string, string> = {
				"scqa-framework":
					"Situation-Complication-Question-Answer structured communication framework",
				"pyramid-principle":
					"Top-down communication, grouping, and summarizing methodology",
				"minto-framework": "Logical argument structuring from Barbara Minto",
				"slide-design-principles":
					"Data visualization, layout, and typography best practices",
				"audience-analysis-framework":
					"Stakeholder mapping and communication preferences analysis",
			};

			return {
				id,
				name,
				description: descriptions[id] || `${name} presentation framework`,
				filePath: join(playbookContentDir, file),
			};
		});
}

/**
 * Check if a playbook embedding already exists by querying for content with matching playbookId
 */
async function playbookExists(playbookId: string): Promise<boolean> {
	const results = await querySimilarFiltered(
		"playbook content validation check",
		1,
		{ contentType: ["playbook"] },
	);

	// If we get any results with matching metadata, the playbook already exists
	const firstResult = results[0];
	return !!(
		firstResult?.metadata &&
		(firstResult.metadata as Record<string, unknown>).playbookId === playbookId
	);
}

/**
 * Read the content of a playbook file
 */
async function readPlaybookContent(filePath: string): Promise<string> {
	const content = await readFile(filePath, "utf-8");
	return content;
}

/**
 * Seed a single playbook - embeds the content if it doesn't already exist
 */
async function seedPlaybook(playbook: PlaybookFile): Promise<{
	skipped: boolean;
	embedded: boolean;
	chunks: number;
}> {
	// Check if playbook already exists (idempotency)
	const exists = await playbookExists(playbook.id);

	if (exists) {
		// biome-ignore lint/suspicious/noConsole: Seed script visibility
		console.log(`  ⏭️  Skipping "${playbook.name}" - already seeded`);
		return { skipped: true, embedded: false, chunks: 0 };
	}

	// Read the content
	const content = await readPlaybookContent(playbook.filePath);

	// Create metadata for the embedding
	const metadata: PlaybookMetadata = {
		contentType: "playbook",
		playbookId: playbook.id,
		playbookName: playbook.name,
		description: playbook.description,
	};

	// Embed the document
	const result = await embedDocument(content, metadata);

	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log(
		`  ✅ Seeded "${playbook.name}" - ${result.chunks} chunks embedded`,
	);

	return { skipped: false, embedded: true, chunks: result.chunks };
}

/**
 * Main seeding function - seeds all playbooks that don't already exist
 *
 * @returns Summary of the seeding operation
 */
export async function seedPlaybooks(): Promise<{
	total: number;
	skipped: number;
	embedded: number;
	totalChunks: number;
}> {
	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log("\n📚 Seeding Playbook Knowledge Base...\n");

	const playbooks = await getPlaybookFiles();

	if (playbooks.length === 0) {
		// biome-ignore lint/suspicious/noConsole: Seed script visibility
		console.log("No playbook content files found.");
		return { total: 0, skipped: 0, embedded: 0, totalChunks: 0 };
	}

	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log(`Found ${playbooks.length} playbook(s) to process:\n`);

	let skipped = 0;
	let embedded = 0;
	let totalChunks = 0;

	for (const playbook of playbooks) {
		const result = await seedPlaybook(playbook);

		if (result.skipped) {
			skipped++;
		} else if (result.embedded) {
			embedded++;
			totalChunks += result.chunks;
		}
	}

	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log("\n📊 Seeding complete:");
	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log(`   Total playbooks: ${playbooks.length}`);
	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log(`   Skipped (already exists): ${skipped}`);
	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log(`   Newly embedded: ${embedded}`);
	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log(`   Total chunks: ${totalChunks}\n`);

	return { total: playbooks.length, skipped, embedded, totalChunks };
}

/**
 * Force reseed all playbooks by re-embedding all content.
 *
 * WARNING: This does NOT delete existing embeddings first.
 * Each call creates NEW embeddings with new IDs, resulting in duplicates.
 * Use only for development/testing or when you plan to manually purge
 * old playbook embeddings from the vector store beforehand.
 */
export async function reseedPlaybooks(): Promise<{
	total: number;
	embedded: number;
	totalChunks: number;
}> {
	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log("\n🔄 Force reseeding Playbook Knowledge Base...\n");

	const playbooks = await getPlaybookFiles();

	if (playbooks.length === 0) {
		// biome-ignore lint/suspicious/noConsole: Seed script visibility
		console.log("No playbook content files found.");
		return { total: 0, embedded: 0, totalChunks: 0 };
	}

	// Note: In a full implementation, we would delete existing embeddings first
	// using the filter. For now, we'll just re-embed (which may create duplicates
	// if the underlying vector store supports upsert with the same IDs)

	let embedded = 0;
	let totalChunks = 0;

	for (const playbook of playbooks) {
		const content = await readPlaybookContent(playbook.filePath);
		const metadata: PlaybookMetadata = {
			contentType: "playbook",
			playbookId: playbook.id,
			playbookName: playbook.name,
			description: playbook.description,
		};

		const result = await embedDocument(content, metadata);
		// biome-ignore lint/suspicious/noConsole: Seed script visibility
		console.log(
			`  ✅ Re-embedded "${playbook.name}" - ${result.chunks} chunks`,
		);
		embedded++;
		totalChunks += result.chunks;
	}

	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log("\n📊 Force reseed complete:");
	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log(`   Total: ${playbooks.length}`);
	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log(`   Embedded: ${embedded}`);
	// biome-ignore lint/suspicious/noConsole: Seed script visibility
	console.log(`   Total chunks: ${totalChunks}\n`);

	return { total: playbooks.length, embedded, totalChunks };
}

// Allow running as a standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
	seedPlaybooks()
		.then(() => {
			process.exit(0);
		})
		.catch((error) => {
			// biome-ignore lint/suspicious/noConsole: Error reporting
			console.error("Seeding failed:", error);
			process.exit(1);
		});
}
