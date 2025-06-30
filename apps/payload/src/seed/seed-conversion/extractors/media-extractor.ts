import type { MediaReference } from "../types";
import path from "node:path";
import { promises as fs } from "node:fs";

export class MediaExtractor {
	private mediaReferences: Map<string, MediaReference> = new Map();

	addReference(originalPath: string, metadata?: Partial<MediaReference>) {
		if (!this.mediaReferences.has(originalPath)) {
			const filename = path.basename(originalPath);
			const reference: MediaReference = {
				originalPath,
				filename,
				...metadata,
			};

			// Map common paths to R2 keys
			reference.r2Key = this.mapToR2Key(originalPath);

			this.mediaReferences.set(originalPath, reference);
		}
	}

	private mapToR2Key(originalPath: string): string {
		// Remove leading slash if present
		let cleanPath = originalPath.startsWith("/")
			? originalPath.slice(1)
			: originalPath;

		// Map common path patterns to R2 structure
		if (cleanPath.startsWith("cms/images/")) {
			// cms/images/lesson-0/image.png -> media/lessons/lesson-0/image.png
			cleanPath = cleanPath.replace("cms/images/", "media/");
		} else if (cleanPath.startsWith("images/")) {
			// images/hero-bg.jpg -> media/general/hero-bg.jpg
			cleanPath = cleanPath.replace("images/", "media/general/");
		}

		return cleanPath;
	}

	extractFromContent(content: string) {
		// Extract from markdown images
		const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
		const matches = content.matchAll(imageRegex);

		for (const match of matches) {
			const alt = match[1];
			const src = match[2];

			if (this.isMediaPath(src)) {
				this.addReference(src, { alt });
			}
		}

		// Extract from HTML img tags
		const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
		const imgMatches = content.matchAll(imgTagRegex);

		for (const match of imgMatches) {
			const src = match[1];
			if (this.isMediaPath(src)) {
				// Try to extract alt text
				const altMatch = match[0].match(/alt=["']([^"']+)["']/);
				this.addReference(src, { alt: altMatch?.[1] });
			}
		}

		// Extract from CSS background images
		const bgImageRegex = /url\s*\(\s*["']?([^"')]+)["']?\s*\)/g;
		const bgMatches = content.matchAll(bgImageRegex);

		for (const match of bgMatches) {
			const url = match[1];
			if (this.isMediaPath(url)) {
				this.addReference(url);
			}
		}
	}

	private isMediaPath(path: string): boolean {
		const mediaExtensions = [
			".jpg",
			".jpeg",
			".png",
			".gif",
			".svg",
			".webp",
			".ico",
		];
		const ext = path.toLowerCase().substring(path.lastIndexOf("."));
		return mediaExtensions.includes(ext);
	}

	getReferences(): MediaReference[] {
		return Array.from(this.mediaReferences.values());
	}

	async saveReferences(outputPath: string) {
		const references = this.getReferences();
		const output = {
			total: references.length,
			references: references.sort((a, b) =>
				a.originalPath.localeCompare(b.originalPath),
			),
		};

		await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
	}
}

export async function extractMediaFromDirectory(
	directory: string,
	extractor: MediaExtractor,
): Promise<void> {
	const files = await fs.readdir(directory, { withFileTypes: true });

	for (const file of files) {
		const fullPath = path.join(directory, file.name);

		if (file.isDirectory()) {
			await extractMediaFromDirectory(fullPath, extractor);
		} else if (file.isFile()) {
			const ext = path.extname(file.name).toLowerCase();

			// Process content files
			if ([".mdoc", ".md", ".html", ".yaml", ".json"].includes(ext)) {
				const content = await fs.readFile(fullPath, "utf-8");
				extractor.extractFromContent(content);
			}
		}
	}
}
