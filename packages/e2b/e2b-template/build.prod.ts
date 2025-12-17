import "dotenv/config";
import { defaultBuildLogger, Template } from "e2b";
import { template, TEMPLATE_ALIAS } from "./template";

async function main() {
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`Building E2B template: ${TEMPLATE_ALIAS}`);
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log("This may take several minutes...\n");

	const result = await Template.build(template, {
		alias: TEMPLATE_ALIAS,
		cpuCount: 4,
		memoryMB: 4096,
		onBuildLogs: defaultBuildLogger(),
	});

	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log("\n=== Template Built Successfully ===");
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`Alias: ${TEMPLATE_ALIAS}`);
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`Template ID: ${result.templateId}`);
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log("\nTo use this template:");
	// biome-ignore lint/suspicious/noConsole: CLI build script requires console output
	console.log(`  /sandbox create --template ${TEMPLATE_ALIAS}`);
}

// biome-ignore lint/suspicious/noConsole: CLI build script requires console for error output
main().catch(console.error);
