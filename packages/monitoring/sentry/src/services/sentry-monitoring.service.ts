import type { MonitoringService } from "@kit/monitoring-core";
import {
	captureEvent,
	captureException,
	type Event as SentryEvent,
	type User as SentryUser,
	setUser,
} from "@sentry/nextjs";

/**
 * @class
 * @implements {MonitoringService}
 * ServerSentryMonitoringService is responsible for capturing exceptions and identifying users using the Sentry monitoring service.
 */
export class SentryMonitoringService implements MonitoringService {
	private readonly readyPromise: Promise<unknown>;
	private readyResolver?: (value?: unknown) => void;

	constructor() {
		this.readyPromise = new Promise((resolve) => {
			this.readyResolver = resolve;
		});

		void this.initialize();
	}

	private async initialize() {
		// Resolve the ready promise immediately as Sentry is initialized via environment variables
		this.readyResolver?.();
	}

	async ready() {
		return this.readyPromise;
	}

	captureException(error: Error | null) {
		return captureException(error);
	}

	captureEvent<Extra extends SentryEvent>(event: string, extra?: Extra) {
		return captureEvent({
			message: event,
			...(extra ?? {}),
		});
	}

	identifyUser(user: SentryUser) {
		setUser(user);
	}
}
