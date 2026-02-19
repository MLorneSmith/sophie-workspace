import "dotenv/config";
import { defaultBuildLogger, Template } from "e2b";
import { GPT_DEV_TEMPLATE_ALIAS, gptTemplate } from "./template";

// Node.js globals are available at runtime
declare const process: { argv: string[] };

async function main() {
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`Building E2B template: ${GPT_DEV_TEMPLATE_ALIAS}`);
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log("This may take several minutes...\n");

	// Check for --no-cache flag
	const skipCache = process.argv.includes("--no-cache");
	if (skipCache) {
		// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
		console.log("Building with --no-cache (skipping layer cache)\n");
	}

	const result = await Template.build(gptTemplate, {
		alias: GPT_DEV_TEMPLATE_ALIAS,
		cpuCount: 4,
		memoryMB: 8192,
		skipCache,
		onBuildLogs: defaultBuildLogger(),
	});

	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log("\n=== Template Built Successfully ===");
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`Alias: ${GPT_DEV_TEMPLATE_ALIAS}`);
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`Template ID: ${result.templateId}`);
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log("\nTo use this template:");
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`  /sandbox create --template ${GPT_DEV_TEMPLATE_ALIAS}`);
}

// biome-ignore lint/suspicious/noConsole: CLI build script requires console for error output
main().catch(console.error);
