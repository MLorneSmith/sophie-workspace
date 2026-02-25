import "server-only";

import { randomUUID } from "node:crypto";
import { BigQuery } from "@google-cloud/bigquery";
import { getLogger } from "@kit/shared/logger";

import type {
	LoopsContactIdentity,
	LoopsWebhookEvent,
} from "~/lib/loops-webhook-types";

const LOOPS_EVENTS_TABLE = "loops_events";
const DEFAULT_BQ_DATASET = "staging";

type LoopsBigQueryRow = {
	event_id: string;
	event_name: string;
	event_time: string;
	webhook_schema_version: string;
	received_at: string;
	raw_json: string;
	contact_id: string | null;
	contact_email: string | null;
	contact_user_id: string | null;
	email_id: string | null;
	email_subject: string | null;
	source_type: string | null;
	campaign_id: string | null;
	loop_id: string | null;
	transactional_id: string | null;
};

type LoopsBigQueryConfig = {
	projectId: string;
	datasetId: string;
	credentialsPath?: string;
};

let bigQueryClient: BigQuery | undefined;

export async function insertLoopsEventToBigQuery(
	event: LoopsWebhookEvent,
): Promise<void> {
	const config = getBigQueryConfig();
	const client = getBigQueryClient(config);
	const row = buildLoopsEventRow(event);

	// Retry with exponential backoff (3 attempts)
	const maxAttempts = 3;
	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			await client
				.dataset(config.datasetId)
				.table(LOOPS_EVENTS_TABLE)
				.insert([row]);
			return; // Success
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt < maxAttempts) {
				// Exponential backoff: 100ms, 200ms
				const delayMs = attempt * 100;
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}
	}

	// All retries failed - persist to dead letter and rethrow
	await persistFailedLoopEvent(event, lastError);
	throw lastError;
}

/**
 * Persist failed events to a dead letter file for later recovery.
 * In production, this could be a durable queue or database table.
 */
async function persistFailedLoopEvent(
	event: LoopsWebhookEvent,
	error: Error | undefined,
): Promise<void> {
	const fs = await import("node:fs/promises");
	const path = await import("node:path");

	const deadLetterDir =
		process.env.LOOPS_DEAD_LETTER_DIR || "/tmp/loops-dead-letter";
	const fileName = `failed-${Date.now()}-${randomUUID()}.json`;
	const filePath = path.join(deadLetterDir, fileName);

	const deadLetterEntry = {
		failedAt: new Date().toISOString(),
		event,
		error: error ? { message: error.message, stack: error.stack } : null,
	};

	try {
		await fs.mkdir(deadLetterDir, { recursive: true });
		await fs.writeFile(filePath, JSON.stringify(deadLetterEntry, null, 2));
	} catch {
		// If dead letter persistence fails, log but don't throw
		const logger = await getLogger();
		logger.error({ filePath }, "Failed to persist dead letter entry");
	}
}

function getBigQueryConfig(): LoopsBigQueryConfig {
	const projectId = process.env.GCP_PROJECT_ID?.trim();

	if (!projectId) {
		throw new Error("Missing required env var: GCP_PROJECT_ID");
	}

	const datasetId =
		process.env.BQ_STAGING_DATASET?.trim() || DEFAULT_BQ_DATASET;
	const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

	return {
		projectId,
		datasetId,
		credentialsPath: credentialsPath || undefined,
	};
}

function getBigQueryClient(config: LoopsBigQueryConfig): BigQuery {
	if (!bigQueryClient) {
		bigQueryClient = new BigQuery({
			projectId: config.projectId,
			keyFilename: config.credentialsPath,
		});
	}

	return bigQueryClient;
}

function buildLoopsEventRow(event: LoopsWebhookEvent): LoopsBigQueryRow {
	const contactIdentity = getContactIdentity(event);
	const eventTime = toIsoTimestamp(event.eventTime);
	const receivedAt = new Date().toISOString();

	return {
		event_id: randomUUID(),
		event_name: event.eventName,
		event_time: eventTime,
		webhook_schema_version: event.webhookSchemaVersion,
		received_at: receivedAt,
		raw_json: JSON.stringify(event),
		contact_id: toNullableString(contactIdentity.id),
		contact_email: toNullableString(contactIdentity.email),
		contact_user_id: toNullableString(contactIdentity.userId),
		email_id: toNullableString(event.email?.id),
		email_subject: truncate(toNullableString(event.email?.subject), 500),
		source_type: toNullableString(event.sourceType),
		campaign_id: toNullableString(event.campaignId),
		loop_id: toNullableString(event.loopId),
		transactional_id: toNullableString(event.transactionalId),
	};
}

function getContactIdentity(
	event: LoopsWebhookEvent,
): Partial<LoopsContactIdentity> {
	if (event.contactIdentity) {
		return event.contactIdentity;
	}

	return {
		id: event.contact?.id ?? null,
		email: event.contact?.email ?? null,
		userId: event.contact?.userId ?? null,
	};
}

function toIsoTimestamp(unixEpoch: number): string {
	const msEpoch = unixEpoch > 10_000_000_000 ? unixEpoch : unixEpoch * 1000;
	return new Date(msEpoch).toISOString();
}

function toNullableString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function truncate(value: string | null, maxLength: number): string | null {
	if (!value) {
		return null;
	}

	return value.slice(0, maxLength);
}
