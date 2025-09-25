import { MonitoringService } from "@kit/monitoring-core";
import { createServiceLogger } from "@kit/shared/logger";

// Type definition for New Relic agent methods we use
interface NewRelicAgent {
	noticeError(error: Error, customAttributes?: Record<string, unknown>): void;
	recordCustomEvent(
		eventType: string,
		attributes: Record<string, unknown>,
	): void;
	setUserID(id: string): void;
	addCustomAttribute(key: string, value: string | number | boolean): void;
	startSegment<T>(
		name: string,
		record: boolean,
		callback: () => T | Promise<T>,
	): T | Promise<T>;
	recordMetric(name: string, value: number): void;
}

// Extend global object to include newrelic
declare global {
	var newrelic: NewRelicAgent | undefined;
}

/**
 * New Relic monitoring service implementation
 * Integrates with the existing New Relic agent for error tracking and custom events
 */
export class NewRelicMonitoringService extends MonitoringService {
	private newrelic: NewRelicAgent | undefined;
	private isReady = false;
	private logger = createServiceLogger("NEW-RELIC-MONITORING").getLogger();

	constructor() {
		super();
		this.initializeNewRelic();
	}

	private initializeNewRelic(): void {
		try {
			// Check if New Relic is available (it's loaded via -r flag)
			if (typeof global !== "undefined" && global.newrelic) {
				this.newrelic = global.newrelic;
				this.isReady = true;
			} else if (typeof window === "undefined") {
				// Server-side: Try to check for New Relic without dynamic imports
				// New Relic should be loaded via NODE_OPTIONS='-r newrelic' in production
				// For Edge Runtime compatibility, we cannot use dynamic imports or eval
				if ("newrelic" in globalThis) {
					// biome-ignore lint/suspicious/noExplicitAny: globalThis type doesn't include newrelic
					this.newrelic = (globalThis as any).newrelic as NewRelicAgent;
					this.isReady = true;
				} else {
					this.logger.warn(
						"New Relic agent not found. Ensure it's loaded via NODE_OPTIONS='-r newrelic'",
					);
				}
			}
		} catch (error) {
			this.logger.warn("Failed to initialize New Relic monitoring", { error });
		}
	}

	captureException<Extra extends object>(
		error: Error & { digest?: string },
		extra?: Extra,
	): void {
		if (!this.isReady || !this.newrelic) {
			this.logger.error("New Relic not available for error capture", { error });
			return;
		}

		// New Relic automatically captures errors, but we can add custom attributes
		this.newrelic.noticeError(error, {
			...extra,
			digest: error.digest,
			timestamp: new Date().toISOString(),
		});
	}

	captureEvent<Extra extends object>(event: string, extra?: Extra): void {
		if (!this.isReady || !this.newrelic) {
			this.logger.debug("New Relic not available for event", { event });
			return;
		}

		// Record custom event in New Relic
		this.newrelic.recordCustomEvent("ApplicationEvent", {
			eventName: event,
			timestamp: new Date().toISOString(),
			...extra,
		});
	}

	identifyUser<Info extends { id: string }>(info: Info): void {
		if (!this.isReady || !this.newrelic) {
			return;
		}

		// Set user attributes for all transactions
		this.newrelic.setUserID(info.id);

		// Add additional user attributes if provided
		const { id: _id, ...otherInfo } = info;
		const newrelic = this.newrelic;
		Object.entries(otherInfo).forEach(([key, value]) => {
			if (
				typeof value === "string" ||
				typeof value === "number" ||
				typeof value === "boolean"
			) {
				newrelic.addCustomAttribute(`user.${key}`, value);
			}
		});
	}

	async ready(): Promise<boolean> {
		// New Relic is synchronously loaded, so we can return immediately
		return Promise.resolve(this.isReady);
	}

	/**
	 * Additional New Relic specific methods
	 */

	/**
	 * Start a custom segment for timing operations
	 */
	startSegment<T>(
		name: string,
		callback: () => T | Promise<T>,
	): T | Promise<T> {
		if (!this.isReady || !this.newrelic) {
			return callback();
		}

		return this.newrelic.startSegment(name, true, callback);
	}

	/**
	 * Add custom attributes to the current transaction
	 */
	addCustomAttributes(
		attributes: Record<string, string | number | boolean>,
	): void {
		if (!this.isReady || !this.newrelic) {
			return;
		}

		const newrelic = this.newrelic;
		Object.entries(attributes).forEach(([key, value]) => {
			newrelic.addCustomAttribute(key, value);
		});
	}

	/**
	 * Record a custom metric
	 */
	recordMetric(name: string, value: number): void {
		if (!this.isReady || !this.newrelic) {
			return;
		}

		this.newrelic.recordMetric(name, value);
	}
}

/**
 * Factory function to create a New Relic monitoring service
 */
export function createNewRelicMonitoringService(): MonitoringService {
	return new NewRelicMonitoringService();
}
