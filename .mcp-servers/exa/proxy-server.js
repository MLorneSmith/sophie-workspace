#!/usr/bin/env node
/**
 * Exa MCP Proxy Server
 * Proxies MCP requests to remote Exa service with connection persistence
 */

const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;
const EXA_API_KEY = process.env.EXA_API_KEY;
const REMOTE_URL = process.env.REMOTE_URL || "https://mcp.exa.ai/mcp";

// Build the remote URL with API key
const fullRemoteUrl = `${REMOTE_URL}?exaApiKey=${EXA_API_KEY}`;

console.log(`Starting Exa MCP proxy on port ${PORT}`);
console.log(`Proxying to: ${fullRemoteUrl}`);

let isHealthy = false;
let mcpProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 5;
let lastSuccessfulConnection = null;

function startMcpProcess() {
	if (restartCount >= MAX_RESTARTS) {
		console.error(`Max restarts reached (${MAX_RESTARTS}), giving up`);
		return;
	}

	console.log(`Starting MCP process (attempt ${restartCount + 1})`);
	mcpProcess = spawn("mcp-remote", [fullRemoteUrl], {
		stdio: ["pipe", "pipe", "pipe"],
		env: { ...process.env },
	});

	mcpProcess.stdout.on("data", (data) => {
		const output = data.toString();
		process.stdout.write(data);

		// Mark as healthy when proxy is established
		if (
			output.includes("Proxy established successfully") ||
			output.includes("Local STDIO server running")
		) {
			isHealthy = true;
			lastSuccessfulConnection = new Date();
			restartCount = 0; // Reset restart count on success
		}
	});

	mcpProcess.stderr.on("data", (data) => {
		process.stderr.write(data);
	});

	mcpProcess.on("close", (code) => {
		console.log(`MCP process exited with code ${code}`);
		isHealthy = false;

		// Restart unless we've hit max restarts or process was explicitly terminated
		if (restartCount < MAX_RESTARTS) {
			restartCount++;
			console.log(
				`Connection dropped, restarting in 5 seconds... (${restartCount}/${MAX_RESTARTS})`,
			);
			setTimeout(startMcpProcess, 5000);
		} else {
			console.log(
				"Max restart attempts reached. Remote service may be unavailable.",
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
				service: "exa-mcp-proxy",
				remote: REMOTE_URL,
				processRunning: !!mcpProcess && !mcpProcess.killed,
				restartCount,
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
