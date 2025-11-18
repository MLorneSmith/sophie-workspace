import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Logger } from "../../shared/src/logger/impl/console";

import { registerComponentsTools } from "./tools/components";
import { registerDatabaseTools } from "./tools/database";
import { registerGetMigrationsTools } from "./tools/migrations";
import { registerScriptsTools } from "./tools/scripts";

// Create server instance
const server = new McpServer({
	name: "makerkit",
	version: "1.0.0",
});

registerGetMigrationsTools(server);
registerDatabaseTools(server);
registerComponentsTools(server);
registerScriptsTools(server);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((error) => {
	Logger.error("Fatal error in main():", { error });
	process.exit(1);
});
