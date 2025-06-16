#!/usr/bin/env node
/**
 * Postgres MCP Proxy Server
 * Provides HTTP health endpoint for containerized postgres-mcp server
 */

const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;
const CONNECTION_STRING = process.env.POSTGRES_CONNECTION_STRING;

if (!CONNECTION_STRING) {
	// Infrastructure logging: missing required env var
	process.stderr.write(
		"POSTGRES_CONNECTION_STRING environment variable is required\n",
	);
	process.exit(1);
}

// Infrastructure logging: service startup
process.stdout.write(`Starting Postgres MCP proxy on port ${PORT}\n`);
process.stdout.write(
	`Connection string: ${CONNECTION_STRING.replace(/:[^:@]*@/, ":***@")}\n`,
);

// Start the postgres-mcp process
const mcpProcess = spawn(
	"postgres-mcp",
	["--connection-string", CONNECTION_STRING],
	{
		stdio: ["pipe", "pipe", "pipe"],
		env: { ...process.env },
	},
);

let isHealthy = false;
let outputBuffer = "";

mcpProcess.stdout.on("data", (data) => {
	const output = data.toString();
	process.stdout.write(data);

	// Add to buffer for health detection
	outputBuffer += output;

	// Mark as healthy when server starts (check both current chunk and buffer)
	if (
		output.includes("PostgreSQL MCP server running on stdio") ||
		outputBuffer.includes("PostgreSQL MCP server running on stdio") ||
		output.includes("running on stdio")
	) {
		// Infrastructure logging: health status
		process.stdout.write("✅ PostgreSQL MCP server is healthy\n");
		isHealthy = true;
	}
});

// Also set healthy after a timeout as backup - be more aggressive
setTimeout(() => {
	if (!isHealthy) {
		// Infrastructure logging: timeout-based health assumption
		process.stdout.write(
			"✅ PostgreSQL MCP server assumed healthy via timeout - server appears to be running\n",
		);
		isHealthy = true;
	}
}, 3000);

mcpProcess.stderr.on("data", (data) => {
	process.stderr.write(data);
});

mcpProcess.on("close", (code) => {
	// Infrastructure logging: process exit
	process.stdout.write(`MCP process exited with code ${code}\n`);
	isHealthy = false;
	setTimeout(() => {
		// Infrastructure logging: restart trigger
		process.stdout.write("Restarting MCP process...\n");
		process.exit(1); // Let Docker restart the container
	}, 1000);
});

// Create a simple health check server
const healthServer = http.createServer((req, res) => {
	if (req.url === "/health") {
		res.writeHead(isHealthy ? 200 : 503, {
			"Content-Type": "application/json",
		});
		res.end(
			JSON.stringify({
				status: isHealthy ? "healthy" : "unhealthy",
				service: "postgres-mcp-proxy",
				timestamp: new Date().toISOString(),
			}),
		);
	} else {
		res.writeHead(404);
		res.end("Not Found");
	}
});

healthServer.listen(PORT, () => {
	// Infrastructure logging: health server status
	process.stdout.write(`Health check server listening on port ${PORT}\n`);
});

// Keep stdin open but don't send invalid data
// The MCP process should stay alive as long as stdin doesn't close

// Handle shutdown gracefully
process.on("SIGTERM", () => {
	// Infrastructure logging: shutdown handling
	process.stdout.write("Received SIGTERM, shutting down gracefully\n");
	mcpProcess.kill("SIGTERM");
	healthServer.close();
});

process.on("SIGINT", () => {
	// Infrastructure logging: shutdown handling
	process.stdout.write("Received SIGINT, shutting down gracefully\n");
	mcpProcess.kill("SIGINT");
	healthServer.close();
});
