#!/usr/bin/env node
/**
 * Code Reasoning MCP Proxy Server
 * Provides HTTP health endpoint for containerized code-reasoning
 */

const { spawn } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 3000;

console.log(`Starting Code Reasoning MCP proxy on port ${PORT}`);

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
		console.log("✅ Code Reasoning MCP server is healthy");
		isHealthy = true;
	}
});

// Set healthy after timeout as backup
setTimeout(() => {
	if (!isHealthy) {
		console.log("✅ Code Reasoning MCP server assumed healthy via timeout");
		isHealthy = true;
	}
}, 5000);

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
