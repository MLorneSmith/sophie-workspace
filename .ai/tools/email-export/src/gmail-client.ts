import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { type gmail_v1, google } from "googleapis";
import type {
	EmailHeader,
	ExportOptions,
	OAuth2Credentials,
	ProgressCallback,
	RawEmail,
	StoredToken,
	ThreadContext,
} from "./types.js";

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_DIR = path.join(
	process.env.HOME ?? process.env.USERPROFILE ?? ".",
	".email-export",
);
const TOKEN_PATH = path.join(TOKEN_DIR, "token.json");

type OAuth2ClientType = InstanceType<typeof google.auth.OAuth2>;

export class GmailClient {
	private oauth2Client: OAuth2ClientType | null = null;
	private gmail: gmail_v1.Gmail | null = null;

	/**
	 * Initialize the Gmail client with OAuth2 authentication
	 */
	async initialize(credentialsPath: string): Promise<void> {
		const credentials = await this.loadCredentials(credentialsPath);
		this.oauth2Client = await this.authorize(credentials);
		this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
	}

	/**
	 * Load OAuth2 credentials from file
	 */
	private async loadCredentials(
		credentialsPath: string,
	): Promise<OAuth2Credentials> {
		const content = await fs.promises.readFile(credentialsPath, "utf-8");
		return JSON.parse(content) as OAuth2Credentials;
	}

	/**
	 * Authorize with stored token or initiate OAuth flow
	 */
	private async authorize(
		credentials: OAuth2Credentials,
	): Promise<OAuth2ClientType> {
		const { client_id, client_secret, redirect_uris } =
			credentials.installed ?? credentials.web ?? {};

		if (!client_id || !client_secret || !redirect_uris) {
			throw new Error("Invalid credentials file format");
		}

		const oauth2Client = new google.auth.OAuth2(
			client_id,
			client_secret,
			redirect_uris[0],
		);

		// Try to load existing token
		try {
			const token = await this.loadStoredToken();
			oauth2Client.setCredentials(token);

			// Check if token needs refresh
			if (token.expiry_date && token.expiry_date < Date.now()) {
				const { credentials: refreshedCredentials } =
					await oauth2Client.refreshAccessToken();
				await this.storeToken(refreshedCredentials as StoredToken);
				oauth2Client.setCredentials(refreshedCredentials);
			}

			return oauth2Client;
		} catch {
			// No valid token, need to authenticate
			return this.getNewToken(oauth2Client);
		}
	}

	/**
	 * Load stored OAuth token
	 */
	private async loadStoredToken(): Promise<StoredToken> {
		const content = await fs.promises.readFile(TOKEN_PATH, "utf-8");
		return JSON.parse(content) as StoredToken;
	}

	/**
	 * Store OAuth token to file
	 */
	private async storeToken(token: StoredToken): Promise<void> {
		await fs.promises.mkdir(TOKEN_DIR, { recursive: true });
		await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(token, null, 2));
	}

	/**
	 * Get new token via OAuth flow
	 */
	private async getNewToken(
		oauth2Client: OAuth2ClientType,
	): Promise<OAuth2ClientType> {
		const authUrl = oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: SCOPES,
		});

		console.log("\nAuthorize this app by visiting this URL:\n");
		console.log(authUrl);
		console.log();

		const code = await this.promptForCode();
		const { tokens } = await oauth2Client.getToken(code);
		oauth2Client.setCredentials(tokens);
		await this.storeToken(tokens as StoredToken);

		return oauth2Client;
	}

	/**
	 * Prompt user for authorization code
	 */
	private promptForCode(): Promise<string> {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		return new Promise((resolve) => {
			rl.question(
				"Enter the authorization code from the page: ",
				(code: string) => {
					rl.close();
					resolve(code.trim());
				},
			);
		});
	}

	/**
	 * Build Gmail search query from options
	 */
	private buildQuery(options: ExportOptions): string {
		const parts: string[] = [];

		if (options.label) {
			parts.push(`label:${options.label}`);
		}

		if (options.query) {
			parts.push(options.query);
		}

		if (options.after) {
			parts.push(`after:${options.after}`);
		}

		if (options.before) {
			parts.push(`before:${options.before}`);
		}

		if (!options.includeSpam) {
			parts.push("-in:spam");
		}

		if (!options.includeTrash) {
			parts.push("-in:trash");
		}

		return parts.join(" ");
	}

	/**
	 * Fetch emails matching the given options
	 */
	async fetchEmails(
		options: ExportOptions,
		onProgress?: ProgressCallback,
	): Promise<RawEmail[]> {
		if (!this.gmail) {
			throw new Error("Gmail client not initialized");
		}

		const emails: RawEmail[] = [];
		let pageToken: string | undefined;
		const query = this.buildQuery(options);
		const maxResults = options.maxResults ?? 100;

		do {
			const response = await this.gmail.users.messages.list({
				userId: "me",
				q: query,
				maxResults: Math.min(maxResults - emails.length, 100),
				pageToken,
			});

			const messages = response.data.messages ?? [];

			for (const message of messages) {
				if (emails.length >= maxResults) break;
				if (!message.id) continue;

				const fullMessage = await this.gmail.users.messages.get({
					userId: "me",
					id: message.id,
					format: "full",
				});

				const rawEmail = fullMessage.data as RawEmail;
				emails.push(rawEmail);

				onProgress?.(emails.length, maxResults, undefined);
			}

			pageToken = response.data.nextPageToken ?? undefined;
		} while (pageToken && emails.length < maxResults);

		return emails;
	}

	/**
	 * Fetch a specific thread by ID
	 */
	async fetchThread(threadId: string): Promise<RawEmail[]> {
		if (!this.gmail) {
			throw new Error("Gmail client not initialized");
		}

		const response = await this.gmail.users.threads.get({
			userId: "me",
			id: threadId,
			format: "full",
		});

		return (response.data.messages ?? []) as RawEmail[];
	}

	/**
	 * Get thread context for an email
	 */
	async getThreadContext(email: RawEmail): Promise<ThreadContext> {
		const threadEmails = await this.fetchThread(email.threadId);
		const position = threadEmails.findIndex((e) => e.id === email.id);

		return {
			threadId: email.threadId,
			position: position + 1,
			totalInThread: threadEmails.length,
			isFirstInThread: position === 0,
			isLastInThread: position === threadEmails.length - 1,
		};
	}

	/**
	 * Extract headers from email payload
	 */
	extractHeaders(email: RawEmail): EmailHeader {
		const headers = email.payload?.headers ?? [];
		const getHeader = (name: string): string => {
			const header = headers.find(
				(h: gmail_v1.Schema$MessagePartHeader) =>
					h.name?.toLowerCase() === name.toLowerCase(),
			);
			return header?.value ?? "";
		};

		return {
			from: getHeader("From"),
			to: getHeader("To"),
			cc: getHeader("Cc") || undefined,
			bcc: getHeader("Bcc") || undefined,
			subject: getHeader("Subject"),
			date: getHeader("Date"),
			messageId: getHeader("Message-ID"),
			inReplyTo: getHeader("In-Reply-To") || undefined,
			references: getHeader("References") || undefined,
		};
	}

	/**
	 * Extract body content from email payload
	 */
	extractBody(email: RawEmail): { plain: string; html: string } {
		const result = { plain: "", html: "" };

		const extractFromPart = (part: gmail_v1.Schema$MessagePart): void => {
			if (part.mimeType === "text/plain" && part.body?.data) {
				result.plain = Buffer.from(part.body.data, "base64").toString("utf-8");
			} else if (part.mimeType === "text/html" && part.body?.data) {
				result.html = Buffer.from(part.body.data, "base64").toString("utf-8");
			}

			if (part.parts) {
				for (const subPart of part.parts) {
					extractFromPart(subPart);
				}
			}
		};

		if (email.payload) {
			extractFromPart(email.payload);
		}

		return result;
	}

	/**
	 * Get label names from label IDs
	 */
	async getLabelNames(labelIds: string[]): Promise<string[]> {
		if (!this.gmail) {
			throw new Error("Gmail client not initialized");
		}

		const response = await this.gmail.users.labels.list({ userId: "me" });
		const labels = response.data.labels ?? [];

		return labelIds
			.map(
				(id) =>
					labels.find((l: gmail_v1.Schema$Label) => l.id === id)?.name ?? id,
			)
			.filter(Boolean);
	}
}

export const gmailClient = new GmailClient();
