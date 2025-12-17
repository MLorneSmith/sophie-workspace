/**
 * Performance API Error Handler
 *
 * This module handles errors from the Web Performance API, specifically
 * the Next.js 16.x bug where negative timestamps are passed to Performance.measure()
 * causing "Failed to execute 'measure' on 'Performance': 'Page' cannot have a negative time stamp" errors.
 *
 * This is a workaround for: https://github.com/vercel/next.js/issues/86060
 * Can be removed once Next.js releases a fix for this regression.
 */

/**
 * Check if an error is a Performance API error
 * These typically occur during page render and are caused by Next.js internals
 */
export function isPerformanceApiError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}

	const message = error.message || "";
	return (
		message.includes("Failed to execute 'measure' on 'Performance'") ||
		message.includes("cannot have a negative time stamp") ||
		(message.includes("Performance") && message.includes("timestamp"))
	);
}

/**
 * Create a performance API error handler that can be attached to window.onerror
 * This prevents the error from crashing the page while allowing it to be logged
 */
export function createPerformanceApiErrorHandler() {
	return (
		event: string | Event,
		_source?: string,
		_lineno?: number,
		_colno?: number,
		error?: Error,
	) => {
		// Get the error object to check
		let errorObj: Error;

		if (error) {
			errorObj = error;
		} else if (typeof event === "string") {
			errorObj = new Error(event);
		} else if (event instanceof ErrorEvent) {
			errorObj = event.error || new Error(event.message || "Unknown error");
		} else {
			// Unknown event type
			return false;
		}

		if (isPerformanceApiError(errorObj)) {
			// Log the error for monitoring purposes
			if (process.env.NODE_ENV === "development") {
				// biome-ignore lint/suspicious/noConsole: Intentional logging for error monitoring
				console.warn(
					"[Performance API Error] Caught and suppressed Next.js Performance API error:",
					errorObj.message,
					errorObj.stack,
				);
			} else if (process.env.NODE_ENV === "test") {
				// biome-ignore lint/suspicious/noConsole: Intentional logging for test debugging
				console.log("[Performance API Error] Suppressed:", errorObj.message);
			}

			// Return true to prevent the error from propagating
			return true;
		}

		// Return false to allow other errors to propagate normally
		return false;
	};
}

/**
 * Install the global error handler for Performance API errors
 * This should be called in the root layout component
 */
export function installPerformanceApiErrorHandler(): void {
	if (typeof window === "undefined") {
		return; // Skip on server
	}

	const handler = createPerformanceApiErrorHandler();

	// Store reference to allow cleanup if needed
	const originalHandler = window.onerror;

	window.onerror = ((event, source, lineno, colno, error) => {
		// Call our handler first
		const handled = handler(event, source, lineno, colno, error);

		// If we handled it, don't call the original handler
		if (handled) {
			return true;
		}

		// Otherwise, call the original handler if it exists
		if (typeof originalHandler === "function") {
			return originalHandler(event, source, lineno, colno, error);
		}

		return false;
	}) as OnErrorEventHandler;
}

/**
 * Handle Performance API errors in React error boundaries
 * Returns true if the error should be suppressed, false otherwise
 */
export function shouldSuppressPerformanceError(error: unknown): boolean {
	if (isPerformanceApiError(error)) {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Intentional logging for error monitoring
			console.warn("[Performance API Error Boundary] Caught error:", error);
		}
		return true;
	}

	return false;
}
