#!/usr/bin/env node
/**
 * Cloudflare Playwright MCP Proxy Server
 * Proxies MCP requests to remote Cloudflare Playwright service with auth and retry logic
 */

const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;
const REMOTE_URL =
	process.env.REMOTE_URL ||
	"https://slideheroes-playwright-mcp.slideheroes.workers.dev/sse";
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

// Infrastructure logging: service startup info
process.stdout.write(
	`Starting Cloudflare Playwright MCP proxy on port ${PORT}\n`,
);
process.stdout.write(`Proxying to: ${REMOTE_URL}\n`);

let isHealthy = false;
let mcpProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 5;
let has404Error = false;
let lastSuccessfulConnection = null;

function startMcpProcess() {
	if (restartCount >= MAX_RESTARTS) {
		// Infrastructure logging: error condition for restart limit
		process.stderr.write(`Max restarts reached (${MAX_RESTARTS}), giving up\n`);
		return;
	}

	// Infrastructure logging: process startup
	process.stdout.write(`Starting MCP process (attempt ${restartCount + 1})\n`);
	mcpProcess = spawn("mcp-remote", [REMOTE_URL], {
		stdio: ["pipe", "pipe", "pipe"],
		env: { ...process.env, MCP_AUTH_TOKEN },
	});

	mcpProcess.stdout.on("data", (data) => {
		const output = data.toString();
		process.stdout.write(data);

		// Check for errors
		if (output.includes("HTTP 404")) {
			has404Error = true;
			// Infrastructure logging: error detection
			process.stdout.write(
				"Detected HTTP 404 error - endpoint may not exist or require different auth\n",
			);
		}

		// Mark as healthy when proxy is established via SSE
		if (
			output.includes("Proxy established successfully") &&
			output.includes("SSEClientTransport")
		) {
			isHealthy = true;
			lastSuccessfulConnection = new Date();
			restartCount = 0; // Reset restart count on success
			has404Error = false; // Clear error flag on success
		}
	});

	mcpProcess.stderr.on("data", (data) => {
		process.stderr.write(data);
	});

	mcpProcess.on("close", (code) => {
		// Infrastructure logging: process exit
		process.stdout.write(`MCP process exited with code ${code}\n`);
		isHealthy = false;

		// Don't restart if we have a persistent 404 error
		if (has404Error) {
			// Infrastructure logging: restart prevention
			process.stdout.write(
				"Not restarting due to persistent HTTP 404 error - endpoint configuration issue\n",
			);
			return;
		}

		// Restart unless we've hit max restarts
		if (restartCount < MAX_RESTARTS) {
			restartCount++;
			// Infrastructure logging: restart attempt
			process.stdout.write(
				`Connection dropped, restarting in 5 seconds... (${restartCount}/${MAX_RESTARTS})\n`,
			);
			setTimeout(startMcpProcess, 5000);
		} else {
			// Infrastructure logging: restart limit reached
			process.stdout.write(
				"Max restart attempts reached. Remote service may be unavailable.\n",
			);
		}
	});

	// Forward stdin to the MCP process
	process.stdin.pipe(mcpProcess.stdin);
}

// Start the initial process
startMcpProcess();

// Create a simple health check server
const healthServer = http.createServer((req, res) => {
	if (req.url === "/health") {
		// Consider healthy if we've had a successful connection in the last 5 minutes
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		const isRecentlyHealthy =
			lastSuccessfulConnection && lastSuccessfulConnection > fiveMinutesAgo;

		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				status: isHealthy || isRecentlyHealthy ? "healthy" : "unhealthy",
				service: "cloudflare-playwright-mcp-proxy",
				remote: REMOTE_URL,
				hasAuth: !!MCP_AUTH_TOKEN,
				processRunning: !!mcpProcess && !mcpProcess.killed,
				restartCount,
				has404Error,
				lastSuccessfulConnection,
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

// Forward stdin to the MCP process
process.stdin.pipe(mcpProcess.stdin);

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
