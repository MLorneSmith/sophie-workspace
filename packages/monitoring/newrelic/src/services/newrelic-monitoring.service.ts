import { MonitoringService } from "@kit/monitoring-core";
import { createServiceLogger } from "@kit/shared/logger";

/**
 * New Relic monitoring service implementation
 * Integrates with the existing New Relic agent for error tracking and custom events
 */
export class NewRelicMonitoringService extends MonitoringService {
	private newrelic: any;
	private isReady = false;
	private logger = createServiceLogger("NEW-RELIC-MONITORING").getLogger();

	constructor() {
		super();
		this.initializeNewRelic();
	}

	private initializeNewRelic(): void {
		try {
			// Check if New Relic is available (it's loaded via -r flag)
			if (typeof global !== "undefined" && (global as any).newrelic) {
				this.newrelic = (global as any).newrelic;
				this.isReady = true;
			} else if (typeof window === "undefined") {
				// Server-side: Try to require New Relic
				try {
					this.newrelic = require("newrelic");
					this.isReady = true;
				} catch (e) {
					this.logger.warn("New Relic agent not found. Monitoring will be disabled.");
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
		// });
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
		const { id, ...otherInfo } = info;
		Object.entries(otherInfo).forEach(([key, value]) => {
			if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
				this.newrelic.addCustomAttribute(`user.${key}`, value);
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
	startSegment<T>(name: string, callback: () => T | Promise<T>): T | Promise<T> {
		if (!this.isReady || !this.newrelic) {
			return callback();
		}
		
		return this.newrelic.startSegment(name, true, callback);
	}

	/**
	 * Add custom attributes to the current transaction
	 */
	addCustomAttributes(attributes: Record<string, string | number | boolean>): void {
		if (!this.isReady || !this.newrelic) {
			return;
		}

		Object.entries(attributes).forEach(([key, value]) => {
			this.newrelic.addCustomAttribute(key, value);
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