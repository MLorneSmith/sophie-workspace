/**
 * Unit tests for PptxGenerator - PowerPoint generation service
 * Tests core functionality for converting storyboard data to PPTX files
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StoryboardData } from "../../types";
import { LAYOUT_POSITIONS, PptxGenerator } from "./pptx-generator";

// Mock PptxGenJS library
const mockSlide = {
	addText: vi.fn(),
	addChart: vi.fn(),
	addImage: vi.fn(),
	addTable: vi.fn(),
};

const mockPptxGen = {
	title: "",
	subject: "",
	author: "",
	defineSlideMaster: vi.fn(),
	addSlide: vi.fn(() => mockSlide),
	write: vi.fn(),
	ChartType: {
		bar: "bar",
		line: "line",
		pie: "pie",
		area: "area",
		scatter: "scatter",
		bubble: "bubble",
		radar: "radar",
		doughnut: "doughnut",
	},
};

vi.mock("pptxgenjs", () => ({
	default: vi.fn(() => mockPptxGen),
}));

// Mock Logger
const mockLoggerInstance = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
	fatal: vi.fn(),
};

vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn(() => Promise.resolve(mockLoggerInstance)),
}));

describe("PptxGenerator", () => {
	let generator: PptxGenerator;

	beforeEach(() => {
		vi.clearAllMocks();
		// Clear mock logger instance calls
		for (const mock of Object.values(mockLoggerInstance)) {
			mock.mockClear();
		}
		generator = new PptxGenerator();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Constructor & Initialization", () => {
		it("should initialize PptxGenJS instance correctly", () => {
			expect(mockPptxGen.defineSlideMaster).toHaveBeenCalledTimes(9);

			// Verify all slide masters are defined
			const expectedMasters = [
				"MASTER_TITLE",
				"MASTER_SECTION",
				"MASTER_ONE_COLUMN",
				"MASTER_TWO_COLUMN",
				"MASTER_BULLET_LIST",
				"MASTER_CHART",
				"MASTER_IMAGE_TEXT",
				"MASTER_TEXT_IMAGE",
				"MASTER_COMPARISON",
			];

			for (const masterName of expectedMasters) {
				expect(mockPptxGen.defineSlideMaster).toHaveBeenCalledWith({
					title: masterName,
					background: { color: "FFFFFF" },
				});
			}
		});

		it("should set up logger correctly with placeholder", () => {
			// Logger should be initialized with placeholder functions
			expect(generator).toBeDefined();
			// The actual logger replacement happens asynchronously
		});
	});

	describe("Core PowerPoint Generation", () => {
		const createTestStoryboard = (): StoryboardData => ({
			title: "Test Presentation",
			slides: [
				{
					id: "1",
					title: "Test Slide",
					headline: "Test Headline",
					layoutId: "one-column",
					order: 1,
					content: [
						{
							id: "1",
							area: "content1",
							type: "text",
							text: "Hello World",
							columnIndex: 0,
						},
					],
				},
			],
		});

		it("should generate valid PowerPoint from complete storyboard", async () => {
			const storyboard = createTestStoryboard();
			const mockBuffer = Buffer.from("mock-pptx-data");
			mockPptxGen.write.mockResolvedValue(mockBuffer);

			const result = await generator.generateFromStoryboard(storyboard);

			expect(result).toBeInstanceOf(Buffer);
			expect(result).toBe(mockBuffer);
			expect(mockPptxGen.write).toHaveBeenCalledWith({
				outputType: "nodebuffer",
			});
		});

		it("should set presentation metadata correctly", async () => {
			const storyboard = createTestStoryboard();
			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));

			await generator.generateFromStoryboard(storyboard);

			expect(mockPptxGen.title).toBe("Test Presentation");
			expect(mockPptxGen.subject).toBe("Generated using SlideHeroes");
			expect(mockPptxGen.author).toBe("SlideHeroes AI");
		});

		it("should process slides in correct order", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "2",
						title: "Second Slide",
						headline: "Second",
						layoutId: "one-column",
						order: 2,
						content: [],
					},
					{
						id: "1",
						title: "First Slide",
						headline: "First",
						layoutId: "one-column",
						order: 1,
						content: [],
					},
				],
			};
			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));

			await generator.generateFromStoryboard(storyboard);

			expect(mockPptxGen.addSlide).toHaveBeenCalledTimes(2);
			expect(mockSlide.addText).toHaveBeenNthCalledWith(
				1,
				"First Slide",
				expect.any(Object),
			);
			expect(mockSlide.addText).toHaveBeenNthCalledWith(
				2,
				"Second Slide",
				expect.any(Object),
			);
		});

		it("should handle empty storyboard gracefully", async () => {
			const storyboard: StoryboardData = {
				title: "Empty Presentation",
				slides: [],
			};
			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));

			const result = await generator.generateFromStoryboard(storyboard);

			expect(result).toBeInstanceOf(Buffer);
			expect(mockPptxGen.addSlide).not.toHaveBeenCalled();
			expect(mockPptxGen.title).toBe("Empty Presentation");
		});

		it("should handle missing storyboard title gracefully", async () => {
			const storyboard = { ...createTestStoryboard(), title: "" };
			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));

			await generator.generateFromStoryboard(storyboard);

			expect(mockPptxGen.title).toBe("");
		});
	});

	describe("Layout Handling", () => {
		it("should map layout IDs to correct master names", async () => {
			const layouts = [
				{ layoutId: "title", expected: "MASTER_TITLE" },
				{ layoutId: "section", expected: "MASTER_SECTION" },
				{ layoutId: "one-column", expected: "MASTER_ONE_COLUMN" },
				{ layoutId: "two-column", expected: "MASTER_TWO_COLUMN" },
				{ layoutId: "bullet-list", expected: "MASTER_BULLET_LIST" },
				{ layoutId: "chart", expected: "MASTER_CHART" },
				{ layoutId: "image-text", expected: "MASTER_IMAGE_TEXT" },
				{ layoutId: "text-image", expected: "MASTER_TEXT_IMAGE" },
				{ layoutId: "comparison", expected: "MASTER_COMPARISON" },
			];

			for (const layout of layouts) {
				const storyboard: StoryboardData = {
					title: "Test",
					slides: [
						{
							id: "1",
							title: "Test",
							headline: "Test",
							layoutId: layout.layoutId,
							order: 1,
							content: [],
						},
					],
				};

				mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
				await generator.generateFromStoryboard(storyboard);

				expect(mockPptxGen.addSlide).toHaveBeenCalledWith({
					masterName: layout.expected,
				});
				vi.clearAllMocks();
			}
		});

		it("should use default master for unknown layout", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "unknown-layout",
						order: 1,
						content: [],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockPptxGen.addSlide).toHaveBeenCalledWith({
				masterName: "MASTER_ONE_COLUMN",
			});
		});
	});

	describe("Title Addition", () => {
		it("should add title with correct positioning for title layout", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Main Title",
						headline: "Main Title",
						layoutId: "title",
						order: 1,
						content: [],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith("Main Title", {
				x: 0.5,
				y: 1.0,
				w: 9,
				h: 1.5,
				fontSize: 40,
				fontFace: "Arial",
				bold: true,
				align: "center",
			});
		});

		it("should add title with correct positioning for section layout", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Section Title",
						headline: "Section Title",
						layoutId: "section",
						order: 1,
						content: [],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith("Section Title", {
				x: 0.5,
				y: 2.5,
				w: 9,
				h: 1.5,
				fontSize: 40,
				fontFace: "Arial",
				bold: true,
				align: "center",
			});
		});

		it("should add title with correct positioning for content layouts", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Content Title",
						headline: "Content Title",
						layoutId: "one-column",
						order: 1,
						content: [],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith("Content Title", {
				x: 0.5,
				y: 0.6,
				w: 9,
				h: 0.5,
				fontSize: 24,
				fontFace: "Arial",
				bold: true,
				align: "left",
			});
		});
	});

	describe("Content Addition - Text", () => {
		it("should add text content with correct formatting", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "one-column",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "text",
								text: "Hello World",
								columnIndex: 0,
								formatting: {
									fontSize: 18,
									color: "#FF0000",
									bold: true,
									italic: false,
									underline: true,
								},
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith("Hello World", {
				x: 0.5,
				y: 1.8,
				w: 9,
				h: 4,
				fontSize: 18,
				fontFace: "Arial",
				color: "FF0000",
				bold: true,
				italic: false,
				underline: true,
			});
		});

		it("should add bullet content with bullet formatting", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "bullet-list",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "bullet",
								text: "Bullet point",
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith(
				"Bullet point",
				expect.objectContaining({
					bullet: { type: "bullet" },
				}),
			);
		});

		it("should add subbullet content with indentation", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "bullet-list",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "subbullet",
								text: "Sub bullet",
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith(
				"Sub bullet",
				expect.objectContaining({
					x: 1.0, // Indented by 0.5
					w: 8.5, // Width reduced by 0.5
					bullet: { type: "circle" },
					fontSize: 14,
				}),
			);
		});
	});

	describe("Content Addition - Charts", () => {
		it("should add bar chart with correct data", async () => {
			const chartData = {
				chartColors: ["4472C4", "ED7D31"],
				title: "Test Chart",
				chartData: [
					{
						name: "Series 1",
						labels: ["A", "B", "C"],
						values: [1, 2, 3],
					},
				],
			};

			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "chart",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "chart",
								chartType: "bar",
								chartData: chartData,
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addChart).toHaveBeenCalledWith(
				"bar",
				expect.objectContaining({
					x: 1.0,
					y: 1.8,
					w: 8,
					h: 4,
					chartColors: ["4472C4", "ED7D31"],
					title: "Test Chart",
				}),
			);
		});

		it("should handle all supported chart types", async () => {
			const chartTypes = [
				"bar",
				"line",
				"pie",
				"area",
				"scatter",
				"bubble",
				"radar",
				"doughnut",
			];

			for (const chartType of chartTypes) {
				const storyboard: StoryboardData = {
					title: "Test",
					slides: [
						{
							id: "1",
							title: "Test",
							headline: "Test",
							layoutId: "chart",
							order: 1,
							content: [
								{
									id: "1",
									area: "content1",
									type: "chart",
									chartType: chartType as unknown,
									chartData: { title: "Test" },
									columnIndex: 0,
								},
							],
						},
					],
				};

				mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
				await generator.generateFromStoryboard(storyboard);

				expect(mockSlide.addChart).toHaveBeenCalledWith(
					chartType,
					expect.any(Object),
				);
				vi.clearAllMocks();
			}
		});

		it("should fall back to bar chart for unknown chart type", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "chart",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "chart",
								chartType: "unknown" as unknown,
								chartData: { title: "Test" },
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addChart).toHaveBeenCalledWith(
				"bar",
				expect.any(Object),
			);
		});

		it("should handle chart errors gracefully", async () => {
			mockSlide.addChart.mockImplementation(() => {
				throw new Error("Chart error");
			});

			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "chart",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "chart",
								chartType: "bar",
								chartData: { title: "Test" },
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith(
				expect.stringContaining("Chart could not be rendered"),
				expect.objectContaining({ color: "FF0000" }),
			);
			// Error should be logged
			expect(mockLoggerInstance.error).toHaveBeenCalled();
		});
	});

	describe("Content Addition - Images", () => {
		it("should add image with correct URL and positioning", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "one-column",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "image",
								imageUrl: "https://example.com/image.jpg",
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addImage).toHaveBeenCalledWith({
				path: "https://example.com/image.jpg",
				x: 0.5,
				y: 1.8,
				w: 9,
				h: 4,
			});
		});

		it("should handle image loading errors gracefully", async () => {
			mockSlide.addImage.mockImplementation(() => {
				throw new Error("Image load error");
			});

			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "one-column",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "image",
								imageUrl: "https://example.com/broken.jpg",
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith(
				expect.stringContaining("Image could not be loaded"),
				expect.objectContaining({ color: "FF0000" }),
			);
			// Error should be logged
			expect(mockLoggerInstance.error).toHaveBeenCalled();
		});
	});

	describe("Content Addition - Tables", () => {
		it("should add table with parsed JSON data", async () => {
			const tableData = [
				["Header1", "Header2"],
				["Row1Col1", "Row1Col2"],
			];

			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "one-column",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "table",
								tableData: JSON.stringify(tableData),
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addTable).toHaveBeenCalledWith(
				tableData,
				expect.objectContaining({
					x: 0.5,
					y: 1.8,
					w: 9,
					h: 4,
					fontFace: "Arial",
					fontSize: 12,
				}),
			);
		});

		it("should add table with object data", async () => {
			const tableData = [
				["Header1", "Header2"],
				["Row1Col1", "Row1Col2"],
			];

			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "one-column",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "table",
								tableData: tableData,
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addTable).toHaveBeenCalledWith(
				tableData,
				expect.any(Object),
			);
		});

		it("should handle table errors gracefully", async () => {
			mockSlide.addTable.mockImplementation(() => {
				throw new Error("Table error");
			});

			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "one-column",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "table",
								tableData: "invalid json",
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith(
				expect.stringContaining("Table could not be rendered"),
				expect.objectContaining({ color: "FF0000" }),
			);
			// Error should be logged
			expect(mockLoggerInstance.error).toHaveBeenCalled();
		});
	});

	describe("Position Calculation", () => {
		it("should calculate correct positions for two-column layouts", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "two-column",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "text",
								text: "Left column",
								columnIndex: 0,
							},
							{
								id: "2",
								area: "content2",
								type: "text",
								text: "Right column",
								columnIndex: 1,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addText).toHaveBeenCalledWith(
				"Left column",
				expect.objectContaining({
					x: 0.5,
					w: 4.25,
				}),
			);

			expect(mockSlide.addText).toHaveBeenCalledWith(
				"Right column",
				expect.objectContaining({
					x: 5.25,
					w: 4.25,
				}),
			);
		});
	});

	describe("Chart Data Parsing", () => {
		it("should parse chart data from string format", async () => {
			const chartDataString = JSON.stringify({
				title: "Test Chart",
				labels: ["A", "B", "C"],
				values: [1, 2, 3],
			});

			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "chart",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "chart",
								chartType: "bar",
								chartData: chartDataString,
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addChart).toHaveBeenCalledWith(
				"bar",
				expect.objectContaining({
					title: "Test Chart",
					chartData: expect.arrayContaining([
						expect.objectContaining({
							labels: ["A", "B", "C"],
							values: [1, 2, 3],
						}),
					]),
				}),
			);
		});

		it("should return default chart data when missing", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "chart",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "chart",
								chartType: "bar",
								chartData: {}, // empty object to trigger parseChartData with missing data
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addChart).toHaveBeenCalledWith(
				"bar",
				expect.objectContaining({
					title: "Chart",
					chartData: expect.arrayContaining([
						expect.objectContaining({
							name: "Series 1",
							labels: [],
							values: [],
						}),
					]),
				}),
			);
		});

		it("should handle invalid chart data gracefully", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Test",
						headline: "Test",
						layoutId: "chart",
						order: 1,
						content: [
							{
								id: "1",
								area: "content1",
								type: "chart",
								chartType: "bar",
								chartData: "invalid json data",
								columnIndex: 0,
							},
						],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			await generator.generateFromStoryboard(storyboard);

			expect(mockSlide.addChart).toHaveBeenCalledWith(
				"bar",
				expect.objectContaining({
					title: "Error in Chart Data",
					chartData: expect.arrayContaining([
						expect.objectContaining({
							name: "Error",
							labels: ["Please check", "chart data", "format"],
							values: [1, 1, 1],
						}),
					]),
				}),
			);
			// Error should be logged
			expect(mockLoggerInstance.error).toHaveBeenCalled();
		});
	});

	describe("Error Scenarios", () => {
		it("should handle PptxGenJS write method failure", async () => {
			const storyboard = {
				title: "Test",
				slides: [],
			};

			// Mock write to throw synchronously to trigger catch block
			mockPptxGen.write.mockImplementation(() => {
				throw new Error("Write failed");
			});

			await expect(
				generator.generateFromStoryboard(storyboard),
			).rejects.toThrow("Failed to generate PowerPoint file: Write failed");
			// Error should be logged
			expect(mockLoggerInstance.error).toHaveBeenCalled();
		});

		it("should handle slide with no content", async () => {
			const storyboard: StoryboardData = {
				title: "Test",
				slides: [
					{
						id: "1",
						title: "Empty Slide",
						headline: "Empty",
						layoutId: "one-column",
						order: 1,
						content: [],
					},
				],
			};

			mockPptxGen.write.mockResolvedValue(Buffer.from("test"));
			const result = await generator.generateFromStoryboard(storyboard);

			expect(result).toBeInstanceOf(Buffer);
			expect(mockSlide.addText).toHaveBeenCalledWith(
				"Empty Slide",
				expect.any(Object),
			);
		});
	});

	describe("LAYOUT_POSITIONS constant", () => {
		it("should export LAYOUT_POSITIONS with all required layouts", () => {
			expect(LAYOUT_POSITIONS).toBeDefined();
			expect(typeof LAYOUT_POSITIONS).toBe("object");

			const expectedLayouts = [
				"title",
				"section",
				"one-column",
				"two-column",
				"bullet-list",
				"chart",
				"image-text",
				"text-image",
				"comparison",
			];

			for (const layout of expectedLayouts) {
				expect(LAYOUT_POSITIONS[layout]).toBeDefined();
				expect(LAYOUT_POSITIONS[layout]?.title).toBeDefined();
				expect(LAYOUT_POSITIONS[layout]?.title?.x).toBeTypeOf("number");
				expect(LAYOUT_POSITIONS[layout]?.title?.y).toBeTypeOf("number");
			}
		});

		it("should have different positioning for different layouts", () => {
			// Title layout should have different positioning from content layouts
			expect(LAYOUT_POSITIONS.title?.title?.y).not.toBe(
				LAYOUT_POSITIONS["one-column"]?.title?.y,
			);
			expect(LAYOUT_POSITIONS.title?.title?.fontSize).toBeGreaterThan(
				LAYOUT_POSITIONS["one-column"]?.title?.fontSize || 0,
			);

			// Two-column should have subheadline2 while one-column should not
			expect(LAYOUT_POSITIONS["two-column"]?.subheadline2).toBeDefined();
			expect(LAYOUT_POSITIONS["one-column"]?.subheadline2).toBeUndefined();
		});
	});
});
