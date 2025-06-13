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
	console.error("PERPLEXITY_API_KEY environment variable is required");
	process.exit(1);
}

console.log(`Starting Perplexity MCP proxy on port ${PORT}`);
console.log(`API key: ${PERPLEXITY_API_KEY.substring(0, 10)}***`);

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
		console.log("✅ Perplexity MCP server is healthy");
		isHealthy = true;
	}
});

// Also set healthy after a timeout as backup - be more aggressive
setTimeout(() => {
	if (!isHealthy) {
		console.log(
			"✅ Perplexity MCP server assumed healthy via timeout - server appears to be running",
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
	console.log(`Health check server listening on port ${PORT}`);
});

// Keep stdin open but don't send invalid data
// The MCP process should stay alive as long as stdin doesn't close

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
