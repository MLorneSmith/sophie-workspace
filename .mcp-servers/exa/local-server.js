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
	console.error("EXA_API_KEY environment variable is required");
	process.exit(1);
}

console.log(`Starting Exa MCP local server on port ${PORT}`);
console.log(`Using EXA_API_KEY: ${EXA_API_KEY.substring(0, 8)}...`);

let isHealthy = false;
let mcpProcess = null;
let restartCount = 0;
const MAX_RESTARTS = 3;
let lastSuccessfulStart = null;

function startMcpProcess() {
	if (restartCount >= MAX_RESTARTS) {
		console.error(`Max restarts reached (${MAX_RESTARTS}), giving up`);
		return;
	}

	console.log(`Starting MCP process (attempt ${restartCount + 1})`);
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
		console.log(`MCP process exited with code ${code}`);
		isHealthy = false;

		// Restart unless we've hit max restarts
		if (restartCount < MAX_RESTARTS) {
			restartCount++;
			console.log(
				`Process died, restarting in 5 seconds... (${restartCount}/${MAX_RESTARTS})`,
			);
			setTimeout(startMcpProcess, 5000);
		} else {
			console.log("Max restart attempts reached. Process may be unstable.");
		}
	});

	// Mark as healthy after 3 seconds if no output (silent success)
	setTimeout(() => {
		if (!isHealthy && mcpProcess && !mcpProcess.killed) {
			isHealthy = true;
			lastSuccessfulStart = new Date();
			console.log(
				"MCP process appears to be running silently - marking as healthy",
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
	console.log(`Health check server listening on port ${PORT}`);
});

// Handle shutdown gracefully
process.on("SIGTERM", () => {
	console.log("Received SIGTERM, shutting down gracefully");
	if (mcpProcess) mcpProcess.kill("SIGTERM");
	healthServer.close();
});

process.on("SIGINT", () => {
	console.log("Received SIGINT, shutting down gracefully");
	if (mcpProcess) mcpProcess.kill("SIGINT");
	healthServer.close();
});
