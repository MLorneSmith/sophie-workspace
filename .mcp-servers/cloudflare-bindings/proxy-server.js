#!/usr/bin/env node
/**
 * Cloudflare Bindings MCP Proxy Server
 * Proxies MCP requests to remote Cloudflare Bindings service
 */

const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;
const REMOTE_URL =
	process.env.REMOTE_URL || "https://bindings.mcp.cloudflare.com/sse";

// Infrastructure logging for MCP proxy server startup
process.stdout.write(
	`Starting Cloudflare Bindings MCP proxy on port ${PORT}\n`,
);
process.stdout.write(`Proxying to: ${REMOTE_URL}\n`);

// Start the mcp-remote process
const mcpProcess = spawn("mcp-remote", [REMOTE_URL], {
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
	process.stdout.write(`MCP process exited with code ${code}\n`);
	process.exit(code);
});

// Create a simple health check server
const healthServer = http.createServer((req, res) => {
	if (req.url === "/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				status: "healthy",
				service: "cloudflare-bindings-mcp-proxy",
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
	process.stdout.write(`Health check server listening on port ${PORT}\n`);
});

// Forward stdin to the MCP process
process.stdin.pipe(mcpProcess.stdin);

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
