#!/usr/bin/env node
/**
 * Exa MCP Local Server
 * Runs local exa-mcp package with health check endpoint
 */

const { spawn } = require("node:child_process");
const http = require("node:http");

const PORT = process.env.PORT || 3000;
const EXA_API_KEY = process.env.EXA_API_KEY;

if (!EXA_API_KEY) {
	// Infrastructure logging: missing required env var
	process.stderr.write("EXA_API_KEY environment variable is required\n");
	process.exit(1);
}

// Infrastructure logging: service startup
process.stdout.write(`Starting Exa MCP local server on port ${PORT}\n`);
process.stdout.write(`Using EXA_API_KEY: ${EXA_API_KEY.substring(0, 8)}...\n`);

let isHealthy = false;
let mcpProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 3;
let lastSuccessfulStart = null;

function startMcpProcess() {
	if (restartCount >= MAX_RESTARTS) {
		// Infrastructure logging: error condition for restart limit
		process.stderr.write(`Max restarts reached (${MAX_RESTARTS}), giving up\n`);
		return;
	}

	// Infrastructure logging: process startup
	process.stdout.write(`Starting MCP process (attempt ${restartCount + 1})\n`);
	mcpProcess = spawn("exa-mcp", [], {
		stdio: ["pipe", "pipe", "pipe"],
		env: { ...process.env, EXA_API_KEY },
	});

	mcpProcess.stdout.on("data", (data) => {
		const output = data.toString();
		process.stdout.write(data);

		// Mark as healthy when server starts successfully
		if (
			output.includes("MCP") ||
			output.includes("server") ||
			output.includes("running")
		) {
			isHealthy = true;
			lastSuccessfulStart = new Date();
			restartCount = 0; // Reset restart count on success
		}
	});

	mcpProcess.stderr.on("data", (data) => {
		const output = data.toString();
		process.stderr.write(data);

		// Also check stderr for success indicators
		if (output.includes("running") || output.includes("listening")) {
			isHealthy = true;
			lastSuccessfulStart = new Date();
		}
	});

	mcpProcess.on("close", (code) => {
		// Infrastructure logging: process exit
		process.stdout.write(`MCP process exited with code ${code}\n`);
		isHealthy = false;

		// Restart unless we've hit max restarts
		if (restartCount < MAX_RESTARTS) {
			restartCount++;
			// Infrastructure logging: restart attempt
			process.stdout.write(
				`Process died, restarting in 5 seconds... (${restartCount}/${MAX_RESTARTS})\n`,
			);
			setTimeout(startMcpProcess, 5000);
		} else {
			// Infrastructure logging: restart limit reached
			process.stdout.write(
				"Max restart attempts reached. Process may be unstable.\n",
			);
		}
	});

	// Mark as healthy after 3 seconds if no output (silent success)
	setTimeout(() => {
		if (!isHealthy && mcpProcess && !mcpProcess.killed) {
			isHealthy = true;
			lastSuccessfulStart = new Date();
			// Infrastructure logging: silent process health detection
			process.stdout.write(
				"MCP process appears to be running silently - marking as healthy\n",
			);
		}
	}, 3000);

	// Forward stdin to the MCP process
	process.stdin.pipe(mcpProcess.stdin);
}

// Start the initial process
startMcpProcess();

// Create a simple health check server
const healthServer = http.createServer((req, res) => {
	if (req.url === "/health") {
		// Consider healthy if we've had a successful start in the last 10 minutes
		const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
		const isRecentlyHealthy =
			lastSuccessfulStart && lastSuccessfulStart > tenMinutesAgo;

		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(
			JSON.stringify({
				status: isHealthy || isRecentlyHealthy ? "healthy" : "unhealthy",
				service: "exa-mcp-local",
				processRunning: !!mcpProcess && !mcpProcess.killed,
				restartCount,
				lastSuccessfulStart,
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

// Handle shutdown gracefully
process.on("SIGTERM", () => {
	// Infrastructure logging: shutdown handling
	process.stdout.write("Received SIGTERM, shutting down gracefully\n");
	if (mcpProcess) mcpProcess.kill("SIGTERM");
	healthServer.close();
});

process.on("SIGINT", () => {
	// Infrastructure logging: shutdown handling
	process.stdout.write("Received SIGINT, shutting down gracefully\n");
	if (mcpProcess) mcpProcess.kill("SIGINT");
	healthServer.close();
});
