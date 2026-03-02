import { Langfuse } from "langfuse";
import { createServiceLogger } from "@kit/shared/logger";

const { getLogger } = createServiceLogger("langfuse-client");

// Lazy initialization - client is created on first use
let langfuseClient: Langfuse | null = null;

/**
 * Checks if Langfuse is properly configured with all required environment variables
 * @returns true if Langfuse is configured, false otherwise
 */
export function isLangfuseConfigured(): boolean {
	const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
	const secretKey = process.env.LANGFUSE_SECRET_KEY;
	const host = process.env.LANGFUSE_HOST;

	// If any are provided but not all, log a warning
	if ((publicKey || secretKey || host) && (!publicKey || !secretKey)) {
		(async () => {
			const logger = await getLogger();
			logger.warn(
				"Langfuse is partially configured. All required variables must be set.",
			);
		})();
		return false;
	}

	return !!(publicKey && secretKey);
}

/**
 * Gets the Langfuse client, initializing it on first use (lazy initialization pattern)
 * @returns The Langfuse client instance or null if not configured
 */
export function getLangfuseClient(): Langfuse | null {
	if (!isLangfuseConfigured()) {
		return null;
	}

	// Initialize client if not already initialized
	if (!langfuseClient) {
		// biome-ignore lint/style/noNonNullAssertion: Already verified in isLangfuseConfigured()
		const publicKey = process.env.LANGFUSE_PUBLIC_KEY!;
		// biome-ignore lint/style/noNonNullAssertion: Already verified in isLangfuseConfigured()
		const secretKey = process.env.LANGFUSE_SECRET_KEY!;
		const host = process.env.LANGFUSE_HOST;

		langfuseClient = new Langfuse({
			publicKey,
			secretKey,
			baseUrl: host || "https://cloud.langfuse.com",
		});

		(async () => {
			const logger = await getLogger();
			logger.info("Langfuse client initialized successfully");
		})();
	}

	return langfuseClient;
}

/**
 * Closes the Langfuse client connection
 * Useful for testing or cleanup
 */
export async function closeLangfuseClient(): Promise<void> {
	if (langfuseClient) {
		await langfuseClient.flushAsync();
		langfuseClient = null;

		const logger = await getLogger();
		logger.info("Langfuse client closed");
	}
}
