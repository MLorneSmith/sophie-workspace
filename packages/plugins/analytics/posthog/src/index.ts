/**
 * Client-side PostHog analytics exports.
 *
 * For server-side analytics, import from "@kit/posthog/server" instead.
 */
export {
	createClientPostHogAnalyticsService as createPostHogAnalyticsService,
	ClientPostHogImpl,
} from "./client";
