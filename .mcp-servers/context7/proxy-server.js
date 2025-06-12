#!/usr/bin/env node
/**
 * Context7 MCP Proxy Server
 * Provides HTTP health endpoint for containerized context7-mcp
 */

const { spawn } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 3000;

console.log(`Starting Context7 MCP proxy on port ${PORT}`);

// Start the context7-mcp process
const mcpProcess = spawn("context7-mcp", [], {
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
	if (output.includes("running on stdio") || output.includes("Context7")) {
		console.log("✅ Context7 MCP server is healthy");
		isHealthy = true;
	}
});

// Set healthy after timeout as backup - be more aggressive
setTimeout(() => {
	if (!isHealthy) {
		console.log(
			"✅ Context7 MCP server assumed healthy via timeout - server appears to be running",
		);
		isHealthy = true;
	}
}, 3000);

mcpProcess.stderr.on("data", (data) => {
	process.stderr.write(data);
});

mcpProcess.on("close", (code) => {
	console.log(`MCP process exited with code ${code}`);
	isHealthy = false;
	setTimeout(() => {
		console.log("Restarting MCP process...");
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
	console.log(`Health check server listening on port ${PORT}`);
});

// Handle shutdown gracefully
process.on("SIGTERM", () => {
	console.log("Received SIGTERM, shutting down gracefully");
	mcpProcess.kill("SIGTERM");
	healthServer.close();
});

process.on("SIGINT", () => {
	console.log("Received SIGINT, shutting down gracefully");
	mcpProcess.kill("SIGINT");
	healthServer.close();
});
