"use server";

import { createLoopsService } from "@kit/loops";
import { getLogger } from "@kit/shared/logger";

export async function sendUserSignedUpEvent(params: {
	email: string;
	userId: string;
	firstName: string;
}) {
	const logger = await getLogger();

	try {
		const loopsService = createLoopsService();

		await loopsService.sendEvent({
			email: params.email,
			userId: params.userId,
			eventName: "userSignedUp",
			contactProperties: {
				firstName: params.firstName,
			},
		});
	} catch (error) {
		logger.error(
			{
				name: "sendUserSignedUpEvent",
				userId: params.userId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to send userSignedUp event to Loops",
		);
	}
}
