import {
	ConsoleMonitoringService,
	type MonitoringService,
} from "@kit/monitoring-core";
import { createRegistry } from "@kit/shared/registry";
import { createServiceLogger } from "@kit/shared/logger";
import {
	getMonitoringProvider,
	type MonitoringProvider,
} from "../get-monitoring-provider";

// Initialize service logger
const { getLogger } = createServiceLogger("GET_SERVER_MONITORING_SERVICE");

// create a registry for the server monitoring services
const serverMonitoringRegistry = createRegistry<
	MonitoringService,
	NonNullable<MonitoringProvider>
>();

// Register the 'baselime' monitoring service
serverMonitoringRegistry.register("baselime", async () => {
	const { BaselimeServerMonitoringService } = await import(
		"@kit/baselime/server"
	);

	return new BaselimeServerMonitoringService();
});

// Register the 'sentry' monitoring service
serverMonitoringRegistry.register("sentry", async () => {
	const { SentryMonitoringService } = await import("@kit/sentry");

	return new SentryMonitoringService();
});

// Register the 'newrelic' monitoring service
serverMonitoringRegistry.register("newrelic", async () => {
	const { createNewRelicMonitoringService } = await import("@kit/monitoring-newrelic");

	return createNewRelicMonitoringService();
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
		(await getLogger()).info(
			"No instrumentation provider specified. Returning console service...",
		);
		return new ConsoleMonitoringService();
	}

	return serverMonitoringRegistry.get(provider);
}
