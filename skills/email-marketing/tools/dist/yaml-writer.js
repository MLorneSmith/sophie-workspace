import * as fs from "node:fs";
import * as path from "node:path";
import { stringify } from "yaml";
/**
 * Generate a safe filename from email metadata
 */
function generateFilename(email) {
    const date = new Date(email.headers.date);
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = date.toTimeString().split(" ")[0].replace(/:/g, "");
    // Create slug from subject
    const subjectSlug = email.headers.subject
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 50);
    return `${dateStr}_${timeStr}_${subjectSlug || "no-subject"}.yaml`;
}
/**
 * Format email data for YAML output
 */
function formatForYaml(email, includeEmptyAnnotations) {
    const output = {
        metadata: {
            id: email.metadata.id,
            exportedAt: email.metadata.exportedAt,
            source: email.metadata.source,
            labels: email.metadata.labels,
        },
        headers: {
            from: email.headers.from,
            to: email.headers.to,
            subject: email.headers.subject,
            date: email.headers.date,
            messageId: email.headers.messageId,
        },
        thread: {
            threadId: email.thread.threadId,
            position: email.thread.position,
            totalInThread: email.thread.totalInThread,
            isFirstInThread: email.thread.isFirstInThread,
            isLastInThread: email.thread.isLastInThread,
        },
        content: {
            body: email.content.plain,
            hasHtml: email.content.hasHtml,
        },
    };
    // Add optional headers if present
    if (email.headers.cc) {
        output.headers.cc = email.headers.cc;
    }
    if (email.headers.inReplyTo) {
        output.headers.inReplyTo =
            email.headers.inReplyTo;
    }
    if (email.headers.references) {
        output.headers.references =
            email.headers.references;
    }
    // Add attachments if present
    if (email.content.attachments.length > 0) {
        output.content.attachments =
            email.content.attachments;
    }
    // Add annotations section (empty for user to fill in)
    if (includeEmptyAnnotations) {
        output.annotations = {
            purpose: "",
            tone: "",
            audience: "",
            structuralPatterns: [],
            rhetoricalDevices: [],
            notes: "",
        };
    }
    return output;
}
/**
 * Write a single email to YAML file
 */
export async function writeEmailToYaml(email, options) {
    const { outputDir, includeEmptyAnnotations = true } = options;
    // Ensure output directory exists
    await fs.promises.mkdir(outputDir, { recursive: true });
    const filename = generateFilename(email);
    const filepath = path.join(outputDir, filename);
    const formatted = formatForYaml(email, includeEmptyAnnotations);
    const yamlContent = stringify(formatted, {
        lineWidth: 0, // Disable line wrapping for content
        defaultStringType: "QUOTE_DOUBLE",
        defaultKeyType: "PLAIN",
        nullStr: "",
    });
    // Add header comment
    const header = `# Email Export - ${email.headers.subject}
# Exported from Gmail on ${email.metadata.exportedAt}
# Fill in the annotations section to capture writing style patterns
---
`;
    await fs.promises.writeFile(filepath, header + yamlContent, "utf-8");
    return filepath;
}
/**
 * Write multiple emails to YAML files
 */
export async function writeEmailsToYaml(emails, options, onProgress) {
    const errors = [];
    const writtenPaths = [];
    const threadIds = new Set();
    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        threadIds.add(email.thread.threadId);
        try {
            const filepath = await writeEmailToYaml(email, options);
            writtenPaths.push(filepath);
            onProgress?.(i + 1, emails.length, filepath);
        }
        catch (error) {
            errors.push({
                emailId: email.metadata.id,
                threadId: email.thread.threadId,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    return {
        success: errors.length === 0,
        emailsExported: writtenPaths.length,
        threadsProcessed: threadIds.size,
        outputDirectory: options.outputDir,
        errors,
    };
}
/**
 * Write export summary to file
 */
export async function writeExportSummary(result, outputDir) {
    const summary = {
        exportedAt: new Date().toISOString(),
        emailsExported: result.emailsExported,
        threadsProcessed: result.threadsProcessed,
        outputDirectory: result.outputDirectory,
        success: result.success,
        errors: result.errors,
    };
    const filepath = path.join(outputDir, "_export-summary.yaml");
    const yamlContent = stringify(summary);
    await fs.promises.writeFile(filepath, yamlContent, "utf-8");
}
//# sourceMappingURL=yaml-writer.js.map