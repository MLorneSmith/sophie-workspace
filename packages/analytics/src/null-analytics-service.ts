import { createServiceLogger } from "@kit/shared/logger";
import type { AnalyticsService } from "./types";

// Initialize service logger
const { getLogger } = createServiceLogger("NULL_ANALYTICS_SERVICE");

const noop = (event: string) => {
	// do nothing - this is to prevent errors when the analytics service is not initialized

	return async (...args: unknown[]) => {
		const logger = await getLogger();
		logger.debug(`Noop analytics service called with event: ${event}`, {
			args: args.filter(Boolean),
		});
	};
};

/**
 * Null analytics service that does nothing. It is initialized with a noop function. This is useful for testing or when
 * the user is calling analytics methods before the analytics service is initialized.
 */
export const NullAnalyticsService: AnalyticsService = {
	initialize: noop("initialize"),
	trackPageView: noop("trackPageView"),
	trackEvent: noop("trackEvent"),
	identify: noop("identify"),
};
