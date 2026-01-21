import "server-only";

import { createServerPostHogAnalyticsService as createPostHogAnalyticsService } from "@kit/posthog/server";

import { createAnalyticsManager } from "./analytics-manager";
import { NullAnalyticsService } from "./null-analytics-service";
import type { AnalyticsProviderFactory } from "./types";

// Use PostHog if configured, otherwise fall back to null service
const hasPostHogConfig =
	process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST;

const providers: Record<
	string,
	AnalyticsProviderFactory<object>
> = hasPostHogConfig
	? { posthog: createPostHogAnalyticsService }
	: { null: () => NullAnalyticsService };

export const analytics = createAnalyticsManager({ providers });
