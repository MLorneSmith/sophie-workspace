import type { ReferenceMapping } from "../types";

export class ReferenceManager {
	private mappings: Map<string, ReferenceMapping> = new Map();

	// Add a reference mapping
	addMapping(mapping: ReferenceMapping) {
		const key = this.createKey(mapping);
		this.mappings.set(key, mapping);
	}

	// Create a unique key for the mapping
	private createKey(mapping: ReferenceMapping): string {
		if (mapping.type === "collection") {
			return `${mapping.type}:${mapping.collection}:${mapping.originalId}`;
		}
		return `${mapping.type}:${mapping.originalId}`;
	}

	// Get the new ID for a reference
	getNewId(
		type: "collection" | "media" | "download",
		collection?: string,
		originalId?: string,
	): string | undefined {
		const key =
			type === "collection"
				? `${type}:${collection}:${originalId}`
				: `${type}:${originalId}`;

		const mapping = this.mappings.get(key);
		return mapping?.newId;
	}

	// Format a reference for use in Payload
	formatReference(
		type: "collection" | "media" | "download",
		collection?: string,
		identifier?: string,
	): string {
		if (type === "collection" && collection && identifier) {
			// Check if we have a mapping
			const newId = this.getNewId(type, collection, identifier);
			if (newId) {
				return newId;
			}

			// Otherwise, use the reference format
			return `{ref:${collection}:${identifier}}`;
		} else if ((type === "media" || type === "download") && identifier) {
			// Check if we have a mapping
			const newId = this.getNewId(type, undefined, identifier);
			if (newId) {
				return newId;
			}

			// Otherwise, use the reference format
			return `{ref:${type}:${identifier}}`;
		}

		throw new Error(
			`Invalid reference: type=${type}, collection=${collection}, identifier=${identifier}`,
		);
	}

	// Replace references in content
	replaceReferences(content: string): string {
		let processedContent = content;

		// Replace media references
		const mediaRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
		processedContent = processedContent.replace(
			mediaRegex,
			(match, alt, src) => {
				if (src.startsWith("/cms/images/") || src.startsWith("/images/")) {
					const newRef = this.formatReference("media", undefined, src);
					return `![${alt}](${newRef})`;
				}
				return match;
			},
		);

		// Replace download references
		const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
		processedContent = processedContent.replace(
			linkRegex,
			(match, text, href) => {
				if (href.includes("/downloads/") || href.includes("/resources/")) {
					const newRef = this.formatReference("download", undefined, href);
					return `[${text}](${newRef})`;
				}
				return match;
			},
		);

		return processedContent;
	}

	// Get all mappings for export
	getMappings(): ReferenceMapping[] {
		return Array.from(this.mappings.values());
	}

	// Load mappings from a previous run
	loadMappings(mappings: ReferenceMapping[]) {
		mappings.forEach((mapping) => this.addMapping(mapping));
	}
}
