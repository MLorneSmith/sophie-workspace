import type { MonitoringService } from "@kit/monitoring-core";

export class ConsoleMonitoringService implements MonitoringService {
	identifyUser<Info extends { id: string }>(data: Info) {
		// biome-ignore lint/suspicious/noConsole: Console monitoring service uses console directly
		console.info("[Console Monitoring] Identified user", data);
	}

	captureException<
		Extra extends Record<string, unknown>,
		Config extends Record<string, unknown>,
	>(
		error: Error & { digest?: string },
		extra?: Extra,
		config?: Config,
	): unknown {
		// biome-ignore lint/suspicious/noConsole: Console monitoring service uses console directly
		console.error(
			"[Console Monitoring] Caught exception:",
			error,
			extra,
			config,
		);
		return undefined;
	}

	captureEvent<Extra extends object>(event: string, extra?: Extra) {
		// biome-ignore lint/suspicious/noConsole: Console monitoring service uses console directly
		console.info("[Console Monitoring] Captured event:", event, extra);
	}

	ready() {
		return Promise.resolve();
	}
}
