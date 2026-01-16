/**
 * Port Health Check Utilities
 *
 * Provides functions to check if ports are open and wait for services to become available.
 * Used for dev server health checks and sandbox startup validation.
 */

import { DEV_SERVER_PORT } from "../config/index.js";

/**
 * Check if a port is open and accepting connections.
 *
 * @param port - Port number to check
 * @param host - Host to connect to (default: localhost)
 * @param timeoutMs - Timeout for the connection attempt (default: 1000ms)
 * @returns true if port is open, false otherwise
 */
export async function isPortOpen(
	port: number,
	host: string = "localhost",
	timeoutMs: number = 1000,
): Promise<boolean> {
	const { createConnection } = await import("node:net");

	return new Promise((resolve) => {
		const socket = createConnection({ port, host, timeout: timeoutMs });

		socket.on("connect", () => {
			socket.destroy();
			resolve(true);
		});

		socket.on("error", () => {
			socket.destroy();
			resolve(false);
		});

		socket.on("timeout", () => {
			socket.destroy();
			resolve(false);
		});
	});
}

/**
 * Wait for a port to become available.
 *
 * Polls the port at regular intervals until it becomes available or timeout is reached.
 *
 * @param port - Port number to wait for
 * @param timeoutMs - Maximum time to wait (default: 30000ms)
 * @param pollIntervalMs - Interval between checks (default: 1000ms)
 * @param host - Host to connect to (default: localhost)
 * @returns true if port became available, false if timeout
 */
export async function waitForPort(
	port: number,
	timeoutMs: number = 30000,
	pollIntervalMs: number = 1000,
	host: string = "localhost",
): Promise<boolean> {
	const startTime = Date.now();
	const maxAttempts = Math.ceil(timeoutMs / pollIntervalMs);

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const isOpen = await isPortOpen(port, host);
		if (isOpen) {
			return true;
		}

		// Check if we've exceeded the timeout
		if (Date.now() - startTime >= timeoutMs) {
			return false;
		}

		// Wait before next attempt
		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
	}

	return false;
}

/**
 * Wait for the dev server to become available.
 *
 * Convenience wrapper around waitForPort for the standard dev server port.
 *
 * @param timeoutMs - Maximum time to wait (default: 30000ms)
 * @param host - Host to connect to (default: localhost)
 * @returns true if dev server is available, false if timeout
 */
export async function waitForDevServer(
	timeoutMs: number = 30000,
	host: string = "localhost",
): Promise<boolean> {
	return waitForPort(DEV_SERVER_PORT, timeoutMs, 1000, host);
}
