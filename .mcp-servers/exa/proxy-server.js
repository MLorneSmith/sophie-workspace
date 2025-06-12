#!/usr/bin/env node
/**
 * Exa MCP Proxy Server
 * Proxies MCP requests to remote Exa service to avoid npx download delays
 */

const { spawn } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 3000;
const EXA_API_KEY = process.env.EXA_API_KEY;
const REMOTE_URL = process.env.REMOTE_URL || "https://mcp.exa.ai/mcp";

// Build the remote URL with API key
const fullRemoteUrl = `${REMOTE_URL}?exaApiKey=${EXA_API_KEY}`;

console.log(`Starting Exa MCP proxy on port ${PORT}`);
console.log(`Proxying to: ${fullRemoteUrl}`);

// Start the mcp-remote process
const mcpProcess = spawn("mcp-remote", [fullRemoteUrl], {
	stdio: ["pipe", "pipe", "pipe"],
	env: { ...process.env },
});

mcpProcess.stdout.on("data", (data) => {
	process.stdout.write(data);
});

mcpProcess.stderr.on("data", (data) => {
	process.stderr.write(data);
});

mcpProcess.on("close", (code) => {
	console.log(`MCP process exited with code ${code}`);
	process.exit(code);
});

// Create a simple health check server
const healthServer = http.createServer((req, res) => {
	if (req.url === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				status: "healthy",
				service: "exa-mcp-proxy",
				remote: REMOTE_URL,
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

// Forward stdin to the MCP process
process.stdin.pipe(mcpProcess.stdin);

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
