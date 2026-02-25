/**
 * Client-side PostHog analytics exports.
 *
 * For server-side analytics, import from "@kit/posthog/server" instead.
 */
export {
	ClientPostHogImpl,
	createClientPostHogAnalyticsService as createPostHogAnalyticsService,
} from "./client";
