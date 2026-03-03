import {
	MIN_CHARS_PER_PAGE,
	type DocumentChunk,
	type DocumentMetadata,
	type ParseOptions,
	type ParseResult,
	type ParserStrategy,
	type SupportedFormat,
} from "./types";

import { createLlamaParseParser } from "./llamaparse-fallback";

const NAMESPACE = "[document-parser]";

function log(
	level: "info" | "warn" | "error",
	message: string,
	meta?: Record<string, unknown>,
) {
	const timestamp = new Date().toISOString();
	const logMessage = `${timestamp} ${NAMESPACE} ${message}`;
	const output = meta ? `${logMessage} ${JSON.stringify(meta)}\n` : `${logMessage}\n`;

	if (level === "error") {
		process.stderr.write(output);
	} else {
		process.stdout.write(output);
	}
}

/**
 * Factory function to create a DocumentParserService instance
 */
export function createDocumentParserService() {
	return new DocumentParserService();
}

/**
 * Main document parser service that routes to format-specific parsers
 * and handles quality gate logic
 */
export class DocumentParserService {
	/**
	 * Parse a document buffer into chunks based on format
	 * @param buffer - The document file buffer
	 * @param format - Document format (pptx or pdf)
	 * @param options - Parse options (skip quality gate, force LlamaParse)
	 * @returns Promise resolving to ParseResult
	 */
	async parseDocument(
		buffer: Buffer,
		format: SupportedFormat,
		options?: ParseOptions,
	): Promise<ParseResult> {
		const ctx = { format, options };

		log("info", "Parsing document", ctx);

		try {
			const parser = this.getParser(format);
			let result = await parser.parse(buffer);

			// Check quality gate unless disabled
			const shouldCheckQuality =
				!options?.skipQualityGate && !options?.forceLlamaParse;

			if (shouldCheckQuality) {
				const passesQualityGate = this.checkQualityGate(
					result.chunks,
					result.metadata.pageCount,
				);

				if (!passesQualityGate) {
					log("warn", "Quality gate failed, escalating to LlamaParse", {
						...ctx,
						charsPerPage: this.calculateCharsPerPage(
							result.chunks,
							result.metadata.pageCount,
						),
					});

					// Check if LlamaParse API key is available
					const llamaApiKey = process.env.LLAMAPARSE_API_KEY;
					if (llamaApiKey) {
						const llamaParser = createLlamaParseParser(llamaApiKey);
						result = await llamaParser.parse(buffer);
						log("info", "Document parsed with LlamaParse fallback", {
							...ctx,
							chunks: result.chunks.length,
							pages: result.metadata.pageCount,
							parsedBy: result.metadata.parsedBy,
						});
					} else {
						log(
							"warn",
							"LlamaParse API key not available, returning local parser results",
							ctx,
						);
					}
				}
			}

			log("info", "Document parsed successfully", {
				...ctx,
				chunks: result.chunks.length,
				pages: result.metadata.pageCount,
			});

			return result;
		} catch (error) {
			log("error", "Error parsing document", { ...ctx, error: String(error) });
			throw error;
		}
	}

	/**
	 * Get the appropriate parser strategy for a format
	 */
	private getParser(format: SupportedFormat): ParserStrategy {
		switch (format) {
			case "pptx":
				return new PptxParserStrategy();
			case "pdf":
				return new PdfParserStrategy();
			default:
				throw new Error(`Unsupported format: ${format}`);
		}
	}

	/**
	 * Check if the parsed content passes the quality gate
	 * Returns true if chars per page >= MIN_CHARS_PER_PAGE
	 */
	private checkQualityGate(
		chunks: DocumentChunk[],
		pageCount: number,
	): boolean {
		if (pageCount === 0) {
			return true;
		}

		const charsPerPage = this.calculateCharsPerPage(chunks, pageCount);
		return charsPerPage >= MIN_CHARS_PER_PAGE;
	}

	/**
	 * Calculate average characters per page
	 */
	private calculateCharsPerPage(
		chunks: DocumentChunk[],
		pageCount: number,
	): number {
		const totalChars = chunks.reduce(
			(sum, chunk) => sum + chunk.text.length,
			0,
		);
		return totalChars / pageCount;
	}
}

/**
 * PPTX Parser Strategy using officeparser
 */
class PptxParserStrategy implements ParserStrategy {
	async parse(buffer: Buffer): Promise<ParseResult> {
		// Dynamic import to avoid issues with ESM-only package
		const { OfficeParser } = await import("officeparser");

		// Parse the buffer - officeparser v6 uses parseOffice with file data
		const ast = await OfficeParser.parseOffice(buffer);

		// Get the text content from the AST
		const fullText = ast.toText?.() ?? "";
		const content = ast.content ?? [];

		// Extract slides from content - look for slide nodes
		const slides = this.extractSlides(content);
		const chunks: DocumentChunk[] = [];

		for (let i = 0; i < slides.length; i++) {
			const slide = slides[i];
			const slideText = this.extractSlideText(slide);
			const title = this.extractSlideTitle(slide);
			const speakerNotes = (slide as Record<string, unknown>).speakerNotes as
				| string
				| undefined;

			chunks.push({
				text: slideText,
				pageOrSlide: i + 1,
				title,
				speakerNotes,
			});
		}

		// If no slides found in structured content, fall back to text parsing
		if (chunks.length === 0 && fullText) {
			// Split by double newlines or slide markers to approximate slides
			const textChunks = fullText
				.split(/\n\n+/)
				.filter((s): s is string => Boolean(s));
			for (let i = 0; i < textChunks.length; i++) {
				const chunkText = textChunks[i] ?? "";
				chunks.push({
					text: chunkText,
					pageOrSlide: i + 1,
				});
			}
		}

		const metadata: DocumentMetadata = {
			format: "pptx",
			pageCount: chunks.length,
			parsedBy: "officeparser",
			title: (ast.metadata as Record<string, unknown>)?.title as
				| string
				| undefined,
			author: (ast.metadata as Record<string, unknown>)?.author as
				| string
				| undefined,
		};

		return { chunks, metadata };
	}

	private extractSlides(content: unknown): unknown[] {
		if (!Array.isArray(content)) {
			return [];
		}

		// Look for slide-type nodes in the content
		const slides: unknown[] = [];
		for (const item of content) {
			if (!item || typeof item !== "object") continue;
			const obj = item as Record<string, unknown>;
			// Check if this is a slide node
			if (
				obj.type === "slide" ||
				obj.slideNumber !== undefined ||
				obj.num !== undefined
			) {
				slides.push(item);
			}
		}
		return slides;
	}

	private extractSlideText(slide: unknown): string {
		if (!slide) return "";

		// Handle various slide structures from officeparser
		if (typeof slide === "string") {
			return slide;
		}

		if (typeof slide === "object") {
			const slideObj = slide as Record<string, unknown>;

			// Try common text extraction patterns
			const text =
				slideObj.text ?? slideObj.content ?? slideObj.slideText ?? "";
			if (typeof text === "string") {
				return text;
			}

			// If it's an array, join the elements
			if (Array.isArray(text)) {
				return text
					.map((item) => {
						if (typeof item === "string") return item;
						if (typeof item === "object" && item !== null) {
							return ((item as Record<string, unknown>).text as string) ?? "";
						}
						return "";
					})
					.filter(Boolean)
					.join("\n");
			}
		}

		return "";
	}

	private extractSlideTitle(slide: unknown): string | undefined {
		if (!slide || typeof slide !== "object") {
			return undefined;
		}

		const slideObj = slide as Record<string, unknown>;

		// Try common title extraction patterns
		const title =
			slideObj.title ?? slideObj.slideTitle ?? slideObj.heading ?? "";
		if (typeof title === "string" && title.trim()) {
			return title.trim();
		}

		return undefined;
	}
}

/**
 * PDF Parser Strategy using pdf.js-extract
 */
class PdfParserStrategy implements ParserStrategy {
	async parse(buffer: Buffer): Promise<ParseResult> {
		// Dynamic import to avoid issues with ESM
		const { PDFExtract } = await import("pdf.js-extract");

		const pdfExtract = new PDFExtract();
		const data = await pdfExtract.extractBuffer(buffer);

		const chunks: DocumentChunk[] = [];

		if (data?.pages) {
			for (const page of data.pages) {
				const pageObj = page as unknown as Record<string, unknown>;
				const pageNumber =
					((pageObj.pageInfo as Record<string, unknown>)?.num as number) ??
					chunks.length + 1;
				const pageText = this.extractPageText(page);

				chunks.push({
					text: pageText,
					pageOrSlide: pageNumber,
				});
			}
		}

		const metadata: DocumentMetadata = {
			format: "pdf",
			pageCount: chunks.length,
			parsedBy: "pdf.js-extract",
		};

		return { chunks, metadata };
	}

	private extractPageText(page: unknown): string {
		if (!page || typeof page !== "object") {
			return "";
		}

		const pageObj = page as Record<string, unknown>;

		// Try common text extraction patterns
		const content = pageObj.content ?? "";

		if (typeof content === "string") {
			return content;
		}

		if (Array.isArray(content)) {
			return content
				.map((item) => {
					if (typeof item === "string") return item;
					if (typeof item === "object" && item !== null) {
						return (item as Record<string, unknown>).str ?? "";
					}
					return "";
				})
				.filter(Boolean)
				.join(" ");
		}

		return "";
	}
}
