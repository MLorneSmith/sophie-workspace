import { enhanceRouteHandler } from "@kit/next/routes";
import { getLogger } from "@kit/shared/logger";
import { createHmac, timingSafeEqual } from "node:crypto";

import { insertLoopsEventToBigQuery } from "~/lib/loops-bigquery";
import type {
	LoopsWebhookEvent,
	WebhookVerificationError,
} from "~/lib/loops-webhook-types";

const WEBHOOK_NAME = "webhooks.loops";
const WEBHOOK_SECRET_PREFIX = "whsec_";

export const runtime = "nodejs";

export const GET = enhanceRouteHandler(
	async () => {
		return Response.json({
			ok: true,
			name: WEBHOOK_NAME,
			timestamp: new Date().toISOString(),
		});
	},
	{
		auth: false,
	},
);

export const POST = enhanceRouteHandler(
	async ({ request }) => {
		const logger = await getLogger();
		const ctx = { name: WEBHOOK_NAME };
		const rawBody = await request.text();

		let event: LoopsWebhookEvent;

		try {
			verifyLoopsWebhookSignature(request.headers, rawBody);
			event = parseLoopsWebhookEvent(rawBody);
		} catch (error) {
			logger.warn({ ...ctx, error }, "Failed to verify Loops webhook request");

			const status =
				isWebhookVerificationError(error) && error.code === "invalid_payload"
					? 400
					: 401;

			return new Response("Invalid webhook request", { status });
		}

		if (event.eventName === "testing.testEvent") {
			logger.info(ctx, "Received Loops test webhook event");
			return new Response("OK", { status: 200 });
		}

		try {
			await insertLoopsEventToBigQuery(event);
			logger.info({ ...ctx, eventName: event.eventName }, "Stored Loops event");
		} catch (error) {
			logger.error(
				{ ...ctx, eventName: event.eventName, error },
				"Failed to store Loops event in BigQuery",
			);
			// Return 500 so Loops knows to retry
			return new Response("Failed to store Loops event", { status: 500 });
		}

		return new Response("OK", { status: 200 });
	},
	{
		auth: false,
	},
);

class LoopsWebhookVerificationError
	extends Error
	implements WebhookVerificationError
{
	constructor(
		public readonly code: WebhookVerificationError["code"],
		message: string,
	) {
		super(message);
		this.name = "WebhookVerificationError";
	}
}

function parseLoopsWebhookEvent(rawBody: string): LoopsWebhookEvent {
	let parsedEvent: unknown;

	try {
		parsedEvent = JSON.parse(rawBody);
	} catch {
		throw new LoopsWebhookVerificationError(
			"invalid_payload",
			"Webhook payload is not valid JSON",
		);
	}

	if (!isRecord(parsedEvent)) {
		throw new LoopsWebhookVerificationError(
			"invalid_payload",
			"Webhook payload must be an object",
		);
	}

	if (typeof parsedEvent.eventName !== "string") {
		throw new LoopsWebhookVerificationError(
			"invalid_payload",
			"Webhook payload is missing eventName",
		);
	}

	if (typeof parsedEvent.eventTime !== "number") {
		throw new LoopsWebhookVerificationError(
			"invalid_payload",
			"Webhook payload is missing eventTime",
		);
	}

	if (typeof parsedEvent.webhookSchemaVersion !== "string") {
		throw new LoopsWebhookVerificationError(
			"invalid_payload",
			"Webhook payload is missing webhookSchemaVersion",
		);
	}

	return parsedEvent as LoopsWebhookEvent;
}

function verifyLoopsWebhookSignature(headers: Headers, rawBody: string): void {
	const webhookId = headers.get("webhook-id");
	const webhookTimestamp = headers.get("webhook-timestamp");
	const webhookSignatureHeader = headers.get("webhook-signature");

	if (!webhookId || !webhookTimestamp || !webhookSignatureHeader) {
		throw new LoopsWebhookVerificationError(
			"missing_headers",
			"Missing Loops webhook signature headers",
		);
	}

	// Check timestamp freshness to prevent replay attacks
	const timestampValue = Number.parseInt(webhookTimestamp, 10);
	if (Number.isNaN(timestampValue)) {
		throw new LoopsWebhookVerificationError(
			"invalid_timestamp",
			"Webhook timestamp is not a valid number",
		);
	}

	const timestampAgeSeconds = Math.abs(Date.now() / 1000 - timestampValue);
	const maxAgeSeconds = 5 * 60; // 5 minutes tolerance

	if (timestampAgeSeconds > maxAgeSeconds) {
		throw new LoopsWebhookVerificationError(
			"timestamp_too_old",
			`Webhook timestamp is too old (${Math.round(timestampAgeSeconds)}s)`,
		);
	}

	const signingSecret = process.env.LOOPS_SIGNING_SECRET;

	if (!signingSecret) {
		throw new LoopsWebhookVerificationError(
			"missing_secret",
			"LOOPS_SIGNING_SECRET is not configured",
		);
	}

	if (!signingSecret.startsWith(WEBHOOK_SECRET_PREFIX)) {
		throw new LoopsWebhookVerificationError(
			"invalid_secret",
			"LOOPS_SIGNING_SECRET must start with whsec_",
		);
	}

	const secretKey = Buffer.from(
		signingSecret.slice(WEBHOOK_SECRET_PREFIX.length),
		"base64",
	);

	if (secretKey.length === 0) {
		throw new LoopsWebhookVerificationError(
			"invalid_secret",
			"LOOPS_SIGNING_SECRET does not contain a valid base64 key",
		);
	}

	const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
	const expectedSignature = createHmac("sha256", secretKey)
		.update(signedContent)
		.digest();

	const signatureMatches = webhookSignatureHeader
		.trim()
		.split(/\s+/)
		.some((token) => {
			const [version, signatureValue] = token.split(",", 2);

			if (version !== "v1" || !signatureValue) {
				return false;
			}

			const providedSignature = Buffer.from(signatureValue, "base64");

			if (providedSignature.length !== expectedSignature.length) {
				return false;
			}

			return timingSafeEqual(expectedSignature, providedSignature);
		});

	if (!signatureMatches) {
		throw new LoopsWebhookVerificationError(
			"invalid_signature",
			"Loops webhook signature verification failed",
		);
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isWebhookVerificationError(
	error: unknown,
): error is WebhookVerificationError {
	return (
		error instanceof Error &&
		"code" in error &&
		typeof (error as { code: unknown }).code === "string"
	);
}
