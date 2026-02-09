/**
 * Shared Conditional Logger
 *
 * Creates a logger that suppresses console output when the Ink UI dashboard
 * is active. Errors are always logged regardless of UI state.
 */

/**
 * Create a conditional logger that only outputs when UI is disabled.
 * When UI is enabled, console output is suppressed to avoid interfering
 * with the Ink-based dashboard. Errors are always logged regardless.
 */
export function createLogger(uiEnabled: boolean) {
	return {
		log: (...args: unknown[]) => {
			if (!uiEnabled) console.log(...args);
		},
		warn: (...args: unknown[]) => {
			if (!uiEnabled) console.warn(...args);
		},
		error: (...args: unknown[]) => {
			// Always log errors, even in UI mode
			console.error(...args);
		},
	};
}
