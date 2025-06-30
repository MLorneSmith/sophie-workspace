import type { DownloadReference } from "../types";
import path from "node:path";
import { promises as fs } from "node:fs";

export class DownloadExtractor {
	private downloadReferences: Map<string, DownloadReference> = new Map();

	addReference(originalPath: string, metadata?: Partial<DownloadReference>) {
		if (!this.downloadReferences.has(originalPath)) {
			const filename = path.basename(originalPath);
			const reference: DownloadReference = {
				originalPath,
				filename,
				...metadata,
			};

			// Map to R2 key
			reference.r2Key = this.mapToR2Key(originalPath);

			this.downloadReferences.set(originalPath, reference);
		}
	}

	private mapToR2Key(originalPath: string): string {
		// Remove leading slash if present
		const cleanPath = originalPath.startsWith("/")
			? originalPath.slice(1)
			: originalPath;

		// Map common path patterns to R2 structure
		if (cleanPath.startsWith("downloads/")) {
			// downloads/template.pdf -> downloads/template.pdf (no change)
			return cleanPath;
		} else if (cleanPath.startsWith("resources/")) {
			// resources/guide.pdf -> downloads/resources/guide.pdf
			return `downloads/${cleanPath}`;
		} else if (cleanPath.includes("/downloads/")) {
			// Extract the downloads portion
			const idx = cleanPath.indexOf("/downloads/");
			return cleanPath.substring(idx + 1);
		}

		// Default: place in downloads folder
		return `downloads/${cleanPath}`;
	}

	extractFromContent(content: string) {
		// Extract from markdown links
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		const matches = content.matchAll(linkRegex);

		for (const match of matches) {
			const linkText = match[1];
			const href = match[2];

			if (this.isDownloadPath(href)) {
				this.addReference(href, { title: linkText });
			}
		}

		// Extract from HTML anchor tags
		const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/g;
		const anchorMatches = content.matchAll(anchorRegex);

		for (const match of anchorMatches) {
			const href = match[1];
			const linkText = match[2];

			if (this.isDownloadPath(href)) {
				this.addReference(href, { title: linkText });
			}
		}

		// Extract download attributes
		const downloadAttrRegex =
			/<a[^>]+download(?:=["']([^"']+)["'])?[^>]*href=["']([^"']+)["'][^>]*>/g;
		const downloadMatches = content.matchAll(downloadAttrRegex);

		for (const match of downloadMatches) {
			const downloadName = match[1];
			const href = match[2];

			if (this.isDownloadPath(href)) {
				this.addReference(href, {
					filename: downloadName || path.basename(href),
				});
			}
		}
	}

	private isDownloadPath(path: string): boolean {
		// Check if path contains download-related keywords
		if (path.includes("/downloads/") || path.includes("/resources/")) {
			return true;
		}

		// Check for downloadable file extensions
		const downloadableExtensions = [
			".pdf",
			".doc",
			".docx",
			".xls",
			".xlsx",
			".ppt",
			".pptx",
			".zip",
			".rar",
			".7z",
			".tar",
			".gz",
			".mp4",
			".avi",
			".mov",
			".mp3",
			".wav",
			".csv",
			".txt",
			".rtf",
		];

		const ext = path.toLowerCase().substring(path.lastIndexOf("."));
		return downloadableExtensions.includes(ext);
	}

	getReferences(): DownloadReference[] {
		return Array.from(this.downloadReferences.values());
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

export async function extractDownloadsFromDirectory(
	directory: string,
	extractor: DownloadExtractor,
): Promise<void> {
	const files = await fs.readdir(directory, { withFileTypes: true });

	for (const file of files) {
		const fullPath = path.join(directory, file.name);

		if (file.isDirectory()) {
			await extractDownloadsFromDirectory(fullPath, extractor);
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
