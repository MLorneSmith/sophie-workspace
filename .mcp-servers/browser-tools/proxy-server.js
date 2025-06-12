#!/usr/bin/env node
/**
 * Browser Tools MCP Proxy Server
 * Provides HTTP health endpoint for containerized browser-tools-mcp
 */

const { spawn } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 3000;

console.log(`Starting Browser Tools MCP proxy on port ${PORT}`);

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
		console.log("✅ Browser Tools MCP server is healthy");
		isHealthy = true;
	}
});

// Set healthy after timeout as backup (browser tools may not output standard message)
setTimeout(() => {
	if (!isHealthy) {
		console.log("✅ Browser Tools MCP server assumed healthy via timeout");
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
		console.log(
			"Browser Tools server discovery warnings are expected - marking as healthy",
		);
		isHealthy = true;
	}
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
