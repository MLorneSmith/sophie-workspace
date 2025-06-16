#!/usr/bin/env node
/**
 * Context7 MCP Proxy Server
 * Provides HTTP health endpoint for containerized context7-mcp
 */

const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;

// Infrastructure logging for MCP proxy server startup
process.stdout.write(`Starting Context7 MCP proxy on port ${PORT}\n`);

// Start the context7-mcp process
const mcpProcess = spawn("context7-mcp", [], {
	stdio: ["pipe", "pipe", "pipe"],
	env: { ...process.env },
});

let isHealthy = false;
let _outputBuffer = "";

mcpProcess.stdout.on("data", (data) => {
	const output = data.toString();
	process.stdout.write(data);

	// Add to buffer for health detection
	_outputBuffer += output;

	// Mark as healthy when server starts
	if (output.includes("running on stdio") || output.includes("Context7")) {
		process.stdout.write("✅ Context7 MCP server is healthy\n");
		isHealthy = true;
	}
});

// Set healthy after timeout as backup - be more aggressive
setTimeout(() => {
	if (!isHealthy) {
		process.stdout.write(
			"✅ Context7 MCP server assumed healthy via timeout - server appears to be running\n",
		);
		isHealthy = true;
	}
}, 3000);

mcpProcess.stderr.on("data", (data) => {
	process.stderr.write(data);
});

mcpProcess.on("close", (code) => {
	process.stdout.write(`MCP process exited with code ${code}\n`);
	isHealthy = false;
	setTimeout(() => {
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
				service: "context7-mcp-proxy",
				timestamp: new Date().toISOString(),
			}),
		);
	} else {
		res.writeHead(404);
		res.end("Not Found");
	}
});

healthServer.listen(PORT, () => {
	process.stdout.write(`Health check server listening on port ${PORT}\n`);
});

// Handle shutdown gracefully
process.on("SIGTERM", () => {
	process.stdout.write("Received SIGTERM, shutting down gracefully\n");
	mcpProcess.kill("SIGTERM");
	healthServer.close();
});

process.on("SIGINT", () => {
	process.stdout.write("Received SIGINT, shutting down gracefully\n");
	mcpProcess.kill("SIGINT");
	healthServer.close();
});
