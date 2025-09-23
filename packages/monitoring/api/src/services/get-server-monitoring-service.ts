import {
	ConsoleMonitoringService,
	type MonitoringService,
} from "@kit/monitoring-core";
import { createRegistry } from "@kit/shared/registry";

import {
	type MonitoringProvider,
	getMonitoringProvider,
} from "../get-monitoring-provider";

// create a registry for the server monitoring services
const serverMonitoringRegistry = createRegistry<
	MonitoringService,
	NonNullable<MonitoringProvider>
>();

// Register the 'sentry' monitoring service
serverMonitoringRegistry.register("sentry", async () => {
	const { SentryMonitoringService } = await import("@kit/sentry");

	return new SentryMonitoringService();
});

// if you have a new monitoring provider, you can register it here
//

/**
 * @name getServerMonitoringService
 * @description Get the monitoring service based on the MONITORING_PROVIDER environment variable.
 */
export async function getServerMonitoringService() {
	const provider = getMonitoringProvider();

	if (!provider) {
		return new ConsoleMonitoringService();
	}

	return serverMonitoringRegistry.get(provider);
}
