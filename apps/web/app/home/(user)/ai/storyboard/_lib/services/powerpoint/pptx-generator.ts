import { createServiceLogger } from "@kit/shared/logger";
import pptxgen from "pptxgenjs";

// Import Logger from the root

// Import the Logger interface

// Import the logger

import type {
	SlideContent,
	SlideContentFormatting,
	StoryboardData,
} from "../../types";

// Re-export layout positions for backward compatibility
export { LAYOUT_POSITIONS } from "../../constants/layout-positions";
export type { PositionMap } from "../../constants/layout-positions";

// Removed unused types - ChartType, ChartData, and ChartOptions were not being used

interface TableRow {
	[key: string]: string | number | boolean | Record<string, unknown>;
}

interface PptxSlide {
	addText(text: string, options?: Record<string, unknown>): void;
	addChart(
		type: string,
		data: unknown[],
		options?: Record<string, unknown>,
	): void;
	addImage(options: Record<string, unknown>): void;
	addTable(
		data: TableRow[][] | unknown[][],
		options?: Record<string, unknown>,
	): void;
	[key: string]: unknown; // Allow other methods
}

// Augment pptxgen types to ensure proper type support
declare module "pptxgenjs" {
	// Chart types enum
	export enum ChartType {
		bar = "bar",
		line = "line",
		pie = "pie",
		area = "area",
		scatter = "scatter",
		bubble = "bubble",
		radar = "radar",
		doughnut = "doughnut",
	}

	// Properly define the write method with output types
	interface PptxGenJs {
		// ChartType enum
		ChartType: typeof ChartType;

		// Define all output types that pptxgenjs supports
		write(outputType: "arraybuffer"): Promise<ArrayBuffer>;
		write(outputType: "base64"): Promise<string>;
		write(outputType: "binarystring"): Promise<string>;
		write(outputType: "blob"): Promise<Blob>;
		write(outputType: "nodebuffer"): Promise<Buffer>;
		write(outputType: "uint8array"): Promise<Uint8Array>;
		// Define the generic write method that accepts WriteProps
		write(
			options: WriteProps,
		): Promise<ArrayBuffer | string | Blob | Buffer | Uint8Array>;
	}

	// Ensure pptxgenjs understands our coordinate types
	type Coord = number | string;

	// Augment the WriteProps interface
	interface WriteProps {
		outputType?:
			| "arraybuffer"
			| "base64"
			| "binarystring"
			| "blob"
			| "nodebuffer"
			| "uint8array";
		fileName?: string;
	}

	// Define Slide interface for pptxgenjs
	interface Slide {
		addText(text: string, options?: Record<string, unknown>): void;
		addChart(
			type: string,
			data: unknown[],
			options?: Record<string, unknown>,
		): void;
		addImage(options: Record<string, unknown>): void;
		addTable(data: unknown[][], options?: Record<string, unknown>): void;
		[key: string]: unknown;
	}

	// Extend PptxGenJs to return typed slides
	interface PptxGenJs {
		addSlide(options?: string | Record<string, unknown>): Slide;
	}
}

/**
 * PptxGenerator class for handling PowerPoint generation from storyboard data
 * using PptxGenJS library
 */
export class PptxGenerator {
	private pptx: pptxgen;
	private logger: import("@kit/shared/logger").EnhancedLogger;

	/**
	 * Initializes a new PptxGenerator instance and defines slide templates
	 */
	constructor() {
		this.pptx = new pptxgen();
		this.defineSlideTemplates();

		// Initialize logger using createServiceLogger for synchronous access
		const serviceLogger = createServiceLogger("PPTX-GENERATOR");
		this.logger = serviceLogger.getLogger();
	}

	/**
	 * Define slide master templates for consistent styling
	 * Using a simplified approach to avoid TypeScript errors
	 */
	private defineSlideTemplates(): void {
		// Basic title slide master
		this.pptx.defineSlideMaster({
			title: "MASTER_TITLE",
			background: { color: "FFFFFF" },
		});

		// Section header master
		this.pptx.defineSlideMaster({
			title: "MASTER_SECTION",
			background: { color: "FFFFFF" },
		});

		// One column slide master
		this.pptx.defineSlideMaster({
			title: "MASTER_ONE_COLUMN",
			background: { color: "FFFFFF" },
		});

		// Two column slide master
		this.pptx.defineSlideMaster({
			title: "MASTER_TWO_COLUMN",
			background: { color: "FFFFFF" },
		});

		// Bullet list slide master
		this.pptx.defineSlideMaster({
			title: "MASTER_BULLET_LIST",
			background: { color: "FFFFFF" },
		});

		// Chart slide master
		this.pptx.defineSlideMaster({
			title: "MASTER_CHART",
			background: { color: "FFFFFF" },
		});

		// Image and Text slide master
		this.pptx.defineSlideMaster({
			title: "MASTER_IMAGE_TEXT",
			background: { color: "FFFFFF" },
		});

		// Text and Image slide master
		this.pptx.defineSlideMaster({
			title: "MASTER_TEXT_IMAGE",
			background: { color: "FFFFFF" },
		});

		// Comparison slide master
		this.pptx.defineSlideMaster({
			title: "MASTER_COMPARISON",
			background: { color: "FFFFFF" },
		});

		// Add header to all slides in the addSlide method instead
	}

	/**
	 * Generate a PowerPoint file from storyboard data
	 * @param storyboard The structured storyboard data
	 * @returns Promise containing the PowerPoint file as a Buffer
	 */
	async generateFromStoryboard(storyboard: StoryboardData): Promise<Buffer> {
		try {
			// Set presentation title and other properties
			this.pptx.title = storyboard.title;
			this.pptx.subject = "Generated using SlideHeroes";
			this.pptx.author = "SlideHeroes AI";

			// Process each slide in the storyboard
			for (const slide of storyboard.slides.sort((a, b) => a.order - b.order)) {
				// Create a slide using the appropriate master template
				const masterName = this.getMasterNameForLayout(slide.layoutId);
				const pptxSlide = this.pptx.addSlide({ masterName });

				// Add headline text to specific slide elements based on the master layout
				// Instead of using placeholder which isn't supported
				this.addTitleToSlide(
					pptxSlide as unknown as PptxSlide,
					slide.title,
					slide.layoutId,
				);

				// Group content by column to handle multi-column layouts properly
				const contentByColumn = this.groupContentByColumn(slide.content);

				// Add subheadlines for each column that has content
				for (const [i, columnIndex] of Object.keys(contentByColumn).entries()) {
					const columnContent = contentByColumn[columnIndex];

					if (columnContent && columnContent.length > 0) {
						// Find a subheadline in the column if any
						const subheadlineContent = columnContent.find(
							(item) => item.type === "text" && item.text?.trim(),
						);

						if (subheadlineContent?.text) {
							// Add subheadline using coordinates from the layout
							this.addSubheadlineToSlide(
								pptxSlide as unknown as PptxSlide,
								subheadlineContent.text,
								slide.layoutId,
								i + 1, // subheadline index
							);
						}
					}
				}

				// Add content for each column
				for (const [columnIndex, contentItems] of Object.entries(
					contentByColumn,
				)) {
					for (const contentItem of contentItems) {
						this.addContentToSlide(
							pptxSlide as unknown as PptxSlide,
							contentItem,
							slide.layoutId,
							Number.parseInt(columnIndex),
						);
					}
				}
			}

			// Generate and return the PowerPoint file as a buffer
			// Use an explicit object parameter with outputType to satisfy TypeScript
			return this.pptx.write({ outputType: "nodebuffer" }) as Promise<Buffer>;
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error("Error generating PowerPoint:", {
				error: errorMessage,
			});
			throw new Error(`Failed to generate PowerPoint file: ${errorMessage}`);
		}
	}

	/**
	 * Add a title to the slide in the correct position based on layout
	 * @param slide The PptxGenJS slide object
	 * @param title The title text
	 * @param layoutId The layout identifier
	 */
	private addTitleToSlide(
		slide: PptxSlide,
		title: string,
		layoutId: string,
	): void {
		// Get position for the title based on layout
		let position = { x: 0.5, y: 0.6, w: 9, h: 0.5 };

		if (layoutId === "title") {
			position = { x: 0.5, y: 1.0, w: 9, h: 1.5 };
		} else if (layoutId === "section") {
			position = { x: 0.5, y: 2.5, w: 9, h: 1.5 };
		}

		slide.addText(title, {
			x: position.x,
			y: position.y,
			w: position.w,
			h: position.h,
			fontSize: layoutId === "title" || layoutId === "section" ? 40 : 24,
			fontFace: "Arial",
			bold: true,
			align: layoutId === "title" || layoutId === "section" ? "center" : "left",
		});
	}

	/**
	 * Add a subheadline to the slide in the correct position based on layout and index
	 * @param slide The PptxGenJS slide object
	 * @param text The subheadline text
	 * @param layoutId The layout identifier
	 * @param index The subheadline index
	 */
	private addSubheadlineToSlide(
		slide: PptxSlide,
		text: string,
		layoutId: string,
		index: number,
	): void {
		let position = { x: 0.5, y: 1.2, w: 9, h: 0.4 };

		// Adjust position based on layout and index
		if (layoutId === "two-column" || layoutId === "comparison") {
			position =
				index === 1
					? { x: 0.5, y: 1.2, w: 4.25, h: 0.4 }
					: { x: 5.25, y: 1.2, w: 4.25, h: 0.4 };
		} else if (layoutId === "image-text" && index === 2) {
			position = { x: 5.0, y: 1.2, w: 4.5, h: 0.4 };
		} else if (layoutId === "text-image" && index === 1) {
			position = { x: 0.5, y: 1.2, w: 4.5, h: 0.4 };
		} else if (layoutId === "title") {
			position = { x: 0.5, y: 3.0, w: 9, h: 1.0 };
		}

		slide.addText(text, {
			x: position.x,
			y: position.y,
			w: position.w,
			h: position.h,
			fontSize: 18,
			fontFace: "Arial",
			align: layoutId === "comparison" ? "center" : "left",
		});
	}

	/**
	 * Map layout ID to the appropriate master slide name
	 * @param layoutId The layout identifier from the storyboard
	 * @returns The corresponding master slide name
	 */
	private getMasterNameForLayout(layoutId: string): string {
		const masters: Record<string, string> = {
			title: "MASTER_TITLE",
			section: "MASTER_SECTION",
			"one-column": "MASTER_ONE_COLUMN",
			"two-column": "MASTER_TWO_COLUMN",
			"bullet-list": "MASTER_BULLET_LIST",
			chart: "MASTER_CHART",
			"image-text": "MASTER_IMAGE_TEXT",
			"text-image": "MASTER_TEXT_IMAGE",
			comparison: "MASTER_COMPARISON",
		};

		return masters[layoutId] || "MASTER_ONE_COLUMN";
	}

	/**
	 * Group content items by their column index
	 * @param content Array of slide content items
	 * @returns Object with column indices as keys and arrays of content items as values
	 */
	private groupContentByColumn(
		content: SlideContent[],
	): Record<string, SlideContent[]> {
		return content.reduce<Record<string, SlideContent[]>>((acc, item) => {
			const columnIndex = item.columnIndex.toString();
			if (!acc[columnIndex]) {
				acc[columnIndex] = [];
			}
			acc[columnIndex].push(item);
			return acc;
		}, {});
	}

	/**
	 * Add specific content to a slide based on its type
	 * @param slide The PptxGenJS slide object
	 * @param content The content item to add
	 * @param layoutId The layout identifier
	 * @param columnIndex The column index for positioning
	 */
	private addContentToSlide(
		slide: PptxSlide,
		content: SlideContent,
		layoutId: string,
		columnIndex: number,
	): void {
		// Get position for the content based on layout and column
		const position = this.getPositionForContent(layoutId, columnIndex);

		// Process text formatting if available
		const formatting = this.getFormatting(content.formatting);

		switch (content.type) {
			case "text":
				if (content.text) {
					slide.addText(content.text, {
						x: position.x,
						y: position.y,
						w: position.w,
						h: position.h,
						fontSize: formatting.fontSize || 16,
						fontFace: "Arial",
						color: formatting.color,
						bold: formatting.bold,
						italic: formatting.italic,
						underline: formatting.underline,
					});
				}
				break;

			case "bullet":
				if (content.text) {
					slide.addText(content.text, {
						x: position.x,
						y: position.y,
						w: position.w,
						h: position.h,
						fontSize: formatting.fontSize || 16,
						fontFace: "Arial",
						color: formatting.color,
						bold: formatting.bold,
						italic: formatting.italic,
						underline: formatting.underline,
						bullet: { type: "bullet" },
					});
				}
				break;

			case "subbullet":
				if (content.text) {
					slide.addText(content.text, {
						x: position.x + 0.5, // Indent subbullets
						y: position.y,
						w: position.w - 0.5,
						h: position.h,
						fontSize: formatting.fontSize || 14,
						fontFace: "Arial",
						color: formatting.color,
						bold: formatting.bold,
						italic: formatting.italic,
						underline: formatting.underline,
						bullet: { type: "circle" },
					});
				}
				break;

			case "chart":
				if (content.chartType && content.chartData) {
					const parsedData = this.parseChartData(content);
					// Extract chart data array and options separately
					const chartDataArray = (parsedData.chartData as unknown[]) || [];
					const chartOptions = {
						x: position.x,
						y: position.y,
						w: position.w,
						h: position.h,
						chartColors: parsedData.chartColors,
						title: parsedData.title,
						showTitle: parsedData.showTitle,
						showLegend: parsedData.showLegend,
						legendPos: parsedData.legendPos,
						dataLabelPosition: parsedData.dataLabelPosition,
						showDataLabels: parsedData.showDataLabels,
					};

					try {
						// Create the appropriate chart type with correct parameters
						switch (content.chartType) {
							case "bar":
								(slide as unknown as PptxSlide).addChart(
									(this.pptx as unknown as pptxgen).ChartType.bar,
									chartDataArray,
									chartOptions,
								);
								break;

							case "line":
								(slide as unknown as PptxSlide).addChart(
									(this.pptx as unknown as pptxgen).ChartType.line,
									chartDataArray,
									chartOptions,
								);
								break;

							case "pie":
								(slide as unknown as PptxSlide).addChart(
									(this.pptx as unknown as pptxgen).ChartType.pie,
									chartDataArray,
									chartOptions,
								);
								break;

							case "area":
								(slide as unknown as PptxSlide).addChart(
									(this.pptx as unknown as pptxgen).ChartType.area,
									chartDataArray,
									chartOptions,
								);
								break;

							case "scatter":
								(slide as unknown as PptxSlide).addChart(
									(this.pptx as unknown as pptxgen).ChartType.scatter,
									chartDataArray,
									chartOptions,
								);
								break;

							case "bubble":
								(slide as unknown as PptxSlide).addChart(
									(this.pptx as unknown as pptxgen).ChartType.bubble,
									chartDataArray,
									chartOptions,
								);
								break;

							case "radar":
								(slide as unknown as PptxSlide).addChart(
									(this.pptx as unknown as pptxgen).ChartType.radar,
									chartDataArray,
									chartOptions,
								);
								break;

							case "doughnut":
								(slide as unknown as PptxSlide).addChart(
									(this.pptx as unknown as pptxgen).ChartType.doughnut,
									chartDataArray,
									chartOptions,
								);
								break;

							default:
								// Default to bar chart if type is unknown
								(slide as unknown as PptxSlide).addChart(
									(this.pptx as unknown as pptxgen).ChartType.bar,
									chartDataArray,
									chartOptions,
								);
								break;
						}
					} catch (error: unknown) {
						const errorMessage =
							error instanceof Error ? error.message : String(error);
						this.logger.error("Error adding chart to slide", {
							chartType: content.chartType,
							error: errorMessage,
						});

						// Add error text instead of failing completely
						slide.addText(
							`Chart could not be rendered (${content.chartType}). Error: ${errorMessage}`,
							{
								x: position.x,
								y: position.y,
								w: position.w,
								h: position.h,
								fontSize: 12,
								fontFace: "Arial",
								color: "FF0000",
							},
						);
					}
				}
				break;

			case "image":
				if (content.imageUrl) {
					try {
						(slide as unknown as PptxSlide).addImage({
							path: content.imageUrl, // Can be URL or base64
							x: position.x,
							y: position.y,
							w: position.w,
							h: position.h,
						});
					} catch (error: unknown) {
						const errorMessage =
							error instanceof Error ? error.message : String(error);
						this.logger.error("Error adding image to slide", {
							imageUrl: content.imageUrl,
							error: errorMessage,
						});

						// Add error text instead of failing completely
						slide.addText(`Image could not be loaded. Error: ${errorMessage}`, {
							x: position.x,
							y: position.y,
							w: position.w,
							h: position.h,
							fontSize: 12,
							fontFace: "Arial",
							color: "FF0000",
						});
					}
				}
				break;

			case "table":
				if (content.tableData) {
					try {
						const tableData =
							typeof content.tableData === "string"
								? JSON.parse(content.tableData)
								: content.tableData;

						(slide as unknown as PptxSlide).addTable(tableData, {
							x: position.x,
							y: position.y,
							w: position.w,
							h: position.h,
							fontFace: "Arial",
							fontSize: 12,
							border: { pt: 0.5, color: "666666" },
							autoPage: true,
						});
					} catch (error: unknown) {
						this.logger.error("Error adding table to slide:", { error });

						// Add error text instead of failing completely
						const errorMessage =
							error instanceof Error ? error.message : String(error);
						slide.addText(
							`Table could not be rendered. Error: ${errorMessage}`,
							{
								x: position.x,
								y: position.y,
								w: position.w,
								h: position.h,
								fontSize: 12,
								fontFace: "Arial",
								color: "FF0000",
							},
						);
					}
				}
				break;
		}
	}

	/**
	 * Process content formatting options
	 * @param formatting Optional formatting properties from content
	 * @returns Processed formatting options
	 */
	private getFormatting(formatting?: SlideContentFormatting): {
		fontSize?: number;
		color?: string;
		bold?: boolean;
		italic?: boolean;
		underline?: boolean;
	} {
		if (!formatting) {
			return {};
		}

		return {
			fontSize: formatting.fontSize,
			color: formatting.color?.replace("#", "") || undefined, // Remove # for PptxGenJS
			bold: formatting.bold,
			italic: formatting.italic,
			underline: formatting.underline,
		};
	}

	/**
	 * Get position coordinates for content based on layout and column
	 * @param layoutId The layout identifier
	 * @param columnIndex The column index
	 * @returns Position object with x, y, width, and height
	 */
	private getPositionForContent(
		layoutId: string,
		columnIndex: number,
	): { x: number; y: number; w: number; h: number } {
		// Default position (for one-column layout)
		let position = { x: 0.5, y: 1.8, w: 9, h: 4 };

		// Adjust based on layout type
		switch (layoutId) {
			case "title":
				position = { x: 0.5, y: 4.5, w: 9, h: 1.5 };
				break;

			case "section":
				position = { x: 0.5, y: 4.0, w: 9, h: 1.5 };
				break;

			case "two-column":
				if (columnIndex === 0) {
					position = { x: 0.5, y: 1.8, w: 4.25, h: 4 };
				} else {
					position = { x: 5.25, y: 1.8, w: 4.25, h: 4 };
				}
				break;

			case "image-text":
				if (columnIndex === 0) {
					position = { x: 0.5, y: 1.8, w: 4.0, h: 4 }; // Image position
				} else {
					position = { x: 5.0, y: 1.8, w: 4.5, h: 4 }; // Text position
				}
				break;

			case "text-image":
				if (columnIndex === 0) {
					position = { x: 0.5, y: 1.8, w: 4.5, h: 4 }; // Text position
				} else {
					position = { x: 5.5, y: 1.8, w: 4.0, h: 4 }; // Image position
				}
				break;

			case "comparison":
				if (columnIndex === 0) {
					position = { x: 0.5, y: 1.8, w: 4.25, h: 4 };
				} else {
					position = { x: 5.25, y: 1.8, w: 4.25, h: 4 };
				}
				break;

			case "chart":
				position = { x: 1.0, y: 1.8, w: 8, h: 4 }; // Centered chart
				break;

			case "bullet-list":
				position = { x: 0.5, y: 1.8, w: 9, h: 0.5 }; // Taller height for bullets
				break;
		}

		return position;
	}

	/**
	 * Parse chart data from content
	 * @param content The chart content item
	 * @returns Parsed chart data in PptxGenJS format
	 */
	private parseChartData(content: SlideContent): Record<string, unknown> {
		// If there's no chartData, return a default structure
		if (!content.chartData) {
			return {
				chartColors: ["4472C4", "ED7D31", "FFC000"],
				title: "Sample Chart",
				showTitle: true,
				showLegend: true,
				legendPos: "b",
				dataLabelPosition: "outEnd",
				showDataLabels: true,
				chartData: [
					{
						name: "Series 1",
						labels: ["Category 1", "Category 2", "Category 3"],
						values: [4.3, 2.5, 3.5],
					},
				],
			};
		}

		// If chartData is provided, parse it to the correct format
		try {
			let chartData = content.chartData;

			// If chartData is a string, try to parse it
			if (typeof chartData === "string") {
				chartData = JSON.parse(chartData);
			}

			// If it's already in the correct format, return it
			if (
				(chartData as Record<string, unknown>).chartColors ||
				(chartData as Record<string, unknown>).chartData
			) {
				return chartData as Record<string, unknown>;
			}

			// If it contains series data, format it appropriately
			if (Array.isArray((chartData as Record<string, unknown>).series)) {
				const chartDataObj = chartData as Record<string, unknown>;
				return {
					chartColors: chartDataObj.colors || [
						"4472C4",
						"ED7D31",
						"FFC000",
						"5B9BD5",
						"70AD47",
					],
					title: chartDataObj.title || "Chart",
					showTitle: true,
					showLegend: true,
					legendPos: chartDataObj.legendPosition || "b",
					dataLabelPosition: chartDataObj.labelPosition || "outEnd",
					showDataLabels: true,
					chartData: (chartDataObj.series as unknown[]).map(
						(series: unknown) => {
							const seriesObj = series as Record<string, unknown>;
							return {
								name: seriesObj.name || "Series",
								labels: seriesObj.labels || [],
								values: seriesObj.values || [],
							};
						},
					),
				};
			}

			// Otherwise, transform it to the required format for single series
			const chartDataObj = chartData as Record<string, unknown>;
			return {
				chartColors: chartDataObj.colors || ["4472C4", "ED7D31", "FFC000"],
				title: chartDataObj.title || "Chart",
				showTitle: true,
				showLegend: true,
				legendPos: chartDataObj.legendPosition || "b",
				dataLabelPosition: chartDataObj.labelPosition || "outEnd",
				showDataLabels: true,
				chartData: [
					{
						name: chartDataObj.seriesName || "Series 1",
						labels: chartDataObj.labels || [],
						values: chartDataObj.values || [],
					},
				],
			};
		} catch (error: unknown) {
			this.logger.error("Error parsing chart data:", { error });

			// Return default chart data on error
			return {
				chartColors: ["4472C4", "ED7D31", "FFC000"],
				title: "Error in Chart Data",
				showTitle: true,
				showLegend: true,
				chartData: [
					{
						name: "Error",
						labels: ["Please check", "chart data", "format"],
						values: [1, 1, 1],
					},
				],
			};
		}
	}
}
