/**
 * @name registerInstrumentation
 * @description This file is used to register Baselime instrumentation for your Next.js application.
 *
 * Please set the MONITORING_PROVIDER environment variable to 'baselime' to register Baselime instrumentation.
 */
export async function registerInstrumentation() {
	if (process.env.ENABLE_MONITORING_INSTRUMENTATION !== "true") {
		return;
	}

	const serviceName = process.env.INSTRUMENTATION_SERVICE_NAME;

	if (!serviceName) {
		throw new Error(`
      You have set the Baselime instrumentation provider, but have not set the INSTRUMENTATION_SERVICE_NAME environment variable. 
      Please set the INSTRUMENTATION_SERVICE_NAME environment variable.
    `);
	}

	// Only register instrumentation in Node.js runtime, not Edge Runtime
	if (process.env.NEXT_RUNTIME === "nodejs") {
		try {
			const { BaselimeSDK, BetterHttpInstrumentation, VercelPlugin } =
				await import("@baselime/node-opentelemetry");

			const sdk = new BaselimeSDK({
				serverless: true,
				service: serviceName,
				baselimeKey: process.env.NEXT_PUBLIC_BASELIME_KEY,
				instrumentations: [
					new BetterHttpInstrumentation({
						plugins: [new VercelPlugin()],
					}),
				],
			});

			sdk.start();
		} catch (error) {
			// Log warning but don't fail if OpenTelemetry can't be loaded
			// biome-ignore lint/suspicious/noConsole: Required for instrumentation error logging
			console.warn("Failed to initialize Baselime instrumentation:", error);
		}
	}
}
