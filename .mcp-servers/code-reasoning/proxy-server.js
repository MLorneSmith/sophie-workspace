#!/usr/bin/env node
/**
 * Code Reasoning MCP Proxy Server
 * Provides HTTP health endpoint for containerized code-reasoning
 */

const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;

// Infrastructure logging: service startup
process.stdout.write(`Starting Code Reasoning MCP proxy on port ${PORT}\n`);

// Start the code-reasoning process
const mcpProcess = spawn("code-reasoning", [], {
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

	// Mark as healthy when server starts
	if (
		output.includes("running on stdio") ||
		output.includes("Code Reasoning") ||
		output.includes("MCP server") ||
		outputBuffer.includes("code-reasoning")
	) {
		// Infrastructure logging: health status
		process.stdout.write("✅ Code Reasoning MCP server is healthy\n");
		isHealthy = true;
	}
});

// Set healthy after timeout as backup
setTimeout(() => {
	if (!isHealthy) {
		// Infrastructure logging: timeout-based health assumption
		process.stdout.write(
			"✅ Code Reasoning MCP server assumed healthy via timeout\n",
		);
		isHealthy = true;
	}
}, 5000);

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
				service: "code-reasoning-mcp-proxy",
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
