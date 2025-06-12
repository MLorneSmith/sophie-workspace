#!/usr/bin/env node
/**
 * Cloudflare Playwright MCP Proxy Server
 * Proxies MCP requests to remote Cloudflare Playwright service with auth
 */

const { spawn } = require("child_process");
const http = require("http");

const PORT = process.env.PORT || 3000;
const REMOTE_URL =
	process.env.REMOTE_URL ||
	"https://slideheroes-playwright-mcp.slideheroes.workers.dev/sse";
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

console.log(`Starting Cloudflare Playwright MCP proxy on port ${PORT}`);
console.log(`Proxying to: ${REMOTE_URL}`);

// Start the mcp-remote process with auth token
const mcpProcess = spawn("mcp-remote", [REMOTE_URL], {
	stdio: ["pipe", "pipe", "pipe"],
	env: { ...process.env, MCP_AUTH_TOKEN },
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
				service: "cloudflare-playwright-mcp-proxy",
				remote: REMOTE_URL,
				hasAuth: !!MCP_AUTH_TOKEN,
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
