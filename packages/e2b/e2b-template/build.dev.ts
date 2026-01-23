import "dotenv/config";
import { defaultBuildLogger, Template } from "e2b";
import { DEV_TEMPLATE_ALIAS, template } from "./template";

// Node.js globals are available at runtime
declare const process: { argv: string[] };

async function main() {
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`Building E2B template: ${DEV_TEMPLATE_ALIAS}`);
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log("This may take several minutes...\n");

	// Check for --no-cache flag
	const skipCache = process.argv.includes("--no-cache");
	if (skipCache) {
		// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
		console.log("Building with --no-cache (skipping layer cache)\n");
	}

	const result = await Template.build(template, {
		alias: DEV_TEMPLATE_ALIAS,
		cpuCount: 4,
		memoryMB: 8192, // Increased from 4096 to prevent OOM during Claude Code context loading
		skipCache,
		onBuildLogs: defaultBuildLogger(),
	});

	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log("\n=== Template Built Successfully ===");
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`Alias: ${DEV_TEMPLATE_ALIAS}`);
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`Template ID: ${result.templateId}`);
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log("\nTo use this template:");
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`  /sandbox create --template ${DEV_TEMPLATE_ALIAS}`);
}

// biome-ignore lint/suspicious/noConsole: CLI build script requires console for error output
main().catch(console.error);
