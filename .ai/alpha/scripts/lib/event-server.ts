/**
 * Event Server Module
 *
 * Manages the Python WebSocket event server for real-time UI streaming.
 * Extracted from orchestrator.ts as part of refactoring #1816.
 */

import { type ChildProcess, spawn } from "node:child_process";
import * as path from "node:path";

import { EVENT_SERVER_PORT } from "../config/index.js";
import { sleep } from "./utils.js";

// ============================================================================
// Module State
// ============================================================================

let eventServerProcess: ChildProcess | null = null;

// ============================================================================
// Types
// ============================================================================

export interface EventServerConfig {
	projectRoot: string;
	port?: number;
}

// ============================================================================
// Event Server Management
// ============================================================================

/**
 * Start the event server for WebSocket streaming.
 *
 * @param projectRoot - Project root directory
 * @param log - Logger function
 * @returns The orchestrator URL to pass to sandboxes, or null if startup fails
 */
export async function startEventServer(
	projectRoot: string,
	log: (...args: unknown[]) => void,
): Promise<string | null> {
	const scriptPath = path.join(
		projectRoot,
		".ai/alpha/scripts/event-server.py",
	);

	try {
		// Check if port is already in use (previous server still running)
		const { execSync } = await import("node:child_process");
		try {
			// Try to kill any existing process on the port
			execSync(`lsof -ti:${EVENT_SERVER_PORT} | xargs kill -9 2>/dev/null`, {
				stdio: "ignore",
			});
			// Wait a bit for port to be released
			await sleep(500);
		} catch {
			// No existing process, that's fine
		}

		// Start the event server
		eventServerProcess = spawn("python3", [scriptPath], {
			cwd: projectRoot,
			stdio: ["ignore", "pipe", "pipe"],
			detached: false,
		});

		// Wait for server to start
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Event server startup timeout"));
			}, 10000);

			eventServerProcess?.stdout?.on("data", (data: Buffer) => {
				const output = data.toString();
				if (output.includes("Starting Alpha Event Server")) {
					clearTimeout(timeout);
					resolve();
				}
			});

			eventServerProcess?.stderr?.on("data", (data: Buffer) => {
				const output = data.toString();
				// FastAPI/uvicorn often logs to stderr
				if (
					output.includes("Uvicorn running") ||
					output.includes("Started server")
				) {
					clearTimeout(timeout);
					resolve();
				}
			});

			eventServerProcess?.on("error", (err) => {
				clearTimeout(timeout);
				reject(err);
			});

			eventServerProcess?.on("exit", (code) => {
				if (code !== 0 && code !== null) {
					clearTimeout(timeout);
					reject(new Error(`Event server exited with code ${code}`));
				}
			});
		});

		log(`   Started event server on port ${EVENT_SERVER_PORT}`);
		return `http://localhost:${EVENT_SERVER_PORT}`;
	} catch (error) {
		log(`   ⚠️ Failed to start event server: ${error}`);
		return null;
	}
}

/**
 * Stop the event server if running.
 */
export function stopEventServer(log: (...args: unknown[]) => void): void {
	if (eventServerProcess) {
		log("   Stopping event server...");
		eventServerProcess.kill("SIGTERM");
		eventServerProcess = null;
	}
}

/**
 * Wait for UI to be ready to receive events.
 *
 * Polls the event server's /api/ui-status endpoint to check if UI has
 * connected and sent its ready signal. This prevents events from being
 * emitted before the UI can receive them.
 *
 * @param maxWait - Maximum time to wait in ms (default: 30000)
 * @param pollInterval - How often to poll in ms (default: 500)
 * @param log - Logger function
 * @returns true if UI became ready, false if timeout
 */
export async function waitForUIReady(
	maxWait: number = 30000,
	pollInterval: number = 500,
	log: (...args: unknown[]) => void = console.log,
): Promise<boolean> {
	const startTime = Date.now();
	const statusUrl = `http://localhost:${EVENT_SERVER_PORT}/api/ui-status`;

	log("   ⏳ Waiting for UI to connect...");

	while (Date.now() - startTime < maxWait) {
		try {
			const response = await fetch(statusUrl);
			if (response.ok) {
				const data = (await response.json()) as { ui_ready?: boolean };
				if (data.ui_ready === true) {
					log("   ✅ UI ready, proceeding with database operations");
					return true;
				}
			}
		} catch {
			// Event server not ready yet, continue polling
		}

		await sleep(pollInterval);
	}

	// Timeout reached - proceed anyway (non-blocking)
	log("   ⚠️ UI ready timeout, proceeding without confirmation");
	return false;
}

/**
 * Check if event server is currently running.
 */
export function isEventServerRunning(): boolean {
	return eventServerProcess !== null;
}
