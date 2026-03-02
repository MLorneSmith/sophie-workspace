import { createServiceLogger } from "@kit/shared/logger";
import pptxgen from "pptxgenjs";

// Import Logger from the root

// Import the Logger interface

// Import the logger

import type { TemplateConfig as GeneratorTemplateConfig } from "../../schemas/template-config";
import { getDefaultTemplate, getTemplate } from "../../templates";
import { toGeneratorTemplateConfig } from "../../templates/template-config-adapter";
import type {
	SlideContent,
	SlideContentFormatting,
	StoryboardData,
} from "../../types";
import type { TemplateConfig as CuratedTemplateConfig } from "../../types/template.types";
import { DEFAULT_TEMPLATE_CONFIG } from "./default-template";

export type { PositionMap } from "../../constants/layout-positions";
// Re-export layout positions for backward compatibility
export { LAYOUT_POSITIONS } from "../../constants/layout-positions";

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

export type PptxTemplateInput =
	| GeneratorTemplateConfig
	| CuratedTemplateConfig
	| string;

interface ResolvedTemplate {
	config: GeneratorTemplateConfig;
	curatedTemplate?: CuratedTemplateConfig;
}

function isLegacyTemplateConfig(
	value: unknown,
): value is GeneratorTemplateConfig {
	if (!value || typeof value !== "object") {
		return false;
	}
	const candidate = value as Partial<GeneratorTemplateConfig>;
	return Boolean(
		candidate.colors &&
			candidate.typography &&
			candidate.layout &&
			candidate.charts,
	);
}

function isCuratedTemplateConfig(
	value: unknown,
): value is CuratedTemplateConfig {
	if (!value || typeof value !== "object") {
		return false;
	}
	const candidate = value as Partial<CuratedTemplateConfig>;
	const colors = candidate.colors;
	return Boolean(
		typeof candidate.id === "string" &&
			typeof candidate.name === "string" &&
			typeof candidate.description === "string" &&
			typeof candidate.density === "string" &&
			colors &&
			Array.isArray(colors.chartPalette) &&
			colors.chartPalette.length === 5,
	);
}

function mergeGeneratorTemplateConfig(
	templateConfig: GeneratorTemplateConfig,
): GeneratorTemplateConfig {
	return {
		...DEFAULT_TEMPLATE_CONFIG,
		...templateConfig,
		colors: { ...DEFAULT_TEMPLATE_CONFIG.colors, ...templateConfig.colors },
		typography: {
			...DEFAULT_TEMPLATE_CONFIG.typography,
			...templateConfig.typography,
		},
		layout: { ...DEFAULT_TEMPLATE_CONFIG.layout, ...templateConfig.layout },
		charts: { ...DEFAULT_TEMPLATE_CONFIG.charts, ...templateConfig.charts },
	};
}

function resolveTemplate(template?: PptxTemplateInput): ResolvedTemplate {
	if (!template) {
		const curatedTemplate = getDefaultTemplate();
		return {
			config: DEFAULT_TEMPLATE_CONFIG,
			curatedTemplate,
		};
	}

	if (typeof template === "string") {
		const curatedTemplate = getTemplate(template) ?? getDefaultTemplate();
		return {
			config: toGeneratorTemplateConfig(
				curatedTemplate,
				DEFAULT_TEMPLATE_CONFIG,
			),
			curatedTemplate,
		};
	}

	if (isCuratedTemplateConfig(template)) {
		return {
			config: toGeneratorTemplateConfig(template, DEFAULT_TEMPLATE_CONFIG),
			curatedTemplate: template,
		};
	}

	if (isLegacyTemplateConfig(template)) {
		return {
			config: mergeGeneratorTemplateConfig(template),
		};
	}

	return {
		config: DEFAULT_TEMPLATE_CONFIG,
		curatedTemplate: getDefaultTemplate(),
	};
}

/**
 * PptxGenerator class for handling PowerPoint generation from storyboard data
 * using PptxGenJS library
 */
export class PptxGenerator {
	private pptx: pptxgen;
	private logger: import("@kit/shared/logger").EnhancedLogger;
	private templateConfig: GeneratorTemplateConfig;
	private curatedTemplate?: CuratedTemplateConfig;

	/**
	 * Initializes a new PptxGenerator instance
	 */
	constructor(template?: PptxTemplateInput) {
		const resolvedTemplate = resolveTemplate(template);
		this.templateConfig = resolvedTemplate.config;
		this.curatedTemplate = resolvedTemplate.curatedTemplate;
		this.pptx = new pptxgen();

		// Initialize logger using createServiceLogger for synchronous access
		const serviceLogger = createServiceLogger("PPTX-GENERATOR");
		this.logger = serviceLogger.getLogger();
	}

	/**
	 * Generate a PowerPoint file from storyboard data
	 * @param storyboard The structured storyboard data
	 * @returns Promise containing the PowerPoint file as a Buffer
	 */
	async generateFromStoryboard(
		storyboard: StoryboardData,
		template?: PptxTemplateInput,
	): Promise<Buffer> {
		if (template) {
			const resolvedTemplate = resolveTemplate(template);
			this.templateConfig = resolvedTemplate.config;
			this.curatedTemplate = resolvedTemplate.curatedTemplate;
		}

		try {
			try {
				(
					this.pptx as pptxgen & {
						defineLayout?: (opts: {
							name: string;
							width: number;
							height: number;
						}) => void;
					}
				).defineLayout?.({
					name: "CUSTOM",
					width: this.templateConfig.layout.slideWidth,
					height: this.templateConfig.layout.slideHeight,
				});
				this.pptx.layout = "CUSTOM";
			} catch {
				/* use default layout */
			}

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

				// Add subheadlines from the slide's subheadlines array
				if (slide.subheadlines && slide.subheadlines.length > 0) {
					for (let i = 0; i < slide.subheadlines.length; i++) {
						const subheadlineText = slide.subheadlines[i];
						if (subheadlineText?.trim()) {
							this.addSubheadlineToSlide(
								pptxSlide as unknown as PptxSlide,
								subheadlineText,
								slide.layoutId,
								i + 1,
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
							Number.parseInt(columnIndex, 10),
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
		const layout = this.templateConfig.layout;
		const isCentered = layoutId === "title" || layoutId === "section";
		const position =
			layoutId === "title"
				? layout.titlePosition
				: layoutId === "section"
					? layout.sectionPosition
					: layout.contentTitlePosition;
		const fontSize =
			layoutId === "title"
				? this.templateConfig.typography.titleFontSize
				: layoutId === "section"
					? this.templateConfig.typography.sectionFontSize
					: this.templateConfig.typography.headlineFontSize;

		slide.addText(title, {
			x: position.x,
			y: position.y,
			w: position.w,
			h: position.h,
			fontSize,
			fontFace: this.getHeadingFont(),
			color: this.templateConfig.colors.headingText,
			bold: true,
			align: isCentered ? "center" : "left",
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
		const layout = this.templateConfig.layout;
		let position = layout.subheadlinePosition;

		if (layoutId === "two-column" || layoutId === "comparison") {
			position =
				index === 1
					? layout.twoColumnSubheadlineLeft
					: layout.twoColumnSubheadlineRight;
		} else if (layoutId === "image-text" && index === 2) {
			position = layout.imageTextSubheadline;
		} else if (layoutId === "text-image" && index === 1) {
			position = layout.textImageSubheadline;
		} else if (layoutId === "title") {
			position = layout.titleSubheadlinePosition;
		}

		slide.addText(text, {
			x: position.x,
			y: position.y,
			w: position.w,
			h: position.h,
			fontSize: this.templateConfig.typography.subheadlineFontSize,
			fontFace: this.getBodyFont(),
			color: this.templateConfig.colors.subheadingText,
			align: layoutId === "comparison" ? "center" : "left",
		});
	}

	private getHeadingFont(): string {
		return (
			this.curatedTemplate?.typography.headingFont ??
			this.templateConfig.typography.fontFamily
		);
	}

	private getBodyFont(): string {
		return (
			this.curatedTemplate?.typography.bodyFont ??
			this.templateConfig.typography.fontFamily
		);
	}

	private adjustPositionForSubbullet(pos: {
		x: number | string;
		y: number | string;
		w: number | string;
		h: number | string;
	}): {
		x: number | string;
		y: number | string;
		w: number | string;
		h: number | string;
	} {
		return {
			x: typeof pos.x === "number" ? pos.x + 0.5 : pos.x,
			y: pos.y,
			w: typeof pos.w === "number" ? pos.w - 0.5 : pos.w,
			h: pos.h,
		};
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
		const position = this.getPositionForContent(layoutId, columnIndex);
		const formatting = this.getFormatting(content.formatting);
		const bodyFont = this.getBodyFont();

		switch (content.type) {
			case "text":
				if (content.text) {
					slide.addText(content.text, {
						x: position.x,
						y: position.y,
						w: position.w,
						h: position.h,
						fontSize:
							formatting.fontSize ||
							this.templateConfig.typography.bodyFontSize,
						fontFace: bodyFont,
						color: formatting.color || this.templateConfig.colors.bodyText,
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
						fontSize:
							formatting.fontSize ||
							this.templateConfig.typography.bulletFontSize,
						fontFace: bodyFont,
						color: formatting.color || this.templateConfig.colors.bullet,
						bold: formatting.bold,
						italic: formatting.italic,
						underline: formatting.underline,
						bullet: { type: "bullet" },
					});
				}
				break;

			case "subbullet":
				if (content.text) {
					const subbulletPos = this.adjustPositionForSubbullet(position);
					slide.addText(content.text, {
						x: subbulletPos.x,
						y: subbulletPos.y,
						w: subbulletPos.w,
						h: subbulletPos.h,
						fontSize:
							formatting.fontSize ||
							this.templateConfig.typography.subbulletFontSize,
						fontFace: bodyFont,
						color: formatting.color || this.templateConfig.colors.bullet,
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

						slide.addText(
							`Chart could not be rendered (${content.chartType}). Error: ${errorMessage}`,
							{
								x: position.x,
								y: position.y,
								w: position.w,
								h: position.h,
								fontSize: this.templateConfig.typography.tableFontSize,
								fontFace: bodyFont,
								color: this.templateConfig.colors.error,
							},
						);
					}
				}
				break;

			case "image":
				if (content.imageUrl) {
					try {
						(slide as unknown as PptxSlide).addImage({
							path: content.imageUrl,
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

						slide.addText(`Image could not be loaded. Error: ${errorMessage}`, {
							x: position.x,
							y: position.y,
							w: position.w,
							h: position.h,
							fontSize: this.templateConfig.typography.tableFontSize,
							fontFace: bodyFont,
							color: this.templateConfig.colors.error,
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
							fontFace: bodyFont,
							fontSize: this.templateConfig.typography.tableFontSize,
							border: { pt: 0.5, color: this.templateConfig.colors.mutedText },
							autoPage: true,
						});
					} catch (error: unknown) {
						this.logger.error("Error adding table to slide:", { error });

						const errorMessage =
							error instanceof Error ? error.message : String(error);
						slide.addText(
							`Table could not be rendered. Error: ${errorMessage}`,
							{
								x: position.x,
								y: position.y,
								w: position.w,
								h: position.h,
								fontSize: this.templateConfig.typography.tableFontSize,
								fontFace: bodyFont,
								color: this.templateConfig.colors.error,
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
	): {
		x: number | string;
		y: number | string;
		w: number | string;
		h: number | string;
	} {
		const layout = this.templateConfig.layout;

		switch (layoutId) {
			case "title":
				return layout.titleContentPosition;

			case "section":
				return layout.sectionContentPosition;

			case "two-column":
				return columnIndex === 0 ? layout.twoColumnLeft : layout.twoColumnRight;

			case "image-text":
				return columnIndex === 0 ? layout.imageTextImage : layout.imageTextText;

			case "text-image":
				return columnIndex === 0 ? layout.textImageText : layout.textImageImage;

			case "comparison":
				return columnIndex === 0
					? layout.comparisonLeft
					: layout.comparisonRight;

			case "chart":
				return layout.chartPosition;

			case "bullet-list":
				return layout.bulletListPosition;

			default:
				return layout.defaultContentPosition;
		}
	}

	/**
	 * Parse chart data from content
	 * @param content The chart content item
	 * @returns Parsed chart data in PptxGenJS format
	 */
	private parseChartData(content: SlideContent): Record<string, unknown> {
		const defaultChartConfig = {
			chartColors: this.templateConfig.charts.colors,
			title: "Sample Chart",
			showTitle: this.templateConfig.charts.showTitle,
			showLegend: this.templateConfig.charts.showLegend,
			legendPos: this.templateConfig.charts.legendPosition,
			dataLabelPosition: this.templateConfig.charts.dataLabelPosition,
			showDataLabels: this.templateConfig.charts.showDataLabels,
		};

		if (!content.chartData) {
			return {
				...defaultChartConfig,
				chartData: [
					{
						name: "Series 1",
						labels: ["Category 1", "Category 2", "Category 3"],
						values: [4.3, 2.5, 3.5],
					},
				],
			};
		}

		try {
			let chartData = content.chartData;

			if (typeof chartData === "string") {
				chartData = JSON.parse(chartData);
			}

			if (
				(chartData as Record<string, unknown>).chartColors ||
				(chartData as Record<string, unknown>).chartData
			) {
				return chartData as Record<string, unknown>;
			}

			if (Array.isArray((chartData as Record<string, unknown>).series)) {
				const chartDataObj = chartData as Record<string, unknown>;
				return {
					...defaultChartConfig,
					chartColors: chartDataObj.colors || defaultChartConfig.chartColors,
					title: chartDataObj.title || "Chart",
					legendPos:
						chartDataObj.legendPosition || defaultChartConfig.legendPos,
					dataLabelPosition:
						chartDataObj.labelPosition || defaultChartConfig.dataLabelPosition,
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

			const chartDataObj = chartData as Record<string, unknown>;
			return {
				...defaultChartConfig,
				chartColors: chartDataObj.colors || defaultChartConfig.chartColors,
				title: chartDataObj.title || "Chart",
				legendPos: chartDataObj.legendPosition || defaultChartConfig.legendPos,
				dataLabelPosition:
					chartDataObj.labelPosition || defaultChartConfig.dataLabelPosition,
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
			return {
				...defaultChartConfig,
				title: "Error in Chart Data",
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
