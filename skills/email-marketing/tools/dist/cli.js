import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { gmailClient } from "./gmail-client.js";
import { extractCleanText } from "./html-to-text.js";
import { writeEmailsToYaml, writeExportSummary } from "./yaml-writer.js";
const DEFAULT_CREDENTIALS_PATH = path.join(process.env.HOME ?? process.env.USERPROFILE ?? ".", ".email-export", "credentials.json");
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), "email-exports");
export function createCli() {
    const program = new Command();
    program
        .name("email-export")
        .description("Export emails from Gmail to YAML format for style analysis")
        .version("1.0.0");
    program
        .command("export")
        .description("Export emails matching the given criteria")
        .option("-l, --label <label>", "Filter by Gmail label")
        .option("-q, --query <query>", "Custom Gmail search query")
        .option("-a, --after <date>", "Only emails after this date (YYYY/MM/DD)")
        .option("-b, --before <date>", "Only emails before this date (YYYY/MM/DD)")
        .option("-o, --output <dir>", "Output directory", DEFAULT_OUTPUT_DIR)
        .option("-t, --thread-id <id>", "Export specific thread by ID")
        .option("-m, --max <number>", "Maximum number of emails to export", "50")
        .option("-c, --credentials <path>", "Path to credentials.json", DEFAULT_CREDENTIALS_PATH)
        .option("--include-spam", "Include emails from spam folder")
        .option("--include-trash", "Include emails from trash folder")
        .action(async (options) => {
        await runExport(options);
    });
    program
        .command("auth")
        .description("Authenticate with Gmail (run this first)")
        .option("-c, --credentials <path>", "Path to credentials.json", DEFAULT_CREDENTIALS_PATH)
        .action(async (options) => {
        await runAuth(options);
    });
    program
        .command("labels")
        .description("List available Gmail labels")
        .option("-c, --credentials <path>", "Path to credentials.json", DEFAULT_CREDENTIALS_PATH)
        .action(async (options) => {
        await listLabels(options);
    });
    return program;
}
async function runAuth(options) {
    const spinner = ora("Initializing Gmail authentication...").start();
    try {
        // Check if credentials file exists
        if (!fs.existsSync(options.credentials)) {
            spinner.fail(chalk.red("Credentials file not found"));
            console.log();
            console.log(chalk.yellow("To authenticate, you need to:"));
            console.log("1. Go to https://console.cloud.google.com/");
            console.log("2. Create a new project (or select existing)");
            console.log("3. Enable the Gmail API");
            console.log("4. Create OAuth 2.0 credentials (Desktop app type)");
            console.log(`5. Download and save as: ${options.credentials}`);
            console.log();
            return;
        }
        await gmailClient.initialize(options.credentials);
        spinner.succeed(chalk.green("Successfully authenticated with Gmail!"));
        console.log();
        console.log(chalk.dim("Token saved. You can now run export commands."));
    }
    catch (error) {
        spinner.fail(chalk.red("Authentication failed"));
        console.error(error instanceof Error ? error.message : error);
    }
}
async function listLabels(options) {
    const spinner = ora("Fetching labels...").start();
    try {
        await gmailClient.initialize(options.credentials);
        const labels = await gmailClient.getLabelNames([]);
        spinner.stop();
        console.log(chalk.bold("\nAvailable Gmail Labels:\n"));
        for (const label of labels.sort()) {
            console.log(`  ${chalk.cyan(label)}`);
        }
        console.log();
    }
    catch (error) {
        spinner.fail(chalk.red("Failed to fetch labels"));
        console.error(error instanceof Error ? error.message : error);
    }
}
async function runExport(options) {
    const spinner = ora("Initializing...").start();
    try {
        // Check credentials
        if (!fs.existsSync(options.credentials)) {
            spinner.fail(chalk.red("Credentials file not found"));
            console.log(chalk.yellow(`Run: email-export auth -c ${options.credentials}`));
            return;
        }
        // Initialize client
        spinner.text = "Authenticating with Gmail...";
        await gmailClient.initialize(options.credentials);
        // Build export options
        const exportOptions = {
            label: options.label,
            query: options.query,
            after: options.after,
            before: options.before,
            output: options.output,
            threadId: options.threadId,
            maxResults: parseInt(options.max, 10),
            includeSpam: options.includeSpam,
            includeTrash: options.includeTrash,
        };
        // Fetch emails
        spinner.text = "Fetching emails...";
        let rawEmails;
        if (options.threadId) {
            rawEmails = await gmailClient.fetchThread(options.threadId);
        }
        else {
            rawEmails = await gmailClient.fetchEmails(exportOptions, (current, total) => {
                spinner.text = `Fetching emails... ${current}/${total}`;
            });
        }
        if (rawEmails.length === 0) {
            spinner.warn(chalk.yellow("No emails found matching criteria"));
            return;
        }
        spinner.succeed(`Found ${rawEmails.length} emails`);
        // Convert to export format
        const convertSpinner = ora("Converting emails...").start();
        const exportedEmails = [];
        for (let i = 0; i < rawEmails.length; i++) {
            const rawEmail = rawEmails[i];
            convertSpinner.text = `Converting emails... ${i + 1}/${rawEmails.length}`;
            const headers = gmailClient.extractHeaders(rawEmail);
            const { plain, html } = gmailClient.extractBody(rawEmail);
            const threadContext = await gmailClient.getThreadContext(rawEmail);
            const labels = await gmailClient.getLabelNames(rawEmail.labelIds ?? []);
            // Extract attachment info
            const attachments = [];
            const extractAttachments = (parts) => {
                for (const part of parts ?? []) {
                    if (part.filename && part.filename.length > 0) {
                        attachments.push({
                            filename: part.filename,
                            mimeType: part.mimeType ?? "application/octet-stream",
                            size: part.body?.size ?? 0,
                        });
                    }
                    if (part.parts) {
                        extractAttachments(part.parts);
                    }
                }
            };
            extractAttachments(rawEmail.payload?.parts);
            const exportedEmail = {
                metadata: {
                    id: rawEmail.id,
                    exportedAt: new Date().toISOString(),
                    source: "gmail",
                    labels,
                },
                headers,
                thread: threadContext,
                content: {
                    plain: extractCleanText(plain, html),
                    hasHtml: html.length > 0,
                    attachments,
                },
                annotations: {
                    purpose: "",
                    tone: "",
                    audience: "",
                    structuralPatterns: [],
                    rhetoricalDevices: [],
                    notes: "",
                },
            };
            exportedEmails.push(exportedEmail);
        }
        convertSpinner.succeed(`Converted ${exportedEmails.length} emails`);
        // Write to YAML files
        const writeSpinner = ora("Writing YAML files...").start();
        const result = await writeEmailsToYaml(exportedEmails, { outputDir: options.output }, (current, total, _filepath) => {
            writeSpinner.text = `Writing YAML files... ${current}/${total}`;
        });
        // Write summary
        await writeExportSummary(result, options.output);
        if (result.success) {
            writeSpinner.succeed(chalk.green(`Exported ${result.emailsExported} emails to ${result.outputDirectory}`));
        }
        else {
            writeSpinner.warn(chalk.yellow(`Exported ${result.emailsExported} emails with ${result.errors.length} errors`));
            console.log();
            for (const error of result.errors) {
                console.log(chalk.red(`  Error: ${error.message}`));
            }
        }
        console.log();
        console.log(chalk.dim("Next steps:"));
        console.log(chalk.dim(`1. Review exported files in ${options.output}`));
        console.log(chalk.dim("2. Fill in the annotations section for each email"));
        console.log(chalk.dim("3. Use the annotated files with the style capture system"));
    }
    catch (error) {
        spinner.fail(chalk.red("Export failed"));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
//# sourceMappingURL=cli.js.map