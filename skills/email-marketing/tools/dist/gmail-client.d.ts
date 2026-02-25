import type { EmailHeader, ExportOptions, ProgressCallback, RawEmail, ThreadContext } from "./types.js";
export declare class GmailClient {
    private oauth2Client;
    private gmail;
    /**
     * Initialize the Gmail client with OAuth2 authentication
     */
    initialize(credentialsPath: string): Promise<void>;
    /**
     * Load OAuth2 credentials from file
     */
    private loadCredentials;
    /**
     * Authorize with stored token or initiate OAuth flow
     */
    private authorize;
    /**
     * Load stored OAuth token
     */
    private loadStoredToken;
    /**
     * Store OAuth token to file
     */
    private storeToken;
    /**
     * Get new token via OAuth flow
     */
    private getNewToken;
    /**
     * Prompt user for authorization code
     */
    private promptForCode;
    /**
     * Build Gmail search query from options
     */
    private buildQuery;
    /**
     * Fetch emails matching the given options
     */
    fetchEmails(options: ExportOptions, onProgress?: ProgressCallback): Promise<RawEmail[]>;
    /**
     * Fetch a specific thread by ID
     */
    fetchThread(threadId: string): Promise<RawEmail[]>;
    /**
     * Get thread context for an email
     */
    getThreadContext(email: RawEmail): Promise<ThreadContext>;
    /**
     * Extract headers from email payload
     */
    extractHeaders(email: RawEmail): EmailHeader;
    /**
     * Extract body content from email payload
     */
    extractBody(email: RawEmail): {
        plain: string;
        html: string;
    };
    /**
     * Get label names from label IDs
     */
    getLabelNames(labelIds: string[]): Promise<string[]>;
}
export declare const gmailClient: GmailClient;
//# sourceMappingURL=gmail-client.d.ts.map