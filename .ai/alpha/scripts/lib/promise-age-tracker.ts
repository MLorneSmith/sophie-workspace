/**
 * Promise Age Tracker Module
 *
 * Tracks promise metadata and detects timeout conditions for the work loop.
 * When promises hang indefinitely (PTY timeout, Claude process crash),
 * this module enables detection and recovery.
 *
 * Bug fix #1841: Promise timeout monitor for work loop recovery
 */

import type { Sandbox } from "@e2b/code-interpreter";

import { HEARTBEAT_TIMEOUT_MS, PROMISE_TIMEOUT_MS } from "../config/index.js";
import { getProgressFileAge, readProgressFile } from "./progress-file.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Metadata tracked for each active promise.
 */
export interface PromiseMetadata {
	/** Feature ID assigned to this promise */
	featureId: string;
	/** Sandbox label executing this promise */
	sandboxLabel: string;
	/** Timestamp when promise was created (ms since epoch) */
	createdAt: number;
	/** Last known heartbeat age from progress file (ms) */
	lastHeartbeatAge?: number;
	/** Timestamp of last heartbeat check */
	lastHeartbeatCheckAt?: number;
}

/**
 * Result of stale promise detection.
 */
export interface StalePromiseInfo {
	/** Feature ID that timed out */
	featureId: string;
	/** Sandbox label that was executing */
	sandboxLabel: string;
	/** Age of the promise in milliseconds */
	promiseAgeMs: number;
	/** Age of last heartbeat in milliseconds (null if unavailable) */
	heartbeatAgeMs: number | null;
	/** Reason for timeout */
	reason: "promise_timeout" | "heartbeat_timeout" | "both";
}

// ============================================================================
// PromiseAgeTracker Class
// ============================================================================

/**
 * Tracks promise ages and detects stale (timed out) promises.
 *
 * Usage:
 * 1. Call `track()` when starting a new promise
 * 2. Call `findStalePromises()` periodically to detect timeouts
 * 3. Call `remove()` when a promise completes (success or error)
 *
 * Stale detection uses two signals:
 * - Promise age: How long the promise has been pending
 * - Heartbeat age: How long since the sandbox's progress file was updated
 *
 * A promise is considered stale when:
 * - Promise age exceeds PROMISE_TIMEOUT_MS (default: 10 minutes) AND
 * - Heartbeat age exceeds HEARTBEAT_TIMEOUT_MS (default: 5 minutes)
 */
export class PromiseAgeTracker {
	private promises: Map<string, PromiseMetadata> = new Map();
	private promiseTimeoutMs: number;
	private heartbeatTimeoutMs: number;

	constructor(
		promiseTimeoutMs: number = PROMISE_TIMEOUT_MS,
		heartbeatTimeoutMs: number = HEARTBEAT_TIMEOUT_MS,
	) {
		this.promiseTimeoutMs = promiseTimeoutMs;
		this.heartbeatTimeoutMs = heartbeatTimeoutMs;
	}

	/**
	 * Start tracking a promise.
	 *
	 * @param sandboxLabel - The sandbox label executing this promise
	 * @param featureId - The feature ID being worked on
	 */
	track(sandboxLabel: string, featureId: string): void {
		this.promises.set(sandboxLabel, {
			featureId,
			sandboxLabel,
			createdAt: Date.now(),
		});
	}

	/**
	 * Stop tracking a promise (call when promise resolves or rejects).
	 *
	 * @param sandboxLabel - The sandbox label to remove
	 */
	remove(sandboxLabel: string): void {
		this.promises.delete(sandboxLabel);
	}

	/**
	 * Check if a sandbox is being tracked.
	 *
	 * @param sandboxLabel - The sandbox label to check
	 */
	has(sandboxLabel: string): boolean {
		return this.promises.has(sandboxLabel);
	}

	/**
	 * Get metadata for a tracked promise.
	 *
	 * @param sandboxLabel - The sandbox label to look up
	 */
	get(sandboxLabel: string): PromiseMetadata | undefined {
		return this.promises.get(sandboxLabel);
	}

	/**
	 * Get the number of tracked promises.
	 */
	get size(): number {
		return this.promises.size;
	}

	/**
	 * Get the age of a promise in milliseconds.
	 *
	 * @param sandboxLabel - The sandbox label to check
	 * @returns Age in ms, or null if not tracked
	 */
	getPromiseAge(sandboxLabel: string): number | null {
		const metadata = this.promises.get(sandboxLabel);
		if (!metadata) return null;
		return Date.now() - metadata.createdAt;
	}

	/**
	 * Update the heartbeat age for a tracked promise.
	 * Call this after reading the progress file from a sandbox.
	 *
	 * @param sandboxLabel - The sandbox label
	 * @param heartbeatAgeMs - The age of the heartbeat in milliseconds
	 */
	updateHeartbeatAge(sandboxLabel: string, heartbeatAgeMs: number): void {
		const metadata = this.promises.get(sandboxLabel);
		if (metadata) {
			metadata.lastHeartbeatAge = heartbeatAgeMs;
			metadata.lastHeartbeatCheckAt = Date.now();
		}
	}

	/**
	 * Check if a promise is stale based on age and heartbeat thresholds.
	 *
	 * A promise is stale when BOTH conditions are met:
	 * 1. Promise age > promiseTimeoutMs
	 * 2. Heartbeat age > heartbeatTimeoutMs (or heartbeat unavailable)
	 *
	 * This dual-check prevents false positives on slow-but-healthy features.
	 *
	 * @param sandboxLabel - The sandbox label to check
	 * @returns Stale info if stale, null otherwise
	 */
	isStale(sandboxLabel: string): StalePromiseInfo | null {
		const metadata = this.promises.get(sandboxLabel);
		if (!metadata) return null;

		const promiseAge = Date.now() - metadata.createdAt;
		const isPromiseStale = promiseAge > this.promiseTimeoutMs;

		// If promise isn't old enough, not stale
		if (!isPromiseStale) return null;

		// Check heartbeat age
		const heartbeatAge = metadata.lastHeartbeatAge ?? null;
		const isHeartbeatStale =
			heartbeatAge === null || heartbeatAge > this.heartbeatTimeoutMs;

		// Need both conditions to be considered stale
		if (!isHeartbeatStale) return null;

		// Determine reason
		let reason: StalePromiseInfo["reason"];
		if (heartbeatAge === null) {
			reason = "promise_timeout";
		} else if (
			promiseAge > this.promiseTimeoutMs &&
			heartbeatAge > this.heartbeatTimeoutMs
		) {
			reason = "both";
		} else {
			reason = "heartbeat_timeout";
		}

		return {
			featureId: metadata.featureId,
			sandboxLabel: metadata.sandboxLabel,
			promiseAgeMs: promiseAge,
			heartbeatAgeMs: heartbeatAge,
			reason,
		};
	}

	/**
	 * Find all stale promises across all tracked sandboxes.
	 *
	 * @returns Array of stale promise info
	 */
	findStalePromises(): StalePromiseInfo[] {
		const stale: StalePromiseInfo[] = [];

		for (const sandboxLabel of this.promises.keys()) {
			const staleInfo = this.isStale(sandboxLabel);
			if (staleInfo) {
				stale.push(staleInfo);
			}
		}

		return stale;
	}

	/**
	 * Update heartbeat ages by reading progress files from sandboxes.
	 * This is an async operation that reads from each sandbox.
	 *
	 * @param getSandbox - Function to get sandbox instance by label
	 */
	async updateHeartbeatAges(
		getSandbox: (label: string) => Sandbox | undefined,
	): Promise<void> {
		const labels = Array.from(this.promises.keys());

		for (const label of labels) {
			const sandbox = getSandbox(label);
			if (!sandbox) continue;

			try {
				const result = await readProgressFile(sandbox);
				if (result.success && result.data) {
					const age = getProgressFileAge(result.data);
					if (age !== null) {
						this.updateHeartbeatAge(label, age);
					}
				}
			} catch {
				// Ignore errors - heartbeat will remain unknown (treated as stale)
			}
		}
	}

	/**
	 * Clear all tracked promises.
	 */
	clear(): void {
		this.promises.clear();
	}
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new PromiseAgeTracker instance.
 *
 * @param promiseTimeoutMs - Override default promise timeout
 * @param heartbeatTimeoutMs - Override default heartbeat timeout
 */
export function createPromiseAgeTracker(
	promiseTimeoutMs?: number,
	heartbeatTimeoutMs?: number,
): PromiseAgeTracker {
	return new PromiseAgeTracker(promiseTimeoutMs, heartbeatTimeoutMs);
}
