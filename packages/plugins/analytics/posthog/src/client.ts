import type { PostHog as ClientPostHog } from "posthog-js";

/**
 * PostHog analytics service that sends events to PostHog in the browser.
 */
export class ClientPostHogImpl {
	private ph: ClientPostHog | undefined;

	constructor(
		private key: string,
		private host: string,
		private ingestUrl?: string,
	) {}

	async initialize() {
		const { posthog } = await import("posthog-js");

		posthog.init(this.key, {
			api_host: this.ingestUrl ?? this.host,
			ui_host: this.host,
			persistence: "localStorage+cookie",
			person_profiles: "always",
			capture_pageview: false,
			capture_pageleave: true,
		});

		this.ph = posthog;
	}

	async identify(userId: string, traits?: Record<string, string>) {
		const client = this.getClient();
		client.identify(userId, traits);
	}

	async trackPageView(url: string) {
		const client = this.getClient();

		client.capture("$pageview", { $current_url: url });
	}

	async trackEvent(
		eventName: string,
		eventProperties?: Record<string, string | string[]>,
	) {
		const client = this.getClient();

		return client.capture(eventName, eventProperties);
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
 * Create a client-side Posthog analytics service.
 */
export function createClientPostHogAnalyticsService() {
	const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
	const url = process.env.NEXT_PUBLIC_POSTHOG_INGESTION_URL;

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

	return new ClientPostHogAnalyticsService(key, host, url);
}

/**
 * Client-side PostHog analytics service wrapper.
 */
class ClientPostHogAnalyticsService {
	private client: ClientPostHogImpl;

	constructor(
		private posthogKey: string,
		private posthogHost: string,
		posthogIngestUrl?: string,
	) {
		this.client = new ClientPostHogImpl(
			posthogKey,
			posthogHost,
			posthogIngestUrl,
		);
	}

	async initialize() {
		this.log("Initializing PostHog analytics service (client)");

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
