import "server-only";

import type { PostHog as ServerPostHog } from "posthog-node";

/**
 * PostHog analytics service that sends events to PostHog on the server.
 */
export class ServerPostHogImpl {
	private ph: ServerPostHog | undefined;
	private userId?: string;

	constructor(
		private key: string,
		private host: string,
	) {}

	async initialize() {
		const { PostHog } = await import("posthog-node");

		this.ph = new PostHog(this.key, {
			host: this.host,
			flushAt: 1,
			flushInterval: 0,
		});
	}

	async identify(userId: string, traits?: Record<string, string>) {
		this.userId = userId;

		this.getClient().capture({
			event: "$identify",
			distinctId: userId,
			properties: traits,
		});
	}

	async trackPageView(url: string) {
		if (!this.userId) {
			this.log("User ID not set, skipping page view tracking");
			return;
		}

		this.getClient().capture({
			event: "$pageview",
			distinctId: this.userId,
			properties: { $current_url: url },
		});
	}

	async trackEvent(
		eventName: string,
		eventProperties?: Record<string, string | string[]>,
	) {
		const client = this.getClient();

		if (!this.userId) {
			throw new Error(
				"Please identify the user using the identify method before tracking events",
			);
		}

		client.capture({
			event: eventName,
			distinctId: this.userId,
			properties: eventProperties,
		});

		await client.shutdown();
	}

	log(..._args: unknown[]) {
		if (process.env.NODE_ENV === "development") {
			// TODO: Async logger needed
		}
	}

	private getClient() {
		if (!this.ph) {
			throw new Error("PostHog client not initialized");
		}

		return this.ph;
	}
}

/**
 * Create a server-side Posthog analytics service.
 */
export function createServerPostHogAnalyticsService() {
	const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

	if (!key) {
		throw new Error(
			"NEXT_PUBLIC_POSTHOG_KEY is not set. Please set the environment variable.",
		);
	}

	if (!host) {
		throw new Error(
			"NEXT_PUBLIC_POSTHOG_HOST is not set. Please set the environment variable.",
		);
	}

	return new ServerPostHogAnalyticsService(key, host);
}

/**
 * Server-side PostHog analytics service wrapper.
 */
class ServerPostHogAnalyticsService {
	private client: ServerPostHogImpl;

	constructor(
		private posthogKey: string,
		private posthogHost: string,
	) {
		this.client = new ServerPostHogImpl(posthogKey, posthogHost);
	}

	async initialize() {
		this.log("Initializing PostHog analytics service (server)");

		if (!this.posthogKey || !this.posthogHost) {
			this.log("PostHog key or host not provided, skipping initialization");
			return;
		}

		return this.client.initialize();
	}

	async identify(userId: string, traits?: Record<string, string>) {
		this.log(`Identifying user ${userId} with traits:`, traits);
		return this.client.identify(userId, traits);
	}

	async trackPageView(url: string) {
		this.log(`Tracking page view for URL: ${url}`);
		return this.client.trackPageView(url);
	}

	async trackEvent(
		eventName: string,
		eventProperties?: Record<string, string | string[]>,
	) {
		this.log(`Tracking event ${eventName} with properties:`, eventProperties);
		return this.client.trackEvent(eventName, eventProperties);
	}

	private log(...args: unknown[]) {
		this.client.log(...args);
	}
}
