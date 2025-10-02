import type { Page } from "@playwright/test";
import { parse } from "node-html-parser";

// Type declaration for process.env
declare const process: {
	env: {
		DEBUG?: string;
	};
	stdout: {
		write: (message: string) => void;
	};
};

type EmailAddress = {
	Name: string;
	Address: string;
};

type MessageSummary = {
	ID: string;
	MessageID: string;
	Read: boolean;
	From: EmailAddress;
	To: Array<EmailAddress>;
	Cc: Array<EmailAddress>;
	Bcc: Array<EmailAddress>;
	ReplyTo: Array<EmailAddress>;
	Subject: string;
	Created: string;
	Tags: Array<string>;
	Size: number;
	Attachments: number;
	Snippet: string;
};

type MessagesResponse = {
	total: number;
	unread: number;
	count: number;
	messages_count: number;
	start: number;
	tags: Array<string>;
	messages: MessageSummary[];
};

/**
 * Mailbox class for interacting with the Mailpit mailbox API.
 */
export class Mailbox {
	static URL = "http://127.0.0.1:54324";

	constructor(private readonly page: Page) {}

	async visitMailbox(
		email: string,
		params: {
			deleteAfter: boolean;
			subject?: string;
		},
	) {
		// Only log in debug mode to avoid Biome linting errors
		if (process.env.DEBUG) {
			process.stdout.write(`Visiting mailbox ${email} ...\n`);
		}

		if (!email) {
			throw new Error("Invalid email");
		}

		const json = await this.getEmail(email, params);

		if (!json) {
			throw new Error("Email body was not found");
		}

		// Only log in debug mode to avoid Biome linting errors
		if (process.env.DEBUG) {
			process.stdout.write(
				`Email found for email: ${email} - ID: ${json.ID}, Subject: ${json.Subject}, Date: ${json.Date}, To: ${json.To[0]?.Address}\n`,
			);
		}

		if (email !== json.To[0]?.Address) {
			throw new Error(
				`Email address mismatch. Expected ${email}, got ${json.To[0]?.Address}`,
			);
		}

		const el = parse(json.HTML);

		const linkHref = el.querySelector("a")?.getAttribute("href");

		if (!linkHref) {
			throw new Error("No link found in email");
		}

		// TODO: Async logger needed

		return this.page.goto(linkHref);
	}

	/**
	 * Retrieves an OTP code from an email
	 * @param email The email address to check for the OTP
	 * @param deleteAfter Whether to delete the email after retrieving the OTP
	 * @returns The OTP code
	 */
	async getOtpFromEmail(email: string, deleteAfter = false) {
		// TODO: Async logger needed

		if (!email) {
			throw new Error("Invalid email");
		}

		const json = await this.getEmail(email, {
			deleteAfter,
			subject: "One-time password for",
		});

		if (!json) {
			throw new Error("Email body was not found");
		}

		if (email !== json.To[0]?.Address) {
			throw new Error(
				`Email address mismatch. Expected ${email}, got ${json.To[0]?.Address}`,
			);
		}

		const text = json.HTML.match(/Your one-time password is: (\d{6})/)?.[1];

		if (text) {
			// TODO: Async logger needed
			return text;
		}

		throw new Error("Could not find OTP code in email");
	}

	async getEmail(
		email: string,
		params: {
			deleteAfter: boolean;
			subject?: string;
		},
	) {
		// TODO: Async logger needed

		const url = `${Mailbox.URL}/api/v1/search?query=to:${email}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch emails: ${response.statusText}`);
		}

		const messagesResponse = (await response.json()) as MessagesResponse;

		if (!messagesResponse || !messagesResponse.messages?.length) {
			// TODO: Async logger needed

			return;
		}

		const message = params.subject
			? (() => {
					const filtered = messagesResponse.messages.filter((item) => {
						if (!params.subject) return false;
						return item.Subject.indexOf(params.subject) !== -1;
					});

					// TODO: Async logger needed

					// retrieve the latest by timestamp
					return filtered.reduce((acc, item) => {
						if (
							new Date(acc.Created).getTime() < new Date(item.Created).getTime()
						) {
							return item;
						}

						return acc;
					});
				})()
			: messagesResponse.messages.reduce((acc, item) => {
					if (
						new Date(acc.Created).getTime() < new Date(item.Created).getTime()
					) {
						return item;
					}

					return acc;
				});

		if (!message) {
			throw new Error("No message found");
		}

		const messageId = message.ID;
		const messageUrl = `${Mailbox.URL}/api/v1/message/${messageId}`;

		const messageResponse = await fetch(messageUrl);

		if (!messageResponse.ok) {
			throw new Error(`Failed to fetch email: ${messageResponse.statusText}`);
		}

		// delete message
		if (params.deleteAfter) {
			// TODO: Async logger needed

			const res = await fetch(`${Mailbox.URL}/api/v1/messages`, {
				method: "DELETE",
				body: JSON.stringify({ Ids: [messageId] }),
			});

			if (!res.ok) {
				// TODO: Async logger needed
			}
		}

		return (await messageResponse.json()) as Promise<{
			ID: string;
			MessageID: string;
			From: EmailAddress;
			To: Array<EmailAddress>;
			Cc: Array<EmailAddress>;
			Bcc: Array<EmailAddress>;
			ReplyTo: Array<EmailAddress>;
			ReturnPath: string;
			Subject: string;
			ListUnsubscribe: {
				Header: string;
				Links: Array<string>;
				Errors: string;
				HeaderPost: string;
			};
			Date: string;
			Tags: Array<string>;
			Text: string;
			HTML: string;
			Size: number;
			Inline: Array<unknown>;
			Attachments: Array<unknown>;
		}>;
	}
}
