#!/usr/bin/env node
/**
 * Supabase MCP Proxy Server
 * Provides HTTP health endpoint for containerized mcp-server-supabase
 */

const { spawn } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 3000;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_ACCESS_TOKEN) {
	console.error("SUPABASE_ACCESS_TOKEN environment variable is required");
	process.exit(1);
}

console.log(`Starting Supabase MCP proxy on port ${PORT}`);
console.log(`Access token: ${SUPABASE_ACCESS_TOKEN.substring(0, 10)}***`);

// Start the mcp-server-supabase process
const mcpProcess = spawn(
	"mcp-server-supabase",
	["--access-token", SUPABASE_ACCESS_TOKEN],
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

	// Mark as healthy when server starts
	if (
		output.includes("running on stdio") ||
		output.includes("Supabase MCP") ||
		output.includes("MCP server") ||
		outputBuffer.includes("Supabase")
	) {
		console.log("✅ Supabase MCP server is healthy");
		isHealthy = true;
	}
});

// Set healthy after timeout as backup
setTimeout(() => {
	if (!isHealthy) {
		console.log("✅ Supabase MCP server assumed healthy via timeout");
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
				service: "supabase-mcp-proxy",
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
