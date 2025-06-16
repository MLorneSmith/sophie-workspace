import type { MonitoringService } from "@kit/monitoring-core";

export class ConsoleMonitoringService implements MonitoringService {
	identifyUser(data: { id: string }) {
		// biome-ignore lint/suspicious/noConsole: Console monitoring service uses console directly
		console.info("[Console Monitoring] Identified user", data);
	}

	captureException(error: Error) {
		// biome-ignore lint/suspicious/noConsole: Console monitoring service uses console directly
		console.error("[Console Monitoring] Caught exception:", error);
	}

	captureEvent(event: string, extra?: Record<string, unknown>) {
		// biome-ignore lint/suspicious/noConsole: Console monitoring service uses console directly
		console.info("[Console Monitoring] Captured event:", event, extra);
	}

	ready() {
		return Promise.resolve();
	}
}
