import type { MonitoringService } from "@kit/monitoring-core";
import { z } from "zod";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("BASELIME_SERVER_MONITORING_SERVICE");

const apiKey = z
	.string({
		required_error: "NEXT_PUBLIC_BASELIME_KEY is required",
		description: "The Baseline API key",
	})
	.parse(process.env.NEXT_PUBLIC_BASELIME_KEY);

export class BaselimeServerMonitoringService implements MonitoringService {
	userId: string | null = null;

	async captureException(
		error: Error | null,
		extra?: {
			requestId?: string;
			sessionId?: string;
			namespace?: string;
			service?: string;
		},
	) {
		const formattedError = error ? getFormattedError(error) : {};

		const event = {
			level: "error",
			data: { error },
			error: {
				...formattedError,
			},
			message: error ? `${error.name}: ${error.message}` : "Unknown error",
		};

		const response = await fetch("https://events.baselime.io/v1/logs", {
			method: "POST",
			headers: {
				contentType: "application/json",
				"x-api-key": apiKey,
				"x-service": extra?.service ?? "",
				"x-namespace": extra?.namespace ?? "",
			},
			body: JSON.stringify([
				{
					userId: this.userId,
					sessionId: extra?.sessionId,
					namespace: extra?.namespace,
					...event,
				},
			]),
		});

		if (!response.ok) {
			/* TODO: Async logger needed */ logger.error({
					response, { arg1: event, arg2: }, arg3: "Failed to send event to Baselime", arg4:  });
		}
	}

	async captureEvent<
		Extra extends {
			sessionId?: string;
			namespace?: string;
			service?: string;
		},
	>(event: string, extra?: Extra) {
		const response = await fetch("https://events.baselime.io/v1/logs", {
			method: "POST",
			headers: {
				contentType: "application/json",
				"x-api-key": apiKey,
				"x-service": extra?.service ?? "",
				"x-namespace": extra?.namespace ?? "",
			},
			body: JSON.stringify([
				{
					userId: this.userId,
					sessionId: extra?.sessionId,
					namespace: extra?.namespace,
					message: event,
				},
			]),
		});

		if (!response.ok) {
			/* TODO: Async logger needed */ logger.error({
					response, { arg1: event, arg2: }, arg3: "Failed to send event to Baselime", arg4:  });
		}
	}

	identifyUser<Info extends { id: string }>(info: Info) {
		this.userId = info.id;
	}

	ready() {
		return Promise.resolve();
	}
}

function getFormattedError(error: Error) {
	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
	};
}
