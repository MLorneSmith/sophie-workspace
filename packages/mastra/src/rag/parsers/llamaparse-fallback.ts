import { withRetry } from "../../resilience/retry";
import type {
	DocumentChunk,
	DocumentMetadata,
	ParseResult,
	ParserStrategy,
} from "./types";

const LLAMAPARSE_BASE_URL =
	"https://api.cloud.llamaindex.ai/api/parsing/upload";

/**
 * LlamaParse API Parser Strategy - fallback for complex documents
 * Uses the LlamaParse API for high-quality document extraction
 * Pricing: $0.003/page
 */
export class LlamaParseParserStrategy implements ParserStrategy {
	private readonly apiKey: string;

	constructor(apiKey: string) {
		if (!apiKey) {
			throw new Error("LLAMAPARSE_API_KEY is required for LlamaParse fallback");
		}
		this.apiKey = apiKey;
	}

	async parse(buffer: Buffer): Promise<ParseResult> {
		const result = await withRetry(
			async () => {
				const formData = new FormData();
				// Convert Buffer to Uint8Array then to Blob
				const uint8Array = new Uint8Array(buffer);
				const blob = new Blob([uint8Array], {
					type: "application/octet-stream",
				});
				formData.append("file", blob, "document");

				const response = await fetch(LLAMAPARSE_BASE_URL, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
					},
					body: formData,
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(
						`LlamaParse API error: ${response.status} ${response.statusText} - ${errorText}`,
					);
				}

				return response.json();
			},
			{
				maxAttempts: 3,
				initialDelayMs: 1000,
				maxDelayMs: 30000,
				backoffMultiplier: 2,
			},
		);

		return this.convertToParseResult(result);
	}

	private convertToParseResult(data: unknown): ParseResult {
		if (!data || typeof data !== "object") {
			return {
				chunks: [],
				metadata: { format: "pdf", pageCount: 0, parsedBy: "llamaparse" },
			};
		}

		const response = data as Record<string, unknown>;

		// LlamaParse returns data.pages array with page content
		const pages =
			(response.data as Record<string, unknown>)?.pages ?? response.pages ?? [];
		const chunks: DocumentChunk[] = [];

		if (Array.isArray(pages)) {
			for (const page of pages) {
				if (!page || typeof page !== "object") continue;

				const pageObj = page as Record<string, unknown>;
				const pageNumber = (pageObj.page_number as number) ?? chunks.length + 1;
				const text = (pageObj.text as string) ?? "";

				chunks.push({
					text,
					pageOrSlide: pageNumber,
					title: pageObj.section_header as string | undefined,
				});
			}
		}

		const metadata: DocumentMetadata = {
			format: "pdf",
			pageCount: chunks.length,
			parsedBy: "llamaparse",
			title: response.name as string | undefined,
			author: response.author as string | undefined,
		};

		return { chunks, metadata };
	}
}

/**
 * Create a LlamaParse parser instance
 * @param apiKey - LlamaParse API key (defaults to env var)
 */
export function createLlamaParseParser(apiKey?: string): ParserStrategy {
	const key = apiKey ?? process.env.LLAMAPARSE_API_KEY;
	if (!key) {
		throw new Error(
			"LLAMAPARSE_API_KEY is required. Set it in environment or pass as argument.",
		);
	}
	return new LlamaParseParserStrategy(key);
}
