import "server-only";

import { getLogger } from "@kit/shared/logger";
import type { TransactionalVariables } from "loops";

import { getLoopsClient } from "./client";
import {
	LoopsEventSchema,
	TransactionalEmailSchema,
} from "./schemas/loops.schema";
import type {
	LoopsEventParams,
	LoopsServiceResult,
	TransactionalEmailParams,
} from "./types";

export function createLoopsService() {
	return new LoopsService();
}

class LoopsService {
	async sendTransactionalEmail(
		params: TransactionalEmailParams,
	): Promise<LoopsServiceResult> {
		const logger = await getLogger();
		const ctx = { name: "LoopsService.sendTransactionalEmail" };

		try {
			const validated = TransactionalEmailSchema.parse(params);
			const client = getLoopsClient();

			await client.sendTransactionalEmail({
				transactionalId: validated.transactionalId,
				email: validated.email,
				addToAudience: validated.addToAudience,
				dataVariables: validated.dataVariables as TransactionalVariables,
			});

			logger.info(ctx, "Loops transactional email sent successfully");

			return { success: true };
		} catch (error) {
			logger.error(
				{
					...ctx,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to send Loops transactional email",
			);

			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async sendEvent(params: LoopsEventParams): Promise<LoopsServiceResult> {
		const logger = await getLogger();
		const ctx = { name: "LoopsService.sendEvent" };

		try {
			const validated = LoopsEventSchema.parse(params);
			const client = getLoopsClient();

			const response = await client.sendEvent({
				eventName: validated.eventName,
				email: validated.email,
				userId: validated.userId,
				contactProperties: validated.contactProperties as
					| Record<string, string | number | boolean | null>
					| undefined,
				eventProperties: validated.eventProperties as
					| Record<string, string | number | boolean>
					| undefined,
			});

			if (!response.success) {
				logger.warn(
					{ ...ctx, eventName: validated.eventName },
					"Loops event send failed",
				);

				return { success: false, error: "Loops API returned failure" };
			}

			logger.info(
				{ ...ctx, eventName: validated.eventName },
				"Loops event sent successfully",
			);

			return { success: true };
		} catch (error) {
			logger.error(
				{
					...ctx,
					eventName: params.eventName,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to send Loops event",
			);

			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}
