import "dotenv/config";
import { defaultBuildLogger, Template } from "e2b";
import { template, TEMPLATE_ALIAS } from "./template";

async function main() {
	console.log(`Building E2B template: ${TEMPLATE_ALIAS}`);
	console.log("This may take several minutes...\n");

	const result = await Template.build(template, {
		alias: TEMPLATE_ALIAS,
		cpuCount: 4,
		memoryMB: 4096,
		onBuildLogs: defaultBuildLogger(),
	});

	console.log("\n=== Template Built Successfully ===");
	console.log(`Alias: ${TEMPLATE_ALIAS}`);
	console.log(`Template ID: ${result.templateId}`);
	console.log("\nTo use this template:");
	console.log(`  /sandbox create --template ${TEMPLATE_ALIAS}`);
}

// biome-ignore lint/suspicious/noConsole: CLI build script requires console for error output
main().catch(console.error);
