/**
 * Types for the Storyboard system
 */
import { v4 as generateUuid } from "uuid";

/**
 * Represents a database record for a building blocks submission
 */
export interface BuildingBlocksSubmission {
	/**
	 * Unique identifier
	 */
	id?: string;

	/**
	 * Title of the submission
	 */
	title?: string | null;

	/**
	 * User ID of the owner
	 */
	user_id?: string | null;

	/**
	 * Create timestamp
	 */
	created_at?: string | null;

	/**
	 * The audience targeted by the presentation
	 */
	audience?: string | null;

	/**
	 * Answer to the building blocks framework
	 */
	answer?: string | null;

	/**
	 * Complication to the building blocks framework
	 */
	complication?: string | null;

	/**
	 * The JSON outline data
	 */
	outline?: TipTapDocument;

	/**
	 * The storyboard data for the presentation
	 */
	storyboard?: StoryboardData;
}

/**
 * The main data structure for a presentation storyboard
 */
export interface StoryboardData {
	/**
	 * The title of the presentation
	 */
	title: string;

	/**
	 * Array of slides in the presentation
	 */
	slides: Slide[];
}

/**
 * Represents a single slide in the presentation
 */
export interface Slide {
	/**
	 * Unique identifier for the slide
	 */
	id: string;

	/**
	 * The type of slide (title, section, content, bullet, etc.)
	 */
	slideType:
		| "title"
		| "section"
		| "content"
		| "bullet"
		| "chart"
		| "comparison";

	/**
	 * The main headline of the slide
	 */
	title: string;

	/**
	 * Secondary headlines (one per column based on layout)
	 */
	subheadlines: string[];

	/**
	 * Reference to the layout template to use
	 */
	layoutId: string;

	/**
	 * The slide's content items
	 */
	content: SlideContent[];

	/**
	 * The position of this slide in the presentation
	 */
	order: number;
}

/**
 * Represents a content item within a slide
 */
export interface SlideContent {
	/**
	 * The type of content
	 */
	type: "text" | "bullet" | "subbullet" | "chart" | "image" | "table";

	/**
	 * Which column this content belongs to (0-based index)
	 */
	columnIndex: number;

	/**
	 * Text content for text, bullet, and subbullet types
	 */
	text?: string;

	/**
	 * Chart type for chart content
	 */
	chartType?:
		| "bar"
		| "line"
		| "pie"
		| "area"
		| "scatter"
		| "bubble"
		| "radar"
		| "funnel";

	/**
	 * Chart data for chart content
	 * Can be a string (JSON) or an object with the structure expected by PptxGenJS
	 */
	chartData?: string | Record<string, unknown>;

	/**
	 * Image URL or base64 data for image content
	 */
	imageUrl?: string;

	/**
	 * Table data for table content
	 */
	tableData?: string[][] | Record<string, unknown>;

	/**
	 * Optional formatting options
	 */
	formatting?: {
		bold?: boolean;
		italic?: boolean;
		color?: string;
		fontSize?: number;
	};
}

// Incoming Data Model (TipTap Document Structure) - for reference
export interface TipTapDocument {
	type: "doc";
	content: TipTapNode[];
	meta?: {
		sectionType: string;
		timestamp: string;
		version: string;
	};
}

export interface TipTapNode {
	type: "heading" | "paragraph" | "bulletList" | "orderedList" | "listItem";
	attrs?: {
		level?: number; // For heading nodes (1-6)
		indent?: number; // Indentation level
	};
	content?: TipTapNode[];
}

export interface TipTapTextNode {
	type: "text";
	text: string;
	marks?: { type: string; attrs?: Record<string, unknown> }[];
}

// PptxGenJS-optimized Data Structure (Outgoing Data Model) - for reference
export interface PresentationStructure {
	title: string;
	slides: SlideContent[]; // Note: This SlideContent is different from the one above
}

// Storyboard Data Model (Stored in building_blocks_submissions.storyboard)
export interface StoryboardSlide {
	id: string;
	headline: string; // Main slide headline
	// content: ContentNode[]; // Outline content (structured text) - Not stored here, fetched from outline column
	order: number; // Slide position in presentation

	// Storyboard-specific properties
	storyboard: {
		layoutId: string; // Selected layout template
		subHeadlines: string[]; // Sub-headlines for each column
		contentAreas: ContentArea[]; // Content areas defined by the layout
		settings: {
			// Additional slide settings
			chartTypes: Record<string, string>; // Content area ID to chart type mapping
			imageSettings: Record<string, ImageSettings>;
			tableSettings: Record<string, TableSettings>;
			outlineContentMapping?: Record<string, string[]>; // Mapping of contentAreaId to array of outline node IDs/paths
		};
	};
}

// Content area definition
export interface ContentArea {
	id: string;
	type: "text" | "bullet" | "chart" | "image" | "table";
	columnIndex: number;
	position: { x: number; y: number; w: number; h: number };
}

// Placeholder interfaces for settings (define as needed)
type ImageSettings = Record<string, unknown>;
type TableSettings = Record<string, unknown>;

// Layout Template Definition
export interface LayoutTemplate {
	id: string;
	name: string;
	description: string;
	columns: number; // Number of content columns
	visual: string; // Path to visual preview image or icon name
	contentAreas: ContentArea[]; // Default content areas for this layout
}

// Predefined Layout Templates (based on PRD section 5.3)
export const PRESET_LAYOUTS: LayoutTemplate[] = [
	{
		id: "title",
		name: "Title Slide",
		description: "Main title with subtitle",
		columns: 1,
		visual: "icon-title-slide", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 0,
				position: { x: 0.1, y: 0.3, w: 0.8, h: 0.3 },
			},
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 0,
				position: { x: 0.1, y: 0.6, w: 0.8, h: 0.2 },
			},
		],
	},
	{
		id: "section",
		name: "Section Header",
		description: "Section divider slide",
		columns: 1,
		visual: "icon-section-header", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 0,
				position: { x: 0.1, y: 0.4, w: 0.8, h: 0.3 },
			},
		],
	},
	{
		id: "one-column",
		name: "One Column",
		description: "Single content area for text or media",
		columns: 1,
		visual: "icon-one-column", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 0,
				position: { x: 0.1, y: 0.3, w: 0.8, h: 0.6 },
			},
		],
	},
	{
		id: "two-columns",
		name: "Two Columns",
		description: "Two equal content columns",
		columns: 2,
		visual: "icon-two-columns", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 0,
				position: { x: 0.1, y: 0.3, w: 0.35, h: 0.6 },
			},
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 1,
				position: { x: 0.55, y: 0.3, w: 0.35, h: 0.6 },
			},
		],
	},
	{
		id: "three-columns",
		name: "Three Columns",
		description: "Three equal content columns",
		columns: 3,
		visual: "icon-three-columns", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 0,
				position: { x: 0.05, y: 0.3, w: 0.25, h: 0.6 },
			},
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 1,
				position: { x: 0.375, y: 0.3, w: 0.25, h: 0.6 },
			},
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 2,
				position: { x: 0.7, y: 0.3, w: 0.25, h: 0.6 },
			},
		],
	},
	{
		id: "image-text",
		name: "Image and Text",
		description: "Left image with right text",
		columns: 2,
		visual: "icon-image-text", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "image",
				columnIndex: 0,
				position: { x: 0.1, y: 0.3, w: 0.4, h: 0.6 },
			},
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 1,
				position: { x: 0.55, y: 0.3, w: 0.35, h: 0.6 },
			},
		],
	},
	{
		id: "text-image",
		name: "Text and Image",
		description: "Left text with right image",
		columns: 2,
		visual: "icon-text-image", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 0,
				position: { x: 0.1, y: 0.3, w: 0.35, h: 0.6 },
			},
			{
				id: generateUuid(),
				type: "image",
				columnIndex: 1,
				position: { x: 0.55, y: 0.3, w: 0.4, h: 0.6 },
			},
		],
	},
	{
		id: "chart",
		name: "Chart Slide",
		description: "Center chart with description",
		columns: 1,
		visual: "icon-chart", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "chart",
				columnIndex: 0,
				position: { x: 0.1, y: 0.3, w: 0.8, h: 0.5 },
			},
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 0,
				position: { x: 0.1, y: 0.85, w: 0.8, h: 0.1 },
			},
		],
	},
	{
		id: "bullet-list",
		name: "Bullet List",
		description: "Focus on bullet point lists",
		columns: 1,
		visual: "icon-bullet-list", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "bullet",
				columnIndex: 0,
				position: { x: 0.1, y: 0.3, w: 0.8, h: 0.6 },
			},
		],
	},
	{
		id: "comparison",
		name: "Comparison",
		description: "Side-by-side comparison layout",
		columns: 2,
		visual: "icon-comparison", // Placeholder icon name
		contentAreas: [
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 0,
				position: { x: 0.1, y: 0.3, w: 0.35, h: 0.6 },
			},
			{
				id: generateUuid(),
				type: "text",
				columnIndex: 1,
				position: { x: 0.55, y: 0.3, w: 0.35, h: 0.6 },
			},
		],
	},
];

export * from "./template.types";
