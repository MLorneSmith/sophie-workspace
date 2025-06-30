export interface ConversionResult {
	success: boolean;
	collectionName: string;
	data?: unknown[];
	errors?: string[];
	warnings?: string[];
}

export interface MediaReference {
	originalPath: string;
	r2Key?: string;
	filename: string;
	mimeType?: string;
	filesize?: number;
	width?: number;
	height?: number;
	alt?: string;
}

export interface DownloadReference {
	originalPath: string;
	r2Key?: string;
	filename: string;
	mimeType?: string;
	filesize?: number;
	title?: string;
	description?: string;
}

export interface ReferenceMapping {
	type: "collection" | "media" | "download";
	collection?: string;
	originalId: string;
	newId?: string;
	identifier?: string;
}

export interface ParsedContent {
	frontmatter: Record<string, unknown>;
	content: string;
	references: {
		media: string[];
		downloads: string[];
		collections: Array<{
			collection: string;
			identifier: string;
		}>;
	};
}

export interface LexicalNode {
	type: string;
	version: number;
	[key: string]: unknown;
}

export interface LexicalContent {
	root: {
		type: "root";
		format: "";
		indent: 0;
		version: 1;
		children: LexicalNode[];
		direction: null;
	};
}
