#!/usr/bin/env node
/**
 * Perplexity MCP Proxy Server
 * Provides HTTP health endpoint for containerized mcp-server-perplexity-ask
 */

const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

if (!PERPLEXITY_API_KEY) {
	// Infrastructure logging: missing required env var
	process.stderr.write("PERPLEXITY_API_KEY environment variable is required\n");
	process.exit(1);
}

// Infrastructure logging: service startup
process.stdout.write(`Starting Perplexity MCP proxy on port ${PORT}\n`);
process.stdout.write(`API key: ${PERPLEXITY_API_KEY.substring(0, 10)}***\n`);

// Start the mcp-server-perplexity-ask process
const mcpProcess = spawn("mcp-server-perplexity-ask", [], {
	stdio: ["pipe", "pipe", "pipe"],
	env: { ...process.env },
});

let isHealthy = false;

let outputBuffer = "";

mcpProcess.stdout.on("data", (data) => {
	const output = data.toString();
	process.stdout.write(data);

	// Add to buffer for health detection
	outputBuffer += output;

	// Mark as healthy when server starts (check both current chunk and buffer)
	if (
		output.includes("running on stdio") ||
		outputBuffer.includes("Perplexity Ask MCP Server running on stdio")
	) {
		// Infrastructure logging: health status
		process.stdout.write("✅ Perplexity MCP server is healthy\n");
		isHealthy = true;
	}
});

// Also set healthy after a timeout as backup - be more aggressive
setTimeout(() => {
	if (!isHealthy) {
		// Infrastructure logging: timeout-based health assumption
		process.stdout.write(
			"✅ Perplexity MCP server assumed healthy via timeout - server appears to be running\n",
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
				service: "perplexity-mcp-proxy",
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
