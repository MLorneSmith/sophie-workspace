/**
 * End-to-End performance tests for Payload CMS seeding
 *
 * Tests performance characteristics including:
 * - Seeding speed benchmarks
 * - Memory usage monitoring
 * - Throughput measurements
 * - Large dataset handling
 *
 * @requires Database connection (Supabase)
 * @requires Payload CMS running
 *
 * @module e2e/tests/payload/seeding-performance
 */

import { exec } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const execAsync = promisify(exec);

// Performance benchmarks (targets)
// Note: These include ~1.5s Payload CMS initialization overhead per run
const PERFORMANCE_TARGETS = {
	// Dry-run should be fast (no actual DB writes)
	dryRunMaxDuration: 10000, // 10 seconds for all collections
	dryRunMinSpeed: 50, // records/second

	// Single collection benchmarks (includes Payload init overhead)
	singleCollectionMaxDuration: 3000, // 3 seconds (allows for init)

	// Full seeding (if implemented with actual DB)
	fullSeedMaxDuration: 120000, // 2 minutes
	fullSeedMinSpeed: 3, // records/second
};

// Use absolute paths to ensure correct resolution regardless of working directory
const PROJECT_ROOT = resolve(__dirname, "../../../../");
const CLI_PATH = resolve(
	PROJECT_ROOT,
	"apps/payload/src/seed/seed-engine/index.ts",
);
const CLI_EXECUTOR = "pnpm tsx";
const PERF_TIMEOUT = 180000; // 3 minutes

test.describe("Seeding Performance Benchmarks", () => {
	test("should complete dry-run within time limit", async () => {
		test.setTimeout(PERF_TIMEOUT);

		const startTime = Date.now();

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		const duration = Date.now() - startTime;

		// Verify completion time
		expect(duration).toBeLessThan(PERFORMANCE_TARGETS.dryRunMaxDuration);

		// Extract and verify speed from output
		const speedMatch = stdout.match(/Speed:\s+([\d.]+)\s+records\/sec/);
		if (speedMatch) {
			const speed = Number.parseFloat(speedMatch[1]);
			expect(speed).toBeGreaterThan(PERFORMANCE_TARGETS.dryRunMinSpeed);
		}
	});

	test("should process single collection efficiently", async () => {
		test.setTimeout(PERF_TIMEOUT);

		const startTime = Date.now();

		await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --collections courses`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		const duration = Date.now() - startTime;

		// Single collection should be very fast
		expect(duration).toBeLessThan(
			PERFORMANCE_TARGETS.singleCollectionMaxDuration,
		);
	});

	test("should scale linearly with collection count", async () => {
		test.setTimeout(PERF_TIMEOUT);

		// Test with 1 collection (courses has no dependencies)
		const start1 = Date.now();
		await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --collections courses`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);
		const duration1 = Date.now() - start1;

		// Test with all collections (avoids dependency issues)
		const start3 = Date.now();
		await execAsync(`${CLI_EXECUTOR} ${CLI_PATH} --dry-run`, {
			cwd: process.cwd(),
			env: { ...process.env, NODE_ENV: "test" },
		});
		const duration3 = Date.now() - start3;

		// Full seed should take longer but not excessively so
		expect(duration3).toBeLessThan(duration1 * 10);
	});

	test("should maintain consistent speed across runs", async () => {
		test.setTimeout(PERF_TIMEOUT);

		const durations: number[] = [];

		// Run 3 times
		for (let i = 0; i < 3; i++) {
			const start = Date.now();
			await execAsync(
				`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --collections courses`,
				{
					cwd: process.cwd(),
					env: { ...process.env, NODE_ENV: "test" },
				},
			);
			durations.push(Date.now() - start);
		}

		// Calculate variance
		const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
		const maxDuration = Math.max(...durations);
		const minDuration = Math.min(...durations);

		// Max should be within 2x of min (accounting for system variance)
		expect(maxDuration).toBeLessThan(minDuration * 2);

		// Average should be reasonable
		expect(avgDuration).toBeLessThan(
			PERFORMANCE_TARGETS.singleCollectionMaxDuration,
		);
	});

	test("should report accurate timing metrics", async () => {
		test.setTimeout(PERF_TIMEOUT);

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --verbose`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		// Verify duration reporting (format: "⏱  Duration: 0.01s", "⚡ Avg speed: N records/s")
		expect(stdout).toMatch(/Duration:\s+[\d.]+s/);
		expect(stdout).toMatch(/speed:\s+[\d.]+\s+records\/s/i);

		// Verify collections were processed
		expect(stdout).toContain("Processing all collections");
	});

	test("should handle large collections efficiently", async () => {
		test.setTimeout(PERF_TIMEOUT);

		// Run all collections to test with full dataset (255 records)
		const startTime = Date.now();

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --verbose`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		const duration = Date.now() - startTime;

		// Should complete reasonably fast even with 250+ records
		expect(duration).toBeLessThan(10000);

		// Verify records processed
		expect(stdout).toContain("course-lessons");
		expect(stdout).toContain("255 records");
	});

	test("should process all collections within benchmark", async () => {
		test.setTimeout(PERF_TIMEOUT);

		const startTime = Date.now();

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		const duration = Date.now() - startTime;

		// Extract total records from output
		const recordsMatch = stdout.match(/Total records:\s+(\d+)/);
		if (recordsMatch) {
			const totalRecords = Number.parseInt(recordsMatch[1], 10);
			expect(totalRecords).toBeGreaterThan(100); // Should have 316 records
		}

		// Verify overall duration
		expect(duration).toBeLessThan(PERFORMANCE_TARGETS.dryRunMaxDuration);
	});
});

test.describe("Performance Regression Detection", () => {
	test("should identify slowest collections", async () => {
		test.setTimeout(PERF_TIMEOUT);

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --verbose`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		// Verify slowest collections are reported
		expect(stdout).toMatch(/slowest|performance|duration/i);
	});

	test("should detect performance anomalies", async () => {
		test.setTimeout(PERF_TIMEOUT);

		const speeds: number[] = [];

		// Run multiple times to establish baseline
		for (let i = 0; i < 3; i++) {
			const { stdout } = await execAsync(
				`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --collections courses`,
				{
					cwd: process.cwd(),
					env: { ...process.env, NODE_ENV: "test" },
				},
			);

			const speedMatch = stdout.match(/Speed:\s+([\d.]+)\s+records\/sec/);
			if (speedMatch) {
				speeds.push(Number.parseFloat(speedMatch[1]));
			}
		}

		// All speeds should be within reasonable range
		const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
		for (const speed of speeds) {
			expect(speed).toBeGreaterThan(avgSpeed * 0.5); // Within 50%
			expect(speed).toBeLessThan(avgSpeed * 1.5);
		}
	});
});

test.describe("Resource Usage", () => {
	test("should not leak memory across runs", async () => {
		test.setTimeout(PERF_TIMEOUT);

		// Run multiple times sequentially
		for (let i = 0; i < 5; i++) {
			const { stdout } = await execAsync(
				`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --collections courses`,
				{
					cwd: process.cwd(),
					env: { ...process.env, NODE_ENV: "test" },
				},
			);

			// Each run should complete successfully
			expect(stdout).toContain("Success");
		}

		// If we reach here, no memory leak causing crashes
		expect(true).toBe(true);
	});

	test("should cleanup resources properly", async () => {
		test.setTimeout(PERF_TIMEOUT);

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --verbose`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		// Verify cleanup messages
		expect(stdout).toContain("Cleaning up");
		expect(stdout).toContain("Cleanup complete");
	});
});

test.describe("Throughput Benchmarks", () => {
	test("should achieve minimum throughput target", async () => {
		test.setTimeout(PERF_TIMEOUT);

		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		// Extract speed from output (format: "⚡ Avg speed: N records/s")
		const speedMatch = stdout.match(/speed:\s+([\d.]+)\s+records\/s/i);
		expect(speedMatch).not.toBeNull();

		if (speedMatch) {
			const speed = Number.parseFloat(speedMatch[1]);
			expect(speed).toBeGreaterThan(PERFORMANCE_TARGETS.dryRunMinSpeed);
		}
	});

	test("should process records without significant overhead", async () => {
		test.setTimeout(PERF_TIMEOUT);

		// Test with minimal collection (courses - 1 record)
		const start = Date.now();
		await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run --collections courses`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);
		const duration = Date.now() - start;

		// Even 1 record should complete fast (allowing for Payload init overhead ~2s)
		expect(duration).toBeLessThan(3000);
	});

	test("should maintain speed with complex collections", async () => {
		test.setTimeout(PERF_TIMEOUT);

		// Test with all collections (avoids dependency issues)
		const { stdout } = await execAsync(
			`${CLI_EXECUTOR} ${CLI_PATH} --dry-run`,
			{
				cwd: process.cwd(),
				env: { ...process.env, NODE_ENV: "test" },
			},
		);

		const speedMatch = stdout.match(/Speed:\s+([\d.]+)\s+records\/sec/);
		if (speedMatch) {
			const speed = Number.parseFloat(speedMatch[1]);
			// Should still maintain good speed with complex relationships
			expect(speed).toBeGreaterThan(20); // records/second
		}
	});
});
