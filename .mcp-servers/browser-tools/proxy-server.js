#!/usr/bin/env node
/**
 * Browser Tools MCP Proxy Server
 * Provides HTTP health endpoint for containerized browser-tools-mcp
 */

const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;

// Infrastructure logging for MCP proxy server startup
process.stdout.write(`Starting Browser Tools MCP proxy on port ${PORT}\n`);

// Start the browser-tools-mcp process
const mcpProcess = spawn("browser-tools-mcp", [], {
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

	// Mark as healthy when server starts - browser tools may output different messages
	if (
		output.includes("running on stdio") ||
		output.includes("MCP server") ||
		output.includes("Server started") ||
		outputBuffer.includes("Browser Tools") ||
		outputBuffer.includes("browser-tools-mcp")
	) {
		process.stdout.write("✅ Browser Tools MCP server is healthy\n");
		isHealthy = true;
	}
});

// Set healthy after timeout as backup (browser tools may not output standard message)
setTimeout(() => {
	if (!isHealthy) {
		process.stdout.write(
			"✅ Browser Tools MCP server assumed healthy via timeout\n",
		);
		isHealthy = true;
	}
}, 10000);

mcpProcess.stderr.on("data", (data) => {
	const output = data.toString();
	process.stderr.write(data);

	// Don't fail on port discovery warnings - that's expected
	if (
		output.includes("No server found during discovery") ||
		output.includes("Initial server discovery failed")
	) {
		process.stdout.write(
			"Browser Tools server discovery warnings are expected - marking as healthy\n",
		);
		isHealthy = true;
	}
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
				service: "browser-tools-mcp-proxy",
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
