import type { gmail_v1 } from "googleapis";
/**
 * Raw email data from Gmail API
 */
export interface RawEmail {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: gmail_v1.Schema$MessagePart;
    internalDate: string;
    sizeEstimate: number;
}
/**
 * Extracted email header
 */
export interface EmailHeader {
    from: string;
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    date: string;
    messageId: string;
    inReplyTo?: string;
    references?: string;
}
/**
 * Thread context for email sequences
 */
export interface ThreadContext {
    threadId: string;
    position: number;
    totalInThread: number;
    isFirstInThread: boolean;
    isLastInThread: boolean;
}
/**
 * Exported email in YAML-compatible format
 */
export interface ExportedEmail {
    metadata: {
        id: string;
        exportedAt: string;
        source: "gmail";
        labels: string[];
    };
    headers: EmailHeader;
    thread: ThreadContext;
    content: {
        plain: string;
        hasHtml: boolean;
        attachments: AttachmentInfo[];
    };
    annotations: {
        purpose: string;
        tone: string;
        audience: string;
        structuralPatterns: string[];
        rhetoricalDevices: string[];
        notes: string;
    };
}
/**
 * Attachment metadata
 */
export interface AttachmentInfo {
    filename: string;
    mimeType: string;
    size: number;
}
/**
 * CLI export options
 */
export interface ExportOptions {
    label?: string;
    query?: string;
    after?: string;
    before?: string;
    output: string;
    threadId?: string;
    maxResults?: number;
    includeSpam?: boolean;
    includeTrash?: boolean;
}
/**
 * OAuth2 credentials from Google Cloud Console
 */
export interface OAuth2Credentials {
    installed?: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string[];
    };
    web?: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string[];
    };
}
/**
 * Stored OAuth2 token
 */
export interface StoredToken {
    access_token: string;
    refresh_token: string;
    scope: string;
    token_type: string;
    expiry_date: number;
}
/**
 * Export progress callback
 */
export type ProgressCallback = (current: number, total: number, email?: ExportedEmail) => void;
/**
 * Export result summary
 */
export interface ExportResult {
    success: boolean;
    emailsExported: number;
    threadsProcessed: number;
    outputDirectory: string;
    errors: ExportError[];
}
/**
 * Export error details
 */
export interface ExportError {
    emailId?: string;
    threadId?: string;
    message: string;
    code?: string;
}
//# sourceMappingURL=types.d.ts.map