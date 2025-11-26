import "dotenv/config";
import { Template, defaultBuildLogger } from "e2b";
import { template } from "./template";

async function main() {
	await Template.build(template, {
		alias: "slideheroes-claude-agent",
		onBuildLogs: defaultBuildLogger(),
	});
}

// biome-ignore lint/suspicious/noConsole: CLI build script requires console for error output
main().catch(console.error);
