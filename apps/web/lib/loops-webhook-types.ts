export type LoopsEventName =
	| "contact.created"
	| "contact.updated"
	| "contact.deleted"
	| "contact.unsubscribed"
	| "contact.mailingList.subscribed"
	| "contact.mailingList.unsubscribed"
	| "campaign.email.sent"
	| "loop.email.sent"
	| "transactional.email.sent"
	| "email.delivered"
	| "email.hardBounced"
	| "email.softBounced"
	| "email.complained"
	| "email.opened"
	| "email.clicked"
	| "email.unsubscribed";

export interface LoopsContactIdentity {
	id: string | null;
	email: string | null;
	userId: string | null;
}

export interface LoopsWebhookEvent {
	eventName: LoopsEventName | "testing.testEvent";
	eventTime: number;
	webhookSchemaVersion: string;
	contactIdentity?: LoopsContactIdentity | null;
	contact?: {
		id?: string | null;
		email?: string | null;
		userId?: string | null;
		[key: string]: unknown;
	} | null;
	email?: {
		id?: string | null;
		subject?: string | null;
		[key: string]: unknown;
	} | null;
	sourceType?: string | null;
	campaignId?: string | null;
	loopId?: string | null;
	transactionalId?: string | null;
	[key: string]: unknown;
}

export interface WebhookVerificationError extends Error {
	code:
		| "missing_headers"
		| "missing_secret"
		| "invalid_secret"
		| "invalid_signature"
		| "invalid_payload"
		| "invalid_timestamp"
		| "timestamp_too_old";
}
