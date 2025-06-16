#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");

/**
 * Configuration for the migration
 */
const CONFIG = {
	// Mappings from console methods to logger methods
	methodMappings: {
		"console.log": "info",
		"console.error": "error",
		"console.warn": "warn",
		"console.debug": "debug",
		"console.info": "info",
	},

	// Import statement to add
	loggerImport: 'import { createServiceLogger } from "@kit/shared/logger";',

	// Patterns to identify different file types/locations
	serviceNamePatterns: [
		// App-specific patterns
		{
			pattern: /apps\/web\/app\/home\/\(user\)\/ai\/([^/]+)/,
			name: (match) => `ai-${match[1]}`,
		},
		{
			pattern: /apps\/web\/app\/home\/\(user\)\/([^/]+)/,
			name: (match) => match[1],
		},
		{
			pattern: /apps\/web\/app\/home\/\[account\]\/([^/]+)/,
			name: (match) => `team-${match[1]}`,
		},
		{
			pattern: /apps\/web\/app\/admin\/([^/]+)/,
			name: (match) => `admin-${match[1]}`,
		},
		{
			pattern: /apps\/web\/app\/api\/([^/]+)/,
			name: (match) => `api-${match[1]}`,
		},
		{ pattern: /apps\/web\/lib\/([^/]+)/, name: (match) => match[1] },
		{ pattern: /apps\/payload/, name: () => "payload" },
		{ pattern: /apps\/dev-tool/, name: () => "dev-tool" },

		// Package patterns
		{ pattern: /packages\/ai-gateway/, name: () => "ai-gateway" },
		{
			pattern: /packages\/billing\/([^/]+)/,
			name: (match) => `billing-${match[1]}`,
		},
		{
			pattern: /packages\/features\/([^/]+)/,
			name: (match) => `feature-${match[1]}`,
		},
		{
			pattern: /packages\/plugins\/([^/]+)/,
			name: (match) => `plugin-${match[1]}`,
		},
		{
			pattern: /packages\/monitoring\/([^/]+)/,
			name: (match) => `monitoring-${match[1]}`,
		},
		{ pattern: /packages\/cms\/([^/]+)/, name: (match) => `cms-${match[1]}` },
		{ pattern: /packages\/([^/]+)/, name: (match) => match[1] },

		// Default fallback
		{ pattern: /.*/, name: () => "app" },
	],
};

/**
 * Determines the service name based on file path
 */
function getServiceName(filePath) {
	const normalizedPath = filePath.replace(/\\/g, "/");

	for (const { pattern, name } of CONFIG.serviceNamePatterns) {
		const match = normalizedPath.match(pattern);
		if (match) {
			return name(match);
		}
	}

	return "app";
}

/**
 * Checks if a file already has logger imports
 */
function hasLoggerImport(content) {
	return (
		content.includes("@kit/shared/logger") ||
		content.includes("createServiceLogger") ||
		content.includes("createEnhancedLogger") ||
		content.includes("getLogger")
	);
}

/**
 * Adds logger import to the file content
 */
function addLoggerImport(content, serviceName) {
	// Check if file already has imports
	const importMatch = content.match(
		/^(import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)+/m,
	);

	if (importMatch) {
		// Add after existing imports
		const lastImportEnd = importMatch.index + importMatch[0].length;
		return (
			content.slice(0, lastImportEnd) +
			`${CONFIG.loggerImport}\n` +
			`\nconst logger = createServiceLogger('${serviceName}').getLogger();\n` +
			content.slice(lastImportEnd)
		);
	} else {
		// Add at the beginning if no imports found
		const useServerMatch = content.match(/^["']use server["'];?\s*\n/);
		if (useServerMatch) {
			// Add after "use server" directive
			const directiveEnd = useServerMatch.index + useServerMatch[0].length;
			return (
				content.slice(0, directiveEnd) +
				`\n${CONFIG.loggerImport}\n` +
				`\nconst logger = createServiceLogger('${serviceName}').getLogger();\n` +
				content.slice(directiveEnd)
			);
		}

		// Add at the very beginning
		return (
			`${CONFIG.loggerImport}\n` +
			`\nconst logger = createServiceLogger('${serviceName}').getLogger();\n\n` +
			content
		);
	}
}

/**
 * Replaces console statements with logger calls
 */
function replaceConsoleStatements(content) {
	let modifiedContent = content;
	let replacementCount = 0;

	// Replace each console method
	Object.entries(CONFIG.methodMappings).forEach(
		([consoleMethod, loggerMethod]) => {
			// Pattern to match console calls with various formats
			const patterns = [
				// Simple console.log("message")
				new RegExp(
					`${consoleMethod.replace(".", "\\.")}\\s*\\(\\s*["'\`]([^"'\`]+)["'\`]\\s*\\)`,
					"g",
				),

				// console.log("message", variable)
				new RegExp(
					`${consoleMethod.replace(".", "\\.")}\\s*\\(\\s*["'\`]([^"'\`]+)["'\`]\\s*,\\s*(.+?)\\s*\\)`,
					"g",
				),

				// console.log(variable)
				new RegExp(
					`${consoleMethod.replace(".", "\\.")}\\s*\\(\\s*([^"'\`][^)]+)\\s*\\)`,
					"g",
				),
			];

			// Handle simple string messages
			modifiedContent = modifiedContent.replace(
				patterns[0],
				(match, message) => {
					replacementCount++;
					return `logger.${loggerMethod}("${message}")`;
				},
			);

			// Handle messages with additional data
			modifiedContent = modifiedContent.replace(
				patterns[1],
				(match, message, data) => {
					replacementCount++;
					// Check if data looks like an object or multiple arguments
					const dataStr = data.trim();
					if (dataStr.startsWith("{") || dataStr.includes(",")) {
						return `logger.${loggerMethod}("${message}", ${dataStr})`;
					} else {
						return `logger.${loggerMethod}("${message}", { data: ${dataStr} })`;
					}
				},
			);

			// Handle non-string first arguments (objects, errors, etc.)
			modifiedContent = modifiedContent.replace(patterns[2], (match, args) => {
				const argsStr = args.trim();

				// Skip if it's already a logger call or contains quotes (handled above)
				if (argsStr.includes("logger.") || argsStr.match(/^["'`]/)) {
					return match;
				}

				replacementCount++;

				// If it starts with 'Error' or looks like an error
				if (
					argsStr.startsWith("Error") ||
					argsStr.includes("error") ||
					argsStr.includes("Error")
				) {
					return `logger.${loggerMethod}("Error occurred", { error: ${argsStr} })`;
				}

				// If it's a template literal
				if (argsStr.startsWith("`")) {
					return `logger.${loggerMethod}(${argsStr})`;
				}

				// For other cases, treat as data
				return `logger.${loggerMethod}("Log output", { data: ${argsStr} })`;
			});
		},
	);

	return { modifiedContent, replacementCount };
}

/**
 * Processes a single file
 */
async function processFile(filePath) {
	try {
		const content = await fs.readFile(filePath, "utf8");

		// Check if file contains console statements
		const hasConsoleStatements = Object.keys(CONFIG.methodMappings).some(
			(method) => content.includes(method),
		);

		if (!hasConsoleStatements) {
			return {
				filePath,
				status: "skipped",
				reason: "No console statements found",
			};
		}

		let modifiedContent = content;
		const serviceName = getServiceName(filePath);

		// Add logger import if not present
		if (!hasLoggerImport(content)) {
			modifiedContent = addLoggerImport(modifiedContent, serviceName);
		}

		// Replace console statements
		const { modifiedContent: finalContent, replacementCount } =
			replaceConsoleStatements(modifiedContent);

		// Skip if no replacements were made
		if (replacementCount === 0) {
			return {
				filePath,
				status: "skipped",
				reason: "No replacements made",
			};
		}

		// Write the modified content back
		await fs.writeFile(filePath, finalContent, "utf8");

		return {
			filePath,
			status: "success",
			serviceName,
			replacementCount,
		};
	} catch (error) {
		return {
			filePath,
			status: "error",
			error: error.message,
		};
	}
}

/**
 * Main function
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error(
			"Usage: node migrate-to-logger.js <file1> [file2] [...fileN]",
		);
		console.error(
			"       node migrate-to-logger.js --from-file <file-list.txt>",
		);
		process.exit(1);
	}

	let files = [];

	// Handle file list from text file
	if (args[0] === "--from-file" && args[1]) {
		const fileListPath = args[1];
		try {
			const fileListContent = await fs.readFile(fileListPath, "utf8");
			files = fileListContent.split("\n").filter((line) => line.trim());
		} catch (error) {
			console.error(`Error reading file list: ${error.message}`);
			process.exit(1);
		}
	} else {
		files = args;
	}

	// Validate files exist
	const validFiles = [];
	for (const file of files) {
		try {
			await fs.access(file);
			validFiles.push(file);
		} catch {
			console.warn(`Warning: File not found: ${file}`);
		}
	}

	if (validFiles.length === 0) {
		console.error("No valid files to process");
		process.exit(1);
	}

	console.log(`Processing ${validFiles.length} files...\n`);

	// Process files
	const results = await Promise.all(validFiles.map(processFile));

	// Display results
	const successful = results.filter((r) => r.status === "success");
	const skipped = results.filter((r) => r.status === "skipped");
	const errors = results.filter((r) => r.status === "error");

	if (successful.length > 0) {
		console.log("✅ Successfully migrated:");
		successful.forEach((result) => {
			console.log(
				`   ${result.filePath} (${result.replacementCount} replacements, service: ${result.serviceName})`,
			);
		});
		console.log("");
	}

	if (skipped.length > 0) {
		console.log("⏩ Skipped:");
		skipped.forEach((result) => {
			console.log(`   ${result.filePath} - ${result.reason}`);
		});
		console.log("");
	}

	if (errors.length > 0) {
		console.log("❌ Errors:");
		errors.forEach((result) => {
			console.log(`   ${result.filePath} - ${result.error}`);
		});
		console.log("");
	}

	console.log(
		`Summary: ${successful.length} migrated, ${skipped.length} skipped, ${errors.length} errors`,
	);
}

// Run the script
main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
