import { z } from "zod";

import type { DatabaseWebhookVerifierService } from "./database-webhook-verifier.service";

const webhooksSecret = z
	.string()
	.describe("The secret used to verify the webhook signature")
	.min(1, {
		message:
			"Provide the variable SUPABASE_DB_WEBHOOK_SECRET. This is used to authenticate the webhook event from Supabase.",
	})
	.parse(process.env.SUPABASE_DB_WEBHOOK_SECRET);

export function createDatabaseWebhookVerifierService() {
	return new PostgresDatabaseWebhookVerifierService();
}

class PostgresDatabaseWebhookVerifierService
	implements DatabaseWebhookVerifierService
{
	verifySignatureOrThrow(header: string) {
		if (header !== webhooksSecret) {
			throw new Error("Invalid signature");
		}

		return Promise.resolve(true);
	}
}
